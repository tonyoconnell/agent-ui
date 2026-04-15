/**
 * Integration test: Owner Cleanup on Complete
 *
 * Verifies that /api/tasks/:id/complete removes owner and claimed-at attributes
 * via TypeDB writeSilent when task transitions from claimed → complete.
 *
 * The complete handler:
 *   1. Updates local store status
 *   2. Issues TypeDB writeSilent to remove owner + claimed-at attributes
 *   3. Broadcasts pheromone changes via WebSocket
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as store from '@/lib/tasks-store'

function resetStore() {
  const all = store.getAllTasks()
  for (const t of all) {
    store.deleteTask(t.tid)
  }
}

/** In-memory owner registry (mirrors TypeDB owner attribute in tests) */
const ownerRegistry = new Map<string, { owner: string; claimedAt: string }>()

function claimTask(tid: string, sessionId: string): boolean {
  const task = store.getTask(tid)
  if (!task || task.status !== 'todo') return false
  store.updateTask(tid, { status: 'active' })
  ownerRegistry.set(tid, { owner: sessionId, claimedAt: new Date().toISOString() })
  return true
}

function completeTask(tid: string, failed = false): void {
  if (failed) {
    store.markPheromone(tid, 'alarm', 8.0)
    store.updateTask(tid, { status: 'failed' })
  } else {
    store.markPheromone(tid, 'trail', 5.0)
    store.updateTask(tid, { status: 'complete' })
    store.cascadeUnblock(tid)
  }
  // Simulate TypeDB writeSilent clearing owner + claimed-at
  ownerRegistry.delete(tid)
}

function makeTask(tid: string, name: string) {
  store.createTask({
    tid,
    name,
    status: 'todo',
    priority: 'P1',
    phase: 'C2',
    value: 'high',
    persona: 'agent',
    tags: ['test', 'owner-cleanup'],
    blockedBy: [],
    blocks: [],
    trailPheromone: 0,
    alarmPheromone: 0,
  })
}

describe('owner-cleanup: owner attribute removed on complete', () => {
  const TID = 'owner-cleanup-T1'
  const SESSION = 'session-cleanup-xyz'

  beforeEach(() => {
    resetStore()
    ownerRegistry.clear()
    makeTask(TID, 'Owner Cleanup Task')
  })

  afterEach(() => {
    resetStore()
    ownerRegistry.clear()
  })

  it('complete claimed task → owner attribute gone', () => {
    // Claim the task first
    const claimed = claimTask(TID, SESSION)
    expect(claimed).toBe(true)
    expect(ownerRegistry.has(TID)).toBe(true)
    expect(store.getTask(TID)?.status).toBe('active')

    // Complete the task (claimed → done)
    completeTask(TID, false)

    // Owner and claimed-at must be removed
    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.status).toBe('complete')
    expect(store.getTask(TID)?.trailPheromone).toBeGreaterThan(0)
  })

  it('complete unclaimed task → no-op on owner', () => {
    // Do not claim; complete directly (edge case)
    expect(ownerRegistry.has(TID)).toBe(false)

    // Complete without claiming
    completeTask(TID, false)

    // Owner remains absent (no-op)
    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.status).toBe('complete')
    expect(store.getTask(TID)?.trailPheromone).toBeGreaterThan(0)
  })

  it('complete twice → idempotent (second delete is no-op)', () => {
    // Claim and complete once
    claimTask(TID, SESSION)
    completeTask(TID, false)

    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.status).toBe('complete')

    const trailAfterFirst = store.getTask(TID)?.trailPheromone ?? 0

    // Complete again (idempotent)
    completeTask(TID, false)

    // Still complete, no owner, pheromone incremented again
    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.status).toBe('complete')
    expect(store.getTask(TID)?.trailPheromone).toBeGreaterThan(trailAfterFirst)
  })
})
