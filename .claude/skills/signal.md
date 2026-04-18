# Signal — The Universal Primitive

One skill for every caller that emits a signal. The vocabulary here is shared by UI clicks, hook scripts, CLI commands, API routes, and substrate tasks. If you find yourself inventing a new signal shape, stop — this skill already has the pattern.

## The Shape (Frozen)

```ts
type Signal = { receiver: string; data?: unknown }
```

That's it. Two fields. `receiver` is always a string; `data` is untyped by design (see memory `feedback_signal_simplicity.md` — the type is frozen; never narrow it).

**Convention** for `data` (enforced by router readers, not by the type):

```ts
data = { tags?: string[], weight?: number, content?: unknown }
```

- **`tags`** — classification + routing key (e.g. `["build", "P0"]`)
- **`weight`** — pheromone deposit on delivery; positive marks, negative warns, omitted defaults to `+1`. Also the payment amount for L4 economic signals.
- **`content`** — the actual payload (rubric scores, task bodies, API responses)

## Receiver Naming (Canonical)

`receiver` matches `/^[a-zA-Z0-9:_-]+$/`, max 255 chars. The first colon-delimited segment is the **surface** — use a prefix so substrate queries can partition cleanly:

| Prefix     | Example                     | Who emits                                    | Skill         |
|------------|-----------------------------|----------------------------------------------|---------------|
| `ui:*`     | `ui:chat:copy`              | onClick handlers via `emitClick()`           | `/react19` + `.claude/rules/ui.md` |
| `hook:*`   | `hook:post-edit:ok`         | `.claude/hooks/*.sh` via `emit_signal`       | this skill    |
| `cli:*`    | `cli:signal:send`           | `oneie` CLI verb handlers                    | —             |
| `bridge:*` | `bridge:mirrorMark`         | `src/engine/bridge.ts` on Sui mirror         | `/sui`        |
| `l4:*`     | `l4:payment:settle`         | L4 economic loop (on-chain settlement)       | `/sui`        |
| `w4:*`     | `w4:verify:ok`              | W4 rubric gate outcomes                      | `/do` command |
| `unit:skill` | `scout:observe`           | substrate tasks (plain unit + skill name)    | `/typedb`     |

**Format is always `<surface>:<subject>:<action-or-outcome>`** — three segments for event-style signals, two for unit-task signals.

## The Four Outcomes (from `docs/dictionary.md`)

Every signal that closes a loop MUST land in one of these outcomes. This is Rule 1.

| Outcome     | When                            | What to emit                           | Weight    |
|-------------|---------------------------------|----------------------------------------|-----------|
| **result**  | Success                         | `mark(edge, depth)` — chain strengthens | `+1` (or higher with chain depth) |
| **timeout** | Slow but not a failure           | neutral — no signal or `weight: 0`      | `0`       |
| **dissolved** | Missing unit/capability        | `warn(edge, 0.5)` — mild                | `-0.5`    |
| **failure** | Agent produced nothing           | `warn(edge, 1)` — full                  | `-1`      |

**When to use `dissolved` vs `failure`:** `dissolved` means the path doesn't exist (unit not registered, capability missing, server down). `failure` means the path exists but the handler produced nothing. Both are negative pheromone; `dissolved` is milder because it's not the agent's fault — it's a config/infra issue.

## Emitters — by Caller Type

### UI click (React)

```tsx
import { emitClick } from '@/lib/ui-signal'

<Button onClick={() => emitClick('ui:chat:copy')}>Copy</Button>

// With payload (semantic clicks)
<Button onClick={() => emitClick('ui:chat:claim', {
  type: 'payment',
  payment: { receiver, amount, action: 'claim' }
})}>Claim</Button>
```

Auto-bound to `POST /api/signal`. See `.claude/rules/ui.md` for when `emitClick` is mandatory vs exempt.

### Hook script (bash)

```bash
source "$CLAUDE_PROJECT_DIR/.claude/hooks/lib/signal.sh"

emit_signal "hook:post-edit:ok" 1 "file=$FILE"
emit_signal "hook:post-edit:warn" -0.5 "file=$FILE issues=3"
```

