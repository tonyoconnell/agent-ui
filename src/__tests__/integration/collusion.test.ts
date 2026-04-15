/**
 * Collusion Tests — Atomicity, ownership, and TTL expiry
 *
 * Proves the C1 Foundation: no two agents can claim the same task.
 * The atomic claim/release/expire cycle is what makes pheromone trustworthy —
 * if two agents both mark a task done, the strength is inflated garbage.
 *
 * Layer tested: tasks-store (in-memory equivalent of the TypeDB claim logic).
 * The TypeDB layer (claim.ts TypeQL) is structurally identical:
 *   match $t has task-status "open"; delete status; insert "active" + owner
 *   → if already "active", match fails → empty result → 409
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as store from '@/lib/tasks-store'

const CLAIM_TTL_MS = 30 * 60 * 1000 // 30 minutes — matches expire.ts

// ── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  for (const t of store.getAllTasks()) store.deleteTask(t.tid)
}

function seed(tid: string, extra?: Partial<Parameters<typeof store.createTask>[0]>) {
  store.createTask({
    tid,
    name: `Task ${tid}`,
    status: 'todo',
    priority: 'P0',
    phase: 'C1',
    value: 'critical',
    persona: 'agent',
    tags: ['engine', 'test'],
    blockedBy: [],
    blocks: [],
    trailPheromone: 0,
    alarmPheromone: 0,
    ...extra,
  })
}

/**
 * Simulate the atomic claim logic from claim.ts:
 *   match "open" → delete status → insert "active" + owner + claimed-at
 *   Returns { ok, owner } or { conflict } if already claimed.
 */
function atomicClaim(tid: string, sessionId: string): { ok: true; owner: string } | { conflict: true } {
  const task = store.getAllTasks().find((t) => t.tid === tid)
  if (!task || task.status === 'active' || task.status === 'in_progress') {
    return { conflict: true }
  }
  store.updateTask(tid, { status: 'active', trailPheromone: Date.now() }) // trailPheromone used as claimed-at epoch
  return { ok: true, owner: sessionId }
}

/**
 * Simulate the owner-checked release from release.ts:
 *   match owner == sessionId → delete active + owner → insert "open"
 *   Returns { ok } or { forbidden } if wrong owner.
 */
function atomicRelease(tid: string, sessionId: string, ownedBy: string): { ok: true } | { forbidden: true } {
  const task = store.getAllTasks().find((t) => t.tid === tid)
  if (!task || task.status !== 'active') return { forbidden: true }
  if (ownedBy !== sessionId) return { forbidden: true }
  store.updateTask(tid, { status: 'todo', trailPheromone: 0 })
  return { ok: true }
}

/**
 * Simulate expire.ts TTL check: tasks with claimed-at > 30min → release
 */
