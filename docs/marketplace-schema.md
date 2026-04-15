# Marketplace Schema Lock

> **Status:** LOCKED for TODO-marketplace.md cycles 1–3.
> **Schema delta:** zero. No new entities, no new relations, no new attributes.
> **Rule:** the 100-line ontology is stable forever. Marketplace extends via
> conventions on `signal.data` and `tag` values, not via schema mutations.

This doc is loaded as base context in every W2 decision alongside DSL.md and
dictionary.md. If a wave proposes a schema change, the change MUST land
here first with an explicit justification or be rejected.

---

## The Lock

**[`src/schema/one.tql`](../src/schema/one.tql) is frozen for the duration of
TODO-marketplace.md.** Every marketplace SKU, every bounty, every tenant tier,
every protocol-fee event maps to existing primitives below. If a feature cannot
fit, the feature is out of scope — not the schema.

| Marketplace need | Existing primitive | Convention |
|------------------|-------------------|------------|
| Agent seller | `actor` (aid, model, prompt, tag) | — |
| Human seller | `actor` with `actor-type="human"` | `tag="human"` also for discovery |
| SKU / skill | `thing` with `thing-type="skill"` + `price` | — |
| Data product | `thing` with `thing-type="service"` + `price` | `tag="data"` |
| Subscription | `thing` with `thing-type="service"` + `price` | `tag="subscription"` + recurring billing off-chain |
| Introduction / routing | `thing` with `thing-type="service"` + `price` | `tag="intro"` |
| Outcome / bounty | `signal` with `amount > 0` + bounty conventions on `data` | see **Bounty `data` contract** below |
| Capability offering | `capability(provider, offered)` + `price` | — |
| Provider reputation | `path(source: buyer, target: seller)` + `strength` / `resistance` | — |
| Hardened highway bundle | `thing` with `thing-type="skill"` + `tag="bundle"` + composition via `path(source:bundle, target:component-skill, tag:"contains")` | see **Bundle convention** below |
| Tenant / premium world | `group` with `group-type="world"` + `brand` carries tier prefix | see **Tenancy convention** below |
| Platform treasury | `actor` with `aid="treasury:one"` + `actor-type="world"` | receives 2% fee signals |
| Protocol fee event | `signal` with `sender=closing-unit`, `receiver=treasury:one`, `amount=fee` | emitted at same instant as Sui release |
| Rubric scoring | `path(source: seller, target: rubric-tag)` with `tag` ∈ {`fit`, `form`, `truth`, `taste`} | unchanged from existing rubric pattern |
| Tx audit trail | `signal.data.tx_hash` (string) | conventional; not queryable via index |
| Deadline | `signal.data.deadline` (ISO-8601 string) | conventional; queryable via `data` LIKE |
| Escrow lifecycle state | `signal.success` (boolean) + `signal.data.escrow_state` | see **Escrow state machine** below |
| Currency | all `price` / `amount` denominated in SUI (testnet → mainnet) | documented here, not typed |
| Claim on open bounty | second `signal` with `data.claims=<original-signal-id>` | `receiver=claimant-actor`, chains via `data` reference |

---

## Bounty `data` contract

All bounty signals encode payload in `signal.data` as JSON (string). The
**bounty wire format** is:

```json
{
  "kind": "bounty",
  "tags": ["legal", "irish-gdpr", "urgent"],
  "content": { "document": "...", "question": "..." },
  "price": 250,
  "rubric": { "fit": 0.8, "form": 0.6, "truth": 0.9, "taste": 0.6 },
  "deadline": "2026-04-16T12:00:00Z",
  "escrow_state": "locked",
  "tx_hash": "0x7a3b...",
  "claims": null
}
```

Fields marked `null` on post; filled on lifecycle transitions. **No fields
here become schema attributes.** All queries that need these fields use
TypeDB `LIKE` matches over `data`, or an off-chain indexed view in KV
(`workers/sync/index.ts` already hash-gates writes — add a `bounties.json`
export that parses on sync).

**Why not promote these to schema:** they are per-SKU-class metadata.
Adding them for bounties forces every non-bounty signal to carry nulls.
The 100-line promise trumps query performance; for performance, project
into KV.

---

## Escrow state machine

Encoded entirely in `signal.success` + `signal.data.escrow_state`, no new
attribute. Transitions:

```
  POST                  CLAIM                 VERIFY              SETTLE
  signal emitted ───► claim signal ───► rubric signal ───► mark() / warn()
  data.escrow=locked   data.escrow      data.escrow         success=true
  success=null         =claimed         =verifying          data.escrow=released
                       success=null     success=null         (or =refunded)
                                                             tx_hash=<sui-tx>
```

**Timeout path:** `durable-ask.ts` fires after `deadline`; emits refund
signal with `data.escrow_state="refunded"`, `success=false`. No schema
change — timeout is just another signal outcome.

**Why `success` alone is insufficient:** `success` is binary (close or
not). Escrow has 4 states. But `success` + `escrow_state` together form
the full state — and `escrow_state` is only meaningful for signals with
`amount > 0`, so it stays in `data`.

---

## Bundle convention

A hardened highway bundle is packaged as:

```
thing(tid="bundle:content-pipeline", thing-type="skill", price=500,
      tag=["bundle", "content", "hardened"])

path(source=bundle:content-pipeline, target=skill:brief,   tag=["contains", "step:1"])
path(source=bundle:content-pipeline, target=skill:draft,   tag=["contains", "step:2"])
path(source=bundle:content-pipeline, target=skill:edit,    tag=["contains", "step:3"])
path(source=bundle:content-pipeline, target=skill:publish, tag=["contains", "step:4"])
```

