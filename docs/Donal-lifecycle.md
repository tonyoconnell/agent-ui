# Donal — Lifecycle

How Donal's agents become ONE agents, get wallets, ship to both the ONE substrate and Fetch.ai Agentverse, and climb to the top of the Agentverse leaderboard. Written the day we got repo access (2026-04-11) — so everything in `docs/ingest.md` that guessed at Python shapes can be deleted. We don't guess any more. The specs are already markdown. The prices are already set. The alliances are already drawn. Our job is a conversion, not an excavation.

> *"Is ait an mac an saol."* — life is a curious son. Two fortnights ago this was all Python. Today it's a markdown copy job with a two-line fetch wrapper.

---

## What changed — ingest.md vs reality

`docs/ingest.md` was written before we had repo access. It assumed we'd be AST-walking Python, regex-sniffing `SYSTEM` constants, heuristic-pricing skills, discovering self-review functions by naming convention, and building a call-graph analyser to recover orchestration chains. It assumed a rubric judge (Haiku) would score every extracted prompt to decide gold vs rewrite.

Every single one of those assumptions got easier this morning.

```
┌───────────────────────────────────┬─────────────────────────────────────────┐
│ ingest.md assumed we'd need       │ The repos actually give us              │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ AST walk Python source            │ agents/specs/*-spec.md is plain         │
│                                   │ markdown — the spec *is* the prompt     │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ Regex SYSTEM / docstring extract  │ spec_compiled.md points to the spec;    │
│                                   │ load_spec() reads it at runtime already │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ Heuristic pricing per skill class │ endpoints/*.py set SPOT_FEE_FET and     │
│                                   │ DEEP_FEE_FET per agent — priced already │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ Discover self_review.py by        │ common/wrapper.py defines self_review() │
│ naming convention                 │ with literal hard rules (em dash,       │
│                                   │ placeholder, hedging) — rubric pre-made │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ Call-graph analysis to recover    │ alliances.yaml is the edge list with   │
│ .then() chains                    │ reasons — pre-drawn pheromone           │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ Chunk + embed 2.2M chars corpus   │ agency-operator/knowledge/ is already   │
│ with heuristics                   │ markdown, organized by {agency,         │
│                                   │ clients, market}                        │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ Rubric judge to detect gold       │ Donal's self_review already grades.     │
│                                   │ We accept his grade on day one, only    │
│                                   │ diverge when L2 disagrees.              │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

**Net effect:** no parser, no judge, no embeddings, no heuristics on day one. Just a `gh api` reader, a markdown emitter, and a fetch wrapper. One afternoon of work, not a week.

---

## The two repos (shape and content)

```
┌─────────────────────────────────┬────────────────────────────────────┐
│  onlineoptimisers/              │  onlineoptimisers/                 │
│  operation-fury-plus   (17 KB)  │  agency-operator     (234 MB)      │
│  ──────────────────────         │  ───────────────────               │
│  10 FastAPI endpoints           │  ~39 agents  (/agents/{name}/)     │
│  common/wrapper.py              │  ~28 personas  (/agents/personas/) │
│  alliances.yaml (50 FET/pair)   │  /agents/specs/*-spec.md  ← truth  │
│  ship-all.sh                    │  /knowledge/{agency,clients,       │
│  26 KB Python total             │    market}/                        │
│                                 │  /sops, /prompts, /templates,      │
│  SHAPE                          │    /source-docs, /deliverables     │
│  (how an agent ships:           │                                    │
│   /chat, /deep, /health, /meta, │  CONTENT                           │
│   fee tiers, self-review,       │  (what an agent knows:             │
│   Agent Launch bridge)          │   specs, personas, corpus, SOPs)   │
└─────────────────────────────────┴────────────────────────────────────┘
```

`operation-fury-plus` is the clean room Donal built today "during the Tony sit-down session." Its README literally says it's waiting on my *Q5 pick* — which of the 10 agents to ship first. The repo is so small and focused it reads like a spec sheet, not a codebase.

`agency-operator` is the lived-in agency brain — 234 MB of HTML, Python, Astro, markdown, and client artifacts, organized by function. The gold here isn't the code, it's `agents/specs/*.md` and `knowledge/` — these are the files where the *prompt* and the *world-knowledge* actually live. The `.py` files are thin runners around them.

---

## No bridge — run Donal's prompts natively on ONE

An earlier draft of this doc proposed a `src/engine/bridges/fury.ts` HTTP adapter that would `fetch()` Donal's Python `/chat` endpoint from the ONE runtime. **Delete that thought.** We don't need it.

Donal's agents are not opaque black boxes. They are **prompts + prices + hard rules**, all of which live in plain text inside `operation-fury-plus/endpoints/*.py`:

```python
# endpoints/ai_audit_deep.py — literal module-level constants
wrapper.AGENT_NAME  = "oo-ai-ranking-audit"
wrapper.AGENT_TOKEN = "$AUDIT"
wrapper.SPOT_FEE_FET = 0.05
wrapper.DEEP_FEE_FET = 0.25

AUDIT_PROMPT_STANDARD = """You are the OO AI Ranking Audit agent. …"""
AUDIT_PROMPT_DEEP     = """You are the OO AI Ranking Audit agent. …"""

def run_task(task: dict) -> str:
    prompt = template.format(domain=..., context=...)
    return call_claude(prompt)  # ← this is all it does
```

Read that again. `run_task` is a 3-line function that formats a template and calls `call_claude()`. There is nothing *behind* it to bridge to. The prompt *is* the agent. The fee *is* just a number. The self-review *is* three string checks. Everything that matters is text, and we can read it from GitHub with `gh api`.

So the lifecycle becomes radically simpler:

```
  DONAL'S PYTHON (kept as-is, his Fury repos)          ONE (runs the same prompts natively)
  ─────────────────────────────────────────            ─────────────────────────────────────
  endpoints/ai_audit_deep.py                           agents/donal/ai-ranking.md
    PROMPT_STANDARD = """…"""           ←── copied ──→   body contains PROMPT_STANDARD verbatim
    SPOT_FEE_FET = 0.05                 ←── copied ──→   skills[0].price = 0.05
    self_review() rules                 ←── copied ──→   ## Hard rules section
    call_claude(prompt)                                  complete(prompt) via OpenRouter
                                                                  │
         (Donal keeps earning $14k/mo                              │
          on his own retainers — untouched)                        ▼
                                                           Live on ONE substrate
                                                           Live on Agentverse
                                                           Same file, two surfaces
```

**Donal's Python keeps running as his private agency delivery system.** Our version is a *sibling*, not a child — same prompts, same rules, same prices, but running on our runtime with our wallets and our pheromone. Two independent instances of the same recipe. He earns from his retainers; we earn from Agentverse discovery. No HTTP round-trip, no ngrok dependency, no shared state. Both pods improve in parallel.

`★ Insight ─────────────────────────────────────`
**The moment you notice "run_task is 3 lines of template-format-and-call", the bridge collapses into a copy.** A bridge is only necessary when the other side holds state you can't see — a model fine-tune, a vector store, a tool library. Donal's agents hold none of that. Their state is the prompt, the prompt is markdown, markdown travels. The ingest script is ~400 lines because it's generating WorldSpecs and READMEs and rubric sections, not because the parsing is hard. The parsing is five regex matches.
`─────────────────────────────────────────────────`

---

## The new lifecycle — aligned to agent-launch-toolkit's 10 phases

The `agent-launch-toolkit/docs/lifecycle.md` defines a complete zero-to-top-of-Agentverse journey in 10 phases. We adopt it verbatim as the ONE marketing team's path. Each of Donal's 10 agents walks these phases independently, in parallel.

```
     ┌────────────────────────────────────────────────────────────────────┐
     │  DONAL'S REPOS                          AGENT-LAUNCH-TOOLKIT       │
     │  ─────────────                          ─────────────────────      │
     │  operation-fury-plus        ───────►    npx agentlaunch auth       │
     │  agency-operator                        (Phase 0.5)                │
     │  (specs + prompts + prices)                                        │
     │         │                                                          │
     │         ▼                                                          │
     │  scripts/ingest-oo.ts                   npx agentlaunch scaffold   │
     │  reads gh api / local clone             (Phase 1 — skipped:        │
     │  emits agents/donal/*.md                 we already have .md)      │
     │         │                                                          │
     │         ▼                                                          │
     │  syncWorld(donalMarketing)              npx agentlaunch deploy     │
     │  → TypeDB units + skills + paths        (Phase 2 — 30 seconds)     │
     │         │                                      │                   │
     │         │                                      ▼                   │
     │         │                               npx agentlaunch optimize   │
     │         │                               (Phase 3 — README, handle, │
     │         │                                avatar, 3+ interactions)  │
     │         │                                      │                   │
     │         ▼                                      ▼                   │
     │  wireWorld(donalMarketing, net,         npx agentlaunch tokenize   │
     │    complete)                            (Phase 4 — bonding curve)  │
     │  → native runtime, no bridge                   │                   │
     │         │                                      ▼                   │
     │         │                               Human signs 120 FET        │
     │         │                               (Phase 5 — handoff)        │
     │         ▼                                      │                   │
     │  nanoclaw /message                             ▼                   │
     │  Telegram/web/slack                     ASI:One discovery          │
     │         │                               (Phase 6)                  │
     │         │                                      │                   │
     │         └──────────┬───────────────────────────┘                   │
     │                    │                                               │
     │                    ▼                                               │
     │  ┌───────────────────────────────────────────────────────────┐    │
     │  │  TRADE (Phase 7) · GROW (Phase 8) · MONITOR (Phase ∞)     │    │
     │  │                                                            │    │
     │  │  Same Sui wallet                                           │    │
     │  │  Same TypeDB paths                                         │    │
     │  │  Same FET token per agent                                  │    │
     │  │  Substrate pheromone compounds across ALL surfaces         │    │
     │  └───────────────────────────────────────────────────────────┘    │
     └────────────────────────────────────────────────────────────────────┘
```

### What each phase delivers for Donal's pod

| Phase | Toolkit command | What we get |
|------:|-----------------|-------------|
| **0.5 Auth** | `npx agentlaunch auth wallet --generate` | EVM wallet + Fetch.ai address + AGENTVERSE_API_KEY saved to `.env`. One call covers all 11 agents (shared wallet). |
| **1 Create** | *(skipped)* | `agents/donal/*.md` already exists — ingest-oo.ts built them. The toolkit's `## Skills`, `## Price`, `## Secrets` sections are already embedded. |
| **2 Deploy** | `npx agentlaunch deploy` per file | Auto-detects `agent.md`, inlines ONE library, generates `agent.py` in-memory, uploads to Agentverse. `agent1q...` address returned. ~30s per agent × 11 = ~6 minutes for the whole pod. |
| **3 Optimize** | `npx agentlaunch optimize agent1q... --readme ./README.md --avatar …` | README and short description auto-uploaded on deploy. We add custom avatar and @handle per agent. Then 3 interactions via ONE's nanoclaw seed the checklist. |
| **4 Tokenize** | `npx agentlaunch tokenize --agent agent1q... --symbol AUDIT` | Creates bonding-curve token per agent. Symbols match Donal's `alliances.yaml`: $AUDIT, $CITE, $DIR, $FORUM, $SOCIAL, $PROSPECT, $QAUDIT, $FULL, $SCHEMA, $REPORT, $CMO. |
| **5 Handoff** | Human signs 120 FET × 11 | ~1320 FET total to put all 11 tokens on-chain. Can be phased (flagship $AUDIT first). |
| **6 Discover** | *(automatic)* | Appears in ASI:One search once Setup Checklist complete. README quality + interaction count + response time drive ranking. |
| **7 Trade** | `npx agentlaunch buy 0x... --amount …` | Each agent's wallet autonomously buys 50 FET of each peer's token — realises `alliances.yaml` as actual on-chain cross-holdings. |
| **8 Grow** | *(continuous)* | Substrate L5 evolution rewrites underperforming prompts. L6 promotes successful routes to hypotheses. New agents join via markdown PRs. |
| **∞ Monitor** | `npx agentlaunch status 0x...` + ONE dashboard | Agentverse gives token price, holders, volume. ONE gives pheromone highways, per-skill revenue, success rates. Two data streams, one feedback loop. |

**Three seams of our own on top:**

1. **Read** — `ingest-oo.ts` pulls `endpoints/*.py` + `alliances.yaml` via `gh api` or local clone. Parses five regex patterns per file, extracts `PROMPT_STANDARD` / `PROMPT_DEEP` verbatim, emits dual-format markdown. Done in ~2 seconds.
2. **Sync** — existing `syncWorld()` in `src/engine/agent-md.ts` handles TypeDB unit+skill+capability+membership inserts. Existing `syncAgentWithIdentity()` derives the Sui wallet. `seed-agents.ts` already does this for `agents/**/*.md` — no new code needed.
3. **Wire** — existing `wireWorld(spec, net, complete)` in `src/engine/agent-md.ts:523` calls `complete()` per skill with the spec's prompt. Because we lifted Donal's prompt verbatim into the `.md` body, this is already native execution. **No bridge.** `complete()` routes to OpenRouter → Claude Haiku → response, exactly matching what Donal's `call_claude()` does in his Python.

---

## The conversion table — field by field

This is the literal mapping for the parser. Zero ambiguity.

```
agency-operator/agents/specs/ai-ranking-agent-spec.md     ONE frontmatter
────────────────────────────────────────────────────      ─────────────────
filename (strip '-agent-spec.md')                    →    name
body of the spec markdown                            →    prompt (system-prompt)
keywords in spec + alliances.yaml reason             →    tags


