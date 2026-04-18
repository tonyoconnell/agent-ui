/**
 * GET /api/chain/history?chain=eth&address=0x...
 *
 * Returns recent transactions for address on chain.
 */
import type { APIRoute } from 'astro'
import { getTransactions } from '@/lib/chains'

export const GET: APIRoute = async ({ url }) => {
  const chain = url.searchParams.get('chain')
  const address = url.searchParams.get('address')

  if (!chain || !address) {
    return Response.json({ error: 'Missing chain or address' }, { status: 400 })
  }

  try {
    const txs = await getTransactions(address, chain)
    return Response.json({ ok: true, chain, address, transactions: txs, count: txs.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 502 })
  }
}
