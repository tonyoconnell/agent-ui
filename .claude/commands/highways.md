Show the colony's proven paths — what works, what's failing, what's unknown.

## Steps

1. Get the world state:

```bash
curl -s http://localhost:4321/api/state | jq .
```

2. Report three sections:

### Highways (strength >= 50)
The colony's proven routes. These sequences work consistently.
Show: from → to, strength, traversals, revenue.

### Toxic (alarm > strength)
What's failing. These paths are being avoided.
Show: from → to, alarm, strength, why (if hypothesis exists).

### Frontiers
What the colony doesn't know yet.
Show: tag cluster, % unexplored, expected value.

3. If the server isn't running, read from `src/engine/loop.ts` and explain the pheromone dynamics.

4. The highways ARE the colony's intelligence. More highways = smarter routing. Zero highways = the colony is still learning. High alarm = something broke.
