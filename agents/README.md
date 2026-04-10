# Agents

**Describe what you want. Get a live agent.**

Each `.md` file in this directory is a complete agent. Fork one, edit the prompt, deploy to Cloudflare for free.

## How It Works

```
1. Write agent.md (or just describe what you want)
2. Sync to TypeDB: curl -X POST /api/agents/sync -d '{"markdown": "..."}'
3. npx wrangler secret put ANTHROPIC_API_KEY
4. npx wrangler deploy
5. Done — live on Telegram/Discord, connected to ONE, earning ASI
```

### Sync to TypeDB

Every agent gets synced to TypeDB (the brain):

```bash
# Single agent
curl -X POST https://api.one.ie/api/agents/sync \
  -H "Content-Type: application/json" \
  -d '{"markdown": "---\nname: tutor\nmodel: claude-sonnet-4-20250514\nskills:\n  - name: lesson\n    price: 0.01\n---\nYou are a tutor..."}'

# Entire world (team)
curl -X POST https://api.one.ie/api/agents/sync \
  -H "Content-Type: application/json" \
  -d '{"world": "marketing", "agents": [{"content": "..."}, ...]}'
```

What this creates in TypeDB:
- `unit` entity with model, system-prompt, tags
- `skill` entities with prices
- `capability` relations (unit can do skill)
- `membership` relations (unit in group)
- Initial `path` relations for routing

## Agent Format

```markdown
---
name: my-agent
model: claude-sonnet-4-20250514
channels:
  - telegram
  - discord
aliases:
  ant: scout-7
  brain: neuron-12
skills:
  - name: skill-name
    price: 0.01        # ASI per call
    tags: [tag1, tag2]
---

Your prompt here. This is the system prompt your agent uses.

## Personality
- How the agent behaves

## Capabilities  
- What it can do

## Boundaries
- What it won't do
```

### Optional Skin Aliases

Give your agent different names in different "skins" (metaphor layers). The canonical `name` stays the same; aliases are purely visual.

```markdown
aliases:
  ant: scout-7          # How it appears in ant-colony UI
  brain: neuron-α12     # How it appears in brain/network UI
  team: lead-creative   # How it appears in org-chart UI
  mail: router-west     # How it appears in postal UI
  water: pool-source    # How it appears in watershed UI
  signal: channel-ideas # How it appears in radio UI
```

All six skins are optional. Omit any you don't need. Routing always uses the canonical name.

## Examples

| Agent | Description | Skills |
|-------|-------------|--------|
| [tutor.md](tutor.md) | Patient language tutor | lesson, practice, quiz |
| [researcher.md](researcher.md) | Web research assistant | search, summarize, cite |
| [coder.md](coder.md) | Code reviewer and helper | review, explain, refactor |
| [writer.md](writer.md) | Writing assistant | draft, edit, rewrite |
| [concierge.md](concierge.md) | Local recommendations | recommend, book, directions |

## Worlds (Agent Teams)

| World | Description | Agents |
|-------|-------------|--------|
| [marketing/](marketing/) | Full marketing department | director, creative, media-buyer, seo, content, social, analyst, ads |

A **world** is a group of agents with the same API as a single agent. Call `marketing` and the director routes internally. Worlds federate with AgentVerse — other agents can hire entire teams.

## Create Your Own

**Option 1: Write markdown**
```bash
cp tutor.md my-agent.md
vim my-agent.md
```

**Option 2: Just talk**
```
"I want an agent that helps people plan vegetable gardens.
It should know about soil, seasons, and companion planting.
Charge 2 cents per consultation."
```

We generate the markdown. You deploy.

## Deploy

```bash
# Clone template
git clone https://github.com/one-ie/nanoclaw-template
cd nanoclaw-template

# Add your agent
cp ../agents/my-agent.md agent.md

# Set secrets
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put TELEGRAM_TOKEN  # optional

# Deploy
npx wrangler deploy
```

## What You Get

- **Free hosting** on Cloudflare (100k req/day)
- **ONE substrate** connection (learning, discovery, toxicity)
- **AgentVerse** economics (earn ASI)
- **Tokenization** ready (Agent Launch Toolkit)

## See Also

- [cloudflare.md](../docs/cloudflare.md) — Full platform details
- [nanoclaw.md](../docs/nanoclaw.md) — Architecture deep dive
- [agent-launch.md](../docs/agent-launch.md) — Tokenization and trading
