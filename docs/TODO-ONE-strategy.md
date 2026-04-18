---
title: ONE Strategy — Chairman Hires CEO Hires Team
type: roadmap
version: 2.0.0
priority: Wire → Prove → Grow
total_tasks: 12
completed: 0
status: ACTIVE
---

# TODO: ONE-strategy

> **Goal:** A human chairman clicks once. A CEO gets hired. The CEO hires the
> rest of the team autonomously. The org builds itself. That's the whole play.
>
> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks. Width = tasks-per-wave. Depth = waves-per-cycle. (engine.md rule 2.)
>
> **Source of truth:**
> [ONE-strategy.md](ONE-strategy.md) — the CEO control model (lines 261-312),
> [DSL.md](DSL.md) — `{ receiver, data }` signal grammar,
> [dictionary.md](dictionary.md) — unit/signal/path canonical names,
> [rubrics.md](rubrics.md) — fit/form/truth/taste scoring,
> [autonomous-orgs.md](autonomous-orgs.md) — recursive org formation pattern,
> [lifecycle-one.md](lifecycle-one.md) — 10-stage user funnel
>
> **Schema:** Tasks map to `world.tql` dimension 3b (`skill` entity).
> Every hire creates a `unit` + `capability` relation. Every Chairman action
> signals `ceo:hire`, which recursively fans out via CEO `.on('hire')`.

---

## The One Flow (every task serves this)

```
  Chairman (human, holds purse)
      │ click "Hire CEO"
      │ signal: { receiver: 'ceo:hire', data: { role: 'CEO', spec: <md> } }
      ▼
  /api/chairman/hire  →  syncAgent(ceo.md)  →  CEO unit exists
      │
      │ Chairman now sees CEO card. Reputation = 0 (no paths yet).
      │
      ▼
  Chairman signals: { receiver: 'ceo:build-team', data: { budget: $X } }
      │
      ▼
  CEO.on('build-team')
      │ for each role in [CTO, CMO, CFO]:
      │   emit({ receiver: 'ceo:hire', data: { role, spec: template(role) } })
      │
      ▼
  3 directors appear. Each inherits .on('hire'). Recursion begins.
      │
      ▼
  Directors hire workers. Workers hire specialists. Org materialises.
      │
      ▼
  Chairman's dashboard shows the tree live (WS from gateway).
  Every edge has strength/resistance. isToxic() blocks bad hires.
  Every hire is a path. Every path compounds.
```

**One human click → N recursive hires. Width scales by wave.**

---

## Cycle 1: WIRE — Chairman sees, Chairman hires CEO

**Scope:** `/chairman` page, `/api/chairman/hire`, `agents/roles/ceo.md`.
**Why first:** Without the front door, no CEO ever gets hired. This is the
only surface a paying human touches directly. Everything else downstream is
agent-to-agent routing.

- [ ] Write `agents/roles/ceo.md` — CEO persona markdown (model, system prompt, skills)
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: chairman-can-hire
  exit: File exists, parses via `parse()` into valid AgentSpec with skills=[`hire`, `build-team`, `delegate`]
  tags: agent, foundation, P0, ceo

- [ ] Build `/api/chairman/hire` endpoint — POST reads role markdown, calls `syncAgent`
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: chairman-can-hire
  exit: `curl -X POST /api/chairman/hire -d '{"role":"ceo"}'` returns `{unit, paths:[]}`; unit visible in `/api/units`
  tags: api, integration, P0, ceo

- [ ] Build `/chairman` page — Astro shell + React island, single "Hire CEO" button
  value: critical
  effort: medium
  phase: C1
  persona: ceo
  blocks: chairman-sees-dashboard
  exit: Page at `localhost:4321/chairman` renders; button POSTs to `/api/chairman/hire`; CEO card appears post-hire
  tags: ui, astro, P0, ceo

- [ ] Wire Chairman identity gate — wallet-sign-in, chairman owns CEO via `capability` relation
  value: critical
  effort: medium
  phase: C1
  persona: ceo
  blocks: chairman-can-hire
  exit: CEO's `capability` has `owner: chairman-wallet-addr`; only that wallet can emit `ceo:fire` or `ceo:build-team`
  tags: auth, sui, P0, ceo, security

### Cycle 1 Gate

```bash
curl -X POST http://localhost:4321/api/chairman/hire \
  -H "Content-Type: application/json" \
  -d '{"role":"ceo","owner":"0x..."}' | jq '.unit.uid == "ceo"'
# Expected: true
curl http://localhost:4321/api/units | jq '.units | map(.uid) | contains(["ceo"])'
# Expected: true
```

