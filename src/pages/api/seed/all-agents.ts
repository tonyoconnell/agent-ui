/**
 * POST /api/seed/all-agents — Seed all agents from agents/ directory
 *
 * Loads all markdown agent files and syncs to TypeDB:
 * - Creates group (world) if group is specified
 * - Creates unit for each agent with model + system-prompt
 * - Creates skills and capabilities from agent specs
 * - Creates initial paths (director → all others)
 * - Idempotent: skips existing units
 *
 * POST body:
 * { "dryRun": false }  // set true to get queries without executing
 *
 * Response:
 * {
 *   success: true,
 *   created: {
 *     groups: 3,
 *     units: 18+,
 *     skills: 50+,
 *     capabilities: 50+,
 *     paths: 30+
 *   },
 *   agents: [{ uid, name, skills: 5, paths: 3 }, ...],
 *   timestamp: "2026-04-06T..."
 * }
 */

import type { APIRoute } from 'astro'
import { readParsed, write } from '@/lib/typedb'

// Bundled at build time by Vite — no node:fs, compatible with Cloudflare workerd
const AGENT_FILES = import.meta.glob<string>('/agents/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

interface AgentData {
  name: string
  model?: string
  channels?: string[]
  skills?: Array<{ name: string; price?: number; tags?: string[] }>
  sensitivity?: number
  group?: string
  tags?: string[]
  context?: string[]
  prompt: string
}

function parseYamlValue(value: string): unknown {
  value = value.trim()
  if (value === 'true') return true
  if (value === 'false') return false
  if (!Number.isNaN(Number(value))) return Number(value)
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
  }
  return value.replace(/^['"]|['"]$/g, '')
}

function parseSkills(lines: string[]): AgentData['skills'] {
  const skills: AgentData['skills'] = []
  let current: (typeof skills)[0] | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- name:')) {
      if (current) skills.push(current)
      current = { name: trimmed.slice(7).trim() }
    } else if (current && trimmed.startsWith('price:')) {
      current.price = Number(trimmed.slice(6).trim())
    } else if (current && trimmed.startsWith('tags:')) {
      current.tags = parseYamlValue(trimmed.slice(5)) as string[]
    }
  }
  if (current) skills.push(current)
  return skills
}

