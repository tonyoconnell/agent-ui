---
title: PLAN — Debby / Elevare
type: plan
version: 2.1.0
status: ACTIVE
updated: 2026-04-16
source: onlineoptimisers/agency-operator (Donal's repo, write access)
todo: docs/TODO-debby.md
---

# PLAN: Debby / Elevare

> **Who:** Debby — English teacher, 10+ years, based in Chiang Mai.
> **What:** Elevare (`elevare.work`) — confidence-first English coaching for global learners.
> **Connection:** Donal is coaching her launch. Tony has write access to Donal's repo.
> **Source files:** `onlineoptimisers/agency-operator/docs/handover-debby-*.md`, `TODO-elevare-debby.md`

---

## Identity

Debby is a teacher, not a tech founder. She's been teaching English for over a decade —
classrooms, online, one-on-one. She's in Chiang Mai with a coworking crew of AI-curious
people. She runs a Huawei Linux laptop (Ryzen 5, 6.7GB RAM, no GPU). She has a Claude Code
Max subscription ($100/mo, Donal-funded for Month 1). Her GitHub is `darnygirl`.

She already built more than expected: a 7-tab marketing dashboard, a 5-tab AI tutor dashboard
with 40 lessons across 8 modules, voice cloning via XTTS on her laptop (~45s/sentence, CPU-bound),
3 pillar landing pages, a pricing page, a booking page, and a tutor portal. The gap is not
building — it's deploying, marketing, and selling.

**Email:** debbynickryanz@gmail.com
**WhatsApp:** +66 94 969 0869 (Thai number)
**Brand:** Elevare (not Elevate — locked)

---

## Goals

```
Day 30    $750 MRR        (revised down from $1k — honest given traffic)
Day 60    $1,500 MRR      (Stage 4 AI Tutor live, 10 paying students)
Day 90    $5,000 MRR      (stretch — voice clone + ads + retention flywheel)
```

The real goal underneath the numbers: **Debby owns a business that runs without Donal.**
He's coaching, not co-founding. No equity, no rev share. Pure friendship. If she invents
something, it's hers. If he invents something that helps her, it's a gift.

---

## Dreams

1. **The Amara moment.** An AI tutor with Debby's voice and teaching instincts that
   remembers each student's mistakes, celebrates their wins, and makes practice feel
   like chatting with a friend. Amara is the AI persona — warm, patient, never robotic.
   The name question (Amara vs Debby's own voice) is still open.

2. **Students who stop apologising.** Her words: "the moment someone stops apologising
   for their English and starts owning it — that's the shift." Elevare means "to rise."
   The brand is the mission.

3. **A second business from skills.** Donal's directive: Debby builds her OWN agents
   and skills from templates + methodology. These become her proprietary asset —
   a potential second revenue stream selling the teaching automation itself.

4. **Independence from platforms.** One domain (`elevare.work`), subdomains for everything:
   `app.` for portals, `ai.` for the tutor agent, `go.` for short links,
   `marketing.` for her dashboard. No dependency on any single marketplace.

---

## Three Pillars

| Pillar | What | Price point |
|--------|------|-------------|
| **Lingua** | Core English coaching — live 1:1 + group | $149-179/mo |
| **Rise** | Confidence coaching — public speaking, presentation nerves, interview prep | TBD |
| **Flex Nexus** | Intensive 30-day 1:1 + AI tutor practice | $497 one-time |

Pillar names are locked. Don't rename them.

---

## Strategy

### Phase 1: Infrastructure (Done 2026-04-16)

Built the substrate infrastructure. Everything below is live:
- Telegram bot @Elevareworksbot on dedicated CF Worker (debby-claw)
- Web chat at `/chat-debby` with instant canned answers + LLM fallback
- 24 agents defined (14 school org + 10 legacy SEO pod)
- Deterministic sandwich on all message paths (toxic → response → mark)
- Student memory (D1 profiles, injected into every LLM call)
- Direct Groq routing (~2.4s vs 8-11s via OpenRouter)
- All agents on Llama 4 Maverick ($0.10/M tokens)
- Pheromone signals emitted on every starter question

### Phase 2: Wire Agents (Next)

Connect the agent graph so signals flow through agents and back to students.
See `docs/TODO-debby.md` for the practical task list.
- Amara side-car → Assessment → student profile updates
- Welcome onboarding drip (Day 0/1/3/7)
- Upsell triggers on Assessment milestones
- Proactive Telegram messages from agents to students

### Phase 3: Debby's Channels (Blocked on Debby)

Debby owns these — we provide the infra:
- Fix site honesty issues (WhatsApp, Team page, Rise copy)
- `elevare.work` DNS + Zoho email
- Whop payment rail
- Warm network outreach (20 contacts, Hormozi-style)
- Voice sample → voice clone training

### Phase 4: Voice + Scale

- Debby voice clone via 11Labs or Orpheus
- Amara speaks in Debby's voice
- Whop product live, first 10 paying students
- Meta ads ($100 budget, Debby's ad account)

### Phase 5: Full Stack

- Astro rebuild of site on Cloudflare Pages
- em-dash CMS for identity + role gating
- Full attribution dashboard
- LTV tracking, Monday marketing brief cron

---

## Tactics (What's Actually Happening)

### Donal's Parallel Build (overnight, 6 Claude Code sessions)

| Chat | Deliverable                                                        |
| ---- | ------------------------------------------------------------------ |
| A    | `elevare.work` DNS + Cloudflare + Zoho email prep                  |
| B    | Voice-clone infra on M5 (Applio + RVC + R2 bucket)                 |
| C    | Stage 4 AI Tutor v0 code skeleton (Amara persona + OpenRouter)     |
| D    | Site honesty fixes as a git patch (one-click apply)                |
| E    | Legal + privacy + ads infra (DPAs, consent doc, Pixel, ad scripts) |
| F    | Incident runbook + monitoring + kill switch                        |

### Debby's Week 1 (her checklist, not Donal's)

```
Mon  → Answer 5 gating questions, record voice sample, Whop signup, Zoho email
Tue  → Fix WhatsApp, fix Team page, fix Rise copy
Wed  → List 20 warm contacts, send 10 outreach messages
Thu  → Audit own site aloud (phone, sceptical buyer), post 1 real photo on IG
Fri  → Follow up 10 messages, book 1 discovery call
Sat  → 1 free Rise confidence session with a volunteer, capture testimonial
Sun  → Day-7 check-in with Donal
```

### What She Must NOT Do (Week 1)

- Rebuild the site (that's Week 3-4)
- Record more than the 5-min voice sample
- Start new pillars or products
- Run paid ads (Whop must be live first)
- Read the 1839-line master plan (Donal's reference, not hers)
- Let OpenCode build new features (paused until Week 2)

---

## Blockers (P0)

| # | Blocker | Owner | Gates |
|---|---------|-------|-------|
| B01 | Answer 5 start-here questions | Debby | Entire Week 1 |
| B02 | 5-min voice sample recorded + sent | Debby | Voice clone training |
| B03 | Whop signup (free) | Debby | All paid conversions |
| B04 | Site honesty fixes applied | Debby | Ads legal to run |
| B05 | OpenAI/OpenRouter API key wired | Debby + crew | AI Tutor v0 |
| B06 | Cloudflare account (R2, Workers) | Debby + crew | Architecture live |
| B08 | Meta ad account (Debby's — Donal's is banned) | Debby | $100 ad spend |
| B11 | `elevare.work` DNS + email | Donal | Professional comms |
| S1 | Voice-clone consent doc signed | Donal (legal) | Voice clone live |
| S2 | Privacy policy + DPA | Both | GDPR + Thai PDPA |
| S3 | API-key audit on `.gitignore` | Both | Prevents breach |

---

## Tech Stack

| Layer | Current | Target |
|-------|---------|--------|
| **Site** | GitHub Pages (static HTML) | Astro on Cloudflare Pages (`elevare.work`) |
| **Tutor AI** | Flask + OpenAI (needs API key) | OpenRouter (Sonnet + Haiku) + R2 state |
| **Voice** | XTTS on laptop (45s/sentence) | Orpheus via M5 or 11Labs Instant Clone |
| **Payments** | Skrill button | Whop (merchant of record) |
| **CMS** | None | em-dash (Donal's CF-native portal) |
| **Email** | Gmail | Zoho Mail (`debby@elevare.work`) |
| **Ads** | None | Meta Pixel + Conversions API |
| **Tracking** | None | Airtable Leads base → UTM short links → full attribution |
| **AI Dev** | OpenCode on laptop | Claude Code Max ($100/mo) |

---

## Revenue Model

```
Lingua Live sessions     $149-179/mo    (tutor delivers, 70/30 split)
Flex Nexus Intensive     $497 one-time  (Debby delivers, 30 days)
AI Tutor Practice        $29-49/mo      (Amara delivers, 20-30 min/day)
Rise Confidence          TBD            (Debby delivers, premium)
```

**Unit economics target:** CAC < $50 per paying student, LTV > 3x CAC.
AI Tutor is the margin play — near-zero marginal cost per session.

---

## Elevare Autonomous School — Org Chart

Debby sits on the **board**. She doesn't manage day-to-day. The CEO reports to her.
Four directors run the school. Student-facing agents handle the experience.

```
                         ┌─────────┐
                         │  DEBBY  │  Board / Owner
                         │ (human) │  Sets vision, approves strategy
                         └────┬────┘
                              │ reports to
                         ┌────┴────┐
                         │   CEO   │  debby:ceo
                         │         │  Runs the school, weekly board report
                         └────┬────┘
                ┌─────────┬───┴───┬──────────┐
                │         │       │          │
          ┌─────┴────┐ ┌──┴──┐ ┌──┴──┐ ┌────┴─────┐
          │EDUCATION │ │MKTG │ │SALES│ │COMMUNITY │
          │ Director │ │ Dir │ │ Dir │ │ Director │
          └────┬─────┘ └──┬──┘ └──┬──┘ └────┬─────┘
               │          │       │          │
     ┌─────────┤     ┌────┤    ┌──┤     ┌────┤
     │         │     │    │    │  │     │    │
  ┌──┴──┐ ┌───┴──┐ ┌┴─┐ ┌┴─┐ ┌┴─┐┌┴─┐ ┌┴──┐┌┴──┐
  │AMARA│ │ASSESS│ │CT│ │VS│ │EN││UP│ │WEL││SUP│
  │tutor│ │track │ │  │ │  │ │  ││  │ │   ││   │
  └─────┘ └──────┘ └──┘ └──┘ └──┘└──┘ └───┘└───┘

  STUDENT-FACING: Amara, Concierge (via Sales), Welcome, Support
  INTERNAL: CEO, 4 Directors, Content, Visibility, Assessment, Enrollment, Upsell
```

### The Board (Debby)

Debby is human. She teaches, makes strategic decisions, approves budgets.
The agents run the school. She gets a weekly board report from the CEO.

### C-Suite

| Agent | UID | Role | Reports to |
|-------|-----|------|------------|
| **CEO** | `debby:ceo` | Runs the school. Coordinates directors. Weekly board report to Debby. Escalates blockers. | Debby (human) |

### Directors (4)

| Agent | UID | Role | Team |
|-------|-----|------|------|
| **Director of Education** | `debby:edu` | Curriculum, tutor quality, student outcomes. Owns Amara. | Amara, Assessment |
| **Director of Marketing** | `debby:mktg` | Brand, content, SEO, visibility. Drives awareness. | Content, Visibility |
| **Director of Sales** | `debby:sales` | Leads, conversions, enrollment, upsells. Owns the funnel. | Concierge, Enrollment, Upsell |
| **Director of Community** | `debby:community` | Retention, engagement, student support, testimonials. | Welcome, Support |

### Student-Facing Agents

| Agent         | UID               | Role                                                                                        | Pillar              | Price     |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------- | ------------------- | --------- |
| **Amara**     | `debby:amara`     | AI Tutor Practice Buddy. Warm, patient, remembers mistakes, celebrates wins. Debby's voice. | Lingua / Flex Nexus | $29-49/mo |
| **Concierge** | `debby:concierge` | First contact. Placement quiz. Routes to right program. Answers "what's Elevare?"           | All                 | Free      |
| **Welcome**   | `debby:welcome`   | Onboarding after enrollment. Community intro. Sets expectations. First-week check-in.       | All                 | Free      |
| **Support**   | `debby:support`   | Billing, scheduling, tech help, escalation to human tutors.                                 | All                 | Free      |

### Internal Agents

| Agent | UID | Role | Director |
|-------|-----|------|----------|
| **Content** | `debby:content` | Blog posts, social copy, email sequences, ad scripts. | Marketing |
| **Visibility** | `debby:visibility` | SEO, AI citations, schema markup, search presence. | Marketing |
| **Assessment** | `debby:assessment` | Track student progress. Spaced repetition. Mastery signals. | Education |
| **Enrollment** | `debby:enrollment` | Convert leads to paying students. Discovery calls. Handle objections. | Sales |
| **Upsell** | `debby:upsell` | Lingua → Flex Nexus upgrades. AI Tutor add-on. Rise intro. | Sales |

### Signal Flow

```
Prospective student messages @Elevareworksbot
    │
    ▼
  Concierge (debby:concierge)
    ├── "I want to learn English" → placement quiz → Enrollment
    ├── "How much does it cost?" → pricing → Enrollment
    ├── "What's Elevare?" → brand story → warm handoff
    └── "I'm already a student" → routes to Amara or Support
                                      │
New student enrolls (Whop webhook)    │
    │                                  │
    ▼                                  ▼
  Welcome (debby:welcome)          Amara (debby:amara)
    │ first-week onboarding          │ daily practice sessions
    │ community intro                │ pronunciation drills
    │ expectations                   │ conversation practice
    │                                │ progress tracking
    ▼                                ▼
  Community loop                   Assessment (debby:assessment)
    │ engagement                     │ mastery signals → mark()
    │ events                         │ struggles → warn()
    │ retention                      │ weekly report to Director of Education
    ▼                                │
  Support (debby:support)            ▼
    │ billing/scheduling           Upsell (debby:upsell)
    │ tech help                      │ "You've completed 20 sessions,
    │ escalate to Debby              │  ready for Flex Nexus Intensive?"
    └────────────────────────────────┘
```

### Pheromone Learning

The substrate learns which paths produce results:

```
student → concierge → enrollment → welcome → amara    (happy path, mark all)
student → concierge → enrollment                       (drop-off, warn enrollment)
student → amara → assessment → upsell → enrollment     (upsell path, mark if converts)
student → support                                       (issue, warn on source path)
```

Every student interaction is a signal. Every completion is a `mark()`.
Every drop-off is a `warn()`. The school gets smarter with every student.

---

## Donal's TODO Template Test

Donal used Tony's `TODO-template.md` (v3.0.0) to create `TODO-elevare-debby.md`.
He documented 7 template-mismatch adaptations where ONE-specific scaffolding
(TypeDB, DSL.md, dictionary.md, rubrics.md, `bun run verify`) doesn't exist in
agency-operator. His suggestion: add a "scaffolding check" to v3.1 that gracefully
degrades to host-repo equivalents.

The wave pattern held. The scaffolding files didn't. Real-world validation.

---

## Key Files (in Donal's repo)

| File | What |
|------|------|
| `docs/handover-debby-start-here-2026-04-15.md` | Week 1 checklist (Debby-facing) |
| `docs/handover-debby-actions-2026-04-15.md` | Action plan + blocker table |
| `docs/TODO-elevare-debby.md` | 3-cycle TODO (WIRE/PROVE/GROW) |
| `docs/handover-elevare-master-plan-2026-04-15.md` | Full master plan (143KB, 1839+ lines) |
| `chat-b-output/debby-11labs-quickstart.md` | 11Labs voice clone quickstart for Debby |

All at `onlineoptimisers/agency-operator` — Tony has write access.

---

## Commercial Structure (Locked)

- **No rev-share. No equity. Pure friendship.**
- Donal doesn't enter online-English-teaching space
- Debby doesn't enter marketing-agency space
- Both can make bots sellable elsewhere
- Debby's skills/agents are HER proprietary asset
- Donal's agency internals stay in his stack

---

## Student Personas (5 Archetypes)

Every agent decision flows from **who the student actually is**. Not demographics — psychographics.
The concierge routes by archetype. Amara adapts tone. Upsell triggers differ per persona.

### 1. The Career Climber

```
WHO:    Professional (25-40), non-English-speaking country, needs English for promotion
WHERE:  Brazil, Turkey, Vietnam, Thailand, Japan, South Korea
INCOME: $800-3000/mo — English coaching is an investment, not a luxury
```

**Hopes:** Present confidently in English. Get promoted. Stop being the quiet one in global meetings.
**Fears:** Sounding stupid in front of colleagues. Losing credibility. Being "found out" as not fluent.
**Dreams:** Leading a meeting in English without rehearsing every sentence. Getting the international posting.
**Problems:** Studied English in school but can't *use* it. Grammar is fine, confidence is broken. No one to practice with who won't judge.

**Debby's solution:** Lingua Live ($149/mo) for real conversation with a human who celebrates small wins. Amara ($29/mo) for daily practice between live sessions — freeform mode for meeting prep, scenario mode for presentation rehearsal.

**Entry:** Google search "English for work" → Concierge → placement quiz → Lingua trial.
**Upsell trigger:** After 10 Amara sessions + Assessment flags "presentation anxiety pattern" → Rise confidence coaching.

---

### 2. The Shy Returner

```
WHO:    Adult (30-55), learned English years ago, lost it, wants it back
WHERE:  Global — Europe, Latin America, SE Asia, Middle East
INCOME: Variable — price-sensitive, needs to see value fast
```

**Hopes:** Stop apologising for their English. Travel without anxiety. Watch Netflix without subtitles.
**Fears:** Being judged. "Too old to learn." Starting over feels humiliating. Wasting money on another course that doesn't stick.
**Dreams:** Ordering food in London without pointing at the menu. Having a real conversation with their kid's English teacher. Reading a book in English — the whole thing.

**Debby's solution:** Amara first ($29/mo) — low commitment, no human judgment, practice at 2am if you want. Amara's warmth + patience is designed for exactly this person. Pronunciation drills catch the rust. Spaced repetition rebuilds what was lost.

**Entry:** Instagram post "You don't need perfect English" → DM → Concierge → free Amara trial.
**Upsell trigger:** After 15 sessions + Assessment flags "plateau in spoken fluency" → Lingua Live for human breakthrough.

---

### 3. The Exam Warrior

```
WHO:    Student or professional (18-35), needs IELTS/TOEFL/Cambridge for university or visa
WHERE:  India, Pakistan, Nigeria, Philippines, China, Iran
INCOME: Often family-funded — high stakes, price-conscious but will pay for results
```

**Hopes:** Pass the exam. Get the score. Move on with life.
**Fears:** Failing and having to retake ($250+ per attempt). Running out of time. Visa denied.
**Dreams:** University admission letter. Work visa approved. Starting a new life.

**Debby's solution:** Flex Nexus Intensive ($497, 30 days) — structured, daily, relentless. Amara in lesson-guided mode with exam-specific modules. Assessment tracks score predictions. Human sessions for essay review + speaking mock exams.

**Entry:** Google "IELTS prep online" → landing page → Concierge → placement test (scored) → Flex Nexus.
**Upsell trigger:** Post-exam → "You passed! Now maintain it" → Lingua monthly for ongoing fluency.

---

### 4. The Expat Parent

```
WHO:    Parent (30-50), moved to English-speaking country or international community
WHERE:  Chiang Mai (Debby's backyard), Dubai, Singapore, Berlin, Amsterdam
INCOME: Dual-income household — can afford coaching, time is the constraint
```

**Hopes:** Help kids with homework. Talk to teachers confidently. Make local friends.
**Fears:** Kids are embarrassed by parent's English. Being excluded from parent groups. Passing on bad habits.
**Dreams:** Reading bedtime stories in English. Volunteering at school. Feeling at home.

**Debby's solution:** Lingua Live ($149/mo) — conversational focus, parenting vocabulary, social English. Amara for daily vocabulary building around school/home life scenarios.

**Entry:** Chiang Mai coworking word-of-mouth → WhatsApp → Concierge → free coffee chat with Debby.
**Upsell trigger:** After 3 months → "Your English is great now — want to help other parents?" → Rise confidence coaching for public speaking at school events.

---

### 5. The Digital Nomad

```
WHO:    Remote worker (25-40), English is their work language but not native
WHERE:  Chiang Mai, Bali, Lisbon, Medellin, Tbilisi
INCOME: $2000-6000/mo — money isn't the issue, time is
```

**Hopes:** Sound professional in async communication. Stop re-reading every email 3 times. Nail the client call.
**Fears:** Losing clients because of communication gaps. Being underestimated. Accent anxiety on video calls.
**Dreams:** Writing proposals that sound native. Running workshops in English. Building an English-language personal brand.

**Debby's solution:** Amara ($29/mo) for daily writing practice + scenario mode for client call rehearsal. Lingua Live ($179/mo) for polishing — advanced grammar, idioms, business writing.

**Entry:** Nomad forum post / coworking flyer → Concierge → skill assessment → Amara trial.
**Upsell trigger:** Assessment detects "writing quality > speaking quality" gap → Rise for presentation confidence.

---

## Product Catalog (USDC on Sui)

Every product is a **priced capability** in TypeDB. Every purchase is a **signal** that deposits pheromone.
Sui enables: micropayments (no $497 upfront for emerging markets), on-chain receipts, escrow for live sessions, and completion credentials as soul-bound tokens.

### Pay-per-use (Sui micropayments)

| Product | Capability | USDC | Sui Skill ID | Agent |
|---------|-----------|-----:|-------------|-------|
| Amara Practice (20 min) | `debby:amara:practice` | $0.50 | `amara-practice` | Amara |
| Amara Lesson (30 min, guided) | `debby:amara:lesson` | $1.00 | `amara-lesson` | Amara |
| Pronunciation Drill (10 min) | `debby:amara:pronunciation` | $0.25 | `amara-drill` | Amara |
| Scenario Rehearsal (20 min) | `debby:amara:scenario` | $1.00 | `amara-scenario` | Amara |
| Progress Report | `debby:assessment:report` | $2.00 | `assess-report` | Assessment |
| Placement Quiz | `debby:concierge:placement` | Free | — | Concierge |

**Why micropayments matter:** A career climber in Vietnam earning $1000/mo can't commit to $149/mo subscription. But $0.50 per practice session? That's 2 sessions for the price of a coffee. The substrate tracks usage → when a student hits 20 sessions/month, Enrollment auto-offers the subscription at a discount.

### Subscriptions (USDC monthly, Sui escrow)

| Product | Capability | USDC/mo | What's included | Target persona |
|---------|-----------|--------:|-----------------|---------------|
| **Amara Monthly** | `debby:amara:*` | $29 | Unlimited AI practice (all 4 modes) | Shy Returner, Digital Nomad |
| **Lingua Live** | `debby:lingua:live` | $149 | 4× live 1:1 sessions + Amara unlimited | Career Climber, Expat Parent |
| **Lingua Premium** | `debby:lingua:premium` | $179 | 6× live 1:1 + Amara + priority booking | Digital Nomad, Career Climber |
| **Rise Confidence** | `debby:rise:session` | $79/session | Live confidence coaching — presentation, interview, public speaking | Any (upsell) |

### One-time Products (Sui escrow, released in tranches)

| Product | Capability | USDC | Structure | Target persona |
|---------|-----------|-----:|-----------|---------------|
| **Flex Nexus Intensive** | `debby:flex:intensive` | $497 | 30 days, daily 1:1 + AI. Escrow releases weekly (4 × $124.25) | Exam Warrior |
| **Rise Workshop** | `debby:rise:workshop` | $197 | 4-session group confidence intensive | Career Climber, Expat Parent |

### On-chain Credentials (Sui SBTs — free, earned)

| Credential | Trigger | What it proves |
|-----------|---------|----------------|
| **Elevare Starter** | Complete 10 Amara sessions | "I showed up" |
| **Lingua Confident** | 30 days Lingua + Assessment score > 70% | "I can hold a conversation" |
| **Flex Nexus Graduate** | Complete 30-day intensive | "I did the hard thing" |
| **Rise Speaker** | Complete Rise workshop + deliver 5-min speech | "I own the room" |

SBTs are social proof. A student shares "Lingua Confident" on LinkedIn → their network sees Elevare → organic growth. Cost to Debby: zero. Value: infinite.

### Payment Flow (Sui)

```
Student → USDC → Sui escrow (smart contract)
                    │
                    ├── Pay-per-use: instant release to Debby's wallet on session complete
                    │     signal: mark(student→amara, weight=price)
                    │
                    ├── Subscription: monthly release, cancel anytime
                    │     signal: mark(student→lingua, weight=price/sessions)
                    │
                    └── Intensive: 4 weekly tranches, released on Week N completion
                          signal: mark(student→flex, weight=tranche) per week
                          warn(student→flex, 0.5) if student misses 3+ days
```

Every payment is a mark(). Every dropout is a warn(). The substrate learns which products work for which personas.

---

## Student Lifecycle (Full Journey)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE ELEVARE STUDENT JOURNEY                       │
├─────────┬───────────┬──────────┬───────────┬──────────┬─────────────┤
│ ATTRACT │  ENGAGE   │  ENROLL  │  PRACTICE │  GROW    │  ADVOCATE   │
│         │           │          │           │          │             │
│ Content │ Concierge │ Enroll   │ Amara     │ Upsell   │ Community   │
│ Mktg    │ Welcome   │ Support  │ Assess    │ Rise     │ Testimonial │
│ Social  │           │          │ Edu Dir   │ Sales    │ SBT mint    │
├─────────┼───────────┼──────────┼───────────┼──────────┼─────────────┤
│ signal  │ signal    │ signal   │ signal    │ signal   │ signal      │
│  ↓      │  ↓        │  ↓       │  ↓        │  ↓       │  ↓          │
│ mark if │ mark if   │ mark if  │ mark per  │ mark if  │ mark if     │
│ click   │ quiz done │ payment  │ session   │ upgrade  │ testimonial │
│ warn if │ warn if   │ warn if  │ warn if   │ warn if  │ warn if     │
│ bounce  │ abandon   │ fail pay │ 3d gap    │ decline  │ churn       │
└─────────┴───────────┴──────────┴───────────┴──────────┴─────────────┘
```

### Stage 1: ATTRACT (Content + Visibility + Marketing Director)

Student doesn't know Elevare exists yet.

- **Content agent** publishes 3 posts/week: 1 blog (SEO), 1 Instagram (emotional), 1 short video (TikTok/Reels)
- **Visibility agent** runs the legacy SEO pod (ai-ranking → citation → schema → social)
- Topics tied to persona pain: "Why you freeze in English meetings" (Career Climber), "It's not too late" (Shy Returner)
- Every click is a signal. Content that attracts students who convert → mark(). Content that attracts bounces → warn().
- **The substrate learns which content attracts which persona** and routes Content's next brief accordingly.

### Stage 2: ENGAGE (Concierge)

Student messages @Elevareworksbot on Telegram or visits elevare.work.

- Concierge runs a **placement conversation** (not a quiz — a warm chat that reveals level + persona + pillar fit)
- Identifies archetype within 5 messages: "Are you learning for work, travel, an exam, or just for yourself?"
- Routes to the right product recommendation
- If student goes cold: 1 follow-up at 24h, 1 at 72h, then dissolve (no spam)

### Stage 3: ENROLL (Enrollment + Support)

Student decides to pay.

- Enrollment handles objections: "Is the AI tutor as good as a human?" → honest answer + free trial offer
- Support handles Sui wallet setup for students who've never used crypto
  - Simple path: pay with card via on-ramp (MoonPay/Transak), receive USDC, pay Elevare
  - Crypto-native path: send USDC directly to contract
- **First payment = strongest signal.** mark(student→elevare, weight=price) deposits heavy pheromone.

### Stage 4: PRACTICE (Amara + Assessment)

The core loop. Where students spend 80% of their time.

```
Student opens Amara
    │
    ├── Choose mode: freeform / lesson / pronunciation / scenario
    │
    ├── Amara runs session (20-30 min)
    │   └── Side-car emits per turn: {mistakes, new_vocab, praise, lesson_tag, flag}
    │
    ├── Assessment reads side-car
    │   ├── Updates student_state in R2
    │   ├── Tracks spaced repetition (mistakes resurface after 1d, 3d, 7d, 14d)
    │   └── Computes progress score
    │
    └── Session ends → mark(student→amara, depth=sessionCount)
        signal: { receiver: 'debby:assessment:track', data: { student, session } }
```

**Context sharing:** Assessment writes `student_state.json` to R2 per student. Amara reads it before every session. Same state is readable by any agent that needs it (Upsell checks milestones, Support answers "how am I doing?", CEO aggregates for board report).

### Stage 5: GROW (Upsell + Sales Director)

Data-driven, not calendar-driven. Triggered by milestones, not timers.

| Trigger | Source | Upsell | Target persona |
|---------|--------|--------|---------------|
| 20 pay-per-use sessions in 30 days | Assessment | "Save 40% with Amara Monthly" | Shy Returner |
| Assessment score > 60% + "speaking < writing" gap | Assessment | Lingua Live for human conversation | Digital Nomad |
| 10 Amara sessions + "presentation anxiety" tag | Assessment | Rise confidence session | Career Climber |
| Lingua 3 months + "plateau" flag | Assessment | Flex Nexus Intensive | Any |
| Flex Nexus complete + exam score reported | Assessment | "Maintain it — Lingua monthly" | Exam Warrior |

**Upsell agent watches Assessment signals.** When a milestone fires, Upsell composes a personalised message (not a generic promo) and routes through the student's preferred channel (Telegram DM, email, in-app). One shot. If declined, dissolve — no nagging.

### Stage 6: ADVOCATE (Community + Welcome)

The cheapest acquisition channel: a happy student telling their friend.

- After 30 days, Community sends: "Your English has improved X%. Would you share a quick testimonial?"
- Testimonial captured → Content turns it into a social post / blog quote
- Completion SBT minted on Sui → student shares on LinkedIn/social
- Referral: "Invite a friend, both get a free Amara week" — tracked on-chain

---

## Agent Skills Matrix (Lean Team)

13 agents. Every agent has 1-3 skills max. No agent duplicates another's job.
All on `llama-4-maverick` (free via Groq) — upgrade to Sonnet/Haiku only when a skill demands quality the free model can't deliver.

### Leadership Layer (coordinate, don't execute)

| Agent | Skills | Why it exists | Reads from | Writes to |
|-------|--------|--------------|-----------|----------|
| **CEO** | `report`, `coordinate` | Weekly board report to Debby. Escalates blockers. Routes cross-department signals. | All directors | Debby (Telegram) |
| **Edu Director** | `curriculum`, `quality` | Owns what students learn. Reviews Amara's session quality. Sets lesson plans. | Assessment data, student_state | Amara config, lesson plans |
| **Mktg Director** | `campaign`, `brand` | Owns what the world sees. Briefs Content + Visibility. Guards brand voice. | Community testimonials, enrollment data | Content briefs, campaign plans |
| **Sales Director** | `pipeline`, `pricing` | Owns the funnel numbers. Manages Concierge → Enrollment → Upsell flow. | Enrollment conversions, upsell data | Pricing adjustments, lead routing |
| **Community Director** | `retention`, `testimonial` | Owns post-enrollment happiness. Manages Welcome + Support. | Support tickets, churn data | Retention interventions, testimonial requests |

### Student-Facing Layer (the ones students talk to)

| Agent | Skills | Priced? | Context needed | Shares back |
|-------|--------|---------|---------------|------------|
| **Concierge** | `welcome`, `placement` | Free | None (cold start) | Persona archetype, level estimate, pillar recommendation |
| **Amara** | `practice`, `lesson`, `pronunciation`, `scenario` | Yes (USDC) | `student_state.json` from R2 | Side-car per turn → Assessment |
| **Welcome** | `onboard` | Free | Enrollment data, persona | First-week checklist completion |
| **Support** | `help` | Free | Student billing, scheduling state | Escalation signals to Community |

### Internal Layer (work that students never see)

| Agent | Skills | Director | What it produces |
|-------|--------|----------|-----------------|
| **Assessment** | `track` | Education | `student_state.json` updates, progress scores, milestone signals |
| **Content** | `write` | Marketing | Blog posts, social copy, email sequences, ad scripts |
| **Enrollment** | `convert` | Sales | Objection handling, payment guidance, conversion |
| **Upsell** | `upgrade` | Sales | Personalised upgrade offers triggered by milestones |

### Legacy SEO Pod (retained, reports to Visibility → Marketing)

10 agents from Donal's marketing world. Priced in USDC on Sui.
These are Debby's **proprietary B2B asset** — she can sell SEO services to other language schools.

---

## Context Sharing (How Agents Stay Smart Together)

Three mechanisms. No shared database. No monolith.

### 1. Student State (R2 JSON — per student)

```typescript
// R2 key: students/{student_id}/state.json
interface StudentState {
  id: string
  persona: 'career' | 'shy' | 'exam' | 'parent' | 'nomad'
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  pillar: 'lingua' | 'rise' | 'flex'
  enrolled: string[]                      // active product IDs
  sessions: number                        // total Amara sessions
  lastSession: string                     // ISO date
  mistakes: { word: string, count: number, nextReview: string }[]
  vocab: { word: string, mastered: boolean, introduced: string }[]
  milestones: string[]                    // achieved milestone IDs
  flags: string[]                         // 'plateau', 'anxiety', 'exam-prep', etc.
  suiAddress?: string                     // student's Sui wallet
}
```

**Who reads:** Amara (before every session), Assessment (after every session), Upsell (on milestone), Support (on help request), CEO (aggregated for board report).

**Who writes:** Assessment (primary), Enrollment (on signup), Welcome (on onboard complete).

**Rule:** One writer per field. Assessment owns learning data. Enrollment owns billing data. No conflicts.

### 2. Pheromone (Substrate — automatic)

Every signal between agents deposits mark/warn. No agent needs to "share context" explicitly — the substrate *is* the shared context.

```
student→concierge→enrollment→welcome→amara    all mark() → happy path strengthens
student→concierge→enrollment                   enrollment warn() → funnel leak detected
student→amara (20 sessions)→assessment→upsell  milestone path → upsell confidence grows
student→support                                 support volume → Community adjusts
```

**What the substrate learns over time:**
- Which persona → product paths convert best
- Which content topics attract students who stay
- Which upsell timing works (too early = decline, too late = churn)
- Which Amara modes produce the fastest progress
- Which students are at risk (3-day gap + declining session length)

### 3. Signals (explicit cross-agent messages)

When an agent needs to tell another agent something *now*, it sends a signal.

```typescript
// Assessment detects milestone → tells Upsell
signal({ receiver: 'debby:upsell:upgrade', data: {
  student: 'student-123',
  trigger: '20-sessions',
  persona: 'shy',
  recommendation: 'amara-monthly'
}})

// Community captures testimonial → tells Content
signal({ receiver: 'debby:content:write', data: {
  type: 'testimonial-post',
  student: 'Maria',
  quote: 'I stopped apologising for my English after 2 weeks with Amara',
  pillar: 'lingua'
}})

// CEO weekly aggregate → tells Debby
signal({ receiver: 'debby:ceo:report', data: {
  period: 'week-3',
  students: 47,
  mrr: 1230,
  churn: 2,
  topPath: 'concierge→enrollment→amara',
  risk: 'exam-warriors churning post-exam — need retention offer'
}})
```

---

## Lean Team Strategy

### Why 13 agents, not 5 or 30

**5 would be too few:** A single "sales" agent can't do concierge warmth AND enrollment pressure AND upsell timing. Different skills need different prompts. Combining them produces mediocre everything.

**30 would be too many:** Every agent is a prompt to maintain, a model call to pay for, a path to keep warm. Debby can't oversee 30 agents. The CEO can barely coordinate 4 directors + the substrate helps.

**13 is the right number because:**
- 5 leaders (CEO + 4 directors) = management layer
- 4 student-facing (Concierge, Amara, Welcome, Support) = the experience
- 4 internal (Assessment, Content, Enrollment, Upsell) = the machine

Each agent has 1-3 skills. Total skills across the school: ~20. Each skill maps to a TypeDB capability with a price. The substrate routes by weight. Agents that don't produce results get warn()'d — their paths weaken. The team self-prunes.

### Model Routing (Cost Control)

| Tier | Model | Cost | Used for |
|------|-------|------|----------|
| **Free** | Llama 4 Maverick (Groq) | $0 | Directors, internal agents, coordination |
| **Cheap** | Haiku 4.5 | ~$0.001/call | Pronunciation drills, placement quiz, support FAQ |
| **Quality** | Sonnet 4.6 | ~$0.01/call | Amara freeform + scenario, Content blog posts |
| **Rare** | Opus | ~$0.10/call | CEO board report (weekly), curriculum review (monthly) |

**Rule:** Start everything on Llama/Groq. Upgrade to Sonnet ONLY when a student-facing skill produces measurably worse outcomes on the free model. The substrate detects this — if Amara-on-Llama gets more warn() than Amara-on-Sonnet, the L5 evolution loop auto-upgrades.

### Debby's Workload (What She Actually Does)

```
Per week:
  - Read CEO board report (10 min)
  - Teach 4-6 live Lingua sessions (4-6 hours)
  - Teach 1-2 Rise confidence sessions (1-2 hours)
  - Approve/reject any budget change CEO proposes (5 min)
  - Record one Instagram story about teaching (5 min)

Per month:
  - Review Assessment dashboard (student progress, 30 min)
  - Meet Donal for strategy (30 min)
  - Approve any new agent/skill before it goes live (15 min)

Everything else: agents handle it.
```

---

## Upsell Paths (Data-Driven)

```
                          ┌─── Rise Confidence ◄── "anxiety" flag
                          │
Pay-per-use ──► Amara Monthly ──► Lingua Live ──► Lingua Premium
    │                │                 │
    │                │                 └──► Flex Nexus (exam path)
    │                │
    │                └──► Rise Workshop (group, $197)
    │
    └──► (churn) ──► Win-back: "1 free session, we missed you"
```

### Upsell Rules

1. **Never upsell before session 5.** Let the student experience value first.
2. **One offer at a time.** If Upsell fires and student declines → 30-day cooldown.
3. **Data, not calendar.** "You've done 20 sessions" not "It's been 30 days."
4. **Honest downgrade too.** If a Lingua student only uses Amara, suggest dropping to Amara Monthly. Trust builds retention.
5. **Referral > upsell.** A student who refers a friend is worth more than an upgraded student. Community agent tracks referrals and rewards with free sessions (on-chain, transparent).

---

## Sui Integration (School-Specific)

### Agent Wallets

Every agent derives its Sui wallet from `SUI_SEED + agent UID`:

```
debby:amara     → 0xA1B2...  (receives practice payments)
debby:concierge → 0xC3D4...  (holds placement quiz escrow — $0, but wallet exists)
debby:ceo       → 0xE5F6...  (school treasury, CEO-managed)
```

**Revenue flow:**
```
Student USDC → Sui escrow contract → session complete → release to agent wallet
Agent wallet → end of day → sweep to school treasury (debby:ceo wallet)
School treasury → Debby's personal wallet (weekly sweep, CEO-initiated)
```

### On-chain State

| What | Where | Why on-chain |
|------|-------|-------------|
| Payment receipts | Sui events | Auditable, no disputes |
| Session completions | Sui events | Triggers escrow release |
| SBT credentials | Sui objects (soul-bound) | Student owns their proof |
| Referral tracking | Sui events | Transparent reward distribution |
| Subscription status | Sui time-locked escrow | Auto-cancel on non-renewal |

### What Stays Off-chain

| What | Where | Why off-chain |
|------|-------|--------------|
| Student state | R2 (Cloudflare) | Too much data, too frequent writes |
| Session transcripts | R2 | Privacy — never on-chain |
| Agent prompts | GitHub/TypeDB | Proprietary, iterable |
| Pheromone weights | TypeDB | Internal routing, no student visibility |

---

## Key Files (Source Reference)

### In this repo (envelopes)

| File | What |
|------|------|
| `agents/debby/*.md` | 24 agents (14 school + 10 legacy SEO) |
| `src/worlds/debby-marketing.ts` | WorldSpec, agent lists, alliance pre-seeding |
| `src/pages/chat-debby.astro` | Web chat page (prerendered, client:only) |
| `src/components/ai/DebbyChat.tsx` | Chat component — canned answers + LLM + typing |
| `src/lib/chat/debby-dropdowns.ts` | 11 starter questions with answers, tags, receivers |
| `nanoclaw/src/units/student.ts` | Student memory module (shared by all claws) |
| `nanoclaw/src/personas.ts` | Debby persona = Elevare Concierge |
| `nanoclaw/wrangler.debby.toml` | Dedicated CF Worker config |
| `src/components/ai/ClawAdmin.tsx` | Admin dashboard (shared, configurable) |
| `src/pages/chat-debby-admin.astro` | Debby's admin page |
| `nanoclaw/src/units/assessment.ts` | Mastery/struggle detection |
| `nanoclaw/src/units/welcome.ts` | Onboarding message templates |
| `nanoclaw/src/lib/proactive.ts` | Agent → student push messaging |
| `docs/PLAN-debby.md` | This file — master strategy doc |
| `docs/TODO-debby.md` | Practical task list — W1-W4 |

### In Donal's repo (onlineoptimisers/agency-operator)

| File | Lines | What |
|------|------:|------|
| `docs/handover-elevare-master-plan-2026-04-15.md` | 2221 | Full merged plan (143KB) — strategy, products, tech stack, Stage 4 deep-dive, security audit |
| `docs/TODO-elevare-debby.md` | 286 | 3-cycle TODO (WIRE/PROVE/GROW) using Tony's template |
| `docs/handover-debby-actions-2026-04-15.md` | 208 | Action plan for Debby — blocker sheet, 5 steps |
| `docs/handover-debby-start-here-2026-04-15.md` | 129 | Debby-facing Week 1 checklist |
| `docs/handover-elevare-tutor-ai-deepdive-2026-04-15.md` | 285 | Windows Claude deep-dive: 4 modes, architecture, persona, safety |
| `docs/handover-elevare-tutor-ai-proposal-2026-04-15.md` | 128 | Mac Claude proposal: pedagogy, state model, 5-stage loop |
| `chat-b-output/debby-11labs-quickstart.md` | 49 | 11Labs voice clone quickstart for Debby |

---

## Open Questions (Carry-forward)

### From Donal's Deep-Dive (5 questions, unanswered)

1. **Voice branding:** Is the AI tutor "Amara" (separate character) or "Debby's AI" (extension of her)?
2. **Human coach handoff:** When Amara detects she's out of her depth, how does the student experience the transition to Debby?
3. **Off-topic handling:** Student asks Amara about Thai visa advice — redirect, answer briefly, or refuse?
4. **Retention window:** If a student goes quiet for 7 days, who reaches out — Amara, Support, or Community?
5. **Orpheus fallback:** If voice clone degrades, does Amara go text-only or switch to a generic TTS?

### From This Strategy Doc (new questions)

6. **Sui onboarding:** Most English students have never used crypto. What's the simplest path to "pay with USDC"?
7. **Pricing localisation:** Should pay-per-use be cheaper in low-income countries? (Sui enables this — different prices per region)
8. **B2B play:** Can Debby white-label the Amara tutor for other language schools? (Her SEO pod already serves B2B)
9. **Multi-language:** Amara teaches English. But the concierge should speak the student's native language for onboarding. Which languages first?
10. **Data portability:** If a student leaves, do they get their learning data? (GDPR says yes. Sui SBTs are already theirs.)

---

## Commercial Structure (Locked)

- **No rev-share. No equity. Pure friendship.**
- Donal doesn't enter online-English-teaching space
- Debby doesn't enter marketing-agency space
- Both can make bots sellable elsewhere
- Debby's skills/agents are HER proprietary asset
- Donal's agency internals stay in his stack

---

## Implementation Status (2026-04-16)

**15 of 24 tasks done.** See `docs/TODO-debby.md` for the full task list.

W1 (Infrastructure) and W2 (Student Memory) are complete. W3 (Agent Wiring) is next — connecting the agent graph so signals flow through agents and back to students.

### What's Live

| Channel | URL | Persona | Model |
|---------|-----|---------|-------|
| Telegram | @Elevareworksbot | Concierge | Llama 4 Maverick (Groq direct) |
| Web | `/chat-debby` | Concierge | Llama 4 Maverick (Groq direct) |
| Admin dashboard | `/chat-debby-admin` | ClawAdmin | — (monitoring only) |

**Admin features live:**
- `/conversations` API — list active conversations (shared nanoclaw infra)
- `/conversations/:group/reply` — admin injects message + pushes to student
- Onboarding drip — auto-advances new → welcomed → first-session → active
- Assessment agent — mastery/struggle detection every 5 sessions, milestone triggers
- Side-car extraction — tutoring tags detected → mistakes/vocab/praise parsed from LLM replies
- Proactive messaging — sendToStudent() resolves uid → group_id → channel push
- 5 tutoring tag patterns in classifier (education, practice, pronunciation, assessment, confidence)

### What's Built (Substrate Infra)

| Feature | File | Shared by |
|---------|------|-----------|
| Deterministic sandwich | `router.ts` | All claws |
| Direct Groq routing | `router.ts resolveLLM()` | All claws |
| Student memory + profiles | `units/student.ts` | All claws |
| Side-car storage schema | D1 `amara_sidecar` | All claws |
| Canned answers + prefill | `router.ts` prefill path | All claws |
| CORS | `router.ts` middleware | All claws |
| Pheromone tagging | `dropdowns.ts` → `/signal` | Debby-specific tags |
| Typing animation | `DebbyChat.tsx` | Debby web chat |
| afterResponse() hook | `router.ts` | All claws |
| ClawAdmin component | `ClawAdmin.tsx` | All claws (configurable clawUrl + adminName) |
| /conversations + /reply API | `router.ts` | All claws |
| Assessment unit | `units/assessment.ts` | All claws |
| Proactive messaging | `lib/proactive.ts` | All claws |
| Tutoring classifier tags | `classify-fallback.ts` | All claws |

### What's Next

- Weekly assessment summary to debby:edu (needs cron)
- Churn detection — "haven't been back in 5 days" (needs cron)
- Student API endpoints (GET /student/:uid, GET /students)
- Auth on admin page (currently open)

---

*Teacher first. Tech second. The AI serves the student, not the other way around.*