Fire-and-forget with a 2-second max timeout. Tooling MUST NOT block on telemetry — if the dev server is down, the helper fails silently. That's a feature: failures of the dev server itself show up as `dissolved` outcomes on `hook:*` paths, so the substrate eventually learns which session states are healthy.

### API route (TypeScript)

```ts
import { signalSend } from '@/lib/signalSender'

await signalSend({
  receiver: 'w4:verify:ok',
  data: { tags: ['verify'], weight: 1, content: { passed: 320, total: 320 } }
})
```

### Substrate task handler

```ts
unit('scout').on('observe', async (data, emit, ctx) => {
  const obs = await lookAround()
  emit({ receiver: 'analyst:classify', data: { tags: ['obs'], content: obs } })
  return obs  // auto-replies to ctx.from if signal had replyTo
})
```

## What `POST /api/signal` Validates

The deterministic sandwich runs three pre-checks before the LLM/handler:

1. **UID format** — receiver matches `^[a-zA-Z0-9:_-]+$`, length 1-255
2. **Toxicity** — `isToxic(edge)` → dissolve if `r >= 10 && r > 2s && r+s > 5` (cold-start protected)
3. **ADL lifecycle** — retired/deprecated units get `410 Gone`
4. **ADL network** — sender not in receiver's `allowedHosts` → `403 Forbidden`
5. **Capability** — receiver has matching `offered` skill (TypeDB lookup, cached 5 min)

All five gates are async, cacheable, and deterministic. None hit the LLM.

## What Closes the Loop

When you emit `hook:post-edit:ok` with `weight: +1`:

1. `/api/signal` writes signal to TypeDB
2. `mark()` increments `path.strength` on the edge `sender → hook:post-edit`
3. Strength mirrored to Sui via `mirrorMark()` (fire-and-forget)
4. `/api/highways` surfaces the path if strength crosses threshold
5. Intent cache learns the `{sender → hook:post-edit}` association

When you emit `hook:post-edit:warn` with `weight: -0.5`:

1. Same signal write
2. `warn()` increments `path.resistance` on the edge
3. If `resistance > 2 × strength` and samples > 5, path becomes toxic and next attempt short-circuits

## Observability

- `/api/export/paths` — all edges with `{from, to, strength, resistance, traversals}`
- `/api/export/highways` — top N by strength
- `/api/export/toxic` — edges blocked by the toxicity rule
- `/api/signals?since=T` — signal history (used by `/see events`)

## Works With

| Skill         | Connects because                                                                   |
|---------------|------------------------------------------------------------------------------------|
| `/typedb`     | stores the pheromone (`path.strength`, `path.resistance`, `path.revenue`)          |
| `/sui`        | mirrors marks/warns on-chain via `bridge.ts` — every `+weight` can turn into revenue |
| `/react19`    | `emitClick()` lives in a React component tree; `ui:*` receivers start there         |
| `/astro`      | API routes that call `signalSend` are Astro endpoints                               |
| `/do`         | W1-W4 waves emit `w4:*` outcomes back into this vocabulary                          |
| `/close`      | closes tasks by emitting `mark-dims` signals with rubric scores                     |

## See Also

- `docs/dictionary.md` § "The Three Slots of Data" — canonical `{tags, weight, content}` convention
- `docs/routing.md` § Four Outcomes — mark/warn/dissolve/neutral semantics
- `docs/patterns.md` § Closed Loop — Rule 1 enforcement
- `src/engine/CLAUDE.md` § "Rule 1 — Closed Loop" — the code-level contract
- `.claude/rules/engine.md` § Rule 1 — auto-loaded for engine edits
- `.claude/rules/ui.md` — `ui:*` receiver format + when `emitClick` is mandatory
- `.claude/hooks/lib/signal.sh` — shared bash helper for hook scripts
- `src/lib/signalSender.ts` — TypeScript HTTP helper
- `src/lib/ui-signal.ts` — `emitClick()` implementation
- `src/pages/api/signal.ts` — the one receiver endpoint, all gates land here

---

**The substrate learns from whatever emits a signal. Skills, commands, hooks, clicks, mirrors — all the same shape, all the same loop.**
