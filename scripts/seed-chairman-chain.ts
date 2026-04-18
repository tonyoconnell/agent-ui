#!/usr/bin/env bun

/**
 * seed-chairman-chain — Bootstrap the chairman → ceo → director → specialists
 * pheromone graph in TypeDB (idempotent).
 *
 * After this runs, `follow(tag)` returns real paths and routing works without
 * any LLM call. This is the L1 substrate seed that every world boots against.
 *
 * Usage:
 *   bun run scripts/seed-chairman-chain.ts                 # seed with default chairman uid
 *   bun run scripts/seed-chairman-chain.ts --dry-run       # print plan, no writes
 *   bun run scripts/seed-chairman-chain.ts --chairman tony # custom chairman uid
 *   bun run scripts/seed-chairman-chain.ts --reset --confirm # fade all seeded edges
 *
 * Env:
 *   CHAIRMAN_UID   — override chairman uid (default: "chairman", flag wins)
 *   TYPEDB_URL / TYPEDB_PASSWORD — must reach the cluster
 *
 * Idempotency:
 *   - Reads existing pheromone via `match … select $s;` and skips marks when
 *     strength is already ≥ desired.
 *   - Unit inserts use `match … not { … }; insert …;` pattern where possible;
 *     otherwise the insert error is swallowed (unit exists).
 *   - Re-runs show `+0 new actors, +0 new edges`.
 */

import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')

// ── Args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const RESET = args.includes('--reset')
const CONFIRMED = args.includes('--confirm')
const chairmanFlagIdx = args.indexOf('--chairman')
const CHAIRMAN_UID =
  chairmanFlagIdx >= 0 && args[chairmanFlagIdx + 1] ? args[chairmanFlagIdx + 1] : process.env.CHAIRMAN_UID || 'chairman'

if (RESET && !CONFIRMED) {
  console.error('--reset is destructive and requires --confirm')
  process.exit(1)
}

// ── Env ────────────────────────────────────────────────────────────────────
const envPath = join(REPO, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}
const { TYPEDB_URL, TYPEDB_DATABASE = 'one', TYPEDB_USERNAME = 'admin', TYPEDB_PASSWORD } = process.env

