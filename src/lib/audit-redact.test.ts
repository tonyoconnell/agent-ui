import { describe, expect, it } from 'vitest'
import { redactOnly, redactPayload } from './audit-redact'

// ── helper ────────────────────────────────────────────────────────────────────

async function sha256Hex(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── 1. Hash determinism ───────────────────────────────────────────────────────

describe('hash determinism', () => {
  it('same input produces same hash on repeated calls', async () => {
    const input = { action: 'login', uid: 'human:alice', token: 'sk_abc123' }
    const r1 = await redactPayload(input)
    const r2 = await redactPayload(input)
    expect(r1.hash).toBe(r2.hash)
  })

  it('key order in input does not change the hash', async () => {
    const a = { b: 'B', a: 'A', c: 'C' }
    const b = { c: 'C', b: 'B', a: 'A' }
    const r1 = await redactPayload(a)
    const r2 = await redactPayload(b)
    expect(r1.hash).toBe(r2.hash)
  })

  it('different inputs produce different hashes', async () => {
    const r1 = await redactPayload({ x: 1 })
    const r2 = await redactPayload({ x: 2 })
    expect(r1.hash).not.toBe(r2.hash)
  })
})

// ── 2. Allow-list keys are preserved ─────────────────────────────────────────

describe('allow-list keys preserved verbatim', () => {
  it('receiver, action, amount, group, sender, gate are unchanged', async () => {
    const r = await redactPayload({
      receiver: 'x:y',
      action: 'foo',
      amount: 42,
      group: 'g:marketing',
      sender: 'human:alice',
      gate: 'operator',
      token: 'sk_secret',
    })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.receiver).toBe('x:y')
    expect(obj.action).toBe('foo')
    expect(obj.amount).toBe(42)
    expect(obj.group).toBe('g:marketing')
    expect(obj.sender).toBe('human:alice')
    expect(obj.gate).toBe('operator')
    expect(obj.token).toBe('[REDACTED:bearer]')
  })
})

// ── 3. Bearer redaction ───────────────────────────────────────────────────────

describe('bearer redaction', () => {
  it('sk_owner_ prefix', async () => {
    const r = await redactPayload({ key: 'sk_owner_abc123' })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.key).toBe('[REDACTED:bearer]')
  })

  it('api_ prefix', async () => {
    const r = await redactPayload({ key: 'api_lh7_RaNd0m' })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.key).toBe('[REDACTED:bearer]')
  })

  it('Bearer <token> string', async () => {
    const r = await redactPayload({ auth: 'Bearer eyJ.X.Y' })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.auth).toBe('[REDACTED:bearer]')
  })

  it('raw JWT (3 dot-segments)', async () => {
    // eyJ<10+ chars>.<chars>.<anything> — typical JWT shape
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.SIG'
    const r = await redactPayload({ token: jwt })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.token).toBe('[REDACTED:bearer]')
  })

  it('plain string that is not a bearer is preserved', async () => {
    const r = await redactPayload({ description: 'hello world' })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.description).toBe('hello world')
  })
})

// ── 4. credId redaction ───────────────────────────────────────────────────────

describe('credId redaction', () => {
  const credValue = 'AABBCCDDEEFFaabbccddeeff11' // ≥ 22 base64url chars

  it('redacted under credId key', async () => {
    const r = await redactPayload({ credId: credValue })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.credId).toBe('[REDACTED:credId]')
  })

  it('redacted under credentialId key', async () => {
    const r = await redactPayload({ credentialId: credValue })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.credentialId).toBe('[REDACTED:credId]')
  })

  it('preserved under an unrelated key', async () => {
    const r = await redactPayload({ label: credValue })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.label).toBe(credValue)
  })
})

// ── 5. Seed redaction ─────────────────────────────────────────────────────────

describe('seed redaction', () => {
  const hex64 = 'deadbeef'.repeat(8) // 64 hex chars
  const hex64Prefixed = `0x${hex64}`

  it('redacted under seed key', async () => {
    const r = await redactPayload({ seed: hex64 })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.seed).toBe('[REDACTED:seed]')
  })

  it('redacted under privateKey key', async () => {
    const r = await redactPayload({ privateKey: hex64 })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.privateKey).toBe('[REDACTED:seed]')
  })

  it('redacted with 0x prefix under seed', async () => {
    const r = await redactPayload({ seed: hex64Prefixed })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.seed).toBe('[REDACTED:seed]')
  })

  it('same hex under unrelated key is preserved', async () => {
    const r = await redactPayload({ txHash: hex64 })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.txHash).toBe(hex64)
  })
})

