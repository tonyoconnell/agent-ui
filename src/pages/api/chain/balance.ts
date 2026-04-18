/**
 * GET /api/chain/balance?chain=eth&address=0x...
 *
 * Returns native token balance for address on chain.
 * Delegates to BlockchainService via substrate bridge unit.
 */
import type { APIRoute } from 'astro'
import { getBalance } from '@/lib/chains'

export const GET: APIRoute = async ({ url }) => {
  const chain = url.searchParams.get('chain')
  const address = url.searchParams.get('address')

  if (!chain || !address) {
    return Response.json({ error: 'Missing chain or address' }, { status: 400 })
  }

  try {
    const result = await getBalance(address, chain)
    return Response.json({ ok: true, chain, address, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 502 })
  }
}
