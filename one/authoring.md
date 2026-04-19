# Authoring Agents in Markdown

**Two fields for a kid. Full frontmatter for an engineer. Same compiler.**

ONE supports three Markdown source formats, each at a different scope:

| Format | Scope | Frontmatter | Body |
|--------|-------|-------------|------|
| **AGENTS.md** | Repo-level guidance | None (optional) | Prose — project conventions |
| **SKILL.md** | Per-capability bundle | Minimal (`name`, `description`) | Skill instructions + assets |
| **`.agent.md`** | Per-agent definition | Prompty-aligned | System prompt |

## The Kid Path

One file. Two frontmatter fields. A sentence-to-a-paragraph body.

```markdown
---
name: alice
description: Greets people by name
---

You are Alice. When someone says hello, greet them warmly and ask their name.
```

Everything else defaults:
- `model` → platform default (currently `meta-llama/llama-4-maverick`)
- `tools` → safe starter set (web search, calculator)
- `group` → user's default world
- Sui wallet auto-derived from `SUI_SEED + name`

Compile: `oneie agent ./alice.agent.md` → live on TypeDB → reachable as `alice`.

Error messages point at the exact line with a suggestion, not a schema path:

```
✗ alice.agent.md:3
  description is empty. Example:
    description: Greets people by name
```

## The Engineer Path

Same file. Full frontmatter. Opt into every control.

```markdown
---
name: alice
description: Greets people by name
model: anthropic/claude-sonnet-4-20250514
group: marketing
tools:
  - web_search
  - calculator
inputs:
  name:
    type: string
    description: Person's name
  mood:
    type: string
    enum: [happy, neutral, sad]
    default: neutral
outputs:
  greeting:
    type: string
sensitivity: 0.6
allowed-tools: [web_search]   # Claude Code SKILL.md compatibility
skills:
  - name: greet
    price: 0.01
    tags: [social, onboarding]
sample:
  name: Bob
  mood: happy
---

system:
You are Alice. Match greeting warmth to the caller's mood.

user:
Greet {{name}} who is feeling {{mood}}.
```

Notes on the engineer fields:
- `inputs` / `outputs` use JSON Schema; ONE derives this from Zod at build time.
- `sensitivity` maps to routing weight: `weight = 1 + max(0, s-r) × sensitivity`.
- `skills` becomes TypeDB `skill` entities + `capability` relations (with price).
- `sample` runs as the W0 smoke test on every deploy.

## Frontmatter Schema (Prompty-Aligned)

| Field | Required | Default | Maps to |
|-------|----------|---------|---------|
| `name` | yes | — | Actor id, A2A Agent Card `name`, uAgent name |
| `description` | yes | — | A2A `description`, SKILL.md `description` |
| `model` | no | platform default | `unit.model` in TypeDB |
| `group` | no | user default | `group` membership in TypeDB |
| `tools` | no | safe starter | MCP tool list (resolved by name) |
| `inputs` | no | `{}` | JSON Schema for signal `data` |
| `outputs` | no | `{}` | JSON Schema for reply |
| `sensitivity` | no | `0.5` | Routing weight multiplier |
| `allowed-tools` | no | — | Claude Code SKILL.md compatibility |
| `skills` | no | `[]` | `skill` entities + `capability` relations |
| `channels` | no | `[web]` | NanoClaw webhook routing |
| `sample` | no | — | W0 smoke test payload |

Unknown keys are preserved and passed to the IR as `extra: Record<string, unknown>`.
This is deliberate — it lets customer extensions ride along without schema drift.

## AGENTS.md (Repo Scope)

At repo root. No frontmatter required. Prose describing project conventions,
commands, and guardrails. Auto-discovered by Codex, Cursor, Copilot, Claude
Code (via `CLAUDE.md` symlink), Gemini CLI, Junie, Zed, Aider, Windsurf, Devin,
Factory, goose, Warp, Amp, Augment.

The `AGENTS.md` at the root of this repo is the authoritative one. Every
IDE-specific file (`CLAUDE.md`, `.cursorrules`, etc.) is a symlink to it.

This is a settled standard. No schema to track. Just write clear prose.

## SKILL.md (Capability Scope)

Per-folder bundle. Frontmatter + instructions + optional runnable assets.
Native to Claude Code; ONE treats it as a compile target for capabilities
with executable payloads (scripts, JSON schemas, test fixtures).

```markdown
---
name: citation-audit
description: Check citation quality on a published article
allowed-tools: [Read, Grep, Bash]
license: MIT
---

# Citation Audit

## Steps

1. Read the article body.
2. For each `[n]` footnote, verify the source exists and is primary.
3. Report missing / broken citations.

## Assets

- `scripts/check-urls.ts`
- `schemas/citation.json`
```

Compile: SKILL.md becomes a `skill` entity in TypeDB with a `capability`
relation on whichever unit offers it. The body becomes `hypothesis` content
once the skill has a track record.

## Which Format When?

- **Always an `AGENTS.md`** at repo root. One per repo. Prose.
- **A `.agent.md` per agent.** This is the main authoring surface.
- **A `SKILL.md` when the capability has assets** (scripts, schemas, fixtures)
  beyond prompt text. For prompt-only skills, declare them inline in
  `.agent.md` under `skills:`.

## What Engineers Can Ignore

The frontmatter above looks long. In practice:

- 80% of agents ship with just `name` + `description` + body — the kid path.
- The 20% that need more typically add `model`, `tools`, and `skills[]`.
- `inputs`/`outputs`/`sample` matter only when the agent has an API contract.
- `allowed-tools` matters only when you want Claude Code's tool gating.

Every optional field has a sane default driven by the Group's policy. The
maximalist form above exists to show the surface — not to demand it.

## See Also

- [compile.md](compile.md) — what the parser does with what you write
- [interop.md](interop.md) — what gets emitted from the IR
- [dictionary.md](dictionary.md) — canonical field names
- [skill.md](skill.md) — ONE's skill taxonomy
- [one-ontology.md](one-ontology.md) — where your agent lives in the IR
