/**
 * scoped-wallet.ts — TypeScript wrapper for one::scoped_wallet Move module
 *
 * Builds unsigned PTBs for every entry function in scoped_wallet.move.
 * Callers obtain the Transaction bytes and either:
 *   (a) sign + execute server-side via signAndExecute(), or
 *   (b) pass the bytes to a browser wallet (dApp Kit) for user signing.
 *
 * All build* functions return Uint8Array (serialised transaction bytes).
 * getScopedWallet() reads the object from chain without signing.
 *
 * Move module:  one::scoped_wallet
 * Source:       src/move/one/sources/scoped_wallet.move
 * Interfaces:   interfaces/move/scoped-wallet/struct.move.d.ts
 */

import { Transaction } from '@mysten/sui/transactions'
import { getClient } from '@/lib/sui'
import type { ScopedWalletStruct } from '../../../../interfaces/move/scoped-wallet/struct.move'
import type { SuiAddress } from '../../../../interfaces/types-sui'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

/** Read SUI_PACKAGE_ID at call time — supports both Vite build-time and CF runtime. */
function readPackageId(): string {
  const fromRuntime = typeof process !== 'undefined' && process.env && process.env.SUI_PACKAGE_ID
  const fromBuild =
    typeof import.meta !== 'undefined' ? (import.meta as Record<string, any>).env?.SUI_PACKAGE_ID : undefined
  return (fromRuntime || fromBuild || '') as string
}

/** Canonical coin type for SUI. */
const SUI_COIN_TYPE = '0x2::sui::SUI'

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateScopedWalletArgs {
  /** The Sui address authorised to call spend() */
  agent: SuiAddress
  /** Maximum spend per epoch in MIST (1 SUI = 1e9 MIST). Must be > 0. */
  dailyCapMist: bigint
  /** Permitted recipient addresses. Empty = any recipient allowed. */
  allowlist: SuiAddress[]
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a Transaction and return its serialised bytes.
 * The caller decides who signs it (agent keypair or dApp Kit wallet).
 */
async function buildTx(tx: Transaction): Promise<Uint8Array> {
  const client = getClient()
  return tx.build({ client })
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE — one::scoped_wallet::create<SUI>
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a PTB to create a new ScopedWallet<SUI>.
 *
 * Move entry:
 *   public entry fun create<T>(
 *     agent: address,
 *     daily_cap: u64,
 *     allowlist: vector<address>,
 *     ctx: &mut TxContext
 *   )
 *
 * The wallet is transferred to the transaction sender (owner) on-chain.
 */
export async function buildCreateScopedWallet(args: CreateScopedWalletArgs): Promise<Uint8Array> {
  const packageId = readPackageId()
  if (!packageId) throw new Error('SUI_PACKAGE_ID not configured')

  const { agent, dailyCapMist, allowlist } = args

  const tx = new Transaction()
  tx.moveCall({
    target: `${packageId}::scoped_wallet::create`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [
      tx.pure.address(agent), // agent: address
      tx.pure.u64(dailyCapMist), // daily_cap: u64
      tx.pure.vector('address', allowlist), // allowlist: vector<address>
    ],
  })

  return buildTx(tx)
}

// ═══════════════════════════════════════════════════════════════════════════
// SPEND — one::scoped_wallet::spend<SUI>
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a PTB for the agent to spend from a ScopedWallet.
 *
 * Move entry:
 *   public entry fun spend<T>(
 *     wallet: &mut ScopedWallet<T>,
 *     coin: &mut Coin<T>,
 *     to: address,
 *     amount: u64,
 *     ctx: &mut TxContext
 *   )
 *
 * The caller must hold a Coin<SUI> object. The transaction sender must be
 * wallet.agent — enforced on-chain (E_NOT_AGENT = 1).
 *
 * @param walletId  - Object ID of the ScopedWallet<SUI>
 * @param coinId    - Object ID of a Coin<SUI> held by the agent
 * @param to        - Recipient Sui address
 * @param amountMist - Amount in MIST to transfer
 */
export async function buildSpend(
  walletId: string,
  coinId: string,
  to: SuiAddress,
  amountMist: bigint,
): Promise<Uint8Array> {
  const packageId = readPackageId()
  if (!packageId) throw new Error('SUI_PACKAGE_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${packageId}::scoped_wallet::spend`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [
      tx.object(walletId), // wallet: &mut ScopedWallet<T>
      tx.object(coinId), // coin: &mut Coin<T>
      tx.pure.address(to), // to: address
      tx.pure.u64(amountMist), // amount: u64
    ],
  })

  return buildTx(tx)
}

// ═══════════════════════════════════════════════════════════════════════════
// PAUSE — one::scoped_wallet::pause<SUI>
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a PTB for the owner to pause a ScopedWallet.
 *
 * Move entry:
 *   public entry fun pause<T>(wallet: &mut ScopedWallet<T>, ctx: &mut TxContext)
 *
 * Only wallet.owner may call this (E_NOT_OWNER = 5).
 */
export async function buildPause(walletId: string): Promise<Uint8Array> {
  const packageId = readPackageId()
  if (!packageId) throw new Error('SUI_PACKAGE_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${packageId}::scoped_wallet::pause`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [tx.object(walletId)],
  })

  return buildTx(tx)
}

