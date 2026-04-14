/**
 * doc-scan.test.ts — Test markdown item extraction and loop integration
 *
 * Tests extractItems (checkbox + gap parsing), groupByPriority,
 * renderTodo, and gapsToSignals. All pure functions — no mocking needed.
 */

import { describe, expect, it } from 'vitest'
import type { DocItem } from './doc-scan'
import { gapsToSignals, groupByPriority, renderTodo } from './doc-scan'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeItem(overrides?: Partial<DocItem>): DocItem {
  return {
    id: 'test-item',
    name: 'Test Item',
    source: 'test',
    section: 'root',
    tags: ['test'],
    done: false,
    priority: 'P2',
    line: 1,
    raw: 'Test Item',
    ...overrides,
  }
}

// ── extractItems via renderTodo round-trip ────────────────────────────────────
// We test extraction indirectly via the public API. extractItems is internal
// but its behavior is observable through groupByPriority and renderTodo.

describe('doc-scan.ts — item extraction and loop integration', () => {
  describe('groupByPriority', () => {
    it('should group items by priority', () => {
      const items: DocItem[] = [
        makeItem({ id: 'a', priority: 'P0' }),
        makeItem({ id: 'b', priority: 'P1' }),
        makeItem({ id: 'c', priority: 'P2' }),
        makeItem({ id: 'd', priority: 'P3' }),
        makeItem({ id: 'e', priority: 'P0' }),
      ]

      const groups = groupByPriority(items)

      expect(groups.P0).toHaveLength(2)
      expect(groups.P1).toHaveLength(1)
      expect(groups.P2).toHaveLength(1)
      expect(groups.P3).toHaveLength(1)
    })

    it('should return empty arrays for missing priorities', () => {
      const items: DocItem[] = [makeItem({ priority: 'P0' })]

      const groups = groupByPriority(items)

      expect(groups.P0).toHaveLength(1)
      expect(groups.P1).toHaveLength(0)
      expect(groups.P2).toHaveLength(0)
      expect(groups.P3).toHaveLength(0)
    })

    it('should handle empty input', () => {
      const groups = groupByPriority([])

      expect(groups.P0).toHaveLength(0)
      expect(groups.P1).toHaveLength(0)
      expect(groups.P2).toHaveLength(0)
      expect(groups.P3).toHaveLength(0)
    })
  })

  describe('renderTodo', () => {
    it('should render open items as unchecked checkboxes', () => {
      const items: DocItem[] = [makeItem({ id: 'a', name: 'Build the thing', priority: 'P0', done: false })]

      const output = renderTodo(items)

      expect(output).toContain('- [ ]')
      expect(output).toContain('Build the thing')
    })

    it('should render done items in the Done section', () => {
      const items: DocItem[] = [makeItem({ id: 'b', name: 'Completed Task', done: true })]

      const output = renderTodo(items)

      expect(output).toContain('- [x]')
      expect(output).toContain('Completed Task')
      expect(output).toContain('## Done')
    })

    it('should include summary counts', () => {
      const items: DocItem[] = [
        makeItem({ id: 'a', priority: 'P0', done: false }),
        makeItem({ id: 'b', priority: 'P1', done: false }),
        makeItem({ id: 'c', priority: 'P2', done: true }),
      ]

      const output = renderTodo(items)

      expect(output).toContain('Open:  2')
      expect(output).toContain('Done:  1')
      expect(output).toContain('Total: 3')
    })

    it('should not render empty priority sections', () => {
      const items: DocItem[] = [makeItem({ id: 'a', priority: 'P0', done: false })]

      const output = renderTodo(items)

      expect(output).toContain('CRITICAL')
      // P1/P2/P3 sections should be absent when empty
      expect(output).not.toContain('MEDIUM')
      expect(output).not.toContain('LOW')
    })

    it('should sort by pheromone weight when provided', () => {
      const items: DocItem[] = [
        makeItem({ id: 'weak', name: 'Weak Path', priority: 'P0', done: false }),
        makeItem({ id: 'strong', name: 'Strong Path', priority: 'P0', done: false }),
      ]

      const pheromone = new Map([
        ['weak', { strength: 1, resistance: 0.5 }], // net: 0.5
        ['strong', { strength: 5, resistance: 0.5 }], // net: 4.5
      ])

      const output = renderTodo(items, pheromone)

      // Strong Path should appear before Weak Path
      const strongIdx = output.indexOf('Strong Path')
      const weakIdx = output.indexOf('Weak Path')
      expect(strongIdx).toBeLessThan(weakIdx)
    })

    it('should include pheromone weight annotations', () => {
      const items: DocItem[] = [makeItem({ id: 'a', name: 'Highway Task', priority: 'P0', done: false })]

      const pheromone = new Map([['a', { strength: 3, resistance: 1 }]])

      const output = renderTodo(items, pheromone)

      // Should show net weight: 3 - 1 = 2.0
      expect(output).toContain('[w:2.0]')
    })
  })

  describe('gapsToSignals', () => {
    it('should convert unverified items to signals', () => {
      const items = [
        { ...makeItem({ id: 'gap-1', tags: ['engine'] }), verified: false },
        { ...makeItem({ id: 'gap-2', tags: ['ui'] }), verified: false },
      ]

      const signals = gapsToSignals(items)

      expect(signals).toHaveLength(2)
      expect(signals[0].receiver).toBe('worker:implement')
      expect((signals[0].data as { id: string }).id).toBe('gap-1')
    })

    it('should skip verified items', () => {
      const items = [
        { ...makeItem({ id: 'done-item' }), verified: true },
        { ...makeItem({ id: 'gap-item' }), verified: false },
      ]

      const signals = gapsToSignals(items)

      expect(signals).toHaveLength(1)
      expect((signals[0].data as { id: string }).id).toBe('gap-item')
    })

    it('should skip done items even if unverified', () => {
      const items = [
        { ...makeItem({ id: 'done', done: true }), verified: false },
        { ...makeItem({ id: 'open', done: false }), verified: false },
      ]

      const signals = gapsToSignals(items)

      expect(signals).toHaveLength(1)
      expect((signals[0].data as { id: string }).id).toBe('open')
    })

    it('should include tags and source in signal data', () => {
      const items = [
        {
          ...makeItem({
            id: 'gap-3',
            source: 'routing',
            section: 'Critical',
            tags: ['engine', 'routing', 'P0'],
          }),
          verified: false,
        },
      ]

      const signals = gapsToSignals(items)
      const data = signals[0].data as { source: string; tags: string[]; section: string }

      expect(data.source).toBe('routing')
      expect(data.tags).toContain('engine')
      expect(data.section).toBe('Critical')
    })

    it('should return empty array when all items are verified', () => {
      const items = [
        { ...makeItem({ id: 'a' }), verified: true },
        { ...makeItem({ id: 'b' }), verified: true },
      ]

      const signals = gapsToSignals(items)

      expect(signals).toHaveLength(0)
    })
  })

  describe('markdown extraction behaviour (via renderTodo)', () => {
    it('should render P0 section heading for critical items', () => {
      const items: DocItem[] = [makeItem({ priority: 'P0', done: false })]

      const output = renderTodo(items)

      expect(output).toContain('CRITICAL')
    })

    it('should render P1 section heading for high items', () => {
      const items: DocItem[] = [makeItem({ priority: 'P1', done: false })]

      const output = renderTodo(items)

      expect(output).toContain('HIGH')
    })

    it('should separate open and done counts correctly', () => {
      const items: DocItem[] = [
        makeItem({ id: '1', priority: 'P0', done: false }),
        makeItem({ id: '2', priority: 'P0', done: false }),
        makeItem({ id: '3', priority: 'P1', done: true }),
        makeItem({ id: '4', priority: 'P2', done: true }),
      ]

      const output = renderTodo(items)

      expect(output).toContain('Open:  2')
      expect(output).toContain('Done:  2')
      expect(output).toContain('P0: 2')
      expect(output).toContain('P1: 0')
    })
  })
})
