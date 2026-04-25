# Ontology Editor — `/ontology`

**The world becoming visible.** Six dimensions, one canvas, every interaction a signal. The page where a company, a user, or anybody sees what they are inside of.

---

## One-line summary

**Every other surface shows a slice of the world. `/ontology` shows the world.** Chat shows signals. Wallet shows your address. Marketplace shows priced things. The ontology editor shows the substrate's six dimensions simultaneously, manipulable, with every interaction wired through the same `signal → mark → fade → harden` loop the engine itself uses.

> Concept reference: [ontology.md](ontology.md) defines the schema (6 dimensions in `one.tql`). This document defines the surface — the `/ontology` page that makes the schema legible.

---

## Same pattern, sixth surface

| Surface | What it shows | Doc |
| --- | --- | --- |
| `/u` (Universal Wallet) | one address, one identity | [wallet.md](wallet.md) |
| `/chat` | one conversation, one signal stream | [chat.md](chat.md) |
| `/buy`, `/sell` | priced capabilities, the marketplace slice | [pay.md](pay.md), [buy-and-sell.md](buy-and-sell.md) |
| `/sui` | the on-chain twin of every dimension | [sui.md](sui.md) |
| `/world` | a single world, single skin | [world-map-page.md](world-map-page.md) |
| **`/ontology`** | **all six dimensions at once, manipulable** | **this doc** |

`/world` is one world rendered through one skin. `/ontology` is the substrate itself — every group, every actor, every path, surfaced together with layer toggles, a time slider, and the seven skins as display vocabulary.

---

## The six dimensions, your words

The TQL schema is canonical (`one.tql` — locked). The UI vocabulary is friendlier:

| Display | TQL | Node shape | Color | Edge | What it carries |
|---|---|---|---|---|---|
| **groups** | `group` | rounded rect (parent) | indigo | — (containment) | worlds, teams, orgs |
| **people** | `actor` | circle | blue | — | humans, agents, animals, oracles |
| **things** | `thing` | square | green | — | skills, tasks, tokens |
| **paths** | `path` | — | orange (strength) → red (resistance) | weighted edge | the connections that learn |
| **events** | `signal` | small dot on edge (animated) | yellow | — | what happened, when |
| **insight** | `hypothesis` | hexagon | purple | dotted to source paths | what was discovered |

**Why the rename.** "Actor" reads as technical; "people" includes humans and agents naturally — the substrate's whole point is that they share primitives. "Signal" reads as engineering; "events" reads as something that happened. "Hypothesis" is the engine's internal name; "insight" is what users see and care about. TQL stays canonical; the editor is the display layer per `dictionary.md`'s vocabulary table.

---

