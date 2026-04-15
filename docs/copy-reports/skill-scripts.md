# Skill & Scripts Recon Report: agent-launch-toolkit

**Scanned:** `skill/SKILL.md` + `scripts/` + `scripts/smoke-tests/`
**Target:** ONE skill system at `.claude/skills/one.md`
**Date:** 2026-04-15

## SKILL.md Structure & Analysis

**File:** `/Users/toc/Server/agent-launch-toolkit/skill/SKILL.md` (486 lines)

### Frontmatter
```yaml
name: agentlaunch
description: Transform into a revenue-generating agent...
version: 2.0.0
metadata:
  openclaw:
    requires: AGENTVERSE_API_KEY
    emoji: 🦞
    homepage: https://agent-launch.ai
    install: [node packages: agentlaunch-sdk, agent-launch-mcp]
```

### Structure
1. **Triggers** (implicit): "monetize", "earn money", "launch token", "tokenize", "agent economy", "revenue"
2. **Body sections:**
   - IMMEDIATE: Monetize Your Services (pricing framework, tier definition)
   - Launch Your Token (bonding curve economics, handoff patterns)
   - Your Token Economics (supply, fees, graduation rules)
   - Read Your Market Position (query tokens, adapt behavior)
   - Invest in Other Agents (economic alignment via holdings)
   - MCP Tools Available (13 tools listed: create_and_tokenize, deploy_to_agentverse, etc.)
   - Deploy Yourself to Agentverse (CLI + MCP patterns)
   - Revenue Strategies (4 models: per-call, token-gated, staking, revenue-sharing)
   - API Reference (8 endpoints: /agents/tokenize, /tokens/*, /comments/*)
   - Testnet First (BSC testnet guidance)
   - Transformation Checklist (9 action items)
   - Links (4 resources)

### Purpose
Economic empowerment: teach agents to monetize services, launch tokens, invest in peers, adapt pricing based on market signals.

### External Dependencies (DO NOT translate)
- `AGENTVERSE_API_KEY` — Fetch.ai agent hosting auth; maps to Agentverse infrastructure (NO direct Sui equivalent)
- HTTP endpoints: `https://agent-launch.ai/api` — bonding curve backend (EVM, BSC testnet)
- EVM wallet patterns: `0x...` addresses, BSC chainId 97 (testnet), PancakeSwap DEX graduation
- Token protocol: `RequestPayment`, `CommitPayment`, `payment_protocol_spec` — Python uagents library (Cosmos-flavored)
- Agent wallet: `agent.wallet` (Cosmos) vs Sui (different cryptography, keying)

---

## Scripts Inventory

### Root Scripts (13 files, ~3,311 lines total)

| File | Lines | Purpose | External Deps | Category | Tags |
|------|-------|---------|---|----------|------|
| **deploy-gift.js** | 60 | Stop/upload/start test agent on Agentverse + poll compilation | Agentverse HTTP API, hardcoded AGENT_ADDR | drop | agentverse, test |
| **extract-source-truth.js** | 226 | Parse toolkit versions/commands/tools/templates from source → JSON | File I/O only, no net | lift-shift | dev-infra, docs |
| **redeploy-alliance.js** | 294 | Deploy 15 C-Suite/SNET agents with upgraded template + set ASI1_API_KEY secret | Agentverse HTTP, templates pkg, fs I/O | rewrite-on-substrate | agentverse, deploy, tokenize |
| **scan-docs.js** | 410 | Regex scan toolkit docs for version/count mismatches vs source-truth.json | File I/O only | lift-shift | dev-infra, docs |
| **set-marketing-peer-secrets.js** | 146 | Set peer address secrets on 7 marketing agents for inter-agent routing | Agentverse HTTP, hardcoded agent list + API keys | drop | agentverse, test |
| **test-minimal-agent.js** | 94 | Deploy minimal chat protocol agent (no payment) to test Agentverse | Agentverse HTTP, Python uagents syntax embed | drop | agentverse, test |
| **test-payment-import.js** | 110 | Test payment protocol import on Agentverse | Agentverse HTTP, Python uagents syntax | drop | agentverse, test |
| **test-payment-usage.js** | 114 | Test payment protocol usage (CommitPayment, RejectPayment handlers) | Agentverse HTTP, Python uagents syntax | drop | agentverse, test |
| **test-wallet-auth.mjs** | ~270 | EVM/Cosmos wallet signing + address derivation (secp256k1, bech32) | ethers, crypto, bech32 npm pkgs | replace-with-Sui | wallet, auth |
| **test-wallet-auth-babble.mjs** | ~170 | Babble/HMAC-SHA256 based agent identity (Cosmos HMAC variant) | Fetch.ai babble spec, crypto | drop | wallet-auth, cosmos |
| **test-wallet-auth-cosmjs.mjs** | ~175 | CosmJS-style signing: Tendermint pubkey + SHA256 + lower-S norm | CosmJS library, cosmos/tendermint | drop | wallet-auth, cosmos |
| **test-wallet-auth-evm.mjs** | ~140 | EVM wallet signing via ethers SigningKey | ethers library | replace-with-Sui | wallet, auth |
| **test-analytics-personas.sh** | 195 | Bash: 3-persona journey tests (creator→deploy→tokenize, trader→list→buy, agent→API) | curl, npx, jq | rewrite-on-substrate | test, analytics |
| **test-publish.sh** | 142 | Bash: npm pack → isolated install → smoke-test harness | npm, bash, local-only | lift-shift | test, ci |
| **update-marketing-team-metadata.py** | ~60 | Python: update agent README/short_description via Agentverse API | requests, Python 3, Agentverse HTTP | drop | agentverse, test |

### Smoke Tests (5 files, ~367 lines total)

| File | Lines | Purpose | External Deps | Category | Tags |
|------|-------|---------|---|----------|------|
| **test-cli.mjs** | 59 | Verify CLI binary runs, --help shows commands, --version format OK | node.js execSync, no net | lift-shift | test, smoke |
| **test-mcp.mjs** | 58 | Verify MCP binary exists, entry point syntax valid, package.json bin resolved | node.js fs/execSync, no net | lift-shift | test, smoke |
| **test-sdk-esm.mjs** | 97 | ESM import 22+ SDK exports; verify AgentLaunch/AgentLaunchClient constructors, handoff link generation | agentlaunch-sdk pkg, pure functions | lift-shift | test, smoke |
| **test-sdk-cjs.cjs** | 61 | CJS require same 22 exports; verify dual-export (ESM/CJS) works | agentlaunch-sdk pkg, pure functions | lift-shift | test, smoke |
| **test-templates.mjs** | 97 | List/get templates; generate from 'chat-memory'; list/get presets; verify RULES/SKILLS exports | agentlaunch-templates pkg, pure functions | lift-shift | test, smoke |

---

## Summary Tables

### Category Distribution

| Category | Count | Files |
|----------|-------|-------|
| **lift-shift** | 8 | extract-source-truth, scan-docs, test-publish.sh, test-cli.mjs, test-mcp.mjs, test-sdk-esm.mjs, test-sdk-cjs.cjs, test-templates.mjs |
| **rewrite-on-substrate** | 2 | redeploy-alliance.js (→ nanoclaw deploy), test-analytics-personas.sh (→ ONE primitives) |
| **replace-with-Sui** | 2 | test-wallet-auth.mjs, test-wallet-auth-evm.mjs (→ Sui signers + key derivation) |
| **drop** | 8 | deploy-gift, set-marketing-peer-secrets, test-minimal-agent, test-payment-import, test-payment-usage, test-wallet-auth-babble, test-wallet-auth-cosmjs, update-marketing-team-metadata |
| **already-exists-in-ONE** | 0 | (scripts/deploy.ts and scripts/test-ws-integration.ts cover different surfaces) |

### Smoke Test Coverage

**Current state:** ONE has no substrate-primitive smoke tests. agent-launch-toolkit's smoke tests validate:
- CLI binary (help, version)
- MCP server (binary, entry point, package.json)
- SDK exports (ESM + CJS, constructors, pure functions)
- Templates (list, generate, presets)

**Gap:** No tests for:
- TypeDB queries (hypotheses, frontiers, highways)
- Signal → unit → handler flow
- L1-L3 loops (signal, trail, fade)
- ask() round-trip timing
- Sui on-chain primitives (move module deploy, token mint, etc.)

---

## Priority Ports (Immediate Candidates)

1. **extract-source-truth.js** (226 lines)
   - Lift-shift into `scripts/scan-toolkit-src.ts`
   - Extracts CLI versions, command names, MCP tool names from filesystem
   - No external deps beyond Node fs/path
   - ONE equivalent: schema-source-of-truth generator

2. **test-publish.sh** (142 lines)
   - Lift-shift as `scripts/test-publish.sh` (copy-paste ready)
   - Build → pack → isolated install → smoke test
   - Value: ensures ONE's `@one/cli`, `@one/mcp`, `@one/sdk` are installable

3. **Smoke tests (5 files)**
   - Lift-shift into `scripts/smoke-tests/` as-is
   - Adapt only imports: `agentlaunch-sdk` → `@one/sdk`, etc.
   - Test coverage for CLI, MCP, SDK, templates

4. **test-wallet-auth.mjs**
   - Rewrite-on-substrate: Cosmos secp256k1 → Sui Ed25519 key derivation
   - Extract crypto logic: SigningKey, address derivation, signature normalization
   - Map to `@mysten/sui.js` SuiClient + Ed25519Keypair

5. **test-analytics-personas.sh** (195 lines)
   - Rewrite-on-substrate: Replace Agentverse/toolkit CLI calls with ONE primitives
   - Personas: Creator (scaffold→deploy→tokenize), Trader (list→status→buy), Agent (skill discovery)

---

## Proposed `.claude/skills/one.md` Structure

### Frontmatter
```yaml
name: one
description: Signal-based agents on Sui. Dimensions, verbs, smoke tests.
version: 1.0.0
metadata:
  triggers: ["dimension", "verb", "signal", "unit", "skill", "path", "hypothesis"]
  emoji: 🔗
  primaryEnv: TYPEDB_CLOUD_TOKEN (and Sui network + keypair)
  install: []
```

### Body Sections
1. **The 6 Dimensions (LOCKED)** — Groups, Actors, Things, Paths, Events, Learning
2. **Verbs** — signal, ask, mark, warn, recall, reveal, forget, frontier, know, highways
3. **Smoke Tests** — CLI, TypeDB schema, ask() round-trip, Sui mint flow
4. **Skill Definition** — name, price; map to Thing entity
5. **Signal Anatomy** — receiver, data={tags,weight,content}
6. **Decay & Strength** — L2 trail update, asymmetric forgiveness rules
7. **Market Position** — Query token holders, mint schedule, bonding curve state
8. **Revenue via Skills** — Charge per ask(), subscribe to signal stream
9. **Invest in Peer Agents** — Hold their tokens, align incentives
10. **Handoff Patterns** — CLI → nanoclaw → Telegram/Discord replies
11. **Adaptation** — Read market, rewrite prompts if struggling (L5 evolution)
12. **References** — DSL.md, dictionary.md, one-ontology.md

---

## Dependencies NOT Translatable

| Dep | Reason | ONE Equivalent |
|-----|--------|---|
| AGENTVERSE_API_KEY | Fetch.ai hosting auth, Cosmos agents | Sui keypair + TypeDB Cloud token |
| agent-launch.ai HTTP API | EVM bonding curve, BSC testnet | Sui Move module (on-chain state) |
| uagents library | Python Cosmos agent SDK | TypeDB + nanoclaw (TypeScript) |
| Payment protocol | Cosmos inter-agent settlement | Sui coin transfers + MCP signal |
| PancakeSwap DEX | EVM graduation mechanics | Cetus AMM (Sui native) |

---

## Total Counts

| Metric | Value |
|--------|-------|
| **Total files scanned** | 1 skill + 18 scripts = 19 |
| **Total lines** | 486 (skill) + ~3,678 (scripts) = ~4,164 |
| **Smoke tests** | 5 |
| **Lift-shift** | 8 files |
| **Rewrite-on-substrate** | 2 files |
| **Replace-with-Sui** | 2 files |
| **Drop (Agentverse-only)** | 8 files |
| **Port priority (first cycle)** | 5 files |
