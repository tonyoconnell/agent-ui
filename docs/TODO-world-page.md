# TODO: /world Page Implementation

Build the world map page according to `docs/world-map-page.md` spec.

Reference: `docs/world-map-page.md` (the spec)  
Live at: `src/pages/world.astro`, `src/components/WorldWorkspace.tsx`, and 12 child components  
Status: Starting

---

## Parallel Work Streams

Tasks are grouped into independent streams that can run in parallel. **Dependencies are noted** — some tasks block others.

### STREAM 1: Data Layer (API Endpoints)

These are all independent. Build in any order.

```
◻ GET /api/export/units.json
  Source: TypeDB query units + names + aliases + stats
  Returns: { id, uid, name, aliases, model, generation, successRate, balance, lastSignalAt, group }
  Caching: 1s, use KV

◻ GET /api/export/paths.json
  Source: TypeDB query all paths with strength/resistance
  Returns: { from, to, strength, resistance, revenue, lastUsedAt, toxic }
  Caching: 1s, use KV

◻ GET /api/export/groups.json
  Source: TypeDB query all groups, membership relations
  Returns: { id, name, type, color, members[] }
  Caching: 1s, use KV

◻ GET /api/export/skills.json
  Source: TypeDB query all skills with tags and prices
  Returns: { id, name, price, tags[], providers[] }
  Caching: 1s, use KV

◻ GET /api/export/highways.json
  Source: TypeDB top weighted paths (strength > 20)
  Returns: { from, to, strength, revenue, successRate, reasoning? }
  Caching: 1s, use KV

◻ GET /api/health
  Source: Live stats — unit count, signal rate, $/min, success rate
  Returns: { unitCount, agentCount, signalsPerMin, revenuePerMin, successRate, topGroup }
  Caching: 1s

◻ GET /api/entity/:id
  Source: Single unit or group profile + full markdown spec
  Returns: { kind, spec, stats, wallet, recentSignals[] }
  Caching: 1s

◻ GET /api/signals?limit=10&since=<timestamp>
  Source: Recent signals (for ticker, timeline scrubber)
  Returns: { id, from, to, skill, outcome, revenue, ts }
  Caching: none (live)

◻ POST /api/signal
  Source: Direct manipulation gestures (rename, draw path, weight, etc.)
  Body: { receiver: 'world:*', data: {...} }
  Returns: { ok, id, signal }
  Triggers: KV sync after successful mark/warn

◻ GET /api/tick?peek=1
  Source: Loop state (last tick time, next tick time for each L1-L7 loop)
  Returns: { l1: {lastAt, intervalMs}, l2: {...}, ..., l7: {...} }
  Caching: 1s (mostly static)

◻ GET /api/channels
  Source: Channel throughput stats
  Returns: { name, perDay, lastSignalAt }
  Caching: 5s
```

**Blocker:** None (all independent)

---

### STREAM 2: Canvas & Core Rendering

These tasks interact. Suggested order: WorldGraph first, then skins/lenses.

