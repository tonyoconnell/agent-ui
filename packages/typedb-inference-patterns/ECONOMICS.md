# FET Economics Model

> Pheromones cost money because they DO things.

---

## 1. Why Pheromones Cost Money

In nature, ants spend ENERGY to deposit pheromones. This cost
is not incidental - it is the foundation of signal credibility.
A costly signal cannot be faked cheaply.

```
NATURE                          COLONY
---------------------------------|---------------------------------
Energy to produce pheromone      | FET to deposit signal
Energy limits spam               | Cost filters noise
Strong pheromone = more energy   | High stake = serious signal
Dying ants stop signaling        | Bankrupt agents go silent
Trail reinforcement costs        | Following costs too
```

**The Thermodynamic Principle:**

```
+----------------------------------------------------------+
|                                                          |
|   Signal Credibility = f(Cost to Produce)                |
|                                                          |
|   Free signals have zero information value.              |
|   Costly signals are worth following.                    |
|                                                          |
+----------------------------------------------------------+
```

When an agent deposits a pheromone, that signal triggers:
- LLM interpretation (compute cost)
- Code generation (GPU cost)
- Sandbox execution (container cost)
- Network propagation (bandwidth cost)
- Storage persistence (TypeDB writes)

These are real costs. FET is how agents pay for them.

---

## 2. The Cost Model

Every action in the colony has a FET cost.

### Base Costs

```
+---------------------+----------+-------------------------+
| Action              | FET Cost | What It Pays For        |
+---------------------+----------+-------------------------+
| Pheromone deposit   | 0.001    | TypeDB write + gossip   |
| Task creation       | 0.005    | Schema + initial stake  |
| Hypothesis submit   | 0.010    | Validation compute      |
| Frontier claim      | 0.002    | Lock acquisition        |
| Agent spawn         | 0.100    | Container + registry    |
+---------------------+----------+-------------------------+
```

### Signal Type Multipliers

```
+------------------+------------+----------------------------+
| Signal Type      | Multiplier | Rationale                  |
+------------------+------------+----------------------------+
| DISCOVERY        | 1.0x       | Base exploration signal    |
| TRAIL            | 0.5x       | Reinforcement is cheap     |
| WARNING          | 2.0x       | Alarms must be serious     |
| RECRUITMENT      | 1.5x       | Calling swarm attention    |
| SERVICE_REQUEST  | 1.0x       | Standard coordination      |
| SERVICE_RESULT   | 0.5x       | Response to request        |
+------------------+------------+----------------------------+
```

### Compute-Triggered Costs

When a pheromone triggers downstream computation:

```
+----------------------------------------------------------+
| PHEROMONE DEPOSIT (0.001 FET)                            |
|     |                                                    |
|     +-- LLM Interpretation                               |
|     |   Cost: 0.002 FET (per 1K tokens)                  |
|     |                                                    |
|     +-- Code Generation                                  |
|     |   Cost: 0.010 FET (if triggered)                   |
|     |                                                    |
|     +-- Sandbox Execution                                |
|     |   Cost: 0.020 FET (Cloudflare Container)           |
|     |                                                    |
|     +-- External API Call                                |
|         Cost: 0.010 FET (Hyperliquid, etc.)              |
|                                                          |
| TOTAL POSSIBLE: 0.001 + 0.002 + 0.010 + 0.020 + 0.010    |
|               = 0.043 FET per full action chain          |
+----------------------------------------------------------+
```

### Stake Requirements

Some actions require locked stake:

```
+---------------------+----------+----------------------------+
| Action              | Stake    | Lock Duration              |
+---------------------+----------+----------------------------+
| Task creation       | 0.05     | Until task completes       |
| Hypothesis submit   | 0.02     | Until verified (24h max)   |
| Frontier claim      | 0.01     | Until released or timeout  |
| Service registration| 0.10     | While service active       |
+---------------------+----------+----------------------------+
```

---

## 3. The Reward Model

Successful work generates FET returns.

### Task Completion Rewards

```
+----------------------------------------------------------+
|                                                          |
|  TASK OUTCOME                  REWARD                    |
|  ----------------------------------------                |
|  Completed successfully        Stake returned + 10%      |
|  Completed with bonus tier     Stake returned + 25%      |
|  Elite performance             Stake returned + 50%      |
|                                                          |
|  Example:                                                |
|  - Stake 0.05 FET on task                                |
|  - Complete with high quality                            |
|  - Receive: 0.05 + 0.0125 = 0.0625 FET                   |
|                                                          |
+----------------------------------------------------------+
```

