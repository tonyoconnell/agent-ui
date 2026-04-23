/**
 * Post-deploy smoke tests — runs against dev.one.ie after every deploy.
 *
 * These are NOT unit tests. They hit the live system and:
 *   - Verify the auth round-trip works end-to-end
 *   - Catch TypeDB connectivity failures (IP allowlist, network)
 *   - Catch CF Workers runtime breakage (env binding errors)
 *
 * Run after deploy:
 *   TEST_ENV=dev bun vitest run src/__tests__/smoke/post-deploy.test.ts
 *
 * Never run in normal CI — would pollute production TypeDB with test agents.
 * The skipIf guard ensures this only runs when explicitly requested.
 */

import { beforeAll, describe, expect, it } from 'vitest'

const BASE = process.env.SMOKE_URL ?? 'https://dev.one.ie'
const runSmoke = process.env.TEST_ENV === 'dev' || process.env.TEST_ENV === 'smoke'

describe.skipIf(!runSmoke)('post-deploy smoke', () => {
  let apiKey: string
  let uid: string

  describe('health', () => {
    it('gateway is up', async () => {
      const res = await fetch('https://api.one.ie/health')
      expect(res.status).toBe(200)
    })

    it('astro worker is up', async () => {
      const res = await fetch(`${BASE}/api/health`)
      expect(res.status).not.toBe(500)
    })
  })

  describe('auth round-trip', () => {
    beforeAll(async () => {
      const res = await fetch(`${BASE}/api/auth/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `smoke-test-${Date.now()}` }),
      })
      if (res.ok) {
        const data = (await res.json()) as { uid: string; apiKey: string }
        uid = data.uid
        apiKey = data.apiKey
      }
    })

    it('creates an agent and returns a key', () => {
      expect(uid).toBeTruthy()
      expect(apiKey).toMatch(/^api_/)
    })

    it('key works on a gated endpoint', async () => {
      const res = await fetch(`${BASE}/api/memory/reveal/${uid}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      // 401 = key rejected (TypeDB read failed — the bug we're catching)
      // 403 = key valid but wrong role (acceptable)
      // 200 = full success
      expect(res.status).not.toBe(401)
    })

    it('invalid key is rejected', async () => {
      const res = await fetch(`${BASE}/api/memory/reveal/${uid}`, {
        headers: { Authorization: 'Bearer api_fake_vcr_key_that_does_not_exist' },
      })
      expect(res.status).toBe(401)
    })
  })

  describe('signal flow', () => {
    it('can send a signal and get a routable response', async () => {
      if (!apiKey) return // skip if auth setup failed
      const res = await fetch(`${BASE}/api/signal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiver: `${uid}:echo`, data: { content: 'smoke-ping' } }),
      })
      // 200 = signal routed and handled
      // 404 = unit or skill not found (acceptable for smoke — unit may not have echo handler)
      expect([200, 404]).toContain(res.status)
    })
  })
})
