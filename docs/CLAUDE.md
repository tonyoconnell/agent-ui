# Docs Rules

**When docs reference code patterns, use the matching skill: `/typedb` for TQL, `/react19` for React, `/astro` for pages.**

## Substrate Learning

Docs are the training data. Every doc participates in the learning loop:

```
DSL.md + dictionary.md    → loaded as BASE CONTEXT in every Wave 2 decision
routing.md + patterns.md  → loaded as DOMAIN CONTEXT per task tags
rubrics.md                → defines quality scoring (fit/form/truth/taste as tagged edges)
speed.md                  → defines the benchmarks that make the learning rate possible
lifecycle.md              → defines the journey: register → signal → highway → crystallize
TODO-*.md                 → queues of signals, executed by /wave, self-checkoff on verify
```

**DSL.md and dictionary.md are non-negotiable.** Every TODO, every wave, every task decision loads them. They define the vocabulary the system speaks. If a doc uses a dead name, the learning diverges.

**ALWAYS use [TODO-template.md](TODO-template.md) when creating any TODO file.** Use `/todo` to create them. Every TODO MUST have: routing diagram, schema reference, DSL+dictionary+rubrics as source of truth, wave structure (W1-W4), task metadata (id/value/effort/phase/persona/blocks/exit/tags), rubric scoring in W4, self-checkoff on verify, See Also section. No exceptions.

Apply to `docs/*.md`

---

## Organization

| Category | Files | Purpose |
|----------|-------|---------|
| Core | dictionary.md, DSL.md, events.md, primitives.md | The names and primitives |
| Ontology | one-ontology.md, metaphors.md, ontology.md | The 6 dimensions |
| Implementation | tutorial.md, the-stack.md, people.md, groups.md | How to build |
| Strategy | strategy.md, one-protocol.md, integration.md | The play |
| Commerce | agent-launch.md, asi-world.md | The business |

README.md is the index. Link everything back to it.

---

## Key Concepts (post-collapse)

- Tasks are `.on()` handlers on units, not TypeDB entities
- Dependencies are `.then()` continuations, not TypeDB relations
- Trails are strength map entries, not TypeDB trail relations
- The runtime is the nervous system (fast loops L1-L3)
- TypeDB is the brain (slow loops L4-L7, knowledge, classification)
- `skill` entity in TypeDB replaces `task` entity (name + price only)

---

## Style

- Short sentences. Dense paragraphs.
- ASCII diagrams over prose for architecture
- Code blocks for all TypeScript/TypeQL
- Tables for mappings and comparisons
- `---` separators between major sections
- End with "See Also" linking related docs

---

## Metaphors

Six skins, one truth. Always map concepts:

```
Ant      Brain     Team      Mail      Water     Signal
colony   network   org       office    watershed network
ant      neuron    agent     mailbox   pool      receiver
trail    synapse   workflow  route     channel   frequency
```

---

## Code-Doc Link

| Doc | Code |
|-----|------|
| dictionary.md | Everything — the complete naming guide |
| DSL.md | src/engine/world.ts, src/engine/persist.ts |
| routing.md | src/engine/loop.ts, src/engine/persist.ts |
| metaphors.md | src/skins/index.ts, src/schema/skins.tql |
| sdk.md | Public API surface contract |

Docs describe. Code implements. Keep them in sync.

---

*Dense. Linked. Biological.*
