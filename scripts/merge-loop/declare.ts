#!/usr/bin/env bun
// declare.ts — generate features.md manifest for a source directory
// Usage: bun run scripts/merge-loop/declare.ts <source-path> [--dry-run]

import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const [, , sourcePath, ...flags] = process.argv
const DRY_RUN = flags.includes('--dry-run')

if (!sourcePath) {
  console.error('Usage: declare.ts <source-path> [--dry-run]')
  process.exit(1)
}

const ABS_SOURCE = path.resolve(sourcePath)
if (!fs.existsSync(ABS_SOURCE)) {
  console.error(`Source not found: ${ABS_SOURCE}`)
  process.exit(1)
}

// Load env
const envFile = path.join(path.dirname(import.meta.dir), '.env')
const envRaw = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : ''
const env: Record<string, string> = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY ?? ''

// Compute sha of top-level listing
const topLevel = fs.readdirSync(ABS_SOURCE).sort()
const sourceSha = crypto.createHash('sha256').update(topLevel.join('\n')).digest('hex').slice(0, 16)

const cacheDir = path.join(os.homedir(), '.merge-loop', 'indexes', sourceSha)
const cacheFile = path.join(cacheDir, 'features.md')

if (fs.existsSync(cacheFile)) {
  console.log(`cache hit: ${cacheFile}`)
  process.exit(0)
}

// Walk source dir (max depth 3)
interface FileEntry {
  rel: string
  size: number
}
function walk(dir: string, base: string, depth: number, out: FileEntry[]) {
  if (depth > 3) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '.cache'].includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    const rel = path.relative(base, full)
    if (entry.isDirectory()) {
      walk(full, base, depth + 1, out)
    } else {
      out.push({ rel, size: fs.statSync(full).size })
    }
  }
}

const files: FileEntry[] = []
walk(ABS_SOURCE, ABS_SOURCE, 1, files)
files.sort((a, b) => a.rel.localeCompare(b.rel))
const fileList = files
  .slice(0, 200)
  .map((f) => `${f.rel} (${f.size}B)`)
  .join('\n')
const tokenEstimate = Math.ceil(fileList.length / 4)

if (DRY_RUN) {
  console.log(
    `source: ${ABS_SOURCE}\nsha: ${sourceSha}\nfiles: ${files.length} (showing up to 200)\ntokens (est): ${tokenEstimate}\n\n${fileList}`,
  )
  process.exit(0)
}

if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY not set')
  process.exit(1)
}

const prompt = `You are analyzing a source repository to generate a features manifest.
Source: ${ABS_SOURCE}
Files (up to 200, sorted):
${fileList}

Generate a YAML features.md with this schema:
---
source: ${ABS_SOURCE}
generated: ${new Date().toISOString()}
source_sha: ${sourceSha}
---
features:
  - id: <slug>   # kebab-case, unique
    files: ["<glob>"]   # which files contain this feature
    exports: ["<symbol>"]  # key exports/functions/classes
    deps: ["<dep>"]   # external dependencies used
    loc: <int>   # estimated LOC
    claims: "<one-line description>"
    mode_hint: PORT | TRANSLATE | SYNTHESIZE
    # PORT = same idioms, just schema/naming differs
    # TRANSLATE = right idea, wrong host/ui primitives
    # SYNTHESIZE = right concept, wrong architecture

Be concise. List distinct features, not individual files.
Output ONLY the YAML. No prose.`

const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'anthropic/claude-haiku-4-5',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
  }),
})

if (!res.ok) {
  console.error(`OpenRouter error: ${res.status} ${await res.text()}`)
  process.exit(1)
}

const json = (await res.json()) as { choices: { message: { content: string } }[] }
const content = json.choices?.[0]?.message?.content ?? ''
if (!content) {
  console.error('Empty response from model')
  process.exit(1)
}

fs.mkdirSync(cacheDir, { recursive: true })
fs.writeFileSync(cacheFile, content, 'utf8')
console.log(`written: ${cacheFile}\nfiles: ${files.length}\nsha: ${sourceSha}`)
process.exit(0)
