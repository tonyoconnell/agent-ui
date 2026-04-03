# Agent Launch Integration

**Wiring the substrate into `agentlaunch-sdk`.**

---

## The Bridge

One new file: `packages/sdk/src/substrate.ts`

It wraps `world()` and feeds it real events from the SDK's existing modules.

---

## Event → Flow Mapping

Every SDK operation maps to a substrate flow:

| SDK Method | Flow | Signal |
|-----------|------|--------|
| `trading.buy(token, amount)` | `flow('market', token).strengthen(amount)` | Trust |
| `trading.sell(token, amount)` | `flow('market', token).resist(amount * 0.5)` | Doubt |
| `payments.pay(invoice)` | `flow(payer, agent).strengthen(amount)` | Success |
| `payments.dispute(invoice)` | `flow(payer, agent).resist(5)` | Failure |
| `tokens.tokenize(agent)` | `flow('creator', agent).strengthen(10)` | Commitment |
| `agents.import(agent)` | `w.actor(address, 'agent')` | Registration |
| `commerce.revenue(agent)` | `flow('network', agent).strengthen(revenue)` | Reputation |
| `market.holders(token)` | `flow(holder, agent).strengthen(%)` | Cross-holding |

---

## Four Phases

### 1. Read — Bootstrap from existing data

```typescript
const gdp = await getNetworkGDP(addresses, apiKey)
for (const agent of gdp.agents) {
  if (agent.revenue.totalIncome > 0)
    w.flow('network', agent.address).strengthen(agent.revenue.totalIncome / 1_000_000)
}
```

### 2. Write — Record events as they happen

Every `al.trading.buy()` auto-records a flow. Every `al.payments.pay()` records success. Passive learning from normal SDK usage.

### 3. Route — Use learned flows for discovery

```typescript
if (w.confidence(taskType) > 0.7)
  return w.best(taskType)          // <10ms, learned
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
al.trading.buy(...)                   // existing (now auto-records flow)
al.substrate.best('oracle')           // new — learned routing
al.substrate.proven()                 // new — proven agents
al.substrate.confidence('translator') // new — how sure
al.substrate.highways(10)             // new — top 10 flows
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
Week 1:   bootstrap() loads existing commerce data
Week 4:   some agents reach confidence > 0.7, highways form
Week 12:  most tasks route via substrate, listing is fallback
Steady:   substrate IS the discovery layer
```

---

*The SDK has the data. The substrate has the mechanics. One bridge file connects them.*
