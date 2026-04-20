---
title: TODO CLAUDE — Upgrade all CLAUDE.md files across every folder and dimension
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 24
completed: 0
status: OPEN
---

# TODO: CLAUDE.md Total Upgrade

> **Time units:** tasks → waves → cycles only.
>
> **Parallelism directive:** 12 CLAUDE.md files = 12 parallel agents per wave.
> W1: 12 Haiku (1 per file). W2: 2 Opus shards (by folder group).
> W3: 12 Sonnet editors (1 per file, never batch). W4: 2 Sonnet verifiers.
>
> **Goal:** Every CLAUDE.md file carries the full canonical context set,
> accurate file tables, correct dimension awareness, and commerce integration —
> so any task in any folder automatically has the right docs in context.
>
> **Source of truth:**
> [DSL.md](one/DSL.md) — the signal language,
> [dictionary.md](dictionary.md) — everything named,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark),
> [buy-and-sell.md](buy-and-sell.md) — trade mechanics (commerce tasks),
> [revenue.md](one/revenue.md) — five revenue layers (pricing tasks)
>
> **Shape:** 2 cycles. C1 audits all 12 files and produces diff specs.
> C2 edits all 12 in parallel and verifies. No cycle starts without W0 green.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `skill` for capability routing.

---

## Routing Diagram

```
signal DOWN                      result UP             feedback UP
──────────                       ─────────             ───────────
/do TODO-CLAUDE.md               rubric marks          tagged strength
     │                                │                → substrate
     ▼                                │
┌──────────────────────────────────────────┐
│  W1: 12 × Haiku (1 per CLAUDE.md file)   │
│  Read → gap report (verbatim + line #)   │
└──────┬───────────────────────────────────┘
       │ 12 gap reports → main ctx
       ▼
┌──────────────────────────────────────────┐
│  W2: 2 × Opus shards                     │
│  Shard A: engine/schema/lib/hooks        │
│  Shard B: pages/api/components/gateway   │
│  + cli rewrite + packages + docs         │
│  → diff specs: {anchor, action, new}     │
└──────┬───────────────────────────────────┘
       │ 24 diff specs → W3 agents
       ▼
┌──────────────────────────────────────────┐
│  W3: 12 × Sonnet (1 file each)           │
│  Apply diff specs → edited CLAUDE.md     │
│  One anchor = one file. Never batch.     │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  W4: 2 × Sonnet verifiers                │
│  Shard A: cross-ref consistency check    │
│  Shard B: canonical doc coverage + voice │
└──────────────────────────────────────────┘
```

---

## The 12 Target Files

| # | File | Last Status | Key Gap |
|---|------|-------------|---------|
| 1 | `CLAUDE.md` (root) | Comprehensive | Commerce already in Skills table; verify Quick Start + dimension table |
| 2 | `src/engine/CLAUDE.md` | Updated 2026-04-16 | Commerce added; verify file table is current |
| 3 | `src/schema/CLAUDE.md` | Updated 2026-04-16 | Commerce added; add dimension awareness to entity types table |
| 4 | `src/lib/CLAUDE.md` | Updated 2026-04-16 | Commerce added; minimal — expand Substrate Learning |
| 5 | `src/pages/CLAUDE.md` | Updated 2026-04-16 | Commerce added; verify route table complete |
| 6 | `src/pages/api/CLAUDE.md` | Updated 2026-04-16 | Commerce added; add lifecycle.md to See Also |
| 7 | `src/components/CLAUDE.md` | Updated 2026-04-16 | Commerce added; stale TaskBoard example code |
| 8 | `src/hooks/CLAUDE.md` | NOT updated | Only 2 context refs; missing 5 canonical docs |
| 9 | `docs/CLAUDE.md` | Updated 2026-04-16 | Commerce added; looks complete |
| 10 | `gateway/CLAUDE.md` | Updated 2026-04-16 | Needs buy-and-sell.md (gateway proxies cheapest_provider); stale deploy hash |
| 11 | `cli/CLAUDE.md` | **WRONG PROJECT** | Entire file is from a different codebase (Convex/web). Full rewrite needed. |
| 12 | `packages/typedb-inference-patterns/CLAUDE.md` | NOT updated | Missing commerce, lifecycle, buy-and-sell, revenue |

---

## What "Fully Upgraded" Looks Like

Every CLAUDE.md must pass all of these:

### C1 — Context Completeness

