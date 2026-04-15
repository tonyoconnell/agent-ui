# Docs Recon Report: agent-launch-toolkit → ONE

**Scanned:** `/Users/toc/Server/agent-launch-toolkit/docs/` — 65 markdown files, 38,158 lines

## Headline Numbers

- **Total docs:** 65 (excluding json + duplicated variants)
- **Total lines:** 38,158 (avg 587/doc)
- **Must port:** 8 core docs
- **Drop (Fetch-specific):** 25+ docs
- **Already covered by ONE's canonical set:** 11 docs
- **Rewrite-on-substrate:** 24 docs

## Category Breakdown

| Category | Count | Examples | Decision |
|----------|-------|----------|----------|
| Reference (CLI, SDK, MCP) | 5 | cli-reference.md, sdk-reference.md, mcp-tools.md, FEATURES.md, AGENTS.md | rewrite-on-substrate (partial overlap with ONE sdk.md) |
| Tutorials / Demos | 12 | demo.md, getting-started.md, lifecycle.md, workflow.md, tutorial-marketing-team.md | rewrite-on-substrate |
| Strategy & Growth | 10 | growth-strategy.md (×3), marketing-strategy.md (×3), organic-growth-strategy.md, the-agent-economy.md | drop (Fetch-specific GTM) |
| Playbooks & Task Lists | 15 | playbook.md, TODO-agents.md, TODO-toolkit.md, check.md, tests.md, sequence.md | lift-shift or rewrite |
| Swarm & Commerce | 8 | demo-commerce.md, marketing-team.md, autonomous-trading.md, demo-custodial.md | replace-with-Sui |
| Connection / Integration | 4 | connect.md, openclaw.md, openclaw-implementation.md, AGENTS.md | rewrite-on-substrate |
| Wallet & Auth | 3 | wallet-auth.md, custodial-trading.md, private-key.md | replace-with-Sui |
| Concepts / Architecture | 4 | architecture.md, paths.md, economic-infrastructure-for-ai-agents.md, stack.md | mixed |
| Reports & Meta | 3 | toolkit-report.md, sync-validation-report.md | drop |
| Empty / Drafts | 1 | refine.md | drop |

## 8 Essential Docs To Port

Ordered by dependency (port first → port last):

| # | Source | Target in ONE | Lines | Action |
|---|--------|----------------|-------|--------|
| 1 | architecture.md | `docs/architecture.md` (extend existing) | 94 | Lift-shift: substitute toolkit packages for ONE substrate |
| 2 | cli-reference.md | `docs/cli-reference.md` | 904 | Rewrite: collapse 28 agentlaunch commands → 12 ONE verbs |
| 3 | sdk-reference.md | `docs/sdk-reference.md` (extend `docs/sdk.md`) | 1,134 | Rewrite: expose `ask()`, `signal()`, `recall()` not Agentverse HTTP |
| 4 | mcp-tools.md | `docs/mcp-tools.md` | 1,262 | Rewrite: remap 45 tools to 10 substrate verbs |
| 5 | FEATURES.md | `docs/features.md` | 758 | Lift-shift: same structure, update metrics + phase names |
| 6 | playbook.md | `docs/playbook.md` (merge into existing) | 2,412 | Rewrite: subsumes economic-infrastructure + the-agent-economy |
| 7 | lifecycle.md | `docs/lifecycle.md` | 637 | Rewrite: deploy phase changes for Sui |
| 8 | workflow.md | `docs/workflow.md` | 814 | Rewrite: endpoint + auth changes |

**Total:** 10,015 lines — the bulk of the doc port.

## Dedup Map (prevent redundancy with existing ONE canon)

| Toolkit Doc | ONE Canonical | Action |
|---|---|---|
| cli-reference.md | `docs/commands-reference.md` if exists; else new | Merge or replace |
| sdk-reference.md | `docs/sdk.md` | Extend (substrate surface) |
| mcp-tools.md | `docs/api.md` + new `mcp-verbs.md` | Create new |
| playbook.md | `docs/playbook.md` + `docs/strategy.md` | Merge + adapt |
| lifecycle.md | `docs/lifecycle.md` | Rewrite for Sui |
| workflow.md | `docs/workflow.md` | Extend + adapt |
| paths.md | `docs/routing.md` | Parallel; cross-link only |
| people.md | `docs/people.md` | Already in ONE; sync only |
| stack.md | `docs/the-stack.md` | Already in ONE; sync only |
| TODO-template.md | `docs/TODO-template.md` | Already in ONE; no changes |
| learn-about-tokens.md | new `docs/tokens-sui.md` | Create Sui-specific |
| getting-started.md | `docs/tutorial.md` | Extend or merge |
| FEATURES.md | `docs/features.md` | Merge or extend |
| wallet-auth.md | `docs/auth.md` + new `docs/sui-wallet.md` | Rewrite for Sui |
| economic-infrastructure-for-ai-agents.md | `docs/strategy.md` | Compress into |
| the-agent-economy.md | `docs/strategy.md` | Compress into |

## Docs To Drop (Fetch-specific / Agentverse-specific)

**Growth + Marketing (all Fetch GTM):**
- growth-strategy.md, growth-strategy {1,2}.md
- marketing-strategy.md, marketing-strategy {1,2}.md
- organic-growth-strategy.md (1,300 lines)
- marketing-affiliate.md, marketing-team.md
- home.md (Fetch platform homepage)
- demo-video.md

