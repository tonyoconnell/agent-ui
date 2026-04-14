/**
 * Integration test: Parallel Sessions
 *
 * Two sessions claim different tasks in parallel (Promise.all) → both complete
 * → both owners cleared.
 *
 * Verifies that concurrent claim operations on distinct tasks do not interfere
 * with each other. Each session sees its own ownership throughout; completion
 * removes both owners atomically with no cross-contamination.
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

function claimWithOwner(tid: string, sessionId: string): boolean {
  const task = store.getTask(tid)
  if (!task || task.status !== 'todo') return false
  store.updateTask(tid, { status: 'active' })
  ownerRegistry.set(tid, { owner: sessionId, claimedAt: new Date().toISOString() })
  return true
}

function completeTask(tid: string, sessionId: string): { ok: boolean; status: number } {
  const claim = ownerRegistry.get(tid)
  if (!claim) return { ok: false, status: 404 }
  if (claim.owner !== sessionId) return { ok: false, status: 403 }

  store.markPheromone(tid, 'trail', 5.0)
  store.updateTask(tid, { status: 'complete' })
  store.cascadeUnblock(tid)
  ownerRegistry.delete(tid)
  return { ok: true, status: 200 }
}

function makeTask(tid: string, name: string) {
  store.createTask({
    tid,
    name,
    status: 'todo',
    priority: 'P1',
    phase: 'C3',
    value: 'high',
    persona: 'agent',
    tags: ['test', 'parallel'],
    blockedBy: [],
    blocks: [],
    trailPheromone: 0,
    alarmPheromone: 0,
  })
}

describe('parallel-sessions: two sessions claim and complete distinct tasks concurrently', () => {
  const TID_A = 'parallel-T1'
  const TID_B = 'parallel-T2'
  const SESSION_A = 'session-parallel-A'
  const SESSION_B = 'session-parallel-B'

  beforeEach(() => {
    resetStore()
    ownerRegistry.clear()
    makeTask(TID_A, 'Parallel Task A')
    makeTask(TID_B, 'Parallel Task B')
  })

  afterEach(() => {
    resetStore()
    ownerRegistry.clear()
  })

  it('both tasks start as todo', () => {
    expect(store.getTask(TID_A)?.status).toBe('todo')
    expect(store.getTask(TID_B)?.status).toBe('todo')
  })

  it('parallel claims on different tasks both succeed', async () => {
    const [okA, okB] = await Promise.all([
      Promise.resolve(claimWithOwner(TID_A, SESSION_A)),
      Promise.resolve(claimWithOwner(TID_B, SESSION_B)),
    ])

    expect(okA).toBe(true)
    expect(okB).toBe(true)

    expect(store.getTask(TID_A)?.status).toBe('active')
    expect(store.getTask(TID_B)?.status).toBe('active')

    expect(ownerRegistry.get(TID_A)?.owner).toBe(SESSION_A)
    expect(ownerRegistry.get(TID_B)?.owner).toBe(SESSION_B)
  })

  it('each session owns only its own task after parallel claim', async () => {
    await Promise.all([
      Promise.resolve(claimWithOwner(TID_A, SESSION_A)),
      Promise.resolve(claimWithOwner(TID_B, SESSION_B)),
    ])

    // Cross-check: SESSION_A does not own TID_B and vice versa
    expect(ownerRegistry.get(TID_A)?.owner).not.toBe(SESSION_B)
    expect(ownerRegistry.get(TID_B)?.owner).not.toBe(SESSION_A)
  })

  it('parallel completions both succeed and clear owners', async () => {
    claimWithOwner(TID_A, SESSION_A)
    claimWithOwner(TID_B, SESSION_B)

    const [resA, resB] = await Promise.all([
      Promise.resolve(completeTask(TID_A, SESSION_A)),
      Promise.resolve(completeTask(TID_B, SESSION_B)),
    ])

    expect(resA.ok).toBe(true)
    expect(resA.status).toBe(200)
    expect(resB.ok).toBe(true)
    expect(resB.status).toBe(200)

    // Both owners cleared
    expect(ownerRegistry.has(TID_A)).toBe(false)
    expect(ownerRegistry.has(TID_B)).toBe(false)

    // Both tasks complete
    expect(store.getTask(TID_A)?.status).toBe('complete')
    expect(store.getTask(TID_B)?.status).toBe('complete')
  })

  it('trail pheromone accumulates on both tasks after parallel completion', async () => {
    claimWithOwner(TID_A, SESSION_A)
    claimWithOwner(TID_B, SESSION_B)

    await Promise.all([
      Promise.resolve(completeTask(TID_A, SESSION_A)),
      Promise.resolve(completeTask(TID_B, SESSION_B)),
    ])

    expect(store.getTask(TID_A)?.trailPheromone).toBeGreaterThan(0)
    expect(store.getTask(TID_B)?.trailPheromone).toBeGreaterThan(0)
  })

  it('session-A cannot complete session-B task even after parallel claim', async () => {
    await Promise.all([
      Promise.resolve(claimWithOwner(TID_A, SESSION_A)),
      Promise.resolve(claimWithOwner(TID_B, SESSION_B)),
    ])

    // SESSION_A tries to complete TID_B (owned by SESSION_B)
    const wrongRes = completeTask(TID_B, SESSION_A)
    expect(wrongRes.ok).toBe(false)
    expect(wrongRes.status).toBe(403)

    // TID_B still active, still owned by SESSION_B
    expect(store.getTask(TID_B)?.status).toBe('active')
    expect(ownerRegistry.get(TID_B)?.owner).toBe(SESSION_B)
  })

  it('parallel claim of same task: only first succeeds', async () => {
    // Both sessions try to claim TID_A simultaneously
    // Promise.all runs them in order of resolution; since store ops are synchronous,
    // the first one to execute wins — the second sees status !== 'todo'
    const results = await Promise.all([
      Promise.resolve(claimWithOwner(TID_A, SESSION_A)),
      Promise.resolve(claimWithOwner(TID_A, SESSION_B)),
    ])

    const winners = results.filter(Boolean)
    expect(winners).toHaveLength(1)

    // Exactly one owner set
    const claim = ownerRegistry.get(TID_A)
    expect(claim).toBeDefined()
    // The winner is whichever resolved first (SESSION_A in synchronous execution)
    expect([SESSION_A, SESSION_B]).toContain(claim?.owner)
  })
})
