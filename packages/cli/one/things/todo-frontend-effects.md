---
title: Todo Frontend Effects
dimension: things
primary_dimension: things
category: todo-frontend-effects.md
tags: backend, frontend, cycle, testing, ui
related_dimensions: connections, events, groups, knowledge, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-frontend-effects.md category.
  Location: one/things/todo-frontend-effects.md
  Purpose: Documents frontend effects.ts implementation: 100-cycle execution plan
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand todo frontend effects.
---

# Frontend Effects.ts Implementation: 100-Cycle Execution Plan

**Building Backend-Agnostic Frontend Services with Type Safety & Composability**

**Version:** 1.0.0
**Status:** Ready for Implementation
**Stack:** Astro 5 + React 19 + Effect.ts + DataProvider
**Duration:** 4-6 weeks (parallel execution)
**Target:** Complete frontend service layer that works with ANY backend

---

## Overview: 10 Phases × 10 Cycles = 100 Steps

```
Phase 1 (Cycle 1-10):     Foundation & Planning
Phase 2 (Cycle 11-20):    DataProvider Interface
Phase 3 (Cycle 21-30):    Effect.ts Services Layer
Phase 4 (Cycle 31-40):    React Hooks & Context
Phase 5 (Cycle 41-50):    Astro Integration & SSR
Phase 6 (Cycle 51-60):    Component Migration
Phase 7 (Cycle 61-70):    Testing & Validation
Phase 8 (Cycle 71-80):    Error Handling & Resilience
Phase 9 (Cycle 81-90):    Performance Optimization
Phase 10 (Cycle 91-100):  Documentation & Deployment
```

---

## Phase 1: Foundation & Planning (Cycle 1-10)

**Specialists:** Director, Frontend Lead
**Duration:** 3-4 days
**Deliverable:** Architecture blueprint, task breakdown, timeline

### **[CYCLE-001]** Validate frontend architecture against 6-dimension ontology

- Services map to ontology dimensions (groups, people, things, connections, events, knowledge)
- DataProvider enforces ontology structure at interface level
- Type system prevents ontology violations

### **[CYCLE-002]** Map existing Convex integration to DataProvider pattern

- Identify all Convex hooks in current codebase
- List all mutation/query calls
- Create mapping: Convex calls → DataProvider interface
- Assess migration risk and complexity

### **[CYCLE-003]** Design service dependency graph

- ThingService dependencies: DataProvider
- ConnectionService dependencies: DataProvider
- EventService dependencies: DataProvider
- KnowledgeService dependencies: DataProvider
- CourseService dependencies: ThingService, ConnectionService
- Visualize and validate acyclic dependency graph

### **[CYCLE-004]** Define error hierarchy for frontend

- Domain errors (ThingNotFound, ValidationError)
- Provider errors (ProviderError, NetworkError)
- Component errors (FormError, RenderError)
- Tagging strategy for Effect error channels

### **[CYCLE-005]** Plan React hook library

- useEffectRunner (core)
- useThingService (generic CRUD)
- useService (any service)
- useForm (validation)
- useOptimisticUpdate
- List hooks and interdependencies

### **[CYCLE-006]** Design test strategy

- Unit tests: Services with mock providers
- Component tests: React Testing Library
- E2E tests: Full flow with real provider
- Test coverage targets: 85% unit, 70% integration

### **[CYCLE-007]** Create rollback plan

- Keep both Convex hooks and Effect services during migration
- Component migration is opt-in (can rollback per-component)
- Provider swapping is configuration (reversible)

### **[CYCLE-008]** Identify critical auth components

- Auth pages (login, signup, password reset)
- Auth tests in `frontend/tests/auth/*`
- Must pass throughout entire migration
- Establish as "canary" for quality

### **[CYCLE-009]** Plan parallel work streams

- **Stream A:** DataProvider + ConvexProvider (Frontend + Backend specialist)
- **Stream B:** Effect services (Backend specialist)
- **Stream C:** React hooks (Frontend specialist)
- **Stream D:** Component migration (Frontend specialist)
- **Stream E:** Testing (Quality specialist)

