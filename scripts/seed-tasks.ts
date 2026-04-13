#!/usr/bin/env node
/**
 * Seed tasks from docs/TODO.md into TypeDB
 *
 * Parses the inline TODO.md format:
 *   - [ ] **Task name** — critical=30 + C1=40 + ceo=25 + blocks(1)=5 [sonnet] `tag, tag`
 *     exit: What done looks like
 *     blocks: blocked-task-id, another-id
 *
 * Features:
 *   - Idempotent: skips existing task-ids (uses match-insert pattern)
 *   - Computes priority-score from inline formula annotations
 *   - Creates blocks relations between tasks
 *   - Creates matching skill + capability relation for routing
 *
 * Usage:
 *   bun run scripts/seed-tasks.ts [--dry-run] [--force]
 *
 *   --dry-run  Print queries without executing
 *   --force    Re-insert even if task already exists (delete first)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '../docs')
const todoFile = path.join(docsDir, 'TODO.md')

// Load .env manually (script runs outside Astro/Vite)
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}

const TYPEDB_URL = process.env.TYPEDB_URL || 'https://cloud.typedb.com'
const TYPEDB_DATABASE = process.env.TYPEDB_DATABASE || 'one'
const TYPEDB_USERNAME = process.env.TYPEDB_USERNAME || 'admin'
const TYPEDB_PASSWORD = process.env.TYPEDB_PASSWORD || ''

// ── Types ──────────────────────────────────────────────────────────────────────

type Value = 'critical' | 'high' | 'medium' | 'low'
type Phase = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7'
type Effort = 'low' | 'medium' | 'high'

interface Task {
  id: string
  name: string
  done: boolean
  value: Value
  effort: Effort
  phase: Phase
  persona: string
  blocksIds: string[] // IDs of tasks THIS task blocks
  exit: string
  tags: string[]
  priorityScore: number
  priorityFormula: string
  sourceFile: string
}

// ── Score Maps ─────────────────────────────────────────────────────────────────

const VALUE_SCORES: Record<Value, number> = { critical: 30, high: 25, medium: 20, low: 10 }
const PHASE_SCORES: Record<Phase, number> = { C1: 40, C2: 35, C3: 30, C4: 25, C5: 20, C6: 15, C7: 10 }
const PERSONA_SCORES: Record<string, number> = {
  ceo: 25,
  dev: 20,
  investor: 15,
  gamer: 15,
  kid: 10,
  freelancer: 10,
  agent: 5,
}
const EFFORT_MAP: Record<string, Effort> = { haiku: 'low', sonnet: 'medium', opus: 'high' }

// ── Slugify ────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

// ── Parser ─────────────────────────────────────────────────────────────────────
//
// TODO.md uses a compact inline format:
//   - [ ] **Name here** — critical=30 + C1=40 + ceo=25 + blocks(1)=5 [sonnet] `tag, tag`
//     exit: What done looks like
//     blocks: task-id, another-id
//
// Phase comes from the section heading (## C1: Foundation) for tasks without inline phase.

function parseTodoMd(content: string): Task[] {
  const lines = content.split('\n')
  const tasks: Task[] = []

  let currentPhase: Phase = 'C4' // default if no heading found
  let current: (Partial<Task> & { blocksIds?: string[] }) | null = null

  const flush = () => {
    if (!current?.name) return
    tasks.push({
      id: current.id || slugify(current.name),
      name: current.name,
      done: current.done ?? false,
      value: current.value ?? 'medium',
      effort: current.effort ?? 'medium',
      phase: current.phase ?? currentPhase,
      persona: current.persona ?? 'agent',
      blocksIds: current.blocksIds ?? [],
      exit: current.exit ?? '',
      tags: current.tags ?? [],
      priorityScore: current.priorityScore ?? 0,
      priorityFormula: current.priorityFormula ?? '',
      sourceFile: 'TODO',
    })
    current = null
  }

  // Pattern for the inline task line:
  //   - [ ] **Name** — value=N + phase=N + persona=N [model] `tags`
  //   - [x] **Name** — ...
  const TASK_LINE = /^- \[([ x])\] \*\*(.+?)\*\*/

  for (const line of lines) {
    const trimmed = line.trim()

    // Section heading → detect phase
    const headingMatch = trimmed.match(/^##\s+(C[1-7])/)
    if (headingMatch) {
      flush()
      currentPhase = headingMatch[1] as Phase
      continue
    }

    // Done section — stop parsing open tasks
    if (trimmed === '## Done') {
      flush()
      break
    }

    // Task line
    const taskMatch = line.match(TASK_LINE)
    if (taskMatch) {
      flush()

      const isDone = taskMatch[1] === 'x'
      const rawName = taskMatch[2].trim()

      // Parse the rest of the line after **Name**
      // Format: **Name** — formula [model] `tags`
      const nameInLine = `**${rawName}**`
      const afterName = line.slice(line.indexOf(nameInLine) + nameInLine.length).trim()

      let value: Value = 'medium'
      let effort: Effort = 'medium'
      let tags: string[] = []
      let priorityScore = 0
      let priorityFormula = ''
      let persona = 'agent'
      let phaseForTask = currentPhase

      if (afterName.startsWith('—') || afterName.startsWith('\u2014')) {
        // Strip em-dash, then parse: "formula [model] `tags`"
        const withoutDash = afterName.replace(/^[—\u2014]\s*/, '')

        // Extract backtick tags (last part)
        const backtickMatch = withoutDash.match(/`([^`]+)`/)
        tags = backtickMatch
          ? backtickMatch[1]
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : []

        // Extract model in brackets e.g. [sonnet]
        const modelMatch = withoutDash.match(/\[(\w+)\]/)
        effort = modelMatch ? (EFFORT_MAP[modelMatch[1].toLowerCase()] ?? 'medium') : 'medium'

        // Formula is everything before [ or `
        const formulaStr = withoutDash
          .replace(/\[.*?\]/g, '')
          .replace(/`.*?`/g, '')
          .trim()

        // Extract value
        const valueMatch = formulaStr.match(/\b(critical|high|medium|low)=(\d+)/)
        if (valueMatch) value = valueMatch[1] as Value

        // Extract phase (may differ from section heading for some tasks)
        const phaseMatch = formulaStr.match(/\b(C[1-7])=(\d+)/)
        if (phaseMatch) phaseForTask = phaseMatch[1] as Phase

        // Extract persona
        const personaMatch = formulaStr.match(/\b(ceo|dev|investor|gamer|kid|freelancer|agent)=(\d+)/)
        persona = personaMatch ? personaMatch[1] : 'agent'

        // Extract blocking count
        const blocksCountMatch = formulaStr.match(/blocks\((\d+)\)/)
        const blockingCount = blocksCountMatch ? parseInt(blocksCountMatch[1], 10) : 0

        // Compute priority
        const v = VALUE_SCORES[value] ?? 20
        const p = PHASE_SCORES[phaseForTask] ?? 25
        const per = PERSONA_SCORES[persona] ?? 5
        const b = Math.min(blockingCount * 5, 20)
        priorityScore = v + p + per + b

        const parts = [`${value}=${v}`, `${phaseForTask}=${p}`, `${persona}=${per}`]
        if (b > 0) parts.push(`blocks(${blockingCount})=${b}`)
        priorityFormula = parts.join(' + ')
      } else {
        // No formula — compute from defaults
        const v = VALUE_SCORES.medium
        const p = PHASE_SCORES[currentPhase]
        const per = PERSONA_SCORES.agent
        priorityScore = v + p + per
        priorityFormula = `medium=${v} + ${currentPhase}=${p} + agent=${per}`
        phaseForTask = currentPhase
      }

      current = {
        name: rawName,
        done: isDone,
        value,
        effort,
        phase: phaseForTask,
        persona,
        blocksIds: [],
        exit: '',
        tags,
        priorityScore,
        priorityFormula,
      }

      continue
    }

    // Metadata lines (indented, follow task)
    if (current) {
      const exitMatch = trimmed.match(/^exit:\s*(.+)$/)
      if (exitMatch) {
        current.exit = exitMatch[1].trim()
        continue
      }

      const blocksMatch = trimmed.match(/^blocks:\s*(.+)$/)
      if (blocksMatch) {
        current.blocksIds = blocksMatch[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
    }
  }

  flush()

  // Only return open tasks (not done)
  return tasks.filter((t) => !t.done)
}

// ── Escape ─────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')
}

