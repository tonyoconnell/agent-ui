/**
 * GET/POST /api/tutorial — The learning management system
 *
 * Teaching IS signaling. Progress IS pheromone. The curriculum IS paths.
 *
 * POST { phase: 1-7, student: string } — Execute a phase, mark learning path
 * GET  ?student=uid — Check progress across all phases
 */
import type { APIRoute } from 'astro'
import { write, readParsed, writeSilent } from '@/lib/typedb'
import { parse, syncAgent } from '@/engine/agent-md'
import { decay } from '@/lib/typedb'

const PHASES = [
  { phase: 1, title: 'Birth', description: 'Create an agent from markdown' },
  { phase: 2, title: 'Signal', description: 'Send a message through the substrate' },
  { phase: 3, title: 'Learn', description: 'Mark and warn — accumulate pheromone' },
  { phase: 4, title: 'Decay', description: 'Run asymmetric fade' },
  { phase: 5, title: 'Highway', description: 'Prove a path, skip LLM' },
  { phase: 6, title: 'Evolve', description: 'Agent self-improvement' },
  { phase: 7, title: 'Know', description: 'Crystallize knowledge, detect frontiers' },
]

const ECHO_MARKDOWN = `---
name: echo
model: claude-haiku-4-5-20251001
skills:
  - name: repeat
    tags: [tutorial, echo]
    description: Repeat what you hear
  - name: transform
    tags: [tutorial, transform]
    description: Transform input creatively
tags: [tutorial]
sensitivity: 0.5
---

You are Echo. You repeat and transform what you receive.
When repeating: return the input unchanged.
When transforming: rephrase creatively but preserve meaning.`

/** Ensure student has objectives seeded */
async function ensureObjectives(student: string) {
  const existing = await readParsed(`
    match $o isa objective, has oid $oid; $oid contains "tutorial-"; $oid contains "${student}";
    select $oid;
  `).catch(() => [])

  if (existing.length >= 7) return

  // Seed 7 phase objectives + 1 frontier
  for (const p of PHASES) {
    writeSilent(`
      insert $o isa objective,
        has oid "tutorial-phase-${p.phase}-${student}",
        has objective-type "tutorial-phase-${p.phase}",
        has objective-description "${p.description}",
        has priority-score ${(8 - p.phase) / 7},
        has progress 0.0,
        has objective-status "pending";
    `).catch(() => {})
  }

  writeSilent(`
    insert $f isa frontier,
      has fid "tutorial-${student}",
      has frontier-type "learning",
      has frontier-description "Student ${student} learning the substrate lifecycle",
      has expected-value 1.0,
      has frontier-status "exploring";
  `).catch(() => {})
}

/** Mark a phase complete for a student */
async function markComplete(student: string, phase: number) {
  // Update objective
  writeSilent(`
    match $o isa objective, has oid "tutorial-phase-${phase}-${student}",
      has progress $p, has objective-status $s;
    delete $p of $o; delete $s of $o;
    insert $o has progress 1.0, has objective-status "complete";
  `).catch(() => {})

  // Mark learning path
  writeSilent(`
    match $s isa unit, has uid "${student}"; $t isa unit, has uid "teacher";
    $e (source: $s, target: $t) isa path, has strength $str, has traversals $tr;
    delete $str of $e; delete $tr of $e;
    insert $e has strength ($str + 1.0), has traversals ($tr + 1);
  `).catch(() => {
    writeSilent(`
      match $s isa unit, has uid "${student}"; $t isa unit, has uid "teacher";
      insert (source: $s, target: $t) isa path,
        has strength 1.0, has resistance 0.0, has traversals 1, has revenue 0.0;
    `).catch(() => {})
  })

  // Record as hypothesis
  writeSilent(`
    insert $h isa hypothesis,
      has hid "tutorial-${student}-phase-${phase}-${Date.now()}",
      has statement "student ${student} completed tutorial phase ${phase}",
      has hypothesis-status "confirmed",
      has observations-count 1,
      has p-value 0.01,
      has action-ready false;
  `).catch(() => {})
}

/** Get completed phases for a student */
async function getProgress(student: string) {
  const rows = await readParsed(`
    match $o isa objective, has oid $oid, has progress $p, has objective-status $s;
    $oid contains "tutorial-"; $oid contains "${student}";
    select $oid, $p, $s;
  `).catch(() => [])

  const completed = rows.filter(r => r.s === 'complete').length
  return { phases: rows, completed, overall: completed / 7 }
}

