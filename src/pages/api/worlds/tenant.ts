/**
 * GET  /api/worlds/tenant        — list provisioned worlds (tenants)
 * POST /api/worlds/tenant        — provision a new premium world
 *
 * A world is a named group with isolated pheromone, custom brand, and a
 * billing tier. OO Agency is tenant #1. Premium = group-type "world" +
 * entry in the D1 tenants table.
 *
 * Tiers: starter ($499/mo), growth ($1,999/mo), enterprise ($9,999/mo)
 */
import type { APIRoute } from 'astro'
import { readParsed, write } from '@/lib/typedb'

type Tier = 'starter' | 'growth' | 'enterprise'

const TIER_PRICE: Record<Tier, number> = {
  starter: 499,
  growth: 1999,
  enterprise: 9999,
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = (locals as { runtime?: { env?: { DB?: D1Database } } }).runtime?.env?.DB

    const rows = await readParsed(`
      match $g isa group, has gid $id, has name $n, has group-type "world";
      optional { $g has brand $b; }
      select $id, $n, $b;
    `)

    const worlds = rows.map((r) => ({
      gid: r.id as string,
      name: r.n as string,
      brand: (r.b as string | undefined) ?? '',
    }))

    if (db) {
      const tenantRows = await db.prepare('SELECT * FROM tenants ORDER BY created_at DESC').all()
      const tierMap = new Map((tenantRows.results ?? []).map((t) => [t.gid as string, t]))
      return Response.json({
        tenants: worlds.map((w) => ({
          ...w,
          tier: (tierMap.get(w.gid)?.tier as Tier | undefined) ?? 'starter',
          pricePerMonth: TIER_PRICE[(tierMap.get(w.gid)?.tier as Tier | undefined) ?? 'starter'],
          active: (tierMap.get(w.gid)?.active as number | undefined) === 1,
        })),
      })
    }

    return Response.json({
      tenants: worlds.map((w) => ({ ...w, tier: 'starter' as Tier, pricePerMonth: 499, active: false })),
    })
  } catch {
    return Response.json({ tenants: [] })
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as { runtime?: { env?: { DB?: D1Database } } }).runtime?.env?.DB

    const body = (await request.json()) as {
      name?: string
      brand?: string
      tier?: Tier
      ownerUid?: string
    }

    if (!body.name || !body.brand) {
      return Response.json({ error: 'name and brand are required' }, { status: 400 })
    }

    const gid = `world:${body.brand.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`
    const tier = body.tier ?? 'starter'
    const price = TIER_PRICE[tier]

    await write(`
      insert $g isa group,
        has gid "${gid}",
        has name "${body.name.replace(/['"\\]/g, '')}",
        has group-type "world",
        has brand "${body.brand.replace(/['"\\]/g, '')}";
    `)

    if (db) {
      await db
        .prepare(
          'INSERT OR IGNORE INTO tenants (gid, name, brand, tier, price_per_month, active, created_at) VALUES (?,?,?,?,?,1,?)',
        )
        .bind(gid, body.name, body.brand, tier, price, Date.now())
        .run()
    }

    return Response.json(
      { ok: true, gid, name: body.name, brand: body.brand, tier, pricePerMonth: price },
      { status: 201 },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
