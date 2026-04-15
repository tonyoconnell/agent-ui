/**
 * bot:respond — systemPromptWithPack + OpenRouter call → reply string.
 *
 * Takes a ContextPack and a base system prompt, merges them,
 * then calls OpenRouter to get the bot reply.
 * Returns empty string on failure (caller handles fallback).
 */

import { systemPromptWithPack } from '../lib/prompt'
import type { Env } from '../types'
import type { ContextPack } from './types'

export async function respond(
  env: Env,
  model: string,
  baseSystemPrompt: string,
  pack: ContextPack,
  messages: { role: string; content: string }[],
): Promise<string> {
  const systemPrompt = systemPromptWithPack(baseSystemPrompt, pack)

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://one.ie',
      'X-Title': 'NanoClaw',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })

  if (!res.ok) return ''

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return (data.choices?.[0]?.message?.content as string) || ''
}
