# Learnings

> Rolling log of non-obvious insights from `/do` wave and cycle closes.
> Append-only. Never edit existing entries. Keyed by `## <TODO-slug>`.

---

## Schema

```
- YYYY-MM-DD · cycle N · wave N|gate · {one sentence} · rubric=0.NN · source=w1|w2|w3|w4|cycle
```

Each TODO gets its own `## <slug>` section. On each close, append to the matching section.

---

## loop-close

- 2026-04-18 · cycle 1 · gate · Protocol seeded: one signal (do:close), one log (learnings.md), one hard gate — cycle close blocks next cycle until confirmed. · rubric=0.85 · source=cycle
- 2026-04-18 · cycle 2 · w1 · /api/events endpoint does not exist — do:close verification uses /api/signals; gate is protocol-level not code-enforced. · rubric=0.80 · source=w1
- 2026-04-18 · cycle 2 · gate · C2 prove: signal fires end-to-end, learnings grew, hard gate is a model-instruction convention; machine enforcement needs /api/events?receiver=do:close. · rubric=0.80 · source=cycle
