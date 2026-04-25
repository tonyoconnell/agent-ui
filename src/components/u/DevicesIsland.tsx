// src/components/u/DevicesIsland.tsx — Enrolled passkey device management.
// Shows wrappings from IDB as Device cards; lets users revoke individual passkeys.

import { useCallback, useEffect, useState } from 'react'
import { getWallet, removeWrapping } from '@/components/u/lib/idb'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import type { PasskeyPrfWrapping } from '../../../interfaces/types-wallet'

interface Device {
  credId: string // hex-encoded
  enrolledAt: string // ISO
  isCurrent: boolean // true if this is the currently-active passkey
}

// Convert ArrayBuffer → hex string
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Convert hex string → ArrayBuffer
function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes.buffer
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export function DevicesIsland() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [confirmCredId, setConfirmCredId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const record = await getWallet()
      if (!record) {
        setDevices([])
        return
      }
      const passkeys = record.wrappings.filter((w): w is PasskeyPrfWrapping => w.type === 'passkey-prf')
      // We don't store enrolledAt on wrappings in the current schema,
      // so we fall back to bip39ShownAt or a stable placeholder.
      const mapped: Device[] = passkeys.map((w) => ({
        credId: bufToHex(w.credId),
        enrolledAt: record.bip39ShownAt ?? new Date(0).toISOString(),
        isCurrent: false, // no current-session tracking in IDB yet
      }))
      setDevices(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  async function handleRevoke(credId: string) {
    setRevoking(credId)
    setError(null)
    try {
      await removeWrapping(hexToBuf(credId))

      emitClick('ui:devices:revoke')
      await loadDevices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke device')
    } finally {
      setRevoking(null)
      setConfirmCredId(null)
    }
  }

  const lastDevice = devices.length === 1
  const confirmingDevice = confirmCredId ? devices.find((d) => d.credId === confirmCredId) : null
  const confirmIndex = confirmCredId ? devices.findIndex((d) => d.credId === confirmCredId) : -1

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Your Devices</h1>
          <p className="text-slate-400 text-sm">
            Passkeys enrolled to access your wallet. Remove a device to revoke its access.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 text-red-400 text-sm"
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <p className="text-slate-500 text-sm text-center py-8">Loading devices…</p>}

        {/* Empty */}
        {!loading && devices.length === 0 && (
          <div className="rounded-xl border border-[#252538] bg-[#161622] px-6 py-10 text-center">
            <p className="text-slate-400 text-sm mb-1">No passkeys enrolled</p>
            <p className="text-slate-600 text-xs">
              Enroll a passkey from the{' '}
              <a href="/u/save" className="text-slate-400 underline underline-offset-2 hover:text-white">
                Save Wallet
              </a>{' '}
              page.
            </p>
          </div>
        )}

        {/* Device cards */}
        {!loading && devices.length > 0 && (
          <div className="space-y-3">
            {/* Last-device warning */}
            {lastDevice && (
              <div
                role="note"
                className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-3 text-amber-400 text-sm"
              >
                This is your last device. Make sure you have your BIP39 recovery phrase before revoking it.
              </div>
            )}

            {devices.map((device, index) => (
              <Card key={device.credId} className="bg-[#161622] border-[#252538] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span>Device {index + 1}</span>
                    {device.isCurrent && (
                      <span className="text-xs font-normal text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 rounded px-1.5 py-0.5">
                        current
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-slate-400 text-xs">Enrolled {formatDate(device.enrolledAt)}</p>
                    <p className="font-mono text-slate-600 text-[10px] truncate">{device.credId.slice(0, 24)}…</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revoking === device.credId}
                    onClick={() => setConfirmCredId(device.credId)}
                    className="shrink-0 border-[#252538] text-slate-300 hover:bg-red-950/30 hover:border-red-800/40 hover:text-red-400"
                  >
                    {revoking === device.credId ? 'Revoking…' : 'Revoke'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="pt-2 text-center">
          <a href="/u" className="text-slate-500 text-xs hover:text-slate-300 underline underline-offset-2">
            Back to wallet
          </a>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog
        open={confirmCredId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmCredId(null)
        }}
      >
        <AlertDialogContent className="bg-[#161622] border-[#252538] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Device {confirmIndex + 1}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Remove this device? You'll need Touch ID on another device or your BIP39 recovery phrase to access your
              wallet.
              {lastDevice && (
                <span className="block mt-2 text-amber-400">Warning: this is your only enrolled device.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-[#252538] text-slate-300 hover:bg-[#252538] hover:text-white"
              onClick={() => setConfirmCredId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 text-white hover:bg-red-600"
              onClick={() => confirmingDevice && handleRevoke(confirmingDevice.credId)}
            >
              Remove device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
