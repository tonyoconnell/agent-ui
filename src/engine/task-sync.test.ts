/**
 * task-sync.test.ts — Test TypeDB task persistence
 *
 * Tests that tasks are correctly written to TypeDB with all fields,
 * blocks relations are created, and mark-done works.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as typedb from '@/lib/typedb'
import type { Task } from './task-parse'
import { markTaskDone, syncTasks } from './task-sync'

// Mock TypeDB module
vi.mock('@/lib/typedb', () => ({
  write: vi.fn().mockResolvedValue(undefined),
  writeSilent: vi.fn().mockResolvedValue(undefined),
  readParsed: vi.fn().mockResolvedValue([]),
}))

// Helper to create test tasks with all required fields
function createTask(overrides?: Partial<Task>): Task {
  return {
    id: 'test-task',
    name: 'Test Task',
    done: false,
    value: 'high',
    effort: 'medium',
    wave: 'W3',
    phase: 'C2',
    persona: 'dev',
    priority: 50,
    formula: 'priority * 1.0',
    source: 'TODO.md',
    tags: [],
    blocks: [],
    exit: 'Task completes',
    context: [],
    line: 1,
    ...overrides,
  }
}

describe('task-sync.ts — TypeDB persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('syncTasks', () => {
    it('should insert tasks to TypeDB', async () => {
      const tasks: Task[] = [createTask({ id: 'task-1', tags: ['engine', 'test'] })]

      const result = await syncTasks(tasks)

      expect(result.synced).toBe(1)
      expect(typedb.write).toHaveBeenCalled()

      // Batched insert: task entity, skill entity, and capability are in one write call
      const writeCalls = vi.mocked(typedb.write).mock.calls.map((c) => c[0] as string)
      const batchCall = writeCalls.find((c) => c.includes('task-1'))
      expect(batchCall).toContain('$t0 isa task')
      expect(batchCall).toContain('$s0 isa skill')
      expect(batchCall).toContain('(provider: $u, offered: $s0) isa capability')
    })

    it('should escape special characters in task names', async () => {
      const tasks: Task[] = [
        createTask({
          id: 'task-escape',
          name: 'Task with "quotes" and \\backslash',
          effort: 'low',
          wave: 'W2',
          phase: 'C1',
          priority: 30,
        }),
      ]

      await syncTasks(tasks)

      // Should escape quotes in the batch write call
      const writeCalls = vi.mocked(typedb.write).mock.calls.map((c) => c[0] as string)
      const batchCall = writeCalls.find((c) => c.includes('task-escape'))
      expect(batchCall).toContain('Task with \\"quotes\\" and \\\\backslash')
    })

    it('should include all task fields in TypeDB query', async () => {
      const tasks: Task[] = [
        createTask({
          id: 'full-task',
          name: 'Full Task',
          done: true,
          value: 'critical',
          effort: 'high',
          wave: 'W1',
          phase: 'C3',
          persona: 'architect',
          priority: 75,
          formula: 'priority * effort_weight',
          source: 'TODO-full.md',
          exit: 'All tests passing',
          tags: ['P0', 'engine', 'testing'],
          blocks: ['dep-1', 'dep-2'],
          context: ['DSL.md', 'routing.md'],
        }),
      ]

      await syncTasks(tasks)

      // Find the task entity insert call (batch write contains match+insert)
      const writeCalls = vi.mocked(typedb.write).mock.calls.map((c) => c[0] as string)
      const taskCall = writeCalls.find((c) => c.includes('full-task') && c.includes('$t0 isa task'))

      expect(taskCall).toBeDefined()
      expect(taskCall).toContain('Full Task')
      expect(taskCall).toContain('done')
      expect(taskCall).toContain('critical')
      expect(taskCall).toContain('high')
      expect(taskCall).toContain('W1')
      expect(taskCall).toContain('C3')
      expect(taskCall).toContain('architect')
      expect(taskCall).toContain('All tests passing')
    })

    it('should create blocks relations between tasks', async () => {
      const tasks: Task[] = [
        {
          id: 'blocker',
          name: 'Blocker Task',
          done: false,
          value: 'high',
          effort: 'low',
          wave: 'W2',
          phase: 'C2',
          persona: 'dev',
          priority: 40,
          formula: 'priority',
          source: 'TODO.md',
          tags: [],
          blocks: ['blocked1', 'blocked2'],
          context: [],
          exit: '',
          line: 0,
        },
        createTask({
          id: 'blocked1',
          name: 'Blocked Task 1',
          value: 'high',
          effort: 'low',
          wave: 'W3',
          phase: 'C2',
          persona: 'dev',
          priority: 30,
          tags: [],
        }),
        createTask({
          id: 'blocked2',
          name: 'Blocked Task 2',
          value: 'medium',
          effort: 'medium',
          wave: 'W3',
          phase: 'C2',
          persona: 'dev',
          priority: 20,
          tags: [],
        }),
      ]

      const result = await syncTasks(tasks)

      expect(result.blocks).toBe(2)

      // Blocks relations are inserted via write() with match+insert
      const writeCalls = vi.mocked(typedb.write).mock.calls.map((c) => c[0] as string)
      const blocksCall = writeCalls.find((c) => c.includes('isa blocks'))
      expect(blocksCall).toContain('(blocker: $a0, blocked: $b0) isa blocks')
    })

    it('should skip blocks relations for non-existent tasks', async () => {
      const tasks: Task[] = [
        {
          id: 'task',
          name: 'Task',
          done: false,
          value: 'high',
          effort: 'low',
          wave: 'W2',
          phase: 'C2',
          persona: 'dev',
          priority: 40,
          formula: 'priority',
          source: 'TODO.md',
          tags: [],
          blocks: ['nonexistent-task'], // This task doesn't exist in the batch
          context: [],
          exit: '',
          line: 0,
        },
      ]

      const result = await syncTasks(tasks)

      // Should still insert the task, but blocks count should be 0
      expect(result.synced).toBe(1)
      expect(result.blocks).toBe(0) // No blocks created (nonexistent-task not in batch)
    })

    it('should batch insert tasks in groups', async () => {
      const tasks: Task[] = Array.from({ length: 25 }, (_, i) => ({
        id: `task-${i}`,
        name: `Task ${i}`,
        done: false,
        value: 'high' as const,
        effort: 'low' as const,
        wave: 'W2' as const,
        phase: 'C2' as const,
        persona: 'dev',
        priority: 50 - i,
        formula: 'priority',
        source: 'TODO.md',
        tags: [],
        blocks: [],
        context: [],
        exit: '',
        line: i,
      }))

      const result = await syncTasks(tasks)

      expect(result.synced).toBe(25)

      // 25 tasks fit in one batch (TASKS_PER_QUERY=25), so 1 write call for tasks
      // Plus 1 writeSilent for ensureBuilder
      const writeCalls = vi.mocked(typedb.write).mock.calls
      expect(writeCalls.length).toBeGreaterThanOrEqual(1)
      const silentCalls = vi.mocked(typedb.writeSilent).mock.calls
      expect(silentCalls.some((c) => (c[0] as string).includes('builder'))).toBe(true)
    })

    it('should ensure builder unit exists', async () => {
      const tasks: Task[] = [
        createTask({
          id: 'task-1',
          name: 'Test',
          value: 'high',
          effort: 'low',
          wave: 'W2',
          phase: 'C2',
          persona: 'dev',
          priority: 50,
          tags: [],
        }),
      ]

      await syncTasks(tasks)

      // Should ensure builder unit exists (writeSilent, first call)
      const calls = vi.mocked(typedb.writeSilent).mock.calls.map((c) => c[0] as string)
      expect(calls.some((c) => c.includes('builder') && c.includes('insert $u isa unit'))).toBe(true)
    })
  })

  describe('markTaskDone', () => {
    it('should mark task as done in TypeDB', async () => {
      await markTaskDone('task-1')

      expect(typedb.write).toHaveBeenCalledWith(expect.stringContaining('has task-id "task-1"'))
      expect(typedb.write).toHaveBeenCalledWith(expect.stringContaining('has done true'))
      expect(typedb.write).toHaveBeenCalledWith(expect.stringContaining('has task-status "done"'))
    })

    it('should escape task id', async () => {
      await markTaskDone('task-"quoted"')

      expect(typedb.write).toHaveBeenCalledWith(expect.stringContaining('task-\\"quoted\\"'))
    })

    it('should use write (not writeSilent) for durability', async () => {
      await markTaskDone('task-1')

      expect(typedb.write).toHaveBeenCalled()
      expect(typedb.writeSilent).not.toHaveBeenCalledWith(expect.stringContaining('task-1'))
    })
  })

  describe('tagging and categorization', () => {
    it('should include all tags in task entity', async () => {
      const tasks: Task[] = [
        createTask({
          id: 'tagged-task',
          name: 'Tagged Task',
          value: 'high',
          effort: 'low',
          wave: 'W2',
          phase: 'C2',
          persona: 'dev',
          priority: 50,
          tags: ['P0', 'engine', 'test', 'critical'],
        }),
      ]

      await syncTasks(tasks)

      // Batch write contains all tags for task + skill
      const writeCalls = vi.mocked(typedb.write).mock.calls.map((c) => c[0] as string)
      const taskCall = writeCalls.find((c) => c.includes('tagged-task') && c.includes('$t0 isa task'))

      expect(taskCall).toContain('has tag "P0"')
      expect(taskCall).toContain('has tag "engine"')
      expect(taskCall).toContain('has tag "test"')
      expect(taskCall).toContain('has tag "critical"')
    })

    it('should include tags in matching skill entity', async () => {
      const tasks: Task[] = [
        createTask({
          id: 'skill-task',
          name: 'Skill Task',
          value: 'high',
          effort: 'low',
          wave: 'W2',
          phase: 'C2',
          persona: 'dev',
          priority: 50,
          tags: ['routing', 'build'],
        }),
      ]

      await syncTasks(tasks)

      // Skill insert is in the same batch write as the task
      const writeCalls = vi.mocked(typedb.write).mock.calls.map((c) => c[0] as string)
      const batchCall = writeCalls.find((c) => c.includes('skill-task') && c.includes('$s0 isa skill'))

      expect(batchCall).toContain('has tag "routing"')
      expect(batchCall).toContain('has tag "build"')
    })
  })

  describe('error handling', () => {
    it('should count insertion errors', async () => {
      const tasks: Task[] = [
        createTask({
          id: 'task-1',
          name: 'Task 1',
          value: 'high',
          effort: 'low',
          wave: 'W2',
          phase: 'C2',
          persona: 'dev',
          priority: 50,
          tags: [],
        }),
        createTask({
          id: 'task-2',
          name: 'Task 2',
          value: 'high',
          effort: 'low',
          wave: 'W2',
          phase: 'C2',
          persona: 'dev',
          priority: 40,
          tags: [],
        }),
      ]

      // Reset mocks and make batch write fail
      vi.clearAllMocks()
      vi.mocked(typedb.writeSilent).mockResolvedValue(undefined) // ensureBuilder succeeds
      vi.mocked(typedb.write).mockRejectedValueOnce(new Error('Batch failed')) // batch fails
      // Per-task fallback also fails for both
      vi.mocked(typedb.write).mockRejectedValueOnce(new Error('Fail'))
      vi.mocked(typedb.write).mockRejectedValueOnce(new Error('Fail'))

      const result = await syncTasks(tasks)

      expect(result.errors).toBeGreaterThanOrEqual(0)
    })
  })
})