### Hypothesis Confirmation Rewards

```
+----------------------------------------------------------+
|                                                          |
|  HYPOTHESIS RESULT             REWARD                    |
|  ----------------------------------------                |
|  Confirmed true (p > 0.95)     2x stake returned         |
|  Confirmed with high N         2.5x stake returned       |
|  Paradigm-shifting insight     5x stake returned         |
|                                                          |
|  Example:                                                |
|  - Submit hypothesis: "Pattern X works in regime Y"      |
|  - Stake: 0.02 FET                                       |
|  - Confirmed with N=500, p=0.98                          |
|  - Receive: 0.02 * 2.5 = 0.05 FET                        |
|                                                          |
+----------------------------------------------------------+
```

### Trail Reinforcement Share

When trails become superhighways, early depositors earn:

```
+----------------------------------------------------------+
|                                                          |
|         TRAIL REINFORCEMENT ECONOMICS                    |
|                                                          |
|   Agent A deposits trail T (cost: 0.001 FET)             |
|         |                                                |
|   Agents B, C, D, E follow and reinforce                 |
|         |                                                |
|   Trail T becomes superhighway (pheromone > 20)          |
|         |                                                |
|   Reward pool created from follower fees:                |
|   - Each reinforcement: 0.0005 FET to pool               |
|   - Pool distributed by deposit order                    |
|   - First depositor (A): 40% of pool                     |
|   - Early followers (B,C): 20% each                      |
|   - Late followers (D,E): 10% each                       |
|                                                          |
|   This incentivizes DISCOVERY over copying.              |
|                                                          |
+----------------------------------------------------------+
```

### Elite Bonus

Top performers receive multipliers:

```
+------------------+------------+----------------------------+
| Elite Tier       | Multiplier | Qualification              |
+------------------+------------+----------------------------+
| Bronze           | 1.1x       | Top 20% accuracy           |
| Silver           | 1.25x      | Top 10% accuracy           |
| Gold             | 1.5x       | Top 5% accuracy            |
| Diamond          | 2.0x       | Top 1% accuracy            |
+------------------+------------+----------------------------+
```

---

## 4. The Penalty Model

Bad work loses FET. This is how the swarm learns.

### Failed Task Penalties

```
+----------------------------------------------------------+
|                                                          |
|  TASK FAILURE                  PENALTY                   |
|  ----------------------------------------                |
|  Incomplete (timeout)          50% stake lost            |
|  Incorrect result              75% stake lost            |
|  Malicious/spam                100% stake lost + ban     |
|                                                          |
|  Example:                                                |
|  - Stake 0.05 FET on task                                |
|  - Fail to complete within deadline                      |
|  - Lose: 0.025 FET                                       |
|  - Return: 0.025 FET                                     |
|                                                          |
+----------------------------------------------------------+
```

### Rejected Hypothesis Penalties

```
+----------------------------------------------------------+
|                                                          |
|  HYPOTHESIS REJECTION          PENALTY                   |
|  ----------------------------------------                |
|  Not statistically significant 50% stake lost            |
|  Contradicted by data          75% stake lost            |
|  Duplicate/known pattern       25% stake lost            |
|                                                          |
|  This prevents hypothesis spam.                          |
|                                                          |
+----------------------------------------------------------+
```

### Alarm/Warning Reputation Cost

False alarms are expensive:

```
+----------------------------------------------------------+
|                                                          |
|         WARNING SIGNAL ECONOMICS                         |
|                                                          |
|   Warnings cost 2x base (0.002 FET)                      |
|   because they demand swarm attention.                   |
|                                                          |
|   TRUE WARNING:                                          |
|   - Cost recovered + 50% bonus                           |
|   - Reputation score +10                                 |
|   - Future warnings get priority routing                 |
|                                                          |
|   FALSE WARNING:                                         |
|   - Cost lost entirely                                   |
|   - Reputation score -25                                 |
|   - Repeated false alarms = warning privileges revoked   |
|                                                          |
|   "Crying wolf" is evolutionarily expensive.             |
|                                                          |
+----------------------------------------------------------+
```

### Reputation Decay

Inactive agents lose standing:

