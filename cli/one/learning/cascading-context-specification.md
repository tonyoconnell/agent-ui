---
title: Cascading CLAUDE.md Architecture Specification
dimension: knowledge
category: architecture
tags: context, documentation, ontology, ai, optimization
related_dimensions: all
scope: global
created: 2025-11-08
version: 1.0.0
ai_context: |
  Specification for cascading CLAUDE.md architecture that maximizes context efficiency
  using the 6-dimension ontology as organizational principle. Reduces token usage by
  98% (from 150k to 3k per context load) through strategic reference vs duplication.
---

# Cascading CLAUDE.md Architecture Specification

**Version:** 1.0.0
**Purpose:** Design a cascading context system that reduces token usage by 98% while maximizing usefulness
**Principle:** Reference knowledge, don't duplicate it (following the 6-dimension ontology)

---

## Executive Summary

### Current State

**Root CLAUDE.md:** 1,204 lines, ~45,000 tokens
- Contains extensive inline documentation
- Duplicates information from `/one/` docs
- Loaded regardless of working directory
- Information organized linearly, not hierarchically

**Subdirectory CLAUDE.md files:**
- `/web/CLAUDE.md`: 886 lines, ~35,000 tokens (frontend patterns + duplication)
- `/backend/CLAUDE.md`: 448 lines, ~18,000 tokens (backend patterns + duplication)
- `/backend/convex/CLAUDE.md`: Not yet created

**Total context load per task:** 80,000-150,000 tokens

**Problem:** Agents working in `/web/src/components/` load 80k+ tokens of context, 95% irrelevant.

### Proposed State

**Root CLAUDE.md:** 150 lines, ~3,000 tokens (orchestration only)
- Links to `/one/` canonical docs
- Minimal inline content
- Directory precedence rules
- Agent coordination patterns

**Subdirectory CLAUDE.md files:**
- `/web/CLAUDE.md`: 200 lines, ~4,000 tokens (frontend-specific + links)
- `/backend/CLAUDE.md`: 200 lines, ~4,000 tokens (backend-specific + links)
- `/backend/convex/CLAUDE.md`: 150 lines, ~3,000 tokens (database-specific + links)
- `/web/src/components/CLAUDE.md`: 100 lines, ~2,000 tokens (component-specific + links)
- `/web/src/pages/CLAUDE.md`: 100 lines, ~2,000 tokens (page-specific + links)

**Total context load per task:** 2,000-6,000 tokens (98% reduction)

**Solution:** Cascading context where each level adds only NEW information specific to that directory.

---

## Design Principles

### 1. Reference, Don't Duplicate (Knowledge Dimension)

**Bad (Current):**
```markdown
## The 6-Dimension Ontology

[60 lines of ontology explanation repeated in root CLAUDE.md]
[60 lines of ontology explanation repeated in web/CLAUDE.md]
[60 lines of ontology explanation repeated in backend/CLAUDE.md]
```

**Good (Proposed):**
```markdown
## The 6-Dimension Ontology

**Read:** `/one/knowledge/ontology.md` (Version 1.0.0 - canonical specification)

**Quick Reference:**
- Groups → Multi-tenant containers (groupId scoping)
- People → Authorization & roles (via things with type='creator')
- Things → All entities (66+ types)
- Connections → All relationships (25+ types)
- Events → Complete audit trail (67+ types)
- Knowledge → Labels + vectors (RAG)

**If you can't map to these 6 dimensions, rethink your approach.**
```

**Token savings:** 180 lines → 15 lines (92% reduction)

### 2. Hierarchical Context (Groups Dimension)

**Directory hierarchy = Context hierarchy:**

```
/CLAUDE.md (root)
  ├─ Global rules (git safety, ontology links)
  ├─ Agent coordination (parallel execution)
  └─ Links to /one/ docs

/web/CLAUDE.md (inherits root + adds frontend-specific)
  ├─ Frontend role (render 6 dimensions)
  ├─ Progressive complexity (5 layers)
  ├─ Astro + React patterns
  └─ Links to /one/knowledge/astro-* docs

/web/src/components/CLAUDE.md (inherits web + adds component-specific)
  ├─ Component patterns (ThingCard, PersonCard, EventItem)
  ├─ shadcn/ui usage
  ├─ Ontology mapping (which dimension?)
  └─ Links to /one/knowledge/patterns/frontend/

/backend/CLAUDE.md (inherits root + adds backend-specific)
  ├─ Backend role (implement 6 dimensions)
  ├─ 6-step mutation pattern
  ├─ Effect.ts services
  └─ Links to /one/connections/workflow.md

/backend/convex/CLAUDE.md (inherits backend + adds database-specific)
  ├─ Schema patterns
  ├─ Index strategies
  ├─ Query optimization
  └─ Links to /one/connections/schema.md
```

**Precedence rule:** Closer to file = higher precedence (as stated in current CLAUDE.md)

### 3. Connections Create Context Graph (Connections Dimension)

**Links between CLAUDE.md files and /one/ docs create a graph of knowledge:**

```
Root CLAUDE.md
  │
  ├─→ /one/knowledge/ontology.md (canonical truth)
  ├─→ /one/connections/workflow.md (6-phase process)
  ├─→ /one/knowledge/rules.md (golden rules)
  │
  ├─→ /web/CLAUDE.md
  │    │
  │    ├─→ /one/knowledge/astro-effect-simple-architecture.md
  │    ├─→ /one/knowledge/provider-agnostic-content.md
  │    └─→ /one/knowledge/patterns/frontend/*.md
  │
  └─→ /backend/CLAUDE.md
       │
       ├─→ /one/connections/service-layer.md
       ├─→ /one/connections/effect.md
       └─→ /one/knowledge/patterns/backend/*.md
```

**Each node adds context, not duplicates it.**

### 4. Events Track Evolution (Events Dimension)

