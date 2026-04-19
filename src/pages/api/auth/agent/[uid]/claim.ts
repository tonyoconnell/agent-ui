/**
 * POST /api/auth/agent/:uid/claim
 *
 * Claim handshake: bind an agent to a human owner.
 *
 * Requires both:
 *   - Cookie: BetterAuth human session (who is claiming)
 *   - Authorization: Bearer <agent-bootstrap-key> (proof of possession)
 *
 * On success:
 *   - Creates hidden ownership group g:owns:<uid> (group-type: "owns")
 *   - Inserts membership: agent → role "agent", human → role "chairman"
 *   - Revokes bootstrap key (key-status → "revoked")
 *   - Mints new scoped key for the human (scopeGroups: [g:owns:<uid>])
 *   - Returns { owned, ownerUid, agentUid, group, newKey } (newKey shown ONCE)
 *
 * Idempotent: if human is already chairman, returns { owned: true, alreadyClaimed: true }
 */

import type { APIRoute } from 'astro'
import { deriveHumanUid, ensureHumanUnit, invalidateKeyCache, validateApiKey } from '@/lib/api-auth'
import { generateApiKey, hashKey } from '@/lib/api-key'
import { auth } from '@/lib/auth'
import { readParsed, write, writeSilent } from '@/lib/typedb'

export const prerender = false

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export const POST: APIRoute = async ({ request, params }) => {
  const uid = params.uid as string
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Missing agent uid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 1. Identify the human from cookie session
  let humanUid = ''
  let sessionUser: { id: string; email?: string | null; name?: string | null } | null = null
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (session?.user) {
      humanUid = deriveHumanUid(session.user)
      sessionUser = session.user
    }
  } catch {
    /* fail-closed */
  }

  if (!humanUid || !sessionUser) {
    return new Response(JSON.stringify({ error: 'Human session required (cookie)' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Verify bearer proves possession of the agent's key (user === uid)
  const bearerCtx = await validateApiKey(request)
  if (!bearerCtx.isValid || bearerCtx.user !== uid) {
    return new Response(JSON.stringify({ error: 'Bearer must be the agent key for :uid (proof of possession)' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const ownershipGroup = `g:owns:${uid}`

  // 3. Idempotency: check if already claimed by this human
  const existingMembership = await readParsed(`
    match
      $g isa group, has gid "${esc(ownershipGroup)}";
      $u isa unit, has uid "${esc(humanUid)}";
      (member: $u, group: $g) isa membership, has role "chairman";
    select $g;
  `).catch(() => [])

  if (existingMembership.length > 0) {
    return new Response(
      JSON.stringify({ owned: true, alreadyClaimed: true, ownerUid: humanUid, agentUid: uid, group: ownershipGroup }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // 4. Ensure human unit exists in TypeDB
  await ensureHumanUnit(humanUid, sessionUser)

  // 5. Upsert ownership group (idempotent via best-effort)
  const now = new Date().toISOString().replace('Z', '')
  await write(`
    insert $g isa group,
      has gid "${esc(ownershipGroup)}",
      has name "owns:${esc(uid)}",
      has group-type "owns";
  `).catch(async () => {
    // Group may already exist from a previous partial claim — that's fine
  })

  // 6. Insert memberships (agent → "agent", human → "chairman")
  await write(`
    match
      $g isa group, has gid "${esc(ownershipGroup)}";
      $agent isa unit, has uid "${esc(uid)}";
    insert
      (group: $g, member: $agent) isa membership, has role "agent";
  `).catch(() => {
    /* already exists */
  })

  await write(`
    match
      $g isa group, has gid "${esc(ownershipGroup)}";
      $human isa unit, has uid "${esc(humanUid)}";
    insert
      (group: $g, member: $human) isa membership, has role "chairman";
  `).catch(() => {
    /* already exists */
  })

  // 7. Revoke bootstrap key
  await write(`
    match
      $k isa api-key, has api-key-id "${esc(bearerCtx.keyId)}", has key-status $old;
    delete $old of $k;
    insert $k has key-status "revoked";
  `).catch(() => {
    /* key may already be revoked */
  })
  invalidateKeyCache(bearerCtx.keyId)

  // 8. Mint new scoped key for the human, scoped to the ownership group
  const newApiKey = generateApiKey()
  const newKeyHash = await hashKey(newApiKey)
  const newKeyId = `key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  await write(`
    insert $k isa api-key,
      has api-key-id "${esc(newKeyId)}",
      has key-hash "${esc(newKeyHash)}",
      has user-id "${esc(humanUid)}",
      has permissions "read,write",
      has scope-group "${esc(ownershipGroup)}",
      has key-status "active",
      has created ${now};
  `)

  // Link key to human unit
  writeSilent(`
    match
      $k isa api-key, has api-key-id "${esc(newKeyId)}";
      $u isa unit, has uid "${esc(humanUid)}";
    insert
      (api-key: $k, authorized-unit: $u) isa api-authorization;
  `)

  return new Response(
    JSON.stringify({
      owned: true,
      ownerUid: humanUid,
      agentUid: uid,
      group: ownershipGroup,
      newKey: newApiKey,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
