import { cn } from '@/lib/utils'
import type { ChainState, Network } from './types'

const NETWORK_LABEL: Record<Network, string> = {
  testnet: 'Testnet',
  mainnet: 'Mainnet',
  devnet: 'Devnet',
  offchain: 'Off-chain',
}

const NETWORK_DOT: Record<Network, string> = {
  testnet: 'bg-amber-400',
  mainnet: 'bg-emerald-400',
  devnet: 'bg-sky-400',
  offchain: 'bg-white/30',
}

const explorerUrl = (network: Network, digest: string) =>
  network === 'offchain' ? null : `https://suiexplorer.com/txblock/${digest}?network=${network}`

export function ChainBadge({ chain, compact = false }: { chain?: ChainState; compact?: boolean }) {
  if (!chain) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/25">
        <span className="w-1 h-1 rounded-full bg-white/15" />
        draft
      </span>
    )
  }

  const label = NETWORK_LABEL[chain.network]
  const dot = NETWORK_DOT[chain.network]
  const url = chain.txDigest ? explorerUrl(chain.network, chain.txDigest) : null

  const body = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5',
        compact ? 'text-[9px]' : 'text-[10px]',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dot, chain.network !== 'offchain' && 'animate-pulse')} />
      <span className="font-mono text-white/70">{label}</span>
      {chain.txDigest && !compact && (
        <span className="font-mono text-white/30 tabular-nums">{chain.txDigest.slice(0, 6)}…</span>
      )}
    </span>
  )

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="hover:brightness-125 transition-all"
      onClick={(e) => e.stopPropagation()}
    >
      {body}
    </a>
  ) : (
    body
  )
}
