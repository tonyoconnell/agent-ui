import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CapabilityListing } from '@/pages/api/market/list'

interface Props {
  capability: CapabilityListing
}

export function SkuCard({ capability }: Props) {
  const { name, price, pricingMode, sellerName, successRate, tags } = capability

  return (
    <Card className="bg-slate-900 border border-slate-700/50 hover:border-slate-600/70 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-slate-100 text-sm leading-tight">{name}</h3>
          <span
            className={`shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded ${
              pricingMode === 'free'
                ? 'bg-slate-700 text-slate-400'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {pricingMode === 'free' ? 'Free' : `$${price.toFixed(2)}`}
          </span>
        </div>

        {/* Seller */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{sellerName}</span>
          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500/60 rounded-full"
              style={{ width: `${Math.min(100, successRate * 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{Math.round(successRate * 100)}%</span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 text-slate-400 border-slate-700">
                {tag}
              </Badge>
            ))}
            {tags.length > 4 && <span className="text-xs text-slate-600">+{tags.length - 4}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
