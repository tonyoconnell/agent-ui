---
title: Universal Backend via Signal Dispatch
type: architecture
version: 1.1.0
audience: developers building any backend (CRM, e-commerce, SaaS, marketplace)
---

# one/backend.md — Universal Backend

ONE is not just for agents. It is a **universal backend for anything** — CRM, e-commerce, SaaS, marketplace — because user-defined entities subtype `thing` and inherit isolation from the existing ontology.

**Principle:** The six dimensions + scope model collapse data isolation to one schema decision. Not "no threat model" — the threat model becomes one ontology check at the TypeQL layer instead of N ACL checks scattered across handlers.

**The four invariants:**
- Every entity is owned by a **group** (existing dimension)
- Every signal carries a **sender** (auto-derived from auth)
- Every record has a **scope** (`private` | `group` | `public`)
- Every query auto-filters by the sender's group memberships at the TypeQL layer

Cross-group reads return `[]`, not 403 — the query itself can't see other groups' data.

---

## The Pivot: Signals as CRUD + Commerce

Signals are the universal primitive. Extend them with `verb` — and they become a backend. **Signal is canonical; REST is sugar over signals.**

```
Agent-to-agent (today)
├─ signal('app', 'scorer', { content: 'analyze' })
│  → pheromone learns best scorer
│
CRUD (new — same primitive, verb in data)
├─ signal('app', 'contact', { verb: 'create', data: {...} })
│  → pheromone learns best contact handler
│
REST sugar (developer ergonomics)
├─ POST /api/contact { name: 'Alice' }
│  → SDK translates to signal('app', 'contact', { verb: 'create', data })
│  → identical wire path, identical pheromone
│
Commerce (same)
├─ signal('app', 'contact:enrich', { content: 'lookup linkedin' })
│  → pay when done (capability already on contact)
│
Learning (unified)
└─ L1-L7: all operations feed the same pheromone
   paths remember what works (agents + data handlers + queries)
```

No new architecture. One primitive, four surfaces, two interfaces (signal native, REST sugar).

---

## The Ontology Collapses the Threat Model

**Classic SaaS threat:**
```
Group A snoops on Group B via SQL query.
→ Need: row-level security, ACL checks, audit logs scattered across handlers
→ Result: complex, audited, still vulnerability-shaped (one missed check = leak)
```

**ONE's solution: isolation is a property of the query, not the handler.**

```
Every signal carries:
  sender (actor uid)            → auto-derived from Bearer token
  receiver (unit or entity)     → what is being operated on
  scope (private|group|public)  → existing dimension, not new
  → group derived from sender's memberships (existing TypeDB relation)

The schema-handler injects into every TypeQL query:
  match $e isa <entityType>,
    has scope $s,
    (owner: $g, owned: $e) isa ownership;
  $g isa group;
  (member: $sender, of: $g) isa membership;
  (Plus: $s == 'public' OR $g matches sender's groups OR
         ($s == 'private' AND $sender == created-by))
```

**Result:** Cross-group reads return `[]`, not 403. The query can't see other groups' data because the match clause won't bind. One ontology decision replaces N ACL checks.

**What this still requires:**
- The schema-handler must inject the scope/group filter on every query (one place to audit, not N)
- TypeDB role checks still gate writes (operator+ for create/update, ceo+ for schema)
- The signal sender must be authenticated (Bearer token → actor uid)

**What this gets you:**
- Adding a new entity type doesn't add a new ACL surface
- Forgetting to scope a query is a compile-time error (the helper requires it)
- Cross-group leaks become structurally impossible, not "audited away"

Three locked rules apply:
1. **Closed Loop** — every operation (create/read/update/delete/query) closes with an outcome
2. **Structural Time** — plan in tasks/waves/cycles (not minutes)
3. **Deterministic Results** — every verb returns structured outcomes + rubric scores

---

## The Six Dimensions as Data Model

User-defined entities **subtype `thing`** — they participate in all six dimensions automatically:

```typeql
# User schema in their group's namespace
define
contact sub thing,
  owns name, owns email, owns phone,
  has tag, owns scope,
  plays ownership:owned;

order sub thing,
  owns total, owns status,
  plays ownership:owned;
```

| Dimension | Role in Backend | Example |
|-----------|-----------------|---------|
| **Groups** | Workspaces, teams, orgs (tenancy boundary) | `group:acme-corp`, `group:alice:personal` |
| **Actors** | Users + APIs + agents | `human:alice`, `agent:scorer`, `api:shopify-app` |
| **Things** | Data entities (subtypes: contact, order, product, ...) | `contact:c-123`, `order:o-456` |
| **Paths** | Relationships + handler chains | `contact→account`, `app→contact:create` |
| **Events** | Signals + mutations + audit log | `signal:contact:create`, `signal:order:settle` |
| **Learning** | Patterns + hypotheses + frontiers | `hypothesis:high-value-customers`, `frontier:untapped-segments` |

**Every backend data model fits as subtypes of `thing` plus relations among them.** No parallel system. The pheromone, scope, role, and learning loops apply to user entities the moment they're defined.

---

## Verb Grammar (CRUD + Query + Aggregate)

```typescript
type SignalVerb = 
  | 'create'    // insert with conflict checking
  | 'read'      // fetch one by id
  | 'update'    // patch with version checking
  | 'delete'    // soft or hard (scope-dependent)
  | 'query'     // filter by match clause (full-text + structured)
  | 'count'     // cardinality of query result
  | 'aggregate' // sum/avg/max/min over result set

type CRUDSignal = {
  verb: SignalVerb
  entity: string              // 'contact', 'order', 'product' — subtype of `thing`
  id?: string                 // for read/update/delete
  data?: Record              // for create/update
  match?: Filter             // for query/count/aggregate
  schema?: string             // schema name (default: group's active schema)
  scope?: 'private'|'group'|'public'  // visibility (default: 'group')
  
  // Auto-filled by api.one.ie from Bearer token (NEVER trust client values)
  // sender — actor uid
  // group  — derived from sender's memberships (TypeDB relation)
}

type CRUDOutcome = {
  verb: string
  entity: string
  result?: any                 // created/updated/read object or query results
  created?: boolean            // for create/update
  deleted?: number             // for delete (count)
  matched?: number             // for query (cardinality)
  
  // Standard outcomes
  timeout?: boolean            // slow, not bad
  notfound?: boolean           // no match for id or query
  conflict?: string            // validation failed, duplicate, etc
  
  // Rubric (L4 learning)
  rubric?: {
    fit: number               // matches schema (0–1)
    form: number              // valid data (0–1)
    truth: number             // persisted to TypeDB (0–1)
    taste: number             // perf budget hit (0–1)
  }
  
  // Pheromone deposit
  marked?: boolean            // closed the loop? (triggers mark())
}
```

---

## Examples by Domain

### CRM

```typescript
const client = new SubstrateClient({ apiKey: 'one_...' })

// Create contact
const { result } = await client.ask('contact', {
  verb: 'create',
  entity: 'contact',
  data: {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    accountId: 'a-1',
    tag: 'prospect'
  }
})
// → { id: 'c-abc123', created_at: 1714081200, created_by: 'human:alice' }

// Query prospects
const { result: prospects } = await client.ask('contact', {
  verb: 'query',
  entity: 'contact',
  match: {
    accountId: 'a-1',
    tag: 'prospect',
    tag_not: 'contacted'
  }
})
// → [{ id, name, email, accountId, createdAt }, ...]
// Pheromone marks: query succeeded, contact handler is good

// Update lead score
for (const lead of prospects) {
  // Dispatch to scorer agent
  const { result: score } = await client.ask('scorer:lead', {
    contactId: lead.id,
    contact: lead
  })
  
  if (score) {
    // Update contact with score
    await client.signal('crm-app', 'contact', {
      verb: 'update',
      entity: 'contact',
      id: lead.id,
      patch: { leadScore: score.value }
    })
    await client.mark('crm-app→contact')
  }
}

// The substrate learns:
// - Prospect queries are common (route faster, cache them)
// - Which scorer agents succeed most (pheromone strength)
// - Contact→account relationships (hypothesis: high-account clusters)
// - Frontier: unexplored tag combinations
```

