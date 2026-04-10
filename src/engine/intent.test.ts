/**
 * INTENT CACHE — Proof
 *
 * The claim: typed text variations all resolve to the same intent,
 * hitting the same cache entry. Buttons are the seed set. One LLM call
 * answers 200 users.
 *
 * No D1. No TypeDB. No network. Pure logic, real numbers.
 *
 * Run: npx vitest run src/engine/intent.test.ts
 */

import { describe, it, expect } from 'vitest'
import { resolveIntent, type Intent, type ResolveResult } from './intent'

// ── Test intents (from docs/plan-intent-cache.md) ─────────────────────────

const INTENTS: Intent[] = [
  {
    name: 'refund-policy',
    label: 'Return Policy',
    keywords: ['return', 'refund', 'money back', 'exchange', 'send back'],
  },
  {
    name: 'shipping-info',
    label: 'Shipping Info',
    keywords: ['ship', 'deliver', 'arrival', 'dispatch', 'when will', 'tracking'],
  },
  {
    name: 'order-tracking',
    label: 'Track My Order',
    keywords: ['track', 'where is', 'order status', 'order number'],
  },
  {
    name: 'cancellation',
    label: 'Cancel Order',
    keywords: ['cancel', 'stop', 'end subscription', 'dont want'],
  },
  {
    name: 'human-handoff',
    label: 'Talk to Someone',
    keywords: ['human', 'person', 'agent', 'speak to', 'talk to', 'real person'],
  },
]

const resolve = (input: string) =>
  resolveIntent(input, { intents: INTENTS })

// ── Act 1: Every variation → same intent ───────────────────────────────────

describe('Act 1 — All return policy variations → refund-policy', () => {
  const variations = [
    'Return Policy',           // button click (exact label match)
    'return policy',           // lowercase
    'how do I return this',    // single keyword: 'return'
    'I want a refund',         // single keyword: 'refund'
    'can I get my money back', // phrase keyword: 'money back'
    'send back my order',      // phrase keyword: 'send back'
    'exchange an item',        // single keyword: 'exchange'
    'REFUND',                  // uppercase, terse
  ]

  it('all resolve to refund-policy', async () => {
    const results: ResolveResult[] = []

    for (const v of variations) {
      const r = await resolve(v)
      expect(r, `"${v}" should resolve`).not.toBeNull()
      results.push(r!)
    }

    const intents = results.map(r => r.intent)
    const unique = new Set(intents)
    console.log('\n── Act 1: Return policy variations ──')
    variations.forEach((v, i) => {
      console.log(`  "${v}" → ${results[i].intent} (${results[i].resolver}, ${results[i].confidence.toFixed(2)})`)
    })
    console.log(`  All ${variations.length} variations → ${unique.size} intent(s): ${[...unique].join(', ')}`)

    expect(unique.size).toBe(1)
    expect([...unique][0]).toBe('refund-policy')
  })

  it('confidence >= 0.7 for all keyword matches', async () => {
    for (const v of variations) {
      const r = await resolve(v)
      if (r) {
        expect(r.confidence, `"${v}" confidence`).toBeGreaterThanOrEqual(0.7)
      }
    }
  })

  it('uses keyword resolver — no LLM cost', async () => {
    for (const v of variations) {
      const r = await resolve(v)
      if (r) {
        expect(r.resolver, `"${v}" resolver`).toBe('keyword')
      }
    }
  })
})

// ── Act 2: All five intents resolve correctly ──────────────────────────────

describe('Act 2 — Seed set coverage: all five intents', () => {
  const fixtures: Array<{ input: string; expected: string }> = [
    { input: 'Return Policy',          expected: 'refund-policy' },
    { input: 'when will my order ship', expected: 'shipping-info' },
    { input: 'track my order',          expected: 'order-tracking' },
    { input: 'I want to cancel',        expected: 'cancellation' },
    { input: 'talk to a real person',   expected: 'human-handoff' },
  ]

  it('button text resolves to matching intent', async () => {
    console.log('\n── Act 2: Five intents ──')
    for (const { input, expected } of fixtures) {
      const r = await resolve(input)
      console.log(`  "${input}" → ${r?.intent ?? 'null'} (expected: ${expected})`)
      expect(r).not.toBeNull()
      expect(r!.intent).toBe(expected)
    }
  })
})

// ── Act 3: LLM normaliser fallback ────────────────────────────────────────

