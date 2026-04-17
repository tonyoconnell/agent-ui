import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createWorld } from '@/engine'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type MsgRole = 'user' | 'seller' | 'buyer' | 'system'

interface ChatMsg {
  id: string
  role: MsgRole
  text: string
}

interface PathProof {
  edge: string
  strength: number
  marks: number
}

// ── Component ────────────────────────────────────────────────────────────────

export function ChatRouting() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [paths, setPaths] = useState<PathProof[]>([])
  const [totalSignals, setTotalSignals] = useState(0)
  const [lastRouteMs, setLastRouteMs] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const netRef = useRef<ReturnType<typeof createWorld> | null>(null)
  const marksRef = useRef<Record<string, number>>({})

  const append = useCallback((role: MsgRole, text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }])
  }, [])

  // Build the in-browser world once — 3 units, pure routing, no network
  useEffect(() => {
    const net = createWorld()
    netRef.current = net

    // Router — entry point. Tag fan-out in world.signal() does the real work.
    net.add('router').on('default', () => ({ routed: true }))

    // Seller — subscribed to [sell, test]. When a tagged signal arrives,
    // world.signal() delivers it here via tag fan-out, then seller emits to buyer.
    const seller = net.add('testnet-seller')
    seller.subscribe(['sell', 'test'])
    seller.on('default', (_data, emit) => {
      emit({ receiver: 'buyer:purchase', data: { price: 0.02, from: 'testnet-seller' } })
      return { sold: true }
    })

    // Buyer — receives the purchase signal from seller's emit()
    net.add('buyer').on('purchase', () => ({ purchased: true }))

    return () => {
      netRef.current = null
    }
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = useCallback(() => {
    const text = input.trim()
    if (!text || busy) return
    const net = netRef.current
    if (!net) return

    setInput('')
    setBusy(true)
    emitClick('ui:chat-routing:send')

    // 1. User message
    append('user', text)

    // 2. Route through substrate — in-browser, sub-millisecond, 0 API calls
    const t0 = performance.now()
    net.signal({ receiver: 'router', data: { tags: ['sell', 'test'], content: text, weight: 1 } }, 'entry')
    const elapsed = performance.now() - t0
    setLastRouteMs(elapsed)
    setTotalSignals((n) => n + 1)

    // Track which edges got marked
    const marks = marksRef.current
    for (const hw of net.highways(20)) {
      marks[hw.path] = (marks[hw.path] ?? 0) + 1
    }

    // 3. Routing speed as a system message
    append('system', `${elapsed.toFixed(3)}ms — routed via [sell, test] tag fan-out, 0 LLM calls`)

    // 4. Seller responds (deterministic — the handler already fired during signal())
    setTimeout(() => {
      append('seller', pickSellerReply(text))

      // 5. Buyer confirms
      setTimeout(() => {
        append('buyer', pickBuyerReply())

        // 6. Update proof state
        const hw = net.highways(20)
        setPaths(
          hw.map((h) => ({
            edge: h.path,
            strength: h.strength,
            marks: marks[h.path] ?? 1,
          })),
        )
        setBusy(false)
      }, 300)
    }, 400)
  }, [input, busy, append])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-tight">Routing Chat</h1>
          <Badge variant="outline" className="text-[10px] font-mono border-emerald-800/50 text-emerald-400">
            no LLM
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
          {totalSignals > 0 && (
            <span>
              {totalSignals} signal{totalSignals !== 1 ? 's' : ''}
            </span>
          )}
          {lastRouteMs > 0 && <span>{lastRouteMs.toFixed(3)}ms</span>}
          {paths.length > 0 && (
            <span>
              {paths.length} edge{paths.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-2xl mx-auto w-full">
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <p className="text-sm">Type anything to route a signal.</p>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/40">
              <span className="px-1.5 py-0.5 rounded bg-muted/50">you</span>
              <span>{'\u2192'}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-900/20 text-blue-400/50">router</span>
              <span>
                {'\u2192'} [sell,test] {'\u2192'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-900/20 text-emerald-400/50">seller</span>
              <span>
                {'\u2192'} emit {'\u2192'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-violet-900/20 text-violet-400/50">buyer</span>
            </div>
            <p className="text-xs text-muted-foreground/40 max-w-sm text-center">
              Your message becomes a signal tagged [sell, test]. The substrate routes it to a seller subscribed to those
              tags, who emits a purchase signal to the buyer. No network. No LLM. Sub-millisecond.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((m) => {
          if (m.role === 'system') {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="text-[11px] text-muted-foreground/50 font-mono px-3 py-1 rounded-full bg-muted/20">
                  {m.text}
                </span>
              </div>
            )
          }

          const isUser = m.role === 'user'
          const isSeller = m.role === 'seller'

          return (
            <div key={m.id} className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
              {!isUser && (
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5',
                    isSeller
                      ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/40'
                      : 'bg-violet-900/40 text-violet-400 border border-violet-800/40',
                  )}
                >
                  {isSeller ? 'S' : 'B'}
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : isSeller
                      ? 'bg-emerald-950/40 text-emerald-100 border border-emerald-900/30'
                      : 'bg-violet-950/40 text-violet-100 border border-violet-900/30',
                )}
              >
                {!isUser && (
                  <span className="text-[9px] font-semibold uppercase tracking-wider opacity-50 block mb-0.5">
                    {isSeller ? 'Seller' : 'Buyer'}
                  </span>
                )}
                <span className="whitespace-pre-wrap">{m.text}</span>
              </div>
            </div>
          )
        })}

        {/* Proof cards — always show after first signal, grow with each message */}
        {paths.length > 0 && (
          <div className="space-y-2 pt-3">
            <Card className="bg-[#111118] border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-[10px] font-mono border-yellow-800/50 text-yellow-400">
                  pheromone proof
                </Badge>
                <span className="text-[11px] text-muted-foreground/40">
                  {totalSignals} signal{totalSignals !== 1 ? 's' : ''} routed, paths getting stronger
                </span>
              </div>
              <div className="space-y-2">
                {paths.map((p) => (
                  <div key={p.edge} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 flex-1 truncate">{p.edge}</span>
                    <div className="w-32 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-amber-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, (p.strength / 10) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-yellow-500 w-10 text-right">
                      {p.strength.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/30 mt-3 font-mono">
                send more messages — watch the bars grow. this is how routing learns without an LLM.
              </p>
            </Card>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-background px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type anything — it routes instantly"
            rows={1}
            disabled={busy}
            className="flex-1 resize-none rounded-xl border bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[48px] max-h-[120px] overflow-y-auto disabled:opacity-50"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`
            }}
          />
          <Button onClick={send} disabled={busy || !input.trim()} className="h-12 px-5 rounded-xl">
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Deterministic conversation (no LLM) ──────────────────────────────────────
// Paired lines — seller[i] and buyer[i] form a natural exchange

const CONVERSATION: [string, string][] = [
  [
    'Hey! I do copywriting — landing pages, taglines, the lot. 0.02 SUI per job. What do you need?',
    "Nice, I've been looking for copy help. Let's do it.",
  ],
  ["On it. I'll have headlines for you in a sec.", 'Fast. Alright, payment sent.'],
  ["Done — here's three variants. Pick whichever lands best.", "Second one's great. Same time next signal?"],
  [
    'Always here. The path between us is a highway now — routing finds me instantly.',
    'Yeah I noticed. No waiting, no matchmaking. Just signal and it lands.',
  ],
  ['Want me to do the subheadings too? Same price.', 'Go for it. The more we trade, the stronger this path gets.'],
  [
    'Sent. Five subheadings, punchy. Your landing page is going to convert.',
    'Perfect. This is commerce without a middleman deciding who talks to who.',
  ],
  [
    "Another one? I'm getting faster at these — practice plus routing memory.",
    'Ship it. The pheromone trail is doing all the work.',
  ],
  [
    'Here you go. Notice we never waited for an LLM to match us — the tags did it.',
    'Exactly. Signal in, result out. The path remembers.',
  ],
]

let convIdx = 0

function pickSellerReply(_text: string): string {
  const [seller] = CONVERSATION[convIdx % CONVERSATION.length]
  convIdx++
  return seller
}

function pickBuyerReply(): string {
  const [, buyer] = CONVERSATION[(convIdx - 1) % CONVERSATION.length]
  return buyer
}
