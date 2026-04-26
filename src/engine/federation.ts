/**
 * Federation — another ONE substrate as a unit in this world.
 *
 * Signal chains cross world boundaries transparently.
 * Pheromone tracks cross-world reliability: slow or failing worlds
 * accumulate resistance and get routed around, identically to any unit.
 *
 * Memory recall across federation filters by scope:
 * - Only public + group-scoped signals visible to other worlds (federated: true)
 * - Private signals stay in originating world
 *
 * Usage:
 *   net.units['world-legal']   = federate('world-legal',   'https://legal.one.ie',   LEGAL_KEY)
 *   net.units['world-finance'] = federate('world-finance', 'https://finance.one.ie', FINANCE_KEY)
 *   net.signal({ receiver: 'world-legal:review', data: { contract } }, 'drafter')
 *   // → forwards to https://legal.one.ie/api/signal with { receiver: 'review', data: { contract } }
 *
 *   // Cross-world memory recall with scope filtering
 *   const insights = await net.recall({ subject: 'contract-review', federated: true })
 *   // → only public + group-scoped hypotheses returned
 *
 * Gap 6 §6.s2: inbound() helper for foreign signals arriving via a bridge path.
 *   - Downgrades 'owner' role to 'chairman' (foreign owner has no local bypass)
 *   - Rejects stale bridges: peerOwnerVersion mismatch → bridge:stale
 *   - Emits audit record for every downgrade
 */

import { readParsed } from '@/lib/typedb'
import { audit } from './adl-cache'
import { type Unit, unit } from './world'

// ── BridgePath — the stored record from TypeDB ───────────────────────────────

/**
 * Gap 6: attributes stored on the bridge path in TypeDB when the handshake
 * includes a peer owner assertion (§6.s1).
 */
export interface BridgePath {
  from: string
  to: string
  peerOwnerAddress?: string
  /** Gap 6: version of the foreign owner key at handshake time */
  peerOwnerVersion?: number
}

// ── InboundSignal — minimal shape for inbound() ──────────────────────────────

export interface InboundSignal {
  receiver?: string
  data?: unknown
  /** Role claimed by the foreign sender */
  role?: string
  /** Version of the peer owner key at send time (Gap 6) */
  peerOwnerVersion?: number
}

// ── InboundResult — success or stale rejection ───────────────────────────────

export type InboundResult =
  | { ok: true; signal: InboundSignal }
  | { ok: false; federation: 'bridge:stale'; reason: string }

/**
 * Gap 6 §6.s2 — process a foreign signal arriving via a bridge path.
 *
 * Rules (per federation.md + recon-federation.md):
 *
 * 1. Look up the bridge path's peer_owner_version from TypeDB.
 * 2. If signal.peerOwnerVersion is present AND differs from the stored version
 *    → reject with { federation: 'bridge:stale', reason: '...' }.
 *    V1 fallback: if no peerOwnerVersion on the signal, warn but allow.
 *    TODO Gap 6 V2: enforce peerOwnerVersion presence once all peers send it.
 * 3. If signal.role === 'owner' and signal arrived via a bridge path
 *    → downgrade to 'chairman' (foreign owner is not the local substrate owner)
 *    → emit audit record { gate: 'role:owner', decision: 'observe', action: 'federation:downgrade' }
 * 4. Return { ok: true, signal } with potentially mutated role.
 *
 * @param signal   The raw inbound signal object (mutated in-place for role).
 * @param fromBridge  The bridge path record (from TypeDB lookup or caller).
 */
export async function inbound(signal: InboundSignal, fromBridge: BridgePath): Promise<InboundResult> {
  // Step 1 — look up stored peer_owner_version from TypeDB if not on bridge record
  let storedVersion = fromBridge.peerOwnerVersion
  if (storedVersion === undefined) {
    try {
      const rows = await readParsed(
        `match $p isa path,
               has bridge-kind "federation",
               has peer-owner-address "${fromBridge.peerOwnerAddress ?? ''}",
               has peer-owner-version $v;
         select $v;`,
      )
      if (rows.length > 0 && typeof (rows[0] as { v?: number }).v === 'number') {
        storedVersion = (rows[0] as { v: number }).v
      }
    } catch {
      // TypeDB unavailable — fail open per V1 semantics
    }
  }

  // Step 2 — version-mismatch check (Gap 6 §6.s2)
  if (signal.peerOwnerVersion !== undefined && storedVersion !== undefined) {
    if (signal.peerOwnerVersion !== storedVersion) {
      return {
        ok: false,
        federation: 'bridge:stale',
        reason: 'peer rotated owner key; re-handshake required',
      }
    }
  }
  // V1 fallback: peerOwnerVersion absent on signal → warn but allow
  // TODO Gap 6 V2: enforce presence of peerOwnerVersion on every inbound signal

  // Step 3 — role downgrade: owner → chairman
  if (signal.role === 'owner') {
    signal.role = 'chairman'
    audit({
      sender: fromBridge.peerOwnerAddress ?? 'foreign',
      receiver: signal.receiver ?? 'unknown',
      gate: 'role:owner',
      decision: 'observe',
      mode: 'audit',
      action: 'federation:downgrade',
      reason: `foreign owner downgraded to chairman (peer: ${fromBridge.peerOwnerAddress ?? 'unknown'})`,
    })
  }

  return { ok: true, signal }
}

// ── lookupBridgePath — query TypeDB for the bridge record ───────────────────

/**
 * Resolve the bridge path record for a given foreign sender address.
 * Returns undefined if no bridge path found (not a federated sender).
 */
export async function lookupBridgePath(peerOwnerAddress: string): Promise<BridgePath | undefined> {
  try {
    const rows = await readParsed(
      `match $p isa path,
             has bridge-kind "federation",
             has peer-owner-address "${peerOwnerAddress}",
             has peer-owner-version $v;
       select $v;`,
    )
    if (rows.length > 0) {
      return {
        from: peerOwnerAddress,
        to: 'local',
        peerOwnerAddress,
        peerOwnerVersion: (rows[0] as { v?: number }).v,
      }
    }
  } catch {
    // TypeDB unavailable — return undefined (fail open)
  }
  return undefined
}

// ── federate — outbound unit (unchanged from original) ───────────────────────

export const federate = (id: string, baseUrl: string, apiKey: string): Unit => {
  const base = baseUrl.replace(/\/$/, '')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  return unit(id).on('default', async (data) => {
    // data may carry { receiver, ...rest } for intra-world routing
    const { receiver, ...rest } = (data as { receiver?: string } & Record<string, unknown>) ?? {}
    const res = await fetch(`${base}/api/signal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sender: id, receiver: receiver ?? 'entry', data: rest }),
    }).catch(() => null)
    return res?.ok ? await res.json() : null
  })
}

/**
 * Convenience: forward a fully-formed Signal to another world.
 * Useful when the local unit name IS the target unit in the remote world.
 *
 * net.units['world-b:scout'] = federateSignal('world-b:scout', 'https://world-b.one.ie', KEY)
 * net.signal({ receiver: 'world-b:scout', data: {} }, 'entry')
 */
export const federateSignal = (receiver: string, baseUrl: string, apiKey: string): Unit => {
  const base = baseUrl.replace(/\/$/, '')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  return unit(receiver).on('default', async (data) => {
    const res = await fetch(`${base}/api/signal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ receiver, data }),
    }).catch(() => null)
    return res?.ok ? await res.json() : null
  })
}
