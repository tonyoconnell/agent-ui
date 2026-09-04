/**
 * CryptoAuthPanel — the crypto-first auth surface used by /signin and /signup.
 *
 * Wraps SignInWithAnything (Sui wallet + Google zkLogin) with mode-specific copy.
 * Sign-up and sign-in collapse to the same flow in a crypto-first world:
 * `wallet/verify` creates a session regardless of whether the wallet has signed in
 * before — if it's new, a user record is created.
 *
 * Fast-payments framing: the same wallet that signs your identity signs your
 * payments. No password step between "I am X" and "I am paying Y."
 */

import { AppProviders } from '@/components/u/providers'
import { AuthSurface } from './AuthSurface'

interface Props {
  mode: 'signin' | 'signup'
  redirect?: string
}

export function CryptoAuthPanel({ mode, redirect = '/app' }: Props) {
  const heading = mode === 'signup' ? 'Create your identity' : 'Sign in to ONE'
  const badge = mode === 'signup' ? 'First time here' : 'Welcome back'
  const subline =
    mode === 'signup'
      ? 'Your wallet is your account. Your signature is your password. The same key pays for every capability you use.'
      : 'Your agents are waiting. Memory intact. Highways still open.'

  return (
    <AppProviders autoConnect={mode === 'signin'}>
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--color-secondary-bright)/0.3)] bg-[hsl(var(--color-secondary-bright)/0.1)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--color-secondary-bright))]">
            <span className="size-1.5 rounded-full bg-[hsl(var(--color-secondary-bright))] animate-pulse" />
            {badge}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{heading}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subline}</p>
        </div>

        <AuthSurface mode={mode} redirect={redirect} />

        <div className="mt-8 space-y-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <span
              className="mt-0.5 inline-block size-1 rounded-full bg-[hsl(var(--color-tertiary-bright))]"
              aria-hidden="true"
            />
            <span>
              <span className="text-foreground">Touch ID / Face ID.</span> Cryptographic signatures prove you. Nothing
              to type, nothing to leak.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span
              className="mt-0.5 inline-block size-1 rounded-full bg-[hsl(var(--color-primary-bright))]"
              aria-hidden="true"
            />
            <span>
              <span className="text-foreground">Same key pays.</span> The wallet that signs you in signs every
              transaction — sub-second payments, no checkout step.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span
              className="mt-0.5 inline-block size-1 rounded-full bg-[hsl(var(--color-secondary-bright))]"
              aria-hidden="true"
            />
            <span>
              <span className="text-foreground">Your memory, your keys.</span> Paths, hypotheses, and revenue are bound
              to your address — portable across any ONE world.
            </span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === 'signup' ? (
            <>
              Already signed in before?{' '}
              <a
                href="/signin"
                className="font-medium text-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Sign in
              </a>
            </>
          ) : (
            <>
              New here?{' '}
              <a
                href="/signup"
                className="font-medium text-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Create an identity
              </a>
            </>
          )}
        </p>
      </div>
    </AppProviders>
  )
}
