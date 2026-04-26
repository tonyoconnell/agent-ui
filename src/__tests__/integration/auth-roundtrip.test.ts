/**
 * Auth round-trip integration test.
 *
 * Tests the full TypeDB path:
 *   generateApiKey → hashKey → writeSilent (TypeDB write via gateway)
 *   → readParsed (TypeDB read via gateway) → verifyKey
 *
 * This is the exact flow that broke silently before — the write appeared
 * to succeed but the read verification path was never tested end-to-end.
 *
 * Cassette schema: world.tql (post-KEK-fix, 2026-04-21)
 *
 * Record:
 *   RECORD=1 bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
 *
 * Replay (CI):
 *   bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
 */

import { afterAll, describe, expect, it } from 'vitest'
import { useCassette } from '@/__tests__/helpers/cassette'
import { generateApiKey, hashKey, verifyKey } from '@/lib/api-key'
import { escapeTqlString, readParsed, writeSilent } from '@/lib/typedb'

// SKIP: cassette schema_hash mismatch (recorded 1d539bd66699 vs current df85fd9d0166).
// Re-record with: RECORD=1 GATEWAY_API_KEY=<key> PUBLIC_GATEWAY_URL=<url> TYPEDB_DIRECT_URL="" bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
describe('auth round-trip', () => {
  const keyId = `key-vcr-${Date.now()}`
  const testUid = `vcr-user-${Date.now()}`

  // cleanup fires before cassette closes (LIFO afterAll order)
  afterAll(async () => {
    const safeId = escapeTqlString(keyId)
    await writeSilent(`match $k isa api-key, has api-key-id "${safeId}"; delete $k isa api-key;`)
  })

  useCassette('auth-agent-create')

  it('creates a key, stores hash, and verifies round-trip', async () => {
    // Fixed key so the cassette-recorded hash matches on every replay.
    // generateApiKey() is random — a fresh key can't verify against an old recorded hash.
    const apiKey = 'sk_vcr_fixed_replay_safe_auth_roundtrip_1a2b3c'
    const hash = await hashKey(apiKey)
    const safeId = escapeTqlString(keyId)
    const safeUid = escapeTqlString(testUid)
    const safeHash = escapeTqlString(hash)

    // Write to TypeDB (via gateway — intercepted by cassette in CI)
    await writeSilent(`
      insert $k isa api-key,
        has api-key-id "${safeId}",
        has key-hash "${safeHash}",
        has user-id "${safeUid}",
        has permissions "read,write",
        has key-status "active";
    `)

    // Read back (via gateway — intercepted by cassette in CI)
    const rows = await readParsed(`
      match $k isa api-key, has api-key-id "${safeId}", has key-hash $h;
      select $h;
    `)

    expect(rows.length).toBeGreaterThan(0)
    const storedHash = rows[0].h as string
    const valid = await verifyKey(apiKey, storedHash)
    expect(valid).toBe(true)
  })

  it('rejects a wrong key against the stored hash', async () => {
    const realKey = generateApiKey()
    const hash = await hashKey(realKey)
    const valid = await verifyKey(generateApiKey(), hash)
    expect(valid).toBe(false)
  })
})
