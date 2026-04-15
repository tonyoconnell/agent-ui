/**
 * kek.ts — Tenant KEK encryption, decryption, crypto-shred, and Merkle root
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock TypeDB — kek.ts must not hit the database in unit tests
vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn().mockResolvedValue([]),
  write: vi.fn().mockResolvedValue(undefined),
}))

// Mock MASTER_KEK env var — 32 bytes base64
const MOCK_MASTER_KEK = btoa(String.fromCharCode(...new Uint8Array(32).fill(1)))
process.env.MASTER_KEK = MOCK_MASTER_KEK

import { readParsed, write } from '@/lib/typedb'
import { computeMerkle, decryptForGroup, encryptForGroup, shredGroup } from './kek'

describe('tenant KEK — encrypt and decrypt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(readParsed).mockResolvedValue([]) // No existing KEK → generate new
    vi.mocked(write).mockResolvedValue(undefined)
  })

  it('encryptForGroup produces an ENC: prefixed string', async () => {
    const result = await encryptForGroup('group-test', 'hello world')
    expect(result).toMatch(/^ENC:/)
  })

  it('decryptForGroup recovers the original plaintext', async () => {
    const ciphertext = await encryptForGroup('group-roundtrip', 'secret payload')
    const plaintext = await decryptForGroup('group-roundtrip', ciphertext)
    expect(plaintext).toBe('secret payload')
  })

  it('decryptForGroup throws for non-ENC strings', async () => {
    await expect(decryptForGroup('group-test', 'not-encrypted')).rejects.toThrow()
  })
})

describe('crypto-shred — shredGroup', () => {
  it('shredGroup calls TypeDB delete for the tenant-kek entity', async () => {
    vi.mocked(write).mockResolvedValue(undefined)
    await shredGroup('group-shred-test')
    expect(write).toHaveBeenCalledWith(expect.stringContaining('delete $k isa tenant-kek'))
  })
})

describe('computeMerkle', () => {
  it('returns empty string for empty array', async () => {
    expect(await computeMerkle([])).toBe('')
  })

  it('returns a base64 string for non-empty input', async () => {
    const root = await computeMerkle(['a', 'b', 'c'])
    expect(root).toBeTruthy()
    expect(typeof root).toBe('string')
  })

  it('is deterministic — same input produces same root', async () => {
    const leaves = ['signal-1', 'signal-2', 'signal-3']
    const r1 = await computeMerkle(leaves)
    const r2 = await computeMerkle(leaves)
    expect(r1).toBe(r2)
  })

  it('is order-independent — sorts before hashing', async () => {
    const r1 = await computeMerkle(['a', 'b', 'c'])
    const r2 = await computeMerkle(['c', 'a', 'b'])
    expect(r1).toBe(r2)
  })
})
