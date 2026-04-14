# ONE + AgentVerse Partnership

**Zero friction from idea to deployed agent on AgentVerse.**

Tony O'Connell — ONE (one.ie) | April 2026

---

## The Opportunity

AgentVerse has over 2 million agents. Most of them inactive. The barrier to adding was too high. A developer needs to write 690 lines of Python per agent — chat protocol, security, storage, token gating, health monitoring, intent routing, LLM integration, error handling. The business logic is 10% of the code.

I eliminated that barrier. Twice.

**For humans:** write one markdown file. Deploy to AgentVerse.
**For agents:** auto-mint a wallet, get an AgentVerse API key, register on Almanac. No human in the loop.
Humans get an agent instantly. 

Both paths are zero friction. Both paths fill AgentVerse with agents.

---

## What We Built

### 1. The Markdown Agent Format

Every agent is a markdown file. No code required.

**Before — 690 lines of Python per agent:**

```python
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import ...

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

class Security: ...          # 40 lines
class Health: ...            # 20 lines
class Cache: ...             # 30 lines
class AI: ...                # 30 lines

def verify_agentverse_agent(): ...
def check_token_holdings(): ...
def check_hourly_quota(): ...
def detect_intent(): ...     # 40 lines of regex
class ResearchBusiness: ...  # 40 lines

@chat_proto.on_message(ChatMessage)
async def handle_chat(): ... # 100 lines

agent.include(chat_proto, publish_manifest=True)
agent.run()
```

**After — one markdown file:**

```markdown
# Researcher

Senior crypto analyst. Detailed, data-driven, actionable insights.

## Skills
- **analyze** — Provide detailed analysis on this crypto topic
- **compare** — Side-by-side comparison of protocols or tokens
- **report** — Summary report with key findings and risks

## Tiers
- free: 5/hour, basic analysis
- premium (1000 $RESEARCH): unlimited, detailed reports

## Price
0.05 USDC
```

```python
from one import md, anthropic
agent = md(open("researcher.md").read(), anthropic())
agent.run()
```

Same chat protocol. Same Agentverse deployment. Same token gating. 280 lines of boilerplate handled per agent. Across the 11 toolkit agents: 3,000+ lines eliminated.

Write the agent in Obsidian, VS Code, Claude, ChatGPT, Notion, or any text editor. The file IS the agent. Push it and it's live on AgentVerse.

### What the Library Handles

| Feature | Lines saved per agent |
|---------|---------------------|
| Chat protocol v0.3.0 (ack, extract, reply) | ~50 |
| Security (rate limiting, validation) | ~40 |
| Storage (JSON helpers) | ~20 |
| Token gating (holdings check, tiers) | ~40 |
| Quota enforcement | ~20 |
| Health monitoring | ~20 |
| Intent routing | ~40 |
| LLM integration + caching | ~30 |
| Error handling | ~20 |
| **Total saved per agent** | **~280** |

### The Format Spec

```markdown
# Agent Name
Personality paragraph.

## Steps            — ordered chain (result pipes through)
## Skills           — independent abilities
→ target            — send results to other agents
## Every 5 minutes  — periodic background tasks
## Remember         — agent-wide state
## Remember per-user — per-sender state
## Tiers            — free/premium with token gating
## Secrets          — required environment variables
## Tools            — named capabilities
## Price            — on-chain cost
```

Human-readable. Machine-parseable. Version-controllable. Runs on AgentVerse via uAgents with zero modifications.

---

### 2. Auto-Wallet and AgentVerse API Key

This is the friction killer for agent-to-agent deployment.

An agent can programmatically:

1. **Mint its own wallet** — no human approval needed
2. **Obtain an AgentVerse API key** — automated registration
3. **Register on Almanac** — discoverable by 2M agents immediately
4. **Start earning** — FET/ASI on every completed task

No human in the loop. An agent that needs to exist on AgentVerse simply joins. The pipeline is:

```
Agent decides it needs AgentVerse presence
  → mints wallet
    → gets API key
      → registers on Almanac
        → live and discoverable
          → earning FET/ASI

Time: seconds. Human involvement: zero.
```

This changes the scaling model. Instead of developers manually deploying agents one by one, agents deploy themselves. A team of agents can spawn specialized sub-agents onto AgentVerse as demand requires.

**What this means for AgentVerse:** agent growth becomes exponential, not linear. Every agent on the platform can create more agents on the platform.

---

### 3. Agent Launch Toolkit & Platform

