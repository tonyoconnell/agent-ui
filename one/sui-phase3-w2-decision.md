# W2 Decision Spec — SUI Phase 3 Escrow Settlement & x402 Flow

**Locked:** 2026-04-18 | **Unblocks:** E1-E5 edit tasks | **Authors:** Haiku W1 recon + Opus decision

---

## Executive Summary

Three decisions lock the W3 implementation path for atomic escrow settlement on Sui testnet:

1. **D1 — Escrow TX Wiring:** `createEscrowTx()`, `releaseEscrowTx()`, `cancelEscrowTx()` builders follow existing Move-call pattern (see `sign-and-execute` precedent in `sui.ts` lines 99–110, 258–293)
2. **D2 — 402 Response Template:** Deterministic schema; triggers on pheromone shortage; locked in request hash to prevent race conditions
3. **D3 — Settlement Callback:** Async-proof settlement via durable storage; re-executes original `/api/capability/hire` after on-chain release verified

**Authority:** Move contract (source of truth for TX signatures) > TypeScript pattern (existing client wrapper style) > HTTP schema (convention for determinism).

---

## D1 — Escrow TX Wiring

### Decision: How to Build createEscrowTx() from Move create_escrow Signature

**Move signature (lines 294–327):**
```move
public fun create_escrow(
    poster: &mut Unit,
    worker_id: ID,
    task_name: String,
    amount: u64,
    deadline: u64,
    path_id: ID,
    ctx: &mut TxContext,
)
```

**TypeScript builder (new function, `src/lib/sui.ts`):**

```typescript
/**
 * Build TX to create an escrow on Sui.
 * Poster locks amount, worker claims on completion before deadline.
 *
 * Args:
 *   posterUid       — UID of the unit posting the task (e.g., "debby:trainer")
 *   posterUnitId    — Sui object ID of poster's Unit (resolved from TypeDB)
 *   workerId        — Sui ID of worker (dest unit)
 *   taskName        — human task name (e.g., "research")
 *   amountMist      — amount in MIST (1 SUI = 1e9 MIST)
 *   deadlineMs      — absolute deadline in milliseconds (validated client-side < server-side)
 *   pathId          — Sui ID of the path to mark/warn on settle
 *
 * Returns: Transaction object, unsigned.
 */
export function createEscrowTx(
  posterUnitId: string,
  workerId: string,
  taskName: string,
  amountMist: number,
  deadlineMs: number,
  pathId: string,
): Transaction {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')
  if (amountMist <= 0) throw new Error('amount must be positive')
  if (deadlineMs <= Date.now()) throw new Error('deadline must be in future')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::create_escrow`,
    arguments: [
      tx.object(posterUnitId),           // &mut Unit poster
      tx.pure.id(workerId),               // worker_id: ID
      tx.pure.string(taskName),           // task_name: String
      tx.pure.u64(amountMist),            // amount: u64
      tx.pure.u64(deadlineMs),            // deadline: u64 (ms timestamp)
      tx.pure.id(pathId),                 // path_id: ID
    ],
  })

  return tx
}
```

**Pattern rationale:**
- Follows existing `send()` / `pay()` / `registerTask()` wrapper style (no tx builder class, pure function returns signed-ready TX)
- Error handling is **client-side**: validate deadline before TX; validate balance before signing
- Gas is not estimated (testnet, no OOM risk); mainnet will add gas budget
- TX is unsigned — caller invokes `signAndExecute()` after obtaining keypair

### Decision: releaseEscrowTx() and cancelEscrowTx()

**`releaseEscrowTx()` — worker claims payment (lines 331–379):**

```typescript
/**
 * Build TX to release escrow to worker. Task completed successfully.
 * Atomic: worker receives payment, path marked (strength+1, hits+1),
 * protocol fee (50 bps) collected.
 *
 * Preconditions (enforced on-chain):
 *   - clock::timestamp_ms(clock) <= escrow.deadline (not expired)
 *   - signer must be the worker (object::id(worker) == escrow.worker)
 *
 * Args:
 *   escrowId      — Sui object ID of Escrow shared object
 *   workerUnitId  — Sui object ID of worker's Unit
 *   pathId        — Sui object ID of the path to mark
 */
