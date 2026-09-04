import { useMemo } from 'react'

interface AgentLike {
  uid?: string
  id?: string
  name?: string
}

interface Props {
  value: string
  onChange: (group: string) => void
  agents: AgentLike[]
}

export function GroupSwitcher({ value, onChange, agents }: Props) {
  const groups = useMemo(() => {
    const set = new Set<string>(['g:public'])
    for (const a of agents) {
      const uid = a.uid ?? a.id ?? ''
      const colon = uid.indexOf(':')
      if (colon > 0) {
        set.add(`g:${uid.slice(0, colon)}`)
      }
    }
    return Array.from(set).sort()
  }, [agents])

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">group</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-border bg-card px-2 py-1 text-xs text-font focus:border-primary-bright focus:outline-none"
      >
        {groups.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    </div>
  )
}
