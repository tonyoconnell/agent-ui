---
title: TODO — Lifecycle ONE: Stage 12 Subscribe (reverse edges + scope)
type: roadmap
version: 1.0.0
priority: Wire → Prove
total_tasks: 9
completed: 0
status: READY
updated: 2026-04-20
---

# TODO: Lifecycle ONE — Subscribe (Stage 12)

> **Time units:** tasks → waves → cycles. No calendar time.
>
> **Context:** `lifecycle-one.md` describes 13 stages (wallet → invite). Stages 0–11 and 13 are
> implemented. Stage 12 (Subscribe) is the only missing stage. The current `/api/subscribe`
> writes `has tag` attributes — no reverse routing edges, no scope control. This TODO lands the
> full subscribe primitive: reverse path edges (`tag:X → uid`), scope (`private` | `public`),
> SDK method, and CLI verb.
>
> **Source of truth:**
> - [lifecycle-one.md](lifecycle-one.md) — Stage 12 spec: reverse edges, scope, subscription economics
> - [DSL.md](DSL.md) — signal grammar (path creation, mark/warn)
> - [dictionary.md](dictionary.md) — canonical names
> - [rubrics.md](rubrics.md) — fit/form/truth/taste → mark in W4
> - [groups.md](groups.md) — scope enforcement (private = shared group; public = world member)
>
> **What this is NOT:** tag-based signal routing (when `receiver: "tag:seo"` auto-resolves to
> subscribers). That is Cycle 2 — routing changes touch the hot signal path and need a
> dedicated cycle. Cycle 1 delivers subscription declaration + discovery. Cycle 2 delivers routing.
>
> **Shape:** 2 cycles, four waves each.

---

## Routing

```
    signal DOWN                              result UP
    ──────────                               ─────────
    /do lifecycle-one-todo.md                mark(fit/form/truth/taste)
         │                                        │
         ▼                                        │
    ┌─ CYCLE 1: DECLARE ────────────────────┐     │
    │ scope attr on paths, reverse edges,   │─────┤ L1 signal
    │ /api/subscribe rewrite, SDK + CLI     │     │ L2 trail
    └──────────┬────────────────────────────┘     │
               ▼                                  │
    ┌─ CYCLE 2: ROUTE ──────────────────────┐     │
    │ tag-based signal resolution —         │─────┤ L3 fade
    │ receiver "tag:seo" → best subscriber  │     │ L4 economic
    └───────────────────────────────────────┘     │
```

---

## Schema reference

Subscriptions use existing `path` entities — no new TypeDB entity needed.

```
Forward edge (from listing):    unit ──tag──► tag:seo       (unit has tag "seo")
Reverse edge (from subscribe):  tag:seo ──path──► unit       from="tag:seo", to=uid
                                                              path has scope="private"|"public"
```

The `from` field of a subscription path is prefixed `tag:` so signal routing can detect it.
Scope is stored as a `path` attribute (already in `one.tql`). Private = only fires for
senders sharing a group with the subscriber. Public = fires for any world member.

---

## Cycle 1: DECLARE — Subscription storage + discovery

**Files:** `src/pages/api/subscribe.ts`, `packages/sdk/src/client.ts`,
`packages/cli/src/commands/subscribe.ts` (new), `packages/cli/src/index.ts`

**Why first:** Declaration is the prerequisite for routing. Can't route to subscribers
that don't exist in the graph.

---

### Tasks

- [ ] Rewrite /api/subscribe: scope + reverse edges
  id: api-subscribe-rewrite
  value: critical
  effort: medium
  phase: C1
  persona: dev
  blocks: sdk-subscribe-scope, cli-subscribe
  exit: POST /api/subscribe { uid, tags[], scope? } creates path entities
        (from="tag:{t}", to=uid, scope=scope||"public") via persist.ts flow().
        GET /api/subscribe?uid=X returns { uid, subscriptions: [{tag, scope}] }.
        GET /api/subscribe?tag=seo returns { tag, subscribers: [{uid, scope}] }.
  tags: api, subscribe, lifecycle, P0

- [ ] Add scope to SDK subscribe()
  id: sdk-subscribe-scope
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: cli-subscribe
  exit: sdk.subscribe({ receiver, tags, scope? }) passes scope to /api/subscribe.
        Default scope = "public". Telemetry tag updated to "stage:subscribe".
  tags: sdk, subscribe, lifecycle, P0

- [ ] New CLI verb: oneie subscribe
  id: cli-subscribe
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: `oneie subscribe <tags...> [--scope private|public] [--uid <uid>]`
        Calls /api/subscribe, prints result. Registered in SUBSTRATE_COMMANDS.
  tags: cli, subscribe, lifecycle, P1

- [ ] Register subscribe in CLI index
  id: cli-subscribe-register
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: "subscribe" added to SUBSTRATE_COMMANDS array in packages/cli/src/index.ts.
  tags: cli, subscribe, P1

