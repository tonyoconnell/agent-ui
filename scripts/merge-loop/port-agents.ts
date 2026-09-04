#!/usr/bin/env bun
// port-agents.ts — PORT mode: rename fields/dead-names in agent *.md files. Zero LLM calls.
// Usage: bun run scripts/merge-loop/port-agents.ts <source-dir> <output-dir> [--dry-run] [--translate <path>]

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const translateIdx = args.indexOf('--translate')
const TRANSLATE_PATH = translateIdx !== -1 ? args[translateIdx + 1] : null
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--translate')
const [sourceDir, outputDir] = positional

if (!sourceDir || !outputDir) {
  console.error('Usage: port-agents.ts <source-dir> <output-dir> [--dry-run] [--translate <path>]')
  process.exit(1)
}

const ABS_SOURCE = path.resolve(sourceDir)
const ABS_OUTPUT = path.resolve(outputDir)

if (!fs.existsSync(ABS_SOURCE)) {
  console.error(`source not found: ${ABS_SOURCE}`)
  process.exit(1)
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

const TAG_MAP: Record<string, string> = {
  knowledge: 'hypothesis',
  connections: 'paths',
  people: 'actors',
  node: 'unit',
  scent: 'signal',
  alarm: 'warn',
  trail: 'path',
  colony: 'group',
}

const MODEL_MAP: Record<string, string> = {
  'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
  'claude-sonnet-4-5': 'claude-sonnet-4-6',
}

function normalizeModel(m: string): string {
  for (const [pat, canon] of Object.entries(MODEL_MAP)) {
    if (m === pat || m.startsWith(`${pat}-`) || m.includes(`/${pat}`)) {
      return m.includes('/') ? m.replace(pat, canon) : canon
    }
  }
  return m
}

function fixTags(tags: unknown): [string[], number] {
  const raw: string[] =
    typeof tags === 'string'
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : Array.isArray(tags)
        ? tags.map(String)
        : []
  let fixed = 0
  const out = raw.map((t) => {
    const r = TAG_MAP[t] ?? t
    if (r !== t) fixed++
    return r
  })
  return [out, fixed]
}

function loadVocab(p: string): Record<string, string> {
  const text = fs.readFileSync(p, 'utf8')
  const section = text.match(/##\s*vocabulary\s*\n([\s\S]*?)(?:\n##|$)/i)?.[1] ?? ''
  const vocab: Record<string, string> = {}
  for (const line of section.split('\n')) {
    const m = line.match(/^\s*(.+?)\s*→\s*(.+?)\s*$/)
    if (m) vocab[m[1]] = m[2]
  }
  return vocab
}

const vocab: Record<string, string> = TRANSLATE_PATH ? loadVocab(TRANSLATE_PATH) : {}

interface Fm {
  name?: string
  agent_name?: string
  'agent-name'?: string
  persona?: string
  model?: string
  channels?: unknown
  group?: string
  sensitivity?: number
  tags?: unknown
  skills?: unknown
  capabilities?: unknown
  [k: string]: unknown
}

let ported = 0,
  skipped = 0,
  fixed = 0

if (!DRY_RUN) fs.mkdirSync(ABS_OUTPUT, { recursive: true })

const files = fs.readdirSync(ABS_SOURCE).filter((f) => f.endsWith('.md') && f !== 'README.md')

for (const file of files) {
  const raw = fs.readFileSync(path.join(ABS_SOURCE, file), 'utf8')
  const m = raw.match(FRONTMATTER)
  if (!m) {
    skipped++
    continue
  }

  const fm = (parseYaml(m[1]) ?? {}) as Fm
  let body = m[2].trim()

  // Apply vocab renames to frontmatter keys/values
  for (const [ext, canon] of Object.entries(vocab)) {
    if (fm[ext] !== undefined && fm[canon] === undefined) {
      fm[canon] = fm[ext]
      delete fm[ext]
    }
    for (const k of Object.keys(fm)) {
      if (String(fm[k]) === ext) {
        fm[k] = canon
        fixed++
      }
    }
  }

  // Field renames
  if (!fm.name && (fm.agent_name || fm['agent-name'] || fm.persona)) {
    fm.name = (fm.agent_name ?? fm['agent-name'] ?? fm.persona) as string
    delete fm.agent_name
    delete fm['agent-name']
    delete fm.persona
  }
  if (fm.capabilities && !fm.skills) {
    fm.skills = fm.capabilities
    delete fm.capabilities
  }

  const name = typeof fm.name === 'string' ? fm.name.trim() : ''
  const heading = body.match(/^#\s+.+\n?/)
  if (heading) body = body.slice(heading[0].length).trim()

  if (!name || !body) {
    skipped++
    continue
  }

  // Dead-name tag fixes
  const [cleanTags, tagFixed] = fixTags(fm.tags)
  fixed += tagFixed

  // Model normalization
  const rawModel = typeof fm.model === 'string' ? fm.model : 'claude-haiku-4-5-20251001'
  const model = normalizeModel(rawModel)
  if (model !== rawModel) fixed++

  // channels: string → array
  const channels = typeof fm.channels === 'string' ? [fm.channels] : Array.isArray(fm.channels) ? fm.channels : ['web']

  const skills = Array.isArray(fm.skills) ? fm.skills : []

  const out: Record<string, unknown> = {
    name,
    model,
    channels,
    group: fm.group ?? 'imported',
    sensitivity: fm.sensitivity ?? 0.5,
    tags: cleanTags,
    ...(skills.length > 0 ? { skills } : {}),
  }

  const content = `---\n${stringifyYaml(out).trim()}\n---\n\n${body}\n`
  const dest = path.join(ABS_OUTPUT, `${name}.md`)

  if (DRY_RUN) {
    console.log(`would write: ${dest}\n${content}\n---`)
  } else {
    fs.writeFileSync(dest, content, 'utf8')
  }
  ported++
}

console.log(`ported:${ported} skipped:${skipped} fixed:${fixed}`)
process.exit(0)