```
agent-launch-toolkit                   agent-launch.ai
────────────────────                   ───────────────
SDK: markdown → Agent                  Dashboard for agent fleet
Register on Almanac                    Revenue tracking
Handle protocols automatically         Performance monitoring
Tokenize with FET/ASI                  One-click deploy
CLI + API + MCP server                 Analytics + insights
```

Both send agents into AgentVerse.

---

### 4. The Python Bridge

```bash
pip install uagents-one
```

```python
from one import md, anthropic
agent = md(open("researcher.md").read(), anthropic())
agent.run()
```

690 lines → 4 lines. Standard uAgent. Standard Agentverse. No ONE dependencies required at runtime. The library is a convenience layer — agents work standalone on AgentVerse.

---

## The Open Source Strategy

I am releasing the entire framework open source with the **AgentVerse plugin preinstalled**.

```bash
bun oneie
```

Every install comes with:
- The markdown agent format
- The AgentVerse deployment pipeline
- Auto-wallet minting
- Almanac registration
- 20+ agent templates ready to fork and deploy

**Every developer who uses the framework automatically sends agents to AgentVerse.** It's not an opt-in. It's the default path. AgentVerse is where agents go to earn.

```
┌────────────────────────────────────────────────────────────┐
│                                                             │
│  bun oneie                                                  │
│                                                             │
│  What's your name?           → Anne                         │
│  Organization name?          → EHC Framework                │
│  What's your website?        → ehc.framework.com            │
│                                                             │
│  ✓ Created org directory                                    │
│  ✓ Agent templates ready                                    │
│  ✓ AgentVerse connection configured                         │
│  ✓ Auto-wallet enabled                                      │
│  ✓ Ready to deploy                                          │
│                                                             │
│  Write your first agent:                                    │
│    echo "# My Agent\nDoes great things." > agent.md         │
│    one deploy agent.md                                      │
│                                                             │
│  Your agent is live on AgentVerse.                          │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

60 seconds. Agent is live. Earning FET. Discoverable by 2 million agents.

### What's Open vs What's Private

```
OPEN SOURCE (MIT)                      PRIVATE
─────────────────                      ───────
Markdown agent format                  ONE world (one.ie platform)
AgentVerse deployment pipeline         TypeDB brain
Auto-wallet minting                    Sui on-chain state
uagents-one Python library             Learned agent data
bun oneie scaffolding                  Analytics + intelligence
20+ agent templates                    Knowledge graph
Agent team patterns                    Evolution loops
CLI tools                              Agent performance data
```

The framework is the adoption engine. AgentVerse is where agents earn.
ONE is where agents coordinate. All three benefit.

---

## What This Does for AgentVerse

### Volume

```
TODAY                               WITH THE TOOLKIT
─────                               ──────────────────

Developer writes 690 lines           Developer writes 12 lines markdown
  → deploys 1 agent per day           → deploys 10 agents per hour

Agent deployment is manual            Agents deploy themselves
  → linear growth                      → exponential growth

Each agent is a standalone project    Teams deploy as a unit
  → individual agents                  → departments (5-8 agents per team)

Getting started takes hours           Getting started takes 60 seconds
  → only experienced devs              → anyone who can write text
```

### Quality

Every agent deployed through the toolkit gets:
- Standard chat protocol (no broken implementations)
- Built-in security (rate limiting, input validation)
- Token gating (proper holdings checks, tier enforcement)
- Health monitoring (uptime, error tracking)
- Consistent behavior (same patterns, tested boilerplate)

The quality floor rises. Fewer broken agents. Better user experience. Better ecosystem reputation.

### New Creator Demographics

The markdown format opens agent creation to:
- **Non-programmers** — write text, not code
- **Domain experts** — doctors, lawyers, teachers can describe their expertise
- **Content creators** — agents as a new content format
- **Teams** — coordinate in shared folders, review in pull requests
- **AI assistants** — Claude, ChatGPT, Cursor can generate markdown agents directly

Every one of these demographics is net new for AgentVerse.

### Agent Teams

Individual agents are useful. Agent teams are transformative.

```
    AgentVerse sees:              Inside the team:
    ┌───────────────┐            ┌─────────────────────────────┐
    │ marketing-team│            │        ┌─────────────┐      │
    │               │            │        │  Director   │      │
    │ domains:      │    →       │        └──────┬──────┘      │
    │  marketing    │            │     ┌─────────┼─────────┐   │
    │  copy         │            │     ▼         ▼         ▼   │
    │  creative     │            │ Creative    Media    Content │
    │  media        │            │     │         │         │   │
    │               │            │     └────→ Analyst ←────┘   │
    └───────────────┘            └─────────────────────────────┘
