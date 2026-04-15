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

const AGENTS_DIR = join(import.meta.dir, '../agents/donal')
const DRY_RUN = process.argv.includes('--dry-run')

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

  if (DRY_RUN) {
    console.log('\n--- WorldSpec JSON (dry-run) ---')
    console.log(JSON.stringify(spec, null, 2))
    console.log('\nDry-run complete. No writes performed.')
    return
  }

  console.log(`\nSyncing to TypeDB …`)
  try {
    await syncWorld(spec)
    console.log(`\nSync complete.`)
    console.log(`  TypeDB group : ${spec.name}`)
    console.log(`  Agents synced: ${agentCount}`)
    console.log(`  Skills synced: ${skillCount}`)
  } catch (err) {
    console.error(`\nSync failed: ${err}`)
    process.exit(1)
  }
}

main()
