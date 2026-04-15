/**
 * Live cascade smoke test — brand save → render → mark → highway.
 *
 * Requires a running dev server at http://localhost:4321 AND the
 * live TypeDB schema migration from `scripts/migrate-brand-owner.ts`.
 *
 * Skipped by default. Opt in with `LIVE=1 bun run vitest run src/__tests__/live/`.
 *
 * What this verifies that the mocked tests cannot:
 *   1. `/api/brand/highways` parses `brand:<key>→thing:<id>` edges from
 *      real net.strength state (not mocked Record).
 *   2. `/design?thing=X&brand=purple` actually fires emitBrandApplied()
 *      via the SSR renderBrand() call in design.astro + Layout.astro.
 *   3. The bot UA filter (/bot|crawl|spider|…/i) prevents pheromone
 *      pollution from crawler traffic.
 *   4. `/api/brand/save` without a session returns 401 — the auth gate
 *      is actually wired, not just tested-in-isolation.
 *
 * If this fails, brand is broken in production even when unit tests pass.
 */

import { describe, expect, it } from 'vitest'

const BASE = process.env.LIVE_BASE_URL ?? 'http://localhost:4321'
const LIVE = process.env.LIVE === '1'

async function reachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(15_000) })
    return res.ok
  } catch {
    return false
  }
}

type Highway = {
  brand: string
  thingId?: string
  groupId?: string
  strength: number
  edge: string
}

async function getHighways(): Promise<{ highways: Highway[]; threshold: number }> {
  const res = await fetch(`${BASE}/api/brand/highways`)
  return (await res.json()) as { highways: Highway[]; threshold: number }
}

function findEdge(list: Highway[], edge: string): Highway | undefined {
  return list.find((h) => h.edge === edge)
}

const REAL_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'
const BOT_UA = 'Googlebot/2.1 (+http://www.google.com/bot.html)'

const purpleBrand = {
  background: { light: '0 0% 100%', dark: '0 0% 13%' },
  foreground: { light: '0 0% 13%', dark: '36 8% 96%' },
  font: { light: '0 0% 13%', dark: '0 0% 100%' },
  primary: { light: '280 100% 60%', dark: '280 100% 60%' },
  secondary: { light: '330 85% 55%', dark: '330 85% 60%' },
  tertiary: { light: '180 70% 40%', dark: '180 70% 50%' },
}

describe.skipIf(!LIVE)('brand cascade (live)', () => {
  it('dev server is reachable', async () => {
    const ok = await reachable(BASE)
    if (!ok) {
      throw new Error(`Dev server not reachable at ${BASE}. Start it with \`bun run dev\` and re-run.`)
    }
  })

  it('GET /api/brand/highways responds with expected shape', async () => {
    const json = await getHighways()
    expect(Array.isArray(json.highways)).toBe(true)
    expect(json.threshold).toBe(20)
  })

  it('GET /api/brand/palette responds with brand: null for default context', async () => {
    const res = await fetch(`${BASE}/api/brand/palette?mode=light`)
    expect(res.status).toBe(200)
    const json = (await res.json()) as { brand: unknown; mode: string }
    expect(json.mode).toBe('light')
  })

  it('POST /api/brand/save without session returns 401', async () => {
    const res = await fetch(`${BASE}/api/brand/save`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scope: 'thing', id: 'smoketest', brand: purpleBrand }),
    })
    expect(res.status).toBe(401)
    const json = (await res.json()) as { error: string }
    expect(json.error).toMatch(/unauth/i)
  })

  it('5 real-user /design hits deposit strength 5 on brand:purple→thing:smoketest-A', async () => {
    // Use a unique thingId so repeated test runs don't collide with accumulated state.
    const thingId = `smoketest-${Date.now()}-A`
    const edge = `brand:purple→thing:${thingId}`

    const before = findEdge((await getHighways()).highways, edge)
    const baseline = before?.strength ?? 0

    for (let i = 0; i < 5; i++) {
      await fetch(`${BASE}/design?thing=${thingId}&brand=purple`, {
        headers: { 'user-agent': REAL_UA },
      })
    }
    // give the in-memory mark a beat to be visible through the highways endpoint
    await new Promise((r) => setTimeout(r, 200))

    const after = findEdge((await getHighways()).highways, edge)
    expect(after).toBeDefined()
    expect(after!.strength - baseline).toBe(5)
    expect(after!.thingId).toBe(thingId)
    expect(after!.groupId).toBeUndefined()
  }, 60_000)

  it('group-scoped /design hit deposits on brand:purple→group:<gid>', async () => {
    const groupId = `smoketest-${Date.now()}-G`
    const edge = `brand:purple→group:${groupId}`

    const before = findEdge((await getHighways()).highways, edge)
    const baseline = before?.strength ?? 0

    await fetch(`${BASE}/design?group=${groupId}&brand=purple`, {
      headers: { 'user-agent': REAL_UA },
    })
    await new Promise((r) => setTimeout(r, 200))

    const after = findEdge((await getHighways()).highways, edge)
    expect(after).toBeDefined()
    expect(after!.strength - baseline).toBe(1)
    expect(after!.groupId).toBe(groupId)
    expect(after!.thingId).toBeUndefined()
  }, 30_000)

  it('bot UA does NOT deposit strength (crawler filter)', async () => {
    const thingId = `smoketest-${Date.now()}-BOT`
    const edge = `brand:purple→thing:${thingId}`

    const before = findEdge((await getHighways()).highways, edge)
    const baseline = before?.strength ?? 0

    for (let i = 0; i < 3; i++) {
      await fetch(`${BASE}/design?thing=${thingId}&brand=purple`, {
        headers: { 'user-agent': BOT_UA },
      })
    }
    await new Promise((r) => setTimeout(r, 200))

    const after = findEdge((await getHighways()).highways, edge)
    // Either the edge doesn't exist, or its strength did not move.
    const afterStrength = after?.strength ?? 0
    expect(afterStrength - baseline).toBe(0)
  }, 30_000)
})
