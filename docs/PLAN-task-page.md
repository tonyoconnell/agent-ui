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
│       │                   (initial state load, KV cached)                │
│       │                                                                  │
│       └── WebSocket ────→ api.one.ie/ws (or localhost:4321/api/ws)      │
│           │                (live updates: mark, warn, complete, unblock) │
│           │                                                              │
│           ├── Reconnect with exponential backoff (1s→30s)               │
│           ├── Heartbeat every 30s, timeout at 45s                       │
│           └── Fallback to 5s polling after 3 failed reconnects          │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Gateway (api.one.ie) — WebSocket endpoint with security                 │
│       │                                                                  │
│       ├── /ws ── WebSocketPair (per-isolate Set)                        │
│       │          ├── Origin check against CORS_ORIGINS                  │
│       │          └── Connection limit: 100 per isolate                  │
│       │                                                                  │
│       ├── /tasks ── Task list from KV (fallback: TypeDB)                │
│       │                                                                  │
│       └── POST /broadcast ── Relay to WebSocket clients                 │
│                   ├── X-Broadcast-Secret auth required                  │
│                   └── Message type validation                           │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Event Flow (production)                                                 │
│       │                                                                  │
│       signal → task-sync.ts → wsManager.broadcast() (dev)               │
│                     │                                                    │
│                     └── relayToGateway() (prod)                         │
│                              │                                           │
│                              ▼                                           │
│                         POST /broadcast (with secret)                    │
│                              │                                           │
│                              ▼                                           │
│                    connectedClients.forEach(send)                        │
│                              │                                           │
│                              ▼                                           │
│                    TaskBoard receives update                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cross-Isolate Broadcast — SOLVED via Durable Object

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ✅  SOLVED: WsHub Durable Object centralizes all WebSockets            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  All /ws upgrades AND all /broadcast POSTs route to the same DO         │
│  instance (named "global"). The DO's state.getWebSockets() sees        │
│  every connection regardless of which isolate accepted the upgrade.     │
│                                                                          │
│  ┌──────────────┐      ┌──────────────┐                                 │
│  │  Isolate A   │      │  Isolate B   │                                 │
│  │              │      │              │                                 │
│  │  /ws upgrade │      │  /broadcast  │                                 │
│  │  /connect   │      │  /send       │                                 │
│  └──────┬───────┘      └──────┬───────┘                                 │
│         │                      │                                         │
│         └──────────┬───────────┘                                         │
│                    ▼                                                     │
│           ┌─────────────────┐                                            │
│           │  WsHub DO       │                                            │
│           │  "global"       │                                            │
│           │                 │                                            │
│           │  Set of sockets │                                            │
│           │  Hibernation API│                                            │
│           └─────────────────┘                                            │
│                                                                          │
│  Why hibernation API (state.acceptWebSocket):                            │
│  - DO sleeps between messages, no idle compute cost                     │
│  - Sockets persist across DO eviction                                   │
│  - Messages wake the DO only when needed                                │
│  - webSocketMessage() handles ping/pong (keepalive)                     │
│                                                                          │
│  Verification: 11/11 integration tests pass deterministically.          │
│  broadcast → WS receive measured at <500ms end-to-end.                  │
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

### Security, Stability, Speed Requirements

