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
- 2026-04-18 · human-agent-link cycle 1 · gate · Path D-minimal: resolveUnitFromSession unifies Bearer + Cookie on existing validateApiKey + auth.api.getSession pipelines. No schema change, no BetterAuth hooks. W1 recon (R4) surfaced adapter FIELD_TO_ATTR flat mapping as the blocker that killed the original additionalFields plan. · rubric=0.91 · source=cycle
- 2026-04-18 · human-agent-link cycle 2 · gate · PROVE shipped: /api/me/agents + /app dashboard + /api/agents/:id/authorize + hasPathRelationship gate on mark/warn + 9-test suite (26 total, 0 fail). W4 flagged TQL injection in raw-interpolated from/to — W3.5 micro-edit sanitized at entry. Key insight: delegation = pheromone on path; no new relation needed (path.scope already exists). · rubric=0.894 · source=cycle
- 2026-04-18 · human-agent-link cycle 3 · gate · GROW shipped: /api/signal scope gate (auth-only, private/group/public), /api/me/groups/:gid/invite (chairman+ced idempotent), chairman-chain uid-prefix heuristic as defense-in-depth. +3 scope tests (27 chairman-chain total). Full suite 1581/1603 pass, 0 regressions. W4 flagged: authed callers omitting scope default to 'group' = breaking change for any prior cross-group senders (by design, per governance spec). · rubric=0.877 · source=cycle
