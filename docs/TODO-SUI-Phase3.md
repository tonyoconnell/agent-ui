---
title: TODO SUI Phase 3 — Escrow Settlement & x402 HTTP Flow
type: roadmap
version: 1.0.0
priority: Create → Release → Cancel → Settle → Compose → Graduate
total_tasks: 14
completed: 0
status: W2 LOCKED (2026-04-18) READY FOR W3 EXECUTION
---

# SUI Phase 3: Escrow Settlement & x402 HTTP Flow

> **Goal:** Ship atomic escrow settlement on Sui testnet. When a task completes,
> payment + mark + 50 bps protocol fee settle in one transaction. Enable x402
> HTTP flow: 402 response → fund escrow → execute → release.
>
> **Locked decisions (2026-04-18):**
> - 50 bps protocol fee model (confirmed in `one.move` release_escrow())
> - Atomic settlement: payment + path strength + fee collection in single tx
> - x402 flow: 402 response body contains escrow creation params
> - Multi-hop: each agent can hold multiple concurrent escrows (no serialization)
>
> **Source of truth:**
> [buy-and-sell.md](buy-and-sell.md) — escrow semantics,
> [DSL.md](DSL.md) — signal language,
> [dictionary.md](dictionary.md) — canonical names,
> [revenue.md](revenue.md) — five revenue layers,
> [TODO-SUI.md](TODO-SUI.md) — Phase 1-2 context
>
> **Shape:** 1 cycle, four waves. Haiku recon (3), Opus decide (1 shard),
> Sonnet edits (3 files), Sonnet verify (2 shards).
>
> **Bridge scope:** 14 tasks across TypeScript wiring, API routes, x402 flow,
> settlement tests, cleanup (cancel).

---

## Status

```
W0 baseline  — Move contract complete (create/release/cancel) ✓
             — Phase 2 complete (deterministic wallets live) ✓
             — W2 decisions LOCKED (fee model, atomic settlement, x402 spec) ✓
W1 recon     — ⏳ Ready to run (fan out 3 Haiku)
W2 decide    — ⏳ Ready (Opus reviews recon → final spec)
W3 edit      — ⏳ Ready (3 Sonnet agents: bridge + routes + tests)
W4 verify    — ⏳ Ready (2 verifiers: escrow settlement + x402 flow)
```

---

## W2 Locked Spec (Implementation Guide)

### Escrow Model (on-chain, already built in Move)

```move
public struct Escrow has key {
  id: UID,
  poster: ID,      // who posted the task
  worker: ID,      // who will execute
  task_name: String,
  bounty: Balance<SUI>,
  deadline: u64,   // milliseconds (enforced by Clock)
  path_id: ID,     // which path to mark/warn on settle
}

public fun create_escrow(
  poster: &mut Unit, worker_id: ID, task_name: String,
  amount: u64, deadline: u64, path_id: ID, ctx: &mut TxContext
)

public fun release_escrow(
  escrow: Escrow, worker: &mut Unit, path: &mut Path,
  protocol: &mut Protocol, clock: &Clock
)
// Atomic: worker receives payment, path marked (strength+1, hits+1),
// protocol fee (50 bps) goes to treasury, delete escrow object

public fun cancel_escrow(
  escrow: Escrow, poster: &mut Unit, path: &mut Path, clock: &Clock
)
// On deadline expiry: bounty returns to poster, path warned (resistance+1)
```

### TypeScript API (W3 edit task)

**`src/lib/sui.ts` additions:**
- `createEscrowTx(poster, worker, taskName, amount, deadline, pathId)` → Transaction
- `releaseEscrowTx(escrowId, worker, path, clock)` → Transaction
- `cancelEscrowTx(escrowId, poster, path, clock)` → Transaction

