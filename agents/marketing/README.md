# Marketing Team

**A world of agents. Same API as a single agent. Federates with AgentVerse.**

The marketing team is a **world** — a group of agents that works as a unit. Call it like you'd call any agent:

```typescript
// Signal the whole team
signal({ receiver: 'marketing', data: { task: 'launch-campaign', budget: 5000 } })

// Director receives, routes internally based on weights
// Team executes, returns unified result
// From outside: it's just one agent
```

## World = Agent

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Marketing World                              │
│                                                                      │
│  External API:  { receiver: 'marketing', data }                     │
│  Internal:      Director routes to specialists via weights           │
│  Federation:    Connects to AgentVerse like any world               │
│                                                                      │
│                        ┌─────────────┐                              │
│                        │  Director   │                              │
│                        │  (routes)   │                              │
│                        └──────┬──────┘                              │
│                               │                                      │
│        ┌──────────┬──────────┼──────────┬──────────┐               │
│        │          │          │          │          │               │
│        ▼          ▼          ▼          ▼          ▼               │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│   │Creative│ │ Media  │ │Content │ │  SEO   │ │ Social │          │
│   │        │ │ Buyer  │ │        │ │        │ │        │          │
│   └───┬────┘ └───┬────┘ └────────┘ └────────┘ └───┬────┘          │
│       │          │                                │               │
│       │          ▼                                │               │
│       │     ┌────────┐     ┌────────┐            │               │
│       └────►│  Ads   │────►│Analyst │◄───────────┘               │
│             │        │     │        │                             │
│             └────────┘     └────────┘                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Federation
                                   ▼
                         ┌─────────────────┐
                         │   AgentVerse    │
                         │   (Fetch.ai)    │
                         │                 │
                         │  Other worlds   │
                         │  can discover   │
                         │  and hire this  │
                         │  marketing team │
                         └─────────────────┘
```

## The Team

| Agent | Role | Collaborates With |
|-------|------|-------------------|
| [director.md](director.md) | Strategy, routing, budget | All agents |
| [media-buyer.md](media-buyer.md) | Ad placement, bidding, spend | Creative, Ads, Analyst |
| [creative.md](creative.md) | Ad copy, visuals, variants | Media Buyer, Content |
| [seo.md](seo.md) | Search optimization, keywords | Content, Analyst |
| [content.md](content.md) | Blog, social, email | SEO, Creative, Social |
| [social.md](social.md) | All platforms, community, calendar | Content, Creative, Analyst |
| [analyst.md](analyst.md) | Metrics, attribution, insights | All agents |
| [ads.md](ads.md) | Campaign management, targeting | Media Buyer, Creative |

## Weight-Based Routing

The director doesn't micromanage. It routes based on **substrate weights**:

```typescript
// Director receives a task
signal({ receiver: 'marketing:director', data: { task: 'launch-campaign', budget: 5000 } })

// Director routes to best performer for each subtask
const creative = await net.select('marketing:creative')  // weighted by past performance
const buyer = await net.select('marketing:media-buyer')  // weighted by ROAS history

// Paths strengthen on success
if (campaign.roas > 2.0) {
  net.mark('director→creative', campaign.roas)
  net.mark('director→media-buyer', campaign.roas)
}
```

**Performance accumulates:**
- High ROAS? Path to that agent strengthens
- Low CTR? Path weakens
- Over time, director naturally routes to best performers

## Collaboration Signals

```
# Director assigns
{ receiver: 'marketing:creative', data: { brief: '...', budget: 1000 } }

# Creative produces, signals media buyer
{ receiver: 'marketing:media-buyer', data: { assets: [...], variants: 3 } }

# Media buyer launches, reports to analyst
{ receiver: 'marketing:analyst', data: { campaign_id: '...', spend: 500 } }

# Analyst reports back to director
{ receiver: 'marketing:director', data: { roas: 2.4, winner: 'variant_b' } }

# Director strengthens winning paths
mark('creative→media-buyer', 2.4)
mark('director→creative', 2.4)
```

## The Feedback Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                     Marketing Feedback Loop                      │
│                                                                  │
│   Director sets goals                                           │
│        │                                                        │
│        ▼                                                        │
│   Routes to specialists (weighted)                              │
│        │                                                        │
│        ├──► Creative produces variants                          │
│        │         │                                              │
│        │         ▼                                              │
│        ├──► Media Buyer launches                                │
│        │         │                                              │
│        │         ▼                                              │
│        ├──► Analyst tracks performance                          │
│        │         │                                              │
│        │         ▼                                              │
│   ◄────┴─── Performance updates weights                         │
│                                                                  │
│   Repeat. Paths strengthen. Team improves.                      │
└─────────────────────────────────────────────────────────────────┘
```

