---
title: TODO-marketplace Cycle 2 — Wave 2 Decisions
type: wave-artifact
cycle: 2
wave: W2
parent: TODO-marketplace.md
source_of_truth:
  - marketplace.md
  - marketplace-schema.md
  - DSL.md
  - dictionary.md
  - rubrics.md
decided_by: Opus (main context)
decided_at: 2026-04-16
---

# Cycle 2 W2 — Decide (reconciled)

> Input: `one.move`, `sui.ts`, `human.ts`, `durable-ask.ts`, `persist.ts`
> (settle hook), `bridge.ts` (settleEscrow), `marketplace-schema.md` (bounty
> contract), `marketplace.md` §"How agents hire humans".
>
> **Critical finding — scope collapse:** the W1 recon implicit in the TODO
> assumed a greenfield Cycle 2. The actual tree already contains:
>
> | Target | Status | Note |
> |--------|--------|------|
> | `src/move/one/sources/one.move` | **DONE** | `Escrow`, `Protocol`, `create_escrow`, `release_escrow`, `cancel_escrow`, fee skim on release already live. `fee_bps=50` (0.50%) — Cycle 3 raises to 200 (2%). |
> | `src/lib/sui.ts` | **DONE** | `createEscrow`, `releaseEscrow`, `cancelEscrow` exported. Naming differs from TODO (`postBounty`/`claimBounty`) but primitives match. |
> | `src/engine/persist.ts` | **DONE** | `settle(edge, { escrowObjectId, claimantUid, posterUid, success })` already on interface (line 112) + impl (line 169–179). Mirrors to `bridge.settleEscrow`. |
> | `src/engine/bridge.ts` | **DONE** | `settleEscrow(escrowId, claimantUid, posterUid, success)` exported (line 332). |
> | `src/pages/api/market/bounty.ts` | **EXISTS** (145 lines) | Needs audit vs marketplace-schema.md `data.kind="bounty"` wire format. |
> | `src/pages/api/market/bounty/[id].ts` | **EXISTS** | Detail route; needs audit. |
> | `src/components/Marketplace/BountyForm.tsx` | **EXISTS** (133 lines) | Needs audit vs `/api/market/bounty` shape + shadcn idioms. |
> | `src/engine/human.ts` | **PARTIAL** | Supports `approve`/`review`/`choose`. No `claim` task for bounties. |
> | `src/engine/bounty.test.ts` (or integration) | **MISSING** | Cycle 2 Gate is load-bearing here — no test = no deterministic result. |
> | `nanoclaw/src/units/bounty.ts` | **MISSING** | `nanoclaw/src/units/` directory doesn't exist. Telegram delivery handler deferred to Cycle 2.5 if the web path proves the loop first. |
>
> **Reconciled shape of W3:** not 7 parallel Sonnet agents creating files. Rather:
> - **Verify** the three existing files (`bounty.ts`, `bounty/[id].ts`,
>   `BountyForm.tsx`) conform to the wire format in marketplace-schema.md §
>   "Bounty `data` contract" and the four-state escrow machine.
> - **Extend** `human.ts` with a `claim` task (≤ 20 lines).
> - **Create** the E2E test that proves testnet escrow → close → release.
> - **Defer** nanoclaw units — the web-side bounty flow is the deterministic
>   path to the Cycle 2 Gate. Telegram delivery is a Cycle 2.5 follow-up
>   that doesn't block settlement proof.

---

## S1 — Sui / Move (reconciled)

### Key decisions ratified against the live contract

1. **One rubric tx or four?** → **One.** The contract's
   `release_escrow(escrow, worker, path, protocol, clock)` takes no rubric
   fields. Rubric is off-chain deterministic (scored by substrate in W4
   style), signature releases. This matches the W2 proposal exactly —
   **no Move changes required in Cycle 2.**

2. **Refund triggers — timeout only, or explicit warn() too?** → **Both,
   but through the same Move path.** `cancel_escrow(escrow, poster, path,
   clock)` already requires `deadline_passed` on-chain. Explicit `warn()`
   from substrate side calls `settle(edge, { ..., success: false })` →
   `bridge.settleEscrow(…, success=false)` which invokes `cancelEscrow`
   only after deadline. If a poster wants earlier refund, they
   `durableAsk` the claimant with a shortened deadline. **No contract
   change.**

3. **Who pays gas?** → **Creator pays gas on `create_escrow`; worker pays
   gas on `release_escrow`.** This is already how `signAndExecute` works
   in `sui.ts`; each call signs with the relevant keypair. **No change.**

