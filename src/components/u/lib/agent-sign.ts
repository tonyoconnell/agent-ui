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
 * Retrieves the wallet's private key from the vault and signs txBytes using
 * the Ed25519Keypair via createVaultSigner.
 *
 * The server verifies this signature against the stored wallet address before
 * combining with the agent signature.
 */
async function _signWithVault(txBytes: Uint8Array): Promise<Uint8Array> {
  const { Vault } = await import('./vault/index')
  const { createVaultSigner } = await import('./signer/vault-signer')

  const wallets = await Vault.listWallets()
  if (wallets.length === 0) {
    throw new Error('No wallet in vault — unlock the vault first')
  }
  const wallet = wallets.find((w) => w.chain === 'sui') ?? wallets[0]

  const signer = createVaultSigner({ address: wallet.address, walletId: wallet.id, chain: 'sui' })
  const { bytes } = await signer.signTransaction(txBytes)
  return bytes
}
