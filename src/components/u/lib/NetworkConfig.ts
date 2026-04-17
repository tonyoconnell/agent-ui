/**
 * Network Configuration
 *
 * Defines supported blockchain networks, RPC endpoints, and explorer URLs
 * for the ONE Protocol frontend.
 */

export interface Network {
  id: string
  name: string
  symbol: string
  type: 'evm' | 'svm' | 'move' | 'utxo'
  mainnet: boolean
  rpcUrl: string
  explorerUrl: string
  chainId?: number
  logoUrl?: string
  nativeToken: string
}

export const SUPPORTED_NETWORKS: Record<string, Network> = {
  // EVM Chains
  eth: {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'evm',
    mainnet: true,
    rpcUrl: 'https://eth.llamaRpc.com',
    explorerUrl: 'https://etherscan.io',
    chainId: 1,
    nativeToken: 'ETH',
  },
  base: {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    type: 'evm',
    mainnet: true,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    chainId: 8453,
    nativeToken: 'ETH',
  },

  // SVM Chains
  sol: {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    type: 'svm',
    mainnet: true,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    nativeToken: 'SOL',
  },

  // Move Chains
  sui: {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    type: 'move',
    mainnet: true,
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    explorerUrl: 'https://suiscan.xyz',
    nativeToken: 'SUI',
  },

  // UTXO Chains
  btc: {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    type: 'utxo',
    mainnet: true,
    rpcUrl: 'https://mempool.space/api',
    explorerUrl: 'https://mempool.space',
    nativeToken: 'BTC',
  },
}

export const TEST_NETWORKS: Record<string, Network> = {
  eth_sepolia: {
    id: 'eth_sepolia',
    name: 'Sepolia',
    symbol: 'ETH',
    type: 'evm',
    mainnet: false,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    chainId: 11155111,
    nativeToken: 'ETH',
  },
  base_sepolia: {
    id: 'base_sepolia',
    name: 'Base Sepolia',
    symbol: 'ETH',
    type: 'evm',
    mainnet: false,
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    chainId: 84532,
    nativeToken: 'ETH',
  },
  sui_testnet: {
    id: 'sui_testnet',
    name: 'Sui Testnet',
    symbol: 'SUI',
    type: 'move',
    mainnet: false,
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    explorerUrl: 'https://suiscan.xyz/testnet',
    nativeToken: 'SUI',
  },
}

export const DEFAULT_NETWORK = SUPPORTED_NETWORKS.base

export function getNetwork(chainId: string | number): Network | undefined {
  const all = { ...SUPPORTED_NETWORKS, ...TEST_NETWORKS }
  return Object.values(all).find((n) => n.id === chainId || n.chainId === chainId)
}
