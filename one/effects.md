# Effects

How ONE uses Effect.ts to make every operation typed, composable, and backend-agnostic.

---

## Why Effect

The ONE platform serves governments, enterprises, creators, and kids — each on different backends (Convex, WordPress, Notion, Supabase). Effect.ts gives us:

- **One interface, many backends** — same code runs against any data source
- **Typed errors** — no thrown exceptions, every failure is a discriminated union
- **Dependency injection** — swap backends via Layer without touching business logic
- **Composable flows** — complex multi-step operations via `Effect.gen()`

```
┌──────────────────────────────────────────────────────┐
│                    React Components                    │
│                                                        │
│  useEffectRunner() → loading / error / data            │
├──────────────────────────────────────────────────────┤
│                    Service Layer                        │
│                                                        │
│  ThingService  GroupService  ConnectionService  ...     │
│  Context.Tag() for DI — no concrete implementations    │
├──────────────────────────────────────────────────────┤
│                   DataProvider Interface                │
│                                                        │
│  things.get()  groups.list()  events.create()  ...     │
│  All return Effect.Effect<Success, Error, never>       │
├──────────────────────────────────────────────────────┤
│                    Provider Layer                       │
│                                                        │
│  ConvexProvider │ WordPressProvider │ NotionProvider     │
│  CompositeProvider (routes to multiple backends)        │
└──────────────────────────────────────────────────────┘
```

---

## The DataProvider Interface

Every backend implements this. Every operation returns an Effect.

```typescript
// web/src/providers/DataProvider.ts

export interface DataProvider {
  things: {
    get: (id: string) => Effect.Effect<Thing, ThingNotFoundError>
    list: (options?: ListThingsOptions) => Effect.Effect<Thing[], QueryError>
    create: (input: CreateThingInput) => Effect.Effect<string, ThingCreateError>
    update: (id: string, input: UpdateThingInput) => Effect.Effect<void, ThingUpdateError>
    delete: (id: string) => Effect.Effect<void, ThingNotFoundError>
  }
  connections: { /* same pattern */ }
  events: { /* same pattern */ }
  knowledge: { /* same pattern */ }
  groups: { /* same pattern */ }
  auth: { /* same pattern */ }
}
```

Maps directly to the 6 dimensions:

| Dimension | DataProvider | Effect Error Types |
|-----------|-------------|-------------------|
| **Things** | `things.*` | ThingNotFoundError, ThingCreateError, ThingUpdateError |
| **Connections** | `connections.*` | ConnectionNotFoundError, ConnectionCreateError |
| **Events** | `events.*` | EventCreateError |
| **Knowledge** | `knowledge.*` | KnowledgeNotFoundError |
| **Groups** | `groups.*` | GroupNotFoundError, GroupCreateError |
| **People/Auth** | `auth.*` | AuthError, TokenError, PasswordError |

---

## Typed Errors

No exceptions. Every error is a tagged union.

```typescript
// Tagged errors — catchable by type
export class ThingNotFoundError extends Data.TaggedError("ThingNotFoundError")<{
  id: string
  message: string
}> {}

export class ConfigValidationError extends Data.TaggedError("ConfigValidationError")<{
  errors: string[]
  providerType?: string
}> {}

// Catch by tag — precise error handling
ThingService.get(id).pipe(
  Effect.catchTag("ThingNotFoundError", (error) => {
    console.log(`Thing ${error.id} not found`)
    return Effect.succeed(null)
  })
)
```

Error helpers for common cases:

```typescript
DataProviderErrorHelpers.network()     // connection failures
DataProviderErrorHelpers.notFound()    // missing entities
DataProviderErrorHelpers.validation()  // bad input
```

---

## Provider Implementations

### Convex Provider

Wraps Convex queries/mutations in Effects:

