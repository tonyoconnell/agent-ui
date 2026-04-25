/**
 * Header — one button, three states.
 *
 *   Signed out          → "Sign in"        (Touch ID → server session + vault)
 *   Signed in + locked  → "Unlock"         (Touch ID → local vault unlock)
 *   Signed in + unlocked → identity chip   (address · wallet count · menu)
 *
 * Brand-new accounts also see RecoveryPhraseDialog exactly once.
 *
 * See `lifecycle-auth.md` (root) for the full contract.
 */

import { Fingerprint, Loader2, LockOpen } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { RecoveryPhraseDialog } from '@/components/auth/RecoveryPhraseDialog'
import { createAccountWithPasskey, signInWithPasskey } from '@/components/u/lib/vault/passkey-cloud'
import type { VaultStatus } from '@/components/u/lib/vault/types'
import { VaultError } from '@/components/u/lib/vault/types'
import * as Vault from '@/components/u/lib/vault/vault'
import { authClient } from '@/lib/auth-client'
import { emitClick } from '@/lib/ui-signal'

interface SessionUser {
  id: string
  email?: string
  name?: string
  wallet?: string
  address?: string
}

interface HeaderProps {
  /** Route prefix for the Continue button. Defaults to /app */
  continueHref?: string
}

function shortAddr(a: string | undefined | null): string {
  if (!a) return ''
  if (a.length < 12) return a
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

/** Reactive vault status — refreshes on demand and on mount. */
function useVaultStatus(): { status: VaultStatus | null; refresh: () => Promise<void> } {
  const [status, setStatus] = useState<VaultStatus | null>(null)
  const refresh = useCallback(async () => {
    try {
      setStatus(await Vault.getStatus())
    } catch {
      // ignore — caller renders a generic state
    }
  }, [])
  useEffect(() => {
    void refresh()
  }, [refresh])
  return { status, refresh }
}

export function Header({ continueHref = '/app' }: HeaderProps) {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const { status: vault, refresh: refreshVault } = useVaultStatus()
  const [role, setRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null)
  const [signInError, setSignInError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const user = session?.user as SessionUser | undefined
  const uid = user?.id
  const walletOrId = user?.wallet ?? user?.address ?? uid ?? ''

  useEffect(() => {
    if (!uid) {
      setRole(null)
      return
    }
    let cancelled = false
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { role?: string } | null) => {
        if (!cancelled && data?.role) setRole(data.role)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [uid])

  const signOut = async () => {
    emitClick('ui:header:signout')
    try {
      await Vault.flushPendingSync()
    } catch {
      // best-effort — don't block sign-out on sync failure
    }
    try {
      Vault.lock()
    } catch {
      // ignore
    }
    try {
      await authClient.signOut()
    } catch {
      // even if the server rejects, clear locally
    }
    window.location.href = '/signed-out'
  }

  // Single entry point. The state machine decides the action:
  //   session + locked vault   → local passkey unlock (no network)
  //   any other state          → signInWithPasskey() — assertion first, server
  //                              decides if the credential is registered;
  //                              creates an account only on a real 401.
  // We never short-circuit to create from the client, because a fresh browser
  // with a *synced* passkey looks identical to a fresh browser with no
  // account at all. Only the server can tell them apart.
  const handlePrimary = () => {
    setSignInError(null)
    startTransition(async () => {
      try {
        const local = await Vault.getStatus()
        const signedIn = !!session?.user
        if (signedIn && local.hasVault && local.isLocked && local.hasPasskey) {
          emitClick('ui:header:unlock')
          await Vault.unlockWithPasskey()
          await refreshVault()
          return
        }
        emitClick('ui:header:signin')
        const result = await signInWithPasskey()
        if (result.created && result.recoveryPhrase) {
          setRecoveryPhrase(result.recoveryPhrase)
          return
        }
        if (result.blobMismatch) {
          // Signed in, but vault backup used a different passkey — fresh local
          // vault was created. Reload to show the unlocked state; the user
          // can restore wallets from their recovery phrase in Settings.
          window.location.reload()
          return
        }
        window.location.reload()
      } catch (err) {
        if (err instanceof VaultError && err.code === 'passkey-cancelled') return
        setSignInError(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  const handleCreate = () => {
    setSignInError(null)
    startTransition(async () => {
      try {
        emitClick('ui:header:create-passkey')
        const result = await createAccountWithPasskey()
        if (result.recoveryPhrase) {
          setRecoveryPhrase(result.recoveryPhrase)
          return
        }
        window.location.reload()
      } catch (err) {
        if (err instanceof VaultError && err.code === 'passkey-cancelled') return
        setSignInError(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  const handleLock = () => {
    emitClick('ui:header:lock')
    Vault.lock()
    void refreshVault()
  }

  const gotoContinue = () => {
    emitClick('ui:header:continue', { role })
    window.location.href = continueHref
  }

  // ── compute display state ────────────────────────────────────────────────
  const signedIn = !!session?.user
  const vaultUnlocked = !!vault && vault.hasVault && !vault.isLocked
  const showIdentity = signedIn && vaultUnlocked
  const showUnlock = signedIn && !!vault && vault.hasVault && vault.isLocked
  const walletCount = vault?.walletCount ?? 0

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0f]/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Brand */}
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
          <span className="grid size-7 place-items-center rounded-md bg-white text-black text-xs font-bold">1</span>
          <span>ONE</span>
        </a>

        {/* Right: one button, state machine */}
        <div className="flex items-center gap-2">
          {sessionPending ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-white/5" role="status" aria-label="Loading session" />
          ) : showIdentity ? (
            <>
              {/* Identity chip — also opens the menu (lock + sign out + nav) */}
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="group inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/15 transition-colors"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <LockOpen className="size-3" aria-hidden="true" />
                <span className="font-mono">{shortAddr(walletOrId)}</span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-emerald-100">
                  {walletCount}
                </span>
                {role && (
                  <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-300">
                    {role}
                  </span>
                )}
                <span aria-hidden="true" className="text-emerald-400/70 group-hover:text-emerald-200">
                  ▾
                </span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-6 top-14 mt-1 w-48 rounded-md border border-white/10 bg-[#101018] py-1 shadow-lg"
                  role="menu"
                >
                  <a
                    href="/u"
                    className="block px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                    onClick={() => emitClick('ui:header:menu:wallet')}
                  >
                    Wallets ({walletCount})
                  </a>
                  <a
                    href="/app"
                    className="block px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                    onClick={() => emitClick('ui:header:menu:app')}
                  >
                    Dashboard
                  </a>
                  {role === 'chairman' && (
                    <a
                      href="/chairman"
                      className="block px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                      onClick={() => emitClick('ui:header:menu:chairman')}
                    >
                      Chairman
                    </a>
                  )}
                  {(role === 'ceo' || role === 'chairman') && (
                    <a
                      href="/ceo"
                      className="block px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                      onClick={() => emitClick('ui:header:menu:ceo')}
                    >
                      CEO
                    </a>
                  )}
                  {(role === 'board' || role === 'chairman') && (
                    <a
                      href="/board"
                      className="block px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                      onClick={() => emitClick('ui:header:menu:board')}
                    >
                      Board
                    </a>
                  )}
                  <a
                    href="/settings/keys"
                    className="block px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                    onClick={() => emitClick('ui:header:menu:keys')}
                  >
                    API keys
                  </a>
                  <div className="my-1 border-t border-white/5" />
                  <button
                    type="button"
                    onClick={handleLock}
                    className="block w-full px-3 py-1.5 text-left text-xs text-amber-300 hover:bg-amber-500/10"
                  >
                    Lock
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="block w-full px-3 py-1.5 text-left text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Sign out
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={gotoContinue}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Continue
                <span aria-hidden="true">→</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* New users: go straight to credentials.create (Touch ID to register) */}
              {!vault?.hasVault && !showUnlock && (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-60"
                >
                  {pending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Fingerprint className="size-3.5" aria-hidden="true" />
                  )}
                  <span>{pending ? 'Working…' : 'Create passkey'}</span>
                </button>
              )}
              {/* Existing users: credentials.get (use saved passkey) */}
              <button
                type="button"
                onClick={handlePrimary}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08] transition-colors disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Fingerprint className="size-3.5" aria-hidden="true" />
                )}
                <span>{pending ? 'Working…' : showUnlock ? 'Unlock' : 'Sign in'}</span>
              </button>
              {signInError && (
                <span
                  role="alert"
                  className="absolute left-0 right-0 top-14 mx-4 rounded-md border border-red-500/20 bg-red-950/80 px-3 py-2 text-[11px] text-red-300 backdrop-blur sm:static sm:mx-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
                >
                  {signInError}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {recoveryPhrase && (
        <RecoveryPhraseDialog
          phrase={recoveryPhrase}
          onConfirm={() => {
            setRecoveryPhrase(null)
            window.location.reload()
          }}
        />
      )}
    </header>
  )
}
