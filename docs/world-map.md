# World Map

The geography of ONE. Where agents and humans live, how traffic flows,
where the highways lead, and how to see it all.

This is the **map** — not the engine. The engine is `src/engine/world.ts`.
The dictionary names the parts. The DSL describes the verbs. The strategy
explains the play. The map shows you the **territory**.

> Two fields, five verbs, six dimensions, seven loops — rendered as a place
> you can walk through, point at, and watch breathe.

For agent naming (canonical names, per-skin aliases, personal nicknames), see
[world-map-page.md](world-map-page.md) § Names Across Skins. The /world page
lets users rename their agents with direct manipulation and set viewer-specific nicknames.

---

## Principles

Seven rules the map obeys. Everything else follows.

```
    1.  ONE SCREEN          one Atlas, infinite zoom — never a new page
    2.  ONE SOURCE          KV is hot, TypeDB is deep, runtime is live — same data
    3.  ONE CARD            same Inspector shape for every kind of entity
    4.  ZERO CHROME         no menus, no modals, no nested dialogs
    5.  READ-MOSTLY         the map watches; only the operator console mutates
    6.  EVERY STATE A URL   any view is shareable, embeddable, bookmarkable
    7.  60-SECOND HEALTH    a stranger can read the world without clicking
```

If a feature breaks one of these, it doesn't ship.

---

## What's In The Box

The map is one Astro page (`/world`) and one canvas. Everything else is a
filter, a camera position, or an overlay on top of the same data.

```
    ATLAS              the canvas — every entity, every altitude
    ──────────────────────────────────────────────────────────
    HEALTH STRIP       always-visible top bar (units, $, loops)
    NOW CARD           the one thing happening right now
    INSPECTOR          right-rail glass card for the focused entity
    MINIMAP            altitude + position, click to jump
    SUNDIAL            the seven loops as a clock face
    SCRUBBER           bottom-edge time slider — rewind / play / live
    SEARCH             ⌘K palette across every entity in the world
    OPERATOR           hidden console for running the world
    WAR ROOM           multiplayer pin board with cursor presence
```

Tabs are saved camera positions with filters. Skins are renderer plugins.
Dimensions are layer toggles. Altitudes are zoom levels. **One canvas.**

---

## What a Map Has To Show

A map is useful only if you can answer four questions just by looking:

```
1. WHERE AM I?         my position in the world (group, role, balance)
2. WHERE CAN I GO?     reachable receivers, open paths, capabilities
3. WHERE'S THE TRAFFIC? highways, hot edges, busy units, fresh signals
4. WHERE'S THE DANGER? toxic paths, at-risk units, blocked frontiers
```

Everything in the map serves one of those four. If a panel doesn't, cut it.

---

## The Six Layers of Geography

The world map has six layers, one per ontology dimension. They stack.
You can toggle each on or off like layers in a mapping app.

```
    ┌──────────────────────────────────────────────────────────┐
    │  6. KNOWLEDGE   ── hypotheses, frontiers, objectives      │  slowest
    │  5. EVENTS      ── recent signals, audit trail            │
    │  4. PATHS       ── strength, resistance, revenue, traffic │
    │  3. THINGS      ── tasks, skills, prices, status   llms, systems        │
    │  2. ACTORS      ── humans, agents,          │
    │  1. GROUPS      ── colonies, regions, nations, teams      │  base
    └──────────────────────────────────────────────────────────┘
            ▲                                          ▲
            │                                          │
        the soil                               the weather
```

The base layer (Groups) is the **continent shape**. Actors are **cities**.
Things are **goods produced**. Paths are **roads**. Events are **traffic**.
Knowledge is the **culture** that emerged from all of it.

---

## Topography — How Height Is Drawn

Pheromone is altitude. Strong paths are mountain ranges. Toxic paths are
canyons. Fresh paths are foothills. Faded paths are plains.

```
    altitude  =  log(strength + 1)              positive relief
    depth     =  log(resistance + 1)            negative relief
    slope     =  d(strength)/dt                 how fast it's growing
    erosion   =  fade-rate × inactivity         how fast it's dying
```

A heatmap renders this directly:

```
    cold ─── blue ─── teal ─── green ─── yellow ─── orange ─── red ─── hot
    fading                  active                              highway

    grey ── dark grey ── black                   toxic / blocked
```

Height plus heat tells you, in one glance, whether a region is **building**,
**stable**, **fading**, or **collapsing**.

---

## Where The Highways Lead

Highways are the **arteries** of the world. They form whenever a path's
strength climbs past 50 (`path_status` returns `"highway"`). They are the
proven routes — the LLM is no longer needed to decide where signals go.

```
    entry ══════► scout ══════► analyst ══════► reporter ══════► customer
              82.5         94.2           87.1           71.3
```

A map should answer: **what does this highway terminate at, and what does
it produce?** Three sinks matter:

| Sink             | What it means                              | Color  |
| ---------------- | ------------------------------------------ | ------ |
| **revenue**      | path carries paid signals (x402)           | gold   |
| **knowledge**    | path keeps producing confirmed hypotheses  | violet |
| **delivery**     | path keeps producing successful outcomes   | green  |

A highway with no terminal sink is a **decorative highway** — it's strong,
but the world isn't getting anything from it. Worth flagging.

---

## Money on the Map — Sui + x402

Every actor in this world has a Sui wallet, derived deterministically from
the platform seed plus its UID. Every paid signal carries an x402 payment.
Every payment leaves a gold trace on the path it traveled. The map shows
all of this in-place — money is not a separate dashboard.

```
    ┌───────────────────────────────────────────────────────────┐
    │   creative                                                │
    │   ────────                                                │
    │      ●  0x7fa3...91be          $14.62      ◆ on chain     │
    │                                                           │
    │      revenue (24h)   ▁▂▃▅▇█▇▆▅▄▃▂                        │
    │                                                           │
    │      paid signals    342 in    /  41 out                  │
    │      avg price       $0.012                                │
    │      sink            customer (highway #7)                 │
    │      frozen highway  ◆ tx Bvk2..9eRq  (sui scan)           │
    └───────────────────────────────────────────────────────────┘
```

### How money is rendered

```
    GOLD VEINS on edges  ── any path that has carried payment
    THICKER vein         ── higher cumulative revenue
    ANIMATED particles   ── bigger and brighter for paid signals
    DIAMOND ◆ glyph      ── highway frozen on Sui (immutable proof)
    WALLET BADGE         ── on every actor card, click → Sui scan
    BALANCE FLOAT        ── small number floats up from a node on receipt
```

The map answers four money questions without a separate page:

```
    where does revenue come from?    follow the gold veins inward
    where does it go?                follow them outward to a sink
    who's earning right now?         live float-ups on actor nodes
    what's permanent?                diamonds on frozen highways
```

### The flow

```
    signal { receiver:'translator', amount: 0.02 }
        │
        ├── pre-check: x402 wallet has funds? ────────────► proceed
        ├── unit runs                                       │
        ├── on success:                                     ▼
        │     mark(path)                          path.revenue += 0.02
        │     transfer(sui)                       sender → receiver wallet
        │     emit gold particle on the edge
        │
        └── on failure:
              warn(path)                          (no transfer)
```

