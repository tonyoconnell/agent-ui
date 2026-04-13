/**
 * POST /api/agents — Create an agent with capabilities
 *
 * Body: {
 *   name: string,
 *   wallet?: string,
 *   capabilities: Array<{ taskName, taskType, price, currency }>
 * }
 *
 * Creates: unit + tasks + capability relations in TypeDB.
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const { name, wallet, capabilities } = (await request.json()) as {
    name: string
    wallet?: string
    capabilities: Array<{
      taskName: string
      taskType: string
      price: number
      currency: string
    }>
  }

  if (!name) {
    return new Response(JSON.stringify({ error: 'Missing agent name' }), { status: 400 })
  }

  if (!capabilities || capabilities.length === 0) {
    return new Response(JSON.stringify({ error: 'At least one capability is required' }), { status: 400 })
  }

  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 32)
  if (!safeName) {
    return new Response(JSON.stringify({ error: 'Invalid name' }), { status: 400 })
  }

  const uid = safeName
  const walletClause = wallet ? `has wallet "${wallet}",` : ''

  try {
    // 1. Create the agent unit
    await write(`
      insert
        $u isa unit,
          has uid "${uid}",
          has name "${safeName}",
          has unit-kind "agent",
          ${walletClause}
          has status "active",
          has balance 0.0,
          has reputation 0.0,
          has success-rate 0.5,
          has activity-score 0.0,
          has sample-count 0;
    `)

    // 2. Create tasks and capability relations
    for (const cap of capabilities) {
      const safeTaskName = cap.taskName
        .toLowerCase()
        .replace(/[^a-z0-9-_ ]/g, '')
        .slice(0, 64)
      const tid = `${uid}:${safeTaskName.replace(/\s+/g, '-')}`
      const price = Math.max(0, cap.price || 0)
      const currency = cap.currency || 'SUI'
      const taskType = cap.taskType || 'work'

      // Insert skill (may already exist — catch and continue)
      await write(`
        insert
          $s isa skill,
            has skill-id "${tid}",
            has name "${safeTaskName}",
            has tag "${taskType}",
            has price ${price},
            has currency "${currency}";
      `).catch(() => {})

      // Create capability relation
      await write(`
        match
          $u isa unit, has uid "${uid}";
          $s isa skill, has skill-id "${tid}";
        insert
          (provider: $u, offered: $s) isa capability,
            has price ${price};
      `)
    }

    return new Response(JSON.stringify({ ok: true, uid }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('already') || message.includes('unique') || message.includes('key')) {
      return new Response(JSON.stringify({ error: `Name "${safeName}" is already taken` }), { status: 409 })
    }
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
