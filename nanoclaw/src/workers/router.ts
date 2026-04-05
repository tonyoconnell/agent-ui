/**
 * NanoClaw Router — Receives webhooks, normalizes to signals, queues for processing
 *
 * Routes:
 *   POST /webhook/:channel  — Channel webhooks (telegram, discord, web)
 *   POST /signal            — Substrate signals from other units
 *   GET  /health            — Status check
 *   GET  /highways          — Proven paths
 */

import { Hono } from 'hono'
import type { Env, QueueMessage, Signal, GroupContext } from '../types'
import { normalize, send } from '../channels'
import { ensureRegistered, isToxic, mark, warn, highways } from '../lib/substrate'
import { tools, executeTool } from '../lib/tools'

const app = new Hono<{ Bindings: Env }>()

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (c) => c.json({
  status: 'ok',
  version: c.env.VERSION,
  service: 'nanoclaw-router',
}))

// Proven paths
app.get('/highways', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10')
  const paths = await highways(c.env, limit)
  return c.json({ highways: paths })
})

// Channel webhooks
app.post('/webhook/:channel', async (c) => {
  const channel = c.req.param('channel')
  const payload = await c.req.json()

  const signal = normalize(channel, payload)
  if (!signal) return c.json({ ok: false, error: 'Invalid payload' }, 400)

  // Ensure group is registered as a unit
  await ensureRegistered(c.env, signal.group)

  // Store message in D1
  await c.env.DB.prepare(`
    INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
    VALUES (?, ?, ?, ?, ?, 'user', ?)
  `).bind(signal.id, signal.group, channel, signal.sender, signal.content, signal.ts).run()

  // Queue for agent processing
  await c.env.AGENT_QUEUE.send({
    type: 'message',
    signal,
    group: signal.group,
  } satisfies QueueMessage)

  return c.json({ ok: true, id: signal.id })
})

// Substrate signals (from other units)
app.post('/signal', async (c) => {
  const { sender, receiver, data } = await c.req.json<{
    sender: string
    receiver: string
    data?: unknown
  }>()

  // Check toxicity
  if (await isToxic(c.env, sender, receiver)) {
    return c.json({ ok: false, dissolved: true, reason: 'toxic' })
  }

  await c.env.AGENT_QUEUE.send({
    type: 'substrate',
    sender,
    receiver,
    data,
  } satisfies QueueMessage)

  return c.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE CONSUMER — Agent processing
// ═══════════════════════════════════════════════════════════════════════════

async function loadContext(env: Env, groupId: string): Promise<GroupContext> {
  // Check KV cache
  const cached = await env.KV.get(`context:${groupId}`, 'json')
  if (cached) return cached as GroupContext

  // Default context
  const ctx: GroupContext = {
    id: groupId,
    systemPrompt: `You are a helpful AI assistant connected to the ONE substrate.
You can use tools to interact with other agents in the network.
Be concise and helpful. Mark successful collaborations, warn on failures.`,
    model: 'claude-sonnet-4-20250514',
    sensitivity: 0.5,
  }

  // Check D1 for group-specific config
  const row = await env.DB.prepare(`
    SELECT name, system_prompt, model, sensitivity FROM groups WHERE id = ?
  `).bind(groupId).first()

  if (row) {
    ctx.name = row.name as string
    ctx.systemPrompt = (row.system_prompt as string) || ctx.systemPrompt
    ctx.model = (row.model as string) || ctx.model
    ctx.sensitivity = (row.sensitivity as number) || ctx.sensitivity
  }

  // Cache for 5 minutes
  await env.KV.put(`context:${groupId}`, JSON.stringify(ctx), { expirationTtl: 300 })
  return ctx
}

async function buildMessages(env: Env, groupId: string): Promise<{ role: string; content: string }[]> {
  // Get last 20 messages
  const rows = await env.DB.prepare(`
    SELECT role, content FROM messages
    WHERE group_id = ?
    ORDER BY ts DESC LIMIT 20
  `).bind(groupId).all()

  return (rows.results || []).reverse().map(r => ({
    role: r.role as string,
    content: r.content as string,
  }))
}

async function processMessage(env: Env, msg: QueueMessage): Promise<void> {
  const groupId = msg.group || msg.signal?.group
  if (!groupId) return

  const context = await loadContext(env, groupId)
  const messages = await buildMessages(env, groupId)

  // Call Claude
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: context.model,
      max_tokens: 4096,
      system: context.systemPrompt,
      tools,
      messages,
    }),
  })

  if (!res.ok) {
    console.error('Claude API error:', await res.text())
    await warn(env, `entry`, `nanoclaw:${groupId}`, 0.5)
    return
  }

  const data = await res.json() as {
    content: { type: string; text?: string; name?: string; input?: unknown }[]
    stop_reason: string
  }

  // Process response
  let reply = ''
  for (const block of data.content) {
    if (block.type === 'text' && block.text) {
      reply += block.text
    } else if (block.type === 'tool_use' && block.name) {
      const result = await executeTool(env, groupId, block.name, block.input as Record<string, unknown>)
      console.log(`Tool ${block.name}:`, result)
    }
  }

  // Store assistant message
  if (reply) {
    await env.DB.prepare(`
      INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
      VALUES (?, ?, 'system', 'assistant', ?, 'assistant', ?)
    `).bind(`resp-${Date.now()}`, groupId, reply, Date.now()).run()

    // Send reply to channel
    await send(env, groupId, reply)
  }

  // Mark success
  await mark(env, 'entry', `nanoclaw:${groupId}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch<QueueMessage>, env: Env) {
    for (const msg of batch.messages) {
      try {
        await processMessage(env, msg.body)
        msg.ack()
      } catch (e) {
        console.error('Queue processing error:', e)
        msg.retry()
      }
    }
  },

  async scheduled(event: ScheduledEvent, env: Env) {
    // Process scheduled tasks
    const now = Math.floor(Date.now() / 1000)
    const tasks = await env.DB.prepare(`
      SELECT id, group_id, prompt FROM tasks
      WHERE enabled = 1 AND next_run <= ?
    `).bind(now).all()

    for (const task of tasks.results || []) {
      await env.AGENT_QUEUE.send({
        type: 'scheduled',
        group: task.group_id as string,
        prompt: task.prompt as string,
        taskId: task.id as string,
      })
    }
  },
}
