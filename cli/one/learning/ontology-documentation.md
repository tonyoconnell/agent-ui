---
title: Ontology Documentation
dimension: knowledge
category: ontology-documentation.md
tags: 6-dimensions, agent, ai, architecture, connections, events, groups, knowledge, ontology, people
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the ontology-documentation.md category.
  Location: one/knowledge/ontology-documentation.md
  Purpose: Documents one ontology documentation
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand ontology documentation.
---

# ONE Ontology Documentation

**Version 1.0 - 6-Dimension Architecture**

---

## The Flow

```
Groups → People → Things → Connections → Events → Knowledge
  ↓         ↓         ↓           ↓            ↓          ↓
Scope   Authorize  Create     Relate      Log &      Power
& Own   with AI    Entities   Entities    Track    Intelligence
```

---

## Documentation Structure

### Core Concepts (Start Here)

1. **[groups.md](../groups/groups.md)** - Multi-tenant containers

   - Groups own things
   - Hierarchical nesting (6 types)
   - Track usage & quotas
   - Manage billing & revenue sharing

2. **[people.md](./people.md)** - Creators, owners & users

   - Platform owner (Anthony - 100% ownership)
   - Group owners (manage groups)
   - Group users (work within groups)
   - Customers (consume content)

3. **[things.md](./things.md)** - 66 entity types

   - If you can point at it, it's a thing
   - Core, agents, content, products, community, tokens, etc.
   - Summary with patterns (full details in Ontology.md)

4. **[connections.md](./connections.md)** - 25 relationship types

   - Thing-to-thing relationships
   - Ownership, membership, transactions
   - Protocol-agnostic design
   - Summary with patterns (full details in Ontology.md)

5. **[events.md](./events.md)** - 67 event types

   - Time-stamped actions
   - Complete audit trail
   - Cycle & revenue tracking
   - Summary with patterns (full details in Ontology.md)

6. **[knowledge.md](./knowledge.md)** - Vectors & cycle
   - **The intelligence layer**
   - Embeddings for semantic search
   - RAG (Retrieval-Augmented Generation)
   - Cycle quotas & revenue flows
   - Labels replace legacy tags

### Knowledge Subdirectory

- **[knowledge/score.md](./knowledge/score.md)** - Cycle score tracker
  - Measures ontology stability
  - Lower is better
  - Goal: < 20 modifications per month

---

## The Complete Specification

**[Ontology.md](./ontology.md)** - The single source of truth

- Complete technical specification
- All 66 thing types with properties
- All 25 connection types with metadata patterns
- All 67 event types with examples
- Protocol integration examples (A2A, ACP, AP2, X402, AGUI)
- Migration guides & validation rules
- Performance optimization & indexing

---

## Quick Start Guide

### For AI Agents

1. Read **[Ontology.md](./ontology.md)** (complete spec)
2. Understand the 6-dimension universe:
   - **Groups** - multi-tenant isolation with hierarchical nesting
   - **People** - authorization & governance (4 core roles)
   - **Things** - 66 entity types
   - **Connections** - 25 relationship types
   - **Events** - 67 action types
   - **Knowledge** - labels, chunks, vectors for RAG
3. Follow patterns in consolidated files
4. Everything maps to these 6 dimensions (groups, people, things, connections, events, knowledge)

### For Developers

1. Start with **[ontology.md](./ontology.md)** - Complete 6-dimension specification
2. Read the group dimension - Multi-tenancy & hierarchical groups
3. Read the people dimension - Roles (platform_owner, group_owner, group_user, customer)
4. Review things dimension (66 types) - What entities exist
5. Review connections dimension (25 types) - How things relate
6. Review events dimension (67 types) - What gets logged
7. Review knowledge dimension - Vectors & RAG for understanding

### For Product Managers

1. **Groups** - How customers are isolated with hierarchical nesting
2. **People** - How users, roles & permissions work (4 core roles)
3. **Knowledge** - How AI cycle generates revenue
4. **Events** - What gets tracked & analyzed (67 types)

---

## Key Principles

### 1. Six Dimensions

Everything in ONE exists in one of 6 dimensions:

- **groups** - multi-tenant isolation (hierarchical containers with 6 types)
- **people** - authorization & governance (who can do what)
- **things** - entities (66 types)
- **connections** - relationships (25 types)
- **events** - actions (67 types)
- **knowledge** - vectors + labels (4 types)

### 2. Knowledge (Labels, Chunks, & Vectors)

Knowledge is the 6th dimension for understanding:

- **Labels** - Categorization (skill:python, industry:fitness, topic:ai)
- **Documents** - Source documents before chunking
- **Chunks** - 800-token chunks with vector embeddings
- **Vector-only** - Privacy-preserving embeddings without text
- Powers RAG (Retrieval-Augmented Generation)
- Enables semantic search and understanding

### 3. Protocol-Agnostic

All protocols map TO the ontology via metadata:

