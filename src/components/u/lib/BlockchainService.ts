/**
 * BlockchainService - Real blockchain integration for mainnet
 *
 * Supports:
 * - SUI (via JSON-RPC)
 * - ETH (via Etherscan/public RPCs)
 * - SOL (via Solana RPC)
 * - BTC (via Blockstream API)
 *
 * No mock data - all real blockchain queries
 */

// ============================================
// CHAIN CONFIGURATIONS
// ============================================

export interface ChainConfig {
  id: string
  name: string
  symbol: string
  icon: string
  color: string
  decimals: number
  rpc: string
  explorer: string
  explorerAddress: (addr: string) => string
  explorerTx: (hash: string) => string
  coingeckoId?: string
}

export const CHAINS: Record<string, ChainConfig> = {
  sui: {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    icon: '💧',
    color: 'from-cyan-400 to-blue-500',
    decimals: 9,
    rpc: 'https://fullnode.mainnet.sui.io:443',
    explorer: 'https://suiscan.xyz',
    explorerAddress: (addr) => `https://suiscan.xyz/mainnet/account/${addr}`,
    explorerTx: (hash) => `https://suiscan.xyz/mainnet/tx/${hash}`,
    coingeckoId: 'sui',
  },
  eth: {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    color: 'from-blue-500 to-indigo-600',
    decimals: 18,
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    explorerAddress: (addr) => `https://etherscan.io/address/${addr}`,
    explorerTx: (hash) => `https://etherscan.io/tx/${hash}`,
    coingeckoId: 'ethereum',
  },
  sol: {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    icon: '◎',
    color: 'from-purple-500 to-pink-500',
    decimals: 9,
    rpc: 'https://api.mainnet-beta.solana.com',
    explorer: 'https://solscan.io',
    explorerAddress: (addr) => `https://solscan.io/account/${addr}`,
    explorerTx: (hash) => `https://solscan.io/tx/${hash}`,
    coingeckoId: 'solana',
  },
  btc: {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    color: 'from-orange-400 to-orange-600',
    decimals: 8,
    rpc: 'https://blockstream.info/api',
    explorer: 'https://blockstream.info',
    explorerAddress: (addr) => `https://blockstream.info/address/${addr}`,
    explorerTx: (hash) => `https://blockstream.info/tx/${hash}`,
    coingeckoId: 'bitcoin',
  },
  base: {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    icon: '🔵',
    color: 'from-blue-400 to-blue-600',
    decimals: 18,
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    explorerAddress: (addr) => `https://basescan.org/address/${addr}`,
    explorerTx: (hash) => `https://basescan.org/tx/${hash}`,
    coingeckoId: 'ethereum',
  },
  usdc: {
    id: 'usdc',
    name: 'USDC',
    symbol: 'USDC',
    icon: '💵',
    color: 'from-blue-400 to-blue-600',
    decimals: 6,
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    explorerAddress: (addr) => `https://etherscan.io/address/${addr}#tokentxns`,
    explorerTx: (hash) => `https://etherscan.io/tx/${hash}`,
  },
  one: {
    id: 'one',
    name: 'ONEIE',
    symbol: 'ONE',
    icon: '①',
    color: 'from-emerald-400 to-teal-600',
    decimals: 18,
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    explorerAddress: (addr) => `https://etherscan.io/address/${addr}`,
    explorerTx: (hash) => `https://etherscan.io/tx/${hash}`,
  },
}

// Get chain config or default
export function getChain(chainId: string): ChainConfig {
  return CHAINS[chainId.toLowerCase()] || CHAINS.eth
}

// ============================================
// TRANSACTION TYPES
// ============================================

export interface Transaction {
  id: string
  hash: string
  type: 'send' | 'receive' | 'swap' | 'mint' | 'burn' | 'deploy' | 'interact'
  from: string
  to: string
  amount: string
  token: string
  chain: string
  status: 'confirmed' | 'pending' | 'failed'
  timestamp: number
  gasUsed?: string
  gasFee?: string
  walletId?: string
}

export interface BalanceResult {
  balance: string
  usdValue: number
}

// ============================================
// PRICE FETCHING
// ============================================

const priceCache: Record<string, { price: number; timestamp: number }> = {}
const PRICE_CACHE_TTL = 60000 // 1 minute

