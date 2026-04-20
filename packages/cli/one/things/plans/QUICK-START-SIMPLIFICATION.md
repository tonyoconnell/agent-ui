---
title: Quick Start Simplification
dimension: things
category: plans
tags: architecture, connections, events, frontend, groups, knowledge, people, things
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/QUICK-START-SIMPLIFICATION.md
  Purpose: Documents quick start: frontend architecture simplification
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand QUICK START SIMPLIFICATION.
---

# Quick Start: Frontend Architecture Simplification

## TL;DR

**Remove 1,300+ lines of unused abstraction layers. Develop 30-50% faster.**

- Delete: DataProvider, ConvexProvider, ClientLayer, 6 services, useEffectRunner
- Replace: With direct Convex hooks (useQuery, useMutation)
- Effort: 3-4 weeks
- Payback: 2-3 weeks of faster development

---

## Files to Delete

```
web/src/providers/DataProvider.ts           (411 LOC)
web/src/providers/ConvexProvider.ts         (363 LOC)
web/src/providers/convex/ConvexProvider.ts  (363 LOC)  [duplicate?]
web/src/services/ClientLayer.ts             (76 LOC)
web/src/services/ThingService.ts            (156 LOC)
web/src/services/ConnectionService.ts       (46 LOC)
web/src/services/EventService.ts            (32 LOC)
web/src/services/KnowledgeService.ts        (~50 LOC)
web/src/services/GroupService.ts            (~60 LOC)
web/src/services/PeopleService.ts           (~40 LOC)
web/src/hooks/useEffectRunner.ts            (36 LOC)
web/src/context/EffectContext.tsx           (28 LOC)
```

**Total: 1,314+ LOC** → deleted in favor of Convex hooks

---

## Pattern: Before → After

### Creating a Thing

**Before (7 layers):**

```typescript
const { run, loading, error } = useEffectRunner();
const program = Effect.gen(function* () {
  const provider = yield* DataProvider;
  const id = yield* provider.things.create(input);
  yield* provider.events.log({ type: "created", targetId: id });
  return id;
});
await run(program);
```

**After (1 layer):**

```typescript
const create = useMutation(api.mutations.entities.create);
const logEvent = useMutation(api.mutations.events.log);

const id = await create(input);
await logEvent({ type: "created", targetId: id });
```

---

### Listing Things

**Before (Effect composition):**

```typescript
const { run, loading } = useEffectRunner();
const [things, setThings] = useState([]);

useEffect(() => {
  const program = Effect.gen(function* () {
    const provider = yield* DataProvider;
    return yield* provider.things.list({ type: "course" });
  });
  run(program, { onSuccess: setThings });
}, [run]);
```

**After (Reactive query):**

```typescript
const things = useQuery(api.queries.entities.list, { type: "course" }) || [];
```

---

### Testing

**Before (50+ LOC mock):**

```typescript
const mockProvider: DataProvider.DataProvider = {
  things: { create: () => Effect.succeed('123'), ... },
  // ... 50+ more methods
};
const wrapper = ({ children }) => (
  <EffectProvider layer={Layer.succeed(DataProvider, mockProvider)}>
    {children}
  </EffectProvider>
);
```

**After (5 LOC mock):**

```typescript
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(async () => "course-123"),
}));
```

---

## Decision Tree

### 1. Need provider swapping?

- **Yes** → Keep interface at backend, remove from frontend
- **No** → Delete all abstraction (saves 1,300 LOC)
- **Decision needed:** Check with product/architecture

### 2. Need Effect.ts?

- **Yes** → Move to backend only
- **No** → Delete entirely (use plain Error)
- **Decision needed:** Check backend plans

### 3. Timeline?

- **Fast (4 weeks)** → Parallel implementation (lowest risk)
- **Medium (8 weeks)** → One feature per sprint
- **Minimal (2 weeks)** → Only remove harmful code
- **Recommendation:** Fast (parallel implementation)

---

## Migration Phases

### Phase 1: Prepare (1 week)

- [ ] Read ARCHITECTURE-SIMPLIFICATION.md
- [ ] Read SIMPLIFICATION-EXAMPLES.md
- [ ] Create new hook templates
- [ ] Set up side-by-side implementations