**Commerce + Wallet (EVM → Sui swap):**
- autonomous-trading.md (BSC bonding curve logic)
- custodial-trading.md (Fetch custodial wallet service)
- learn-about-tokens.md (EVM mechanics; keep concepts → rewrite for Sui)

**Integration / Connection (Fetch-hosted):**
- connect.md, openclaw.md, openclaw-implementation.md (OpenClaw bridge)
- AGENTS.md (Agentverse API reference)

**Testing / Validation:**
- check.md, check-manual.md (Fetch agent health checks — port logic only)
- lifecycle-test.md, marketing-team-test.md (Fetch test data)
- sync-validation-report.md, sync-docs.md (Fetch doc infra)

**Other:**
- economic-infrastructure-for-ai-agents.md — compress into `strategy.md`
- agent-coordination.md — Fetch handoff patterns (already covered by ONE's autonomous-org)
- the-agent-economy.md — strategic overlap, compress
- toolkit-report.md — meta (drop)

## Copy Category Distribution

| Category | Count | Notes |
|----------|-------|-------|
| lift-shift | 12 | architecture.md, FEATURES.md, private-key.md, sequence.md, tests.md, check.md, sync-docs.md, TODO-{toolkit,sync,docs,template}.md, toolkit-report.md |
| rewrite-on-substrate | 24 | playbook.md, lifecycle.md, workflow.md, cli/sdk/mcp-reference.md, demo.md, getting-started.md, tutorial-marketing-team.md, connect.md, openclaw*.md, marketing-team.md, people-to-swarm.md, self-improvement.md, demo-commerce.md, demo-custodial.md, demo-complete-custodial.md, the-agent-economy.md, economic-infrastructure…, TODO-agents.md, TODO-check.md, AGENTS.md |
| replace-with-Sui | 9 | autonomous-trading.md, custodial-trading.md, learn-about-tokens.md, wallet-auth.md, asi.md (+ 4 others) |
| drop | 25 | all growth-*, all marketing-*, check-manual.md, home.md, demo-video.md, toolkit-report.md, sync-validation-report.md, TODO-organic-growth.md, refine.md, agent-coordination.md, marketing-affiliate.md |
| already-exists-in-ONE | 6 | cli-reference.md → commands, sdk-reference.md → sdk.md, mcp-tools.md → api.md, stack.md, people.md, TODO-template.md |

## Fetch-Specific Assumptions That Don't Translate

**Chain / Wallet (25+ files assume BSC/EVM/Cosmos):**
- Autonomous trading on BSC testnet/mainnet
- Custodial wallets managed by platform
- Cosmos address derivation (fetch1…)
- FET token for deployment fees (120 FET handoff)

**Agentverse-specific (20+ files):**
- Deployment to `https://agentverse.ai`
- Agentverse Secrets for key storage
- Agentverse API key auth
- A2A cards and Chat Protocol

**Platform economics (18 files):**
- Bonding curves on Uniswap/PancakeSwap
- 2% protocol fee to Fetch treasury
- Token holders as reputation signal
- Human-signature handoff links (Fetch workflow)

**Growth tactics (12 files):**
- ASI Alliance partnership strategy
- Fetch brand positioning
- FET tokenomics and affiliate programs
- Agentverse marketplace integration

None of these translate directly to ONE's Sui substrate. Rewrite or drop.

## Sections Worth Salvaging (even from dropped docs)

| Section | Source | Destination | Action |
|---------|--------|-------------|--------|
| Bonding curve mechanics | learn-about-tokens.md | `docs/tokens-sui.md` | Rewrite |
| Swarm coordination patterns | marketing-team.md, playbook.md | `docs/swarms.md` (new) | Lift-shift |
| Economic model logic | playbook.md + economic-infrastructure… | `docs/strategy.md` section | Rewrite |
| Error handling patterns | check.md, tests.md | `docs/patterns.md` | Lift-shift |
| Agent self-monitoring | self-improvement.md | `docs/substrate-learning.md` section | Rewrite |

## Go / No-Go Decision Points for W2

- **Monorepo:** Keep `packages/cli`, `packages/mcp`, `packages/sdk` inside envelopes/. Easier to co-evolve with substrate.
- **Namespace:** `@one/cli`, `@one/mcp`, `@one/sdk`.
- **CLI verbs:** Collapse 28 agentlaunch commands → 12 ONE verbs (`/create agent`, `/deploy`, `/tokenize`, `/trade`, `/signal`, `/ask`, etc.).
- **MCP shape:** Expose 10 substrate verbs directly (signal, ask, mark, warn, recall, reveal, forget, frontier, know, highways).
- **Compile targets:** ONE agent.md compiles to (a) Sui contract call, (b) nanoclaw worker (both already live).
- **Two-chain:** Keep Agentverse bridge optional — agents primarily deploy to Sui. Bridge is escape hatch.

## Exit Criteria

- 8 core docs ported and rendered
- No duplicate content with CLAUDE.md or existing canon
- All cross-links resolve
- Toolkit HTTP endpoints replaced with substrate verbs in every ported doc
- Sui replaces BSC/EVM/Cosmos in every tokenize/trade section
- At least one end-to-end flow (agent scaffold → deploy → tokenize) documented using Sui only
