/**
 * RoleEditor — chairman assigns roles to existing group members.
 *
 * Reads GET /api/groups/[gid]/members. Renders per-row Select of 6 roles.
 * POSTs to /api/membership/role on change. Uses cookie session auth.
 */
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { emitClick } from '@/lib/ui-signal'

interface Member {
  uid: string
  name: string
  role: string
}

const ROLES = ['chairman', 'board', 'ceo', 'operator', 'agent', 'auditor'] as const
type Role = (typeof ROLES)[number]

const DEFAULT_GID = 'one'

export function RoleEditor({ gid = DEFAULT_GID }: { gid?: string }) {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch(`/api/groups/${encodeURIComponent(gid)}/members`, { credentials: 'same-origin' })
      .then((r) => r.json() as Promise<{ members?: Member[]; error?: string }>)
      .then((data) => {
        if (Array.isArray(data.members)) setMembers(data.members)
        else if (data.error) setError(data.error)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'load failed'))
  }, [gid])

  useEffect(() => {
    load()
  }, [load])

  const assign = useCallback(
    async (uid: string, role: Role) => {
      const prev = members?.find((m) => m.uid === uid)?.role ?? 'agent'
      if (prev === role) return

      setPending(uid)
      setError(null)
      setMembers((curr) => (curr ? curr.map((m) => (m.uid === uid ? { ...m, role } : m)) : curr))
      emitClick('ui:chairman:assign-role', { uid, role })

      try {
        const res = await fetch('/api/membership/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ gid, uid, role }),
        })
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(j.error ?? `HTTP ${res.status}`)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'save failed')
        setMembers((curr) => (curr ? curr.map((m) => (m.uid === uid ? { ...m, role: prev } : m)) : curr))
      } finally {
        setPending(null)
      }
    },
    [gid, members],
  )

  if (!members) {
    return (
      <Card className="bg-[#161622] border-[#252538]">
        <CardHeader>
          <CardTitle className="text-slate-200">Role Editor</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-400 text-sm">Loading…</CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#161622] border-[#252538]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-slate-200">
          <span>Role Editor</span>
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            {members.length} member{members.length === 1 ? '' : 's'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? <div className="text-rose-400 text-sm">{error}</div> : null}

        {members.length === 0 ? (
          <div className="text-slate-500 text-sm">No members found for group {gid}.</div>
        ) : (
          members.map((m) => (
            <div key={m.uid} className="flex items-center justify-between border border-[#252538] rounded-lg px-4 py-3">
              <div>
                <div className="text-slate-200 font-medium">{m.name || m.uid}</div>
                <div className="text-xs text-slate-500 font-mono">{m.uid}</div>
              </div>
              <Select value={m.role} onValueChange={(v) => assign(m.uid, v as Role)} disabled={pending === m.uid}>
                <SelectTrigger className="w-32 bg-[#0a0a0f] border-[#252538] text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161622] border-[#252538]">
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-slate-200">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