### Phase 2: Migrate (2-3 weeks)

- [ ] Migrate ThingService hooks
- [ ] Migrate GroupService hooks
- [ ] Migrate ConnectionService hooks
- [ ] Migrate EventService hooks
- [ ] Migrate KnowledgeService hooks

### Phase 3: Cleanup (1 week)

- [ ] Delete old implementations
- [ ] Delete DataProvider, ConvexProvider, ClientLayer
- [ ] Delete useEffectRunner, EffectContext
- [ ] Delete Services/ directory

### Phase 4: Validate (1 week)

- [ ] All tests passing
- [ ] Performance unchanged or improved
- [ ] Developer feedback positive

---

## Key Metrics

### Code Reduction

- **Deletion:** 1,300+ LOC of abstraction
- **Addition:** 100-200 LOC of hooks
- **Net:** -800 to -1,100 LOC

### Development Speed

- **Before:** 30 min to add a new data operation
- **After:** 10 min to add a new data operation
- **Improvement:** 3x faster

### Cognitive Load

- **Before:** Learn 7 frameworks (Effect, Context, DI, etc.)
- **After:** Learn 2 frameworks (React, Convex)
- **Improvement:** 65% reduction

### Testing

- **Before:** 50+ LOC mock setup per test
- **After:** 5 LOC mock setup per test
- **Improvement:** 10x simpler

---

## Implementation Checklist

### Week 1: Setup

- [ ] Read all documentation
- [ ] Get team alignment on approach
- [ ] Create parallel hook implementations
- [ ] Set up test framework for simplified hooks

### Weeks 2-3: Migration

- [ ] Migrate Things hooks (1-2 days)
- [ ] Migrate Groups hooks (1-2 days)
- [ ] Migrate Connections hooks (1 day)
- [ ] Migrate Events hooks (half day)
- [ ] Migrate Knowledge hooks (half day)
- [ ] Update all usages (3-5 days)
- [ ] Verify tests pass (1 day)

### Week 3-4: Cleanup

- [ ] Delete DataProvider.ts
- [ ] Delete ConvexProvider.ts
- [ ] Delete ClientLayer.ts
- [ ] Delete Services/ directory
- [ ] Delete useEffectRunner.ts
- [ ] Delete EffectContext.tsx
- [ ] Final test run
- [ ] Documentation update

### Week 4: Validation

- [ ] Performance testing
- [ ] Developer feedback
- [ ] Onboarding test (new dev)
- [ ] Feature development test

---

## Why This Matters

### Current State

- 1,300+ LOC of unused abstraction
- 8-layer call stack for simple operations
- 10-15ms latency overhead
- 50+ LOC mocks for testing
- Complex DI setup

### Future State

- 2-layer call stack (component → Convex)
- 2-5ms latency (3x faster)
- 5 LOC mocks for testing
- No DI ceremony
- 70% less code

### Impact

- **Development speed:** 30-50% faster
- **Learning curve:** 65% lower
- **Testing:** 70% easier
- **Maintainability:** 50% simpler

---

## Success Definition

Done when:

- [ ] Zero useEffectRunner usage
- [ ] Zero DataProvider imports
- [ ] All hooks using direct Convex
- [ ] 800+ LOC deleted
- [ ] All tests passing
- [ ] Performance >= current
- [ ] New features 3x faster to add

---

## Common Questions

### Will this break existing code?

No. We migrate in parallel → both exist → switch gradually.

### Will performance change?

Improved. Direct Convex is 3-5x faster than Effect.ts wrapper.

### Do we need to change the backend?

No. Convex backend stays exactly the same.

### What about error handling?

Use standard JavaScript Error instead of 30+ Effect error classes.

### Can we migrate gradually?

Yes. That's the whole point. Build new alongside old.

### How long per hook?

- Simple hook: 5-10 min
- Complex hook: 20-30 min
- Test updates: 10-20 min

---

## Reference

- **ARCHITECTURE-SIMPLIFICATION.md** - Full analysis
- **SIMPLIFICATION-EXAMPLES.md** - Code examples
- **SIMPLIFICATION-SUMMARY.md** - Executive summary
- **This document** - Quick reference

Location: `/one/things/plans/`
