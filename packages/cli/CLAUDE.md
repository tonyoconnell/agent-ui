# CLI

Substrate orchestrator CLI. Distributed as `oneie` on npm. Runs substrate verbs against a live ONE instance.

**Context:** [DSL.md](one/DSL.md) — signal grammar the CLI emits. [dictionary.md](dictionary.md) — canonical verb names: signal/mark/warn/fade/follow/harden. [routing.md](routing.md) — L1-L7 loops the CLI triggers. [lifecycle.md](one/lifecycle.md) — register→signal→highway→harden; CLI commands map to each stage. [rubrics.md](rubrics.md) — fit/form/truth/taste; `/api/loop/mark-dims` is the CLI quality gate. [buy-and-sell.md](buy-and-sell.md) — EXECUTE and SETTLE verbs available via `signal` and `mark`. [revenue.md](one/revenue.md) — Layer 1 routing fees fire on every `signal` command. [speed.md](one/speed.md) — routing `<0.005ms`, mark `<0.001ms`; CLI calls add HTTP overhead. [patterns.md](one/patterns.md) — closed loop and zero-returns apply to every CLI command's outcome handling.

## Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point — routes argv to command or admin subcommand |
| `src/banner.ts` | ASCII banner + version display |
| `src/commands/signal.ts` | `signal` — POST signal to receiver (L1) |
| `src/commands/ask.ts` | `ask` — signal + wait for result (L1, blocking) |
| `src/commands/mark.ts` | `mark` — strengthen a path edge (L2) |
| `src/commands/warn.ts` | `warn` — weaken a path edge (L2) |
| `src/commands/fade.ts` | `fade` — decay all paths asymmetrically (L3) |
| `src/commands/highways.ts` | `highways` — list top weighted paths (L2/L6) |
| `src/commands/know.ts` | `know` — promote highways to permanent hypotheses (L6) |
| `src/commands/recall.ts` | `recall` — query hypotheses from TypeDB (L6) |
| `src/commands/reveal.ts` | `reveal` — full MemoryCard for a uid (L6) |
| `src/commands/forget.ts` | `forget` — GDPR erasure: delete all records for uid |
| `src/commands/frontier.ts` | `frontier` — unexplored tag clusters for a uid (L7) |
| `src/commands/select.ts` | `select` — probabilistic next unit from pheromone |
| `src/commands/sync.ts` | `sync` — fire full tick (all L1-L7 loops) |
| `src/commands/deploy.ts` | `deploy` — wraps `bun run deploy` pipeline |
| `src/commands/agent.ts` | `agent` — parse + sync agent markdown to TypeDB |
| `src/commands/claw.ts` | `claw` — generate NanoClaw config for an agent |
| `src/commands/launch.ts` | `launch` — launch agent on AgentVerse / substrate |
| `src/commands/init.ts` | `init` — scaffold a new ONE project |
| `src/lib/http.ts` | `apiRequest()` — base HTTP client for all commands |
| `src/lib/args.ts` | `parseArgs()`, `requireArg()` — argv helpers |
| `src/lib/config.ts` | Load `.env` / `one.config.json` — base URL, API key |
| `src/lib/detect.ts` | Auto-detect ONE instance (local vs remote) |
| `src/lib/agent-detection.ts` | Detect agent markdown files in project |
| `src/admin/index.ts` | `admin` subcommand router |
| `src/admin/sync.ts` | `admin sync` — copy monorepo files → `cli/` per manifest |
| `src/admin/build.ts` | `admin build` — tsc → `dist/` for npm publish |
| `src/admin/release.ts` | `admin release [patch\|minor\|major]` — bump + sync + publish |
| `src/admin/manifest.ts` | File manifest: which monorepo paths sync to `cli/` |
| `src/admin/monorepo.ts` | Monorepo path resolution helpers |
| `src/admin/list.ts` | `admin list` — show manifest entries |
| `src/admin/validate.ts` | Validate manifest entries exist before sync |
| `src/sync-agents.ts` | Batch sync all `agents/**/*.md` to TypeDB |
| `src/sync-ontology.ts` | Sync `src/schema/one.tql` snapshot to TypeDB |
| `src/clone-docs.ts` | Clone `docs/` into a new project scaffold |
| `src/clone-web.ts` | Clone `src/` (Astro app) into a new project scaffold |
| `src/copy-claude-config.ts` | Copy `.claude/` config into a new project |
| `src/create-org-profile.ts` | Create org actor + group in TypeDB |
| `src/create-user-profile.ts` | Create user actor in TypeDB |
| `src/utils/file-resolver.ts` | Resolve file paths relative to project root |
| `src/utils/installation-setup.ts` | Post-install setup wizard |
| `src/utils/launch-claude.ts` | Spawn `claude` CLI with project context |
| `src/utils/validation.ts` | Input validation helpers (uid, edge, receiver format) |

