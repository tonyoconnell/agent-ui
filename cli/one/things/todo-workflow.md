---
title: Todo Workflow
dimension: things
primary_dimension: connections
category: todo-workflow.md
tags: agent, ai
related_dimensions: connections, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-workflow.md category.
  Location: one/things/todo-workflow.md
  Purpose: Documents one platform: master workflow & integration v1.0.0
  Related dimensions: connections, knowledge, people
  For AI agents: Read this to understand todo workflow.
---

# ONE Platform: Master Workflow & Integration v1.0.0

**Purpose:** Show how all 11 todo files work together as a unified system
**Audience:** Specialists implementing features (need to see dependencies + integration points)
**Status:** Ready for execution across 6 parallel specialists

---

## EXECUTIVE WORKFLOW

**User's Complete Journey Through ONE Platform:**

```
1. CREATOR SIGNUP
   ↓ (todo-onboard)
   Email + password → Verify email → Create profile → Create workspace

2. WALLET CONNECTION
   ↓ (todo-x402 integration with onboard)
   "Connect wallet" prompt → MetaMask → Verify → Receive address stored

3. CREATE PRODUCT
   ↓ (todo-ecommerce)
   Product form → Upload image → Set price → Publish

4. ENABLE CONVERSATIONAL DISCOVERY
   ↓ (todo-buy-chatgpt integration with ecommerce)
   Product auto-enrolled in Chat API → Claude understands it

5. SETUP CUSTOM AGENT (optional)
   ↓ (todo-agents + todo-acp-integration)
   Create ElizaOS agent → Deploy to marketplace → Other agents can call it

6. MONETIZE SKILLS
   ↓ (todo-skills + todo-sell)
   Register skill → Set price → Agents can purchase access

7. CUSTOMER DISCOVERS PRODUCT
   ↓ (todo-buy-chatgpt)
   Opens chat → "Find padel racket" → AI recommends creator's product

8. PURCHASE VIA CHAT
   ↓ (todo-buy-chatgpt + todo-x402)
   "Check out" → X402 payment prompt → Sign with wallet → Done

9. CREATOR EARNS
   ↓ (todo-x402 + todo-ecommerce)
   Payment settled → Revenue tracked → Weekly payout to wallet

10. ANALYTICS
    ↓ (todo-features + todo-one-ie)
    Creator sees: "1000 searches, 50 purchases, $500 revenue"

11. API INTEGRATION
    ↓ (todo-api + todo-acp-integration)
    3rd-party app calls: GET /api/products → Integrates with ONE
```

---

## DATA FLOW ARCHITECTURE

### Layer 1: Creator Onboarding (todo-onboard)

```
┌─────────────────────────────────┐
│ User Registration Form          │
├─────────────────────────────────┤
│ Email + Password + Profile      │
│         ↓                       │
│ Email Verification              │
│         ↓                       │
│ Create Workspace (group)        │
│         ↓                       │
│ Creator Thing Created           │
│         ↓                       │
│ Dashboard Ready                 │
└─────────────────────────────────┘
         ↓
    [Feeds to Layer 2A/2B]
```

### Layer 2A: Payment Infrastructure (todo-x402)

```
┌─────────────────────────────────┐
│ X402 Protocol Setup             │
├─────────────────────────────────┤
│ Creator: Connect Wallet         │
│         ↓                       │
│ Store wallet address            │
│         ↓                       │
│ Test with $0.01 payment         │
│         ↓                       │
│ Enable X402 on account          │
└─────────────────────────────────┘
```

### Layer 2B: Agent Communication (todo-acp-integration)

```
┌─────────────────────────────────┐
│ Agent Communication Layer       │
├─────────────────────────────────┤
│ Register System Agents          │
│ • Chat Advisor                  │
│ • Product Search                │
│ • Payment Processor             │
│ • Analytics                     │
│         ↓                       │
│ Creator Deploys Custom Agent    │
│         ↓                       │
│ Agent Registry Live             │
│ (agents can discover each other)│
└─────────────────────────────────┘
```

### Layer 3: E-Commerce (todo-ecommerce)

```
┌─────────────────────────────────┐
│ Product Creation                │
├─────────────────────────────────┤
│ Creator creates product         │
│         ↓                       │
│ Product stored in DB            │
│ (with AI metadata)              │
│         ↓                       │
│ Shopping Cart                   │
│         ↓                       │
│ Checkout (X402 or Stripe)       │
│         ↓                       │
│ Order Created                   │
│         ↓                       │
│ Payment Processed               │
│         ↓                       │
│ Digital Delivery                │
└─────────────────────────────────┘
         ↓
    [Feeds Layer 3.5]
```

