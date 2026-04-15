import { useState } from 'react'
import type { CapabilityListing } from '@/pages/api/market/list'
import { FilterBar } from './FilterBar'
import { SkuCard } from './SkuCard'

interface Props {
  capabilities: CapabilityListing[]
}

export function MarketplaceGrid({ capabilities }: Props) {
  const [filtered, setFiltered] = useState(capabilities)

  return (
    <div className="space-y-4">
      <FilterBar capabilities={capabilities} onFilter={setFiltered} />

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No capabilities match your filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <SkuCard key={`${c.skillId}-${c.sellerUid}`} capability={c} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600 text-right">
        {filtered.length} of {capabilities.length} capabilities
      </p>
    </div>
  )
}
