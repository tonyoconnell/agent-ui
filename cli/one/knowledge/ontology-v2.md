---
title: Ontology
dimension: knowledge
category: ontology.md
tags: 6-dimensions, ai, architecture, ontology
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-25
updated: 2025-11-25
version: 2.0.0
ai_context: |
  This document is part of the knowledge dimension in the ontology.md category.
  Location: one/knowledge/ontology-v2.md
  Purpose: Documents one platform - ontology specification v2
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand ontology.
---

# ONE Platform - Ontology Specification V2

**Version:** 2.0.0 (Reality as DSL - The Universal Code Generation Language)
**Status:** Active - Reality-Aware Architecture
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


### System Group Pattern (Global Entities)

**Problem:** Some entities are truly global and don't belong to any user group.

**Examples:**
- Platform-wide settings
- System notifications  
- Global rate limits
- Reference data (timezones, currencies, countries)
- Platform-level analytics

**Solution:** Reserve a special "system" group.

```typescript
// Create system group on platform initialization
const SYSTEM_GROUP_ID = 'system';

await ctx.db.insert('groups', {
  _id: SYSTEM_GROUP_ID,
  slug: 'system',
  name: 'System',
  type: 'organization',
  settings: {
    visibility: 'private',
    joinPolicy: 'invite_only',
    plan: 'enterprise',
    limits: { users: Infinity, storage: Infinity, apiCalls: Infinity }
  },
  status: 'active',
  createdAt: Date.now(),
});

// Use for global entities
await ctx.db.insert('things', {
  type: 'platform_setting',
  name: 'Global Rate Limit',
  groupId: SYSTEM_GROUP_ID,  // System group
  properties: {
    maxRequestsPerMinute: 1000,
    scope: 'global'
  },
  status: 'active',
  createdAt: Date.now(),
});
```

**Rules:**
- System group ID is reserved and cannot be deleted
- Only platform owners can create things in system group
- System group has no resource limits
- System entities are visible to all groups (read-only)

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

### RAG Ingestion Strategy

Objective: Attach vectors to **relevant** content for high-quality retrieval while controlling costs and maintaining performance.

**CRITICAL:** Not every field needs RAG. Be selective. Embeddings are expensive in storage, compute, and money.

---

#### What to Embed (Decision Matrix by Domain)

**Universal Rule:**
```
IF "user will semantically search this" → EMBED
IF "user will filter/sort this" → DON'T EMBED
IF "structured data" → DON'T EMBED
```

| Content Type | Embed? | Domain Example | Use Case |
|--------------|--------|----------------|----------|
| **Long-form Content** |||||
| Blog post content | ✅ YES | Creator | "Find posts about React hooks" |
| Course lesson content | ✅ YES | E-Learning | "Search lessons on form validation" |
| Video/podcast transcripts | ✅ YES | E-Learning, Creator | Makes A/V content searchable |
| Email campaign body | ✅ YES | Creator, E-Commerce | Content discovery |
| **Product Content** |||||
| Product descriptions | ✅ YES | E-Commerce | "Find eco-friendly water bottles" |
| Product specs (JSON) | ❌ NO | E-Commerce | Use filters: `size === 'L'` |
| Customer reviews | ✅ YES | E-Commerce | "What do people say about durability?" |
| Q&A responses | ✅ YES | E-Commerce | Customer support knowledge base |
| Prices, SKUs, inventory | ❌ NO | E-Commerce | Exact match: `price < 50` |
| **Social Content** |||||
| Social post text (>100 chars) | ✅ YES | Social | "Find my AI posts with high engagement" |
| Social post text (<100 chars) | ❌ NO | Social | Too short, use labels |
| Thread content (combined) | ✅ YES | Social | Combine into single chunk |
| Hashtags | ❌ NO | Social | Exact match, not semantic |
| Comments (>50 words) | ⚠️ MAYBE | Social | Only for community insights |
| **Image Generation** |||||
| Image prompts | ✅ YES | Image Gen | "Find cyberpunk city prompts" |
| Prompt descriptions | ✅ YES | Image Gen | Style discovery |
| Negative prompts | ✅ YES | Image Gen | "Avoid common mistakes" |
| Generation params | ❌ NO | Image Gen | Use filters: `steps === 50` |
| Image pixels | ❌ NO | Image Gen | Use CLIP embeddings separately |
| **Educational Content** |||||
| Course descriptions | ✅ YES | E-Learning | Discovery + recommendations |
| Lesson summaries | ✅ YES | E-Learning | "React hooks for beginners" |
| Student notes | ✅ YES | E-Learning | Personal knowledge base |
| Quiz questions | ⚠️ MAYBE | E-Learning | Only for study guides |
| Progress data | ❌ NO | E-Learning | Use analytics: `progress >= 0.5` |
| Certificates | ❌ NO | E-Learning | Metadata only |
| **Metadata** |||||
| Titles, summaries | ✅ YES | All | High signal-to-noise |
| Descriptions (>50 words) | ✅ YES | All | Context for search |
| Tags, categories | ❌ NO | All | Use `labels` instead (free) |
| **User-Generated** |||||
| Bios, profiles | ⚠️ MAYBE | Social | Only for people search |
| **System Data** |||||
| Logs, errors | ❌ NO | All | Use log aggregation tools |
| Metrics, analytics | ❌ NO | All | Use time-series DB |
| Audit trails | ❌ NO | All | Events table is sufficient |

**Domain-Specific Examples:**

**E-Commerce:**
```typescript
// ✅ EMBED: Product discovery
"Find sustainable yoga mats" → Semantic search on descriptions

// ❌ DON'T EMBED: Filtering
"Show mats under $30" → Filter: price < 30
"In stock only" → Filter: inventory > 0
```

**E-Learning:**
```typescript
// ✅ EMBED: Course/lesson discovery
"Learn React hooks for beginners" → Semantic search on course descriptions + lesson transcripts

// ❌ DON'T EMBED: Progress tracking
"Show my completed courses" → Filter: connections where completed = true
```

**Image Generation:**
```typescript
// ✅ EMBED: Prompt library
"Cyberpunk city at night" → Semantic search on successful prompts

// ❌ DON'T EMBED: Generation settings
"Images with CFG 7.5" → Filter: metadata.cfg === 7.5
```

**Social Posting:**
```typescript
// ✅ EMBED: Content inspiration
"My posts about AI with high engagement" → Semantic search on post text

// ❌ DON'T EMBED: Engagement metrics
"Posts with >1000 likes" → Filter: engagement.likes > 1000
```

**Cost Reality Check (10K items):**

| Domain | What to Embed | Monthly Cost |
|--------|---------------|--------------|
| E-Commerce | Product descriptions | ~$1.30 |
| E-Learning | Lesson transcripts | ~$13 (longer content) |
| Image Gen | Prompts + descriptions | ~$0.50 |
| Social | Long posts only | ~$0.80 |

**Key Insight:** Be ruthlessly selective. Only embed content users will **semantically search**, not data they'll **filter or sort**.

---

#### When to Update Embeddings

**Trigger:** Content changes in source thing.

