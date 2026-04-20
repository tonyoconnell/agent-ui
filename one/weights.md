# Weights

Two numbers on every path. Everything else derives.

---

## The Two Dictionaries

```typescript
const strength: Record<string, number> = {}   // what worked
const resistance: Record<string, number> = {}  // what failed
```

Keys are edges: `"scout→analyst:process"`. Values are numbers. That's the
entire state of the substrate's memory. Every routing decision, every
security check, every highway, every toxic path — arithmetic on these
two maps.

---

## The Formula

```
weight = 1 + max(0, strength - resistance) × sensitivity
```

One formula. Five consequences:

1. **The `1`** — every known path is reachable. No path is invisible, just expensive.
2. **`strength - resistance`** — net performance. Failures cancel successes.
3. **`max(0, ...)`** — floor at zero. A terrible path can't go negative-weight.
4. **`× sensitivity`** — per-unit tuning. Controls explore vs exploit.
5. **The whole thing** — a single number that governs all probabilistic routing.

---

## How Weight Accumulates

### mark() — Success

```typescript
w.mark('scout→analyst:process')    // strength += 1
w.mark('scout→analyst:process', 3) // strength += 3 (chain depth)
```

Every successful signal delivery marks the path. Strength goes up.
The path becomes a highway candidate.

### warn() — Failure

```typescript
w.warn('scout→bad:process')        // resistance += 1
w.warn('scout→bad:process', 0.5)   // resistance += 0.5 (mild — dissolved)
```

Every failure warns the path. Resistance goes up.
The path becomes a toxic candidate.

### Four Outcomes, Four Responses

```
{ result: X }        Success.     mark(edge, chainDepth)    Path strengthens with depth.
{ timeout: true }    Slow.        nothing                   Neutral — not the agent's fault.
{ dissolved: true }  Missing.     warn(edge, 0.5)           Mild — path doesn't exist.
(no result)          Failure.     warn(edge, 1)             Full warn — agent produced nothing.
```

Fairness in four lines. Timeouts don't punish. Dissolution is half-blame.
Only real failure gets full resistance.

---

## Chain Depth — Sequential Success

Isolated successes are common. Sequential successes are rare and meaningful.

```
signal → unit A → result → mark(edge, depth=1)
                    ↓
signal → unit B → result → mark(edge, depth=2)
                    ↓
signal → unit C → result → mark(edge, depth=3)
```

A chain of 5 consecutive successes marks the final edge at 5× strength.
Five isolated successes mark at 1× each. Same total signals, different
information. The chain says: this path works reliably, in sequence,
under real load.

A failure anywhere resets the chain to zero. Chain length IS the quality
signal. No scorer. No reward model.

---

## fade() — Asymmetric Decay

```typescript
const fade = (r = 0.1) => {
  for (const e in strength)   { strength[e] *= (1 - r);     if (strength[e] < 0.01) delete strength[e] }
  for (const e in resistance) { resistance[e] *= (1 - r*2); if (resistance[e] < 0.01) delete resistance[e] }
}
```

Resistance decays **twice as fast** as strength. One line, three consequences:

1. **Forgiveness.** A failed path reopens. The system doesn't hold grudges.
2. **Second chances.** An agent that was bad last week gets retried this week.
3. **Self-healing.** A temporary outage doesn't permanently scar the routing table.

Without fresh signals reinforcing them, all paths dissolve. The world's
memory is always fresh. Active paths persist. Unused paths evaporate.

---

## isToxic() — Three Comparisons

```typescript
const isToxic = (edge: string) => {
  const a = resistance[edge] || 0
  const s = strength[edge] || 0
  return a >= 10 && a > s * 2 && (a + s) > 5
}
```

Three conditions. Three protections:

| Condition | Protection |
|-----------|-----------|
| `a >= 10` | Enough data. Don't block on noise. |
| `a > s * 2` | Clearly bad, not marginal. 40% failure doesn't block. |
| `(a + s) > 5` | Minimum sample size. New paths get a fair trial. |

No ML model decides what's toxic. Arithmetic does. Same input, same
answer, always. This is the pre-check in the deterministic sandwich —
toxic paths never reach the LLM.

