import type { Signer } from './types'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown }) => Promise<unknown>
    }
  }
}

export interface SnapSignerOptions {
  address: string
  snapId?: string
}

const DEFAULT_SNAP_ID = 'npm:@kunalabs-io/sui-snap'

export function createSnapSigner(opts: SnapSignerOptions): Signer {
  const { address, snapId = DEFAULT_SNAP_ID } = opts

  async function invokeSnap(method: string, params?: unknown): Promise<unknown> {
    if (!window.ethereum) throw new Error('snap-signer: MetaMask not found')
    return window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: { snapId, request: { method, params } },
    })
  }

  return {
    kind: 'metamask-snap',
    chain: 'sui',
    address,
    frontDoor: 'wallet',

    async signMessage(bytes: Uint8Array): Promise<Uint8Array> {
      const result = await invokeSnap('sui_signPersonalMessage', {
        message: Buffer.from(bytes).toString('base64'),
      })
      return Buffer.from(result as string, 'base64')
    },

    async signTransaction(tx: unknown): Promise<{ bytes: Uint8Array; signature: string }> {
      const result = (await invokeSnap('sui_signTransaction', { transaction: tx })) as {
        bytes: string
        signature: string
      }
      return {
        bytes: Buffer.from(result.bytes, 'base64'),
        signature: result.signature,
      }
    },

    canSign(chain: string): boolean {
      // Snap is Sui-only
      return chain === 'sui'
    },
  }
}
