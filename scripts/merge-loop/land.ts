#!/usr/bin/env bun

// land.ts — LAND stage: copy/transform source files into one.ie trunk
// Reads features.md, applies PORT (copy+import-normalize) or TRANSLATE (ast-rewrite)
// per feature. Skips agent .md files (handled by port-agents.ts) and SYNTHESIZE features.
//
// Usage:
//   bun run scripts/merge-loop/land.ts <source-path> [--translate <md>] [--feature <id>] [--dry-run]

import { spawnSync } from 'node:child_process'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const argv = process.argv.slice(2)
const DRY_RUN = argv.includes('--dry-run')
const sourcePath = argv.find((a) => !a.startsWith('--'))
const translateArg = argv.includes('--translate') ? argv[argv.indexOf('--translate') + 1] : undefined
const featureFilter = argv.includes('--feature') ? argv[argv.indexOf('--feature') + 1] : null

if (!sourcePath) {
  console.error('Usage: land.ts <source-path> [--translate <md>] [--feature <id>] [--dry-run]')
  process.exit(1)
}

const ABS_SOURCE = path.resolve(sourcePath)
const REPO_ROOT = path.resolve(path.join(import.meta.dir, '..', '..'))
const SCRIPT_DIR = import.meta.dir

// ── sha (same formula as declare.ts) ─────────────────────────────────────────
const topLevel = fs.readdirSync(ABS_SOURCE).sort().join('\n')
const sourceSha = crypto.createHash('sha256').update(topLevel).digest('hex').slice(0, 16)
const featuresFile = path.join(os.homedir(), '.merge-loop', 'indexes', sourceSha, 'features.md')

if (!fs.existsSync(featuresFile)) {
  console.error(`No features.md for ${ABS_SOURCE} (sha: ${sourceSha}). Run declare.ts first.`)
  process.exit(1)
}

// ── parse features.md ─────────────────────────────────────────────────────────
interface Feature {
  id: string
  files: string[]
  mode: 'PORT' | 'TRANSLATE' | 'SYNTHESIZE' | 'SKIP'
}

