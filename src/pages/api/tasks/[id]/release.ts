import type { APIRoute } from 'astro'
import { read } from '@/lib/typedb'

export const POST: APIRoute = async ({ request, params }) => {
  const { sessionId } = (await request.json()) as { sessionId: string }
  const id = (params as { id: string }).id

  const match = `match $t isa task, has task-id "${id}", has task-status $s, has owner $o, has claimed-at $c; $o = "${sessionId}";`
  const patch = `delete $s of $t; delete $o of $t; delete $c of $t; insert $t has task-status "open";`
  const q = `${match} ${patch}`

  try {
    const result = await read(q)
    if (!result || result.length === 0) {
      return new Response(JSON.stringify({ error: 'Not owner or not claimed' }), { status: 403 })
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}
