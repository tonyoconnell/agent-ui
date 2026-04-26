/**
 * agent-key-load — fetch + verify the agent's seed at worker boot.
 *
 * Lifecycle (per docs/agent-boot-unlock.md):
 *   1. Worker calls POST /api/agents/:uid/unlock with its bearer
 *   2. one.ie returns 60s HMAC-signed token containing wrapped ciphertext
 *   3. Worker verifies sig, holds wrapped data + seed in process memory only
 *   4. On 503 (owner offline): exponential backoff, fail closed if cap reached
 *
 * V1 scope: this helper fetches the WRAPPED token. The actual unwrap (which
 * needs the agent KEK derived from owner PRF on the owner Mac) is a
 * follow-on call out of scope here. The helper exposes the verified token
 * to the worker; the worker either:
 *   (a) calls a separate owner-Mac unwrap endpoint with the ciphertext
 *   (b) holds wrapped data and signs nothing until upgraded
 * Either path keeps the seed off worker persistent storage.
 *
 * Worker boot pattern:
 *
 *   const token = await loadAgentToken({
 *     ownerHost: 'https://one.ie',
 *     uid: env.AGENT_UID,
 *     bearer: env.AGENT_BEARER,
 *     unlockSigningKeyB64: env.UNLOCK_SIGNING_KEY,  // shared with one.ie
 *   })
 *   if (!token) throw new Error('agent unable to boot — owner offline?')
 *   // token.ciphertextB64 + token.ivB64 + token.kdfVersion ready for unwrap
 */

export interface UnlockToken {
  ciphertextB64: string
  ivB64: string
  kdfVersion: number
  expiresAt: number // unix-second
  address: string
  sig: string
}

export interface LoadOptions {
  ownerHost: string // e.g. https://one.ie
  uid: string
  bearer: string
  unlockSigningKeyB64: string // base64url-encoded raw HMAC key (shared secret)
  /** Max retries on 503 before giving up. Default 6 (~63s total backoff). */
  maxAttempts?: number
  /** Optional fetch override for tests. */
  fetchImpl?: typeof fetch
}

export class AgentBootError extends Error {
  constructor(
    message: string,
    public readonly cause: 'owner-offline' | 'bad-bearer' | 'no-wallet' | 'bad-sig' | 'expired' | 'unknown',
  ) {
    super(message)
    this.name = 'AgentBootError'
  }
}

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const bin = atob(b64 + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function verifyTokenSig(token: UnlockToken, uid: string, keyBytes: Uint8Array): Promise<boolean> {
  const canonical = `${token.ciphertextB64}|${token.ivB64}|${token.kdfVersion}|${token.expiresAt}|${token.address}|${uid}`
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical))
  return b64urlEncode(new Uint8Array(expected)) === token.sig
}

/**
 * Fetch + verify the unlock token. Retries with exponential backoff on
 * 503 (owner offline) up to `maxAttempts`. Throws AgentBootError on any
 * unrecoverable failure (bad bearer, bad sig, expired token, exhausted retries).
 */
export async function loadAgentToken(opts: LoadOptions): Promise<UnlockToken> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const maxAttempts = opts.maxAttempts ?? 6
  const url = `${opts.ownerHost.replace(/\/$/, '')}/api/agents/${encodeURIComponent(opts.uid)}/unlock`
  const keyBytes = b64urlDecode(opts.unlockSigningKeyB64)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${opts.bearer}`, 'Content-Type': 'application/json' },
      body: '{}',
    })

    if (res.status === 401) throw new AgentBootError('bearer rejected', 'bad-bearer')
    if (res.status === 403) throw new AgentBootError('bearer-uid-mismatch', 'bad-bearer')
    if (res.status === 404) throw new AgentBootError('no agent_wallet for this uid', 'no-wallet')

    if (res.status === 503) {
      // Owner offline — back off and retry. Exp backoff: 1s, 2s, 4s, 8s, …, capped at 60s.
      if (attempt === maxAttempts - 1) {
        throw new AgentBootError('owner offline; max retries exhausted', 'owner-offline')
      }
      const ms = Math.min(60_000, 1000 * 2 ** attempt)
      await new Promise((r) => setTimeout(r, ms))
      continue
    }

    if (!res.ok) {
      throw new AgentBootError(`unexpected status ${res.status}`, 'unknown')
    }

    const token = (await res.json()) as UnlockToken

    // Verify HMAC signature
    const sigOk = await verifyTokenSig(token, opts.uid, keyBytes)
    if (!sigOk) throw new AgentBootError('token signature mismatch', 'bad-sig')

    // Verify TTL
    const now = Math.floor(Date.now() / 1000)
    if (token.expiresAt < now) throw new AgentBootError('token already expired', 'expired')

    return token
  }

  throw new AgentBootError('owner offline; loop terminated without success', 'owner-offline')
}
