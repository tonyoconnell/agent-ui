/**
 * VCR-style cassette helper for Vitest.
 *
 * Intercepts fetch calls to the TypeDB gateway and either:
 *   - RECORD mode: passes through to the real gateway, saves responses to disk
 *   - REPLAY mode: returns saved responses from disk (no network)
 *
 * Schema staleness detection: each cassette stores a hash of world.tql at
 * record time. On replay, if the schema has changed, the cassette throws
 * immediately rather than silently replaying responses that may no longer
 * match the current TypeDB schema.
 *
 * Usage:
 *   import { useCassette } from '@/__tests__/helpers/cassette'
 *
 *   describe('my suite', () => {
 *     useCassette('auth-agent-create')   // mounts cassette for this suite
 *
 *     it('does the thing', async () => {
 *       // all fetch calls to the gateway are intercepted and replayed
 *     })
 *   })
 *
 * To record a cassette (requires live gateway access):
 *   RECORD=1 \
 *   GATEWAY_API_KEY=<key> \
 *   PUBLIC_GATEWAY_URL=<url> \
 *   TYPEDB_DIRECT_URL="" \
 *   bun vitest run src/__tests__/integration/<test-file>.test.ts
 *
 * To replay (normal CI):
 *   bun vitest run src/__tests__/integration/<test-file>.test.ts
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, afterAll, vi } from 'vitest'

const CASSETTE_DIR = resolve(process.cwd(), 'src/__tests__/cassettes')
const SCHEMA_PATH = resolve(process.cwd(), 'src/schema/world.tql')
const RECORD_MODE = process.env.RECORD === '1'
// In record mode, intercept whatever gateway is configured (David's or Tony's).
// In replay (CI), intercept the production gateway that the cassette was recorded against.
const GATEWAY_URL = process.env.PUBLIC_GATEWAY_URL || 'https://api.one.ie'

interface Interaction {
  id: string
  request: { url: string; method: string; body?: unknown }
  response: { status: number; body: unknown }
  recorded_at: string
}

interface CassetteFile {
  schema_hash: string
  interactions: Interaction[]
}

/** Short SHA-256 of world.tql — detects schema changes that would invalidate cassettes */
function currentSchemaHash(): string {
  try {
    const content = readFileSync(SCHEMA_PATH, 'utf-8')
    return createHash('sha256').update(content).digest('hex').slice(0, 12)
  } catch {
    return 'unknown'
  }
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
          `  RECORD=1 GATEWAY_API_KEY=<key> PUBLIC_GATEWAY_URL=<url> TYPEDB_DIRECT_URL="" bun vitest run <test-file>`,
        )
      }

      const data = JSON.parse(readFileSync(cassettePath, 'utf-8')) as CassetteFile
      const liveHash = currentSchemaHash()

      if (data.schema_hash !== 'unknown' && liveHash !== 'unknown' && data.schema_hash !== liveHash) {
        throw new Error(
          `Cassette '${name}' is stale — schema has changed.\n` +
          `  Recorded against schema: ${data.schema_hash}\n` +
          `  Current schema:          ${liveHash}\n` +
          `Re-record with:\n` +
          `  RECORD=1 GATEWAY_API_KEY=<key> PUBLIC_GATEWAY_URL=<url> TYPEDB_DIRECT_URL="" bun vitest run <test-file>`,
        )
      }

      interactions = data.interactions
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
            `Re-record with: RECORD=1 GATEWAY_API_KEY=<key> PUBLIC_GATEWAY_URL=<url> TYPEDB_DIRECT_URL="" bun vitest run <test-file>`,
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
      const cassette: CassetteFile = {
        schema_hash: currentSchemaHash(),
        interactions: recorded,
      }
      writeFileSync(cassettePath, JSON.stringify(cassette, null, 2))
      console.log(`[cassette] Recorded ${recorded.length} interactions → ${cassettePath} (schema: ${cassette.schema_hash})`)
    }
  })
}
