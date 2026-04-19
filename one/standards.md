# Agent Standards Landscape (2026)

**What's settled, what isn't, what ONE adopts.**

The 2026 agent ecosystem has three settled layers under Linux Foundation / AAIF
governance: **AGENTS.md** (repo guidance), **MCP** (tool layer), **A2A**
(agent-to-agent). Everything else — Agent Cards, SKILL.md, Prompty, Agentverse
manifests, ERC-8004, x402 — is a compile target, not a source format.

ONE's position: author in Markdown, compile to the [6-dimension ontology](one-ontology.md),
fan out to every registry the ecosystem expects. The source format is ours;
the emission is theirs.

## The Verdict

| Standard | Layer | ONE's stance |
|----------|-------|-------------|
| **AGENTS.md** | Authoring (repo) | **Adopt.** One file at repo root; symlink every IDE variant to it. |
| **MCP** | Interop (tools) | **Emit.** Any unit with `.on()` handlers compiles to an MCP tool manifest. |
| **A2A Agent Card** | Interop (discovery) | **Emit.** Static JSON at `/.well-known/agent-card.json`. Never hand-authored. |
| **SKILL.md** | Authoring (capability) | **Adopt as format.** Minimal frontmatter (`name`, `description`) aligns with our `.agent.md`. |
| **Prompty `.prompty`** | Authoring (agent) | **Align frontmatter keys.** Don't adopt MS runtime. Schema hedge only. |
| **Agentverse manifest** | Interop (Fetch.ai) | **Emit.** Bridge via `agentverse-bridge.ts` (118 LOC), no Python sidecar. |
| **ERC-8004** | Identity (Ethereum) | **Skip.** We're on Sui (Phase 2 shipped 2026-04-18). See [sui.md](sui.md). |
| **x402** | Payments | **Adopt at edge.** Route paid endpoints through x402; facilitator abstracted. |
| **CrewAI / MS Agent YAML** | Authoring (framework) | **Emit if asked.** Not a source format. |
| **POML / LMQL** | Authoring | **Skip.** Verbose (POML) or dormant (LMQL). |
| **IBM ACP** | Interop | **Skip.** Merged into A2A 2025-09. |
| **OpenAI Assistants / AgentKit** | Runtime | **Secondary target.** Cannot export graphs; don't adopt as source. |
| **llms.txt / ai.txt** | Docs / crawler hints | **Low priority.** Emit if cheap. Not discovery protocols. |
| **NANDA AgentFacts / AGNTCY OASF** | Alt discovery | **Skip.** Research-tier; adoption thin vs A2A. |
| **AIRA** | — | **Skip.** Not a ratified standard. |

## Why Markdown Wins

Three reasons the authoring layer converged on plain Markdown:

1. **Diffable in git.** YAML/JSON configs drift silently; Markdown shows
   intent in PRs. AGENTS.md crossed 60k+ repos because it is just prose.
2. **Zero schema floor.** A 12-year-old authoring `hello.agent.md` needs
   two frontmatter fields (`name`, `description`) and a body. Everything
   else defaults.
3. **LLM-native.** Models are fluent in Markdown. The source format *is*
   the prompt when you unwrap the frontmatter.

The fight isn't Markdown vs YAML — it's **which frontmatter keys**. Prompty's
set (`name`, `model`, `tools`, `inputs`, `outputs`, `sample`) is the most
complete; ONE aligns to it defensively.

## The Three Settled Spines

**AGENTS.md.** Repo-level guidance. One file at root, symlinked to `CLAUDE.md`,
`.github/copilot-instructions.md`, `.cursor/rules/main.mdc`. ~20 tools auto-discover
it. No schema, pure prose. See [authoring.md](authoring.md).

**MCP.** Tool layer over JSON-RPC / Streamable HTTP. ~97M monthly SDK downloads,
~10k public servers, every major client. ONE emits MCP manifests from any unit
exposing `.on()` handlers. See [interop.md](interop.md).

**A2A 1.0.** Agent-to-agent protocol with task lifecycle and cross-vendor
delegation. Discovery via Agent Card at `/.well-known/agent-card.json`. ONE
emits the card statically at build time. See [interop.md](interop.md).

## What ONE Ships That The Landscape Lacks

1. **A Markdown-first agent compiler.** Every other framework parses YAML,
   code, or JSON. We parse `.agent.md` into the [6-dimension ontology](one-ontology.md).
   Shipped: `src/engine/agent-md.ts`.
2. **A substrate that learns routing.** Pheromone on paths beats any static
   registry. The standards describe discovery; we route by outcome. See
   [routing.md](routing.md), [loop.md](loop.md).
3. **Sui-native identity.** Deterministic wallets from `SUI_SEED + uid`.
   Lighter than ERC-8004, already in production, Phase 2 tests green
   (14 tests pass 2026-04-18).
4. **Zero-Python Agentverse bridge.** `agentverse-bridge.ts` proxies 2M AV
   agents as `av:*` units. No uAgents runtime required.

## Known Gaps (Standards, Not Ours)

1. **No multi-vendor Markdown agent manifest.** We define `.agent.md`; there's
   no standard to comply with. Prompty alignment is the best hedge.
2. **No standard for evals co-located with agents.** Prompty's `sample` is the
   closest; inadequate for real eval harnesses. We build our own.
3. **MCP discovery `.well-known/mcp.json`** is on the 2026 roadmap but not
   shipped. We publish an A2A Agent Card that references MCP endpoint URLs
   instead (current best practice).
4. **A2A `skills[]` I/O schemas** are natural-language-only today. A2A 1.1/2.0
   will tighten. Our Paths dimension is ready to receive structured targets.
5. **ERC-8004** is Draft; Sybil resistance thin. Our Sui identity is production;
   we watch but don't pivot.

## Predictions for the Next 6–12 Months

- **MCP ships `.well-known/mcp.json`.** Our compiler is designed so adding this
  is a two-line change.
- **A2A 1.1/2.0 tightens skill I/O schemas.** We already have structured Paths.
- **x402 Foundation ships alternate facilitators.** Our payment integration is
  behind a facilitator interface.
- **ERC-8004 v2 adds MCP-aware endpoint types.** We're already exposing MCP.
- **AAIF charters an "agent manifest" working group.** Prompty-alignment means
  we're an input, not an outsider.
- **ASI:One + A2A convergence.** Fetch.ai already ships A2A adapters; our AV
  special-casing shrinks.

## See Also

- [dictionary.md](dictionary.md) — canonical names (what each standard maps to)
- [one-ontology.md](one-ontology.md) — the 6-dimension IR
- [compile.md](compile.md) — md → IR → fan-out pipeline
- [authoring.md](authoring.md) — three Markdown source formats
- [interop.md](interop.md) — Agent Card, MCP, Agentverse emission
- [sui.md](sui.md) — identity + payments on Sui
- [adl-integration.md](adl-integration.md) — permission gates on top of emissions
