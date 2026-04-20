/**
 * Integration test: Wave-Lock Exclusivity
 *
 * Session-A claims wave → Session-B gets 409 → A releases → B can claim
 * → ownership check (wrong session can't release)
 *
 * A "wave lock" is a claim on all tasks belonging to a given wave phase.
 * Only one session may hold the wave lock at a time. A second session
 * attempting to claim any task in the same wave receives a 409 Conflict.
 *
 * This test operates at the store layer, simulating the HTTP status codes
 * that the API layer would return.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as store from '@/lib/tasks-store'

function resetStore() {
  const all = store.getAllTasks()
  for (const t of all) {
    store.deleteTask(t.tid)
  }
}

/** Wave lock registry — maps wave phase → owning session */
const waveLocks = new Map<string, string>()

/** In-memory owner registry for individual tasks */
const ownerRegistry = new Map<string, { owner: string; claimedAt: string }>()

type ClaimResult =
  | { ok: true; status: 200 }
  | { ok: false; status: 409; reason: 'wave_locked' }
  | { ok: false; status: 404; reason: 'not_found' }
  | { ok: false; status: 422; reason: 'not_todo' }

/** Claim a task, respecting wave exclusivity */
function claimTask(tid: string, sessionId: string): ClaimResult {
  const task = store.getTask(tid)
  if (!task) return { ok: false, status: 404, reason: 'not_found' }
  if (task.task_status !== 'open') return { ok: false, status: 422, reason: 'not_todo' }

  const wave = task.task_wave ?? 'W3'

  // Check wave lock
  const lockHolder = waveLocks.get(wave)
  if (lockHolder && lockHolder !== sessionId) {
    return { ok: false, status: 409, reason: 'wave_locked' }
  }

  // Acquire wave lock if not already held by this session
  if (!lockHolder) {
    waveLocks.set(wave, sessionId)
  }

  store.updateTask(tid, { task_status: 'picked' })
  ownerRegistry.set(tid, { owner: sessionId, claimedAt: new Date().toISOString() })
  return { ok: true, status: 200 }
}

type ReleaseResult =
  | { ok: true; status: 200 }
  | { ok: false; status: 403; reason: 'wrong_session' }
  | { ok: false; status: 404; reason: 'not_found' }

/** Release a task; also frees the wave lock if this was the last active task */
function releaseTask(tid: string, sessionId: string): ReleaseResult {
  const claim = ownerRegistry.get(tid)
  if (!claim) return { ok: false, status: 404, reason: 'not_found' }
  if (claim.owner !== sessionId) return { ok: false, status: 403, reason: 'wrong_session' }

  const task = store.getTask(tid)
  store.updateTask(tid, { task_status: 'open' })
  ownerRegistry.delete(tid)

  // Release wave lock if no other active tasks in this wave belong to this session
  if (task) {
    const wave = task.task_wave ?? 'W3'
    const stillActive = Array.from(ownerRegistry.values()).some((c) => c.owner === sessionId)
    if (!stillActive) {
      waveLocks.delete(wave)
    }
  }

  return { ok: true, status: 200 }
}

function makeTask(tid: string, name: string, phase: string = 'W3') {
  store.createTask({
    tid,
    name,
    task_status: 'open',
    task_priority: 0.75,
    task_wave: phase as import('@/types/task').TaskWave,
    tags: ['test', 'wave-lock'],
    blocked_by: [],
    blocks: [],
    strength: 0,
    resistance: 0,
  })
}

describe('wave-lock: exclusive wave ownership between sessions', () => {
  const TID_A = 'wave-lock-T1'
  const TID_B = 'wave-lock-T2'
  const WAVE = 'W3'
  const SESSION_A = 'session-wave-A'
  const SESSION_B = 'session-wave-B'

  beforeEach(() => {
    resetStore()
    ownerRegistry.clear()
    waveLocks.clear()
    makeTask(TID_A, 'Wave Task A', WAVE)
    makeTask(TID_B, 'Wave Task B', WAVE)
  })

  afterEach(() => {
    resetStore()
    ownerRegistry.clear()
    waveLocks.clear()
  })

  it('session-A can claim a task in the wave', () => {
    const res = claimTask(TID_A, SESSION_A)
    expect(res.ok).toBe(true)
    expect(res.status).toBe(200)
    expect(waveLocks.get(WAVE)).toBe(SESSION_A)
  })

  it('session-B gets 409 when session-A holds the wave lock', () => {
    claimTask(TID_A, SESSION_A)

    const res = claimTask(TID_B, SESSION_B)
    expect(res.ok).toBe(false)
    expect(res.status).toBe(409)
    if (!res.ok) {
      expect(res.reason).toBe('wave_locked')
    }

    // TID_B must still be open — not claimed
    expect(store.getTask(TID_B)?.task_status).toBe('open')
  })

  it('session-A releases → session-B can then claim', () => {
    claimTask(TID_A, SESSION_A)

    // B is blocked
    const blocked = claimTask(TID_B, SESSION_B)
    expect(blocked.status).toBe(409)

    // A releases
    const rel = releaseTask(TID_A, SESSION_A)
    expect(rel.ok).toBe(true)
    expect(rel.status).toBe(200)

    // Wave lock freed
    expect(waveLocks.has(WAVE)).toBe(false)

    // B can now claim
    const claimed = claimTask(TID_B, SESSION_B)
    expect(claimed.ok).toBe(true)
    expect(claimed.status).toBe(200)
    expect(waveLocks.get(WAVE)).toBe(SESSION_B)
  })

  it('wrong session cannot release a task', () => {
    claimTask(TID_A, SESSION_A)

    const res = releaseTask(TID_A, SESSION_B)
    expect(res.ok).toBe(false)
    expect(res.status).toBe(403)
    if (!res.ok) {
      expect(res.reason).toBe('wrong_session')
    }

    // Wave lock still belongs to A
    expect(waveLocks.get(WAVE)).toBe(SESSION_A)
    expect(store.getTask(TID_A)?.task_status).toBe('picked')
  })

  it('same session can claim multiple tasks in the same wave', () => {
    const res1 = claimTask(TID_A, SESSION_A)
    const res2 = claimTask(TID_B, SESSION_A)

    expect(res1.ok).toBe(true)
    expect(res2.ok).toBe(true)

    expect(ownerRegistry.get(TID_A)?.owner).toBe(SESSION_A)
    expect(ownerRegistry.get(TID_B)?.owner).toBe(SESSION_A)
    expect(waveLocks.get(WAVE)).toBe(SESSION_A)
  })

  it('wave lock persists until all session-A tasks are released', () => {
    claimTask(TID_A, SESSION_A)
    claimTask(TID_B, SESSION_A)

    // Release TID_A — TID_B still active under A
    releaseTask(TID_A, SESSION_A)
    expect(waveLocks.get(WAVE)).toBe(SESSION_A) // still locked

    // Release TID_B — now fully free
    releaseTask(TID_B, SESSION_A)
    expect(waveLocks.has(WAVE)).toBe(false)
  })

  it('tasks in different waves can be claimed by different sessions simultaneously', () => {
    const TID_W4 = 'wave-lock-T3'
    makeTask(TID_W4, 'Wave Task W4', 'W4')

    const resA = claimTask(TID_A, SESSION_A) // W3 → SESSION_A
    const resB = claimTask(TID_W4, SESSION_B) // W4 → SESSION_B

    expect(resA.ok).toBe(true)
    expect(resB.ok).toBe(true)

    expect(waveLocks.get('W3')).toBe(SESSION_A)
    expect(waveLocks.get('W4')).toBe(SESSION_B)

    store.deleteTask(TID_W4)
  })
})
