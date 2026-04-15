/**
 * API Key generation and validation utilities
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Generate a cryptographically secure random API key
 * Format: api_<timestamp>_<random>
 */
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
