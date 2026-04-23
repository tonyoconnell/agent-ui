/**
 * ChatIsland — full-page chat UI backed by POST /api/chat/stream.
 *
 * Contract:
 *   - Request:  { sid, cursor?, message }
 *   - Response: SSE stream (ai-sdk text stream) + cursor sidecar events
 *   - Cursor persisted to IndexedDB via src/lib/chat/cursor.ts helpers
 *   - Rich messages (type === "rich") render payment-card / agent-card variants
 */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { emitClick } from '@/lib/ui-signal'
import { loadCursor, storeCursor } from '@/lib/chat/cursor'
import { cn } from '@/lib/utils'
import { ListingCardComponent } from '@/components/chat/arcs/ListingCardComponent'
import type { ListingCard } from '@/interfaces/rich-message/listing-card'

// ── Types ─────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant'

interface RichPayload {
  richType: 'payment-card' | 'agent-card' | 'listing-card' | string
  richPayload: Record<string, unknown>
}

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  type?: 'text' | 'rich'
  rich?: RichPayload
  streaming?: boolean
  error?: string
  cursor?: string
  timestamp: number
}

// ── Session helpers ────────────────────────────────────────────────────────────

const SID_KEY = 'one-chat-sid'

function loadSid(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(SID_KEY)
  if (existing) return existing
  const next = crypto.randomUUID()
  localStorage.setItem(SID_KEY, next)
  return next
}

// ── Rich message renderers ─────────────────────────────────────────────────────

function PaymentCard({ payload }: { payload: Record<string, unknown> }) {
  return (
    <Card className="border-border bg-card p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Payment
      </div>
      <div className="space-y-1 text-sm">
        {Boolean(payload.receiver) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="font-mono text-xs text-foreground">{String(payload.receiver)}</span>
          </div>
        )}
        {payload.amount !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold text-foreground">
              {String(payload.amount)} {String(payload.currency ?? 'SUI')}
            </span>
          </div>
        )}
        {Boolean(payload.action) && (
          <div className="mt-2 text-center">
            <Badge variant="outline" className="text-xs uppercase">
              {String(payload.action)}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  )
}