export async function getTokenPrice(chainId: string): Promise<number> {
  const chain = getChain(chainId)
  const coingeckoId = chain.coingeckoId

  if (!coingeckoId) {
    // Stablecoins
    if (['usdc', 'usdt'].includes(chainId.toLowerCase())) return 1.0
    return 0
  }

  // Check cache
  const cached = priceCache[coingeckoId]
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.price
  }

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`)
    const data = (await response.json()) as Record<string, { usd?: number }>
    const price = data[coingeckoId]?.usd || 0

    // Cache the result
    priceCache[coingeckoId] = { price, timestamp: Date.now() }

    return price
  } catch (error) {
    console.error(`Failed to fetch price for ${chainId}:`, error)
    return cached?.price || 0
  }
}

// ============================================
// BALANCE FETCHING
// ============================================

export async function getBalance(address: string, chainId: string): Promise<BalanceResult> {
  const _chain = getChain(chainId)

  try {
    switch (chainId.toLowerCase()) {
      case 'sui':
        return await getSuiBalance(address)
      case 'eth':
      case 'base':
        return await getEvmBalance(address, chainId)
      case 'sol':
        return await getSolBalance(address)
      case 'btc':
        return await getBtcBalance(address)
      default:
        // For unsupported chains, just return 0
        return { balance: '0', usdValue: 0 }
    }
  } catch (error) {
    console.error(`Failed to fetch balance for ${chainId}:`, error)
    return { balance: '0', usdValue: 0 }
  }
}

async function getSuiBalance(address: string): Promise<BalanceResult> {
  const response = await fetch(CHAINS.sui.rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getBalance',
      params: [address, '0x2::sui::SUI'],
    }),
  })

  const data = (await response.json()) as { result?: { totalBalance?: string } }
  const totalBalance = data.result?.totalBalance || '0'
  const balanceInSui = parseInt(totalBalance, 10) / 1e9

  const price = await getTokenPrice('sui')

  return {
    balance: balanceInSui.toFixed(6),
    usdValue: Math.round(balanceInSui * price * 100) / 100,
  }
}

async function getEvmBalance(address: string, chainId: string): Promise<BalanceResult> {
  const chain = getChain(chainId)

  // Use Etherscan for ETH, public RPC otherwise
  let balanceWei = '0'

  if (chainId === 'eth') {
    // Etherscan API (free tier)
    try {
      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=demo`,
      )
      const data = (await response.json()) as { result?: string }
      balanceWei = data.result || '0'
    } catch {
      // Fallback to RPC
      const response = await fetch(chain.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest'],
        }),
      })
      const data = (await response.json()) as { result?: string }
      balanceWei = data.result ? parseInt(data.result, 16).toString() : '0'
    }
  } else {
    // Use RPC for other EVM chains
    const response = await fetch(chain.rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    })
    const data = (await response.json()) as { result?: string }
    balanceWei = data.result ? parseInt(data.result, 16).toString() : '0'
  }

  const balanceEth = parseInt(balanceWei, 10) / 1e18
  const price = await getTokenPrice(chainId)

  return {
    balance: balanceEth.toFixed(8),
    usdValue: Math.round(balanceEth * price * 100) / 100,
  }
}

async function getSolBalance(address: string): Promise<BalanceResult> {
  const response = await fetch(CHAINS.sol.rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    }),
  })

  const data = (await response.json()) as { result?: { value?: number } }
  const balanceLamports = data.result?.value || 0
  const balanceSol = balanceLamports / 1e9

  const price = await getTokenPrice('sol')

  return {
    balance: balanceSol.toFixed(6),
    usdValue: Math.round(balanceSol * price * 100) / 100,
  }
}

async function getBtcBalance(address: string): Promise<BalanceResult> {
  const response = await fetch(`https://blockstream.info/api/address/${address}`)
  const data = (await response.json()) as {
    chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number }
  }

  const funded = data.chain_stats?.funded_txo_sum || 0
  const spent = data.chain_stats?.spent_txo_sum || 0
  const balanceSats = funded - spent
  const balanceBtc = balanceSats / 1e8

  const price = await getTokenPrice('btc')

  return {
    balance: balanceBtc.toFixed(8),
    usdValue: Math.round(balanceBtc * price * 100) / 100,
  }
}

// ============================================
// TRANSACTION FETCHING
// ============================================

export async function getTransactions(address: string, chainId: string): Promise<Transaction[]> {
  try {
    switch (chainId.toLowerCase()) {
      case 'sui':
        return await getSuiTransactions(address)
      case 'eth':
        return await getEthTransactions(address)
      case 'sol':
        return await getSolTransactions(address)
      case 'btc':
        return await getBtcTransactions(address)
      default:
        return []
    }
  } catch (error) {
    console.error(`Failed to fetch transactions for ${chainId}:`, error)
    return []
  }
}

