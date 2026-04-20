import { useEffect, useState } from 'react'

interface RoleEntry {
  filename: string
  name: string
  group: string | null
  skills: Array<{ name: string; price?: number; tags?: string[] }>
  tags: string[]
  prompt: string
}

interface Props {
  selected: string[]
  onChange: (roles: string[]) => void
  /** Role names to exclude from the list (e.g. 'ceo' — chairman doesn't hire another CEO) */
  exclude?: string[]
}

export function RoleCatalog({ selected, onChange, exclude = ['ceo'] }: Props) {
  const [roles, setRoles] = useState<RoleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/chairman/roles')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { roles: RoleEntry[] }) => {
        if (cancelled) return
        setRoles(data.roles.filter((r) => !exclude.includes(r.name)))
        setLoading(false)
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [exclude])

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((r) => r !== name) : [...selected, name])
  }

  if (loading) return <div className="p-4 text-xs text-slate-600">Loading roles…</div>
  if (error) return <div className="p-4 text-xs text-red-400">Roles error: {error}</div>
  if (roles.length === 0) return <div className="p-4 text-xs text-slate-600">No role templates found</div>

  return (
    <div className="w-64 border-r border-[#1a1a2e] overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#1a1a2e] text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Roles ({selected.length}/{roles.length})
      </div>
      <ul className="divide-y divide-[#1a1a2e]">
        {roles.map((role) => {
          const isSelected = selected.includes(role.name)
          const isExpanded = expanded === role.name
          return (
            <li key={role.filename}>
              <div className="flex items-start gap-2 px-4 py-3 hover:bg-[#101018]">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(role.name)}
                  className="mt-0.5 w-3.5 h-3.5 rounded accent-violet-600 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : role.name)}
                  className="flex-1 text-left cursor-pointer"
                >
                  <div className="text-sm font-medium text-slate-200">{role.name.toUpperCase()}</div>
                  {role.tags.length > 0 && (
                    <div className="text-[10px] text-slate-600 mt-0.5">{role.tags.slice(0, 3).join(' · ')}</div>
                  )}
                </button>
              </div>
              {isExpanded && role.prompt && (
                <div className="px-4 pb-3 text-[11px] text-slate-500 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                  {role.prompt.slice(0, 600)}
                  {role.prompt.length > 600 ? '…' : ''}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