```typescript
// web/src/providers/convex/ConvexProvider.ts

function toEffect<T, E>(
  fn: () => Promise<T>,
  createError: (message: string, cause?: unknown) => E
): Effect.Effect<T, E> {
  return Effect.tryPromise({
    try: fn,
    catch: (error) => createError(String(error), error) as E
  })
}

// Usage
things: {
  get: (id: string) =>
    toEffect(
      () => client.query("entities:get", { id }),
      (message) => new ThingNotFoundError(id, message)
    )
}
```

### WordPress Provider

Maps WordPress REST API to the same interface:

```typescript
// web/src/providers/wordpress/WordPressProvider.ts

things: {
  get: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const match = id.match(/^wp-post-(\d+)$/)
        if (!match) throw new ThingNotFoundError(id, "Invalid ID")
        const post = await fetchWP(`/posts/${match[1]}`)
        return mapPostToThing(post)
      },
      catch: (error) => new ThingNotFoundError(id, String(error))
    })
}
```

### Composite Provider

Routes to multiple backends — same interface, Effect.gen() composes results:

```typescript
// web/src/providers/composite/CompositeProvider.ts

groups: {
  list: (options?: ListGroupsOptions) =>
    Effect.gen(function* () {
      const results: Group[] = []
      for (const route of config.routes) {
        const groups = yield* route.provider.groups.list(options)
        results.push(...groups)
      }
      results.sort((a, b) => b.createdAt - a.createdAt)
      if (options?.limit) return results.slice(0, options.limit)
      return results
    })
}
```

---

## Dependency Injection

Services use `Context.Tag` — no concrete implementations at definition time.

```typescript
// web/src/services/GroupService.ts

export class GroupService extends Context.Tag("GroupService")<
  GroupService,
  {
    readonly get: (id: string) => Effect.Effect<Group, GroupNotFoundError>
    readonly list: (options?: ListGroupsOptions) => Effect.Effect<Group[], QueryError>
    readonly create: (input: CreateGroupInput) => Effect.Effect<string, GroupCreateError>
  }
>() {
  // Static methods for convenience
  static get(id: string): Effect.Effect<Group, GroupNotFoundError, GroupService> {
    return Effect.flatMap(GroupService, (service) => service.get(id))
  }
}
```

Layers provide the concrete implementation:

```typescript
// web/src/providers/factory.ts

export function createDataProviderLayer(provider: DataProvider) {
  return Layer.succeed(DataProviderService, provider)
}

// Run with a specific backend
const program = Effect.gen(function* () {
  const provider = yield* DataProviderService
  return yield* provider.things.list({ type: 'course' })
})

const result = await Effect.runPromise(
  program.pipe(Effect.provide(convexLayer))
)
```

Swap `convexLayer` for `wordpressLayer` — zero code changes.

---

## React Integration

The `useEffectRunner` hook bridges Effect programs to React state:

```typescript
// web/src/hooks/useEffectRunner.ts

export function useEffectRunner<E, A>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<E | null>(null)
  const [data, setData] = useState<A | null>(null)

  const run = useCallback(async (
    program: Effect.Effect<A, E, never>,
    options?: { onSuccess?: (result: A) => void; onError?: (error: E) => void }
  ) => {
    setLoading(true)
    setError(null)

    const exit = await Effect.runPromiseExit(program)
    if (Exit.isSuccess(exit)) {
      setData(exit.value)
      options?.onSuccess?.(exit.value)
    } else {
      const err = exit.cause._tag === "Fail" ? exit.cause.error : exit.cause
      setError(err as E)
      options?.onError?.(err as E)
    }
    setLoading(false)
  }, [])

  return { run, loading, error, data }
}
```

In components:

```tsx
function CourseList() {
  const { run, loading, error, data } = useEffectRunner<QueryError, Thing[]>()

  useEffect(() => {
    run(ThingService.list({ type: 'course' }).pipe(
      Effect.provide(layer)
    ))
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorDisplay error={error} />
  return <Grid items={data} />
}
```

---

## Backend Services

Backend uses Effect for typed errors and layer composition:

```typescript
// backend/convex/services/layers.ts

export class AgentError extends Data.TaggedError("AgentError")<{
  cause?: unknown
  message?: string
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  cause?: unknown
  operation: string
  table?: string
}> {}

// Wrap database operations
export function wrapDatabase<T>(
  operation: "query" | "mutation",
  table: string | undefined,
  fn: () => Promise<T>
): Effect.Effect<T, DatabaseError> {
  return Effect.tryPromise({
    try: fn,
    catch: (cause) => new DatabaseError({ cause, operation, table })
  })
}

// Compose all services
export const AppLayer = Layer.mergeAll(
  RateLimiterServiceLive,
  RAGServiceLive,
  AgentServiceLive
)

// Run with all services provided
export function runWithServices<A, E>(
  effect: Effect.Effect<A, E, any>
): Promise<A> {
  return Effect.runPromise(Effect.provide(effect, AppLayer))
}
```

---

## Validation

Comprehensive validation returns typed errors, never throws:

```typescript
// web/src/config/validation.ts

export function validateConfigComprehensive(
  config: ProviderConfig
): Effect.Effect<ProviderConfig, ConfigValidationError | MissingConfigFieldError> {
  return Effect.gen(function* () {
    yield* validateConfig(config)
    switch (config.type) {
      case "wordpress":
        yield* validateRequiredFields(config, ["url", "username", "password"])
        yield* validateUrl(config.url, "url")
        break
      case "convex":
        yield* validateRequiredFields(config, ["deploymentUrl"])
        break
    }
    return config
  })
}

// Synchronous validation helpers
const isValid = Effect.runSync(
  validateConfig(config).pipe(
    Effect.map(() => true),
    Effect.catchAll(() => Effect.succeed(false))
  )
)
```

---

## Effect Constructs Used

| Construct | Purpose | Where |
|-----------|---------|-------|
| `Effect.Effect<A, E, R>` | Every async operation | All providers, services |
| `Effect.gen(function*())` | Compose operations | CompositeProvider, validation |
| `Effect.tryPromise()` | Wrap Convex/API calls | All providers |
| `Effect.succeed()` / `Effect.fail()` | Immediate values | Error recovery, stubs |
| `Effect.pipe()` | Chain operators | Error handling, transforms |
| `Effect.catchTag()` | Handle specific error | Components, services |
| `Effect.provide(layer)` | Inject dependencies | Factory, tests |
| `Effect.runPromise()` | Execute to Promise | React hooks |
| `Effect.runPromiseExit()` | Execute with exit info | useEffectRunner |
| `Effect.runSync()` | Synchronous execution | Validation helpers |
| `Context.Tag()` | Service definition (DI) | All services |
| `Layer.succeed()` | Create concrete layer | Providers, stubs |
| `Layer.mergeAll()` | Compose layers | AppLayer |
| `Data.TaggedError()` | Typed error unions | All error types |
| `Exit` | Success/failure result | useEffectRunner |

---

## TypeQL ↔ Effect Mapping

The TypeQL schemas (1,606 lines in `src/schema/`, 4,157 lines in `packages/`) implement the same 6 dimensions as the DataProvider — but with inference rules that fire automatically. Effect wraps these in typed, composable operations.

### Dimension Mapping

| Dimension | DataProvider | TypeQL Entity | TypeQL Relations | Inference |
|-----------|-------------|---------------|-----------------|-----------|
| **Groups** | `groups.*` | `group` | `membership`, `hierarchy` | `splitting-colony` (internal highways diverge) |
| **Actors** | `auth.*` | `unit` | `capability`, `assignment` | `proven-unit` (sr ≥ 0.75), `at-risk-unit` (sr < 0.40) |
| **Things** | `things.*` | `task` | `dependency`, `trail` | `attractive-task` (trail ≥ 50), `repelled-task` (resistance > trail) |
| **Paths** | *missing — add* | `edge` | `flow`, `connection` | `highway` (strength ≥ 50), `toxic-edge` (resistance > strength) |
| **Events** | `events.*` | `signal` | `traversal`, `contribution-event` | `hypothesis-action-ready` (p ≤ 0.05, n ≥ 50) |
| **Knowledge** | *missing — add* | `hypothesis`, `frontier` | `tests`, `spawns` | `action-ready`, `promising-frontier` (ev ≥ 0.5) |