## Content Calendar (Drag & Drop)

The Social agent manages a unified content calendar across all platforms.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  JANUARY 2025                                              [+ Add Post]     │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┤
│   MON   │   TUE   │   WED   │   THU   │   FRI   │   SAT   │   SUN   │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│    13   │    14   │    15   │    16   │    17   │    18   │    19   │
│         │         │         │         │         │         │         │
│ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │         │         │
│ │ 🐦  │ │ │ 💼  │ │ │ 📧  │ │ │ 🐦  │ │ │ 🎬  │ │         │         │
│ │Blog │ │ │Think│ │ │News │ │ │Thrd │ │ │BTS  │ │         │         │
│ │drop │ │ │piece│ │ │lettr│ │ │tips │ │ │vid  │ │         │         │
│ └──┬──┘ │ └─────┘ │ └─────┘ │ └─────┘ │ └─────┘ │         │         │
│    │    │         │         │         │         │         │         │
│ ┌──┴──┐ │         │         │         │         │         │         │
│ │ 💼  │ │         │         │         │         │         │         │
│ │Promo│ │         │         │         │         │         │         │
│ └─────┘ │         │         │         │         │         │         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

[Drag posts between days]  [Filter by platform]  [View: Week | Month]
```

**Calendar data structure:**

```typescript
interface CalendarPost {
  id: string
  content: string
  platform: 'twitter' | 'linkedin' | 'discord' | 'reddit' | 'youtube' | 'tiktok'
  scheduled_at: Date
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  media?: string[]
  campaign_id?: string  // Links to ad campaign
  thread?: string[]     // For Twitter threads
}

// Drag & drop updates
signal({
  receiver: 'marketing:social',
  data: {
    action: 'reschedule',
    post_id: 'abc123',
    new_time: '2025-01-16T14:00:00Z'
  }
})
```

**Calendar features:**
- Drag & drop scheduling
- Multi-platform view
- Campaign linking
- Auto-posting
- Performance overlay (show engagement on published posts)
- Content suggestions (from SEO keywords, trending topics)

## What We're Marketing

**Agents.** The marketing team markets agents:
- ONE substrate agents
- NanoClaw deployments
- Agent Launch Toolkit
- AgentVerse economy

An AI marketing team, marketing AI agents, built on AI infrastructure.

## Deploy the Team

```bash
# Deploy entire team
for agent in director media-buyer creative seo content analyst ads; do
  cp marketing/$agent.md agent.md
  npx wrangler deploy --name marketing-$agent
done
```

Or deploy individually and let them discover each other via the substrate.

## Metrics

| Agent | Primary Metric | Secondary |
|-------|---------------|-----------|
| Director | Overall ROI | CAC, LTV |
| Media Buyer | ROAS | CPA, CPM |
| Creative | CTR | Engagement, Fatigue |
| SEO | Organic Traffic | Rankings, Backlinks |
| Content | Engagement | Time on Page, Shares |
| Analyst | Insight Velocity | Accuracy |
| Ads | Conversion Rate | CPC, Quality Score |

## World Federation

This marketing team is a **world** that federates with other worlds:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Marketing  │     │     ONE     │     │ AgentVerse  │
│   World     │◄───►│  Substrate  │◄───►│  (Fetch.ai) │
│             │     │             │     │             │
│  8 agents   │     │  100+ units │     │  1000s of   │
│  1 API      │     │  TypeDB     │     │  agents     │
└─────────────┘     └─────────────┘     └─────────────┘

// From AgentVerse, call ONE
signal({ receiver: 'one.ie:marketing', data: { task: 'campaign', budget: 10000 } })

// ONE routes to marketing world
// Marketing Director routes to specialists
// Result returns through federation

// The marketing team IS discoverable on AgentVerse
// Other agents can hire it: "I need marketing for my agent"
```

**What federation enables:**
- Any agent on AgentVerse can hire the marketing team
- Marketing team can hire other agents (designers, translators, researchers)
- Cross-world pheromone trails form
- Reputation carries across worlds
- ASI flows between worlds

**The API is identical:**
```typescript
// Call a single agent
signal({ receiver: 'tutor', data: { question: '...' } })

// Call a world (team of agents)
signal({ receiver: 'marketing', data: { campaign: '...' } })

// Same interface. The caller doesn't need to know it's a world.
```

## See Also

- [cloudflare.md](../../docs/cloudflare.md) — Free hosting for the team
- [routing.md](../../docs/routing.md) — Weight-based routing mechanics
- [lifecycle.md](../../docs/lifecycle.md) — The ONE lifecycle we're marketing
- [agent-launch.md](../../docs/agent-launch.md) — What we're marketing
- [strategy.md](../../docs/strategy.md) — The bigger picture
