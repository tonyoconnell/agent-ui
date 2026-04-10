/**
 * AGENT CARD — Right Rail Detail Panel
 *
 * Shows focused entity details: unit, group, skill, path/highway, or signal.
 * Watches URL focus param; loads entity from GET /api/entity/:id
 *
 * STREAM 4: Display only. No inline editing yet (STREAM 5).
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface EntitySpec {
  name: string
  kind?: string
  type?: string
  model?: string
  systemPrompt?: string
  generation?: number
  tags?: string[]
}

interface EntityStats {
  successRate?: number
  balance?: number
  reputation?: number
  sampleCount?: number
  lastSignalAt?: string
  wallet?: string
  members?: number
}

interface RecentSignal {
  id: string
  from: string
  to: string
  skill?: string
  outcome: 'success' | 'failure'
  revenue: number
  ts: string
}

interface EntityResponse {
  kind: 'unit' | 'group' | 'not-found'
  id: string
  spec?: EntitySpec
  stats?: EntityStats
  recentSignals?: RecentSignal[]
  error?: string
}

interface Props {
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function truncateId(id: string, chars = 8): string {
  if (id.length <= chars) return id
  return id.slice(0, chars) + '...'
}

function formatTime(ts: string): string {
  try {
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`

    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`

    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  } catch {
    return ts
  }
}

function percentBar(value: number | undefined, max = 100): string {
  if (value === undefined) return ''
  const pct = Math.min(Math.max(value, 0), max)
  const blocks = Math.round(pct / (100 / 5))
  const filled = '█'.repeat(blocks)
  const empty = '░'.repeat(5 - blocks)
  return `${filled}${empty}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-24" />
      <div className="border-t border-slate-700 pt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function UnitCard({ entity }: { entity: EntityResponse }) {
  const spec = entity.spec!
  const stats = entity.stats!

  const successRate = stats.successRate ?? 0
  const isOwner = false // TODO: STREAM 5 — check auth context

  return (
    <div className="space-y-4 p-4">
      {/* Name & Type */}
      <div>
        <h2 className="text-xl font-semibold text-white">{spec.name}</h2>
        {spec.kind && (
          <p className="text-sm text-slate-400 mt-1">{spec.kind}</p>
        )}
      </div>

      <div className="border-t border-slate-700" />

      {/* Model & Generation */}
      {spec.model && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-500 uppercase">Model</div>
          <div className="text-sm font-mono text-slate-300">{spec.model}</div>
          {spec.generation && (
            <div className="text-xs text-slate-400">
              Gen {spec.generation} {spec.model && '(updated recently)'}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-700" />

      {/* Skills */}
      {spec.tags && spec.tags.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-500 uppercase">Skills</div>
          <div className="flex flex-wrap gap-2">
            {spec.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-slate-700 text-slate-100"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-700" />

      {/* Wallet */}
      {stats.wallet && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-500 uppercase">Wallet</div>
          <a
            href={`https://suiscan.xyz/mainnet/account/${stats.wallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-blue-400 hover:text-blue-300 hover:underline break-all"
          >
            {truncateId(stats.wallet, 16)}
          </a>
          {stats.balance !== undefined && (
            <div className="text-xs text-slate-400">
              Balance: ${stats.balance.toFixed(2)}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-700" />

      {/* Stats */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-slate-500 uppercase">Stats</div>

        {/* Success Rate */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-400">Success</span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-mono',
                successRate >= 80 ? 'text-green-400' : 'text-yellow-400'
              )}
            >
              {successRate.toFixed(0)}%
            </span>
            <span className="text-sm font-mono text-slate-600">
              {percentBar(successRate)}
            </span>
          </div>
        </div>

        {/* Call Count */}
        {stats.sampleCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Calls</span>
            <span className="text-sm font-mono text-slate-300">
              {stats.sampleCount}
            </span>
          </div>
        )}

        {/* Earnings */}
        {stats.balance !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Earnings</span>
            <span className="text-sm font-mono text-amber-400">
              ${stats.balance.toFixed(2)}
            </span>
          </div>
        )}

        {/* Reputation */}
        {stats.reputation !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Reputation</span>
            <span className="text-sm font-mono text-slate-300">
              {stats.reputation.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700" />

      {/* Recent Signals */}
      {entity.recentSignals && entity.recentSignals.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-500 uppercase">
            Recent Signals
          </div>
          <div className="space-y-1">
            {entity.recentSignals.map((sig) => (
              <div
                key={sig.id}
                className="flex items-center justify-between text-xs font-mono"
              >
                <div className="flex-1 text-slate-400">
                  {sig.outcome === 'success' ? '✓' : '✗'}{' '}
                  {sig.from} → {sig.to}
                  {sig.skill && ` · ${sig.skill}`}
                </div>
                <span className="text-amber-400">${sig.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Last: {stats.lastSignalAt ? formatTime(stats.lastSignalAt) : 'never'}
          </p>
        </div>
      )}

      <div className="border-t border-slate-700" />

      {/* System Prompt (Expandable) */}
      {spec.systemPrompt && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-500 uppercase">
            System Prompt
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
              [expand]
            </summary>
            <pre className="mt-2 overflow-auto max-h-24 bg-slate-900 p-2 rounded text-slate-300 whitespace-pre-wrap text-xs">
              {spec.systemPrompt}
            </pre>
          </details>
        </div>
      )}

      <div className="border-t border-slate-700" />

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded font-medium transition-colors"
          disabled
          title="STREAM 5: Run skill"
        >
          [Run skill ▾]
        </button>
        <a
          href={`/build?edit=${entity.id}`}
          className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded font-medium transition-colors text-center"
          title="Edit agent definition"
        >
          [Edit md]
        </a>
        <a
          href={`/chat?agent=${entity.id}`}
          className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded font-medium transition-colors text-center"
          title="Chat with agent"
        >
          [Chat ↗]
        </a>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP CARD
// ═══════════════════════════════════════════════════════════════════════════════

function GroupCard({ entity }: { entity: EntityResponse }) {
  const spec = entity.spec!
  const stats = entity.stats!

  return (
    <div className="space-y-4 p-4">
      {/* Name */}
      <div>
        <h2 className="text-xl font-semibold text-white">{spec.name}</h2>
        {spec.type && (
          <p className="text-sm text-slate-400 mt-1">{spec.type}</p>
        )}
      </div>

      <div className="border-t border-slate-700" />

      {/* Members */}
      <div>
        <div className="text-xs font-mono text-slate-500 uppercase">Members</div>
        <div className="text-lg font-semibold text-white mt-1">
          {stats.members ?? 0}
        </div>
      </div>

      <div className="border-t border-slate-700" />

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <a
          href={`/team?group=${entity.id}`}
          className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded font-medium transition-colors text-center"
          title="View team details"
        >
          [Team ↗]
        </a>
        <a
          href={`/dashboard?group=${entity.id}`}
          className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded font-medium transition-colors text-center"
          title="View dashboard"
        >
          [Dashboard ↗]
        </a>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOT FOUND
// ═══════════════════════════════════════════════════════════════════════════════

function NotFound({ id }: { id: string }) {
  return (
    <div className="p-4 text-center space-y-3">
      <p className="text-slate-400">Entity not found</p>
      {id && (
        <p className="text-xs font-mono text-slate-500">{truncateId(id, 20)}</p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AgentCard({ className }: Props) {
  const [focusId, setFocusId] = useState<string | null>(null)
  const [entity, setEntity] = useState<EntityResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Read focus from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const id = params.get('focus') || null
    setFocusId(id)
  }, [])

  // Load entity when focus changes
  useEffect(() => {
    if (!focusId) {
      setEntity(null)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/api/entity/${focusId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: EntityResponse) => {
        setEntity(data)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setEntity(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [focusId])

  // No focus param
  if (!focusId) {
    return (
      <Card className={cn('h-full bg-slate-800 border-slate-700 flex flex-col', className)}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Click a unit or group to see details</p>
        </div>
      </Card>
    )
  }

  // Loading
  if (loading) {
    return (
      <Card className={cn('h-full bg-slate-800 border-slate-700', className)}>
        <LoadingSkeleton />
      </Card>
    )
  }

  // Error
  if (error || !entity || entity.kind === 'not-found') {
    return (
      <Card className={cn('h-full bg-slate-800 border-slate-700 flex flex-col', className)}>
        <NotFound id={focusId} />
      </Card>
    )
  }

  // Render entity
  return (
    <Card
      className={cn(
        'h-full bg-slate-800 border-slate-700 flex flex-col overflow-hidden',
        className
      )}
    >
      <div className="flex-1 overflow-y-auto">
        {entity.kind === 'unit' && <UnitCard entity={entity} />}
        {entity.kind === 'group' && <GroupCard entity={entity} />}
      </div>
    </Card>
  )
}
