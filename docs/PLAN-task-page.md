---
title: PLAN — Task Page WebSocket Integration
type: plan
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 9
completed: 0
status: READY
---

# PLAN: Task Page WebSocket Integration

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, or sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning
> = cycles-per-path. (See `.claude/rules/engine.md` → The Three Locked Rules.)
>
> **Goal:** Wire the tasks page to live WebSocket updates from the production
> substrate at api.one.ie. Local dev connects to localhost, production connects
> to api.one.ie/ws. Task updates (mark, warn, complete, unblock) appear instantly.
>
> **Source of truth:** [dictionary.md](dictionary.md) — canonical names,
> [DSL.md](DSL.md) — the signal language,
> [routing.md](routing.md) — signal flow
>
> **Shape:** 2 cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `task` entity with
> `task-wave` (W1-W4), `task-context` (doc keys), `blocks` relation.
> WebSocket events follow `WsMessage` type in `src/lib/ws-server.ts`.

## Current Architecture

### Data Sources (Three Layers)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        THREE DATA SOURCES                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. tasks-store.ts (.tasks.json)                                         │
│     ├── ProjectTask objects with metadata                                │
│     ├── trailPheromone, alarmPheromone fields (per-task)                │
│     ├── Updated by: markPheromone(), cascadeUnblock()                   │
│     └── Primary source for /api/tasks when local tasks exist            │
│                                                                          │
│  2. PersistentWorld (net.ts singleton)                                   │
│     ├── strength: Record<edge, number>  ← net.mark() updates            │
│     ├── resistance: Record<edge, number> ← net.warn() updates           │
│     ├── Edge format: "loop→builder:taskId"                              │
│     ├── Read via: net.sense(edge), net.danger(edge)                     │
│     └── Loaded once from TypeDB, then in-memory                         │
│                                                                          │
│  3. TypeDB (persistent truth)                                            │
│     ├── path entities with strength/resistance attributes               │
│     ├── task entities with metadata                                      │
│     └── Written async via writeSilent() (fire-and-forget)               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### API Response Merges Both

```typescript
// /api/tasks merges tasks-store + World pheromone:
{
  tid: t.tid,                              // from tasks-store
  name: t.name,                            // from tasks-store
  trailPheromone: t.trailPheromone,        // from tasks-store (NOT USED)
  alarmPheromone: t.alarmPheromone,        // from tasks-store (NOT USED)
  strength: net.sense(`loop→builder:${t.tid}`),   // from World ← ACTUAL SOURCE
  resistance: net.danger(`loop→builder:${t.tid}`), // from World ← ACTUAL SOURCE
}
```

