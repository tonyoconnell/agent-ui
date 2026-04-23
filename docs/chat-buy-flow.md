# Chat Buy Flow

Source: `src/components/chat/PreSignCard.tsx`, `src/components/chat/arcs/builder.ts`,
`src/components/chat/arcs/ListingCardComponent.tsx`, `src/schema/rich-message/pre-sign-card.ts`.

---

## Overview

A buy intent in chat becomes a Sui transaction through four stages:

```
User intent → ListingCard → PreSignCard → Touch ID → Confirmation
```

---

## Stage 1: Intent Detection

The user expresses a buy intent in natural language:

> "I want to hire a copywriting agent" or "buy the crypto analysis skill"

The chat LLM (or a marketplace tool) resolves this to a skill and emits a `listing-card` rich message via the SSE stream. The `ListingCardComponent` renders with a Buy button.

**Trigger for PreSignCard.** Clicking Buy in the `ListingCardComponent` emits `ui:chat:listing-buy` and navigates to `/pay/[skillId]`. Within a chat session, the payment flow can stay in-stream: the API backend assembles the transaction, calculates the MIST amount from `capability.price`, and emits a `pre-sign-card` chunk back into the same SSE stream.

---

## Stage 2: PreSignCard

The `PreSignCard` component (`src/components/chat/PreSignCard.tsx`) blocks the conversation until the user explicitly confirms or cancels.

Props:

```typescript
interface PreSignCardProps {
  payload: PreSignCard    // validated by PreSignCardSchema.parse()
  onSign: () => Promise<void>
  onReject: () => void
}
```

The card shows:
- `txSummary` — plain-English description of what will be signed
- Recipient — `resolvedName` (SuiNS / `/u/` slug) or shortened address
- Live countdown to `expiresAt` (ticks every 500ms)
- Expired banner + disabled Sign button when `Date.now() >= expiresAt`

---

## Stage 3: Touch ID

When the user clicks "Sign with Touch ID":

1. `emitClick('ui:chat:pre-sign')` fires to the substrate (telemetry, pheromone).
2. `setIsPending(true)` — button shows spinner, input is locked.
3. `onSign()` is called — this is where the caller wires WebAuthn PRF or the vault signer (`src/components/u/lib/signer/`).
4. The signer derives the keypair from the platform vault, signs the transaction digest, and broadcasts via `src/lib/sui.ts`.
5. `setIsPending(false)` on completion (success or failure).

On cancel: `emitClick('ui:chat:pre-sign-cancel')` fires, `onReject()` is called, and the card is dismissed without broadcasting.

---

## Stage 4: Confirmation

After a successful `onSign()`:

- The chat stream resumes with a text confirmation message.
- A `payment-card` rich message with `status: "complete"` replaces or follows the `pre-sign-card`.
- The path `buyer → skill` receives a `mark()` in the pheromone graph (L4 economic loop).
- `path.revenue` is updated in TypeDB via `src/engine/bridge.ts mirrorPay()`.

On failure (timeout, user rejection, Sui RPC error):

- The `pre-sign-card` remains but goes `isExpired = true` after `expiresAt`.
- A `payment-card` with `status: "expired"` is emitted if the server detects the window closed.
- No pheromone deposit — the path is neither marked nor warned.
