/**
 * NanoClaw Router — Receives webhooks, normalizes to signals, queues for processing
 *
 * Routes:
 *   POST /message           — Send a web message (direct API)
 *   GET  /messages/:group   — Retrieve conversation history
 *   POST /webhook/:channel  — Channel webhooks (telegram, discord)
 *   POST /signal            — Substrate signals from other units
 *   GET  /health            — Status check
 *   GET  /highways          — Proven paths
 */

import { Hono } from 'hono'
import { normalize, send } from '../channels'
import { handleExploreCommand } from '../commands/explore'
import { handleForgetCommand } from '../commands/forget'
import { handleMemoryCommand } from '../commands/memory'
import { detectValence } from '../lib/classify-fallback'
import { issueClaim, linkIdentity } from '../lib/identity'
import { systemPromptWithPack } from '../lib/prompt'
import { ensureRegistered, highways, isToxic, mark, warn } from '../lib/substrate'
import { syncPersonas } from '../lib/sync-personas'
import { executeTool, tools } from '../lib/tools'
import { personas } from '../personas'
import type { Env, GroupContext, QueueMessage } from '../types'
import { ingest } from '../units/ingest'
import { measureOutcome } from '../units/outcome'
import { recall } from '../units/recall'

// Detect if response is confident enough to handle locally (score 0-1)
function detectConfidence(response: string, valence: number, highways: { to: string; strength: number }[]): number {
  let score = 0.5 // baseline
  if (Math.abs(valence) > 0.3) score += 0.2 // clear outcome signal
  if (highways.length > 0) score += 0.2 // semantic highways found
  if (response && !response.match(/\b(maybe|possibly|uncertain|not sure|i think|unclear)\b/i)) {
    score += 0.1 // response has no hedging language
  }
  return Math.min(score, 1.0)
}

const app = new Hono<{ Bindings: Env }>()

// ═══════════════════════════════════════════════════════════════════════════
// BOOT-TIME PERSONA SYNC (one-time guard)
// ═══════════════════════════════════════════════════════════════════════════

let personasSynced = false

app.use('*', async (c, next) => {
  if (!personasSynced) {
    personasSynced = true
    // Fire and forget — don't block the request
    syncPersonas(c.env).catch((e) => console.warn('Persona sync failed on boot:', e))
  }
  return next()
})

// ═══════════════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// Webhooks are exempt (Telegram signs them). Health is always public.
// All other routes require Authorization: Bearer <API_KEY> when API_KEY is set.
// ═══════════════════════════════════════════════════════════════════════════

app.use('*', async (c, next) => {
  const apiKey = c.env.API_KEY
  if (!apiKey) return next() // no key set — open (main nanoclaw behaviour)

  const path = new URL(c.req.url).pathname
  const isPublic = path === '/health' || path.startsWith('/webhook/')
  if (isPublic) return next()

  const auth = c.req.header('Authorization') || ''
  if (auth === `Bearer ${apiKey}`) return next()

  return c.json({ ok: false, error: 'Unauthorized' }, 401)
})

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    version: c.env.VERSION,
    service: 'nanoclaw-router',
  }),
)

// Proven paths
app.get('/highways', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const paths = await highways(c.env, limit)
  return c.json({ highways: paths })
})

