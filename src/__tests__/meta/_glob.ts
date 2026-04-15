/**
 * Tiny sync glob — no dep, fast enough for meta tests.
 * Walks a root directory, returns absolute paths matching any of the given
 * extensions. Skips node_modules, .git, dist, .vitest, .astro.
 */
import { readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SKIP = new Set(['node_modules', '.git', 'dist', '.vitest', '.astro', '__pycache__', 'archive'])

export function fastGlob(root: string, exts: string[]): string[] {
  const out: string[] = []
  const abs = resolve(process.cwd(), root)
  walk(abs, exts, out)
  return out
}

function walk(dir: string, exts: string[], out: string[]) {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue
    const full = join(dir, name)
    let s: ReturnType<typeof statSync>
    try {
      s = statSync(full)
    } catch {
      continue
    }
    if (s.isDirectory()) walk(full, exts, out)
    else if (exts.some((e) => name.endsWith(e))) out.push(full)
  }
}
