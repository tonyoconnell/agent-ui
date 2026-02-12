---
name: typedb
description: TypeDB 3.0 schema design, inference patterns, and TypeQL queries for self-organizing systems
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# TypeDB 3.0 Development

Build self-organizing systems with TypeDB's inference engine. Schema-driven classification, negation patterns, and pheromone-weighted selection.

## When to Use This Skill

- Design TypeDB schemas with entities, relations, and attributes
- Write inference functions and rules
- Implement the Colony Loop patterns (perception, homeostasis, hypothesis, task allocation, contribution, emergence)
- Query with TypeQL 3.0 syntax
- Integrate TypeDB with TypeScript/Astro via HTTP proxy

## Core Concepts

```
Raw Attributes → Inference Functions → Classified Entities
     ↓                   ↓                    ↓
(success-rate)      elite_items()        { elite items }
```

**The Colony Loop:**
1. **Perception (L1)** - Classification via functions
2. **Homeostasis (L2)** - Quality rules that reject invalid states
3. **Hypothesis (L3)** - State machines via inference
4. **Task Allocation (L4)** - Negation + pheromone selection
5. **Contribution (L5)** - Parameterized aggregates
6. **Emergence (L6)** - Autonomous goal spawning

## TypeQL 3.0 Syntax

### Schema Definition

```typeql
define

entity scored-item,
    owns item-id @key,
    owns item-name,
    owns success-rate,        # 0.0 - 1.0
    owns activity-score,      # 0.0 - 100.0
    owns sample-count,        # integer
    owns item-tier;           # inferred: "elite", "standard", "at-risk"

attribute item-id, value string;
attribute item-name, value string;
attribute success-rate, value double;
attribute activity-score, value double;
attribute sample-count, value integer;
attribute item-tier, value string;
```

### Inference Functions

Functions return filtered entity streams:

```typeql
# Multi-attribute classification
fun elite_items() -> { scored-item }:
    match
        $e isa scored-item,
            has success-rate $sr,
            has activity-score $as,
            has sample-count $sc;
        $sr >= 0.75;
        $as >= 70.0;
        $sc >= 50;
    return { $e };

# Parameterized aggregate
fun total_contribution($name: string) -> double:
    match
        $c isa contributor, has contributor-name $name;
        $rel (contributor-role: $c, contribution-item: $contrib) isa contribution;
        $contrib has impact-score $i;
    return sum($i);

# Count function
fun elite_count() -> integer:
    match
        $e isa scored-item,
            has success-rate $sr,
            has activity-score $as;
        $sr >= 0.75;
        $as >= 70.0;
    return count($e);
```

### Inference Rules

Rules fire automatically when conditions match:

```typeql
# Simple rule
rule high-quality:
    when { $r has effectiveness $e; $e >= 0.7; }
    then { $r has quality-label "high"; };

# Chained rule (uses inferred fact)
rule cascade-detected:
    when {
        $source has quality-label "high";  # inferred above
        ($source, $derived) isa learning-chain;
        $derived has quality-label "high";
    } then {
        $source has cascade-potential true;
    };
```

### Negation Pattern

Find entities that DON'T have a relationship:

```typeql
# Ready tasks = no incomplete blockers
fun ready_tasks() -> { task }:
    match
        $t isa task, has status "todo";
        not {
            $dep(dependent: $t, blocker: $blocker) isa dependency;
            $blocker isa task, has status $bs;
            not { $bs == "complete"; };
        };
    return { $t };
```

### Pheromone-Weighted Selection

```typeql
# Attractive task = ready + strong trail
rule attractive-task:
    when {
        $t isa task, has status "todo";
        not {
            $dep(dependent: $t, blocker: $b) isa dependency;
            $b isa task, has status $bs;
            not { $bs == "complete"; };
        };
        $trail (destination-task: $t) isa pheromone-trail,
            has trail-pheromone $tp;
        $tp >= 50.0;
    } then {
        $t has attractive true;
    };

# Reinforce trail after success
match
    $from isa task, has task-id "TASK-A";
    $to isa task, has task-id "TASK-B";
    $trail (source-task: $from, destination-task: $to) isa pheromone-trail,
        has trail-pheromone $old_tp,
        has completions $old_c;
    let $new_tp = $old_tp + 5.0;
    let $new_c = $old_c + 1;
delete $old_tp of $trail; delete $old_c of $trail;
insert $trail has trail-pheromone $new_tp, has completions $new_c;
```

## TypeScript Integration

### HTTP Client

```typescript
interface TypeDBConfig {
  url: string;
  database: string;
  username: string;
  password: string;
}

let cachedToken: { token: string; expires: number } | null = null;

async function getToken(config: TypeDBConfig): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60000) {
    return cachedToken.token;
  }

  const res = await fetch(`${config.url}/typedb/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
  });

  const data = await res.json();
  const payload = JSON.parse(atob(data.token.split(".")[1]));
  cachedToken = { token: data.token, expires: payload.exp * 1000 };
  return cachedToken.token;
}

export async function typedbQuery(tql: string): Promise<any[]> {
  const config = getConfig();
  const token = await getToken(config);

  const res = await fetch(`${config.url}/typedb/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      databaseName: config.database,
      transactionType: "read",
      query: tql,
      commit: false,
    }),
  });

  const data = await res.json();
  return data.answers || [];
}
```

### Parse Answers

```typescript
export function parseAnswers(answers: any[]): Record<string, any>[] {
  return answers.map((answer) => {
    const result: Record<string, any> = {};
    if (!answer?.data) return result;

    for (const [varName, concept] of Object.entries(answer.data)) {
      const c = concept as any;
      if (c?.kind === "attribute" && c.value !== undefined) {
        result[varName] = c.value;
      }
    }
    return result;
  });
}
```

## TypeDB 3.0 vs 2.x

| Feature | 3.0 Syntax | NOT 2.x |
|---------|-----------|---------|
| Functions | `fun name() -> type:` | ~~rule-based~~ |
| Rules | `rule name: when { } then { };` | Updated syntax |
| Integers | `value integer` | ~~`value long`~~ |
| Delete | `delete $attr of $entity;` | ~~`delete $entity has attr $attr;`~~ |

## Query Examples

```typeql
# Get elite items with names
match let $e in elite_items(); $e has item-name $n; select $n;

# Count elites
match let $count = elite_count(); select $count;

# Get ready tasks
match let $t in ready_tasks(); $t has title $title; select $title;

# Total contribution for agent
match let $total = total_contribution("agent-001"); select $total;
```

## Environment Variables

```bash
TYPEDB_URL=https://your-cluster.typedb.com
TYPEDB_DATABASE=my-database
TYPEDB_USERNAME=admin
TYPEDB_PASSWORD=secret
```

## Reference

- Inference patterns: `../ants-at-work/packages/typedb-inference-patterns/`
- Starter template: `../ants-at-work/packages/typedb-starter/`
- Lessons: `lessons/01-perception.md` through `lessons/06-emergence.md`

---

**Version**: 1.0.0
**TypeDB**: 3.0+
