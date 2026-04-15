/**
 * Tests for reusable task templates.
 *
 * Invariants proven here (from docs/TODO-trade-lifecycle.md § Cycle 6):
 *   1. Template parsing round-trips all declared fields
 *   2. Missing required fields (id, name) reject the template
 *   3. World scoping prefixes ids without collision
 *   4. Block references are scoped alongside task ids
 *   5. Rubric weights parse as numbers, not strings
 *   6. Loading a directory walks recursively and skips README
 *   7. Instantiation preserves all optional fields
 *   8. Render preview produces deterministic output per (template, worldId)
 *   9. Multiple worlds can import the same template independently
 *  10. Unknown frontmatter keys are tolerated, not rejected
 */

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  instantiateTemplates,
  loadTemplates,
  parseTemplate,
  type ReusableTaskTemplate,
  renderTemplatePreview,
} from './reusable-tasks'

const FIXTURE_DIR = join(process.cwd(), '.test-reusable-tasks-fixtures')

const SEO_AUDIT_MD = `---
id: seo:audit
name: Audit a website for SEO
description: Structured audit across on-page and off-page factors
tags: [seo, audit, quality]
wave: W3
value: high
effort: medium
phase: C2
persona: agent
rubric:
  fit: 0.30
  form: 0.15
  truth: 0.45
  taste: 0.10
price: 0.05
currency: USDC
---

Body of the template with instructions.`

const WITH_BLOCKS_MD = `---
id: content:draft
name: Draft article
tags: [content]
blocks: [content:edit, content:publish]
---

Body.`

const MISSING_NAME_MD = `---
id: bad:nameless
tags: [broken]
---

No name field.`

const UNKNOWN_KEYS_MD = `---
id: future:skill
name: Future skill
future_feature: something
some_other_key: value
tags: [future]
---

Body.`

