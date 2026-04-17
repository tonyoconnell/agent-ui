---
title: Ontology Frontend Master
dimension: knowledge
category: ontology-frontend-master.md
tags: 6-dimensions, architecture, backend, frontend, ontology, ui
related_dimensions: events, groups, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the ontology-frontend-master.md category.
  Location: one/knowledge/ontology-frontend-master.md
  Purpose: Documents frontend development ontology - master reference
  Related dimensions: events, groups, things
  For AI agents: Read this to understand ontology frontend master.
---

# Frontend Development Ontology - Master Reference

**Version:** 2.1.0
**Type System:** Formal ontology for backend-agnostic Astro website development
**Paradigm:** Pure declarative type theory + Provider pattern + Context engineering

**Master Document:** Unified reference combining architecture, specifications, and patterns

---

## Table of Contents

1. [Overview](#overview)
2. [Core Axioms](#core-axioms)
3. [Architecture Overview](#architecture-overview)
4. [Provider Pattern & Context Engineering](#provider-pattern--context-engineering)
5. [Type Hierarchy](#type-hierarchy)
6. [What Frontend IS and IS NOT](#what-frontend-is-and-is-not)
7. [Frontend File Structure](#frontend-file-structure)
8. [Backend-Agnostic Data Layer](#backend-agnostic-data-layer)
9. [DataProvider Interface](#dataprovider-interface)
10. [Provider Implementations](#provider-implementations)
11. [Configuration](#configuration)
12. [State Management Hierarchy](#state-management-hierarchy)
13. [Effect.ts Service Layer](#effectts-service-layer)
14. [React Hooks & Integration](#react-hooks--integration)
15. [Component Patterns](#component-patterns)
16. [Page Patterns & SSR](#page-patterns--ssr)
17. [Real-Time Components](#real-time-components)
18. [Forms & Data Mutations](#forms--data-mutations)
19. [Multi-Tenant Routing](#multi-tenant-routing)
20. [Caching Ontology](#caching-ontology)
21. [Error Propagation & Handling](#error-propagation--handling)
22. [Testing Patterns](#testing-patterns)
23. [Common Mistakes & Solutions](#common-mistakes--solutions)
24. [Summary & Key Patterns](#summary--key-patterns)

---

## Overview

The frontend is **purely a rendering and interaction layer**. It has:

- ✅ ZERO database access (provider abstracts)
- ✅ ZERO business logic (backend validates)
- ✅ ZERO direct backend coupling (interface-based)
- ✅ 100% backend-agnostic code

**What Frontend Does:**

1. **Renders UI** from data via Astro + React
2. **Calls backend APIs** via abstract DataProvider interface (works with Convex, WordPress, Notion, Supabase, etc.)
3. **Manages local UI state** (loading, errors, forms, modals)
4. **Displays real-time updates** via subscriptions (if backend supports)

**Backend Abstraction:**

```
┌─────────────────────────────────────────┐
│   FRONTEND (Astro + React + Effect.ts)  │
│  ✅ Renders UI                           │
│  ✅ Calls DataProvider interface        │
│  ✅ Manages UI state only               │
│  ❌ NO database, logic, validation      │
└──────────────────┬──────────────────────┘
                   │ DataProvider Interface
                   │ (6-dimension ontology)
                   ↓
┌─────────────────────────────────────────┐
│     BACKEND PROVIDERS (Choose One)      │
│  ├─ ConvexProvider                      │
│  ├─ WordPressProvider                   │
│  ├─ NotionProvider                      │
│  ├─ SupabaseProvider                    │
│  └─ CustomProvider                      │
└─────────────────────────────────────────┘
```

**Key Insight:** The 6-dimension ontology becomes a **universal data API**. Frontend doesn't care if data comes from Convex, WordPress, or Notion—it only knows the interface.

---

## Core Axioms

### Axiom 1: Everything is a Thing

```
∀x ∈ Frontend → x : Thing
Thing ::= Page | Component | Content | Service | Provider | Configuration
```

### Axiom 2: All Things Have Type

```
type : Thing → TypeID
TypeID ::= String ∈ ontology.things.types
```

### Axiom 3: Things Connect

```
connect : Thing × Thing → Connection
Connection ::= { from: Thing, to: Thing, type: RelationType, metadata: Object }
```

### Axiom 4: Actions Emit Events

```
action : Thing → Event
Event ::= { type: EventType, actor: Thing, target: Thing, timestamp: Time, metadata: Object }
```

### Axiom 5: Patterns Compose

```
compose : Pattern × Pattern → Pattern
Pattern ::= { type: PatternType, inputs: [Thing], outputs: [Thing], transform: Function }
```

### Axiom 6: Backend Agnosticism

```
∀Provider. Provider implements DataProviderInterface → Frontend works with Provider
DataProviderInterface ::= { organizations, people, things, connections, events, knowledge }
```

### Axiom 7: Context Minimalism

```
∀Operation. Load only required types, not implementations
ContextUsed << ContextAvailable
target_reduction: 98%+
```

**Key Principle:** Frontend knows 6-dimension ontology, not backend implementation.

---

## Architecture Overview

### Three-Layer Backend-Agnostic Architecture

```
┌──────────────────────────────────────┐
│  RENDERING LAYER (Astro + React)     │
│  - SSR pages (.astro files)          │
│  - Interactive components (.tsx)     │
│  - Astro islands for interactivity   │
└──────────────────┬───────────────────┘
                   │ Effect.ts
                   ↓
┌──────────────────────────────────────┐
│  SERVICE LAYER (Effect.ts)            │
│  - ThingService                      │
│  - ConnectionService                 │
│  - Type-safe error handling          │
│  - Composable operations             │
└──────────────────┬───────────────────┘
                   │ DataProviderInterface
                   ↓
┌──────────────────────────────────────┐
│  DATA LAYER (Providers)               │
│  - ConvexProvider (Convex backend)   │
│  - WordPressProvider (WordPress)     │
│  - NotionProvider (Notion)           │
│  - SupabaseProvider (PostgreSQL)     │
│  - CustomProvider (Any API)          │
└──────────────────────────────────────┘
```

**Why Three Layers?**

- **Rendering Layer:** HTML output (SSR fast, SEO friendly)
- **Service Layer:** Type-safe business operations (Effect.ts)
- **Data Layer:** Backend abstraction (swap backends by changing 1 config line)

**Tech Stack:**

- **Astro 5.14+** - SSR/SSG with file-based routing
- **React 19** - Interactive components with islands architecture
- **Effect.ts** - Type-safe, composable operations
- **DataProvider Pattern** - Backend-agnostic interface
- **Tailwind + shadcn/ui** - Component styling
- **TypeScript 5.9+** - Strict type safety

---

## Provider Pattern & Context Engineering

### The Core Insight: Providers ARE Context Loaders

**Problem:** Traditional frontend development loads massive context to interact with one backend.

**Solution:** Provider pattern = 99.9% context reduction through interface abstraction.

```typescript
{
  // ❌ Traditional: Load entire backend
  traditionalApproach: {
    load: "Full Convex schema + all implementations + all docs",
    tokens: 280_000,
    problem: "Frontend context explodes with backend knowledge"
  }

  // ✅ Provider pattern: Load only interface
  providerApproach: {
    load: "DataProviderInterface only (contract)",
    tokens: 300,
    benefit: "Frontend never loads backend implementation"
  }

  result: {
    context_reduction: "99.9%",
    backend_flexibility: "infinite (swap with config)",
    type_safety: "Effect.ts typed errors",
    testability: "Mock provider for tests"
  }
}
```

### Context Engineering Formula

```typescript
{
  traditional: {
    formula: "ContextSize = Σ(all_files + all_docs + all_examples)",
    typical: "50k-300k tokens per request",
    problem: "Hits context limits, slow, expensive"
  }

  provider: {
    formula: "ContextSize = interface_definition + operation_signatures",
    typical: "300-500 tokens per request",
    benefit: "Never hits limits, fast, cheap, infinite backends"
  }

  improvement: {
    context_reduction: "99%+",
    cost_reduction: "100x cheaper",
    speed_improvement: "10x faster",
    backend_flexibility: "∞ backends supported"
  }
}
```

### Provider as Just-In-Time Loader

**Traditional AI code generation:**
```typescript
❌ function generateCourseComponent_Traditional() {
  context = {
    convexSchema: loadConvexSchema(),        // 15,000 tokens
    convexMutations: loadMutations(),        // 20,000 tokens
    convexQueries: loadQueries(),            // 18,000 tokens
    implementations: loadImplementations()    // 50,000 tokens
  } // Total: 103,000 tokens

  return ai.generate(task, context)
}
```

**Provider pattern:**
```typescript
✅ function generateCourseComponent_Provider() {
  context = {
    interface: "DataProviderInterface",      // 300 tokens
    operations: ["things.get", "things.list"] // Which operations needed
  } // Total: 300 tokens (99.7% reduction)

  // AI generates code using interface
  code = ai.generate(task, context)
  // Result: provider.things.get(id) - works with ANY backend
  return code
}
```

---

## Type Hierarchy

### The Complete Frontend Type System

```
Thing
├── Artifact          // Code artifacts (what agents create)
│   ├── Page
│   │   ├── LandingPage
│   │   ├── BlogIndex
│   │   ├── BlogPost
│   │   ├── AppPage
│   │   ├── AccountPage
│   │   └── APIRoute
│   ├── Component
│   │   ├── UIComponent
│   │   ├── FeatureComponent
│   │   ├── Layout
│   │   └── Island
│   ├── Content
│   │   ├── Collection
│   │   ├── Entry
│   │   └── Schema
│   ├── Service
│   │   ├── GenericService       // Handles all 66 types
│   │   └── SpecializedService   // Optional convenience
│   ├── Provider
│   │   ├── ConvexProvider
│   │   ├── WordPressProvider
│   │   ├── NotionProvider
│   │   ├── SupabaseProvider
│   │   └── CustomProvider
│   └── Configuration
│       ├── DisplayConfig        // UI labels, icons, colors
│       └── ProviderConfig       // Backend URL, API keys
├── Pattern           // Reusable templates
├── Interface         // Abstract contracts
└── Capability        // Agent capabilities
```

---

## What Frontend IS and IS NOT

### ✅ Frontend IS Responsible For

**1. Rendering**
```tsx
// Display data from backend
<h1>{course.name}</h1>
<p>{course.properties.description}</p>
```

**2. Calling Backend APIs**
```tsx
// Get data from backend
const courses = useQuery(api.queries.things.list, { type: 'course' })

// Send data to backend
const create = useMutation(api.mutations.things.create)
await create({ type: 'course', name: 'Fitness 101', properties: {...} })
```

**3. Managing UI State**
```tsx
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
const [formData, setFormData] = useState({})
```

**4. User Interactions**
```tsx
<button onClick={handleClick}>Create Course</button>
<input onChange={handleChange} />
```

**5. Client-Side Routing**
```tsx
<Link href="/courses">View Courses</Link>
```

**6. Component-Local UI Logic**
```typescript
type FrontendResponsibility =
  | { type: "render"; data: any }                 // Display UI from data
  | { type: "call_provider"; operation: any }     // Call DataProvider (not direct backend)
  | { type: "manage_ui_state"; state: any }       // Form inputs, modals, loading
  | { type: "route"; path: string }               // Client-side navigation
  | { type: "cache_display"; data: any };         // Cache UI data (not business data)
```

### ❌ Frontend IS NOT Responsible For

**1. Database Operations**
```tsx
// ❌ NEVER do this in frontend
const courses = await db.query('things').filter(...).collect()
```

**2. Business Logic**
```tsx
// ❌ NEVER do this in frontend
if (user.tokens < course.price) {
  // Calculate discount, check quotas, etc.
}
```

**3. Data Validation**
```tsx
// ❌ NEVER trust frontend validation alone (UX hint only, backend MUST validate)
if (formData.email.includes('@')) {
  // Backend MUST validate, not frontend
}
```

**4. Event Logging**
```tsx
// ❌ NEVER log events in frontend
await db.insert('events', { type: 'course_created', ... })
```

**5. Authorization**
```tsx
// ❌ NEVER check permissions in frontend alone (UI hint only, backend MUST authorize)
if (user.role === 'admin') {
  // Backend MUST authorize, frontend only for UI hints
}
```

**6. Backend-Specific Code**
```typescript
type FrontendProhibition =
  | { type: "database_access" }
  | { type: "business_logic" }
  | { type: "event_logging" }
  | { type: "authorization_enforcement" }
  | { type: "data_validation_enforcement" }
  | { type: "org_filtering" }
  | { type: "backend_specific_code" };
```

---

## Frontend File Structure

```
frontend/                                  # Frontend repo (separate from backend)
├── src/
│   ├── pages/                            # Astro pages (SSR/SSG)
│   │   ├── index.astro                   # Homepage
│   │   ├── courses/
│   │   │   ├── index.astro               # Course list (SSR)
│   │   │   └── [id].astro                # Course detail (SSR)
│   │   └── [thingType]/                  # Dynamic routes
│   │       ├── index.astro               # Generic list page
│   │       └── [id].astro                # Generic detail page
│   ├── components/                       # React components
│   │   ├── cards/
│   │   │   └── ThingCard.tsx             # Generic card (adapts to any type)
│   │   ├── lists/
│   │   │   └── ThingList.tsx             # Generic list
│   │   ├── forms/
│   │   │   └── ThingForm.tsx             # Generic form (calls backend)
│   │   └── ui/                           # shadcn/ui components
│   ├── services/                         # Effect.ts client services
│   │   ├── ConvexHttpClient.ts           # Convex client wrapper (required)
│   │   ├── ThingClientService.ts         # Thing operations (required)
│   │   ├── ConnectionClientService.ts    # Connection operations (required)
│   │   ├── ClientLayer.ts                # Dependency injection layer (required)
│   │   └── CourseClientService.ts        # OPTIONAL: Convenience
│   ├── hooks/                            # React hooks
│   │   └── useEffectRunner.ts            # Run Effect programs in React
│   ├── layouts/
│   │   └── Layout.astro                  # Main layout
│   ├── ontology/                         # Display config ONLY
│   │   ├── types.ts                      # Type definitions (synced from backend)
│   │   └── config.ts                     # UI display config (colors, icons, labels)
│   ├── providers/                        # Backend provider implementations
│   │   ├── DataProvider.ts               # Interface definition
│   │   ├── convex/
│   │   │   └── ConvexProvider.ts
│   │   ├── wordpress/
│   │   │   └── WordPressProvider.ts
│   │   ├── notion/
│   │   │   └── NotionProvider.ts
│   │   └── supabase/
│   │       └── SupabaseProvider.ts
│   ├── lib/
│   │   └── convex.ts                     # Backend client setup
│   ├── middleware.ts                     # Multi-tenant routing
│   └── styles/                           # Tailwind + CSS
├── .env.local
│   PUBLIC_CONVEX_URL=https://backend.convex.cloud
└── package.json
```

**Key Point:** Frontend has NO `convex/` directory. Backend-specific code lives in provider implementations only.

---

## Backend-Agnostic Data Layer

**Inspired by Astro's Content Layer Pattern**

Astro elegantly abstracts content sources via a universal interface. ONE applies this pattern to **data operations**:

```typescript
// frontend/astro.config.ts
import { defineConfig } from 'astro/config'
import { convexProvider } from './src/providers/convex'
// import { wordpressProvider } from './src/providers/wordpress'
// import { notionProvider } from './src/providers/notion'

export default defineConfig({
  integrations: [
    one({
      // ✅ Change this ONE line to swap backends
      provider: convexProvider({
        url: import.meta.env.PUBLIC_BACKEND_URL
      })

      // Or use WordPress:
      // provider: wordpressProvider({
      //   url: 'https://yoursite.com',
      //   apiKey: import.meta.env.WORDPRESS_API_KEY
      // })

      // Or use Notion:
      // provider: notionProvider({
      //   apiKey: import.meta.env.NOTION_API_KEY,
      //   databaseId: import.meta.env.NOTION_DB_ID
      // })
    })
  ]
})
```

**Key Principle:** Frontend components never know which backend they're talking to. The provider interface is the universal contract.

---

## DataProvider Interface

**The universal ontology API that all backends must implement.**

```typescript
// Error types (universal across all providers)
export class ThingNotFoundError {
  readonly _tag = 'ThingNotFoundError'
  constructor(readonly thingId: string) {}
}

export class ConnectionCreateError {
  readonly _tag = 'ConnectionCreateError'
  constructor(readonly reason: string) {}
}

export class UnauthorizedError {
  readonly _tag = 'UnauthorizedError'
}

export class GroupNotFoundError {
  readonly _tag = 'GroupNotFoundError'
  constructor(readonly groupId: string) {}
}

export class PersonNotFoundError {
  readonly _tag = 'PersonNotFoundError'
  constructor(readonly personId: string) {}
}

export class PersonCreateError {
  readonly _tag = 'PersonCreateError'
  constructor(readonly reason: string) {}
}

// Type definitions for 6 dimensions
export interface Group {
  _id: string
  slug: string
  name: string
  type: 'friend_circle' | 'business' | 'community' | 'dao' | 'government' | 'organization'
  parentGroupId?: string
  description?: string
  status: 'active' | 'archived'
  settings: {
    visibility: 'public' | 'private'
    joinPolicy: 'open' | 'invite_only' | 'approval_required'
    plan?: 'starter' | 'pro' | 'enterprise'
  }
  createdAt: number
  updatedAt: number
}

export interface Person {
  _id: string
  email: string
  username: string
  displayName: string
  emailVerified: boolean
  role: 'platform_owner' | 'group_owner' | 'group_user' | 'customer'
  groupId?: string
  groups: string[]
  permissions?: string[]
  image?: string
  bio?: string
  createdAt: number
  updatedAt: number
}

export interface Thing {
  _id: string
  type: ThingType
  name: string
  groupId?: string
  properties: Record<string, any>
  status: 'draft' | 'active' | 'archived'
  createdAt: number
  updatedAt: number
}

// DataProvider interface (every backend must implement this)
export interface DataProvider {
  // Dimension 1: Groups operations
  groups: {
    get: (id: string) => Effect.Effect<Group, GroupNotFoundError>
    list: (params: {
      status?: 'active' | 'archived'
      limit?: number
    }) => Effect.Effect<Group[], Error>
    update: (id: string, updates: Partial<Group>) => Effect.Effect<void, Error>
  }

  // Dimension 2: People operations
  people: {
    get: (id: string) => Effect.Effect<Person, PersonNotFoundError | UnauthorizedError>
    list: (params: {
      groupId?: string
      role?: 'platform_owner' | 'group_owner' | 'group_user' | 'customer'
      filters?: Record<string, any>
      limit?: number
    }) => Effect.Effect<Person[], Error>
    create: (input: {
      email: string
      displayName: string
      role: 'platform_owner' | 'group_owner' | 'group_user' | 'customer'
      groupId: string
      password?: string
    }) => Effect.Effect<string, PersonCreateError>
    update: (id: string, updates: Partial<Person>) => Effect.Effect<void, Error>
    delete: (id: string) => Effect.Effect<void, Error>
  }

  // Dimension 3: Things operations
  things: {
    get: (id: string) => Effect.Effect<Thing, ThingNotFoundError | UnauthorizedError>
    list: (params: {
      type: ThingType
      groupId?: string
      filters?: Record<string, any>
      limit?: number
    }) => Effect.Effect<Thing[], Error>
    create: (input: {
      type: ThingType
      name: string
      groupId: string
      properties: Record<string, any>
    }) => Effect.Effect<string, ThingCreateError>
    update: (id: string, updates: Partial<Thing>) => Effect.Effect<void, Error>
    delete: (id: string) => Effect.Effect<void, Error>
  }

  // Dimension 4: Connections operations
  connections: {
    create: (input: {
      fromThingId: string
      toThingId: string
      relationshipType: ConnectionType
      metadata?: Record<string, any>
    }) => Effect.Effect<string, ConnectionCreateError>
    getRelated: (params: {
      thingId: string
      relationshipType: ConnectionType
      direction: 'from' | 'to' | 'both'
    }) => Effect.Effect<Thing[], Error>
    getCount: (thingId: string, relationshipType: ConnectionType) => Effect.Effect<number, Error>
    delete: (id: string) => Effect.Effect<void, Error>
  }

  // Dimension 5: Events operations
  events: {
    log: (event: {
      type: EventType
      actorId: string
      targetId?: string
      groupId: string
      metadata?: Record<string, any>
    }) => Effect.Effect<void, Error>
    query: (params: {
      type?: EventType
      actorId?: string
      targetId?: string
      groupId?: string
      from?: Date
      to?: Date
    }) => Effect.Effect<Event[], Error>
  }

  // Dimension 6: Knowledge operations
  knowledge: {
    embed: (params: {
      text: string
      sourceThingId?: string
      sourcePersonId?: string
      groupId: string
      labels?: string[]
    }) => Effect.Effect<string, Error>
    search: (params: {
      query: string
      groupId?: string
      limit?: number
    }) => Effect.Effect<KnowledgeMatch[], Error>
  }

  // Optional: Real-time subscriptions
  subscriptions?: {
    watchThing: (id: string) => Effect.Effect<Observable<Thing>, Error>
    watchList: (type: ThingType, groupId?: string) => Effect.Effect<Observable<Thing[]>, Error>
  }
}
```

**Provider Algebra:**

```typescript
// Provider composition
implement : Backend × DataProviderInterface → Provider

// Examples:
ConvexProvider = implement(ConvexBackend, DataProviderInterface)
WordPressProvider = implement(WordPressBackend, DataProviderInterface)
NotionProvider = implement(NotionBackend, DataProviderInterface)

// Swapping backends (change ONE line in config)
config.provider = ConvexProvider({ url: "..." })
// OR
config.provider = WordPressProvider({ url: "...", apiKey: "..." })
// OR
config.provider = NotionProvider({ apiKey: "...", databaseId: "..." })

// Result: Frontend components don't change
```

---

## Provider Implementations

### Convex Provider

```typescript
// frontend/src/providers/convex/ConvexProvider.ts
import { Effect, Layer } from 'effect'
import { ConvexHttpClient } from 'convex/browser'
import { DataProvider } from '../DataProvider'
import { api } from './api'

export class ConvexProvider implements DataProvider {
  constructor(private client: ConvexHttpClient) {}

  things = {
    get: (id: string) =>
      Effect.gen(function* () {
        const thing = yield* Effect.tryPromise({
          try: () => this.client.query(api.queries.things.get, { id }),
          catch: (error) => new Error(String(error))
        })

        if (!thing) {
          return yield* Effect.fail(new ThingNotFoundError(id))
        }

        return thing
      }),

    list: (params) =>
      Effect.tryPromise({
        try: () => this.client.query(api.queries.things.list, params),
        catch: (error) => new Error(String(error))
      }),

    create: (input) =>
      Effect.tryPromise({
        try: () => this.client.mutation(api.mutations.things.create, input),
        catch: (error) => new Error(String(error))
      }),

    update: (id, updates) =>
      Effect.tryPromise({
        try: () => this.client.mutation(api.mutations.things.update, { id, updates }),
        catch: (error) => new Error(String(error))
      }),

    delete: (id) =>
      Effect.tryPromise({
        try: () => this.client.mutation(api.mutations.things.delete, { id }),
        catch: (error) => new Error(String(error))
      })
  }

  connections = { /* Similar implementation for connections... */ }
  events = { /* Similar implementation for events... */ }
  knowledge = { /* Similar implementation for knowledge... */ }
}

// Factory function
export function convexProvider(config: { url: string }) {
  return Layer.succeed(
    DataProvider,
    new ConvexProvider(new ConvexHttpClient(config.url))
  )
}
```

### WordPress Provider

```typescript
// frontend/src/providers/wordpress/WordPressProvider.ts
import { Effect, Layer } from 'effect'
import { DataProvider } from '../DataProvider'

export class WordPressProvider implements DataProvider {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {}

  things = {
    get: (id: string) =>
      Effect.gen(function* () {
        // Map ONE ontology → WordPress REST API
        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(`${this.baseUrl}/wp-json/wp/v2/posts/${id}`, {
              headers: { Authorization: `Bearer ${this.apiKey}` }
            }),
          catch: (error) => new Error(String(error))
        })

        if (!response.ok) {
          return yield* Effect.fail(new ThingNotFoundError(id))
        }

        const post = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) => new Error(String(error))
        })

        // Transform WordPress post → ONE thing
        return {
          _id: post.id.toString(),
          type: 'post' as ThingType,
          name: post.title.rendered,
          properties: {
            content: post.content.rendered,
            excerpt: post.excerpt.rendered,
            author: post.author,
            publishedAt: post.date
          },
          status: post.status,
          createdAt: new Date(post.date).getTime(),
          updatedAt: new Date(post.modified).getTime()
        }
      }),

    list: (params) =>
      Effect.gen(function* () {
        const query = new URLSearchParams({
          per_page: String(params.limit || 10)
        })

        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(`${this.baseUrl}/wp-json/wp/v2/posts?${query}`, {
              headers: { Authorization: `Bearer ${this.apiKey}` }
            }),
          catch: (error) => new Error(String(error))
        })

        const posts = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) => new Error(String(error))
        })

        return posts.map((post: any) => ({
          _id: post.id.toString(),
          type: 'post' as ThingType,
          name: post.title.rendered,
          properties: {
            content: post.content.rendered,
            excerpt: post.excerpt.rendered
          },
          status: post.status,
          createdAt: new Date(post.date).getTime(),
          updatedAt: new Date(post.modified).getTime()
        }))
      }),

    create: (input) =>
      Effect.gen(function* () {
        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(`${this.baseUrl}/wp-json/wp/v2/posts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`
              },
              body: JSON.stringify({
                title: input.name,
                content: input.properties.content || '',
                status: 'draft'
              })
            }),
          catch: (error) => new Error(String(error))
        })

        const post = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) => new Error(String(error))
        })

        return post.id.toString()
      }),

    update: (id, updates) => { /* Similar WordPress update */ },
    delete: (id) => { /* Similar WordPress delete */ }
  }

  connections = { /* WordPress relationships via post meta or custom tables */ }
  events = { /* Log to WordPress activity log */ }
  knowledge = { /* Elasticsearch, Algolia, or vector search */ }
}

// Factory function
export function wordpressProvider(config: { url: string; apiKey: string }) {
  return Layer.succeed(
    DataProvider,
    new WordPressProvider(config.url, config.apiKey)
  )
}
```

### Notion Provider

```typescript
// frontend/src/providers/notion/NotionProvider.ts
import { Effect, Layer } from 'effect'
import { Client } from '@notionhq/client'
import { DataProvider } from '../DataProvider'

export class NotionProvider implements DataProvider {
  private notion: Client

  constructor(apiKey: string, private databaseId: string) {
    this.notion = new Client({ auth: apiKey })
  }

  things = {
    get: (id: string) =>
      Effect.gen(function* () {
        const page = yield* Effect.tryPromise({
          try: () => this.notion.pages.retrieve({ page_id: id }),
          catch: (error) => new Error(String(error))
        })

        return {
          _id: page.id,
          type: 'document' as ThingType,
          name: (page.properties.Name as any).title[0]?.plain_text || '',
          properties: {},
          status: 'active',
          createdAt: new Date(page.created_time).getTime(),
          updatedAt: new Date(page.last_edited_time).getTime()
        }
      }),

    list: (params) =>
      Effect.gen(function* () {
        const response = yield* Effect.tryPromise({
          try: () =>
            this.notion.databases.query({
              database_id: this.databaseId,
              page_size: params.limit || 10
            }),
          catch: (error) => new Error(String(error))
        })

        return response.results.map((page: any) => ({
          _id: page.id,
          type: params.type,
          name: page.properties.Name?.title[0]?.plain_text || '',
          properties: {},
          status: 'active',
          createdAt: new Date(page.created_time).getTime(),
          updatedAt: new Date(page.last_edited_time).getTime()
        }))
      }),

    create: (input) =>
      Effect.gen(function* () {
        const page = yield* Effect.tryPromise({
          try: () =>
            this.notion.pages.create({
              parent: { database_id: this.databaseId },
              properties: {
                Name: { title: [{ text: { content: input.name } }] }
              }
            }),
          catch: (error) => new Error(String(error))
        })

        return page.id
      }),

    update: (id, updates) => { /* Similar Notion update */ },
    delete: (id) => { /* Notion archive page */ }
  }

  connections = { /* Notion relations map to connections */ }
  events = { /* Log to separate Notion database */ }
  knowledge = { /* Notion's built-in search or external vector DB */ }
}

// Factory function
export function notionProvider(config: { apiKey: string; databaseId: string }) {
  return Layer.succeed(
    DataProvider,
    new NotionProvider(config.apiKey, config.databaseId)
  )
}
```

### Supabase Provider

```typescript
// frontend/src/providers/supabase/SupabaseProvider.ts
import { Effect, Layer } from 'effect'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { DataProvider } from '../DataProvider'

export class SupabaseProvider implements DataProvider {
  private supabase: SupabaseClient

  constructor(url: string, apiKey: string) {
    this.supabase = createClient(url, apiKey)
  }

  things = {
    get: (id: string) =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.tryPromise({
          try: () => this.supabase.from('things').select('*').eq('id', id).single(),
          catch: (err) => new Error(String(err))
        })

        if (error) {
          return yield* Effect.fail(new ThingNotFoundError(id))
        }

        return data
      }),

    list: (params) =>
      Effect.gen(function* () {
        let query = this.supabase
          .from('things')
          .select('*')
          .eq('type', params.type)
          .limit(params.limit || 10)

        if (params.groupId) {
          query = query.eq('groupId', params.groupId)
        }

        const { data, error } = yield* Effect.tryPromise({
          try: () => query,
          catch: (err) => new Error(String(err))
        })

        if (error) {
          return yield* Effect.fail(new Error(error.message))
        }

        return data
      }),

    create: (input) =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.tryPromise({
          try: () =>
            this.supabase.from('things').insert([input]).select().single(),
          catch: (err) => new Error(String(err))
        })

        if (error) {
          return yield* Effect.fail(new Error(error.message))
        }

        return data.id
      }),

    update: (id, updates) => { /* Similar Supabase update */ },
    delete: (id) => { /* Similar Supabase delete */ }
  }

  connections = { /* Use Supabase 'connections' table */ }
  events = { /* Use Supabase 'events' table */ }
  knowledge = { /* Use pgvector extension for embeddings */ }

  // ✅ Supabase supports real-time!
  subscriptions = {
    watchThing: (id: string) =>
      Effect.gen(function* () {
        const channel = this.supabase
          .channel(`thing:${id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'things',
            filter: `id=eq.${id}`
          }, (payload) => {
            // Emit updates
          })

        yield* Effect.tryPromise({
          try: () => channel.subscribe(),
          catch: (err) => new Error(String(err))
        })

        // Return observable
      })
  }
}

// Factory function
export function supabaseProvider(config: { url: string; apiKey: string }) {
  return Layer.succeed(
    DataProvider,
    new SupabaseProvider(config.url, config.apiKey)
  )
}
```

**Key Insight:** Each provider translates between ONE ontology ↔ backend-specific API. Frontend stays the same.

---

## Configuration

### Astro-Style Backend Swapping

**Swap backends by changing ONE line:**

```typescript
// frontend/astro.config.ts
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { one } from '@one/astro-integration'

// Import providers
import { convexProvider } from './src/providers/convex'
import { wordpressProvider } from './src/providers/wordpress'
import { notionProvider } from './src/providers/notion'
import { supabaseProvider } from './src/providers/supabase'

export default defineConfig({
  integrations: [
    react(),
    one({
      // ✅ Choose your backend (change this ONE line)

      // Option 1: Convex (real-time, serverless)
      provider: convexProvider({
        url: import.meta.env.PUBLIC_CONVEX_URL
      })

      // Option 2: WordPress (existing CMS)
      // provider: wordpressProvider({
      //   url: 'https://yoursite.com',
      //   apiKey: import.meta.env.WORDPRESS_API_KEY
      // })

      // Option 3: Notion (databases as backend)
      // provider: notionProvider({
      //   apiKey: import.meta.env.NOTION_API_KEY,
      //   databaseId: import.meta.env.NOTION_DB_ID
      // })

      // Option 4: Supabase (PostgreSQL + real-time)
      // provider: supabaseProvider({
      //   url: import.meta.env.PUBLIC_SUPABASE_URL,
      //   apiKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY
      // })

      // Option 5: Custom backend
      // provider: customProvider({ ... })
    })
  ]
})
```

**Result:**
- Frontend components don't change
- UI stays the same
- Only data source changes
- Organizations can use their existing infrastructure

### Display Configuration (UI Only)

Frontend needs **display configuration** for UI rendering. NOT business logic.

```typescript
// frontend/src/ontology/config.ts
// THIS IS NOT BUSINESS LOGIC - JUST UI CONFIGURATION

export const thingConfigs = {
  course: {
    // Display names
    displayName: 'Course',
    displayNamePlural: 'Courses',

    // UI presentation
    icon: 'BookOpen',
    color: 'green',

    // Which fields to show in UI
    primaryField: 'title',
    secondaryField: 'description',
    imageField: 'thumbnail',

    // Form fields (frontend only, backend validates)
    fields: {
      title: {
        label: 'Course Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Fitness 101'
      },
      description: {
        label: 'Description',
        type: 'textarea',
        required: true
      },
      price: {
        label: 'Price (USD)',
        type: 'number',
        required: true
      }
    }
  },

  creator: {
    displayName: 'Creator',
    displayNamePlural: 'Creators',
    icon: 'User',
    color: 'blue',
    primaryField: 'name',
    secondaryField: 'bio',
    imageField: 'avatar',
    fields: {
      name: { label: 'Name', type: 'text', required: true },
      email: { label: 'Email', type: 'text', required: true },
      bio: { label: 'Bio', type: 'textarea', required: false }
    }
  }
  // ... all 66 types (UI config only)
}

// Helper function
export function getThingConfig(type: ThingType) {
  return thingConfigs[type]
}
```

**What This Is:**
- ✅ UI labels and placeholders
- ✅ Icon and color choices
- ✅ Which fields to display
- ✅ Form field types

**What This Is NOT:**
- ❌ Business logic
- ❌ Validation rules (backend validates)
- ❌ Authorization rules (backend authorizes)
- ❌ Database schema (that's in backend)

---

## State Management Hierarchy

### Four-Layer State Architecture

```typescript
{
  // Level 1: Server State (Provider owns - SOURCE OF TRUTH)
  ServerState: {
    owner: "Provider (backed by database)",
    source: "Backend database",
    access: "Query/Mutation via provider.interface only",
    examples: [
      "course list",
      "user profile",
      "enrollment count",
      "lesson progress"
    ],
    caching: "Provider-level (Cloudflare KV, Edge cache)",
    lifetime: "Persistent (until backend changes)",
    rule: "NEVER duplicate in frontend state. Query when needed."
  },

  // Level 2: SSR State (Astro owns - REQUEST SCOPED)
  SSRState: {
    owner: "Astro page (.astro files)",
    source: "Server-side provider fetch",
    access: "Props passed to components",
    examples: [
      "Initial page data (course details)",
      "SEO metadata (title, description)",
      "Organization context (from subdomain)"
    ],
    lifetime: "One HTTP request (not persisted)",
    pattern: `
      ---
      const course = await provider.things.get(id)
      ---
      <Layout title={course.name}>
        <CourseDetail course={course} />
      </Layout>
    `,
    rule: "Use for SEO, initial render, server-only data"
  },

  // Level 3: Island State (React owns - COMPONENT SCOPED)
  IslandState: {
    owner: "React component (useState/useReducer)",
    source: "Component-local logic",
    access: "Component-private (not shared)",
    examples: [
      "Form input values",
      "Modal open/closed",
      "Dropdown expanded",
      "Loading spinner visible"
    ],
    lifetime: "Component mounted (unmount = state destroyed)",
    pattern: `
      export function CourseForm() {
        const [title, setTitle] = useState('')
        const [loading, setLoading] = useState(false)
        // State dies when component unmounts
      }
    `,
    rule: "UI-only state. Never duplicate server state."
  },

  // Level 4: Shared Client State (Nanostores owns - SESSION SCOPED)
  SharedState: {
    owner: "Nanostores (global atoms)",
    source: "Cross-component coordination",
    access: "Multiple components subscribe",
    examples: [
      "Sidebar expanded/collapsed",
      "Dark/light theme preference",
      "User locale (en/es/fr)",
      "Toast notifications"
    ],
    lifetime: "Browser session + localStorage",
    pattern: `
      // stores/layout.ts
      export const sidebarExpanded = atom(true)

      // Component A
      const expanded = useStore(sidebarExpanded)

      // Component B (synced with A)
      const expanded = useStore(sidebarExpanded)
    `,
    rule: "UI preferences only. NOT server data."
  },

  // Anti-Pattern: Duplicating Server State
  antiPattern: {
    problem: "Storing server data in frontend state",
    bad: `
      ❌ const [courses, setCourses] = useState([])
      ❌ useEffect(() => {
           provider.things.list('course').then(setCourses)
         }, [])
      // Problem: Server state duplicated in frontend
      // Problem: Stale data, manual sync, cache invalidation
    `,
    solution: `
      ✅ const courses = useQuery(api.courses.list)
      // Provider handles caching, revalidation, subscriptions
      // Frontend just renders. No state duplication.
    `
  },

  // Decision Tree
  decisionTree: {
    question: "Does this state persist after page reload?",
    yes: {
      question: "Is this data from backend?",
      yes: "ServerState (provider query)",
      no: "SharedState (nanostores + localStorage)"
    },
    no: {
      question: "Do multiple components need this state?",
      yes: "SharedState (nanostores, session-only)",
      no: {
        question: "Is this SSR data?",
        yes: "SSRState (Astro props)",
        no: "IslandState (useState)"
      }
    }
  }
}
```

---

## Effect.ts Service Layer

**Effect.ts services consume the DataProvider interface.**

### Why Effect.ts?

```typescript
// ❌ Traditional approach - untyped errors, hard to compose
async function getCourse(id: string) {
  try {
    const response = await fetch(`/api/courses/${id}`)
    const course = await response.json()
    return course
  } catch (error) {
    // What type of error? Network? 404? 500?
    console.error(error)
    throw error
  }
}

// ✅ Effect.ts approach - typed errors, backend-agnostic
import { Effect } from 'effect'

function getCourse(id: string) {
  return Effect.gen(function* () {
    const provider = yield* DataProvider

    // Works with ANY backend (Convex, WordPress, Notion, etc.)
    const course = yield* provider.things.get(id)

    return course
  }).pipe(
    // Handle specific errors
    Effect.catchTag('ThingNotFoundError', err =>
      Effect.fail(new Error(`Course ${err.thingId} not found`))
    )
  )
}
```

**Key Benefits:**
1. **Backend-Agnostic** - Works with any DataProvider implementation
2. **Type-Safe Errors** - Compiler enforces error handling
3. **Composability** - Small functions combine into complex flows
4. **Testability** - Test layers replace real providers

### Core Principle: Generic Services Handle Everything

The ontology has **66 thing types**, but you only need **2 generic services**:

1. **ThingClientService** - All CRUD for all 66 types
2. **ConnectionClientService** - All relationships

```typescript
// ✅ This handles courses, lessons, products, everything
const provider = yield* DataProvider

// Get any thing
const course = yield* provider.things.get(courseId)
const lesson = yield* provider.things.get(lessonId)

// List any type
const courses = yield* provider.things.list({ type: 'course', groupId: orgId })
const products = yield* provider.things.list({ type: 'product', groupId: orgId })

// Create any type
const courseId = yield* provider.things.create({
  type: 'course',
  name: 'Fitness 101',
  properties: { price: 99, description: '...' }
})
```

**Specialized services are OPTIONAL** - only add them if you repeat the same multi-step operations 3+ times.

### Generic Service Pattern

```typescript
// frontend/src/services/ThingService.ts
import { Effect } from 'effect'
import { DataProvider } from '@/providers/DataProvider'

export class ThingService extends Effect.Service<ThingService>()(
  'ThingService',
  {
    effect: Effect.gen(function* () {
      const provider = yield* DataProvider

      return {
        get: (id: string) => provider.things.get(id),

        list: (type: ThingType, orgId?: string) =>
          provider.things.list({ type, groupId: orgId }),

        create: (input: { type: ThingType; name: string; properties: any }) =>
          provider.things.create(input),

        update: (id: string, updates: any) =>
          provider.things.update(id, updates),

        delete: (id: string) =>
          provider.things.delete(id)
      }
    }),
    dependencies: [DataProvider]
  }
) {}
```

**Key Point:** `ThingService` doesn't care if provider is Convex, WordPress, or Notion. It just calls `provider.things.get()`. The provider handles backend-specific logic.

### Specialized Service Pattern (Optional)

**Only add if you repeat the same multi-step operation 3+ times:**

```typescript
// frontend/src/services/CourseClientService.ts (OPTIONAL)
import { Effect } from 'effect'
import { ThingClientService } from './ThingClientService'
import { ConnectionClientService } from './ConnectionClientService'

export class CourseClientService extends Effect.Service<CourseClientService>()(
  'CourseClientService',
  {
    effect: Effect.gen(function* () {
      const thingService = yield* ThingClientService
      const connectionService = yield* ConnectionClientService

      return {
        // Convenience: Get course with lessons
        getCourseWithLessons: (courseId: string) =>
          Effect.gen(function* () {
            const [course, lessons] = yield* Effect.all([
              thingService.get(courseId),
              connectionService.getRelated(courseId, 'part_of', 'to')
            ])

            return { course, lessons }
          }),

        // Convenience: Clearer domain vocabulary
        enrollUser: (userId: string, courseId: string) =>
          Effect.gen(function* () {
            return yield* connectionService.create({
              fromThingId: userId,
              toThingId: courseId,
              relationshipType: 'enrolled_in'
            })
          }),

        // Convenience: Specific count query
        getEnrollmentCount: (courseId: string) =>
          Effect.gen(function* () {
            return yield* connectionService.getCount(courseId, 'enrolled_in')
          })
      }
    }),
    dependencies: [ThingClientService.Default, ConnectionClientService.Default]
  }
) {}
```

**When to add specialized services:**
- ✅ Repeat the same multi-step operation 3+ times
- ✅ Want domain vocabulary (`enrollUser` vs `create connection`)
- ✅ Need to encapsulate complex business workflows
- ❌ Don't add them upfront for all 66 types
- ❌ Don't add them for simple CRUD (use ThingClientService)

### Dependency Injection Layer

```typescript
// frontend/src/services/ClientLayer.ts
import { Layer } from 'effect'
import { ConvexHttpClientLive } from './ConvexHttpClient'
import { ThingClientService } from './ThingClientService'
import { ConnectionClientService } from './ConnectionClientService'
// import { CourseClientService } from './CourseClientService' // OPTIONAL

// ✅ Minimal layer - handles all 66 thing types
export const ClientLayer = Layer.mergeAll(
  ConvexHttpClientLive,
  ThingClientService.Default,
  ConnectionClientService.Default
  // CourseClientService.Default // Add ONLY if you created it
)
```

**Most apps only need the 2 generic services.** Add specialized services as you discover repeated patterns.

---

## React Hooks & Integration

### useEffectRunner Hook

Custom hook for running Effect programs in React components.

```typescript
// frontend/src/hooks/useEffectRunner.ts
import { useCallback, useState } from 'react'
import { Effect } from 'effect'
import { ClientLayer } from '@/services/ClientLayer'

export function useEffectRunner() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async <A, E>(
    effect: Effect.Effect<A, E>,
    options?: {
      onSuccess?: (result: A) => void
      onError?: (error: E) => void
    }
  ) => {
    setLoading(true)
    setError(null)

    try {
      const result = await Effect.runPromise(
        effect.pipe(Effect.provide(ClientLayer))
      )

      options?.onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      options?.onError?.(err as E)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { run, loading, error }
}
```

### Using in Components

```tsx
// frontend/src/components/CourseEnrollButton.tsx
import { useEffectRunner } from '@/hooks/useEffectRunner'
import { ConnectionClientService } from '@/services/ConnectionClientService'
import { Effect } from 'effect'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

interface Props {
  courseId: string
  userId: string
}

export function CourseEnrollButton({ courseId, userId }: Props) {
  const { run, loading, error } = useEffectRunner()

  const handleEnroll = () => {
    // Define Effect program using GENERIC service
    const program = Effect.gen(function* () {
      const connectionService = yield* ConnectionClientService

      // Enroll = create connection (course is just a thing)
      const enrollmentId = yield* connectionService.create({
        fromThingId: userId,
        toThingId: courseId,
        relationshipType: 'enrolled_in'
      })

      return enrollmentId
    })

    // Run Effect program
    run(program, {
      onSuccess: (enrollmentId) => {
        console.log('Enrolled successfully:', enrollmentId)
        window.location.href = `/courses/${courseId}/learn`
      },
      onError: (err) => {
        console.error('Enrollment failed:', err)
      }
    })
  }

  return (
    <div>
      <Button onClick={handleEnroll} disabled={loading}>
        {loading ? 'Enrolling...' : 'Enroll Now'}
      </Button>

      {error && (
        <Alert variant="destructive">{error}</Alert>
      )}
    </div>
  )
}
```

### Composable Operations

```tsx
// frontend/src/components/CourseCreator.tsx
import { useEffectRunner } from '@/hooks/useEffectRunner'
import { ThingClientService } from '@/services/ThingClientService'
import { ConnectionClientService } from '@/services/ConnectionClientService'
import { Effect } from 'effect'
import { useState } from 'react'

export function CourseCreator() {
  const { run, loading, error } = useEffectRunner()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Define COMPLEX Effect program with ONLY generic services
    const program = Effect.gen(function* () {
      const thingService = yield* ThingClientService
      const connectionService = yield* ConnectionClientService

      // 1. Create course (just a thing with type='course')
      const courseId = yield* thingService.create({
        type: 'course',
        name: formData.title,
        properties: {
          title: formData.title,
          description: formData.description,
          price: formData.price
        }
      })

      // 2. Create default lesson (just a thing with type='lesson')
      const lessonId = yield* thingService.create({
        type: 'lesson',
        name: 'Introduction',
        properties: {
          content: 'Welcome to the course!'
        }
      })

      // 3. Connect lesson to course (generic connection)
      yield* connectionService.create({
        fromThingId: lessonId,
        toThingId: courseId,
        relationshipType: 'part_of'
      })

      // 4. Return course ID
      return courseId
    }).pipe(
      Effect.retry({ times: 3 }),
      Effect.timeout('5 seconds'),
      Effect.catchTag('ThingCreateError', err =>
        Effect.fail(new Error(`Failed to create course: ${err.reason}`))
      )
    )

    // Run the program
    const courseId = await run(program, {
      onSuccess: (id) => {
        window.location.href = `/courses/${id}`
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Course Title"
      />

      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description"
      />

      <input
        type="number"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
        placeholder="Price"
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Course'}
      </button>

      {error && <Alert variant="destructive">{error}</Alert>}
    </form>
  )
}
```

### Parallel Data Fetching

```tsx
// frontend/src/components/CourseDashboard.tsx
import { useEffect, useState } from 'react'
import { useEffectRunner } from '@/hooks/useEffectRunner'
import { ThingClientService } from '@/services/ThingClientService'
import { ConnectionClientService } from '@/services/ConnectionClientService'
import { Effect } from 'effect'

interface Props {
  courseId: string
}

export function CourseDashboard({ courseId }: Props) {
  const { run, loading } = useEffectRunner()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    // Fetch all data in parallel using GENERIC services
    const program = Effect.gen(function* () {
      const thingService = yield* ThingClientService
      const connectionService = yield* ConnectionClientService

      // Parallel fetch (all run at once)
      const [course, lessons, enrollmentCount] = yield* Effect.all([
        thingService.get(courseId),
        connectionService.getRelated(courseId, 'part_of', 'to'),
        connectionService.getCount(courseId, 'enrolled_in')
      ], { concurrency: 'unbounded' })

      return { course, lessons, enrollmentCount }
    })

    run(program, {
      onSuccess: setData
    })
  }, [courseId])

  if (loading) return <div>Loading...</div>
  if (!data) return <div>No data</div>

  return (
    <div>
      <h1>{data.course.name}</h1>
      <p>{data.enrollmentCount} students enrolled</p>

      <h2>Lessons</h2>
      {data.lessons.map((lesson: any) => (
        <div key={lesson._id}>{lesson.name}</div>
      ))}
    </div>
  )
}
```

---

## Component Patterns

### Generic Card (Pure Presentation)

```tsx
// frontend/src/components/cards/ThingCard.tsx
import { Card } from '@/components/ui/card'
import { getThingConfig } from '@/ontology/config'
import * as Icons from 'lucide-react'

interface ThingCardProps {
  thing: {
    _id: string
    type: string
    name: string
    properties: Record<string, any>
  }
}

export function ThingCard({ thing }: ThingCardProps) {
  // Get UI config
  const config = getThingConfig(thing.type as any)
  const Icon = Icons[config.icon as keyof typeof Icons]

  // Extract display values
  const title = thing.properties[config.primaryField] || thing.name
  const subtitle = config.secondaryField
    ? thing.properties[config.secondaryField]
    : null
  const image = config.imageField
    ? thing.properties[config.imageField]
    : null

  // Pure presentation - NO logic
  return (
    <Card>
      {image && <img src={image} alt={title} />}

      <div className="p-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span>{config.displayName}</span>
        </div>

        <h3 className="text-xl font-bold">{title}</h3>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}

        <a href={`/${thing.type}s/${thing._id}`}>
          <button>View Details</button>
        </a>
      </div>
    </Card>
  )
}
```

**Key Points:**
- ✅ Receives data as props
- ✅ Uses UI config for display
- ✅ Pure presentation logic
- ❌ NO database calls
- ❌ NO business logic
- ❌ NO validation

---

## Page Patterns & SSR

### Fetch from Backend, Render HTML

```astro
---
// frontend/src/pages/courses/[id].astro
import { getConvexClient } from '@/lib/convex'
import { api } from '@/lib/api'
import Layout from '@/layouts/Layout.astro'
import EnrollButton from '@/components/EnrollButton.tsx'

// SSR: Fetch data from backend via HTTP
const convex = getConvexClient()

const course = await convex.query(api.queries.things.get, {
  id: Astro.params.id
})

if (!course) {
  return Astro.redirect('/404')
}

// Get related lessons from backend
const lessons = await convex.query(api.queries.things.getRelated, {
  thingId: course._id,
  relationshipType: 'part_of',
  direction: 'to'
})
---

<Layout title={course.name}>
  <!-- Static HTML rendered on server -->
  <header>
    <h1>{course.name}</h1>
    <p>{course.properties.description}</p>
    <span className="text-2xl">${course.properties.price}</span>
  </header>

  <!-- Lessons list (static) -->
  <section>
    <h2>Lessons</h2>
    {lessons.map(lesson => (
      <div>
        <h3>{lesson.name}</h3>
        <p>{lesson.properties.content}</p>
      </div>
    ))}
  </section>

  <!-- Interactive enrollment button (React Island) -->
  <EnrollButton client:load courseId={course._id} />
</Layout>
```

**Key Points:**
- ✅ Calls backend API to get data
- ✅ Renders static HTML
- ✅ Fast initial load (SSR)
- ❌ NO database access
- ❌ NO business logic in page

---

## Real-Time Components

### Subscribe to Backend Changes

```tsx
// frontend/src/components/LiveEnrollmentCount.tsx
import { useQuery } from 'convex/react'
import { api } from '@/lib/api'

export function LiveEnrollmentCount({ courseId }: Props) {
  // Real-time subscription to backend
  // When ANYONE enrolls, this updates EVERYWHERE instantly
  const count = useQuery(api.queries.connections.getCount, {
    toThingId: courseId,
    relationshipType: 'enrolled_in'
  })

  if (count === undefined) return <div>Loading...</div>

  return (
    <div>
      <span className="text-3xl font-bold">{count}</span>
      <span className="text-sm text-gray-600"> students enrolled</span>
    </div>
  )
}
```

**How It Works:**
1. Component subscribes to backend query via WebSocket
2. Backend watches database for changes
3. When connection created → backend pushes update to frontend
4. Component auto-re-renders
5. **Frontend does NOTHING except display the number**

---

## Forms & Data Mutations

### Collect Input, Send to Backend

```tsx
// frontend/src/components/forms/ThingForm.tsx
import { useMutation } from 'convex/react'
import { api } from '@/lib/api'
import { getThingConfig } from '@/ontology/config'
import { useState } from 'react'

interface ThingFormProps {
  type: ThingType
  onSuccess?: (id: string) => void
}

export function ThingForm({ type, onSuccess }: ThingFormProps) {
  const config = getThingConfig(type)
  const [formData, setFormData] = useState({})
  const [error, setError] = useState<string | null>(null)

  // Backend mutation (frontend just calls it)
  const createThing = useMutation(api.mutations.things.create)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Send to backend - backend validates, creates, logs events
      const id = await createThing({
        type,
        name: formData[config.primaryField],
        properties: formData
      })

      onSuccess?.(id)
    } catch (err) {
      // Display backend error
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields from UI config */}
      {Object.entries(config.fields).map(([field, fieldConfig]) => (
        <div key={field}>
          <label>{fieldConfig.label}</label>
          <input
            type={fieldConfig.type}
            value={formData[field] || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
          />
        </div>
      ))}

      {error && <div className="text-red-600">{error}</div>}

      <button type="submit">Create</button>
    </form>
  )
}
```

**Key Points:**
- ✅ Collects user input
- ✅ Sends to backend mutation
- ✅ Displays backend errors
- ⚠️ Frontend validation is optional (UX only)
- ❌ Backend MUST validate (security)
- ❌ Frontend does NOT create database records

---

## Multi-Tenant Routing

### Middleware: Extract Org from Subdomain

```typescript
// frontend/src/middleware.ts
import { defineMiddleware } from 'astro:middleware'
import { getConvexClient } from './lib/convex'
import { api } from './lib/api'

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url)

  // Extract org slug from subdomain
  // fitnesspro.one.ie → "fitnesspro"
  const hostname = url.hostname
  const orgSlug = hostname.split('.')[0]

  // Skip for main domains
  if (['api', 'www', 'localhost'].includes(orgSlug)) {
    return next()
  }

  // Fetch org from backend
  const convex = getConvexClient()
  const org = await convex.query(api.queries.orgs.getBySlug, {
    slug: orgSlug
  })

  if (org) {
    // Inject org context for pages to use
    context.locals.org = org
    context.locals.orgId = org._id
  }

  return next()
})
```

### Use Org Context in Pages

```astro
---
// frontend/src/pages/courses/index.astro
import { getConvexClient } from '@/lib/convex'
import { api } from '@/lib/api'

// Get org from middleware
const org = Astro.locals.org

if (!org) {
  return Astro.redirect('/404')
}

// Fetch org's courses from backend
const convex = getConvexClient()
const courses = await convex.query(api.queries.things.list, {
  type: 'course',
  groupId: org._id  // Backend filters by group
})
---

<Layout title={`${org.name} - Courses`}>
  <h1>{org.name} Courses</h1>

  <!-- Display org's courses -->
  {courses.map(course => (
    <CourseCard thing={course} />
  ))}
</Layout>
```

**Result:**
- `fitnesspro.one.ie/courses` → FitnessPro courses only
- `techcorp.one.ie/courses` → TechCorp courses only
- **Backend enforces data isolation, frontend just passes orgId**

---

## Caching Ontology

### Four-Tier Caching Architecture

```typescript
{
  // Tier 1: Type Definition Cache (STATIC - INFINITE TTL)
  L1_TypeDefinitions: {
    what: "Ontology type structures",
    ttl: "∞ (types never change at runtime)",
    storage: "Memory (startup load)",
    size: "200 tokens × 66 types = 13,200 tokens",
    hitRate: "99.9%+ (loaded once)",
    benefit: "AI loads 200 tokens (not 15k implementation tokens)"
  },

  // Tier 2: Provider Interface Cache (STATIC - INFINITE TTL)
  L2_ProviderInterface: {
    what: "DataProvider method signatures",
    ttl: "∞ (interface never changes)",
    storage: "Memory (startup load)",
    size: "300 tokens (entire interface)",
    hitRate: "100% (never changes)",
    benefit: "AI never loads backend implementation (0 tokens)"
  },

  // Tier 3: SSR Data Cache (DYNAMIC - TTL: 1-60s)
  L3_SSRData: {
    what: "Server-rendered page data",
    ttl: "1-60s (configurable per route)",
    storage: "Cloudflare KV / Edge cache",
    size: "Variable (full pages or data)",
    strategy: "Stale-while-revalidate",
    benefit: "Reduces provider calls by 80-95%"
  },

  // Tier 4: Client Subscriptions (REALTIME - TTL: 0)
  L4_RealtimeSubscriptions: {
    what: "WebSocket live updates",
    ttl: "0 (always fresh)",
    storage: "Client memory (ephemeral)",
    strategy: "Provider pushes updates",
    when_to_use: [
      "Real-time dashboards",
      "Live enrollment counts",
      "Collaborative editing",
      "Chat/notifications"
    ]
  },

  // Cache Hierarchy Decision Tree
  decisionTree: {
    question: "Is this ontology type data?",
    yes: "L1 (Type Definition Cache) - infinite TTL",
    no: {
      question: "Is this provider interface?",
      yes: "L2 (Provider Interface Cache) - infinite TTL",
      no: {
        question: "Does data change in real-time?",
        yes: "L4 (Real-time Subscriptions) - 0 TTL",
        no: {
          question: "Is data page-level?",
          yes: "L3 (SSR Data Cache) - 1-60s TTL",
          no: "No cache (fetch on demand)"
        }
      }
    }
  },

  // Golden Rule
  rule: "Cache closer to definition = less context loaded. Types/interface = cached forever."
}
```

### Cache Invalidation Strategies

```typescript
{
  strategies: {
    // L1 & L2: Never invalidate (static types/interface)
    static: {
      invalidation: "None (only invalidate on deployment)",
      reason: "Types and interface don't change at runtime"
    },

    // L3: Time-based + event-based
    ssr: {
      time_based: "TTL expires → fetch fresh",
      event_based: "Backend mutation → invalidate affected pages",
      example: `
        // When course updated, invalidate course page cache
        await provider.things.update(courseId, updates)
        await cache.delete(\`course:\${courseId}\`)
      `
    },

    // L4: Automatic (subscription handles)
    realtime: {
      invalidation: "Provider pushes updates automatically",
      reason: "WebSocket connection = always fresh"
    }
  }
}
```

---

## Error Propagation & Handling

### Full Error Flow: Provider → Service → Component → UI

```typescript
{
  errorFlow: "Provider → Service → Component → UI",

  // Level 1: Provider Errors (Effect.ts tagged errors)
  providerErrors: {
    ThingNotFoundError: {
      _tag: "ThingNotFoundError",
      fields: { thingId: string; type: ThingType },
      recovery: "Show 404 page or 'Not Found' component",
      httpStatus: 404
    },

    UnauthorizedError: {
      _tag: "UnauthorizedError",
      fields: { userId?: string; requiredPermission: string },
      recovery: "Redirect to /login with returnUrl",
      httpStatus: 401
    },

    NetworkError: {
      _tag: "NetworkError",
      fields: { message: string; retryable: boolean },
      recovery: "Retry with exponential backoff (if retryable)",
      httpStatus: 503
    },

    RateLimitError: {
      _tag: "RateLimitError",
      fields: { retryAfter: number },
      recovery: "Show 'Try again in X seconds' message",
      httpStatus: 429
    }
  },

  // Level 2: Service Errors (Domain-specific)
  serviceErrors: {
    pattern: "Transform provider error → domain error",
    example: `
      getCourseWithLessons(id: string) {
        return Effect.gen(function* () {
          const course = yield* thingService.get(id)
          const lessons = yield* connectionService.getRelated(id, 'part_of', 'to')
          return { course, lessons }
        }).pipe(
          Effect.catchTag('ThingNotFoundError', (e) =>
            Effect.fail(new CourseNotFoundError({
              courseId: e.thingId,
              message: \`Course \${e.thingId} not found\`
            }))
          )
        )
      }
    `
  },

  // Level 3: Component Errors (Catch and render)
  componentErrors: {
    pattern: "Match error._tag → Render UI component",
    example: `
      if (error) {
        switch (error._tag) {
          case 'CourseNotFoundError':
            return <Alert variant="warning">Course not found</Alert>
          case 'UnauthorizedError':
            return <Alert variant="error">Please log in to view</Alert>
          case 'NetworkError':
            return <Alert variant="error">Network error. Retrying...</Alert>
          default:
            return <Alert variant="error">Something went wrong</Alert>
        }
      }
    `
  },

  // Level 4: UI Errors (User-facing messages)
  uiErrors: {
    pattern: "Error → User-friendly message + Action",
    mapping: {
      ThingNotFoundError: {
        message: "This {type} doesn't exist",
        action: "Go back or search for another",
        component: "<Alert404 />"
      },

      UnauthorizedError: {
        message: "You need to log in to see this",
        action: "Log in or Sign up",
        component: "<LoginPrompt returnUrl={currentPath} />"
      },

      NetworkError: {
        message: "Connection issue",
        action: "Retrying automatically...",
        component: "<RetryAlert retrying={true} />"
      }
    }
  },

  // Error Boundary Pattern
  errorBoundary: `
    export class ErrorBoundary extends React.Component {
      state = { error: null }

      static getDerivedStateFromError(error) {
        return { error }
      }

      render() {
        if (this.state.error) {
          return <ErrorFallback error={this.state.error} />
        }

        return this.props.children
      }
    }

    // Usage: Wrap islands in error boundaries
    <ErrorBoundary>
      <CourseDetail client:load courseId={id} />
    </ErrorBoundary>
  `,

  // Golden Rule
  invariant: "Every error path has explicit UI recovery. No silent failures."
}
```

---

## Testing Patterns

### Three-Layer Testing Strategy

```typescript
{
  // Layer 1: Unit Tests (Service logic with mock provider)
  unitTests: {
    what: "Test service logic in isolation",
    mock: "MockProvider (no real backend)",
    fast: "Milliseconds per test",

    example: `
      describe('CourseService.getCourseWithLessons', () => {
        it('should return course with lessons', async () => {
          // Mock provider
          const MockProvider = Layer.succeed(DataProvider, {
            things: {
              get: (id) => Effect.succeed({
                _id: id,
                type: 'course',
                name: 'Test Course'
              })
            },
            connections: {
              getRelated: (thingId, type, direction) => Effect.succeed([
                { _id: 'lesson1', type: 'lesson', name: 'Lesson 1' },
                { _id: 'lesson2', type: 'lesson', name: 'Lesson 2' }
              ])
            }
          })

          // Test service
          const result = await Effect.runPromise(
            Effect.gen(function* () {
              const service = yield* CourseService
              return yield* service.getCourseWithLessons('course123')
            }).pipe(Effect.provide(MockProvider))
          )

          expect(result.course.name).toBe('Test Course')
          expect(result.lessons).toHaveLength(2)
        })
      })
    `,

    coverage: [
      "Service logic (business rules)",
      "Error transformations",
      "Effect composition",
      "Edge cases"
    ]
  },

  // Layer 2: Integration Tests (Service + Real Provider + Test Backend)
  integrationTests: {
    what: "Test service + provider + real backend",
    backend: "Test Convex deployment (isolated database)",
    slow: "Seconds per test (real network calls)",

    coverage: [
      "Full data flow (service → provider → backend → database)",
      "Real mutations and queries",
      "Data consistency",
      "Backend constraints"
    ]
  },

  // Layer 3: E2E Tests (Full UI flow in browser)
  e2eTests: {
    what: "Test complete user flows in browser",
    tool: "Playwright (headless Chrome)",
    slow: "10-30s per test (full page loads)",

    coverage: [
      "User flows (click, type, navigate)",
      "Visual rendering",
      "Loading states",
      "Error states",
      "Authentication flows"
    ]
  },

  // Test Pyramid
  pyramid: {
    unit: "70% (fast, many tests, mock provider)",
    integration: "20% (medium, key flows, test backend)",
    e2e: "10% (slow, critical paths, real UI)"
  },

  // Golden Rule
  invariant: "Mock providers for unit tests. Real providers for integration. Real UI for E2E."
}
```

---

## Common Mistakes & Solutions

### Top 10 Anti-Patterns to Avoid

```typescript
{
  // Mistake 1: Coupling to specific provider
  mistake1: {
    problem: "Importing Convex directly in frontend code",
    bad: `
      // ❌ BAD
      import { ConvexClient } from 'convex/browser'
      const client = new ConvexClient(url)
      const course = await client.query(api.courses.get, { id })
    `,
    good: `
      // ✅ GOOD
      const provider = yield* DataProvider
      const course = yield* provider.things.get(id)
    `,
    why: "Bad code breaks when you swap backends. Good code works with ANY backend."
  },

  // Mistake 2: Creating specialized services prematurely
  mistake2: {
    problem: "Creating CourseService before patterns emerge",
    bad: `
      // ❌ BAD (created after 1 use)
      class CourseService {
        getCourseWithLessons(id) {
          // Used once, doesn't justify specialized service
        }
      }
    `,
    good: `
      // ✅ GOOD (use generic services until pattern repeats 3+ times)
      const course = yield* thingService.get(id)
      const lessons = yield* connectionService.getRelated(id, 'part_of', 'to')

      // Only create CourseService after repeating this 3+ times
    `,
    why: "Premature abstraction creates unnecessary complexity. Wait for patterns."
  },

  // Mistake 3: Duplicating server state in frontend
  mistake3: {
    problem: "Storing backend data in useState",
    bad: `
      // ❌ BAD
      const [courses, setCourses] = useState([])
      useEffect(() => {
        provider.things.list({ type: 'course' })
          .then(setCourses)
      }, [])
    `,
    good: `
      // ✅ GOOD
      const courses = useQuery(api.courses.list)
      // Provider handles caching, no state duplication
    `,
    why: "Duplicating state creates sync issues. Let provider handle caching."
  },

  // Mistake 4: Not handling error states
  mistake4: {
    problem: "No UI for errors",
    bad: `
      // ❌ BAD
      const course = await provider.things.get(id)
      return <div>{course.name}</div>
      // What if course is undefined? No error handling!
    `,
    good: `
      // ✅ GOOD
      try {
        const course = await provider.things.get(id)
        return <div>{course.name}</div>
      } catch (error) {
        if (error._tag === 'ThingNotFoundError') {
          return <Alert>Course not found</Alert>
        }
        return <Alert>Error loading course</Alert>
      }
    `,
    why: "Errors WILL happen. Always have UI for error states."
  },

  // Mistake 5: Manual group filtering
  mistake5: {
    problem: "Manually filtering by groupId",
    bad: `
      // ❌ BAD
      const courses = await provider.things.list({
        type: 'course',
        groupId: ctx.locals.groupId // Manual filtering
      })
    `,
    good: `
      // ✅ GOOD
      const courses = await provider.things.list({ type: 'course' })
      // Provider auto-injects groupId
    `,
    why: "Provider enforces multi-tenancy. Frontend shouldn't know about groups."
  },

  // Mistake 6: Not testing with mock providers
  mistake6: {
    problem: "Testing with real backend (slow, flaky)",
    bad: `
      // ❌ BAD
      test('gets course', async () => {
        const course = await service.get('real_id_from_db')
        // Depends on real database state
      })
    `,
    good: `
      // ✅ GOOD
      test('gets course', async () => {
        const MockProvider = Layer.succeed(DataProvider, {
          things: { get: (id) => Effect.succeed(mockCourse) }
        })

        const course = await service.get('any_id')
          .pipe(Effect.provide(MockProvider))
        // Fast, deterministic, no database
      })
    `,
    why: "Unit tests should be fast and deterministic. Use mocks."
  },

  // Mistake 7: Skipping progressive enhancement
  mistake7: {
    problem: "JavaScript-only forms (don't work without JS)",
    bad: `
      // ❌ BAD
      <button onClick={() => enroll()}>Enroll</button>
      // Doesn't work if JS fails to load
    `,
    good: `
      // ✅ GOOD
      <form action="/api/enroll" method="post">
        <button type="submit">Enroll</button>
      </form>
      // Works with or without JS

      // Then enhance with JS:
      <EnrollButton client:load /> // Adds optimistic UI
    `,
    why: "Always start with working HTML. JavaScript should enhance, not enable."
  },

  // Mistake 8: Ignoring type sync
  mistake8: {
    problem: "Manually duplicating backend types in frontend",
    bad: `
      // ❌ BAD
      // frontend/types.ts
      type Course = {
        id: string
        title: string
        // Manually copied from backend
      }
    `,
    good: `
      // ✅ GOOD
      import type { Thing } from '@/convex/_generated/dataModel'
      // Auto-synced from backend schema
    `,
    why: "Manual type sync breaks. Use generated types from backend."
  },

  // Mistake 9: Loading too much context
  mistake9: {
    problem: "Loading entire codebase for AI generation",
    bad: `
      // ❌ BAD
      const context = {
        allFiles: loadFiles('**/*.ts'),           // 200k tokens
        allDocs: loadDocs(),                      // 50k tokens
        allExamples: loadExamples()               // 30k tokens
      } // 280k tokens
    `,
    good: `
      // ✅ GOOD
      const context = {
        interface: DataProviderInterface,         // 300 tokens
        pattern: servicePattern                   // 400 tokens
      } // 700 tokens (99.7% reduction)
    `,
    why: "Context explosion wastes time and money. Load only what's needed."
  },

  // Mistake 10: Business logic in frontend
  mistake10: {
    problem: "Validating business rules in frontend only",
    bad: `
      // ❌ BAD
      if (user.tokens >= course.price) {
        // Frontend calculates eligibility
      }
    `,
    good: `
      // ✅ GOOD
      // Backend validates (frontend just shows loading)
      const result = await provider.things.create(courseData)
      // Backend enforces: tokens >= price
    `,
    why: "Frontend can be bypassed. Backend MUST enforce all rules."
  }
}
```

---

## Summary & Key Patterns

### Frontend Responsibilities (ONLY These)

| What | How | Example |
|------|-----|---------|
| **Render UI** | Astro pages + React components | `<h1>{course.name}</h1>` |
| **Call Backend** | Effect.ts services or Convex hooks | `yield* courseService.get(id)` |
| **Manage UI State** | `useState`, `useReducer`, `useEffectRunner` | `const { run, loading, error } = useEffectRunner()` |
| **Route Users** | Astro routing, middleware | `/courses/[id].astro` |
| **Display Errors** | Show typed backend errors | `Effect.catchTag('NotFoundError', ...)` |

### The Architecture Contract

```typescript
// Frontend → Backend (only way to interact)

// ✅ Frontend calls backend query
const courses = useQuery(api.queries.things.list, { type: 'course' })

// ✅ Frontend calls backend mutation
const create = useMutation(api.mutations.things.create)
await create({ type: 'course', name: 'Fitness 101', properties: {...} })

// ✅ Backend implements logic
export const create = mutation({
  handler: async (ctx, args) => {
    // Validate
    // Create in database
    // Log event
    // Return result
  }
})

// ❌ Frontend NEVER accesses database directly
const courses = await ctx.db.query('things') // IMPOSSIBLE in frontend
```

### Key Principles

1. **Separation:** Frontend renders, backend manages data
2. **Type-Safe:** Effect.ts enforces error handling, backend generates types
3. **Composability:** Effect.ts services combine into complex flows
4. **Real-Time:** WebSocket subscriptions auto-update UI
5. **Multi-Tenant:** Middleware extracts org → pages filter by org
6. **Testability:** Effect.ts test layers replace mocks
7. **Stateless:** Frontend has no state beyond UI, backend is source of truth
8. **Backend-Agnostic:** Provider pattern works with ANY backend (Convex, WordPress, Notion, Supabase, etc.)

### Generic vs Specialized Services Decision Tree

```
┌──────────────────────────────────────────────────┐
│              66 Thing Types                      │
│  course, lesson, product, video, post, etc.     │
└────────────────┬─────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────┐
│     2 GENERIC SERVICES (handle everything)       │
│                                                  │
│  ThingClientService:                             │
│    - get(id)                                     │
│    - list(type, orgId)                           │
│    - create({ type, name, properties })          │
│    - update(id, updates)                         │
│    - delete(id)                                  │
│                                                  │
│  ConnectionClientService:                        │
│    - create({ fromThingId, toThingId, type })    │
│    - getRelated(thingId, type, direction)        │
│    - getCount(thingId, type)                     │
│    - delete(connectionId)                        │
└────────────────┬─────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────┐
│  SPECIALIZED SERVICES (optional, add as needed)  │
│                                                  │
│  CourseClientService (if you repeat patterns):  │
│    - getCourseWithLessons()                      │
│    - enrollUser()                                │
│    - getEnrollmentCount()                        │
│                                                  │
│  Add ONLY when patterns repeat 3+ times         │
└──────────────────────────────────────────────────┘
```

**Start with generic services. Add specialized services as patterns emerge.**

### Context Engineering Results

**Traditional approach:**
- Load: 50k-300k tokens per request
- Cost: $0.50-$3.00 per request
- Speed: 30-60 seconds
- Backends: 1 (tightly coupled)

**Ontology-driven approach:**
- Load: 300-5k tokens per request (98-99% reduction)
- Cost: $0.003-$0.05 per request (100x cheaper)
- Speed: 2-5 seconds (10x faster)
- Backends: ∞ (swap with 1 line)

### Success Criteria

| Level | Requirement |
|-------|-------------|
| **Layer 1: Rendering** | ✅ Pages render from backend data via SSR ✅ React islands for interactivity ✅ No database access |
| **Layer 2: Services** | ✅ Effect.ts services with typed errors ✅ Generic services handle all 66 types ✅ No backend-specific code |
| **Layer 3: Data** | ✅ DataProvider interface implemented ✅ Multiple backends work (Convex, WordPress, Notion, etc.) ✅ Swap backends with 1 config line |
| **Quality** | ✅ Unit tests with mock provider ✅ Integration tests with real backend ✅ E2E tests verify user flows ✅ TypeScript strict mode ✅ No manual type duplication |

### Final Checklist

- [ ] DataProvider interface defined
- [ ] At least one provider implemented (ConvexProvider minimum)
- [ ] ThingClientService and ConnectionClientService created
- [ ] ClientLayer dependency injection set up
- [ ] useEffectRunner hook implemented
- [ ] Astro pages call backend via provider
- [ ] React components use useEffectRunner for mutations
- [ ] Error boundaries wrap interactive islands
- [ ] Real-time components use subscriptions (optional)
- [ ] Forms submit to backend (don't validate locally)
- [ ] Multi-tenant middleware extracts org from subdomain
- [ ] Unit tests use mock provider
- [ ] Integration tests use test backend
- [ ] Types synced from backend schema
- [ ] UI config for all 66 thing types
- [ ] Display components adapt to config

---

**Frontend is pure rendering. Backend is everything else.**

**Effect.ts for type-safe composability. Separate deployments. Real-time updates. Backend-agnostic forever.**

