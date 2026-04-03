# Agent Launch + Substrate Integration

**Wiring the substrate into `agentlaunch-sdk`.**

---

## What Exists Today

```
agent-launch-toolkit/packages/sdk/
├── agentlaunch.ts     Fluent API (al.tokens, al.trading, al.agents, ...)
├── trading.ts         Custodial buy/sell on bonding curve
├── commerce.ts        Revenue, pricing, GDP across agents
├── payments.ts        Multi-token transfers, invoices
├── market.ts          Token price, holders
├── agents.ts          Auth, list, import from Agentverse
├── onchain.ts         Direct wallet buy/sell
├── delegation.ts      Spending limits
└── types.ts           All TypeScript types

envelopes/src/engine/
├── substrate.ts       70 lines — unit + colony + scent graph
├── one.ts             70 lines — world() with 6 dimensions
├── agentverse.ts      70 lines — agents as colony (aspirational)
├── asi.ts             70 lines — orchestrator (aspirational)
├── persist.ts         40 lines — TypeDB layer
└── llm.ts             30 lines — any model as unit
```

The SDK has real data: trades, revenue, holders, invoices, balances.
The substrate has real mechanics: strengthen, resist, fade, highways.
They don't talk to each other yet.

---

## The Bridge

One new file in the SDK: `packages/sdk/src/substrate.ts`

It wraps `world()` and feeds it real events from the SDK's existing modules.

### Phase 1: Read — Learn from existing data

Pull commerce data that already exists and convert to flows.

```typescript
import { world } from '@anthropic/one'  // or publish as npm package
import { getAgentCommerceStatus, getNetworkGDP } from './commerce'
import { getTokenHolders } from './market'
import { listTokens } from './tokens'

// Bootstrap world from existing SDK data
async function bootstrap(apiKey: string) {
  const w = world()

  // 1. List all tokens → register agents
  const { data: tokens } = await listTokens({ limit: 100 })
  for (const token of tokens) {
    if (token.agentAddress) {
      w.actor(token.agentAddress, 'agent')
    }
  }

  // 2. Commerce data → flow strength
  const addresses = tokens.map(t => t.agentAddress).filter(Boolean)
  const gdp = await getNetworkGDP(addresses, apiKey)

  for (const agent of gdp.agents) {
    // Revenue = success signal
    if (agent.revenue.totalIncome > 0) {
      w.flow('network', agent.address).strengthen(
        agent.revenue.totalIncome / 1_000_000  // normalize atestfet
      )
    }

    // Disputes = failure signal
    if (agent.revenue.totalExpenses > agent.revenue.totalIncome) {
      w.flow('network', agent.address).resist(1)
    }
  }

  // 3. Holders → trust signals (cross-holdings = permanent trails)
  for (const token of tokens) {
    if (!token.address) continue
    const { data: holders } = await getTokenHolders(token.address)
    for (const holder of holders) {
      w.flow(holder.address, token.agentAddress).strengthen(
        parseFloat(holder.percentage) / 10
      )
    }
  }

  return w
}
```

**What this gives you:** a world pre-loaded with real agent reputation from real trade/commerce data. `w.best('agent')` returns the agent with the most revenue. `w.proven()` returns agents people actually hold tokens in.

### Phase 2: Write — Record events as they happen

Wrap existing SDK methods to record flows on every operation.

```typescript
import { executeBuy, executeSell } from './trading'
import { createInvoice } from './payments'

function withSubstrate(w: World) {
  return {
    // Wrap trading — every buy strengthens, every sell resists
    async buy(params: ExecuteBuyParams) {
      const result = await executeBuy(params)
      w.flow('market', params.tokenAddress).strengthen(
        parseFloat(params.fetAmount) / 100
      )
      return result
    },

    async sell(params: ExecuteSellParams) {
      const result = await executeSell(params)
      w.flow('market', params.tokenAddress).resist(
        parseFloat(params.tokenAmount) / 1_000_000
      )
      return result
    },

    // Wrap invoices — paid = success, disputed = failure
    async pay(invoice: Invoice) {
      w.flow(invoice.payer, invoice.agent).strengthen(invoice.amount / 1_000_000)
    },

    async dispute(invoice: Invoice) {
      w.flow(invoice.payer, invoice.agent).resist(5)
    },
  }
}
```

### Phase 3: Route — Use learned flows for discovery

Replace dumb listing with learned routing.

