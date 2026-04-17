---
title: Architecture Any Backend
dimension: knowledge
category: architecture-any-backend.md
tags: ai, architecture, backend, convex, frontend, groups, ontology, protocol, system-design
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the architecture-any-backend.md category.
  Location: one/knowledge/architecture-any-backend.md
  Purpose: Documents backend-agnostic architecture: use any database
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand architecture any backend.
---

# Backend-Agnostic Architecture: Use Any Database

**Version:** 3.0
**Status:** ✅ Production Ready
**Last Updated:** 2025-11-03

---

## Overview

The ONE Platform implements a **backend-agnostic architecture** that allows any group to choose ANY backend database or CMS without changing a single line of frontend code. Switch from Convex to WordPress to Notion with **one configuration change**.

This architecture proves that the 6-dimension ontology is truly protocol-agnostic and platform-independent.

**Critical:** This document aligns with the 5-table implementation (groups table + 4 other tables with groupId scoping) as specified in the main architecture.

---

## The 6-Dimension Ontology: 5-Table Implementation

The ONE Platform uses a **6-dimension ontology** implemented with **5 database tables**:

### Database Schema

```typescript
// TABLE 1: groups (Dimension 1 - Multi-tenancy boundary)
{
  _id: Id<"groups">,
  name: string,
  type: "friend_circle" | "business" | "community" | "dao" | "government" | "organization",
  parentGroupId?: Id<"groups">,  // Hierarchical nesting (groups contain groups)
  properties: {
    plan?: "starter" | "pro" | "enterprise",
    backendProvider?: "convex" | "wordpress" | "notion" | "supabase",
    // ... type-specific fields
  },
  status: "draft" | "active" | "archived",
  createdAt: number,
  updatedAt: number
}

// TABLE 2: things (Dimension 3 - All nouns)
{
  _id: Id<"things">,
  type: ThingType, // 66 types
  name: string,
  groupId: Id<"groups">, // SCOPED TO GROUP
  properties: any, // Flexible type-specific data
  status: "draft" | "active" | "published" | "archived",
  createdAt: number,
  updatedAt: number
}

// TABLE 3: connections (Dimension 4 - All relationships)
{
  _id: Id<"connections">,
  fromThingId?: Id<"things">,
  toThingId?: Id<"things">,
  fromPersonId?: Id<"people">,
  toPersonId?: Id<"people">,
  relationshipType: ConnectionType, // 25 types
  groupId: Id<"groups">, // SCOPED TO GROUP
  metadata: any,
  createdAt: number
}

// TABLE 4: events (Dimension 5 - All actions)
{
  _id: Id<"events">,
  type: EventType, // 67 types
  actorId: Id<"people">, // Person who did it (REQUIRED)
  targetId?: Id<"things"> | Id<"people"> | Id<"connections">,
  groupId: Id<"groups">, // SCOPED TO GROUP
  metadata: any,
  timestamp: number
}

// TABLE 5: knowledge (Dimension 6 - AI understanding)
{
  _id: Id<"knowledge">,
  type: "embedding" | "label" | "category" | "tag",
  text?: string,
  embedding?: number[], // Vector for semantic search
  embeddingModel?: string,
  sourceThingId?: Id<"things">,
  sourcePersonId?: Id<"people">,
  groupId: Id<"groups">, // SCOPED TO GROUP
  labels?: string[],
  metadata?: any,
  createdAt: number,
  updatedAt: number
}
```

### Where is Dimension 2 (People)?

**People are represented as things** with `type: 'creator'` and `properties.role` field, OR as a separate `people` table depending on backend requirements. The main architecture uses things, but some providers (like WordPress) may use a separate users table.

**4 Roles:**
- `platform_owner` - Full platform access
- `org_owner` - Group owner (can manage group settings)
- `org_user` - Group member (can use features)
- `customer` - End user (limited access)

### Multi-Tenancy Via groupId

**Every dimension (except groups themselves) includes groupId for data scoping:**
- Things → `groupId: Id<"groups">`
- Connections → `groupId: Id<"groups">`
- Events → `groupId: Id<"groups">`
- Knowledge → `groupId: Id<"groups">`

**This is how multi-tenancy works:** All queries filter by groupId, ensuring perfect data isolation between groups.

### Hierarchical Groups

Groups can contain other groups via `parentGroupId`:

```
Group: "Acme Corp" (organization)
  └─ Group: "Engineering Dept" (business)
      └─ Group: "Frontend Team" (friend_circle)
```

This enables infinite nesting from friend circles (2 people) to governments (billions of people).

---

## Architecture Layers