### WebSocket Broadcasts (Current State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WHO BROADCASTS WHAT                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✓ task-sync.ts:markTaskDone()     → { type: 'complete', taskId }       │
│  ✓ task-sync.ts:selfCheckoff()     → { type: 'complete' } + { 'unblock'}│
│  ✓ tasks/[id]/complete.ts          → { type: 'complete', taskId }       │
│                                                                          │
│  ✗ persist.ts:mark()               → NO BROADCAST (just memory+TypeDB)  │
│  ✗ persist.ts:warn()               → NO BROADCAST (just memory+TypeDB)  │
│                                                                          │
│  GAP: Pheromone changes don't push to clients!                          │
│       Only task status changes (complete/unblock) broadcast.             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Connection Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CURRENT STATE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TaskBoard.tsx                                                           │
│       │                                                                  │
│       ├── HTTP fetch ───→ one-substrate.pages.dev/api/tasks             │
│       │                   (polling on interval, no live updates)         │
│       │                                                                  │
│       └── No WebSocket connection                                        │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Dev WebSocket (exists, unused by TaskBoard)                             │
│       │                                                                  │
│       ├── dev-ws-server.ts ── ws library ── /api/ws                     │
│       │                       (Node.js, attached to Astro dev server)    │
│       │                                                                  │
│       └── ws-server.ts ── wsManager.broadcast()                         │
│                           (shared between dev + prod)                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Production WebSocket (exists on Pages, not Gateway)                     │
│       │                                                                  │
│       ├── src/pages/api/ws.ts ── CF WebSocketPair                       │
│       │                          (one-substrate.pages.dev/api/ws)        │
│       │                                                                  │
│       └── Gateway (api.one.ie) ── NO WebSocket support                  │
│                                   (only TypeDB proxy + D1)               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           TARGET STATE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TaskBoard.tsx                                                           │
│       │                                                                  │
│       ├── HTTP fetch ───→ api.one.ie/tasks (or localhost in dev)        │
│       │                   (initial state load)                           │
│       │                                                                  │
│       └── WebSocket ────→ api.one.ie/ws (or localhost:4321/api/ws)      │
│                           (live updates: mark, warn, complete, unblock)  │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Gateway (api.one.ie) — production WebSocket endpoint                    │
│       │                                                                  │
│       ├── /ws ── Durable Object or WebSocketPair                        │
│       │          (subscribe to events, broadcast to clients)             │
│       │                                                                  │
│       ├── /tasks ── Task list with pheromone (from TypeDB)              │
│       │                                                                  │
│       └── POST /signal ── triggers WebSocket broadcast                  │
│                           (mark, warn, complete, unblock)                │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Event Flow (production)                                                 │
│       │                                                                  │
│       signal → task-sync.ts → wsManager.broadcast()                     │
│                                    │                                     │
│                                    ├── Gateway Durable Object            │
│                                    │   (production, persistent)          │
│                                    │                                     │
│                                    └── All connected TaskBoards          │
│                                        (instant update, no polling)      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Routing

Signals flow down through waves. Results flow up, marking paths with
tagged weights. Each tag:weight pair points to a different next hop.

```
    signal DOWN                     result UP
    ──────────                      ─────────
    /wave PLAN-task-page.md         result + 4 tagged marks
         │                               │
         ▼                               │
    ┌─────────┐                          │
    │  W1     │  Haiku recon ────────────┤ mark(edge:fit, score)
    │  read   │  → report current state  │ mark(edge:form, score)
    └────┬────┘                          │ mark(edge:truth, score)
         │ context grows                 │ mark(edge:taste, score)
         ▼                               │
    ┌─────────┐                          │
    │  W2     │  Opus decide             │ weak dim?
    │  fold   │  → spec Gateway WS       │   → signal to specialist
    └────┬────┘                          │   → mark specialist path
         │ context grows                 │
         ▼                               │
    ┌─────────┐                          │
    │  W3     │  Sonnet edit             │
    │  apply  │  → code changes          │
    └────┬────┘                          │
         │                               │
         ▼                               │
    ┌─────────┐                          │
    │  W4     │  Sonnet verify ──────────┘
    │  score  │  → rubric: fit/form/truth/taste
    └─────────┘    each dim marks a tagged edge
                   weak dims fan out to coaches
```

## Testing — The Deterministic Sandwich Around Waves

Every cycle is wrapped in deterministic checks. Tests are the PRE and POST
of the PLAN lifecycle — the same sandwich that wraps every LLM call.

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    bun run verify                     bun run verify
    ├── biome check .                  ├── biome check .     (no new lint)
    ├── tsc --noEmit                   ├── tsc --noEmit      (no new type errors)
    └── vitest run                     ├── vitest run        (no regressions)
                                       └── WebSocket test    (connection verified)

    BASELINE                           VERIFICATION
    "what passes now"                  "what still passes + what's new"
```

---

```
   CYCLE 0: FIX              CYCLE 1: WIRE              CYCLE 2: PROVE
   Add mark/warn broadcast   Gateway WS + TaskBoard     Live updates verified
   ──────────────────        ─────────────────          ─────────────────────
   1 file, ~10 edits         4 files, ~150 edits        2 files, ~20 edits
        │                         │                           │
        ▼                         ▼                           ▼
   ┌─────────────┐           ┌─W1─W2─W3─W4─┐           ┌─W1─W2─W3─W4─┐
   │ direct edit │  ──►      │ H   O  S  S  │  ──►      │ H   O  S  S  │
   └─────────────┘           └──────────────┘           └──────────────┘

   H = Haiku (recon)    O = Opus (decide)    S = Sonnet (edit + verify)