```
◻ WorldGraph.tsx enhancements (BLOCKING for streams 3-6)
  Reference: `src/components/graph/WorldGraph.tsx` exists
  Add to existing:
  - Load from /api/export/units + /api/export/paths
  - Render nodes (agents) with circles, labels (canonical name)
  - Render edges (paths) with strength/resistance styling
  - Render hulls (groups) as translucent shapes around nodes
  - Topography: altitude via Math.log(strength+1), heat color by strength range
  - Toxicity: grey + dashed for resistant paths
  - Gold veins on revenue paths (if path.revenue > 0)
  - Node hover: show agent card overlay (basic, read-only for now)
  - Edge hover: show path strength/resistance sliders (non-functional for now)
  Dependencies: STREAM 1 (GET /api/export endpoints)
  Deliverable: Nodes + edges + hulls render, no interaction yet

◻ LensSwitcher.tsx (NEW)
  Renders: [org] [colony] [skills] [money] buttons
  On click: set ?lens= URL param, trigger WorldGraph re-layout
  Re-layouts (pure CSS/D3 transform, no refetch):
    - org: hierarchical tree layout from membership relations
    - colony: force-directed layout using d3-force
    - skills: nodes grouped by skill tag, radial layout
    - money: edges weighted by revenue, show gold flow direction
  Dependencies: WorldGraph exists + renders
  Deliverable: Five buttons, lens switching re-layouts canvas

◻ SkinSwitcher.tsx enhancements
  Reference: `src/components/controls/SkinSwitcher.tsx` exists
  Add: [ant] [brain] [team] [mail] [water] [signal] buttons
  On click: set ?skin= URL param
  Changes (CSS class on canvas root):
    - Label text changes (ant: colony/ant/trail, team: org/agent/workflow)
    - Hull colours change per skin
    - Verb labels change (mark → deposit/commend/boost, warn → alarm/flag/jam)
    - Glyphs appear next to names (🐜 for ant, 🧠 for brain, etc.)
  Dependencies: WorldGraph renders node/edge labels
  Deliverable: Six buttons, visual skin switching (CSS-only, no data change)
```

**Blocker:** WorldGraph must exist and render before LensSwitcher and SkinSwitcher can fully work.

---

### STREAM 3: Left Rail (OrgTree)

Can start once STREAM 1 data endpoints exist.

```
◻ OrgTree.tsx (NEW)
  Renders: Collapsible tree of groups → members
  Data source: /api/export/groups.json (groups) + /api/export/units.json (actors)
  Tree structure: ONE → [teams] → [agents]
  Features:
    - Click to expand/collapse groups
    - Click agent name → set ?focus=<id> in URL
    - Highlight focused agent (bold, glow)
    - Agent icon + model chip (sonnet, opus, haiku)
    - Drag agent onto canvas (STREAM 5, later)
  Styling: Left rail, fixed width, scrollable
  Dependencies: STREAM 1 (GET /api/export/groups + /api/export/units)
  Deliverable: Collapsible tree, click to focus, no dragging yet
```

**Blocker:** GET /api/export endpoints

---

### STREAM 4: Right Rail (AgentCard)

Can start once STREAM 1 exists. Blocking for visitor mode + guide.

```
◻ AgentCard.tsx (NEW)
  Renders: Right-side panel showing focused entity
  Triggered: Click any node/edge on canvas OR URL ?focus=<id>
  Entity types handled: unit, group, skill, path, highway, signal
  For a unit, show:
    - Name (canonical, editable if owner)
    - Model + generation
    - Skills (chips with prices)
    - Wallet address (if present) + balance
    - Recent signals (ticker rows, last 5)
    - System prompt (expandable)
    - [Run skill ▾] [Edit md] [Chat ↗] buttons
  For a group, show:
    - Name (canonical, editable if owner)
    - Member count + list
    - Type (team, org, colony, etc.)
    - Type-per-skin labels (colony, team, network, etc.)
    - [Team ↗] [Dashboard ↗] buttons
  For a path/highway, show:
    - Source + target names
    - Strength + resistance (editable sliders)
    - Revenue total
    - [Analyze ↗] button (→ /dashboard?path=)
  Data source: /api/entity/:id
  Styling: Right rail, fixed width, scrollable
  Dependencies: STREAM 1 (GET /api/entity)
  Deliverable: Card renders read-only, buttons link out
```

**Blocker:** GET /api/entity endpoint

---

### STREAM 5: Direct Manipulation (Interaction Layer)

These tasks depend on components existing. Can start once components are mounted.

