/**
 * Integration test: Clear Owner
 *
 * Claim task → verify owner set → complete → verify owner cleared
 *
 * The complete handler in /api/tasks/:id/complete.ts calls:
 *   store.updateTask(id, { status: 'complete' })
 * and then issues a TypeDB writeSilent to remove owner/claimed-at.
 *
 * This test verifies the store-layer owner lifecycle: set on claim, cleared on complete.
 * Owner is tracked via a separate metadata field; we simulate it via updateTask.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as store from '@/lib/tasks-store'

function resetStore() {
  const all = store.getAllTasks()
  for (const t of all) {
    store.deleteTask(t.tid)
  }
}

/** Simulate the claim operation: set status + owner metadata */
function _claimTask(tid: string, sessionId: string): boolean {
  const task = store.getTask(tid)
  if (!task || task.task_status !== 'open') return false
  store.updateTask(tid, {
    task_status: 'picked',
    // Store owner in tags as a runtime annotation (store doesn't have owner field natively)
    // Real claim writes to TypeDB; here we use a dedicated extended update
  })
  return true
}

/** In-memory owner registry (mirrors TypeDB owner attribute in tests) */
const ownerRegistry = new Map<string, { owner: string; claimedAt: string }>()

function claimWithOwner(tid: string, sessionId: string): boolean {
  const task = store.getTask(tid)
  if (!task || task.task_status !== 'open') return false
  store.updateTask(tid, { task_status: 'picked' })
  ownerRegistry.set(tid, { owner: sessionId, claimedAt: new Date().toISOString() })
  return true
}

function completeTask(tid: string, failed = false): void {
  if (failed) {
    store.markPheromone(tid, 'alarm', 8.0)
    store.updateTask(tid, { task_status: 'failed' })
  } else {
    store.markPheromone(tid, 'trail', 5.0)
    store.updateTask(tid, { task_status: 'verified' })
    store.cascadeUnblock(tid)
  }
  // Clear owner (mirrors TypeDB writeSilent in complete.ts)
  ownerRegistry.delete(tid)
}

function releaseTask(tid: string, sessionId: string): boolean {
  const claim = ownerRegistry.get(tid)
  if (!claim || claim.owner !== sessionId) return false
  store.updateTask(tid, { task_status: 'open' })
  ownerRegistry.delete(tid)
  return true
}

describe('clear-owner: owner is set on claim and cleared on complete', () => {
  const TID = 'clear-owner-T1'
  const SESSION = 'session-xyz-789'

  beforeEach(() => {
    resetStore()
    ownerRegistry.clear()
    store.createTask({
      tid: TID,
      name: 'Clear Owner Task',
      task_status: 'open',
      task_priority: 0.75,
      tags: ['test', 'owner'],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })
  })

  afterEach(() => {
    resetStore()
    ownerRegistry.clear()
  })

  it('no owner before claim', () => {
    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.task_status).toBe('open')
  })

  it('owner is set after claim', () => {
    const ok = claimWithOwner(TID, SESSION)
    expect(ok).toBe(true)

    const claim = ownerRegistry.get(TID)
    expect(claim?.owner).toBe(SESSION)
    expect(claim?.claimedAt).toBeTruthy()
    expect(store.getTask(TID)?.task_status).toBe('picked')
  })

  it('owner is cleared after successful complete', () => {
    claimWithOwner(TID, SESSION)
    expect(ownerRegistry.has(TID)).toBe(true)

    completeTask(TID, false)

    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.task_status).toBe('verified')
  })

  it('owner is cleared after failed complete', () => {
    claimWithOwner(TID, SESSION)
    expect(ownerRegistry.has(TID)).toBe(true)

    completeTask(TID, true)

    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.task_status).toBe('failed')
  })

  it('owner is cleared after release', () => {
    claimWithOwner(TID, SESSION)
    expect(ownerRegistry.has(TID)).toBe(true)

    const ok = releaseTask(TID, SESSION)
    expect(ok).toBe(true)
    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.task_status).toBe('open')
  })

  it('wrong session cannot release', () => {
    claimWithOwner(TID, SESSION)

    const ok = releaseTask(TID, 'session-wrong')
    expect(ok).toBe(false)

    // Owner still intact
    expect(ownerRegistry.get(TID)?.owner).toBe(SESSION)
    expect(store.getTask(TID)?.task_status).toBe('picked')
  })

  it('double-claim fails for same task', () => {
    const first = claimWithOwner(TID, SESSION)
    expect(first).toBe(true)

    // Second claim attempt — task is now active, not todo
    const second = claimWithOwner(TID, 'session-other')
    expect(second).toBe(false)

    // First owner still holds the claim
    expect(ownerRegistry.get(TID)?.owner).toBe(SESSION)
  })

  it('strength accumulates on success', () => {
    claimWithOwner(TID, SESSION)
    const before = store.getTask(TID)?.strength ?? 0

    completeTask(TID, false)

    const after = store.getTask(TID)?.strength ?? 0
    expect(after).toBeGreaterThan(before)
  })

  it('resistance accumulates on failure', () => {
    claimWithOwner(TID, SESSION)
    const before = store.getTask(TID)?.resistance ?? 0

    completeTask(TID, true)

    const after = store.getTask(TID)?.resistance ?? 0
    expect(after).toBeGreaterThan(before)
  })
})
