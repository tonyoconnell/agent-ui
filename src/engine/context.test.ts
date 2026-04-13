/**
 * context.test.ts — Tests for the context loading system.
 *
 * Uses the real filesystem (docs/ exists in the repo).
 * Only @/lib/typedb is mocked — its TypeDB connection is irrelevant here.
 */

import { describe, expect, it, vi } from 'vitest'

// Mock TypeDB before importing context (writeSilent is only used in ingestDocs)
vi.mock('@/lib/typedb', () => ({
  writeSilent: vi.fn().mockResolvedValue(undefined),
}))

import { CANONICAL, contextForSkill, type DocKey, docIndex, inferDocsFromTags, loadContext, readDoc, resolveContext } from './context'

// ─── CANONICAL mapping ───────────────────────────────────────────────────────

describe('CANONICAL', () => {
  it('has all 8 keys', () => {
    const keys: DocKey[] = ['routing', 'dsl', 'dictionary', 'metaphors', 'sdk', 'nanoclaw', 'loops', 'patterns']
    for (const key of keys) {
      expect(CANONICAL).toHaveProperty(key)
    }
  })

  it('each value is a .md filename', () => {
    for (const value of Object.values(CANONICAL)) {
      expect(value).toMatch(/\.md$/)
    }
  })
})

// ─── readDoc ─────────────────────────────────────────────────────────────────

describe('readDoc', () => {
  it('returns string content for an existing doc', () => {
    const content = readDoc('DSL.md')
    expect(typeof content).toBe('string')
    expect(content!.length).toBeGreaterThan(0)
  })

  it('returns null for a nonexistent doc', () => {
    const result = readDoc('nonexistent-doc-that-does-not-exist.md')
    expect(result).toBeNull()
  })

  it('accepts name without .md extension', () => {
    const withExt = readDoc('DSL.md')
    const withoutExt = readDoc('DSL')
    expect(withExt).toEqual(withoutExt)
  })
})

// ─── loadContext ─────────────────────────────────────────────────────────────

describe('loadContext', () => {
  it('returns empty string for empty array', () => {
    expect(loadContext([])).toBe('')
  })

  it('returns empty string when all docs are missing', () => {
    const result = loadContext(['nonexistent-xyz'])
    expect(result).toBe('')
  })

  it('loads dsl and contains DSL content', () => {
    const result = loadContext(['dsl'])
    expect(result).toContain('DSL')
  })

  it('loads multiple docs separated by ---', () => {
    const result = loadContext(['dsl', 'dictionary'])
    expect(result).toContain('---')
    // Both doc filenames appear as section headers
    expect(result).toContain('DSL.md')
    expect(result).toContain('dictionary.md')
  })

  it('silently skips nonexistent docs and returns the valid ones', () => {
    const result = loadContext(['nonexistent-xyz', 'dsl'])
    // Should contain dsl content but no separator for the missing doc
    expect(result).toContain('DSL')
    expect(result).not.toContain('nonexistent')
  })
})

// ─── contextForSkill ─────────────────────────────────────────────────────────