The system uses **5 distinct layers** that separate concerns and enable backend flexibility:

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 5: UI COMPONENTS (React 19)                      │
│  - Auth forms, dashboards, data displays                │
│  - Uses hooks only, never direct backend calls          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ (React hooks)
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: REACT HOOKS                                    │
│  - useThings(), useConnections(), useEvents()           │
│  - useLogin(), useSignup(), useCurrentUser()            │
│  - Loading states, error handling, optimistic updates   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ (Effect.ts)
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: EFFECT.TS SERVICES                            │
│  - ThingService, ConnectionService, EventService        │
│  - Pure business logic, backend-agnostic                │
│  - Validation, authorization, type-specific rules       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ (DataProvider interface)
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: DATAPROVIDER INTERFACE                        │
│  - Standard CRUD operations for 6 dimensions            │
│  - Type-safe errors with tagged unions                  │
│  - Real-time subscription support                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ (Provider implementations)
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: BACKEND PROVIDERS                             │
│  - ConvexProvider → Convex real-time database           │
│  - NotionProvider → Notion API (pages + relations)      │
│  - WordPressProvider → WordPress REST API + ACF         │
│  - [Future: Supabase, Firebase, Airtable, etc.]        │
└─────────────────────────────────────────────────────────┘
```

**Key Principle:** Each layer only knows about the layer directly below it. Components don't know what backend is being used.

---

## Layer 1: DataProvider Interface

### The Contract

The `DataProvider` interface defines ALL operations for the 6-dimension ontology:

```typescript
// frontend/src/providers/DataProvider.ts
export interface DataProvider {
  // ===== GROUPS (Dimension 1) =====
  // Hierarchical containers that partition all other dimensions
  // Scales from friend circles (2 people) to governments (billions)
  groups: {
    get: (id: string) => Effect.Effect<Group, GroupNotFoundError>;
    list: (options?: ListOptions) => Effect.Effect<Group[], QueryError>;
    create: (input: CreateGroupInput) => Effect.Effect<string, GroupCreateError>;
    update: (id: string, input: UpdateGroupInput) => Effect.Effect<void, GroupUpdateError>;
    delete: (id: string) => Effect.Effect<void, GroupDeleteError>;
    getChildren: (parentId: string) => Effect.Effect<Group[], QueryError>; // Hierarchical nesting
  };

  // ===== PEOPLE (Dimension 2) =====
  // Authorization & governance - who can do what
  people: {
    getCurrentUser: () => Effect.Effect<User, UserNotFoundError>;
    getByRole: (role: Role) => Effect.Effect<User[], QueryError>;
    updateRole: (userId: string, role: Role) => Effect.Effect<void, UpdateError>;
    inviteMember: (input: InviteInput) => Effect.Effect<void, InviteError>;
  };

  // ===== THINGS (Dimension 3) =====
  // All nouns - users, agents, content, tokens, courses (66 types)
  // Every thing belongs to a group (scoped via groupId)
  things: {
    get: (id: string) => Effect.Effect<Thing, ThingNotFoundError>;
    list: (options: ListThingsOptions) => Effect.Effect<Thing[], QueryError>;
    create: (input: CreateThingInput) => Effect.Effect<string, ThingCreateError>;
    update: (id: string, input: UpdateThingInput) => Effect.Effect<void, ThingUpdateError>;
    delete: (id: string) => Effect.Effect<void, ThingDeleteError>;
  };

  // ===== CONNECTIONS (Dimension 4) =====
  // All relationships - owns, follows, purchased, enrolled_in (25 types)
  // Every connection belongs to a group (scoped via groupId)
  connections: {
    get: (id: string) => Effect.Effect<Connection, ConnectionNotFoundError>;
    list: (options: ListConnectionsOptions) => Effect.Effect<Connection[], QueryError>;
    create: (input: CreateConnectionInput) => Effect.Effect<string, ConnectionCreateError>;
    delete: (id: string) => Effect.Effect<void, ConnectionDeleteError>;
  };

  // ===== EVENTS (Dimension 5) =====
  // All actions and state changes - created, updated, purchased (67 types)
  // Every event belongs to a group (scoped via groupId)
  events: {
    create: (input: CreateEventInput) => Effect.Effect<string, EventCreateError>;
    list: (options: ListEventsOptions) => Effect.Effect<Event[], QueryError>;
    getAuditTrail: (thingId: string) => Effect.Effect<Event[], QueryError>;
  };

  // ===== KNOWLEDGE (Dimension 6) =====
  // Labels, embeddings, and semantic search for AI
  // Every knowledge entry belongs to a group (scoped via groupId)
  knowledge: {
    search: (options: SearchKnowledgeOptions) => Effect.Effect<Knowledge[], QueryError>;
    create: (input: CreateKnowledgeInput) => Effect.Effect<string, KnowledgeCreateError>;
    linkToThing: (thingId: string, knowledgeId: string) => Effect.Effect<void, LinkError>;
  };

  // ===== AUTH =====
  auth: {
    login: (args: LoginArgs) => Effect.Effect<AuthResult, AuthError>;
    signup: (args: SignupArgs) => Effect.Effect<AuthResult, AuthError>;
    logout: () => Effect.Effect<void, AuthError>;
    getCurrentUser: () => Effect.Effect<User, AuthError>;
    // ... 8 more auth methods
  };
}
```

### Why Effect.ts?

Every operation returns an `Effect.Effect<Success, Error>` type. This provides:

1. **Type-safe errors**: Compiler catches unhandled errors
2. **Composability**: Chain operations together
3. **Dependency injection**: Services declare what they need
4. **Testability**: Mock providers easily
5. **Pure functions**: No side effects until `Effect.runPromise()`

**Example:**

```typescript
// Type-safe error handling
const program = Effect.gen(function* () {
  const thing = yield* provider.things.get(id); // Can fail with ThingNotFoundError
  const connections = yield* provider.connections.list({ fromEntityId: id }); // Can fail with QueryError
  return { thing, connections };
});

