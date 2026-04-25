/**
 * ReceivePage - Show wallet address from IndexedDB for receiving crypto.
 *
 * Reads wallet address from IDB (getWallet → wallet.address).
 * Displays a QR code via Google Charts API, a copyable shortened address,
 * and a "Save wallet" banner when the wallet is in State 1 (no wrappings).
 */

import { useEffect, useState } from 'react'
import { getWallet } from '@/components/u/lib/idb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import type { WalletRecord } from '../../../../interfaces/types-wallet'

function formatAddress(addr: string): string {
  if (!addr || addr.length < 16) return addr
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

function qrUrl(data: string): string {
  const encoded = encodeURIComponent(data)
  return `https://chart.googleapis.com/chart?cht=qr&chs=240x240&chl=${encoded}&choe=UTF-8`
}

/** State 1: wallet exists but has no passkey or BIP39 wrappings → prompt to save. */
function isState1(record: WalletRecord): boolean {
  return record.wrappings.length === 0
}

export function ReceivePage() {
  const [record, setRecord] = useState<WalletRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
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

  const copyAddress = async () => {
    if (!record?.address) return
    await navigator.clipboard.writeText(record.address)
    emitClick('ui:receive:copy')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">↙</div>
          <h1 className="text-2xl font-semibold text-white">Receive</h1>
          <p className="text-slate-400 text-sm mt-1">Share your address to receive crypto</p>
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
        {loading && <p className="text-slate-500 text-sm text-center py-8">Loading wallet…</p>}

        {/* No wallet */}
        {!loading && !record && !error && (
          <Card className="bg-[#161622] border-[#252538] p-8 text-center">
            <CardContent className="pt-0">
              <div className="text-4xl mb-3">👛</div>
              <h3 className="font-semibold text-white mb-2">No Wallet Yet</h3>
              <p className="text-slate-400 text-sm mb-4">Create a wallet first to start receiving crypto</p>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <a href="/u">Get started</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Wallet found */}
        {!loading && record && (
          <>
            {/* State 1 save banner */}
            {isState1(record) && (
              <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 px-4 py-3 flex items-start gap-3">
                <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                <div className="flex-1 min-w-0">
                  <p className="text-amber-300 text-sm font-medium">Wallet not saved</p>
                  <p className="text-amber-400/70 text-xs mt-0.5">Save with Touch ID so you don't lose access.</p>
                </div>
                <Button asChild size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white">
                  <a href="/u/save">Save wallet</a>
                </Button>
              </div>
            )}

            {/* QR Code */}
            <Card className="bg-[#161622] border-[#252538]">
              <CardContent className="pt-6 pb-6 flex flex-col items-center gap-4">
                <div className="bg-white rounded-xl p-3 shadow-lg">
                  <img
                    src={qrUrl(record.address)}
                    alt={`QR code for address ${record.address}`}
                    width={240}
                    height={240}
                    className="block"
                  />
                </div>

                {/* Address display */}
                <div className="w-full text-center">
                  <p className="text-slate-400 text-xs mb-1">Your Sui address</p>
                  <code className="text-white text-sm font-mono break-all leading-relaxed">
                    {formatAddress(record.address)}
                  </code>
                </div>

                {/* Copy button */}
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" onClick={copyAddress}>
                  {copied ? '✓ Copied!' : '📋 Copy address'}
                </Button>

                {/* Full address (collapsed) */}
                <details className="w-full">
                  <summary className="text-slate-500 text-xs cursor-pointer hover:text-slate-300 text-center">
                    Show full address
                  </summary>
                  <code className="mt-2 block text-slate-400 text-xs font-mono break-all leading-relaxed text-center">
                    {record.address}
                  </code>
                </details>
              </CardContent>
            </Card>

            {/* Help text */}
            <p className="text-center text-xs text-slate-600">Send only SUI and SUI-based tokens to this address</p>
          </>
        )}
      </div>
    </div>
  )
}
