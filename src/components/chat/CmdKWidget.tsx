/**
 * CmdKWidget — ⌘K / Ctrl+K overlay widget.
 *
 * Listens for Cmd+K (Mac) or Ctrl+K (Windows/Linux), shows a centred modal
 * with a mini chat input that POSTs to /api/chat/stream. Press Escape to close.
 *
 * Usage: mount once near the root of your app (e.g. in Layout.astro):
 *   <CmdKWidget client:load />
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ── Session helper ─────────────────────────────────────────────────────────────

const WIDGET_SID_KEY = 'one-cmdk-sid'

function widgetSid(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(WIDGET_SID_KEY)
  if (existing) return existing
  const next = crypto.randomUUID()
  localStorage.setItem(WIDGET_SID_KEY, next)
  return next
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface WidgetMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  error?: string
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CmdKWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<WidgetMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // ── Keyboard listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey
      if (isMeta && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => {
          if (!prev) emitClick('ui:chat:cmdK')
          return !prev
        })
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // ── Patch helper ─────────────────────────────────────────────────────────────
  const patchMessage = useCallback((id: string, patch: Partial<WidgetMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  // ── Stream handler ────────────────────────────────────────────────────────────
  const streamResponse = useCallback(
    async (text: string, assistantId: string) => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sid: widgetSid(),
            message: text,
          }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

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
              if (event.type === 'cursor') continue // skip cursor sidecars
              if (event.type === 'error') {
                patchMessage(assistantId, { error: String(event.error ?? 'error'), streaming: false })
                continue
              }
              const textContent =
                typeof event === 'string' ? event : typeof event.content === 'string' ? event.content : null
              if (textContent !== null) {
                accumulated += textContent
                patchMessage(assistantId, { content: accumulated })
              }
            } catch {
              // Non-JSON text delta from ai-sdk
              if (raw && !raw.startsWith('{')) {
                accumulated += raw
                patchMessage(assistantId, { content: accumulated })
              }
            }
          }
        }

        patchMessage(assistantId, { streaming: false })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        patchMessage(assistantId, {
          error: (err as Error).message ?? 'Request failed',
          streaming: false,
        })
      } finally {
        abortRef.current = null
        setStreaming(false)
      }
    },
    [patchMessage],
  )

  // ── Send ──────────────────────────────────────────────────────────────────────
  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming) return

      emitClick('ui:chat:send', { source: 'cmdK', length: trimmed.length })

      const userId = crypto.randomUUID()
      const assistantId = crypto.randomUUID()
      const now = Date.now()

      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', content: trimmed, timestamp: now },
        { id: assistantId, role: 'assistant', content: '', timestamp: now + 1, streaming: true },
      ])
      setInput('')
      setStreaming(true)

      void streamResponse(trimmed, assistantId)
    },
    [streaming, streamResponse],
  )

  // ── Stop ──────────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }, [])

  if (!open) return null

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) setOpen(false)
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Quick chat"
    >
      {/* Modal */}
      <div
        className={cn(
          'relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl',
          'max-h-[70vh]',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Quick Chat</span>
          <div className="flex items-center gap-2">
            {streaming && (
              <Button size="sm" variant="ghost" onClick={stop} className="h-6 text-xs">
                Stop
              </Button>
            )}
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              Esc
            </button>
          </div>
        </div>

        {/* Messages (scrollable, only if there are messages) */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-3 px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-6 whitespace-pre-wrap',
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                      m.error && 'border border-destructive/50 text-destructive',
                    )}
                  >
                    {m.error ? (
                      <span>{m.error}</span>
                    ) : (
                      <>
                        {m.content}
                        {m.streaming && (
                          <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-current align-middle opacity-70" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          className={cn('p-3', messages.length === 0 ? '' : 'border-t border-border')}
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Ask anything…"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              disabled={streaming}
              aria-label="Chat input"
            />
            <Button
              type="submit"
              disabled={!input.trim() || streaming}
              className="absolute right-1.5 h-7 w-8 rounded-lg p-0"
              aria-label="Send"
            >
              {streaming ? '…' : '⏎'}
            </Button>
          </div>
          <div className="mt-1.5 text-center text-[10px] text-muted-foreground">⌘K to toggle · Esc to close</div>
        </form>
      </div>
    </div>
  )
}
