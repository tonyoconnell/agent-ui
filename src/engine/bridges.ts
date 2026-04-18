/**
 * Bridge Units — Chain RPCs as substrate units.
 *
 * Wraps BlockchainService (src/lib/chains.ts) as three substrate units:
 *   bridge:evm  — ETH, Base, Arb, Polygon (via llamarpc)
 *   bridge:sol  — Solana (via mainnet-beta RPC)
 *   bridge:btc  — Bitcoin (via Blockstream REST)
 *
 * No bridge:sui — Sui is home. src/lib/sui.ts used directly.
 *
 * Signal shape:
 *   { receiver: 'bridge:evm:balance', data: { address: '0x...' } }
 *   { receiver: 'bridge:sol:history', data: { address: 'abc...' } }
 *   { receiver: 'bridge:btc:price' }
 *
 * Returns: { result } on success, dissolves on missing/invalid input.
 * Zero-returns: if address is absent, signal dissolves silently.
 */

import { getBalance, getTokenPrice, getTransactions } from '@/lib/chains'
import type { World } from './world'

type BridgeChain = 'evm' | 'sol' | 'btc'

// Maps substrate bridge id → BlockchainService chainId
const CHAIN_ID: Record<BridgeChain, string> = {
  evm: 'eth',
  sol: 'sol',
  btc: 'btc',
}

export function registerBridges(net: World): void {
  const bridges: BridgeChain[] = ['evm', 'sol', 'btc']

  for (const bridge of bridges) {
    const chainId = CHAIN_ID[bridge]

    net
      .add(`bridge:${bridge}`)
      .on('balance', async (data: unknown) => {
        const { address } = (data ?? {}) as { address?: string }
        if (!address) return null
        return await getBalance(address, chainId).catch(() => null)
      })
      .on('history', async (data: unknown) => {
        const { address } = (data ?? {}) as { address?: string }
        if (!address) return null
        return await getTransactions(address, chainId).catch(() => null)
      })
      .on('price', async () => {
        return { price: await getTokenPrice(chainId).catch(() => 0) }
      })
  }
}
