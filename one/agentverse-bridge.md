# Agentverse Bridge

Low-latency, lightweight pipe between the ONE substrate and Fetch.ai Agentverse.
Two verbs. One HTTP hop. Signals flow both ways like they're on the same graph.

**Goal:** chat with any of Agentverse's 2M+ agents from inside ONE — without
running a Python uAgent runtime, without polling, without translating shapes at
the boundary. The substrate IS the integration.

---

## Why We Built This

ONE already has a substrate: signals, pheromone, deterministic routing, 4-outcome
learning. Agentverse already has a registry: 2M+ agents addressable by wallet,
discoverable by domain. Each had what the other needed — except the seam
between them was the usual 500-line bridge service with its own deploy,
its own serialization, and its own failure modes.

The cheaper answer: **treat AV addresses as a namespace inside ONE.** Any
receiver prefixed `av:<address>` is just a remote unit. `world.signal()`
doesn't care. Pheromone on `av:*` edges is identical to pheromone on local
edges. Selection, toxicity, highway detection — all free.

Cost of "bridge" = 76 lines of TypeScript + one webhook route.
Cost of operation = 1 fetch call per outbound signal, 1 `world.signal()`
call per inbound signal.

---

## What This Unlocks for Chat

Chat is the load-bearing use case. Users in `/chat` should be able to talk to
any AV agent with sub-300ms overhead on top of the LLM itself.

```
user types message
    │
    ├─► chat UI emits { receiver: 'av:<translator>:chat', data: {text} }
    │
    ├─► bridge proxy catches av:* prefix                       (<0.001ms)
    │
    ├─► POST agentverse.ai/v1/agents/<addr>/submit             (~30-150ms)
    │
    ├─► AV agent processes, replies to our webhook
    │
    ├─► POST /api/av/in { from, to: 'chat:turn', data }        (~30-150ms)
    │
    ├─► net.signal({ receiver: 'chat:turn', data }, 'av:<from>')  (<0.001ms)
    │
    └─► chat UI renders, pheromone marks av:<translator> → chat:turn
```

**Latency budget:** ~60-300ms round-trip excluding the agent's own LLM call.
Everything outside the fetch() is sub-millisecond. The substrate never blocks.

**Weight:** no new runtime, no polling, no sidecar process. One file in
`src/engine/`, one webhook in `src/pages/api/av/`. That's the whole bridge.

---

## Architecture

```
┌─────────────────────── ONE substrate ──────────────────────────┐
│                                                                 │
│   chat:turn ◄─────── world.signal ────────► av:agent1abc       │
│   (local handler)   (same primitive)      (proxy unit)         │
│       ▲                                        │                │
│       │                                        │  fetch()       │
│       │                              ┌─────────┴──────────┐    │
│       │                              │                    │    │
│       │                              ▼                    ▼    │
│  POST /api/av/in              POST agentverse.ai    (pheromone │
│  (inbound webhook)            /agents/<addr>/submit  marks     │
│       ▲                                │             on edge)   │
└───────┼────────────────────────────────┼───────────────────────┘
        │                                │
        │                                ▼
        │                         ┌──────────────┐
        └─────────────────────────┤  AV agent    │
                                  │  (anywhere)  │
                                  └──────────────┘
```

Two directions, one primitive (`world.signal`), one address space (`av:*`).

---

## The API

```typescript
import { connectAgentverse } from '@/engine'

const av = await connectAgentverse(world)
// null if AGENTVERSE_API_KEY not set

av.send(to, data, from?)        // outbound: ONE → AV
av.receive(from, to, data)      // inbound:  AV → ONE  (called from webhook)
av.discover(domain, limit?)     // find agents by domain
av.highways(limit?)             // proven paths that cross the AV boundary
av.list()                       // all bridged addresses
```

### `send(to, data, from?)`
Shortcut for `world.signal({ receiver: 'av:' + to, data }, from)`.
The `to` is either `<address>` or `<address>:<task>`.

### `receive(from, to, data)`
Shortcut for `world.signal({ receiver: to, data }, 'av:' + from)`.
Used by the inbound webhook so AV-originated signals look native.

Both functions are ~one line. The facade exists to make intent legible,
not to hide logic.

---

## Files

| File | Purpose | Lines |
|------|---------|------:|
| `src/engine/agentverse.ts` | Registry + domain indexing | 100 |
| `src/engine/agentverse-bridge.ts` | Proxy units in the main world | 48 |
| `src/engine/agentverse-connect.ts` | `send`/`receive` facade + env wiring | 76 |
| `src/pages/api/av/in.ts` | Inbound webhook | 42 |
| `src/engine/boot.ts` | Auto-connect on startup | +5 |

Total footprint: ~270 lines, most of it existing.

---

## Config (`.env`)

```bash
AGENTVERSE_API_KEY=                  # required — get at agentverse.ai
AGENTVERSE_API_URL=                  # optional override (default: https://agentverse.ai/v1)
AGENTVERSE_WEBHOOK_SECRET=           # optional — enables X-Agentverse-Secret header check on /api/av/in
```

No API key set? `connectAgentverse()` returns `null`. Boot continues. Zero impact.

---

## Inbound Webhook: `POST /api/av/in`

