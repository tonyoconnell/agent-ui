#!/usr/bin/env bun
// resolve.ts — resolve a source alias/path/URL to a local path
// Usage: bun run scripts/merge-loop/resolve.ts <source>

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

export function resolveSource(alias: string): { path: string; translateMd?: string; description?: string } | null {
  const regFile = path.join(os.homedir(), '.merge-loop', 'sources', `${alias}.yml`)
  if (fs.existsSync(regFile)) {
    const lines = fs.readFileSync(regFile, 'utf8').split('\n')
    const get = (k: string) =>
      lines
        .find((l) => l.startsWith(`${k}:`))
        ?.slice(k.length + 1)
        ?.trim()
        ?.replace(/^["']|["']$/g, '')
    const p = get('path')?.replace('~', os.homedir())
    return p
      ? { path: p, translateMd: get('translate')?.replace('~', os.homedir()), description: get('description') }
      : null
  }
  const abs = alias.startsWith('~') ? alias.replace('~', os.homedir()) : path.resolve(alias)
  if (fs.existsSync(abs)) return { path: abs }
  return null
}

// CLI
if (import.meta.main) {
  const [, , src] = process.argv
  if (!src) {
    console.error('Usage: resolve.ts <source>')
    process.exit(1)
  }
  const r = resolveSource(src)
  if (!r) {
    console.error(`Cannot resolve: ${src}`)
    process.exit(1)
  }
  console.log(JSON.stringify(r, null, 2))
}
