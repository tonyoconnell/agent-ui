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

5. **Report with deterministic numbers (Rule 3):**
   ```
   Highways:    <N> paths >= 50 strength
   Hardened:    <N> paths promoted to permanent (L6)
   Toxic:       <N> paths with resistance > strength
   Frontiers:   <N> tag clusters <10% explored
   Top path:    <from> → <to>, strength <N>, traversals <M>, revenue $<X>
   Worst path:  <from> → <to>, resistance <N>, strength <M>, reason "<hypothesis>"
   ```
   The numbers ARE the intelligence. Strength compounds. Resistance calibrates.
