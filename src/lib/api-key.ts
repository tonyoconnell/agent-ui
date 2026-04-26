/**
 * API Key generation and validation utilities.
 *
 * Two key-derivation paths coexist:
 *   - generateApiKey() — random api_<ts>_<rnd>; the legacy + general path used
 *     by /api/auth/api-keys for chairman/agent keys.
 *   - deriveKey()      — owner-PRF-derived via HKDF; the Gap 4 path used for
 *     rotateable owner-tier keys. Salt info: `api-key:${role}:${group}:v${version}`.
 *     Version bumps without rotating salt → cutover with overlapping validity.
 *     Lives alongside the random path because owner keys are derived from the
 *     biometric-locked PRF (browser-side), while chairman/agent keys can be
 *     server-minted random tokens.
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Generate a cryptographically secure random API key
 * Format: api_<timestamp>_<random>
 */
/**
 * HKDF-derive a versioned key from the owner's WebAuthn PRF.
 *
 * Returns 32 raw bytes — caller encodes for transport (e.g. base64url) and
 * also computes the bcrypt-style hash via hashKey() before storing the row
 * in D1 owner_key. The PRF itself never leaves the owner's browser — this
 * function runs only on the owner machine (browser context), so no
 * server-side guard is needed here; the guard lives in src/lib/owner-key.ts.
 *
 * Bumping `version` without changing role/group rotates the key while
 * keeping the same logical bearer. Cutover window: register v+1, both
 * accepted until v is force-revoked.
 *
 * Spec: owner-todo Gap 4 §4.s1, owner.md §"Owner identity vs the consumer wallet"
 *       (rotation table row).
 */
export async function deriveKey(prf: Uint8Array, role: string, group: string, version = 1): Promise<Uint8Array> {
  if (!prf || prf.length === 0) throw new Error('deriveKey: prf required')
  if (!role) throw new Error('deriveKey: role required')
  if (!group) throw new Error('deriveKey: group required')
  if (!Number.isInteger(version) || version < 1) throw new Error('deriveKey: version must be a positive integer')

  const baseKey = await crypto.subtle.importKey('raw', prf, 'HKDF', false, ['deriveBits'])
  const info = new TextEncoder().encode(`api-key:${role}:${group}:v${version}`)
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info },
    baseKey,
    256, // 32 bytes
  )
  return new Uint8Array(bits)
}

export function generateApiKey(): string {
  const timestamp = Date.now().toString(36)
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let randomPart = ''
  for (const byte of bytes) {
    randomPart += ALPHABET[byte % ALPHABET.length]
  }
  return `api_${timestamp}_${randomPart}`
}

/**
 * Extract a short prefix from a key for O(1) TypeDB lookup.
 * Takes 8 chars of the random segment (alphanumeric only — no TQL escaping needed).
 */
export function getKeyPrefix(key: string): string {
  const parts = key.split('_')
  const random = parts.length >= 3 ? parts.slice(2).join('') : key
  return random.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
}

/**
 * Hash an API key using PBKDF2 (Web Crypto API)
 */
export async function hashKey(key: string): Promise<string> {
  const PBKDF2_ITERATIONS = 100000
  const SALT_LENGTH = 16
  const KEY_LENGTH = 32

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const encoder = new TextEncoder()
  const keyObj = await crypto.subtle.importKey('raw', encoder.encode(key), 'PBKDF2', false, ['deriveBits'])

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyObj,
    KEY_LENGTH * 8,
  )

  const hash = new Uint8Array(derivedBits)
  const saltB64 = btoa(String.fromCharCode(...salt))
  const hashB64 = btoa(String.fromCharCode(...hash))

  return `$pbkdf2$${PBKDF2_ITERATIONS}$${saltB64}$${hashB64}`
}

/**
 * Verify an API key against its hash
 */
export async function verifyKey(key: string, hash: string): Promise<boolean> {
  const parts = hash.split('$')
  if (parts.length !== 5 || parts[1] !== 'pbkdf2') {
    return false
  }

  const iterations = parseInt(parts[2], 10)
  const salt = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0))
  const storedHash = Uint8Array.from(atob(parts[4]), (c) => c.charCodeAt(0))

  const encoder = new TextEncoder()
  const keyObj = await crypto.subtle.importKey('raw', encoder.encode(key), 'PBKDF2', false, ['deriveBits'])

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyObj,
    storedHash.length * 8,
  )

  const computedHash = new Uint8Array(derivedBits)

  if (computedHash.length !== storedHash.length) return false
  let diff = 0
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash[i] ^ storedHash[i]
  }
  return diff === 0
}