### **[CYCLE-010]** Assign specialists and schedule

- **Frontend Lead:** Oversee streams, manage blockers, coordinate release
- **Backend Specialist:** Services, providers, DI composition
- **Frontend Specialist:** Hooks, components, Astro integration
- **Quality Specialist:** Testing, validation, auth tests
- **Weekly:** Standup + parallel delivery sprints

---

## Phase 2: DataProvider Interface (Cycle 11-20)

**Specialists:** Backend Specialist, Frontend Lead
**Duration:** 3-5 days
**Deliverable:** Complete DataProvider interface, error types, documentation
**Status:** ✅ Ready to Start (independent of other phases)

### **[CYCLE-011]** Create `/web/src/providers/DataProvider.ts` base file

- Stub interface with all 6 dimensions
- Placeholder for error types
- JSDoc comments for each method

### **[CYCLE-012]** Define Groups interface (Dimension 1)

```typescript
groups: {
  get: (id: string) => Effect.Effect<Group, GroupNotFoundError>;
  list: (params?: ListParams) => Effect.Effect<Group[], Error>;
  update: (id: string, updates: Partial<Group>) => Effect.Effect<void, Error>;
}
```

### **[CYCLE-013]** Define People interface (Dimension 2)

```typescript
people: {
  get: (id: string) => Effect.Effect<Person, PersonNotFoundError>
  list: (params: ListParams) => Effect.Effect<Person[], Error>
  create: (input: CreatePersonInput) => Effect.Effect<string, Error>
  update: (id: string, updates: Partial<Person>) => Effect.Effect<void, Error>
  delete: (id: string) => Effect.Effect<void, Error>
}
```

### **[CYCLE-014]** Define Things interface (Dimension 3)

```typescript
things: {
  get: (id: string) => Effect.Effect<Thing, ThingNotFoundError>
  list: (params: { type: ThingType; groupId?: string })
    => Effect.Effect<Thing[], Error>
  create: (input: CreateThingInput) => Effect.Effect<string, Error>
  update: (id: string, updates: Partial<Thing>) => Effect.Effect<void, Error>
  delete: (id: string) => Effect.Effect<void, Error>
}
```

### **[CYCLE-015]** Define Connections interface (Dimension 4)

```typescript
connections: {
  create: (input: CreateConnectionInput) => Effect.Effect<string, Error>
  getRelated: (thingId: string) => Effect.Effect<Connection[], Error>
  getCount: (thingId: string) => Effect.Effect<number, Error>
  delete: (connectionId: string) => Effect.Effect<void, Error>
}
```

### **[CYCLE-016]** Define Events interface (Dimension 5)

```typescript
events: {
  log: (event: LogEventInput) => Effect.Effect<void, Error>;
  query: (params: QueryEventsInput) => Effect.Effect<Event[], Error>;
}
```

### **[CYCLE-017]** Define Knowledge interface (Dimension 6)

```typescript
knowledge: {
  embed: (text: string) => Effect.Effect<number[], Error>;
  search: (params: SearchInput) => Effect.Effect<KnowledgeChunk[], Error>;
}
```

### **[CYCLE-018]** Create error type definitions

- ThingNotFoundError, ValidationError, ProviderError, etc.
- Use Data.TaggedError for Effect compatibility
- Export as union type: `type DataProviderError = ...`

### **[CYCLE-019]** Document interface with examples

- Docstrings for each method
- Usage examples
- Error channel documentation
- Ontology mapping comments

### **[CYCLE-020]** Create Context.Tag for DataProvider

```typescript
export const DataProvider = Context.GenericTag<DataProvider>("DataProvider");
```

---

## Phase 3: Effect.ts Services Layer (Cycle 21-40)

**Specialists:** Backend Specialist
**Duration:** 5-7 days
**Deliverable:** 6 complete Effect services + ClientLayer
**Status:** ✅ Ready to Start (depends on Phase 2, independent of UI)
**Can Start:** Day 5 (when DataProvider is defined)

