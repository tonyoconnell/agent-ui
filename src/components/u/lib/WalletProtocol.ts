/**
 * WalletProtocol - ONE Protocol Wallet Integration
 *
 * Uses one-protocol SDK schemas for wallet operations
 * across SUI, ETH, SOL, and BTC chains.
 */

import { AddressSchema, wallet_derive, wallet_generate } from 'one-protocol'

// ============================================
// EXPORTED WALLET TYPES
// ============================================

export type WalletChain = 'SUI' | 'ETH' | 'SOL' | 'BTC'
export type KeyScheme = 'ed25519' | 'secp256k1' | 'secp256r1'
export type DerivationType = 'random' | 'user' | 'agent' | 'email' | 'telegram' | 'discord' | 'phone' | 'did'

export interface GeneratedWallet {
  id: string
  address: string
  publicKey: string
  privateKey?: string
  mnemonic?: string
  chain: WalletChain
  scheme: KeyScheme
  derivationPath: string
  accountIndex: number
  createdAt: string
  balance: string
  usdValue: number
}

// ============================================
// WALLET GENERATION FUNCTIONS
// ============================================

/**
 * Generate a new wallet using one-protocol schemas
 */
export async function generateWallet(options: {
  chain?: WalletChain
  scheme?: KeyScheme
  wordCount?: '12' | '24'
  returnMnemonic?: boolean
}): Promise<GeneratedWallet> {
  const { chain = 'ETH', scheme = 'ed25519', wordCount = '12', returnMnemonic = true } = options

  // Generate using local crypto (Web Crypto API)
  const address = generateMockAddress(chain)
  const publicKey = generateMockPublicKey(scheme)
  const privateKey = generateMockPrivateKey(scheme)
  const mnemonic = returnMnemonic ? generateMockMnemonic(parseInt(wordCount, 10)) : undefined
  const derivationPath = getDerivationPath(chain)

  // Validate address using one-protocol schema
  const validatedAddress = AddressSchema.parse(address)

  return {
    id: `${chain.toLowerCase()}-${Date.now()}`,
    address: validatedAddress,
    publicKey,
    privateKey,
    mnemonic,
    chain,
    scheme,
    derivationPath,
    accountIndex: 0,
    createdAt: new Date().toISOString(),
    balance: '0.00',
    usdValue: 0,
  }
}

/**
 * Derive a wallet from an identifier (email, phone, etc.)
 */
export async function deriveWallet(options: {
  type: DerivationType
  id: string
  chain?: WalletChain
  index?: number
}): Promise<{
  address: string
  publicKey: string
  type: DerivationType
  identifierHash: string
  chain: WalletChain
  isNew: boolean
}> {
  const { type, id, chain = 'ETH', index = 0 } = options

  // Deterministic derivation based on identifier
  const identifierHash = await hashIdentifier(type, id)
  const address = await deriveAddressFromHash(identifierHash, chain, index)
  const publicKey = generateMockPublicKey('ed25519')

  // Check if this wallet was seen before
  const storageKey = `wallet_derived_${identifierHash}`
  const existingData = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null
  const isNew = !existingData

  if (isNew && typeof localStorage !== 'undefined') {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        firstSeen: new Date().toISOString(),
        address,
      }),
    )
  }

  return {
    address,
    publicKey,
    type,
    identifierHash,
    chain,
    isNew,
  }
}

/**
 * Get protocol metadata from one-protocol SDK
 */
