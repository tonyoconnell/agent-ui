/**
 * REUSABLE-TASKS — Import task templates from a catalog into a world.
 *
 * A reusable task is a markdown file with YAML-lite frontmatter that defines
 * a task template once and lets any world instantiate it. Templates live
 * under `tasks/` (local) or can be loaded from any directory path. Importing
 * scopes every template id to `{worldId}:{template.id}` so worlds don't
 * collide, then hands off to `syncTasks` for TypeDB persistence.
 *
 * Shape of a template file:
 *
 *   ---
 *   id: seo:audit
 *   name: Audit a website for SEO
 *   tags: [seo, audit, quality]
 *   wave: W3
 *   value: high
 *   effort: medium
 *   phase: C2
 *   persona: agent
 *   rubric:
 *     fit: 0.30
 *     form: 0.15
 *     truth: 0.45
 *     taste: 0.10
 *   price: 0.05
 *   currency: USDC
 *   blocks: [seo:citation, seo:outreach]
 *   ---
 *
 *   # Body: task description / rubric guidance / examples
 *
 * Stage 1 (LIST) of the trade lifecycle. See docs/TODO-trade-lifecycle.md § Cycle 6.
 */

import { write, writeSilent } from '@/lib/typedb'
import type { Effort, ParsedTask, Phase, Value, Wave } from './task-parse'
import { syncTasks } from './task-sync'

// ── Types ───────────────────────────────────────────────────────────────

export interface RubricWeights {
  fit: number
  form: number
  truth: number
  taste: number
}

export interface ReusableTaskTemplate {
  id: string
  name: string
  description?: string
  tags: string[]
  wave?: Wave
  value?: Value
  effort?: Effort
  phase?: Phase
  persona?: string
  rubric?: RubricWeights
  price?: number
  currency?: string
  blocks?: string[]
  source: string
}

export interface ImportOptions {
  worldId: string
  providerUid?: string
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: number
  templates: ReusableTaskTemplate[]
}

// ── Parsing ─────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** Strip surrounding quotes (single or double). */
function unquote(s: string): string {
  const t = s.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1)
  }
  return t
}

/** Parse a YAML-lite array: `[a, b, c]` or bare `a, b, c`. */
function parseArray(raw: string): string[] {
  const t = raw.trim()
  const inner = t.startsWith('[') && t.endsWith(']') ? t.slice(1, -1) : t
  return inner
    .split(',')
    .map((x) => unquote(x))
    .filter(Boolean)
}

/** Parse a nested rubric block with indented keys. */
function parseRubric(lines: string[], startIdx: number): { weights: RubricWeights | null; endIdx: number } {
  const weights: Partial<RubricWeights> = {}
  let i = startIdx
  while (i < lines.length) {
    const line = lines[i]
    if (!line.startsWith(' ') && !line.startsWith('\t')) break
    const m = line.match(/^\s+(\w+)\s*:\s*(.+)$/)
    if (!m) break
    const [, k, v] = m
    const num = Number.parseFloat(v.trim())
    if (!Number.isNaN(num) && ['fit', 'form', 'truth', 'taste'].includes(k)) {
      weights[k as keyof RubricWeights] = num
    }
    i++
  }
  const complete =
    typeof weights.fit === 'number' &&
    typeof weights.form === 'number' &&
    typeof weights.truth === 'number' &&
    typeof weights.taste === 'number'
  return { weights: complete ? (weights as RubricWeights) : null, endIdx: i - 1 }
}

/**
 * Parse one template from its markdown source.
 * Returns null if no valid frontmatter or missing required fields (id, name).
 */
export function parseTemplate(md: string, sourcePath: string): ReusableTaskTemplate | null {
  const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!fmMatch) return null
  const [, frontmatter, body] = fmMatch
  const lines = frontmatter.split('\n')

  const out: Partial<ReusableTaskTemplate> = { tags: [], source: sourcePath }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^(\w+)\s*:\s*(.*)$/)
    if (!m) continue
    const [, key, rawVal] = m
    const val = rawVal.trim()

    switch (key) {
      case 'id':
        out.id = unquote(val)
        break
      case 'name':
        out.name = unquote(val)
        break
      case 'description':
        out.description = unquote(val)
        break
      case 'tags':
        out.tags = parseArray(val)
        break
      case 'wave':
        if (['W1', 'W2', 'W3', 'W4'].includes(val)) out.wave = val as Wave
        break
      case 'value':
        if (['critical', 'high', 'medium'].includes(val)) out.value = val as Value
        break
      case 'effort':
        if (['low', 'medium', 'high'].includes(val)) out.effort = val as Effort
        break
      case 'phase':
        if (/^C[1-7]$/.test(val)) out.phase = val as Phase
        break
      case 'persona':
        out.persona = unquote(val)
        break
      case 'price': {
        const n = Number.parseFloat(val)
        if (!Number.isNaN(n)) out.price = n
        break
      }
      case 'currency':
        out.currency = unquote(val)
        break
      case 'blocks':
        out.blocks = parseArray(val)
        break
      case 'rubric': {
        if (val === '' || val === '|' || val === '>') {
          const { weights, endIdx } = parseRubric(lines, i + 1)
          if (weights) out.rubric = weights
          i = endIdx
        }
        break
      }
    }
  }

  if (!out.id || !out.name) return null

  // Default description from body if omitted
  if (!out.description && body) {
    out.description = body.trim().slice(0, 500)
  }

  return out as ReusableTaskTemplate
}

// ── Loading ─────────────────────────────────────────────────────────────