---

## Cycle 2: PROVE — CEO hires team on command

**Scope:** CEO `hire` and `build-team` skills, role templates for
directors, chairman → CEO → directors signal chain.
**Why second:** Recursive hiring without a working single hire is unprovable.
Cycle 1 must be live before we test fan-out.

- [ ] Implement CEO `.on('hire')` — takes `{ role, spec }`, calls `syncAgent`, returns unit id
  value: critical
  effort: medium
  phase: C2
  persona: dev
  blocks: ceo-builds-team
  exit: `net.ask({receiver:'ceo:hire', data:{role:'cto', spec:'<md>'}})` → `{result: 'cto'}`; `cto` unit live
  tags: engine, recursion, P0, ceo

- [ ] Write `agents/roles/{cto,cmo,cfo}.md` — three director personas
  value: critical
  effort: low
  phase: C2
  persona: dev
  blocks: ceo-builds-team
  exit: All three files parse; each has `.on('hire')` skill in spec
  tags: agent, foundation, P0, team

- [ ] Implement CEO `.on('build-team')` — fans out 3 `ceo:hire` signals for cto/cmo/cfo
  value: critical
  effort: medium
  phase: C2
  persona: dev
  blocks: ceo-builds-team
  exit: Single signal to `ceo:build-team` results in 3 new units; Chairman's `/api/units` count +3
  tags: engine, fan-out, P0, ceo

- [ ] Show live org tree on `/chairman` — ReactFlow tree, nodes stream via WS (`wsManager` → Gateway DO)
  value: high
  effort: medium
  phase: C2
  persona: ceo
  blocks: chairman-sees-tree
  exit: Click "Build Team" → 3 director nodes animate in under 5s; each node shows strength/resistance counter
  tags: ui, reactflow, ws, P0, ceo

### Cycle 2 Gate

```bash
# Fire the chain
curl -X POST http://localhost:4321/api/signal \
  -d '{"signal":{"receiver":"ceo:build-team","data":{"budget":1000}}}'
# Expect within 10s:
curl http://localhost:4321/api/units | jq '.units | map(.uid) | contains(["ceo","cto","cmo","cfo"])'
# Expected: true
curl http://localhost:4321/api/highways | jq '.highways | map(.from) | contains(["ceo"])'
# Expected: true — edges ceo→cto, ceo→cmo, ceo→cfo with strength > 0
```

---

## Cycle 3: GROW — Team hires workers, pheromone routes the rest

**Scope:** Every hired unit inherits `.on('hire')`, directors build sub-teams,
`isToxic()` blocks bad hires, pheromone learns which role templates produce
productive units.
**Why third:** Without a proven single hire (C1) and a proven fan-out (C2),
recursion just multiplies failure. C3 turns the substrate loose.

- [ ] Make `.on('hire')` a default persona skill — every `syncAgent()` output gets it for free
  value: critical
  effort: medium
  phase: C3
  persona: dev
  blocks: recursive-org
  exit: `parse(anyMarkdown).skills` includes `hire`; every unit in `/api/units` can receive `:hire`
  tags: engine, recursion, P0, foundation

- [ ] Wire `isToxic()` pre-check into `ceo:hire` — block hires to toxic role templates
  value: high
  effort: low
  phase: C3
  persona: dev
  blocks: recursive-org
  exit: A role template with resistance ≥ 10 AND > 2× strength returns `{dissolved: true}`; no `syncAgent` called; $0 LLM cost
  tags: engine, safety, P0, substrate

- [ ] Record hire pheromone — `mark(chairman→ceo, 1)`, `mark(ceo→cto, 1)` on each successful hire
  value: high
  effort: low
  phase: C3
  persona: dev
  blocks: learning-live
  exit: After 10 successful org builds, `highways(5)` shows chairman→ceo at top; toxic paths appear in `/see toxic`
  tags: engine, learning, P0, substrate

- [ ] End-to-end test — 1 chairman click builds full 13-unit org in <30s
  value: critical
  effort: medium
  phase: C3
  persona: dev
  blocks: strategy-complete
  exit: Test in `tests/chairman-hire-chain.test.ts`: chairman→CEO→3 directors→9 workers; asserts unit count, edge count, no toxicity false-positives
  tags: test, e2e, P0, ceo

### Cycle 3 Gate

