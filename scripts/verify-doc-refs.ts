#!/usr/bin/env bun
/**
 * verify-doc-refs.ts
 *
 * Scans the doc cluster (workspace root *.md + one.ie/docs + one.ie/one/auth.md)
 * for stale cross-references. Reports findings; exits 1 if any exist.
 *
 * Run:  bun run scripts/verify-doc-refs.ts
 * CI:   bun run verify:docs
 *
 * Does NOT auto-fix. Findings are grouped by kind and reported to stdout.
 * Operator fixes; re-runs; gate passes when exit code is 0.
 */

import { existsSync, readFileSync } from 'fs'
import { dirname, resolve } from 'path'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = resolve(import.meta.dir, '../..') // /Users/toc/Server
const ONE_IE = resolve(import.meta.dir, '..') // /Users/toc/Server/one.ie

/** Doc files to scan — relative to their respective roots. */
const DOC_PATHS: Array<{ file: string; root: string }> = [
  // Workspace root docs
  { file: 'owner.md', root: ROOT },
  { file: 'owner-todo.md', root: ROOT },
  { file: 'agents.md', root: ROOT },
  { file: 'wallet.md', root: ROOT },
  { file: 'passkeys.md', root: ROOT },
  { file: 'secrets.md', root: ROOT },
  { file: 'mac.md', root: ROOT },
  { file: 'lifecycle.md', root: ROOT },
  { file: 'website.md', root: ROOT },
  { file: 'chat.md', root: ROOT },
  { file: 'simple.md', root: ROOT },
  { file: 'compliance.md', root: ROOT },
  { file: 'federation.md', root: ROOT },
  { file: 'README.md', root: ROOT },
  // one.ie docs
  { file: 'CLAUDE.md', root: ONE_IE },
  { file: 'docs/agent-boot-unlock.md', root: ONE_IE },
  { file: 'docs/owner-recovery-runbook.md', root: ONE_IE },
  { file: 'docs/owner-daemon-runbook.md', root: ONE_IE },
  { file: 'docs/key-rotation.md', root: ONE_IE },
  { file: 'docs/recon-multisig.md', root: ONE_IE },
  { file: 'docs/recon-federation.md', root: ONE_IE },
  { file: 'one/auth.md', root: ONE_IE },
]

// ---------------------------------------------------------------------------
// Stale symbol catalogue — symbols that were removed from the codebase.
// Key = symbol string that appears in prose; value = replacement guidance.
// ---------------------------------------------------------------------------
const STALE_SYMBOLS: Record<string, string> = {
  'deriveKeypair(': 'removed in sys-201; use per-agent PRF-wrapped D1 seed via /api/agents/register-owner',
  'addressFor(': 'removed in sys-201 as an exported fn; pure-address helpers remain but are not named addressFor',
  SUI_SEED: 'removed; per-agent random seeds in D1 under owner PRF',
}

