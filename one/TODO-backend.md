---
title: TODO-backend — Phase 1 Implementation (Schemas + CRUD)
cycle: 1
phase: construction
value: 12 features (schema / verb-router / conflict-detect / query-gen / version-history / isolation / mutations / settlement / audit-log / frontier / marketplace-prep / docs)
effort: 3 waves × 2 days = 6 days
persona: Backend Architects (W1/W2/W4), Full-Stack Engineers (W3)
blocks: nothing (new surface)
blockedBy: none
tags: [backend, core, architecture, phase1, Q2-2026]
exit: { passed: 24, failed: 0, rubric: { fit: >=0.9, form: >=0.9, truth: >=0.95, taste: >=0.85 } }
---

# TODO-backend — Phase 1 Implementation

**Goal:** Ship Phase 1 of universal backend: user-defined schemas, CRUD verbs, multi-tenant isolation by ontology, pheromone learns data patterns.

**Speed claim:** Developer registers → uploads schema → queries live, all in <10 min.

---

## Source of Truth

Before any code, load these docs:
- `one/backend.md` — the vision (signals as CRUD, ontology eliminates threat model)
- `one-ontology.md` — the 6 dimensions (groups, actors, things, paths, events, learning)
- `dictionary.md` — canonical names (verify no dead names in new code)
- `DSL.md` — the six verbs (signal, mark, warn, fade, follow, select)
- `routing.md` — L1-L7 loops (where does schema/CRUD learning fit?)
- `rubrics.md` — quality scoring (fit/form/truth/taste)
- `governance.md` — role + scope model (Permission = Role × Pheromone)

---

## Routing Diagram

```
Developer                    ONE Gateway                TypeDB
    │                             │                          │
    ├─ POST /schema/:id/define    │                          │
    │  (TypeQL schema)            │                          │
    │                    ─────────→ Validate schema          │
    │                             ├─ Compile to TQL         │
    │                             ├─ Gen CRUD functions     │
    │                    ←────────┤ Store schema version    → Insert schema record
    │                             │                          │
    │                             │                          │
    ├─ POST /api/contact          │                          │
    │  { verb: 'create', data }   │                          │
    │                    ─────────→ Scope check (tenant)     │
    │                             ├─ Role check (actor)     │
    │                             ├─ Conflict detect        │
    │                    ←────────┤ Route to handler    ─────→ Insert contact + audit
    │                             │                          │
    │                             │                          │
    ├─ POST /api/contact          │                          │
    │  { verb: 'query', match }   │                          │
    │                    ─────────→ Scope filter             │
    │                             ├─ Generate TypeQL   ─────→ Match + return
    │                    ←────────┤ Mark path          ─────→ Update strength
    │                             │                          │
    │                             │                          │
    └─ (L4-L7 ticks)             │                          │
       L6 highways               │                          │
       L7 frontier              │  ← Auto-hypothesize ─────→ Query learned patterns
       (learn patterns)         │     (every hour)           │
```

---

## Schema Reference (TypeDB Entities)

**What gets created in TypeDB:**

```
entity schema-version
  owns schema-id,
  owns tenant-id,
  owns version,
  owns created-at,
  owns created-by,
  owns typeql-def,
  owns status,  // 'active', 'deprecated', 'migrating'
  owns hash;    // FNV-1a to detect changes

entity entity-type  (from user schema)
  owns entity-name,  // 'contact', 'order', 'product'
  owns tenant-id,
  owns schema-id,
  owns attributes,   // JSON list of field names + types
  owns relations;    // JSON list of relationship targets

entity (contact | order | product | ... user-defined)
  owns id,
  owns created-at,
  owns created-by,
  owns updated-at,
  owns updated-by,
  owns _version,     // for conflict detection
  has tag,
  relates owned-by;

relation ownership
  relates entity,
  relates owner;

entity audit-log
  owns id,
  owns timestamp,
  owns actor-id,
  owns verb,         // 'create' | 'read' | 'update' | 'delete'
  owns entity-type,
  owns entity-id,
  owns changes,      // { before, after } for updates
  owns tenant-id,
  owns status;       // 'success', 'conflict', 'timeout'
```