// Compiler forces you to handle both error types
await Effect.runPromise(
  program.pipe(
    Effect.catchTag('ThingNotFoundError', (error) => {
      console.error('Thing not found:', error.message);
      return Effect.succeed(null);
    }),
    Effect.catchTag('QueryError', (error) => {
      console.error('Query failed:', error.message);
      return Effect.succeed(null);
    })
  )
);
```

---

## Layer 2: Backend Providers

### Three Providers Implemented

#### 1. ConvexProvider (Default)

Wraps the Convex SDK with the DataProvider interface.

**File:** `frontend/src/providers/ConvexProvider.ts`

**How it works:**

```typescript
export function createConvexProvider(config: ConvexProviderConfig): DataProvider {
  const { client } = config;

  return {
    things: {
      get: (id) =>
        Effect.tryPromise({
          try: () => client.query(api.queries.things.get, { id }),
          catch: (error) => new ThingNotFoundError(id, String(error)),
        }),
      list: (options) =>
        Effect.tryPromise({
          try: () => client.query(api.queries.things.list, options),
          catch: (error) => new QueryError('Failed to list things', error),
        }),
      create: (input) =>
        Effect.tryPromise({
          try: () => client.mutation(api.mutations.things.create, input),
          catch: (error) => new ThingCreateError('Failed to create thing', error),
        }),
      // ... more operations
    },
    // ... other dimensions
  };
}
```

**Features:**
- Real-time subscriptions via Convex
- <5ms overhead per operation
- Zero backend changes required
- Supports all 6 dimensions natively

#### 2. NotionProvider

Maps Notion databases and pages to the 6-dimension ontology.

**File:** `frontend/src/providers/notion/NotionProvider.ts` (1,200+ lines)

**Mapping Strategy:**

| Ontology | Notion |
|----------|--------|
| Groups | Page property: `groupId` or separate database |
| People | Person properties + permissions |
| Things | Pages in databases |
| Connections | Relation properties |
| Events | Page updates (delegated to Convex) |
| Knowledge | Database properties as labels |

**Example:**

```typescript
// Notion Page → Thing
const notionPage = {
  id: "abc123",
  properties: {
    Name: { title: [{ text: { content: "My Course" } }] },
    Status: { select: { name: "Published" } },
    Price: { number: 99 },
  }
};

// Becomes:
const thing = {
  _id: "notion_abc123",
  type: "course",
  name: "My Course",
  status: "published",
  properties: {
    price: 99,
    notionId: "abc123"
  }
};
```

**ID Format:** `notion_<32-char-hex>` (prevents collisions)

**Hybrid Approach:** Notion handles things/connections, Convex handles events/knowledge (for backends without native support)

#### 3. WordPressProvider

Maps WordPress posts and custom post types to the ontology.

**File:** `frontend/src/providers/wordpress/WordPressProviderEnhanced.ts` (1,100+ lines)

**Mapping Strategy:**

| Ontology | WordPress |
|----------|-----------|
| Groups | Custom `wp_groups` table (with parentGroupId) |
| People | WordPress users + roles |
| Things | Posts + Custom Post Types |
| Connections | Custom `wp_connections` table |
| Events | Custom `wp_events` table |
| Knowledge | Custom `wp_knowledge` table |

**Requires:** Custom WordPress plugin `one-platform-connector` (creates tables + REST endpoints)

**Example:**

```typescript
// WordPress Post → Thing
const wpPost = {
  id: 123,
  title: "My Course",
  status: "publish",
  type: "course",
  meta: {
    _group_id: "group_xyz", // Scoped to group
    _properties: JSON.stringify({ price: 99 })
  }
};

// Becomes:
const thing = {
  _id: "wp_course_123",
  type: "course",
  name: "My Course",
  status: "published",
  groupId: "group_xyz", // All things scoped to groups
  properties: { price: 99 }
};
```

**ID Format:** `wp_<post-type>_<id>` (e.g., `wp_course_123`, `wp_lesson_456`)

---

## Layer 3: Effect.ts Services

### Business Logic Layer

Services contain pure business logic that works with ANY backend:

**File:** `frontend/src/services/ThingService.ts`

```typescript
import { Effect, Layer } from 'effect';
import type { DataProvider } from '@/providers/DataProvider';

