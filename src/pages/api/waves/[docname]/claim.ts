import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request, params }) => {
  const { sessionId } = (await request.json()) as { sessionId: string }
  const docname = (params as { docname: string }).docname
  const iso = new Date().toISOString()

  const q = `insert $wl isa wave-lock, has wave-lock-id "${docname}", has owner "${sessionId}", has claimed-at "${iso}";`
  try {
    await write(q)
    return new Response(JSON.stringify({ ok: true, owner: sessionId }), { status: 200 })
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    if (error.includes('unique')) {
      return new Response(JSON.stringify({ error: 'Wave locked', owner: '?' }), { status: 409 })
    }
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}
