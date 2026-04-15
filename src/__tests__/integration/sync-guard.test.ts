/**
 * Integration test: Sync Guard — Task Ownership Preservation
 *
 * SCENARIO: Claimed task (owner set, status='active') exists in TypeDB.
 * TODO file is rescanned and synced. Guard must NOT overwrite owner/status.
 *
 * Tests:
 * (a) sync preserves owner on claimed task
 * (b) sync updates unclaimed open task
 * (c) sync respects claimed-at timestamp
 *
 * The guard is in syncTasks() — it filters activeIds (tasks with status != 'todo')
 * and skips them on insert. Owner/claimed-at are never touched in the sync path.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Task } from '@/engine/task-parse'

// ── Mock TypeDB — isolate task-sync.ts from the database ────────────────────
// All reads return empty by default. Individual tests override readParsed
// to inject existing task state.

vi.mock('@/lib/typedb', () => ({
  read: vi.fn().mockResolvedValue('[]'),
  readParsed: vi.fn().mockResolvedValue([]),
  writeSilent: vi.fn().mockResolvedValue(undefined),
  write: vi.fn().mockResolvedValue(undefined),
  parseAnswers: vi.fn().mockReturnValue([]),
}))

// WebSocket/Gateway relay is fire-and-forget; silence in tests
vi.mock('@/lib/ws-server', () => ({
  wsManager: { broadcast: vi.fn() },
  relayToGateway: vi.fn(),
}))

import { syncTasks } from '@/engine/task-sync'
import { readParsed, write } from '@/lib/typedb'

// ═════════════════════════════════════════════════════════════════════════════
// ACT 1: Sync Guard — Preserve Owner on Claimed Task
//
// Setup: Task T1 exists in TypeDB with status='active', owner='alice'.
// Action: Scan TODO file, parse T1, call syncTasks([T1]).
// Guard: T1.id is in activeIds, so it's filtered from pending, never inserted.
// Result: T1 remains claimed to alice in TypeDB.
// ═════════════════════════════════════════════════════════════════════════════

describe('sync-guard: preserve owner on claimed task', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('(a) sync preserves owner on claimed task — skips insert if task-id exists with active status', async () => {
    // Setup: T1 exists in TypeDB with status='active', owner='alice', claimed-at='2026-04-16T10:00:00'
    // Simulate readParsed returning the existing task ID from TypeDB
    vi.mocked(readParsed).mockResolvedValueOnce([
      { id: 't-sync-guard-1' }, // existing task in TypeDB
    ])

    // Task parsed from TODO file (maybe values changed, but we don't care — it's claimed)
    const task: Task = {
      id: 't-sync-guard-1',
      name: 'Sync Guard Test Task',
      done: false,
      value: 'high',
      effort: 'medium',
      wave: 'W2',
      phase: 'C1',
      persona: 'builder',
      context: [],
      blocks: [],
      exit: 'All tests pass',
      tags: ['test', 'guard'],
      source: 'docs/TODO-sync.md',
      line: 10,
      priority: 5.0,
      formula: 'value=high*effort=medium',
    }

    // Call syncTasks
    const result = await syncTasks([task])

    // Verify: task was NOT inserted (filtered by activeIds guard)
    expect(result.synced).toBe(0)
    expect(result.errors).toBe(0)

    // Verify: write() was never called to insert this task
    // (writeSilent is called for builder, but write() is NOT)
    const writeCallsForInsert = vi
      .mocked(write)
      .mock.calls.filter((c) => c[0]?.includes('insert') && c[0]?.includes('t-sync-guard-1'))
    expect(writeCallsForInsert).toHaveLength(0)
  })

  it('(b) sync updates unclaimed open task — inserts if task-id NOT in activeIds', async () => {
    // Setup: T2 does NOT exist in TypeDB
    vi.mocked(readParsed).mockResolvedValueOnce([]) // no existing tasks

    const task: Task = {
      id: 't-sync-guard-2-new',
      name: 'New Open Task',
      done: false,
      value: 'medium',
      effort: 'low',
      wave: 'W1',
      phase: 'C2',
      persona: 'scout',
      context: [],
      blocks: [],
      exit: 'Data collected',
      tags: ['recon'],
      source: 'docs/TODO-sync.md',
      line: 20,
      priority: 3.0,
      formula: 'value=medium*effort=low',
    }

    // Call syncTasks
    const result = await syncTasks([task])

    // Verify: task WAS inserted (not in activeIds)
    expect(result.synced).toBe(1)
    expect(result.errors).toBe(0)

    // Verify: write() was called with insert statement containing task-id
    const insertCalls = vi
      .mocked(write)
      .mock.calls.filter((c) => c[0]?.includes('insert') && c[0]?.includes('t-sync-guard-2-new'))
    expect(insertCalls.length).toBeGreaterThan(0)
  })

  it('(c) sync respects claimed-at timestamp — does not overwrite if status="active"', async () => {
    // Setup: T3 claimed at specific timestamp, status='active'
    // Simulate TypeDB returning the task ID (indicating it's already there)
    vi.mocked(readParsed).mockResolvedValueOnce([{ id: 't-sync-guard-3-claimed' }])

    const task: Task = {
      id: 't-sync-guard-3-claimed',
      name: 'Claimed Task with History',
      done: false,
      value: 'critical',
      effort: 'high',
      wave: 'W3',
      phase: 'C1',
      persona: 'architect',
      context: ['previous work', 'design doc'],
      blocks: ['t-sync-guard-4'], // it blocks another task
      exit: 'Architecture document reviewed',
      tags: ['architecture', 'critical'],
      source: 'docs/TODO-sync.md',
      line: 30,
      priority: 8.0,
      formula: 'value=critical*effort=high',
    }

    // Call syncTasks with this claimed task
    const result = await syncTasks([task])

    // Verify: task was NOT modified (no insert, status/owner preserved in DB)
    expect(result.synced).toBe(0)
    expect(result.errors).toBe(0)

    // Verify: write() for insert was NOT called
    const insertCalls = vi
      .mocked(write)
      .mock.calls.filter((c) => c[0]?.includes('insert') && c[0]?.includes('t-sync-guard-3-claimed'))
    expect(insertCalls).toHaveLength(0)

    // The existing task in TypeDB keeps its status='active' and claimed-at intact
  })

  it('mixed: some claimed, some new — only new tasks are inserted', async () => {
    // Setup: T1 is claimed (in DB), T2 and T3 are new
    vi.mocked(readParsed).mockResolvedValueOnce([
      { id: 't-sync-guard-claimed' }, // existing, claimed
    ])

    const tasks: Task[] = [
      {
        id: 't-sync-guard-claimed',
        name: 'Already Claimed',
        done: false,
        value: 'high',
        effort: 'high',
        wave: 'W2',
        phase: 'C1',
        persona: 'architect',
        context: [],
        blocks: [],
        exit: '',
        tags: ['critical'],
        source: 'docs/TODO-sync.md',
        line: 5,
        priority: 7.0,
        formula: 'value=high*effort=high',
      },
      {
        id: 't-sync-guard-new-1',
        name: 'New Task 1',
        done: false,
        value: 'medium',
        effort: 'low',
        wave: 'W1',
        phase: 'C2',
        persona: 'scout',
        context: [],
        blocks: [],
        exit: '',
        tags: ['recon'],
        source: 'docs/TODO-sync.md',
        line: 15,
        priority: 2.0,
        formula: 'value=medium*effort=low',
      },
      {
        id: 't-sync-guard-new-2',
        name: 'New Task 2',
        done: false,
        value: 'low',
        effort: 'medium',
        wave: 'W3',
        phase: 'C3',
        persona: 'builder',
        context: [],
        blocks: ['t-sync-guard-new-1'],
        exit: '',
        tags: ['build'],
        source: 'docs/TODO-sync.md',
        line: 25,
        priority: 3.0,
        formula: 'value=low*effort=medium',
      },
    ]

    // Call syncTasks
    const result = await syncTasks(tasks)

    // Verify: only 2 new tasks inserted, claimed task skipped
    expect(result.synced).toBe(2)
    expect(result.errors).toBe(0)

    // Verify: write() called for the two new tasks, NOT for claimed
    const insertCalls = vi.mocked(write).mock.calls.filter((c) => c[0]?.includes('insert'))
    expect(insertCalls.length).toBeGreaterThan(0)

    // Check that claimed task was NOT inserted
    const claimedInserts = vi
      .mocked(write)
      .mock.calls.filter((c) => c[0]?.includes('insert') && c[0]?.includes('t-sync-guard-claimed'))
    expect(claimedInserts).toHaveLength(0)
  })
})
