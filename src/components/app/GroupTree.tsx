import { useEffect, useState } from 'react'

interface GroupEntry {
  uid: string
  name: string
  type?: string
  members?: string[]
}

interface Props {
  groupId: string
  onSelect: (uid: string, kind: 'group' | 'actor') => void
}

function isGroupArray(val: unknown): val is GroupEntry[] {
  if (!Array.isArray(val)) return false
  return val.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).uid === 'string' &&
      typeof (item as Record<string, unknown>).name === 'string',
  )
}

export function GroupTree({ groupId, onSelect }: Props) {
  const [groups, setGroups] = useState<GroupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/export/groups')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<unknown>
      })
      .then((data) => {
        if (cancelled) return
        const list = isGroupArray(data)
          ? data
          : Array.isArray((data as Record<string, unknown>)?.groups) &&
              isGroupArray((data as Record<string, unknown>).groups)
            ? ((data as Record<string, unknown>).groups as GroupEntry[])
            : null
        if (list === null) {
          setError('Unexpected response shape')
        } else {
          setGroups(list)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Fetch failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const toggle = (uid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) {
        next.delete(uid)
      } else {
        next.add(uid)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto py-2 px-3 text-sm text-zinc-500">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
          <div className="h-4 bg-zinc-800 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="h-full overflow-y-auto py-2 px-3 text-sm text-red-400">Error: {error}</div>
  }

  return (
    <div className="h-full overflow-y-auto py-2 px-3 text-sm">
      {groups.map((group) => {
        const isActive = group.uid === groupId
        const isOpen = expanded.has(group.uid)
        const hasMembers = Array.isArray(group.members) && group.members.length > 0

        return (
          <div key={group.uid}>
            <button
              type="button"
              onClick={() => {
                onSelect(group.uid, 'group')
                if (hasMembers) toggle(group.uid)
              }}
              className={[
                'w-full text-left flex items-center gap-1 py-1 px-2 rounded',
                'hover:bg-zinc-800 transition-colors',
                isActive ? 'border-l-2 border-blue-500 pl-[6px] text-zinc-100 font-bold' : 'text-zinc-300 font-bold',
              ].join(' ')}
            >
              <span className="text-zinc-500 w-3 shrink-0">{hasMembers ? (isOpen ? '▼' : '▶') : ' '}</span>
              <span className="truncate">{group.name}</span>
            </button>

            {isOpen && hasMembers && (
              <div className="ml-4 border-l border-zinc-700 pl-2">
                {(group.members ?? []).map((member) => (
                  <button
                    key={member}
                    type="button"
                    onClick={() => onSelect(member, 'actor')}
                    className="w-full text-left py-1 px-2 rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors truncate block"
                  >
                    {member}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {groups.length === 0 && <div className="text-zinc-600 py-1 px-2">No groups</div>}
    </div>
  )
}
