/**
 * Resolve a model-emitted recipient address before any pre-sign.
 *
 * Closes chat.md §Threat "hallucinated recipient":
 * UI must call resolveRecipient() and check source !== "unresolved" before
 * presenting a pre-sign card. The resolver never returns a guessed address.
 */

export interface ResolveResult {
  address: string        // canonical Sui address (0x…) or "" when unresolved
  displayName?: string   // SuiNS name or /u/people handle, if found
  source: "suins" | "people" | "direct" | "unresolved"
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Minimal 0x-hex Sui address check (32 bytes = 64 hex chars after 0x) */
function isAddress(s: string): boolean {
  return /^0x[0-9a-fA-F]{1,64}$/.test(s)
}

function isSuiNsName(s: string): boolean {
  return s.endsWith(".sui")
}

function isHandle(s: string): boolean {
  return s.startsWith("@")
}

// Base URL for /u/people lookup — same-origin in browser, injected in tests
const PEOPLE_BASE =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:4321"

// SuiNS resolution endpoint — could be mainnet RPC or a local proxy
const SUINS_RESOLVE_URL = "https://suins.io/api/v1/resolve"
const SUINS_REVERSE_URL = "https://suins.io/api/v1/reverse"

/** Forward-resolve a *.sui name → Sui address */
async function suinsForward(name: string): Promise<string | null> {
  try {
    const res = await fetch(`${SUINS_RESOLVE_URL}?name=${encodeURIComponent(name)}`)
    if (!res.ok) return null
    const json = (await res.json()) as { address?: string }
    return json.address ?? null
  } catch {
    return null
  }
}

/** Reverse-resolve a Sui address → *.sui name */
async function suinsReverse(address: string): Promise<string | null> {
  try {
    const res = await fetch(`${SUINS_REVERSE_URL}?address=${encodeURIComponent(address)}`)
    if (!res.ok) return null
    const json = (await res.json()) as { name?: string }
    return json.name ?? null
  } catch {
    return null
  }
}

/** Look up a Sui address in /u/people (by addr) */
async function peopleLookupByAddr(address: string): Promise<{ handle?: string } | null> {
  try {
    const res = await fetch(`${PEOPLE_BASE}/u/people?addr=${encodeURIComponent(address)}`)
    if (!res.ok) return null
    return (await res.json()) as { handle?: string }
  } catch {
    return null
  }
}

/** Look up a @handle in /u/people */
async function peopleLookupByHandle(handle: string): Promise<{ address?: string; handle?: string } | null> {
  try {
    const res = await fetch(`${PEOPLE_BASE}/u/people?handle=${encodeURIComponent(handle)}`)
    if (!res.ok) return null
    return (await res.json()) as { address?: string; handle?: string }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Public resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a raw string (may be Sui address, *.sui name, or @handle) to a
 * canonical Sui address.
 *
 * Resolution strategy:
 *   1. 0x address   → try /u/people by addr, try SuiNS reverse, return "direct"
 *   2. *.sui name   → SuiNS forward → address
 *   3. @handle      → /u/people by handle → address
 *   4. Nothing matched → { address: "", source: "unresolved" }
 *
 * source="unresolved" means the UI MUST refuse to pre-sign.
 */
export async function resolveRecipient(raw: string): Promise<ResolveResult> {
  const trimmed = raw.trim()

  // ── 1. Valid 0x address ──────────────────────────────────────────────────
  if (isAddress(trimmed)) {
    // Try /u/people first (cheapest, local)
    const people = await peopleLookupByAddr(trimmed)
    if (people?.handle) {
      return { address: trimmed, displayName: people.handle, source: "people" }
    }

    // Try SuiNS reverse
    const suinsName = await suinsReverse(trimmed)
    if (suinsName) {
      return { address: trimmed, displayName: suinsName, source: "suins" }
    }

    // Address is valid but has no associated name — that's fine
    return { address: trimmed, source: "direct" }
  }

  // ── 2. SuiNS name (*.sui) ────────────────────────────────────────────────
  if (isSuiNsName(trimmed)) {
    const address = await suinsForward(trimmed)
    if (address) {
      return { address, displayName: trimmed, source: "suins" }
    }
    return { address: "", source: "unresolved" }
  }

  // ── 3. @handle ───────────────────────────────────────────────────────────
  if (isHandle(trimmed)) {
    const handle = trimmed.slice(1) // strip leading @
    const people = await peopleLookupByHandle(handle)
    if (people?.address) {
      return {
        address: people.address,
        displayName: people.handle ?? trimmed,
        source: "people",
      }
    }
    return { address: "", source: "unresolved" }
  }

  // ── 4. Nothing resolved ──────────────────────────────────────────────────
  return { address: "", source: "unresolved" }
}
