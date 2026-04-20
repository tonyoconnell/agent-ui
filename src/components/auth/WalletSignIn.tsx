import { ConnectButton, useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit'
import '@mysten/dapp-kit/dist/index.css'
import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  onSuccess?: (result: { uid: string; wallet: string }) => void
  label?: string
}

type Phase = 'idle' | 'nonce' | 'signing' | 'verifying' | 'done' | 'error'

export function WalletSignIn({ onSuccess, label = 'Sign in with Sui' }: Props) {
  const account = useCurrentAccount()
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  if (!account) {
    return <ConnectButton />
  }

  const signIn = async () => {
    emitClick('ui:auth:wallet:sign', { address: account.address })
    setError(null)
    setPhase('nonce')
    try {
      const nonceRes = await fetch(`/api/auth/wallet/nonce?addr=${account.address}`)
      if (!nonceRes.ok) {
        const { error: e } = (await nonceRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(e ?? 'nonce fetch failed')
      }
      const { nonce, message } = (await nonceRes.json()) as { nonce: string; message: string }

      setPhase('signing')
      const { signature } = await signPersonalMessage({
        message: new TextEncoder().encode(message),
      })

      setPhase('verifying')
      const verifyRes = await fetch('/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address, signature, nonce }),
      })
      if (!verifyRes.ok) {
        const { error: e } = (await verifyRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(e ?? 'verify failed')
      }
      const result = (await verifyRes.json()) as { uid: string; wallet: string }
      setPhase('done')
      onSuccess?.(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'sign-in failed')
      setPhase('error')
    }
  }

  const busy = phase === 'nonce' || phase === 'signing' || phase === 'verifying'
  const labelText =
    phase === 'nonce'
      ? 'Fetching challenge…'
      : phase === 'signing'
        ? 'Waiting for signature…'
        : phase === 'verifying'
          ? 'Verifying…'
          : phase === 'done'
            ? 'Signed in ✓'
            : label

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={signIn}
        disabled={busy || phase === 'done'}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
      >
        {labelText}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
