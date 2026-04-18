import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type Outcome = 'result' | 'timeout' | 'dissolved' | 'failure'

export interface Message {
  id: string
  role: 'chairman' | 'assistant'
  content: string
  chain?: string[]
  latencyMs?: { classify: number; route: number; total: number }
  outcome?: Outcome
  timestamp: number
  error?: string
  streaming?: boolean
}

export interface ChairmanChatProps {
  initialMessages?: Message[]
  userUid?: string
  endpoint?: string
  className?: string
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SESSION_KEY = 'chairman-chat-session'
const ANON_KEY = 'chairman-chat-anon-id'
const DEFAULT_ENDPOINT = '/api/chat-chairman'

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Persistent session id for this browser. */
function loadSessionId(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const next = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, next)
  return next
}

function loadAnonId(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(ANON_KEY)
  if (existing) return existing
  const next = `anon-${crypto.randomUUID().slice(0, 8)}`
  localStorage.setItem(ANON_KEY, next)
  return next
}

/** Parse a single SSE chunk of form `event: X\ndata: Y`. */
function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block.split('\n')
  let event = 'message'
  const dataLines: string[] = []
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0) return null
  return { event, data: dataLines.join('\n') }
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface BreadcrumbProps {
  chain: string[]
}

function BreadcrumbPill({ chain }: BreadcrumbProps) {
  if (!chain.length) return null
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
      {chain.map((hop, i) => {
        const isLast = i === chain.length - 1
        return (
          <span key={`${hop}-${i}`} className="inline-flex items-center gap-1">
            <span className={cn(isLast && 'font-semibold text-foreground')}>{hop}</span>
            {!isLast && <span className="text-muted-foreground/60">→</span>}
          </span>
        )
      })}
    </div>
  )
}

interface LatencyLineProps {
  latency: { classify: number; route: number; total: number }
}

function LatencyLine({ latency }: LatencyLineProps) {
  const llm = Math.max(0, latency.total - latency.classify - latency.route)
  return (
    <div className="text-[11px] text-muted-foreground">
      {latency.total}ms (classify {latency.classify}ms, route {latency.route}ms, llm {llm}ms)
    </div>
  )
}

interface FeedbackRowProps {
  messageId: string
  chain: string[]
  onFeedback: (messageId: string, outcome: Outcome) => void
}

