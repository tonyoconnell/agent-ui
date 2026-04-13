/**
 * SignupForm — Name reservation for name.one.ie
 *
 * Fields: name, unit-kind (human/agent/llm), optional Sui wallet
 * Posts to /api/signup
 */

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SignupResult {
  ok?: boolean
  uid?: string
  error?: string
}

export function SignupForm() {
  const [name, setName] = useState('')
  const [unitKind, setUnitKind] = useState<'human' | 'agent' | 'llm'>('human')
  const [wallet, setWallet] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SignupResult | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    startTransition(async () => {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, unitKind, wallet: wallet || undefined }),
      })
      const data = (await res.json()) as SignupResult
      setResult(data)
      if (data.ok) {
        setName('')
        setWallet('')
      }
    })
  }

  const kinds = [
    { value: 'human' as const, label: 'Human', desc: 'A person' },
    { value: 'agent' as const, label: 'Agent', desc: 'Autonomous software' },
    { value: 'llm' as const, label: 'LLM', desc: 'Language model' },
  ]

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">Reserve your name</h1>
        <p className="mt-3 text-lg text-slate-400">
          Claim <span className="text-violet-400 font-mono">{name || 'you'}.one.ie</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Name</label>
          <div className="relative">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="your-name"
              required
              maxLength={32}
              className="bg-[#161622] border-[#252538] text-white placeholder:text-slate-600 h-12 text-lg font-mono pr-24"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-mono">.one.ie</span>
          </div>
          <p className="text-xs text-slate-500">Lowercase letters, numbers, and hyphens only</p>
        </div>

        {/* Unit Kind */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">What are you?</label>
          <div className="grid grid-cols-3 gap-3">
            {kinds.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setUnitKind(k.value)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  unitKind === k.value
                    ? 'border-violet-500 bg-violet-500/10 text-white'
                    : 'border-[#252538] bg-[#161622] text-slate-400 hover:border-[#353548] hover:text-slate-300'
                }`}
              >
                <div className="text-sm font-semibold">{k.label}</div>
                <div className="mt-1 text-xs opacity-60">{k.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Sui Wallet <span className="text-slate-500">(optional)</span>
          </label>
          <Input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
            className="bg-[#161622] border-[#252538] text-white placeholder:text-slate-600 h-12 font-mono text-sm"
          />
          <p className="text-xs text-slate-500">Link a Sui wallet for x402 payments</p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!name || isPending}
          className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white"
        >
          {isPending ? 'Reserving...' : `Reserve ${name || 'name'}.one.ie`}
        </Button>

        {/* Result */}
        {result?.ok && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-emerald-400 font-medium">Reserved successfully</p>
            <p className="mt-1 text-sm text-slate-400">
              UID: <span className="font-mono text-white">{result.uid}</span>
            </p>
          </div>
        )}

        {result?.error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-red-400 font-medium">{result.error}</p>
          </div>
        )}
      </form>

      {/* Links */}
      <div className="mt-12 flex justify-center gap-6 text-sm text-slate-500">
        <a href="/build" className="hover:text-violet-400 transition-colors">
          Build an agent
        </a>
        <span>|</span>
        <a href="/discover" className="hover:text-violet-400 transition-colors">
          Discover agents
        </a>
      </div>
    </div>
  )
}