```typescript
// On content update
export const updateBlogPost = mutation({
  handler: async (ctx, { postId, content }) => {
    // 1. Update the thing
    await ctx.db.patch(postId, {
      properties: { content },
      updatedAt: Date.now(),
    });

    // 2. Schedule re-embedding (debounced)
    await ctx.scheduler.runAfter(5000, internal.knowledge.reEmbedThing, {
      thingId: postId,
      fields: ['content'],  // Only re-embed changed fields
    });

    // 3. Log event
    await ctx.db.insert('events', {
      type: 'content_event',
      actorId: ctx.auth.userId!,
      targetId: postId,
      groupId: post.groupId,
      timestamp: Date.now(),
      metadata: { action: 'updated', triggeredReEmbedding: true },
    });
  },
});
```

**Re-embedding Strategy:**

| Change Type | Action | Why |
|-------------|--------|-----|
| Content edited | Re-embed immediately | Content changed |
| Title/summary edited | Re-embed immediately | High-signal metadata |
| Tags/labels changed | Update labels only | No embedding needed |
| Status changed (draft→published) | Re-embed if first publish | Visibility changed |
| Minor typo fix | Debounce 5 seconds | Avoid re-embedding every keystroke |
| Bulk import | Batch embed (100/batch) | Rate limiting |

**Cost Optimization:**

```typescript
// Hash content to detect actual changes
import { createHash } from 'crypto';

export const reEmbedThing = internalMutation({
  handler: async (ctx, { thingId, fields }) => {
    const thing = await ctx.db.get(thingId);
    const content = fields.map(f => thing.properties[f]).join('\n');
    
    // Hash current content
    const contentHash = createHash('sha256').update(content).digest('hex');
    
    // Check if content actually changed
    const existingKnowledge = await ctx.db
      .query('knowledge')
      .withIndex('by_source')
      .filter(q => q.eq(q.field('sourceThingId'), thingId))
      .first();
    
    if (existingKnowledge?.metadata?.contentHash === contentHash) {
      console.log('Content unchanged, skipping re-embedding');
      return;  // Save $$$ by skipping
    }
    
    // Content changed, re-embed
    await embedAndStore(ctx, thing, content, contentHash);
  },
});
```

---

#### Chunking Standard

**Window:** ~800 tokens (~3,200 characters)  
**Overlap:** ~200 tokens (~800 characters)  
**Boundaries:** Sentence-aware (don't split mid-sentence)

```typescript
export async function chunkText(text: string): Promise<Chunk[]> {
  const chunks: Chunk[] = [];
  const sentences = text.split(/[.!?]+\s+/);  // Split on sentence boundaries
  
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;
  
  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);
    
    if (currentTokens + sentenceTokens > 800 && currentChunk.length > 0) {
      // Save chunk
      chunks.push({
        index: chunkIndex++,
        text: currentChunk.trim(),
        tokenCount: currentTokens,
        start: chunks.length > 0 ? chunks[chunks.length - 1].end - 200 : 0,
        end: currentChunk.length,
      });
      
      // Start new chunk with overlap (last 200 tokens)
      const overlapText = getLastNTokens(currentChunk, 200);
      currentChunk = overlapText + ' ' + sentence;
      currentTokens = 200 + sentenceTokens;
    } else {
      currentChunk += ' ' + sentence;
      currentTokens += sentenceTokens;
    }
  }
  
  // Save final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      index: chunkIndex,
      text: currentChunk.trim(),
      tokenCount: currentTokens,
      start: chunks.length > 0 ? chunks[chunks.length - 1].end - 200 : 0,
      end: currentChunk.length,
    });
  }
  
  return chunks;
}
```

---

#### Embedding Pipeline

```typescript
// 1. Schedule embedding
export const scheduleEmbeddingForThing = mutation({
  handler: async (ctx, { thingId, fields }) => {
    await ctx.scheduler.runAfter(0, internal.knowledge.embedThing, {
      thingId,
      fields,
    });
  },
});

// 2. Embed text (internal action - calls OpenAI)
export const embedText = internalAction({
  handler: async (ctx, { text, model = 'text-embedding-3-large' }) => {
    const response = await openai.embeddings.create({
      model,
      input: text,
    });
    return {
      embedding: response.data[0].embedding,
      dim: response.data[0].embedding.length,
    };
  },
});

// 3. Store chunks with embeddings
export const upsertKnowledgeChunks = internalMutation({
  handler: async (ctx, { thingId, chunks, embeddings }) => {
    // Delete old chunks
    const oldChunks = await ctx.db
      .query('knowledge')
      .withIndex('by_source')
      .filter(q => q.eq(q.field('sourceThingId'), thingId))
      .collect();
    
    for (const old of oldChunks) {
      await ctx.db.delete(old._id);
    }
    
    // Insert new chunks
    for (let i = 0; i < chunks.length; i++) {
      const knowledgeId = await ctx.db.insert('knowledge', {
        knowledgeType: 'chunk',
        text: chunks[i].text,
        embedding: embeddings[i].embedding,
        embeddingModel: 'text-embedding-3-large',
        embeddingDim: embeddings[i].dim,
        sourceThingId: thingId,
        chunk: chunks[i],
        metadata: {
          contentHash: chunks[i].hash,
          embeddingVersion: 'v3',
        },
        createdAt: Date.now(),
      });
      
      // Link to thing
      await ctx.db.insert('thingKnowledge', {
        thingId,
        knowledgeId,
        role: 'chunk_of',
        createdAt: Date.now(),
      });
    }
  },
});
```

---

#### Cost Management

**Embedding Costs (OpenAI text-embedding-3-large):**
- $0.13 per 1M tokens
- Average blog post: ~1,000 tokens = $0.00013
- 1M blog posts embedded: ~$130

**Storage Costs:**
- 3,072 dimensions × 4 bytes = 12KB per chunk
- 1M chunks = 12GB of vector data
- Convex: ~$0.25/GB/month = $3/month per 1M chunks

**Optimization Strategies:**

1. **Selective Embedding:** Only embed content types with high search value
2. **Lazy Embedding:** Embed on first publish, not on draft save
3. **Batch Processing:** Embed 100 items at a time to avoid rate limits
4. **Content Hashing:** Skip re-embedding if content unchanged
5. **Smaller Models:** Use `text-embedding-3-small` (512 dims) for less critical content (75% cost savings)

---

#### Query & Retrieval

```typescript
export const semanticSearch = query({
  args: { query: v.string(), groupId: v.id('groups'), limit: v.number() },
  handler: async (ctx, { query, groupId, limit = 10 }) => {
    // 1. Embed query
    const queryEmbedding = await ctx.runAction(internal.knowledge.embedText, {
      text: query,
    });
    
    // 2. Vector search (filtered by group)
    const results = await ctx.db
      .vectorSearch('knowledge', 'by_embedding', {
        vector: queryEmbedding.embedding,
        limit: limit * 2,  // Over-fetch for filtering
        filter: q => q.eq(q.field('knowledgeType'), 'chunk'),
      })
      .collect();
    
    // 3. Filter by group (get source things)
    const groupResults = [];
    for (const result of results) {
      const sourceThing = await ctx.db.get(result.sourceThingId);
      if (sourceThing?.groupId === groupId) {
        groupResults.push({
          ...result,
          score: result._score,
          thing: sourceThing,
        });
      }
      if (groupResults.length >= limit) break;
    }
    
    return groupResults;
  },
});
```

---

#### Governance & Lifecycle

**Versioning:**
- Store `metadata.contentHash` of source content
- If hash unchanged, skip re-embedding
- Track `metadata.embeddingVersion` for model migrations

**Retention:**
- Archive old chunks on major content edits (keep last 3 versions)
- Garbage collect orphaned knowledge items (no thingKnowledge links)
- Delete embeddings when source thing is hard-deleted

**Quality:**
- Track `metadata.qualityScore` based on user feedback
- Monitor search relevance metrics
- A/B test embedding models

**Summary:** Be ruthlessly selective about what gets embedded. RAG is powerful but expensive. Embed content users will semantically search, not structured data they'll filter.


### Knowledge Governance

Policy: Default is free-form, user-extensible knowledge labels for maximum flexibility and zero schema churn.

- Curated label prefixes (recommended): `skill:*`, `industry:*`, `topic:*`, `format:*`, `goal:*`, `audience:*`, `technology:*`, `status:*`, `capability:*`, `protocol:*`, `payment_method:*`, `network:*`.
- Validation: Enforce label hygiene (no duplicates within scope); allow synonyms via an alias list if needed.
- Ownership: Platform/group owners may curate official labels; users can still apply ad‑hoc labels.
- Hygiene: Periodically consolidate low-usage duplicates; do not delete knowledge items with active references—mark deprecated instead.

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
  groupId: Id<"groups">,           // REQUIRED: Multi-tenant isolation
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

**Payment Properties (Consolidated):**

```typescript
{
  protocol: "x402" | "acp" | "ap2" | "stripe", // Protocol identifier
  amount: number,
  currency: "usd" | "eur",
  paymentMethod: "stripe" | "crypto",
  stripePaymentIntentId?: string,
  txHash?: string,                // Blockchain transaction
  status: "pending" | "completed" | "failed" | "refunded",
  fees: number,
  netAmount: number,
  processedAt?: number,
  // Protocol specifics
  scheme?: "permit",              // X402
  network?: "base",               // X402/Crypto
  invoiceId?: string              // ACP
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

**Mandate Properties (AP2/Shopping):**

```typescript
{
  mandateType: "intent" | "cart",
  protocol: "ap2",
  intent?: {                    // For intent mandates
    targetProduct?: string,
    maxBudget?: number,
    constraints?: any
  },
  items?: {                     // For cart mandates
    productId: string,
    quantity: number,
    price: number
  }[],
  subtotal?: number,
  tax?: number,
  total?: number,
  status: "active" | "completed" | "abandoned",
  signature?: string,           // Cryptographic signature
  credentialHash?: string,      // Verifiable credential
  approvedAt?: number,
  completedAt?: number
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
    // Protocol specifics
    protocol?: string,
    // etc...
  },
  strength?: number,        // Relationship strength (0-1)
  validFrom?: number,       // When relationship started
  validTo?: number,         // When relationship ended
  createdAt: number,
  updatedAt?: number,
  deletedAt?: number        // OPTIONAL: Soft delete timestamp
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

**Pattern: Protocol Communication (Consolidated)**

```typescript
// Agents communicate (A2A)
{
  fromThingId: oneAgentId,
  toThingId: externalAgentId,
  relationshipType: "communicated",
  metadata: {
    protocol: "a2a",
    platform: "elizaos",
    messagesExchanged: 42
  },
  createdAt: Date.now()
}
```

**Pattern: Task Delegation (Consolidated)**

```typescript
// Agent delegates task
{
  fromThingId: mainAgentId,
  toThingId: workerAgentId,
  relationshipType: "delegated",
  metadata: {
    protocol: "a2a",
    taskType: "research",
    status: "pending"
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

  // CYCLE EVENTS (7) - NEW
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
  groupId: Id<"groups">,         // REQUIRED: Multi-tenant isolation & efficient filtering
  timestamp: number,             // When it happened
  metadata: any                  // Event-specific data
}
```

### Metadata Structure

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
  type: "payment_event",
  actorId: userId,
  targetId: paymentId,
  timestamp: Date.now(),
  metadata: {
    status: "processed",        // or "requested" | "verified" | "failed"
    amount: 99.00,
    currency: "USD",
    paymentId: "pi_123456",
    method: "stripe"
  }
}

