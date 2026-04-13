/**
 * POST /api/agents/:id/capabilities — Add capability to existing agent
 *
 * Body: { taskName: string, taskType: string, price: number, currency: string }
 */
import type { APIRoute } from 'astro'
import { readParsed, write } from '@/lib/typedb'

export const POST: APIRoute = async ({ params, request }) => {
  const uid = params.id
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Missing agent id' }), { status: 400 })
  }

  const { taskName, taskType, price, currency } = (await request.json()) as {
    taskName: string
    taskType: string
    price: number
    currency: string
  }

  if (!taskName) {
    return new Response(JSON.stringify({ error: 'Missing taskName' }), { status: 400 })
  }

  // Verify agent exists
  const existing = await readParsed(`
    match $u isa unit, has uid "${uid}"; select $u;
  `).catch(() => [])

  if (existing.length === 0) {
    return new Response(JSON.stringify({ error: `Agent "${uid}" not found` }), { status: 404 })
  }

  const safeTaskName = taskName
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]/g, '')
    .slice(0, 64)
  const tid = `${uid}:${safeTaskName.replace(/\s+/g, '-')}`
  const safePrice = Math.max(0, price || 0)
  const safeCurrency = currency || 'SUI'
  const safeTaskType = taskType || 'work'

  try {
    // Insert skill (may already exist)
    await write(`
      insert
        $s isa skill,
          has skill-id "${tid}",
          has name "${safeTaskName}",
          has tag "${safeTaskType}",
          has price ${safePrice},
          has currency "${safeCurrency}";
    `).catch(() => {})

    // Create capability relation
    await write(`
      match
        $u isa unit, has uid "${uid}";
        $s isa skill, has skill-id "${tid}";
      insert
        (provider: $u, offered: $s) isa capability,
          has price ${safePrice};
    `)

    return new Response(JSON.stringify({ ok: true, uid, tid }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
