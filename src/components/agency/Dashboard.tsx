import { useEffect, useState } from 'react'

interface GroupSummary {
  groupId: string
  name: string
  unitCount: number
  highwayCount: number
}

interface Props {
  agencyGroupId: string
}

export function AgencyDashboard({ agencyGroupId }: Props) {
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/export/groups')
      .then((r) => (r.ok ? (r.json() as Promise<{ groupId: string; name: string }[]>) : Promise.resolve([])))
      .then((data) => {
        if (cancelled) return
        // Filter groups that belong to this agency (slug prefix)
        const slug = agencyGroupId.replace('agency:', '')
        const clientGroups = data.filter((g) => g.groupId.startsWith(`${slug}:`) || g.groupId === agencyGroupId)
        setGroups(clientGroups.map((g) => ({ ...g, unitCount: 0, highwayCount: 0 })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => {
      cancelled = true
    }
  }, [agencyGroupId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
        <div className="h-4 w-4 rounded-full border border-indigo-500 border-t-transparent animate-spin" />
        Loading agency…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Agency dashboard</h2>
        <a
          href="/market"
          className="rounded border border-[#252538] px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
        >
          Marketplace →
        </a>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-500">No client groups yet. Create a group to get started.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <a
              key={g.groupId}
              href={`/${g.groupId}`}
              className="flex flex-col gap-2 rounded-lg border border-[#252538] bg-[#161622] px-4 py-3 hover:border-indigo-500/40 transition-colors"
            >
              <span className="text-sm font-medium text-slate-100">{g.name}</span>
              <span className="text-xs font-mono text-slate-500">{g.groupId}</span>
              <div className="flex gap-4 text-xs text-slate-600 mt-1">
                <span>{g.unitCount} agents</span>
                <span>{g.highwayCount} highways</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <a
          href="/api/agency/create"
          className="rounded bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm text-white transition-colors"
        >
          + New client group
        </a>
      </div>
    </div>
  )
}