function FeedbackRow({ messageId, chain, onFeedback }: FeedbackRowProps) {
  const payload = { messageId, chain }
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="rounded-md px-1.5 py-0.5 text-xs hover:bg-muted"
        aria-label="Mark as good — strengthens path"
        onClick={() => {
          emitClick('ui:chairman:mark', payload)
          onFeedback(messageId, 'result')
        }}
      >
        👍
      </button>
      <button
        type="button"
        className="rounded-md px-1.5 py-0.5 text-xs hover:bg-muted"
        aria-label="Mark as bad — weakens path"
        onClick={() => {
          emitClick('ui:chairman:warn', payload)
          onFeedback(messageId, 'failure')
        }}
      >
        👎
      </button>
      <button
        type="button"
        className="rounded-md px-1.5 py-0.5 text-xs hover:bg-muted"
        aria-label="Too slow — neutral outcome"
        onClick={() => {
          emitClick('ui:chairman:timeout', payload)
          onFeedback(messageId, 'timeout')
        }}
      >
        🐢
      </button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function ChairmanChat({
  initialMessages = [],
  userUid,
  endpoint = DEFAULT_ENDPOINT,
  className,
}: ChairmanChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [uid, setUid] = useState(userUid ?? '')
  const [isPending, startTransition] = useTransition()
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Hydrate session + uid after mount (avoids SSR divergence)
  useEffect(() => {
    setSessionId(loadSessionId())
    if (!userUid) setUid(loadAnonId())
    else setUid(userUid)
  }, [userUid])

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // -----------------------------------------------------------------------
  // Patch helper — mutate one message in-place
  // -----------------------------------------------------------------------
  const patchMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  // -----------------------------------------------------------------------
  // Stream handler — fetch + ReadableStream parser for SSE
  // -----------------------------------------------------------------------
  const streamResponse = useCallback(
    async (content: string, assistantId: string, currentSessionId: string) => {
      const controller = new AbortController()
      abortRef.current = controller
      const t0 = performance.now()

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, sessionId: currentSessionId, tags: ['ui', 'chairman'] }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error(
            res.status === 404
              ? 'Endpoint not ready — /api/chat-chairman missing'
              : `HTTP ${res.status} ${res.statusText}`,
          )
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulated = ''
        let classifyMs = 0
        let routeMs = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          // SSE events are separated by a blank line
          const blocks = buffer.split('\n\n')
          buffer = blocks.pop() ?? ''
          for (const raw of blocks) {
            const block = raw.trim()
            if (!block) continue
            const parsed = parseSseBlock(block)
            if (!parsed) continue
            let data: Record<string, unknown>
            try {
              data = JSON.parse(parsed.data)
            } catch {
              continue
            }

            if (parsed.event === 'breadcrumb') {
              const c = data.chain
              const chainArr = Array.isArray(c) ? (c as string[]) : []
              const lat = (data.latencyMs ?? {}) as { classify?: number; route?: number }
              classifyMs = lat.classify ?? 0
              routeMs = lat.route ?? 0
              patchMessage(assistantId, { chain: chainArr })
            } else if (parsed.event === 'delta') {
              const text = typeof data.text === 'string' ? data.text : ''
              accumulated += text
              patchMessage(assistantId, { content: accumulated })
            } else if (parsed.event === 'done') {
              const totalMs = typeof data.totalMs === 'number' ? data.totalMs : Math.round(performance.now() - t0)
              const outcome = (data.outcome as Outcome) ?? 'result'
              patchMessage(assistantId, {
                outcome,
                latencyMs: { classify: classifyMs, route: routeMs, total: totalMs },
                streaming: false,
              })
            } else if (parsed.event === 'error') {
              const msg = typeof data.message === 'string' ? data.message : 'Unknown error'
              patchMessage(assistantId, { error: msg, streaming: false })
            }
          }
        }

        // If the stream closed without a 'done' event, stamp a fallback
        patchMessage(assistantId, { streaming: false })
      } catch (err) {
        const msg = (err as Error).message || 'Request failed'
        patchMessage(assistantId, {
          error: msg,
          content: accumulatedFallback(msg),
          streaming: false,
          outcome: 'failure',
        })
      } finally {
        abortRef.current = null
        setStreaming(false)
      }
    },
    [endpoint, patchMessage],
  )

  // -----------------------------------------------------------------------
  // Send — the primary action
  // -----------------------------------------------------------------------
  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming || !sessionId) return

      const chairmanId = crypto.randomUUID()
      const assistantId = crypto.randomUUID()
      const now = Date.now()

      emitClick('ui:chairman:send', {
        sessionId,
        uid,
        contentLength: trimmed.length,
      })

      setMessages((prev) => [
        ...prev,
        { id: chairmanId, role: 'chairman', content: trimmed, timestamp: now },
        { id: assistantId, role: 'assistant', content: '', timestamp: now + 1, streaming: true },
      ])
      setInput('')
      setStreaming(true)

      if (taRef.current) {
        taRef.current.style.height = 'auto'
        taRef.current.focus()
      }

      startTransition(() => {
        void streamResponse(trimmed, assistantId, sessionId)
      })
    },
    [sessionId, uid, streaming, streamResponse],
  )

  // -----------------------------------------------------------------------
  // Retry — re-send the last chairman message
  // -----------------------------------------------------------------------
  const retry = useCallback(
    (messageId: string) => {
      emitClick('ui:chairman:retry', { messageId })
      // Find most recent chairman message to resend
      const lastChairman = [...messages].reverse().find((m) => m.role === 'chairman')
      if (!lastChairman) return
      send(lastChairman.content)
    },
    [messages, send],
  )

  // -----------------------------------------------------------------------
  // Feedback — locally store outcome for UI affordance
  // emitClick already fires above; this just reflects in the message state.
  // -----------------------------------------------------------------------
  const handleFeedback = useCallback(
    (messageId: string, outcome: Outcome) => {
      patchMessage(messageId, { outcome })
    },
    [patchMessage],
  )

  // -----------------------------------------------------------------------
  // Stop streaming
  // -----------------------------------------------------------------------
  const stop = useCallback(() => {
    emitClick('ui:chairman:stop', { sessionId })
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }, [sessionId])

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <Card className={cn('flex h-full min-h-[600px] flex-col overflow-hidden border-border bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Chairman</span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            role=chairman
          </Badge>
        </div>
        {streaming && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              stop()
            }}
            className="h-7 text-xs"
          >
            Stop
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Ask your CEO anything. They'll route it through the team.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'chairman' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn('flex max-w-[85%] flex-col gap-1.5', m.role === 'chairman' ? 'items-end' : 'items-start')}
              >
                {m.role === 'assistant' && m.chain && m.chain.length > 0 && <BreadcrumbPill chain={m.chain} />}
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-6 whitespace-pre-wrap',
                    m.role === 'chairman' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                    m.error && 'border border-destructive/50 bg-destructive/10 text-destructive-foreground',
                  )}
                >
                  {m.error ? <span className="text-destructive">{m.error}</span> : m.content || (m.streaming ? '' : '')}
                  {m.streaming && (
                    <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle opacity-70" />
                  )}
                </div>
                {m.role === 'assistant' && !m.streaming && (
                  <div className="flex items-center gap-3 pl-1">
                    {m.latencyMs && <LatencyLine latency={m.latencyMs} />}
                    {m.chain && m.chain.length > 0 && (
                      <FeedbackRow messageId={m.id} chain={m.chain} onFeedback={handleFeedback} />
                    )}
                    {m.error && (
                      <button
                        type="button"
                        className="text-[11px] text-muted-foreground underline hover:text-foreground"
                        onClick={() => retry(m.id)}
                      >
                        retry
                      </button>
                    )}
                    {m.outcome && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.outcome}</span>
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
            placeholder="Ask the CEO…"
            className="w-full resize-none rounded-2xl border border-border bg-card py-3 pl-4 pr-14 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-ring/50"
            disabled={streaming || !sessionId}
          />
          <Button
            type="submit"
            disabled={!input.trim() || streaming || !sessionId}
            className="absolute bottom-1.5 right-1.5 h-9 w-10 rounded-xl p-0"
            aria-label="Send message"
          >
            {streaming || isPending ? '…' : '⏎'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/** Produce a user-visible fallback string when the stream dies with partial content. */
function accumulatedFallback(err: string): string {
  return `Error: ${err}`
}