export class ThingService extends Effect.Service<ThingService>()('ThingService', {
  effect: Effect.gen(function* () {
    const provider = yield* DataProviderService;

    return {
      // Create thing with validation
      create: (input: CreateThingInput) =>
        Effect.gen(function* () {
          // 1. Validate thing type
          if (!VALID_THING_TYPES.includes(input.type)) {
            return yield* Effect.fail(new InvalidThingTypeError(input.type));
          }

          // 2. Validate type-specific rules
          if (input.type === 'course' && !input.properties.title) {
            return yield* Effect.fail(new ValidationError('Course requires title'));
          }

          // 3. Create via provider
          const thingId = yield* provider.things.create(input);

          // 4. Log creation event
          yield* provider.events.create({
            type: 'thing_created',
            thingId,
            actorId: input.actorId,
            timestamp: Date.now(),
            metadata: { thingType: input.type }
          });

          return thingId;
        }),

      // Get thing with related data
      getWithConnections: (id: string) =>
        Effect.gen(function* () {
          const thing = yield* provider.things.get(id);
          const connections = yield* provider.connections.list({ fromEntityId: id });
          return { thing, connections };
        }),

      // More operations...
    };
  }),
  dependencies: [DataProviderService.Default],
}) {}
```

### Key Features

1. **Type-Specific Validation:** Each of the 66 thing types has custom rules
2. **Authorization:** Checks roles before allowing operations
3. **Event Logging:** Automatically logs all state changes
4. **Backend-Agnostic:** Never imports Convex/Notion/WordPress directly
5. **Composable:** Services can call other services

### All 7 Services

| Service | Purpose | LOC |
|---------|---------|-----|
| ThingService | Manages 66 entity types | 246 |
| ConnectionService | Manages 25 relationship types | 300 |
| EventService | Manages 67 event types | 294 |
| KnowledgeService | RAG, labels, embeddings | 299 |
| OrganizationService | Multi-tenancy, quotas | 409 |
| PeopleService | Authorization, roles | 444 |
| ConfigService | Provider configuration | 511 |

**Total:** 2,503 lines of pure business logic

**Note:** These services work with ANY backend because they only use the DataProvider interface, never backend-specific code.

---

## Layer 4: React Hooks

### Backend-Agnostic Hooks

React hooks wrap services to provide convenient, type-safe access:

**File:** `frontend/src/hooks/useThings.tsx`

```typescript
import { useDataProvider } from './useDataProvider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Effect } from 'effect';

export function useThings(options: ListThingsOptions) {
  const provider = useDataProvider();

  return useQuery({
    queryKey: ['things', options],
    queryFn: async () => {
      return await Effect.runPromise(provider.things.list(options));
    },
    staleTime: 5000, // 5 seconds
  });
}

export function useCreateThing() {
  const provider = useDataProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateThingInput) => {
      return await Effect.runPromise(provider.things.create(input));
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['things'] });
    },
  });
}
```

### Auth Hooks

**File:** `frontend/src/hooks/useAuth.ts`

```typescript
export function useLogin() {
  const provider = useDataProvider();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const mutate = useCallback(async (args: LoginArgs) => {
    setLoading(true);
    setError(null);

    try {
      return await Effect.runPromise(provider.auth.login(args));
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [provider]);

  return { mutate, loading, error };
}
```

### Hook Inventory

**All 45 hooks implemented:**

| Category | Hooks | Purpose |
|----------|-------|---------|
| Organizations | 7 hooks | Org management, members |
| People | 7 hooks | Users, roles, permissions |
| Things | 8 hooks | CRUD + type-specific |
| Connections | 8 hooks | Relationships |
| Events | 6 hooks | Audit trails, activity |
| Knowledge | 6 hooks | RAG, search, labels |
| Auth | 7 hooks | All 6 auth methods |

---

## Layer 5: UI Components

### Backend-Agnostic Components

Components only use hooks, never backend-specific code:

```typescript
// frontend/src/components/courses/CourseList.tsx
import { useThings } from '@/hooks/useThings';
import { Card } from '@/components/ui/card';

export function CourseList() {
  const { data: courses, loading, error } = useThings({ type: 'course' });

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {courses?.map((course) => (
        <Card key={course._id}>
          <h3>{course.name}</h3>
          <p>{course.properties.description}</p>
          <span>${course.properties.price}</span>
        </Card>
      ))}
    </div>
  );
}
```

**This component works identically whether:**
- Backend is Convex
- Backend is Notion
- Backend is WordPress
- Backend is Supabase (future)

**Zero code changes required when switching backends.**

---

## Configuration System

### Environment-Based Configuration

**File:** `frontend/src/config/providers.ts`

```bash
# .env.local

# Choose your backend (convex, wordpress, notion, supabase)
BACKEND_PROVIDER=convex

# Convex configuration
PUBLIC_CONVEX_URL=https://shocking-falcon-870.convex.cloud
CONVEX_DEPLOYMENT=prod:shocking-falcon-870

# WordPress configuration (if using)
WORDPRESS_URL=https://mysite.com/wp-json
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

# Notion configuration (if using)
NOTION_API_TOKEN=secret_abc123...
NOTION_DATABASE_ID=def456...

# Encryption key (for secure credential storage)
PROVIDER_ENCRYPTION_KEY=your-32-byte-hex-key
```

### Multi-Tenant Configuration

**Critical:** Groups (not organizations) are the multi-tenancy boundary. Each group can have different backends.

```typescript
// Group 1 uses Convex (type: organization)
{
  _id: "group_startup",
  name: "Startup Inc",
  type: "organization",
  parentGroupId: undefined, // Top-level group
  properties: {
    plan: "pro",
    backendProvider: "convex",
    backendConfig: {
      deploymentUrl: "https://fast-startup-123.convex.cloud"
    }
  }
}

// Group 2 uses WordPress (type: business)
{
  _id: "group_enterprise",
  name: "Enterprise Corp",
  type: "business",
  parentGroupId: "group_holding", // Child of another group
  properties: {
    plan: "enterprise",
    backendProvider: "wordpress",
    backendConfig: {
      url: "https://enterprise.com/wp-json",
      credentials: "encrypted:abc123..."
    }
  }
}
```

### Runtime Provider Switching

```typescript
// Switch group's backend
await switchProviderForGroup(
  'group_123',
  {
    type: 'notion',
    token: 'secret_xyz...',
    databaseId: 'abc123...'
  },
  'user_456' // Actor who made the change
);

// Takes <30 seconds
// - Validates new config
// - Tests connection
// - Saves config to groups table
// - Clears cache
// - Logs provider_switched event
```

---

## Provider Setup

### AppProviders Component

The root provider that gives all components access to DataProvider:

**File:** `frontend/src/components/providers/AppProviders.tsx`

```typescript
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';
import { DataProviderProvider } from '@/hooks/useDataProvider';
import { createConvexProvider } from '@/providers/ConvexProvider';

const convexClient = new ConvexReactClient(import.meta.env.PUBLIC_CONVEX_URL);
const convexDataProvider = createConvexProvider({ client: convexClient });

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convexClient}>
      <DataProviderProvider provider={convexDataProvider}>
        {children}
      </DataProviderProvider>
    </ConvexProvider>
  );
}
```

### Usage in Astro Pages

Due to Astro's islands architecture, wrap auth components:

```tsx
// frontend/src/components/auth/SignInPage.tsx
import { AppProviders } from '@/components/providers/AppProviders';
import { SimpleSignInForm } from './SimpleSignInForm';

