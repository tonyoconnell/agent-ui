/**
 * PLAN-PARSE — Read a `one/<slug>.md` plan file + sibling `<slug>-todo.md` into
 * structured PlanSpec + TaskRow[] ready for plan-sync.ts → TypeDB.
 *
 * Format is defined by one/template-plan.md (plan file) + one/template-todo.md
 * (dashboard view). This parser is deliberately forgiving — it extracts what it
 * needs and ignores the rest, so the markdown can keep evolving.
 */

import { readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { parse as parseYaml } from 'yaml'

export interface PlanSpec {
  slug: string
  title: string
  goal: string
  cycles: number
  status: string
  tags: string[] // primary + secondary route hints, deduped
  escape: { condition: string; action: string }
  downstream: { capability: string; price: number; scope: string }
  sourceOfTruth: string[]
  rubricWeights: { fit: number; form: number; truth: number; taste: number }
  cycleMeta: Array<{
    id: string
    number: number
    name: string
    exit?: string
    rubricOverride?: [number, number, number, number]
  }>
}

export interface TaskRow {
  tid: string // e.g. "chairman:1:r1"
  planSlug: string // e.g. "chairman"
  cycleNumber: number // e.g. 1
  cycleId: string // e.g. "chairman:1"
  wave: 'W1' | 'W2' | 'W3' | 'W4'
  name: string // first descriptive cell — File, Deliverable, or Shard
  file?: string // when the task references a file (W1/W3)
  tags: string[]
  effort?: number
  blocks: string[] // task IDs this task blocks
  dependsOn: string[] // task IDs this task depends on
  exit: string
}

/** Parse the frontmatter block between the first two `---` lines. */
function extractFrontmatter(md: string): { fm: Record<string, unknown>; body: string } {
  const match = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { fm: {}, body: md }
  try {
    const fm = parseYaml(match[1]) as Record<string, unknown>
    return { fm: fm ?? {}, body: match[2] }
  } catch {
    return { fm: {}, body: match[2] }
  }
}

/** Parse a plan markdown file (e.g. one/chairman.md). */
export async function parsePlanFile(path: string): Promise<PlanSpec> {
  const raw = await readFile(path, 'utf-8')
  const { fm, body } = extractFrontmatter(raw)

  const slug = String(fm.slug ?? basename(path, '.md'))
  const title = String(fm.title ?? slug)
  const goal = String(fm.goal ?? '')
  const cycles = Number(fm.cycles ?? 0)
  const planStatus = String(fm.status ?? 'PLAN')

  const routeHints = (fm.route_hints ?? {}) as { primary?: string[]; secondary?: string[] }
  const tags = Array.from(new Set([...(routeHints.primary ?? []), ...(routeHints.secondary ?? [])]))

  const escapeIn = (fm.escape ?? {}) as { condition?: string; action?: string }
  const escapeOut = { condition: String(escapeIn.condition ?? ''), action: String(escapeIn.action ?? '') }

  const downstreamIn = (fm.downstream ?? {}) as { capability?: string; price?: number; scope?: string }
  const downstream = {
    capability: String(downstreamIn.capability ?? ''),
    price: Number(downstreamIn.price ?? 0),
    scope: String(downstreamIn.scope ?? 'private'),
  }

  const sourceOfTruth = Array.isArray(fm.source_of_truth) ? (fm.source_of_truth as string[]) : []

  const rwIn = (fm.rubric_weights ?? {}) as Partial<Record<'fit' | 'form' | 'truth' | 'taste', number>>
  const rubricWeights = {
    fit: Number(rwIn.fit ?? 0.25),
    form: Number(rwIn.form ?? 0.25),
    truth: Number(rwIn.truth ?? 0.25),
    taste: Number(rwIn.taste ?? 0.25),
  }

  // Cycle headers: `### Cycle 1 — Live stream (A)` or `### Cycle N — {name}`
  const cycleMeta: PlanSpec['cycleMeta'] = []
  const lines = body.split('\n')
  const cycleHeaderRe = /^###\s+Cycle\s+(\d+)\s+—\s+(.+?)\s*$/
  const exitRe = /^\*\*Exit:\*\*\s+(.+?)\s*$/
  const rubricOverrideRe = /^\*\*Rubric override:\*\*\s+([\d.]+)\s*\/\s*([\d.]+)\s*\/\s*([\d.]+)\s*\/\s*([\d.]+)/

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(cycleHeaderRe)
    if (!m) continue
    const number = Number(m[1])
    const name = m[2].trim()
    const id = `${slug}:${number}`
    let exit: string | undefined
    let rubricOverride: [number, number, number, number] | undefined
    // Scan forward up to 40 lines or until next ### header for Exit + Rubric override lines.
    for (let j = i + 1; j < Math.min(i + 40, lines.length); j++) {
      if (/^###\s/.test(lines[j])) break
      const em = lines[j].match(exitRe)
      if (em && !exit) exit = em[1]
      const rm = lines[j].match(rubricOverrideRe)
      if (rm && !rubricOverride) rubricOverride = [Number(rm[1]), Number(rm[2]), Number(rm[3]), Number(rm[4])]
    }
    cycleMeta.push({ id, number, name, exit, rubricOverride })
  }

  return {
    slug,
    title,
    goal,
    cycles,
    status: planStatus,
    tags,
    escape: escapeOut,
    downstream,
    sourceOfTruth,
    rubricWeights,
    cycleMeta,
  }
}

/** Split a markdown table row into cell strings, trimming pipes and whitespace. */
function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((c) => c.trim())
}

