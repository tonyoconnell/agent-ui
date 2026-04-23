/**
 * POST /api/sponsor/execute — Sponsor signs + submits a user-built transaction.
 *
 * The client builds a transaction with gas owned by the sponsor, the user signs
 * it client-side, then calls this endpoint. The sponsor key signs on the server
 * and both signatures are submitted together.
 *
 * Body:    { txBytes: number[], senderSig: number[] }
 *   txBytes   — BCS-serialized TransactionData (number[] because JSON can't hold Uint8Array)
 *   senderSig — serialized signature bytes from the user's wallet (flag + sig + pubkey)
 *
 * Returns: { digest: string, confirmedAt: number }
 *
 * Errors:
 *   400 — missing/invalid body
 *   500 — SUI_SPONSOR_KEY not configured
 *   502 — Sui RPC rejected the transaction
 */

import { toBase64 } from '@mysten/bcs'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import type { APIRoute } from 'astro'
import { getClient } from '@/lib/sui'

export const prerender = false

// ---------------------------------------------------------------------------
// Sponsor keypair — loaded at call time so wrangler secrets are visible.
// SUI_SPONSOR_KEY is a base64-encoded 32-byte Ed25519 seed (not a full keypair).
// Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
// ---------------------------------------------------------------------------
function loadSponsorKeypair(): Ed25519Keypair {
  const fromRuntime = typeof process !== 'undefined' && process.env && process.env.SUI_SPONSOR_KEY
  const fromBuild = import.meta.env.SUI_SPONSOR_KEY
  const raw = ((fromRuntime || fromBuild || '') as string).trim()

  if (!raw) {
    throw new Error(
      'SUI_SPONSOR_KEY not configured. ' +
        "Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
    )
  }

  // Accept either a 32-byte seed (base64) or a 64-byte secret key (base64).
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
  // Ed25519Keypair.fromSecretKey accepts either 32-byte seed or 64-byte keypair.
  return Ed25519Keypair.fromSecretKey(bytes)
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST: APIRoute = async ({ request }) => {
  // --- 1. Parse body ---
  let txBytes: number[], senderSig: number[]
  try {
    const body = (await request.json()) as { txBytes?: unknown; senderSig?: unknown }
    txBytes = body.txBytes as number[]
    senderSig = body.senderSig as number[]
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(txBytes) || txBytes.length === 0) {
    return Response.json({ error: 'txBytes must be a non-empty number[]' }, { status: 400 })
  }
  if (!Array.isArray(senderSig) || senderSig.length === 0) {
    return Response.json({ error: 'senderSig must be a non-empty number[]' }, { status: 400 })
  }

  // --- 2. Reconstruct Uint8Arrays ---
  const txBytesU8 = new Uint8Array(txBytes)
  const senderSigU8 = new Uint8Array(senderSig)

  // --- 3. Load sponsor keypair ---
  let sponsorKp: Ed25519Keypair
  try {
    sponsorKp = loadSponsorKeypair()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 500 })
  }

  // --- 4. Sponsor signs the txBytes ---
  // signTransaction returns { signature: string (base64 serialized), bytes: string }
  let sponsorSigB64: string
  try {
    const { signature } = await sponsorKp.signTransaction(txBytesU8)
    sponsorSigB64 = signature
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `sponsor signing failed: ${msg}` }, { status: 400 })
  }

  // --- 5. Serialise the sender signature to base64 ---
  // senderSigU8 is already the serialized signature (flag + raw_sig + pubkey bytes)
  // produced by the client's keypair.signTransaction(). Just base64-encode it.
  const senderSigB64 = toBase64(senderSigU8)

  // --- 6. Submit to Sui: [senderSig, sponsorSig] for sponsored tx ---
  // Sui's sponsored-transaction signature order: sender first, sponsor second.
  // SuiJsonRpcClient.executeTransactionBlock accepts signature as string | string[].
  const client = getClient()
  let digest: string
  try {
    const result = await client.executeTransactionBlock({
      transactionBlock: txBytesU8,
      signature: [senderSigB64, sponsorSigB64],
      options: { showEffects: true },
    })
    digest = result.digest
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Sui submission failed: ${msg}` }, { status: 502 })
  }

  // --- 7. Return success ---
  return Response.json({ digest, confirmedAt: Date.now() })
}
