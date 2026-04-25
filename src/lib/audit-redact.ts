/**
 * audit-redact.ts
 *
 * Hash + redact a payload before it hits the owner_audit table.
 *
 * Hash: sha256 of the canonical JSON of the ORIGINAL payload (no redaction).
 * Redact: deep-walks the payload, replacing detected secrets with "[REDACTED:<kind>]".
 *
 * Allow-list of fields kept verbatim: receiver, action, amount, group, sender, gate.
 *
 * Detected kinds (in priority order):
 *   - "bearer"   → API keys / tokens / JWTs
 *   - "credId"   → WebAuthn credential IDs
 *   - "mnemonic" → BIP39 12 or 24 word phrases
 *   - "seed"     → 32-byte hex under seed/privateKey/secretKey keys
 *   - "signature"→ values under signature/sig keys
 */

export interface RedactResult {
  hash: string // sha256 hex (64 chars) of canonical JSON of input
  redacted: string // JSON string with secrets replaced
}

// Fields that are always emitted verbatim — never redacted.
const ALLOWLIST_KEYS = new Set(['receiver', 'action', 'amount', 'group', 'sender', 'gate'])

// ── Canonical JSON ────────────────────────────────────────────────────────────

function sortedKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj).sort()) {
    const v = obj[k]
    if (v === undefined) continue
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = sortedKeys(v as Record<string, unknown>)
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? sortedKeys(item as Record<string, unknown>)
          : item,
      )
    } else {
      out[k] = v
    }
  }
  return out
}

function canonicalJSON(input: unknown): string {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return JSON.stringify(input)
  }
  return JSON.stringify(sortedKeys(input as Record<string, unknown>))
}

// ── SHA-256 via Web Crypto ────────────────────────────────────────────────────

async function sha256Hex(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── String-level redaction ────────────────────────────────────────────────────

function redactString(s: string, path: string[]): string {
  // Bearer / API key / JWT prefixes — highest priority
  // Matches: sk_*, api_*, Bearer <token>, eyJxxx.yyy.zzz (3-segment JWT)
  if (/^(sk_|api_)/.test(s) || /^Bearer\s+/.test(s) || /^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\./.test(s)) {
    return '[REDACTED:bearer]'
  }

  const lastKey = (path[path.length - 1] ?? '').toLowerCase()

  // 32-byte hex under sensitive key names
  if (/^(seed|privatekey|secretkey)$/.test(lastKey) && /^(0x)?[0-9a-fA-F]{64}$/.test(s)) {
    return '[REDACTED:seed]'
  }

  // Signature under signature/sig key
  if (/^(signature|sig)$/.test(lastKey)) {
    return '[REDACTED:signature]'
  }

  // WebAuthn credId under credId/credentialId key
  if (/^(credid|credentialid)$/.test(lastKey) && s.length >= 22 && /^[A-Za-z0-9_-]+$/.test(s)) {
    return '[REDACTED:credId]'
  }

  // BIP39 mnemonic: 12 or 24 lowercase alpha words, 3–8 chars each
  const words = s.split(/\s+/)
  if ((words.length === 12 || words.length === 24) && words.every((w) => /^[a-z]{3,8}$/.test(w))) {
    return '[REDACTED:mnemonic]'
  }

  return s
}

// ── Deep walker ───────────────────────────────────────────────────────────────

function walk(node: unknown, path: string[] = []): unknown {
  if (typeof node === 'string') return redactString(node, path)
  if (Array.isArray(node)) return node.map((v, i) => walk(v, [...path, String(i)]))
  if (node !== null && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (ALLOWLIST_KEYS.has(k)) {
        out[k] = v
        continue
      }
      out[k] = walk(v, [...path, k])
    }
    return out
  }
  // numbers, booleans, null — safe to emit verbatim
  return node
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Hash the original payload (canonical JSON sha256) and return a redacted copy.
 */
export async function redactPayload(input: unknown): Promise<RedactResult> {
  const canonical = canonicalJSON(input)
  const hash = await sha256Hex(canonical)
  const redacted = JSON.stringify(walk(input))
  return { hash, redacted }
}

/**
 * Synchronous variant — redaction only, no hash.
 * For hot paths that have already computed the hash separately.
 */
export function redactOnly(input: unknown): string {
  return JSON.stringify(walk(input))
}
