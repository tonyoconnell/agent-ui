/**
 * Integration test: Filter Exclusion (claimed + in-progress)
 *
 * Validates active-task filter: claimed/in-progress tasks excluded from
 * "open tasks" list in GET /api/tasks (collusion defense).
 *
 * Tests the local store layer filter:
 *   .filter((t) => t.status !== 'in_progress' && t.status !== 'active')
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
  return store.getAllTasks().filter((t) => t.status !== 'in_progress' && t.status !== 'active')
}

describe('filter-exclusion: claimed/in-progress tasks hidden from open list', () => {
  const OPEN_TASK = 'exclusion-open-T1'
  const CLAIMED_TASK = 'exclusion-claimed-T1'
  const IN_PROGRESS_TASK = 'exclusion-progress-T1'

  beforeEach(() => {
    resetStore()

    // Create three tasks with different initial statuses
    store.createTask({
      tid: OPEN_TASK,
      name: 'Open Task',
      status: 'todo',
      priority: 'P1',
      phase: 'C2',
      value: 'medium',
      persona: 'agent',
      tags: ['test', 'open'],
      blockedBy: [],
      blocks: [],
      trailPheromone: 0,
      alarmPheromone: 0,
    })

    store.createTask({
      tid: CLAIMED_TASK,
      name: 'Claimed Task',
      status: 'todo',
      priority: 'P1',
      phase: 'C2',
      value: 'medium',
      persona: 'agent',
      tags: ['test', 'claimed'],
      blockedBy: [],
      blocks: [],
      trailPheromone: 0,
      alarmPheromone: 0,
    })

    store.createTask({
      tid: IN_PROGRESS_TASK,
      name: 'In Progress Task',
      status: 'todo',
      priority: 'P1',
      phase: 'C2',
      value: 'medium',
      persona: 'agent',
      tags: ['test', 'progress'],
      blockedBy: [],
      blocks: [],
      trailPheromone: 0,
      alarmPheromone: 0,
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
  it('(b) claimed task (status=active) is excluded from visible list', () => {
    // Claim the task
    store.updateTask(CLAIMED_TASK, { status: 'active' })

    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // Verify the claimed task still exists in store but is hidden
    const all = store.getAllTasks()
    expect(all.some((t) => t.tid === CLAIMED_TASK)).toBe(true)
    expect(all.find((t) => t.tid === CLAIMED_TASK)?.status).toBe('active')
  })

  // Extended test: in_progress status also excluded
  it('(b-extended) in-progress task (status=in_progress) is excluded', () => {
    store.updateTask(IN_PROGRESS_TASK, { status: 'in_progress' })

    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === IN_PROGRESS_TASK)).toBe(false)
  })

  // Test (c): released task reappears
  it('(c) released task reappears in visible list', () => {
    // Claim
    store.updateTask(CLAIMED_TASK, { status: 'active' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // Release
    store.updateTask(CLAIMED_TASK, { status: 'todo' })
    const visible = getVisibleTasks()
    expect(visible.some((t) => t.tid === CLAIMED_TASK)).toBe(true)
    expect(visible.find((t) => t.tid === CLAIMED_TASK)?.name).toBe('Claimed Task')
  })

  // Extended test: multiple claims/releases
  it('(c-extended) task can be claimed, released, and reclaimed multiple times', () => {
    // First claim
    store.updateTask(CLAIMED_TASK, { status: 'active' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // Release
    store.updateTask(CLAIMED_TASK, { status: 'todo' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(true)

    // Second claim
    store.updateTask(CLAIMED_TASK, { status: 'active' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // Second release
    store.updateTask(CLAIMED_TASK, { status: 'todo' })
    expect(getVisibleTasks().some((t) => t.tid === CLAIMED_TASK)).toBe(true)
  })

  // Additional test: isolation between tasks
  it('claiming one task does not affect visibility of others', () => {
    // Claim one task
    store.updateTask(CLAIMED_TASK, { status: 'active' })

    const visible = getVisibleTasks()

    // Open task still visible
    expect(visible.some((t) => t.tid === OPEN_TASK)).toBe(true)

    // Claimed task hidden
    expect(visible.some((t) => t.tid === CLAIMED_TASK)).toBe(false)

    // In-progress task still open (not yet claimed)
    expect(visible.some((t) => t.tid === IN_PROGRESS_TASK)).toBe(true)

    // Count: should have exactly 2 visible (OPEN + IN_PROGRESS)
    const visibleIds = visible.map((t) => t.tid)
    expect(visibleIds).toContain(OPEN_TASK)
    expect(visibleIds).toContain(IN_PROGRESS_TASK)
    expect(visibleIds).not.toContain(CLAIMED_TASK)
  })

  // Additional test: both claimed and in-progress excluded simultaneously
  it('both active and in_progress tasks are excluded together', () => {
    store.updateTask(CLAIMED_TASK, { status: 'active' })
    store.updateTask(IN_PROGRESS_TASK, { status: 'in_progress' })

    const visible = getVisibleTasks()

    expect(visible.some((t) => t.tid === OPEN_TASK)).toBe(true)
    expect(visible.some((t) => t.tid === CLAIMED_TASK)).toBe(false)
    expect(visible.some((t) => t.tid === IN_PROGRESS_TASK)).toBe(false)
    expect(visible.length).toBe(1)
  })
})
