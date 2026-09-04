#!/usr/bin/env bun
/**
 * ast-rewrite.ts — TRANSLATE mode mechanical rewrite engine
 * Usage: bun run scripts/merge-loop/ast-rewrite.ts <source-file> --translate <translate-md> [--out <path>] [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface Rule {
  from: string
  to: string | null
  type: 'import' | 'import-remove' | 'generic'
}

const BUILTIN: Rule[] = [
  { from: '@mui/material', to: '@/components/ui', type: 'import' },
  { from: '@mui/icons-material', to: 'lucide-react', type: 'import' },
  { from: 'antd', to: '@/components/ui', type: 'import' },
  { from: 'axios', to: null, type: 'import-remove' },
  { from: 'next/router', to: 'astro:content', type: 'import' },
]

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function parseTranslateMd(md: string): Rule[] {
  const rules: Rule[] = []
  for (const section of ['## host_primitives', '## ui_primitives']) {
    const idx = md.indexOf(section)
    if (idx === -1) continue
    const end = md.indexOf('\n## ', idx + section.length)
    const block = end === -1 ? md.slice(idx) : md.slice(idx, end)
    for (const line of block.split('\n')) {
      if (!line.includes('→') || line.trimStart().startsWith('#')) continue
      const [from, to] = line.split('→').map((s) => s.trim())
      if (from) rules.push({ from, to: to || null, type: 'generic' })
    }
  }
  return rules
}

function rewrite(src: string, rules: Rule[]): [string, number] {
  let n = 0
  let s = src

  // 1. Import renames / removals
  for (const r of rules) {
    if (r.type === 'import-remove' || (r.type === 'import' && !r.to)) {
      s = s.replace(new RegExp(`^import\\s+.*?from\\s+['"]${esc(r.from)}['"]\\s*;?\\s*$`, 'gm'), () => {
        n++
        return `// TODO: translate — ${r.from} removed`
      })
      s = s.replace(new RegExp(`const\\s+\\w+\\s*=\\s*require\\(['"]${esc(r.from)}['"]\\)\\s*;?`, 'g'), () => {
        n++
        return `// TODO: translate — ${r.from} removed`
      })
    } else if (r.type === 'import' && r.to) {
      s = s.replace(new RegExp(`(from\\s+['"])${esc(r.from)}(['"])`, 'g'), (_, a, b) => {
        n++
        return `${a}${r.to}${b}`
      })
      s = s.replace(new RegExp(`(require\\(['"])${esc(r.from)}(['"]\\))`, 'g'), (_, a, b) => {
        n++
        return `${a}${r.to}${b}`
      })
    }
  }

  // 2. JSX component renames
  const jsx: [RegExp, string | ((m: string, ...g: string[]) => string)][] = [
    [/<Box(\s)/g, (_, ws) => `<div${ws}`],
    [/<\/Box>/g, '</div>'],
    [/<Stack(\s)/g, (_, ws) => `{/* TODO: Stack→div flex */}<div${ws}`],
    [/<\/Stack>/g, '</div>'],
    [/<Typography\s+variant="body2"/g, '<p className="text-sm"'],
    [/<Typography\s+variant="h6"/g, '<h2 className="text-lg font-semibold"'],
    [/<Typography\s+variant="h5"/g, '<h2 className="text-xl font-semibold"'],
    [/<Typography\s+variant="h4"/g, '<h2 className="text-2xl font-semibold"'],
    [/<Typography(\s)/g, (_, ws) => `<p${ws}`],
    [/<\/Typography>/g, '</p>'],
    [/<Chip\s+label=/g, '<Badge label='],
    [/<\/Chip>/g, '</Badge>'],
    [/<Button\s+variant="contained"/g, '<Button'],
    [/<Button\s+variant="outlined"/g, '<Button variant="outline"'],
  ]
  for (const [re, rep] of jsx)
    s = s.replace(re as RegExp, (...args) => {
      n++
      return typeof rep === 'function' ? (rep as Function)(...args) : rep
    })

  // 3. sx prop → TODO hint
  s = s.replace(/\s*sx=\{\{[^}]*\}\}/g, () => {
    n++
    return ' {/* TODO: sx → className */}'
  })

  // 4. axios calls → fetch
  s = s.replace(/axios\.post\(([^,)]+),\s*([^)]+)\)/g, (_, url, body) => {
    n++
    return `fetch(${url}, { method: 'POST', body: JSON.stringify(${body}) })`
  })
  s = s.replace(/axios\.get\(([^)]+)\)/g, (_, url) => {
    n++
    return `fetch(${url}).then(r => r.json())`
  })
  s = s.replace(/axios\.(put|patch|delete)\(([^,)]+),?\s*([^)]*)\)/g, (_, m, url, body) => {
    n++
    return body.trim()
      ? `fetch(${url}, { method: '${m.toUpperCase()}', body: JSON.stringify(${body}) })`
      : `fetch(${url}, { method: '${m.toUpperCase()}' })`
  })

  // 5. Generic string substitutions from translate.md
  for (const r of rules) {
    if (r.type === 'generic' && r.to)
      s = s.replace(new RegExp(esc(r.from), 'g'), () => {
        n++
        return r.to!
      })
  }

  return [s, n]
}

// --- main ---
const args = process.argv.slice(2)
const sourceArg = args.find((a) => !a.startsWith('--'))
const translateArg = args.includes('--translate') ? args[args.indexOf('--translate') + 1] : null
const outArg = args.includes('--out') ? args[args.indexOf('--out') + 1] : null
const dryRun = args.includes('--dry-run')

if (!sourceArg) {
  process.stderr.write('Usage: ast-rewrite.ts <source-file> [--translate <translate-md>] [--out <path>] [--dry-run]\n')
  process.exit(1)
}

const mdRules = translateArg ? parseTranslateMd(readFileSync(resolve(translateArg), 'utf8')) : []
const [result, total] = rewrite(readFileSync(resolve(sourceArg), 'utf8'), [...BUILTIN, ...mdRules])
const todos = (result.match(/\/\/ TODO:/g) || []).length

process.stderr.write(`rewrote: ${total} substitutions, ${todos} TODOs remaining\n`)
if (dryRun) process.exit(0)

if (outArg) writeFileSync(resolve(outArg), result, 'utf8')
else process.stdout.write(result)
process.exit(0)
