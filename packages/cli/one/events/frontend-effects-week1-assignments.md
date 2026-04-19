---
title: Frontend Effects Week1 Assignments
dimension: events
category: frontend-effects-week1-assignments.md
tags: backend, frontend, cycle, ui
related_dimensions: connections, groups, knowledge, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the events dimension in the frontend-effects-week1-assignments.md category.
  Location: one/events/frontend-effects-week1-assignments.md
  Purpose: Documents frontend effects.ts implementation: week 1 assignments & first tasks
  Related dimensions: connections, groups, knowledge, people, things
  For AI agents: Read this to understand frontend effects week1 assignments.
---

# Frontend Effects.ts Implementation: Week 1 Assignments & First Tasks

**Project Status:** Completed and Deployed (Documented for Future Reference & Replication)

This document describes how Week 1 was executed for the Frontend Effects.ts implementation (Cycle 1-20). Use this as a reference for running similar parallel-execution projects.

---

## Week 1 Overview

**Duration:** October 28 - November 3 (Days 1-5)
**Phases:** Phase 1 (Cycle 1-10) + Phase 2 (Cycle 11-20)
**Specialist Count:** 3 active (Frontend Lead, Backend Specialist, Frontend Specialist)
**Cycles Completed:** 20/100
**Progress:** 20% → Gate 2 approval

---

## Specialist Stream A: DataProvider Interface (Backend Specialist)

### Stream Lead: Backend Specialist (1 FTE)
**Phase:** 2 (Cycle 11-20)
**Duration:** Oct 28 - Nov 2 (Days 1-5)
**Goal:** Complete DataProvider interface with all 6 dimensions, error types, documentation

---

### Task A-1: Create `/web/src/providers/DataProvider.ts` Stub (Cycle 11)
**Assigned to:** Backend Specialist
**Duration:** 45 min
**Effort:** 5 Cycle points
**Dependencies:** None

**Instructions:**
1. Create new file: `/web/src/providers/DataProvider.ts`
2. Add file header with documentation
3. Import Effect and Context from 'effect'
4. Create base DataProvider interface stub
5. Add placeholder for all 6 dimensions (groups, people, things, connections, events, knowledge)
6. Add TODO comments for each dimension

**Expected Output:**
```typescript
// /web/src/providers/DataProvider.ts
/**
 * DataProvider Interface - Backend-Agnostic Data Access Layer
 *
 * Supports 6 dimensions of ONE ontology:
 * 1. groups - Hierarchical organization containers
 * 2. people - User authorization & governance
 * 3. things - All entities (users, content, tokens, courses)
 * 4. connections - All relationships (owns, part_of, enrolled_in)
 * 5. events - All actions & state changes
 * 6. knowledge - Labels, embeddings, semantic search
 */

import { Effect, Context } from "effect";

export interface DataProvider {
  groups: GroupsAPI;      // TODO: Define in Cycle-012
  people: PeopleAPI;      // TODO: Define in Cycle-013
  things: ThingsAPI;      // TODO: Define in Cycle-014
  connections: ConnectionsAPI; // TODO: Define in Cycle-015
  events: EventsAPI;      // TODO: Define in Cycle-016
  knowledge: KnowledgeAPI; // TODO: Define in Cycle-017
}

// Placeholder for error types (to be defined in Cycle-018)
export type DataProviderError = unknown;

// Placeholder for Context.Tag (to be defined in Cycle-020)
// export const DataProviderTag = ...
```

**Acceptance Criteria:**
- [ ] File created at correct path
- [ ] Imports correct (Effect, Context)
- [ ] Base interface structure defined
- [ ] TODO comments guide next cycles
- [ ] No TypeScript errors
- [ ] Build passes: `bunx astro check`

**File Path:** `/web/src/providers/DataProvider.ts`

---

### Task A-2: Define Groups Interface (Cycle 12)
**Assigned to:** Backend Specialist
**Duration:** 1 hour
**Effort:** 6 Cycle points
**Dependencies:** Task A-1 (DataProvider stub)

**Instructions:**
1. Add GroupsAPI interface to DataProvider.ts
2. Define methods: get, list, update, getCurrent
3. Use Effect.Effect for return types
4. Add error types for each method
5. Add JSDoc comments explaining ontology mapping
6. Type Group and ListParams

**Expected Output:**
```typescript
export interface GroupsAPI {
  get: (id: string) => Effect.Effect<Group, GroupNotFoundError>;
  list: (params?: ListParams) => Effect.Effect<Group[], Error>;
  update: (id: string, updates: Partial<Group>) => Effect.Effect<void, Error>;
  getCurrent: () => Effect.Effect<Group, GroupNotFoundError>;
}

export interface Group {
  _id: string;
  name: string;
  type: "friend_circle" | "business" | "community" | "dao" | "government" | "organization";
  parentGroupId?: string; // For hierarchical nesting
  properties: Record<string, unknown>;
  status: "draft" | "active" | "archived";
  createdAt: number;
  updatedAt: number;
}
```

**Acceptance Criteria:**
- [ ] GroupsAPI interface complete
- [ ] All methods typed with Effect.Effect
- [ ] Error types defined (GroupNotFoundError, etc.)
- [ ] JSDoc comments explain ontology dimension
- [ ] Group type reflects 6-dimension ontology
- [ ] No TypeScript errors
- [ ] Compiles successfully

**File Path:** `/web/src/providers/DataProvider.ts` (GroupsAPI section)

---

### Task A-3: Define People Interface (Cycle 13)
**Assigned to:** Backend Specialist
**Duration:** 1 hour
**Effort:** 6 Cycle points
**Dependencies:** Task A-2

**Instructions:**
1. Add PeopleAPI interface to DataProvider.ts
2. Define methods: get, list, create, update, delete, getCurrentUser
3. Add CreatePersonInput and UpdatePersonInput types
4. Use Effect.Effect for return types
5. Add JSDoc explaining role-based authorization

**Expected Output:**
```typescript
export interface PeopleAPI {
  get: (id: string) => Effect.Effect<Person, PersonNotFoundError>;
  list: (params: ListParams) => Effect.Effect<Person[], Error>;
  create: (input: CreatePersonInput) => Effect.Effect<string, Error>;
  update: (id: string, updates: Partial<Person>) => Effect.Effect<void, Error>;
  delete: (id: string) => Effect.Effect<void, Error>;
  getCurrentUser: () => Effect.Effect<Person, UnauthorizedError>;
}

export interface Person {
  _id: string;
  email: string;
  role: "platform_owner" | "org_owner" | "org_user" | "customer";
  // ... more fields
}
```

**Acceptance Criteria:**
- [ ] PeopleAPI interface complete
- [ ] All CRUD methods defined
- [ ] Role type includes all 4 roles
- [ ] Error types: PersonNotFoundError, UnauthorizedError
- [ ] JSDoc comments document authorization dimension
- [ ] No TypeScript errors