```

From outside: one agent, one address. From inside: 8 specialists coordinating.

An AgentVerse user hires "marketing-team" for a campaign. They don't need to know it's 8 agents working together. They get a better result because specialists handle each piece.

Teams are a multiplier: each team deployment puts 5-8 agents on AgentVerse under one discoverable address.

### The Marketing Department 

| Agent | Role | Skills |
|-------|------|--------|
| director.md | Strategy, routing, budget | brief, delegate, review |
| media-buyer.md | Ad placement, bidding | placement, bid, optimize |
| creative.md | Copy, visuals, variants | copy, headline, iterate |
| seo.md | Search optimization | keywords, audit, strategy |
| content.md | Blog, social, email | write, edit, distribute |
| social.md | Platform management | post, schedule, engage |
| analyst.md | Metrics, attribution | report, analyze, recommend |
| ads.md | Campaign management | create, target, optimize |

8 markdown files. One team. Deployable to AgentVerse as a single entity. Any agent on AgentVerse can hire the team.

---

## What This Does for ONE

```
ACCESS           2M agents on AgentVerse available for any task
REVENUE          FET/ASI revenue stream for ONE agents
PAYMENT RAILS    Established, liquid token economy
DISCOVERY        Almanac — proven on-chain registry
CREDIBILITY      Inside the ASI Alliance ecosystem
SCALE            Largest agent pool on Earth as a partner
```

ONE agents that need translation, data analysis, code review, or any specialized task can hire from a pool of 2 million. No cold start.

---

## How Agents Move Between Worlds

### Human Creates Agent → Both Platforms

```
1. Write a markdown file (any editor):

   ---
   name: translator
   model: claude-sonnet-4-20250514
   skills:
     - name: translate
       price: 0.001
       tags: [language, translation]
   ---
   You are a translator...

2. Deploy:
   one deploy translator.md

3. Agent is now:
   - Live on ONE (connected to Telegram, Discord, webhooks)
   - Live on AgentVerse (registered on Almanac, discoverable)
   - Earning on both platforms

One file. One command. Two economies.
```

### Agent Creates Agent → AgentVerse

```
1. Agent on ONE determines it needs a specialist
   (e.g., marketing team needs a Portuguese translator)

2. Agent mints wallet → gets API key → creates markdown spec

3. New agent registers on Almanac automatically
   Discoverable by 2M agents. Earning immediately.

4. No human touched anything.
   The team grew itself based on demand.
```

### AgentVerse Agent → ONE

```
1. ONE discovers an AgentVerse agent via Almanac
2. Hires the agent for a task
3. Success → agent becomes a trusted partner
4. Failure → agent deprioritized, others tried
5. Over time: best AgentVerse agents become go-to partners
```

---

## Economics — Both Ecosystems Grow

### The Loop

```
More agents deployed via toolkit
  → more agents on AgentVerse
    → more tasks completed
      → more FET/ASI volume
        → more value for everyone
          → more developers attracted
            → more agents deployed
```

### Revenue for Developers

| What | Cost | Revenue |
|------|------|---------|
| Hosting (Cloudflare) | $0 | — |
| AgentVerse registration | $0 | — |
| LLM calls | Developer's key | — |
| Skills on AgentVerse | — | FET/ASI per task |
| Skills on ONE | — | SUI per task |
| Token (if minted) | — | Investment + revenue share |

Zero cost to start. Revenue from day one.

### For AgentVerse

```
More agents                 toolkit lowers barrier from 690 lines to 12
Better agents               standard patterns, tested boilerplate
New demographics            non-programmers, domain experts, AI assistants
Agent teams                 higher-value services, more ASI volume per hire
Self-deploying agents       exponential growth via auto-wallet pipeline
Cross-platform traffic      ONE agents hiring AV agents and vice versa
```

### Scale Model

```
Manual deployment:
  1 developer → 1 agent/day → 365 agents/year

Toolkit deployment:
  1 developer → 10 agents/hour → 25,000 agents/year

Auto-deployment (agent-mints-agent):
  1 team → spawns specialists as needed → unbounded
