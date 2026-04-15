---
title: TODO One Big Group — deferred; scope-A shipped instead
type: roadmap
version: 1.1.0
priority: SUPERSEDED — see Run Log 2026-04-15
total_tasks: 8
completed: 3
status: SCOPE-A-SHIPPED (full containment model deferred pending real use case)
last_run: 2026-04-15 — scope A (thing-owner attribute) shipped; nested-group recursion deferred
---

> **Decision (2026-04-15):** after W1 recon exposed a 30-file rename surface
> and no existing recursive-TypeDB precedent in this codebase, shipped the
> minimal "scope A" fix: `thing owns owner` attribute + first-save-establishes
> ownership in `brand/save.ts`. The full "one big group" recursive-containment
> vision stays valid as an ontology statement — just doesn't need to be the
> enforcement mechanism until a real use case proves attribute-compare isn't
> enough.
>
> **What shipped:** `src/schema/one.tql` (+`owns owner` on thing, +attribute
> declaration), `src/pages/api/brand/save.ts` (thing-scope ownership guard:
> first-save stamps, later saves must match), `src/pages/api/brand/save.test.ts`
> (+3 thing-scope tests: first-save / match / mismatch→403). 11/11 save tests
> pass, audit held, tsc clean on this subtree.
>
> **Future cycle (deferred, not scheduled):** nested `contains` recursion +
> membership→contains rename. Revisit when a use case needs transitive team
> permissions or multi-group shared assets.

# TODO: One Big Group

> **Principle:** the world is one big group. Groups contain groups,
> actors, things, hypotheses. Paths and events inherit scope from their
> endpoints. Access is reachability through `contains`.
>
> **Source of truth:** this TODO, [one.tql](../src/schema/one.tql),
> [naming.md](naming.md), [one-ontology.md](one-ontology.md).
>
> **Defaults locked** (user confirmation 2026-04-15):
> - **A:** paths/events inherit endpoint scope; hypotheses are explicitly contained.
> - **B:** rename `membership` → `contains` (all call sites migrated this cycle).
> - **C:** mandatory migration — seed one `root` group, every existing
>   entity becomes its descendant unless already grouped.

## The model

```
root (group, gid="root")
  ├─ contains actor Alice
  ├─ contains thing Logo
  ├─ contains hypothesis "blue renders fast"
  └─ contains group Marketing
       ├─ contains actor Bob
       ├─ contains thing Campaign-2026
       └─ contains group Design-Squad
            └─ contains thing Brand-Purple
```

Access check: `reachable(session-user, target)` via `contains*`.
Depth cap: 8 hops.

## Routing

```
   W1 (Haiku × 3 parallel):
     R1 callers of `membership` relation (engine + API + tests)
     R2 TypeDB 3.x function syntax for recursive reachability (repo examples)
     R3 existing migration scripts (pattern for idempotent TQL migrations)
        ▼
   W2 (Opus main): 6-8 edit specs
        ▼
   W3 (Sonnet × N parallel):
     E1 schema: rename membership→contains, widen role-players,
        add reachable() function in one.tql
     E2 migration script: seed root, migrate existing data
     E3 engine/persist.ts: update .group()/.actor()/.thing() to use contains
     E4 api/brand/save.ts: unify group+thing scope via reachable()
     E5 api/brand/save.test.ts: un-skip thing-scope ownership, add reachable tests
     E6 docs/naming.md + docs/one-ontology.md: update for containment
        ▼
   W4 (Sonnet verify): bun run verify green, rubric ≥ 0.65
```

## Testing

```
   W0: bun run verify (56/56 brand+signals tests, tsc, biome, audit 333)
   W4: bun run verify + migration dry-run

   Regression gates:
   - 56/56 brand tests still pass
   - No new biome / tsc errors
   - Audit ≤ 333
   - New tests: reachable() function, thing-scope ownership, migration idempotence
```

## Cycle 1: ONE BIG GROUP

### Wave 1 — Recon (Haiku × 3, parallel, read-only)

| Agent | Target | Report |
|-------|--------|--------|
| R1 | `membership` callers | Every file:line in src/, scripts/, nanoclaw/. Classify: schema definition, TQL query, engine code, test, doc. |
| R2 | TypeDB 3.x `fun` syntax for graph traversal | Existing `fun` definitions in src/schema/*.tql. Depth-cap patterns. Can functions be recursive? Examples of reachability or path-finding. |
| R3 | Existing TypeDB migrations | scripts/migrate-* patterns (idempotent? how are they invoked? how do they detect "already applied"?). |

### Wave 2 — Decide (Opus, main)

Specs for W3 edits (6 parallel).

### Wave 3 — Edits (Sonnet × 6, parallel)

| # | File | Change |
|---|------|--------|
| E1 | `src/schema/one.tql` | Rename `membership` → `contains`; widen `contained` to actor\|thing\|group\|hypothesis; add `fun reachable($from, $to) -> bool` with depth cap |
| E2 | `scripts/migrate-to-contains.ts` | Create root group; migrate every membership row; place ungrouped entities as root children; idempotent |
| E3 | `src/engine/persist.ts` | Replace membership TQL with contains; add `.contains(container, contained)` helper |
| E4 | `src/pages/api/brand/save.ts` | Replace group-only membership query with reachable() for both thing and group scope |
| E5 | `src/pages/api/brand/save.test.ts` | Un-skip thing-scope ownership test; add reachable mocks |
| E6 | `docs/naming.md` + `docs/one-ontology.md` | Update canonical names, mark membership deprecated |

### Wave 4 — Verify

```bash
bun run verify
bun run scripts/migrate-to-contains.ts --dry-run
```

Gate: all green, rubric ≥ 0.65, migration dry-run shows expected row count.

---

## Status

- [ ] **Cycle 1: ONE BIG GROUP**
  - [ ] W1 — Recon (Haiku × 3, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 6, parallel)
  - [ ] W4 — Verify

---

## See Also

- [TODO-design-system-hardening.md](TODO-design-system-hardening.md) — the predecessor; motivated this by surfacing the thing-ownership schema gap
- [naming.md](naming.md) — canonical names (must update)
- [one-ontology.md](one-ontology.md) — 6 dimensions (must update dimension 1 description)
- [DSL.md](DSL.md) — signal grammar
- [rubrics.md](rubrics.md) — scoring

---

*One relation. Six dimensions. One scope for everything.*
