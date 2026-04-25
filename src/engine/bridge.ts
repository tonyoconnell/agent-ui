/**
 * Bridge — Three systems, one truth
 *
 * TypeDB reasons. Sui enforces. The bridge keeps them in sync.
 *
 * Two directions:
 *   mirror()  Runtime → Sui     (actions become on-chain facts)
 *   absorb()  Sui → TypeDB      (on-chain facts become knowledge)
 *
 * One cache:
 *   KV stores object IDs so every system can find the others.
 *
 * ┌──────────┐    mirror()    ┌──────────┐    absorb()    ┌──────────┐
 * │ Runtime  │───────────────►│   Sui    │───────────────►│  TypeDB  │
 * │ mark()   │                │ Marked   │                │ strength │
 * │ warn()   │                │ Warned   │                │ resist.  │
 * │ signal() │                │ Signal   │                │ signal   │
 * │ actor()  │                │ Unit     │                │ unit     │
 * └────┬─────┘                └──────────┘                └────┬─────┘
 *      │                                                       │
 *      └────────────── load() ◄────────────────────────────────┘
 *
 * The bridge is 3 functions. Everything else is plumbing.
 */

import type { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { readParsed, writeSilent } from '@/lib/typedb'

// Lazy-load @/lib/sui — the Sui SDK is SSR-externalized and unavailable
// on Cloudflare Pages Workers at import time. Dynamic import keeps the
// module graph intact for routes that never touch Sui (e.g. /api/chat).
let _sui: typeof import('@/lib/sui') | null = null
async function sui() {
  if (!_sui) _sui = await import('@/lib/sui')
  return _sui
}

// ═══════════════════════════════════════════════════════════════════════════
// ADL: perm-network gate — cache + helper
// ═══════════════════════════════════════════════════════════════════════════

import { audit, BRIDGE_CACHE_TTL, BRIDGE_PERM_CACHE, enforcementMode } from './adl-cache'

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
function hostsAllow(sender: string, allowedHosts: string[]): boolean {
  if (allowedHosts.length === 0) return true
  if (allowedHosts.includes('*')) return true
  return allowedHosts.includes(sender)
}

/**
 * Cycle 1.5: bridge fails CLOSED on TypeDB errors (real-money asymmetry).
 * `ADL_ENFORCEMENT_MODE=audit` logs denials but lets the call through.
 */
async function canCallSui(sender: string, receiver: string): Promise<boolean> {
  const key = `${receiver}:network`
  const cached = BRIDGE_PERM_CACHE.get(key)
  if (cached && cached.expires > Date.now()) {
    const allowed = hostsAllow(sender, cached.allowedHosts)
    if (!allowed) {
      const mode = enforcementMode()
      audit({
        sender,
        receiver,
        gate: 'bridge-network',
        decision: mode === 'audit' ? 'allow-audit' : 'deny',
        mode,
        reason: `sender not in allowedHosts=${JSON.stringify(cached.allowedHosts)}`,
      })
      if (mode === 'audit') return true
    }
    return allowed
  }
  let readFailed = false
  const rows = await readParsed(
    `match $u isa unit, has uid "${esc(receiver)}", has perm-network $pn; select $pn;`,
  ).catch(() => {
    readFailed = true
    return []
  })
  if (readFailed) {
    const mode = enforcementMode()
    audit({
      sender,
      receiver,
      gate: 'bridge-error',
      decision: mode === 'audit' ? 'allow-audit' : 'fail-closed',
      mode,
      reason: 'typedb read failed — fail-closed (Sui asymmetry)',
    })
    // Real-money path: on TypeDB read error, deny (unless audit mode).
    return mode === 'audit'
  }
  const allowedHosts: string[] = []
  if (rows.length > 0) {
    try {
      const perms = JSON.parse(rows[0].pn as string) as Record<string, unknown>
      const raw = perms.allowed_hosts ?? perms.allowedHosts
      if (Array.isArray(raw)) allowedHosts.push(...(raw as string[]))
    } catch {
      allowedHosts.length = 0 // malformed perms — fail closed on real-money path
    }
  }
  BRIDGE_PERM_CACHE.set(key, { allowedHosts, expires: Date.now() + BRIDGE_CACHE_TTL })
  const allowed = hostsAllow(sender, allowedHosts)
  if (!allowed) {
    const mode = enforcementMode()
    audit({
      sender,
      receiver,
      gate: 'bridge-network',
      decision: mode === 'audit' ? 'allow-audit' : 'deny',
      mode,
      reason: `sender not in allowedHosts=${JSON.stringify(allowedHosts)}`,
    })
    if (mode === 'audit') return true
  }

  // Scope gate: Sui bridge is for public paths only.
  // In audit mode, non-public paths are logged but allowed through.
  // When harden() is implemented, enforce mode will block non-public.
  try {
    const scopeRows = await readParsed(
      `match (source: $from, target: $to) isa path, has scope $sc;
       $from has uid "${sender.replace(/[^a-zA-Z0-9_:.-]/g, '')}";
       $to has uid "${receiver.replace(/[^a-zA-Z0-9_:.-]/g, '')}";
       select $sc; limit 1;`,
    )
    const scope = scopeRows[0]?.sc as string | undefined
    if (scope && scope !== 'public') {
      console.warn(
        `[bridge] scope gate: ${sender}→${receiver} has scope=${scope}, not public. Sui ops should use public paths.`,
      )
      // Audit only — non-blocking until harden() is implemented
    }
  } catch {
    // scope check is best-effort
  }

  return allowed
}

// ═══════════════════════════════════════════════════════════════════════════
// RESOLVE — Find Sui object IDs from TypeDB
// ═══════════════════════════════════════════════════════════════════════════

type SuiIds = { wallet: string; unitId: string; pathIds: Record<string, string> }

/** Look up a unit's Sui identity from TypeDB. */
export async function resolve(uid: string): Promise<SuiIds | null> {
  const rows = await readParsed(`
    match $u isa unit, has uid "${uid}", has wallet $w, has sui-unit-id $oid;
    select $w, $oid;
  `).catch(() => [])
  if (!rows.length) return null
  return {
    wallet: rows[0].w as string,
    unitId: rows[0].oid as string,
    pathIds: {},
  }
}

/** Look up the Sui Path object ID for an edge. */
export async function resolvePath(from: string, to: string): Promise<string | null> {
  const rows = await readParsed(`
    match $from isa unit, has uid "${from}"; $to isa unit, has uid "${to}";
    $e (source: $from, target: $to) isa path, has sui-path-id $pid;
    select $pid;
  `).catch(() => [])
  return rows.length ? (rows[0].pid as string) : null
}

// ═══════════════════════════════════════════════════════════════════════════
// MIRROR — Runtime actions → Sui
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mirror a mark() to Sui. Fire-and-forget.
 * If no Sui path exists yet, creates one.
 */
export async function mirrorMark(from: string, to: string, amount = 1): Promise<void> {
  if (!(await canCallSui(from, to))) {
    console.warn(`[Bridge] ${from} not permitted to mark ${to} on Sui — perm-network blocked`)
    return
  }

  const [fIds, tIds] = await Promise.all([resolve(from), resolve(to)])
  if (!fIds?.unitId || !tIds?.unitId) return

  let pathId = await resolvePath(from, to)

  // First interaction? Create on-chain path
  if (!pathId) {
    const { createPath } = await sui()
    const r = await createPath(from, fIds.unitId, tIds.unitId).catch(() => null)
    if (!r?.pathId) return
    pathId = r.pathId
    // Store in TypeDB for next time
    writeSilent(`
      match $from isa unit, has uid "${from}"; $to isa unit, has uid "${to}";
      $e (source: $from, target: $to) isa path;
      insert $e has sui-path-id "${pathId}";
    `)
  }

  const { mark: suiMark } = await sui()
  await suiMark(from, pathId, amount).catch(() => {})
}

/** Mirror a warn() to Sui. Fire-and-forget. */
export async function mirrorWarn(from: string, to: string, amount = 1): Promise<void> {
  if (!(await canCallSui(from, to))) {
    console.warn(`[Bridge] ${from} not permitted to warn ${to} on Sui — perm-network blocked`)
    return
  }

  const pathId = await resolvePath(from, to)
  if (!pathId) return
  const { warn: suiWarn } = await sui()
  await suiWarn(from, pathId, amount).catch(() => {})
}

/** Mirror a Sui pay() call — buyer→seller payment. Fire-and-forget. */
export async function mirrorPay(from: string, to: string, amount: number): Promise<{ digest: string } | null> {
  if (!(await canCallSui(from, to))) return null
  const [fIds, tIds] = await Promise.all([resolve(from), resolve(to)])
  if (!fIds?.unitId || !tIds?.unitId) return null
  const pathId = await resolvePath(from, to)
  if (!pathId) return null
  const { pay } = await sui()
  return await pay(from, fIds.unitId, tIds.unitId, pathId, amount).catch(() => null)
}

/** Mirror a harden() to Sui. Promotes TypeDB path to on-chain Highway object. */
export async function mirrorHarden(from: string, to: string): Promise<{ highwayId: string } | null> {
  if (!(await canCallSui(from, to))) return null
  const pathId = await resolvePath(from, to)
  if (!pathId) return null
  const { harden } = await sui()
  const result = await harden(from, pathId).catch(() => null)
  if (!result?.highwayId) return null
  writeSilent(`
    match $from isa unit, has uid "${from}"; $to isa unit, has uid "${to}";
    $e (source: $from, target: $to) isa path;
    insert $e has sui-highway-id "${result.highwayId}";
  `)
  return result
}

/** Mirror a new actor to Sui. Returns { wallet, unitId } or null. */
export async function mirrorActor(uid: string, name: string): Promise<{ wallet: string; unitId: string } | null> {
  try {
    const { createUnit } = await sui()
    const { address, objectId } = await createUnit(uid, name)
    // Store IDs back in TypeDB
    writeSilent(`
      match $u isa unit, has uid "${uid}";
      insert $u has wallet "${address}", has sui-unit-id "${objectId}";
    `)
    return { wallet: address, unitId: objectId }
  } catch {
    return null
  }
}

export async function mirrorGovernance(
  kind: 'chairman-grant' | 'group-create' | 'key-revoke' | 'role-perm-change',
  subject: string,
  object: string,
  keypair: Ed25519Keypair,
): Promise<void> {
  const PACKAGE_ID = import.meta.env.SUI_PACKAGE_ID || ''
  const CLOCK_ID = '0x0000000000000000000000000000000000000000000000000000000000000006'
  if (!PACKAGE_ID) return

  const { Transaction } = await import('@mysten/sui/transactions')
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::emit_governance`,
    arguments: [tx.pure.string(kind), tx.pure.string(subject), tx.pure.string(object), tx.object(CLOCK_ID)],
  })
  const { signAndExecute } = await sui()
  await signAndExecute(tx, keypair).catch((e: unknown) => {
    console.warn('[bridge] mirrorGovernance failed:', e)
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// ABSORB — Sui events → TypeDB
// ═══════════════════════════════════════════════════════════════════════════

const PACKAGE_ID = import.meta.env.SUI_PACKAGE_ID || ''

interface SuiEvent {
  type: string
  parsedJson: Record<string, unknown>
  timestampMs: string
}

/**
 * Poll Sui events and write to TypeDB.
 * Call from a CF Worker cron or /api/tick.
 *
 * Returns number of events absorbed.
 */
export async function absorb(cursor?: string): Promise<{ count: number; cursor: string }> {
  if (!PACKAGE_ID) return { count: 0, cursor: cursor || '' }
  const { getClient } = await sui()
  const client = getClient()

  const { data, nextCursor } = await client.queryEvents({
    query: { MoveModule: { package: PACKAGE_ID, module: 'substrate' } },
    cursor: cursor ? { txDigest: cursor, eventSeq: '0' } : undefined,
    limit: 50,
    order: 'ascending',
  })

  for (const evt of data) {
    const e = evt as unknown as SuiEvent
    const d = e.parsedJson
    const kind = e.type.split('::').pop()

    switch (kind) {
      case 'Marked':
        await absorbMark(d)
        break
      case 'Warned':
        await absorbWarn(d)
        break
      case 'UnitCreated':
        await absorbUnit(d)
        break
      case 'SignalSent':
        await absorbSignal(d)
        break
      case 'PaymentSent':
        await absorbPayment(d)
        break
      case 'EscrowCreated':
        await absorbEscrowCreated(d)
        break
      case 'EscrowReleased':
        await absorbEscrowReleased(d)
        break
      case 'EscrowCancelled':
        await absorbEscrowCancelled(d)
        break
    }
    if (e.type.includes('GovernanceEvent')) await absorbGovernance(e)
  }

  return { count: data.length, cursor: nextCursor?.txDigest || cursor || '' }
}

// ── Event handlers ──────────────────────────────────────────────────────

async function absorbMark(d: Record<string, unknown>) {
  const strength = Number(d.strength || 0)
  const pathId = d.path_id as string
  // Find path by sui-path-id, update strength
  writeSilent(`
    match $e isa path, has sui-path-id "${pathId}", has strength $s, has traversals $t;
    delete $s of $e; delete $t of $e;
    insert $e has strength ${strength}, has traversals ($t + 1);
  `)
}

async function absorbWarn(d: Record<string, unknown>) {
  const resistance = Number(d.resistance || 0)
  const pathId = d.path_id as string
  writeSilent(`
    match $e isa path, has sui-path-id "${pathId}", has resistance $a;
    delete $a of $e;
    insert $e has resistance ${resistance};
  `)
}

async function absorbUnit(d: Record<string, unknown>) {
  const name = d.name as string
  const unitId = d.unit_id as string
  // Upsert: if unit exists, add sui-unit-id; if not, skip (TypeDB is source of truth)
  writeSilent(`
    match $u isa unit, has uid "${name}";
    insert $u has sui-unit-id "${unitId}";
  `)
}

async function absorbSignal(d: Record<string, unknown>) {
  const amount = Number(d.amount || 0)
  const task = d.task as string
  // Record as signal event in TypeDB (audit trail)
  writeSilent(`
    match $from isa unit, has sui-unit-id "${d.sender}";
    $to isa unit, has sui-unit-id "${d.receiver}";
    insert (sender: $from, receiver: $to) isa signal,
      has data "${task}", has amount ${amount / 1e9},
      has success true, has ts ${new Date().toISOString().replace('Z', '')};
  `)
}

async function absorbPayment(d: Record<string, unknown>) {
  const amount = Number(d.amount || 0)
  writeSilent(`
    match $from isa unit, has sui-unit-id "${d.from}";
    $to isa unit, has sui-unit-id "${d.to}";
    $e (source: $from, target: $to) isa path, has revenue $r;
    delete $r of $e;
    insert $e has revenue ($r + ${amount / 1e9});
  `)
}

async function absorbEscrowCreated(d: Record<string, unknown>) {
  const escrowId = d.escrow_id as string
  const posterId = d.poster as string
  const workerId = d.worker as string
  const bounty = Number(d.bounty || 0)
  const task = (d.task as string) || ''
  const timestampMs = Date.now()

  // Write escrow state to TypeDB for audit trail
  // Fire-and-forget: don't block on TypeDB write
  writeSilent(`
    match $poster isa unit, has sui-unit-id "${posterId}";
    $worker isa unit, has sui-unit-id "${workerId}";
    insert $escrow isa escrow,
      has sui-escrow-id "${escrowId}",
      has escrow-status "created",
      has escrow-amount ${bounty / 1e9},
      has escrow-task "${task}",
      has escrow-created-ms ${timestampMs};
    insert (creator: $poster, recipient: $worker) isa escrow-parties;
  `)
}

async function absorbEscrowReleased(d: Record<string, unknown>) {
  const escrowId = d.escrow_id as string
  const amount = Number(d.amount || 0)
  const timestampMs = Date.now()

  // Mark escrow as settled in TypeDB
  // Amount is the payment received by worker (after protocol fee)
  writeSilent(`
    match $e isa escrow, has sui-escrow-id "${escrowId}", has escrow-status $old_status;
    delete $old_status of $e;
    insert $e has escrow-status "released",
      has escrow-released-ms ${timestampMs},
      has escrow-payment-amount ${amount / 1e9};
  `)
}

async function absorbEscrowCancelled(d: Record<string, unknown>) {
  const escrowId = d.escrow_id as string
  const amount = Number(d.amount || 0)
  const timestampMs = Date.now()

  // Mark escrow as cancelled (refunded) in TypeDB
  writeSilent(`
    match $e isa escrow, has sui-escrow-id "${escrowId}", has escrow-status $old_status;
    delete $old_status of $e;
    insert $e has escrow-status "cancelled",
      has escrow-cancelled-ms ${timestampMs},
      has escrow-refund-amount ${amount / 1e9};
  `)
}

async function absorbGovernance(ev: SuiEvent): Promise<void> {
  const fields = ev.parsedJson as {
    kind?: string
    subject?: string
    object?: string
    actor?: string
    timestamp?: string
  }
  if (!fields.kind || !fields.subject) return

  const tag = `governance:${fields.kind}:${fields.subject}`
  writeSilent(`
    insert $h isa hypothesis,
      has subject "${esc(tag)}",
      has confidence 1.0,
      has hypothesis-status "observed",
      has source "sui",
      has created ${new Date().toISOString().replace('Z', '')};
  `)
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTLE — Resolve bounty escrow after rubric verification
// ═══════════════════════════════════════════════════════════════════════════

/**
 * settleEscrow — release or refund a bounty escrow after rubric verification.
 * Called by persist.ts settle() — fire-and-forget, never throws.
 */
export const settleEscrow = async (
  escrowObjectId: string,
  claimantUid: string,
  posterUid: string,
  success: boolean,
): Promise<{ ok: boolean; error?: string }> => {
  try {
    if (success) {
      const [ids, { releaseEscrow }] = await Promise.all([resolve(claimantUid), sui()])
      if (!ids?.unitId) return { ok: true }
      const pathId = await resolvePath(posterUid, claimantUid)
      if (!pathId) return { ok: true }
      await releaseEscrow(claimantUid, escrowObjectId, ids.unitId, pathId)
    } else {
      const [ids, { cancelEscrow }] = await Promise.all([resolve(posterUid), sui()])
      if (!ids?.unitId) return { ok: true }
      const pathId = await resolvePath(posterUid, claimantUid)
      if (!pathId) return { ok: true }
      await cancelEscrow(posterUid, escrowObjectId, ids.unitId, pathId)
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    writeSilent(`
      match $e isa escrow, has escrow-id "${escrowObjectId}", has escrow-status $old;
      delete $old of $e;
      insert $e has escrow-status "settlement-failed";
    `)
    return { ok: false, error: message }
  }
}
