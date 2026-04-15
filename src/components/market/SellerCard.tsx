import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CapabilityListing } from '@/pages/api/market/list'

interface Props {
  sellerUid: string
  sellerName: string
  successRate: number
  capabilities: CapabilityListing[]
}

export function SellerCard({ sellerName, successRate, capabilities }: Props) {
  return (
    <Card className="bg-slate-900 border border-slate-700/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-200 text-sm">{sellerName}</span>
          <span className="text-xs text-slate-400">{capabilities.length} skills</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500/60 rounded-full"
              style={{ width: `${Math.min(100, successRate * 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 shrink-0">{Math.round(successRate * 100)}% success</span>
        </div>

        <div className="flex flex-wrap gap-1 pt-1">
          {capabilities.slice(0, 3).map((c) => (
            <Badge key={c.skillId} variant="outline" className="text-xs px-1.5 py-0 text-slate-400 border-slate-700">
              {c.name}
            </Badge>
          ))}
          {capabilities.length > 3 && <span className="text-xs text-slate-600">+{capabilities.length - 3} more</span>}
        </div>
      </CardContent>
    </Card>
  )
}
