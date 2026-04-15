import type { CapabilityListing } from '@/pages/api/market/list'

interface Props {
  listing: CapabilityListing
  onHire?: (listing: CapabilityListing) => void
  onBounty?: (listing: CapabilityListing) => void
}

export function MarketRow({ listing, onHire, onBounty }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-[#252538] bg-[#161622] px-4 py-3 hover:border-[#353550] transition-colors">
      {/* Skill info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-100 truncate">{listing.name}</span>
          {listing.pricingMode === 'free' && (
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-700/30">
              free
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-mono truncate">{listing.sellerUid}</span>
          {listing.tags.length > 0 && (
            <>
              <span>·</span>
              <span>{listing.tags.slice(0, 3).join(', ')}</span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0 text-right">
        <div className="text-sm font-medium text-slate-300">{listing.price > 0 ? `${listing.price} FET` : 'free'}</div>
        <div className="text-xs text-slate-600">{Math.round(listing.successRate * 100)}% success</div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex gap-2">
        <button
          type="button"
          onClick={() => onBounty?.(listing)}
          className="rounded border border-[#252538] px-2 py-1 text-xs text-slate-400 hover:text-slate-100 hover:border-[#353550] transition-colors"
        >
          Bounty
        </button>
        <button
          type="button"
          onClick={() => onHire?.(listing)}
          className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-xs text-white transition-colors"
        >
          Hire
        </button>
      </div>
    </div>
  )
}
