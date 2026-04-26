---
type: dashboard
group: ONE
refreshed_at: 2026-04-26T13:30:00Z
refreshed_by: "added passkey-recognition plan (5 parallel tracks, Cycle 1 W3 ready)"
plans_active: 3
tasks_open: 5
tasks_picked: 2
tasks_verified_lifetime: 16
escape_alerts: 0
rubric_avg_7d: 0.82
capabilities_live: 0
revenue_7d: 0.00
tests_passing: 365
tests_failing: 0
---

# TODO — ONE World

> **Latest closes:** `task-system:1` schema merge → `task-system:2` vocab propagation (implicit in test migrations) → `in-workspace:2.0` data wiring → `in-workspace:2.1:W3` wave swim-lanes (W4 verify in flight). 16 tasks verified. 365 tests pass. Rubric trending 0.68 → 0.82.

---

## 1 — Active plans

| Plan | Goal | Cycles | Rubric (7d) | Escape risk | Next action | Status |
|------|------|:------:|:-----------:|:-----------:|-------------|:------:|
| [`passkey-recognition`](plans/one/passkey-recognition.md) | Biometrics IS the security — same Touch ID → same vault, every time | 0/1 | — | medium (auth surface) | Spawn 5 parallel W3 agents (Tracks A-E) | `READY` |
| [`in-workspace`](plans/one/in-workspace.md) | `/tasks` as Apple/Things/Asana-grade workspace | 1/7 (2.1 W3 done, W4 pending) | **0.82** | low | Await W4 verify of 2.1 → start 2.2 recon (in flight) | `RUNNING` |
| [`task-system`](#) *(doc still owed)* | Merge task/plan/thing; ship workspace | 2/5 (schema + tests) | 0.85 | low | Cycle 3 — vocab propagation (dsl + dictionary update) | `RUNNING` |
| [`loop-close`](plans/one/loop-close.md) | Plans become pheromones; agents compete; humans sign | 0/5 | — | — | `/plan sync plans/one/loop-close.md` | `PLAN` |

---

## 2 — Tasks by status

| Status | Count | Notes |
|--------|------:|-------|
| `open` | 5 | passkey-recognition Cycle 1 W3 — Tracks A-E (parallel, no file-edit conflicts) |
| `blocked` | 0 | |
| `picked` | 2 | W4 verify (in-workspace:2.1) + Cycle 2.2 recon — in flight via spawned agents |
| `done` | 0 | |
| `verified` | **16** | 5 schema + 1 meta + 4 data wiring + 4 wave swim-lanes + 8 test migrations - 1 dissolved test - 1 dissolved polish |
| `failed` | 0 | |
| `dissolved` | 2 | polish-biome (stale W4), api-endpoints-test (bridge test kept intentionally) |

**Lifetime verified:** 16. First `dissolved` outcomes = working-as-intended (not bad pheromone).

---

## 3 — Rubric trend

```
cycle                fit   form  truth  taste  avg    Δ
───────────────────  ────  ────  ─────  ─────  ────  ────
task-system:1        0.90  0.82  0.92   0.88   0.88   —
task-system:2        0.85  0.78  0.88   0.85   0.84   -0.04
in-workspace:2.0     0.75  0.60  0.65   0.70   0.68   -0.16  (format nits)
in-workspace:2.0.p   0.85  0.88  0.85   0.80   0.84   +0.16  (post test-migration)
in-workspace:2.1-W3  0.88  0.85  0.85   0.85   0.86   +0.02  (verify pending)
```

**Trend:** recovered from 2.0 dip. Averaging 0.82 across 5 closes.

---

## 4 — Pheromone heatmap (cumulative)

| Tag path | Strength | Resistance | Net | Status |
|----------|---------:|-----------:|----:|--------|
| `substrate → schema` | 4.4 | 0 | **4.4** | fresh |
| `wave:3 → sonnet-schema-edit` | 4.4 | 0 | **4.4** | fresh |
| `ui → data-wiring` | 4.2 | 0 | **4.2** | fresh |
| `wave:3 → sonnet-api-migrate` | 4.4 | 0 | **4.4** | fresh |
| `wave:3 → sonnet-type-collapse` | 4.5 | 0 | **4.5** | fresh — won for cross-file edits |
| `wave:3 → sonnet-test-migrate` | 4.6 | 0 | **4.6** | highway candidate — 8 files, 365 tests |
| `wave:3 → sonnet-ui-swim-lanes` | 4.3 | 0 | **4.3** | fresh |
| `wave:4 → sonnet-verify-stale-report` | 0 | 0.5 | **-0.5** | warned (reported already-fixed problems) |
| `ui → react19-islands` | 2.0 | 0 | **2.0** | accumulating |

**Highway candidates:** `sonnet-test-migrate` at 4.6 (unique path across 8 files). One more similar cycle promotes to highway (threshold 50).

---

## 5 — Escape alerts

None. Every cycle gate-passed. No rubric below 0.65.

---

## 6 — Capabilities live

0 live. `route-design` + `unified-workspace` both waiting on their plan's final cycle close.

---

## 7 — Revenue (7d)

$0.00 all layers. First settlement opens when `in-workspace` Cycle 2.6 closes → `unified-workspace` capability lists.

---

## 8 — Next actions (pheromone-ranked)

1. **🔥 Spawn passkey-recognition Cycle 1 W3 — 5 parallel tracks** (no file-edit conflicts, all green-field or distinct files). Tracks A-E in [`plans/one/passkey-recognition.md`](plans/one/passkey-recognition.md). Evidence: D1 has 1 row, dev-file has 4 rows, vault_blob has 2 orphans on this machine. Same Touch ID, 5 minted users.
2. **Await W4 verify of in-workspace:2.1** (agent running). If pass → check off W4; start 2.2 recon formally.
3. **Spawn Cycle 2.2 W3** — detail pane + rubric radar + pheromone badge. Uses recon agent's findings (in flight).
4. **Backfill `plans/one/task-system.md`** — doc debt. Low effort, keeps bookkeeping honest.
5. **Cycle 3 propagation** — dictionary.md + dsl.md absorb new vocab (task_status values, role letters, WaveKey, WAVES).
6. **Cleanup deprecated `task` entity** — Cycle 2.2 or 2.3 safe window (after TaskBoard fully reads `thing`).

---

## 9 — In-flight (picked, not closed)

| Task ID | Wave | Agent (inferred) | Picked at |
|---------|------|------------------|-----------|
| `in-workspace:2.1:v1` | W4 | sonnet-verify (spawned this turn) | 2026-04-20T14:29Z |
| `in-workspace:2.2:r1` | W1 | haiku/sonnet-recon (spawned this turn) | 2026-04-20T14:29Z |

### 9a — passkey-recognition Cycle 1 W3 — ready to spawn (parallel)

Five tracks. Five files. Zero edit conflicts. Spawn Sonnets in parallel.

| Track | File (NEW or EDIT) | Owner concern | Closes gaps | Effort |
|-------|--------------------|---------------|-------------|-------:|
| **A** | `migrations/0024_user_id_pub.sql` (NEW) | Add `user_id_pub` column + indexes to `user`, `vault_blob`, `vault_passkey_hints` | 1 (forward-compat) | 15 min |
| **B** | `scripts/migrate-dev-passkey-hints.ts` (NEW) | One-shot: read `.dev-passkey-hints.json` → upsert into D1 → rename file | 2 (split-brain) | 30 min |
| **C** | `src/components/u/lib/vault/crypto.ts` (EDIT) | Add `masterToUserIdPub(master)` HKDF helper + unit test | 4 (server can derive) | 30 min |
| **D** | `src/lib/auth-plugins/passkey-webauthn.ts` (EDIT) | Remove file fallback · `user_id_pub` as identity key · `/heal` endpoint · server-side `excludeCredentials` | 1, 2, 3, 5, 6 | 2 h |
| **E** | `src/components/u/lib/vault/passkey-cloud.ts` (EDIT) | Send `user_id_pub` · auto-heal on 401 · delete misleading "passkey not recognised" branch | 4, 7 | 1.5 h |

**Spawn command (concept):** one Sonnet per track, all in flight simultaneously. Shared context: `plans/one/passkey-recognition.md`. Each agent reads its track's slice, edits its file, runs `bun run verify` for its scope, reports rubric + diff.

**Gate (W4):** all 5 tracks land → `bun run verify` clean → manual test (wipe D1, sign in same Touch ID, vault unlocks via heal path, no orphan user) → rubric ≥ 0.65.

---

## 10 — Recent closes (last 24h)

| Task ID | Rubric avg | Closed at | Notes |
|---------|-----------:|-----------|-------|
| `in-workspace:2.1:e1` | 0.87 | 14:25Z | WAVES + WaveKey added to types.ts |
| `in-workspace:2.1:e2` | 0.88 | 14:25Z | WaveSwimLaneContainer.tsx (NEW, +1284 bytes) |
| `in-workspace:2.1:e3` | 0.85 | 14:25Z | TaskCard wave badge |
| `in-workspace:2.1:e4` | 0.86 | 14:25Z | TaskBoard groupBy toggle |
| `in-workspace:2.0:e5a-h` | 0.90 | 14:15Z | 8 test files migrated — 365 pass |
| `in-workspace:2.0:e1-4` | 0.84 | 13:45Z | canonical task.ts + api + ws + store |
| `task-system:1:e1-5` | 0.88 | 12:40Z | schema v2.0 merge |

---

## 11 — Foundation changes landed

| Date | File | Change |
|------|------|--------|
| 2026-04-20 | `src/components/tasks/WaveSwimLaneContainer.tsx` | **NEW** — wave swim-lanes grid |
| 2026-04-20 | `src/components/tasks/types.ts` | WaveKey, WAVES, waveForTask + extends canonical Task |
| 2026-04-20 | `src/components/tasks/TaskCard.tsx` | Wave pill added, strength/resistance canonical |
| 2026-04-20 | `src/components/TaskBoard.tsx` | groupBy toggle, WaveSwimLaneContainer integration |
| 2026-04-20 | `src/__tests__/integration/*.test.ts` (8 files) | Migrated to canonical Task shape — 365 pass |
| 2026-04-20 | `src/types/task.ts` | **NEW** — canonical Task + WsMessage union + helpers |
| 2026-04-20 | `src/pages/api/tasks/index.ts` | Dual-read (thing first, task fallback); dual-write on POST |
| 2026-04-20 | `src/lib/ws-server.ts` | Re-export WsMessage from @/types/task |
| 2026-04-20 | `src/lib/use-task-websocket.ts` | Added pick/verify/rubric-update handlers |
| 2026-04-20 | `src/lib/tasks-store.ts` | ProjectTask = Task & timestamps; all methods canonical |
| 2026-04-20 | `src/types/world.ts` | Task re-exports canonical |
| 2026-04-20 | `src/components/tasks/types.ts` | Extends canonical with UI overlay |
| 2026-04-20 | `src/engine/task-parse.ts` | Renamed Task → ParsedTask + parsedToCanonical mapper |
| 2026-04-20 | `src/schema/one.tql` | v2.0 — thing absorbs plan/cycle/task/skill |
| 2026-04-20 | `agents/{you,ceo,marketing-director,sales-director,community-director,service-director,engineering-director}.md` | 7-agent ONE org scaffold |
| 2026-04-20 | `one/task.md`, `one/template-plan.md`, `one/template-todo.md` | Specs for task + plan + dashboard |
| 2026-04-20 | `plans/one/loop-close.md`, `plans/one/in-workspace.md` | First two canonical plans |

19 files created/modified, 365 tests green, rubric trending up.

---

## 12 — How to use

Same as last refresh. Dashboard is live view of TypeDB state; commands write, file regenerates.

---

*Cycle 2.0 fully closed. 2.1 W3 done, W4 in flight. 2.2 recon in flight.
16 tasks verified lifetime. 7-agent org scaffolded. Wave swim-lanes render.
Test suite green. Ready to continue.*
