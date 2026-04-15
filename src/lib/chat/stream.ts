import type { StreamEvent } from './types'

/**
 * Parse a director SSE stream (chat-director endpoint).
 * Yields typed StreamEvent objects. All JSON parse errors are swallowed —
 * a malformed chunk is not fatal to the stream.
 */
export async function* parseDirectorStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<StreamEvent> {
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.slice(6)) as Record<string, unknown>
        if (data.type === 'message') {
          yield {
            type: 'message',
            sender: String(data.sender ?? ''),
            content: String(data.content ?? ''),
            timestamp: Number(data.timestamp ?? Date.now()),
            isStreaming: Boolean(data.isStreaming),
            avatar: data.avatar !== undefined ? String(data.avatar) : undefined,
            metadata: data.metadata as Record<string, unknown> | undefined,
          }
        } else if (data.type === 'agent-presence') {
          yield { type: 'agent-presence', agents: Array.isArray(data.agents) ? (data.agents as string[]) : [] }
        } else if (data.type === 'done') {
          yield { type: 'done' }
          return
        } else if (data.type === 'error') {
          yield { type: 'error', message: String(data.message ?? 'Stream error') }
          return
        }
      } catch {
        // malformed JSON — skip
      }
    }
  }
}

/**
 * Parse a standard OpenRouter/chat SSE stream.
 * Yields typed StreamEvent objects for text deltas, reasoning, tool calls, and UI components.
 */
export async function* parseChatStream(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<StreamEvent> {
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6)
      if (raw === '[DONE]') return

      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>

        if (parsed.type === 'tool_call') {
          const payload = parsed.payload as Record<string, unknown>
          yield {
            type: 'tool_call',
            name: String(payload?.name ?? ''),
            args: (payload?.args ?? {}) as Record<string, unknown>,
          }
        } else if (parsed.type === 'tool_result') {
          const payload = parsed.payload as Record<string, unknown>
          yield {
            type: 'tool_result',
            name: String(payload?.name ?? ''),
            result: payload?.result,
            args: payload?.args as Record<string, unknown> | undefined,
          }
        } else if (parsed.type && parsed.type !== 'text') {
          yield { type: 'ui', component: String(parsed.type), payload: parsed.payload }
        } else {
          const choices = parsed.choices as Array<{ delta?: { reasoning?: string; content?: string } }> | undefined
          const delta = choices?.[0]?.delta
          if (delta?.reasoning) {
            yield { type: 'reasoning', content: delta.reasoning }
          } else if (delta?.content) {
            yield { type: 'text', content: delta.content }
          }
        }
      } catch {
        // malformed JSON — skip
      }
    }
  }
}