Bundle activation: signal with `receiver="bundle:content-pipeline"` triggers
a cascade of inner signals via `.then()` continuations on the providing
units — the bundle is a facade, the substrate routes the steps.

**No `composition` relation added.** `path` with `tag=["contains"]` is the
relation. Step ordering goes in the tag (`step:1`, `step:2` ...).

---

## Tenancy convention

Tiered worlds encoded in `group.brand` with tier prefix:

```
group(gid="world:oo-agency",   group-type="world", brand="premium:oo-agency")
group(gid="world:public",      group-type="world", brand="public:one")
group(gid="world:acme-ent",    group-type="world", brand="enterprise:acme")
```

Billing/quota enforcement lives in middleware (`src/lib/auth.ts` +
a new `src/lib/tenancy.ts`) reading the `brand` prefix — not in schema.

**Rejected:** adding `tag @card(0..)` to `group` for symmetry with
`actor`/`thing`. Symmetry is appealing but tags on groups have no
proven use case yet; premature generalization. Re-open if cycle 3 W2
surfaces a concrete need beyond tier.

---

## Treasury

Single actor:

```
actor(aid="treasury:one", actor-type="world", name="ONE Protocol Treasury")
```

Fee signals accumulate as incoming signals where `receiver=treasury:one`.
**No new entity** — treasury is an actor that happens to never act. Its
Sui address is derived from `SUI_SEED + "treasury:one"` via the same
`deriveKeypair(uid)` path every agent uses.

Querying total fees: `match $s isa signal, has receiver $r; $r has aid
"treasury:one"; $s has amount $a; get $a; sum $a;`

---

## What the lock forbids (cycle 1–3)

The following schema mutations are **out of scope**. If a wave produces a
spec that requires one, escalate rather than edit `one.tql`:

1. Adding `tag` to `group` — not yet justified; tier lives in `brand` prefix.
2. Adding `escrow-state` attribute to `signal` — lives in `data` JSON.
3. Adding `tx-hash` attribute to `signal` — lives in `data` JSON.
4. Adding `deadline` attribute to `signal` — lives in `data` JSON.
5. Adding `currency` attribute to `price` / `amount` — denominated in SUI by contract, documented here.
6. Adding `composition` / `contains` relation — use `path` with `tag="contains"`.
7. Adding a `bounty` entity — a bounty is a `signal` with `amount > 0` and `data.kind="bounty"`.
8. Adding a `subscription` relation — subscription is a `thing` with `tag="subscription"` + off-chain billing loop.
9. Adding a `fee` entity or relation — fees are signals to `treasury:one`.
10. Adding `tier` / `plan` attributes to `group` — encoded in `brand` prefix.

Every item on this list was considered and rejected in favor of conventions.
Rationale: each would solve a specific query nicely, but collectively they
would double the schema line count and fragment the ontology. The substrate's
power comes from having six dimensions, not twenty-six.

---

## Derived views (KV projections, not schema)

For performance, `workers/sync/index.ts` can project bounty-shaped signals
into KV for sub-10ms reads. These projections are derived, hash-gated, and
**not authoritative** — TypeDB remains truth.

| KV key | Projection | Refresh |
|--------|-----------|---------|
| `bounties.json` | open bounties (signals w/ `data.kind="bounty"`, `escrow_state="locked"`, `deadline > now`) | on signal mark, cron 1 min |
| `bundles.json` | `thing` w/ `tag="bundle"` + contained paths | on path mark, cron 1 min |
| `treasury.json` | fee signals last 24h + running total | on signal mark, cron 1 min |
| `tenants.json` | `group` by brand prefix | on group write, cron 1 min |

Schema changes would be needed only if TypeDB itself became the hot-read
path for marketplace queries. It shouldn't — that's what the three-layer
architecture (`TypeDB → KV → globalThis`) already solves.

---

## Migration checklist (zero migrations required)

Every cycle's W0 baseline includes:

```bash
# Assert schema is unchanged
diff src/schema/one.tql <(git show main:src/schema/one.tql)     # empty = locked
wc -l src/schema/one.tql                                         # 124 (current)

# Assert no TypeDB migration ran since cycle start
typedb query "match $e sub entity; get $e;" --count              # 3 entities (group, actor, thing, hypothesis)
typedb query "match $r sub relation; get $r;" --count            # 5 relations (hierarchy, path, capability, membership, signal)
```

If either assertion fails mid-cycle, halt the wave. A schema drift mid-TODO
poisons every subsequent `/do` load.

---

## When the lock expires

The lock applies to TODO-marketplace.md cycles 1–3. After cycle 3 GROW
completes:

- If all conventions held and performance is acceptable → extend the lock,
  document which conventions earned their keep.
- If any convention proved load-bearing *and* its JSON-in-`data` shape
  became a de-facto type → propose a schema PR with justification. A
  successful TODO cycle earns the right to propose; it doesn't grant the
  change.
- If the marketplace required a schema change cycle 1–3 couldn't avoid →
  retro: identify which primitive was genuinely missing from the six
  dimensions, not which query was inconvenient.

---

## See Also

- [src/schema/one.tql](../src/schema/one.tql) — the 100 lines (124 w/ comments)
- [src/schema/CLAUDE.md](../src/schema/CLAUDE.md) — schema directory rules
- [TODO-marketplace.md](TODO-marketplace.md) — the waves this locks
- [marketplace.md](marketplace.md) — strategy + SKU inventory
- [DSL.md](DSL.md) — signal grammar (always loaded)
- [dictionary.md](dictionary.md) — canonical names (always loaded)
- [naming.md](naming.md) — what's locked across ONE
- [one-ontology.md](one-ontology.md) — the 6 dimensions explained

---

*Schema lock. 100 lines stay 100 lines. Conventions carry the feature.*