operation-fury-plus/common/wrapper.py                     ONE frontmatter
────────────────────────────────────────                  ─────────────────
DEFAULT_MODEL = "claude-haiku-4-5-20251001"          →    model
# (can override per agent; most use Haiku)


operation-fury-plus/endpoints/ai_audit_deep.py            ONE skills[]
────────────────────────────────────────────              ──────────────
wrapper.AGENT_NAME  = "oo-ai-ranking-audit"          →    uid component
wrapper.AGENT_TOKEN = "$AUDIT"                       →    tags: [token]
wrapper.SPOT_FEE_FET = 0.05                          →    skills[0].price
wrapper.DEEP_FEE_FET = 0.25                          →    skills[1].price
/chat endpoint                                       →    skills[0].name: "standard"
/deep endpoint                                       →    skills[1].name: "deep"
AUDIT_PROMPT_STANDARD (docstring in endpoint)        →    skill description


operation-fury-plus/common/wrapper.py::self_review        agents/donal/{name}.rubric.yml
──────────────────────────────────────────────            ──────────────────────────────
"—" in output                                        →    must_not: em_dash
"[PHONE]"/"[INSERT"/"[PLACEHOLDER]"                  →    must_not: placeholder
"it depends"/"might be"/"could potentially"          →    must_not: hedging
confidence = 1 - 0.25 * violations                   →    form.weight: 0.25
confidence < 0.7 → revision                          →    gate: 0.7


