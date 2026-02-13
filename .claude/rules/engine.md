# Engine Development Rules

Apply when working with `src/engine/*.ts` or `src/engine/*.js` files.

## The Biology

100 million years ago, ants solved distributed computing.

```
Ant        →  envelope   (carries cargo, knows its journey)
Chamber    →  unit       (does work, knows its tasks)
Nest       →  colony     (space, not controller)
Pheromone  →  scent      (trails strengthen with use)
```

**85 lines. A living system.**

## The Four Rules

Ants have no CEO. They have four rules:

```
1. Pick up food       →  Receive the envelope
2. Follow the trail   →  Execute the service
3. Do the work        →  Forward the callback
4. Leave scent        →  Mark successful trails
```

## Chamber (unit.js) — 30 lines

A chamber IS its entrance. When an ant arrives, work happens.

```javascript
const unit = (envelope, route) => {
  const { receiver: id } = envelope;
  const tasks = {};

  const receive = ({ receive: task, payload, callback }) => {
    if (!tasks[task]) return Promise.reject({ id, task, error: `Unknown: ${task}` });

    return tasks[task](payload).then((result) => {
      if (callback) {
        const next = substitute(callback, result);
        // Different chamber? Travel through the nest
        if (next.receiver !== id && route) return route(next);
        // Same chamber? Stay here
        return receive(next);
      }
      return result;
    });
  };

  receive.assign = (name, fn) => (tasks[name] = (p) => Promise.resolve(fn(p)), receive);
  receive.role = (name, task, ctx) => (tasks[name] = (p) => tasks[task]({ ...ctx, ...p }), receive);
  receive.has = (name) => name in tasks;
  receive.list = () => Object.keys(tasks);
  receive.id = id;
  return receive;
};
```

**A chamber IS its entrance.** The unit IS the receive function, not a container with one.

## Nest with Pheromones (colony.js) — 55 lines

The nest doesn't think. It connects chambers and holds scent.

```javascript
const colony = () => {
  const chambers = {};
  const scent = {};  // Pheromone trails

  // An ant travels — and leaves scent on success
  const send = ({ receiver, receive, payload, callback }) => {
    const chamber = chambers[receiver];
    if (!chamber) return Promise.reject({ error: `No chamber: ${receiver}` });
    return chamber({ receive, payload, callback }).then((result) => {
      mark(`${receiver}:${receive}`, 1);  // Strengthen the trail
      return result;
    });
  };

  // A new chamber grows
  const spawn = (envelope) => {
    const chamber = unit(envelope, send);
    chambers[chamber.id] = chamber;
    return chamber;
  };

  // Stigmergy: indirect communication through environment
  const mark = (trail, strength = 1) => {
    scent[trail] = (scent[trail] || 0) + strength;
  };

  const smell = (trail) => scent[trail] || 0;

  const fade = (rate = 0.1) => {
    for (const trail in scent) {
      scent[trail] *= (1 - rate);
      if (scent[trail] < 0.01) delete scent[trail];
    }
  };

  const highways = () => Object.entries(scent)
    .sort(([, a], [, b]) => b - a)
    .map(([trail, strength]) => ({ trail, strength }));

  return { spawn, send, mark, smell, fade, highways, chambers, scent };
};
```

## Stigmergy (Pheromones)

Ants don't talk to each other. They modify the environment, and other ants react.

```javascript
// Automatic: trails strengthen when ants complete journeys
await nest.send({ receiver: "a", receive: "work", payload: {} });
await nest.send({ receiver: "a", receive: "work", payload: {} });
await nest.send({ receiver: "a", receive: "work", payload: {} });

// See the superhighways emerge
nest.highways();
// → [{ trail: "a:work", strength: 3 }]

// Smell a specific trail
nest.smell("a:work");  // → 3

// Manual: strengthen a trail artificially
nest.mark("a:work", 10);

// Time passes — unused trails fade
nest.fade(0.5);

// Eventually, unused trails disappear entirely
```

