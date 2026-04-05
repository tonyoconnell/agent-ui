# Docs Rules

**When docs reference code patterns, use the matching skill: `/typedb` for TQL, `/react19` for React, `/astro` for pages.**

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
| DSL.md | src/engine/substrate.ts, src/engine/one.ts |
| signal.md | src/engine/substrate.ts |
| one-ontology.md | src/schema/one.tql |
| metaphors.md | src/schema/skins.tql |

Docs describe. Code implements. Keep them in sync.

---

*Dense. Linked. Biological.*
