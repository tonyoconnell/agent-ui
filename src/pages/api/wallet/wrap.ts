/**
 * POST /api/wallet/wrap — store largeBlob fallback ciphertext on the server.
 *
 * Called atomically with the passkey largeBlob write when largeBlob is
 * unavailable (Firefox). The server copy is a fallback; the canonical copy
 * lives in the passkey largeBlob extension.
 *
 * Contract: interfaces/wallet/wrap-backup.d.ts
 *
 * Auth: Better Auth session required (cookie or Bearer).
 *
 * Body:   { credId: string, iv: string, ciphertext: string, version: 1 }
 * 200:    { ok: true }
 * 400:    { error: string }  — malformed body
 * 401:    Unauthorized       — no session
 * 500:    { error: string }  — D1 unavailable or write failure
 *
 * Storage: D1 `wallet_backups` table (migration 0021_wallet_backups.sql).
 *   Keyed by (user_id, cred_id) — INSERT OR REPLACE semantics so a re-wrap
 *   after key rotation simply overwrites the old entry.
 *
 * If D1 is unavailable (dev without binding) the route returns 503 rather
 * than silently losing the backup — the client must know the fallback failed.
 */

import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

/** Accepts only base64 / hex strings with no whitespace injection risk */
function isEncodedString(s: unknown): s is string {
  return typeof s === 'string' && s.length > 0 && s.length < 16_384
}

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Verify Better Auth session
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }
  const userId = session.user.id

  // 2. Parse + validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = body as Record<string, unknown>
  const { credId, iv, ciphertext, version } = payload

  if (!isEncodedString(credId)) {
    return new Response(JSON.stringify({ error: 'credId must be a non-empty string' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!isEncodedString(iv)) {
    return new Response(JSON.stringify({ error: 'iv must be a non-empty string' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!isEncodedString(ciphertext)) {
    return new Response(JSON.stringify({ error: 'ciphertext must be a non-empty string' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (version !== 1) {
    return new Response(JSON.stringify({ error: 'version must be 1' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 3. Get D1 binding
  const db = await getD1(locals)
  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 4. Upsert into wallet_backups (INSERT OR REPLACE keyed on user_id + cred_id)
  try {
    await db
      .prepare(
        `INSERT INTO wallet_backups (user_id, cred_id, iv, ciphertext, version, updated_at)
         VALUES (?, ?, ?, ?, ?, unixepoch())
         ON CONFLICT(user_id, cred_id) DO UPDATE SET
           iv         = excluded.iv,
           ciphertext = excluded.ciphertext,
           version    = excluded.version,
           updated_at = unixepoch()`,
      )
      .bind(userId, credId, iv, ciphertext, version)
      .run()
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'db write failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 5. Return 200
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
