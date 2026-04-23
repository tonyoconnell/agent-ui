# Sponsor Worker

Two API routes handle sponsored transactions: `build` assembles and gas-prices
the PTB; `execute` co-signs and submits it. The user never pays gas.

Source files: `src/pages/api/sponsor/build.ts`, `src/pages/api/sponsor/execute.ts`.

---

## Flow

```
Client                        Server
──────                        ──────
1. POST /api/sponsor/build    → build PTB, set sponsor gas, serialize
   { sender, txKind, params }
   ← { txBytes, expiresAt }

2. signTxWithWrapping()       (browser, Touch ID gate)
   ← senderSig (97 bytes)

3. POST /api/sponsor/execute  → sponsor signs, submit [senderSig, sponsorSig]
   { txBytes, senderSig }
   ← { digest, confirmedAt }
```

---

## POST /api/sponsor/build

### Request

```typescript
{
  sender: string             // Sui address of the wallet owner
  txKind: "transfer" | "move-call" | "scoped-spend"
  params: Record<string, unknown>
  network?: "mainnet" | "testnet" | "devnet" | "localnet"  // default: testnet
  walletState?: 1 | 2 | 3 | 4 | 5
}
```

**txKind params:**

| txKind | Required params |
|--------|----------------|
| `transfer` | `to: string`, `amount: number` (MIST) |
| `move-call` | `target: string` (pkg::mod::fn), `args: unknown[]`, `typeArgs?: string[]` |
| `scoped-spend` | `walletId: string`, `to: string`, `amountMist: number` |

### Response

```typescript
{ txBytes: number[], expiresAt: number }
// expiresAt = currentEpoch + 1
```

### State-1 cap

When `walletState === 1`, the server checks whether the cumulative balance
would exceed $25 USD after this transaction:

1. Fetch `sender` balance from Sui RPC (`getBalance`)
2. Fetch SUI/USD price from the consensus oracle (`getConsensusSuiPrice`)
3. `mistToUsd(currentBalance + txAmount) > STATE1_CAP_USD (25)` → reject

If the oracle or RPC is unavailable the check is skipped and the transaction
is allowed. The client self-reports `walletState`; the cap is advisory
(worst case: client lies and raises its own cap).

Error response on cap exceeded:
```json
{ "error": "state1-cap-exceeded", "currentUsd": 0, "txUsd": 0, "capUsd": 25 }
```
HTTP 400.

### AML screening

`screenAddress(sender)` is called for all build requests (imported from `@/lib/aml`).
If the address is blocked the request is rejected before building the PTB.

### Error codes

| Status | code | Meaning |
|--------|------|---------|
| 400 | — | Missing `sender`, missing `txKind`, unknown txKind, bad params |
| 400 | `state1-cap-exceeded` | Balance would exceed $25 USD |
| 500 | `sponsor_unavailable` | `SUI_SPONSOR_KEY` not set |
| 503 | `sponsor_unavailable` | Sponsor has no gas coins |
| 503 | `sponsor_unavailable` | `SUI_PACKAGE_ID` not set (scoped-spend only) |
| 500 | `build_failed` | Sui RPC error during build |

---

## POST /api/sponsor/execute

### Request

```typescript
{
  txBytes: number[]    // BCS-serialized TransactionData from /build response
  senderSig: number[]  // 97-byte Sui signature: flag(1) | sig(64) | pubkey(32)
}
```

Both fields are `number[]` because JSON cannot carry `Uint8Array` directly.

### Response

```typescript
{ digest: string, confirmedAt: number }
// confirmedAt = Date.now() at submission time
```

### Signature order

Sui's sponsored-transaction protocol requires `[senderSig, sponsorSig]`.
The route:
1. Loads `SUI_SPONSOR_KEY` and calls `keypair.signTransaction(txBytesU8)`
2. Base64-encodes both signatures
3. Calls `client.executeTransactionBlock({ transactionBlock, signature: [senderB64, sponsorB64] })`

### Error codes

| Status | Meaning |
|--------|---------|
| 400 | Missing or empty `txBytes` / `senderSig`, or sponsor signing failed |
| 500 | `SUI_SPONSOR_KEY` not configured |
| 502 | Sui RPC rejected the transaction |

---

## SUI_SPONSOR_KEY format

Accepts either:
- Base64-encoded 32-byte Ed25519 seed (preferred)
- Base64-encoded 64-byte keypair
- Bech32 private key string starting with `suiprivkey` (build.ts only)

Generate a new seed:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Set as a Cloudflare Worker secret (never in `.env` for production).