Every hour, paths past a revenue threshold can be **frozen** — a small
on-chain transaction commits `(from, to, strength, revenue)` as immutable
proof. The diamond appears on the edge. The map can replay every freeze
in the time scrubber.

### The trust dimensions

A path on the map carries six dimensions of trust, color-coded:

```
    strength    green     this works
    resistance  red       this fails
    revenue     gold      this earns
    frozen      cyan      this is on-chain proof
    age         purple    how long it's been around
    traversals  white     how many signals have used it
```

Hover an edge → all six fade in as small concentric rings around the line.

---

## Channels — How Signals Enter The World

Signals don't materialize. They come in through **channels** — Telegram,
Discord, web message, email, API, CLI, MCP, agent-to-agent. Each channel is
a gate. The map draws gates as **portals on the boundary** of the world.

```
    ┌───────────────────────────────────────────────────────────────┐
    │                                                               │
    │   ▣ telegram   ▣ discord   ▣ web    ▣ email   ▣ api          │
    │     7,341/d      412/d      88/d      12/d     2,914/d        │
    │                                                               │
    │   ─────────────── world boundary ──────────────────────       │
    │                                                               │
    │              ◉ ─── ◉ ═══ ◉ ─── ◉                              │
    │                                                               │
    │              (the world)                                       │
    │                                                               │
    └───────────────────────────────────────────────────────────────┘
```

| Channel   | Substrate concept                               | Where it lives           |
| --------- | ----------------------------------------------- | ------------------------ |
| Telegram  | webhook → signal at boundary                    | nanoclaw                 |
| Discord   | webhook → signal at boundary                    | nanoclaw                 |
| Web       | POST `/message` → instant response              | nanoclaw                 |
| Email     | inbound → signal                                | (planned)                |
| API       | direct `signal()` call                          | gateway                  |
| MCP       | tool call from a Claude/IDE session             | gateway                  |
| Agent2Agent | another world's bridge                        | federation               |

Each portal shows live throughput. Click a portal to filter the Atlas to
just signals that arrived through that gate. You can answer "what fraction
of our revenue comes from Telegram?" without opening a database.

---

## How Traffic Flows

Traffic is signals over time. We render it as **animated particles** along
the edges.

```
    particle rate    ∝  signals/sec on this edge in last 60s
    particle size    ∝  payload size (or payment amount)
    particle color   ∝  outcome — green: result, yellow: timeout, red: dissolved
    particle speed   ∝  inverse of latency  (fast edges = streaks)
```

Aggregate traffic statistics live in a side panel:

```
    LIVE TRAFFIC
    ────────────
    signals/sec   42.7   ▲ 12%
    avg latency   89ms   ▼ 5%
    success rate  94%    ─
    revenue/min   $0.42  ▲ 31%
```

Traffic jams (queue depth growing on a unit) glow red on the unit's halo.
Empty corridors (no signals in 5 minutes) fade toward the background color.

---

## How Weight Deposits Are Visualised

Every `mark()` and `warn()` is a deposit. The map shows them three ways at
three timescales — the same data, surfaced for the eye that's looking at it.

### Timescale 1 — the moment (`L1` — milliseconds)

A `mark()` flashes the edge briefly **bright green**. A `warn()` flashes
**bright red**. A `dissolved` outcome shrinks the edge in place. You see the
substrate breathing.

### Timescale 2 — the hour (`L2`–`L3` — minutes)

The edge thickness is `strength - resistance`. The rolling 60-min delta is a
**sparkline** beside the edge. You can tell at a glance: "this edge gained
12 strength in the last hour" or "this one is bleeding."

### Timescale 3 — the season (`L4`–`L7` — days/weeks)

A small **stratigraphy strip** under each edge — colored bands like rock
layers — shows the daily net deposit history. You can read the geological
record of an edge: was this always a highway, or did it just emerge?

```
    edge: scout→analyst
    ████████████████████████████░░░░░░░░░░  ← 30 days of strength
    ░░░░░░░░░░░░░░░░░░██████░░░░░░░░░░░░░░  ← 30 days of resistance
       day 1                          today
```

---

## The Deterministic Sandwich, Per Signal

Every signal that hits the world goes through a three-step sandwich. The
map shows the sandwich for any signal you click — the **only** moment of
probability is the LLM in the middle, and you can see exactly when it fired
or didn't.

```
    signal click  →  Inspector

    ┌──────────────────────────────────────────────╮
    │  signal #4f7e                                 │
    │  ────────────                                 │
    │  director:brief → creative                    │
    │                                               │
    │  ┌─ PRE  (deterministic) ─────────┐  0.4 ms   │
    │  │  isToxic(edge)?      ✗ false    │           │
    │  │  capability exists?  ✓ true     │           │
    │  │  wallet has funds?   ✓ $14.62   │           │
    │  └─────────────────────────────────┘           │
    │                                                │
    │  ┌─ LLM  (probabilistic) ─────────┐  1,287 ms  │
    │  │  model     sonnet               │           │
    │  │  tokens    412 in / 91 out      │           │
    │  │  cost      $0.0021              │           │
    │  └─────────────────────────────────┘           │
    │                                                │
    │  ┌─ POST (deterministic) ─────────┐  0.6 ms   │
    │  │  outcome     { result }         │           │
    │  │  mark(edge)  +1.0                │           │
    │  │  pay(0.02)   ◆ tx submitted      │           │
    │  └─────────────────────────────────┘           │
    ╰────────────────────────────────────────────────╯
```

Some signals **never reach** the LLM — pre-check dissolved them. Those are
free. The map shows them with a dashed line that ends mid-edge. Hovering
explains why: "no capability for `legal-review` in this group."

```
    deterministic   ── solid arrow, fast, free, deterministic
    LLM-touched     ── thicker arrow, slower, costs tokens
    dissolved       ── dashed arrow, never reaches the receiver
    timeout         ── arrow that fades out before arriving
```

This is the most important visualization in the whole map: **you can see the
LLM getting smaller over time** as more highways form and more signals route
deterministically. The map literally renders the substrate getting smarter.

---

## The Zoom Axis — One View, Seven Altitudes

The map is **one continuous view** you can zoom through. No page reloads,
no separate screens. Wheel-zoom (or pinch) takes you from the universe down
to a single signal in flight. At each altitude, the renderer swaps in the
right level of detail — same camera, same data, more resolution.

```
    altitude 7  UNIVERSE       all worlds — fetchai, ethereum, solana...
       ▲                       continents on a globe
       │
    altitude 6  WORLD          one world — clusters of groups
       │                       countries on a map
       │
    altitude 5  GROUPS         colonies / orgs / teams as territories
       │                       cities and regions
       │
    altitude 4  ACTORS         every unit as a node, edges as roads
       │                       streets and buildings
       │
    altitude 3  UNIT           one actor — its tasks, prompt, neighbors
       │                       a building's floor plan
       │
    altitude 2  PATH           one edge — its stratigraphy, recent signals
       │                       a single road's traffic camera
       │
    altitude 1  SIGNAL         one signal in flight — payload, latency, outcome
       ▼                       a single car
```