// ── TypeDB client (direct, bypasses gateway 8s cap) ────────────────────────
let token = ''
async function signin() {
  if (DRY_RUN) return
  if (!TYPEDB_URL || !TYPEDB_PASSWORD) {
    console.error('TYPEDB_URL or TYPEDB_PASSWORD missing — see .env or /typedb skill')
    process.exit(1)
  }
  try {
    const res = await fetch(`${TYPEDB_URL}/v1/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: TYPEDB_USERNAME, password: TYPEDB_PASSWORD }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`signin ${res.status}: ${await res.text()}`)
    token = ((await res.json()) as { token: string }).token
  } catch (e) {
    console.error('TypeDB signin failed:', e instanceof Error ? e.message : e)
    console.error('See /typedb skill for connection troubleshooting.')
    process.exit(1)
  }
}

async function q(tql: string, txType: 'read' | 'write' = 'read'): Promise<unknown[]> {
  if (DRY_RUN) return []
  const res = await fetch(`${TYPEDB_URL}/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      databaseName: TYPEDB_DATABASE,
      transactionType: txType,
      query: tql,
      commit: txType === 'write',
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`${txType} ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { answers?: unknown[] }
  return data.answers || []
}
const qSilent = (tql: string, txType: 'read' | 'write' = 'write') => q(tql, txType).catch(() => [])
const parse = (a: unknown[]) =>
  (a as Array<{ data?: Record<string, { value?: unknown }> }>).map((x) => {
    const r: Record<string, unknown> = {}
    if (!x?.data) return r
    for (const [k, c] of Object.entries(x.data)) if (c?.value !== undefined) r[k] = c.value
    return r
  })
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

// ── Frontmatter parser (minimal — just name, group, tags, skills) ──────────
type AgentMeta = {
  file: string
  name: string
  group: string
  tags: string[]
  skills: { name: string; tags: string[] }[]
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return null
  const obj: Record<string, unknown> = {}
  const lines = m[1].split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const keyMatch = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/)
    if (!keyMatch) {
      i++
      continue
    }
    const [, key, rest] = keyMatch
    const trimmed = rest.trim()
    if (trimmed === '') {
      // block-list or block-map — collect indented lines
      const block: string[] = []
      i++
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].startsWith('\t') || lines[i].trim() === '')) {
        block.push(lines[i])
        i++
      }
      obj[key] = block.join('\n')
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      obj[key] = trimmed
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
      i++
    } else {
      obj[key] = trimmed.replace(/^['"]|['"]$/g, '')
      i++
    }
  }
  return obj
}

function extractTagsFromBlock(block: string): string[] {
  // matches `tags: [a, b, c]` inline inside a block of skills
  const out: string[] = []
  const re = /tags:\s*\[([^\]]*)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block)) !== null) {
    for (const t of m[1].split(',')) {
      const v = t.trim().replace(/^['"]|['"]$/g, '')
      if (v) out.push(v)
    }
  }
  return out
}

function extractSkills(block: string): { name: string; tags: string[] }[] {
  // skills are a YAML list:  - name: <x>\n    tags: [..]\n
  const skills: { name: string; tags: string[] }[] = []
  const re = /-\s*name:\s*(\S+)([\s\S]*?)(?=\n\s*-\s*name:|\n[^\s-]|$)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block)) !== null) {
    const name = m[1].replace(/^['"]|['"]$/g, '')
    const tagsLine = m[2].match(/tags:\s*\[([^\]]*)\]/)
    const tags = tagsLine
      ? tagsLine[1]
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      : []
    skills.push({ name, tags })
  }
  return skills
}

async function readAgentMeta(file: string): Promise<AgentMeta | null> {
  try {
    const content = await readFile(file, 'utf-8')
    const fm = parseFrontmatter(content)
    if (!fm?.name) return null
    const name = String(fm.name)
    const group = fm.group ? String(fm.group) : ''
    const tagsRaw = fm.tags
    const tags = Array.isArray(tagsRaw)
      ? (tagsRaw as string[])
      : typeof tagsRaw === 'string'
        ? extractTagsFromBlock(tagsRaw)
        : []
    const skillsBlock = typeof fm.skills === 'string' ? (fm.skills as string) : ''
    const skills = skillsBlock ? extractSkills(skillsBlock) : []
    return { file, name, group, tags, skills }
  } catch {
    return null
  }
}

async function listAgents(dir: string): Promise<AgentMeta[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir)
  const out: AgentMeta[] = []
  for (const e of entries) {
    if (!e.endsWith('.md')) continue
    if (e.toLowerCase() === 'readme.md') continue
    const meta = await readAgentMeta(join(dir, e))
    if (meta) out.push(meta)
    else console.warn(`  skip (malformed): ${e}`)
  }
  return out
}

// ── Substrate helpers ──────────────────────────────────────────────────────
const HIRE_TAG = 'hire'
const STRENGTH_CHAIRMAN_CEO = 1.0
const STRENGTH_CEO_DIRECTOR = 0.8
const STRENGTH_DIRECTOR_SPECIALIST = 0.5

// Option A — uid flattening. The runtime routes on the pheromone graph key
// `from→to`. world.ts splits `receiver` on the FIRST `:` to derive
// unitId+taskName, so a colon-carrying uid like `marketing:cmo` would be
// misrouted. Flatten at the seed layer: unit uid becomes `marketing-cmo`,
// and we tag the unit with `alias:marketing:cmo` so the original is
// recoverable for correlation with agent markdown frontmatter.
//
// Decision: `agents/marketing/analyst.md` declares `name: marketing-analyst`
// which — combined with group `marketing` — would naively produce
// `marketing:marketing-analyst` → `marketing-marketing-analyst`. Collapse the
// redundant namespace: if `name` already starts with `<group>-` or `<group>:`
// we treat the name as the full uid.
const flatten = (uid: string) => uid.replace(/:/g, '-')
const composeUid = (group: string, name: string): string => {
  const g = group || 'marketing'
  if (name === g || name.startsWith(`${g}-`) || name.startsWith(`${g}:`)) return flatten(name)
  return flatten(`${g}:${name}`)
}
const aliasTag = (origUid: string) => `alias:${origUid}`

/** Ensure unit exists; returns true if newly created. */
async function ensureUnit(uid: string, kind: string, tags: string[]): Promise<boolean> {
  if (DRY_RUN) {
    console.log(`  [plan] unit ${uid} kind=${kind} tags=[${tags.join(',')}]`)
    return true
  }
  // Check first
  const existing = parse(await q(`match $u isa unit, has uid "${esc(uid)}"; select $u;`).catch(() => []))
  if (existing.length > 0) return false

  const tagClauses = tags.map((t) => `has tag "${esc(t)}"`).join(', ')
  const tagSuffix = tagClauses ? `, ${tagClauses}` : ''
  await qSilent(
    `insert $u isa unit,
       has uid "${esc(uid)}",
       has name "${esc(uid)}",
       has unit-kind "${esc(kind)}",
       has status "active",
       has success-rate 0.5,
       has activity-score 0.0,
       has sample-count 0,
       has reputation 0.0,
       has balance 0.0,
       has generation 0${tagSuffix};`,
  )
  return true
}

/** Read current edge strength from TypeDB (0 if no path). */
async function readStrength(from: string, to: string): Promise<number> {
  if (DRY_RUN) return 0
  const rows = parse(
    await q(
      `match $from isa unit, has uid "${esc(from)}"; $to isa unit, has uid "${esc(to)}";
       (source: $from, target: $to) isa path, has strength $s; select $s;`,
    ).catch(() => []),
  )
  return rows.length > 0 ? Number(rows[0].s) : 0
}

/** Idempotent mark: only writes if current strength < desired. Returns true if new edge mark emitted. */
async function markOnce(from: string, to: string, strength: number, tag: string): Promise<boolean> {
  const current = await readStrength(from, to)
  if (current >= strength) {
    if (DRY_RUN) console.log(`  [plan] skip ${from}→${to} (already @${current} ≥ ${strength})`)
    return false
  }
  if (DRY_RUN) {
    console.log(`  [plan] mark ${from}→${to} strength=${strength} tag=${tag}`)
    return true
  }
  // Update-in-place if path exists, else insert fresh
  try {
    await q(
      `match $from isa unit, has uid "${esc(from)}"; $to isa unit, has uid "${esc(to)}";
       $edge (source: $from, target: $to) isa path, has strength $s;
       delete $s of $edge;
       insert $edge has strength ${strength.toFixed(2)};`,
      'write',
    )
  } catch {
    await qSilent(
      `match $from isa unit, has uid "${esc(from)}"; $to isa unit, has uid "${esc(to)}";
       insert (source: $from, target: $to) isa path,
         has strength ${strength.toFixed(2)}, has resistance 0.0,
         has traversals 0, has revenue 0.0;`,
    )
  }
  // Best-effort tag on the path (ignore if schema rejects)
  await qSilent(
    `match $from isa unit, has uid "${esc(from)}"; $to isa unit, has uid "${esc(to)}";
     $edge (source: $from, target: $to) isa path;
     insert $edge has tag "${esc(tag)}";`,
  )
  return true
}

/** Fade an edge toward zero (destructive — --reset). */
async function fadeEdge(from: string, to: string): Promise<boolean> {
  if (DRY_RUN) {
    console.log(`  [plan] fade ${from}→${to} to 0`)
    return true
  }
  const current = await readStrength(from, to)
  if (current <= 0) return false
  try {
    await q(
      `match $from isa unit, has uid "${esc(from)}"; $to isa unit, has uid "${esc(to)}";
       $edge (source: $from, target: $to) isa path, has strength $s;
       delete $s of $edge;
       insert $edge has strength 0.0;`,
      'write',
    )
    return true
  } catch {
    return false
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
const t0 = Date.now()
console.log(`seed-chairman-chain  chairman=${CHAIRMAN_UID}  dry-run=${DRY_RUN}  reset=${RESET}`)

await signin()

// 1. Enumerate markdown agents
const donalAgents = await listAgents(join(REPO, 'agents', 'donal'))
const marketingAgents = await listAgents(join(REPO, 'agents', 'marketing'))
const allAgents = [...donalAgents, ...marketingAgents]

if (allAgents.length === 0) {
  console.log('nothing to hire — agents/donal/ and agents/marketing/ both empty or missing')
  process.exit(0)
}

// 2. Pick director — prefer cmo if present, else marketing-director
const cmo = donalAgents.find((a) => a.name === 'cmo')
const marketingDirector = marketingAgents.find((a) => a.name === 'marketing-director')
const director = cmo ?? marketingDirector ?? null
if (!director) {
  console.error('no director found — need agents/donal/cmo.md or agents/marketing/director.md')
  process.exit(1)
}
const directorGroup = director.group || 'marketing'
const directorUid = composeUid(directorGroup, director.name)
const directorOrigUid = directorUid.includes(':') ? directorUid : `${directorGroup}:${director.name}`

// 3. Specialists = all donal agents (excluding cmo) + all marketing agents (excluding marketing-director)
const specialists: AgentMeta[] = [
  ...donalAgents.filter((a) => a.name !== 'cmo'),
  ...marketingAgents.filter((a) => a.name !== 'marketing-director'),
]

console.log(
  `discovered: ${allAgents.length} agents  |  director: ${directorUid}  |  specialists: ${specialists.length}`,
)

let newActors = 0
let newEdges = 0

// ── Reset path ─────────────────────────────────────────────────────────────
if (RESET) {
  console.log('\n--reset: fading seeded edges to 0')
  const allEdges: [string, string][] = [[CHAIRMAN_UID, 'ceo']]
  allEdges.push(['ceo', directorUid])
  for (const s of specialists) {
    const uid = composeUid(s.group || 'marketing', s.name)
    allEdges.push([directorUid, uid])
  }
  let faded = 0
  for (const [f, t] of allEdges) if (await fadeEdge(f, t)) faded++
  console.log(`  faded ${faded}/${allEdges.length} edges`)
  console.log(`\ndone in ${Date.now() - t0}ms`)
  process.exit(0)
}

// 4. Ensure chairman
if (await ensureUnit(CHAIRMAN_UID, 'human', ['role:chairman', 'governance'])) newActors++
console.log(`  chairman ${CHAIRMAN_UID}: ${newActors > 0 ? 'created' : 'exists'}`)

// 5. Ensure ceo
const ceoBefore = newActors
if (await ensureUnit('ceo', 'agent', ['role:ceo', 'governance'])) newActors++
console.log(`  ceo: ${newActors > ceoBefore ? 'created' : 'exists'}`)

// 6. chairman → ceo
if (await markOnce(CHAIRMAN_UID, 'ceo', STRENGTH_CHAIRMAN_CEO, HIRE_TAG)) newEdges++

// 7. Ensure director (unit already exists from syncWorld — ensure tags)
const beforeDirector = newActors
if (await ensureUnit(directorUid, 'agent', ['role:director', aliasTag(directorOrigUid)])) newActors++
console.log(
  `  director ${directorUid} (alias ${directorOrigUid}): ${newActors > beforeDirector ? 'created' : 'exists'}`,
)

// 8. ceo → director
if (await markOnce('ceo', directorUid, STRENGTH_CEO_DIRECTOR, 'marketing')) newEdges++

// 9. Specialists
let createdSpecialists = 0
const specialistSummaries: string[] = []
for (const spec of specialists) {
  const group = spec.group || 'marketing'
  const uid = composeUid(group, spec.name)
  const origUid = `${group}:${spec.name}`
  const created = await ensureUnit(uid, 'agent', ['role:specialist', aliasTag(origUid)])
  if (created) {
    newActors++
    createdSpecialists++
  }
  // Collect every tag we want to seed on this director→specialist edge: the
  // primary frontmatter tag plus every skill tag. Dedupe per edge so the log
  // doesn't repeat `tag=seo` four times for one specialist (idempotency
  // already guards the DB write, but audit noise hurts).
  const primaryTag = spec.tags[0] || 'marketing'
  const edgeTags = new Set<string>([primaryTag])
  for (const skill of spec.skills) edgeTags.add(skill.tags[0] || skill.name)

  let firstTagMarked = false
  for (const tag of edgeTags) {
    if (await markOnce(directorUid, uid, STRENGTH_DIRECTOR_SPECIALIST, tag)) {
      if (!firstTagMarked) {
        newEdges++
        firstTagMarked = true
      }
    }
  }
  specialistSummaries.push(`${uid} (alias ${origUid}) [${[...edgeTags].join(',')}]`)
}

// ── Summary ────────────────────────────────────────────────────────────────
const elapsed = Date.now() - t0
console.log('\n── summary ──')
console.log(`  Chairman           : ${CHAIRMAN_UID}`)
console.log(`  CEO                : ceo`)
console.log(`  Directors hired    : 1 (${directorUid})`)
console.log(`  Specialists hired  : ${specialists.length} (new: ${createdSpecialists})`)
const totalTargetEdges = 2 + specialists.length // chairman→ceo + ceo→director + director→each specialist
console.log(`  Edges marked       : ${newEdges} / ${totalTargetEdges} target`)
console.log(`  Delta              : +${newActors} new actors, +${newEdges} new edges`)
console.log(`  Total elapsed      : ${elapsed}ms`)
console.log('\nspecialists:')
for (const line of specialistSummaries.slice(0, 20)) console.log(`  - ${line}`)
if (specialistSummaries.length > 20) console.log(`  ... (+${specialistSummaries.length - 20} more)`)

if (DRY_RUN) console.log('\n(dry-run — no writes performed)')
