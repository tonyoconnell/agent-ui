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

import { JSONSchema, Schema } from 'effect'
import { parse as parseYaml } from 'yaml'
import { createUnit as createUnitOnChain, registerTask as registerTaskOnChain } from '@/lib/sui'
import { readParsed, write, writeSilent } from '@/lib/typedb'
import { loadContext } from './context'
import type { PersistentWorld } from './persist'
import type { World } from './world'

// Schema feature flag: reads runtime env first (CF Worker secret binding)
// then build-time env (Vite). Enables rolling schema migrations without
// redeploying every caller. Flip to 'true' once the attr is in live TypeDB.
function readSchemaFlag(name: string): boolean {
  const fromRuntime = typeof process !== 'undefined' && process.env && process.env[name]
  const fromBuild = import.meta.env?.[name]
  const v = (fromRuntime || fromBuild || '').toString().toLowerCase()
  return v === 'true' || v === '1'
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS — Single source of truth for types, parsing, validation, JSON Schema
// ═══════════════════════════════════════════════════════════════════════════

export const SkillSpecSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  price: Schema.optional(Schema.Number),
  tags: Schema.optional(Schema.Array(Schema.String)),
  description: Schema.optional(Schema.String),
})

export const AgentSpecSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  model: Schema.optional(Schema.String),
  channels: Schema.optional(Schema.Array(Schema.String)),
  skills: Schema.optional(Schema.Array(SkillSpecSchema)),
  sensitivity: Schema.optional(Schema.Number.pipe(Schema.between(0, 1))),
  group: Schema.optional(Schema.String),
  tags: Schema.optional(Schema.Array(Schema.String)),
  context: Schema.optional(Schema.Array(Schema.String)),
  aliases: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
  allowedOrigins: Schema.optional(Schema.Array(Schema.String)),
  prompt: Schema.String,
  // Sui identity — derived on sync, not from markdown
  wallet: Schema.optional(Schema.String),
  suiObjectId: Schema.optional(Schema.String),
  // ADL (Agent Definition Language) optional fields
  adlVersion: Schema.optional(Schema.String),
  adlUid: Schema.optional(Schema.String),
  adlStatus: Schema.optional(
    Schema.Union(
      Schema.Literal('draft'),
      Schema.Literal('active'),
      Schema.Literal('deprecated'),
      Schema.Literal('retired'),
    ),
  ),
  sunsetAt: Schema.optional(Schema.String),
  dataCategories: Schema.optional(Schema.Array(Schema.String)),
  permNetwork: Schema.optional(
    Schema.Struct({
      allowedHosts: Schema.optional(Schema.Array(Schema.String)),
      protocols: Schema.optional(Schema.Array(Schema.String)),
    }),
  ),
})

export const WorldSpecSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
  agents: Schema.Array(AgentSpecSchema),
})

// Mutable shapes (AgentSpec is written to by syncAgentWithIdentity, etc.)
export type SkillSpec = {
  name: string
  price?: number
  tags?: readonly string[]
  description?: string
}

export type AgentSpec = {
  name: string
  model?: string
  channels?: readonly string[]
  skills?: readonly SkillSpec[]
  sensitivity?: number
  group?: string
  tags?: readonly string[]
  context?: readonly string[]
  aliases?: Record<string, string>
  allowedOrigins?: readonly string[]
  prompt: string
  wallet?: string
  suiObjectId?: string
  // ADL optional fields
  adlVersion?: string
  adlUid?: string
  adlStatus?: 'draft' | 'active' | 'deprecated' | 'retired'
  sunsetAt?: string
  dataCategories?: readonly string[]
  permNetwork?: { allowedHosts?: readonly string[]; protocols?: readonly string[] }
}

export type WorldSpec = {
  name: string
  description?: string
  agents: AgentSpec[]
}

const decodeAgent = Schema.decodeUnknownSync(AgentSpecSchema)

/**
 * JSON Schema for AgentSpec — feed to LLM structured output (OpenRouter's
 * `response_format: { type: "json_schema", json_schema: { schema: agentSpecJsonSchema } }`)
 * to let an LLM generate new agents that are guaranteed-valid by construction.
 */
export const agentSpecJsonSchema = JSONSchema.make(AgentSpecSchema)

// ═══════════════════════════════════════════════════════════════════════════
// PARSE — YAML frontmatter + markdown body → Schema-validated AgentSpec
// ═══════════════════════════════════════════════════════════════════════════

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