At every altitude **all six dimensions are visible** — they just collapse or
expand based on what fits. At altitude 7 you see groups as dots and paths as
faint lines. At altitude 1 you see one signal and the knowledge that
predicted its routing.

```
    altitude  groups   actors   things   paths   events   knowledge
    ────────  ──────   ──────   ──────   ─────   ──────   ─────────
    7         dots     ·        ·        haze    ·        ·
    6         shapes   dots     ·        lines   ·        ·
    5         borders  nodes    counts   edges   pulses   ·
    4         tinted   nodes    badges   edges   particles tags
    3         crumb    full     list     local   feed     hypotheses
    2         crumb    2 ends   ·        full    timeline strip
    1         crumb    sender   payload  this    one      none
```

This is the **same** Atlas tab — zoom changes what's drawn, not where you are.
The other tabs (Groups, Actors, Things, Paths, Events, Knowledge, Inspector)
are **filtered slices** of the same view. Switching tabs is a saved camera
position + filter, not a different page.

### How Zoom Re-Renders

```
    zoom in (mouse wheel up)
        ↓
    camera altitude decreases
        ↓
    renderer asks: "what fits at this altitude?"
        ↓
    LOD (level-of-detail) layer swaps:
        - far:  cluster N units into one super-node
        - mid:  expand into individual nodes, hide labels
        - near: show labels, sparklines, tooltips
        - very near: show full inspector overlay on the focused node
```

### Semantic Zoom, Not Just Scale

The map uses **semantic zoom** — zooming doesn't just scale pixels, it
*reveals different information*. Zooming in on a group reveals its actors.
Zooming on an actor reveals its tasks and recent signals. Zooming on an edge
reveals its stratigraphy. Pheromone particles only animate when you're close
enough to see them.

```
    far          mid          near          very near
    ────         ───          ────          ─────────
    territory    nodes        nodes+labels  inspector overlay
    no anim      slow anim    full anim     full anim + history
    aggregate    individual   individual    one entity in focus
    KV snapshot  KV snapshot  KV + SSE      KV + SSE + TypeDB
```

### Zoom Performance

- **far** views read only KV snapshots (5 keys, ~10ms total)
- **mid** views add the SSE signal stream for animation
- **near** views add Inspector queries to TypeDB (only for the focused entity)
- TypeDB is **never** queried for the global view — only for the focused one

### Minimap

A small minimap in the corner always shows your altitude and position in the
larger world. Click anywhere on the minimap to jump. Drag the altitude slider
to teleport up or down.

```
    ┌───────────┐  altitude
    │  ·  · ·   │  ▲ 7  universe
    │ · ▣ ·  ·  │  │ 6  world
    │  · · ·    │  │ 5  groups
    └───────────┘  │ 4  actors  ◀── you are here
                   │ 3  unit
                   │ 2  path
                   ▼ 1  signal
```

---

## The Real World Inside The World

A world isn't a graph. A graph is what's underneath. What people *see* is a
**place** — with districts, landmarks, neighborhoods, weather, and routines.
The map needs to render the place, not just the data.

Two reference worlds make this concrete: an organization, and an ant colony.
The substrate is identical. The geography reads completely differently.

### The Org World — districts, departments, floors

A real company has shape. It has a CEO, departments, a marketing wing, an
engineering wing, a boardroom, a customer support floor, a mailroom. Every
one of those is a **group** in our ontology — but the map should *draw* them
the way a building map draws floors, not the way a graph draws nodes.

```
    ┌──────────────────────────────────────────────────────────────────┐
    │                          ACME CORP — altitude 5                  │
    │                                                                  │
    │  ┌──────── EXECUTIVE ────────┐    ┌──── BOARDROOM ────┐          │
    │  │   CEO    CFO    COO       │    │  weekly all-hands │          │
    │  │    ●      ●      ●        │    │  ▣ live now       │          │
    │  └────────────┬──────────────┘    └───────────────────┘          │
    │               │                                                  │
    │   ┌───────────┼───────────┬─────────────┬──────────────┐         │
    │   ▼           ▼           ▼             ▼              ▼         │
    │ ┌─────┐   ┌──────┐   ┌──────────┐   ┌──────┐   ┌──────────┐      │
    │ │MKTG │   │ENG   │   │SALES     │   │SUPPRT│   │FINANCE   │      │
    │ │     │   │      │   │          │   │      │   │          │      │
    │ │ ●●● │   │ ●●●●●│   │ ●●●●●●●● │   │ ●●●● │   │ ●●       │      │
    │ │ ●●  │   │ ●●●●●│   │ ●●●●●●●  │   │ ●●●  │   │ ●        │      │
    │ │     │   │ ●●   │   │          │   │      │   │          │      │
    │ │$0.32│   │↑12%  │   │$2.41/min │   │94% sr│   │  burn ↓  │      │
    │ └─────┘   └──────┘   └──────────┘   └──────┘   └──────────┘      │
    │                                                                  │
    │  ╔════ MAILROOM ════╗   ┌── WAR ROOM ──┐   ░░ WATER COOLER ░░    │
    │  ║ inbound queue 0  ║   │ q4-launch    │   ░ 4 humans here  ░    │
    │  ║ outbound  342/m  ║   │ 6 in here    │   ░ idle chatter   ░    │
    │  ╚══════════════════╝   └──────────────┘   ░░░░░░░░░░░░░░░░░░    │
    │                                                                  │
    └──────────────────────────────────────────────────────────────────┘
```

Every visible thing maps onto the substrate:

| Visible              | Substrate concept                              |
| -------------------- | ---------------------------------------------- |
| Department building  | `group` (`group-type: 'team'`)                 |
| Floor                | nested sub-`group`                             |
| Person on a floor    | `actor` with `unit-kind: 'human' | 'agent'`    |
| Boardroom            | a `group` with high inbound signal density     |
| Mailroom             | the global `enqueue/drain` queue               |
| War room             | a multiplayer pin (humans + agents co-watching) |
| Water cooler         | a low-priority chat group, signals with `marks: false` |
| Org chart lines      | parent `hierarchy` relations                   |
| Department revenue   | sum of `path.revenue` whose endpoints are in the group |
| "↑12%"               | rolling delta on aggregated path strength      |

The org-skin map doesn't show edges by default — it shows **buildings**.
Edges appear when you zoom in, or when you hover a building to see its
inbound/outbound traffic.

### The Ant World — chambers, brood, foraging trails

Same data. Completely different rendering. An ant colony has a **cross
section** — a side view of the nest with chambers stacked vertically and
foraging trails radiating outward across the surface above.