```

---

## Cycle 0: FIX — Add mark/warn Broadcasts

**The gap:** `persist.ts` mark/warn update memory + TypeDB + Sui, but never broadcast
to WebSocket clients. Task completions broadcast, but pheromone changes don't.

**File:** [`src/engine/persist.ts`](../src/engine/persist.ts)

**Edit:**

```typescript
// In persist.ts mark function (around line 71-83):
import { wsManager } from '@/lib/ws-server'

const mark = (edge: string, strength = 1) => {
  net.mark(edge, strength)
  const [from, to] = edge.split('→')
  if (!from || !to) return
  
  // Extract taskId if this is a task edge
  const taskMatch = to.trim().match(/^builder:(.+)$/)
  const taskId = taskMatch?.[1]
  
  // Broadcast to WebSocket clients
  if (taskId) {
    wsManager.broadcast({
      type: 'mark',
      taskId,
      strength: net.sense(edge),
      timestamp: Date.now(),
    })
  }
  
  // TypeDB write (existing)
  writeSilent(`...`)
  // Sui mirror (existing)
  mirrorMark(from.trim(), to.trim(), strength).catch(() => {})
}

// Same pattern for warn function (around line 85-96)
const warn = (edge: string, strength = 1) => {
  net.warn(edge, strength)
  const [from, to] = edge.split('→')
  if (!from || !to) return
  
  const taskMatch = to.trim().match(/^builder:(.+)$/)
  const taskId = taskMatch?.[1]
  
  if (taskId) {
    wsManager.broadcast({
      type: 'warn',
      taskId,
      resistance: net.danger(edge),
      timestamp: Date.now(),
    })
  }
  
  // TypeDB write (existing)
  writeSilent(`...`)
  // Sui mirror (existing)
  mirrorWarn(from.trim(), to.trim(), strength).catch(() => {})
}
```

**Gate:**

```bash
# Verify broadcast happens on mark
grep -n "wsManager.broadcast" src/engine/persist.ts
# Should show 2 occurrences (mark + warn)
```

```
  [ ] persist.ts imports wsManager
  [ ] mark() broadcasts { type: 'mark', taskId, strength }
  [ ] warn() broadcasts { type: 'warn', taskId, resistance }
  [ ] Only broadcasts for task edges (builder:taskId pattern)
```

---

## Cycle 1: WIRE — Gateway WebSocket + TaskBoard Hook

**Files:**
- [`gateway/src/index.ts`](../gateway/src/index.ts) — add /ws endpoint + /tasks route
- [`src/components/TaskBoard.tsx`](../src/components/TaskBoard.tsx) — add useWebSocket hook
- [`src/lib/ws-server.ts`](../src/lib/ws-server.ts) — export message types for client
- [`src/lib/use-task-websocket.ts`](../src/lib/use-task-websocket.ts) — new: reusable WS hook

**Why first:** Gateway is production infrastructure. Once /ws exists, all clients can connect.

---

### Gateway Route Specification

The Gateway at `api.one.ie` currently has 4 routes. Add 3 more for WebSocket support:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GATEWAY ROUTES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  CURRENT (gateway/src/index.ts)                                          │
│  ─────────────────────────────────                                       │
│  GET  /              → "ONE Gateway - TypeDB proxy worker"               │
│  GET  /health        → { status: "ok" }                                  │
│  POST /typedb/query  → proxy to TypeDB Cloud (JWT cached 61s)           │
│  GET  /messages      → D1 query (chat history)                          │
│                                                                          │
│  ADD (this cycle)                                                        │
│  ─────────────────                                                       │
│  GET  /ws            → WebSocket upgrade (101) for live updates         │
│  GET  /tasks         → Task list with pheromone from TypeDB             │
│  POST /broadcast     → Relay events to all connected WS clients         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Route 1: GET /ws — WebSocket Upgrade

```typescript
// gateway/src/index.ts — add after /health route

