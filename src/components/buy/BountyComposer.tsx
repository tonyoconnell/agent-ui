import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  providerUid: string
  skillId: string
  defaultPrice?: number
  onPosted?: (bountyId: string) => void
  onCancel?: () => void
}

interface Rubric {
  fit: number
  form: number
  truth: number
  taste: number
}

export function BountyComposer({ providerUid, skillId, defaultPrice = 1, onPosted, onCancel }: Props) {
  const [price, setPrice] = useState(defaultPrice)
  const [rubric, setRubric] = useState<Rubric>({ fit: 0.7, form: 0.7, truth: 0.7, taste: 0.7 })
  const [deadline, setDeadline] = useState(24)
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setDim = (dim: keyof Rubric) => (val: number[]) => setRubric((r) => ({ ...r, [dim]: val[0] }))

  const handleSubmit = async () => {
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/buy/bounty', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          providerUid,
          skillId,
          price,
          rubricThresholds: rubric,
          deadlineMs: Date.now() + deadline * 3_600_000,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          description,
        }),
      })
      if (!res.ok) {
        setError((await res.text()) || 'Post failed')
        return
      }
      const { bountyId } = (await res.json()) as { bountyId: string }
      emitClick('ui:buy:bounty-submit', {
        type: 'payment',
        content: bountyId,
        payment: { receiver: providerUid, amount: price, action: 'bounty' },
      })
      onPosted?.(bountyId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Post failed')
    } finally {
      setPending(false)
    }
  }

  const dims = ['fit', 'form', 'truth', 'taste'] as const

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Post Bounty</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-white/70 text-xs">Price (SUI)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {dims.map((dim) => (
            <div key={dim} className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-white/70 text-xs capitalize">{dim}</Label>
                <span className="text-white/50 text-xs">{rubric[dim].toFixed(2)}</span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[rubric[dim]]}
                onValueChange={setDim(dim)}
                className="[&>[data-slot=slider-track]]:bg-white/10"
              />
            </div>
          ))}

          <div className="space-y-1">
            <Label className="text-white/70 text-xs">Deadline (hours)</Label>
            <Input
              type="number"
              min={1}
              value={deadline}
              onChange={(e) => setDeadline(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-white/70 text-xs">Tags (comma-separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. copy, seo, headlines"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-white/70 text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 text-white resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onCancel} className="text-white/60 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending} className="bg-violet-600 hover:bg-violet-500">
            {pending ? 'Posting…' : 'Post Bounty'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
