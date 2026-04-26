import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { emitClick } from '@/lib/ui-signal'

interface AuditRow {
  ts: string | number
  action: string
  sender: string
  receiver: string
  gate: string
  decision: string
}

function isoTs(ts: string | number): string {
  try {
    const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
    return d.toISOString()
  } catch {
    return String(ts)
  }
}

function relativeTs(ts: string | number): string {
  try {
    const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
    const diff = Date.now() - d.getTime()
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return `${secs}s ago`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  } catch {
    return String(ts)
  }
}

function truncate(s: string): string {
  if (!s || s.length <= 16) return s
  return `${s.slice(0, 7)}…${s.slice(-6)}`
}

// Gate badge: scope=blue, network=amber, sensitivity=violet, default=slate
const GATE_CLASSES: Record<string, string> = {
  scope: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  network: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  sensitivity: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
}

// Decision badge: allow-audit=blue, deny=red, observe=gray, owner-bypass=emerald
const DECISION_CLASSES: Record<string, string> = {
  allow: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'allow-audit': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  deny: 'bg-red-500/15 text-red-400 border-red-500/30',
  blocked: 'bg-red-500/15 text-red-400 border-red-500/30',
  observe: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  'owner-bypass': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

const POLL_INTERVAL = 30_000

export function AuditLogViewer() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const retryButtonRef = useRef<HTMLButtonElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Keep a ref so the interval callback sees the latest paused value without re-scheduling
  const pausedRef = useRef(paused)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/audit?limit=50')
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = (await res.json()) as { rows: AuditRow[] }
      setRows(json.rows ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  // Keep ref in sync with state so the interval can read the latest value
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  // Mount: initial load + polling (stable — depends only on load which is memoized)
  useEffect(() => {
    void load()
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) void load()
    }, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [load])

  function handleRefresh() {
    emitClick('ui:owner:audit-refresh')
    void load()
  }

  function handleRetry() {
    emitClick('ui:owner:audit-retry')
    void load().then(() => {
      setTimeout(() => retryButtonRef.current?.focus(), 50)
    })
  }

  return (
    <Card className="bg-[#0f0f14] border-[#1e293b]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            Audit log — last 50 events
            {!loading && !error && (
              <Badge variant="outline" className="text-xs border-[#1e293b] text-slate-500">
                {rows.length}
              </Badge>
            )}
          </CardTitle>
          <p className="text-xs text-slate-600 mt-0.5" aria-live="polite">
            {paused ? <span className="text-amber-500">Paused</span> : <span>Live · refreshes every 30s</span>}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-slate-400 hover:text-white"
          onClick={handleRefresh}
          aria-label="Refresh audit log"
        >
          <svg aria-hidden="true" className="w-3.5 h-3.5 mr-1" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5.75.75 0 0 1 1.5 0 7 7 0 1 1-3.5-6.062V.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1 0-1.5h1.53A5.481 5.481 0 0 0 8 2.5Z" />
          </svg>
          <span>Refresh</span>
          <span className="sr-only"> audit log</span>
        </Button>
      </CardHeader>

      {/* aria-live region wraps all dynamic content */}
      <CardContent aria-live="polite">
        {/* Skeleton loading */}
        {loading && (
          <div role="status" className="space-y-3">
            <span className="sr-only">Loading audit events</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-16 bg-[#1e293b]" />
                <Skeleton className="h-4 w-20 bg-[#1e293b]" />
                <Skeleton className="h-4 w-20 bg-[#1e293b]" />
                <Skeleton className="h-4 w-20 bg-[#1e293b]" />
                <Skeleton className="h-4 w-16 bg-[#1e293b]" />
                <Skeleton className="h-4 w-16 bg-[#1e293b]" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-md p-4 space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              ref={retryButtonRef}
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={handleRetry}
              aria-label="Retry loading audit log"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">No owner-tier audit events yet.</p>
        )}

        {/* Audit table with pause-on-hover */}
        {!loading && !error && rows.length > 0 && (
          <TooltipProvider>
            <div
              className="overflow-x-auto -mx-2"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <table className="w-full text-xs font-mono">
                <caption className="sr-only">Audit log — hover to pause live refresh</caption>
                <thead>
                  <tr className="text-slate-500 border-b border-[#1e293b]">
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Time
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Action
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Sender
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Receiver
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Gate
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Decision
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-[#1e293b]/50 hover:bg-[#161622] transition-colors">
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-slate-500 cursor-default">{relativeTs(r.ts)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs">{isoTs(r.ts)}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2 text-amber-400 max-w-[140px] truncate">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">{r.action}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs">{r.action}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-slate-400 cursor-default">{truncate(r.sender)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs">{r.sender}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-slate-400 cursor-default">{truncate(r.receiver)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs">{r.receiver}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${GATE_CLASSES[r.gate] ?? 'border-slate-500/30 text-slate-400'}`}
                        >
                          {r.gate}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${DECISION_CLASSES[r.decision] ?? 'border-slate-500/30 text-slate-400'}`}
                        >
                          {r.decision}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
