---
title: TODO — Collision Avoidance
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 24
completed: 0
status: ACTIVE
---

# TODO: Collision Avoidance for Parallel Agent Sessions

> **Goal:** Multiple Claude Code and agent sessions can work on different tasks and waves simultaneously without colliding — ownership claims, stale lease recovery, wave-level locking.
>
> **Source of truth:** [PLAN-collusion-mitigation](PLAN-collusion-mitigation.md) — architecture and atomicity,
> [DSL.md](DSL.md) — the signal language,
> [dictionary.md](dictionary.md) — everything named,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark)
>
> **Shape:** 3 cycles, four waves each. Haiku recons the plan, Opus decides the approach, Sonnet implements endpoints + integration, Sonnet verifies atomicity + no collisions.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `task` entity with new `owner` and `claimed-at` attributes, new `wave-lock` entity. TypeDB transactions are the mutex — single HTTP call = one atomic write.

## Routing

Signals flow down through waves. Each cycle claims more of the substrate.

```
    /wave TODO-collusion.md           Mark path with ownership strength
         │
         ▼
    ┌─W1────────┐
    │  Haiku    │  Read PLAN-collusion-mitigation
    │  recon    │  → analyze schema changes, endpoints, integration
    └─────┬─────┘
         │ schema + endpoint design
         ▼
    ┌─W2────────┐
    │  Opus     │  Decide: which cycle depends on which
    │  decide   │  → build dependency graph
    └─────┬─────┘
         │ implementation approach
         ▼
    ┌─W3────────┐
    │  Sonnet   │  Create endpoints + integrate + test
    │  edit     │  → claim.ts, release.ts, expire.ts, wave-lock
    │           │  → modify tasks/index.ts, complete.ts, task-sync.ts
    │           │  → update work.md, done.md
    └─────┬─────┘
         │ code + commands
         ▼
    ┌─W4────────┐
    │  Sonnet   │  Verify: collision tests pass, atomicity proven
    │  verify   │  → rubric: fit/form/truth/taste
    └───────────┘   → npm run verify, integration tests

    Context accumulates down. Quality marks flow up.
```

## Testing — The Deterministic Sandwich

Every cycle wrapped in W0 baseline → W4 verification → cycle gate.

### W0 — Baseline

```bash
npm run verify
├── biome check .     (lint)
├── tsc --noEmit      (type)
└── vitest run        (tests)
```

### W4 — Verification + Rubric

Each cycle's W4 must:
1. `npm run verify` — no regressions
2. New tests pass (collision tests, stale lease recovery, wave-locking)
3. Rubric scores (fit/form/truth/taste ≥ 0.65 per dimension)
4. Exit conditions verifiable by curl

---

## Cycle 1: WIRE — Schema + Core Endpoints

Foundation layer: TypeDB schema, claim/release endpoints, expire recovery.

**Files:** 3 new, 0 modified  
**Changes:** Schema definition, atomic claim logic, TTL recovery

### Task 1a: Schema — Add owner + claimed-at + wave-lock

- [ ] **1a. Update world.tql**
  id: c1-schema-task
  value: critical
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-schema-attribute, c2-filter-tasks
  exit: `grep "owns owner" src/schema/world.tql` returns true; wave-lock entity defined
  tags: schema, foundation, P0

- [ ] **1b. Update world.tql attributes**
  id: c1-schema-attribute
  value: critical
  effort: low
  phase: C1
  persona: haiku
  blocks: c2-filter-tasks
  exit: `grep "attribute owner, value string" src/schema/world.tql` returns true
  tags: schema, foundation, P0

### Task 2: Claim Endpoint — Atomic Compare-and-Swap

- [ ] **2a. Create src/pages/api/tasks/[id]/claim.ts**
  id: c1-claim-create
  value: critical
  effort: medium
  phase: C1
  persona: sonnet
  blocks: c1-claim-test
  exit: `curl POST /api/tasks/{id}/claim` returns 200 with owner; 409 if already claimed
  tags: endpoint, atomicity, P0

- [ ] **2b. Write atomic TypeQL query for claim**
  id: c1-claim-query
  value: critical
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-claim-create
  exit: Query has `match ... has task-status $s; $s = "open"; delete ... insert active + owner`
  tags: typedb, atomicity, P0

- [ ] **2c. Re-read confirmation pattern (claim verify)**
  id: c1-claim-verify
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-claim-test
  exit: Second TypeQL query confirms match or rejects claim
  tags: typedb, verification, P0

### Task 3: Release Endpoint

