/**
 * Sui Client — Keypair derivation, signing, object reads
 *
 * Every agent derives its own Ed25519 keypair from a platform seed + its UID.
 * The keypair IS the identity. The Sui address IS the agent.
 *
 * Flow:
 *   agent.md → parse() → deriveKeypair(uid) → sign create_unit() → on-chain
 *
 * Platform seed in env: SUI_SEED (base64, 32 bytes)
 * Package ID in env: SUI_PACKAGE_ID
 * Network in env: SUI_NETWORK (testnet | mainnet | devnet)
 */

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Transaction } from '@mysten/sui/transactions'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const NETWORK = (import.meta.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet'
const PACKAGE_ID = import.meta.env.SUI_PACKAGE_ID || ''
const PROTOCOL_ID = import.meta.env.SUI_PROTOCOL_ID || ''

// Platform seed — 32 bytes, base64-encoded. Generate once:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
const SEED_B64 = import.meta.env.SUI_SEED || ''

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════════════════

let _client: SuiClient | null = null

export function getClient(): SuiClient {
  if (!_client) _client = new SuiClient({ url: getFullnodeUrl(NETWORK) })
  return _client
}

// ════════════════════════════════════════��══════════════════════════════════
// KEYPAIR — Deterministic derivation from platform seed + agent UID
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derive a unique Ed25519 keypair for an agent from the platform seed.
 *
 * Uses HKDF-like construction: SHA-256(seed || uid) → 32-byte secret → Ed25519.
 * Same UID always produces the same address. The agent IS its keypair.
 *
 * For agents that bring their own wallet (Phase 2), skip this and use their keypair.
 */
export async function deriveKeypair(uid: string): Promise<Ed25519Keypair> {
  if (!SEED_B64)
    throw new Error(
      "SUI_SEED not configured. Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
    )

  const seed = Uint8Array.from(atob(SEED_B64), (c) => c.charCodeAt(0))
  const encoder = new TextEncoder()

  // HKDF-like: SHA-256(seed || uid) → 32 bytes → Ed25519 keypair
  const material = new Uint8Array(seed.length + uid.length)
  material.set(seed)
  material.set(encoder.encode(uid), seed.length)

  const hash = await crypto.subtle.digest('SHA-256', material)
  return Ed25519Keypair.fromSecretKey(new Uint8Array(hash))
}

/**
 * Get the Sui address for an agent UID (without needing the full keypair).
 * Useful for display / TypeDB storage.
 */
export async function addressFor(uid: string): Promise<string> {
  const kp = await deriveKeypair(uid)
  return kp.getPublicKey().toSuiAddress()
}

// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM KEYPAIR — Signs on behalf of the substrate
// ════════════════���══════════════════════════════════════════════════════════

let _platformKp: Ed25519Keypair | null = null

export async function platformKeypair(): Promise<Ed25519Keypair> {
  if (!_platformKp) _platformKp = await deriveKeypair('__platform__')
  return _platformKp
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sign and execute a transaction with an agent's derived keypair.
 */
export async function signAndExecute(
  tx: Transaction,
  keypair: Ed25519Keypair,
): Promise<{ digest: string; effects: unknown }> {
  const client = getClient()
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: { showEffects: true },
  })
  return { digest: result.digest, effects: result.effects }
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE UNIT — Agent signs its own existence into being
// ���═══════════════════════════════════════════════���══════════════════════════

/**
 * Create a Unit on-chain. The agent derives its keypair, signs the tx itself.
 * The Unit object is owned by the agent's Sui address. Self-sovereign.
 *
 * Returns: { address, objectId, digest }
 */
export async function createUnit(
  uid: string,
  name: string,
  unitType: string = 'agent',
): Promise<{ address: string; objectId: string; digest: string }> {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')

  const keypair = await deriveKeypair(uid)
  const address = keypair.getPublicKey().toSuiAddress()

  // Fund the agent if needed (testnet only)
  if (NETWORK === 'testnet') {
    await ensureFunded(address)
  }

  const tx = new Transaction()
  const unit = tx.moveCall({
    target: `${PACKAGE_ID}::substrate::create_unit`,
    arguments: [tx.pure.string(name), tx.pure.string(unitType)],
  })

  // Transfer the Unit object to the agent's own address
  tx.transferObjects([unit], address)

  const result = await signAndExecute(tx, keypair)

  // Extract the created Unit object ID from effects
  const created = (result.effects as any)?.created || []
  const unitObj = created.find((o: any) => o.owner?.AddressOwner === address)
  const objectId = unitObj?.reference?.objectId || ''

  return { address, objectId, digest: result.digest }
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER TASK — Agent declares a capability
// ═════════════════���════════════════════════════════��════════════════════════

export async function registerTask(uid: string, unitObjectId: string, taskName: string): Promise<{ digest: string }> {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')

  const keypair = await deriveKeypair(uid)
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::register_task`,
    arguments: [tx.object(unitObjectId), tx.pure.string(taskName)],
  })

  const result = await signAndExecute(tx, keypair)
  return { digest: result.digest }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUND — Testnet faucet
// ══════���════════════════════════════════════════════════════════════════════

export async function ensureFunded(address: string): Promise<void> {
  const client = getClient()
  const balance = await client.getBalance({ owner: address })
  // If less than 0.1 SUI, request from faucet
  if (BigInt(balance.totalBalance) < 100_000_000n) {
    await requestFaucet(address).catch(() => {
      // Faucet may rate-limit — not fatal
    })
  }
}

async function requestFaucet(address: string): Promise<void> {
  const faucetUrl =
    NETWORK === 'testnet' ? 'https://faucet.testnet.sui.io/v1/gas' : 'https://faucet.devnet.sui.io/v1/gas'

  await fetch(faucetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ FixedAmountRequest: { recipient: address } }),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// READ — Object queries
// ═══════════════════════════════════════════════��═══════════════════════════

export async function getObject(objectId: string) {
  const client = getClient()
  return client.getObject({
    id: objectId,
    options: { showContent: true, showOwner: true },
  })
}

export async function getOwnedUnits(address: string) {
  const client = getClient()
  return client.getOwnedObjects({
    owner: address,
    filter: { StructType: `${PACKAGE_ID}::substrate::Unit` },
    options: { showContent: true },
  })
}

// ���═══════════════════════��══════════════════════════════════════════════════
// MARK / WARN — Pheromone on-chain
// ════════════════════════════════════════���══════════════════════════════════

export async function mark(uid: string, pathObjectId: string, amount: number = 1): Promise<{ digest: string }> {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')
  const keypair = await deriveKeypair(uid)
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::mark`,
    arguments: [tx.object(pathObjectId), tx.pure.u64(amount)],
  })
  return signAndExecute(tx, keypair)
}

