---
title: System Hardening
type: plan
slug: system
group: world:one
mode: full
lifecycle: evolution
status: RUNNING
spec: one/system.md
created: 2026-04-25
---

# TODO — System Hardening

Close 16 gaps in [system.md](system.md). Base context: [DSL.md](dsl.md) · [dictionary.md](dictionary.md) · [rubrics.md](rubrics.md).

**Per-task agent loads only:** this row + listed files. **`L`** skips W1+W2 (edit directly). **`M`** skips W1 (W2 decide). **`F`** runs W1→W4. Cycle map: C0=T0+T1 · C1=T2 · C2=T3.

## Tasks

| ID | T | M | ‖ | V/E | Files | Scope → Exit |
|----|---|---|---|-----|-------|--------------|
| `sys-001` | 0 | L | — | 3/1 | `one/system.md` | Fix R2→D1 vault, D1 primary-region note, ~80ms write-budget, link Known Gaps. → `grep "R2.*vault" one/system.md` = 0 |
| `sys-101` | 1 | F | ‖ | 8/3 | `workers/backup/index.ts`(new) `scripts/restore-typedb.ts`(new) `wrangler.toml` | Daily TypeDB→R2 cron, 30d retention, restore replay. → restore staging from D-1 <10min, ±1% rows |
| `sys-102` | 1 | L | ‖ | 8/2 | `src/lib/api-auth.ts` | KV `quota:{group}:{day}` lookup post-roleCheck; 429+Retry-After; emit `api:rate-limit:hit`. → 1001/day grpA→429, grpB unaffected |
| `sys-103` | 1 | L | ‖ | 7/3 | `gateway/src/index.ts` `src/lib/ws-server.ts` | DO `idFromName(group)`; `/broadcast` requires `group`; `"global"` fallback 1 release. → 2grp×100WS isolated, `test-ws-isolation.ts` ✓ |
| `sys-104` | 1 | L | ‖ | 6/1 | `src/engine/adl.ts` `docs/ADL-integration.md` | Default `enforce` (was `audit`); `audit` env override. → sender>recv sensitivity → 403 |
| `sys-105` | 1 | L | ‖ | 7/2 | `src/pages/api/agents/sync.ts` `src/pages/api/agents/adl.ts` | Extract `group` from frontmatter; `roleCheck(role,'hire')` gate. → cross-group sync → 403 |
| `sys-201` | 2 | F | — | 10/6 | `src/move/one/sources/one.move` `src/lib/sui.ts` `src/engine/agent-md.ts` `src/engine/bridge.ts` `one/agents.md` `one/passkeys.md` `one/sui.md` | **Delete megakey.** Move `Capability` struct (scope, amount-cap, expiry, owner, holder); agent gets ephemeral keypair per Worker session (RAM only); owner (chairman via vault) signs once to mint capability; agent ops sign with ephemeral + reference capability; sponsor Worker pays gas (Enoki-play shape). Migrate existing 19 agents: chairman mints capability for each. → `grep -r "SUI_SEED\|deriveKeypair" src/` = 0 platform-held keys; revoke-capability tx kills agent authority ≤1 epoch; agent ops without valid capability → revert |
| `sys-201b` | 2 | L | ‖ | 4/1 | `.env.example` `wrangler.toml` `src/lib/sui.ts` (audit) | Strip `SUI_SEED` from env, code, docs after sys-201 migration complete. → CI fails if `SUI_SEED` reintroduced; secret not present in any deploy target |
| `sys-202` | 2 | F | ‖ | 7/4 | `src/schema/one.tql` `src/lib/role-check.ts` `src/engine/persist.ts` `one/one-ontology.md` | `relation parent-group` + `fun ancestors-of`; `roleCheck` recurses. → child resolves ancestor chairman role |
| `sys-203` | 2 | M | — | 6/3 | `src/engine/persist.ts` `src/lib/trust.ts`(new) | Pre-LLM gate: claimed‖paid‖invited or dissolve. → untrusted actor: all signals dissolve until claim |
| `sys-204` | 2 | L | ‖ | 5/2 | `gateway/src/index.ts` `src/lib/ws-server.ts` | `BROADCAST_MASTER` secret; per-group = `HMAC(MASTER, group)`; validate pair. → leak grpA cannot fan grpB |
| `sys-205` | 2 | L | ‖ | 5/2 | `workers/sync/index.ts` `src/pages/api/signal.ts` | Targeted `/sync?keys=`; verify post-signal POST; doc 2s SLA. → KV reflects new state ≤2s p99 |
| `sys-301` | 3 | F | — | 9/8 | `gateway/` `wrangler.toml` `scripts/typedb-failover.ts`(new) `one/cloudflare.md` | Provision EU TypeDB replica; colo-aware Gateway routing; failover script. → EU 150→30ms; drill <2min |
| `sys-302` | 3 | F | ‖ | 6/3 | `src/schema/one.tql` `one/one-ontology.md` | Add `valid-from` `valid-to` `quota-bucket` attrs (NOT new dims) on actor/path/signal/thing. → TQL `match $x has quota-bucket "x", has valid-from > T;` works across all 4 |
| `sys-303` | 3 | M | ‖ | 5/4 | `src/schema/one.tql` `migrations/typedb/seed-roles.tql`(new) `src/lib/role-check.ts` | `relation role-permission`; seed = current matrix; `roleCheck` queries TypeDB w/ 60s KV cache; strip hardcoded matrix. → TQL change effective ≤60s w/o redeploy |
| `sys-304` | 3 | F | — | 7/5 | `src/move/one/sources/one.move` `src/engine/bridge.ts` `one/sui.md` | Move `GovernanceEvent`; `mirrorGovernance({chairman-grant,group-create,key-revoke,role-perm-change})`. → Sui tx ≤60s after TypeDB; replay-from-Sui = identical role state |

**Block chain:** `sys-201b`→sys-201 · `sys-203`→sys-202 · `sys-204`→sys-103 · `sys-301`→sys-101 · `sys-302`→sys-202 · `sys-304`→sys-201+sys-202+sys-303.

## W4 verify (every task)

`bun run verify` (biome+tsc+vitest) → run task's `Exit` clause → `markDims(id, {fit,form,truth,taste})`. Cycle gate ≥0.65 avg. Pass: `[x]` + unblock dependents. Fail: `warn(0.5)` + reopen. Last in tier: emit `system:hardened:t{N}` to `/api/signal`.

## Escape

rubric <0.50 ×2 → pause+RCA · effort 2× → re-tier · schema break → revert · TypeDB outage during sys-301 → roll back, signal `system:degraded`.

## See also

[system.md](system.md) · [DSL.md](dsl.md) · [dictionary.md](dictionary.md) · [rubrics.md](rubrics.md) · [one-ontology.md](one-ontology.md) · [governance-todo.md](governance-todo.md) · [sui.md](sui.md) · [cloudflare.md](cloudflare.md) · [template-plan.md](template-plan.md)

---

*16 gaps · 16 tasks · 9 lean (no recon) · 11 parallelizable · 3 cycles. Platform-held keys: 0 after C1.*
