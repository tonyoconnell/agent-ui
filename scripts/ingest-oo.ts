#!/usr/bin/env node
/**
 * Ingest Online Optimisers (Donal's) agents from GitHub into ONE.
 *
 *   Reads  : onlineoptimisers/operation-fury-plus (via gh api)
 *            onlineoptimisers/agency-operator     (via gh api)
 *   Writes : agents/donal/{name}.md               (ONE + Agent Launch dual-format)
 *            src/worlds/donal-marketing.ts         (WorldSpec + alliance edges)
 *            agents/donal/README.md                (generated index)
 *
 * Usage:
 *   npx tsx scripts/ingest-oo.ts                  # full ingest
 *   npx tsx scripts/ingest-oo.ts --dry            # no file writes, print plan
 *   npx tsx scripts/ingest-oo.ts --only=<name>    # single agent
 *
 * Philosophy:
 *   No Python AST walker. No rubric judge. No embeddings. No bridge.
 *   Donal's endpoints/*.py have 4 module-level constants we read by regex,
 *   plus a PROMPT template we lift verbatim. That's the whole parser.
 *
 *   Agents run NATIVELY on ONE via complete() — not via HTTP fetch to Donal's
 *   Python. Same prompts, same prices, same self-review rules, separate runtime.
 *   Donal's Python keeps earning under his own retainers; ours ships to Agentverse.
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const DRY = process.argv.includes('--dry')
const ONLY = process.argv.find(a => a.startsWith('--only='))?.slice(7)

// ─────────────────────────────────────────────────────────────────────────────
// Repo read — prefer local clone at ../donal/{name}, fall back to gh api
// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_DONAL_ROOT = path.resolve(repoRoot, '..', 'donal')

const hasLocal = (repo: string): boolean => {
  const slug = repo.split('/')[1]
  return fs.existsSync(path.join(LOCAL_DONAL_ROOT, slug))
}

const readFile = (repo: string, filePath: string): string => {
  const slug = repo.split('/')[1]
  const localPath = path.join(LOCAL_DONAL_ROOT, slug, filePath)
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf-8')
  }
  const b64 = execSync(
    `gh api "/repos/${repo}/contents/${filePath}" --jq .content`,
    { encoding: 'utf-8' }
  ).trim()
  return Buffer.from(b64, 'base64').toString('utf-8')
}

const listDir = (repo: string, dirPath: string): string[] => {
  const slug = repo.split('/')[1]
  const localPath = path.join(LOCAL_DONAL_ROOT, slug, dirPath)
  if (fs.existsSync(localPath)) {
    return fs
      .readdirSync(localPath)
      .filter(f => !f.startsWith('.'))
  }
  const out = execSync(
    `gh api "/repos/${repo}/contents/${dirPath}" --jq '.[] | .name'`,
    { encoding: 'utf-8' }
  )
  return out.trim().split('\n').filter(Boolean)
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse Fury-plus endpoint: 4 module globals + PROMPT template + description
// ─────────────────────────────────────────────────────────────────────────────

interface FuryEndpoint {
  file: string          // e.g. "ai_audit_deep.py"
  slug: string          // e.g. "ai-ranking"  (kebab, from AGENT_NAME)
  agentName: string     // e.g. "oo-ai-ranking-audit"
  token: string         // e.g. "$AUDIT"
  desc: string          // AGENT_DESC body
  spotFee: number
  deepFee: number | null
  promptStandard: string
  promptDeep: string | null
}

const extractString = (src: string, key: string): string | null => {
  // Match either: wrapper.KEY = "..."  OR  wrapper.KEY = (\n  "..." \n  "..." \n)
  const simple = new RegExp(`wrapper\\.${key}\\s*=\\s*"([^"]*)"`)
  const m = src.match(simple)
  if (m) return m[1]

  // Multiline concat form: wrapper.DESC = (\n    "a "\n    "b"\n)
  // Require the closing ) to be on its own line so embedded ")" in string
  // literals (e.g. "by vertical)") don't trip the lazy match.
  const multi = new RegExp(
    `wrapper\\.${key}\\s*=\\s*\\(\\s*\\n([\\s\\S]*?)\\n\\s*\\)`,
    'm'
  )
  const mm = src.match(multi)
  if (mm) {
    return mm[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('"'))
      .map(l => {
        // Strip leading/trailing quotes, preserve embedded ones
        const stripped = l.replace(/^"/, '').replace(/"\s*$/, '')
        return stripped
      })
      .join('')
  }
  return null
}

const extractNumber = (src: string, key: string): number | null => {
  const m = src.match(new RegExp(`wrapper\\.${key}\\s*=\\s*([0-9.]+)`))
  return m ? Number(m[1]) : null
}

const extractTripleQuoted = (src: string, varName: string): string | null => {
  const re = new RegExp(`${varName}\\s*=\\s*"""([\\s\\S]*?)"""`, 'm')
  const m = src.match(re)
  return m ? m[1].trim() : null
}

// AGENT_NAME "oo-ai-ranking-audit" → slug "ai-ranking"
const slugify = (agentName: string, token: string): string => {
  // Prefer a clean slug from the $TOKEN (AUDIT → ai-ranking requires manual map)
  // Default: strip "oo-" prefix, drop "-audit" / "-builder" suffix noise
  return agentName
    .replace(/^oo-/, '')
    .replace(/-audit$/, '')     // "ai-ranking-audit" → "ai-ranking"
    .replace(/-builder$/, '')   // "citation-builder" → "citation"
    .replace(/-prospector$/, '')// "outreach-prospector" → "outreach"
    .replace(/-finder$/, '')    // "forum-finder" → "forum"
    .replace(/-profile$/, '')   // "social-profile" → "social"
    .replace(/-directory$/, '-dir')
    .replace(/-build$/, '')     // "schema-build" → "schema"
    .replace(/-report$/, '')    // "monthly-report" → "monthly"
    .replace(/^ai-ranking$/, 'ai-ranking')  // keep flagship intact
}

const parseFuryEndpoint = (file: string, src: string): FuryEndpoint | null => {
  const agentName = extractString(src, 'AGENT_NAME')
  const token = extractString(src, 'AGENT_TOKEN')
  const desc = extractString(src, 'AGENT_DESC')
  const spotFee = extractNumber(src, 'SPOT_FEE_FET')
  const deepFee = extractNumber(src, 'DEEP_FEE_FET')

  if (!agentName || !token || spotFee === null) {
    console.warn(`  ⚠️  ${file}: missing required metadata`)
    return null
  }

  // Try common prompt var names in order
  const promptStandard =
    extractTripleQuoted(src, 'PROMPT_STANDARD') ??
    extractTripleQuoted(src, 'PROMPT') ??
    extractTripleQuoted(src, 'AUDIT_PROMPT_STANDARD')

  const promptDeep =
    extractTripleQuoted(src, 'PROMPT_DEEP') ??
    extractTripleQuoted(src, 'AUDIT_PROMPT_DEEP')

  if (!promptStandard) {
    console.warn(`  ⚠️  ${file}: no PROMPT_STANDARD / PROMPT / AUDIT_PROMPT_STANDARD`)
    return null
  }

  return {
    file,
    slug: slugify(agentName, token),
    agentName,
    token,
    desc: desc ?? '',
    spotFee,
    deepFee,
    promptStandard,
    promptDeep,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Personality dial — parse personalities.py PERSONALITY_SCORES table
// ─────────────────────────────────────────────────────────────────────────────

interface Personality {
  risk: number
  diligence: number
  tone: number
  ambition: number
  urgency: number
  confrontation: number
  source?: string  // agency-operator slug we looked up (may differ from ours)
}

const DEFAULT_PERSONALITY: Personality = {
  risk: 3, diligence: 4, tone: 3, ambition: 3, urgency: 3, confrontation: 3,
}

// Our ingested slugs → agency-operator slug in personalities.py
// For agents that don't have a direct entry, we pick the closest sibling.
const PERSONALITY_SLUG_MAP: Record<string, string> = {
  'ai-ranking': 'ai_ranking',
  'citation':   'head_seo_gbp',   // closest sibling in the SEO family
  'niche-dir':  'head_seo_gbp',
  'forum':      'head_seo_gbp',
  'social':     'head_seo_gbp',
  'outreach':   'sales_manager',
  'quick':      'head_seo_gbp',
  'full':       'head_seo_gbp',
  'schema':     'head_webdev',
  'monthly':    'head_reports',
}

const DIMENSION_LABELS: Record<keyof Omit<Personality, 'source'>, [string, string]> = {
  risk:          ['cautious',   'aggressive'],
  diligence:     ['big-picture','obsessive detail'],
  tone:          ['dry/formal', 'casual/warm'],
  ambition:      ['safe bets',  'moonshots'],
  urgency:       ['long-horizon','ship-today'],
  confrontation: ['diplomatic', 'blunt'],
}

const parsePersonality = (pySrc: string, slug: string): Personality | null => {
  // match line like:  "head_seo_gbp":  {"risk": 2, "diligence": 5, ...},
  const re = new RegExp(
    `"${slug}"\\s*:\\s*\\{([^}]+)\\}`
  )
  const m = pySrc.match(re)
  if (!m) return null
  const fields: Record<string, number> = {}
  for (const match of m[1].matchAll(/"(\w+)"\s*:\s*(\d+)/g)) {
    fields[match[1]] = Number(match[2])
  }
  return {
    risk: fields.risk ?? 3,
    diligence: fields.diligence ?? 3,
    tone: fields.tone ?? 3,
    ambition: fields.ambition ?? 3,
    urgency: fields.urgency ?? 3,
    confrontation: fields.confrontation ?? 3,
    source: slug,
  }
}

const loadPersonalityTable = (): ((slug: string) => Personality) => {
  const AGENCY_REPO = 'onlineoptimisers/agency-operator'
  let pySrc: string = ''
  try {
    pySrc = readFile(AGENCY_REPO, 'agents/personalities.py')
  } catch {
    console.warn('  ⚠️  could not read personalities.py, using defaults')
    return () => DEFAULT_PERSONALITY
  }
  return (slug: string) => {
    const agencySlug = PERSONALITY_SLUG_MAP[slug] ?? slug.replace(/-/g, '_')
    return parsePersonality(pySrc, agencySlug) ?? DEFAULT_PERSONALITY
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Alliance edges (pre-drawn pheromone graph from alliances.yaml partner reasons)
// ─────────────────────────────────────────────────────────────────────────────

interface Edge {
  from: string
  to: string
  reason: string
}

// Hand-curated from alliances.yaml `reason` text. Donal's YAML pairs are
// cross-holdings (undirected), but his reasons are directional — we encode
// the direction he intended in each reason.
const allianceEdges: Edge[] = [
  { from: 'ai-ranking',   to: 'citation',  reason: 'flags gaps, fills them' },
  { from: 'citation',     to: 'social',    reason: 'NAP data feeds profile builder' },
  { from: 'citation',     to: 'forum',     reason: 'NAP data feeds outreach venues' },
  { from: 'citation',     to: 'niche-dir', reason: 'batch sibling submissions' },
  { from: 'forum',        to: 'outreach',  reason: 'discovers venues, works them' },
  { from: 'outreach',     to: 'quick',     reason: 'feeds lead funnel' },
  { from: 'quick',        to: 'full',      reason: 'VSL hook upsells to full audit' },
  { from: 'ai-ranking',   to: 'schema',    reason: 'audit recommends schema gaps' },
  { from: 'full',         to: 'schema',    reason: 'audit recommends schema gaps' },
  { from: 'full',         to: 'monthly',   reason: 'full audit feeds retainer reports' },
  { from: 'monthly',      to: 'schema',    reason: 'monthly schema refreshes' },
]
const ALLIANCE_STRENGTH = 50  // matches 50 FET cross-holding from alliances.yaml

// ─────────────────────────────────────────────────────────────────────────────
// Emit: agents/donal/{slug}.md  — DUAL FORMAT
// ─────────────────────────────────────────────────────────────────────────────
//
// This single file works for BOTH:
//   (a) ONE's parser — reads YAML frontmatter (src/engine/agent-md.ts)
//   (b) agent-launch-toolkit  — reads body sections (## Skills, ## Price, ## Secrets)
//
// The body is the Donal prompt verbatim with toolkit-compatible section headers
// appended at the bottom. ONE ignores them (treats them as prompt text);
// the toolkit picks them up (extracts sections).
// ─────────────────────────────────────────────────────────────────────────────

const bar = (score: number): string => {
  // Render 1-5 score as ▁▁▁▁▁ … █████ unicode bar
  const filled = '█'.repeat(score)
  const empty = '░'.repeat(5 - score)
  return filled + empty
}

const personalityTable = (p: Personality): string => {
  const rows = Object.entries(DIMENSION_LABELS)
    .map(([dim, [low, high]]) => {
      const score = p[dim as keyof Personality] as number
      return `| ${dim.padEnd(13)} | ${bar(score)} | ${score} / 5 | ${low} → ${high} |`
    })
    .join('\n')
  const source = p.source
    ? `\n*Scores lifted from \`agency-operator/agents/personalities.py\` (\`${p.source}\`).*`
    : '\n*Scores derived from sibling agent defaults.*'
  return `| Dimension     | Dial  | Score | Spectrum |
|---------------|-------|------:|----------|
${rows}
${source}`
}

const upstreamDownstream = (slug: string): {
  upstream: Array<{ from: string; reason: string }>
  downstream: Array<{ to: string; reason: string }>
} => {
  const upstream = allianceEdges
    .filter(e => e.to === slug)
    .map(e => ({ from: e.from, reason: e.reason }))
  const downstream = allianceEdges
    .filter(e => e.from === slug)
    .map(e => ({ to: e.to, reason: e.reason }))
  return { upstream, downstream }
}

const podDiagram = (slug: string): string => {
  // A compact top-down view of the 10-agent pod with THIS slug marked.
  // Uses the alliance edges to draw rough flow. Same static layout for all
  // agents, with the `slug` highlighted via [[brackets]].
  const mark = (s: string) => (s === slug ? `[[${s.padEnd(10)}]]` : `  ${s.padEnd(10)}  `)
  return `\`\`\`
             ${mark('ai-ranking')}
                    │  flags gaps
                    ▼
             ${mark('citation')}────────┬─────────────┐
              │                  │             │
              ▼                  ▼             ▼
         ${mark('social')}    ${mark('forum')}  ${mark('niche-dir')}
                                 │
                                 ▼
                            ${mark('outreach')}
                                 │
                                 ▼
                            ${mark('quick')}
                                 │  upsell
                                 ▼
                            ${mark('full')}────────┐
                                 │             │
                                 ▼             ▼
                            ${mark('monthly')}  ${mark('schema')}
\`\`\``
}

const pricingRationale = (ep: FuryEndpoint): string => {
  // Derived rules from Donal's alliances.yaml fee ladder.
  const bracket =
    ep.spotFee <= 0.05 ? 'cheap entry-point — discovery agent'
    : ep.spotFee <= 0.10 ? 'mid-tier — repeatable batch work'
    : ep.spotFee <= 0.20 ? 'VSL hook tier — conversion pressure'
    : ep.spotFee <= 0.50 ? 'retainer deliverable — monthly work'
    : 'flagship tier — full audit / consultancy'
  const deep = ep.deepFee !== null
    ? `| deep     | ${ep.deepFee} FET | Premium tier, expanded sections, higher word count, deeper recommendations |`
    : ''
  return `| Tier     | Fee  | When it fires |
|----------|-----:|---------------|
| standard | ${ep.spotFee} FET | ${bracket} |
${deep}`
}

const emitAgentMarkdown = (ep: FuryEndpoint, p: Personality): string => {
  const tokenSlug = ep.token.replace('$', '').toLowerCase()
  const tags = ['donal', 'marketing', 'seo', 'ai-visibility', tokenSlug, 'fet-priced']
  const { upstream, downstream } = upstreamDownstream(ep.slug)

  // Clean single-sentence summary — no mid-word truncation
  const sentences = ep.desc.split('. ').filter(Boolean)
  const oneLineRole = (sentences[0] ?? ep.desc).replace(/\s+/g, ' ').trim() + '.'
  const twoLineRole = sentences.slice(0, 2).join('. ').replace(/\s+/g, ' ').trim() + '.'

  const skillLines: string[] = [
    `  - name: standard`,
    `    price: ${ep.spotFee}`,
    `    tags: [${tokenSlug}, standard]`,
    `    description: "${oneLineRole.replace(/"/g, "'")}"`,
  ]
  if (ep.deepFee !== null && ep.promptDeep) {
    skillLines.push(
      `  - name: deep`,
      `    price: ${ep.deepFee}`,
      `    tags: [${tokenSlug}, deep, premium]`,
      `    description: "Deep tier — expanded analysis, 12-week plans, deeper citations"`,
    )
  }

  const upstreamTable = upstream.length
    ? upstream
        .map(u => `| \`marketing:${u.from}\` | ${u.reason} |`)
        .join('\n')
    : '| — | This agent is the entry point of its chain |'

  const downstreamTable = downstream.length
    ? downstream
        .map(d => `| \`marketing:${d.to}\` | ${d.reason} |`)
        .join('\n')
    : '| — | This agent is a terminal in its chain |'

  const front = `---
name: ${ep.slug}
model: claude-haiku-4-5-20251001
channels: [telegram, web, slack]
group: marketing
sensitivity: 0.4
tags: [${tags.join(', ')}]
skills:
${skillLines.join('\n')}
aliases:
  agentverse: ${ep.agentName}
  token: ${ep.token}
---`

  const body = `

# ${ep.slug}

> ${oneLineRole}

${ep.desc}

---

## Role

${twoLineRole}

Part of **OO Agency Pod #1** — an 11-agent marketing team ingested from Donal's
\`operation-fury-plus\` repo. Runs natively on the ONE substrate with Donal's
prompts, prices, and self-review rules intact. The substrate routes work to it
via pheromone; the same markdown file also ships to Fetch.ai Agentverse for
ASI:One discovery. No Python bridge — the prompt lives in this file and calls
through \`complete()\` via OpenRouter on every request.

## Personality dial

${personalityTable(p)}

## Where this agent sits in the pod

${podDiagram(ep.slug)}

**Upstream — agents that feed this one**

| Upstream agent | Why it feeds here |
|----------------|-------------------|
${upstreamTable}

**Downstream — agents this one feeds**

| Downstream agent | Why it fans out |
|------------------|-----------------|
${downstreamTable}

Every edge above is pre-seeded in TypeDB at \`strength=50\` from Donal's
\`alliances.yaml\` cross-holding (50 FET per pair). The substrate starts with a
warm graph — no cold-start — and updates strengths from real traffic.

## The prompt (lifted verbatim from Donal)

This is the gold. Do not paraphrase, do not summarize. When the substrate calls
this agent, \`complete()\` is invoked with the text below as the system prompt,
with \`{fee}\`, \`{domain}\`, \`{context}\` placeholders filled at call time.

\`\`\`
${ep.promptStandard}
\`\`\`
${ep.promptDeep ? `\n### Deep tier prompt\n\nTriggered when the caller pays the deep tier fee. Same structure, expanded output.\n\n\`\`\`\n${ep.promptDeep}\n\`\`\`\n` : ''}

## Hard rules (from \`operation-fury-plus/common/wrapper.py::self_review\`)

Every response passes through three deterministic checks before returning:

- **No em dashes.** Donal's house style rejects \`—\` anywhere in output.
- **No placeholder text.** No \`[PHONE]\`, \`[EMAIL]\`, \`[INSERT …]\`, \`[PLACEHOLDER]\`.
- **No hedging.** Ban \`it depends\`, \`might be\`, \`could potentially\`.

\`confidence = 1.0 - 0.25 × violations\`. Below 0.7 triggers one revision attempt,
then warns in metadata. The substrate consumes this grade as a \`mark\` / \`warn\`
signal that accumulates on the path from caller to this agent.

## Signal conventions

How other agents call this one through the substrate:

\`\`\`typescript
// From CMO or an upstream agent
net.signal({
  receiver: 'marketing:${ep.slug}',
  data: {
    input: '...',       // domain, niche, brief — per the prompt
    context: { ... },   // client profile, past audits, etc.
    tier: 'standard',   // or 'deep'
    caller_addr: ctx.from,
    payment_tx: 'sui:...',
  },
})
\`\`\`

${downstream.length ? `Fan-out to downstream agents after completion:

\`\`\`typescript
${downstream.map(d => `emit({ receiver: 'marketing:${d.to}', data: result })  // ${d.reason}`).join('\n')}
\`\`\`
` : 'This agent is a terminal node. Results return to caller via `replyTo`.'}

## Pricing

${pricingRationale(ep)}

Paid in FET via x402 on Agentverse; paid in stablecoin on ONE substrate. The
same agent settles either way through its Sui wallet (derived from
\`SUI_SEED + marketing:${ep.slug}\` — no private keys stored).

---

## \`agent-launch-toolkit\` deploy sections

*The sections below are read by \`agent-launch-toolkit\` when deploying to
Agentverse. ONE's parser treats them as prompt text, so a single file ships
to both surfaces without modification.*

## Skills

- standard — ${ep.desc.split('.')[0]} (${ep.spotFee} FET)
${ep.deepFee !== null ? `- deep — Premium tier, expanded analysis (${ep.deepFee} FET)` : ''}

## Price: ${ep.spotFee} FET${ep.deepFee !== null ? ` (standard) · ${ep.deepFee} FET (deep)` : ''}

## Tools

- search
- fetch

## Secrets

- OPENROUTER_API_KEY
- ASI1_API_KEY

---

## Metadata

| Field | Value |
|-------|-------|
| ONE uid | \`marketing:${ep.slug}\` |
| Agentverse handle | \`${ep.agentName}\` |
| Token | \`${ep.token}\` |
| Alliance pod | OO Agency Pod #1 |
| Cross-hold | 50 FET per peer × 10 peers = 500 FET locked |
| Source | \`operation-fury-plus/endpoints/${ep.file}\` |
| Default model | Claude Haiku 4.5 (via OpenRouter) |
| Ingested | 2026-04-11 via \`scripts/ingest-oo.ts\` |

## See also

- [\`docs/Donal-lifecycle.md\`](../../docs/Donal-lifecycle.md) — the full conversion plan
- [\`src/worlds/donal-marketing.ts\`](../../src/worlds/donal-marketing.ts) — WorldSpec with alliance edges
- [\`agents/donal/cmo.md\`](./cmo.md) — the orchestrator that routes briefs to this agent
- [\`agents/donal/README.md\`](./README.md) — full pod roster
`

  return front + body
}

// ─────────────────────────────────────────────────────────────────────────────
// Emit: src/worlds/donal-marketing.ts
// ─────────────────────────────────────────────────────────────────────────────

const emitWorldSpec = (endpoints: FuryEndpoint[]): string => {
  const agentImports = endpoints
    .map(e => `    '${e.slug}',`)
    .join('\n')

  const edgesTs = allianceEdges
    .map(e => `  { from: '${e.from}', to: '${e.to}', strength: ${ALLIANCE_STRENGTH}, reason: '${e.reason}' },`)
    .join('\n')

  return `/**
 * src/worlds/donal-marketing.ts
 *
 * The first public ONE marketing team — 10 SEO/AI-ranking agents ingested
 * from Donal's operation-fury-plus repo, plus a CMO orchestrator.
 *
 * GENERATED by scripts/ingest-oo.ts. Hand-edit with care.
 *
 * Lifecycle:
 *   1. syncWorld(donalMarketing)   → TypeDB units + skills + capabilities
 *   2. wireWorld(donalMarketing)   → live runtime handlers via complete()
 *   3. seedAlliances()             → pre-drawn pheromone paths (strength=50)
 *   4. deployToAgentverse()        → npx agentlaunch deploy per agent
 *
 * Once synced, each agent runs on BOTH surfaces from the same markdown file:
 *   - ONE substrate (Telegram, web, substrate routing)
 *   - Agentverse (ASI:One discovery, FET payments)
 */

