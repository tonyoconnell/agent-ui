/**
 * GET/POST /api/world-config — Chairman dashboard: world-level tuning knobs.
 *
 * GET  — returns { gid, sensitivity, fadeRate, toxicityThreshold, exists }
 *        Query: ?gid=<groupId> (optional, defaults to "one")
 *        Defaults returned if group or attr is absent (0.7 / 0.05 / 10.0).
 * POST — writes one or more knobs. Body: { gid?, sensitivity?, fadeRate?, toxicityThreshold? }
 *        Requires Authorization header + tune_sensitivity permission (chairman or ceo).
 *
 * Persists to TypeDB `group` entity attrs: sensitivity, fade-rate, toxicity-threshold.
 * Engine wiring (loading these into world.ts `select()`) is a follow-up cycle.
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { roleCheck } from '@/lib/role-check'
import { readParsed, write } from '@/lib/typedb'

export const prerender = false

const DEFAULT_GID = 'one'
const DEFAULTS = { sensitivity: 0.7, fadeRate: 0.05, toxicityThreshold: 10.0 } as const

const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_:.-]/g, '')
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export const GET: APIRoute = async ({ url }) => {
  const gid = sanitize(url.searchParams.get('gid') ?? DEFAULT_GID)

  try {
    const groupRows = await readParsed(`match $g isa group, has gid "${gid}"; select $g;`).catch(() => [])
    if (groupRows.length === 0) {
      return Response.json({ gid, ...DEFAULTS, exists: false })
    }

    const [sens, fade, tox] = await Promise.all([
      readParsed(`match $g isa group, has gid "${gid}", has sensitivity $v; select $v;`).catch(() => []),
      readParsed(`match $g isa group, has gid "${gid}", has fade-rate $v; select $v;`).catch(() => []),
      readParsed(`match $g isa group, has gid "${gid}", has toxicity-threshold $v; select $v;`).catch(() => []),
    ])

    return Response.json({
      gid,
      sensitivity: Number(sens[0]?.v ?? DEFAULTS.sensitivity),
      fadeRate: Number(fade[0]?.v ?? DEFAULTS.fadeRate),
      toxicityThreshold: Number(tox[0]?.v ?? DEFAULTS.toxicityThreshold),
      exists: true,
    })
  } catch (err) {
    console.error('[world-config GET] error:', err)
    return Response.json({ error: 'internal server error' }, { status: 500 })
  }
}

export const POST: APIRoute = async ({ request }) => {
  const auth = await resolveUnitFromSession(request)
  if (!auth.isValid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getRoleForUser(auth.user)
  if (!roleCheck(role ?? 'agent', 'tune_sensitivity')) {
    return Response.json({ error: 'Forbidden: chairman or ceo role required' }, { status: 403 })
  }

  let body: { gid?: string; sensitivity?: number; fadeRate?: number; toxicityThreshold?: number }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const gid = sanitize(body.gid ?? DEFAULT_GID)
  const updates: Array<{ attr: string; value: number }> = []

  if (body.sensitivity !== undefined) {
    if (!Number.isFinite(body.sensitivity)) {
      return Response.json({ error: 'sensitivity must be a number' }, { status: 400 })
    }
    updates.push({ attr: 'sensitivity', value: clamp01(body.sensitivity) })
  }
  if (body.fadeRate !== undefined) {
    if (!Number.isFinite(body.fadeRate)) {
      return Response.json({ error: 'fadeRate must be a number' }, { status: 400 })
    }
    updates.push({ attr: 'fade-rate', value: clamp01(body.fadeRate) })
  }
  if (body.toxicityThreshold !== undefined) {
    if (!Number.isFinite(body.toxicityThreshold) || body.toxicityThreshold < 0) {
      return Response.json({ error: 'toxicityThreshold must be a non-negative number' }, { status: 400 })
    }
    updates.push({ attr: 'toxicity-threshold', value: Number(body.toxicityThreshold) })
  }

  if (updates.length === 0) {
    return Response.json({ error: 'no knobs provided (sensitivity, fadeRate, toxicityThreshold)' }, { status: 400 })
  }

  const exists = await readParsed(`match $g isa group, has gid "${gid}"; select $g;`).catch(() => [])
  if (exists.length === 0) {
    return Response.json({ error: `group ${gid} not found` }, { status: 404 })
  }

  try {
    for (const { attr, value } of updates) {
      await write(`
        match
          $g isa group, has gid "${gid}";
          $g has ${attr} $old;
        delete $old of $g;
        insert $g has ${attr} ${value};
      `).catch(() =>
        write(`
          match $g isa group, has gid "${gid}";
          insert $g has ${attr} ${value};
        `),
      )
    }
    return Response.json({ ok: true, gid, updated: updates.map((u) => u.attr) })
  } catch (err) {
    console.error('[world-config POST] error:', err)
    return Response.json({ error: 'internal server error' }, { status: 500 })
  }
}
