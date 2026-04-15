/**
 * ADL (Agent Definition Language) Parser — v0.2.0
 *
 * Spec: https://www.adl-spec.org/spec
 *
 * ADL is a JSON "passport" for AI agents: identity (uid as HTTPS URI/DID/URN),
 * capabilities (tools with JSON schemas), permissions (deny-by-default network/fs/env),
 * data classification (public/internal/confidential/restricted), and lifecycle (status, sunset).
 *
 * ADL documents sync to TypeDB as units with structured security attributes.
 * ADL is a trust/security layer on top of the substrate—signals, pheromone, and
 * closed loops are untouched.
 *
 * JSON → AdlDoc → TypeDB inserts (parallel to agent-md.ts, which handles markdown)
 */

import { Schema } from 'effect'
import { readParsed, write } from '@/lib/typedb'
import type { AgentSpec } from './agent-md'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const AdlToolSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
  inputSchema: Schema.optional(Schema.String), // JSON Schema as string
  outputSchema: Schema.optional(Schema.String),
})

export const AdlResourceSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
})

export const AdlPromptSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
})

export const AdlCapabilitiesSchema = Schema.Struct({
  tools: Schema.optional(Schema.Array(AdlToolSchema)),
  resources: Schema.optional(Schema.Array(AdlResourceSchema)),
  prompts: Schema.optional(Schema.Array(AdlPromptSchema)),
})

export const AdlPermissionsSchema = Schema.Struct({
  network: Schema.optional(
    Schema.Struct({
      allowedHosts: Schema.optional(Schema.Array(Schema.String)),
      protocols: Schema.optional(Schema.Array(Schema.String)),
    }),
  ),
  filesystem: Schema.optional(
    Schema.Struct({
      allowedPaths: Schema.optional(Schema.Array(Schema.String)),
      read: Schema.optional(Schema.Boolean),
      write: Schema.optional(Schema.Boolean),
    }),
  ),
  env: Schema.optional(
    Schema.Struct({
      access: Schema.optional(Schema.Array(Schema.String)),
    }),
  ),
  process: Schema.optional(Schema.Boolean),
  limits: Schema.optional(
    Schema.Struct({
      memoryMb: Schema.optional(Schema.Number),
      cpuPercent: Schema.optional(Schema.Number),
      durationS: Schema.optional(Schema.Number),
    }),
  ),
})

export const AdlDataSchema = Schema.Struct({
  sensitivity: Schema.optional(
    Schema.Union(
      Schema.Literal('public'),
      Schema.Literal('internal'),
      Schema.Literal('confidential'),
      Schema.Literal('restricted'),
    ),
  ),
  categories: Schema.optional(Schema.Array(Schema.String)),
  retention: Schema.optional(
    Schema.Struct({
      days: Schema.optional(Schema.Number),
    }),
  ),
})

export const AdlDocSchema = Schema.Struct({
  id: Schema.NonEmptyString, // HTTPS URI / DID / URN
  name: Schema.NonEmptyString,
  version: Schema.NonEmptyString, // semver
  description: Schema.optional(Schema.String),
  adlVersion: Schema.optional(Schema.String), // default "0.2.0"
  status: Schema.optional(
    Schema.Union(
      Schema.Literal('draft'),
      Schema.Literal('active'),
      Schema.Literal('deprecated'),
      Schema.Literal('retired'),
    ),
  ),
  sunsetAt: Schema.optional(Schema.String), // ISO datetime
  capabilities: Schema.optional(AdlCapabilitiesSchema),
  permissions: Schema.optional(AdlPermissionsSchema),
  data: Schema.optional(AdlDataSchema),
})

export type AdlTool = Schema.Schema.Type<typeof AdlToolSchema>
export type AdlCapabilities = Schema.Schema.Type<typeof AdlCapabilitiesSchema>
export type AdlPermissions = Schema.Schema.Type<typeof AdlPermissionsSchema>
export type AdlData = Schema.Schema.Type<typeof AdlDataSchema>
export type AdlDoc = Schema.Schema.Type<typeof AdlDocSchema>

const decodeAdl = Schema.decodeUnknownSync(AdlDocSchema)

// ═══════════════════════════════════════════════════════════════════════════
// PARSE & VALIDATE
// ═══════════════════════════════════════════════════════════════════════════

export const parse = (json: unknown): AdlDoc => {
  return decodeAdl(json) as AdlDoc
}