async function getSuiTransactions(address: string): Promise<Transaction[]> {
  const allTxs: Transaction[] = []

  // Get transactions FROM this address
  const fromResponse = await fetch(CHAINS.sui.rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_queryTransactionBlocks',
      params: [
        {
          filter: { FromAddress: address },
          options: { showInput: true, showEffects: true },
        },
        null,
        25,
        true,
      ],
    }),
  })

  const fromData = (await fromResponse.json()) as { result?: { data?: Array<Record<string, any>> } }
  const fromTxs = fromData.result?.data || []

  // Get transactions TO this address
  const toResponse = await fetch(CHAINS.sui.rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'suix_queryTransactionBlocks',
      params: [
        {
          filter: { ToAddress: address },
          options: { showInput: true, showEffects: true },
        },
        null,
        25,
        true,
      ],
    }),
  })

  const toData = (await toResponse.json()) as { result?: { data?: Array<Record<string, any>> } }
  const toTxs = toData.result?.data || []

  // Combine and dedupe
  const seen = new Set<string>()
  const combined = [...fromTxs, ...toTxs]

  for (const tx of combined) {
    const digest = tx.digest as string
    if (seen.has(digest)) continue
    seen.add(digest)

    const sender = ((tx.transaction?.data as Record<string, unknown>)?.sender as string) || ''
    const status = (tx.effects?.status as Record<string, string>)?.status
    const timestamp = tx.timestampMs ? parseInt(tx.timestampMs as string, 10) : Date.now()

    allTxs.push({
      id: digest,
      hash: digest,
      type: sender.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
      from: sender,
      to: address,
      amount: '0', // Would need to parse events
      token: 'SUI',
      chain: 'sui',
      status: status === 'success' ? 'confirmed' : 'failed',
      timestamp,
    })
  }

  return allTxs.sort((a, b) => b.timestamp - a.timestamp)
}

async function getEthTransactions(address: string): Promise<Transaction[]> {
  const response = await fetch(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=25&apikey=demo`,
  )

  const data = (await response.json()) as { result?: Record<string, string>[] }

  if (!data.result || !Array.isArray(data.result)) {
    return []
  }

  return data.result.map((tx: Record<string, string>) => ({
    id: tx.hash,
    hash: tx.hash,
    type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
    from: tx.from,
    to: tx.to,
    amount: (parseInt(tx.value, 10) / 1e18).toFixed(8),
    token: 'ETH',
    chain: 'eth',
    status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
    timestamp: parseInt(tx.timeStamp, 10) * 1000,
    gasUsed: tx.gasUsed,
    gasFee: ((parseInt(tx.gasUsed, 10) * parseInt(tx.gasPrice, 10)) / 1e18).toFixed(10),
  }))
}

async function getSolTransactions(address: string): Promise<Transaction[]> {
  const response = await fetch(CHAINS.sol.rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [address, { limit: 25 }],
    }),
  })

  const data = (await response.json()) as { result?: Record<string, unknown>[] }

  if (!data.result || !Array.isArray(data.result)) {
    return []
  }

  return data.result.map((sig: Record<string, unknown>) => ({
    id: sig.signature as string,
    hash: sig.signature as string,
    type: 'interact' as const, // Solana doesn't easily give direction
    from: address,
    to: '',
    amount: '0',
    token: 'SOL',
    chain: 'sol',
    status: sig.err ? 'failed' : 'confirmed',
    timestamp: ((sig.blockTime as number) || Math.floor(Date.now() / 1000)) * 1000,
  }))
}

async function getBtcTransactions(address: string): Promise<Transaction[]> {
  const response = await fetch(`https://blockstream.info/api/address/${address}/txs`)
  const data = await response.json()

  if (!Array.isArray(data)) {
    return []
  }

  return data.slice(0, 25).map((tx: Record<string, unknown>) => {
    const status = tx.status as Record<string, unknown> | undefined
    return {
      id: tx.txid as string,
      hash: tx.txid as string,
      type: 'receive' as const, // Would need to check inputs/outputs
      from: '...',
      to: address,
      amount: '0',
      token: 'BTC',
      chain: 'btc',
      status: status?.confirmed ? 'confirmed' : 'pending',
      timestamp: ((status?.block_time as number) || Math.floor(Date.now() / 1000)) * 1000,
    }
  })
}

// ============================================
// EXPLORER URL HELPERS
// ============================================

export function getExplorerTxUrl(hash: string, chainId: string): string {
  const chain = getChain(chainId)
  return chain.explorerTx(hash)
}

export function getExplorerAddressUrl(address: string, chainId: string): string {
  const chain = getChain(chainId)
  return chain.explorerAddress(address)
}

// ============================================
// TRANSACTION BROADCASTING (for real sends)
// ============================================

// Note: Actual transaction signing/broadcasting requires:
// 1. Private key access (from secure storage)
// 2. Transaction construction (chain-specific)
// 3. Signing with the private key
// 4. Broadcasting to the network
//
// This is a placeholder that would be implemented with proper key management
export async function broadcastTransaction(
  fromAddress: string,
  toAddress: string,
  amount: string,
  chainId: string,
  privateKey: string,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  // For SUI transactions, we'd use @mysten/sui.js
  // For ETH transactions, we'd use ethers.js or viem
  // For SOL transactions, we'd use @solana/web3.js
  // For BTC transactions, we'd use bitcoinjs-lib

  // This requires proper SDK integration
  // For now, return a placeholder error
  return {
    success: false,
    error: 'Transaction signing not implemented. Requires SDK integration.',
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  CHAINS,
  getChain,
  getTokenPrice,
  getBalance,
  getTransactions,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  broadcastTransaction,
}