// ── 6. Mnemonic redaction ─────────────────────────────────────────────────────

describe('mnemonic redaction', () => {
  const words12 = 'abandon ability able about above absent absorb abstract absurd abuse access accident'
  const words24 = [
    'abandon ability able about above absent absorb abstract',
    'absurd abuse access accident acid action actor address',
    'admit adult advance advice aerobic affair afford afraid',
  ].join(' ')
  const words11 = 'abandon ability able about above absent absorb abstract absurd abuse access'
  const mixedCase = 'Abandon ability able about above absent absorb abstract absurd abuse access accident'
  const longWord = 'abandon ability able about above absent absorb abstract absurd abuse accessibility accident'

  it('redacts 12-word BIP39 mnemonic', async () => {
    const r = await redactPayload({ phrase: words12 })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.phrase).toBe('[REDACTED:mnemonic]')
  })

  it('redacts 24-word BIP39 mnemonic', async () => {
    const r = await redactPayload({ phrase: words24 })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.phrase).toBe('[REDACTED:mnemonic]')
  })

  it('preserves 11-word phrase (not BIP39 length)', async () => {
    const r = await redactPayload({ phrase: words11 })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.phrase).toBe(words11)
  })

  it('preserves 12 words with mixed case', async () => {
    const r = await redactPayload({ phrase: mixedCase })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.phrase).toBe(mixedCase)
  })

  it('preserves 12 words where one word is too long (>8 chars)', async () => {
    const r = await redactPayload({ phrase: longWord })
    const obj = JSON.parse(r.redacted) as Record<string, unknown>
    expect(obj.phrase).toBe(longWord)
  })
})

// ── 7. Round-trip: nested object with mix of secrets + allow-listed keys ──────

describe('round-trip nested payload', () => {
  it('keeps allow-listed values, replaces secrets, preserves structure', async () => {
    const input = {
      receiver: 'agent:bob',
      action: 'pay',
      amount: 100,
      auth: {
        token: 'sk_live_supersecret',
        credId: 'AABBCCDDEEFFaabbccddeeff11',
      },
      wallet: {
        seed: 'deadbeef'.repeat(8),
        address: '0xabc',
      },
      sig: 'MEUCIQD...',
      tags: ['payment', 'agent'],
    }

    const r = await redactPayload(input)
    const obj = JSON.parse(r.redacted) as Record<string, unknown>

    // Allow-listed — verbatim
    expect(obj.receiver).toBe('agent:bob')
    expect(obj.action).toBe('pay')
    expect(obj.amount).toBe(100)

    // Nested secrets — redacted
    const auth = obj.auth as Record<string, unknown>
    expect(auth.token).toBe('[REDACTED:bearer]')
    expect(auth.credId).toBe('[REDACTED:credId]')

    const wallet = obj.wallet as Record<string, unknown>
    expect(wallet.seed).toBe('[REDACTED:seed]')
    expect(wallet.address).toBe('0xabc') // not 64 hex, not under seed key

    // Top-level sig
    expect(obj.sig).toBe('[REDACTED:signature]')

    // Array preserved
    expect(obj.tags).toEqual(['payment', 'agent'])
  })
})

// ── 8. Hash is sha256 of ORIGINAL (not redacted) canonical JSON ───────────────

describe('hash correctness', () => {
  it('hash matches manual sha256 of canonical JSON of original input', async () => {
    const input = { b: 'secret: sk_abc', a: 'hello' }

    // canonical order is alphabetical: a first, then b
    const canonical = JSON.stringify({ a: 'hello', b: 'secret: sk_abc' })
    const expected = await sha256Hex(canonical)

    const r = await redactPayload(input)
    expect(r.hash).toBe(expected)
    expect(r.hash).toHaveLength(64)
  })
})

// ── 9. redactOnly sync variant ────────────────────────────────────────────────

describe('redactOnly', () => {
  it('returns redacted JSON without hash', () => {
    const result = redactOnly({ key: 'sk_test', action: 'noop' })
    const obj = JSON.parse(result) as Record<string, unknown>
    expect(obj.key).toBe('[REDACTED:bearer]')
    expect(obj.action).toBe('noop') // allow-listed
  })
})
