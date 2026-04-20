/**
 * Integration test: Filter Exclusion (picked tasks)
 *
 * Validates active-task filter: picked tasks excluded from
 * "open tasks" list in GET /api/tasks (collusion defense).
 *
 * Tests the local store layer filter:
 *   .filter((t) => t.task_status !== 'picked')
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as store from '@/lib/tasks-store'

// Reset store between tests
function resetStore() {
  const all = store.getAllTasks()
  for (const t of all) {
    store.deleteTask(t.tid)
  }
}

// Simulate the GET /api/tasks filter
function getVisibleTasks(): store.ProjectTask[] {
  return store.getAllTasks().filter((t) => t.task_status !== 'picked')
}

describe('filter-exclusion: picked tasks hidden from open list', () => {
  const OPEN_TASK = 'exclusion-open-T1'
  const CLAIMED_TASK = 'exclusion-claimed-T1'
  const ANOTHER_TASK = 'exclusion-another-T1'

  beforeEach(() => {
    resetStore()

    // Create three tasks with default open status
    store.createTask({
      tid: OPEN_TASK,
      name: 'Open Task',
      tags: ['test', 'open'],
      blocked_by: [],
      blocks: [],
    })

    store.createTask({
      tid: CLAIMED_TASK,
      name: 'Claimed Task',
      tags: ['test', 'claimed'],
      blocked_by: [],
      blocks: [],
    })

    store.createTask({
      tid: ANOTHER_TASK,
      name: 'Another Task',
      tags: ['test', 'another'],
      blocked_by: [],
      blocks: [],
    })
  })

  afterEach(() => {
    resetStore()
  })

  // Test (a): open task appears in list
  it('(a) open task appears in visible list', () => {
    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === OPEN_TASK)).toBe(true)
    expect(visible.find((t) => t.tid === OPEN_TASK)?.name).toBe('Open Task')
  })

  // Test (b) claimed task excluded from list
  it('(b) claimed task (task_status=picked) is excluded from visible list', () => {
    // Claim the task
    store.updateTask(CLAIMED_TASK, { task_status: 'picked' })

    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // Verify the claimed task still exists in store but is hidden
    const all = store.getAllTasks()
    expect(all.some((t) => t.tid === CLAIMED_TASK)).toBe(true)
    expect(all.find((t) => t.tid === CLAIMED_TASK)?.task_status).toBe('picked')
  })

  // Test (c): released task reappears
  it('(c) released task reappears in visible list', () => {
    // Claim
    store.updateTask(CLAIMED_TASK, { task_status: 'picked' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // Release
    store.updateTask(CLAIMED_TASK, { task_status: 'open' })
    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === CLAIMED_TASK)).toBe(true)
    expect(visible.find((t) => t.tid === CLAIMED_TASK)?.name).toBe('Claimed Task')
  })

  // Extended test: multiple claims/releases
  it('(c-extended) task can be claimed, released, and reclaimed multiple times', () => {
    // First claim
    store.updateTask(CLAIMED_TASK, { task_status: 'picked' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // Release
    store.updateTask(CLAIMED_TASK, { task_status: 'open' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(true)

    // Second claim
    store.updateTask(CLAIMED_TASK, { task_status: 'picked' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // Second release
    store.updateTask(CLAIMED_TASK, { task_status: 'open' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(true)
  })

  // Additional test: isolation between tasks
  it('claiming one task does not affect visibility of others', () => {
    // Claim one task
    store.updateTask(CLAIMED_TASK, { task_status: 'picked' })

    const visible = getVisibleTasks()

    // Open task still visible
    expect(visible.some((t) => t.tid === OPEN_TASK)).toBe(true)

    // Claimed task hidden
    expect(visible.some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // Another task still open
    expect(visible.some((t) => t.tid === ANOTHER_TASK)).toBe(true)

    // Count: should have exactly 2 visible (OPEN + ANOTHER)
    const visibleIds = visible.map((t) => t.tid)
    expect(visibleIds).toContain(OPEN_TASK)
    expect(visibleIds).toContain(ANOTHER_TASK)
    expect(visibleIds).not.toContain(CLAIMED_TASK)
  })

  // Additional test: multiple picked tasks excluded simultaneously
  it('multiple picked tasks are excluded together', () => {
    store.updateTask(CLAIMED_TASK, { task_status: 'picked' })
    store.updateTask(ANOTHER_TASK, { task_status: 'picked' })

    const visible = getVisibleTasks()

    expect(visible.some((t) => t.tid === OPEN_TASK)).toBe(true)
    expect(visible.some((t) => t.tid === CLAIMED_TASK)).toBe(false)
    expect(visible.some((t) => t.tid === ANOTHER_TASK)).toBe(false)
    expect(visible.length).toBe(1)
  })
})
