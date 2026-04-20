/**
 * GET /api/chairman/roles — list role templates from agents/roles/*.md
 *
 * Scans the roles directory, parses each markdown via engine's parse(),
 * returns a lightweight list for the RoleCatalog UI. No auth — this is
 * a directory listing of public templates.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { APIRoute } from 'astro'
import { parse } from '@/engine/agent-md'

const ROLES_DIR = join(process.cwd(), 'agents', 'roles')

interface RoleEntry {
  filename: string
  name: string
  group: string | null
  skills: Array<{ name: string; price?: number; tags?: string[] }>
  tags: string[]
  prompt: string
}

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    const files = await readdir(ROLES_DIR)
    const mdFiles = files.filter((f) => f.endsWith('.md'))

    const roles: RoleEntry[] = []
    for (const file of mdFiles) {
      try {
        const md = await readFile(join(ROLES_DIR, file), 'utf-8')
        const spec = parse(md)
        roles.push({
          filename: file,
          name: spec.name,
          group: spec.group ?? null,
          skills: (spec.skills ?? []).map((s) => ({
            name: s.name,
            price: s.price,
            tags: s.tags,
          })),
          tags: spec.tags ?? [],
          prompt: spec.prompt ?? '',
        })
      } catch {
        // skip unparseable file — don't let one bad template block the catalog
      }
    }

    return new Response(JSON.stringify({ roles }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message, roles: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