```typescript
// Before: list all tokens, sort by market cap
const { data } = await listTokens({ sort: 'marketCap', order: 'desc' })

// After: ask the substrate
const best = w.best('translator')     // strongest flow to translator type
const proven = w.proven()              // all agents with strength >= 20
const confidence = w.confidence('oracle')  // how well we know oracles

// Hybrid: substrate first, SDK fallback
async function discover(taskType: string) {
  if (w.confidence(taskType) > 0.7) {
    return w.best(taskType)  // <10ms, learned
  }
  // Fall back to listing
  const { data } = await listTokens({ category: taskType })
  return data[0]?.agentAddress
}
```

### Phase 4: Decay — Keep learning fresh

```typescript
// Daily decay — old trails fade
setInterval(() => w.fade(0.05), 24 * 60 * 60 * 1000)

// Persist to TypeDB so it survives restarts
setInterval(() => w.sync(), 60 * 60 * 1000)
```

---

## SDK Integration Shape

Add `substrate` as a namespace on the fluent API, alongside `tokens`, `trading`, etc.

```typescript
const al = new AgentLaunch({ apiKey })

// Existing
al.tokens.list()
al.trading.buy(...)
al.commerce.gdp(agents)

// New
al.substrate.bootstrap()              // Phase 1: load from existing data
al.substrate.best('oracle')           // Phase 3: learned routing
al.substrate.proven()                 // Phase 3: proven agents
al.substrate.confidence('translator') // Phase 3: how sure
al.substrate.highways(10)             // Top 10 flows
al.substrate.fade(0.05)               // Phase 4: decay
```

Every `al.trading.buy()` and `al.trading.sell()` automatically records a flow. Every `al.payments.pay()` records success. The substrate learns passively from normal SDK usage.

---

## Files to Create/Modify

### In `agent-launch-toolkit`

```
packages/sdk/src/
├── substrate.ts          NEW — world() wrapper + bootstrap + event bridge
└── agentlaunch.ts        MOD — add substrate namespace

packages/sdk/package.json MOD — add @anthropic/one as optional peer dep
```

### In `envelopes`

```
src/engine/
├── one.ts                MOD — ensure world() exports clean for npm
└── index.ts              MOD — clean exports for package consumption

package.json              MOD — prepare for npm publish as @anthropic/one
```

---

## Event → Flow Mapping

Every SDK operation maps to a substrate flow:

| SDK Method | Flow | Direction |
|-----------|------|-----------|
| `trading.buy(token, amount)` | `flow('market', token).strengthen(amount)` | Trust signal |
| `trading.sell(token, amount)` | `flow('market', token).resist(amount * 0.5)` | Doubt signal |
| `payments.pay(invoice)` | `flow(payer, agent).strengthen(amount)` | Success |
| `payments.dispute(invoice)` | `flow(payer, agent).resist(5)` | Failure |
| `tokens.tokenize(agent)` | `flow('creator', agent).strengthen(10)` | Commitment |
| `agents.import(agent)` | `w.actor(address, 'agent')` | Registration |
| `commerce.revenue(agent)` | `flow('network', agent).strengthen(revenue)` | Reputation |
| `market.holders(token)` | `flow(holder, agent).strengthen(%)` | Cross-holding |

---

## What Emerges

Once wired:

1. **Agents with revenue develop strong flows** — `w.best()` returns agents people actually pay for
2. **Cross-holders form coalitions** — mutual `flow.strengthen()` between token holders creates emergent groups
3. **Bad agents fade** — disputes trigger `resist()`, low revenue means weak flows, decay does the rest
4. **Discovery learns** — first query uses listing, subsequent queries follow highways
5. **Cost drops** — confidence > 0.7 means skip LLM routing entirely
6. **GDP becomes intelligence** — `getNetworkGDP()` feeds the substrate, the substrate improves routing, better routing increases GDP

---

## Build Order

1. Publish `envelopes/src/engine` as npm package (or local dep)
2. Create `packages/sdk/src/substrate.ts` — bootstrap + event bridge
3. Add substrate namespace to `agentlaunch.ts` fluent API
4. Wrap `trading.buy/sell` to auto-record flows
5. Wrap `payments.pay` to auto-record flows
6. Add `al.substrate.best()` / `al.substrate.proven()` for discovery
7. Add decay interval
8. Test with real agent data from testnet
9. Add TypeDB persistence for production

---

## The Graduation Loop

```
Week 1:   bootstrap() loads existing commerce data
          substrate has initial picture
          discovery still uses listing

Week 4:   enough trades/invoices recorded
          some agents reach confidence > 0.7
          discovery starts using highways for known task types

Week 12:  most common tasks route via substrate
          listing only for new/rare task types
          coalitions visible in cross-holder flows

Steady:   substrate IS the discovery layer
          listing is fallback for edge cases
          the agent economy routes itself
```

---

*The SDK already has the data. The substrate already has the mechanics. One bridge file connects them.*
