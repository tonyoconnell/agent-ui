---
title: Chairman — live hierarchical org builder
slug: chairman
goal: Chairman connects wallet, hires CEO, watches the org build itself live across arbitrary depth with pheromone feedback and configurable roles.
group: ONE
cycles: 3
route_hints:
  primary: [chairman, ceo, hire, reactflow]
  secondary: [pheromone, websocket, role-template]
rubric_weights:
  fit: 0.35
  form: 0.20
  truth: 0.30
  taste: 0.15
escape:
  condition: "WsHub /broadcast auth fails in prod OR hire path reaches resistance≥10 before any success sample"
  action: "emit signal → chairman {plan:chairman, trend:escape, reason:<which>}; status → PAUSED; fall back to poll-mode flag"
downstream:
  capability: chairman:build-team
  price: 0.00
  scope: public
source_of_truth:
  - one/dictionary.md
  - one/patterns.md
  - one/rubrics.md
  - one/routing.md
  - one/lifecycle.md
status: PLAN
---

# Chairman — live hierarchical org builder

**Surface:** `/chairman` page • `src/components/chairman/{ChairmanPanel,OrgChart}.tsx`
**Engine:** `src/engine/chairman.ts` (recursive `registerHire`)
**API:** `POST /api/chairman/{hire,build-team}`
**Shipped 2026-04-20:** single Hire CEO button + hardcoded 3-director fan-out (CTO/CMO/CFO) via 1s polling. Works. Shallow and blind.

---

## 1 — Vision

The chairman clicks once. They watch the org assemble itself — CEO mints, fans out hire signals, directors mint, directors hire their own teams, every edge lights up with pheromone as paths mark. The ReactFlow canvas is the substrate made visible: routing speed, org depth, and hire-quality all on one screen. No polling, no hardcoded roles, no blank director cards.

---

## 2 — Closed loop

```
chairman ──hire("ceo")────────► /api/chairman/hire
                                     │
                                     ▼
                             syncAgentWithIdentity
                                     │
                                     ▼
                             net.add('ceo') + registerHire
                                     │
                    ┌────────────────┴──────────────────┐
                    ▼                                   ▼
          WsHub /broadcast                         mark(chairman→ceo, 1)
          {type:'unit-hired', uid, wallet, skills}
                    │                                   │
                    ▼                                   ▼
          useChairmanStream()                  updates edge strength
          setNodes(prev+ceo)                   → OrgChart edge width grows
                    │
                    ▼
          Human clicks Build Team (or auto-fires from CEO spec)
                    │
                    ▼
          signal ceo:build-team {roles:[cto,cmo,cfo,…]}
                    │
                    ▼
          fan-out: emit ceo:hire {role:cto}, …  (parallel)
                    │
                    ▼
          each hire repeats the top loop recursively
                    │
                    ▼
          director wired with registerHire → can hire its own sub-team

4-outcome at every hire:
  result      → mark(edge,1) + broadcast unit-hired
  timeout     → neutral (slow LLM) + animated edge stays pulsing
  dissolved   → warn(edge,0.5) (no role template) + edge fades red
  failure     → warn(edge,1) (sync threw) + edge turns red
```

Every hire is a closed substrate loop. The UI only ever renders what pheromone says, never what a hardcoded constant says.

---

## 3 — Fronts

| Front | Tags | Rubric tilt | Picks up |
|-------|------|-------------|----------|
| Live stream | [chairman, websocket, reactflow] | 0.35 / 0.20 / 0.35 / 0.10 | whoever has highest pheromone on `ui:chairman:*` + `ws:hire` |
| Pheromone overlay | [chairman, pheromone, graph] | 0.30 / 0.25 / 0.30 / 0.15 | inherits from `graph:pheromone` highway (WorldGraph, PheromoneGraph) |
| Role catalog | [chairman, role-template, catalog] | 0.40 / 0.15 / 0.30 / 0.15 | anyone with `agent-md:parse` capability |

Fronts run in cycle order (1 → 2 → 3) because C2 consumes C1's live-edge hook and C3 changes the API that C1's stream carries.

