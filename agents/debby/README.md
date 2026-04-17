# Elevare — Debby's Autonomous School

Debby sits on the board. The agents run the school.
13 agents. USDC on Sui. Five student personas. Pheromone learns what works.

## Org Chart

```
Debby (Board) → CEO → 4 Directors → 13 agents total
```

### Leadership
| Agent | UID | Skills | Model tier |
|-------|-----|--------|-----------|
| CEO | `debby:ceo` | report, coordinate, treasury | Free (Llama) |
| Education | `debby:edu` | curriculum, quality, adapt | Free (Llama) |
| Marketing | `debby:mktg` | campaign, brand, brief | Free (Llama) |
| Sales | `debby:sales` | pipeline, pricing | Free (Llama) |
| Community | `debby:community` | retention, testimonial, referral | Free (Llama) |

### Student-Facing
| Agent | UID | Skills | Priced (USDC) |
|-------|-----|--------|:-------------:|
| Concierge | `debby:concierge` | welcome, placement | Free |
| Amara | `debby:amara` | practice ($0.50), lesson ($1), pronunciation ($0.25), scenario ($1) | Yes |
| Welcome | `debby:welcome` | onboard | Free |
| Support | `debby:support` | help, wallet-help | Free |

### Internal
| Agent | UID | Skills | Director |
|-------|-----|--------|----------|
| Assessment | `debby:assessment` | track, report ($2), milestone | Education |
| Content | `debby:content` | write ($0.01), testimonial-post ($0.01) | Marketing |
| Enrollment | `debby:enrollment` | convert, wallet-onboard | Sales |
| Upsell | `debby:upsell` | upgrade, winback | Sales |

### Legacy Marketing Pod (SEO Services)
| Agent | UID | Price (USDC) |
|-------|-----|------:|
| ai-ranking | `debby:ai-ranking` | 0.05 |
| citation | `debby:citation` | 0.10 |
| forum | `debby:forum` | 0.03 |
| full | `debby:full` | 1.00 |
| monthly | `debby:monthly` | 0.50 |
| niche-dir | `debby:niche-dir` | 0.05 |
| outreach | `debby:outreach` | 0.10 |
| quick | `debby:quick` | 0.20 |
| schema | `debby:schema` | 0.05 |
| social | `debby:social` | 0.05 |

## Student Personas

| Persona | Entry product | Target upsell |
|---------|-------------|--------------|
| Career Climber | Lingua Live ($149/mo) | Rise confidence |
| Shy Returner | Free Amara trial → $29/mo | Lingua Live |
| Exam Warrior | Flex Nexus ($497) | Lingua post-exam |
| Expat Parent | Lingua Live ($149/mo) | Rise workshop |
| Digital Nomad | Amara scenario → Lingua Premium ($179/mo) | Rise |

## Student Journey

```
Attract → Concierge → Enrollment → Welcome → Amara → Assessment → Upsell → Advocate
   │          │            │           │         │         │           │         │
 Content   Persona ID   Payment    Onboard   Practice  Milestone   Upgrade  Testimonial
 Mktg      Level        USDC/card  Per-persona Daily    SBT mint    Data     Referral
```

## Context Sharing

1. **Student State** — R2 JSON per student. Assessment writes, everyone reads.
2. **Pheromone** — substrate automatic. Every signal deposits mark/warn.
3. **Signals** — explicit cross-agent messages for milestones, escalations, handoffs.

## Telegram Bot

@Elevareworksbot — runs the Concierge persona via `debby-claw` worker.

## Admin Dashboard

`/chat-debby-admin` — live conversation monitoring + human takeover.

Uses the shared `ClawAdmin` component. Debby can:
- See all active conversations in real-time (polls every 5s)
- Click into any conversation to read the full history
- Reply as herself — message stored in D1 + pushed to student's Telegram
- See student metadata: session count, onboarding stage, handle

Works for any claw: `?claw=https://other-claw.workers.dev&adminName=donal`

## Source

- Strategy: `docs/PLAN-debby.md`
- World spec: `src/worlds/debby-marketing.ts`
- Donal's repo: `onlineoptimisers/agency-operator`
- `src/components/ai/ClawAdmin.tsx` — shared admin component
- `src/pages/chat-debby-admin.astro` — admin page
