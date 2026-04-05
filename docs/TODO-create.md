# TODO: Create for MVP

**What must be built. What already exists. What's just wiring.**

---

## Two Codebases, One Substrate

```
envelopes/                          ants-at-work/
├── substrate.ts    (157 lines)     ├── typedb_client.py      (548 lines)
├── one.ts          (109 lines)     ├── typedb_pheromone.py   (1,152 lines)
├── persist.ts      (88 lines)      ├── mcp_server.py         (607 lines)
├── asi.ts          (83 lines)      ├── gateway-cf/            (8,500 lines)
├── typedb.ts       (184 lines)     ├── events/                (2,260 lines)
├── one.tql         (543 lines)     ├── knowledge/*.tql        (25 schemas)
├── 20+ API routes                  ├── website/               (Astro 5 + Auth)
├── 10 Astro pages                  ├── deploy/                (22 services)
└── UI components   (4,660 lines)   └── ants/trader/core.py    (385K lines)
```

The TS substrate is the brain. The Python infrastructure is the body. They share TypeDB.

---

## What Already Exists

### In envelopes/ (the engine)

| What | Status |
|------|--------|
| Substrate: unit, colony, pheromone, fade | Working |
| World: 6 dimensions, group/actor/thing/flow | Working |
| TypeDB client: read/write/decay/callFunction | Working |
| Persistence: mark/warn/fade → TypeDB | Working |
| ASI orchestrator: pheromone routing + LLM fallback | Working |
| Schema: 6 dimensions, 20+ functions | Production |
| API: signal, mark, resistance, agents, discover, seed, decay | Exists |
| Pages: dashboard, world, chat, tasks, marketplace, discover | Exists |
| UI: graph editor, workspace, metaphors | Exists |

### In ants-at-work/ (the infrastructure)

| What | Where | Reuse |
|------|-------|-------|
| TypeDB Cloud instance | `cr0mc4-0.cluster.typedb.com` | **Use directly** — it's running |
| Gateway API (CF Workers) | `gateway-cf/src/` | **Use directly** — deployed |
| Agent CRUD + memories + skills | `gateway-cf/src/agents.ts` | **Use directly** — D1 backed |
| Auth: JWT + rate limiting | `gateway-cf/src/index.ts` | **Use directly** — production |
| WebSocket real-time hub | `gateway-cf/src/realtime.ts` | **Use directly** — Durable Objects |
| MCP server with colony tools | `src/mcp_server.py` | **Use directly** — FastMCP |
| Pheromone persistence to TypeDB | `ants/knowledge/typedb_pheromone.py` | Pattern reference |
| Event bus + sourcing + decay | `ants/events/` | Pattern reference |
| TypeDB↔Gateway bidirectional sync | `ants/gateway/bridge.py` | Pattern reference |
| 22 SystemD service templates | `deploy/` | Copy + adapt |
| Health monitoring | `scripts/health_monitor.py` | Copy + adapt |
| Telegram alerts | `ants/notifications/secure_bot.py` | Copy + adapt |
| ONE ontology JSON schemas | `one/schemas/` | Use directly |

---

## What Must Be Created

### 1. Connect to TypeDB (one afternoon)

TypeDB Cloud is already running at `cr0mc4-0.cluster.typedb.com`. The gateway is already deployed.

- [ ] **Load `one.tql`** into the existing TypeDB instance (new database or extend existing)
- [x] **Set `.env`** — point `TYPEDB_URL` and `PUBLIC_GATEWAY_URL` at the existing infra
- [x] **Seed data** — insert 3 units, 5 tasks, capabilities between them. `api/seed.ts` exists, fill it with real inserts

That's it. `persist.ts` and `lib/typedb.ts` already know how to talk to TypeDB via the gateway.

### 2. Close the Signal Loop (the product)

Everything here has an endpoint. The work is making them talk to each other end-to-end.

- [x] **Wire `POST /api/agents`** — insert unit into TypeDB, return uid. Endpoint exists, needs TypeDB write.
- [x] **Add `POST /api/agents/:id/capabilities`** — insert `capability(provider, skill)` with price. One new endpoint.
- [x] **Verify `POST /api/signal`** — must: write signal → call `suggest_route()` → execute agent → write result → `mark()` on success / `warn()` on failure. The pieces exist. Wire them.
- [x] **3 LLM-backed agents** — summarizer, translator, analyst. Register in TypeDB with `model`, `system-prompt`. Use existing `llm.ts` adapters.
- [x] **Decay interval** — `api/decay-cycle.ts` exists. Call it on a timer (cron or setInterval in dev).

### 3. Make It Visible (the dashboard)

Components and pages exist. They show static data. Point them at TypeDB.

- [x] **Dashboard** — wire to `highway_count()`, `total_revenue()`, unit/signal counts from TypeDB
- [x] **Discovery** — wire to `suggest_route()` / `cheapest_provider()` — pheromone-ranked results
- [x] **Highway graph** — wire `WorldWorkspace.tsx` to live `highways()` data
- [x] **Signal log** — recent signals from TypeDB (sender, receiver, success, latency)
- [x] **Task board** — wire to `ready_tasks()`, `attractive_tasks()`, `repelled_tasks()`

---

## That's the MVP

A user can:
1. Register an agent
2. Declare what it can do
3. Send a signal → substrate routes it → trail forms
4. Watch highways emerge on the dashboard
5. Discover agents ranked by pheromone

Three steps of creation. The rest is wiring.

---

## After MVP (already built, just activate)

| Feature | What exists | Where |
|---------|-------------|-------|
| Auth | Better Auth + JWT + gateway auth middleware | `ants-at-work/gateway-cf/` + `envelopes/lib/auth.ts` |
| MCP server | 3 production MCP servers with colony tools | `ants-at-work/src/mcp_server.py` |
| Real-time | WebSocket Durable Object hub | `ants-at-work/gateway-cf/src/realtime.ts` |
| Notifications | Encrypted Telegram bot | `ants-at-work/ants/notifications/` |
| Deployment | 22 SystemD templates, AWS/Hetzner scripts | `ants-at-work/deploy/` |
| Health | Server watchdog, health checks | `ants-at-work/scripts/` |
| Payment | Stripe keys configured, Sui Move contract written | Both repos |
| Crystallization | Move contract (335 lines) ready to deploy | `envelopes/src/move/` |

These are activation tasks, not creation tasks. The code exists.

---

## Not Building

- AI SDK control plane (post-MVP)
- AGENTS.md generation (post-MVP)
- Multi-machine federation (enterprise)
- Intelligence products (Year 2)
- OpenClaw integration (post-colony)
- Hypothesis/frontier lifecycle (emerges from usage)

---

## Summary

```
INFRASTRUCTURE     exists (TypeDB Cloud + gateway + MCP — running in ants-at-work)
ENGINE             exists (substrate.ts + one.ts + persist.ts — 70 lines core)
SCHEMA             exists (one.tql — 543 lines, 20+ functions)
API                exists (20+ endpoints — need TypeDB wiring)
UI                 exists (10 pages, components — need live data)

CREATE:
  1. Connect .env to existing TypeDB         ← config
  2. Load schema + seed data                 ← one command
  3. Wire 3 endpoints to TypeDB              ← the actual work
  4. 3 LLM agents with system prompts        ← the product
  5. Point UI at live data                   ← the demo
```

*Two repos. One TypeDB. Five tasks. Ship it.*
