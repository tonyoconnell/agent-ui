import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'
import type { APIRoute } from 'astro'
import { ingestMessage, measureOutcome } from '@/engine/chat'
import { buildPack, systemPromptWithPack } from '@/lib/chat/context-pack'

export const prerender = false

/**
 * POST /api/chat/stream
 *
 * Resumable streaming chat endpoint.
 *
 * Contract:
 *   Request  { sid?: string, cursor?: string, message: string }
 *   Response  Server-Sent Events (ai-sdk text stream) where each chunk is a JSON line:
 *             { type, content?, richType?, richPayload?, cursor?, error? }
 *
 * Session / cursor semantics:
 *   - `sid` is generated via crypto.randomUUID() if absent (new session).
 *   - `cursor` format: "<sid>:<epochMs>:<seqNum>" — monotonically increasing.
 *   - Server rejects a request whose cursor timestamp is earlier than the last
 *     recorded cursor for that sid with { type:"error", error:"cursor-stale" }.
 *   - Last cursor per sid is stored best-effort in a module-level Map (survives
 *     within the same isolate; resets on cold start — acceptable for now).
 *
 * Streaming strategy:
 *   Uses ai-sdk streamText() → toDataStreamResponse() which emits the standard
 *   ai-sdk data-stream protocol over SSE.  A TransformStream wraps each chunk
 *   to inject the rolling cursor so consumers can resume.
 */

// ── In-process cursor registry (best-effort, isolate-scoped) ─────────────────
// Maps sid → last cursor timestamp (ms). Cold-start resets are acceptable;
// the stale-cursor guard is a best-effort safety net, not a hard guarantee.
const _cursorRegistry = new Map<string, number>()

function parseCursorMs(cursor: string): number {
  // cursor format: "<sid>:<epochMs>:<seqNum>"
  const parts = cursor.split(':')
  // Timestamp is the second-to-last segment (index -2)
  const ms = Number(parts[parts.length - 2])
  return Number.isFinite(ms) ? ms : 0
}

function makeCursor(sid: string, seq: number): string {
  return `${sid}:${Date.now()}:${seq}` as string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_SYSTEM =
  'You are a helpful assistant for the ONE world interface. ' +
  'Help users understand agents, signals, and the substrate.'

// ── Route ────────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as {
      sid?: string
      cursor?: string
      message?: string
      // optional actor context (same pattern as /api/chat/turn)
      actorUid?: string
      lastTags?: string[]
      model?: string
    }

    const { message, actorUid, lastTags = [], model: clientModel } = body

    if (!message || message.trim() === '') {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── sid / cursor handling ─────────────────────────────────────────────
    const sid = (body.sid ?? crypto.randomUUID()) as string
    const incomingCursor = body.cursor as string | undefined

    if (incomingCursor) {
      const incomingMs = parseCursorMs(incomingCursor)
      const lastMs = _cursorRegistry.get(sid) ?? 0
      if (incomingMs > 0 && incomingMs < lastMs) {
        // Stale cursor — client is behind a cursor already acknowledged
        const chunk = JSON.stringify({ type: 'error', error: 'cursor-stale' })
        return new Response(`data: ${chunk}\n\n`, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Chat-Sid': sid,
          },
        })
      }
    }

    // ── API key ───────────────────────────────────────────────────────────
    const { getEnv } = await import('@/lib/cf-env')
    const rt = (await getEnv(locals)) as Record<string, string>
    const openrouterKey = import.meta.env.OPENROUTER_API_KEY || rt.OPENROUTER_API_KEY
    const groqKey = import.meta.env.GROQ_API_KEY || rt.GROQ_API_KEY

    if (!openrouterKey && !groqKey) {
      return new Response(JSON.stringify({ error: 'No LLM API key configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── Ingest + memory ───────────────────────────────────────────────────
    const { uid, tags } = ingestMessage(message, actorUid)

    // Measure outcome of the previous turn (fire-and-forget)
    if (lastTags.length > 0) {
      void measureOutcome(uid, lastTags, message).catch(() => {})
    }

    // Assemble context pack from TypeDB (5s timeout, graceful fallback)
    const pack = await Promise.race([
      buildPack(uid),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]).catch(() => ({
      profile: { uid, handle: uid, messageCount: 0 },
      hypotheses: [],
      highways: [],
      recent: [],
      tools: [],
      frontier: [],
    }))

    const systemPrompt = systemPromptWithPack(DEFAULT_SYSTEM, pack)

    // ── Provider ──────────────────────────────────────────────────────────
    const selectedModel = clientModel ?? 'meta-llama/llama-4-maverick'

    const isGroq = selectedModel.startsWith('groq:') && !!groqKey
    const modelId = isGroq ? selectedModel.slice(5) : selectedModel

    const provider = isGroq
      ? createOpenAICompatible({
          name: 'groq',
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey: groqKey!,
        })
      : createOpenAICompatible({
          name: 'openrouter',
          baseURL: 'https://openrouter.ai/api/v1',
          headers: { 'HTTP-Referer': 'https://one.ie', 'X-Title': 'ONE Substrate' },
          apiKey: openrouterKey!,
        })

    // ── Stream ────────────────────────────────────────────────────────────
    let seq = 0

    const result = streamText({
      model: provider(modelId),
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      onFinish: () => {
        // Record the final cursor timestamp so future stale checks work
        _cursorRegistry.set(sid, Date.now())
      },
    })

    // Wrap the ai-sdk data stream to inject cursors into each SSE event.
    // ai-sdk toDataStreamResponse() emits lines like:
    //   0:"text chunk"\n
    //   e:{finishReason,...}\n
    //   d:{usage,...}\n
    // We pass these through unchanged but prepend our cursor metadata as
    // an additional JSON event line for consumers that opt-in.
    const upstream = result.toTextStreamResponse({
      headers: {
        'X-Chat-Sid': sid,
        'X-Turn-Tags': tags.join(','),
      },
    })

    // Inject cursor events into the stream by transforming each chunk.
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        // Pass the original ai-sdk chunk through unmodified
        controller.enqueue(chunk)

        // Emit a cursor sidecar event after each non-empty chunk
        const text = decoder.decode(chunk, { stream: true })
        if (text.trim()) {
          const cursor = makeCursor(sid, ++seq)
          // Keep cursor registry current so concurrent requests can detect staleness
          const cursorMs = parseCursorMs(cursor)
          const prev = _cursorRegistry.get(sid) ?? 0
          if (cursorMs > prev) _cursorRegistry.set(sid, cursorMs)

          const cursorEvent = `data: ${JSON.stringify({ type: 'cursor', cursor })}\n\n`
          controller.enqueue(encoder.encode(cursorEvent))
        }
      },
    })

    // Pipe upstream body → transform → response
    if (upstream.body) {
      void upstream.body.pipeTo(writable).catch(() => {})
    } else {
      void writable.close()
    }

    const headers = new Headers(upstream.headers)
    headers.set('X-Chat-Sid', sid)
    headers.set('X-Turn-Tags', tags.join(','))

    return new Response(readable, {
      status: upstream.status,
      headers,
    })
  } catch (error) {
    console.error('[CHAT STREAM] Error:', error)
    return new Response(JSON.stringify({ error: 'Stream request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