**Paths and Knowledge are the learning layer** — currently missing from `DataProvider`.

### TypeDB Provider

Wraps TypeQL queries in Effect. The schema is ready (1,606 lines). The driver is the gap.

```typescript
// Future: TypeDBProvider extends DataProvider

import { Effect, Data } from "effect"

// Error types from inference rules
export class PathToxicError extends Data.TaggedError("PathToxicError")<{
  from: string; to: string; resistance: number; weight: number
}> {}

export class AgentNotProvenError extends Data.TaggedError("AgentNotProvenError")<{
  agentId: string; successRate: number; threshold: number
}> {}

export class ConfidenceLowError extends Data.TaggedError("ConfidenceLowError")<{
  task: string; confidence: number; threshold: number
}> {}

export class NoHighwayError extends Data.TaggedError("NoHighwayError")<{
  task: string; bestWeight: number
}> {}

// TypeDB query wrapper
function tql<T>(query: string): Effect.Effect<T, DatabaseError> {
  return Effect.tryPromise({
    try: () => db.query(query),
    catch: (cause) => new DatabaseError({ cause, operation: "query" })
  })
}
```

### Wrapping Inference Functions

TypeQL functions become Effect operations. The inference rules fire inside TypeDB — Effect just types the results.

```typescript
// fun highways(min_strength, min_traversals) → { edge }
const highways = (limit = 10): Effect.Effect<Edge[], QueryError> =>
  tql(`match let $e in highways(10.0, 50); fetch $e;`)

// fun optimal_route($from, $task) → { unit, edge }
const bestAgent = (from: string, task: string): Effect.Effect<Unit, AgentNotFoundError> =>
  tql(`match let ($u, $e) in optimal_route("${from}", "${task}"); fetch $u;`)

// fun ready_tasks() → { task } — uses negation (Lesson 4)
const readyTasks = (): Effect.Effect<Task[], QueryError> =>
  tql(`match let $t in ready_tasks(); fetch $t;`)

// fun promising_frontiers() → { frontier } — autonomous goals (Lesson 6)
const frontiers = (): Effect.Effect<Frontier[], QueryError> =>
  tql(`match let $f in promising_frontiers(); fetch $f;`)

// fun proven_units() → { unit } — multi-attribute classification (Lesson 1)
const provenAgents = (): Effect.Effect<Unit[], QueryError> =>
  tql(`match let $u in proven_units(); fetch $u;`)
```

### Inference Rules as Error Guards

TypeQL rules infer status automatically. Effect reads those statuses and branches:

```typescript
// Rule: highway — when strength >= 50
// Rule: toxic-edge — when resistance > strength AND resistance >= 10

const routeWithConfidence = (task: string) => Effect.gen(function* () {
  const edges = yield* tql<Edge[]>(
    `match $e($s, $t) isa path, has path-status $st;
     $t isa unit, has capability $c; $c contains "${task}";
     fetch $e, $st;`
  )

  const highway = edges.find(e => e.status === "highway")
  if (highway) return highway.target  // fast path, ~50ms

  const fresh = edges.find(e => e.status === "fresh")
  if (fresh) return fresh.target      // known path, moderate confidence

  // No path — fall back to LLM (expensive, ~2s)
  return yield* Effect.fail(
    new NoHighwayError({ task, bestWeight: edges[0]?.strength ?? 0 })
  )
})
```

---

## The Learning Layer

The DataProvider interface needs two new dimensions for the substrate:

```typescript
interface DataProvider {
  // ... existing 4 dimensions ...

  // Dimension 4: Paths (the learning memory)
  paths: {
    drop: (from: string, to: string, weight?: number) =>
      Effect.Effect<void, DatabaseError>
    resist: (from: string, to: string, resistance?: number) =>
      Effect.Effect<void, DatabaseError>
    fade: (rate?: number) =>
      Effect.Effect<void, DatabaseError>
    follow: (task: string) =>
      Effect.Effect<string, PathToxicError | NoHighwayError>
  }

  // Dimension 6: Knowledge (inference outputs)
  knowledge: {
    highways: (limit?: number) =>
      Effect.Effect<Path[], QueryError>
    toxic: () =>
      Effect.Effect<Path[], QueryError>
    best: (task: string) =>
      Effect.Effect<Actor, AgentNotFoundError>
    proven: () =>
      Effect.Effect<Actor[], QueryError>
    frontiers: () =>
      Effect.Effect<Frontier[], QueryError>
  }
}
```

### The Learning Loop in Effect

Signal flow + learning as one composable program:

```typescript
const signalWithLearning = (
  receiver: string, data: unknown
) => Effect.gen(function* () {
  const provider = yield* DataProviderService

  // 1. Route — follow strongest path (emergent)
  const target = yield* provider.knowledge.best(receiver).pipe(
    Effect.catchTag("AgentNotFoundError", () =>
      // No proven agent — ask LLM (expensive)
      LLMService.decide(receiver, data)
    )
  )

  // 2. Execute — send signal to target
  const result = yield* provider.things.execute(target, data)

  // 3. Learn — success strengthens path
  yield* provider.paths.mark(receiver, target)

  // 4. Continue — if task has continuation, emit next signal
  const next = provider.things.continuation(target, result)
  if (next) yield* signalWithLearning(next.receiver, next.data)

  return result
}).pipe(
  // Failure path — weaken the route
  Effect.tapError(() =>
    Effect.gen(function* () {
      const provider = yield* DataProviderService
      yield* provider.paths.warn(receiver, target)
    })
  )
)
```

### Fade as Background Effect

Decay runs on a schedule — old paths weaken, forcing exploration:

```typescript
import { Schedule } from "effect"

const fadeLoop = Effect.gen(function* () {
  const provider = yield* DataProviderService
  yield* provider.paths.fade(0.05)  // multiply all weights by 0.95
}).pipe(
  Effect.repeat(Schedule.fixed("10 seconds")),
  Effect.provide(substrateLayer)
)
```

---

## Six Lessons as Effect Patterns

The TypeQL inference patterns (packages/typedb-inference-patterns/) map to Effect patterns:

### Lesson 1: Classification → Type Guards

```tql
-- TypeQL: multi-attribute classification
fun proven_units() -> { unit }:
    match $u isa unit, has success-rate $sr >= 0.75,
          has activity-score $as >= 70.0, has sample-count $sc >= 50;
    return { $u };
```

```typescript
// Effect: classification as error guard
const requireProven = (agentId: string) =>
  provenAgents().pipe(
    Effect.flatMap(agents =>
      agents.find(a => a.id === agentId)
        ? Effect.succeed(agents.find(a => a.id === agentId)!)
        : Effect.fail(new AgentNotProvenError({ agentId, successRate: 0, threshold: 0.75 }))
    )
  )
```

### Lesson 2: Quality Bands → Error Severity

```tql
-- TypeQL: mutually exclusive quality rules
rule high-quality-record:
    when { $r isa learning-record, has effectiveness $e; $e >= 0.7; }
    then { $r has quality-label "high"; };
```

```typescript
// Effect: error types map to quality bands
type PathQuality = "highway" | "fresh" | "fading" | "toxic"
// highway: weight >= 50 (reliable)
// fresh:   weight 10-50 (working)
// fading:  weight 0-5   (dying)
// toxic:   resistance > weight (avoid)
```

### Lesson 3: Hypothesis Lifecycle → State Machines

