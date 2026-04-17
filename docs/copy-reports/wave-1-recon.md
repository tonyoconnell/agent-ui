---
title: Cycle 1 Wave 1 — Recon Reports (4 Haiku agents, parallel)
type: recon
cycle: 1
wave: 1
date: 2026-04-15
---

# Cycle 1 / Wave 1 — Recon

Four Haiku agents read in parallel. Verbatim findings only. No proposals.
Feeds directly into W2 (Opus decide).

---

## R1 — `../ONE/cli/` (merge target)

**Identity:** `oneie` v3.6.40, ESM, Node `>=22.16.0`.
**Bin:** `./dist/index.js` (aliased `oneie` + `one`). Pure-JS shim at `bin/index.js`.
**Build:** `tsc` only. Out to `dist/`.
**Test runner:** `bun:test` (no vitest/jest config). Tests in `test/commands/init.test.ts`, `test/utils/file-resolver.test.ts`.

**Source tree (25 TS files):**
```
src/
  index.ts banner.ts
  create-user-profile.ts create-org-profile.ts
  copy-claude-config.ts clone-docs.ts clone-web.ts
  sync-agents.ts sync-ontology.ts
  commands/{init,agent}.ts
  lib/{detect,agent-detection}.ts
  utils/{validation,file-resolver,installation-setup,launch-claude}.ts
  admin/{index,build,validate,list,manifest,monorepo,release,sync}.ts
```

**Dependencies (runtime):** `chalk ^5 · fs-extra ^11 · glob ^10 · ora ^8 · prompts ^2 · yaml ^2`.
**DevDeps:** `@types/fs-extra, @types/node ^20, @types/prompts, typescript ^5.3`.
**Published files include:** `dist/`, `one/{knowledge,connections,things,people,groups}`, `.claude/{agents,commands,hooks,skills}`, multiple .md docs, `folders.yaml`, `llms.txt`.

**tsconfig:** ES2020/ES2020/node, strict, declaration + sourceMap.
**External sibling imports:** none. Only npm deps.

**Existing verbs (live):** `init`, `agent`. (2 total — baseline to preserve.)

---

## R2 — `../agent-launch-toolkit/packages/cli/src/` (DX lift)

**Identity:** `agentlaunch` v1.2.11.
**Banned-term files (DROP on lift):**
- `commands/{tokenize,buy,sell,holders,claim}.ts`
- `wallet.ts, auth.ts, swarm-from-org.ts, connect-update.ts, init.ts` (secondary: ethers/cosmjs touch)

**Registered verbs (27 in `index.ts`):**
create, config, deploy, tokenize⊘, list, status, comments, holders⊘, optimize, buy⊘, sell⊘, claim⊘, init, scaffold, wallet⊘, pay, org-template, swarm-from-org⊘, marketing, alliance, docs, skill, connect-logs, connect, connect-status, connect-update⊘, auth⊘
(⊘ = banned/skip)

**Worth lifting (DX):**
- `config.ts` — `CliConfig` iface (apiKey, baseUrl), `readConfig/writeConfig/getBaseUrl/requireApiKey/maskKey/buildMcpConfig/tryGetApiKey`. Envelope equivalent: none. **LIFT.**
- `http.ts` — `getClient()`, `getPublicClient()`, `agentverseRequest<T>()`. Prune agentverse-specific, keep HTTP wrapper shape. **LIFT (partial).**
- No banner/splash/ASCII art. ONE CLI already has `banner.ts` — keep that.

**Dependencies to NOT adopt:** `@cosmjs/crypto`, `ethers`, `bech32`. Commander stays (envelope can use or replace).

---

## R3 — `../agent-launch-toolkit/packages/sdk/src/` (SDK lift)

**Identity:** `agentlaunch-sdk` v0.2.15, dual ESM/CJS exports.

**Tree classification:**

| File | Verdict | Note |
|---|---|---|
| client.ts | KEEP | HTTP client, `resolveBaseUrl()` at L17, retry logic |
| urls.ts | KEEP | URL constants (DEV/PROD api+frontend), `getApiUrl/getFrontendUrl/getEnvironment/resolveApiKey/resolveBaseUrl` |
| storage.ts | KEEP | `list/get/put/deleteStorage(agentAddress, ...)` — pure KV wrapper |
| handoff.ts | **PARTIAL** | `validateEthAddress, generateDeployLink` → KEEP. `generateBuyLink/SellLink/DelegationLink/FIAT_PROVIDER_CONFIGS/generateFiatOnrampLink` → **DROP** (mint-adjacent, belongs in agent-launch). |
| agents.ts, comments.ts, connect.ts, payments.ts, wallet-auth.ts, types.ts | KEEP | pure utils / types |
| agentlaunch.ts, agentverse.ts, commerce.ts, delegation.ts, market.ts, onchain.ts, tokens.ts, trading.ts | DROP | banned or mint-coupled |
| claude-context.ts | MISSING | TODO references it; does not exist in toolkit tree |

**peerDependencies:** `@cosmjs/crypto, bech32, ethers` (all optional). W2 decision: `@oneie/sdk` should peerDep-free these.

---

## R4 — Preset merge plan

**Toolkit templates** (11 registered in `registry.ts`): chat-memory, swarm-starter, custom, price-monitor, trading-bot, data-analyzer, research, gifter, consumer-commerce, connect, markdown.

**Toolkit presets** (16 in `presets.ts`, all [LAND] — none trip mint filter):
```
ceo, cto, cfo, coo, cro, writer, social, community, analytics, outreach,
ads, strategy, payment-processor, booking-agent, subscription-manager,
escrow-service
```

**Envelopes agents** (~30 .md): tutor, researcher, coder, writer, concierge, router, scout, harvester, guard, analyst, teacher, designer, trader, eth-dev, founder, ops, nanoclaw, community, asi-builder, ehc-officer, marketing/{analyst,ads,social,content,creative,director,seo,media-buyer}, donal/{cmo,full,quick,monthly,outreach,+1}, debby/{...}, core/{classify,valence}.

**Collision surface:** `community`, `writer`, `social`, `ads` exist in both — W2 must decide which wins or how to namespace (`@oneie/templates` preset `community` vs `agents/community.md`). Proposal-free; flag only.

**Union target for merged `presets.ts`:** 16 toolkit presets + N elevated envelope agents (elevation list is a W2 decision).

---

## Log

```
W1: tasks_parallel=4  marked=4  warned=0  dissolved=0
    model=haiku  elapsed=~30s total (parallel)
    artifacts=4 reports consolidated into this file
```

## Decision surface for W2 (Opus)

1. Test harness: `bun:test` (live) → vitest (envelope) — migrate tests or run dual?
2. Monorepo layout: `envelopes/cli/` vs `envelopes/packages/cli/`? (TODO locks the former.)
3. `handoff.ts` split: keep `generateDeployLink + validateEthAddress`, drop buy/sell/delegation/fiat.
4. Verb collisions: toolkit `init` vs ONE `init` (ONE wins — preserve v3.6.40 behaviour).
5. Preset name collisions: `community/writer/social/ads` — namespace or merge?
6. `claude-context.ts` MISSING — remove from T-C1-06 list or re-scope.
7. Peer deps `ethers/cosmjs/bech32` — drop entirely (no wallet auth on envelopes SDK).
8. `bin/index.js` shim: keep as-is (ESM, no TS) or port to TS build?

---

*Recon complete. W2 owns synthesis — do not delegate.*
