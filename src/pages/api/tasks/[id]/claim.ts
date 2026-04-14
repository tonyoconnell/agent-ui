import type { APIRoute } from 'astro'
import { read } from '@/lib/typedb'

export const POST: APIRoute = async ({ request, params }) => {
  const { sessionId } = (await request.json()) as { sessionId: string }
  const id = (params as { id: string }).id
  const iso = new Date().toISOString()

  const match = `match $t isa task, has task-id "${id}", has task-status $s; $s = "open";`
  const patch = `delete $s of $t; insert $t has task-status "active", has owner "${sessionId}", has claimed-at "${iso}";`
  const q = `${match} ${patch}`

  try {
    const result = await read(q)
    if (!result || result.length === 0) {
      return new Response(JSON.stringify({ error: 'Already claimed', owner: '?' }), { status: 409 })
    }
    return new Response(JSON.stringify({ ok: true, owner: sessionId, claimedAt: iso }), { status: 200 })
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}