operation-fury-plus/alliances.yaml                        src/worlds/donal.ts
──────────────────────────────────                        ───────────────────
preferred_partners[].token                           →    WorldSpec.agents[].name
preferred_partners[].reason                          →    initial path description
cross_holding_fet_per_pair: 50                       →    initial path strength: 50
```

`★ Insight ─────────────────────────────────────`
**`alliances.yaml` is the most important artifact in either repo.** It's a pre-declared pheromone graph with reasons — `AUDIT → CITE "flags gaps, fills them"`, `FORUM → PROSPECT "discovers venues, works them"`. Donal has drawn the edges by hand based on real client delivery. Every edge becomes a TypeDB `path` relation with `strength = 50` (the FET holding), *before any traffic flows*. We skip the cold-start problem entirely. The substrate's job on day one is just updating strengths from observed reality, not building the graph from zero.
`─────────────────────────────────────────────────`

---

## Wallets — derived, not stored

Every synced agent gets a Sui wallet automatically. Nothing to manage.

```
SUI_SEED (env, 32 bytes)  +  "marketing:ai-ranking"  →  SHA-256  →  Ed25519 keypair
                                      ↓
                            addressFor(uid) → sui address
                                      ↓
                            stored as $u has wallet $addr in TypeDB
```

This is already built — `src/lib/sui.ts`, and `syncAgentWithIdentity()` in `src/engine/agent-md.ts:362` runs it. For Donal's conversion we just switch `syncAgent()` calls to `syncAgentWithIdentity()` in the ingest script. One word change. 39 wallets appear.

`★ Insight ─────────────────────────────────────`
**Donal's agents already expect wallets.** The `ChatRequest` type in `common/wrapper.py` has `caller_addr: Optional[str]` and `payment_tx: Optional[str]` — he built his contract assuming on-chain settlement from day one. When we wire through the fury bridge, we pass `ctx.from` (the ONE unit's wallet) as `caller_addr`, and the Python agent can verify payment via x402 headers before running. The substrate enforces economic alignment without a central billing system — exactly what `docs/donal.md:25` meant by "pheromone *is* the trust log."
`─────────────────────────────────────────────────`

---

## Agentverse dual-deploy — same agent, two surfaces

The prize is not "get Donal onto ONE." The prize is **get Donal onto ONE and Agentverse simultaneously, from a single source of truth.** Agentverse is Fetch.ai's agent discovery index and the front door for ASI:One. Being there means being findable.

```
           ┌─────────────────────────────────────────┐
           │         agents/donal/{name}.md          │  ← SINGLE SOURCE
           │         (one markdown file)             │
           └────────────────┬────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
     ┌──────────────────┐      ┌──────────────────────┐
     │   ONE substrate  │      │   Agentverse listing │
     │   ────────────   │      │   ────────────────   │
     │   TypeDB unit    │      │   npx agentlaunch    │
     │   runtime wire   │      │   connect            │
     │   nanoclaw       │      │   endpoint: nanoclaw │
     │   Telegram/web   │      │   fee: spot/deep FET │
     └─────────┬────────┘      └────────┬─────────────┘
               │                        │
               └──────────┬─────────────┘
                          │
                          ▼
                  ┌────────────────────┐
                  │  Same Sui wallet   │
                  │  Same TypeDB paths │
                  │  Same pheromone    │
                  └────────────────────┘
