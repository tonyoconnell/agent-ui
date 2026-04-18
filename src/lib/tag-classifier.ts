/**
 * Pure-function tag classifier for chat messages.
 *
 * Zero deps, zero I/O, deterministic. Produces domain + sub-tags that the
 * CEO's `follow(tag)` uses to route a message to a director without calling
 * an LLM just to decide routing. Confidence < 0.4 → caller falls back to LLM.
 *
 * Contract: pure function, same input → same output, <1ms typical, never
 * throws, always returns at least ['general'].
 */

// Frozen vocabulary v1. Keys are tag names emitted; values are keyword
// triggers (lowercase, matched on tokenized word or multi-word substring).
// Multi-word entries (containing a space) are matched on the normalized
// phrase, not token-by-token.
const TAG_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  // --- Marketing sub-tags ---
  seo: ['rank', 'google', 'serp', 'keyword', 'keywords', 'ahrefs', 'search', 'backlink', 'backlinks'],
  content: ['blog', 'article', 'post', 'copywriting', 'write', 'writing', 'draft'],
  copy: ['headline', 'headlines', 'cta', 'tagline', 'slogan', 'copy'],
  ads: ['ad', 'ads', 'paid', 'campaign', 'ppc', 'facebook ads', 'google ads', 'adwords'],
  creative: ['brand', 'branding', 'logo', 'visual', 'visuals', 'design'],
  analytics: ['metrics', 'conversion', 'funnel', 'ga4', 'analytics', 'data', 'ctr', 'cpc', 'roas'],
  social: ['twitter', 'linkedin', 'instagram', 'tiktok', 'facebook post', 'social media'],
  outreach: ['cold outreach', 'dm', 'link building', 'outreach', 'cold email'],
  citation: ['citation', 'citations', 'business listings', 'nap', 'local seo'],
  ranking: ['rank', 'ranking', 'rankings', 'position', 'competitor', 'competitors'],
  // --- Domain-only tags (no sub-tags needed here in v1) ---
  dev: [
    'ci',
    'pipeline',
    'deploy',
    'build',
    'typescript',
    'bug',
    'merge',
    'pull request',
    'pr ',
    'commit',
    'test',
    'tests',
    'lint',
    'typecheck',
  ],
  ops: ['incident', 'outage', 'alert', 'monitor', 'monitoring', 'postmortem', 'on-call', 'oncall'],
  support: ['refund', 'cancel', 'billing', 'ticket', 'help', 'complaint', 'password', 'login'],
}

// Which sub-tags belong to which primary domain.
const DOMAIN_OF: Readonly<Record<string, string>> = {
  seo: 'marketing',
  content: 'marketing',
  copy: 'marketing',
  ads: 'marketing',
  creative: 'marketing',
  analytics: 'marketing',
  social: 'marketing',
  outreach: 'marketing',
  citation: 'marketing',
  ranking: 'marketing',
  dev: 'dev',
  ops: 'ops',
  support: 'support',
}

const PRIMARY_DOMAINS = new Set(['marketing', 'ops', 'dev', 'support', 'general'])

/** Normalize: lowercase + strip punctuation (keep spaces for multi-word). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Count occurrences of a keyword phrase in normalized text as whole tokens. */
function hitCount(tokens: string[], norm: string, kw: string): number {
  if (kw.includes(' ')) {
    // Multi-word: substring match with word boundaries via spaces.
    const padded = ' ' + norm + ' '
    const needle = ' ' + kw + ' '
    let count = 0
    let idx = padded.indexOf(needle)
    while (idx !== -1) {
      count++
      idx = padded.indexOf(needle, idx + needle.length - 1)
    }
    return count
  }
  let count = 0
  for (const t of tokens) if (t === kw) count++
  return count
}

interface ScoreResult {
  tags: string[]
  confidence: number
  matchedKeywords: string[]
}

function score(content: string): ScoreResult {
  if (!content || typeof content !== 'string') {
    return { tags: ['general'], confidence: 0, matchedKeywords: [] }
  }
  const norm = normalize(content)
  if (!norm) return { tags: ['general'], confidence: 0, matchedKeywords: [] }
  const tokens = norm.split(' ')
  // Context cap of 6: a short message with 3 relevant terms is a high-signal
  // route, not a 30% one. Above 6 words, denominator saturates so very long
  // messages with a few hits still register as weak (routes to LLM fallback).
  const denom = Math.min(Math.max(tokens.length, 1), 6)

  const tagScore: Record<string, number> = {}
  const matched: string[] = []
  const seenKw = new Set<string>()

  for (const tag in TAG_KEYWORDS) {
    let s = 0
    for (const kw of TAG_KEYWORDS[tag]) {
      const n = hitCount(tokens, norm, kw)
      if (n > 0) {
        s += n
        if (!seenKw.has(kw)) {
          seenKw.add(kw)
          matched.push(kw)
        }
      }
    }
    if (s > 0) tagScore[tag] = s
  }

  const scoredTags = Object.keys(tagScore)
  if (scoredTags.length === 0) {
    return { tags: ['general'], confidence: 0, matchedKeywords: [] }
  }

  // Sort by score desc, then alphabetical for ties (deterministic).
  scoredTags.sort((a, b) => {
    const d = tagScore[b] - tagScore[a]
    return d !== 0 ? d : a.localeCompare(b)
  })

  // Primary domain: most common DOMAIN_OF across scored tags, weighted by score.
  const domainScore: Record<string, number> = {}
  for (const t of scoredTags) {
    const d = DOMAIN_OF[t] ?? 'general'
    domainScore[d] = (domainScore[d] ?? 0) + tagScore[t]
  }
  const domains = Object.keys(domainScore).sort((a, b) => {
    const d = domainScore[b] - domainScore[a]
    return d !== 0 ? d : a.localeCompare(b)
  })
  const primary = domains[0] && PRIMARY_DOMAINS.has(domains[0]) ? domains[0] : 'general'

  // Build final tag list: [primary, ...subTags-not-equal-to-primary]
  const out: string[] = [primary]
  for (const t of scoredTags) if (t !== primary) out.push(t)

  // Confidence: unique keyword hits / capped word count.
  const confidence = Math.min(1, matched.length / denom)
  matched.sort()
  return { tags: out, confidence, matchedKeywords: matched }
}

/** Returns [primaryDomain, ...subTags]. Always at least ['general']. */
export function classify(content: string): string[] {
  return score(content).tags
}

/** Same as classify() but with confidence + matched keywords for LLM fallback. */
export function classifyWithConfidence(content: string): ScoreResult {
  return score(content)
}