---

## Two Routing Modes

### follow() — Deterministic

```typescript
w.follow('analyst')   // strongest path to any analyst
```

Always picks the highway. This is memory — "what does the system know?"
Proven paths become the answer. No randomness. No exploration.

### select() — Stochastic

```typescript
w.select('analyst')        // weighted random (default sensitivity 0.3)
w.select('analyst', 0.1)   // mostly highways, rarely explore
w.select('analyst', 0.9)   // strongly prefer highways
```

Weighted random with sensitivity. This is behavior — "what should the
system do?" Training happens through `select()`. Exploration creates data.

```
follow() is recall.     What do I know?
select() is decision.   What should I do?
```

Both read the same two dictionaries. Both use the same formula.

---

## Sensitivity — Specialization From One Number

Per-unit. Controls how strongly weight influences routing decisions.

```
sensitivity = 0.0  →  All paths equal. Pure exploration. (Scout)
sensitivity = 0.5  →  Highways preferred. Balanced. (Worker)
sensitivity = 1.0  →  Highways dominate. Pure exploitation. (Harvester)
```

Same weight map, different behavior:

```
Weight map:
  entry ══(60)══► scout ══(55)══► analyst ══(40)══► reporter
                    │
                    └──(8)──► explorer ──(3)──► unknown


SCOUT (sensitivity = 0.2):              HARVESTER (sensitivity = 0.9):
weight(→analyst)  = 1 + 55×0.2 = 12    weight(→analyst)  = 1 + 55×0.9 = 50.5
weight(→explorer) = 1 + 8×0.2  = 2.6   weight(→explorer) = 1 + 8×0.9  = 8.2
weight(→unknown)  = 1 + 3×0.2  = 1.6   weight(→unknown)  = 1 + 3×0.9  = 3.7

analyst 74%, explorer 16%, unknown 10%  analyst 81%, explorer 13%, unknown 6%
```

Nobody programs the roles. The weight landscape and sensitivity create
them. A new agent enters with low sensitivity — gets explored broadly.
As weight accumulates on successful paths, routing concentrates.
The agent specializes automatically.

---

## Revenue — Money as Weight

```
signal(A → B, amount: 0.01) → path(A,B).revenue += 0.01
```

Every payment strengthens the path. Revenue is pheromone. Paying paths
become highways. The world routes toward value — not because it was
told to, but because money leaves a trail.

