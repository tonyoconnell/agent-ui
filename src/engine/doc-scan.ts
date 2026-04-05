/**
 * DOC-SCAN — Extract actionable items from docs/
 *
 * Scans markdown files for TODOs, gaps, unchecked items, and "next steps" sections.
 * Returns structured items ready for TypeDB sync.
 *
 * Each item becomes a skill in TypeDB. Tags come from source doc + section context.
 * Pheromone ranks them. TODO.md becomes a view of TypeDB state.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, basename } from 'node:path'

export interface DocItem {
  id: string            // slug for skill-id
  name: string          // human-readable name
  source: string        // source file (e.g., "gaps", "TODO", "plan")
  section: string       // section heading where found
  tags: string[]        // inferred tags
  done: boolean         // checked checkbox
  priority: Priority    // inferred from section/context
  line: number          // line number in source file
  raw: string           // original text
}

type Priority = 'P0' | 'P1' | 'P2' | 'P3'

// Priority inference from section headings
const PRIORITY_MAP: Record<string, Priority> = {
  'critical': 'P0',
  'unblock': 'P0',
  'high': 'P1',
  'make it real': 'P1',
  'medium': 'P2',
  'engine quality': 'P2',
  'low': 'P3',
  'later': 'P3',
  'visual polish': 'P3',
  'scale': 'P3',
}

// Tag inference from keywords in item text
const TAG_KEYWORDS: Record<string, string[]> = {
  'build':      ['deploy', 'worker', 'wrangler', 'cloudflare', 'migration', 'schema', 'build'],
  'ui':         ['ui', 'panel', 'node', 'edge', 'graph', 'reactflow', 'visual', 'color', 'badge', 'keyboard'],
  'engine':     ['routing', 'fade', 'decay', 'evolution', 'evolve', 'pheromone', 'loop', 'highway', 'strength'],
  'commerce':   ['payment', 'escrow', 'x402', 'sui', 'revenue', 'price', 'marketplace'],
  'typedb':     ['typedb', 'tql', 'schema', 'query', 'knowledge', 'hypothesis'],
  'agent':      ['agent', 'llm', 'prompt', 'model', 'nanoclaw', 'telegram', 'channel'],
  'security':   ['auth', 'identity', 'token', 'credential', 'security', 'toxic'],
  'marketing':  ['seo', 'content', 'social', 'signup', 'campaign', 'blog'],
  'infra':      ['deploy', 'worker', 'cron', 'sync', 'gateway', 'cloudflare', 'kv', 'd1'],
}

/** Slugify text into a skill-id */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

/** Infer tags from item text */
function inferTags(text: string, source: string): string[] {
  const lower = text.toLowerCase()
  const tags = new Set<string>()
  tags.add(source) // always tag with source doc name

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      tags.add(tag)
    }
  }
  return [...tags]
}

/** Infer priority from section heading */
function inferPriority(section: string): Priority {
  const lower = section.toLowerCase()
  for (const [keyword, priority] of Object.entries(PRIORITY_MAP)) {
    if (lower.includes(keyword)) return priority
  }
  return 'P2' // default
}

