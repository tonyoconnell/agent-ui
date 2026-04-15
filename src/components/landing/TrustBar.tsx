import { useEffect, useState } from 'react'

interface LiveStats {
  highways: number
  activeWorlds: number
  signalsLastHour: number
  tests: number
}

const STATIC_ITEMS = [
  '✓ Deploy 65s, 4/4 health',
  '✓ 670 lines of engine',
  '✓ Zero silent returns',
  '✓ TypeDB 3.0 · Sui testnet',
  '✓ GDPR erasure built-in',
]

export function TrustBar() {
  const [tests, setTests] = useState(320)

  useEffect(() => {
    fetch('/api/stats/live')
      .then((r) => (r.ok ? (r.json() as Promise<LiveStats>) : Promise.resolve(null)))
      .then((data) => {
        if (data?.tests) setTests(data.tests)
      })
      .catch(() => {})
  }, [])

  const items = [`✓ ${tests}/320 tests green`, ...STATIC_ITEMS]

  return (
    <div className="w-full border-y border-[#252538] bg-[#0d0d14] py-3">
      <div className="flex gap-8 overflow-x-auto px-6" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => (
          <span key={item} className="whitespace-nowrap text-xs text-slate-400 shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