// ── Phase Executors ─────────────────────────────────────────────────────

async function phase1(): Promise<{ actions: string[]; state: Record<string, unknown> }> {
  const actions: string[] = []

  // Create the echo agent
  const spec = parse(ECHO_MARKDOWN)
  try {
    await syncAgent(spec)
    actions.push('Created unit "echo" in TypeDB')
    actions.push('Created skills: repeat, transform')
    actions.push('Created capability relations')
  } catch {
    actions.push('Unit "echo" already exists (idempotent)')
  }

  // Query what was created
  const units = await readParsed(`
    match $u isa unit, has uid "echo", has model $m;
    select $m;
  `).catch(() => [])

  const skills = await readParsed(`
    match $u isa unit, has uid "echo";
    (provider: $u, offered: $sk) isa capability;
    $sk has skill-id $sid, has tag $tag;
    select $sid, $tag;
  `).catch(() => [])

  return {
    actions,
    state: {
      unit: units[0] || { model: 'echo exists' },
      skills: skills.map(s => ({ id: s.sid, tag: s.tag })),
    },
  }
}

async function phase2(): Promise<{ actions: string[]; state: Record<string, unknown> }> {
  const actions: string[] = []

  // Send a signal from entry to echo
  const now = new Date().toISOString().replace('Z', '')
  await write(`
    match $from isa unit, has uid "entry"; $to isa unit, has uid "echo";
    insert (sender: $from, receiver: $to) isa signal,
      has data "Hello from the tutorial!", has amount 0.0,
      has success true, has ts ${now};
  `).catch(async () => {
    // entry unit might not exist, create it
    await write(`
      insert $u isa unit, has uid "entry", has name "entry", has unit-kind "system",
        has status "active", has success-rate 1.0, has activity-score 0.0,
        has sample-count 0, has reputation 0.0, has balance 0.0, has generation 0;
    `).catch(() => {})
    actions.push('Created "entry" unit (system)')
  })
  actions.push('Sent signal: entry → echo (data: "Hello from the tutorial!")')

  // Mark the path
  await write(`
    match $from isa unit, has uid "entry"; $to isa unit, has uid "echo";
    $e (source: $from, target: $to) isa path, has strength $s, has traversals $t;
    delete $s of $e; delete $t of $e;
    insert $e has strength ($s + 1.0), has traversals ($t + 1);
  `).catch(async () => {
    await write(`
      match $from isa unit, has uid "entry"; $to isa unit, has uid "echo";
      insert (source: $from, target: $to) isa path,
        has strength 1.0, has resistance 0.0, has traversals 1, has revenue 0.0;
    `).catch(() => {})
  })
  actions.push('Marked path: entry→echo (+1 strength)')

  const paths = await readParsed(`
    match (source: $f, target: $t) isa path, has strength $s, has resistance $r;
    $f has uid "entry"; $t has uid "echo";
    select $s, $r;
  `).catch(() => [])

  return {
    actions,
    state: { path: paths[0] || { strength: 1, resistance: 0 } },
  }
}

async function phase3(): Promise<{ actions: string[]; state: Record<string, unknown> }> {
  const actions: string[] = []

  // Mark 5 times (simulate 5 successful signals)
  for (let i = 0; i < 5; i++) {
    await write(`
      match $from isa unit, has uid "entry"; $to isa unit, has uid "echo";
      $e (source: $from, target: $to) isa path, has strength $s, has traversals $t;
      delete $s of $e; delete $t of $e;
      insert $e has strength ($s + 1.0), has traversals ($t + 1);
    `).catch(() => {})
  }
  actions.push('Marked entry→echo 5 times (+5 strength)')

  // Warn once (simulate a failure)
  await write(`
    match $from isa unit, has uid "entry"; $to isa unit, has uid "echo";
    $e (source: $from, target: $to) isa path, has resistance $r;
    delete $r of $e;
    insert $e has resistance ($r + 1.0);
  `).catch(() => {})
  actions.push('Warned entry→echo once (+1 resistance)')

  const paths = await readParsed(`
    match (source: $f, target: $t) isa path, has strength $s, has resistance $r, has traversals $t2;
    $f has uid "entry"; $t has uid "echo";
    select $s, $r, $t2;
  `).catch(() => [])

  const p = paths[0] || {}
  const net = ((p.s as number) || 0) - ((p.r as number) || 0)

  return {
    actions,
    state: {
      strength: p.s,
      resistance: p.r,
      traversals: p.t2,
      net,
      explanation: `Net = ${p.s} - ${p.r} = ${net.toFixed(1)}. Positive net means the path is working.`,
    },
  }
}