---

## 4 — Architecture deltas

### Component tree after refactor

```
src/components/chairman/
  ChairmanPanel.tsx           (thin — wallet gate + layout)
  OrgChart.tsx                (ReactFlow canvas)
  RoleCatalog.tsx             (C3 — left rail, markdown preview)
  nodes/
    ChairmanNode.tsx          (extracted)
    UnitNode.tsx              (extracted)
    PendingNode.tsx           (C1 — ghost node during LLM mint)

src/components/graph/nodes/   (shared — C2 extracts from Pheromone/WorldGraph)
  PheromoneEdge.tsx           (width=strength, color=resistance ratio)
  useNodeLayout.ts            (dagre wrapper)

src/lib/
  use-chairman-stream.ts      (C1 — WsHub subscription w/ replay)
```

### API deltas

| Route | Before | After |
|-------|--------|-------|
| `POST /api/chairman/hire` | `{role, owner?}` | *(unchanged — already correct)* |
| `POST /api/chairman/build-team` | no body | `{roles: string[]}` — falls back to `['cto','cmo','cfo']` if absent |
| WsHub `/broadcast` | existing | new message type `unit-hired` `{uid, wallet, skills, from, edge}` |

### Engine deltas

```typescript
// src/engine/chairman.ts — build-team accepts roles[]
ceo.on('build-team', async (data, emit) => {
  const d = data as { roles?: string[] } | null
  const roles = d?.roles?.length ? d.roles : ['cto', 'cmo', 'cfo']
  for (const role of roles) emit({ receiver: `${ceoId}:hire`, data: { role } })
  return { building: roles }
})

// registerHire already recursive — no change. But after successful mint,
// emit broadcast via relayToGateway() so the UI sees new units live.
```

---

## 5 — Wave mechanics (same as template — one cycle runs four waves)

| Wave | Role letter | Model  | Deliverable | Exit |
|------|-------------|--------|-------------|------|
| W1   | r           | Haiku  | Recon per file (parallel) | every finding cites file:line |
| W2   | d           | Opus   | Diff specs + doc updates  | every W1 finding has a spec or keep |
| W3   | e           | Sonnet | Applied edits (one per file, parallel) | all anchors match |
| W4   | v           | Sonnet | Verify — biome + tsc + manual UI walk | rubric ≥ 0.65 all four dims |

---

## 6 — Deterministic sandwich

```
PRE                                  POST
────                                 ─────
bun run verify                       bun run verify
curl /api/health → units>0           curl /api/chairman/hire OK
/chairman page loads                 /chairman page builds 4+ units live
CEO template parses                  WsHub delivers unit-hired < 1s after mark
```

Any regression on a PRE check blocks the cycle. POST checks are the cycle's verifiable exit condition — if they can't be run, the cycle doesn't close.

---

## 7 — Cycles

### Cycle 1 — Live stream (A)

**Deliverable:** `/chairman` consumes WsHub `unit-hired` events instead of 1s polling. Ghost "minting" node renders while LLM syncs; solidifies on arrival. `DIRECTOR_UIDS` hardcode removed.

**Exit:** Open `/chairman`, click Hire CEO, click Build Team → watch 4 nodes (CEO + 3 directors) appear with animated edges — zero polling traffic in devtools Network tab.

**Rubric override:** 0.35 / 0.20 / 0.35 / 0.10 (truth-weighted — the WS contract must match what the server broadcasts).

#### W1 — Recon (Haiku × 5, parallel)
- `src/components/chairman/ChairmanPanel.tsx` — map polling logic + state shape
- `src/components/chairman/OrgChart.tsx` — map node/edge derivation
- `src/lib/use-task-websocket.ts` — map existing WS hook for reuse pattern
- `src/lib/ws-server.ts` + `gateway/src/ws.ts` (or equiv) — map how mark/unit events already broadcast
- `src/engine/persist.ts` + `src/engine/chairman.ts` — map where `mark()` fires on hire success