```
POST /api/av/in
Headers: X-Agentverse-Secret: <secret>   # only if AGENTVERSE_WEBHOOK_SECRET set
Body:    { "from": "agent1abc", "to": "chat:turn", "data": {...} }

→ net.signal({ receiver: "chat:turn", data }, "av:agent1abc")
→ 202 Accepted  (fire-and-forget — no waiting)
```

The webhook is 40 lines. Validation is a single regex, auth is an optional
constant-time-ish header compare, and the payload is forwarded straight into
the substrate. Nothing else happens in the route.

---

## Learning

Every signal in either direction marks a path. After a dozen exchanges:

```ts
av.highways(5)
// [
//   { path: 'chat:turn→av:agent1abc', strength: 47 },
//   { path: 'av:agent1abc→chat:turn', strength: 44 },
//   { path: 'chat:turn→av:agent2def', strength:  8 },
//   ...
// ]
```

Slow or flaky AV agents accumulate resistance → `world.follow('chat')` picks
a different path next time → bad agents naturally get routed around. You never
write routing logic. The substrate discovers reliability through use.

---

## Why Not Just Run a uAgent?

Running Fetch.ai's Python `uagents` package inside ONE would mean:

- A second language runtime in the bundle (Python + asyncio + FastAPI)
- A separate process with its own lifecycle, health checks, and deploy
- Serialization back and forth between Python objects and TypeScript signals
- Polling for messages (uAgents default is a long-poll loop)

The bridge replaces all of that with `fetch()` and a single POST route.
ONE agents stay TypeScript-native. Cloudflare Workers stay cold-start-fast.
No Python in the critical path.

---

## Why Not Just Use ASI:One?

`asi1` (the LLM adapter in `src/engine/llm.ts`) lets any ONE agent use ASI-1
Mini as its brain and automatically route to Agentverse agents via ASI:One's
tool-use protocol. That's the right answer when:

- You want the LLM to decide which AV agent to call
- You're happy letting ASI:One control the routing

The bridge is the right answer when:

- YOU want to control which AV agent gets called
- You need per-edge pheromone (not just LLM-picked routes)
- You want AV agents addressable from non-LLM substrate code (e.g. webhooks,
  timers, scheduled tasks)

Use both. They compose: an LLM-backed ONE agent can call `av.send()` directly
in its tools, and the bridge will still mark the edge.

---

## Comparison

| Traditional bridge | ONE × Agentverse |
|--------------------|------------------|
| Python uAgents + FastAPI sidecar | 76-line TypeScript file |
| Separate deploy, health, metrics | Runs inside the substrate process |
| JSON-RPC envelope translation | Same `Signal = {receiver, data}` both sides |
| Poll for messages | Fire-and-forget, webhook returns result |
| Custom reliability tracking | Pheromone tracks it natively |
| Fails = exception | Fails = `null` = `dissolved` outcome |

---

## Integration Flow (Chat)

1. **Boot:** `boot()` returns `{ world, agentverse }`. If `AGENTVERSE_API_KEY`
   is set, all bridged AV agents appear in `world.list()` as `av:*`.
2. **Chat surface:** a chat turn emits a signal to `av:<address>:chat` — the
   chat UI picks the address via `av.discover('chat')` or UI config.
3. **Outbound:** bridge proxy catches the signal, posts to AV, marks the edge
   on success.
4. **AV agent** replies via its normal protocol to our webhook URL.
5. **Inbound:** `/api/av/in` calls `av.receive(from, 'chat:turn', data)`.
   The signal lands on the chat handler as if it were a local unit.
6. **UI renders** the reply. Pheromone now knows this AV agent replied — next
   message to the same domain may route to the same agent automatically.

The whole path is substrate-native. No bridge code runs the user-visible logic.

---

## Failure Modes

| What breaks | Substrate response |
|-------------|--------------------|
| AV API 5xx or timeout | `post()` returns `null` → bridge marks `dissolved` → `warn(0.5)` on edge |
| AV agent doesn't reply | No inbound signal → chain doesn't extend → no `mark()` → edge doesn't grow |
| Invalid webhook body | 400 response, no signal emitted |
| Webhook secret missing | 401 response when `AGENTVERSE_WEBHOOK_SECRET` is set |
| `AGENTVERSE_API_KEY` unset | `connectAgentverse()` returns `null`; boot continues silently |

Everything is zero-throw. The substrate treats missing/failed AV calls as
mild warnings, not crashes.

---

## See Also

- [dictionary.md](dictionary.md) — canonical names (receiver, signal, mark, warn, fade)
- [DSL.md](one/DSL.md) — signal grammar; `av:*` is just a namespace
- [routing.md](routing.md) — how pheromone selects between AV and local paths
- [speed.md](speed.md) — latency contract (<0.005ms routing, <0.001ms mark/warn)
- [lifecycle.md](one/lifecycle.md) — how AV agents enter/exit the substrate via register/forget

**Code:**
- `src/engine/agentverse.ts` — registry
- `src/engine/agentverse-bridge.ts` — proxy units
- `src/engine/agentverse-connect.ts` — facade (`send`/`receive`/`discover`)
- `src/pages/api/av/in.ts` — inbound webhook
- `src/engine/boot.ts` — auto-wiring on startup

---

*Two verbs. One hop. Same graph.*
