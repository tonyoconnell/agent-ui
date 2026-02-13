# Envelope System

100 million years ago, ants solved distributed computing.

No central brain. No master plan. Just simple creatures following simple rules — and somehow, cathedrals of cooperation emerge.

This is that pattern, in 85 lines of code.

---

## The Biology

An **ant** carries food through the nest. It knows where it's going and what to do when it gets there. When the work is done, it follows the trail to the next chamber.

A **chamber** is a place in the nest where work happens. Each chamber knows certain tasks. When an ant arrives, the chamber does its work and sends the ant on its way.

The **nest** is just space — tunnels connecting chambers. It doesn't control anything. It just lets ants find their way.

**Pheromones** are how ants communicate without talking. When an ant completes a journey, it leaves scent on the trail. Other ants smell the scent and follow strong trails. This is how superhighways emerge — no one plans them.

```
Ant        →  envelope   (carries cargo, knows its journey)
Chamber    →  unit       (does work, knows its tasks)
Nest       →  colony     (space, not controller)
Pheromone  →  scent      (trails strengthen with use)
```

---

## Watch an Ant Work

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
  receiver: "processor",      // first chamber
  receive: "double",          // task to perform
  payload: { n: 5 },          // cargo it carries
  callback: {                 // trail to next chamber
    receiver: "validator",
    receive: "check",
    payload: { n: "{{result}}" }  // cargo becomes previous result
  }
});

// The ant travels: processor → validator
// processor.double(5) → 10 → validator.check(10) → true
```

---

## Watch Superhighways Emerge

```javascript
const nest = colony();

nest.spawn({ receiver: "a" }).assign("work", () => "done");
nest.spawn({ receiver: "b" }).assign("work", () => "done");

// Ants travel — trails strengthen automatically
await nest.send({ receiver: "a", receive: "work", payload: {} });
await nest.send({ receiver: "a", receive: "work", payload: {} });
await nest.send({ receiver: "a", receive: "work", payload: {} });
await nest.send({ receiver: "b", receive: "work", payload: {} });

// See the superhighways
nest.highways();
// → [{ trail: "a:work", strength: 3 }, { trail: "b:work", strength: 1 }]

// Smell a specific trail
nest.smell("a:work");  // → 3

// Time passes — unused trails fade
nest.fade(0.5);
nest.smell("a:work");  // → 1.5
```

No one planned the highway. It emerged from ants doing their work.

---

## What Evolution Discovered

Ants have no CEO. No project manager. No central nervous system running the colony.

They have three rules:

```
1. Pick up food
2. Follow the trail
3. Do the work
```

We have the same:

```
1. Receive the envelope
2. Execute the service
3. Forward the callback
```

And one more for stigmergy:

```
4. Leave scent on the trail
```

That's it. That's 100 million years of optimization.

---

## The Code

### Chamber (unit.js) — 30 lines

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
  receive.id = id;
  return receive;
};
```

### Nest with Pheromones (colony.js) — 55 lines

The nest doesn't think. It just connects chambers and holds scent.

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

**85 lines. A living system.**

---

## What Emerges

From these simple rules, complex behavior appears — the same way millions of ants build bridges, farms, and highways without a blueprint.

| Behavior | How It Happens |
|----------|----------------|
| **Pipelines** | Ant carries cargo through chambers via callbacks |
| **Parallel work** | Many ants traveling simultaneously |
| **Specialization** | Chambers know different tasks |
| **Delegation** | Chambers can send ants to other chambers |
| **Fault tolerance** | If a chamber fails, the ant carries the error |
| **Growth** | New chambers spawn anytime |
| **Self-organization** | No central control, ever |
| **Superhighways** | Trails strengthen with use |
| **Forgetting** | Unused trails fade over time |

---

## What Could Still Emerge

The 85 lines are the genome. Everything else is phenotype.

| Capability | How It Might Grow |
|------------|-------------------|
| **Load balancing** | Route to chamber with weakest scent (least busy) |
| **Learning** | Chambers modify their own tasks based on results |
| **Death** | Remove chambers with too many failures |
| **Queens** | Chambers that spawn other chambers |
| **Scouting** | Ants that explore before committing |

---

## Run

```bash
bun install
bun dev        # → localhost:4321
```

## Stack

| Layer | Tech |
|-------|------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Astro 5](https://astro.build) |
| UI | [React 19](https://react.dev) |
| Visualization | [ReactFlow](https://reactflow.dev) |

---

## Files

```
src/engine/
├── unit.js      # Chamber (30 lines)
├── colony.js    # Nest + Pheromones (55 lines)
└── index.ts     # Exports

public/
└── agents.json  # The ants and their journeys
```

---

*Ants figured this out 100 million years ago. We just wrote it down.*
