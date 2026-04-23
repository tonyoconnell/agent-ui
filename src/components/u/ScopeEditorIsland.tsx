// src/components/u/ScopeEditorIsland.tsx — View and edit an agent's ScopedWallet parameters.
//
// Displays the current cap, allowlist, and agent address fetched from chain.
// Lets the owner edit cap amount and allowlist entries.
//
// Move contract: one::scoped_wallet (src/move/one/sources/scoped_wallet.move)
// Fields: owner, agent, daily_cap, spent_today, paused, allowlist
//
// NOTE: Cap / allowlist updates require a Move `update_cap` entry function that
// does not yet exist in the contract. The save handler is stubbed with a comment
// explaining what the transaction would look like once that entry is deployed.

import { useState, useEffect, useCallback } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  Loader2,
  Plus,
  Save,
  Shield,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { emitClick } from '@/lib/ui-signal'
import { UNav } from './UNav'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** On-chain ScopedWallet fields returned by getScopedWallet(). */
interface ScopedWalletData {
  walletId: string
  owner: string
  agent: string
  dailyCap: number          // MIST per epoch
  spentToday: number        // MIST spent in current epoch
  epochOfLastReset: number
  paused: boolean
  allowlist: string[]       // permitted recipient addresses; empty = any
}

interface ScopeEditorIslandProps {
  agentId: string           // from URL params
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MIST_PER_SUI = 1_000_000_000

function mistToSui(mist: number): string {
  return (mist / MIST_PER_SUI).toFixed(4)
}

function suiToMist(sui: string): number {
  const n = parseFloat(sui)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n * MIST_PER_SUI)
}

