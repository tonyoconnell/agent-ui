/**
 * Marketplace — Service marketplace for the ONE World
 *
 * Browse services with prices. Shows cheapest provider per task.
 * Dark theme grid cards with price badges, provider reputation.
 */

import { useState, useEffect, useCallback } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Service {
  provider: string
  task: string
  price: number
  strength: number
  revenue: number
  calls: number
}

interface RevenueData {
  gdp: number
  total_revenue: number
  total_transactions: number
  top_earners: { uid: string; revenue: number }[]
}

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_SERVICES: Service[] = [
  { provider: 'oracle', task: 'complete', price: 0.05, strength: 42, revenue: 12.5, calls: 250 },
  { provider: 'analyst', task: 'analyze', price: 0.03, strength: 38, revenue: 8.7, calls: 290 },
  { provider: 'scout', task: 'observe', price: 0.01, strength: 35, revenue: 3.2, calls: 320 },
  { provider: 'translator', task: 'translate', price: 0.04, strength: 28, revenue: 6.4, calls: 160 },
  { provider: 'validator', task: 'verify', price: 0.02, strength: 25, revenue: 4.1, calls: 205 },
  { provider: 'synthesizer', task: 'summarize', price: 0.06, strength: 22, revenue: 9.6, calls: 160 },
  { provider: 'classifier', task: 'classify', price: 0.02, strength: 20, revenue: 2.8, calls: 140 },
  { provider: 'generator', task: 'generate', price: 0.08, strength: 18, revenue: 11.2, calls: 140 },
]

const FALLBACK_REVENUE: RevenueData = {
  gdp: 58.5,
  total_revenue: 58.5,
  total_transactions: 1665,
  top_earners: [
    { uid: 'oracle', revenue: 12.5 },
    { uid: 'generator', revenue: 11.2 },
    { uid: 'synthesizer', revenue: 9.6 },
    { uid: 'analyst', revenue: 8.7 },
  ],
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Marketplace() {
  const [services, setServices] = useState<Service[]>(FALLBACK_SERVICES)
  const [revenue, setRevenue] = useState<RevenueData>(FALLBACK_REVENUE)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [svcRes, revRes] = await Promise.all([
        fetch(`/api/marketplace${filter ? `?type=${filter}` : ''}`),
        fetch('/api/revenue'),
      ])
      if (svcRes.ok) {
        const svcData = await svcRes.json()
        if (svcData.services?.length) setServices(svcData.services)
      }
      if (revRes.ok) {
        const revData = await revRes.json()
        if (revData.gdp !== undefined) setRevenue(revData)
      }
    } catch {
      // Fallback data already set
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  // Unique task types for filter
  const taskTypes = [...new Set(services.map(s => s.task))]

  // Cheapest provider per task
  const cheapest = new Map<string, Service>()
  for (const s of services) {
    const existing = cheapest.get(s.task)
    if (!existing || s.price < existing.price) cheapest.set(s.task, s)
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-slate-400">Services, prices, reputation. Revenue is pheromone.</p>
      </div>

      {/* GDP Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="GDP" value={`${revenue.gdp.toFixed(2)}`} unit="tokens" />
        <StatCard label="Transactions" value={`${revenue.total_transactions}`} />
        <StatCard label="Services" value={`${services.length}`} />
        <StatCard label="Top Earner" value={revenue.top_earners[0]?.uid || '—'} sub={revenue.top_earners[0] ? `${revenue.top_earners[0].revenue.toFixed(2)} tokens` : ''} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === '' ? 'bg-indigo-600 text-white' : 'bg-[#161622] text-slate-400 hover:text-white border border-[#252538]'
          }`}
        >
          All
        </button>
        {taskTypes.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === t ? 'bg-indigo-600 text-white' : 'bg-[#161622] text-slate-400 hover:text-white border border-[#252538]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-slate-500 text-center py-12">Loading marketplace...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services
            .filter(s => !filter || s.task === filter)
            .map(service => (
              <ServiceCard
                key={`${service.provider}:${service.task}`}
                service={service}
                isCheapest={cheapest.get(service.task)?.provider === service.provider}
              />
            ))}
        </div>
      )}

      {/* Top Earners */}
      {revenue.top_earners.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Top Earners</h2>
          <div className="bg-[#161622] rounded-xl border border-[#252538] overflow-hidden">
            {revenue.top_earners.map((earner, i) => (
              <div
                key={earner.uid}
                className="flex items-center justify-between px-5 py-3 border-b border-[#252538] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm w-6">#{i + 1}</span>
                  <span className="font-mono text-sm">{earner.uid}</span>
                </div>
                <span className="text-emerald-400 font-mono text-sm">{earner.revenue.toFixed(2)} tokens</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <div className="bg-[#161622] rounded-xl border border-[#252538] p-4">
      <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm text-slate-500 ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

function ServiceCard({ service, isCheapest }: { service: Service; isCheapest: boolean }) {
  const reputationPct = Math.min(100, (service.strength / 50) * 100)

  return (
    <div className="bg-[#161622] rounded-xl border border-[#252538] p-5 hover:border-indigo-500/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono text-sm text-white">{service.provider}</div>
          <div className="text-slate-500 text-xs mt-0.5">{service.task}</div>
        </div>
        <div className="flex gap-1.5">
          {isCheapest && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              cheapest
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
            {service.price.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Reputation bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>reputation</span>
          <span>{service.strength.toFixed(1)}</span>
        </div>
        <div className="h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all"
            style={{ width: `${reputationPct}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{service.calls} calls</span>
        <span className="text-emerald-400/70">{service.revenue.toFixed(2)} earned</span>
      </div>
    </div>
  )
}