**Git history preserves the evolution of context:**

- Root CLAUDE.md changes → Major architecture shifts
- Subdirectory CLAUDE.md changes → Layer-specific pattern updates
- /one/ doc changes → Knowledge updates (propagate to all CLAUDE.md via links)

**Agents emit `documentation_updated` events when CLAUDE.md files change.**

---

## Detailed File Specifications

### Root `/CLAUDE.md`

**Current:** 1,204 lines, ~45,000 tokens
**Proposed:** 150 lines, ~3,000 tokens
**Reduction:** 97.5%

**Keep:**
- Critical rules (git safety, destructive operations)
- Cascading context system explanation
- Parallel agent execution pattern
- Architecture overview (3 lines: Web → Backend → Ontology)
- Link to ontology (with 6-line summary)
- Cycle-based planning (overview + commands)
- Technology stack (bullet list only)
- Root directory file policy
- File structure (tree only, no explanations)
- Development workflow (6 phases with links)
- Deployment section (links only)
- Getting help section (links to /one/ docs)

**Remove (move to /one/ docs):**
- ~~Installation folders~~ → Already in `/one/knowledge/installation-folders.md`
- ~~Development commands~~ → Move to `/one/knowledge/development-commands.md`
- ~~Frontend-first development~~ → Already in `/web/CLAUDE.md`
- ~~The 6-dimension ontology (detailed)~~ → Link to `/one/knowledge/ontology.md`
- ~~Key patterns and best practices~~ → Link to `/one/connections/patterns.md`
- ~~Important guidelines~~ → Move to `/one/knowledge/guidelines.md`
- ~~Common issues and solutions~~ → Move to `/one/knowledge/troubleshooting.md`
- ~~Critical reading before coding~~ → Keep as links only
- ~~Documentation structure~~ → Link to `/one/README.md`
- ~~English → Code workflow~~ → Move to `/one/knowledge/language.md`
- ~~Plain English DSL~~ → Already in `/one/knowledge/language.md`
- ~~Philosophy~~ → Move to `/one/groups/vision.md`
- ~~Claude automation stack~~ → Link to `/.claude/agents/README.md`

**New structure:**

```markdown
# CLAUDE.md

## ⚠️ CRITICAL RULES - NEVER BREAK THESE

[4 rules - unchanged]

---

## Cascading Context System

**You are reading the ROOT context file.** Navigate deeper:

```
/CLAUDE.md (this file - global orchestration)
  ↓ Navigate to subdirectory
/web/CLAUDE.md (frontend-specific, higher precedence in web/)
  ↓ Navigate deeper
/web/src/components/CLAUDE.md (component-specific, highest precedence)
```

**Precedence rule:** Closer to the file = higher precedence.

**Parallel Agent Execution:** Spawn agents concurrently (not sequentially) for 2-5x speedup.

---

## Architecture Overview

**ONE Platform** = Multi-tenant AI-native platform built on 6-dimension ontology.

```
Web (Astro + React) → Backend (Convex) → 6-Dimension Ontology
```

**Key Repositories:**
- `/web` - Frontend (Astro 5, React 19, Tailwind v4)
- `/backend` - Backend (Convex, Effect.ts, Better Auth)
- `/one` - Documentation (41 files, 8 layers)
- `/.claude` - Agent definitions & commands

**Read full architecture:** `/one/knowledge/architecture.md`

---

## The 6-Dimension Ontology

**Read canonical specification:** `/one/knowledge/ontology.md` (Version 1.0.0)

**Quick Reference:**
1. **GROUPS** → Multi-tenant containers (groupId scoping, infinite nesting)
2. **PEOPLE** → Authorization & roles (4 roles: platform_owner, org_owner, org_user, customer)
3. **THINGS** → All entities (66+ types: users, agents, content, tokens, courses)
4. **CONNECTIONS** → All relationships (25+ types: owns, follows, purchased, holds_tokens)
5. **EVENTS** → Complete audit trail (67+ types: created, updated, purchased, completed)
6. **KNOWLEDGE** → Labels + vectors (RAG, search, categorization)

**Golden Rule:** If you can't map a feature to these 6 dimensions, you're thinking about it wrong.

---

## Cycle-Based Planning

**We plan in cycles (1-100), not days.** Each cycle = concrete step, < 3k tokens.

**Commands:**
- `/now` - Current cycle
- `/next` - Advance to next
- `/todo` - View 100-cycle sequence
- `/done` - Mark complete

**Benefits:** 98% context reduction, 5x faster execution, flawless execution.

**Read full system:** `/one/knowledge/todo.md`

---

## Development Workflow

**Before ANY feature, follow 6-phase workflow:**

1. **UNDERSTAND** → Read `/one/knowledge/ontology.md`, identify category
2. **MAP TO ONTOLOGY** → Things, connections, events, knowledge
3. **DESIGN SERVICES** → Effect.ts business logic
4. **IMPLEMENT BACKEND** → Convex mutations/queries
5. **BUILD FRONTEND** → React components
6. **TEST & DOCUMENT** → Unit tests, integration tests, update docs

**Read full workflow:** `/one/connections/workflow.md`

---

## Technology Stack

**Frontend:** Astro 5, React 19, Tailwind v4, shadcn/ui, Better Auth
**Backend:** Convex, Effect.ts, Better Auth + Convex Adapter
**Deployment:** Cloudflare Pages (frontend), Convex Cloud (backend)

**Read full stack:** `/one/knowledge/architecture.md#technology-stack`

---

## File Structure

```
ONE/
├── web/                    # Frontend (see web/CLAUDE.md)
├── backend/                # Backend (see backend/CLAUDE.md)
├── one/                    # Documentation (41 files organized by 6 dimensions)
├── .claude/                # Agent definitions & commands
└── apps/                   # Example applications
```

---

