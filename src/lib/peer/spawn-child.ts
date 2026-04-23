/**
 * spawn-child.ts — Parent agent spawns a child under its ScopedWallet cap
 *
 * No human involved. Parent derives its keypair, calls scoped_wallet::spawn_child,
 * and submits via the sponsor execute path.
 *
 * Contract: interfaces/peer/spawn-child.d.ts
 */

import { Transaction } from '@mysten/sui/transactions'
import { deriveKeypair, signAndExecute } from '@/lib/sui'
import type { SuiAddress } from '../../../interfaces/types-sui'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

function readPackageId(): string {
  const fromRuntime = typeof process !== 'undefined' && process.env?.SUI_PACKAGE_ID
  const fromBuild =
    typeof import.meta !== 'undefined' ? (import.meta as Record<string, any>).env?.SUI_PACKAGE_ID : undefined
  return (fromRuntime || fromBuild || '') as string
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SpawnChildArgs {
  /** Substrate uid of the parent agent (e.g. "marketing:creative") */
  parentUid: string
  /** Substrate uid of the child agent */
  childUid: string
  /** Sui address the child agent will act as */
  childAddress: SuiAddress
  /** Daily spending cap in MIST (1 SUI = 1e9 MIST), must be <= parent cap */
  dailyCapMist: bigint
  /** Allowed target addresses or package IDs for child spending */
  allowlist: string[]
}

export interface SpawnChildResult {
  /** Move object ID of the newly created child ScopedWallet */
  scopedWalletId: string
  /** Transaction digest */
  txDigest: string
}

// ═══════════════════════════════════════════════════════════════════════════
// SPAWN CHILD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parent agent spawns a child ScopedWallet under its own cap.
 *
 * Flow:
 *   1. Derive parent's Ed25519 keypair from platform seed + parentUid
 *   2. Resolve parent's ScopedWallet object ID from TypeDB
 *   3. Build scoped_wallet::spawn_child transaction
 *   4. Sign with parent keypair and execute
 *   5. Extract child ScopedWallet object ID from effects
 *   6. Return { scopedWalletId, txDigest }
 *
 * The child ScopedWallet is transferred to the parent wallet's object address
 * (not the parent agent address) — see scoped_wallet.move::spawn_child for
 * the ownership invariant.
 */
export async function spawnChild(args: SpawnChildArgs): Promise<SpawnChildResult> {
  const PACKAGE_ID = readPackageId()
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')

  const { parentUid, childUid, childAddress, dailyCapMist, allowlist } = args

  // Step 1: derive parent keypair
  const parentKeypair = await deriveKeypair(parentUid)
  const parentAddress = parentKeypair.getPublicKey().toSuiAddress()

  // Step 2: resolve parent's ScopedWallet object ID from TypeDB
  const parentWalletId = await resolveParentScopedWallet(parentUid, parentAddress)
  if (!parentWalletId) {
    throw new Error(
      `No ScopedWallet found for parent agent "${parentUid}" (address: ${parentAddress}). ` +
        'Parent must have a ScopedWallet before spawning children.',
    )
  }

  // Step 3: build spawn_child transaction
  // scoped_wallet::spawn_child<T>(parent: &ScopedWallet<T>, child_agent: address,
  //   child_daily_cap: u64, child_allowlist: vector<address>, ctx: &mut TxContext)
  //
  // Generic type parameter T is SUI coin type for the standard case.
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::scoped_wallet::spawn_child`,
    typeArguments: ['0x2::sui::SUI'],
    arguments: [
      tx.object(parentWalletId), // &ScopedWallet<T>
      tx.pure.address(childAddress), // child_agent: address
      tx.pure.u64(dailyCapMist), // child_daily_cap: u64
      tx.pure.vector('address', allowlist), // child_allowlist: vector<address>
    ],
  })

  // Step 4: sign with parent keypair and execute
  const result = await signAndExecute(tx, parentKeypair)

  // Step 5: extract child ScopedWallet object ID from effects
  // spawn_child transfers the child to the parent wallet's object address
  const created = (result.effects as any)?.created || []
  const childWalletObj = created.find(
    (o: any) =>
      o.owner?.AddressOwner !== undefined || // transferred object
      o.owner?.ObjectOwner !== undefined, // object-owned (parent wallet owns it)
  )
  const scopedWalletId = childWalletObj?.reference?.objectId || ''

  if (!scopedWalletId) {
    // Fallback: return digest only, caller can index via event
    console.warn(
      `[spawn-child] Could not extract child ScopedWallet ID from effects for child "${childUid}". ` +
        'Index via ChildSpawned event using txDigest.',
    )
  }

  return { scopedWalletId, txDigest: result.digest }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolve a parent agent's ScopedWallet object ID from TypeDB.
 *
 * Looks for a `scoped-wallet-id` attribute on the unit. If none recorded,
 * falls back to wallet attribute for further indexing.
 *
 * Returns null if no wallet is found.
 */
async function resolveParentScopedWallet(parentUid: string, _parentAddress: string): Promise<string | null> {
  try {
    // Dynamic import to avoid circular dependency (mirrors pattern in sui.ts::resolveUnit)
    const { readParsed } = await import('@/lib/typedb')

    // Prefer scoped-wallet-id if stored
    const rows = await readParsed(`
      match $u isa unit, has uid "${parentUid}", has scoped-wallet-id $sid;
      select $sid;
    `).catch(() => [] as Array<{ sid: unknown }>)

    if (rows.length && rows[0].sid) {
      return rows[0].sid as string
    }

    return null
  } catch {
    return null
  }
}
