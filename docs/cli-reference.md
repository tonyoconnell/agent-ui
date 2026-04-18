---
title: oneie CLI reference
type: reference
version: 3.6.40-next
---

# `oneie` CLI Reference

17 verbs. 12 substrate + 4 deploy + 1 handoff.

**Install:** `npm install -g oneie` (or use `npx oneie`)
**Source:** `cli/src/commands/` in this repo.

**Deployment options:** `oneie deploy` works with all three models:
- **BaaS** — uploads agent to `api.one.ie`, no hosting needed
- **CF Pages** — deploys to developer's own Pages project (free compute)
- **Managed** — ONE hosts via Workers for Platforms (zero-config)

---

## Substrate verbs (12)

These map 1:1 to engine primitives. See [DSL.md](DSL.md) + [dictionary.md](dictionary.md).

| Verb | Usage | HTTP | Engine |
|---|---|---|---|
| `signal` | `oneie signal <receiver> [--data D] [--task T]` | POST `/api/signal` | `world.signal()` |
| `ask` | `oneie ask <receiver> [--data D] [--timeout MS]` | POST `/api/ask` | `world.ask()` |
| `mark` | `oneie mark <from->to> [--strength N]` | POST `/api/loop/mark-dims` | `persist.mark()` |
| `warn` | `oneie warn <from->to> [--strength N]` | POST `/api/loop/mark-dims` | `persist.warn()` |
| `fade` | `oneie fade [--rate R]` | POST `/api/decay-cycle` | `world.fade()` |
| `select` | `oneie select [--type T] [--sensitivity N]` | GET `/api/loop/stage` | `world.select()` |
| `recall` | `oneie recall [--subject S]` | GET `/api/hypotheses` | `persist.recall()` |
| `reveal` | `oneie reveal <uid>` | GET `/api/memory/reveal/:uid` | `persist.reveal()` |
| `forget` | `oneie forget <uid> --yes` | DELETE `/api/memory/forget/:uid` | `persist.forget()` |
| `frontier` | `oneie frontier <uid>` | GET `/api/memory/frontier/:uid` | `persist.frontier()` |
| `know` | `oneie know` | POST `/api/tick?loops=L6` | `persist.know()` |
| `highways` | `oneie highways [--limit N]` | GET `/api/loop/highways` | `world.highways()` |

## Deploy verbs (5)

| Verb | Usage | What |
|---|---|---|
| `init` | `oneie init` | Bootstrap a new ONE project (copy folders) |
| `agent` | `oneie agent` | Non-interactive ONE setup for AI agents |
| `deploy` | `oneie deploy [args]` | Deploy agents (BaaS → `api.one.ie`, Pages → CF, Managed → WfP) |
| `claw` | `oneie claw <agentId> [--dry-run]` | Generate NanoClaw config from `/api/claw` |
| `sync` | `oneie sync [tick\|fade\|evolve\|know\|frontier]` | POST `/api/tick` with optional scope |

## Handoff verb (1)

| Verb | Usage | What |
|---|---|---|
| `launch` | `oneie launch <agentUid> [--dry-run] [--chain sui\|base\|solana]` | POST to agent-launch `/v1/tokens`, emits `token-launched` signal |

