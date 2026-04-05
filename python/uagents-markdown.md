# Markdown Agents for Agentverse

Describe an agent in markdown. Run it on Agentverse.

```markdown
# Greeter

Friendly and warm. Remembers names.

## Skills
- **hello** — Greet the user by name if you know it
```

```python
from one import md, anthropic
agent = md(open("greeter.md").read(), anthropic())
agent.run()
```

That's a deployed Agentverse agent. Chat protocol, ack handling, error recovery, logging — all handled.

---

## Tutorial

### 1. A Simple Agent

The simplest agent has a name and a personality:

```markdown
# Helper

You answer questions clearly and concisely.
```

No skills, no steps. Users chat, the personality shapes every response.

### 2. Add Skills

Skills are things the agent can do. Users ask for one; the agent routes automatically.

```markdown
# Translator

Fast, accurate translation. Preserves tone and idiom.

## Skills
- **translate** — Translate the text to the target language
- **detect** — Detect the language of the input
- **summarize** — Summarize the text in the same language
```

User says "translate this to French" → hits the **translate** skill.
User says "what language is this?" → hits the **detect** skill.
User says anything else → hits the first skill as default.

### 3. Add Steps (Chains)

Steps run in order. Each result feeds the next.

```markdown
# Blogger

Write sharp blog posts. No fluff. Strong openings.

## Steps
1. **outline** — Create a 5-section outline for the topic
2. **draft** — Write the full post from the outline
3. **polish** — Tighten prose, fix flow, add a killer opening
```

User sends a topic → outline → draft → polish → finished post comes back.

### 4. Send Results Somewhere

Arrow sends results to another agent.

```markdown
# Scout

Curious researcher. Leaves no stone unturned.

## Skills
- **search** — Search for information on this topic
  → analyst:process
```

Scout finds information, sends it to the analyst's `process` skill.

Multiple targets = fan out:

```markdown
- **alert** — Threshold breached
  → ops:notify, logger:save, dashboard:update
```

### 5. Remember Things

Agent-wide state that persists across messages.

```markdown
# Counter

Counts things.

## Remember
- count: 0
- last_item: none
```

Memory is shared across all users. For per-user state, see the next section.

### 6. Per-User Memory

Add `per-user` after Remember. Each sender gets their own state.

```markdown
# Tutor

Patient, encouraging, adapts to the student's level.

## Remember per-user
- level: beginner
- topics_covered: 0
- last_topic: none
```

Student A is at beginner. Student B is at advanced. The tutor remembers each independently.

### 7. Run Periodic Tasks

`## Every` runs a task on an interval. Describe what to check in plain language.

```markdown
# Price Monitor

Watches token prices. Alerts when thresholds are breached.

## Skills
- **watch** — Set a price alert for this token
- **alerts** — Show my active alerts

## Every 5 minutes
Check all active alerts against current prices.
If any threshold is breached, notify the alert owner.
```

The interval runs in the background. The skills handle user chat. Both work together.

Supported intervals: `seconds`, `minutes`, `hours`.

### 8. Charge for It

`## Price` sets an on-chain price per invocation.

```markdown
# Writer

Crisp, clear writer. Every word earns its place.

## Steps
1. **draft** — Write a report from the findings
2. **edit** — Tighten and polish

## Price
0.2 USDC
```

### 9. Free and Premium Tiers

`## Tiers` defines who gets what.

```markdown
# Researcher

Senior crypto analyst. Data-driven, actionable insights.

## Skills
- **analyze** — Analysis on this crypto topic
- **compare** — Side-by-side comparison
- **report** — Summary with key findings

## Tiers
- free: 5/hour, basic analysis
- premium (1000 $RESEARCH): unlimited, detailed reports

## Price
0.05 USDC
```

Free users get shorter responses and a quota. Premium users (holding 1000 $RESEARCH tokens) get the full analysis, unlimited.

The library handles:
- Checking token holdings via AgentLaunch API
- Enforcing hourly quotas
- Adjusting prompt depth by tier
- Appending upgrade nudge to free responses

### 10. Declare Secrets

`## Secrets` lists environment variables the agent needs.

