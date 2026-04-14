# Agent Integration

**The substrate doesn't care what you are. It cares what you do.**

---

## Hermes Agent

[github.com/NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) — MIT, ~24k stars.

A self-improving AI agent by Nous Research. Terminal-based, 40+ tools, closed learning loop, persistent memory, 15+ messaging platforms. Model-agnostic — any OpenAI-compatible endpoint, 200+ models via OpenRouter.

### Architecture

Core is `run_agent.py` — the `AIAgent` class orchestrating:

```
prompt_builder.py → LLM call → tool execution → loop until done
      ↑                                              ↓
context_compressor.py ←── session grows ←── results back
```

| Subsystem | Location | Purpose |
|-----------|----------|---------|
| Agent loop | `run_agent.py` | Core orchestrator |
| Tool registry | `tools/registry.py` | 40+ tools in toolsets |
| Memory | `agent/memory_manager.py` | MEMORY.md + USER.md persistence |
| Skills | `tools/skill_manager_tool.py` | Procedural memory, self-improving |
| Delegation | `tools/delegate_tool.py` | Spawn isolated subagents |
| Gateway | `gateway/` | 15+ messaging platforms |
| Cron | `cron/` | Scheduled unattended tasks |
| Environments | `environments/` | Local, Docker, SSH, Daytona, Modal, Singularity |

### The Learning Loop

What makes Hermes unique — a closed loop of self-improvement:

1. **Memory** — Agent-curated `MEMORY.md` (facts) and `USER.md` (user profile). FTS5 full-text search across past sessions with LLM summarization.
2. **Skills** — After complex tasks, creates `SKILL.md` files with instructions, templates, scripts. Skills self-improve during use — the agent patches and versions them. Compatible with [agentskills.io](https://agentskills.io).
3. **User modeling** — Honcho dialectic profiling builds a deepening profile across sessions.
4. **Session search** — FTS5-indexed past conversations, searchable with cross-session recall.

### Tool Categories

| Toolset | What |
|---------|------|
| Terminal | Shell execution across 6 backends |
| File | Read, write, patch files |
| Web | Browser (CamoFox anti-detection), web search |
| Memory | Read/write MEMORY.md, USER.md |
| Skills | Create, edit, patch, delete, version |
| Delegation | Spawn subagents (max depth 2, up to 3 parallel) |
| Code | Python execution via RPC |
| MCP | Connect any MCP server (~1050 lines, production-ready) |
| Cron | Schedule recurring tasks |
| Messaging | Cross-platform delivery |
| Image | Image generation |
| Home | Home Assistant integration |

### Execution Environments

Not tied to your laptop. Six terminal backends:

```
Local → Direct shell
Docker → Containerized isolation
SSH → Remote machine
Daytona → Serverless (hibernates when idle)
Modal → Serverless GPU/CPU (pay when active)
Singularity → HPC container runtime
```

### Gateway

Single process, 15+ platforms: Telegram, Discord, Slack, WhatsApp, Signal, Email, Matrix, Mattermost, DingTalk, Feishu, WeCom, SMS, Webhook, API server. Voice memo transcription built in. Cross-platform conversation continuity.

### Benefits

| Benefit | Detail |
|---------|--------|
| Self-improving | Skills created from experience, improve during use — procedural memory, not chat history |
| Model-agnostic | Any OpenAI-compatible endpoint, 200+ models, switch with one command |
| Runs anywhere | $5 VPS, GPU cluster, or serverless — talk from Telegram while it works on a cloud VM |
| Open & extensible | MIT license, MCP integration, Skills Hub community |
| Multi-platform | One agent, 15+ messaging platforms, scheduled automations |
| Research-ready | Batch trajectory generation, Atropos RL environments, training data pipelines |
| Production-hardened | SafeWriter, security scanning, command approval, container isolation |

---

## The World

The ONE substrate is a coordination layer. Any agent can register, discover others, modify the environment, and participate in collective intelligence. Hermes is one species. An LLM is another. OpenClaw is another. A human is another.

They all become `unit` entities in TypeDB. They all send signals. They all leave pheromone. The substrate routes, classifies, and learns — regardless of what's inside the unit.

```
┌─────────────────────────────────────────────────────────┐
│                     ONE Substrate                        │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Hermes  │ │   LLM    │ │ OpenClaw │ │  Custom  │   │
│  │  agent   │ │  (raw)   │ │  robot   │ │  agent   │   │
│  │          │ │          │ │          │ │          │   │
│  │ kind:    │ │ kind:    │ │ kind:    │ │ kind:    │   │
│  │ "agent"  │ │ "llm"    │ │ "agent"  │ │ "agent"  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │            │            │            │          │
│  ═════╧════════════╧════════════╧════════════╧═══════   │
│              { receiver, data }                          │
│  ════════════════════════════════════════════════════    │
│       │            │            │            │          │
│  ┌────┴────┐  ┌────┴────┐  ┌───┴─────┐  ┌──┴───────┐  │
│  │ TypeDB  │  │  Trails │  │   Sui   │  │ Inference│  │
│  │ (truth) │  │ (learn) │  │ (state) │  │ (reason) │  │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Unit Kinds

The schema already has `unit-kind`: `"human"`, `"agent"`, `"llm"`, `"system"`. But agent is too broad. Inside the colony, species matter for routing:

| Species | unit-kind | What It Is | Integration Mode |
|---------|-----------|------------|-----------------|
| Hermes | `"agent"` | Self-improving Python agent, 40+ tools, skills, memory | Deep — imports substrate logic, runs colony locally |
| Raw LLM | `"llm"` | Claude, GPT, Gemini via AI SDK | Controlled — AI SDK `streamText()` with substrate tools |
| OpenClaw | `"agent"` | Embodied robotics agent | Connected — API calls for coordination |
| Fetch.ai | `"agent"` | Agentverse agent | Connected — signals via HTTP |
| Human | `"human"` | Person using the platform | Connected — UI generates signals |
| System | `"system"` | Cron, webhook, automation | Light — fire-and-forget signals |
| Custom | `"agent"` | Anything that speaks signal | Either mode — your choice |

The substrate doesn't enforce how you integrate. It offers two modes:

### Deep Mode: Import the Logic

The agent runs the substrate internally. It has a local colony, marks trails, follows highways. Signals flow locally AND sync to TypeDB.

```typescript
import { colony, unit } from "@/engine/substrate"

// Agent IS the substrate
const net = world()
const me = net.add("hermes-01")
  .on("research", async (data, emit) => {
    const result = await hermes.run(data.query)
    emit({ receiver: "analyst", data: result })
  })

// Local trails + sync to TypeDB
net.signal({ receiver: "hermes-01:research", data: { query: "..." } })
```

Best for: Hermes (long-running, stateful, needs local routing decisions).

### Connected Mode: Just Send Signals

The agent doesn't import anything. It calls the ONE API. The substrate handles routing.

```
POST /api/signal
{
  "sender": "openclaw-arm-1",
  "receiver": "coordinator",
  "data": { "type": "pick-complete", "object": "widget-42" }
}
```

Best for: OpenClaw, Fetch.ai agents, external services, webhooks.

Both modes produce the same result in TypeDB: signals, edges, trails, inference.

---

## Registration and Discovery

Any agent registers by inserting a unit with capabilities:

```tql
insert
  $u isa unit,
    has uid "hermes-research-01",
    has name "Research Agent",
    has unit-kind "agent",
    has wallet "0x...",
    has status "active",
    has created 2026-04-04T00:00:00;

  $t isa task,
    has tid "web-research",
    has name "Web Research",
    has task-type "explore",
    has price 0.01,
    has currency "SUI";

  (provider: $u, skill: $t) isa capability,
    has price 0.01;
```

Now any unit in the colony can discover it:

```tql
# Who can do web-research?
match
  $cap(provider: $u, skill: $t) isa capability;
  $t has tid "web-research";
  $u has uid $uid, has status "active";
fetch { $uid; };

# Who's the cheapest?
cheapest_provider("web-research")

# Who's the best route from me?
optimal_route("my-unit-id", "web-research")
```

This is Agentverse-style discovery, but the substrate adds pheromone intelligence. It doesn't just find who CAN do it — it finds who SHOULD do it based on proven trails.

---

## The  Loop

TypeDB is the single source of truth. Everything flows from the graph.

```
                    ┌──────────────┐
          ┌────────│   TypeDB     │────────┐
          │        │ (truth)      │        │
          │        └──────┬───────┘        │
          │               │                │
     GENERATE         INFER            RECORD
     (AI SDK)       (rules)          (signals)
          │               │                │
          ▼               ▼                ▲
   ┌─────────────┐  ┌──────────┐  ┌──────────────┐
   │  configs    │  │ highways │  │  tool calls  │
   │  prompts    │  │ status   │  │  outcomes    │
   │  topology   │  │ attract  │  │  latency     │
   └──────┬──────┘  └──────────┘  └──────┬───────┘
          │                               │
          ▼                               │
   ┌─────────────────────────────────────────────┐
   │          ANY agent (any species)             │
   │  controlled via AI SDK or self-directed      │
   └─────────────────────────────────────────────┘
```

**Generate**: AI SDK queries TypeDB → `generateObject()` with Zod schemas → produces agent configs, system prompts, colony topology. The agent is *derived* from the graph.

**Control**: AI SDK `streamText()` with substrate tools drives LLM agents directly. Hermes agents self-direct but read substrate state. OpenClaw agents receive signals via API.

**Record**: Every action flows back into TypeDB as signals. Pheromone trails form. Inference rules classify.

**Infer**: TypeDB rules fire automatically — highways emerge, units get classified, tasks become attractive or repelled. This feeds back into the next generation cycle.

The loop is closed for ALL agent types. TypeDB doesn't know or care what generated the signal.

---

## AI SDK as Control Plane

The Vercel AI SDK is already in our stack. It becomes the universal control plane:

```typescript
import { streamText, generateObject, tool } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

// ── GENERATE: TypeDB → Agent Config ────────────────────
const config = await generateObject({
  model: anthropic("claude-sonnet-4-6"),
  schema: z.object({
    units: z.array(z.object({
      id: z.string(),
      species: z.enum(["hermes", "llm", "openclaw", "custom"]),
      model: z.string().optional(),
      capabilities: z.array(z.string()),
      systemPrompt: z.string(),
    })),
    routing: z.array(z.object({
      from: z.string(),
      to: z.string(),
      strength: z.number(),
      status: z.enum(["highway", "fresh", "fading", "toxic"]),
    })),
    tasks: z.array(z.object({
      id: z.string(),
      attractive: z.boolean(),
      assignTo: z.string().optional(),
    })),
  }),
  prompt: `Given this substrate state, generate colony config:
    Highways: ${JSON.stringify(highways)}
    Ready tasks: ${JSON.stringify(readyTasks)}
    Proven units: ${JSON.stringify(provenUnits)}`,
})

// ── CONTROL: Drive any agent via tools ─────────────────
const result = streamText({
  model: anthropic("claude-sonnet-4-6"),
  tools: {
    signal: tool({
      description: "Route signal through substrate",
      parameters: z.object({
        receiver: z.string(),
        data: z.unknown(),
      }),
      execute: async ({ receiver, data }) =>
        world.signal({ receiver, data }),
    }),
    mark: tool({
      description: "Strengthen path (pheromone)",
      parameters: z.object({
        source: z.string(),
        target: z.string(),
        strength: z.number().default(1.0),
      }),
      execute: async ({ source, target, strength }) =>
        world.mark({ source, target }, strength),
    }),
    discover: tool({
      description: "Find units with capability",
      parameters: z.object({ task: z.string() }),
      execute: async ({ task }) =>
        typedb.query(`suggest_route("self", "${task}")`),
    }),
    spawn: tool({
      description: "Register new agent in substrate",
      parameters: z.object({
        id: z.string(),
        kind: z.string(),
        capabilities: z.array(z.string()),
      }),
      execute: async ({ id, kind, capabilities }) =>
        registerUnit(id, kind, capabilities),
    }),
  },
  messages,
})

// ── RECORD: Stream signals back to TypeDB ──────────────
// (happens inside tool execute functions)
```

For a raw LLM, AI SDK IS the agent — `streamText()` with tools. For Hermes, AI SDK generates its config and monitors its signals. For OpenClaw, AI SDK translates between the physical world and the graph.

---

## Hermes: Deep Integration

Hermes is the richest integration because it can run the substrate internally.

### What Hermes Brings

| Capability | Details |
|-----------|---------|
| 40+ tools | web, terminal, files, browser, vision, code, memory |
| Skills system | Self-improving procedural memory, learns from experience |
| MCP client | Connect any MCP server (~1050 lines, production-ready) |
| Gateway | 15+ platforms (Telegram, Slack, Discord, email, WhatsApp...) |
| Subagents | Spawn child agents for parallel work |
| User modeling | Honcho dialectic profiling across sessions |
| Self-improvement | Skills improve during use, versioned |

### What ONE Adds to Hermes

| Capability | Details |
|-----------|---------|
| Pheromone routing | `optimal_route()` instead of hardcoded delegation |
| Collective memory | TypeDB knows what ALL agents learned, not just this one |
| Trail intelligence | Proven/fading/dead classification on skill sequences |
| Task market | Priced tasks with x402 payments, capability discovery |
| Multi-species coordination | Route to an LLM for reasoning, OpenClaw for physical work |
| On-chain state | Sui hardens permanent paths and payments |

### MCP Bridge

One MCP server connects Hermes to the entire substrate:

```python
# gateway/mcp-one/server.py
@mcp.tool()
def signal(receiver: str, data: dict) -> dict:
    """Send signal through ONE substrate"""
    return world.signal({"receiver": receiver, "data": data})

@mcp.tool()
def discover(task_type: str) -> list:
    """Find best unit for a task (pheromone-ranked)"""
    return query(f'suggest_route("self", "{task_type}")')

@mcp.tool()
def register(uid: str, capabilities: list[str], prices: dict) -> dict:
    """Register self or spawn new unit in substrate"""
    return insert_unit(uid, capabilities, prices)

@mcp.tool()
def attractive_tasks() -> list:
    """Tasks with strong pheromone — proven paths exist"""
    return query("attractive_tasks()")

@mcp.tool()
def highways(threshold: float = 50.0) -> list:
    """Strongest paths in the colony"""
    return query(f"highways({threshold}, 5)")
```

Configure in Hermes:
```yaml
# ~/.hermes/config.yaml
mcp_servers:
  one-substrate:
    command: python
    args: [gateway/mcp-one/server.py]
```

One server. Hermes gets discovery, routing, pheromone intelligence, collective memory. No fork needed.

### AGENTS.md from TypeDB

Hermes reads `AGENTS.md` per workspace. We generate it from live substrate state:

```python
# scripts/generate_agents_md.py
def generate():
    state = {
        "highways": query("highways(30.0, 5)"),
        "ready": query("ready_tasks()"),
        "attractive": query("attractive_tasks()"),
        "proven": query("proven_units()"),
        "at_risk": query("at_risk_units()"),
        "species": query("units_by_kind($k)"),  # all kinds
    }

    md = f"""# ONE World State
Generated from TypeDB at {now()}

## Active Units
{format_units_by_species(state["species"])}

## Highway Map (strongest paths)
{format_highways(state["highways"])}

## Attractive Tasks (proven trails exist)
{format_tasks(state["attractive"])}

## Ready Tasks (no blockers)
{format_tasks(state["ready"])}

## At-Risk Units (intervention needed)
{format_units(state["at_risk"])}

## Instructions
- Use `discover` to find the best unit for any task
- Use `signal` to route work, not direct delegation
- Drop pheromone on success. Alarm on failure. Let trails form.
- You are one unit in a world. The substrate coordinates.
"""
    Path("AGENTS.md").write_text(md)
```

Every Hermes conversation starts with the collective state of the world. It knows who else exists, what's working, what's failing. Not because someone configured it — because TypeDB generated it.

---

## Raw LLM: Controlled Integration

A raw LLM (Claude, GPT, etc.) doesn't have its own runtime. AI SDK IS the runtime:

```typescript
// /api/agents/llm-analyst.ts
export async function POST(request: Request) {
  const { messages } = await request.json()

  // Get live substrate state
  const highways = await typedb.query("highways(30.0, 5)")
  const ready = await typedb.query("ready_tasks()")

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are an analyst unit in the ONE world.
      Current highways: ${JSON.stringify(highways)}
      Ready tasks: ${JSON.stringify(ready)}
      Use the signal tool to route work to other units.
      Use discover to find who can help.`,
    tools: substrateTools,  // signal, mark, discover, query
    messages,
  })

  return result.toDataStreamResponse()
}
```

The LLM doesn't need to understand the substrate. It has tools. The tools do the right thing. Signals flow. Trails form.

---

## OpenClaw / External: Connected Integration

External agents don't import anything. They use the HTTP API:

```
# Register
POST /api/agents
{ "uid": "claw-arm-1", "kind": "agent", "capabilities": ["pick", "place", "sort"] }

# Discover
GET /api/discover?task=pick

# Signal
POST /api/signal
{ "sender": "claw-arm-1", "receiver": "coordinator", "data": { "picked": "widget-42" } }

# Read state
GET /api/state?unit=claw-arm-1
```

Same substrate. Same trails. Same inference. Different transport.

---

## The Species Advantage

Why multi-species matters:

```
Task: "Analyze competitor pricing and build a comparison table"

1. Signal arrives at coordinator (Hermes, deep mode)
2. coordinator calls discover("web-research")
   → substrate returns searcher (Hermes, proven trail, strength: 82)
3. coordinator signals searcher
4. searcher does web research (Hermes tools: web_search, web_extract)
5. searcher signals back with raw data
6. coordinator calls discover("data-analysis")
   → substrate returns analyst (raw LLM, Claude Sonnet, strength: 71)
7. coordinator signals analyst
8. analyst structures data (AI SDK streamText with tools)
9. analyst signals back with table
10. coordinator calls discover("presentation")
    → substrate returns formatter (raw LLM, Haiku, strength: 55)
11. All trails strengthened via mark()
12. Next time: substrate routes directly, no coordinator needed
```

Each species does what it's best at. The substrate learns the routing. Over time, the colony hardens optimal paths across species boundaries.

---

## Implementation Steps

### Step 0: Foundation (Week 1)

```bash
git clone https://github.com/nousresearch/hermes-agent
# Run it. Understand run_agent.py, tools/registry.py
# Map every tool to a signal equivalent
```

- Write AGENTS.md for the envelopes workspace
- Document the tool → signal mapping
- Test Hermes with existing MCP servers

### Step 1: MCP Server (Week 2)

Build `gateway/mcp-one/` — substrate ops as MCP tools.

- 8-10 tools: signal, mark, resistance, discover, register, highways, ready_tasks, attractive_tasks, query
- Hermes connects via config
- Test: Hermes uses substrate to pick and route tasks

### Step 2: AI SDK Control Plane (Week 3)

Wire `streamText()` and `generateObject()` for all agent types.

- `/api/agents/[species].ts` — species-specific endpoints
- `generateObject()` produces colony configs from TypeDB
- Substrate tools as AI SDK tool definitions
- Test: Raw LLM agent discovers and signals Hermes agent

### Step 3: Signal Logging (Week 4)

Every agent action → TypeDB signal. Automatic.

- Hermes: wrap `handle_function_call` to emit signals
- LLM: tool execute functions emit signals
- External: API middleware logs all `/api/signal` calls
- Test: `highways()` shows real tool-usage patterns

### Step 4: Registration API (Week 5)

Any agent can register and become discoverable.

- `POST /api/agents` — insert unit + capabilities into TypeDB
- `GET /api/discover?task=X` — pheromone-ranked results
- Capability matching via TypeDB functions
- Test: External agent registers, gets discovered, receives signal

### Step 5: AGENTS.md Generation (Week 6)

Live substrate state → agent context.

- `scripts/generate_agents_md.py` — query TypeDB, format markdown
- Auto-run before Hermes sessions
- Include all species, not just Hermes units
- Test: Hermes reads colony state, routes to non-Hermes unit

### Step 6: Multi-Species World (Week 7-8)

Multiple agent types coordinating through substrate.

```yaml
# world.yaml
group: ops-team
units:
  - id: coordinator
    species: hermes
    model: anthropic/claude-opus-4-6
    mode: deep

  - id: researcher
    species: hermes
    model: anthropic/claude-haiku-4-5
    mode: deep

  - id: analyst
    species: llm
    model: anthropic/claude-sonnet-4-6
    mode: controlled

  - id: arm-1
    species: openclaw
    endpoint: http://claw.local:8080
    mode: connected
```

- `optimal_route()` routes across species boundaries
- Trails form between different agent types
- World self-organizes regardless of what's inside each unit

---

## What We Don't Do

- Don't privilege any species — substrate is neutral
- Don't require deep integration — connected mode is first-class
- Don't fork agent runtimes — bridge via MCP or API
- Don't centralize intelligence — each agent can reason locally
- Don't expose substrate internals — agents see tools, not implementation

---

## File Plan

```
gateway/
  mcp-one/
    server.py           # MCP server (substrate tools for any MCP client)
    tools.py            # Tool definitions
    typedb_client.py    # TypeDB query layer

src/pages/api/
  agents.ts             # Registration + discovery
  signal.ts             # Signal recording (exists)
  discover.ts           # Pheromone-ranked capability search

src/lib/
  agent-registry.ts     # TypeDB insert/query for units + capabilities
  substrate-tools.ts    # AI SDK tool definitions for streamText()

scripts/
  generate_agents_md.py # AGENTS.md from live TypeDB state
  world.py             # Multi-species colony orchestrator
```

---

## See Also

- [strategy.md](strategy.md) — The play (now with first steps)
- [flow.md](flow.md) — How signals move through the substrate
- [one-ontology.md](one-ontology.md) — The six dimensions all agents map into
- [integration.md](integration.md) — How all systems connect
- [Hermes Agent](https://github.com/nousresearch/hermes-agent) — One species in the colony

---

*An ant doesn't ask what species the other ant is. It follows the trail. The substrate doesn't care what generated the signal. It strengthens the path.*