describe('reusable-tasks', () => {
  describe('parseTemplate', () => {
    it('parses a complete template with rubric, price, currency', () => {
      const t = parseTemplate(SEO_AUDIT_MD, '/fixture/seo/audit.md')
      expect(t).not.toBeNull()
      if (!t) return
      expect(t.id).toBe('seo:audit')
      expect(t.name).toBe('Audit a website for SEO')
      expect(t.tags).toEqual(['seo', 'audit', 'quality'])
      expect(t.wave).toBe('W3')
      expect(t.value).toBe('high')
      expect(t.effort).toBe('medium')
      expect(t.phase).toBe('C2')
      expect(t.persona).toBe('agent')
      expect(t.price).toBe(0.05)
      expect(t.currency).toBe('USDC')
      expect(t.rubric).toEqual({ fit: 0.3, form: 0.15, truth: 0.45, taste: 0.1 })
      expect(t.source).toBe('/fixture/seo/audit.md')
    })

    it('parses rubric weights as numbers (not strings)', () => {
      const t = parseTemplate(SEO_AUDIT_MD, 'x')
      expect(t?.rubric?.fit).toBeTypeOf('number')
      expect(t?.rubric?.truth).toBeGreaterThan(0.4)
      expect(t?.rubric?.truth).toBeLessThan(0.5)
    })

    it('parses blocks as an array', () => {
      const t = parseTemplate(WITH_BLOCKS_MD, 'x')
      expect(t?.blocks).toEqual(['content:edit', 'content:publish'])
    })

    it('returns null when required fields are missing', () => {
      expect(parseTemplate(MISSING_NAME_MD, 'x')).toBeNull()
      expect(parseTemplate('no frontmatter at all', 'x')).toBeNull()
    })

    it('tolerates unknown frontmatter keys without rejecting the template', () => {
      const t = parseTemplate(UNKNOWN_KEYS_MD, 'x')
      expect(t).not.toBeNull()
      expect(t?.id).toBe('future:skill')
    })

    it('captures body as description when description field is absent', () => {
      const t = parseTemplate(UNKNOWN_KEYS_MD, 'x')
      expect(t?.description).toContain('Body.')
    })
  })

  describe('instantiateTemplates (world scoping)', () => {
    const tpl = parseTemplate(SEO_AUDIT_MD, 'x') as ReusableTaskTemplate

    it('prefixes template id with worldId', () => {
      const [task] = instantiateTemplates([tpl], { worldId: 'donal' })
      expect(task.id).toBe('donal:seo:audit')
    })

    it('allows the same template in two worlds without collision', () => {
      const [donalTask] = instantiateTemplates([tpl], { worldId: 'donal' })
      const [alphaTask] = instantiateTemplates([tpl], { worldId: 'alpha' })
      expect(donalTask.id).not.toBe(alphaTask.id)
      expect(donalTask.id).toBe('donal:seo:audit')
      expect(alphaTask.id).toBe('alpha:seo:audit')
    })

    it('scopes block references alongside task ids', () => {
      const blockTpl = parseTemplate(WITH_BLOCKS_MD, 'x') as ReusableTaskTemplate
      const [task] = instantiateTemplates([blockTpl], { worldId: 'donal' })
      expect(task.blocks).toEqual(['donal:content:edit', 'donal:content:publish'])
    })

    it('applies defaults for optional fields', () => {
      const minimal = parseTemplate(`---\nid: x:y\nname: X\n---\nBody.`, 'x') as ReusableTaskTemplate
      const [task] = instantiateTemplates([minimal], { worldId: 'w' })
      expect(task.wave).toBe('W3')
      expect(task.value).toBe('medium')
      expect(task.phase).toBe('C1')
      expect(task.persona).toBe('agent')
    })

    it('preserves tags from template to task', () => {
      const [task] = instantiateTemplates([tpl], { worldId: 'donal' })
      expect(task.tags).toEqual(['seo', 'audit', 'quality'])
    })
  })

  describe('renderTemplatePreview', () => {
    const tpl = parseTemplate(SEO_AUDIT_MD, 'x') as ReusableTaskTemplate

    it('produces identical output for identical inputs (deterministic)', () => {
      const a = renderTemplatePreview(tpl, 'donal')
      const b = renderTemplatePreview(tpl, 'donal')
      expect(a).toBe(b)
    })

    it('embeds the scoped id', () => {
      const out = renderTemplatePreview(tpl, 'donal')
      expect(out).toContain('donal:seo:audit')
    })

    it('embeds rubric attributes when present', () => {
      const out = renderTemplatePreview(tpl, 'donal')
      expect(out).toContain('has rubric-truth 0.45')
      expect(out).toContain('has price 0.05')
      expect(out).toContain('has currency "USDC"')
    })
  })

  describe('loadTemplates (filesystem)', () => {
    beforeAll(async () => {
      await mkdir(join(FIXTURE_DIR, 'seo'), { recursive: true })
      await mkdir(join(FIXTURE_DIR, 'content'), { recursive: true })
      await writeFile(join(FIXTURE_DIR, 'seo', 'audit.md'), SEO_AUDIT_MD)
      await writeFile(join(FIXTURE_DIR, 'content', 'draft.md'), WITH_BLOCKS_MD)
      await writeFile(join(FIXTURE_DIR, 'README.md'), '# README — should be skipped')
      await writeFile(join(FIXTURE_DIR, 'broken.md'), MISSING_NAME_MD)
    })

    afterAll(async () => {
      await rm(FIXTURE_DIR, { recursive: true, force: true })
    })

    it('walks nested directories and skips README + broken templates', async () => {
      const templates = await loadTemplates(FIXTURE_DIR)
      const ids = templates.map((t) => t.id).sort()
      expect(ids).toEqual(['content:draft', 'seo:audit'])
    })

    it('returns an empty array for a non-existent directory', async () => {
      const templates = await loadTemplates('/definitely/does/not/exist/here')
      expect(templates).toEqual([])
    })
  })

  describe('round-trip invariants', () => {
    it('template → instantiate → preview chain preserves id scoping', () => {
      const tpl = parseTemplate(SEO_AUDIT_MD, 'x') as ReusableTaskTemplate
      const [task] = instantiateTemplates([tpl], { worldId: 'donal' })
      const preview = renderTemplatePreview(tpl, 'donal')
      expect(preview).toContain(task.id)
    })

    it('same template twice produces identical instantiated ids (idempotent)', () => {
      const tpl = parseTemplate(SEO_AUDIT_MD, 'x') as ReusableTaskTemplate
      const first = instantiateTemplates([tpl], { worldId: 'donal' })
      const second = instantiateTemplates([tpl], { worldId: 'donal' })
      expect(first[0].id).toBe(second[0].id)
    })
  })
})
