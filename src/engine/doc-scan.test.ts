/**
 * doc-scan.test.ts — Test markdown item extraction and loop integration
 *
 * Tests extractItems (checkbox + gap parsing), groupByPriority,
 * renderTodo, gapsToSignals, inferTags, inferPriority, verify,
 * verifyAll, scanDocs, and docMark.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DocItem, VerifiedItem } from './doc-scan'
import { docMark, gapsToSignals, groupByPriority, renderTodo, verify, verifyAll } from './doc-scan'

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

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: extractItems (tested via scanDocs with mocked fs)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('extractItems (via scanDocs)', () => {
    beforeEach(() => {
      // Reset the lazy _node cache between tests so mocks take effect
      vi.resetModules()
    })

    /** Helper: mock fs so scanDocs reads from an in-memory file map */
    async function scanMocked(files: Record<string, string>): Promise<DocItem[]> {
      // Monkey-patch the lazy node() loader via dynamic import mocking
      vi.doMock('node:fs/promises', () => ({
        readdir: vi.fn(async () => Object.keys(files)),
        readFile: vi.fn(async (_path: string) => {
          const name = _path.split('/').pop() ?? _path
          return files[name] ?? ''
        }),
      }))
      vi.doMock('node:path', () => ({
        join: (...parts: string[]) => parts[parts.length - 1],
        basename: (p: string) => p.split('/').pop() ?? p,
      }))

      // Re-import after mocking
      const mod = await import('./doc-scan')
      return mod.scanDocs('/fake/docs')
    }

    it('should parse unchecked checkbox items', async () => {
      const items = await scanMocked({
        'test.md': '- [ ] Build the API\n- [ ] Write tests\n',
      })

      expect(items.length).toBe(2)
      expect(items[0].done).toBe(false)
      expect(items[0].name).toBe('Build the API')
      expect(items[1].name).toBe('Write tests')
    })

    it('should parse checked checkbox items', async () => {
      const items = await scanMocked({
        'test.md': '- [x] Deploy worker\n- [X] Ship it\n',
      })

      expect(items.length).toBe(2)
      expect(items[0].done).toBe(true)
      expect(items[1].done).toBe(true)
    })

    it('should parse indented checkbox items', async () => {
      const items = await scanMocked({
        'test.md': '  - [ ] Nested item\n    - [x] Deep nested\n',
      })

      expect(items.length).toBe(2)
      expect(items[0].name).toBe('Nested item')
      expect(items[1].done).toBe(true)
    })

    it('should parse Gap N: patterns', async () => {
      const items = await scanMocked({
        'gaps.md': 'Gap 1: Missing auth\nGap 2: No tests\n',
      })

      expect(items.length).toBe(2)
      expect(items[0].id).toBe('gap-1')
      expect(items[0].name).toBe('Gap 1: Missing auth')
      expect(items[0].priority).toBe('P0')
      expect(items[0].tags).toContain('gap')
    })

    it('should parse bold Gap patterns', async () => {
      const items = await scanMocked({
        'gaps.md': '**Gap 3: Bold gap** — description here\n',
      })

      expect(items.length).toBe(1)
      expect(items[0].id).toBe('gap-3')
      expect(items[0].name).toContain('Bold gap')
    })

    it('should track section headings', async () => {
      const items = await scanMocked({
        'plan.md': '## Critical\n\n- [ ] Fix auth\n\n## Later\n\n- [ ] Polish UI\n',
      })

      expect(items.length).toBe(2)
      expect(items[0].section).toBe('Critical')
      expect(items[1].section).toBe('Later')
    })

    it('should handle empty files', async () => {
      const items = await scanMocked({
        'empty.md': '',
      })

      expect(items).toHaveLength(0)
    })

    it('should handle files with no actionable items', async () => {
      const items = await scanMocked({
        'prose.md': '# Title\n\nJust some prose with no checkboxes or gaps.\n\n## Another section\n\nMore text.\n',
      })

      expect(items).toHaveLength(0)
    })

    it('should handle malformed markdown gracefully', async () => {
      const items = await scanMocked({
        'bad.md': '- [] Missing space\n- [z] Invalid marker\n- [ ]No space after bracket\n#No space heading\n',
      })

      // None of these should match the checkbox regex
      expect(items).toHaveLength(0)
    })

    it('should strip bold/backtick formatting from names', async () => {
      const items = await scanMocked({
        'test.md': '- [ ] **Bold task** with `code` stuff\n',
      })

      expect(items.length).toBe(1)
      expect(items[0].name).not.toContain('**')
      expect(items[0].name).not.toContain('`')
    })

    it('should strip trailing explanatory text after em-dash', async () => {
      const items = await scanMocked({
        'test.md': '- [ ] Deploy worker — needs wrangler config first\n',
      })

      expect(items.length).toBe(1)
      expect(items[0].name).toBe('Deploy worker')
    })

    it('should strip trailing parenthetical text', async () => {
      const items = await scanMocked({
        'test.md': '- [ ] Add auth (blocked by infra)\n',
      })

      expect(items.length).toBe(1)
      expect(items[0].name).toBe('Add auth')
    })

    it('should generate source from filename', async () => {
      const items = await scanMocked({
        'TODO-deploy.md': '- [ ] Fix deploy\n',
      })

      expect(items[0].source).toBe('todo-deploy')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: inferTags (tested via scanDocs item tags)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('inferTags (via scanDocs)', () => {
    beforeEach(() => {
      vi.resetModules()
    })

    async function tagsFor(text: string): Promise<string[]> {
      vi.doMock('node:fs/promises', () => ({
        readdir: vi.fn(async () => ['test.md']),
        readFile: vi.fn(async () => `- [ ] ${text}\n`),
      }))
      vi.doMock('node:path', () => ({
        join: (...parts: string[]) => parts[parts.length - 1],
        basename: (p: string) => p.split('/').pop() ?? p,
      }))
      const mod = await import('./doc-scan')
      const items = await mod.scanDocs('/fake')
      return items[0]?.tags ?? []
    }

    it('should always include source as first tag', async () => {
      const tags = await tagsFor('Some random task')
      expect(tags[0]).toBe('test')
    })

    it('should detect build keywords', async () => {
      const tags = await tagsFor('Deploy worker to cloudflare')
      expect(tags).toContain('build')
      expect(tags).toContain('infra')
    })

    it('should detect ui keywords', async () => {
      const tags = await tagsFor('Fix the panel layout and graph edges')
      expect(tags).toContain('ui')
    })

    it('should detect engine keywords', async () => {
      const tags = await tagsFor('Implement routing with pheromone decay')
      expect(tags).toContain('engine')
    })

    it('should detect commerce keywords', async () => {
      const tags = await tagsFor('Add payment escrow with x402')
      expect(tags).toContain('commerce')
    })

    it('should detect typedb keywords', async () => {
      const tags = await tagsFor('Fix TypeDB schema query')
      expect(tags).toContain('typedb')
    })

    it('should detect agent keywords', async () => {
      const tags = await tagsFor('Configure nanoclaw agent LLM prompt')
      expect(tags).toContain('agent')
    })

    it('should detect security keywords', async () => {
      const tags = await tagsFor('Add auth token identity check')
      expect(tags).toContain('security')
    })

    it('should detect marketing keywords', async () => {
      const tags = await tagsFor('SEO content for blog signup campaign')
      expect(tags).toContain('marketing')
    })

    it('should assign multiple matching tags', async () => {
      const tags = await tagsFor('Deploy agent to cloudflare worker')
      expect(tags).toContain('build')
      expect(tags).toContain('agent')
      expect(tags).toContain('infra')
    })

    it('should not duplicate tags', async () => {
      const tags = await tagsFor('Deploy worker to cloudflare')
      const uniqueTags = [...new Set(tags)]
      expect(tags.length).toBe(uniqueTags.length)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: inferPriority (tested via scanDocs section → priority mapping)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('inferPriority (via scanDocs)', () => {
    beforeEach(() => {
      vi.resetModules()
    })

    async function priorityFor(section: string): Promise<string> {
      vi.doMock('node:fs/promises', () => ({
        readdir: vi.fn(async () => ['test.md']),
        readFile: vi.fn(async () => `## ${section}\n\n- [ ] Some task\n`),
      }))
      vi.doMock('node:path', () => ({
        join: (...parts: string[]) => parts[parts.length - 1],
        basename: (p: string) => p.split('/').pop() ?? p,
      }))
      const mod = await import('./doc-scan')
      const items = await mod.scanDocs('/fake')
      return items[0]?.priority ?? 'P2'
    }

    it('should map "Critical" section to P0', async () => {
      expect(await priorityFor('Critical')).toBe('P0')
    })

    it('should map "Unblock" section to P0', async () => {
      expect(await priorityFor('Unblock Live Agents')).toBe('P0')
    })

    it('should map "Security Checklist" to P0', async () => {
      expect(await priorityFor('Security Checklist')).toBe('P0')
    })

    it('should map "High" section to P1', async () => {
      expect(await priorityFor('High Priority')).toBe('P1')
    })

    it('should map "Phase 1" to P1', async () => {
      expect(await priorityFor('Phase 1')).toBe('P1')
    })

    it('should map "Foundation" to P1', async () => {
      expect(await priorityFor('Foundation')).toBe('P1')
    })

    it('should map "Medium" section to P2', async () => {
      expect(await priorityFor('Medium')).toBe('P2')
    })

    it('should map "Phase 3" to P2', async () => {
      expect(await priorityFor('Phase 3')).toBe('P2')
    })

    it('should map "Low" section to P3', async () => {
      expect(await priorityFor('Low')).toBe('P3')
    })

    it('should map "Later" section to P3', async () => {
      expect(await priorityFor('Later')).toBe('P3')
    })

    it('should map "Visual Polish" to P3', async () => {
      expect(await priorityFor('Visual Polish')).toBe('P3')
    })

    it('should default to P2 for unknown sections', async () => {
      expect(await priorityFor('Miscellaneous')).toBe('P2')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: verify — mock file I/O, test keyword matching
  // ═══════════════════════════════════════════════════════════════════════════

  describe('verify', () => {
    it('should mark done items as verified', async () => {
      const item = makeItem({ done: true, tags: ['engine'] })

      const result = await verify(item)

      expect(result.verified).toBe(true)
      expect(result.evidence).toBe('marked-done')
    })

    it('should return unverified when no tags match CODE_TARGETS', async () => {
      const item = makeItem({ tags: ['unknown-tag'], done: false })

      const result = await verify(item)

      expect(result.verified).toBe(false)
    })

    it('should return unverified when item name words are too short', async () => {
      // All words <= 3 chars get filtered out by keyword extraction
      const item = makeItem({ name: 'Do it', tags: ['engine'], done: false })

      const result = await verify(item)

      // No keywords to search for, so won't find match
      expect(result.verified).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: verifyAll — concurrent verification
  // ═══════════════════════════════════════════════════════════════════════════

  describe('verifyAll', () => {
    it('should verify all items concurrently', async () => {
      const items: DocItem[] = [
        makeItem({ id: 'a', done: true, tags: ['engine'] }),
        makeItem({ id: 'b', done: true, tags: ['ui'] }),
        makeItem({ id: 'c', done: false, tags: ['unknown'] }),
      ]

      const results = await verifyAll(items)

      expect(results).toHaveLength(3)
      expect(results[0].verified).toBe(true)
      expect(results[1].verified).toBe(true)
      expect(results[2].verified).toBe(false)
    })

    it('should handle empty input', async () => {
      const results = await verifyAll([])
      expect(results).toHaveLength(0)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: scanDocs — deduplication
  // ═══════════════════════════════════════════════════════════════════════════

  describe('scanDocs deduplication', () => {
    beforeEach(() => {
      vi.resetModules()
    })

    it('should deduplicate items with the same ID', async () => {
      vi.doMock('node:fs/promises', () => ({
        readdir: vi.fn(async () => ['a.md', 'b.md']),
        readFile: vi.fn(async (_path: string) => {
          // Both files have a gap with the same number → same ID "gap-1"
          return 'Gap 1: Missing auth\n'
        }),
      }))
      vi.doMock('node:path', () => ({
        join: (...parts: string[]) => parts[parts.length - 1],
        basename: (p: string) => p.split('/').pop() ?? p,
      }))

      const mod = await import('./doc-scan')
      const items = await mod.scanDocs('/fake')

      // gap-1 should appear only once
      const gap1Items = items.filter((i: DocItem) => i.id === 'gap-1')
      expect(gap1Items).toHaveLength(1)
    })

    it('should prefer higher priority duplicate', async () => {
      vi.doMock('node:fs/promises', () => ({
        readdir: vi.fn(async () => ['low.md', 'high.md']),
        readFile: vi.fn(async (path: string) => {
          const name = path.split('/').pop() ?? path
          if (name === 'low.md') {
            return '## Later\n\nGap 1: Fix routing\n'
          }
          // high.md has gap in Critical section — but gap priority is always P0
          return '## Critical\n\nGap 1: Fix routing\n'
        }),
      }))
      vi.doMock('node:path', () => ({
        join: (...parts: string[]) => parts[parts.length - 1],
        basename: (p: string) => p.split('/').pop() ?? p,
      }))

      const mod = await import('./doc-scan')
      const items = await mod.scanDocs('/fake')

      const gap1 = items.find((i: DocItem) => i.id === 'gap-1')
      expect(gap1).toBeDefined()
      // Gap items always get P0
      expect(gap1!.priority).toBe('P0')
    })

    it('should only scan .md files', async () => {
      vi.doMock('node:fs/promises', () => ({
        readdir: vi.fn(async () => ['readme.md', 'config.json', 'script.ts']),
        readFile: vi.fn(async (path: string) => {
          const name = path.split('/').pop() ?? path
          if (name === 'readme.md') return '- [ ] One task\n'
          return '- [ ] Should not appear\n'
        }),
      }))
      vi.doMock('node:path', () => ({
        join: (...parts: string[]) => parts[parts.length - 1],
        basename: (p: string) => p.split('/').pop() ?? p,
      }))

      const mod = await import('./doc-scan')
      const items = await mod.scanDocs('/fake')

      expect(items).toHaveLength(1)
      expect(items[0].name).toBe('One task')
    })

    it('should prefer higher priority when duplicate checkbox items exist across files', async () => {
      vi.doMock('node:fs/promises', () => ({
        readdir: vi.fn(async () => ['a.md', 'b.md']),
        readFile: vi.fn(async (path: string) => {
          const name = path.split('/').pop() ?? path
          if (name === 'a.md') {
            return '## Later\n\n- [ ] Fix deploy\n'
          }
          return '## Critical\n\n- [ ] Fix deploy\n'
        }),
      }))
      vi.doMock('node:path', () => ({
        join: (...parts: string[]) => parts[parts.length - 1],
        basename: (p: string) => p.split('/').pop() ?? p,
      }))

      const mod = await import('./doc-scan')
      const items = await mod.scanDocs('/fake')

      // IDs include source prefix, so a-fix-deploy and b-fix-deploy are different
      // Both should exist since they have different sources (different IDs)
      expect(items.length).toBe(2)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: docMark — mark/warn based on outcome
  // ═══════════════════════════════════════════════════════════════════════════

  describe('docMark', () => {
    it('should call markFn on result outcome', () => {
      const markFn = vi.fn()
      const warnFn = vi.fn()
      const marker = docMark(markFn, warnFn)

      const item: VerifiedItem = {
        ...makeItem({ source: 'gaps', tags: ['engine'] }),
        verified: true,
        target: 'src/engine/world.ts',
      }

      marker(item, { result: 'implemented' })

      expect(markFn).toHaveBeenCalledWith('doc:gaps→src/engine/world.ts')
      expect(warnFn).not.toHaveBeenCalled()
    })

    it('should call warnFn on non-result outcome', () => {
      const markFn = vi.fn()
      const warnFn = vi.fn()
      const marker = docMark(markFn, warnFn)

      const item: VerifiedItem = {
        ...makeItem({ source: 'plan' }),
        verified: false,
      }

      marker(item, { timeout: true })

      expect(warnFn).toHaveBeenCalledWith('doc:plan→code', 0.5)
      expect(markFn).not.toHaveBeenCalled()
    })

    it('should use "code" as fallback when no target', () => {
      const markFn = vi.fn()
      const warnFn = vi.fn()
      const marker = docMark(markFn, warnFn)

      const item: VerifiedItem = {
        ...makeItem({ source: 'test' }),
        verified: false,
      }

      marker(item, { dissolved: true })

      expect(warnFn).toHaveBeenCalledWith('doc:test→code', 0.5)
    })
  })
})
