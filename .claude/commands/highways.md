Show the world's proven paths — what works, what's failing, what's unknown.

## Steps

1. Get the world state:

```bash
curl -s http://localhost:4321/api/state | jq .
```

2. Report three sections:

### Highways (strength >= 50)
The world's proven routes. These sequences work consistently.
Show: from → to, strength, traversals, revenue.

### Toxic (resistance > strength)
What's failing. These paths are being avoided.
Show: from → to, resistance, strength, why (if hypothesis exists).

### Frontiers
What the world doesn't know yet.
Show: tag cluster, % unexplored, expected value.

3. If the server isn't running, read from `src/engine/loop.ts` and explain the pheromone dynamics.

4. The highways ARE the world's intelligence. More highways = smarter routing. Zero highways = the world is still learning. High resistance = something broke.
