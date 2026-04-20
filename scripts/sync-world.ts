/**
 * sync-world.ts — Sync a 6-dimension world directory to TypeDB.
 *
 * Walks: groups/ actors/ things/ paths/ learning/
 * (events/ is channel config — handled by nanoclaw, not this script.)
 *
 * Usage:
 *   bun run scripts/sync-world.ts --dir ./templates/world
 *   bun run scripts/sync-world.ts --dir ./templates/world --dry-run
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { toTypeDB as agentToTypeDB, parse as parseAgent } from '@/engine/agent-md'
import { write } from '@/lib/typedb'

const DIR = (() => {
  const i = process.argv.indexOf('--dir')
  return i >= 0 ? process.argv[i + 1] : './templates/world'
})()
const DRY = process.argv.includes('--dry-run')

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
const readFrontmatter = (body: string): Record<string, unknown> => {
  const m = body.match(FRONTMATTER)
  return m ? ((parseYaml(m[1]) ?? {}) as Record<string, unknown>) : {}
}

async function listMd(sub: string): Promise<{ name: string; body: string }[]> {
  const dir = join(DIR, sub)
  const files = await readdir(dir).catch(() => [] as string[])
  const out: { name: string; body: string }[] = []
  for (const f of files) {
    if (!f.endsWith('.md')) continue
    if (f.toLowerCase() === 'readme.md') continue
    out.push({ name: f, body: await readFile(join(dir, f), 'utf8') })
  }
  return out
}

async function worldMeta(): Promise<{ name: string; description?: string }> {
  const body = await readFile(join(DIR, 'world.md'), 'utf8').catch(() => '')
  const fm = readFrontmatter(body) as { name?: string; description?: string }
  return { name: fm.name || 'world', description: fm.description }
}

// — Dimension emitters —

const qGroup = (gid: string, name: string, type = 'team', purpose?: string) => `
  match not { $existing isa group, has gid "${gid}"; };
  insert $g isa group,
    has gid "${gid}",
    has name "${esc(name)}",
    has group-type "${type}",
    has status "active"${purpose ? `,\n    has purpose "${esc(purpose)}"` : ''};
`

const qThing = (tid: string, fm: Record<string, unknown>) => {
  const name = String(fm.name || tid)
  const type = String(fm.type || 'skill')
  const price = Number(fm.price ?? 0)
  const tags = Array.isArray(fm.tags) ? fm.tags : []
  const tagClauses = tags.map((t) => `has tag "${esc(String(t))}"`).join(', ')
  return `
  match not { $existing isa thing, has tid "${tid}"; };
  insert $t isa thing,
    has tid "${tid}",
    has name "${esc(name)}",
    has thing-type "${type}",
    has price ${price}${tagClauses ? `, ${tagClauses}` : ''};
`
}

const qHypothesis = (hid: string, fm: Record<string, unknown>) => {
  const statement = String(fm.statement || fm.name || hid)
  const confidence = Number(fm.confidence ?? 0)
  return `
  match not { $existing isa hypothesis, has hid "${hid}"; };
  insert $h isa hypothesis,
    has hid "${hid}",
    has statement "${esc(statement)}",
    has confidence ${confidence},
    has observations 0,
    has scope "group";
`
}

const qPathSeed = (source: string, target: string, strength: number) => `
  match
    $from isa unit, has uid "${source}";
    $to   isa unit, has uid "${target}";
  insert (source: $from, target: $to) isa path,
    has strength ${strength},
    has resistance 0.0,
    has traversals 0;
`

// — Main —

async function main() {
  const _t0 = performance.now()
  const meta = await worldMeta()
  const gid = meta.name
  const queries: string[] = []

  // 1. World group (gid matches agent membership query in agent-md.ts)
  queries.push(qGroup(gid, meta.name, 'world', meta.description))

  // Groups/
  for (const { name, body } of await listMd('groups')) {
    const fm = readFrontmatter(body) as { name?: string; type?: string }
    const subGid = `${gid}:${fm.name || name.replace(/\.md$/, '')}`
    queries.push(qGroup(subGid, fm.name || name, fm.type || 'team'))
  }

  // Actors/ — delegate to existing parse + toTypeDB
  for (const { body } of await listMd('actors')) {
    const spec = parseAgent(body)
    spec.group = meta.name
    queries.push(...agentToTypeDB(spec))
  }

  // Things/
  for (const { name, body } of await listMd('things')) {
    const fm = readFrontmatter(body)
    const tid = `${gid}:${String(fm.name ?? name.replace(/\.md$/, ''))}`
    queries.push(qThing(tid, fm))
  }

  // Learning/
  for (const { name, body } of await listMd('learning')) {
    const fm = readFrontmatter(body)
    const hid = `${gid}:${String(fm.name ?? name.replace(/\.md$/, ''))}`
    queries.push(qHypothesis(hid, fm))
  }

  // Paths/seeds.json
  const seedsPath = join(DIR, 'paths', 'seeds.json')
  const seedsRaw = await readFile(seedsPath, 'utf8').catch(() => null)
  if (seedsRaw) {
    const seeds = JSON.parse(seedsRaw) as { paths?: { source: string; target: string; strength?: number }[] }
    for (const p of seeds.paths ?? []) {
      queries.push(qPathSeed(p.source, p.target, p.strength ?? 1.0))
    }
  }

  if (DRY) {
    const ms = (performance.now() - _t0).toFixed(1)
    console.log(`# sync-world dry-run — ${queries.length} queries in ${ms}ms (work only, excludes bun startup)`)
    for (const q of queries) console.log(q)
    return
  }

  let ok = 0
  let fail = 0
  for (const q of queries) {
    try {
      await write(q)
      ok++
    } catch (e) {
      fail++
      console.error('FAIL:', (e as Error).message.split('\n')[0])
    }
  }
  console.log(`sync-world: ${ok} ok, ${fail} fail, ${queries.length} total`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