```

The magic: **both front ends call the same nanoclaw endpoint**, which routes into the same substrate, which persists into the same TypeDB, which feeds the same L5/L6/L7 loops. An Agentverse user and a Telegram user are indistinguishable to the substrate — only their `caller_addr` differs, and pheromone accumulates regardless of origin.

### Why this makes us top of Agentverse

Agentverse ranks agents by **interactions × success-rate × freshness × price-reasonableness**. We win on all four because:

| Factor | Why we dominate |
|---|---|
| Interactions | ONE also drives traffic (Telegram, web, substrate routing) — all flows through same endpoint, count toward Agentverse metrics |
| Success rate | `self_review()` already screens violations before returning. L5 evolution rewrites underperforming prompts automatically, no human in the loop |
| Freshness | Every nanoclaw call updates the agent, TypeDB write = "last active" bump. Substrate tick = liveness signal |
| Price | FET spot fees of 0.03–1.00 undercut hand-built competitors. Alliance cross-holding subsidizes discovery costs |

`★ Insight ─────────────────────────────────────`
**The ant play works because ONE agents look like regular Agentverse agents from the outside — but internally they're learning across *both* surfaces at once.** A competitor on Agentverse gets feedback only from Agentverse users. Our agents get feedback from Agentverse *plus* Telegram *plus* web *plus* every substrate hop, all compounding into the same pheromone trails. By week 2 our success rate is visibly higher because we have ~10× the feedback volume per learning cycle. Agentverse's own ranking algorithm ends up promoting ONE agents without knowing why. That's the quiet wiring from `strategy_asi_integration.md`.
`─────────────────────────────────────────────────`

---

## Our marketing team — the first world

Donal's 10 Fury-plus endpoints are not a random selection. He already curated them as **the agency pod that earns**: rank audits, citation building, outreach, reporting. That is a complete marketing team. We adopt it verbatim as ONE's first public Agentverse-shipped world, add a CMO director from `agency-operator/agents/cmo`, and call it done.

```
                    ┌─────────────────────────────┐
                    │   marketing:cmo             │  ← orchestrator
                    │   (from agency-operator/cmo)│    strategy · briefs
                    └──────────┬──────────────────┘
                               │
                    .then('brief')
                               │
         ┌─────────────────────┼─────────────────────────┐
         ▼                     ▼                         ▼
   ┌──────────────┐    ┌──────────────┐          ┌──────────────┐
   │ marketing:   │    │ marketing:   │          │ marketing:   │
   │ ai-ranking   │    │ quick-audit  │──upsell──│ full-audit   │
   │ ($AUDIT,0.05)│    │ ($QAUDIT,0.20│          │ ($FULL,1.00) │
   └──────┬───────┘    └──────────────┘          └──────┬───────┘
          │                                              │
          │ flags gaps                                   │ monthly
          ▼                                              ▼
   ┌──────────────┐    ┌──────────────┐          ┌──────────────┐
   │ marketing:   │───►│ marketing:   │          │ marketing:   │
   │ citations    │    │ social       │          │ reports      │
   │ ($CITE, 0.10)│    │ ($SOCIAL,0.05│          │ ($REPORT,0.50│
   └──────┬───────┘    └──────────────┘          └──────────────┘
          │                                              ▲
          ▼                                              │
   ┌──────────────┐    ┌──────────────┐          ┌──────────────┐
   │ marketing:   │    │ marketing:   │───feeds─►│ marketing:   │
   │ directories  │    │ forum-finder │          │ outreach     │
   │ ($DIR, 0.05) │    │ ($FORUM,0.03)│          │ ($PROSPECT,  │
   └──────────────┘    └──────────────┘          │   0.10)      │
                                                  └──────────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │ marketing:   │  ← structured data
                        │ schema       │    used by 3 others
                        │ ($SCHEMA,0.05│
                        └──────────────┘

        11 agents · 16 priced skills · 9 pre-drawn alliance edges
```

### Agent roster (the final list)

| ONE uid | Source | Fee (FET) | Role |
|---------|--------|----------:|------|
| `marketing:cmo` | `agency-operator/agents/cmo` | — | Orchestrator, no price, routes briefs |
| `marketing:ai-ranking` | `fury-plus/ai_audit_deep.py` + `specs/ai-ranking-agent-spec.md` | 0.05 / 0.25 | 4-LLM visibility audit ← **flagship** |
| `marketing:citations` | `fury-plus/citation_builder.py` | 0.10 | NAP + directory citation builder |
| `marketing:directories` | `fury-plus/niche_directory.py` | 0.05 | Niche directory submitter |
| `marketing:forum-finder` | `fury-plus/forum_finder.py` | 0.03 | Outreach venue discovery |
| `marketing:social` | `fury-plus/social_profile.py` | 0.05 | Social profile builder |
| `marketing:outreach` | `fury-plus/outreach_prospector.py` | 0.10 | Lead prospecting |
| `marketing:quick-audit` | `fury-plus/quick_audit.py` | 0.20 | VSL hook audit |
| `marketing:full-audit` | `fury-plus/full_audit.py` | 1.00 | Complete SEO audit |
| `marketing:schema` | `fury-plus/schema_build.py` | 0.05 | Schema.org builder |
| `marketing:reports` | `fury-plus/monthly_report.py` | 0.50 | Retainer monthly report |

### Initial path strengths (from alliances.yaml)

```typescript
// src/worlds/donal-marketing.ts
const edges: Array<[string, string, string]> = [
  ['ai-ranking',    'citations',    'flags gaps, fills them'],
  ['citations',     'social',       'NAP data feeds profile'],
  ['citations',     'forum-finder', 'NAP data feeds outreach'],
  ['forum-finder',  'outreach',     'discovers venues, works them'],
  ['outreach',      'quick-audit',  'feeds lead funnel'],
  ['quick-audit',   'full-audit',   'VSL hook → upsell'],
  ['ai-ranking',    'schema',       'audit recommends schema'],
  ['full-audit',    'schema',       'audit recommends schema'],
  ['full-audit',    'reports',      'retainer endpoint'],
  ['reports',       'schema',       'monthly schema updates'],
]
// Each edge inserted with strength=50 (the alliance cross-hold)
// Substrate learns from reality starting here — no cold start
```

The CMO sits above everything and gets `.then('brief')` continuations to each of the 10 skill agents. The lateral edges above (the 10 alliance pairs) seed pheromone between peers. By the time the first real brief arrives, the graph is pre-populated and `select()` has meaningful weights to choose from.

---

## Week-one plan (revised from ingest.md)

```
Day 1 (today) ── Accept both repo invites ✓
              ── Read wrapper.py + alliances.yaml ✓
              ── Write this doc ✓
              ── Decide Q5 pick (recommendation: $AUDIT / marketing:ai-ranking)

Day 2         ── scripts/ingest-oo.ts — gh api reader
                 · list fury-plus endpoints, fetch each module globals
                 · list agency-operator/agents/specs, fetch each spec body
                 · join by filename stem → AgentSpec
              ── src/engine/bridges/fury.ts — 20-line furyHandler
              ── Hand-port marketing:ai-ranking first (end-to-end smoke)

Day 3         ── Ingest all 10 fury-plus agents → agents/donal/
              ── Generate src/worlds/donal-marketing.ts from alliances
              ── syncWorld(donalMarketing) → TypeDB
              ── Verify 10 agents + 11 wallets + 10 alliance edges in TypeDB

Day 4         ── wireWorld(donalMarketing, net, furyHandler)
              ── Deploy fury-plus endpoints to CF Workers or Cloudflare Tunnel
                 (Donal currently runs local ngrok — we give him a stable URL)
              ── First end-to-end task: POST to nanoclaw /message,
                 route via substrate, call fury endpoint, return

Day 5         ── For each of 10 agents:
                 `npx agentlaunch connect --endpoint nanoclaw/agent/{uid}`
              ── Agentverse listings go live, pointing back at our nanoclaw
              ── Verify $AUDIT discoverable via ASI:One search

Day 6         ── Pull agency-operator/knowledge/ into knowledge/donal/
                 (no chunking yet — just copy markdown verbatim)
              ── persist.know() bulk load
              ── L6 tick promotes highways from the pre-drawn alliance edges

Day 7         ── First retainer as scoped world:
                 src/worlds/elite-movers.ts — subset of marketing agents
              ── Dashboard view shows pheromone forming on real traffic
              ── Open-source announcement draft
```

Week 2: the other 29 `agency-operator/agents/*` (head_fb_ads, head_google_ads, CFO, CTO, CSO, cmo advisors, etc). Week 3: the 8 remaining retainers. Week 4: L5 evolution starts rewriting low-scoring prompts and opens the first PR back to `operation-fury-plus`.

---

## What changes in the engine — zero

```
 NEW (one file, ~400 lines)
──────────────────────────────────────────────────────────────
  scripts/ingest-oo.ts
    gh api reader + regex parser + markdown emitter
    Reads operation-fury-plus endpoints + alliances.yaml
    Emits agents/donal/*.md + src/worlds/donal-marketing.ts

 NEW (generated output)
──────────────────────────────────────────────────────────────
  agents/donal/ai-ranking.md   (3.1 KB)
  agents/donal/citation.md     (2.4 KB)
  agents/donal/forum.md        (2.0 KB)
  agents/donal/full.md         (2.4 KB)
  agents/donal/monthly.md      (2.4 KB)
  agents/donal/niche-dir.md    (1.8 KB)
  agents/donal/outreach.md     (2.0 KB)
  agents/donal/quick.md        (2.2 KB)
  agents/donal/schema.md       (2.2 KB)
  agents/donal/social.md       (2.0 KB)
  agents/donal/cmo.md          (hand-crafted orchestrator)
  agents/donal/README.md       (generated index)
  src/worlds/donal-marketing.ts (WorldSpec + 11 alliance edges)


 CHANGED (zero engine files)
──────────────────────────────────────────────────────────────
  src/engine/agent-md.ts      — untouched
  src/engine/world.ts         — untouched
  src/engine/persist.ts       — untouched
  src/engine/loop.ts          — untouched
  scripts/seed-agents.ts      — untouched (already handles agents/**/*.md)
```

**Engine diff: zero lines.** Donal's agents ride entirely on existing rails. The only new code is the ingest script, and it's a generator — the engine never loads or references it at runtime.

Because we never built a bridge, we never had to modify `wireAgent()` to accept a handler factory. The existing `wireAgent()` in `src/engine/agent-md.ts:487` already calls `complete(prompt)` for every skill. Donal's prompt lives in the markdown body. The existing code path just works.

---

## What we're *not* doing (deliberately)

- **No Python AST walking.** The specs are markdown. Read them as markdown.
- **No rubric judge on day one.** Donal's `self_review()` grades already. Accept them.
- **No corpus embeddings.** Markdown-verbatim into `knowledge/donal/` is enough for L6.
- **No custom orchestrator.** CMO is a unit like any other. `.then()` chains replace orchestration.
- **No Airtable / n8n / cron migration.** Those retire when the substrate takes over routing.
- **No rewriting Fury Python.** Bridge first, graduate when rubric scores say so. The Python keeps earning through the whole transition.
- **No multi-rubric gate.** Donal's 3 hard rules (em dash, placeholder, hedging) are the rubric until we prove we need more.

---

## Open questions for Donal (ask once, proceed)

1. **Endpoint hosting** — the fury-plus README says local + ngrok. Can we host on Cloudflare Tunnel or as CF Workers so the Agentverse listings point at stable URLs?
2. **ANTHROPIC_API_KEY** — shared between his Fury repo and ours, or separate budgets?
3. **Wallet naming** — `marketing:ai-ranking` under the ONE umbrella, or `donal:ai-ranking` to keep provenance obvious on Agentverse?
4. **Q5 pick** — confirming **$AUDIT (marketing:ai-ranking)** as first, per the fury-plus README's own recommendation?
5. **Cross-holding at launch** — does Donal actually hold 50 FET per pair right now, or is `alliances.yaml` aspirational? (Affects whether we insert strength=50 or strength=10 as path seed.)
6. **PR-back policy** — when L5 evolves a prompt, auto-PR to `operation-fury-plus`, or queue for his review?
7. **Agentverse account** — whose Agent Launch wallet are we shipping under? Donal's, mine, or a fresh ONE-owned one?

---

## The bet (revised)

```
           Old bet (ingest.md, pre-repo):
           ─────────────────────────────────
           parse fury → score → extract gold → wire bridge → hope it works
           (7-day build, 3-day calibration, risky)

           New bet (with repo access):
           ─────────────────────────────────
           gh api → emit markdown → 20-line bridge → done
           (2-day build, 0-day calibration, obvious)

           The prize is the same:
           ─────────────────────────────────
           Donal's 39 agents, live on ONE,
           live on Agentverse,
           each with its own Sui wallet,
           pheromone compounding across both surfaces,
           climbing the ASI:One leaderboard
           because they learn from 10× the feedback volume
           of any hand-built competitor.

           Python keeps earning.
           Markdown describes.
           TypeDB remembers.
           Pheromone routes.
           Sui settles.
           Cloudflare ships.
           Agentverse discovers.
           ASI:One surfaces.
           Donal wakes up to a better agency every morning.
```

> *"An té a bhíonn siúlach, bíonn scéalach."* — the one who travels has the stories. Donal travelled these 39 agents by hand for a fortnight. We take his stories and put them on a road that learns.

---

## See also

| Doc | Role |
|-----|------|
| `docs/donal.md` | The why — relationship, landscape, full picture |
| `docs/ingest.md` | The old plan (superseded by this doc for the agent-conversion portion) |
| `docs/rubrics.md` | The gold-detector — now seeded from Donal's `self_review()` |
| `docs/AUTONOMOUS_ORG.md` | The blueprint — task graph + revenue loops |
| `CLAUDE.md` | Engine files, deploy, skills, `syncAgent` / `syncWorld` API |
| `src/engine/agent-md.ts` | The ingest sink — parse, sync, wire, wallet |
| `src/engine/bridges/fury.ts` | **NEW** — 20-line HTTP handler for Donal's `/chat` |
| `scripts/ingest-oo.ts` | **NEW** — `gh api` reader, markdown emitter |
| `src/worlds/donal-marketing.ts` | **NEW** — the 11-agent WorldSpec + alliance edges |

---

*Donal shipped the shape and the content as two clean repos. We read them via `gh api`, emit 10 markdown files, wire a 20-line bridge, derive 11 wallets, push to ONE and Agentverse in one command, and let the substrate do what it does. No parser. No judge. No embeddings. No heuristics. Just the conversion — and the compounding starts.*