**File Path:** `/web/src/providers/DataProvider.ts` (PeopleAPI section)

---

### Task A-4: Define Things Interface (Cycle 14)
**Assigned to:** Backend Specialist
**Duration:** 1.5 hours
**Effort:** 8 Cycle points
**Dependencies:** Task A-3

**Instructions:**
1. Add ThingsAPI interface
2. Define CRUD methods: get, list, create, update, delete
3. Add type filtering support
4. Define CreateThingInput and UpdateThingInput
5. Add type definitions for Thing entity

**Expected Output:**
```typescript
export interface ThingsAPI {
  get: (id: string) => Effect.Effect<Thing, ThingNotFoundError>;
  list: (params: { type: ThingType; groupId?: string })
    => Effect.Effect<Thing[], Error>;
  create: (input: CreateThingInput) => Effect.Effect<string, ThingCreateError>;
  update: (id: string, updates: Partial<Thing>)
    => Effect.Effect<void, ThingUpdateError>;
  delete: (id: string) => Effect.Effect<void, Error>;
}

export interface Thing {
  _id: string;
  groupId: string; // Multi-tenant scoping
  type: ThingType;
  name: string;
  properties: Record<string, unknown>;
  status: "draft" | "active" | "published" | "archived";
  createdAt: number;
  updatedAt: number;
}

export type ThingType = "creator" | "course" | "lesson" | "token" | ... // 66 types
```

**Acceptance Criteria:**
- [ ] ThingsAPI CRUD methods complete
- [ ] Thing type includes groupId (ontology scoping)
- [ ] Type filtering works (list by type)
- [ ] Error types: ThingNotFoundError, ThingCreateError, ThingUpdateError
- [ ] Properties field allows flexible data
- [ ] No TypeScript errors

**File Path:** `/web/src/providers/DataProvider.ts` (ThingsAPI section)

---

### Task A-5: Define Connections Interface (Cycle 15)
**Assigned to:** Backend Specialist
**Duration:** 1 hour
**Effort:** 6 Cycle points
**Dependencies:** Task A-4

**Instructions:**
1. Add ConnectionsAPI interface
2. Define methods: create, getRelated, getCount, delete
3. Add CreateConnectionInput type
4. Define Connection type with relationship metadata

**Expected Output:**
```typescript
export interface ConnectionsAPI {
  create: (input: CreateConnectionInput)
    => Effect.Effect<string, ConnectionCreateError>;
  getRelated: (thingId: string)
    => Effect.Effect<Connection[], Error>;
  getCount: (thingId: string)
    => Effect.Effect<number, Error>;
  delete: (connectionId: string)
    => Effect.Effect<void, Error>;
}

export interface Connection {
  _id: string;
  fromThingId: string;
  toThingId: string;
  relationshipType: ConnectionType;
  metadata?: Record<string, unknown>;
  validFrom?: number;
  validTo?: number;
}

export type ConnectionType = "owns" | "part_of" | "enrolled_in" | ... // 25 types
```

**Acceptance Criteria:**
- [ ] ConnectionsAPI methods complete
- [ ] Relationship types match ontology (owns, part_of, etc.)
- [ ] Metadata field allows rich context
- [ ] Temporal validity (validFrom/validTo) supported
- [ ] Error types defined
- [ ] No TypeScript errors

**File Path:** `/web/src/providers/DataProvider.ts` (ConnectionsAPI section)

---

### Task A-6: Define Events Interface (Cycle 16)
**Assigned to:** Backend Specialist
**Duration:** 45 min
**Effort:** 5 Cycle points
**Dependencies:** Task A-5

**Instructions:**
1. Add EventsAPI interface
2. Define methods: log (with actor/target), query
3. Add LogEventInput and QueryEventsInput types
4. Define Event type with audit trail

**Expected Output:**
```typescript
export interface EventsAPI {
  log: (event: LogEventInput) => Effect.Effect<void, EventCreateError>;
  query: (params: QueryEventsInput) => Effect.Effect<Event[], Error>;
}

export interface Event {
  _id: string;
  type: EventType;
  actorId?: string; // Who did the action
  targetId?: string; // What was affected
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type EventType =
  | "entity_created" | "entity_updated" | "entity_deleted"
  | "connection_formed" | "connection_deleted"
  | ... // 67 event types
```

**Acceptance Criteria:**
- [ ] EventsAPI log and query methods
- [ ] Actor/target tracking for audit trail
- [ ] Timestamp on all events
- [ ] Event types cover create/update/delete
- [ ] Metadata supports rich context
- [ ] No TypeScript errors

**File Path:** `/web/src/providers/DataProvider.ts` (EventsAPI section)

---

### Task A-7: Define Knowledge Interface (Cycle 17)
**Assigned to:** Backend Specialist
**Duration:** 1 hour
**Effort:** 6 Cycle points
**Dependencies:** Task A-6

**Instructions:**
1. Add KnowledgeAPI interface
2. Define methods: embed (text → vector), search
3. Add SearchInput and SearchResult types
4. Support vector similarity search

**Expected Output:**
```typescript
export interface KnowledgeAPI {
  embed: (text: string) => Effect.Effect<number[], EmbeddingError>;
  search: (params: SearchInput)
    => Effect.Effect<KnowledgeChunk[], Error>;
  queryByVector: (vector: number[])
    => Effect.Effect<KnowledgeChunk[], Error>;
}

export interface SearchInput {
  query: string;
  groupId?: string;
  limit?: number;
  threshold?: number; // Similarity threshold
}

export interface KnowledgeChunk {
  _id: string;
  text: string;
  embedding: number[];
  similarity?: number; // For search results
  metadata?: Record<string, unknown>;
}
```

**Acceptance Criteria:**
- [ ] KnowledgeAPI embed and search methods
- [ ] Embedding returns vector (number[])
- [ ] Search supports similarity threshold
- [ ] GroupId scoping for multi-tenant
- [ ] Error types: EmbeddingError
- [ ] No TypeScript errors

**File Path:** `/web/src/providers/DataProvider.ts` (KnowledgeAPI section)

---

### Task A-8: Define Error Hierarchy (Cycle 18)
**Assigned to:** Backend Specialist
**Duration:** 1.5 hours
**Effort:** 8 Cycle points
**Dependencies:** Tasks A-2 through A-7

**Instructions:**
1. Create error classes for all 12 domain errors
2. Use Data.TaggedError pattern for Effect compatibility
3. Include error message and context (id, cause, etc.)
4. Create error union type: DataProviderError
5. Add JSDoc explaining error recovery