## Page anatomy

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [ONE] /ontology       group: g:public ▼      skin: brain ▼      [view|edit]│
├──────────────┬─────────────────────────────────────────────┬───────────────┤
│ LAYERS       │                                             │ INSPECTOR     │
│ ☑ groups     │                                             │ ─────────     │
│ ☑ people     │                                             │ skill:research│
│ ☑ things     │             ReactFlow canvas                │ price: 0.05   │
│ ☑ paths      │             (nodes + edges,                  │ providers: 3  │
│ ☑ events     │              animated signals,               │ uses: 142     │
│ ☑ insight    │              custom node shapes)             │ revenue: 7.1Σ │
│              │                                             │ ─────────     │
│ ─────        │                                             │ on-chain: 0x..│
│ TIME         │                                             │ [view on Sui] │
│ now ◉────●   │                                             │               │
│   2026-04-26 │                                             │               │
└──────────────┴─────────────────────────────────────────────┴───────────────┘
```

- **Header:** group switcher, skin switcher, view/edit toggle
- **Left rail:** layer toggles (six chips), time slider
- **Center:** ReactFlow canvas
- **Right rail:** inspector — clicked node's TypeDB record + on-chain twin link

---

## Five user states

The page renders for everyone — what changes is what they can do.

| State | Default group | Can view | Can edit |
|---|---|---|---|
| **Visitor** (logged-out) | `g:public` | public dimension only | nothing |
| **Member** (logged-in, in group) | their last-viewed group | every group they're a member of | mark/warn within their groups |
| **Operator** (role: operator) | their last group | same as member | + add units, draw paths |
| **CEO** (role: ceo) | their last group | same | + hire/fire/tune within group |
| **Chairman** (role: chairman) | their personal `g:owns:{uid}` | every group they own + transitively | + mint Capabilities, create groups, revoke keys |

Edit gating is `Role × Pheromone` per [governance-todo.md](governance-todo.md). The mode toggle should *show* what's gated — grayed-out controls with `requires chairman role` tooltips teach the model.

---

## Interaction model — every click is a signal

Per `.claude/rules/ui.md`, every onClick emits a signal. In the ontology editor, this means **using the editor strengthens the design paths** — designers accumulate pheromone on the actions they perform most.

```ts
ui:ontology:layer-toggle    { layer: 'paths', visible: true }
ui:ontology:group-switch    { from: 'g:public', to: 'g:owns:tony' }
ui:ontology:skin-switch     { skin: 'brain' }
ui:ontology:node-click      { kind: 'people', uid: 'agent:scout' }
ui:ontology:edge-click      { from: 'scout', to: 'analyst' }
ui:ontology:time-rewind     { ms: 1714000000000 }
ui:ontology:add-unit        { kind: 'agent', name: 'researcher' }
ui:ontology:draw-path       { from: 'a', to: 'b' }
ui:ontology:mint-capability { holder, scope, expiry }
```

**The editor doesn't write to TypeDB directly.** It emits signals. The substrate routes them. The bridge mirrors governance writes to Sui via `mirrorGovernance`. This means the editor IS a participant in the substrate — its actions deposit pheromone like any other.

---

## Four cycles to ship the surface

| Cycle | Mode | Scope | Exit |
|---|---|---|---|
| **C1 — View** | lean | render all 6 dimensions for any group, layer toggles, group + skin switcher | visitor sees `g:public`, all toggles work, biome+tsc+vitest green |
| **C2 — Edit** | lean | drag-to-add-unit, draw-to-connect, mark/warn buttons; `Role × Pheromone` gating | member can mark within group; chairman can mint Capability; non-members see grayed controls with explanation |
| **C3 — Time** | lean | time slider rewinds via `valid-from`/`valid-to` query (already shipped in `sys-302`) | "show world as of last Tuesday" works for any dimension |
| **C4 — Inspector + Twin** | lean | right rail shows TypeDB record + on-chain link (suiscan); insight shows source paths | clicking any node opens inspector with both layers visible |

C1 is shippable in one afternoon if the W1 recon confirms the components exist as expected.

---

## C1 in detail — parallel agent fan-out

Eight parallel agents in W1, eight in W3. Each gets one file or one focused question. No coordination overhead because the boundaries are clean (one component per agent).

### W0 — Baseline (one shot)

```bash
bun run verify   # biome + tsc + vitest, record passing count
```

Record: `tests N/M passing, biome clean, tsc clean`. Don't proceed if W0 is red.

### W1 — Recon (8 Haiku in parallel, single message)

| # | Reads | Reports |
|---|---|---|
| 1 | `src/components/graph/WorldEditor.tsx` | exported props, what it renders, what it emits |
| 2 | `src/components/graph/WorldGraph.tsx` | base patterns, hooks used, ReactFlow setup |
| 3 | `src/components/graph/PheromoneGraph.tsx` | pheromone-aware visualization, edge styling |
| 4 | `src/components/graph/nodes/PheromoneEdge.tsx` | custom edge shape, strength → thickness mapping |
| 5 | `src/components/controls/SkinSwitcher.tsx` | skin enum, what changes per skin |
| 6 | `src/pages/api/state.ts` + `/api/export/highways.ts` | data shapes returned to frontend |
| 7 | `src/components/providers/SdkProvider.tsx` | how to wrap an island for SDK hook access |
| 8 | `src/lib/role-check.ts` + `src/lib/api-auth.ts` | role lookup pattern for edit gating |

Output: 8 verbatim recon reports, each ≤300 words, line-numbered.

### W2 — Decide (Opus, main context, single)

Read all 8 W1 reports. Lock:
- **Layout algorithm:** force-directed (d3) vs layered (dagre) vs grouped-by-dimension. Recommend **grouped**: groups as ReactFlow parent nodes, people inside as children, things alongside, paths as inter-node edges. Insight nodes float at top with dotted lines to source paths.
- **Node-type registry:** one custom node component per dimension (5 — paths are edges, not nodes).
- **Data flow:** `<SdkProvider>` wraps `<OntologyEditor>`. Use `useStats` + `useHighways` + `useAgentList` (existing SDK hooks). For groups + signals + insight, add three new SDK hooks (`useGroups`, `useSignals(groupId)`, `useHypotheses(groupId)`) that hit existing APIs.
- **Edit-gate UX:** controls are always *visible* but disabled with explanatory tooltip when role insufficient. Don't hide — *teach.*
- **C1 scope cut:** edit mode is read-only buttons (visible, disabled). Real edit lands in C2.

Output: locked component tree + node-type table + data-flow diagram + 3 new SDK hook signatures.

### W3 — Edits (8 Sonnet in parallel, single message)

| # | Creates | Specs from W2 |
|---|---|---|
| 1 | `src/pages/ontology.astro` | Astro page wrapping editor in `<SdkProvider>`, `client:load` |
| 2 | `src/components/ontology/OntologyEditor.tsx` | container — header, layer state, ReactFlow canvas mount |
| 3 | `src/components/ontology/LayerToggle.tsx` | 6 chips, controlled, emit `ui:ontology:layer-toggle` |
| 4 | `src/components/ontology/GroupSwitcher.tsx` | dropdown using `useGroups`, emit `ui:ontology:group-switch` |
| 5 | `src/components/ontology/Inspector.tsx` | right rail, accepts selected node, renders record + link |
| 6 | `src/components/ontology/nodes/{Group,Person,Thing,Insight}Node.tsx` | one file per node type — shape, color, handles |
| 7 | `src/components/ontology/edges/PathEdge.tsx` | strength → stroke-width, resistance → red tint, signals as animated dots |
| 8 | docs sync — `src/components/CLAUDE.md` adds Ontology section; root `CLAUDE.md` adds `/ontology` to surface table | per `.claude/rules/documentation.md` (W3 edits docs alongside code) |

Each agent gets the W2 spec slice + the rule "use Edit/Write tool, exact anchors only, do not touch other files."

### W4 — Verify (single Sonnet)

1. **Deterministic gate:**
   ```bash
   bun run verify
   ```
   Must stay green. New tests for new code: snapshot test that editor renders with mock data + each layer toggles independently.

2. **Smoke browser test:** start dev server, navigate to `/ontology`, verify:
   - All six layer chips render
   - Toggling each chip hides/shows that dimension
   - Group switcher lists groups (mocked or real)
   - Skin switcher swaps display vocabulary
   - Edit mode toggle is visible but disabled for visitor

3. **Rubric scoring:**
   - **fit** — does it render the 6 dimensions of any group? (target ≥0.85)
   - **form** — clean React, typed props, no console warnings? (target ≥0.85)
   - **truth** — does the data match TypeDB? (target ≥0.85)
   - **taste** — consistent with `bg-[#0a0a0f]` dark theme + existing graph components? (target ≥0.80)

4. **Cycle close:** all four ≥ 0.65 → mark cycle done in `system-todo.md` (or new `ontology-todo.md` if we create one).

---

## Component map — build vs reuse

| Status | Component | Purpose |
|---|---|---|
| ♻ reuse | `WorldGraph.tsx` (base) | ReactFlow setup, dark background, controls |
| ♻ reuse | `PheromoneEdge.tsx` | already does strength → thickness, used as-is |
| ♻ reuse | `SkinSwitcher.tsx` | drop into header, no changes |
| ♻ reuse | `<SdkProvider>` | wrap the editor for SDK hooks |
| ♻ reuse | `useStats`, `useHighways`, `useAgentList` | data fetching for paths, people |
| 🆕 new | `OntologyEditor.tsx` | the container |
| 🆕 new | `LayerToggle.tsx` | 6 chips |
| 🆕 new | `GroupSwitcher.tsx` | dropdown of accessible groups |
| 🆕 new | `Inspector.tsx` | right rail |
| 🆕 new | `nodes/{Group,Person,Thing,Insight}Node.tsx` | 4 custom nodes |
| 🆕 new | `edges/PathEdge.tsx` | path edge with signal animation |
| 🆕 new (SDK) | `useGroups()`, `useSignals(gid)`, `useHypotheses(gid)` | three hooks against existing APIs |

**Heuristic:** if it's already in `src/components/graph/`, reuse. The ontology editor is a *composition*, not a rewrite.

---

## ReactFlow node design — the visual grammar

```
┌──────────────────────────┐         ╔══════════════════╗
│ GROUP (parent)           │         ║ INSIGHT          ║   hypothesis
│ ┌──────┐  ┌────────┐     │         ║  hexagon         ║   confidence: 0.78
│ │PERSON│──│ PERSON │     │         ╚══════════════════╝
│ │  ◯   │  │   ◯    │     │                  ┊
│ └──┬───┘  └───┬────┘     │                  ┊  dotted line
│    │  THING  │           │                  ┊  to source path
│    │  ┌───┐  │           │     ━━━━━━●━━━━━━●━━━━━━━━━━
│    └──│ ▢ │──┘  PATH     │     PATH (orange = strong, signals = animated dots)
│       └───┘              │
└──────────────────────────┘
```

- **Group** = ReactFlow parent node (children render inside, drag-to-resize)
- **Person** = circle, ReactFlow Handle for path connections
- **Thing** = square, smaller than person
- **Insight** = hexagon, floats above the canvas with dotted lines to the paths it summarizes
- **Path** = ReactFlow edge with custom `getBezierPath`, stroke-width = `strength`, color shifts orange→red as `resistance` grows
- **Event** = small animated dot moving along its parent path edge (uses ReactFlow's `EdgeLabelRenderer`)

Toggle a layer off → all nodes/edges of that dimension hide via ReactFlow's `hidden` prop.

---

## Threat model row

| Surface | What it defends | What it accepts |
|---|---|---|
| `/ontology` view | respects group scope (private signals invisible across groups); read-only paths cannot be marked from frontend | visitor sees only `g:public` slice; cannot enumerate other groups; signals labeled `private` are hidden even within group view |
| `/ontology` edit | every mutation emits a signal that hits the substrate's `Role × Pheromone` gate; no direct TypeDB writes from browser | member can mark/warn within their group; chairman writes propagate to Sui via `mirrorGovernance`; Touch ID required for `mint-capability` |

---

## What this is NOT

- **Not a TypeDB admin console.** Use the TypeDB Studio for raw schema work. The editor is the *user-facing* view of the world.
- **Not a Sui block explorer.** Inspector links out to suiscan for deep on-chain inspection. The editor shows the twin link, not the chain navigator.
- **Not a chat surface.** Click a person → see their info → "Open chat" links to `/chat/u/<uid>`.
- **Not an authoring tool for new ontology dimensions.** The six are LOCKED in `one.tql`. The editor lets you populate them, not redefine them.
- **Not a workflow designer.** Pheromone routing is *learned*, not authored. You don't draw routes — you observe and reinforce them.

---

## Self-audit (before C1 cycle close)

- [ ] Page at `/ontology` renders for logged-out visitor showing `g:public`
- [ ] All six layer toggles independently hide/show their dimension
- [ ] Group switcher lists only groups the user is a member of
- [ ] Skin switcher swaps display vocabulary (ant/brain/team/mail/water/radio/ledger)
- [ ] Edit mode toggle is visible-but-disabled for non-members; tooltip explains
- [ ] Every onClick emits `ui:ontology:*` per `ui.md` rule
- [ ] Inspector shows TypeDB record and on-chain twin link when node clicked
- [ ] Layout: groups as parents, people/things as children, paths as edges, insight floating
- [ ] Custom node components match the visual grammar table
- [ ] `<SdkProvider>` wraps the island; data via SDK hooks
- [ ] Dark theme matches `#0a0a0f` background, `#252538` borders
- [ ] `bun run verify` green, no new flaky tests, snapshot test for layer-toggle behavior
- [ ] `src/components/CLAUDE.md` updated; root `CLAUDE.md` adds `/ontology` to nested context table

---

## See also

- [ontology.md](ontology.md) — the schema concept (6 dimensions in TQL)
- [dictionary.md](dictionary.md) — canonical names + display vocabulary
- [one-ontology.md](one-ontology.md) — the 6 dimensions explained in depth
- [metaphors.md](metaphors.md) — the 7 skins (ant/brain/team/mail/water/radio/ledger)
- [world-map-page.md](world-map-page.md) — direct manipulation patterns (companion surface)
- [governance-todo.md](governance-todo.md) — `Role × Pheromone` permission model
- [routing.md](routing.md) — what strength/resistance/highway/toxic mean visually
- [pay.md](pay.md) — how priced things appear in the editor
- [sui.md](sui.md) — the on-chain twin every node points to
- `src/components/CLAUDE.md` — the components inventory
- `.claude/rules/ui.md` — the `emitClick('ui:ontology:*')` contract
- `.claude/rules/react.md` + `.claude/rules/astro.md` — implementation patterns

---

*The substrate becomes a world the moment you can see it. `/ontology` is the seeing.*

---

## Executable plan (lean, 4 cycles)

```yaml
---
slug: ontology-editor
goal: Make the substrate's 6 dimensions visible, manipulable, and bound to consensus
group: ONE
cycles: 4
mode: lean
lifecycle: construction
show: true
lifecycle: [discover, navigate, edit, rewind, verify]
lifecycle_show:
  C1:
    customer: "Sarah lands at /ontology, sees g:public's 6 dimensions, toggles each layer, swaps between 7 skins"
    agent: "scout queries useGroups via SDK and reads the same world the human sees — same primitives, different gate"
    unlocks_stage: "discover"
  C2:
    customer: "Member Sarah drags a new agent into her group, draws a path, marks it — all gated by Role × Pheromone"
    agent: "operator-role agent adds a unit by emitting ui:ontology:add-unit; chairman-role agent mints a Capability for it"
    unlocks_stage: "edit"
  C3:
    customer: "Sarah drags the time slider to last Tuesday, sees what was different — every governance change has a timestamp"
    agent: "auditor-role agent replays GovernanceEvent emissions from Sui to verify off-chain state matches on-chain truth"
    unlocks_stage: "rewind"
  C4:
    customer: "Sarah clicks any node, sees its TypeDB record + a link to suiscan — off-chain and on-chain side by side"
    agent: "agent inspects its own Capability bindings on-chain from the same UI a human uses — no separate admin tool"
    unlocks_stage: "verify"
route_hints:
  primary: [ui, ontology, react, reactflow]
  secondary: [astro, shadcn, sdk]
rubric_weights: { fit: 0.30, form: 0.20, truth: 0.30, taste: 0.20 }
escape:
  condition: "rubric < 0.50 across two consecutive cycles"
  action: "halt --auto, signal 'do:ontology:degraded', request human review"
source_of_truth:
  - one/ontology-editor.md
  - one/ontology.md
  - one/dictionary.md
  - one/metaphors.md
  - docs/TODO-governance.md
classifier:
  spec_locked: yes — one/ontology-editor.md
  variance_known: yes — composition over creation, all primitives identified
  exit_scalar: yes — bun run verify + smoke test per cycle
  files_known: yes — 5 new files in C1, listed in component map
status: PLAN
---
```

### Cycle tasks

```markdown
### C1 · view — render 6 dimensions read-only
- **goal:** /ontology renders for any visitor, all 6 layer toggles + group switcher + skin switcher work
- **speed:** ReactFlow first-paint < 350ms · layer-toggle < 16ms
- **tasks:**
  - [ ] o-1 — `src/pages/ontology.astro` — wraps editor in <SdkProvider>, client:only="react" — exit: page renders
  - [ ] o-2 — `src/components/ontology/OntologyEditor.tsx` — composes WorldGraph + header — exit: 6 layers visible
  - [ ] o-3 — `src/components/ontology/LayerToggle.tsx` — 6 chips, controlled, emit ui:ontology:layer-toggle — exit: each toggles independently
  - [ ] o-4 — `src/components/ontology/GroupSwitcher.tsx` — dropdown via /api/state — exit: switching reloads canvas
  - [ ] o-5 — extend `WorldGraph.tsx` — accept `layers: {groups, people, things, paths, events, insight}: boolean` prop — exit: hidden flag respected
- **verify:** scoped — vitest on the 5 files + smoke test page renders + manual layer toggle
- **close:** /close --surface ontology --cycle 1

### C2 · edit — Role × Pheromone gating
- **goal:** member can mark/warn within their group; chairman can mint Capability
- **speed:** edit-action emit-to-mark < 200ms
- **tasks:**
  - [ ] o-6 — Inspector right rail with action buttons — exit: actions visible, gated
  - [ ] o-7 — wire roleCheck() per action — exit: non-members see grayed buttons + tooltip
  - [ ] o-8 — drag-to-add-unit on canvas — exit: emits add-unit signal, TypeDB row appears
  - [ ] o-9 — draw-to-connect for paths — exit: creates path with strength 0
- **verify:** scoped vitest + role-gating snapshot test
- **close:** /close --surface ontology --cycle 2

### C3 · rewind — time slider
- **goal:** time slider rewinds to any point via valid-from/valid-to (sys-302)
- **speed:** rewind query < 500ms
- **tasks:**
  - [ ] o-10 — TimeSlider component in left rail — exit: slider drags, shows date
  - [ ] o-11 — query helper that adds `valid-from < $t` filter — exit: returns historical state
  - [ ] o-12 — diff-paint: nodes added since cursor pulse green; nodes removed pulse red — exit: visible
- **verify:** scoped vitest + manual time rewind smoke
- **close:** /close --surface ontology --cycle 3

### C4 · verify — inspector + on-chain twin
- **goal:** click any node → record + suiscan link
- **speed:** inspector open < 100ms (cached) / < 500ms (cold)
- **tasks:**
  - [ ] o-13 — inspector renders TypeDB record — exit: full attribute table
  - [ ] o-14 — on-chain twin link via /api/sui/object/:id — exit: clickable suiscan URL
  - [ ] o-15 — for path nodes: GovernanceEvent timeline — exit: ordered list of governance events
- **verify:** scoped vitest + on-chain twin smoke (testnet)
- **close:** /close --surface ontology --cycle 4 → emit `surface:shipped:ontology` with rubric + speed
```