### **[CYCLE-021]** Create `/web/src/services/ThingService.ts` class definition

- Extend Effect.Service
- Define interface: get, list, create, update, delete
- Implement with provider delegation

### **[CYCLE-022]** Create `/web/src/services/ConnectionService.ts`

- Extend Effect.Service
- Define interface: create, getRelated, getCount, delete
- Implement with provider delegation

### **[CYCLE-023]** Create `/web/src/services/EventService.ts`

- Extend Effect.Service
- Define interface: log, query
- Implement with provider delegation

### **[CYCLE-024]** Create `/web/src/services/KnowledgeService.ts`

- Extend Effect.Service
- Define interface: embed, search
- Implement with provider delegation

### **[CYCLE-025]** Create `/web/src/services/GroupService.ts`

- Extend Effect.Service
- Define interface: get, list, update, getCurrent
- Implement with provider delegation

### **[CYCLE-026]** Create `/web/src/services/PeopleService.ts`

- Extend Effect.Service
- Define interface: get, list, create, getCurrentUser
- Implement with provider delegation

### **[CYCLE-027]** Create domain-specific service: CourseService

- Extends Effect.Service
- Depends on: ThingService, ConnectionService
- Methods: createWithInstructor, getWithEnrollments, etc.

### **[CYCLE-028]** Create `/web/src/services/ClientLayer.ts`

- Merge all service layers
- Merge provider layer
- Export as single Layer for React injection
- Document layer composition

### **[CYCLE-029]** Write unit tests for services with mock provider

- Mock provider implementation
- Test happy paths
- Test error scenarios
- 90%+ coverage per service

### **[CYCLE-030]** Validate service type signatures

- Full TypeScript strict mode
- No `any` types
- Error channels properly tracked
- Effect.runPromise compatible

---

## Phase 4: React Hooks & Context (Cycle 31-40)

**Specialists:** Frontend Specialist
**Duration:** 3-5 days
**Deliverable:** Hook library (6 hooks) + EffectContext
**Status:** ✅ Ready to Start (depends on Phase 3, independent of components)
**Can Start:** Day 8 (when services are defined)

### **[CYCLE-031]** Create `/web/src/hooks/useEffectRunner.ts`

- Core hook: run Effect programs in React
- Return: { run, loading, error }
- Integrate ClientLayer automatically
- Handle cleanup on unmount

### **[CYCLE-032]** Create `/web/src/hooks/useThingService.ts`

- Generic CRUD hook
- Load things on mount
- Create, update operations
- Automatic list refresh

### **[CYCLE-033]** Create `/web/src/hooks/useService.ts`

- Generic service accessor
- Run any service operation
- Type-safe service access

### **[CYCLE-034]** Create `/web/src/hooks/useForm.ts`

- Form state management with validation
- Integration with Effect schemas
- Error handling per-field
- Submit handler with optimism

### **[CYCLE-035]** Create `/web/src/hooks/useOptimisticUpdate.ts`

- Optimistic updates pattern
- Rollback on error
- Loading state
- Success callback

### **[CYCLE-036]** Create `/web/src/hooks/useMemoEffect.ts`

- Memoization of Effect operations
- Dependency tracking
- Cache cleanup

### **[CYCLE-037]** Create `/web/src/context/EffectContext.tsx`

- EffectProvider component
- useEffectLayer hook
- Default to ClientLayer
- Support layer injection for testing

### **[CYCLE-038]** Create `/web/src/context/UserContext.tsx`

- Current user state
- Session management
- Role-based access

### **[CYCLE-039]** Create `/web/src/context/GroupContext.tsx`

- Current group/organization
- Multi-tenant isolation
- Context switching

### **[CYCLE-040]** Write hook integration tests

- Test all hooks with mock provider
- Test error handling
- Test cleanup
- 85%+ coverage

---

## Phase 5: Astro Integration & SSR (Cycle 41-50)

**Specialists:** Frontend Specialist
**Duration:** 3-4 days
**Deliverable:** SSR data fetching, content layouts, examples
**Status:** ✅ Ready to Start (depends on Phase 3, independent of component migration)
**Can Start:** Day 8