describe('contextForSkill', () => {
  it('"routing" → loads routing + dsl', () => {
    const result = contextForSkill('routing')
    expect(result).toContain('routing.md')
    expect(result).toContain('DSL.md')
  })

  it('"mark" → loads routing + dsl', () => {
    const result = contextForSkill('mark')
    expect(result).toContain('routing.md')
    expect(result).toContain('DSL.md')
  })

  it('"unknown-skill" → falls back to dsl only', () => {
    const result = contextForSkill('unknown-skill')
    expect(result).toContain('DSL.md')
    // routing.md should not appear as a section header (only dsl is loaded)
    expect(result).not.toMatch(/^# routing\.md/m)
  })

  it('"deploy" → loads nanoclaw', () => {
    const result = contextForSkill('deploy')
    expect(result).toContain('nanoclaw.md')
  })

  it('"metaphor" → loads metaphors + dictionary', () => {
    const result = contextForSkill('metaphor')
    expect(result).toContain('metaphors.md')
    expect(result).toContain('dictionary.md')
  })
})

// ─── docIndex ────────────────────────────────────────────────────────────────

describe('docIndex', () => {
  it('returns an array of DocMeta objects', () => {
    const index = docIndex()
    expect(Array.isArray(index)).toBe(true)
    expect(index.length).toBeGreaterThan(0)
  })

  it('each entry has name, title, description, lines', () => {
    const index = docIndex()
    for (const doc of index) {
      expect(typeof doc.name).toBe('string')
      expect(typeof doc.title).toBe('string')
      expect(typeof doc.description).toBe('string')
      expect(typeof doc.lines).toBe('number')
      expect(doc.lines).toBeGreaterThan(0)
    }
  })

  it('excludes TODO-* files', () => {
    const index = docIndex()
    const todoFiles = index.filter((d) => d.name.startsWith('TODO'))
    expect(todoFiles).toHaveLength(0)
  })

  it('excludes PLAN-* files', () => {
    const index = docIndex()
    const planFiles = index.filter((d) => d.name.startsWith('PLAN'))
    expect(planFiles).toHaveLength(0)
  })

  it('includes DSL.md', () => {
    const index = docIndex()
    const dsl = index.find((d) => d.name === 'DSL.md')
    expect(dsl).toBeDefined()
    expect(dsl!.lines).toBeGreaterThan(10)
  })
})

// ─── inferDocsFromTags ──────────────────────────────────────────────────────

describe('inferDocsFromTags', () => {
  it('always includes dsl and dictionary as base context', () => {
    const docs = inferDocsFromTags([])
    expect(docs).toContain('dsl')
    expect(docs).toContain('dictionary')
  })

  it('maps engine tag to dsl + routing', () => {
    const docs = inferDocsFromTags(['engine'])
    expect(docs).toContain('dsl')
    expect(docs).toContain('routing')
  })

  it('maps ui tag to dictionary', () => {
    const docs = inferDocsFromTags(['ui'])
    expect(docs).toContain('dictionary')
  })

  it('maps commerce tag to sdk', () => {
    const docs = inferDocsFromTags(['commerce'])
    expect(docs).toContain('sdk')
  })

  it('merges docs from multiple tags without duplicates', () => {
    const docs = inferDocsFromTags(['engine', 'routing', 'test'])
    const unique = new Set(docs)
    expect(docs.length).toBe(unique.size) // no duplicates
    expect(docs).toContain('routing')
    expect(docs).toContain('patterns')
  })

  it('unknown tags still get base context', () => {
    const docs = inferDocsFromTags(['nonexistent-tag'])
    expect(docs).toContain('dsl')
    expect(docs).toContain('dictionary')
    expect(docs.length).toBe(2) // only base
  })
})

// ─── resolveContext ─────────────────────────────────────────────────────────

describe('resolveContext', () => {
  it('returns docs string from tags', async () => {
    const ctx = await resolveContext({ tags: ['engine'] })
    expect(ctx.docs).toContain('DSL')
    expect(ctx.hypotheses).toEqual([])
    expect(ctx.highways).toEqual([])
  })

  it('passes exit condition through', async () => {
    const ctx = await resolveContext({ tags: [], exit: 'all tests pass', blocks: ['other-task'] })
    expect(ctx.exit).toBe('all tests pass')
    expect(ctx.unblocks).toEqual(['other-task'])
  })

  it('filters highways by task tags', async () => {
    const mockNet = {
      highways: () => [
        { path: 'entry→engine:build', strength: 50 },
        { path: 'entry→ui:render', strength: 30 },
      ],
    }
    const ctx = await resolveContext({ tags: ['engine'] }, mockNet)
    expect(ctx.highways.length).toBe(1)
    expect(ctx.highways[0].path).toContain('engine')
  })
})