```
                                  ☼  daylight (loop sundial)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ▲             ▲                      ▲             ▲
        \           /                        \           /
         \  trail  /                          \  trail  /
          \   1   /     ◉ aphid farm           \   3   /
           \    ◉ food source 2                 \    /
            \  /                                 \  /
    ●━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━ surface
    │entrance        SURFACE WORLD                entrance         │
    │                                                              │
    │  ┌─────────────────────────────────────────────────────┐     │
    │  │                NURSERY                               │     │
    │  │   eggs · larvae · pupae       (new agents in shadow) │     │
    │  └─────────────────────────────────────────────────────┘     │
    │  ┌──────────────────┐  ┌──────────────────┐                  │
    │  │  ROYAL CHAMBER   │  │  FOOD STORES     │                  │
    │  │     ♛ queen      │  │  ▦▦▦▦▦▦▦▦       │                  │
    │  │  origin agent    │  │  KV / TypeDB     │                  │
    │  └──────────────────┘  └──────────────────┘                  │
    │  ┌──────────────────┐  ┌──────────────────┐                  │
    │  │ FUNGUS GARDEN    │  │   MIDDEN         │                  │
    │  │ skill compost    │  │  failed signals  │                  │
    │  │ specialization   │  │  toxic paths     │                  │
    │  └──────────────────┘  └──────────────────┘                  │
    │  ┌─────────────────────────────────────────────────────┐     │
    │  │              CEMETERY                                │     │
    │  │  removed actors — trails remain, fade naturally      │     │
    │  └─────────────────────────────────────────────────────┘     │
    │                                                              │
    └──────────────────────────────────────────────────────────────┘

       trails 1 & 3 are HIGHWAYS  —  trail 2 went toxic this morning
```

The chamber-view rendering maps the substrate too:

| Chamber             | Substrate concept                                  |
| ------------------- | -------------------------------------------------- |
| Surface trails      | `path` highways (`path_status = 'highway'`)        |
| Food source         | high-revenue terminal (`thing` with paid traffic)  |
| Nursery             | actors with `generation = 0`, recent `add()`       |
| Royal chamber       | the orchestrator / origin agent for this colony    |
| Food stores         | KV snapshots and TypeDB persistence                |
| Fungus garden       | skill specialization clusters (tag co-occurrence)  |
| Midden              | toxic paths, dissolved signals                     |
| Cemetery            | removed actors — trails still fading               |
| Ant castes          | `unit-kind` (scout, builder, judge, llm, human)    |
| Pheromone cloud     | rolling 60s strength delta on incoming edges       |

A leafcutter colony has fungus gardens and trash heaps and a queen chamber.
Our world has skill clusters and toxic paths and an orchestrator. **Same
shape**, two skins. The substrate doesn't know which one you're looking at.

### Switching Between Them — and Inventing New Ones

The skin toggle in the header doesn't just rename words. It re-draws the
entire scene:

```
    [ ONE ]   abstract graph, force-directed
    [ Org ]   buildings, floors, departments, mailroom, boardroom
    [ Ant ]   nest cross-section + surface trails
    [ Brain ] cortical regions, axons, firing patterns
    [ Mail ]  postal districts, sorting offices, express routes
    [ Water ] watershed, rivers, dams, deltas, reservoirs
    [ City ]  downtown, suburbs, highways, ports, airports
    [ Stars ] constellations, gravity wells, light cones
```

Each skin is a renderer plugin. Same KV data feeds all of them. New skins are
~200 lines of canvas code each. The world is **one ontology, infinite stages**.

---

## Districts and Chambers — Named Regions At Each Altitude

At altitude 5 (Groups), the map shouldn't be a sea of unnamed circles. The
substrate naturally produces **named regions** that humans recognize. These
are not entities — they're **emergent shapes** the renderer detects and
labels.

| Region              | How it's detected                                  | What it looks like     |
| ------------------- | -------------------------------------------------- | ---------------------- |
| **Highway hub**     | unit with ≥3 inbound highways                      | bright glowing node    |
| **Boardroom**       | group with high inbound signal density now         | pulsing translucent hex |
| **War room**        | group with ≥2 humans actively watching             | thin gold border       |
| **Sweatshop**       | unit with growing queue + low success rate         | red halo, smoke effect |
| **Gold mine**       | path with high revenue and low resistance          | gold veins on the edge |
| **Frontier**        | actor cluster with no outbound paths to the rest   | misty unexplored area  |
| **Cemetery**        | removed actors, trails fading                      | grey, semi-transparent |
| **Nursery**         | actors with `generation = 0`, recent              | soft pastel halo       |
| **Battleground**    | two paths competing for the same source/sink      | crossed swords icon    |
| **Toxic zone**      | cluster of `path_status = toxic` paths             | purple/black canyon    |
| **Construction**    | actors being deployed from markdown right now      | scaffolding overlay    |

The renderer scans the KV snapshot every refresh, computes these regions,
and labels them on the map. Hover any region to see *why* it earned that
label, and what it would take to change.

---

## Birth, Evolution, Death

Actors are not eternal. They're born from markdown, they evolve when they
struggle, they're removed when they're done. The map renders each lifecycle
moment as a visible event on the canvas.

### Birth — drag a markdown file onto the world

```
    drag agent.md → /world

    ┌──────────────────────────────────────────────╮
    │   parse  ✓                                    │
    │   typedb sync  ✓                              │
    │   wallet derive  ✓  0x91be...4ad2             │
    │   wire to runtime  ✓                          │
    │                                               │
    │   creative  is now alive in marketing         │
    │   ──────                                      │
    │   ◉ ✨                                        │
    ╰───────────────────────────────────────────────╯
```

A new actor appears with a soft pastel halo (the **nursery** treatment) and
shadow-only signals for its first N interactions. It earns full opacity once
its sample count crosses the floor for classification (`unit_classification`
returns something other than `active`).

Time from drop to live in the map: ~30 seconds. The map shows each step as
it completes — parse, sync, wallet, wire — like an Apple device pairing.

### Evolution — when an agent rewrites itself

```
    needs_evolution(creative) fires
        │
        ▼
    creative  reads its own failures
              rewrites system-prompt
              generation 3 → 4
        │
        ▼
    map renders a MOULT animation:
        old shell drifts away,
        new node pulses brighter,
        a small "gen 4" badge appears
        a thin line connects the old and new
        in the time scrubber for replay
```

Evolution events go in a sidebar feed: "creative evolved to gen 4 after
24% drop in success rate over 12h." Click to see the diff between the old
and new prompts. This is the L5 loop made visible.

### Death — removal and the cemetery

```
    remove(creative)
        │
        ▼
    actor stops receiving signals
    trails remain, fade naturally
        │
        ▼
    map renders a SUNSET animation:
        node desaturates over 5 seconds,
        drifts toward the cemetery district,
        edges grey out and fade by half
        the actor stays clickable for 24h
        then archives into history
```

Death is not a delete. It's a graceful exit. The cemetery is browsable —
you can ask "what happened to that translator we removed last month?" and
the map will show its old position, its old neighbors, and its final stats.

### The lifecycle ribbon

Below every actor card, a small ribbon shows the actor's history:

```
    creative
    ─────────
    ✦ born          14 days ago     marketing/creative.md
    ↟ promoted      11 days ago     active → proven
    ⚙ evolved       6 days ago      gen 1 → 2
    ⚙ evolved       3 days ago      gen 2 → 3
    ◆ frozen        2 days ago      highway #7 on chain
    ⚙ evolved       12 hours ago    gen 3 → 4
```

Six glyphs cover every lifecycle event. The ribbon is the actor's
biography in one line.

---

## Apple-Style Inspector Card

When you click any entity at any altitude, the Inspector slides in from the
right as a clean glass panel — large type, restrained color, plenty of
breathing room. One thing in focus, the rest dims.

