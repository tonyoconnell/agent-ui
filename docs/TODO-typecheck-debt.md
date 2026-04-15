---
title: TODO Typecheck Debt — repair schema drift in RichMessage, Edge, Bounty
type: cleanup
version: 0.1.0
priority: Prove (unblock deterministic W0 gate)
total_tasks: 12
completed: 0
status: OPEN
---

# TODO: Typecheck Debt — RichMessage / Edge / Bounty drift

> **Time units:** plan in tasks → waves → cycles. Never days or hours.
>
> **Goal:** `bash scripts/typecheck.sh` exits 0 **without relying on tsc crashing early**. Today's state is flaky — when tsc runs to completion it surfaces 129 real `error TS####` across 25 files; when the recursive chef stack-overflows first, the gate passes by accident. Eliminate the real errors so W0 is deterministic again.
>
> **Source of truth:** [dictionary.md](dictionary.md) — canonical types; [DSL.md](DSL.md) — `RichMessage` contract; [rubrics.md](rubrics.md) — W4 scoring; [.claude/rules/engine.md](../.claude/rules/engine.md) — Rule 3 (Deterministic Results in Every Loop).
>
> **Shape:** 1 cycle, four waves. Haiku recons each drift domain, Opus decides a single canonical shape per type, Sonnet edits per file, Sonnet verifies.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `task` entity with `task-wave`, `task-context` ({RichMessage|Edge|Bounty|engine|tests}), `blocks` relation.

## Why This Exists

The deploy on 2026-04-16 for the `/chat-ad` typography polish hit W0 red. Investigation:

- **129 errors across 25 files** on clean `main` at commit `e2cb2db`.
- **Three independent drifts**, none introduced by the UI change:
  1. **`RichMessage` shape changed** — ~15 call sites still pass legacy fields (`receiver`, `id`, `filter`, `sid`, `from`, `provider`).
  2. **`Edge` lost `.from` / `.to` properties** — consumers in `src/engine/loop.ts:340` and 3 test files still destructure them.
  3. **`Bounty` was reshaped** — `status`, `deadline`, `price`, `rubric` removed from the type; `BountyCard.tsx` still reads all four.
- **W0 gate is flaky** — `scripts/typecheck.sh` only fails when tsc enumerates errors *before* stack-overflowing. The script correctly treats crashes as non-failing (known tsc 5.9 bug), but it means deploy success is noise, not signal. Rule 3 (Deterministic Results) is violated.

## Error Inventory (run `bash scripts/typecheck.sh 2>&1 | grep "error TS"` to refresh)

| File | Count | Drift |
|------|------:|-------|
| `src/components/Marketplace.tsx` | 3 | RichMessage (`filter`, `provider`) |
| `src/components/market/BountyCard.tsx` | ~12 | Bounty (`status`, `deadline`, `price`, `rubric`) + RichMessage |
| `src/components/market/BountyComposer.tsx` | 1 | RichMessage (payment) |
| `src/components/marketplace/OfferPanel.tsx` | 2 | RichMessage (`receiver`, empty `{}`) |
| `src/components/marketplace/ReceiptPanel.tsx` | 2 | RichMessage |
| `src/components/marketplace/MarketplaceHighways.tsx` | 1 | RichMessage (`from`) |
| `src/components/marketplace/EscrowBadge.tsx` | 1 | Promise type mismatch |
| `src/components/paths/PathOfferRow.tsx` | 3 | RichMessage (`sid`) |
| `src/components/AgentAd/AgentAd.tsx` | 1 | RichMessage (`receiver`) |
| `src/components/AgentAd/useAgentLifecycle.ts` | 6 | RichMessage + `unknown` body assertions |
| `src/components/dashboard/KpiCard.tsx` | 1 | RichMessage (`id`) |
| `src/components/graph/WorldEditor.tsx` | 5 | Duplicate `strength` property |
| `src/components/TaskBoard.tsx` | 1 | `TaskLike` vs `Task` variance |
| `src/engine/loop.ts` | 2 | Edge `.from` / `.to` gone |
| `src/engine/human.test.ts` | 12 | arity mismatch (1 arg expected, 2 passed) |
| `src/engine/loop.test.ts` | 1 | `r` is `unknown` |
| `src/engine/memory-api.test.ts` | 1 | string vs Record |
| `src/engine/recall.test.ts` | — | (confirm in W1) |
| `src/engine/subscribe.test.ts` | — | (confirm in W1) |
| `src/engine/task-sync.test.ts` | — | (confirm in W1) |
| `src/__tests__/integration/expire-recovery.test.ts` | 2 | null vs `unknown[]` |
| `src/__tests__/integration/harden.test.ts` | 7 | `body: unknown` assertions |
| `src/__tests__/integration/lifecycle-gates.test.ts` | 3 | Edge `.from` / `.to` |
| `src/__tests__/integration/register-wallet.test.ts` | ~10 | `body: unknown` assertions |
| `src/__tests__/integration/sync-guard.test.ts` | 1 | string lit not in `Value` union |

**Total:** 129 errors · 25 files · 3 schema drifts · 1 engine file (shipping code).

## Routing Diagram

```
        TODO-typecheck-debt
                │
    ┌───────────┼───────────┐
    │           │           │
 RichMessage   Edge       Bounty
 (~15 sites)  (3 sites)  (1 site, ~12 errs)
    │           │           │
    └───── tests (~30) ─────┘
                │
          engine/loop.ts ← critical: shipping code
                │
      W0 green → deploy unblocked deterministically
```

Signal flow: RichMessage fix **unlocks** 15 sites. Edge fix **unlocks** `loop.ts` (the only shipping engine file affected). Bounty fix is isolated to one component. Tests can be batched after shipping code is green.

## Waves

