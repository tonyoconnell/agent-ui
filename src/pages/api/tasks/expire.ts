import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  // TODO: claimed-at not in master schema (one.tql) — TTL expiration disabled
  // Once claimed-at is added to schema, restore TTL logic (30min per CLAIM_TTL_MS)
  // For now, return empty (no stale claims expired)
  return new Response(JSON.stringify({ expired: [], count: 0, note: 'claim TTL disabled (schema mismatch)' }), {
    status: 200,
  })
}
