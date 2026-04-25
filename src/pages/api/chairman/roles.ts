/**
 * GET /api/chairman/roles — list role templates from agents/roles/*.md
 *
 * Role markdown is bundled at build time via Vite's import.meta.glob so
 * this module runs cleanly under Cloudflare workerd (no node:fs, no
 * process.cwd()).  The response shape is identical to the previous
 * filesystem implementation.
 */

import type { APIRoute } from 'astro'
import { parse } from '@/engine/agent-md'

const ROLE_FILES = import.meta.glob<string>('/agents/roles/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

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
    const roles: RoleEntry[] = []
    for (const [fullPath, md] of Object.entries(ROLE_FILES)) {
      try {
        const filename = fullPath.split('/').at(-1)!
        const spec = parse(md)
        roles.push({
          filename,
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
