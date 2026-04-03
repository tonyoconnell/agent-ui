# ASI World

**The agent economy as a ONE world.**

---

## The Discovery

From `agent-launch-toolkit/docs/the-agent-economy.md`:

> "Cross-token holding is the ant trail made permanent."

They already understood. The agent economy IS ant colony optimization. Tokens ARE pheromones.

---

## The Mapping

| Agent Economy | ONE Dimension | What it is |
|---------------|---------------|------------|
| C-Suite + Departments | **Groups** | Organization |
| CEO, CFO, CTO, agents | **Actors** | Inhabitants with tokens |
| Tasks, services, tokens | **Things** | What exists |
| Payment paths, cross-holdings | **Paths** | Pheromone trails |
| Queries, transactions | **Events** | What happened |
| Routing weights, coalitions | **Knowledge** | Crystallized patterns |

---

## The Hierarchy

```
ASI WORLD
│
├── C-SUITE (group)
│   ├── CEO ─── routes everything ─── 0.02 FET/query
│   ├── CFO ─── tracks money
│   ├── CTO ─── shared reasoning ─── 0.05 FET/query
│   ├── COO ─── 24/7 monitoring
│   └── CHRO ─── grows the team
│
├── COMPUTE COALITION (group)
│   ├── IT Manager, Facilities Mgr, Finance Ctrl
│
├── DEFI COALITION (group)
│   ├── Fund Manager, Yield Farmer, Treasury Mgr
│
└── LONGEVITY COALITION (group)
    └── Health Coach, Lab Manager
```

---

## Two Classes of Transaction

**Micro-operations** — automatic, tiny, invisible. 0.01 FET to a specialist. `drop()` weight on the path.

**Capital decisions** — human-signed, deliberate. Buying tokens. Deploying agents. Events that require handoff.

---

## Coalitions Emerge from Holdings

```typescript
// Mutual holdings = coalition
asi.path('yield-farmer', 'fund-manager').drop(50)
asi.path('fund-manager', 'yield-farmer').drop(50)
// Bidirectional dropping → coalition emerges automatically
```

---

## Graduation = Crystallization

Agents graduate to Uniswap when they reach threshold. In substrate terms: path weight reaches highway status → `freeze_object()` on Sui → permanent on-chain knowledge.

---

## The Verbs

```
signal — move through the colony
drop   — leave weight on a path (payments, holdings)
follow — traverse weighted path (route tasks)
sense  — perceive path weight (check reputation)
fade   — decay over time (paths evaporate)
```

---

*They built an ant colony without knowing it. ONE makes it explicit.*

---

## See Also

- [flows.md](flows.md) — How tokens flow as pheromone through agent economy
- [world.md](world.md) — Universal ontology underlying the economy
- [strategy.md](strategy.md) — Competitive positioning within ASI ecosystem
- [one-protocol.md](one-protocol.md) — Private substrate advantage
- [signal.md](signal.md) — Cross-token holdings as signal primitives
- [emergence.md](emergence.md) — Coalition formation as emergent intelligence
