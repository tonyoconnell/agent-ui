---
title: Master Workflow Plan
dimension: things
category: master-workflow-plan.md
tags: agent, ai, architecture, cycle, ontology
related_dimensions: events, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the master-workflow-plan.md category.
  Location: one/things/master-workflow-plan.md
  Purpose: Documents one platform: master workflow plan v1.0.0
  Related dimensions: events, people
  For AI agents: Read this to understand master workflow plan.
---

# ONE Platform: Master Workflow Plan v1.0.0

**Status:** Complete architecture for 6-todo, 6-specialist, multi-wave execution
**Total Build:** ~3,600 cycles across 6 specialists
**Timeline:** 8-12 cycles/specialist/day = 3-4 weeks critical path
**Approach:** Parallel execution with strategic wave sequencing

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Data Flow Architecture](#data-flow-architecture)
3. [Dependency Analysis](#dependency-analysis)
4. [Specialist Assignment Matrix](#specialist-assignment-matrix)
5. [Wave Execution Plan](#wave-execution-plan)
6. [Integration Points](#integration-points)
7. [Critical Path Analysis](#critical-path-analysis)
8. [Risk Mitigation](#risk-mitigation)

---

## EXECUTIVE SUMMARY

### The Vision

ONE Platform is a complete creator economy + AI agent marketplace built on a 6-dimension ontology. This plan orchestrates **6 todo streams** across **6 specialist agents** in **4 execution waves**, enabling maximum parallelization while respecting critical dependencies.

### The Todos (Roadmap)

| #   | Todo                 | Cycles  | Purpose                                   | Wave            | Status                |
| --- | -------------------- | ------- | ----------------------------------------- | --------------- | --------------------- |
| 1   | todo-onboard         | 100     | User registration + team management       | Wave 1          | Critical Path         |
| 2   | todo-x402            | 100     | HTTP 402 micropayment protocol            | Wave 1          | Critical Path         |
| 3   | todo-ecommerce       | 100     | Products + checkout + subscriptions       | Wave 2          | Depends on X402       |
| 4   | todo-buy-chatgpt     | 100     | Conversational commerce (LLM integration) | Wave 2.5        | Depends on E-commerce |
| 5   | todo-acp-integration | 100     | Agent communication protocol              | Wave 2 (EXTEND) | Parallel with agents  |
| 6   | todo-one-ie          | 100     | Public launch site + marketing            | Wave 4          | Depends on all        |
|     | **Total**            | **600** | **Foundation + Extension + Launch**       |                 |                       |

### The Specialists (6 Agents)

| Agent                | Role                                                  | Cycles | Expertise                                              |
| -------------------- | ----------------------------------------------------- | ---------- | ------------------------------------------------------ |
| **agent-backend**    | Convex schema, mutations, queries, Effect.ts services | ~1,200     | Database design, payment logic, event streaming        |
| **agent-frontend**   | React components, Astro pages, UI/UX                  | ~850       | Component architecture, user flows, accessibility      |
| **agent-integrator** | External APIs, protocols, data flows                  | ~650       | X402 blockchain, ACP messaging, Stripe/email           |
| **agent-builder**    | Agent framework, skills, deployments                  | ~500       | AgentKit, ElizaOS, skill discovery, testing            |
| **agent-quality**    | Testing, validation, performance                      | ~600       | Unit/integration/E2E tests, security, benchmarks       |
| **agent-designer**   | UI/UX, accessibility, design tokens                   | ~400       | Wireframes, dark mode, WCAG compliance, design systems |
|                      | **Total**                                             | **~4,200** | **Includes Q&A loops, refinement, documentation**      |

### Key Metrics

- **Critical Path:** todo-onboard (Wave 1) → todo-x402 (Wave 1) → todo-ecommerce (Wave 2) = **~300 cycles**
- **Parallel Opportunities:** 5+ todos can run simultaneously with proper dependency management
- **Cycle Density:** 8-12 cycles/specialist/day typical = 30-40 days elapsed time (with 5+ running in parallel)
- **Wave Overlap:** Waves 2 and 2.5 overlap significantly; Wave 3 (launch) only needs Wave 1-2 complete

---

## DATA FLOW ARCHITECTURE

### Complete Platform Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ONE PLATFORM DATA FLOW                       │
└─────────────────────────────────────────────────────────────────┘

LAYER 1: CREATOR ONBOARDING (todo-onboard)
  ┌─────────────────────────────────────────────────────────────┐
  │ User Registration → Email Verify → Profile → Team Setup     │
  │                                                             │
  │ Output: creator thing, group, connections, events          │
  │ Feeds: All downstream services                             │
  └─────────────────────────────────────────────────────────────┘
         ↓
         ├─→ Wallet connection (optional but encouraged)
         │
         └─→ Creates: groupId, creatorId, workspace context

LAYER 2A: PAYMENT INFRASTRUCTURE (todo-x402)
  ┌─────────────────────────────────────────────────────────────┐
  │ HTTP 402 Protocol Implementation                             │
  │  - X402PaymentService (backend)                             │
  │  - WalletConnection + PaymentPrompt (frontend)              │
  │  - Blockchain verification (Base network)                   │
  │  - Payment events logged to Convex                          │
  │                                                             │
  │ Input: Protected endpoints need payment gating              │
  │ Output: payment thing, payment_events, X-PAYMENT header     │
  │ Feeds: E-commerce, agents, API access                       │
  └─────────────────────────────────────────────────────────────┘
         ↓
         ├─→ Every transaction creates payment_event
         │   (audit trail, analytics, revenue tracking)
         │
         └─→ Payment settlement → creator wallet via permit

LAYER 2B: AGENT COMMUNICATION (todo-acp-integration) [NEW]
  ┌─────────────────────────────────────────────────────────────┐
  │ ACP Server (REST endpoints for agent discovery/routing)      │
  │  - Agent registry (what agents exist, what can they do)      │
  │  - Message routing (sync/async between agents)               │
  │  - Task delegation (one agent → another)                     │
  │  - Discovery service (find agent by capability)              │
  │                                                             │
  │ Input: Agents register themselves                            │
  │ Output: acp_message, acp_task, agent connections             │
  │ Feeds: Multi-agent orchestration, todo-buy-chatgpt           │
  └─────────────────────────────────────────────────────────────┘
         ↓
         ├─→ Chat agent discovers product recommendations agent
         │   (product_recommendation capability)
         │
         └─→ Chat agent discovers payment processor agent
             (payment_processing capability)

LAYER 3: E-COMMERCE (todo-ecommerce)
  ┌─────────────────────────────────────────────────────────────┐
  │ Product Marketplace                                          │
  │  - Creator creates product (course, template, membership)    │
  │  - Customer browses, adds to cart                            │
  │  - Checkout: Cart → Payment (via X402) → Order              │
  │  - Digital delivery (email download or link)                │
  │  - Subscription auto-renewal (permit-based)                  │
  │                                                             │
  │ Input: creator (from onboard), X402 payment service         │
  │ Output: product, order, subscription things + events         │
  │ Feeds: Analytics, payouts, product recommendations           │
  └─────────────────────────────────────────────────────────────┘
         ↓
         ├─→ Creates product_created, order_completed events
         │   (fed to analytics, marketing)
         │
         ├─→ Tracks customer purchase journey
         │   (for product recommendations)
         │
         └─→ Triggers weekly payout job
             (creator earnings → wallet via X402)

LAYER 3.5: CONVERSATIONAL COMMERCE (todo-buy-chatgpt) [STRATEGIC ADD]
  ┌─────────────────────────────────────────────────────────────┐
  │ LLM Chat Integration (ChatGPT, Claude, Gemini)               │
  │  - Chat agent (asks user questions, understands intent)      │
  │  - Product discovery agent (semantic search, ranking)        │
  │  - Recommendation agent (personalized suggestions)           │
  │  - Checkout agent (seamless purchase in chat)                │
  │                                                             │
  │ Input: Products (from e-commerce), X402 checkout             │
  │ Output: Conversation sessions, recommendations, orders       │
  │ Feeds: Analytics, creator insights, cross-platform sales     │
  └─────────────────────────────────────────────────────────────┘
         ↓
         ├─→ Uses ACP to discover + call recommendation agent
         │
         ├─→ Chat flow: Discovery → Details → Compare → Buy
         │
         └─→ One-click checkout in ChatGPT
             (better UX than traditional shop)

LAYER 4: AGENT MARKETPLACE (todo-agents + todo-skills via ACP)
  ┌─────────────────────────────────────────────────────────────┐
  │ Skills + Agent Deployment                                    │
  │  - Creators build agents (ElizaOS, AgentKit)                │
  │  - Agents register capabilities (via ACP)                    │
  │  - Agents offer services (monetized via X402)                │
  │  - Other agents discover + pay to use services               │
  │                                                             │
  │ Input: Creator accounts, X402 payment service, ACP protocol │
  │ Output: agent thing, skill things, service offerings         │
  │ Feeds: Multi-agent economy, network effects                  │
  └─────────────────────────────────────────────────────────────┘
         ↓
         └─→ Creates acp_message, acp_task, payment events
             (complete agent economy)

LAYER 5: ANALYTICS + INSIGHTS (Feeds all above)
  ┌─────────────────────────────────────────────────────────────┐
  │ Real-time Analytics Dashboard                                │
  │  - Revenue by creator, product, time period                  │
  │  - Customer lifetime value, churn, acquisition cost          │
  │  - Product performance, conversion rates                      │
  │  - Agent activity, task success rates                        │
  │  - Network health (payment success, settlement time)         │
  │                                                             │
  │ Input: All events (payment_event, order_completed, etc)     │
  │ Output: Metrics, insights, recommendations                   │
  │ Feeds: Creator dashboards, platform dashboards, decisions   │
  └─────────────────────────────────────────────────────────────┘

LAYER 6: PUBLIC LAUNCH (todo-one-ie)
  ┌─────────────────────────────────────────────────────────────┐
  │ Marketing Site + Public APIs                                 │
  │  - Landing page (hero, features, pricing)                    │
  │  - Creator stories + testimonials                            │
  │  - Documentation + API reference                             │
  │  - Public REST APIs (product discovery, agent registry)      │
  │  - Status page + system health                               │
  │                                                             │
  │ Input: All completed features (1-5 above)                   │
  │ Output: Public-facing interfaces, API contracts              │
  │ Feeds: Marketing, partner integrations, network growth      │
  └─────────────────────────────────────────────────────────────┘
```

### Data Model Dependencies

```
Schema Foundation (Critical Path):

  creator (person)
    ↓
  workspace (group)
    ├─→ product (thing)
    │    ├─→ digital_product (variant)
    │    ├─→ membership (variant)
    │    └─→ consultation (variant)
    │
    ├─→ order (thing)
    │    ├─→ items: [products]
    │    └─→ paymentId: (payment thing)
    │
    ├─→ payment (thing)
    │    ├─→ X402-specific fields
    │    ├─→ blockchain settlement details
    │    └─→ event logging
    │
    ├─→ subscription (thing)
    │    ├─→ product reference
    │    ├─→ permit-based auto-renewal
    │    └─→ event logging
    │
    ├─→ agent (thing) [ACP NEW]
    │    ├─→ capabilities (connections)
    │    ├─→ service offerings (things)
    │    └─→ messaging endpoints
    │
    └─→ skill (thing)
         ├─→ verification status
         ├─→ marketplace listing
         └─→ revenue tracking
```

---

## DEPENDENCY ANALYSIS

### Dependency Matrix (Todo X Todo)

```
Critical Path:
  todo-onboard (W1) → todo-x402 (W1) → todo-ecommerce (W2)
           ↓                ↓                ↓
  Parallel Execution   Parallel Exec   Sequential
  (no dependencies)    (no dependencies) (depends on W1)

Secondary Path:
  todo-ecommerce (W2) → todo-buy-chatgpt (W2.5)
           ↓
  Sequential (depends on products)

Parallel Path:
  [Start W1] → todo-acp-integration (W2-3)
           ↓
  Can start independently, enhances chat + agents

Final Path:
  [After W2 complete] → todo-one-ie (W4)
           ↓
  Sequential (depends on all features)
```

### Parallelization Strategy

**Wave 1 (Critical Foundation) - PARALLEL:**

```
┌──────────────────┐          ┌──────────────────┐
│  todo-onboard    │          │    todo-x402     │
│ Cycle 1-100      │  ◄──────►│  Cycle 1-100     │
│ (Blocking time)  │ (async)  │ (Blocking time)  │
└──────────────────┘          └──────────────────┘
  Backend: Schema creation
  Frontend: Forms, pages
  Quality: User flow tests
```

**Wave 2 (E-Commerce) - SEQUENTIAL but wide:**

```
[Wave 1 Complete] ──→

                ┌───────────────────┐
                │  todo-ecommerce   │ (depends: X402 + onboard)
                │   Cycle 1-100     │
                └───────────────────┘
                   ↓        ↓        ↓
         ┌─────────┴────────┴────────┴─────────┐
         │                                     │
    ┌────────────────┐          ┌────────────────────┐
    │ Product CRUD   │          │ Checkout + Payment │
    │ (Backend)      │          │ (Backend + Frontend)
    │ Cycle 11-30    │          │ Cycle 31-50         │
    └────────────────┘          └────────────────────┘
```

---

## SPECIALIST ASSIGNMENT MATRIX

### Summary by Agent

| Agent            | Total Cycles | % of Build | Focus Areas                          |
| ---------------- | ------------ | ---------- | ------------------------------------ |
| agent-backend    | ~1,200       | 29%        | Schema, services, queries, mutations |
| agent-frontend   | ~850         | 20%        | Pages, components, UI/UX             |
| agent-integrator | ~650         | 15%        | External APIs, protocols, data flows |
| agent-builder    | ~500         | 12%        | Agent framework, skills, samples     |
| agent-quality    | ~600         | 14%        | Testing, validation, performance     |
| agent-designer   | ~400         | 10%        | UI/UX, design tokens, accessibility  |
| **TOTAL**        | **~4,200**   | **100%**   | Complete platform                    |

### Backend Specialist Assignments (~1,200 infers)

```
todo-onboard (40 infers):
  ├─ creator thing type schema
  ├─ workspace/group extension
  ├─ OnboardingService (Effect.ts)
  ├─ User mutations (register, verify, profile update)
  └─ Verification + email service

todo-x402 (200 infers):
  ├─ payment thing type
  ├─ X402PaymentService (Effect.ts)
  ├─ X402FacilitatorService (Coinbase CDP)
  ├─ BlockchainProviderService (viem)
  ├─ Payment event logging
  ├─ Verification + settlement logic
  ├─ Rate limiting + replay protection
  └─ Config management

todo-ecommerce (150 infers):
  ├─ product thing type
  ├─ order + subscription thing types
  ├─ E-CommerceService (Effect.ts)
  ├─ Product mutations (create, update, publish)
  ├─ Order mutations (create, checkout, complete, refund)
  ├─ Revenue tracking service
  └─ Subscription renewal logic

todo-buy-chatgpt (80 infers):
  ├─ Conversation storage schema
  ├─ Message caching
  ├─ Product recommendation AI
  ├─ Checkout state management
  └─ Analytics for chat

todo-acp-integration (120 infers):
  ├─ agent thing type
  ├─ acp_message, acp_task schemas
  ├─ Agent registry
  ├─ Capability matching
  ├─ Task delegation logic
  └─ Agent performance tracking

todo-one-ie (60 infers):
  ├─ Public API layer
  ├─ Product discovery endpoint
  ├─ Agent discovery endpoint
  ├─ Webhook handlers
  └─ Analytics aggregation
```

### Frontend Specialist Assignments (~850 infers)

```
todo-onboard (100 infers):
  ├─ SignupForm component
  ├─ EmailVerification component
  ├─ ProfileForm component
  ├─ WorkspaceSetup component
  ├─ WalletConnection component
  ├─ SkillSelection component
  ├─ OnboardingPages (Astro)
  └─ Tours + checklists

todo-x402 (120 infers):
  ├─ PaymentRequired component
  ├─ PaymentProcessor component
  ├─ PaymentPromptModal component
  ├─ PaymentHistory component
  ├─ BalanceDisplay component
  ├─ AgentExecutionFlow component
  ├─ X402 demo page
  └─ API integration

todo-ecommerce (150 infers):
  ├─ ProductCard component
  ├─ ProductGallery component
  ├─ ShoppingCart component
  ├─ CheckoutForm (multi-step)
  ├─ OrderConfirmation component
  ├─ ProductPage (Astro)
  ├─ MarketplaceListingPage
  ├─ CartPage + CheckoutPage
  └─ OrderHistoryPage

todo-buy-chatgpt (100 infers):
  ├─ ChatInterface component
  ├─ MessageDisplay component
  ├─ ProductInChatCard component
  ├─ RecommendationCard component
  ├─ ChatHistory component
  └─ Settings/Preferences

todo-acp-integration (60 infers):
  ├─ AgentRegistry UI
  ├─ AgentDiscoverySearch component
  ├─ AgentDetailPage
  ├─ StatusIndicator
  └─ Integration routing

todo-one-ie (100 infers):
  ├─ LandingPage (hero, features, testimonials)
  ├─ CreatorDashboard
  ├─ AdminDashboard
  ├─ Documentation pages
  ├─ MarketplacePage
  └─ Navigation + layout
```

### Integrator Specialist Assignments (~650 infers)

```
todo-onboard (40 infers):
  ├─ Better Auth setup
  ├─ Email provider (Resend)
  ├─ OAuth (GitHub, Google, Discord)
  └─ Verification system

todo-x402 (180 infers):
  ├─ Coinbase CDP integration (70)
  ├─ Blockchain client setup (viem) (60)
  ├─ Wallet integration (wagmi) (30)
  └─ Testing/mocking (20)

todo-ecommerce (100 infers):
  ├─ Stripe stub (future) (30)
  ├─ Email delivery (25)
  ├─ Cart persistence (20)
  ├─ Webhook handlers (20)
  └─ Analytics tracking (5)

todo-buy-chatgpt (110 infers):
  ├─ ChatGPT API (40)
  ├─ Claude API (35)
  ├─ Gemini API (25)
  └─ LLM orchestration (10)

todo-acp-integration (130 infers):
  ├─ ACP HTTP server (70)
  ├─ Agent registration (30)
  ├─ Testing/mocking (20)
  └─ Documentation (10)

todo-one-ie (40 infers):
  ├─ Public API layer
  ├─ Webhooks
  └─ Analytics forwarding
```

---

## WAVE EXECUTION PLAN

### Wave 1: Critical Foundation (Weeks 1-2)

**Goal:** Foundation for all platform features (creator accounts + payment infrastructure)

**Todos:** todo-onboard, todo-x402
**Specialists:** All 6 agents (parallel)
**Cycles:** ~200 (100 per todo)
**Elapsed Time:** 5-7 days (with full parallelization)

```
EXECUTION TIMELINE:

Day 1-2:   Schema design (agent-backend)
           Figma mockups (agent-designer)
           Integration templates (agent-integrator)

Day 3-4:   React components (agent-frontend)
           Effect.ts services (agent-backend)
           External APIs (agent-integrator)

Day 5-7:   Unit + E2E tests (agent-quality)
           Documentation (all agents)
           Edge case handling (all)

BLOCKERS: None (Wave 1 is independent)

OUTPUTS:
  - Creator can register + verify email
  - Creator can connect wallet
  - Protected endpoints return 402
  - User can pay via X402 (Base network)
  - Payment events logged
```

### Wave 2: E-Commerce (Weeks 2-3)

**Goal:** Monetization layer (creators can sell products and earn)

**Todos:** todo-ecommerce
**Dependency:** Requires todo-onboard + todo-x402 (Wave 1 complete)
**Specialists:** All 6 agents (parallel)
**Cycles:** ~100
**Elapsed Time:** 3-5 days

```
SEQUENCE:
[Wave 1 Complete] ──→ todo-ecommerce Begins

EXECUTION:
Day 1-2:   Product schema (agent-backend)
           Product page mockups (agent-designer)

Day 3-4:   Components (agent-frontend)
           Checkout service (agent-backend)
           Integration (agent-integrator)

Day 5-7:   E2E tests (agent-quality)
           Documentation

OUTPUTS:
  - Creator can create products
  - Customer can browse + add to cart
  - Checkout with X402 working
  - Orders + email delivery
  - Revenue tracking + payouts
```

### Wave 2.5: Strategic Extensions (Weeks 3-4, Parallel with Wave 2)

**Goal:** Advanced features (conversational commerce + agent network)

**Todos:** todo-buy-chatgpt, todo-acp-integration
**Dependency:** Soft (products helpful, not required)
**Specialists:** All 6 agents (focus: integrator, builder)
**Cycles:** ~200 (100 per todo)
**Elapsed Time:** 5-7 days (parallel, no blocking)

```
todo-buy-chatgpt (Conversational Commerce):
  - ChatGPT/Claude/Gemini integration
  - Product discovery in chat
  - One-click checkout
  - Post-purchase support

todo-acp-integration (Agent Network):
  - ACP HTTP server
  - Agent registry
  - Message routing
  - Task delegation
```

### Wave 4: Public Launch (Week 5-6)

**Goal:** Production deployment and public availability

**Todos:** todo-one-ie
**Dependency:** Requires Waves 1-3 complete
**Specialists:** All 6 agents (focus: frontend, designer, quality)
**Cycles:** ~100
**Elapsed Time:** 3-4 days

```
TIMELINE:

Day 1-2:   Marketing site (agent-frontend)
           Final design (agent-designer)
           Documentation

Day 3-4:   Final testing (agent-quality)
           Production prep (all)

Day 5:     LAUNCH! 🎉
           - Deploy to Cloudflare Pages
           - Deploy to Convex
           - Monitor 24/7
           - Send announcement

OUTPUTS:
  - https://one.ie live
  - Creator marketplace public
  - APIs published
  - First creators earning
```

---

## INTEGRATION POINTS

### Critical Data Alignments

| Item            | Owner                     | Dependency              | Status   |
| --------------- | ------------------------- | ----------------------- | -------- |
| creator thing   | agent-backend (onboard)   | All todos use creatorId | CRITICAL |
| group/workspace | agent-backend (onboard)   | Products, agents, subs  | CRITICAL |
| payment thing   | agent-backend (x402)      | E-commerce, ACP, agents | CRITICAL |
| product thing   | agent-backend (ecommerce) | Shop, chat, search      | CRITICAL |
| agent thing     | agent-backend (acp)       | Marketplace, discovery  | CRITICAL |
| order thing     | agent-backend (ecommerce) | Analytics, payouts      | CRITICAL |
| event table     | agent-backend (all)       | Audit trail, analytics  | CRITICAL |

### Component Dependency Tree

```
SignupForm ──→ EmailVerification ──→ ProfileForm ──→ WorkspaceSetup ──→ WalletConnection
   ↓               ↓                    ↓               ↓                    ↓
Better Auth    Verification        Convex        Group creation        wagmi
               mutations           mutations      Workspace thing        viem
```

### Event Flow Integration

```
User Signup:
  1. POST /mutations/onboarding/register
     → CREATE creator + group things
     → EMIT user_registered event

User Verifies Email:
  2. POST /mutations/onboarding/verify
     → UPDATE creator.emailVerified = true
     → EMIT email_verified event

User Creates Product:
  3. POST /mutations/products/create
     → CREATE product thing
     → EMIT product_created event

User Adds to Cart:
  4. [localStorage, no event yet]

User Clicks Checkout:
  5. POST /mutations/orders/create
     → CREATE order thing
     → EMIT checkout_initiated event

User Pays (X402):
  6. POST /mutations/payments/verify
     → EMIT payment_verified event

System Settles Payment:
  7. Blockchain call
     → EMIT payment_settled event

System Completes Order:
  8. POST /mutations/orders/complete
     → EMIT order_completed event
     → Send delivery email

System Records Revenue:
  9. Daily job
     → EMIT revenue_earned event

System Processes Payout:
  10. Weekly job
      → EMIT payout_processed event
```

---

## CRITICAL PATH ANALYSIS

### PERT Analysis

```
Critical Path: A → B → C → F

A. todo-onboard (100 infers) [Wave 1]
   Duration: 5-7 days
   Slack: 0 (critical)

B. todo-x402 (100 infers) [Wave 1, parallel with A]
   Duration: 5-7 days
   Slack: 0 (critical)

C. todo-ecommerce (100 infers) [Wave 2]
   Depends: A + B
   Duration: 5-7 days
   Slack: 0 (critical)

D. todo-buy-chatgpt (100 infers) [Wave 2.5]
   Depends: C (soft)
   Duration: 5-7 days
   Slack: 3 days (can overlap with C)

E. todo-acp-integration (100 infers) [Wave 2-3]
   Depends: None strict
   Duration: 5-7 days
   Slack: 5 days (independent)

F. todo-one-ie (100 infers) [Wave 4]
   Depends: A + B + C
   Duration: 5-7 days
   Slack: 0 (critical for launch)

TOTAL ELAPSED TIME:
  With parallelization: 20-26 days (~3-4 weeks)
  Without parallelization: 50+ days (~7+ weeks)
  SAVINGS: 50%+ time reduction through parallel execution
```

---

## RISK MITIGATION

### Risk Register

| Risk                         | Probability | Impact   | Mitigation                               |
| ---------------------------- | ----------- | -------- | ---------------------------------------- |
| X402 payment fails           | Medium      | Critical | Testnet first, Stripe fallback           |
| Schema breaking change       | Low         | Critical | Convex migrations, versioned APIs        |
| LLM API rate limits          | Medium      | Medium   | Caching, fallback models, queue          |
| Wallet connection fails      | Low         | High     | Multiple wallet support, email fallback  |
| DDoS on launch               | Low         | High     | Cloudflare DDoS, rate limiting           |
| Creator dropout (onboarding) | High        | High     | UX optimization, email drip, A/B testing |

### Dependency Risk Mitigation

**If X402 delays Wave 1:**

```
1. Frontend mocks payments
2. E-commerce uses Stripe stub (feature flag)
3. X402 launches as opt-in upgrade later
4. No blocking of Wave 2
```

**If E-commerce needs iteration after Wave 2:**

```
1. Chat (Wave 2.5) uses mock products
2. ACP (Wave 2.5) ships independently
3. E-commerce improvements iterative
4. No blocking of Wave 4 launch
```

---

## CONCLUSION

### Summary

**ONE Platform Master Workflow Plan:**

- **6 Todos:** Foundation → Monetization → Advanced → Launch
- **6 Specialists:** Each owns their domain
- **4 Waves:** Sequential with significant parallelization
- **3,600+ Cycles:** ~3-4 weeks critical path with parallelization
- **100% Coverage:** Every feature mapped to ontology

### Key Success Factors

1. **Parallel Execution:** Wave 1 todos run simultaneously
2. **Tight Integration:** Shared events, ontology, data models
3. **Quality Embedded:** Testing in every phase
4. **Clear Ownership:** Specialist-led domains
5. **Incremental Delivery:** Each wave adds value

### Next Steps

1. **Week 1:** Assign specialists to Wave 1 using this matrix
2. **Day 1:** Begin Cycle 1-10 of todo-onboard + todo-x402 (parallel)
3. **Daily:** Update `.claude/state/cycle.json` with progress
4. **Weekly:** Team standup + risk review
5. **Wave Complete:** Emit event, prepare next wave

---

**Status:** Ready for execution. Begin Wave 1, Day 1.

**Go Build!** 🚀
