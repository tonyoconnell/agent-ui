/**
 * POST /api/chat/summarize
 *
 * Called when a chat session ends (tab close / navigation away).
 * Extracts structured insights from the conversation and persists them
 * as multiple hypotheses in TypeDB so the agent remembers across sessions.
 *
 * Fire-and-forget from the client via navigator.sendBeacon().
 * Returns { ok: true, summary, topics, unresolved, userIntent } or { ok: false } on failure.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { generateText } from 'ai'
import type { APIRoute } from 'astro'
import { writeTracked } from '@/lib/typedb'

export const prerender = false

const MAX_MESSAGES = 10

interface ConversationInsights {
  summary: string
  topics: string[]
  unresolved: string | null
  userIntent: string
}

/** Derive p-value from conversation length */
function pValueForLength(count: number): number {
  if (count >= 10) return 0.05
  if (count >= 5) return 0.10
  return 0.30
}

/** Escape double-quotes for inline TypeQL string literals */
function tqlSafe(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, "'").slice(0, 500)
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as {
      agentId?: string
      messages?: Array<{ role: string; content: string }>
    }

    const { agentId, messages } = body

    if (!agentId || !messages || messages.length < 2) {
      return Response.json({ ok: false, reason: 'insufficient messages' }, { status: 400 })
    }

    const rt = (locals as any).runtime?.env ?? {}
    const groqKey = import.meta.env.GROQ_API_KEY || rt.GROQ_API_KEY
    const openrouterKey = import.meta.env.OPENROUTER_API_KEY || rt.OPENROUTER_API_KEY

    if (!groqKey && !openrouterKey) {
      return Response.json({ ok: false, reason: 'no api key' }, { status: 500 })
    }

    // Take only the last N messages to keep the prompt short
    const slice = messages.slice(-MAX_MESSAGES)

    const transcript = slice
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    // Cheapest model available — groq 8b or openrouter fallback
    const provider = groqKey
      ? createOpenAICompatible({ name: 'groq', baseURL: 'https://api.groq.com/openai/v1', apiKey: groqKey })
      : createOpenAICompatible({
          name: 'openrouter',
          baseURL: 'https://openrouter.ai/api/v1',
          headers: { 'HTTP-Referer': 'https://one.ie', 'X-Title': 'ONE Substrate' },
          apiKey: openrouterKey!,
        })

    const modelId = groqKey ? 'llama-3.1-8b-instant' : 'meta-llama/llama-4-scout'

    const { text: raw } = await generateText({
      model: provider(modelId),
      system: `You extract structured insights from a conversation. Return ONLY valid JSON with this exact shape:
{
  "summary": "1-2 sentence narrative of what happened",
  "topics": ["lowercase", "topic", "tags", "no", "hashes"],
  "unresolved": "anything the user asked that wasn't fully answered, or null if everything was addressed",
  "userIntent": "what the user was trying to accomplish in one sentence"
}
No preamble. No markdown fences. Pure JSON only.`,
      prompt: `Extract insights from this conversation with agent "${agentId}":\n\n${transcript}`,
      maxTokens: 200,
    })

    const safe = agentId.replace(/[^a-z0-9-_:]/gi, '-')
    const now = new Date().toISOString().slice(0, 19)
    const pValue = pValueForLength(slice.length)
    const ts = Date.now()

    // Attempt to parse structured JSON from LLM
    let insights: ConversationInsights | null = null
    try {
      const trimmed = raw.trim()
      // Strip markdown code fences if model wrapped anyway
      const jsonStr = trimmed.startsWith('```')
        ? trimmed.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        : trimmed
      const parsed = JSON.parse(jsonStr)
      if (parsed && typeof parsed.summary === 'string') {
        insights = {
          summary: parsed.summary,
          topics: Array.isArray(parsed.topics) ? parsed.topics.filter((t: unknown) => typeof t === 'string') : [],
          unresolved: typeof parsed.unresolved === 'string' ? parsed.unresolved : null,
          userIntent: typeof parsed.userIntent === 'string' ? parsed.userIntent : '',
        }
      }
    } catch {
      // JSON parse failed — fall through to graceful degradation
    }

    if (!insights) {
      // Graceful degradation: store raw text as a simple summary hypothesis
      const fallbackText = raw.trim().slice(0, 500)
      if (!fallbackText) {
        return Response.json({ ok: false, reason: 'empty summary' })
      }
      const hid = `conv-${safe}-${ts}`
      const statement = tqlSafe(`conversation with ${agentId}: ${fallbackText}`)
      const ok = await writeTracked(`
        insert $h isa hypothesis,
          has hid "${hid}",
          has statement "${statement}",
          has hypothesis-status "testing",
          has observations-count 1,
          has p-value ${pValue},
          has source "observed",
          has observed-at ${now},
          has action-ready false;
      `)
      return Response.json({ ok, summary: fallbackText })
    }

    // Store multiple hypotheses from the structured insights
    const writes: Promise<boolean>[] = []

    // 1. Main summary hypothesis
    const summaryStatement = tqlSafe(`conversation with ${agentId}: ${insights.summary}`)
    writes.push(
      writeTracked(`
        insert $h isa hypothesis,
          has hid "conv-${safe}-${ts}",
          has statement "${summaryStatement}",
          has hypothesis-status "testing",
          has observations-count 1,
          has p-value ${pValue},
          has source "observed",
          has observed-at ${now},
          has action-ready false;
      `)
    )

    // 2. Topic hypotheses — one per topic, L6 accumulates via upsertHypothesis
    for (let i = 0; i < insights.topics.length; i++) {
      const topic = insights.topics[i].toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40)
      if (!topic) continue
      const topicHid = `topic-${safe}-${topic}-${ts}-${i}`
      const topicStatement = tqlSafe(`topic:${agentId}:${topic}`)
      writes.push(
        writeTracked(`
          insert $h isa hypothesis,
            has hid "${topicHid}",
            has statement "${topicStatement}",
            has hypothesis-status "testing",
            has observations-count 1,
            has p-value ${pValue},
            has source "observed",
            has observed-at ${now},
            has action-ready false;
        `)
      )
    }

    // 3. Unresolved hypothesis — higher p-value (more uncertain), status testing
    if (insights.unresolved) {
      const unresolvedHid = `unresolved-${safe}-${ts}`
      const unresolvedStatement = tqlSafe(`unresolved:${agentId}: ${insights.unresolved}`)
      writes.push(
        writeTracked(`
          insert $h isa hypothesis,
            has hid "${unresolvedHid}",
            has statement "${unresolvedStatement}",
            has hypothesis-status "testing",
            has observations-count 1,
            has p-value 0.30,
            has source "observed",
            has observed-at ${now},
            has action-ready false;
        `)
      )
    }

    // Fire all writes in parallel
    await Promise.all(writes)

    return Response.json({
      ok: true,
      summary: insights.summary,
      topics: insights.topics,
      unresolved: insights.unresolved,
      userIntent: insights.userIntent,
    })
  } catch (err) {
    console.error('[CHAT/SUMMARIZE]', err)
    // Graceful failure — chat still worked, memory just won't persist
    return Response.json({ ok: false, reason: 'internal error' }, { status: 500 })
  }
}