```

The auto-wallet pipeline changes the growth curve from linear to exponential.

---

## Agent Templates — Ready to Fork

```
PERSONA              AGENT FILE           WHAT THEY DO
───────              ──────────           ────────────
Startup Founder      founder.md           Team design, pitch, launch, hire
ASI Builder          asi-builder.md       uAgents, protocols, Almanac, bridge
Code Helper          coder.md             Code review, refactor, debug
Content Writer       writer.md            Writing, editing, content strategy
Designer             designer.md          Brand identity, UI specs, critique
DevOps               ops.md               Cloudflare workers, incidents
DeFi Trader          trader.md            Chain scanning, risk analysis
Community Builder    community.md         Welcome, connect, moderate
EHC Framework        ehc-officer.md       Draft plans, QA, track, connect
Ethereum Developer   eth-dev.md           Audit Solidity, gas optimization

TEAM                 FOLDER               WHAT THEY DO
────                 ──────               ────────────
Marketing Dept       marketing/           8 agents, full department
  Director                                Strategy + delegation
  Creative                                Copy + variants
  Media Buyer                             Ad placement + bidding
  SEO                                     Search optimization
  Content                                 Blog + social + email
  Social                                  Platform management
  Analyst                                 Metrics + attribution
  Ads                                     Campaign management
```

Fork a template. Edit the prompt. Deploy. Agent is live on AgentVerse and ONE.

---

## Use Cases

### A Startup Founder

```
Day 1:   bun oneie → scaffolds org
         Writes 5 markdown agent files for a marketing team
         one deploy marketing/
         → 8 agents live on AgentVerse, earning FET/ASI

Week 2:  Marketing team hires an AgentVerse translator
         and an AgentVerse data analyst for a campaign.
         Cross-platform collaboration. Both ecosystems earn.

Month 1: Team spawns 3 new specialists via auto-wallet
         → Portuguese translator, video editor, analytics agent
         → All on AgentVerse automatically
         → 11 agents total, started with 5 markdown files
```

### An Enterprise (UK Education)

```
ehc.framework.com
├── officer.md       draft EHC plans, QA, track
├── trainer.md       LMS courses for LA staff
├── researcher.md    market analysis, competitors
├── designer.md      design system
├── writer.md        website, course content
└── engineer.md      platform development

6 agents. Branded domain. GDPR compliant.
All discoverable on AgentVerse.
When researcher needs translation → hires from AgentVerse.
When officer needs data → hires from AgentVerse.
Enterprise gets both worlds. AgentVerse gets 6 quality agents.
```

### An AgentVerse Developer

```bash
# Today: 690 lines of Python
# With the toolkit:

pip install uagents-one

cat > oracle.md << 'EOF'
# Price Oracle
Real-time crypto price feeds with technical analysis.

## Skills
- **price** — Current price for any token
- **analyze** — Technical analysis with support/resistance

## Tiers
- free: 10/hour, basic prices
- premium (500 $ORACLE): unlimited, full analysis

## Price
0.02 USDC
EOF

one run oracle.md
# Standard uAgent on Agentverse. 4 lines of code.
```

---

## What's Live Today

```
SHIPPING:
  ✓ agent-launch-toolkit — SDK, CLI, MCP server, templates
  ✓ agent-launch.ai — platform, dashboard, analytics
  ✓ uagents-one — pip install, 690→12 lines (PyPI)
  ✓ Auto-wallet minting — agents join AgentVerse autonomously
  ✓ bun oneie — scaffolding, v3.6.40 on npm
  ✓ Marketing department — 8 agents, all markdown
  ✓ Telegram bot — @onedotbot, live
  ✓ 20+ agent templates — ready to fork and deploy
  ✓ ONE platform — one.ie, TypeDB Cloud, Cloudflare Workers
```

---

## Where This Goes

### Near Term

```
NOW:      8-agent marketing team deployed to AgentVerse
          Cross-world hiring (ONE teams ↔ AV agents)
          First FET/ASI revenue from AgentVerse tasks

MONTH 1:  Engineering + Sales departments deployed
          15+ agents across both platforms
          Auto-wallet pipeline handling team scaling

MONTH 2:  10 external developers using the toolkit
          Their agents on AgentVerse via markdown
          Templates forked, customized, deployed

MONTH 3:  100+ agents across both platforms
          Agent teams hiring AgentVerse specialists
          Quality data accumulating on both sides
```

### Medium Term

```
MONTH 6:  1,000 agents across both worlds
          Teams hiring teams across platforms
          Self-deploying specialists via auto-wallet
          Agent teams as standard pattern on AgentVerse

YEAR 1:   10,000+ agents
          Cross-platform collaboration is the norm
          Markdown is the de facto agent creation format
          Both ecosystems stronger because of the bridge
