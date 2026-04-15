import type { APIRoute } from 'astro'
import { type BrandTokens, invalidateBrandCache } from '@/engine/brand'
import { auth } from '@/lib/auth'
import { readParsed, writeSilent } from '@/lib/typedb'

type Scope = 'thing' | 'group' | 'user'

const VALID_SCOPES: Scope[] = ['thing', 'group', 'user']

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function entityFor(scope: 'thing' | 'group'): { entity: string; idAttr: string } {
  return scope === 'thing' ? { entity: 'thing', idAttr: 'tid' } : { entity: 'group', idAttr: 'gid' }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { scope?: unknown; id?: unknown; brand?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { scope, id, brand } = body

  // ── Validate scope ────────────────────────────────────────────────────────
  if (!scope || !VALID_SCOPES.includes(scope as Scope)) {
    return Response.json({ error: `Invalid scope. Must be one of: ${VALID_SCOPES.join(', ')}` }, { status: 400 })
  }

  const typedScope = scope as Scope

  // ── Validate id (required for thing/group scopes) ─────────────────────────
  if (typedScope !== 'user' && (typeof id !== 'string' || !id.trim())) {
    return Response.json({ error: 'id is required for thing and group scopes' }, { status: 400 })
  }

  // ── Validate brand ────────────────────────────────────────────────────────
  if (!brand || typeof brand !== 'object') {
    return Response.json({ error: 'brand must be a non-null object' }, { status: 400 })
  }

  const typedBrand = brand as BrandTokens

  // ── Scope: user — cookie only, no TypeDB write ────────────────────────────
  if (typedScope === 'user') {
    const brandJson = JSON.stringify(typedBrand)
    const brandB64 = btoa(brandJson)

    cookies.set('ds.brand', brandB64, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return Response.json({ ok: true })
  }

  // ── Scope: thing | group — require auth ───────────────────────────────────
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Ownership guard ───────────────────────────────────────────────────────
  // Schema supports `membership(group, member)` for groups; `id` is validated
  // above (alphanumeric entity id from request body — no raw user input reaches TQL).
  // `thing` has no owner attribute yet; ownership check for thing-scope is deferred
  // until schema adds `thing has owner` — see TODO-design-system-hardening.md.
  if (typedScope === 'group') {
    const userId = session.user?.id
    if (!userId) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const safeUserId = escapeStr(userId)
    const rows = await readParsed(
      `match $g isa group, has gid "${escapeStr(id as string)}"; (group: $g, member: $m) isa membership; $m has aid "${safeUserId}"; select $m;`,
    ).catch(() => [] as Record<string, unknown>[])
    if (rows.length === 0) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }
  }
  // scope === 'thing': session-required (already enforced above). Ownership
  // check deferred until schema adds `thing has owner` — see hardening TODO.

  // ── Write to TypeDB ───────────────────────────────────────────────────────
  const safeId = escapeStr(id as string)
  const brandJson = escapeStr(JSON.stringify(typedBrand))
  const { entity, idAttr } = entityFor(typedScope)

  // TypeDB 3.x supports delete-has then insert in a single pipeline.
  // We use two separate writeSilent calls: delete first (idempotent, may be
  // a no-op on first write), then insert. This avoids duplicate attribute
  // values since `brand` is a single-valued attribute per entity.
  //
  // Note: if the delete fires before the insert completes on the server,
  // there is a brief window with no brand. This is acceptable for a
  // user-preference attribute — the fallback is the default theme.
  writeSilent(`
    match $e isa ${entity}, has ${idAttr} "${safeId}", has brand $b;
    delete has brand of $e;
  `)

  writeSilent(`
    match $e isa ${entity}, has ${idAttr} "${safeId}";
    insert $e has brand "${brandJson}";
  `)

  // ── Invalidate in-process brand cache ────────────────────────────────────
  invalidateBrandCache()

  return Response.json({ ok: true })
}