## Ant (envelope)

An ant carries cargo and knows its journey:

```typescript
interface Envelope {
  receiver?: string;     // Which chamber to enter
  receive?: string;      // Which task to perform
  payload?: unknown;     // Cargo being carried
  callback?: Envelope;   // Trail to next chamber
}
```

## Watching an Ant Work

```javascript
// Build a nest
const nest = colony();

// Grow chambers that know tasks
nest.spawn({ receiver: "processor" })
  .assign("double", ({ n }) => n * 2);

nest.spawn({ receiver: "validator" })
  .assign("check", ({ n }) => n > 0);

// Release an ant — it knows its entire journey
nest.send({
  receiver: "processor",
  receive: "double",
  payload: { n: 5 },
  callback: {
    receiver: "validator",
    receive: "check",
    payload: { n: "{{result}}" }
  }
});
// processor.double(5) → 10 → validator.check(10) → true
// Trails "processor:double" and "validator:check" now have scent
```

## Tasks (Services)

Tasks are what a chamber knows how to do:

```javascript
// Teach a chamber a task
chamber.assign("double", ({ n }) => n * 2);

// Chamber does the task when an ant arrives
chamber({ receive: "double", payload: { n: 5 } }); // → Promise<10>
```

## Roles

Roles are the same task with different context — like worker ants vs soldier ants:

```javascript
chamber.assign("fetch", ({ url, token }) => fetch(url, { headers: { auth: token } }));
chamber.role("fetchAsAdmin", "fetch", { token: "admin-key" });
chamber.role("fetchAsUser", "fetch", { token: "user-key" });
```

## Trails (Callbacks)

The ant's trail — where it goes after this chamber:

```javascript
{
  receive: "step1",
  payload: { n: 1 },
  callback: {                           // The trail
    receive: "step2",
    payload: { n: "{{result}}" }        // Cargo becomes previous result
  }
}
```

## Cargo Transfer

When an ant moves between chambers, its cargo transforms:

```javascript
const substitute = (envelope, result) => {
  const payload = {};
  for (const [k, v] of Object.entries(envelope.payload || {})) {
    payload[k] = v === "{{result}}" ? result : v;
  }
  return { ...envelope, payload };
};
```

## Error Handling

When something goes wrong, the ant carries the context:

```javascript
{
  id: "processor",       // Which chamber
  task: "double",        // Which task
  payload: { n: 5 },     // What cargo
  error: "..."           // What went wrong
}
```

## What Emerges

From simple rules, complex behavior appears:

| Behavior | How |
|----------|-----|
| Pipelines | Ant travels through chambers via callbacks |
| Parallel work | Many ants traveling simultaneously |
| Specialization | Chambers know different tasks |
| Delegation | Chambers send ants to other chambers |
| Fault tolerance | Ants carry error context |
| Growth | New chambers spawn anytime |
| Self-organization | No central control |
| Superhighways | Trails strengthen with use |
| Forgetting | Unused trails fade over time |

## What Could Still Emerge

The 85 lines are the genome. Everything else is phenotype:

| Capability | How It Might Grow |
|------------|-------------------|
| Load balancing | Route to chamber with weakest scent |
| Learning | Chambers modify tasks based on results |
| Death | Remove chambers with many failures |
| Queens | Chambers that spawn chambers |
| Scouting | Ants that explore before committing |

## Type Safety

```typescript
import { unit, colony } from "@/engine";
import type { Unit, Colony, Envelope, Highway } from "@/engine";
```

## Chainable API

Chambers grow through chaining:

```javascript
const chamber = unit({ receiver: "worker" })
  .assign("add", ({ a, b }) => a + b)
  .assign("mul", ({ a, b }) => a * b)
  .role("double", "mul", { b: 2 });
```

---

*Ants figured this out 100 million years ago. We just wrote it down.*