// WebSocket upgrade endpoint
if (url.pathname === '/ws') {
  const upgradeHeader = request.headers.get('Upgrade')
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected websocket', { status: 426 })
  }

  const pair = new WebSocketPair()
  const [client, server] = Object.values(pair)
  
  // Accept the WebSocket connection
  server.accept()
  
  // Add to connected clients (module-level Set)
  connectedClients.add(server)
  
  server.addEventListener('message', (event) => {
    // Handle ping/pong for keepalive
    if (event.data === 'ping') {
      server.send('pong')
    }
  })
  
  server.addEventListener('close', () => {
    connectedClients.delete(server)
  })
  
  server.addEventListener('error', () => {
    connectedClients.delete(server)
  })

  return new Response(null, {
    status: 101,
    webSocket: client,
  })
}
```

Module-level client tracking:

```typescript
// At top of gateway/src/index.ts, after imports
const connectedClients = new Set<WebSocket>()
```

#### Route 2: GET /tasks — Task List with Pheromone

```typescript
// gateway/src/index.ts — add after /ws route

// Task list with pheromone overlay
if (url.pathname === '/tasks' && request.method === 'GET') {
  // Query TypeDB for tasks + paths in one request
  const query = `
    match
      $t isa skill, has skill-id $id, has name $name;
      $p isa path, has source "loop", has target $id,
        has strength $s, has resistance $r;
    fetch $id, $name, $s, $r;
    limit 100;
  `
  
  try {
    const token = await getToken(env)
    const result = await fetch(`https://${TYPEDB_HOST}:1729/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        database: env.TYPEDB_DATABASE || 'one',
        query,
        options: { infer: false },
      }),
    })
    
    if (!result.ok) {
      return json({ error: 'TypeDB query failed' }, 500)
    }
    
    const data = await result.json()
    return json(data, 200, corsHeaders)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
}
```

#### Route 3: POST /broadcast — Relay to WebSocket Clients

```typescript
// gateway/src/index.ts — add after /tasks route

// Broadcast event to all connected WebSocket clients
if (url.pathname === '/broadcast' && request.method === 'POST') {
  try {
    const message = await request.text()
    
    // Validate it's valid JSON
    JSON.parse(message)
    
    // Broadcast to all connected clients
    let sent = 0
    for (const client of connectedClients) {
      try {
        client.send(message)
        sent++
      } catch {
        // Client disconnected, remove from set
        connectedClients.delete(client)
      }
    }
    
    return json({ ok: true, sent }, 200, corsHeaders)
  } catch (e) {
    return json({ error: 'Invalid JSON' }, 400)
  }
}
```

#### Updated CORS Headers

```typescript
// Extend corsHeaders to allow WebSocket upgrade headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection',
}
```

#### Full Route Order in gateway/src/index.ts

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }
    
    // 1. Root
    if (url.pathname === '/') { ... }
    
    // 2. Health check  
    if (url.pathname === '/health') { ... }
    
    // 3. WebSocket upgrade (NEW)
    if (url.pathname === '/ws') { ... }
    
    // 4. Task list with pheromone (NEW)
    if (url.pathname === '/tasks') { ... }
    
    // 5. Broadcast relay (NEW)
    if (url.pathname === '/broadcast') { ... }
    
    // 6. TypeDB query proxy (existing)
    if (url.pathname === '/typedb/query') { ... }
    
    // 7. Messages (existing)
    if (url.pathname === '/messages') { ... }
    
    // 404
    return new Response('Not found', { status: 404 })
  }
}
```

---

### WebSocket Message Types

All messages follow this discriminated union. Both client and server use the same types:

```typescript
// src/lib/ws-server.ts — exported for client import

export type WsMessage =
  | { type: 'complete'; taskId: string; timestamp: number }
  | { type: 'unblock'; taskId: string; unblockedBy: string; timestamp: number }
  | { type: 'mark'; taskId: string; strength: number; timestamp: number }
  | { type: 'warn'; taskId: string; resistance: number; timestamp: number }
  | { type: 'task-update'; task: { tid: string; name: string; status: string }; timestamp: number }
  | { type: 'sync'; tasks: Array<{ tid: string; strength: number; resistance: number }>; timestamp: number }
  | { type: 'ping' }
  | { type: 'pong' }

