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

import { cancelEscrow, createPath, createUnit, getClient, mark as suiMark, releaseEscrow, warn as suiWarn } from '@/lib/sui'
import { readParsed, writeSilent } from '@/lib/typedb'

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
  const [fIds, tIds] = await Promise.all([resolve(from), resolve(to)])
  if (!fIds?.unitId || !tIds?.unitId) return

  let pathId = await resolvePath(from, to)

  // First interaction? Create on-chain path
  if (!pathId) {
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

  await suiMark(from, pathId, amount).catch(() => {})
}

/** Mirror a warn() to Sui. Fire-and-forget. */
export async function mirrorWarn(from: string, to: string, amount = 1): Promise<void> {
  const pathId = await resolvePath(from, to)
  if (!pathId) return
  await suiWarn(from, pathId, amount).catch(() => {})
}

/** Mirror a new actor to Sui. Returns { wallet, unitId } or null. */
export async function mirrorActor(uid: string, name: string): Promise<{ wallet: string; unitId: string } | null> {
  try {
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
    }
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

// ═══════════════════════════════════════════════════════════════════════════
// SETTLE — Resolve bounty escrow after rubric verification
// ═══════════════════════════════════════════════════════════════════════════

/**
 * settleEscrow — release or refund a bounty escrow after rubric verification.
 * Called by persist.ts settle() — fire-and-forget, never throws.
 */
export const settleEscrow = (
  escrowObjectId: string,
  claimantUid: string,
  posterUid: string,
  success: boolean,
): void => {
  if (success) {
    resolve(claimantUid)
      .then(ids => {
        if (!ids?.unitId) return
        // Path from poster→claimant; resolve for pathObjectId
        return resolvePath(posterUid, claimantUid).then(pathId => {
          if (!pathId) return
          releaseEscrow(claimantUid, escrowObjectId, ids.unitId, pathId).catch(() => {})
        })
      })
      .catch(() => {})
  } else {
    resolve(posterUid)
      .then(ids => {
        if (!ids?.unitId) return
        return resolvePath(posterUid, claimantUid).then(pathId => {
          if (!pathId) return
          cancelEscrow(posterUid, escrowObjectId, ids.unitId, pathId).catch(() => {})
        })
      })
      .catch(() => {})
  }
}
