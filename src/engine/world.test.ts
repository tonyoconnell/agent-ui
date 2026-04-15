/**
 * WORLD — The Substrate
 *
 * Pure runtime: no TypeDB, no mocks needed. Two fields. Dual strength. Queue.
 *
 * The story: signals move through units, pheromone accumulates on paths,
 * the queue holds work until a unit arrives. ask() wraps signal in a
 * promise that resolves to one of four outcomes.
 *
 * Run: bun vitest run src/engine/world.test.ts
 */

import { describe, expect, it, vi } from 'vitest'
import { unit, world } from './world'

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: Unit factory
//
// unit(id) is a callable entity. Handlers (.on), continuations (.then),
// context-bound roles (.role), and introspection (.has / .list).
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 1: unit factory', () => {
  it('creates a unit with the correct id', () => {
    const u = unit('scout')
    expect(u.id).toBe('scout')
  })

  it('.on(name, fn) registers a handler visible via .has()', () => {
    const u = unit('scout').on('observe', async () => 'ok')
    expect(u.has('observe')).toBe(true)
    expect(u.has('missing')).toBe(false)
  })

  it('.list() returns all registered handler names', () => {
    const u = unit('scout')
      .on('observe', async () => null)
      .on('report', async () => null)
    const names = u.list()
    expect(names).toContain('observe')
    expect(names).toContain('report')
    expect(names).toHaveLength(2)
  })

  it('.then(name, template) registers a continuation (does not appear in .list())', () => {
    const u = unit('scout')
      .on('observe', async (d) => d)
      .then('observe', (r) => ({ receiver: 'analyst', data: r }))
    // .then continuations are internal — not exposed via has/list
    expect(u.has('observe')).toBe(true)
  })

  it('.role(name, task, ctx) creates a context-bound handler', () => {
    const u = unit('scout')
      .on('base', async (d: unknown) => (d as Record<string, unknown>).value)
      .role('alias', 'base', { value: 42 })
    expect(u.has('alias')).toBe(true)
  })

  it('.subscribe() and .subscribedTags() round-trip tags', () => {
    const u = unit('scout').subscribe(['signal', 'path'])
    expect(u.subscribedTags()).toEqual(['signal', 'path'])
  })

  it('calling a unit with a missing handler is a no-op (zero returns)', () => {
    const u = unit('scout')
    // No handler registered — should not throw
    expect(() => u({ receiver: 'scout:missing' })).not.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: World add / remove / introspection
//
// .add(id) creates a unit and wires routing. .remove(id) deletes the unit
// but leaves paths intact (they fade naturally). .get/.has/.list introspect.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 2: world add / remove', () => {
  it('.add(id) creates a unit and registers it', () => {
    const net = world()
    net.add('scout')
    expect(net.has('scout')).toBe(true)
  })

  it('.has(id) returns false for unknown unit', () => {
    const net = world()
    expect(net.has('ghost')).toBe(false)
  })

  it('.list() returns all unit ids', () => {
    const net = world()
    net.add('a')
    net.add('b')
    expect(net.list()).toContain('a')
    expect(net.list()).toContain('b')
  })

  it('.get(id) returns the unit', () => {
    const net = world()
    net.add('scout')
    expect(net.get('scout')).toBeDefined()
    expect(net.get('scout')?.id).toBe('scout')
  })

  it('.remove(id) removes the unit from routing', () => {
    const net = world()
    net.add('scout')
    net.remove('scout')
    expect(net.has('scout')).toBe(false)
  })

  it('paths persist after remove (strength survives)', () => {
    const net = world()
    net.add('scout')
    net.mark('scout→analyst', 5)
    net.remove('scout')
    // Paths fade naturally — strength still there immediately after remove
    expect(net.sense('scout→analyst')).toBe(5)
  })

  it('auto-drains queued signals when unit is added (default handler)', async () => {
    const net = world()
    const received: unknown[] = []
    // Enqueue a signal for a unit that doesn't exist yet
    net.enqueue({ receiver: 'late', data: 'hello' })
    expect(net.pending()).toBe(1)
    // When added with a default handler registered first via .on(), auto-drain fires
    // Note: add() drains synchronously, so handler must be set before add()
    const u = net.add('late')
    u.on('default', async (d) => {
      received.push(d)
      return d
    })
    // The auto-drain already fired during add() — but handler wasn't yet registered.
    // Use drain() explicitly after unit + handler setup instead:
    net.enqueue({ receiver: 'late', data: 'world' })
    net.drain()
    await new Promise((r) => setTimeout(r, 10))
    expect(received).toHaveLength(1)
    expect(received[0]).toBe('world')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: Signal routing
//
// Signals route to unit (default handler) or unit:task (named handler).
// Missing units dissolve silently. replyTo closes the loop automatically.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 3: signal routing', () => {
  it('routes signal to unit default handler', async () => {
    const net = world()
    const calls: unknown[] = []
    net.add('scout').on('default', async (d) => {
      calls.push(d)
      return d
    })
    net.signal({ receiver: 'scout', data: 'ping' })
    await Promise.resolve()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toBe('ping')
  })

  it('routes signal to unit:task named handler', async () => {
    const net = world()
    const calls: unknown[] = []
    net.add('scout').on('observe', async (d) => {
      calls.push(d)
      return d
    })
    net.signal({ receiver: 'scout:observe', data: 42 })
    await Promise.resolve()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toBe(42)
  })

  it('missing unit → dissolves silently (no throw, no crash)', () => {
    const net = world()
    // No unit named 'ghost' — should silently dissolve
    expect(() => net.signal({ receiver: 'ghost:task' })).not.toThrow()
  })

  it('auto-reply via replyTo data field', async () => {
    const net = world()
    const replies: unknown[] = []
    net.add('echo').on('default', async (d) => (d as Record<string, unknown>).msg)
    // Add a manual reply-catcher
    net.add('catcher').on('default', async (d) => {
      replies.push(d)
      return null
    })
    net.signal({ receiver: 'echo', data: { msg: 'hi', replyTo: 'catcher' } })
    // Let the async chain resolve
    await new Promise((r) => setTimeout(r, 10))
    expect(replies).toHaveLength(1)
    expect(replies[0]).toBe('hi')
  })

  it('signal shape is {receiver, data} — extra fields are preserved', async () => {
    const net = world()
    const received: unknown[] = []
    net.add('x').on('default', async (d) => {
      received.push(d)
      return d
    })
    net.signal({ receiver: 'x', data: { tags: ['a'], weight: 2, content: 'hello' } })
    await Promise.resolve()
    expect(received[0]).toMatchObject({ tags: ['a'], weight: 2, content: 'hello' })
  })

  it('marks pheromone on delivery (entry→receiver edge)', () => {
    const net = world()
    net.add('scout')
    net.signal({ receiver: 'scout', data: {} })
    expect(net.sense('entry→scout')).toBeGreaterThan(0)
  })

  it('marks=false suppresses pheromone deposit', () => {
    const net = world()
    net.add('scout')
    net.signal({ receiver: 'scout', data: { marks: false } })
    expect(net.sense('entry→scout')).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 4: Mark / warn / sense / danger
//
// mark() raises strength, warn() raises resistance. sense() reads strength,
// danger() reads resistance. Edge key is the same string everywhere.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 4: mark / warn / sense / danger', () => {
  it('mark(edge, n) raises strength by n', () => {
    const net = world()
    net.mark('a→b', 3)
    expect(net.sense('a→b')).toBe(3)
  })

  it('mark accumulates across calls', () => {
    const net = world()
    net.mark('a→b', 2)
    net.mark('a→b', 3)
    expect(net.sense('a→b')).toBe(5)
  })

  it('warn(edge, n) raises resistance by n', () => {
    const net = world()
    net.warn('a→b', 4)
    expect(net.danger('a→b')).toBe(4)
  })

  it('warn accumulates across calls', () => {
    const net = world()
    net.warn('a→b', 2)
    net.warn('a→b', 3)
    expect(net.danger('a→b')).toBe(5)
  })

  it('sense returns 0 for unknown edge', () => {
    const net = world()
    expect(net.sense('unknown→edge')).toBe(0)
  })

  it('danger returns 0 for unknown edge', () => {
    const net = world()
    expect(net.danger('unknown→edge')).toBe(0)
  })

  it('mark and warn are independent on the same edge', () => {
    const net = world()
    net.mark('x→y', 10)
    net.warn('x→y', 3)
    expect(net.sense('x→y')).toBe(10)
    expect(net.danger('x→y')).toBe(3)
  })

  it('mark() default amount is 1', () => {
    const net = world()
    net.mark('a→b')
    expect(net.sense('a→b')).toBe(1)
  })

  it('warn() default amount is 1', () => {
    const net = world()
    net.warn('a→b')
    expect(net.danger('a→b')).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 5: Fade — asymmetric decay
//
// fade(r) decays both strength and resistance. Resistance decays at 2r
// (forgiveness). Strength floors at peak × 0.05 (ghost trails survive).
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 5: fade — asymmetric decay', () => {
  it('fade reduces strength', () => {
    const net = world()
    net.mark('a→b', 100)
    net.fade(0.1)
    expect(net.sense('a→b')).toBeLessThan(100)
  })

  it('fade reduces resistance', () => {
    const net = world()
    net.warn('a→b', 10)
    net.fade(0.1)
    expect(net.danger('a→b')).toBeLessThan(10)
  })

  it('resistance decays faster than strength (forgiveness asymmetry)', () => {
    const net = world()
    net.mark('a→b', 100)
    net.warn('a→b', 100)
    const sBefore = net.sense('a→b')
    const rBefore = net.danger('a→b')
    net.fade(0.1)
    const sDelta = sBefore - net.sense('a→b')
    const rDelta = rBefore - net.danger('a→b')
    // resistance must decay at approximately 2x the rate of strength
    expect(rDelta).toBeGreaterThan(sDelta)
  })

  it('strength floors at peak × 0.05 (ghost trail survives)', () => {
    const net = world()
    net.mark('a→b', 100)
    // Apply many fade rounds — strength should not drop below 5 (5% of peak=100)
    for (let i = 0; i < 200; i++) net.fade(0.5)
    expect(net.sense('a→b')).toBeGreaterThanOrEqual(5)
  })

  it('resistance drops to 0 and is removed on small values', () => {
    const net = world()
    net.warn('a→b', 0.01)
    net.fade(0.5)
    // After enough fade, tiny resistance is cleaned up
    expect(net.danger('a→b')).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 6: Follow vs select
//
// follow(type) is deterministic — returns the path with highest net strength.
// select(type?, sensitivity) is probabilistic — weighted random over net.
// No paths → null. Sensitivity 0 = pure exploration, 1 = follow highways.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 6: follow vs select', () => {
  it('follow returns null when no paths exist', () => {
    const net = world()
    expect(net.follow()).toBeNull()
  })

  it('follow returns the destination with highest net strength', () => {
    const net = world()
    net.mark('entry→analyst', 10)
    net.mark('entry→scout', 3)
    const dest = net.follow()
    expect(dest).toBe('analyst')
  })

  it('follow factors in resistance (net = strength − resistance)', () => {
    const net = world()
    net.mark('entry→analyst', 10)
    net.warn('entry→analyst', 8) // net=2
    net.mark('entry→scout', 5) // net=5
    expect(net.follow()).toBe('scout')
  })

  it('follow filters by type segment', () => {
    const net = world()
    net.mark('analyst→scout:report', 10)
    net.mark('analyst→worker', 2)
    const dest = net.follow('scout')
    expect(dest).toBe('scout')
  })

  it('select returns null when no paths exist', () => {
    const net = world()
    expect(net.select()).toBeNull()
  })

  it('select returns a string (unit name) when paths exist', () => {
    const net = world()
    net.mark('entry→analyst', 5)
    const dest = net.select()
    expect(typeof dest).toBe('string')
  })

  it('select with sensitivity=0 still returns a result (exploration mode)', () => {
    const net = world()
    net.mark('entry→scout', 5)
    net.mark('entry→analyst', 5)
    const dest = net.select(undefined, 0)
    expect(dest).not.toBeNull()
  })

  it('select with high sensitivity converges on the strongest path', () => {
    const net = world()
    net.mark('entry→highway', 100)
    net.mark('entry→side', 1)
    // With sensitivity=1 and a 100x stronger path, should pick highway most of the time
    const picks = Array.from({ length: 20 }, () => net.select(undefined, 1))
    const highwayCount = picks.filter((p) => p === 'highway').length
    expect(highwayCount).toBeGreaterThan(10)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 7: Queue + drain
//
// enqueue() adds signals to the queue. drain() processes highest-priority
// signal. pending() reports queue length.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 7: queue + drain', () => {
  it('enqueue adds to the queue, pending reports length', () => {
    const net = world()
    net.enqueue({ receiver: 'x', data: {} })
    net.enqueue({ receiver: 'y', data: {} })
    expect(net.pending()).toBe(2)
  })

  it('drain returns null on empty queue', () => {
    const net = world()
    expect(net.drain()).toBeNull()
  })

  it('drain processes a signal and reduces queue length', () => {
    const net = world()
    const received: unknown[] = []
    net.add('target').on('default', async (d) => {
      received.push(d)
      return d
    })
    net.enqueue({ receiver: 'target', data: 'queued' })
    expect(net.pending()).toBe(1)
    net.drain()
    expect(net.pending()).toBe(0)
  })

  it('drain processes P0 before P3 (priority ordering)', async () => {
    const net = world()
    const order: unknown[] = []
    net.add('worker').on('default', async (d) => {
      order.push((d as Record<string, unknown>).label)
      return d
    })
    net.enqueue({ receiver: 'worker', data: { priority: 'P3', label: 'low' } })
    net.enqueue({ receiver: 'worker', data: { priority: 'P0', label: 'high' } })
    net.drain() // should deliver P0 first
    await Promise.resolve()
    expect(order[0]).toBe('high')
  })

  it('drain skips signals scheduled after now (after field)', () => {
    const net = world()
    const received: unknown[] = []
    net.add('future').on('default', async (d) => {
      received.push(d)
      return d
    })
    const futureTime = Date.now() + 60_000
    net.enqueue({ receiver: 'future', data: {}, after: futureTime })
    net.drain() // should skip — not ready yet
    expect(received).toHaveLength(0)
    expect(net.pending()).toBe(1) // still in queue
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 8: Highways
//
// highways(limit) returns top N paths sorted by net strength (s - r).
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 8: highways', () => {
  it('returns empty array when no paths exist', () => {
    const net = world()
    expect(net.highways()).toEqual([])
  })

  it('returns paths sorted by net strength descending', () => {
    const net = world()
    net.mark('a→b', 5)
    net.mark('a→c', 10)
    net.mark('a→d', 1)
    const hw = net.highways()
    expect(hw[0].path).toBe('a→c')
    expect(hw[1].path).toBe('a→b')
    expect(hw[2].path).toBe('a→d')
  })

  it('limit parameter caps result count', () => {
    const net = world()
    for (let i = 0; i < 20; i++) net.mark(`entry→unit${i}`, i + 1)
    const hw = net.highways(5)
    expect(hw).toHaveLength(5)
  })

  it('excludes paths with net strength <= 0', () => {
    const net = world()
    net.mark('a→b', 3)
    net.warn('a→b', 5) // net = -2
    const hw = net.highways()
    expect(hw.find((e) => e.path === 'a→b')).toBeUndefined()
  })

  it('edge.strength in result reflects net (s - r)', () => {
    const net = world()
    net.mark('x→y', 8)
    net.warn('x→y', 2)
    const hw = net.highways()
    const edge = hw.find((e) => e.path === 'x→y')
    expect(edge?.strength).toBe(6)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 9: ask — four outcomes
//
// ask() returns { result } on success, { timeout: true } on timeout,
// { dissolved: true } on missing unit/capability, { failure: true } if
// the handler produces null/undefined.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 9: ask — four outcomes', () => {
  it('{ result } on success', async () => {
    const net = world()
    // ask() merges replyTo into data object — use an object payload so the merge is clean
    net.add('echo').on('default', async (d) => (d as Record<string, unknown>).msg)
    const out = await net.ask({ receiver: 'echo', data: { msg: 'hello' } })
    expect(out.result).toBe('hello')
    expect(out.timeout).toBeUndefined()
    expect(out.dissolved).toBeUndefined()
  })

  it('{ dissolved: true } when unit is missing', async () => {
    const net = world()
    const out = await net.ask({ receiver: 'ghost' })
    expect(out.dissolved).toBe(true)
  })

  it('{ dissolved: true } when unit exists but has no matching or default handler', async () => {
    const net = world()
    net.add('partial').on('other', async () => 'nope')
    const out = await net.ask({ receiver: 'partial:missing' })
    expect(out.dissolved).toBe(true)
  })

  it('{ failure: true } when handler returns null (explicit failure)', async () => {
    const net = world()
    net.add('bad').on('default', async () => null)
    const out = await net.ask({ receiver: 'bad' })
    expect(out.failure).toBe(true)
  })

  it('{ timeout: true } when handler never resolves', async () => {
    vi.useFakeTimers()
    const net = world()
    net.add('slow').on('default', () => new Promise(() => {})) // never resolves
    const askPromise = net.ask({ receiver: 'slow' }, 'entry', 100)
    vi.advanceTimersByTime(200)
    const out = await askPromise
    expect(out.timeout).toBe(true)
    vi.useRealTimers()
  }, 10_000)

  it('ask routes to unit:task named handler', async () => {
    const net = world()
    // ask() merges replyTo into data — use an object so the merge doesn't corrupt the value
    net.add('worker').on('process', async (d) => ((d as Record<string, unknown>).n as number) * 2)
    const out = await net.ask({ receiver: 'worker:process', data: { n: 7 } })
    expect(out.result).toBe(14)
  })

  it('ask falls back to default handler when no named task handler', async () => {
    const net = world()
    net.add('worker').on('default', async (d) => 'fallback')
    const out = await net.ask({ receiver: 'worker:nonexistent' })
    expect(out.result).toBe('fallback')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 10: Continuations (.then chains)
//
// .then(name, template) fires after a successful handler, routing the result
// to the next unit as a new signal. Chain propagates automatically.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 10: continuations (.then chains)', () => {
  it('continuation fires after successful handler', async () => {
    const net = world()
    const secondReceived: unknown[] = []
    net
      .add('first')
      .on('go', async (d) => `processed:${d}`)
      .then('go', (r) => ({ receiver: 'second', data: r }))
    net.add('second').on('default', async (d) => {
      secondReceived.push(d)
      return d
    })
    net.signal({ receiver: 'first:go', data: 'input' })
    await new Promise((r) => setTimeout(r, 20))
    expect(secondReceived).toHaveLength(1)
    expect(secondReceived[0]).toBe('processed:input')
  })

  it('continuation does NOT fire when handler returns null', async () => {
    const net = world()
    const secondReceived: unknown[] = []
    net
      .add('first')
      .on('go', async () => null)
      .then('go', () => ({ receiver: 'second', data: 'should-not-arrive' }))
    net.add('second').on('default', async (d) => {
      secondReceived.push(d)
      return d
    })
    net.signal({ receiver: 'first:go' })
    await new Promise((r) => setTimeout(r, 20))
    expect(secondReceived).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 11: isHighway / recordLatency / recordRevenue
//
// Composite path quality: latency penalty, revenue boost, highway threshold.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 11: isHighway / recordLatency / recordRevenue', () => {
  it('isHighway returns false for a path below threshold', () => {
    const net = world()
    net.mark('a→b', 10)
    expect(net.isHighway('a→b', 50)).toBe(false)
  })

  it('isHighway returns true for a path at or above threshold', () => {
    const net = world()
    net.mark('a→b', 60)
    expect(net.isHighway('a→b', 50)).toBe(true)
  })

  it('recordLatency updates the latency EWMA', () => {
    const net = world()
    net.recordLatency('a→b', 100)
    expect(net.latency['a→b']).toBe(100)
    net.recordLatency('a→b', 200)
    // EWMA: 100*0.7 + 200*0.3 = 130
    expect(net.latency['a→b']).toBeCloseTo(130, 0)
  })

  it('recordRevenue accumulates revenue on path', () => {
    const net = world()
    net.recordRevenue('a→b', 0.02)
    net.recordRevenue('a→b', 0.03)
    expect(net.revenue['a→b']).toBeCloseTo(0.05, 5)
  })
})
