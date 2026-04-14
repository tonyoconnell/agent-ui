import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request, params }) => {
  const { sessionId } = (await request.json()) as { sessionId: string }
  const docname = (params as { docname: string }).docname

  const q = `match $wl isa wave-lock, has wave-lock-id "${docname}", has owner $o; $o = "${sessionId}"; delete $wl;`

  try {
    const result = (await write(q)) as Array<unknown>
    if (!result || result.length === 0) {
      return new Response(JSON.stringify({ error: 'Not owner' }), { status: 403 })
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}