export const parse = (md: string): AgentSpec => {
  const match = md.match(FRONTMATTER)
  const frontmatter = match ? (parseYaml(match[1]) ?? {}) : {}
  const prompt = (match ? match[2] : md).trim()
  return decodeAgent({ ...frontmatter, prompt }) as AgentSpec
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPEDB — Generate inserts from AgentSpec
// ═══════════════════════════════════════════════════════════════════════════

const escapeString = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export const toTypeDB = (spec: AgentSpec): string[] => {
  const queries: string[] = []
  const uid = spec.adlUid || (spec.group ? `${spec.group}:${spec.name}` : spec.name)

  // Unit insert
  const tags = [...(spec.tags || []), ...(spec.group ? [spec.group] : [])]
  const tagStr = tags.map((t) => `has tag "${t}"`).join(', ')
  const aliasStr = spec.aliases
    ? Object.entries(spec.aliases)
        .map(([skin, value]) => `has alias-${skin} "${escapeString(value)}"`)
        .join(', ')
    : ''

  // ADL attributes
  const sensitivityEnum = (() => {
    if (!spec.sensitivity) return 'internal'
    if (spec.sensitivity < 0.4) return 'public'
    if (spec.sensitivity < 0.6) return 'internal'
    if (spec.sensitivity < 0.8) return 'confidential'
    return 'restricted'
  })()

  // Build clause array for cleaner concatenation
  const clauseArray = [
    `has uid "${uid}"`,
    `has name "${spec.name}"`,
    `has unit-kind "agent"`,
    `has model "${spec.model || 'claude-sonnet-4-20250514'}"`,
    `has system-prompt "${escapeString(spec.prompt.slice(0, 10000))}"`,
    `has status "active"`,
    `has success-rate 0.5`,
    `has activity-score 0.0`,
    `has sample-count 0`,
    `has reputation 0.0`,
    `has balance 0.0`,
    `has generation 0`,
  ]

  // data-sensitivity is gated on schema support. Live TypeDB schemas
  // pre-ADL don't have the attribute defined; writing it aborts the
  // whole unit insert with [INF2]. Enable via env once the schema
  // migration lands: SCHEMA_HAS_DATA_SENSITIVITY=true.
  if (readSchemaFlag('SCHEMA_HAS_DATA_SENSITIVITY')) {
    clauseArray.push(`has data-sensitivity "${sensitivityEnum}"`)
  }

  if (spec.adlVersion) {
    clauseArray.push(`has adl-version "${spec.adlVersion}"`)
    clauseArray.push(`has adl-uid "${uid}"`)
    clauseArray.push(`has adl-status "${spec.adlStatus || 'active'}"`)
  }

  if (spec.sunsetAt) clauseArray.push(`has sunset-at "${spec.sunsetAt}"`)

  if (spec.permNetwork) {
    clauseArray.push(
      `has perm-network "${escapeString(JSON.stringify({ allowed_hosts: spec.permNetwork.allowedHosts || [], protocols: spec.permNetwork.protocols || [] }))}"`,
    )
  }

  if (spec.dataCategories) {
    clauseArray.push(`has data-categories "${escapeString(JSON.stringify(spec.dataCategories))}"`)
  }

  if (spec.wallet) clauseArray.push(`has wallet "${spec.wallet}"`)

  // Add tags
  if (tagStr) clauseArray.push(tagStr)

  // Add aliases
  if (aliasStr) clauseArray.push(aliasStr)

  // Add allowed origins as tags
  if (spec.allowedOrigins) {
    spec.allowedOrigins.forEach((o) => {
      clauseArray.push(`has tag "origin:${o}"`)
    })
  }

  // Idempotent unit insert: skip if uid already exists.
  // Re-sync of the same agent spec is common (edits, redeploys) and
  // must not trip the @unique constraint on uid.
  queries.push(`
    match not { $existing isa unit, has uid "${uid}"; };
    insert $u isa unit,
      ${clauseArray.join(',\n      ')};
  `)

  // Group membership — only create if not already a member.
  if (spec.group) {
    queries.push(`
      match
        $g isa group, has gid "${spec.group}";
        $u isa unit, has uid "${uid}";
        not { (group: $g, member: $u) isa membership; };
      insert (group: $g, member: $u) isa membership, has joined-at ${new Date().toISOString().replace('Z', '')};
    `)
  }

  // Skills and capabilities
  const allSkills: readonly { name: string; price?: number; tags?: readonly string[]; description?: string }[] =
    spec.skills?.some((s) => s.name === 'hire') ? spec.skills : [...(spec.skills ?? []), { name: 'hire' }]
  for (const skill of allSkills) {
    // Skill-id MUST be unique per (agent, skill) pair — the `@unique`
    // constraint on skill-id means two agents with the same `hire` skill
    // collide in a non-group setup. Always prefix with the unit's uid so
    // each agent owns its own skill identity; group-scoped queries can
    // still filter by the group prefix embedded in uid.
    const skillId = `${uid}:${skill.name}`
    const skillTags = skill.tags?.map((t) => `has tag "${t}"`).join(', ') || ''

    // Idempotent skill insert: only create if not already present.
    // Repeated syncs of the same agent spec must not re-insert and trip
    // the uniqueness constraint.
    queries.push(`
      match not { $existing isa skill, has skill-id "${skillId}"; };
      insert $s isa skill,
        has skill-id "${skillId}",
        has name "${skill.name}",
        has price ${skill.price || 0}${skill.description ? `, has description "${escapeString(skill.description)}"` : ''}${skillTags ? `, ${skillTags}` : ''};
    `)

    // Idempotent capability: only create if this unit doesn't already
    // offer this skill. Without this guard, repeated syncs pile up
    // duplicate capability relations, breaking `discover` ranking.
    queries.push(`
      match
        $u isa unit, has uid "${uid}";
        $s isa skill, has skill-id "${skillId}";
        not { (provider: $u, offered: $s) isa capability; };
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
  // Writes must propagate — swallowing here caused silent partial persist
  // (skill lands, unit missing) that returned ok:true from the sync route.
  for (const q of queries) {
    await write(q)
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
  // Writes must propagate — see syncAgent for the silent-partial-persist history.
  for (const q of queries) {
    await write(q)
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
  const contextDocs = spec.context?.length ? loadContext([...spec.context]) : ''
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
