/**
 * owner-key — derive Key-Encryption-Keys (KEKs) from the owner's WebAuthn PRF.
 *
 * Runs ONLY on the owner's machine (where the WebAuthn ceremony provides the
 * PRF input). Throws OwnerOnlyCodePathError in any non-owner runtime — most
 * importantly, in Cloudflare Worker / Vite SSR contexts where touching this
 * module would imply a serverside leak of the PRF.
 *
 * Reference: owner.md §"Owner identity vs the consumer wallet" — owner_prf is
 * the substrate root; every KEK / API key / agent wrap is HKDF(owner_prf, salt).
 *
 * Key derivation uses Web Crypto only (crypto.subtle). No node:crypto.
 *
 * Salt → output mapping (Gap 4 versioned via suffix):
 *   'agent-key:{uid}:v1'  →  AES-256-GCM KEK for wrapping agent seed in D1
 *   'vault-sync:v1'       →  AES-256-GCM KEK for wrapping cross-device sync envelope
 *   'api-key:owner:v1'    →  32-byte raw secret (encoded as bearer token by caller)
 */

/** Sentinel error class — thrown when this module is loaded in a non-owner runtime. */
export class OwnerOnlyCodePathError extends Error {
  constructor(message = 'OWNER_ONLY_CODE_PATH') {
    super(message)
    this.name = 'OwnerOnlyCodePathError'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Runtime guard

/**
 * Returns true if the current JS environment looks like a Cloudflare Worker.
 * Bun and Node are owner-machine-acceptable (CLI scripts, dev server). Only
 * the Workers runtime is forbidden — the PRF must never be derived server-side.
 *
 * Detection heuristics (conservative — all must be false to proceed):
 *   1. globalThis.WebSocketPair exists  →  Workers-specific global
 *   2. navigator.userAgent includes 'Cloudflare-Workers'  →  explicit UA
 *
 * Note: we deliberately do NOT detect Vite/Astro SSR here via
 * import.meta.env.SSR because owner-key is a leaf module and must not carry
 * Vite-specific types. The WebSocketPair guard already catches the wrangler
 * miniflare + production Workers contexts.
 */
function isWorkerLike(): boolean {
  if (typeof globalThis !== 'undefined' && 'WebSocketPair' in globalThis) return true
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? ''
  if (ua.includes('Cloudflare-Workers')) return true
  return false
}

function guardOwnerOnly(): void {
  if (isWorkerLike()) {
    throw new OwnerOnlyCodePathError(
      'owner-key: derivation must run on owner machine only — workers cannot hold owner PRF',
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HKDF helpers (not exported — internal to this module)

async function hkdfKey(prf: Uint8Array, info: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', prf, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(info),
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function hkdfBytes(prf: Uint8Array, info: string, len = 32): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey('raw', prf, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(info),
    },
    baseKey,
    len * 8,
  )
  return new Uint8Array(bits)
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API

/**
 * Derive a KEK for wrapping an agent's seed in D1 agent_wallet.
 * Salt: 'agent-key:{uid}:v1'. The version suffix lets Gap 4 rotate without
 * reusing salts.
 *
 * @param prf   32-byte PRF output from the owner's WebAuthn ceremony.
 * @param uid   Agent UID string — must be non-empty.
 * @returns     AES-256-GCM CryptoKey usable for encrypt + decrypt.
 */
export async function deriveAgentKEK(prf: Uint8Array, uid: string): Promise<CryptoKey> {
  guardOwnerOnly()
  if (!uid || typeof uid !== 'string') throw new Error('owner-key: uid required')
  return hkdfKey(prf, `agent-key:${uid}:v1`)
}

/**
 * Derive a KEK for wrapping the cross-device sync envelope.
 * Salt: 'vault-sync:v1'.
 *
 * @param prf   32-byte PRF output from the owner's WebAuthn ceremony.
 * @returns     AES-256-GCM CryptoKey usable for encrypt + decrypt.
 */
export async function deriveSyncKEK(prf: Uint8Array): Promise<CryptoKey> {
  guardOwnerOnly()
  return hkdfKey(prf, 'vault-sync:v1')
}

/**
 * Derive the bearer for owner-tier API calls (the substrate-owner API key).
 * Salt: 'api-key:owner:v1'. Returns the raw 32-byte secret which the caller
 * encodes (typically `sk_owner_<base64url>`).
 *
 * @param prf   32-byte PRF output from the owner's WebAuthn ceremony.
 * @returns     Uint8Array(32) — raw secret bytes, deterministic for a given PRF.
 */
export async function deriveOwnerAPIKey(prf: Uint8Array): Promise<Uint8Array> {
  guardOwnerOnly()
  return hkdfBytes(prf, 'api-key:owner:v1', 32)
}
