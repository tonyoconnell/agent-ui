import { useState } from 'react'
import { createAccountWithPasskey, signInWithPasskey } from '@/components/u/lib/vault/passkey-cloud'
import { emitClick } from '@/lib/ui-signal'
import { useExistingSeed } from './useExistingSeed'

interface Props {
  mode: 'signin' | 'signup'
  redirect?: string
  onSuccess?: () => void
  onError?: (err: string) => void
}

export function PasskeyButton({ mode, redirect = '/app', onSuccess, onError }: Props) {
  const [pending, setPending] = useState(false)
  const { bind } = useExistingSeed()

  if (typeof window !== 'undefined' && !window.PublicKeyCredential) return null

  async function handle() {
    emitClick('ui:auth:passkey:start')
    setPending(true)
    try {
      try {
        await signInWithPasskey()
      } catch (e: any) {
        if ((e?.name === 'NotAllowedError' || e?.message?.includes('cancelled')) && mode === 'signup') {
          await createAccountWithPasskey()
        } else {
          throw e
        }
      }
      await bind('passkey')
      emitClick('ui:auth:passkey:success')
      window.location.href = redirect
      onSuccess?.()
    } catch (e: any) {
      emitClick('ui:auth:passkey:fail')
      const name = e?.name ?? ''
      if (name === 'NotAllowedError' || e?.message?.includes('cancelled')) {
        onError?.('Passkey cancelled. Try again or use a different door.')
      } else if (name === 'InvalidStateError') {
        onError?.('A passkey for this device already exists — use it to sign in.')
      } else {
        onError?.(e?.message ?? 'Passkey sign-in failed.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={handle}
      className="relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-100 disabled:opacity-60"
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Waiting for biometric…</span>
        </>
      ) : (
        <>
          <span className="size-1.5 rounded-full bg-violet-500 animate-pulse" aria-hidden="true" />
          <span>Continue with Touch ID / Face ID</span>
        </>
      )}
    </button>
  )
}
