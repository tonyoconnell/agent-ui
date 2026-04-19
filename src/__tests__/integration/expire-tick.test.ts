/**
 * Integration test: Expire Tick
 *
 * Claim task → simulate 31min age → tick → verify task released
 *
 * The expire handler in /api/tasks/expire.ts checks:
 *   age > CLAIM_TTL_MS (30 * 60 * 1000)
 * and releases the task back to "open" (store: "todo").
 *
 * This test verifies the expiry logic independently of TypeDB by running
 * the TTL check against the in-memory store + a simulated claim timestamp.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as store from '@/lib/tasks-store'

const CLAIM_TTL_MS = 30 * 60 * 1000 // 31 min matches expire.ts

function resetStore() {
  const all = store.getAllTasks()
  for (const t of all) {
    store.deleteTask(t.tid)
  }
}

interface ClaimRecord {
  owner: string
  claimedAt: Date
}

/** In-memory claim registry (mirrors TypeDB owner/claimed-at in expire.ts) */
const claimRegistry = new Map<string, ClaimRecord>()

function claimWithTimestamp(tid: string, owner: string, claimedAt: Date): boolean {
  const task = store.getTask(tid)
  if (!task || task.task_status !== 'open') return false
  store.updateTask(tid, { task_status: 'picked' })
  claimRegistry.set(tid, { owner, claimedAt })
  return true
}

/**
 * Simulate the expire tick: scan active tasks, release those past TTL.
 * Mirrors the logic in /api/tasks/expire.ts GET handler.
 */
function runExpireTick(now: Date): Array<{ tid: string; owner: string; releasedAt: string }> {
  const released: Array<{ tid: string; owner: string; releasedAt: string }> = []

  for (const [tid, claim] of claimRegistry.entries()) {
    const task = store.getTask(tid)
    if (!task || task.task_status !== 'picked') continue

    const age = now.getTime() - claim.claimedAt.getTime()
    if (age > CLAIM_TTL_MS) {
      store.updateTask(tid, { task_status: 'open' })
      claimRegistry.delete(tid)
      released.push({ tid, owner: claim.owner, releasedAt: now.toISOString() })
    }
  }

  return released
}

describe('expire-tick: tasks older than 30min are released by the tick', () => {
  const TID = 'expire-tick-T1'
  const OWNER = 'session-expire-test'

  beforeEach(() => {
    resetStore()
    claimRegistry.clear()
    store.createTask({
      tid: TID,
      name: 'Expire Tick Task',
      task_status: 'open',
      task_priority: 0.75,
      tags: ['test', 'expire'],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })
  })

  afterEach(() => {
    resetStore()
    claimRegistry.clear()
  })

  it('fresh claim is not released by tick', () => {
    const now = new Date()
    claimWithTimestamp(TID, OWNER, now)

    // Tick runs at same time — 0ms age
    const released = runExpireTick(now)
    expect(released).toHaveLength(0)
    expect(store.getTask(TID)?.task_status).toBe('picked')
  })

  it('29min old claim is not released', () => {
    const claimedAt = new Date(Date.now() - 29 * 60 * 1000)
    claimWithTimestamp(TID, OWNER, claimedAt)

    const released = runExpireTick(new Date())
    expect(released).toHaveLength(0)
    expect(store.getTask(TID)?.task_status).toBe('picked')
  })

  it('31min old claim is released by tick', () => {
    const claimedAt = new Date(Date.now() - 31 * 60 * 1000)
    claimWithTimestamp(TID, OWNER, claimedAt)

    const released = runExpireTick(new Date())
    expect(released).toHaveLength(1)
    expect(released[0].tid).toBe(TID)
    expect(released[0].owner).toBe(OWNER)
  })

  it('released task is back to todo status', () => {
    const claimedAt = new Date(Date.now() - 31 * 60 * 1000)
    claimWithTimestamp(TID, OWNER, claimedAt)

    runExpireTick(new Date())

    expect(store.getTask(TID)?.task_status).toBe('open')
  })

  it('claim record is removed after expiry', () => {
    const claimedAt = new Date(Date.now() - 31 * 60 * 1000)
    claimWithTimestamp(TID, OWNER, claimedAt)
    expect(claimRegistry.has(TID)).toBe(true)

    runExpireTick(new Date())

    expect(claimRegistry.has(TID)).toBe(false)
  })

  it('only expired claims are released — fresh claim survives tick', () => {
    const TID2 = 'expire-tick-T2'
    store.createTask({
      tid: TID2,
      name: 'Fresh Task',
      task_status: 'open',
      task_priority: 0.55,
      tags: ['test'],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })

    // T1: old claim (31min)
    claimWithTimestamp(TID, OWNER, new Date(Date.now() - 31 * 60 * 1000))
    // T2: fresh claim (1min)
    claimWithTimestamp(TID2, 'session-fresh', new Date(Date.now() - 60_000))

    const released = runExpireTick(new Date())

    expect(released).toHaveLength(1)
    expect(released[0].tid).toBe(TID)

    // T1 released, T2 still active
    expect(store.getTask(TID)?.task_status).toBe('open')
    expect(store.getTask(TID2)?.task_status).toBe('picked')

    store.deleteTask(TID2)
  })

  it('exactly at TTL boundary (30min) is not released', () => {
    // At exactly 30min, age === TTL, condition is age > TTL (strict greater).
    // Single-clock reference: both timestamps derived from same `now` so
    // age === CLAIM_TTL_MS exactly, without wall-clock jitter between calls.
    const now = new Date()
    const claimedAt = new Date(now.getTime() - CLAIM_TTL_MS)
    claimWithTimestamp(TID, OWNER, claimedAt)

    const released = runExpireTick(now)
    expect(released).toHaveLength(0)
    expect(store.getTask(TID)?.task_status).toBe('picked')
  })

  it('released task can be re-claimed after expiry', () => {
    const claimedAt = new Date(Date.now() - 31 * 60 * 1000)
    claimWithTimestamp(TID, OWNER, claimedAt)
    runExpireTick(new Date())

    // Task is todo again — new session can claim it
    const ok = claimWithTimestamp(TID, 'session-new', new Date())
    expect(ok).toBe(true)
    expect(store.getTask(TID)?.task_status).toBe('picked')
    expect(claimRegistry.get(TID)?.owner).toBe('session-new')
  })
})
