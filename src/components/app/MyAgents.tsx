import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { emitClick } from '@/lib/ui-signal'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Agent {
  uid: string
  name: string
  role: string
  wallet: string | null
  status: string | null
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function truncateWallet(w: string | null): string {
  if (!w || w.length <= 10) return w ?? '—'
  return `${w.slice(0, 6)}…${w.slice(-4)}`
}

function handleInspect(a: Agent) {
  emitClick('ui:dashboard:inspect', { agentId: a.uid, role: a.role })
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function MyAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/me/agents', { credentials: 'include' })
        if (res.status === 401) {
          setError('Please sign in to see your agents.')
          return
        }
        if (!res.ok) {
          setError(`Failed to load agents (HTTP ${res.status}).`)
          return
        }
        setAgents((await res.json()) as Agent[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <Card className="p-6 bg-[#0f0f14] border-[#1e293b]">
        <p className="text-muted-foreground">Loading your agents…</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-[#0f0f14] border-[#1e293b]">
        <p className="text-red-400">{error}</p>
      </Card>
    )
  }

  if (agents.length === 0) {
    return (
      <Card className="p-6 bg-[#0f0f14] border-[#1e293b]">
        <p className="text-slate-400">No agents yet. Create one to get started.</p>
      </Card>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid gap-3">
        {agents.map((a) => (
          <Card key={a.uid} className="bg-[#0f0f14] border-[#1e293b] hover:border-[#3b4f6b] transition-colors">
            <button
              type="button"
              className="w-full text-left px-4 py-3 flex items-center justify-between gap-4"
              onClick={() => {
                handleInspect(a)
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-white truncate">{a.name}</span>
                <Badge variant="outline" className="shrink-0 border-[#3b82f6]/40 text-blue-400 bg-blue-500/10 text-xs">
                  {a.role}
                </Badge>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs">
                {a.wallet && <span className="font-mono text-slate-400">{truncateWallet(a.wallet)}</span>}
                {a.status && (
                  <Badge variant="outline" className="border-[#1e293b] text-slate-400 bg-transparent">
                    {a.status}
                  </Badge>
                )}
              </div>
            </button>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
