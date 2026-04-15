import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Read uid from cookie
    const cookieHeader = request.headers.get('cookie') ?? ''
    const uid = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('one-uid='))
      ?.split('=')[1]

    if (!uid) {
      return new Response(JSON.stringify({ error: 'No identity cookie found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Call persist.forget(uid)
    const net = await getNet()
    await net.forget(uid)

    // 3. Clear cookie + return ok
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'one-uid=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