// ═══════════════════════════════════════════════════════════════════════════
// UNPAUSE — one::scoped_wallet::unpause<SUI>
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a PTB for the owner to unpause a ScopedWallet.
 *
 * Move entry:
 *   public entry fun unpause<T>(wallet: &mut ScopedWallet<T>, ctx: &mut TxContext)
 *
 * Only wallet.owner may call this (E_NOT_OWNER = 5).
 */
export async function buildUnpause(walletId: string): Promise<Uint8Array> {
  const packageId = readPackageId()
  if (!packageId) throw new Error('SUI_PACKAGE_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${packageId}::scoped_wallet::unpause`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [tx.object(walletId)],
  })

  return buildTx(tx)
}

// ═══════════════════════════════════════════════════════════════════════════
// REVOKE — one::scoped_wallet::revoke<SUI>
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a PTB for the owner to revoke (destroy) a ScopedWallet.
 *
 * Move entry:
 *   public entry fun revoke<T>(wallet: ScopedWallet<T>, ctx: &mut TxContext)
 *
 * The wallet object is consumed (not &mut) — it is destroyed permanently.
 * Coin<SUI> objects held at the wallet's address remain and must be
 * separately reclaimed. Only wallet.owner may call this (E_NOT_OWNER = 5).
 */
export async function buildRevoke(walletId: string): Promise<Uint8Array> {
  const packageId = readPackageId()
  if (!packageId) throw new Error('SUI_PACKAGE_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${packageId}::scoped_wallet::revoke`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [tx.object(walletId)],
  })

  return buildTx(tx)
}

// ═══════════════════════════════════════════════════════════════════════════
// FUND — one::scoped_wallet::fund<SUI>
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a PTB to top up a ScopedWallet with a Coin<SUI>.
 *
 * Move entry:
 *   public entry fun fund<T>(
 *     wallet: &mut ScopedWallet<T>,
 *     coin: Coin<T>,
 *     ctx: &mut TxContext
 *   )
 *
 * Anyone may fund a ScopedWallet. The coin is transferred to the wallet
 * object's own address. Emits WalletFunded event.
 *
 * @param walletId  - Object ID of the ScopedWallet<SUI>
 * @param coinId    - Object ID of the Coin<SUI> to deposit
 * @param amountMist - Amount in MIST to split and deposit (uses tx.splitCoins if > 0, else full coin)
 */
export async function buildFund(walletId: string, coinId: string, amountMist: bigint): Promise<Uint8Array> {
  const packageId = readPackageId()
  if (!packageId) throw new Error('SUI_PACKAGE_ID not configured')

  const tx = new Transaction()

  // Split the exact amount from the source coin before depositing
  const [depositCoin] = tx.splitCoins(tx.object(coinId), [tx.pure.u64(amountMist)])

  tx.moveCall({
    target: `${packageId}::scoped_wallet::fund`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [
      tx.object(walletId), // wallet: &mut ScopedWallet<T>
      depositCoin, // coin: Coin<T>
    ],
  })

  return buildTx(tx)
}

// ═══════════════════════════════════════════════════════════════════════════
// ROTATE OWNER — one::scoped_wallet::rotate_owner<SUI>
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a PTB to transfer ownership of a ScopedWallet to a new owner.
 *
 * Move entry:
 *   public entry fun rotate_owner<T>(
 *     wallet: &mut ScopedWallet<T>,
 *     new_owner: address,
 *     ctx: &mut TxContext
 *   )
 *
 * Funds remain in the wallet; only the owner field changes. The new owner
 * immediately gains pause/revoke/rotate authority. Emits OwnerRotated.
 * Only current wallet.owner may call this (E_NOT_OWNER = 5).
 */
export async function buildRotateOwner(walletId: string, newOwner: SuiAddress): Promise<Uint8Array> {
  const packageId = readPackageId()
  if (!packageId) throw new Error('SUI_PACKAGE_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${packageId}::scoped_wallet::rotate_owner`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [
      tx.object(walletId), // wallet: &mut ScopedWallet<T>
      tx.pure.address(newOwner), // new_owner: address
    ],
  })

  return buildTx(tx)
}

// ═══════════════════════════════════════════════════════════════════════════
// READ — getScopedWallet
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Read a ScopedWallet<SUI> object from chain.
 *
 * Does not sign — works without SUI_SEED. Returns null if the object is
 * missing, has been revoked, or is not a ScopedWallet.
 *
 * Field mapping (Move snake_case → TS camelCase):
 *   daily_cap           → dailyCap
 *   spent_today         → spentToday
 *   epoch_of_last_reset → createdAt  (epoch number, not wall-clock time)
 *   allowlist           → allowlist
 */
export async function getScopedWallet(walletId: string): Promise<ScopedWalletStruct | null> {
  try {
    const client = getClient()
    const res = await client.getObject({
      id: walletId,
      options: { showContent: true, showOwner: true },
    })

    const content = res?.data?.content
    if (!content || content.dataType !== 'moveObject') return null

    const fields = (content as { fields?: Record<string, unknown> }).fields
    if (!fields) return null

    return {
      id: walletId as import('../../../../interfaces/types-sui').ObjectId,
      owner: fields.owner as string as SuiAddress,
      agent: fields.agent as string as SuiAddress,
      dailyCap: BigInt(String(fields.daily_cap ?? 0)),
      spentToday: BigInt(String(fields.spent_today ?? 0)),
      paused: Boolean(fields.paused ?? false),
      allowlist: Array.isArray(fields.allowlist) ? (fields.allowlist as string[]) : [],
      createdAt: Number(fields.epoch_of_last_reset ?? 0),
    }
  } catch {
    return null
  }
}