### **[CYCLE-041]** Update `astro.config.ts` to import ConvexProvider

- Configure provider (stub for now)
- Establish provider configuration pattern
- Document environment variables needed

### **[CYCLE-042]** Create `/web/src/pages/example.astro` with server-side fetching

- Demonstrate SSR data fetching with Effect
- Fetch course list server-side
- Pass to client component
- Show loading state handling

### **[CYCLE-043]** Create `/web/src/layouts/BlogPost.astro` content layout

- Load markdown content
- Enrich with dynamic data (related articles)
- Demonstrate Knowledge service integration
- Show server + client component mixing

### **[CYCLE-044]** Create `/web/src/layouts/Layout.astro` base layout

- EffectProvider for client components
- Context setup (user, group)
- Navigation with group switching
- Auth state display

### **[CYCLE-045]** Implement `/web/src/lib/astro-helpers.ts`

- Helper functions for SSR data fetching
- Error handling patterns
- Cache helpers
- Type-safe query utilities

### **[CYCLE-046]** Create 3 example pages showing patterns

- Simple page (list things)
- Form page (create thing)
- Dynamic page (detail with related)
- All with full error handling

### **[CYCLE-047]** Document Astro-Effect integration

- SSR best practices
- Client vs server boundaries
- Content collection integration
- Performance patterns

### **[CYCLE-048]** Write E2E tests for Astro pages

- Test SSR rendering
- Test client hydration
- Test navigation
- Test error states

### **[CYCLE-049]** Performance audit: Astro bundle

- Measure JavaScript footprint
- Analyze island strategy
- Verify streaming works
- Core Web Vitals check

### **[CYCLE-050]** Document SSR caching strategy

- What to cache (rarely changing data)
- What not to cache (user-specific data)
- Cache invalidation patterns
- Performance targets

---

## Phase 6: Component Migration (Cycle 51-70)

**Specialists:** Frontend Specialist
**Duration:** 2-4 weeks
**Deliverable:** 50+ components migrated, tests passing
**Status:** ✅ Ready to Start (depends on Phases 3-4)
**Can Start:** Day 10
**Parallel:** Can overlap with Phases 7-9

### **[CYCLE-051]** Migrate `/web/src/pages/auth/signup.astro`

- Replace Convex hooks with useAuthService
- Maintain form validation
- Keep existing test passing
- Document migration pattern

### **[CYCLE-052]** Migrate `/web/src/pages/auth/signin.astro`

- Replace Convex authentication
- Maintain session handling
- Run auth tests: MUST PASS
- No regression allowed

### **[CYCLE-053]** Migrate `/web/src/components/CourseFeed.tsx`

- Replace useQuery(api.queries.courses.list)
- Use useThingService("course", groupId)
- Update loading/error states
- Run tests

### **[CYCLE-054]** Migrate `/web/src/components/CourseDetail.tsx`

- Replace useQuery(api.queries.courses.get)
- Use useThingService for details + connections
- Maintain all existing features
- Run tests

### **[CYCLE-055]** Migrate `/web/src/components/CreateCourseForm.tsx`

- Replace useMutation(api.mutations.courses.create)
- Use useForm + ThingService
- Add optimistic updates
- Run tests

### **[CYCLE-056]** Migrate dashboard components (5 components)

- RoleManager, GroupManager, UserManager, etc.
- Follow established patterns
- Run tests after each
- Update error handling

### **[CYCLE-057]** Migrate content components (8 components)

- BlogPost display, CommentSection, RelatedArticles, etc.
- Use KnowledgeService for search
- Maintain performance
- Run tests

### **[CYCLE-058]** Migrate form components (10 components)

- Generic form fields, validators, error displays
- Use useForm hook
- Type-safe form data
- Full validation coverage

### **[CYCLE-059]** Migrate utility components (15 components)

- Loading states, error boundaries, notifications
- Use new error types
- Standardize patterns
- Run tests

### **[CYCLE-060]** Verify all auth tests STILL PASS

