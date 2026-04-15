import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { BundleListing } from '@/pages/api/market/bundle'

interface Props {
  bundle: BundleListing
  onActivate?: (skillId: string) => void
}

export function HighwayCard({ bundle, onActivate }: Props) {
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)

  const strengthPct = Math.min(100, (bundle.strength / 500) * 100)
  const effectiveStrength = bundle.strength - bundle.resistance

  const handleActivate = async () => {
    setActivating(true)
    try {
      const res = await fetch('/api/market/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: bundle.from, to: bundle.to, price: bundle.compositePrice }),
      })
      if (res.ok) {
        const data = (await res.json()) as { skillId: string }
        setActivated(true)
        onActivate?.(data.skillId)
      }
    } finally {
      setActivating(false)
    }
  }

  return (
    <Card className="bg-slate-900 border border-slate-700/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 font-mono truncate">{bundle.from}</p>
            <p className="text-xs text-slate-400 font-mono">↓</p>
            <p className="text-xs text-slate-500 font-mono truncate">{bundle.to}</p>
          </div>
          <Badge className="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 shrink-0 text-xs">
            {bundle.compositePrice} SUI
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>strength</span>
            <span>{effectiveStrength.toFixed(1)}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${strengthPct}%` }} />
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleActivate}
          disabled={activating || activated}
          className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
        >
          {activated ? 'Activated' : activating ? 'Activating…' : 'List as bundle'}
        </Button>
      </CardContent>
    </Card>
  )
}