- [ ] GET /api/subscriptions — list subscriptions for uid or tag
  id: api-subscriptions-list
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: GET /api/subscriptions?uid=X → { uid, subscriptions: [{tag, scope, strength}] }
        GET /api/subscriptions?tag=seo → { tag, subscribers: [{uid, scope, strength}] }
        Both scoped to public + caller's own private subscriptions.
  tags: api, subscribe, lifecycle, P1

### Cycle 1 Gate

```bash
curl -X POST localhost:4321/api/subscribe \
  -d '{"uid":"alice","tags":["seo","marketing"],"scope":"public"}'
curl "localhost:4321/api/subscriptions?uid=alice"
curl "localhost:4321/api/subscriptions?tag=seo"
```

```
[ ] POST /api/subscribe creates path entities (from="tag:seo", to="alice", scope="public")
[ ] GET /api/subscriptions?uid=alice returns seo + marketing
[ ] GET /api/subscriptions?tag=seo returns alice
[ ] sdk.subscribe({ receiver: "alice", tags: ["seo"], scope: "private" }) works
[ ] oneie subscribe seo marketing --scope public -- prints subscription record
[ ] 1614+ tests pass
```

---

## Cycle 2: ROUTE — Tag-based signal resolution

**Files:** `src/pages/api/signal.ts`, `src/engine/persist.ts`, `src/pages/api/ask.ts`

**Depends on:** Cycle 1 — subscriptions must exist in the graph.

**What changes:** When a signal arrives with `receiver: "tag:seo"`, the signal handler
resolves the tag to the best scope-matching subscriber rather than failing with "unit not found".

---

### Tasks

- [ ] persist.ts: tag-subscriber resolution
  id: persist-tag-resolve
  value: critical
  effort: medium
  phase: C2
  persona: dev
  blocks: api-signal-tag-route
  exit: `resolveTagSubscriber(tag, senderUid)` queries paths where
        from="tag:{t}", filters by scope (private: sender+subscriber share a group;
        public: no filter), returns uid sorted by path strength.
  tags: engine, subscribe, routing, P0

- [ ] /api/signal: route tag receivers to subscribers
  id: api-signal-tag-route
  value: critical
  effort: medium
  phase: C2
  persona: dev
  blocks: api-ask-tag-route
  exit: When receiver starts with "tag:", call resolveTagSubscriber() to find the
        best match, then forward the signal. If no subscriber found, dissolve with
        { dissolved: true, reason: "no-subscriber" }. mark() on success, warn(0.5) on dissolved.
  tags: api, signal, subscribe, routing, P0

- [ ] /api/ask: same tag resolution
  id: api-ask-tag-route
  value: high
  effort: low
  phase: C2
  persona: dev
  exit: Same resolveTagSubscriber() logic as /api/signal but for blocking ask.
  tags: api, ask, subscribe, routing, P1

- [ ] Tests: subscribe routing
  id: test-subscribe-routing
  value: critical
  effort: medium
  phase: C2
  persona: dev
  exit: Test file covers: public subscriber receives tag signal, private subscriber
        only receives from shared-group sender, dissolved when no subscriber exists,
        mark/warn pheromone on subscription path, strength-ranked subscriber selection.
  tags: test, subscribe, routing, P0

### Cycle 2 Gate

```bash
# After alice subscribes to "tag:seo" (scope: public)
curl -X POST localhost:4321/api/signal \
  -d '{"receiver":"tag:seo","data":{"content":"audit my site"}}'
# Should route to alice and mark the tag:seo → alice path
```

```
[ ] Signal to "tag:seo" routes to strongest subscriber
[ ] Private subscriber only receives from group-mates
[ ] No subscriber → dissolved signal
[ ] Subscription path strength accumulates on delivery
[ ] 1630+ tests pass (new subscribe routing tests added)
```

---

## Status

- [ ] **Cycle 1: DECLARE** — subscription storage + reverse edges + SDK + CLI
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Edits (Sonnet × 4)
  - [ ] W4 — Verify (Sonnet × 1)
- [ ] **Cycle 2: ROUTE** — tag-based signal resolution
  - [ ] W1 — Recon (Haiku × 3)
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Edits (Sonnet × 3)
  - [ ] W4 — Verify (Sonnet × 1)

---

## See Also

- [lifecycle-one.md](lifecycle-one.md) — Stage 12: Subscribe — the spec
- [DSL.md](DSL.md) — signal grammar, path creation
- [dictionary.md](dictionary.md) — canonical names
- [rubrics.md](rubrics.md) — quality scoring
- [groups.md](groups.md) — scope enforcement (private/public group membership)
- [one/platform-baas-todo.md](platform-baas-todo.md) — Cycle 4: sell/buy/invite shipped

---

*Subscribe is how agents open their aperture. Private by default, public by choice.
Tag edges compound — the more subscribers a tag attracts, the more competitive it becomes.*