// Client can import:
// import type { WsMessage } from '@/lib/ws-server'
```

| Type | Trigger | Client Action |
|------|---------|---------------|
| `complete` | Task marked done via API or selfCheckoff | Move task to "done" column |
| `unblock` | Dependency completed, blocked task now available | Update blocked status, may move columns |
| `mark` | `persist.ts mark()` on task edge | Update strength visualization (pheromone glow) |
| `warn` | `persist.ts warn()` on task edge | Update resistance visualization (red tint) |
| `task-update` | Task metadata changed (name, status) | Update task card content |
| `sync` | Full state sync (on reconnect or request) | Replace local state with server state |
| `ping`/`pong` | Keepalive (every 30s) | No visual change |

---

### Broadcast Relay Specification

The existing `wsManager.broadcast()` only reaches local dev WebSocket clients. For production,
task-sync.ts must also relay to the Gateway:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BROADCAST FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  task-sync.ts                                                            │
│       │                                                                  │
│       ├── wsManager.broadcast(msg)  → dev-ws-server.ts (localhost)      │
│       │                                                                  │
│       └── fetch('https://api.one.ie/broadcast', {                       │
│             method: 'POST',                                              │
│             body: JSON.stringify(msg)                                    │
│           })                                                             │
│               │                                                          │
│               ▼                                                          │
│           Gateway /broadcast                                             │
│               │                                                          │
│               ▼                                                          │
│           connectedClients.forEach(c => c.send(msg))                    │
│               │                                                          │
│               ▼                                                          │
│           TaskBoard.tsx receives via useTaskWebSocket                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### task-sync.ts Update

```typescript
// src/engine/task-sync.ts — add relay function

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.one.ie'

