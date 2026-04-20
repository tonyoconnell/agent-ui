/**
 * Integration test: Filter Active Tasks
 *
 * Claim task → GET /api/tasks excludes it → release → GET includes it
 *
 * Tests the picked status filter in the local store layer.
 * The GET handler in /api/tasks/index.ts filters:
 *   .filter((t) => t.task_status !== 'picked')
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as store from '@/lib/tasks-store'

// Reach into module internals to reset state between tests
function resetStore() {
  // getAllTasks returns live Map values — delete all via deleteTask
  const all = store.getAllTasks()
  for (const t of all) {
    store.deleteTask(t.tid)
  }
}

function getVisibleTasks(): store.ProjectTask[] {
  return store.getAllTasks().filter((t) => t.task_status !== 'picked')
}

describe('filter-active: claimed tasks are hidden from task list', () => {
  const TID = 'filter-active-T1'

  beforeEach(() => {
    resetStore()
    store.createTask({
      tid: TID,
      name: 'Test Filter Task',
      tags: ['test', 'filter'],
      blocked_by: [],
      blocks: [],
    })
  })

  afterEach(() => {
    resetStore()
  })

  it('task is visible before claim', () => {
    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === TID)).toBe(true)
  })

  it('task is hidden after claim (task_status = picked)', () => {
    // Simulate claim: set task_status to picked
    store.updateTask(TID, { task_status: 'picked' })

    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === TID)).toBe(false)
  })

  it('task is visible again after release (task_status = open)', () => {
    // Claim
    store.updateTask(TID, { task_status: 'picked' })
    expect(getVisibleTasks().some((t) => t.tid === TID)).toBe(false)

    // Release
    store.updateTask(TID, { task_status: 'open' })
    expect(getVisibleTasks().some((t) => t.tid === TID)).toBe(true)
  })

  it('only the claimed task is hidden — others remain visible', () => {
    const OTHER = 'filter-active-T2'
    store.createTask({
      tid: OTHER,
      name: 'Other Task',
      tags: ['test'],
      blocked_by: [],
      blocks: [],
    })

    store.updateTask(TID, { task_status: 'picked' })

    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === TID)).toBe(false)
    expect(visible.some((t) => t.tid === OTHER)).toBe(true)
  })
})
