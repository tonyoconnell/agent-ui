/**
 * POST /api/agents/[uid]/unwrap — proxy to owner-Mac daemon for agent seed unwrap.
 *
 * Owner-todo Gap 1 — daemon bridge.
 *
 * The agent worker (or browser) POSTs here with its own bearer in Authorization.
 * The endpoint:
 *   1. Validates the bearer and confirms it belongs to the uid in the URL path.
 *   2. Looks up ciphertext + iv + kdf_version from D1 `agent_wallet`.
 *   3. If $OWNER_DAEMON_KEY is missing → 503 daemon-not-configured.
 *   4. Builds the daemon request body and HMAC-SHA-256 signs it.
 *   5. POSTs to $OWNER_DAEMON_URL/unwrap (default 127.0.0.1:48923), 5s timeout.
 *   6. Maps daemon responses to API responses.
 *
 * This is what nanoclaw calls after /unlock to retrieve the plaintext seed:
 *   POST /api/agents/:uid/unlock  →  { ciphertextB64, ivB64, kdfVersion, sig }
 *   POST /api/agents/:uid/unwrap  →  { ok: true, seedB64 }   (daemon involved)
 *
 * Error shapes (consistent with siblings):
 *   { ok: false, error: string, reason?: string }
 *
 * Response codes:
 *   200  ok
 *   400  bad-input
 *   401  unauthenticated
 *   403  bearer-uid-mismatch
 *   404  no-agent-wallet
 *   502  unwrap-failed (daemon 400)
 *   503  daemon-not-configured | daemon-unreachable | daemon-timeout | owner-locked | daemon-mis-configured
 */

import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { b64urlDecode, b64urlEncode, hmacSign as signBody } from '@/lib/owner-crypto'

export const prerender = false

// ─── Env helpers ─────────────────────────────────────────────────────────────

function readEnv(name: string): string {
  const fromRuntime = typeof process !== 'undefined' && process.env?.[name]
  const fromBuild = (import.meta.env as Record<string, unknown>)[name]
  return ((fromRuntime || fromBuild || '') as string).toString()
}

// ─── D1 row type ──────────────────────────────────────────────────────────────

interface AgentWalletRow {
  ciphertext: ArrayBuffer | Uint8Array
  iv: ArrayBuffer | Uint8Array
  kdf_version: number
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, params, locals }) => {
  const pathUid = params?.uid
  if (!pathUid) {
    return Response.json({ ok: false, error: 'bad-input' }, { status: 400 })
  }

  // 1. Auth: bearer must be valid and must match the path uid
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) {
    return Response.json({ ok: false, error: 'unauthenticated' }, { status: 401 })
  }
  if ((auth.actAs ?? auth.user) !== pathUid) {
    return Response.json({ ok: false, error: 'bearer-uid-mismatch' }, { status: 403 })
  }

  // 2. Look up agent_wallet row
  const db = await getD1(locals).catch(() => null)
  if (!db) {
    return Response.json({ ok: false, error: 'd1-unavailable' }, { status: 503 })
  }

  const row = await db
    .prepare('SELECT ciphertext, iv, kdf_version FROM agent_wallet WHERE uid = ?')
    .bind(pathUid)
    .first<AgentWalletRow>()
    .catch(() => null)
  if (!row) {
    return Response.json({ ok: false, error: 'no-agent-wallet' }, { status: 404 })
  }

  // 3. Check daemon config
  const daemonUrl = readEnv('OWNER_DAEMON_URL') || 'http://127.0.0.1:48923'
  const keyB64 = readEnv('OWNER_DAEMON_KEY')
  if (!keyB64) {
    return Response.json({ ok: false, error: 'daemon-not-configured' }, { status: 503 })
  }

  // 4. Build daemon request body
  const ciphertextB64 = b64urlEncode(new Uint8Array(row.ciphertext as ArrayBuffer))
  const ivB64 = b64urlEncode(new Uint8Array(row.iv as ArrayBuffer))
  const body = JSON.stringify({
    ciphertextB64,
    ivB64,
    agentUid: pathUid,
    kdfVersion: row.kdf_version ?? 1,
  })

  // 5. Sign
  const keyBytes = b64urlDecode(keyB64)
  const sig = await signBody(body, keyBytes)

  // 6. Call daemon
  let res: Response
  try {
    res = await fetch(`${daemonUrl.replace(/\/$/, '')}/unwrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Daemon-Sig': sig,
      },
      body,
      signal: AbortSignal.timeout(5000),
    })
  } catch (e) {
    const msg = (e as Error).message ?? String(e)
    if (msg.includes('timed out') || msg.includes('TimeoutError') || (e as Error).name === 'TimeoutError') {
      return Response.json({ ok: false, error: 'daemon-timeout', reason: msg }, { status: 503 })
    }
    return Response.json({ ok: false, error: 'daemon-unreachable', reason: msg }, { status: 503 })
  }

  // 7. Map daemon → API responses
  if (res.status === 200) {
    let json: { ok: boolean; seedB64?: string } = { ok: false }
    try {
      json = (await res.json()) as { ok: boolean; seedB64?: string }
    } catch {
      return Response.json({ ok: false, error: 'daemon-unreachable', reason: 'bad-json' }, { status: 503 })
    }
    return Response.json({ ok: true, seedB64: json.seedB64 })
  }

  if (res.status === 423) {
    return Response.json(
      { ok: false, error: 'owner-locked', reason: 'operator must Touch-ID unlock the daemon' },
      { status: 503 },
    )
  }

  if (res.status === 400) {
    let reason = 'unwrap-failed'
    try {
      const txt = await res.text()
      reason = txt || reason
    } catch {
      /* ignore */
    }
    return Response.json({ ok: false, error: 'unwrap-failed', reason }, { status: 502 })
  }

  if (res.status === 401) {
    return Response.json(
      { ok: false, error: 'daemon-mis-configured', reason: 'HMAC key drift between API and daemon' },
      { status: 503 },
    )
  }

  // 5xx or anything else
  return Response.json(
    { ok: false, error: 'daemon-unreachable', reason: `daemon status ${res.status}` },
    { status: 503 },
  )
}
