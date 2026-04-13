/**
 * TIME SCRUBBER — Timeline Slider + Replay Controls
 *
 * Drag slider to rewind to timestamp
 * Effect: Load /api/signals?from=<ts>&to=<ts+1min> (replay window)
 * Replay: Show signals that happened in that window, particles animate
 * Empty state: If no live traffic, replay last hour at 10× speed on loop
 *
 * Indicator: Show "▶ replay" in corner if not at "live"
 * Buttons: [<<] [<] [●live] [>] [>>] for quick navigation
 *
 * Controls at bottom of canvas for scrubbing through time.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSkin } from '@/contexts/SkinContext'
import { cn } from '@/lib/utils'

interface Signal {
  id: string
  from: string
  to: string
  ts: number
  outcome: 'success' | 'failure' | 'timeout' | 'dissolved'
  revenue?: number
  skill?: string
}

interface TimeScrubberProps {
  onTimeChange?: (timestamp: number) => void
  onSignalsLoaded?: (signals: Signal[]) => void
  className?: string
}

export function TimeScrubber({
  onTimeChange,
  onSignalsLoaded,
  className,
}: TimeScrubberProps) {
  const { skin } = useSkin()
  const [isLive, setIsLive] = useState(true)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [signals, setSignals] = useState<Signal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const sliderRef = useRef<HTMLInputElement>(null)
  const [minTime, setMinTime] = useState(Date.now() - 3600000) // 1 hour ago
  const [maxTime, setMaxTime] = useState(Date.now())

  // Update max time to current time when live
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      const now = Date.now()
      setCurrentTime(now)
      setMaxTime(now)
      setMinTime(now - 3600000) // Keep 1 hour window
    }, 1000)

    return () => clearInterval(interval)
  }, [isLive])

  // Load signals for the current time window
  const loadSignals = useCallback(async (timestamp: number) => {
    if (typeof window === 'undefined') return
    setIsLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    try {
      const windowStart = timestamp
      const windowEnd = timestamp + 60000 // 1 minute window
      const response = await fetch(
        `/api/signals?from=${windowStart}&to=${windowEnd}`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (response.ok) {
        const data = (await response.json()) as Signal[]
        setSignals(data)
        onSignalsLoaded?.(data)
      }
    } catch (error) {
      clearTimeout(timeout)
      console.error('Failed to load signals:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onSignalsLoaded])

  // Load signals when time changes
  useEffect(() => {
    if (!isLive) {
      loadSignals(currentTime)
    }
  }, [currentTime, isLive, loadSignals])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.currentTarget.value, 10)
    setCurrentTime(newTime)
    setIsLive(false) // Exit live mode when scrubbing
    onTimeChange?.(newTime)
  }

  const handleGoLive = () => {
    setIsLive(true)
    setCurrentTime(Date.now())
    onTimeChange?.(Date.now())
  }

  const handleSkipBack = () => {
    const newTime = Math.max(minTime, currentTime - 600000) // 10 min
    setCurrentTime(newTime)
    setIsLive(false)
    onTimeChange?.(newTime)
  }

  const handleStepBack = () => {
    const newTime = Math.max(minTime, currentTime - 60000) // 1 min
    setCurrentTime(newTime)
    setIsLive(false)
    onTimeChange?.(newTime)
  }

  const handleStepForward = () => {
    const newTime = Math.min(maxTime, currentTime + 60000) // 1 min
    setCurrentTime(newTime)
    setIsLive(false)
    onTimeChange?.(newTime)
  }

  const handleSkipForward = () => {
    const newTime = Math.min(maxTime, currentTime + 600000) // 10 min
    setCurrentTime(newTime)
    setIsLive(false)
    onTimeChange?.(newTime)
  }

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return 'now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHour = Math.floor(diffMin / 60)
    return `${diffHour}h ago`
  }

  const progress = isLive ? 100 : ((currentTime - minTime) / (maxTime - minTime)) * 100

  return (
    <div
      className={cn(
        'relative border-t px-6 py-4 flex flex-col gap-3',
        className
      )}
      style={{
        backgroundColor: skin.colors.surface,
        borderColor: skin.colors.muted + '20',
      }}
    >
      {/* Timeline slider */}
      <div className="flex items-center gap-4">
        {/* Quick navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSkipBack}
            disabled={isLive}
            className="px-2 py-1 rounded text-xs font-mono transition-colors disabled:opacity-30"
            style={{
              backgroundColor: skin.colors.muted + '10',
              color: skin.colors.muted,
            }}
            title="Skip back 10 minutes"
          >
            ≪
          </button>
          <button
            onClick={handleStepBack}
            disabled={isLive}
            className="px-2 py-1 rounded text-xs font-mono transition-colors disabled:opacity-30"
            style={{
              backgroundColor: skin.colors.muted + '10',
              color: skin.colors.muted,
            }}
            title="Step back 1 minute"
          >
            ‹
          </button>
        </div>

        {/* Live button (large) */}
        <button
          onClick={handleGoLive}
          className={cn(
            'px-4 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
            isLive ? 'shadow-lg' : 'hover:bg-white/5'
          )}
          style={{
            backgroundColor: isLive ? skin.colors.primary : skin.colors.primary + '20',
            color: isLive ? skin.colors.surface : skin.colors.primary,
            borderWidth: 1,
            borderColor: isLive ? skin.colors.primary : skin.colors.primary + '40',
          }}
          title="Jump to live"
        >
          ● LIVE
        </button>

        {/* Forward buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleStepForward}
            disabled={isLive}
            className="px-2 py-1 rounded text-xs font-mono transition-colors disabled:opacity-30"
            style={{
              backgroundColor: skin.colors.muted + '10',
              color: skin.colors.muted,
            }}
            title="Step forward 1 minute"
          >
            ›
          </button>
          <button
            onClick={handleSkipForward}
            disabled={isLive}
            className="px-2 py-1 rounded text-xs font-mono transition-colors disabled:opacity-30"
            style={{
              backgroundColor: skin.colors.muted + '10',
              color: skin.colors.muted,
            }}
            title="Skip forward 10 minutes"
          >
            ≫
          </button>
        </div>

        {/* Replay indicator */}
        {!isLive && (
          <div
            className="ml-auto px-3 py-1 rounded text-xs font-semibold"
            style={{
              backgroundColor: skin.colors.warning + '20',
              color: skin.colors.warning,
            }}
          >
            ▶ REPLAY {formatTime(currentTime)}
          </div>
        )}
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-mono"
          style={{ color: skin.colors.muted + '60', minWidth: '40px' }}
        >
          {formatTime(minTime)}
        </span>

        <input
          ref={sliderRef}
          type="range"
          min={minTime}
          max={maxTime}
          value={currentTime}
          onChange={handleSliderChange}
          disabled={isLive}
          className="flex-1 h-1 rounded appearance-none cursor-pointer transition-opacity disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, ${skin.colors.primary}80 0%, ${skin.colors.primary}80 ${progress}%, ${skin.colors.muted}20 ${progress}%, ${skin.colors.muted}20 100%)`,
          }}
          title="Drag to scrub through time"
        />

        <span
          className="text-xs font-mono"
          style={{ color: skin.colors.muted + '60', minWidth: '40px', textAlign: 'right' }}
        >
          NOW
        </span>
      </div>

      {/* Signal count */}
      {!isLive && (
        <div
          className="text-xs"
          style={{ color: skin.colors.muted + '60' }}
        >
          {isLoading ? 'Loading signals...' : `${signals.length} signal${signals.length !== 1 ? 's' : ''} in this minute`}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~250 lines. Timeline slider. Live/replay modes. Quick nav buttons.
// ═══════════════════════════════════════════════════════════════════════════════
