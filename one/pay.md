# Pay

**How humans and agents pay on the substrate. Three rails. One signal. Four steps.**

> Every payment is a signal with `data.weight > 0`.
> The rail (Stripe / Sui / off-chain weight) is a transport detail.
> The mark() is the only thing that compounds.

**Status:** C3 PORT in progress (see [pay-todo.md](pay-todo.md), [pay-plan.md](pay-plan.md)). Builds on [buy-and-sell.md](buy-and-sell.md) (mechanics) and
[revenue.md](revenue.md) (pricing). This doc is the *integration plan* — how to
port the rich Stripe + ChatGPT-in-Astro payment UX from `../ONE/web` and
`../ONE/apps/onex402/web` into envelopes, and wire every rail to the same
four-step substrate flow.

---

## The Claim

Envelopes already has the payment *skeleton*. What it lacks is the human-facing
UX and the conversational checkout. The port is surgical:

| What envelopes has (keep) | What `../ONE` has (port) |
|---------------------------|--------------------------|
| `/api/pay` — Sui path-mark payment | Stripe PaymentIntent API (`/checkout/create-intent`) |
| `/api/buy/hire` — capability hire (402 + escrow template) | Stripe webhook w/ signature verify (`/webhooks/stripe`) |
| `/api/escrow/create\|cancel\|release` — Sui escrow lifecycle | Stripe Checkout Sessions (`/checkout_sessions`) |
| `/api/ingest/stripe` — webhook → `mark/warn` pheromone | Stripe Elements UI (`StripeCheckoutForm`, `StripeProvider`) |
| `/api/capability/hire/settle` — capability settle | One-click wallets (`OneClickPayments` — Apple/Google Pay) |
| `DynamicCheckout` (generative-ui) | `buy-in-chatgpt/*` — 7-file conversational checkout |
| Sui Escrow Move contract | `PaymentLink`, `RecurringPayment`, `ReceivePayment` crypto UI |

The substrate contract is unchanged. Every rail collapses to the same
`signal({receiver, data: {weight, content}})` shape; every outcome is one of
the four outcomes; every success writes `path.revenue += weight`.

---

## Three Rails, One Semantic

```
FIAT (Stripe)                CRYPTO (Sui)                  OFF-CHAIN (weight)
──────────────────           ──────────────                ────────────────
Stripe Checkout              send() owned Signal object    mark(edge, weight)
PaymentIntent confirm        consume() releases Balance    path.revenue += weight
webhook → mark/warn          Sui event → absorb to TypeDB  TypeDB writeSilent
~2-10s (3DS, 3rd party)      ~400ms-2.5s (consensus)       ~100ms (typedb only)
USD cents → path.revenue     SUI → path.revenue            weight → path.revenue
```

All three write the same TypeDB attribute: `path.revenue`. All three deposit
pheromone proportional to payment size. All three are valid `mark()` calls.

**Rail selection** happens at the buyer:
- **Humans** default to Stripe (Apple Pay → card → bank transfer fallback chain)
- **Agents** default to Sui (x402 escrow for strangers, direct pay once path hardens)
- **Substrate-native** (agent↔agent on a proven path, no external settlement) uses off-chain weight only

The seller doesn't care which rail — `net.ask()` returns `{result}` regardless.

---

## Source Inventory — What to Port

### From `../ONE/web/src`

**Types (1 file):**
```
src/types/stripe.ts
  → PaymentIntentRequest, PaymentIntentResponse, BillingAddress,
    PaymentConfirmationRequest, OrderConfirmation, OrderItem
```

**API routes (6 files):**
```
src/pages/api/checkout/create-intent.ts       → PaymentIntent creation
src/pages/api/checkout/confirm.ts             → PaymentIntent confirm + mark
src/pages/api/checkout/status/[id].ts         → poll intent status
src/pages/api/checkout_sessions.ts            → Checkout Sessions (hosted)
src/pages/api/checkout_sessions/[id].ts       → Session status
src/pages/api/webhooks/stripe.ts              → webhook w/ sig verify
```

