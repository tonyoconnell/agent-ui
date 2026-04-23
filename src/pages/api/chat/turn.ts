import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { type ModelMessage, streamText } from 'ai'
import type { APIRoute } from 'astro'
import { ingestMessage, measureOutcome } from '@/engine/chat'
import { buildPack, systemPromptWithPack } from '@/lib/chat/context-pack'
import { warmUI } from '@/lib/ui-prefetch'
import {
  isBuilderIntent,
  builderResponse,
  initialBuilderState,
  type BuilderArcState,
} from '@/components/chat/arcs/builder'

export const prerender = false

/**
 * POST /api/chat/turn
 *
 * Memory-aware chat endpoint. Runs the six-step turn loop:
 *   1. ingestMessage()     — classify text, ensure actor in TypeDB
 *   2. measureOutcome()    — valence of new msg vs last turn → mark/warn
 *   3. buildPack()         — assemble ContextPack from TypeDB (parallel queries)
 *   4. systemPromptWithPack() — inject memory into system prompt
 *   5. streamText()        — call LLM with enhanced prompt
 *   6. (outcome persisted on next turn start)
 *
 * Body: { messages, model?, apiKey?, actorUid?, lastTags? }
 *   messages  — full conversation history (last is user turn)
 *   model     — OpenRouter model id (optional, defaults to llama-4-maverick)
 *   apiKey    — OpenRouter API key (optional, uses server key if absent)
 *   actorUid  — stable actor uid (optional, defaults to "visitor:web")
 *   lastTags  — tags from previous turn for outcome measurement (optional)
 *
 * Returns: SSE stream (same format as /api/chat)
 * Headers: X-Turn-Tags — comma-separated tags for this turn (pass as lastTags next call)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      messages: Array<{ role: string; content: string }>
      model?: string
      apiKey?: string
      actorUid?: string
      lastTags?: string[]
      builderState?: BuilderArcState
    }

    const { messages, model, apiKey: clientApiKey, actorUid, lastTags = [], builderState } = body

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = clientApiKey ?? import.meta.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const selectedModel = model ?? 'meta-llama/llama-4-maverick'
    const lastUserMessage = messages[messages.length - 1]?.content ?? ''

    // Builder arc: detect "I want an AI team" intent and handle via dedicated arc
    // instead of routing through the LLM. Clients pass builderState back each turn
    // so the arc can advance through discover → configure → deploy → done.
    const activeBuilderState = builderState ?? (isBuilderIntent(lastUserMessage) ? initialBuilderState() : null)
    if (activeBuilderState) {
      const arc = builderResponse(activeBuilderState, lastUserMessage)
      const payload = JSON.stringify({
        reply: arc.reply,
        builderState: arc.newState,
        ...(arc.richPayload !== undefined ? { richPayload: arc.richPayload } : {}),
      })
      return new Response(payload, {
        headers: { 'Content-Type': 'application/json', 'X-Arc': 'builder' },
      })
    }

    // Step 1: classify + ensure actor
    const { uid, tags } = ingestMessage(lastUserMessage, actorUid)

    // Step 2: measure outcome of previous turn (fire-and-forget)
    void measureOutcome(uid, lastTags, lastUserMessage).catch(() => {})
    // Pre-warm UI permission bypass so next click skips TypeDB gate queries
    warmUI([
      'ui:chat:copy',
      'ui:chat:stop',
      'ui:chat:scroll',
      'ui:chat:clear',
      'ui:chat:toggle-director',
      'ui:chat:settings',
      'ui:chat:dismiss-banner',
      'ui:prompt:submit',
      'ui:prompt:stop',
      'ui:prompt:attach-file',
      'ui:prompt:camera',
      'ui:prompt:settings',
      'ui:prompt:add-model',
    ])

    // Step 3: assemble memory pack from TypeDB
    const pack = await buildPack(uid).catch(() => ({
      profile: { uid, handle: uid, messageCount: 0 },
      hypotheses: [],
      highways: [],
      recent: [],
      tools: [],
      frontier: [],
    }))

    // Step 4: inject memory into system prompt
    const baseSystemPrompt = 'You are a helpful assistant.'
    const systemPrompt = systemPromptWithPack(baseSystemPrompt, pack)

    // Step 5: stream LLM response
    const openrouter = createOpenAICompatible({
      name: 'openrouter',
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://one.ie',
        'X-Title': 'ONE',
      },
    })

    const result = streamText({
      model: openrouter(selectedModel),
      system: systemPrompt,
      messages: messages as ModelMessage[],
    })

    const response = result.toTextStreamResponse()

    // Return tags in header so client can pass as lastTags on next call
    const headers = new Headers(response.headers)
    headers.set('X-Turn-Tags', tags.join(','))

    return new Response(response.body, {
      status: response.status,
      headers,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
