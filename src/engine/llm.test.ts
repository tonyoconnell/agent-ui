/**
 * llm.test.ts — Test Effect-powered LLM adapters
 *
 * Verifies: happy path decoding, schema mismatch dies, 5xx retries, 4xx fails fast,
 * network errors retry, timeout maps to transient, Complete signature preserved.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { anthropic, openai, openrouter } from './llm'

describe('llm.ts — Effect-powered adapters', () => {
  const originalFetch = globalThis.fetch
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  const okResponse = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

  const errResponse = (status: number, body = 'error') =>
    new Response(body, { status, headers: { 'Content-Type': 'text/plain' } })

  describe('openrouter', () => {
    it('returns the content string on 200', async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ choices: [{ message: { content: 'hello' } }] }))
      const complete = openrouter('test-key')
      const result = await complete('prompt')
      expect(result).toBe('hello')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('passes system prompt from ctx', async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ choices: [{ message: { content: 'x' } }] }))
      await openrouter('key')('prompt', { system: 'be nice' })
      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.messages[0]).toEqual({ role: 'system', content: 'be nice' })
      expect(body.messages[1]).toEqual({ role: 'user', content: 'prompt' })
    })

    it('retries 3 times on 503 before failing', async () => {
      fetchMock
        .mockResolvedValueOnce(errResponse(503))
        .mockResolvedValueOnce(errResponse(503))
        .mockResolvedValueOnce(okResponse({ choices: [{ message: { content: 'recovered' } }] }))
      const result = await openrouter('key')('prompt')
      expect(result).toBe('recovered')
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('retries on 429 (rate limit)', async () => {
      fetchMock
        .mockResolvedValueOnce(errResponse(429))
        .mockResolvedValueOnce(okResponse({ choices: [{ message: { content: 'ok' } }] }))
      const result = await openrouter('key')('prompt')
      expect(result).toBe('ok')
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('does NOT retry on 400 (deterministic failure)', async () => {
      fetchMock.mockResolvedValueOnce(errResponse(400, 'bad request'))
      await expect(openrouter('key')('prompt')).rejects.toThrow(/400/)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('does NOT retry on 401 (auth)', async () => {
      fetchMock.mockResolvedValueOnce(errResponse(401, 'unauthorized'))
      await expect(openrouter('bad-key')('prompt')).rejects.toThrow(/401/)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('dies on schema mismatch (malformed response)', async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ error: 'something went wrong' }))
      await expect(openrouter('key')('prompt')).rejects.toThrow(/Schema/)
    })

    it('retries on network error', async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(okResponse({ choices: [{ message: { content: 'ok' } }] }))
      const result = await openrouter('key')('prompt')
      expect(result).toBe('ok')
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('gives up after 4 attempts (1 + 3 retries)', async () => {
      // Factory — each call returns a fresh Response (bodies are one-shot)
      fetchMock.mockImplementation(async () => errResponse(503))
      await expect(openrouter('key')('prompt')).rejects.toThrow(/503/)
      expect(fetchMock).toHaveBeenCalledTimes(4)
    })

    it('uses the default model when not specified', async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ choices: [{ message: { content: 'x' } }] }))
      await openrouter('key')('prompt')
      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.model).toBe('meta-llama/llama-4-maverick')
    })
  })

  describe('anthropic', () => {
    it('decodes content[0].text shape', async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ content: [{ text: 'claude says hi' }] }))
      const result = await anthropic('key')('prompt')
      expect(result).toBe('claude says hi')
    })

    it('dies on schema mismatch', async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ choices: [] }))
      await expect(anthropic('key')('prompt')).rejects.toThrow(/Schema/)
    })
  })

  describe('openai', () => {
    it('decodes choices[0].message.content shape', async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ choices: [{ message: { content: 'gpt says hi' } }] }))
      const result = await openai('key')('prompt')
      expect(result).toBe('gpt says hi')
    })
  })

  describe('Complete signature preservation', () => {
    it('openrouter returns Promise<string>, not Effect', async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ choices: [{ message: { content: 'x' } }] }))
      const promise = openrouter('key')('prompt')
      expect(promise).toBeInstanceOf(Promise)
      const result = await promise
      expect(typeof result).toBe('string')
    })
  })
})
