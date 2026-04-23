/**
 * HeaderSignInDialog — inline sign-in triggered from the site header.
 *
 * Passkey is the primary sign-in: if a vault exists on this device, one tap
 * of Touch ID / Face ID / Windows Hello unlocks it and we're done.
 *
 * Password is a fallback for:
 *   - devices without a local vault (followed by cloud restore)
 *   - users whose passkey isn't available on this browser (Firefox, new device)
 *   - anyone who prefers email + password
 */

import { Fingerprint, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { SigninForm } from '@/components/auth/SigninForm'
import { signInWithPasskey } from '@/components/u/lib/vault/passkey-cloud'
import type { PasskeyCapabilities } from '@/components/u/lib/vault/types'
import { VaultError } from '@/components/u/lib/vault/types'
import * as Vault from '@/components/u/lib/vault/vault'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HeaderSignInDialog({ open, onOpenChange }: Props) {
  const [caps, setCaps] = useState<PasskeyCapabilities | null>(null)
  const [loadingCaps, setLoadingCaps] = useState(true)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  // Refresh capabilities whenever the dialog opens.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingCaps(true)
    setPasskeyError(null)
    setShowPassword(false)
    void import('@/components/u/lib/vault/passkey')
      .then((m) => m.detectCapabilities())
      .then((c) => {
        if (!cancelled) setCaps(c)
      })
      .finally(() => {
        if (!cancelled) setLoadingCaps(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const handleComplete = useCallback(() => {
    onOpenChange(false)
    // Reload so Better Auth session + role + vault state hydrate together.
    window.location.reload()
  }, [onOpenChange])

  const handlePasskey = () => {
    setPasskeyError(null)
    emitClick('ui:header:signin-passkey')
    startTransition(async () => {
      try {
        // If there's already a local unlocked vault, just use local unlock —
        // cheaper (no network) and no server session needed.
        const local = await Vault.getStatus()
        if (local.hasVault && local.isLocked && local.hasPasskey) {
          await Vault.unlockWithPasskey()
          handleComplete()
          return
        }
        // Cross-device / fresh browser path: server verifies + mints session,
        // PRF unwraps the master, cloud blob is imported.
        await signInWithPasskey()
        handleComplete()
      } catch (err) {
        const message =
          err instanceof VaultError ? err.message : err instanceof Error ? err.message : 'Passkey sign-in failed'
        setPasskeyError(message)
      }
    })
  }

  const canPasskey = !!caps && caps.webauthn && caps.prf
  const noVaultOnDevice = false // passkey path no longer requires a local vault

  // If the user explicitly switched to password, or there's no vault to unlock
  // here, show the password form directly. Otherwise passkey is the primary.
  const showForm = showPassword || noVaultOnDevice

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-800 bg-[#0a0a0f] p-6 text-white">
        <DialogTitle className="sr-only">Sign in</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in with a passkey on this device, or fall back to email and password.
        </DialogDescription>

        {showForm ? (
          <div className="space-y-4">
            <SigninForm onComplete={handleComplete} />
            {canPasskey && (
              <button
                type="button"
                onClick={() => {
                  setShowPassword(false)
                  setPasskeyError(null)
                }}
                className="w-full text-center text-xs text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
              >
                ← Use passkey instead
              </button>
            )}
          </div>
        ) : (
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sky-300">
                <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
                Welcome back
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Sign in to ONE</h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Unlock with the passkey on this device. One tap, no password, keys stay local.
              </p>
            </div>

            {loadingCaps ? (
              <div className="flex h-11 items-center justify-center rounded-md bg-zinc-900/60">
                <Loader2 className="size-4 animate-spin text-zinc-500" />
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handlePasskey}
                  disabled={!canPasskey || pending}
                  className="h-11 w-full gap-2 bg-white text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Fingerprint className="size-4" />}
                  <span>
                    {pending
                      ? 'Signing in…'
                      : canPasskey
                        ? 'Sign in with passkey'
                        : 'Passkey not available on this device'}
                  </span>
                </Button>

                {passkeyError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
                  >
                    {passkeyError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    emitClick('ui:header:signin-password')
                    setShowPassword(true)
                  }}
                  className="w-full text-center text-xs text-zinc-400 underline-offset-4 transition-colors hover:text-zinc-200 hover:underline"
                >
                  Sign in with password instead
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
