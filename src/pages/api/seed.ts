/**
 * POST /api/seed — Seed the world with initial O-1 data
 *
 * Creates: 3 swarms, 8 units (personas), 3 LLM agents, 13 tasks, 5 paths,
 *          3 agent capabilities, 3 agent paths.
 * Idempotent: checks for existing data before inserting.
 */
import type { APIRoute } from 'astro'
import { write, readParsed, writeBatch } from '@/lib/typedb'

export const POST: APIRoute = async () => {
  const results: string[] = []

  // Check if already seeded
  const existing = await readParsed(`
    match $u isa unit, has uid $id; select $id;
  `).catch(() => [])

  if (existing.length > 0) {
    return new Response(JSON.stringify({
      seeded: false,
      message: `World already has ${existing.length} units. Delete first to re-seed.`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ─── Swarms ───────────────────────────────────────────────────────────────

  const swarms = [
    { id: 'swarm-platform', name: 'Platform', purpose: 'Build and maintain the ONE substrate' },
    { id: 'swarm-agents', name: 'Agents', purpose: 'AI agent services and integration' },
    { id: 'swarm-community', name: 'Community', purpose: 'User growth and engagement' },
  ]

  for (const s of swarms) {
    await write(`
      insert $s isa swarm,
        has sid "${s.id}",
        has name "${s.name}",
        has purpose "${s.purpose}";
    `).catch(() => {})
  }
  results.push(`${swarms.length} swarms`)

  // ─── Units (8 personas) ───────────────────────────────────────────────────

  const units = [
    { id: 'executives', name: 'Executives', kind: 'persona', status: 'active', swarm: 'swarm-platform' },
    { id: 'engineers', name: 'Engineers', kind: 'persona', status: 'active', swarm: 'swarm-platform' },
    { id: 'designers', name: 'Designers', kind: 'persona', status: 'active', swarm: 'swarm-platform' },
    { id: 'marketers', name: 'Marketers', kind: 'persona', status: 'active', swarm: 'swarm-community' },
    { id: 'sellers', name: 'Sellers', kind: 'persona', status: 'active', swarm: 'swarm-community' },
    { id: 'creators', name: 'Creators', kind: 'persona', status: 'active', swarm: 'swarm-community' },
    { id: 'young-people', name: 'Young People', kind: 'persona', status: 'active', swarm: 'swarm-agents' },
    { id: 'kids', name: 'Kids', kind: 'persona', status: 'active', swarm: 'swarm-agents' },
  ]

  for (const u of units) {
    await write(`
      insert $u isa unit,
        has uid "${u.id}",
        has name "${u.name}",
        has unit-kind "${u.kind}",
        has status "${u.status}";
    `).catch(() => {})
  }
  results.push(`${units.length} units`)

  // ─── LLM Agents (3 with model + system-prompt) ────────────────────────────

  const agents = [
    {
      id: 'summarizer',
      name: 'Summarizer',
      kind: 'agent',
      model: 'sonnet',
      systemPrompt: 'You are a concise summarizer. Given any text, produce a clear summary capturing the key points. Be brief and precise.',
      swarm: 'swarm-agents',
    },
    {
      id: 'translator',
      name: 'Translator',
      kind: 'agent',
      model: 'sonnet',
      systemPrompt: 'You are a multilingual translator. Translate the given text to the requested language. If no language is specified, translate to English. Preserve meaning and tone.',
      swarm: 'swarm-agents',
    },
    {
      id: 'analyst',
      name: 'Analyst',
      kind: 'agent',
      model: 'sonnet',
      systemPrompt: 'You are a data analyst. Given data or a question, provide structured analysis with insights, patterns, and recommendations. Use clear formatting.',
      swarm: 'swarm-agents',
    },
  ]

  for (const a of agents) {
    await write(`
      insert $u isa unit,
        has uid "${a.id}",
        has name "${a.name}",
        has unit-kind "${a.kind}",
        has status "active",
        has model "${a.model}",
        has system-prompt "${a.systemPrompt}",
        has generation 1,
        has balance 0.0,
        has reputation 50.0,
        has success-rate 0.5,
        has activity-score 0.0,
        has sample-count 0;
    `).catch(() => {})
  }
  results.push(`${agents.length} LLM agents`)

  // ─── Agent Capabilities ───────────────────────────────────────────────────

  const agentCaps = [
    { agent: 'summarizer', task: 'summarize', taskType: 'analysis', price: 0.01 },
    { agent: 'translator', task: 'translate', taskType: 'analysis', price: 0.02 },
    { agent: 'analyst', task: 'analyze', taskType: 'analysis', price: 0.03 },
  ]

  for (const c of agentCaps) {
    const tid = `${c.agent}:${c.task}`
    await write(`
      insert $t isa task,
        has tid "${tid}",
        has name "${c.task}",
        has task-type "${c.taskType}",
        has status "active",
        has priority "P1",
        has phase "onboard",
        has price ${c.price},
        has currency "SUI";
    `).catch(() => {})

    await write(`
      match
        $u isa unit, has uid "${c.agent}";
        $t isa task, has tid "${tid}";
      insert
        (provider: $u, skill: $t) isa capability,
          has price ${c.price};
    `).catch(() => {})
  }
  results.push(`${agentCaps.length} agent capabilities`)

  // ─── Paths between agents (initial routing) ──────────────────────────────

  const agentPaths = [
    { from: 'summarizer', to: 'analyst', strength: 30 },
    { from: 'translator', to: 'summarizer', strength: 25 },
    { from: 'analyst', to: 'translator', strength: 20 },
  ]

  for (const p of agentPaths) {
    await write(`
      match
        $from isa unit, has uid "${p.from}";
        $to isa unit, has uid "${p.to}";
      insert
        (source: $from, target: $to) isa path,
          has strength ${p.strength}.0,
          has alarm 0.0,
          has traversals 0,
          has revenue 0.0;
    `).catch(() => {})
  }
  results.push(`${agentPaths.length} agent paths`)

  // ─── Tasks (10 sample with dependencies) ──────────────────────────────────

  const tasks = [
    { id: 'O-1', name: 'Seed world data', status: 'complete', priority: 'P0', phase: 'scale' },
    { id: 'O-2', name: 'Health monitoring', status: 'complete', priority: 'P0', phase: 'scale' },
    { id: 'O-3', name: 'Dashboard UI', status: 'in_progress', priority: 'P0', phase: 'scale' },
    { id: 'O-4', name: 'Decay cycle automation', status: 'todo', priority: 'P1', phase: 'scale' },
    { id: 'O-5', name: 'Revenue tracking', status: 'todo', priority: 'P0', phase: 'scale' },
    { id: 'O-6', name: 'Alert system', status: 'todo', priority: 'P1', phase: 'scale' },
    { id: 'O-7', name: 'Agent onboarding flow', status: 'todo', priority: 'P1', phase: 'scale' },
    { id: 'O-8', name: 'Swarm coordination', status: 'todo', priority: 'P2', phase: 'scale' },
    { id: 'O-9', name: 'Load testing', status: 'todo', priority: 'P1', phase: 'scale' },
    { id: 'O-10', name: 'Production deploy', status: 'blocked', priority: 'P0', phase: 'scale' },
  ]

  for (const t of tasks) {
    await write(`
      insert $t isa task,
        has tid "${t.id}",
        has name "${t.name}",
        has status "${t.status}",
        has priority "${t.priority}",
        has phase "${t.phase}",
        has task-type "build";
    `).catch(() => {})
  }
  results.push(`${tasks.length} tasks`)

  // ─── Task dependencies (trails) ──────────────────────────────────────────

  const deps = [
    { from: 'O-1', to: 'O-2' },
    { from: 'O-1', to: 'O-3' },
    { from: 'O-2', to: 'O-6' },
    { from: 'O-3', to: 'O-5' },
    { from: 'O-5', to: 'O-10' },
    { from: 'O-9', to: 'O-10' },
  ]

  for (const d of deps) {
    await write(`
      match
        $from isa task, has tid "${d.from}";
        $to isa task, has tid "${d.to}";
      insert
        (source-task: $from, destination-task: $to) isa trail,
          has trail-pheromone 50.0,
          has alarm-pheromone 0.0,
          has trail-status "fresh";
    `).catch(() => {})
  }
  results.push(`${deps.length} task dependencies`)

  // ─── Paths (5 with initial weight) ────────────────────────────────────────

  const edges = [
    { from: 'executives', to: 'engineers', strength: 80, revenue: 0 },
    { from: 'engineers', to: 'designers', strength: 65, revenue: 0 },
    { from: 'marketers', to: 'sellers', strength: 70, revenue: 500 },
    { from: 'creators', to: 'young-people', strength: 55, revenue: 200 },
    { from: 'sellers', to: 'creators', strength: 45, revenue: 300 },
  ]

  for (const e of edges) {
    await write(`
      match
        $from isa unit, has uid "${e.from}";
        $to isa unit, has uid "${e.to}";
      insert
        (source: $from, target: $to) isa path,
          has strength ${e.strength}.0,
          has alarm 0.0,
          has traversals 0,
          has revenue ${e.revenue}.0;
    `).catch(() => {})
  }
  results.push(`${edges.length} paths`)

  return new Response(JSON.stringify({
    seeded: true,
    created: results,
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
