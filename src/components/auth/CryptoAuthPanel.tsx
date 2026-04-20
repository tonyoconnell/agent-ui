/**
 * CryptoAuthPanel — the crypto-first auth surface used by /signin and /signup.
 *
 * Wraps SignInWithAnything (Sui wallet + Google zkLogin + MetaMask Snap) with
 * mode-specific copy. Sign-up and sign-in collapse to the same flow in a
 * crypto-first world: `wallet/verify` creates a session regardless of whether
 * the wallet has signed in before — if it's new, a user record is created.
 *
 * Fast-payments framing: the same wallet that signs your identity signs your
 * payments. No password step between "I am X" and "I am paying Y."
 */

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import '@mysten/dapp-kit/dist/index.css'
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { SignInWithAnything } from './SignInWithAnything'

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' },
  mainnet: { url: getJsonRpcFullnodeUrl('mainnet'), network: 'mainnet' },
})

interface Props {
  mode: 'signin' | 'signup'
  redirect?: string
}

export function CryptoAuthPanel({ mode, redirect = '/app' }: Props) {
  const [queryClient] = useState(() => new QueryClient())

  const heading = mode === 'signup' ? 'Create your identity' : 'Sign in to ONE'
  const badge = mode === 'signup' ? 'First time here' : 'Welcome back'
  const subline =
    mode === 'signup'
      ? 'Your wallet is your account. Your signature is your password. The same key pays for every capability you use.'
      : 'Your agents are waiting. Memory intact. Highways still open.'

  const handleSuccess = () => {
    window.location.href = redirect
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect={mode === 'signin'}>
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300">
                <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
                {badge}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{heading}</h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{subline}</p>
            </div>

            <SignInWithAnything onSuccess={handleSuccess} />

            <div className="mt-8 space-y-3 text-xs text-zinc-500">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-block size-1 rounded-full bg-emerald-400" aria-hidden="true" />
                <span>
                  <span className="text-zinc-300">No password.</span> Cryptographic signatures prove wallet control —
                  nothing to remember, nothing to leak.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-block size-1 rounded-full bg-sky-400" aria-hidden="true" />
                <span>
                  <span className="text-zinc-300">Same key pays.</span> The wallet that signs you in signs every
                  transaction — sub-second payments, no checkout step.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-block size-1 rounded-full bg-violet-400" aria-hidden="true" />
                <span>
                  <span className="text-zinc-300">Your memory, your keys.</span> Paths, hypotheses, and revenue are
                  bound to your address — portable across any ONE world.
                </span>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">
              {mode === 'signup' ? (
                <>
                  Already signed in before?{' '}
                  <a
                    href="/signin"
                    className="font-medium text-zinc-300 underline-offset-4 hover:text-white hover:underline"
                  >
                    Sign in
                  </a>
                </>
              ) : (
                <>
                  New here?{' '}
                  <a
                    href="/signup"
                    className="font-medium text-zinc-300 underline-offset-4 hover:text-white hover:underline"
                  >
                    Create an identity
                  </a>
                </>
              )}
            </p>
          </div>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
