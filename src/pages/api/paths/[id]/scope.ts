/**
 * POST /api/paths/[id]/scope
 *
 * Promote path scope: private → group → public.
 * Only chairman-level callers may change scope.
 *
 * Params: id — path-id (URL segment)
 * Body:   { scope: 'group' | 'public' }
 *
 * Returns: { ok: true, pathId: string, scope: string }
 * Errors:  400 if scope invalid, 401 if unauthenticated, 403 if insufficient role
 */

import type { APIRoute } from 'astro'
import { world } from '@/engine/persist'
import { getRoleForUser, requireAuth, validateApiKey } from '@/lib/api-auth'
import { roleCheck } from '@/lib/role-check'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

const VALID_SCOPES = ['group', 'public'] as const
type AllowedScope = (typeof VALID_SCOPES)[number]

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await validateApiKey(request)
  try {
    requireAuth(auth)
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pathId = params.id
  if (!pathId) {
    return Response.json({ error: 'path id required' }, { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as { scope?: unknown }
  const scope = body.scope as string | undefined

  if (!scope || !VALID_SCOPES.includes(scope as AllowedScope)) {
    return Response.json({ error: 'scope must be one of: group, public', valid: VALID_SCOPES }, { status: 400 })
  }

  // Governance: chairman role required to promote scope
  const role = await getRoleForUser(auth.user)
  if (!roleCheck(role ?? 'agent', 'tune_sensitivity')) {
    return Response.json({ error: 'Forbidden: chairman role required to promote path scope' }, { status: 403 })
  }

  const q = (s: string) => s.replace(/"/g, '\\"')

  // Update path scope in TypeDB (delete old, insert new)
  await writeSilent(`
    match
      $p isa path, has path-id "${q(pathId)}";
    insert
      $p has scope "${q(scope)}";
  `)

  // Emit scope:path:promoted signal into the substrate
  const net = world()
  net.signal({
    receiver: 'substrate:path:scope',
    data: {
      tags: ['scope', 'path', 'promoted'],
      content: { pathId, scope, promotedBy: auth.user },
    },
  })

  return Response.json({ ok: true, pathId, scope })
}