- Run full auth test suite
- Fix any regressions
- Document fixes
- Commit final passing state

### **[CYCLE-061]** Remove direct Convex imports from all components

- Grep for `from "convex/react"`
- Replace all with DataProvider services
- Verify no Convex hooks remain
- Clean up imports

### **[CYCLE-062]** Update component tests to use mock provider

- 50+ component tests updated
- All use EffectProvider with MockLayer
- No real Convex calls in tests
- 10x faster test suite

### **[CYCLE-063]** Run full component test suite

- 200+ tests should pass
- Verify no flakiness
- Check coverage: 70%+ integration
- Fix any failures

### **[CYCLE-064]** Audit component PropTypes

- All props properly typed
- No `any` types
- Full TypeScript strict mode
- Error types properly propagated

### **[CYCLE-065]** Create component migration guide

- Before/after examples
- Common patterns
- Error handling approach
- Performance considerations

### **[CYCLE-066]** Refactor high-traffic components for performance

- Add React.memo where appropriate
- Optimize re-render patterns
- Use request deduplication
- Benchmark changes

### **[CYCLE-067]** Add accessibility to migrated components

- ARIA labels
- Keyboard navigation
- Focus management
- Color contrast validation

### **[CYCLE-068]** Document component library changes

- Which components use which services
- What error states are possible
- Loading patterns
- Testing approach

### **[CYCLE-069]** Create visual regression tests for 20 key components

- Screenshot baselines
- Test on multiple breakpoints
- Catch unexpected changes
- Maintain visual consistency

### **[CYCLE-070]** Final component audit

- All 50+ migrated
- All tests passing
- No Convex dependencies remain
- Performance targets met

---

## Phase 7: Testing & Validation (Cycle 71-80)

**Specialists:** Quality Specialist (parallel with Phase 6)
**Duration:** 2-3 weeks
**Deliverable:** 90%+ test coverage, full validation suite
**Status:** ✅ Ready to Start (depends on Phase 3)
**Can Start:** Day 10

### **[CYCLE-071]** Create test utilities library

- Mock provider factory
- Test layer compositions
- Assert error types
- Setup/teardown helpers

### **[CYCLE-072]** Write comprehensive service unit tests

- All 6 dimension services
- Happy paths + error scenarios
- Error recovery testing
- Dependency injection verification

### **[CYCLE-073]** Write provider integration tests

- Wrap actual Convex client
- Test real API calls
- Test error scenarios
- Validate transformations

### **[CYCLE-074]** Write hook integration tests

- useEffectRunner with all service combinations
- Error handling in hooks
- Cleanup on unmount
- State management correctness

### **[CYCLE-075]** Validate ontology compliance

- All 6 dimensions properly scoped
- GroupId enforcement across services
- Event logging on mutations
- Connection types validated

### **[CYCLE-076]** Run TypeScript strict mode check

- `bunx astro check` passes
- Zero type errors in services
- Zero `any` types (except entity.properties)
- Full type safety verified

### **[CYCLE-077]** Run ESLint + Prettier

- All code style consistent
- No unused imports
- No dead code
- Auto-fix and verify

### **[CYCLE-078]** Measure test coverage

- Unit: 90%+ coverage
- Integration: 80%+ coverage
- Critical paths: 100% coverage
- Generate coverage report

### **[CYCLE-079]** Write specific auth test additions

- Auth service tests with effect
- Session management validation
- Role-based access control testing
- 2FA pattern testing (if applicable)

### **[CYCLE-080]** Performance validation

- Service call latency < 50ms
- Hook initialization < 10ms
- Component render times acceptable
- Memory leaks check

---

## Phase 8: Error Handling & Resilience (Cycle 81-85)

**Specialists:** Backend Specialist, Frontend Specialist (parallel)
**Duration:** 1-2 weeks
**Deliverable:** Comprehensive error handling, recovery patterns
**Status:** ✅ Ready to Start (depends on Phase 3)
**Can Start:** Day 8

### **[CYCLE-081]** Implement domain error types

