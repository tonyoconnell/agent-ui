/**
 * Human unit management — TypeDB operations for human actors.
 *
 * Extracted from api-auth.ts to break circular dependency:
 *   auth.ts → sui-wallet.ts → api-auth.ts → auth.ts
 *
 * This module only depends on TypeDB + Sui, not Better Auth.
 */

import { addressFor } from '@/lib/sui'
import { readParsed, write, writeTracked } from '@/lib/typedb'

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Insert unit-if-absent for a BetterAuth-authenticated human. Idempotent.
 *
 * Creates:
 *   1. unit entity with uid, wallet, human kind
 *   2. personal group (group:{uid})
 *   3. chairman membership in personal group
 */
export async function ensureHumanUnit(
  uid: string,
  user: { id: string; email?: string | null; name?: string | null },
): Promise<void> {
  const existing = await readParsed(`
    match $u isa unit, has uid "${esc(uid)}";
    select $u;
  `).catch(() => [])
  if (existing.length > 0) return

  let wallet = ''
  try {
    wallet = await addressFor(uid)
  } catch {
    /* SUI_SEED not set */
  }

  const name = user.name || user.email || uid
  const now = new Date().toISOString().replace('Z', '')
  const walletClause = wallet ? `, has wallet "${esc(wallet)}"` : ''
  await write(`
    insert $u isa unit,
      has uid "${esc(uid)}",
      has name "${esc(name)}",
      has unit-kind "human",
      has status "active",
      has success-rate 0.5,
      has activity-score 0.0,
      has sample-count 0,
      has generation 0${walletClause},
      has created ${now};
  `).catch(() => {
    /* best-effort; next request retries */
  })

  // Auto-create personal group (idempotent). writeTracked so schema drift
  // surfaces in logs instead of silently orphaning humans from /in.
  const escPGid = esc(`group:${uid}`)
  const groupOk = await writeTracked(`
    match $u isa unit, has uid "${esc(uid)}";
    not { $g isa group, has gid "${escPGid}"; };
    insert $g isa group,
      has gid "${escPGid}",
      has name "${esc(uid)}",
      has group-type "personal",
      has status "active";
  `)
  if (!groupOk) console.warn(`[ensureHumanUnit] personal group create failed for ${uid}`)
  const memOk = await writeTracked(`
    match $u isa unit, has uid "${esc(uid)}";
          $g isa group, has gid "${escPGid}";
    not { (group: $g, member: $u) isa membership; };
    insert (group: $g, member: $u) isa membership, has member-role "chairman";
  `)
  if (!memOk) console.warn(`[ensureHumanUnit] chairman membership create failed for ${uid}`)
}
