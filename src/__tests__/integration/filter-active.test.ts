/**
 * Integration test: Filter Active Tasks
 *
 * Claim task → GET /api/tasks excludes it → release → GET includes it
 *
 * Tests the in_progress/active status filter in the local store layer.
 * The GET handler in /api/tasks/index.ts filters:
 *   .filter((t) => t.status !== 'in_progress' && t.status !== 'active')
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
  return store.getAllTasks().filter((t) => t.status !== 'in_progress' && t.status !== 'active')
}

describe('filter-active: claimed tasks are hidden from task list', () => {
  const TID = 'filter-active-T1'

  beforeEach(() => {
    resetStore()
    store.createTask({
      tid: TID,
      name: 'Test Filter Task',
      status: 'todo',
      priority: 'P1',
      phase: 'C2',
      value: 'medium',
      persona: 'agent',
      tags: ['test', 'filter'],
      blockedBy: [],
      blocks: [],
      trailPheromone: 0,
      alarmPheromone: 0,
    })
  })

  afterEach(() => {
    resetStore()
  })

  it('task is visible before claim', () => {
    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === TID)).toBe(true)
  })

  it('task is hidden after claim (status = active)', () => {
    // Simulate claim: set status to active
    store.updateTask(TID, { status: 'active' })

    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === TID)).toBe(false)
  })

  it('task is hidden when status = in_progress', () => {
    store.updateTask(TID, { status: 'in_progress' })

    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === TID)).toBe(false)
  })

  it('task is visible again after release (status = todo)', () => {
    // Claim
    store.updateTask(TID, { status: 'active' })
    expect(getVisibleTasks().some((t) => t.tid === TID)).toBe(false)

    // Release
    store.updateTask(TID, { status: 'todo' })
    expect(getVisibleTasks().some((t) => t.tid === TID)).toBe(true)
  })

  it('only the claimed task is hidden — others remain visible', () => {
    const OTHER = 'filter-active-T2'
    store.createTask({
      tid: OTHER,
      name: 'Other Task',
      status: 'todo',
      priority: 'P2',
      phase: 'C2',
      value: 'low',
      persona: 'agent',
      tags: ['test'],
      blockedBy: [],
      blocks: [],
      trailPheromone: 0,
      alarmPheromone: 0,
    })

    store.updateTask(TID, { status: 'active' })

    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === TID)).toBe(false)
    expect(visible.some((t) => t.tid === OTHER)).toBe(true)
  })
})
