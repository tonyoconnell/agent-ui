import type { Signer } from './types'

export interface ZkLoginSignerOptions {
  address: string
  // Proof is ephemeral — caller provides it per session
  getSignature?: (bytes: Uint8Array) => Promise<Uint8Array>
}

export function createZkLoginSigner(opts: ZkLoginSignerOptions): Signer {
  const { address, getSignature } = opts

  return {
    kind: 'zklogin',
    chain: 'sui',
    address,
    frontDoor: 'zklogin',

    async signMessage(bytes: Uint8Array): Promise<Uint8Array> {
      if (!getSignature) throw new Error('zklogin-signer: getSignature not provided')
      return getSignature(bytes)
    },

    async signTransaction(_tx: unknown): Promise<{ bytes: Uint8Array; signature: string }> {
      if (!getSignature) throw new Error('zklogin-signer: getSignature not provided')
      // TODO(C4): wire getZkLoginSignature() from @mysten/sui/zklogin
      throw new Error('zklogin-signer.signTransaction: not yet wired')
    },

    canSign(chain: string): boolean {
      // zkLogin is Sui-only today
      return chain === 'sui'
    },
  }
}
