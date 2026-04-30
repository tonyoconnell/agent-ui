// src/components/u/FleetIsland.tsx — Fleet view for /u/fleet
//
// Shows the transitive tree of ScopedWallets rooted in the user's Sui address.
// Total exposure = sum of all daily caps in the tree.
// Paused nodes are shown greyed out.
//
// Data source: GET /api/u/fleet?address=<suiAddress>
// Address is derived from IDB vault (no server-side session needed).

import { AlertCircle, ChevronRight, Layers, Loader2, PauseCircle, RefreshCw, Shield, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ─── types ─────────────────────────────────────────────────────────────────────

export interface FleetNode {
  walletId: string
  ownerLabel: string // "You" or agent name
  agentLabel: string // agent uid or "unknown"
  dailyCapMist: string // bigint as string
  spentTodayMist: string // bigint as string
  paused: boolean
  depth: number
  children: FleetNode[]
}

// ─── constants ─────────────────────────────────────────────────────────────────

const MIST_PER_SUI = 1_000_000_000n
const SUI_PRICE_USD = 1.5 // placeholder; ideally fetched at runtime

// ─── helpers ───────────────────────────────────────────────────────────────────

function mistToSui(mistStr: string): string {
  const mist = BigInt(mistStr)
  const whole = mist / MIST_PER_SUI
  const frac = mist % MIST_PER_SUI
  const fracStr = frac.toString().padStart(9, '0').slice(0, 4)
  return `${whole}.${fracStr}`
}

function mistToUsd(mistStr: string): string {
  const sui = parseFloat(mistToSui(mistStr))
  return `$${(sui * SUI_PRICE_USD).toFixed(2)}`
}

/** Sum daily caps for a tree (flat traversal). */
function sumDailyCaps(nodes: FleetNode[]): bigint {
  let total = 0n
  function walk(ns: FleetNode[]) {
    for (const n of ns) {
      total += BigInt(n.dailyCapMist)
      if (n.children.length > 0) walk(n.children)
    }
  }
  walk(nodes)
  return total
}

/** Read the active Sui address from the vault (best-effort). */
async function readAddressFromVault(): Promise<string | null> {
  try {
    const Vault = await import('@/components/u/lib/vault/vault')
    const wallets = await Vault.listWallets()
    const sui = wallets.find((w) => w.chain === 'sui')
    return sui?.address ?? null
  } catch {
    return null
  }
}

// ─── sub-components ─────────────────────────────────────────────────────────────

const DEPTH_INDENT: Record<number, string> = {
  0: '',
  1: 'ml-6',
  2: 'ml-12',
}

interface FleetNodeCardProps {
  node: FleetNode
}

function FleetNodeCard({ node }: FleetNodeCardProps) {
  const indent = DEPTH_INDENT[Math.min(node.depth, 2)] ?? 'ml-12'
  const paused = node.paused

  const capSui = mistToSui(node.dailyCapMist)
  const capUsd = mistToUsd(node.dailyCapMist)
  const spentUsd = mistToUsd(node.spentTodayMist)
  const spentMist = BigInt(node.spentTodayMist)
  const capMist = BigInt(node.dailyCapMist)
  const pct = capMist > 0n ? Number((spentMist * 100n) / capMist) : 0

  return (
    <div className={cn('space-y-2', indent)}>
      <Card
        className={cn(
          'border transition-colors',
          paused ? 'bg-card border-border opacity-60' : 'bg-card border-border',
        )}
      >
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              {paused ? (
                <PauseCircle className="w-4 h-4 text-muted-foreground shrink-0" aria-label="Paused" />
              ) : (
                <Wallet className="w-4 h-4 text-primary-bright shrink-0" aria-label="Active wallet" />
              )}
              <span
                className={cn('font-mono text-xs truncate', paused ? 'text-muted-foreground' : 'text-foreground')}
                title={node.agentLabel}
              >
                {node.agentLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {paused && (
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground bg-transparent">
                  paused
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] border-transparent',
                  node.depth === 0
                    ? 'bg-[hsl(var(--color-primary-bright)/0.15)] text-[hsl(var(--color-primary-bright))]'
                    : node.depth === 1
                      ? 'bg-[hsl(var(--color-secondary-bright)/0.15)] text-[hsl(var(--color-secondary-bright))]'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {node.ownerLabel}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 pb-3 space-y-2">
          {/* Cap row */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Daily cap</span>
            <span className={cn('font-semibold', paused ? 'text-muted-foreground' : 'text-font')}>
              {capUsd}
              <span className="text-muted-foreground font-normal ml-1">({capSui} SUI)</span>
            </span>
          </div>

          {/* Spent today row */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Spent today</span>
            <span className={cn(paused ? 'text-muted-foreground' : 'text-foreground')}>{spentUsd}</span>
          </div>

          {/* Progress bar */}
          {capMist > 0n && (
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  paused ? 'bg-muted-foreground/40' : pct >= 90 ? 'bg-destructive' : pct >= 60 ? 'bg-gold' : 'bg-[hsl(var(--color-primary-bright))]',
                )}
                style={{ width: `${Math.min(pct, 100)}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${pct}% of daily cap spent`}
              />
            </div>
          )}

          {/* Wallet ID (truncated) */}
          <p className="font-mono text-[10px] text-muted-foreground truncate" title={node.walletId}>
            {node.walletId.slice(0, 20)}…
          </p>
        </CardContent>
      </Card>

      {/* Children */}
      {node.children.length > 0 && (
        <div className="space-y-2">
          {node.children.map((child) => (
            <FleetNodeCard key={child.walletId} node={child} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── main island ───────────────────────────────────────────────────────────────

export function FleetIsland() {
  const [nodes, setNodes] = useState<FleetNode[]>([])
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const addr = await readAddressFromVault()
      if (!addr) {
        setAddress(null)
        setNodes([])
        setLoading(false)
        return
      }
      setAddress(addr)

      const res = await fetch(`/api/u/fleet?address=${encodeURIComponent(addr)}`)
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { nodes: FleetNode[] }
      setNodes(data.nodes ?? [])
      emitClick('ui:fleet:load')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fleet')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const totalCapMist = sumDailyCaps(nodes)
  const totalCapUsd = mistToUsd(totalCapMist.toString())
  const totalCapSui = mistToSui(totalCapMist.toString())

  const totalWallets = (function count(ns: FleetNode[]): number {
    return ns.reduce((acc, n) => acc + 1 + count(n.children), 0)
  })(nodes)

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-font mb-1 flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary-bright" />
              Agent Fleet
            </h1>
            <p className="text-muted-foreground text-sm">
              ScopedWallets rooted in your address. Total exposure across all agents.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              emitClick('ui:fleet:refresh')
              load()
            }}
            disabled={loading}
            aria-label="Refresh fleet"
            className="text-muted-foreground hover:text-font hover:bg-muted shrink-0"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* No vault / no address */}
        {!loading && !error && address === null && (
          <div className="rounded-xl border border-border bg-card px-6 py-10 text-center space-y-2">
            <Shield className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">No wallet found</p>
            <p className="text-muted-foreground text-xs">
              Set up your wallet on the{' '}
              <a href="/u/save" className="text-muted-foreground underline underline-offset-2 hover:text-font">
                Save Wallet
              </a>{' '}
              page first.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading fleet…</span>
          </div>
        )}

        {/* Empty fleet */}
        {!loading && !error && address && nodes.length === 0 && (
          <div className="rounded-xl border border-border bg-card px-6 py-10 text-center space-y-2">
            <Wallet className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">No agent wallets found</p>
            <p className="text-muted-foreground text-xs">
              Create a{' '}
              <a href="/u/agents" className="text-muted-foreground underline underline-offset-2 hover:text-font">
                ScopedWallet
              </a>{' '}
              to let an agent spend on your behalf.
            </p>
          </div>
        )}

        {/* Exposure summary */}
        {!loading && !error && nodes.length > 0 && (
          <>
            <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Total exposure</p>
                <p className="text-2xl font-bold text-font">
                  {totalCapUsd}
                  <span className="text-base font-normal text-muted-foreground ml-2">/day</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalCapSui} SUI across {totalWallets} wallet{totalWallets !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>

            {/* Tree */}
            <div className="space-y-3">
              {nodes.map((node) => (
                <FleetNodeCard key={node.walletId} node={node} />
              ))}
            </div>
          </>
        )}

        {/* Back link */}
        <div className="pt-2 text-center">
          <a href="/u" className="text-muted-foreground text-xs hover:text-foreground underline underline-offset-2">
            Back to wallet
          </a>
        </div>
      </div>
    </div>
  )
}