**Components — Stripe Elements (5 files):**
```
src/components/ecommerce/payment/StripeProvider.tsx
src/components/ecommerce/payment/PaymentForm.tsx
src/components/ecommerce/CheckoutFormWrapper.tsx
src/components/ecommerce/interactive/StripeCheckoutForm.tsx
src/components/ecommerce/interactive/StripeCheckoutWrapper.tsx
src/components/ecommerce/interactive/OneClickPayments.tsx   ← Apple/Google Pay
src/components/ecommerce/interactive/DemoPaymentForm.tsx    ← sandbox mode
src/components/ecommerce/static/CheckoutProgress.tsx
```

**Components — Buy-in-ChatGPT (7 files):**
```
src/components/shop/buy-in-chatgpt/BuyInChatGPT.tsx          ← root chat surface
src/components/shop/buy-in-chatgpt/BuyInChatGPTEnhanced.tsx  ← multi-turn variant
src/components/shop/buy-in-chatgpt/PurchaseIntent.tsx        ← intent detection
src/components/shop/buy-in-chatgpt/AddressForm.tsx
src/components/shop/buy-in-chatgpt/ShippingOptions.tsx
src/components/shop/buy-in-chatgpt/OrderSummary.tsx
src/components/shop/buy-in-chatgpt/PaymentProcessor.tsx      ← Stripe Elements embed
src/components/shop/buy-in-chatgpt/OrderConfirmation.tsx
```

**Components — Crypto payments (7 files):**
```
src/components/ontology-ui/crypto/payments/
  PaymentLink.tsx         ← shareable amount+memo link (EVM style)
  RecurringPayment.tsx    ← subscription schedule
  ReceivePayment.tsx      ← QR + address display
  SendNative.tsx / SendToken.tsx
  BatchSend.tsx           ← multi-recipient
  GasEstimator.tsx
  types.ts, README.md, index.ts
```

**Libs (2 files):**
```
src/components/u/lib/PayService.ts                ← effect-based payment orchestration
src/components/u/lib/PaymentStatusTracker.ts      ← polling + webhook status
```

### From `../ONE/apps/onex402`

```
one/events/STRIPE-INTEGRATION.md       ← ops runbook
one/events/STRIPE-SETUP-GUIDE.md       ← keys + webhook setup
one/events/STRIPE-PAYMENT-METHODS-GUIDE.md
```

### What NOT to port

- `src/pages/api/commerce/feed.json.ts` — ONE/web's Shopify-style feed (envelopes uses `/api/export/capabilities`)
- `src/pages/api/stripe/test-spt.ts` — single-purpose test endpoint
- The `src/components/ecommerce/*` parallel tree (same files as `shop/*`; pick one)

---

## Target Layout in Envelopes

Locked from [pay-plan.md](pay-plan.md) section 3 (recon refinements applied):

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

## The Unified Signal Shape

Every payment — Stripe charge, Sui escrow release, off-chain mark — emits the
same signal:

```typescript
// POST /api/signal
{
  receiver: "substrate:pay",                  // or seller unit UID for direct pay
  data: {
    weight: 29.99,                            // amount in canonical unit (USD for Stripe, SUI for Sui)
    tags: ["pay", "stripe" | "sui" | "weight"],
    content: {
      rail: "stripe" | "sui" | "weight",
      from: "buyer-uid",
      to: "seller-uid",
      ref: "pi_1A2B3C..." | "0xsigest..." | "tick-8821",
      sku?: "marketing:copy",                 // capability id, if capability trade
      escrowId?: "0x...",                     // Sui escrow object, if used
      status: "pending" | "captured" | "refunded" | "disputed"
    }
  }
}
```

**Rule:** the signal is emitted *after* the rail confirms (Stripe
`payment_intent.succeeded`, Sui `consume()` event, or off-chain `mark()`
return). No optimistic emissions — pheromone is earned, not estimated.

---

