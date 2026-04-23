/**
 * Header — global site header with vault-first auth.
 *
 * Vault is the primary identity (passkey-unlocked device-local keys).
 * Better Auth password sign-in is kept as a secondary path for users
 * without a vault/passkey.
 */

import { useEffect, useState } from 'react'
import { HeaderSignInDialog } from '@/components/auth/HeaderSignInDialog'
import { VaultUnlockChip } from '@/components/u/VaultUnlockChip'
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

export function Header({ continueHref = '/app' }: HeaderProps) {
  const { data: session, isPending } = authClient.useSession()
  const [role, setRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)

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
      await authClient.signOut()
    } catch {
      // even if the server rejects, clear locally
    }
    window.location.href = '/'
  }

  const openSignIn = () => {
    emitClick('ui:header:signin')
    setSignInOpen(true)
  }

  const gotoContinue = () => {
    emitClick('ui:header:continue', { role })
    window.location.href = continueHref
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0f]/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Brand */}
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
          <span className="grid size-7 place-items-center rounded-md bg-white text-black text-xs font-bold">1</span>
          <span>ONE</span>
        </a>

        {/* Right: auth controls */}
        <div className="flex items-center gap-2">
          {/* Primary auth — vault (passkey-unlocked device identity) */}
          <VaultUnlockChip />

          {isPending ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-white/5" role="status" aria-label="Loading session" />
          ) : session?.user ? (
            <>
              {/* Identity chip */}
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="group inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.06] transition-colors"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="inline-block size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                <span className="font-mono">{shortAddr(walletOrId)}</span>
                {role && (
                  <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-300">
                    {role}
                  </span>
                )}
                <span aria-hidden="true" className="text-slate-500 group-hover:text-slate-300">
                  ▾
                </span>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  className="absolute right-6 top-14 mt-1 w-48 rounded-md border border-white/10 bg-[#101018] py-1 shadow-lg"
                  role="menu"
                >
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
                    onClick={signOut}
                    className="block w-full px-3 py-1.5 text-left text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Sign out
                  </button>
                </div>
              )}

              {/* Continue CTA */}
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
            // Secondary path: Better Auth password sign-in (+ cloud restore) inline.
            <button
              type="button"
              onClick={openSignIn}
              className="inline-flex items-center rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.06] transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
      <HeaderSignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </header>
  )
}
