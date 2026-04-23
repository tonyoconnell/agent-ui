---
title: pay.one.ie surface audit — 2026-04
status: binding
emitted: 2026-04-23
emits-decisions: yes
blocks: E.c1-7, E.l, E.q, E.d, E.chat
---

# pay.one.ie surface audit — 2026-04

Binding decisions are marked **DECISION**. Every E.* agent reads this before writing code.

---

## 1. Inventory

### src/pages/pay/

| File | Description |
|------|-------------|
| `index.astro` | Landing showcase page for the pay surface; renders `PayShowcase` client-only; emits `ui:pay:showcase:view` |
| `[skillId].astro` | Generic pay router; redirects to `?rail=card|crypto|chat` subpages; falls back to `PayPage` (Sui dapp-kit) when no rail specified |
| `card/[skillId].astro` | Stripe card checkout page; looks up skill from KV, renders `StripeCheckoutWrapper` |
| `chat/[skillId].astro` | Conversational checkout page; looks up skill from KV, renders `BuyInChatEnhanced` |
| `crypto/[skillId].astro` | Crypto receive page; resolves seller UID → Sui wallet address via `addressFor()`; renders `CryptoAcceptAddress` + `CryptoPaymentLink` |
| `done.astro` | Payment completion receipt page; masks ref string; emits `ui:pay:page:done:view` |

### src/pages/api/pay/

| File | Description |
|------|-------------|
| `create-link.ts` | POST /api/pay/create-link — tri-rail (card/crypto/weight) link creator; ADL lifecycle + network gates; Stripe for card, PayService shortlink for crypto/weight; emits `substrate:pay` |
| `status/[ref].ts` | GET + DELETE — status lookup; routes by ref prefix: `pi_` → Stripe, `0x` → Sui (pending until absorb syncs), `sl_` → PayService escrow |
| `stripe/create-intent.ts` | POST /api/pay/stripe/create-intent — server-side Stripe PaymentIntent creation; server-calculated total (not client-trusted) |
| `stripe/confirm.ts` | POST /api/pay/stripe/confirm — retrieves PI by ID, confirms success, emits `substrate:pay`; redacts pan/cvc/buyer.email per rule 7 |
| `stripe/webhook.ts` | POST /api/pay/stripe/webhook — Stripe webhook handler; signature-verified; maps `payment_intent.succeeded` + `charge.refunded`; calls `mirrorPay` + `getNet().warn` on refund |

### src/components/pay/

| File | Description |
|------|-------------|
| `PayPage.tsx` | Top-level pay island used by `[skillId].astro`; wraps dapp-kit Sui payment flow |
| `PayShowcase.tsx` | Marketing showcase for the pay surface; demo of all rails |
| `card/StripeProvider.tsx` | Stripe `Elements` provider wrapper |
| `card/StripeCheckoutForm.tsx` | Stripe Elements form (card number, expiry, CVC) |
| `card/StripeCheckoutWrapper.tsx` | Orchestrates Stripe PI creation → confirm → success callback |
| `card/StripeElementsShowcase.tsx` | Demo/preview component for the Stripe Elements form |
| `card/OneClickPayments.tsx` | One-click / saved-card payment shortcut component |
| `chat/BuyInChat.tsx` | Conversational checkout — base component |
| `chat/BuyInChatEnhanced.tsx` | Enhanced conversational checkout with full order flow |
| `chat/AddressForm.tsx` | Shipping address collection step |
| `chat/OrderConfirmation.tsx` | Order confirmation step |
| `chat/OrderSummary.tsx` | Cart summary sidebar |
| `chat/PaymentProcessor.tsx` | Payment processing status step |
| `chat/PurchaseIntent.tsx` | Purchase intent capture step |
| `chat/ShippingOptions.tsx` | Shipping method selection step |
| `crypto/CryptoAcceptAddress.tsx` | Receive-address card with QR + copy + share; calls `getPaymentUrl()` from PayService deterministically |
| `crypto/CryptoPaymentLink.tsx` | Payment link creator; best-effort POST to `/api/pay/create-link` for shortlink; falls back to deterministic long URL |

---

## 2. Per-chain derivation — what exists

The directory `src/lib/pay/chains/` does not exist. All seven target files are absent.

| Chain | Target file | Status |
|-------|-------------|--------|
| SUI | `src/lib/pay/chains/sui.ts` | **not found** |
| ETH | `src/lib/pay/chains/eth.ts` | **not found** |
| SOL | `src/lib/pay/chains/sol.ts` | **not found** |
| BTC | `src/lib/pay/chains/btc.ts` | **not found** |
| BASE | `src/lib/pay/chains/base.ts` | **not found** |
| ARB | `src/lib/pay/chains/arb.ts` | **not found** |
| OPT | `src/lib/pay/chains/opt.ts` | **not found** |

**What does exist for SUI:** `src/lib/sui.ts` exports `deriveKeypair(uid)` and `addressFor(uid)` — deterministic Ed25519 derivation from the platform seed. This is the functional equivalent of what E.c1 needs, but it is not in the `src/lib/pay/chains/` namespace and is SUI-only. ETH/SOL/BTC/BASE/ARB/OPT derivation is entirely absent from the codebase.

---

## 3. Payment link — current capability

`create-link.ts` is **SUI-address-only for crypto/weight rail, Stripe-only for card rail**. It is not multi-chain.

Relevant section (lines 202–249):

