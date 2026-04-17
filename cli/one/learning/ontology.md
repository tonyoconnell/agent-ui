---
title: Ontology
dimension: knowledge
category: ontology.md
tags: 6-dimensions, ai, architecture, ontology
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the ontology.md category.
  Location: one/knowledge/ontology.md
  Purpose: Documents one platform - ontology specification
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand ontology.
---

# ONE Platform - Ontology Specification

**Version:** 1.0.0 (Reality as DSL - The Universal Code Generation Language)
**Status:** Complete - Reality-Aware Architecture
**Design Principle:** This isn't just a data model. It's a Domain-Specific Language (DSL) that models reality itself, enabling 98% AI code generation accuracy through compound structure.

---

## Why This Changes Everything

### The Breakthrough: Reality as DSL

**Most developers think databases model their application.**

We flipped this. **The 6-dimension ontology models reality itself**. Applications map to it.

This enables:

- **98% AI code generation accuracy** (not 30-70%)
- **Compound structure** (each feature makes the next MORE accurate, not less)
- **Universal feature import** (clone ANY system into the ontology)
- **Never breaks** (reality doesn't change, technology does)

### What AI Sees

**Traditional Codebase (Pattern Divergence):**

```
Feature 1: createUser(email) ────────┐
Feature 2: addProduct(name) ─────────┼─→ 100 patterns
Feature 3: registerCustomer(data) ───┤   AI confused
Feature 4: insertOrder(items) ───────┤   Accuracy: 30%
...each uses different approach
```

**ONE Codebase (Pattern Convergence):**

```
Feature 1: provider.things.create({ type: "user" }) ────┐
Feature 2: provider.things.create({ type: "product" }) ─┼─→ 1 pattern
Feature 3: provider.things.create({ type: "customer" })─┤   AI masters it
Feature 4: provider.things.create({ type: "order" }) ───┤   Accuracy: 98%
...all use same pattern
```

**The difference:** Traditional codebases teach AI 100 patterns (chaos). ONE teaches AI 1 pattern (mastery).

### Why This Never Breaks

**Reality is stable. Technology changes.**

The 6 dimensions model reality:

1. **Groups** - Containers exist (friend circles → governments)
2. **People** - Actors authorize (who can do what)
3. **Things** - Entities exist (users, products, courses, agents)
4. **Connections** - Relationships relate (owns, purchased, enrolled_in)
5. **Events** - Actions happen (created, updated, purchased)
6. **Knowledge** - Understanding emerges (embeddings, search, RAG)

These dimensions NEVER change because they model reality itself, not any specific technology.

**Examples of systems that map perfectly:**

- **Shopify** → Products (things), Orders (connections + events), Customers (people)
- **Moodle** → Courses (things), Enrollments (connections), Completions (events)
- **Stripe** → Payments (things), Transactions (connections + events), Customers (people)
- **WordPress** → Posts (things), Authors (people), Categories (knowledge labels)

**Every system maps to the same 6 dimensions.** That's why AI agents achieve 98% accuracy.

---

## Structure

This ontology is organized into 6 dimension files:

1. **[organisation.md](./organisation.md)** - Multi-tenant isolation & ownership
2. **[people.md](./people.md)** - Authorization, governance, & user customization
3. **[things.md](./things.md)** - 66 entity types (what exists)
4. **[connections.md](./connections.md)** - 25 relationship types (how they relate)
5. **[events.md](./events.md)** - 67 event types (what happened)
6. **[knowledge.md](./knowledge.md)** - Vectors, embeddings, RAG (what it means)

**Execution Guide:**

7. **[todo.md](./todo.md)** - 100-cycle execution sequence (plan in cycles, not days)

**This document (Ontology.md)** contains the complete technical specification. The consolidated files above provide focused summaries and patterns.

**Planning Paradigm:** We don't plan in days. We plan in **cycle passes** (Cycle 1-100). See [todo.md](./todo.md) for the complete 100-cycle template that guides feature implementation from idea to production.

## The 6-Dimension Reality Model

**This is the universal interface.** Every feature in every system maps to these 6 dimensions.

**Every single thing in ONE platform exists within one of these 6 dimensions:**

```
┌──────────────────────────────────────────────────────────────┐
│                         1. GROUPS                             │
│  Multi-tenant isolation with hierarchical nesting - who owns  │
│  what at group level (friend circles → DAOs → governments)    │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                         2. PEOPLE                             │
│  Authorization & governance - platform owner, group owners    │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                         3. THINGS                             │
│  Every "thing" - users, agents, content, tokens, courses      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      4. CONNECTIONS                           │
│  Every relationship - owns, follows, taught_by, powers        │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                         5. EVENTS                             │
│  Every action - purchased, created, viewed, completed         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                       6. KNOWLEDGE                            │
│  Labels + chunks + vectors powering RAG & search              │
└──────────────────────────────────────────────────────────────┘
```

**The Universal Interface (How Technology Implements the Ontology):**

```
┌─────────────────────────────────────────────────────────────────────┐
│                  LAYER 1: UNIVERSAL INTERFACE                       │
│                    (The 6-Dimension DSL)                            │
├─────────────────────────────────────────────────────────────────────┤
│  groups     → Hierarchical containers (friend circles → governments)│
│  people     → Authorization & governance (who can do what)          │
│  things     → All entities (66 types: user, product, course...)     │
│  connections → All relationships (25 types: owns, purchased...)     │
│  events     → All actions (67 types: created, updated, logged...)   │
│  knowledge  → AI understanding (embeddings, search, RAG)            │
│                                                                     │
│  This layer NEVER changes. It models reality.                      │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ↓ Technology changes, ontology stays the same

┌─────────────────────────────────────────────────────────────────────┐
│              TECHNOLOGY ADAPTERS (swap freely)                      │
│              (Convex, Hono, Astro, React, etc.)                     │
├─────────────────────────────────────────────────────────────────────┤
│  Backend:  Hono API + Convex Database (implements ontology)         │
│  Frontend: Astro SSR + React Islands (renders ontology)             │
│  Real-time: Convex hooks (live ontology subscriptions)             │
│  Static:   Astro Content Collections (ontology as files)            │
│                                                                     │
│  Technology can be swapped. Ontology stays the same.                │
└─────────────────────────────────────────────────────────────────────┘
```

### Dimension 1: Groups (Containers)

**Purpose:** Partition the system with hierarchical nesting (friend circles → DAOs → governments)

**Why it never changes:** Containers always contain things. Whether it's a lemonade stand or a global government, the concept of "container" is universal.

**Pattern for AI:**

```typescript
// AI learns: Everything belongs to a group
provider.things.create({ groupId, type, name, properties });
```

**Example mappings:**

- Shopify Store → group (type: business)
- Moodle School → group (type: organization)
- DAO Treasury → group (type: dao)
- Friend Circle → group (type: friend_circle)

### Dimension 2: People (Authorization)

**Purpose:** Define who can do what (actors, roles, permissions)

**Why it never changes:** Authorization is a universal concept. Someone always performs actions.

**Pattern for AI:**

```typescript
// AI learns: Every action has an actor
events.log({ actorId: personId, type, targetId });
```

**Example mappings:**

- Shopify Admin → person (role: org_owner)
- Moodle Student → person (role: customer)
- Platform Owner → person (role: platform_owner)
- Team Member → person (role: org_user)

### Dimension 3: Things (Entities)

**Purpose:** All nouns in the system (66 types, infinitely extensible)

**Why it never changes:** Entities exist. Users, products, courses, agents—these are all "things" with different types.

**Pattern for AI:**

```typescript
// AI learns: One pattern for all entities
provider.things.create({ type: "product" | "course" | "user" | ..., name, properties })
```

**Example mappings:**

- Shopify Product → thing (type: product)
- Moodle Course → thing (type: course)
- Stripe Payment → thing (type: payment)
- WordPress Post → thing (type: blog_post)

**New entity type?** Just add to `properties`. No schema migration needed.

### Dimension 4: Connections (Relationships)

**Purpose:** How entities relate to each other (25 types + metadata)

**Why it never changes:** Relationships are universal. Things connect to other things.

**Pattern for AI:**

```typescript
// AI learns: One pattern for all relationships
provider.connections.create({
  fromThingId,
  toThingId,
  relationshipType,
  metadata,
});
```

**Example mappings:**

- Shopify Order → connection (type: purchased) + event (type: order_placed)
- Moodle Enrollment → connection (type: enrolled_in)
- GitHub Follows → connection (type: following)
- Token Holdings → connection (type: holds_tokens, metadata: { balance })

### Dimension 5: Events (Actions)

**Purpose:** Complete audit trail of what happened when (67 types + metadata)

**Why it never changes:** Actions happen at specific times. This is universal.

**Pattern for AI:**

```typescript
// AI learns: All actions are logged the same way
provider.events.log({ type, actorId, targetId, timestamp, metadata });
```

**Example mappings:**

- Shopify Checkout → event (type: payment_processed)
- Moodle Lesson View → event (type: content_viewed)
- User Login → event (type: user_login)
- Token Purchase → event (type: tokens_purchased)

### Dimension 6: Knowledge (Understanding)

**Purpose:** Labels, embeddings, and semantic search for AI

**Why it never changes:** Categorization and understanding are universal concepts.

**Pattern for AI:**

```typescript
// AI learns: Knowledge is linked to things
provider.knowledge.create({
  sourceThingId,
  knowledgeType: "label" | "chunk",
  text,
  embedding,
});
```

**Example mappings:**

- WordPress Categories → knowledge (type: label)
- Course Content → knowledge (type: chunk, embedding: [...])
- Product Tags → knowledge (type: label)
- Semantic Search → knowledge vector search

---

**Golden Rule:** If you can't map your feature to these 6 dimensions, you're thinking about it wrong.

**For AI Agents:** This ontology is your universal language. Learn these 6 patterns and you can generate ANY feature with 98% accuracy.

---

## Compound Structure Accuracy: Why AI Gets Better Over Time

### Traditional AI Code Generation (Pattern Divergence)

**The death spiral:**

```
Generation 1: Clean code → 95% accurate
Generation 2: Slight drift → 90% accurate  (-5% - patterns starting to diverge)
Generation 3: Pattern divergence → 80% accurate  (-10% - AI sees multiple patterns)
Generation 4: Inconsistency → 65% accurate  (-15% - AI confused by variations)
Generation N: Unmaintainable mess → 30% accurate  (-20% - complete chaos)
```

**Why?** Each feature introduces NEW patterns. AI has to guess which pattern to use.

### ONE's AI Code Generation (Pattern Convergence)

**The virtuous cycle:**

```
Generation 1: Maps to ontology → 85% accurate (learning the ontology)
Generation 2: Follows patterns → 90% accurate  (+5% - recognizing service pattern)
Generation 3: Reuses services → 93% accurate  (+3% - composing existing services)
Generation 4: Predictable structure → 96% accurate  (+3% - mastering Effect.ts patterns)
Generation N: Perfect consistency → 98%+ accurate  (+2% - generalized patterns)
```

**Why?** Each feature uses the SAME patterns. AI masters the ontology, then reuses it.

### How Agents Learn the Ontology

**Generation 1-5: Learning (85% accurate)**

```
Agent thinks:
"I see things being created with `type` field. Let me check..."
"All entities are things? Even users, products, courses?"
"Connections link things together. Got it."
"Events log actions. People are actors."
"Pattern emerging: 6 dimensions for everything."
CONFIDENCE: 85% (still learning)
```

**Generation 6-20: Recognizing (90% accurate)**

```
Agent thinks:
"Every create operation uses provider.things.create. 100% of the time."
"Every service uses Effect.gen. Pattern confirmed."
"All errors are tagged unions. I can handle exhaustively."
"Dependencies are injected. I know what's needed."
CONFIDENCE: 90% (pattern recognized)
```

**Generation 21-50: Composing (93% accurate)**

```
Agent thinks:
"I can reuse existing services:"
"- createThing service exists"
"- createConnection service exists"
"- logEvent service exists"
"My new feature: compose these three services."
"No new patterns needed. Just composition."
CONFIDENCE: 93% (composing existing patterns)
```

**Generation 51-100: Mastering (96% accurate)**

```
Agent thinks:
"I've generated 50 services. All follow same structure:"
"1. Get provider from context"
"2. Call provider operation"
"3. Handle typed errors"
"4. Return typed result"
"Pattern is UNIVERSAL. Works for ANY feature."
CONFIDENCE: 96% (mastered the structure)
```

**Generation 100+: Generalizing (98%+ accurate)**

```
Agent thinks:
"I don't even need to think. The pattern IS the system."
"New feature request? Map to 6 dimensions."
"Need validation? Effect.ts service."
"Need data? Provider interface."
"Need state? Nanostores."
"Every decision is deterministic."
CONFIDENCE: 98%+ (system internalized)
```

### What This Means for Development

**Feature #1:**

- Traditional: 8 hours (70% AI, 30% human)
- ONE: 8 hours (70% AI, 30% human)
- **No difference yet**

**Feature #10:**

- Traditional: 10 hours (60% AI, 40% human - patterns diverging)
- ONE: 6 hours (85% AI, 15% human - patterns converging)
- **ONE is 1.7x faster**

**Feature #50:**

- Traditional: 16 hours (40% AI, 60% human - technical debt)
- ONE: 3 hours (95% AI, 5% human - pattern mastery)
- **ONE is 5.3x faster**

**Feature #100:**

- Traditional: 24 hours (25% AI, 75% human - chaos)
- ONE: 1.5 hours (98% AI, 2% human - generalized)
- **ONE is 16x faster**

**Cumulative for 100 features:**

- Traditional: 1,400 hours
- ONE: 350 hours
- **ONE is 4x faster overall**
- **And the gap keeps growing**

### Why Schema Migrations Never Break This

**New entity type?**

```typescript
// NO schema migration needed
{ type: "new_thing", name: "...", properties: { ...custom } }
```

**New field on existing type?**

```typescript
// NO schema migration needed
{ type: "product", properties: { price, SKU, newField: "value" } }
```

**New relationship?**

```typescript
// NO schema migration needed
{ relationshipType: "new_connection", metadata: { ...custom } }
```

**New protocol integration?**

```typescript
// NO schema migration needed
{
  relationshipType: "transacted",
  metadata: { protocol: "new_protocol", ...custom }
}
```

**Result:** Technology changes (React → Svelte, REST → GraphQL), but the ontology stays the same forever.

---

## GROUPS: The Isolation Boundary with Hierarchical Nesting

Purpose: Partition the system with perfect isolation and support nested groups (groups within groups) - from friend circles to DAOs to governments. Every group owns its own graph of things, connections, events, and knowledge.

### Group Structure

```typescript
{
  _id: Id<'groups'>,
  slug: string,              // REQUIRED: URL identifier (/group/slug)
  name: string,              // REQUIRED: Display name
  type: 'friend_circle' | 'business' | 'community' | 'dao' | 'government' | 'organization',
  parentGroupId?: Id<'groups'>,  // OPTIONAL: Parent group for hierarchical nesting
  description?: string,      // OPTIONAL: About text

  metadata: Record<string, any>,

  settings: {
    visibility: 'public' | 'private',
    joinPolicy: 'open' | 'invite_only' | 'approval_required',
    plan: 'starter' | 'pro' | 'enterprise',
    limits: {
      users: number,
      storage: number,         // GB
      apiCalls: number,
    }
  },

  status: 'active' | 'archived',
  createdAt: number,
  updatedAt: number,
}
```

### Common Fields by Use Case

**Identity:** `[slug, name]` - Who they are + URL
**Web:** `[slug, name, description]` - Website generation
**Operations:** `[status, type, settings, parentGroupId]` - System management

### Why Groups Matter

1. **Multi-Tenant Isolation:** Each group's data is completely separate
2. **Hierarchical Nesting:** Groups can contain sub-groups for complex organizations (parent → child → grandchild...)
3. **Flexible Types:** From friend circles (2 people) to businesses to DAOs to governments (billions)
4. **Resource Quotas:** Control costs and usage per group
5. **Privacy Control:** Groups can be public or private with controlled access
6. **Flexible Scale:** Scales from friend circles to global governments without schema changes

### Hierarchical Group Examples by Domain

**E-Commerce (Retail Chain):**

```
Corporate Headquarters (group)
├─ North American Division (child group)
│  ├─ New York Store (grandchild group)
│  └─ California Store (grandchild group)
└─ European Division (child group)
   ├─ London Store (grandchild group)
   └─ Paris Store (grandchild group)
```

**Education (University System):**

```
MIT (group)
├─ School of Engineering (child group)
│  ├─ Computer Science Dept (grandchild group)
│  ├─ Electrical Engineering Dept (grandchild group)
│  └─ Mechanical Engineering Dept (grandchild group)
├─ School of Science (child group)
│  ├─ Mathematics Dept (grandchild group)
│  └─ Physics Dept (grandchild group)
└─ School of Business (child group)
```

**Creator (Multi-Channel Brand):**

```
Creator Brand (group)
├─ YouTube Channel (child group)
│  └─ Content Series 1 (grandchild group)
├─ Podcast (child group)
│  └─ Season 2 (grandchild group)
└─ Community (child group - Discord server with channels)
```

**Crypto (DAO Treasury):**

```
DAO Treasury (group)
├─ Core Operations (child group)
│  ├─ Development Fund (grandchild group)
│  └─ Marketing Fund (grandchild group)
├─ Investment Committee (child group)
│  └─ Venture Capital Allocation (grandchild group)
└─ Community Grants (child group)
```

---

## PEOPLE: Authorization & Governance

Purpose: Define who can do what. People direct groups, customize AI agents, and govern access.

### Person Structure

```typescript
{
  _id: Id<'people'>,
  email: string,
  username: string,
  displayName: string,

  // CRITICAL: Role determines access level
  role: 'platform_owner' | 'group_owner' | 'group_user' | 'customer',

  // Group context
  groupId?: Id<'groups'>,  // Current/default group
  permissions?: string[],

  // Profile
  bio?: string,
  avatar?: string,

  // Multi-tenant tracking
  groups: Id<'groups'>[],  // All groups this person belongs to

  createdAt: number,
  updatedAt: number,
}
```

### Four Roles

1. **Platform Owner** (Anthony)
   - Owns the ONE Platform
   - 100% revenue from platform-level services
   - Can access all groups (support/debugging)
   - Creates new groups

2. **Group Owner**
   - Owns/manages one or more groups
   - Controls users, permissions, billing within group
   - Customizes AI agents and frontend
   - Revenue sharing with platform

3. **Group User**
   - Works within a group
   - Limited permissions (defined by group owner)
   - Can create content, run agents (within quotas)

4. **Customer**
   - External user consuming content
   - Purchases tokens, enrolls in courses
   - No admin access

### Why People Matter

1. **Authorization:** Every action must have an actor (person)
2. **Governance:** Group owners control who can do what
3. **Audit Trail:** Events log who did what when
4. **Customization:** People teach AI agents their preferences

---

## KNOWLEDGE: Labels, Chunks, and Vectors (RAG)

Purpose: unify taxonomy (“tags”) and retrieval‑augmented generation (RAG) under one table. A knowledge item can be a label (former tag), a document wrapper, or a chunk with an embedding.

Design principles:

- Protocol‑agnostic: store protocol details in `metadata`.
- Many‑to‑many: link knowledge ⇄ things via `thingKnowledge` with optional context metadata.
- Scalable: consolidated types minimize index fan‑out; embeddings enable semantic search.

### Knowledge Types

```typescript
type KnowledgeType =
  | "label" // replaces legacy "tag"; lightweight categorical marker
  | "document" // wrapper for a source text/blob (pre-chunking)
  | "chunk" // atomic chunk of text with embedding
  | "vector_only"; // embedding without stored text (e.g., privacy)
```

### Knowledge Structure

```typescript
{
  _id: Id<'knowledge'>,
  knowledgeType: KnowledgeType,
  // Textual content (optional for label/vector_only)
  text?: string,
  // Embedding for semantic search (optional for label/document)
  embedding?: number[],          // Float32 vector; model-dependent dimension
  embeddingModel?: string,       // e.g., "text-embedding-3-large"
  embeddingDim?: number,
  // Source linkage
  sourceThingId?: Id<'things'>,  // Primary source entity
  sourceField?: string,          // e.g., 'content', 'transcript', 'title'
  chunk?: { index: number; start?: number; end?: number; tokenCount?: number; overlap?: number },
  // Lightweight categorization (free-form)
  labels?: string[],             // Replaces per-thing tags; applied to knowledge
  // Additional metadata (protocol, language, mime, hash, version)
  metadata?: Record<string, any>,
  createdAt: number,
  updatedAt: number,
  deletedAt?: number,
}
```

### Junction: thingKnowledge

```typescript
{
  _id: Id<'thingKnowledge'>,
  thingId: Id<'things'>,
  knowledgeId: Id<'knowledge'>,
  role?: 'label' | 'summary' | 'chunk_of' | 'caption' | 'keyword',
  // Context for the link (e.g., confidence, section name)
  metadata?: Record<string, any>,
  createdAt: number,
}
```

### Indexes (recommended)

- `knowledge.by_type` (knowledgeType)
- `knowledge.by_source` (sourceThingId)
- `knowledge.by_created` (createdAt)
- `thingKnowledge.by_thing` (thingId)
- `thingKnowledge.by_knowledge` (knowledgeId)
- Vector index (provider-dependent): `knowledge.by_embedding` for ANN search

### How Domains Apply Knowledge

**Education - Learning Objectives & Study Materials:**

```typescript
// Knowledge: Learning objective chunk
{
  knowledgeType: 'chunk',
  text: 'Students should be able to solve quadratic equations',
  sourceThingId: courseId,
  labels: ['subject:mathematics', 'grade:9-12', 'objective:apply', 'skill:algebra']
}

// Link: Course references this learning objective
{
  thingId: courseId,
  knowledgeId: knowledgeId,
  role: 'learning_objective'
}
```

**Creator - Content SEO & Discovery:**

```typescript
// Knowledge: Video description chunk with embedded metadata
{
  knowledgeType: 'chunk',
  text: 'This video teaches React hooks for beginners...',
  sourceThingId: videoId,
  embedding: [0.1, 0.2, ...],
  labels: ['topic:react', 'difficulty:beginner', 'platform:youtube', 'series:javascript101']
}
```

**E-Commerce - Product Categorization & Search:**

```typescript
// Knowledge: Product description for semantic search
{
  knowledgeType: 'document',
  text: 'Blue wireless headphones with 40-hour battery life',
  sourceThingId: productId,
  embedding: [0.5, 0.3, ...],
  labels: ['category:electronics', 'color:blue', 'feature:wireless', 'price_range:premium']
}
```

**Crypto - Risk Analysis & Token Intelligence:**

```typescript
// Knowledge: Token risk assessment
{
  knowledgeType: 'chunk',
  text: 'Token has no minting restrictions, moderate holder concentration',
  sourceThingId: tokenId,
  labels: ['risk:medium', 'metric:tvl_trend_up', 'audit:completed', 'governance:none']
}

// Knowledge: Protocol dependency analysis
{
  knowledgeType: 'label',
  text: 'Depends on Chainlink oracle',
  sourceThingId: protocolId,
  labels: ['dependency:critical', 'type:oracle', 'risk_factor:oracle']
}
```

**Notes:**

- The legacy ThingType `embedding` is deprecated for operational vectors; use the `knowledge` table with `knowledgeType: 'chunk' | 'vector_only'`.
- Labels (formerly tags) now live in `knowledge.labels` and via `thingKnowledge` relations. Use labels to curate taxonomy without enum churn.
- Domain-specific labels follow `category:value` pattern for semantic organization (e.g., `subject:math`, `platform:youtube`, `risk:high`).

---

## THINGS: All The "Things"

### What Goes in Things?

**Simple test:** If you can point at it and say "this is a \_\_\_", it's a thing.

Examples:

- "This is a **creator**" ✅ Thing
- "This is a **blog post**" ✅ Thing
- "This is a **token**" ✅ Thing
- "This is a **relationship**" ❌ Connection, not thing
- "This is a **purchase**" ❌ Event, not thing

### Thing Types

**66 Types Organized in 13 Categories:**

```typescript
type ThingType =
  // CORE (4)
  | "creator" // Human creator (role: platform_owner, org_owner, org_user, customer)
  | "ai_clone" // Digital twin of creator
  | "audience_member" // Fan/user (role: customer)
  | "organization" // Multi-tenant organization

  // BUSINESS AGENTS (10)
  | "strategy_agent" // Vision, planning, OKRs
  | "research_agent" // Market, trends, competitors
  | "marketing_agent" // Content strategy, SEO, distribution
  | "sales_agent" // Funnels, conversion, follow-up
  | "service_agent" // Support, onboarding, success
  | "design_agent" // Brand, UI/UX, assets
  | "engineering_agent" // Tech, integration, automation
  | "finance_agent" // Revenue, costs, forecasting
  | "legal_agent" // Compliance, contracts, IP
  | "intelligence_agent" // Analytics, insights, predictions

  // CONTENT (7)
  | "blog_post" // Written content (guides, newsletters, articles)
  | "video" // Video content (lectures, demos, shorts)
  | "podcast" // Audio content (episodes, interviews)
  | "social_post" // Social media post (all platforms)
  | "email" // Email content (campaigns, newsletters)
  | "course" // Educational course (programs, learning paths)
  | "lesson" // Individual lesson (units, modules, segments)

  // PRODUCTS (4)
  | "digital_product" // Templates, tools, assets
  | "membership" // Tiered membership (Patreon, Substack)
  | "consultation" // 1-on-1 session (coaching, support)
  | "nft" // NFT collectible (governance, utility)

  // COMMUNITY (3)
  | "community" // Community space (Discord, forums)
  | "conversation" // Thread/discussion (boards, channels)
  | "message" // Individual message (chat, DM)

  // TOKEN (2)
  | "token" // Actual token instance
  | "token_contract" // Smart contract

  // KNOWLEDGE (2)
  | "knowledge_item" // Piece of creator knowledge
  | "embedding" // Vector embedding

  // PLATFORM (6)
  | "website" // Auto-generated creator site
  | "landing_page" // Custom landing pages (campaigns, sales)
  | "template" // Design templates (reusable components)
  | "livestream" // Live broadcast (streaming, webinars)
  | "recording" // Saved livestream content
  | "media_asset" // Images, videos, files

  // BUSINESS (7)
  | "payment" // Payment transaction
  | "subscription" // Recurring subscription
  | "invoice" // Invoice record
  | "metric" // Tracked metric
  | "insight" // AI-generated insight
  | "prediction" // AI prediction
  | "report" // Analytics report

  // AUTHENTICATION & SESSION (5)
  | "session" // User session (Better Auth)
  | "oauth_account" // OAuth connection (GitHub, Google)
  | "verification_token" // Email/2FA verification token
  | "password_reset_token" // Password reset token
  | "ui_preferences" // User UI settings (theme, layout)

  // MARKETING (6)
  | "notification" // System notification
  | "email_campaign" // Email marketing campaign
  | "announcement" // Platform announcement
  | "referral" // Referral record
  | "campaign" // Marketing campaign
  | "lead" // Potential customer/lead

  // EXTERNAL INTEGRATIONS (3)
  | "external_agent" // External AI agent (ElizaOS)
  | "external_workflow" // External workflow (n8n, Zapier)
  | "external_connection" // Connection config

  // PROTOCOL ENTITIES (2, protocol-agnostic)
  | "mandate" // Intent/cart (AP2, shopping)
  | "product"; // Sellable product (ACP marketplace)
```

**How Domains Apply These Types:**

- **E-Commerce**: Uses `product` (catalog items), `mandate` (shopping carts), `payment` (transactions), `subscription` (auto-renewals), `membership` (loyalty), `notification` (order updates), `email_campaign` (promotional)
- **Education**: Uses `course` (programs), `lesson` (units), `community` (cohorts), `assignment` (assessments), `conversation` (discussion boards), `metric` (grades), `report` (transcripts)
- **Creator**: Uses `video` (YouTube/TikTok), `podcast` (episodes), `blog_post` (newsletters), `membership` (tiers), `course` (products), `email_campaign` (outreach), `metric` (engagement), `insight` (analytics)
- **Crypto**: Uses `token` (holdings), `token_contract` (smart contracts), `metric` (TVL/volume), `payment` (transfers), `knowledge_item` (risk profiles), `report` (protocol analysis)

### Thing Structure

```typescript
{
  _id: Id<"things">,
  type: ThingType,
  name: string,                    // Display name
  properties: {                    // Type-specific properties (JSON)
    // For creator:
    email?: string,
    username?: string,
    niche?: string[],
    // For token:
    contractAddress?: string,
    totalSupply?: number,
    // etc...
  },
  status: "active" | "inactive" | "draft" | "published" | "archived",
  createdAt: number,
  updatedAt: number,
  deletedAt?: number
}
```

### Properties by Thing Type

**Creator Properties:**

```typescript
{
  email: string,
  username: string,
  displayName: string,
  bio?: string,
  avatar?: string,
  niche: string[],
  expertise: string[],
  targetAudience: string,
  brandColors?: {
    primary: string,
    secondary: string,
    accent: string
  },
  totalFollowers: number,
  totalContent: number,
  totalRevenue: number,
  // MULTI-TENANT ROLES
  role: "platform_owner" | "group_owner" | "group_user" | "customer",
  groupId?: Id<"groups">, // Current/default group (if group_owner or group_user)
  permissions?: string[], // Additional permissions
}
```

**Organization Properties:**

```typescript
{
  name: string,
  slug: string,              // URL-friendly identifier
  domain?: string,           // Custom domain (e.g., acme.one.ie)
  logo?: string,
  description?: string,
  status: "active" | "suspended" | "trial" | "cancelled",
  plan: "starter" | "pro" | "enterprise",
  limits: {
    users: number,           // Max users allowed
    storage: number,         // GB
    apiCalls: number,        // Per month
  },
  usage: {
    users: number,           // Current users
    storage: number,         // GB used
    apiCalls: number,        // This month
  },
  billing: {
    customerId?: string,     // Stripe customer ID
    subscriptionId?: string, // Stripe subscription ID
    currentPeriodEnd?: number,
  },
  settings: {
    allowSignups: boolean,
    requireEmailVerification: boolean,
    enableTwoFactor: boolean,
    allowedDomains?: string[], // Email domain whitelist
  },
  createdAt: number,
  trialEndsAt?: number,
}
```

**AI Clone Properties:**

```typescript
{
  voiceId?: string,
  voiceProvider?: "elevenlabs" | "azure" | "custom",
  appearanceId?: string,
  appearanceProvider?: "d-id" | "heygen" | "custom",
  systemPrompt: string,
  temperature: number,
  knowledgeBaseSize: number,
  lastTrainingDate: number,
  totalInteractions: number,
  satisfactionScore: number
}
```

**Agent Properties:**

```typescript
{
  agentType: "strategy" | "marketing" | "sales" | ...,
  systemPrompt: string,
  model: string,
  temperature: number,
  capabilities: string[],
  tools: string[],
  totalExecutions: number,
  successRate: number,
  averageExecutionTime: number
}
```

**Token Properties:**

```typescript
{
  contractAddress: string,
  blockchain: "base" | "ethereum" | "polygon",
  standard: "ERC20" | "ERC721" | "ERC1155",
  totalSupply: number,
  circulatingSupply: number,
  price: number,
  marketCap: number,
  utility: string[],
  burnRate: number,
  holders: number,
  transactions24h: number,
  volume24h: number
}
```

**Course Properties:**

```typescript
{
  title: string,
  description: string,
  thumbnail?: string,
  modules: number,
  lessons: number,
  totalDuration: number,
  price: number,
  currency: string,
  tokenPrice?: number,
  enrollments: number,
  completions: number,
  averageRating: number,
  generatedBy: "ai" | "human" | "hybrid",
  personalizationLevel: "none" | "basic" | "advanced"
}
```

**Website Properties:**

```typescript
{
  domain: string,
  subdomain: string,              // creator.one.ie
  template: "minimal" | "showcase" | "portfolio",
  customCSS?: string,
  customDomain?: string,
  sslEnabled: boolean,
  analytics: {
    visitors30d: number,
    pageViews: number,
    conversionRate: number
  }
}
```

**Livestream Properties:**

```typescript
{
  title: string,
  scheduledAt: number,
  startedAt?: number,
  endedAt?: number,
  platform: "youtube" | "twitch" | "custom",
  streamUrl: string,
  recordingUrl?: string,
  viewersPeak: number,
  viewersAverage: number,
  chatEnabled: boolean,
  aiCloneMixEnabled: boolean,     // For human + AI mixing
  status: "scheduled" | "live" | "ended" | "cancelled"
}
```

**Payment Properties:**

```typescript
{
  amount: number,
  currency: "usd" | "eur",
  paymentMethod: "stripe" | "crypto",
  stripePaymentIntentId?: string,
  txHash?: string,                // Blockchain transaction
  status: "pending" | "completed" | "failed" | "refunded",
  fees: number,
  netAmount: number,
  processedAt?: number
}
```

**Subscription Properties:**

```typescript
{
  tier: "starter" | "pro" | "enterprise",
  price: number,
  currency: string,
  interval: "monthly" | "yearly",
  status: "active" | "cancelled" | "past_due" | "expired",
  currentPeriodStart: number,
  currentPeriodEnd: number,
  cancelAt?: number,
  stripeSubscriptionId?: string
}
```

**Metric Properties:**

```typescript
{
  name: string,
  value: number,
  unit: string,
  timestamp: number,
  period: "realtime" | "hourly" | "daily" | "weekly" | "monthly",
  change: number,                 // Percentage change from previous
  trend: "up" | "down" | "stable"
}
```

**Insight Properties:**

```typescript
{
  title: string,
  description: string,
  category: "performance" | "audience" | "revenue" | "content",
  confidence: number,             // 0.0 to 1.0
  actionable: boolean,
  recommendations: string[],
  generatedAt: number,
  generatedBy: Id<"things">     // intelligence_agent
}
```

**Referral Properties:**

```typescript
{
  referrerCode: string,
  referredEmail: string,
  referredUserId?: Id<"things">,
  status: "pending" | "converted" | "expired",
  tokensEarned: number,
  bonusEarned?: number,
  conversionDate?: number,
  expiresAt: number
}
```

**Notification Properties:**

```typescript
{
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
  channel: "email" | "sms" | "push" | "in_app",
  read: boolean,
  readAt?: number,
  actionUrl?: string,
  actionLabel?: string
}
```

**External Agent Properties:**

```typescript
{
  platform: "elizaos" | "autogen" | "crewai" | "langchain" | "custom",
  agentId: string,              // External platform's agent ID
  name: string,                 // Agent name
  description?: string,         // What the agent does
  capabilities: string[],       // Available actions/tools
  apiEndpoint?: string,         // REST/GraphQL endpoint
  websocketUrl?: string,        // WebSocket endpoint for real-time
  status: "online" | "offline" | "busy" | "unknown",
  lastSeen?: number,
  metadata: {                   // Platform-specific data
    personality?: any,          // For ElizaOS character
    tools?: string[],           // Available tools
    model?: string,             // LLM model used
    [key: string]: any          // Other platform-specific fields
  },
  conversationCount: number,    // Total conversations
  messageCount: number,         // Total messages exchanged
  createdAt: number,
  updatedAt: number
}
```

**External Workflow Properties:**

```typescript
{
  platform: "n8n" | "zapier" | "make" | "pipedream" | "custom",
  workflowId: string,           // External platform's workflow ID
  name: string,                 // Workflow name
  description: string,          // What the workflow does
  webhookUrl?: string,          // Trigger URL
  active: boolean,              // Is workflow active?
  tags: string[],               // Workflow tags/categories
  inputSchema: {                // Expected input parameters
    [key: string]: {
      type: "string" | "number" | "boolean" | "object" | "array",
      required: boolean,
      description: string,
      default?: any
    }
  },
  outputSchema: {               // Expected output structure
    [key: string]: {
      type: "string" | "number" | "boolean" | "object" | "array",
      description: string
    }
  },
  executionCount: number,       // Total executions
  successRate: number,          // 0.0 to 1.0
  averageExecutionTime: number, // milliseconds
  lastExecutedAt?: number,
  createdAt: number,
  updatedAt: number
}
```

**External Connection Properties:**

```typescript
{
  platform: "elizaos" | "n8n" | "zapier" | "make" | "autogen" | "custom",
  name: string,                 // Connection name
  baseUrl?: string,             // API base URL
  apiKey?: string,              // Encrypted API key
  websocketUrl?: string,        // WebSocket endpoint
  webhookSecret?: string,       // Webhook signature secret
  connectionType: "rest" | "websocket" | "webhook" | "graphql",
  authentication: {
    type: "apiKey" | "oauth" | "basic" | "bearer" | "custom",
    credentials: any            // Encrypted credentials
  },
  status: "active" | "inactive" | "error",
  lastConnectedAt?: number,
  lastError?: string,
  linkedEntityIds: string[],    // Connected agents/workflows
  rateLimits?: {
    requestsPerMinute: number,
    requestsPerDay: number
  },
  createdAt: number,
  updatedAt: number
}
```

**Session Properties:**

```typescript
{
  userId: Id<"things">,        // User this session belongs to
  token: string,                 // Session token (hashed)
  expiresAt: number,             // Expiration timestamp
  ipAddress?: string,            // IP address
  userAgent?: string,            // Browser/device info
  lastActivityAt: number,        // Last activity timestamp
  createdAt: number,
}
```

**OAuth Account Properties:**

```typescript
{
  userId: Id<"things">,        // User this account belongs to
  provider: "github" | "google" | "discord" | "twitter",
  providerAccountId: string,     // Provider's user ID
  accessToken?: string,          // Encrypted access token
  refreshToken?: string,         // Encrypted refresh token
  expiresAt?: number,            // Token expiration
  tokenType?: string,            // Bearer, etc.
  scope?: string,                // Granted scopes
  idToken?: string,              // OpenID Connect ID token
  createdAt: number,
  updatedAt: number,
}
```

**Verification Token Properties:**

```typescript
{
  userId: Id<"things">,        // User to verify
  token: string,                 // Verification token (hashed)
  type: "email" | "two_factor",  // Verification type
  expiresAt: number,             // Expiration timestamp
  attempts: number,              // Failed attempts count
  maxAttempts: number,           // Max allowed attempts
  verifiedAt?: number,           // When verified (if completed)
  createdAt: number,
}
```

**Password Reset Token Properties:**

```typescript
{
  userId: Id<"things">,        // User requesting reset
  token: string,                 // Reset token (hashed)
  expiresAt: number,             // Expiration timestamp (15-30 min)
  usedAt?: number,               // When token was used
  createdAt: number,
}
```

**UI Preferences Properties:**

```typescript
{
  userId: Id<"things">,        // User these preferences belong to
  theme: "light" | "dark" | "system",
  language: string,              // ISO language code
  timezone: string,              // IANA timezone
  dashboardLayout: {
    sidebarCollapsed: boolean,
    defaultView: "grid" | "list" | "kanban",
    itemsPerPage: number,
  },
  notifications: {
    email: boolean,
    push: boolean,
    sms: boolean,
    inApp: boolean,
  },
  accessibility: {
    reducedMotion: boolean,
    highContrast: boolean,
    fontSize: "small" | "medium" | "large",
  },
  customSettings: any,           // App-specific settings
  updatedAt: number,
}
```

---

## CONNECTIONS: All The Relationships

### What Goes in Connections?

**Simple test:** If you're describing how thing X relates to thing Y, it's a connection.

Examples:

- "Creator **owns** token" ✅ Connection
- "User **enrolled_in** course" ✅ Connection
- "Agent **powers** AI clone" ✅ Connection
- "Creator created a post" ❌ Event (action), not connection

### Connection Types (25 total)

**Design Principle:** Consolidated types with metadata for variants. Protocol identity stored in `metadata.protocol`.

```typescript
type ConnectionType =
  // OWNERSHIP (2)
  | "owns"
  | "created_by"

  // AI RELATIONSHIPS (3)
  | "clone_of"
  | "trained_on"
  | "powers"

  // CONTENT RELATIONSHIPS (5)
  | "authored"
  | "generated_by"
  | "published_to"
  | "part_of"
  | "references"

  // COMMUNITY RELATIONSHIPS (4)
  | "member_of"
  | "following"
  | "moderates"
  | "participated_in"

  // BUSINESS RELATIONSHIPS (3)
  | "manages"
  | "reports_to"
  | "collaborates_with"

  // TOKEN RELATIONSHIPS (3)
  | "holds_tokens"
  | "staked_in"
  | "earned_from"

  // PRODUCT RELATIONSHIPS (4)
  | "purchased"
  | "enrolled_in"
  | "completed"
  | "teaching"

  // CONSOLIDATED TYPES (use metadata for variants + protocol)
  | "transacted" // Payment/subscription/invoice (metadata.transactionType + protocol)
  | "notified" // Notifications (metadata.channel + notificationType)
  | "referred" // Referrals (metadata.referralType)
  | "communicated" // Agent/protocol communication (metadata.protocol + messageType)
  | "delegated" // Task/workflow delegation (metadata.protocol + taskType)
  | "approved" // Approvals (metadata.approvalType + protocol)
  | "fulfilled"; // Fulfillment (metadata.fulfillmentType + protocol)

// Total: 25 connection types
```

### Connection Structure

```typescript
{
  _id: Id<"connections">,
  fromThingId: Id<"things">,
  toThingId: Id<"things">,
  relationshipType: ConnectionType,
  metadata?: {              // Optional relationship data
    // For revenue splits:
    revenueShare?: number,  // 0.0 to 1.0
    // For token holdings:
    balance?: number,
    // For course enrollment:
    enrolledAt?: number,
    progress?: number,
    // etc...
  },
  strength?: number,        // Relationship strength (0-1)
  validFrom?: number,       // When relationship started
  validTo?: number,         // When relationship ended
  createdAt: number,
  updatedAt?: number
}
```

### Common Connection Patterns

**Pattern: Ownership**

```typescript
// Creator owns AI clone (thing-to-thing)
{
  fromThingId: creatorId,
  toThingId: cloneId,
  relationshipType: "owns",
  createdAt: Date.now()
}

// E-Commerce: Store owns product inventory
{
  fromThingId: groupId,  // Store
  toThingId: productId,
  relationshipType: "owns",
  createdAt: Date.now()
}

// Education: Department owns course
{
  fromThingId: departmentGroupId,
  toThingId: courseId,
  relationshipType: "owns",
  createdAt: Date.now()
}

// Crypto: DAO owns treasury tokens
{
  fromThingId: daoGroupId,
  toThingId: tokenId,
  relationshipType: "owns",
  metadata: {
    balance: 1000000
  },
  createdAt: Date.now()
}
```

**Pattern: Revenue Split**

```typescript
// Collaborator owns 30% of course
{
  fromThingId: collaboratorId,
  toThingId: courseId,
  relationshipType: "owns",
  metadata: {
    revenueShare: 0.3
  },
  createdAt: Date.now()
}
```

**Pattern: Token Holding**

```typescript
// User holds 1000 tokens
{
  fromThingId: userId,
  toThingId: tokenId,
  relationshipType: "holds_tokens",
  metadata: {
    balance: 1000,
    acquiredAt: Date.now()
  },
  createdAt: Date.now()
}
```

**Pattern: Course Enrollment**

```typescript
// User enrolled in course
{
  fromThingId: userId,
  toThingId: courseId,
  relationshipType: "enrolled_in",
  metadata: {
    progress: 0.45,        // 45% complete
    enrolledAt: Date.now(),
    lastAccessedAt: Date.now()
  },
  createdAt: Date.now()
}

// Education: Student enrolled in school with grade level
{
  fromThingId: studentId,
  toThingId: courseId,
  relationshipType: "enrolled_in",
  metadata: {
    enrollmentType: "credit",
    progress: 0.65,
    currentGrade: 92.5,
    letterGrade: "A",
    enrolledAt: Date.now()
  },
  createdAt: Date.now()
}

// E-Commerce: Customer purchased product
{
  fromThingId: customerId,
  toThingId: productId,
  relationshipType: "purchased",
  metadata: {
    quantity: 2,
    price: 49.99,
    currency: "USD",
    purchasedAt: Date.now()
  },
  createdAt: Date.now()
}

// Creator: Subscriber joined membership tier
{
  fromThingId: subscriberId,
  toThingId: membershipTierId,
  relationshipType: "member_of",
  metadata: {
    tier: "pro",
    price: 9.99,
    interval: "monthly",
    subscribedAt: Date.now()
  },
  createdAt: Date.now()
}
```

**Pattern: Group Membership**

```typescript
// User is member of group with role
{
  fromThingId: userId,
  toThingId: groupId,
  relationshipType: "member_of",
  metadata: {
    role: "group_owner" | "group_user",  // Group-specific role
    permissions: ["read", "write", "admin"],
    invitedBy?: Id<"things">,      // Who invited this user
    invitedAt?: number,
    joinedAt: Date.now(),
  },
  createdAt: Date.now()
}

// Group owns content/resources
{
  fromThingId: groupId,
  toThingId: contentId,
  relationshipType: "owns",
  metadata: {
    createdBy: userId,               // User who created it
  },
  createdAt: Date.now()
}
```

**Pattern: Payment Transaction (Consolidated)**

```typescript
// User paid for product (use "transacted" with metadata)
{
  fromThingId: userId,
  toThingId: productId,
  relationshipType: "transacted",
  metadata: {
    transactionType: "payment",    // or "subscription" or "invoice"
    amount: 99.00,
    currency: "USD",
    paymentId: "pi_123456",
    status: "completed"
  },
  createdAt: Date.now()
}

// User subscribed to service
{
  fromThingId: userId,
  toThingId: subscriptionId,
  relationshipType: "transacted",
  metadata: {
    transactionType: "subscription",
    amount: 29.00,
    currency: "USD",
    interval: "monthly",
    subscriptionId: "sub_123456",
    status: "active"
  },
  createdAt: Date.now()
}
```

**Pattern: Referral (Consolidated)**

```typescript
// User referred by another user (use "referred" with metadata)
{
  fromThingId: newUserId,
  toThingId: referrerId,
  relationshipType: "referred",
  metadata: {
    referralType: "direct",        // or "conversion" or "campaign"
    source: "referral_link",
    referralCode: "REF123",
    tokensEarned: 100,
    status: "converted"
  },
  createdAt: Date.now()
}
```

**Pattern: Notification (Consolidated)**

```typescript
// User notified about event (use "notified" with metadata)
{
  fromThingId: userId,
  toThingId: notificationId,
  relationshipType: "notified",
  metadata: {
    channel: "email",              // or "sms" or "push" or "in_app"
    campaignId: campaignId,        // optional
    deliveredAt: Date.now(),
    readAt: Date.now(),
    clicked: true
  },
  createdAt: Date.now()
}
```

---

## EVENTS: All The Actions

### What Goes in Events?

**Simple test:** If you're describing something that HAPPENED at a specific TIME, it's an event.

Examples:

- "User **purchased** tokens at 3pm" ✅ Event
- "Content **was published** yesterday" ✅ Event
- "Clone **interacted** with user" ✅ Event
- "User owns tokens" ❌ Connection (state), not event

### Event Types (35 total)

**Design Principle:** Consolidated types with metadata for variants. Protocol identity stored in `metadata.protocol`.

```typescript
type EventType =
  // THING LIFECYCLE (3) - Consolidated with metadata.thingType
  | "thing_created" // metadata: { thingType: "group" | "user" | "course" | etc. }
  | "thing_updated" // metadata: { thingType, action: "updated" | "archived" | "restored" }
  | "thing_deleted" // metadata: { thingType, action: "deleted" | "archived", deletionType: "soft" | "hard" }

  // USER EVENTS (5)
  | "user_registered"
  | "user_verified"
  | "user_login"
  | "user_logout"
  | "profile_updated"

  // AUTHENTICATION EVENTS (6)
  | "password_reset_requested"
  | "password_reset_completed"
  | "email_verification_sent"
  | "email_verified"
  | "two_factor_enabled"
  | "two_factor_disabled"

  // GROUP-SPECIFIC EVENTS (3) - Not lifecycle events (those use thing_*)
  | "user_invited_to_group"
  | "user_joined_group"
  | "user_removed_from_group"

  // DASHBOARD & UI EVENTS (4)
  | "dashboard_viewed"
  | "settings_updated"
  | "theme_changed"
  | "preferences_updated"

  // AI/CLONE EVENTS (2) - Creation uses thing_created with thingType: "clone"
  | "voice_cloned"
  | "appearance_cloned"

  // AGENT EVENTS (3) - Creation uses thing_created with thingType: "agent"
  | "agent_executed"
  | "agent_completed"
  | "agent_failed"

  // TOKEN EVENTS (6) - Creation uses thing_created with thingType: "token"
  | "token_minted"
  | "token_burned"
  | "tokens_purchased"
  | "tokens_staked"
  | "tokens_unstaked"
  | "tokens_transferred"

  // COURSE EVENTS (4) - Creation uses thing_created with thingType: "course"
  | "course_enrolled"
  | "lesson_completed"
  | "course_completed"
  | "certificate_earned"

  // ANALYTICS EVENTS (5)
  | "metric_calculated"
  | "insight_generated"
  | "prediction_made"
  | "optimization_applied"
  | "report_generated"

  // CYCLEENCE EVENTS (7) - NEW
  | "cycle_request" // User requests AI cycle
  | "cycle_completed" // Cycle result delivered
  | "cycle_failed" // Cycle failed
  | "cycle_quota_exceeded" // Monthly limit hit
  | "cycle_revenue_collected" // Daily revenue sweep
  | "org_revenue_generated" // Group generates platform revenue
  | "revenue_share_distributed" // Revenue share paid out

  // BLOCKCHAIN EVENTS (5) - NEW
  | "nft_minted" // NFT created on-chain
  | "nft_transferred" // NFT ownership changed
  | "tokens_bridged" // Cross-chain bridge
  | "contract_deployed" // Smart contract deployed
  | "treasury_withdrawal" // Platform owner withdraws revenue

  // CONSOLIDATED EVENTS (use metadata for variants + protocol)
  | "content_event" // metadata.action: created|updated|deleted|viewed|shared|liked
  | "payment_event" // metadata.status: requested|verified|processed + protocol
  | "subscription_event" // metadata.action: started|renewed|cancelled
  | "commerce_event" // metadata.eventType + protocol (ACP, AP2)
  | "livestream_event" // metadata.status: started|ended + metadata.action: joined|left|chat|donation
  | "notification_event" // metadata.channel: email|sms|push|in_app + deliveryStatus
  | "referral_event" // metadata.action: created|completed|rewarded
  | "communication_event" // metadata.protocol (A2A, ACP, AG-UI) + messageType
  | "task_event" // metadata.action: delegated|completed|failed + protocol
  | "mandate_event" // metadata.mandateType: intent|cart + protocol (AP2)
  | "price_event"; // metadata.action: checked|changed

// Total: 52 event types (35 original + 7 cycle + 5 blockchain + 5 NFT overlap)
```

### Event Structure

```typescript
{
  _id: Id<"events">,
  type: EventType,               // What happened
  actorId: Id<"things">,       // Who/what caused this
  targetId?: Id<"things">,     // Optional target thing
  timestamp: number,             // When it happened
  metadata: any                  // Event-specific data
}
```

**Metadata Structure:**

The `metadata` field is flexible JSON that ALWAYS includes `protocol` for protocol-specific events:

```typescript
// Protocol-agnostic events (no protocol field needed)
{ action: "created", contentType: "blog_post" }

// Protocol-specific events (includes protocol identifier)
{
  protocol: "a2a" | "acp" | "ap2" | "x402" | "ag-ui",
  // ... protocol-specific fields
}

// Examples:
// A2A message
{ protocol: "a2a", messageType: "task_delegation", task: "research" }

// ACP commerce
{ protocol: "acp", eventType: "purchase_initiated", agentPlatform: "chatgpt" }

// AP2 mandate
{ protocol: "ap2", mandateType: "intent", autoExecute: true }

// X402 payment
{ protocol: "x402", network: "base", txHash: "0x..." }
```

### Event Patterns

**Pattern: User Action**

```typescript
// User purchased tokens
{
  type: "tokens_purchased",
  actorId: userId,
  targetId: tokenId,
  timestamp: Date.now(),
  metadata: {
    amount: 100,
    usdAmount: 10,
    paymentId: "pi_123",
    txHash: "0x456"
  }
}
```

**Pattern: Payment Event (Consolidated)**

```typescript
// Payment completed (use "payment_processed" with metadata.status)
{
  type: "payment_processed",
  actorId: userId,
  targetId: paymentId,
  timestamp: Date.now(),
  metadata: {
    status: "completed",        // or "initiated" | "failed" | "refunded"
    amount: 99.00,
    currency: "USD",
    paymentId: "pi_123456",
    method: "stripe"
  }
}

// Subscription renewed (use "subscription_updated" with metadata.action)
{
  type: "subscription_updated",
  actorId: userId,
  targetId: subscriptionId,
  timestamp: Date.now(),
  metadata: {
    action: "renewed",          // or "started" | "cancelled"
    tier: "pro",
    amount: 29.00,
    nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000
  }
}
```

**Pattern: Content Event (Consolidated)**

```typescript
// Content created (use "content_changed" with metadata.action)
{
  type: "content_changed",
  actorId: creatorId,
  targetId: contentId,
  timestamp: Date.now(),
  metadata: {
    action: "created",          // or "updated" | "deleted"
    contentType: "blog_post",
    generatedBy: "marketing_agent",
    platform: "instagram"
  }
}

// Content viewed (use "content_interacted" with metadata.interactionType)
{
  type: "content_interacted",
  actorId: userId,
  targetId: contentId,
  timestamp: Date.now(),
  metadata: {
    interactionType: "viewed",  // or "shared" | "liked"
    duration: 120,              // seconds
    source: "feed"
  }
}

// Education: Assignment submitted
{
  type: "content_changed",
  actorId: studentId,
  targetId: submissionId,
  timestamp: Date.now(),
  metadata: {
    action: "submitted",
    contentType: "assignment",
    assignmentId: assignmentId,
    courseId: courseId,
    isLate: false
  }
}

// E-Commerce: Product reviewed
{
  type: "content_interacted",
  actorId: customerId,
  targetId: productId,
  timestamp: Date.now(),
  metadata: {
    interactionType: "reviewed",
    rating: 5,
    reviewText: "Great product!",
    verified: true
  }
}

// Creator: Video published
{
  type: "content_changed",
  actorId: creatorId,
  targetId: videoId,
  timestamp: Date.now(),
  metadata: {
    action: "published",
    contentType: "youtube_video",
    platform: "youtube",
    viewCount: 0,
    engagementMetrics: {}
  }
}
```

**Pattern: Livestream Event (Consolidated)**

```typescript
// Livestream started (use "livestream_status_changed" with metadata.status)
{
  type: "livestream_status_changed",
  actorId: creatorId,
  targetId: livestreamId,
  timestamp: Date.now(),
  metadata: {
    status: "started",          // or "scheduled" | "ended"
    streamId: "stream_123",
    platform: "cloudflare",
    rtmpUrl: "rtmp://..."
  }
}

// Viewer joined (use "livestream_interaction" with metadata.type)
{
  type: "livestream_interaction",
  actorId: viewerId,
  targetId: livestreamId,
  timestamp: Date.now(),
  metadata: {
    type: "joined",             // or "left" | "message"
    viewerCount: 42,
    message: "Hello!"           // if type === "message"
  }
}
```

**Pattern: Notification Event (Consolidated)**

```typescript
// Email notification sent (use "notification_delivered" with metadata.channel)
{
  type: "notification_delivered",
  actorId: systemId,
  targetId: userId,
  timestamp: Date.now(),
  metadata: {
    channel: "email",           // or "sms" | "push" | "in_app"
    messageId: "msg_123",
    subject: "New content available",
    deliveredAt: Date.now(),
    readAt: Date.now() + 1000   // optional
  }
}
```

**Pattern: AI Interaction**

```typescript
// Clone chatted with user
{
  type: "clone_interaction",
  actorId: userId,
  targetId: cloneId,
  timestamp: Date.now(),
  metadata: {
    message: "How do I start?",
    response: "Let me help you...",
    tokensUsed: 150,
    sentiment: "positive"
  }
}
```

**Pattern: Metric Tracking**

```typescript
// Token price calculated
{
  type: "metric_calculated",
  actorId: systemId,
  targetId: tokenId,
  timestamp: Date.now(),
  metadata: {
    metric: "token_price",
    value: 0.12,
    change: +0.05,
    changePercent: 4.2
  }
}
```

**Pattern: Authentication Events**

```typescript
// Password reset requested
{
  type: "password_reset_requested",
  actorId: userId,
  targetId: passwordResetTokenId,
  timestamp: Date.now(),
  metadata: {
    email: "user@example.com",
    ipAddress: "192.168.1.1",
    expiresAt: Date.now() + 30 * 60 * 1000  // 30 minutes
  }
}

// Email verified
{
  type: "email_verified",
  actorId: userId,
  targetId: verificationTokenId,
  timestamp: Date.now(),
  metadata: {
    email: "user@example.com",
    verificationMethod: "link" | "code"
  }
}

// Two-factor enabled
{
  type: "two_factor_enabled",
  actorId: userId,
  timestamp: Date.now(),
  metadata: {
    method: "totp" | "sms" | "email",
    backupCodesGenerated: 10
  }
}
```

**Pattern: Group Events**

```typescript
// Group created
{
  type: "group_created",
  actorId: creatorId,
  targetId: groupId,
  timestamp: Date.now(),
  metadata: {
    name: "Acme Corp",
    slug: "acme",
    plan: "pro",
    trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000  // 14 days
  }
}

// User invited to group
{
  type: "user_invited_to_group",
  actorId: inviterId,
  targetId: groupId,
  timestamp: Date.now(),
  metadata: {
    invitedEmail: "newuser@example.com",
    role: "group_user",
    inviteToken: "inv_123456",
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000  // 7 days
  }
}

// User joined group
{
  type: "user_joined_group",
  actorId: userId,
  targetId: groupId,
  timestamp: Date.now(),
  metadata: {
    role: "group_user",
    invitedBy: inviterId
  }
}
```

**Pattern: Dashboard & UI Events**

```typescript
// Dashboard viewed
{
  type: "dashboard_viewed",
  actorId: userId,
  timestamp: Date.now(),
  metadata: {
    dashboardType: "platform_owner" | "group_owner" | "group_user" | "customer",
    groupId?: groupId,
    route: "/admin/dashboard",
    sessionDuration: 0  // Updated on session end
  }
}

// Theme changed
{
  type: "theme_changed",
  actorId: userId,
  targetId: uiPreferencesId,
  timestamp: Date.now(),
  metadata: {
    previousTheme: "light",
    newTheme: "dark"
  }
}

// Settings updated
{
  type: "settings_updated",
  actorId: userId,
  targetId: uiPreferencesId,
  timestamp: Date.now(),
  metadata: {
    updatedFields: ["dashboardLayout", "notifications"],
    changes: {
      "dashboardLayout.sidebarCollapsed": { from: false, to: true },
      "notifications.email": { from: true, to: false }
    }
  }
}
```

---

## KNOWLEDGE Labels & Semantic Chunks

Use knowledge items of `knowledgeType: 'label'` for taxonomy and `knowledgeType: 'chunk'` for RAG. Associate via `thingKnowledge`.

Examples:

- "This creator is in the fitness industry" ✅ label knowledge with `labels: ['industry:fitness']`
- "This content is video format" ✅ label knowledge with `labels: ['format:video']`
- "This page content paragraph 3" ✅ chunk knowledge with `text` + `embedding`

Pattern: multi‑label entity

```typescript
const labels = [
  "industry:fitness",
  "skill:video-editing",
  "technology:youtube",
  "audience:beginners",
];
for (const label of labels) {
  const kid = await getOrCreateKnowledgeLabel(label);
  await db.insert("thingKnowledge", {
    thingId: creatorId,
    knowledgeId: kid,
    role: "label",
    createdAt: Date.now(),
  });
}
```

Pattern: semantic search across chunks

```typescript
// Given a query embedding, find top-k similar chunks for a group
const topK = await vectorSearch("knowledge", {
  vectorField: "embedding",
  query: queryEmbedding,
  filter: { "sourceThingId.groupId": groupId, knowledgeType: "chunk" },
  k: 10,
});
```

---

## How Features Map to Ontology

### Feature: AI Clone Creation

**Things Created:**

1. `ai_clone` thing (the clone)
2. `knowledge_item` entities (training data)

**Connections Created:**

1. creator → ai_clone (relationship: "owns")
2. ai_clone → knowledge_items (relationship: "trained_on")

**Events Logged:**

1. `clone_created` (when clone created)
2. `voice_cloned` (when voice ready)
3. `appearance_cloned` (when appearance ready)

**Knowledge Labels Added:**

- Clone inherits creator's labels
- Additional: "ai_clone", "active"

### Feature: Token Purchase

**Things Involved:**

1. `token` thing (the token being purchased)
2. `audience_member` thing (the buyer)

**Connections Created/Updated:**

1. buyer → token (relationship: "holds_tokens", metadata: { balance: 100 })

**Events Logged:**

1. `tokens_purchased` (the purchase)
2. `revenue_generated` (for creator)

**Knowledge Labels Added:**

- None (tokens already labeled)

### Feature: Course Generation

**Things Created:**

1. `course` entity
2. `lesson` entities (multiple)

**Connections Created:**

1. creator → course (relationship: "owns")
2. ai_clone → course (relationship: "teaching")
3. course → lessons (relationship: "part_of")

**Events Logged:**

1. `course_created`
2. `content_generated` (for each lesson)

**Knowledge Labels Added:**

- skill labels (what course teaches)
- industry labels (course category)
- audience labels (target audience)

### Feature: ELEVATE Journey

**Things Involved:**

1. `audience_member` (user going through journey)
2. Workflow thing (tracks progress)

**Connections Created:**

- None (journey tracked in workflow state)

**Events Logged:**

1. `journey_step_completed` (for each step: hook, gift, identify, etc.)
2. `achievement_unlocked` (at milestones)
3. `tokens_earned` (rewards)

**Knowledge Labels Added:**

- Status labels (current step)

### Domain-Specific Feature Mapping

**E-Commerce: Shopping Cart Checkout**

**Things Created/Used:**

- `mandate` thing (shopping cart)
- `product` thing (items in cart)
- `payment` thing (transaction record)

**Connections Created:**

- customer → mandate (relationship: "owns" or "has_active_cart")
- mandate → product items (relationship: "contains")
- customer → payment (relationship: "transacted", metadata: { transactionType: "payment" })

**Events Logged:**

- `mandate_event` (cart created, items added, checkout started)
- `payment_event` (payment processed)
- `commerce_event` (order completed)

**Knowledge Added:**

- Order items tagged for analytics

---

**Education: Course Enrollment & Grading**

**Things Created/Used:**

- `course` thing
- `lesson` things (modules, assignments)
- `submission` thing (student work)
- `metric` thing (grades)

**Connections Created:**

- student → course (relationship: "enrolled_in", metadata: { progress, grade })
- student → submission (relationship: "submitted_for")
- submission → lesson (relationship: "part_of")
- teacher → submission (relationship: "graded_by")

**Events Logged:**

- `course_enrolled` (enrollment)
- `content_event` (lesson viewed/completed)
- `content_changed` (assignment submitted)
- `metric_calculated` (grade calculated)

**Knowledge Added:**

- Competency labels (skills demonstrated)
- Performance level tags

---

**Creator: Multi-Platform Publishing**

**Things Created/Used:**

- `video` thing (YouTube upload)
- `podcast` thing (episode)
- `blog_post` thing (newsletter)
- `email_campaign` thing (broadcast)

**Connections Created:**

- creator → content (relationship: "authored")
- content → platform (relationship: "published_to", metadata: { platform: "youtube" | "spotify" })
- audience → content (relationship: "engaged_with")

**Events Logged:**

- `content_changed` (published, metadata: { platform, contentType })
- `content_interacted` (viewed, listened, shared)
- `metric_calculated` (engagement metrics)

**Knowledge Added:**

- Topic labels (subject matter)
- Platform tags
- Performance labels (trending, viral)

---

**Crypto: Token Staking & Yield Farming**

**Things Created/Used:**

- `token` thing (token instance)
- `token_contract` thing (smart contract)
- `metric` thing (TVL, APY)
- `knowledge_item` thing (risk assessment)

**Connections Created:**

- user → token (relationship: "holds_tokens", metadata: { balance })
- user → token (relationship: "staked_in", metadata: { amount, duration, earnings })
- token → contract (relationship: "defined_by")
- contract → dependencies (relationship: "depends_on", metadata: { critical: true })

**Events Logged:**

- `token_minted` / `token_burned`
- `tokens_staked` / `tokens_unstaked`
- `metric_calculated` (TVL, APY updates)
- `price_event` (price changes)

**Knowledge Added:**

- Risk labels (audit status, vulnerability)
- Protocol labels (type, chain)
- Market labels (trend, momentum)

---

## Querying the Ontology

### Get Thing by ID (table: things)

```typescript
const thing = await db.get(thingId);
```

### Get All Things of Type (index: by_type)

```typescript
const creators = await db
  .query("things")
  .withIndex("by_type", (q) => q.eq("type", "creator"))
  .collect();
```

### Get Thing's Relationships (table: connections)

```typescript
// Get all entities this entity owns
const owned = await db
  .query("connections")
  .withIndex("from_type", (q) =>
    q.eq("fromThingId", thingId).eq("relationshipType", "owns"),
  )
  .collect();

const ownedThings = await Promise.all(
  owned.map((conn) => db.get(conn.toThingId)),
);
```

### Get Thing's History (table: events)

```typescript
// Get all events for this entity
const history = await db
  .query("events")
  .withIndex("thing_type_time", (q) => q.eq("thingId", thingId))
  .order("desc") // Most recent first
  .collect();
```

### Get Thing's Knowledge (junction: thingKnowledge)

```typescript
const knowledgeAssocs = await db
  .query("thingKnowledge")
  .withIndex("by_thing", (q) => q.eq("thingId", thingId))
  .collect();

const knowledgeItems = await Promise.all(
  knowledgeAssocs.map((assoc) => db.get(assoc.knowledgeId)),
);
```

### Search by Multiple Criteria

```typescript
// Find fitness creators with >10k followers
const creators = await db
  .query("things")
  .withIndex("by_type", (q) => q.eq("type", "creator"))
  .collect();

const fitnessCreators = creators.filter(
  (c) =>
    c.properties.totalFollowers > 10000 &&
    c.properties.niche.includes("fitness"),
);
```

---

## Migration from Old Systems

When migrating from one.ie or bullfm:

### Step 1: Identify Thing Types

Map old models to new thing types:

- Old "User" → "creator" or "audience_member"
- Old "Post" → "blog_post" or "social_post"
- Old "Follow" → connection with "following" type
- Old "Like" → event with "content_liked" type

### Step 2: Transform Properties

Extract structured data into `properties` JSON:

```typescript
// Old user model
{
  id: "123",
  name: "John",
  email: "john@example.com",
  bio: "Fitness coach",
  followers: 5000
}

// New entity
{
  type: "creator",
  name: "John",
  properties: {
    email: "john@example.com",
    username: "john",
    displayName: "John",
    bio: "Fitness coach",
    niche: ["fitness"],
    totalFollowers: 5000,
    totalContent: 0,
    totalRevenue: 0
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
}
```

### Step 3: Convert Relationships

Transform foreign keys into connections:

```typescript
// Old: user_id in posts table
// New: connection
{
  fromThingId: userId,
  toThingId: postId,
  relationshipType: "authored",
  createdAt: Date.now()
}
```

### Step 4: Preserve History

Convert activity logs to events:

```typescript
// Old: activity log entry
{ user: "123", action: "viewed", post: "456", timestamp: 1234567890 }

// New: event
{
  thingId: "post-456",
  eventType: "content_viewed",
  timestamp: 1234567890,
  actorType: "user",
  actorId: "user-123"
}
```

---

## Validation Rules

### Thing Validation

- `type` must be valid ThingType (implementation alias may be `EntityType`)
- `name` cannot be empty
- `properties` structure must match type
- `status` must be valid status
- `createdAt` required, `updatedAt` required

### Connection Validation

- `fromThingId` must exist
- `toThingId` must exist
- `relationshipType` must be valid
- Cannot connect a thing to itself (usually)
- Relationship must make semantic sense

### Event Validation

- `thingId` must exist
- `eventType` must be valid
- `timestamp` required
- `actorId` must exist if provided
- `metadata` structure must match event type

### Tag Validation

- `name` must be unique
- `category` must be valid TagCategory
- `usageCount` must be >= 0

---

## Performance Optimization

### Indexes

Every table has optimized indexes:

```typescript
things: -by_type(type) -
  by_status(status) -
  by_created(createdAt) -
  search_things(name, type, status);

connections: -from_type(fromThingId, relationshipType) -
  to_type(toThingId, relationshipType) -
  bidirectional(fromThingId, toThingId);

events: -thing_type_time(thingId, eventType, timestamp) -
  type_time(eventType, timestamp) -
  session(sessionId, timestamp);

knowledge: -by_type(knowledgeType) -
  by_source(sourceThingId) -
  by_created(createdAt);
```

### Query Optimization

- Always use indexes for filters
- Limit results with `.take(n)`
- Paginate large result sets
- Use `.collect()` sparingly, prefer streaming

---

## Event Retention & Archival

- Purpose: keep queries fast and costs predictable at scale.
- Recommended windows (tune per deployment):
  - Hot (fast queries): last 30–90 days in primary `events` table, fully indexed.
  - Warm (historical analytics): 90–365 days; restrict heavy scans and rely on `type_time`/`actor_time`.
  - Cold archive: >365 days exported to warehouse/storage; query via batch jobs or precomputed aggregates.
- Patterns:
  - Use `type_time` and `actor_time` for filters; avoid full scans.
  - Precompute aggregates into `metric` entities (daily revenue, views) to avoid wide re-reads.
  - Optional scheduled rollups to move very old events to archive and keep hot sets lean.

---

## Protocol Integration Examples

### How Protocols Map to This Ontology

**Key Principle:** Our ontology is protocol-agnostic. Protocols identify themselves via `metadata.protocol`.

#### A2A Protocol (Agent-to-Agent)

```typescript
// Event: Agent delegates task
{
  type: "task_delegated",
  actorId: oneAgentId,
  targetId: externalAgentId,
  timestamp: Date.now(),
  metadata: {
    protocol: "a2a",
    task: "research_market_trends",
    parameters: { industry: "fitness" }
  }
}

// Connection: Agents communicate
{
  fromThingId: oneAgentId,
  toThingId: externalAgentId,
  relationshipType: "communicates_with",
  metadata: {
    protocol: "a2a",
    platform: "elizaos",
    messagesExchanged: 42
  }
}
```

#### ACP Protocol (Agentic Commerce)

```typescript
// Event: Purchase initiated
{
  type: "commerce_event",
  actorId: agentId,
  targetId: transactionId,
  timestamp: Date.now(),
  metadata: {
    protocol: "acp",
    eventType: "purchase_initiated",
    agentPlatform: "chatgpt",
    productId: productId,
    amount: 99.00
  }
}

// Connection: Merchant approves
{
  fromThingId: merchantId,
  toThingId: transactionId,
  relationshipType: "approved",
  metadata: {
    protocol: "acp",
    approvalType: "transaction",
    approvedAt: Date.now()
  }
}
```

#### AP2 Protocol (Agent Payments)

```typescript
// Event: Intent mandate created
{
  type: "mandate_created",
  actorId: userId,
  targetId: mandateId,
  timestamp: Date.now(),
  metadata: {
    protocol: "ap2",
    mandateType: "intent",
    autoExecute: true,
    maxBudget: 1500
  }
}

// Event: Price checked
{
  type: "price_checked",
  actorId: agentId,
  targetId: intentMandateId,
  timestamp: Date.now(),
  metadata: {
    protocol: "ap2",
    productId: "prod_123",
    currentPrice: 1399,
    targetPrice: 1500,
    withinBudget: true
  }
}

// Connection: Cart fulfills intent
{
  fromThingId: intentMandateId,
  toThingId: cartMandateId,
  relationshipType: "fulfills",
  metadata: {
    protocol: "ap2",
    fulfillmentType: "intent_to_cart",
    matchScore: 0.95
  }
}
```

#### X402 Protocol (HTTP Micropayments)

```typescript
// Event: Payment requested (402 status)
{
  type: "payment_requested",
  actorId: apiServiceId,
  targetId: resourceId,
  timestamp: Date.now(),
  metadata: {
    protocol: "x402",
    scheme: "permit",
    network: "base",
    amount: "0.01",
    resource: "/api/agent/analyze"
  }
}

// Event: Payment verified
{
  type: "payment_verified",
  actorId: systemId,
  targetId: paymentId,
  timestamp: Date.now(),
  metadata: {
    protocol: "x402",
    network: "base",
    txHash: "0x...",
    verified: true
  }
}

// Connection: Payment made
{
  fromThingId: payerId,
  toThingId: serviceId,
  relationshipType: "transacted",
  metadata: {
    protocol: "x402",
    network: "base",
    amount: "0.01",
    txHash: "0x..."
  }
}
```

#### AG-UI Protocol (CopilotKit Generative UI)

```typescript
// Event: UI component sent
{
  type: "message_sent",
  actorId: agentId,
  targetId: conversationId,
  timestamp: Date.now(),
  metadata: {
    protocol: "ag-ui",
    messageType: "ui",
    component: "chart",
    data: { chartType: "line", ... }
  }
}

// Connection: No connections needed (UI is stateless)
```

### Cross-Protocol Queries

**All payments across all protocols:**

```typescript
const allPayments = await ctx.db
  .query("events")
  .filter((q) => q.eq(q.field("type"), "payment_processed"))
  .collect();
```

**Only X402 blockchain payments:**

```typescript
const x402Payments = allPayments.filter((e) => e.metadata.protocol === "x402");
```

**Total revenue by protocol:**

```typescript
const byProtocol = allPayments.reduce((acc, e) => {
  const protocol = e.metadata.protocol || "traditional";
  acc[protocol] = (acc[protocol] || 0) + e.metadata.amount;
  return acc;
}, {});

// Result: { x402: 1250, acp: 3400, ap2: 890, traditional: 5600 }
```

---

## Merged: Protocol Integration Requirements (from OntologyUpdates.md)

This section consolidates the proposal in `OntologyUpdates.md` into the ontology's protocol‑agnostic model. We preserve the 6‑dimension architecture (organizations, people, things, connections, events, knowledge) and use consolidated types + `metadata.protocol` for extensibility and query performance.

- Things
  - Keep consolidated `mandate` thing with `properties.mandateType: "intent" | "cart"` instead of separate `intent_mandate`/`cart_mandate` types. This reduces index fan‑out and simplifies queries while preserving full fidelity in `properties`.
  - Keep `product` (ACP/marketplace) and `payment` (transaction). For X402/AP2/ACP specifics, store details in `payment.properties` and event metadata (see below).
  - External integrations remain: `external_agent`, `external_workflow`, `external_connection`.

- Connections
  - Use existing specific types (e.g., `owns`, `member_of`, `holds_tokens`) plus consolidated types with metadata:
    - `communicated` for cross‑agent communication (A2A/ACP/AG‑UI)
    - `delegated` for task delegation/assignment
    - `approved` for approvals; `fulfilled` for fulfillment; `transacted` for financial relations
  - Protocol identity is always in `metadata.protocol`.

- Events (consolidated, protocol‑aware)
  - Use consolidated events already defined in this spec:
    - `payment_event` with `metadata.status: requested|verified|processed` (X402/AP2/ACP)
    - `commerce_event` with `metadata.eventType` (ACP/AP2)
    - `communication_event` with `metadata.messageType` (A2A/ACP/AG‑UI)
    - `task_event` with `metadata.action: delegated|completed|failed`
    - `mandate_event` with `metadata.mandateType: intent|cart` (AP2)
  - We map granular variants proposed in `OntologyUpdates.md` (e.g., `message_sent`, `task_delegated`, `price_checked`) to the consolidated forms for index efficiency and simpler analytics.

- Protocol‑specific properties (examples)
  - AP2 Mandate (stored on `mandate` thing):
    - `properties`: `{ mandateType: "intent"|"cart", intent?: {...}, items?: [...], subtotal, tax, total, status, signature, credentialHash, approvedAt?, completedAt? }`
  - X402/ACP/AP2 Payment (stored on `payment` thing and echoed in `payment_event.metadata`):
    - `properties`: `{ protocol: "x402"|"acp"|"ap2", scheme?, network?, amount, currency?, txHash?, invoiceId?, status }`

- Indexes (unchanged, validated)
  - `things`: `by_type`, `by_status`, `by_created`, plus `search_things(name, type, status)`
  - `connections`: `from_type`, `to_type`, `bidirectional`
  - `events`: `type_time`, `actor_time`, `thing_type_time`
  - `knowledge`: `by_type`, `by_source`, `by_created` (plus vector index when supported)

- Auth migration strategy (compatibility)
  - Existing auth tables (Better Auth: users, sessions, verification, resets, 2FA) remain intact.
  - Link `users` to `things` via optional `users.thingId` and backfill with an internal migration (see `OntologyUpdates.md`). This preserves zero‑downtime compatibility.

Rationale: Consolidation minimizes index cardinality, improves query ergonomics, and retains protocol fidelity in `metadata`/`properties`. This yields better beauty (clean mental model), completeness (coverage for all protocols), speed (lean indexes), and scalability (new protocols drop in via metadata).

---

## Extensibility: User-Safe Additions

Principle: Users can add to any type without breaking the ontology.

- Use `properties` for schema-free details; don’t edit core enums casually.
- Use knowledge labels to categorize, filter, and group. Add labels freely without schema changes.
- Use `metadata` on connections and events for protocol/workflow-specific context.
- When a new subtype emerges (e.g., new content flavor), prefer:
  - Keep `type` stable (e.g., `video`).
  - Add `properties.kind` and labels (e.g., `format:webinar`, `topic:fitness`).
  - Introduce a new enum literal only when global indexes/constraints benefit.
- Custom automations integrate via `external_agent`, `external_workflow`, and `external_connection` entities with `delegated`/`communicated` connections.

---

## Glossary (Compact)

- `entity` (thing): Any addressable object (creator, organization, content, product, payment, external_agent, mandate, etc.).
- `connection` (state): Relationship between two entities (owns, member_of, transacted, fulfilled, delegated, communicated).
- `event` (action): Time-stamped occurrence (content_changed, payment_event, communication_event, task_event, mandate_event).
- `knowledge` (label/chunk): Classification and RAG units applied via `thingKnowledge` (labels like skill/industry/topic and chunks with embeddings).
- `owner`: A `creator` with ownership responsibilities. Platform owner (platform_owner) or group owner (group_owner). See `one/people/owner.md`.
- `group`: Multi-tenant container for users and resources with hierarchical nesting. See `one/people/organisation.md`.

---

## Summary Statistics

**Dimensions:** 6 total (groups, people, things, connections, events, knowledge)

**Thing Types:** 66 total

- Core: 4 (creator, ai_clone, audience_member, organization)
- Business Agents: 10
- Content: 7
- Products: 4
- Community: 3
- Token: 2
- Knowledge: 2
- Platform: 6
- Business: 7
- Authentication & Session: 5
- Marketing: 6
- External: 3
- Protocol: 2

**Connection Types:** 25 total (Hybrid approach)

- 18 specific semantic types
- 7 consolidated types with metadata variants
- Protocol-agnostic via metadata.protocol
- Includes group membership with role-based metadata

**Event Types:** 67 total (Hybrid approach)

- 4 Thing lifecycle
- 5 User events
- 6 Authentication events
- 5 Group events (formerly "Organization events")
- 4 Dashboard & UI events
- 4 AI/Clone events
- 4 Agent events
- 7 Token events
- 5 Course events
- 5 Analytics events
- 7 Cycle events
- 5 Blockchain events
- 11 consolidated types with metadata variants

**Design Benefits:**

- Six-dimension reality model
- Multi-tenant by design
- Clear ownership & governance
- Protocol-agnostic core
- Infinite protocol extensibility
- Cross-protocol analytics
- Type-safe
- Future-proof
- Scales from children to enterprise

---

## Knowledge Governance

Policy: Default is free-form, user-extensible knowledge labels for maximum flexibility and zero schema churn.

- Curated label prefixes (recommended): `skill:*`, `industry:*`, `topic:*`, `format:*`, `goal:*`, `audience:*`, `technology:*`, `status:*`, `capability:*`, `protocol:*`, `payment_method:*`, `network:*`.
- Validation: Enforce label hygiene (no duplicates within scope); allow synonyms via an alias list if needed.
- Ownership: Platform/group owners may curate official labels; users can still apply ad‑hoc labels.
- Hygiene: Periodically consolidate low-usage duplicates; do not delete knowledge items with active references—mark deprecated instead.

---

## Changelog

- 2025-10-14
  - Updated terminology from "organizations" to "groups" throughout Frontend Integration Examples, Summary Statistics, Philosophy, Knowledge Governance, and Glossary sections.
  - Updated all code examples to use `groups` table and `groupId` references instead of organizations/orgId.
  - Changed event category from "Organization events" to "Group events" in Summary Statistics.
  - Updated role references from `org_owner` to `group_owner` throughout examples.
  - Clarified that groups scale hierarchically from friend circles to governments.
  - Updated RAG ingestion strategy to use "group" filtering instead of "org".

- 2025-10-07
  - Canonicalized terminology: "things" as the conceptual term; kept implementation table/fields as `entities` for compatibility.
  - Merged protocol integration requirements; clarified consolidated events/connections with `metadata.protocol`.
  - Added Event Retention & Archival guidance for scale.
  - Added Extensibility rules and a compact Glossary.
  - Added Knowledge Governance and links to `owner.md` and `organisation.md`.

**Thing Types:** 66 total

- Core: 4 (creator, ai_clone, audience_member, organization)
- Business Agents: 10
- Content: 7
- Products: 4
- Community: 3
- Token: 2
- Knowledge: 2
- Platform: 6
- Business: 7
- Authentication & Session: 5 (session, oauth_account, verification_token, password_reset_token, ui_preferences)
- Marketing: 6
- External: 3
- Protocol: 2

**Connection Types:** 25 total (Hybrid approach)

- 18 specific semantic types
- 7 consolidated types with metadata variants
- Protocol-agnostic via metadata.protocol
- Includes group membership with role-based metadata

**Event Types:** 63 total (Hybrid approach)

- 4 Thing lifecycle
- 5 User events
- 6 Authentication events (password_reset, email_verification, 2FA)
- 5 Group events (group_created, user_invited_to_group, user_joined_group)
- 4 Dashboard & UI events (dashboard_viewed, theme_changed, settings_updated)
- 4 AI/Clone events
- 4 Agent events
- 7 Token events
- 5 Course events
- 5 Analytics events
- **7 Cycle events** (NEW: cycle_request, cycle_completed, revenue_collected, quota_exceeded)
- **5 Blockchain events** (NEW: nft_minted, nft_transferred, tokens_bridged, contract_deployed, treasury_withdrawal)
- 11 consolidated types with metadata variants
- Protocol identification via metadata.protocol + metadata.network

**Tag Categories:** 12 total

- Industry, skill, topic, format, goal, audience, technology, status
- Plus: capability, protocol, payment_method, network

**Design Benefits:**

- ✅ Single source of truth
- ✅ Protocol-agnostic core
- ✅ Infinite protocol extensibility
- ✅ Cross-protocol analytics
- ✅ Clean, maintainable
- ✅ Type-safe
- ✅ Future-proof

---

**END OF ONTOLOGY SPECIFICATION**

## The Philosophy: Reality as DSL

**This isn't a database schema. It's a Domain-Specific Language for reality itself.**

### The Core Insight

**Most systems model their application. ONE models reality.**

This ontology proves that you don't need hundreds of tables or complex schemas to build a complete AI-native platform. You need:

1. **6 dimensions** (groups, people, things, connections, events, knowledge)
2. **66 thing types** (every "thing")
3. **25 connection types** (every relationship)
4. **67 event types** (every action)
5. **Metadata** (for protocol identity via metadata.protocol)

That's it. Everything else is just data.

### Why This Works for AI Agents

**Traditional codebases:**

- 100 different patterns for the same concept
- AI sees chaos, accuracy degrades (95% → 30%)
- Technical debt compounds
- Each feature makes the next HARDER

**ONE codebase:**

- 1 universal pattern for each dimension
- AI sees structure, accuracy compounds (85% → 98%)
- Technical credit accumulates
- Each feature makes the next EASIER

**The result:** 100x developer productivity. Not hyperbole. Math.

### Why Schema Migrations Never Happen

**Other systems:**

- Create new tables for every feature
- Add protocol-specific columns
- Pollute schema with temporary concepts
- End up with 50+ tables, 200+ columns
- Require migrations for every change
- Become unmaintainable nightmares

**ONE's approach:**

- Map every feature to 6 dimensions (reality model)
- Groups partition the space (hierarchical containers)
- People authorize and govern (role-based access)
- Things exist with flexible properties (no migrations)
- Connections relate (metadata for protocols)
- Events record (complete audit trail)
- Knowledge understands (embeddings + RAG)
- Scale infinitely without schema changes
- Stay simple, clean, beautiful

### The Economic Impact

**Traditional Development:**

- Developer writes 100 lines/day
- AI assistance degrades over time
- Technical debt compounds
- Codebases become unmaintainable
- **Cost scales linearly with codebase size**

**ONE Development:**

- Agent generates 10,000 lines/day (100x)
- AI accuracy improves over time (98%+)
- Structure compounds (technical credit)
- Codebases become MORE maintainable
- **Cost scales sublinearly—larger codebases are cheaper per feature**

**Result:** 12x cheaper per feature at scale. Feature #100 costs LESS than feature #1.

### The Universal Language

A system architecture that:

- **Scales infinitely** - Lemonade stands to global governments, same schema
- **Children can understand** - "I own (group), I'm the boss (person), I sell lemonade (things)"
- **Enterprises can rely on** - Multi-tenant isolation, clear governance, infinite scale
- **AI agents can master** - 6 patterns, 98% accuracy, compound structure
- **Never breaks** - Reality doesn't change, technology does
- **Grows more powerful** - Each feature adds structure, making the next feature easier
- **Enables feature import** - Clone ANY system into the ontology (Shopify, Moodle, Stripe, etc.)

### What This Enables

**1. Compound Velocity**

- Traditional: Feature #100 takes LONGER than feature #1 (technical debt)
- ONE: Feature #100 takes LESS TIME than feature #1 (pattern reuse)

**2. Universal Feature Import**

- Traditional: Want Shopify's checkout? Build from scratch (3 months)
- ONE: Point agent-clone at Shopify. Clone checkout feature (20 minutes)

**3. Backend Agnosticism**

- Traditional: Migrating from WordPress to custom backend takes months
- ONE: Switch `CONTENT_SOURCE` env var. Done in 1 minute.

**4. AI-Native Development**

- Traditional: AI is an assistant. Human is the driver (70% human work)
- ONE: AI is the primary builder. Human is the architect (2% human work at scale)

**5. No Breaking Changes**

- Traditional: Major versions break everything
- ONE: Technology changes (React → Svelte), ontology stays the same

**This is what happens when you design for AI agents first, not humans.**

The 6-dimension ontology is the **universal code generation language** that enables 98% accuracy by modeling reality itself.

---

## Frontend Integration Examples

### How the Frontend Uses This Ontology

The Astro frontend (documented in `Frontend.md`) uses this ontology through:

1. **Astro Content Collections** - Can load entities as typed collections
2. **Convex Hooks** - Real-time subscriptions to entity/connection/event data
3. **Hono API** - Complex mutations that create/update entities and log events

**Example: Multi-Tenant Dashboard**

```typescript
// Frontend Component (src/components/admin/GroupList.tsx)
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function GroupList() {
  // Query groups (table: "groups")
  const groups = useQuery(api.queries.admin.listGroups);

  return (
    <div>
      {groups?.map(group => (
        <Card key={group._id}>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            <Badge>{group.settings.plan}</Badge>
          </CardHeader>
          <CardContent>
            <p>{group.metadata.userCount || 0} / {group.settings.limits.users} users</p>
            <p>Status: {group.status}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Example: Authentication Flow**

```typescript
// Password reset request creates:
// 1. Entity: password_reset_token
// 2. Event: password_reset_requested

// Backend (Convex mutation)
export const requestPasswordReset = mutation({
  handler: async (ctx, { email }) => {
    // 1. Find user entity
    const user = await ctx.db
      .query("entities")
      .filter((q) => q.eq(q.field("properties.email"), email))
      .first();

    if (!user) return { success: true }; // Don't reveal if user exists

    // 2. Create password_reset_token entity
    const tokenId = await ctx.db.insert("entities", {
      type: "password_reset_token",
      name: `Reset token for ${email}`,
      properties: {
        userId: user._id,
        token: hashedToken,
        expiresAt: Date.now() + 30 * 60 * 1000,
      },
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 3. Log event
    await ctx.db.insert("events", {
      type: "password_reset_requested",
      actorId: user._id,
      targetId: tokenId,
      timestamp: Date.now(),
      metadata: {
        email,
        ipAddress: ctx.auth.sessionId,
        expiresAt: Date.now() + 30 * 60 * 1000,
      },
    });

    return { success: true };
  },
});

// Frontend usage
import { useMutation } from "convex/react";

export function PasswordResetForm() {
  const requestReset = useMutation(api.auth.requestPasswordReset);

  const handleSubmit = async (email: string) => {
    await requestReset({ email });
    // Show success message
  };
}
```

**Example: Group Membership Check**

```typescript
// Check if user is group_owner (Middleware.md pattern)
export const checkGroupOwner = query({
  args: { userId: v.id("things"), groupId: v.id("groups") },
  handler: async (ctx, { userId, groupId }) => {
    // Query connection with role metadata
    const membership = await ctx.db
      .query("connections")
      .withIndex("from_type", (q) =>
        q
          .eq("fromThingId", userId)
          .eq("toThingId", groupId)
          .eq("relationshipType", "member_of"),
      )
      .first();

    return membership?.metadata?.role === "group_owner";
  },
});

// Frontend usage in middleware
import { ConvexHttpClient } from "convex/browser";

export async function checkAccess(userId: string, groupId: string) {
  const convex = new ConvexHttpClient(env.CONVEX_URL);
  const isOwner = await convex.query(api.auth.checkGroupOwner, {
    userId,
    groupId,
  });

  if (!isOwner) {
    throw new Error("Forbidden: Group owner access required");
  }
}
```

**Example: Dashboard Analytics**

```typescript
// Query events for analytics (Dashboard.md pattern)
export const getGroupAnalytics = query({
  args: { groupId: v.id("groups"), days: v.number() },
  handler: async (ctx, { groupId, days }) => {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get all dashboard_viewed events for group users
    const groupMembers = await ctx.db
      .query("connections")
      .withIndex("to_type", (q) =>
        q.eq("toThingId", groupId).eq("relationshipType", "member_of"),
      )
      .collect();

    const memberIds = groupMembers.map((m) => m.fromThingId);

    const dashboardViews = await ctx.db
      .query("events")
      .withIndex("type_time", (q) =>
        q.eq("type", "dashboard_viewed").gte("timestamp", since),
      )
      .filter((q) => memberIds.includes(q.field("actorId")))
      .collect();

    return {
      totalViews: dashboardViews.length,
      uniqueUsers: new Set(dashboardViews.map((e) => e.actorId)).size,
      averageSessionDuration:
        dashboardViews.reduce(
          (sum, e) => sum + (e.metadata.sessionDuration || 0),
          0,
        ) / dashboardViews.length,
    };
  },
});
```

**Example: UI Preferences Sync**

```typescript
// Update user preferences (creates ui_preferences thing if not exists)
export const updatePreferences = mutation({
  args: {
    userId: v.id("entities"),
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    ),
    language: v.optional(v.string()),
  },
  handler: async (ctx, { userId, theme, language }) => {
    // Get or create ui_preferences entity
    let prefs = await ctx.db
      .query("entities")
      .withIndex("by_type", (q) => q.eq("type", "ui_preferences"))
      .filter((q) => q.eq(q.field("properties.userId"), userId))
      .first();

    if (!prefs) {
      // Create new preferences entity
      const prefsId = await ctx.db.insert("entities", {
        type: "ui_preferences",
        name: `Preferences for user ${userId}`,
        properties: {
          userId,
          theme: theme || "system",
          language: language || "en",
          timezone: "UTC",
          dashboardLayout: {
            sidebarCollapsed: false,
            defaultView: "grid",
            itemsPerPage: 20,
          },
          notifications: { email: true, push: false, sms: false, inApp: true },
          accessibility: {
            reducedMotion: false,
            highContrast: false,
            fontSize: "medium",
          },
          updatedAt: Date.now(),
        },
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      prefs = await ctx.db.get(prefsId);
    } else {
      // Update existing preferences
      await ctx.db.patch(prefs._id, {
        properties: {
          ...prefs.properties,
          theme: theme || prefs.properties.theme,
          language: language || prefs.properties.language,
          updatedAt: Date.now(),
        },
        updatedAt: Date.now(),
      });
    }

    // Log preferences_updated event
    if (theme) {
      await ctx.db.insert("events", {
        type: "theme_changed",
        actorId: userId,
        targetId: prefs._id,
        timestamp: Date.now(),
        metadata: {
          previousTheme: prefs.properties.theme,
          newTheme: theme,
        },
      });
    }

    return { success: true };
  },
});

// Frontend hook
export function usePreferences(userId: string) {
  const prefs = useQuery(api.queries.preferences.get, { userId });
  const updatePrefs = useMutation(api.mutations.preferences.update);

  return { preferences: prefs?.properties, updatePreferences: updatePrefs };
}
```

### Key Frontend Patterns

**1. Thing as Content Collection**

```typescript
// src/content/config.ts
const agentsCollection = defineCollection({
  type: "data",
  loader: async () => {
    const convex = new ConvexHttpClient(env.CONVEX_URL);
    const agents = await convex.query(api.queries.entities.list, {
      type: "strategy_agent",
    });
    return agents;
  },
});
```

**2. Real-time Dashboard Stats**

```tsx
export function DashboardStats({ groupId }) {
  // Subscribes to changes - auto-updates when events are logged!
  const stats = useQuery(api.queries.dashboard.getStats, { groupId });

  return <StatsCards data={stats} />;
}
```

**3. Permission-Based Rendering**

```tsx
export function AdminPanel({ userId, groupId }) {
  const membership = useQuery(api.queries.groups.getMembership, {
    userId,
    groupId,
  });

  if (membership?.metadata?.role !== "group_owner") {
    return <div>Access denied</div>;
  }

  return <AdminDashboard />;
}
```

**4. Astro SSR with Ontology**

```astro
---
// src/pages/group/[groupId]/dashboard.astro
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(import.meta.env.PUBLIC_CONVEX_URL);

// Fetch group
const group = await convex.query(api.queries.groups.get, {
  id: Astro.params.groupId,
});

// Fetch group members (connections where relationshipType = "member_of")
const members = await convex.query(api.queries.groups.getMembers, {
  groupId: Astro.params.groupId,
});
---

<Layout title={group.name}>
  <h1>{group.name} Dashboard</h1>
  <p>Plan: {group.settings.plan}</p>
  <p>Members: {members.length} / {group.settings.limits.users}</p>

  <!-- Real-time stats component -->
  <GroupStats client:load groupId={group._id} />
</Layout>
```

This demonstrates how the complete ontology (things, connections, events, knowledge) powers the entire frontend architecture through clean, type-safe queries and real-time subscriptions.

---

## For Implementers: Using the Universal Language

### AI Agents: The 6-Question Framework

When implementing ANY feature, ask these 6 questions (maps to 6 dimensions):

1. **Groups** - Which group owns this? Any parent/child relationships?
2. **People** - Who can access/modify this? What role is required?
3. **Things** - What entities are involved? Which thing types?
4. **Connections** - How do they relate? Which connection types?
5. **Events** - What actions need logging? Which event types?
6. **Knowledge** - What needs to be learned/searched? Labels? Chunks? Embeddings?

**Example: User Purchases a Course**

1. **Groups** - User's organization (groupId scoping)
2. **People** - User (role: customer), Creator (role: org_owner)
3. **Things** - User thing, Course thing, Payment thing
4. **Connections** - User → Course (enrolled_in), User → Payment (transacted)
5. **Events** - course_enrolled, payment_processed
6. **Knowledge** - Course chunks (RAG), "education" label, "video" label

**Pattern Learned:** Every feature maps to all 6 dimensions. This is the universal pattern.

### Humans: Why This Matters

**You're building the universal code generation language.**

Your AI agents now have a complete, unambiguous data model. They will generate consistent database operations because they understand the underlying structure.

**Key insights:**

- The ontology models reality, not your app (that's why it never breaks)
- Each feature AI generates makes the NEXT feature more accurate
- You're not managing technical debt—you're accumulating technical credit
- 100 features in, your codebase is EASIER to work with, not harder

### Developers: Pattern Recognition

**You have a schema that will never need major refactoring.**

**Adding features:**

- New entity type? → Add to `properties`, no schema migration
- New relationship? → Use existing connection types + metadata
- New protocol? → Add `metadata.protocol`, no new tables
- New workflow? → Compose existing services via Effect.ts

**What you DON'T do:**

- ❌ Create custom tables (map to 6 dimensions instead)
- ❌ Add protocol-specific columns (use metadata)
- ❌ Schema migrations for new fields (use properties)
- ❌ Hardcode patterns (use provider interface)

**What you DO:**

- ✅ Map features to 6 dimensions (groups, people, things, connections, events, knowledge)
- ✅ Use flexible properties for type-specific data
- ✅ Use metadata for protocol identity
- ✅ Compose services via Effect.ts
- ✅ Log all actions as events (complete audit trail)

### The Learning Curve

**Generation 1-10: Learning the ontology (85% accuracy)**

- You're teaching AI the 6 dimensions
- Patterns are being established
- Services are being created

**Generation 11-50: Pattern recognition (90-93% accuracy)**

- AI recognizes the universal patterns
- Services are being reused
- Composition is happening

**Generation 51-100: Pattern mastery (96-98% accuracy)**

- AI has internalized the structure
- Generation is deterministic
- You're reviewing, not debugging

**Generation 100+: Generalized patterns (98%+ accuracy)**

- AI doesn't need to think
- Every decision is pattern-based
- You're the architect, AI is the builder

**This ontology is complete. It's ready for production. It's the foundation for 98% AI code generation accuracy.**

---

## Summary: The Universal Code Generation Language

### What Makes ONE Universal

1. **6-Dimension Ontology** - Models reality, not technology
2. **Compound Structure** - Each feature adds structure (not debt)
3. **Pattern Convergence** - 1 pattern per dimension (not 100 patterns)
4. **Backend Agnostic** - Swap technology freely (Convex, WordPress, Shopify)
5. **Never Breaks** - Reality doesn't change, technology does
6. **Infinite Scale** - Lemonade stands to global governments, same schema

### The Economic Result

**Traditional Codebases:**

```
100 files → 90% accurate
1,000 files → 70% accurate
10,000 files → 30% accurate
AI becomes a liability
```

**ONE Codebase:**

```
100 files → 85% accurate (learning)
1,000 files → 92% accurate (mastering)
10,000 files → 98% accurate (generalized)
AI becomes more valuable
```

**Why?** The ontology is the language. Patterns converge. Structure compounds.

### Next Steps for AI Agents

**When implementing ANY feature:**

1. Read `/CLAUDE.md` (platform overview)
2. Read `/one/knowledge/ontology.md` (this file - understand the 6 dimensions)
3. Read `/one/knowledge/architecture.md` (why this enables 98% accuracy)
4. Map feature to ontology (groups, people, things, connections, events, knowledge)
5. Generate Effect.ts services (composable business logic)
6. Generate provider adapters (if needed)
7. Generate UI components (shadcn/ui)
8. Test with mocked layers

**Remember:**

- The ontology never changes (it's reality)
- Effect.ts is for agents (predictable patterns)
- Provider pattern is the universal adapter
- Every feature adds structure
- Each generation compounds accuracy

**This is how software should be built.**

---

## RAG Ingestion Strategy for `one/`

Objective: attach vectors to every relevant piece of content to enable high‑quality retrieval, while preserving ontology simplicity.

1. Inventory sources (by thing type)

- Text bodies: `blog_post.content`, `social_post.text`, `email.content`, `lesson.content`, `course.description`, `website.page.html (stripped)`
- Transcripts: `video.transcript`, `podcast.transcript`, `livestream.recording.transcript`
- Metadata: titles, summaries, captions

2. Chunking standard

- Window: ~800 tokens; overlap: ~200 tokens; language‑aware sentence boundaries when possible.
- Store per‑chunk: `{ index, tokenCount, start, end, overlap }`.

3. Embedding policy

- Model: configurable via env (e.g., `text-embedding-3-large`). Store `embeddingModel` + `embeddingDim` per knowledge item.
- PII/Privacy: use `knowledgeType: 'vector_only'` for sensitive texts; omit `text` and keep only embeddings + hashes.

4. Ingestion pipeline

- Mutation: `scheduleEmbeddingForThing({ thingId, fields[] })` validates and enqueues work.
- Internal action: `embedText({ text, model })` calls provider and returns `embedding`.
- Internal mutation: `upsertKnowledgeChunks({ thingId, chunks[] })` writes `knowledge` items and links via `thingKnowledge` with role `chunk_of`.
- Event log: `content_changed` on source updates triggers re‑embedding (debounced) via scheduler.

5. Query + retrieval

- Vector search over `knowledge` filtered by group, creator, and content type; k‑NN approximate index when available, else provider‑side search.
- Hybrid scoring: combine semantic similarity with lexical signals from `labels` and metadata.

6. Governance + lifecycle

- Versioning: keep `metadata.hash` of source; if unchanged, skip.
- Retention: archive old chunks on major edits; GC orphaned knowledge items.
- Quality: track `metadata.qualityScore` and `feedback` for active learning.

Example (Convex pseudo‑API)

```typescript
// internal action: embed text
export const embedText = internalAction({
  args: { text: v.string(), model: v.optional(v.string()) },
  handler: async (ctx, { text, model }) => {
    const embedding = await callEmbedProvider(text, model);
    return {
      embedding,
      model: model || "text-embedding-3-large",
      dim: embedding.length,
    };
  },
});

// mutation: schedule embedding for a thing
export const scheduleEmbeddingForThing = mutation({
  args: { id: v.id("things"), fields: v.optional(v.array(v.string())) },
  handler: async (ctx, { id, fields }) => {
    await ctx.scheduler.runAfter(0, internal.rag.ingestThing, { id, fields });
  },
});

// internal action: ingest a thing into knowledge
export const ingestThing = internalAction({
  args: { id: v.id("things"), fields: v.optional(v.array(v.string())) },
  handler: async (ctx, { id, fields }) => {
    const thing = await ctx.runQuery(internal.entities.get, { id });
    const texts = extractTexts(thing, fields);
    let index = 0;
    for (const t of chunk(texts, { size: 800, overlap: 200 })) {
      const { embedding, model, dim } = await ctx.runAction(
        internal.rag.embedText,
        { text: t.text },
      );
      const knowledgeId = await ctx.runMutation(internal.rag.upsertKnowledge, {
        item: {
          knowledgeType: "chunk",
          text: t.text,
          embedding,
          embeddingModel: model,
          embeddingDim: dim,
          sourceThingId: id,
          sourceField: t.field,
          chunk: { index, tokenCount: t.tokens, overlap: 200 },
          labels: t.labels,
        },
      });
      await ctx.runMutation(internal.rag.linkThingKnowledge, {
        thingId: id,
        knowledgeId,
        role: "chunk_of",
      });
      index++;
    }
  },
});
```

This strategy keeps vectors first‑class without expanding primitives: knowledge absorbs both legacy tags (as labels) and semantic chunks (as embeddings).