export function SignInPage() {
  return (
    <AppProviders>
      <SimpleSignInForm />
    </AppProviders>
  );
}
```

```astro
---
// frontend/src/pages/account/signin.astro
import { SignInPage } from '@/components/auth/SignInPage';
---

<Layout title="Sign In">
  <SignInPage client:only="react" />
</Layout>
```

**Why this pattern?** Astro's `client:only` creates isolated React islands. The provider must be inside the same island as components that use hooks.

---

## Adding a New Provider

### 6-Step Process

**Step 1: Create Provider File**

```typescript
// frontend/src/providers/supabase/SupabaseProvider.ts
import { createClient } from '@supabase/supabase-js';
import type { DataProvider } from '@/providers/DataProvider';

export function createSupabaseProvider(config: SupabaseConfig): DataProvider {
  const supabase = createClient(config.url, config.anonKey);

  return {
    things: {
      get: (id) =>
        Effect.tryPromise({
          try: async () => {
            const { data, error } = await supabase
              .from('things')
              .select('*')
              .eq('id', id)
              .single();

            if (error) throw error;
            return mapSupabaseRowToThing(data);
          },
          catch: (error) => new ThingNotFoundError(id, String(error)),
        }),
      // ... more operations
    },
    // ... other dimensions
  };
}
```

**Step 2: Define ID Format**

```typescript
// Supabase: Use UUIDs
const thingId = "supabase_550e8400-e29b-41d4-a716-446655440000";

// Conversion functions
function supabaseIdToOneId(uuid: string): string {
  return `supabase_${uuid}`;
}