- ThingNotFound, ValidationError, ConnectionAlreadyExists
- Each extends Data.TaggedError
- Full type signatures
- Human-friendly messages

### **[CYCLE-082]** Implement provider error mapping

- Map provider-specific errors to domain errors
- Standardize error messages
- Preserve error context
- Enable recovery

### **[CYCLE-083]** Implement error boundaries in React

- Catch service errors in ErrorBoundary
- Display user-friendly messages
- Log errors for debugging
- Allow recovery actions

### **[CYCLE-084]** Implement retry logic in services

- Exponential backoff schedules
- Conditional retries (only for transient errors)
- Max retry attempts
- Metrics tracking

### **[CYCLE-085]** Implement graceful degradation

- Services degrade when provider fails
- Optimistic updates rollback on error
- Cached data serves when fresh unavailable
- Users always get feedback

---

## Phase 9: Documentation & Knowledge (Cycle 86-95)

**Specialists:** Documenter
**Duration:** 1-2 weeks
**Deliverable:** Complete API docs, guides, lessons learned
**Status:** ✅ Ready to Start (continuous throughout)
**Can Start:** Day 10 (parallel with component migration)

### **[CYCLE-086]** Write complete API documentation

- DataProvider interface spec
- All 6 dimension APIs documented
- Error types reference
- Examples for each method

### **[CYCLE-087]** Write service implementation guide

- How to add new service
- Dependency injection patterns
- Error handling approach
- Testing strategy

### **[CYCLE-088]** Write hook library documentation

- useEffectRunner usage
- useThingService patterns
- useService generic usage
- Context provider setup

### **[CYCLE-089]** Write component migration guide

- Before/after examples
- Common patterns discovered
- Pitfalls and solutions
- Performance tips

### **[CYCLE-090]** Write Astro integration guide

- SSR data fetching patterns
- Content layout integration
- Client vs server components
- Performance optimization

### **[CYCLE-091]** Write provider implementation guide

- How to add new backend provider
- DataProvider interface requirements
- Transformation patterns
- Testing approach

### **[CYCLE-092]** Write testing guide

- Unit testing services
- Component testing patterns
- Mock provider setup
- E2E testing approach

### **[CYCLE-093]** Document error handling patterns

- Error types and meanings
- Recovery strategies
- User-facing error messages
- Developer error messages

### **[CYCLE-094]** Create architecture decision record (ADR)

- Why Effect.ts for services
- Why DataProvider interface
- Why this migration approach
- Lessons learned

### **[CYCLE-095]** Update main CLAUDE.md

- Link to new frontend-effects docs
- Update architecture diagrams
- Update development workflow
- Point to implementation guides

---

## Phase 10: Performance & Deployment (Cycle 96-100)

**Specialists:** Frontend Lead, DevOps
**Duration:** 1 week
**Deliverable:** Performance optimized, production ready
**Status:** ✅ Ready to Start (final phase, depends on Phase 6)
**Can Start:** Week 5

### **[CYCLE-096]** Optimize bundle size

- Code split by route
- Lazy load heavy components
- Tree-shake unused code
- Measure final bundle: < 150kb gzip

### **[CYCLE-097]** Optimize runtime performance

- Implement request deduplication
- Add response caching layer
- Profile with React DevTools
- Target: LCP < 2.5s, CLS < 0.1

### **[CYCLE-098]** Remove Convex dependencies

- Delete `/web/convex/` directory
- Remove `convex` from package.json
- Update build process
- Verify frontend still works

### **[CYCLE-099]** Final validation and smoke tests

- Run all test suites: 100% pass
- Run auth tests: MUST pass
- Type check: Zero errors
- Lint: Zero warnings

### **[CYCLE-100]** Mark complete and document rollout

- Create migration summary doc
- List all completed phases
- Performance metrics achieved
- Next steps for alternative providers
- Notify stakeholders

---

## Parallel Execution Strategy

### **Week 1:** Phases 1-2 (Foundation + DataProvider)

- **Frontend Lead:** Direct phase 1 planning
- **Backend Specialist:** Phase 2 DataProvider interface

