// src/components/u/DevicesIsland.tsx — Enrolled passkey device management.

import { useCallback, useEffect, useState } from 'react'
import * as Vault from '@/components/u/lib/vault/vault'
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

interface Device {
  credentialId: Uint8Array
  label: string
  createdAt: number
}

function formatDate(ts: number): string {
  if (!ts) return 'Unknown date'
  try {
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return String(ts)
  }
}

function credIdHex(id: Uint8Array): string {
  return Array.from(id)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function DevicesIsland() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [confirmHex, setConfirmHex] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDevices(await Vault.getEnrolledPasskeys())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDevices()
  }, [loadDevices])

  async function handleRevoke(credentialId: Uint8Array) {
    const hex = credIdHex(credentialId)
    setRevoking(hex)
    setError(null)
    try {
      await Vault.removePasskey(credentialId)
      emitClick('ui:devices:revoke')
      await loadDevices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke device')
    } finally {
      setRevoking(null)
      setConfirmHex(null)
    }
  }

  const lastDevice = devices.length === 1
  const confirmDevice = confirmHex ? devices.find((d) => credIdHex(d.credentialId) === confirmHex) : null
  const confirmIndex = confirmHex ? devices.findIndex((d) => credIdHex(d.credentialId) === confirmHex) : -1

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Your Devices</h1>
          <p className="text-slate-400 text-sm">
            Passkeys enrolled to access your wallet. Remove a device to revoke its access.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 text-red-400 text-sm"
          >
            {error}
          </div>
        )}

        {loading && <p className="text-slate-500 text-sm text-center py-8">Loading devices…</p>}

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

        {!loading && devices.length > 0 && (
          <div className="space-y-3">
            {lastDevice && (
              <div
                role="note"
                className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-3 text-amber-400 text-sm"
              >
                This is your last device. Make sure you have your recovery phrase before revoking it.
              </div>
            )}

            {devices.map((device, index) => {
              const hex = credIdHex(device.credentialId)
              return (
                <Card key={hex} className="bg-[#161622] border-[#252538] text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{device.label || `Device ${index + 1}`}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-slate-400 text-xs">Enrolled {formatDate(device.createdAt)}</p>
                      <p className="font-mono text-slate-600 text-[10px] truncate">{hex.slice(0, 24)}…</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={revoking === hex}
                      onClick={() => setConfirmHex(hex)}
                      className="shrink-0 border-[#252538] text-slate-300 hover:bg-red-950/30 hover:border-red-800/40 hover:text-red-400"
                    >
                      {revoking === hex ? 'Revoking…' : 'Revoke'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="pt-2 text-center">
          <a href="/u" className="text-slate-500 text-xs hover:text-slate-300 underline underline-offset-2">
            Back to wallet
          </a>
        </div>
      </div>

      <AlertDialog
        open={confirmHex !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmHex(null)
        }}
      >
        <AlertDialogContent className="bg-[#161622] border-[#252538] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDevice?.label ?? `Device ${confirmIndex + 1}`}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Remove this device? You&apos;ll need Touch ID on another device or your recovery phrase to regain access.
              {lastDevice && (
                <span className="block mt-2 text-amber-400">Warning: this is your only enrolled device.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-[#252538] text-slate-300 hover:bg-[#252538] hover:text-white"
              onClick={() => setConfirmHex(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 text-white hover:bg-red-600"
              onClick={() => confirmDevice && void handleRevoke(confirmDevice.credentialId)}
            >
              Remove device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
