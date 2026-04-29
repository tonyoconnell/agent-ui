import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'

export const prerender = false

export const ALL: APIRoute = async ({ request }) => {
  try {
    const res = await auth.handler(request)
    // Dev instrumentation: if Better Auth returned a 5xx, dump the body to
    // the server terminal so we can see the cause. Cloned so we don't drain
    // the body the client will receive.
    if (res.status >= 500) {
      try {
        const cloned = res.clone()
        const body = await cloned.text()
        console.error(`[Auth ${res.status}] ${request.method} ${new URL(request.url).pathname}`, body)
      } catch (readErr) {
        console.error(`[Auth ${res.status}] ${request.method} ${request.url} (body unreadable)`, readErr)
      }
    }
    return res
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error('[Auth Error — threw out of handler]', msg, stack)
    return new Response(JSON.stringify({ error: msg || 'Internal server error', stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
