---
title: Architecture Diagram
dimension: knowledge
category: architecture-diagram.md
tags: ai, architecture, frontend, ontology, system-design
related_dimensions: events
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the architecture-diagram.md category.
  Location: one/knowledge/architecture-diagram.md
  Purpose: Documents one platform architecture diagram
  Related dimensions: events
  For AI agents: Read this to understand architecture diagram.
---

# ONE Platform Architecture Diagram

**Version:** 3.0.0
**Last Updated:** 2025-11-03
**Purpose:** Visual representation of the 3-layer architecture implementing the 6-dimension ontology

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: WEB FRONTEND                           │
│                   (Astro 5 + React 19 Islands)                      │
├─────────────────────────────────────────────────────────────────────┤
│  • Astro Pages (SSR + Static)                                       │
│  • React Islands (client:load for interactivity)                    │
│  • shadcn/ui Components (50+ pre-installed)                         │
│  • Tailwind CSS v4 (CSS-based config)                               │
│  • Nanostores (island state management)                             │
│  • Better Auth Client (6 auth methods)                              │
│                                                                      │
│  Uses: Provider pattern to access backend (backend-agnostic)        │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   │ Real-time subscriptions + Mutations/Queries
                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  LAYER 2: CONVEX BACKEND                            │
│              (Real-time Database + Serverless Functions)            │
├─────────────────────────────────────────────────────────────────────┤
│  Convex Functions:                                                  │
│  ├─ Queries (read operations)                                       │
│  ├─ Mutations (write operations)                                    │
│  └─ Actions (external API calls)                                    │
│                                                                      │
│  Auth:                                                               │
│  └─ Better Auth + Convex Adapter                                    │
│                                                                      │
│  Services (optional - Effect.ts for complex logic):                 │
│  ├─ EntityService (CRUD + validation)                               │
│  ├─ ConnectionService (relationship management)                     │
│  ├─ EventService (audit logging)                                    │
│  └─ KnowledgeService (embeddings + RAG)                             │
│                                                                      │
│  Deployment: Convex Cloud (shocking-falcon-870.convex.cloud)        │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   │ CRUD operations on 6-dimension schema
                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│               LAYER 3: 6-DIMENSION ONTOLOGY                         │
│                  (Database Schema - 6 Tables)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. groups table                                                     │
│     ├─ Hierarchical containers (friend_circle → government)         │
│     ├─ Infinite nesting via parentGroupId                           │
│     └─ Scopes all other dimensions via groupId                      │
│                                                                      │
│  2. people table                                                     │
│     ├─ Authorization & governance (4 roles)                          │
│     ├─ Multi-org membership                                          │
│     └─ Every action has an actorId                                   │
│                                                                      │
│  3. things table                                                     │
│     ├─ 66+ entity types (user, product, course, agent...)           │
│     ├─ Flexible properties field (type-specific data)                │
│     └─ Scoped to groupId                                             │
│                                                                      │
│  4. connections table                                                │
│     ├─ 25+ relationship types (owns, purchased, enrolled_in...)     │
│     ├─ Bidirectional (fromId → toId)                                │
│     └─ Rich metadata + temporal validity                             │
│                                                                      │
│  5. events table                                                     │
│     ├─ 67+ event types (created, updated, purchased...)             │
│     ├─ Complete audit trail (actorId required)                      │
│     └─ Immutable append-only log                                     │
│                                                                      │
│  6. knowledge table                                                  │
│     ├─ Vector embeddings (text-embedding-3-large)                   │
│     ├─ Labels & categorization                                       │
│     └─ RAG + semantic search                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: User Purchases Course Example

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. USER INTERACTION (Frontend - Astro + React)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User clicks "Buy Course" button in React component                 │
│                                                                      │
│  <Button onClick={() => buyCourse(courseId)}>                       │
│    Buy Course                                                        │
│  </Button>                                                           │
│                                                                      │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   │ useMutation(api.purchases.create, { ... })
                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│  2. BACKEND LOGIC (Convex Mutation)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  export const create = mutation({                                   │
│    args: { courseId: v.id("things"), userId: v.id("people") },     │
│    handler: async (ctx, args) => {                                  │
│                                                                      │
│      // Step 1: Validate entities exist                             │
│      const course = await ctx.db.get(args.courseId);                │
│      const user = await ctx.db.get(args.userId);                    │
│                                                                      │
│      // Step 2: Create connection (relationship)                    │
│      const connectionId = await ctx.db.insert("connections", {      │
│        fromPersonId: user._id,                                       │
│        toThingId: course._id,                                        │
│        relationshipType: "purchased",                                │
│        groupId: course.groupId,                                      │
│        metadata: { amount: 99, method: "stripe" },                  │
│        createdAt: Date.now()                                         │
│      });                                                             │
│                                                                      │
│      // Step 3: Log event (audit trail)                             │
│      await ctx.db.insert("events", {                                │
│        type: "purchase_completed",                                   │
│        actorId: user._id,                                            │
│        targetId: connectionId,                                       │
│        groupId: course.groupId,                                      │
│        metadata: { amount: 99, courseId: course._id },              │
│        timestamp: Date.now()                                         │
│      });                                                             │
│                                                                      │
│      return { success: true, connectionId };                        │
│    }                                                                 │
│  });                                                                 │
│                                                                      │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   │ Insert records into 6-dimension tables
                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│  3. DATABASE UPDATES (6-Dimension Ontology)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  groups table:                                                       │
