import { useEffect, useState, useTransition } from 'react'
import { CloudRestorePanel } from '@/components/auth/CloudRestorePanel'
import { hasCloudBlob } from '@/components/u/lib/vault/sync'
import { hasVault } from '@/components/u/lib/vault/vault'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { detectPasskeyCapabilities, type PasskeyCapabilities, PRF_UPGRADE_HINT } from '@/lib/passkey-capabilities'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  redirect?: string
  /** If provided, called instead of `window.location.href = redirect` when the
   *  flow completes (after sign-in and any optional restore). Use this when
   *  the form is embedded in a dialog that should close rather than navigate. */
  onComplete?: () => void
}

export function SigninForm({ redirect = '/app', onComplete }: Props) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showRestore, setShowRestore] = useState(false)
  const [caps, setCaps] = useState<PasskeyCapabilities | null>(null)

  useEffect(() => {
    detectPasskeyCapabilities().then(setCaps)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    emitClick('ui:signin:submit')

    startTransition(async () => {
      try {
        await signIn(email, password)
        emitClick('ui:signin:success')

        // Offer cloud restore if the server has a vault envelope for this
        // user AND this device has no local vault yet.
        let offerRestore = false
        try {
          const [cloud, local] = await Promise.all([hasCloudBlob(), hasVault()])
          offerRestore = cloud && !local
        } catch {
          // best-effort — fall through to normal redirect
        }
        if (offerRestore) {
          setShowRestore(true)
          return
        }
        if (onComplete) onComplete()
        else window.location.href = redirect
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign-in failed'
        emitClick('ui:signin:error', { message })
        setError(message)
      }
    })
  }

  if (showRestore) {
    const finish = () => {
      if (onComplete) onComplete()
      else window.location.href = redirect
    }
    return <CloudRestorePanel onRestored={finish} onSkip={finish} />
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

        {/* PRF capability warning — only shown when the capability API
            definitively reports no PRF support (avoids false-positives on
            older browsers that lack getClientCapabilities) */}
        {caps && !caps.prf && caps.detected === 'capability-api' && (
          <div
            role="alert"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300"
          >
            {PRF_UPGRADE_HINT}
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
