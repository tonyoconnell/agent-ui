Pick the highest-priority task from the ONE substrate and do it.

## Steps

1. Read tasks:
```bash
curl -s http://localhost:4321/api/tasks | jq '.tasks | sort_by(-.strength) | [.[] | select(.category != "repelled")] | .[0:5]'
```

2. Pick the best one (attractive > ready > exploratory, prefer P0, prefer high strength).

3. Tell the user: "Working on [name] ([tags]). Strength: [N]."

4. Do the work — read code, edit files, run tests, fix issues.

5. Verify with type check.

6. Mark done:
```bash
curl -s -X POST http://localhost:4321/api/tasks/SKILL_ID/complete \
  -H 'Content-Type: application/json' -d '{"from": "claude"}'
```

7. **Report with deterministic numbers (Rule 3):**
   ```
   Task:        <name> (<tags>)
   Picked:      strength <N>, priority <P>
   Tests:       <passed>/<total> pass (<ms>)
   Path:        <from> → <to>, +<strength>
   Unlocked:    <N> blocked tasks now ready
   ```
