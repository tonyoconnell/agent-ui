Create a new task in the ONE substrate.

The user will describe what they want done: `$ARGUMENTS`

## Steps

1. Parse the user's description into a task:
   - **id**: short kebab-case identifier (e.g., "signup-flow", "fix-auth")
   - **name**: human-readable name
   - **value**: `critical` (can't ship without), `high` (important), `medium` (nice to have)
   - **phase**: `C1` (foundation), `C2` (collaboration), `C3` (commerce), `C4` (expansion), `C5` (analytics), `C6` (products), `C7` (scale)
   - **persona**: `ceo` (governance), `dev` (code/infra), `investor` (revenue), `gamer` (exploration), `kid` (learning), `freelancer` (contribution), `agent` (execution)
   - **tags**: extract from context. Include:
     - Type: `build`, `fix`, `test`, `review`, `deploy`, `refactor`, `docs`
     - Priority: `P0`, `P1`, `P2`, `P3`
     - Domain: `frontend`, `infra`, `payments`, `integration`, `schema`, `marketing`
   - **blocks**: task IDs this blocks (if any)
   - **exit**: what "done" looks like (one line)

2. Compute priority using the formula: `value + phase + persona + blocking`

3. Create via the API:

```bash
curl -s -X POST http://localhost:4321/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"id": "THE_ID", "name": "THE_NAME", "value": "high", "phase": "C1", "persona": "dev", "tags": ["build", "P1"], "blocks": [], "exit": "Tests pass"}'
```

4. Confirm what was created: id, name, priority score, formula, tags.

5. Suggest: "Run `/tasks` to see it ranked" or start working immediately.

## Priority Formula

```
VALUE:    critical=30, high=25, medium=20
PHASE:    C1=40, C2=35, C3=30, C4=25, C5=20, C6=15, C7=10
PERSONA:  ceo=25, dev=20, investor=15, gamer=15, kid=10, freelancer=10, agent=5
BLOCKING: +5 per task this blocks (max +20)

Min: 35 (medium + C7 + agent)
Max: 115 (critical + C1 + ceo + blocks 4)
```
