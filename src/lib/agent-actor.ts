/**
 * Agent actor management — TypeDB operations for agent actors.
 *
 * Parallel to human-actor.ts but for actor-type "agent".
 * Called explicitly from agent registration flows, not from session hooks.
 */

import { readParsed, write, writeTracked } from '@/lib/typedb'

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Insert agent actor if absent. Idempotent.
 *
 * Creates:
 *   1. actor entity with uid, actor-type "agent"
 *   2. personal group (group:{uid})
 *   3. operator membership (agents are operators, not chairmen — humans hold chairmanship)
 */
export async function ensureAgentUnit(
  uid: string,
  opts: { name?: string; kind?: string } = {},
): Promise<void> {
  const existing = await readParsed(`
    match $u isa actor, has aid "${esc(uid)}";
    select $u;
  `).catch(() => [])

  if (existing.length === 0) {
    const name = opts.name || uid
    const kind = opts.kind || 'agent'
    const now = new Date().toISOString().replace('Z', '')
    await write(`
      insert $u isa actor,
        has aid "${esc(uid)}",
        has name "${esc(name)}",
        has actor-type "${esc(kind)}",
        has status "active",
        has success-rate 0.5,
        has activity-score 0.0,
        has sample-count 0,
        has generation 0,
        has created ${now};
    `).catch(() => { /* best-effort */ })
  }

  const escGid = esc(`group:${uid}`)
  await writeTracked(`
    match $u isa actor, has aid "${esc(uid)}";
    not { $g isa group, has gid "${escGid}"; };
    insert $g isa group,
      has gid "${escGid}",
      has name "${esc(uid)}",
      has group-type "personal",
      has status "active";
  `).catch(() => {})

  // Agents get operator role in their own group (not chairman — a human claims that)
  await writeTracked(`
    match $u isa actor, has aid "${esc(uid)}";
          $g isa group, has gid "${escGid}";
    not { (group: $g, member: $u) isa membership; };
    insert (group: $g, member: $u) isa membership, has member-role "operator";
  `).catch(() => {})
}
