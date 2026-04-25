import * as Vault from '../vault/vault'
import type { Signer } from './types'
import { createVaultSigner } from './vault-signer'

/**
 * Resolve the active signer from the current vault state.
 * Returns null if the vault is locked or no wallets exist.
 * Async because it needs to query vault for wallets + status.
 */
export async function resolveSigner(chain: string = 'sui'): Promise<Signer | null> {
  try {
    const status = await Vault.getStatus()
    if (!status.hasVault || status.isLocked) return null

    const wallets = await Vault.listWallets()
    const wallet = wallets.find((w) => w.chain === chain) ?? wallets[0]
    if (!wallet) return null

    return createVaultSigner({ address: wallet.address, walletId: wallet.id, chain: wallet.chain as Signer['chain'] })
  } catch {
    return null
  }
}
