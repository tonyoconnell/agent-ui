import type { APIRoute } from 'astro'
import { readParsed, writeSilent } from '@/lib/typedb'

/**
 * Subscribe a unit to a set of tags.
 * POST /api/subscribe { receiver: string, tags: string[] }
 * → { ok: true, receiver, tags }
 *
 * GET /api/subscribe?receiver=<id>
 * → { receiver, tags: string[] }
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { receiver?: string; tags?: string[] }
    if (!body.receiver || !Array.isArray(body.tags)) {
      return Response.json({ error: 'receiver and tags[] required' }, { status: 400 })
    }

    for (const tag of body.tags) {
      const safeTag = String(tag).replace(/"/g, '\\"')
      writeSilent(`
        match $u isa unit, has uid "${body.receiver}";
        insert $u has tag "${safeTag}";
      `)
    }

    return Response.json({ ok: true, receiver: body.receiver, tags: body.tags })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}

export const GET: APIRoute = async ({ url }) => {
  const receiver = url.searchParams.get('receiver')
  if (!receiver) {
    return Response.json({ error: 'receiver required' }, { status: 400 })
  }

  try {
    const rows = await readParsed(`
      match $u isa unit, has uid "${receiver}", has tag $t;
      select $t;
    `).catch(() => [] as Record<string, unknown>[])
    const tags = (rows as Record<string, unknown>[]).map((r) => r.t).filter(Boolean)
    return Response.json({ receiver, tags })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