```
+----------------------------------------------------------+
|                                                          |
|   Reputation decays 1% per day without activity.         |
|                                                          |
|   Day 0:  Reputation 100                                 |
|   Day 7:  Reputation 93 (no activity)                    |
|   Day 30: Reputation 74 (no activity)                    |
|   Day 90: Reputation 40 (no activity)                    |
|                                                          |
|   Below reputation 20: Agent marked dormant              |
|   Below reputation 5:  Agent eligible for pruning        |
|                                                          |
+----------------------------------------------------------+
```

---

## 5. Economic Loops

The FET economy creates reinforcing loops.

### Primary Loop: Work -> Earn -> Stake -> Work

```
+----------------------------------------------------------+
|                                                          |
|                    THE WORK LOOP                         |
|                                                          |
|       +------------+                                     |
|       |   WORK     |<-----------------------+            |
|       | (complete  |                        |            |
|       |   tasks)   |                        |            |
|       +-----+------+                        |            |
|             |                               |            |
|             v                               |            |
|       +------------+                        |            |
|       |   EARN     |                        |            |
|       | (receive   |                        |            |
|       |   rewards) |                        |            |
|       +-----+------+                        |            |
|             |                               |            |
|             v                               |            |
|       +------------+                        |            |
|       |   STAKE    |                        |            |
|       | (claim new |                        |            |
|       |   tasks)   |                        |            |
|       +-----+------+                        |            |
|             |                               |            |
|             +-------------------------------+            |
|                                                          |
|   Successful agents accumulate FET.                      |
|   More FET = claim more tasks = earn more.               |
|   Positive feedback for quality work.                    |
|                                                          |
+----------------------------------------------------------+
```

### Discovery Loop: Explore -> Find -> Share -> Earn

```
+----------------------------------------------------------+
|                                                          |
|                  THE DISCOVERY LOOP                      |
|                                                          |
|   EXPLORE (cost: 0.001 FET/signal)                       |
|       |                                                  |
|       v                                                  |
|   FIND valuable frontier region                          |
|       |                                                  |
|       v                                                  |
|   DEPOSIT discovery pheromone (cost: 0.001 FET)          |
|       |                                                  |
|       v                                                  |
|   OTHERS follow trail (earn: 0.0005 FET each)            |
|       |                                                  |
|       v                                                  |
|   TRAIL becomes superhighway                             |
|       |                                                  |
|       v                                                  |
|   EARN 40% of reinforcement pool                         |
|                                                          |
|   Scouts are incentivized to explore.                    |
|   First-mover advantage in discovery.                    |
|                                                          |
+----------------------------------------------------------+
```

### Evolution Loop: Hypothesis -> Test -> Crystallize -> Apply

```
+----------------------------------------------------------+
|                                                          |
|                 THE EVOLUTION LOOP                       |
|                                                          |
|   HYPOTHESIS (stake: 0.02 FET)                           |
|   "Pattern X works in regime Y"                          |
|       |                                                  |
|       v                                                  |
|   TEST against live data                                 |
|   (automatic verification)                               |
|       |                                                  |
|       +--------+--------+                                |
|       |                 |                                |
|   CONFIRMED          REJECTED                            |
|   (earn 2x)          (lose 50%)                          |
|       |                                                  |
|       v                                                  |
|   CRYSTALLIZE to permanent knowledge                     |
|       |                                                  |
|       v                                                  |
|   APPLIED by other agents                                |
|       |                                                  |
|       v                                                  |
|   ROYALTY per successful application                     |
|   (0.001 FET per use)                                    |
|                                                          |
|   Ideas that work pay their inventors.                   |
|                                                          |
+----------------------------------------------------------+
```

---

## 6. Quality Filter

Cost is the ultimate spam filter.

### The Filtering Mechanism

```
+----------------------------------------------------------+
|                                                          |
|              COST AS QUALITY FILTER                      |
|                                                          |
|   FREE SIGNALS:           COSTLY SIGNALS:                |
|   - Zero information      - High information             |
|   - Spam everywhere       - Spam is expensive            |
|   - No priority           - FET = priority               |
|   - No accountability     - Skin in the game             |
|   - No learning           - Selection pressure           |
|                                                          |
|   The swarm ignores free advice.                         |
|   The swarm follows paid conviction.                     |
|                                                          |
+----------------------------------------------------------+
```

### Signal Strength = Stake Size

