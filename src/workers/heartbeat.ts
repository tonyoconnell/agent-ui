/**
 * heartbeat.ts — Agent liveness proof
 *
 * CF Worker scheduled trigger: fires every HEARTBEAT_INTERVAL_DAYS per agent.
 *
 * Emits:
 *   - agent:alive signal to substrate (POST /api/signal)
 *   - liveness-last-verified-at written to TypeDB unit row
 *   - Dead-man cascade: children silent > DEADMAN_THRESHOLD_DAYS get agent:paused
 *
 * Contract: interfaces/peer/heartbeat.d.ts
 */

import { readParsed, writeSilent } from '@/lib/typedb'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const HEARTBEAT_INTERVAL_DAYS = 14
export const DEADMAN_THRESHOLD_DAYS = 30

const MS_PER_DAY = 24 * 60 * 60 * 1000

// ═══════════════════════════════════════════════════════════════════════════
// SEND HEARTBEAT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Emit a heartbeat for the given agent uid.
 *
 * 1. POST /api/signal { receiver: uid, data: { tags: ["agent:alive"], type: "agent:alive" } }
 * 2. Upsert liveness-last-verified-at on the unit in TypeDB
 * 3. Run dead-man cascade check for this agent's children
 */
export async function sendHeartbeat(uid: string): Promise<void> {
  const now = new Date()
  const isoNow = now.toISOString().slice(0, 19) // TypeDB datetime format

  // Step 1: emit alive signal to substrate
  const baseUrl =
    (typeof process !== 'undefined' && process.env?.ONE_BASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env?.ONE_BASE_URL) ||
    'https://dev.one.ie'

  await fetch(`${baseUrl}/api/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: uid,
      receiver: uid,
      data: JSON.stringify({
        type: 'agent:alive',
        tags: ['agent:alive', 'heartbeat'],
        agentUid: uid,
        timestamp: now.toISOString(),
      }),
    }),
  }).catch(() => {
    // Non-fatal: TypeDB write below is the authoritative record
  })

  // Step 2: upsert liveness-last-verified-at on the unit
  // Pattern mirrors last-evolved upsert in loop.ts
  writeSilent(`
    match $u isa unit, has uid "${uid}";
    delete $u has liveness-last-verified-at $lv;
    insert $u has liveness-last-verified-at ${isoNow};
  `).catch(() => {
    // Attribute may not exist yet — try insert-only path
    writeSilent(`
      match $u isa unit, has uid "${uid}";
      not { $u has liveness-last-verified-at $lv; };
      insert $u has liveness-last-verified-at ${isoNow};
    `).catch(() => {})
  })

  // Step 3: cascade check for children
  await checkDeadManCascade(uid)
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAD-MAN CASCADE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Query TypeDB for children of parentUid (via g:owns membership or ownership
 * group convention). For each child whose liveness-last-verified-at is older
 * than DEADMAN_THRESHOLD_DAYS, emit agent:paused signal.
 *
 * "Children" are units that this parent spawned — identified by membership in
 * a group of type "owns" where parentUid is chairman.
 */
export async function checkDeadManCascade(parentUid: string): Promise<void> {
  const thresholdMs = DEADMAN_THRESHOLD_DAYS * MS_PER_DAY
  const cutoff = new Date(Date.now() - thresholdMs).toISOString().slice(0, 19)

  // Query children owned by this parent (g:owns:<childUid> group pattern)
  const children = await readParsed(`
    match
      $g isa group, has gid $gid, has group-type "owns";
      (group: $g, member: $parent) isa membership, has member-role "chairman";
      $parent isa unit, has uid "${parentUid}";
      (group: $g, member: $child) isa membership;
      $child isa unit, has uid $childUid;
      $childUid != "${parentUid}";
    select $childUid, $gid;
  `).catch(() => [] as Array<{ childUid: unknown; gid: unknown }>)

  if (!children.length) return

  const baseUrl =
    (typeof process !== 'undefined' && process.env?.ONE_BASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env?.ONE_BASE_URL) ||
    'https://dev.one.ie'

  for (const row of children) {
    const childUid = row.childUid as string

    // Check last heartbeat for this child
    const liveness = await readParsed(`
      match $u isa unit, has uid "${childUid}", has liveness-last-verified-at $lv;
      select $lv;
    `).catch(() => [] as Array<{ lv: unknown }>)

    let isSilent = false

    if (!liveness.length) {
      // Never sent a heartbeat — treat as silent if created before cutoff
      const creation = await readParsed(`
        match $u isa unit, has uid "${childUid}", has created $c;
        select $c;
      `).catch(() => [] as Array<{ c: unknown }>)

      if (!creation.length) {
        // No creation date either — assume silent
        isSilent = true
      } else {
        const createdAt = new Date(creation[0].c as string).getTime()
        isSilent = createdAt < Date.now() - thresholdMs
      }
    } else {
      const lastVerified = new Date(liveness[0].lv as string).getTime()
      isSilent = lastVerified < Date.now() - thresholdMs
    }

    if (isSilent) {
      // Emit agent:paused signal (fire-and-forget, closed-loop via substrate)
      await fetch(`${baseUrl}/api/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: parentUid,
          receiver: childUid,
          data: JSON.stringify({
            type: 'agent:paused',
            tags: ['agent:paused', 'deadman'],
            uid: childUid,
            reason: 'deadman',
            parentUid,
            timestamp: new Date().toISOString(),
          }),
        }),
      }).catch(() => {})
    }
  }
}
