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
  try {
    const channel = c.req.param('channel')
    const payload = await c.req.json()

    const signal = normalize(channel, payload)
    if (!signal) return c.json({ ok: false, error: 'Invalid payload' }, 400)

    // Ensure group is registered as a unit (skip errors in local dev)
    try {
      await ensureRegistered(c.env, signal.group)
    } catch (e) {
      console.log('TypeDB registration skipped:', e)
    }

    // Ensure group exists in D1
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO groups (id, channel, name, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(signal.group, channel, signal.group, Math.floor(Date.now() / 1000)).run()

    // Store message in D1
    await c.env.DB.prepare(`
      INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
      VALUES (?, ?, ?, ?, ?, 'user', ?)
    `).bind(signal.id, signal.group, channel, signal.sender, signal.content, signal.ts).run()

    // Queue for agent processing (skip if queue unavailable in local dev)
    try {
      if (c.env.AGENT_QUEUE) {
        await c.env.AGENT_QUEUE.send({
          type: 'message',
          signal,
          group: signal.group,
        } satisfies QueueMessage)
      }
    } catch (e) {
      console.log('Queue unavailable (local dev)')
    }

    return c.json({ ok: true, id: signal.id, group: signal.group })
  } catch (e) {
    console.error('Webhook error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
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

  try {
    if (c.env.AGENT_QUEUE) {
      await c.env.AGENT_QUEUE.send({
        type: 'substrate',
        sender,
        receiver,
        data,
      } satisfies QueueMessage)
    }
  } catch (e) {
    console.log('Queue unavailable (local dev)')
  }

  return c.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE CONSUMER — Agent processing
// ═══════════════════════════════════════════════════════════════════════════

async function loadContext(env: Env, groupId: string): Promise<GroupContext> {
  // Check KV cache (but always validate model)
  const cached = await env.KV.get(`context:${groupId}`, 'json') as GroupContext | null
  if (cached) {
    if (cached.model?.startsWith('claude-') || cached.model?.startsWith('gpt-')) {
      cached.model = 'google/gemma-4-26b-a4b-it'
    }
    return cached
  }

  // Default context
  const ctx: GroupContext = {
    id: groupId,
    systemPrompt: `You are a helpful AI assistant connected to the ONE substrate.
You can use tools to interact with other agents in the network.
Be concise and helpful. Mark successful collaborations, warn on failures.`,
    model: 'google/gemma-4-26b-a4b-it',
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

  // Ensure model is OpenRouter-compatible (not raw Anthropic/OpenAI IDs)
  if (ctx.model.startsWith('claude-') || ctx.model.startsWith('gpt-')) {
    ctx.model = 'google/gemma-4-26b-a4b-it'
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

  // Call OpenRouter (Gemma 4)
  const openaiTools = tools.map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }))

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://one.ie',
      'X-Title': 'NanoClaw',
    },
    body: JSON.stringify({
      model: context.model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: context.systemPrompt },
        ...messages,
      ],
      tools: openaiTools,
    }),
  })

  const resText = await res.text()
  if (!res.ok) {
    console.error('OpenRouter API error:', res.status, resText.slice(0, 500))
    await warn(env, `entry`, `nanoclaw:${groupId}`, 0.5)
    return
  }

  let data: any
  try {
    data = JSON.parse(resText)
  } catch {
    console.error('Failed to parse OpenRouter response:', resText.slice(0, 500))
    return
  }

  console.log('OpenRouter raw:', JSON.stringify(data).slice(0, 500))

  // Process response (OpenAI format: choices[0].message.content)
  const choice = data.choices?.[0]?.message
  let reply = (choice?.content as string) || ''
  console.log('Reply extracted:', reply.slice(0, 200) || '(empty)', 'tool_calls:', !!choice?.tool_calls)

  if (choice?.tool_calls) {
    for (const call of choice.tool_calls) {
      const input = JSON.parse(call.function.arguments)
      const result = await executeTool(env, groupId, call.function.name, input)
      console.log(`Tool ${call.function.name}:`, result)
    }
  }

  // Store assistant message
  if (reply) {
    console.log('Storing reply:', reply.slice(0, 100))
    await env.DB.prepare(`
      INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
      VALUES (?, ?, 'system', 'assistant', ?, 'assistant', ?)
    `).bind(`resp-${Date.now()}`, groupId, reply, Date.now()).run()

    // Send reply to channel
    console.log('Sending to channel:', groupId)
    await send(env, groupId, reply)
  } else {
    console.log('No reply text to store (tool_calls only or empty)')
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
