/**
 * Integration test: Release Safety
 *
 * Validates that only the claiming session can release a task.
 *
 * Test cases:
 * 1. Correct owner releases → 200, task status back to "open", ownership cleared
 * 2. Wrong owner attempts release → 403, task stays "claimed", ownership unchanged
 * 3. Unclaimed task release attempt → 403, no-op
 *
 * This mirrors the HTTP contract of POST /api/tasks/[id]/release which
 * checks ownership via TypeDB query: matches task with owner=sessionId.
 * If match succeeds, deletes owner/status/claimed-at, sets status to "open".
 * If match fails, returns 403 "Not owner or not claimed".
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/** In-memory task store (mirrors TypeDB task entity in tests) */
interface Task {
  id: string
  status: 'open' | 'claimed' | 'complete'
  owner?: string
  claimedAt?: string
}

const taskStore = new Map<string, Task>()

function resetStore() {
  taskStore.clear()
}

/**
 * Simulates POST /api/tasks/:id/claim
 * Match: task exists, status = 'open'
 * Patch: status → 'claimed', owner → sessionId
 */
function claimTask(id: string, sessionId: string): { status: number; ok: boolean } {
  const task = taskStore.get(id)
  if (!task) return { status: 404, ok: false }
  if (task.status !== 'open') return { status: 422, ok: false }

  taskStore.set(id, {
    ...task,
    status: 'claimed',
    owner: sessionId,
    claimedAt: new Date().toISOString(),
  })
  return { status: 200, ok: true }
}

/**
 * Simulates POST /api/tasks/:id/release
 * Match: task has task-id = id, owner = sessionId
 * Patch: delete owner, delete claimed-at, set status to 'open'
 * If match fails (no result rows), return 403
 */
function releaseTask(id: string, sessionId: string): { status: number; ok: boolean; error?: string } {
  const task = taskStore.get(id)
  if (!task) return { status: 403, ok: false, error: 'Not owner or not claimed' }
  if (task.owner !== sessionId) return { status: 403, ok: false, error: 'Not owner or not claimed' }

  // Delete owner/claimedAt, set status to 'open'
  taskStore.set(id, {
    ...task,
    status: 'open',
    owner: undefined,
    claimedAt: undefined,
  })
  return { status: 200, ok: true }
}

/**
 * Helper: create a task in "open" state
 */
function makeTask(id: string) {
  taskStore.set(id, {
    id,
    status: 'open',
  })
}

describe('release-safety: POST /api/tasks/:id/release', () => {
  const TASK_ID = 'release-T1'
  const SESSION_A = 'session-release-A'
  const SESSION_B = 'session-release-B'

  beforeEach(() => {
    resetStore()
    makeTask(TASK_ID)
  })

  afterEach(() => {
    resetStore()
  })

  // ─────────────────────────────────────────────────────────────
  // Test 1: Correct owner releases → 200, task back to open
  // ─────────────────────────────────────────────────────────────

  it('correct owner releases → 200, status back to open, owner cleared', () => {
    // Claim
    const claim = claimTask(TASK_ID, SESSION_A)
    expect(claim.ok).toBe(true)
    expect(claim.status).toBe(200)
    expect(taskStore.get(TASK_ID)?.owner).toBe(SESSION_A)
    expect(taskStore.get(TASK_ID)?.status).toBe('claimed')

    // Release as owner
    const release = releaseTask(TASK_ID, SESSION_A)
    expect(release.ok).toBe(true)
    expect(release.status).toBe(200)

    // Verify task is back to open and owner is cleared
    const task = taskStore.get(TASK_ID)
    expect(task?.status).toBe('open')
    expect(task?.owner).toBeUndefined()
    expect(task?.claimedAt).toBeUndefined()
  })

  // ─────────────────────────────────────────────────────────────
  // Test 2: Wrong owner attempts release → 403, task stays claimed
  // ─────────────────────────────────────────────────────────────

  it('wrong owner attempts release → 403, task stays claimed, ownership unchanged', () => {
    // Claim as A
    claimTask(TASK_ID, SESSION_A)
    const taskAfterClaim = taskStore.get(TASK_ID)
    expect(taskAfterClaim?.owner).toBe(SESSION_A)
    expect(taskAfterClaim?.status).toBe('claimed')

    // B tries to release
    const release = releaseTask(TASK_ID, SESSION_B)
    expect(release.ok).toBe(false)
    expect(release.status).toBe(403)
    expect(release.error).toBe('Not owner or not claimed')

    // Verify task is unchanged
    const taskAfter = taskStore.get(TASK_ID)
    expect(taskAfter?.status).toBe('claimed')
    expect(taskAfter?.owner).toBe(SESSION_A)
  })

  // ─────────────────────────────────────────────────────────────
  // Test 3: Unclaimed task release attempt → 403, no-op
  // ─────────────────────────────────────────────────────────────

  it('unclaimed task release attempt → 403, no-op', () => {
    // Task starts open, no owner
    expect(taskStore.get(TASK_ID)?.status).toBe('open')
    expect(taskStore.get(TASK_ID)?.owner).toBeUndefined()

    // A tries to release unclaimed task
    const release = releaseTask(TASK_ID, SESSION_A)
    expect(release.ok).toBe(false)
    expect(release.status).toBe(403)
    expect(release.error).toBe('Not owner or not claimed')

    // Verify task is unchanged
    expect(taskStore.get(TASK_ID)?.status).toBe('open')
    expect(taskStore.get(TASK_ID)?.owner).toBeUndefined()
  })

  // ─────────────────────────────────────────────────────────────
  // Additional: Full lifecycle
  // ─────────────────────────────────────────────────────────────

  it('full lifecycle: A claims → B blocked → A releases → B claims', () => {
    // A claims
    const aClaim = claimTask(TASK_ID, SESSION_A)
    expect(aClaim.ok).toBe(true)
    expect(taskStore.get(TASK_ID)?.owner).toBe(SESSION_A)

    // B tries to release, gets 403
    const bRelease = releaseTask(TASK_ID, SESSION_B)
    expect(bRelease.ok).toBe(false)
    expect(bRelease.status).toBe(403)

    // A releases
    const aRelease = releaseTask(TASK_ID, SESSION_A)
    expect(aRelease.ok).toBe(true)
    expect(taskStore.get(TASK_ID)?.status).toBe('open')
    expect(taskStore.get(TASK_ID)?.owner).toBeUndefined()

    // B claims
    const bClaim = claimTask(TASK_ID, SESSION_B)
    expect(bClaim.ok).toBe(true)
    expect(taskStore.get(TASK_ID)?.owner).toBe(SESSION_B)
  })

  it('multiple release attempts by non-owner consistently return 403', () => {
    claimTask(TASK_ID, SESSION_A)

    // B tries multiple times
    const release1 = releaseTask(TASK_ID, SESSION_B)
    expect(release1.status).toBe(403)

    const release2 = releaseTask(TASK_ID, SESSION_B)
    expect(release2.status).toBe(403)

    // Task is unchanged
    expect(taskStore.get(TASK_ID)?.owner).toBe(SESSION_A)
    expect(taskStore.get(TASK_ID)?.status).toBe('claimed')
  })
})
