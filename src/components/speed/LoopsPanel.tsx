'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LoopTiming {
  interval: number
  lastAtMs: number
  nextAtMs: number
}

interface LoopTimings {
  l1?: LoopTiming
  l2?: LoopTiming
  l3?: LoopTiming
  l4?: LoopTiming
  l5?: LoopTiming
  l6?: LoopTiming
  l7?: LoopTiming
}

const LOOP_META = [
  { key: 'l1', name: 'L1 signal', cadence: 'per signal', desc: 'route, ask, outcome' },
  { key: 'l2', name: 'L2 mark', cadence: 'per outcome', desc: 'strength/resistance update' },
  { key: 'l3', name: 'L3 fade', cadence: 'every 5min', desc: 'asymmetric decay' },
  { key: 'l4', name: 'L4 economic', cadence: 'per payment', desc: 'revenue on paths' },
  { key: 'l5', name: 'L5 evolution', cadence: 'every 10min', desc: 'rewrite failing prompts' },
  { key: 'l6', name: 'L6 knowledge', cadence: 'every hour', desc: 'promote highways' },
  { key: 'l7', name: 'L7 frontier', cadence: 'every hour', desc: 'unexplored tag clusters' },
] as const

function relativeTime(ms: number): string {
  const ago = Date.now() - ms
  if (ago < 5000) return 'just now'
  if (ago < 60000) return `${Math.round(ago / 1000)}s ago`
  if (ago < 3600000) return `${Math.round(ago / 60000)}m ago`
  return `${Math.round(ago / 3600000)}h ago`
}

function countdown(nextMs: number): string {
  const diff = nextMs - Date.now()
  if (diff <= 0) return 'now'
  if (diff < 60000) return `in ${Math.round(diff / 1000)}s`
  if (diff < 3600000) return `in ${Math.round(diff / 60000)}m`
  return `in ${Math.round(diff / 3600000)}h`
}

export function LoopsPanel() {
  const [timings, setTimings] = useState<LoopTimings | null>(null)
  const [, setNow] = useState(Date.now())

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/tick?peek=1').catch(() => null)
      if (!res?.ok) return
      const data = (await res.json()) as { loopTimings?: LoopTimings }
      setTimings(data.loopTimings ?? null)
    }
    load()
    const pollId = setInterval(load, 10000)
    const tickId = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      clearInterval(pollId)
      clearInterval(tickId)
    }
  }, [])

  return (
    <div className="space-y-1 text-sm">
      {LOOP_META.map(({ key, name, cadence, desc }) => {
        const t = timings?.[key as keyof LoopTimings]
        const fired = t && t.lastAtMs > 0
        return (
          <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800/40">
            <span className="w-24 font-mono text-xs text-slate-300 shrink-0">{name}</span>
            <span className="flex-1 text-xs text-slate-500">{desc}</span>
            <span className="text-xs text-slate-600 shrink-0 w-20 text-right font-mono">{cadence}</span>
            <span
              className={cn(
                'text-xs font-mono shrink-0 w-20 text-right',
                fired ? 'text-emerald-400' : 'text-slate-600',
              )}
            >
              {fired ? relativeTime(t!.lastAtMs) : '—'}
            </span>
            <span className="text-xs font-mono text-slate-500 shrink-0 w-16 text-right">
              {t ? countdown(t.nextAtMs) : '—'}
            </span>
          </div>
        )
      })}
      {!timings && <p className="text-xs text-slate-600 text-center py-2">loading loop state...</p>}
    </div>
  )
}
