import { useState, useTransition } from 'react'

interface Props {
  skillId: string
  name: string
  price: number
  tags: string[]
  onClose?: () => void
}

type Mode = 'flat' | 'per-use' | 'subscription'
type Visibility = 'public' | 'group' | 'private'

export function SkillInspector({ skillId, name, price: initialPrice, onClose }: Props) {
  const [price, setPrice] = useState(initialPrice)
  const [mode, setMode] = useState<Mode>('flat')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/skills/${skillId}/price`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price, mode, visibility }),
        })
        setStatus(res.ok ? 'ok' : 'error')
      } catch {
        setStatus('error')
      }
    })
  }

  const visOptions: Visibility[] = ['public', 'group', 'private']

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-sm font-medium text-font">{name}</span>
        {onClose && (
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-font">
            ✕
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Price (USD per call)</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="bg-card border border-border rounded px-2 py-1 text-sm text-font w-full"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Pricing mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="bg-card border border-border rounded px-2 py-1 text-sm text-font"
          >
            <option value="flat">Flat — fixed fee</option>
            <option value="per-use">Per-use — pay per signal</option>
            <option value="subscription">Subscription — monthly</option>
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Visibility</span>
          <div className="flex gap-1">
            {visOptions.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`px-3 py-1 rounded text-xs capitalize ${
                  visibility === v
                    ? 'bg-[hsl(var(--color-secondary-bright))] text-white'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="mt-1 px-3 py-1 rounded bg-[hsl(var(--color-secondary-bright))] hover:bg-[hsl(var(--color-secondary-mid))] disabled:opacity-50 text-sm text-white self-start"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        {status === 'ok' && <p className="text-xs text-[hsl(var(--color-tertiary-bright))]">Saved.</p>}
        {status === 'error' && <p className="text-xs text-[hsl(var(--color-destructive))]">Save failed.</p>}
      </div>
    </div>
  )
}
