# Changelog — oneie CLI

## 3.7.0

- `SubstrateClient` in `@oneie/sdk` — 12 typed substrate methods (`signal`, `ask`, `mark`, `warn`, `fade`, `highways`, `recall`, `reveal`, `forget`, `frontier`, `know`, `select`)
- Typed `Outcome` discriminated union (`result | timeout | dissolved | failure`) with `latency: number`
- Scaffold dimension names fixed: `actors/`, `paths/`, `learning/` (dead names `connections`, `people`, `knowledge` retired)
- Telemetry emitter across CLI, SDK, MCP, Templates — every verb emits anonymous signal to api.one.ie; opt-out via `ONEIE_TELEMETRY_DISABLE=1`

## 3.6.40

- Previous release. See git log for details.