### Layer 3.5: Conversational Commerce (todo-buy-chatgpt)

```
┌─────────────────────────────────┐
│ Chat Interface                  │
├─────────────────────────────────┤
│ User opens chat                 │
│ "Find me a racket"              │
│         ↓                       │
│ Chat Agent (Claude)             │
│         ↓                       │
│ Search products via API         │
│ (via todo-ecommerce)            │
│         ↓                       │
│ [Optional: Call expert agent]   │
│ via ACP (todo-acp)              │
│         ↓                       │
│ Recommend products              │
│         ↓                       │
│ User clicks "Check out"         │
│         ↓                       │
│ Checkout pre-filled             │
│ (from chat data)                │
│         ↓                       │
│ X402 payment                    │
│         ↓                       │
│ Order confirmed in chat         │
└─────────────────────────────────┘
```

### Layer 4: Agent Marketplace (todo-agents + todo-skills + todo-sell)

```
┌─────────────────────────────────┐
│ Agent Deployment (todo-agents)  │
├─────────────────────────────────┤
│ Creator builds ElizaOS agent    │
│ Creator deploys to marketplace  │
│         ↓                       │
│ Agent registered in registry    │
│ (via ACP integration)           │
│         ↓                       │
│ Agent exposes capabilities      │
│ (image gen, text analysis, etc) │
│         ↓                       │
│ Skill Marketplace (todo-skills) │
│ Creator registers skill tags    │
│         ↓                       │
│ Sell Agent Access (todo-sell)   │
│ Creator sells GitHub repo access│
│         ↓                       │
│ Buyers request access           │
│ Payment via X402                │
│         ↓                       │
│ GitHub token generated          │
│ Buyer gets repo access          │
└─────────────────────────────────┘
```

### Layer 5: Analytics & Features (todo-features + todo-api)

```
┌─────────────────────────────────┐
│ Analytics Dashboard             │
│ (todo-features)                 │
├─────────────────────────────────┤
│ Creators see:                   │
│ • Product views                 │
│ • Searches (via chat)           │
│ • Conversions                   │
│ • Revenue                       │
│ • Customer lifetime value       │
│         ↓                       │
│ Search + Discovery              │
│ (integrated with todo-ecommerce)│
│         ↓                       │
│ Social Features                 │
│ (follows, likes, shares)        │
│         ↓                       │
│ Public API (todo-api)           │
│ • GET /api/products             │
│ • GET /api/creators             │
│ • GET /api/agents               │
│ • POST /api/checkout            │
│         ↓                       │
│ SDK Generated                   │
│ (TypeScript, Python, Go)        │
└─────────────────────────────────┘
```

### Layer 6: Public Launch (todo-one-ie)

```
┌─────────────────────────────────┐
│ Marketing Site                  │
│ (https://one.ie)                │
├─────────────────────────────────┤
│ Landing page                    │
│ Creator stories                 │
│ API documentation               │
│ Blog                            │
│ Pricing                         │
│         ↓                       │
│ Creator Dashboard               │
│ (all analytics from Layer 5)    │
│         ↓                       │
│ Admin Dashboard                 │
│ (platform metrics)              │
│         ↓                       │
│ Public API Docs                 │
│ (from todo-api)                 │
└─────────────────────────────────┘
```

---

## INTEGRATION POINTS (Concrete Examples)

### Integration 1: Onboarding → X402

**When:** User completes onboarding profile
**What Syncs:** Creator ID, email, timezone
**Data Model:** Creator thing created in todo-onboard, same thing shown wallet section in todo-x402
**API:** POST /api/onboarding/complete → triggers POST /api/wallet/connect prompt
**Timing:** Immediate (no delay)

### Integration 2: X402 → E-Commerce

**When:** User makes purchase
**What Syncs:** Payment verified → Order created → Revenue tracked
**Data Model:** payment thing (todo-x402) + order thing (todo-ecommerce) linked via payment_id
**API:** POST /api/checkout → calls X402 payment → on success calls POST /api/orders
**Timing:** Atomic (all-or-nothing)

### Integration 3: E-Commerce → Chat

**When:** New product published
**What Syncs:** Product metadata, description, price, image
**Data Model:** product thing (todo-ecommerce) has aiDescription + aiEmbedding for Chat to use
**API:** POST /api/products → auto-indexes for semantic search (todo-buy-chatgpt)
**Timing:** Async (index in background)

### Integration 4: Chat → ACP → Expert Agent

**When:** User asks detailed question
**What Syncs:** Chat context → Expert agent via ACP message
**Data Model:** conversation_session (todo-buy-chatgpt) sends ACP message to expert_agent (todo-agents)
**API:** POST /api/acp/agents/{expert-id}/messages with chat context
**Timing:** Sync (wait for response)

