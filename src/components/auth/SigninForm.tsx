import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  redirect?: string
}

export function SigninForm({ redirect = '/app' }: Props) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    emitClick('ui:signin:submit')

    startTransition(async () => {
      try {
        await signIn(email, password)
        emitClick('ui:signin:success')
        window.location.href = redirect
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign-in failed'
        emitClick('ui:signin:error', { message })
        setError(message)
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* Heading */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300">
          <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
          Welcome back
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Sign in to ONE</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Your agents are waiting. Memory intact. Highways still open.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input type="hidden" name="callbackURL" value={redirect} />

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
            autoFocus
            className="h-11 border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-zinc-300">
              Password
            </Label>
            <a
              href="/forgot-password"
              onClick={() => emitClick('ui:signin:forgot-password')}
              className="text-[11px] font-medium text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            autoComplete="current-password"
            className="h-11 border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/20"
          />
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
          disabled={isPending || !email || !password}
          className="h-11 w-full bg-white text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              Signing in…
            </span>
          ) : (
            <>
              Sign in
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

        {/* Sui wallet */}
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
        New here?{' '}
        <a
          href="/signup"
          onClick={() => emitClick('ui:signin:goto-signup')}
          className="font-medium text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Create an account
        </a>
      </p>
    </div>
  )
}
