import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

interface AgentRow {
  uid: string
  address: string
  kdf_version: number | null
  created_at: string | null
  expires_at: string | null
}

function truncate(s: string, len = 12): string {
  if (s.length <= len) return s
  return `${s.slice(0, 6)}…${s.slice(-6)}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function AgentList() {
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
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
  }

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Card className="bg-[#0f0f14] border-[#1e293b]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-300">
          Registered Agents
          {!loading && !error && (
            <Badge variant="outline" className="ml-2 text-xs border-[#1e293b] text-slate-500">
              {agents.length}
            </Badge>
          )}
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-slate-400 hover:text-white"
          onClick={() => {
            emitClick('ui:owner:refresh-agents')
            void load()
          }}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && (
          <div className="space-y-2">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => {
                emitClick('ui:owner:retry-agents')
                void load()
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {!loading && !error && agents.length === 0 && (
          <p className="text-sm text-slate-500 font-mono">
            No agents registered yet. Use POST /api/agents/register-owner from the browser console.
          </p>
        )}
        {!loading && !error && agents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-[#1e293b]">
                  <th className="text-left py-2 pr-4">UID</th>
                  <th className="text-left py-2 pr-4">Address</th>
                  <th className="text-left py-2 pr-4">KDF v</th>
                  <th className="text-left py-2 pr-4">Created</th>
                  <th className="text-left py-2">Expires</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.uid} className="border-b border-[#1e293b]/50 hover:bg-[#161622]">
                    <td className="py-2 pr-4 text-blue-400">{a.uid}</td>
                    <td className="py-2 pr-4 text-slate-300" title={a.address}>
                      {truncate(a.address)}
                    </td>
                    <td className="py-2 pr-4 text-slate-400">{a.kdf_version ?? '—'}</td>
                    <td className="py-2 pr-4 text-slate-400">{formatDate(a.created_at)}</td>
                    <td className="py-2 text-slate-400">
                      {a.expires_at ? (
                        formatDate(a.expires_at)
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
        )}
      </CardContent>
    </Card>
  )
}