### Wave 1 — Recon (parallel Haiku, 4 shards)

| Task | Shard | What | Output |
|------|-------|------|--------|
| `tc.recon.rich` | RichMessage | Read `src/lib/chat/types.ts` + every `emitClick` call site. | Current RichMessage shape, list of legacy field usages with file:line |
| `tc.recon.edge` | Edge | Read `src/engine/world.ts` Edge type + `loop.ts:340` + tests. | Why `.from`/`.to` disappeared; what the new accessor is (likely a string split of `"a→b"` key) |
| `tc.recon.bounty` | Bounty | Read Bounty type + `BountyCard.tsx` + Composer. | New Bounty shape; which fields moved where (e.g., is `price` now on the signal payload?) |
| `tc.recon.misc` | Other | Read `WorldEditor.tsx`, `TaskBoard.tsx`, `EscrowBadge.tsx`, engine test arity mismatches. | One-line fix per site |

**Exit:** all four recon reports filed, every finding cites `file:line`.

### Wave 2 — Decide (Opus)

| Task | What | Output |
|------|------|--------|
| `tc.decide.rich` | Canonical RichMessage variants (text/payment/embed/...) — is the new shape a discriminated union? Decide one rewrite rule per legacy field. | Spec: `{receiver}` → `{type:'text', content: receiver}` etc. |
| `tc.decide.edge` | Edge: is it now `string` ("a→b") with helpers, or did it move to a new type name? | Spec: use `splitEdge(k)` / keep `from,to` but derived; or rewrite consumers to use raw key. |
| `tc.decide.bounty` | Bounty: is the page using the wrong type, or is the type behind? | Spec: either expand Bounty type or switch `BountyCard` to a richer `BountyView`. |

**Exit:** one diff spec per drift; every W1 finding has a spec or an explicit "keep" rationale.

### Wave 3 — Edit (parallel Sonnet, one per file)

| Task | File | Blocks |
|------|------|--------|
| `tc.edit.marketplace` | `Marketplace.tsx` | tc.decide.rich |
| `tc.edit.bounty-card` | `market/BountyCard.tsx` | tc.decide.bounty |
| `tc.edit.bounty-composer` | `market/BountyComposer.tsx` | tc.decide.rich |
| `tc.edit.offer-panel` | `marketplace/OfferPanel.tsx` | tc.decide.rich |
| `tc.edit.receipt-panel` | `marketplace/ReceiptPanel.tsx` | tc.decide.rich |
| `tc.edit.highways` | `marketplace/MarketplaceHighways.tsx` | tc.decide.rich |
| `tc.edit.escrow-badge` | `marketplace/EscrowBadge.tsx` | tc.decide.misc |
| `tc.edit.path-offer-row` | `paths/PathOfferRow.tsx` | tc.decide.rich |
| `tc.edit.agent-ad` | `AgentAd.tsx` + `useAgentLifecycle.ts` | tc.decide.rich |
| `tc.edit.kpi-card` | `dashboard/KpiCard.tsx` | tc.decide.rich |
| `tc.edit.world-editor` | `graph/WorldEditor.tsx` | tc.decide.misc |
| `tc.edit.task-board` | `TaskBoard.tsx` | tc.decide.misc |
| `tc.edit.engine-loop` | `engine/loop.ts` | tc.decide.edge |
| `tc.edit.tests-engine` | `engine/*.test.ts` (5 files) | tc.decide.rich + tc.decide.edge |
| `tc.edit.tests-integration` | `__tests__/integration/*.test.ts` (5 files) | tc.decide.rich + tc.decide.edge |

**Exit:** all anchors matched, zero files modified outside the spec set.

### Wave 4 — Verify (Sonnet)

| Task | What |
|------|------|
| `tc.verify.tsc` | `bash scripts/typecheck.sh` runs to completion (no crash OR crash after 0 real errors). Exit 0 AND zero `error TS####` lines in output. |
| `tc.verify.biome` | `bun run check` clean. |
| `tc.verify.tests` | `bun run test` green, no new failures. |
| `tc.verify.build` | `NODE_ENV=production bun run build` succeeds, bundle ≤ 10 MiB. |
| `tc.verify.deploy-dry` | `bun run deploy -- --dry-run` passes W0 deterministically on 3 consecutive runs (not a single lucky crash). |

**Exit:** all four rubric dims ≥ 0.65, `bun run verify` green, deploy dry-run consistently passes.

## Rubric Weights (W4)

- **Fit 0.25** — did we pick the right canonical shape, not just "make tsc happy"?
- **Form 0.15** — edits are minimal, no churn.
- **Truth 0.45** — **dominant** — does the code actually typecheck on disk, every run?
- **Taste 0.15** — no ugly `as any` escape hatches; rewrites read cleanly.

## Self-Checkoff

On W4 pass:
1. Mark this TODO `status: DONE` in frontmatter.
2. Emit `signal → task:done → tc.deploy-gate.restored` with `mark(chainDepth)`.
3. Unblock: future deploys use W0 as a real gate again (no more `--skip-tests` escape hatch).

## See Also

- [.claude/rules/engine.md](../.claude/rules/engine.md) — Rule 3: Deterministic Results in Every Loop
- [.claude/commands/deploy.md](../.claude/commands/deploy.md) — the 8-step pipeline this unblocks
- [dictionary.md](dictionary.md) — canonical types
- [DSL.md](DSL.md) — RichMessage contract (authoritative)
- [rubrics.md](rubrics.md) — fit/form/truth/taste weighting
- [TODO-template.md](TODO-template.md)
- [TODO-task-management.md](TODO-task-management.md)

---

*W0 must be a real gate. Today it passes on luck (tsc crashes first); tomorrow it should pass on truth (no errors to find).*
