import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { useExistingSeed } from './useExistingSeed'

interface Props {
  redirect?: string
  onError?: (err: string) => void
}

export function GoogleButton({ redirect = '/app', onError }: Props) {
  const [pending, setPending] = useState(false)
  const { bind } = useExistingSeed()

  async function handle() {
    emitClick('ui:auth:google:start')
    setPending(true)
    try {
      await bind('google')
      // Dynamic import to avoid SSR issues with the auth client
      const { authClient } = await import('@/lib/auth-client')
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirect,
      })
      // Redirect happens via the OAuth flow; page navigates away
    } catch (e: any) {
      emitClick('ui:auth:google:fail')
      setPending(false)
      if (e?.message?.includes('denied') || e?.message?.includes('cancelled')) {
        onError?.('Google sign-in cancelled.')
      } else {
        onError?.("Couldn't reach Google. Try again.")
      }
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      aria-label="Sign in with Google"
      onClick={handle}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-60"
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Redirecting to Google…</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Google</span>
        </>
      )}
    </button>
  )
}
