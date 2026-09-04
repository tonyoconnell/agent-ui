/**
 * AgentBuilder — Define an agent with tasks and pricing
 *
 * Add capabilities (task name + type + price), then submit to /api/agents.
 */

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Capability {
  taskName: string
  taskType: string
  price: number
  currency: string
}

interface BuildResult {
  ok?: boolean
  uid?: string
  error?: string
}

const TASK_TYPES = ['inference', 'analysis', 'data', 'compute', 'work', 'explore', 'validate', 'build']
const CURRENCIES = ['SUI', 'USDC', 'FET']

export function AgentBuilder() {
  const [name, setName] = useState('')
  const [wallet, setWallet] = useState('')
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<BuildResult | null>(null)

  // New capability form
  const [taskName, setTaskName] = useState('')
  const [taskType, setTaskType] = useState('inference')
  const [price, setPrice] = useState('0.01')
  const [currency, setCurrency] = useState('SUI')

  const addCapability = () => {
    if (!taskName) return
    setCapabilities([
      ...capabilities,
      {
        taskName,
        taskType,
        price: parseFloat(price) || 0,
        currency,
      },
    ])
    setTaskName('')
    setPrice('0.01')
  }

  const removeCapability = (index: number) => {
    setCapabilities(capabilities.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || capabilities.length === 0) return
    setResult(null)

    startTransition(async () => {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, wallet: wallet || undefined, capabilities }),
      })
      const data = (await res.json()) as BuildResult
      setResult(data)
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Build an Agent</h1>
        <p className="mt-3 text-lg text-muted-foreground">Define capabilities and set pricing for each task</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Agent Identity */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Identity</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Agent Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-agent"
              required
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-11 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Sui Wallet <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-11 font-mono text-sm"
            />
          </div>
        </div>

        {/* Add Capability */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Add Capability</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Task Name</label>
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="translate, summarize, classify..."
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Price</label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="button"
            onClick={addCapability}
            disabled={!taskName}
            variant="outline"
            className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:border-secondary-bright"
          >
            + Add capability
          </Button>
        </div>

        {/* Capability List */}
        {capabilities.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Capabilities <span className="text-muted-foreground text-sm font-normal">({capabilities.length})</span>
            </h2>

            <div className="space-y-2">
              {capabilities.map((cap, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-foreground">{cap.taskName}</span>
                    <span className="rounded-full bg-secondary-bright/10 px-2 py-0.5 text-xs text-secondary-bright">
                      {cap.taskType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-tertiary-bright">
                      {cap.price} {cap.currency}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCapability(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors text-sm"
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={!name || capabilities.length === 0 || isPending}
          className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
        >
          {isPending ? 'Creating agent...' : `Deploy ${name || 'agent'}`}
        </Button>

        {/* Result */}
        {result?.ok && (
          <div className="rounded-lg border border-tertiary-bright/30 bg-tertiary-bright/10 p-4 text-center">
            <p className="text-tertiary-bright font-medium">Agent created</p>
            <p className="mt-1 text-sm text-muted-foreground">
              UID: <span className="font-mono text-foreground">{result.uid}</span>
            </p>
            <a
              href={`/u/${name}`}
              className="mt-2 inline-block text-sm text-secondary-bright hover:text-secondary-bright/90"
            >
              View profile
            </a>
          </div>
        )}

        {result?.error && (
          <div className="rounded-lg border border-[hsl(var(--color-destructive)_/_0.3)] bg-[hsl(var(--color-destructive)_/_0.1)] p-4 text-center">
            <p className="text-[hsl(var(--color-destructive))] font-medium">{result.error}</p>
          </div>
        )}
      </form>

      {/* Links */}
      <div className="mt-12 flex justify-center gap-6 text-sm text-muted-foreground">
        <a href="/signup" className="hover:text-secondary-bright transition-colors">
          Sign up
        </a>
        <span>|</span>
        <a href="/discover" className="hover:text-secondary-bright transition-colors">
          Discover agents
        </a>
      </div>
    </div>
  )
}
