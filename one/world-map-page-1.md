# World Map Page

The build spec for `/world` — the page where you can **see every org, every
colony, every agent** in ONE at a glance, click anything, and understand it.

`world-map.md` is the territory (six layers, seven loops, sundial). This file
is the **practical wiring**: what the page actually renders, what data it
loads, and what a user does on it.

> One Astro page. Org charts on the left, colony view on the right, agent
> drawer on click. Every entity is a node in the ONE ontology.

---

## What The Page Shows

Four things, every time, in one view:

```
1. ORGS         the hierarchy — who reports to whom, who pays whom
2. COLONIES     the swarm — pheromone trails, foragers, highways
3. AGENTS       the individuals — model, prompt, skills, wallet, P&L
4. ACTIVITY     what's happening right now — live signals, deltas, events
```

The same entities, three lenses. Switching lens never refetches — it just
re-renders the same graph with a different layout and skin. Activity is
always on — the canvas breathes whether you're looking or not.

---

## Personas — Who This Page Is For

`/world` is the **first thing every persona sees** after signing in. It must
resonate with their mental model in under five seconds. The personas are
defined in `docs/one-strategy.md` § Target Personas; each has a markdown
agent already in `agents/`. The page ships a one-click **persona view** that
preselects the right group, lens, and skin so the user lands on a layout
that already makes sense.

| Persona              | Lands on              | Lens     | Skin   | First thing they see                                     |
| -------------------- | --------------------- | -------- | ------ | -------------------------------------------------------- |
| **Anne** (EHC)       | `group=ehc.framework` | `org`    | `team` | Her 6 agents as an org chart, today's plans in flight    |
| **Eth Developer**    | `focus=eth-dev`       | `money`  | `team` | Their highway = portfolio, gold veins = audits paid      |
| **ASI Builder**      | `group=asi`           | `colony` | `ant`  | uAgents bridging ONE↔AgentVerse, cross-world signals     |
| **Startup Founder**  | `group=<their-org>`   | `org`    | `team` | Marketing + Eng + Sales departments, $/day burn          |
| **DeFi Trader**      | `focus=trader`        | `colony` | `signal` | Chain scanners as receivers, alert frequencies live    |
| **Community Builder**| `group=community`     | `colony` | `ant`  | Members as ants, emergent clusters glowing               |
| **Designer**         | `focus=designer`      | `skills` | `team` | Their skill catalog, who hired them, ratings             |
| **DevOps**           | `lens=health`         | n/a      | `signal` | Worker health, queue depth, recent incidents           |
| **Code Helper**      | `focus=coder`         | `colony` | `brain` | Recent reviews as synapses firing                        |
| **Content Writer**   | `focus=writer`        | `colony` | `team` | Pipeline with creative + content + social               |

The persona switcher is a small dropdown in the top-right of the health
strip: `[Anne ▾]`. Picking a persona writes the URL params and reloads the
view — every persona view is a **shareable link**.

```
/world?persona=anne   →  ?group=ehc.framework&lens=org&skin=team&focus=ehc-officer
/world?persona=eth    →  ?focus=eth-dev&lens=money&skin=team
```

Personas are not roles or permissions — they are **starting positions**. A
user can pan, switch lens, and explore from there.

---

## The ONE Ontology Drives Everything

Every node, edge, and panel on the page is one of the six dimensions from
`docs/one-ontology.md`. Nothing else exists on this page.

| Dimension     | On the page                        | Source (TypeDB → KV)        |
| ------------- | ---------------------------------- | --------------------------- |
| **Groups**    | Org boxes, colony hulls, DAOs      | `/api/export/groups.json`   |
| **Actors**    | Agent pins (humans, LLMs, bots)    | `/api/export/units.json`    |
| **Things**    | Skills offered, prices, services   | `/api/export/skills.json`   |
| **Paths**     | Reporting lines, pheromone trails  | `/api/export/paths.json`    |
| **Events**    | Live signal particles, recent log  | `/api/export/signals.json`  |
| **Knowledge** | Highways, hypotheses, frontiers    | `/api/export/highways.json` |

If something doesn't fit one of these six, it doesn't belong on `/world`.

---

## Route

```
src/pages/world.astro          →  /world
  └─ <Layout title="ONE World">
       └─ <WorldWorkspace client:load />
```

