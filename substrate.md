# Substrate

The system definition. One file. Parsed by the loop.

---

## Context

Docs loaded into every LLM call. Order matters — first = most important.

```
docs/DSL.md
docs/dictionary.md
docs/loop.md
```

---

## Timers

Signals emitted on schedule. Interval in ms or human format (5m, 1h, 1d).

| Signal | Interval | Priority |
|--------|----------|----------|
| world:fade | 5m | P2 |
| world:evolve | 10m | P1 |
| world:know | 1h | P2 |
| world:frontier | 1h | P3 |
| world:docs | 1h | P3 |

---

## SOPs

Prerequisites that must succeed before a signal processes.
If any prereq fails, the signal is blocked and warned.

### Before `worker:deploy`
- worker:test
- worker:lint
- review:approve

### Before `world:evolve-unit`
- world:backup-prompt

### Before `worker:merge`
- worker:test
- review:approve

---

## Workflows

Named sequences. Trigger with `workflow:name`.
Each step waits for previous to complete.

### ship-feature
1. worker:branch
2. worker:implement
3. worker:test
4. review:request
5. worker:merge
6. worker:deploy

### investigate-bug
1. analyst:reproduce
2. analyst:diagnose
3. worker:fix
4. worker:test

### onboard-agent
1. world:create-unit
2. world:assign-skills
3. worker:test-agent
4. world:activate

### evolve-agent
1. world:backup-prompt
2. world:consult-advisors
3. world:rewrite-prompt
4. world:test-new-prompt
5. world:commit-or-rollback

---

## Handlers

Core handlers. Defined here, implemented in code.

| Handler | Context | Description |
|---------|---------|-------------|
| world:fade | — | Decay all paths by 5% |
| world:evolve | dsl, dictionary | Find struggling agents, queue evolution |
| world:evolve-unit | dsl, dictionary, best-practices | Rewrite agent prompt |
| world:know | — | Crystallize highways to knowledge |
| world:frontier | — | Detect unexplored territories |
| world:docs | — | Scan docs, emit gaps as signals |
| worker:implement | dsl, dictionary | Implement a spec from docs |
| worker:test | — | Run tests |
| worker:deploy | — | Deploy to production |

---

## Metrics

What to measure. Logged every N ticks.

| Metric | Target | Alert If |
|--------|--------|----------|
| ticks/sec | >100 | <10 |
| queue_depth | <100 | >500 |
| highway_count | growing | shrinking |
| success_rate | >0.7 | <0.5 |
| avg_latency_ms | <100 | >1000 |

---

## Evolution Rules

When agents evolve, they follow these rules:

1. **Threshold**: success_rate < 0.50 AND sample_count >= 20
2. **Cooldown**: 24 hours between evolutions
3. **Consultation**: Ask top 3 advisors with similar skills
4. **Rollback**: If new prompt worse after 20 samples, revert
5. **Context**: Always include DSL + dictionary in rewrite prompt

---

## Learning Rules

How the substrate learns:

1. **Mark on success**: path.strength += chain_depth (max 5)
2. **Warn on failure**: path.resistance += 1
3. **Neutral on timeout**: no change (not agent's fault)
4. **Fade every 5m**: strength *= 0.95, resistance *= 0.90
5. **Highway at 20**: paths with net_strength >= 20 skip LLM
6. **Toxic at 10**: paths with resistance >= 10 AND resistance > 2×strength are blocked

---

## Priority Rules

How signals are prioritized in the queue:

| Priority | Examples | Processing |
|----------|----------|------------|
| P0 | Errors, security, payments | Immediate |
| P1 | User requests, evolution | Fast |
| P2 | System maintenance, fade | Normal |
| P3 | Exploration, docs | Background |

---

*This file is the system. Edit it to change behavior. The loop reads it.*
