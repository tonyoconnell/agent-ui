# Multi-Chain Payment Links — pay.one.ie

`pay.one.ie` accepts payments on seven chains. Every receive address is derived
deterministically from the recipient's uid and the platform `SUI_SEED`. No new
secrets are introduced.

---

## Address Derivation

All derivations share one secret: `SUI_SEED` (base64, 32 bytes).

### Shared derivation helper (`src/lib/pay/chains/_derive.ts`)

For non-SUI chains, the helper produces a per-chain, per-uid 32-byte secret:

```
chainKey = HKDF-SHA256(IKM=seed, salt=none, info=chainTag, length=32)
secret   = SHA-256(chainKey || uid)
```

HKDF isolates chains from each other; the uid mix-in isolates accounts.

### Per-chain details

| Chain | File | Algorithm | Address format |
|-------|------|-----------|----------------|
| SUI | `chains/sui.ts` | `SHA-256(seed \|\| uid)` → Ed25519 keypair | `0x…` (Sui bech32) |
| ETH | `chains/eth.ts` | `deriveSecret('eth', uid)` → secp256k1 → keccak256(pubkey[1:])[12:] | EIP-55 `0x…` |
| SOL | `chains/sol.ts` | `deriveSecret('sol', uid)` → Ed25519 pubkey | base58 |
| BTC | `chains/btc.ts` | `deriveSecret('btc', uid)` → secp256k1 → hash160(compressed-pubkey) | bech32 `bc1q…` |
| BASE | `chains/chain-base.ts` | `deriveSecret('base', uid)` → secp256k1 → keccak256 | EIP-55 `0x…` (chainId 8453) |
| ARB | `chains/chain-arb.ts` | `deriveSecret('arb', uid)` → secp256k1 → keccak256 | EIP-55 `0x…` (chainId 42161) |
| OPT | `chains/chain-opt.ts` | `deriveSecret('opt', uid)` → secp256k1 → keccak256 | EIP-55 `0x…` (chainId 10) |

SUI uses the same derivation as `src/lib/sui.ts:addressFor(uid)` — the two are
always equal.

EVM chains (ETH, BASE, ARB, OPT) produce the same address shape but different
values — chain isolation is guaranteed by the HKDF `info` tag.

---

## Payment URI Formats

| Chain | URI format | Amount unit |
|-------|-----------|-------------|
| SUI | `sui:<address>?amount=<mist>` | 1e9 mist = 1 SUI |
| ETH | `ethereum:<address>?value=<wei>` | EIP-681 |
| SOL | `solana:<address>?amount=<lamports>` | Solana Pay |
| BTC | `bitcoin:<address>?amount=<btc_decimal>` | BIP-21 |
| BASE | `eip681:<address>@8453?value=<wei>` | EIP-681 with chainId |
| ARB | `eip681:<address>@42161?value=<wei>` | EIP-681 with chainId |
| OPT | `eip681:<address>@10?value=<wei>` | EIP-681 with chainId |

---

## Link Generation — `POST /api/pay/create-link`

Source: `src/pages/api/pay/create-link.ts`

### Request shape

```typescript
{
  to: string        // recipient uid
  rail: "card" | "crypto" | "weight"
  amount: number    // in the denomination of rail
  chain?: string    // "sui"|"eth"|"sol"|"btc"|"base"|"arb"|"opt" (default "sui")
  sku?: string
  from?: string
  currency?: string
  memo?: string
}
```

### How crypto links are generated

1. ADL lifecycle gate — checks `adl-status` and `sunset-at` on the recipient unit in TypeDB.
2. ADL network gate — verifies `pay.one.ie` is in the unit's `perm-network.allowed_hosts`.
3. `deriveAddressForChain(to, chain)` — dispatches to the correct chain module.
4. `buildPaymentUri(address, amount, chain)` — builds the wallet-standard URI.
5. `PayService.createShortlink({ payload, signature, baseUrl: 'https://pay.one.ie' })` — wraps the URI as a short link.

### Response

```typescript
{
  linkUrl: string       // https://pay.one.ie/<code>
  qr: string            // https://pay.one.ie/qr?code=<code>
  intent: string        // "sl_<code>" — ref for status polling
  address: string       // derived receive address (crypto only)
  chain: string         // normalised chain name
  paymentUri: string    // full wallet URI (crypto only)
}
```

After link creation, a `substrate:pay` signal is emitted with `status: "pending"`.

### Card rail (Stripe — untouched)

When `rail: "card"`, the request is forwarded to `PayService.createPaymentLink`
with a Stripe-chain marker. Address derivation is skipped entirely. Returns
`{ linkUrl, intent }` only — no `address`, no `paymentUri`.

---

## Signal on every link

Every link creation — success or failure — emits to `receiver: "substrate:pay"`:

```typescript
{
  weight: amount,
  tags: ["pay", "crypto" | "card" | "weight", "accept"],
  content: { rail, from, to, ref, sku, status, provider }
}
```

Status values: `"pending"` (success), `"failed"` (error), `"adl:denial:lifecycle"` / `"adl:denial:network"` (ADL audit mode).

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `SUI_SEED` | 32-byte base64 platform seed — required for all chain derivations |
| `PAY_ONE_API_KEY` | Authenticates calls to `pay.one.ie` shortlink API |

---

## Source files

| File | Purpose |
|------|---------|
| `src/lib/pay/chains/_derive.ts` | HKDF + SHA-256 helper |
| `src/lib/pay/chains/sui.ts` | SUI derivation + URI |
| `src/lib/pay/chains/eth.ts` | ETH derivation + URI |
| `src/lib/pay/chains/sol.ts` | SOL derivation + URI |
| `src/lib/pay/chains/btc.ts` | BTC derivation + URI |
| `src/lib/pay/chains/chain-base.ts` | BASE derivation + URI |
| `src/lib/pay/chains/chain-arb.ts` | ARB derivation + URI |
| `src/lib/pay/chains/chain-opt.ts` | OPT derivation + URI |
| `src/lib/pay/chains/index.ts` | Dispatcher (`deriveAddressForChain`, `buildPaymentUri`) |
| `src/pages/api/pay/create-link.ts` | Link generation endpoint |
| `audits/2026-04-pay-surface.md` | Binding audit decisions (chain files were absent pre-build) |
