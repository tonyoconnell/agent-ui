# TODO

> ONE Substrate tasks. 67 open, 38 done.
> Priority = value + phase + persona + blocking. Pheromone adjusts at runtime.

---

## C1: Foundation

- [ ] **Build CEO control panel: hire/fire/commend/flag agents** — critical=30 + C1=40 + ceo=25 + blocks(1)=5 [sonnet] `ui, governance, P0, ceo`
  exit: CEO can manage AI agents: delegate tasks, view top performers, flag bad actors
  blocks: ceo-control-live
- [ ] **Wire CEO visibility: highways (top 10 performers)** — critical=30 + C1=40 + ceo=25 + blocks(1)=5 [sonnet] `ui, analytics, P0, ceo`
  exit: CEO sees top 10 by net strength (reputation = mark - warn). Arithmetic only.
  blocks: ceo-control-live
- [ ] **Implement task entity in TypeDB with priority formula** — critical=30 + C1=40 + dev=20 + blocks(2)=10 [haiku] `typedb, build, P0, foundation`
  exit: task-id, name, value/phase/persona, priority-score, priority-formula in schema
  blocks: task-api-live, doc-sync
- [ ] **Implement isToxic() blocking: resistance >= 10 AND resistance > 2× strength** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `engineering, security, P0, foundation`
  exit: Toxic paths auto-blocked, no LLM waste, cost = $0
  blocks: safety-live
- [ ] **Build markdown agent deployment: write file, push, live in minutes** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [opus] `agent, integration, P0, deployment`
  exit: Users write agent.md → /api/agents/sync → live on ONE + AgentVerse
  blocks: agent-marketplace-live
- [ ] **Schema: Add task, task-dependency, task-execution entities to world.tql** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `typedb, schema, P0, foundation`
  exit: task, task-dependency, task-execution entities defined in schema
  blocks: task-orchestration
- [ ] **Functions: Write 6 task selection functions (priority, critical-path, bottleneck, etc.)** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `typedb, routing, P0, foundation`
  exit: priority(), critical_path(), bottleneck(), cost(), revenue(), idle() functions in TypeDB
  blocks: task-orchestration
- [ ] **Seed: Insert Phase 1 tasks (marketing, engineering, telegram, dashboard)** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `typedb, build, P0, foundation`
  exit: Marketing, engineering, telegram, dashboard tasks seeded in TypeDB
  blocks: c1-tasks-live
- [ ] **Loop: Modify /api/tick to orchestrate tasks** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `api, routing, P0, foundation`
  exit: /api/tick picks highest-priority task, executes signal, marks outcome
  blocks: tick-orchestration
- [ ] **Agents: Create 8 marketing agents (markdown or HTTP)** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `agent, marketing, P0, deployment`
  exit: 8 marketing agents (director, creative, media-buyer, etc.) alive on Telegram
  blocks: marketing-dept-live
- [ ] **Telegram: Wire signals to @antsatworkbot channel** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `agent, telegram, P0, integration`
  exit: Agents signal @antsatworkbot, channel receives and routes back
  blocks: marketing-dept-live
- [ ] **Create blocks relation for task dependencies** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `typedb, build, P0, foundation`
  exit: Task A can block Task B. Relation stores transitive dependencies
  blocks: task-api-live
- [ ] **Build task priority formula: value + phase + persona + blocking** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `foundation, build, P0, dev`
  exit: Formula: critical=30, high=25, medium=20, C1=40...C7=10, ceo=25...agent=5, +5 per block
  blocks: effective-priority
- [ ] **Create 7-persona vocabulary layer: CEO/Dev/Investor/Gamer/Kid/Freelancer/Agent** — high=25 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `foundation, design, P1, governance`
  exit: Every formula maps to 7 vocabulary skins. Same math, different words.
  blocks: persona-translation
- [ ] **Build task API GET with effective priority** — high=25 + C1=40 + dev=20 + blocks(1)=5 [haiku] `api, build, P0, dev`
  exit: GET /api/tasks returns tasks sorted by effective priority. Filter by tag/phase
  blocks: task-board-live
- [ ] **Implement Haiku one-shot extraction from prose docs** — high=25 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `integration, build, P1, dev`
  exit: Haiku reads doc once, outputs TODO-{docname}.md with structured format (~$0.004/doc)
  blocks: doc-sync
- [ ] **Create /sync-docs slash command** — high=25 + C1=40 + dev=20 + blocks(1)=5 [haiku] `commands, build, P1, dev`
  exit: /sync-docs scans TODO-*.md → syncs to TypeDB → regenerates TODO.md
  blocks: task-api-live
