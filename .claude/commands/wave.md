Run the next wave of a cycle-based TODO. Arguments: `$ARGUMENTS` (TODO filename, e.g., `TODO-rename.md`)

## How It Works

Read the TODO file from `docs/$ARGUMENTS`. Find the current cycle and wave by scanning the Status section for the first unchecked `- [ ]` wave entry.

## W0 — Baseline (before first wave of a cycle)

If this is Wave 1 (first wave of a new cycle), run the baseline check first:

```bash
bun run verify   # biome check . && tsc --noEmit && vitest run
```

Record the result: how many tests pass, any known failures.
If baseline fails, fix it before starting the cycle. Don't build on broken ground.

---

## Wave Execution

### Wave 1 — Recon (Haiku, parallel)

1. Read the TODO's Wave 1 section for the current cycle
2. Spawn ALL recon agents **in a single message** using the Agent tool with `model: "haiku"`
3. Each agent reads one file and reports dead names / findings with line numbers
4. Hard rule for each agent: "Report verbatim. Do not propose changes. Under 300 words."
5. Collect all reports
6. Mark Wave 1 complete in the Status section (change `- [ ]` to `- [x]`)

### Wave 2 — Decide (Opus, main context)

1. You ARE the decider. Do not delegate this wave.
2. Read all Wave 1 reports + the source-of-truth doc referenced in the TODO
3. For each finding, decide: **Act** (produce anchor + new text) or **Keep** (it's an exception)
4. Output the diff specs in the format the TODO specifies:
   ```
   TARGET:    docs/foo.md
   ANCHOR:    "<exact old text>"
   ACTION:    replace
   NEW:       "<new text>"
   RATIONALE: "<one sentence>"
   ```
5. Mark Wave 2 complete

### Wave 3 — Edits (Sonnet, parallel)

1. Read the diff specs from Wave 2
2. Spawn ALL edit agents **in a single message** using the Agent tool with `model: "sonnet"`
3. Each agent gets: file path, anchors, replacements, and the rule:
   "Use Edit with exact anchor as old_string. Do not modify anything else. If anchor doesn't match, report dissolved."
4. Collect results — mark successful edits, warn on anchor mismatches
5. Re-spawn dissolved agents once with corrected anchors (read the file first to find the right anchor)
6. Mark Wave 3 complete

### Wave 4 — Verify (Sonnet, single)

1. **Deterministic checks first** (before spawning the agent):
   ```bash
   bun biome check .              # lint + format
   bun tsc --noEmit 2>&1 | grep "error TS" | head -10    # type errors
   bun vitest run                  # test suite
   ```
   If any fail on files touched in W3, route the failure back to W3 (max 3 loops).

2. Spawn ONE verification agent using Agent tool with `model: "sonnet"`
3. Agent reads all files touched in this cycle and checks consistency per the TODO's verify checklist
4. Agent also verifies: no regressions (baseline tests still pass), new tests if new functionality
5. If clean → mark Wave 4 complete → mark cycle complete
6. If inconsistencies → spawn micro-edit agents (Wave 3.5) → re-verify
7. Max 3 verify loops. If still dirty after 3, halt and report to user.

## After Each Wave

1. Update the TODO's Status section (mark the wave `[x]`)
2. Report what happened: how many agents spawned, results vs dissolved vs timeout
3. If all 4 waves of a cycle are complete, report: "Cycle N complete. Run `/wave $ARGUMENTS` for next cycle."
4. If all cycles complete, report: "All cycles complete. Run gate verification commands."

## Rules

- **Never skip Wave 2.** Understanding is not delegable.
- **Always spawn Wave 1 and Wave 3 agents in a SINGLE message** — this is how you get parallelism.
- **Wave 4 max 3 loops.** If it keeps finding issues, the Wave 2 decisions were wrong. Stop and escalate.
- **Update the TODO file** as you go. The Status section is the source of truth for progress.
- If no `$ARGUMENTS` given, look for the most recently modified `docs/TODO-*.md` file (excluding TODO-template.md).