let _node: { readdir: any; readFile: any; join: any } | null = null
async function node() {
  if (_node) return _node
  const fsp = await import('node:fs/promises')
  const path = await import('node:path')
  _node = { readdir: fsp.readdir, readFile: fsp.readFile, join: path.join }
  return _node
}

/**
 * Recursively load all templates from a directory. Skips files without valid
 * frontmatter or missing required fields.
 */
export async function loadTemplates(dir: string): Promise<ReusableTaskTemplate[]> {
  const { readdir, readFile, join } = await node()
  const templates: ReusableTaskTemplate[] = []

  async function walk(current: string): Promise<void> {
    let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
        try {
          const md = await readFile(full, 'utf-8')
          const parsed = parseTemplate(md, full)
          if (parsed) templates.push(parsed)
        } catch {}
      }
    }
  }

  await walk(dir)
  return templates
}

// ── Instantiation ───────────────────────────────────────────────────────

/**
 * Scope every template to a world. `seo:audit` imported into world `donal`
 * becomes `donal:seo:audit`. Block references are scoped the same way so
 * relations stay intact within the world.
 */
export function instantiateTemplates(templates: ReusableTaskTemplate[], opts: ImportOptions): ParsedTask[] {
  const { worldId } = opts
  const scope = (id: string) => `${worldId}:${id}`
  return templates.map((tpl) => ({
    id: scope(tpl.id),
    name: tpl.name,
    done: false,
    value: tpl.value ?? 'medium',
    effort: tpl.effort ?? 'medium',
    wave: tpl.wave ?? 'W3',
    phase: tpl.phase ?? 'C1',
    persona: tpl.persona ?? 'agent',
    context: [],
    blocks: (tpl.blocks ?? []).map(scope),
    exit: '',
    tags: tpl.tags ?? [],
    source: tpl.source,
    line: 0,
    priority: 0,
    formula: 'template',
  }))
}

// ── TypeDB extensions: rubric + price + currency ────────────────────────

/**
 * After syncTasks persists the core task + skill, layer on the template-only
 * attributes that the base task format doesn't know about: rubric weights,
 * listing price, listing currency, template-source traceability.
 */
async function writeTemplateExtensions(scoped: ParsedTask[], templates: ReusableTaskTemplate[]): Promise<number> {
  let count = 0
  for (let i = 0; i < scoped.length; i++) {
    const task = scoped[i]
    const tpl = templates[i]
    const parts: string[] = []
    if (tpl.price !== undefined) parts.push(`has price ${tpl.price}`)
    if (tpl.currency) parts.push(`has currency "${esc(tpl.currency)}"`)
    parts.push(`has template-source "${esc(tpl.source)}"`)
    if (tpl.rubric) {
      parts.push(`has rubric-fit ${tpl.rubric.fit}`)
      parts.push(`has rubric-form ${tpl.rubric.form}`)
      parts.push(`has rubric-truth ${tpl.rubric.truth}`)
      parts.push(`has rubric-taste ${tpl.rubric.taste}`)
    }
    if (parts.length === 0) continue
    try {
      await writeSilent(`
        match $s isa skill, has skill-id "${esc(task.id)}";
        insert $s ${parts.join(', ')};
      `)
      count++
    } catch {}
  }
  return count
}

/**
 * Import a directory of templates into a world. Idempotent: re-import is
 * a no-op for existing tasks (task-sync skips existing ids). Extension
 * attributes are upserted per-sync (may duplicate if schema doesn't enforce
 * key uniqueness; callers should treat this as best-effort enrichment).
 */
export async function importReusableTasks(dir: string, opts: ImportOptions): Promise<ImportResult> {
  const templates = await loadTemplates(dir)
  if (templates.length === 0) {
    return { imported: 0, skipped: 0, errors: 0, templates: [] }
  }
  const scoped = instantiateTemplates(templates, opts)
  const { synced, errors } = await syncTasks(scoped)
  await writeTemplateExtensions(scoped, templates)
  return {
    imported: synced,
    skipped: templates.length - synced - errors,
    errors,
    templates,
  }
}

// ── Utilities for tests & direct callers ────────────────────────────────

/** Build the TypeQL insert string for a template without hitting TypeDB. */
export function renderTemplatePreview(template: ReusableTaskTemplate, worldId: string): string {
  const scoped = instantiateTemplates([template], { worldId })[0]
  const parts: string[] = []
  if (template.price !== undefined) parts.push(`has price ${template.price}`)
  if (template.currency) parts.push(`has currency "${esc(template.currency)}"`)
  if (template.rubric) {
    parts.push(`has rubric-fit ${template.rubric.fit}`)
    parts.push(`has rubric-form ${template.rubric.form}`)
    parts.push(`has rubric-truth ${template.rubric.truth}`)
    parts.push(`has rubric-taste ${template.rubric.taste}`)
  }
  return `skill-id="${scoped.id}" ${parts.join(', ')}`
}

/** Expose the TypeDB writer helper for direct use (admin scripts, tests). */
export { writeTemplateExtensions }

/**
 * Schema note: the skill entity needs these attributes to support rubric
 * and template traceability. If your TypeDB schema is older, add:
 *
 *   skill owns rubric-fit, owns rubric-form, owns rubric-truth, owns rubric-taste;
 *   skill owns template-source;
 *
 * The base `price` and `currency` attributes are already in world.tql.
 */
export const REQUIRED_SCHEMA_ATTRIBUTES = [
  'rubric-fit',
  'rubric-form',
  'rubric-truth',
  'rubric-taste',
  'template-source',
] as const

// Silence unused import warning in environments that tree-shake aggressively.
void write