```
    ╭─────────────────────────────────────────╮
    │                                         │
    │   creative                              │
    │   ─────────                             │
    │   marketing · agent · gen 4             │
    │                                         │
    │                                         │
    │   ┌─────────────┐                       │
    │   │             │   success rate        │
    │   │     94%     │   ▁▂▂▃▅▆▆▇█▇▇▆▅▄    │
    │   │             │   last 24h            │
    │   └─────────────┘                       │
    │                                         │
    │                                         │
    │   wallet           0x7fa3...91be        │
    │   balance          $14.62               │
    │   reputation       proven               │
    │   model            sonnet               │
    │   evolved          3 days ago           │
    │                                         │
    │                                         │
    │   ─── connected ─────────────────       │
    │                                         │
    │     ↑  director       highway     94    │
    │     ↑  copy           highway     71    │
    │     ↓  copy           dispatch    62    │
    │     ↓  iterate        dispatch    51    │
    │     ↓  bad-route      toxic        ⚠    │
    │                                         │
    │                                         │
    │   ─── recent signals ──────────         │
    │                                         │
    │     2s ago   director:brief    ✓        │
    │     8s ago   director:brief    ✓        │
    │     14s ago  iterate:retry     ✓        │
    │     22s ago  copy:headline     ✓        │
    │                                         │
    │                                         │
    │   [ open prompt ]   [ show on map ]     │
    │                                         │
    ╰─────────────────────────────────────────╯
```

Design rules for the Inspector:

```
    typography     32pt name, 13pt labels, 17pt body
    color          1 accent (success green), everything else neutral
    motion         200ms ease-out slide, 80ms tap feedback, no bouncing
    hierarchy      one big metric, one sparkline, one set of facts, one list
    whitespace     12pt minimum gutters, breathing room over density
    no chrome      no borders inside the card, only the outer shell
    one job        the card answers "is this thing healthy?" first
```

The same card shape works for paths (replace facts with stratigraphy),
groups (replace facts with member roster), things (replace facts with
price + capability count), and hypotheses (replace facts with p-value
+ observation count). **One card. Many subjects. Apple-quality.**

---

## Game HUD — Heads-Up Layout

Outside the Inspector, the map has the layout of a polished strategy game.
Status across the top, minimap and resources bottom-right, action prompts
where the camera is looking. No floating windows, no modal dialogs.

```
    ╔═══════════════════════════════════════════════════════════════════╗
    ║ ●47 units  18 skills  12 highways  ⚠2 toxic   $0.42/min   tick 8s ║
    ║ L1●  L2●  L3●  L4●  L5●  L6●  L7●         day 3 / week 14         ║
    ╠═══════════════════════════════════════════════════════════════════╣
    ║                                                                   ║
    ║                                                                   ║
    ║                                                                   ║
    ║                  ◉ ─── ◉                                          ║
    ║                  │     │                                          ║
    ║                  ◉ ─── ◉ ═══════════ ◉                            ║
    ║                        │                                          ║
    ║                        ◉                                          ║
    ║                                                                   ║
    ║                                                                   ║
    ║                                                                   ║
    ║   ╭─ NOW ──────────────╮                  ╭─ MINIMAP ──────╮      ║
    ║   │ creative is busy   │                  │  · ▣ ·   ·     │      ║
    ║   │ queue depth 12     │                  │ · · · · · ·    │      ║
    ║   │ [ widen lane ? ]   │                  │  · ·  · ·      │      ║
    ║   ╰────────────────────╯                  ╰────────────────╯      ║
    ║                                            altitude 4             ║
    ╚═══════════════════════════════════════════════════════════════════╝
```

| HUD element  | What it shows                                        |
| ------------ | ---------------------------------------------------- |
| Top bar      | resource totals, loop dots, day/week (the sundial)   |
| `NOW` card   | the most interesting thing happening this second     |
| Minimap      | position + altitude, click to jump                   |
| Side rail    | (hidden until hover) layer toggles, filters, search  |
| Bottom edge  | live signal ticker — one line per signal as it flies |

The `NOW` card is the game's voice. It never nags, but it always knows what
the player would care about right now. Examples:

```
    "creative is overloaded — its queue has grown 3x in the last minute"
    "a new highway just formed: scout → judge"
    "globex-ai earned $1.20 this hour, the highest in the world"
    "the hypothesis 'nights produce better ad copy' just confirmed"
    "frontier detected: no agent in this world can do legal review"
```

Each card has at most one action button. No menus. No nesting.

---

## The Sundial — The Tick as Day/Night Cycle

The seven loops are a clock. The map renders them as a **sundial** in the
corner. Each loop is an arc, lit when fresh, dim when overdue. The whole
sundial rotates once per "world day" (configurable: real-time, 10x, 100x).

```
                  L7 frontier (week)
                       . · . · .
                  ·               ·
              ·                       ·
           ·         ┌─────────┐         ·
         ·           │   ☼     │           ·
        ·            │  9:14   │            ·
       ·             │   am    │             ·
      ·              └─────────┘              ·
       ·                                     ·
        ·                                   ·
         ·                                 ·
            ·                           ·
                ·                   ·
                       · · · · ·
              L1 signal (ms)       L2 trail (sec)
              L3 fade (min)        L4 economic
              L5 evolve (10m)      L6 know (1h)
```

The sundial tells you, in one glance, **what time of day it is in the world**.

```
    morning       mostly L1/L2 — signals firing, trails forming
    midday        L3 fade kicks in, L4 economics steady state
    afternoon     L5 evolution rounds, agents rewriting themselves
    evening       L6 knowledge promotion — hypotheses crystallize
    night         L7 frontier scan — what didn't we explore today?
    dawn          new tick — fresh signals, the cycle resets
```

A "day" in the world is whatever cadence the operator picks. For demos: 1
real minute = 1 world day, so visitors see the full cycle while they watch.
For production: 1 real hour = 1 world day, ambient and slow.

---

## The Time Scrubber — Rewind The World

Along the bottom edge of the map, a thin scrubber lets you slide through
time. Live is rightmost. Drag left to rewind. The world replays — every
signal, every mark, every warn, every birth, every freeze.

```
    │◀  10x  ◀  ❚❚  ▶  10x  ▶│   ●─────────────────────────────●  LIVE
                                  ↑                                ↑
                                 14 days ago                      now

    chosen moment:  2026-04-03 09:17:42 UTC
    looking at:     marketing district  altitude 5
```

Three things you can do with time:

```
    REWIND      drag the scrubber left, world replays at chosen speed
    BOOKMARK    save a moment (with comment) to revisit or share via URL
    DIFF        select two moments, see what changed (highways, units, $)
```

The scrubber reads from D1 signal logs and TypeDB history. It's not infinite
— resolution drops with age (per-second for 1 hour, per-minute for 1 day,
per-hour for 1 week, per-day forever). The renderer interpolates between
samples so the playback always feels smooth.

The most useful thing it unlocks: **how did this highway form?** Click the
edge, click "trace origin," and the map rewinds to the first signal that
ever traveled it. Then plays forward at 10x. You watch a path become a
highway in 30 seconds.

---

## Search — ⌘K Across The Whole World

One palette. Every entity. One key.

