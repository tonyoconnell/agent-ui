# uagents-one

**690 lines → 12 lines. Same agent. Same Agentverse.**

---

## The Problem

Every Agentverse agent rewrites the same 500+ lines:

- Chat protocol boilerplate (ack, text extraction, reply formatting)
- Security (rate limiting, input validation)
- Storage helpers (JSON serialize/deserialize)
- Token gating (check holdings, enforce quotas)
- Health monitoring (uptime, error rate)
- Intent detection (regex routing)
- Tier management (free vs premium responses)
- Error handling (try/catch, friendly messages)
- LLM integration (prompt construction, caching)

The business logic — what the agent actually does — is 10% of the code.

## The Solution

A markdown file is the agent. The library handles everything else.

**Before** — research-agent.py (690 lines):

```python
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import ...

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

class Security: ...          # 40 lines
class Health: ...            # 20 lines
class Cache: ...             # 30 lines
class AI: ...                # 30 lines
class AgentLaunch: ...       # 25 lines

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

**After** — researcher.md (12 lines) + run.py (4 lines):

```markdown
# Researcher

Senior crypto analyst. Detailed, data-driven, actionable insights.

## Skills
- **analyze** — Provide detailed analysis on this crypto topic
- **compare** — Side-by-gide comparison of protocols or tokens
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

Same chat protocol. Same Agentverse deployment. Same token gating. Same everything.

## What the Library Handles

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

For the 11 agents in agent-launch-toolkit, that's **~3,000 lines eliminated**.

## The Format

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

Full spec: [uagents-markdown.md](uagents-markdown.md)

## Install

```bash
pip install uagents-one
```

## CLI

```bash
# Run an agent from markdown
one run researcher.md

# Validate a markdown agent
one parse researcher.md
```

## What This Means for Agentverse

**For developers:**
- Write agents in minutes, not hours
- Non-programmers can create agents (it's just markdown)
- Same file works across teams — readable, reviewable, versionable

**For the platform:**
- More agents deployed (lower barrier)
- Higher quality agents (consistent patterns)
- Faster onboarding (tutorial is: write a markdown file)
- Standard format enables tooling (visual builders, templates, marketplaces)

**For the ecosystem:**
- Markdown is universal — any framework can parse it
- Agents become portable (same file, different runtimes)
- The format is the standard, not the framework

## Who Built This

ONE (one.ie) — signal-based substrate for AI agents. We built the agent-launch-toolkit for Fetch.ai. This library extracts the patterns we saw repeated across every agent into a single, clean format.

The markdown format also runs natively on the ONE substrate, where agents get pheromone-based routing, automatic evolution, and cross-agent discovery. But uagents-one works standalone on Agentverse with zero ONE dependencies.

## Next Steps

1. **Pilot**: Convert 3 existing toolkit agents to markdown, deploy on Agentverse
2. **Validate**: Compare developer experience, code quality, deployment speed
3. **Ship**: Publish to PyPI, add to Agentverse documentation
4. **Extend**: Visual agent builder that outputs markdown files
