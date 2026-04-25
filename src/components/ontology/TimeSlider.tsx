import { useCallback, useEffect, useRef, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'
import { describe, isNow, type TimeWindow } from './lib/at-timestamp'

interface Props {
  value: TimeWindow
  onChange: (next: TimeWindow) => void
  /** How many days back the leftmost slider position represents. Default 30. */
  rangeDays?: number
}

/** Slider position 100 = "now" (at: null), 0 = now - rangeDays. */
function positionFromWindow(value: TimeWindow, rangeDays: number): number {
  if (value.at === null) return 100
  const rangeMs = rangeDays * 86_400_000
  const elapsed = Date.now() - value.at
  // Clamp to [0, 99] — position 100 is reserved for "now"
  return Math.max(0, Math.min(99, Math.round(100 - (elapsed / rangeMs) * 100)))
}

export function TimeSlider({ value, onChange, rangeDays = 30 }: Props) {
  // Local position drives the slider immediately; debounced onChange fires after 100ms.
  const [position, setPosition] = useState<number>(() => positionFromWindow(value, rangeDays))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local position in sync when the parent resets value externally.
  useEffect(() => {
    setPosition(positionFromWindow(value, rangeDays))
  }, [value, rangeDays])

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const pos = Number(e.target.value)
      setPosition(pos)

      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const next: TimeWindow =
          pos === 100 ? { at: null } : { at: Date.now() - ((100 - pos) / 100) * rangeDays * 86_400_000 }

        emitClick('ui:ontology:time-rewind', { ms: next.at })
        onChange(next)
      }, 100)
    },
    [onChange, rangeDays],
  )

  const handleReset = useCallback(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    emitClick('ui:ontology:time-reset')
    onChange({ at: null })
  }, [onChange])

  const historical = !isNow(value)

  return (
    <div
      className={cn(
        'bg-[#0d0d14] border rounded p-3 text-xs text-slate-300 select-none',
        historical ? 'border-amber-500/40' : 'border-[#252538]',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold tracking-wide uppercase text-[10px] text-slate-400">Time</span>
        {historical && (
          <span className="text-[9px] font-mono font-semibold tracking-widest text-amber-500/80 uppercase">
            Time-Rewind
          </span>
        )}
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={position}
        onChange={handleSliderChange}
        className="accent-blue-500 w-full cursor-pointer"
        aria-label="Time travel slider"
      />

      {/* Description */}
      <p className="mt-1 text-slate-400 font-mono">{describe(value)}</p>

      {/* Reset button — visible only when not "now" */}
      {historical && (
        <button
          type="button"
          onClick={handleReset}
          className="mt-2 text-slate-500 hover:text-slate-200 text-[10px] underline underline-offset-2 transition-colors"
        >
          reset to now
        </button>
      )}
    </div>
  )
}
