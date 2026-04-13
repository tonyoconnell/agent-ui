/**
 * POST /api/keys — Manage API keys
 *
 * Actions:
 *   POST { action: "generate", user: "david", permissions: ["read", "write", "add", "edit"] }
 *   GET ?action=list&user=david
 *   POST { action: "revoke", keyId: "key_..." }
 *   POST { action: "validate", key: "api_key_..." }
 */

import type { APIRoute } from 'astro'
import { generateApiKey, hashKey } from '@/lib/api-key'
import { readParsed, write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as any

    // Generate new API key
    if (body.action === 'generate') {
      const { user, permissions = ['read'] } = body
      if (!user) {
        return new Response(JSON.stringify({ error: 'user field required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const plainKey = generateApiKey()
      const keyHash = await hashKey(plainKey)
      const keyId = `key_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      const now = new Date().toISOString()

      // Store in TypeDB
      await write(`
        insert $k isa api-key,
          has api-key-id "${keyId}",
          has key-hash "${keyHash}",
          has user-id "${user}",
          has permissions "${permissions.join(',')}",
          has key-status "active",
          has created ${now};
      `)

      return new Response(
        JSON.stringify({
          ok: true,
          keyId,
          key: plainKey,
          user,
          permissions,
          message: 'Save this key — you cannot view it again. Share with David securely.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Revoke API key
    if (body.action === 'revoke') {
      const { keyId } = body
      if (!keyId) {
        return new Response(JSON.stringify({ error: 'keyId field required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      await write(`
        match $k isa api-key, has api-key-id "${keyId}";
        delete $k has key-status "active";
        insert $k has key-status "revoked";
      `)

      return new Response(JSON.stringify({ ok: true, message: 'Key revoked' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action. Use generate, revoke, or validate' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[API Keys] Error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const action = url.searchParams.get('action')

    // List keys for a user
    if (action === 'list') {
      const user = url.searchParams.get('user')
      if (!user) {
        return new Response(JSON.stringify({ error: 'user query param required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const rows = await readParsed(`
        match $k isa api-key, has user-id "${user}",
          has api-key-id $id,
          has permissions $p,
          has key-status $s,
          has created $c,
          has last-used $lu;
        select $id, $p, $s, $c, $lu;
      `)

      return new Response(JSON.stringify({ ok: true, keys: rows }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action. Use list' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
