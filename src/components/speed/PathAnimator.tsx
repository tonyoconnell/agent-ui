'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  strengthBefore?: number
  strengthAfter?: number
  chainDepth?: number
  edge?: string
  verb?: string
  speedMult?: number
}

export function PathAnimator({
  strengthBefore = 2.0,
  strengthAfter = 2.6,
  chainDepth = 3,
  edge = 'demo → route',
  verb = 'mark',
  speedMult = 1,
}: Props) {
  const [marked, setMarked] = useState(false)

  useEffect(() => {
    const delay = Math.max(10, 800 * speedMult)
    const t = setTimeout(() => setMarked(true), delay)
    return () => clearTimeout(t)
  }, [speedMult])

  const maxStrength = 20
  const beforePct = Math.min((strengthBefore / maxStrength) * 100, 100)
  const afterPct = Math.min((strengthAfter / maxStrength) * 100, 100)

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-slate-400">{edge}</span>
          <span>highway threshold: 20</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">strength</span>
            <span
              className={cn('font-mono transition-colors duration-300', marked ? 'text-emerald-400' : 'text-slate-400')}
            >
              {marked ? strengthAfter.toFixed(1) : strengthBefore.toFixed(1)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-700 ease-out"
              style={{ width: `${marked ? afterPct : beforePct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            'px-2 py-0.5 rounded font-mono border transition-all duration-300',
            marked
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-slate-800 text-slate-500 border-slate-700',
          )}
        >
          {marked
            ? `net.${verb}(edge, ${chainDepth}) → +${(strengthAfter - strengthBefore).toFixed(1)}`
            : 'awaiting result...'}
        </span>
        {marked && <span className="text-slate-600">scales with chain depth</span>}
      </div>
    </div>
  )
}
