/**
 * ACTIVITY TICKER — Horizontal scrolling signal feed
 *
 * Displays recent signals at the bottom of the canvas
 * Format: from → to · skill · outcome · ±$revenue · timestamp
 *
 * Features:
 * - Max 10 visible rows
 * - New rows prepend from left
 * - Old rows push off right
 * - Click to focus source unit
 * - Colour coding: green/red/grey by outcome
 * - Revenue indicator: +/- with icon
 */

import { useEffect, useRef, useState } from 'react'
import { useSignalStream, type Signal } from '@/lib/streamSignals'
import { useSkin } from '@/contexts/SkinContext'
import { cn } from '@/lib/utils'

interface ActivityTickerProps {
  onFocusUnit?: (id: string) => void
  maxVisible?: number
}

const getOutcomeColor = (outcome: string, colors: Record<string, string>) => {
  switch (outcome) {
    case 'success':
      return colors.success
    case 'failure':
      return colors.warning
    case 'timeout':
    case 'dissolved':
      return colors.muted
    default:
      return colors.secondary
  }
}

const getOutcomeIcon = (outcome: string) => {
  switch (outcome) {
    case 'success':
      return '✓'
    case 'failure':
      return '✗'
    case 'timeout':
    case 'dissolved':
      return '⊘'
    default:
      return '•'
  }
}

export function ActivityTicker({ onFocusUnit, maxVisible = 10 }: ActivityTickerProps) {
  const { skin } = useSkin()
  const { subscribe } = useSignalStream()
  const [signals, setSignals] = useState<Signal[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const signalsRef = useRef<Signal[]>([])

  // Subscribe to signal stream
  useEffect(() => {
    const unsubscribe = subscribe((signal) => {
      signalsRef.current = [signal, ...signalsRef.current].slice(0, maxVisible * 2)
      setSignals([...signalsRef.current])
    })

    return unsubscribe
  }, [subscribe, maxVisible])

  // Keep only visible signals
  const visibleSignals = signals.slice(0, maxVisible)

  if (visibleSignals.length === 0) {
    return (
      <div
        className="px-4 py-3 border-t flex items-center justify-between text-sm"
        style={{
          backgroundColor: skin.colors.surface,
          borderColor: skin.colors.muted + '20',
          color: skin.colors.muted,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
          <span>Waiting for signals...</span>
        </div>
        <span className="text-xs" style={{ color: skin.colors.muted + '60' }}>
          Real-time feed
        </span>
      </div>
    )
  }

  return (
    <div
      className="px-4 py-3 border-t overflow-x-auto"
      style={{
        backgroundColor: skin.colors.surface,
        borderColor: skin.colors.muted + '20',
      }}
      ref={scrollContainerRef}
    >
      <div className="flex gap-2 min-w-min">
        {visibleSignals.map((signal) => {
          const outcomeColor = getOutcomeColor(signal.outcome, skin.colors)
          const outcomeIcon = getOutcomeIcon(signal.outcome)
          const isRevenue = signal.revenue > 0
          const revenueColor = isRevenue ? skin.colors.success : skin.colors.warning

          return (
            <div
              key={signal.id}
              onClick={() => onFocusUnit?.(signal.from)}
              className="flex-shrink-0 px-3 py-2 rounded-lg border cursor-pointer hover:border-opacity-100 transition-all duration-200 font-mono text-xs whitespace-nowrap"
              style={{
                backgroundColor: skin.colors.background,
                borderColor: outcomeColor + '40',
                borderWidth: '1px',
              }}
              title={`From: ${signal.fromName}\nTo: ${signal.toName}\nOutcome: ${signal.outcome}`}
            >
              {/* Source */}
              <span style={{ color: skin.colors.primary }}>
                {signal.fromName.slice(0, 8)}
              </span>

              {/* Arrow */}
              <span
                className="mx-1"
                style={{ color: skin.colors.muted + '60' }}
              >
                →
              </span>

              {/* Target */}
              <span style={{ color: skin.colors.secondary }}>
                {signal.toName.slice(0, 8)}
              </span>

              {/* Skill */}
              <span
                className="mx-1 px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: skin.colors.muted + '15',
                  color: skin.colors.muted,
                }}
              >
                {signal.skill.slice(0, 6)}
              </span>

              {/* Outcome */}
              <span style={{ color: outcomeColor }}>
                {outcomeIcon}
              </span>

              {/* Revenue */}
              {signal.revenue !== 0 && (
                <span
                  className="ml-1"
                  style={{ color: revenueColor }}
                >
                  {isRevenue ? '+' : '-'}${Math.abs(signal.revenue).toFixed(2)}
                </span>
              )}

              {/* Timestamp */}
              <span
                className="ml-2"
                style={{ color: skin.colors.muted + '60' }}
              >
                {formatTime(signal.ts)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Format timestamp as relative time
function formatTime(ts: number): string {
  const now = Date.now()
  const diff = Math.floor((now - ts) / 1000)

  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~180 lines. Live signal ticker at the bottom.
// ═══════════════════════════════════════════════════════════════════════════════