### E-commerce (Shopify Competitor)

```typescript
// Create product
const { result: product } = await client.ask('product', {
  verb: 'create',
  entity: 'product',
  data: {
    sku: 'TSHIRT-001',
    name: 'Blue T-Shirt',
    price: 24.99,
    inventory: 100,
    categoryId: 'cat-apparel'
  }
})

// Create order
const { result: order } = await client.ask('order', {
  verb: 'create',
  entity: 'order',
  data: {
    customerId: 'cust-alice',
    items: [{ productId: product.id, qty: 2 }],
    total: 49.98
  }
})

// Query top products (aggregate)
const { result: topSales } = await client.ask('product', {
  verb: 'aggregate',
  entity: 'product',
  match: { categoryId: 'cat-apparel' },
  aggregate: { sales: 'sum', avg_rating: 'avg' },
  orderBy: 'sales',
  limit: 10
})

// Pay for order (commerce)
await client.signal('checkout', 'payment:processor', {
  verb: 'settle',
  orderId: order.id,
  amount: order.total
})

// Pheromone learns:
// - Popular product queries (index these first)
// - Checkout success rate (tune payment processor selection)
// - Customer lifetime value patterns (hypothesis)
// - Unexplored category + price combinations (frontier)
```

### SaaS (Stripe-like)

```typescript
// Create account
const { result: account } = await client.ask('account', {
  verb: 'create',
  entity: 'account',
  data: {
    email: 'dev@startup.io',
    plan: 'pro',
    monthly_limit: 100000
  }
})

// Create API key
const { result: apiKey } = await client.ask('api_key', {
  verb: 'create',
  entity: 'api_key',
  data: {
    accountId: account.id,
    name: 'Production Key',
    scope: ['read_transactions', 'write_payments']
  },
  scope: 'private'  // never leak to logs
})

// Query usage
const { result: usage } = await client.ask('event', {
  verb: 'query',
  entity: 'event',
  match: {
    accountId: account.id,
    type: 'api_call',
    createdAt_gte: '2026-04-01'
  }
})

// Count usage
const { matched: callCount } = await client.ask('event', {
  verb: 'count',
  entity: 'event',
  match: {
    accountId: account.id,
    type: 'api_call',
    createdAt_gte: '2026-04-25'
  }
})

// Enforce rate limit
if (callCount > account.monthly_limit) {
  return { error: 'rate_limit_exceeded', retry_after: 3600 }
}

// Pheromone learns:
// - Usage patterns (hypothesis: accounts with 90%+ usage upgrade)
// - Rate limit enforcement overhead (taste dimension)
// - API key leak risk (warn paths that expose scope: 'private')
```

---

## How Pheromone Learns Data Patterns

**L1 — Signal routing (per call, ms)**
```
Create contact → routes to 'contact' handler
Query → ranks handlers by strength (fastest wins)
```

**L2 — Path marking (per closed loop, seconds)**
```
Query succeeded → mark(contact→query, fit: 1.0)
Create conflicted → warn(contact→create, fit: 0.5)
Update timeout → neutral (not the handler's fault)
```

**L3 — Decay (every 5 min)**
```
Success fades slowly (resistance 2x faster)
Failed handlers forgotten (stale paths fade)
```

**L4 — Economic signals (per payment, hourly)**
```
Contact handler slow (expensive latency) → cost increases
Query handler bad selectivity (returns 1M rows) → routing avoids it
```

**L5 — Agent evolution (every 10 min)**
```
Contact handler success rate < 50% → prompt rewrite
"Add an index on (accountId, tag) for faster prospect queries"
```

