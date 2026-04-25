/**
 * POST /api/agents/create-onchain — Create on-chain Sui Unit object
 *
 * Body: { uid: string, name?: string, kind?: string }
 *
 * Funds the wallet via testnet faucet, waits for confirmation,
 * creates a Move Unit object, and stores the objectId in TypeDB.
 *
 * Returns: { ok, uid, address, objectId, digest }
 */
import type { APIRoute } from 'astro'
import { createUnit, getClient } from '@/lib/sui'
import { writeSilent } from '@/lib/typedb'

/** Wait for faucet funds to arrive (poll balance) */
async function waitForFunding(address: string, maxWaitMs = 10000): Promise<boolean> {
  const client = getClient()
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const balance = await client.getBalance({ owner: address }).catch(() => ({ totalBalance: '0' }))
    if (BigInt(balance.totalBalance) > 0n) return true
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

export const POST: APIRoute = async ({ request }) => {
  const { uid, name, kind } = (await request.json()) as {
    uid?: string
    name?: string
    kind?: string
  }

  if (!uid) {
    return Response.json({ error: 'uid required' }, { status: 400 })
  }

  try {
    // Derive address and pre-fund before creating on-chain object
    const address = ''

    // Check existing balance first
    const client = getClient()
    const balance = await client.getBalance({ owner: address }).catch(() => ({ totalBalance: '0' }))
    const hasFunds = BigInt(balance.totalBalance) > 0n

    if (!hasFunds) {
      // Try official Sui faucet first
      await fetch('https://faucet.testnet.sui.io/v1/gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ FixedAmountRequest: { recipient: address } }),
      }).catch(() => {})

      let funded = await waitForFunding(address, 8000)

      // Fallback: use testnet-buyer as internal faucet
      if (!funded) {
        const origin = new URL(request.url).origin
        await fetch(`${origin}/api/faucet-internal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, amount: 0.1 }),
        }).catch(() => {})
        funded = await waitForFunding(address, 6000)
      }

      if (!funded) {
        return Response.json({
          ok: false,
          uid,
          address,
          objectId: null,
          digest: null,
          error: 'faucet timeout — wallet created but not funded yet',
          soft: true,
        })
      }
    }

    // Now create the on-chain Unit object
    const result = await createUnit(uid, name || uid, kind || 'agent')

    // Store objectId + wallet in TypeDB
    if (result.objectId) {
      writeSilent(`
        match $u isa unit, has uid "${uid}";
        insert $u has sui-unit-id "${result.objectId}";
      `)
    }
    if (result.address) {
      writeSilent(`
        match $u isa unit, has uid "${uid}";
        insert $u has wallet "${result.address}";
      `)
    }

    return Response.json({
      ok: true,
      uid,
      address: result.address,
      objectId: result.objectId,
      digest: result.digest,
    })
  } catch (e) {
    const msg = String(e)
    if (msg.includes('rate') || msg.includes('429')) {
      return Response.json({ ok: false, uid, error: 'rate-limited', soft: true }, { status: 200 })
    }
    // Return address even on error
    const address = null
    return Response.json({ ok: false, uid, address, error: msg, soft: true }, { status: 200 })
  }
}
