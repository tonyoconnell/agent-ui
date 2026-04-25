---
title: Backend API Specification
type: specification
version: 1.0.0
audience: developers using ONE as a backend
---

# one/backend-api.md — Backend API Spec

Complete specification for Phase 1 backend endpoints: schema management, CRUD operations, query/aggregate, isolation, conflict detection, audit.

**Base URL:** `https://api.one.ie`

**Auth:** All requests require `Authorization: Bearer <apiKey>` header.

**Content-Type:** `application/json`

---

## 1. Schema Management

### 1.1 Define Schema

**Endpoint:** `POST /api/schema/:tenantId/define`

**Purpose:** Upload user-defined TypeQL schema for a tenant. Validates, versions, and stores.

**Request:**

```json
{
  "name": "crm-core",
  "version": "1.0.0",
  "schema": "define\n\nentity contact\n  owns id,\n  owns name,\n  owns email,\n  ...",
  "replaces": "0.9.2"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | Schema name (e.g., "crm-core", "shopify-checkout") |
| `version` | string | ✅ | Semver (e.g., "1.0.0") |
| `schema` | string | ✅ | Raw TypeQL `define` block (no `insert`/`match` allowed) |
| `replaces` | string | ❌ | Previous version being replaced. If omitted, appends as new version. |

**Response (201 Created):**

```json
{
  "schema_id": "crm-core",
  "tenant_id": "acme-corp",
  "version": "1.0.0",
  "created_at": 1714081200,
  "created_by": "human:alice",
  "status": "active",
  "hash": "a1b2c3d4e5f6",
  "entity_types": [
    { "name": "contact", "attributes": ["id", "name", "email", "lead_score"] },
    { "name": "account", "attributes": ["id", "name", "plan"] }
  ],
  "compiled": {
    "select_functions": 2,
    "insert_template": "available",
    "delete_cascade": true
  }
}
```

| Field | Type | Notes |
|-------|------|-------|
| `schema_id` | string | Matches request `name` |
| `version` | string | Matches request |
| `created_at` | number | Unix timestamp |
| `created_by` | string | Actor UID |
| `status` | string | "active" (ready to use) or "compiling" (async) |
| `hash` | string | FNV-1a of schema (prevents duplicate uploads) |
| `entity_types` | array | Auto-discovered entities + their attributes |
| `compiled.select_functions` | number | Count of auto-generated TypeQL functions |

**Errors:**

| Code | Condition | Response |
|------|-----------|----------|
| 400 | Invalid TypeQL syntax | `{ error: "parse_error", line: 5, detail: "..." }` |
| 400 | Entity name conflicts with reserved | `{ error: "reserved_entity", name: "signal" }` |
| 409 | Schema version exists with same hash | `{ error: "duplicate_schema", version: "1.0.0", hash: "a1b2c3" }` |
| 413 | Schema > 1 MB | `{ error: "schema_too_large", max_bytes: 1048576 }` |
| 429 | Rate limit (5 schemas/min per tenant) | `{ error: "rate_limit", retry_after: 12 }` |

**Outcomes:**

| Outcome | Pheromone |
|---------|-----------|
| 201 Created | mark('schema→define', { fit: 1, form: 1, truth: 1, taste: 0.98 }) |
| 400 Bad syntax | warn('schema→define', { fit: 0 }) |
| 409 Duplicate | warn('schema→define', { fit: 0.5 }) |

---

### 1.2 Get Schema

**Endpoint:** `GET /api/schema/:tenantId/:schemaId`

**Purpose:** Fetch active schema definition.

**Query params:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `version` | string | (latest active) | Fetch specific version, e.g., "1.0.0" or "0.9.2" |

**Response (200 OK):**

```json
{
  "schema_id": "crm-core",
  "tenant_id": "acme-corp",
  "version": "1.0.0",
  "created_at": 1714081200,
  "created_by": "human:alice",
  "status": "active",
  "schema": "define\n\nentity contact\n  owns id,\n  owns name,\n  ...",
  "entity_types": [
    {
      "name": "contact",
      "attributes": [
        { "name": "id", "type": "string", "required": true, "unique": true },
        { "name": "name", "type": "string", "required": true },
        { "name": "email", "type": "string", "required": true, "unique": true },
        { "name": "lead_score", "type": "double", "required": false }
      ],
      "relations": [
        { "name": "account", "target": "account", "cardinality": "one" }
      ]
    }
  ]
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| 404 | Schema not found for tenant |
| 404 | Requested version doesn't exist |

---

### 1.3 List Schemas

**Endpoint:** `GET /api/schema/:tenantId`

**Purpose:** List all active + historical schemas for a tenant.

**Query params:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `status` | string | "active" | Filter: "active", "deprecated", "migrating", "all" |
| `limit` | number | 20 | Max results |

**Response (200 OK):**

```json
{
  "schemas": [
    {
      "schema_id": "crm-core",
      "version": "1.0.0",
      "created_at": 1714081200,
      "status": "active",
      "entity_count": 5
    },
    {
      "schema_id": "crm-core",
      "version": "0.9.2",
      "created_at": 1713994800,
      "status": "deprecated",
      "entity_count": 4
    }
  ],
  "total": 2
}
```

---

## 2. CRUD Operations

All CRUD endpoints follow the same pattern. Tenant is auto-derived from Bearer token; cross-tenant visibility is impossible.

### 2.1 Create

**Endpoint:** `POST /api/:entityType`

**Purpose:** Create a new record. Auto-generates `id`, `created_at`, `created_by`.

**Request:**

```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "account_id": "a-1",
  "tags": ["prospect"]
}
```

**Response (201 Created):**

```json
{
  "id": "c-abc123",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "account_id": "a-1",
  "tags": ["prospect"],
  "created_at": 1714081200,
  "created_by": "human:alice",
  "_version": 1
}
```

**Outcomes:**

```typescript
// Success
{ result: { id, ...data, created_at, created_by }, marked: true, rubric: { fit: 1, form: 1, truth: 1, taste: 0.98 } }

// Conflict (unique constraint)
{ conflict: "email_exists", marked: false, rubric: { fit: 0.5, form: 1, truth: 0, taste: 1 } }

// Conflict (FK violation)
{ conflict: "account_not_found", marked: false, rubric: { fit: 0.5, form: 1, truth: 0, taste: 1 } }

// Conflict (validation failed)
{ conflict: "invalid_email", marked: false, rubric: { fit: 0, form: 0.5, truth: 0, taste: 1 } }

// Timeout
{ timeout: true, rubric: { taste: 0.2 } }
```

**Errors:**

| Code | Condition | Conflict | Rubric |
|------|-----------|----------|--------|
| 409 | Email already exists | `email_exists` | fit: 0.5 |
| 409 | Foreign key violation | `account_not_found` | fit: 0.5 |
| 400 | Email format invalid | `invalid_email` | form: 0.5 |
| 504 | Timeout | `timeout: true` | taste: 0.2 |

**Pheromone:**

- Success: `mark(':entityType→create')`
- Conflict (FK): `warn(':entityType→create', {fit: 0.5})`
- Timeout: neutral (not handler's fault)

---

### 2.2 Read

**Endpoint:** `GET /api/:entityType/:id`

**Purpose:** Fetch one record by id. Returns 404 if not found or cross-tenant.

**Response (200 OK):**

```json
{
  "id": "c-abc123",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "account_id": "a-1",
  "lead_score": 0.92,
  "created_at": 1714081200,
  "created_by": "human:alice",
  "updated_at": 1714084800,
  "updated_by": "human:alice",
  "_version": 2
}
```

**Outcomes:**

```typescript
{ result: { id, ...data }, marked: true, rubric: { truth: 1 } }
{ notfound: true, marked: false }
```

**Errors:**

| Code | Condition |
|------|-----------|
| 404 | Record not found (or cross-tenant, indistinguishable) |

---

### 2.3 Update

**Endpoint:** `PATCH /api/:entityType/:id`

**Purpose:** Update specific fields. Uses optimistic locking via `_version`.

**Request:**

```json
{
  "lead_score": 0.95,
  "_version": 2
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fields | object | ✅ | Any subset of entity's attributes |
| `_version` | number | ✅ | Current version (conflict detection) |

**Response (200 OK):**

```json
{
  "id": "c-abc123",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "lead_score": 0.95,
  "updated_at": 1714088400,
  "updated_by": "human:alice",
  "_version": 3
}
```

**Outcomes:**

```typescript
{ result: { id, ...patched }, marked: true, rubric: { truth: 1, taste: 0.96 } }
{ notfound: true, marked: false }
{ conflict: "version_mismatch", marked: false, rubric: { fit: 0.5 } }
{ timeout: true, rubric: { taste: 0.2 } }
```

**Errors:**

| Code | Condition | Conflict | Rubric |
|------|-----------|----------|--------|
| 404 | Record not found | `notfound: true` | fit: 0.5 |
| 409 | `_version` doesn't match | `version_mismatch` | fit: 0.5 |
| 400 | Email format invalid | `invalid_email` | form: 0.5 |
| 504 | Timeout | `timeout: true` | taste: 0.2 |

---

### 2.4 Delete

**Endpoint:** `DELETE /api/:entityType/:id`

**Purpose:** Soft or hard delete (configurable per schema). Returns count deleted.

**Query params:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `hard` | boolean | false | Hard delete (immediate) vs soft (marks deleted_at) |

**Response (200 OK):**

```json
{
  "deleted": 1,
  "entity_id": "c-abc123",
  "method": "soft",
  "cascaded": 0,
  "marked": true,
  "rubric": { "truth": 1 }
}
```

**Outcomes:**

```typescript
{ result: { deleted: 1 }, marked: true, rubric: { truth: 1 } }
{ result: { deleted: 0, notfound: true }, marked: false }
{ result: { deleted: 1, cascaded: 3 }, marked: true }  // FK cascade cleanup
```

**Errors:**

| Code | Condition |
|------|-----------|
| 404 | Record not found |
| 409 | FK constraint violation (cascading would delete important data) |

---

### 2.5 Query

**Endpoint:** `POST /api/:entityType/query`

**Purpose:** Filter records with full-text + structured match. Returns array + metadata.

**Request:**

```json
{
  "match": {
    "account_id": "a-1",
    "tags": "prospect",
    "lead_score_gte": 0.5,
    "created_at_gte": "2026-04-01"
  },
  "orderBy": "lead_score",
  "orderAsc": false,
  "limit": 50,
  "offset": 0
}
```

| Field | Type | Notes |
|-------|------|-------|
| `match` | object | Filters: `field`, `field_eq`, `field_ne`, `field_gt`, `field_gte`, `field_lt`, `field_lte`, `field_in`, `field_contains` |
| `orderBy` | string | Sort field (default: `created_at`) |
| `orderAsc` | boolean | Default: false (newest first) |
| `limit` | number | Default: 50, max: 1000 |
| `offset` | number | Default: 0 (pagination) |

**Response (200 OK):**

```json
{
  "results": [
    {
      "id": "c-abc123",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "account_id": "a-1",
      "lead_score": 0.92,
      "created_at": 1714081200
    },
    {
      "id": "c-def456",
      "name": "Bob Smith",
      "email": "bob@example.com",
      "account_id": "a-1",
      "lead_score": 0.78,
      "created_at": 1714084800
    }
  ],
  "matched": 2,
  "total": 247,
  "took_ms": 42,
  "marked": true,
  "rubric": { "truth": 1, "taste": 0.95 }
}
```

| Field | Type | Notes |
|-------|------|-------|
| `results` | array | Records matching query (ordered, paginated) |
| `matched` | number | Records in this result set |
| `total` | number | Total matching (without limit/offset) |
| `took_ms` | number | Query latency |

**Outcomes:**

```typescript
{ result: [...records], matched: 42, marked: true, rubric: { truth: 1, taste: 0.95 } }
{ result: [], matched: 0, marked: true }  // Empty is valid
{ timeout: true, rubric: { taste: 0.1 } }
```

**Errors:**

| Code | Condition |
|------|-----------|
| 400 | Invalid match clause (e.g., typo in field name) |
| 504 | Timeout (complex query, >1s) |

---

### 2.6 Count

**Endpoint:** `POST /api/:entityType/count`

**Purpose:** Get cardinality of query result (fast, no fetch).

**Request:**

```json
{
  "match": {
    "account_id": "a-1",
    "tags": "prospect"
  }
}
```

**Response (200 OK):**

```json
{
  "matched": 42,
  "marked": true,
  "rubric": { "truth": 1, "taste": 0.99 }
}
```

**Outcomes:**

```typescript
{ matched: 42, marked: true, rubric: { truth: 1, taste: 0.99 } }
```

---

### 2.7 Aggregate

**Endpoint:** `POST /api/:entityType/aggregate`

**Purpose:** Compute sum/avg/min/max over result set.

**Request:**

```json
{
  "match": {
    "account_id": "a-1"
  },
  "aggregate": {
    "total_score": "sum(lead_score)",
    "avg_score": "avg(lead_score)",
    "max_score": "max(lead_score)",
    "count": "count(*)"
  },
  "groupBy": "tags"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `match` | object | Filter (same as query) |
| `aggregate` | object | Aggregation functions (sum, avg, min, max, count) |
| `groupBy` | string | Optional: group results by field |

**Response (200 OK):**

```json
{
  "results": [
    { "tags": "prospect", "total_score": 45.2, "avg_score": 0.82, "max_score": 0.95, "count": 55 },
    { "tags": "customer", "total_score": 32.1, "avg_score": 0.91, "max_score": 0.98, "count": 35 }
  ],
  "took_ms": 156,
  "marked": true,
  "rubric": { "truth": 1, "taste": 0.90 }
}
```

---

## 3. Multi-Tenant Isolation (Automatic)

**All endpoints auto-scope to tenant.** Cross-tenant access is impossible.

### 3.1 How It Works

```
Incoming request from Bearer token
  ↓
Extract actor UID from token
  ↓
Look up actor's group in TypeDB
  ↓
group → tenant_id (e.g., 'acme-corp')
  ↓
Auto-inject into TypeQL:
  'match $e isa <entityType>, has tenant_id <actor's-tenant>'
  ↓
Query returns only this tenant's records
```

**Result:** Tenant A querying Tenant B's endpoint returns `[]` (no error, no indication data exists).

### 3.2 Role Checks

After tenant check, role check determines what operations are allowed.

| Endpoint | Require Role | Deny Roles |
|----------|--------------|-----------|
| POST /{entity} (create) | operator+ | auditor |
| GET /{entity}/:id (read) | board+ | (none) |
| PATCH /{entity}/:id (update) | operator+ | auditor |
| DELETE /{entity}/:id (delete) | ceo+ | board, operator, auditor |
| POST /{entity}/query (query) | board+ | (none) |
| POST /schema/:id/define (schema) | ceo+ | board, operator, agent, auditor |

**Role hierarchy:**

```
chairman (all)
  ├── ceo (write everything, define schemas)
  ├── operator (read + write data, no schema)
  ├── board (read-only)
  ├── agent (own paths only)
  └── auditor (read-only, limited scope)
```

---

## 4. Audit & Pheromone

### 4.1 Audit Log

Every CRUD operation logged to `audit-log` entity in TypeDB.

```
entity audit-log
  owns id,
  owns timestamp,
  owns actor_id,       // who did it
  owns action,         // 'create' | 'read' | 'update' | 'delete'
  owns entity_type,    // 'contact'
  owns entity_id,      // 'c-123'
  owns status,         // 'success' | 'conflict' | 'timeout'
  owns changes,        // { before, after } for updates
  owns tenant_id;      // scope
```

**Query audit logs:**

```bash
GET /api/audit?entity_type=contact&actor_id=human:alice&limit=100
```

---

### 4.2 Pheromone Deposits

Every operation closes the loop with mark or warn:

**Create:**
- Success → `mark(':entityType→create')`
- Conflict (FK) → `warn(':entityType→create', {fit: 0.5})`
- Timeout → neutral

**Query:**
- Success → `mark(':entityType→query')`
- Timeout → `warn(':entityType→query', {taste: 0.1})`

**Update:**
- Success → `mark(':entityType→update')`
- Version mismatch → `warn(':entityType→update', {fit: 0.5})`

**Delete:**
- Success → `mark(':entityType→delete')`
- Not found → `warn(':entityType→delete', {fit: 0.5})`

---

## 5. Error Responses

All errors follow standard format:

```json
{
  "error": "conflict_code",
  "message": "Human-readable explanation",
  "field": "email",
  "detail": "Email alice@example.com already exists"
}
```

**Standard codes:**

| Code | HTTP | Meaning |
|------|------|---------|
| `parse_error` | 400 | Invalid JSON or TypeQL |
| `invalid_entity` | 400 | Entity type doesn't exist |
| `invalid_field` | 400 | Field doesn't exist on entity |
| `validation_failed` | 400 | Data doesn't pass schema constraints |
| `not_found` | 404 | Record not found |
| `conflict` | 409 | Unique/FK/version conflict |
| `timeout` | 504 | Operation exceeded timeout |
| `rate_limit` | 429 | Too many requests |
| `unauthorized` | 401 | Invalid or missing Bearer token |
| `forbidden` | 403 | Role doesn't allow this operation |

---

## 6. Examples

### CRM: Create → Query → Update → Delete

```bash
# 1. Define schema
curl -X POST https://api.one.ie/api/schema/acme-corp/define \
  -H "Authorization: Bearer $ONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "crm-core",
    "version": "1.0.0",
    "schema": "define\n\nentity contact\n  owns id, owns name, owns email, has tag, relates account;\nentity account\n  owns id, owns name;"
  }'

# 2. Create contact
curl -X POST https://api.one.ie/api/contact \
  -H "Authorization: Bearer $ONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Alice Johnson", "email": "alice@example.com", "account_id": "a-1", "tags": ["prospect"] }'
# → { "id": "c-abc123", "created_at": ..., "created_by": "human:alice" }

# 3. Query prospects
curl -X POST https://api.one.ie/api/contact/query \
  -H "Authorization: Bearer $ONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "match": { "account_id": "a-1", "tags": "prospect" }, "limit": 50 }'
# → { "results": [...], "matched": 42 }

# 4. Update contact (add lead score)
curl -X PATCH https://api.one.ie/api/contact/c-abc123 \
  -H "Authorization: Bearer $ONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "lead_score": 0.92, "_version": 1 }'
# → { "id": "c-abc123", "lead_score": 0.92, "updated_at": ..., "_version": 2 }

# 5. Delete contact
curl -X DELETE https://api.one.ie/api/contact/c-abc123 \
  -H "Authorization: Bearer $ONE_API_KEY"
# → { "deleted": 1, "method": "soft" }
```

### E-Commerce: Products + Orders

```bash
# Create product
POST /api/product
{ "sku": "TSHIRT-001", "name": "Blue T-Shirt", "price": 24.99, "inventory": 100 }
# → { "id": "p-123", created_at: ... }

# Create order
POST /api/order
{ "customer_id": "cust-alice", "items": [{ "product_id": "p-123", "qty": 2 }], "total": 49.98 }
# → { "id": "o-456", created_at: ... }

# Query top products (aggregate)
POST /api/product/aggregate
{
  "match": { "category": "apparel" },
  "aggregate": { "total_sold": "sum(sold_qty)", "avg_rating": "avg(rating)" },
  "groupBy": "category",
  "orderBy": "total_sold"
}
# → { "results": [{ "category": "apparel", "total_sold": 1000, "avg_rating": 4.5 }] }
```

---

## 7. Rate Limits

**Free tier:** 1,000 requests/day per tenant
**Builder tier:** 10,000 requests/day per tenant
**Scale tier:** 100,000 requests/day per tenant

**Schema operations:** 5 schema defines per minute (shared across all users on same tier)

**Response header:** `X-RateLimit-Remaining: 999` (requests left today)

---

## 8. Latency Targets

| Operation | Target | Rubric Taste |
|-----------|--------|--------------|
| Create | <50ms | taste = 1 - (actual_ms / 50) |
| Read | <20ms | taste = 1 - (actual_ms / 20) |
| Query | <100ms | taste = 1 - (actual_ms / 100) |
| Update | <50ms | taste = 1 - (actual_ms / 50) |
| Delete | <50ms | taste = 1 - (actual_ms / 50) |
| Aggregate | <200ms | taste = 1 - (actual_ms / 200) |

Taste scores determine routing: slow handlers deprioritized in pheromone.

---

## See Also

- `backend.md` — vision + architecture
- `TODO-backend.md` — implementation waves (W1-W4)
- `governance.md` — role + scope model
- `.claude/rules/backend.md` — enforcement patterns
- `rubrics.md` — quality scoring

---

*One API. Four surfaces. Ontology-enforced isolation. Pheromone learns what works.*