/** Is this line a markdown table header separator (`|----|----|`)? */
function isSeparatorRow(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('---')
}

/**
 * Extract task IDs from a cell that may contain backticks, commas, and range
 * notation like `chairman:1:e1..e7` (inclusive, same role letter).
 */
function extractTaskIds(cell: string, slug: string): string[] {
  const out = new Set<string>()
  // Range: chairman:1:e1..e7 — expand inclusively, must share role letter.
  const rangeRe = new RegExp(`\\b(${slug}):(\\d+):([rdev])(\\d+)\\.\\.\\3(\\d+)\\b`, 'g')
  for (const m of cell.matchAll(rangeRe)) {
    const [, s, cyc, role, from, to] = m
    const lo = Number.parseInt(from, 10)
    const hi = Number.parseInt(to, 10)
    if (lo <= hi && hi - lo < 50) {
      for (let n = lo; n <= hi; n += 1) out.add(`${s}:${cyc}:${role}${n}`)
    }
  }
  // Single IDs — greedy match after ranges have been consumed.
  const singleRe = new RegExp(`\\b(${slug}:\\d+:[rdev]\\d+)(?!\\.\\.)`, 'g')
  for (const m of cell.matchAll(singleRe)) out.add(m[1])
  return Array.from(out)
}

/** Parse a todo markdown file (e.g. one/chairman-todo.md). */
export async function parseTodoFile(path: string, slug: string): Promise<TaskRow[]> {
  const raw = await readFile(path, 'utf-8')
  const lines = raw.split('\n')

  const rows: TaskRow[] = []
  let currentHeader: string[] | null = null
  let currentWave: TaskRow['wave'] | null = null

  // Header lines like "### W1 — Recon (Haiku × 5, parallel — spawn in one message)"
  const waveHeaderRe = /^###\s+(?:W(\d))\s+—/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track wave section (resets the table expectation)
    const wm = line.match(waveHeaderRe)
    if (wm) {
      const w = `W${wm[1]}`
      currentWave = (w === 'W1' || w === 'W2' || w === 'W3' || w === 'W4' ? w : null) as TaskRow['wave'] | null
      currentHeader = null
      continue
    }

    // Table header row: first cell is "ID" and next line is a separator
    if (line.includes('|') && /\|\s*ID\s*\|/i.test(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      currentHeader = splitRow(line).map((h) => h.toLowerCase())
      continue
    }

    // Data row: starts with `| [ ]` or `| [x]` and contains a backticked slug-prefixed task ID
    if (!currentHeader || !currentWave) continue
    if (!line.includes('[ ]') && !line.includes('[x]')) continue
    if (!new RegExp(`\`${slug}:\\d+:[rdev]\\d+\``).test(line)) continue

    const cells = splitRow(line)
    if (cells.length < 2) continue

    // First cell: extract the tid (strip checkbox + backticks).
    const firstCell = cells[0]
    const tidMatch = firstCell.match(new RegExp(`${slug}:(\\d+):[rdev]\\d+`))
    if (!tidMatch) continue
    const tid = (firstCell.match(new RegExp(`${slug}:\\d+:[rdev]\\d+`)) ?? [])[0]
    if (!tid) continue
    const cycleNumber = Number(tidMatch[1])
    const cycleId = `${slug}:${cycleNumber}`

    // Zip cells to header (offset 0 — headers include the ID column).
    const byCol = new Map<string, string>()
    for (let k = 0; k < Math.min(cells.length, currentHeader.length); k++) {
      byCol.set(currentHeader[k], cells[k])
    }

    const nameCandidate = byCol.get('file') ?? byCol.get('deliverable') ?? byCol.get('shard') ?? byCol.get('name') ?? ''
    // Strip backticks from file paths for clean name
    const name = nameCandidate.replace(/`/g, '').trim()
    const file = byCol.get('file')?.replace(/`/g, '').trim() || undefined

    const tagsRaw = byCol.get('tags') ?? ''
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !t.includes(' '))

    const effortRaw = byCol.get('effort') ?? ''
    const effortNum = Number.parseFloat(effortRaw)
    const effort = Number.isFinite(effortNum) ? effortNum : undefined

    const blocksRaw = byCol.get('blocks') ?? ''
    const dependsRaw = byCol.get('depends on') ?? ''
    const blocks = extractTaskIds(blocksRaw, slug)
    const dependsOn = extractTaskIds(dependsRaw, slug)

    const exit = (byCol.get('exit') ?? '').trim()

    rows.push({
      tid,
      planSlug: slug,
      cycleNumber,
      cycleId,
      wave: currentWave,
      name,
      file,
      tags,
      effort,
      blocks,
      dependsOn,
      exit,
    })
  }

  return rows
}

/** Convenience: parse both sides together given a plan-file path. */
export async function parsePlanAndTodo(planPath: string): Promise<{ spec: PlanSpec; tasks: TaskRow[] }> {
  const spec = await parsePlanFile(planPath)
  const todoPath = join(dirname(planPath), `${basename(planPath, '.md')}-todo.md`)
  // If the sibling -todo file is missing, return just the plan with zero tasks (still compilable).
  const tasks = await parseTodoFile(todoPath, spec.slug).catch(() => [])
  return { spec, tasks }
}