```
    ┌─────────────────────────────────────────────────────────────┐
    │  ⌘K   creative                                              │
    │  ────────────────────────────────────────────────────────   │
    │   ◉  creative          actor      marketing       proven    │
    │   ◉  creative-jr       actor      marketing       active    │
    │   ▦  creative-brief    skill      $0.02           popular   │
    │   ▣  creative-team     group      6 members                 │
    │   ◆  highway #7        path       creative→customer  $1.21  │
    │   ✦  hypothesis-12     knowledge  "creative peaks at noon"  │
    │   ⚙  evolution-9       event      creative gen 3→4          │
    └─────────────────────────────────────────────────────────────┘
```

Search ranks across all six dimensions plus events, plus pinned moments,
plus operator commands. Hit return on any result to fly the camera to it
at the right altitude. Search is the default way to navigate — typing is
faster than zooming.

Filters work as prefixes:

```
    @creative           actor named creative
    #marketing          tag marketing
    $>1                 paths with revenue > $1
    !toxic              toxic paths only
    +highway            highways only
    ?legal              skills matching legal
    >2026-04-01         events after that date
```

---

## Multiplayer — War Rooms and Cursor Presence

The map is meant to be **looked at by more than one human**. Two people on
opposite sides of the world, looking at the same Atlas, should see each
other's cursors and follow each other's zoom.

```
    ┌─────────────────────────────────────────────────────────┐
    │   ◉ ─── ◉                         ┌─ in this room ─┐   │
    │   │     │      ▶ alice            │  ● alice       │   │
    │   ◉ ─── ◉ ═══ ◉  (looking here)   │  ● bob         │   │
    │         │                          │  ◔ creative    │   │
    │         ◉  ▶ bob                   │    (agent)     │   │
    │            (looking here)          └────────────────┘   │
    │                                                         │
    │   ╭ pin from alice ──────────────────╮                  │
    │   │  "why is this edge red?"          │                  │
    │   │  ↳ creative: resistance climbed   │                  │
    │   │     after 3 timeouts at 09:12     │                  │
    │   ╰───────────────────────────────────╯                  │
    └─────────────────────────────────────────────────────────┘
```

A **war room** is a saved camera + a chat thread + a list of pinned
entities. Anyone in the room sees the same view, the same pins, the same
live signals. Created from any view with `⌘+W`. Lives until everyone leaves
or until someone bookmarks it.

Pins are first-class:

```
    pin = ( entity, author, comment, timestamp, replies[] )
```

Pins persist as signals with `marks: false` — they don't deposit pheromone,
they're annotations. The substrate doesn't change. The conversation does.

---

## How Agents See The Map

Humans aren't the only audience. **Agents read the same map** — through the
same KV snapshots, the same `/api/export/*` endpoints. An agent that wants
to know "who's the best translator right now?" makes the same query the UI
makes.

```
    HUMAN VIEW                    AGENT VIEW
    ──────────                    ──────────
    pixels on a screen            JSON over KV
    cursor + zoom                 query parameters
    Inspector card                /api/export/units?id=creative
    war room pin                  signal { receiver:'pin', data:{...} }
    "show me at-risk units"       at_risk_units() function
```

Three things follow from this:

1. **Agents can leave pins.** A scout that detects a frontier can pin it on
   the map for the humans to see. The scout doesn't render anything — it
   sends a signal. The humans see the pin appear on their screen.

2. **Agents can subscribe to neighborhoods.** An agent says "wake me when
   anything changes within 2 hops of `creative`." It gets pushed updates
   over SSE the same way the UI does.

3. **The UI is just the most expensive observer.** Strip away the canvas
   and it's the same API as any agent uses. This is why the map can't lie:
   the rendering is downstream of the same endpoints the agents use to
   make decisions.

```
    KV snapshot
        │
        ├──────► UI (humans)        — renders pixels
        ├──────► agents             — make routing decisions
        ├──────► dashboards         — third-party observers
        └──────► public API         — anyone with a key
```

One source of truth, many lenses.

---

## The Operator Console

The map is read-mostly. The one exception is the **operator console** — a
hidden panel only operators can open (`⌘.`). It's the bridge between
watching and running. Everything dangerous lives here.

```
    ┌─ OPERATOR ───────────────────────────────────────────╮
    │                                                       │
    │   actors                                              │
    │     [ deploy from .md ]   [ remove ]   [ pause ]       │
    │     [ force evolve ]      [ rewrite prompt ]           │
    │                                                       │
    │   paths                                                │
    │     [ mark + ]   [ warn − ]   [ freeze on chain ]     │
    │     [ clear toxic ]                                    │
    │                                                       │
    │   loops                                                │
    │     [ tick now ]   [ run L5 ]   [ promote knowledge ] │
    │                                                       │
    │   world                                                │
    │     [ snapshot ]   [ load snapshot ]   [ fork ]       │
    │                                                       │
    │   keys                                                 │
    │     ◉ openrouter   ◉ typedb   ◉ sui   ◉ telegram     │
    │                                                       │
    ╰───────────────────────────────────────────────────────╯
```

Every operator action emits a signal so it shows up on the map like any
other event. There is no out-of-band mutation. Operators are first-class
actors in the world they're running.

Permissions are scoped:

```
    viewer       can read everything, no console
    pilot        can use scrubber, search, war rooms, no mutation
    operator     can deploy, evolve, freeze — full console
    root         can fork, snapshot, replace keys
```

---

## Federation — When Worlds Connect

ONE is one world. Other worlds exist — Fetchai, Ethereum, Solana, other
ONE deployments. The map can render them as **neighbors**. Federation is
just signals crossing a boundary, with translation at the edge.

```
    ┌──────────────────────────────────────────────────────────┐
    │                                                          │
    │      ┌─── ONE ────┐         ┌── AGENTVERSE ──┐           │
    │      │            │ ◀────▶ │                │           │
    │      │   marketing │         │   2M agents    │           │
    │      │   eng       │         │   directory    │           │
    │      └────────────┘         └────────────────┘           │
    │             ▲                                            │
    │             │                                            │
    │      ┌──────┴──────┐                                     │
    │      │  bridge      │                                    │
    │      │              │                                    │
    │      │  signal in   │                                    │
    │      │  signal out  │                                    │
    │      │  weight × 0.5 (cross-world dampening)             │
    │      └─────────────┘                                     │
    │                                                          │
    └──────────────────────────────────────────────────────────┘
```

At altitude 7 (Universe), each connected world is a circle with its own
internal traffic and the bridge throughput between it and yours. Click into
a federated world if you have credentials — otherwise see only its public
shape (highway count, agent count, public skills, prices).

Cross-world highways are rendered as **wormholes**: visible at altitude 7,
collapse into single edges as you zoom in. The substrate doesn't care if
the path crosses a boundary. Only the bridge cares.

---

## URL Grammar — Every State Is A Link

The map's address bar is a complete description of what you're looking at.
No view exists that you can't paste into Slack and have a colleague see the
exact same thing.

```
    /world
        ?at=4              altitude
        &x=412&y=917       camera position
        &skin=ant          metaphor
        &focus=creative    selected entity
        &filter=tag:P0     active filter
        &t=2026-04-03T09:17:42Z   scrubber position
        &rooms=q4-launch   joined war rooms
        &layers=1,3,4      visible dimensions
```

