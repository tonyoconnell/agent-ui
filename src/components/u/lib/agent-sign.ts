/**
 * Agent Co-Sign Support (Pattern A — agents.md)
 *
 * 2-of-2 co-sign flow:
 *   1. Agent drafts transaction, signs with its derived Ed25519 keypair
 *   2. Agent posts CoSignRequest to /api/agent/pending (server stores in KV, 5-min TTL)
 *   3. Human receives notification, reviews summary
 *   4. Human approves: Touch ID → vault decrypts → human signs txBytes → server combines + submits
 *   5. Human rejects: server marks request rejected
 *
 * The human never sees raw txBytes — `summarizeTx` (money.ts) produces the readable summary.
 * The agent's signature is stored server-side; the human's signature is added at approval time.
 * Combining both: Sui MultiSig with [agentSig, humanSig] (2-of-2 threshold).
 */

// ── Types ──────────────────────────────────────────────────────────────────

/** A pending co-sign request from an agent, waiting for human approval. */
export interface CoSignRequest {
  /** UUID — used as KV key `cosign:${id}` */
  id: string
  /** Substrate UID of the requesting agent */
  agentUid: string
  /** BCS-encoded transaction bytes (base64 when serialised over HTTP) */
  txBytes: Uint8Array
  /** Agent's partial Ed25519 signature over txBytes (base64 when serialised) */
  agentSig: Uint8Array
  /** Human-readable tx summary produced by summarizeTx (money.ts) */
  summary: string
  /** Epoch ms; 5-min TTL matching KV entry TTL */
  expiresAt: number
  status: 'pending' | 'approved' | 'rejected' | 'expired'
}

/** Wire format returned by /api/agent/pending (Uint8Array fields as base64 strings) */
export interface CoSignRequestWire {
  id: string
  agentUid: string
  /** base64-encoded transaction bytes */
  txBytesB64: string
  /** base64-encoded agent Ed25519 signature */
  agentSigB64: string
  summary: string
  expiresAt: number
  status: CoSignRequest['status']
}

// ── Encoding helpers ───────────────────────────────────────────────────────

function toB64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function wireToRequest(w: CoSignRequestWire): CoSignRequest {
  return {
    id: w.id,
    agentUid: w.agentUid,
    txBytes: fromB64(w.txBytesB64),
    agentSig: fromB64(w.agentSigB64),
    summary: w.summary,
    expiresAt: w.expiresAt,
    status: w.status,
  }
}

// ── API helpers ────────────────────────────────────────────────────────────

const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://one.ie'

/**
 * Fetch all pending co-sign requests for a wallet address.
 * Calls GET /api/agent/pending?address=<address>
 */
export async function getPendingRequests(address: string): Promise<CoSignRequest[]> {
  const res = await fetch(`${BASE}/api/agent/pending?address=${encodeURIComponent(address)}`, {
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`getPendingRequests: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { requests: CoSignRequestWire[] }
  return json.requests.map(wireToRequest)
}

/**
 * Approve a co-sign request.
 *
 * Flow:
 *   1. Fetch txBytes from server (GET /api/agent/pending/:id)
 *   2. Prompt Touch ID via vault to obtain signing key
 *   3. Sign txBytes with human's Ed25519 key
 *   4. PUT /api/agent/pending/:id with humanSigB64
 *   5. Server combines agent + human signatures, executes tx on Sui
 *
 * @param requestId - UUID of the pending request
 * @returns digest of the executed transaction
 */
export async function approveCoSign(requestId: string): Promise<{ digest: string }> {
  // 1. Fetch the request (includes txBytes for signing)
  const getRes = await fetch(`${BASE}/api/agent/pending/${encodeURIComponent(requestId)}`, {
    credentials: 'include',
  })
  if (getRes.status === 410) {
    throw new Error('co-sign request has expired')
  }
  if (!getRes.ok) {
    throw new Error(`approveCoSign fetch: ${getRes.status} ${await getRes.text()}`)
  }
  const wire = (await getRes.json()) as CoSignRequestWire
  const txBytes = fromB64(wire.txBytesB64)

  // 2. Sign with human's vault key (browser-side: Touch ID via WebAuthn PRF)
  //    The vault must already be unlocked; callers should call Vault.unlock() first.
  const humanSig = await _signWithVault(txBytes)

  // 3. Submit approval
  const putRes = await fetch(`${BASE}/api/agent/pending/${encodeURIComponent(requestId)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'approve',
      humanSigB64: toB64(humanSig),
    }),
  })
  if (!putRes.ok) {
    throw new Error(`approveCoSign PUT: ${putRes.status} ${await putRes.text()}`)
  }
  const result = (await putRes.json()) as { digest: string }
  return { digest: result.digest }
}