// Get conversation history
app.get('/messages/:group', async (c) => {
  try {
    const group = c.req.param('group')
    const result = await c.env.DB.prepare(`
      SELECT id, sender, content, role, ts FROM messages
      WHERE group_id = ?
      ORDER BY ts ASC
      LIMIT 100
    `)
      .bind(group)
      .all()

    return c.json({
      group,
      messages: result.results || [],
    })
  } catch (e) {
    console.error('Get messages error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// Send a web message (direct API) — process synchronously for instant response
app.post('/message', async (c) => {
  try {
    const {
      group,
      text,
      sender = 'user',
    } = (await c.req.json()) as {
      group: string
      text: string
      sender?: string
    }

    if (!group || !text) {
      return c.json({ ok: false, error: 'group and text required' }, 400)
    }

    // Ensure group exists
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO groups (id, channel, name, created_at)
      VALUES (?, ?, ?, ?)
    `)
      .bind(group, 'web', group, Math.floor(Date.now() / 1000))
      .run()

    // Store user message
    const msgId = `web-${Date.now()}`
    await c.env.DB.prepare(`
      INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
      VALUES (?, ?, 'web', ?, ?, 'user', ?)
    `)
      .bind(msgId, group, sender, text, Date.now())
      .run()

    // Process immediately (synchronous)
    const context = await loadContext(c.env, group)
    const messages = await buildMessages(c.env, group)

    const openaiTools = tools.map((t) => ({
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
        Authorization: `Bearer ${c.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://one.ie',
        'X-Title': 'NanoClaw',
      },
      body: JSON.stringify({
        model: context.model,
        max_tokens: 4096,
        messages: [{ role: 'system', content: context.systemPrompt }, ...messages],
        tools: openaiTools,
      }),
    })

    const resText = await res.text()
    if (!res.ok) {
      console.error('OpenRouter error:', res.status, resText.slice(0, 500))
      await warn(c.env, 'entry', `nanoclaw:${group}`, 0.5)
      return c.json({ ok: false, error: 'LLM request failed' }, 500)
    }

    const data = JSON.parse(resText)
    const choice = data.choices?.[0]?.message
    const reply = (choice?.content as string) || ''

    // Execute tool calls if any
    if (choice?.tool_calls) {
      for (const call of choice.tool_calls) {
        const input = JSON.parse(call.function.arguments)
        await executeTool(c.env, group, call.function.name, input)
      }
    }

    // Store assistant message if there's a response
    const respId = `resp-${Date.now()}`
    if (reply) {
      await c.env.DB.prepare(`
        INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
        VALUES (?, ?, 'web', 'assistant', ?, 'assistant', ?)
      `)
        .bind(respId, group, reply, Date.now())
        .run()

      // Mark success
      await mark(c.env, 'entry', `nanoclaw:${group}`)
    }

    return c.json({
      ok: true,
      id: msgId,
      group,
      response: reply || null,
      responseId: reply ? respId : null,
    })
  } catch (e) {
    console.error('Post message error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// Channel webhooks
app.post('/webhook/:channel', async (c) => {
  try {
    const channel = c.req.param('channel')
    const payload = await c.req.json()

    const signal = normalize(channel, payload)
    if (!signal) return c.json({ ok: false, error: 'Invalid payload' }, 400)

    // Handle memory slash commands — /memory, /forget, /explore
    if (
      (signal.content === '/memory' || signal.content.startsWith('/forget') || signal.content === '/explore') &&
      (channel.startsWith('telegram') || channel === 'discord')
    ) {
      const { uid } = await ingest(channel, signal.sender, signal.content, 'nanoclaw', c.env)
      let reply = ''

      if (signal.content === '/memory') {
        reply = await handleMemoryCommand(uid, signal.sender, signal.group, c.env)
      } else if (signal.content === '/forget confirm') {
        reply = await handleForgetCommand(uid, signal.sender, true, c.env)
      } else if (signal.content === '/forget') {
        reply = await handleForgetCommand(uid, signal.sender, false, c.env)
      } else if (signal.content === '/explore') {
        reply = await handleExploreCommand(uid, c.env)
      }

      if (reply) await send(c.env, signal.group, reply)
      return c.json({ ok: true, id: signal.id, group: signal.group })
    }

    // Handle /link <nonce> command — cross-channel identity claim
    if (signal.content.startsWith('/link ') && channel.startsWith('telegram')) {
      const nonce = signal.content.slice(6).trim()
      const linked = await linkIdentity(nonce, channel, signal.sender, c.env)
      if (linked) {
        await send(c.env, signal.group, `Linked! Web session now shares your Telegram memory.`)
      } else {
        await send(c.env, signal.group, 'Nonce expired or invalid. Try /claim again in the web chat.')
      }
      return c.json({ ok: true, id: signal.id, group: signal.group })
    }

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
    `)
      .bind(signal.group, channel, signal.group, Math.floor(Date.now() / 1000))
      .run()

    // Store message in D1
    await c.env.DB.prepare(`
      INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
      VALUES (?, ?, ?, ?, ?, 'user', ?)
    `)
      .bind(signal.id, signal.group, channel, signal.sender, signal.content, signal.ts)
      .run()

    // Process synchronously for Telegram/Discord — eliminates queue latency (~30s → ~3s)
    if (channel.startsWith('telegram') || channel === 'discord') {
      // Memory-enhanced turn: outcome → ingest → recall → pack → respond
      // 1. Measure outcome of previous turn (deposit pheromone before new turn starts)
      await measureOutcome(c.env, signal.sender, signal.group, signal.content).catch(() => {})

      // 2. Resolve stable actor uid + classify tags
      const { uid, tags } = await ingest(channel, signal.sender, signal.content, 'nanoclaw', c.env)

      // 3. Persist tags for next turn's outcome measurement
      await c.env.DB.prepare('INSERT OR REPLACE INTO turn_meta (group_id, tags, ts) VALUES (?, ?, ?)')
        .bind(signal.group, tags.join(','), Date.now())
        .run()
        .catch(() => {})

      // 4. Assemble ContextPack (three-parallel: episodic + associative + semantic)
      const context = await loadContext(c.env, signal.group)
      const pack = await recall(c.env, signal.group, uid, signal.sender)
      const enhancedSystemPrompt = systemPromptWithPack(context.systemPrompt, pack)
      const messages = await buildMessages(c.env, signal.group)

      const openaiTools = tools.map((t) => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.input_schema },
      }))

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${c.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://one.ie',
          'X-Title': 'NanoClaw',
        },
        body: JSON.stringify({
          model: context.model,
          max_tokens: 1024,
          messages: [{ role: 'system', content: enhancedSystemPrompt }, ...messages],
          tools: openaiTools,
        }),
      })

      if (res.ok) {
        const data = (await res.json()) as any
        const choice = data.choices?.[0]?.message
        const reply = (choice?.content as string) || ''

        if (choice?.tool_calls) {
          for (const call of choice.tool_calls) {
            await executeTool(c.env, signal.group, call.function.name, JSON.parse(call.function.arguments))
          }
        }

        if (reply) {
          // Compute confidence: sentiment signal (from incoming msg) + highways + response clarity
          const valence = detectValence(signal.content)
          const confidence = detectConfidence(reply, valence, pack.highways)

          // Simple path: >0.7 confidence → mark locally, send in 3s
          if (confidence > 0.7) {
            await c.env.DB.prepare(`
              INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
              VALUES (?, ?, ?, 'assistant', ?, 'assistant', ?)
            `)
              .bind(`resp-${Date.now()}`, signal.group, channel, reply, Date.now())
              .run()

            await send(c.env, signal.group, reply)
            await mark(c.env, 'entry', `nanoclaw:${signal.group}`, 1)
          }
          // Complex path: ≤0.7 confidence → queue to substrate, fallback with warn(0.5)
          else {
            try {
              await c.env.AGENT_QUEUE.send({
                type: 'complex',
                sender: signal.sender,
                group: signal.group,
                tags,
                context: { uid, pack, reply, confidence },
                ts: Date.now(),
              })
            } catch {
              // Queue error → fallback to local reply + warn
            }
            await send(c.env, signal.group, reply)
            await warn(c.env, 'entry', `nanoclaw:${signal.group}`, 0.5)
          }
        }
      } else {
        await warn(c.env, 'entry', `nanoclaw:${signal.group}`, 0.5)
      }

      return c.json({ ok: true, id: signal.id, group: signal.group })
    }

    // Queue for other channel types (substrate signals, scheduled tasks)
    try {
      if (c.env.AGENT_QUEUE) {
        await c.env.AGENT_QUEUE.send({
          type: 'message',
          signal,
          group: signal.group,
        } satisfies QueueMessage)
      }
    } catch (_e) {
      console.log('Queue unavailable (local dev)')
    }

    return c.json({ ok: true, id: signal.id, group: signal.group })
  } catch (e) {
    console.error('Webhook error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// Cross-channel identity claim — issue a nonce for /link flow
app.post('/claim', async (c) => {
  try {
    const { sessionId } = (await c.req.json()) as { sessionId: string }
    if (!sessionId) return c.json({ ok: false, error: 'sessionId required' }, 400)
    const nonce = await issueClaim(sessionId, c.env)
    return c.json({ ok: true, nonce, expiresIn: 300 })
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// Poll claim status — called by Pages app after initiating /claim
app.get('/claim/status', async (c) => {
  try {
    const sessionId = c.req.query('sessionId')
    if (!sessionId) return c.json({ linked: false, error: 'sessionId required' }, 400)

    const row = await c.env.DB.prepare('SELECT canonical_uid FROM identity_links WHERE channel = ? AND sender_id = ?')
      .bind('web', sessionId)
      .first()
      .catch(() => null)

    if (row?.canonical_uid) {
      return c.json({ linked: true, canonicalUid: row.canonical_uid as string })
    }
    return c.json({ linked: false })
  } catch (e) {
    return c.json({ linked: false, error: String(e) }, 500)
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
  } catch (_e) {
    console.log('Queue unavailable (local dev)')
  }

  return c.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE CONSUMER — Agent processing
// ═══════════════════════════════════════════════════════════════════════════

async function loadContext(env: Env, groupId: string): Promise<GroupContext> {
  // Check KV cache (but always validate model)
  const cached = (await env.KV.get(`context:${groupId}`, 'json')) as GroupContext | null
  if (cached) {
    if (cached.model?.startsWith('claude-') || cached.model?.startsWith('gpt-')) {
      cached.model = 'google/gemma-4-26b-a4b-it'
    }
    return cached
  }

  // Resolve persona: worker-level BOT_PERSONA takes priority, then group-prefix
  const personaKey = env.BOT_PERSONA ?? Object.keys(personas).find((k) => groupId.startsWith(`tg-${k}`)) ?? null
  const botDefault = personaKey ? (personas[personaKey] ?? null) : null

  // Default context
  const ctx: GroupContext = {
    id: groupId,
    systemPrompt:
      botDefault?.systemPrompt ??
      `You are a helpful AI assistant connected to the ONE substrate.
You can use tools to interact with other agents in the network.
Be concise and helpful. Mark successful collaborations, warn on failures.`,
    model: botDefault?.model ?? 'google/gemma-4-26b-a4b-it',
    sensitivity: 0.5,
  }

  // Check D1 for group-specific config
  const row = await env.DB.prepare(`
    SELECT name, system_prompt, model, sensitivity FROM groups WHERE id = ?
  `)
    .bind(groupId)
    .first()

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
  `)
    .bind(groupId)
    .all()

  return (rows.results || []).reverse().map((r) => ({
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
  const openaiTools = tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }))

  // User-provided key hook: POST /api/claw sets OPENROUTER_API_KEY as worker secret.
  // Per-user key override: extend here to read from D1 user_secrets table if needed.
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://one.ie',
      'X-Title': 'NanoClaw',
    },
    body: JSON.stringify({
      model: context.model,
      max_tokens: 4096,
      messages: [{ role: 'system', content: context.systemPrompt }, ...messages],
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
  const reply = (choice?.content as string) || ''
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
    `)
      .bind(`resp-${Date.now()}`, groupId, reply, Date.now())
      .run()

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
    `)
      .bind(now)
      .all()

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
