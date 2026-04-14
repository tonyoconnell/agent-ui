import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'
import type { APIRoute } from 'astro'
import { chooseModel, type ModelSpec, markOutcome, seedModels } from '@/engine/llm-router'
import { getNet } from '@/lib/net'

export const prerender = false

// Candidate models for the 'chat' tag. Substrate learns which earns the traffic.
const CHAT_MODELS: ModelSpec[] = [
  { id: 'meta-llama/llama-4-maverick', costPerMToken: 0.15 },
  { id: 'anthropic/claude-haiku-4-5', costPerMToken: 1.0 },
  { id: 'google/gemma-4-26b-a4b-it', costPerMToken: 0.15 },
  { id: 'anthropic/claude-sonnet-4-5', costPerMToken: 3.0 },
]

/**
 * Simple Chat API Endpoint
 *
 * Uses OpenRouter for streaming chat responses.
 * Model is picked by the substrate (tag='chat') unless client specifies one.
 * On stream finish, outcome marks the tag→model edge so pheromone accumulates.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages, model: clientModel, tags = ['chat'] } = (await request.json()) as any

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

    // Pheromone-driven model choice (unless client pinned one)
    const net = await getNet()
    seedModels(net, CHAT_MODELS, tags)
    const lastUser: string = messages[messages.length - 1]?.content ?? ''
    const choice = clientModel
      ? null
      : chooseModel(net, CHAT_MODELS, {
          prompt: lastUser,
          tags,
          estimatedTokens: Math.ceil(lastUser.length / 4) + 500,
          sensitivity: 0.7,
        })
    const selectedModel = clientModel ?? choice?.model.id ?? 'meta-llama/llama-4-maverick'

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
      model: openrouter(selectedModel),
      system: systemPrompt,
      messages,
      onFinish: ({ text, finishReason }) => {
        if (!choice) return // client pinned the model — don't train that edge
        const quality = finishReason === 'stop' && text.length > 20 ? 0.7 : text.length > 0 ? 0.4 : 0
        markOutcome(net, choice, { response: text, quality })
      },
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