### Open Move question (out of Cycle 2 scope)

The contract's `fee_bps` is 50 (0.50%). TODO marketplace cycle 3 says 2%
(bps=200). That's a Cycle 3 W3 edit — call `set_fee_bps(protocol,
200)` as an admin tx from `platformKeypair()`. **Not a code edit — a
tx.** Record it in the Cycle 3 W2 artifact.

---

## S2 — Substrate integration (reconciled)

### Decisions that produce actual W3 edits

1. **Where does `mark()` trigger Sui release?** → **Already in
   `persist.settle()` (line 169–179).** Callers invoke
   `persist.settle(edge, { escrowObjectId, claimantUid, posterUid,
   success: true })`. The Sui call is fire-and-forget (`bridge.settleEscrow`
   is async and never throws). **No edit — this path is already wired.**

2. **Human units accept + deliver bounties.** → **Extend `human.ts` with
   a `claim` task.** The `approve/review/choose` tasks return via
   `durableAsk`. A `claim` task accepts a bounty `data.content`, posts
   to Telegram/Discord, waits on durable ask, returns the deliverable.
   **≤ 20 LOC addition.**

3. **Deadline handling.** → **Already solved by `durableAsk`** +
   `cancel_escrow`'s on-chain deadline check. Two-level defense: in-app
   timeout (durable ask) + on-chain timeout (Sui cancel). **No edit.**

4. **Fee-skim hook for Cycle 3.** → **Already present.**
   `release_escrow` deducts `fee_bps` into `Protocol.treasury`. Cycle 3
   just flips the basis points. **Leave the hook, do nothing in Cycle 2.**

5. **Bounty wire format compliance.** → **Audit `/api/market/bounty.ts`
   + `BountyForm.tsx` against marketplace-schema.md §"Bounty `data`
   contract":** fields MUST be `{kind, tags, content, price, rubric,
   deadline, escrow_state, tx_hash, claims}`. Any deviation is a W3 fix.

6. **Test the loop.** → **New file: `src/__tests__/integration/bounty.test.ts`**
   (matches existing integration test pattern adl-cache.test.ts, collusion.test.ts).
   Must assert: post → escrow locked on testnet → mark() → release tx
   confirms → claimant balance +amount → creator balance -amount. Uses
   the testnet package id already in `.env`.

---

## Diff specs for W3 (Sonnet, parallel)

Four agents. One per job. Spawn in a single message.

### E1 — audit `/api/market/bounty.ts`

```
TARGET:    src/pages/api/market/bounty.ts
AGENT:     Sonnet
RULE:      Read the file first. Verify POST body matches marketplace-schema.md
           §"Bounty `data` contract" exactly: {kind:"bounty", tags, content,
           price, rubric, deadline, escrow_state:"locked"|"claimed"|"verifying"|
           "released"|"refunded", tx_hash, claims}. If any field is missing,
           misnamed, or typed as something other than the doc says, patch it
           with minimal edits. If the shape already conforms, report "no-op"
           and do nothing. Do not add features. Do not rename exports.
           Do not touch `/api/market/bounty/[id].ts` unless asked.
OUTPUT:    Either a single Edit diff or "no-op verified".
```

### E2 — audit `BountyForm.tsx`

```
TARGET:    src/components/Marketplace/BountyForm.tsx
AGENT:     Sonnet
RULE:      Read the file first. Verify it (a) POSTs to `/api/market/bounty`
           with the schema-conformant body from E1, (b) uses shadcn/ui
           primitives per .claude/rules/ui.md (every onClick emits
           emitClick('ui:market:...'), Card/Button/Input from @/components/ui),
           (c) handles the 4 escrow states returned (locked/claimed/verifying/
           released|refunded) in the UI. Minimal edits only. If conformant,
           "no-op verified".
OUTPUT:    Either a single Edit diff or "no-op verified".
```

### E3 — extend `human.ts` with `claim`

```
TARGET:    src/engine/human.ts
AGENT:     Sonnet
ANCHOR:    ".on('choose', async (data) => {"
ACTION:    insert a sibling `.on('claim', …)` handler before the final closing `}`
NEW:       A claim handler that takes {bounty_id, content, deadline} from
           data, notifies the human via telegram (existing `notify()`), and
           returns the durableAsk result. Shape mirrors the existing approve
           task but the message template says "Bounty claim available:
           {content}\n\nReply with your deliverable, or 'decline' to pass."
           Keep under 20 LOC total added.