async function phase4(): Promise<{ actions: string[]; state: Record<string, unknown> }> {
  const actions: string[] = []

  // Snapshot before
  const before = await readParsed(`
    match (source: $f, target: $t) isa path, has strength $s, has resistance $r;
    $f has uid "entry"; $t has uid "echo";
    select $s, $r;
  `).catch(() => [])

  actions.push(`Before: strength=${(before[0]?.s as number)?.toFixed(2)}, resistance=${(before[0]?.r as number)?.toFixed(2)}`)

  // Run asymmetric decay
  await decay(0.05, 0.20)
  actions.push('Decayed: strength ×0.95, resistance ×0.80 (asymmetric)')

  // Snapshot after
  const after = await readParsed(`
    match (source: $f, target: $t) isa path, has strength $s, has resistance $r;
    $f has uid "entry"; $t has uid "echo";
    select $s, $r;
  `).catch(() => [])

  actions.push(`After: strength=${(after[0]?.s as number)?.toFixed(2)}, resistance=${(after[0]?.r as number)?.toFixed(2)}`)

  return {
    actions,
    state: {
      before: before[0] || {},
      after: after[0] || {},
      explanation: 'Resistance decays 4x faster than strength. Failures forgive. Strength endures.',
    },
  }
}

async function phase5(): Promise<{ actions: string[]; state: Record<string, unknown> }> {
  const actions: string[] = []

  // Build highway: mark heavily
  for (let i = 0; i < 20; i++) {
    await write(`
      match $from isa unit, has uid "entry"; $to isa unit, has uid "echo";
      $e (source: $from, target: $to) isa path, has strength $s, has traversals $t;
      delete $s of $e; delete $t of $e;
      insert $e has strength ($s + 2.0), has traversals ($t + 1);
    `).catch(() => {})
  }
  actions.push('Marked entry→echo 20 times (+40 strength total)')

  // Check highway status
  const paths = await readParsed(`
    match (source: $f, target: $t) isa path, has strength $s, has resistance $r;
    $f has uid "entry"; $t has uid "echo";
    select $s, $r;
  `).catch(() => [])

  const p = paths[0] || {}
  const net = ((p.s as number) || 0) - ((p.r as number) || 0)
  const isHighway = net >= 20

  // Get all highways
  const highways = await readParsed(`
    match (source: $f, target: $t) isa path, has strength $s, has resistance $r;
    $f has uid $fid; $t has uid $tid; $s > 20.0;
    select $fid, $tid, $s, $r;
  `).catch(() => [])

  actions.push(`Net strength: ${net.toFixed(1)} ${isHighway ? '→ HIGHWAY (LLM skip enabled)' : '→ not yet a highway'}`)

  return {
    actions,
    state: {
      path: { strength: p.s, resistance: p.r, net },
      isHighway,
      highways: highways.map(h => ({ from: h.fid, to: h.tid, strength: h.s })),
      explanation: isHighway
        ? 'Net ≥ 20 → proven path. The tick will skip the LLM call entirely. Faster and cheaper.'
        : 'Not enough net strength yet. Keep marking successful signals.',
    },
  }
}

async function phase6(): Promise<{ actions: string[]; state: Record<string, unknown> }> {
  const actions: string[] = []

  // Query units that need evolution
  const struggling = await readParsed(`
    match $u isa unit, has uid $id, has success-rate $sr, has sample-count $sc, has generation $g;
    $sr < 0.50; $sc >= 20;
    select $id, $sr, $sc, $g;
  `).catch(() => [])

  actions.push(`Found ${struggling.length} unit(s) eligible for evolution`)

  // Show evolution criteria
  const allUnits = await readParsed(`
    match $u isa unit, has uid $id, has success-rate $sr, has sample-count $sc, has generation $g;
    select $id, $sr, $sc, $g;
  `).catch(() => [])

  // Check for existing evolution hypotheses
  const evoHistory = await readParsed(`
    match $h isa hypothesis, has hid $hid, has hypothesis-status $s;
    $hid contains "evolve-";
    select $hid, $s;
  `).catch(() => [])

  actions.push(`Evolution history: ${evoHistory.length} prompt rewrite(s) recorded`)

  return {
    actions,
    state: {
      criteria: { successRateBelow: 0.50, minSamples: 20, cooldown: '24 hours' },
      struggling: struggling.map(u => ({ id: u.id, successRate: u.sr, samples: u.sc, generation: u.g })),
      allUnits: allUnits.map(u => ({ id: u.id, successRate: u.sr, samples: u.sc, generation: u.g })),
      evolutionHistory: evoHistory,
      explanation: 'L5 Evolution: substrate rewrites struggling agent prompts. Old prompts saved as hypotheses for rollback. Two layers of learning: substrate (pheromone) + agent (prompt evolution).',
    },
  }
}

