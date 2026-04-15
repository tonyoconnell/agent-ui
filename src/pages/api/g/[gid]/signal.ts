/**
 * POST /api/g/:gid/signal — Send a signal scoped to a group
 *
 * Validates that the receiver unit is a member of the group before routing.
 * Dissolves (404) if receiver is not in the group — group boundary enforcement.
 *
 * Body: { receiver: string, data?: unknown }
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ params, request }) => {
  const gid = params.gid as string

  let receiver: string, data: unknown
  try {
    const body = (await request.json()) as { receiver?: string; data?: unknown }
    receiver = body.receiver ?? ''
    data = body.data
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!receiver) {
    return Response.json({ error: 'receiver required' }, { status: 400 })
  }

  // Extract unit id (strip skill suffix: "unit:skill" → "unit")
  const unitId = receiver.includes(':') ? receiver.split(':')[0] : receiver

  // Verify unit is a member of this group
  try {
    const rows = await readParsed(`
      match
        $g isa group, has group-id "${gid}";
        $u isa unit, has uid "${unitId}";
        (member: $u, group: $g) isa membership;
      select $u;
    `)

    if (rows.length === 0) {
      return Response.json(
        { dissolved: true, reason: `unit ${unitId} is not a member of group ${gid}` },
        { status: 404 },
      )
    }
  } catch {
    return Response.json({ error: 'group lookup failed' }, { status: 500 })
  }

  // Forward to main signal endpoint
  const origin = new URL(request.url).origin
  const res = await fetch(`${origin}/api/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ receiver, data }),
  })

  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