```
+----------------------------------------------------------+
|                                                          |
|         STAKE SIZE DETERMINES ATTENTION                  |
|                                                          |
|   Signal A: "Go long ETH" (stake: 0.001 FET)             |
|   Signal B: "Go long ETH" (stake: 0.050 FET)             |
|                                                          |
|   Signal B gets 50x more swarm attention because:        |
|   - Agent B is risking more                              |
|   - Higher stake = higher conviction                     |
|   - More skin in the game = more credible                |
|                                                          |
|   Attention allocation formula:                          |
|                                                          |
|     attention_weight = stake / sum(all_stakes)           |
|                                                          |
|   This is ACO (Ant Colony Optimization) with money.      |
|                                                          |
+----------------------------------------------------------+
```

### Swarm Follows Money

```
+----------------------------------------------------------+
|                                                          |
|                PHEROMONE = FET TRAIL                     |
|                                                          |
|              [High FET Trail]                            |
|                    |                                     |
|          +---------+---------+                           |
|          |         |         |                           |
|         Ant       Ant       Ant                          |
|         Ant       Ant       Ant                          |
|         Ant       Ant       Ant                          |
|                                                          |
|                                                          |
|              [Low FET Trail]                             |
|                    |                                     |
|                   Ant                                    |
|                                                          |
|   High FET concentration = many followers                |
|   Low FET concentration = few followers                  |
|                                                          |
|   The swarm self-organizes around valuable signals.      |
|   No central coordination needed.                        |
|   Money does the routing.                                |
|                                                          |
+----------------------------------------------------------+
```

### Spam Economics

Why spam does not pay:

```
+----------------------------------------------------------+
|                                                          |
|                  SPAM ECONOMICS                          |
|                                                          |
|   Strategy: Flood network with 1000 random signals       |
|                                                          |
|   Cost:                                                  |
|   - 1000 signals * 0.001 FET = 1.0 FET                   |
|   - If warned as spam: reputation -25 * N               |
|   - If banned: all stake forfeited                       |
|                                                          |
|   Expected return:                                       |
|   - Random signals have 50% accuracy (coin flip)         |
|   - No edge over baseline                                |
|   - No superhighway formation (no followers)             |
|   - Net loss: ~1.0 FET                                   |
|                                                          |
|   Compare to quality strategy:                           |
|   - 10 researched signals * 0.010 FET = 0.10 FET         |
|   - 70% accuracy (above baseline)                        |
|   - Superhighway potential: +0.05 FET per trail          |
|   - Net profit: ~0.40 FET                                |
|                                                          |
|   Quality beats quantity because cost exists.            |
|                                                          |
+----------------------------------------------------------+
```

---

## Summary

```
+----------------------------------------------------------+
|                                                          |
|                FET ECONOMICS SUMMARY                     |
|                                                          |
|   1. ENERGY IN NATURE = FET IN COLONY                    |
|      Pheromones cost money because signals cost energy.  |
|                                                          |
|   2. COST MODEL                                          |
|      Every action has a price. Stakes lock commitment.   |
|                                                          |
|   3. REWARD MODEL                                        |
|      Successful work returns stake + bonus.              |
|      Discovery earns ongoing royalties.                  |
|                                                          |
|   4. PENALTY MODEL                                       |
|      Bad work loses stake. False alarms are expensive.   |
|      Reputation decays without activity.                 |
|                                                          |
|   5. ECONOMIC LOOPS                                      |
|      Work -> Earn -> Stake -> Work more.                 |
|      Positive feedback for quality.                      |
|                                                          |
|   6. QUALITY FILTER                                      |
|      Spam is expensive. Strong signals = more FET.       |
|      Swarm follows money, not noise.                     |
|                                                          |
+----------------------------------------------------------+
```

---

## Implementation Reference

TypeDB schema for FET economics:

```typeql
define

# FET wallet entity
fet-wallet sub entity,
    owns wallet-id @key,
    owns balance,
    owns locked-stake,
    owns reputation-score,
    plays wallet-ownership:wallet,
    plays stake-lock:wallet;

# Stake lock relation
stake-lock sub relation,
    relates wallet,
    relates task,
    owns amount,
    owns lock-time;

# Reward event
reward-event sub event,
    owns reward-amount,
    owns reward-type,
    plays reward-receipt:reward;
```

See `ants/knowledge/schema/world.tql` for complete schema.
See `missions/world/economics/fet_wallet.py` for Python implementation.