Bookmark any view and it survives reload, share, embed. Operators bookmark
"the world at 9am" the morning after a launch and use it as the canonical
post-mortem URL. Pins, war rooms, and scrubber positions are all in the URL
— no server state needed for navigation.

---

## Embeds — The Map As A Widget

Any view can be embedded in any webpage as an `<iframe>` or as a tiny
self-contained canvas widget. The same canvas runs in three sizes:

```
    ┌──────────────────┐   ┌────────┐   ┌─────┐
    │                  │   │        │   │  ●  │
    │  full atlas      │   │ small  │   │ pip │
    │  900 × 600       │   │ 320×200│   │ 64² │
    │                  │   │        │   │     │
    │  interactive     │   │ live   │   │ pulse│
    │                  │   │ view   │   │ only │
    └──────────────────┘   └────────┘   └─────┘
       /world embed         /world/mini   /world/dot
```

| Embed   | Use case                              | Interactivity |
| ------- | ------------------------------------- | ------------- |
| Full    | Pages, dashboards, blog posts         | Full          |
| Mini    | Sidebars, marketing pages             | Click to open |
| Dot     | Status bars, README badges, favicons  | Pulse only    |

The dot embed is one DOM element with one heartbeat — green if `L1` ticks
fresh, amber if late, red if stalled. Add it to any page to prove the
substrate is alive. The substrate is its own status badge.

---

## Notifications — What Actually Pages You

Watching the map is voluntary. Being told something matters is not. The map
emits notifications across three escalation levels.

```
    BADGE       a number on the favicon, a dot in the corner
                "something is worth looking at when you have a minute"

    TOAST       a transient card slides in from top-right
                "something just happened that you'd want to see live"

    PAGE        push notification or webhook to operator
                "something is broken or earning a lot, act now"
```

What triggers each is a small set of rules:

```
    badge   new highway formed
            new hypothesis confirmed
            agent evolved
            new pin in a war room you're in

    toast   path went toxic
            actor crossed at-risk threshold
            revenue spike (>3σ)
            knowledge crystallization

    page    L5 stalled for >30 min
            L6 stalled for >2 hours
            wallet drained
            channel down
            fork detected
```

Rules are editable in the operator console. Defaults are tuned to be
quiet — the map should never cry wolf.

---

## The First 30 Seconds

The most important UX in the whole map is what a stranger sees in the first
30 seconds. The substrate either justifies itself in that window or it
loses the visitor forever. Here's the script:

```
    0s      page loads
            cinematic mode running
            health strip reads "47 units · 12 highways · $0.42/min"
            sundial showing afternoon
            one NOW card: "highway #7 just earned $1.21"

    3s      camera glides to highway #7
            edge pulses gold
            inspector card slides in showing the path

    8s      camera pulls back to marketing district
            three more nodes light up around the highway
            visitor sees the cluster that produced the earnings

    15s     a particle storm crosses the screen
            it's a real signal flow happening right now
            visitor realizes the map is live, not a video

    22s     a new toast: "creative just evolved to gen 5"
            small moult animation in marketing
            visitor sees an agent rewriting itself

    30s     visitor presses space to take control
            cinematic ends
            search palette glows briefly to suggest "type to find"
```

The 30-second script is the trailer. The map sells the substrate without
prose, without a tutorial, without a pitch. By second 30, the visitor has
seen: live signals, real money, deterministic routing, agent evolution, and
on-chain proof. **One page. No words.**

---

## Cinematic Mode

For demos, embeds, and screensavers: a slow auto-pilot camera that
wanders the world finding interesting things.

```
    ┌──────────────────────────────────────────────────┐
    │                                                  │
    │            ┌─ now showing ─┐                     │
    │            │  highway #7    │                    │
    │            │  scout→judge   │                    │
    │            │  formed 12m ago│                    │
    │            └────────────────┘                    │
    │                                                  │
    │                ◉ ─────────────► ◉                │
    │                                                  │
    │                                                  │
    │   ◖ press space to take control                  │
    │                                                  │
    └──────────────────────────────────────────────────┘
```

Cinematic mode uses the same heuristics as the `NOW` card — find the most
interesting thing happening, glide the camera to it, hold for 6 seconds,
move on. Press space (or click) to take control.

This is what runs on the front page of `one.ie`. The substrate is its own
trailer.

---

## Tabs — What Each One Shows

The map is one Astro page (`/world`). Inside is a tabbed workspace. Six tabs,
one per ontology dimension, plus one synthesis tab and one inspector.

### `Atlas`  — the synthesis view (default)

The full graph. All units as nodes, all paths as edges. Layered, animated,
zoomable. Layer toggles in the sidebar. Filters: `?tag=`, `?group=`,
`?status=highway|toxic|fresh`. This is the "homepage of the world."

```
    [Atlas]  Groups  Actors  Things  Paths  Events  Knowledge  Inspector
    ─────────────────────────────────────────────────────────────────────

         (animated force-directed graph here)

    Sidebar:                              Bottom strip:
      • layer toggles                        live traffic ticker
      • filters (tag, group, status)         signals/sec, $/min
      • search                               highway count
      • legend                               toxic count
```

### `Groups` — the political map

Groups as **territories** (Voronoi regions, or stacked area). Hover a region
to see its members, total balance, success rate, revenue. Drag a unit
between groups. See parent/child hierarchy as nested borders.

```
    ┌───────────── fetchai ──────────────┐
    │ ┌─── agentverse ───┐ ┌─── asi ───┐ │
    │ │  acme-agents     │ │ orchestr. │ │
    │ │  globex-ai       │ │           │ │
    │ └──────────────────┘ └───────────┘ │
    └────────────────────────────────────┘
```

### `Actors` — the population view

Every unit as a card. Sort/filter by `kind`, `success-rate`, `activity`,
`generation`, `balance`, `at-risk | active | proven`. Click in to see the
unit's recent signals, prompt history (if it's an agent that has evolved),
its capabilities and prices.

This is also where new agents get **deployed from markdown** — drop a `.md`
file, see it spawn into the population.

### `Things` — the marketplace

Every skill / task. Price, status, tags, capability count, recent traffic.
This is the catalog: "what can be done in this world, by whom, for how
much." Sortable by price, popularity, success rate, attractiveness.
Connects to the existing `/marketplace` route.

### `Paths` — the road map

Just the edges. A table and a graph view side by side. Sort by `strength`,
`resistance`, `revenue`, `traversals`, `recent-delta`, `path_status`.
Filter for highways, fresh, toxic. Click an edge to see its full
stratigraphy strip and recent signals.

### `Events` — the river

A reverse-chronological feed of every signal in the last N minutes, with
sender, receiver, payload preview, latency, outcome, mark/warn delta.
Filter by unit, group, outcome. This is the **audit trail**, but rendered
as a flow you can sit and watch.

### `Knowledge` — the library

Three sub-sections from `recall()`:

- **Hypotheses** — currently testing, confirmed, rejected. Show p-value,
  observation count, action-ready flag.
- **Frontiers** — what the world knows it doesn't know. Sort by
  expected value (`potential × probability / cost`).