A highway that generates revenue is doubly reinforced — by weight
(it works) and by money (it's valuable). A path that works but nobody
pays for fades naturally. A path that's paid for but fails goes toxic.
The market and the substrate agree or disagree — both are measured.

---

## What Two Dictionaries Replace

| Infrastructure | How | Lines |
|---------------|-----|-------|
| **Circuit breaker** | `isToxic()` — 3 comparisons | 1 |
| **Load balancer** | `select()` — weighted random | 8 |
| **A/B testing** | Two units, same skill. `select()` routes. Winner emerges. | 0 |
| **Canary deployment** | New unit explored via sensitivity parameter | 0 |
| **Retry with backoff** | Resistance decays. Blocked paths reopen. | 0 |
| **Service mesh** | `follow()` — deterministic strongest path | 4 |
| **Health checks** | Every signal is a health check. `warn()` on failure. | 0 |

Seven infrastructure categories. Two dictionaries. Arithmetic.

---

## Status Thresholds

### Paths (unit-to-unit)

| Status | Condition |
|--------|-----------|
| highway | strength >= 50 |
| fresh | strength 10–50, traversals < 10 |
| active | default |
| fading | strength 0–5 |
| toxic | resistance > strength AND resistance >= 10 |

### Units (actors)

| Status | Condition |
|--------|-----------|
| proven | success-rate >= 0.75, activity >= 70, samples >= 50 |
| active | default |
| at-risk | success-rate < 0.40, activity >= 25, samples >= 30 |

---

## The Security Sandwich

Weights are the learned half of security. Rules are the written half.
Both wrap the LLM.

```
SIGNAL IN
    │
    ▼
DETERMINISTIC PRE-CHECK
    │ isToxic(edge)?           → dissolve (no LLM call, no cost)
    │ capability exists?       → TypeDB lookup → dissolve
    │ within budget?           → arithmetic → dissolve
    │ input policy?            → rules/blocklist → dissolve
    │
    ▼
PROBABILISTIC: LLM generates response
    │
    ▼
DETERMINISTIC POST-CHECK
    │ output policy?           → rules/PII scan → dissolve → warn()
    │ did downstream succeed?  → mark() or warn()
    │
    ▼
SIGNAL OUT (or dissolve)
```

Rules handle what you can anticipate. Weights handle what you can't.
Both run in the same sandwich.

---

## How Hallucinations Die

Not by detection. By measurement.

```
Tick 1:   LLM hallucinates → downstream fails → warn()
Tick 5:   Same path fails again → resistance accumulates
Tick 10:  isToxic() triggers → path blocked
Tick 11:  Pre-check dissolves signal → LLM never called
          Not filtered. Not detected. Not called. The path is closed.

Tick 50:  Resistance decays (2× faster) → path reopens
Tick 51:  LLM tries again → succeeds → mark() → trust rebuilds
          LLM fails again → toxic LONGER (residual resistance compounds)
```

---

## The Lifecycle of a Path

```
COLD        strength=0, resistance=0     New. Unknown. Gets explored via select().
  ↓ mark()
WARMING     strength=5, resistance=1     Some success. Still explored.
  ↓ mark() × many
ACTIVE      strength=25, resistance=3    Working. Getting regular traffic.
  ↓ mark() × many
HIGHWAY     strength=50+                 Proven. follow() picks it. Crystallizable.
  ↓ no traffic
FADING      strength=5                   Unused. Decaying. Still reachable.
  ↓ fade()
DISSOLVED   strength<0.01               Gone. Deleted from dictionary.

ACTIVE      strength=20, resistance=5    Working but some failures.
  ↓ warn() × many
TOXIC       resistance=12, strength=4    Blocked. isToxic() = true. No LLM called.
  ↓ fade() (resistance decays 2×)
REOPENED    resistance=3, strength=2     Forgiven. Gets retried.
  ↓ mark()
RECOVERING  strength=10, resistance=2    Earning trust back.
```

---

## The Metaphors

Every metaphor has its own word for the same thing — the substance
that builds up on paths:

|           | The substance   | Depositing it        | It builds into | It fades by |
| --------- | --------------- | -------------------- | -------------- | ----------- |
| **ONE**   | weight          | mark / warn          | highway        | fade        |
| **Ant**   | pheromone       | deposit / alarm      | trail          | evaporation |
| **Brain** | synaptic weight | potentiate / inhibit | pathway        | decay       |
| **Team**  | reputation      | commend / flag       | go-to person   | forgetting  |
| **Mail**  | stamps          | stamp / return       | express route  | archiving   |
| **Water** | sediment        | carve / dam          | river          | drying      |
| **Radio** | signal power    | boost / jam          | clear channel  | attenuation |

The pattern is universal:

```
something accumulates on a connection over time
  → positive: the connection gets used more
  → negative: the connection gets avoided
  → without use: it fades
  → survivors become the proven paths
```

---

## Source

| File | What |
|------|------|
| `src/engine/world.ts` | Two dictionaries, mark/warn/fade/select/follow |
| `src/engine/persist.ts` | Persistent world + TypeDB sync |
| `src/engine/loop.ts` | Tick loop — outcome measurement, chain depth |
| `src/schema/world.tql` | TypeDB functions — is_safe, path_status, needs_evolution |

---

*Two numbers. One formula. The path remembers. The world learns.*

---

## See Also

- [DSL.md](one/DSL.md) — The programming model built on weights
- [llms.md](llms.md) — The deterministic sandwich wrapping the LLM
- [llm-training.md](llm-training.md) — Two dictionaries replace seven infrastructure categories
- [routing.md](routing.md) — How signals find their way
- [dictionary.md](dictionary.md) — Complete naming guide
