/**
 * LLM — Language model as a unit
 *
 * 30 lines. Any model. Same interface.
 */

import { type Unit, unit } from './world'

type Complete = (prompt: string, ctx?: Record<string, unknown>) => Promise<string>

export const llm = (id: string, complete: Complete): Unit => {
  return unit(id)
    .on('complete', async (d, emit, ctx) => {
      const { prompt, system, history } = d as { prompt: string; system?: string; history?: unknown }
      const response = await complete(prompt, { system, history })
      emit({ receiver: ctx.from, data: { response } })
    })
    .on('stream', async (d, emit, ctx) => {
      const { prompt, system, onChunk } = d as { prompt: string; system?: string; onChunk?: (t: string) => void }
      let full = ''
      await complete(`${prompt}\n[STREAM]`, {
        system,
        onToken: (t: string) => {
          full += t
          onChunk?.(t)
        },
      })
      emit({ receiver: ctx.from, data: { response: full } })
    })
}

// OpenRouter adapter — all models through one gateway
export const openrouter =
  (apiKey: string, model = 'google/gemma-4-26b-a4b-it') =>
  (prompt: string, ctx?: Record<string, unknown>) =>
    fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://one.ie',
        'X-Title': 'ONE Substrate',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          ...(ctx?.system ? [{ role: 'system', content: ctx.system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    })
      .then((r) => r.json())
      .then((d) => (d as any).choices[0].message.content)

// Legacy adapters (kept for compatibility, prefer openrouter)
export const anthropic = (apiKey: string) => (prompt: string, ctx?: Record<string, unknown>) =>
  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: ctx?.system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
    .then((r) => r.json())
    .then((d) => (d as any).content[0].text)

export const openai = (apiKey: string) => (prompt: string, ctx?: Record<string, unknown>) =>
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: ctx?.system || '' },
        { role: 'user', content: prompt },
      ],
    }),
  })
    .then((r) => r.json())
    .then((d) => (d as any).choices[0].message.content)
