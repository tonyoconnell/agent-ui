import type { Signer } from './types'

export interface VaultSignerOptions {
  address: string
  chain?: Signer['chain']
  getPrivateKey: () => Promise<Uint8Array>
}

export function createVaultSigner(opts: VaultSignerOptions): Signer {
  const { address, chain = 'sui', getPrivateKey } = opts

  return {
    kind: 'vault',
    chain,
    address,
    frontDoor: 'wallet',

    async signMessage(bytes: Uint8Array): Promise<Uint8Array> {
      // Vault signer: use the private key to sign raw bytes
      // Real implementation will use chain-specific signing lib
      // For now: structural stub that proves the interface works
      const _key = await getPrivateKey()
      // TODO(C4): wire to Ed25519 signing for Sui, secp256k1 for ETH/BTC
      throw new Error(`vault-signer.signMessage: chain ${chain} signing not yet wired`)
    },

    async signTransaction(tx: unknown): Promise<{ bytes: Uint8Array; signature: string }> {
      const _key = await getPrivateKey()
      // TODO(C4): wire to @mysten/sui Transaction for Sui, ethers for ETH, etc.
      throw new Error(`vault-signer.signTransaction: chain ${chain} not yet wired`)
    },

    canSign(_chain: string): boolean {
      // Vault is the only multi-chain signer — supports all 6 chains
      return true
    },
  }
}