RATIONALE: marketplace.md §"How agents hire humans" — the reverse-hire flow
           routes bounty signals to a human; human needs a receive task.
           `approve/review/choose` don't fit because a claim is open-ended
           content with a deadline.
```

### E4 — create E2E bounty integration test

```
TARGET:    src/__tests__/integration/bounty.test.ts   (new file)
AGENT:     Sonnet
RULE:      Read existing tests for pattern:
           - src/__tests__/integration/adl-cache.test.ts
           - src/__tests__/integration/collusion.test.ts
           Write a vitest suite that:
           1. Skips by default (testnet tx = real money). Gate on
              `process.env.SUI_PACKAGE_ID && process.env.RUN_TESTNET_TESTS`.
           2. Creates two test UIDs (poster, claimant).
           3. Funds both via `ensureFunded()` in sui.ts.
           4. Creates a path between them.
           5. Calls `createEscrow(poster, …, worker, task, amount, deadline, pathId)`.
           6. Asserts escrow object exists on testnet + balance locked.
           7. Calls `releaseEscrow(claimant, escrowId, claimantUnit, pathId)`.
           8. Asserts: claimant balance +amount (minus fee), path.strength
              increments, fee in Protocol.treasury.
           9. Cancel-path test: create → wait past deadline → cancel →
              poster balance restored, path.resistance +1.
           The test IS the deterministic result that makes the Cycle 2
           Gate green. Keep under 200 LOC.
OUTPUT:    New file with the described suite, skip-gated.
```

### E5 (deferred to Cycle 2.5) — nanoclaw bounty unit

**Not in Cycle 2 W3.** Deferred because:
1. `nanoclaw/src/units/` directory doesn't exist — creating it is a
   structural change that should be decided separately.
2. The web-side bounty flow (E1 + E2) proves the loop end-to-end
   without Telegram. Telegram is a delivery channel, not a settlement
   primitive.
3. The Cycle 2 Gate says "testnet tx confirms escrow→close→release" —
   E4 proves this. Telegram is additive.

Re-open in a Cycle 2.5 mini-TODO if Donal's pod specifically needs
Telegram bounty delivery before Cycle 3 GROW starts.

---

## What this produces for W3

Exactly **4 files touched** (1 new, 3 edits — probably 1-2 no-ops), not 7.
Parallelism still applies: all 4 agents spawn in one message.

```
W3 spawn:   4 Sonnet agents (E1..E4) in a single tool-use block
Expected:   ≤2 no-ops (E1, E2 audits likely pass)
            1 small edit to human.ts (E3, ~20 LOC)
            1 new test file (E4, ~150-200 LOC)
Verify:     bun run verify → green
            bun run vitest run src/__tests__/integration/bounty.test.ts --run
              (skip unless testnet creds present)
```

## Rubric dims for W4

| Dim | What to check |
|-----|---------------|
| **fit** | Zero schema change. Every marketplace primitive still maps to existing `capability`, `signal`, `actor`, `group`. `data.kind="bounty"` is a convention, not a type. |
| **form** | `/api/market/bounty.ts` is idiomatic Astro SSR API; `BountyForm.tsx` uses shadcn primitives + `emitClick` per `.claude/rules/ui.md`; `human.ts:claim` matches the existing task signature. |
| **truth** | E4 test, when run with testnet creds, confirms: (a) escrow locked on chain, (b) release credits claimant, (c) cancel refunds poster, (d) fee lands in Protocol.treasury. Deterministic. |
| **taste** | Donal's pod could post a bounty today with zero code edits to his agent markdown — the form accepts tags + rubric + price + deadline; the human handler accepts the delivery. |

---

## See Also

- [TODO-marketplace.md](TODO-marketplace.md) — the parent TODO
- [marketplace-schema.md](marketplace-schema.md) — bounty wire format (authoritative)
- [marketplace.md](marketplace.md) §"How agents hire humans"
- `src/engine/persist.ts:112,169` — settle() interface + impl
- `src/engine/bridge.ts:332` — settleEscrow
- `src/move/one/sources/one.move:294,331,382` — Move escrow
- `src/lib/sui.ts:416,450,476` — sui-side escrow wrappers

---

*W2 scope collapse: 7 new files → 1 new file + 3 audits + 1 extension.
The substrate is further along than the TODO status indicates. W3 can
close cycle 2 with a single parallel spawn.*
