/**
 * POST /api/query — Run TypeQL against the world
 *
 * Body: { query: string, type?: "read" | "write" }
 * Returns: { rows: Record<string, unknown>[] }
 */
import type { APIRoute } from 'astro'
import { read, write, parseAnswers } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const { query: tql, type = 'read' } = await request.json() as {
    query: string
    type?: 'read' | 'write'
  }

  if (!tql) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 })
  }

  const answers = type === 'write' ? await write(tql) : await read(tql)
  const rows = parseAnswers(answers)
  return new Response(JSON.stringify({ rows }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