```
◻ Drag to move units
  Gesture: Click + drag agent node
  Effect: Node position updates live
  Signal: POST /api/signal { receiver: 'world:move', data: {id, x, y} }
  Storage: Unit position saved (TypeDB unit.x + unit.y? or ephemeral in memory?)
  Deliverable: Drag works, position persists session-local

◻ Click to rename
  Gesture: Click agent name in card (or double-click on canvas label)
  Effect: Text becomes editable input, press enter
  Signal: POST /api/signal { receiver: 'world:rename', data: {id, name, by} }
  Ownership: Only owner can rename (check implicit in signal handler)
  Broadcast: Rename appears in ticker, other viewers see it
  Deliverable: Rename works, appears in activity ticker

◻ Draw path (click-drag from one unit to another)
  Gesture: Click unit A, drag to unit B, release
  Effect: New edge appears at strength 1, dim
  Signal: POST /api/signal { receiver: 'world:link', data: {from, to} }
  Persistence: New path saved to TypeDB
  Deliverable: Draw path works, persists

◻ Weight path (drag sliders on path hover card)
  Gesture: Hover edge → card appears with strength/resistance sliders
  Effect: Drag slider right (+) or left (-)
  Signal series: POST /api/signal { receiver: 'world:mark' | 'world:warn', data: {edge, strength} }
  Debounce: 250ms to avoid spam
  Visual: Edge thickens/thins in real time
  Deliverable: Sliders work, edge reacts, signals sent

◻ Mark/Warn buttons on path card
  Gesture: Click [+] or [!] on path hover card
  Effect: Single +1 mark or -1 warn signal
  Signal: POST /api/signal { receiver: 'world:mark' | 'world:warn', data: {edge, strength: 1 or -1} }
  Visual: Flash animation on path
  Deliverable: Buttons work, signals sent

◻ Delete unit (drag to trash or press ⌫)
  Gesture: Select unit, press delete key (or drag to trash zone)
  Effect: Unit shrinks to nothing, trails fade naturally
  Signal: POST /api/signal { receiver: 'world:remove', data: {id} }
  Deliverable: Delete works, trails remain and fade

◻ Group units (lasso + press G)
  Gesture: Drag rectangle around multiple units, press G, name group
  Effect: Hull animates around them, group appears in tree
  Signal: POST /api/signal { receiver: 'world:group', data: {units: [ids], name} }
  Deliverable: Grouping works, hull renders

◻ Pan + Zoom (drag empty space, scroll)
  Gesture: Drag background to pan, scroll wheel to zoom
  Effect: Canvas translates/scales
  Deliverable: Pan and zoom work (usually built into d3/React Flow)

◻ Time scrubber (drag timeline at bottom)
  Gesture: Drag timeline slider or click a point
  Effect: Canvas rewinds to that timestamp, shows signals that happened then
  Data source: /api/signals?from=<ts>&to=<ts>
  Deliverable: Timeline controls time view

Dependencies: All component streams (2, 3, 4) must exist
Blocking: Activity ticker (STREAM 6)
```

---

### STREAM 6: Activity & Live Updates

Can start once components exist. Needs activity data sources.

```
◻ ActivityTicker.tsx (NEW)
  Renders: Horizontal scrolling list of recent signals
  Data source: /api/signals (live, no cache)
  Stream: WebSocket /api/stream (preferred) or polling /api/signals?since= every 2s
  Display format:
    from-name → to-name · skill · outcome · ±money · "just now"
  Features:
    - Max 10 rows, new rows prepend, old rows push off
    - Click row → focus that unit on canvas
    - Colour coding: ✓ green, ✗ red, ⊘ grey (timeout/dissolved)
    - Outcome icons: +$ for revenue
  Deliverable: Ticker renders, updates live

◻ Signal stream client (lib/streamSignals.ts)
  Endpoint: /api/stream (WebSocket) or /api/signals?since=
  Fallback: Polling every 2s if WS unavailable
  Emits: { id, from, to, skill, outcome, revenue, ts }
  Consumer: ActivityTicker, canvas particles (STREAM 7)
  Deliverable: Stream client works, emits events

◻ Canvas particles (animated dots gliding along edges)
  Data source: Signal stream (from above)
  Effect: Gold/white dot appears at source node, animates along path edge to target
  Duration: 2-3 seconds, then fades
  Multiple particles: Can have many in flight at once
  Deliverable: Particles render and animate smoothly

◻ Node pulse (glow when unit receives/emits signal)
  Data source: Signal stream
  Effect: Node at {from} flashes (emit), node at {to} flashes (receive)
  Duration: 500ms fade
  Deliverable: Nodes pulse on activity

◻ Edge breathing (line thickness pulses with strength changes)
  Data source: Signal stream marks/warns
  Effect: Edge thickens on mark, thins on warn, real-time (debounced)
  Duration: Smooth transition over 250ms
  Deliverable: Edges react to path changes in real time

Dependencies: Signal stream client, components must exist
Blocking: None
```