Every file's **Context** line (or See Also) must include:

| Doc | Required in | Rationale |
|-----|------------|-----------|
| `DSL.md` | ALL | Signal grammar — the universal primitive |
| `dictionary.md` | ALL | Canonical names — dead names cause divergence |
| `routing.md` | ALL | The deterministic sandwich |
| `rubrics.md` | ALL except packages | Quality scoring drives mark/warn |
| `lifecycle.md` | engine, schema, api, pages, lib | Into/through/out arc |
| `buy-and-sell.md` | engine, schema, api, pages, lib, components, gateway | Commerce mechanics |
| `revenue.md` | engine, schema, api, pages, lib, components, gateway | Five revenue layers |
| `speed.md` | engine, schema, lib, components, gateway | Benchmarks |
| `patterns.md` | engine, schema, packages | 10 emergent patterns |

### C2 — File Table Accuracy

Every file table must reflect **current disk state**:
- No files listed that no longer exist
- No files that exist and are missing from the table
- Purpose descriptions current (not referencing deleted patterns)

### C3 — Substrate Learning Connection

Each Substrate Learning section must explicitly name **which loop(s)** the folder participates in:

| Folder | Loops | Connection |
|--------|-------|------------|
| `src/engine/` | L1-L3 | signal→mark→fade (nervous system) |
| `src/schema/` | L4-L7 | brain: TypeDB classification, evolution, knowledge |
| `src/lib/` | L1-L7 | synapse: bridges nervous system to brain |
| `src/pages/api/` | L1-L7 | surface: every endpoint runs one or more loops |
| `src/pages/` | L1 surface | displays learning state in real time |
| `src/components/` | L1 surface | visualizes highways, resistance, rubric dims |
| `src/hooks/` | L1 surface | reactive values from substrate state |
| `docs/` | L4-L7 | training data for evolution + knowledge loops |
| `gateway/` | L1 (routing) | every proxied query = one L1 iteration |
| `cli/` | L1-L7 (orchestrator) | CLI triggers loops, reads results |
| `packages/typedb-inference-patterns/` | L4-L7 (reference) | patterns that emerge from the 6 lessons |

### C4 — cli/CLAUDE.md Full Rewrite

The current `cli/CLAUDE.md` is entirely from a **different project** (ONE Platform with Convex backend, `/web/`, `/backend/` paths). It references files that don't exist in this repository.

The rewrite must describe the actual `cli/` folder contents:
- What the CLI does (substrate orchestration — `/deploy`, `/sync`, `/do`, etc.)
- How CLI commands map to L1-L7 loops
- Context links to the 7 canonical docs
- Correct file table for `cli/` contents

---

## Deliverables

### Wave Deliverables

| Wave | Deliverable | Goal | Rubric weights | Exit |
|------|-------------|------|----------------|------|
| **W1** | 12 gap reports | Inventory every missing context ref, stale line, wrong loop reference | 0.15/0.10/**0.65**/0.10 | Every finding cites file:line; all 12 reports returned |
| **W2** | 24 diff specs | `{file, anchor, action, new_content, rationale}` for every gap found | **0.40**/0.15/**0.35**/0.10 | Every W1 finding covered by a spec or explicit "keep" |
| **W3** | 12 edited CLAUDE.md files | Apply specs; all targets match C1-C4 criteria | 0.30/0.25/**0.35**/0.10 | Every anchor matched; zero files edited outside spec set |
| **W4** | Consistency report | Prove: all 12 files have correct context set; no dead links; voice consistent | 0.25/0.15/**0.45**/0.15 | Rubric ≥ 0.65 all dims AND grep confirms canonical doc coverage |

### Cycle Deliverables

```
DELIVERABLE: 12 upgraded CLAUDE.md files
PATH:        {each file path as listed in The 12 Target Files}
GOAL:        Every session in every folder loads the full canonical context set automatically
CONSUMERS:   Every future Claude Code session in this repo
RUBRIC:      fit=0.35 form=0.20 truth=0.30 taste=0.15
EXIT:        grep -r "buy-and-sell.md" src/engine/CLAUDE.md src/schema/CLAUDE.md ... returns match for all required files
SKILL:       docs:claude-upgrade
```

---

## Wave Execution

### W0 — Baseline (run before C1)

```bash
npm run verify
# Expected: 820/820 tests pass, biome clean, tsc known-crash only
# Record: test count, any new failures
```

