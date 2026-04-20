#!/usr/bin/env bun
/**
 * Backfill personal groups for humans orphaned by the `visibility` schema
 * drift bug (fixed in src/lib/api-auth.ts by dropping `visibility` and
 * swapping writeSilent → writeTracked).
 *
 * Scan: every unit with unit-kind "human"
 * Compare: which ones lack a membership in group:{uid}
 * Write: create group + chairman membership for each orphan
 *
 * Idempotent: safe to re-run. The TQL `not { ... }` guards prevent dupes
 * even if the script is interrupted mid-flight.
 *
 * Run: bun run scripts/backfill-personal-groups.ts
 *      bun run scripts/backfill-personal-groups.ts --dry-run
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const GATEWAY_URL = process.env.PUBLIC_GATEWAY_URL || 'https://api.one.ie'
const DRY_RUN = process.argv.includes('--dry-run')

async function tql(query: string, write = false): Promise<unknown[]> {
  const res = await fetch(`${GATEWAY_URL}/typedb/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, transactionType: write ? 'write' : 'read', commit: write }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TypeDB ${res.status}: ${text.slice(0, 240)}`)
  }
  const data = (await res.json()) as { answers?: unknown[] }
  return data.answers || []
}

function parseRows(answers: unknown[]): Record<string, string>[] {
  return (answers as Array<{ data?: Record<string, { value?: string }> }>).map((a) => {
    const row: Record<string, string> = {}
    if (!a?.data) return row
    for (const [k, v] of Object.entries(a.data)) if (v?.value !== undefined) row[k] = String(v.value)
    return row
  })
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function main() {
  console.log(`Gateway: ${GATEWAY_URL}${DRY_RUN ? '  (dry-run)' : ''}`)

  const humans = parseRows(
    await tql(`
    match $u isa unit, has unit-kind "human", has uid $uid;
    select $uid;
  `),
  )
  console.log(`Found ${humans.length} human units`)

  const orphans: string[] = []
  for (const { uid } of humans) {
    const rows = parseRows(
      await tql(`
      match $u isa unit, has uid "${esc(uid)}";
            $g isa group, has gid "${esc(`group:${uid}`)}";
            (member: $u, group: $g) isa membership;
      select $u;
    `),
    )
    if (rows.length === 0) orphans.push(uid)
  }

  console.log(`Orphans needing backfill: ${orphans.length}`)
  if (orphans.length === 0) return
  for (const uid of orphans) console.log(`  - ${uid}`)

  if (DRY_RUN) {
    console.log('\nDry run complete. Re-run without --dry-run to apply.')
    return
  }

  let ok = 0
  let fail = 0
  for (const uid of orphans) {
    const pgid = `group:${uid}`
    try {
      await tql(
        `
        match $u isa unit, has uid "${esc(uid)}";
        not { $g isa group, has gid "${esc(pgid)}"; };
        insert $g isa group,
          has gid "${esc(pgid)}",
          has name "${esc(uid)}",
          has group-type "personal",
          has status "active";
      `,
        true,
      )
      await tql(
        `
        match $u isa unit, has uid "${esc(uid)}";
              $g isa group, has gid "${esc(pgid)}";
        not { (group: $g, member: $u) isa membership; };
        insert (group: $g, member: $u) isa membership, has member-role "chairman";
      `,
        true,
      )
      ok++
      console.log(`  ✓ ${uid}`)
    } catch (err) {
      fail++
      console.log(`  ✗ ${uid}: ${(err as Error).message}`)
    }
  }

  console.log(`\nDone. succeeded=${ok} failed=${fail} total=${orphans.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
