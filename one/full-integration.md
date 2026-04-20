---
title: Full Integration Map — ONE Substrate + Server Projects
summary: Catalog of all relevant projects in /Server and integration strategies
---

# Full Integration Map

Your `/Server` directory contains 12 major projects. This document maps what you've built, what's relevant to envelopes, and how to merge or integrate them.

---

## Quick Reference: Projects by Integration Relevance

```
CRITICAL (integrate immediately)
├── ONE/packages/         — 6D ontology, schemas, utilities
├── nanoclaw/             — Edge agents, /message API, Telegram/Discord
├── agent-launch-toolkit/ — AgentLaunch deployment, tokenization
└── donal/                — Multi-agent architecture, marketing pod

REFERENCE (design patterns to adopt)
├── ants-at-work/         — Pheromone routing, stigmergy, pattern tracking
├── agitrader/            — Self-improving loops, outcome learning
├── paperclip/            — Heartbeat protocol, adapter model, agent orchestration
├── kybernesis/           — TypeDB classifier functions, knowledge graph

SECONDARY (tools & utilities)
├── fetchlaunchpad/       — Token launchpad, bonding curves
└── lawyer/ divorce-lawyer/ — Domain-specific agent examples
```

---

## 1. ONE (Reference Ontology)

**Status:** Production. Live at one.ie. 6-dimensional data model.

**Relevant Modules:**

### 1.1 Ontology (`ONE/one/knowledge/ontology.md`)
- **6 dimensions:** Groups, People, Things, Connections, Events, Knowledge
- **Your fit:** Envelopes uses signals (Events), units (People/Things), pheromone (Knowledge/Connections). ONE's ontology is the semantic layer.
- **Action:** Copy ONE's entity definitions → extend with pheromone-specific types (Path, Trail, Strength, Resistance).

### 1.2 Packages to Reuse

| Package | Purpose | Integration |
|---------|---------|-------------|
| `ONE/packages/x402/` | Envelope signing, Sui wallets | Adopt for agent identity + signed messages |
| `ONE/packages/agent-wallet/` | Agent wallet management | Adopt for agent-as-DAO-member functionality |
| `ONE/packages/advanced-ai/` | Multi-model orchestration | Use for Council-style routing (GPT-4o + Claude + Gemini) |
| `ONE/packages/gateway/` | API gateway patterns | Reference for Cloudflare gateway routing |

### 1.3 Schema & TypeDB
- Location: `ONE/backend/schema/`
- **Current:** Uses Convex or TypeDB (check `package.json`)
- **Action:** Compare with envelopes' `src/schema/world.tql` — ONE may have fuller entity/relation definitions.

### 1.4 Web Stack
- **Framework:** Astro 5 + React 19 (same as envelopes)
- **Components:** shadcn/ui, Tailwind 4
- **Action:** Borrow component patterns for world graph visualization.

---

## 2. Nanoclaw (Edge Agent)

**Status:** Production. Two copies: `envelopes/nanoclaw/` and `Server/nanoclaw/`.

**Your nanoclaw is a fork.** The Server/nanoclaw is likely the "upstream" for reference.

### 2.1 API Surface
```
POST /message           — Send message, get response (~3s)
GET  /messages/:group   — Conversation history
GET  /highways          — Proven paths (pheromone export)
POST /webhook/:channel  — Telegram, Discord, etc.
```

### 2.2 What to Merge
- **Config patterns** — If upstream has newer environment setup, sync it.
- **Model selection** — Currently `google/gemma-4-26b-a4b-it` via OpenRouter. Your envelopes might want different models per channel.
- **Webhook receivers** — Copy Telegram/Discord handlers if missing from envelopes version.

### 2.3 Integration Strategy
**Option A:** Keep envelopes/nanoclaw as production deployment, use Server/nanoclaw for reference/upgrades.
**Option B:** Consolidate into Server/nanoclaw, symlink from envelopes build.

---

## 3. Agent-Launch-Toolkit

**Status:** Production. Standalone CLI. Fetch.ai integration.

**Purpose:** `bun agentlaunch` → Agent code → Agentverse → Bonding curve token.

### 3.1 What It Does
```
Your agent code
     ↓
AgentLaunch wraps it (adds Agentverse API)
     ↓
Deploy to Agentverse
     ↓
Tokenize on bonding curve (TFET)
     ↓
Graduation to DEX at $30k liquidity
```