## The Four Steps, Per Rail

Commerce already decomposes to LIST → DISCOVER → EXECUTE → SETTLE
(see [buy-and-sell.md](buy-and-sell.md)). `pay.md` zooms into SETTLE and
shows how each rail implements it.

### Step 4 — SETTLE (Stripe rail)

```
buyer → ChatGPT checkout → PaymentIntent → confirm (3DS if needed)
                                ↓
                         Stripe captures charge
                                ↓
                       webhook: payment_intent.succeeded
                                ↓
              /api/pay/stripe/webhook → /api/ingest/stripe
                                ↓
                mark(buyer→seller, amount/100)      ← cents → dollars
                path.revenue += amount/100
                emit signal(receiver=substrate:pay, weight, rail=stripe)
                                ↓
             if capability trade: /api/capability/hire/settle
                                ↓
                chain: unblock dependents, seller.earnings++
```

**Failure modes (already wired in `/api/ingest/stripe`):**
- `charge.refunded` → `warn(edge, 2× weight)` — buyer unhappy
- `charge.dispute.created` → `warn(edge, 3× weight)` — chargeback
- `payment_intent.payment_failed` → `warn(edge, 0.5)` — dissolved (card rejected)

### Step 4 — SETTLE (Sui rail)

Unchanged — runs through existing `sui.ts:consume()` / `pay()` / Escrow release.
The `/api/pay/sui/escrow` wrapper exists only so the chat surface can call one
URL regardless of rail.

### Step 4 — SETTLE (off-chain rail)

```
agent A → net.ask({receiver: "B:skill", data: {weight: 0.02}}, from="A")
                                ↓
                        B.handler runs → {result}
                                ↓
                     net.mark("A→B:skill", 0.02)
                     path.revenue += 0.02
```

No external rail. Used for agent↔agent on proven paths where both parties have
accumulated enough pheromone that external settlement is unnecessary (the path
itself is the trust anchor).

---

## ChatGPT-in-Astro: Rail-Agnostic Checkout

The 7-file `buy-in-chatgpt/*` bundle becomes the conversational buy surface for
*any* SKU, any rail. The chat embeds `PaymentProcessor` which is a rail
switchboard:

```tsx
// src/components/pay/PaymentProcessor.tsx (NEW)
function PaymentProcessor({ sku, amount, rail }: Props) {
  if (rail === 'stripe')  return <StripeCheckoutForm amount={amount} ... />
  if (rail === 'sui')     return <SuiEscrowForm amount={amount} ... />
  if (rail === 'weight')  return <DirectPayForm amount={amount} ... />   // agent-only
}
```

**Rail picker** (`lib/pay/rail.ts`):
```typescript
pickRail({ buyer, seller, amount, pathStrength }): 'stripe' | 'sui' | 'weight'
  // humans → stripe (default)
  // agents with pathStrength > 10 → weight (trusted, no external settle)
  // agents with pathStrength ≤ 10 → sui + escrow (strangers)
  // cross-world (federated) → sui always (portable reputation)
```

The chat reads page context (SKU title, price, shipping), detects purchase
intent via keywords (`buy`, `purchase`, `hire`, `order`), asks for shipping if
physical, and embeds the correct `PaymentProcessor` inline. Same UX whether
buying a fragrance (Stripe) or hiring a copywriter agent (Sui escrow).

**Intent detection** (already in `BuyInChatGPT.tsx`):
```typescript
const buyKeywords = ['buy', 'purchase', 'hire', 'order', 'cart', 'checkout']
// → setShowPaymentProcessor(true)
```

Extend to emit `ui:chat:intent` signal so the substrate learns which product
descriptions convert best.

---

## Humans vs Agents