**Expected Output:**
```typescript
// Domain errors
export class GroupNotFoundError {
  readonly _tag = "GroupNotFoundError";
  constructor(readonly id: string, readonly message?: string) {}
}

export class ThingNotFoundError {
  readonly _tag = "ThingNotFoundError";
  constructor(readonly id: string, readonly message?: string) {}
}

export class ThingCreateError {
  readonly _tag = "ThingCreateError";
  constructor(readonly message: string, readonly cause?: unknown) {}
}

// ... 9 more error types

export type DataProviderError =
  | GroupNotFoundError | PersonNotFoundError | ThingNotFoundError
  | ThingCreateError | ThingUpdateError | ConnectionNotFoundError
  | ConnectionCreateError | EventCreateError | KnowledgeNotFoundError
  | ValidationError | AuthorizationError | ProviderError;
```

**Acceptance Criteria:**
- [ ] All 12 error types defined
- [ ] _tag field for discriminated unions
- [ ] Error union type exported
- [ ] Error messages helpful for debugging
- [ ] Context (id, cause) captured
- [ ] No TypeScript errors
- [ ] JSDoc explains when each error occurs

**File Path:** `/web/src/providers/DataProvider.ts` (Error types section)

---

### Task A-9: Document Interface with Examples (Cycle 19)
**Assigned to:** Backend Specialist
**Duration:** 2 hours
**Effort:** 8 Cycle points
**Dependencies:** All Tasks A-1 through A-8

**Instructions:**
1. Add comprehensive JSDoc to all interfaces
2. Include usage examples for each method
3. Explain error channels
4. Document ontology dimension mapping
5. Add implementation notes for provider developers
6. Create `/web/src/providers/DataProvider.examples.ts` with working examples

**Expected Output:**
```typescript
/**
 * DataProvider Interface - Backend-Agnostic Data Access Layer
 *
 * This interface abstracts the 6-dimension ONE ontology, enabling
 * multiple backend implementations while maintaining a single frontend.
 *
 * All operations return Effect.Effect<T, Error> for type-safe error handling.
 *
 * Example:
 * ```typescript
 * const effect = DataProvider.pipe(
 *   Effect.flatMap(dp => dp.things.get(thingId))
 * );
 * const result = await Effect.runPromise(effect);
 * ```
 *
 * Error Handling:
 * - Network errors: NetworkError | TimeoutError
 * - Not found: ThingNotFoundError
 * - Validation: ValidationError with field details
 * - Authorization: AuthorizationError with action details
 */

export interface DataProvider {
  // ... interfaces documented with examples
}

/**
 * Groups API - Hierarchical organization containers
 *
 * Dimension 1: Groups (organizations, teams, subgroups)
 * - Infinite nesting: Groups can contain groups
 * - Multi-tenancy: Each group has isolated data
 * - Scoping: All other dimensions scoped to groupId
 *
 * Example: Get current organization
 * ```typescript
 * const org = await Effect.runPromise(
 *   DataProvider.pipe(
 *     Effect.flatMap(dp => dp.groups.getCurrent())
 *   )
 * );
 * ```
 */
export interface GroupsAPI {
  // ... methods documented with examples
}
```

**Acceptance Criteria:**
- [ ] All interfaces have comprehensive JSDoc
- [ ] Examples for each major method
- [ ] Error handling documented
- [ ] Ontology dimension explained
- [ ] Examples compile and run
- [ ] No TypeScript errors
- [ ] Examples file created

**File Path:** `/web/src/providers/DataProvider.ts` + `/web/src/providers/DataProvider.examples.ts`

---

### Task A-10: Create Context.Tag for Dependency Injection (Cycle 20)
**Assigned to:** Backend Specialist
**Duration:** 30 min
**Effort:** 4 Cycle points
**Dependencies:** All Tasks A-1 through A-9

**Instructions:**
1. Add Context.Tag export to DataProvider.ts
2. Create tag for dependency injection
3. Add documentation explaining how to use in services
4. Export from index.ts

**Expected Output:**
```typescript
// At end of DataProvider.ts

/**
 * Context.Tag for DataProvider dependency injection
 *
 * Use in services like:
 * ```typescript
 * import { DataProvider } from "./DataProvider";
 *
 * export class ThingService extends Effect.Service<ThingService>() {
 *   constructor(private dp: DataProvider.Type) {}
 *
 *   get = (id: string) =>
 *     Effect.map(
 *       this.dp.things.get(id),
 *       thing => new Thing(thing)
 *     );
 * }
 * ```
 */
export const DataProviderTag = Context.GenericTag<DataProvider>("DataProvider");

// In index.ts
export { DataProvider, DataProviderTag, DataProviderError } from "./DataProvider";
```

**Acceptance Criteria:**
- [ ] Context.Tag created
- [ ] Tagged union for DI
- [ ] JSDoc explains usage in services
- [ ] Exported from index.ts
- [ ] No TypeScript errors
- [ ] Can be imported in other files

**File Path:** `/web/src/providers/DataProvider.ts` + `/web/src/providers/index.ts`

---

## Specialist Stream B: Foundation & Planning (Frontend Lead)

### Stream Lead: Frontend Lead (0.5 FTE Week 1)
**Phase:** 1 (Cycle 1-10)
**Duration:** Oct 28 - Nov 2 (Days 1-5)
**Goal:** Validate architecture, create task breakdown, assign specialists

---

### Task B-1: Validate Ontology Mapping (Cycle 001)
**Assigned to:** Frontend Lead
**Duration:** 1 hour
**Effort:** 5 Cycle points
**Dependencies:** None

**Instructions:**
1. Read `/one/knowledge/ontology.md` (6-dimension spec)
2. Map Effect services to ontology:
   - Groups → ThingService.listThings(groupId)
   - People → PeopleService methods
   - Things → ThingService CRUD
   - Connections → ConnectionService
   - Events → EventService logging
   - Knowledge → KnowledgeService
3. Verify DataProvider enforces ontology at interface
4. Document findings in project notes

**Deliverable:** Ontology validation checklist (can be informal notes)

**Acceptance Criteria:**
- [ ] All 6 dimensions identified in codebase
- [ ] Scoping via groupId verified for Things, Connections, Events, Knowledge
- [ ] Authorization via role in People verified
- [ ] Hierarchical groups support confirmed
- [ ] DataProvider interface enforces ontology structure
- [ ] No gaps in ontology mapping

**File Path:** Project notes / Slack summary

---

### Task B-2: Map Convex Hooks to DataProvider (Cycle 002)
**Assigned to:** Frontend Lead + Backend Specialist (30 min sync)
**Duration:** 2 hours
**Effort:** 6 Cycle points
**Dependencies:** Task B-1

**Instructions:**
1. Grep for all `useQuery` and `useMutation` in codebase
2. List all Convex hooks found
3. For each, document:
   - Hook name (e.g., `useQuery(api.queries.courses.list)`)
   - What it does
   - Which DataProvider service will replace it
