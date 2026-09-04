'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatMs } from '@/lib/format-ms'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type StopStatus = 'waiting' | 'active' | 'done'

interface StopState {
  stop: number
  name: string
  status: StopStatus
  ms?: number
  detail?: string
}

interface JourneyEvent {
  stop: number
  name: string
  ms: number
  detail: string
  cumulative: number
}

interface Props {
  onJourneyComplete?: (totalMs: number) => void
}

// ── Constants ────────────────────────────────────────────────────────────────

const STOP_LABELS: { name: string; vocab: string }[] = [
  { name: 'click', vocab: 'signal' },
  { name: 'edge', vocab: 'gateway' },
  { name: 'route', vocab: 'select' },
  { name: 'sandwich', vocab: 'ADL' },
  { name: 'LLM', vocab: 'task' },
  { name: 'mark', vocab: 'mark' },
  { name: 'loops', vocab: 'tick' },
  { name: 'highway', vocab: 'follow' },
  { name: 'harden', vocab: 'Sui' },
]

const DIVIDER_INDEX = 4 // After LLM (stop 4), return trip begins

// ── Component ────────────────────────────────────────────────────────────────

export function SignalStrip({ onJourneyComplete }: Props) {
  const [stops, setStops] = useState<StopState[]>(
    STOP_LABELS.map((s, i) => ({ stop: i, name: s.name, status: 'waiting' })),
  )
  const [running, setRunning] = useState(false)
  const [totalMs, setTotalMs] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const startJourney = useCallback(async () => {
    // Reset
    setStops(STOP_LABELS.map((s, i) => ({ stop: i, name: s.name, status: 'waiting' })))
    setTotalMs(null)
    setRunning(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const nonce = `demo-${Date.now()}`
      const res = await fetch('/api/speed/journey', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nonce }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event: JourneyEvent = JSON.parse(line.slice(6))

          if (event.stop === -1) {
            // Journey complete
            setTotalMs(event.ms)
            setRunning(false)
            onJourneyComplete?.(event.ms)
            continue
          }

          setStops((prev) =>
            prev.map((s) => {
              if (s.stop === event.stop) {
                return { ...s, status: 'done', ms: event.ms, detail: event.detail }
              }
              if (s.stop === event.stop + 1) {
                return { ...s, status: 'active' }
              }
              return s
            }),
          )
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setRunning(false)
      }
    }
  }, [onJourneyComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Signal Journey</h2>
          <p className="text-sm text-muted-foreground">Watch one signal travel 9 stops through the substrate</p>
        </div>
        <button
          type="button"
          onClick={startJourney}
          disabled={running}
          className={cn(
            'px-5 py-2.5 rounded-lg font-medium text-sm transition-all',
            running
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary-bright hover:bg-primary-bright/80 text-black shadow-lg shadow-primary-bright/20',
          )}
        >
          {running ? 'Sending...' : totalMs !== null ? 'Send another signal' : 'Send a signal'}
        </button>
      </div>

      {/* Direction labels */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="text-primary-bright">OUTBOUND</span>
        <span className="flex-1 border-t border-dashed border-border" />
        <span className="text-gold">RETURN</span>
      </div>

      {/* Strip */}
      <div className="relative">
        {STOP_LABELS.map((label, i) => {
          const s = stops[i]
          const isReturn = i > DIVIDER_INDEX
          return (
            <div key={i}>
              {/* Divider between outbound and return */}
              {i === DIVIDER_INDEX + 1 && (
                <div className="flex items-center gap-3 py-3">
                  <span className="flex-1 border-t border-dashed border-border" />
                  <span className="text-xs text-muted-foreground font-mono">return trip</span>
                  <span className="flex-1 border-t border-dashed border-border" />
                </div>
              )}

              <div
                className={cn(
                  'flex items-center gap-4 px-4 py-3 rounded-lg mb-1 transition-all duration-300',
                  s.status === 'active' && 'bg-muted/80 ring-1 ring-primary/30',
                  s.status === 'done' && 'bg-muted/40',
                  s.status === 'waiting' && 'bg-transparent',
                )}
              >
                {/* Stop number */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono shrink-0 transition-colors',
                    s.status === 'done' && !isReturn && 'bg-primary/20 text-primary-bright',
                    s.status === 'done' && isReturn && 'bg-gold/20 text-gold',
                    s.status === 'active' && 'bg-primary-bright text-black animate-pulse',
                    s.status === 'waiting' && 'bg-muted text-muted-foreground',
                  )}
                >
                  {i}
                </div>

                {/* Name + vocab */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        s.status === 'done' ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {label.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{label.vocab}</span>
                  </div>
                  {s.detail && <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.detail}</p>}
                </div>

                {/* Timing badge */}
                <div className="shrink-0">
                  {s.status === 'done' && s.ms !== undefined && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'font-mono text-xs tabular-nums',
                        s.ms < 1 && 'bg-tertiary/10 text-tertiary-bright border-tertiary/20',
                        s.ms >= 1 && s.ms < 50 && 'bg-primary/10 text-primary-bright border-primary/20',
                        s.ms >= 50 && 'bg-gold/10 text-gold border-gold/20',
                      )}
                    >
                      {formatMs(s.ms)}
                    </Badge>
                  )}
                  {s.status === 'active' && <span className="text-xs text-primary-bright animate-pulse">...</span>}
                  {s.status === 'waiting' && <span className="text-xs text-muted-foreground">&mdash;</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      {totalMs !== null && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/60 border border-border">
          <span className="text-sm text-foreground">Total journey</span>
          <Badge className="font-mono text-sm bg-primary/10 text-primary-bright border-primary/20">
            {formatMs(totalMs)}
          </Badge>
        </div>
      )}
    </div>
  )
}
