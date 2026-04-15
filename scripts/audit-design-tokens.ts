#!/usr/bin/env bun
/**
 * Audit design tokens — the CI drift gate for the design system.
 *
 * Scans src/components, src/pages (minus /design), src/layouts for:
 *   - hex color literals        (#fff, #aabbcc, #aabbccdd)
 *   - hsl()/rgb()/rgba() LITERALS (excluding the approved hsl(var(--...)) pattern)
 *   - tailwind arbitrary colors (bg-[#...], text-[#...], etc.)
 *
 * Compares against .audit-baseline.json. Exits 1 if count > baseline
 * (new drift added). Exits 0 if count <= baseline (drift held or cleaned).
 *
 * Run:  bun run scripts/audit-design-tokens.ts
 * Seed: bun run scripts/audit-design-tokens.ts --seed
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const BASELINE = join(ROOT, '.audit-baseline.json')

const ROOTS = [
  { dir: 'src/components', skip: [] as string[] },
  { dir: 'src/pages', skip: ['design.astro'] },
  { dir: 'src/layouts', skip: [] as string[] },
]

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'hex', re: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g },
  { name: 'hsl-literal', re: /\bhsla?\(\s*\d[^)]*\)/g },
  { name: 'rgb-literal', re: /\brgba?\(\s*\d[^)]*\)/g },
  {
    name: 'tw-arbitrary',
    re: /\b(?:bg|text|border|from|to|via|ring|outline|fill|stroke|shadow|divide)-\[#[0-9a-fA-F]{3,8}\]/g,
  },
]

const HSL_VAR_GUARD = /hsla?\(\s*var\(/ // allowed pattern — do not flag

type Finding = { file: string; line: number; literal: string; context: string }

async function walk(dir: string, skip: string[], acc: string[] = []): Promise<string[]> {
  let entries: Awaited<ReturnType<typeof readdir>>
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      await walk(full, skip, acc)
    } else if (/\.(tsx?|astro)$/.test(e.name) && !skip.includes(e.name)) {
      acc.push(full)
    }
  }
  return acc
}

async function scanFile(file: string): Promise<Finding[]> {
  const src = await readFile(file, 'utf8')
  const lines = src.split('\n')
  const out: Finding[] = []
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    // Tailwind arbitrary already wraps a hex — claim that span, then scan the rest.
    const arbitraryRanges: Array<[number, number]> = []
    for (const { name, re } of PATTERNS) {
      if (name !== 'tw-arbitrary') continue
      re.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = re.exec(rawLine)) !== null) {
        arbitraryRanges.push([m.index, m.index + m[0].length])
        out.push({
          file: relative(ROOT, file),
          line: i + 1,
          literal: m[0],
          context: rawLine.trim().slice(0, 120),
        })
      }
    }
    const inArbitrary = (pos: number) => arbitraryRanges.some(([a, b]) => pos >= a && pos < b)
    for (const { name, re } of PATTERNS) {
      if (name === 'tw-arbitrary') continue
      re.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = re.exec(rawLine)) !== null) {
        if (inArbitrary(m.index)) continue
        if ((m[0].startsWith('hsl(') || m[0].startsWith('hsla(')) && HSL_VAR_GUARD.test(rawLine.slice(m.index))) {
          continue
        }
        out.push({
          file: relative(ROOT, file),
          line: i + 1,
          literal: m[0],
          context: rawLine.trim().slice(0, 120),
        })
      }
    }
  }
  return out
}

async function loadBaseline(): Promise<number> {
  try {
    const raw = await readFile(BASELINE, 'utf8')
    return JSON.parse(raw).count ?? 0
  } catch {
    return 0
  }
}

async function writeBaseline(count: number, files: string[]): Promise<void> {
  await writeFile(BASELINE, `${JSON.stringify({ count, files }, null, 2)}\n`)
}

async function main() {
  const seed = process.argv.includes('--seed')

  const files: string[] = []
  for (const { dir, skip } of ROOTS) {
    await walk(join(ROOT, dir), skip, files)
  }

  const findings: Finding[] = []
  for (const file of files) {
    findings.push(...(await scanFile(file)))
  }

  const byFile = new Map<string, Finding[]>()
  for (const f of findings) {
    const list = byFile.get(f.file) ?? []
    list.push(f)
    byFile.set(f.file, list)
  }

  console.log(`Design token audit: ${findings.length} finding(s) across ${byFile.size} file(s)`)
  for (const [file, list] of byFile) {
    console.log(`\n  ${file}  (${list.length})`)
    for (const f of list) {
      console.log(`    ${f.line}: ${f.literal}  │  ${f.context}`)
    }
  }

  const baseline = await loadBaseline()

  if (seed) {
    await writeBaseline(findings.length, [...byFile.keys()])
    console.log(`\n✓ Baseline written: ${findings.length} findings locked in .audit-baseline.json`)
    process.exit(0)
  }

  console.log(`\nBaseline: ${baseline}. Current: ${findings.length}.`)
  if (findings.length > baseline) {
    console.error(`✗ Drift INCREASED by ${findings.length - baseline}. Reject.`)
    process.exit(1)
  }
  if (findings.length < baseline) {
    console.log(`✓ Drift DECREASED by ${baseline - findings.length}. Re-run with --seed to lower baseline.`)
  } else {
    console.log('✓ Drift held at baseline.')
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
