import type { Signer } from './types'

// Minimal session shape — only what resolveSigner needs
interface SessionLike {
  frontDoor?: 'wallet' | 'zklogin'
  address?: string
  userId?: string
}

interface DappKitState {
  currentAccount: { address: string } | null
}

interface VaultSessionLike {
  masterKey: CryptoKey
}

export function resolveSigner(
  session: SessionLike | null,
  dappKit: DappKitState | null,
  vaultSession: VaultSessionLike | null,
): Signer | null {
  // zkLogin: session says zklogin AND we have an address from it
  if (session?.frontDoor === 'zklogin' && session?.address) {
    return createZkLoginSigner(session.address)
  }
  // dapp-kit: a Sui wallet is connected
  if (dappKit?.currentAccount?.address) {
    return createDappKitSigner(dappKit.currentAccount.address)
  }
  // vault: vault is unlocked
  if (vaultSession) {
    return createVaultSigner()
  }
  return null
}

// Placeholder creators — adapters fill these in
function createZkLoginSigner(address: string): Signer {
  return {
    kind: 'zklogin',
    chain: 'sui',
    address,
    frontDoor: 'zklogin',
    async signMessage() {
      throw new Error('zklogin-signer: not yet implemented')
    },
    async signTransaction() {
      throw new Error('zklogin-signer: not yet implemented')
    },
    canSign: (chain) => chain === 'sui',
  }
}

function createDappKitSigner(address: string): Signer {
  return {
    kind: 'dapp-kit',
    chain: 'sui',
    address,
    frontDoor: 'wallet',
    async signMessage() {
      throw new Error('dapp-kit-signer: not yet implemented')
    },
    async signTransaction() {
      throw new Error('dapp-kit-signer: not yet implemented')
    },
    canSign: (chain) => chain === 'sui',
  }
}

function createVaultSigner(): Signer {
  return {
    kind: 'vault',
    chain: 'sui',
    address: '',
    frontDoor: 'wallet',
    async signMessage() {
      throw new Error('vault-signer: address required')
    },
    async signTransaction() {
      throw new Error('vault-signer: address required')
    },
    canSign: (_chain) => true,
  }
}
