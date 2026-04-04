# Docs Rules

Apply to `docs/*.md`

---

## Organization

| Category | Files | Purpose |
|----------|-------|---------|
| Core | signal.md, one-ontology.md, metaphors.md | The primitives |
| Implementation | tutorial.md, the-stack.md, agents.md, swarm.md | How to build |
| Strategy | strategy.md, one-protocol.md, integration.md | The play |
| Commerce | agent-launch.md, asi-world.md | The business |

README.md is the index. Link everything back to it.

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
| signal.md | src/engine/substrate.ts |
| one-ontology.md | src/schema/one.tql |
| framework.md | src/contexts/, src/skins/ |
| swarm.md | src/engine/one.ts |

Docs describe. Code implements. Keep them in sync.

---

*Dense. Linked. Biological.*
