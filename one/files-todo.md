---
title: Files — docs/ → one/ rename + topic-first naming
type: roadmap
version: 1.0.0
priority: Wire → Prove
total_tasks: 18
completed: 0
status: ACTIVE
---

# TODO: Files — Folder Rename + Naming Convention

> **Goal:** rename `docs/` → `one/`, convert `TODO-*.md`/`PLAN-*.md`/`DECISION-*.md`
> to topic-first `*-todo.md`/`*-plan.md`/`*-decision.md`. Zero content change.
> Zero runtime change. History-preserving (`git mv`).
>
> **Spec:** [files.md](one/files.md) — the beautiful file structure.
> **Kanban work** is **deferred to [tasks-kanban-todo.md](tasks-kanban-todo.md)** —
> the `/tasks` view upgrade ships independently; does not block this rename.
>
> **Source of truth:** [files.md](one/files.md) (this TODO's spec),
> [dictionary.md](dictionary.md) — naming law,
> [rubrics.md](rubrics.md) — fit/form/truth/taste scoring,
> [template-todo.md](one/TODO-template.md) — wave pattern (note: the template file
> still lives at `docs/TODO-template.md` pre-migration; this TODO renames it).
>
> **Shape:** 1 cycle, 4 waves. Haiku recon → Opus decide → Sonnet edit → Sonnet verify.
>
> **Risk:** internal-link breakage across 255 md files + CLAUDE.md + scripts.
> `git mv` preserves history. All internal `docs/` → `one/` substitutions are
> reversible via `git revert`. No deploy, no schema, no on-chain change.

---

## Routing

```
W1 (Haiku, parallel ≥ 4)
  scan docs/*.md inventory        → file classification
  grep "docs/" across repo         → reference map
  grep TODO-template refs          → template dependents
  read scripts/sync-todos.ts       → glob patterns
        │
        ▼
W2 (Opus, single)
  lock rename map (exact paths)
  lock reference rewrite spec (regex)
  lock out-of-scope list (archive/, copy-reports/ — keep sub-tree intact)
        │
        ▼
W3 (Sonnet, parallel per operation)
  A: git mv docs/ one/
  B: batch rename TODO-*.md → *-todo.md inside one/
  C: batch rename PLAN-*.md → *-plan.md
  D: batch rename DECISION-*.md → *-decision.md
  E: sed rewrite in-file "docs/" → "one/" across one/**, CLAUDE.md, nested CLAUDE.md, scripts/
  F: update scripts/sync-todos.ts glob
        │
        ▼
W4 (Sonnet, verify)
  deterministic: bun run build, bun run test, biome, tsc
  semantic: grep -r "docs/" returns only intentional refs (archive blog links)
  semantic: /sync todos picks up renamed files
```

---

## Cycle 1 — Rename Tree

### Wave 1 — Recon (Haiku × 4, parallel, ≤ 300 words each, verbatim)

- [ ] W1.1 — Inventory `docs/*.md`: count, classify each as spec / plan / todo / decision / shipped / other; report file:line for any `title:` frontmatter.
  id: files-c1-w1-inventory
  persona: haiku
  exit: list of all 255 md files with classification + frontmatter snippet

- [ ] W1.2 — Grep all `docs/` references outside docs: `rg "docs/" --glob '!docs/**' -n`; report every file:line match.
  id: files-c1-w1-refs-code
  persona: haiku
  exit: every code/config reference to `docs/` path

- [ ] W1.3 — Grep `TODO-template.md` references across repo; find every caller that asserts the name.
  id: files-c1-w1-template-refs
  persona: haiku
  exit: every file that hardcodes `TODO-template.md`

- [ ] W1.4 — Read `scripts/sync-todos.ts`, `scripts/close-task.ts`, `scripts/ready-tasks.ts`; report glob patterns and any path assumption.
  id: files-c1-w1-scripts
  persona: haiku
  exit: verbatim quotes of glob/read lines with line numbers

### Wave 2 — Decide (Opus, main context, do not delegate)

- [ ] W2.1 — Produce exhaustive rename map: `docs/<old>.md → one/<new>.md` for every file from W1.1.
  id: files-c1-w2-rename-map
  persona: opus
  exit: 255-line map as JSON or TSV; all-caps and underscored names lowercased + kebabed

- [ ] W2.2 — Produce reference-rewrite spec: list of exact anchors + replacements for every reference in W1.2/W1.3/W1.4.
  id: files-c1-w2-ref-spec
  persona: opus
  exit: anchor/new pairs ready for Edit tool

- [ ] W2.3 — Lock exclusions: `one/archive/` and `one/copy-reports/` keep their subtree names; external URLs never rewrite.
  id: files-c1-w2-exclusions
  persona: opus
  exit: explicit keep-list

### Wave 3 — Edits (Sonnet, parallel by operation family)

- [ ] W3.1 — `git mv docs one` (single command, preserves blame).
  id: files-c1-w3-gitmv
  persona: sonnet
  exit: commit showing 255 renames; git log --follow still works

- [ ] W3.2 — Execute file-renames inside `one/` per W2.1 map (shell loop or per-file `git mv`).
  id: files-c1-w3-renames
  persona: sonnet
  exit: all `TODO-*.md`/`PLAN-*.md`/`DECISION-*.md` now topic-first

- [ ] W3.3 — Rewrite in-file `docs/` → `one/` references per W2.2.
  id: files-c1-w3-refs-docs
  persona: sonnet
  exit: every match in code/CLAUDE.md updated; external URLs untouched

- [ ] W3.4 — Rewrite in-doc cross-references (`[foo](TODO-foo.md)` → `[foo](foo-todo.md)`).
  id: files-c1-w3-refs-md
  persona: sonnet
  exit: internal markdown links resolve at new paths

- [ ] W3.5 — Update `scripts/sync-todos.ts`, `scripts/close-task.ts`, `scripts/ready-tasks.ts` glob patterns.
  id: files-c1-w3-scripts
  persona: sonnet
  exit: scripts glob `one/*-todo.md` not `docs/TODO-*.md`

- [ ] W3.6 — Update `CLAUDE.md` root + nested (`src/pages/CLAUDE.md`, `src/pages/api/CLAUDE.md`, etc.) path references.
  id: files-c1-w3-claude
  persona: sonnet
  exit: `grep -l "docs/" src/**/CLAUDE.md` empty

### Wave 4 — Verify (Sonnet, final gate)

- [ ] W4.1 — Deterministic: `bun run build` succeeds, biome clean, tsc clean (known-crash bug excepted per memory), vitest 320/320 or justified.
  id: files-c1-w4-deterministic
  persona: sonnet
  exit: all four gates green

- [ ] W4.2 — Semantic: `grep -r "docs/" . --exclude-dir=node_modules --exclude-dir=.git` returns only external/archive links.
  id: files-c1-w4-grep
  persona: sonnet
  exit: zero internal refs to `docs/`

- [ ] W4.3 — Semantic: `bun run scripts/sync-todos.ts` picks up renamed `one/*-todo.md` files.
  id: files-c1-w4-sync
  persona: sonnet
  exit: sync reports expected TODO count

- [ ] W4.4 — Rubric score (fit/form/truth/taste ≥ 0.65 each); append one line to `learnings.md`.
  id: files-c1-w4-rubric
  persona: sonnet
  exit: rubric > 0.65 and learning entry written

---

## Out of Scope (explicitly deferred)

- `/tasks` Kanban view upgrade (new columns, views, Things-style sidebar) → `tasks-kanban-todo.md` (new TODO, standalone)
- `one/todo.md` orchestrator file generation (priority ranker across all `*-todo.md`) → `tasks-kanban-todo.md`
- Content edits inside any doc (naming convention applies only to filenames, not prose)

## See Also

- [files.md](one/files.md) — the spec this TODO executes
- [TODO-rename.md](TODO-rename.md) — parallel rename (code primitives, not docs folder)
- [TODO-template.md](one/TODO-template.md) — wave pattern (renames to `one/template-todo.md` in W3)
- [dictionary.md](dictionary.md) — naming law
- [rubrics.md](rubrics.md) — scoring