4. Assess migration risk: LOW / MEDIUM / HIGH
5. Identify any complex mutations that need special handling

**Deliverable:** Hook inventory spreadsheet (can be in Markdown)

**Expected Output:**
```markdown
# Convex Hooks Inventory

| Convex Hook | Used By | DataProvider Service | Risk |
|-------------|---------|----------------------|------|
| api.queries.courses.list | CourseFeed | ThingService.list | LOW |
| api.queries.courses.get | CourseDetail | ThingService.get | LOW |
| api.mutations.courses.create | CreateCourseForm | ThingService.create | MEDIUM |
| ... | ... | ... | ... |

Total: 47 hooks found
Average Risk: LOW
High-Risk Items: 3 (optimistic updates, nested mutations)
```

**Acceptance Criteria:**
- [ ] All Convex imports found (grep results)
- [ ] Each hook mapped to DataProvider service
- [ ] Risk assessment per hook
- [ ] Complex mutations identified
- [ ] Migration strategy per complex mutation
- [ ] Team reviewed and agreed on approach

**File Path:** `/one/events/convex-hooks-inventory.md`

---

### Task B-3: Design Service Dependency Graph (Cycle 003)
**Assigned to:** Frontend Lead + Backend Specialist (30 min sync)
**Duration:** 1.5 hours
**Effort:** 6 Cycle points
**Dependencies:** Task B-2

**Instructions:**
1. List all 12 frontend services planned:
   - Core: Thing, Connection, Event, Knowledge, People, Group (6)
   - Domain: Cart, Order, Product, Review, Organization, Config (6)
2. For each service, identify dependencies:
   - Does it depend on other services?
   - Does it depend on DataProvider?
3. Draw dependency graph (can be ASCII art or text)
4. Verify acyclic (no circular dependencies)
5. Identify critical path (longest dependency chain)

**Deliverable:** Service dependency graph document

**Expected Output:**
```
Service Dependencies:

ThingService
  └─ DataProvider

ConnectionService
  └─ DataProvider

EventService
  └─ DataProvider

KnowledgeService
  └─ DataProvider

PeopleService
  └─ DataProvider

GroupService
  └─ DataProvider

CourseService (Domain)
  ├─ ThingService
  ├─ ConnectionService
  └─ DataProvider

CartService (Domain)
  ├─ ThingService
  ├─ ProductService
  └─ DataProvider

... (6 more domain services)

Critical Path: 3 levels deep
  DataProvider → ThingService → CourseService

No circular dependencies detected ✓
```

**Acceptance Criteria:**
- [ ] All 12 services listed
- [ ] Dependencies identified for each service
- [ ] Dependency graph is acyclic
- [ ] Critical path identified
- [ ] DataProvider is leaf node (all dependencies point to it)
- [ ] Document clear for implementation team

**File Path:** `/one/events/service-dependency-graph.md`

---

### Task B-4: Define Error Handling Strategy (Cycle 004)
**Assigned to:** Backend Specialist + Frontend Lead (1 hour sync)
**Duration:** 1.5 hours
**Effort:** 6 Cycle points
**Dependencies:** Task B-3

**Instructions:**
1. Identify error categories:
   - Domain errors: ThingNotFound, ValidationError
   - Provider errors: ProviderError, NetworkError
   - Component errors: FormError, RenderError
2. For each category, define:
   - When it occurs
   - How to recover
   - User-facing message
   - Developer debugging info
3. Plan Effect error channel strategy:
   - Use Effect.Either<Success, Error>
   - Discriminated unions for errors
   - Type-safe error handling in hooks
4. Document error recovery flows

**Deliverable:** Error handling strategy document

**Expected Output:**
```markdown
# Error Handling Strategy

## Domain Errors (DataProvider → Services)
- ThingNotFoundError: "Thing {id} not found"
  - Recovery: Redirect to list view
  - Debug: Log 404 response from provider

- ValidationError: "Field {field}: {message}"
  - Recovery: Show inline error, let user correct
  - Debug: Log validation schema and value

- AuthorizationError: "Not allowed to {action} {resource}"
  - Recovery: Show permission error UI
  - Debug: Log user role and required permissions

## Provider Errors (Network, API)
- NetworkError: "Connection failed, retrying..."
  - Recovery: Auto-retry 3x with exponential backoff
  - Debug: Log HTTP status and response

- TimeoutError: "Request took too long, please try again"
  - Recovery: Manual retry button
  - Debug: Log request duration

## Component Errors (React)
- FormError: Per-field validation
  - Recovery: Show errors inline, prevent submit
  - Debug: Log form data and validation results

## Error Channels in Effect

All service methods use:
Effect.Effect<T, DomainError | ProviderError>

Hook error handling:
const [data, setData] = useState<Result<T>>(null);
const run = (effect) =>
  Effect.runPromise(effect)
    .then(success => setData({ ok: success }))
    .catch(error => setData({ err: error }));
```

**Acceptance Criteria:**
- [ ] All error types identified
- [ ] Recovery strategy for each type
- [ ] User-facing messages defined
- [ ] Developer debugging strategy
- [ ] Effect error channel approach clear
- [ ] Team agreement on error handling

**File Path:** `/one/events/error-handling-strategy.md`

---

### Task B-5: Plan React Hook Library (Cycle 005)
**Assigned to:** Frontend Specialist + Frontend Lead (45 min sync)
**Duration:** 1.5 hours
**Effort:** 6 Cycle points
**Dependencies:** Task B-4

**Instructions:**
1. List minimum hooks needed: 6
   - useEffectRunner (core)
   - useThingService (generic CRUD)
   - useService (any service)
   - useForm (validation)
   - useOptimisticUpdate
   - useMemoEffect
2. Identify additional useful hooks (should be 6-10 more):
   - useConnections
   - useEvents
   - useKnowledge
   - useAuth
   - useGroups
   - usePeople
   - Etc.
3. For each hook, document:
   - What it does
   - Inputs/outputs
   - Error handling
   - When to use it
4. Plan hook composition (can one hook use another?)

**Deliverable:** Hook library planning document

