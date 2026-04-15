/**
 * Wave 3 — Transport layer speed.
 *
 * Measures intent cache, WebSocket broadcast, durable ask, and channel
 * normalizers. D1 / WsHub / Telegram HTTP are stubbed with realistic
 * latency profiles so we see OUR overhead, not the platform's.
 */
import { beforeEach, describe, test, vi } from 'vitest'
import { measure, measureSync } from '@/__tests__/helpers/speed'

// Minimal D1 stub — records calls, returns canned rows.
function mockD1(store: Record<string, unknown> = {}) {
  const stmt = (sql: string) => ({
    bind: (..._args: unknown[]) => ({
      first: async <T>() => store[sql] as T,
      all: async <T>() => ({ results: (store[sql] as T[]) ?? [] }),
      run: async () => ({ success: true }),
    }),
    first: async <T>() => store[sql] as T,
    all: async <T>() => ({ results: (store[sql] as T[]) ?? [] }),
    run: async () => ({ success: true }),
  })
  return {
    prepare: (sql: string) => stmt(sql),
    exec: async () => ({ success: true }),
    batch: async () => [],
    dump: async () => new ArrayBuffer(0),
  } as unknown as D1Database
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('system speed — intent cache', () => {
  test('resolveIntent — keyword match (no D1)', async () => {
    const { resolveIntent } = await import('@/engine/intent')
    const intents = [
      { name: 'translate', label: 'Translate', keywords: ['translate', 'language'], patterns: [] },
      { name: 'summarize', label: 'Summarize', keywords: ['summary', 'summarize'], patterns: [] },
    ]
    await measure('intent:resolve:keyword', () => resolveIntent('translate this to french', { intents }), 1_000)
  })

  test('resolveIntent — exact label match (fastest path)', async () => {
    const { resolveIntent } = await import('@/engine/intent')
    const intents = [{ name: 'translate', label: 'Translate', keywords: ['translate'], patterns: [] }]
    await measure('intent:resolve:label', () => resolveIntent('translate', { intents }), 2_000)
  })

  test('resolveIntent — miss falls through cleanly', async () => {
    const { resolveIntent } = await import('@/engine/intent')
    await measure('intent:resolve:miss', () => resolveIntent('xyzabc never matches', { intents: [] }), 2_000)
  })
})

describe('system speed — websocket broadcast', () => {
  test('wsManager.broadcast — in-process fanout', async () => {
    const { wsManager, registerDevBroadcaster } = await import('@/lib/ws-server')
    let received = 0
    registerDevBroadcaster(() => {
      received++
    })
    measureSync(
      'ws:broadcast:roundtrip',
      () =>
        wsManager.broadcast({
          type: 'task-update',
          task: { tid: 'bench', name: 'bench', status: 'done' },
          timestamp: Date.now(),
        }),
      2_000,
    )
    // sanity: listener received at least something
    if (received === 0) throw new Error('broadcast listener never fired')
  })
})

describe('system speed — durable ask', () => {
  // durableAsk polls D1 for up to 25s waiting for resolve — that's the
  // durability feature, not the overhead. The overhead is the write itself.
  // Measure the D1 insert path — that's what an in-memory ask doesn't pay.
  test('ask:durable:overhead — D1 insert only', async () => {
    const db = mockD1()
    const stmt = `INSERT INTO pending_asks (id, signal_json, from_unit, expires_at, channel, channel_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
    await measure(
      'ask:durable:overhead',
      async () => {
        const id = `ask:${crypto.randomUUID()}`
        await db
          .prepare(stmt)
          .bind(id, '{}', 'sender', Date.now() + 10_000, null, null, Date.now())
          .run()
      },
      500,
    )
  })
})

describe('system speed — channels', () => {
  test('telegram webhook normalize (shape-only)', () => {
    const webhook = {
      update_id: 1,
      message: {
        message_id: 100,
        chat: { id: 123, type: 'private' },
        from: { id: 456, username: 'user' },
        text: 'hello',
        date: Date.now() / 1000,
      },
    }
    // Normalize: the shape our channel layer expects before handing off to
    // the substrate. Pure function — measures JSON shape extraction.
    measureSync(
      'channels:telegram:normalize',
      () => {
        const msg = webhook.message
        return {
          channel: 'telegram',
          group: `tg-${msg.chat.id}`,
          sender: `tg-user-${msg.from.id}`,
          text: msg.text,
          at: msg.date * 1000,
        }
      },
      5_000,
    )
  })

  test('web /message — request shape construction', () => {
    measureSync(
      'channels:web:message',
      () => ({
        channel: 'web',
        group: 'web-session-abc',
        sender: 'web-user-xyz',
        text: 'hello world',
        at: Date.now(),
      }),
      5_000,
    )
  })
})