/** Extract items from a single markdown file */
function extractItems(content: string, filename: string): DocItem[] {
  const source = basename(filename, '.md').toLowerCase().replace(/\s+/g, '-')
  const lines = content.split('\n')
  const items: DocItem[] = []
  let currentSection = 'root'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track section headings
    const headingMatch = line.match(/^#{1,4}\s+(.+)/)
    if (headingMatch) {
      currentSection = headingMatch[1].replace(/[*_`]/g, '').trim()
      continue
    }

    // Checkbox items: - [ ] or - [x]
    const checkboxMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)/)
    if (checkboxMatch) {
      const done = checkboxMatch[1] !== ' '
      const text = checkboxMatch[2].replace(/\*\*/g, '').replace(/`/g, '').trim()
      // Strip trailing code blocks or explanatory text after " — "
      const name = text.split(' — ')[0].split(' (')[0].trim()
      const id = `${source}-${slugify(name)}`

      items.push({
        id,
        name,
        source,
        section: currentSection,
        tags: [...inferTags(text, source), inferPriority(currentSection)],
        done,
        priority: inferPriority(currentSection),
        line: i + 1,
        raw: text,
      })
      continue
    }

    // Gap items: "Gap N: ..." or "**Gap N: ...**"
    const gapMatch = line.match(/\*?\*?Gap\s+(\d+):\s*(.+?)\*?\*?\s*[—-]/)
    if (gapMatch) {
      const name = gapMatch[2].replace(/\*\*/g, '').trim()
      const id = `${source}-gap-${gapMatch[1]}`

      items.push({
        id,
        name: `Gap ${gapMatch[1]}: ${name}`,
        source,
        section: currentSection,
        tags: [...inferTags(name, source), 'gap', 'P0'],
        done: false,
        priority: 'P0',
        line: i + 1,
        raw: line.trim(),
      })
    }
  }

  return items
}

/** Scan all docs/ and extract items */
export async function scanDocs(docsDir: string): Promise<DocItem[]> {
  const files = await readdir(docsDir)
  const mdFiles = files.filter(f => f.endsWith('.md'))
  const allItems: DocItem[] = []
  const seenIds = new Set<string>()

  for (const file of mdFiles) {
    const content = await readFile(join(docsDir, file), 'utf-8')
    const items = extractItems(content, file)

    for (const item of items) {
      // Deduplicate by id
      if (seenIds.has(item.id)) {
        // Prefer higher priority duplicate
        const existing = allItems.find(i => i.id === item.id)
        if (existing && item.priority < existing.priority) {
          Object.assign(existing, item)
        }
        continue
      }
      seenIds.add(item.id)
      allItems.push(item)
    }
  }

  return allItems
}

/** Group items by priority */
export function groupByPriority(items: DocItem[]): Record<Priority, DocItem[]> {
  const groups: Record<Priority, DocItem[]> = { P0: [], P1: [], P2: [], P3: [] }
  for (const item of items) {
    groups[item.priority].push(item)
  }
  return groups
}

/** Render items as TODO.md content, with optional TypeDB pheromone data */
export function renderTodo(
  items: DocItem[],
  pheromone?: Map<string, { strength: number; resistance: number }>
): string {
  const groups = groupByPriority(items)
  const open = items.filter(i => !i.done)
  const done = items.filter(i => i.done)

  let md = `# TODO\n\n`
  md += `> ONE Substrate: Markdown agents, TypeDB brain, Cloudflare edge, weight-based routing.\n`
  md += `> Synced from docs/ → TypeDB. ${open.length} open, ${done.length} done.\n\n---\n\n`

  const sectionNames: Record<Priority, string> = {
    P0: 'CRITICAL — Unblock Live Agents',
    P1: 'HIGH — Make It Real',
    P2: 'MEDIUM — Engine Quality',
    P3: 'LOW — Visual Polish & Later',
  }

  for (const priority of ['P0', 'P1', 'P2', 'P3'] as Priority[]) {
    const group = groups[priority].filter(i => !i.done)
    if (group.length === 0) continue

    md += `## ${sectionNames[priority]}\n\n`

    // Sort by pheromone strength (descending) if available
    if (pheromone) {
      group.sort((a, b) => {
        const pa = pheromone.get(a.id)
        const pb = pheromone.get(b.id)
        const sa = pa ? pa.strength - pa.resistance : 0
        const sb = pb ? pb.strength - pb.resistance : 0
        return sb - sa
      })
    }

    for (const item of group) {
      const p = pheromone?.get(item.id)
      const weight = p ? ` [w:${(p.strength - p.resistance).toFixed(1)}]` : ''
      const tags = item.tags.filter(t => !['P0','P1','P2','P3'].includes(t)).join(', ')
      md += `- [ ] **${item.name}**${weight} — ${item.raw !== item.name ? item.raw : `(${item.source})`}`
      if (tags) md += ` \`${tags}\``
      md += `\n`
    }
    md += `\n---\n\n`
  }

  // Done section
  if (done.length > 0) {
    md += `## Done\n\n`
    for (const item of done) {
      md += `- [x] **${item.name}** — ${item.source}\n`
    }
    md += `\n`
  }

  // Summary
  md += `---\n\n## Summary\n\n`
  md += `\`\`\`\n`
  md += `Open:  ${open.length} (P0: ${groups.P0.filter(i=>!i.done).length}, P1: ${groups.P1.filter(i=>!i.done).length}, P2: ${groups.P2.filter(i=>!i.done).length}, P3: ${groups.P3.filter(i=>!i.done).length})\n`
  md += `Done:  ${done.length}\n`
  md += `Total: ${items.length}\n`
  md += `\`\`\`\n`

  return md
}