│    (no changes - course already scoped to group)                    │
│                                                                      │
│  people table:                                                       │
│    { _id: "user123", email: "john@example.com", role: "customer" }  │
│                                                                      │
│  things table:                                                       │
│    { _id: "course456", type: "course", name: "Fitness 101" }        │
│                                                                      │
│  connections table: ← NEW RECORD                                     │
│    {                                                                 │
│      _id: "conn789",                                                 │
│      fromPersonId: "user123",                                        │
│      toThingId: "course456",                                         │
│      relationshipType: "purchased",                                  │
│      groupId: "group001",                                            │
│      metadata: { amount: 99, method: "stripe" }                     │
│    }                                                                 │
│                                                                      │
│  events table: ← NEW RECORD                                          │
│    {                                                                 │
│      _id: "event999",                                                │
│      type: "purchase_completed",                                     │
│      actorId: "user123",                                             │
│      targetId: "conn789",                                            │
│      groupId: "group001",                                            │
│      metadata: { amount: 99, courseId: "course456" },               │
│      timestamp: 1699123456789                                        │
│    }                                                                 │
│                                                                      │
│  knowledge table:                                                    │
│    (updated by background job for recommendations)                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Hierarchical Groups: Multi-Tenancy

```
┌─────────────────────────────────────────────────────────────────────┐
│                   GROUPS HIERARCHY EXAMPLE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Root Group (parentGroupId: null)                                   │
│  ├─ Acme Corp (organization)                                        │
│  │  ├─ Engineering Dept (business)                                  │
│  │  │  ├─ Frontend Team (community)                                 │
│  │  │  └─ Backend Team (community)                                  │
│  │  └─ Sales Dept (business)                                        │
│  │     ├─ Sales Team A (community)                                  │
│  │     └─ Sales Team B (community)                                  │
│  └─ Personal Projects (friend_circle)                               │
│     └─ Side Hustle (business)                                       │
│                                                                      │
│  Data Isolation:                                                     │
│  • All things scoped to groupId                                     │
│  • All connections scoped to groupId                                │
│  • All events scoped to groupId                                     │
│  • All knowledge scoped to groupId                                  │
│                                                                      │
│  Parent groups can access child group data (configurable)          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Effect.ts Service Layer (Optional)

**When to use:** Complex business logic, external API integration, or need for testability

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EFFECT.TS SERVICE PATTERN                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Benefits:                                                           │
│  ✓ Type-safe errors (no silent failures)                            │
│  ✓ Dependency injection (services auto-wired)                       │
│  ✓ Composability (chain operations cleanly)                         │
│  ✓ Testability (mock dependencies easily)                           │
│  ✓ Retry + timeout built-in                                         │
│                                                                      │
│  export class PurchaseService extends Effect.Service() {            │
│    effect: Effect.gen(function* () {                                │
│      const db = yield* ConvexDatabase;                              │
│      const stripe = yield* StripeService;                           │
│                                                                      │
│      return {                                                        │
│        buyCourse: (userId, courseId) =>                             │
│          Effect.gen(function* () {                                  │
│            // Validate                                               │
│            const user = yield* db.people.get(userId);               │
│            const course = yield* db.things.get(courseId);           │
│                                                                      │
│            // Charge                                                 │
│            const charge = yield* stripe.charge({                    │
│              amount: course.properties.price,                       │
│              customer: user._id                                      │
│            });                                                       │
│                                                                      │
│            // Create connection                                      │
│            const connection = yield* db.connections.create({        │
│              fromPersonId: user._id,                                 │
│              toThingId: course._id,                                  │
│              relationshipType: "purchased",                          │
│              groupId: course.groupId,                                │
│              metadata: { chargeId: charge.id }                      │
│            });                                                       │
│                                                                      │
│            // Log event                                              │
│            yield* db.events.log({                                   │
│              type: "purchase_completed",                             │
│              actorId: user._id,                                      │
│              targetId: connection._id,                               │
│              groupId: course.groupId                                 │
│            });                                                       │
│                                                                      │
│            return connection;                                        │
│          }).pipe(                                                    │
│            Effect.retry({ times: 3 }),                              │
│            Effect.timeout("30 seconds"),                            │
│            Effect.catchTags({                                       │
│              StripeError: (e) => Effect.fail(new PaymentError(e)),  │
│              NotFoundError: (e) => Effect.fail(new NotFoundError(e))│
│            })                                                        │
│          )                                                           │
│      };                                                              │
│    })                                                                │
│  }                                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  Framework:     Astro 5.14+ (SSR + Static)                          │
│  UI Library:    React 19 (Islands architecture)                     │
│  Styling:       Tailwind CSS v4 (CSS-based config)                  │
│  Components:    shadcn/ui (50+ pre-installed)                       │
│  State:         Nanostores (island communication)                   │
│  Auth:          Better Auth Client                                  │
│  Type Safety:   TypeScript 5.9+                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Database:      Convex (real-time, typed, serverless)               │
│  Auth:          Better Auth + Convex Adapter                        │
│  Functions:     Convex queries, mutations, actions                  │
│  Services:      Effect.ts (optional, for complex logic)             │
│  Email:         @convex-dev/resend                                  │
│  Rate Limit:    @convex-dev/rate-limiter                            │
│  Deployment:    Convex Cloud                                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  Schema:        6-Dimension Ontology (6 tables)                     │
│  Tables:        groups, people, things, connections, events,        │
│                 knowledge                                            │
│  Indexes:       by_type, by_group, by_actor, by_timestamp           │
│  Vectors:       knowledge.embedding (text-embedding-3-large)        │
│  Search:        Vector search + semantic similarity                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  Frontend:      Cloudflare Pages (edge rendering)                   │
│  Backend:       Convex Cloud (shocking-falcon-870.convex.cloud)     │
│  CDN:           Cloudflare (global edge network)                    │
│  SSL:           Auto-managed by Cloudflare                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Principles

1. **Reality-Based Abstraction**
   - 6 dimensions model reality, not technology
   - Groups, people, things, connections, events, knowledge
   - Technology-agnostic (Convex today, anything tomorrow)

2. **Hierarchical Multi-Tenancy**
   - Groups can contain groups (infinite nesting)
   - All dimensions scoped to groupId
   - Scales from friend circles to governments

3. **Type Safety End-to-End**
   - TypeScript on frontend
   - Convex validators on backend
   - Effect.ts typed errors (optional)
   - No silent failures

4. **Real-Time by Default**
   - Convex subscriptions (live queries)
   - Automatic UI updates when data changes
   - No polling, no manual cache invalidation

5. **Progressive Complexity**
   - Layer 1: Astro + Markdown (80% of apps)
   - Layer 2: + React Islands (15% of apps)
   - Layer 3: + Convex Backend (5% of apps)
   - Layer 4: + Effect.ts Services (<1% of apps)

6. **Backend-Agnostic Frontend**
   - Provider pattern abstracts data source
   - Switch backends via env var
   - Same code works with Convex, WordPress, Shopify, etc.

---

## Related Documentation

- **Main Architecture:** `/one/knowledge/architecture.md`
- **6-Dimension Ontology:** `/one/knowledge/ontology.md`
- **Convex Patterns:** `/web/AGENTS.md`
- **Effect.ts Guide:** `/one/knowledge/effect-services.md`
- **Deployment Guide:** `/one/knowledge/deployment.md`

---

**Built with clarity, simplicity, and infinite scale in mind.**
