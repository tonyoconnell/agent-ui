import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'
import type { APIRoute } from 'astro'
import { chooseModel, type ModelSpec, markOutcome, seedModels } from '@/engine/llm-router'
import { buildPack, systemPromptWithPack } from '@/lib/chat/context-pack'
import { getNet } from '@/lib/net'

export const prerender = false

// Candidate models for the 'chat' tag. Substrate learns which earns the traffic.
// groq:/cerebras: prefix = direct API. Plain = OpenRouter fallback.
const CHAT_MODELS: ModelSpec[] = [
  { id: 'groq:meta-llama/llama-4-scout-17b-16e-instruct', costPerMToken: 0.11 }, // 87 tok/s, 459ms
  { id: 'groq:llama-3.1-8b-instant', costPerMToken: 0.05 }, // 82 tok/s, 502ms
  { id: 'groq:llama-3.3-70b-versatile', costPerMToken: 0.59 }, // best quality
  { id: 'cerebras:llama3.1-8b', costPerMToken: 0.1 }, // cerebras fallback
  { id: 'meta-llama/llama-4-scout', costPerMToken: 0.08 }, // openrouter fallback
  { id: 'anthropic/claude-haiku-4-5', costPerMToken: 1.0 },
  { id: 'anthropic/claude-sonnet-4-5', costPerMToken: 3.0 },
]

/**
 * Simple Chat API Endpoint
 *
 * Routes to Cerebras (direct, ~445ms) if CEREBRAS_API_KEY is set, else OpenRouter.
 * Model is picked by the substrate (tag='chat') unless client specifies one.
 * On stream finish, outcome marks the tag→model edge so pheromone accumulates.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const {
      messages,
      model: clientModel,
      tags = ['chat'],
      system: clientSystem,
      agentId,
    } = (await request.json()) as any

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { getEnv } = await import('@/lib/cf-env')
    const rt = (await getEnv(locals)) as Record<string, string>
    const groqKey = import.meta.env.GROQ_API_KEY || rt.GROQ_API_KEY
    const cerebrasKey = import.meta.env.CEREBRAS_API_KEY || rt.CEREBRAS_API_KEY
    const openrouterKey = import.meta.env.OPENROUTER_API_KEY || rt.OPENROUTER_API_KEY
    if (!groqKey && !cerebrasKey && !openrouterKey) {
      return new Response(JSON.stringify({ error: 'No LLM API key configured' }), {
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
    const defaultModel = groqKey
      ? 'groq:meta-llama/llama-4-scout-17b-16e-instruct'
      : cerebrasKey
        ? 'cerebras:llama3.1-8b'
        : 'meta-llama/llama-4-scout'
    const selectedModel = clientModel ?? choice?.model.id ?? defaultModel

    // Route by prefix: groq: → Groq LPU, cerebras: → Cerebras silicon, plain → OpenRouter
    const isGroq = selectedModel.startsWith('groq:') && !!groqKey
    const isCerebras = selectedModel.startsWith('cerebras:') && !!cerebrasKey
    const modelId = isGroq ? selectedModel.slice(5) : isCerebras ? selectedModel.slice(9) : selectedModel

    const provider = isGroq
      ? createOpenAICompatible({ name: 'groq', baseURL: 'https://api.groq.com/openai/v1', apiKey: groqKey! })
      : isCerebras
        ? createOpenAICompatible({ name: 'cerebras', baseURL: 'https://api.cerebras.ai/v1', apiKey: cerebrasKey! })
        : createOpenAICompatible({
            name: 'openrouter',
            baseURL: 'https://openrouter.ai/api/v1',
            headers: { 'HTTP-Referer': 'https://one.ie', 'X-Title': 'ONE Substrate' },
            apiKey: openrouterKey!,
          })

    const defaultSystem = `You are a helpful assistant for the ONE world interface.
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

    // If the caller provided a system prompt AND an agentId, enrich with world knowledge.
    // buildPack queries TypeDB for hypotheses + highways — cap it at 5s, never block chat.
    let systemPrompt = clientSystem || defaultSystem
    if (clientSystem && agentId) {
      try {
        const pack = await Promise.race([
          buildPack(agentId),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ])
        systemPrompt = systemPromptWithPack(clientSystem, pack)
      } catch {
        // TypeDB down or slow — use the raw system prompt as-is
      }
    }

    const result = streamText({
      model: provider(modelId),
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
