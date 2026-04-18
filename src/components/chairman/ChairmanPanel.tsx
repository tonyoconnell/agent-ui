import { useCallback, useEffect, useRef, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { OrgChart } from './OrgChart'

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

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-slate-200">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <h1 className="text-2xl font-semibold mb-1">Chairman</h1>
        <p className="text-slate-500 text-sm">One click. One CEO. The org builds itself.</p>
      </div>

      {/* Content */}
      {!unit ? (
        /* Pre-hire: centered button */
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <button
            type="button"
            onClick={hireCeo}
            disabled={hiring}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/40"
          >
            {hiring ? 'Hiring CEO…' : 'Hire CEO'}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : (
        /* Post-hire: org chart fills remaining height */
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <OrgChart unit={unit} orgUnits={orgUnits} building={building} />
          </div>

          {/* Controls below chart */}
          <div className="px-8 py-5 shrink-0 flex items-center gap-4 border-t border-[#1a1a2e]">
            {orgUnits.length === 0 && (
              <button
                type="button"
                onClick={buildTeam}
                disabled={building}
                className="px-6 py-2.5 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {building ? 'Building team…' : 'Build Team'}
              </button>
            )}
            {orgUnits.length > 0 && (
              <span className="text-xs text-slate-500">
                {orgUnits.length} director{orgUnits.length !== 1 ? 's' : ''} hired —{' '}
                {orgUnits.map((u) => u.uid.replace('roles:', '').toUpperCase()).join(', ')}
              </span>
            )}
            {error && <p className="text-sm text-red-400 ml-auto">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