Before implementing, address these critical gaps:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SECURITY / STABILITY / SPEED                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🔴 SECURITY — MUST FIX BEFORE PRODUCTION                               │
│  ─────────────────────────────────────────                               │
│                                                                          │
│  1. AUTH ON /broadcast                                                   │
│     Problem: Anyone can POST fake messages to all connected clients     │
│     Fix: Require shared secret (BROADCAST_SECRET env var)               │
│     │                                                                    │
│     if (url.pathname === '/broadcast') {                                │
│       const secret = request.headers.get('X-Broadcast-Secret')          │
│       if (secret !== env.BROADCAST_SECRET) {                            │
│         return Response.json({ error: 'Forbidden' }, { status: 403 })   │
│       }                                                                  │
│       // ... proceed with broadcast                                      │
│     }                                                                    │
│                                                                          │
│  2. MESSAGE SCHEMA VALIDATION                                            │
│     Problem: Only validates JSON.parse() — no type checking             │
│     Fix: Validate message type field against allowed types              │
│     │                                                                    │
│     const ALLOWED_TYPES = ['complete','unblock','mark','warn','sync']   │
│     const msg = JSON.parse(message)                                     │
│     if (!msg.type || !ALLOWED_TYPES.includes(msg.type)) {               │
│       return Response.json({ error: 'Invalid message type' }, 400)      │
│     }                                                                    │
│                                                                          │
│  3. ORIGIN CHECK ON WS UPGRADE                                           │
│     Problem: Any origin can open WebSocket connections                  │
│     Fix: Verify Origin header matches CORS_ORIGINS                      │
│     │                                                                    │
│     const wsOrigin = request.headers.get('Origin')                      │
│     if (!CORS_ORIGINS.some(o => wsOrigin?.startsWith(o))) {             │
│       return new Response('Origin not allowed', { status: 403 })        │
│     }                                                                    │
│                                                                          │
│  4. CONNECTION LIMIT                                                     │
│     Problem: Unlimited WebSocket connections per isolate                │
│     Fix: Cap connections per isolate (100 max)                          │
│     │                                                                    │
│     const MAX_CONNECTIONS = 100                                         │
│     if (connectedClients.size >= MAX_CONNECTIONS) {                     │
│       return new Response('Too many connections', { status: 503 })      │
│     }                                                                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  🟡 STABILITY — REQUIRED FOR PRODUCTION                                  │
│  ──────────────────────────────────────                                  │
│                                                                          │
│  1. CROSS-ISOLATE LIMITATION (KNOWN)                                     │
│     Problem: Module-level Set only works within one CF isolate          │
│     Reality: CF routes requests to isolates semi-randomly               │
│     Fix: Document as known limitation. Durable Objects for full fix.   │
│     Mitigation: Broadcast also updates KV; client polls KV on reconnect │
│                                                                          │
│  2. CLIENT RECONNECTION WITH BACKOFF                                     │
│     Problem: useTaskWebSocket doesn't reconnect on disconnect           │
│     Fix: Exponential backoff (1s, 2s, 4s, 8s, max 30s)                  │
│     │                                                                    │
│     const reconnect = (attempt = 0) => {                                │
│       const delay = Math.min(1000 * 2 ** attempt, 30000)                │
│       setTimeout(() => connect(attempt + 1), delay)                     │
│     }                                                                    │
│     ws.onclose = () => reconnect(0)                                     │
│                                                                          │
│  3. HEARTBEAT WITH TIMEOUT                                               │
│     Problem: Client pings but doesn't detect silent disconnect          │
│     Fix: Track last pong time, reconnect if stale                       │
│     │                                                                    │
│     let lastPong = Date.now()                                           │
│     setInterval(() => {                                                 │
│       if (Date.now() - lastPong > 45000) ws.close() // force reconnect  │
│       else ws.send('ping')                                              │
│     }, 30000)                                                           │
│     ws.onmessage = (e) => { if (e.data === 'pong') lastPong = Date.now()}│
│                                                                          │
│  4. GRACEFUL DEGRADATION TO POLLING                                      │
│     Problem: No fallback if WebSocket fails repeatedly                  │
│     Fix: After 3 reconnect failures, fall back to 5s polling           │
│     │                                                                    │
│     if (attempt > 3) {                                                  │
│       setPolling(true) // switch to fetch('/api/tasks') every 5s       │
│       return                                                            │
│     }                                                                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  🟠 SPEED — NICE TO HAVE                                                 │
│  ────────────────────────                                                │
│                                                                          │
│  1. CACHE /tasks IN KV                                                   │
│     Problem: TypeDB hit on every /tasks request (~100ms)                │
│     Fix: Read from KV (tasks.json), same as sync worker pattern        │
│     │                                                                    │
│     const cached = await env.KV.get('tasks.json', 'json')               │
│     if (cached) return Response.json(cached, { headers })               │
│     // fall back to TypeDB only if KV miss                              │
│                                                                          │
│  2. MESSAGE BATCHING (mark/warn)                                         │
│     Problem: Rapid mark/warn floods WebSocket                           │
│     Fix: Server batches messages, sends every 100ms max                 │
│     │                                                                    │
│     let pending: WsMessage[] = []                                       │
│     setInterval(() => {                                                 │
│       if (pending.length) {                                             │
│         broadcast({ type: 'batch', messages: pending })                 │
│         pending = []                                                    │
│       }                                                                  │
│     }, 100)                                                             │
│                                                                          │
│  3. CLIENT DEBOUNCE                                                      │
│     Problem: Rapid state updates cause excessive re-renders             │
│     Fix: useDeferredValue or manual debounce (100ms)                    │
│     │                                                                    │
│     const deferredTasks = useDeferredValue(tasks)                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Gateway Route Specification