export const validate = (json: unknown): { ok: boolean; errors?: string[] } => {
  try {
    decodeAdl(json)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      errors: [e instanceof Error ? e.message : 'Unknown validation error'],
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SENSITIVITY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

const sensitivityFromFloat = (sensitivity?: number): string => {
  if (!sensitivity) return 'internal'
  if (sensitivity < 0.4) return 'public'
  if (sensitivity < 0.6) return 'internal'
  if (sensitivity < 0.8) return 'confidential'
  return 'restricted'
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPEDB GENERATION
// ═══════════════════════════════════════════════════════════════════════════

const escapeString = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export const toTypeDB = (doc: AdlDoc): string[] => {
  const queries: string[] = []
  const uid = doc.id // ADL uid is the canonical identifier

  // --- Unit insert (one main query) ---

  const now = new Date().toISOString().replace('Z', '')
  const status = doc.status || 'active'
  const adlVersion = doc.adlVersion || '0.2.0'

  // Build conditional clauses
  const clauses: string[] = [
    `has uid "${uid}"`,
    `has name "${escapeString(doc.name)}"`,
    `has adl-version "${adlVersion}"`,
    `has adl-uid "${uid}"`,
    `has adl-status "${status}"`,
    `has unit-kind "agent"`,
    `has status "active"`,
    `has model "meta-llama/llama-4-maverick"`,
    `has system-prompt "Agent: ${escapeString(doc.name)}"`,
    `has success-rate 0.5`,
    `has activity-score 0.0`,
    `has sample-count 0`,
    `has reputation 0.0`,
    `has balance 0.0`,
    `has generation 0`,
    `has created "${now}"`,
  ]

  // ADL attributes
  const dataSensitivity = doc.data?.sensitivity || 'internal'
  clauses.push(`has data-sensitivity "${dataSensitivity}"`)

  if (doc.data?.categories?.length) {
    clauses.push(`has data-categories "${escapeString(JSON.stringify(doc.data.categories))}"`)
  }

  if (doc.data?.retention?.days) {
    clauses.push(`has data-retention-days ${doc.data.retention.days}`)
  }

  if (doc.sunsetAt) {
    clauses.push(`has sunset-at "${doc.sunsetAt}"`)
  }

  // Permissions (stored as JSON)
  if (doc.permissions?.network) {
    clauses.push(
      `has perm-network "${escapeString(
        JSON.stringify({
          allowed_hosts: doc.permissions.network.allowedHosts || [],
          protocols: doc.permissions.network.protocols || [],
        }),
      )}"`,
    )
  }

  if (doc.permissions?.filesystem) {
    clauses.push(
      `has perm-filesystem "${escapeString(
        JSON.stringify({
          allowed_paths: doc.permissions.filesystem.allowedPaths || [],
          read: doc.permissions.filesystem.read ?? false,
          write: doc.permissions.filesystem.write ?? false,
        }),
      )}"`,
    )
  }

  if (doc.permissions?.env) {
    clauses.push(`has perm-env "${escapeString(JSON.stringify({ access: doc.permissions.env.access || [] }))}"`)
  }

  if (doc.permissions?.process !== undefined) {
    clauses.push(`has perm-process ${doc.permissions.process}`)
  }

  if (doc.permissions?.limits?.memoryMb) {
    clauses.push(`has perm-memory-mb ${doc.permissions.limits.memoryMb}`)
  }

  if (doc.permissions?.limits?.cpuPercent) {
    clauses.push(`has perm-cpu-percent ${doc.permissions.limits.cpuPercent}`)
  }

  if (doc.permissions?.limits?.durationS) {
    clauses.push(`has perm-duration-s ${doc.permissions.limits.durationS}`)
  }

  queries.push(`insert $u isa unit,\n      ${clauses.join(',\n      ')};`)

  // --- Skills and capabilities ---
  if (doc.capabilities?.tools?.length) {
    for (const tool of doc.capabilities.tools) {
      const skillId = `${uid}:${tool.name}`

      // Insert skill
      const skillClauses: string[] = [`has skill-id "${skillId}"`, `has name "${escapeString(tool.name)}"`]

      if (tool.description) {
        skillClauses.push(`has description "${escapeString(tool.description)}"`)
      }

      if (tool.inputSchema) {
        skillClauses.push(`has input-schema "${escapeString(tool.inputSchema)}"`)
      }

      if (tool.outputSchema) {
        skillClauses.push(`has output-schema "${escapeString(tool.outputSchema)}"`)
      }

      queries.push(`insert $s isa skill,\n      ${skillClauses.join(',\n      ')};`)

      // Capability relation
      queries.push(`
        match $u isa unit, has uid "${uid}";
              $s isa skill, has skill-id "${skillId}";
        insert (provider: $u, offered: $s) isa capability, has price 0.0;
      `)
    }
  }

  return queries
}

export const syncAdl = async (doc: AdlDoc): Promise<void> => {
  const queries = toTypeDB(doc)
  for (const q of queries) {
    await write(q).catch((e) => console.warn('ADL sync error:', e instanceof Error ? e.message : e))
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RECONSTRUCTION & BRIDGING
// ═══════════════════════════════════════════════════════════════════════════

export const adlFromUnit = async (uid: string): Promise<AdlDoc | null> => {
  const rows = await readParsed(`
    match $u isa unit, has uid "${uid}",
          has name $name,
          has adl-version $av,
          has adl-status $status;
    select $name, $av, $status;
  `).catch(() => [])

  if (!rows.length) return null

  const row = rows[0]
  const name = row.name as string
  const adlVersion = row.av as string
  const status = row.status as string

  // Read optional ADL attributes
  const optRows = await readParsed(`
    match $u isa unit, has uid "${uid}";
    select
      $u has adl-uid $au,
      $u has data-sensitivity $ds,
      $u has data-categories $dc,
      $u has sunset-at $sa,
      $u has perm-network $pn,
      $u has perm-filesystem $pf;
  `).catch(() => [])

  const optRow = optRows[0] || {}

  const dataSensitivity = (optRow.ds || 'internal') as string
  const dataCategories = optRow.dc ? (JSON.parse(optRow.dc as string) as string[]) : undefined
  const sunsetAt = optRow.sa ? (optRow.sa as string) : undefined
  const permNetwork = optRow.pn ? (JSON.parse(optRow.pn as string) as AdlPermissions['network']) : undefined
  const permFilesystem = optRow.pf ? (JSON.parse(optRow.pf as string) as AdlPermissions['filesystem']) : undefined

  // Read skills as tools
  const skillRows = await readParsed(`
    match $u isa unit, has uid "${uid}";
          (provider: $u, offered: $s) isa capability;
          $s has skill-id $sid, has name $sn;
    select $sn, $s has input-schema $is, $s has output-schema $os;
  `).catch(() => [])

  const tools = skillRows.map((row) => ({
    name: row.sn as string,
    inputSchema: row.is ? (row.is as string) : undefined,
    outputSchema: row.os ? (row.os as string) : undefined,
  }))

  return {
    id: uid,
    name,
    version: '1.0.0', // fallback version
    adlVersion,
    status: status as any,
    sunsetAt,
    capabilities: tools.length > 0 ? { tools } : undefined,
    data: {
      sensitivity: dataSensitivity as any,
      categories: dataCategories,
    },
    permissions: {
      network: permNetwork,
      filesystem: permFilesystem,
    },
  }
}

export const adlFromAgentSpec = (spec: AgentSpec): AdlDoc => {
  const sensitivity = sensitivityFromFloat(spec.sensitivity)

  return {
    id: spec.group ? `${spec.group}:${spec.name}` : spec.name,
    name: spec.name,
    version: '1.0.0',
    adlVersion: '0.2.0',
    status: 'active',
    capabilities: {
      tools: spec.skills?.map((s) => ({
        name: s.name,
        description: s.description,
      })),
    },
    data: {
      sensitivity: sensitivity as any,
    },
    permissions: {
      network: spec.allowedOrigins ? { allowedHosts: spec.allowedOrigins } : undefined,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT AUGMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export async function augmentPromptWithADL(uid: string, basePrompt: string): Promise<string> {
  let adl: Awaited<ReturnType<typeof adlFromUnit>>
  try {
    adl = await adlFromUnit(uid)
  } catch {
    return basePrompt
  }
  if (!adl) return basePrompt

  const lines: string[] = []

  if (adl.data?.sensitivity && adl.data.sensitivity !== 'public') {
    lines.push(`Data classification: ${adl.data.sensitivity}`)
  }

  if (adl.permissions?.network?.allowedHosts?.length) {
    lines.push(`Allowed network hosts: ${adl.permissions.network.allowedHosts.join(', ')}`)
  }

  if (adl.permissions?.env?.access?.length) {
    lines.push(`Env access keys required: ${adl.permissions.env.access.join(', ')}`)
  }

  if (adl.status === 'deprecated') {
    lines.push(`Status: deprecated — avoid new capabilities, focus on stability`)
  }

  if (lines.length === 0) return basePrompt

  return `${basePrompt}\n\n[OPERATIONAL CONSTRAINTS]\n${lines.join('\n')}`
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  parse,
  validate,
  toTypeDB,
  syncAdl,
  adlFromUnit,
  adlFromAgentSpec,
}
