import { describe, it, expect } from 'vitest'
import { classify, classifyWithConfidence } from '../src/lib/tag-classifier'

describe('classify()', () => {
  it('rank + google → marketing/seo/ranking', () => {
    const tags = classify('How do I rank my site on Google?')
    expect(tags[0]).toBe('marketing')
    expect(tags).toContain('seo')
    expect(tags).toContain('ranking')
  })

  it('headline → marketing/copy', () => {
    const tags = classify('Can you write a headline for my landing page?')
    expect(tags[0]).toBe('marketing')
    expect(tags).toContain('copy')
  })

  it('facebook ad + CTR → marketing/ads/analytics', () => {
    const tags = classify('My Facebook ad campaign has low CTR')
    expect(tags[0]).toBe('marketing')
    expect(tags).toContain('ads')
    expect(tags).toContain('analytics')
  })

  it('CI pipeline → dev (domain-only)', () => {
    const tags = classify('Set up a CI pipeline')
    expect(tags[0]).toBe('dev')
  })

  it('random nonsense → general', () => {
    expect(classify('random nonsense 12345')).toEqual(['general'])
  })

  it('empty string → general', () => {
    expect(classify('')).toEqual(['general'])
  })

  it('pure punctuation → general', () => {
    expect(classify('!!! ??? ...')).toEqual(['general'])
  })

  it('non-string-like (cast) → general', () => {
    // @ts-expect-error — verify zero-return behavior on bad input
    expect(classify(null)).toEqual(['general'])
    // @ts-expect-error — verify zero-return behavior on bad input
    expect(classify(undefined)).toEqual(['general'])
  })

  it('is deterministic: same input → same output', () => {
    const a = classify('rank my site on google with keywords')
    const b = classify('rank my site on google with keywords')
    expect(a).toEqual(b)
  })

  it('case-insensitive', () => {
    const a = classify('RANK on GOOGLE with KEYWORDS')
    const b = classify('rank on google with keywords')
    expect(a).toEqual(b)
  })

  it('strips punctuation', () => {
    const tags = classify('rank!!! my site, on: google?')
    expect(tags).toContain('seo')
  })

  it('multi-word keyword "facebook ads" matches as phrase', () => {
    const tags = classify('my facebook ads performance is bad')
    expect(tags[0]).toBe('marketing')
    expect(tags).toContain('ads')
  })

  it('multi-word "local seo" → marketing/citation', () => {
    const tags = classify('need help with local seo for my business')
    expect(tags[0]).toBe('marketing')
    expect(tags).toContain('citation')
  })

  it('ops keywords → ops domain', () => {
    const tags = classify('incident alert on the monitor')
    expect(tags[0]).toBe('ops')
  })

  it('support keywords → support domain', () => {
    const tags = classify('customer wants a refund, billing issue')
    expect(tags[0]).toBe('support')
  })
})

describe('classifyWithConfidence()', () => {
  it('strong marketing signal → confidence >= 0.5', () => {
    const r = classifyWithConfidence('rank my site on google, keyword research needed')
    expect(r.tags[0]).toBe('marketing')
    expect(r.tags).toContain('seo')
    expect(r.confidence).toBeGreaterThanOrEqual(0.5)
    expect(r.matchedKeywords).toEqual(expect.arrayContaining(['rank', 'google', 'keyword']))
  })

  it('hello → general with 0 confidence', () => {
    const r = classifyWithConfidence('hello')
    expect(r).toEqual({ tags: ['general'], confidence: 0, matchedKeywords: [] })
  })

  it('confidence is 0..1', () => {
    const r = classifyWithConfidence('rank rank rank google google keyword')
    expect(r.confidence).toBeGreaterThanOrEqual(0)
    expect(r.confidence).toBeLessThanOrEqual(1)
  })

  it('matchedKeywords sorted alphabetically (deterministic)', () => {
    const r = classifyWithConfidence('google rank keyword serp')
    const copy = [...r.matchedKeywords].sort()
    expect(r.matchedKeywords).toEqual(copy)
  })

  it('no-match → confidence is 0 exactly', () => {
    const r = classifyWithConfidence('xyzzy plover frobnicate')
    expect(r.confidence).toBe(0)
  })

  it('below 0.4 threshold for weak signal (routes to LLM)', () => {
    // single weak hit in a long message
    const r = classifyWithConfidence(
      'i was thinking about maybe eventually possibly perhaps looking into a small blog thing whenever i get time'
    )
    // "blog" hits → content tag — but short vs. long message; confidence should be low-ish
    expect(r.confidence).toBeLessThan(0.4)
  })

  it('above 0.4 threshold for strong signal (routes directly)', () => {
    const r = classifyWithConfidence('seo ranking google keywords serp backlinks')
    expect(r.confidence).toBeGreaterThanOrEqual(0.4)
  })
})

describe('classify() performance', () => {
  it('1000 calls p50 < 0.1ms', () => {
    const msg = 'How do I rank my site on Google with better keywords and backlinks?'
    // warm up JIT
    for (let i = 0; i < 100; i++) classify(msg)

    const samples: number[] = []
    for (let i = 0; i < 1000; i++) {
      const t0 = performance.now()
      classify(msg)
      samples.push(performance.now() - t0)
    }
    samples.sort((a, b) => a - b)
    const p50 = samples[Math.floor(samples.length * 0.5)]
    const p95 = samples[Math.floor(samples.length * 0.95)]
    // Report so CI has a visible signal.
    // eslint-disable-next-line no-console
    console.log(`classify() p50=${p50.toFixed(4)}ms p95=${p95.toFixed(4)}ms`)
    expect(p50).toBeLessThan(0.1)
  })
})