```tql
-- TypeQL: hypothesis confirmed when statistically significant
rule hypothesis-action-ready:
    when { $h isa hypothesis, has hypothesis-status "confirmed",
           has p-value $p, has observations-count $n;
           $p <= 0.05; $n >= 50; }
    then { $h has action-ready true; };
```

```typescript
// Effect: state transitions with typed gates
const actOnHypothesis = (id: string) => Effect.gen(function* () {
  const h = yield* tql<Hypothesis>(
    `match $h isa hypothesis, has hid "${id}"; fetch $h;`
  )
  if (!h.actionReady) {
    return yield* Effect.fail(new HypothesisNotReadyError({
      id, pValue: h.pValue, observations: h.observationsCount
    }))
  }
  return yield* executeAction(h)
})
```

### Lesson 4: Negation → Precondition Checks

```tql
-- TypeQL: task ready = no blocking dependencies incomplete
fun ready_tasks() -> { task }:
    match $t isa task, has status "todo";
          not { ($t, $b) isa dependency; $b has status $s; not { $s == "complete"; }; };
    return { $t };
```

```typescript
// Effect: preconditions as Effect.filterOrFail
const requireReady = (taskId: string) =>
  readyTasks().pipe(
    Effect.filterOrFail(
      tasks => tasks.some(t => t.id === taskId),
      () => new TaskBlockedError({ taskId, reason: "dependency incomplete" })
    )
  )
```

### Lesson 5: Aggregates → Pipeline Composition

```tql
-- TypeQL: best synergy pair by contribution chain value
fun best_synergy() -> { string, string, double }:
    match $chain (contributor: $a, beneficiary: $b) isa contribution-chain,
          has chain-value $v;
    return { $name_a, $name_b, sum($v) };
```

```typescript
// Effect: compose pipeline and measure combined impact
const measureSynergy = Effect.gen(function* () {
  const pairs = yield* tql<Synergy[]>(
    `match let ($a, $b, $v) in best_synergy(); fetch $a, $b, $v;`
  )
  return pairs.sort((a, b) => b.value - a.value)
})
```

### Lesson 6: Frontier Detection → Autonomous Goals

```tql
-- TypeQL: high-value unexplored areas spawn objectives
fun promising_frontiers() -> { exploration-frontier }:
    match $f isa exploration-frontier,
          has frontier-status "unexplored", has expected-value $ev;
          $ev >= 0.5;
    return { $f };
```

```typescript
// Effect: self-improving system — explore, learn, act
const explore = Effect.gen(function* () {
  const provider = yield* DataProviderService
  const frontiers = yield* provider.knowledge.frontiers()

  for (const f of frontiers) {
    // Spawn autonomous objective from frontier
    yield* provider.things.create({
      type: "objective",
      name: `explore-${f.id}`,
      properties: { expectedValue: f.expectedValue, frontier: f.id }
    })
  }
})
```

---

## Connection to Substrate

Effect.ts and the substrate solve the same problem at different scales:

| Concern | Effect.ts (ONE web) | Substrate (envelopes) | TypeQL (persistence) |
|---------|--------------------|-----------------------|---------------------|
| **Routing** | `Context.Tag` → `Layer.provide()` | `signal()` → `world.follow()` | `optimal_route()` function |
| **Error flow** | `Effect.catchTag()` | `resist()` → toxic path | `fun is_toxic` infers status |
| **Composition** | `Effect.gen(function*())` | `.then()` continuations | `continuation` relation |
| **Multi-backend** | CompositeProvider routes | World routes to units | `membership` + `capability` |
| **Learning** | — (static routing) | `mark()` / `fade()` / `highways()` | `edge` weight + inference rules |
| **Classification** | `Data.TaggedError()` | Path status (highway/toxic) | Rules: proven, at-risk, fading |
| **Autonomy** | — (human-triggered) | Continuations chain signals | `spawns` frontier → objective |

**Three layers, one flow:**

