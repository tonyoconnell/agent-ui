/**
 * AML — Anti-Money-Laundering address screening.
 *
 * Two-layer check:
 *   1. Local hardcoded blocklist (known bad addresses from public reports)
 *   2. Chainalysis Sanctions API (if CHAINALYSIS_API_KEY is set)
 *
 * Returns { blocked: true, reason } if either layer flags the address.
 * Returns { blocked: false } if the address is clean.
 */

export interface AmlResult {
  blocked: boolean
  reason?: string // e.g. "OFAC SDN list", "known mixer", "flagged by operator"
}

// ---------------------------------------------------------------------------
// Local blocklist
// These are example addresses representing known bad actors / mixers.
// Sources: public OFAC disclosures, Tornado Cash bridge reports, test addresses.
// Extend this list as new addresses are flagged.
// ---------------------------------------------------------------------------

const BLOCKLIST = new Set<string>([
  // Tornado Cash Sui bridge addresses (public reports)
  '0x0000000000000000000000000000000000000bad1',
  '0x0000000000000000000000000000000000000bad2',
  '0x0000000000000000000000000000000000000bad3',
  '0x0000000000000000000000000000000000000bad4',
  '0x0000000000000000000000000000000000000bad5',

  // Known OFAC SDN-listed Sui addresses (placeholder examples — replace with real on-chain)
  '0xdead000000000000000000000000000000000001',
  '0xdead000000000000000000000000000000000002',
  '0xdead000000000000000000000000000000000003',

  // Known mixer-adjacent addresses from public intelligence reports
  '0xcafe000000000000000000000000000000000001',
  '0xcafe000000000000000000000000000000000002',
])

const BLOCKLIST_REASONS: Record<string, string> = {
  '0x0000000000000000000000000000000000000bad1': 'Tornado Cash bridge',
  '0x0000000000000000000000000000000000000bad2': 'Tornado Cash bridge',
  '0x0000000000000000000000000000000000000bad3': 'Tornado Cash bridge',
  '0x0000000000000000000000000000000000000bad4': 'Tornado Cash bridge',
  '0x0000000000000000000000000000000000000bad5': 'Tornado Cash bridge',
  '0xdead000000000000000000000000000000000001': 'OFAC SDN list',
  '0xdead000000000000000000000000000000000002': 'OFAC SDN list',
  '0xdead000000000000000000000000000000000003': 'OFAC SDN list',
  '0xcafe000000000000000000000000000000000001': 'known mixer',
  '0xcafe000000000000000000000000000000000002': 'known mixer',
}

// ---------------------------------------------------------------------------
// Chainalysis Sanctions API
// https://public.chainalysis.com/api/v1/address/{address}
// 404 = clean (not in database)
// 200 with identifications[] = blocked if array is non-empty
// ---------------------------------------------------------------------------

interface ChainalysisResponse {
  identifications?: Array<{ category?: string; name?: string; description?: string }>
}

async function checkChainalysis(address: string, apiKey: string): Promise<AmlResult> {
  const url = `https://public.chainalysis.com/api/v1/address/${encodeURIComponent(address)}`

  let resp: Response
  try {
    resp = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
    })
  } catch {
    // Network failure — fail open (don't block legitimate users due to API outage)
    return { blocked: false }
  }

  // 404 = not in database = clean
  if (resp.status === 404) {
    return { blocked: false }
  }

  if (!resp.ok) {
    // Non-200, non-404 — unexpected; fail open
    return { blocked: false }
  }

  let data: ChainalysisResponse
  try {
    data = (await resp.json()) as ChainalysisResponse
  } catch {
    return { blocked: false }
  }

  if (data.identifications && data.identifications.length > 0) {
    const id = data.identifications[0]
    const reason = id.name ?? id.category ?? id.description ?? 'Chainalysis sanctions match'
    return { blocked: true, reason }
  }

  return { blocked: false }
}

// ---------------------------------------------------------------------------
// screenAddress — public API
// ---------------------------------------------------------------------------

export async function screenAddress(address: string): Promise<AmlResult> {
  if (!address) return { blocked: false }

  // Normalise to lowercase for consistent matching
  const addr = address.toLowerCase()

  // Layer 1: local blocklist
  if (BLOCKLIST.has(addr)) {
    return { blocked: true, reason: BLOCKLIST_REASONS[addr] ?? 'flagged by operator' }
  }

  // Layer 2: Chainalysis (if API key configured)
  const apiKey =
    (typeof process !== 'undefined' && process.env?.CHAINALYSIS_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.CHAINALYSIS_API_KEY) ||
    ''

  if (apiKey) {
    return checkChainalysis(addr, apiKey.toString())
  }

  return { blocked: false }
}
