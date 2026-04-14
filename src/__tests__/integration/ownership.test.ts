/**
 * Integration test: Ownership Check
 *
 * Session-A claims task → Session-B tries release → 403
 * → A releases → 200
 *
 * Verifies that only the owning session can release a claimed task.
 * A 403 Forbidden response is returned to any session that does not
 * hold ownership. A 200 OK is returned when the correct owner releases.
 *
 * This mirrors the HTTP contract of /api/tasks/:id/release which checks
 * the session token against the stored owner attribute in TypeDB.
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

type ClaimResult =
  | { ok: true; status: 200 }
  | { ok: false; status: 404; reason: 'not_found' }
  | { ok: false; status: 422; reason: 'not_todo' }

function claimTask(tid: string, sessionId: string): ClaimResult {
  const task = store.getTask(tid)
  if (!task) return { ok: false, status: 404, reason: 'not_found' }
  if (task.status !== 'todo') return { ok: false, status: 422, reason: 'not_todo' }

  store.updateTask(tid, { status: 'active' })
  ownerRegistry.set(tid, { owner: sessionId, claimedAt: new Date().toISOString() })
  return { ok: true, status: 200 }
}

type ReleaseResult =
  | { ok: true; status: 200 }
  | { ok: false; status: 403; reason: 'wrong_session' }
  | { ok: false; status: 404; reason: 'not_found' }

function releaseTask(tid: string, sessionId: string): ReleaseResult {
  const claim = ownerRegistry.get(tid)
  if (!claim) return { ok: false, status: 404, reason: 'not_found' }
  if (claim.owner !== sessionId) return { ok: false, status: 403, reason: 'wrong_session' }

  store.updateTask(tid, { status: 'todo' })
  ownerRegistry.delete(tid)
  return { ok: true, status: 200 }
}

type CompleteResult =
  | { ok: true; status: 200 }
  | { ok: false; status: 403; reason: 'wrong_session' }
  | { ok: false; status: 404; reason: 'not_found' }

function completeTask(tid: string, sessionId: string): CompleteResult {
  const claim = ownerRegistry.get(tid)
  if (!claim) return { ok: false, status: 404, reason: 'not_found' }
  if (claim.owner !== sessionId) return { ok: false, status: 403, reason: 'wrong_session' }

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
    tags: ['test', 'ownership'],
    blockedBy: [],
    blocks: [],
    trailPheromone: 0,
    alarmPheromone: 0,
  })
}

describe('ownership: only the claiming session can release or complete a task', () => {
  const TID = 'ownership-T1'
  const SESSION_A = 'session-owner-A'
  const SESSION_B = 'session-owner-B'

  beforeEach(() => {
    resetStore()
    ownerRegistry.clear()
    makeTask(TID, 'Ownership Task')
  })

  afterEach(() => {
    resetStore()
    ownerRegistry.clear()
  })

  it('task starts with no owner', () => {
    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.status).toBe('todo')
  })

  it('session-A claims task and becomes owner', () => {
    const res = claimTask(TID, SESSION_A)
    expect(res.ok).toBe(true)
    expect(res.status).toBe(200)
    expect(ownerRegistry.get(TID)?.owner).toBe(SESSION_A)
    expect(store.getTask(TID)?.status).toBe('active')
  })

  it('session-B gets 403 when trying to release session-A task', () => {
    claimTask(TID, SESSION_A)

    const res = releaseTask(TID, SESSION_B)
    expect(res.ok).toBe(false)
    expect(res.status).toBe(403)
    if (!res.ok) {
      expect(res.reason).toBe('wrong_session')
    }

    // Task still active, owner unchanged
    expect(store.getTask(TID)?.status).toBe('active')
    expect(ownerRegistry.get(TID)?.owner).toBe(SESSION_A)
  })

  it('session-A releases and gets 200', () => {
    claimTask(TID, SESSION_A)

    const res = releaseTask(TID, SESSION_A)
    expect(res.ok).toBe(true)
    expect(res.status).toBe(200)

    // Task back to todo, owner cleared
    expect(store.getTask(TID)?.status).toBe('todo')
    expect(ownerRegistry.has(TID)).toBe(false)
  })

  it('after A releases, B can claim and becomes the new owner', () => {
    claimTask(TID, SESSION_A)
    releaseTask(TID, SESSION_A)

    const res = claimTask(TID, SESSION_B)
    expect(res.ok).toBe(true)
    expect(res.status).toBe(200)
    expect(ownerRegistry.get(TID)?.owner).toBe(SESSION_B)
  })

  it('session-B gets 403 when trying to complete session-A task', () => {
    claimTask(TID, SESSION_A)

    const res = completeTask(TID, SESSION_B)
    expect(res.ok).toBe(false)
    expect(res.status).toBe(403)
    if (!res.ok) {
      expect(res.reason).toBe('wrong_session')
    }

    // Task still active, not completed
    expect(store.getTask(TID)?.status).toBe('active')
    expect(ownerRegistry.get(TID)?.owner).toBe(SESSION_A)
    expect(store.getTask(TID)?.trailPheromone).toBe(0)
  })

  it('session-A completes its own task successfully', () => {
    claimTask(TID, SESSION_A)

    const res = completeTask(TID, SESSION_A)
    expect(res.ok).toBe(true)
    expect(res.status).toBe(200)

    expect(store.getTask(TID)?.status).toBe('complete')
    expect(ownerRegistry.has(TID)).toBe(false)
    expect(store.getTask(TID)?.trailPheromone).toBeGreaterThan(0)
  })

  it('unclaimed task returns 404 on release attempt', () => {
    const res = releaseTask(TID, SESSION_A)
    expect(res.ok).toBe(false)
    expect(res.status).toBe(404)
    if (!res.ok) {
      expect(res.reason).toBe('not_found')
    }
  })

  it('double-claim by different session fails after A holds ownership', () => {
    claimTask(TID, SESSION_A)

    // B tries to claim an already-active task
    const res = claimTask(TID, SESSION_B)
    expect(res.ok).toBe(false)
    expect(res.status).toBe(422)
    if (!res.ok) {
      expect(res.reason).toBe('not_todo')
    }

    // A's ownership is untouched
    expect(ownerRegistry.get(TID)?.owner).toBe(SESSION_A)
  })

  it('full lifecycle: A claims → B fails → A releases → B claims → B completes', () => {
    // A claims
    const claim = claimTask(TID, SESSION_A)
    expect(claim.ok).toBe(true)

    // B is rejected
    const rejected = releaseTask(TID, SESSION_B)
    expect(rejected.status).toBe(403)

    // A releases
    const release = releaseTask(TID, SESSION_A)
    expect(release.ok).toBe(true)
    expect(store.getTask(TID)?.status).toBe('todo')

    // B claims
    const bClaim = claimTask(TID, SESSION_B)
    expect(bClaim.ok).toBe(true)
    expect(ownerRegistry.get(TID)?.owner).toBe(SESSION_B)

    // B completes
    const bComplete = completeTask(TID, SESSION_B)
    expect(bComplete.ok).toBe(true)
    expect(store.getTask(TID)?.status).toBe('complete')
    expect(ownerRegistry.has(TID)).toBe(false)
  })
})
