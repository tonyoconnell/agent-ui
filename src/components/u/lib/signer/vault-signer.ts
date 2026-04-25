import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import * as Vault from '../vault/vault'
import type { Signer } from './types'

export interface VaultSignerOptions {
  address: string
  walletId: string
  chain?: Signer['chain']
}

function base64ToBytes(b64: string): Uint8Array {
  const std = b64.replace(/-/g, '+').replace(/_/g, '/')
  const padded = std + '=='.slice(0, (4 - (std.length % 4)) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function getKeypair(walletId: string): Promise<Ed25519Keypair> {
  const pk = await Vault.getPrivateKey(walletId)
  if (!pk) throw new Error(`vault-signer: no private key for wallet ${walletId}`)
  // Private key is stored as bech32 (suiprivkey1...) from Ed25519Keypair.getSecretKey()
  return Ed25519Keypair.fromSecretKey(pk)
}

export function createVaultSigner(opts: VaultSignerOptions): Signer {
  const { address, walletId, chain = 'sui' } = opts

  return {
    kind: 'vault',
    chain,
    address,
    frontDoor: 'wallet',

    async signMessage(bytes: Uint8Array): Promise<Uint8Array> {
      if (chain !== 'sui') throw new Error(`vault-signer.signMessage: chain ${chain} not yet supported`)
      const keypair = await getKeypair(walletId)
      const { signature } = await keypair.signPersonalMessage(bytes)
      return base64ToBytes(signature)
    },

    async signTransaction(tx: unknown): Promise<{ bytes: Uint8Array; signature: string }> {
      if (chain !== 'sui') throw new Error(`vault-signer.signTransaction: chain ${chain} not yet supported`)
      const keypair = await getKeypair(walletId)
      const txBytes = tx instanceof Uint8Array ? tx : typeof tx === 'string' ? base64ToBytes(tx) : null
      if (!txBytes) throw new Error('vault-signer.signTransaction: tx must be Uint8Array or base64 string')
      const { signature, bytes } = await keypair.signTransaction(txBytes)
      return { bytes, signature }
    },

    canSign(targetChain: string): boolean {
      return targetChain === 'sui'
    },
  }
}