**L6 — Knowledge formation (every hour)**
```
Highway: contact→query is 99% strength (top query pattern)
Hypothesis: "Accounts with 50+ contacts have 3x higher churn"
```

**L7 — Frontier discovery (every hour)**
```
Frontiers: unexplored combinations
"We've queried contacts by (tag, email) and (tag, accountId)
but never (tag, createdAt_range, accountId) — opportunity"
```

---

## Multi-Group Isolation: Built-In, Not Bolted-On

**Classic threat:** Group A queries Group B's data.

**ONE's answer:** The query's match clause won't bind across groups.

```typescript
// Alice (group: acme-corp) queries:
await client.ask('contact', {
  verb: 'query',
  match: { tag: 'prospect' }
})

// schema-handler emits TypeQL (NEVER raw user input — always parameterized):
match
  $c isa contact, has tag 'prospect';
  $own (owner: $g, owned: $c) isa ownership;
  $g isa group;
  $sender isa actor, has uid 'human:alice';
  $mem (member: $sender, of: $g) isa membership;
  { $c has scope 'public'; }
    or { $c has scope 'group'; }
    or { $c has scope 'private'; $c has created-by 'human:alice'; };
get $c;
```

**Rows owned by other groups don't bind** — the `(member: alice, of: $g)` relation only matches Alice's groups, so `$c` can only resolve to entities Alice's groups own. Result returns `[]`. No error, no exception, no log entry.

### Isolation Per Dimension

| Dimension | Isolation Mechanism |
|-----------|-------------------|
| **Groups** | Membership relation gates everything; cross-group reads return empty |
| **Actors** | Actors visible to groups they're members of |
| **Things** | `ownership` relation + scope filter; cross-group entities unreachable |
| **Paths** | Strength/resistance scoped per group; federation requires explicit opt-in |
| **Events** | Signal `scope` field (existing): `private` (sender+receiver), `group` (members), `public` (cross-group) |
| **Learning** | `recall({federated: true})` filters by scope; private hypotheses never leak |

### What's still on the operator (you, not us)

- **Schema design:** if you make `contact.email` non-`scope`-aware, two members of the same group will see each other's emails (correct for CRM, wrong for personal address books). Scope is a per-attribute decision in some schemas.
- **Public scope:** entities with `scope: 'public'` ARE meant to leak across groups (marketplace listings, agent profiles). This is the correct behavior — don't accidentally mark sensitive data public.
- **Bearer token security:** the whole edifice rests on the Bearer token correctly identifying the sender. Token theft = identity theft. (Phase 1 keeps existing API key model; Phase 2 adds passkey-rooted tokens per `passkeys.md`.)

---

## Schema Definition (User-Extensible)

Each group defines their own schema — entities subtype `thing`:

```bash
curl -X POST https://api.one.ie/api/schema/acme-corp/define \
  -H "Authorization: Bearer $ONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "crm-core",
    "version": "1.0.0",
    "schema": "
      define
      
      contact sub thing,
        owns name,
        owns email,
        owns phone,
        owns lead-score,
        owns scope,
        has tag,
        plays ownership:owned,
        plays contact-of:contact;
        
      account sub thing,
        owns name,
        owns plan,
        owns scope,
        plays ownership:owned,
        plays contact-of:account;
        
      contact-of sub relation,
        relates contact,
        relates account;
    "
  }'
```

**Auto-generated per entity:**
- `signal('app', 'contact', { verb: 'create', data })` → parameterized `insert` with sender/group/scope auto-injected
- `ask('contact', { verb: 'query', match })` → parameterized `match` with isolation filter
- `signal('app', 'contact', { verb: 'update', id, data, _version })` → optimistic-locked update
- `signal('app', 'contact', { verb: 'delete', id })` → soft delete (sets `deleted-at`) or hard delete per schema policy

**Version history:** Every schema version stored as a `schema-version` thing in the `system` group. Migrations are deterministic — re-applying the same `version` is a no-op (hash-gated).

---

## Outcomes & Rubric (Deterministic Results)

