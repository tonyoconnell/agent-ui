Create a new task in the ONE substrate.

The user will describe what they want done: `$ARGUMENTS`

## Steps

1. Parse the user's description into a task:
   - **id**: short kebab-case identifier (e.g., "signup-flow", "fix-auth")
   - **name**: human-readable name
   - **tags**: extract from context. Always include at least one of:
     - Type: `build`, `fix`, `test`, `review`, `deploy`, `refactor`, `docs`
     - Phase: `wire`, `onboard`, `commerce`, `intelligence`, `scale`
     - Priority: `P0` (critical), `P1` (important), `P2` (nice), `P3` (someday)
     - Domain: `frontend`, `infra`, `payments`, `integration`, `schema`
   - **unit**: which unit should handle it (default: "builder")

2. Create via the API if the server is running:

```bash
curl -s -X POST http://localhost:4321/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"id": "THE_ID", "name": "THE_NAME", "tags": ["build", "P1", "frontend"]}'
```

3. If the server isn't running, create the skill directly in TypeDB by adding it to the seed or import-roadmap data in `src/pages/api/tasks/import-roadmap.ts`.

4. Confirm what was created: id, name, tags, assigned unit.

5. Suggest what to do next: "Run `/tasks` to see it in context" or start working on it immediately.