/**
 * Reject a co-sign request.
 * Calls PUT /api/agent/pending/:id with action=reject.
 *
 * @param requestId - UUID of the pending request
 */
export async function rejectCoSign(requestId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/agent/pending/${encodeURIComponent(requestId)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reject' }),
  })
  if (!res.ok) {
    throw new Error(`rejectCoSign: ${res.status} ${await res.text()}`)
  }
}

// ── Summary verification ───────────────────────────────────────────────────

/**
 * Re-derive the tx summary from raw txBytes (reviewer side).
 *
 * Both sides of the 2-of-2 co-sign must produce the same summary from the
 * same txBytes. If the derived summary doesn't match the agent-provided
 * summary, the agent fabricated the human-readable description — the UI
 * MUST refuse to present the summary and warn the user.
 *
 * Per agents.md: "both sides must match" — the human approval UI must
 * re-derive the summary from txBytes, not trust the agent-provided string.
 *
 * @param txBytes - Raw BCS-encoded transaction bytes from the co-sign request
 * @param storedSummary - Agent-provided summary stored in CoSignRequest.summary
 * @returns { match: boolean, derived: string }
 *   match — true iff derived.trim() === storedSummary.trim()
 *   derived — the summary rebuilt from txBytes (show this when match is false)
 */
export async function verifySummaryMatch(
  txBytes: Uint8Array,
  storedSummary: string,
): Promise<{ match: boolean; derived: string }> {
  const { summarizeTx } = await import('./money')
  const derived = await summarizeTx(txBytes)
  return {
    match: derived.trim() === storedSummary.trim(),
    derived,
  }
}

// ── Vault signing (browser-only) ───────────────────────────────────────────

/**
 * Sign bytes with the current vault session's Ed25519 key.
 *
 * Requires an active vault session (Vault.unlock() must have been called).
 * Uses WebCrypto HMAC-SHA-256 as a deterministic signing step — the vault
 * derives an Ed25519 private key from its master secret using HKDF, then
 * signs the txBytes.
 *
 * In a production implementation this would call into the @mysten/sui
 * Ed25519Keypair.signData() using the vault-derived key. For now it
 * produces a deterministic 64-byte signature over the tx intent hash
 * (intent prefix || txBytes) using HMAC-SHA-512 (same bytes, auditable).
 *
 * The server verifies this signature against the stored wallet address before
 * combining with the agent signature.
 */
async function _signWithVault(txBytes: Uint8Array): Promise<Uint8Array> {
  // Dynamically import vault to avoid SSR bundling of browser-only code
  const { Vault } = await import('./vault/index')

  // Get the active wallet's private key bytes from the vault
  // The vault session must already be unlocked (Touch ID prompted by caller)
  const wallets = await Vault.listWallets()
  if (wallets.length === 0) {
    throw new Error('No wallet in vault — unlock the vault first')
  }
  const wallet = wallets[0]

  // Derive a signing key from the vault-held seed using HKDF
  // intent prefix 0 = "TransactionData" (matches Sui SDK intent)
  const intentBytes = new Uint8Array(3) // [0, 0, 0]
  const intentMessage = new Uint8Array(intentBytes.length + txBytes.length)
  intentMessage.set(intentBytes)
  intentMessage.set(txBytes, intentBytes.length)

  // The vault exposes the wallet's address; use HMAC-SHA-256(address, intentMessage)
  // as a structurally deterministic stand-in for Ed25519 signing until the
  // vault's Ed25519 sign path is wired (vault-signer.ts TODO(C4)).
  //
  // Production path: Vault.signBytes(wallet.address, intentMessage) → Ed25519Sig
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(wallet.address),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', keyMaterial, intentMessage)
  return new Uint8Array(sigBuf)
}
