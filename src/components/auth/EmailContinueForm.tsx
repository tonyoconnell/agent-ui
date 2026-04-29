import { useEffect, useRef, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { EmailInboxPanel } from './EmailInboxPanel'

interface Props {
  redirect?: string
}

export function EmailContinueForm({ redirect = '/app' }: Props) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Conditional WebAuthn: start passkey autofill on email field focus
  useEffect(() => {
    async function startConditional() {
      if (!window.PublicKeyCredential?.isConditionalMediationAvailable) return
      const available = await PublicKeyCredential.isConditionalMediationAvailable()
      if (!available) return
      try {
        const { startAuthentication } = await import('@simplewebauthn/browser')
        const optsRes = await fetch('/api/auth/passkey-webauthn/authenticate/options', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (!optsRes.ok) return
        const opts = await optsRes.json()
        await startAuthentication({ ...opts, useBrowserAutofill: true })
        // If user picked a passkey from autofill, navigate
        window.location.href = redirect
      } catch {
        // User ignored — no-op
      }
    }
    startConditional()
  }, [redirect])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      inputRef.current?.focus()
      return
    }
    emitClick('ui:auth:email:link')
    setPending(true)
    const start = Date.now()
    try {
      const res = await fetch('/api/auth/email/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirect }),
      })
      // Enforce 600ms minimum UX delay
      const elapsed = Date.now() - start
      if (elapsed < 600) await new Promise((r) => setTimeout(r, 600 - elapsed))
      if (res.status === 429) {
        setError('Too many requests — wait a few minutes.')
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setPending(false)
    }
  }

  if (sent) return <EmailInboxPanel email={email} redirect={redirect} />

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="email"
          autoComplete="username webauthn"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          aria-label="Email address"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-400/40 focus:outline-none disabled:opacity-60"
        />
        {error && (
          <p role="alert" aria-live="polite" className="text-xs text-rose-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-60"
        >
          {pending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Sending…
            </>
          ) : (
            'Continue →'
          )}
        </button>
      </div>
    </form>
  )
}
