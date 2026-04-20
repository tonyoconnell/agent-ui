export interface Signer {
  readonly kind: 'vault' | 'zklogin' | 'dapp-kit' | 'metamask-snap'
  readonly chain: 'sui' | 'eth' | 'btc' | 'sol' | 'usdc' | 'one'
  readonly address: string
  readonly frontDoor: 'wallet' | 'zklogin'
  signMessage(bytes: Uint8Array): Promise<Uint8Array>
  signTransaction(tx: unknown): Promise<{ bytes: Uint8Array; signature: string }>
  canSign(chain: string): boolean
}

export type SignerKind = Signer['kind']
export type SignerChain = Signer['chain']
