/**
 * Agent MD — Parse markdown agents, sync to TypeDB
 *
 * Format:
 *   ---
 *   name: creative
 *   model: claude-sonnet-4-20250514
 *   channels: [telegram, discord]
 *   skills:
 *     - name: copy
 *       price: 0.02
 *       tags: [creative, copy]
 *   sensitivity: 0.6
 *   group: marketing
 *   ---
 *
 *   You are the Creative Director...
 *
 * Markdown → AgentSpec → TypeDB inserts
 * Markdown → AgentSpec → Runtime unit
 */

import { addressFor, createUnit as createUnitOnChain, registerTask as registerTaskOnChain } from '@/lib/sui'
import { readParsed, write, writeSilent } from '@/lib/typedb'
import { loadContext } from './context'
import type { PersistentWorld } from './persist'
import type { World } from './world'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SkillSpec {
  name: string
  price?: number
  tags?: string[]
  description?: string
}

export interface AgentSpec {
  name: string
  model?: string
  channels?: string[]
  skills?: SkillSpec[]
  sensitivity?: number
  group?: string
  tags?: string[]
  context?: string[] // docs to load as knowledge: ['routing', 'dsl']
  aliases?: Record<string, string> // skin → alias mapping: {ant: "scout-7", brain: "neuron-α12", ...}
  prompt: string
  // Sui identity (derived on sync, not from markdown)
  wallet?: string // Sui address
  suiObjectId?: string // on-chain Unit object ID
}

export interface WorldSpec {
  name: string
  description?: string
  agents: AgentSpec[]
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSE — Frontmatter YAML + Markdown body
// ═══════════════════════════════════════════════════════════════════════════

const parseYamlValue = (value: string): unknown => {
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

const parseSkills = (lines: string[]): SkillSpec[] => {
  const skills: SkillSpec[] = []
  let current: SkillSpec | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- name:')) {
      if (current) skills.push(current)
      current = { name: trimmed.slice(7).trim() }
    } else if (current && trimmed.startsWith('price:')) {
      current.price = Number(trimmed.slice(6).trim())
    } else if (current && trimmed.startsWith('tags:')) {
      current.tags = parseYamlValue(trimmed.slice(5)) as string[]
    } else if (current && trimmed.startsWith('description:')) {
      current.description = trimmed.slice(12).trim()
    }
  }
  if (current) skills.push(current)
  return skills
}

const _parseAliases = (lines: string[]): Record<string, string> | undefined => {
  const aliases: Record<string, string> = {}
  let inAliases = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('aliases:')) {
      inAliases = true
      continue
    }

    if (inAliases) {
      // Stop when we hit a non-indented key at the root level
      if (line.match(/^\s/) || trimmed.startsWith('-')) {
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx > 0) {
          const key = trimmed.slice(0, colonIdx).trim()
          const value = trimmed
            .slice(colonIdx + 1)
            .trim()
            .replace(/^['"]|['"]$/g, '')
          aliases[key] = value
        }
      } else if (trimmed && !trimmed.startsWith('#')) {
        // Stop at next root-level key
        break
      }
    }
  }

  return Object.keys(aliases).length ? aliases : undefined
}

