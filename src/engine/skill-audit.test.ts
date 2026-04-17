import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auditSkills } from './skill-audit'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
}))

import { readParsed } from '@/lib/typedb'

const mockReadParsed = vi.mocked(readParsed)

beforeEach(() => {
  vi.clearAllMocks()
})

// ── helpers ──────────────────────────────────────────────────────────────

function capRow(uid: string, sid: string, tag: string, price = 0.1) {
  return { uid, sid, sname: sid, price, stag: tag }
}

function pathRow(tuid: string, s: number) {
  return { tuid, s }
}

// ── tests ─────────────────────────────────────────────────────────────────

describe('auditSkills', () => {
  it('returns acquire when tags array is empty', async () => {
    const result = await auditSkills([])
    expect(result.recommendation).toBe('acquire')
    expect(result.capable).toHaveLength(0)
    expect(result.acquisition?.kind).toBeDefined()
  })

  it('strips invalid tags and acquires when all are stripped', async () => {
    // SQL-injection-style tag — function returns early, no DB call
    const result = await auditSkills(["'; DROP TABLE units; --"])
    expect(result.recommendation).toBe('acquire')
    expect(result.tags).toHaveLength(0)
  })

  it('returns acquire when no providers match the tags', async () => {
    mockReadParsed.mockResolvedValueOnce([])
    const result = await auditSkills(['copy', 'creative'])
    expect(result.recommendation).toBe('acquire')
    expect(result.capable).toHaveLength(0)
    expect(result.acquisition?.suggestedTaskId).toContain('copy')
  })

  it('returns exploratory when provider found but path is cold', async () => {
    // cap query returns a match; path query returns nothing (cold path)
    mockReadParsed.mockResolvedValueOnce([capRow('donal', 'copy-skill', 'copy', 0.02)]).mockResolvedValueOnce([]) // no path row
    const result = await auditSkills(['copy'], { requesterUid: 'marketing:cmo' })
    expect(result.recommendation).toBe('exploratory')
    expect(result.best?.providerUid).toBe('donal')
    expect(result.best?.pathStrength).toBe(0)
  })

  it('returns ready when provider has strong path (strength >= 50)', async () => {
    mockReadParsed
      .mockResolvedValueOnce([capRow('donal', 'copy-skill', 'copy', 0.02)])
      .mockResolvedValueOnce([pathRow('donal', 100)])
    const result = await auditSkills(['copy'], { requesterUid: 'marketing:cmo' })
    expect(result.recommendation).toBe('ready')
    expect(result.best?.pathStrength).toBe(100)
  })

  it('filters out providers above budget', async () => {
    mockReadParsed.mockResolvedValueOnce([capRow('expensive', 'copy-skill', 'copy', 2.0)])
    const result = await auditSkills(['copy'], { budget: 0.5 })
    expect(result.recommendation).toBe('acquire')
    expect(result.capable).toHaveLength(0)
  })

  it('aggregates matching tags per (uid, sid) pair', async () => {
    mockReadParsed.mockResolvedValueOnce([
      capRow('donal', 'copy-skill', 'copy', 0.02),
      capRow('donal', 'copy-skill', 'creative', 0.02), // same pair, second tag
    ])
    const result = await auditSkills(['copy', 'creative'])
    expect(result.capable[0].matchingTags).toHaveLength(2)
    expect(result.capable[0].tagOverlap).toBe(1) // 2/2
  })

  it('ranks higher tag overlap above cheaper price', async () => {
    mockReadParsed.mockResolvedValueOnce([
      capRow('cheap-one', 'skill-a', 'copy', 0.01),
      capRow('full-match', 'skill-b', 'copy', 0.05),
      capRow('full-match', 'skill-b', 'creative', 0.05),
    ])
    const result = await auditSkills(['copy', 'creative'])
    expect(result.best?.providerUid).toBe('full-match')
  })

  it('suggests import kind for corpus/ingest tags', async () => {
    mockReadParsed.mockResolvedValueOnce([])
    const result = await auditSkills(['corpus', 'ingest'])
    expect(result.acquisition?.kind).toBe('import')
  })

  it('suggests hire kind for marketplace tags', async () => {
    mockReadParsed.mockResolvedValueOnce([])
    const result = await auditSkills(['agency', 'vendor'])
    expect(result.acquisition?.kind).toBe('hire')
  })
})
