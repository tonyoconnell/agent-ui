import { useCallback, useMemo, useState } from 'react'
import type { CapabilityListing } from '@/pages/api/market/list'

interface Props {
  capabilities: CapabilityListing[]
  onFilter: (filtered: CapabilityListing[]) => void
}

export function FilterBar({ capabilities, onFilter }: Props) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [showFreeOnly, setShowFreeOnly] = useState(false)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const c of capabilities) {
      for (const t of c.tags) tags.add(t)
    }
    return Array.from(tags).sort()
  }, [capabilities])

  const apply = useCallback(
    (tags: Set<string>, freeOnly: boolean) => {
      let result = capabilities
      if (tags.size > 0) {
        result = result.filter((c) => c.tags.some((t) => tags.has(t)))
      }
      if (freeOnly) {
        result = result.filter((c) => c.pricingMode === 'free')
      }
      onFilter(result)
    },
    [capabilities, onFilter],
  )

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      apply(next, showFreeOnly)
      return next
    })
  }

  function toggleFree() {
    setShowFreeOnly((prev) => {
      apply(selectedTags, !prev)
      return !prev
    })
  }

  if (allTags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-xs text-slate-500 shrink-0">Filter:</span>

      <button
        type="button"
        onClick={toggleFree}
        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
          showFreeOnly
            ? 'bg-green-500/20 text-green-400 border-green-500/40'
            : 'text-slate-400 border-slate-700 hover:border-slate-600'
        }`}
      >
        Free
      </button>

      {allTags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggleTag(tag)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            selectedTags.has(tag)
              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
              : 'text-slate-400 border-slate-700 hover:border-slate-600'
          }`}
        >
          {tag}
        </button>
      ))}

      {(selectedTags.size > 0 || showFreeOnly) && (
        <button
          type="button"
          onClick={() => {
            setSelectedTags(new Set())
            setShowFreeOnly(false)
            onFilter(capabilities)
          }}
          className="text-xs text-slate-600 hover:text-slate-400 ml-1"
        >
          clear
        </button>
      )}
    </div>
  )
}