---

## Wave Structure (W1-W4)

### W1 — Recon (Day 1, Haiku, 6h)

**Discover:** What exists, what's needed, what breaks.

**Questions:**
1. Where does schema versioning live? (TypeDB table? D1 config?)
2. How do we auto-generate TypeQL from user schema? (AST parser? template?)
3. How does conflict detection work? (unique constraints, FK checks, duplicates)
4. Where does version history live? (separate table? TypeDB `_version` field?)
5. How do we auto-filter by tenant on every query? (TypeQL injection? wrapper function?)
6. Where does CRUD routing happen? (API handler? middleware?)
7. How do audit logs persist? (D1? TypeDB? KV?)

**Output:**
- Recon report: which questions are answered by existing code, which need new code
- Risk table: what could break (schema conflicts, data migration, isolation bypass)
- Spike: proof-of-concept TypeQL generation for one entity type

**Files to explore:**
- `src/pages/api/*.ts` — API route structure
- `src/engine/persist.ts` — TypeDB interaction
- `src/schema/one.tql` — current schema patterns
- `gateway/` — handler routing
- `migrations/` — D1 structure (if needed)

---

### W2 — Decide (Day 1.5, Opus, 4h)

**Architecture:** What code changes, where, why, in what order.

**Decisions:**
1. Schema storage: TypeDB native or D1 + TypeDB?
   - **Decision:** TypeDB `schema-version` entity + `entity-type` entities. Version history via `created-at` + `status` fields. No migration table (TypeQL is idempotent for schema changes).

2. TypeQL generation: manual template or AST parser?
   - **Decision:** Handlebars template per verb (create.tql.hbs, read.tql.hbs, query.tql.hbs, etc). Maps user schema fields → TypeQL attributes.

3. Conflict detection: pre-flight or on insert?
   - **Decision:** On insert. Unique constraint violations caught by TypeDB `insert` transaction failure. FK checks via relation validation.

4. Version conflict (update race): optimistic locking via `_version` field.
   - **Decision:** User schema can add `_version` attribute; framework auto-increments. Update checks `where _version == X` before applying patch.

5. Tenant isolation: query-time filter or TypeDB role?
   - **Decision:** Query-time filter (wrapper function in `src/lib/schema-handler.ts`). Auto-inject `has tenant-id <sender's-tenant>` into every query.

6. CRUD routing: new handler per entity or unified dispatcher?
   - **Decision:** Unified dispatcher in `src/pages/api/crud/[entity].ts`. Routes to handler per verb + entity. Handler is auto-generated from schema.

7. Audit log: TypeDB insert or D1 log?
   - **Decision:** TypeDB `audit-log` entity (same isolation guarantees). KV also gets a rolling 7-day summary (cost tracking).

**Files to change:**
- `src/schema/one.tql` — add schema-version, entity-type, audit-log entities
- `src/lib/schema-handler.ts` — new file: schema validation, TypeQL generation, tenant-filter injection
- `src/pages/api/crud/[entity].ts` — new file: unified CRUD dispatcher
- `src/lib/schema-templates/` — new dir: Handlebars templates (create.tql.hbs, read.tql.hbs, etc)
- `src/lib/conflict-detect.ts` — new file: FK + unique constraint rules
- `src/pages/api/schema/define.ts` — new file: schema upload + validation + versioning
- `.claude/rules/backend.md` — new file: enforce closed loop on CRUD, rubric dims

**Documentation updates (W2):**
- `one/backend-api.md` — API spec for all endpoints (schema define, CRUD routes)
- `docs/TODO-backend.md` (this file) — wave structure, rubric, exit criteria
- Update `one/backend.md` — add implementation status notes

---

