---
title: oneie CLI reference
type: reference
version: 3.6.40-next
---

# `oneie` CLI Reference

17 verbs. 12 substrate + 4 deploy + 1 handoff.

**Install:** `npm install -g oneie` (or use `npx oneie`)
**Source:** `cli/src/commands/` in this repo.

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

## Deploy verbs (4)

| Verb | Usage | What |
|---|---|---|
| `init` | `oneie init` | Bootstrap a new ONE project (copy folders) |
| `agent` | `oneie agent` | Non-interactive ONE setup for AI agents |
| `deploy` | `oneie deploy [args]` | Runs `bun run deploy` (full pipeline) |
| `claw` | `oneie claw <agentId> [--dry-run]` | Generate NanoClaw config from `/api/claw` |
| `sync` | `oneie sync [tick\|fade\|evolve\|know\|frontier]` | POST `/api/tick` with optional scope |

## Handoff verb (1)

| Verb | Usage | What |
|---|---|---|
| `launch` | `oneie launch <agentUid> [--dry-run] [--chain sui\|base\|solana]` | POST to agent-launch `/v1/tokens`, emits `token-launched` signal |

Buy / sell / holders / delegation all live in [agent-launch](https://agent-launch.ai) — ONE is the substrate, agent-launch is the mint. See [launch-handoff.md](launch-handoff.md).

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