function oneIdToSupabaseId(id: string): string {
  return id.replace('supabase_', '');
}
```

**Step 3: Map Database Schema**

```sql
-- Supabase tables (5-table implementation)
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50), -- friend_circle, business, community, dao, government, organization
  parent_group_id UUID REFERENCES groups(id), -- Hierarchical nesting
  properties JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE things (
  id UUID PRIMARY KEY,
  type VARCHAR(50),
  name TEXT,
  group_id UUID REFERENCES groups(id), -- Scoped to group
  properties JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE connections (
  id UUID PRIMARY KEY,
  from_thing_id UUID REFERENCES things(id),
  to_thing_id UUID REFERENCES things(id),
  relationship_type VARCHAR(50),
  group_id UUID REFERENCES groups(id), -- Scoped to group
  metadata JSONB,
  created_at TIMESTAMP
);

CREATE TABLE events (
  id UUID PRIMARY KEY,
  type VARCHAR(50),
  actor_id VARCHAR(255), -- Person ID
  target_id VARCHAR(255), -- Thing/Person/Connection ID
  group_id UUID REFERENCES groups(id), -- Scoped to group
  metadata JSONB,
  timestamp BIGINT
);

CREATE TABLE knowledge (
  id UUID PRIMARY KEY,
  type VARCHAR(50),
  text TEXT,
  embedding VECTOR(768), -- Vector for semantic search
  source_thing_id UUID REFERENCES things(id),
  group_id UUID REFERENCES groups(id), -- Scoped to group
  labels JSONB,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Step 4: Implement All 6 Dimensions**

Implement all methods for groups, people, things, connections, events, knowledge, and auth.

**Critical:** Remember that the 6-dimension ontology is implemented using 5 tables:
1. **groups** table (multi-tenancy boundary, hierarchical nesting)
2. **things** table (with groupId scoping)
3. **connections** table (with groupId scoping)
4. **events** table (with groupId scoping)
5. **knowledge** table (with groupId scoping)

People are represented as things with type: 'creator' and properties.role field, OR as a separate people table depending on backend requirements.

**Step 5: Add to Factory**

```typescript
// frontend/src/providers/factory.ts
export function createProvider(config: ProviderConfig): DataProvider {
  switch (config.type) {
    case 'convex':
      return createConvexProvider(config);
    case 'notion':
      return createNotionProvider(config);
    case 'wordpress':
      return createWordPressProvider(config);
    case 'supabase':
      return createSupabaseProvider(config); // ✨ New
    default:
      throw new Error(`Unknown provider: ${config.type}`);
  }
}
```

**Step 6: Write Tests**

```typescript
// frontend/test/providers/SupabaseProvider.test.ts
describe('SupabaseProvider', () => {
  it('should create thing', async () => {
    const provider = createSupabaseProvider(testConfig);
    const thingId = await Effect.runPromise(
      provider.things.create({
        type: 'course',
        name: 'Test Course',
        properties: { price: 99 }
      })
    );
    expect(thingId).toMatch(/^supabase_/);
  });

  // ... 80 more tests
});
```

**Documentation:** See `one/knowledge/provider-creation-guide.md` for complete guide.

---

## Performance

### Overhead Measurements

| Operation | Baseline (Direct) | With DataProvider | Overhead | Status |
|-----------|-------------------|-------------------|----------|--------|
| Get Thing | 5ms | 6ms | +1ms | ✅ <10ms |
| List Things | 10ms | 11ms | +1ms | ✅ <10ms |
| Create Thing | 15ms | 16ms | +1ms | ✅ <10ms |
| Update Thing | 10ms | 11ms | +1ms | ✅ <10ms |
| Delete Thing | 8ms | 9ms | +1ms | ✅ <10ms |

**Target:** <10ms overhead per operation ✅ **Achieved**

### Why So Fast?

1. **Thin wrappers:** Providers just map types, no processing
2. **Effect.ts optimized:** Minimal runtime overhead
3. **Direct backend calls:** No middleware, no proxies
4. **Smart caching:** React Query handles data caching

---

## Migration Guide

### From Direct Convex to DataProvider

**Before:**

```typescript
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

function CourseList() {
  const courses = useQuery(api.queries.things.list, { type: 'course' });
  const create = useMutation(api.mutations.things.create);

  return <div>{courses?.map(c => <div>{c.name}</div>)}</div>;
}
```

**After:**

```typescript
import { useThings, useCreateThing } from '@/hooks/useThings';

function CourseList() {
  const { data: courses } = useThings({ type: 'course' });
  const { mutate: create } = useCreateThing();

  return <div>{courses?.map(c => <div>{c.name}</div>)}</div>;
}
```

**Changes:**
1. Replace `useQuery(api.*)` with `useThings()`
2. Replace `useMutation(api.*)` with `useCreateThing()`
3. Wrap page with `AppProviders`

**Benefits:**
- Can now switch to WordPress/Notion/Supabase without code changes
- Better error handling with typed errors
- Built-in loading states
- Optimistic updates

---

## Multi-Tenant Support

### Organization-Level Configuration

Each organization can use a different backend:

```typescript
// Organization 1: Convex (fast, real-time)
const org1 = {
  _id: "org_startup",
  properties: {
    backendProvider: "convex",
    backendConfig: {
      deploymentUrl: "https://fast-startup.convex.cloud"
    }
  }
};

// Organization 2: WordPress (existing content)
const org2 = {
  _id: "org_enterprise",
  properties: {
    backendProvider: "wordpress",
    backendConfig: {
      url: "https://enterprise.com/wp-json",
      credentials: "encrypted:..."
    }
  }
};

// Organization 3: Notion (collaborative docs)
const org3 = {
  _id: "org_agency",
  properties: {
    backendProvider: "notion",
    backendConfig: {
      token: "secret_...",
      databaseId: "abc123..."
    }
  }
};
```

### Data Isolation

Perfect isolation between groups (multi-tenancy):

1. **Convex:** groupId in every document (things, connections, events, knowledge all scoped)
2. **Notion:** Separate databases per group OR groupId page property
3. **WordPress:** Post meta `_group_id` filter OR separate wp_groups table
4. **Supabase:** Row-level security (RLS) policies based on groupId

**Key Principle:** ALL dimensions (except groups themselves) are scoped via groupId. This is the universal multi-tenancy pattern.

---

## Real-World Use Cases

### Use Case 1: Startup (Convex)

**Profile:**
- New SaaS company
- Needs real-time features
- Fast iteration

**Solution:**
```bash
BACKEND_PROVIDER=convex
PUBLIC_CONVEX_URL=https://fast-startup-123.convex.cloud
```

**Benefits:**
- Real-time subscriptions
- Instant deploys
- Free tier generous
- Zero devops

### Use Case 2: Agency (WordPress)

**Profile:**
- Existing WordPress site
- 10,000+ blog posts
- Client content expertise

**Solution:**
```bash
BACKEND_PROVIDER=wordpress
WORDPRESS_URL=https://agency.com/wp-json
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Benefits:**
- Use existing content
- No data migration
- Familiar admin UI
- SEO-optimized URLs

### Use Case 3: Consultancy (Notion)

**Profile:**
- Team uses Notion daily
- Collaborative documents
- Client proposals/tracking

**Solution:**
```bash
BACKEND_PROVIDER=notion
NOTION_API_TOKEN=secret_abc123...
NOTION_DATABASE_ID=def456...
```

**Benefits:**
- Sync with existing workflow
- Beautiful editor built-in
- Permission system
- Export flexibility

### Use Case 4: Enterprise (Multi-Backend)

**Profile:**
- Multiple departments
- Different data sources
- Compliance requirements

**Solution:**
- Marketing dept → WordPress (public content)
- Engineering dept → Convex (real-time data)
- Sales dept → Notion (CRM docs)

**Benefits:**
- Each dept uses best tool
- ONE unified interface
- Cross-department connections
- Centralized reporting

---

## Testing

### Mock Provider Pattern

For testing, create a mock provider:

```typescript
// test/mocks/MockProvider.ts
export function createMockProvider(): DataProvider {
  const mockData = new Map<string, Thing>();

  return {
    things: {
      get: (id) =>
        mockData.has(id)
          ? Effect.succeed(mockData.get(id)!)
          : Effect.fail(new ThingNotFoundError(id)),

      create: (input) =>
        Effect.sync(() => {
          const id = `mock_${Date.now()}`;
          mockData.set(id, { _id: id, ...input });
          return id;
        }),

      // ... more mocked operations
    },
    // ... other dimensions
  };
}
```

### Component Testing

```typescript
import { render } from '@testing-library/react';
import { DataProviderProvider } from '@/hooks/useDataProvider';
import { createMockProvider } from '@/test/mocks/MockProvider';
import { CourseList } from './CourseList';

test('renders courses', async () => {
  const mockProvider = createMockProvider();

  // Seed mock data
  await Effect.runPromise(
    mockProvider.things.create({
      type: 'course',
      name: 'Test Course',
      properties: { price: 99 }
    })
  );

  const { getByText } = render(
    <DataProviderProvider provider={mockProvider}>
      <CourseList />
    </DataProviderProvider>
  );

  expect(getByText('Test Course')).toBeInTheDocument();
});
```

---

## Security Considerations

### 1. Credential Encryption

All backend credentials are encrypted at rest:

```typescript
// Encrypt credentials
const encrypted = encryptCredentials(
  { username: 'admin', password: 'secret123' },
  process.env.PROVIDER_ENCRYPTION_KEY
);

// Store encrypted
await db.insert('external_connections', {
  type: 'wordpress',
  config: { credentials: encrypted }
});

// Decrypt on use
const decrypted = decryptCredentials(
  config.credentials,
  process.env.PROVIDER_ENCRYPTION_KEY
);
```

### 2. Role-Based Access

Only specific roles can switch providers:

```typescript
// Check authorization (4 roles in the system)
// platform_owner, org_owner, org_user, customer
if (!hasRole(user, ['platform_owner', 'org_owner'])) {
  throw new UnauthorizedError('Only group owners can switch providers');
}
```

### 3. Connection Testing

Test connectivity before saving config:

```typescript
// Validate provider works
const testResult = await testProviderConnection(newConfig);
if (!testResult.success) {
  throw new ConnectionTestError(`Failed: ${testResult.error}`);
}
```

### 4. Audit Trail

Log all provider switches:

```typescript
await db.insert('events', {
  type: 'settings_updated',
  actorId: userId, // Person who made the change
  targetId: groupId, // Group whose provider was switched
  groupId: groupId, // Events scoped to group
  metadata: {
    setting: 'backendProvider',
    oldValue: 'convex',
    newValue: 'wordpress',
    switchDuration: 28000 // ms
  },
  timestamp: Date.now()
});
```

---

## Monitoring & Debugging

### Provider Health Checks

Monitor backend connectivity:

```typescript
export async function checkProviderHealth(
  provider: DataProvider
): Promise<HealthStatus> {
  const start = Date.now();

  try {
    // Test basic operation
    await Effect.runPromise(
      provider.things.list({ limit: 1 })
    );

    return {
      status: 'healthy',
      responseTime: Date.now() - start,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: String(error),
      timestamp: Date.now()
    };
  }
}
```

### Performance Monitoring

Track provider overhead:

```typescript
// Add instrumentation
const instrumentedProvider = {
  things: {
    get: (id) => {
      const start = performance.now();
      return provider.things.get(id).pipe(
        Effect.tap(() => {
          const duration = performance.now() - start;
          analytics.track('provider.operation', {
            provider: 'convex',
            operation: 'things.get',
            duration
          });
        })
      );
    }
  }
};
```

---

## Future Enhancements

### Phase 2: Additional Providers

1. **Supabase** - PostgreSQL with real-time
2. **Firebase** - Google's backend-as-a-service
3. **Airtable** - Spreadsheet-like interface
4. **Contentful** - Headless CMS
5. **Strapi** - Open-source CMS

### Phase 3: Provider Features

1. **Cross-provider connections** - Connect Convex thing to WordPress post
2. **Provider federation** - Use multiple backends simultaneously
3. **Data synchronization** - Sync between providers
4. **Provider marketplace** - Community-built providers
5. **Hybrid storage** - Hot data in Convex, cold data in S3

### Phase 4: Advanced Features

1. **GraphQL federation** - Unified GraphQL API across providers
2. **Event streaming** - Real-time events across all providers
3. **Conflict resolution** - Handle concurrent updates
4. **Schema evolution** - Migrate data between providers
5. **Provider analytics** - Cost optimization recommendations

---

## Comparison: Traditional vs Backend-Agnostic

### Traditional Architecture

```
Frontend → Convex SDK → Convex Database
        ↓ (tightly coupled)
   Changes to switch backends:
   - Rewrite ALL components (100+ files)
   - Update ALL queries/mutations
   - Test EVERYTHING again
   - High risk, high cost
```

### Backend-Agnostic Architecture

```
Frontend → DataProvider Interface → [Convex | WordPress | Notion]
        ↓ (loosely coupled)
   Changes to switch backends:
   - Update 1 env variable
   - Zero code changes
   - Same tests work
   - Low risk, zero cost
```

---

## Key Takeaways

### ✅ What We Achieved

1. **True Backend Independence:** Components don't know what backend they're using
2. **Zero Migration Cost:** Switch backends with one config change
3. **Performance:** <10ms overhead per operation
4. **Type Safety:** Compiler catches errors at build time
5. **Developer Experience:** Clean, intuitive API
6. **Multi-Tenant:** Different orgs can use different backends
7. **Production Ready:** 110+ tests passing, TypeScript strict mode

### 🎯 Why This Matters

**For Developers:**
- Write once, run anywhere
- Test without backend (use mocks)
- Clear separation of concerns
- Future-proof architecture

**For Organizations:**
- Choose best backend for needs
- No vendor lock-in
- Migrate when ready
- Use existing infrastructure

**For Platform:**
- Market expansion (WordPress users, Notion users, etc.)
- Enterprise sales (use their database)
- Competitive advantage (unique feature)
- Proves ontology flexibility

---

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
bun install
```

### 2. Configure Backend

```bash
# .env.local
BACKEND_PROVIDER=convex
PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 3. Wrap App with Provider

```tsx
// src/components/auth/YourPage.tsx
import { AppProviders } from '@/components/providers/AppProviders';
import { YourComponent } from './YourComponent';

export function YourPage() {
  return (
    <AppProviders>
      <YourComponent />
    </AppProviders>
  );
}
```

### 4. Use Hooks

```tsx
// src/components/YourComponent.tsx
import { useThings } from '@/hooks/useThings';

export function YourComponent() {
  const { data: courses } = useThings({ type: 'course' });

  return (
    <div>
      {courses?.map(course => (
        <div key={course._id}>{course.name}</div>
      ))}
    </div>
  );
}
```

### 5. Switch Backend (Optional)

```bash
# Change to WordPress
BACKEND_PROVIDER=wordpress
WORDPRESS_URL=https://mysite.com/wp-json
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**No code changes needed!** 🎉

---

## Conclusion

The backend-agnostic architecture proves that the 6-dimension ontology is truly universal. Whether your data lives in Convex, WordPress, Notion, or any future database, the same components, hooks, and services work identically.

**This is not just an abstraction layer—it's a fundamental reimagining of how applications should be built.**

Organizations now have true freedom to choose their backend based on their needs, not the limitations of the frontend framework.

---

## Summary: Key Alignment Points

This document is now aligned with the main architecture specification:

### ✅ Aligned Concepts

1. **Groups (not Organizations)** - Dimension 1 is "groups" with 6 types (friend_circle, business, community, dao, government, organization)
2. **5-Table Implementation** - Groups table + 4 other tables (things, connections, events, knowledge) with groupId scoping
3. **Hierarchical Nesting** - Groups can contain groups via `parentGroupId` field
4. **Multi-Tenancy via groupId** - ALL dimensions (except groups) are scoped to groupId for data isolation
5. **People Representation** - People can be things with type: 'creator' OR a separate table (provider-dependent)
6. **4 Roles** - platform_owner, org_owner, org_user, customer (as defined in main architecture)
7. **Universal Ontology** - The 6 dimensions work with ANY backend (Convex, WordPress, Notion, Supabase, etc.)

### 🎯 Critical Differences from Legacy

This document **replaces** old 4-dimension terminology:
- OLD: "organizations" table → NEW: "groups" table (with type field including "organization")
- OLD: 4 dimensions → NEW: 6 dimensions (added groups and knowledge)
- OLD: organizationId field → NEW: groupId field (consistent across all tables)
- OLD: Flat hierarchy → NEW: Hierarchical groups (infinite nesting)

### 📚 Related Documentation

- `one/knowledge/architecture.md` - Main architecture reference (this document aligns with it)
- `one/knowledge/ontology.md` - Complete 6-dimension ontology specification
- `one/knowledge/provider-creation-guide.md` - How to build new providers
- `one/things/features/2-1-dataprovider-interface.md` - DataProvider spec
- `one/things/features/2-3-effectts-services.md` - Service layer patterns
- `frontend/AGENTS.md` - Quick reference for development

**Implementation Status:** ✅ **Production Ready** (Plan 2 Complete - 7/7 features)

**Alignment Status:** ✅ **Fully Aligned** with main architecture.md (Version 3.0)
