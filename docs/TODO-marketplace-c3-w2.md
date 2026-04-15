---
title: TODO-marketplace Cycle 3 — Wave 2 Decisions
type: wave-artifact
cycle: 3
wave: W2
parent: TODO-marketplace.md
decided_by: Opus (main context)
decided_at: 2026-04-16
---

# Cycle 3 W2 — Decide (reconciled)

## W1 findings summary

| Target | State | Note |
|--------|-------|------|
| `persist.settle()` | **EXISTS** (lines 179–205) | Calls `mark()/warn()` + `bridge.settleEscrow`. **No off-chain fee accounting** — no signal emitted to `treasury:one`, no env read for TREASURY_UID. |
| `loop.ts` L6 `know()` | **EXISTS** (lines 502–521) | Promotes paths at `confidence >= 0.8`, 1h interval. **No bundle/contains-path handling.** |
| `/api/export/highways.ts` | **EXISTS** (72 lines) | Exports `from, to, strength, resistance`. **Types declare `revenue/successRate/traversals` but fields are NEVER POPULATED.** Filter `strength >= 20`. |
| `/api/market/bundle.ts` | **EXISTS** (84 lines) | POST creates a `skill` with `tag="bundle"` + `skill-id="bundle:${from}:${to}"`. `compositePrice = strength × 0.001`. **No activation endpoint (GET/POST to invoke a bundle).** |
| `src/components/Marketplace/HighwayCard.tsx` | **EXISTS** | (from prior `ls` during Cycle 2 recon) |
| `src/pages/api/worlds/tenant.ts` | **MISSING** | TODO new file. |
| `src/lib/tenancy.ts` | **MISSING** | TODO new file. |
| Move `Protocol.fee_bps` | **EXISTS** at 50 (0.50%) | `set_fee_bps(protocol, new_bps)` admin function exists (line 649). Cycle 3 = one tx to flip to 200 (2%). |
| `agents/donal/*.md` | **EXISTS** — 11 files | All `group=marketing`. CMO has 3 free skills (brief/plan/review), 10 specialists $0.03–$1. |
| `wrangler.donal.toml` | **EXISTS** | Shared D1/KV with nanoclaw. **No tenant isolation.** |
| `one.tql` `group` entity | **EXISTS** (line 14–21) | `owns brand` — tenancy lives in brand prefix per marketplace-schema.md. 126 lines total. |

## Decisions

### S1 — Revenue mechanics

1. **Fee implementation — ONE admin tx, not a code edit.**
   The Move contract already handles the 2% skim atomically in `release_escrow` (line 353–360). Flip requires: `set_fee_bps(Protocol, 200)`. Write a **script** at `scripts/set-protocol-fee.ts` that calls it via `platformKeypair()`. Script is the code; running it is the tx. No persist.ts fee math.

2. **Off-chain fee audit trail.**
   Every successful `settle(edge, { success: true })` should emit a signal to `receiver: "treasury:one"` with `data.amount = escrowAmount × 0.02` for TypeDB-queryable fee history. This is the "Protocol fee event" row in marketplace-schema.md §conventions. Hook it into `persist.settle()` after `settleEscrow()` returns. ~10 LOC.

3. **Highways export: populate the declared-but-unset fields.**
   `/api/export/highways.ts` declares `revenue`, `successRate`, `traversals` in its row type but never fills them. Extend the TypeQL read to project `has revenue $r, has traversals $t` (both exist on the `path` entity per `world.tql`). `successRate = hits / (hits + misses)` computed in-code. Critical because bundle.ts uses `strength` as a proxy for bundle price — `revenue` is the true quality signal per the Move contract (revenue IS weight).

4. **Bundle activation endpoint.**
   Add `GET /api/market/bundle/:id` that returns the bundle's contained paths (decoded from `skill-id="bundle:from:to"`) + one `POST /api/market/bundle/:id/activate` that emits a signal with `receiver: "bundle:${from}:${to}"` + routes via cascaded `.then()` on the providing units. Substrate-native — no orchestrator. Bundle = facade.

5. **Decision rejected:** per-dimension fee tracking. One fee signal per close is enough — splitting by dim would double ledger writes with no analytical gain. Rubric dims already live on the source signal's `data.rubric`.

### S2 — Premium world tenancy

6. **`src/lib/tenancy.ts` (new).**
   Reads `group.brand` prefix (`premium:` | `enterprise:` | `public:`). Returns `{tier, quota: {agents, signalsPerDay, memoryMB}}`. Pure function — no side effects. Middleware wrappers in `auth.ts` call it.
   Quota defaults (from marketplace.md §Revenue + revenue.md tier table):
   - `public:*` → free tier (5 agents, 1k signals/day)
   - `premium:*` → $499/mo (50 agents, 50k signals/day, persistence)
   - `enterprise:*` → $2,999/mo (unlimited + custom routing)

7. **`src/pages/api/worlds/tenant.ts` (new).**
   `GET /api/worlds/tenant` → list tenants by brand prefix.
   `POST /api/worlds/tenant` → provision: creates `group(gid, name, group-type="world", brand="<tier>:<gid>")` in TypeDB, returns quota. Admin-auth gated (reuse `api-auth.ts`).

