/**
 * ui-signal — fire-and-forget UI gesture signals.
 *
 * emitClick is the ONLY path for UI click gestures → substrate.
 * Pin the contract:
 *  - POST URL is /api/signal
 *  - receiver comes from the element id
 *  - data.tags derived from id segments + 'ui' + 'click'
 *  - data.rich carries optional payload
 *  - never throws (fire-and-forget)
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'

beforeEach(() => {
  // Reset module state — emitClick has a `signalDisabled` flag that latches
  // after a 4xx/5xx in dev. Without resetting modules, test 3 (fetch rejects)
  // poisons tests 4–5.
  vi.resetModules()
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response())),
  )
})

describe('emitClick', () => {
  test('emitClick sends POST to /api/signal with correct receiver', async () => {
    const { emitClick } = await import('./ui-signal')
    await emitClick('ui:chat:copy')

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    expect(fetchMock).toHaveBeenCalledOnce()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/signal')
    expect(init.method).toBe('POST')

    const body = JSON.parse(init.body as string)
    expect(body.receiver).toBe('ui:chat:copy')
  })

  test('emitClick derives tags from id', async () => {
    const { emitClick } = await import('./ui-signal')
    await emitClick('ui:chat:copy')

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body as string)
    const data = JSON.parse(body.data as string)

    expect(data.tags).toEqual(['ui', 'click', 'chat', 'copy'])
  })

  test('emitClick is fire-and-forget, does not throw on fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network error'))),
    )

    const { emitClick } = await import('./ui-signal')

    await expect(
      new Promise<void>((resolve) => {
        emitClick('ui:chat:stop')
        setTimeout(resolve, 0)
      }),
    ).resolves.toBeUndefined()
  })

  test('emitClick with payload puts it in data.rich', async () => {
    const { emitClick } = await import('./ui-signal')
    const payload = { type: 'text' as const, content: 'hello' }
    await emitClick('ui:chat:copy', payload)

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body as string)
    const data = JSON.parse(body.data as string)

    expect(data.rich).toEqual(payload)
  })

  test('emitClick without payload omits data.rich', async () => {
    const { emitClick } = await import('./ui-signal')
    await emitClick('ui:chat:scroll')

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body as string)
    const data = JSON.parse(body.data as string)

    expect(data).not.toHaveProperty('rich')
  })
})
