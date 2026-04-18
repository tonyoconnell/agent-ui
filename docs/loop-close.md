# Loop Close Protocol

> One signal. One log. One hard gate.
> Every `/do` wave and cycle closes before the next begins.

---

## The Three Steps

**Step 1 — Verify.** Audit the TODO vs disk. Walk each deliverable against its exit condition. Mark `[x]` on every passing item. Deterministic check — no vibes.

**Step 2 — Signal.** Emit `do:close` to the substrate:

```typescript
POST /api/signal {
  receiver: "do:close",
  data: {
    tags: ["cycle:N", "wave:N|gate", "todo:<slug>"],
    content: {
      timings_ms: { w1, w2, w3, w4, close },
      rubric: { fit, form, truth, taste },
      counts: { pass, fail, dissolved, timeout },
      deliverables: [{ name, exit, pass: boolean }],
      learning?: string,
      speedup?: { slowest, proposal, shave_ms }
    }
  }
}
```

Scope: `private`. L6 `know()` promotes repeat patterns to permanent learning.

**Step 3 — Propagate.** Update docs per the propagate matrix. Append one entry to `docs/learnings.md`.

---

## Gate Policy

| Close | Gate | If skipped |
|-------|------|-----------|
| Wave  | soft | warn — thin pheromone — next wave proceeds |
| Cycle | **hard** | emit `do:close-missing` dissolved; `/do --auto` halts |

Cycle close requires one concrete feature invocation (CLI runs / API returns 200 / page loads). Wave close does not.

---

## Signal Shape

| Field | Value |
|-------|-------|
| `receiver` | `do:close` |
| `tags` (required) | `cycle:<N>`, `wave:<N>\|gate`, `todo:<slug>` |
| `tags` (optional) | `learn` (new insight), `speedup` (timing improvement found) |
| `scope` | `private` (L6-promotable on repetition) |

`select('do:close', tags=['speedup'])` returns speedup history.
`select('do:close', tags=['learn'])` returns learning history.

---

## Propagate Matrix

| Target | Update when |
|--------|-------------|
| Source-of-truth doc | always — even if only touch-verified |
| `CLAUDE.md` root | 6 dimensions, L1-L8, or locked rules changed |
| Nested `CLAUDE.md` | directory contract changed |
| `README.md` | public surface changed (CLI verbs, API routes, SDK exports) |
| Feature doc | always if one exists |

---

## Learnings Log

Append one line to `docs/learnings.md` per wave or cycle close:

```
- YYYY-MM-DD · cycle N · wave N|gate · {one sentence} · rubric=0.NN · source=w1|w2|w3|w4|cycle
```

Keyed under `## <TODO-slug>`. Append-only. Never edit existing entries.

---

## Quick Reference

```bash
/close --todo <slug> --wave N       # wave close (soft gate)
/close --todo <slug> --cycle N      # cycle close (hard gate)
/see events --receiver do:close --since 1h   # inspect close history
```

---

*See also: [DSL.md](DSL.md) · [dictionary.md](dictionary.md) · [rubrics.md](rubrics.md) · [learnings.md](learnings.md)*
