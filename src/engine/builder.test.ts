/**
 * builder.test.ts — Wave-aware builder unit
 *
 * Tests that registerBuilder wires recon→decide→edit→verify on the builder unit,
 * and that the full chain runs end-to-end with a mock complete function.
 */

import { describe, expect, it, vi } from 'vitest'
import { registerBuilder } from './builder'
import { world as createWorld } from './world'

// Minimal PersistentWorld-compatible mock (only methods registerBuilder needs)
function mockNet() {
  const _units = new Map<string, ReturnType<typeof createWorld>['get']>()
  const pheromone: Record<string, number> = {}

  const w = createWorld()

  // Wrap mark to record edges
  const originalMark = w.mark.bind(w)
  w.mark = (edge: string, s?: number) => {
    pheromone[edge] = (pheromone[edge] ?? 0) + (s ?? 1)
    return originalMark(edge, s)
  }

  return { net: w as unknown as Parameters<typeof registerBuilder>[0], pheromone }
}

describe('registerBuilder', () => {
  it('registers a builder unit with recon/decide/edit/verify handlers', () => {
    const { net } = mockNet()
    const complete = vi.fn().mockResolvedValue('mock response')

    const u = registerBuilder(net, complete)

    expect(u.has('task')).toBe(true) // dispatch entry point
    expect(u.has('recon')).toBe(true)
    expect(u.has('decide')).toBe(true)
    expect(u.has('edit')).toBe(true)
    expect(u.has('verify')).toBe(true)
  })

  it('lists all five handlers (task + 4 waves)', () => {
    const { net } = mockNet()
    const complete = vi.fn().mockResolvedValue('mock response')

    const u = registerBuilder(net, complete)
    const handlers = u.list()

    expect(handlers).toContain('task') // entry point
    expect(handlers).toContain('recon')
    expect(handlers).toContain('decide')
    expect(handlers).toContain('edit')
    expect(handlers).toContain('verify')
  })

  it('runs full W1→W4 chain and calls onDone on PASS', async () => {
    const { net } = mockNet()

    const complete = vi
      .fn()
      .mockResolvedValueOnce('W1: Found relevant files: world.ts, loop.ts') // recon
      .mockResolvedValueOnce('1. Add handler\n2. Wire continuation\n3. Test') // decide
      .mockResolvedValueOnce('Changed world.ts: added handler') // edit
      .mockResolvedValueOnce('PASS — all exit conditions met') // verify

    const onDone = vi.fn()
    registerBuilder(net, complete, onDone)

    const w = net as unknown as ReturnType<typeof createWorld>
    const outcome = await w.ask(
      {
        receiver: 'builder:task',
        data: {
          taskId: 'test-task',
          taskName: 'Test Task',
          exit: 'Handler registered and test passing',
        },
      },
      'test',
      10_000,
    )

    // W4 returns a result (not dissolved, not timeout)
    expect(outcome.result).toBeDefined()
    expect(onDone).toHaveBeenCalledOnce()
    const doneEnv = onDone.mock.calls[0][0]
    expect(doneEnv.taskId).toBe('test-task')
    expect(doneEnv.verify?.ok).toBe(true)
    expect(complete).toHaveBeenCalledTimes(4)
  })

  it('does not call onDone when W4 returns FAIL', async () => {
    const { net } = mockNet()

    const complete = vi
      .fn()
      .mockResolvedValueOnce('W1 recon output') // recon
      .mockResolvedValueOnce('1. Plan step') // decide
      .mockResolvedValueOnce('Changed files') // edit
      .mockResolvedValueOnce('FAIL — exit condition not met') // verify

    const onDone = vi.fn()
    registerBuilder(net, complete, onDone)

    const w = net as unknown as ReturnType<typeof createWorld>
    await w.ask(
      {
        receiver: 'builder:task',
        data: { taskId: 'fail-task', taskName: 'Failing Task', exit: 'Never passes' },
      },
      'test',
      10_000,
    )

    // verify returns result (the WaveEnvelope) but onDone not called (FAIL)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('returns unit with id "builder"', () => {
    const { net } = mockNet()
    const u = registerBuilder(net, vi.fn().mockResolvedValue('ok'))
    expect(u.id).toBe('builder')
  })
})
