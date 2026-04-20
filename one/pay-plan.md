# pay-plan.md — C2 DECIDE: Locked Plan

W2 output. All seven sections locked. C3 Sonnet agents execute from this.

---

## 1. Chosen components — Stripe card set

**Canonical tree: `ecommerce/` in `../ONE/web/src`** (not `shop/` — identical files, pick one, drop the other).

Port these 4 files:
- `ecommerce/payment/StripeProvider.tsx` → `src/components/pay/card/StripeProvider.tsx`
- `ecommerce/interactive/StripeCheckoutForm.tsx` → `src/components/pay/card/StripeCheckoutForm.tsx`
- `ecommerce/interactive/StripeCheckoutWrapper.tsx` → `src/components/pay/card/StripeCheckoutWrapper.tsx`
- `ecommerce/interactive/OneClickPayments.tsx` → `src/components/pay/card/OneClickPayments.tsx` (if exists; skip if not)

Skip: `PaymentForm.tsx` (billing-address heavy; agents don't ship addresses). Skip `shop/` tree entirely.

Port conversational checkout (7 files, rename `BuyInChatGPT*` → `BuyInChat*`):
- `shop/buy-in-chatgpt/BuyInChatGPT.tsx` → `src/components/pay/chat/BuyInChat.tsx`
- `shop/buy-in-chatgpt/BuyInChatGPTEnhanced.tsx` → `src/components/pay/chat/BuyInChatEnhanced.tsx`
- `shop/buy-in-chatgpt/AddressForm.tsx` → `src/components/pay/chat/AddressForm.tsx`
- `shop/buy-in-chatgpt/PaymentProcessor.tsx` → `src/components/pay/chat/PaymentProcessor.tsx`
- `shop/buy-in-chatgpt/PurchaseIntent.tsx` → `src/components/pay/chat/PurchaseIntent.tsx`
- `shop/buy-in-chatgpt/OrderSummary.tsx` → `src/components/pay/chat/OrderSummary.tsx`
- `shop/buy-in-chatgpt/OrderConfirmation.tsx` → `src/components/pay/chat/OrderConfirmation.tsx`
- `shop/buy-in-chatgpt/ShippingOptions.tsx` → `src/components/pay/chat/ShippingOptions.tsx`

---

## 2. Chosen crypto set

Port these 2 files (accept/receive tools only — sender tools already in `/u/`):
- `ontology-ui/crypto/payments/ReceivePayment.tsx` → `src/components/pay/crypto/CryptoAcceptAddress.tsx`
- `ontology-ui/crypto/payments/PaymentLink.tsx` → `src/components/pay/crypto/CryptoPaymentLink.tsx`

Skip: `SendToken.tsx`, `SendNative.tsx`, `BatchSend.tsx`, `RecurringPayment.tsx`, `GasEstimator.tsx` — sender tools, not accept tools. `/u/SendSheet.tsx` already owns the sender side.

Wire `CryptoAcceptAddress` to `PayService.createShortlink()` (not direct on-chain) — this is the pay.one.ie shortlink rail.

---

## 3. Target layout — final (matches pay.md with recon refinements)

```
src/
  types/
    stripe.ts                          NEW — port from ../ONE/web/src/types/stripe.ts
    payment.ts                         NEW — rail-agnostic: PaySignal, RailType, PayOutcome
  components/pay/
    card/
      StripeProvider.tsx               PORT from ecommerce/payment/StripeProvider.tsx
      StripeCheckoutForm.tsx           PORT from ecommerce/interactive/StripeCheckoutForm.tsx
      StripeCheckoutWrapper.tsx        PORT from ecommerce/interactive/StripeCheckoutWrapper.tsx
      OneClickPayments.tsx             PORT if exists in ../ONE/web (Apple/Google Pay)
    crypto/
      CryptoAcceptAddress.tsx          PORT from ontology-ui/crypto/payments/ReceivePayment.tsx
      CryptoPaymentLink.tsx            PORT from ontology-ui/crypto/payments/PaymentLink.tsx
    chat/
      BuyInChat.tsx                    PORT from shop/buy-in-chatgpt/BuyInChatGPT.tsx (rename)
      BuyInChatEnhanced.tsx            PORT from shop/buy-in-chatgpt/BuyInChatGPTEnhanced.tsx (rename)
      AddressForm.tsx                  PORT
      PaymentProcessor.tsx             PORT
      PurchaseIntent.tsx               PORT
      OrderSummary.tsx                 PORT
      OrderConfirmation.tsx            PORT
      ShippingOptions.tsx              PORT
  pages/api/pay/
    create-link.ts                     NEW — POST: proxy to PayService.createShortlink + emit substrate:pay
    status/[ref].ts                    NEW — GET: proxy to PayService.getEscrowStatus or Stripe status
    stripe/
      create-intent.ts                 PORT from ../ONE/web/src/pages/api/checkout/create-intent.ts
      confirm.ts                       PORT from ../ONE/web/src/pages/api/checkout/confirm.ts
      webhook.ts                       PORT from ../ONE/web/src/pages/api/webhooks/stripe.ts
                                       (extends existing /api/ingest/stripe.ts — merge, keep pheromone marks)
packages/
  sdk/src/
    pay.ts                             NEW — pay namespace: accept, request, status
  mcp/src/tools/
    commerce.ts                        EDIT — add 3 pay tools to commerceTools() array
```

---

## 4. SDK shape (locked)

File: `packages/sdk/src/pay.ts`

```typescript
export interface PayAcceptOpts {
  skill: string           // skill-id the agent is selling
  price: number           // amount in canonical unit (USD for card, SUI for crypto)
  rail: 'card' | 'crypto' | 'auto'
  memo?: string
}

export interface PayAcceptResult {
  linkUrl: string         // shareable payment URL
  qr?: string             // QR code data URL (crypto only)
  intent?: string         // Stripe PaymentIntent client_secret (card only)
}

export interface PayRequestOpts {
  to: string              // seller uid
  amount: number
  memo?: string
  rail?: 'card' | 'crypto' | 'auto'
}

export interface PayRequestResult {
  linkUrl: string
  status: 'pending' | 'captured' | 'refunded' | 'disputed'
}

export interface PayStatusResult {
  status: 'pending' | 'captured' | 'refunded' | 'disputed'
  ref: string
  amount?: number
  rail?: string
}

// pay.accept({ skill, price, rail }) → POST /api/pay/create-link → { linkUrl, qr?, intent? }
// pay.request({ to, amount, memo }) → POST /api/pay/create-link → { linkUrl, status }
// pay.status(ref)                  → GET  /api/pay/status/{ref} → { status, ref, amount, rail }
```

Wired into `SubstrateClient` as `this.pay = { accept, request, status }`. Telemetry emits `toolkit:sdk:pay:<method>` on each call.

---

## 5. MCP tool shape (locked)

All three route through `persist.signal()` — ADL gates apply for free (per `adl-mcp.md`).

File: `packages/mcp/src/tools/commerce.ts` — add to `commerceTools()` array:

```typescript
{
  name: "pay_create_link",
  description: "Create a payment link for an agent skill. Returns a shareable URL the buyer opens to pay.",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "seller uid" },
      amount: { type: "number" },
      rail: { type: "string", enum: ["card", "crypto", "auto"] },
      memo: { type: "string" },
      sku: { type: "string", description: "skill-id" },
    },
    required: ["to", "amount"],
  },
  handler: async (args, env) =>
    apiCall(env.baseUrl, env.apiKey, "/api/pay/create-link", {
      method: "POST",
      body: JSON.stringify(args),
    }),
},
{
  name: "pay_check_status",
  description: "Check status of a payment by ref (Stripe PI id, Sui digest, or shortlink id).",
  inputSchema: {
    type: "object",
    properties: { ref: { type: "string" } },
    required: ["ref"],
  },
  handler: async (args, env) =>
    apiCall(env.baseUrl, env.apiKey, `/api/pay/status/${args.ref}`),
},
{
  name: "pay_cancel",
  description: "Cancel a pending payment. Only works on uncaptured intents.",
  inputSchema: {
    type: "object",
    properties: { ref: { type: "string" } },
    required: ["ref"],
  },
  handler: async (args, env) =>
    apiCall(env.baseUrl, env.apiKey, `/api/pay/status/${args.ref}`, {
      method: "DELETE",
    }),
},
```

---

## 6. ADL contract (locked)

**Pay skill schemas** (register via `syncAdl()` or inline in create-link.ts):
```typescript
// pay.accept skill
input-schema: JSON.stringify({
  type: "object",
  properties: {
    skill: { type: "string" },
    price: { type: "number", minimum: 0 },
    rail: { type: "string", enum: ["card", "crypto", "auto"] },
    memo: { type: "string" },
  },
  required: ["skill", "price", "rail"],
})
output-schema: JSON.stringify({
  type: "object",
  properties: {
    linkUrl: { type: "string", format: "uri" },
    qr: { type: "string" },
    intent: { type: "string" },
  },
  required: ["linkUrl"],
})

// pay.request skill
input-schema: { to, amount, memo? }
output-schema: { linkUrl, status }
```

**Pay-capable unit requirements:**
- `adl-status`: "active" (deprecated/retired → 410 via PEP-3.5)
- `perm-network.allowed_hosts`: must include "api.stripe.com", "pay.one.ie", "fullnode.sui.io"
- `data-sensitivity`: "confidential" minimum
- All ADL writes MUST call `invalidateAdlCache(uid)`

**Enforcement mode:** `ADL_ENFORCEMENT_MODE=audit` in dev/preview, `enforce` in prod.

**Agent markdown block for pay-capable agents:**
```markdown
adl:
  status: active
  sensitivity: confidential
  network:
    allowed_hosts: ["api.stripe.com", "pay.one.ie", "fullnode.sui.io"]
  tools:
    - name: pay.accept
      input-schema: {...}
      output-schema: {...}
```

---

## 7. Signal contract (locked, non-negotiable)

Emitted AFTER rail confirms (never optimistically):

```typescript
// POST /api/signal
{
  receiver: "substrate:pay",
  data: {
    weight: <amount in canonical unit>,        // USD cents for Stripe, SUI for Sui
    tags: ["pay", "card" | "crypto" | "weight", "accept" | "request"],
    content: {
      rail: "card" | "crypto" | "weight",
      from: "<buyer-uid or anon>",
      to: "<seller-uid>",
      ref: "<pi_... | 0x... | sl_...>",        // Stripe PI id, Sui digest, shortlink id
      sku?: "<skill-id>",
      status: "pending" | "captured" | "refunded" | "disputed",
      provider: "stripe" | "pay.one.ie" | "sui-direct"
    }
  }
}
```

Emission points in C3:
1. `/api/pay/create-link.ts` — after shortlink create: `status: "pending"`, `rail: "crypto"` or `"card"`
2. `/api/pay/stripe/webhook.ts` — after `payment_intent.succeeded`: `status: "captured"`, `rail: "card"`
3. `/api/pay/stripe/webhook.ts` — after `charge.refunded`: `status: "refunded"`, `rail: "card"`
4. `/api/pay.ts` — extend existing: add `substrate:pay` emission after Sui mark, `rail: "weight"` or `"crypto"`
5. `/api/capability/hire/settle.ts` — after settlement: `rail: "crypto"`, `status: "captured"`

---

## Diff specs for C3 — per front

### Front 1: card

**New files (port + adapt):**

```
SOURCE:  /Users/toc/Server/ONE/web/src/components/ecommerce/payment/StripeProvider.tsx
TARGET:  src/components/pay/card/StripeProvider.tsx
XFORM:   Add one-line header comment. Replace any ONE/web-internal imports with @/ aliases.
         Add emitClick('ui:pay:stripe-open') before onSuccess callback.

SOURCE:  /Users/toc/Server/ONE/web/src/components/ecommerce/interactive/StripeCheckoutForm.tsx
TARGET:  src/components/pay/card/StripeCheckoutForm.tsx
XFORM:   Same header. Replace internal imports. Add emitClick('ui:pay:card-submit') in submit handler.

SOURCE:  /Users/toc/Server/ONE/web/src/components/ecommerce/interactive/StripeCheckoutWrapper.tsx
TARGET:  src/components/pay/card/StripeCheckoutWrapper.tsx
XFORM:   Same header. Replace internal imports. Wire onSuccess to emit substrate:pay POST (client-side hint only — server webhook is authoritative).

SOURCE:  /Users/toc/Server/ONE/web/src/components/ecommerce/interactive/OneClickPayments.tsx (if exists)
TARGET:  src/components/pay/card/OneClickPayments.tsx
XFORM:   Same header. Add emitClick('ui:pay:one-click').
```

**New file: `src/types/stripe.ts`**
```
SOURCE:  /Users/toc/Server/ONE/web/src/types/stripe.ts
TARGET:  src/types/stripe.ts
XFORM:   Port verbatim. Add header comment.
```

---

### Front 2: crypto

**New files (port + adapt):**

```
SOURCE:  /Users/toc/Server/ONE/web/src/components/ontology-ui/crypto/payments/ReceivePayment.tsx
TARGET:  src/components/pay/crypto/CryptoAcceptAddress.tsx
XFORM:   Rename component export to CryptoAcceptAddress. Replace any direct chain RPC calls
         with PayService.getBalance() + PayService.getPaymentQRUrl(). Add header comment.
         Add emitClick('ui:pay:crypto-show-address').

SOURCE:  /Users/toc/Server/ONE/web/src/components/ontology-ui/crypto/payments/PaymentLink.tsx
TARGET:  src/components/pay/crypto/CryptoPaymentLink.tsx
XFORM:   Rename export. Wire createLink button to call POST /api/pay/create-link instead of
         any ONE/web API. Add header comment. Add emitClick('ui:pay:crypto-link-create').
```

---

### Front 3: api + sdk

**New file: `src/pages/api/pay/create-link.ts`**
```typescript
// POST /api/pay/create-link
// Body: { to, amount, rail, memo?, sku? }
// 1. Validate ADL: check receiver adl-status, perm-network
// 2. Call PayService.createShortlink or PayService.createPaymentLink
// 3. POST /api/signal { receiver:"substrate:pay", data:{weight:amount, tags:[...], content:{...status:"pending"}} }
// 4. Return { linkUrl, qr?, intent? }
```

**New file: `src/pages/api/pay/status/[ref].ts`**
```typescript
// GET /api/pay/status/[ref]
// 1. Detect ref type (pi_ = Stripe, 0x = Sui, sl_ = shortlink)
// 2. Call PayService.getEscrowStatus or Stripe status check
// 3. Return { status, ref, amount, rail }
// DELETE → cancel: call PayService or Stripe cancel
```

**New file: `src/pages/api/pay/stripe/create-intent.ts`**
```
SOURCE:  /Users/toc/Server/ONE/web/src/pages/api/checkout/create-intent.ts
TARGET:  src/pages/api/pay/stripe/create-intent.ts
XFORM:   Replace Stripe secret key env var lookup with envelopes .env convention.
         Remove Shopify/order integration. Keep: server-side total calc, item validation.
         Add header comment.
```

**New file: `src/pages/api/pay/stripe/confirm.ts`**
```
SOURCE:  /Users/toc/Server/ONE/web/src/pages/api/checkout/confirm.ts
TARGET:  src/pages/api/pay/stripe/confirm.ts
XFORM:   Port. Remove order email notification (TODO). Add substrate:pay signal emit on confirm.
```

**New file: `src/pages/api/pay/stripe/webhook.ts`**
```
SOURCE:  /Users/toc/Server/ONE/web/src/pages/api/webhooks/stripe.ts
TARGET:  src/pages/api/pay/stripe/webhook.ts
XFORM:   Port signature verification. On payment_intent.succeeded: emit substrate:pay {status:"captured"}.
         On charge.refunded: emit substrate:pay {status:"refunded"} + warn(edge, 2×weight).
         Merge pheromone logic from existing /api/ingest/stripe.ts.
         REDACT: strip pan/cvc/buyer.email before emission per ADL sensitivity rule.
```

**Edit existing: `src/pages/api/pay.ts`**
```
ANCHOR:  "// after Sui mark" or the return statement at end of handler
ACTION:  Add substrate:pay signal emission after successful Sui mark
NEW:     // emit substrate:pay signal
         await fetch(`${baseUrl}/api/signal`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             receiver: 'substrate:pay',
             data: { weight: amount, tags: ['pay', 'weight', 'accept'],
               content: { rail: 'weight', from, to, ref: `tick-${Date.now()}`, status: 'captured', provider: 'sui-direct' } }
           })
         }).catch(() => {})   // fire-and-forget; mark already written
```

**New file: `packages/sdk/src/pay.ts`**
```typescript
// Three verbs: accept, request, status
// accept → POST /api/pay/create-link
// request → POST /api/pay/create-link (with different tags)
// status → GET /api/pay/status/{ref}
// Each emits toolkit:sdk:pay:<method> telemetry
```

**Edit: `packages/sdk/src/index.ts`**
```
ANCHOR:  "export const SDK_VERSION"
ACTION:  add before
NEW:     export * from "./pay.js";
```

**Edit: `packages/mcp/src/tools/commerce.ts`**
```
ANCHOR:  The closing bracket of the last tool in the commerceTools() return array
ACTION:  Add 3 tools: pay_create_link, pay_check_status, pay_cancel (shapes in Section 5)
```

---

### Front 4: adl

**Edit: `src/engine/adl.ts`**
```
ANCHOR:  End of syncAdl function or after adlFromAgentSpec
ACTION:  Add registerPaySkills() helper that calls syncAdl for pay.accept and pay.request
         skill entities with the JSON Schema input/output schemas from Section 6.
         Called once at boot if skills not already registered.
```

**Edit: `src/pages/api/pay/create-link.ts`** (same file as Front 3)
```
Add PEP-3.5 lifecycle gate: check adl-status of receiver unit before creating link.
Add PEP-3 network gate: verify pay.one.ie in perm-network.allowed_hosts.
Call invalidateAdlCache(uid) after any ADL attribute mutation.
```

**New integration tests:**
```
src/__tests__/integration/pay-adl-lifecycle.test.ts
src/__tests__/integration/pay-adl-network.test.ts
src/__tests__/integration/pay-signal-shape.test.ts
```

---

### Front 5: docs

**Edit: `one/pay.md`**
```
ANCHOR:  "Status: planning."
ACTION:  replace
NEW:     "Status: C3 PORT in progress — pay-plan.md locked."
```

**Edit: `one/buy-and-sell.md`** — update EXECUTE step to reference new /api/pay/create-link endpoint.

**Edit: `src/pages/api/CLAUDE.md`** — add new pay/* endpoints to the API index.

**Edit: `src/components/CLAUDE.md`** — add `src/components/pay/` to component inventory.

**Edit: `packages/sdk/README.md`** — add `sdk.pay.accept()`, `sdk.pay.request()`, `sdk.pay.status()` examples.

**Edit: `packages/mcp/README.md`** — add `pay_create_link`, `pay_check_status`, `pay_cancel` to tool list.

---

## C2 exit checklist

- [x] Canonical Stripe tree chosen: `ecommerce/` (drop `shop/` dupes)
- [x] Crypto set: ReceivePayment + PaymentLink (accept only, skip sender tools)
- [x] Target layout finalized (matches pay.md with recon refinements)
- [x] SDK shape: 3 verbs — accept, request, status
- [x] MCP tools: 3 tools — pay_create_link, pay_check_status, pay_cancel
- [x] ADL contract: 2 skill schemas, perm-network rules, sensitivity=confidential, invalidateAdlCache
- [x] Signal contract: locked — substrate:pay, 5 emission points identified
- [x] Diff specs: per-front, clear sources and transformations
- [x] Rubric: fit=0.85 (decisions solve stated gap), truth=0.90 (no hallucinated attrs)

---

*C2 complete. C3 Sonnet agents execute from this file. Five fronts, one parallel wave.*
