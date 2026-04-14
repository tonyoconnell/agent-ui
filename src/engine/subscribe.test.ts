import { describe, expect, it } from 'vitest'
import { world } from './world'

describe('subscribe — tag-matched fan-out', () => {
  it('delivers to subscribed unit when tags intersect', () => {
    const w = world()
    const received: unknown[] = []

    w.add('scout').on('observe', () => 'result')
    w.add('listener')
      .subscribe(['engine'])
      .on('default', (d) => {
        received.push(d)
        return null
      })

    w.signal({ receiver: 'scout:observe', data: { tags: ['engine'], content: 'hello' } })

    expect(received).toHaveLength(1)
  })

  it('does not deliver when no tag intersection', () => {
    const w = world()
    const received: unknown[] = []

    w.add('scout').on('observe', () => 'result')
    w.add('listener')
      .subscribe(['billing'])
      .on('default', (d) => {
        received.push(d)
        return null
      })

    w.signal({ receiver: 'scout:observe', data: { tags: ['engine'], content: 'hello' } })

    expect(received).toHaveLength(0)
  })

  it('does not deliver to unit with no subscriptions', () => {
    const w = world()
    const received: unknown[] = []

    w.add('scout').on('observe', () => 'result')
    w.add('listener').on('default', (d) => {
      received.push(d)
      return null
    })
    // no subscribe() call

    w.signal({ receiver: 'scout:observe', data: { tags: ['engine'], content: 'hello' } })

    expect(received).toHaveLength(0)
  })

  it('does not fan-out when signal has no tags', () => {
    const w = world()
    const received: unknown[] = []

    w.add('scout').on('observe', () => 'result')
    w.add('listener')
      .subscribe(['engine'])
      .on('default', (d) => {
        received.push(d)
        return null
      })

    w.signal({ receiver: 'scout:observe', data: { content: 'no tags here' } })

    expect(received).toHaveLength(0)
  })

  it('delivers to multiple subscribers with matching tags', () => {
    const w = world()
    const receivedA: unknown[] = []
    const receivedB: unknown[] = []

    w.add('scout').on('observe', () => 'result')
    w.add('listenerA')
      .subscribe(['engine', 'P0'])
      .on('default', (d) => {
        receivedA.push(d)
        return null
      })
    w.add('listenerB')
      .subscribe(['P0'])
      .on('default', (d) => {
        receivedB.push(d)
        return null
      })

    w.signal({ receiver: 'scout:observe', data: { tags: ['engine', 'P0'] } })

    expect(receivedA).toHaveLength(1)
    expect(receivedB).toHaveLength(1)
  })

  it('respects marks:false — delivers but leaves no pheromone on fan-out path', () => {
    const w = world()
    const received: unknown[] = []

    w.add('scout').on('observe', () => 'result')
    w.add('listener')
      .subscribe(['engine'])
      .on('default', (d) => {
        received.push(d)
        return null
      })

    w.signal({ receiver: 'scout:observe', data: { tags: ['engine'], marks: false } })

    expect(received).toHaveLength(1) // still delivered
    expect(w.sense('entry→listener')).toBe(0) // no pheromone
  })

  it('marks pheromone on fan-out path with override weight', () => {
    const w = world()

    w.add('scout').on('observe', () => 'result')
    w.add('listener').subscribe(['engine'])

    w.signal({ receiver: 'scout:observe', data: { tags: ['engine'], weight: 3 } })

    expect(w.sense('entry→listener')).toBe(3)
  })

  it('subscribe() is chainable and subscribedTags() is readable', () => {
    const w = world()
    const u = w.add('agent').subscribe(['engine', 'P0'])
    expect(u.subscribedTags()).toEqual(['engine', 'P0'])
  })
})
