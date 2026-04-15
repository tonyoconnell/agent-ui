/**
 * Chat helpers — keyword classification, valence detection, TypeDB actor queries.
 *
 * Zero LLM calls. Used by src/engine/chat.ts and src/lib/chat/context-pack.ts.
 * classify() and detectValence() are ported verbatim from
 * nanoclaw/src/lib/classify-fallback.ts.
 */

import { readParsed } from '@/lib/typedb'

// ── Classification ────────────────────────────────────────────────────────────

const TOPIC_PATTERNS: [RegExp, string][] = [
  [/\b(typescript|ts|\.ts)\b/i, 'typescript'],
  [/\b(javascript|js|\.js|node)\b/i, 'javascript'],
  [/\b(python|\.py)\b/i, 'python'],
  [/\b(code|function|class|import|export|error|bug|fix|debug)\b/i, 'code'],
  [/\b(seo|search engine|keyword|ranking|backlink|meta|serp)\b/i, 'seo'],
  [/\b(marketing|campaign|brand|audience|content|social|ad)\b/i, 'marketing'],
  [/\b(write|writing|blog|post|article|copy|draft|headline)\b/i, 'writing'],
  [/\b(research|find|look up|search|study|analyze|data)\b/i, 'research'],
  [/\b(deploy|deployment|cloudflare|worker|build|ci|pipeline)\b/i, 'deploy'],
  [/\b(test|testing|vitest|jest|spec|assert|expect)\b/i, 'test'],
  [/\b(design|ui|ux|component|layout|style|theme|color)\b/i, 'design'],
  [/\b(agent|substrate|signal|mark|warn|fade|pheromone|unit)\b/i, 'substrate'],
  [/\b(strategy|plan|roadmap|goal|objective|vision)\b/i, 'strategy'],
  [/^(hi|hello|hey|good morning|good evening|howdy)\b/i, 'greeting'],
  [/\?/, 'question'],
]

const CORRECTION_PATTERNS = [
  /\b(no|not|wrong|incorrect|actually|that'?s not|you'?re wrong|that is wrong|mistake)\b/i,
  /\b(misunderstood|missed|confused|off track|not right|not what I)\b/i,
]

const POSITIVE_PATTERNS = [
  /\b(thanks|thank you|perfect|exactly|great|excellent|awesome|amazing|yes!?|yep|correct|right)\b/i,
  /\b(that'?s (right|it|correct|great|perfect)|well done|good job|nice)\b/i,
]

/**
 * Classify text into tags using keyword matching.
 * Returns ["general"] if no patterns match.
 */
export function classify(text: string): string[] {
  const tags: string[] = []

  if (CORRECTION_PATTERNS.some((p) => p.test(text))) tags.push('correction')
  if (POSITIVE_PATTERNS.some((p) => p.test(text))) tags.push('positive')

  for (const [pattern, tag] of TOPIC_PATTERNS) {
    if (pattern.test(text) && !tags.includes(tag)) {
      tags.push(tag)
    }
    if (tags.length >= 5) break
  }

  return tags.length > 0 ? tags : ['general']
}

/**
 * Detect valence (sentiment) of a message.
 * Returns -1..+1. Corrections override positivity.
 */
export function detectValence(text: string): number {
  const hasCorrection = CORRECTION_PATTERNS.some((p) => p.test(text))
  const hasPositive = POSITIVE_PATTERNS.some((p) => p.test(text))

  if (hasCorrection && hasPositive) return -0.3
  if (hasCorrection) return -0.8
  if (hasPositive) return 0.8
  return 0.0
}

// ── TypeDB queries ────────────────────────────────────────────────────────────

/**
 * Query top paths from an actor to other units/tags.
 * Returns empty array on error (cold start safe).
 */
export async function actorHighways(uid: string, limit = 10): Promise<Array<{ to: string; strength: number }>> {
  const safe = uid.replace(/"/g, '')
  const rows = await readParsed(
    `match
       $from isa unit, has uid "${safe}";
       $e (source: $from, target: $to) isa path, has strength $s;
       $to has uid $tid;
     sort $s desc; limit ${limit};
     select $tid, $s;`,
  ).catch(() => [] as Record<string, unknown>[])

  return (rows as { tid: string; s: number }[]).map((r) => ({ to: r.tid, strength: r.s }))
}