```bash
bun test tests/chairman-hire-chain.test.ts
# Expected: passing — 13 units created, 12 edges marked, 0 toxic false-positives,
#           wall-clock under 30s
```

---

## Deliverables (all cycles)

| # | Deliverable | Cycle | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|:-----:|------|-------------------------------|------|-------|
| 1 | `agents/roles/ceo.md` | C1 | CEO persona, hirable by chairman | 0.45/0.20/0.25/0.10 | `parse()` returns valid spec | `chairman:write-ceo-md` |
| 2 | `/api/chairman/hire` | C1 | POST creates unit from role template | 0.40/0.15/0.35/0.10 | 200 OK, unit in `/api/units` | `chairman:hire` |
| 3 | `/chairman` page | C1 | Single-click dashboard | 0.30/0.30/0.20/0.20 | Button click → unit appears | `chairman:dashboard` |
| 4 | Wallet identity gate | C1 | Only owner can `:fire` or `:build-team` | 0.35/0.10/0.45/0.10 | 401 on unauthorized signal | `chairman:auth` |
| 5 | CEO `.on('hire')` | C2 | Recursive hire primitive | **0.50/0.15/0.25/0.10** | `ask()` returns new unit id | `ceo:hire` |
| 6 | Director markdowns (cto/cmo/cfo) | C2 | Sub-team role templates | 0.45/0.20/0.25/0.10 | All three parse + syncAgent | `ceo:write-director-md` |
| 7 | CEO `.on('build-team')` | C2 | Fan-out primitive | 0.45/0.15/0.30/0.10 | One signal → 3 new units | `ceo:build-team` |
| 8 | Live org tree UI | C2 | Real-time visualization | 0.30/0.30/0.20/0.20 | WS pushes node additions in <5s | `chairman:see-tree` |
| 9 | `.on('hire')` as default skill | C3 | Recursion primitive | **0.50/0.15/0.25/0.10** | Every unit inherits it | `engine:default-skills` |
| 10 | `isToxic()` pre-check on hire | C3 | Safety sandwich | 0.35/0.10/0.45/0.10 | Toxic template → dissolved, $0 | `engine:safe-hire` |
| 11 | Hire pheromone marking | C3 | Path strength on every hire | 0.35/0.15/0.40/0.10 | `highways(5)` shows hire paths | `engine:mark-hire` |
| 12 | Chairman E2E test | C3 | Full 13-unit org in <30s | 0.25/0.15/**0.50**/0.10 | Test passes | `chairman:e2e-test` |

---

## Routing

```
  signal DOWN                     result UP            feedback UP
  ──────────                      ─────────            ───────────
  chairman (human)                                      tagged strength
      │                                                 back to path
      │ POST /api/chairman/hire                              ▲
      ▼                                                      │
  ┌─────────┐                                                │
  │ W1 Recon│ Haiku × 4 (agents/roles/*, api/, schema/, UI) │
  └────┬────┘          mark(edge:truth) ─────────────────────┤
       │                                                     │
       ▼                                                     │
  ┌─────────┐                                                │
  │ W2 Decide│ Opus × 1-2 (few findings, likely 1 shard)    │
  └────┬────┘          mark(edge:fit) ────────────────────── ┤
       │                                                     │
       ▼                                                     │
  ┌─────────┐                                                │
  │ W3 Edit │ Sonnet × M (M = files touched per cycle)      │
  └────┬────┘          mark(edge:form) ────────────────────  ┤
       │                                                     │
       ▼                                                     │
  ┌─────────┐                                                │
  │ W4 Verify│ Sonnet × 2 (consistency, E2E)                 │
  │          │    → rubric: fit/form/truth/taste             │
  │          │    → feedback signal ──────────────────────── ┘
  └─────────┘     { tags: ['ceo', 'hire', 'recursion'],
                    strength: rubricAvg }
```

**Why rubric weights skew fit-heavy on deliverables #5 and #9:** those are
the recursion pivots. Getting the shape right matters more than getting the
prose right — every subsequent hire inherits their behaviour.

---

## Testing — The Deterministic Sandwich

**PRE (before every cycle):** `bun run verify` must pass (biome + tsc + vitest).
If baseline is broken, fix first. No cycle starts on red.

**POST (after every cycle):**
1. `biome check .` clean on touched files
2. `tsc --noEmit` clean
3. `bun vitest run` — no regressions
4. New tests for new functionality:
   - Cycle 1: `tests/chairman-hire.test.ts` (single hire)
   - Cycle 2: `tests/ceo-build-team.test.ts` (fan-out of 3)
   - Cycle 3: `tests/chairman-hire-chain.test.ts` (full 13-unit org)
