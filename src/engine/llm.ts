/**
 * LLM — Language model as a unit
 *
 * 30 lines. Any model. Same interface.
 */

import { unit, type Unit, type Emit } from './world'

type Complete = (prompt: string, ctx?: Record<string, unknown>) => Promise<string>

export const llm = (id: string, complete: Complete): Unit => {
  return unit(id)
    .on('complete', async ({ prompt, system, history }, emit, ctx) => {
      const response = await complete(prompt, { system, history })
      emit({ receiver: ctx.from, data: { response } })
    })
    .on('stream', async ({ prompt, system, onChunk }, emit, ctx) => {
      let full = ''
      await complete(prompt + '\n[STREAM]', {
        system,
        onToken: (t: string) => { full += t; onChunk?.(t) }
      })
      emit({ receiver: ctx.from, data: { response: full } })
    })
}

// Adapters for common providers
export const anthropic = (apiKey: string) => (prompt: string, ctx?: Record<string, unknown>) =>
  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: ctx?.system, messages: [{ role: 'user', content: prompt }] })
  }).then(r => r.json()).then(d => d.content[0].text)

export const openai = (apiKey: string) => (prompt: string, ctx?: Record<string, unknown>) =>
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: ctx?.system || '' }, { role: 'user', content: prompt }] })
  }).then(r => r.json()).then(d => d.choices[0].message.content)