### **Week 2:** Phases 2-3-4 (Services + Hooks)

- **Backend Specialist:** Complete Phase 3 services
- **Frontend Specialist:** Phase 4 React hooks
- **Quality Specialist:** Begin Phase 7 test framework

### **Weeks 3-4:** Phases 5-6-7-8 (Integration + Migration + Testing)

- **Frontend Specialist:** Phase 5 Astro integration + Phase 6 component migration
- **Quality Specialist:** Phase 7 comprehensive testing + Phase 8 error handling
- **Backend Specialist:** Support + Phase 8 recovery patterns

### **Weeks 5-6:** Phases 9-10 (Documentation + Deployment)

- **Documenter:** Phase 9 documentation
- **Frontend Lead:** Phase 10 deployment + final validation
- **Quality Specialist:** Final smoke tests

---

## Success Criteria

### **Phase Completions:**

- ✅ Phase 1: Blueprint approved, task breakdown complete
- ✅ Phase 2: DataProvider interface implemented, documented
- ✅ Phase 3: 6 services complete, 90%+ test coverage
- ✅ Phase 4: 6+ hooks working, integrated with services
- ✅ Phase 5: Astro SSR working, 3+ example pages
- ✅ Phase 6: 50+ components migrated, all tests passing
- ✅ Phase 7: 90%+ coverage, validation complete
- ✅ Phase 8: Error handling comprehensive, resilience proven
- ✅ Phase 9: Complete documentation, guides written
- ✅ Phase 10: Performance optimized, production ready

### **Critical Requirements:**

- ✅ All existing auth tests PASS throughout migration
- ✅ Zero regression in functionality
- ✅ Zero downtime (components migrate independently)
- ✅ TypeScript strict mode: 0 errors
- ✅ Frontend has ZERO Convex imports remaining

### **Quality Targets:**

- ✅ Test coverage: 90% unit, 80% integration
- ✅ Performance: LCP < 2.5s, bundle < 150kb
- ✅ Type safety: No `any` except entity.properties
- ✅ Error tracking: All code paths have effect error channels

---

## Contingency Plans

**If DataProvider blocker:** Skip to Phase 3 (design to interface)
**If service blocker:** Pause component migration, focus on testing
**If hook blocker:** Continue with existing Convex hooks temporarily
**If migration blocker:** Roll back individual components without affecting others

---

## Resource Allocation

| Role                | FTE | Phases       | Key Tasks                           |
| ------------------- | --- | ------------ | ----------------------------------- |
| Frontend Lead       | 1   | 1, 10        | Direct, manage blockers, QA release |
| Backend Specialist  | 1   | 2, 3, 8      | Services, provider, error handling  |
| Frontend Specialist | 1   | 4, 5, 6      | Hooks, Astro, components            |
| Quality Specialist  | 1   | 7, 8, 10     | Testing, validation, smoke tests    |
| Documenter          | 0.5 | 9 (parallel) | Docs, guides, architecture          |

---

## Definition of Done

**Cycle is complete when:**

1. Code is written and committed
2. Tests are passing (relevant phase target)
3. Documentation is updated
4. PR is approved (code review)
5. Auth tests still pass (every phase)
6. Performance targets met

---

## Rollout Timeline

```
Week 1:     Foundation + DataProvider
Week 2:     Services + Hooks
Weeks 3-4:  Integration + Migration (parallel)
Weeks 5-6:  Documentation + Deployment

Day 1:  Kickoff, phase 1-2 start
Day 5:  DataProvider complete, phase 3-4 start
Day 10: Services complete, phase 5-6-7-8 start in parallel
Day 20: Component migration halfway
Day 25: All components migrated
Day 30: Phase 7-9 complete, phase 10 final validation
Day 35: Production deployment, celebrate 🎉
```

---

**Goal: Production-ready, backend-agnostic frontend in 5-6 weeks with zero downtime.**

**Key principle: Every phase delivers working code. No "pending" states. Always deployable.**

---

_Built with parallel execution, clear phases, and infrastructure-agnostic architecture in mind._
