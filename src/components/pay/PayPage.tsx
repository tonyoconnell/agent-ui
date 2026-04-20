import {
  ConnectButton,
  createNetworkConfig,
  SuiClientProvider,
  useCurrentAccount,
  WalletProvider,
} from '@mysten/dapp-kit'
import '@mysten/dapp-kit/dist/index.css'
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  skillId: string
  skillName: string
  price: number
  seller: string
}

type PayState = 'connect' | 'review' | 'paying' | 'done' | 'error'

const PLATFORM_FEE = 0.02

// Stable network config — referenced by identity in SuiClientProvider, so
// it must be module-level (not re-created on every render).
const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' },
  mainnet: { url: getJsonRpcFullnodeUrl('mainnet'), network: 'mainnet' },
})

function PayPageContent({ skillId, skillName, price, seller }: Props) {
  const account = useCurrentAccount()
  const [state, setState] = useState<PayState>('connect')
  const [receipt, setReceipt] = useState<{ digest: string; escrowId: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fee = price * PLATFORM_FEE
  const sellerReceives = price - fee

  const handlePay = () => {
    emitClick('ui:pay:confirm', { skillId, amount: price })
    startTransition(async () => {
      setState('paying')
      try {
        // /api/signal requires sender + receiver at the top level.
        // The buyer's wallet address is the sender; pay:initiate is the receiver.
        // USDC has 6 decimals — the micro-unit amount lives in data.amount (not
        // the top-level field, which is capped at 1M and meant for dollar weight).
        const buyer = account?.address ?? 'anon'
        const res = await fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: buyer,
            receiver: 'pay:initiate',
            data: {
              skillId,
              buyerUid: buyer,
              sellerUid: seller,
              amount: Math.round(price * 1_000_000),
            },
          }),
        })

        const json = (await res.json()) as Record<string, unknown>
        const result = json.result as { digest?: string; escrowId?: string } | undefined
        if (result?.digest) {
          setReceipt({ digest: result.digest, escrowId: result.escrowId ?? '' })
          setState('done')
        } else if (json.timeout) {
          setErrorMsg('Network timeout — funds not moved. Please retry.')
          setState('error')
        } else {
          setErrorMsg((json.error as string | undefined) ?? 'Payment could not be completed.')
          setState('error')
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        setState('error')
      }
    })
  }

  if (!account && state === 'connect') {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold text-white">{skillName}</h1>
          <p className="text-3xl font-bold text-white">
            ${price.toFixed(2)} <span className="text-base font-normal text-zinc-400">USDC</span>
          </p>
          <p className="text-sm text-zinc-500">Connect your Sui wallet to pay</p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  if (account && state === 'connect') {
    setState('review')
  }

  if (state === 'done' && receipt) {
    return (
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-xl border border-emerald-800 bg-emerald-950/30 p-6 text-center space-y-3">
          <div className="text-2xl">✓</div>
          <h1 className="text-lg font-semibold text-emerald-400">Payment complete</h1>
          <p className="text-sm text-zinc-400">{skillName}</p>
          <p className="text-xs text-zinc-500 break-all">TX: {receipt.digest}</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-xl border border-red-900 bg-red-950/30 p-6 text-center space-y-3">
          <div className="text-2xl">✗</div>
          <h1 className="text-lg font-semibold text-red-400">Payment failed</h1>
          <p className="text-sm text-zinc-400">{errorMsg}</p>
          <button
            type="button"
            onClick={() => {
              emitClick('ui:pay:retry', { skillId })
              setState('review')
            }}
            className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
        <h1 className="text-xl font-semibold text-white">{skillName}</h1>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-300">
            <span>Price</span>
            <span>${price.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Platform fee (2%)</span>
            <span>−${fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-400 border-t border-zinc-800 pt-2">
            <span>Seller receives</span>
            <span>${sellerReceives.toFixed(2)} USDC</span>
          </div>
        </div>

        <div className="text-xs text-zinc-600 space-y-1">
          <p>
            From:{' '}
            <span className="font-mono">
              {account?.address?.slice(0, 8)}…{account?.address?.slice(-6)}
            </span>
          </p>
          <p>Settled via Sui escrow on testnet</p>
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={isPending || state === 'paying'}
          className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium transition-colors"
        >
          {state === 'paying' ? 'Confirming…' : `Pay $${price.toFixed(2)} USDC`}
        </button>
      </div>
    </div>
  )
}

export function PayPage(props: Props) {
  // Lazy QueryClient so the instance is stable across re-renders but not
  // shared between component trees (each PayPage mount gets its own).
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <PayPageContent {...props} />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