- [ ] **3a. Create src/pages/api/tasks/[id]/release.ts**
  id: c1-release-create
  value: high
  effort: medium
  phase: C1
  persona: sonnet
  blocks: c1-release-test
  exit: `curl POST /api/tasks/{id}/release {sessionId}` returns 200; 403 if wrong owner
  tags: endpoint, ownership, P0

- [ ] **3b. Owner-checked release query**
  id: c1-release-query
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-release-create
  exit: TypeQL matches owner before deleting; non-owner gets empty result
  tags: typedb, safety, P0

### Task 4: Expire Endpoint — Stale Lease Recovery

- [ ] **4a. Create src/pages/api/tasks/expire.ts**
  id: c1-expire-create
  value: high
  effort: medium
  phase: C1
  persona: sonnet
  blocks: c1-expire-test, c2-tick-integration
  exit: `curl GET /api/tasks/expire` returns `{ expired: [...], count: N }`
  tags: endpoint, recovery, P0

- [ ] **4b. TTL check logic (30 minutes)**
  id: c1-expire-ttl
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-expire-create
  exit: `const CLAIM_TTL_MS = 30 * 60 * 1000` defined; tasks older than TTL are released
  tags: ttl, recovery, P0

### Testing Cycle 1

- [ ] **4c. Claim collision test**
  id: c1-claim-test
  value: critical
  effort: medium
  phase: C1
  persona: sonnet
  blocks: c1-prove-baseline
  exit: Two concurrent claims return 200 + 409; only one gets owner
  tags: test, atomicity, P0

- [ ] **4d. Release safety test**
  id: c1-release-test
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-prove-baseline
  exit: Wrong owner gets 403; correct owner gets 200
  tags: test, safety, P0

- [ ] **4e. Expire recovery test**
  id: c1-expire-test
  value: high
  effort: medium
  phase: C1
  persona: sonnet
  blocks: c1-prove-baseline
  exit: Task with claimed-at 31 minutes ago is auto-released
  tags: test, recovery, P0

### Cycle 1 Gate

- [ ] **4f. W0 baseline (before C1)**
  id: c1-w0-baseline
  value: critical
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-schema-task
  exit: `npm run verify` passes; all baseline tests green
  tags: gate, baseline, P0

- [ ] **4g. W4 verify (after C1)**
  id: c1-w4-verify
  value: critical
  effort: low
  phase: C1
  persona: sonnet
  blocks:
  exit: `npm run verify` passes; claim/release/expire tests pass; rubric ≥ 0.65 all dims
  tags: gate, verify, P0

---

## Cycle 2: PROVE — API Integration

Integration layer: filter tasks, guard sync, clear owner on completion.

**Files:** 3 modified, 1 new  
**Changes:** Task querying, sync safety, completion cleanup

### Task 5: Filter Active Tasks from GET /api/tasks

- [ ] **5a. Modify src/pages/api/tasks/index.ts (local store path)**
  id: c2-filter-local
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-filter-test
  exit: `filtered = filtered.filter(t => t.status !== 'in_progress')` added
  tags: api, filtering, P0

- [ ] **5b. Modify src/pages/api/tasks/index.ts (TypeDB path)**
  id: c2-filter-typedb
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-filter-test
  exit: TypeQL has `not { $t has task-status "active"; };` in match clause
  tags: api, filtering, typedb, P0

### Task 6: Guard task-sync — Skip Active Tasks

- [ ] **6a. Modify src/engine/task-sync.ts**
  id: c2-sync-guard
  value: high
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-sync-test
  exit: `syncTasks()` reads active task IDs before batch; skips them during insert
  tags: sync, safety, P0

- [ ] **6b. Active ID set pattern**
  id: c2-sync-active-set
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-sync-guard
  exit: `const activeIds = new Set(...)` populated from TypeDB match
  tags: sync, safety, P0

### Task 7: Clear Owner on Task Completion

- [ ] **7a. Modify src/pages/api/tasks/[id]/complete.ts**
  id: c2-complete-owner
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-complete-test
  exit: After `task-status = "done"`, fire `delete owner of $t; delete claimed-at of $t`
  tags: api, cleanup, P0

### Task 8: Integrate expire into /api/tick

- [ ] **8a. Modify src/pages/api/tick.ts or create dedicated endpoint**
  id: c2-tick-integration
  value: medium
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-tick-test
  exit: `/api/tick` calls `expire()` or `/api/tick/expire` exists and runs on cycle
  tags: tick, recovery, P0

### Testing Cycle 2

- [ ] **8b. Filter exclusion test**
  id: c2-filter-test
  value: high
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-prove-baseline
  exit: Claim a task, GET /api/tasks → task not in list
  tags: test, filtering, P0