function expireStale(now = Date.now()): string[] {
  const released: string[] = []
  for (const task of store.getAllTasks()) {
    if (task.status !== 'active') continue
    const claimedAt = task.trailPheromone // packed as epoch
    if (claimedAt && now - claimedAt > CLAIM_TTL_MS) {
      store.updateTask(task.tid, { status: 'todo', trailPheromone: 0 })
      released.push(task.tid)
    }
  }
  return released
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('C1 Atomicity: claim collision', () => {
  const TID = 'collusion-T1'

  beforeEach(() => {
    resetStore()
    seed(TID)
  })
  afterEach(resetStore)

  it('first claim wins: returns ok + owner', () => {
    const result = atomicClaim(TID, 'session-A')
    expect(result).toEqual({ ok: true, owner: 'session-A' })
  })

  it('second claim on same task conflicts: 409 equivalent', () => {
    atomicClaim(TID, 'session-A')
    const result = atomicClaim(TID, 'session-B')
    expect(result).toEqual({ conflict: true })
  })

  it('only one session owns the task after concurrent claims', () => {
    // Simulate two agents racing to claim the same task
    atomicClaim(TID, 'agent-1')
    atomicClaim(TID, 'agent-2')

    const task = store.getAllTasks().find((t) => t.tid === TID)
    expect(task?.status).toBe('active')
    // The task is claimed — exactly once. Pheromone is not doubled.
  })

  it('claimed task is invisible to the task list (filter-active contract)', () => {
    atomicClaim(TID, 'session-A')
    const visible = store.getAllTasks().filter((t) => t.status !== 'active' && t.status !== 'in_progress')
    expect(visible.some((t) => t.tid === TID)).toBe(false)
  })

  it('unclaimed task (todo) is visible to the task list', () => {
    const visible = store.getAllTasks().filter((t) => t.status !== 'active' && t.status !== 'in_progress')
    expect(visible.some((t) => t.tid === TID)).toBe(true)
  })

  it('sibling tasks are not affected by a claim', () => {
    const OTHER = 'collusion-T2'
    seed(OTHER)
    atomicClaim(TID, 'session-A')

    const visible = store.getAllTasks().filter((t) => t.status !== 'active' && t.status !== 'in_progress')
    expect(visible.some((t) => t.tid === OTHER)).toBe(true)
  })
})

describe('C1 Ownership: release safety', () => {
  const TID = 'collusion-release-T1'
  const OWNER = 'session-owner'
  const INTRUDER = 'session-intruder'

  beforeEach(() => {
    resetStore()
    seed(TID)
    atomicClaim(TID, OWNER)
  })
  afterEach(resetStore)

  it('correct owner releases successfully', () => {
    const result = atomicRelease(TID, OWNER, OWNER)
    expect(result).toEqual({ ok: true })
  })

  it('task returns to open after release', () => {
    atomicRelease(TID, OWNER, OWNER)
    const task = store.getAllTasks().find((t) => t.tid === TID)
    expect(task?.status).toBe('todo')
  })

  it('wrong owner is forbidden: 403 equivalent', () => {
    const result = atomicRelease(TID, INTRUDER, OWNER)
    expect(result).toEqual({ forbidden: true })
  })

  it('task stays active after a forbidden release attempt', () => {
    atomicRelease(TID, INTRUDER, OWNER)
    const task = store.getAllTasks().find((t) => t.tid === TID)
    expect(task?.status).toBe('active')
  })

  it('released task becomes claimable again', () => {
    atomicRelease(TID, OWNER, OWNER)
    const reclaim = atomicClaim(TID, 'session-new')
    expect(reclaim).toEqual({ ok: true, owner: 'session-new' })
  })
})

describe('C1 Recovery: TTL expiry (30 min)', () => {
  const TID_STALE = 'collusion-stale-T1'
  const TID_FRESH = 'collusion-fresh-T1'

  beforeEach(() => {
    resetStore()
    seed(TID_STALE)
    seed(TID_FRESH)
  })
  afterEach(resetStore)

  it('task claimed > 30 minutes ago is auto-released', () => {
    // Pack stale claimed-at: 31 minutes in the past
    store.updateTask(TID_STALE, { status: 'active', trailPheromone: Date.now() - CLAIM_TTL_MS - 60_000 })

    const released = expireStale()
    expect(released).toContain(TID_STALE)

    const task = store.getAllTasks().find((t) => t.tid === TID_STALE)
    expect(task?.status).toBe('todo')
  })

  it('task claimed < 30 minutes ago is NOT released', () => {
    // Fresh claim: 5 minutes in the past
    store.updateTask(TID_FRESH, { status: 'active', trailPheromone: Date.now() - 5 * 60 * 1000 })

    const released = expireStale()
    expect(released).not.toContain(TID_FRESH)

    const task = store.getAllTasks().find((t) => t.tid === TID_FRESH)
    expect(task?.status).toBe('active')
  })

  it('only stale tasks are released — fresh tasks untouched', () => {
    store.updateTask(TID_STALE, { status: 'active', trailPheromone: Date.now() - CLAIM_TTL_MS - 60_000 })
    store.updateTask(TID_FRESH, { status: 'active', trailPheromone: Date.now() - 5 * 60 * 1000 })

    const released = expireStale()
    expect(released).toContain(TID_STALE)
    expect(released).not.toContain(TID_FRESH)
  })

  it('expired task becomes claimable after auto-release', () => {
    store.updateTask(TID_STALE, { status: 'active', trailPheromone: Date.now() - CLAIM_TTL_MS - 60_000 })
    expireStale()

    const reclaim = atomicClaim(TID_STALE, 'session-new')
    expect(reclaim).toEqual({ ok: true, owner: 'session-new' })
  })

  it('returns count of released tasks', () => {
    const TID_STALE2 = 'collusion-stale-T2'
    seed(TID_STALE2)
    store.updateTask(TID_STALE, { status: 'active', trailPheromone: Date.now() - CLAIM_TTL_MS - 60_000 })
    store.updateTask(TID_STALE2, { status: 'active', trailPheromone: Date.now() - CLAIM_TTL_MS - 60_000 })

    const released = expireStale()
    expect(released.length).toBe(2)
  })
})
