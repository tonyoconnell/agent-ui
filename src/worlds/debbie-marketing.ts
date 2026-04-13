/**
 * src/worlds/debbie-marketing.ts
 *
 * Debbie's marketing team — 11-agent pod cloned from Donal's operation-fury-plus
 * structure and adapted for Debbie's group on the ONE substrate.
 *
 * Lifecycle:
 *   1. syncWorld(debbieMarketing)   → TypeDB units + skills + capabilities
 *   2. wireWorld(debbieMarketing)   → live runtime handlers via complete()
 *   3. seedAlliances()              → pre-drawn pheromone paths (strength=50)
 */

import type { WorldSpec } from '@/engine/agent-md'

export const debbieMarketingAgents = [
  // CMO orchestrator — free, no price, routes briefs
  'cmo',

  // 10 priced skill agents
  'ai-ranking',
  'citation',
  'forum',
  'full',
  'monthly',
  'niche-dir',
  'outreach',
  'quick',
  'schema',
  'social',
] as const

export const debbieMarketing: WorldSpec = {
  name: 'debbie',
  description:
    'Debbie marketing team — 11 agents covering AI visibility audits, citation ' +
    'building, outreach, schema, and reporting. Cloned from Donal pod. ' +
    'Live on ONE substrate + Fetch.ai Agentverse, priced in FET.',
  agents: [], // populated at runtime by loading agents/debbie/*.md
}

/**
 * Pre-drawn pheromone edges — same alliance graph as Donal pod.
 * Seeded at strength=50 for a warm start. Substrate learns from real traffic.
 */
export const debbieMarketingAlliances = [
  { from: 'ai-ranking', to: 'citation',  strength: 50, reason: 'flags gaps, fills them' },
  { from: 'citation',   to: 'social',    strength: 50, reason: 'NAP data feeds profile builder' },
  { from: 'citation',   to: 'forum',     strength: 50, reason: 'NAP data feeds outreach venues' },
  { from: 'citation',   to: 'niche-dir', strength: 50, reason: 'batch sibling submissions' },
  { from: 'forum',      to: 'outreach',  strength: 50, reason: 'discovers venues, works them' },
  { from: 'outreach',   to: 'quick',     strength: 50, reason: 'feeds lead funnel' },
  { from: 'quick',      to: 'full',      strength: 50, reason: 'VSL hook upsells to full audit' },
  { from: 'ai-ranking', to: 'schema',    strength: 50, reason: 'audit recommends schema gaps' },
  { from: 'full',       to: 'schema',    strength: 50, reason: 'audit recommends schema gaps' },
  { from: 'full',       to: 'monthly',   strength: 50, reason: 'full audit feeds retainer reports' },
  { from: 'monthly',    to: 'schema',    strength: 50, reason: 'monthly schema refreshes' },
]

export const ALLIANCE_STRENGTH = 50
