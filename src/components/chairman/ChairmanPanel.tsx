import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface HiredUnit {
  uid: string
  wallet: string | null
  skills: string[]
}

export function ChairmanPanel() {
  const [unit, setUnit] = useState<HiredUnit | null>(null)
  const [hiring, setHiring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hireCeo = async () => {
    emitClick('ui:chairman:hire-ceo')
    setHiring(true)
    setError(null)
    try {
      const res = await fetch('/api/chairman/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ceo' }),
      })
      const data = (await res.json()) as { unit?: HiredUnit; error?: string }
      if (data.unit) {
        setUnit(data.unit)
      } else {
        setError(data.error ?? 'Hire failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setHiring(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Chairman</h1>
        <p className="text-slate-500 text-sm mb-8">One click. One CEO. The org builds itself.</p>

        {!unit ? (
          <button
            type="button"
            onClick={hireCeo}
            disabled={hiring}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {hiring ? 'Hiring CEO…' : 'Hire CEO'}
          </button>
        ) : (
          <div className="rounded-lg border border-[#252538] bg-[#0d0d14] px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-indigo-400">{unit.uid}</span>
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">hired</span>
            </div>
            {unit.wallet && <p className="text-xs text-slate-500 font-mono mb-3 truncate">{unit.wallet}</p>}
            <div className="flex gap-2 flex-wrap">
              {unit.skills.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded bg-[#1a1a2e] text-slate-400">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  )
}