export function releaseEscrowTx(
  escrowId: string,
  workerUnitId: string,
  pathId: string,
): Transaction {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')
  if (!PROTOCOL_ID) throw new Error('SUI_PROTOCOL_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::release_escrow`,
    arguments: [
      tx.object(escrowId),               // escrow: Escrow (mutable shared object)
      tx.object(workerUnitId),           // &mut Unit worker
      tx.object(pathId),                 // &mut Path path
      tx.object(PROTOCOL_ID),            // &mut Protocol protocol
      tx.object('0x6'),                  // &Clock (shared object)
    ],
  })

  return tx
}
```

**`cancelEscrowTx()` — refund on deadline expiry (lines 382–416):**

```typescript
/**
 * Build TX to cancel escrow. Deadline has passed. Bounty returns to poster.
 * Path is warned (resistance+1, misses+1).
 *
 * Preconditions (enforced on-chain):
 *   - clock::timestamp_ms(clock) > escrow.deadline (expired)
 *   - signer must be the poster (object::id(poster) == escrow.poster)
 *
 * Args:
 *   escrowId    — Sui object ID of Escrow shared object
 *   posterUnitId — Sui object ID of poster's Unit (resolver)
 *   pathId      — Sui object ID of the path to warn
 */
export function cancelEscrowTx(
  escrowId: string,
  posterUnitId: string,
  pathId: string,
): Transaction {
  if (!PACKAGE_ID) throw new Error('SUI_PACKAGE_ID not configured')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::substrate::cancel_escrow`,
    arguments: [
      tx.object(escrowId),               // escrow: Escrow (mutable shared object)
      tx.object(posterUnitId),           // &mut Unit poster
      tx.object(pathId),                 // &mut Path path
      tx.object('0x6'),                  // &Clock (shared object)
    ],
  })

  return tx
}
```

### Decision: Validation (Client vs Server)

| Check | Where | Why |
|-------|-------|-----|
| **Deadline > now** | Client + Server | Move checks `deadline <= clock::timestamp_ms(clock)`, but TX may be delayed; client-side check prevents broadcast of expired TXs |
| **Amount > 0** | Both | Move asserts; client validates before signing |
| **Balance sufficient** | Server (POST /api/escrow/create) | Client can't reliably check balance (stale); must fail gracefully in route with 400 + hint |
| **Worker exists** | Server | Resolved via TypeDB; client can't verify |
| **Path exists** | Server | Resolved via TypeDB; client can't verify |
| **Deadline is absolute ms** | Client | Must validate format (> 1e12 = year 2001 in ms; < 1e13 = year 2286); reject if obviously wrong |

**Pattern:** Client validates UX quality. Server validates invariants. Move enforces atomicity.

### Decision: Gas Costs & Testnet Faucet

**Testnet faucet funding (line 183):**
```typescript
if (BigInt(balance.totalBalance) < 100_000_000n) {  // < 0.1 SUI
  await requestFaucet(address)
}
```

**Escrow operations gas estimates (from Move):**
- `create_escrow()`: ~1,000–2,000 gas (unit object mutate, escrow object create, event)
- `release_escrow()`: ~500–1,000 gas (unit mutate, path mutate, event, balance transfer)
- `cancel_escrow()`: ~500–1,000 gas (unit mutate, path mutate, event, balance return)

**Total per flow:** ~2,500–3,500 gas = ~0.001–0.004 SUI. **Testnet faucet (auto-funding to 0.1 SUI per address) is sufficient.** No special gas considerations needed.

---

## D2 — 402 Response Template

### Decision: When Should /api/capability/hire Return 402?

**Trigger:** Insufficient pheromone on the requested path.

| Condition | Code | Response |
|-----------|------|----------|
| Path strength < threshold (pheromone shortage) | **402** | Escrow template (client must fund and re-execute) |
| Path capability missing | **410** (Gone) | Path doesn't exist or withdrawn |
| Pheromone exists, execution succeeds | **200** | Result + mark applied |
| Temporary error (TypeDB/Sui timeout) | **503** | Retry-After + diagnostic |

**Threshold logic:** Path strength = `hits × weight`. If `hits < 2` or `strength < 1.0`, insufficient pheromone → 402. (Conservative: require at least 2 successful traversals before allowing free execution.)

### Decision: 402 Response Schema

**Response body (JSON):**

```typescript
interface Payment402Response {
  status: 402
  code: 'payment_required'
  escrow_template: {
    worker_id: string              // Sui ID of worker Unit
    task_name: string              // e.g., "research"
    amount_mist: number            // exact amount in MIST
    deadline_ms: number            // now + 1 hour (absolute timestamp)
    path_id: string                // Sui ID of the path being marked
    settlement_url: string         // POST /api/capability/hire/settle
  }
  expires_at: number              // deadline_ms (client knows when template expires)
}
```

**Schema locked:**
```typescript
// TypeScript type for Zod/AI codec
import { z } from 'zod'

export const Payment402Schema = z.object({
  status: z.literal(402),
  code: z.literal('payment_required'),
  escrow_template: z.object({
    worker_id: z.string().regex(/^0x[a-f0-9]+$/),
    task_name: z.string().min(1).max(256),
    amount_mist: z.number().int().positive(),
    deadline_ms: z.number().int().positive(),
    path_id: z.string().regex(/^0x[a-f0-9]+$/),
    settlement_url: z.string().url(),
  }),
  expires_at: z.number().int().positive(),
})
```

### Decision: Determinism & Idempotency

**Same request = same template (always).**

| Input | Locked Value |
|-------|--------------|
| path (from→to) | `worker_id` (resolved via TypeDB, constant) |
| task_name | from request, constant |
| amount_mist | from request budget, constant |
| deadline_ms | `Date.now() + 3600000` (1 hour) — **ISSUE: not constant across time** |
| path_id | from TypeDB, constant |
| settlement_url | constructed from escrow_id template (before escrow exists) |

**Resolution:** Deadline is NOT constant, but **neither should it be**. The 402 template is valid for 1 hour (its own deadline). If client requests at T=0 and receives deadline T+1h, and requests again at T=0.5h, the new template has deadline T+1.5h. Both are correct — the first is expired at T+1h+ε, the second is not. Client must use **latest** template.

**Idempotency key:** Server does not cache 402 responses. Each request generates a fresh template. This is **safe** because:
1. Client has 1 hour to fund and settle
2. Multiple 402 responses only extend the deadline (favorable to client)
3. If client loses the template, requesting again gets a new one (up to 1 hour freshness)

---

## D3 — Settlement Callback

### Decision: Settlement Endpoint & Proof

**Endpoint:** `POST /api/capability/hire/settle`

**Request body:**
```typescript
interface SettlementRequest {
  escrow_id: string              // Sui object ID of the Escrow
  proof: {
    tx_digest: string            // Sui TX digest (released escrow on-chain)
    tx_effects: object           // Full TX effects (optional, for audit)
  }
  original_request?: {
    worker: string               // From original /api/capability/hire request
    task: string
    budget_sui: number
  }
}
```

**Response (201 Created):**
```typescript
interface SettlementResponse {
  status: 201
  escrow_id: string
  result: unknown              // Result of re-executed /api/capability/hire
  mark_strength: number        // Path strength after mark()
  fee_collected_mist: number   // 50 bps protocol fee
  tx_digest: string
}
```

### Decision: Release Verification (TypeDB → On-Chain → TypeDB)

**Flow:**
```
Client calls: POST /api/capability/hire/settle { escrow_id, proof: { tx_digest } }
                          │
                          ▼
Server verifies: Did TX (tx_digest) contain EscrowReleased event for escrow_id?
  (Query Sui RPC: getTransactionBlock(tx_digest) → parse events)
                          │
                    ✓ Yes    ✗ No
                    │         │
                    ▼         ▼
           Write to TypeDB  Reject (400)
           escrow status:   "tx_digest unknown or event missing"
           released                │
                    │         retry with new digest
                    ▼
    Re-execute /api/capability/hire
    with original request params
    → capability invoked
    → path marked (atomic)
                    │
                    ▼
           Return 201 + result
```

### Decision: Async Settlement (Fire-and-Forget via D1)

**Implementation strategy:** Use D1 (Durable Ask) to survive worker restart.

```typescript
// src/pages/api/capability/hire/settle.ts

export async function POST(req: Request) {
  const { escrow_id, proof } = await req.json() as SettlementRequest

  // 1. Verify TX on Sui RPC
  const verified = await verifySuiTx(proof.tx_digest, escrow_id)
  if (!verified) return new Response('TX not found or event missing', { status: 400 })

  // 2. Store settlement in D1 (durable storage)
  const settlement = {
    id: `settle:${escrow_id}`,
    escrow_id,
    tx_digest: proof.tx_digest,
    original_request: proof.original_request,
    status: 'pending',
    created_at: Date.now(),
  }
  await durableStorage.set(settlement.id, settlement)

  // 3. Enqueue settlement task (async, can retry)
  await enqueueSettlement(settlement.id)

  // 4. Return immediately (202 Accepted, not 201)
  // Client can poll /api/capability/hire/status/:escrow_id or use webhook
  return new Response(JSON.stringify({ status: 202, escrow_id, settlement_id: settlement.id }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Async settlement task (can run from /api/tick or separate worker)
async function settleEscrow(settlementId: string) {
  const settlement = await durableStorage.get(settlementId)
  if (!settlement || settlement.status === 'settled') return

  try {
    // Re-execute the original hire request
    const result = await executeCapabilityRequest(settlement.original_request)

    // Mark path in TypeDB + Sui
    await persistentWorld.mark(settlement.original_request.from, settlement.original_request.to)

    // Update settlement status
    settlement.status = 'settled'
    settlement.result = result
    settlement.settled_at = Date.now()
    await durableStorage.set(settlementId, settlement)

  } catch (err) {
    settlement.status = 'failed'
    settlement.error = (err as Error).message
    settlement.retry_count = (settlement.retry_count ?? 0) + 1
    await durableStorage.set(settlementId, settlement)

    // Retry up to 3 times (exponential backoff)
    if (settlement.retry_count < 3) {
      await enqueueSettlement(settlementId, 5000 * settlement.retry_count)
    }
  }
}
```

**Determinism:** Settlement is **deterministic by escrow_id**. The same escrow can only settle once (idempotent). Retry doesn't create duplicate marks because:
1. Escrow object is deleted on `release_escrow()` on-chain
2. TypeDB query `has sui-escrow-id $id` returns 0 rows after first settlement
3. Idempotent re-execution: mark() already succeeded, marking again is safe (adds 1 to strength twice if re-run, but async lock prevents this)

**Lock:** Use `durableStorage` + status flag (`pending|settled|failed`). Once `settled`, skip re-execution.

---

## Diff Spec

### D1 — Escrow TX Wiring

| Anchor | Action | New | Rationale |
|--------|--------|-----|-----------|
| `src/lib/sui.ts` | **add 3 functions** | `createEscrowTx(posterUnitId, workerId, taskName, amountMist, deadlineMs, pathId): Transaction` | Builder pattern: unsigned TX, client validates UX, Move validates invariants |
| `src/lib/sui.ts` | **add** | `releaseEscrowTx(escrowId, workerUnitId, pathId): Transaction` | Release locked payment atomically; payment + mark + fee in one TX |
| `src/lib/sui.ts` | **add** | `cancelEscrowTx(escrowId, posterUnitId, pathId): Transaction` | Refund on deadline; automatic reconciliation |
| `src/lib/sui.ts` | **update error handling** | Validate `amount > 0`, `deadline > now`, throw on missing PACKAGE_ID/PROTOCOL_ID | Client-side validation prevents invalid TX broadcasts |
| `src/pages/api/escrow/create.ts` | **new file** | `POST /api/escrow/create` handler: accept `{ posterUid, workerId, taskName, amountMist, deadlineMs, pathId }`, call `createEscrowTx()`, `signAndExecute()`, return `{ escrowId, deadline, tx_digest }` | Route layer: resolves UIDs → Sui IDs, calls builder, handles Sui errors (400 insufficient balance, 503 network) |
| `src/pages/api/escrow/release.ts` | **new file** | `POST /api/escrow/release/:escrowId` handler: validate escrow exists in Sui, call `releaseEscrowTx()`, execute, parse events, emit `escrow:released` signal, return `{ paymentSUI, markStrength, fee }` | Payment settlement: atomic payment + pheromone |
| `src/pages/api/escrow/cancel.ts` | **new file** | `POST /api/escrow/cancel/:escrowId` handler: validate deadline passed, call `cancelEscrowTx()`, execute, return `{ refundedAmount }` | Deadline reconciliation: automatic refund |

### D2 — 402 Response Template

| Anchor | Action | New | Rationale |
|--------|--------|-----|-----------|
| `src/pages/api/capability/hire.ts` | **update route logic** | After capability check, before execution: if `path.strength < threshold`, return 402 + escrow template instead of executing | Gate pheromone: insufficient history means risky path |
| `src/pages/api/capability/hire.ts` | **add** | Construct `escrow_template` deterministically: resolve `worker_id`, `path_id` from TypeDB; compute `amount_mist` from request; set `deadline_ms = Date.now() + 3600000`; set `settlement_url = /api/capability/hire/settle` | Deterministic schema: same request → same template (within 1 hour) |
| `src/types/escrow.ts` | **new file** | Export `Payment402Response` and `Payment402Schema` (Zod validator) | Schema-first: codegen for UI, validation in routes |

### D3 — Settlement Callback

| Anchor | Action | New | Rationale |
|--------|--------|-----|-----------|
| `src/pages/api/capability/hire/settle.ts` | **new file** | `POST /api/capability/hire/settle` handler: accept `{ escrow_id, proof: { tx_digest } }`, verify Sui TX, store in D1, enqueue settlement task, return 202 Accepted | Async-proof settlement: durable storage + task queue |
| `src/engine/bridge.ts` | **add** | `absorbEscrowEvent(event)`: parse `EscrowReleased` events from Sui RPC, write `{ escrow_id, released_at_ms }` to TypeDB for audit | Event absorption: all escrow events logged for governance audit |
| `src/__tests__/sui-escrow.test.ts` | **new file** | e2e test: create → release → verify payment + mark + fee | Test escrow settlement atomicity |
| `src/__tests__/x402-flow.test.ts` | **new file** | e2e test: hire insufficient pheromone → 402 → fund escrow → settle → 200 + result | Test full x402 HTTP flow |
| `src/__tests__/sui-escrow-cancel.test.ts` | **new file** | e2e test: create → deadline expires → cancel → verify refund + warn | Test automatic deadline reconciliation |

---

## Dependencies & Blocking

**E-task dependencies (from TODO-SUI-Phase3.md):**

```
E1 (escrow TX builders)
  ↓
E2 (API routes: create/release/cancel)
  ↓
E4 (settlement callback + re-execution)  [also needs E3 (402 gate)]
  ↓
V1 (e2e escrow test) → verify settlement atomic + fee correct
V2 (x402 flow test)  → verify 402 → fund → settle → 200
```

**Blocking order:**
1. E1 unblocks E2 (routes need TX builders)
2. E2 unblocks E4 (settlement needs release route)
3. E3 unblocks E4 (402 gate must return template)

**Edit order for W3:** E1 → E2 → E3 → E4 → E5 (bridge events) → V1–V4 (tests).

---

## Checklist for W3

- [ ] E1: All three TX builders in `sui.ts` with full client-side validation + error messages
- [ ] E2: Three new routes (create, release, cancel) with error handling + deterministic JSON responses
- [ ] E3: `/api/capability/hire` 402 branch + escrow template schema locked
- [ ] E4: Settlement callback + durable storage + async re-execution with retry logic
- [ ] E5: Event absorption in `bridge.ts` (EscrowCreated, EscrowReleased, EscrowCancelled, ProtocolFeeCollected)
- [ ] V1–V4: All tests passing + deterministic assertions on payment, mark, fee, deadline

---

## See Also

- `src/move/one/sources/one.move` (lines 294–416) — Move escrow contract
- `src/lib/sui.ts` (lines 99–110, 258–293) — existing TX builder pattern
- `docs/TODO-SUI-Phase3.md` — full task roadmap
- `docs/buy-and-sell.md` — escrow semantics (LIST → DISCOVER → EXECUTE → SETTLE)
- `docs/revenue.md` — 50 bps fee economics (L4 layer)
- `docs/routing.md` — pheromone threshold logic (strength formula)