export const parse = (md: string): AgentSpec => {
  const lines = md.split('\n')
  const spec: AgentSpec = { name: '', prompt: '' }

  // Find frontmatter boundaries
  let inFrontmatter = false
  let frontmatterEnd = 0
  let inSkills = false
  let inAliases = false
  const skillLines: string[] = []
  const aliasLines: string[] = []

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
        inAliases = false
        continue
      }

      if (trimmed.startsWith('aliases:')) {
        inAliases = true
        inSkills = false
        continue
      }

      if (inSkills) {
        // Collect all indented lines (- name: or key: value pairs under skills)
        if (line.match(/^\s/) || trimmed.startsWith('- ')) {
          skillLines.push(line)
          continue
        } else if (trimmed && !trimmed.startsWith('#')) {
          // Stop skills section only when we hit a non-indented key
          inSkills = false
        }
      }

      if (inAliases) {
        // Collect all indented lines under aliases
        if (line.match(/^\s/) && trimmed && !trimmed.startsWith('#')) {
          aliasLines.push(line)
          continue
        } else if (trimmed && !trimmed.startsWith('#')) {
          // Stop aliases section at next root-level key
          inAliases = false
        }
      }

      if (!inSkills && !inAliases && trimmed && !trimmed.startsWith('#')) {
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

  // Parse skills
  if (skillLines.length) {
    spec.skills = parseSkills(skillLines)
  }

  // Parse aliases
  if (aliasLines.length) {
    const aliases: Record<string, string> = {}
    for (const line of aliasLines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx > 0) {
          const key = trimmed.slice(0, colonIdx).trim()
          const value = trimmed
            .slice(colonIdx + 1)
            .trim()
            .replace(/^['"]|['"]$/g, '')
          aliases[key] = value
        }
      }
    }
    if (Object.keys(aliases).length) {
      spec.aliases = aliases
    }
  }

  // Rest is prompt
  spec.prompt = lines
    .slice(frontmatterEnd + 1)
    .join('\n')
    .trim()

  return spec
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPEDB — Generate inserts from AgentSpec
// ═══════════════════════════════════════════════════════════════════════════

const escapeString = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export const toTypeDB = (spec: AgentSpec): string[] => {
  const queries: string[] = []
  const uid = spec.group ? `${spec.group}:${spec.name}` : spec.name

  // Unit insert
  const tags = [...(spec.tags || []), ...(spec.group ? [spec.group] : [])]
  const tagStr = tags.map((t) => `has tag "${t}"`).join(', ')
  const aliasStr = spec.aliases
    ? Object.entries(spec.aliases)
        .map(([skin, value]) => `has alias-${skin} "${escapeString(value)}"`)
        .join(', ')
    : ''

  queries.push(`
    insert $u isa unit,
      has uid "${uid}",
      has name "${spec.name}",
      has unit-kind "agent",
      has model "${spec.model || 'claude-sonnet-4-20250514'}",
      has system-prompt "${escapeString(spec.prompt.slice(0, 10000))}",
      has status "active",
      has success-rate 0.5,
      has activity-score 0.0,
      has sample-count 0,
      has reputation 0.0,
      has balance 0.0,
      has generation 0${spec.wallet ? `, has wallet "${spec.wallet}"` : ''}${tagStr ? `, ${tagStr}` : ''}${aliasStr ? `, ${aliasStr}` : ''};
  `)

  // Group membership
  if (spec.group) {
    queries.push(`
      match $g isa group, has gid "${spec.group}";
            $u isa unit, has uid "${uid}";
      insert (group: $g, member: $u) isa membership, has joined-at ${new Date().toISOString().replace('Z', '')};
    `)
  }

  // Skills and capabilities
  for (const skill of spec.skills || []) {
    const skillId = spec.group ? `${spec.group}:${skill.name}` : skill.name
    const skillTags = skill.tags?.map((t) => `has tag "${t}"`).join(', ') || ''

    // Insert skill (if not exists, using match-not-insert pattern)
    queries.push(`
      insert $s isa skill,
        has skill-id "${skillId}",
        has name "${skill.name}",
        has price ${skill.price || 0}${skill.description ? `, has description "${escapeString(skill.description)}"` : ''}${skillTags ? `, ${skillTags}` : ''};
    `)

    // Capability relation
    queries.push(`
      match $u isa unit, has uid "${uid}";
            $s isa skill, has skill-id "${skillId}";
      insert (provider: $u, offered: $s) isa capability, has price ${skill.price || 0};
    `)
  }

  return queries
}

export const worldToTypeDB = (spec: WorldSpec): string[] => {
  const queries: string[] = []

  // Create the group
  queries.push(`
    insert $g isa group,
      has gid "${spec.name}",
      has name "${spec.name}",
      has group-type "world",
      has status "active"${spec.description ? `, has purpose "${escapeString(spec.description)}"` : ''};
  `)

  // Add all agents
  for (const agent of spec.agents) {
    agent.group = spec.name
    queries.push(...toTypeDB(agent))
  }

  // Create initial paths (all agents connect to director if exists)
  const director = spec.agents.find((a) => a.name.includes('director'))
  if (director) {
    for (const agent of spec.agents) {
      if (agent.name !== director.name) {
        queries.push(`
          match $from isa unit, has uid "${spec.name}:${director.name}";
                $to isa unit, has uid "${spec.name}:${agent.name}";
          insert (source: $from, target: $to) isa path,
            has strength 1.0, has resistance 0.0, has traversals 0, has revenue 0.0;
        `)
      }
    }
  }

  return queries
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC — Write to TypeDB
// ═══════════════════════════════════════════════════════════════════════════

export const syncAgent = async (spec: AgentSpec): Promise<void> => {
  const queries = toTypeDB(spec)
  for (const q of queries) {
    await write(q).catch((e) => console.warn('TypeDB insert:', e.message))
  }
}

/**
 * Sync agent to both TypeDB AND Sui.
 * The agent derives its own keypair and signs its existence into being.
 *
 * Flow: markdown → parse → deriveKeypair(uid) → create_unit() on Sui → TypeDB (with wallet)
 *
 * Returns the spec with wallet + suiObjectId populated.
 * Falls back to TypeDB-only if Sui is not configured or fails.
 */
export const syncAgentWithIdentity = async (spec: AgentSpec): Promise<AgentSpec> => {
  const uid = spec.group ? `${spec.group}:${spec.name}` : spec.name

  // Step 1: Derive wallet address (always, even if Sui publish fails)
  try {
    spec.wallet = await addressFor(uid)
  } catch {
    // SUI_SEED not configured — skip Sui identity
  }

  // Step 2: Sync to TypeDB (includes wallet if derived)
  await syncAgent(spec)

  // Step 3: Create on-chain Unit (if Sui is configured)
  if (spec.wallet) {
    try {
      const { objectId, address } = await createUnitOnChain(uid, spec.name, 'agent')
      spec.suiObjectId = objectId
      spec.wallet = address

      // Store Sui object ID back in TypeDB
      await writeSilent(`
        match $u isa unit, has uid "${uid}";
        delete $u has wallet $old;
        insert $u has wallet "${address}";
      `).catch(() =>
        writeSilent(`
          match $u isa unit, has uid "${uid}";
          insert $u has wallet "${address}";
        `),
      )

      // Register skills on-chain
      if (spec.skills?.length && objectId) {
        for (const skill of spec.skills) {
          await registerTaskOnChain(uid, objectId, skill.name).catch(() => {})
        }
      }
    } catch (e) {
      // Sui not deployed or network issue — TypeDB sync still succeeded
      console.warn('Sui sync skipped:', e instanceof Error ? e.message : 'unknown')
    }
  }

  return spec
}

export const syncWorld = async (spec: WorldSpec): Promise<void> => {
  const queries = worldToTypeDB(spec)
  for (const q of queries) {
    await write(q).catch((e) => console.warn('TypeDB insert:', e.message))
  }
}

export const syncFromMarkdown = async (md: string): Promise<AgentSpec> => {
  const spec = parse(md)
  await syncAgent(spec)
  return spec
}

// ═══════════════════════════════════════════════════════════════════════════
// LOAD — Read from TypeDB
// ═══════════════════════════════════════════════════════════════════════════

export const loadAgent = async (uid: string): Promise<AgentSpec | null> => {
  const rows = await readParsed(`
    match $u isa unit, has uid "${uid}",
          has name $n, has model $m, has system-prompt $p;
    select $n, $m, $p;
  `).catch(() => [])

  if (!rows.length) return null

  const row = rows[0]
  const skills = await readParsed(`
    match $u isa unit, has uid "${uid}";
          (provider: $u, offered: $s) isa capability, has price $p;
          $s has skill-id $sid, has name $sn;
    select $sid, $sn, $p;
  `).catch(() => [])

  return {
    name: row.n as string,
    model: row.m as string,
    prompt: row.p as string,
    skills: skills.map((s) => ({
      name: s.sn as string,
      price: s.p as number,
    })),
  }
}

export const loadWorld = async (gid: string): Promise<WorldSpec | null> => {
  const group = await readParsed(`
    match $g isa group, has gid "${gid}", has name $n;
    select $n;
  `).catch(() => [])

  if (!group.length) return null

  const members = await readParsed(`
    match $g isa group, has gid "${gid}";
          (group: $g, member: $u) isa membership;
          $u has uid $uid;
    select $uid;
  `).catch(() => [])

  const agents: AgentSpec[] = []
  for (const m of members) {
    const agent = await loadAgent(m.uid as string)
    if (agent) agents.push(agent)
  }

  return {
    name: group[0].n as string,
    agents,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RUNTIME — Wire into World
// ═══════════════════════════════════════════════════════════════════════════

type Complete = (prompt: string, ctx?: Record<string, unknown>) => Promise<string>

export const wireAgent = (
  spec: AgentSpec,
  net: World | PersistentWorld,
  complete: Complete,
): ReturnType<World['add']> => {
  const uid = spec.group ? `${spec.group}:${spec.name}` : spec.name
  const unit = net.add(uid)

  // Load context from docs if specified
  const contextDocs = spec.context?.length ? loadContext(spec.context) : ''
  const fullPrompt = contextDocs
    ? `# Knowledge\n\n${contextDocs}\n\n---\n\n# Instructions\n\n${spec.prompt}`
    : spec.prompt

  // Wire each skill as a handler
  for (const skill of spec.skills || []) {
    unit.on(skill.name, async (data, emit, ctx) => {
      const input = typeof data === 'string' ? data : JSON.stringify(data)
      const result = await complete(`${fullPrompt}\n\nTask: ${skill.name}\nInput: ${input}`, { system: fullPrompt })
      return { result }
    })
  }

  // Default handler uses full prompt with context
  unit.on('default', async (data, emit, ctx) => {
    const input = typeof data === 'string' ? data : JSON.stringify(data)
    const result = await complete(`${fullPrompt}\n\nInput: ${input}`)
    return { result }
  })

  return unit
}

export const wireWorld = (
  spec: WorldSpec,
  net: World | PersistentWorld,
  complete: Complete,
): Map<string, ReturnType<World['add']>> => {
  const units = new Map<string, ReturnType<World['add']>>()

  for (const agent of spec.agents) {
    agent.group = spec.name
    const unit = wireAgent(agent, net, complete)
    units.set(agent.name, unit)
  }

  return units
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE SYSTEM — Parse directory of markdown files
// ═══════════════════════════════════════════════════════════════════════════

export const parseDirectory = async (files: { name: string; content: string }[]): Promise<WorldSpec> => {
  // Find README.md for world metadata
  const readme = files.find((f) => f.name.toLowerCase() === 'readme.md')
  const worldName = readme
    ? (readme.content.match(/^#\s+(.+)/m)?.[1] || 'world').toLowerCase().replace(/\s+/g, '-')
    : 'world'

  const agents: AgentSpec[] = []

  for (const file of files) {
    if (file.name.toLowerCase() === 'readme.md') continue
    if (!file.name.endsWith('.md')) continue

    const spec = parse(file.content)
    if (spec.name) {
      agents.push(spec)
    }
  }

  return { name: worldName, agents }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  parse,
  toTypeDB,
  worldToTypeDB,
  syncAgent,
  syncWorld,
  syncFromMarkdown,
  loadAgent,
  loadWorld,
  wireAgent,
  wireWorld,
  parseDirectory,
}
