---
type: dashboard
plan: chairman
group: ONE
refreshed_at: 2026-04-20
refreshed_by: initial-scaffold
plans_active: 1
tasks_open: 13
tasks_picked: 0
tasks_verified_lifetime: 0
rubric_avg_7d: null
---

# Chairman — live org builder dashboard

> **View of `one/chairman.md`'s TypeDB state.** Every task here is a `thing` with `thing-type="task"` under plan `chairman`. Check boxes mirror TypeDB — they flip on `/close`, not by hand. `/todo` refreshes this file.

---

## 1 — Active plan

| Plan | Goal | Cycles done / total | Rubric (7d) | Escape risk | Next wave | Open this cycle |
|------|------|---------------------|-------------|-------------|-----------|-----------------|
| [`chairman`](chairman.md) | Chairman hires CEO; org builds itself live with pheromone feedback + configurable roles | 0/3 | — | low | C1 / W1 | 5 |

---

## 2 — Tasks by status

| Status | Count | Notes |
|--------|------:|-------|
| `open` | 13 | Cycle 1 W1 ready to pick (5 recon tasks) |
| `blocked` | 8 | C1 W2-W4 waiting on W1, C2/C3 waiting on C1 close |
| `picked` | 0 | none in flight |
| `done` | 0 | awaiting verify |
| `verified` | 0 | none yet |

---

## 3 — Cycle 1 — Live stream (A)

**Exit:** Devtools shows zero polling traffic; WsHub delivers `unit-hired` < 1s after each mark.

### W1 — Recon (Haiku × 5, parallel — spawn in one message)

| ID | File | Tags | Effort | Blocks | Exit |
|----|------|------|:------:|--------|------|
| [ ] `chairman:1:r1` | `src/components/chairman/ChairmanPanel.tsx` | chairman, recon, polling | 0.2 | `chairman:1:d1` | cite setInterval + DIRECTOR_UIDS + state shape |
| [ ] `chairman:1:r2` | `src/components/chairman/OrgChart.tsx` | chairman, recon, reactflow | 0.2 | `chairman:1:d1` | cite node/edge derivation + `status` prop flow |
| [ ] `chairman:1:r3` | `src/lib/use-task-websocket.ts` | websocket, recon, hook-pattern | 0.2 | `chairman:1:d1` | cite reconnect/heartbeat/fallback policy |
| [ ] `chairman:1:r4` | `src/lib/ws-server.ts` + gateway `/broadcast` | websocket, recon, broadcast | 0.2 | `chairman:1:d1` | cite how mark events already propagate + auth shape |
| [ ] `chairman:1:r5` | `src/engine/persist.ts` + `src/engine/chairman.ts` | chairman, recon, engine | 0.2 | `chairman:1:d1` | cite where `mark()` fires on hire success |

### W2 — Decide (Opus × 1, after all W1 return)

| ID | Deliverable | Depends on | Tags | Effort | Blocks | Exit |
|----|-------------|------------|------|:------:|--------|------|
| [ ] `chairman:1:d1` | Diff specs for 7 files + hook contract + broadcast payload shape | `chairman:1:r1..r5` | chairman, decide, ws | 0.4 | `chairman:1:e1..e7` | every W1 finding mapped to spec or explicit keep |

### W3 — Edit (Sonnet × 7, parallel by file)

| ID | File | Tags | Effort | Blocks | Exit |
|----|------|------|:------:|--------|------|
| [ ] `chairman:1:e1` | `src/lib/use-chairman-stream.ts` (new) | ws, hook, new-file | 0.3 | `chairman:1:v1` | hook ≤ 80 lines, types exported, reconnect policy matches recon |
| [ ] `chairman:1:e2` | `src/components/chairman/nodes/PendingNode.tsx` (new) | reactflow, node, new-file | 0.2 | `chairman:1:v1` | pulse at 60fps, handles from/to positions correct |
| [ ] `chairman:1:e3` | `src/components/chairman/OrgChart.tsx` (extract + pending state) | reactflow, refactor | 0.4 | `chairman:1:v1` | nodes/ directory in place, consumes pending+hired states |
| [ ] `chairman:1:e4` | `src/components/chairman/ChairmanPanel.tsx` (replace poll) | chairman, refactor | 0.3 | `chairman:1:v1` | `setInterval`, `DIRECTOR_UIDS`, `orgUnits` polling state all removed |
| [ ] `chairman:1:e5` | `src/engine/chairman.ts` or `persist.ts` (fire broadcast on hire) | engine, broadcast | 0.3 | `chairman:1:v1` | `unit-hired` fires on `mark()` success without changing existing behavior |
| [ ] `chairman:1:e6` | `src/lib/ws-server.ts` + gateway `/broadcast` (wire type) | ws, gateway | 0.3 | `chairman:1:v1` | `unit-hired` added to allowlist, auth unchanged |
| [ ] `chairman:1:e7` | `one/dictionary.md` (add `unit-hired` term) | docs, dictionary | 0.1 | `chairman:1:v1` | term appears in § Events, links back to chairman.md |