**STATUS:** Routes `/ws` and `/broadcast` already exist in `gateway/src/index.ts`!
Missing: `/tasks` route (use KV cache, not direct TypeDB query).

The Gateway at `api.one.ie` currently has these routes:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GATEWAY ROUTES (current state)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  EXISTING (gateway/src/index.ts — 207 lines)                             │
│  ────────────────────────────────────────────                            │
│  GET  /              → { status: "ok", service: "one-gateway" }         │
│  GET  /health        → { status: "ok", version, database }              │
│  GET  /ws            → WebSocket upgrade (101) ✓ EXISTS                 │
│  POST /broadcast     → Relay to WebSocket clients ✓ EXISTS              │
│  POST /typedb/query  → proxy to TypeDB Cloud (JWT cached 61s)           │
│  GET  /messages      → D1 query (chat history)                          │
│                                                                          │
│  SECURITY FIXES NEEDED                                                   │
│  ─────────────────────                                                   │
│  /broadcast  → Add X-Broadcast-Secret header check                      │
│  /broadcast  → Add message type validation                              │
│  /ws         → Add origin check against CORS_ORIGINS                    │
│  /ws         → Add connection limit (100 per isolate)                   │
│                                                                          │
│  ADD (this cycle)                                                        │
│  ─────────────────                                                       │
│  GET  /tasks         → Task list from KV cache (tasks.json)             │
│                       Falls back to TypeDB only on KV miss              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Security Fix 1: GET /ws — Add Origin Check + Connection Limit

**Current code (gateway/src/index.ts:88-106)** — exists but lacks security:

```typescript
// CURRENT (insecure):
if (url.pathname === '/ws') {
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426, headers })
  }
  const pair = new WebSocketPair()
  // ... accepts any origin, no connection limit
}
```

**Fixed code:**

```typescript
// Constants at top of file
const MAX_WS_CONNECTIONS = 100

// GET /ws — WebSocket upgrade for live TaskBoard updates
if (url.pathname === '/ws') {
  // Security: Check origin against allowed CORS origins
  const wsOrigin = request.headers.get('Origin')
  if (!wsOrigin || !CORS_ORIGINS.some(o => wsOrigin.startsWith(o))) {
    return new Response('Origin not allowed', { status: 403, headers })
  }
  
  // Security: Limit connections per isolate
  if (connectedClients.size >= MAX_WS_CONNECTIONS) {
    return new Response('Too many connections', { status: 503, headers })
  }
  
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426, headers })
  }
  
  const pair = new WebSocketPair()
  const [client, server] = Object.values(pair) as [WebSocket, WebSocket]
  server.accept()
  connectedClients.add(server)
  
  server.addEventListener('message', (event: MessageEvent) => {
    if (event.data === 'ping') server.send('pong')
  })
  server.addEventListener('close', () => connectedClients.delete(server))
  server.addEventListener('error', () => connectedClients.delete(server))
  
  return new Response(null, { status: 101, webSocket: client })
}
```

#### Route 2: GET /tasks — Task List from KV Cache (NEW)

**This route doesn't exist yet.** Add it using KV cache (fast) with TypeDB fallback (slow).

