# Lesson 1: Perception

## Entity Classification via Inference Functions

> **Biological Parallel:** Chemical Signaling and Caste Identification
>
> Ants identify task types by reading cuticular hydrocarbons — chemical signatures on each ant's exoskeleton that encode what task they perform.

| | |
|---|---|
| **Difficulty** | Beginner |
| **Prerequisites** | None (start here) |
| **Next** | [Lesson 2: Homeostasis](02-homeostasis.md) |
| **Standalone TQL** | `standalone/classification.tql` |

---

## What You Will Learn

How to classify entities into tiers using TypeDB 3.0 functions.

Functions return filtered entity streams — the database does the work. You do not tag entities manually. Their classification **emerges** from their attributes.

---

## The Biology

From Chapter 2 of *Ants at Work* — "Task Allocation Without Instructions":

Ants identify task types by reading cuticular hydrocarbons — chemical signatures on each ant's exoskeleton. This is **multi-attribute classification**: the ant reads several chemical properties simultaneously and classifies the encountered nestmate.

In TypeDB: functions read multiple attributes (`success-rate`, `activity-score`, `sample-count`) and classify entities into tiers. Same pattern — read properties, identify what something IS.

**Reference:** [ants-at-work.com/book/2/](https://ants-at-work.com/book/2/)

---

## Use Cases

- **Customer segmentation:** VIP, standard, at-risk
- **Content quality tiers:** Premium, standard, low
- **Employee performance bands:** Top, average, underperforming
- **Product health scoring:** Healthy, warning, critical
- **Agent classification:** Elite, worker, at-risk

---

## The Pattern

Define numeric thresholds across multiple attributes. Combine them in a function to return classified entities.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   Raw Attributes          →    Function          →    Classified Entities   │
│   (success-rate: 0.82)         elite_items()          { elite items }       │
│   (activity-score: 75)                                                       │
│   (sample-count: 120)                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Schema

```typeql
define

# --- Core Entity ---
# Adapt entity/attribute names to your domain.
# This example uses "scored-item" but could be agent, user, product, etc.

entity scored-item,
    owns item-id @key,
    owns item-name,
    owns success-rate,        # 0.0 - 1.0
    owns activity-score,      # 0.0 - 100.0
    owns sample-count,        # number of observations
    owns item-tier,           # "elite", "standard", "at-risk" (can be inferred)
    owns promotion-ready;     # boolean (can be inferred)

attribute item-id, value string;
attribute item-name, value string;
attribute success-rate, value double;
attribute activity-score, value double;
attribute sample-count, value integer;
attribute item-tier, value string;
attribute promotion-ready, value boolean;
```

---

## Function 1: Elite / Top-Tier Detection

Returns entities that meet ALL elite criteria simultaneously. This is a multi-attribute threshold filter — the core classification pattern.

**Thresholds (customize per domain):**
- `success-rate >= 0.75` (75% success)
- `activity-score >= 70.0` (high engagement)
- `sample-count >= 50` (statistically significant)

```typeql
# INFERENCE FUNCTION: The "Scent" of an Elite
# The database automatically classifies high-performing entities.

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
```

---

## Function 2: At-Risk Detection

Flag entities performing poorly with enough data to be confident.

**Thresholds:**
- `success-rate < 0.40` (below 40%)
- `activity-score >= 25.0` (not inactive — actively failing)
- `sample-count >= 30` (enough data to be sure)

```typeql
fun at_risk_items() -> { scored-item }:
    match
        $e isa scored-item,
            has success-rate $sr,
            has activity-score $as,
            has sample-count $sc;
        $sr < 0.40;
        $as >= 25.0;
        $sc >= 30;
    return { $e };
```

---

## Function 3: Promotion Candidates

Items that are elite AND have very high activity — ready for promotion to a higher tier, permanent status, or special treatment.

This demonstrates **CHAINED classification**: elite + additional criteria.

```typeql
fun promotion_candidates() -> { scored-item }:
    match
        $e isa scored-item,
            has item-tier "elite",
            has activity-score $as,
            has sample-count $sc;
        $as >= 80.0;
        $sc >= 100;
    return { $e };
```

---

## Function 4: High-Traffic / Superhighway Detection

Entities with extremely high activity and usage — the "superhighways" of your system that carry the most traffic/value.

```typeql
fun high_traffic_items() -> { scored-item }:
    match
        $e isa scored-item,
            has activity-score $as,
            has sample-count $sc;
        $as >= 85.0;
        $sc >= 100;
    return { $e };
```

---

## Function 5: Transfer Candidates

Elite items suitable for reuse in other contexts/domains. Useful for knowledge transfer, template creation, or cross-project sharing.

```typeql
fun transfer_candidates() -> { scored-item }:
    match
        $e isa scored-item,
            has item-tier "elite",
            has success-rate $sr;
        $sr >= 0.70;
    return { $e };
```

---

## Utility: Count Functions

```typeql
# Count elite items
fun elite_count() -> integer:
    match
        $e isa scored-item,
            has success-rate $sr,
            has activity-score $as,
            has sample-count $sc;
        $sr >= 0.75;
        $as >= 70.0;
        $sc >= 50;
    return count($e);

# Count at-risk items
fun at_risk_count() -> integer:
    match
        $e isa scored-item,
            has success-rate $sr,
            has activity-score $as,
            has sample-count $sc;
        $sr < 0.40;
        $as >= 25.0;
        $sc >= 30;
    return count($e);

# Count high-traffic items
fun high_traffic_count() -> integer:
    match
        $e isa scored-item,
            has activity-score $as,
            has sample-count $sc;
        $as >= 85.0;
        $sc >= 100;
    return count($e);
```

---

## Test Queries

After loading the schema and inserting test data:

```typeql
# Get all elite items with their names
match let $e in elite_items(); $e has item-name $n; select $n;

# Get at-risk items with success rates
match let $e in at_risk_items();
    $e has item-name $n, has success-rate $sr;
select $n, $sr;

# Count elites
match let $count = elite_count(); select $count;

# Find promotion candidates
match let $e in promotion_candidates(); $e has item-id $id; select $id;

# Find high-traffic items
match let $e in high_traffic_items(); $e has item-name $n; select $n;
```

**Expected output:** Items meeting the respective threshold criteria.

---

## The Emergence

What makes this powerful is that the **tier** of an item is not a static value you must manually update.

By using inference functions, an item "emerges" as Elite the very millisecond its `success-rate` crosses 0.75 and its `activity-score` exceeds 70.0.

The schema does not just describe what the data *is*; it describes how the data *should behave*.

**You have built a system that self-organizes its own hierarchy.**

---

## The Biological Mapping

Your `scored-item` entity is like an undifferentiated larva. By applying `elite_items()`, you are effectively "feeding" it the logic to help it pupate into its specialized role (the **Elite Caste**).

The beauty of TypeDB here is that the "Caste" is not a permanent label — it is a **state of being**. If the chemical signature (the data) changes, the item's classification changes instantly. No `UPDATE` statements required; just pure, real-time inference.

| Concept | Ant Colony | TypeDB |
|---------|-----------|--------|
| **Chemical Signature** | Cuticular hydrocarbons | Entity attributes |
| **Reading the Signature** | Antennal contact | `match` clause |
| **Classification** | Forager, Soldier, Nurse | Elite, Standard, At-Risk |
| **Dynamic Re-classification** | Hormone changes | Attribute updates |

---

## Tuning Thresholds

The thresholds above (e.g., elite = success-rate >= 0.75) are examples. To calibrate for your domain:

1. **Sample your data** — query 100 entities and check the distribution
2. **Target distribution** — typically 10-20% in the top tier, 60-70% middle, 10-20% bottom
3. **Use percentiles** — if your p80 success-rate is 0.65, set elite threshold there
4. **Test with real queries** — verify counts make sense
5. **Iterate** — inference rules are in the schema, so updating is a schema transaction

**Anti-patterns:**
- Don't set thresholds without looking at your data distribution
- Don't create more than 4-5 tiers (humans can't reason about more)
- Don't use inference for high-frequency write paths (rules add read latency)

---

## Load This Lesson

```bash
# Load just this lesson's schema
typedb console --cloud your-cluster.typedb.com:80
> transaction my-db schema write
> source standalone/classification.tql
> commit
```

Or programmatically:

```python
from typedb.driver import TypeDB, Credentials, DriverOptions, TransactionType

with open("standalone/classification.tql") as f:
    schema = f.read()

with driver.transaction("my-db", TransactionType.SCHEMA) as tx:
    tx.query(schema).resolve()
    tx.commit()
```

---

## Next Step

Now that we have the "senses" (inference functions) defined, the next logical step is **Validation**.

In [Lesson 2: Homeostasis](02-homeostasis.md), we ensure that an item cannot be "Elite" if it fails certain quality constraints. We define the "laws of nature" that govern classification.

---

## Complete TQL

For the complete standalone TypeQL file, see [`standalone/classification.tql`](../standalone/classification.tql).
