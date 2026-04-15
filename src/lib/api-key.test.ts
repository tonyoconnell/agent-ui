/**
 * AUTH — API Key: Generation & Hashing
 *
 * Two accuracy questions:
 *   1. Does generateApiKey() produce cryptographically random, well-formed keys?
 *   2. Does hashKey() + verifyKey() close the loop correctly?
 *
 * One speed question:
 *   3. Does key generation stay sub-millisecond (hashing is intentionally slow — it's PBKDF2)?
 *
 * Run: bun vitest run src/lib/api-key.test.ts
 */

import { describe, expect, it } from 'vitest'
import { generateApiKey, hashKey, verifyKey } from './api-key'

// ═══════════════════════════════════════════════════════════════════════════
// ACT 1: generateApiKey — format and randomness
//
// Format contract: api_<base36-timestamp>_<32 alphanumeric chars>
// Randomness contract: crypto.getRandomValues, not Math.random
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 1: generateApiKey — format and randomness', () => {
  it('produces a key with the correct prefix and structure', () => {
    const key = generateApiKey()
    // api_<timestamp36>_<32chars>
    expect(key).toMatch(/^api_[a-z0-9]+_[a-zA-Z0-9]{32}$/)
  })

  it('only uses characters from the safe alphabet', () => {
    const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const key = generateApiKey()
    const randomPart = key.split('_')[2]
    for (const ch of randomPart) {
      expect(ALPHABET).toContain(ch)
    }
  })

  it('two calls produce different keys (randomness check)', () => {
    const a = generateApiKey()
    const b = generateApiKey()
    expect(a).not.toBe(b)
  })

  it('generates 100 keys with no collisions', () => {
    const keys = new Set(Array.from({ length: 100 }, generateApiKey))
    expect(keys.size).toBe(100)
  })

  it('random part has 32 characters', () => {
    const key = generateApiKey()
    const parts = key.split('_')
    expect(parts).toHaveLength(3)
    expect(parts[2]).toHaveLength(32)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 2: hashKey + verifyKey — the closed loop
//
// Contract: hash(key) → opaque string. verify(key, hash) === true.
// Wrong key must produce false. Bad hash format must not throw.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 2: hashKey + verifyKey — round-trip and rejection', () => {
  it('verifies the original key against its hash', async () => {
    const key = generateApiKey()
    const hash = await hashKey(key)
    expect(await verifyKey(key, hash)).toBe(true)
  })

  it('rejects a different key against the hash', async () => {
    const key = generateApiKey()
    const hash = await hashKey(key)
    const other = generateApiKey()
    expect(await verifyKey(other, hash)).toBe(false)
  })

  it('rejects a subtly modified key (one char swapped)', async () => {
    const key = 'api_test_' + 'A'.repeat(32)
    const hash = await hashKey(key)
    const tampered = 'api_test_' + 'B' + 'A'.repeat(31)
    expect(await verifyKey(tampered, hash)).toBe(false)
  })

  it('returns false for a malformed hash without throwing', async () => {
    const key = generateApiKey()
    expect(await verifyKey(key, 'not-a-real-hash')).toBe(false)
    expect(await verifyKey(key, '')).toBe(false)
    expect(await verifyKey(key, '$bcrypt$wrongformat')).toBe(false)
  })

  it('hash output always starts with $pbkdf2$ sentinel', async () => {
    const hash = await hashKey(generateApiKey())
    expect(hash).toMatch(/^\$pbkdf2\$100000\$/)
  })

  it('two hashes of the same key differ (unique salts)', async () => {
    const key = generateApiKey()
    const h1 = await hashKey(key)
    const h2 = await hashKey(key)
    // Both verify, but hashes differ because salts are random
    expect(h1).not.toBe(h2)
    expect(await verifyKey(key, h1)).toBe(true)
    expect(await verifyKey(key, h2)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: Speed — generation must be sub-millisecond
//
// hashKey() is INTENTIONALLY slow (PBKDF2 100k iterations = ~100ms).
// That's a feature — it makes brute-force expensive.
// generateApiKey() has no such excuse: CSPRNG bytes → string, <1ms.
// ═══════════════════════════════════════════════════════════════════════════

describe('Act 3: speed — key generation budget', () => {
  it('generates a key in under 1ms', () => {
    const start = performance.now()
    generateApiKey()
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(1)
  })

  it('generates 1000 keys in under 10ms', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) generateApiKey()
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(10)
  })
})
