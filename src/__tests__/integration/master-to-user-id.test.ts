// master-to-user-id.test.ts — verifies masterToUserIdPub is deterministic,
// unique per master, and produces a 256-bit b64url string (43 chars, no padding).

import { describe, expect, it } from 'vitest'
import { masterToUserIdPub } from '@/components/u/lib/vault/crypto'

describe('masterToUserIdPub', () => {
  it('is deterministic — same master → same output', async () => {
    const master = new Uint8Array(32)
    crypto.getRandomValues(master)

    const a = await masterToUserIdPub(master)
    const b = await masterToUserIdPub(master)

    expect(a).toBe(b)
  })

  it('is deterministic across known fixed input', async () => {
    const master = new Uint8Array(32).fill(1)
    const first = await masterToUserIdPub(master)
    const second = await masterToUserIdPub(master)
    expect(first).toBe(second)
  })

  it('is unique — different masters → different outputs', async () => {
    const m1 = new Uint8Array(32).fill(1)
    const m2 = new Uint8Array(32).fill(2)

    const a = await masterToUserIdPub(m1)
    const b = await masterToUserIdPub(m2)

    expect(a).not.toBe(b)
  })

  it('is unique across many random masters', async () => {
    const seen = new Set<string>()
    for (let i = 0; i < 16; i++) {
      const m = new Uint8Array(32)
      crypto.getRandomValues(m)
      const id = await masterToUserIdPub(m)
      expect(seen.has(id)).toBe(false)
      seen.add(id)
    }
    expect(seen.size).toBe(16)
  })

  it('produces 43-char b64url with no padding (256 bits = 32 bytes)', async () => {
    const master = new Uint8Array(32).fill(7)
    const id = await masterToUserIdPub(master)

    expect(id).toHaveLength(43)
    expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(id).not.toContain('=')
    expect(id).not.toContain('+')
    expect(id).not.toContain('/')
  })

  it('accepts the 32-byte zero master', async () => {
    const zero = new Uint8Array(32) // all zeros
    const id = await masterToUserIdPub(zero)

    expect(id).toHaveLength(43)
    expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/)

    // Determinism still holds for zero input.
    const id2 = await masterToUserIdPub(new Uint8Array(32))
    expect(id).toBe(id2)
  })
})
