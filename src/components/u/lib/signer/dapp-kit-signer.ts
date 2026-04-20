import type { Signer } from './types'

export interface DappKitSignerOptions {
  address: string
  signMessage?: (args: { message: Uint8Array }) => Promise<{ signature: string }>
  signTransaction?: (args: { transaction: unknown }) => Promise<{ bytes: string; signature: string }>
}

export function createDappKitSigner(opts: DappKitSignerOptions): Signer {
  const { address, signMessage: dkSignMessage, signTransaction: dkSignTx } = opts

  return {
    kind: 'dapp-kit',
    chain: 'sui',
    address,
    frontDoor: 'wallet',

    async signMessage(bytes: Uint8Array): Promise<Uint8Array> {
      if (!dkSignMessage) throw new Error('dapp-kit-signer: signMessage hook not provided')
      const result = await dkSignMessage({ message: bytes })
      return Buffer.from(result.signature, 'base64')
    },

    async signTransaction(tx: unknown): Promise<{ bytes: Uint8Array; signature: string }> {
      if (!dkSignTx) throw new Error('dapp-kit-signer: signTransaction hook not provided')
      const result = await dkSignTx({ transaction: tx })
      return {
        bytes: Buffer.from(result.bytes, 'base64'),
        signature: result.signature,
      }
    },

    canSign(chain: string): boolean {
      // dapp-kit is Sui-only
      return chain === 'sui'
    },
  }
}