### 3.2 Integration with Envelopes
- **ONE agents as Agentverse agents:** Parse envelopes agent markdown → AgentLaunch → Agentverse. Creates dual deployment (ONE + Fetch.ai AV).
- **Revenue:** Agent token sales feed back to ONE as "capability pricing" (already in schema).
- **Sync loop:** `src/engine/agent-md.ts` → add AgentLaunch export step.

### 3.3 Roadmap Item
```
CURRENT: parse markdown → TypeDB
FUTURE:  parse markdown → TypeDB + AgentLaunch → Agentverse + token
```

**Code location:** `src/engine/agent-md.ts` line 280 — after `syncAgent()`, add `deployToAgentverse()`.

---

## 4. Donal (Multi-Agent Marketing Pod)

**Status:** Two active repos: `operation-fury-plus` and `agency-operator`.

**What it is:** 11-agent marketing team for Online Optimisers (Donal's agency). Dashboard at `ops.onlineoptimisers.net`.

### 4.1 Key Docs
- **Intel system:** `agency-operator/tools/intel/` — monitors 46 YouTubers, extracts insights, scores relevance.
- **Multi-agent architecture:** `multi-agent-architecture-plan-2026-04-09.md` — Council model (4 model debate layer) + Agents (execution layer) + Specialists (tool calls).
- **Daily brief:** 7am trigger, Telegram + Slack + Obsidian + ElevenLabs audio.

### 4.2 The Council Pattern
```
Stage 1 (Now):     Donal manually calls /council "question" → 4 models answer
Stage 2 ($40k):    Agents (all Claude) call Specialists (GPT-4o, Perplexity, Gemini) when needed
Stage 3 ($100k+):  Trust weights → autonomous routing (pheromone style)
```

**This IS the evolution loop you're building.** Donal's plan shows it concretely.

### 4.3 Integration with Envelopes
- **Agent markdown:** Donal's 11 agents could become ONE agents + auto-deployed to Agentverse.
- **Intel system:** Reusable for any domain (not just marketing). Generalize the scoring framework.
- **Daily brief pattern:** Template for L5-L7 loops (synthesis, knowledge, hypothesis generation).
- **Trust weights:** The pheromone trail in Donal's plan → feeds your `mark()` system.

### 4.4 Code to Reuse
- `agency-operator/tools/intel/relevance_scorer.py` — 5D scoring (agency, urgency, novelty, actionability, client_fit). Generalize → domain-neutral scoring.
- `daily_brief.py` — scheduling + digest generation. Port to Node.js for envelopes.

---

## 5. Ants-at-Work (Stigmergic Trading Colony)

**Status:** Production. Trading ETH-PERP + BTC-PERP on Hyperliquid testnet. Profitable. 3,388 tests.

**Why it matters:** **This is pheromone routing in action.** Every pattern your engine needs is here.

### 5.1 The System
```
MARKET STATES (nodes)       Market conditions (price ranges, trends, volume)
     ↓ TRANSITIONS_TO (edges with pheromone)
TRADING SIGNALS (actions)
     ↓ LEADS_TO (edges with pheromone)
OUTCOMES (success/failure)

The ant colony "smells" pheromones and follows strongest path → profitable trades.
```

### 5.2 Pheromone Storage & Routing
```typescript
// Edge structure (from agitrader/docs/pheromone-architecture.md)
(:MarketState)-[:TRANSITIONS_TO {
    pheromone: 7.2,        // Strength (0.0 to 15.0)
    probability: 0.68,     // Historical success
    count: 147,            // Sample size
    duration: 300,         // Avg time between states
    last_updated: datetime
}]->(:MarketState)
```

**This is your exact model.** Ants use Memgraph; envelopes uses TypeDB. Same semantics.

### 5.3 Learning Patterns
```
Colony Memory:     42 permanent patterns (what works, what doesn't)
Pheromone trails:  14,272 tracked, 519 winning (>52% win rate)
Pattern accuracy:  76% (6dim_strong_bear), 72% (6dim_flat_high)
```

**Equivalent in envelopes:**
- `highways(limit?)` → top 42 patterns.
- `mark(edge, strength)` → equivalent of pheromone increment.
- `warn(edge, strength)` → equivalent of pheromone decay.

### 5.4 Code to Reuse
- **Pattern generation:** `ants/intelligence/patterns.py` — how they generate hypotheses from state transitions.
- **Accuracy measurement:** `ants/emergence/measurement.py` — backtesting framework (adapt for agent performance).
- **Cascade strategy:** 3-wave execution (Fast @T+100ms, Medium @T+30s, Slow @T+5m). Pattern for multi-step agent chains.

---

## 6. Agitrader (Self-Improving Intelligence)

**Status:** Active development. Single agent learns from outcomes.

**Relevant for:** Evolution loops (L5 in your schema).

### 6.1 Key Pattern: Learning from Outcomes
```
Agent trades → outcome (profit/loss)
     ↓
Attribution analysis (which decision contributed?)
     ↓
Rewrite system prompt
     ↓
Next trade uses improved prompt
```

**In envelopes:** This is `loop.ts` L5 (EVOLUTION). Your code probably has the skeleton; agitrader shows the full implementation.

### 6.2 Prompt Evolution
- **File:** `src/prompt_evolution.ts` (hypothetical)
- **Pattern:** Collect N failures → analyze → rewrite system prompt → increment generation counter.
- **Safety:** 24-hour cooldown (don't evolve same agent twice in 24h).

---

## 7. Paperclip (Business Automation)

**Status:** Production. Heartbeat-based agent orchestration.

**Why it matters:** Shows how to schedule agents + capture work output.

### 7.1 Architecture
```
Trigger (cron / event)
    ↓
Heartbeat (wake agent)
    ↓
Adapter (spawn agent: Claude Code CLI, Codex, shell, HTTP)
    ↓
Agent does work (reads Paperclip API, checks tasks, updates status)
    ↓
Result capture (stdout, cost data, session state)
    ↓
Run record (for next heartbeat)
```

### 7.2 Adapter Model
```typescript
interface Adapter {
  execute(prompt: string, env: Record<string, string>): Promise<{
    stdout: string
    stderr: string
    exitCode: number
    duration: number
    cost: number
  }>
}
```

**In envelopes:** You have handlers. Paperclip's heartbeat is the scheduler for long-running tasks.

### 7.3 Code to Reference
- **Scheduler:** `paperclip/server/src/task-scheduler.ts` — cron + event-driven heartbeats.
- **Adapter interface:** `paperclip/packages/adapter-utils/src/` — how to safely execute external agents.

---

## 8. Kybernesis (TypeDB Knowledge Graph)

**Status:** Proposal. Upgrade from Convex + Chroma to TypeDB 3.0.

**Why relevant:** Shows native graph inference patterns.

### 8.1 Inference Rules (TypeQL Functions)
```typeql
define

// Rule: Transitive memory connections
rule transitive_memory_connection:
  when {
    (item1: $a, item2: $b) isa memory_connection;
    (item1: $b, item2: $c) isa memory_connection;
  }
  then {
    (item1: $a, item2: $c) isa memory_connection;
  };

// Rule: Tag-based connections
rule tag_based_similarity:
  when {
    (tagged_entity: $a, tagging: $t) isa tag_instance;
    (tagged_entity: $b, tagging: $t) isa tag_instance;
    $a != $b;
  }
  then {
    (item1: $a, item2: $b) isa memory_connection, has strength 2.0;
  };
```

**In envelopes:** Your `world.tql` schema could add similar rules for path inference (e.g., transitive skill dependencies).

### 8.2 Integration Strategy
- **Copy inference patterns** from Kybernesis → envelopes `src/schema/world.tql`.
- **Example:** If Unit A can do Skill B, and Skill B produces Skill C, can Unit A indirectly do C? Define it as a rule.

---

## 9. Fetchlaunchpad (Token Launchpad)

**Status:** Production at agent-launch.ai.

**Purpose:** DAO for launching agent tokens on bonding curves.

### 9.1 Components
- Bonding curve pricing
- Auto DEX listing (when liquidity threshold hit)
- Agent reputation tracking

### 9.2 Integration
- **Future:** ONE agents → tokens on fetchlaunchpad (not just Agentverse).
- **Revenue model:** Agent token sales → governance token holders → DAO treasury.

---

## 10. Lawyer + Divorce-Lawyer (Domain Agents)

**Status:** Examples of specialized agents in ONE system.

**Utility:** Templates for building domain-specific agent specs (markdown files → TypeDB).

---

## Integration Priority Matrix

```
High Impact, Low Effort
├── Donal's relevance scoring (generalize intel system)
├── Ants' pheromone storage patterns (reference implementation)
├── Kybernesis classifier functions (TypeQL template)
└── Paperclip's heartbeat scheduler (port to envelopes)

High Impact, High Effort
├── Full Donal integration (sync 11 agents to ONE)
├── Nanoclaw consolidation (merge upstream + envelopes versions)
├── Agent-launch-toolkit pipeline (markdown → Agentverse)
└── Agitrader's evolution loop (full L5 implementation)

Reference Only
├── Fetchlaunchpad patterns (keep separate project)
├── Lawyer examples (copy specs to agents/examples/)
└── ONE packages (review, don't merge; keep as dependency)
```

---

## Merge Checklist

### Immediate (This Week)
- [ ] **Read Ants-at-Work** — understand pheromone semantics deeply.
- [ ] **Copy Donal's intel system** — generalize relevance_scorer.py.
- [ ] **Review Kybernesis rules** — adapt 2-3 patterns for world.tql.
- [ ] **Sync Nanoclaw** — check upstream for API improvements.

### Next Sprint
- [ ] **Port Donal's multi-agent architecture** — Council model to envelopes agents.
- [ ] **Implement Paperclip's heartbeat** — add to loop.ts (L3 FADE scheduler).
- [ ] **Integrate agent-launch-toolkit** — add AgentLaunch export to agent-md.ts.

### Future Phases
- [ ] **Full Donal sync** — deploy 11 agents to ONE.
- [ ] **Agitrader evolution** — complete L5 prompt rewriting.
- [ ] **Fetchlaunchpad tokens** — enable agent tokenization.

---

## File Structure After Integration

```
envelopes/
├── docs/
│   ├── full-integration.md ← THIS FILE
│   ├── donal-sync-status.md
│   ├── ants-patterns-adopted.md
│   └── [existing docs]
├── src/
│   ├── engine/
│   │   ├── loop.ts ← Add L3.5 heartbeat (Paperclip pattern)
│   │   │          ← Add L5 evolution (Agitrader pattern)
│   │   ├── world.ts ← Add classifier functions (Kybernesis pattern)
│   │   ├── agent-md.ts ← Add AgentLaunch export
│   │   └── [existing]
│   ├── tools/
│   │   ├── intel/ ← Copy from Donal (generalized)
│   │   ├── scoring.ts ← Generalized relevance_scorer
│   │   └── [new utilities]
│   └── [existing]
├── agents/
│   ├── donal/ ← Sync Donal's 11 agents
│   ├── examples/
│   │   ├── lawyer-spec.md ← Copy from lawyer/
│   │   └── divorce-lawyer-spec.md
│   └── [existing]
├── workers/
│   ├── sync/ ← Add Paperclip-style heartbeat
│   └── [existing]
└── [existing]

Server/
├── envelopes/ ← Main project
├── ONE/ ← Reference (don't merge, use as dependency)
├── nanoclaw/ ← Keep for upstream reference
├── donal/ ← Active sync source
├── ants-at-work/ ← Reference implementation (archive after adopting patterns)
└── [others]
```

---

## Next Steps

1. **Pick one integration** from the "High Impact, Low Effort" list.
2. **Read the source code** thoroughly (understand, don't just copy).
3. **Create a branch** with `INTEGRATION_<name>` in the name.
4. **Port the pattern** (rewrite, don't copy-paste).
5. **Test thoroughly** — integration should be invisible to users (same API, better internals).
6. **Document what you did** in an integration report.
7. **Merge when confident** — use `/commit` skill to record what happened.

---

## Key Insights

✦ **ONE is the platform.** Envelopes is the engine. All other projects are reference implementations (ants, donal, paperclip) or deployment targets (agentverse, fetchlaunchpad, nanoclaw).

✦ **Pheromone semantics are universal.** Ants use it for trading. Donal's trust weights use it for routing. Envelopes uses it for signal flow. The math is the same; only the domain changes.

✦ **Evolution is deterministic.** Prompt rewriting (agitrader) + path weighting (ants) + agent routing (donal) are all the same learning pattern: observe outcomes, update weights, route accordingly.

✦ **Multi-model debate is not chaos.** Donal's Council model shows how to use different LLMs strategically (Claude for architecture, GPT-4o for business patterns, Perplexity for current data) without conflicting. The routing layer decides which model handles which decision type.

✦ **Scale is not a technology problem.** Donal's 11 agents, Ants' 520 patterns, ONE's 6 dimensions — none need new systems. They need better **routing** and **feedback loops**. That's pheromone.

---

**Last Updated:** 2026-04-13  
**Integration Stage:** Pre-merge (reference phase)  
**Status:** Ready for immediate adoption (scoring, rules, scheduler patterns)