import type { WorldSpec } from '@/engine/agent-md'

export const donalMarketingAgents = [
  // CMO orchestrator — free, no price, routes briefs
  'cmo',

  // 10 priced skill agents from operation-fury-plus
${agentImports}
] as const

export const donalMarketing: WorldSpec = {
  name: 'marketing',
  description:
    'ONE marketing team — 11 agents covering AI visibility audits, citation ' +
    'building, outreach, schema, and reporting. Ingested from Donal operation-' +
    'fury-plus. Live on ONE substrate + Fetch.ai Agentverse, priced in FET.',
  agents: [], // populated at runtime by loading agents/donal/*.md
}

/**
 * Pre-drawn pheromone edges lifted from operation-fury-plus/alliances.yaml.
 * Each edge is cross-held at 50 FET between the two agents' tokens.
 *
 * Seeded as TypeDB path relations on first syncWorld() with strength=50.
 * Substrate learns from real traffic on top of these seeds — no cold start.
 */
export const donalMarketingAlliances = [
${edgesTs}
]

export const ALLIANCE_STRENGTH = ${ALLIANCE_STRENGTH}
`
}

// ─────────────────────────────────────────────────────────────────────────────
// Emit: agents/donal/README.md
// ─────────────────────────────────────────────────────────────────────────────

const emitReadme = (endpoints: FuryEndpoint[]): string => {
  const rows = endpoints
    .map(e => `| ${e.slug} | ${e.token} | ${e.spotFee} | ${e.deepFee ?? '—'} | ${e.agentName} |`)
    .join('\n')

  return `# Donal Agents (ingested)

