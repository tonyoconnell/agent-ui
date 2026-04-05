# Agent Launch Integration

**Wiring the substrate into `agentlaunch-sdk`.**

---

## The Bridge

One new file: `packages/sdk/src/substrate.ts`

It wraps `world()` and feeds it real events from the SDK's existing modules.

---

## Event → Path Mapping

Every SDK operation maps to a substrate path:

| SDK Method | Path | Signal |
|-----------|------|--------|
| `trading.buy(token, amount)` | `path('market', token).mark(amount)` | Trust |
| `trading.sell(token, amount)` | `path('market', token).warn(amount * 0.5)` | Doubt |
| `payments.pay(invoice)` | `path(payer, agent).mark(amount)` | Success |
| `payments.dispute(invoice)` | `path(payer, agent).warn(5)` | Failure |
| `tokens.tokenize(agent)` | `path('creator', agent).mark(10)` | Commitment |
| `agents.import(agent)` | `w.actor(address, 'agent')` | Registration |
| `commerce.revenue(agent)` | `path('network', agent).mark(revenue)` | Reputation |
| `market.holders(token)` | `path(holder, agent).mark(%)` | Cross-holding |

---

## Four Phases

### 1. Read — Bootstrap from existing data

```typescript
const gdp = await getNetworkGDP(addresses, apiKey)
for (const agent of gdp.agents) {
  if (agent.revenue.totalIncome > 0)
    w.path('network', agent.address).mark(agent.revenue.totalIncome / 1_000_000)
}
```

### 2. Write — Record events as they happen

Every `al.trading.buy()` auto-drops weight on the path. Every `al.payments.pay()` records success. Passive learning from normal SDK usage.

### 3. Route — Follow learned paths for discovery

```typescript
if (w.confidence(taskType) > 0.7)
  return w.follow(taskType)        // <10ms, learned
else
  return listTokens({ category })  // fallback to listing
```

### 4. Decay — Keep learning fresh

```typescript
setInterval(() => w.fade(0.05), 24 * 60 * 60 * 1000)
```

---

## SDK Shape

```typescript
const al = new AgentLaunch({ apiKey })

al.tokens.list()                      // existing
al.trading.buy(...)                   // existing (now auto-drops on path)
al.substrate.follow('oracle')         // new — follow learned paths
al.substrate.proven()                 // new — proven agents
al.substrate.sense('translator')      // new — sense path weight
al.substrate.highways(10)             // new — top 10 paths
```

---

## Files

```
agent-launch-toolkit/packages/sdk/src/substrate.ts  NEW
agent-launch-toolkit/packages/sdk/src/agentlaunch.ts MOD (add namespace)
envelopes/src/engine/                                MOD (clean npm exports)
```

---

## The Graduation Loop

```
Week 1:   bootstrap() loads existing commerce data (mark weights)
Week 4:   some agents reach confidence > 0.7, highways form
Week 12:  most tasks follow paths via substrate, listing is fallback
Steady:   substrate IS the discovery layer
```

---

## The Verbs

```
signal — move through the colony
mark   — leave weight on a path (buy, pay, succeed)
follow — traverse weighted path (route, discover)
sense  — perceive path weight (confidence, check)
fade   — decay over time (keep learning fresh)
```

---

*The SDK has the data. The substrate has the mechanics. One bridge file connects them.*

---

## See Also

- [flows.md](flows.md) — How SDK events become substrate paths
- [agents.md](agents.md) — Unit anatomy and task patterns
- [one-protocol.md](one-protocol.md) — Protocol layer the bridge connects to
- [strategy.md](strategy.md) — Why AgentLaunch integration matters
- [integration.md](integration.md) — Full system connection blueprint
- [substrate-learning.md](substrate-learning.md) — How events become learned routes