// ── Query builders ─────────────────────────────────────────────────────────────

function taskInsertQuery(t: Task): string {
  const tagParts = t.tags.map((tag) => `has tag "${esc(tag)}"`).join(', ')
  const tagClause = tagParts ? `, ${tagParts}` : ''
  const exitClause = t.exit ? `, has exit-condition "${esc(t.exit)}"` : ''
  const now = new Date().toISOString().replace('Z', '')

  return `
    insert $t isa task,
      has task-id "${esc(t.id)}",
      has name "${esc(t.name)}",
      has task-status "open",
      has task-value "${t.value}",
      has task-effort "${t.effort}",
      has task-phase "${t.phase}",
      has task-persona "${esc(t.persona)}",
      has priority-score ${t.priorityScore.toFixed(1)},
      has priority-formula "${esc(t.priorityFormula)}",
      has source-file "${esc(t.sourceFile)}",
      has done false${exitClause}${tagClause},
      has created ${now};
  `.trim()
}

function skillInsertQuery(t: Task): string {
  const tagParts = t.tags.map((tag) => `has tag "${esc(tag)}"`).join(', ')
  const tagClause = tagParts ? `, ${tagParts}` : ''
  return `
    insert $s isa skill,
      has skill-id "${esc(t.id)}",
      has name "${esc(t.name)}",
      has price 0,
      has currency "SUI"${tagClause};
  `.trim()
}