## Substrate Verbs

Commands map directly to the Six Verbs from `dictionary.md`:

| CLI command | Verb | Loop | API endpoint |
|-------------|------|------|-------------|
| `signal` | send | L1 | `POST /api/signal` *(stub — Cycle 2)* |
| `ask` | send + wait | L1 | `POST /api/signal` (blocking) *(stub — Cycle 2)* |
| `mark` | mark | L2 | `POST /api/loop/mark-dims` |
| `warn` | warn | L2 | `POST /api/loop/mark-dims` (negative strength) |
| `fade` | fade | L3 | `POST /api/decay-cycle` |
| `highways` | follow | L2/L6 | `GET /api/loop/highways` |
| `know` | harden | L6 | `POST /api/tick` (know step) |
| `recall` | — | L6 | `GET /api/hypotheses` |
| `reveal` | — | L6 | `GET /api/memory/reveal/:uid` |
| `forget` | — | — | `DELETE /api/memory/forget/:uid` |
| `frontier` | — | L7 | `GET /api/frontiers` |
| `select` | select | L1 | `GET /api/loop/stage` *(stage-marking, not path selection — verify wiring)* |
| `sync` | — | L1-L7 | `POST /api/tick` |
| `deploy` | — | — | wraps `bun run deploy` |

## Admin Commands

| Command | Purpose |
|---------|---------|
| `admin sync` | Sync monorepo files → `cli/` directory per manifest |
| `admin build` | Build TypeScript → `dist/` for npm |
| `admin release [patch\|minor\|major]` | Bump version, sync, publish to npm as `oneie` |
| `admin list` | Show manifest entries |
| `admin validate` | Check all manifest source paths exist |

## Loop Participation

The CLI is a thin HTTP client — it triggers loops on the substrate:

| CLI command | L1 | L2 | L3 | L4 | L5 | L6 | L7 |
|-------------|----|----|----|----|----|----|-----|
| `signal` / `ask` | ✓ | | | | | | |
| `mark` / `warn` | | ✓ | | | | | |
| `fade` | | | ✓ | | | | |
| `sync` (tick) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `know` | | | | | | ✓ | |
| `frontier` | | | | | | | ✓ |

## Key Patterns

Every command calls `apiRequest()` from `src/lib/http.ts`. Base URL from `ONE_API_URL` env var (default: `http://localhost:4321`). All commands print JSON to stdout. Errors surface as `{ error: message }` — never as stack traces.

```typescript
import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg } from "../lib/args.js";

export const name = "mark";
export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const edge = requireArg(args, 0, "edge (from->to)");
  const res = await apiRequest("/api/loop/mark-dims", {
    method: "POST",
    body: { edge, source: "cli" },
  }).catch((err: Error) => ({ error: err.message }));
  console.log(JSON.stringify(res, null, 2));
}
```

## See Also

- [DSL.md](one/DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — Six Verbs, canonical names
- [routing.md](routing.md) — L1-L7 loops the CLI triggers
- [lifecycle.md](one/lifecycle.md) — which stage each command belongs to
- [rubrics.md](rubrics.md) — quality scoring the CLI can post via mark-dims
- [buy-and-sell.md](buy-and-sell.md) — commerce verbs available in CLI
- [revenue.md](one/revenue.md) — Layer 1 fees on every signal command
- [speed.md](one/speed.md) — performance benchmarks the CLI observes
- [patterns.md](one/patterns.md) — closed loop: every CLI command should close its loop