function parseFeatures(md: string): Feature[] {
  const features: Feature[] = []
  // Split on feature entries (each starts with "  - id:")
  const blocks = md.split(/(?=\n {2}- id:)/).slice(1)
  for (const block of blocks) {
    const id = block.match(/- id:\s*([^\n]+)/)?.[1]?.trim()
    if (!id) continue

    // Parse files: handles both ["a","b"] and [a, b] and multi-line YAML list
    let files: string[] = []
    const filesInline = block.match(/files:\s*\[([^\]]*)\]/)
    if (filesInline) {
      files = filesInline[1]
        .split(',')
        .map((f) => f.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else {
      // Multi-line YAML list: "    - path/to/file"
      const filesSection = block.match(/files:([\s\S]*?)(?:\n {4}\w|\n {2}\w|$)/)
      if (filesSection) {
        files = filesSection[1]
          .split('\n')
          .filter((l) => l.trim().startsWith('- '))
          .map((l) =>
            l
              .replace(/^\s*-\s*/, '')
              .replace(/^["']|["']$/g, '')
              .trim(),
          )
      }
    }

    const mode = (block.match(/mode_hint:\s*(PORT|TRANSLATE|SYNTHESIZE|SKIP)/)?.[1] ?? 'PORT') as Feature['mode']
    features.push({ id, files, mode })
  }
  return features
}

// ── translate config ──────────────────────────────────────────────────────────
interface TranslateConfig {
  hostPrimitives: Record<string, string>
  targetMap: Array<[string, string]> // ordered: first match wins
}

// Default target_map: strip source prefix, land under one.ie/src/
const DEFAULT_TARGET_MAP: Array<[string, string]> = [
  ['src/components/', 'components/imported/'],
  ['src/lib/', 'lib/imported/'],
  ['src/utils/', 'lib/imported/'],
  ['src/hooks/', 'hooks/imported/'],
  ['src/types/', 'lib/types/imported/'],
  ['components/', 'components/imported/'],
  ['lib/', 'lib/imported/'],
  ['utils/', 'lib/imported/'],
  ['src/', 'lib/imported/'],
]

function loadTranslate(mdPath: string): TranslateConfig {
  const md = fs.readFileSync(path.resolve(mdPath), 'utf8')
  const cfg: TranslateConfig = { hostPrimitives: {}, targetMap: [...DEFAULT_TARGET_MAP] }

  // ## host_primitives: lines like "axios → fetch"
  const hpIdx = md.indexOf('## host_primitives')
  if (hpIdx !== -1) {
    const end = md.indexOf('\n## ', hpIdx + 1)
    const block = end === -1 ? md.slice(hpIdx) : md.slice(hpIdx, end)
    for (const line of block.split('\n')) {
      if (!line.includes('→') || line.trimStart().startsWith('#')) continue
      const [from, to] = line.split('→').map((s) => s.trim())
      if (from && to) cfg.hostPrimitives[from] = to
    }
  }

  // ## target_map: lines like "src/components/ → components/agency/"
  // When present, PREPEND before defaults so source-specific rules win
  const tmIdx = md.indexOf('## target_map')
  if (tmIdx !== -1) {
    const end = md.indexOf('\n## ', tmIdx + 1)
    const block = end === -1 ? md.slice(tmIdx) : md.slice(tmIdx, end)
    const custom: Array<[string, string]> = []
    for (const line of block.split('\n')) {
      if (!line.includes('→') || line.trimStart().startsWith('#')) continue
      const [from, to] = line.split('→').map((s) => s.trim())
      if (from && to) custom.push([from, to])
    }
    cfg.targetMap = [...custom, ...DEFAULT_TARGET_MAP]
  }

  return cfg
}

// ── path mapping ──────────────────────────────────────────────────────────────
// Returns path relative to one.ie/src/ (e.g. "components/imported/Chat.tsx")
function mapToTarget(relFile: string, cfg: TranslateConfig): string {
  for (const [from, to] of cfg.targetMap) {
    if (relFile.startsWith(from)) {
      return to + relFile.slice(from.length)
    }
  }
  return `imported/${relFile}`
}

// ── import normalizer ─────────────────────────────────────────────────────────
// Converts relative imports to @/ aliases using the target_map
function normalizeImports(source: string, absSourceFile: string, cfg: TranslateConfig): string {
  const sourceDir = path.dirname(absSourceFile)

  return source.replace(/from\s+(['"])(\.\.?\/[^'"]+)(['"])/g, (_, q1, importPath, q2) => {
    const resolved = path.resolve(sourceDir, importPath)
    const relToRoot = path.relative(ABS_SOURCE, resolved)

    // Apply target_map to find the canonical @/ path
    const mapped = mapToTarget(relToRoot, cfg)
    return `from ${q1}@/${mapped}${q2}`
  })
}

// ── asset copy (binary files) ─────────────────────────────────────────────────
const BINARY_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
])

// ── is agent file (skip — port-agents.ts handles these) ──────────────────────
function isAgentFile(relFile: string): boolean {
  return relFile.endsWith('.md') && (relFile.includes('agent') || relFile.includes('/agents/'))
}

// ── land PORT ─────────────────────────────────────────────────────────────────
function landPort(relFile: string, cfg: TranslateConfig): boolean {
  const srcAbs = path.join(ABS_SOURCE, relFile)
  if (!fs.existsSync(srcAbs)) return false

  const targetRel = mapToTarget(relFile, cfg)
  const targetAbs = path.join(REPO_ROOT, 'src', targetRel)

  const ext = path.extname(relFile).toLowerCase()
  console.log(`  PORT      ${relFile} → src/${targetRel}`)
  if (DRY_RUN) return true

  fs.mkdirSync(path.dirname(targetAbs), { recursive: true })

  if (BINARY_EXTS.has(ext)) {
    fs.copyFileSync(srcAbs, targetAbs)
  } else {
    const src = fs.readFileSync(srcAbs, 'utf8')
    fs.writeFileSync(targetAbs, normalizeImports(src, srcAbs, cfg), 'utf8')
  }
  return true
}

// ── land TRANSLATE ────────────────────────────────────────────────────────────
function landTranslate(relFile: string, cfg: TranslateConfig): boolean {
  const srcAbs = path.join(ABS_SOURCE, relFile)
  if (!fs.existsSync(srcAbs)) return false

  const targetRel = mapToTarget(relFile, cfg)
  const targetAbs = path.join(REPO_ROOT, 'src', targetRel)
  console.log(`  TRANSLATE ${relFile} → src/${targetRel}`)
  if (DRY_RUN) return true

  fs.mkdirSync(path.dirname(targetAbs), { recursive: true })

  const rewriteArgs = [path.join(SCRIPT_DIR, 'ast-rewrite.ts'), srcAbs, '--out', targetAbs]
  if (translateArg) rewriteArgs.push('--translate', translateArg)

  const r = spawnSync('bun', rewriteArgs, { stdio: ['ignore', 'ignore', 'pipe'] })
  if (r.status !== 0) {
    console.error(`    rewrite failed: ${r.stderr?.toString().trim()}`)
    return false
  }

  // Post-process: normalize remaining relative imports
  if (fs.existsSync(targetAbs)) {
    const out = fs.readFileSync(targetAbs, 'utf8')
    fs.writeFileSync(targetAbs, normalizeImports(out, srcAbs, cfg), 'utf8')
  }
  return true
}

// ── main ──────────────────────────────────────────────────────────────────────
const md = fs.readFileSync(featuresFile, 'utf8')
const features = parseFeatures(md)
const cfg = translateArg ? loadTranslate(translateArg) : { hostPrimitives: {}, targetMap: DEFAULT_TARGET_MAP }

if (features.length === 0) {
  console.log('No features parsed from features.md — nothing to land.')
  process.exit(0)
}

let portCount = 0
let translateCount = 0
let synthDeferred = 0
let skipCount = 0

console.log(`\nLanding from ${ABS_SOURCE}${DRY_RUN ? ' (dry-run)' : ''}`)
console.log(`Features: ${features.length}${featureFilter ? ` (filtered: ${featureFilter})` : ''}\n`)

for (const feature of features) {
  if (featureFilter && feature.id !== featureFilter) continue

  if (feature.mode === 'SYNTHESIZE') {
    console.log(`  DEFER     [${feature.id}] — SYNTHESIZE requires Opus; run separately`)
    synthDeferred++
    continue
  }

  for (const file of feature.files) {
    if (isAgentFile(file)) {
      skipCount++
      continue
    }

    if (feature.mode === 'PORT') {
      landPort(file, cfg) ? portCount++ : skipCount++
    } else if (feature.mode === 'TRANSLATE') {
      landTranslate(file, cfg) ? translateCount++ : skipCount++
    } else {
      skipCount++
    }
  }
}

const dryNote = DRY_RUN ? ' (dry-run — no files written)' : ''
console.log(
  `\nlanded: ${portCount} PORT, ${translateCount} TRANSLATE, ${synthDeferred} SYNTHESIZE deferred, ${skipCount} skipped${dryNote}`,
)
