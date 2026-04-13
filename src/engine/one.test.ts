/**
 * ONE — Tests
 *
 * Run: bun test src/engine/one.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { create } from './one-complete'

describe('ONE', () => {
  let one: ReturnType<typeof create>

  beforeEach(() => {
    one = create()
  })

  describe('core', () => {
    it('registers handlers', () => {
      one.on('test', () => 'ok')
      expect(one.stats().handlers).toBe(1)
    })

    it('emits signals to queue', () => {
      one.emit('test', { foo: 'bar' })
      expect(one.stats().queue).toBe(1)
    })

    it('processes signals with tick', async () => {
      let called = false
      one.on('test', () => {
        called = true
        return 'done'
      })
      one.emit('test')

      const result = await one.tick()

      expect(called).toBe(true)
      expect(result.outcome?.result).toBe('done')
    })

    it('returns idle when queue empty', async () => {
      const result = await one.tick()
      expect(result.queue).toBe(0)
    })
  })

  describe('pheromone', () => {
    it('marks paths on success', async () => {
      one.on('test', () => 'ok')
      one.emit('test')
      await one.tick()

      expect(one.net('entry→test')).toBeGreaterThan(0)
    })

    it('warns paths on failure', async () => {
      one.on('test', () => {
        throw new Error('fail')
      })
      one.emit('test')
      await one.tick()

      expect(one.resistance['entry→test']).toBeGreaterThan(0)
    })

    it('fades over time', () => {
      one.mark('a→b', 100)
      one.fade(0.1)

      expect(one.strength['a→b']).toBe(90)
    })

    it('detects highways', () => {
      one.mark('a→b', 25)
      expect(one.isHighway('a→b')).toBe(true)
    })

    it('detects toxic paths', () => {
      one.warn('a→b', 15)
      one.mark('a→b', 5)
      expect(one.isToxic('a→b')).toBe(true)
    })

    it('blocks toxic paths', async () => {
      one.warn('entry→test', 15)
      one.mark('entry→test', 5)
      one.on('test', () => 'ok')
      one.emit('test')

      const result = await one.tick()

      expect(result.outcome?.dissolved).toBe(true)
    })
  })

  describe('chains', () => {
    it('executes chain steps in order', async () => {
      const steps: string[] = []
      one.on('step1', () => {
        steps.push('1')
        return 'ok'
      })
      one.on('step2', () => {
        steps.push('2')
        return 'ok'
      })
      one.on('step3', () => {
        steps.push('3')
        return 'ok'
      })

      one.chain('mychain', ['step1', 'step2', 'step3'])
      one.emit('chain:mychain')

      await one.tick() // chain:mychain
      await one.tick() // step1
      await one.tick() // chain:mychain (continue)
      await one.tick() // step2
      await one.tick() // chain:mychain (continue)
      await one.tick() // step3

      expect(steps).toEqual(['1', '2', '3'])
    })

    it('stops chain on failure', async () => {
      const steps: string[] = []
      one.on('step1', () => {
        steps.push('1')
        return 'ok'
      })
      one.on('step2', () => {
        steps.push('2')
        throw new Error()
      })
      one.on('step3', () => {
        steps.push('3')
        return 'ok'
      })

      one.chain('mychain', ['step1', 'step2', 'step3'])
      one.emit('chain:mychain')

      for (let i = 0; i < 10; i++) await one.tick()

      expect(steps).toEqual(['1', '2']) // step3 never reached
    })
  })

  describe('sops', () => {
    it('runs prereqs before target', async () => {
      const order: string[] = []
      one.on('prereq', () => {
        order.push('prereq')
        return true
      })
      one.on('target', () => {
        order.push('target')
        return 'done'
      })

      one.sop('target', ['prereq'])
      one.emit('target')

      await one.tick()

      expect(order).toEqual(['prereq', 'target'])
    })

    it('blocks target if prereq fails', async () => {
      one.on('prereq', () => {
        throw new Error()
      })
      one.on('target', () => 'done')

      one.sop('target', ['prereq'])
      one.emit('target')

      const result = await one.tick()

      expect(result.outcome?.dissolved).toBe(true)
    })
  })

  describe('timers', () => {
    it('emits on schedule', async () => {
      let count = 0
      one.on('tick', () => {
        count++
        return true
      })
      one.timer('tick', 10) // 10ms

      await new Promise((r) => setTimeout(r, 50))
      for (let i = 0; i < 10; i++) await one.tick()

      expect(count).toBeGreaterThan(0)
    })
  })

  describe('context', () => {
    it('loads and retrieves context', async () => {
      await one.loadContext('test', 'package.json')
      const ctx = one.getContext('test')

      expect(ctx).toContain('name')
    })

    it('returns empty for missing keys', () => {
      const ctx = one.getContext('nonexistent')
      expect(ctx).toBe('')
    })
  })

  describe('priority', () => {
    it('processes higher priority first', async () => {
      const order: number[] = []
      one.on('low', () => {
        order.push(3)
        return true
      })
      one.on('med', () => {
        order.push(2)
        return true
      })
      one.on('high', () => {
        order.push(1)
        return true
      })

      one.emit('low', { priority: 3 })
      one.emit('med', { priority: 2 })
      one.emit('high', { priority: 1 })

      await one.tick()
      await one.tick()
      await one.tick()

      expect(order).toEqual([1, 2, 3])
    })
  })

  describe('chain bonus', () => {
    it('marks more for longer chains', async () => {
      one.on('step', () => 'ok')

      // Direct signal
      one.emit('step')
      await one.tick()
      const direct = one.strength['entry→step']

      // Reset
      one.strength['entry→step'] = 0

      // Chained signal (simulated)
      one.emit('step', { _chain: 3 })
      await one.tick()
      const chained = one.strength['entry→step']

      expect(chained).toBeGreaterThan(direct)
    })
  })

  describe('highways', () => {
    it('returns top paths by net strength', () => {
      one.mark('a→b', 50)
      one.mark('c→d', 30)
      one.mark('e→f', 10)
      one.warn('c→d', 25) // net = 5

      const top = one.highways(2)

      expect(top.length).toBe(2)
      expect(top[0].path).toBe('a→b')
      expect(top[1].path).toBe('e→f') // c→d has lower net
    })
  })

  describe('emit from handler', () => {
    it('allows handlers to emit new signals', async () => {
      let step2Called = false
      one.on('step1', (_, emit) => {
        emit('step2')
        return 'ok'
      })
      one.on('step2', () => {
        step2Called = true
        return 'ok'
      })

      one.emit('step1')
      await one.tick() // step1
      await one.tick() // step2

      expect(step2Called).toBe(true)
    })
  })
})

describe('ONE Production', async () => {
  // Import prod version (dynamic import in ESM)
  const { create: createProd } = await import('./one-prod')

  it('retries on failure', async () => {
    let attempts = 0
    const one = createProd({ maxRetries: 3 })

    one.on('flaky', () => {
      attempts++
      if (attempts < 3) throw new Error('fail')
      return 'ok'
    })

    one.emit('flaky')

    for (let i = 0; i < 5; i++) await one.tick()

    expect(attempts).toBe(3)
  })

  it('respects queue limit', () => {
    const one = createProd({ maxQueue: 5 })

    for (let i = 0; i < 10; i++) {
      one.emit('test')
    }

    expect(one.stats().queue).toBe(5)
  })

  it('tracks tokens', () => {
    const one = createProd({ tokenBudget: 1000 })

    one.trackTokens(500)
    one.trackTokens(300)

    expect(one.stats().tokensUsed).toBe(800)
  })

  it('shuts down gracefully', async () => {
    const one = createProd({})
    let processed = 0

    one.on('work', () => {
      processed++
      return true
    })

    for (let i = 0; i < 10; i++) one.emit('work')

    await one.shutdown()

    expect(processed).toBe(10)
  })
})