---

## CYCLE 1: AUDIT
*Goal: Read all 12 CLAUDE.md files, produce gap reports and diff specs.*

```
W1: 12 Haiku agents reading in parallel
W2: 2 Opus agents producing diff specs
```

### W1 — Recon: 12 × Haiku (spawn in one message)

Each agent reads ONE CLAUDE.md and reports:

**For each file, answer:**
1. Which canonical docs are in the Context line? Which are missing?
2. File table: list any files referenced that don't exist on disk (verify with Glob)
3. Loop connection: which loops are mentioned? Are they correct for this folder?
4. Commerce: does it reference buy-and-sell.md AND revenue.md?
5. Skills line: are the skill names correct (`/typedb`, `/react19`, `/astro`, `/sui`, `/deploy`, `/reactflow`, `/shadcn`)?
6. For `cli/CLAUDE.md`: flag as FULL REWRITE — wrong project content

**Report format:**
```
FILE: {path}
MISSING_CONTEXT: [doc1, doc2, ...]
STALE_LINES: [{line: N, text: "...", issue: "..."}]
LOOP_GAPS: [{loop: "L4", missing: true}]
COMMERCE_STATUS: {buy_and_sell: bool, revenue: bool}
SKILLS_STATUS: {correct: [], wrong: [], missing: []}
REWRITE: bool
```

#### W1 Agents (spawn all 12 in one message)

| Agent | Target | Anchor |
|-------|--------|--------|
| W1-1 | `CLAUDE.md` (root) | Context in Skills/docs table; Quick Start commands |
| W1-2 | `src/engine/CLAUDE.md` | Context line; Files table; commerce lines added |
| W1-3 | `src/schema/CLAUDE.md` | Context line; Entity Types table; Routing Functions |
| W1-4 | `src/lib/CLAUDE.md` | Context line; Files table; Connection Modes |
| W1-5 | `src/pages/CLAUDE.md` | Context line; Routes table; Substrate Learning |
| W1-6 | `src/pages/api/CLAUDE.md` | See Also; all route tables; signal shape |
| W1-7 | `src/components/CLAUDE.md` | Context line; Key Components table; TaskBoard code |
| W1-8 | `src/hooks/CLAUDE.md` | Context line; Files table; scope of hooks |
| W1-9 | `docs/CLAUDE.md` | Substrate Learning block; Code-Doc Link table |
| W1-10 | `gateway/CLAUDE.md` | Context line; Routes table; Last Deploy timestamp |
| W1-11 | `cli/CLAUDE.md` | FULL REWRITE — identify current cli/ folder contents |
| W1-12 | `packages/typedb-inference-patterns/CLAUDE.md` | Context line; commerce; lifecycle |

### W2 — Decide: 2 × Opus shards

Fold W1 gap reports into diff specs. One spec per gap found.

**Shard A** (engine, schema, lib, hooks, packages):
- Fold W1-2, W1-3, W1-4, W1-8, W1-12 findings
- For each gap: produce `{file, anchor, action: "add|replace|remove", new_content, rationale}`
- For `src/hooks/CLAUDE.md`: minimal but complete — don't over-engineer

**Shard B** (pages, api, components, gateway, cli, root, docs):
- Fold W1-1, W1-5, W1-6, W1-7, W1-9, W1-10, W1-11 findings
- Special handling: W1-11 (cli) produces a FULL FILE SPEC, not a diff
- cli/ rewrite spec must describe the actual CLI tool in this repo

**Diff spec format:**
```
SPEC-{N}:
  FILE: src/hooks/CLAUDE.md
  ANCHOR: "**Context:**"
  ACTION: replace
  NEW: "**Context:** [DSL.md] ... [buy-and-sell.md] ... [revenue.md] ..."
  RATIONALE: "hooks expose pheromone + highway state; weight is payment"
```

---

## CYCLE 2: UPGRADE
*Goal: Apply all diff specs in parallel, verify consistency.*

```
W3: 12 Sonnet editors (one per file)
W4: 2 Sonnet verifiers
```

### W3 — Edit: 12 × Sonnet (spawn all 12 in one message)

Each agent owns ONE file. Apply its diff specs from W2. Never edit outside the spec set.

**Constraint:** One agent, one file, one message per anchor. If two specs touch the same file, apply both in sequence within the same agent.

