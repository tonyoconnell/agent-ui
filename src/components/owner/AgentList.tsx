import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { emitClick } from '@/lib/ui-signal'

interface AgentRow {
  uid: string
  address: string
  kdf_version: number | null
  created_at: string | null
  expires_at: string | null
}

function truncate(s: string): string {
  if (!s || s.length <= 14) return s
  return `${s.slice(0, 6)}…${s.slice(-4)}`
}

function relativeDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86_400_000)
    if (days === 0) return 'today'
    if (days === 1) return '1d ago'
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
  } catch {
    return iso
  }
}

function relativeExpiry(iso: string | null): string {
  if (!iso) return 'no expiry'
  try {
    const diff = new Date(iso).getTime() - Date.now()
    if (diff < 0) return 'expired'
    const days = Math.ceil(diff / 86_400_000)
    if (days === 0) return 'today'
    if (days === 1) return 'in 1 day'
    if (days < 30) return `in ${days} days`
    const months = Math.ceil(days / 30)
    return `in ${months}mo`
  } catch {
    return iso
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    emitClick('ui:owner:agents-copy-address')
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="ml-1.5 text-slate-600 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
    >
      {copied ? (
        <svg aria-hidden="true" className="w-3 h-3 text-green-400" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
          <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
        </svg>
      )}
      <span className="sr-only">{copied ? 'Copied' : `Copy ${label}`}</span>
    </button>
  )
}

export function AgentList() {
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refreshButtonRef = useRef<HTMLButtonElement>(null)
  const retryButtonRef = useRef<HTMLButtonElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/agents')
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = (await res.json()) as { agents: AgentRow[] }
      setAgents(json.agents ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function handleRefresh() {
    emitClick('ui:owner:agents-refresh')
    void load()
  }

  function handleRetry() {
    emitClick('ui:owner:agents-retry')
    void load().then(() => {
      setTimeout(() => retryButtonRef.current?.focus(), 50)
    })
  }

  return (
    <Card className="bg-[#0f0f14] border-[#1e293b]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          Registered Agents
          {!loading && !error && (
            <Badge variant="outline" className="text-xs border-[#1e293b] text-slate-500">
              {agents.length}
            </Badge>
          )}
        </CardTitle>
        <Button
          ref={refreshButtonRef}
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-slate-400 hover:text-white"
          onClick={handleRefresh}
          aria-label="Refresh agent list"
        >
          <svg aria-hidden="true" className="w-3.5 h-3.5 mr-1" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5.75.75 0 0 1 1.5 0 7 7 0 1 1-3.5-6.062V.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1 0-1.5h1.53A5.481 5.481 0 0 0 8 2.5Z" />
          </svg>
          <span>Refresh</span>
          <span className="sr-only"> agents</span>
        </Button>
      </CardHeader>

      {/* aria-live wraps all dynamic content; removed aria-label from CardContent (div unsupported) */}
      <CardContent aria-live="polite">
        {/* Loading: 3 skeleton rows */}
        {loading && (
          <div role="status" className="space-y-3">
            <span className="sr-only">Loading agents</span>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-32 bg-[#1e293b]" />
                <Skeleton className="h-4 w-24 bg-[#1e293b]" />
                <Skeleton className="h-4 w-12 bg-[#1e293b]" />
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
              aria-label="Retry loading agents"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && agents.length === 0 && (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-slate-500">No agents registered yet.</p>
            <div className="bg-[#0a0a0f] border border-[#252538] rounded-md p-3 text-left inline-block">
              <p className="text-xs text-slate-500 mb-1.5 font-mono">Register an agent:</p>
              <code className="block text-xs font-mono text-green-400 whitespace-pre">
                {`curl -X POST /api/auth/agent \\\n  -d '{"uid":"my-agent"}'`}
              </code>
            </div>
          </div>
        )}

        {/* Agent rows */}
        {!loading && !error && agents.length > 0 && (
          <TooltipProvider>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs font-mono">
                <caption className="sr-only">Agent wallets</caption>
                <thead>
                  <tr className="text-slate-500 border-b border-[#1e293b]">
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      UID
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Address
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      KDF
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Created
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Expires
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={a.uid} className="border-b border-[#1e293b]/50 hover:bg-[#161622] transition-colors">
                      <td className="py-2.5 px-2 text-blue-400 max-w-[180px] truncate">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">{a.uid}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs">{a.uid}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-slate-300 cursor-default">{truncate(a.address)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span className="font-mono text-xs">{a.address}</span>
                            </TooltipContent>
                          </Tooltip>
                          {a.address && <CopyButton value={a.address} label="address" />}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        {a.kdf_version !== null ? (
                          <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                            v{a.kdf_version}
                          </Badge>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-slate-400 cursor-default">{relativeDate(a.created_at)}</span>
                          </TooltipTrigger>
                          {a.created_at && (
                            <TooltipContent>
                              <span className="font-mono text-xs">{new Date(a.created_at).toISOString()}</span>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2">
                        {a.expires_at ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-slate-400 cursor-default">{relativeExpiry(a.expires_at)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span className="font-mono text-xs">{new Date(a.expires_at).toISOString()}</span>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                            no expiry
                          </Badge>
                        )}
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
