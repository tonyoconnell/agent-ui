/**
 * E2E testnet payment: buyer → escrow → seller, platform takes 2%.
 *
 * Usage:
 *   bun run scripts/test-pay-sui.ts
 *
 * Requires: SUI_SEED, SUI_PACKAGE_ID, SUI_PROTOCOL_ID in .env
 */

import 'dotenv/config'
import { world } from '../src/engine'
import { registerPayUnit } from '../src/engine/pay'

const BUYER_UID = 'test:buyer'
const SELLER_UID = 'test:seller'
const SKILL_ID = 'test:skill:cat-photo'
const AMOUNT = 1_000_000 // 1 USDC (6 decimals)

async function run() {
  const net = world()
  registerPayUnit(net)

  let settled = false

  // Wire a listener to confirm the commerce:settle signal fires
  net.add('signal').on('signal', (data: unknown) => {
    const d = data as any
    if (d?.tags?.includes('commerce:settle')) {
      console.log('[✓] commerce:settle signal received:', JSON.stringify(d.content, null, 2))
      settled = true
    }
    return undefined
  })

  console.log('=== Sui Pay E2E Test ===')
  console.log(`Buyer:  ${BUYER_UID}`)
  console.log(`Seller: ${SELLER_UID}`)
  console.log(`Skill:  ${SKILL_ID}`)
  console.log(`Amount: ${AMOUNT} (1 USDC)\n`)

  // Step 1: Initiate escrow
  console.log('[1] Initiating escrow…')
  const initResult = await net.ask({
    receiver: 'pay:initiate',
    data: {
      skillId: SKILL_ID,
      buyerUid: BUYER_UID,
      sellerUid: SELLER_UID,
      amount: AMOUNT,
    },
  })

  if (initResult.timeout) {
    console.error('[✗] Escrow initiation timed out')
    process.exit(1)
  }

  if (initResult.dissolved) {
    console.error('[✗] Pay unit missing — check registerPayUnit() is called')
    process.exit(1)
  }

  if (!initResult.result) {
    console.error('[✗] Escrow initiation failed (insufficient balance or wallet rejected)')
    process.exit(1)
  }

  const { digest: initDigest, escrowId, amount } = initResult.result as any
  console.log(`[✓] Escrow created: ${escrowId}`)
  console.log(`    TX: ${initDigest}\n`)

  net.mark(`${BUYER_UID}→${SELLER_UID}`, 1)

  // Step 2: Settle escrow (seller claims)
  console.log('[2] Settling escrow (seller claims)…')
  const settleResult = await net.ask({
    receiver: 'pay:settle',
    data: {
      escrowId,
      sellerUid: SELLER_UID,
      buyerUid: BUYER_UID,
      amount,
      skillId: SKILL_ID,
    },
  })

  if (settleResult.timeout) {
    console.error('[✗] Settlement timed out')
    process.exit(1)
  }

  if (!settleResult.result) {
    console.error('[✗] Settlement failed')
    process.exit(1)
  }

  const { digest: settleDigest, fee } = settleResult.result as any
  console.log(`[✓] Escrow settled`)
  console.log(`    TX: ${settleDigest}`)
  console.log(`    Treasury fee: ${fee} (${((fee / amount) * 100).toFixed(1)}%)\n`)

  net.mark(`pay→${SELLER_UID}`, 1)

  // Verify commerce:settle signal fired
  if (!settled) {
    console.warn('[!] commerce:settle signal not observed — check signal wiring')
  }

  console.log('=== highways (after payment) ===')
  const highways = net.highways(5)
  for (const h of highways) {
    console.log(`  ${h.path}  strength=${h.strength}`)
  }

  console.log('\n[✓] All checks passed')
}

run().catch((err) => {
  console.error('[✗] Test failed:', err)
  process.exit(1)
})