### W4 — Verify (Sonnet × 2)

| ID | Shard | Depends on | Tags | Exit |
|----|-------|------------|------|------|
| [ ] `chairman:1:v1` | consistency — WS mock + pending→hired RTL test | `chairman:1:e1..e7` | verify, rtl | RTL test green; pending node visible then replaced |
| [ ] `chairman:1:v2` | integration — `curl /api/chairman/hire` → WS frame within 1s; rubric score | `chairman:1:e1..e7` | verify, integration, rubric | rubric fit/form/truth/taste ≥ 0.65 each; no polling in Network tab |

**Cycle 1 gate** (all must pass to close):
```bash
bun run verify                                                          # W0 baseline green
grep -c "DIRECTOR_UIDS\|setInterval" src/components/chairman/*.tsx      # == 0
grep -c "unit-hired" src/lib/use-chairman-stream.ts                     # ≥ 1
curl -s -X POST https://dev.one.ie/api/chairman/hire -d '{"role":"ceo"}' | jq -e '.unit.uid'
```

Close command: `/close --plan chairman --cycle 1`

---

## 4 — Cycle 2 — Pheromone overlay (B) *(blocked on C1 close)*

### W1 — Recon (Haiku × 4)

| ID | File | Exit |
|----|------|------|
| [ ] `chairman:2:r1` | `src/components/graph/PheromoneGraph.tsx` | cite edge width/color formula |
| [ ] `chairman:2:r2` | `src/components/graph/WorldGraph.tsx` | cite toxicity red-channel render |
| [ ] `chairman:2:r3` | `src/pages/api/export/paths.ts` | cite path export shape (strength, resistance, traversals) |
| [ ] `chairman:2:r4` | `src/components/chairman/OrgChart.tsx` (post-C1) | cite edge style code to replace |

### W2 — Decide (Opus × 1)

| ID | Deliverable | Exit |
|----|-------------|------|
| [ ] `chairman:2:d1` | Extract `PheromoneEdge.tsx` + `useNodeLayout.ts`; diff specs for OrgChart/PheromoneGraph/WorldGraph to consume; path subscription contract | every W1 finding mapped |

### W3 — Edit (Sonnet × 7)

| ID | File |
|----|------|
| [ ] `chairman:2:e1` | `src/components/graph/nodes/PheromoneEdge.tsx` (new — extracted primitive) |
| [ ] `chairman:2:e2` | `src/components/graph/nodes/useNodeLayout.ts` (new — dagre wrapper) |
| [ ] `chairman:2:e3` | `src/components/graph/PheromoneGraph.tsx` (consume extracted) |
| [ ] `chairman:2:e4` | `src/components/graph/WorldGraph.tsx` (consume extracted) |
| [ ] `chairman:2:e5` | `src/components/chairman/OrgChart.tsx` (consume + path subscription) |
| [ ] `chairman:2:e6` | `src/components/chairman/nodes/UnitNode.tsx` (fetch skills/wallet for every node, not just CEO) |
| [ ] `chairman:2:e7` | `one/chairman.md` § Pheromone rendering update |

### W4 — Verify (Sonnet × 2)

| ID | Shard | Exit |
|----|-------|------|
| [ ] `chairman:2:v1` | consistency — /world and /chairman render same widths for same strengths | diff-check |
| [ ] `chairman:2:v2` | rubric — fit/form/truth/taste ≥ 0.65 | toxicity gate matches engine, no duplicate edge code, no jank at 100 edges |

---

## 5 — Cycle 3 — Role catalog (C) *(blocked on C2 close)*

### W1 — Recon (Haiku × 4)

| ID | File | Exit |
|----|------|------|
| [ ] `chairman:3:r1` | `src/pages/api/chairman/build-team.ts` | cite body parse + fallback |
| [ ] `chairman:3:r2` | `src/engine/chairman.ts` | cite `build-team` handler signature |
| [ ] `chairman:3:r3` | `src/engine/agent-md.ts` | cite parse + frontmatter schema |
| [ ] `chairman:3:r4` | `agents/roles/*.md` | enumerate + describe frontmatter shape |

