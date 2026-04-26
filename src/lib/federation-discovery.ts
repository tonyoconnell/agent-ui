/**
 * federation-discovery.ts
 *
 * Fetch + cache the peer substrate's published owner pubkey from
 * /.well-known/owner-pubkey.json.
 *
 * Used by /api/paths/bridge V2 to verify that the `peerOwnerAddress`
 * claimed in the bridge body matches the address the foreign substrate
 * actually publishes — a strong step up from V1 (which trusted any caller).
 *
 * V2 acceptance criteria (Gap 6 V2):
 *   - Peer host is reachable.
 *   - Published address matches the claimed peerOwnerAddress.
 *   - Published version matches the claimed peerOwnerVersion.
 * This is NOT full WebAuthn signature verification (that is V2.2, which
 * requires JWKS/COSE keys). V2 binds the bridge to a specific Sui address +
 * version triple published by the peer's well-known endpoint.
 *
 * Gap 6 V2.2 TODO: extend PeerPubkey with a `jwks` field and run
 *   verifyAuthenticationResponse() (from @simplewebauthn/server) against
 *   the peer's published COSE key. Until then, the address+version triple
 *   is the acceptance proof.
 */

export interface PeerPubkey {
  /** Sui address of the foreign substrate's owner (0x...) */
  address: string
  /** Owner key version — must match the bridge body's peerOwnerVersion */
  version: number
  /** Unix seconds when the peer published this record */
  publishedAt: number
  /** Must be "owner-pubkey-v1" */
  schema: string
}

/** Cached entry shape */
interface CacheEntry {
  entry: PeerPubkey
  expires: number
}

// In-process cache: peerHost → cached PeerPubkey
// Map key is normalised host (no trailing slash, lower-case).
const CACHE = new Map<string, CacheEntry>()

/** Cache TTL: 5 minutes (matches Cache-Control on the endpoint itself) */
export const CACHE_TTL_MS = 5 * 60 * 1000

/** Address validation: 0x followed by exactly 64 hex chars */
const SUI_ADDRESS_RE = /^0x[0-9a-f]{64}$/i

function normalise(host: string): string {
  return host.replace(/\/+$/, '').toLowerCase()
}

function isValidPubkey(v: unknown): v is PeerPubkey {
  if (!v || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  if (typeof obj.address !== 'string') return false
  if (!SUI_ADDRESS_RE.test(obj.address)) return false
  if (typeof obj.version !== 'number') return false
  if (typeof obj.publishedAt !== 'number') return false
  if (obj.schema !== 'owner-pubkey-v1') return false
  return true
}

/**
 * Fetch + cache the peer substrate's published owner pubkey.
 *
 * @param peerHost e.g. "https://other.one.ie" (no trailing slash needed)
 * @returns PeerPubkey or null on any failure (network, malformed, timeout)
 */
export async function fetchPeerPubkey(peerHost: string): Promise<PeerPubkey | null> {
  const host = normalise(peerHost)
  const now = Date.now()

  // Cache hit
  const cached = CACHE.get(host)
  if (cached && cached.expires > now) {
    return cached.entry
  }

  const url = `${host}/.well-known/owner-pubkey.json`

  let raw: unknown
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    raw = await res.json()
  } catch {
    // Network error, timeout, or parse failure
    return null
  }

  if (!isValidPubkey(raw)) {
    return null
  }

  // Cache for TTL
  CACHE.set(host, { entry: raw, expires: now + CACHE_TTL_MS })
  return raw
}

/**
 * Test hook — clear the in-process discovery cache.
 * Call this in beforeEach() to prevent cross-test contamination.
 */
export function _clearDiscoveryCacheForTests(): void {
  CACHE.clear()
}
