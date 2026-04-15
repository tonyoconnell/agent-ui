/**
 * POST /api/ask — Signal + wait for outcome
 *
 * Body: { receiver: string, data?: unknown, timeout?: number, from?: string }
 * Response: { result?: unknown, timeout?: true, dissolved?: true, failure?: true, latency: number }
 *
 * Default timeout: 30000ms. Max: 120000ms.
 */
import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'

const DEFAULT_TIMEOUT = 30_000
const MAX_TIMEOUT = 120_000

export const POST: APIRoute = async ({ request }) => {
  const started = Date.now()
  try {
    const body = (await request.json()) as {
      receiver?: string
      data?: unknown
      timeout?: number
      from?: string
    }
    if (!body?.receiver || typeof body.receiver !== 'string') {
      return new Response(JSON.stringify({ error: 'receiver required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const timeout = Math.min(Math.max(body.timeout ?? DEFAULT_TIMEOUT, 100), MAX_TIMEOUT)
    const net = await getNet()
    const outcome = await net.ask({ receiver: body.receiver, data: body.data }, body.from ?? 'api-ask', timeout)
    return new Response(JSON.stringify({ ...outcome, latency: Date.now() - started }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err), latency: Date.now() - started }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