### W3 — Edit (Day 2-3, Sonnet × 2 parallel agents, 16h)

**Implementation:** Write the code.

**Agent 1 — Schema Layer (8h)**
- Implement `src/lib/schema-handler.ts`:
  - `defineSchema(tenantId, typeql)` — validate, version, store
  - `getSchema(tenantId, entityName)` — fetch active schema
  - `getSchemaVersion(tenantId, version)` — fetch historical
  - `validateUserSchema(typeql)` — syntax check, entity check, relation check
  - Handlebars template compilation for CRUD

- Implement `src/schema/one.tql` additions:
  - `entity schema-version` with attributes
  - `entity entity-type` with relationships to user entities
  - `entity audit-log` structure

- Tests:
  - Happy path: upload schema, query it back, verify version increments
  - Conflict: upload same schema twice, hash-gate prevents duplicate
  - Invalid: upload broken TypeQL, error response

**Agent 2 — CRUD + Isolation (8h)**
- Implement `src/pages/api/crud/[entity].ts`:
  - Route per entity (auto-discovered from schema)
  - Dispatch per verb (create/read/update/delete/query/count)
  - Tenant-filter injection (auto-add `has tenant-id <X>` to TypeQL)
  - Role check (via `src/lib/role-check.ts`)
  - Outcome response (result/notfound/conflict/timeout)
  - Pheromone deposit (mark/warn via `client.mark()` per verb success)

- Implement `src/lib/conflict-detect.ts`:
  - Unique constraint rules (email, sku, etc)
  - FK violation detection (contact.accountId → account must exist)
  - Version mismatch on update (optimistic locking)

- Implement `src/pages/api/schema/define.ts`:
  - POST /schema/:tenantId/define handler
  - Validate + compile schema
  - Version storage + migration prep
  - Response: schema-id, version, compiled-status

- Tests:
  - Create conflict: duplicate email, returns { conflict: 'email-exists' }
  - Isolation: Tenant A creates contact, Tenant B queries returns []
  - Query: filter by tag, count matched, rubric scores
  - Update: version mismatch, conflict response
  - Delete: cascading if foreign keys

**Docs edited alongside code:**
- `one/backend-api.md` — flesh out endpoint details
- `.claude/rules/backend.md` — enforcement patterns
- Add examples to `one/backend.md`

---

### W4 — Verify (Day 4, Sonnet, 4h)

**Testing + Rubric:** Does it ship?

**Test suite (24 tests total):**

**Schema tests (6):**
- [ ] Upload valid schema, version increments
- [ ] Upload same schema twice, hash-gates duplicate
- [ ] Fetch schema by version
- [ ] Invalid TypeQL rejected
- [ ] Schema with 10+ entities works
- [ ] Breaking change detection (dropping attribute warns)

**CRUD tests (12):**
- [ ] Create contact, returns { id, created_at, created_by }
- [ ] Create duplicate email, returns { conflict: 'email-exists' }
- [ ] Read by id, tenant isolation holds
- [ ] Query by tag, returns matched list + count
- [ ] Update contact, version increments, old version rejected
- [ ] Delete contact, cascading FK cleanup
- [ ] Create timeout (slow handler), returns { timeout: true }
- [ ] Pheromone marks on create success
- [ ] Pheromone warns on conflict
- [ ] Audit log records all mutations
- [ ] Count aggregation works
- [ ] Query with no results returns empty (not error)

**Isolation tests (4):**
- [ ] Tenant A creates, Tenant B cannot read
- [ ] Tenant A role=operator, Tenant B role=auditor cannot write
- [ ] Private scope entity hidden from group
- [ ] Public scope entity visible to another tenant

**Integration tests (2):**
- [ ] Full CRM flow: schema → create contact → query → update → delete
- [ ] E-commerce flow: products → orders → inventory

**Rubric scoring:**

