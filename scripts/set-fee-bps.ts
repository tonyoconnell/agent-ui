/**
 * set-fee-bps.ts — Admin script to update the protocol fee on the ONE testnet.
 *
 * Changes fee_bps from 50 (0.5%) to 200 (2%) by calling the `set_fee_bps`
 * Move function on the shared Protocol object.
 *
 * Usage:
 *   bun run scripts/set-fee-bps.ts            # execute tx
 *   bun run scripts/set-fee-bps.ts --dry-run  # print tx without executing
 *
 * Required env vars:
 *   SUI_PACKAGE_ID          — deployed package on testnet
 *   SUI_PROTOCOL_OBJECT_ID  — shared Protocol object ID
 *   SUI_SEED                — platform seed (base64, 32 bytes)
 */

import { Transaction } from '@mysten/sui/transactions'
import { deriveKeypair, getClient, signAndExecute } from '@/lib/sui'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const NEW_FEE_BPS = 200n // 2.00%

const DRY_RUN = process.argv.includes('--dry-run')

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) {
    console.error(`✗ Missing env var: ${name}`)
    process.exit(1)
  }
  return val
}

// ═══════════════════════════════════════════════════════════════════════════
// READ — fetch current fee_bps from Protocol object
// ═══════════════════════════════════════════════════════════════════════════

async function readFeeBps(protocolId: string): Promise<bigint | null> {
  const client = getClient()
  const obj = await client.getObject({
    id: protocolId,
    options: { showContent: true },
  })

  const content = obj.data?.content
  if (!content || content.dataType !== 'moveObject') return null

  const fields = (content as { dataType: 'moveObject'; fields: Record<string, unknown> }).fields
  const raw = fields.fee_bps
  if (raw === undefined || raw === null) return null
  return BigInt(raw as string | number)
}

// ═══════════════════════════════════════════════════════════════════════════
// TX — build set_fee_bps transaction
// ═══════════════════════════════════════════════════════════════════════════

function buildTx(packageId: string, protocolId: string, feeBps: bigint): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${packageId}::substrate::set_fee_bps`,
    arguments: [
      tx.object(protocolId), // &mut Protocol (shared)
      tx.pure.u64(feeBps), // new_fee_bps
    ],
  })
  return tx
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const packageId = requireEnv('SUI_PACKAGE_ID')
  const protocolId = requireEnv('SUI_PROTOCOL_OBJECT_ID')

  // SUI_SEED existence is validated inside deriveKeypair; call requireEnv
  // here to surface a clear error before any async work.
  requireEnv('SUI_SEED')

  console.log('ONE Protocol — set_fee_bps')
  console.log('──────────────────────────')
  console.log(`Package:  ${packageId}`)
  console.log(`Protocol: ${protocolId}`)
  console.log(`New fee:  ${NEW_FEE_BPS} bps (${Number(NEW_FEE_BPS) / 100}%)`)
  console.log()

  // ── Before ──────────────────────────────────────────────────────────────
  console.log('Reading current fee_bps...')
  const before = await readFeeBps(protocolId)
  if (before === null) {
    console.error('✗ Could not read Protocol object. Check SUI_PROTOCOL_OBJECT_ID.')
    process.exit(1)
  }
  console.log(`  before: ${before} bps (${Number(before) / 100}%)`)
  console.log()

  // ── Build tx ─────────────────────────────────────────────────────────────
  const tx = buildTx(packageId, protocolId, NEW_FEE_BPS)

  if (DRY_RUN) {
    console.log('[dry-run] Transaction NOT executed.')
    console.log('[dry-run] Move call:')
    console.log(`  target: ${packageId}::substrate::set_fee_bps`)
    console.log(`  args:   [Protocol(${protocolId}), u64(${NEW_FEE_BPS})]`)
    console.log()
    console.log('Pass without --dry-run to execute.')
    return
  }

  // ── Execute ──────────────────────────────────────────────────────────────
  console.log('Deriving admin keypair from SUI_SEED...')
  const keypair = await deriveKeypair('__platform__')
  const address = keypair.getPublicKey().toSuiAddress()
  console.log(`  signer: ${address}`)
  console.log()

  console.log('Executing set_fee_bps transaction...')
  const { digest } = await signAndExecute(tx, keypair)
  console.log(`  digest: ${digest}`)
  console.log()

  // ── After ────────────────────────────────────────────────────────────────
  console.log('Confirming new fee_bps...')
  // Brief wait for the RPC to reflect the committed state
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const after = await readFeeBps(protocolId)
  if (after === null) {
    console.error('✗ Could not re-read Protocol object after tx.')
    process.exit(1)
  }
  console.log(`  after: ${after} bps (${Number(after) / 100}%)`)
  console.log()

  if (after !== NEW_FEE_BPS) {
    console.error(`✗ fee_bps mismatch: expected ${NEW_FEE_BPS}, got ${after}`)
    process.exit(1)
  }

  console.log(`✓ fee_bps updated: ${before} bps → ${after} bps`)
  console.log(`  tx: https://suiexplorer.com/txblock/${digest}?network=testnet`)
}

main().catch((err) => {
  console.error('✗ Fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