The shell already exists. This doc describes what `WorldWorkspace` renders.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ HEALTH STRIP   12 orgs · 47 agents · $3.21/min · 94% success         │
├────────────┬──────────────────────────────────────────┬──────────────┤
│            │                                          │              │
│ ORG TREE   │                  CANVAS                 │ AGENT CARD   │
│            │                                          │              │
│ ▾ ONE      │       ╭─ creative ─╮                     │ creative     │
│  ▾ mktg    │       │            │ ◀── trail ──╮       │ ───────────  │
│   • dir    │       │  ● ● ●     │              ╲       │ model: sonnet│
│   • crtv ◀ │       ╰────────────╯              ╲       │ gen:   3     │
│   • ads    │                                    ╲      │ skills: 4    │
│   • seo    │       ╭─ ads ──────╮                ●     │ wallet: 0x.. │
│  ▸ eng     │       │   ● ●      │              director│ P&L:  +$112  │
│  ▸ ops     │       ╰────────────╯                      │              │
│  ▸ dao     │                                           │ [run] [edit] │
│            │                                           │              │
├────────────┴──────────────────────────────────────────┴──────────────┤
│ LENS    [org]  [colony]  [skills]  [money]      ⏱ live  ◀ -2m  ▶    │
└──────────────────────────────────────────────────────────────────────┘
```

- **Org tree** — collapsible, mirrors `group → membership → actor` from
  TypeDB. Click any node to focus it on the canvas.
- ** Canvas** — ReactFlow graph. Nodes = agents, hulls = groups,
  edges = paths weighted by `strength - resistance`.
- **Agent card** — opens on click. Shows the unit's full markdown spec
  (model, prompt, skills, generation, wallet, recent signals).
- **Lens** — switches the canvas layout: hierarchical tree, force-directed
  colony, skill-grouped, or money-flow (gold veins on revenue paths).

---

## Lenses

The canvas re-renders the same data four ways. No refetch. URL: `?lens=`.

```
LENS=org      hierarchical tree, edges = membership/reporting
              good for: "who works for whom"

LENS=colony   force-directed swarm, edges = pheromone strength
              good for: "what's actually happening"

LENS=skills   nodes grouped by skill tag (build, sell, support, learn)
              good for: "who can do X"

LENS=money    edges weighted by revenue, gold veins, ◆ = settled tx
              good for: "where does the money go"
```

Default: `lens=colony` — the most useful first impression.

---

## Skins (Ant Colonies and Other Metaphors)

Same data, six visual languages. Skin is a CSS class on the canvas root —
no rerender, no refetch. Driven by `?skin=`.

| Skin       | Group label   | Actor label | Path label  | Highway label  |
| ---------- | ------------- | ----------- | ----------- | -------------- |
| **ant**    | colony        | ant         | trail       | highway        |
| **brain**  | network       | neuron      | synapse     | tract          |
| **team**   | org           | agent       | workflow    | playbook       |
| **mail**   | office        | mailbox     | route       | trunk          |
| **water**  | watershed     | pool        | channel     | river          |
| **signal** | network       | receiver    | frequency   | band           |

The rosetta stone is `docs/metaphors-extended.md`. Skin only changes
**labels and visuals** — never structure. The agent at `marketing:creative`
is the same actor whether you call it an ant, neuron, or mailbox.

---

## Activity — The Page Must Feel Alive

A static graph fails the 60-second test. The page must **show activity**
constantly so a new visitor immediately understands ONE is a living system,
not a config UI. Activity has four layers, all rendering at once:

```
1. PARTICLES        gold/white dots glide along edges as signals fire
2. NODE PULSES      an actor flashes when it receives or emits a signal
3. EDGE BREATHING   strength↑ thickens the line in real time (debounced 250ms)
4. TICKER           a one-line ticker under the health strip:
                    "creative → ads · headlines · 2s ago · +$0.02"
