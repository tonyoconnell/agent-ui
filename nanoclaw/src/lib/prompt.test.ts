import { describe, expect, it } from 'vitest'
import { systemPromptWithPack } from './prompt'
import type { ContextPack } from '../units/types'

const emptyPack = (): ContextPack => ({
  profile: { uid: 'telegram:42', handle: '@alice', messageCount: 0 },
  hypotheses: [],
  highways: [],
  recent: [],
  tools: [],
})

describe('systemPromptWithPack', () => {
  it('returns base prompt unchanged when pack has no memory', () => {
    const base = 'You are a helpful assistant.'
    const result = systemPromptWithPack(base, emptyPack())
    expect(result).toBe(base)
  })

  it('prepends memory block when hypotheses present', () => {
    const pack = emptyPack()
    pack.hypotheses = [{ predicate: 'prefers', object: 'code-examples', confidence: 0.9 }]
    const result = systemPromptWithPack('You are helpful.', pack)
    expect(result).toContain('--- MEMORY ---')
    expect(result).toContain('prefers: code-examples')
    expect(result).toContain('You are helpful.')
  })

  it('excludes low-confidence hypotheses from memory block', () => {
    const pack = emptyPack()
    pack.hypotheses = [
      { predicate: 'prefers', object: 'typescript', confidence: 0.9 },
      { predicate: 'struggles-with', object: 'generics', confidence: 0.2 },
    ]
    const result = systemPromptWithPack('Base.', pack)
    expect(result).toContain('typescript')
    expect(result).not.toContain('generics')
  })

  it('includes top 5 highways', () => {
    const pack = emptyPack()
    pack.highways = [
      { to: 'seo', strength: 18 },
      { to: 'code', strength: 12 },
      { to: 'writing', strength: 8 },
      { to: 'marketing', strength: 6 },
      { to: 'research', strength: 4 },
      { to: 'data', strength: 2 }, // 6th — should be excluded
    ]
    const result = systemPromptWithPack('Base.', pack)
    expect(result).toContain('seo')
    expect(result).not.toContain('data')
  })

  it('shows tools when available', () => {
    const pack = emptyPack()
    pack.highways = [{ to: 'code', strength: 10 }]
    pack.tools = ['classify', 'valence']
    const result = systemPromptWithPack('Base.', pack)
    expect(result).toContain('classify, valence')
  })
})
