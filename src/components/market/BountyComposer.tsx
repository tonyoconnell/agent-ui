import { useState, useTransition } from 'react'
import type { CapabilityListing } from '@/pages/api/market/list'

interface Props {
  listing: CapabilityListing
  posterUid: string
  onCreated?: (bountyId: string) => void
  onClose?: () => void
}

export function BountyComposer({ listing, posterUid, onCreated, onClose }: Props) {
  const [price, setPrice] = useState(listing.price.toString())
  const [deadline, setDeadline] = useState('')
  const [rubric, setRubric] = useState({ fit: 0.65, form: 0.65, truth: 0.65, taste: 0.65 })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/market/bounty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skillId: listing.skillId,
            sellerUid: listing.sellerUid,
            posterUid,
            price: Number(price),
            rubric,
            deadline: deadline ? new Date(deadline).getTime() : 0,
          }),
        })
        const data = (await res.json()) as { id?: string; error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Failed to create bounty')
        onCreated?.(data.id!)
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 min-w-[360px]">
      <h3 className="text-sm font-semibold text-slate-100">Post bounty — {listing.name}</h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400">Price (FET)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="bg-[#0a0a0f] border border-[#252538] rounded px-3 py-2 text-sm text-slate-100"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400">
          Deadline <span className="text-slate-600">(optional)</span>
        </label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="bg-[#0a0a0f] border border-[#252538] rounded px-3 py-2 text-sm text-slate-100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-400">Quality gates (0–1)</span>
        {(['fit', 'form', 'truth', 'taste'] as const).map((dim) => (
          <div key={dim} className="flex items-center gap-3">
            <span className="w-10 text-xs text-slate-500">{dim}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={rubric[dim]}
              onChange={(e) => setRubric((r) => ({ ...r, [dim]: Number(e.target.value) }))}
              className="flex-1 accent-indigo-500"
            />
            <span className="w-8 text-right text-xs text-slate-400">{rubric[dim].toFixed(2)}</span>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 rounded px-3 py-2 border border-red-700/30">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm text-white disabled:opacity-50"
        >
          {isPending ? 'Locking escrow…' : 'Post bounty'}
        </button>
      </div>
    </form>
  )
}
