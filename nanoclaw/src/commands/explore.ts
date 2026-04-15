/**
 * /explore command — discover unexplored topic clusters.
 *
 * Queries TypeDB for world tags the actor has NOT touched via paths.
 * Returns 3 warm "invitation" questions to spark new conversations.
 */

import { actorHighways, query } from '../lib/substrate'
import type { Env } from '../types'

/** Map of tag → warm question prompt */
const TAG_QUESTIONS: Record<string, string> = {
  seo: "Have you tried our SEO audit? I can analyze a site's search visibility.",
  code: 'Want to explore code? I can help with TypeScript, debugging, or architecture.',
  marketing: 'Interested in marketing? I can help with campaigns, copy, and brand strategy.',
  writing: 'Want to work on writing? Blog posts, headlines, copy — I can help draft and refine.',
  research: 'Need research help? I can dig into topics, summarize, and synthesize findings.',
  deploy: 'Curious about deployment? I can walk through Cloudflare Workers, CI/CD, and infra.',
  design: 'Want design input? I can help with UI patterns, color systems, and component structure.',
  substrate: "Want to explore the ONE substrate? Agents, signals, pheromone routing — it's all learnable.",
  typescript: 'Want TypeScript help? Type inference, generics, config — name the challenge.',
  strategy: 'Thinking about strategy? I can help map goals, roadmaps, and decision frameworks.',
}

const DEFAULT_QUESTIONS = [
  'What kind of work are you focused on right now?',
  "Any challenges you're trying to solve that we haven't tackled together yet?",
  'Want to try something new — code, writing, strategy, or something else?',
]

export async function handleExploreCommand(actorUid: string, env: Env): Promise<string> {
  // Get tags the actor has already touched (via outbound paths)
  const touched = await actorHighways(env, actorUid, 50)
    .then((hw) => new Set(hw.map((h) => h.to)))
    .catch(() => new Set<string>())

  // Get all world skill tags
  const worldTagRows = await query(env, `match $s isa skill, has tag $t; select $t;`).catch(() => [] as unknown[])

  const worldTags = new Set(worldTagRows.map((r) => (r as { t: string }).t).filter(Boolean))

  // Frontier = world tags not touched by this actor
  const frontier = [...worldTags].filter((t) => !touched.has(t))

  // Pick up to 3 questions from the frontier
  const questions: string[] = []
  for (const tag of frontier) {
    if (TAG_QUESTIONS[tag]) {
      questions.push(TAG_QUESTIONS[tag])
    }
    if (questions.length >= 3) break
  }

  // Fill with defaults if not enough frontier tags
  while (questions.length < 3) {
    const def = DEFAULT_QUESTIONS[questions.length]
    if (def) questions.push(def)
    else break
  }

  return `Here are some directions we haven't explored together yet:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
}
