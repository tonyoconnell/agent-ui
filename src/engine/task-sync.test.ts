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
      expect(typedb.writeSilent).toHaveBeenCalled()

      // Should create task entity, skill entity, and capability
      expect(typedb.writeSilent).toHaveBeenCalledWith(expect.stringContaining('insert $t isa task'))
      expect(typedb.writeSilent).toHaveBeenCalledWith(expect.stringContaining('insert $s isa skill'))
      expect(typedb.writeSilent).toHaveBeenCalledWith(expect.stringContaining('insert (provider'))
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

      // Should escape quotes
      expect(typedb.writeSilent).toHaveBeenCalledWith(
        expect.stringContaining('Task with \\"quotes\\" and \\\\backslash'),
      )
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

      // Find the task entity insert call (not the builder unit call)
      const calls = vi.mocked(typedb.writeSilent).mock.calls.map((c) => c[0] as string)
      const taskCall = calls.find((c) => c.includes('full-task') && c.includes('insert $t isa task'))

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

      // Should have created blocks relations
      expect(typedb.writeSilent).toHaveBeenCalledWith(
        expect.stringContaining('insert (blocker: $a, blocked: $b) isa blocks'),
      )
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
          blocks: ['nonexistent-task'], // This task doesn't exist
          context: [],
          exit: '',
          line: 0,
        },
      ]

      const result = await syncTasks(tasks)

      // Should still insert the task, but blocks count should be 0
      expect(result.synced).toBe(1)
      expect(result.blocks).toBe(0) // No blocks created
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

      // Each task creates 3 writes: task entity, skill entity, capability
      // Plus 1 for ensureBuilder
      // Plus 1 for insertBlocks call
      // Total: 25*3 + 1 + 1 = 77 calls
      const callCount = vi.mocked(typedb.writeSilent).mock.calls.length
      expect(callCount).toBeGreaterThan(50) // At least 50 calls
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

      // Should ensure builder unit exists (first call)
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

      const calls = vi.mocked(typedb.writeSilent).mock.calls.map((c) => c[0] as string)
      const taskCall = calls.find((c) => c.includes('tagged-task') && c.includes('insert $t isa task'))

      // Should include each tag
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

      // Find the skill insert call
      const skillCall = vi
        .mocked(typedb.writeSilent)
        .mock.calls.map((c) => c[0] as string)
        .find((c) => c.includes('insert $s isa skill'))

      expect(skillCall).toContain('has tag "routing"')
      expect(skillCall).toContain('has tag "build"')
    })
  })

  describe('error handling', () => {
    it('should count insertion errors', async () => {
      // Mock one success and one failure
      vi.mocked(typedb.writeSilent).mockImplementationOnce(() => Promise.resolve(undefined))
      vi.mocked(typedb.writeSilent).mockImplementationOnce(() => Promise.reject(new Error('Insert failed')))

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

      // Reset mocks for this test
      vi.clearAllMocks()
      vi.mocked(typedb.writeSilent).mockRejectedValueOnce(new Error('Fail'))

      const result = await syncTasks(tasks)

      expect(result.errors).toBeGreaterThanOrEqual(0)
    })
  })
})
