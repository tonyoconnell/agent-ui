/**
 * POST /api/auth/api-keys — Generate a new API key for an authenticated unit
 *
 * Requires authentication via existing API key (Authorization: Bearer api_xxx).
 * Creates a new api-key entity in TypeDB linked to the caller's unit.
 *
 * Input:  { permissions?: string } (default: "read,write")
 * Output: { apiKey, keyId, permissions }
 *
 * DELETE /api/auth/api-keys — Revoke an API key
 * Input:  { keyId: string }
 */

import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'
import { generateApiKey, hashKey } from '@/lib/api-key'
import { validateApiKey } from '@/lib/api-auth'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const auth = await validateApiKey(request)
    if (!auth.isValid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Provide Authorization: Bearer <api_key>' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { permissions = 'read,write' } = body as { permissions?: string }

    // Generate new API key
    const apiKey = generateApiKey()
    const keyHash = await hashKey(apiKey)
    const keyId = `key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()

    await write(`
      insert $k isa api-key,
        has api-key-id "${esc(keyId)}",
        has key-hash "${esc(keyHash)}",
        has user-id "${esc(auth.user)}",
        has permissions "${esc(permissions)}",
        has key-status "active",
        has created ${now};
    `)

    // Link to unit via api-authorization
    await write(`
      match
        $k isa api-key, has api-key-id "${esc(keyId)}";
        $u isa unit, has uid "${esc(auth.user)}";
      insert
        (api-key: $k, authorized-unit: $u) isa api-authorization;
    `).catch(() => {
      // Unit might not exist yet (key was created for a user-id, not a unit)
    })

    return new Response(
      JSON.stringify({
        apiKey,
        keyId,
        permissions,
        note: 'Save your API key — it cannot be retrieved again.',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[API Key Generation]', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const auth = await validateApiKey(request)
    if (!auth.isValid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { keyId } = body as { keyId?: string }

    if (!keyId) {
      return new Response(
        JSON.stringify({ error: 'keyId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Revoke — only if the key belongs to this user
    await write(`
      match
        $k isa api-key, has api-key-id "${esc(keyId)}", has user-id "${esc(auth.user)}",
          has key-status $old;
      delete $old of $k;
      insert $k has key-status "revoked";
    `)

    return new Response(
      JSON.stringify({ keyId, status: 'revoked' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[API Key Revocation]', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
