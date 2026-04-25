#!/usr/bin/env bun
/**
 * migrate-tony-to-owner — owner-todo Gap 0 task 0.m1.
 *
 * Pivots tony@one.ie's role from chairman to owner on his personal group
 * (group:human:tony). One-shot migration; idempotent (re-run is a no-op
 * once role is "owner").
 *
 * Verifies:
 *   1. Pre-state: tony has exactly one membership with role "chairman".
 *   2. Post-state: same membership now has role "owner"; chairman row gone.
 */

import { readParsed, write } from '../src/lib/typedb'

async function getRole(uid: string): Promise<{ gid: string; r: string } | null> {
  const rows = await readParsed(`
    match
      $u isa unit, has uid "${uid}";
      $g isa group, has gid $gid;
      ($u, $g) isa membership, has member-role $r;
    select $gid, $r;
  `)
  if (!rows || rows.length === 0) return null
  return rows[0] as { gid: string; r: string }
}

async function main() {
  const uid = 'human:tony'
  const targetGid = 'group:human:tony'

  // 1. Pre-check
  const before = await getRole(uid)
  if (!before) {
    console.error(`✗ no membership found for uid=${uid}`)
    process.exit(1)
  }
  console.log(`pre:  uid=${uid} gid=${before.gid} role=${before.r}`)

  if (before.r === 'owner') {
    console.log('✓ already owner — no-op (idempotent)')
    return
  }

  if (before.gid !== targetGid) {
    console.error(`✗ unexpected group gid=${before.gid} (expected ${targetGid})`)
    process.exit(1)
  }
  if (before.r !== 'chairman') {
    console.error(`✗ unexpected pre-state role=${before.r} (expected chairman)`)
    process.exit(1)
  }

  // 2. Migrate (delete current role attribute, insert owner attribute on same
  // membership). The pre-check above already asserts role === "chairman", so
  // we don't need a value filter inside the match — and TypeDB 3.x rejects
  // `$r == "chairman"` mixed with relation-role declaration on $m as REP1.
  console.log('migrating chairman → owner …')
  // TypeDB 3.x: declare $m as the membership instance using `links (...)`
  // for relation roles, then bind `$m has member-role $r` on a SEPARATE
  // line. Combining the relation-pattern `$m (group: $g, member: $u) isa membership`
  // with `, has member-role $r` on the same statement triggers REP1
  // ("variable cannot be declared as both Object and ThingType").
  await write(`
    match
      $u isa unit, has uid "${uid}";
      $g isa group, has gid "${targetGid}";
      $m isa membership, links (group: $g, member: $u);
      $m has member-role $r;
    delete $r of $m;
    insert $m has member-role "owner";
  `)

  // 3. Post-check
  const after = await getRole(uid)
  if (!after) {
    console.error(`✗ post-migration: no membership found for uid=${uid}`)
    process.exit(1)
  }
  console.log(`post: uid=${uid} gid=${after.gid} role=${after.r}`)

  if (after.r !== 'owner') {
    console.error(`✗ post-state role=${after.r} (expected owner)`)
    process.exit(1)
  }

  console.log('✓ migration complete')
}

await main()