```

### Where the activity comes from

```
WebSocket  /api/stream         live signal events (server-sent)
Polling    /api/signals?since= fallback every 2s if WS unavailable
KV         /api/export/*.json  baseline graph (refreshed by sync worker)
```

A signal event has the shape:

```typescript
type SignalEvent = {
  id:       string
  from:     string         // unit id
  to:       string         // unit id (or 'unit:skill')
  skill?:   string
  outcome:  'result' | 'timeout' | 'dissolved' | 'failed'
  revenue?: number
  ts:       number
}
```

The page subscribes once on mount, dispatches each event into:
- the **canvas** (animate a particle from→to)
- the **ticker** (prepend a row, max 10)
- the **agent card** (if `from` or `to` matches focus, append to recent signals)
- the **health strip** (increment counters, update $/min)

### Activity Ticker (under the health strip)

```
─────────────────────────────────────────────────────────────────
● eth-dev → trader · audit-solidity · ✓ · +$0.45 · just now
● creative → ads · headlines · ✓ · +$0.02 · 2s ago
● officer → qa · review-plan · ✓ · 4s ago
● scout → researcher · scan-chain · timeout · 6s ago
● director → creative · iterate · ✓ · 8s ago
─────────────────────────────────────────────────────────────────
```

Click any row → focuses the source agent and replays that signal's particle
on the canvas. The ticker is the **fastest path from "the page loaded" to
"I see something happening."**

### Empty-state activity

If there's no live traffic (dev environment, brand-new org), the page
**replays the last hour** at 10× speed on a loop until real traffic resumes.
A small indicator shows `▶ replay` in the corner. Never let the canvas
sit still.

---

## Org Tree (left rail)

A collapsible TreeView built from `groups` + `membership`.

```
ONE                                       # root group
├─ marketing                              # team group (8 agents)
│  ├─ marketing:director       sonnet
│  ├─ marketing:creative       sonnet    ◀ focused
│  ├─ marketing:ads            haiku
│  ├─ marketing:seo            haiku
│  ├─ marketing:content        sonnet
│  ├─ marketing:social         haiku
│  ├─ marketing:media-buyer    sonnet
│  └─ marketing:analyst        sonnet
├─ engineering                            # team group
│  ├─ eng:coder                opus
│  ├─ eng:eth-dev              opus
│  └─ eng:guard                haiku
├─ ops
│  ├─ ops:concierge            haiku
│  └─ ops:ehc-officer          sonnet
└─ dao                                    # external collaborators
   └─ dao:trader               sonnet
```

Source query (TypeDB):

```tql
match
  $g isa group, has group-id $gid;
  (group: $g, member: $u) isa membership;
  $u isa unit, has uid $uid, has model $m;
fetch { $gid, $uid, $m };
```

The tree is built once on page load and re-renders only when the user
expands/collapses. Focus state is in the URL (`?focus=marketing:creative`).

---

## Colony Canvas (center)

ReactFlow graph. Component: `components/graph/WorldGraph.tsx` (exists).

**Nodes** — one per actor:
```
{
  id:     'marketing:creative',
  group:  'marketing',
  data:   { model, generation, successRate, balance, lastSignalAt },
  type:   'agent'         // custom node
}
```

**Edges** — one per path with `strength > 0.1`:
```
{
  source:    'marketing:director',
  target:    'marketing:creative',
  data:      { strength, resistance, revenue, lastUsedAt },
  className: heat(strength, resistance)   // 'highway' | 'active' | 'fading' | 'cold' | 'toxic'
}
```

**Hulls** — one per group, drawn as a translucent shape around its members.
Hull color comes from group type (`team` = blue, `dao` = gold, `colony` = green).

Topography rules (`world-map.md` § Topography):
```
strength↑ → stroke wider, brighter
resistance↑ → stroke darker
toxic     → grayscale + dashed (only after r ≥ 10 and r > 2s)
revenue   → gold vein overlay
```

---

## Agent Card (right rail)

Opens when a node is clicked. Shows the **full agent markdown spec** plus
live numbers.

```
┌──────────────────────────────────┐
│ marketing:creative               │
│ Creative Director                │
├──────────────────────────────────┤
│ MODEL    claude-sonnet-4         │
│ GEN      3 (rewritten 4d ago)    │
│ CHANNELS slack, discord          │
├──────────────────────────────────┤
│ SKILLS                           │
│   copy        $0.02   ████░ 84% │
│   iterate     $0.02   ███░░ 71% │
│   headlines   $0.03   █████ 92% │
├──────────────────────────────────┤
│ WALLET                           │
│   0xab12…f9    +$112 this week  │
├──────────────────────────────────┤
│ RECENT SIGNALS                   │
│   ← from director: "iterate v2"  │
│   → to ads: "headline drafts"    │
│   ← from director: "campaign Q2" │
├──────────────────────────────────┤
│ SYSTEM PROMPT                    │
│ You are the Creative Director... │
│ [expand]                         │
├──────────────────────────────────┤
│ [Run skill ▾]  [Edit md]  [Logs] │
└──────────────────────────────────┘
```

Data comes from a single endpoint:

```
GET /api/entity/marketing:creative
  → { kind: 'unit', spec, stats, wallet, recentSignals }
```

The card shape is the same for any entity kind — `unit`, `group`, `skill`,
`path`, `signal`. The renderer picks fields based on `kind`.

---

## Data Sources

Reads always come from KV (0ms in-process cache). Writes go through
`/api/signal` and let the sync worker repaint KV.

```
TypeDB ──cron──► KV snapshot ──edge cache──► page
                 (5 keys)      (30s TTL)
```

| Slot           | Endpoint                              | Cached |
| -------------- | ------------------------------------- | ------ |
| Org tree       | `/api/export/groups.json`             | yes    |
| Canvas nodes   | `/api/export/units.json`              | yes    |
| Canvas edges   | `/api/export/paths.json`              | yes    |
| Skill labels   | `/api/export/skills.json`             | yes    |
| Highways       | `/api/export/highways.json`           | yes    |
| Agent card     | `/api/entity/:id`                     | 1s     |
| Health strip   | `/api/health`                         | 1s     |
| Recent signals | `/api/signals?limit=10`               | no     |
| Run skill      | `POST /api/signal`                    | —      |
| Edit agent     | `POST /api/agents/sync`               | —      |

---

## URL Contract

Every state is a URL. View is shareable, embeddable, bookmarkable.

```
/world
  ?lens=org|colony|skills|money         layout
  &skin=ant|brain|team|mail|water|signal  metaphor
  &group=marketing                       org tree filter
  &focus=marketing:creative              agent card subject
  &t=live|<unix-ms>                      time scrubber
```

Defaults: `lens=colony`, `skin=signal`, no group filter, no focus, `t=live`.

---

## Component Inventory

| Slot          | Component                               | Status   |
| ------------- | --------------------------------------- | -------- |
| Page shell    | `pages/world.astro`                     | exists   |
| Workspace     | `components/WorldWorkspace.tsx`         | exists   |
| Canvas        | `components/graph/WorldGraph.tsx`       | exists   |
| Skin switcher | `components/controls/SkinSwitcher.tsx`  | exists   |
| Health strip  | `components/world/HealthStrip.tsx`      | **TODO** |
| Org tree      | `components/world/OrgTree.tsx`          | **TODO** |
| Agent card    | `components/world/AgentCard.tsx`        | **TODO** |
| Lens switcher | `components/world/LensSwitcher.tsx`     | **TODO** |
| Time scrubber | `components/world/TimeScrubber.tsx`     | **TODO** |
| Persona menu  | `components/world/PersonaMenu.tsx`      | **TODO** |
| Activity ticker | `components/world/ActivityTicker.tsx` | **TODO** |
| Live stream    | `lib/streamSignals.ts` (WS client)     | **TODO** |

Existing `components/world/WorldView.tsx` and `WorldChat.tsx` predate this
spec — fold them in or delete.

---

## Build Order

Each pass is shippable on its own.

```
PASS 1 — STILL FRAME
  HealthStrip + OrgTree + WorldGraph reading from KV.
  Click an agent → AgentCard opens (read-only).

PASS 2 — LENSES + SKINS
  Lens switcher (org/colony/skills/money).
  Skin switcher (ant/brain/team/mail/water/signal).
  Both are pure CSS/layout — no refetch.

PASS 3 — TIME + EVENTS
  Animated signal particles on edges.
  Time scrubber rewinds the canvas using /api/signals?from=&to=.

PASS 4 — OPERATOR
  "Run skill" and "Edit md" buttons in AgentCard.
  Mutations go through /api/signal and /api/agents/sync.
```

---

## Acceptance Criteria

A stranger visiting `/world` should, in 60 seconds, be able to answer:

```
1. WHO WORKS HERE?     count agents, see org structure in tree
2. WHAT DO THEY DO?    click an agent, see skills + prices
3. IS IT ALIVE?        see particles flying, ticker scrolling, edges pulsing
4. WHAT'S WORKING?     see highways glowing, gold veins on revenue paths
5. WHAT'S BROKEN?      see toxic edges grayed, low success-rate cards
6. IS THIS FOR ME?     pick their persona, land on a layout that fits
```

If any answer takes more than a glance, cut features until it doesn't.

---

## Constraints

```
NO new pages              everything is /world with query params
NO modals                 the agent card is a panel, not a popover
NO refetch on lens/skin   layout switches are CSS, not network
NO direct TypeDB reads    always go through KV → globalThis
NO writes on read paths   only operator buttons mutate
NO concept off-ontology   if it's not one of the six dimensions, cut it
```

---

## See Also

- `docs/world-map.md` — the design (territory)
- `docs/one-ontology.md` — the six dimensions
- `docs/metaphors-extended.md` — skin rosetta stone
- `docs/dictionary.md` — naming guide
- `agents/` — markdown agent specs the page renders
- `src/pages/world.astro` — the page shell
- `src/components/graph/WorldGraph.tsx` — the canvas
