/**
 * Context — Docs as knowledge. Span out. Emerge.
 *
 * Docs are the training data. Docs are the system prompt.
 * Docs are the knowledge base. They span to every agent.
 *
 *   loadContext(['routing', 'dsl'])  → merged markdown
 *   ingestDocs()                     → docs → TypeDB hypotheses
 *   docIndex()                       → TOC of all docs
 *
 * Docs are bundled at build time via Vite import.meta.glob — no Node fs required.
 */

import { writeSilent } from '@/lib/typedb'
import { type AuditResult, auditSkills } from './skill-audit'

// ═══════════════════════════════════════════════════════════════════════════
// BUNDLED DOCS — resolved at build time by Vite, no fs at runtime.
//
// IMPORTANT: only the 8 canonical docs are eager-bundled. Globbing all of
// `/one/*.md` pulled in 290 files (~5.75 MiB) of plans/todos/strategy that
// the worker never reads at request time, blowing the CF free-tier limit.
// docIndex() / ingestDocs() are narrowed to this same set; for full-corpus
// ingestion run a Bun script that reads from disk directly.
// ═══════════════════════════════════════════════════════════════════════════

const DOC_FILES = import.meta.glob<string>(
  [
    '/one/routing.md',
    '/one/dsl.md',
    '/one/dictionary.md',
    '/one/metaphors.md',
    '/one/sdk.md',
    '/one/claw.md',
    '/one/loops.md',
    '/one/patterns.md',
  ],
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
)

// Lookup by basename: 'dsl.md' → raw content
const DOC_MAP: Record<string, string> = {}
for (const [filePath, content] of Object.entries(DOC_FILES)) {
  const name = filePath.split('/').pop()!
  DOC_MAP[name] = content
}

// ═══════════════════════════════════════════════════════════════════════════
// PATHS
// ═══════════════════════════════════════════════════════════════════════════

/** Canonical docs that define the system */
export const CANONICAL = {
  routing: 'routing.md',
  dsl: 'dsl.md',
  dictionary: 'dictionary.md',
  metaphors: 'metaphors.md',
  sdk: 'sdk.md',
  nanoclaw: 'claw.md',
  loops: 'loops.md',
  patterns: 'patterns.md',
} as const

export type DocKey = keyof typeof CANONICAL

// ═══════════════════════════════════════════════════════════════════════════
// LOAD — Read docs as context for agents
// ═══════════════════════════════════════════════════════════════════════════

/** Read a single doc by basename (e.g. 'dsl.md' or 'dsl') */
export const readDoc = (name: string): string | null => {
  const key = name.endsWith('.md') ? name : `${name}.md`
  return DOC_MAP[key] ?? null
}

/** Load multiple docs as merged context */
export const loadContext = (keys: (DocKey | string)[]): string => {
  return keys
    .map((k) => {
      const filename = CANONICAL[k as DocKey] || k
      const content = readDoc(filename)
      if (!content) return null
      return `# ${filename}\n\n${content}`
    })
    .filter(Boolean)
    .join('\n\n---\n\n')
}

/** Load context for a skill (maps skill → relevant docs) */
export const contextForSkill = (skill: string): string => {
  const skillDocs: Record<string, DocKey[]> = {
    routing: ['routing', 'dsl'],
    route: ['routing', 'dsl'],
    signal: ['dsl', 'routing'],
    emit: ['dsl'],
    mark: ['routing', 'dsl'],
    warn: ['routing', 'dsl'],
    fade: ['routing', 'loops'],
    follow: ['routing'],
    select: ['routing'],
    ask: ['routing', 'dsl'],
    toxic: ['routing'],
    highway: ['routing', 'loops'],
    loop: ['loops', 'routing'],
    tick: ['loops', 'routing'],
    evolve: ['loops'],
    know: ['loops', 'patterns'],
    recall: ['loops', 'patterns'],
    metaphor: ['metaphors', 'dictionary'],
    ant: ['metaphors'],
    brain: ['metaphors'],
    team: ['metaphors'],
    deploy: ['nanoclaw'],
    edge: ['nanoclaw'],
    cloudflare: ['nanoclaw'],
    worker: ['nanoclaw'],
  }
  // Base context: always include DSL + dictionary for any skill
  const docs = skillDocs[skill] || ['dsl']
  return loadContext([...new Set([...docs, 'dsl', 'dictionary'])])
}

// ═══════════════════════════════════════════════════════════════════════════
// INFER — Tags → docs. The graph decides what context to load.
// ═══════════════════════════════════════════════════════════════════════════

/** Map task tags to relevant doc keys. Multiple tags merge (union). */
export const inferDocsFromTags = (tags: string[]): DocKey[] => {
  const TAG_DOCS: Record<string, DocKey[]> = {
    engine: ['dsl', 'routing'],
    routing: ['routing', 'dsl'],
    signal: ['dsl', 'routing'],
    typedb: ['dsl'],
    schema: ['dsl'],
    ui: ['dictionary'],
    commerce: ['sdk'],
    api: ['sdk', 'dsl'],
    test: ['routing', 'patterns'],
    lifecycle: ['routing', 'dsl'],
    agent: ['dsl', 'dictionary'],
    build: ['dsl', 'routing'],
    deploy: ['nanoclaw'],
    metaphor: ['metaphors', 'dictionary'],
    learning: ['loops', 'patterns'],
    fix: ['dsl', 'routing'],
    docs: ['dictionary', 'dsl'],
    sui: ['dsl'],
  }
  const seen = new Set<DocKey>()
  for (const tag of tags) {
    for (const doc of TAG_DOCS[tag] || []) seen.add(doc)
  }
  // Always include DSL + dictionary as base context
  seen.add('dsl')
  seen.add('dictionary')
  return [...seen]
}

