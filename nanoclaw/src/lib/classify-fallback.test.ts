import { describe, expect, it } from 'vitest'
import { classify, detectValence } from './classify-fallback'

describe('classify', () => {
  it('returns [general] for unrecognized input', () => {
    expect(classify('random words xyz')).toEqual(['general'])
  })

  it('tags TypeScript questions', () => {
    const tags = classify('How do I fix this TypeScript error?')
    expect(tags).toContain('typescript')
    expect(tags).toContain('code')
    expect(tags).toContain('question')
  })

  it('tags corrections', () => {
    const tags = classify("No, that's wrong actually")
    expect(tags).toContain('correction')
  })

  it('tags positive feedback', () => {
    const tags = classify('Thanks, that was perfect!')
    expect(tags).toContain('positive')
  })

  it('tags greetings', () => {
    const tags = classify('Hello there!')
    expect(tags).toContain('greeting')
  })

  it('tags SEO content', () => {
    const tags = classify('Write a blog post about SEO keyword ranking')
    expect(tags).toContain('seo')
    expect(tags).toContain('writing')
  })

  it('tags substrate signals', () => {
    const tags = classify('emit a signal to mark this path')
    expect(tags).toContain('substrate')
  })

  it('caps at 5 tags', () => {
    const tags = classify('TypeScript code test deploy debug agent substrate seo marketing')
    expect(tags.length).toBeLessThanOrEqual(5)
  })
})

describe('detectValence', () => {
  it('returns 0 for neutral messages', () => {
    expect(detectValence('Can you help me with this?')).toBe(0.0)
  })

  it('returns negative for corrections', () => {
    expect(detectValence("No, that's wrong")).toBe(-0.8)
    expect(detectValence('Actually, I meant something else')).toBe(-0.8)
  })

  it('returns positive for engagement', () => {
    expect(detectValence('Perfect, thanks!')).toBe(0.8)
    expect(detectValence('Yes! Exactly right')).toBe(0.8)
  })

  it('leans negative for mixed signal (correction + thanks)', () => {
    const v = detectValence("Thanks but actually that's wrong")
    expect(v).toBeLessThan(0)
  })
})