### Integration 5: Expert Agent → Payment via ACP

**When:** Expert agent completes work
**What Syncs:** Service completion → Payment required
**Data Model:** acp_task (todo-acp) completes → payment_request via X402
**API:** POST /api/acp/agents/payment-processor/tasks with amount
**Timing:** Async (callback when paid)

### Integration 6: Products → Analytics

**When:** User searches or purchases
**What Syncs:** View event, purchase event to analytics table
**Data Model:** event thing with type="product_view" or "product_purchased"
**API:** POST /api/analytics/event logs to Convex
**Timing:** Async (fire-and-forget)

### Integration 7: Analytics → Dashboard → One.ie

**When:** Creator opens analytics
**What Syncs:** Metrics calculated from events table
**Data Model:** creator thing has embedded analytics (views, sales, revenue)
**API:** GET /api/analytics/dashboard returns computed metrics
**Timing:** Cached (recomputed every 5 minutes)

---

## SCHEMA ALIGNMENT REQUIREMENTS

### Creator Thing (Created in todo-onboard, used in ALL todos)

```typescript
{
  type: 'creator',
  id: Id<'things'>,
  groupId: Id<'groups'>,  // Workspace
  email: string,
  walletAddress: string,  // Added by todo-x402
  totalRevenue: number,  // Updated by todo-ecommerce + todo-acp
  agentEndpoint: string,  // Added by todo-agents
  skills: string[],  // Added by todo-skills
  products: Id<'things'>[],  // Added by todo-ecommerce
  analyticsConsent: boolean,  // For todo-features
}
```

### Product Thing (Created in todo-ecommerce, used in todo-buy-chatgpt + todo-api)

```typescript
{
  type: 'product',
  id: Id<'things'>,
  creatorId: Id<'things'>,
  name: string,
  price: number,

  // Added by todo-ecommerce
  description: string,
  images: string[],

  // Added by todo-buy-chatgpt
  aiDescription: string,  // Optimized for Claude
  aiEmbedding: number[],  // For semantic search
  aiUseCases: string[],

  // For todo-features
  views: number,
  purchases: number,
}
```

### Payment Thing (Created in todo-x402, used in todo-ecommerce + todo-acp)

```typescript
{
  type: 'payment',
  id: Id<'things'>,

  // From todo-x402
  protocol: 'x402',
  txHash: string,

  // From todo-ecommerce
  orderId: Id<'things'>,
  creatorId: Id<'things'>,

  // For settlement
  settled: boolean,
  settledAt: number,
}
```

### Agent Thing (Created in todo-agents, used in todo-acp + todo-api)

```typescript
{
  type: 'agent',
  id: Id<'things'>,

  // From todo-agents
  agentId: string,
  endpoint: string,
  capabilities: string[],

  // From todo-acp-integration
  status: 'online' | 'offline',
  lastSeen: number,
  uptime: number,

  // From todo-api
  publicEndpoint: boolean,
  apiKey: string,
}
```

---

## EVENT FLOWS

### Event Type: order_completed

```
todo-ecommerce: Order created (status=pending)
     ↓
todo-x402: Payment processed via X402 (payment.txHash set)
     ↓
todo-ecommerce: Order marked complete (status=completed)
     ↓
event table: order_completed event logged
     ↓
todo-features: Analytics updated (creator.totalSales++)
     ↓
todo-one-ie: Dashboard refreshed (shows new sale)
```

### Event Type: agent_message_sent (via ACP)

```
todo-buy-chatgpt: User asks question
     ↓
todo-acp-integration: Send message to expert agent
     ↓
todo-agents: Expert agent receives message
     ↓
event table: acp_message_sent logged
     ↓
todo-acp-integration: Response received
     ↓
todo-buy-chatgpt: User sees expert recommendation
     ↓
event table: acp_message_received logged
     ↓
todo-features: Analytics tracks expert_agent_used
```

---

## API CONTRACTS BETWEEN TODOS

### Contract 1: E-Commerce → Chat

```typescript
// todo-ecommerce EXPORTS
GET /api/products/search?query=string
  → Returns: Product[] with aiDescription, aiEmbedding, price, creator

// todo-buy-chatgpt IMPORTS
Uses: GET /api/products/search
Calls: When user asks about products
Expects: Response < 1 second, results ranked by relevance
```

### Contract 2: X402 → E-Commerce

