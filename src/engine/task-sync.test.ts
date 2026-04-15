/**
 * TASK-SYNC — Syncing parsed tasks to TypeDB
 *
 * This test suite covers:
 * - Task entity parsing from markdown
 * - TQL insert generation
 * - Blocks relation creation
 * - Status updates
 * - Tag extraction and application
 *
 * Run: bun vitest run src/engine/task-sync.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Task } from './task-parse'

// ── Mock TypeDB — isolate task-sync.ts from the database ──────────────────────

vi.mock('@/lib/typedb', () => ({
  read: vi.fn().mockResolvedValue('[]'),
  readParsed: vi.fn().mockResolvedValue([]),
  writeSilent: vi.fn().mockResolvedValue(undefined),
  write: vi.fn().mockResolvedValue(undefined),
  parseAnswers: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/ws-server', () => ({
  wsManager: { broadcast: vi.fn() },
  relayToGateway: vi.fn(),
}))

import { readParsed, write, writeSilent } from '@/lib/typedb'
import { relayToGateway, wsManager } from '@/lib/ws-server'
import { markTaskDone, selfCheckoff, syncTasks, taskBlockers } from './task-sync'

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: renderTaskInsert — TQL generation for single task
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 1: Task TQL Insert Generation', () => {
  const mockTask: Task = {
    id: 'test-task-1',
    name: 'Build API endpoint',
    done: false,
    value: 'high',
    effort: 'medium',
    wave: 'W3',
    phase: 'BUILD',
    persona: 'sonnet',
    context: ['api', 'routing'],
    blocks: [],
    exit: 'All tests pass',
    tags: ['api', 'build', 'P0'],
    source: 'docs/TODO-test.md',
    line: 42,
    priority: 8.5,
    formula: 'effort(3) × value(4) + tags(1.5)',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts task entity with all required fields', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)
    await syncTasks([mockTask])

    expect(write).toHaveBeenCalled()
    const tql = vi.mocked(write).mock.calls[0][0] as string

    // Check for task entity with critical fields
    expect(tql).toContain('isa task')
    expect(tql).toContain(`task-id "test-task-1"`)
    expect(tql).toContain(`name "Build API endpoint"`)
    expect(tql).toContain(`task-status "open"`)
    expect(tql).toContain(`task-value "high"`)
    expect(tql).toContain(`task-effort "medium"`)
    expect(tql).toContain(`task-phase "BUILD"`)
    expect(tql).toContain(`task-persona "sonnet"`)
  })

  it('creates corresponding skill entity for capability routing', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)
    await syncTasks([mockTask])

    const tql = vi.mocked(write).mock.calls[0][0] as string

    // Check for skill entity
    expect(tql).toContain('isa skill')
    expect(tql).toContain(`skill-id "test-task-1"`)
    expect(tql).toContain(`price 0.0`)
  })

  it('creates capability relation (provider: builder, offered: skill)', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)
    await syncTasks([mockTask])

    const tql = vi.mocked(write).mock.calls[0][0] as string

    // Capability relation
    expect(tql).toContain('isa capability')
    expect(tql).toContain('provider:')
    expect(tql).toContain('offered:')
  })

  it('applies all tags to both task and skill entities', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)
    await syncTasks([mockTask])

    const tql = vi.mocked(write).mock.calls[0][0] as string

    // Tags should appear multiple times: on task and skill
    const apiMatches = (tql.match(/has tag "api"/g) || []).length
    expect(apiMatches).toBeGreaterThanOrEqual(2) // at least on task and skill
  })

  it('marks task as done when done=true', async () => {
    const doneTask: Task = { ...mockTask, done: true }
    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)
    await syncTasks([doneTask])

    const tql = vi.mocked(write).mock.calls[0][0] as string
    expect(tql).toContain('task-status "done"')
  })

  it('escapes special characters in name and context', async () => {
    const escapedTask: Task = {
      ...mockTask,
      name: 'Fix "quote" issue',
      context: ['path\\with\\backslash'],
    }
    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)
    await syncTasks([escapedTask])

    const tql = vi.mocked(write).mock.calls[0][0] as string
    // Should contain escaped quotes and backslashes
    expect(tql).toContain('\\"quote\\"')
  })

  it('includes exit condition when present', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)
    await syncTasks([mockTask])

    const tql = vi.mocked(write).mock.calls[0][0] as string
    expect(tql).toContain('exit-condition')
    expect(tql).toContain('All tests pass')
  })

  it('omits exit condition when empty', async () => {
    const noExitTask: Task = { ...mockTask, exit: '' }
    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)
    await syncTasks([noExitTask])

    const tql = vi.mocked(write).mock.calls[0][0] as string
    // Should not contain exit-condition attribute
    expect(tql).not.toContain('exit-condition ""')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: syncTasks — Batch task insertion, skip duplicates, error resilience
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 2: syncTasks — Batch insertion with duplicate skipping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls ensureBuilder to create system builder unit', async () => {
    vi.mocked(readParsed).mockResolvedValue([])
    vi.mocked(write).mockResolvedValue(undefined)

    await syncTasks([])

    // writeSilent called during ensureBuilder
    expect(writeSilent).toHaveBeenCalledWith(expect.stringContaining('isa unit'))
    expect(writeSilent).toHaveBeenCalledWith(expect.stringContaining('uid "builder"'))
  })

  it('skips tasks that already exist in TypeDB', async () => {
    const task1: Task = {
      id: 'existing-task',
      name: 'Already synced',
      done: false,
      value: 'medium',
      effort: 'small',
      wave: 'W2',
      phase: 'PLAN',
      persona: 'haiku',
      context: [],
      blocks: [],
      exit: '',
      tags: [],
      source: 'docs/TODO.md',
      line: 10,
      priority: 5,
      formula: 'base',
    }

    const task2: Task = {
      id: 'new-task',
      name: 'Not yet synced',
      done: false,
      value: 'high',
      effort: 'medium',
      wave: 'W3',
      phase: 'BUILD',
      persona: 'sonnet',
      context: [],
      blocks: [],
      exit: '',
      tags: [],
      source: 'docs/TODO.md',
      line: 20,
      priority: 7,
      formula: 'base',
    }

    // Simulate: existing-task already in TypeDB
    vi.mocked(readParsed).mockResolvedValueOnce([{ id: 'existing-task' }])

    await syncTasks([task1, task2])

    // write() called (not writeSilent) — should only insert task2
    const writeCalls = vi.mocked(write).mock.calls
    const insertCall = writeCalls.find((call) => (call[0] as string).includes('insert'))
    expect(insertCall?.[0]).toContain('new-task')
    expect(insertCall?.[0]).not.toContain('existing-task')
  })

  it('returns counts: synced + blocks + errors', async () => {
    const tasks: Task[] = [
      {
        id: 'task-1',
        name: 'Task 1',
        done: false,
        value: 'high',
        effort: 'medium',
        wave: 'W3',
        phase: 'BUILD',
        persona: 'sonnet',
        context: [],
        blocks: ['task-2'],
        exit: '',
        tags: [],
        source: 'docs/TODO.md',
        line: 1,
        priority: 5,
        formula: 'base',
      },
      {
        id: 'task-2',
        name: 'Task 2',
        done: false,
        value: 'medium',
        effort: 'small',
        wave: 'W3',
        phase: 'BUILD',
        persona: 'sonnet',
        context: [],
        blocks: [],
        exit: '',
        tags: [],
        source: 'docs/TODO.md',
        line: 10,
        priority: 3,
        formula: 'base',
      },
    ]

    vi.mocked(readParsed).mockResolvedValueOnce([]) // no existing tasks
    vi.mocked(write).mockResolvedValue(undefined)

    const result = await syncTasks(tasks)

    expect(result).toHaveProperty('synced')
    expect(result).toHaveProperty('blocks')
    expect(result).toHaveProperty('errors')
    expect(result.synced).toBe(2)
    expect(result.blocks).toBe(1) // one blocks relation (task-1 → task-2)
  })

  it('falls back to per-task insertion on batch failure', async () => {
    const tasks: Task[] = [
      {
        id: 'good-task',
        name: 'Will succeed',
        done: false,
        value: 'high',
        effort: 'medium',
        wave: 'W3',
        phase: 'BUILD',
        persona: 'sonnet',
        context: [],
        blocks: [],
        exit: '',
        tags: [],
        source: 'docs/TODO.md',
        line: 1,
        priority: 5,
        formula: 'base',
      },
      {
        id: 'bad-task',
        name: 'Will fail in batch',
        done: false,
        value: 'high',
        effort: 'medium',
        wave: 'W3',
        phase: 'BUILD',
        persona: 'sonnet',
        context: [],
        blocks: [],
        exit: '',
        tags: [],
        source: 'docs/TODO.md',
        line: 10,
        priority: 5,
        formula: 'base',
      },
    ]

    vi.mocked(readParsed).mockResolvedValueOnce([]) // no existing
    // First write call (batch) fails, fallback to per-task
    vi.mocked(write).mockRejectedValueOnce(new Error('Batch failed'))
    vi.mocked(write).mockResolvedValue(undefined)

    const result = await syncTasks(tasks)

    // Should have fallen back and retried per-task
    expect(result.synced).toBeGreaterThanOrEqual(1)
    expect(vi.mocked(write).mock.calls.length).toBeGreaterThan(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: Blocks Relations — Task dependency wiring
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 3: Blocks Relations — Task blocking relationships', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates blocks relation when task has blocks list', async () => {
    const taskA: Task = {
      id: 'task-a',
      name: 'Task A',
      done: false,
      value: 'high',
      effort: 'medium',
      wave: 'W3',
      phase: 'BUILD',
      persona: 'sonnet',
      context: [],
      blocks: ['task-b'],
      exit: '',
      tags: [],
      source: 'docs/TODO.md',
      line: 1,
      priority: 5,
      formula: 'base',
    }

    const taskB: Task = {
      id: 'task-b',
      name: 'Task B',
      done: false,
      value: 'high',
      effort: 'medium',
      wave: 'W4',
      phase: 'VERIFY',
      persona: 'sonnet',
      context: [],
      blocks: [],
      exit: '',
      tags: [],
      source: 'docs/TODO.md',
      line: 10,
      priority: 3,
      formula: 'base',
    }

    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)

    await syncTasks([taskA, taskB])

    // Check that blocks relation was written
    const blocksCalls = vi.mocked(write).mock.calls.filter((c) => (c[0] as string).includes('blocks'))
    expect(blocksCalls.length).toBeGreaterThan(0)
    const blocksQuery = blocksCalls[0][0] as string
    expect(blocksQuery).toContain('task-a')
    expect(blocksQuery).toContain('task-b')
    expect(blocksQuery).toContain('blocker:')
    expect(blocksQuery).toContain('blocked:')
  })

  it('ignores blocks to tasks not in the current sync batch', async () => {
    const taskA: Task = {
      id: 'task-a',
      name: 'Task A',
      done: false,
      value: 'high',
      effort: 'medium',
      wave: 'W3',
      phase: 'BUILD',
      persona: 'sonnet',
      context: [],
      blocks: ['external-task-not-in-batch'],
      exit: '',
      tags: [],
      source: 'docs/TODO.md',
      line: 1,
      priority: 5,
      formula: 'base',
    }

    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)

    await syncTasks([taskA])

    // blocks relation should not be created for external-task
    const blocksCalls = vi.mocked(write).mock.calls.filter((c) => (c[0] as string).includes('isa blocks'))
    expect(blocksCalls.length).toBe(0)
  })

  it('handles multiple tasks with multiple blocking relationships', async () => {
    const tasks: Task[] = [
      {
        id: 'task-1',
        name: 'Task 1',
        done: false,
        value: 'high',
        effort: 'medium',
        wave: 'W3',
        phase: 'BUILD',
        persona: 'sonnet',
        context: [],
        blocks: ['task-2', 'task-3'],
        exit: '',
        tags: [],
        source: 'docs/TODO.md',
        line: 1,
        priority: 5,
        formula: 'base',
      },
      {
        id: 'task-2',
        name: 'Task 2',
        done: false,
        value: 'medium',
        effort: 'small',
        wave: 'W4',
        phase: 'VERIFY',
        persona: 'sonnet',
        context: [],
        blocks: ['task-3'],
        exit: '',
        tags: [],
        source: 'docs/TODO.md',
        line: 10,
        priority: 3,
        formula: 'base',
      },
      {
        id: 'task-3',
        name: 'Task 3',
        done: false,
        value: 'medium',
        effort: 'small',
        wave: 'W4',
        phase: 'VERIFY',
        persona: 'sonnet',
        context: [],
        blocks: [],
        exit: '',
        tags: [],
        source: 'docs/TODO.md',
        line: 20,
        priority: 2,
        formula: 'base',
      },
    ]

    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)

    const result = await syncTasks(tasks)

    // Should create 3 blocks relations: 1→2, 1→3, 2→3
    expect(result.blocks).toBe(3)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 4: markTaskDone — Status update and WebSocket broadcast
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 4: markTaskDone — Task completion and notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates task-status and done attributes in TypeDB', async () => {
    vi.mocked(write).mockResolvedValue(undefined)

    await markTaskDone('task-123')

    expect(write).toHaveBeenCalledWith(expect.stringContaining('task-id "task-123"'))
    expect(write).toHaveBeenCalledWith(expect.stringContaining('done true'))
    expect(write).toHaveBeenCalledWith(expect.stringContaining('task-status "done"'))
  })

  it('broadcasts complete message via WebSocket', async () => {
    vi.mocked(write).mockResolvedValue(undefined)

    await markTaskDone('task-xyz')

    expect(wsManager.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'complete',
        taskId: 'task-xyz',
      }),
    )
  })

  it('relays complete message to Gateway', async () => {
    vi.mocked(write).mockResolvedValue(undefined)

    await markTaskDone('task-relay')

    expect(relayToGateway).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'complete',
        taskId: 'task-relay',
      }),
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 5: Tag Extraction and Application
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 5: Tag extraction and application', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deduplicates tags in task insert', async () => {
    const taskWithDupeTags: Task = {
      id: 'task-dupe',
      name: 'Task with duplicate tags',
      done: false,
      value: 'high',
      effort: 'medium',
      wave: 'W3',
      phase: 'BUILD',
      persona: 'sonnet',
      context: [],
      blocks: [],
      exit: '',
      tags: ['api', 'build', 'api', 'P0', 'api'], // api appears 3 times
      source: 'docs/TODO.md',
      line: 1,
      priority: 5,
      formula: 'base',
    }

    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)

    await syncTasks([taskWithDupeTags])

    const tql = vi.mocked(write).mock.calls[0][0] as string
    // Count occurrences of 'has tag "api"' — should be exactly 2 (task + skill)
    const apiOccurrences = (tql.match(/has tag "api"/g) || []).length
    expect(apiOccurrences).toBe(2)
  })

  it('applies tags to both task and skill entities in single batch', async () => {
    const taskWithTags: Task = {
      id: 'task-tagged',
      name: 'Tagged task',
      done: false,
      value: 'high',
      effort: 'medium',
      wave: 'W3',
      phase: 'BUILD',
      persona: 'sonnet',
      context: [],
      blocks: [],
      exit: '',
      tags: ['routing', 'urgent', 'P0'],
      source: 'docs/TODO.md',
      line: 1,
      priority: 5,
      formula: 'base',
    }

    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)

    await syncTasks([taskWithTags])

    const tql = vi.mocked(write).mock.calls[0][0] as string

    // All three tags should be in the insert
    expect(tql).toContain('routing')
    expect(tql).toContain('urgent')
    expect(tql).toContain('P0')

    // Tags appear on both $t (task) and $s (skill) variables
    expect((tql.match(/has tag "routing"/g) || []).length).toBeGreaterThanOrEqual(2)
  })

  it('preserves tag order when tags come from task context', async () => {
    const taskWithOrderedTags: Task = {
      id: 'task-ordered',
      name: 'Ordered tags',
      done: false,
      value: 'high',
      effort: 'medium',
      wave: 'W3',
      phase: 'BUILD',
      persona: 'sonnet',
      context: ['engine', 'performance', 'optimization'],
      blocks: [],
      exit: '',
      tags: ['performance', 'engine'],
      source: 'docs/TODO.md',
      line: 1,
      priority: 5,
      formula: 'base',
    }

    vi.mocked(readParsed).mockResolvedValueOnce([])
    vi.mocked(write).mockResolvedValue(undefined)

    await syncTasks([taskWithOrderedTags])

    const tql = vi.mocked(write).mock.calls[0][0] as string

    // Both tags should be present
    expect(tql).toContain('performance')
    expect(tql).toContain('engine')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 6: taskBlockers — Query blocked dependencies
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 6: taskBlockers — Query what tasks are blocked by a task', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns task IDs that are blocked by the given task', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([{ bid: 'task-b' }, { bid: 'task-c' }])

    const blocked = await taskBlockers('task-a')

    expect(blocked).toEqual(['task-b', 'task-c'])
  })

  it('returns empty array when no tasks are blocked', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])

    const blocked = await taskBlockers('independent-task')

    expect(blocked).toEqual([])
  })

  it('constructs correct TypeQL query for blockers', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])

    await taskBlockers('task-id-123')

    const query = vi.mocked(readParsed).mock.calls[0][0] as string
    expect(query).toContain('blocks')
    expect(query).toContain('task-id-123')
    expect(query).toContain('blocker:')
    expect(query).toContain('blocked:')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 7: selfCheckoff — Closure pattern composing mark + status + unblock
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 7: selfCheckoff — Closure pattern for task completion flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks task done and returns marked count', async () => {
    const mockWorld = {
      mark: vi.fn(),
      enqueue: vi.fn(),
      know: vi.fn(),
    }

    vi.mocked(readParsed).mockImplementation(async () => [])
    vi.mocked(write).mockResolvedValue(undefined)

    const result = await selfCheckoff('task-complete', mockWorld as any)

    expect(result.marked).toBe(1)
    expect(wsManager.broadcast).toHaveBeenCalled()
  })

  it('unblocks dependent tasks when all blockers are done', async () => {
    const mockWorld = {
      mark: vi.fn(),
      enqueue: vi.fn(),
      know: vi.fn(),
    }

    let _callCount = 0
    vi.mocked(readParsed).mockImplementation(async (query: string) => {
      _callCount++
      // taskBlockers query for task-complete
      if (query.includes('task-complete') && query.includes('blocks')) {
        return [{ bid: 'task-blocked' }] // found one blocked task
      }
      // Check blockers for task-blocked
      if (query.includes('task-blocked') && query.includes('done false')) {
        return [] // no remaining blockers
      }
      // Phase lookup
      if (query.includes('task-complete') && query.includes('task-phase')) {
        return [{ ph: 'BUILD' }]
      }
      // Remaining tasks in phase
      if (query.includes('task-phase') && query.includes('done false')) {
        return [] // none remain
      }
      return []
    })
    vi.mocked(write).mockResolvedValue(undefined)

    const result = await selfCheckoff('task-complete', mockWorld as any)

    expect(result.unblocked).toContain('task-blocked')
    expect(mockWorld.enqueue).toHaveBeenCalledWith(expect.objectContaining({ receiver: 'builder:task-blocked' }))
  })

  it('promotes highways to knowledge when phase is complete', async () => {
    const mockWorld = {
      mark: vi.fn(),
      enqueue: vi.fn(),
      know: vi.fn(),
    }

    let callCount = 0
    vi.mocked(readParsed).mockImplementation(async () => {
      callCount++
      if (callCount === 1) return [] // taskBlockers
      if (callCount === 2) return [{ ph: 'BUILD' }] // phase lookup
      return [] // no remaining tasks
    })
    vi.mocked(write).mockResolvedValue(undefined)

    await selfCheckoff('last-in-phase', mockWorld as any)

    expect(mockWorld.know).toHaveBeenCalled()
  })

  it('broadcasts unblock messages for each unblocked task', async () => {
    const mockWorld = {
      mark: vi.fn(),
      enqueue: vi.fn(),
      know: vi.fn(),
    }

    let callCount = 0
    vi.mocked(readParsed).mockImplementation(async () => {
      callCount++
      if (callCount === 1) return [{ bid: 'task-x' }, { bid: 'task-y' }] // taskBlockers
      if (callCount === 2 || callCount === 3) return [] // no blockers for x and y
      if (callCount === 4) return [{ ph: 'BUILD' }] // phase lookup
      return [{ id: 'other-task' }] // other tasks remain
    })
    vi.mocked(write).mockResolvedValue(undefined)

    await selfCheckoff('primary-task', mockWorld as any)

    const unblockCalls = vi.mocked(wsManager.broadcast).mock.calls.filter((c) => (c[0] as any).type === 'unblock')
    expect(unblockCalls.length).toBe(2)
  })
})
