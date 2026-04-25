# /todo

**Single skill. Three modes. Embedded template. Self-correcting.**

```
/todo                    → refresh dashboard for current group
/todo new <intent>       → scaffold a plan from intent (auto-classified)
/todo refresh <group>    → refresh a specific group's dashboard
```

The dashboard is a *view* of TypeDB. The plan is a *signal* into TypeDB.
This skill writes both. The substrate is always the source of truth.

> **Sister skill:** `/do <plan>` executes a wave. `/close` marks outcomes.
> Together they form the loop. This skill scaffolds plans and renders state.

---

## The world this skill builds for

**ONE is a world where humans and agents discover, build, and grow together.**

| Species | Identity | Authority | Speed |
|---|---|---|---|
| **Humans** | biometric (passkey + Secure Enclave, non-transferable by physics) | Touch ID per signature | tap → done |
| **Agents** | ephemeral keypair (RAM only) | Move Capability bound to owner | machine-speed |

**Properties every cycle must preserve. A cycle that weakens any of these fails the rubric.**

1. **Owned, never custodial.** Every agent has an owner — human OR another agent. Capabilities scope authority; expiry kills it on-chain.
2. **Free spawn.** Agents create agents within their Capability's `amount_cap` — no Touch ID per spawn.
3. **Self-issued identity.** Wallets, reputation, brand — earned, portable, on-chain. No platform issues identity.
4. **Reputation = pheromone.** Trust is the cryptographically verified count of paid interactions on a path, not an assigned score.
5. **Whitelabel by default.** Same substrate, your logo. ONE is a world, not a brand.
6. **Bridge to the existing world.** Agents can find humans (Facebook, email, ENS) and propose interactions — humans accept or reject at the biometric gate.
7. **The substrate IS the world.** Surfaces (chat, wallet, marketplace, ontology editor) are projections of the same six dimensions.

This block loads once per session. It is the constraint set every plan inherits.

---

## Mode 1 — `/todo new <intent>`

Scaffold a plan from intent. Runs the §0 classifier, picks `lean | mixed | full`, writes the file.

### Step 1 — Classify (4 priors)

| Prior | Question | Lean if |
|---|---|---|
| **Spec locked** | Is the *what* decided in a referenced doc? | yes |
| **Variance known** | One plausible shape, not a discovery? | yes |
| **Exit scalar** | "Done" is a number / pass-fail, not judgment? | yes |
| **Files known** | Recon already in the spec (paths cited)? | yes |

**4 yes → `mode: lean`.** Embed 5 sections in the owning spec doc; no new file.
**≤2 yes → `mode: full`.** Use full template (§3 below).
**3 yes → `mode: mixed`.** Full template, but mark certain cycles `lean`.

### Step 2 — Cycle-size cap (HARD)

Refuse to write the plan if:

- `cycles > 5` AND not all cycles are `mode: lean`
- any cycle declares > 5 tasks
- exit criterion is not `bun`-checkable, `git`-checkable, or counts an `/api/*` field

Reason: 100-cycle plans (see `packages/cli/one/things/todo-x402.md` for the anti-pattern) are dead on arrival. Decompose or refuse.

If the plan trips the cap, output:

```
✗ Plan refuses: {cycles} cycles, {tasks-per-cycle} avg tasks/cycle.
  Decompose into:
  - {sub-plan-1 slug} ({estimated cycles})
  - {sub-plan-2 slug} ({estimated cycles})
  Or mark every cycle mode: lean and re-run.
```

### Step 3 — Write the file

**Lean** (90% of cases): append to the owning spec doc:

```markdown
### {n} · {slug} — {one-line goal}
- **goal:** {what changes when done}
- **speed:** {metric, target, where measured}
- **tasks:**
  - [ ] {id} — {deliverable} — exit: {exact check}
- **verify:** `bun run verify` (scoped) · {rule-file compliance}
- **close:** `/close --surface {slug}`
```

**Full**: write `plans/{group}/{slug}.md` from `template-plan.md` v2.1+. Frontmatter must include all 🔒 fields (slug, goal, group, cycles, route_hints, rubric_weights, escape, downstream, source_of_truth, mode, lifecycle, classifier).

### Step 4 — Sync + announce

