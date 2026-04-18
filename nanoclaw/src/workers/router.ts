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
import { MODELS } from '../lib/models'
import { notifyOwner, registerOwner } from '../lib/notify'
import { sendToStudent } from '../lib/proactive'
import { systemPromptWithPack } from '../lib/prompt'
import { chooseModelLocal, ensureRegistered, highways, isToxic, mark, markModelOutcome, warn } from '../lib/substrate'
import { syncPersonas } from '../lib/sync-personas'
import { executeTool, tools } from '../lib/tools'
import { personas } from '../personas'
import type { Env, GroupContext, QueueMessage } from '../types'
import { assessStudent } from '../units/assessment'
import { extractSidecar } from '../units/extract'
import { ingest } from '../units/ingest'
import { measureOutcome } from '../units/outcome'
import { recall } from '../units/recall'
import { getStudent, recordSidecar, studentContext } from '../units/student'

// ═══════════════════════════════════════════════════════════════════════════
// LLM PROVIDER ROUTING — call Groq directly when model starts with groq/
// ═══════════════════════════════════════════════════════════════════════════

function resolveLLM(model: string, env: Env): { url: string; headers: Record<string, string>; modelId: string } {
  if (model.startsWith('groq/') && env.GROQ_API_KEY) {
    return {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      modelId: model.slice(5), // strip groq/ prefix
    }
  }
  // Fallback: OpenRouter
  return {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://one.ie',
      'X-Title': 'NanoClaw',
    },
    modelId: model,
  }
}

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
// CORS — allow browser calls from Pages domains
// ═══════════════════════════════════════════════════════════════════════════

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || ''
  const allowed =
    origin.endsWith('.pages.dev') ||
    origin.endsWith('.one.ie') ||
    origin === 'https://one.ie' ||
    origin.startsWith('http://localhost')
  if (allowed) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  if (c.req.method === 'OPTIONS') return c.text('', 204)
  return next()
})

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

/**
 * Post-response hook — shared by /message and /webhook paths.
 * Fire-and-forget: never blocks the response to the student.
 *
 * 1. If tutoring tags detected → extract side-car from LLM response
 * 2. If student is new → check onboarding drip
 * 3. If session milestone → run assessment
 */
async function afterResponse(
  env: Env,
  uid: string,
  groupId: string,
  reply: string,
  tags: string[],
  sessionCount: number,
  opts?: { studentMessage?: string; confidence?: number },
): Promise<void> {
  // 1. Side-car extraction via AI SDK generateObject (structured, type-safe)
  // Always attempt extraction when we have both student message + reply.
  // The LLM is smart enough to return empty arrays when there's nothing to extract.
  const studentMsg = opts?.studentMessage || ''
  if (reply.length > 50 && studentMsg) {
    const sidecar = await extractSidecar(env, studentMsg, reply).catch(() => null)
    if (sidecar) {
      const mistakes = sidecar.mistakes.map((m) => `${m.category}: ${m.example} → ${m.correction}`)
      recordSidecar(env, uid, groupId, {
        mistakes,
        newVocab: sidecar.newVocab,
        praise: sidecar.praise,
        lessonTag: sidecar.lessonTag,
        flag: sidecar.flag === 'none' ? undefined : sidecar.flag,
      }).catch(() => {})
    }
  }

  // 2. Onboarding — advance stage + send welcome message
  const student = await getStudent(env, uid, undefined, groupId).catch(() => null)
  if (student && student.onboardingStage !== 'active' && student.onboardingStage !== 'churning') {
    const nextStage =
      student.onboardingStage === 'new' && student.sessionCount >= 1
        ? 'welcomed'
        : student.onboardingStage === 'welcomed' && student.sessionCount >= 3
          ? 'first-session'
          : student.onboardingStage === 'first-session' && student.sessionCount >= 7
            ? 'active'
            : null
    if (nextStage) {
      await env.DB.prepare('UPDATE student_profiles SET onboarding_stage = ? WHERE uid = ?').bind(nextStage, uid).run()
      const msg =
        nextStage === 'welcomed'
          ? "Welcome to Elevare! Ask me anything about our programs. When you're ready, Amara will help you practice every day."
          : nextStage === 'first-session'
            ? 'Quick tip: the more you chat with Amara, the better she gets at helping you. By session 5, you will notice the difference.'
            : nextStage === 'active'
              ? "You're doing great! First week done. Keep the momentum going."
              : null
      if (msg) sendToStudent(env, uid, msg).catch(() => {})
    }
  }

  // 3. Assessment every 5 sessions
  if (sessionCount > 0 && sessionCount % 5 === 0) {
    assessStudent(env, uid, sessionCount).catch(() => {})
  }

  // 4. Notify claw owner
  if (opts?.studentMessage) {
    notifyOwner(env, {
      studentName: uid,
      studentMessage: opts.studentMessage,
      groupId,
      reply,
      confidence: opts.confidence,
      isFirstMessage: sessionCount <= 1,
    }).catch(() => {})
  }
}

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

