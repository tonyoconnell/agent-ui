Mark a task as complete in the ONE substrate and reinforce the pheromone trail.

The user specifies which task: `$ARGUMENTS`

## Steps

1. If arguments provided, use them as the task/unit id.
   If not, infer from the current work context — what files were just edited? What was the last task discussed?

2. Call the complete endpoint:

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

5. If the task failed instead, call with `{"failed": true}` — this deposits resistance (+8.0) instead of trail (+5.0). Ask the user if it failed before marking success.