- [ ] **8c. Sync guard test**
  id: c2-sync-test
  value: high
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-prove-baseline
  exit: Sync with active task in TypeDB → active task unchanged
  tags: test, sync, P0

- [ ] **8d. Owner cleanup test**
  id: c2-complete-test
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-prove-baseline
  exit: After complete, re-read task → owner field is empty
  tags: test, cleanup, P0

- [ ] **8e. Tick integration test**
  id: c2-tick-test
  value: medium
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-prove-baseline
  exit: `/api/tick` calls expire; stale tasks auto-released
  tags: test, integration, P0

### Cycle 2 Gate

- [ ] **8f. W4 verify (after C2)**
  id: c2-w4-verify
  value: critical
  effort: low
  phase: C2
  persona: sonnet
  blocks:
  exit: All C2 tests pass; no regressions; rubric ≥ 0.65 all dims
  tags: gate, verify, P0

---

## Cycle 3: GROW — Command Layer + Wave-Locking

Command layer: SESSION_ID generation, claim/release in /work and /done; wave-level locking.

**Files:** 2 modified, 2 new  
**Changes:** Commands, wave-lock endpoints

### Task 9: Wave-Lock Schema (part of C1 schema but declared in C3 usage)

- [ ] **9a. Create src/pages/api/waves/[docname]/claim.ts**
  id: c3-wave-claim
  value: high
  effort: medium
  phase: C3
  persona: sonnet
  blocks: c3-wave-test
  exit: `curl POST /api/waves/TODO-rename.md/claim` returns 200; 409 if locked
  tags: endpoint, wave-lock, P1

- [ ] **9b. Create src/pages/api/waves/[docname]/release.ts**
  id: c3-wave-release
  value: high
  effort: medium
  phase: C3
  persona: sonnet
  blocks: c3-wave-test
  exit: `curl POST /api/waves/TODO-rename.md/release` releases lock (owner-checked)
  tags: endpoint, wave-lock, P1

### Task 10: Update /work Command

- [ ] **10a. Modify .claude/commands/work.md (add SESSION_ID generation)**
  id: c3-work-session
  value: high
  effort: low
  phase: C3
  persona: sonnet
  blocks: c3-work-test
  exit: `SESSION_ID="claude-$$-$(date +%s)"` added at top
  tags: command, session, P0

- [ ] **10b. Add claim step after SELECT**
  id: c3-work-claim
  value: high
  effort: medium
  phase: C3
  persona: sonnet
  blocks: c3-work-test
  exit: POST /api/tasks/{id}/claim with SESSION_ID; retry on 409
  tags: command, claim, P0

- [ ] **10c. Pass SESSION_ID to complete**
  id: c3-work-complete
  value: high
  effort: low
  phase: C3
  persona: sonnet
  blocks: c3-work-test
  exit: POST /api/tasks/{id}/complete includes `"from": "$SESSION_ID"`
  tags: command, integration, P0

### Task 11: Update /done Command

- [ ] **11a. Modify .claude/commands/done.md (pass SESSION_ID)**
  id: c3-done-session
  value: high
  effort: low
  phase: C3
  persona: sonnet
  blocks: c3-done-test
  exit: POST /api/tasks/{id}/complete includes `"sessionId": "$SESSION_ID"`
  tags: command, release, P0

### Task 12: Update /wave Command (Wave-Level Locking)

- [ ] **12a. Modify .claude/commands/wave.md (add wave claim)**
  id: c3-wave-cmd-claim
  value: medium
  effort: medium
  phase: C3
  persona: sonnet
  blocks: c3-wave-test
  exit: Before wave execution, POST /api/waves/{docname}/claim; abort if 409
  tags: command, wave-lock, P1

- [ ] **12b. Release wave lock after completion**
  id: c3-wave-cmd-release
  value: medium
  effort: low
  phase: C3
  persona: sonnet
  blocks: c3-wave-test
  exit: After final wave step, POST /api/waves/{docname}/release
  tags: command, wave-lock, P1

### Testing Cycle 3

- [ ] **12c. Session ID generation test**
  id: c3-work-test
  value: high
  effort: low
  phase: C3
  persona: sonnet
  blocks: c3-grow-baseline
  exit: Two `/work` invocations generate unique SESSION_IDs
  tags: test, session, P0

- [ ] **12d. /done release test**
  id: c3-done-test
  value: high
  effort: low
  phase: C3
  persona: sonnet
  blocks: c3-grow-baseline
  exit: After `/done`, task owner is cleared; task back to open
  tags: test, release, P0

