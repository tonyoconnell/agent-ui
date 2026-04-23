import {
  ConnectButton,
  useCurrentAccount,
} from '@mysten/dapp-kit'
import { useState, useTransition } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { AppProviders } from '@/components/u/providers'

interface Props {
  skillId: string
  skillName: string
  price: number
  seller: string
}

type PayState = 'connect' | 'review' | 'paying' | 'done' | 'error'

const PLATFORM_FEE = 0.02

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
        // /api/signal requires sender + receiver at the top level and data as a
        // JSON string (not an object). USDC has 6 decimals — the micro-unit
        // amount lives inside the data payload.
        const buyer = account?.address ?? 'anon'
        const payload = {
          skillId,
          buyerUid: buyer,
          sellerUid: seller,
          amount: Math.round(price * 1_000_000),
        }
        const res = await fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: buyer,
            receiver: 'pay:initiate',
            data: JSON.stringify(payload),
          }),
        })

        const json = (await res.json()) as {
          ok?: boolean
          sui?: string | null
          result?: string | null
          error?: string
          timeout?: boolean
        }

        // Success path: Sui mirror created a real transaction digest
        if (json.sui) {
          setReceipt({ digest: json.sui, escrowId: '' })
          setState('done')
          return
        }
        if (json.timeout) {
          setErrorMsg('Network timeout — funds not moved. Please retry.')
          setState('error')
          return
        }
        // No Sui config on the server — surface a clear message plus a
        // fallback CTA to pay.one.ie that the UI will render from `error` state.
        setErrorMsg(
          json.error ??
            'On-chain settlement is not configured on this environment. Continue at pay.one.ie to complete the payment.',
        )
        setState('error')
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
    // Always-works fallback: build the pay.one.ie URL client-side. No API
    // call can fail because the URL is just deterministic string construction.
    const buyer = account?.address ?? ''
    const fallbackUrl = `https://pay.one.ie/pay?to=${encodeURIComponent(
      seller,
    )}&amount=${price}&token=USDC&chain=sui&product=${encodeURIComponent(skillId)}${
      buyer ? `&from=${encodeURIComponent(buyer)}` : ''
    }`
    return (
      <div className="w-full max-w-md space-y-3">
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-6 space-y-3">
          <h1 className="text-base font-semibold text-amber-300">Finish at pay.one.ie</h1>
          <p className="text-sm text-zinc-400">{errorMsg}</p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => emitClick('ui:pay:fallback-payone', { skillId, amount: price })}
            className="flex items-center justify-between w-full px-5 py-3.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold transition-all shadow-lg shadow-emerald-900/30"
          >
            <span>Open pay.one.ie</span>
            <span className="font-mono text-sm opacity-90">${price.toFixed(2)} USDC →</span>
          </a>
          <button
            type="button"
            onClick={() => {
              emitClick('ui:pay:retry', { skillId })
              setErrorMsg(null)
              setState('review')
            }}
            className="w-full py-2 text-sm rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            Retry on-chain
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
  return (
    <AppProviders autoConnect>
      <PayPageContent {...props} />
    </AppProviders>
  )
}
