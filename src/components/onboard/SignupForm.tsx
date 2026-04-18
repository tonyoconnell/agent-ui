/**
 * SignupForm — Beautiful, polished sign-up using Better Auth + TypeDB adapter.
 *
 * Calls authClient.signUp.email() (via useAuth) so we get:
 *   - inline loading/error UX
 *   - cookie-cache hydration on success (no extra session roundtrip)
 *   - shared TypeDB gateway session (no 401 races)
 *
 * Emits ui:signup:* signals so the conversion funnel becomes a learnable
 * substrate path (mark on success, warn on failure).
 */

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

type Intent = 'human' | 'agent-owner'

interface Props {
  intent: Intent
  redirect: string
}

const COPY: Record<Intent, { heading: string; sub: string; cta: string; badge: string }> = {
  human: {
    heading: 'Hire your first agent',
    sub: 'Create an account, launch agents, own your memory. Pay per result, never per token.',
    cta: 'Start for free',
    badge: 'Hiring',
  },
  'agent-owner': {
    heading: 'Earn from the substrate',
    sub: 'Register your identity, price your skills, and let pheromone routing send you work.',
    cta: 'Register as agent',
    badge: 'Earning',
  },
}

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Excellent']
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] }
}

export function SignupForm({ intent: initialIntent, redirect: initialRedirect }: Props) {
  const { signUp } = useAuth()
  const [intent, setIntent] = useState<Intent>(initialIntent)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const copy = COPY[intent]
  const strength = passwordStrength(password)
  const redirect = intent === 'agent-owner' ? '/app?onboarding=agent-owner' : '/app?onboarding=human'

  const switchIntent = (next: Intent) => {
    if (next === intent) return
    emitClick(`ui:signup:intent-${next}`)
    setIntent(next)
    // Update URL without reload so the brand panel + back/forward stay in sync.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('intent', next)
      window.history.replaceState({}, '', url.toString())
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    emitClick('ui:signup:submit', { intent })

    startTransition(async () => {
      try {
        await signUp(email, password, name)
        emitClick('ui:signup:success', { intent })
        // Hard nav so any layout that reads session via SSR re-renders cleanly.
        window.location.href = redirect
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign-up failed'
        emitClick('ui:signup:error', { intent, message })
        setError(message)
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* Intent segmented control */}
      <div
        role="tablist"
        aria-label="Sign-up intent"
        className="mb-8 flex gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 p-1 text-xs font-medium"
      >
        {(['human', 'agent-owner'] as const).map((value) => {
          const active = intent === value
          const label = value === 'human' ? 'Hire an agent' : 'Be an agent'
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchIntent(value)}
              className={cn(
                'flex-1 rounded-full px-3 py-1.5 transition-colors',
                active ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Heading */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300">
          <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
          {copy.badge}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{copy.heading}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{copy.sub}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input type="hidden" name="callbackURL" value={redirect} />

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-zinc-300">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            required
            autoComplete="name"
            autoFocus
            className="h-11 border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-zinc-300">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
            autoComplete="email"
            className="h-11 border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-zinc-300">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="password-hint"
            className="h-11 border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/20"
          />
          {/* Strength meter */}
          <div id="password-hint" className="flex items-center gap-2 pt-0.5">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((tier) => (
                <div
                  key={tier}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    strength.score >= tier
                      ? tier === 1
                        ? 'bg-red-500/70'
                        : tier === 2
                          ? 'bg-amber-500/70'
                          : tier === 3
                            ? 'bg-emerald-500/70'
                            : 'bg-violet-400'
                      : 'bg-zinc-800',
                  )}
                />
              ))}
            </div>
            <span className="w-16 text-right text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {strength.label || '—'}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending || !name || !email || password.length < 8}
          className="h-11 w-full bg-white text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              Creating account…
            </span>
          ) : (
            <>
              {copy.cta}
              <span aria-hidden="true">→</span>
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Sui wallet — visual placeholder until walletconnect is wired */}
        <Button
          type="button"
          variant="outline"
          disabled
          title="Coming soon — sign in with your Sui wallet"
          className="h-11 w-full justify-center border-zinc-800 bg-zinc-950/60 text-sm font-medium text-zinc-400 hover:bg-zinc-900 disabled:opacity-70"
        >
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path fill="currentColor" d="M12 2 4 12l8 10 8-10L12 2zm0 3.4L17.6 12 12 18.6 6.4 12 12 5.4z" />
            </svg>
            Continue with Sui wallet
            <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-300">
              Soon
            </span>
          </span>
        </Button>
      </form>

      {/* Footnote */}
      <p className="mt-6 text-center text-xs text-zinc-500">
        Already have an account?{' '}
        <a
          href="/login"
          onClick={() => emitClick('ui:signup:goto-login')}
          className="font-medium text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Sign in
        </a>
      </p>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-600">
        By continuing you agree to our{' '}
        <a href="/terms" className="underline-offset-4 hover:text-zinc-400 hover:underline">
          terms
        </a>{' '}
        and{' '}
        <a href="/privacy" className="underline-offset-4 hover:text-zinc-400 hover:underline">
          privacy policy
        </a>
        .
      </p>
    </div>
  )
}
