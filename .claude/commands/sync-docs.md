Run the doc-scan sync loop. This scans all `docs/*.md` files, extracts TODOs/gaps/checkboxes, syncs them to TypeDB as skills, reads pheromone weights back, and regenerates `docs/TODO.md` ranked by weight.

## Steps

1. **Scan** — Read `src/engine/doc-scan.ts` and run `scanDocs()` logic against `docs/`
2. **Report** — Show what was found: total items, by priority, by source doc
3. **Sync** — Call `POST /api/tasks/sync-docs` (or simulate the TypeDB writes if server isn't running)
4. **Rank** — Show items ranked by pheromone weight (strength - resistance)
5. **Update** — Confirm TODO.md was regenerated from TypeDB state

If the dev server isn't running, do a dry run: scan docs, show the extracted items grouped by priority, and write TODO.md locally without the TypeDB sync step.

After completing, suggest next actions based on the highest-ranked open items.
