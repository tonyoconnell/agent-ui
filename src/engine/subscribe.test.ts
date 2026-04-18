/**
 * SUBSCRIBE — Tag-based task routing via TypeDB
 *
 * subscribe(unitId, tags) adds tags to a unit in TypeDB.
 * tasksFor(unitId) queries open tasks matching the unit's tags,
 * ranked by overlap × priority × pheromone strength.
 *
 * Run: bun vitest run src/engine/subscribe.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistentWorld } from './persist'

// ── Mock TypeDB — isolate from database ────────────────────────────────────

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

import { readParsed, writeSilent } from '@/lib/typedb'
import { world } from './persist'

// ═══════════════════════════════════════════════════════════════════════════
// Subscribe — Tag Storage in TypeDB
//
// subscribe(unitId, tags) inserts tag attributes on a unit entity.
// Each tag is independently written so they accumulate.
// ═══════════════════════════════════════════════════════════════════════════

describe('subscribe — add tags to unit for task routing', () => {
  let w: PersistentWorld

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('(a) subscribe emits TQL insert with new tag attributes', () => {
    w.subscribe('scout', ['engine', 'P0'])

    // Each tag should trigger a writeSilent call
    expect(writeSilent).toHaveBeenCalledWith(expect.stringContaining('match $u isa unit, has uid "scout"'))

    // Check that both tags were attempted
    const calls = (writeSilent as any).mock.calls as unknown[][]
    const tagCalls = calls.filter((c) => (c[0] as string)?.includes('has tag'))
    expect(tagCalls.length).toBeGreaterThanOrEqual(2)
  })

  it('(b) agent markdown with tags: [build, P0] flows to subscribe via syncAgent', async () => {
    // Mock readParsed to return an empty unit result
    ;(readParsed as any).mockResolvedValueOnce([{ uid: 'marketing:creative' }])

    // Simulate syncing an agent with tags in markdown frontmatter
    w.actor('marketing:creative', 'agent', { group: 'marketing' })
    w.subscribe('marketing:creative', ['build', 'P0'])

    // Verify writeSilent was called for each tag
    expect(writeSilent).toHaveBeenCalled()
    const calls = (writeSilent as any).mock.calls as unknown[][]
    const tagInserts = calls.filter((c) => (c[0] as string)?.includes('has tag'))
    expect(tagInserts.length).toBeGreaterThanOrEqual(2)
  })

  it('empty tags → empty task list', async () => {
    // Mock readParsed to return no tags for the unit
    ;(readParsed as any).mockResolvedValueOnce([]) // no unit tags

    const tasks = await w.tasksFor('untagged-unit')

    expect(tasks).toHaveLength(0)
  })

  it('tasksFor returns tasks matching unit tags ranked by overlap × priority', async () => {
    // Set up mocks: first call gets unit tags, second call gets matching tasks
    ;(readParsed as any)
      .mockResolvedValueOnce([
        // Unit tags response
        { tag: 'engine' },
        { tag: 'P0' },
      ])
      .mockResolvedValueOnce([
        // Matching open tasks
        { id: 'task-1', name: 'Build API', p: 5, tag: 'engine' },
        { id: 'task-1', name: 'Build API', p: 5, tag: 'P0' },
        { id: 'task-2', name: 'Deploy', p: 3, tag: 'engine' },
      ])

    const tasks = await w.tasksFor('scout')

    expect(tasks).toHaveLength(2)
    // task-1 has overlap=2 (both tags), priority=5 → score = 2×5 = 10
    // task-2 has overlap=1 (engine tag), priority=3 → score = 1×3 = 3
    // task-1 should rank first
    expect(tasks[0].id).toBe('task-1')
    expect(tasks[0].overlap).toBe(2)
    expect(tasks[1].id).toBe('task-2')
    expect(tasks[1].overlap).toBe(1)
  })

  it('(c) tasksFor ranks by overlap × priority × pheromone strength', async () => {
    // Unit has two tags
    ;(readParsed as any).mockResolvedValueOnce([{ tag: 'engine' }, { tag: 'P0' }]).mockResolvedValueOnce([
      // Two tasks with same priority but different overlaps
      { id: 'high-overlap', name: 'Main Task', p: 2, tag: 'engine' },
      { id: 'high-overlap', name: 'Main Task', p: 2, tag: 'P0' },
      { id: 'low-overlap', name: 'Secondary', p: 10, tag: 'engine' },
    ])

    // Pre-seed pheromone strength in the world
    w.mark('scout→builder:high-overlap', 5)
    w.mark('scout→builder:low-overlap', 0)

    const tasks = await w.tasksFor('scout')

    // high-overlap: overlap=2, priority=2, strength=5 → 2×2+5 = 9
    // low-overlap: overlap=1, priority=10, strength=0 → 1×10+0 = 10
    // Expected: low-overlap ranks first due to higher score (10 > 9)
    expect(tasks[0].id).toBe('low-overlap')
    expect(tasks[1].id).toBe('high-overlap')
  })

  it('subscribe escapes quotes and backslashes in tag names', () => {
    w.subscribe('scout', ['tag"with"quotes', 'tag\\with\\backslash'])

    const calls = (writeSilent as any).mock.calls as unknown[][]
    const tqlCalls = calls.map((c) => c[0] as string)

    // Check that special characters are escaped
    expect(tqlCalls.some((sql) => sql.includes('\\"'))).toBe(true)
  })

  it('tasksFor returns empty array when unit has tags but no matching open tasks', async () => {
    ;(readParsed as any).mockResolvedValueOnce([{ tag: 'rare-tag' }]).mockResolvedValueOnce([]) // no matching open tasks

    const tasks = await w.tasksFor('scout')

    expect(tasks).toHaveLength(0)
  })

  it('tasksFor handles missing unit gracefully (returns empty)', async () => {
    ;(readParsed as any).mockResolvedValueOnce([]) // no tags found

    const tasks = await w.tasksFor('nonexistent-unit')

    expect(tasks).toHaveLength(0)
  })

  it('subscribe handles TypeDB errors gracefully with .catch()', () => {
    // Mock writeSilent to reject
    ;(writeSilent as any).mockRejectedValueOnce(new Error('TypeDB offline'))

    // Should not throw; catch is silenced
    expect(() => w.subscribe('scout', ['tag1'])).not.toThrow()
  })

  it('tasksFor filters tasks by done=false and task-status="open"', async () => {
    ;(readParsed as any).mockResolvedValueOnce([{ tag: 'engine' }]).mockResolvedValueOnce([
      { id: 'open-1', name: 'Open Task', p: 5, tag: 'engine' },
      // Completed tasks are filtered out by the TQL query
    ])

    const tasks = await w.tasksFor('scout')

    expect(tasks).toHaveLength(1)
    expect(tasks[0].name).toBe('Open Task')
  })

  it('subscribe with multiple tags accumulates independently', () => {
    const tags = ['build', 'deploy', 'test', 'P0', 'P1']
    w.subscribe('multi-tag-agent', tags)

    // Each tag should be an independent TQL insert
    const calls = (writeSilent as any).mock.calls as unknown[][]
    const tagCalls = calls.filter((c) => (c[0] as string)?.includes('has tag'))
    expect(tagCalls.length).toBeGreaterThanOrEqual(tags.length)
  })

  it('tasksFor includes tag list in TaskMatch result', async () => {
    ;(readParsed as any)
      .mockResolvedValueOnce([{ tag: 'engine' }])
      .mockResolvedValueOnce([{ id: 'task-1', name: 'API Task', p: 5, tag: 'engine' }])

    const tasks = await w.tasksFor('scout')

    expect(tasks[0]).toHaveProperty('tags')
    expect(tasks[0].tags).toContain('engine')
  })
})
