/**
 * GET /api/chain/price?chain=eth
 *
 * Returns native token USD price (CoinGecko, 60s TTL cache).
 */
import type { APIRoute } from 'astro'
import { getTokenPrice } from '@/lib/chains'

export const GET: APIRoute = async ({ url }) => {
  const chain = url.searchParams.get('chain')

  if (!chain) {
    return Response.json({ error: 'Missing chain' }, { status: 400 })
  }

  try {
    const price = await getTokenPrice(chain)
    return Response.json({ ok: true, chain, price })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 502 })
  }
}