/** Build full context envelope for a task. Everything the executor needs. */
export const resolveContext = async (
  task: {
    tags: string[]
    id?: string
    exit?: string
    blocks?: string[]
    wave?: string
    effort?: string
    requesterUid?: string
  },
  net?: {
    recall?: (match?: string) => Promise<{ pattern: string; confidence: number }[]>
    highways?: (n?: number) => { path: string; strength: number }[]
  },
): Promise<{
  docs: string
  hypotheses: { pattern: string; confidence: number }[]
  highways: { path: string; strength: number }[]
  skillAudit: AuditResult
  exit: string | undefined
  unblocks: string[] | undefined
  model: string
}> => {
  const docKeys = inferDocsFromTags(task.tags)
  const docs = loadContext(docKeys)
  const allHighways = net?.highways ? net.highways(20) : []
  const highways = allHighways.filter((h) => task.tags.some((tag) => h.path.includes(tag)))

  const [hypotheses, skillAudit] = await Promise.all([
    task.id && net?.recall ? net.recall(task.id).catch(() => []) : Promise.resolve([]),
    auditSkills(task.tags, { requesterUid: task.requesterUid }),
  ])

  const WAVE_M: Record<string, string> = { W1: 'haiku', W2: 'opus', W3: 'sonnet', W4: 'sonnet' }
  const EFFORT_M: Record<string, string> = { low: 'haiku', medium: 'sonnet', high: 'opus' }
  const model = (task.wave && WAVE_M[task.wave]) || (task.effort && EFFORT_M[task.effort]) || 'sonnet'
  return {
    docs,
    hypotheses,
    highways,
    skillAudit,
    exit: task.exit,
    unblocks: task.blocks,
    model,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INDEX — List all docs
// ═══════════════════════════════════════════════════════════════════════════

export interface DocMeta {
  name: string
  title: string
  description: string
  lines: number
}

/** Extract first heading and first paragraph from markdown */
const extractMeta = (content: string, name: string): DocMeta => {
  const lines = content.split('\n')
  const titleLine = lines.find((l) => l.startsWith('# '))
  const title = titleLine?.slice(2).trim() || name.replace('.md', '')

  // Find first non-empty, non-heading, non-code line
  let description = ''
  let inCode = false
  for (const line of lines) {
    if (line.startsWith('```')) inCode = !inCode
    if (inCode) continue
    if (line.startsWith('#')) continue
    if (line.trim() && !line.startsWith('|') && !line.startsWith('-')) {
      description = line.trim().slice(0, 100)
      break
    }
  }

  return { name, title, description, lines: lines.length }
}

/** Get index of all bundled docs */
export const docIndex = (): DocMeta[] => {
  return Object.keys(DOC_MAP)
    .filter((name) => !name.startsWith('TODO') && !name.startsWith('PLAN'))
    .map((name) => {
      const content = DOC_MAP[name]
      return content ? extractMeta(content, name) : null
    })
    .filter((d): d is DocMeta => d !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ═══════════════════════════════════════════════════════════════════════════
// INGEST — Docs → TypeDB knowledge
// ═══════════════════════════════════════════════════════════════════════════

const escapeStr = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')

/** Extract core patterns from a doc */
const extractPatterns = (content: string): string[] => {
  const patterns: string[] = []

  // Extract code blocks with key patterns
  const codeRegex = /```(?:typescript|tql|)?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  while ((match = codeRegex.exec(content)) !== null) {
    const code = match[1].trim()
    // Keep short, meaningful code blocks
    if (code.length > 20 && code.length < 500 && !code.includes('node_modules')) {
      patterns.push(code)
    }
  }

  // Extract table rows as patterns
  const tableRegex = /^\|([^|]+)\|([^|]+)\|/gm
  while ((match = tableRegex.exec(content)) !== null) {
    const [_, col1, col2] = match
    if (col1 && col2 && !col1.includes('---')) {
      patterns.push(`${col1.trim()}: ${col2.trim()}`)
    }
  }

  return patterns.slice(0, 10) // Top 10 patterns per doc
}

/** Ingest all docs as confirmed hypotheses in TypeDB */
export const ingestDocs = async (): Promise<number> => {
  const docs = docIndex()
  let count = 0

  for (const doc of docs) {
    const content = readDoc(doc.name)
    if (!content) continue

    const _patterns = extractPatterns(content)
    const hid = `doc:${doc.name.replace('.md', '')}`

    // Upsert hypothesis for this doc
    const statement = `${doc.title}: ${doc.description}`

    try {
      await writeSilent(`
        match $h isa hypothesis, has hid "${hid}";
        delete $h;
      `).catch(() => {}) // Ignore if doesn't exist

      await writeSilent(`
        insert $h isa hypothesis,
          has hid "${hid}",
          has statement "${escapeStr(statement)}",
          has hypothesis-status "confirmed",
          has observations-count ${doc.lines},
          has p-value 0.01,
          has action-ready true;
      `)
      count++
    } catch (_e) {
      // Silent fail for individual docs
    }
  }

  return count
}

/** Recall docs matching a query from TypeDB */
export const recallDocs = async (query?: string): Promise<{ hid: string; statement: string }[]> => {
  // For now, just return from memory. TypeDB recall would go here.
  const docs = docIndex()
  const results = docs
    .filter((d) => !query || d.name.includes(query) || d.title.toLowerCase().includes(query.toLowerCase()))
    .map((d) => ({
      hid: `doc:${d.name.replace('.md', '')}`,
      statement: `${d.title}: ${d.description}`,
    }))
  return results
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  readDoc,
  loadContext,
  contextForSkill,
  docIndex,
  ingestDocs,
  recallDocs,
  CANONICAL,
}