function capabilityInsertQuery(t: Task, unitId: string): string {
  return `
    match
      $u isa unit, has uid "${esc(unitId)}";
      $s isa skill, has skill-id "${esc(t.id)}";
    insert (provider: $u, offered: $s) isa capability, has price 0;
  `.trim()
}

function blocksInsertQuery(blockerId: string, blockedId: string): string {
  return `
    match
      $a isa task, has task-id "${esc(blockerId)}";
      $b isa task, has task-id "${esc(blockedId)}";
    insert (blocker: $a, blocked: $b) isa blocks;
  `.trim()
}

// ── TypeDB connection ──────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${TYPEDB_URL}/v1/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TYPEDB_USERNAME, password: TYPEDB_PASSWORD }),
  })

  if (!res.ok) {
    throw new Error(`TypeDB signin failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as { token: string }
  return data.token
}

async function executeQuery(token: string, tql: string, txType: 'read' | 'write' = 'write'): Promise<unknown> {
  const res = await fetch(`${TYPEDB_URL}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      databaseName: TYPEDB_DATABASE,
      transactionType: txType,
      query: tql,
      commit: txType === 'write',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Query failed: ${res.status} - ${text}`)
  }

  return res.json()
}

// ── Check existing tasks ───────────────────────────────────────────────────────

async function getExistingTaskIds(token: string): Promise<Set<string>> {
  try {
    const result = (await executeQuery(token, 'match $t isa task, has task-id $id; select $id;', 'read')) as {
      answers?: Array<{ data?: { id?: { value?: string } } }>
    }

    const ids = new Set<string>()
    for (const ans of result.answers ?? []) {
      const val = ans.data?.id?.value
      if (val) ids.add(val)
    }
    return ids
  } catch {
    return new Set<string>()
  }
}

async function getExistingSkillIds(token: string): Promise<Set<string>> {
  try {
    const result = (await executeQuery(token, 'match $s isa skill, has skill-id $id; select $id;', 'read')) as {
      answers?: Array<{ data?: { id?: { value?: string } } }>
    }

    const ids = new Set<string>()
    for (const ans of result.answers ?? []) {
      const val = ans.data?.id?.value
      if (val) ids.add(val)
    }
    return ids
  } catch {
    return new Set<string>()
  }
}

// ── Resolve unit for routing ───────────────────────────────────────────────────
// Tasks route to a unit based on phase/persona/tags. Simple mapping:
//   C1-C2 foundation/build → builder
//   C1 ceo → ceo
//   C3+ commerce/investor → finance
//   marketing → marketing:director (if exists, else builder)
//   agent → builder (fallback)

function resolveUnit(t: Task): string {
  const tags = t.tags.map((s) => s.toLowerCase())
  if (tags.includes('marketing')) return 'marketing:director'
  if (t.persona === 'ceo') return 'builder' // ceo tasks go to builder in dev
  if (t.persona === 'investor') return 'builder'
  if (tags.includes('typedb') || tags.includes('schema')) return 'builder'
  return 'builder'
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const force = process.argv.includes('--force')

  console.log(`Reading ${todoFile}`)
  const content = fs.readFileSync(todoFile, 'utf-8')
  const tasks = parseTodoMd(content)

  console.log(`Parsed ${tasks.length} open tasks from TODO.md\n`)

  if (tasks.length === 0) {
    console.log('No tasks found — check TODO.md format')
    return
  }

  // Print summary
  const byPhase: Record<string, number> = {}
  for (const t of tasks) {
    byPhase[t.phase] = (byPhase[t.phase] || 0) + 1
  }
  for (const [phase, count] of Object.entries(byPhase).sort()) {
    console.log(`  ${phase}: ${count} tasks`)
  }
  console.log()

  if (dryRun) {
    console.log('DRY RUN — sample task:')
    const sample = tasks[0]
    console.log(`  id: ${sample.id}`)
    console.log(`  name: ${sample.name}`)
    console.log(`  phase: ${sample.phase}, value: ${sample.value}, persona: ${sample.persona}`)
    console.log(`  priority: ${sample.priorityScore} (${sample.priorityFormula})`)
    console.log(`  tags: ${sample.tags.join(', ')}`)
    console.log(`  exit: ${sample.exit}`)
    console.log(`  blocks: ${sample.blocksIds.join(', ')}`)
    console.log()
    console.log(`Would generate:`)
    console.log(`  ${tasks.length} task inserts`)
    const totalBlocks = tasks.reduce((sum, t) => sum + t.blocksIds.length, 0)
    console.log(`  ${totalBlocks} blocks relations`)
    console.log(`  ${tasks.length} skill inserts`)
    console.log(`  ${tasks.length} capability relations`)
    console.log()
    console.log('Sample TQL:')
    console.log(taskInsertQuery(tasks[0]))
    return
  }

  console.log('Authenticating to TypeDB...')
  let token: string
  try {
    token = await getAuthToken()
  } catch (e) {
    console.error('Auth failed:', (e as Error).message)
    process.exit(1)
  }
  console.log('Authenticated\n')

  // Load existing IDs for idempotency
  console.log('Checking existing tasks...')
  const existingTasks = await getExistingTaskIds(token)
  const existingSkills = await getExistingSkillIds(token)
  console.log(`  ${existingTasks.size} tasks already in TypeDB`)
  console.log(`  ${existingSkills.size} skills already in TypeDB\n`)

  let taskInserted = 0
  let taskSkipped = 0
  let skillInserted = 0
  let skillSkipped = 0
  let blocksInserted = 0
  let failed = 0

  // 1. Insert tasks (idempotent: skip existing unless --force)
  console.log('Seeding tasks...')
  for (const t of tasks) {
    if (!force && existingTasks.has(t.id)) {
      taskSkipped++
      continue
    }

    try {
      await executeQuery(token, taskInsertQuery(t))
      taskInserted++
      if ((taskInserted + taskSkipped) % 10 === 0) {
        process.stdout.write(`  ${taskInserted + taskSkipped}/${tasks.length}\r`)
      }
    } catch (e) {
      failed++
      const msg = (e as Error).message
      // Duplicate key errors are expected when re-running
      if (msg.includes('already') || msg.includes('duplicate') || msg.includes('constraint')) {
        taskSkipped++
      } else {
        console.error(`  Failed to insert task "${t.id}": ${msg}`)
      }
    }
  }
  console.log(`  Tasks: ${taskInserted} inserted, ${taskSkipped} skipped\n`)

  // 2. Insert skills (share same ID as task — for capability routing)
  console.log('Seeding skills...')
  for (const t of tasks) {
    if (!force && existingSkills.has(t.id)) {
      skillSkipped++
      continue
    }

    try {
      await executeQuery(token, skillInsertQuery(t))
      skillInserted++
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes('already') || msg.includes('duplicate') || msg.includes('constraint')) {
        skillSkipped++
      } else {
        failed++
        console.error(`  Failed to insert skill "${t.id}": ${msg}`)
      }
    }
  }
  console.log(`  Skills: ${skillInserted} inserted, ${skillSkipped} skipped\n`)

  // 3. Wire capabilities (unit → skill)
  console.log('Wiring capabilities...')
  let capInserted = 0
  for (const t of tasks) {
    const unitId = resolveUnit(t)
    try {
      await executeQuery(token, capabilityInsertQuery(t, unitId))
      capInserted++
    } catch {
      // Capability may already exist or unit may not exist — both fine
    }
  }
  console.log(`  Capabilities: ${capInserted} wired (skipped silently on conflict)\n`)

  // 4. Insert blocks relations
  console.log('Seeding blocks relations...')
  const taskIds = new Set(tasks.map((t) => t.id))
  for (const t of tasks) {
    for (const blockedId of t.blocksIds) {
      // Only insert if both ends exist in our task set
      if (!taskIds.has(blockedId)) continue
      try {
        await executeQuery(token, blocksInsertQuery(t.id, blockedId))
        blocksInserted++
      } catch {
        // Relation may already exist
      }
    }
  }
  console.log(`  Blocks relations: ${blocksInserted} inserted\n`)

  console.log('Done!')
  console.log(`  ${taskInserted} tasks inserted`)
  console.log(`  ${taskSkipped} tasks skipped (already existed)`)
  console.log(`  ${skillInserted} skills inserted`)
  console.log(`  ${skillSkipped} skills skipped`)
  console.log(`  ${capInserted} capabilities wired`)
  console.log(`  ${blocksInserted} blocks relations created`)
  if (failed > 0) console.log(`  ${failed} failures`)
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
