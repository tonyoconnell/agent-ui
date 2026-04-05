Run one growth cycle of the ONE substrate and report what happened.

## Steps

1. Trigger the tick:

```bash
curl -s http://localhost:4321/api/tick?interval=0 | jq .
```

(interval=0 forces immediate execution, bypassing the 60s gate)

2. Report the results:
   - **Cycle number**: which tick this was
   - **Highways**: top paths with strength (the colony's proven routes)
   - **Evolved**: how many agents had their prompts rewritten (L5)
   - **Crystallized**: how many paths were promoted to permanent knowledge (L6)
   - **Hypotheses**: what the substrate observed about itself (L6)
   - **Frontiers**: unexplored territory detected from tag gaps (L7)

3. If the server isn't running, explain what the growth loop does:
   - Select: picks next signal by pheromone weight
   - Signal: delivers it to a unit
   - Drain: processes the priority queue
   - Fade: decays trails (every 5 min)
   - Evolve: rewrites struggling agents (every 10 min, 24h cooldown)
   - Crystallize: promotes highways to knowledge (every hour)
   - Hypothesize: writes observations about strong/fading paths
   - Frontier: detects unexplored tag clusters

4. Suggest what's next based on the tick result.