function AgentCard({ payload }: { payload: Record<string, unknown> }) {
  return (
    <Card className="border-border bg-card p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Agent
      </div>
      <div className="space-y-1 text-sm">
        {Boolean(payload.name) && (
          <div className="font-semibold text-foreground">{String(payload.name)}</div>
        )}
        {Boolean(payload.uid) && (
          <div className="font-mono text-xs text-muted-foreground">{String(payload.uid)}</div>
        )}
        {Array.isArray(payload.tags) && payload.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {(payload.tags as string[]).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function RichMessage({ rich }: { rich: RichPayload }) {
  if (rich.richType === 'payment-card') return <PaymentCard payload={rich.richPayload} />
  if (rich.richType === 'agent-card') return <AgentCard payload={rich.richPayload} />
  if (rich.richType === 'listing-card') {
    return (
      <ListingCardComponent
        payload={rich.richPayload as unknown as ListingCard}
        onBuy={(skillId) => {
          window.location.href = `/pay/${encodeURIComponent(skillId)}`
        }}
      />
    )
  }
  // Fallback: render as JSON
  return (
    <Card className="border-border bg-card p-3">
      <pre className="overflow-x-auto text-xs text-muted-foreground">
        {JSON.stringify(rich.richPayload, null, 2)}
      </pre>
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ChatIslandProps {
  className?: string
}

export function ChatIsland({ className }: ChatIslandProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sid, setSid] = useState('')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [streaming, setStreaming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Hydrate sid + cursor after mount (avoids SSR divergence)
  useEffect(() => {
    const s = loadSid()
    setSid(s)
    loadCursor(s)
      .then((c) => {
        if (c) setCursor(c)
      })
      .catch(() => {})
  }, [])

  // Auto-scroll whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Patch a message in-place by id
  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  // ── Stream handler ─────────────────────────────────────────────────────────
  const streamResponse = useCallback(
    async (text: string, assistantId: string, currentSid: string, currentCursor?: string) => {
      const controller = new AbortController()
      abortRef.current = controller
      let accumulated = ''

      try {
        const res = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sid: currentSid,
            cursor: currentCursor,
            message: text,
          }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let latestCursor: string | undefined

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw || raw === '[DONE]') continue

            try {
              const event = JSON.parse(raw) as Record<string, unknown>

              if (event.type === 'cursor') {
                // Cursor sidecar — update and persist
                const c = String(event.cursor ?? '')
                if (c) {
                  latestCursor = c
                  setCursor(c)
                  void storeCursor(currentSid, c).catch(() => {})
                  patchMessage(assistantId, { cursor: c })
                }
              } else if (event.type === 'error') {
                patchMessage(assistantId, {
                  error: String(event.error ?? 'Stream error'),
                  streaming: false,
                })
              } else if (typeof event.type === 'string' && event.type === 'rich') {
                // Rich message chunk
                patchMessage(assistantId, {
                  type: 'rich',
                  rich: {
                    richType: String(event.richType ?? ''),
                    richPayload: (event.richPayload ?? {}) as Record<string, unknown>,
                  },
                  streaming: false,
                })
              } else {
                // Plain text chunk — ai-sdk emits lines like: hello (no "data.type")
                // or as a string directly
                const textContent =
                  typeof event === 'string'
                    ? event
                    : typeof event.content === 'string'
                      ? event.content
                      : null

                if (textContent !== null) {
                  accumulated += textContent
                  patchMessage(assistantId, { content: accumulated })
                }
              }
            } catch {
              // Non-JSON line from ai-sdk stream (e.g. plain text delta) — treat as text
              // The ai-sdk toTextStreamResponse emits raw text, not JSON-wrapped
              if (raw && !raw.startsWith('{')) {
                accumulated += raw
                patchMessage(assistantId, { content: accumulated })
              }
            }
          }
        }

        patchMessage(assistantId, { streaming: false })

        if (latestCursor) {
          setCursor(latestCursor)
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const msg = (err as Error).message || 'Request failed'
        patchMessage(assistantId, {
          error: msg,
          content: accumulated || `Error: ${msg}`,
          streaming: false,
        })
      } finally {
        abortRef.current = null
        setStreaming(false)
      }
    },
    [patchMessage],
  )

  // ── Send ───────────────────────────────────────────────────────────────────
  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming || !sid) return

      emitClick('ui:chat:send', { sid, length: trimmed.length })

      const userId = crypto.randomUUID()
      const assistantId = crypto.randomUUID()
      const now = Date.now()

      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', content: trimmed, type: 'text', timestamp: now },
        { id: assistantId, role: 'assistant', content: '', type: 'text', timestamp: now + 1, streaming: true },
      ])
      setInput('')
      setStreaming(true)

      if (taRef.current) {
        taRef.current.style.height = 'auto'
        taRef.current.focus()
      }

      startTransition(() => {
        void streamResponse(trimmed, assistantId, sid, cursor)
      })
    },
    [sid, cursor, streaming, streamResponse],
  )

  // ── Stop ───────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    emitClick('ui:chat:stop', { sid })
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }, [sid])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Chat</span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            ONE
          </Badge>
        </div>
        {streaming && (
          <Button size="sm" variant="ghost" onClick={stop} className="h-7 text-xs">
            Stop
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Ask anything. Signals, agents, wallets — the substrate knows.
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'flex max-w-[85%] flex-col gap-1.5',
                  m.role === 'user' ? 'items-end' : 'items-start',
                )}
              >
                {m.type === 'rich' && m.rich ? (
                  <RichMessage rich={m.rich} />
                ) : (
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm leading-6 whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                      m.error && 'border border-destructive/50 bg-destructive/10 text-destructive',
                    )}
                  >
                    {m.error ? (
                      <span className="text-destructive">{m.error}</span>
                    ) : (
                      <>
                        {m.content}
                        {m.streaming && (
                          <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle opacity-70" />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <form
        className="border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <div className="relative mx-auto flex w-full max-w-2xl items-end">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 160)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            rows={1}
            placeholder="Ask the ONE substrate…"
            className="w-full resize-none rounded-2xl border border-border bg-card py-3 pl-4 pr-14 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-ring/50"
            disabled={streaming || !sid}
          />
          <Button
            type="submit"
            disabled={!input.trim() || streaming || !sid}
            className="absolute bottom-1.5 right-1.5 h-9 w-10 rounded-xl p-0"
            aria-label="Send message"
          >
            {streaming || isPending ? '…' : '⏎'}
          </Button>
        </div>
      </form>
    </div>
  )
}
