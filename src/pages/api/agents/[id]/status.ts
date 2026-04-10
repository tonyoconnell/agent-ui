/**
 * POST /api/agents/:id/status — Set agent status (hire / fire)
 *
 * Body: { status: "active" | "inactive" }
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request, params }) => {
  const id = params.id
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

  const { status } = await request.json() as { status: string }
  if (status !== 'active' && status !== 'inactive') {
    return new Response(JSON.stringify({ error: 'status must be active or inactive' }), { status: 400 })
  }

  await write(`
    match $u isa unit, has uid "${id}", has status $s;
    delete $s of $u;
    insert $u has status "${status}";
  `)

  return new Response(JSON.stringify({ ok: true, id, status }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