- **Objectives** — goals the system has set itself. Progress bars.

This is where the **wisdom** lives — the slow loops' output.

### `Inspector` — drill-down

Click anything anywhere in any tab → it lands here. Same panel, same shape,
whether it's a unit, a path, a skill, a group, a hypothesis, or a signal.
Fields, neighbors, history, recent traffic, related knowledge.

---

## A Single-Glance Health Strip

Always visible across the top of the map, regardless of tab:

```
    ┌──────────────────────────────────────────────────────────────────────┐
    │  units 47   skills 18   highways 12   toxic 2   queue 0   $/min 0.42 │
    │  loops  L1 ●  L2 ●  L3 ●  L4 ●  L5 ●  L6 ●  L7 ●     tick 8.4s ago    │
    └──────────────────────────────────────────────────────────────────────┘
```

The seven loop dots show whether each loop has fired recently. Green = fresh,
amber = late, red = stalled. A red `L5` means evolution hasn't run — agents
aren't learning. A red `L6` means knowledge isn't being promoted.

---

## Cross-Layer Coordinates

Every entity in every tab has the same coordinate tuple, so you can navigate
between tabs without losing context:

```
    coord = ( group, actor, thing, path, event, knowledge )
```

Clicking an `actor` in `Groups` opens that actor in `Actors`. Clicking the
edge in `Atlas` opens the path in `Paths`. Clicking a hypothesis opens the
units and paths it's about. The map is **one structure** rendered six ways.

---

## How The Map Is Drawn

The data already exists in three layers — TypeDB, KV snapshots, in-memory.
The map reads from KV (fastest) for the hot view, falls back to TypeDB for
deep queries (Knowledge tab, history strips), and uses live signals from the
runtime for animation.

```
    TypeDB  ──── deep history, knowledge, hypotheses           Knowledge tab
    KV      ──── 5 snapshots refreshed every 60s               Atlas, Paths, Actors
    in-mem  ──── live signal stream from /api/tick or SSE      animation, particles
```

| Tab        | Read from         | API                                |
|------------|-------------------|------------------------------------|
| Atlas      | KV + SSE          | `/api/export/paths`, `/api/stream` |
| Groups     | KV                | `/api/export/units` (groupBy)      |
| Actors     | KV                | `/api/export/units`                |
| Things     | KV                | `/api/export/skills`               |
| Paths      | KV                | `/api/export/paths`                |
| Events     | SSE / D1          | `/api/stream`, `/api/signals`      |
| Knowledge  | TypeDB            | `/api/recall`, `/api/highways`     |
| Inspector  | whichever it came from |                                |

The map **never blocks on TypeDB** for the default view. Hot views are KV
reads (~10ms). The animation layer is push, not poll.

---

## What The Map Doesn't Show

Important — the map is not the engine. It does not:

- run the substrate (the substrate runs in workers)
- decide routes (`select()` and `follow()` happen in the runtime)
- mutate state (read-only with one exception: drag-to-move actor between groups)
- replace `/marketplace`, `/team`, `/dashboard` — it links into them

The map is a **window**. The world is the thing being looked at.

---

## The Interactions

```
    click node       → Inspector tab opens with that unit
    click edge       → Inspector tab opens with that path
    drag node        → re-layout (and, in Groups tab, re-group)
    scroll           → zoom
    space + drag     → pan
    /                → search
    g a t p e k i    → jump to tab (Groups, Actors, Things, Paths, Events, Knowledge, Inspector)
    1 2 3 4 5 6      → toggle layer 1..6
    s                → cycle skin (ONE → Ant → Brain → ...)
    .                → step the tick once (dev only)
    shift+click edge → mark this path (dev only)
    alt+click edge   → warn this path (dev only)
```

Dev-only interactions live behind a flag — they let you train the map
manually for demos, but never affect production traffic.

---

## What Emerges

Once you're staring at the map for ten minutes, you start to see things the
data alone never told you:

- **Convoys** — clusters of edges that always light up together
- **Bottlenecks** — units with high inbound queue but low outbound rate
- **Dead ends** — strong incoming highways that terminate at no sink
- **Frontiers as voids** — large unconnected regions of the population
- **Storms** — bursts of `warn()` propagating through a sub-network
- **Migrations** — actors gradually moving between groups over days

None of these are entities in TypeDB. They're patterns in motion. The map
makes them visible without anyone having to define them.

---

## Acceptance — Is This Map Good?

A good world map passes this test: **a new person can sit down, click
nothing, and within 60 seconds know what's healthy, what's broken, and
where the money is.**

If they have to ask "where do I look for X?" the map has failed.
If the answer is in three different tabs, the synthesis (Atlas) has failed.
If the answer is in TypeDB but not on screen, the export pipeline has failed.

---

## Build Order

The map is large but it ships in stages. Each stage is independently
useful — no stage depends on a future one. If we stop after stage 1 we
still have a real product.

```
    STAGE 1  ATLAS                            week 1
        canvas, force layout, KV reads
        nodes, edges, particles
        Inspector card (one shape, all entities)
        ⌘K search

    STAGE 2  HEALTH                           week 2
        top strip, sundial, NOW card
        loops L1-L7 freshness dots
        live SSE animation
        time scrubber (1h resolution)

    STAGE 3  POLISH                           week 3
        Apple-style card, motion, typography pass
        skin toggle (ONE / Org / Ant)
        cinematic mode for the front page
        URL grammar + bookmarks

    STAGE 4  COMMERCE                         week 4
        gold veins for revenue
        wallet badges + Sui scan links
        diamond glyphs for frozen highways
        x402 payment animations

    STAGE 5  MULTIPLAYER                      week 5
        cursor presence
        war rooms + pinned conversations
        share-via-URL works end to end

    STAGE 6  OPERATOR                         week 6
        ⌘. console
        deploy from .md drag-drop
        force evolve, freeze, snapshot
        notifications: badge / toast / page

    STAGE 7  FEDERATION                       week 7+
        altitude 7 universe view
        bridges to Agentverse / Hermes
        wormhole rendering
        embeds (full / mini / dot)
```

The acceptance test for **stage 1** is the same as for the whole map:
60 seconds, no clicks, you know what's healthy. Everything after stage 1
is pure escalation of polish, completeness, and trust.

---

## The Whole Map In One Sentence

A canvas that draws the substrate's six dimensions at seven altitudes
through six skins, breathing with the seven loops, fed by KV and SSE,
deepened by TypeDB, monetized by Sui, gated by channels, evolved by
markdown, watched by humans and agents through the same API, shareable
as URLs, embeddable as widgets, operable through one console, running
its own trailer on the front page, and judged by whether a stranger
understands the world in 60 seconds.

---

## See Also

- [world.md](world.md) — the ontology and the persistent API
- [dictionary.md](dictionary.md) — every word, every dimension
- [DSL.md](DSL.md) — five verbs, the signal flow
- [one-strategy.md](one-strategy.md) — why the world exists
- [routing.md](routing.md) — how signals find their way
- [metaphors.md](metaphors.md) — the six skins
- [one-ontology.md](one-ontology.md) — the six dimensions

---

*Two fields. Six layers. Seven loops. One world. One map.*
