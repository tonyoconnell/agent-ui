/**
 * VCR-style cassette helper for Vitest.
 *
 * Intercepts fetch calls to the TypeDB gateway (api.one.ie) and either:
 *   - RECORD mode: passes through to the real gateway, saves responses to disk
 *   - REPLAY mode: returns saved responses from disk (no network)
 *
 * Usage:
 *   import { useCassette } from '@/__tests__/helpers/cassette'
 *
 *   describe('my suite', () => {
 *     useCassette('auth-agent-create')   // mounts cassette for this suite
 *
 *     it('does the thing', async () => {
 *       // all fetch calls to api.one.ie are intercepted and replayed
 *     })
 *   })
 *
 * To record a cassette (requires live access to dev.one.ie):
 *   RECORD=1 bun vitest run src/__tests__/integration/<test-file>.test.ts
 *
 * To replay (normal CI):
 *   bun vitest run src/__tests__/integration/<test-file>.test.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, afterAll, vi } from 'vitest'

const CASSETTE_DIR = resolve(process.cwd(), 'src/__tests__/cassettes')
const RECORD_MODE = process.env.RECORD === '1'
const GATEWAY_URL = 'https://api.one.ie'

interface Interaction {
  id: string
  request: { url: string; method: string; body?: unknown }
  response: { status: number; body: unknown }
  recorded_at: string
}

export function useCassette(name: string) {
  const cassettePath = resolve(CASSETTE_DIR, `${name}.json`)
  let interactions: Interaction[] = []
  let callIndex = 0
  const recorded: Interaction[] = []

  beforeAll(() => {
    const originalFetch = global.fetch

    if (!RECORD_MODE) {
      if (!existsSync(cassettePath)) {
        throw new Error(
          `Cassette not found: ${cassettePath}\n` +
          `Record it with:\n` +
          `  RECORD=1 bun vitest run <test-file>`,
        )
      }
      interactions = JSON.parse(readFileSync(cassettePath, 'utf-8'))
      callIndex = 0
    }

    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString()

      // Only intercept gateway calls — pass everything else through
      if (!url.startsWith(GATEWAY_URL)) {
        return originalFetch(input, init)
      }

      if (RECORD_MODE) {
        const real = await originalFetch(input, init)
        const clone = real.clone()
        const body = await clone.json().catch(() => null)
        let reqBody: unknown = null
        try { reqBody = JSON.parse(init?.body as string) } catch { /* empty */ }

        recorded.push({
          id: `${name}-${String(recorded.length + 1).padStart(3, '0')}`,
          request: { url, method: init?.method ?? 'GET', body: reqBody },
          response: { status: real.status, body },
          recorded_at: new Date().toISOString(),
        })

        return real
      } else {
        const interaction = interactions[callIndex++]
        if (!interaction) {
          throw new Error(
            `Cassette '${name}' ran out of interactions at call ${callIndex}.\n` +
            `Re-record with: RECORD=1 bun vitest run <test-file>`,
          )
        }

        return new Response(JSON.stringify(interaction.response.body), {
          status: interaction.response.status,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()

    if (RECORD_MODE && recorded.length > 0) {
      if (!existsSync(CASSETTE_DIR)) mkdirSync(CASSETTE_DIR, { recursive: true })
      writeFileSync(cassettePath, JSON.stringify(recorded, null, 2))
      console.log(`[cassette] Recorded ${recorded.length} interactions → ${cassettePath}`)
    }
  })
}
