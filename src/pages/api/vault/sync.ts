/**
 * PUT /api/vault/sync — store an encrypted vault envelope for the signed-in user.
 *
 * The envelope is AES-GCM ciphertext produced by Vault.exportSyncBlob() on the
 * client; the server never sees plaintext. The key that unwraps the envelope
 * is derived from the user's vault master secret, so the server cannot read
 * (or modify undetectably) the wallets it holds.
 *
 * Auth: Better Auth session required.
 *
 * Body:   { blob: string, version?: number }
 * 200:    { ok: true, updated_at: number }
 * 400:    { error: string }
 * 401:    Unauthorized
 * 503:    { error: 'D1 not available' }
 */

import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

const MAX_BLOB_BYTES = 512 * 1024 // 512 KiB — plenty for thousands of wallets

export const PUT: APIRoute = async ({ request, locals }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })
  const userId = session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }
  const { blob, version } = body as { blob?: unknown; version?: unknown }

  if (typeof blob !== 'string' || blob.length === 0 || blob.length > MAX_BLOB_BYTES) {
    return json({ error: 'blob must be a non-empty string ≤ 512 KiB' }, 400)
  }
  const ver = typeof version === 'number' && Number.isFinite(version) ? Math.trunc(version) : 1

  const db = await getD1(locals)
  if (!db) return json({ error: 'D1 not available' }, 503)

  try {
    await db
      .prepare(
        `INSERT INTO vault_blob (user_id, blob, version, updated_at)
         VALUES (?, ?, ?, unixepoch())
         ON CONFLICT(user_id) DO UPDATE SET
           blob       = excluded.blob,
           version    = excluded.version,
           updated_at = unixepoch()`,
      )
      .bind(userId, blob, ver)
      .run()
  } catch (err) {
    return json({ error: (err as Error).message ?? 'db write failed' }, 500)
  }

  return json({ ok: true, updated_at: Math.floor(Date.now() / 1000) }, 200)
}

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