### W2 — Decide (Opus × 1)

| ID | Deliverable | Exit |
|----|-------------|------|
| [ ] `chairman:3:d1` | Catalog component contract + API body delta + 2-column layout spec + preview UX | every W1 finding mapped |

### W3 — Edit (Sonnet × 7)

| ID | File |
|----|------|
| [ ] `chairman:3:e1` | `src/components/chairman/RoleCatalog.tsx` (new — glob roles, preview, checkbox) |
| [ ] `chairman:3:e2` | `src/components/chairman/ChairmanPanel.tsx` (2-column layout + selected roles state) |
| [ ] `chairman:3:e3` | `src/pages/api/chairman/build-team.ts` (accept `body.roles`, fallback to defaults) |
| [ ] `chairman:3:e4` | `src/engine/chairman.ts` (`build-team` handler reads `data.roles`) |
| [ ] `chairman:3:e5` | `src/pages/api/CLAUDE.md` (Chairman route contract) |
| [ ] `chairman:3:e6` | `one/chairman.md` § Role catalog update |
| [ ] `chairman:3:e7` | `agents/roles/director.md` (optional — generic parent template) |

### W4 — Verify (Sonnet × 2)

| ID | Shard | Exit |
|----|-------|------|
| [ ] `chairman:3:v1` | consistency — omitting `roles` matches Cycle 1 behavior | regression green |
| [ ] `chairman:3:v2` | integration — add ad-hoc role file → appears in catalog → hire succeeds; rubric ≥ 0.65 | files-as-config works end-to-end |

---

## 6 — Pheromone heatmap (after C2 closes — auto-fills from TypeDB)

```tql
# Source query
match $p isa path, has tag "chairman", has tag "hire", has strength ?s, has resistance ?r;
```

| Tag path | Strength | Resistance | Net | Status |
|----------|---------:|-----------:|----:|--------|
| `chairman→ceo` | — | — | — | pending first hire |
| `ceo→roles:cto` | — | — | — | pending first build-team |
| `ceo→roles:cmo` | — | — | — | pending |
| `ceo→roles:cfo` | — | — | — | pending |

Will populate live once C1 ships and first chairman runs the loop.

---

## 7 — Escape alerts

- [ ] no alerts — plan is PLAN status, not yet RUNNING

---

## 8 — In-flight

None — Cycle 1 W1 is open and ready to pick.

---

## 9 — Recent closes (last 24h)

None — plan just opened.

---

## 10 — Next actions (ranked)

1. `/do one/chairman.md --cycle 1 --wave 1` — spawn 5 Haiku in parallel, each reads one file. *(score: 0.82 — high value, low effort, unblocks 8 downstream tasks)*
2. `/plan sync one/chairman.md` — compile plan to TypeDB so `/see tasks --plan chairman` works. *(score: 0.70 — prerequisite for dashboard queries to return non-placeholder data)*
3. After C1 W1 returns: `/do one/chairman.md --cycle 1 --wave 2` — single Opus, consumes all 5 recon shards. *(score: deferred)*

---

## 11 — How this dashboard refreshes

| Trigger | Changes |
|---------|---------|
| `/plan sync one/chairman.md` | TypeDB gets all 13 tasks; this file's checkboxes mirror |
| `/do one/chairman.md …` | `tasks_picked` increments, in-flight section fills |
| `/close <task-id>` | checkbox flips, rubric trend updates, dependents unblock |
| WS `unit-hired` (post-C1) | in-flight in-chart nodes update live on dev + prod |
| L3 fade tick | pheromone heatmap decays (every 5 min) |

Don't hand-edit the checkboxes. Use `/close <task-id>`.

---

## See also

- `one/chairman.md` — the plan (contract + cycles + wave tables)
- `one/template-plan.md` — plan template this was built from
- `one/template-todo.md` — dashboard template this file follows
- `one/dictionary.md`, `one/patterns.md`, `one/rubrics.md` — base context (auto-loaded in every W2)
- `.claude/commands/do.md` — wave orchestration
- `.claude/commands/close.md` — atomic close
- `.claude/commands/plan.md` — `/plan sync|status|pitch`

---

*Chairman dashboard. 3 cycles queued. First wave ready. Run `/do one/chairman.md --cycle 1 --wave 1` to start.*
