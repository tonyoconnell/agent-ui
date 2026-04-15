/**
 * signalSender — HTTP contract for UI gestures.
 *
 * These senders are the ONLY path for UI → substrate writes. Wrong shape
 * here = silently broken world manipulation. Pin:
 *  - POST URL is /api/signal
 *  - body carries sender, receiver, data
 *  - data is stringified when it's an object
 *  - network errors return { ok: false, error } (never throw)
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { measure } from '@/__tests__/helpers/speed'

type FetchCall = { url: string; init: RequestInit | undefined }

let calls: FetchCall[]
let responder: (url: string, init?: RequestInit) => Response

beforeEach(() => {
  calls = []
  responder = () => new Response(JSON.stringify({ ok: true, routed: 'ok' }), { status: 200 })
  vi.stubGlobal('fetch', ((url: string, init?: RequestInit) => {
    calls.push({ url, init })
    return Promise.resolve(responder(url, init))
  }) as typeof fetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function lastBody() {
  const init = calls.at(-1)?.init
  return init?.body ? JSON.parse(init.body as string) : null
}

describe('signalSender — shape', () => {
  test('signalMove posts { receiver: world:move, data: {id,x,y} }', async () => {
    const { signalMove } = await import('./signalSender')
    await signalMove('u1', 10, 20)
    expect(calls[0].url).toBe('/api/signal')
    expect(calls[0].init?.method).toBe('POST')
    const body = await lastBody()
    expect(body.receiver).toBe('world:move')
    expect(body.sender).toBe('ui:world')
    expect(JSON.parse(body.data)).toEqual({ id: 'u1', x: 10, y: 20 })
  })

  test('signalRename / Link / Mark / Warn carry the right receiver', async () => {
    const sender = await import('./signalSender')
    await sender.signalRename('u1', 'New')
    await sender.signalLink('a', 'b')
    await sender.signalMark('a', 'b')
    await sender.signalWarn('a', 'b')
    const receivers = await Promise.all(calls.map((c) => JSON.parse(c.init?.body as string).receiver))
    expect(receivers).toEqual(['world:rename', 'world:link', 'world:mark', 'world:warn'])
  })

  test('signalGroup serializes units array', async () => {
    const { signalGroup } = await import('./signalSender')
    await signalGroup(['a', 'b', 'c'], 'squad')
    const body = await lastBody()
    expect(JSON.parse(body.data)).toEqual({ units: ['a', 'b', 'c'], name: 'squad' })
  })
})

describe('signalSender — error handling', () => {
  test('network error returns { ok: false, error } (no throw)', async () => {
    vi.stubGlobal('fetch', (() => Promise.reject(new Error('boom'))) as typeof fetch)
    const { signalMove } = await import('./signalSender')
    const res = await signalMove('u1', 0, 0)
    expect(res.ok).toBe(false)
    expect(res.error).toMatch(/boom/)
  })

  test('non-200 response still returns the parsed body', async () => {
    responder = () => new Response(JSON.stringify({ ok: false, error: 'bad data' }), { status: 400 })
    const { signalMark } = await import('./signalSender')
    const res = await signalMark('a', 'b')
    expect(res.ok).toBe(false)
    expect(res.error).toBe('bad data')
  })
})

describe('signalSender — speed', () => {
  test('sender overhead stays trivial (pure JSON + fetch stub)', async () => {
    const { signalMark } = await import('./signalSender')
    const perOp = await measure('signalSender:mark', () => signalMark('a', 'b'), 500)
    expect(perOp).toBeLessThan(2) // the sender itself, excluding real network
  })
})