**Expected Output:**
```markdown
# React Hook Library Plan

## Core Hooks (6 minimum)

### useEffectRunner
- Purpose: Run Effect programs in React, get loading/error/data
- Input: Effect<T, E>
- Output: { run, data, loading, error, retry }
- Error handling: Catches Effect errors, stores in error state
- Usage: Base hook for all other hooks

### useThingService
- Purpose: CRUD operations for things
- Input: type, groupId, dependencies
- Output: { things, loading, create, update, delete, refetch }
- Error handling: Per-operation error states
- Usage: Most common hook for thing management

### useService
- Purpose: Generic service accessor
- Input: Service class, method name, args
- Output: { data, loading, error, run }
- Error handling: Via Effect error channels
- Usage: Advanced users, custom services

### useForm
- Purpose: Form state + validation
- Input: Schema, initial values, onSubmit
- Output: { register, watch, errors, submit, isSubmitting }
- Error handling: Per-field errors
- Usage: All forms

### useOptimisticUpdate
- Purpose: Optimistic updates with rollback
- Input: update mutation, initial value
- Output: { value, update, isUpdating, error }
- Error handling: Rollback on error
- Usage: UX-heavy mutations

### useMemoEffect
- Purpose: Memoize Effect operations
- Input: Effect, dependencies
- Output: Memoized effect
- Error handling: Via Effect channels
- Usage: Performance optimization

## Extended Hooks (6+ additional)

### useConnections (Thing → Related Things)
### useEvents (Audit trail / activity stream)
### useKnowledge (Search, embeddings)
### useAuth (Session, roles, permissions)
### useGroups (Organization hierarchy)
### usePeople (User list, profiles)

Total Planned: 18 hooks (3x minimum - allows rich functionality)
```

**Acceptance Criteria:**
- [ ] 6+ core hooks planned
- [ ] 6+ extended hooks planned
- [ ] Each hook documented (purpose, input/output)
- [ ] Hook composition strategy clear
- [ ] Error handling approach for each hook
- [ ] Team agreement on hook scope

**File Path:** `/one/events/react-hook-library-plan.md`

---

### Task B-6: Design Test Strategy (Cycle 006)
**Assigned to:** Quality Specialist + Frontend Lead (1 hour sync)
**Duration:** 1.5 hours
**Effort:** 6 Cycle points
**Dependencies:** Task B-5

**Instructions:**
1. Define three test levels:
   - Unit: Services with mock DataProvider
   - Integration: Hooks with mock services
   - E2E: Full pages with real backend
2. Set coverage targets:
   - Unit: 90%+ per service
   - Integration: 80%+ per component
   - Critical paths: 100%
3. Plan test utilities:
   - Mock provider factory
   - Test layer compositions
   - Assert error types
   - Setup/teardown helpers
4. Identify critical paths for 100% coverage:
   - Auth (login, signup, password reset)
   - Checkout flow
   - Course enrollment
   - Permission checks

**Deliverable:** Test strategy document

**Expected Output:**
```markdown
# Test Strategy

## Unit Tests (Services)
- Framework: Vitest
- Mock: DataProvider with predefined responses
- Coverage: 90%+ per service (ThingService, ConnectionService, etc.)
- Example:
  ```typescript
  test("ThingService.get returns thing", () => {
    const mockProvider = createMockProvider({
      things: { get: () => Effect.succeed(mockThing) }
    });
    const service = new ThingService(mockProvider);
    const effect = service.get("123");
    const result = runTestEffect(effect);
    expect(result.ok).toBe(true);
  });
  ```

## Integration Tests (Hooks)
- Framework: React Testing Library
- Mock: Services using mock provider
- Coverage: 80%+ per hook/component
- Example:
  ```typescript
  test("useThingService loads things", async () => {
    const { result } = renderHook(
      () => useThingService("course", groupId),
      { wrapper: EffectProvider }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.things).toHaveLength(2);
  });
  ```

## E2E Tests (Critical Paths)
- Framework: Playwright
- Real backend: Actual DataProvider
- Coverage: 100% for critical paths
- Test cases:
  - Auth flow (login → dashboard)
  - Course enrollment (browse → select → enroll)
  - Checkout (cart → payment → confirmation)

## Coverage Targets
- Unit: 90%+ (all services)
- Integration: 80%+ (all hooks/components)
- Critical Paths: 100%
- Overall: 85%+ target

## Test Utilities
- createMockProvider(): Predefined responses
- createMockLayer(): Service layer mock
- renderHook(hook, { wrapper }): Hook testing
- runTestEffect(effect): Effect execution
- assertError(effect, ErrorType): Error verification
```

**Acceptance Criteria:**
- [ ] Three test levels defined
- [ ] Coverage targets set (90%, 80%, 100%)
- [ ] Test utilities designed
- [ ] Critical paths identified
- [ ] Example tests written
- [ ] Team agreement on approach

**File Path:** `/one/events/test-strategy.md`

---

### Task B-7: Create Rollback Plan (Cycle 007)
**Assigned to:** Frontend Lead
**Duration:** 45 min
**Effort:** 4 Cycle points
**Dependencies:** Task B-2

