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
import type { WalletRecord } from '../../../../interfaces/types-wallet'
import { getWallet } from '../lib/idb'
import { UNav } from '../UNav'

export function WalletsPage() {
  const [wallet, setWallet] = useState<WalletRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const record = await getWallet()
        if (!cancelled) setWallet(record)
      } catch {
        if (!cancelled) setWallet(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // No wallet yet → redirect to /u to generate one
  useEffect(() => {
    if (!loading && !wallet) {
      const t = setTimeout(() => {
        window.location.href = '/u'
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [loading, wallet])

  const passkeyCount = wallet?.wrappings.filter((w) => w.type === 'passkey-prf').length ?? 0
  const hasPasskey = passkeyCount > 0

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
  if (!wallet) {
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

  const shortAddr = wallet.address ? `${wallet.address.slice(0, 10)}…${wallet.address.slice(-8)}` : 'No address'

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

        {/* State 1 CTA */}
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
                      window.location.href = '/u/save'
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
              <CardTitle className="text-lg">Primary Wallet</CardTitle>
              <Badge variant="outline">SUI</Badge>
            </div>
            <CardDescription>
              <code className="text-xs font-mono break-all">{shortAddr}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
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
                  emitClick('ui:wallets:send')
                  window.location.href = '/u/send'
                }}
              >
                ↗ Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Devices / wrappings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enrolled Devices</CardTitle>
            <CardDescription>Devices that can unlock this wallet via Touch ID.</CardDescription>
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
                    {hasPasskey ? 'Touch ID can unlock this wallet' : 'Add Touch ID to secure your wallet'}
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

        {/* Recovery phrase status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recovery Phrase</CardTitle>
            <CardDescription>Paper break-glass — 12 words to restore on any device.</CardDescription>
          </CardHeader>
          <CardContent>
            {wallet.wrappings.some((w) => w.type === 'bip39-shown') ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <span>✓</span>
                <span className="text-sm">Phrase shown and confirmed</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Not yet saved — write it down before you need it.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    emitClick('ui:wallets:bip39-show')
                    window.location.href = '/u/save'
                  }}
                >
                  Show phrase
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