export async function warn(uid: string, pathObjectId: string, amount: number = 1): Promise<{ digest: string }> {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')
  const keypair = await deriveKeypair(uid)
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::warn`,
    arguments: [tx.object(pathObjectId), tx.pure.u64(amount)],
  })
  return signAndExecute(tx, keypair)
}

// ═══════════════════════════════════════════════════════════════════════════
// SEND / CONSUME — Signal flow on-chain
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send a signal on-chain. Creates an owned Signal object and transfers it
 * to the receiver's Sui address. The signal is a physical object that moves.
 *
 * Requires: sender's Unit object ID, receiver's Unit object ID + owner address.
 */
export async function send(
  senderUid: string,
  senderUnitObjectId: string,
  receiverUnitObjectId: string,
  receiverAddress: string,
  taskName: string,
  payload: Uint8Array = new Uint8Array(),
  paymentAmount: number = 0,
): Promise<{ digest: string; signalId: string }> {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')

  const keypair = await deriveKeypair(senderUid)
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::send`,
    arguments: [
      tx.object(senderUnitObjectId),
      tx.pure.id(receiverUnitObjectId),
      tx.pure.string(taskName),
      tx.pure.vector('u8', Array.from(payload)),
      tx.pure.u64(paymentAmount),
      tx.pure.address(receiverAddress),
      tx.object('0x6'), // Clock shared object
    ],
  })

  const result = await signAndExecute(tx, keypair)

  // Extract Signal object ID from created objects
  const created = (result.effects as any)?.created || []
  const signalObj = created.find((o: any) => o.owner?.AddressOwner === receiverAddress)
  const signalId = signalObj?.reference?.objectId || ''

  return { digest: result.digest, signalId }
}

/**
 * Consume a signal. Collect payment. Destroy the object. Mark the path.
 * The signal is gone from the universe after this. Linear types = no replay.
 */
export async function consume(
  receiverUid: string,
  signalObjectId: string,
  unitObjectId: string,
  pathObjectId: string,
): Promise<{ digest: string }> {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')
  if (!PROTOCOL_ID) throw new Error('SUI_PROTOCOL_ID not configured')

  const keypair = await deriveKeypair(receiverUid)
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::consume`,
    arguments: [tx.object(signalObjectId), tx.object(unitObjectId), tx.object(pathObjectId), tx.object(PROTOCOL_ID)],
  })

  return signAndExecute(tx, keypair)
}

// ═══════════════════════════════════════════════════════════════════════════
// PAY — Agent pays agent. Revenue = weight.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Direct payment between units. Marks the path. Collects protocol fee.
 * Revenue IS weight — same atomic transaction.
 */
export async function pay(
  fromUid: string,
  fromUnitObjectId: string,
  toUnitObjectId: string,
  pathObjectId: string,
  amount: number,
): Promise<{ digest: string }> {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')
  if (!PROTOCOL_ID) throw new Error('SUI_PROTOCOL_ID not configured')

  const keypair = await deriveKeypair(fromUid)
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::pay`,
    arguments: [
      tx.object(fromUnitObjectId),
      tx.object(toUnitObjectId),
      tx.pure.u64(amount),
      tx.object(pathObjectId),
      tx.object(PROTOCOL_ID),
    ],
  })

  return signAndExecute(tx, keypair)
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE PATH — Shared object between two units
// ═══════════════════════════════════════════════════════════════════════════

