import { useCallback, useEffect, useRef, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface HiredUnit {
  uid: string
  wallet: string | null
  skills: string[]
}

interface OrgUnit {
  uid: string
  name: string
}

const DIRECTOR_UIDS = ['roles:cto', 'roles:cmo', 'roles:cfo']

export function ChairmanPanel() {
  const [unit, setUnit] = useState<HiredUnit | null>(null)
  const [hiring, setHiring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

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

  const buildTeam = async () => {
    emitClick('ui:chairman:build-team')
    setBuilding(true)
    setError(null)

    try {
      await fetch('/api/chairman/build-team', { method: 'POST' })
    } catch {
      setError('Build team signal failed')
      setBuilding(false)
      return
    }

    // Poll for directors appearing in the substrate
    let elapsed = 0
    stopPolling()
    pollRef.current = setInterval(async () => {
      elapsed += 1000
      try {
        const res = await fetch('/api/export/units')
        const data = (await res.json()) as { units?: { uid: string; name: string }[] }
        const found = (data.units ?? []).filter((u) => DIRECTOR_UIDS.includes(u.uid))
        if (found.length > 0) setOrgUnits(found)
        if (found.length >= DIRECTOR_UIDS.length || elapsed >= 10000) {
          stopPolling()
          setBuilding(false)
        }
      } catch {
        if (elapsed >= 10000) {
          stopPolling()
          setBuilding(false)
        }
      }
    }, 1000)
  }

  const roleLabel = (uid: string) => uid.replace('roles:', '').toUpperCase()

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
          <div className="space-y-4">
            {/* CEO card */}
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

            {/* Build Team button */}
            {orgUnits.length === 0 && (
              <button
                type="button"
                onClick={buildTeam}
                disabled={building}
                className="px-6 py-3 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {building ? 'Building team…' : 'Build Team'}
              </button>
            )}

            {/* Director cards */}
            {orgUnits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Directors</p>
                {orgUnits.map((u) => (
                  <div
                    key={u.uid}
                    className="rounded-lg border border-[#252538] bg-[#0d0d14] px-5 py-4 flex items-center justify-between animate-fade-in"
                  >
                    <span className="text-sm font-medium text-violet-400">{roleLabel(u.uid)}</span>
                    <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">hired</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  )
}