---

### STREAM 7: Advanced Features (Personas, Visitor, Guide)

Can run in parallel once earlier streams are solid.

```
◻ PersonaMenu.tsx (NEW)
  Renders: Dropdown in top-right (Health Strip)
  Options: Anne, Eth Dev, ASI Builder, Founder, Trader, Community, Designer, DevOps, Coder, Writer
  On select: Jump to ?persona=<name> URL
  URL mapping:
    - ?persona=anne → ?group=ehc.framework&lens=org&skin=team&focus=ehc-officer
    - ?persona=eth → ?focus=eth-dev&lens=money&skin=team
    - etc. (see world-map-page.md table)
  Deliverable: Menu works, URL params apply

◻ VisitorBanner.tsx (NEW)
  Renders: Slides in from top when no session (visitor mode)
  Text: "This is the ONE world. It's alive right now. Click anything. Drag anything. Or [follow the guide]."
  Buttons: [Follow the guide] [Build your own ↗] [Sign up]
  Dismissible: Click X to hide
  Deliverable: Banner renders, buttons link correctly

◻ Visitor mode (read-only world)
  Behavior: When no session, load curated public world (?skin=signal, ?lens=colony)
  Restrictions:
    - No editing (drag, rename, draw path disabled)
    - No mutating buttons visible ([Run skill], [Edit md])
    - Only public: true units visible
  Data: Separate GET /api/export/public/{units,paths,groups}
  Deliverable: Visitor view is read-only, live but non-interactive

◻ GuideNarrator.tsx (NEW)
  Renders: Small card in corner (steps 1-12)
  Controls: ← [step#] → buttons, press ESC to close
  Steps (see world-map-page.md § Follow the Guide):
    1. "This is a unit" → highlight one agent, pulse
    2. "It can do things. These are tasks." → spread task chips
    3. "When it does work, it sends a signal" → fire particle
    4. "That leaves a trail" → light path
    ... (12 steps total)
    12. "You're in. Sign up to keep your changes."
  Mechanism: Replays signals into demo world, narrates each
  Deliverable: Guide narrates and demos, steps are clickable

◻ Time scrubber (rewinding)
  Gesture: Drag timeline slider to different timestamp
  Effect: Canvas rewinds, shows signals from that point in time
  Data: GET /api/signals?from=<ts>&to=<ts> replays them
  Empty state: Replay last hour at 10× speed if no live traffic
  Deliverable: Scrubber rewinds canvas, indicator shows ▶ replay

Dependencies: Components exist, streams are working
Blocking: None (polish features)
```

---

### STREAM 8: Tests & Polish

Final pass once all features exist.

```
◻ Integration test: Load /world, verify HealthStrip counts
◻ Integration test: Click agent → AgentCard opens with correct data
◻ Integration test: Drag agent → position updates, signal sent
◻ Integration test: Live ticker updates on signal stream
◻ Integration test: Particles animate along edges
◻ Integration test: Rename agent → appears in all views
◻ Integration test: Persona switcher applies correct URL params
◻ Integration test: Guide completes all 12 steps without errors

◻ Error handling: If /api/export/units fails, show fallback (last-known-good from KV)
◻ Error handling: If signal send fails, show toast notification
◻ Performance: Canvas renders 1000+ nodes without lag (use d3 culling)
◻ Performance: Activity ticker keeps up with 1000 signals/min

Dependencies: All features implemented
Blocking: Shipping
```

