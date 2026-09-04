import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  email: string
  redirect?: string
}

export function EmailInboxPanel({ email, redirect = '/app' }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwPending, setPwPending] = useState(false)
  const [attempts, setAttempts] = useState(0)

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    emitClick('ui:auth:email:password-opt-in')
    setPwPending(true)
    try {
      const { authClient } = await import('@/lib/auth-client')
      await authClient.signIn.email({ email, password, callbackURL: redirect })
    } catch {
      const next = attempts + 1
      setAttempts(next)
      if (next >= 5) {
        setPwError('Too many attempts. Try again in 15 minutes, or use a magic link.')
      } else {
        setPwError(`Email or password incorrect. (${5 - next} attempt${5 - next === 1 ? '' : 's'} left.)`)
      }
    } finally {
      setPwPending(false)
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-[hsl(var(--color-secondary-bright)/0.2)] bg-[hsl(var(--color-secondary-bright)/0.06)] p-5"
    >
      <div className="mb-3 flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--color-secondary-bright)/0.8)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-font">Check your inbox</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We sent a link to <span className="text-foreground">{email}</span>. It&apos;s good for 5 minutes.
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/60">
            Click the link on this device — opening it elsewhere will sign you in there.
          </p>
        </div>
      </div>

      {!showPassword ? (
        <button
          type="button"
          onClick={() => {
            emitClick('ui:auth:email:password-opt-in')
            setShowPassword(true)
          }}
          className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-font"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Have a password? Use it instead
        </button>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="mt-3 space-y-2">
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pwPending || attempts >= 5}
            className="w-full rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm text-font placeholder:text-muted-foreground/40 focus:border-secondary-bright/40 focus:outline-none disabled:opacity-60"
          />
          {pwError && (
            <p role="alert" aria-live="polite" className="text-xs text-destructive">
              {pwError}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              type="submit"
              disabled={pwPending || attempts >= 5}
              aria-busy={pwPending}
              className="flex-1 rounded-xl border border-border bg-card/30 px-4 py-2.5 text-sm font-medium text-font transition hover:bg-card/50 disabled:opacity-60"
            >
              {pwPending ? 'Signing in…' : 'Sign in'}
            </button>
            <a href="/settings/security" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot password?
            </a>
          </div>
        </form>
      )}
    </div>
  )
}