```typescript
if (rail === 'card') {
  // Card rail: create Stripe payment link via pay.one.ie shortlink
  const result = await PayService.createPaymentLink({
    amount: String(Math.round(amount * 100)), // cents
    currency,
    recipient: to,
    memo: memo || sku || 'payment',
    chain: 'stripe',
  })
  // ...returns { linkUrl: result.data.link, intent: ref }
}

// Crypto or weight rail: create shortlink via pay.one.ie
const payload = JSON.stringify({ to, amount, currency: currency.toUpperCase(), sku, from, rail })
const signature = `sig_${Date.now()}` // TODO: real HMAC in production

const result = await PayService.createShortlink({
  payload,
  signature,
  baseUrl: 'https://pay.one.ie',
})
// ...returns { linkUrl: result.data.shortUrl, qr: ..., intent: ref }
```

The `to` field is a UID string passed through; the chain is determined solely by the `currency` field in the payload JSON. There is no per-chain address derivation inside `create-link.ts`. The crypto branch delegates all chain logic downstream to `PayService.createShortlink` on `pay.one.ie`. The `currency` field in the UI accepts `ETH`, `USDC`, `USDT`, `DAI` — but no corresponding on-chain address derivation occurs server-side.

---

## 4. Agent-wallet entry point

An agent calls:

```typescript
import { addressFor } from '@/lib/sui'
const walletAddress = await addressFor(uid)
```

Defined in `src/lib/sui.ts` lines 98–101:

```typescript
export async function addressFor(uid: string): Promise<string> {
  const kp = await deriveKeypair(uid)
  return kp.getPublicKey().toSuiAddress()
}
```

`deriveKeypair(uid, version = 0)` is defined at line 65 in `src/lib/sui.ts`. It derives a deterministic Ed25519 keypair from `SHA-256(SUI_SEED || uid)` (version 0, default, preserves existing on-chain wallets). The `crypto/[skillId].astro` page uses this directly: `walletAddress = addressFor ? await addressFor(skill.seller) : skill.seller`.

**This is the sole agent-wallet entry point. It is SUI-only.**

---

## 5. Cookie scope decision (BINDING)

`src/lib/auth.ts` configures Better Auth as follows (lines 82–133):

```typescript
return betterAuth({
  ...(publicEnv.BETTER_AUTH_SECRET && { secret: publicEnv.BETTER_AUTH_SECRET }),
  database: typedbAdapter({ ... }),
  baseURL: import.meta.env.PUBLIC_SITE_URL,
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 60 * 24 * 30 },
  },
  trustedOrigins: ['http://localhost:4321', 'http://localhost:3000'],
  plugins: [bearer(), suiWallet({ ... })],
})
```

There is **no `cookie.domain` field set**. Better Auth defaults to the origin of the request. A session created on `one.ie` will have the cookie scoped to `one.ie`, not `.one.ie`. A session created on `pay.one.ie` will have the cookie scoped to `pay.one.ie`. The two subdomains do not share a session cookie today.

**DECISION: Use shared `.one.ie` domain cookie.**

Add `cookie: { domain: '.one.ie' }` to the `betterAuth({})` call in `src/lib/auth.ts`. This is the only change needed to share the session across `one.ie` and `pay.one.ie`. No cross-domain token exchange is required.

The `trustedOrigins` array must also be extended to include `https://pay.one.ie` and `https://one.ie` in production.

Cross-domain session test plan: after the cookie domain change, sign in on `one.ie`, navigate to `pay.one.ie`, call `GET /api/auth/session` — expect the same session object. Test both directions.

---

## 6. E.* agent decisions (BINDING)

| Agent | Decision | Rationale |
|-------|----------|-----------|
| E.c1 (SUI) | **BUILD** | `src/lib/pay/chains/sui.ts` does not exist. `addressFor(uid)` in `src/lib/sui.ts` is the logic to wrap; E.c1 re-exports it under the unified chains namespace and adds tests. |
| E.c2 (ETH) | **BUILD** | `src/lib/pay/chains/eth.ts` does not exist. No ETH derivation anywhere in the codebase. |
| E.c3 (SOL) | **BUILD** | `src/lib/pay/chains/sol.ts` does not exist. No SOL derivation anywhere in the codebase. |
| E.c4 (BTC) | **BUILD** | `src/lib/pay/chains/btc.ts` does not exist. No BTC derivation anywhere in the codebase. |
| E.c5 (BASE) | **BUILD** | `src/lib/pay/chains/base.ts` does not exist. BASE is EVM-compatible; shares derivation logic with ETH but distinct chain ID. |
| E.c6 (ARB) | **BUILD** | `src/lib/pay/chains/arb.ts` does not exist. ARB is EVM-compatible; same position as BASE. |
| E.c7 (OPT) | **BUILD** | `src/lib/pay/chains/opt.ts` does not exist. OPT is EVM-compatible; same position as BASE/ARB. |
| E.l (`create-link.ts`) | **ALIGN** | File exists at 264 lines and is live (tri-rail card/crypto/weight, ADL gates, Stripe working). Do not rewrite. E.l extends the `crypto` branch to call the appropriate `src/lib/pay/chains/<chain>.ts` module based on the `currency` field, and wires in the new wallet signer (C2.3) for the SUI path. The card and weight paths are untouched. The `sig_${Date.now()}` HMAC stub (line 226) must be replaced with a real HMAC before shipping multichain. |

---

*Audit complete. Decisions are binding. E.c1-7 agents spawn after E.0 is merged. E.l spawns after E.c1-7 are merged.*
