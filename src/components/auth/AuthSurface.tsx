import { useEffect, useRef, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'
import { motionClass } from './a11y'
import { EmailContinueForm } from './EmailContinueForm'
import { GoogleButton } from './GoogleButton'
import { PasskeyButton } from './PasskeyButton'
import { WalletSignIn } from './WalletSignIn'

interface Props {
  mode: 'signin' | 'signup'
  redirect: string
}

export function AuthSurface({ mode, redirect }: Props) {
  const [passkeyAvailable, setPasskeyAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    async function detectPasskey() {
      if (!window.PublicKeyCredential) return
      try {
        const available = await PublicKeyCredential.isConditionalMediationAvailable?.()
        setPasskeyAvailable(!!available || !!window.PublicKeyCredential)
      } catch {
        setPasskeyAvailable(!!window.PublicKeyCredential)
      }
    }
    detectPasskey()
  }, [])

  function handleError(msg: string) {
    setError(msg)
    // Move focus to error region so screen readers announce it
    setTimeout(() => errorRef.current?.focus(), 50)
  }

  return (
    <div className="w-full space-y-4">
      {/* Error region */}
      {error && (
        <p
          ref={errorRef}
          role="alert"
          aria-live="polite"
          tabIndex={-1}
          className={cn(
            'rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-400',
            motionClass('animate-in fade-in'),
          )}
        >
          {error}
        </p>
      )}

      {/* Door 1: Passkey — headline CTA */}
      {passkeyAvailable && (
        <div>
          <PasskeyButton mode={mode} redirect={redirect} onError={handleError} />
          <p className="mt-2 text-center text-xs text-zinc-500">
            No password. Your biometric never leaves this device.
          </p>
        </div>
      )}

      {/* Doors 2+3: Google + Wallet — equal weight row */}
      <div className="flex gap-3">
        <GoogleButton redirect={redirect} onError={handleError} />
        <WalletSignIn onError={handleError} />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">or use email</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      {/* Door 4: Email */}
      <EmailContinueForm redirect={redirect} />

      {/* Disclosure: More ways */}
      <details className="group">
        <summary
          onClick={() => emitClick('ui:auth:more-ways:open')}
          className="flex cursor-pointer list-none items-center gap-1 text-xs text-zinc-400 hover:text-white"
        >
          <svg
            className="h-3 w-3 transition-transform group-open:rotate-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          More ways to sign in
        </summary>
        <div className="mt-3 space-y-2 pl-4">
          <a
            href="/api/auth/zklogin/start"
            onClick={() => emitClick('ui:auth:zklogin:start')}
            className="block text-xs text-zinc-400 hover:text-white"
          >
            Continue with zkLogin (Sui address from Google)
          </a>
          <a
            href="/u/restore"
            onClick={() => emitClick('ui:auth:restore:start')}
            className="block text-xs text-zinc-400 hover:text-white"
          >
            Lost your device? — Restore wallet
          </a>
        </div>
      </details>
    </div>
  )
}
