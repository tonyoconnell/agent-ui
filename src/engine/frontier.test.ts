/**
 * FRONTIER — Unexplored Tag Clusters (L7)
 *
 * persist().frontier(uid) returns world tags minus tags the actor has touched via paths.
 * This test verifies frontier detection: fresh actors see all world tags, touched tags fade
 * from frontier, wave-specific frontiers detect (tag, wave) pairs never executed.
 *
 * Run: bun vitest run src/engine/frontier.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistentWorld } from './persist'

vi.mock('@/lib/typedb', () => ({
  read: vi.fn().mockResolvedValue('[]'),
  readParsed: vi.fn().mockResolvedValue([]),
  writeSilent: vi.fn().mockResolvedValue(undefined),
  parseAnswers: vi.fn().mockReturnValue([]),
}))

vi.mock('./bridge', () => ({
  mirrorMark: vi.fn().mockResolvedValue(undefined),
  mirrorWarn: vi.fn().mockResolvedValue(undefined),
  mirrorActor: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./context', () => ({
  ingestDocs: vi.fn().mockResolvedValue(0),
  loadContext: vi.fn().mockReturnValue(''),
}))

import { readParsed } from '@/lib/typedb'
import { world } from './persist'

describe('Frontier Detection (L7)', () => {
  let w: PersistentWorld

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  // ───────────────────────────────────────────────────────────────────────
  // Test 1: Fresh actor on populated world returns all world tags
  // ───────────────────────────────────────────────────────────────────────
  it('frontier(uid) on fresh actor returns all world tags', async () => {
    // Mock: world has 5 skills with tags [build, deploy, test, docs, review]
    const worldTags = ['build', 'deploy', 'test', 'docs', 'review']
    const mockWorldSkills = worldTags.map((tag) => ({ t: tag }))

    ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((query: string) => {
      // Match world tags query
      if (query.includes('match $sk isa skill, has tag $t; select $t;')) {
        return Promise.resolve(mockWorldSkills)
      }
      // Match actor tags query (no paths yet for fresh actor)
      if (query.includes('(source: $u, target: $to) isa path')) {
        return Promise.resolve([])
      }
      return Promise.resolve([])
    })

    w.actor('scout')
    const frontier = await w.frontier('scout')

    expect(frontier).toHaveLength(5)
    expect(frontier.sort()).toEqual(['build', 'deploy', 'docs', 'review', 'test'])
  })

  // ───────────────────────────────────────────────────────────────────────
  // Test 2: After signals on tag X, X is no longer in frontier
  // ───────────────────────────────────────────────────────────────────────
  it('after signals on tag X, X is no longer in frontier', async () => {
    const worldTags = ['build', 'deploy', 'test']
    const mockWorldSkills = worldTags.map((tag) => ({ t: tag }))

    // Track which queries are being made
    let callCount = 0

    ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((query: string) => {
      callCount++

      // World tags query
      if (query.includes('match $sk isa skill, has tag $t; select $t;')) {
        return Promise.resolve(mockWorldSkills)
      }

      // Actor paths query (after touch, returns 'deploy' as touched tag)
      if (query.includes('(source: $u, target: $to) isa path')) {
        // After 1st call (fresh), 2nd call should show touched tags
        if (callCount > 2) {
          return Promise.resolve([{ t: 'deploy' }])
        }
        return Promise.resolve([])
      }

      return Promise.resolve([])
    })

    w.actor('alice')

    // First frontier call: fresh actor, all tags
    let frontier = await w.frontier('alice')
    expect(frontier).toHaveLength(3)

    // Simulate signal on 'deploy' (mark path from alice to deploy target)
    w.flow('alice', 'deployment-agent').strengthen(1) // touched 'deploy' tag indirectly

    // Reset mock to track next call
    ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((query: string) => {
      if (query.includes('match $sk isa skill, has tag $t; select $t;')) {
        return Promise.resolve(mockWorldSkills)
      }
      // Return 'deploy' as touched
      if (query.includes('(source: $u, target: $to) isa path')) {
        return Promise.resolve([{ t: 'deploy' }])
      }
      return Promise.resolve([])
    })

    // Second frontier call: deploy is now touched
    frontier = await w.frontier('alice')
    expect(frontier).toHaveLength(2)
    expect(frontier).not.toContain('deploy')
    expect(frontier.sort()).toEqual(['build', 'test'])
  })

  // ───────────────────────────────────────────────────────────────────────
  // Test 3: Wave-specific frontier: unit touched tag Y at W1 but not W2
  // ───────────────────────────────────────────────────────────────────────
  it('wave-specific frontier: tag touched at W1 but not W2 remains frontier', async () => {
    const worldTags = ['compute', 'validate', 'finalize']
    const mockWorldSkills = worldTags.map((tag) => ({ t: tag }))

    // First frontier call: W1 touched 'compute'
    ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((query: string) => {
      if (query.includes('match $sk isa skill, has tag $t; select $t;')) {
        return Promise.resolve(mockWorldSkills)
      }
      // Return 'compute' as touched (W1 execution)
      if (query.includes('(source: $u, target: $to) isa path')) {
        return Promise.resolve([{ t: 'compute' }])
      }
      return Promise.resolve([])
    })

    w.actor('processor')
    const frontier = await w.frontier('processor')

    // After W1: 'compute' touched, but 'validate' and 'finalize' remain frontier
    expect(frontier).toContain('validate')
    expect(frontier).toContain('finalize')
    expect(frontier).not.toContain('compute')
  })

  // ───────────────────────────────────────────────────────────────────────
  // Test 4: Empty world returns empty frontier
  // ───────────────────────────────────────────────────────────────────────
  it('empty world with no skills returns empty frontier', async () => {
    // World has no skills
    ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((query: string) => {
      if (query.includes('match $sk isa skill, has tag $t; select $t;')) {
        return Promise.resolve([]) // no skills, no tags
      }
      if (query.includes('(source: $u, target: $to) isa path')) {
        return Promise.resolve([])
      }
      return Promise.resolve([])
    })

    w.actor('lonely')
    const frontier = await w.frontier('lonely')

    expect(frontier).toHaveLength(0)
    expect(frontier).toEqual([])
  })
})
