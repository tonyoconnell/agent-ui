#!/usr/bin/env node
/**
 * Seed all agents from agents/ directory into TypeDB
 *
 * Usage:
 *   npx tsx scripts/seed-agents.ts [--dry-run]
 *
 * Loads markdown agents, parses them, generates TypeQL inserts,
 * and syncs to TypeDB Cloud.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileURLToPath } from 'url'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const agentsDir = path.resolve(__dirname, '../agents')

// Load .env manually (this script runs outside Astro/Vite)
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

const TYPEDB_URL = process.env.TYPEDB_URL || 'https://cloud.typedb.com'
const TYPEDB_DATABASE = process.env.TYPEDB_DATABASE || 'one'
const TYPEDB_USERNAME = process.env.TYPEDB_USERNAME || 'admin'
const TYPEDB_PASSWORD = process.env.TYPEDB_PASSWORD || ''
const SUI_SEED_B64 = process.env.SUI_SEED || ''

// ─────────────────────────────────────────────────────────────────────────────
// Sui wallet derivation — matches src/lib/sui.ts::deriveKeypair exactly
// SHA-256(seed || uid) → 32-byte secret → Ed25519 → address
// ─────────────────────────────────────────────────────────────────────────────

const walletCache = new Map<string, string>()

function deriveWallet(uid: string): string | null {
  if (!SUI_SEED_B64) return null
  if (walletCache.has(uid)) return walletCache.get(uid)!
  const seed = Buffer.from(SUI_SEED_B64, 'base64')
  const secret = crypto.createHash('sha256').update(seed).update(uid).digest()
  const kp = Ed25519Keypair.fromSecretKey(new Uint8Array(secret))
  const address = kp.getPublicKey().toSuiAddress()
  walletCache.set(uid, address)
  return address
}

interface SkillSpec {
  name: string
  price?: number
  tags?: string[]
}

interface AgentData {
  name: string
  model?: string
  channels?: string[]
  skills?: SkillSpec[]
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
  if (!isNaN(Number(value))) return Number(value)
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
  }
  return value.replace(/^['"]|['"]$/g, '')
}

function parseSkills(lines: string[]): SkillSpec[] {
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
        // Check raw line indentation (trimmed strips leading spaces, making the
        // original `trimmed.startsWith('  ')` check always false)
        if (line.startsWith('  ') || line.startsWith('\t')) {
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

  spec.prompt = lines.slice(frontmatterEnd + 1).join('\n').trim()
  return spec
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function agentToQueries(spec: AgentData): string[] {
  const queries: string[] = []
  const uid = spec.group ? `${spec.group}:${spec.name}` : spec.name

  const tags = [...(spec.tags || []), ...(spec.group ? [spec.group] : [])]
  const tagStr = tags.map(t => `has tag "${t}"`).join(', ')

  const wallet = deriveWallet(uid)
  const walletStr = wallet ? `, has wallet "${wallet}"` : ''

  const promptClean = escapeString(spec.prompt.slice(0, 5000))
  // Guard: only insert if unit doesn't already exist
  queries.push(`
    match not { $u isa unit, has uid "${uid}"; };
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
      has generation 0${tagStr ? ', ' + tagStr : ''}${walletStr};
  `)

  for (const skill of spec.skills || []) {
    const skillId = spec.group ? `${spec.group}:${skill.name}` : skill.name
    const skillTags = skill.tags?.map(t => `has tag "${t}"`).join(', ') || ''

    // Guard: only insert skill if it doesn't already exist
    queries.push(`
      match not { $s isa skill, has skill-id "${skillId}"; };
      insert $s isa skill,
        has skill-id "${skillId}",
        has name "${skill.name}",
        has price ${skill.price || 0}${skillTags ? ', ' + skillTags : ''};
    `)

    // Guard: only link capability if it doesn't already exist
    queries.push(`
      match $u isa unit, has uid "${uid}";
            $s isa skill, has skill-id "${skillId}";
            not { (provider: $u, offered: $s) isa capability; };
      insert (provider: $u, offered: $s) isa capability, has price ${skill.price || 0};
    `)
  }

  return queries
}

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${TYPEDB_URL}/v1/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TYPEDB_USERNAME, password: TYPEDB_PASSWORD }),
  })

  if (!res.ok) {
    throw new Error(`TypeDB signin failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as { token: string }
  return data.token
}

async function executeQuery(token: string, tql: string): Promise<void> {
  const res = await fetch(`${TYPEDB_URL}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      databaseName: TYPEDB_DATABASE,
      transactionType: 'write',
      query: tql,
      commit: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Query failed: ${res.status} - ${text}`)
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log(`📂 Scanning agents directory: ${agentsDir}`)

  // Find all agent markdown files
  const allAgents: AgentData[] = []
  const groups = new Set<string>()

  function scanDir(dir: string, baseGroup?: string) {
    const entries = fs.readdirSync(dir)

    for (const entry of entries) {
      const fullPath = path.join(dir, entry)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && entry !== '.obsidian') {
        scanDir(fullPath, entry)
      } else if (entry.endsWith('.md') && entry !== 'README.md') {
        const md = fs.readFileSync(fullPath, 'utf-8')
        const agent = parseAgent(md)

        if (!agent.name) {
          console.warn(`  ⚠️  ${entry}: no name found`)
          continue
        }

        // Default group to directory name
        if (!agent.group && baseGroup) {
          agent.group = baseGroup
        }

        if (agent.group) {
          groups.add(agent.group)
        }

        allAgents.push(agent)
        console.log(`  ✓ ${agent.name}${agent.group ? ` (${agent.group})` : ''}`)
      }
    }
  }

  // Scope: only seed agents/donal/ by default. Pass --all to seed everything.
  const seedAll = process.argv.includes('--all')
  const donalDir = path.join(agentsDir, 'donal')
  if (seedAll) {
    scanDir(agentsDir)
  } else {
    console.log('  (scoped to agents/donal/ — pass --all for everything)')
    scanDir(donalDir, 'marketing')
  }

  console.log(`\n📊 Summary:`)
  console.log(`  ${allAgents.length} agents`)
  console.log(`  ${groups.size} groups: ${Array.from(groups).join(', ')}`)

  const totalSkills = allAgents.reduce((sum, a) => sum + (a.skills?.length || 0), 0)
  console.log(`  ${totalSkills} skills`)

  // Generate all queries
  const allQueries: string[] = []

  // Groups (idempotent)
  for (const group of groups) {
    allQueries.push(`
      match not { $g isa group, has gid "${group}"; };
      insert $g isa group,
        has gid "${group}",
        has name "${group}",
        has group-type "world",
        has status "active";
    `)
  }

  // Agents
  for (const agent of allAgents) {
    const queries = agentToQueries(agent)
    allQueries.push(...queries)

    if (agent.group) {
      allQueries.push(`
        match $g isa group, has gid "${agent.group}";
              $u isa unit, has uid "${agent.group}:${agent.name}";
              not { (group: $g, member: $u) isa membership; };
        insert (group: $g, member: $u) isa membership;
      `)
    }
  }

  // Director paths for each group
  for (const group of groups) {
    const groupAgents = allAgents.filter(a => a.group === group)
    const director = groupAgents.find(a => a.name.includes('director') || a.name === 'cmo')

    if (director) {
      const directorUid = `${group}:${director.name}`
      for (const agent of groupAgents) {
        if (agent.name !== director.name) {
          const uid = `${group}:${agent.name}`
          allQueries.push(`
            match $from isa unit, has uid "${directorUid}";
                  $to isa unit, has uid "${uid}";
                  not { (source: $from, target: $to) isa path; };
            insert (source: $from, target: $to) isa path,
              has strength 1.0, has resistance 0.0, has traversals 0, has revenue 0.0;
          `)
        }
      }
    }
  }

  // Alliance edges — pre-drawn pheromone paths from Donal's alliances.yaml
  // Imported from src/worlds/donal-marketing.ts alliance table
  const allianceEdges: Array<{ from: string; to: string; strength: number }> = [
    { from: 'ai-ranking',   to: 'citation',  strength: 50 },
    { from: 'citation',     to: 'social',    strength: 50 },
    { from: 'citation',     to: 'forum',     strength: 50 },
    { from: 'citation',     to: 'niche-dir', strength: 50 },
    { from: 'forum',        to: 'outreach',  strength: 50 },
    { from: 'outreach',     to: 'quick',     strength: 50 },
    { from: 'quick',        to: 'full',      strength: 50 },
    { from: 'ai-ranking',   to: 'schema',    strength: 50 },
    { from: 'full',         to: 'schema',    strength: 50 },
    { from: 'full',         to: 'monthly',   strength: 50 },
    { from: 'monthly',      to: 'schema',    strength: 50 },
  ]

  // Only seed alliance edges if both ends exist in the current agent set
  const allUids = new Set(allAgents.map(a => a.group ? `${a.group}:${a.name}` : a.name))
  let allianceCount = 0
  for (const edge of allianceEdges) {
    const fromUid = `marketing:${edge.from}`
    const toUid = `marketing:${edge.to}`
    if (allUids.has(fromUid) && allUids.has(toUid)) {
      allQueries.push(`
        match $from isa unit, has uid "${fromUid}";
              $to isa unit, has uid "${toUid}";
              not { (source: $from, target: $to) isa path; };
        insert (source: $from, target: $to) isa path,
          has strength ${edge.strength}.0, has resistance 0.0, has traversals 0, has revenue 0.0;
      `)
      allianceCount++
    }
  }
  console.log(`  ${allianceCount} alliance edges (strength=50, from alliances.yaml)`)

  // Wallet summary
  const walletCount = allAgents.filter(a => {
    const uid = a.group ? `${a.group}:${a.name}` : a.name
    return deriveWallet(uid) !== null
  }).length
  console.log(`  ${walletCount} Sui wallets derived`)

  console.log(`\n📝 Generated ${allQueries.length} queries`)

  if (dryRun) {
    console.log('\n🏁 DRY RUN mode - queries generated but not executed')
    console.log('\nSample query:')
    console.log(allQueries[0])
    return
  }

  // Execute
  console.log('\n🔐 Authenticating to TypeDB...')
  let token: string
  try {
    token = await getAuthToken()
  } catch (e) {
    console.error('❌ Auth failed:', (e as Error).message)
    process.exit(1)
  }

  console.log('✓ Authenticated\n')

  let executed = 0
  let failed = 0

  for (const q of allQueries) {
    try {
      await executeQuery(token, q)
      executed++
      if (executed % 10 === 0) {
        console.log(`  ${executed}/${allQueries.length} queries executed`)
      }
    } catch (e) {
      failed++
      console.error(`❌ Query ${executed + failed} failed:`, (e as Error).message)
    }
  }

  console.log(`\n✅ Seeding complete:`)
  console.log(`  ${executed} queries executed`)
  console.log(`  ${failed} failed`)
  console.log(`  ${allAgents.length} units created`)
  console.log(`  ${totalSkills} skills created`)
  console.log(`  ${allAgents.length * 3} paths created (approx)`)
}

main().catch(e => {
  console.error('❌ Fatal error:', e)
  process.exit(1)
})
