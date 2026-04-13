Mark a task as complete in the ONE substrate and reinforce the pheromone path.

The user specifies which task: `$ARGUMENTS`

**GATED: W4 verification must pass before marking done.**

## W4 Gate — Verification (non-negotiable)

Before marking a task complete, verify the work is solid across **four quality dimensions**:

```bash
npm run verify     # biome check . && tsc --noEmit && vitest run
```

**Quality Rubric (fit/form/truth/taste):**
- **Fit (0.35):** Does the work answer the actual task? Does it unblock dependents?
- **Form (0.20):** Is the code shape right? Files organized? Types clean? Tests for new code?
- **Truth (0.30):** Are assumptions correct? Does it match schema/spec? No hallucinated APIs?
- **Taste (0.15):** Does it match the agent's style? (e.g., Sonnet patterns in RFC-era code)

**Golden zone:** All four dims ≥ 0.65 → score ≥ 0.85 → mark with full strength.
**Borderline:** Any dim < 0.5 → full warn(1). Do not mark done.

**If verification fails:** Fix it. Do not reinforce broken paths. False positives poison the pheromone.

This is the deterministic sandwich POST check. The substrate only learns from verified outcomes.

**Read: `docs/rubrics.md` — quality scoring is the same arithmetic as path strength.**

## Steps

1. If arguments provided, use them as the task/unit id.
   If not, infer from the current work context — what files were just edited? What was the last task discussed?

2. **Verify first** (run W4 gate above)
   - `npm run verify` must pass
   - If it fails → fix the issue, then try `/done` again
   - Never mark "done" on broken code

3. Call the complete endpoint:

```bash
curl -s -X POST http://localhost:4321/api/tasks/THE_ID/complete \
  -H 'Content-Type: application/json' \
  -d '{"from": "claude"}'
```

3. If the server isn't running, note what was completed for later recording. The pheromone will be applied when the system next boots.

4. Report:
   - What was completed
   - The path that was reinforced (from → to, +5.0 strength)
   - The unit's updated success rate
   - What the world suggests next (highest-strength attractive task)

5. If the task failed instead, call with `{"failed": true}` — this deposits resistance (+8.0) instead of strength (+5.0). Ask the user if it failed before marking success.
