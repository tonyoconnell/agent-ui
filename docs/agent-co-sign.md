# Agent Co-Sign Flow

Pattern A from `agents.md` — 2-of-2 co-sign where an agent drafts and partially signs a transaction, a human approves with Touch ID, and the server combines both signatures for execution.

Sources: `src/components/u/lib/agent-sign.ts` · `src/pages/api/agent/pending/` · `src/pages/api/agent/notify.ts`

---

## Flow

```
Agent                       Server (KV)            Human (/u/approve/[id])
─────                       ───────────            ──────────────────────
1. Draft PTB
2. Sign with Ed25519 keypair
3. POST /api/agent/pending  → cosign:<id> 300s TTL
4. POST /api/agent/notify   → signal + push/email
                                                   5. GET /api/agent/pending/:id
                                                   6. Verify summary matches txBytes
                                                   7. Touch ID → vault unlock
                                                   8. Sign txBytes with vault key
                                                   9. PUT approve + humanSigB64
                            ← execute on Sui
                            ← { digest }
```

---

## KV Storage

Key: `cosign:<uuid>` · TTL: 300s (set by KV `expirationTtl`, mirrored in `expiresAt` field).

```typescript
interface CoSignRequestWire {
  id: string
  agentUid: string
  txBytesB64: string     // base64 BCS-encoded transaction
  agentSigB64: string    // base64 Ed25519 agent signature
  summary: string        // human-readable (max 500 chars)
  expiresAt: number      // epoch ms
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  targetAddress: string  // human wallet address
}
```

---

## API Routes

### POST /api/agent/pending

Auth: bearer (agent API key). `agentUid` must match authenticated agent (possession check).

Body: `{ agentUid, txBytesB64, agentSigB64, summary, targetAddress }`
Response 201: `{ id, expiresAt }`

### POST /api/agent/notify

Auth: bearer. Reads `notify-prefs:<targetAddress>` from KV, routes via user's preferred channels. Always emits a substrate signal fallback so the owner can poll `/api/inbox`.

Body: `{ requestId, agentUid, summary }`
Response 202: `{ ok: true, channel: string }` (`"signal"` if no prefs).
Approval URL embedded in notification: `/u/approve/<requestId>`.

### GET /api/agent/pending?address=

Auth: session or bearer. Returns `{ requests: CoSignRequestWire[] }` — only `pending` non-expired requests for the address.

### GET /api/agent/pending/:id

Auth: session or bearer. Returns 410 + `{ kind: "request-expired" }` when KV TTL expired, `expiresAt < Date.now()`, or `status === 'expired'`.

### PUT /api/agent/pending/:id

Auth: **session only** (human cookie) — bearer rejected to prevent agent self-approval.

Approve: `{ action: "approve", humanSigB64 }` → `{ digest }`
Reject: `{ action: "reject" }` → `{ ok: true }`

On rejection, status is set to `rejected` with a 60s TTL so the agent can observe the outcome. On approval, server combines signatures and executes on Sui.

---

## Expiry

Any GET or PUT past the 5-minute TTL returns HTTP 410 with `{ kind: "request-expired" }`. Client-side `approveCoSign()` throws `'co-sign request has expired'`. The UI on `/u/approve/[id]` should catch 410 and show an expiry message. The agent must re-draft if time runs out.

---

## Summary Verification

The approval UI must re-derive the summary from `txBytes` and compare it to the agent-provided `summary`. If they differ, the agent fabricated the description — block approval and show the derived version.

```typescript
const { match, derived } = await verifySummaryMatch(txBytes, wire.summary)
if (!match) { /* show derived, refuse agent summary */ }
```

Both sides call `summarizeTx(txBytes)` from `money.ts` (same decoder). Strings must match after trim.

---

## Client Helpers

```typescript
import { getPendingRequests, approveCoSign, rejectCoSign, verifySummaryMatch }
  from '@/components/u/lib/agent-sign'
```

`approveCoSign(requestId)` — fetch request, prompt Touch ID (vault must already be unlocked), sign, submit approval, return `{ digest }`.

Vault signing stub (`_signWithVault`) uses HMAC-SHA-512 as a dev placeholder. Production path (Ed25519Keypair.signData + 97-byte serialised sig) is `TODO(C4)` in `vault-signer.ts`.

---

## Execution — MultiSig

`_executeCoSign` on the server attempts Sui MultiSig 2-of-2 (agent weight=1, human weight=1, threshold=2) when `SUI_SEED` is set. Falls back to human-only execution if the agent keypair is not derivable. Human signature must be a 97-byte Sui serialised Ed25519 sig (`flag(1) || sig(64) || pubkey(32)`).

---

## See Also

- `agents.md` — Pattern A (co-sign) and Pattern B–D
- `passkeys.md` — vault architecture; Touch ID gate
- `docs/scoped-autonomy.md` — alternative: agent spends autonomously within a cap via `ScopedWallet`
