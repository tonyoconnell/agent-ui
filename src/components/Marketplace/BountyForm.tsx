import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { emitClick } from '@/lib/ui-signal'
import type { CapabilityListing } from '@/pages/api/market/list'

interface Props {
  capability: CapabilityListing
  posterUid: string
  onSuccess?: (bountyId: string) => void
}

export function BountyForm({ capability, posterUid, onSuccess }: Props) {
  const [brief, setBrief] = useState('')
  const [price, setPrice] = useState(capability.price || 0)
  const [fitThreshold, setFitThreshold] = useState(0.65)
  const [truthThreshold, setTruthThreshold] = useState(0.65)
  const [days, setDays] = useState(7)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [bountyId, setBountyId] = useState<string>()
  const [escrowState, setEscrowState] = useState<'locked' | 'claimed' | 'verifying' | 'released' | 'refunded'>('locked')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('/api/market/bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'bounty',
          tags: capability.tags ?? [],
          content: { skillId: capability.skillId, sellerUid: capability.sellerUid, posterUid, brief },
          price,
          rubric: { fit: fitThreshold, form: 0.65, truth: truthThreshold, taste: 0.65 },
          deadline: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
          escrow_state: 'locked',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as {
        id: string
        escrow_state?: 'locked' | 'claimed' | 'verifying' | 'released' | 'refunded'
      }
      setBountyId(data.id)
      setEscrowState(data.escrow_state ?? 'locked')
      setStatus('done')
      onSuccess?.(data.id)
    } catch {
      setStatus('error')
    }
  }

  const escrowLabel: Record<typeof escrowState, string> = {
    locked: 'Escrow locked — awaiting claim',
    claimed: 'Claimed — verifying work',
    verifying: 'Verifying — rubric scoring in progress',
    released: 'Released — payment sent to seller',
    refunded: 'Refunded — escrow returned to poster',
  }

  if (status === 'done') {
    const isTerminal = escrowState === 'released' || escrowState === 'refunded'
    return (
      <Card className="bg-slate-900 border border-green-500/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm text-green-400">{escrowLabel[escrowState]}</p>
          {bountyId && <p className="text-xs text-slate-500 font-mono">{bountyId}</p>}
          {!isTerminal && (
            <p className="text-xs text-slate-500">Progress: locked → claimed → verifying → released | refunded</p>
          )}
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
            <Label className="text-xs text-slate-400">
              Brief <span className="text-red-400">*</span>
            </Label>
            <Textarea
              required
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe the work you need done…"
              className="bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500 min-h-[72px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Price (SUI)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Fit threshold</Label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={fitThreshold}
                onChange={(e) => setFitThreshold(parseFloat(e.target.value))}
                className="bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Truth threshold</Label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={truthThreshold}
                onChange={(e) => setTruthThreshold(parseFloat(e.target.value))}
                className="bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Deadline (days)</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10) || 7)}
              className="bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500"
            />
          </div>

          <Button
            type="submit"
            disabled={status === 'submitting' || price <= 0 || !brief.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
            onClick={() => emitClick('ui:market:submit', { skillId: capability.skillId, price })}
          >
            {status === 'submitting' ? 'Locking escrow…' : `Post bounty · ${price} SUI`}
          </Button>

          {status === 'error' && <p className="text-xs text-red-400">Failed to post bounty. Check console.</p>}
        </form>
      </CardContent>
    </Card>
  )
}
