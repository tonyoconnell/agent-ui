# TODO: Fill the Gaps

Subtract, don't add. 1361 lines across 14 engine files. 755 are dead weight.
The goal: fewer files, less code, one vocabulary, TypeDB actually decides.

---

## Phase 1: Archive (−755 lines from active codebase)

Move to `src/engine/archive/`. Not lost, just out of the way.

- [ ] Archive `world.ts` (174) — duplicate of substrate.ts, throws on missing, wrong arrow
- [ ] Archive `unit.ts` (104) — duplicate of substrate.ts unit, uses `receive`/`payload`/`callback`
- [ ] Archive `colony-patterns.ts` (357) — re-implements TQL in TypeScript. TypeDB does this.
- [ ] Archive `agent.ts` (54) — class-based OOP, pre-substrate
- [ ] Archive `runtime.ts` (26) — class-based OOP, throws on missing
- [ ] Archive `envelope.ts` (20) — old envelope factory
- [ ] Archive `types.ts` (20) — old Envelope type

Clean `index.ts` to what survives:

```typescript
export { world } from "./one"
export type { World } from "./one"
export { colony, unit } from "./substrate"
export type { World, Unit, Signal, Emit } from "./substrate"
export { persisted } from "./persist"
export { llm, anthropic, openai } from "./llm"
export { asi } from "./asi"
export { agentverse } from "./agentverse"
```

**Result**: 14 active files → 7. 1361 lines → ~606. One Signal. One World. One arrow `→`. Nothing lost — git history + archive folder if you ever need to look back.

---

## Phase 2: Connect (5 lines changed)

`one.ts` uses `world()`. Should use `persisted()`. That's the entire gap between in-memory toy and durable substrate.

```diff
- import { colony, unit, type World, type Unit } from './substrate'
+ import { type Unit } from './substrate'
+ import { persisted, type PersistedColony } from './persist'

- export interface World extends World {
+ export interface World extends PersistedColony {

- const net = world()
+ const net = persisted()
```

**Result**: `world()` is durable. Restart = resume. Zero new files.

---

## Phase 3: Fix zero-returns (4 lines)

- [ ] `agentverse.ts:63` — `throw e` → swallow + `net.warn(edge)` 
- [ ] `asi.ts:69` — timeout uses `mark` with `:resistance` suffix → use `warn()`

**Result**: Signal dissolves, group continues. Everywhere.

---

## Phase 4: Plug asi into suggest_route()

`asi.ts` already follows highways, falls back to LLM, marks outcomes. It just doesn't read from TypeDB's `suggest_route()`.

- [ ] When confidence is low, call `callFunction('suggest_route', ...)` instead of raw LLM prompt
- [ ] That's it. No new file. asi + persist + suggest_route() = the router.

**Result**: TypeDB decides routing. The loop described in every doc is real.

---

## Phase 5: Bootstrap

- [ ] `.env.example` (5 vars)
- [ ] `scripts/bootstrap.sh` — load `one.tql` schema + `seed.tql` data
- [ ] `npm run bootstrap` in package.json

**Result**: `npm run bootstrap && npm run dev` works.

---

## Not now

Features, not simplification. Add when there's a running system to add them to:

- **Agent evolution** — `needs_evolution()` → prompt rewrite. Add when signals flow.
- **Crystallize** — highway → hypothesis → frontier → objective. Add when pheromone exists.
- **Classify tick** — write inferred attributes back. Add when router generates real data.
- **skins.tql / sui.tql** — design docs until proven otherwise.
- **Gateway worker** — document where it lives. Don't build infra before substrate works.

---

## Summary

| Phase | What | Lines |
|-------|------|-------|
| 1. Archive | Move 7 files to archive, clean index | −755 active |
| 2. Connect | `world()` → `persisted()` | ~5 changed |
| 3. Zero returns | Fix 2 throw sites | ~4 changed |
| 4. Router | Wire asi to `suggest_route()` | ~10 changed |
| 5. Bootstrap | .env + script | ~30 new |

**Net: −700 lines.** The system gets simpler because you remove the confusion, not because you add the missing pieces. The missing pieces arrive naturally once the substrate is clean and connected.