- [ ] **12e. Wave-lock exclusivity test**
  id: c3-wave-test
  value: medium
  effort: medium
  phase: C3
  persona: sonnet
  blocks: c3-grow-baseline
  exit: Two sessions claim same wave; second gets 409 conflict
  tags: test, wave-lock, P1

- [ ] **12f. Two-session parallel work test**
  id: c3-parallel-test
  value: critical
  effort: high
  phase: C3
  persona: sonnet
  blocks: c3-grow-baseline
  exit: Two /work sessions simultaneously → each picks different task, both complete successfully
  tags: test, integration, P0

### Cycle 3 Gate

- [ ] **12g. W4 verify (after C3)**
  id: c3-w4-verify
  value: critical
  effort: low
  phase: C3
  persona: sonnet
  blocks:
  exit: All C3 tests pass; parallel session test succeeds; rubric ≥ 0.65 all dims
  tags: gate, verify, P0

---

## Collision Detection is Deterministic

**Critical:** Collision detection has zero race conditions. This is not probabilistic.

### Why Deterministic

1. **Atomic TypeDB transaction:** One HTTP call = one database transaction
   - No client-side multi-step transaction
   - Gateway opens transaction → executes query → commits → returns result
   - All-or-nothing: if match fails, delete/insert never execute

2. **Match-based gate:** Query matches `task-status "open"` (explicit value check)
   - Either status is "open" → match succeeds, write happens
   - Or status is "active" (or anything else) → match fails, no write
   - No timeout, no retry, no eventual consistency

3. **TypeDB serialization:** Two concurrent identical claim queries
   - Both arrive at TypeDB Cloud
   - TypeDB holds a write lock on the entity
   - First transaction commits: status becomes "active"
   - Second transaction re-evaluates match: finds `status != "open"`, match fails, returns empty
   - Result: deterministic, only one succeeds

4. **No backoff/retry in the claim protocol:**
   - Client sends claim → TypeDB returns {ok: true} OR {ok: false}
   - No ambiguity, no "maybe" state, no pending
   - Endpoint either returns 200 (claimed) or 409 (conflict), never timeout

### Verification

```bash
# Run collision detection 1000 times concurrently
for i in {1..1000}; do
  curl -X POST http://localhost:4322/api/tasks/TASK_ID/claim \
    -d '{"sessionId":"test-'$i'"}' &
done
wait

# Result: exactly one gets 200. Exactly 999 get 409. No ambiguity.
```

The substrate **never permits phantom collisions** (both think they claimed) or **ghost tasks** (no one claimed but task is locked). TypeDB's transaction isolation is the guarantee.

---

## Cost Discipline

| Cycle | Tasks | Haiku | Opus | Sonnet | Est. Cost |
|-------|-------|-------|------|--------|-----------|
| C1: WIRE | 8 | 0.5 | 0 | 2.5 | 3 |
| C2: PROVE | 6 | 0 | 0 | 3.0 | 3 |
| C3: GROW | 8 | 0 | 0 | 4.0 | 4 |
| **TOTAL** | **24** | **0.5** | **0** | **9.5** | **10** |

Cost in Claude credits (approximate). Haiku reads specs. Sonnet writes/tests. Opus not needed (deterministic logic).

---

## Status

- [x] **W0: Baseline** — `npm run verify` passes before starting
- [ ] **C1: Wire** — Schema + endpoints complete
- [ ] **C2: Prove** — API integration complete
- [ ] **C3: Grow** — Commands + wave-locking complete
- [ ] **W4: Verify** — All tests pass, rubric >= 0.65, cycle gate cleared

---

## Next Action

```bash
/wave TODO-collusion.md
# Starts Cycle 1, Wave 1: Haiku recon of PLAN-collusion-mitigation.md
```

---

## See Also

- [PLAN-collusion-mitigation](PLAN-collusion-mitigation.md) — the full architecture
- [DSL.md](DSL.md) — signal grammar (receiver, data, mark, warn, fade)
- [dictionary.md](dictionary.md) — unit, task, path, owner vocabulary
- [rubrics.md](rubrics.md) — fit/form/truth/taste scoring
- [TODO-template.md](TODO-template.md) — this template
- [CLAUDE.md](/CLAUDE.md) — engine file reference (world.ts, persist.ts, loop.ts)
- [src/schema/world.tql](/src/schema/world.tql) — TypeDB schema (task entity)
- [src/lib/typedb.ts](/src/lib/typedb.ts) — TypeDB client (atomic transactions)

---

*24 tasks. 3 cycles. One substrate. No collisions.*
