/**
 * WalletsPage — reads from IndexedDB (vault/storage) only.
 *
 * States:
 *  - loading: spinner while IDB resolves
 *  - no wallet: "Creating wallet..." (seed generation in progress elsewhere) with redirect to /u
 *  - State 1 (vault but no passkey): show wallet + "Save with Touch ID" CTA
 *  - normal: show wallet address, balance, wrapping count, link to /u/devices
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import { getMeta, listWallets } from '../lib/vault/storage'
import type { VaultMeta, VaultWallet } from '../lib/vault/types'
import { UNav } from '../UNav'

export function WalletsPage() {
  const [wallets, setWallets] = useState<VaultWallet[]>([])
  const [meta, setMeta] = useState<VaultMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [ws, m] = await Promise.all([listWallets(), getMeta()])
        if (cancelled) return
        setWallets(ws)
        setMeta(m)
      } catch {
        // IDB unavailable — treat as empty
        if (!cancelled) {
          setWallets([])
          setMeta(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Once loading done and still no wallet, redirect to /u after short delay
  useEffect(() => {
    if (!loading && wallets.length === 0) {
      const t = setTimeout(() => {
        window.location.href = '/u'
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [loading, wallets.length])

  const hasPasskey = Boolean(meta && meta.passkeys.length > 0)
  const passkeyCount = meta?.passkeys.length ?? 0

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <UNav active="wallets" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading wallet…</p>
          </div>
        </div>
      </div>
    )
  }

  // ── No wallet yet ──────────────────────────────────────────────────────────
  if (wallets.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <UNav active="wallets" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold mb-1">Creating wallet…</p>
            <p className="text-sm text-muted-foreground">You'll be redirected when it's ready.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Wallet exists ──────────────────────────────────────────────────────────
  // One wallet per browser — show the first (primary) wallet
  const wallet = wallets[0]

  return (
    <div className="min-h-screen bg-background">
      <UNav active="wallets" />

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>👛</span> My Wallet
          </h1>
          <p className="text-muted-foreground mt-1">Your universal wallet — one seed, all chains.</p>
        </div>

        {/* State 1 CTA — vault created but not yet secured with passkey */}
        {!hasPasskey && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔓</span>
                <div className="flex-1">
                  <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Save your wallet</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your wallet exists in this browser only. Add Touch ID so you can restore it on any device.
                  </p>
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => {
                      emitClick('ui:wallets:save-cta')
                      window.location.href = '/u/setup'
                    }}
                  >
                    Save with Touch ID
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {wallet.name ?? 'Primary Wallet'}
              </CardTitle>
              <Badge variant="outline" className="capitalize">
                {wallet.chain}
              </Badge>
            </div>
            <CardDescription>
              <code className="text-xs font-mono break-all">
                {wallet.address
                  ? `${wallet.address.slice(0, 14)}…${wallet.address.slice(-10)}`
                  : 'No address'}
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Balance */}
            <div>
              <div className="text-3xl font-bold">
                {wallet.balance || '0.00'}{' '}
                <span className="text-base font-normal text-muted-foreground capitalize">
                  {wallet.chain}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                ≈ ${(wallet.usdValue ?? 0).toLocaleString()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  emitClick('ui:wallets:receive')
                  navigator.clipboard.writeText(wallet.address)
                }}
              >
                ↙ Copy Address
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  emitClick('ui:wallets:detail')
                  window.location.href = `/u/wallet/${wallet.id}`
                }}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Devices / wrappings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enrolled Devices</CardTitle>
            <CardDescription>
              Devices that can unlock this wallet via Touch ID or passkey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{hasPasskey ? '🔐' : '🔓'}</span>
                <div>
                  <p className="font-medium">
                    {passkeyCount === 0
                      ? 'No devices enrolled'
                      : `${passkeyCount} device${passkeyCount === 1 ? '' : 's'} enrolled`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasPasskey
                      ? 'Touch ID or hardware key can unlock this wallet'
                      : 'Add a device to secure your wallet'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  emitClick('ui:wallets:manage-devices')
                  window.location.href = '/u/devices'
                }}
              >
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional wallets for other chains */}
        {wallets.length > 1 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Other Chains</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {wallets.slice(1).map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 bg-muted/40 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors"
                  onClick={() => {
                    emitClick('ui:wallets:chain-select')
                    window.location.href = `/u/wallet/${w.id}`
                  }}
                >
                  <div>
                    <p className="font-medium text-sm capitalize">{w.name ?? w.chain}</p>
                    <code className="text-xs text-muted-foreground font-mono">
                      {w.address ? `${w.address.slice(0, 10)}…${w.address.slice(-6)}` : '—'}
                    </code>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">
                    {w.chain}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