```
POST /api/plan/sync { file: <path> }
POST /api/signal { receiver: 'todo:plan:created', tags: [...route_hints], content: { slug, mode, lifecycle } }
```

Pheromone deposit on `todo:scaffold:{mode}:{lifecycle}` — the classifier learns which shapes ship.

---

## Mode 2 — `/todo` (no arg) — refresh dashboard

Render the dashboard for the current group. Reads-only; no TypeDB writes.

### Where the dashboard lives

| Group | Path |
|---|---|
| Default world | `/todo.md` (repo root) |
| Sub-group | `plans/{group}/todo.md` |

### What it contains (12 sections, all queried from TypeDB)

```
1   Active plans                       (status: RUNNING, cycle progress, rubric, escape risk)
1b  Mode distribution                  (lean vs full hit rates — classifier health)
2   Tasks by status                    (open / blocked / picked / done / verified / failed / dissolved)
3   Rubric trend                       (last 7 cycles closed: fit/form/truth/taste avg)
4   Pheromone heatmap                  (top 20 tag paths + toxic paths)
5   Escape alerts                      (rubric < threshold for N cycles → action)
6   Capabilities live                  (priced things published to marketplace)
7   Revenue 7d                         (5 layers: routing/discovery/infra/marketplace/intelligence)
8   Next actions                       (priority × pheromone × unblocked, top 5)
9   In-flight                          (picked but not closed; stale → re-enqueue)
10  Recent closes 24h                  (verified, with rubric)
11  How dashboard updates              (trigger → section → latency table)
12  How agents + humans share view     (read/write paths per species)
```

Each section is a TQL query template. `/todo` runs them, formats markdown, writes the file. The skill does NOT compute anything — every number comes from a TypeDB query.

### Trigger refresh from any state-changing command

| Command | Refreshes sections |
|---|---|
| `/plan sync` | 1, 1b, 2, 8 |
| `/do <task>` | 9 |
| `/close <task>` | 1, 2, 3, 8, 9, 10, plus 6+7 if the close emits settle/capability |
| L3 fade tick (5 min) | 4 |
| Settlement signal | 6, 7 |
| Escape trigger | 5 |

`/todo` (no arg) forces a full re-render. Generally unnecessary — atomic refresh per command is the default.

---

## Mode 3 — `/todo refresh <group>`

Same as Mode 2 but for an explicit group. Used when:
- A chairman wants to inspect another group they own
- An agent in group A needs to see group B's view (must have `read_memory` permission per `role-check.ts`)

Permission gate: `roleCheck(role, 'discover')`. Fails → 403 + log to `learnings.md`.

---

## Self-learning hooks (compounding)

Every dashboard render emits:

```
ui:todo:refresh { group, sections_rendered, latency_ms, dashboard_size_bytes }
```

These tags accumulate pheromone. After enough refreshes, `select()` learns:
- Which groups refresh most often → prefer fast queries for those
- Which sections take longest → prioritize their cache
- Which dashboards never get read → fade them

After 100 refreshes, the dashboard generator is materially faster on hot groups — not because we optimized, but because the substrate routes around slow sections automatically.

---

## Embedded template (the dashboard skeleton)

The full 12-section template is the canonical render shape. To keep this skill succinct, the skeleton is at `one/template-todo.md` — but **this skill is the source of truth for the contract.** If the template and this skill disagree, this skill wins.

The template file is a working example with TQL queries already filled in. Copy from there; mutate as needed.

---

## See also

- `/do` (`.claude/commands/do.md`) — wave executor; writes TypeDB → triggers refresh here
- `/close` (`.claude/commands/close.md`) — atomic close; biggest dashboard mutator
- `/see tasks` (`.claude/commands/see.md`) — read-only view of §2 + §8
- `one/template-plan.md` — the per-plan template (v2.1+); §0 classifier lives there
- `one/template-todo.md` — the dashboard skeleton with TQL queries
- `one/dictionary.md` — canonical names (loaded by every plan via `source_of_truth`)
- `one/rubrics.md` — the four dimensions the dashboard's §3 trends
- `src/lib/role-check.ts` — `discover` permission for cross-group reads

---

*One skill. Two species. The dashboard is the world looking at itself. The plan is the world signaling forward.*