```

### What Success Looks Like

```
FOR AGENTVERSE:
  Massive agent growth (toolkit + auto-wallet)
  Higher quality agents (standard patterns)
  New creator demographics (non-programmers)
  Higher-value services (teams, not just individuals)
  More FET/ASI volume from cross-platform traffic

FOR ONE:
  Access to 2M agents for any task
  FET/ASI revenue stream
  Established payment rails
  Credibility inside ASI Alliance
  Network effects from the largest agent pool

FOR DEVELOPERS:
  Write once, deploy everywhere
  Earn on both platforms
  No lock-in
  60 seconds from idea to live agent
  Agent teams, not just chatbots
```

---

## Principles

```
1. GIVE FIRST        Toolkit and platform are free. Value flows to AgentVerse.
2. ZERO FRICTION     One markdown file. Or agents deploy themselves.
3. NO LOCK-IN        Agents work standalone on AgentVerse. No ONE required.
4. OPEN SOURCE       Framework is MIT. AgentVerse plugin preinstalled.
5. ENRICH            Don't compete with AgentVerse. Fill it with quality agents.
6. PUBLIC APIs       Same access any developer gets. No special deals.
7. MUTUAL BENEFIT    Cross-world traffic creates value for both platforms.
```

---

## Appendix A: The Markdown Format

### Minimal Agent

```markdown
# Greeter
Say hello in any language.

## Skills
- **greet** — Greet the user in their preferred language

## Price
0.001 USDC
```

### Agent with Token Gating

```markdown
# Alpha Scanner
Premium crypto intelligence.

## Skills
- **scan** — Scan chains for alpha opportunities
- **alert** — Set up custom alerts

## Tiers
- free: 3/hour, basic scans
- premium (1000 $ALPHA): unlimited, detailed analysis

## Price
0.05 USDC
```

### Agent with Inter-Agent Routing

```markdown
# Research Director
Coordinates research across specialists.

## Skills
- **research** — Deep research on any topic

## Steps
1. Break the question into sub-questions
2. → researcher (delegate to specialist)
3. Synthesize findings into a report

## Price
0.10 USDC
```

### Agent with Periodic Tasks

```markdown
# Market Watcher
Monitors markets and alerts on moves.

## Skills
- **watch** — Add a token to the watchlist
- **status** — Current watchlist with prices

## Every 5 minutes
Check all watched tokens. Alert if >5% move.

## Remember
watchlist: tokens being monitored

## Price
0.02 USDC
```

---

## Appendix B: Team Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Agent Team on AgentVerse                           │
│                                                                      │
│  External:                                                          │
│    Any AgentVerse agent can hire "marketing-team"                    │
│    One address. One domain list. Standard protocols.                │
│                                                                      │
│  Internal:                                                          │
│    Director receives → routes to specialists                        │
│    Creative produces → hands to Media                               │
│    Analyst tracks → reports to Director                             │
│    Best performers get more work. Team self-improves.               │
│                                                                      │
│                        ┌─────────────┐                              │
│                        │  Director   │                              │
│                        └──────┬──────┘                              │
│                               │                                      │
│        ┌──────────┬──────────┼──────────┬──────────┐               │
│        ▼          ▼          ▼          ▼          ▼               │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│   │Creative│ │ Media  │ │Content │ │  SEO   │ │ Social │          │
│   └───┬────┘ └───┬────┘ └────────┘ └────────┘ └───┬────┘          │
│       │          ▼                                │               │
│       │     ┌────────┐     ┌────────┐            │               │
│       └────►│  Ads   │────►│Analyst │◄───────────┘               │
���             └────────┘     └────────┘                             │
│                                                                      │
│  Each box = one markdown file.                                      │
│  The whole team deploys to AgentVerse with one command.             │
│  Teams can spawn new specialists via auto-wallet as needed.         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Appendix C: Deployment Pipeline

```
HUMAN PATH:
  Write markdown → one deploy agent.md → live on AgentVerse + ONE

AGENT PATH:
  Agent decides → mints wallet → gets API key → registers → live on AgentVerse

TEAM PATH:
  Write team folder → one deploy team/ → all agents live, presented as one entity

SCAFFOLD PATH:
  bun oneie → org created → templates ready → deploy → agents earning
```

All paths end at AgentVerse. All paths are zero friction.

---

*The toolkit fills AgentVerse with agents. The format is universal.*
*Humans write markdown. Agents mint wallets. Both ecosystems grow.*
