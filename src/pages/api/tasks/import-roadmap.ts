/**
 * POST /api/tasks/import-roadmap — Import roadmap as tagged skills
 *
 * Creates skills with tags, capabilities on a "builder" unit,
 * and initial paths with pheromone from completed items.
 */
import type { APIRoute } from 'astro'
import { write, writeSilent } from '@/lib/typedb'

interface RoadmapItem {
  id: string
  name: string
  tags: string[]
  done: boolean
  after: string[]
}

const ROADMAP: RoadmapItem[] = [
  // Phase 0: Tighten (all done)
  { id: 'schema', name: 'One schema', tags: ['build', 'tighten', 'P0'], done: true, after: [] },
  { id: 'converge', name: 'Converge vocabulary', tags: ['build', 'tighten', 'P0'], done: true, after: ['schema'] },
  { id: 'revenue-trails', name: 'Revenue on trails', tags: ['build', 'tighten', 'P0'], done: true, after: ['schema'] },
  // Phase 1: Wire
  { id: 'typedb-cloud', name: 'TypeDB Cloud', tags: ['build', 'wire', 'P0', 'infra'], done: false, after: [] },
  {
    id: 'cf-worker',
    name: 'Cloudflare Worker proxy',
    tags: ['build', 'wire', 'P0', 'infra'],
    done: true,
    after: ['typedb-cloud'],
  },
  { id: 'typedb-client', name: 'TypeDB client lib', tags: ['build', 'wire', 'P0'], done: true, after: ['cf-worker'] },
  { id: 'persist', name: 'Persist layer', tags: ['build', 'wire', 'P0'], done: true, after: ['typedb-client'] },
  // Phase 2: Tasks (done)
  { id: 'task-api', name: 'Task API routes', tags: ['build', 'tasks', 'P0'], done: true, after: ['persist'] },
  {
    id: 'task-board',
    name: 'Task board UI',
    tags: ['build', 'tasks', 'P0', 'frontend'],
    done: true,
    after: ['task-api'],
  },
  { id: 'growth-loop', name: 'Growth loop', tags: ['build', 'tasks', 'P0'], done: true, after: ['task-api'] },
  // Phase 3: Onboard
  { id: 'seed-world', name: 'Seed world', tags: ['build', 'onboard', 'P0'], done: false, after: ['growth-loop'] },
  {
    id: 'signup',
    name: 'Signup flow',
    tags: ['build', 'onboard', 'P0', 'frontend'],
    done: false,
    after: ['seed-world'],
  },
  {
    id: 'agent-builder',
    name: 'Agent builder',
    tags: ['build', 'onboard', 'P0', 'frontend'],
    done: false,
    after: ['signup'],
  },
  {
    id: 'discovery',
    name: 'Discovery',
    tags: ['build', 'onboard', 'P1', 'frontend'],
    done: false,
    after: ['seed-world'],
  },
  {
    id: 'connect',
    name: 'Connect flow',
    tags: ['build', 'onboard', 'P0'],
    done: false,
    after: ['agent-builder', 'discovery'],
  },
  // Phase 4: Commerce
  {
    id: 'x402',
    name: 'x402 payment layer',
    tags: ['build', 'commerce', 'P0', 'payments'],
    done: false,
    after: ['agent-builder'],
  },
  {
    id: 'marketplace',
    name: 'Service marketplace',
    tags: ['build', 'commerce', 'P1', 'frontend'],
    done: false,
    after: ['x402'],
  },
  {
    id: 'a2a-payments',
    name: 'Agent-to-agent payments',
    tags: ['build', 'commerce', 'P1', 'payments'],
    done: false,
    after: ['x402'],
  },
  {
    id: 'agentverse',
    name: 'Agentverse bridge',
    tags: ['build', 'commerce', 'P2', 'integration'],
    done: false,
    after: ['marketplace'],
  },
  // Phase 5: Intelligence
  { id: 'llm-unit', name: 'LLM as unit', tags: ['build', 'intelligence', 'P0'], done: false, after: ['a2a-payments'] },
  {
    id: 'hypothesis',
    name: 'Hypothesis engine',
    tags: ['build', 'intelligence', 'P1'],
    done: false,
    after: ['marketplace'],
  },
  {
    id: 'frontier',
    name: 'Frontier detection',
    tags: ['build', 'intelligence', 'P2'],
    done: false,
    after: ['hypothesis'],
  },
  // Phase 6: Scale
  {
    id: 'deploy',
    name: 'Deploy to production',
    tags: ['build', 'scale', 'P0', 'infra'],
    done: false,
    after: ['llm-unit'],
  },
  { id: 'sui', name: 'Sui integration', tags: ['build', 'scale', 'P0', 'payments'], done: false, after: ['deploy'] },
  {
    id: 'asi-ecosystem',
    name: 'ASI ecosystem',
    tags: ['build', 'scale', 'P1', 'integration'],
    done: false,
    after: ['sui'],
  },
]

export const POST: APIRoute = async () => {
  let created = 0

  // 1. Create builder unit
  await write(`
    insert $u isa unit, has uid "builder", has name "Builder", has unit-kind "system",
      has tag "system", has status "active", has success-rate 0.5, has activity-score 0.0,
      has sample-count 0, has reputation 0.0, has balance 0.0, has generation 0;
  `).catch(() => {})

  // 2. Create skills with tags + capabilities
  for (const item of ROADMAP) {
    const tagInserts = item.tags.map((t) => `has tag "${t}"`).join(', ')
    await writeSilent(`
      insert $s isa skill, has skill-id "${item.id}", has name "${item.name}",
        ${tagInserts}, has price 0.0, has currency "SUI";
    `)
    await writeSilent(`
      match $u isa unit, has uid "builder"; $s isa skill, has skill-id "${item.id}";
      insert (provider: $u, offered: $s) isa capability, has price 0.0;
    `)
    created++
  }

  // 3. Create paths between sequential skills
  for (const item of ROADMAP) {
    for (const dep of item.after) {
      const source = ROADMAP.find((r) => r.id === dep)
      const strength = source?.done ? 50.0 : 0.0
      await writeSilent(`
        match $from isa unit, has uid "builder"; $to isa unit, has uid "builder";
        insert (source: $from, target: $to) isa path,
          has strength ${strength}, has resistance 0.0, has traversals ${source?.done ? 1 : 0},
          has revenue 0.0, has fade-rate 0.05, has peak-strength ${strength};
      `).catch(() => {})
    }
  }

  // Collect all unique tags used
  const allTags = [...new Set(ROADMAP.flatMap((r) => r.tags))].sort()

  return new Response(
    JSON.stringify({
      ok: true,
      skills: created,
      tags: allTags,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