| Dimension | Target | Rubric | Evidence |
|-----------|--------|--------|----------|
| **fit** | >=0.9 | Does it solve the stated problem? | All 24 tests pass; schema flexibility works; multi-tenant isolation proven |
| **form** | >=0.9 | Clean code, no dead branches? | biome + tsc clean; no unused vars; consistent naming per `dictionary.md` |
| **truth** | >=0.95 | Deterministic + verified? | Outcomes are structured (no strings); rubric scored per operation; pheromone deposits verified |
| **taste** | >=0.85 | Performance + experience? | Query latency <100ms (KV cached), create <50ms, rubric taste scores >0.8 |

**Exit criteria:**
- [ ] All 24 tests green
- [ ] biome clean
- [ ] tsc clean (no TS errors)
- [ ] Rubric >= 0.65 (fit + form + truth + taste avg)
- [ ] No regressions in existing tests
- [ ] Pheromone deposits verified (manual check: signals marked correctly)
- [ ] Docs updated (backend-api.md complete)
- [ ] One integration CRM walkthrough (create → query → update → delete) works end-to-end

**If not green:**
- Rubric < 0.65 → cycle repeats with new W2 (architecture revision)
- Tests fail → W3 fixes, re-run W4
- Performance miss (taste < 0.85) → optimize queries, add indexes, re-run

---

## Task Metadata

| Attribute | Value |
|-----------|-------|
| id | backend-phase1 |
| value | 12 features |
| effort | 3 waves |
| phase | construction |
| persona | Backend Architects + Full-Stack Engineers |
| blocks | none (new surface) |
| blockedBy | none |
| tags | backend, core, architecture, Q2-2026 |
| exit | rubric >= 0.65 |
| lifecycle | construction |
| classifier | mode=full (discovery + decision needed before code) |

---

## Rubric (Post-W4)

**Fit (solves the stated problem):**
- ✅ User can define any schema (CRM, e-commerce, SaaS)
- ✅ CRUD verbs work (create/read/update/delete/query/count)
- ✅ Multi-tenant isolation proven (no cross-tenant leaks)
- ✅ Pheromone learns data patterns (L1-L7 integration)

**Form (clean implementation):**
- ✅ Code follows `dictionary.md` naming
- ✅ No dead branches or unused code
- ✅ Test coverage: 24 tests, all passing
- ✅ Error messages clear and actionable

**Truth (deterministic + verifiable):**
- ✅ Outcomes are structured (result/notfound/conflict/timeout)
- ✅ Rubric scores attached to every operation
- ✅ Audit log complete (who, what, when, result)
- ✅ Pheromone deposits verified per test

**Taste (perf + UX):**
- ✅ Create <50ms
- ✅ Query <100ms (KV cached)
- ✅ Schema define <1s
- ✅ Error messages appear inline

---

## Self-Checkoff (W4 Complete)

- [ ] W1 recon report submitted
- [ ] W2 architecture decisions locked
- [ ] W3 code complete (Agent 1 + Agent 2 parallel)
- [ ] W4 all 24 tests pass
- [ ] Rubric >= 0.65 (record the actual scores)
- [ ] Docs updated (`one/backend-api.md`, `.claude/rules/backend.md`)
- [ ] One integration walkthrough verified
- [ ] Zero regressions in existing test suite
- [ ] Pheromone deposits recorded (mark/warn counts)

**Mark done:** `/close backend-phase1` → unblocks Phase 2 (learning on patterns)

---

## See Also

- `one/backend.md` — vision (signals as CRUD + commerce)
- `one/backend-api.md` — detailed API spec (all endpoints + examples)
- `one-ontology.md` — 6 dimensions (the foundation)
- `governance.md` — role + scope model (Permission = Role × Pheromone)
- `DSL.md` — signal primitives
- `rubrics.md` — quality scoring (fit/form/truth/taste)
- `.claude/rules/backend.md` — enforcement patterns (closed loop, deterministic results)

---

*Schema as code. Isolation by ontology. Learning on data. One wave at a time.*