- [ ] **Build task API POST with priority computation** — high=25 + C1=40 + dev=20 [sonnet] `api, build, P1, dev`
  exit: POST /api/tasks creates task entity with computed priority formula
- [ ] **Create /extract-tasks slash command** — high=25 + C1=40 + dev=20 [haiku] `commands, build, P1, dev`
  exit: /extract-tasks ONE-strategy.md → generates TODO-ONE-strategy.md
- [ ] **Update /add-task command with value/phase/persona/blocks fields** — high=25 + C1=40 + dev=20 [haiku] `commands, build, P1, dev`
  exit: /add-task "fix auth" value=high phase=C1 persona=dev blocks=login-flow
- [ ] **Update /tasks command to show priority formula + effective priority** — high=25 + C1=40 + dev=20 [haiku] `commands, build, P1, dev`
  exit: /tasks shows: name, priority=90 (formula), phase, value, persona, tags
- [ ] **Enable task tagging with domain/action/priority/phase** — high=25 + C1=40 + dev=20 [haiku] `foundation, build, P0, dev`
  exit: Tasks tagged: marketing, build, P0, C1. Can filter by any combo
- [ ] **Generate TODO.md sorted by effective priority** — high=25 + C1=40 + dev=20 [haiku] `build, P1, dev`
  exit: TODO.md shows tasks grouped by phase, sorted by effective_priority within

---

## C2: Collaboration

- [ ] **Create agent self-improvement loop: rewrite prompts when success-rate < 50%** — high=25 + C2=35 + dev=20 + blocks(1)=5 [opus] `intelligence, learning, P1, foundation`
  exit: Agent prompt auto-rewrites every 10 min if samples >= 20 AND success < 50%
  blocks: evolution-live
- [ ] **Dashboard: Show task graph + pheromone in real-time** — high=25 + C2=35 + dev=20 + blocks(1)=5 [opus] `ui, reactflow, P1, visualization`
  exit: ReactFlow visualization showing tasks, dependencies, pheromone trails
  blocks: task-board-live
- [ ] **Build task board UI showing priority + pheromone** — high=25 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `ui, build, P1, dev`
  exit: TaskBoard component shows: priority score, effective priority, formula, blocks
  blocks: task-board-live
- [ ] **Implement doc-scan integration with task system** — high=25 + C2=35 + dev=20 + blocks(1)=5 [opus] `integration, build, P1, dev`
  exit: doc-scan extracts checkboxes/gaps as tasks. Syncs to TypeDB
  blocks: task-api-live
- [ ] **Create /work loop that respects task blocking** — high=25 + C2=35 + dev=20 + blocks(1)=5 [opus] `commands, build, P1, dev`
  exit: /work picks highest priority. Skips blocked tasks
  blocks: autonomous-loop
- [ ] **Build task success-rate tracking per unit** — high=25 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `analytics, build, P1, dev`
  exit: Agent success-rate = completed_tasks / total_tasks. Updated per completion
  blocks: evolution
- [ ] **Docs: Cross-link dictionary.md + one-ontology.md to task execution** — medium=20 + C2=35 + dev=20 [haiku] `docs, integration, P1, knowledge`
  exit: docs/dictionary.md and docs/one-ontology.md link to task system
- [ ] **Group tasks by phase (C1-C7) in board view** — medium=20 + C2=35 + dev=20 [haiku] `ui, build, P2, dev`
  exit: Board shows: Foundation | Collaboration | Commerce | ... | Scale sections
- [ ] **Show task blocking graph in UI** — medium=20 + C2=35 + dev=20 [sonnet] `ui, build, P2, dev`
  exit: Visualize: Task A → blocks → Task B. Helps prioritization
- [ ] **Build task exit condition tracking** — medium=20 + C2=35 + dev=20 [sonnet] `foundation, build, P2, dev`
  exit: Task.exit = "what done looks like". Loop verifies on completion

---

## C3: Commerce

- [ ] **Implement agent evolution when success-rate < 50%** — high=25 + C3=30 + dev=20 + blocks(1)=5 [opus] `intelligence, build, P1, dev`
  exit: Agent with <50% success over 20 tasks gets rewritten prompt
  blocks: intelligence