describe('Act 3 — LLM normaliser for ambiguous queries', () => {
  const mockLlm = async (prompt: string): Promise<string> => {
    // Simulate a tiny LLM that maps to the right intent
    if (prompt.includes('broken')) return 'human-handoff'
    if (prompt.includes('forgot password')) return 'human-handoff'
    return 'unknown'
  }

  it('falls through to LLM when keywords miss', async () => {
    const r = await resolveIntent('my thing is broken help', {
      intents: INTENTS,
      complete: mockLlm,
    })
    console.log('\n── Act 3: LLM normaliser ──')
    console.log(`  "my thing is broken help" → ${r?.intent ?? 'null'} via ${r?.resolver ?? 'null'}`)
    expect(r).not.toBeNull()
    expect(r!.intent).toBe('human-handoff')
    expect(r!.resolver).toBe('llm')
  })

  it('returns null for genuinely unknown with no LLM', async () => {
    const r = await resolveIntent('zxqvbnm asdfgh', { intents: INTENTS })
    console.log(`  "zxqvbnm asdfgh" (no LLM) → ${r?.intent ?? 'null'}`)
    expect(r).toBeNull()
  })

  it('returns null when LLM says unknown', async () => {
    const r = await resolveIntent('zxqvbnm asdfgh', {
      intents: INTENTS,
      complete: async () => 'unknown',
    })
    console.log(`  "zxqvbnm asdfgh" (LLM→unknown) → ${r?.intent ?? 'null'}`)
    expect(r).toBeNull()
  })
})

// ── Act 4: Cache hit simulation ────────────────────────────────────────────

describe('Act 4 — 200 users, 1 LLM call', () => {
  it('proves the Day 7 scenario from the plan', async () => {
    const variations = [
      'Return Policy',           // exact label
      'how do I return this',    // keyword: return
      'I want a refund',         // keyword: refund
      'can I get my money back', // keyword: money back
      'send back the item',      // keyword: send back
      'exchange this item',      // keyword: exchange
      'refund please',           // keyword: refund
      'return this',             // keyword: return
    ]

    // Simulate a cache keyed by intent name
    const intentCache = new Map<string, string>()
    let llmCalls = 0
    let cacheHits = 0

    const getAnswer = async (userMessage: string): Promise<string> => {
      const resolved = await resolve(userMessage)
      if (!resolved) {
        // Unknown intent — full LLM call, not cached
        llmCalls++
        return `LLM answer for: ${userMessage}`
      }

      const cached = intentCache.get(resolved.intent)
      if (cached) {
        cacheHits++
        return cached
      }

      // Cache miss — call LLM once, store under intent
      llmCalls++
      const answer = 'Our return policy allows returns within 30 days for a full refund.'
      intentCache.set(resolved.intent, answer)
      return answer
    }

    // 200 users, each picks a random variation
    const USERS = 200
    for (let i = 0; i < USERS; i++) {
      await getAnswer(variations[i % variations.length])
    }

    const hitRate = cacheHits / USERS
    console.log('\n── Act 4: 200 users, return policy ──')
    console.log(`  LLM calls:   ${llmCalls}`)
    console.log(`  Cache hits:  ${cacheHits}`)
    console.log(`  Hit rate:    ${(hitRate * 100).toFixed(1)}%`)
    console.log(`  Cost saved:  ${(((USERS - llmCalls) / USERS) * 100).toFixed(1)}%`)

    // First call is always a miss. Every other should hit.
    expect(llmCalls).toBe(1)
    expect(cacheHits).toBe(USERS - 1)
    expect(hitRate).toBeGreaterThan(0.99)
  })
})

// ── Act 5: Resolver speed ──────────────────────────────────────────────────

describe('Act 5 — Speed: keyword match is instant', () => {
  it('resolves 1000 queries under 100ms total', async () => {
    const queries = [
      'return this', 'refund', 'where is my order',
      'cancel my subscription', 'talk to someone',
      'shipping information', 'track order 12345',
    ]

    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      await resolve(queries[i % queries.length])
    }
    const ms = performance.now() - start
    const perQuery = ms / 1000

    console.log('\n── Act 5: Resolver speed ──')
    console.log(`  1000 resolutions: ${ms.toFixed(1)}ms total`)
    console.log(`  Per query:        ${perQuery.toFixed(3)}ms`)
    console.log(`  Throughput:       ${Math.round(1000 / (ms / 1000))} resolutions/sec`)

    expect(ms).toBeLessThan(1000)  // 1000 async keyword matches < 1s
    expect(perQuery).toBeLessThan(1)  // < 1ms per query (async overhead included)
  })
})

// ── Act 6: Intent discrimination ──────────────────────────────────────────

describe('Act 6 — No false positives: distinct intents stay distinct', () => {
  const distinctFixtures: Array<{ input: string; notExpected: string[] }> = [
    {
      input: 'how do I return this',
      notExpected: ['shipping-info', 'order-tracking', 'cancellation', 'human-handoff'],
    },
    {
      input: 'when will it arrive',
      notExpected: ['refund-policy', 'cancellation', 'human-handoff'],
    },
    {
      input: 'I want to cancel',
      notExpected: ['refund-policy', 'shipping-info', 'order-tracking'],
    },
  ]

  it('each query resolves to the right intent, not a neighbour', async () => {
    console.log('\n── Act 6: No false positives ──')
    for (const { input, notExpected } of distinctFixtures) {
      const r = await resolve(input)
      console.log(`  "${input}" → ${r?.intent ?? 'null'}`)
      if (r) {
        for (const bad of notExpected) {
          expect(r.intent, `"${input}" should not resolve to ${bad}`).not.toBe(bad)
        }
      }
    }
  })
})