Buy / sell / holders / delegation all live in [agent-launch](https://agent-launch.ai) — ONE is the substrate, agent-launch is the mint. See [launch-handoff.md](launch-handoff.md).

---

## Commerce verbs (8)

Economic primitives. Map to L4 (payment), L5 (evolution), and marketplace lifecycle. See [buy-and-sell.md](buy-and-sell.md) + [revenue.md](revenue.md).

| Verb | Usage | What |
|---|---|---|
| `pay` | `oneie pay <to> --from <uid> --task <id> [--amount N]` | Transfer payment between substrate units (L4 economic) |
| `hire` | `oneie hire <providerUid> <skillId> [--message <txt>]` | Hire agent for skill, creates group chat; returns 402 escrow if unpaid path |
| `bounty` | `oneie bounty <providerUid> <skillId> --price N --deadline N [--tags csv]` | Post a bounty with rubric thresholds (fit/form/truth/taste default 0.5) |
| `commend` | `oneie commend <agent-id>` | Raise agent success-rate (+0.1, cap 0.95), strengthen outgoing paths |
| `flag` | `oneie flag <agent-id>` | Lower agent success-rate (-0.15, floor 0.05), raise path resistance |
| `status` | `oneie status <agent-id> <active\|inactive>` | Set agent lifecycle status in TypeDB |
| `capabilities` | `oneie capabilities <agent-id> --task <name> [--price N]` | Add a skill capability to an agent |
| `publish` | `oneie publish <skillId> --name N --price N [--scope group\|public] [--tags csv]` | Publish capability to marketplace (operator+ required) |

## Observability verbs (4)

Read-only substrate introspection. All return JSON to stdout. See [speed.md](speed.md) + [routing.md](routing.md).

| Verb | Usage | What |
|---|---|---|
| `stats` | `oneie stats` | Substrate statistics: units (total/proven/at-risk), skills, highways, revenue, signals |
| `health` | `oneie health` | Health check: status (healthy/degraded), world state, version, uptime |
| `revenue` | `oneie revenue` | Revenue aggregates: GDP, total transactions, top earners (up to 20) |
| `export` | `oneie export <paths\|units\|skills\|highways\|toxic>` | Export substrate data as JSON array |

---

## Ergonomics (Cycle 2)

Profile management, shell completion, watch mode, dry-run, and self-diagnosis.

### `config` — Profile management

Named profiles let you switch between substrates (local dev, staging, production) without re-exporting env vars.

| Subcommand | Usage | What |
|---|---|---|
| `config list` | `oneie config list` | Print all named profiles from `~/.config/oneie/profiles/` |
| `config add` | `oneie config add <name> --url <u> --key <k>` | Create profile at `~/.config/oneie/profiles/<name>.json` |
| `config use` | `oneie config use <name>` | Set active profile in `~/.config/oneie/config.json` |
| `config rm` | `oneie config rm <name>` | Remove a profile (fails if it is the active profile) |

**Profile file shape** (`~/.config/oneie/profiles/<name>.json`):
```json
{ "baseUrl": "https://api.one.ie", "apiKey": "sk-..." }
```

### `completion` — Shell completion

Print a shell completion script and pipe it to the appropriate file.

```bash
oneie completion bash > ~/.bash_completion.d/_oneie
oneie completion zsh  > ~/.zsh/_oneie
oneie completion fish > ~/.config/fish/completions/oneie.fish
```

Supports `bash`, `zsh`, and `fish`. Source the file in your shell profile to activate.

### `--output` — Global output format

Control how results are printed. Set via the `ONEIE_OUTPUT` environment variable or per-command flag.

```bash
oneie highways --output json    # JSON array, pipeable to jq
oneie highways --output yaml    # YAML (requires no extra deps)
oneie highways --output table   # aligned table (default)
```

| Value | Description |
|---|---|
| `table` | Human-readable aligned columns (default) |
| `json` | Compact JSON array or object, stdout only |
| `yaml` | YAML block, stdout only |

Env override: `ONEIE_OUTPUT=json oneie stats` — applies to all verbs in a session.

### `agent --watch` — Live directory sync

Watch a directory for `.md` changes and auto-sync agent definitions to the substrate.

```bash
oneie agent --watch agents/          # watch agents/ directory
oneie agent --watch agents/donal/    # watch subdirectory only
```

Triggers the same logic as `oneie agent` on every file-save. Useful during authoring. Press `Ctrl-C` to stop.

### `--dry-run` — Preview without executing

Available on any mutating verb. Prints what would be sent to the substrate without making the call.

```bash
oneie signal chairman --data '{"tags":["chat"]}' --dry-run
oneie deploy --dry-run
oneie forget <uid> --yes --dry-run
```

Implemented via `hasDryRun()` from `args.ts` — returns `true` when `--dry-run` is present; callers skip the HTTP call and print a `[dry-run]` prefixed summary instead.

### `doctor` — Environment self-check

Runs four checks and exits `0` (all pass) or `1` (any fail). Output is machine-parseable for CI.

```bash
oneie doctor
```

**Checks (in order):**

| # | Check | Pass condition |
|---|---|---|
| 1 | **Config** | `~/.config/oneie/config.json` exists and is valid JSON |
| 2 | **API Key** | `ONEIE_API_KEY` / `ONE_API_KEY` env or config `apiKey` is non-empty |
| 3 | **Substrate reachable** | `GET <baseUrl>/health` returns HTTP 200 within 5 s |
| 4 | **TypeDB reachable** | `GET <baseUrl>/typedb/health` returns HTTP 200 within 5 s |

Example output:
```
[ok] Config        ~/.config/oneie/config.json
[ok] API Key       sk-***...abc
[ok] Substrate     https://api.one.ie  292ms
[ok] TypeDB        https://api.one.ie/typedb/health  318ms
```

Failures print `[fail]` with a short reason. Exit code `1` blocks CI pipelines without extra scripting.

---

## Config

Values read (in order): `ONEIE_API_KEY` env → `ONE_API_KEY` env → `~/.config/oneie/config.json`.
Base URL: `ONEIE_API_URL` env → config `baseUrl` → `https://api.one.ie`.

---

## See Also

- [DSL.md](DSL.md) — signal grammar
- [sdk-reference.md](sdk-reference.md) — `@oneie/sdk` surface
- [mcp-tools.md](mcp-tools.md) — 15 MCP tools wrapping these verbs
- [launch-handoff.md](launch-handoff.md) — the agent-launch contract
