# Stripe — Passkey-Bound Fiat Rail

**Goal:** the same Touch ID that unlocks the ONE wallet (`passkeys.md`) is the only step a user takes to pay with a card. Apple Pay carries the Apple ID identity (email, name, billing address) into Stripe; Stripe Link reuses that identity for one-tap returning checkout. No password, no manual form.

**Mode:** lean. **Lifecycle:** construction.

> **What Stripe actually exposes (verified 2026-04-25):**
> - **Apple Pay via Express Checkout Element** carries email, name, billing address, shipping address from Apple Wallet into the merchant — this is the "Apple sends ID info to Stripe" bridge. ([Stripe — Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element))
> - **Stripe Link** (consumer checkout) authenticates customers by **email + SMS one-time code**, *not* WebAuthn passkeys. Merchants get the Link Authentication Element which prefills returning Link users' saved cards/addresses after OTP. ([Stripe — Link Authentication Element](https://docs.stripe.com/payments/link/link-authentication-element))
> - **Stripe passkeys** that exist today are for the **Stripe Dashboard** login only — not customer checkout. ([Stripe blog — Passkeys for Dashboard](https://stripe.com/blog/passkeys-a-faster-more-secure-way-to-log-in-to-the-stripe-dashboard))
>
> So "connect passkey with Stripe" in this build = **bind our ONE passkey to a Stripe Customer**, then let Apple Pay (Apple ID → Stripe) and Link (email-OTP, prefilled) carry the identity. The passkey is the *local* gate; Stripe sees a stable `customer_id` keyed off our `human:<slug>` UID.

---

## Goal

```
arrive  → wallet exists (passkeys.md State 1)
Save    → Touch ID, passkey created (State 2)
Buy     → tap "Pay" → Apple Pay sheet → Touch ID
          ↳ Apple Wallet sends email + name + billing to Stripe
          ↳ Stripe creates/links Customer keyed by our human-uid
          ↳ Stripe Link saves card on first success
return  → tap "Pay" → Link recognises email → SMS OTP (or skip if recent device cookie)
          ↳ saved card autofills
```

One identity (`human:<slug>`), three surfaces (passkey, Apple Pay, Link), one address on Sui, one `customer_id` on Stripe.

---

## Speed

- **First buy (cold):** ≤ 8s — Apple Pay sheet (1s) + Touch ID (1s) + 3DS-skip path (Apple Pay = SCA-compliant by default per Stripe docs) + confirm (2s).
- **Returning buy:** ≤ 3s — Link OTP-skipped via session cookie or 1-tap Apple Pay re-auth.
- **Customer create:** one round-trip on first success, never again per UID.

---

## Architecture

### Files (existing, reused)

| File | Role |
|---|---|
| `src/components/u/lib/vault/passkey.ts` | Passkey create/get with PRF — already wraps the seed |
| `src/components/u/lib/vault/vault.ts` | AES-GCM seed envelope |
| `src/components/pay/card/StripeProvider.tsx` | Stripe.js + Elements bootstrap (existing) |
| `src/components/pay/card/StripeCheckoutForm.tsx` | Card payment surface (existing) |
| `src/pages/api/pay/stripe/create-intent.ts` | PaymentIntent creation (existing) |
| `src/pages/api/pay/stripe/confirm.ts` | PI retrieve / status (existing) |
| `src/pages/api/pay/stripe/webhook.ts` | `payment_intent.succeeded` → pheromone mark (existing) |
| `src/lib/human-unit.ts` | `ensureHumanUnit()` — the UID we key Stripe Customer on |

### Files (new)

| File | Role |
|---|---|
| `src/pages/api/pay/stripe/customer.ts` | `POST` → idempotent `getOrCreateCustomer(humanUid, email?)` returns `customer_id` |
| `src/pages/api/pay/stripe/express-intent.ts` | `POST` → PaymentIntent with `automatic_payment_methods`, `customer`, `setup_future_usage: 'off_session'` so the card is saved on the customer for next time |
| `src/pages/api/pay/stripe/setup-intent.ts` | `POST` → SetupIntent with `payment_method_types: ['card', 'link']` for the **no-charge "Save card via Link"** path (per [Stripe — save & reuse with Link](https://docs.stripe.com/payments/link/save-and-reuse)) |
| `src/components/pay/card/ExpressCheckout.tsx` | React island — Express Checkout Element (Apple Pay / Google Pay / Link) |
| `src/components/pay/card/LinkAutofill.tsx` | Link Authentication Element prefilled from passkey-bound email |
| `src/lib/stripe-bind.ts` | `bindStripeCustomer(humanUid, customerId)` — writes `stripe-customer` attribute on the actor in TypeDB |

### Schema delta — `src/schema/one.tql`

```typeql
# Added attribute on actor (additive, no rename)
actor owns stripe-customer @card("0..1");
attribute stripe-customer value string;
```

One Stripe Customer per human. Looked up by `human:<slug>` from `deriveHumanUid`.

### Flow — first-time buy

```
Browser                          ONE Worker                 Stripe
───────                          ──────────                 ──────
1. user clicks "Pay"
2. <ExpressCheckout/> mounts
   ├─ pre-call: getEmail(uid)
   │           ↳ uid from passkey-derived human-uid (nothing leaves device yet)
   │
   ▼
3. POST /api/pay/stripe/express-intent
   { uid, amountMinor, currency }
                                 →  ensureHumanUnit(uid)
                                    customer = getOrCreate(uid, email?)
                                    PI = stripe.paymentIntents.create({
                                      customer,
                                      amount, currency,
                                      automatic_payment_methods: { enabled: true },
                                      setup_future_usage: 'off_session',
                                    })
                                                            →  ← clientSecret + customer
4. expressCheckoutElement.confirm(clientSecret)
   ├─ user picks Apple Pay
   ├─ Touch ID prompt (Safari)              [identity]
   └─ Apple Wallet → Stripe.js
        ↳ token + email + name + billing                      → confirm PI
                                            ←  payment_intent.succeeded webhook
                                 ←  webhook.ts → world.mark('user→stripe', amount)
                                 ←  bindStripeCustomer(uid, customer_id) [if not bound]
5. UI shows ✓
```

### Flow — returning buy (Stripe Link)

```
1. user clicks "Pay"
2. <LinkAutofill/> already prefilled email = humanActor.email
3. user taps Apple Pay (preferred) OR Link card row
   ├─ Apple Pay: same as above, but Stripe sees `customer` already → Link auto-saves nothing new
   └─ Link:    Stripe sends OTP to phone (or skips if device cookie valid),
               saved card fills in, one tap to confirm
4. Touch ID for SCA only if regulator demands (Apple Pay flow already covers SCA per Stripe).
```

The passkey is **not** the Stripe authenticator. The passkey is the local gate that proves "the same human who owns this `human:<slug>` UID is at this device" — that UID is the Stripe Customer key, which is what makes "returning user" recognisable across devices once they've passed State 2 (`passkeys.md`).

---

## How "Apple sends ID info to Stripe" works

When Express Checkout Element renders the Apple Pay button on Safari + an Apple-Pay-eligible device:

1. The merchant declares which fields are required at PI-create time:
   ```ts
   stripe.paymentIntents.create({
     ...,
     payment_method_options: {
       card: { request_three_d_secure: 'automatic' },
     },
     // surfaces in Express Checkout Element via:
     //   billingAddressRequired: true, emailRequired: true, phoneNumberRequired: false
   })
   ```
2. Apple's payment sheet shows the user the *Apple ID account info* (email, name, default shipping), gated by Touch ID / Face ID.
3. On confirm, Apple Pay returns a payment token **plus** the requested identity fields. Stripe.js attaches them to the PaymentIntent and (because `customer` was set + `setup_future_usage: 'off_session'`) saves the resulting PaymentMethod to that Customer for Link reuse.

We never see the raw card. We do see `email`, `name`, `billing_details.address` on the confirmed PI — that's the data we mirror onto the human actor in TypeDB so future surfaces (`/u`, `/chat`, receipts) can prefill.

> **SCA / 3DS:** Apple Pay is SCA-compliant by Stripe's documentation, so most Apple Pay confirmations skip the 3DS challenge entirely. ([Stripe — Apple Pay & SCA](https://support.stripe.com/questions/apple-pay-compliance-with-strong-customer-authentication-(sca)-regulations))

---

## How "login with Link" works for us

Stripe Link is **email + SMS OTP** for the customer; passkeys are not on the customer-facing surface today (Stripe's passkeys are dashboard-side only, confirmed by Stripe support docs and Corbado's analysis as of 2026-04). So in our flow:

1. **Email comes from the passkey-bound human actor** — no input field shown.
2. **Link Authentication Element** is mounted with `defaultValues.email` set; if Stripe knows that email, it shows "Pay with Link" with saved cards behind an OTP gate.
3. **Touch ID** is *our* gate (passkey re-auth before exposing the email or invoking confirm) — Stripe never sees it.

The result reads to the user as "biometric → pay" because our passkey gate is the only friction they see.

---

## Patterns — three ways the passkey can actually authorise a Stripe charge

The baseline above (passkey-bound customer, Apple Pay first-buy, Link prefill) is **identity binding only**. The passkey unlocks the email; Stripe still drives the charge.

Below are the three patterns where the passkey is on the *charge* path, not just the *identity* path. **No decision yet** — laying them out so we can pick after we walk the tradeoffs.

All three assume the baseline (`stripe-customer` attribute, Apple Pay first-buy to put a saved card on file). They diverge on what happens for the *returning* buy.

### Constraint we cannot get around

Stripe will not accept a WebAuthn assertion as customer authentication on Link or in 3DS. Stripe's customer-side passkey product does not exist yet (their passkeys are Dashboard-only). So no pattern below sends a WebAuthn assertion to Stripe expecting Stripe to verify it. We verify locally; Stripe sees the *result* of that verification.

### Pattern A — Server-confirmed off-session, passkey is the trigger

The passkey gates a server-side `paymentIntents.confirm({ off_session: true })` against the saved card. Strongest "passkey auths the payment" claim that's shippable today.

```
returning buy
─────────────
client                         our worker                      stripe
──────                         ──────────                      ──────
"pay $X" ──────────────────►   build challenge bound to
                               (customer_id, pm_id, amount, nonce)
                ◄────────────  challenge
nav.credentials.get()
  ↳ Touch ID
  ↳ assertion ───────────────► verify(assertion, challenge)
                               stripe.paymentIntents.create({
                                 customer, amount,
                                 payment_method: <saved-pm-id>,
                                 off_session: true, confirm: true,
                                 metadata: { passkey_assertion_id }
                               })                ─────────────► charge
                               log assertion + PI id
                ◄────────────  { ok, pi_id }     ◄─────────────  succeeded
```

| What's added | `POST /api/pay/stripe/charge` (server confirms PI), WebAuthn challenge endpoint, assertion log table |
| What it needs | saved PaymentMethod on customer (Apple Pay first-buy or Link OTP-once), passkey already created (`passkeys.md` State 2) |
| User-visible win | One Touch ID. No Apple Pay sheet on returning buys. No Link OTP. Works on Chrome+Android, Firefox+Linux, every WebAuthn surface. |
| What it costs | Server-confirmed off-session charges shift dispute liability to us. If cardholder says "didn't authorise", we pay — the assertion log is our only evidence and Stripe Radar doesn't natively understand it. |
| Replay surface | Challenge MUST be bound to `(customer_id, pm_id, amount, nonce)` server-side. Loose binding = replay at different amounts. |

### Pattern B — Passkey assertion → Stripe Radar custom signal

The passkey doesn't gate anything; it adds a metadata field that Stripe Radar uses to *lower* fraud score on the same PaymentIntent. Cheap, additive, no liability shift.

```
any buy (first or returning)
────────────────────────────
client → passkey-gate locally → POST /api/pay/stripe/.../intent
                                 ↳ stripe.paymentIntents.create({
                                     ...,
                                     metadata: {
                                       passkey_verified: 'true',
                                       passkey_assertion_id: <id>,
                                       passkey_verified_at: <ts>,
                                     }
                                   })
                                                              → Radar rule:
                                                                if :passkey_verified: == 'true'
                                                                  AND :amount: < $500
                                                                → allow (skip 3DS)
                                                                else → standard flow
```

| What's added | metadata fields on every PI, Radar rules in Stripe Dashboard, optional assertion verification on our worker |
| What it needs | passkey created. Saved card optional. |
| User-visible win | Passkey users skip 3DS challenges that non-passkey users hit. Measurable fraud-rate / approval-rate delta. |
| What it costs | Liability stays with the issuer (Stripe Radar exemptions sit inside the existing 3DS framework). Trivial to ship — pure metadata. |
| Replay surface | None worse than baseline — the passkey assertion is advisory only, not load-bearing. |

### Pattern C — One biometric button, two rails (Apple Pay or passkey)

Reframe rather than rebuild. Apple Pay's Touch-ID-on-Apple-Wallet *is* a WebAuthn-equivalent ceremony (SE-bound key, biometric unlock, signed token, network verifies). So we expose **one button** ("Pay with Touch ID") that picks the rail underneath:

```
                    ┌─ Safari + Apple device ──► Apple Pay
"Pay with Touch ID" ┤                            (Apple → Stripe, network token)
                    │
                    └─ Anywhere else ──► passkey + Pattern A or B
                                         (us → Stripe, saved-card customer)
```

| Context | Rail | SCA carrier |
|---|---|---|
| Safari + Apple Pay-eligible device | Apple Pay (Express Checkout Element button) | Apple Pay = Stripe-recognised SCA |
| Chrome + Android, Firefox + Linux, etc. | Passkey + saved card on Customer | Pattern A (off-session) or Pattern B (Radar metadata) |

| What's added | a small picker hook (`useBiometricRail()`) that returns `'apple-pay' | 'passkey'`, single shadcn `<BiometricPayButton/>` |
| What it needs | whichever of A/B we adopted for the non-Apple case |
| User-visible win | One word in copy: "Touch ID". Cross-platform parity. No "what's a passkey?" vs "what's Apple Pay?" question. |
| What it costs | Marketing alignment, not engineering — engineering still needs A or B underneath for the non-Apple path. |
| Replay surface | Inherits from underlying rail. |

### Side-by-side

| Axis | Baseline | Pattern A | Pattern B | Pattern C (over A or B) |
|---|---|---|---|---|
| Passkey gates payment? | no (identity only) | **yes** | weakly (metadata) | yes for non-Apple, Apple Pay for Apple |
| Card stored on customer? | yes (after Apple Pay) | yes (required) | optional | yes |
| Returning-buy friction | Link OTP or Apple Pay sheet | one Touch ID | one Touch ID | one Touch ID |
| 3DS behaviour | Stripe default | usually skipped (off-session) | skipped via Radar rule | per rail |
| Liability for dispute | issuer | **merchant** (off-session) | issuer | per rail |
| Engineering surface | small | medium (challenge + verify + log) | tiny (metadata only) | small (router on top of A/B) |
| Cross-platform | yes | **yes** (any WebAuthn surface) | yes | yes |
| Honest "passkey-auth" claim | weak | **strong** | weak | strong on non-Apple |
| Time to ship | shipped | ~3 cycles | ~1 cycle | ~0.5 cycle on top |

### Combinations worth noting

- **A + B** — server-confirmed off-session AND metadata so Radar agrees with us. Strongest claim, lowest friction, dispute liability still on us. Two cycles of work.
- **B alone** — fastest measurable win. Doesn't change any flow, just adds metadata + Radar rule. Cheapest learning.
- **C over B** — biometric branding without taking on dispute liability. Apple Pay does the heavy lifting on Apple; passkey is a Radar signal everywhere else.
- **C over A** — biometric branding plus full passkey-gated charging cross-platform. Highest cost, highest claim.

### Open questions before deciding

1. Are we comfortable taking dispute liability for non-Apple passkey users? (A and "C over A".)
2. Do we have enough volume for Stripe Radar custom rules to be measurable? (Affects whether B is worth shipping alone.)
3. Is the headline "passkey is your payment credential" load-bearing for the product story? If yes, A or "C over A" is the only honest path.
4. Do we want the passkey assertion log to live in TypeDB (queryable, fades, becomes pheromone) or D1 (cheaper, tabular)? Decision affects A's evidence trail.

---

## Verified code references

Every snippet below is copied from the listed source — reproduce, don't reinvent.

### 1. Idempotent customer bind — adapted from [t3dotgg/stripe-recommendations](https://github.com/t3dotgg/stripe-recommendations)

t3dotgg's pattern uses Redis KV. We swap KV for TypeDB attribute lookup — TypeDB is our KV, and the binding lives next to the rest of the actor's identity (governance, wallet, email).

```ts
// src/lib/stripe-bind.ts
import Stripe from 'stripe'
import { readParsed, writeSilent } from '@/lib/typedb'

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' })

export async function getOrCreateCustomer(uid: string, email?: string): Promise<string> {
  // 1. TypeDB lookup (our KV)
  const rows = await readParsed(`
    match $a isa actor, has uid "${uid}", has stripe-customer $sc;
    select $sc;
  `).catch(() => [])
  const existing = rows[0]?.sc as string | undefined
  if (existing) return existing

  // 2. Fallback — search Stripe by metadata (covers backfill / drift)
  const search = await stripe.customers.search({
    query: `metadata['uid']:'${uid}'`,
    limit: 1,
  })
  if (search.data[0]) {
    await bindStripeCustomer(uid, search.data[0].id)
    return search.data[0].id
  }

  // 3. Create
  const customer = await stripe.customers.create(
    { email, metadata: { uid } },
    { idempotencyKey: `customer:${uid}` }, // belt-and-braces: same uid → same customer even on retry
  )
  await bindStripeCustomer(uid, customer.id)
  return customer.id
}

export async function bindStripeCustomer(uid: string, customerId: string): Promise<void> {
  await writeSilent(`
    match $a isa actor, has uid "${uid}";
    insert $a has stripe-customer "${customerId}";
  `)
}
```

### 2. Express Checkout Element — verified from [Stripe — Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment)

```tsx
// src/components/pay/card/ExpressCheckout.tsx (React 19 island, client:load)
import { ExpressCheckoutElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface Props { uid: string; amountMinor: number; currency: string }

export function ExpressCheckout({ uid, amountMinor, currency }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)

  const onConfirm = async () => {
    if (!stripe || !elements) return
    emitClick('ui:pay:apple-pay', { amount: amountMinor, currency })

    const { error: submitError } = await elements.submit()
    if (submitError) return setError(submitError.message ?? 'submit failed')

    const res = await fetch('/api/pay/stripe/express-intent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, amountMinor, currency }),
    })
    const { clientSecret } = await res.json()

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: `${location.origin}/buy/done` },
    })
    if (confirmError) setError(confirmError.message ?? 'confirm failed')
  }

  return (
    <>
      <ExpressCheckoutElement
        options={{
          emailRequired: true,
          billingAddressRequired: true, // Apple Wallet → Stripe identity bridge
          phoneNumberRequired: false,
        }}
        onConfirm={onConfirm}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </>
  )
}
```

`emailRequired` + `billingAddressRequired` are what make Apple Pay surface the Apple ID identity (email, name, billing address) on the wallet sheet and forward them to Stripe on confirm.

### 3. Link Authentication Element with prefill — verified from [Stripe — Add Link to your Elements integration](https://docs.stripe.com/payments/link/add-link-elements-integration)

```tsx
// src/components/pay/card/LinkAutofill.tsx
import { LinkAuthenticationElement, PaymentElement } from '@stripe/react-stripe-js'
import { useState } from 'react'

interface Props { defaultEmail?: string }

export function LinkAutofill({ defaultEmail = '' }: Props) {
  const [email, setEmail] = useState(defaultEmail)

  return (
    <>
      <LinkAuthenticationElement
        options={{ defaultValues: { email: defaultEmail } }}
        onChange={(e) => setEmail(e.value.email)}
      />
      <PaymentElement
        options={{
          defaultValues: {
            billingDetails: { email },
          },
        }}
      />
    </>
  )
}
```

`defaultEmail` comes from `humanActor.email` — set after the passkey gate has unlocked the human-uid. Stripe Link recognises returning emails and surfaces saved cards behind a phone OTP (or skips OTP when the device is recognised).

### 4. Save-card-without-charge (SetupIntent + Link) — verified from [Stripe — save and reuse with Link](https://docs.stripe.com/payments/link/save-and-reuse)

For a "save card now, charge later" flow (e.g. agent autopay setup), use a SetupIntent — *not* `setup_future_usage`:

```ts
// src/pages/api/pay/stripe/setup-intent.ts
const setupIntent = await stripe.setupIntents.create({
  customer,
  payment_method_types: ['card', 'link'],
})
return Response.json({ clientSecret: setupIntent.client_secret })
```

```tsx
// confirm path — client side
const { error } = await stripe.confirmSetup({
  elements,
  confirmParams: { return_url: `${location.origin}/u/cards` },
})
```

For the **buy-and-save-in-one-step** path (the common case), `setup_future_usage: 'off_session'` on the PaymentIntent is the right knob — it charges *and* saves the resulting PaymentMethod to the customer.

---

## Tasks

1. **schema** — add `stripe-customer` attribute to `actor` in `src/schema/one.tql`; bump migration; tests in `src/__tests__/integration/schema.test.ts`.
2. **bind** — `src/lib/stripe-bind.ts` with `bindStripeCustomer(uid, customerId)` + `getStripeCustomer(uid)`; uses `readParsed` / `writeSilent` (no mocks, real TypeDB or skip).
3. **customer route** — `POST /api/pay/stripe/customer` → `getOrCreateCustomer(uid)`. Idempotent on uid (lookup attribute first, fall through to `stripe.customers.create({ metadata: { uid } })`).
4. **express-intent route** — `POST /api/pay/stripe/express-intent`. PI with `customer`, `automatic_payment_methods.enabled`, `setup_future_usage: 'off_session'`.
5. **ExpressCheckout component** — Express Checkout Element wired to step 4, declaring `emailRequired`, `billingAddressRequired`. On success, mirrors `email/name/address` to the human actor.
6. **LinkAutofill component** — Link Authentication Element with `defaultValues.email = humanActor.email`. Mounted above ExpressCheckout for the password-pay surface (`/buy`, `/u/buy`).
7. **webhook extension** — extend `src/pages/api/pay/stripe/webhook.ts` `payment_intent.succeeded` to call `bindStripeCustomer(uid, pi.customer)` + write `email/name/address` attributes on actor.
8. **passkey gate** — `<ExpressCheckout/>` calls `vault.unlock()` (Touch ID) before `elements.confirm()` so the seed is loaded for the parallel SUI side too. No new passkey code — reuse `src/components/u/lib/vault/passkey.ts`.

---

## Verify

- `bun run verify` — biome + tsc + vitest green.
- `customer.ts` integration test: same uid called twice → same customer_id. Real Stripe test mode key, `STRIPE_SECRET_KEY` in `.env` (test). No `vi.mock` on Stripe.
- Manual: in Safari with Apple Pay configured, visit `/buy` → tap Apple Pay → Touch ID → PI succeeds → reload → Link Authentication Element shows the email pre-filled and lists the saved card.
- Webhook: trigger `stripe trigger payment_intent.succeeded` → confirm `stripe-customer` attribute appears on the human actor in TypeDB.
- Receipts: deploy time, PI confirm time, Link autofill time → `/api/signal { receiver: 'pay:stripe:confirmed', tags: ['stripe', 'apple-pay' | 'link', 'first' | 'returning'], weight: amountMinor }`.

---

## Close

When the cycle ships, mark:

- `pay:stripe:bound` — pheromone on `human → stripe-customer` (proves identity bridge held).
- `pay:stripe:confirmed` — pheromone on `human → provider` (the actual buy).
- `pay:stripe:link-returning` — pheromone on `human → link` when a returning user skips the form.

Highways here surface in `/see highways`. If `link-returning / confirmed` ratio rises, the Link bind is working. If Apple Pay rate drops on a non-Safari surface, Express Checkout fallback (Google Pay / Card) is doing its job.

---

## Threat model row

| Defends | Accepts |
|---|---|
| Card data leaving our origin (PCI scope) — handled entirely by Stripe.js + Apple Pay token | Stripe is a vendor on the hot path for fiat — by definition |
| Email phishing on the OTP — Apple Pay path skips OTP, Link path uses Stripe-hosted OTP UI | A malicious browser extension could read email pre-fill (same risk as any web app) |
| Account takeover via stolen email — passkey gate on our origin must pass *before* email is disclosed to Stripe | A user who never reaches State 2 (`passkeys.md`) has no biometric gate; State 1 wallets pay only up to the State 1 cap (`wallet.md`) |
| Cross-merchant tracking — we never share the `human:<slug>` UID off-platform; Stripe sees only `customer_id` + email | Stripe internally links the email across merchants who use Link (their value prop) |

---

## See also

### Plans (this repo)

- `passkeys.md` — the wallet-side identity that owns `human:<slug>`
- `wallet.md` — State 1 spending caps that bound pre-Save risk
- `simple.md` — the user-visible promise this stitches into

### Code (this repo)

- `src/pages/api/pay/stripe/` — existing Stripe routes (`create-intent.ts`, `confirm.ts`, `webhook.ts`) this builds on
- `src/components/pay/card/StripeProvider.tsx` — Elements provider already wired
- `src/lib/human-unit.ts` — `ensureHumanUnit()` produces the `human:<slug>` we key Stripe Customer on

### Stripe references (verified 2026-04-26)

- [Express Checkout Element — accept a payment](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment) — onConfirm signature, emailRequired / billingAddressRequired options
- [Express Checkout Element — overview](https://docs.stripe.com/elements/express-checkout-element)
- [Apple Pay](https://docs.stripe.com/apple-pay) — wallet identity field forwarding
- [Apple Pay SCA compliance](https://support.stripe.com/questions/apple-pay-compliance-with-strong-customer-authentication-(sca)-regulations) — why most Apple Pay flows skip 3DS
- [Link Authentication Element](https://docs.stripe.com/payments/link/link-authentication-element) — defaultValues.email, OTP semantics
- [Add Link to your Elements integration](https://docs.stripe.com/payments/link/add-link-elements-integration) — LinkAuth above PaymentElement, billing-details handoff
- [Save and reuse with Link (SetupIntent)](https://docs.stripe.com/payments/link/save-and-reuse) — no-charge save-card path
- [Stripe Dashboard passkeys (blog)](https://stripe.com/blog/passkeys-a-faster-more-secure-way-to-log-in-to-the-stripe-dashboard) — proof that Stripe passkeys are dashboard-only today

### GitHub references (verified 2026-04-26)

- [stripe/react-stripe-js](https://github.com/stripe/react-stripe-js) — official `<ExpressCheckoutElement/>` and `<LinkAuthenticationElement/>` source
- [stripe/stripe-node](https://github.com/stripe/stripe-node) — `Stripe.CustomerCreateParams`, `customers.search` query syntax for metadata lookup
- [t3dotgg/stripe-recommendations](https://github.com/t3dotgg/stripe-recommendations) — the KV-first idempotent customer-bind pattern we adapted to TypeDB
- [oblique-security/webauthn-prf-demo](https://github.com/oblique-security/webauthn-prf-demo) — reference for the PRF-derived AES key shape we already use in `src/components/u/lib/vault/passkey.ts`

### Industry analysis

- [Corbado — Stripe's redirect-based passkey approach](https://www.corbado.com/blog/payment-provider-passkeys-third-party-sdk/stripe-passkeys-approach-redirect) — third-party confirmation that Link does not yet expose customer-side passkey auth
- [Corbado — Which payment providers offer passkeys](https://www.corbado.com/faq/payment-passkeys) — landscape: only Shop Pay (Shopify) ships customer-side WebAuthn checkout in 2026
