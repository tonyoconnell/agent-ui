import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

interface AuditRow {
  ts: string | number
  action: string
  sender: string
  receiver: string
  gate: string
  decision: string
}

function formatTs(ts: string | number): string {
  try {
    const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
    return d.toLocaleString()
  } catch {
    return String(ts)
  }
}

const DECISION_CLASSES: Record<string, string> = {
  allow: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'allow-audit': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  deny: 'bg-red-500/20 text-red-400 border-red-500/30',
  blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function AuditLogViewer() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
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
  }

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 30_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <Card className="bg-[#0f0f14] border-[#1e293b]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-300">
          Audit Log
          {!loading && !error && (
            <Badge variant="outline" className="ml-2 text-xs border-[#1e293b] text-slate-500">
              {rows.length} recent
            </Badge>
          )}
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-slate-400 hover:text-white"
          onClick={() => {
            emitClick('ui:owner:refresh-audit')
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
                emitClick('ui:owner:retry-audit')
                void load()
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {!loading && !error && rows.length === 0 && <p className="text-sm text-slate-500">No audit entries yet.</p>}
        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-[#1e293b]">
                  <th className="text-left py-2 pr-3">Time</th>
                  <th className="text-left py-2 pr-3">Action</th>
                  <th className="text-left py-2 pr-3">Sender</th>
                  <th className="text-left py-2 pr-3">Receiver</th>
                  <th className="text-left py-2 pr-3">Gate</th>
                  <th className="text-left py-2">Decision</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-[#1e293b]/50 hover:bg-[#161622]">
                    <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{formatTs(r.ts)}</td>
                    <td className="py-2 pr-3 text-amber-400">{r.action}</td>
                    <td className="py-2 pr-3 text-slate-400">{r.sender}</td>
                    <td className="py-2 pr-3 text-slate-400">{r.receiver}</td>
                    <td className="py-2 pr-3 text-slate-400">{r.gate}</td>
                    <td className="py-2">
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
        )}
      </CardContent>
    </Card>
  )
}