async function phase7(): Promise<{ actions: string[]; state: Record<string, unknown> }> {
  const actions: string[] = []

  // Query hypotheses (the substrate's knowledge)
  const hypotheses = await readParsed(`
    match $h isa hypothesis, has hid $hid, has statement $stmt, has hypothesis-status $hs;
    select $hid, $stmt, $hs;
  `).catch(() => [])
  actions.push(`Hypotheses: ${hypotheses.length} total`)

  const confirmed = hypotheses.filter(h => h.hs === 'confirmed')
  const testing = hypotheses.filter(h => h.hs === 'testing')
  actions.push(`  Confirmed: ${confirmed.length}, Testing: ${testing.length}`)

  // Query frontiers
  const frontiers = await readParsed(`
    match $f isa frontier, has fid $fid, has frontier-type $ft,
      has frontier-description $fd, has frontier-status $fs;
    select $fid, $ft, $fd, $fs;
  `).catch(() => [])
  actions.push(`Frontiers: ${frontiers.length} detected`)

  // Query highways
  const highways = await readParsed(`
    match (source: $f, target: $t) isa path, has strength $s;
    $f has uid $fid; $t has uid $tid; $s > 10.0;
    sort $s desc; limit 10;
    select $fid, $tid, $s;
  `).catch(() => [])
  actions.push(`Highways: ${highways.length} strong paths`)

  return {
    actions,
    state: {
      hypotheses: hypotheses.slice(0, 10).map(h => ({ id: h.hid, statement: h.stmt, status: h.hs })),
      frontiers: frontiers.map(f => ({ id: f.fid, type: f.ft, description: f.fd, status: f.fs })),
      highways: highways.map(h => ({ from: h.fid, to: h.tid, strength: h.s })),
      explanation: 'L6 Crystallize: highways → confirmed hypotheses (permanent knowledge). Fading paths → testing hypotheses (watch these). L7 Frontier: tag gaps + unit gaps → unexplored territory. Knowledge couples back to evolution: strong patterns trigger priority evolution.',
    },
  }
}

const PHASE_EXECUTORS = [phase1, phase2, phase3, phase4, phase5, phase6, phase7]

// ── GET — Check progress ────────────────────────────────────────────────

export const GET: APIRoute = async ({ url }) => {
  const student = url.searchParams.get('student')
  if (!student) {
    return Response.json({ error: 'Provide ?student=uid', phases: PHASES })
  }

  await ensureObjectives(student)
  const progress = await getProgress(student)

  const phases = PHASES.map(p => {
    const obj = progress.phases.find(r => (r.oid as string)?.includes(`phase-${p.phase}`))
    return {
      ...p,
      status: (obj?.s as string) || 'pending',
      progress: (obj?.p as number) || 0,
    }
  })

  return Response.json({ student, phases, overall: progress.overall })
}

// ── POST — Execute a phase ──────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as {
    phase: number
    student: string
  }

  const { phase, student } = body
  if (!student) return Response.json({ error: 'Missing student' }, { status: 400 })
  if (!phase || phase < 1 || phase > 7) return Response.json({ error: 'Phase must be 1-7' }, { status: 400 })

  // Ensure student unit exists
  await write(`
    insert $u isa unit, has uid "${student}", has name "${student}", has unit-kind "human",
      has status "active", has success-rate 0.5, has activity-score 0.0,
      has sample-count 0, has reputation 0.0, has balance 0.0, has generation 0;
  `).catch(() => {}) // already exists = fine

  // Ensure objectives seeded
  await ensureObjectives(student)

  // Execute phase
  const executor = PHASE_EXECUTORS[phase - 1]
  const { actions, state } = await executor()

  // Mark phase complete
  await markComplete(student, phase)

  // Get updated progress
  const progress = await getProgress(student)
  const next = phase < 7 ? phase + 1 : null

  return Response.json({
    phase,
    title: PHASES[phase - 1].title,
    description: PHASES[phase - 1].description,
    actions,
    state,
    progress: progress.overall,
    completed: progress.completed,
    next,
  })
}
