/**
 * sync-donal-world.ts
 *
 * Sync the OO Agency (Donal) 11-agent world to TypeDB.
 *
 * Usage:
 *   bun run scripts/sync-donal-world.ts           # sync to TypeDB
 *   bun run scripts/sync-donal-world.ts --dry-run  # print WorldSpec JSON only
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseDirectory, syncWorld } from '@/engine/agent-md'
import { read, write } from '@/lib/typedb'

const AGENTS_DIR = join(import.meta.dir, '../agents/donal')
const DRY_RUN = process.argv.includes('--dry-run')

// TQL for the OO Agency world group (idempotent: match-or-insert)
const _TQL_OO_GROUP = `
match $g isa group, has gid "world:oo-agency";
insert $g isa group;
`.trim()

const TQL_OO_GROUP_INSERT = `insert $g isa group,
  has gid "world:oo-agency",
  has name "OO Marketing Agency",
  has group-type "world",
  has brand "premium:oo-agency";`

// TQL for the ONE Protocol Treasury actor
const TQL_TREASURY_INSERT = `insert $a isa actor,
  has aid "treasury:one",
  has actor-type "world",
  has name "ONE Protocol Treasury";`

async function existsGroup(gid: string): Promise<boolean> {
  try {
    const rows = await read(`match $g isa group, has gid "${gid}"; select $g;`)
    return rows.length > 0
  } catch {
    return false
  }
}

async function existsActor(aid: string): Promise<boolean> {
  try {
    const rows = await read(`match $a isa actor, has aid "${aid}"; select $a;`)
    return rows.length > 0
  } catch {
    return false
  }
}

async function seedOoGroup(dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log('\n--- OO Agency world group (dry-run) ---')
    console.log(TQL_OO_GROUP_INSERT)
    return
  }
  if (await existsGroup('world:oo-agency')) {
    console.log('  group world:oo-agency already exists — skip')
    return
  }
  await write(TQL_OO_GROUP_INSERT)
  console.log('  inserted group world:oo-agency')
}

async function seedTreasury(dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log('\n--- treasury:one actor (dry-run) ---')
    console.log(TQL_TREASURY_INSERT)
    return
  }
  if (await existsActor('treasury:one')) {
    console.log('  actor treasury:one already exists — skip')
    return
  }
  await write(TQL_TREASURY_INSERT)
  console.log('  inserted actor treasury:one')
}

async function seedMemberships(uids: string[], dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log('\n--- Memberships (dry-run) ---')
    for (const uid of uids) {
      console.log(
        `insert (group: (isa group, has gid "world:oo-agency"), member: (isa actor, has aid "${uid}")) isa membership;`,
      )
    }
    return
  }
  for (const uid of uids) {
    try {
      const existing = await read(
        `match $g isa group, has gid "world:oo-agency"; $a isa actor, has aid "${uid}"; (group: $g, member: $a) isa membership; select $g;`,
      )
      if (existing.length > 0) {
        console.log(`  membership ${uid} → world:oo-agency already exists — skip`)
        continue
      }
      await write(
        `match $g isa group, has gid "world:oo-agency"; $a isa actor, has aid "${uid}"; insert (group: $g, member: $a) isa membership;`,
      )
      console.log(`  membership ${uid} → world:oo-agency inserted`)
    } catch (err) {
      console.warn(`  membership ${uid} failed: ${err}`)
    }
  }
}

async function loadFiles(dir: string): Promise<{ name: string; content: string }[]> {
  const entries = await readdir(dir)
  const files = entries.filter((f) => f.endsWith('.md'))
  return Promise.all(
    files.map(async (name) => ({
      name,
      content: await readFile(join(dir, name), 'utf-8'),
    })),
  )
}

async function main() {
  console.log(`Loading agents from ${AGENTS_DIR} …`)

  let files: { name: string; content: string }[]
  try {
    files = await loadFiles(AGENTS_DIR)
  } catch (err) {
    console.error(`Failed to read agents/donal/: ${err}`)
    process.exit(1)
  }

  console.log(`  Found ${files.length} markdown file(s)`)

  let spec = await parseDirectory(files)

  // Override group name — TypeDB group must be 'donal', not whatever README says
  spec = { ...spec, name: 'donal' }

  const agentCount = spec.agents.length
  const skillCount = spec.agents.reduce((n, a) => n + (a.skills?.length ?? 0), 0)
  const skillNames = spec.agents.flatMap((a) => (a.skills ?? []).map((s) => `${a.name}:${s.name}`))

  console.log(`\nWorldSpec ready`)
  console.log(`  group  : ${spec.name}`)
  console.log(`  agents : ${agentCount}`)
  console.log(`  skills : ${skillCount}`)
  console.log(`  skill list:`)
  for (const s of skillNames) {
    console.log(`    - ${s}`)
  }

  // Derive agent UIDs: agent-md uses "group:name" format; donal agents have group "marketing"
  // Override group name is 'donal', so uids will be "donal:<name>"
  const agentUids = spec.agents.map((a) => `${spec.name}:${a.name}`)

  if (DRY_RUN) {
    console.log('\n--- WorldSpec JSON (dry-run) ---')
    console.log(JSON.stringify(spec, null, 2))
    await seedOoGroup(true)
    await seedTreasury(true)
    await seedMemberships(agentUids, true)
    console.log('\nDry-run complete. No writes performed.')
    return
  }

  console.log(`\nSyncing agents to TypeDB …`)
  try {
    await syncWorld(spec)
    console.log(`  TypeDB group : ${spec.name}`)
    console.log(`  Agents synced: ${agentCount}`)
    console.log(`  Skills synced: ${skillCount}`)
  } catch (err) {
    console.error(`\nSync failed: ${err}`)
    process.exit(1)
  }

  console.log('\nSeeding world:oo-agency group …')
  await seedOoGroup(false)

  console.log('\nSeeding treasury:one actor …')
  await seedTreasury(false)

  console.log('\nSeeding memberships (donal agents → world:oo-agency) …')
  await seedMemberships(agentUids, false)

  console.log('\nSync complete.')
}

main()