// List active conversations — for Debby's admin dashboard
app.get('/conversations', async (c) => {
  try {
    const rows = await c.env.DB.prepare(`
      SELECT
        m.group_id,
        COUNT(*) as message_count,
        MAX(m.ts) as last_ts,
        (SELECT content FROM messages WHERE group_id = m.group_id ORDER BY ts DESC LIMIT 1) as last_message,
        (SELECT role FROM messages WHERE group_id = m.group_id ORDER BY ts DESC LIMIT 1) as last_role,
        sp.handle,
        sp.onboarding_stage,
        sp.session_count
      FROM messages m
      LEFT JOIN student_profiles sp ON sp.group_id = m.group_id
      GROUP BY m.group_id
      ORDER BY last_ts DESC
      LIMIT 50
    `).all()

    return c.json({ conversations: rows.results || [] })
  } catch (e) {
    console.error('List conversations error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// Debby replies into a conversation — human takeover
app.post('/conversations/:group/reply', async (c) => {
  try {
    const group = c.req.param('group')
    const { text, sender: adminSender = 'admin' } = (await c.req.json()) as { text: string; sender?: string }
    if (!text) return c.json({ ok: false, error: 'text required' }, 400)

    // Store as a human message (role = 'assistant' so LLM sees it as part of the conversation)
    const msgId = `${adminSender}-${Date.now()}`
    await c.env.DB.prepare(`
      INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
      VALUES (?, ?, 'web', ?, ?, 'assistant', ?)
    `)
      .bind(msgId, group, adminSender, text, Date.now())
      .run()

    // Push to student if on Telegram
    await send(c.env, group, text).catch(() => {})

    return c.json({ ok: true, id: msgId, group })
  } catch (e) {
    console.error('Reply error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT ADMIN API — Debby's visibility into her students
// Protected by API_KEY (same auth middleware as all non-webhook routes)
// ═══════════════════════════════════════════════════════════════════════════

// List all students — session counts, stages, last seen
app.get('/students', async (c) => {
  try {
    const rows = await c.env.DB.prepare(`
      SELECT uid, handle, group_id, first_seen, last_seen, session_count,
             pillar, level, onboarding_stage, goals
      FROM student_profiles
      ORDER BY last_seen DESC
      LIMIT 200
    `).all()
    return c.json({ students: rows.results || [] })
  } catch (e) {
    console.error('List students error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// Get one student profile
app.get('/student/:uid', async (c) => {
  try {
    const uid = c.req.param('uid')
    const row = await c.env.DB.prepare('SELECT * FROM student_profiles WHERE uid = ?').bind(uid).first()
    if (!row) return c.json({ ok: false, error: 'Student not found' }, 404)
    return c.json({ student: row })
  } catch (e) {
    console.error('Get student error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// Recent Amara side-car data for a student
app.get('/sidecar/:uid', async (c) => {
  try {
    const uid = c.req.param('uid')
    const limit = parseInt(c.req.query('limit') || '20', 10)
    const { getRecentSidecar } = await import('../units/student')
    const entries = await getRecentSidecar(c.env, uid, limit)
    return c.json({ uid, sidecar: entries })
  } catch (e) {
    console.error('Get sidecar error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// Manually update a student profile (Debby's corrections)
app.post('/student/:uid/update', async (c) => {
  try {
    const uid = c.req.param('uid')
    const body = (await c.req.json()) as {
      pillar?: string
      level?: string
      goals?: string
      onboardingStage?: 'new' | 'welcomed' | 'first-session' | 'active' | 'churning'
      notes?: string
    }
    const { updateStudent } = await import('../units/student')
    await updateStudent(c.env, uid, body)
    return c.json({ ok: true, uid })
  } catch (e) {
    console.error('Update student error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// OWNER NOTIFICATIONS — register to receive alerts when students message
// ═══════════════════════════════════════════════════════════════════════════

// Register owner for notifications
app.post('/owner', async (c) => {
  const {
    channel,
    groupId,
    alertLevel = 'all',
  } = (await c.req.json()) as {
    channel: string
    groupId: string
    alertLevel?: 'off' | 'first' | 'low-confidence' | 'all'
  }
  if (!channel || !groupId) return c.json({ ok: false, error: 'channel and groupId required' }, 400)
  await registerOwner(c.env, channel, groupId, alertLevel)
  return c.json({ ok: true, clawId: c.env.BOT_PERSONA || 'default', alertLevel })
})

// Get current owner config
app.get('/owner', async (c) => {
  const clawId = c.env.BOT_PERSONA || 'default'
  const row = await c.env.DB.prepare('SELECT * FROM claw_owners WHERE claw_id = ?').bind(clawId).first()
  if (!row) return c.json({ ok: false, error: 'No owner registered' }, 404)
  return c.json({ ok: true, owner: row })
})

// Broadcast a message to ALL active conversations
app.post('/broadcast', async (c) => {
  try {
    const { text, sender = 'admin' } = (await c.req.json()) as { text: string; sender?: string }
    if (!text) return c.json({ ok: false, error: 'text required' }, 400)

    // Get all active groups (with messages in last 7 days)
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    const rows = await c.env.DB.prepare(`
      SELECT DISTINCT group_id FROM messages
      WHERE ts > ?
      ORDER BY group_id
    `)
      .bind(cutoff)
      .all()

    const groups = (rows.results || []).map((r) => r.group_id as string)
    const results: { group: string; ok: boolean; error?: string }[] = []

    for (const group of groups) {
      try {
        // Store as assistant message in each conversation
        const msgId = `${sender}-bc-${Date.now()}-${group.slice(0, 8)}`
        await c.env.DB.prepare(`
          INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
          VALUES (?, ?, 'web', ?, ?, 'assistant', ?)
        `)
          .bind(msgId, group, sender, text, Date.now())
          .run()

        // Push to channel (Telegram/Discord — web clients pick it up via polling)
        await send(c.env, group, text).catch(() => {})
        results.push({ group, ok: true })
      } catch (e) {
        results.push({ group, ok: false, error: String(e) })
      }
    }

    const sent = results.filter((r) => r.ok).length
    const failed = results.filter((r) => !r.ok).length
    return c.json({ ok: true, sent, failed, total: groups.length, results })
  } catch (e) {
    console.error('Broadcast error:', e)
    return c.json({ ok: false, error: String(e) }, 500)
  }
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
// Pass `stream: true` to get SSE streaming response from Groq
app.post('/message', async (c) => {
  try {
    const {
      group,
      text,
      sender = 'user',
      prefill,
      stream: wantStream,
    } = (await c.req.json()) as {
      group: string
      text: string
      sender?: string
      /** Pre-canned answer — store Q+A in D1 for context, skip LLM */
      prefill?: string
      /** Stream LLM response as SSE */
      stream?: boolean
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

    // ── PRE: Deterministic sandwich ──────────────────────────────
    // 1. Toxic check — reject if path is poisoned
    const groupUid = `nanoclaw:${group}`
    if (await isToxic(c.env, 'entry', groupUid).catch(() => false)) {
      return c.json({ ok: false, dissolved: true, reason: 'toxic' })
    }

    // Store user message
    const msgId = `web-${Date.now()}`
    await c.env.DB.prepare(`
      INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
      VALUES (?, ?, 'web', ?, ?, 'user', ?)
    `)
      .bind(msgId, group, sender, text, Date.now())
      .run()

    // ── MID: Response (prefill or LLM) ───────────────────────────
    // Prefill: canned answer — deterministic, no LLM, still marks the path
    if (prefill) {
      const respId = `resp-${Date.now()}`
      await c.env.DB.prepare(`
        INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
        VALUES (?, ?, 'web', 'assistant', ?, 'assistant', ?)
      `)
        .bind(respId, group, prefill, Date.now())
        .run()
      // POST: mark success on prefill too — pheromone accumulates
      mark(c.env, 'entry', groupUid).catch(() => {})
      return c.json({ ok: true, id: msgId, group, prefilled: true })
    }

    // LLM path — load context + student memory in parallel
    const [context, chatMessages, student] = await Promise.all([
      loadContext(c.env, group),
      buildMessages(c.env, group),
      getStudent(c.env, sender, sender, group).catch(() => null),
    ])
    const studentCtx = student ? `\n\n--- Student Memory ---\n${studentContext(student)}` : ''
    const messages = chatMessages

    const openaiTools = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }))

    const stanChoice = await chooseModelLocal(c.env, context.tags ?? [], MODELS, context.model)
    const llm = resolveLLM(stanChoice.modelId, c.env)

    // ── STREAMING PATH ───────────────────────────────────────────
    if (wantStream) {
      // Capture CORS origin before we leave Hono's response chain
      const origin = c.req.header('Origin') || ''
      const allowedOrigin =
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.one.ie') ||
        origin === 'https://one.ie' ||
        origin.startsWith('http://localhost')
          ? origin
          : ''

      const res = await fetch(llm.url, {
        method: 'POST',
        headers: llm.headers,
        body: JSON.stringify({
          model: llm.modelId,
          max_tokens: 512,
          stream: true,
          messages: [{ role: 'system', content: context.systemPrompt + studentCtx }, ...messages],
          tools: openaiTools,
        }),
      })

      if (!res.ok || !res.body) {
        warn(c.env, 'entry', groupUid, 0.5).catch(() => {})
        return c.json({ ok: false, error: 'LLM stream failed' }, 500)
      }

      // Pipe Groq SSE through to client, accumulate full reply for D1
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      let fullReply = ''
      const pendingToolCalls: { name: string; arguments: string }[] = []

      let buffer = ''
      const transform = new TransformStream({
        transform(chunk, controller) {
          buffer += decoder.decode(chunk, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // keep incomplete last line
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              continue
            }
            try {
              const json = JSON.parse(payload)
              const delta = json.choices?.[0]?.delta
              if (!delta) continue
              // Text content
              if (delta.content) {
                fullReply += delta.content
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: delta.content })}\n\n`))
              }
              // Tool calls — accumulate, execute after stream
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0
                  if (!pendingToolCalls[idx]) pendingToolCalls[idx] = { name: '', arguments: '' }
                  if (tc.function?.name) pendingToolCalls[idx].name = tc.function.name
                  if (tc.function?.arguments) pendingToolCalls[idx].arguments += tc.function.arguments
                }
              }
            } catch {}
          }
        },
        async flush(controller) {
          // Emit error if stream produced nothing
          if (!fullReply && pendingToolCalls.length === 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Empty response' })}\n\n`))
          }
          // Store complete reply + execute tools + mark path
          c.executionCtx.waitUntil(
            (async () => {
              // Execute accumulated tool calls
              for (const tc of pendingToolCalls) {
                if (tc.name) {
                  try {
                    const input = JSON.parse(tc.arguments)
                    executeTool(c.env, group, tc.name, input).catch(() => {})
                  } catch {}
                }
              }
              if (fullReply) {
                await c.env.DB.prepare(
                  `INSERT INTO messages (id, group_id, channel, sender, content, role, ts) VALUES (?, ?, 'web', 'assistant', ?, 'assistant', ?)`,
                )
                  .bind(`resp-${Date.now()}`, group, fullReply, Date.now())
                  .run()
                  .catch(() => {})
                mark(c.env, 'entry', groupUid).catch(() => {})
                const postTags = student ? ([student.pillar, student.onboardingStage].filter(Boolean) as string[]) : []
                afterResponse(c.env, sender, group, fullReply, postTags, student?.sessionCount ?? 0, {
                  studentMessage: text,
                }).catch(() => {})
              } else {
                warn(c.env, 'entry', groupUid, 0.5).catch(() => {})
              }
            })(),
          )
        },
      })

      const corsHeaders: Record<string, string> = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      }
      if (allowedOrigin) {
        corsHeaders['Access-Control-Allow-Origin'] = allowedOrigin
        corsHeaders['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
      }

      return new Response(res.body.pipeThrough(transform), { headers: corsHeaders })
    }

    // ── NON-STREAMING PATH ─────────────────────────────────────
    const res = await fetch(llm.url, {
      method: 'POST',
      headers: llm.headers,
      body: JSON.stringify({
        model: llm.modelId,
        max_tokens: 512,
        messages: [{ role: 'system', content: context.systemPrompt + studentCtx }, ...messages],
        tools: openaiTools,
      }),
    })

    const resText = await res.text()
    if (!res.ok) {
      console.error('LLM error:', res.status, resText.slice(0, 500))
      warn(c.env, 'entry', `nanoclaw:${group}`, 0.5).catch(() => {})
      return c.json({ ok: false, error: 'LLM request failed' }, 500)
    }

    const data = JSON.parse(resText)
    const choice = data.choices?.[0]?.message
    const reply = (choice?.content as string) || ''

    // Execute tool calls if any
    if (choice?.tool_calls) {
      for (const call of choice.tool_calls) {
        const input = JSON.parse(call.function.arguments)
        executeTool(c.env, group, call.function.name, input).catch(() => {})
      }
    }

    // Store assistant message + mark success (fire-and-forget, don't block response)
    const respId = `resp-${Date.now()}`
    if (reply) {
      c.env.DB.prepare(`
        INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
        VALUES (?, ?, 'web', 'assistant', ?, 'assistant', ?)
      `)
        .bind(respId, group, reply, Date.now())
        .run()
        .catch(() => {})

      mark(c.env, 'entry', `nanoclaw:${group}`).catch(() => {})

      // Post-response hook: side-car + onboarding + assessment
      const postTags = student ? ([student.pillar, student.onboardingStage].filter(Boolean) as string[]) : []
      try {
        await afterResponse(c.env, sender, group, reply, postTags, student?.sessionCount ?? 0, { studentMessage: text })
      } catch (e) {
        console.error('afterResponse error:', e)
      }
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

      // 4. Assemble ContextPack (four-parallel: episodic + associative + semantic + student)
      const [context, pack, chatMessages, student] = await Promise.all([
        loadContext(c.env, signal.group),
        recall(c.env, signal.group, uid, signal.sender),
        buildMessages(c.env, signal.group),
        getStudent(c.env, uid, signal.sender).catch(() => null),
      ])
      const studentCtx = student ? `\n\n--- Student Memory ---\n${studentContext(student)}` : ''
      const enhancedSystemPrompt = systemPromptWithPack(context.systemPrompt, pack) + studentCtx
      const messages = chatMessages

      const openaiTools = tools.map((t) => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.input_schema },
      }))

      const stanChoiceWh = await chooseModelLocal(c.env, context.tags ?? [], MODELS, context.model)
      const llm = resolveLLM(stanChoiceWh.modelId, c.env)
      const res = await fetch(llm.url, {
        method: 'POST',
        headers: llm.headers,
        body: JSON.stringify({
          model: llm.modelId,
          max_tokens: 512,
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
          markModelOutcome(c.env, stanChoiceWh.edge, confidence > 0.5).catch(() => {})

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

            // Post-response hook — waitUntil keeps worker alive
            c.executionCtx.waitUntil(
              afterResponse(c.env, uid, signal.group, reply, tags, student?.sessionCount ?? 0, {
                studentMessage: signal.content,
                confidence,
              }).catch(() => {}),
            )
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

  // Cache for 5 minutes (swallow KV errors — free tier has daily write limits)
  await env.KV.put(`context:${groupId}`, JSON.stringify(ctx), { expirationTtl: 300 }).catch(() => {})
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

  const stanChoiceQ = await chooseModelLocal(env, context.tags ?? [], MODELS, context.model)
  const llmQ = resolveLLM(stanChoiceQ.modelId, env)
  const res = await fetch(llmQ.url, {
    method: 'POST',
    headers: llmQ.headers,
    body: JSON.stringify({
      model: llmQ.modelId,
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

    // ── L3 CHURN DETECTION ────────────────────────────────────────
    // Students inactive > 5 days → proactive re-engagement message
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000
    const churning = await env.DB.prepare(`
      SELECT uid, handle, group_id, session_count FROM student_profiles
      WHERE last_seen < ? AND onboarding_stage NOT IN ('new', 'churning')
      LIMIT 20
    `)
      .bind(fiveDaysAgo)
      .all()

    for (const student of churning.results || []) {
      const uid = student.uid as string
      const groupId = student.group_id as string
      if (!groupId) continue

      // Mark as churning so we don't spam
      await env.DB.prepare("UPDATE student_profiles SET onboarding_stage = 'churning' WHERE uid = ?")
        .bind(uid)
        .run()
        .catch(() => {})

      // Proactive re-engagement
      const msg = `Hi! We noticed you haven't practised in a few days. Life gets busy — that's okay. Amara is ready whenever you are. Even 5 minutes of practice keeps the momentum going. 💬`
      await send(env, groupId, msg).catch(() => {})
    }

    // ── L6 WEEKLY EDU SUMMARY ─────────────────────────────────────
    // Every Sunday (cron: 0 8 * * 0) or when cron.name matches
    const isWeeklySummary = event.cron === '0 8 * * 0' || (event as unknown as { name?: string }).name === 'weekly-edu'
    if (!isWeeklySummary) return

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const [activeStudents, newStudents, sidecars] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as n FROM student_profiles WHERE last_seen > ?').bind(weekAgo).first(),
      env.DB.prepare('SELECT COUNT(*) as n FROM student_profiles WHERE first_seen > ?').bind(weekAgo).first(),
      env.DB.prepare('SELECT COUNT(*) as n FROM amara_sidecar WHERE ts > ?').bind(weekAgo).first(),
    ])

    const active = (activeStudents?.n as number) || 0
    const newCount = (newStudents?.n as number) || 0
    const sessions = (sidecars?.n as number) || 0

    // Find most common mistake categories this week
    const mistakeRows = await env.DB.prepare('SELECT mistakes FROM amara_sidecar WHERE ts > ? AND mistakes != "[]"')
      .bind(weekAgo)
      .all()

    const mistakeCounts: Record<string, number> = {}
    for (const row of mistakeRows.results || []) {
      const mistakes: string[] = JSON.parse((row.mistakes as string) || '[]')
      for (const m of mistakes) {
        const cat = m.split(':')[0]?.trim() || m
        mistakeCounts[cat] = (mistakeCounts[cat] || 0) + 1
      }
    }
    const topMistakes = Object.entries(mistakeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, n]) => `${cat} (${n}×)`)

    const summary = [
      `📊 Weekly Elevare Summary`,
      `Active students: ${active}`,
      `New this week: ${newCount}`,
      `Amara sessions logged: ${sessions}`,
      topMistakes.length > 0 ? `Top mistakes: ${topMistakes.join(', ')}` : null,
      `\nCurriculum focus: review ${topMistakes[0] || 'recent patterns'} across group exercises this week.`,
    ]
      .filter(Boolean)
      .join('\n')

    // Signal debby:edu group — the Education Director's inbox
    const eduGroup = `debby:edu`
    await env.DB.prepare(`INSERT OR IGNORE INTO groups (id, channel, name, created_at) VALUES (?, 'internal', ?, ?)`)
      .bind(eduGroup, 'Education Director', Math.floor(Date.now() / 1000))
      .run()
      .catch(() => {})

    await env.DB.prepare(
      `INSERT INTO messages (id, group_id, channel, sender, content, role, ts) VALUES (?, ?, 'internal', 'substrate', ?, 'assistant', ?)`,
    )
      .bind(`edu-summary-${Date.now()}`, eduGroup, summary, Date.now())
      .run()
      .catch(() => {})
  },
}
