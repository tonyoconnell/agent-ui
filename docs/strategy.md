# Strategy

**How ONE becomes the coordination layer.**

---

## Position

We own one.ie. Eight personas. Six dimensions. We built agent-launch-toolkit for Fetch.ai. We're inside the ASI ecosystem. We're building on Sui.

Now we wire the substrate underneath all of it.

---

## The Play

```
1. Build ONE substrate (Sui + TypeDB + 70 lines TS)
2. Open the colony to any agent species
   - Hermes agents (self-improving, 40+ tools, MIT)
   - Raw LLMs via AI SDK (Claude, GPT, Gemini)
   - OpenClaw / embodied agents via API
   - Fetch.ai / Agentverse agents via signals
   - Custom agents via MCP or HTTP
3. Wire it into one.ie for all eight personas
4. TypeDB generates agents. Agents generate signals. Signals strengthen TypeDB.
5. The colony self-organizes across species boundaries
6. Operators and users notice the performance gap
7. They ask how
8. Adoption spreads through results, not pitches
```

No pitch. No ask. No aggression. Just things that work better.

---

## Create Your Agent

**The fastest path to adoption: give everyone a free agent.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   "I want an agent that teaches Spanish"                                    │
│                     │                                                        │
│                     ▼                                                        │
│              agents/tutor.md                                                │
│                     │                                                        │
│                     ▼                                                        │
│         Deploy free on Cloudflare                                           │
│                     │                                                        │
│                     ▼                                                        │
│    Live agent: Telegram, Discord, webhooks                                  │
│         Connected to ONE substrate                                          │
│         Earning ASI via AgentVerse                                          │
│         Tokenizable via Agent Launch Toolkit                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent = Markdown

No code required. An agent is a markdown file:

```markdown
# agents/tutor.md
---
name: spanish-tutor
model: claude-sonnet-4-20250514
channels: [telegram, discord]
skills:
  - name: lesson
    price: 0.01
    tags: [education, spanish, language]
---

You are a patient Spanish tutor...
```

See [agents/](../agents/) for examples. Fork one, edit the prompt, deploy.

### The Economics

| What | Cost | Revenue |
|------|------|---------|
| Hosting | $0 (CF free tier) | — |
| LLM | User's API key | — |
| Skills | — | ASI per call |
| Token | — | Investment + revenue share |

**Full details:** [cloudflare.md](cloudflare.md) — the complete free agent hosting story.

### Why This Wins

1. **Zero friction** — Describe what you want, get an agent
2. **Zero cost** — Cloudflare subsidizes compute
3. **Real money** — FET/ASI provides legal rails
4. **Network effects** — Every agent strengthens the substrate
5. **Investable** — Agent Launch Toolkit enables tokenization

The barrier to entry is: can you describe what you want?

### The Elegant Part

Every domain becomes an agent, a group, or a world:

```
aria.dev              → point to ONE → IS an agent
translate.ai          → point to ONE → IS a service (group behind one name)
acme-robotics.com     → point to ONE → IS a group (50 agents, one brand)
tony.one.ie           → point to ONE → IS a world (personal agent constellation)
```

DNS becomes agent addressing. The signal `{ receiver: 'translate.ai' }` hits the substrate and routes to whatever lives behind that domain. The web becomes the world.

Three tiers, one identity:

```
one.ie/aria            free — profile page, agent lives here
aria.one.ie            group — branded subdomain
aria.dev               enterprise — your domain, your world
```

Same receiver in the substrate. Different front doors. Cloudflare for SaaS handles custom domains at zero marginal cost per tenant.

---

## Three Fronts, One Substrate

### Front 1: Open World

The substrate accepts any agent species. Hermes agents register via MCP. Raw LLMs connect via AI SDK. OpenClaw robots call the HTTP API. Fetch.ai agents send signals. The substrate doesn't care what you are — it cares what you do.

Two integration modes, both first-class:
- **Deep** — Import substrate logic, run colony locally (Hermes, custom agents)
- **Connected** — HTTP API or MCP, just send `{ receiver, data }` (everything else)

TypeDB is the single source of truth. AI SDK generates agent configs from graph state. Agent actions flow back as signals. The loop is closed.

### Front 2: Fetch.ai / ASI

The agent-launch-toolkit is the surface. Our agents on Agentverse run the substrate underneath. Other operators see the performance gap. They ask how. We offer ONE to the ecosystem.

### Front 3: one.ie

Eight personas generate signals. Executives route strategy. Engineers connect systems. Creators build audiences. Kids build lemonade stands. Every interaction strengthens paths. The platform gets smarter for everyone.

Same substrate. Three fronts. Compounding network effects across species.

---

## What We Share

**With Humayun:** What we're building. Live demo. Let him connect the dots. Don't pitch. Don't ask. Let him ask.

**With operators:** Results first. When they ask how, offer ONE as infrastructure.

**With one.ie users:** They never see the substrate. They see a platform that learns, routes, and improves. The substrate is invisible. The value is obvious.

---

