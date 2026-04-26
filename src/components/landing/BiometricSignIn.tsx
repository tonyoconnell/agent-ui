import { useEffect, useState } from 'react'
import { detectCapabilities, isUserCancellation, signInWithPasskey, VaultError } from '@/components/u/lib/vault'
import { emitClick } from '@/lib/ui-signal'

type Status = 'idle' | 'checking' | 'unsupported' | 'authenticating' | 'success' | 'error'

interface Props {
  redirectTo?: string
}

export function BiometricSignIn({ redirectTo = '/u' }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('checking')
    detectCapabilities()
      .then((caps) => {
        if (cancelled) return
        setStatus(caps.webauthn && caps.platformAuthenticator ? 'idle' : 'unsupported')
      })
      .catch(() => {
        if (!cancelled) setStatus('unsupported')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleClick() {
    if (status === 'authenticating' || status === 'unsupported') return
    emitClick('ui:auth:biometric:start')
    setStatus('authenticating')
    setError(null)
    try {
      const res = await signInWithPasskey()
      emitClick('ui:auth:biometric:success', {
        created: res.created ?? false,
        wallets: res.walletsRestored,
      })
      setStatus('success')
      window.location.href = redirectTo
    } catch (err) {
      if (isUserCancellation(err)) {
        emitClick('ui:auth:biometric:cancel')
        setStatus('idle')
        return
      }
      const msg = err instanceof VaultError ? err.message : err instanceof Error ? err.message : 'Sign-in failed'
      emitClick('ui:auth:biometric:error', { message: msg })
      setError(msg)
      setStatus('error')
    }
  }

  const disabled = status === 'authenticating' || status === 'unsupported' || status === 'checking'

  let label = 'Sign in with biometrics'
  if (status === 'authenticating') label = 'Touch your fingerprint…'
  else if (status === 'success') label = 'Signed in — redirecting…'
  else if (status === 'unsupported') label = 'Biometrics unavailable'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Sign in with your fingerprint"
        className="group inline-flex items-center gap-3 px-10 py-5 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'hsl(216 55% 25%)', color: 'hsl(36 8% 96%)' }}
      >
        {status === 'authenticating' ? (
          <span
            className="inline-block w-6 h-6 rounded-full border-2 border-black/30 border-t-black animate-spin"
            aria-hidden="true"
          />
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 11c0 6 1 8 2 9" />
            <path d="M16 7a4 4 0 0 0-8 0v4" />
            <path d="M5 12V7a7 7 0 0 1 14 0v5" />
            <path d="M9 14c0 4 0 6 1 7" />
            <path d="M19 14c0 3-1 5-2 6" />
          </svg>
        )}
        <span>{label}</span>
        {status === 'idle' && (
          <span className="ml-1 transition-transform group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        )}
      </button>

      {status === 'unsupported' ? (
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Your browser doesn't support platform biometrics here.{' '}
          <a href={redirectTo} className="text-primary hover:opacity-80 underline">
            Enter without signing in →
          </a>
        </p>
      ) : status === 'error' ? (
        <p className="text-sm text-rose-400 text-center max-w-sm" role="alert">
          {error}{' '}
          <button type="button" onClick={handleClick} className="underline hover:text-rose-300">
            Try again
          </button>
        </p>
      ) : (
        <p className="text-sm text-gray-500">Wallet appears in &lt; 1 second · Touch ID, Face ID, Windows Hello</p>
      )}
    </div>
  )
}