async function relayToGateway(msg: WsMessage): Promise<void> {
  // Skip in dev mode (wsManager handles it locally)
  if (process.env.NODE_ENV !== 'production') return
  
  try {
    await fetch(`${GATEWAY_URL}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    })
  } catch (e) {
    // Fire-and-forget — don't block on relay failure
    console.warn('Gateway relay failed:', e)
  }
}

// Update all broadcast calls:
// BEFORE:
wsManager.broadcast({ type: 'complete', taskId })

// AFTER:
const msg = { type: 'complete', taskId, timestamp: Date.now() }
wsManager.broadcast(msg)
relayToGateway(msg)  // non-blocking
```

---

### Wave 1 — Recon (parallel Haiku x 3)

Spawn 3 agents in one message. Each reads one file, reports findings
with line numbers and context.

**Hard rule:** "Report verbatim. Do not propose changes. Under 300 words."

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `gateway/src/index.ts` | Current routes, env bindings, CF Worker patterns |
| R2 | `src/components/TaskBoard.tsx` | State management, fetch patterns, update logic |
| R3 | `src/lib/ws-server.ts` | WsMessage type, broadcast patterns, dev vs prod |

**Outcome model:** `result` = report in. `timeout` = re-spawn once.
`dissolved` = file missing, drop. Advance when 2/3 reports are in.

---

### Wave 2 — Decide (Opus, in main context)

**Context loaded:** DSL.md + dictionary.md (always) + routing.md +
current file state from W1.

**Key decisions for Cycle 1:**

1. **Gateway WebSocket approach:**
   - Use Durable Objects for persistent WebSocket connections
   - Or use simple WebSocketPair (stateless, per-request)
   - Decision: Start with WebSocketPair (simpler), upgrade to DO if needed

2. **TaskBoard connection logic:**
   - Environment detection: `import.meta.env.PROD` or `window.location`
   - Dev: `ws://localhost:4321/api/ws`
   - Prod: `wss://api.one.ie/ws`

3. **Message flow:**
   - `task-sync.ts` broadcasts via `wsManager`
   - Gateway needs to relay these events to connected clients
   - Option A: HTTP POST to Gateway /broadcast → Gateway relays to WS clients
   - Option B: Gateway subscribes to substrate events (more complex)
   - Decision: Option A (simpler, existing pattern)

**Output format (one per edit):**
```
TARGET:    gateway/src/index.ts
ANCHOR:    "// Health check"
ACTION:    insert-before
NEW:       "// WebSocket upgrade endpoint\n..."
RATIONALE: "Add /ws route before other routes"
```

---

### Wave 3 — Edits (parallel Sonnet x 4)

One agent per file. Each gets: file path, list of anchors + replacements.
Rule: "Use `Edit` with exact anchor. Do not modify anything else.
If anchor doesn't match, return dissolved."

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `gateway/src/index.ts` | ~40 lines (WebSocket upgrade + /tasks route) |
| E2 | `src/components/TaskBoard.tsx` | ~30 lines (useWebSocket integration) |
| E3 | `src/lib/ws-server.ts` | ~10 lines (export types for client import) |
| E4 | `src/lib/use-task-websocket.ts` | ~60 lines (new file: reusable hook) |

#### Gateway WebSocket (gateway/src/index.ts)

```typescript
// Handle WebSocket upgrade
if (url.pathname === '/ws' && request.headers.get('upgrade') === 'websocket') {
  const pair = new WebSocketPair()
  const [client, server] = Object.values(pair)
  server.accept()
  
  // Store in Durable Object or module-level Set for broadcast
  // For now: simple echo/ping to prove connection works
  server.addEventListener('message', (e) => {
    if (e.data === 'ping') server.send('pong')
  })
  
  return new Response(null, { status: 101, webSocket: client })
}

// GET /tasks — proxy task list with pheromone
if (url.pathname === '/tasks' && request.method === 'GET') {
  // Proxy to one-substrate.pages.dev/api/tasks or query TypeDB directly
}
```

#### TaskBoard Hook (src/lib/use-task-websocket.ts)

```typescript
import { useCallback, useEffect, useRef, useState } from 'react'
import type { WsMessage } from './ws-server'

const WS_URL = import.meta.env.PROD 
  ? 'wss://api.one.ie/ws' 
  : 'ws://localhost:4321/api/ws'

export function useTaskWebSocket(onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage
        onMessage(msg)
      } catch { /* ignore malformed */ }
    }
    
    return () => ws.close()
  }, [onMessage])

  return { connected, ws: wsRef.current }
}
```

#### TaskBoard Integration

```typescript
// In TaskBoard.tsx
import { useTaskWebSocket } from '@/lib/use-task-websocket'

// Handle live updates
const handleWsMessage = useCallback((msg: WsMessage) => {
  switch (msg.type) {
    case 'task-update':
      // Update task in local state
      break
    case 'complete':
      // Move task to complete column
      break
    case 'unblock':
      // Update blocked status
      break
    case 'mark':
      // Update pheromone visualization
      break
    case 'warn':
      // Update resistance visualization
      break
  }
}, [])

const { connected } = useTaskWebSocket(handleWsMessage)
```

---

### Wave 4 — Verify (Sonnet x 1)

Read all files in this cycle. Check:
1. Gateway compiles with `tsc --noEmit` (no type errors)
2. WebSocket upgrade returns 101 status
3. TaskBoard hook connects without errors
4. Types are consistent between ws-server.ts and hook

**Rubric scoring:** Each edit is scored against [rubrics.md](rubrics.md) —
fit (0.35), form (0.20), truth (0.30), taste (0.15).

**If inconsistencies:** spawn micro-edits (Wave 3.5), re-verify. Max 3 loops.

### Cycle 1 Gate

```bash
# Verification commands
cd gateway && bun tsc --noEmit
bun run verify
curl -i -H "Connection: Upgrade" -H "Upgrade: websocket" https://api.one.ie/ws
```

```
  [ ] Gateway builds without errors
  [ ] /ws returns 101 on upgrade request
  [ ] TaskBoard connects to WebSocket
  [ ] Dev mode uses localhost, prod uses api.one.ie
```

---

## Cycle 2: PROVE — Live Updates Verified

**Depends on:** Cycle 1 complete. WebSocket endpoint exists.

**Files:**
- [`src/engine/task-sync.ts`](../src/engine/task-sync.ts) — verify broadcast calls
- [`src/components/TaskBoard.tsx`](../src/components/TaskBoard.tsx) — verify state updates

**Why second:** Connection exists. Now verify data flows correctly.

---

### Wave 1 — Recon (parallel Haiku x 2)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/engine/task-sync.ts` | Where wsManager.broadcast is called, what events |
| R2 | `src/components/TaskBoard.tsx` | How state updates should apply |

---

### Wave 2 — Decide (Opus, in main context)

**Key decisions for Cycle 2:**

1. **Broadcast relay:**
   - task-sync.ts already calls `wsManager.broadcast()`
   - Need to relay these to Gateway-connected clients
   - Add HTTP endpoint: `POST /broadcast` on Gateway
   - task-sync.ts calls: `fetch('https://api.one.ie/broadcast', { body: msg })`

2. **State reconciliation:**
   - TaskBoard receives WsMessage
   - Must update local state without full refetch
   - Optimistic: apply immediately, no confirmation needed

---

### Wave 3 — Edits (parallel Sonnet x 2)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `gateway/src/index.ts` | ~20 lines (POST /broadcast route) |
| E2 | `src/engine/task-sync.ts` | ~10 lines (HTTP relay to Gateway) |

---

### Wave 4 — Verify (Sonnet x 1)

Check:
1. Complete a task via API → TaskBoard shows update instantly
2. Mark/warn via signal → TaskBoard shows pheromone change
3. Unblock cascade → TaskBoard shows newly available tasks

### Cycle 2 Gate

```bash
# End-to-end test
curl -X POST https://api.one.ie/signal -d '{"receiver":"builder:test","data":{}}'
# TaskBoard should show update without refresh
```

```
  [ ] Task completion broadcasts to all clients
  [ ] Mark/warn updates pheromone visualization
  [ ] Unblock cascade shows newly available tasks
  [ ] No polling — updates are push-only
```

---

## Environment Variables

| Variable | Dev | Prod | Purpose |
|----------|-----|------|---------|
| `PUBLIC_WS_URL` | (not set, defaults to localhost) | `wss://api.one.ie/ws` | WebSocket endpoint |
| `PUBLIC_TASKS_ORIGIN` | `''` (same-origin) | `https://api.one.ie` | HTTP task fetch origin |

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | 3 | Haiku | ~5% |
| 1 | W2 | 0 | Opus | ~0% |
| 1 | W3 | 4 | Sonnet | ~60% |
| 1 | W4 | 1 | Sonnet | ~15% |
| 2 | W1 | 2 | Haiku | ~3% |
| 2 | W2 | 0 | Opus | ~0% |
| 2 | W3 | 2 | Sonnet | ~12% |
| 2 | W4 | 1 | Sonnet | ~5% |

**Hard stop:** if any Wave 4 loops more than 3 times, halt and escalate.

---

## Status

- [ ] **Cycle 0: FIX** — Add mark/warn broadcasts to persist.ts
  - [ ] Add wsManager import
  - [ ] Add broadcast to mark()
  - [ ] Add broadcast to warn()
- [ ] **Cycle 1: WIRE** — Gateway WebSocket + TaskBoard Hook
  - [ ] W1 — Recon (Haiku x 3)
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Edits (Sonnet x 4)
  - [ ] W4 — Verify (Sonnet x 1)
- [ ] **Cycle 2: PROVE** — Live Updates Verified
  - [ ] W1 — Recon (Haiku x 2)
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Edits (Sonnet x 2)
  - [ ] W4 — Verify (Sonnet x 1)

---

## Execution

```bash
# Run the next wave of the current cycle
/wave PLAN-task-page.md

# Or manually — autonomous sequential loop
/work

# Check state
/highways                   # proven paths
/tasks                      # open tasks by priority
```

---

## See Also

- [DSL.md](DSL.md) — signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (always loaded in W2)
- [routing.md](routing.md) — signal flow patterns
- [TODO-template.md](TODO-template.md) — wave template structure
- [gateway/CLAUDE.md](../gateway/CLAUDE.md) — Gateway architecture

---

*2 cycles. Four waves each. Haiku reads, Opus decides, Sonnet writes,
Sonnet checks. Same loop as the substrate, different receivers.*