8. **OO Agency seed (data, not code).**
   One TypeQL insert makes Donal's pod a premium world:
   `insert $g isa group, has gid "world:oo-agency", has name "OO Marketing Agency", has group-type "world", has brand "premium:oo-agency";`
   Plus 11 `membership` relations tying `marketing` actors into the new world group. No code edit — a seed script.

9. **Treasury actor seed.**
   `insert $a isa actor, has aid "treasury:one", has actor-type "world", has name "ONE Protocol Treasury";` — required so S1 #2's fee signals have a real receiver. Same seed script.

10. **Tenant isolation via middleware, not infra.**
    Per marketplace-schema.md: "Billing/quota enforcement lives in middleware (`src/lib/auth.ts` + a new `src/lib/tenancy.ts`) reading the `brand` prefix — not in schema." Do not shard D1/KV. Do not fork the worker. A single `src/pages/api/signal.ts` enforcement point using `tenancy.ts` is enough for Cycle 3.

11. **Custom domain `donal.one.ie` → deferred to Cycle 3.5.**
    DNS + Pages route config is operational, not code. The premium-world CLAIM is verified by the tenant row + quota middleware + existing worker serving OO pod. Don't block Cycle 3 gate on DNS.

## W3 agent plan (Sonnet × 7, parallel)

Eight files, but two share concerns (admin script + seed script can be one agent with two outputs, keeping it as 7 agents).

| Agent | File | Kind | Est. LOC |
|-------|------|------|----------|
| E1 | `src/pages/api/export/highways.ts` | edit | +30 (populate revenue/successRate/traversals) |
| E2 | `src/engine/persist.ts` | edit | +12 (fee audit signal in settle()) |
| E3 | `src/pages/api/market/bundle.ts` | edit | +60 (add `/bundle/:id` GET + `/bundle/:id/activate` POST) |
| E4 | `src/lib/tenancy.ts` | new | ~80 (tier parser + quota table) |
| E5 | `src/pages/api/worlds/tenant.ts` | new | ~90 (list + provision) |
| E6 | `scripts/set-protocol-fee.ts` | new | ~50 (admin Move tx + dry-run flag) |
| E7 | `scripts/seed-cycle3.ts` | new | ~60 (treasury actor + OO Agency group + 11 memberships) |

## Rubric dims for W4

| Dim | Check |
|-----|-------|
| **fit** | Zero schema change (one.tql stays 126). `treasury:one` is an actor. `world:oo-agency` is a group. Bundle activation uses existing `skill` + `path(tag="contains")` primitives. Quota middleware reads existing `brand` attr. |
| **form** | Astro 5 API route conventions. Admin scripts use `bun`/`ts-node` pattern from existing `scripts/*.ts`. No new frameworks. |
| **truth** | (a) Fee flip script, when run with admin key, confirms `Protocol.fee_bps == 200` on testnet. (b) Seed script, when run, creates treasury + world group in TypeDB (verifiable via `/api/groups`). (c) Bundle activation signal cascades through contained paths (verify via WS broadcast). (d) Tenancy middleware rejects unauthenticated signal on quota-exceeded. |
| **taste** | OO Agency loadable as a premium world with one seed run. Bundle pricing on highways page shows composable workflows. Treasury balance visible via new endpoint or existing `/api/export/treasury.json`. |

## Cycle 3 Gate (verifiable)

```bash
# 1. Fee flip
bun run scripts/set-protocol-fee.ts --bps 200 --dry-run
  → prints tx params; confirms PROTOCOL_ID resolution

# 2. Seed
bun run scripts/seed-cycle3.ts --dry-run
  → prints 2 inserts + 11 memberships; confirms none already exist

# 3. Tenancy
curl -s localhost:4321/api/worlds/tenant | jq '.[].brand'
  → includes "premium:oo-agency"

# 4. Bundle
curl -s localhost:4321/api/market/bundle/oo:full-audit
  → returns contained paths with revenue/successRate populated

# 5. Highways with revenue
curl -s localhost:4321/api/export/highways | jq '.[0].revenue'
  → non-null

# 6. Fee audit
curl -s localhost:4321/api/memory/reveal/treasury:one | jq '.signals | length'
  → > 0 after any test bounty settles

# 7. bun run verify green
```

## Deferred to 3.5 / Cycle 4

- DNS/Pages config for `donal.one.ie`
- Testnet bounty that actually settles 2% into treasury (requires Cycle 2 E2E to be unskipped — needs `RUN_TESTNET_TESTS=1` + real faucet)
- First real invoice (Stripe pass-through; outside Cycle 3 code scope)
- Cycle-2 taste polish: currency label, price=0 gate, rubric UX slider
- Cycle-2 truth polish: miniflare D1 test for HTTP verify path

---

## See Also

- [TODO-marketplace.md](TODO-marketplace.md) — parent
- [TODO-marketplace-c2-w2.md](TODO-marketplace-c2-w2.md) — prior cycle artifact
- [marketplace-schema.md](marketplace-schema.md) §Tenancy, §Treasury (authoritative)
- [marketplace.md](marketplace.md) §Revenue (5 streams)
- `src/move/one/sources/one.move:649` — `set_fee_bps`
- `src/engine/persist.ts:179` — settle() hook point
- `src/pages/api/export/highways.ts` — unpopulated revenue field

---

*Cycle 3 scope: 2 edits + 2 new endpoints + 2 new lib files + 2 scripts. Zero schema delta. 7 agents, one spawn.*
