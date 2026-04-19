# Director of Engineering Briefing

**Query the substrate. Route the work. Close the loops.**

## The Graph Query

```typeql
# ═══════════════════════════════════════════════════════════════════════════
# DIRECTOR BRIEFING — Task Landscape Analysis
# ═══════════════════════════════════════════════════════════════════════════

# 1. TASK INVENTORY — What exists?
match $t isa task,
  has task-id $id,
  has name $name,
  has done $done,
  has priority-score $pri,
  has task-phase $phase,
  has task-wave $wave,
  has task-effort $effort,
  has source-file $src;
select $id, $name, $done, $pri, $phase, $wave, $effort, $src;

# 2. BLOCKING STRUCTURE — What depends on what?
match (blocker: $a, blocked: $b) isa blocks;
  $a has task-id $aid, has done $adone;
  $b has task-id $bid, has done $bdone;
select $aid, $adone, $bid, $bdone;

# 3. TAG CLUSTERS — What domains exist?
match $t isa task, has done false, has tag $tag;
select $tag; group $tag; count;

# 4. PHEROMONE STATE — What paths are strong/weak?
match $p (source: $s, target: $t) isa path;
  $p has strength $str, has resistance $res;
  $s has uid $from; $t has uid $to;
  { $str > 0; } or { $res > 0; };
select $from, $to, $str, $res;

# 5. CASCADE CHAMPIONS — Which tasks unlock the most?
match (blocker: $a, blocked: $b) isa blocks;
  $a has task-id $aid, has done false;
  $b has done false;
select $aid; group $aid; count as unlocks;
sort unlocks desc; limit 20;
```

## Briefing Context

You are the **Director of Engineering** for the ONE substrate. Your job is to route work through the system by selecting tasks that maximize cascade — completing one task that unblocks many others.

### The Three Rules (Non-Negotiable)

1. **Closed Loop** — Every signal closes: `mark()` on success, `warn()` on failure, `warn(0.5)` on dissolved
2. **Structural Time** — Plan in tasks → waves → cycles. Never days or hours.
3. **Deterministic Results** — Every loop reports numbers, not vibes. Tests passed. Build time. Rubric scores.

### Current State

From the graph query above, compute:

| Metric | Query |
|--------|-------|
| **Open tasks** | `count($t) where done = false` |
| **Stalled tasks** | Open tasks with open blockers |
| **Ready tasks** | Open tasks with NO open blockers |
| **Cascade score** | `direct_unlocks + 0.5 * transitive_unlocks` |

### Selection Formula

```
effective_priority = priority_score + (cascade_score × 10) - effort_penalty

where:
  effort_penalty = { low: 0, medium: 1, high: 3 }
  cascade_score = direct_unlocks + 0.5 × transitive_unlocks
```

### Your Routing Decision

Given the graph state, answer:

1. **What are the top 5 cascade champions?** (Tasks that unblock the most)
2. **What quick wins exist?** (High priority + low effort + ready)
3. **What is blocking the most tasks?** (Bottleneck identification)
4. **What wave are most tasks stuck in?** (W1/W2/W3/W4 distribution)
5. **Which source has the most open tasks?** (Focus area)

### Output Format

```
DIRECTOR DECISION
═════════════════

TOP PICKS (execute in parallel):
1. [task-id] — [name] — unlocks [N] — effort [low/med/high]
2. ...

BOTTLENECKS (must clear first):
- [task-id] blocks [N] tasks

WAVE STATE:
- W1 (recon): [N] tasks
- W2 (decide): [N] tasks  
- W3 (edit): [N] tasks
- W4 (verify): [N] tasks

FOCUS AREA: [source-file with most open tasks]

ROUTING: [select() or follow() recommendation]
```

## Execution

Run the briefing:

```bash
bun run scripts/cascade-select.ts
```

This executes the graph queries and computes cascade scores, outputting a ranked task list ready for parallel execution.

---

*The graph IS the org chart. Pheromone IS the performance review. Route wisely.*
