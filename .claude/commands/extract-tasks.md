Extract tasks from docs using Haiku (one-shot). Generates structured TODO-{docname}.md files.

Arguments: `$ARGUMENTS` (doc name(s) or "all")

## Steps

1. If no arguments, extract from these key strategy docs: `ONE-strategy.md`, `autonomous-orgs.md`, `task-management.md`
2. If a specific doc name is given, extract from that doc only
3. If "all", extract from every doc in docs/

## For each doc:

1. Read the doc content
2. Call Haiku with the extraction prompt (one-shot, ~$0.004/doc)
3. Write the result to `docs/TODO-{docname}.md`

The TODO format:

```markdown
# TODO: docname

- [ ] Task name here
  value: critical | high | medium
  phase: C1 | C2 | C3 | C4 | C5 | C6 | C7
  persona: ceo | dev | investor | gamer | kid | freelancer | agent
  blocks: comma-separated-task-ids
  exit: What done looks like
  tags: domain, action, priority
```

## After extraction:

1. Report: how many docs processed, how many tasks found per doc
2. Run the deterministic parser to verify: `scanTodos(docsDir)` from `src/engine/task-parse.ts`
3. Show the priority breakdown: count per phase, count per value, top 5 by priority score
4. Suggest: "Run `/sync-docs` to push these to TypeDB"

## Important:
- Haiku runs ONCE per doc. After that, edit the TODO-{docname}.md files directly.
- The parser is deterministic — regex + arithmetic, no LLM.
- If a TODO-{docname}.md already exists, skip unless user says "force" or "overwrite".