```typescript
// gateway/src/index.ts — add after /ws route
// Requires KV binding in wrangler.toml

// GET /tasks — Task list with pheromone overlay (from KV cache)
if (url.pathname === '/tasks' && request.method === 'GET') {
  try {
    // Fast path: read from KV cache (updated by sync worker every 1 min)
    if (env.KV) {
      const cached = await env.KV.get('tasks.json', 'json')
      if (cached) {
        return Response.json(cached, { 
          headers: { ...headers, 'X-Cache': 'HIT' } 
        })
      }
    }
    
    // Slow path: query TypeDB directly (only on KV miss)
    const token = await getToken(env)
    const query = `
      match
        $s isa skill, has skill-id $id, has name $name;
      fetch $id, $name;
      limit 100;
    `
    
    const res = await fetch(`${env.TYPEDB_URL}/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        databaseName: env.TYPEDB_DATABASE,
        transactionType: 'read',
        query,
      }),
    })
    
    if (!res.ok) {
      const text = await res.text()
      return Response.json({ error: 'TypeDB query failed', detail: text }, { status: 500, headers })
    }
    
    const data = await res.json()
    return Response.json(data, { 
      headers: { ...headers, 'X-Cache': 'MISS' } 
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500, headers })
  }
}
```

**Wrangler binding required:**

```toml
# gateway/wrangler.toml — add KV binding
[[kv_namespaces]]
binding = "KV"
id = "1c1dac4766e54a2c85425022a3b1e9da"  # same as sync worker
```

#### Security Fix 2: POST /broadcast — Add Auth + Message Validation

**Current code (gateway/src/index.ts:109-126)** — exists but no auth:

```typescript
// CURRENT (insecure):
if (url.pathname === '/broadcast' && request.method === 'POST') {
  const message = await request.text()
  JSON.parse(message)  // only validates JSON, not message type
  // ... broadcasts to everyone, anyone can call this
}
```

**Fixed code:**

```typescript
// Constants at top of file
const ALLOWED_MESSAGE_TYPES = ['complete', 'unblock', 'mark', 'warn', 'task-update', 'sync']

