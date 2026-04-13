import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'
import type { APIRoute } from 'astro'

export const prerender = false

/**
 * Simple Chat API Endpoint
 *
 * Uses OpenRouter for streaming chat responses
 * Supports world commands via system prompt
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages, model = 'meta-llama/llama-4-maverick' } = (await request.json()) as any

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = import.meta.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const openrouter = createOpenAICompatible({
      name: 'openrouter',
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': 'https://one.ie',
        'X-Title': 'ONE Substrate',
      },
      apiKey,
    })

    const systemPrompt = `You are a helpful assistant for the ONE world interface.
You help users control a network of agents and signals.

Available commands (users can speak these naturally):
- "create/spawn a [kind] agent" - Create a new agent
- "connect [from] to [to]" - Create a flow between agents
- "send signal to [agent]" - Send a signal to an agent
- "show highways" - Show the strongest paths
- "list agents" - Show all agents
- "decay" - Fade all trails
- "inject/burst" - Send signals to all agents

Respond helpfully and suggest commands when appropriate.`

    const result = streamText({
      model: openrouter(model),
      system: systemPrompt,
      messages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[CHAT API] Error:', error)
    return new Response(JSON.stringify({ error: 'Chat request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