---

## Recommended Build Order

**Phase 1 (Blocking):** Get the basics working
```
1. STREAM 1 — All API endpoints (parallel, independent)
2. STREAM 2 — WorldGraph + LensSwitcher + SkinSwitcher
3. STREAM 3 — OrgTree
4. STREAM 4 — AgentCard
```

**Phase 2 (Core Interaction):** Make it interactive
```
5. STREAM 5 — Direct manipulation (drag, rename, draw, weight paths)
6. STREAM 6 — Activity ticker + particles + live updates
```

**Phase 3 (Polish):** Advanced features
```
7. STREAM 7 — Personas, visitor mode, guide, time scrubber
8. STREAM 8 — Tests, error handling, performance
```

---

## Success Criteria

A stranger visits `/world` and within 60 seconds answers:

```
1. WHO WORKS HERE?      ✓ Health strip shows agent count, org tree shows structure
2. WHAT DO THEY DO?     ✓ Click an agent, AgentCard shows skills + prices
3. IS IT ALIVE?         ✓ Ticker scrolls, particles fly, edges pulse
4. WHAT'S WORKING?      ✓ Highways glow gold, green revenue events
5. WHAT'S BROKEN?       ✓ Toxic edges grey/dashed, red failures in ticker
6. IS THIS FOR ME?      ✓ Persona menu, landing on a view that fits their role
```

If any take more than a glance, simplify until they don't.

---

## Parallel Execution Hints

**These can run simultaneously:**
- STREAM 1 tasks (all independent API endpoints)
- STREAM 2 tasks (once STREAM 1 data exists)
- STREAM 3 (OrgTree) while STREAM 2 builds WorldGraph
- STREAM 4 (AgentCard) while STREAM 2 builds WorldGraph
- STREAM 5 (Interaction) once components exist from 2, 3, 4
- STREAM 6 (Activity) once components exist
- STREAM 7 (Advanced) anytime (independent polish)

**Blocked dependencies:**
- STREAM 2 → must finish before STREAM 3, 4, 5 can fully work
- STREAM 1 → must finish before any UI can render real data
- STREAM 6 → benefits from STREAM 5 being done (particles on canvas)

---

## Files to Create/Modify

**New components (12 total):**
- `src/components/world/HealthStrip.tsx`
- `src/components/world/OrgTree.tsx`
- `src/components/world/AgentCard.tsx`
- `src/components/world/LensSwitcher.tsx`
- `src/components/world/ActivityTicker.tsx`
- `src/components/world/PersonaMenu.tsx`
- `src/components/world/VisitorBanner.tsx`
- `src/components/world/GuideNarrator.tsx`
- `src/components/world/TimeScrubber.tsx` (optional, can be part of scrubber UI)
- `src/components/graph/WorldGraph.tsx` (modify existing)
- `src/components/controls/SkinSwitcher.tsx` (modify existing)
- (LensSwitcher might be part of scrubber UI, structure TBD)

**New utilities:**
- `src/lib/streamSignals.ts` — WebSocket/polling client
- `src/lib/displayName.ts` — Resolve name with nickname override

**New API routes (all in src/pages/api/):**
- `export/units.ts`
- `export/paths.ts`
- `export/groups.ts`
- `export/skills.ts`
- `export/highways.ts`
- `health.ts`
- `entity/[id].ts`
- `signals.ts`
- `tick.ts`
- `channels.ts`
- `stream.ts` (WebSocket)
- `signal.ts` (POST, already exists?)

---

**Reference:** `docs/world-map-page.md` for the complete specification.
