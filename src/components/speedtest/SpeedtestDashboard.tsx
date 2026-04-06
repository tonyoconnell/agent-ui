/**
 * Speedtest Dashboard
 * Real-time benchmark results with histograms and metrics
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BenchmarkResult, SpeedtestResult } from '@/lib/speedtest'

interface Props {
  onResults?: (results: SpeedtestResult) => void
}

const BASELINE_THRESHOLDS: Record<string, number> = {
  signal_routing: 1.0, // < 1ms
  pheromone_mark: 0.5,
  pheromone_warn: 0.5,
  fade_decay: 5.0,
  ask_latency: 100.0,
  chain_depth: 100.0,
  enqueue_drain: 2.0,
  highways_query: 50.0,
  select_routing: 2.0,
  follow_routing: 1.0,
}

function MetricCard({ result, baseline }: { result: BenchmarkResult; baseline: number }) {
  const isGood = result.p95_ms < baseline
  const ratio = ((result.p95_ms / baseline) * 100).toFixed(0)

  return (
    <Card className="p-4 border border-slate-700 bg-slate-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-mono text-slate-300">{result.name}</h3>
        <Badge variant={isGood ? 'default' : 'destructive'} className="text-xs">
          {ratio}% of target
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="text-xs text-slate-500">p50</div>
          <div className="text-lg font-mono font-bold text-cyan-400">{result.p50_ms.toFixed(2)}ms</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">p95</div>
          <div className="text-lg font-mono font-bold text-cyan-400">{result.p95_ms.toFixed(2)}ms</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">p99</div>
          <div className="text-lg font-mono font-bold text-cyan-400">{result.p99_ms.toFixed(2)}ms</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">mean</div>
          <div className="text-lg font-mono font-bold text-slate-400">{result.mean_ms.toFixed(2)}ms</div>
        </div>
      </div>

      {/* Simple bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-700 rounded overflow-hidden">
          <div
            className={`h-full ${isGood ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min((result.p95_ms / baseline) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">{result.runs} runs</span>
      </div>
    </Card>
  )
}

export function SpeedtestDashboard({ onResults }: Props) {
  const [results, setResults] = useState<SpeedtestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runTests() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/speedtest/run')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      setResults(data)
      onResults?.(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Speed Benchmarks</h1>
          <p className="text-sm text-slate-400 mt-1">
            {results ? `Last run: ${new Date(results.timestamp).toLocaleTimeString()}` : 'No results yet'}
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded font-mono text-sm font-bold transition-colors"
        >
          {loading ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="p-4 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm font-mono">{error}</div>}

      {/* Results Grid */}
      {results && (
        <>
          {/* Summary */}
          <Card className="p-6 border border-slate-700 bg-slate-900/50">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Slowest</div>
                <div className="text-xl font-mono font-bold text-orange-400">
                  {Math.max(...Object.values(results.results).map((r) => r.p95_ms)).toFixed(1)}ms
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Fastest</div>
                <div className="text-xl font-mono font-bold text-green-400">
                  {Math.min(...Object.values(results.results).map((r) => r.p95_ms)).toFixed(3)}ms
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Passes</div>
                <div className="text-xl font-mono font-bold text-cyan-400">
                  {Object.entries(results.results).filter(([k, r]) => r.p95_ms < (BASELINE_THRESHOLDS[k] || 100)).length}/
                  {Object.entries(results.results).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Total Ops</div>
                <div className="text-xl font-mono font-bold text-slate-300">
                  {Object.values(results.results).reduce((sum, r) => sum + r.runs, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results.results).map(([key, result]) => (
              <MetricCard key={key} result={result} baseline={BASELINE_THRESHOLDS[key] || 100} />
            ))}
          </div>

          {/* JSON Export */}
          <Card className="p-4 border border-slate-700 bg-slate-900/50">
            <details>
              <summary className="cursor-pointer text-sm font-mono text-slate-400 hover:text-slate-300">
                Raw JSON
              </summary>
              <pre className="mt-3 text-xs bg-slate-950 p-3 rounded overflow-auto max-h-64 text-slate-400">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </Card>
        </>
      )}

      {/* Idle state */}
      {!results && !loading && (
        <Card className="p-12 border border-slate-700 bg-slate-900/50 text-center">
          <p className="text-slate-400 mb-4">Run the full test suite to see benchmarks</p>
          <button
            onClick={runTests}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-mono font-bold transition-colors"
          >
            Start Speedtest
          </button>
        </Card>
      )}
    </div>
  )
}
