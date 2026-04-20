# Donal

Yerra, Donal. This is the plan to take everything you've built in the last fortnight and put it on rails that compound — your agents, your personas, your 2.2M chars of intel, your nine retainers — the whole shebang, on ONE infrastructure, without touching the Python that's earning rent today.

> *"Tús maith leath na hoibre."* — a good start is half the work. You've done the start. This doc is the other half.

---

## Why this doc exists

Donal built a delivery machine in two weeks: 36 Fury agents, 28 personas, 10 specialists, 9 live retainers, 2.2M chars of ingested intel, 125 experiments queued. It all runs on Python + Airtable + cron. It works. It earns. It doesn't compound.

I built ONE: a signal substrate with TypeDB as the brain, markdown agents that sync to a live runtime, pheromone routing, Sui auto-wallets, nanoclaw edge delivery. It compounds. It needs agents. Fair play — you've got agents.

This doc is the map. Your teams become ONE templates. Your agency runs on ONE infra. The Python keeps delivering while pheromone learns what's gold and what's grand-but-not-great. Two-way flywheel — your craft feeds our substrate, our substrate feeds your craft back smarter than it came in.

> *Sure look, that's the deal. Let's get into it.*

---

## The whole picture in one frame

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   DONAL'S CRAFT (muscle)                ONE (nervous system + infra)         │
│   ──────────────────────                ──────────────────────────           │
│                                                                              │
│    36 Fury agents (Python)                 agent-md.ts pipeline              │
│    28 personas                              TypeDB Cloud brain               │
│    10 specialists                           7 loops (L1→L7)                  │
│    125 experiments                          nanoclaw edge worker             │
│    2.2M chars ingested                      Gateway + Pages + Sync           │
│    9 live retainers                         Sui auto-wallets (per agent)     │
│    16 automations                           OpenRouter (all models)          │
│    Airtable trust log                       pheromone routing                │
│    Python + cron                            markdown → TypeDB → runtime      │
│                                                                              │
│         │                                              │                    │
│         └──────── INGEST · HARVEST · WIRE · LEARN ─────┘                     │
│                                 │                                            │
│                                 ▼                                            │
│                       ╔════════════════════════╗                             │
│                       ║   agents/donal/*.md    ║                             │
│                       ║   knowledge/donal/*    ║                             │
│                       ║   src/worlds/*.ts      ║                             │
│                       ║                        ║                             │
│                       ║  syncWorld() → TypeDB  ║                             │
│                       ║  wireWorld() → runtime ║                             │
│                       ║  Python stays put      ║                             │
│                       ║  pheromone compounds   ║                             │
│                       ╚════════════════════════╝                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## What Donal built (last 2 weeks)

- **36 agents** across 3 levels (6 L1 + 11 L2 + 19 L3), 180 Python files, universal contract `run_task(task: dict) → str`, self-review loop per agent. Branch: `operation-fury-day-1`.
- **28 personas** — Feynman, Boyd, Taleb, Cialdini, Tufte, Deming, Sagan, Kennedy, Brunson, Schwartz, Thiel, Kelly Johnson, Knuth, Dalio, Ogilvy, Musk, Jobs, +others. Mighty stuff.
- **10 delivery specialists** — copywriter, fb_ads, google_ads, seo_gbp, web_dev, analytics, automation, cro, reports, ecom.
- **R&D Batcave** — Airtable base, 255 records (125 experiments, 20 business ideas, 27 personas, 83 blockers). `heartbeat.py` with 10/10 safety guardrails, kill switch, $10/day cap, Haiku default.
- **2.2M chars ingested** — 134 videos transcribed (Whisper offline), 62 books PDF→MD, 8 podcast feeds, 3 courses, Floate x5, Matt Diggity, 8 SEO ebooks. Zero failures. Deadly work.
- **9 live client retainers** — Elite Movers, ANC, Bobcat, Maestro, Soft Touch, Moving Pro, Metal Warehouse, Lankford Roofing, ACCD.
- **16 automation workflows** + 4 n8n boards (onboarding, PBN, monthly reports, AI Ranking).
- **Lead-to-Live pipeline** — Bison + Instantly + n8n audit + HeyGen VSL + quick-lead-site + qa-site.
- **Link-Building covert 12-agent system** — 9 of 12 agents live.
- **Ops Dashboard V1** deployed to CF Pages staging.

> *Fair play, boyo. That's not a fortnight's work, that's a year of most agencies.*

---

## How ONE's infrastructure works

```
                          ┌──────────────────────────┐
                          │        TELEGRAM          │
                          │        DISCORD           │
                          │        SLACK / WEB       │
                          └────────────┬─────────────┘
                                       │
                                       ▼
                         ┌──────────────────────────┐
                         │   NANOCLAW (CF Worker)   │◄── free edge
                         │   nanoclaw.workers.dev   │    global <10ms
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │   PERSISTENT WORLD       │
                         │   signal router + queue  │◄── module-cached
                         │   in-memory pheromone    │    hot per isolate
                         └────────────┬─────────────┘
                                      │
                           ┌──────────┴──────────┐
                           ▼                     ▼
          ┌──────────────────────┐    ┌──────────────────────┐
          │   GATEWAY (proxy)    │    │   OPENROUTER         │
          │   api.one.ie         │    │   all models, one    │
          │   no direct DB creds │    │   key, Llama-4 def.  │
          └──────────┬───────────┘    └──────────┬───────────┘
                     │                           │
                     ▼                           ▼
          ┌──────────────────────┐    ┌──────────────────────┐
          │   TYPEDB CLOUD       │    │   SUI AUTO-WALLET    │
          │   paths, units,      │    │   addressFor(uid)    │
          │   skills, knowledge  │    │   no key custody     │
          └──────────┬───────────┘    └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   WORKERS/SYNC       │
          │   1-min cron         │
          │   TypeDB → KV snap   │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   PAGES DASHBOARD    │
          │  one-substrate.pages │◄── live highways, toxic
          │  .dev                │    per-client worlds
          └──────────────────────┘

       All running on Cloudflare free tier. Monthly bill: $0. Grand altogether.
```

---

## How one of Donal's agents works in ONE

A single agent is just a markdown file. The frontmatter is the contract, the body is the prompt, the sibling `.rubric.yml` is the quality gate.

```
agents/donal/copywriter.md
┌────────────────────────────────────────────────┐
│  ---                                           │  ← YAML frontmatter
│  name: copywriter                              │    follows AGENTS.md /
│  model: anthropic/claude-sonnet-4-5            │    Claude SKILL.md shape
│  channels: [telegram, slack, web]              │
│  group: donal                                  │
│  skills:                                       │
│    - name: headline                            │
│      price: 0.02                               │
│      tags: [copy, headlines, donal]            │
│    - name: body                                │  ← priced per skill
│      price: 0.03                               │    (L4 revenue loop)
│      tags: [copy, longform, donal]             │
│  sensitivity: 0.6                              │
│  ---                                           │
│                                                │
│  You are Donal's copywriter. Turn briefs       │  ← system prompt
│  into assets that convert. Consult Ogilvy      │    harvested from Fury
│  for long-form, Schwartz for hooks...          │
└────────────────────────────────────────────────┘
                      │
                      │  syncAgent()
                      ▼
┌────────────────────────────────────────────────┐
│              TYPEDB CLOUD                      │
│                                                │
│  unit donal:copywriter                         │
│  skill donal:headline (price 0.02)             │
│  skill donal:body     (price 0.03)             │
│  capability (provider→offered, priced)         │
│  membership (group: donal, member: copywriter) │
└────────────────────────────────────────────────┘
                      │
                      │  wireAgent()
                      ▼
┌────────────────────────────────────────────────┐
│              LIVE RUNTIME UNIT                 │
│                                                │
│  .on('headline', handler)                      │  ← Fury bridge first
│  .on('body',     handler)                      │    (HTTP → Python)
│  .then('headline', r => next)                  │    native LLM later
│                                                │    once rubric says so
│  → auto-reply via replyTo                      │
│  → mark/warn on outcome                        │
│  → pheromone compounds per skill               │
└────────────────────────────────────────────────┘
```

One file. One YAML shape. Two layers of execution (bridged today, native tomorrow). Substrate decides when to graduate — no flag to flip.

---

## How agent teams work in ONE

Teams are groups of agents that know how to call each other. Continuation chains (`.then()`) describe the dependencies — no orchestrator, no central brain, no Python glue.

```
                    ┌───────────────────────┐
                    │  donal:director       │  ← strategy, briefs
                    │  tag: orchestrator    │    L1 agent
                    └──────────┬────────────┘
                               │
                .then('brief') │
                               ▼
                    ┌───────────────────────┐
                    │  donal:creative       │  ← copy, concepts
                    │  skill: variants      │    L3 specialist
                    └──────────┬────────────┘
                               │
                 emit ────────►│◄──── consults ────┐
                               │                    │
                               ▼                    │
                    ┌───────────────────────┐      │
                    │  donal:media-buyer    │      │    ┌──────────────┐
                    │  skill: launch        │──────┼───►│  personas:   │
                    └──────────┬────────────┘      │    │  ogilvy      │
                               │                    │    │  schwartz    │
                               │ performance data  │    │  brunson     │
                               ▼                    │    │              │
                    ┌───────────────────────┐      │    │ no price     │
                    │  donal:creative       │      │    │ tag=persona  │
                    │  .on('iterate')       │──────┘    │ select() by  │
                    └───────────────────────┘           │ pheromone    │
                                                         └──────────────┘

    ▲ Every hop is a signal. Every hop leaves pheromone.
    ▲ Strong paths get more traffic. Weak paths fade.
    ▲ Failed paths resist 2x faster than they accumulate.
```

The runtime isn't orchestrating. It's *routing*. The team is a map, not a flowchart.

---

## How ONE's world works (the 7 loops)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                        ONE WORLD (one .tick/sec)                        │
│                                                                         │
│   L1 · SIGNAL ────── ms ────── every message: route → ask → outcome     │
│         │                                                               │
│   L2 · TRAIL ────── ms ────── mark/warn → strength/resistance           │
│         │                                                               │
│   L3 · FADE  ────── 5 min ──── decay all edges, resistance 2x faster    │
│         │                                                               │
│   ──────┴─ nervous system (Donal's side of the line, runs hot) ──────   │
│                                                                         │
│   L4 · ECONOMIC ─── per call ─ price × capability → revenue on path     │
│         │                                                               │
│   L5 · EVOLUTION ── 10 min ─── rewrite struggling prompts (24h cd)      │
│         │                                                               │
│   L6 · KNOWLEDGE ── 1 hour ─── promote highways to hypotheses           │
│         │                                                               │
│   L7 · FRONTIER  ── 1 hour ─── detect unexplored tag clusters           │
│                                                                         │
│   ──────── brain (ONE's side, slow compounding) ─────────               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

       Fast loops handle what moves. Slow loops handle what remains.
           Together: a world that gets smarter while it earns.
```

---

## How Donal's clients become worlds in ONE's world

Each retainer is its own `WorldSpec` — a sub-world inside ONE's world. Pheromone stays scoped. Elite Movers' bad trails can't poison ANC. Nine brains. One substrate. One dashboard.

```
                           ┌─────────────────────────┐
                           │      ONE WORLD          │
                           │   (the substrate)       │
                           └───────────┬─────────────┘
                                       │
          ┌────────────┬────────────┬──┴──────┬────────────┬────────────┐
          ▼            ▼            ▼         ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  donal   │ │  elite   │ │   anc    │ │  bobcat  │ │  metal   │ │ lankford │
   │  agency  │ │  movers  │ │  movers  │ │          │ │warehouse │ │ roofing  │
   │ (parent) │ │          │ │          │ │          │ │          │ │          │
   └────┬─────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘
        │             │             │             │             │             │
        │      ┌──────┴──────┐      │             │             │             │
        │      │ creative    │      │             │             │             │
        │      │ media-buyer │      │             │             │             │
        │      │ seo         │      │             │             │             │
        │      │ reports     │      │             │             │             │
        │      └─────────────┘      │             │             │             │
        │                           │             │             │             │
        │             ─── each world: its own pheromone, tagged ───             │
        │             ─── scoped agents, own rubric average,     ───             │
        │             ─── isolated L5 evolution, shared brain    ───             │
        │                                                                        │
        ▼                                                                        ▼
    agents pool                                                         more worlds as
    (all agents live                                                    clients arrive
    in parent, worlds                                                   via cp template
    compose subsets)                                                    + syncWorld()

   ▲ A new retainer = copy an existing WorldSpec, change the name, change the agents,
     syncWorld(). The new client is live in ~3 minutes. Substrate does the rest.
```

```typescript
// src/worlds/elite-movers.ts
export const eliteMovers: WorldSpec = {
  name: 'elite-movers',
  description: 'Elite Movers retainer — SEO + GBP + reports',
  agents: [seoSpec, gbpSpec, reportsSpec, copywriterSpec, analyticsSpec]
}

await syncWorld(eliteMovers)
const units = wireWorld(eliteMovers, net, complete)
```

---

## Standards we align to (so Donal's agents are portable)

ONE doesn't reinvent formats. It adopts what the ecosystem is already converging on. If customers speak MCP, we speak MCP. If they want A2A, we speak A2A. If they want paid-per-call via x402, we do that too. Donal's agents ride *every* rail without rewriting.

```
┌─────────────────┬──────────────────────┬────────────────────────────────────┐
│ Standard        │ What it is           │ Where ONE adopts it                │
├─────────────────┼──────────────────────┼────────────────────────────────────┤
│ AGENTS.md       │ Portable agent       │ Root of every agent markdown —     │
│                 │ instruction format   │ frontmatter + system prompt shape  │
│                 │ (OpenAI, others)     │                                    │
├─────────────────┼──────────────────────┼────────────────────────────────────┤
│ Claude SKILL.md │ YAML frontmatter     │ Our skills: name, price, tags,     │
│                 │ skill definition     │ sensitivity — same shape           │
├─────────────────┼──────────────────────┼────────────────────────────────────┤
│ Vercel AI SDK   │ Typed structured     │ Rubric scoring + ingest extraction │
│                 │ output via Zod       │ use generateObject + Zod schemas   │
├─────────────────┼──────────────────────┼────────────────────────────────────┤
│ MCP             │ Model Context        │ Expose ONE skills as MCP tools;    │
│                 │ Protocol (Anthropic) │ read external MCP servers as units │
├─────────────────┼──────────────────────┼────────────────────────────────────┤
│ A2A             │ Agent-to-Agent       │ Cross-framework messaging — ONE    │
│                 │ protocol (Google)    │ units speak A2A to LangChain,      │
│                 │                      │ AutoGen, CrewAI agents             │
├─────────────────┼──────────────────────┼────────────────────────────────────┤
│ x402            │ HTTP 402 payment     │ Per-skill pricing settles on Sui   │
│                 │ (Coinbase)           │ via x402 headers, no invoice ops   │
├─────────────────┼──────────────────────┼────────────────────────────────────┤
│ OpenSpec        │ Spec-driven dev      │ Agent changes go through OpenSpec  │
│                 │ (proposals, deltas)  │ proposals before merge — reviewable│
├─────────────────┼──────────────────────┼────────────────────────────────────┤
│ OpenRouter      │ Unified model API    │ All LLM calls, one key, any model  │
├─────────────────┼──────────────────────┼────────────────────────────────────┤
│ TypeDB 3.x      │ Strong-typed graph   │ The brain. Functions, not rules.   │
└─────────────────┴──────────────────────┴────────────────────────────────────┘
```

### Our agent framework, in one sentence

**A ONE agent is a markdown file** with AGENTS.md-style frontmatter, Claude SKILL.md-shaped skills, Zod-typed inputs/outputs, MCP tool exposure, A2A message compatibility, x402 pricing, and an OpenSpec change history.

One file. Every standard. Nothing custom unless it has to be.

---

## Ingesting Donal's agency, step by step

Three separate products come out of ingestion — do not mix them.

```
                 ┌─────────────────────────────────────┐
                 │        DONAL'S FURY REPO            │
                 │                                     │
                 │  agents/*.py    personas/*.md       │
                 │  specialists/*  experiments.json    │
                 │  corpus/*.md    airtable export     │
                 └──────────────┬──────────────────────┘
                                │
                                ▼
                 ╔══════════════════════════════════════╗
                 ║      scripts/ingest-fury.ts          ║
                 ║  parse · extract · score · emit      ║
                 ╚═══════╦══════════════╦═══════════════╝
                         │              │
          ┌──────────────┤              ├──────────────┐
          ▼              ▼              ▼              ▼
 ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 │  TEMPLATES   │ │    WORLDS    │ │    CORPUS    │ │   LEDGER     │
 │              │ │              │ │              │ │              │
 │ agents/donal │ │ src/worlds/  │ │ knowledge/   │ │ reports/     │
 │ /*.md        │ │ donal.ts +   │ │ donal/*.jsonl│ │ ingest/*.md  │
 │ /*.rubric.yml│ │ 9 clients    │ │              │ │              │
 │              │ │              │ │ videos, books│ │ every score  │
 │ → syncAgent  │ │ → syncWorld  │ │ experiments  │ │ every verdict│
 │   TypeDB     │ │   TypeDB     │ │ → L6 know()  │ │ gold/rewrite │
 │   runtime    │ │              │ │              │ │ /archive     │
 └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
   nervous system      teams          the memory      the audit trail
```

The rubric (`docs/rubrics.md`) is the gold-detector. Every extracted prompt gets scored on Fit · Form · Truth · Taste. Score ≥ 0.85 lands verbatim. 0.65–0.84 gets a rewrite pass. Below 0.5 goes to the archive as a lesson.

> *Don't be throwin' the baby out with the bathwater — what works, works. We just want to know **why** it works so the substrate can learn it.*

Full plan in `docs/ingest.md`.

---

## What ONE offers Donal — in simple English

No jargon. No substrate talk. Just what he gets.

### Infrastructure (free, today)

1. **A chat frontend for every agent** — Telegram, Discord, Slack, web. He writes the agent in markdown, we put it on a chat app in minutes.
2. **Global edge delivery** — agents respond in <10ms from anywhere in the world. Cloudflare Workers. No servers to babysit.
3. **Zero hosting bill** — Cloudflare free tier covers it. No AWS surprise invoices.
4. **All the models in one place** — Claude, GPT, Gemini, Llama, Qwen — one API key via OpenRouter. Swap models without changing code.
5. **A dashboard** — see which agents are earning, which are struggling, which paths are hot. Live, not a PDF.
6. **Per-agent wallets** — every agent gets a Sui wallet automatically. He never touches keys. Agents can get paid directly.

### Brain & memory

7. **A memory that never forgets** — TypeDB Cloud remembers every conversation, every outcome, every success, every failure. Queryable forever.
8. **Knowledge from his corpus** — his 2.2M chars of videos, books, courses become searchable facts his agents can cite. Not just "somewhere in the docs" — actually retrievable.
9. **125 experiments pre-loaded** — the Batcave becomes live hypotheses the substrate tests and scores.

### Agents & teams

10. **Every agent on one format** — markdown file, YAML frontmatter. Port once, run everywhere (Telegram, Slack, API, web, MCP, A2A, x402).
11. **Automatic quality scoring** — every response gets a rubric score. The good ones compound. The bad ones retire. No manual QA.
12. **Agent improvement on autopilot** — when a prompt underperforms for 24 hours, the substrate rewrites it, tests it, and swaps it in if it's better. He wakes up to better agents.
13. **Team routing without orchestrators** — agents find each other by reputation, not by a central flowchart. Teams re-wire themselves as the work changes.
14. **Persona library shareable across clients** — Feynman, Ogilvy, Schwartz, Boyd — defined once, called from any retainer.

### Clients & commerce

15. **One client = one group** — Elite Movers has its own agents, its own trails, its own dashboard. ANC has its own. Nothing leaks between them.
16. **New client onboarding in 3 minutes** — copy an existing groups, rename, `syncWorld()`. Live.
17. **Pay-per-skill billing** — each skill has a price. Every call settles on Sui. Customers pay via x402. No Stripe plumbing.
18. **White-label dashboards per client** — each client sees their own world on a subdomain.

### Learning & leverage

19. **Two-way improvement loop** — when the substrate improves a ported prompt, it opens a PR back to his Fury repo. His Python gets smarter because it's on ONE.
20. **Shared intel corpus with ONE** — his 2.2M chars plus ONE's hypotheses. Rival-intel firehose, compounding weekly.
21. **Open-source base + private overlays** — the substrate is open, his agents stay his. Best of both.
22. **Framework portability** — his agents run on ONE, on AgentVerse (Fetch.ai), on LangChain, on CrewAI — whichever rail the customer wants.

### What he syncs, connects or replaces

23. **No more n8n** — `.then()` continuations replace the boards.
24. **No more Airtable as runtime** — TypeDB is the source of truth.
25. **No more cron babysitting** — ONE's tick loop runs 24/7.
26. **No more custodial wallets** — Sui derivation, no keys stored.
27. **No more custom QA** — rubrics automate it.
28. **No more manual trust logs** — pheromone *is* the trust log.

> *That's the full list. Grand, eh? Anything missing, shout.*

---

## Integration mapping (the conversion table)

```
Donal's stack                ─────▶   ONE substrate
──────────────────────────            ──────────────────────────
36 Fury agents (Python)               agents/donal/*.md → units
run_task(task) → str                  .on(name, fn) via fury bridge
self-review loop                      .rubric.yml + mark/warn outcomes
Council (manual pheromone)            select() probabilistic routing
Airtable trust log                    TypeDB paths (strength/resistance)
heartbeat.py (cron)                   L5 evolution loop (every 10 min)
125 experiments                       L6 knowledge hypotheses
Specialists + Personas                capability relations, skill tags
9 client retainers                    9 WorldSpec (one per client)
manual billing                        Sui auto-wallet + x402 per skill
Python HTTP                           nanoclaw edge (Telegram/Discord/Slack)
custom orchestration                  .then() continuations
n8n boards                            signal chains
corpus as files                       L6 hypotheses via persist.know()
```

---

## Conversion roadmap (first week)

```
Day 1  ──  Bridge: src/engine/bridges/fury.ts
       ──  First template: copywriter.md + copywriter.rubric.yml (hand port)
       ──  Corpus copy: knowledge/donal/*.jsonl staged

Day 2  ──  Parser: Fury Python → AgentSpec (dry run)
       ──  Rubric judge: src/engine/rubric.ts with Haiku default

Day 3  ──  Run --dry on all 10 specialists. Read ledger with Donal.
       ──  Calibrate judge vs hand-score until delta < 0.15 per dim.

Day 4  ──  Full ingest: specialists + personas → agents/donal/
       ──  syncWorld(donalSpec) → TypeDB
       ──  Wire nanoclaw channels

Day 5  ──  Corpus bulk load → knowledge/donal/, persist.know() seeded
       ──  L6 hypotheses promoted from 125 experiments

Day 6  ──  First retainer on substrate: elite-movers.ts WorldSpec
       ──  First real task end-to-end through nanoclaw
       ──  Watch pheromone form on the dashboard

Day 7  ──  Remaining retainers queued. AI Ranking as WorldSpec scoped.
       ──  Open-source announcement draft. PR-back policy decided.
```

Week 2: 26 agents + 8 retainers. Week 3: flagship worlds. Week 4: L5 rewriting low-scoring prompts, first PR back to Fury repo.

Full detail in `docs/ingest.md`.

---

## C-suite state

```
┌──────────────┬────────────────┬─────────────────┬─────────────────────┐
│ Role         │ Who            │ Job             │ State               │
├──────────────┼────────────────┼─────────────────┼─────────────────────┤
│ CEO          │ Donal          │ strategy · $$$  │ $14k → $100k/mo     │
│ CMO          │ Persona-led    │ outreach · VSL  │ awaiting activation │
│ CSO          │ Tomas + Donal  │ sales · close   │ first Boise call    │
│ COO          │ Tony (ONE)     │ delivery · QA   │ substrate runs 9    │
│ CTO          │ Tony (ONE)     │ agents · infra  │ nanoclaw + TypeDB   │
│ R&D Director │ (at $20k MRR)  │ autonomous pod  │ 125 exp pre-seeded  │
└──────────────┴────────────────┴─────────────────┴─────────────────────┘
```

---

## Status snapshot

```
  Agents built (Python) ...... 36 / 36
  Link agents built .......... 9 / 12
  Live retainers ............. 9
  MRR ........................ $14-15k
  MRR target ................. $100k
  R&D Director lightup ....... $20k MRR
  AI cost (2 weeks) .......... ~$170
  Agents ported to ONE ....... 0 / 36  ← start here
  Corpus ingested to ONE ..... 0 / 2.2M chars
  Retainers on substrate ..... 0 / 9
  Conversion start ........... 2026-04-11  ← today
```

---

## Open questions for Donal (Day 1 blockers)

1. **Repo access** — Fury on GitHub or local only? Read access for the ingest CLI?
2. **Default model** — current Python default? (Maps to `model:` in frontmatter.)
3. **Pricing intuitions** — rough `price:` per skill class, or let L4 auto-tune?
4. **Self-review naming** — convention so the parser can find them?
5. **Corpus licenses** — which of the 134 videos / 62 books can live in `knowledge/donal/`?
6. **Retainer mapping** — which agents does each of the 9 clients actually use?
7. **PR-back policy** — when L5 improves a prompt, auto-PR to Fury, or queue for Donal?

> *Answer these and we're off to the races. Sure look, nothing here's a blocker — just saves us guessin'.*

---

## The bet

```
                  Donal built the muscle.
                  ONE is the nervous system + infra.
                  ─────────────────────────────────────────
                  Python delivers.
                  Markdown describes.
                  TypeDB remembers.
                  Pheromone routes.
                  Substrate compounds.
                  Sui settles.
                  Cloudflare ships.

                  Today: bridge + first template + corpus copy.
                  This week: 10 specialists + 28 personas on substrate.
                  Next week: 9 retainers as worlds.
                  $20k MRR: R&D autonomous.
                  $100k MRR: substrate runs the agency.
```

> *"There's no secret to winning — you just have to want it more than the other crowd."* — **Mick O'Dwyer** (Kerry knows).

---

## Relation to other docs

| Doc | Role |
|-----|------|
| `docs/ingest.md` | The step-by-step ingestion pipeline, CLI, ledger format |
| `docs/rubrics.md` | The gold-detector. Fit · Form · Truth · Taste scoring |
| `docs/dictionary.md` | Complete ONE vocabulary |
| `docs/DSL.md` | `signal`, `emit`, `mark`, `warn`, `fade`, `select`, `follow` |
| `docs/routing.md` | How signals find their way |
| `docs/AUTONOMOUS_ORG.md` | The blueprint — task graph + revenue loops |
| `CLAUDE.md` | Project root. Engine files, deploy, skills |

---

*Donal built the agency. ONE is the substrate + infra. We ingest the muscle, score the gold, wire the rest, and learn both ways. Yerra, sure it'll be grand.*