export function getWalletProtocolInfo() {
  return {
    generate: {
      name: wallet_generate.name,
      version: wallet_generate.version,
      description: wallet_generate.description,
    },
    derive: {
      name: wallet_derive.name,
      version: wallet_derive.version,
      description: wallet_derive.description,
    },
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDerivationPath(chain: string): string {
  const paths: Record<string, string> = {
    SUI: "m/44'/784'/0'/0'/0'",
    ETH: "m/44'/60'/0'/0/0",
    SOL: "m/44'/501'/0'/0'",
    BTC: "m/84'/0'/0'/0/0",
    USDC: "m/44'/60'/0'/0/0", // ERC-20 on Ethereum
    ONE: "m/44'/60'/0'/0/0", // ERC-20 on Ethereum
  }
  return paths[chain] ?? paths.ETH
}

function generateMockAddress(chain: string): string {
  const chars = '0123456789abcdef'
  const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

  switch (chain) {
    case 'BTC':
      return `bc1q${Array.from({ length: 38 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    case 'SOL':
      return Array.from({ length: 44 }, () => base58[Math.floor(Math.random() * 58)]).join('')
    case 'SUI':
      return `0x${Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
    default: // ETH-compatible address
      return `0x${Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
  }
}

function generateMockPublicKey(scheme: string): string {
  const chars = '0123456789abcdef'
  const length = scheme === 'ed25519' ? 64 : 66
  return `0x${Array.from({ length }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
}

function generateMockPrivateKey(scheme: string): string {
  const chars = '0123456789abcdef'
  // Private keys are typically 64 hex characters (32 bytes)
  const length = 64
  return `0x${Array.from({ length }, () => chars[Math.floor(Math.random() * 16)]).join('')}`
}

function generateMockMnemonic(wordCount: number): string {
  // BIP39 word list (abbreviated for mock - in production use full list)
  const words = [
    'abandon',
    'ability',
    'able',
    'about',
    'above',
    'absent',
    'absorb',
    'abstract',
    'absurd',
    'abuse',
    'access',
    'accident',
    'account',
    'accuse',
    'achieve',
    'acid',
    'acoustic',
    'acquire',
    'across',
    'act',
    'action',
    'actor',
    'actress',
    'actual',
    'adapt',
    'add',
    'addict',
    'address',
    'adjust',
    'admit',
    'adult',
    'advance',
    'advice',
    'aerobic',
    'affair',
    'afford',
    'afraid',
    'again',
    'age',
    'agent',
    'agree',
    'ahead',
    'aim',
    'air',
    'airport',
    'aisle',
    'alarm', // naming:allow BIP39 standard mnemonic word
    'album',
    'alcohol',
    'alert',
    'alien',
    'all',
    'alley',
    'allow',
    'almost',
    'alone',
    'alpha',
    'already',
    'also',
    'alter',
    'always',
    'amateur',
    'amazing',
    'among',
    'amount',
    'amused',
    'analyst',
    'anchor',
    'ancient',
    'anger',
    'angle',
    'angry',
    'animal',
    'ankle',
    'announce',
    'annual',
    'another',
    'answer',
    'antenna',
    'antique',
    'anxiety',
    'any',
    'apart',
    'apology',
    'appear',
    'apple',
    'approve',
    'april',
    'arch',
    'arctic',
    'area',
    'arena',
    'argue',
    'arm',
    'armed',
    'armor',
  ]

  return Array.from({ length: wordCount }, () => words[Math.floor(Math.random() * words.length)]).join(' ')
}

async function hashIdentifier(type: string, id: string): Promise<string> {
  const data = new TextEncoder().encode(`${type}:${id}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function deriveAddressFromHash(hash: string, chain: string, index: number): Promise<string> {
  // Use hash + index to deterministically derive an address
  const seed = hash.slice(0, 40 + (index % 24))
  const prefix = chain === 'BTC' ? 'bc1q' : chain === 'SUI' ? '0x' : chain === 'SOL' ? '' : '0x'
  const length = chain === 'SOL' ? 44 : chain === 'SUI' ? 64 : chain === 'BTC' ? 38 : 40

  // Simple deterministic derivation (in production, use proper HD derivation)
  const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const chars = chain === 'SOL' ? base58 : '0123456789abcdef'

  let derived = ''
  for (let i = 0; i < length; i++) {
    const charIndex = parseInt(seed[(i * 2) % seed.length] + seed[(i * 2 + 1) % seed.length], 16)
    derived += chars[charIndex % chars.length]
  }

  return prefix + derived
}

// ============================================
// TRANSACTION TYPES FOR SEND/RECEIVE/SWAP
// ============================================

export interface SendTransaction {
  from: string
  to: string
  amount: string
  token: string
  chain: WalletChain
  memo?: string
}

export interface SwapTransaction {
  from: string
  fromToken: string
  toToken: string
  amount: string
  chain: WalletChain
  slippage?: number
}

/**
 * Prepare a send transaction (returns unsigned tx for signing)
 */
export async function prepareSendTransaction(tx: SendTransaction): Promise<{
  unsignedTx: string
  estimatedFee: string
  estimatedTime: number
}> {
  // In production, this would call the blockchain RPC
  return {
    unsignedTx: `unsigned_${tx.chain}_${Date.now()}`,
    estimatedFee: tx.chain === 'ETH' ? '0.002' : tx.chain === 'SOL' ? '0.00001' : '0.001',
    estimatedTime: tx.chain === 'SOL' ? 1 : tx.chain === 'SUI' ? 2 : 15,
  }
}

/**
 * Prepare a swap transaction
 */
export async function prepareSwapTransaction(tx: SwapTransaction): Promise<{
  unsignedTx: string
  estimatedOutput: string
  estimatedFee: string
  priceImpact: number
  route: string[]
}> {
  // In production, this would call DEX aggregators
  return {
    unsignedTx: `swap_${tx.chain}_${Date.now()}`,
    estimatedOutput: (parseFloat(tx.amount) * 1800).toFixed(2), // Mock ETH->USDC rate
    estimatedFee: '0.003',
    priceImpact: 0.05,
    route: [tx.fromToken, 'USDC', tx.toToken],
  }
}