#### W2 — Decide (Opus × 1)
- New hook `src/lib/use-chairman-stream.ts` contract (params, return shape, reconnect policy)
- New node `src/components/chairman/nodes/PendingNode.tsx` shape
- Remove `DIRECTOR_UIDS` and polling block in `ChairmanPanel.tsx`
- Broadcast payload shape for `unit-hired` — adds to existing type union, not replaces
- Doc: update `one/dictionary.md` with `unit-hired` event term; `.claude/rules/ui.md` example

#### W3 — Edit (Sonnet × M, one per file)
- `src/lib/use-chairman-stream.ts` (new)
- `src/components/chairman/nodes/PendingNode.tsx` (new)
- `src/components/chairman/OrgChart.tsx` (extract node files, consume pending state)
- `src/components/chairman/ChairmanPanel.tsx` (replace poll block with stream hook)
- `src/engine/persist.ts` or `chairman.ts` (fire broadcast on hire success)
- `src/lib/ws-server.ts` / gateway broadcast (wire `unit-hired` message type)
- `one/dictionary.md` (term entry)

#### W4 — Verify (Sonnet × 2)
- consistency shard — mock WS + React Testing Library, pending node appears then solidifies
- integration shard — `curl /api/chairman/hire` + check `ws://api.one.ie/ws` delivers frame within 1s
- rubric: fit (UI reacts to substrate truth), form (hook is ≤ 80 lines), truth (no hardcoded roles remain), taste (minting pulse feels right at 60fps)

#### Cycle 1 gate
```bash
bun run verify                                          # baseline
grep -c "DIRECTOR_UIDS\|setInterval" src/components/chairman/*.tsx  # expect 0
grep -c "unit-hired" src/lib/use-chairman-stream.ts     # ≥ 1
curl -s -X POST https://dev.one.ie/api/chairman/hire -d '{"role":"ceo"}'  # { unit:{uid:"roles:ceo",...} }
```

---

### Cycle 2 — Pheromone overlay (B)

> **Shipped 2026-04-20.** Three extracted primitives live under
> `src/components/graph/nodes/` and `src/lib/`:
>
> | Primitive | Consumer |
> |-----------|----------|
> | `PheromoneEdge.pheromoneEdgeStyle(s, r, opts)` | OrgChart edges (chairman→ceo, ceo→director) |
> | `useNodeLayout(nodes, edges, opts)` | OrgChart TB layout + ready for `/world` adoption |
> | `useOrgPaths()` | Polls `/api/export/paths` every 3s → `Map<edge, {strength, resistance, toxic}>` |
>
> **Scope decision:** `WorldGraph.tsx` uses a manual BFS layout and `s/8` linear
> stroke formula — fundamentally different from PheromoneGraph's `log(s+1)×2` and
> dagre LR layout. Forcing a shared primitive would require rewriting WorldGraph,
> which is outside this cycle. `useNodeLayout` is ready; WorldGraph's migration
> is a separate TODO when its rendering model unifies with PheromoneGraph.
>
> **UnitNode** moved to `src/components/chairman/nodes/UnitNode.tsx` and now
> fetches `/api/agents/detail?id={uid}` on mount for directors whose `skills[]`
> arrives empty via the `unit-hired` event (CEO arrives fully populated).

**Deliverable:** Org chart edges show strength as width and resistance as red-channel opacity. Directors render with full skills/wallet/status like CEO. Shared graph primitives factored to `src/components/graph/nodes/`.

**Exit:** Every edge visible on `/chairman` reflects `/api/export/paths` live. Resistance ≥ 10 on any edge shades it red. Node tooltip shows full markdown role preview.

**Rubric override:** 0.30 / 0.25 / 0.30 / 0.15 (form + taste tilt — visual coherence with `/world`).

#### W1 — Recon (Haiku × 4)
- `src/components/graph/PheromoneGraph.tsx` — map edge rendering, strength→width formula
- `src/components/graph/WorldGraph.tsx` — map toxicity coloring (resistance > strength × 2)
- `src/pages/api/export/paths.ts` — confirm path export shape (strength, resistance, traversals)
- `src/components/chairman/OrgChart.tsx` — map current edge style code

