import type { APIRoute } from 'astro'
import { viewEscrow } from '@/lib/sui'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const id = params.id
  if (!id || typeof id !== 'string' || id.length < 4) {
    return new Response(JSON.stringify({ error: 'invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const view = await viewEscrow(id)
  return new Response(JSON.stringify(view), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=2',
    },
  })
}
