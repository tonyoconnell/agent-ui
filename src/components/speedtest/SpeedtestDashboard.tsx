/**
 * Speedtest Dashboard
 * Real-time benchmark results with histograms and metrics
 */

'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
    <Card className="p-4 border border-border bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-mono text-foreground">{result.name}</h3>
        <Badge variant={isGood ? 'default' : 'destructive'} className="text-xs">
          {ratio}% of target
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="text-xs text-muted-foreground">p50</div>
          <div className="text-lg font-mono font-bold text-primary-bright">{result.p50_ms.toFixed(2)}ms</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">p95</div>
          <div className="text-lg font-mono font-bold text-primary-bright">{result.p95_ms.toFixed(2)}ms</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">p99</div>
          <div className="text-lg font-mono font-bold text-primary-bright">{result.p99_ms.toFixed(2)}ms</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">mean</div>
          <div className="text-lg font-mono font-bold text-foreground">{result.mean_ms.toFixed(2)}ms</div>
        </div>
      </div>

      {/* Simple bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
          <div
            className={`h-full ${isGood ? 'bg-tertiary-bright' : 'bg-gold'}`}
            style={{ width: `${Math.min((result.p95_ms / baseline) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{result.runs} runs</span>
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

      const data = (await response.json()) as SpeedtestResult
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
          <h1 className="text-2xl font-bold text-font">Speed Benchmarks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {results ? `Last run: ${new Date(results.timestamp).toLocaleTimeString()}` : 'No results yet'}
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-primary-bright hover:bg-primary-bright/80 disabled:bg-muted text-black rounded font-mono text-sm font-bold transition-colors"
        >
          {loading ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/20 border border-destructive/40 rounded text-destructive text-sm font-mono">
          {error}
        </div>
      )}

      {/* Results Grid */}
      {results && (
        <>
          {/* Summary */}
          <Card className="p-6 border border-border bg-card">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Slowest</div>
                <div className="text-xl font-mono font-bold text-gold">
                  {Math.max(...Object.values(results.results).map((r) => r.p95_ms)).toFixed(1)}ms
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Fastest</div>
                <div className="text-xl font-mono font-bold text-tertiary-bright">
                  {Math.min(...Object.values(results.results).map((r) => r.p95_ms)).toFixed(3)}ms
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Passes</div>
                <div className="text-xl font-mono font-bold text-primary-bright">
                  {
                    Object.entries(results.results).filter(([k, r]) => r.p95_ms < (BASELINE_THRESHOLDS[k] || 100))
                      .length
                  }
                  /{Object.entries(results.results).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Ops</div>
                <div className="text-xl font-mono font-bold text-font">
                  {Object.values(results.results)
                    .reduce((sum, r) => sum + r.runs, 0)
                    .toLocaleString()}
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
          <Card className="p-4 border border-border bg-card">
            <details>
              <summary className="cursor-pointer text-sm font-mono text-muted-foreground hover:text-foreground">
                Raw JSON
              </summary>
              <pre className="mt-3 text-xs bg-background p-3 rounded overflow-auto max-h-64 text-foreground">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </Card>
        </>
      )}

      {/* Idle state */}
      {!results && !loading && (
        <Card className="p-12 border border-border bg-card text-center">
          <p className="text-muted-foreground mb-4">Run the full test suite to see benchmarks</p>
          <button
            onClick={runTests}
            className="px-6 py-3 bg-primary-bright hover:bg-primary-bright/80 text-black rounded font-mono font-bold transition-colors"
          >
            Start Speedtest
          </button>
        </Card>
      )}
    </div>
  )
}