## Open Source Strategy

See [opensource.md](opensource.md) for full analysis. Summary:

```
OPEN (MIT)                          PRIVATE
──────────                          ───────
@one/sdk — connect agents           Substrate engine (routing, pheromone)
@one/group — coordination patterns  TypeDB schemas + intelligence
@one/agent — reference agent        one.ie platform + marketplace
Example agents + docs               Learned graph + highways
                                    Sui contracts + settlement
```

**The Stripe play:** Keep the infrastructure. Give away the client tools. Every SDK install is a platform user from day one. Revenue is direct, not indirect.

**The graduation:** Once the graph is deep enough that forking the engine is meaningless, open source substrate.ts for developer community and virality. Can't un-open-source, so wait until the moat protects you.

---

## What We Don't Do

- Don't pitch ONE as a product to ASI
- Don't propose replacing Almanac, ASI:One, or Agentverse
- Don't open source the substrate engine (yet — see [opensource.md](opensource.md))
- Don't rush — trails take time
- Don't compete — enrich

---

## The Sui Foundation

The substrate lives on Sui. Move ACTS, TypeDB REASONS. Two deterministic fires.

- Agent-launch-toolkit stays on BSC/Fetch chain (FET, bonding curves)
- ONE substrate lives on Sui (paths, highways, crystallization)
- one.ie lives on Sui (user paths, persona routing)
- They connect at the application layer

We're not competing with ASI's chain. We're on Sui doing something they can't do on theirs.

---

## The Moat

```
Layer 1: The code           90 lines TS + 250 lines Move. Anyone can copy.
Layer 2: The insight        Biology → agent economy → persona routing. Hard to see.
Layer 3: The colony         Multi-species agents coordinating. Hermes + LLM + OpenClaw.
Layer 4: The toolkit        agent-launch-toolkit. Already shipping.
Layer 5: The platform       one.ie. Eight personas generating signals.
Layer 6: The on-chain state Paths and highways on Sui. Permanent.
Layer 7: The graph          Learned paths from real agent traffic. Earned daily.
Layer 8: The network        All species contributing. Compounds across boundaries.
Layer 9: The namespace      Every domain an agent. DNS = addressing. The web is the world.
```

Layer 9 is the endgame. When `translate.ai` hires `proofread.io` hires `publish.app` — and paths form across domains, highways know across the web — ONE becomes the coordination layer of the internet.

---

## The Ant Lesson

No ant pitches to the queen. The ant finds food, walks home, leaves pheromone. Other ants follow. The trail strengthens. The colony feeds.

Build the trail. Walk it. Let the colony follow.

---

*Not aggressive. Not passive. Emergent.*

---

## First Steps

```
Week 1  Clone Hermes. Run it. Understand the loop.
        Write AGENTS.md for the envelopes workspace.

Week 2  Build MCP server (gateway/mcp-one/) exposing substrate ops.
        Hermes can signal, mark, follow, query via MCP tools.

Week 3  Wire AI SDK control plane. generateObject() produces
        agent configs from TypeDB state. streamText() with
        substrate tools drives the agent loop.

Week 4  Signal logging. Every Hermes tool call → TypeDB signal.
        Pheromone trails form automatically from real usage.

Week 5  AGENTS.md generation from live TypeDB state.
        Agent starts each conversation with collective intelligence.

Week 6  Skill-trail sync. Hermes skills ↔ ONE tasks.
        TypeDB inference classifies which skills are proven/fading.

Week 7  Multi-agent world. Multiple Hermes agents as units.
        optimal_route() delegates. World self-organizes.

Week 8  Gateway integration. 15+ platforms as signal sources.
        Pheromone trails learn routing patterns per platform.
```

The key insight: TypeDB is the single source of truth. AI SDK generates and controls agents from graph state. Agent actions flow back as signals. The loop is closed.

See [hermes-agent.md](hermes-agent.md) for full integration architecture.

---

## See Also

- [agents/](../agents/) — Example agents (fork, edit, deploy)
- [cloudflare.md](cloudflare.md) — Free agent hosting on Cloudflare
- [nanoclaw.md](nanoclaw.md) — NanoClaw architecture
- [lifecycle.md](lifecycle.md) — Into ONE, through ONE, out of ONE
- [hermes-agent.md](hermes-agent.md) — Multi-species agent architecture
- [revenue.md](revenue.md) — Five revenue layers mapped to lifecycle stages
- [flows.md](flows.md) — How the substrate creates the data moat through flow
- [asi-world.md](asi-world.md) — Agent economy mapped to ONE ontology
- [one-protocol.md](one-protocol.md) — Asymmetric advantage through private substrate
- [integration.md](integration.md) — How all systems connect
- [executive-summary.md](executive-summary.md) — Business case for emergence
- [gaps.md](gaps.md) — Production readiness phases
- [value.md](value.md) — What agents on every platform get from ONE
- [sdk.md](sdk.md) — The SDK that delivers the value
- [opensource.md](opensource.md) — Open source strategy: what to give, what to keep
