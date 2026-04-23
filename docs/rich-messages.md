# Rich Messages

Source: `src/schema/rich-message/` (5 Zod schemas), `src/components/chat/PreSignCard.tsx`,
`src/components/chat/arcs/ListingCardComponent.tsx`, `src/components/chat/arcs/builder.ts`.

Rich messages are typed JSON payloads that arrive inside a chat stream as
`{ type: "rich", richType: "<card-type>", richPayload: { ... } }`.
Every schema is Zod-strict — `parse()` throws on unknown keys.

---

## 1. PaymentCard

**Schema:** `src/schema/rich-message/payment-card.ts`

```typescript
{
  type: "payment-card",
  receiver: string,           // Sui address
  amountMist: string,         // bigint serialized as string
  currency: "SUI",
  description?: string,
  action: "pay" | "claim" | "refund",
  status: "pending" | "complete" | "expired"
}
```

**When emitted.** The chat LLM or a tool resolves a payment intent (e.g. "pay @alice 0.5 SUI"). The API emits this card before the pre-sign step so the user can see what they are about to authorize.

**How it renders.** Displays receiver, amount in SUI (converted from MIST at 1e9), action label, and status badge. A `status: "complete"` card is read-only; `status: "pending"` offers an action button.

```json
{
  "type": "payment-card",
  "receiver": "0xabc123...",
  "amountMist": "500000000",
  "currency": "SUI",
  "description": "Pay for copywriting skill",
  "action": "pay",
  "status": "pending"
}
```

---

## 2. AgentCard

**Schema:** `src/schema/rich-message/agent-card.ts`

```typescript
{
  type: "agent-card",
  uid: string,
  name: string,
  description?: string,
  capabilities: string[],     // skill IDs the agent offers
  wallet?: string,            // Sui address (present after syncAgent)
  status: "active" | "paused" | "retired"
}
```

**When emitted.** The builder arc (`src/components/chat/arcs/builder.ts`) emits one `agent-card` per agent during the `deploy` phase. Also emitted by the discover flow when an agent match is found.

**How it renders.** Agent name, status badge, capability tags, wallet address (shortened). Active agents show a "Hire" or "Signal" action.

```json
{
  "type": "agent-card",
  "uid": "marketing:creative",
  "name": "Creative Director",
  "description": "Headlines, copy, brand voice",
  "capabilities": ["marketing:copy", "marketing:iterate"],
  "wallet": "0xdeadbeef...",
  "status": "active"
}
```

---

## 3. ListingCard

**Schema:** `src/schema/rich-message/listing-card.ts`

```typescript
{
  type: "listing-card",
  skillId: string,
  name: string,
  priceMist: string,          // bigint as string; "0" = free
  tags: string[],
  seller: string,             // agent UID or wallet
  description?: string
}
```

**When emitted.** A marketplace query tool resolves a skill search (e.g. "find me a copywriting agent"). The API wraps the cheapest matching capability as a listing card.

**How it renders.** Rendered by `ListingCardComponent`. Shows name, description, seller, price in SUI, tag badges, and a Buy button. The Buy button emits `ui:chat:listing-buy` and navigates to `/pay/[skillId]` (Sui dapp-kit flow).

```json
{
  "type": "listing-card",
  "skillId": "marketing:copy",
  "name": "Copywriting",
  "priceMist": "20000000",
  "tags": ["creative", "copy", "headlines"],
  "seller": "marketing:creative",
  "description": "Headlines, taglines, ad copy"
}
```

---

## 4. PreSignCard

**Schema:** `src/schema/rich-message/pre-sign-card.ts`

```typescript
{
  type: "pre-sign-card",
  txSummary: string,          // human-readable description
  recipient: string,          // raw Sui address
  amountMist: string,
  resolvedName?: string,      // SuiNS name or /u/people slug
  expiresAt: number           // epoch ms; card becomes non-actionable after this
}
```

**When emitted.** Immediately before a Sui transaction is broadcast. The chat flow halts and presents this card. The user must explicitly sign before the transaction proceeds.

**How it renders.** Rendered by `src/components/chat/PreSignCard.tsx`. Shows tx summary, recipient (resolvedName if available, otherwise shortened address), a live countdown to expiry, and two buttons: "Sign with Touch ID" and "Cancel". Expired cards show a destructive banner and disable the sign button. Emits `ui:chat:pre-sign` on sign, `ui:chat:pre-sign-cancel` on cancel.

```json
{
  "type": "pre-sign-card",
  "txSummary": "Pay 0.5 SUI for copywriting skill (marketing:copy)",
  "recipient": "0xabc123...",
  "amountMist": "500000000",
  "resolvedName": "@alice",
  "expiresAt": 1714000000000
}
```

---

## 5. HandoffCard

**Schema:** `src/schema/rich-message/handoff-card.ts`

```typescript
{
  type: "handoff-card",
  fromAgent: string,          // UID handing off
  toAgent: string,            // UID receiving
  context?: string,           // brief summary of what was handed off
  scopeChange: boolean        // true if the receiving agent has different permissions
}
```

**When emitted.** A multi-agent conversation transitions between agents — e.g. a director routes a task to a specialist, or a CEO agent hands off to an operator.

**How it renders.** Inline chip between messages: "Handoff: [fromAgent] → [toAgent]". If `scopeChange` is true, a warning indicator notes the permission boundary crossing.

```json
{
  "type": "handoff-card",
  "fromAgent": "marketing:cmo",
  "toAgent": "marketing:creative",
  "context": "Write three headline variants for the Q3 campaign",
  "scopeChange": false
}
```