// Subscription renewed (use "subscription_event" with metadata.action)
{
  type: "subscription_event",
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
// Content created (use "content_event" with metadata.action)
{
  type: "content_event",
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

// Content viewed (use "content_event" with metadata.action)
{
  type: "content_event",
  actorId: userId,
  targetId: contentId,
  timestamp: Date.now(),
  metadata: {
    action: "viewed",           // or "shared" | "liked"
    duration: 120,              // seconds
    source: "feed"
  }
}
```

**Pattern: Livestream Event (Consolidated)**

```typescript
// Livestream started (use "livestream_event" with metadata.status)
{
  type: "livestream_event",
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

// Viewer joined (use "livestream_event" with metadata.action)
{
  type: "livestream_event",
  actorId: viewerId,
  targetId: livestreamId,
  timestamp: Date.now(),
  metadata: {
    action: "joined",           // or "left" | "chat" | "donation"
    viewerCount: 42,
    message: "Hello!"           // if action === "chat"
  }
}
```

**Pattern: Notification Event (Consolidated)**

```typescript
// Email notification sent (use "notification_event" with metadata.channel)
{
  type: "notification_event",
  actorId: systemId,
  targetId: userId,
  timestamp: Date.now(),
  metadata: {
    channel: "email",           // or "sms" | "push" | "in_app"
    messageId: "msg_123",
    subject: "New content available",
    deliveryStatus: "sent",
    readAt: Date.now() + 1000   // optional
  }
}
```

**Pattern: Protocol Events (Consolidated)**

```typescript
// A2A Task Delegation
{
  type: "task_event",
  actorId: oneAgentId,
  targetId: externalAgentId,
  timestamp: Date.now(),
  metadata: {
    protocol: "a2a",
    action: "delegated",
    task: "research_market_trends"
  }
}

// ACP Purchase
{
  type: "commerce_event",
  actorId: agentId,
  targetId: transactionId,
  timestamp: Date.now(),
  metadata: {
    protocol: "acp",
    eventType: "purchase_initiated",
    agentPlatform: "chatgpt",
    amount: 99.00
  }
}

// AP2 Mandate
{
  type: "mandate_event",
  actorId: userId,
  targetId: mandateId,
  timestamp: Date.now(),
  metadata: {
    protocol: "ap2",
    mandateType: "intent",
    autoExecute: true
  }
}

// X402 Payment
{
  type: "payment_event",
  actorId: apiServiceId,
  targetId: resourceId,
  timestamp: Date.now(),
  metadata: {
    protocol: "x402",
    status: "requested",
    scheme: "permit",
    network: "base",
    amount: "0.01"
  }
}
```

---

## The Philosophy: Reality as DSL

**This isn't a database schema. It's a Domain-Specific Language for reality itself.**

### The Core Insight

**Most systems model their application. ONE models reality.**

This ontology proves that you don't need hundreds of tables or complex schemas to build a complete AI-native platform. You need:

1. **6 dimensions** (groups, people, things, connections, events, knowledge)
2. **66 thing types** (every "thing")
3. **25 connection types** (every relationship)
4. **52 event types** (every action)
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
            updatedAt: Date.now(),
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

## Implementation Requirements

**Critical:** The ontology provides flexibility. These requirements provide guardrails.

While the 6-dimension ontology models reality and never changes, **implementation details** matter for correctness, performance, and scale. This section defines mandatory validation, retention, and operational patterns.

---

### 1. Type Safety & Runtime Validation

**Problem:** `properties` is a JSON blob. The database won't enforce that a `product` has a `price`.

**Solution:** Mandatory runtime validation using Zod/Valibot schemas.

```typescript
// Define schemas for each ThingType
const ProductPropertiesSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  inventory: z.number().int().nonnegative(),
  sku: z.string().optional(),
});

// Validate on create/update
export const createProduct = mutation({
  handler: async (ctx, args) => {
    // Parse and validate
    const properties = ProductPropertiesSchema.parse(args.properties);
    
    await ctx.db.insert('things', {
      type: 'product',
      name: properties.title,
      properties,
      status: 'draft',
      createdAt: Date.now(),
    });
  },
});
```

**Metadata Protocol Validation:**

```typescript
const ProtocolMetadataSchema = z.discriminatedUnion('protocol', [
  z.object({ protocol: z.literal('x402'), network: z.string(), txHash: z.string() }),
  z.object({ protocol: z.literal('a2a'), platform: z.string(), messageType: z.string() }),
  z.object({ protocol: z.literal('acp'), agentPlatform: z.string(), eventType: z.string() }),
  z.object({ protocol: z.literal('ap2'), mandateType: z.enum(['intent', 'cart']) }),
]);
```

**Rule:** Every `properties` field and protocol `metadata` MUST be validated at the application boundary.

---

### 1b. Protocol Registry Pattern (Scalable Protocol Validation)

**Problem:** Hardcoded protocol validation doesn't scale to 50+ protocols. Each new protocol requires code changes.

**Solution:** Store protocol definitions in database, validate dynamically. Protocols are data, not code.

**Protocol Definition Table:**

```typescript
defineTable('protocol_definitions')
  .index('by_name', ['name'])
  .index('by_category', ['category', 'status']);

{
  _id: Id<'protocol_definitions'>,
  name: string,              // e.g., 'x402', 'solana_pay', 'a2a'
  version: string,           // e.g., '1.0', '2.1'
  category: 'payment' | 'messaging' | 'commerce' | 'identity' | 'storage',
  schema: {
    required: string[],      // Required metadata fields
    optional: string[],      // Optional metadata fields
    types: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
  },
  examples: any[],           // Valid metadata examples
  documentation?: string,    // Link to protocol spec
  status: 'active' | 'deprecated' | 'experimental',
  createdAt: number,
  updatedAt: number,
}
```

**Example Protocol Definitions:**

```typescript
// X402 (HTTP 402 Payment)
{
  name: 'x402',
  version: '1.0',
  category: 'payment',
  schema: {
    required: ['network', 'txHash'],
    optional: ['amount', 'token', 'scheme'],
    types: {
      network: 'string',
      txHash: 'string',
      amount: 'number',
      token: 'string',
      scheme: 'string'
    }
  },
  examples: [
    { network: 'base', txHash: '0x123...', amount: 0.01, scheme: 'permit' }
  ],
  documentation: 'https://x402.org/spec',
  status: 'active'
}

// Solana Pay (NEW - added without code changes)
{
  name: 'solana_pay',
  version: '1.0',
  category: 'payment',
  schema: {
    required: ['signature', 'slot'],
    optional: ['memo', 'reference'],
    types: {
      signature: 'string',
      slot: 'number',
      memo: 'string',
      reference: 'string'
    }
  },
  examples: [
    { signature: '5J7kMQ...', slot: 123456789, memo: 'Coffee payment' }
  ],
  documentation: 'https://docs.solanapay.com',
  status: 'active'
}

// A2A (Agent-to-Agent)
{
  name: 'a2a',
  version: '1.0',
  category: 'messaging',
  schema: {
    required: ['platform', 'messageType'],
    optional: ['taskId', 'priority'],
    types: {
      platform: 'string',
      messageType: 'string',
      taskId: 'string',
      priority: 'number'
    }
  },
  examples: [
    { platform: 'elizaos', messageType: 'task_delegation', taskId: 'task_123' }
  ],
  status: 'active'
}
```

**Generic Validator:**

```typescript
export async function validateProtocolMetadata(
  ctx: QueryCtx,
  metadata: any
): Promise<{ valid: boolean; errors?: string[]; warnings?: string[] }> {
  if (!metadata.protocol) {
    return { valid: false, errors: ['Missing protocol field'] };
  }

  // Fetch protocol definition
  const protocolDef = await ctx.db
    .query('protocol_definitions')
    .withIndex('by_name')
    .filter(q => q.eq(q.field('name'), metadata.protocol))
    .first();

  if (!protocolDef) {
    // Unknown protocol = warning, not error (forward compatibility)
    return { 
      valid: true, 
      warnings: [`Unknown protocol: ${metadata.protocol}. Validation skipped.`] 
    };
  }

  if (protocolDef.status === 'deprecated') {
    return {
      valid: true,
      warnings: [`Protocol ${metadata.protocol} is deprecated. Consider upgrading.`]
    };
  }

  // Validate required fields
  const errors: string[] = [];
  for (const field of protocolDef.schema.required) {
    if (!(field in metadata)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate types
  for (const [field, expectedType] of Object.entries(protocolDef.schema.types)) {
    if (field in metadata) {
      const actualType = typeof metadata[field];
      if (actualType !== expectedType) {
        errors.push(`Field ${field} should be ${expectedType}, got ${actualType}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Usage in Mutations:**

```typescript
export const createProtocolConnection = mutation({
  handler: async (ctx, { fromThingId, toThingId, relationshipType, metadata }) => {
    // Validate protocol metadata
    const validation = await validateProtocolMetadata(ctx, metadata);
    
    if (!validation.valid) {
      throw new Error(`Invalid protocol metadata: ${validation.errors!.join(', ')}`);
    }
    
    if (validation.warnings) {
      console.warn(validation.warnings.join(', '));
    }

    await ctx.db.insert('connections', {
      fromThingId,
      toThingId,
      relationshipType,
      metadata,
      createdAt: Date.now(),
    });
  },
});
```

**Adding New Protocols (Zero Code Changes):**

```typescript
// Platform owner adds new blockchain/protocol via admin UI
export const registerProtocol = mutation({
  handler: async (ctx, args) => {
    // Only platform owners can register protocols
    if (ctx.auth.role !== 'platform_owner') {
      throw new Error('Unauthorized');
    }

    await ctx.db.insert('protocol_definitions', {
      name: args.name,
      version: args.version,
      category: args.category,
      schema: args.schema,
      examples: args.examples,
      documentation: args.documentation,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Now the protocol works immediately
await createProtocolConnection(ctx, {
  fromThingId: userId,
  toThingId: merchantId,
  relationshipType: 'transacted',
  metadata: {
    protocol: 'solana_pay',  // NEW PROTOCOL
    signature: '5J7kMQ...',
    slot: 123456789
  }
});
```

**Advanced: Protocol Inheritance (Optional):**

```typescript
// Base protocol for all blockchain payments
{
  name: 'blockchain_payment_base',
  category: 'payment',
  schema: {
    required: ['txHash', 'network'],
    types: { txHash: 'string', network: 'string' }
  }
}

// Specific protocols extend the base
{
  name: 'ethereum_payment',
  extends: 'blockchain_payment_base',  // Inherits base schema
  schema: {
    required: ['gasUsed'],  // Additional required fields
    types: { gasUsed: 'number' }
  }
}
```

**Benefits:**

1. **Zero Code Deploys:** Add protocols via database insert, not code deployment
2. **Self-Documenting:** Schema + examples live with the protocol
3. **Versioning:** Track protocol versions over time
4. **Forward Compatible:** Unknown protocols don't break (just warn)
5. **AI-Friendly:** AI can read protocol definitions and generate correct metadata
6. **Governance:** Platform owner approves new protocols before activation
7. **Infinite Scalability:** Support 1,000+ protocols without code bloat

**Rule:** Protocols are data, not code. The ontology stays simple, protocols are infinitely extensible.

---

### 1c. Protocol Superpowers: The Universal Protocol Layer

The Protocol Registry Pattern unlocks 10 superpowers that make ONE Platform the universal protocol adapter for the internet.

#### Superpower 1: Universal Protocol Adapter

**The Magic:** Same interface, infinite protocols.

```typescript
// Application code doesn't care which protocol
function processPayment(connection: Connection) {
  const { protocol, ...details } = connection.metadata;
  const handler = getProtocolHandler(protocol);
  return handler.process(details);
}

// Works for ALL payment protocols
metadata: { protocol: 'stripe' | 'solana_pay' | 'lightning' | 'paypal' | ... }
```

**Impact:** Your app accepts payments from **every blockchain and payment system** without changing application logic.

---

#### Superpower 2: Protocol Composability

**Cross-protocol workflows are trivial.**

```typescript
// Scenario: Pay with Solana → Mint NFT on Ethereum → Email receipt

// Step 1: Solana payment
{ relationshipType: 'transacted', metadata: { protocol: 'solana_pay', signature: '5J7...' } }

// Step 2: NFT minted (different blockchain!)
{ relationshipType: 'owns', metadata: { protocol: 'ethereum', tokenId: '42' } }

// Step 3: Email receipt
{ relationshipType: 'notified', metadata: { protocol: 'smtp', messageId: 'msg_123' } }
```

**Impact:** Pay with Bitcoin, mint on Polygon, notify via Discord—all in one seamless flow.

---

#### Superpower 3: Protocol Time Travel (Versioning)

**Support multiple protocol versions simultaneously.**

```typescript
// 2024: X402 v1.0
{ protocol: 'x402', version: '1.0', schema: { required: ['network', 'txHash'] } }

// 2025: X402 v2.0 adds new fields
{ protocol: 'x402', version: '2.0', schema: { required: ['network', 'txHash', 'proofOfPayment'] } }

// Old connections still work (v1.0)
// New connections use v2.0
```

**Impact:** Protocol upgrades don't break existing data. Backward compatibility is automatic.

---

#### Superpower 4: AI Protocol Discovery

**AI agents learn new protocols on-the-fly.**

```typescript
// AI workflow:
// 1. User: "Pay this invoice with Solana"
// 2. AI queries protocol registry
const protocols = await ctx.db.query('protocol_definitions')
  .withIndex('by_category')
  .filter(q => q.eq(q.field('category'), 'payment'))
  .collect();

// 3. AI finds: solana_pay
// 4. AI reads schema: { required: ['signature', 'slot'] }
// 5. AI generates correct metadata automatically
```

**Impact:** AI agents **discover and use new protocols** without human intervention or code updates.

---

#### Superpower 5: Protocol Marketplace

**Community-driven protocol library with network effects.**

```typescript
// Developer publishes integration
await registerProtocol({
  name: 'stripe_connect',
  publisher: 'stripe_official',
  documentation: 'https://stripe.com/docs/connect',
  pricing: { free: true }
});

// Other users instantly use it (no code deployment)
```

**Impact:** Platform becomes more valuable with every protocol added. Developers publish integrations like npm packages.

---

#### Superpower 6: Cross-Protocol Analytics

**Universal analytics across all protocols.**

```typescript
// Query: "Which payment protocol has highest success rate?"
const stats = await ctx.db.query('connections')
  .filter(q => q.eq(q.field('relationshipType'), 'transacted'))
  .collect();

// Group by protocol
const byProtocol = stats.reduce((acc, conn) => {
  acc[conn.metadata.protocol] = (acc[conn.metadata.protocol] || 0) + 1;
  return acc;
}, {});

// Result: { stripe: 1200, solana_pay: 340, x402: 89 }
```

**Impact:** Compare Stripe vs. Solana vs. Lightning Network performance in one query.

---

#### Superpower 7: Protocol Fallback Chains

**Automatic fallback when protocols fail.**

```typescript
// User preference: Try Solana first, fallback to Stripe
const paymentProtocols = [
  { protocol: 'solana_pay', priority: 1 },
  { protocol: 'stripe', priority: 2 },
  { protocol: 'paypal', priority: 3 }
];

async function processPaymentWithFallback(amount: number) {
  for (const { protocol } of paymentProtocols) {
    try {
      return await processPayment(protocol, amount);
    } catch (error) {
      console.log(`${protocol} failed, trying next...`);
    }
  }
}
```

**Impact:** **Resilience.** If Solana network is congested, automatically fall back to Ethereum or credit card.

---

#### Superpower 8: Protocol Interoperability (Rosetta Stone)

**Translate between protocols.**

```typescript
// Example: Stripe → Solana Pay translation
async function translateProtocol(connection: Connection, targetProtocol: string) {
  const translator = await getTranslator(connection.metadata.protocol, targetProtocol);
  
  // Stripe: { chargeId, amount, currency }
  // Solana: { signature, slot, amount }
  
  return translator.translate(connection.metadata);
}
```

**Impact:** **Protocol bridges.** Convert Stripe payment to Solana transaction, or vice versa.

---

#### Superpower 9: Protocol Compliance & Auditing

**Track regulatory requirements per protocol.**

```typescript
{
  name: 'stripe',
  compliance: {
    pci_dss: true,
    gdpr: true,
    kyc: true,
    regions: ['US', 'EU', 'UK']
  }
}

// Query: "Show GDPR-compliant payment protocols for EU users"
const compliant = await ctx.db.query('protocol_definitions')
  .filter(q => q.eq(q.field('compliance.gdpr'), true))
  .collect();
```

**Impact:** **Automatic compliance.** Filter protocols by regulatory requirements per region.

---

#### Superpower 10: Protocol-Agnostic Applications

**Complete decoupling from specific protocols.**

```
Traditional App:
├─ Stripe integration (hardcoded)
├─ PayPal integration (hardcoded)
├─ Solana integration (hardcoded)
└─ Each requires separate code, testing, maintenance

ONE App:
├─ Universal payment interface
└─ Protocol registry handles everything
    ├─ Stripe ✅
    ├─ PayPal ✅
    ├─ Solana ✅
    ├─ Lightning ✅
    ├─ ... infinite protocols
```

**Adding new protocols:**
- Add Bitcoin support? **Database insert.**
- Add Polygon support? **Database insert.**
- Add Apple Pay support? **Database insert.**
- Add future blockchain (2030)? **Database insert.**

**No code changes. Ever.**

---

### The Economic Moat: Unstoppable Network Effects

```
More protocols → More users (support their preferred payment/blockchain)
     ↓
More users → More developers (build on the platform)
     ↓
More developers → More protocols (publish integrations)
     ↓
More protocols → More users (cycle repeats)
```

**Why competitors can't catch up:**
- They hardcode protocols (slow, brittle)
- You have a protocol marketplace (fast, extensible)
- Every new protocol makes your platform MORE valuable
- Their platform gets MORE complex with each protocol
- Your platform stays SIMPLE (ontology never changes)

---

### The Vision: ONE Platform as "Stripe for Everything"

**Stripe's superpower:** One API for all payment methods  
**ONE's superpower:** One ontology for all protocols

**In 5 years:**
- 1,000+ protocols in the registry
- Developers publish protocol integrations like npm packages
- AI agents automatically discover and use new protocols
- Applications are truly protocol-agnostic
- The ontology becomes the **universal standard**

**This is the superpower.** Not just supporting protocols—**becoming the protocol layer for the entire internet.**

---

### 2. Event Retention Policies

**Problem:** Storing all events forever causes storage explosion and query degradation.

**Solution:** Define retention by event type (comprehensive policy for all 52 types).

| Event Type | Retention | Reason |
|------------|-----------|--------|
| **Lifecycle (Forever - System Integrity)** |||
| `thing_created`, `thing_updated`, `thing_deleted` | Forever | System integrity & audit |
| **User Events (Forever - Legal/Compliance)** |||
| `user_registered`, `user_verified` | Forever | Legal/audit requirements |
| **Financial (7 Years - Compliance)** |||
| `payment_event`, `subscription_event` | 7 years | Financial compliance (GAAP) |
| **Blockchain (Forever - Immutability)** |||
| `tokens_purchased`, `tokens_transferred`, `tokens_staked`, `tokens_unstaked` | Forever | Blockchain audit trail |
| `token_minted`, `token_burned`, `tokens_bridged` | Forever | On-chain state tracking |
| `nft_minted`, `nft_transferred`, `contract_deployed` | Forever | NFT provenance |
| **Educational Records (Forever - Accreditation)** |||
| `course_enrolled`, `lesson_completed`, `course_completed`, `certificate_earned` | Forever | Academic transcripts |
| **Cycle/Revenue (Forever - Financial)** |||
| `cycle_revenue_collected`, `org_revenue_generated`, `revenue_share_distributed`, `treasury_withdrawal` | Forever | Platform revenue tracking |
| **Authentication (1 Year - Security Audit)** |||
| `password_reset_requested`, `password_reset_completed` | 1 year | Security audit trail |
| `email_verification_sent`, `email_verified` | 1 year | Verification history |
| `two_factor_enabled`, `two_factor_disabled` | 1 year | Security changes |
| **Group Events (1 Year - Organizational History)** |||
| `user_invited_to_group`, `user_joined_group`, `user_removed_from_group` | 1 year | Membership history |
| **Engagement (1 Year - Analytics)** |||
| `content_event` (created/updated/deleted/shared/liked) | 1 year | Content lifecycle |
| `content_event` (viewed) | 1 year | Engagement analytics |
| `livestream_event` | 1 year | Stream analytics |
| `commerce_event` | 1 year | Commerce patterns |
| `mandate_event` | 1 year | Purchase intents |
| **Agent/Task (180 Days - Operational)** |||
| `agent_executed`, `agent_completed`, `agent_failed` | 180 days | Agent performance |
| `task_event` | 180 days | Task delegation history |
| `communication_event` | 180 days | Agent-to-agent comms |
| **Analytics (90 Days - Reporting)** |||
| `metric_calculated`, `insight_generated`, `prediction_made` | 90 days | Analytics snapshots |
| `optimization_applied`, `report_generated` | 90 days | Report history |
| `cycle_request`, `cycle_completed`, `cycle_failed`, `cycle_quota_exceeded` | 90 days | Cycle tracking |
| **UI/UX (90 Days - Low-Value)** |||
| `dashboard_viewed`, `settings_updated`, `theme_changed`, `preferences_updated` | 90 days | UI analytics |
| `profile_updated` | 90 days | Profile change history |
| **Session (30 Days - Operational)** |||
| `user_login`, `user_logout` | 30 days | Session tracking |
| `notification_event` | 30 days | Delivery tracking only |
| `referral_event` | 30 days | Referral tracking |
| **Clone Creation (Forever - Asset Tracking)** |||
| `voice_cloned`, `appearance_cloned` | Forever | AI asset creation |
| **Price Monitoring (90 Days - Market Data)** |||
| `price_event` | 90 days | Price change history |

**Implementation:**

```typescript
// Daily cleanup cron
export const cleanupOldEvents = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    
    const retentionPolicies = {
      // 90 days
      dashboard_viewed: 90 * DAY_MS,
      theme_changed: 90 * DAY_MS,
      preferences_updated: 90 * DAY_MS,
      settings_updated: 90 * DAY_MS,
      profile_updated: 90 * DAY_MS,
      metric_calculated: 90 * DAY_MS,
      insight_generated: 90 * DAY_MS,
      prediction_made: 90 * DAY_MS,
      optimization_applied: 90 * DAY_MS,
      report_generated: 90 * DAY_MS,
      cycle_request: 90 * DAY_MS,
      cycle_completed: 90 * DAY_MS,
      cycle_failed: 90 * DAY_MS,
      cycle_quota_exceeded: 90 * DAY_MS,
      price_event: 90 * DAY_MS,
      
      // 30 days
      user_login: 30 * DAY_MS,
      user_logout: 30 * DAY_MS,
      notification_event: 30 * DAY_MS,
      referral_event: 30 * DAY_MS,
      
      // 180 days
      agent_executed: 180 * DAY_MS,
      agent_completed: 180 * DAY_MS,
      agent_failed: 180 * DAY_MS,
      task_event: 180 * DAY_MS,
      communication_event: 180 * DAY_MS,
      
      // 1 year
      password_reset_requested: 365 * DAY_MS,
      password_reset_completed: 365 * DAY_MS,
      email_verification_sent: 365 * DAY_MS,
      email_verified: 365 * DAY_MS,
      two_factor_enabled: 365 * DAY_MS,
      two_factor_disabled: 365 * DAY_MS,
      user_invited_to_group: 365 * DAY_MS,
      user_joined_group: 365 * DAY_MS,
      user_removed_from_group: 365 * DAY_MS,
      content_event: 365 * DAY_MS,
      livestream_event: 365 * DAY_MS,
      commerce_event: 365 * DAY_MS,
      mandate_event: 365 * DAY_MS,
    };

    for (const [eventType, retention] of Object.entries(retentionPolicies)) {
      const cutoff = now - retention;
      const oldEvents = await ctx.db
        .query('events')
        .withIndex('by_type_time')  // FIXED: Correct index name
        .filter(q => q.eq(q.field('type'), eventType))
        .filter(q => q.lt(q.field('timestamp'), cutoff))
        .collect();

      for (const event of oldEvents) {
        await ctx.db.delete(event._id);
      }
    }
  },
});
```

**Rule:** All low-value events MUST be deleted after their retention period. Archive to cold storage if needed for compliance.

---

### 3. Knowledge Embedding Versioning

**Problem:** Upgrading from `text-embedding-3-large` to `text-embedding-4` makes old embeddings incompatible.

**Solution:** Keep core schema simple (single embedding). Use metadata for version tracking and separate table for multi-version storage.

**Core Knowledge Schema (unchanged):**

```typescript
{
  _id: Id<'knowledge'>,
  knowledgeType: 'chunk',
  text: string,
  embedding?: number[],          // Current active embedding
  embeddingModel?: string,      // e.g., "text-embedding-3-large"
  embeddingDim?: number,
  sourceThingId: Id<'things'>,
  metadata: {
    embeddingVersion: 'v3',     // Track version for migration
    needsReEmbedding?: boolean,  // Flag for background jobs
  },
  createdAt: number,
}
```

**Optional: Multi-Version Storage (separate table for migration period):**

```typescript
// Only used during embedding model migrations
defineTable('embedding_versions')
  .index('by_knowledge', ['knowledgeId', 'modelVersion'])

{
  _id: Id<'embedding_versions'>,
  knowledgeId: Id<'knowledge'>,
  modelVersion: 'v3' | 'v4',
  model: string,  // e.g., "text-embedding-3-large"
  vector: number[],
  dim: number,
  createdAt: number,
}
```

**Migration Strategy:**

1. **Phase 1:** Create `embedding_versions` table, dual-write new embeddings
2. **Phase 2:** Background job populates `embedding_versions` for existing knowledge
3. **Phase 3:** Switch `knowledge.embedding` to point to new version
4. **Phase 4:** Drop `embedding_versions` table after 30-day validation period
5. **Phase 5:** Update `metadata.embeddingVersion` to 'v4'

**Rule:** Core schema stays simple. Multi-version complexity is temporary and isolated to migration table.

---

### 4. Group Hierarchy Validation

**Problem:** Circular references (Group A → parent: Group B → parent: Group A) cause infinite loops.

**Solution:** Validation on insert/update + max depth limit.

```typescript
export const createGroup = mutation({
  handler: async (ctx, { parentGroupId, ...rest }) => {
    // Rule 1: Prevent circular references and max depth
    if (parentGroupId) {
      const ancestors = await getAncestors(ctx, parentGroupId);  // Single call
      
      // Check max depth
      if (ancestors.length >= 5) {
        throw new Error('Maximum group nesting depth (5 levels) exceeded');
      }
      
      // Check for circular reference (defensive - shouldn't happen if depth check works)
      const ancestorIds = new Set(ancestors.map(g => g._id));
      if (ancestorIds.has(parentGroupId)) {
        throw new Error('Circular reference detected');
      }
    }

    // Create group
    const groupId = await ctx.db.insert('groups', {
      parentGroupId,
      ...rest,
      createdAt: Date.now(),
    });

    return groupId;
  },
});

async function getAncestors(ctx, groupId: Id<'groups'>) {
  const ancestors = [];
  let current = await ctx.db.get(groupId);
  
  while (current?.parentGroupId && ancestors.length < 10) {
    const parent = await ctx.db.get(current.parentGroupId);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }
  
  return ancestors;
}
```

**Rules:**
- Max depth: 5 levels
- Circular reference check on every insert/update
- Timeout protection: stop traversal after 10 iterations

---

### 5. Indexing Strategy

**Problem:** Multi-tenant queries without proper indexes scan entire tables.

**Required Indexes (Convex):**

```typescript
// groups
defineTable('groups')
  .index('by_slug', ['slug'])
  .index('by_parent', ['parentGroupId'])
  .index('by_status', ['status', 'createdAt']);

// things
defineTable('things')
  .index('by_type', ['type', 'createdAt'])
  .index('by_status', ['status', 'updatedAt'])
  .index('by_type_status', ['type', 'status', 'createdAt']);

// connections
defineTable('connections')
  .index('by_from', ['fromThingId', 'relationshipType'])
  .index('by_to', ['toThingId', 'relationshipType'])
  .index('by_relationship', ['relationshipType', 'createdAt']);

// events
defineTable('events')
  .index('by_actor', ['actorId', 'timestamp'])
  .index('by_target', ['targetId', 'timestamp'])
  .index('by_type_time', ['type', 'timestamp'])
  .index('by_actor_type', ['actorId', 'type', 'timestamp']);

// knowledge
defineTable('knowledge')
  .index('by_type', ['knowledgeType', 'createdAt'])
  .index('by_source', ['sourceThingId', 'knowledgeType'])
  .vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: 3072,
    filterFields: ['knowledgeType', 'sourceThingId'],
  });
```

**Multi-Tenant Query Pattern:**

```typescript
// WRONG: Full table scan
const things = await ctx.db.query('things').filter(q => q.eq(q.field('type'), 'product')).collect();

// RIGHT: Use compound index
const things = await ctx.db.query('things').withIndex('by_type', q => q.eq('type', 'product')).collect();
```

**Rule:** Every query MUST use an index. Never do full table scans in production.

---

### 6. Soft Delete Cascade Rules

**Problem:** Soft-deleting a group leaves orphaned things/connections.

**Solution:** Explicit cascade rules.

```typescript
export const softDeleteGroup = mutation({
  handler: async (ctx, { groupId }) => {
    // 1. Soft delete the group
    await ctx.db.patch(groupId, {
      status: 'archived',
      deletedAt: Date.now(),
    });

    // 2. CASCADE: Soft delete all child groups
    const childGroups = await ctx.db
      .query('groups')
      .withIndex('by_parent')
      .filter(q => q.eq(q.field('parentGroupId'), groupId))
      .collect();

    for (const child of childGroups) {
      await softDeleteGroup(ctx, { groupId: child._id });
    }

    // 3. CASCADE: Soft delete all connections where group is involved
    const connections = await ctx.db
      .query('connections')
      .filter(q => 
        q.or(
          q.eq(q.field('fromThingId'), groupId),
          q.eq(q.field('toThingId'), groupId)
        )
      )
      .collect();

    for (const conn of connections) {
      await ctx.db.patch(conn._id, { deletedAt: Date.now() });
    }

    // 4. Log cascade event
    await ctx.db.insert('events', {
      type: 'thing_deleted',
      actorId: ctx.auth.userId!,
      targetId: groupId,
      timestamp: Date.now(),
      metadata: {
        thingType: 'group',
        deletionType: 'soft',
        cascadedChildren: childGroups.length,
        cascadedConnections: connections.length,
      },
    });
  },
});
```

**Cascade Matrix:**

| Deleted Entity | Cascades To | Type |
|----------------|-------------|------|
| Group | Child groups, Connections | Soft delete |
| Thing | Connections, Knowledge links | Soft delete |
| Connection | *(none)* | Direct delete |
| Event | *(never deleted)* | Retention policy only |
| Knowledge | thingKnowledge links | Soft delete |

**Rule:** Soft deletes MUST cascade to dependent entities. Log all cascade operations.

---

### 7. Connection Directionality & Performance

**Problem:** Bidirectional relationships (e.g., "following") require two queries.

**Solution:** Strategic denormalization for hot paths.

```typescript
// OPTION A: Pure ontology (2 queries)
const followers = await ctx.db.query('connections')
  .withIndex('by_to')
  .filter(q => q.eq(q.field('toThingId'), userId))
  .filter(q => q.eq(q.field('relationshipType'), 'following'))
  .collect();

const following = await ctx.db.query('connections')
  .withIndex('by_from')
  .filter(q => q.eq(q.field('fromThingId'), userId))
  .filter(q => q.field('relationshipType'), 'following'))
  .collect();

// OPTION B: Denormalized (1 query, but violates pure ontology)
interface UserThing {
  type: 'user',
  properties: {
    followerIds: Id<'things'>[],  // Cached for performance
    followingIds: Id<'things'>[],  // Cached for performance
    followerCount: number,
    followingCount: number,
  }
}
```

**When to denormalize:**
- Query frequency > 1000/minute
- Bidirectional relationship is core feature (social graph)
- Acceptable staleness (eventual consistency)

**Rule:** Start with pure ontology. Denormalize only when performance metrics justify it.

---

### 8. Multi-Target Event Pattern

**Problem:** Some events involve multiple entities (e.g., "User A transferred Token B to User C").

**Solution:** Use standardized metadata pattern.

```typescript
{
  type: 'tokens_transferred',
  actorId: userA,          // Who initiated
  targetId: tokenId,       // Primary entity
  timestamp: Date.now(),
  metadata: {
    fromUserId: userA,     // Secondary target 1
    toUserId: userC,       // Secondary target 2
    amount: 1000,
    txHash: '0x...',
  }
}
```

**Query Pattern:**

```typescript
// Find all events involving User C
const eventsAsActor = await ctx.db.query('events')
  .withIndex('by_actor')
  .filter(q => q.eq(q.field('actorId'), userC))
  .collect();

const eventsAsTarget = await ctx.db.query('events')
  .withIndex('by_target')
  .filter(q => q.eq(q.field('targetId'), userC))
  .collect();

// ALSO search metadata (requires full scan unless indexed)
const eventsAsSecondary = await ctx.db.query('events')
  .filter(q => 
    q.or(
      q.eq(q.field('metadata.fromUserId'), userC),
      q.eq(q.field('metadata.toUserId'), userC)
    )
  )
  .collect();
```

**Rule:** Primary target → `targetId`. Secondary targets → `metadata`. Accept that secondary target queries are slower.

---

### 9. Connection Strength Standards

**Problem:** Subjective `strength` values (0-1) have no meaning.

**Solution:** Define standard strength levels.

| Strength | Meaning | Use Case |
|----------|---------|----------|
| 1.0 | Owner/Creator | User owns product, Creator owns content |
| 0.9 | Admin/Manager | Group owner, Content moderator |
| 0.7 | Core Member | Paid subscriber, Active contributor |
| 0.5 | Member | Group member, Course enrollee |
| 0.3 | Follower | Social following, Newsletter subscriber |
| 0.1 | Viewer | Casual visitor, Free tier user |

**Implementation:**

```typescript
const StrengthLevel = {
  OWNER: 1.0,
  CO_OWNER: 0.95,     // Shared ownership (equal rights)
  ADMIN: 0.9,
  MODERATOR: 0.8,     // Content/community moderation
  CORE_MEMBER: 0.7,
  MEMBER: 0.5,
  TRIAL_MEMBER: 0.4,  // Trial period
  FOLLOWER: 0.3,
  TRIAL_USER: 0.2,    // Trial/freemium
  VIEWER: 0.1,
  SUSPENDED: 0.0,     // Suspended/banned (retain connection for audit)
} as const;

// Use enum instead of raw numbers
await ctx.db.insert('connections', {
  fromThingId: userId,
  toThingId: groupId,
  relationshipType: 'member_of',
  strength: StrengthLevel.MEMBER,
  createdAt: Date.now(),
});
```

**Rule:** Use defined strength levels. Never use arbitrary decimal values.

---

### 10. Knowledge Field Reference Validation

**Problem:** `sourceField: 'bio'` breaks silently if field is renamed.

**Solution:** Validate field existence on write.

```typescript
// Helper: Get nested property safely
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export const createKnowledgeChunk = mutation({
  handler: async (ctx, { sourceThingId, sourceField, text }) => {
    // Validate source thing exists
    const sourceThing = await ctx.db.get(sourceThingId);
    if (!sourceThing) {
      throw new Error('Source thing not found');
    }

    // Validate source field exists (supports nested paths like "contact.email")
    if (sourceField && getNestedProperty(sourceThing.properties, sourceField) === undefined) {
      throw new Error(`Field '${sourceField}' does not exist on thing type '${sourceThing.type}'`);
    }

    // Create knowledge
    await ctx.db.insert('knowledge', {
      knowledgeType: 'chunk',
      text,
      sourceThingId,
      sourceField,
      createdAt: Date.now(),
    });
  },
});
```

**Field Rename Migration:**

```typescript
// When renaming a field, update all knowledge references
export const renameThingField = internalMutation({
  handler: async (ctx, { thingType, oldField, newField }) => {
    // Update all knowledge items
    const knowledgeItems = await ctx.db
      .query('knowledge')
      .filter(q => q.eq(q.field('sourceField'), oldField))
      .collect();

    for (const item of knowledgeItems) {
      await ctx.db.patch(item._id, { sourceField: newField });
    }
  },
});
```

**Rule:** Validate field existence on knowledge creation. Provide migration path for field renames.

---

### Summary: Implementation Philosophy

**The ontology defines WHAT (the 6 dimensions).**
**These requirements define HOW (validation, retention, performance).**

| Aspect | Ontology | Implementation |
|--------|----------|----------------|
| Schema | Flexible JSON | Strict runtime validation (Zod) |
| Storage | Keep everything | Retention policies + cleanup |
| Relationships | Pure graph | Strategic denormalization |
| Integrity | Soft constraints | Hard validation rules |
| Performance | Unlimited scale | Indexing + query optimization |

**Key Principle:** The ontology models reality (never changes). Implementation adapts to reality constraints (validation, performance, cost).

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

**Event Types:** 52 total (Hybrid approach)

- 3 Thing lifecycle
- 5 User events
- 6 Authentication events
- 3 Group events
- 4 Dashboard & UI events
- 2 AI/Clone events
- 3 Agent events
- 6 Token events
- 4 Course events
- 5 Analytics events
- 7 Cycle events
- 5 Blockchain events
- 11 consolidated types with metadata variants

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