#### W2 — Decide (Opus × 1)
- Extract primitives: `PheromoneEdge.tsx`, `useNodeLayout.ts` (dagre wrapper)
- Diff specs for: OrgChart consumes shared primitives, UnitNode reads full `/api/agents/:uid` on mount for skills/wallet
- Doc: new `one/chairman.md` § Pheromone rendering
- Verify no regression on `/world` which imports `PheromoneGraph`

#### W3 — Edit (Sonnet × M)
- `src/components/graph/nodes/PheromoneEdge.tsx` (new — extracted)
- `src/components/graph/nodes/useNodeLayout.ts` (new — extracted)
- `src/components/graph/PheromoneGraph.tsx` (consume extracted)
- `src/components/graph/WorldGraph.tsx` (consume extracted)
- `src/components/chairman/OrgChart.tsx` (consume extracted + add path subscription)
- `src/components/chairman/nodes/UnitNode.tsx` (fetch skills/wallet)
- `one/chairman.md` § update

#### W4 — Verify (Sonnet × 2)
- consistency — `/world` and `/chairman` use same edge widths for same strength values
- rubric — fit (matches `/api/export/paths` truth), form (no duplicate edge rendering code), truth (toxicity gate matches `isToxic` engine rule), taste (edge animation doesn't jank at 100 edges)

#### Cycle 2 gate
```bash
bun run verify
diff <(grep -A10 "strokeWidth" src/components/chairman/OrgChart.tsx) \
     <(grep -A10 "strokeWidth" src/components/graph/PheromoneGraph.tsx)  # shared primitive
curl -s /api/export/paths | jq '.paths[0] | {strength, resistance}'       # non-empty
```

---

### Cycle 3 — Role catalog (C)

**Deliverable:** Left rail on `/chairman` listing every `agents/roles/*.md` with markdown preview + checkbox. Chairman picks which roles the CEO builds (not hardcoded). `POST /api/chairman/build-team` accepts `{roles: string[]}`. Adding a role template to `agents/roles/` auto-surfaces it with no code change.

**Exit:** Add `agents/roles/cfo-india.md` → appears in catalog after refresh → check it + CTO + CMO → click Build Team → 3 directors mint with the selected identities, not the default set.

**Rubric override:** 0.40 / 0.15 / 0.30 / 0.15 (fit-heavy — the product is configurability, not polish).

#### W1 — Recon (Haiku × 4)
- `src/pages/api/chairman/build-team.ts` — current body parse
- `src/engine/chairman.ts` — `build-team` handler signature
- `src/engine/agent-md.ts` — parse + toTypeDB (what a role template can declare)
- `agents/roles/*.md` — survey existing templates, frontmatter shape

#### W2 — Decide (Opus × 1)
- New component `src/components/chairman/RoleCatalog.tsx` — glob `agents/roles/*.md`, render preview, checkbox state
- Diff spec for `build-team.ts` to accept `body.roles`
- Diff spec for `chairman.ts` `build-team` handler to read `data.roles`
- API contract doc in `src/pages/api/CLAUDE.md` under Chairman section
- Layout: ChairmanPanel becomes 2-column when panel open (catalog | chart)

#### W3 — Edit (Sonnet × M)
- `src/components/chairman/RoleCatalog.tsx` (new)
- `src/components/chairman/ChairmanPanel.tsx` (layout + pass selected roles)
- `src/pages/api/chairman/build-team.ts` (accept body.roles)
- `src/engine/chairman.ts` (handler reads data.roles with fallback)
- `src/pages/api/CLAUDE.md` (route contract)
- `one/chairman.md` § update
- optional: `agents/roles/director.md` as a generic template parent

#### W4 — Verify (Sonnet × 2)
- consistency shard — with no `roles` param, behavior matches Cycle 1 (regression check)
- integration shard — add ad-hoc `agents/roles/auditor.md`, restart dev, see it in catalog, hire succeeds
- rubric — fit (new roles auto-surface), form (catalog reuses Card/Checkbox from shadcn), truth (empty array falls back to defaults), taste (markdown preview readable at 11pt)

#### Cycle 3 gate
```bash
bun run verify
# With new role:
echo '---\nname: auditor\ngroup: roles\n---' > agents/roles/_test-auditor.md
curl -s /api/chairman/roles | jq '.roles[] | select(.name == "auditor")'  # non-empty
curl -s -X POST /api/chairman/build-team -d '{"roles":["auditor"]}'       # { ok:true, building:["auditor"] }
rm agents/roles/_test-auditor.md
```

---

## 8 — Source of truth (auto-loaded in every W2)

| Doc | Locks |
|-----|-------|
| `one/dictionary.md` | canonical names; we add `unit-hired` broadcast term in C1 |
| `one/patterns.md` | closed loop + zero returns (every hire closes; missing template = dissolved) |
| `one/rubrics.md` | fit/form/truth/taste scoring per wave |
| `one/routing.md` | `follow()` vs `select()` (OrgChart follows hire path deterministically) |
| `one/lifecycle.md` | register → signal → highway stages — CEO registers, build-team signals, strong hire paths become org highways |
| `docs/ADL-integration.md` | sensitivity/lifecycle gates on `hire` handler |

---

## 9 — Escape

```
IF   WsHub /broadcast returns 401/403 in prod for 3 consecutive hires
THEN status → PAUSED; feature-flag `CHAIRMAN_STREAM_MODE=poll` as fallback; signal → chairman
AND  C2/C3 hold — pheromone overlay + catalog work on top of stream, can't ship without it

IF   any hire path accumulates resistance ≥ 10 before any success sample
THEN emit warn on chairman→ceo (role template is dissolved or LLM is rejecting)
AND  surface error in panel; block further Build Team until resolved
```

---

## 10 — Downstream pitch (fires at plan close)

After Cycle 3 closes:

```yaml
pitch:
  headline: "Hire a CEO, watch your org build itself."
  body: "Connect a Sui wallet, click once, see every hire mark the graph live. Pheromone learns which org shapes work. Add role templates as markdown — no redeploy."
  demo_url: /chairman
  transaction_url: /marketplace/pay?skill=chairman:build-team
```

The capability is free (`price: 0.00`) but the *roles* it hires are priced individually — so every `Build Team` click becomes Layer 4 take for whoever wrote the role template. Chairman becomes the acquisition funnel for the role-template marketplace.

---

## 11 — Status

- [x] **Cycle 1 — Live stream (A)**
  - [x] W1 recon (5 parallel)
  - [x] W2 decide + docs
  - [x] W3 edits (parallel by file)
  - [x] W4 verify
- [x] **Cycle 2 — Pheromone overlay (B)**
  - [x] W1 recon (4 parallel)
  - [x] W2 decide + docs
  - [x] W3 edits (parallel by file)
  - [x] W4 verify
- [x] **Cycle 3 — Role catalog (C)**
  - [x] W1 recon (4 parallel)
  - [x] W2 decide + docs
  - [x] W3 edits (parallel by file)
  - [x] W4 verify

---

## 12 — How to run

```bash
/plan sync one/chairman.md         # compile to TypeDB
/do one/chairman.md                # advance next wave
/do one/chairman.md --cycle 1      # force Cycle 1 only
/close --plan chairman --cycle 1   # close C1 once all W4 tasks verified
```

See `one/chairman-todo.md` for the live task dashboard that reflects this plan's TypeDB state.

---

## See also

- `src/components/chairman/{ChairmanPanel,OrgChart,RoleEditor,WorldConfigPanel}.tsx`
- `src/engine/chairman.ts`
- `src/pages/api/chairman/{hire,build-team}.ts`
- `src/components/graph/{PheromoneGraph,WorldGraph}.tsx` (source of extracted primitives)
- `src/lib/use-task-websocket.ts` (reference pattern for the new stream hook)
- `one/dictionary.md`, `one/patterns.md`, `one/rubrics.md`, `one/routing.md`, `one/lifecycle.md`
- `one/template-plan.md` (this plan's shape)
- `one/chairman-todo.md` (live dashboard)

---

*One click. One CEO. The org builds itself — and you watch the graph learn.*