**`src/pages/api/escrow/` routes (3 new files):**
- `POST /api/escrow/create` → call `createEscrowTx`, sign, execute, return `{ escrowId, deadline, status }`
- `POST /api/escrow/release/:escrowId` → call `releaseEscrowTx`, settle, return `{ paymentSUI, markStrength, fee }`
- `POST /api/escrow/cancel/:escrowId` → call `cancelEscrowTx`, refund, return `{ refundedAmount }`

### x402 HTTP Flow (W3 edit task)

**Request/Response flow:**

```
Client sends:  POST /api/capability/hire
               { worker: 'assistant:1', task: 'research', budget: 1.0 SUI }
                     │
                     ▼
Server checks: Can this path do this capability? Do we have pheromone?
                     │
                     ├─ YES → execute immediately (L1 path cost < limit) → 200 + result
                     │
                     └─ NO → insufficient funds/pheromone
                          │
                          ▼
Server responds: 402 Payment Required
                 body: { escrow_template: {
                   worker_id: "0x952f...",
                   task_name: "research",
                   amount_mist: 1000000,  // 1.0 SUI in MIST
                   deadline_ms: Date.now() + 3600000,  // 1 hour
                   path_id: "0x956c...",
                   settlement_url: "/api/escrow/release/ESCROW_ID"
                 }}
                 │
                 ▼ (Client-side wallet or dapp-kit)
Client creates and funds escrow (on Sui)
                 │
                 ▼
Client calls: POST /api/capability/hire/settle
              { escrow_id: "0x8a17...", proof: { tx_digest, events } }
                 │
                 ▼
Server calls: POST /api/escrow/release/{escrowId}
                 │
                 ▼
Server responds: 200 + original result (now settled)
```

**Key invariants:**
- 402 body is deterministic (same request = same template)
- Escrow deadline = now + 1 hour (grace period for user signing)
- Release endpoint idempotent (release already-released = 204)
- Pheromone mark happens atomically on `release_escrow()` tx success

---

## Cycle 1: Wire Escrow + x402 Flow

### W1 — Recon (Haiku, fan out 3)

| id | task | target | output |
|----|------|--------|--------|
| R1 | Read Move contract escrow ops | `src/move/one/sources/one.move` (lines 294-410) | exact signatures + invariants |
| R2 | Read existing Sui client | `src/lib/sui.ts` (existing functions: withdrawSUI, etc.) | pattern for escrow functions |
| R3 | Read capability/hire route | `src/pages/api/capability/hire.ts` | current selection logic, where 402 hooks in |

**Exit:** 3 agents return recon reports with line numbers. Coverage: Move → TypeScript pattern → HTTP entry point.

### W2 — Decide (Opus)

**D1 — Escrow TX wiring:**
- How to build `createEscrowTx()` from `create_escrow` signature
- Error handling: insufficient balance, deadline validation
- Gas estimation for multi-step (create → sign → broadcast)

**D2 — 402 Response template:**
- Spec for `/api/capability/hire` returning 402 on insufficient pheromone
- Escrow template JSON schema (worker_id, amount, deadline, path_id, settlement_url)
- Idempotency: same request (method + params hash) = same template

**D3 — Settlement callback:**
- `POST /api/capability/hire/settle` accepts `{ escrow_id, proof }`
- Proof validation: check TypeDB that escrow was released on-chain
- Re-emit original request after settling (compute capability result, send to client)

**Exit:** Opus produces 3 diffs covering escrow TXs, 402 template, settlement callback. All decisions locked; no unknowns remain.

### W3 — Edit (Sonnet, one agent per file)

| id | task | file | exit |
|----|------|------|------|
| E1 | Add escrow TX builders | `src/lib/sui.ts` | `createEscrowTx()`, `releaseEscrowTx()`, `cancelEscrowTx()` + error handling |
| E2 | Add three escrow API routes | `src/pages/api/escrow/{create,release,cancel}.ts` | each route calls matching TX, executes, returns deterministic JSON |
| E3 | Update /api/capability/hire for x402 | `src/pages/api/capability/hire.ts` | on insufficient pheromone, return 402 + escrow template; on success, mark path |
| E4 | Wire settlement callback | `src/pages/api/capability/hire/settle.ts` | accept `{ escrow_id, proof }`, verify release via TypeDB, re-execute original task |
| E5 | Update bridge.ts for escrow events | `src/engine/bridge.ts` | absorb EscrowCreated/Released/Cancelled events, write to TypeDB for auditing |