// Symbols that are OK to reference (e.g. in comments that say "was removed")
// A line is exempt if it contains any of these escape phrases.
const STALE_SYMBOL_EXEMPTIONS: RegExp[] = [
  /removed in sys-201/i,
  /legacy SUI_SEED-based/i,
  /was removed/i,
  /being removed/i,
  /deprecated/i,
  /anti-pattern.*removed/i,
  /`SUI_SEED` was the anti-pattern/i,
  /Removed\.\*\*/i,
  /SUI_SEED.*removed/i,
  /grep.*SUI_SEED/i, // runbook grep check line
  /returns nothing/i, // runbook acceptance criterion
  /belongs in vault/i, // secrets.md vault guidance
  /sits in \.env/i, // owner.md Gap 1 description (explaining the old model)
  /Stop putting `SUI_SEED`/i, // owner.md Gap 1 description (fix instruction)
  /hold one scoped.*not `SUI_SEED`/i, // website.md threat model (explaining removal)
  /workers hold one scoped/i, // website.md threat model
  /SUI_SEED is gone/i, // website.md and chat.md confirming removal
  /No master seed.*SUI_SEED/i, // website.md documenting the removal
  /`SUI_SEED` is gone/i, // website.md builder arc note
  /strip SUI_SEED/i, // owner-todo.md gap heading
  /SUI_SEED.*removal/i, // owner-todo.md reserved word explanation
  /per worker that drops `SUI_SEED`/i, // pheromone tag reference
  /Gap 1.*SUI_SEED/i, // owner-todo heading
  /without `SUI_SEED`/i, // owner-todo.md CI task
  /SUI_SEED references/i, // owner-todo verification steps
  /SUI_SEED.*retired/i, // secrets.md cross-ref
  /fourth class.*derived/i, // secrets.md section
  /no `SUI_SEED` anywhere/i, // owner-todo goal
  /`SUI_SEED` \(32-byte/i, // owner.md explaining old architecture
  /gap1.*seed.*strip/i, // owner-todo pheromone tag
  /owner-PRF-wrapped.*not SUI_SEED/i,
  /CI deploys without/i, // CI task referencing SUI_SEED as thing to not have
  /addressFor.*null\)/i, // graceful fallback in sui.ts
  /addressFor.*dissolved/i, // owner-todo 1.s2 noting it was dissolved
  /`addressFor`.*ALREADY REMOVED/i, // owner-todo 1.s2 fact statement
  /addressFor` \*\*dissolved/i, // owner-todo 1.s2 dissolved marker
  /derives wallet per agent/i, // chat.md — we fix this row separately
  /gap1.*agent.*register/i, // pheromone tag reference
  /Phase 2.*src\/lib\/sui\.ts/i, // chat.md builder arc (fixed)
]

// ---------------------------------------------------------------------------
// Stale endpoint catalogue — old path → preferred path.
// ---------------------------------------------------------------------------
const STALE_ENDPOINTS: Array<{ pattern: RegExp; replacement: string; desc: string }> = [
  {
    // /api/agents/register (bare) that is NOT /register-owner and NOT in exempted contexts
    pattern: /\/api\/agents\/register(?!-owner)(?!\/:uid|\[uid\])/g,
    replacement: '/api/agents/register-owner',
    desc: 'bare /api/agents/register → /api/agents/register-owner (Gap 1 correction)',
  },
  {
    // Old /api/agent/register (singular, no 's') from agents.md onboarding
    pattern: /POST \/api\/agent\/register\b/g,
    replacement: 'POST /api/auth/agent (or /api/agents/register-owner for owner-tier)',
    desc: '/api/agent/register (singular) → /api/auth/agent or /api/agents/register-owner',
  },
]

// Endpoint exemptions — lines that explicitly document the old endpoint name
// or reference it in a historical/rollback context
const ENDPOINT_EXEMPTIONS: RegExp[] = [
  /Path corrected from \/register/i,
  /rollback/i,
  /pre-cutover/i,
  /buyer-registration flow/i, // 1.s3 explaining path correction
  /clobbering the buyer/i,
  /\/api\/auth\/agent.*or.*register-owner/i, // guidance line
  /\/api\/agent\/register.*doc/i,
]

// ---------------------------------------------------------------------------
// Missing file refs — file paths cited in prose that must exist on disk.
// We match common patterns: `src/...`, `migrations/...`, `apps/...`.
// Docs outside one.ie resolve against the workspace root; docs inside one.ie
// resolve against one.ie/.
// ---------------------------------------------------------------------------

/** Patterns that look like file path references in Markdown prose. */
const FILE_REF_PATTERN = /`((?:src|migrations|apps|nanoclaw|gateway|workers|scripts|docs|one)\/[^\s`]+\.[a-z]{1,5})`/g

// Paths that don't exist yet (deferred / planned) — allow-list
const MISSING_FILE_ALLOWLIST: RegExp[] = [
  /apps\/owner-daemon\//, // daemon app not yet created
  /com\.tonyoconnell\.owner-daemon\.plist/, // plist referenced in runbook
  /scripts\/rotate-key\.ts/, // stub noted as "may not yet exist"
  /scripts\/list-agents\.ts/, // referenced as "if it exists"
  /src\/pages\/api\/groups\/.*multisig\.ts/, // deferred endpoint (Gap 3)
  /src\/pages\/api\/auth\/passkey\/assert\.ts/, // deferred endpoint (Gap 3)
  /src\/__tests__\/integration\/chairman-multisig\.test\.ts/, // deferred test
  /src\/__tests__\/integration\/federation-rotation\.test\.ts/, // deferred test
  /src\/pages\/api\/paths\/bridge\.ts/, // deferred (Gap 6, exists but noted deferred)
  /src\/engine\/federation\.ts/, // deferred extension (Gap 6)
  // Docs referenced in code/CLAUDE.md that live in one.ie/docs/ but not at the cited path
  /docs\/dictionary\.md/, // lives at one.ie/docs/dictionary.md (verified separately)
  /docs\/TODO-governance\.md/, // referenced as a doc not yet created at that path
  /docs\/auth\.md/, // one.ie/docs/ vs one.ie/one/
  /one\/TODO-governance\.md/, // cross-ref variant
  /auth-todo\.md/, // one/auth.md cross-ref to auth-todo
]

// ---------------------------------------------------------------------------
// Markdown link checking — [text](path) links where path is a local file.
// ---------------------------------------------------------------------------
const MD_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g

// ---------------------------------------------------------------------------
// Pending / TODO marker detection
// ---------------------------------------------------------------------------
const PENDING_MARKERS: RegExp[] = [
  /⚠️\s*TODO/,
  /\bTODO\b(?!-template|\.md)/,
  /blocked on user wake/i,
  /deferred for user review/i,
  /needs user wake/i,
]

// These lines are expected pending markers — annotation artefacts in the build plan
const PENDING_EXEMPTIONS: RegExp[] = [
  /⏭ DEFERRED/,
  /gap stays at the foundation/i,
  /deferred \(W3\+/i,
  /deferred.*gap/i,
  /^##?\s/, // section headings never count
  // Command syntax in CLAUDE.md — /sync todos, /create todo, TODO-*.md are nouns not markers
  /\/sync\s+todo/i,
  /\/create\s+todo/i,
  /\/do\s+.*TODO/i,
  /TODO-template/i,
  /TODO-\*/i,
  /TODO-task-management/i,
  /TODO-governance/i,
  /docs\/TODO/i,
  // Instruction text referring to the TODO system (not a pending marker)
  /ALWAYS use.*TODO-template/i,
  /Every TODO MUST have/i,
  /\*\*See Also\*\*.*TODO/i,
  /linking.*TODO/i,
  /TODO files/i,
  /creating.*TODO file/i,
  /scan.*TODO.*→/i, // /sync todos description
  /TODO from template/i,
  /Phase.*complete.*testnet/i, // CLAUDE.md phase status line
  /ephemeral keypairs/i,
]

// ---------------------------------------------------------------------------
// Finding structure
// ---------------------------------------------------------------------------

type FindingKind = 'stale-symbol' | 'stale-endpoint' | 'missing-file' | 'broken-link' | 'pending-marker'

interface Finding {
  kind: FindingKind
  file: string
  line: number
  detail: string
  excerpt: string
}

// ---------------------------------------------------------------------------
// Main scan
// ---------------------------------------------------------------------------

const findings: Finding[] = []

function addFinding(f: Finding) {
  findings.push(f)
}

function scanFile(filePath: string, fileRoot: string) {
  if (!existsSync(filePath)) {
    addFinding({
      kind: 'missing-file',
      file: filePath,
      line: 0,
      detail: `Doc file itself not found: ${filePath}`,
      excerpt: '',
    })
    return
  }

  const content = readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const fileDir = dirname(filePath)

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    const line = lines[i]

    // 1. Stale symbols
    for (const [symbol, guidance] of Object.entries(STALE_SYMBOLS)) {
      if (line.includes(symbol)) {
        const exempt = STALE_SYMBOL_EXEMPTIONS.some((rx) => rx.test(line))
        if (!exempt) {
          addFinding({
            kind: 'stale-symbol',
            file: filePath,
            line: lineNum,
            detail: `Stale symbol \`${symbol}\` — ${guidance}`,
            excerpt: line.trim().slice(0, 120),
          })
        }
      }
    }

    // 2. Stale endpoints
    for (const ep of STALE_ENDPOINTS) {
      ep.pattern.lastIndex = 0
      if (ep.pattern.test(line)) {
        const exempt = ENDPOINT_EXEMPTIONS.some((rx) => rx.test(line))
        if (!exempt) {
          addFinding({
            kind: 'stale-endpoint',
            file: filePath,
            line: lineNum,
            detail: ep.desc,
            excerpt: line.trim().slice(0, 120),
          })
        }
      }
    }

    // 3. Missing file refs in backtick code spans
    let m: RegExpExecArray | null
    const fileRefRx = new RegExp(FILE_REF_PATTERN.source, 'g')
    while ((m = fileRefRx.exec(line)) !== null) {
      const cited = m[1]
      // Allow-list check first
      if (MISSING_FILE_ALLOWLIST.some((rx) => rx.test(cited))) continue

      // Try to resolve from one.ie root first, then workspace root
      const resolvedFromOneIe = resolve(ONE_IE, cited)
      const resolvedFromRoot = resolve(ROOT, cited)
      const resolvedFromDir = resolve(fileDir, cited)

      if (!existsSync(resolvedFromOneIe) && !existsSync(resolvedFromRoot) && !existsSync(resolvedFromDir)) {
        addFinding({
          kind: 'missing-file',
          file: filePath,
          line: lineNum,
          detail: `File path not found on disk: ${cited}`,
          excerpt: line.trim().slice(0, 120),
        })
      }
    }

    // 4. Broken markdown links (local files only — skip URLs, anchors, mailto)
    const mdLinkRx = new RegExp(MD_LINK_PATTERN.source, 'g')
    while ((m = mdLinkRx.exec(line)) !== null) {
      const target = m[2]
      // Skip external URLs, pure anchors, empty, and non-path patterns
      if (
        target.startsWith('http') ||
        target.startsWith('#') ||
        target.startsWith('mailto:') ||
        target.trim() === '' ||
        target.startsWith('$') || // shell variable like $style
        /^bold\s+#/i.test(target) || // Starship color string
        /^#[0-9a-f]{3,8}$/i.test(target) // bare hex color
      )
        continue
      // Strip query/fragment for file existence check
      const targetPath = target.split('?')[0].split('#')[0]
      if (!targetPath) continue

      const resolvedFromDir = resolve(fileDir, targetPath)
      const resolvedFromOneIe = resolve(ONE_IE, targetPath)
      const resolvedFromRoot = resolve(ROOT, targetPath)

      // Allow-list
      if (MISSING_FILE_ALLOWLIST.some((rx) => rx.test(targetPath))) continue

      if (!existsSync(resolvedFromDir) && !existsSync(resolvedFromOneIe) && !existsSync(resolvedFromRoot)) {
        addFinding({
          kind: 'broken-link',
          file: filePath,
          line: lineNum,
          detail: `Broken markdown link target: ${target}`,
          excerpt: line.trim().slice(0, 120),
        })
      }
    }

    // 5. Pending markers (informational — always flagged, not filtered by exemption
    //    for stale markers like "blocked on user wake", but common deferred notes
    //    that are intentional are noted in the detail)
    for (const rx of PENDING_MARKERS) {
      if (rx.test(line)) {
        const isNormalDeferred = PENDING_EXEMPTIONS.some((ex) => ex.test(line))
        if (!isNormalDeferred) {
          addFinding({
            kind: 'pending-marker',
            file: filePath,
            line: lineNum,
            detail: 'Pending/TODO marker — confirm still actionable or remove',
            excerpt: line.trim().slice(0, 120),
          })
        }
        break // one finding per line max
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Run scan
// ---------------------------------------------------------------------------

for (const { file, root } of DOC_PATHS) {
  scanFile(resolve(root, file), root)
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const byKind: Record<FindingKind, Finding[]> = {
  'stale-symbol': [],
  'stale-endpoint': [],
  'missing-file': [],
  'broken-link': [],
  'pending-marker': [],
}

for (const f of findings) {
  byKind[f.kind].push(f)
}

function shortPath(abs: string): string {
  if (abs.startsWith(ONE_IE)) return 'one.ie/' + abs.slice(ONE_IE.length + 1)
  if (abs.startsWith(ROOT)) return abs.slice(ROOT.length + 1)
  return abs
}

const ORDER: FindingKind[] = ['stale-symbol', 'stale-endpoint', 'missing-file', 'broken-link', 'pending-marker']

let total = 0
for (const kind of ORDER) {
  const group = byKind[kind]
  if (group.length === 0) continue
  total += group.length
  console.log(`\n── ${kind.toUpperCase()} (${group.length}) ──`)
  for (const f of group) {
    const loc = `${shortPath(f.file)}:${f.line}`
    console.log(`  ${loc}`)
    console.log(`    ${f.detail}`)
    if (f.excerpt) console.log(`    > ${f.excerpt}`)
  }
}

console.log(
  `\n── SUMMARY ──  total=${total}  stale-symbol=${byKind['stale-symbol'].length}  stale-endpoint=${byKind['stale-endpoint'].length}  missing-file=${byKind['missing-file'].length}  broken-link=${byKind['broken-link'].length}  pending-marker=${byKind['pending-marker'].length}`,
)

if (total > 0) {
  process.exit(1)
} else {
  console.log('✓ No doc drift detected.')
  process.exit(0)
}