```
Effect.ts          →  types the operations
Substrate (TS)     →  routes the signals, learns from outcomes
TypeQL (TypeDB)    →  persists the weights, runs inference

Effect.catchTag("PathToxicError")
  ↕ maps to
world.warn(from, to)
  ↕ persists as
update edge resistance += 1.0 where source = $from, target = $to
  ↕ triggers
fun is_toxic: resistance > strength → path-status "toxic"
```

---

## File Map

```
ONE/web/src/
├── providers/
│   ├── DataProvider.ts          # Interface + error types
│   ├── factory.ts               # Layer creation
│   ├── ConvexProvider.ts        # Convex → Effect wrapper
│   ├── convex/ConvexProvider.ts # Alternative Convex impl
│   ├── wordpress/               # WordPress → Effect wrapper
│   ├── notion/                  # Notion → Effect wrapper
│   ├── composite/               # Multi-backend router (Effect.gen)
│   ├── BetterAuthProvider.ts    # Auth provider
│   └── examples/usage.ts       # 7 documented examples
├── services/
│   ├── ThingService.ts          # Context.Tag — Dimension 3
│   ├── GroupService.ts          # Context.Tag — Dimension 1
│   ├── ConnectionService.ts     # Context.Tag — Dimension 4 (partial)
│   ├── EventService.ts          # Context.Tag — Dimension 5
│   └── KnowledgeService.ts     # Context.Tag — Dimension 6 (partial)
├── hooks/
│   └── useEffectRunner.ts       # React ↔ Effect bridge
├── config/
│   └── validation.ts            # Typed validation (Effect.try)
└── lib/
    └── effect-client.ts         # Client setup

ONE/backend/convex/
├── services/
│   └── layers.ts                # Backend services + AppLayer
└── lib/
    └── validation.ts            # Error types (_tag pattern)

envelopes/src/schema/              # TypeQL — what Effect will wrap
├── agents.tql      (134 lines)   # Envelope communication
├── skins.tql   (301 lines)   # 6 metaphor skins
├── sui.tql         (334 lines)   # Move/Sui on-chain mirror
├── substrate.tql   (486 lines)   # ONE ontology + 6 inference lessons
├── unified.tql     (134 lines)   # Unified view
└── one.tql         (217 lines)   # Entity definitions

envelopes/packages/typedb-inference-patterns/
├── standalone/
│   ├── genesis.tql         (1,436 lines)  # All 6 lessons unified
│   ├── task-management.tql   (601 lines)  # Lesson 4: negation
│   ├── substrate.tql         (567 lines)  # Production schema
│   ├── launchpad.tql         (496 lines)  # Token intelligence
│   ├── seed.tql              (371 lines)  # Bootstrap data
│   ├── quality-rules.tql     (257 lines)  # Lesson 2: bands
│   ├── autonomous-goals.tql  (245 lines)  # Lesson 6: frontiers
│   ├── classification.tql    (217 lines)  # Lesson 1: tiers
│   ├── hypothesis-lifecycle.tql (214 lines) # Lesson 3: states
│   └── contribution-tracking.tql (160 lines) # Lesson 5: synergy
└── world.ts       (357 lines)  # Lesson ↔ substrate mapping
```

---

## See Also

- [flows.md](flows.md) — How signals flow through the substrate (emergent routing)
- [one-ontology.md](one-ontology.md) — Six dimensions the DataProvider maps to
- [ontology.md](one/ontology.md) — TypeDB inference rules that become Effect error guards
- [substrate-learning.md](substrate-learning.md) — mark/fade/highways as reinforcement learning
- [typedb.md](typedb.md) — TypeDB 3.0 architecture and pulse client
- [integration.md](integration.md) — How all systems connect through world()
- [gaps.md](gaps.md) — Gap 1: TypeDB driver is the keystone for Effect ↔ TypeQL
- [code.md](code.md) — 70-line substrate (complement to Effect layer)

---

*Typed. Composable. Backend-agnostic. Learning. Effect types the operations. Substrate routes the signals. TypeDB persists the knowledge.*