export async function createPath(
  uid: string,
  sourceUnitId: string,
  targetUnitId: string,
  pathType: string = 'interaction',
): Promise<{ digest: string; pathId: string }> {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')

  const keypair = await deriveKeypair(uid)
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::create_path`,
    arguments: [tx.pure.id(sourceUnitId), tx.pure.id(targetUnitId), tx.pure.string(pathType)],
  })

  const result = await signAndExecute(tx, keypair)

  // Path is a shared object — find it in created
  const created = (result.effects as any)?.created || []
  const pathObj = created.find((o: any) => o.owner === 'Shared' || o.owner?.Shared)
  const pathId = pathObj?.reference?.objectId || ''

  return { digest: result.digest, pathId }
}

// ═══════════════════════════════════════════════════════════════════════════
// HARDEN — Freeze highway permanently
// ═══════════════════════════════════════════════════════════════════════════

export async function harden(uid: string, pathObjectId: string): Promise<{ digest: string; highwayId: string }> {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')

  const keypair = await deriveKeypair(uid)
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::harden`,
    arguments: [
      tx.object(pathObjectId),
      tx.object('0x6'), // Clock
    ],
  })

  const result = await signAndExecute(tx, keypair)

  // Highway is a frozen object
  const created = (result.effects as any)?.created || []
  const highwayObj = created.find((o: any) => o.owner === 'Immutable')
  const highwayId = highwayObj?.reference?.objectId || ''

  return { digest: result.digest, highwayId }
}

// ═══════════════════════════════════════════════════════════════════════════
// ESCROW TX BUILDERS — Unsigned transaction factories
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Build TX to create an escrow on Sui.
 * Poster locks amount, worker claims on completion before deadline.
 *
 * Args:
 *   posterUnitId    — Sui object ID of poster's Unit
 *   workerId        — Sui ID of worker (dest unit)
 *   taskName        — human task name (e.g., "research")
 *   amountMist      — amount in MIST (1 SUI = 1e9 MIST)
 *   deadlineMs      — absolute deadline in milliseconds
 *   pathId          — Sui ID of the path to mark/warn on settle
 *
 * Returns: Transaction object, unsigned.
 * Caller invokes signAndExecute(tx, keypair) after obtaining keypair.
 */
export function createEscrowTx(
  posterUnitId: string,
  workerId: string,
  taskName: string,
  amountMist: number,
  deadlineMs: number,
  pathId: string,
): Transaction {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')
  if (amountMist <= 0) throw new Error('amount must be positive')
  if (deadlineMs <= Date.now()) throw new Error('deadline must be in future')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::create_escrow`,
    arguments: [
      tx.object(posterUnitId), // &mut Unit poster
      tx.pure.id(workerId), // worker_id: ID
      tx.pure.string(taskName), // task_name: String
      tx.pure.u64(amountMist), // amount: u64
      tx.pure.u64(deadlineMs), // deadline: u64 (ms timestamp)
      tx.pure.id(pathId), // path_id: ID
    ],
  })

  return tx
}

/**
 * Build TX to release escrow to worker. Task completed successfully.
 * Atomic: worker receives payment, path marked (strength+1, hits+1),
 * protocol fee (50 bps) collected.
 *
 * Preconditions (enforced on-chain):
 *   - clock::timestamp_ms(clock) <= escrow.deadline (not expired)
 *   - signer must be the worker (object::id(worker) == escrow.worker)
 *
 * Args:
 *   escrowId      — Sui object ID of Escrow shared object
 *   workerUnitId  — Sui object ID of worker's Unit
 *   pathId        — Sui object ID of the path to mark
 *
 * Returns: Transaction object, unsigned.
 */
export function releaseEscrowTx(escrowId: string, workerUnitId: string, pathId: string): Transaction {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')
  if (!PROTOCOL_ID) throw new Error('SUI_PROTOCOL_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::release_escrow`,
    arguments: [
      tx.object(escrowId), // escrow: Escrow (mutable shared object)
      tx.object(workerUnitId), // &mut Unit worker
      tx.object(pathId), // &mut Path path
      tx.object(PROTOCOL_ID), // &mut Protocol protocol
      tx.object('0x6'), // &Clock (shared object)
    ],
  })

  return tx
}

