/**
 * PERSIST — The Memory
 *
 * PersistentWorld = world + TypeDB persistence + the sandwich.
 * This test proves the layer between in-memory pheromone and durable brain.
 *
 * The story: signals flow through the substrate, TypeDB is the silent
 * ledger. isToxic() guards the sandwich. The pheromone decides who gets
 * work. TypeDB remembers what the runtime would forget after a restart.
 *
 * Run: bun vitest run src/engine/persist.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistentWorld } from './persist'

// ── Mock TypeDB — isolate persist.ts from the database ────────────────────────
// All reads return empty by default. writeSilent is a no-op.
// Individual tests override readParsed to inject data.

vi.mock('@/lib/typedb', () => ({
  read: vi.fn().mockResolvedValue('[]'),
  readParsed: vi.fn().mockResolvedValue([]),
  writeSilent: vi.fn().mockResolvedValue(undefined),
  parseAnswers: vi.fn().mockReturnValue([]),
}))

// Bridge calls are fire-and-forget in production; silence them in tests.
vi.mock('./bridge', () => ({
  mirrorMark: vi.fn().mockResolvedValue(undefined),
  mirrorWarn: vi.fn().mockResolvedValue(undefined),
  mirrorActor: vi.fn().mockResolvedValue(undefined),
}))

// context module — not exercised here, mock to avoid filesystem reads
vi.mock('./context', () => ({
  ingestDocs: vi.fn().mockResolvedValue(0),
  loadContext: vi.fn().mockReturnValue(''),
}))

import { readParsed, writeSilent } from '@/lib/typedb'
import { isToxic, world } from './persist'

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: isToxic — the cold-start-safe firewall
//
// Three conditions must ALL hold before a path is blocked:
//   r >= 10        — enough failures have accumulated
//   r > s * 2      — resistance is more than twice the strength
//   r + s > 5      — not a brand-new path (cold-start protection)
//
// This is O(1). No TypeDB. No LLM. Pure arithmetic.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 1: isToxic — arithmetic firewall, no I/O', () => {
  it('blocks when all three conditions hold', () => {
    // r=10 >= 10 ✓, r=10 > s=4*2=8 ✓, r+s=14 > 5 ✓
    expect(isToxic('a→b', { 'a→b': 4 }, { 'a→b': 10 })).toBe(true)
  })

  it('does not block when resistance is below sample threshold (r < 10)', () => {
    // r=9 — not enough failures yet. Cold path gets benefit of the doubt.
    expect(isToxic('a→b', { 'a→b': 0 }, { 'a→b': 9 })).toBe(false)
  })

  it('does not block when resistance is not 2x strength (borderline good agent)', () => {
    // r=10, s=6 — ratio r/s = 1.67, not 2x. Struggling but not toxic.
    expect(isToxic('a→b', { 'a→b': 6 }, { 'a→b': 10 })).toBe(false)
  })

  it('does not block on cold start (r + s <= 5)', () => {
    // r=3, s=0 — only 3 signals total. Too early to judge.
    expect(isToxic('a→b', { 'a→b': 0 }, { 'a→b': 3 })).toBe(false)
  })

  it('blocks at exact boundary: r=10, s=4 (r > 8, r+s=14 > 5)', () => {
    expect(isToxic('edge', { edge: 4 }, { edge: 10 })).toBe(true)
  })

  it('returns false for unknown edge (no entries in maps)', () => {
    expect(isToxic('ghost→void', {}, {})).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: PersistentWorld factory — the substrate with memory
//
// actor() creates a unit. flow() wraps mark/warn. open(), blocked(), toxic()
// inspect pheromone state. proven() and confidence() expose learning signals.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 2: world() factory — pheromone layer + TypeDB bridge', () => {
  let w: PersistentWorld

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('actor() creates a unit accessible via has()', () => {
    w.actor('scout')
    expect(w.has('scout')).toBe(true)
  })

  it('actor() with group option prefixes the uid', () => {
    w.actor('analyst', 'agent', { group: 'research' })
    expect(w.has('research/analyst')).toBe(true)
  })

  it('actor() calls writeSilent to persist to TypeDB', () => {
    w.actor('scout')
    expect(writeSilent).toHaveBeenCalled()
  })

  it('flow().strengthen() calls mark which strengthens the path', () => {
    w.actor('a')
    w.actor('b')
    w.flow('a', 'b').strengthen(3)
    expect(w.sense('a→b')).toBe(3)
  })

  it('flow().resist() calls warn which builds resistance', () => {
    w.actor('a')
    w.actor('b')
    w.flow('a', 'b').resist(5)
    expect(w.danger('a→b')).toBe(5)
  })

  it('open() returns highways as {from, to, strength} triples', () => {
    w.actor('sender')
    w.actor('receiver')
    w.flow('sender', 'receiver').strengthen(10)
    const highways = w.open(5)
    expect(highways).toHaveLength(1)
    expect(highways[0]).toMatchObject({ from: 'sender', to: 'receiver', strength: 10 })
  })

  it('blocked() returns paths where resistance exceeds strength', () => {
    w.flow('x', 'y').strengthen(2)
    w.flow('x', 'y').resist(5) // 5 > 2 — blocked
    w.flow('a', 'b').strengthen(8)
    w.flow('a', 'b').resist(3) // 3 < 8 — healthy, not blocked

    const bl = w.blocked()
    expect(bl).toHaveLength(1)
    expect(bl[0]).toMatchObject({ from: 'x', to: 'y' })
  })

  it('toxic() returns only paths meeting the full isToxic threshold', () => {
    // Build a toxic path: r >= 10, r > s*2, r+s > 5
    for (let i = 0; i < 10; i++) w.flow('bad', 'agent').resist(1) // r = 10
    w.flow('bad', 'agent').strengthen(3) // s = 3, r=10 > 6 ✓

    const tx = w.toxic()
    expect(tx.length).toBeGreaterThanOrEqual(1)
    expect(tx[0].resistance).toBeGreaterThanOrEqual(10)
    expect(tx[0].resistance).toBeGreaterThan(tx[0].strength * 2)
  })

  it('proven() returns actors with aggregate incoming strength >= 20', () => {
    w.flow('src1', 'star').strengthen(12)
    w.flow('src2', 'star').strengthen(10) // total = 22 >= 20
    w.flow('src1', 'rookie').strengthen(5) // total = 5, below threshold

    const stars = w.proven()
    expect(stars.map((p) => p.id)).toContain('star')
    expect(stars.map((p) => p.id)).not.toContain('rookie')
  })

  it('confidence() returns strength / (strength + resistance) for a target type', () => {
    w.flow('entry', 'worker').strengthen(8)
    w.flow('entry', 'worker').resist(2) // confidence = 8/(8+2) = 0.8

    expect(w.confidence('worker')).toBeCloseTo(0.8)
  })

  it('confidence() returns 0 for a type with no paths', () => {
    expect(w.confidence('unknown-unit')).toBe(0)
  })

  it('best() returns the target with highest net strength (strength - resistance)', () => {
    w.flow('entry', 'alpha').strengthen(10)
    w.flow('entry', 'alpha').resist(1) // net = 9

    w.flow('entry', 'beta').strengthen(15)
    w.flow('entry', 'beta').resist(8) // net = 7

    // alpha wins (net 9 > net 7)
    expect(w.best('alpha')).toBe('alpha')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: The sandwich — toxic edges blocked before delivery
//
// persist.signal() checks isToxic before routing. A path that has been
// warn()ed enough times gets blocked at the gate — no LLM call, no cost,
// just console.log and early return. The world is safe by default.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 3: signal sandwich — toxic edge blocked before delivery', () => {
  let w: PersistentWorld
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('signal to a toxic edge is blocked and logs [TOXIC]', () => {
    // Manufacture a toxic path: r >= 10, r > s*2, r+s > 5
    const edge = 'entry→bad-actor'
    w.mark(edge, 3) // s = 3
    w.warn(edge, 10) // r = 10  (10 > 6, 13 > 5) — toxic

    // Now signal through persist layer (not raw world)
    w.actor('bad-actor').on('task', () => 'should not run')
    w.signal({ receiver: 'bad-actor' })

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[TOXIC]'))
  })

  it('ask() on a toxic edge returns dissolved immediately', async () => {
    w.mark('entry→doomed', 3)
    w.warn('entry→doomed', 10)

    w.actor('doomed').on('work', () => 'should not run')
    const result = await w.ask({ receiver: 'doomed' })

    expect(result.dissolved).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 4: ask() with missing capability → dissolved (pre-LLM)
//
// If a receiver is `unit:skill` the sandwich checks TypeDB for a matching
// capability record. readParsed returns [] → no capability → dissolved.
// The LLM is never called. The path is not penalised (not the agent's fault).
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 4: ask() capability sandwich — no capability = dissolved', () => {
  let w: PersistentWorld

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
    // Default: readParsed returns [] — unit has no declared capabilities
    vi.mocked(readParsed).mockResolvedValue([])
  })

  it('ask to unit:skill with no TypeDB capability returns dissolved', async () => {
    w.actor('analyst')
    const result = await w.ask({ receiver: 'analyst:summarise' })
    expect(result.dissolved).toBe(true)
  })

  it('ask to bare unit (no skill) is not capability-checked', async () => {
    // A unit:skill pattern triggers the check; a plain unit bypasses it.
    // Here the unit doesn't exist, so world.ask() dissolves for a different
    // reason (no handler) — but the capability check is NOT invoked.
    const callsBefore = vi.mocked(readParsed).mock.calls.length
    await w.ask({ receiver: 'ghost' })
    expect(vi.mocked(readParsed).mock.calls.length).toBe(callsBefore) // no extra read
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 5: subscribe and tasksFor — tag-based work routing
//
// subscribe() writes tags to TypeDB for a unit.
// tasksFor() fetches the unit's tags, finds matching open tasks,
// and ranks them by overlap × priority + pheromone strength.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 5: subscribe and tasksFor — tag routing', () => {
  let w: PersistentWorld

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('subscribe() calls writeSilent once per tag', () => {
    w.actor('scout')
    w.subscribe('scout', ['engine', 'routing'])
    // One writeSilent call per tag (plus one from actor())
    const tagCalls = vi.mocked(writeSilent).mock.calls.filter((args) => (args[0] as string).includes('has tag'))
    expect(tagCalls.length).toBeGreaterThanOrEqual(2)
  })

  it('tasksFor returns empty when unit has no tags', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([]) // no tags
    const tasks = await w.tasksFor('untagged-unit')
    expect(tasks).toEqual([])
  })

  it('tasksFor ranks tasks: higher overlap × priority wins', async () => {
    // Step 1: unit has tags [engine, routing]
    vi.mocked(readParsed)
      .mockResolvedValueOnce([{ tag: 'engine' }, { tag: 'routing' }]) // unit tags
      // Step 2: tasks sharing those tags
      .mockResolvedValueOnce([
        { id: 'task-A', name: 'Rewrite router', p: 5, tag: 'engine' },
        { id: 'task-A', name: 'Rewrite router', p: 5, tag: 'routing' }, // 2 overlap × 5 = 10
        { id: 'task-B', name: 'Add benchmark', p: 8, tag: 'engine' }, // 1 overlap × 8 = 8
      ])

    const tasks = await w.tasksFor('scout')

    expect(tasks[0].id).toBe('task-A') // score 10 beats score 8
    expect(tasks[0].overlap).toBe(2)
    expect(tasks[1].id).toBe('task-B')
  })

  it('tasksFor incorporates pheromone strength into ranking', async () => {
    // Two tasks with equal overlap×priority — pheromone breaks the tie
    vi.mocked(readParsed)
      .mockResolvedValueOnce([{ tag: 'build' }]) // unit tag
      .mockResolvedValueOnce([
        { id: 'task-X', name: 'Task X', p: 3, tag: 'build' }, // overlap×p = 3
        { id: 'task-Y', name: 'Task Y', p: 3, tag: 'build' }, // overlap×p = 3
      ])

    // Give task-Y a pheromone advantage
    w.mark('scout→builder:task-Y', 5)

    const tasks = await w.tasksFor('scout')
    expect(tasks[0].id).toBe('task-Y') // pheromone (5) tips the balance
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 6: recall() — learning from failed attempts
//
// recall(taskId) queries hypotheses and failed signals related to a task.
// Failed attempts are marked with lower confidence to inform the next try
// while still being available for analysis.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 6: recall() — learning from past attempts', () => {
  let w: PersistentWorld

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('recall() returns hypotheses when task-related patterns are found', async () => {
    vi.mocked(readParsed)
      .mockResolvedValueOnce([{ s: 'pattern-found', p: 0.1 }]) // confirmed hypothesis
      .mockResolvedValueOnce([]) // pending hypotheses (none)
      .mockResolvedValueOnce([]) // failed attempts (none)

    const results = await w.recall('task-example')

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].pattern).toBe('pattern-found')
    expect(results[0].confidence).toBeCloseTo(0.9) // 1 - p-value
  })

  it('recall() includes failed attempts with lower confidence', async () => {
    vi.mocked(readParsed)
      .mockResolvedValueOnce([]) // confirmed hypotheses (none)
      .mockResolvedValueOnce([]) // pending hypotheses (none)
      .mockResolvedValueOnce([{ d: 'error: timeout' }]) // failed attempt

    const results = await w.recall('task-example')

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].pattern).toContain('failed:')
    expect(results[0].confidence).toBe(0.3) // failed attempts get lower confidence
  })

  it('recall() deduplicates patterns across sources', async () => {
    vi.mocked(readParsed)
      .mockResolvedValueOnce([{ s: 'duplicate-pattern', p: 0.1 }]) // confirmed
      .mockResolvedValueOnce([{ s: 'duplicate-pattern', p: 0.5 }]) // pending — same
      .mockResolvedValueOnce([]) // failed attempts (none)

    const results = await w.recall('task-example')

    const duplicates = results.filter((r) => r.pattern === 'duplicate-pattern')
    expect(duplicates.length).toBe(1) // only one instance
  })

  it('recall() with no match parameter queries all hypotheses', async () => {
    vi.mocked(readParsed)
      .mockResolvedValueOnce([{ s: 'global-hypothesis', p: 0.05 }]) // confirmed
      .mockResolvedValueOnce([]) // skip pending (no match param)
      .mockResolvedValueOnce([]) // skip failed (no match param)

    const results = await w.recall() // no taskId

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].pattern).toBe('global-hypothesis')
  })

  it('recall() returns empty array on TypeDB errors', async () => {
    vi.mocked(readParsed).mockRejectedValue(new Error('TypeDB unavailable'))

    const results = await w.recall('task-example')

    expect(results).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 7: taskBlockers() — visibility into unblocked work
//
// taskBlockers(taskId) queries what tasks will be unblocked when this task
// completes. The executor can see the impact of its work on the rest of
// the task graph.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 7: taskBlockers() — visibility into blocking relationships', () => {
  let w: PersistentWorld

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('taskBlockers() returns tasks blocked by the given task', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([
      { id: 'blocked-task-1', name: 'Task A' },
      { id: 'blocked-task-2', name: 'Task B' },
    ])

    const blockers = await w.taskBlockers('blocker-task')

    expect(blockers).toHaveLength(2)
    expect(blockers[0]).toMatchObject({ id: 'blocked-task-1', name: 'Task A' })
    expect(blockers[1]).toMatchObject({ id: 'blocked-task-2', name: 'Task B' })
  })

  it('taskBlockers() returns empty array when no tasks are blocked', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])

    const blockers = await w.taskBlockers('independent-task')

    expect(blockers).toEqual([])
  })

  it('taskBlockers() returns empty array on TypeDB errors', async () => {
    vi.mocked(readParsed).mockRejectedValue(new Error('TypeDB unavailable'))

    const blockers = await w.taskBlockers('task-example')

    expect(blockers).toEqual([])
  })

  it('taskBlockers() constructs correct TypeQL query', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])

    await w.taskBlockers('specific-task-id')

    const calls = vi.mocked(readParsed).mock.calls
    const lastCall = calls[calls.length - 1][0] as string
    expect(lastCall).toContain('specific-task-id')
    expect(lastCall).toContain('blocks')
    expect(lastCall).toContain('blocked')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 8: canBeDiscovered() — lifecycle gate for agent discovery
//
// canBeDiscovered(uid) enforces the CAPABLE → DISCOVER gate.
// A unit is only discoverable if it has at least one capability relation.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 8: canBeDiscovered() — discovery lifecycle gate', () => {
  let w: PersistentWorld

  beforeEach(() => {
    vi.clearAllMocks()
    w = world()
  })

  it('canBeDiscovered() returns true when unit has capabilities', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([{ s: 'skill-1' }]) // has capability

    const discoverable = await w.canBeDiscovered('capable-unit')

    expect(discoverable).toBe(true)
  })

  it('canBeDiscovered() returns false when unit has no capabilities', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([]) // no capabilities

    const discoverable = await w.canBeDiscovered('dormant-unit')

    expect(discoverable).toBe(false)
  })

  it('canBeDiscovered() returns false on TypeDB errors', async () => {
    vi.mocked(readParsed).mockRejectedValue(new Error('TypeDB unavailable'))

    const discoverable = await w.canBeDiscovered('unit')

    expect(discoverable).toBe(false)
  })

  it('canBeDiscovered() queries capability relations for the unit', async () => {
    vi.mocked(readParsed).mockResolvedValueOnce([])

    await w.canBeDiscovered('test-unit-id')

    const calls = vi.mocked(readParsed).mock.calls
    const lastCall = calls[calls.length - 1][0] as string
    expect(lastCall).toContain('test-unit-id')
    expect(lastCall).toContain('capability')
  })
})
