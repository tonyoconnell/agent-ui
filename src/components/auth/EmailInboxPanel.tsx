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
    <div role="status" aria-live="polite" className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-5">
      <div className="mb-3 flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-violet-400"
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
          <p className="text-sm font-medium text-white">Check your inbox</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            We sent a link to <span className="text-zinc-200">{email}</span>. It&apos;s good for 5 minutes.
          </p>
          <p className="mt-1 text-[10px] text-zinc-500">
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
          className="mt-1 flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
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
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-400/40 focus:outline-none disabled:opacity-60"
          />
          {pwError && (
            <p role="alert" aria-live="polite" className="text-xs text-rose-400">
              {pwError}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              type="submit"
              disabled={pwPending || attempts >= 5}
              aria-busy={pwPending}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-60"
            >
              {pwPending ? 'Signing in…' : 'Sign in'}
            </button>
            <a href="/settings/security" className="text-xs text-zinc-500 hover:text-zinc-300">
              Forgot password?
            </a>
          </div>
        </form>
      )}
    </div>
  )
}