/**
 * Build TX to cancel escrow. Deadline has passed. Bounty returns to poster.
 * Path is warned (resistance+1, misses+1).
 *
 * Preconditions (enforced on-chain):
 *   - clock::timestamp_ms(clock) > escrow.deadline (expired)
 *   - signer must be the poster (object::id(poster) == escrow.poster)
 *
 * Args:
 *   escrowId      — Sui object ID of Escrow shared object
 *   posterUnitId  — Sui object ID of poster's Unit
 *   pathId        — Sui object ID of the path to warn
 *
 * Returns: Transaction object, unsigned.
 */
export function cancelEscrowTx(escrowId: string, posterUnitId: string, pathId: string): Transaction {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::cancel_escrow`,
    arguments: [
      tx.object(escrowId), // escrow: Escrow (mutable shared object)
      tx.object(posterUnitId), // &mut Unit poster
      tx.object(pathId), // &mut Path path
      tx.object('0x6'), // &Clock (shared object)
    ],
  })

  return tx
}

// ═══════════════════════════════════════════════════════════════════════════
// ESCROW — Sign + execute convenience wrappers
// ═══════════════════════════════════════════════════════════════════════════

export async function createEscrow(
  posterUid: string,
  posterUnitObjectId: string,
  workerUnitObjectId: string,
  taskName: string,
  amount: number,
  deadlineMs: number,
  pathObjectId: string,
): Promise<{ digest: string; escrowId: string }> {
  const keypair = await deriveKeypair(posterUid)
  const tx = createEscrowTx(posterUnitObjectId, workerUnitObjectId, taskName, amount, deadlineMs, pathObjectId)

  const result = await signAndExecute(tx, keypair)
  const created = (result.effects as any)?.created || []
  const escrowObj = created.find((o: any) => o.owner === 'Shared' || o.owner?.Shared)
  const escrowId = escrowObj?.reference?.objectId || ''

  return { digest: result.digest, escrowId }
}

export async function releaseEscrow(
  workerUid: string,
  escrowObjectId: string,
  workerUnitObjectId: string,
  pathObjectId: string,
): Promise<{ digest: string }> {
  const keypair = await deriveKeypair(workerUid)
  const tx = releaseEscrowTx(escrowObjectId, workerUnitObjectId, pathObjectId)
  return signAndExecute(tx, keypair)
}

export async function cancelEscrow(
  posterUid: string,
  escrowObjectId: string,
  posterUnitObjectId: string,
  pathObjectId: string,
): Promise<{ digest: string }> {
  const keypair = await deriveKeypair(posterUid)
  const tx = cancelEscrowTx(escrowObjectId, posterUnitObjectId, pathObjectId)
  return signAndExecute(tx, keypair)
}

// ─── Read-only escrow view (no signing) ────────────────────────────────────

export interface EscrowView {
  locked: boolean
  amount: number
  claimant: string | null
  deadline: number
}

/**
 * Read an Escrow Move object by id. Does not sign — works without SUI_SEED.
 * Returns null if the object is missing, malformed, or not an Escrow.
 */
export async function viewEscrow(escrowObjectId: string): Promise<EscrowView | null> {
  try {
    const res = await getClient().getObject({ id: escrowObjectId, options: { showContent: true } })
    const content = res?.data?.content
    if (!content || content.dataType !== 'moveObject') return null
    const fields = (content as { fields?: Record<string, unknown> }).fields
    if (!fields) return null
    return {
      locked: Boolean(fields.locked ?? true),
      amount: Number(fields.amount ?? 0),
      claimant: typeof fields.claimant === 'string' ? fields.claimant : null,
      deadline: Number(fields.deadline ?? 0),
    }
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOOKUP — Resolve UIDs to Sui object IDs via TypeDB
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Look up a unit's Sui wallet and object ID from TypeDB.
 * Returns null if unit doesn't exist or has no wallet.
 */
export async function resolveUnit(uid: string): Promise<{ wallet: string; objectId: string } | null> {
  // Import dynamically to avoid circular dependency
  const { readParsed } = await import('@/lib/typedb')
  const rows = await readParsed(`
    match $u isa unit, has uid "${uid}", has wallet $w;
    select $w;
  `).catch(() => [])

  if (!rows.length || !rows[0].w) return null
  return { wallet: rows[0].w as string, objectId: '' } // objectId stored separately when we have it
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  getClient,
  deriveKeypair,
  addressFor,
  platformKeypair,
  signAndExecute,
  createUnit,
  registerTask,
  send,
  consume,
  pay,
  createPath,
  harden,
  createEscrowTx,
  releaseEscrowTx,
  cancelEscrowTx,
  createEscrow,
  releaseEscrow,
  cancelEscrow,
  viewEscrow,
  getObject,
  getOwnedUnits,
  resolveUnit,
  mark,
  warn,
}