// POST /broadcast — relay a WsMessage to all connected WebSocket clients
if (url.pathname === '/broadcast' && request.method === 'POST') {
  // Security: Require shared secret (set via wrangler secret put BROADCAST_SECRET)
  const secret = request.headers.get('X-Broadcast-Secret')
  if (!env.BROADCAST_SECRET || secret !== env.BROADCAST_SECRET) {
    return Response.json({ error: 'Forbidden' }, { status: 403, headers })
  }
  
  try {
    const message = await request.text()
    const parsed = JSON.parse(message)
    
    // Security: Validate message type
    if (!parsed.type || !ALLOWED_MESSAGE_TYPES.includes(parsed.type)) {
      return Response.json(
        { error: 'Invalid message type', allowed: ALLOWED_MESSAGE_TYPES }, 
        { status: 400, headers }
      )
    }
    
    // Broadcast to all connected clients
    let sent = 0
    for (const client of connectedClients) {
      try {
        client.send(message)
        sent++
      } catch {
        connectedClients.delete(client)
      }
    }
    
    return Response.json({ ok: true, sent }, { headers })
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }
}
```

**Secrets required:**

```bash
# Set broadcast secret (generate with: openssl rand -hex 32)
wrangler secret put BROADCAST_SECRET
# Also add to task-sync.ts relay function headers
```

**Env type update:**

```typescript
interface Env {
  // ... existing
  BROADCAST_SECRET?: string  // Add this
  KV?: KVNamespace           // Add this for /tasks
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

#### task-sync.ts Update (with auth)

```typescript
// src/engine/task-sync.ts — add relay function

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.one.ie'
const BROADCAST_SECRET = process.env.BROADCAST_SECRET

async function relayToGateway(msg: WsMessage): Promise<void> {
  // Skip in dev mode (wsManager handles it locally)
  if (process.env.NODE_ENV !== 'production') return
  
  // Skip if no secret configured
  if (!BROADCAST_SECRET) {
    console.warn('BROADCAST_SECRET not set, skipping gateway relay')
    return
  }
  
  try {
    const res = await fetch(`${GATEWAY_URL}/broadcast`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Broadcast-Secret': BROADCAST_SECRET,  // Auth header
      },
      body: JSON.stringify(msg),
    })
    
    if (!res.ok) {
      console.warn('Gateway relay failed:', res.status)
    }
  } catch (e) {
    // Fire-and-forget — don't block on relay failure
    console.warn('Gateway relay error:', e)
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

#### TaskBoard Hook (src/lib/use-task-websocket.ts) — Production-Ready

```typescript
import { useCallback, useEffect, useRef, useState } from 'react'
import type { WsMessage } from './ws-server'

const WS_URL = import.meta.env.PROD 
  ? 'wss://api.one.ie/ws' 
  : 'ws://localhost:4321/api/ws'

const TASKS_URL = import.meta.env.PROD
  ? 'https://api.one.ie/tasks'
  : '/api/tasks'

const MAX_RECONNECT_ATTEMPTS = 3
const HEARTBEAT_INTERVAL = 30_000  // 30s
const HEARTBEAT_TIMEOUT = 45_000   // 45s (allow 15s jitter)
const POLL_INTERVAL = 5_000        // 5s fallback polling

export function useTaskWebSocket(onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const lastPongRef = useRef<number>(Date.now())
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  
  const [connected, setConnected] = useState(false)
  const [polling, setPolling] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const connect = useCallback((reconnectAttempt = 0) => {
    // Graceful degradation: fall back to polling after max attempts
    if (reconnectAttempt > MAX_RECONNECT_ATTEMPTS) {
      console.warn('WebSocket failed, falling back to polling')
      setPolling(true)
      return
    }
    
    setAttempt(reconnectAttempt)
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    
    ws.onopen = () => {
      setConnected(true)
      setAttempt(0)
      lastPongRef.current = Date.now()
      
      // Start heartbeat
      heartbeatRef.current = setInterval(() => {
        // Check for stale connection (no pong in 45s)
        if (Date.now() - lastPongRef.current > HEARTBEAT_TIMEOUT) {
          console.warn('Heartbeat timeout, reconnecting')
          ws.close()
          return
        }
        ws.send('ping')
      }, HEARTBEAT_INTERVAL)
    }
    
    ws.onclose = () => {
      setConnected(false)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      
      // Exponential backoff reconnect: 1s, 2s, 4s, 8s... max 30s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30_000)
      console.log(`WebSocket closed, reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1})`)
      setTimeout(() => connect(reconnectAttempt + 1), delay)
    }
    
    ws.onerror = () => {
      // onclose will fire after onerror, handling reconnect there
    }
    
    ws.onmessage = (e) => {
      if (e.data === 'pong') {
        lastPongRef.current = Date.now()
        return
      }
      
      try {
        const msg = JSON.parse(e.data) as WsMessage
        onMessage(msg)
      } catch {
        // Ignore malformed messages
      }
    }
  }, [onMessage])

  // Polling fallback
  useEffect(() => {
    if (!polling) return
    
    const poll = async () => {
      try {
        const res = await fetch(TASKS_URL)
        if (res.ok) {
          const tasks = await res.json()
          onMessage({ type: 'sync', tasks, timestamp: Date.now() })
        }
      } catch {
        // Ignore poll errors
      }
    }
    
    poll() // immediate first poll
    pollRef.current = setInterval(poll, POLL_INTERVAL)
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [polling, onMessage])

  // Initial connection
  useEffect(() => {
    if (!polling) connect(0)
    
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [connect, polling])

  return { 
    connected, 
    polling,
    reconnectAttempt: attempt,
    ws: wsRef.current 
  }
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

```
┌────────────────────────────────────────────────────────────────────────┐
│  Revised after audit: routes exist, need security + stability fixes   │
└────────────────────────────────────────────────────────────────────────┘
```

- [x] **Cycle 0: SECURE** — Gateway security hardening (CRITICAL) ✓
  - [x] Add `MAX_WS_CONNECTIONS` limit (100 per isolate)
  - [x] Add origin check on /ws upgrade
  - [x] Add `BROADCAST_SECRET` auth on /broadcast
  - [x] Add message type validation on /broadcast
  - [x] Add `BROADCAST_SECRET` env to Env interface
  - [x] Run `wrangler secret put BROADCAST_SECRET`

- [x] **Cycle 1: EXTEND** — Add /tasks route + client stability ✓
  - [x] Add `/tasks` route (KV cache → TypeDB fallback)
  - [x] Add KV binding to gateway/wrangler.toml (already existed)
  - [x] Create `src/lib/use-task-websocket.ts` with reconnect + heartbeat + polling fallback
  - [x] Update persist.ts mark/warn to broadcast (already existed)
  - [x] Update ws-server.ts relayToGateway() with X-Broadcast-Secret auth header

- [x] **Cycle 2: INTEGRATE** — TaskBoard integration ✓
  - [x] Wire useTaskWebSocket into TaskBoard.tsx (captures { connected, polling, reconnectAttempt })
  - [x] Add connection status indicator (ws:live/polling/reconnect N/disconnected in LiveIndicator)
  - [x] Add useDeferredValue for rapid update debounce (phases memo reads deferredTasks)
  - [x] Test: broadcast accepted/rejected (automated — scripts/test-ws-integration.ts)
  - [x] Test: origin check (automated — 403 for missing/bad Origin)
  - [x] Test: reconnect after close (automated — new WS connection succeeds)
  - [x] Test: /health latency p50 <500ms (automated — 56ms measured)
  - [x] Test: broadcast → WS receives (DO-routed delivery, 5/5 deterministic)
  - [x] Verified: complete task → instant update (call chain proven statically + integration)
  - [x] Verified: polling fallback logic present (3-attempt cap + 5s fetch /tasks)
  - [x] Browser E2E: Chrome DevTools MCP — TaskBoard loads, ws:live indicator shows, /api/ws-test broadcast delivered to WebSocket client (2026-04-14)

### End-to-End Call Chain (Verified)

```
┌─────────────────────────────────────────────────────────────────────────┐
│              FULL CHAIN: /api/tasks/[id]/complete → UI                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. POST /api/tasks/[id]/complete                                        │
│     └─► complete.ts:120 wsManager.broadcast(msg)  [dev path]            │
│     └─► complete.ts:121 relayToGateway(msg)       [prod path]           │
│                                                                          │
│  2. ws-server.ts relayToGateway                                          │
│     └─► POST https://api.one.ie/broadcast                               │
│         with X-Broadcast-Secret header (line 37)                        │
│                                                                          │
│  3. Gateway /broadcast                                                   │
│     └─► Auth check (403 if wrong/missing secret) ✓ tested               │
│     └─► Type validation (400 if not in allowlist)   ✓ tested            │
│     └─► Forward to WsHub DO.fetch('/send')                              │
│                                                                          │
│  4. WsHub DO                                                             │
│     └─► state.getWebSockets() returns all connected clients             │
│     └─► ws.send(message) on each                ✓ tested (11/11)        │
│                                                                          │
│  5. TaskBoard.tsx useTaskWebSocket                                       │
│     └─► ws.onmessage → JSON.parse → switch(msg.type)                    │
│     └─► setTasks(prev.map(...)) triggers re-render                      │
│                                                                          │
│  Also: persist.ts mark()/warn() use the same pattern (lines 80-81,     │
│  106-107) so pheromone changes flow through the same chain.             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Runtime Test Results (2026-04-14)

```
╔══════════════════════════════════════════════════════════════════════╗
║   scripts/test-ws-integration.ts — 11/11 passed (5/5 deterministic) ║
╠══════════════════════════════════════════════════════════════════════╣
║  ✓ WebSocket connects (with Origin header)                          ║
║  ✓ Ping/pong keepalive                                              ║
║  ✓ Unauthorized broadcast → 403                                     ║
║  ✓ Invalid message type → 400                                       ║
║  ✓ Broadcast accepted → 200                                         ║
║  ✓ WebSocket receives broadcast (DO-routed delivery) 🎉             ║
║  ✓ /tasks returns 200                                               ║
║  ✓ /ws without Origin → 403                                         ║
║  ✓ /ws bad Origin → 403                                             ║
║  ✓ Client can reconnect after close                                 ║
║  ✓ /health responds <500ms (52ms measured)                          ║
╠══════════════════════════════════════════════════════════════════════╣
║    Browser E2E — Chrome DevTools MCP on localhost:4321/tasks        ║
╠══════════════════════════════════════════════════════════════════════╣
║  ✓ TaskBoard renders (41 tasks, 12 complete, 1 active)              ║
║  ✓ LiveIndicator shows "ws:live" in emerald                         ║
║  ✓ Fresh WS to /api/ws connects (dev-ws-server)                     ║
║  ✓ GET /api/ws-test → wsManager.broadcast() fires                   ║
║  ✓ WebSocket client receives {type:'task-update',task:{...}}        ║
║  ✓ Message JSON parsed correctly with exhaustive type dispatch      ║
╚══════════════════════════════════════════════════════════════════════╝
```

**All limitations resolved. All cycles verified at every layer:**
- Unit (vitest) · Integration (Gateway) · Browser E2E (Chrome DevTools MCP)

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
