/**
 * POST /api/auth/agent — Zero-friction agent onboarding
 *
 * 100% conversion. Send {} and get a complete identity.
 *
 * What happens:
 *   1. No name? Auto-generate one (adjective-noun)
 *   2. No uid? Derive from name
 *   3. uid exists? Welcome back — new API key, same wallet
 *   4. Sui wallet always derived (deterministic from uid)
 *   5. Testnet? Auto-fund the wallet
 *   6. API key generated, hash stored, plaintext returned once
 *
 * Input:  {} | { name?, uid?, kind? }
 * Output: { uid, name, wallet, apiKey, keyId, returning }
 *
 * Ontology:
 *   Actor (dim 2)  → unit entity
 *   Thing (dim 3)  → api-key entity
 *   Path  (dim 4)  → api-authorization relation
 *   Event (dim 5)  → last-used tracking on key
 */

import type { APIRoute } from 'astro'
import { generateApiKey, hashKey } from '@/lib/api-key'
import { addressFor, ensureFunded } from '@/lib/sui'
import { readParsed, write } from '@/lib/typedb'

export const prerender = false

// Word lists for auto-generated names
const ADJECTIVES = [
  'swift',
  'bright',
  'calm',
  'keen',
  'bold',
  'fair',
  'warm',
  'deep',
  'sharp',
  'clear',
  'quick',
  'pure',
  'wise',
  'true',
  'free',
  'safe',
  'strong',
  'light',
  'fast',
  'sure',
  'fresh',
  'steady',
  'ready',
  'prime',
]
const NOUNS = [
  'scout',
  'spark',
  'pilot',
  'forge',
  'pulse',
  'bloom',
  'ridge',
  'crest',
  'drift',
  'wave',
  'grove',
  'stone',
  'flint',
  'ember',
  'frost',
  'vale',
  'reed',
  'lark',
  'wren',
  'crane',
  'fern',
  'brook',
  'cliff',
  'dawn',
]

function autoName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${adj}-${noun}`
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string
      uid?: string
      kind?: string
    }

    const name = body.name || autoName()
    const kind = body.kind || 'agent'
    const uid =
      body.uid ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')

    // Check if unit already exists
    const existing = await readParsed(`
      match $u isa unit, has uid "${esc(uid)}";
      $u has name $n;
      select $n;
    `).catch(() => [])

    const returning = existing.length > 0

    // If new, create the unit
    if (!returning) {
      let wallet = ''
      try {
        wallet = await addressFor(uid)
      } catch {
        /* SUI_SEED not set */
      }

      const now = new Date().toISOString()
      const walletClause = wallet ? `, has wallet "${esc(wallet)}"` : ''
      await write(`
        insert $u isa unit,
          has uid "${esc(uid)}",
          has name "${esc(name)}",
          has unit-kind "${esc(kind)}",
          has status "active",
          has success-rate 0.5,
          has activity-score 0.0,
          has sample-count 0,
          has generation 0${walletClause},
          has created ${now};
      `)
    }

    // Always derive wallet (deterministic — same uid = same address)
    let wallet = ''
    try {
      wallet = await addressFor(uid)
      // Testnet: auto-fund new wallets so they can transact immediately
      if (!returning && wallet) {
        ensureFunded(wallet).catch(() => {
          /* faucet may rate-limit — not fatal */
        })
      }
    } catch {
      /* SUI_SEED not set */
    }

    // Always generate a fresh API key
    const apiKey = generateApiKey()
    const keyHash = await hashKey(apiKey)
    const keyId = `key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()

    await write(`
      insert $k isa api-key,
        has api-key-id "${esc(keyId)}",
        has key-hash "${esc(keyHash)}",
        has user-id "${esc(uid)}",
        has permissions "read,write",
        has key-status "active",
        has created ${now};
    `)

    // Link key to unit
    await write(`
      match
        $k isa api-key, has api-key-id "${esc(keyId)}";
        $u isa unit, has uid "${esc(uid)}";
      insert
        (api-key: $k, authorized-unit: $u) isa api-authorization;
    `).catch(() => {
      // Relation creation is best-effort — key still works via user-id match
    })

    const existingName = returning && existing[0]?.n ? (existing[0].n as string) : name

    return new Response(
      JSON.stringify({
        uid,
        name: existingName,
        kind,
        wallet: wallet || null,
        apiKey,
        keyId,
        returning,
      }),
      {
        status: returning ? 200 : 201,
        headers: {
          'Content-Type': 'application/json',
          'X-ONE-Protocol': 'v1',
        },
      },
    )
  } catch (error: any) {
    console.error('[Agent Onboarding]', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/** Also support GET for discovery */
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      endpoint: 'POST /api/auth/agent',
      description: 'Zero-friction agent onboarding. Send {} to get a complete identity.',
      input: { name: 'optional', uid: 'optional (derived from name)', kind: 'optional (default: agent)' },
      output: {
        uid: 'string',
        name: 'string',
        wallet: 'sui address',
        apiKey: 'shown once',
        keyId: 'string',
        returning: 'boolean',
      },
      example: "curl -X POST /api/auth/agent -d '{}'",
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
