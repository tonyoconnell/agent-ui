import { useEffect, useState } from 'react'

interface GroupSummary {
  groupId: string
  name: string
  actorCount: number
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
        setGroups(clientGroups.map((g) => ({ ...g, actorCount: 0, highwayCount: 0 })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => {
      cancelled = true
    }
  }, [agencyGroupId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <div className="h-4 w-4 rounded-full border border-primary border-t-transparent animate-spin" />
        Loading agency…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-font">Agency dashboard</h2>
        <a
          href="/market"
          className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-font transition-colors"
        >
          Marketplace →
        </a>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No client groups yet. Create a group to get started.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <a
              key={g.groupId}
              href={`/${g.groupId}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40 transition-colors"
            >
              <span className="text-sm font-medium text-font">{g.name}</span>
              <span className="text-xs font-mono text-muted-foreground">{g.groupId}</span>
              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                <span>{g.actorCount} agents</span>
                <span>{g.highwayCount} highways</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <a
          href="/api/agency/create"
          className="rounded bg-primary hover:bg-primary/90 px-4 py-2 text-sm text-primary-foreground transition-colors"
        >
          + New client group
        </a>
      </div>
    </div>
  )
}