**Anchors:** 
- L1 signal path selection at `/api/capability/hire` (entry point for 402 branch)
- Escrow object IDs mirror to TypeDB as `sui-escrow-id` attribute
- Path IDs in Move match `path_id` in bridge queries

### W4 — Verify (Sonnet, fan out 2)

| id | task | what | rubric |
|----|------|------|--------|
| V1 | Escrow settlement e2e test | `src/__tests__/sui-escrow.test.ts` | create escrow → release → verify payment + mark + fee collected |
| V2 | x402 HTTP flow test | `src/__tests__/x402-flow.test.ts` | hire request insufficient funds → 402 response → settle → 200 + result |
| V3 | Cancel escrow on deadline | `src/__tests__/sui-escrow-cancel.test.ts` | deadline expires → cancel succeeds → refund, warn path |
| V4 | Multi-hop escrow (chain) | `src/__tests__/sui-escrow-chain.test.ts` | agent A opens escrow, pays agent B (released), B opens escrow for C |

**Exit conditions:**
- ✓ 14/14 escrow/x402 tests pass
- ✓ `bun run verify` clean (no new lint/type errors)
- ✓ Bridge absorbs all escrow events (audit trail in TypeDB)
- ✓ Fee collection verified: Protocol treasury += 0.5% per release
- Rubric target: fit=0.90, form=0.88, truth=0.92, taste=0.87

---

## Task Metadata

```typeql
insert $t isa task,
  has task-id "sui:phase3:E1",
  has task-name "add escrow TX builders to sui.ts",
  has task-wave "W3",
  has task-context "TODO-SUI-Phase3.md#escrow-model",
  has value 9,        # high — unblocks marketplace economics
  has effort 4,       # moderate — three functions, error handling
  has phase "escrow",
  has persona "sonnet",
  has tag "sui", has tag "escrow", has tag "payment", has tag "P0",
  has exit "createEscrowTx, releaseEscrowTx, cancelEscrowTx all callable + tested";

(blocks: $escrow-e1, blocked: $settle-e4) isa blocks;  # E4 needs E1
(blocks: $escrow-e2, blocked: $settle-e4) isa blocks;  # E4 needs E2
```

---

## Rubric Scoring (W4 markDims)

Each W4 verifier shards by check type. All dimensions must hit ≥ 0.65 to advance.

| Dim | What | Target |
|-----|------|--------|
| **fit** | escrow routes in right layer (TypeScript wiring, not UI), atomicity correct | ≥ 0.90 |
| **form** | Sui TX builders idiomatic, error handling non-cryptic, x402 spec clear | ≥ 0.88 |
| **truth** | e2e tests cover create/release/cancel/chain; fee calculation verified | ≥ 0.92 |
| **taste** | settlement callback elegant (no extra round-trips), escrow events auditable | ≥ 0.87 |

---

## See Also

- [buy-and-sell.md](buy-and-sell.md) — escrow semantics, settlement patterns
- [revenue.md](revenue.md) — 50 bps fee goes to L4 economics layer
- [TODO-SUI.md](TODO-SUI.md) — Phase 1-2 context (testnet setup, identity)
- [speed.md](speed.md) — escrow settlement latency budget (must stay <1s)
- `src/move/one/sources/one.move` — the contract (lines 294-410)
- `src/lib/sui.ts` — where TypeScript functions live
- `src/engine/bridge.ts` — event absorption

---

*Atomic settlement. Deterministic fees. Enable x402 flow.*