function shortAddr(addr: string): string {
  if (addr.length <= 16) return addr
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

// ---------------------------------------------------------------------------
// Fetch scoped wallet from chain
// ---------------------------------------------------------------------------
// This calls getScopedWallet() from the scoped-wallet TypeScript client once
// that module exists. Until then the function hits a stub API endpoint that
// can return the object from a Sui RPC getObject call.
async function fetchScopedWallet(agentId: string): Promise<ScopedWalletData | null> {
  try {
    const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/scope`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { scope?: ScopedWalletData }
    return json.scope ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScopeEditorIsland({ agentId }: ScopeEditorIslandProps) {
  const [scope, setScope] = useState<ScopedWalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  // Editable fields
  const [capSui, setCapSui] = useState('')
  const [allowlist, setAllowlist] = useState<string[]>([])
  const [newEntry, setNewEntry] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const data = await fetchScopedWallet(agentId)
    setScope(data)
    if (data) {
      setCapSui(mistToSui(data.dailyCap))
      setAllowlist(data.allowlist)
    }
    setLoading(false)
  }, [agentId])

  useEffect(() => {
    load()
  }, [load])

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    if (!scope) return

    emitClick('ui:scope:save', { agentId })
    setSaving(true)
    setError(null)
    setSaveOk(false)

    try {
      const newCapMist = suiToMist(capSui)
      if (newCapMist <= 0) {
        setError('Daily cap must be greater than 0 SUI.')
        setSaving(false)
        return
      }

      // ------------------------------------------------------------------
      // TODO: requires Move `update_cap` entry function in one::scoped_wallet.
      //
      // Once that entry is deployed, the transaction would be built as:
      //
      //   const tx = new Transaction()
      //   tx.moveCall({
      //     target: `${PACKAGE_ID}::scoped_wallet::update_cap`,
      //     typeArguments: ['0x2::sui::SUI'],
      //     arguments: [
      //       tx.object(scope.walletId),   // &mut ScopedWallet<T>
      //       tx.pure.u64(newCapMist),      // new daily_cap
      //       tx.pure(allowlist),           // new allowlist (vector<address>)
      //     ],
      //   })
      //
      // Then sign and execute with the owner's keypair via useSigner().
      // ------------------------------------------------------------------

      // For now, persist the intended values to the substrate so they
      // can be applied once the Move entry exists.
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/scope`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dailyCap: newCapMist, allowlist }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      setSaveOk(true)
      // Refresh from chain after save
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Allowlist helpers
  // ---------------------------------------------------------------------------
  const addEntry = () => {
    const trimmed = newEntry.trim()
    if (!trimmed || allowlist.includes(trimmed)) {
      setNewEntry('')
      return
    }
    setAllowlist((prev) => [...prev, trimmed])
    setNewEntry('')
  }

  const removeEntry = (addr: string) => {
    setAllowlist((prev) => prev.filter((a) => a !== addr))
  }

  // ---------------------------------------------------------------------------
  // Render: loading
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <UNav active="home" />
        <div className="max-w-2xl mx-auto px-6 py-8 flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: no scope
  // ---------------------------------------------------------------------------
  if (!scope) {
    return (
      <div className="min-h-screen bg-background">
        <UNav active="home" />
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => (window.location.href = `/u/agents/${agentId}`)}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            Back to Agent
          </Button>

          <Card className="border-border/60">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-muted ring-1 ring-border">
                <Shield className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight mb-2">No scope set</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                This agent does not have a ScopedWallet. Create one via the Move contract to
                grant it bounded spending authority.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: editor
  // ---------------------------------------------------------------------------
  const usedPct = scope.dailyCap > 0 ? Math.min((scope.spentToday / scope.dailyCap) * 100, 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <UNav active="agents" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => (window.location.href = `/u/agents/${agentId}`)}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          Back to Agent
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Scope Editor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Agent: <code className="font-mono text-xs">{agentId}</code>
          </p>
        </div>

        <div className="space-y-4">
          {/* Agent address */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/20">
                  <Wallet className="h-4 w-4 text-sky-400" strokeWidth={1.75} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold tracking-tight">Agent Address</CardTitle>
                  <CardDescription className="text-xs">Authorised to call spend()</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <code className="block font-mono text-xs text-foreground/80 break-all leading-relaxed">
                {scope.agent}
              </code>
            </CardContent>
          </Card>

          {/* Daily cap + usage */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <Shield className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold tracking-tight">Daily Cap</CardTitle>
                  <CardDescription className="text-xs">Maximum spend per epoch (MIST = smallest SUI unit)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current epoch usage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Used today</span>
                  <span className="tabular-nums font-medium">
                    {mistToSui(scope.spentToday)} / {mistToSui(scope.dailyCap)} SUI
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      usedPct >= 90 ? 'bg-rose-400' : usedPct >= 60 ? 'bg-amber-400' : 'bg-emerald-400',
                    )}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              </div>

              {/* Editable cap */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  New cap (SUI)
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="0.000000001"
                    step="0.01"
                    placeholder="0.00"
                    value={capSui}
                    onChange={(e) => setCapSui(e.target.value)}
                    className="font-mono max-w-[180px]"
                  />
                  <span className="text-xs text-muted-foreground">
                    = {suiToMist(capSui).toLocaleString()} MIST
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Requires Move <code className="font-mono">update_cap</code> entry — see comment in handler.
                </p>
              </div>

              {/* Paused badge */}
              {scope.paused && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-xs text-amber-300 font-medium">
                    Wallet is paused — spend() will abort
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Allowlist */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                  <Shield className="h-4 w-4 text-violet-400" strokeWidth={1.75} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold tracking-tight">Allowlist</CardTitle>
                  <CardDescription className="text-xs">
                    {allowlist.length === 0
                      ? 'Empty — any recipient is permitted'
                      : `${allowlist.length} permitted recipient${allowlist.length !== 1 ? 's' : ''}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {allowlist.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No restrictions. Add addresses below to restrict spending destinations.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {allowlist.map((addr) => (
                    <li
                      key={addr}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
                    >
                      <code className="font-mono text-xs text-foreground/80 truncate flex-1">
                        {addr}
                      </code>
                      <button
                        type="button"
                        aria-label={`Remove ${shortAddr(addr)}`}
                        onClick={() => removeEntry(addr)}
                        className="ml-3 shrink-0 text-muted-foreground hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add entry */}
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="0x… Sui address"
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addEntry()
                    }
                  }}
                  className="font-mono text-xs flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addEntry}
                  disabled={!newEntry.trim()}
                  className="shrink-0 gap-1"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wallet metadata */}
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="pt-4 pb-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <dt className="text-muted-foreground">Wallet object</dt>
                <dd className="font-mono text-foreground/80 truncate">{shortAddr(scope.walletId)}</dd>
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="font-mono text-foreground/80 truncate">{shortAddr(scope.owner)}</dd>
                <dt className="text-muted-foreground">Last reset epoch</dt>
                <dd className="tabular-nums text-foreground/80">{scope.epochOfLastReset}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'rounded-full text-[10px] px-2 py-0',
                      scope.paused ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300',
                    )}
                  >
                    {scope.paused ? 'Paused' : 'Active'}
                  </Badge>
                </dd>
              </dl>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-3">
              <X className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}

          {/* Success */}
          {saveOk && !error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
              <Shield className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
              <p className="text-xs text-emerald-300 font-medium">Scope saved successfully.</p>
            </div>
          )}

          {/* Save */}
          <Button
            className="w-full gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Save className="h-4 w-4" strokeWidth={1.75} />
            )}
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
