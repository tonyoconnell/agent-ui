/**
 * owner-mint.ts — server-side helper for first-mint Move call.
 *
 * Calls `one::owner::init_substrate_owner(pin, addr)` on Sui to lock the
 * SubstrateOwner shared object's `owner` field to the asserted address.
 *
 * Lifecycle: invoked once per substrate by the first-mint branch of
 * `/api/auth/passkey/assert`. Second call aborts on-chain with
 * E_OWNER_LOCKED — the API returns 409 Conflict in that case.
 *
 * Configuration: requires SUI_SPONSOR_KEY (or any operator-class secret
 * key) set in env to sign + pay gas. Pin object id comes from
 * SUBSTRATE_OWNER_PIN_ID; package id from ONE_PACKAGE_ID (these are
 * recorded after deploy by the operator).
 */

import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Transaction } from '@mysten/sui/transactions'

function readEnv(name: string): string {
  const fromRuntime = typeof process !== 'undefined' && process.env?.[name]
  const fromBuild = (import.meta.env as Record<string, unknown>)[name]
  return ((fromRuntime || fromBuild || '') as string).toString()
}

function operatorKeypair(): Ed25519Keypair {
  const raw = readEnv('SUI_SPONSOR_KEY') || readEnv('SUI_OPERATOR_KEY')
  if (!raw) throw new Error('owner-mint: SUI_SPONSOR_KEY (or SUI_OPERATOR_KEY) not configured')
  if (raw.startsWith('suiprivkey')) return Ed25519Keypair.fromSecretKey(raw)
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
  return Ed25519Keypair.fromSecretKey(bytes)
}

function suiClient(): SuiJsonRpcClient {
  const net = (readEnv('SUI_NETWORK') || 'testnet') as 'testnet' | 'mainnet' | 'devnet' | 'localnet'
  return new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(net), network: net })
}

export interface InitSubstrateOwnerResult {
  digest: string
  pinObject: string
  ownerAddress: string
}

/**
 * Lock the SubstrateOwner pin to the given address. Throws if the pin is
 * already locked (Move asserts E_OWNER_LOCKED → tx fails with code 100).
 */
export async function lockOnChainOwner(address: string): Promise<InitSubstrateOwnerResult> {
  const packageId = readEnv('ONE_PACKAGE_ID')
  const pinObject = readEnv('SUBSTRATE_OWNER_PIN_ID')
  if (!packageId) throw new Error('owner-mint: ONE_PACKAGE_ID not configured')
  if (!pinObject) throw new Error('owner-mint: SUBSTRATE_OWNER_PIN_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${packageId}::owner::init_substrate_owner`,
    arguments: [tx.object(pinObject), tx.pure.address(address)],
  })

  const client = suiClient()
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: operatorKeypair(),
    options: { showEffects: true, showEvents: true },
  })

  const status = (result.effects as { status?: { status?: string; error?: string } } | undefined)?.status
  if (status?.status !== 'success') {
    throw new Error(`owner-mint: init_substrate_owner failed — ${status?.error ?? 'unknown'}`)
  }

  return { digest: result.digest, pinObject, ownerAddress: address }
}

/**
 * Read the on-chain owner address from the SubstrateOwner pin. Returns
 * null if the pin is unlocked (owner = @0x0). Used by the assert endpoint
 * for cross-checking the D1 record.
 */
export async function readOnChainOwner(): Promise<{ address: string; locked: boolean } | null> {
  const pinObject = readEnv('SUBSTRATE_OWNER_PIN_ID')
  if (!pinObject) return null

  const client = suiClient()
  const obj = await client
    .getObject({
      id: pinObject,
      options: { showContent: true },
    })
    .catch(() => null)

  const fields = (obj?.data?.content as { fields?: { owner?: string; locked?: boolean } } | undefined)?.fields
  if (!fields) return null
  return { address: fields.owner ?? '0x0', locked: !!fields.locked }
}
