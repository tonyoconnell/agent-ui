import type { Signer } from './types'

// Minimal vault session shape — only what resolveSigner needs
interface VaultSessionLike {
  masterKey: CryptoKey
}

export function resolveSigner(
  session: unknown,
  dappKit: unknown,
  vaultSession: VaultSessionLike | null,
): Signer | null {
  // vault: vault is unlocked
  if (vaultSession) {
    return createVaultSigner()
  }
  return null
}

// Placeholder creator — vault is the default signer
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