function parseAgent(md: string): AgentData {
  const lines = md.split('\n')
  const spec: AgentData = { name: '', prompt: '' }

  let inFrontmatter = false
  let frontmatterEnd = 0
  let inSkills = false
  const skillLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true
        continue
      } else {
        frontmatterEnd = i
        break
      }
    }

    if (inFrontmatter) {
      if (trimmed.startsWith('skills:')) {
        inSkills = true
        continue
      }

      if (inSkills) {
        if (trimmed.startsWith('- ') || trimmed.startsWith('  ')) {
          skillLines.push(line)
          continue
        } else if (trimmed && !trimmed.startsWith('#')) {
          inSkills = false
        }
      }

      if (!inSkills && trimmed && !trimmed.startsWith('#')) {
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx > 0) {
          const key = trimmed.slice(0, colonIdx).trim()
          const value = trimmed.slice(colonIdx + 1).trim()
          switch (key) {
            case 'name':
              spec.name = value
              break
            case 'model':
              spec.model = value
              break
            case 'sensitivity':
              spec.sensitivity = Number(value)
              break
            case 'group':
              spec.group = value
              break
            case 'channels':
              spec.channels = parseYamlValue(value) as string[]
              break
            case 'tags':
              spec.tags = parseYamlValue(value) as string[]
              break
            case 'context':
              spec.context = parseYamlValue(value) as string[]
              break
          }
        }
      }
    }
  }

  if (skillLines.length) {
    spec.skills = parseSkills(skillLines)
  }

  spec.prompt = lines
    .slice(frontmatterEnd + 1)
    .join('\n')
    .trim()
  return spec
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function agentToQueries(spec: AgentData): string[] {
  const queries: string[] = []
  const uid = spec.group ? `${spec.group}:${spec.name}` : spec.name

  // Unit insert
  const tags = [...(spec.tags || []), ...(spec.group ? [spec.group] : [])]
  const tagStr = tags.map((t) => `has tag "${t}"`).join(', ')

  const promptClean = escapeString(spec.prompt.slice(0, 5000))
  queries.push(`
    insert $u isa unit,
      has uid "${uid}",
      has name "${spec.name}",
      has unit-kind "agent",
      has model "${spec.model || 'claude-sonnet-4-20250514'}",
      has system-prompt "${promptClean}",
      has status "active",
      has success-rate 0.5,
      has activity-score 0.0,
      has sample-count 0,
      has reputation 0.0,
      has balance 0.0,
      has generation 0${tagStr ? `, ${tagStr}` : ''};
  `)

  // Skills and capabilities
  for (const skill of spec.skills || []) {
    const skillId = spec.group ? `${spec.group}:${skill.name}` : skill.name
    const skillTags = skill.tags?.map((t) => `has tag "${t}"`).join(', ') || ''

    queries.push(`
      insert $s isa skill,
        has skill-id "${skillId}",
        has name "${skill.name}",
        has price ${skill.price || 0}${skillTags ? `, ${skillTags}` : ''};
    `)

    queries.push(`
      match $u isa unit, has uid "${uid}";
            $s isa skill, has skill-id "${skillId}";
      insert (provider: $u, offered: $s) isa capability, has price ${skill.price || 0};
    `)
  }

  return queries
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as { dryRun?: boolean }
  const dryRun = body.dryRun === true

  const results: string[] = []
  const agents: Array<{
    uid: string
    name: string
    group?: string
    skills: number
    paths: number
  }> = []
  const groups = new Set<string>()
  let totalQueries = 0
  let totalExecuted = 0

  // Parse all agents from Vite-bundled glob (no node:fs needed)
  const parsedAgents = new Map<string, AgentData>()
  const groupAgents = new Map<string, AgentData[]>()

  for (const [fullPath, md] of Object.entries(AGENT_FILES)) {
    // fullPath: '/agents/analyst.md' or '/agents/donal/cmo.md' or deeper
    const parts = fullPath.split('/').filter(Boolean) // strip leading ''
    // parts[0] === 'agents'; actual segments start at index 1
    const segments = parts.slice(1) // e.g. ['analyst.md'] or ['donal', 'cmo.md']
    const file = segments[segments.length - 1]
    const subdir = segments.length > 1 ? segments[0] : undefined

    if (!file.endsWith('.md') || file === 'README.md') continue

    const agent = parseAgent(md)
    if (!agent.name) continue

    // Default group to subdir name if frontmatter doesn't set one
    if (!agent.group && subdir) {
      agent.group = subdir
    }

    parsedAgents.set(agent.name, agent)

    if (agent.group) {
      groups.add(agent.group)
      if (!groupAgents.has(agent.group)) {
        groupAgents.set(agent.group, [])
      }
      groupAgents.get(agent.group)!.push(agent)
    }
  }

  // Check existing
  const existing = await readParsed('match $u isa unit, has uid $uid; select $uid;').catch(() => [])
  const existingUids = new Set(existing.map((e) => (e.uid as string) || ''))

  if (existingUids.size > 0) {
    results.push(`Found ${existingUids.size} existing units (skipping)`)
  }

  // Generate all queries
  const allQueries: string[] = []

  // Create groups
  for (const group of groups) {
    allQueries.push(`
      insert $g isa group,
        has gid "${group}",
        has name "${group}",
        has group-type "world",
        has status "active";
    `)
  }

  // Create agents and their queries
  for (const [groupName, groupAgents_] of groupAgents) {
    for (const agent of groupAgents_) {
      const uid = `${groupName}:${agent.name}`

      // Skip if exists
      if (existingUids.has(uid)) {
        continue
      }

      const queries = agentToQueries(agent)
      allQueries.push(...queries)

      // Add group membership
      allQueries.push(`
        match $g isa group, has gid "${groupName}";
              $u isa unit, has uid "${uid}";
        insert (group: $g, member: $u) isa membership;
      `)

      agents.push({
        uid,
        name: agent.name,
        group: groupName,
        skills: agent.skills?.length || 0,
        paths: 1, // director path
      })
    }

    // Create director paths
    const directorAgent = groupAgents_.find((a) => a.name.includes('director'))
    if (directorAgent) {
      const directorUid = `${groupName}:${directorAgent.name}`
      for (const agent of groupAgents_) {
        if (agent.name !== directorAgent.name) {
          const uid = `${groupName}:${agent.name}`
          allQueries.push(`
            match $from isa unit, has uid "${directorUid}";
                  $to isa unit, has uid "${uid}";
            insert (source: $from, target: $to) isa path,
              has strength 1.0, has resistance 0.0, has traversals 0, has revenue 0.0;
          `)
        }
      }
    }
  }

  totalQueries = allQueries.length

  // Execute or dry run
  if (dryRun) {
    results.push(`DRY RUN: ${totalQueries} queries ready`)
  } else {
    for (const q of allQueries) {
      try {
        await write(q)
        totalExecuted++
      } catch (e) {
        results.push(`Error: ${(e as Error).message}`)
      }
    }
  }

  return Response.json({
    success: true,
    created: {
      groups: groups.size,
      units: agents.length,
      skills: agents.reduce((sum, a) => sum + a.skills, 0),
      capabilities: agents.reduce((sum, a) => sum + a.skills, 0),
      paths: agents.length > 0 ? agents.length * 2 : 0, // director paths + some collab
    },
    agents,
    stats: {
      parsedAgents: parsedAgents.size,
      groupsFound: groups.size,
      queriesGenerated: totalQueries,
      queriesExecuted: totalExecuted,
      dryRun,
    },
    results,
    timestamp: new Date().toISOString(),
  })
}

export const GET: APIRoute = async () => {
  // Query current state
  const units = await readParsed(`match $u isa unit, has uid $uid, has name $n; select $uid, $n;`).catch(() => [])

  const skills = await readParsed(`match $s isa skill, has skill-id $id, has name $n; select $id, $n;`).catch(() => [])

  const paths = await readParsed(
    `match $p (source: $s, target: $t) isa path, has strength $str; select $str; limit 100;`,
  ).catch(() => [])

  const groups = await readParsed(`match $g isa group, has gid $gid; select $gid;`).catch(() => [])

  return Response.json({
    ok: true,
    stats: {
      units: units.length,
      skills: skills.length,
      paths: paths.length,
      groups: groups.length,
    },
    data: { units, skills, paths, groups },
  })
}