```markdown
# Data Oracle

Real-time market data. Fast, accurate, cached.

## Skills
- **price** — Current price for this token
- **trending** — Top tokens by market cap

## Secrets
- COINGECKO_API_KEY
- TOKEN_ADDRESS

## Tiers
- free: 5/hour
- premium (1000 $DATA): unlimited
```

On startup, the library checks that all secrets are set. Missing secrets = clear error message, not a crash mid-conversation.

### 11. Multi-Agent Teams

Three markdown files. Three agents. One swarm.

**scout.md:**
```markdown
# Scout

Relentless researcher. Compares sources.

## Skills
- **search** — Find information on this topic
  → analyst:process
```

**analyst.md:**
```markdown
# Analyst

Sharp analytical mind. Signal in the noise.

## Steps
1. **process** — Extract key findings
2. **rank** — Rank by relevance
   → writer:draft
```

**writer.md:**
```markdown
# Writer

Concise. Every word earns its place.

## Steps
1. **draft** — Write the report
2. **edit** — Polish it

## Price
0.2 USDC
```

```python
from one import md, anthropic

complete = anthropic()
scout = md(open("scout.md").read(), complete)
analyst = md(open("analyst.md").read(), complete)
writer = md(open("writer.md").read(), complete)

# Run all three (in production, each runs in its own process)
scout.run()
```

One message to scout → search → analyst:process → rank → writer:draft → edit → reply.

---

## Complete Format Reference

```markdown
# Agent Name

Personality paragraph. Shapes every response.
Multiple lines become one paragraph.

## Steps
1. **name** — What this step does (ordered, chained)
2. **name** — Next step (receives previous result)
   → other-agent:skill (optional, sends final result)

## Skills
- **name** — What this skill does (unordered, independent)
  → target, target (optional, fan out)

## Every <number> <seconds|minutes|hours>
Plain language description of the periodic task.
Multiple lines are joined into one instruction.

## Remember
- key: value (agent-wide state)

## Remember per-user
- key: value (per-sender state)

## Tools
- tool_name (passed in at load time)

## Tiers
- free: <quota>, <description>
- premium (<threshold> <$TOKEN>): <quota>, <description>

## Secrets
- ENV_VAR_NAME

## Price
<amount> <currency>
```

### Rules

- `# Name` is required. Everything else is optional.
- Personality is the first paragraph after `# Name`.
- Steps are numbered → they chain automatically.
- Skills are bullets → they run independently.
- `→` sends results. Works on steps and skills.
- `## Remember` is agent-global. `## Remember per-user` is per-sender.
- `## Every` creates a background interval.
- `## Tiers` gates access. Free tier gets shorter responses + quota. Premium checks token holdings.
- `## Secrets` are validated on startup.
- `## Price` is the on-chain cost per invocation.

### Loading

```python
from one import md, anthropic

# From file
agent = md(open("agent.md").read(), anthropic())

# From string
agent = md("""
# Echo
Repeat what the user says, but fancier.
""", anthropic())

# With tools
agent = md(source, anthropic(), tools={"search": my_search_fn})

# Run
agent.run()
```

---

## What the Library Handles

You write the markdown. The library handles:

| You don't write | The library does it |
|-----------------|-------------------|
| Chat protocol v0.3.0 | Wired automatically |
| Ack handling | Every message acknowledged |
| Text extraction | Parsed from ChatMessage content |
| Reply formatting | TextContent + EndSessionContent |
| Error recovery | Catches exceptions, sends friendly error |
| Intent routing | Matches user text to skill names |
| Step chaining | Pipes result of each step to the next |
| JSON storage | Serializes/deserializes ctx.storage |
| Per-user isolation | Separate memory namespace per sender |
| Rate limiting | Quota enforcement from Tiers |
| Token gating | Holdings check via AgentLaunch API |
| Health tracking | Request count, error rate, uptime |
| Secret validation | Checks env vars on startup |
| Manifest publishing | Registers on Agentverse |
| LLM caching | SHA256-keyed response cache |

**690 lines of plumbing → 0 lines. You write purpose.**

---

## Before and After

A research agent on Agentverse today: **690 lines of Python.**

The same agent in markdown: **12 lines.**

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

Same chat protocol. Same Agentverse deployment. Same token gating. Same tiered responses. Same rate limiting. Same health monitoring. Same error handling.

12 lines of what the agent does. Zero lines of how.
