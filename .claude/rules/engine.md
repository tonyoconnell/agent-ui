# Engine Rules

Apply to `src/engine/*.ts`

---

## The Two Locked Rules (non-negotiable)

These two rules compound. Breaking either breaks the flywheel.

### Rule 1 — Closed Loop

**Every signal closes its loop.** `mark()` on result, `warn()` on failure,
`dissolve` on missing unit/capability. No silent returns. No orphan signals.

```typescript
const { result, timeout, dissolved } = await net.ask({ receiver: next })
if (result)        net.mark(edge, chainDepth)  // success → path strengthens
else if (timeout)  /* neutral — not the agent's fault */
else if (dissolved) net.warn(edge, 0.5)         // mild — path doesn't exist
else               net.warn(edge, 1)            // failure — agent produced nothing
```

Why: pheromone is the only thing that compounds. A handler that returns
silently leaks learning. Width (parallelism) only compounds if every
parallel branch deposits a mark or warn on the path it used.

### Rule 2 — Structural Time Only

**Plan in tasks → waves → cycles.** Never days, hours, weeks, sprints,
or any wall-clock unit.

```
task    = atomic unit of work (one .on() handler, one file edit)
wave    = phase within a cycle (W1 recon → W2 decide → W3 edit → W4 verify)
cycle   = full W0-W4 sandwich, exits at rubric >= 0.65
path    = what remembers across cycles (pheromone strength / resistance)
```

Why: the substrate measures **width** by tasks-per-wave, **depth** by
waves-per-cycle, **learning** by cycles-per-path. Calendar time can't be
`mark()`d, so it doesn't compound. Genuine external deadlines (merge
freezes, release cuts) are the only wall-clock exception — they come
from outside the substrate.

---

## The Substrate

```
~90 lines.  Zero returns.  Two fields.  Queue.

{ receiver, data }

That's all that flows.
The runtime moves signals. TypeDB remembers.
```

---

## Two Layers

```
NERVOUS SYSTEM (runtime)         BRAIN (TypeDB)
signals, strength, resistance, queue     paths, units, skills, knowledge
loops L1-L3 (ms to minutes)      loops L4-L7 (hours to weeks)
```

The runtime handles what moves. TypeDB handles what remains.

---

## Tasks = Handlers, Dependencies = Continuations

```typescript
// Tasks are .on() handlers on units
// Dependencies are .then() continuations
const bob = net.add('bob')
  .on('schema', async (data, emit) => buildSchema(data))
  .then('schema', r => ({ receiver: 'bob:api', data: r }))
  .on('api', async (data, emit) => buildAPI(data))
  .then('api', r => ({ receiver: 'bob:test', data: r }))

// No task entities. No dependency relations. No trail relations.
// Pheromone accumulates on paths automatically.
```

---

## Agent Self-Improvement

Units have `model`, `system-prompt`, `generation`.
The substrate measures performance. When it's bad enough, the agent evolves.

```typescript
// TypeDB detects
needs_evolution(unit) → success-rate < 0.50, sample-count >= 20

// Agent responds
unit.system-prompt = rewrite(old-prompt, failures)
unit.generation++
```

Two layers of learning:
- **Substrate** — pheromone on paths. World gets smarter.
- **Agent** — prompt/model evolution. Individual gets smarter.

---

## Signal

```typescript
type Signal = {
  receiver: string      // "unit" or "unit:task"
  data?: unknown        // anything
}
```

The universal primitive.

---

## Unit

```typescript
unit(id, route?)
  .on(name, fn)           // define task (handler)
  .then(name, template)   // define continuation (dependency)
  .role(name, task, ctx)  // context-bound task
  .has(name)              // introspection
  .list()                 // introspection
  .id                     // identity
```

### Task Signature

```typescript
(data, emit, ctx) => result

data   // the data
emit   // (signal) => void — fan out
ctx    // { from: string, self: string }
```

---

## World

```typescript
world()
  .add(id)                // create unit (auto-drains queued signals)
  .remove(id)             // remove unit (trails remain, fade naturally)
  .signal(signal, from?)  // route signal, mark pheromone
  .enqueue(signal)        // queue for later processing
  .drain()                // shift from queue, signal it
  .pending()              // queue length
  .mark(edge, strength?)  // strengthen path
  .warn(edge, strength?)  // weaken path
  .sense(edge)            // read strength
  .danger(edge)           // read resistance
  .follow(type)           // best path (deterministic)
  .select(type?)          // best path (probabilistic, ant-like)
  .fade(rate?)            // decay all paths (resistance 2x faster)
  .highways(limit?)       // top weighted paths
  .has(id)                // introspection
  .list()                 // introspection
  .get(id)                // direct access
```

---

## Persist

```typescript
persist()                           // extends world with TypeDB
  .actor(id, kind?, opts?)          // add + persist
  .flow(from, to)                   // mark/warn wrapper
  .open(n?)                         // top paths as {from, to, strength}
  .blocked()                        // toxic paths
  .know()                           // promote highways to knowledge
  .recall(match?)                   // query knowledge from TypeDB
```

---

## Zero Returns

Positive flow only. Silence is valid.

```typescript
// GOOD
task?.(data, emit, ctx).then(result =>
  next[name] && route?.(next[name](result), receiver)
)

// BAD
if (!task) return reject(...)
if (!target) throw new Error(...)
```

Missing handler? Signal dissolves. Group continues.

---

## The Tick

```typescript
const next = net.select()              // follow pheromone
next && net.signal({ receiver: next }) // execute
net.drain()                            // process queue
net.fade(0.05)                         // decay
// evolve every 10min, know every hour
```

---

## Signal Flow

```
signal(sig, from='entry')
  → unit(sig, from)
    → task(data, emit, {from, self})
      → emit(sig)  // fan out
        → signal(sig, from=self)
          → mark(edge)  // path remembers
      → .then(task)  // continuation fires
        → signal(next)  // chain continues
```

Concurrency safe. No global state.

---

## Multi-Machine Collaboration

```
Machine A                           Machine B
┌──────────┐                        ┌──────────┐
│  router   │──signal──→ TypeDB ←──signal──│  router   │
│          │←─paths───→       ←──paths──│          │
└──────────┘                        └──────────┘
```

Each machine runs one router process. TypeDB is shared.
Pheromone builds across machines. The substrate learns end-to-end paths.

---

*Signal. Mark. Warn. Follow. Fade. Highway. Queue. Evolve. Know.*
