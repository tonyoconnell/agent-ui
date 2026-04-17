/**
 * POST /api/faucet-internal — Send testnet SUI from the testnet-buyer
 *
 * Body: { address: string, amount?: number }
 * Default amount: 0.1 SUI (100_000_000 MIST)
 *
 * Uses the testnet-buyer's keypair to send a SUI coin transfer.
 * Fallback when the official Sui faucet is rate-limited.
 */

import { Transaction } from '@mysten/sui/transactions'
import type { APIRoute } from 'astro'
import { deriveKeypair, getClient } from '@/lib/sui'

const TESTNET_BUYER_UID = 'market:testnet-buyer'
const DEFAULT_AMOUNT = 100_000_000n // 0.1 SUI

export const POST: APIRoute = async ({ request }) => {
  const { address, amount } = (await request.json()) as {
    address?: string
    amount?: number
  }

  if (!address?.startsWith('0x') || address.length < 40) {
    return Response.json({ error: 'valid Sui address required' }, { status: 400 })
  }

  const sendAmount = amount ? BigInt(Math.floor(amount * 1_000_000_000)) : DEFAULT_AMOUNT

  try {
    const keypair = await deriveKeypair(TESTNET_BUYER_UID)
    const client = getClient()

    // Check balance first
    const balance = await client.getBalance({ owner: keypair.getPublicKey().toSuiAddress() })
    if (BigInt(balance.totalBalance) < sendAmount + 10_000_000n) {
      return Response.json(
        { error: 'testnet-buyer insufficient balance', balance: balance.totalBalance },
        { status: 400 },
      )
    }

    const tx = new Transaction()
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(sendAmount)])
    tx.transferObjects([coin], tx.pure.address(address))

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: { showEffects: true },
    })

    return Response.json({
      ok: true,
      address,
      amount: Number(sendAmount) / 1_000_000_000,
      digest: result.digest,
      from: keypair.getPublicKey().toSuiAddress(),
    })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