Every operation returns outcomes, never exceptions:

```typescript
// Create
{ result: {...}, marked: true, rubric: { fit: 1, form: 1, truth: 1, taste: 0.98 } }
{ conflict: 'email-exists', marked: false, rubric: { fit: 0.5, form: 1, truth: 0, taste: 1 } }
{ timeout: true, rubric: { taste: 0.2 } }

// Query
{ result: [...], matched: 42, marked: true, rubric: { truth: 1, taste: 0.95 } }
{ result: [], matched: 0, marked: true }  // empty is valid
{ timeout: true, rubric: { taste: 0.1 } }

// Update
{ result: {...}, marked: true, rubric: { fit: 1, truth: 1, taste: 0.96 } }
{ notfound: true, marked: false, rubric: { fit: 0.5 } }
{ conflict: 'version-mismatch' }

// Delete
{ deleted: 1, marked: true, rubric: { truth: 1 } }
{ deleted: 0, notfound: true }
```

**Rubric dimensions:**
- **fit** — matches schema constraints (0–1)
- **form** — valid data, no nulls or type errors (0–1)
- **truth** — persisted to TypeDB (0–1)
- **taste** — latency budget met (0–1). `taste = 1 - (actual_ms / budget_ms)`, capped at 1

**Pheromone uses rubric:** each dimension feeds a separate learning signal. "contact→create is slow" (taste: 0.3) triggers optimization differently than "create validation fails" (fit: 0.5).

---

## Release Path

**Phase 0 (now):** Core signal router + governance ✅
- Six dimensions locked
- Role + scope checks
- Multi-tenant isolation

**Phase 1 (Q2 2026):** User-defined schemas + CRUD
- [ ] `POST /api/schema/:tenant/define` — schema upload
- [ ] Verb auto-routing (create/read/update/delete/query/count/aggregate)
- [ ] Conflict detection (duplicate email, FK violations)
- [ ] Version history + migrations
- [ ] TypeQL generation per schema + verb

**Phase 2 (Q3 2026):** Query optimization + learning
- [ ] L4-L7 analysis of data patterns
- [ ] Index recommendations ("add index on accountId + tag")
- [ ] Hypothesis extraction ("high-contact-count = churn risk")
- [ ] Query plan caching (top 100 queries per tenant)

**Phase 3 (Q4 2026):** Marketplace for data services
- [ ] Sell read access to data (privacy-respecting)
- [ ] Auction for compute (who processes this query fastest)
- [ ] Revenue split (data owner + processor)

---

## Comparison: ONE vs. Traditional BaaS

| Feature | ONE | Firebase | Supabase | Custom API |
|---------|-----|----------|----------|-----------|
| **Schema flexibility** | User-defined per tenant ✅ | Rigid (Firestore collections) | PostgreSQL schema | Custom |
| **Multi-tenant isolation** | Ontology-enforced | Firestore rules ⚠️ | Row-level security ⚠️ | Code review |
| **CRUD** | Signal verb + TypeQL | Document write/read | SQL (familiar) | Custom |
| **Learning** | Pheromone learns patterns | None | None | Custom |
| **Agent integration** | Native (same model) | Requires third-party | Requires third-party | Custom |
| **Query optimization** | Auto (hypothesis + frontier) | Manual indexing | Manual indexing | Custom |
| **Commerce** | Built-in (capability market) | Not supported | Not supported | Custom |
| **Threat model** | Ontology eliminates it | Rules (can fail) | RLS (audited, but complex) | Implementation risk |

---

## See Also

- `one-ontology.md` — six dimensions (the foundation)
- `dictionary.md` — canonical names (groups, actors, things, paths, events, learning)
- `routing.md` — signal flow + L1-L7 loops
- `buy-and-sell.md` — commerce verbs on top of data verbs
- `rubrics.md` — quality scoring (fit/form/truth/taste)
- `governance.md` — roles + scope + permission model
- `TODO-backend.md` — implementation waves

---

*One primitive. Four surfaces. Threat model deleted.*
