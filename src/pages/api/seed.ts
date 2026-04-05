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
        has gid "${s.id}",
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
    const gid = `${c.agent}:${c.task}`
    await write(`
      insert $s isa skill,
        has gid "${gid}",
        has name "${c.task}",
        has tag "${c.taskType}",
        has price ${c.price},
        has currency "SUI";
    `).catch(() => {})

    await write(`
      match
        $u isa unit, has uid "${c.agent}";
        $s isa skill, has gid "${gid}";
      insert
        (provider: $u, offered: $s) isa capability,
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
          has resistance 0.0,
          has traversals 0,
          has revenue 0.0;
    `).catch(() => {})
  }
  results.push(`${agentPaths.length} agent paths`)

  // ─── Skills (10 sample, tagged) ──────────────────────────────────────────

  const skills = [
    { id: 'seed', name: 'Seed world data', tags: ['build', 'scale', 'P0'] },
    { id: 'health', name: 'Health monitoring', tags: ['build', 'scale', 'P0'] },
    { id: 'dashboard', name: 'Dashboard UI', tags: ['build', 'scale', 'P0', 'frontend'] },
    { id: 'decay-auto', name: 'Decay automation', tags: ['build', 'scale', 'P1'] },
    { id: 'revenue', name: 'Revenue tracking', tags: ['build', 'scale', 'P0', 'payments'] },
    { id: 'alerts', name: 'Alert system', tags: ['build', 'scale', 'P1'] },
    { id: 'onboard-flow', name: 'Agent onboarding', tags: ['build', 'onboard', 'P1'] },
    { id: 'swarm-coord', name: 'Swarm coordination', tags: ['build', 'scale', 'P2'] },
    { id: 'load-test', name: 'Load testing', tags: ['test', 'scale', 'P1'] },
    { id: 'prod-deploy', name: 'Production deploy', tags: ['deploy', 'scale', 'P0', 'infra'] },
  ]

  for (const s of skills) {
    const tagInserts = s.tags.map(t => `has tag "${t}"`).join(', ')
    await write(`
      insert $s isa skill,
        has skill-id "${s.id}",
        has name "${s.name}",
        ${tagInserts},
        has price 0.0,
        has currency "SUI";
    `).catch(() => {})
  }
  results.push(`${skills.length} skills`)

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
          has resistance 0.0,
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