Generated by \`scripts/ingest-oo.ts\` from \`onlineoptimisers/operation-fury-plus\`.

These 10 markdown files are the ONE agents derived from Donal's Fury-plus pod.
Each file is **dual-format**: valid for both ONE's parser (YAML frontmatter) and
agent-launch-toolkit's parser (\`## Skills\`, \`## Price\`, \`## Secrets\` sections).

One file. Two deploy targets. Same source of truth.

## Roster

| Slug | Token | Spot FET | Deep FET | Agentverse name |
|------|-------|---------:|---------:|-----------------|
${rows}

## Lifecycle commands

\`\`\`bash
# Re-ingest from Donal's repos
npx tsx scripts/ingest-oo.ts

# Sync to TypeDB (creates units + skills + alliance paths)
npx tsx scripts/seed-agents.ts

# Deploy ai-ranking (the flagship) to Agentverse
cd agents/donal && npx agentlaunch deploy --source ai-ranking.md

# Deploy all 10 at once
for f in agents/donal/*.md; do
  [ "$(basename $f)" = "README.md" ] && continue
  npx agentlaunch deploy --source "$f"
done

# Tokenize the flagship
npx agentlaunch tokenize --agent agent1q... --symbol AUDIT --chain 97
\`\`\`

## Source of truth

- **Shape** — \`onlineoptimisers/operation-fury-plus\` (\`endpoints/*.py\`, \`common/wrapper.py\`, \`alliances.yaml\`)
- **Content** — \`onlineoptimisers/agency-operator\` (\`agents/specs/*.md\`, \`knowledge/\`)
- **Conversion** — \`scripts/ingest-oo.ts\` (this repo)
- **Lifecycle doc** — \`docs/Donal-lifecycle.md\` (this repo)

## Hard rules (from common/wrapper.py)

All 10 agents enforce the same three rules at response time via self-review:

- No em dashes
- No placeholder text
- No hedging

Confidence score = \`1.0 - 0.25 * violations\`. Below 0.7 triggers one revision.
`
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🐜 Ingesting Donal → ONE\n')

  const FURY_REPO = 'onlineoptimisers/operation-fury-plus'
  const source = hasLocal(FURY_REPO) ? 'local ../donal/' : 'gh api'

  console.log(`📂 Listing ${FURY_REPO}/endpoints/  (via ${source})`)
  const files = listDir(FURY_REPO, 'endpoints').filter(f => f.endsWith('.py'))
  console.log(`   found ${files.length} endpoint files\n`)

  const endpoints: FuryEndpoint[] = []

  for (const file of files) {
    console.log(`📖 ${file}`)
    const src = readFile(FURY_REPO, `endpoints/${file}`)
    const ep = parseFuryEndpoint(file, src)
    if (!ep) continue

    if (ONLY && ep.slug !== ONLY) continue

    console.log(`   → ${ep.slug}  ${ep.token}  spot=${ep.spotFee} deep=${ep.deepFee ?? '—'}`)
    endpoints.push(ep)
  }

  if (endpoints.length === 0) {
    console.error('❌ No endpoints parsed')
    process.exit(1)
  }

  console.log(`\n✅ Parsed ${endpoints.length} endpoints\n`)

  // Load personality table once
  console.log('🧠 Loading personality scores from agency-operator/agents/personalities.py')
  const getPersonality = loadPersonalityTable()

  // Emit agent markdown files
  const outDir = path.join(repoRoot, 'agents', 'donal')
  if (!DRY && !fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  for (const ep of endpoints) {
    const personality = getPersonality(ep.slug)
    const md = emitAgentMarkdown(ep, personality)
    const target = path.join(outDir, `${ep.slug}.md`)

    if (DRY) {
      console.log(`📄 [dry] would write ${path.relative(repoRoot, target)}  (${md.length} chars)`)
    } else {
      fs.writeFileSync(target, md)
      console.log(`📄 wrote ${path.relative(repoRoot, target)}`)
    }
  }

  // Emit README
  const readme = emitReadme(endpoints)
  const readmePath = path.join(outDir, 'README.md')
  if (DRY) {
    console.log(`📄 [dry] would write ${path.relative(repoRoot, readmePath)}`)
  } else {
    fs.writeFileSync(readmePath, readme)
    console.log(`📄 wrote ${path.relative(repoRoot, readmePath)}`)
  }

  // Emit WorldSpec
  const worldsDir = path.join(repoRoot, 'src', 'worlds')
  if (!DRY && !fs.existsSync(worldsDir)) {
    fs.mkdirSync(worldsDir, { recursive: true })
  }

  const world = emitWorldSpec(endpoints)
  const worldPath = path.join(worldsDir, 'donal-marketing.ts')
  if (DRY) {
    console.log(`📄 [dry] would write ${path.relative(repoRoot, worldPath)}`)
  } else {
    fs.writeFileSync(worldPath, world)
    console.log(`📄 wrote ${path.relative(repoRoot, worldPath)}`)
  }

  console.log(`\n🎉 Ingest complete`)
  console.log(`   ${endpoints.length} agent markdown files`)
  console.log(`   1 WorldSpec with ${allianceEdges.length} alliance edges`)
  console.log(`   strength=${ALLIANCE_STRENGTH} per edge (50 FET cross-hold)`)
  console.log(`\nNext:`)
  console.log(`   npx tsx scripts/seed-agents.ts        # sync to TypeDB`)
  console.log(`   npx agentlaunch deploy                 # ship to Agentverse`)
}

main().catch(e => {
  console.error('❌ Fatal:', e)
  process.exit(1)
})
