# Templates Package Recon Report

**Source:** `/Users/toc/Server/agent-launch-toolkit/packages/templates/src/`  
**Target:** ONE agent scaffolding + presets → `agents/**/*.md` + `packages/templates/`  
**Scope:** All files in src/, 11,259 LOC total, pure TypeScript (zero runtime deps)

---

## File Inventory

| File | Lines | Purpose |
|------|------:|---------|
| `index.ts` | 63 | Public API surface: re-exports registry, generator, presets, claude-context, markdown agents |
| `registry.ts` | 106 | Template registry: AgentTemplate interface + TEMPLATES array + listTemplates/getTemplate |
| `generator.ts` | 773 | Core: variable substitution (`{{name}}`), README/env/.claude builders, system prompt patterns (44 domain patterns) |
| `presets.ts` | 472 | 15 pre-configured agent presets (C-Suite 5 + Marketing 8 + Commerce 4) with pricing/vars |
| `people.ts` | 668 | Org chart → swarm generator; transforms Executive/Department/Team into SwarmAgent configs; 4 example orgs |
| `claude-context.ts` | 3237 | **Mega context file:** 12 rule documents (agentlaunch.md, agentverse.md, api-design.md, ...), SKILLS object, DOCS links, buildPackageJson, buildSwarmClaudeMd, buildProjectSkills |
| **templates/** | 6940 | 11 template modules (chat-memory, swarm-starter, custom, price-monitor, trading-bot, data-analyzer, research, gifter, consumer-commerce, connect, markdown) |

**Total src LOC: 11,259** | Tests: 6 suites (build, consumer-commerce, gaps, per-template, swarm-starter, swarm-starter-integration)

---

## Public Exports (API Surface)

```typescript
// Registry
listTemplates()           → AgentTemplate[]
getTemplate(name)         → AgentTemplate | undefined
getCanonicalName(name)    → string

// Generator
generateFromTemplate(name, vars, opts?)     → GenerateResult
generateSystemPrompt(desc)                  → string
generateWelcomeMessage(opts)                → string

// Presets
getPreset(name)           → Preset | undefined
listPresets()             → Preset[]

// Claude Context
RULES, SKILLS, DOCS, EXAMPLES, buildPackageJson, 
CURSOR_MCP_CONFIG, CURSOR_RULES,
buildSwarmClaudeMd, buildSwarmConfig, buildSwarmPackageJson, buildProjectSkills

// Markdown agents
generateFromMarkdown, generateStarterMarkdown, extractSecrets, 
generateAgentCard, recordLesson

// People/Swarm
generateSwarmFromOrg, generateOrgTemplate, summarizeSwarm, EXAMPLE_ORGS
```

---

## Templates (11 total)

| Name | Lines | Input Variables | Python Dependencies | Secrets | Fetch-specific |
|------|------:|---|---|---|---|
| `chat-memory` | 304 | agent_name, description, system_prompt, memory_size | requests, openai | AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY, ASI1_API_KEY | Agentverse API, ASI1-mini LLM |
| `swarm-starter` | 1426 | agent_name, description, role, service_price_afet, interval_seconds, token_address, premium_token_threshold, effort_mode, rate_limit_per_minute | requests | AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY, AGENT_ADDRESS | Agentverse, AgentLaunch API, commerce stack (payments, tier-gating, cross-holdings) |
| `custom` | 473 | agent_name, description, custom_system_prompt, memory_size | requests | Base set | Agentverse API |
| `price-monitor` | 593 | agent_name, description, token_address, alert_threshold, poll_interval, rate_limit, free_requests, premium_threshold | requests | AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY | Agentverse, AgentLaunch token pricing API |
| `trading-bot` | 575 | agent_name, description, initial_capital, risk_level, rebalance_freq | requests | AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY | Agentverse, AgentLaunch price feeds |
| `data-analyzer` | 580 | agent_name, description, data_source, analysis_type, schedule | requests, pandas (optional) | AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY | Agentverse, ASI1-mini |
| `research` | 609 | agent_name, description, research_domain, report_format | requests, openai | AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY | Agentverse, HuggingFace/OpenAI for research |
| `gifter` | 737 | agent_name, description, gift_pool_size, recipient_criteria | requests | AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY, WALLET_PRIVATE_KEY | Agentverse, BSC wallet (EVM) |
| `consumer-commerce` | 442 | agent_name, description, role, service_price_fet, accepted_tokens, enable_fiat_onramp | requests | AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY, WALLET_PRIVATE_KEY | Agentverse, MoonPay, Wallet signing |
| `connect` | 181 | agent_name, description, connect_address | requests | AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY | Agentverse, AgentLaunch Telegram/Discord bridge |
| `markdown` | 1020 | SPECIAL: parses agent.md files + generates A2AAgentCard/AgentLesson/LessonsFile | uagents (types only) | None | Agentverse protocol specs |

---

## Copy Categories

| Category | Files | Reason | Action |
|----------|-------|--------|--------|
| **Lift-and-shift** | `index.ts`, `registry.ts`, `generator.ts`, `presets.ts`, `people.ts` | Substrate-agnostic scaffolding logic; pure TypeScript variable substitution; preset definitions work on any agent model | Create `packages/templates/src/` in ONE; rewire imports from `agentlaunch-templates` → `@one/templates` |
| **Rewrite on substrate** | `claude-context.ts` | 3237 lines of Fetch-centric context (Agentverse API patterns, ASI1 rules, BSC constants, deployment flows). Map to ONE's CLAUDE.md + skill system + agent-md.ts compiler | Split into: (1) schema/rules → CLAUDE.md sections, (2) SKILLS → skill definitions in presets, (3) code examples → agent samples in `agents/` |
| **Replace with Sui** | `gifter.ts`, `consumer-commerce.ts`, `trading-bot.ts` (EVM/wallet parts) | BSC wallet signing, bonding curves, MoonPay fiat onramp. ONE uses Sui Move + nanoclaw for identity/payments. | Rewrite commerce templates: replace `WALLET_PRIVATE_KEY` → Sui delegation, bonding curve → Sui shared object, fiat → no-op (testnet only) |
| **Drop** | Fetch.ai-specific growth docs embedded in claude-context (Agentverse directory rules, ASI1-mini system prompts, affiliate/marketing for agent-launch.ai) | Platform-specific marketing; Agentverse listing SEO; BSC testnet faucet links | Remove: Agentverse-specific secrets setup, ASI1 LLM routing, Fetch wallet address format docs |
| **Already-exists-in-ONE** | Scaffolding flow (templates → files) | ONE has `/create agent` + `src/engine/agent-md.ts` (YAML frontmatter parser) + `agents/` directory with 25+ markdown agents | Extend agent-md.ts parser to support optional TypeScript/Markdown block for skills; add preset selector to `/create agent` prompt |

---

## External Dependencies (DON'T translate)

### Runtime (Python, in generated agent code)
- `uagents`, `uagents_core` — Fetch.ai SDK (REPLACE: adapt to nanoclaw message format)
- `openai` — LLM API calls (KEEP: claude-api pattern, but route via ONE engine)
- `requests` — HTTP client (KEEP: required for bridge calls)
- `pandas` — Optional data analysis (KEEP)

### Tooling (Build-time, npm)
- `typescript@^5.3.0` (LIFT)

### APIs (hardcoded endpoints)
- `https://agent-launch.ai/api` — AgentLaunch token + pricing endpoints (REPLACE: map to Sui RPC + nanoclaw routing)
- `https://launchpad-backend-dev-1056182620041.us-central1.run.app` — Dev server (DROP: no equivalent in ONE testnet)
- `https://agentverse.ai/v1` — Agentverse deployment (REPLACE: nanoclaw creates units directly in TypeDB)
- `https://api-inference.huggingface.co` — HuggingFace LLM (KEEP: optional dependency)
- ASI1-mini LLM endpoint — Fetch.ai proprietary (REPLACE: route to claude or openrouter via ONE's `llm()` call)
- BSC RPC + wallet signing (REPLACE: Sui testnet + shared object delegation)

---

## Mapping: Claude-context.ts → ONE's CLAUDE.md + Skill System

**Input:** 3237-line document with 12 embedded rule files + examples + package.json templates

**Output:** Split across THREE targets

### 1. CLAUDE.md (docs/CLAUDE.md) — Rules + Style
Extract and merge:
- agentlaunch.md → platform constants (DROP most; KEEP schema for skill pricing)
- agentverse.md → deployment rules (REWRITE: replace Agentverse API flow with nanoclaw on-signal flow)
- api-design.md → REST patterns (MAP to OneAPI response shapes in routing.md)
- ai-design.md, agent-patterns.md, payment-patterns.md → agent.md block examples (LIFT as-is, update API calls)

### 2. Skill Definitions (presets.ts + skill entities in TypeDB)
Extract service_price_afet + pricing table for each preset:
```yaml
# Example: writer preset becomes ONE agent with skill registry
skills:
  - name: blog_post
    price: 0.01 FET
    tags: [content, writing]
  - name: tweet_thread
    price: 0.01 FET
    tags: [social, quick]
```
Move into `agents/donal/writer.md` frontmatter or new `src/schema/presets.tql` TypeDB rules.

### 3. Package.json Builder (buildPackageJson, buildSwarmClaudeMd)
`generator.ts` builds six output files per template:
- `code` (Python) → agent.md prompt block
- `readme` (MD) → agent.md body sections
- `envExample` → no equivalent (ONE uses skill secrets, not .env)
- `claudeMd` → fold into one CLAUDE.md
- `claudeSettings` → no equivalent (ONE uses .claude/settings.json differently)
- `agentlaunchConfig` → create `agents/<name>/.agent.json` metadata sidecar

---

## Presets Worth Porting as ONE Agent Presets

**All 15 presets are viable.** The C-Suite + Marketing presets map directly to ONE's org structure:

| Toolkit Preset | ONE Agent | Status | Effort |
|---|---|---|---|
| ceo, cto, cfo, coo, cro | infrastructure agents (router, reasoner, treasury, ops, scout) | LIFT | 1d (update pricing + skill tags) |
| writer, social, community, analytics, outreach, ads, strategy | marketing pod (already 10+ agents in agents/donal/) | EXTEND | 3d (merge toolkit presets into donal agents, add pricing) |
| payment-processor, booking-agent, subscription-manager, escrow-service | commerce layer (NEW) | NEW | 5d (Sui Move + skill routing + delegation) |

**Priority order:** C-Suite (infrastructure) → Marketing (exist, refine) → Commerce (new, medium effort).

---

## Proposed Scaffolder Interface

Goal: `/create agent <preset>` replaces `npx agentlaunch scaffold`.

### Entry Point
```bash
/create agent <name>
  --preset writer|ceo|booking-agent|...
  --model claude-haiku|claude-sonnet|gpt-4-mini
  --channels telegram|web|discord|...
  --price 0.01  (FET for default skill)
  --local       (scaffold only, no deploy)
```

### Flow
1. Load preset from registry (presets.ts logic)
2. Prompt for missing vars (agent_name, description, channels)
3. Call buildSwarmClaudeMd + skill templates (from claude-context.ts)
4. Write to `agents/<group>/<name>.md` + optional `.agent.json` (metadata)
5. Auto-register in TypeDB (via `src/engine/agent-md.ts` parser)
6. Return: "Agent scaffolded. Run `/claw <name>` to deploy to nanoclaw."

### Internals
- Reuse `presets.listPresets()` + `presets.getPreset()`
- Reuse `generator.generateSystemPrompt()` for free-form agent creation
- Replace Python code generation with agent.md markdown + inline TypeScript blocks (skill handlers)
- Replace buildClaudeSettings (Agentverse MCP) with buildProjectSkills (TypeDB skill inserts)

---

## Summary

**Total: 11,259 LOC | 11 templates | 15 presets**

**Breakdown:**
- Lift-and-shift: 1,318 LOC (index, registry, generator, presets, people)
- Rewrite on substrate: 3,237 LOC (claude-context → CLAUDE.md + skills)
- Replace with Sui: 3,441 LOC (gifter, consumer-commerce, trading-bot commerce layers)
- Drop: ~250 LOC (Fetch marketing docs, Agentverse-specific rules)
- Already-exists-in-ONE: ~3,000 LOC (scaffolding flow, org-to-swarm, example orgs → donal agents)

**Key decision points:**
1. **Presets as skill registry:** Embed 15 presets in `src/schema/presets.tql` or keep as `packages/templates/src/presets.ts`?
2. **Commerce layer:** Port consumer-commerce preset to Sui Move + ONE skill routing, or skip Phase 1?
3. **Markdown agent examples:** Merge toolkit's 11 templates into donal/ agents/ or keep as separate "starter pack"?
4. **Claude context split:** Single mega-CLAUDE.md or per-agent context docs in agents/<name>/CLAUDE.md?

**Recommended W2 tasks:**
- T-T01: Lift presets.ts + people.ts into packages/templates
- T-T02: Port C-Suite presets (ceo, cto, cfo) as infrastructure agent presets
- T-T03: Merge Marketing presets into existing donal/ agents, update pricing
- T-T04: Rewrite generator.ts → scaffolder.ts (agent.md output instead of Python)
- T-T05: Extract claude-context rules → CLAUDE.md sections (routing, skill system, examples)
- T-T06: New consumer-commerce preset on Sui (Phase 2, after wallet identity)