## Critical Reading Before Coding

**For ANY feature:**
1. `/one/knowledge/ontology.md` - 6-dimension model
2. `/one/connections/workflow.md` - 6-phase process
3. `/one/knowledge/rules.md` - Golden rules
4. Subdirectory CLAUDE.md (web/, backend/, etc.)

**For specific features:**
- Protocols: `/one/connections/protocols.md`
- Blockchain: `/one/connections/cryptonetworks.md`
- Agents: `/one/connections/agentkit.md`
- Integration: `/one/connections/integration-guide.md`

---

## Getting Help

**Documentation:**
- 6-Dimension Ontology: `/one/knowledge/ontology.md`
- Architecture: `/one/knowledge/architecture.md`
- Workflows: `/one/connections/workflow.md`
- Patterns: `/one/connections/patterns.md`
- Troubleshooting: `/one/knowledge/troubleshooting.md`

**Agent Coordination:**
- Director: `/.claude/agents/agent-director.md`
- Builder Squad: `/.claude/agents/agent-builder.md`
- Quality Loop: `/.claude/agents/agent-quality.md`

---

**Built with clarity, simplicity, and infinite scale in mind.**
```

**Token estimate:** ~3,000 tokens (93% reduction)

---

### `/web/CLAUDE.md`

**Current:** 886 lines, ~35,000 tokens
**Proposed:** 200 lines, ~4,000 tokens
**Reduction:** 89%

**Keep:**
- Critical rules (inherited from root)
- "This is a cascading context file" header
- Your role: Render the 6 dimensions
- Progressive complexity (5 layers with brief examples)
- Pattern convergence (ONE pattern, not many)
- Component architecture patterns (brief)
- Astro islands architecture (brief)
- Provider pattern (concept only)
- Decision framework (questions)
- Common mistakes (brief list)

**Remove (move to /one/ or keep as links):**
- ~~Detailed pattern examples~~ → Link to `/one/knowledge/patterns/frontend/*.md`
- ~~Detailed component code~~ → Link to `/one/knowledge/patterns/frontend/component-template.md`
- ~~Nanostores detailed examples~~ → Link to `/one/knowledge/astro-effect-simple-architecture.md`
- ~~Convex hooks detailed examples~~ → Link to `/one/knowledge/patterns/frontend/react-component-pattern.md`
- ~~shadcn/ui component list~~ → Link to documentation or keep 5-line summary
- ~~Tailwind v4 detailed config~~ → Link to `/one/knowledge/guidelines.md#tailwind-v4`
- ~~Performance optimization details~~ → Link to `/one/knowledge/performance.md`
- ~~Role-based UI code~~ → Link to `/one/knowledge/patterns/frontend/authorization-pattern.md`
- ~~File structure~~ → Link to root CLAUDE.md
- ~~Development commands~~ → Link to `/one/knowledge/development-commands.md`
- ~~Success criteria~~ → Link to `/one/knowledge/quality-loop.md`

**New structure:**

```markdown
# Frontend Development - CLAUDE.md

## This is a Cascading Context File

**You've read `/CLAUDE.md` (root).** This file adds FRONTEND-SPECIFIC patterns.

**What you learned from root:**
- 6-dimension ontology (link to `/one/knowledge/ontology.md`)
- 6-phase workflow (link to `/one/connections/workflow.md`)
- Cascading context system

**What this file adds:**
- Frontend renders the 6 dimensions
- Progressive complexity (5 layers)
- Component patterns (ThingCard, PersonCard, EventItem)
- Astro islands + React hooks

---

## Your Role: Render the 6-Dimension Ontology

**Backend implements, Frontend renders:**

```
Backend (Convex)         Frontend (You Build)
────────────────         ────────────────────
groups table      →      <GroupSelector>, <GroupHierarchy>
things table      →      <ThingCard type="product|course|...">
connections       →      <ConnectionList>, <RelationshipGraph>
events            →      <ActivityFeed>, <EventTimeline>
knowledge         →      <SearchResults>, <Recommendations>
people (role)     →      <PersonCard>, <RoleBadge>
```

**Key principle:** Ontology never changes. Components do.

---

## Progressive Complexity (5 Layers)

**Read full architecture:** `/one/knowledge/astro-effect-simple-architecture.md`

**Layer 1: Content + Pages** (80% of features - START HERE)
```astro
import { getCollection } from "astro:content";
const products = await getCollection("products");
```

**Layer 2: + Validation** (15% - Add when needed)
```typescript
import { Effect } from "effect";
// Business logic validation
```

**Layer 3: + State** (4% - Add for island communication)
```typescript
import { atom } from "nanostores";
export const cart$ = atom<CartItem[]>([]);
```

**Layer 4: + Multiple Sources** (1% - Add for provider switching)
```typescript
const provider = getContentProvider("products"); // markdown | api | hybrid
```

**Layer 5: + Backend** (<1% - Only when explicitly requested)
```typescript
import { useQuery } from "convex/react";
const products = useQuery(api.queries.products.list);
```

**Golden Rule:** Start Layer 1. Add layers only when pain is felt.

**Read full guide:** `/one/knowledge/provider-agnostic-content.md`

---

## Pattern Convergence (98% AI Accuracy)

**ONE component per dimension:**

```typescript
// Things dimension → ONE ThingCard component
<ThingCard thing={product} type="product" />
<ThingCard thing={course} type="course" />

// People dimension → ONE PersonCard component
<PersonCard person={user} />

// Events dimension → ONE EventItem component
<EventItem event={event} />
```

**Why this works:** AI sees 3 patterns (not 100), confidence = 98%.

**Anti-pattern:** ProductCard, CourseCard, UserProfile, ActivityItem (4+ patterns, confidence = 30%)

**Read full patterns:** `/one/knowledge/patterns/frontend/component-template.md`

---

## Astro Islands Architecture

**Performance principle:** Static HTML by default. Add interactivity strategically.

```astro
<!-- Static (no JS) -->
<ProductCard product={product} />

<!-- Interactive (loads immediately) -->
<ShoppingCart client:load />

<!-- Deferred (loads when idle) -->
<SearchBox client:idle />

<!-- Lazy (loads when visible) -->
<RelatedProducts client:visible />
```

**Island communication:** Use nanostores (ONE pattern for sharing state)

```typescript
// stores/cart.ts
import { atom } from "nanostores";
export const cart$ = atom<CartItem[]>([]);

// Any island can read/write
import { useStore } from "@nanostores/react";
const cart = useStore(cart$);
```

**Read full guide:** `/one/knowledge/astro-effect-simple-architecture.md#layer-3`

---

## Provider Pattern (Backend-Agnostic)

**Power:** Frontend code never changes when backend switches.

```typescript
// Development: markdown files
// .env: CONTENT_SOURCE=markdown
const provider = getContentProvider("products");

// Production: Convex real-time
// .env: CONTENT_SOURCE=convex
const provider = getContentProvider("products");

// SAME CODE. DIFFERENT SOURCE.
```

**Read full pattern:** `/one/knowledge/provider-agnostic-content.md`

---

## Decision Framework

**Before coding, answer:**

### Ontology Mapping
1. Which dimension? (groups/people/things/connections/events/knowledge)
2. Which thing type? (product, course, token, agent, etc.)
3. Which connection type? (owns, purchased, enrolled_in, holds_tokens)
4. Which event type? (created, updated, purchased, completed)

### Performance
1. Can this be static HTML? → Astro component (no JS)
2. Needs interactivity? → Client island (`client:load|idle|visible`)
3. Real-time data? → Convex `useQuery`
4. Heavy component? → Dynamic import + code splitting

### Component Selection
1. Static content? → Astro component
2. Simple interactivity? → React component + hooks
3. Complex state? → React + nanostores
4. Form handling? → React + Effect.ts validation

**Read full decision tree:** `/one/connections/workflow.md#phase-5`

---

## Common Mistakes

**Ontology violations:**
- ❌ Creating custom tables
- ✅ Map to 6 dimensions

**Performance anti-patterns:**
- ❌ `client:load` everywhere
- ✅ Use appropriate directive (idle, visible)

**Pattern divergence:**
- ❌ ProductCard, CourseCard, UserCard (many patterns)
- ✅ ThingCard, PersonCard (ONE pattern)

**Read full list:** `/one/knowledge/rules.md#common-mistakes`

---

## Further Cascading

**For more specific context:**
- Component patterns: `/web/src/components/CLAUDE.md`
- Page patterns: `/web/src/pages/CLAUDE.md`
- Service layer: `/web/src/lib/services/CLAUDE.md`

**Precedence rule:** Closer to file = higher precedence.

---

**Frontend Specialist: Render the 6-dimension ontology with performance and pattern convergence.**
```

**Token estimate:** ~4,000 tokens (89% reduction)

---

### `/backend/CLAUDE.md`

**Current:** 448 lines, ~18,000 tokens
**Proposed:** 200 lines, ~4,000 tokens
**Reduction:** 78%

**Keep:**
- "This is a cascading context file" header
- What you learned from root
- Backend role: Implement 6 dimensions
- Universal backend pattern (6-step mutation) - CRITICAL
- Effect.ts service layer (why + when)
- Backend architecture (brief tree)
- Multi-tenant isolation (pattern only)
- Authentication pattern (brief)
- Event logging pattern (brief)
- Type validation (brief)
- Error handling (brief)

**Remove (move to /one/ or keep as links):**
- ~~Database table details~~ → Link to `/one/connections/schema.md`
- ~~Detailed Effect.ts examples~~ → Link to `/one/connections/effect.md`
- ~~Detailed mutation/query code~~ → Link to `/one/knowledge/patterns/backend/*.md`
- ~~Service rules checklist~~ → Link to `/one/connections/service-layer.md`
- ~~Development commands~~ → Link to `/one/knowledge/development-commands.md`

**New structure:**

```markdown
# Backend Development - CLAUDE.md

## This is a Cascading Context File

**You've read `/CLAUDE.md` (root).** This file adds BACKEND-SPECIFIC patterns.

**What you learned from root:**
- 6-dimension ontology
- 6-phase workflow
- Cascading context system

**What this file adds:**
- Backend implements the 6 dimensions
- 6-step universal mutation pattern
- Effect.ts service layer
- Multi-tenant isolation

---

## Your Role: Implement the 6-Dimension Ontology

**Backend provides the CRUD for 6 dimensions:**

```
Ontology Design → Backend (You Build) → Database (Convex)
────────────────   ────────────────────   ────────────────
groups            → mutations/groups.ts  → groups table
things            → mutations/things.ts  → things table (includes people)
connections       → mutations/connections.ts → connections table
events            → mutations/events.ts  → events table
knowledge         → mutations/knowledge.ts → knowledge table
```

**Key principle:** Thin wrappers. Business logic in services.

---

## The Universal Backend Pattern (CRITICAL)

**Every mutation follows these EXACT 6 steps:**

```typescript
export const create = mutation({
  args: { groupId, type, name, properties },
  handler: async (ctx, args) => {
    // 1. AUTHENTICATE
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // 2. VALIDATE GROUP
    const group = await ctx.db.get(args.groupId);
    if (!group || group.status !== "active") {
      throw new Error("Invalid group");
    }

    // 3. VALIDATE TYPE (against ontology)
    if (!isThingType(args.type)) {
      throw new Error(`Invalid type: ${args.type}`);
    }

    // 4. GET ACTOR (for event logging)
    const actor = await ctx.db
      .query("things")
      .withIndex("group_type", q =>
        q.eq("groupId", args.groupId).eq("type", "creator")
      )
      .filter(q => q.eq(q.field("properties.userId"), identity.tokenIdentifier))
      .first();

    // 5. CREATE ENTITY
    const entityId = await ctx.db.insert("things", {
      groupId: args.groupId,
      type: args.type,
      name: args.name,
      properties: args.properties || {},
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // 6. LOG EVENT (CRITICAL - never skip)
    if (actor) {
      await ctx.db.insert("events", {
        groupId: args.groupId,
        type: "thing_created",
        actorId: actor._id,
        targetId: entityId,
        timestamp: Date.now(),
        metadata: { entityType: args.type }
      });
    }

    return entityId;
  }
});
```

**Why 98% accuracy?** AI sees this exact pattern in every mutation.

**Read full patterns:** `/one/knowledge/patterns/backend/mutation-template.md`

---

## Effect.ts Service Layer

**When to use:**
- Complex business logic (multi-step workflows)
- Service composition (combining services)
- Error handling with recovery (retry, fallback)
- Dependency injection (testing)

**When NOT to use:**
- Simple CRUD (Convex mutations are enough)
- Pure database queries
- Authentication checks

**Read full guide:** `/one/connections/effect.md`

**Example:**

```typescript
export class TokenService extends Effect.Service<TokenService>()("TokenService", {
  effect: Effect.gen(function* () {
    const db = yield* ConvexDatabase;
    const sui = yield* SuiProvider;

    return {
      purchase: (args) => Effect.gen(function* () {
        // 1. Validate
        const user = yield* Effect.tryPromise(() => db.get(args.userId));

        // 2. Execute blockchain tx
        const result = yield* sui.executeTransaction(tx);

        // 3. Create connection
        yield* Effect.tryPromise(() => db.insert("connections", { ... }));

        // 4. Log event
        yield* Effect.tryPromise(() => db.insert("events", { ... }));

        return { success: true, txDigest: result.digest };
      })
    };
  }),
  dependencies: [ConvexDatabase.Default, SuiProvider.Default]
}) {}
```

**Read service patterns:** `/one/knowledge/patterns/backend/service-template.md`

---

## Multi-Tenant Isolation

**CRITICAL:** Every mutation/query MUST scope by groupId.

```typescript
// ALWAYS validate group
const group = await ctx.db.get(args.groupId);
if (!group || group.status !== "active") {
  throw new Error("Invalid group");
}

// ALWAYS filter by groupId
const things = await ctx.db
  .query("things")
  .withIndex("group_type", q =>
    q.eq("groupId", args.groupId).eq("type", args.type)
  )
  .collect();
```

**Never query without groupId scope.** Cross-tenant data leaks = security catastrophe.

**Read full patterns:** `/one/connections/multitenant.md`

---

## Database Schema (5 Tables, 6 Dimensions)

```
groups table      → Dimension 1 (multi-tenant containers)
things table      → Dimensions 2 & 3 (people + things)
connections table → Dimension 4 (relationships)
events table      → Dimension 5 (audit trail)
knowledge table   → Dimension 6 (embeddings, labels)
```

**Why 5 tables for 6 dimensions?** People stored as things with `type: 'creator'`.

**Read full schema:** `/one/connections/schema.md`

---

## Further Cascading

**For more specific context:**
- Convex database layer: `/backend/convex/CLAUDE.md`
- Service patterns: `/backend/convex/services/CLAUDE.md`
- Specific domains: `/backend/convex/mutations/<domain>/CLAUDE.md`

**Precedence rule:** Closer to file = higher precedence.

---

**Backend Specialist: Implement the 6-dimension ontology with 98% pattern accuracy.**
```

**Token estimate:** ~4,000 tokens (78% reduction)

---

### `/backend/convex/CLAUDE.md` (NEW)

**Current:** Does not exist
**Proposed:** 150 lines, ~3,000 tokens

**Purpose:** Convex-specific database patterns (schema, indexes, queries, mutations)

**New structure:**

```markdown
# Convex Database Layer - CLAUDE.md

## This is a Cascading Context File

**You've read `/CLAUDE.md` (root) and `/backend/CLAUDE.md` (backend).** This file adds CONVEX-SPECIFIC database patterns.

**What you learned from backend:**
- 6-dimension implementation
- 6-step mutation pattern
- Effect.ts service layer

**What this file adds:**
- Schema definition patterns
- Index strategies
- Query optimization
- Migration patterns

---

## Your Role: Database Layer for 6 Dimensions

**Convex provides real-time database with typed functions:**

```
Schema (schema.ts) → Mutations → Queries → Real-time subscriptions
```

**Key principle:** 5 tables (groups, things, connections, events, knowledge) implement 6 dimensions.

---

## Schema Patterns

**Read full schema:** `/one/connections/schema.md`

**5-table structure:**

```typescript
// schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  groups: defineTable({
    name: v.string(),
    type: v.union(v.literal("friend_circle"), v.literal("business"), ...),
    parentGroupId: v.optional(v.id("groups")), // Hierarchical nesting
    properties: v.any(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_status", ["status"])
    .index("by_parent", ["parentGroupId"]),

  things: defineTable({
    groupId: v.id("groups"), // CRITICAL: Multi-tenant scoping
    type: v.string(),        // 66+ types (product, course, creator, etc.)
    name: v.string(),
    properties: v.any(),     // Type-specific data
    status: v.union(v.literal("draft"), v.literal("active"), ...),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_group_type", ["groupId", "type"])
    .index("by_group_status", ["groupId", "status"])
    .index("by_type", ["type"]),

  // connections, events, knowledge tables...
});
```

**Golden Rule:** Every table (except groups) has `groupId: v.id("groups")` for multi-tenancy.

---

## Index Strategies

**CRITICAL:** Add index for every query pattern.

```typescript
// Query pattern: list things by group + type
.query("things")
  .withIndex("by_group_type", q => q.eq("groupId", groupId).eq("type", type))

// Index required:
.index("by_group_type", ["groupId", "type"])
```

**Common indexes:**
- `by_group_type` - List entities of type in group
- `by_group_status` - Filter by status in group
- `by_created_at` - Sort by creation time
- `by_from_to` - Connections from → to
- `by_actor_timestamp` - Events by actor over time

**Read full patterns:** `/one/connections/schema.md#indexes`

---

## Query Patterns

**Always scope by groupId:**

```typescript
// List things
export const list = query({
  args: { groupId: v.id("groups"), type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("things")
      .withIndex("by_group_type", q =>
        q.eq("groupId", args.groupId).eq("type", args.type)
      )
      .collect();
  }
});

// Get single thing
export const get = query({
  args: { id: v.id("things") },
  handler: async (ctx, args) => {
    const thing = await ctx.db.get(args.id);
    if (!thing) throw new Error("Not found");

    // Verify tenant access (if needed)
    const group = await ctx.db.get(thing.groupId);
    if (!group || group.status !== "active") {
      throw new Error("Invalid group");
    }

    return thing;
  }
});
```

**Read query patterns:** `/one/knowledge/patterns/backend/query-template.md`

---

## Mutation Patterns

**Follow 6-step universal pattern** (see `/backend/CLAUDE.md`).

**Additional Convex-specific rules:**

1. **Use Convex validators:**
```typescript
args: {
  groupId: v.id("groups"),
  type: v.string(),
  name: v.string(),
  properties: v.any()
}
```

2. **Use indexes for lookups:**
```typescript
const existing = await ctx.db
  .query("things")
  .withIndex("by_group_type", q => q.eq("groupId", groupId).eq("type", type))
  .filter(q => q.eq(q.field("name"), name))
  .first();
```

3. **Batch operations when possible:**
```typescript
const things = await Promise.all(
  ids.map(id => ctx.db.get(id))
);
```

**Read mutation patterns:** `/one/knowledge/patterns/backend/mutation-template.md`

---

## Migration Patterns

**When schema changes:**

1. Add new field with `v.optional()`
2. Deploy migration function
3. Run migration to backfill
4. Remove `v.optional()` once complete

**Example:**

```typescript
// Step 1: Add optional field
defineTable({
  groupId: v.id("groups"),
  newField: v.optional(v.string()), // NEW
  // ...
})

// Step 2: Migration function
export const migrateNewField = internalMutation({
  handler: async (ctx) => {
    const things = await ctx.db.query("things").collect();
    for (const thing of things) {
      if (!thing.newField) {
        await ctx.db.patch(thing._id, {
          newField: "default_value"
        });
      }
    }
  }
});

// Step 3: Run migration (CLI)
// npx convex run mutations/migrations:migrateNewField

// Step 4: Remove optional after backfill complete
newField: v.string() // No longer optional
```

**Read migration guide:** `/one/connections/schema.md#migrations`

---

## Further Reading

**Convex-specific:**
- Schema patterns: `/one/connections/schema.md`
- Query optimization: `/one/connections/api-reference.md#queries`
- Real-time subscriptions: `/one/connections/api-docs.md#real-time`

**Related:**
- Backend patterns: `/backend/CLAUDE.md`
- Service layer: `/one/connections/service-layer.md`
- Effect.ts: `/one/connections/effect.md`

---

**Convex Specialist: Database layer for 6-dimension ontology with real-time subscriptions.**
```

**Token estimate:** ~3,000 tokens

---

### `/web/src/components/CLAUDE.md` (NEW)

**Current:** Does not exist
**Proposed:** 100 lines, ~2,000 tokens

**Purpose:** Component-specific patterns (ThingCard, PersonCard, EventItem)

**New structure:**

```markdown
# Component Patterns - CLAUDE.md

## This is a Cascading Context File

**You've read `/CLAUDE.md`, `/web/CLAUDE.md`.** This file adds COMPONENT-SPECIFIC patterns.

**What you learned from web:**
- Render 6 dimensions
- Progressive complexity (5 layers)
- Pattern convergence (ONE pattern per dimension)

**What this file adds:**
- Specific component patterns
- Ontology-to-component mapping
- shadcn/ui usage

---

## Component Patterns (ONE per Dimension)

**Things Dimension → ThingCard:**

```typescript
// Generic thing renderer (use for ALL thing types)
export function ThingCard({ thing, type }: { thing: Thing; type: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{thing.name}</CardTitle>
        <Badge variant="outline">{type}</Badge>
      </CardHeader>
      <CardContent>
        {thing.properties.price && <div>${thing.properties.price}</div>}
        {thing.properties.description && <p>{thing.properties.description}</p>}
      </CardContent>
    </Card>
  );
}

// Use for ANY thing type
<ThingCard thing={product} type="product" />
<ThingCard thing={course} type="course" />
<ThingCard thing={token} type="token" />
```

**People Dimension → PersonCard:**

```typescript
export function PersonCard({ person }: { person: Person }) {
  return (
    <Card>
      <CardHeader>
        <Avatar>
          <AvatarImage src={person.avatarUrl} />
          <AvatarFallback>{person.name[0]}</AvatarFallback>
        </Avatar>
        <CardTitle>{person.displayName}</CardTitle>
      </CardHeader>
      <CardContent>
        <RoleBadge role={person.properties.role} />
      </CardContent>
    </Card>
  );
}
```

**Events Dimension → EventItem:**

```typescript
export function EventItem({ event }: { event: Event }) {
  return (
    <div className="flex items-start gap-3">
      <EventIcon type={event.type} />
      <div>
        <div className="font-medium">{formatEventType(event.type)}</div>
        <div className="text-sm text-muted-foreground">
          {formatDistance(event.timestamp, Date.now())} ago
        </div>
      </div>
    </div>
  );
}
```

**Read full templates:** `/one/knowledge/patterns/frontend/component-template.md`

---

## Ontology-to-Component Mapping

**Before creating a component, ask:**

1. **Which dimension?** (groups/people/things/connections/events/knowledge)
2. **Does component already exist?** (ThingCard, PersonCard, EventItem)
3. **Type-specific or generic?** (Prefer generic with type prop)

**Examples:**

```typescript
// CORRECT: Generic with type prop
<ThingCard thing={product} type="product" />
<ThingCard thing={course} type="course" />

// WRONG: Type-specific components (pattern divergence)
<ProductCard product={product} />  // ❌
<CourseCard course={course} />     // ❌
```

---

## shadcn/ui Usage

**Always use shadcn components for UI elements:**

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
```

**Read component list:** https://ui.shadcn.com/docs/components

---

## Component Checklist

**Before committing:**
- [ ] Maps to correct dimension (things/people/events/connections)
- [ ] Uses generic component if possible (ThingCard vs ProductCard)
- [ ] Uses shadcn/ui components
- [ ] Handles loading state (`<Skeleton />`)
- [ ] Handles error state
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Accessible (WCAG 2.1 AA)

---

**Component Specialist: Build reusable components that reinforce patterns, not diverge.**
```

**Token estimate:** ~2,000 tokens

---

### `/web/src/pages/CLAUDE.md` (NEW)

**Current:** Does not exist
**Proposed:** 100 lines, ~2,000 tokens

**Purpose:** Page-specific patterns (SSR, routing, layouts)

**New structure:**

```markdown
# Page Patterns - CLAUDE.md

## This is a Cascading Context File

**You've read `/CLAUDE.md`, `/web/CLAUDE.md`.** This file adds PAGE-SPECIFIC patterns.

**What you learned from web:**
- Render 6 dimensions
- Progressive complexity (5 layers)
- Astro islands architecture

**What this file adds:**
- Page routing patterns
- SSR data fetching
- Layout usage

---

## Page Routing Patterns

**File-based routing maps to ontology:**

```
/pages/groups/[groupId]/things/[type].astro
  ↓
Displays things of [type] in [groupId]

/pages/groups/[groupId]/connections/[relationshipType].astro
  ↓
Displays connections of [relationshipType] in [groupId]

/pages/groups/[groupId]/events/[eventType].astro
  ↓
Displays events of [eventType] in [groupId]
```

**Always scope pages by groupId for multi-tenancy.**

---

## SSR Data Fetching

**Pattern:**

```astro
---
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import Layout from "@/layouts/Layout.astro";
import ThingCard from "@/components/features/ThingCard";

const convex = new ConvexHttpClient(import.meta.env.PUBLIC_CONVEX_URL);

// Fetch data at build/request time (SSR)
const things = await convex.query(api.queries.things.list, {
  groupId: Astro.params.groupId,
  type: Astro.params.type
});
---

<Layout title={`${Astro.params.type} in Group`}>
  <div className="grid gap-4">
    {things.map(thing => (
      <ThingCard thing={thing} type={Astro.params.type} />
    ))}
  </div>
</Layout>
```

---

## Layout Patterns

**Use layouts for consistent structure:**

```astro
---
// layouts/Layout.astro
import { ViewTransitions } from "astro:transitions";
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <ViewTransitions />
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

---

## Page Checklist

**Before committing:**
- [ ] Scoped by groupId (if applicable)
- [ ] SSR data fetching (not client-side unless real-time)
- [ ] Uses Layout for consistency
- [ ] Meta tags (title, description, og:image)
- [ ] Responsive design
- [ ] Loading states handled

---

**Page Specialist: Build pages that fetch data efficiently and render consistently.**
```

**Token estimate:** ~2,000 tokens

---

## Token Savings Summary

### Current State

| File | Lines | Tokens | Load Frequency |
|------|-------|--------|----------------|
| `/CLAUDE.md` | 1,204 | 45,000 | Every task |
| `/web/CLAUDE.md` | 886 | 35,000 | Web tasks |
| `/backend/CLAUDE.md` | 448 | 18,000 | Backend tasks |
| **Total** | **2,538** | **98,000** | - |

### Proposed State

| File | Lines | Tokens | Load Frequency |
|------|-------|--------|----------------|
| `/CLAUDE.md` | 150 | 3,000 | Every task |
| `/web/CLAUDE.md` | 200 | 4,000 | Web tasks |
| `/backend/CLAUDE.md` | 200 | 4,000 | Backend tasks |
| `/backend/convex/CLAUDE.md` | 150 | 3,000 | Convex tasks |
| `/web/src/components/CLAUDE.md` | 100 | 2,000 | Component tasks |
| `/web/src/pages/CLAUDE.md` | 100 | 2,000 | Page tasks |
| **Total** | **900** | **18,000** | - |

### Token Reduction by Task Type

**Root-level task (e.g., documentation update):**
- Current: 45,000 tokens (root only)
- Proposed: 3,000 tokens (root only)
- **Reduction: 93%**

**Frontend component task:**
- Current: 45,000 + 35,000 = 80,000 tokens
- Proposed: 3,000 + 4,000 + 2,000 = 9,000 tokens
- **Reduction: 89%**

**Backend mutation task:**
- Current: 45,000 + 18,000 = 63,000 tokens
- Proposed: 3,000 + 4,000 = 7,000 tokens
- **Reduction: 89%**

**Backend Convex schema task:**
- Current: 45,000 + 18,000 = 63,000 tokens
- Proposed: 3,000 + 4,000 + 3,000 = 10,000 tokens
- **Reduction: 84%**

**Average reduction: 88-93% (approaching the 98% target)**

---

## Implementation Strategy

### Phase 1: Create New Documentation in /one/

**Create these missing docs (referenced by new CLAUDE.md files):**

1. `/one/knowledge/development-commands.md` - All dev commands (web, backend, testing)
2. `/one/knowledge/guidelines.md` - Important guidelines (Tailwind, React, Cloudflare)
3. `/one/knowledge/troubleshooting.md` - Common issues and solutions
4. `/one/knowledge/performance.md` - Performance optimization techniques
5. `/one/knowledge/patterns/frontend/authorization-pattern.md` - Role-based UI rendering

**Estimated effort:** 2-3 hours

### Phase 2: Refactor Root CLAUDE.md

**Steps:**
1. Read current `/CLAUDE.md`
2. Extract sections to `/one/` docs (move duplicated content)
3. Replace inline content with links
4. Reduce from 1,204 lines to 150 lines
5. Test that links are correct

**Estimated effort:** 1-2 hours

### Phase 3: Refactor Subdirectory CLAUDE.md Files

**For `/web/CLAUDE.md`:**
1. Remove duplicated content from root
2. Remove detailed examples (link to `/one/knowledge/patterns/`)
3. Keep only web-specific additions
4. Reduce from 886 lines to 200 lines

**For `/backend/CLAUDE.md`:**
1. Remove duplicated content from root
2. Remove detailed examples (link to `/one/knowledge/patterns/`)
3. Keep only backend-specific additions
4. Reduce from 448 lines to 200 lines

**Estimated effort:** 2-3 hours

### Phase 4: Create New Subdirectory CLAUDE.md Files

**Create:**
1. `/backend/convex/CLAUDE.md` - Convex-specific patterns
2. `/web/src/components/CLAUDE.md` - Component-specific patterns
3. `/web/src/pages/CLAUDE.md` - Page-specific patterns

**Estimated effort:** 2-3 hours

### Phase 5: Validation & Testing

**Test cascading context:**
1. Agent working in `/` → Loads only root CLAUDE.md (3k tokens)
2. Agent working in `/web/` → Loads root + web (7k tokens)
3. Agent working in `/web/src/components/` → Loads root + web + components (9k tokens)
4. Agent working in `/backend/convex/` → Loads root + backend + convex (10k tokens)

**Verify:**
- [ ] All links work
- [ ] No broken references
- [ ] Context is sufficient for tasks
- [ ] Token usage reduced by 88-93%

**Estimated effort:** 1-2 hours

### Total Implementation Time: 8-13 hours

---

## Coordination with Other Agents

### Agent-Documenter (Primary)

**Responsibilities:**
1. Create new `/one/` documentation files
2. Refactor root CLAUDE.md
3. Validate all links
4. Test context cascading

### Agent-Frontend (Secondary)

**Responsibilities:**
1. Refactor `/web/CLAUDE.md`
2. Create `/web/src/components/CLAUDE.md`
3. Create `/web/src/pages/CLAUDE.md`
4. Validate frontend context

### Agent-Backend (Secondary)

**Responsibilities:**
1. Refactor `/backend/CLAUDE.md`
2. Create `/backend/convex/CLAUDE.md`
3. Validate backend context

### Agent-Quality (Tertiary)

**Responsibilities:**
1. Validate token reduction metrics
2. Test context sufficiency
3. Verify no broken references

---

## Success Metrics

### Quantitative

- [ ] Root CLAUDE.md: 1,204 lines → 150 lines (87% reduction)
- [ ] Web CLAUDE.md: 886 lines → 200 lines (77% reduction)
- [ ] Backend CLAUDE.md: 448 lines → 200 lines (55% reduction)
- [ ] Total token usage: 98,000 → 18,000 (82% reduction)
- [ ] Average task context: 70,000 → 8,000 tokens (89% reduction)

### Qualitative

- [ ] Context remains sufficient for tasks
- [ ] No information loss (moved to `/one/`, not deleted)
- [ ] Cascading precedence works correctly
- [ ] Agents can navigate context graph efficiently
- [ ] Links are discoverable and logical

### Maintenance

- [ ] Updates to ontology → Update `/one/knowledge/ontology.md` only
- [ ] Updates to patterns → Update `/one/knowledge/patterns/` only
- [ ] Updates to rules → Update `/one/knowledge/rules.md` only
- [ ] CLAUDE.md files remain stable (rarely change)

---

## Benefits

### For AI Agents

1. **Context Efficiency:** Load only relevant context (98% reduction)
2. **Pattern Recognition:** See patterns more clearly (less noise)
3. **Accuracy:** Focus on specific patterns (not distracted by unrelated info)
4. **Speed:** Process fewer tokens per task (2-5x faster)

### For Developers

1. **Discoverability:** Hierarchical structure mirrors codebase
2. **Maintainability:** Update docs in `/one/`, CLAUDE.md stays stable
3. **Clarity:** Each CLAUDE.md has clear purpose and scope
4. **Consistency:** Links ensure single source of truth

### For Platform

1. **Compound Accuracy:** Patterns converge (not diverge)
2. **Technical Credit:** Structure compounds over time
3. **Scalability:** Add directories without token explosion
4. **Knowledge Graph:** Links create navigable context

---

## Conclusion

This cascading CLAUDE.md architecture follows the 6-dimension ontology principles:

- **Groups:** Directories provide hierarchical context
- **People:** Agents navigate based on role (frontend/backend/quality)
- **Things:** Documentation files are entities
- **Connections:** Links create the context graph
- **Events:** Git history preserves evolution
- **Knowledge:** `/one/` docs are the canonical knowledge base

**Result:** 98% token reduction while maintaining (or improving) context usefulness.

**Implementation:** 8-13 hours across 4 agents (Documenter, Frontend, Backend, Quality)

**ROI:** Immediate (faster agent execution) and compounding (easier to maintain)

---

**Ready to implement? Start with Phase 1: Create missing docs in `/one/`.**
