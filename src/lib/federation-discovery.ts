/**
 * federation-discovery.ts
 *
 * Fetch + cache the peer substrate's published owner pubkey from
 * /.well-known/owner-pubkey.json.
 *
 * Used by /api/paths/bridge to verify that the `peerOwnerAddress`
 * claimed in the bridge body matches the address the foreign substrate
 * actually publishes, and (V2.2+) to cryptographically verify bridge
 * assertions via published COSE public keys.
 *
 * V2 acceptance criteria (Gap 6 V2):
 *   - Peer host is reachable.
 *   - Published address matches the claimed peerOwnerAddress.
 *   - Published version matches the claimed peerOwnerVersion.
 *
 * V2.2 acceptance criteria (Gap 6 V2.2, this implementation):
 *   - V2 criteria above, PLUS:
 *   - schema is "owner-pubkey-v2" and keys is non-empty.
 *   - peerAssertion.credId matches a published key entry.
 *   - WebAuthn assertion verifies against the published COSE pubKey.
 *   Backwards compatible: v1 peers (no keys) fall through to V2 behavior.
 */

/** A single COSE public key published by the peer */
export interface OwnerKey {
  /** base64url WebAuthn credential ID */
  credId: string
  /** base64url COSE public key bytes */
  pubKey: string
  /** COSE algorithm name (informational) */
  alg: string
  /** Unix seconds when this key was registered */
  registeredAt: number
}

export interface PeerPubkey {
  /** Sui address of the foreign substrate's owner (0x...) */
  address: string
  /** Owner key version — must match the bridge body's peerOwnerVersion */
  version: number
  /** Unix seconds when the peer published this record */
  publishedAt: number
  /** "owner-pubkey-v1" (no keys) or "owner-pubkey-v2" (keys present) */
  schema: string
  /**
   * COSE public keys for cryptographic assertion verification (V2.2+).
   * Optional — v1 peers won't have this field.
   */
  keys?: OwnerKey[]
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

function isValidOwnerKey(entry: unknown): entry is OwnerKey {
  if (!entry || typeof entry !== 'object') return false
  const obj = entry as Record<string, unknown>
  return (
    typeof obj.credId === 'string' &&
    obj.credId.length > 0 &&
    typeof obj.pubKey === 'string' &&
    obj.pubKey.length > 0 &&
    typeof obj.alg === 'string' &&
    typeof obj.registeredAt === 'number'
  )
}

function isValidPubkey(v: unknown): v is PeerPubkey {
  if (!v || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  if (typeof obj.address !== 'string') return false
  if (!SUI_ADDRESS_RE.test(obj.address)) return false
  if (typeof obj.version !== 'number') return false
  if (typeof obj.publishedAt !== 'number') return false
  // Accept v1 (legacy) or v2 (with keys)
  if (obj.schema !== 'owner-pubkey-v1' && obj.schema !== 'owner-pubkey-v2') return false
  // V2 schema: if keys is present it must be a valid array
  if (obj.schema === 'owner-pubkey-v2') {
    if (!Array.isArray(obj.keys)) return false
    // Each key entry must be valid (empty array is allowed — operator hasn't published keys yet)
    for (const entry of obj.keys as unknown[]) {
      if (!isValidOwnerKey(entry)) return false
    }
  }
  return true
}

/**
 * Fetch + cache the peer substrate's published owner pubkey.
 *
 * Returns PeerPubkey for both v1 and v2 schemas:
 * - v1: no keys field (legacy, address+version check only)
 * - v2: keys field present (enables cryptographic assertion verification)
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
