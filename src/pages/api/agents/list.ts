/**
 * GET /api/agents/list — Scan agent markdown files, return parsed specs
 *
 * Returns all agents from agents/ directory with frontmatter metadata.
 * Groups agents by their `group` field for cluster display.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { APIRoute } from 'astro'

interface AgentSummary {
  id: string
  name: string
  group: string
  model: string
  tags: string[]
  skills: { name: string; price: number; tags: string[] }[]
  channels: string[]
  sensitivity: number
  promptPreview: string
}

/** Parse YAML-ish frontmatter without a full YAML parser */
function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }

  const meta: Record<string, unknown> = {}
  const lines = match[1].split('\n')
  let currentKey = ''
  let inArray = false
  let arrayItems: unknown[] = []

  for (const line of lines) {
    // Inline array: key: [a, b, c]
    const inlineMatch = line.match(/^(\w[\w-]*):\s*\[([^\]]*)\]/)
    if (inlineMatch) {
      if (inArray && currentKey) {
        meta[currentKey] = arrayItems
        inArray = false
        arrayItems = []
      }
      meta[inlineMatch[1]] = inlineMatch[2].split(',').map((s) => s.trim())
      currentKey = inlineMatch[1]
      continue
    }

    // Key: value
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.+)/)
    if (kvMatch) {
      if (inArray && currentKey) {
        meta[currentKey] = arrayItems
        inArray = false
        arrayItems = []
      }
      const val = kvMatch[2].trim()
      meta[kvMatch[1]] =
        val === 'true' ? true : val === 'false' ? false : Number.isFinite(Number(val)) ? Number(val) : val
      currentKey = kvMatch[1]
      continue
    }

    // Key with no value (start of block)
    const blockMatch = line.match(/^(\w[\w-]*):$/)
    if (blockMatch) {
      if (inArray && currentKey) {
        meta[currentKey] = arrayItems
      }
      currentKey = blockMatch[1]
      inArray = false
      arrayItems = []
      continue
    }

    // Array item: - value or - name: value (skills)
    const arrayItemMatch = line.match(/^\s+-\s+(.+)/)
    if (arrayItemMatch && currentKey) {
      inArray = true
      arrayItems.push(arrayItemMatch[1].trim())
      continue
    }

    // Sub-key in array object: key: value (indented under -)
    if (inArray && line.match(/^\s+\w/)) {
      const subKv = line.match(/^\s+(\w[\w-]*):\s*(.+)/)
      if (subKv && arrayItems.length > 0) {
        const last = arrayItems[arrayItems.length - 1]
        if (typeof last === 'string') {
          // Convert "name: X" string to object
          const nameMatch = last.match(/^name:\s*(.+)/)
          if (nameMatch) {
            arrayItems[arrayItems.length - 1] = { name: nameMatch[1].trim(), [subKv[1]]: subKv[2].trim() }
          }
        } else if (typeof last === 'object' && last !== null) {
          const val = subKv[2].trim()
          // Handle inline arrays in sub-objects
          const subInline = val.match(/^\[([^\]]*)\]$/)
          if (subInline) {
            ;(last as Record<string, unknown>)[subKv[1]] = subInline[1].split(',').map((s) => s.trim())
          } else {
            ;(last as Record<string, unknown>)[subKv[1]] = Number.isFinite(Number(val)) ? Number(val) : val
          }
        }
      }
    }
  }

  if (inArray && currentKey) {
    meta[currentKey] = arrayItems
  }

  return { meta, body: match[2] }
}

async function scanAgents(baseDir: string): Promise<AgentSummary[]> {
  const agents: AgentSummary[] = []

  async function scanDir(dir: string, group: string) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await scanDir(fullPath, entry.name)
      } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
        const content = await readFile(fullPath, 'utf-8').catch(() => '')
        if (!content) continue
        const { meta, body } = parseFrontmatter(content)
        if (!meta.name) continue

        const skills = Array.isArray(meta.skills)
          ? (meta.skills as unknown[]).map((s) => {
              if (typeof s === 'object' && s !== null) {
                const obj = s as Record<string, unknown>
                return {
                  name: String(obj.name || ''),
                  price: Number(obj.price) || 0,
                  tags: Array.isArray(obj.tags) ? (obj.tags as string[]) : [],
                }
              }
              return { name: String(s), price: 0, tags: [] as string[] }
            })
          : []

        // Collect all tags: explicit tags + skill tags + group
        const explicitTags = Array.isArray(meta.tags) ? (meta.tags as string[]) : []
        const skillTags = skills.flatMap((s) => s.tags)
        const allTags = [...new Set([...explicitTags, ...skillTags])]

        const agentGroup = String(meta.group || group || 'standalone')

        agents.push({
          id: `${agentGroup !== 'standalone' ? `${agentGroup}:` : ''}${meta.name}`,
          name: String(meta.name),
          group: agentGroup,
          model: String(meta.model || 'default'),
          tags: allTags,
          skills,
          channels: Array.isArray(meta.channels) ? (meta.channels as string[]) : [],
          sensitivity: Number(meta.sensitivity) || 0.5,
          promptPreview: body.trim().slice(0, 200).replace(/\n/g, ' '),
        })
      }
    }
  }

  await scanDir(baseDir, '')
  return agents.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
}

export const GET: APIRoute = async () => {
  const agentsDir = join(process.cwd(), 'agents')
  const agents = await scanAgents(agentsDir)

  // Build group index
  const groups = new Map<string, AgentSummary[]>()
  for (const a of agents) {
    const list = groups.get(a.group) || []
    list.push(a)
    groups.set(a.group, list)
  }

  // Collect all unique tags
  const allTags = [...new Set(agents.flatMap((a) => a.tags))].sort()

  return Response.json({
    agents,
    groups: Object.fromEntries(groups),
    tags: allTags,
    count: agents.length,
  })
}
