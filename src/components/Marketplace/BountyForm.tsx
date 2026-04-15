import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { CapabilityListing } from '@/pages/api/market/list'

interface Props {
  capability: CapabilityListing
  posterUid: string
  onSuccess?: (bountyId: string) => void
}

export function BountyForm({ capability, posterUid, onSuccess }: Props) {
  const [price, setPrice] = useState(capability.price || 0)
  const [fitThreshold, setFitThreshold] = useState(0.65)
  const [truthThreshold, setTruthThreshold] = useState(0.65)
  const [days, setDays] = useState(7)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [bountyId, setBountyId] = useState<string>()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('/api/market/bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: capability.skillId,
          sellerUid: capability.sellerUid,
          posterUid,
          price,
          rubric: { fit: fitThreshold, truth: truthThreshold },
          deadline: Date.now() + days * 24 * 60 * 60 * 1000,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { id: string }
      setBountyId(data.id)
      setStatus('done')
      onSuccess?.(data.id)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <Card className="bg-slate-900 border border-green-500/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm text-green-400">Bounty posted. Escrow locked.</p>
          {bountyId && <p className="text-xs text-slate-500 font-mono">{bountyId}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border border-slate-700/50">
      <CardContent className="p-4">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">{capability.name}</span>
            <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
              {capability.sellerName}
            </Badge>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Price (SUI)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Fit threshold</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={fitThreshold}
                onChange={(e) => setFitThreshold(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Truth threshold</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={truthThreshold}
                onChange={(e) => setTruthThreshold(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Deadline (days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10) || 7)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <Button
            type="submit"
            disabled={status === 'submitting' || price <= 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
          >
            {status === 'submitting' ? 'Locking escrow…' : `Post bounty · ${price} SUI`}
          </Button>

          {status === 'error' && <p className="text-xs text-red-400">Failed to post bounty. Check console.</p>}
        </form>
      </CardContent>
    </Card>
  )
}