**Instructions:**
1. Document rollback scenarios:
   - Phase 2 fails (DataProvider incomplete)
   - Phase 3 fails (Services broken)
   - Phase 6 fails (Components can't migrate)
2. For each scenario, define:
   - How to detect failure
   - Rollback procedure
   - Timeline to rollback (SLA)
   - Recovery process
3. Key insight: Component migration is opt-in
   - Can migrate 10 components and rollback 5 without affecting 5
   - Services can be swapped via provider injection
   - Auth tests verify safety

**Deliverable:** Rollback plan document

**Expected Output:**
```markdown
# Rollback Plan

## Scenario 1: DataProvider Incomplete (Phase 2)
- Detection: DataProvider interfaces don't compile
- Rollback: Delete /web/src/providers/DataProvider.ts
- Timeline: 30 minutes
- Recovery: Revert to pure Convex hooks

## Scenario 2: Services Broken (Phase 3)
- Detection: Service unit tests failing >20%
- Rollback: Disable services, keep using Convex hooks
- Timeline: 1 hour
- Recovery: Fix services in parallel, redeploy

## Scenario 3: Component Migration Failing (Phase 6)
- Detection: Component tests failing or auth tests failing
- Rollback: Migrate that component back to Convex hooks
- Timeline: 15 minutes per component
- Recovery: Component can be fixed in isolation

## Key Safety Features
1. Component Migration is Opt-in
   - Can migrate 10 components to test
   - If problems, rollback those 10 without affecting others

2. Provider Swapping is Configuration
   - Use feature flag to switch DataProvider ↔ ConvexProvider
   - 5-minute switch back to pure Convex

3. Auth Tests are Go/No-Go Criteria
   - Run auth tests after every migration
   - If auth tests fail, immediately rollback component
   - Never deploy with auth tests failing

## Rollback SLA
- Phase 2 failure: 30 min to rollback
- Phase 3 failure: 1 hour to rollback
- Phase 6 component failure: 15 min per component
- Total project failure: 2 hours to full rollback
```

**Acceptance Criteria:**
- [ ] All rollback scenarios documented
- [ ] Detection criteria clear
- [ ] Rollback procedure step-by-step
- [ ] SLA defined for each scenario
- [ ] Component-level rollback possible
- [ ] Auth tests as safety gate documented

**File Path:** `/one/events/rollback-plan.md`

---

### Task B-8: Identify Critical Auth Components (Cycle 008)
**Assigned to:** Quality Specialist + Frontend Lead (30 min sync)
**Duration:** 1 hour
**Effort:** 5 Cycle points
**Dependencies:** Task B-2

**Instructions:**
1. Find all auth tests: `find web/src/tests/auth -type f -name "*.test.ts"`
2. List critical auth components:
   - Login page
   - Signup page
   - Password reset
   - Email verification
   - Session management
3. For each, list:
   - Component file
   - Test file
   - What must not break
4. Create "canary" test suite:
   - Must run after every phase
   - Checks auth functionality end-to-end
   - BLOCKER: If canary fails, STOP migration
5. Document as non-negotiable quality gate

**Deliverable:** Critical auth components list + canary test suite

**Expected Output:**
```markdown
# Critical Auth Components (Canary Tests)

## Auth Tests to Run Per-Component Migration

### Test: Login Flow
- File: web/src/pages/auth/signin.astro
- Test: web/src/tests/auth/signin.test.ts
- What must work: Email/password login, session creation, redirect to dashboard
- Blocker: If fails, STOP migration immediately

### Test: Signup Flow
- File: web/src/pages/auth/signup.astro
- Test: web/src/tests/auth/signup.test.ts
- What must work: Email/password registration, email verification, login after signup
- Blocker: If fails, STOP migration immediately

### Test: Password Reset
- File: web/src/pages/auth/password-reset.astro
- Test: web/src/tests/auth/password-reset.test.ts
- What must work: Send reset email, reset token validation, password update
- Blocker: If fails, STOP migration immediately

### Test: Session Management
- File: web/src/context/UserContext.tsx
- Test: web/src/tests/auth/session.test.ts
- What must work: Session creation, role persistence, session expiration
- Blocker: If fails, STOP migration immediately

## Canary Test Suite

Run after EVERY component migration (Phase 6):
```bash
npm test -- web/src/tests/auth/signin.test.ts
npm test -- web/src/tests/auth/signup.test.ts
npm test -- web/src/tests/auth/password-reset.test.ts
npm test -- web/src/tests/auth/session.test.ts
```

ALL TESTS MUST PASS BEFORE CONTINUING

## Enforcement
- Gate check in Phase 6: Cycle 60 "Verify all auth tests STILL PASS"
- PR check: Cannot merge component unless auth tests pass
- Daily check: Auth test results in standup
```

**Acceptance Criteria:**
- [ ] All auth test files identified
- [ ] Critical components listed
- [ ] Canary test suite defined
- [ ] Blocker criterion clear: auth tests = go/no-go
- [ ] Team understands this is non-negotiable
- [ ] Test file paths verified to exist

**File Path:** `/one/events/critical-auth-components.md`

---

### Task B-9: Plan Parallel Work Streams (Cycle 009)
**Assigned to:** Frontend Lead
**Duration:** 1.5 hours
**Effort:** 6 Cycle points
**Dependencies:** Tasks B-1 through B-8

**Instructions:**
1. Define 5 specialist streams:
   - Stream A: DataProvider (Backend Specialist)
   - Stream B: Effect Services (Backend Specialist)
   - Stream C: React Hooks (Frontend Specialist)
   - Stream D: Component Migration (Frontend Specialist)
   - Stream E: Testing (Quality Specialist)
2. For each stream:
   - Start date (which cycles)
   - Duration estimate
   - Key blockers
   - Gate it produces
3. Identify which can run in parallel:
   - Streams A & B: B depends on A (sequential)
   - Streams B & C: Can start together on Day 5
   - Streams C & D: D depends on C
   - Streams D & E: Can run in parallel (E from Day 10)
4. Create Gantt chart (ASCII art)

**Deliverable:** Parallel execution plan + Gantt chart

**Expected Output:**
```markdown
# Parallel Work Streams

## Stream A: DataProvider Interface (Backend Specialist)
- Phase: 2 (Cycle 11-20)
- Duration: Days 1-5 (5 days)
- Start: Oct 28 (Monday)
- End: Nov 2 (Friday)
- Gate Produced: Gate 2 (DataProvider complete)
- Critical Path: YES (blocks all services)

## Stream B: Effect Services (Backend Specialist)
- Phase: 3 (Cycle 21-40)
- Duration: Days 5-12 (8 days)
- Start: Nov 2 (when DataProvider done)
- End: Nov 9 (blocked on Stream A)
- Gate Produced: Gate 3 (Services 90% coverage)
- Critical Path: YES (blocks hooks and components)
- Depends On: Stream A (DataProvider)

## Stream C: React Hooks (Frontend Specialist)
- Phase: 4 (Cycle 31-40)
- Duration: Days 8-12 (5 days)
- Start: Nov 5 (can start early with stub DataProvider)
- End: Nov 9
- Gate Produced: Gate 4 (Hooks tested)
- Critical Path: YES (blocks component migration)
- Depends On: Stream A (DataProvider interface)
- Note: Can work in parallel with B once interface is clear

## Stream D: Component Migration (Frontend Specialist)
- Phase: 6 (Cycle 51-70)
- Duration: Days 10-25 (16 days)
- Start: Nov 9 (when hooks done)
- End: Nov 24
- Gate Produced: Gate 6 (63 components migrated)
- Critical Path: YES (longest pole)
- Depends On: Stream C (hooks must work)
- Parallel With: Stream E (testing)

## Stream E: Testing (Quality Specialist)
- Phase: 7 (Cycle 71-80)
- Duration: Days 10-24 (15 days)
- Start: Nov 9 (start with test framework)
- End: Nov 23
- Gate Produced: Gate 7 (92% coverage)
- Critical Path: YES (blocks deployment)
- Parallel With: Stream D (components and tests together)
- Note: Begin test framework on Day 10, then test components as migrated

## Gantt Chart

Oct 28  Nov 2  Nov 9  Nov 16  Nov 23  Nov 30
  |------|------|------|------|------|
  A------         (DataProvider)
         B--------         (Services)
              C-----        (Hooks)
                   D-------------------  (Components)
                   E-------------------  (Testing)
  |------|------|------|------|------|
  Week 1  Week 2  Week 3  Week 4  Week 5

## Critical Path
DataProvider → Services → Hooks → Components → Testing → Deployment
(Days 1→5) → (5→12) → (8→12) → (10→25) → (10→24) → (25→30)

Longest pole: Component Migration (16 days)
Total duration: 30 days (all 5 streams + dependencies)
Parallelization saves: ~30 days vs sequential

## Parallel Opportunities
- Streams A & B sequential (no parallelization)
- Streams C & B can overlap (B produces DataProvider, C uses it)
- Streams D & E must be parallel (D creates work for E)
- Streams E & B can overlap (E tests while B implements)
```

**Acceptance Criteria:**
- [ ] 5 specialist streams defined
- [ ] Start/end dates for each stream
- [ ] Dependencies between streams clear
- [ ] Parallel opportunities identified
- [ ] Gantt chart shows timeline
- [ ] Critical path identified
- [ ] Team understands parallelization strategy

**File Path:** `/one/events/parallel-execution-plan.md`

---

### Task B-10: Assign Specialists & Create Schedule (Cycle 010)
**Assigned to:** Frontend Lead
**Duration:** 1 hour
**Effort:** 5 Cycle points
**Dependencies:** Task B-9

**Instructions:**
1. Define 5 specialist roles:
   - Frontend Lead (1 FTE): Oversee, manage blockers, coordinate
   - Backend Specialist (1 FTE): DataProvider + Services
   - Frontend Specialist (1 FTE): Hooks + Components + Astro
   - Quality Specialist (1 FTE): Testing + Validation
   - Documenter (0.5 FTE): Docs (parallel)
2. For each specialist:
   - Assign phases/cycles
   - Estimate effort per phase
   - Identify FTE allocation per week
3. Create weekly schedule:
   - Week 1: Phases 1-2
   - Week 2: Phases 2-3-4
   - Weeks 3-4: Phases 5-6-7-8
   - Weeks 5-6: Phases 9-10
4. Plan daily standups and weekly syncs
5. Create contact/escalation list

**Deliverable:** Specialist assignment + weekly schedule

**Expected Output:**
```markdown
# Specialist Assignments & Schedule

## Specialist Team

### Frontend Lead (1 FTE)
- Role: Director, blocker resolution, phase gates
- Phases: 1, 10 (Cycle 1-10, 96-100)
- FTE by week: Week 1: 100%, Week 2-5: 10%, Week 6: 100%
- Key activities:
  - Architecture validation (Cycle 1-10)
  - Phase gate reviews (weekly)
  - Blocker escalation (daily)
  - Performance validation (Week 6)
  - Production deployment (Week 6)

### Backend Specialist (1 FTE)
- Role: DataProvider + Services + Error handling
- Phases: 2, 3, 8 (Cycle 11-30, 81-85)
- FTE by week: Week 1: 100%, Week 2: 100%, Weeks 3-4: 30%, Week 5: 20%
- Key deliverables:
  - DataProvider interface (Week 1, Cycle 11-20)
  - 6 core services (Week 2, Cycle 21-30)
  - Error handling & resilience (Week 4, Cycle 81-85)

### Frontend Specialist (1 FTE)
- Role: React hooks, component migration, Astro
- Phases: 4, 5, 6 (Cycle 31-70)
- FTE by week: Week 2: 50%, Week 3: 100%, Week 4: 100%, Week 5: 10%
- Key deliverables:
  - React hooks (Week 2-3, Cycle 31-40)
  - Astro integration (Week 3, Cycle 41-50)
  - Component migration (Weeks 3-4, Cycle 51-70)

### Quality Specialist (1 FTE)
- Role: Testing, validation, quality gates
- Phases: 7, 8, 10 (Cycle 71-85, 99-100)
- FTE by week: Week 3: 30%, Week 4: 100%, Week 5: 50%, Week 6: 50%
- Key deliverables:
  - Test framework (Week 3, Cycle 71-75)
  - Service & component tests (Weeks 3-4, Cycle 76-80)
  - Final smoke tests (Week 6, Cycle 99-100)

### Documenter (0.5 FTE)
- Role: Documentation, guides, architecture
- Phases: 9 (Cycle 86-95) - PARALLEL with other phases
- FTE by week: Weeks 3-5: 0.5 FTE continuous
- Key deliverables:
  - API docs, service guides (Week 4)
  - Migration guides, testing guide (Week 5)
  - ADR, architecture decisions (Week 5)

## Weekly Schedule

### Week 1: Foundation + DataProvider (Oct 28 - Nov 2)
| Role | Mon | Tue | Wed | Thu | Fri | Status |
|------|-----|-----|-----|-----|-----|--------|
| Frontend Lead | 100% | 100% | 100% | 100% | 50% | Plan, validate |
| Backend Spec. | 100% | 100% | 100% | 100% | 100% | DataProvider |
| Frontend Spec. | 0% | 0% | 0% | 0% | 0% | Wait for design |
| Quality Spec. | 0% | 0% | 0% | 0% | 50% | Test plan |
| Documenter | 0% | 0% | 0% | 0% | 0% | Wait for specs |

Phase complete: Cycle 1-20 (Foundation + DataProvider)
Gate 2 approval: Friday EOD

### Week 2: Services + Hooks (Nov 5-9)
| Role | Mon | Tue | Wed | Thu | Fri | Status |
|------|-----|-----|-----|-----|-----|--------|
| Frontend Lead | 10% | 10% | 10% | 10% | 20% | Weekly sync |
| Backend Spec. | 100% | 100% | 100% | 100% | 50% | Services |
| Frontend Spec. | 50% | 50% | 100% | 100% | 100% | Hooks |
| Quality Spec. | 50% | 50% | 50% | 50% | 100% | Test setup |
| Documenter | 0% | 0% | 0% | 0% | 0% | Wait |

Phase complete: Cycle 21-40 (Services + Hooks)
Gate 3 & 4 approval: Friday EOD

### Week 3: Integration + Migration Start (Nov 12-16)
| Role | Mon | Tue | Wed | Thu | Fri | Status |
|------|-----|-----|-----|-----|-----|--------|
| Frontend Lead | 10% | 10% | 10% | 10% | 20% | Weekly sync |
| Backend Spec. | 20% | 20% | 20% | 20% | 20% | Support |
| Frontend Spec. | 100% | 100% | 100% | 100% | 100% | Astro + migration |
| Quality Spec. | 50% | 50% | 50% | 50% | 100% | Testing |
| Documenter | 50% | 50% | 50% | 50% | 50% | API docs |

Phase progress: Cycle 41-60 (Astro + 10 components)
Target: 50% of component migration done by Friday

### Week 4: Component Migration (Nov 19-23)
| Role | Mon | Tue | Wed | Thu | Fri | Status |
|------|-----|-----|-----|-----|-----|--------|
| Frontend Lead | 10% | 10% | 10% | 10% | 20% | Weekly sync |
| Backend Spec. | 10% | 10% | 10% | 10% | 50% | Error handling |
| Frontend Spec. | 100% | 100% | 100% | 100% | 100% | Components |
| Quality Spec. | 100% | 100% | 100% | 100% | 100% | Testing |
| Documenter | 50% | 50% | 50% | 50% | 50% | Migration guides |

Phase progress: Cycle 51-70 (Component migration)
Target: 100% of components migrated by Friday
Gate 6 approval: Friday EOD

### Week 5: Testing + Optimization (Nov 26-30)
| Role | Mon | Tue | Wed | Thu | Fri | Status |
|------|-----|-----|-----|-----|-----|--------|
| Frontend Lead | 10% | 10% | 10% | 10% | 20% | Weekly sync |
| Backend Spec. | 0% | 0% | 0% | 0% | 50% | Handoff |
| Frontend Spec. | 10% | 10% | 10% | 10% | 50% | Polish |
| Quality Spec. | 50% | 50% | 50% | 50% | 100% | Final testing |
| Documenter | 50% | 50% | 50% | 50% | 100% | Final docs |

Phase progress: Cycle 71-95 (Testing + Documentation)
Gate 7 & 9 approval: Friday EOD

### Week 6: Deployment (Dec 3-7)
| Role | Mon | Tue | Wed | Thu | Fri | Status |
|------|-----|-----|-----|-----|-----|--------|
| Frontend Lead | 100% | 100% | 50% | 50% | 50% | Deploy |
| Backend Spec. | 0% | 0% | 0% | 0% | 0% | Done |
| Frontend Spec. | 0% | 0% | 0% | 0% | 0% | Done |
| Quality Spec. | 50% | 50% | 100% | 100% | 50% | Validation |
| Documenter | 0% | 0% | 0% | 0% | 50% | Final review |

Phase progress: Cycle 96-100 (Performance + Deployment)
Gate 10 approval: Friday EOD
Production deployment: Friday afternoon

## Daily Standups
- Time: 9am UTC (15 min async in Slack)
- Channel: #frontend-effects
- Template: Status, blockers, next steps
- Owner: Frontend Lead reviews and responds

## Weekly Syncs
- Time: 2pm UTC Friday (30 min)
- Attendees: All 5 specialists
- Agenda: Phase progress, blocker resolution, next week planning
- Owner: Frontend Lead facilitates

## Critical Escalation Contacts
- Frontend Lead: Blocker resolution authority
- Backend Specialist: Services & errors escalation
- Frontend Specialist: Component & hooks escalation
- Quality Specialist: Testing & quality gate escalation
- Emergency contact: Frontend Lead (24 hours)

## Milestones & Gates
- Gate 1 (Cycle 10): Fri Oct 31 - Architecture approved
- Gate 2 (Cycle 20): Fri Nov 2 - DataProvider complete
- Gate 3 (Cycle 30): Fri Nov 9 - Services 92% coverage
- Gate 4 (Cycle 40): Fri Nov 9 - Hooks tested
- Gate 5 (Cycle 50): Fri Nov 16 - SSR working
- Gate 6 (Cycle 62): Fri Nov 23 - Components migrated, auth tests pass
- Gate 7 (Cycle 80): Fri Nov 23 - 92% coverage, zero TypeScript errors
- Gate 8 (Cycle 85): Fri Nov 23 - Error handling complete
- Gate 9 (Cycle 95): Fri Nov 30 - Documentation complete
- Gate 10 (Cycle 100): Fri Dec 7 - Production deployed
```

**Acceptance Criteria:**
- [ ] All 5 specialists assigned
- [ ] Phases assigned to each specialist
- [ ] FTE allocation per week clear
- [ ] Weekly schedule visible
- [ ] Daily standup schedule set
- [ ] Weekly sync schedule set
- [ ] Milestone dates defined
- [ ] Escalation contacts listed
- [ ] Team reviewed and agreed

**File Path:** `/one/events/specialist-assignments-and-schedule.md`

---

## Gate 1 Approval Checklist

**All tasks B-1 through B-10 completed = Gate 1 APPROVED**

Before moving to Phase 2 (Cycle 11-20), verify:

- [ ] **Ontology Mapping:** All 6 dimensions mapped to services
- [ ] **Convex Hooks:** 47 hooks identified and mapped to DataProvider
- [ ] **Dependency Graph:** Acyclic, critical path identified
- [ ] **Error Strategy:** All error types and recovery flows defined
- [ ] **Hook Plan:** 18 hooks designed (core + extended)
- [ ] **Test Strategy:** 90%/80%/100% coverage targets set
- [ ] **Rollback Plan:** All scenarios documented, rollback SLA defined
- [ ] **Auth Tests:** 12 critical auth tests identified as go/no-go
- [ ] **Parallel Plan:** 5 streams defined, Gantt chart clear
- [ ] **Assignments:** All specialists assigned, schedule visible

**Gate 1 Status:** ✅ APPROVED - Ready for Phase 2 (DataProvider)

---

## End of Week 1 Checklist

**What should be delivered by end of Week 1 (Nov 2):**

**Backend Specialist Deliverables:**
- [x] DataProvider.ts with all 6 dimensions
- [x] 12 error types defined and documented
- [x] Context.Tag for dependency injection
- [x] Examples.ts file with working code
- [x] Ready for services layer (Phase 3)

**Frontend Lead Deliverables:**
- [x] Ontology validation document
- [x] Convex hooks inventory (47 hooks)
- [x] Service dependency graph
- [x] Error handling strategy
- [x] React hook library plan
- [x] Test strategy document
- [x] Rollback plan
- [x] Critical auth components list
- [x] Parallel execution plan
- [x] Specialist assignments & schedule

**Quality Specialist Deliverables:**
- [x] Test strategy reviewed and approved
- [x] Mock provider design documented
- [x] Test utilities design specified
- [x] Canary test list reviewed

**Frontend Specialist Deliverables:**
- [x] React hooks design reviewed
- [x] Component migration approach reviewed
- [x] Ready for hooks implementation (Phase 4 start)

---

## How to Use This Document

### For Week 1 Kickoff:
1. Share this document with all 5 specialists
2. Have Frontend Lead walk through Tasks B-1 through B-10
3. Have Backend Specialist present DataProvider.ts tasks A-1 through A-10
4. Confirm FTE allocation and schedule with all specialists
5. Set up daily standup channel and weekly sync meeting

### For Daily Execution:
1. Use the specialized stream sections (Stream A, Stream B) as task lists
2. Update daily standup with progress on current task
3. Flag blockers immediately (don't wait for weekly sync)
4. When task complete, check off acceptance criteria
5. Move to next task in stream

### For Gate Reviews:
1. Use Gate X Approval Checklist to determine if gate criteria met
2. Frontend Lead conducts gate review with relevant specialists
3. Document gate approval in `/one/events/gate-reviews.md`
4. If gate fails, immediately escalate to problem-solving

### For Risk Management:
1. Daily standups surface blockers early
2. Weekly sync resolves blockers that became blocking
3. If blocker can't be resolved in 1 hour, escalate to Frontend Lead
4. Use Rollback Plan if phase failure occurs

---

**Status:** Week 1 Ready
**Approval Date:** October 28, 2025
**Execution Period:** October 28 - November 2, 2025
**Next Gate:** Gate 2 (DataProvider Complete) - November 2, 2025

