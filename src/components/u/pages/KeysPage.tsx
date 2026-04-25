/**
 * KeysPage - Devices & Key Management
 *
 * Redirects key management to /u/devices for passkey-based device management.
 * Shows count of enrolled passkey devices from IDB wrappings.
 * Removes old "export key" / localStorage UI — keys are now managed via
 * the vault (AES-256-GCM in IndexedDB, wrapped by passkey PRF + BIP39).
 */

import { useEffect, useState } from 'react'
import { getWallet } from '@/components/u/lib/idb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import type { WalletRecord } from '../../../../interfaces/types-wallet'

function deviceCount(record: WalletRecord | null): number {
  if (!record) return 0
  return record.wrappings.filter((w) => w.type === 'passkey-prf').length
}

function hasBip39(record: WalletRecord | null): boolean {
  if (!record) return false
  return record.wrappings.some((w) => w.type === 'bip39-shown')
}

export function KeysPage() {
  const [record, setRecord] = useState<WalletRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const w = await getWallet()
        if (!cancelled) setRecord(w)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load wallet')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const devices = deviceCount(record)
  const bip39 = hasBip39(record)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <span aria-hidden="true">🔑</span> Keys &amp; Devices
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your wallet is protected by passkeys — no password needed.</p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 text-red-400 text-sm"
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <p className="text-slate-500 text-sm text-center py-8">Loading…</p>}

        {!loading && (
          <>
            {/* Devices card — primary action */}
            <Card
              className="bg-[#161622] border-[#252538] hover:border-indigo-700/40 transition-colors cursor-pointer"
              onClick={() => {
                emitClick('ui:keys:devices-nav')
                window.location.href = '/u/devices'
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">📱</span> Enrolled Devices
                  </span>
                  <span className="text-slate-500 text-xs font-normal">→</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">
                    {devices === 0
                      ? 'No passkeys enrolled yet'
                      : `${devices} device${devices === 1 ? '' : 's'} enrolled`}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">Touch ID · Face ID · Windows Hello</p>
                </div>
                <div className={`text-2xl font-bold ${devices === 0 ? 'text-slate-600' : 'text-indigo-400'}`}>
                  {devices}
                </div>
              </CardContent>
            </Card>

            <Button
              asChild
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
              onClick={() => emitClick('ui:keys:devices-nav')}
            >
              <a href="/u/devices">Manage Devices</a>
            </Button>

            {/* Recovery phrase status */}
            <Card className="bg-[#161622] border-[#252538]">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <span aria-hidden="true">📜</span> Recovery Phrase
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-2">
                  {bip39 ? (
                    <>
                      <span className="text-emerald-400 text-sm" aria-hidden="true">
                        ✓
                      </span>
                      <p className="text-slate-400 text-sm">Phrase was shown — keep it safe offline</p>
                    </>
                  ) : (
                    <>
                      <span className="text-amber-400 text-sm" aria-hidden="true">
                        ⚠
                      </span>
                      <p className="text-slate-400 text-sm">No recovery phrase recorded yet</p>
                    </>
                  )}
                </div>
                {!bip39 && record && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-[#252538] text-slate-300 hover:bg-[#252538] hover:text-white"
                    onClick={() => emitClick('ui:keys:save-nav')}
                  >
                    <a href="/u/save">Save wallet &amp; get phrase</a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Architecture note */}
            <div className="rounded-lg border border-[#252538] bg-[#161622]/60 px-4 py-3">
              <p className="text-slate-500 text-xs leading-relaxed">
                Keys are stored encrypted in your browser's IndexedDB (AES-256-GCM), wrapped by your passkey PRF output.
                No passwords. No cloud. You own your keys.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