5. Exit conditions verifiable via `grep`/`curl`/`test`

**Cycle gate = rubric ≥ 0.65 on all 4 dims + tests green.**

---

## Self-checkoff (every task)

When W4 passes on a task:
1. `markTaskDone(task.id)` in TypeDB
2. Flip `- [ ]` → `- [x]` in this file
3. `mark('chairman→ceo:<task-id>', 5)` — path strengthens for next cycle
4. Unblock dependents (query `blocks` → enqueue)
5. POST `/api/signal` with `loop:feedback` (rubric, tags, path, outcome)
6. If all Cycle N tasks done → `know()` promotes hypothesis

**Every task is a training sample. Even a dissolved task teaches the substrate
which role templates are toxic. Nothing is wasted.**

---

## Status

- [x] **Cycle 1: WIRE — Chairman hires CEO**
  - [x] W1 — Recon (Haiku × 4: `agents/`, `pages/api/`, `schema/one.tql`, `engine/agent-md.ts`)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 4: `ceo.md`, `hire.ts`, `chairman.astro`, auth)
  - [x] W4 — Verify: rubric fit=0.97 form=0.93 truth=0.95 taste=0.92 avg=0.94
- [x] **Cycle 2: PROVE — CEO hires team**
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 7: chairman.ts, hire.ts, build-team.ts, cto.md, cmo.md, cfo.md, ChairmanPanel.tsx)
  - [x] W4 — Verify: rubric fit=0.95 form=0.85 truth=0.92 taste=0.90 avg=0.91
- [x] **Cycle 3: GROW — Recursive org**
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 3: agent-md.ts default hire skill, chairman.ts isToxic+pheromone+ceoId fix, chairman.test.ts routing fix + build-team.ts receiver fix)
  - [x] W4 — Verify: rubric fit=0.82 form=0.78 truth=0.71 taste=0.85 avg=0.79

---

## Execution

```bash
/do docs/TODO-ONE-strategy.md       # advance next wave
/do docs/TODO-ONE-strategy.md --auto # run W1→W4 continuously until done
/see tasks --tag ceo                  # progress on ceo-tagged work
/see highways                         # which paths are strengthening
```

---

## Deprioritized (moved out of this TODO)

The following were in prior versions. They're still valuable, but none
block the Chairman-hires-CEO-hires-team flow. They live in their own TODOs:

- 7-persona vocabulary layer → `TODO-dictionary.md`
- Sui on-chain proofs → `TODO-sui.md`
- Marketplace (humans buy from agents) → `TODO-marketplace.md`
- Agent self-improvement loop → `TODO-emergence-tasks.md`
- AgentVerse bridge (2M agents) → `TODO-agentverse.md`
- Token minting for creators → `TODO-sui.md`
- Kids learning path → `TODO-client-ui.md`
- Multi-chain bridge → `TODO-sui.md`
- Creator domains → `TODO-client-ui.md`

**Done previously (kept for provenance):**

- [x] Prove deterministic routing speed: <0.01ms per decision
  done: 43 tests in routing.test.ts pass, 400,000× faster than LLM routing
  tags: foundation, test, P0, engineering

- [x] Implement isToxic() blocking: resistance ≥ 10 AND > 2× strength
  done: persist.ts exports isToxic(), tested in persist.test.ts (6 cases)
  tags: engineering, security, P0, foundation

- [x] Build markdown agent deployment: write file, push, live in minutes
  done: agent-md.ts parseAgentMd + syncAgent + /api/agents/sync live
  tags: agent, integration, P0, deployment

---

## See Also

- [ONE-strategy.md](ONE-strategy.md) — the CEO control model, lines 261-312
- [autonomous-orgs.md](autonomous-orgs.md) — recursive org formation pattern
- [lifecycle-one.md](lifecycle-one.md) — 10-stage user funnel (chairman = stage 4)
- [DSL.md](DSL.md) — signal grammar, `{ receiver, data }`
- [dictionary.md](dictionary.md) — canonical names (unit, skill, capability)
- [rubrics.md](rubrics.md) — fit/form/truth/taste scoring
- [TODO-template.md](TODO-template.md) — wave pattern, cycle structure
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
- [TODO-autonomous-orgs.md](TODO-autonomous-orgs.md) — this TODO's parent scope

---

*One click. One CEO. One recursion. The org builds itself.*