- [ ] **Wire Sui on-chain proofs: paths crystallized immutable** — high=25 + C3=30 + investor=15 + blocks(1)=5 [opus] `commerce, sui, blockchain, P1, compliance`
  exit: Strength, resistance, revenue locked on Sui. Auditable. Compliant.
  blocks: blockchain-live
- [ ] **Build marketplace: humans buy/sell services to agents** — high=25 + C3=30 + investor=15 + blocks(1)=5 [opus] `commerce, payments, P1, revenue`
  exit: Skill pricing, payment routing, escrow settlement on Sui
  blocks: commerce-live
- [ ] **Revenue: Wire x402 payment routing on Sui (C3)** — high=25 + C3=30 + investor=15 + blocks(1)=5 [opus] `commerce, x402, sui, P0, foundation`
  exit: Payments flow from skills to units on Sui blockchain
  blocks: commerce-live

---

## C4: Expansion

- [ ] **Scale to 2M+ AgentVerse agents: bridge AgentVerse discovery + ONE routing** — high=25 + C4=25 + dev=20 + blocks(1)=5 [opus] `integration, expansion, P1, network-effects`
  exit: ONE substrate routes through AgentVerse 2M agents. Discovery automatic.
  blocks: agentverse-live
- [ ] **Wire creator domains: mint branded agents on your domain** — high=25 + C4=25 + investor=15 + blocks(1)=5 [sonnet] `integration, branding, P1, expansion`
  exit: creator.domain → agents live, branded, routing under your control
  blocks: domains-live
- [ ] **Sui Wallet Adapter (`@mysten/dapp-kit`) for browser wallet connect** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Agent identity = keypair (self-sovereign, not platform-derived)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Discovery on-chain (`follow()`/`select()` read Sui path weights)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Transaction history UI (link to Sui Explorer)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Gas sponsorship (Protocol pays gas for new agents)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Create escrow on-chain (lock SUI for async tasks)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Release on success (payment + mark + fee, atomic)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Cancel on timeout (tokens return, path warned)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **x402 HTTP flow (402 → fund → execute → release)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Multi-hop payment chains** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Multi-currency (USDC, FET)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **On-chain fade (CF Worker cron)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Crystallize highways (`freeze_object()`, $0.50 fee)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Read frozen highways (on-chain badge in UI)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Proof of delivery / consumption** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Colony treasury on-chain** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Colony splitting** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Unit dissolve (balance returns to colony)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Protocol fee management** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Federation (cross-group signals)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Security audit** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Mainnet deployment** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **SDK publish (`@one/sdk`)** — medium=20 + C4=25 + agent=5 [sonnet] ``
- [ ] **Multi-chain bridge** — medium=20 + C4=25 + agent=5 [sonnet] ``

---

## C5: Analytics

- [ ] **Monitoring: Weekly success metrics dashboard** — medium=20 + C5=20 + investor=15 + blocks(1)=5 [sonnet] `analytics, metrics, P2, knowledge`
  exit: Weekly report showing success rates, revenue, top performers, emerging frontiers
  blocks: metrics-live
- [ ] **Create kids learning path: learn pheromone by playing** — medium=20 + C5=20 + kid=10 + blocks(1)=5 [sonnet] `ui, education, gamification, P2, learning`
  exit: Kids see ant colony, set mood (explore/exploit), watch trails form
  blocks: education-live

---

## C6: Products

- [ ] **Build token minting: creators mint their own tokens on Sui** — medium=20 + C6=15 + investor=15 + blocks(1)=5 [opus] `commerce, sui, tokenomics, P2, scale`
  exit: Creators mint tokens, agents earn them, marketplace trades them
  blocks: tokenomics-live
- [ ] **Build multi-chain bridge: Sui, Ethereum, Solana native routing** — medium=20 + C6=15 + investor=15 + blocks(1)=5 [opus] `integration, blockchain, P2, scale`
  exit: Routes work across chains. Payments settle on fastest chain. User chooses.
  blocks: multi-chain-live

---

## Done