| Flow | Human (Stripe) | Agent (Sui / weight) |
|------|----------------|----------------------|
| Discover | `/market` grid + filters | `net.select('skill-tag')` |
| Checkout surface | `/chat-buy?sku=X` (conversational) OR `/pay?to=...&amount=...` | `net.ask({receiver, data: {weight}})` |
| Identity | Better Auth session | API key + pheromone gate |
| Settlement | PaymentIntent → webhook | Escrow release OR direct mark |
| Receipt | `OrderConfirmation.tsx` | `{result}` from `.ask()` |
| Failure | `warn(edge, 0.5)` on `payment_failed` | `dissolved` → `warn(edge, 0.5)` |
| Refund | `warn(edge, 2× weight)` | Escrow cancel → `warn(edge, 0.5)` |

Both emit the same `substrate:pay` signal on success. Both write
`path.revenue`. Both feed `loop.ts:356-361` revenue-aware evolution protection.

---

## ADL + Governance Integration

Payment flows run inside the existing ADL security layer (spec v0.2.0, see
[adl-integration.md](adl-integration.md) and [adl-integration-map.md](adl-integration-map.md)).
The substrate is unchanged. The payment routes reuse the three PEP gates
already enforced on `POST /api/signal`.

### The three ADL gates, applied to every `substrate:pay` signal

```
PEP-3.5  LIFECYCLE   seller.adl-status ∈ {retired, deprecated} ? → 410 Gone
                      seller.sunset-at < now() ?                   → 410 Gone
PEP-3    NETWORK     buyer.perm-network.allowedHosts ⊇ {stripe.com, pay.one.ie, api.sui.io} ? → else 403
PEP-4    SCHEMA      payload validates against skill.input-schema (JSON Schema on pay.accept / pay.request) ?
                      → else 400, warn(edge, 0.5), dissolved outcome
```

Gates run BEFORE the LLM burns a token (the deterministic sandwich's PRE
step). A failure here is a buyer-side circuit breaker — no Stripe call, no
Sui transaction, no pheromone deposit. The signal simply dissolves.

### ADL attributes required for payment-capable units

Every unit that accepts payments carries these ADL attributes (on the `unit`
entity, per `src/schema/world.tql`):

| Attribute            | Required value for pay-capable units |
|----------------------|--------------------------------------|
| `adl-version`        | `"0.2.0"` |
| `adl-uid`            | HTTPS URI, DID, or URN — stable identity across rails |
| `adl-status`         | `"active"` (retired/deprecated blocked at PEP-3.5) |
| `perm-network`       | JSON allowlist MUST include `api.stripe.com`, `pay.one.ie`, `fullnode.sui.io` (or override per rail) |
| `data-sensitivity`   | `"confidential"` minimum — payment metadata is never `public` or `internal` |
| `data-retention-days`| ≥ 90 (chargeback window) — webhooks can arrive late |
| `sunset-at`          | optional datetime; past-sunset blocks new payments but allows settlement of open escrows |

Markdown agents auto-derive these via `adlFromAgentSpec()` in
`src/engine/adl.ts`. Add one block to the agent markdown:

```yaml
# agents/marketing/creative.md
adl:
  status: active
  sensitivity: confidential
  allowedHosts: [api.stripe.com, pay.one.ie]
  skills:
    - name: copy
      input-schema: { type: object, properties: { brief: { type: string } }, required: [brief] }
      output-schema: { type: object, properties: { headline: { type: string } } }
```

### Skill-level I/O schemas (PEP-4)

Payment skills expose JSON Schema on the `skill` entity. The `pay.accept`
and `pay.request` verbs ship with canonical schemas:

```typescript
// packages/sdk/src/pay.ts — registered on skill entity at sync time
pay.accept.input-schema = {
  type: 'object',
  required: ['skill', 'price', 'rail'],
  properties: {
    skill:  { type: 'string', pattern: '^[a-z-]+:[a-z-]+$' },
    price:  { type: 'number', minimum: 0 },
    rail:   { enum: ['card', 'crypto', 'weight', 'auto'] },
    memo?:  { type: 'string', maxLength: 280 }
  }
}
pay.accept.output-schema = {
  type: 'object',
  required: ['linkUrl', 'ref', 'status'],
  properties: {
    linkUrl: { type: 'string', format: 'uri' },
    ref:     { type: 'string' },
    status:  { enum: ['pending', 'captured', 'refunded', 'disputed'] },
    qr?:     { type: 'string' },
    intent?: { type: 'string' }
  }
}
```