```typescript
// todo-x402 EXPORTS
POST /api/payments/verify
  Input: {paymentPayload, amount, recipient}
  Output: {valid: boolean, paymentId: string}

POST /api/payments/settle
  Input: {paymentId}
  Output: {settled: boolean, txHash: string}

// todo-ecommerce IMPORTS
Uses: POST /api/payments/verify before checkout
Uses: POST /api/payments/settle after user payment
Expects: Both atomic (no partial payments)
```

### Contract 3: ACP → Agent Marketplace

```typescript
// todo-acp-integration EXPORTS
GET /api/acp/agents?capability=string
  → Returns: Agent[] with endpoint, capabilities, status

POST /api/acp/agents/{id}/messages
  → Routes message to agent, handles retry

// todo-agents, todo-skills, todo-sell IMPORT
Use: GET /api/acp/agents to discover services
Use: POST /api/acp/agents to communicate
Expect: < 500ms latency, async callbacks supported
```

### Contract 4: Features → One.ie

```typescript
// todo-features EXPORTS
GET /api/analytics/creator/{creatorId}
  → Returns: {views, sales, revenue, topProducts}

GET /api/creators/trending
  → Returns: Creator[] sorted by revenue

// todo-one-ie IMPORTS
Uses: GET /api/analytics/creator in dashboard
Uses: GET /api/creators/trending in marketing page
Expects: Cached (5-min staleness OK)
```

---

## SPECIALIST COLLABORATION POINTS

### Point 1: Schema Design (Week 1)

- **Specialists:** agent-backend (lead), agent-integrator (feedback)
- **Deliverable:** Unified schema.ts with all thing types, indexed
- **Sync:** 30-min alignment meeting
- **Output:** `/backend/convex/schema.ts` (single source of truth)

### Point 2: API Contract Definition (Week 1)

- **Specialists:** agent-backend (server), agent-frontend (client), agent-integrator (external)
- **Deliverable:** OpenAPI spec for all inter-todo APIs
- **Sync:** 1-hour API design meeting
- **Output:** `/api-contracts.openapi.yaml`

### Point 3: Component Handoff (Week 2)

- **Specialists:** agent-backend (creates API), agent-frontend (consumes)
- **Deliverable:** Stubs ready for integration
- **Sync:** Daily (async Slack messages OK)
- **Output:** API routes match component expectations

### Point 4: Testing & Integration (Week 3)

- **Specialists:** agent-quality (test suite), agent-backend (fix issues)
- **Deliverable:** E2E tests passing across todos
- **Sync:** Daily standup
- **Output:** CI/CD pipeline green

### Point 5: Public Launch (Week 4)

- **Specialists:** agent-frontend (UI), agent-designer (polish), agent-ops (deploy)
- **Deliverable:** https://one.ie live
- **Sync:** Weekly launch prep
- **Output:** Platform live to public

---

## DEPENDENCY MATRIX

| TODO            | Depends On        | Soft Depends | Blocking                          |
| --------------- | ----------------- | ------------ | --------------------------------- |
| onboard         | -                 | -            | NO                                |
| x402            | -                 | onboard      | NO (can stub user)                |
| ecommerce       | onboard, x402     | -            | NO (can stub payments)            |
| buy-chatgpt     | ecommerce         | x402         | NO (can use test products)        |
| acp-integration | -                 | onboard      | NO (system agents pre-registered) |
| agents          | acp-integration   | onboard      | NO (can test without creators)    |
| skills          | agents, ecommerce | -            | NO (can stub marketplace)         |
| sell            | agents            | ecommerce    | NO (can use test repos)           |
| api             | ecommerce, agents | all          | NO (can expose subset)            |
| features        | ecommerce, acp    | all          | NO (stub analytics)               |
| one-ie          | all               | -            | YES (needs everything)            |

---

## CRITICAL SUCCESS FACTORS

### 1. Single Schema Source of Truth

- ✅ ALL todos use same Convex schema
- ✅ Schema changes go through agent-backend only
- ✅ Other specialists review, don't modify

### 2. Async Integration

- ✅ Todos connected via event system
- ✅ No todo blocks another
- ✅ Stubs used during parallel development

### 3. Clear API Contracts

- ✅ Explicit OpenAPI definitions
- ✅ Mocks provided for unreleased endpoints
- ✅ Contract tests in CI/CD

### 4. Daily Synchronization

- ✅ 15-min standup (async Slack OK)
- ✅ Weekly deep dives (1 hour)
- ✅ Clear escalation path

### 5. Quality Gates

- ✅ 80%+ test coverage per todo
- ✅ E2E tests before each release
- ✅ Security + accessibility reviewed

---

**This workflow enables 6 specialists to work completely in parallel while building a unified, integrated platform. Each specialist knows exactly what they build, how it connects, and how to coordinate with others.**