| Agent | File | Source specs |
|-------|------|-------------|
| W3-1 | `CLAUDE.md` (root) | Shard B specs for root |
| W3-2 | `src/engine/CLAUDE.md` | Shard A specs |
| W3-3 | `src/schema/CLAUDE.md` | Shard A specs |
| W3-4 | `src/lib/CLAUDE.md` | Shard A specs |
| W3-5 | `src/pages/CLAUDE.md` | Shard B specs |
| W3-6 | `src/pages/api/CLAUDE.md` | Shard B specs |
| W3-7 | `src/components/CLAUDE.md` | Shard B specs |
| W3-8 | `src/hooks/CLAUDE.md` | Shard A specs |
| W3-9 | `docs/CLAUDE.md` | Shard B specs |
| W3-10 | `gateway/CLAUDE.md` | Shard B specs |
| W3-11 | `cli/CLAUDE.md` | Full rewrite spec from Shard B |
| W3-12 | `packages/typedb-inference-patterns/CLAUDE.md` | Shard A specs |

### W4 — Verify: 2 × Sonnet (spawn both in one message)

**Verifier A — Cross-reference consistency:**
- For each file in the required matrix (C1), grep that the doc is present
- Flag any context line missing a required canonical doc
- Check that no doc listed has a broken relative path (`../../docs/X.md` exists)
- Report: `{file, missing_refs: [], broken_paths: []}`

**Verifier B — Voice + accuracy:**
- Check `cli/CLAUDE.md` rewrite: does it describe the actual CLI tool, not Convex?
- Check all file tables: do listed files exist? (`Glob` each)
- Check loop references match the folder's actual participation
- Check commerce lines are present in the required 8 files
- Report: `{file, stale_files: [], wrong_loops: [], commerce_missing: bool}`

---

## Task List

### C1 Tasks

| ID | Task | Phase | Value | Effort | Blocks | Exit | Tags |
|----|------|-------|-------|--------|--------|------|------|
| CL-01 | W1 parallel recon: 12 agents × 12 CLAUDE.md files | C1-W1 | critical | S | CL-02 | 12 gap reports returned | claude,recon |
| CL-02 | W2 Opus fold: Shard A (engine/schema/lib/hooks/packages) | C1-W2 | critical | M | CL-03 | diff specs for 5 files | claude,decide |
| CL-03 | W2 Opus fold: Shard B (pages/api/components/gateway/cli/root/docs) | C1-W2 | critical | M | CL-04 | diff specs for 7 files | claude,decide |

### C2 Tasks

| ID | Task | Phase | Value | Effort | Blocks | Exit | Tags |
|----|------|-------|-------|--------|--------|------|------|
| CL-04 | W3 parallel edit: 12 agents × 12 files (all specs applied) | C2-W3 | critical | L | CL-05 | all 12 files match C1-C4 criteria | claude,edit |
| CL-05 | W4 verify: cross-ref consistency (Verifier A) | C2-W4 | high | S | CL-06 | zero missing required docs | claude,verify |
| CL-06 | W4 verify: voice + accuracy (Verifier B) | C2-W4 | high | S | — | zero stale files, cli rewrite confirmed | claude,verify |

---

## Exit Conditions

### C1 done when:
- [ ] All 12 W1 gap reports returned with file:line citations
- [ ] All W2 diff specs cover every gap OR have explicit "keep" rationale
- [ ] `cli/CLAUDE.md` full rewrite spec exists

### C2 done when:
- [ ] All 12 CLAUDE.md files edited per spec
- [ ] Every required (file, doc) pair in the C1 matrix passes grep
- [ ] `cli/CLAUDE.md` describes the ONE substrate CLI, not Convex/web
- [ ] No broken relative doc paths (`../../docs/X.md` exists for each)
- [ ] `npm run verify` still green (820/820 — CLAUDE.md edits can't break tests)

---

## See Also

- [DSL.md](one/DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names
- [routing.md](routing.md) — how tasks route through waves
- [rubrics.md](rubrics.md) — quality scoring
- [buy-and-sell.md](buy-and-sell.md) — commerce mechanics
- [revenue.md](one/revenue.md) — five revenue layers
- [lifecycle.md](one/lifecycle.md) — agent career arc
- [TODO-template.md](one/TODO-template.md) — wave structure template
- [docs/CLAUDE.md](CLAUDE.md) — docs folder rules

---

*12 files. 2 cycles. Fan out every wave. Every session in every folder gets the full context.*