- `metadata.protocol` identifies the protocol (a2a, acp, ap2, x402, agui)
- `metadata.network` identifies blockchain (sui, solana, base)
- Core ontology remains stable
- Infinite protocol extensibility

### 4. Group-Scoped

Multi-tenant isolation:

- Every resource belongs to a group
- Permissions enforced via membership connections
- Usage tracked per group
- Revenue sharing configurable per group

### 5. Event-Driven

Complete audit trail:

- Every action logs an event
- Every state change is immutable
- Time-stamped with actor
- Queryable for analytics

---

## The Loop

```
┌─────────────────────────────────────────────────┐
│  1. Group Scope                                  │
│     Define the context for all operations        │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  2. Person Authorization                         │
│     Check permissions & role                     │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  3. User Request                                 │
│     "Create a fitness course"                    │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  4. Vector Search (Knowledge)                    │
│     Find relevant chunks + labels                │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  5. RAG Context Assembly                         │
│     Crawls using vectors and ontology → Context  │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  6. LLM Generation                               │
│     Context + Prompt → Generated content         │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  7. Create Thing + Connections + Events          │
│     Course entity + ownership + logs             │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  8. Embed New Content (Knowledge)                │
│     Course → chunks → embeddings                 │
└─────────────────────────────────────────────────┘
```

Knowledge makes generation **context-aware**, groups make it **multi-tenant**, and people make it **governed**.

---

## Design Philosophy

**Simplicity is the ultimate sophistication.**

- **6 dimensions** (not 50+ tables)
- **Groups** partition the space (6 types, hierarchical)
- **People** authorize and govern
- **66 thing types** (covers everything)
- **25 connection types** (all relationships)
- **67 event types** (complete tracking)
- **Metadata for variance** (not enum explosion)
- **Protocol-agnostic core** (infinite extensibility)

This ontology proves you don't need complexity to build a complete AI-native platform that scales from children's lemonade stands to global enterprises.

---

## Implementation

### Convex Schema

```typescript
// things table
defineTable({
  type: v.string(), // ThingType
  name: v.string(),
  properties: v.any(), // Flexible JSON
  status: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
})
  .index("by_type", ["type"])
  .index("by_status", ["status"])
  .index("by_created", ["createdAt"]);

// connections table
defineTable({
  fromThingId: v.id("things"),
  toThingId: v.id("things"),
  relationshipType: v.string(),
  metadata: v.optional(v.any()),
  strength: v.optional(v.number()),
  validFrom: v.optional(v.number()),
  validTo: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("from_type", ["fromThingId", "relationshipType"])
  .index("to_type", ["toThingId", "relationshipType"])
  .index("bidirectional", ["fromThingId", "toThingId"]);

// events table
defineTable({
  type: v.string(), // EventType
  actorId: v.id("things"),
  targetId: v.optional(v.id("things")),
  timestamp: v.number(),
  metadata: v.any(),
})
  .index("type_time", ["type", "timestamp"])
  .index("actor_time", ["actorId", "timestamp"])
  .index("thing_type_time", ["targetId", "type", "timestamp"]);

// knowledge table
defineTable({
  knowledgeType: v.string(), // 'label' | 'document' | 'chunk' | 'vector_only'
  text: v.optional(v.string()),
  embedding: v.optional(v.array(v.number())),
  embeddingModel: v.optional(v.string()),
  embeddingDim: v.optional(v.number()),
  sourceThingId: v.optional(v.id("things")),
  sourceField: v.optional(v.string()),
  chunk: v.optional(v.any()),
  labels: v.optional(v.array(v.string())),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
})
  .index("by_type", ["knowledgeType"])
  .index("by_source", ["sourceThingId"])
  .index("by_created", ["createdAt"]);
// Vector index (provider-specific)

// thingKnowledge junction table
defineTable({
  thingId: v.id("things"),
  knowledgeId: v.id("knowledge"),
  role: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
})
  .index("by_thing", ["thingId"])
  .index("by_knowledge", ["knowledgeId"]);
```

---

## Roadmap

### Phase 1: Foundation ✅

- Ontology complete
- Knowledge system designed
- Documentation organized

### Phase 2: Implementation (Current)

- Convex schema migration
- Embedding pipeline
- Vector search
- Cycle tracking

### Phase 3: Scale

- Multi-tenant dashboards
- Revenue sharing automation
- Cross-chain bridges
- Protocol integrations

---

## Contributing

When adding features:

1. **Map to ontology first** - Which things/connections/events?
2. **Use existing types** - Don't create new types unless necessary
3. **Metadata for variance** - Protocol/network in metadata, not new enums
4. **Log events** - Every action creates an event
5. **Embed content** - Text content → knowledge chunks
6. **Update cycle score** - Track ontology modifications

**Stability = Beauty**

---

**Welcome to ONE. Where groups contain, people customize, and knowledge powers everything.**
