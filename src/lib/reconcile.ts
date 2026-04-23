/**
 * Reconciliation: compare on-chain Sui balance vs TypeDB signal history.
 *
 * Runs on a 60s schedule (wired into workers/sync/index.ts as Job 5).
 * Mismatch → auto-pause wallet + alert ops via hypothesis emission.
 *
 * Rule 1 — Closed Loop: mismatch emits agent:paused signal; error returns
 *   status:"error" so the caller can warn() the reconcile path.
 * Rule 3 — Deterministic Results: every call returns a typed ReconcileResult
 *   with concrete numbers (onChainMist, expectedMist, delta).
 *
 * MIST dust threshold (1 000 MIST) absorbs harmless rounding from gas
 * price fluctuations and prevents alert storms on sub-cent deltas.
 */

import { readParsed, writeSilent } from '@/lib/typedb'
import { getClient } from '@/lib/sui'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ReconcileResult {
  uid: string
  address: string
  onChainMist: bigint
  expectedMist: bigint
  delta: bigint
  status: 'ok' | 'mismatch' | 'error'
  errorMessage?: string
}

/** Anything at or below this absolute delta is treated as dust (gas variance). */
export const MIST_DUST_THRESHOLD = 1_000n

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE-WALLET RECONCILE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reconcile one wallet:
 *   1. Query Sui RPC for current SUI balance (in MIST).
 *   2. Query TypeDB signal log: sum of all "fund" and "spend" signals for
 *      this unit (the ledger of what should have happened).
 *   3. Compare: if |onChain − expected| > MIST_DUST_THRESHOLD → mismatch.
 *   4. On mismatch: emit `agent:paused` signal + write security hypothesis.
 */
export async function reconcileWallet(uid: string, address: string): Promise<ReconcileResult> {
  const base: Omit<ReconcileResult, 'status' | 'onChainMist' | 'expectedMist' | 'delta'> = { uid, address }

  // ── Step 1: on-chain balance ─────────────────────────────────────────────
  let onChainMist: bigint
  try {
    const client = getClient()
    const balanceData = await client.getBalance({ owner: address })
    onChainMist = BigInt(balanceData.totalBalance)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { ...base, onChainMist: 0n, expectedMist: 0n, delta: 0n, status: 'error', errorMessage }
  }

  // ── Step 2: TypeDB ledger ────────────────────────────────────────────────
  // Signals tagged "fund" are credit (+); signals tagged "spend" are debit (-).
  // The TypeDB signal stores a `weight` attribute that carries the MIST amount.
  // We sum fund weights, subtract spend weights, to get the expected balance.
  let expectedMist: bigint
  try {
    const escapedUid = uid.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

    // Fund signals: sum of weights for this unit
    const fundRows = await readParsed(`
      match
        $s isa signal, has receiver "${escapedUid}", has tag "fund";
        $s has weight $w;
      select $w;
    `).catch(() => [] as Record<string, unknown>[])

    const spendRows = await readParsed(`
      match
        $s isa signal, has receiver "${escapedUid}", has tag "spend";
        $s has weight $w;
      select $w;
    `).catch(() => [] as Record<string, unknown>[])

    const sumFund = fundRows.reduce((acc, r) => acc + BigInt(Math.round(Number(r.w ?? 0))), 0n)
    const sumSpend = spendRows.reduce((acc, r) => acc + BigInt(Math.round(Number(r.w ?? 0))), 0n)
    expectedMist = sumFund - sumSpend
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { ...base, onChainMist, expectedMist: 0n, delta: 0n, status: 'error', errorMessage }
  }

  // ── Step 3: compare ──────────────────────────────────────────────────────
  const delta = onChainMist - expectedMist
  const absDelta = delta < 0n ? -delta : delta

  if (absDelta <= MIST_DUST_THRESHOLD) {
    return { ...base, onChainMist, expectedMist, delta, status: 'ok' }
  }

  // ── Step 4: mismatch → pause + alert ────────────────────────────────────
  await emitPauseSignal(uid, address, onChainMist, expectedMist, delta)

  return { ...base, onChainMist, expectedMist, delta, status: 'mismatch' }
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK RECONCILE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reconcile all active wallets.
 * Queries TypeDB for all units that have a `wallet` attribute, then runs
 * reconcileWallet() for each in parallel (capped to avoid RPC flooding).
 */
export async function reconcileAll(): Promise<ReconcileResult[]> {
  let wallets: Array<{ uid: string; wallet: string }> = []

  try {
    const rows = await readParsed(`
      match $u isa unit, has uid $uid, has wallet $w;
      select $uid, $w;
    `)
    wallets = rows
      .filter((r) => r.uid && r.w)
      .map((r) => ({ uid: String(r.uid), wallet: String(r.w) }))
  } catch {
    // TypeDB unavailable — return empty so the scheduler doesn't crash
    return []
  }

  if (wallets.length === 0) return []

  // Cap concurrency: 5 at a time to avoid Sui RPC rate limits
  const results: ReconcileResult[] = []
  const BATCH = 5
  for (let i = 0; i < wallets.length; i += BATCH) {
    const slice = wallets.slice(i, i + BATCH)
    const batch = await Promise.allSettled(slice.map(({ uid, wallet }) => reconcileWallet(uid, wallet)))
    for (const r of batch) {
      if (r.status === 'fulfilled') results.push(r.value)
      // Rejected means an unhandled JS error — reconcileWallet() itself guards
      // against that, so a rejection here would be truly unexpected. Log it.
      else console.error('[reconcile] unexpected rejection:', r.reason)
    }
  }

  return results
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Emit agent:paused signal + write a security hypothesis to TypeDB.
 * Fire-and-forget: never throws so the reconcile path stays deterministic.
 */
async function emitPauseSignal(
  uid: string,
  address: string,
  onChainMist: bigint,
  expectedMist: bigint,
  delta: bigint,
): Promise<void> {
  const ts = new Date().toISOString().replace('Z', '')
  const hid = `reconcile-mismatch-${uid}-${Date.now()}`
  const escapedUid = uid.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const escapedAddr = address.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const reason = 'scope-violation'

  const statement = JSON.stringify({
    kind: 'reconcile-mismatch',
    uid,
    address,
    onChainMist: onChainMist.toString(),
    expectedMist: expectedMist.toString(),
    delta: delta.toString(),
    reason,
  })
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .slice(0, 500)

  // Write paused status + security hypothesis in TypeDB (both fire-and-forget)
  void writeSilent(`
    match $u isa unit, has uid "${escapedUid}";
    insert (member: $u) isa membership,
      has role "paused",
      has created-at ${ts};
  `)

  void writeSilent(`
    insert $h isa hypothesis,
      has hid "${hid.replace(/"/g, '\\"')}",
      has statement "${statement}",
      has hypothesis-status "pending",
      has observations-count 1,
      has p-value 0.0,
      has source "observed",
      has observed-at ${ts},
      has valid-from ${ts};
  `)

  // Emit agent:paused signal — pheromone warn on the wallet path
  void writeSilent(`
    insert $s isa signal,
      has receiver "agent:paused",
      has sender "${escapedUid}",
      has tag "reconcile",
      has tag "scope-violation",
      has weight ${Number(delta < 0n ? -delta : delta)},
      has content "${escapedAddr}",
      has created-at ${ts};
  `)
}