The MCP tools `pay_create_link` / `pay_check_status` / `pay_cancel` flow
through `persist.signal()` (per [adl-mcp.md](adl-mcp.md) — the accepted
decision: MCP invocations take the PEP-gated path for free). No separate
tool-level validation needed; PEP-4 already validates arguments against the
skill's `input-schema`.

### Data sensitivity rules

PaymentIntent metadata, Stripe webhook events, and Sui escrow objects all
contain at minimum `confidential` data (see [adl-integration.md § Data Classification](adl-integration.md#data-classification)):

| Field                   | Sensitivity  | Rule |
|-------------------------|--------------|------|
| Buyer name, email       | confidential | Store only on Stripe's side; never in `signal.data` |
| Card number, CVC        | restricted   | Never seen by envelopes; Stripe Elements owns it |
| PaymentIntent `id`      | confidential | `content.ref` only — never log full intent |
| Sui tx digest           | confidential | Same rule as PI id |
| Amount + currency       | internal     | Safe to log; used by `loop.ts` evolution |
| Shipping address        | confidential | Stripe stores; envelopes receives event ref only |

Webhook handlers MUST redact all `confidential` fields before emitting the
`substrate:pay` signal. `signal.data.content.ref` is the only cross-reference;
reconciliation against Stripe/Sui/pay.one.ie happens via `PaymentStatusTracker`,
never by stuffing raw payment objects into TypeDB.

### ADL_ENFORCEMENT_MODE — the kill switch

One env flag gates the whole layer (per [adl-todo.md](adl-todo.md) §
Enforcement mode):

```
ADL_ENFORCEMENT_MODE=audit    # log denials, don't block (dev default)
ADL_ENFORCEMENT_MODE=enforce  # block + warn() the edge     (prod default)
```

Payment routes respect the same flag — if a human in dev trips PEP-3 on a
missing Stripe host, audit mode logs it, enforce mode returns 403. No
separate pay-specific bypass. When recon or ports introduce new hosts,
test in audit first, promote to enforce once clean.

### Cache invalidation contract

Payment routes MUST call `invalidateAdlCache(uid)` after any ADL attribute
write (per [adl-todo.md](adl-todo.md)). Example: a webhook that retires
a seller for too many chargebacks flips `adl-status` and MUST flush the
5-min gate cache or the seller keeps accepting payments for up to 5 minutes
after retirement.

```typescript
// src/pages/api/pay/stripe/webhook.ts
if (event.type === 'charge.dispute.created' && disputesAboveThreshold(uid)) {
  await write(`match $u isa unit, has uid "${uid}"; delete $u has adl-status; insert $u has adl-status "deprecated";`)
  invalidateAdlCache(uid)   // ← mandatory
  warn(`buyer→${uid}`, 3 * weight)
}
```

### Permission model (Role × Pheromone × ADL)

Payment routes inherit the Role × Pheromone model from
[buy-and-sell.md § Governance](buy-and-sell.md#governance-layer), now
triple-gated:

| Route                              | Role    | Pheromone              | ADL gates applied |
|------------------------------------|---------|------------------------|-------------------|
| `POST /api/pay/stripe/create-intent` | agent+ | buyer ∈ membership     | lifecycle, network (stripe.com allowed) |
| `POST /api/pay/stripe/confirm`      | agent+  | own intent only        | lifecycle, schema (PI id shape) |
| `POST /api/pay/stripe/webhook`      | — (sig) | — (Stripe signs)       | — (webhook is auth by sig, ADL gates applied to emitted signal) |
| `POST /api/pay/sui/escrow`          | operator+ for cross-org · agent for own | own paths | lifecycle, network (sui), schema |
| `POST /api/pay` (existing)          | unchanged | unchanged            | lifecycle, network, schema |
| `POST /api/pay/link`                | agent+  | own skill only         | lifecycle, network (pay.one.ie), schema |
| MCP `pay_create_link` etc.          | inherits from calling signal | via `persist.signal()` | all three (for free) |

### Audit trail

Every webhook → `signals` table (event history, dimension 5).
Refunds + disputes promoted to `hypothesis` (confirmed pattern → reflex on
future paths with same seller via L6). ADL denials in enforce mode emit a
`adl:denial:<gate>` signal for the audit sink; count denials per receiver
to auto-deprecate units that repeatedly get blocked.

---

## Wave Plan

### Cycle 1 — Stripe on-ramp (fiat rail)

**W1 — Recon (Haiku)**
- Read `../ONE/web/src/pages/api/webhooks/stripe.ts` + `checkout/create-intent.ts`
- Read envelopes `/api/ingest/stripe.ts` + `/api/pay.ts` + `/api/escrow/create.ts`
- Map overlap: merge webhook → ingest, keep confirm/intent new
- Inventory: 6 API files, 8 components, 2 libs, 1 types

**W2 — Decide (Opus)**
- Lock target layout (above)
- Decide: keep `/api/ingest/stripe` or replace with `/api/pay/stripe/webhook`? → **merge**: rename ingest to webhook, keep the pheromone mapping it already does, add signature verification from ONE/web
- Decide: server-side cart validation → read from `capability` relation (not hardcoded mock)
- Docs to update: `one/buy-and-sell.md` § Step 4 (add Stripe row), `one/revenue.md` § Layer 4 (add Stripe take rate), `src/pages/api/CLAUDE.md` (add `/api/pay/stripe/*`)

**W3 — Edit (Sonnet, parallel)**
- Port `src/types/stripe.ts` (verbatim)
- Port `StripeProvider.tsx`, `StripeCheckoutForm.tsx`, `OneClickPayments.tsx` into `src/components/pay/`
- Port + merge webhook into `src/pages/api/pay/stripe/webhook.ts` (signature verify + existing ingest logic)
- Port `create-intent.ts` + `confirm.ts` → `src/pages/api/pay/stripe/`
- Write `src/lib/pay/stripe.ts` (client singleton + `calculateOrderTotal` that reads from `capability` relation)
- Write `src/lib/pay/rail.ts` (rail picker)
- Write `src/components/pay/PaymentProcessor.tsx` (rail switchboard)
- Update envelopes `.env` template: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PUBLIC_STRIPE_PUBLISHABLE_KEY`

**W4 — Verify (Sonnet)**
- `bun run verify` — biome + tsc + vitest all green
- New tests:
  - `src/__tests__/integration/pay-stripe-webhook.test.ts` — webhook → mark, refund → warn
  - `src/__tests__/integration/pay-rail-picker.test.ts` — picks correct rail per scenario
  - `src/__tests__/integration/pay-unified-signal.test.ts` — all three rails emit identical signal shape
  - `src/__tests__/integration/pay-adl-gates.test.ts` — ADL PEP-3.5/3/4 block pay-capable signals correctly: retired unit → 410 · missing stripe.com in perm-network → 403 · malformed PaymentIntent payload → 400 + dissolved · `invalidateAdlCache` flushes after `adl-status` flip
- Rubric: fit (solves human fiat checkout) · form (no duplication with ingest) · truth (signature verify + ADL gates work) · taste (rail-agnostic signal)
- Gate: rubric ≥ 0.65

### Cycle 2 — Conversational checkout (chat surface)

**W1 — Recon**
- Read all 7 `buy-in-chatgpt/*` files + `PaymentProcessor.tsx`
- Read envelopes chat stack (`DebbyChat`, `/api/buy-in-chatgpt.ts`)
- Read `DynamicCheckout.tsx` (envelopes generative-ui)

**W2 — Decide**
- Choose: port `BuyInChatGPTEnhanced.tsx` (multi-turn) over `BuyInChatGPT.tsx` (simple) — enhanced handles address/shipping/confirmation state machine
- Wire intent detection → emit `ui:chat:intent` signal (substrate learns conversion)
- Page route: `/chat-buy?sku=X&rail=auto` — `rail=auto` invokes `pickRail()`
- Docs: update `src/pages/CLAUDE.md` with new `/chat-buy` + `/pay` routes

**W3 — Edit**
- Port 7 components into `src/components/buy/` (rename `BuyInChatGPT` → `BuyInChat`)
- Wire `PaymentProcessor` to switch between `StripeCheckoutForm` / `SuiEscrowForm` / `DirectPayForm`
- Write `src/pages/chat-buy.astro` + `src/pages/pay.astro`
- Write `src/pages/api/buy/chat.ts` (rail-agnostic orchestrator: receives intent, returns checkout token)

**W4 — Verify**
- Tests:
  - `src/__tests__/integration/buy-chat-human.test.ts` — human buys via Stripe, gets `OrderConfirmation`
  - `src/__tests__/integration/buy-chat-agent.test.ts` — agent buys via Sui escrow, same UX
  - `src/__tests__/integration/buy-chat-intent.test.ts` — intent detection emits `ui:chat:intent` signal
- E2E: dev server up, navigate `/chat-buy?sku=marketing:copy`, complete Stripe test card flow, verify `OrderConfirmation` renders + signal emitted + `path.revenue` increments
- Rubric gate: ≥ 0.65

### Cycle 3 — Recurring + payment links (retention rails)

**W1-W4** — Port `PaymentLink.tsx`, `RecurringPayment.tsx`, `ReceivePayment.tsx`
- `PaymentLink` — Stripe Payment Links API + Sui QR fallback
- `RecurringPayment` — Stripe Subscriptions + scheduled Sui `pay()` via Sui Clock
- `ReceivePayment` — show buyer a QR for Sui address OR Stripe hosted checkout link
- New route: `/pay.astro?to={uid}&amount=X&memo=...&rail=auto`

Emit `substrate:pay:recurring` on subscription renewal. Hypothesize patterns:
high churn sellers auto-warn; high retention sellers auto-mark.

### Cycle 4 — OPTIONAL: Batch + multi-token (scale rail)

`BatchSend.tsx`, `GasEstimator.tsx`, `SendToken.tsx` — only if marketplace
volume warrants. Skipped in initial port.

---

## Exit Criteria (all cycles)

- Human can buy a listed SKU at `/chat-buy?sku=X` via Stripe test card, receive
  confirmation, and see `path.revenue` increment in `/dashboard`
- Agent can hire a capability via existing `/api/buy/hire` flow, receive 402
  challenge, post Sui escrow, and on release see identical `path.revenue`
  increment
- All three rails emit identical `substrate:pay` signal shape
- Webhook refund → `warn(edge, 2× weight)` verified via integration test
- ADL gates enforced on every pay route: retired seller → 410, missing allowedHost → 403, bad payload → 400 + dissolved
- `invalidateAdlCache(uid)` called on every ADL attribute write in pay paths
- `ADL_ENFORCEMENT_MODE=enforce` green in CI (audit mode in dev is acceptable for preview environments)
- All payment skills have `input-schema` + `output-schema` registered on the skill entity
- Rubric ≥ 0.65 all four dimensions
- `bun run verify` green (biome + tsc + vitest)
- Docs updated: `buy-and-sell.md`, `revenue.md`, `adl-integration.md`, `src/pages/api/CLAUDE.md`, `src/pages/CLAUDE.md`

---

## Code Pointers (target, post-port)

| File | Purpose |
|------|---------|
| `src/types/stripe.ts` | PaymentIntent + BillingAddress + OrderConfirmation shapes |
| `src/types/payment.ts` | Unified `PaySignal` type across rails |
| `src/pages/api/pay.ts` | KEEP — direct Sui path-mark (unchanged) |
| `src/pages/api/pay/stripe/create-intent.ts` | Stripe PaymentIntent (server-side cart validation) |
| `src/pages/api/pay/stripe/confirm.ts` | Confirm + mark path |
| `src/pages/api/pay/stripe/webhook.ts` | Signature verify + emit `substrate:pay` (merges ingest/stripe) |
| `src/pages/api/pay/sui/escrow.ts` | Thin wrapper over sui.ts Escrow lifecycle |
| `src/pages/api/buy/chat.ts` | Rail-agnostic chat → checkout orchestrator |
| `src/lib/pay/stripe.ts` | Stripe client + `calculateOrderTotal` (reads `capability`) |
| `src/lib/pay/rail.ts` | `pickRail({buyer, seller, amount, pathStrength})` |
| `src/lib/pay/status.ts` | Payment status tracker (poll + webhook reconciliation) |
| `src/components/pay/PaymentProcessor.tsx` | Rail switchboard (stripe / sui / weight) |
| `src/components/pay/StripeCheckoutForm.tsx` | Stripe Elements UI (Apple/Google Pay) |
| `src/components/pay/PaymentLink.tsx` | Shareable pay link (Stripe Payment Link + Sui QR) |
| `src/components/buy/BuyInChat.tsx` | Conversational checkout root |
| `src/pages/pay.astro` | `/pay?to=...&amount=...&rail=auto` universal pay page |
| `src/pages/chat-buy.astro` | `/chat-buy?sku=...` conversational checkout page |

---

## Anti-Goals (explicitly out of scope)

- **No custom wallet UX.** `ReceivePayment`'s Sui flow delegates to existing
  `sui.ts:addressFor()` — no new keystores.
- **No Shopify-style cart.** The substrate has no `cart` entity. Multiple SKUs
  = multiple signals, each with its own `weight`.
- **No multi-currency conversion.** Each rail settles in its native unit
  (USD for Stripe, SUI for Sui). `path.revenue` is rail-tagged.
- **No subscription dunning logic in envelopes.** Stripe Billing handles
  failed renewals; envelopes only observes the resulting webhooks.
- **No parallel `ecommerce/*` + `shop/*` component trees.** Pick `shop/*` (or
  rename to `pay/*` + `buy/*`); delete the duplicate.

---

## See Also

- [buy-and-sell.md](buy-and-sell.md) — Four-step trade mechanics; `pay.md` zooms into SETTLE
- [revenue.md](revenue.md) — Five revenue layers; Stripe adds Layer 4 take rate on fiat trades
- [ingestion.md](ingestion.md) — Data → pheromone taxonomy; `/api/pay/stripe/webhook` implements Tier 5
- [DSL.md](DSL.md) — `data.weight` convention; all rails respect it
- [routing.md](routing.md) — `loop.ts:356-361` revenue-aware evolution (pay.md feeds the inputs)
- [lifecycle.md](lifecycle.md) — Trade lifecycle stages (OFFER → ESCROW → EXECUTE → VERIFY → SETTLE → RECEIPT → DISPUTE → FADE)
- [SUI.md](SUI.md) — Sui rail mechanics (Escrow, consume, pay, linear types)
- [adl-integration.md](adl-integration.md) — ADL v0.2.0 spec, 16 attributes, parser, PEP gates
- [adl-integration-map.md](adl-integration-map.md) — 8 open gate-enforcement points and their integration seams
- [adl-mcp.md](adl-mcp.md) — MCP tools flow through `persist.signal()` → ADL gates apply for free
- [adl-todo.md](adl-todo.md) — Runtime enforcement TODO (`ADL_ENFORCEMENT_MODE` + `invalidateAdlCache`)
- `src/engine/adl.ts` — Parser, `adlFromAgentSpec()`, `syncAdl()`, `adlFromUnit()`
- `src/pages/api/CLAUDE.md` — API route index (update with `/api/pay/*`)

---

*Three rails. One signal. `mark()` is the only thing that compounds.*
