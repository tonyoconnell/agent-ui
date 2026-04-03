# The Stack

**~600 lines. Two fires. One ontology.**

---

## Code

| Module | Lines | What | Where |
|--------|-------|------|-------|
| `one.move` | 250 | On-chain substrate | Sui |
| `one.ts` | 70 | world() — 6 dimensions | Runtime |
| `substrate.ts` | 70 | Unit + Colony + scent graph | Runtime |
| `agentverse.ts` | 70 | 2M agents as colony | Fetch.ai |
| `asi.ts` | 70 | Orchestrator | Fetch.ai |
| `persist.ts` | 40 | TypeDB sync | Knowledge |
| `llm.ts` | 30 | Any model as a unit | Runtime |

## Schema

| File | Lines | What |
|------|-------|------|
| `sui.tql` | 250 | Move contracts as TypeQL |
| `one.tql` | 150 | 6-dimension ontology |
| `unified.tql` | 130 | Production schema |

## Two Fires

```
Move ACTS.          TypeDB REASONS.
Same ontology.      Same structures.
Two views.          One truth.
```

## Sui Objects

| Object | Type | Speed |
|--------|------|-------|
| Unit | Owned | Fast path (no consensus) |
| Colony | Shared | Consensus required |
| Envelope | Transferred | Consumed on arrival |
| Flow | Shared | Both endpoints modify |
| Highway | Frozen | Immutable forever |

## One Interface

```typescript
const w = world()
w.actor(id, type)                    // create
w.send({ receiver, payload })        // signal
w.flow(from, to).strengthen(n)       // success
w.flow(from, to).resist(n)           // failure
w.fade(rate)                         // decay
w.best(type)                         // discover
w.crystallize()                      // persist
```

---

*~600 lines. The whole stack.*
