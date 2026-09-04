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

// Gate badge: scope=primary, network=gold, sensitivity=secondary, default=muted-foreground
const GATE_CLASSES: Record<string, string> = {
  scope:
    'bg-[hsl(var(--color-primary-bright)/0.15)] text-[hsl(var(--color-primary-bright))] border-[hsl(var(--color-primary-bright)/0.3)]',
  network: 'bg-[hsl(var(--color-gold)/0.15)] text-[hsl(var(--color-gold))] border-[hsl(var(--color-gold)/0.3)]',
  sensitivity:
    'bg-[hsl(var(--color-secondary-bright)/0.15)] text-[hsl(var(--color-secondary-bright))] border-[hsl(var(--color-secondary-bright)/0.3)]',
}

// Decision badge: allow-audit=primary, deny=destructive, observe=muted-foreground, owner-bypass=tertiary
const DECISION_CLASSES: Record<string, string> = {
  allow:
    'bg-[hsl(var(--color-primary-bright)/0.15)] text-[hsl(var(--color-primary-bright))] border-[hsl(var(--color-primary-bright)/0.3)]',
  'allow-audit':
    'bg-[hsl(var(--color-primary-bright)/0.15)] text-[hsl(var(--color-primary-bright))] border-[hsl(var(--color-primary-bright)/0.3)]',
  deny: 'bg-[hsl(var(--color-destructive)/0.15)] text-[hsl(var(--color-destructive))] border-[hsl(var(--color-destructive)/0.3)]',
  blocked:
    'bg-[hsl(var(--color-destructive)/0.15)] text-[hsl(var(--color-destructive))] border-[hsl(var(--color-destructive)/0.3)]',
  observe:
    'bg-[hsl(var(--color-muted-foreground)/0.15)] text-[hsl(var(--color-muted-foreground))] border-[hsl(var(--color-muted-foreground)/0.3)]',
  'owner-bypass':
    'bg-[hsl(var(--color-tertiary-bright)/0.15)] text-[hsl(var(--color-tertiary-bright))] border-[hsl(var(--color-tertiary-bright)/0.3)]',
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
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            Audit log — last 50 events
            {!loading && !error && (
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                {rows.length}
              </Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5" aria-live="polite">
            {paused ? (
              <span className="text-[hsl(var(--color-gold))]">Paused</span>
            ) : (
              <span>Live · refreshes every 30s</span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-muted-foreground hover:text-font"
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
                <Skeleton className="h-4 w-16 bg-muted" />
                <Skeleton className="h-4 w-20 bg-muted" />
                <Skeleton className="h-4 w-20 bg-muted" />
                <Skeleton className="h-4 w-20 bg-muted" />
                <Skeleton className="h-4 w-16 bg-muted" />
                <Skeleton className="h-4 w-16 bg-muted" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-[hsl(var(--color-destructive)/0.05)] border border-[hsl(var(--color-destructive)/0.2)] rounded-md p-4 space-y-3">
            <p className="text-sm text-[hsl(var(--color-destructive))]">{error}</p>
            <Button
              ref={retryButtonRef}
              size="sm"
              variant="outline"
              className="border-[hsl(var(--color-destructive)/0.3)] text-[hsl(var(--color-destructive))] hover:bg-[hsl(var(--color-destructive)/0.1)]"
              onClick={handleRetry}
              aria-label="Retry loading audit log"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No owner-tier audit events yet.</p>
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
                  <tr className="text-muted-foreground border-b border-border">
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
                    <tr key={i} className="border-b border-border/50 hover:bg-muted transition-colors">
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground cursor-default">{relativeTs(r.ts)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs">{isoTs(r.ts)}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2 text-[hsl(var(--color-gold))] max-w-[140px] truncate">
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
                            <span className="text-muted-foreground cursor-default">{truncate(r.sender)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs">{r.sender}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground cursor-default">{truncate(r.receiver)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs">{r.receiver}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${GATE_CLASSES[r.gate] ?? 'border-[hsl(var(--color-muted-foreground)/0.3)] text-[hsl(var(--color-muted-foreground))]'}`}
                        >
                          {r.gate}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${DECISION_CLASSES[r.decision] ?? 'border-[hsl(var(--color-muted-foreground)/0.3)] text-[hsl(var(--color-muted-foreground))]'}`}
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