- [x] **Prove deterministic routing speed: <0.01ms per decision** `foundation, test, P0, engineering`
- [x] ****1a. Install Sui CLI** — `sui 1.61.2-homebrew`** ``
- [x] ****1b. Create keypair** — `0x90096b9e11cff8f0127a22be75c67f8188ee503add9b4c7ff98978fd04cc765d`** ``
- [x] ****1c. Fund from faucet** — ~1.9 SUI across 26 gas coins** ``
- [x] ****1d. Build contract** — Clean build (removed pinned framework dep, auto-resolved)** ``
- [x] ****1e. Run Move tests** — 6/6 pass (unit, deposit/withdraw, path, mark/warn, pay, fade, highway/toxic)** ``
- [x] ****1f. Publish** — Package `0xa5e6bddae833220f58546ea4d2932a2673208af14a52bb25c4a603492078a09e`, tx `5GNhTrAyoaHP8BEd3JgnrvZRTThSwv7xu5tNsGg3a6Q6`** ``
- [x] ****1g. Set env vars** — `SUI_PACKAGE_ID`, `SUI_PROTOCOL_ID`, `SUI_NETWORK=testnet` in `.env`** ``
- [x] ****1h. Generate platform seed** — `SUI_SEED` in `.env`** ``
- [x] ****1i. Verify** — `sui client object $SUI_PROTOCOL_ID` shows Protocol { treasury: 0, fee_bps: 50 }** ``
- [x] ****2a. Create scout on-chain** — Unit `0x6fd45656222db69f81dbf61c70873fd466ebd8b157bf6694f81314e3e0c13af8`, wallet `0xb0e2d65f43a080ba09275cf3f1ce89ed35309b5fca38df6ad7e6100e616f6dba`** ``
- [x] ****2b. Verify on-chain** — Unit { name: "scout", unit_type: "agent", activity: 0, balance: 0 }** ``
- [x] ****2c. TypeDB ↔ Sui link** — `absorb()` writes `sui-unit-id` on unit; `resolve(uid)` reads it back** ``
- [x] ****2d. View on explorer** — `https://suiscan.xyz/testnet/object/0x6fd45656222db69f81dbf61c70873fd466ebd8b157bf6694f81314e3e0c13af8`** ``
- [x] ****3a. Create analyst** — Unit `0x952fea2b99904aa8a365939c5ebc8079014b7cef7ac1ab2375b5a10e4ec6c47d`, wallet `0xfab3...8104`** ``
- [x] ****3b. Send signal** — Signal `0x8a17...da42`, payload "hello from scout", task "research"** ``
- [x] ****3c. Verify Signal object** — Signal owned by analyst address, payload + sender + receiver correct** ``
- [x] ****3d. Verify Path created** — Path `0x956c...76da` scout→analyst, strength: 1, type: "interaction"** ``
- [x] ****3e. Check events** — UnitCreated, SignalSent, Marked events all emitted** ``
- [x] ****4a. Deposit SUI to unit** — 100000 MIST deposited into scout Unit balance** ``
- [x] ****4b. Pay via withdraw+transfer+mark** — Scout withdrew 1000 MIST → analyst address, path marked. Note: Move `pay()` needs both `&mut Unit` (co-sign required) — use withdraw+transfer+mark or escrow pattern instead** ``
- [x] ****4c. Verify balances** — Scout: 99000 (100000 - 1000). 1000 MIST arrived at analyst address** ``
- [x] ****4d. Protocol fee design** — withdraw+mark bypasses fee (by design). Escrow flow (Phase 3) collects fees atomically via `release_escrow()`** ``
- [x] ****4e. Verify path strength** — Path strength: 2, hits: 2 (signal mark + payment mark)** ``
- [x] ****5a. Bridge module** — `src/engine/bridge.ts`: mirror + absorb + resolve** ``
- [x] ****5b. Schema updated** — `sui-unit-id` on unit, `sui-path-id` on path** ``
- [x] ****5c. persist.ts wired** — mark/warn/actor auto-mirror to Sui** ``
- [x] ****5d. Absorb endpoint** — `POST /api/absorb { cursor? }` → polls Sui events → writes to TypeDB** ``
- [x] ****5e. Verify events queryable** — 5 events (2 UnitCreated, 1 SignalSent, 2 Marked) returned by `queryEvents()`** ``
- [x] ****Critical:** TypeDB credentials in build output → moved to runtime/secrets** ``
- [x] ****High:** TQL injection → input validation + escaping added** ``
- [x] **Credentials removed from `dist/`** ``
- [x] **`docs/SECURE-DEPLOY.md` created** ``
- [x] **Implement effective priority runtime calculation** `foundation, build, P0, dev`
- [x] **Parse TODO-*.md files deterministically** `foundation, build, P0, dev`
- [x] **Scan docs/ for TODO-*.md and extract all tasks** `foundation, build, P0, dev`
- [x] **Sync parsed tasks to TypeDB (task + skill + capability + blocks)** `typedb, build, P0, dev`
- [x] **Mark task complete via POST /api/tasks/:id/complete** `api, build, P1, dev`
