---
title: Todo Use Our Backend
dimension: things
primary_dimension: things
category: todo-use-our-backend.md
tags: agent, ai, backend, connections, convex, events, groups, cycle, knowledge, ontology
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-use-our-backend.md category.
  Location: one/things/todo-use-our-backend.md
  Purpose: Documents backend api service - 100 cycle todo list
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand todo use our backend.
---

# Backend API Service - 100 Cycle Todo List

**Feature:** External API Access to ONE Platform Backend
**Status:** Planning Complete → Ready for Execution
**Created:** 2025-10-30

## Overview

This document tracks all 100 cycles for implementing the Backend-as-a-Service feature, allowing external developers to consume the ONE Platform backend via API keys with full 6-dimension ontology access and multi-tenant group isolation.

---

## Foundation Phase (Cycle 1-10)

**Agent:** agent-director
**Goal:** Validate idea, map to ontology, create execution plan

### ✅ Cycle 1: Validate Idea Against 6-Dimension Ontology

**Status:** ✅ Complete
**Task:** Ensure API service maps cleanly to Groups, People, Things, Connections, Events, Knowledge
**Validation:**

- Groups: Multi-tenant isolation per API consumer ✅
- People: Service accounts and API key owners ✅
- Things: api_key, api_application, service_account, api_quota entities ✅
- Connections: owns_api_key, authenticated_by, has_quota ✅
- Events: api_request_made, api_key_generated, quota_exceeded ✅
- Knowledge: API docs via RAG, error message search ✅

### ✅ Cycle 2: Map Entity Types

**Status:** ✅ Complete
**New Entity Types:**

- `api_key` - Credentials with scopes and rate limits
- `api_application` - Registered app consuming API
- `api_quota` - Usage limits by billing tier
- `service_account` - Non-human actor for API requests

**Existing Entity Types Accessible:**

- All 66+ entity types available through authenticated endpoints

### ✅ Cycle 3: Identify Connection Types

**Status:** ✅ Complete
**New Connection Types:**

- `owns_api_key` - person → api_key
- `authenticated_by` - api_application → api_key
- `belongs_to_org` - api_application → group
- `has_quota` - api_application → api_quota

### ✅ Cycle 4: List Event Types

**Status:** ✅ Complete
**New Event Types:**

- `api_key_generated` - New key created
- `api_key_revoked` - Key invalidated
- `api_request_made` - Every API call logged
- `quota_exceeded` - Rate limit hit
- `api_auth_failed` - Invalid key used
- `api_application_registered` - New app registered

### ✅ Cycle 5: Determine Knowledge Requirements

**Status:** ✅ Complete
**Knowledge Dimension Usage:**

- API documentation searchable via RAG
- Error messages semantically indexed
- Usage pattern learning for UX improvements
- Auto-completion suggestions based on context

### ✅ Cycle 6: Identify Organization Scope

**Status:** ✅ Complete
**Multi-Tenant Strategy:**

- Each API consumer = top-level group (organization)
- Hierarchical sub-groups allowed for nested tenancy
- All API requests automatically scoped to authenticated org's groupId
- Complete data isolation enforced by schema

### ✅ Cycle 7: Define People Roles

**Status:** ✅ Complete
**Roles:**

- `api_consumer` - External developer with org_owner role
- `service_account` - Non-human actor representing API application
- Permissions: read-only, read-write, admin (via API key scopes)

### ✅ Cycle 8: Create Vision Document

**Status:** ✅ Complete
**Deliverable:** `/one/things/plans/use-our-backend.md`
**Content:** Executive summary, architecture, implementation phases, success metrics

### ✅ Cycle 9: Break Down Features

**Status:** ✅ Complete
**10 Major Components:**

1. API Key Generation & Management
2. Authentication Middleware
3. Group Scoping & Isolation
4. Rate Limiting & Quotas
5. Public API Gateway
6. Admin UI for Key Management
7. Developer Documentation Portal
8. Usage Analytics Dashboard
9. SDKs (JS, Python, Go, Ruby)
10. Monitoring & Operations

### ✅ Cycle 10: Create 100-Cycle Plan

**Status:** ✅ Complete
**Deliverable:** This file (`/one/things/todo-use-our-backend.md`)

---

## Backend Phase: Schema Design (Cycle 11-15)

**Agent:** agent-backend
**Goal:** Design database schema for API entities

### ⏳ Cycle 11: Extend Things Schema with API Entity Types

**Status:** Pending
**Dependencies:** Cycle 1-10 (Foundation complete)
**Task:** Add entity type definitions for api_key, api_application, service_account, api_quota
**File:** `backend/convex/schema.ts`
**Acceptance Criteria:**

- [ ] `api_key` type with properties: key (hashed), prefix, organizationId, scopes, rateLimit
- [ ] `api_application` type with properties: name, description, webhookUrl, redirectUris
- [ ] `service_account` type with properties: applicationId, permissions
- [ ] `api_quota` type with properties: tier (starter/pro/enterprise), limits, usage stats
- [ ] All types inherit base fields: \_id, type, name, properties, status, groupId, createdAt, updatedAt

### ⏳ Cycle 12: Add Database Indexes for API Key Lookup

**Status:** Pending
**Dependencies:** Cycle 11
**Task:** Create indexes for fast API key validation and lookup
**File:** `backend/convex/schema.ts`
**Acceptance Criteria:**

- [ ] Index on `things.type` + `things.properties.key` for O(log n) key lookup
- [ ] Index on `things.type` + `things.properties.organizationId` for org queries
- [ ] Index on `things.type` + `things.status` for active key filtering
- [ ] Index on `things.properties.expiresAt` for expired key cleanup

### ⏳ Cycle 13: Design Connection Types for API Relationships

**Status:** Pending
**Dependencies:** Cycle 11
**Task:** Add connection type definitions for API entity relationships
**File:** `backend/convex/schema.ts`
**Acceptance Criteria:**

- [ ] `owns_api_key` connection (person → api_key)
- [ ] `authenticated_by` connection (api_application → api_key)
- [ ] `belongs_to_org` connection (api_application → group)
- [ ] `has_quota` connection (api_application → api_quota)
- [ ] All connections include bidirectional fields, validFrom/validTo, groupId

### ⏳ Cycle 14: Plan Event Types for API Audit Trail

**Status:** Pending
**Dependencies:** Cycle 11
**Task:** Define event schemas for API operations
**File:** `backend/convex/schema.ts`
**Acceptance Criteria:**

- [ ] `api_key_generated` event with metadata: keyId, scopes, expiresAt
- [ ] `api_key_revoked` event with metadata: keyId, reason
- [ ] `api_request_made` event with metadata: endpoint, method, statusCode, latency, payloadSize, ipAddress
- [ ] `quota_exceeded` event with metadata: keyId, limitType (minute/day), attempted
- [ ] `api_auth_failed` event with metadata: keyPrefix, reason, ipAddress
- [ ] `api_application_registered` event with metadata: applicationId, initialScopes

### ⏳ Cycle 15: Create Schema Migration Strategy

**Status:** Pending
**Dependencies:** Cycle 11-14
**Task:** Plan backward-compatible schema changes
**File:** `backend/convex/migrations/add-api-entities.ts`
**Acceptance Criteria:**

- [ ] Migration script to add new entity types without downtime
- [ ] Validation that existing data not affected
- [ ] Rollback plan if migration fails
- [ ] Migration tested on development environment

---

## Backend Phase: Authentication Service (Cycle 16-20)

**Agent:** agent-backend
**Goal:** Implement API key generation, validation, and scoping

### ⏳ Cycle 16: Implement API Key Generation

**Status:** Pending
**Dependencies:** Cycle 15 (Schema ready)
**Task:** Create secure API key generation service
**File:** `backend/convex/mutations/api-keys.ts`
**Acceptance Criteria:**

- [ ] Generate cryptographically secure keys (32+ bytes entropy)
- [ ] Key format: `org_{orgId}_key_{random}` for easy identification
- [ ] Hash keys before storage (bcrypt or Argon2)
- [ ] Store only prefix in plaintext for display
- [ ] Return full key only once at creation
- [ ] Validate no key collisions

**Example:**

```typescript
export const generateApiKey = mutation({
  args: {
    name: v.string(),
    scopes: v.array(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Generate key, hash, store, return once
  },
});
```

### ⏳ Cycle 17: Create API Key Validation Middleware

**Status:** Pending
**Dependencies:** Cycle 16
**Task:** Build middleware to validate API keys on every request
**File:** `backend/convex/lib/api-auth.ts`
**Acceptance Criteria:**

- [ ] Extract API key from Authorization header (`Bearer {key}`)
- [ ] Hash incoming key and compare with stored hash
- [ ] Verify key status is `active` (not revoked/expired)
- [ ] Check expiration timestamp if set
- [ ] Update `lastUsedAt` field on successful auth
- [ ] Return 401 Unauthorized for invalid keys
- [ ] Log authentication failures as events

**Example:**

```typescript
export async function validateApiKey(
  ctx: QueryCtx | MutationCtx,
  apiKey: string,
): Promise<{ organizationId: Id<"groups">; scopes: string[] }> {
  // Validate and return org + scopes
}
```

### ⏳ Cycle 18: Build Scope Verification System

**Status:** Pending
**Dependencies:** Cycle 17
**Task:** Implement fine-grained permission checking based on API key scopes
**File:** `backend/convex/lib/api-auth.ts`
**Acceptance Criteria:**

- [ ] Define scope hierarchy (e.g., `entities:write` implies `entities:read`)
- [ ] Check required scopes before allowing operations
- [ ] Return 403 Forbidden for insufficient scopes
- [ ] Support wildcard scopes (e.g., `entities:*` for all entity operations)
- [ ] Log scope violations as events

**Available Scopes:**

- `entities:read`, `entities:write`, `entities:delete`
- `connections:read`, `connections:write`, `connections:delete`
- `events:read`, `events:write`
- `knowledge:read`, `knowledge:write`
- `groups:read`, `groups:write`
- `api_keys:manage`, `quota:view`

### ⏳ Cycle 19: Add Rate Limiting

**Status:** Pending
**Dependencies:** Cycle 17
**Task:** Implement rate limiting per API key using @convex-dev/rate-limiter
**File:** `backend/convex/lib/rate-limit.ts`
**Acceptance Criteria:**

- [ ] Install `@convex-dev/rate-limiter` package
- [ ] Implement per-minute rate limit (60 req/min for starter)
- [ ] Implement per-day rate limit (10,000 req/day for starter)
- [ ] Return 429 Too Many Requests when exceeded
- [ ] Include `Retry-After` header with reset time
- [ ] Log quota_exceeded events
- [ ] Different limits per tier (starter/pro/enterprise)

**Example:**

```typescript
const rateLimiter = new RateLimiter(ctx.db, {
  minute: { kind: "fixed window", rate: 60 },
  day: { kind: "fixed window", rate: 10000 },
});

await rateLimiter.limit(ctx, `api_key:${keyId}`);
```

### ⏳ Cycle 20: Implement Key Rotation Mechanism

**Status:** Pending
**Dependencies:** Cycle 16-19
**Task:** Allow users to rotate API keys without downtime
**File:** `backend/convex/mutations/api-keys.ts`
**Acceptance Criteria:**

- [ ] `rotateApiKey` mutation creates new key, marks old as `rotating`
- [ ] Grace period (e.g., 24 hours) where both keys valid
- [ ] After grace period, old key automatically revoked
- [ ] Email notification before old key expires
- [ ] Log key rotation events

---

## Backend Phase: Group Scoping Service (Cycle 21-25)

**Agent:** agent-backend
**Goal:** Ensure complete multi-tenant data isolation

### ⏳ Cycle 21: Create Automatic GroupId Injection Middleware

**Status:** Pending
**Dependencies:** Cycle 17 (API key validation complete)
**Task:** Automatically scope all API requests to authenticated organization's groupId
**File:** `backend/convex/lib/group-scoping.ts`
**Acceptance Criteria:**

- [ ] Extract organizationId from validated API key
- [ ] Inject `groupId: organizationId` into all mutations/queries
- [ ] Prevent clients from overriding groupId
- [ ] Throw error if groupId mismatch detected
- [ ] Log attempted unauthorized access

**Example:**

```typescript
export function withGroupScoping<T>(
  handler: (
    ctx: MutationCtx,
    args: T & { groupId: Id<"groups"> },
  ) => Promise<any>,
) {
  return async (ctx: MutationCtx, args: T) => {
    const { organizationId } = await validateApiKey(ctx, getAuthHeader(ctx));
    return handler(ctx, { ...args, groupId: organizationId });
  };
}
```

### ⏳ Cycle 22: Implement Organization Isolation Checks

**Status:** Pending
**Dependencies:** Cycle 21
**Task:** Verify queries/mutations only access data within authenticated organization
**File:** `backend/convex/lib/group-scoping.ts`
**Acceptance Criteria:**

- [ ] All `ctx.db.query()` calls filtered by groupId
- [ ] Cross-group queries explicitly blocked
- [ ] Read operations verify entity belongs to authorized group
- [ ] Write operations enforce groupId constraint
- [ ] Delete operations verify ownership before deletion

### ⏳ Cycle 23: Build Hierarchical Group Access Rules

**Status:** Pending
**Dependencies:** Cycle 22
**Task:** Allow parent groups to access child group data (configurable)
**File:** `backend/convex/lib/group-scoping.ts`
**Acceptance Criteria:**

- [ ] Implement `canAccessGroup(actorGroupId, targetGroupId)` function
- [ ] Walk group hierarchy tree (parentGroupId references)
- [ ] Cache hierarchy lookups for performance
- [ ] Respect group settings (`allowParentAccess` boolean)
- [ ] Log hierarchical access attempts

### ⏳ Cycle 24: Add Cross-Group Query Prevention

**Status:** Pending
**Dependencies:** Cycle 23
**Task:** Prevent accidental data leakage via joins/relationships
**File:** `backend/convex/lib/group-scoping.ts`
**Acceptance Criteria:**

- [ ] Verify all connection endpoints belong to same group
- [ ] Prevent event queries from crossing group boundaries
- [ ] Filter knowledge search results by groupId
- [ ] Validate webhook payloads don't leak cross-group data
- [ ] Add integration tests for isolation

### ⏳ Cycle 25: Implement Audit Logging for API Requests

**Status:** Pending
**Dependencies:** Cycle 21-24
**Task:** Log every API request as an event for security and analytics
**File:** `backend/convex/lib/api-audit.ts`
**Acceptance Criteria:**

- [ ] Log `api_request_made` event with full metadata
- [ ] Include: timestamp, endpoint, method, statusCode, latency, payloadSize, ipAddress, userAgent
- [ ] Async logging (don't block requests)
- [ ] Retention policy (30 days for starter, 1 year for enterprise)
- [ ] Export API for audit log retrieval

---

## Backend Phase: API Gateway Layer (Cycle 26-30)

**Agent:** agent-backend
**Goal:** Create public REST-style endpoints over Convex HTTP

### ⏳ Cycle 26: Create Public API Endpoints

**Status:** Pending
**Dependencies:** Cycle 25 (Auth & scoping complete)
**Task:** Implement RESTful HTTP endpoints for all operations
**File:** `backend/convex/http.ts`
**Acceptance Criteria:**

- [ ] `POST /api/v1/entities` - Create entity
- [ ] `GET /api/v1/entities/:id` - Get entity by ID
- [ ] `GET /api/v1/entities?type={type}` - List entities by type
- [ ] `PATCH /api/v1/entities/:id` - Update entity
- [ ] `DELETE /api/v1/entities/:id` - Delete entity
- [ ] Same pattern for connections, events, groups
- [ ] All endpoints use API key authentication
- [ ] All endpoints return JSON

**Example:**

```typescript
const http = httpRouter();

http.route({
  path: "/api/v1/entities",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const apiKey = extractApiKey(request);
    const { organizationId, scopes } = await validateApiKey(ctx, apiKey);

    const body = await request.json();
    const entityId = await ctx.runMutation(internal.mutations.entities.create, {
      ...body,
      groupId: organizationId,
    });

    return new Response(JSON.stringify({ id: entityId }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }),
});
```

### ⏳ Cycle 27: Implement Request/Response Transformers

**Status:** Pending
**Dependencies:** Cycle 26
**Task:** Transform Convex native types to/from JSON for HTTP
**File:** `backend/convex/lib/transformers.ts`
**Acceptance Criteria:**

- [ ] Convert Convex Id types to strings in responses
- [ ] Parse string IDs back to Id types in requests
- [ ] Handle Date objects (timestamps ↔ ISO 8601 strings)
- [ ] Transform `properties` field (preserve arbitrary JSON)
- [ ] Validate request schemas (return 400 Bad Request for invalid)

### ⏳ Cycle 28: Add Error Handling with HTTP Status Codes

**Status:** Pending
**Dependencies:** Cycle 26
**Task:** Map errors to appropriate HTTP status codes with helpful messages
**File:** `backend/convex/lib/error-handler.ts`
**Acceptance Criteria:**

- [ ] 400 Bad Request - Invalid input/schema validation failed
- [ ] 401 Unauthorized - Missing or invalid API key
- [ ] 403 Forbidden - Insufficient scopes/permissions
- [ ] 404 Not Found - Entity doesn't exist or not in org
- [ ] 429 Too Many Requests - Rate limit exceeded
- [ ] 500 Internal Server Error - Unexpected errors
- [ ] Include error code and message in response body
- [ ] Log all 500 errors to Sentry

**Example Response:**

```json
{
  "error": {
    "code": "INSUFFICIENT_SCOPES",
    "message": "API key requires 'entities:write' scope",
    "statusCode": 403
  }
}
```

### ⏳ Cycle 29: Build Response Pagination System

**Status:** Pending
**Dependencies:** Cycle 26
**Task:** Add cursor-based pagination for list endpoints
**File:** `backend/convex/lib/pagination.ts`
**Acceptance Criteria:**

- [ ] Accept `limit` query param (default 50, max 1000)
- [ ] Accept `cursor` query param for next page
- [ ] Return `nextCursor` in response if more results exist
- [ ] Use Convex paginate() for efficient queries
- [ ] Document pagination in API reference

**Example Response:**

```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "abc123...",
    "hasMore": true,
    "totalCount": 150
  }
}
```

### ⏳ Cycle 30: Create Webhook Delivery System

**Status:** Pending
**Dependencies:** Cycle 26-29
**Task:** Deliver events to customer webhooks in real-time
**File:** `backend/convex/lib/webhooks.ts`
**Acceptance Criteria:**

- [ ] Accept webhook URL during API application registration
- [ ] Verify webhook endpoint (send test event on registration)
- [ ] Deliver events matching subscription filters
- [ ] Retry failed deliveries (exponential backoff, max 3 retries)
- [ ] Sign webhook payloads (HMAC-SHA256)
- [ ] Log delivery attempts and failures
- [ ] Provide webhook logs in dashboard

---

## Frontend Phase: API Keys Management Page (Cycle 31-35)

**Agent:** agent-frontend
**Goal:** UI for developers to manage API keys

### ⏳ Cycle 31: Design API Keys Management Page Wireframe

**Status:** Pending
**Dependencies:** Cycle 30 (Backend API complete)
**Task:** Create wireframe satisfying user stories
**File:** `one/things/wireframes/api-keys-page.md`
**Acceptance Criteria:**

- [ ] User story: "As a developer, I want to generate API keys to access the backend"
- [ ] Page layout: Header, key list table, "Generate Key" button
- [ ] Table columns: Name, Prefix, Scopes, Created, Last Used, Actions
- [ ] Actions: Copy key (if just created), Revoke, Edit scopes
- [ ] Responsive design (mobile + desktop)

### ⏳ Cycle 32: Implement Key Generation UI

**Status:** Pending
**Dependencies:** Cycle 31
**Task:** Build modal/form for creating new API keys
**File:** `web/src/components/features/api-keys/GenerateKeyModal.tsx`
**Acceptance Criteria:**

- [ ] Form fields: Name (required), Scopes (checkboxes), Expiration (optional)
- [ ] Show scope descriptions on hover
- [ ] Warn about scope implications (e.g., "entities:delete is destructive")
- [ ] On success, show full key ONCE in copyable format
- [ ] Alert user: "Save this key now. You won't see it again."
- [ ] Automatically copy to clipboard
- [ ] Close modal after key saved/copied

### ⏳ Cycle 33: Create Key Listing with Usage Stats

**Status:** Pending
**Dependencies:** Cycle 32
**Task:** Display all API keys with usage information
**File:** `web/src/components/features/api-keys/ApiKeyList.tsx`
**Acceptance Criteria:**

- [ ] Fetch keys using Convex query (`api.queries.apiKeys.list`)
- [ ] Show key prefix (first 8 chars) + "..." for identification
- [ ] Display creation date (relative: "2 days ago")
- [ ] Display last used date (or "Never used")
- [ ] Show scopes as badges (e.g., "entities:read", "connections:write")
- [ ] Color-code status: green (active), red (revoked), yellow (expiring soon)
- [ ] Loading skeleton while fetching

### ⏳ Cycle 34: Add Key Revocation Interface

**Status:** Pending
**Dependencies:** Cycle 33
**Task:** Allow users to revoke API keys with confirmation
**File:** `web/src/components/features/api-keys/RevokeKeyDialog.tsx`
**Acceptance Criteria:**

- [ ] "Revoke" button in key list table
- [ ] Confirmation dialog: "This action cannot be undone. Revoke {keyName}?"
- [ ] Optional revocation reason (dropdown: "Compromised", "Rotation", "No longer needed")
- [ ] Call `api.mutations.apiKeys.revoke` on confirm
- [ ] Show success toast: "API key revoked"
- [ ] Update key list (mark as revoked, gray out)

### ⏳ Cycle 35: Show Last Used Timestamp and IP

**Status:** Pending
**Dependencies:** Cycle 33
**Task:** Display detailed usage info for security monitoring
**File:** `web/src/components/features/api-keys/ApiKeyDetails.tsx`
**Acceptance Criteria:**

- [ ] Click key row to expand details panel
- [ ] Show: Last used timestamp, IP address, User agent, Request count (last 24h)
- [ ] Link to full audit log for this key
- [ ] Show geographic location from IP (optional, using API)
- [ ] Alert if IP changed recently (potential compromise)

---

## Frontend Phase: API Documentation Portal (Cycle 36-40)

**Agent:** agent-frontend
**Goal:** Interactive docs for developers

### ⏳ Cycle 36: Design Documentation Portal Wireframe

**Status:** Pending
**Dependencies:** Cycle 30 (Backend API complete)
**Task:** Create wireframe for API docs site
**File:** `one/things/wireframes/api-docs-portal.md`
**Acceptance Criteria:**

- [ ] Layout: Sidebar (navigation), Main content (docs), Right panel ("Try It" console)
- [ ] Sections: Getting Started, Authentication, Entities, Connections, Events, Errors
- [ ] Search bar (semantic search via RAG)
- [ ] Code examples in multiple languages (tabs for JS/Python/Go/Ruby)
- [ ] Responsive (collapsible sidebar on mobile)

### ⏳ Cycle 37: Implement Interactive API Explorer

**Status:** Pending
**Dependencies:** Cycle 36
**Task:** Build "Try It" console for testing endpoints
**File:** `web/src/components/features/docs/ApiExplorer.tsx`
**Acceptance Criteria:**

- [ ] Endpoint selector (dropdown: POST /api/v1/entities, GET /api/v1/entities/:id, etc.)
- [ ] Request builder: Headers (auto-fill API key), Body (JSON editor with syntax highlighting)
- [ ] "Send Request" button
- [ ] Response viewer: Status code, headers, body (formatted JSON)
- [ ] Error handling (show 401/403/429 with explanations)
- [ ] Save request as cURL command
- [ ] Generate code snippet in selected language

### ⏳ Cycle 38: Add Code Examples in 5+ Languages

**Status:** Pending
**Dependencies:** Cycle 36
**Task:** Provide copy-pasteable examples for common operations
**File:** `web/src/content/docs/code-examples/`
**Acceptance Criteria:**

- [ ] Examples for: Authentication, Create entity, List entities, Update entity, Delete entity
- [ ] Languages: JavaScript/TypeScript, Python, Go, Ruby, cURL
- [ ] Use syntax highlighting (Prism.js or Shiki)
- [ ] "Copy" button for each example
- [ ] Examples use placeholder values (API_KEY, ORG_ID) with tooltips explaining replacement

**Example (JavaScript):**

```javascript
import { OneClient } from "@one-platform/sdk";

const client = new OneClient({
  apiKey: "YOUR_API_KEY",
  organizationId: "YOUR_ORG_ID",
});

const course = await client.entities.create({
  type: "course",
  name: "Introduction to AI",
  properties: {
    description: "Learn AI fundamentals",
    price: 49.99,
  },
});
```

### ⏳ Cycle 39: Show Real-Time Usage Stats in Docs

**Status:** Pending
**Dependencies:** Cycle 37
**Task:** Display live API status and usage metrics
**File:** `web/src/components/features/docs/ApiStatus.tsx`
**Acceptance Criteria:**

- [ ] Status indicator: "All Systems Operational" (green) or "Degraded Performance" (yellow)
- [ ] Current requests/minute (personal usage)
- [ ] Quota consumption: "2,450 / 10,000 requests today (24%)"
- [ ] Latency stats: "Average response time: 120ms"
- [ ] Link to full analytics dashboard
- [ ] Auto-refresh every 30 seconds

### ⏳ Cycle 40: Add Error Code Reference

**Status:** Pending
**Dependencies:** Cycle 36
**Task:** Comprehensive error documentation with solutions
**File:** `web/src/content/docs/error-codes.md`
**Acceptance Criteria:**

- [ ] List all error codes (INVALID_API_KEY, INSUFFICIENT_SCOPES, QUOTA_EXCEEDED, etc.)
- [ ] For each: HTTP status, description, common causes, solutions
- [ ] Searchable (Ctrl+F friendly)
- [ ] Link from error responses in API Explorer

**Example:**

```markdown
### INSUFFICIENT_SCOPES (403)

**Description:** Your API key does not have the required permissions.

**Common Causes:**

- Attempting to write data with a read-only key
- Missing scope for specific resource type

**Solution:**

1. Go to API Keys page
2. Edit key scopes or generate new key with required permissions
3. Required scope for this operation: `entities:write`
```

---

## Frontend Phase: Usage Dashboard (Cycle 41-45)

**Agent:** agent-frontend
**Goal:** Analytics and monitoring for API consumers

### ⏳ Cycle 41: Design Usage Dashboard Wireframe

**Status:** Pending
**Dependencies:** Cycle 30 (Backend API complete)
**Task:** Create wireframe for analytics page
**File:** `one/things/wireframes/usage-dashboard.md`
**Acceptance Criteria:**

- [ ] Layout: Top metrics cards, Charts section, Recent requests table
- [ ] Metrics: Total requests (24h), Average latency, Error rate, Quota usage
- [ ] Charts: Requests over time (line), Top endpoints (bar), Status codes (pie), Latency distribution (histogram)
- [ ] Date range selector (Last 24h, 7 days, 30 days, Custom)
- [ ] Responsive design

### ⏳ Cycle 42: Show Quota Consumption with Progress Bars

**Status:** Pending
**Dependencies:** Cycle 41
**Task:** Visual representation of usage limits
**File:** `web/src/components/features/analytics/QuotaUsage.tsx`
**Acceptance Criteria:**

- [ ] Per-minute quota: "45 / 60 requests (75%)" with progress bar
- [ ] Per-day quota: "2,450 / 10,000 requests (24%)" with progress bar
- [ ] Color-coded: Green (<50%), Yellow (50-80%), Red (>80%)
- [ ] Show time until reset ("Resets in 15 minutes")
- [ ] Warning if nearing limit: "You've used 90% of your daily quota"

### ⏳ Cycle 43: Add Billing Projection

**Status:** Pending
**Dependencies:** Cycle 42
**Task:** Estimate costs based on current usage trends
**File:** `web/src/components/features/analytics/BillingProjection.tsx`
**Acceptance Criteria:**

- [ ] Calculate: (Current daily average) \* 30 = Monthly projection
- [ ] Show projected requests for month
- [ ] Recommend tier upgrade if over limit: "Projected usage: 450K requests/month. Consider upgrading to Pro (100K → 1M requests)"
- [ ] Chart: Usage trend (last 30 days) + forecast (next 30 days)
- [ ] Link to billing/upgrade page

### ⏳ Cycle 44: Create Alert Configuration UI

**Status:** Pending
**Dependencies:** Cycle 42
**Task:** Let users set up usage alerts
**File:** `web/src/components/features/analytics/AlertConfig.tsx`
**Acceptance Criteria:**

- [ ] Alert types: Quota threshold (%), Error rate threshold (%), Latency threshold (ms)
- [ ] Notification channels: Email, Webhook, SMS (future)
- [ ] Thresholds: "Notify me when quota reaches 80%"
- [ ] Test alert button (send sample notification)
- [ ] Save alerts to database (new entity type: `api_alert`)

### ⏳ Cycle 45: Display Top Endpoints by Usage

**Status:** Pending
**Dependencies:** Cycle 41
**Task:** Show which endpoints are most frequently called
**File:** `web/src/components/features/analytics/TopEndpoints.tsx`
**Acceptance Criteria:**

- [ ] Table: Endpoint, Method, Requests (count), Avg Latency, Error Rate (%)
- [ ] Sort by: Requests (desc), Latency (desc), Error rate (desc)
- [ ] Filter by date range
- [ ] Click endpoint to see request samples
- [ ] Export to CSV

---

## Frontend Phase: Developer Onboarding Flow (Cycle 46-50)

**Agent:** agent-frontend
**Goal:** Seamless first-time experience

### ⏳ Cycle 46: Create "Get Started" Wizard

**Status:** Pending
**Dependencies:** Cycle 35 (API key management complete)
**Task:** Multi-step onboarding for new developers
**File:** `web/src/components/features/onboarding/OnboardingWizard.tsx`
**Acceptance Criteria:**

- [ ] Step 1: "Create your organization" (name, description)
- [ ] Step 2: "Generate your first API key" (name, scopes)
- [ ] Step 3: "Make your first API call" (copy-paste cURL example)
- [ ] Step 4: "Choose your SDK" (JS/Python/Go/Ruby links)
- [ ] Progress indicator (1/4, 2/4, etc.)
- [ ] Skip option (save progress, resume later)
- [ ] Confetti animation on completion 🎉

### ⏳ Cycle 47: Add SDK Download Options

**Status:** Pending
**Dependencies:** Cycle 46
**Task:** Provide easy access to official SDKs
**File:** `web/src/components/features/onboarding/SdkDownload.tsx`
**Acceptance Criteria:**

- [ ] SDK cards: JavaScript, Python, Go, Ruby (+ coming soon: Java, PHP)
- [ ] Each card: Logo, install command, quick example, "View Docs" link
- [ ] Install commands: `npm install @one-platform/sdk`, `pip install one-platform`, etc.
- [ ] Copy button for install commands
- [ ] Link to GitHub repositories

### ⏳ Cycle 48: Implement Quick Start Templates

**Status:** Pending
**Dependencies:** Cycle 47
**Task:** Provide boilerplate projects for common use cases
**File:** `web/src/content/templates/`
**Acceptance Criteria:**

- [ ] Templates: "Next.js + ONE Backend", "Express API + ONE", "Python Flask + ONE", "Astro + ONE"
- [ ] Each template: Zip download, GitHub repo link, StackBlitz live demo
- [ ] README with setup instructions
- [ ] Pre-configured API client with placeholder credentials
- [ ] Example: List entities, Create entity, Update entity

### ⏳ Cycle 49: Show Example Applications

**Status:** Pending
**Dependencies:** Cycle 48
**Task:** Showcase real-world apps built on ONE Platform
**File:** `web/src/components/features/onboarding/ExampleApps.tsx`
**Acceptance Criteria:**

- [ ] Gallery: Course platform, E-commerce store, CRM, Chat app, Task manager
- [ ] Each app: Screenshot, description, "Try Demo" button, "View Code" (GitHub)
- [ ] Filter by category: Education, Commerce, Productivity, Social
- [ ] "Submit your app" form (user-generated examples)

### ⏳ Cycle 50: Add Video Tutorials

**Status:** Pending
**Dependencies:** Cycle 46-49
**Task:** Embed walkthrough videos for visual learners
**File:** `web/src/components/features/onboarding/VideoTutorials.tsx`
**Acceptance Criteria:**

- [ ] Videos: "5-minute quick start", "Authentication explained", "Building your first feature", "Advanced: Webhooks"
- [ ] Embedded player (YouTube or self-hosted)
- [ ] Chapters/timestamps for skipping
- [ ] Transcripts available (accessibility)
- [ ] "Suggest a topic" form

---

## Quality Phase: Unit Tests (Cycle 51-55)

**Agent:** agent-quality
**Goal:** Test individual components

### ⏳ Cycle 51: Test API Key Generation

**Status:** Pending
**Dependencies:** Cycle 16-20 (Auth service complete)
**Task:** Validate key generation logic
**File:** `backend/convex/mutations/api-keys.test.ts`
**Acceptance Criteria:**

- [ ] Test: Keys are cryptographically random (entropy check)
- [ ] Test: No key collisions after 10,000 generations
- [ ] Test: Keys match format `org_{orgId}_key_{random}`
- [ ] Test: Keys hashed before storage (bcrypt/Argon2)
- [ ] Test: Full key returned only once
- [ ] Test: Prefix stored in plaintext for display
- [ ] All tests pass (100%)

### ⏳ Cycle 52: Test Scope Validation

**Status:** Pending
**Dependencies:** Cycle 18 (Scope system complete)
**Task:** Verify permission checks work correctly
**File:** `backend/convex/lib/api-auth.test.ts`
**Acceptance Criteria:**

- [ ] Test: `entities:write` grants `entities:read` (hierarchy)
- [ ] Test: `entities:read` does NOT grant `entities:write`
- [ ] Test: Wildcard `entities:*` grants all entity operations
- [ ] Test: Missing scope returns 403 Forbidden
- [ ] Test: Invalid scope format rejected
- [ ] All tests pass (100%)

### ⏳ Cycle 53: Test Rate Limiting

**Status:** Pending
**Dependencies:** Cycle 19 (Rate limiter complete)
**Task:** Ensure quotas enforced correctly
**File:** `backend/convex/lib/rate-limit.test.ts`
**Acceptance Criteria:**

- [ ] Test: 61st request in minute returns 429
- [ ] Test: Request succeeds after window resets
- [ ] Test: Daily limit enforced independently
- [ ] Test: Different tiers have different limits
- [ ] Test: Burst handling (all 60 requests in 1 second)
- [ ] Test: `Retry-After` header present in 429 response
- [ ] All tests pass (100%)

### ⏳ Cycle 54: Test Group Isolation

**Status:** Pending
**Dependencies:** Cycle 21-24 (Group scoping complete)
**Task:** Validate no data leakage between organizations
**File:** `backend/convex/lib/group-scoping.test.ts`
**Acceptance Criteria:**

- [ ] Test: Org A cannot read Org B's entities
- [ ] Test: Org A cannot update Org B's entities
- [ ] Test: Org A cannot delete Org B's entities
- [ ] Test: Connection queries don't cross org boundaries
- [ ] Test: Event logs filtered by org
- [ ] Test: Knowledge search scoped to org
- [ ] All tests pass (100%) - CRITICAL for security

### ⏳ Cycle 55: Test Key Rotation

**Status:** Pending
**Dependencies:** Cycle 20 (Key rotation complete)
**Task:** Verify seamless key rotation
**File:** `backend/convex/mutations/api-keys.test.ts`
**Acceptance Criteria:**

- [ ] Test: Both old and new keys valid during grace period
- [ ] Test: Old key revoked after grace period expires
- [ ] Test: Email notification sent before old key expires
- [ ] Test: New key has same scopes as old key
- [ ] Test: `rotateApiKey` logs appropriate events
- [ ] All tests pass (100%)

---

## Quality Phase: Integration Tests (Cycle 56-60)

**Agent:** agent-quality
**Goal:** Test end-to-end flows

### ⏳ Cycle 56: Test Full Authentication Flow

**Status:** Pending
**Dependencies:** Cycle 51-55 (Unit tests complete)
**Task:** Validate complete auth flow from key to scoped request
**File:** `backend/convex/integration/auth-flow.test.ts`
**Acceptance Criteria:**

- [ ] Test: Generate key → Make request → Verify success
- [ ] Test: Invalid key → 401 Unauthorized
- [ ] Test: Expired key → 401 Unauthorized
- [ ] Test: Revoked key → 401 Unauthorized
- [ ] Test: Insufficient scopes → 403 Forbidden
- [ ] Test: Valid request logs event
- [ ] All tests pass (100%)

### ⏳ Cycle 57: Test Multi-Tenant Isolation

**Status:** Pending
**Dependencies:** Cycle 56
**Task:** Comprehensive cross-org security tests
**File:** `backend/convex/integration/multi-tenant.test.ts`
**Acceptance Criteria:**

- [ ] Test: Create entity in Org A, verify not visible to Org B
- [ ] Test: Attempt to read Org B entity with Org A key → 404
- [ ] Test: Attempt to update Org B entity with Org A key → 404
- [ ] Test: Attempt to delete Org B entity with Org A key → 404
- [ ] Test: Connection creation across orgs blocked
- [ ] Test: Event queries don't leak cross-org data
- [ ] All tests pass (100%) - CRITICAL for security

### ⏳ Cycle 58: Test Rate Limit Enforcement

**Status:** Pending
**Dependencies:** Cycle 56
**Task:** Validate rate limiting under real load
**File:** `backend/convex/integration/rate-limits.test.ts`
**Acceptance Criteria:**

- [ ] Test: Send 60 requests in 1 minute → All succeed
- [ ] Test: Send 61st request → 429 Too Many Requests
- [ ] Test: Wait for window reset → Next request succeeds
- [ ] Test: Daily limit enforced after per-minute resets
- [ ] Test: Different keys have independent limits
- [ ] Test: `quota_exceeded` event logged
- [ ] All tests pass (100%)

### ⏳ Cycle 59: Test Webhook Delivery

**Status:** Pending
**Dependencies:** Cycle 30 (Webhook system complete)
**Task:** Validate event delivery to customer endpoints
**File:** `backend/convex/integration/webhooks.test.ts`
**Acceptance Criteria:**

- [ ] Test: Register webhook → Receive verification event
- [ ] Test: Create entity → Webhook receives `entity_created` event
- [ ] Test: Webhook payload includes HMAC signature
- [ ] Test: Failed delivery retries 3 times with exponential backoff
- [ ] Test: Webhook logs show delivery attempts
- [ ] All tests pass (100%)

### ⏳ Cycle 60: Test Concurrent Requests

**Status:** Pending
**Dependencies:** Cycle 56-59
**Task:** Ensure no race conditions or deadlocks
**File:** `backend/convex/integration/concurrency.test.ts`
**Acceptance Criteria:**

- [ ] Test: 100 concurrent entity creates → All succeed
- [ ] Test: Concurrent rate limit checks → Accurate counting
- [ ] Test: Concurrent key rotations → No collisions
- [ ] Test: Database transactions isolated (no dirty reads)
- [ ] Test: No deadlocks detected
- [ ] All tests pass (100%)

---

## Quality Phase: Security Tests (Cycle 61-65)

**Agent:** agent-quality
**Goal:** Penetration testing and vulnerability scanning

### ⏳ Cycle 61: Test Key Brute Force Protection

**Status:** Pending
**Dependencies:** Cycle 56-60 (Integration tests complete)
**Task:** Validate resistance to key guessing attacks
**File:** `backend/convex/security/brute-force.test.ts`
**Acceptance Criteria:**

- [ ] Test: 10 invalid key attempts → Temporary IP ban (5 minutes)
- [ ] Test: Rate limiter independent of main API rate limits
- [ ] Test: CAPTCHA challenge after 5 failed attempts (future)
- [ ] Test: `api_auth_failed` events logged with IP
- [ ] Test: Admin notification if >100 failed attempts from single IP
- [ ] All tests pass (100%)

### ⏳ Cycle 62: Test SQL Injection Attempts

**Status:** Pending
**Dependencies:** Cycle 61
**Task:** Verify Convex's built-in protection (should be safe by design)
**File:** `backend/convex/security/injection.test.ts`
**Acceptance Criteria:**

- [ ] Test: Malicious input in entity name (e.g., `'; DROP TABLE entities; --`)
- [ ] Test: Malicious input in query parameters
- [ ] Test: Malicious input in properties field (arbitrary JSON)
- [ ] Test: No data corruption or deletion
- [ ] Test: Inputs sanitized/escaped in responses
- [ ] All tests pass (100%)

### ⏳ Cycle 63: Test Unauthorized Scope Escalation

**Status:** Pending
**Dependencies:** Cycle 61-62
**Task:** Ensure users can't grant themselves additional scopes
**File:** `backend/convex/security/scope-escalation.test.ts`
**Acceptance Criteria:**

- [ ] Test: Attempt to modify API key scopes via API → 403 Forbidden
- [ ] Test: Attempt to create key with admin scopes using non-admin key → 403
- [ ] Test: Attempt to access `api_keys:manage` endpoint without scope → 403
- [ ] Test: Scope verification happens before all operations
- [ ] Test: Scope tampering in request headers ignored
- [ ] All tests pass (100%)

### ⏳ Cycle 64: Test Expired Key Handling

**Status:** Pending
**Dependencies:** Cycle 61-63
**Task:** Validate expired keys immediately rejected
**File:** `backend/convex/security/expiration.test.ts`
**Acceptance Criteria:**

- [ ] Test: Key expires at exact timestamp → Next request fails
- [ ] Test: Expired key returns 401 with clear message: "API key expired on {date}"
- [ ] Test: Expired keys cleaned up automatically (daily cron)
- [ ] Test: Email notification sent 7 days before expiration
- [ ] Test: Renewal flow works (extend expiration)
- [ ] All tests pass (100%)

### ⏳ Cycle 65: Penetration Testing (OWASP Top 10)

**Status:** Pending
**Dependencies:** Cycle 61-64
**Task:** External security audit against OWASP Top 10
**File:** `one/events/security-audit-report.md`
**Acceptance Criteria:**

- [ ] Test: Broken Access Control (A01:2021) → No vulnerabilities
- [ ] Test: Cryptographic Failures (A02:2021) → Keys hashed, HTTPS enforced
- [ ] Test: Injection (A03:2021) → Convex safe by design
- [ ] Test: Insecure Design (A04:2021) → Rate limiting, key rotation implemented
- [ ] Test: Security Misconfiguration (A05:2021) → No default keys, proper CORS
- [ ] Test: All other OWASP categories → No critical/high vulnerabilities
- [ ] Report: No critical vulnerabilities, recommendations for improvements

---

## Quality Phase: Performance Tests (Cycle 66-70)

**Agent:** agent-quality
**Goal:** Validate performance under load

### ⏳ Cycle 66: Load Test (10K Requests/Minute)

**Status:** Pending
**Dependencies:** Cycle 61-65 (Security tests complete)
**Task:** Simulate high traffic and measure performance
**File:** `backend/convex/performance/load-test.ts`
**Acceptance Criteria:**

- [ ] Test: Sustained 10,000 req/min for 10 minutes
- [ ] Test: All requests complete successfully
- [ ] Test: No timeouts or connection errors
- [ ] Test: Database performance stable (no degradation)
- [ ] Test: CPU/memory usage within acceptable limits
- [ ] Test: Convex functions scale automatically
- [ ] Pass: 99.9% success rate

### ⏳ Cycle 67: Latency Testing (p50, p95, p99)

**Status:** Pending
**Dependencies:** Cycle 66
**Task:** Measure response times at different percentiles
**File:** `backend/convex/performance/latency-test.ts`
**Acceptance Criteria:**

- [ ] Measure: 10,000 API requests under normal load
- [ ] Target: p50 < 100ms, p95 < 200ms, p99 < 500ms
- [ ] Breakdown by endpoint (entities, connections, events)
- [ ] Identify slowest queries for optimization
- [ ] Compare: Cold start vs warm cache performance
- [ ] Pass: All targets met

### ⏳ Cycle 68: Database Query Optimization

**Status:** Pending
**Dependencies:** Cycle 67
**Task:** Optimize slow queries identified in latency tests
**File:** `backend/convex/queries/` (various files)
**Acceptance Criteria:**

- [ ] Add indexes for frequently queried fields
- [ ] Optimize N+1 query patterns (batch fetches)
- [ ] Cache frequently accessed data (Redis/Convex caching)
- [ ] Paginate large result sets
- [ ] Use Convex's `withIndex()` for fast lookups
- [ ] Re-run latency tests → 20% improvement

### ⏳ Cycle 69: CDN Caching Strategy

**Status:** Pending
**Dependencies:** Cycle 68
**Task:** Implement edge caching for static/semi-static data
**File:** `backend/convex/http.ts` (add cache headers)
**Acceptance Criteria:**

- [ ] Cache GET requests for public data (e.g., API docs)
- [ ] Set `Cache-Control` headers (e.g., `max-age=3600` for 1 hour)
- [ ] Vary caching by API key (private data never cached)
- [ ] Implement cache invalidation on data changes
- [ ] Test: Cached requests return instantly (<10ms)
- [ ] Pass: 50% cache hit rate for eligible requests

### ⏳ Cycle 70: Connection Pooling Validation

**Status:** Pending
**Dependencies:** Cycle 66-69
**Task:** Ensure efficient connection reuse
**File:** `backend/convex/lib/connection-pool.ts`
**Acceptance Criteria:**

- [ ] Test: 1,000 concurrent requests reuse connections
- [ ] Test: No connection leaks (all connections closed)
- [ ] Test: Connection pool size scales with load
- [ ] Monitor: Connection pool metrics (active, idle, waiting)
- [ ] Optimize: Pool size configuration
- [ ] Pass: Zero connection errors under load

---

## SDK Phase: Official SDKs (Cycle 71-75)

**Agent:** agent-builder
**Goal:** Create client libraries for popular languages

### ⏳ Cycle 71: JavaScript/TypeScript SDK

**Status:** Pending
**Dependencies:** Cycle 30 (API Gateway complete)
**Task:** Build npm package for Node.js and browsers
**File:** `sdk/javascript/`
**Acceptance Criteria:**

- [ ] Package: `@one-platform/sdk` on npm
- [ ] Support: Node.js 18+, browsers (via bundler)
- [ ] Features: Full TypeScript types, tree-shakeable, ESM + CJS
- [ ] Methods: `client.entities.create()`, `.list()`, `.get()`, `.update()`, `.delete()`
- [ ] Same for connections, events, groups
- [ ] Authentication: Constructor accepts `apiKey`, `organizationId`
- [ ] Error handling: Typed error classes (`ApiError`, `AuthError`, `RateLimitError`)
- [ ] Tests: 100% coverage
- [ ] Docs: README, API reference, examples

**Example:**

```typescript
import { OneClient } from "@one-platform/sdk";

const client = new OneClient({
  apiKey: process.env.ONE_API_KEY,
  organizationId: "org_abc123",
});

const course = await client.entities.create({
  type: "course",
  name: "Introduction to AI",
  properties: { price: 49.99 },
});
```

### ⏳ Cycle 72: Python SDK

**Status:** Pending
**Dependencies:** Cycle 71
**Task:** Build PyPI package for Python developers
**File:** `sdk/python/`
**Acceptance Criteria:**

- [ ] Package: `one-platform` on PyPI
- [ ] Support: Python 3.8+
- [ ] Features: Type hints (mypy compatible), async support (asyncio)
- [ ] Methods: `client.entities.create()`, `.list()`, `.get()`, `.update()`, `.delete()`
- [ ] Authentication: Constructor accepts `api_key`, `organization_id`
- [ ] Error handling: Custom exceptions (`ApiError`, `AuthError`, `RateLimitError`)
- [ ] Tests: pytest, 100% coverage
- [ ] Docs: README, Sphinx API reference, examples

**Example:**

```python
from one_platform import OneClient

client = OneClient(
    api_key=os.environ['ONE_API_KEY'],
    organization_id='org_abc123'
)

course = client.entities.create(
    type='course',
    name='Introduction to AI',
    properties={'price': 49.99}
)
```

### ⏳ Cycle 73: Go SDK

**Status:** Pending
**Dependencies:** Cycle 72
**Task:** Build Go module for Go developers
**File:** `sdk/go/`
**Acceptance Criteria:**

- [ ] Module: `github.com/one-platform/go-sdk`
- [ ] Support: Go 1.21+
- [ ] Features: Context support, generics, idiomatic error handling
- [ ] Methods: `client.Entities.Create()`, `.List()`, `.Get()`, `.Update()`, `.Delete()`
- [ ] Authentication: `NewClient(apiKey, organizationID string)`
- [ ] Error handling: Typed errors (`*ApiError`, `*AuthError`, `*RateLimitError`)
- [ ] Tests: `go test`, 100% coverage
- [ ] Docs: README, GoDoc, examples

**Example:**

```go
import "github.com/one-platform/go-sdk"

client := onesdk.NewClient(
    os.Getenv("ONE_API_KEY"),
    "org_abc123",
)

course, err := client.Entities.Create(ctx, &onesdk.Entity{
    Type: "course",
    Name: "Introduction to AI",
    Properties: map[string]any{"price": 49.99},
})
```

### ⏳ Cycle 74: Ruby SDK

**Status:** Pending
**Dependencies:** Cycle 73
**Task:** Build gem for Ruby developers
**File:** `sdk/ruby/`
**Acceptance Criteria:**

- [ ] Gem: `one-platform` on RubyGems
- [ ] Support: Ruby 3.0+
- [ ] Features: Idiomatic Ruby (snake_case), blocks for configuration
- [ ] Methods: `client.entities.create`, `.list`, `.get`, `.update`, `.delete`
- [ ] Authentication: `OnePlatform::Client.new(api_key:, organization_id:)`
- [ ] Error handling: Custom exceptions (`ApiError`, `AuthError`, `RateLimitError`)
- [ ] Tests: RSpec, 100% coverage
- [ ] Docs: README, YARD API reference, examples

**Example:**

```ruby
require 'one_platform'

client = OnePlatform::Client.new(
  api_key: ENV['ONE_API_KEY'],
  organization_id: 'org_abc123'
)

course = client.entities.create(
  type: 'course',
  name: 'Introduction to AI',
  properties: { price: 49.99 }
)
```

### ⏳ Cycle 75: Add Type Definitions (Full TypeScript Support)

**Status:** Pending
**Dependencies:** Cycle 71-74
**Task:** Generate TypeScript definitions for all SDKs
**File:** `sdk/types/` (shared type definitions)
**Acceptance Criteria:**

- [ ] Shared types: `Entity`, `Connection`, `Event`, `Group`, `ApiKey`
- [ ] All entity types (66+) as discriminated unions
- [ ] All connection types (25+) with proper generics
- [ ] Error types with discriminated unions
- [ ] Export types from all SDKs (`@one-platform/sdk/types`)
- [ ] IntelliSense support in VS Code
- [ ] TypeScript strict mode compatible

---

## SDK Phase: CLI Tool (Cycle 76-80)

**Agent:** agent-builder
**Goal:** Command-line tool for API management

### ⏳ Cycle 76: Create `oneie` CLI for API Management

**Status:** Pending
**Dependencies:** Cycle 71 (JS SDK complete)
**Task:** Build command-line tool using Node.js
**File:** `cli/`
**Acceptance Criteria:**

- [ ] Package: `oneie` (already exists, extend with API commands)
- [ ] Commands: `oneie api:*` subcommands
- [ ] Authentication: Config file `~/.oneie/config.json` with API key
- [ ] Auto-completion: Bash, Zsh, Fish support
- [ ] Colored output (chalk or similar)
- [ ] Tests: CLI integration tests
- [ ] Docs: `oneie help api`

### ⏳ Cycle 77: Add Commands (keys:create, keys:list, keys:revoke)

**Status:** Pending
**Dependencies:** Cycle 76
**Task:** Implement API key management commands
**File:** `cli/commands/api/keys.ts`
**Acceptance Criteria:**

- [ ] `oneie api:keys:create` - Interactive wizard (name, scopes, expiration)
- [ ] `oneie api:keys:list` - Table of all keys (name, prefix, scopes, status)
- [ ] `oneie api:keys:revoke` - Revoke key by prefix (confirmation prompt)
- [ ] `oneie api:keys:show [prefix]` - Show detailed key info
- [ ] All commands use SDK internally
- [ ] Proper error handling (friendly messages)

**Example:**

```bash
$ oneie api:keys:create
? Key name: Production API
? Scopes: entities:read, entities:write, connections:read
? Expiration: Never
✅ API key created: org_abc123_key_xyz789
⚠️  Save this key now. You won't see it again.
```

### ⏳ Cycle 78: Implement `oneie test` for Endpoint Testing

**Status:** Pending
**Dependencies:** Cycle 77
**Task:** Interactive endpoint tester in CLI
**File:** `cli/commands/api/test.ts`
**Acceptance Criteria:**

- [ ] `oneie api:test` - Interactive mode (select endpoint, enter params, see response)
- [ ] `oneie api:test --endpoint=POST:/api/v1/entities --body='{"type":"course"}'` - Non-interactive
- [ ] Pretty-print JSON responses (syntax highlighting)
- [ ] Show: Status code, headers, latency, response size
- [ ] Save requests as templates (`oneie api:test --save=create-course`)
- [ ] Load templates (`oneie api:test --template=create-course`)

**Example:**

```bash
$ oneie api:test
? Endpoint: POST /api/v1/entities
? Body: {"type":"course","name":"AI 101"}
✅ 201 Created (120ms)
{
  "id": "j57abc123..."
}
```

### ⏳ Cycle 79: Add `oneie logs` for Request History

**Status:** Pending
**Dependencies:** Cycle 78
**Task:** View API request logs from CLI
**File:** `cli/commands/api/logs.ts`
**Acceptance Criteria:**

- [ ] `oneie api:logs` - Show recent requests (last 50)
- [ ] `oneie api:logs --tail` - Live streaming logs (like `tail -f`)
- [ ] `oneie api:logs --filter=error` - Only errors
- [ ] `oneie api:logs --endpoint=/api/v1/entities` - Filter by endpoint
- [ ] Display: Timestamp, Method, Endpoint, Status, Latency
- [ ] Color-coded status (green=2xx, yellow=3xx, red=4xx/5xx)

**Example:**

```bash
$ oneie api:logs --tail
[12:34:56] POST /api/v1/entities 201 (120ms)
[12:34:57] GET /api/v1/entities 200 (45ms)
[12:34:58] POST /api/v1/connections 403 (30ms) ❌
```

### ⏳ Cycle 80: Create `oneie deploy` for Webhook Configuration

**Status:** Pending
**Dependencies:** Cycle 79
**Task:** Manage webhook subscriptions from CLI
**File:** `cli/commands/api/webhooks.ts`
**Acceptance Criteria:**

- [ ] `oneie api:webhooks:add` - Register webhook URL (interactive: URL, events)
- [ ] `oneie api:webhooks:list` - Show all webhooks
- [ ] `oneie api:webhooks:test [id]` - Send test event
- [ ] `oneie api:webhooks:logs [id]` - Show delivery attempts
- [ ] `oneie api:webhooks:remove [id]` - Delete webhook
- [ ] Validate webhook endpoint responds correctly

**Example:**

```bash
$ oneie api:webhooks:add
? Webhook URL: https://myapp.com/webhooks
? Events: entity_created, entity_updated
✅ Webhook created (ID: wh_123)
📤 Sending test event...
✅ Test event delivered successfully
```

---

## Operations Phase: Monitoring & Observability (Cycle 81-85)

**Agent:** agent-ops
**Goal:** Production monitoring setup

### ⏳ Cycle 81: Set Up API Metrics Dashboard

**Status:** Pending
**Dependencies:** Cycle 70 (Performance tests complete)
**Task:** Create real-time monitoring dashboard
**Tool:** Grafana or Datadog
**Acceptance Criteria:**

- [ ] Metrics: Requests/second, Latency (p50/p95/p99), Error rate (%), Active connections
- [ ] Graphs: Time series (last 24h, 7d, 30d), heatmaps (latency distribution)
- [ ] Breakdown: By endpoint, by organization, by status code
- [ ] Alerts: High error rate (>5%), high latency (p95 >500ms), downtime
- [ ] Dashboard accessible to internal team + customers (separate views)

### ⏳ Cycle 82: Add Error Tracking (Sentry Integration)

**Status:** Pending
**Dependencies:** Cycle 81
**Task:** Track and triage backend errors
**Tool:** Sentry
**Acceptance Criteria:**

- [ ] Install `@sentry/node` in backend
- [ ] Capture all 500 errors automatically
- [ ] Capture rate limit errors (for analysis)
- [ ] Group errors by type (auth failures, database errors, etc.)
- [ ] Include: Stack trace, request context, user context (orgId)
- [ ] Alert: Slack notification for critical errors
- [ ] Integration: Link Sentry issues to GitHub issues

### ⏳ Cycle 83: Configure Uptime Monitoring (Status Page)

**Status:** Pending
**Dependencies:** Cycle 81-82
**Task:** Public status page for API health
**Tool:** Statuspage.io or custom
**Acceptance Criteria:**

- [ ] Status page: `status.one.ie`
- [ ] Components: API Gateway, Database, Authentication, Webhooks
- [ ] Incidents: Automatic creation from alerting system
- [ ] Uptime: 99.9% SLA tracking (last 30d, 90d)
- [ ] Subscribe: Email/SMS/Slack notifications
- [ ] History: Past incidents with postmortems

### ⏳ Cycle 84: Create Alerting Rules

**Status:** Pending
**Dependencies:** Cycle 81-83
**Task:** Define when to notify team of issues
**File:** `infrastructure/alerts.yml`
**Acceptance Criteria:**

- [ ] Alert: Error rate >5% for 5 minutes → Page on-call engineer
- [ ] Alert: Latency p95 >500ms for 10 minutes → Slack notification
- [ ] Alert: Uptime <99.9% → Incident created automatically
- [ ] Alert: Rate limit hit by >10 orgs in 1 minute → Investigate (potential attack)
- [ ] Alert: Quota exceeded by enterprise customer → Notify sales team
- [ ] Escalation: If not acknowledged in 15 minutes, escalate to manager

### ⏳ Cycle 85: Implement Distributed Tracing

**Status:** Pending
**Dependencies:** Cycle 81-84
**Task:** Trace requests across services for debugging
**Tool:** OpenTelemetry + Jaeger/Zipkin
**Acceptance Criteria:**

- [ ] Install OpenTelemetry SDK
- [ ] Trace: API Gateway → Auth → Database → Response
- [ ] Span details: Function name, duration, input/output
- [ ] Propagate trace IDs across service boundaries
- [ ] Visualize: Flame graphs for slow requests
- [ ] Retention: 7 days of traces

---

## Operations Phase: Documentation & Knowledge Base (Cycle 86-90)

**Agent:** agent-documenter
**Goal:** Comprehensive documentation for developers

### ⏳ Cycle 86: Write Comprehensive API Reference

**Status:** Pending
**Dependencies:** Cycle 30 (API Gateway complete)
**Task:** Generate OpenAPI/Swagger spec from code
**File:** `backend/convex/openapi.yaml`
**Acceptance Criteria:**

- [ ] OpenAPI 3.0 spec with all endpoints
- [ ] For each endpoint: Path, method, parameters, request body, responses (200/400/401/403/404/429/500)
- [ ] Examples for each endpoint
- [ ] Authentication scheme (Bearer token)
- [ ] Rate limiting headers documented
- [ ] Generate from code comments (annotations)
- [ ] Validate: No broken links, all examples valid

### ⏳ Cycle 87: Create Developer Guides

**Status:** Pending
**Dependencies:** Cycle 86
**Task:** Write prose guides for common workflows
**File:** `web/src/content/docs/guides/`
**Acceptance Criteria:**

- [ ] Guide: "Getting Started with ONE API" (5-minute tutorial)
- [ ] Guide: "Authentication Best Practices" (key rotation, scoping)
- [ ] Guide: "Building Multi-Tenant Apps" (group hierarchy patterns)
- [ ] Guide: "Webhooks Deep Dive" (setup, security, debugging)
- [ ] Guide: "Rate Limiting & Quotas" (understanding limits, upgrading tiers)
- [ ] All guides: Step-by-step, code examples, troubleshooting section

### ⏳ Cycle 88: Add Troubleshooting Runbook

**Status:** Pending
**Dependencies:** Cycle 87
**Task:** Solutions for common issues
**File:** `web/src/content/docs/troubleshooting.md`
**Acceptance Criteria:**

- [ ] Issue: "401 Unauthorized" → Check key validity, expiration, revocation status
- [ ] Issue: "403 Forbidden" → Check scopes, verify endpoint requires correct scope
- [ ] Issue: "429 Too Many Requests" → Explain rate limits, show how to check quota
- [ ] Issue: "Slow requests" → Optimization tips (pagination, filtering, caching)
- [ ] Issue: "Webhook not receiving events" → Verify URL, check logs, test endpoint
- [ ] Each issue: Symptoms, causes, step-by-step solution

### ⏳ Cycle 89: Generate SDK Documentation

**Status:** Pending
**Dependencies:** Cycle 71-75 (SDKs complete)
**Task:** Auto-generate docs from code comments
**File:** `sdk/docs/`
**Acceptance Criteria:**

- [ ] JavaScript/TypeScript: TypeDoc-generated docs
- [ ] Python: Sphinx-generated docs
- [ ] Go: GoDoc-generated docs
- [ ] Ruby: YARD-generated docs
- [ ] Hosted: `docs.one.ie/sdk/javascript`, `/python`, `/go`, `/ruby`
- [ ] Searchable: Full-text search across all SDK docs

### ⏳ Cycle 90: Create Migration Guides (v1 → v2)

**Status:** Pending
**Dependencies:** Cycle 86-89
**Task:** Future-proofing for API versioning
**File:** `web/src/content/docs/migrations/`
**Acceptance Criteria:**

- [ ] Guide: "Migrating from v1 to v2" (when v2 released)
- [ ] Breaking changes documented
- [ ] Side-by-side code comparisons
- [ ] Deprecation timeline (v1 supported for 12 months)
- [ ] Automated migration tool (CLI command)
- [ ] For now: Placeholder guide explaining versioning strategy

---

## Operations Phase: Deployment & CI/CD (Cycle 91-95)

**Agent:** agent-ops
**Goal:** Automated deployment pipeline

### ⏳ Cycle 91: Configure Cloudflare Workers for API Gateway

**Status:** Pending
**Dependencies:** Cycle 85 (Monitoring setup complete)
**Task:** Deploy API Gateway to Cloudflare's edge network
**File:** `backend/wrangler.toml`
**Acceptance Criteria:**

- [ ] Cloudflare Workers route: `api.one.ie/*`
- [ ] Edge caching: Cache-Control headers for GET requests
- [ ] DDoS protection: Cloudflare's automatic mitigation
- [ ] Rate limiting: Cloudflare rate limiting + backend rate limiting (layered)
- [ ] SSL/TLS: HTTPS enforced, TLS 1.3
- [ ] Deploy: `wrangler deploy` from CI/CD

### ⏳ Cycle 92: Set Up Convex HTTP Endpoints

**Status:** Pending
**Dependencies:** Cycle 91
**Task:** Configure Convex to handle HTTP traffic
**File:** `backend/convex/http.ts`
**Acceptance Criteria:**

- [ ] HTTP routes registered: All `/api/v1/*` endpoints
- [ ] CORS configured: Allow all origins (or whitelist customer domains)
- [ ] Request validation: Schema validation for all inputs
- [ ] Response formatting: Consistent JSON structure
- [ ] Error handling: Proper HTTP status codes
- [ ] Deploy: `npx convex deploy` from CI/CD

### ⏳ Cycle 93: Implement Blue-Green Deployment

**Status:** Pending
**Dependencies:** Cycle 92
**Task:** Zero-downtime deployment strategy
**File:** `.github/workflows/deploy-api.yml`
**Acceptance Criteria:**

- [ ] Two environments: Blue (current production), Green (new version)
- [ ] Deploy new version to Green environment
- [ ] Run smoke tests on Green (health checks)
- [ ] Switch traffic: Blue → Green (Cloudflare Workers routing)
- [ ] Monitor: If error rate spikes, rollback to Blue
- [ ] Rollback: Automated, <1 minute to revert

### ⏳ Cycle 94: Add Automated Testing in CI

**Status:** Pending
**Dependencies:** Cycle 93
**Task:** Run all tests on every commit
**File:** `.github/workflows/test-api.yml`
**Acceptance Criteria:**

- [ ] Trigger: Every push to main, every PR
- [ ] Tests: Unit tests, integration tests, security tests
- [ ] Coverage: Fail if coverage drops below 90%
- [ ] Linting: ESLint, Prettier, TypeScript strict mode
- [ ] Build: Ensure `npx convex deploy --dry-run` succeeds
- [ ] Notify: Slack notification if tests fail

### ⏳ Cycle 95: Create Rollback Procedures

**Status:** Pending
**Dependencies:** Cycle 93-94
**Task:** Define process for reverting bad deployments
**File:** `one/knowledge/rollback-procedures.md`
**Acceptance Criteria:**

- [ ] Automatic rollback: If error rate >10% after deploy, rollback immediately
- [ ] Manual rollback: `oneie api:rollback` command (CLI)
- [ ] Rollback: Switch Cloudflare routing back to previous version
- [ ] Database migrations: Reversible (use Convex's schema versioning)
- [ ] Postmortem: Required after every rollback (document in `one/events/`)
- [ ] Test rollback: Quarterly drill to ensure process works

---

## Launch Phase: Final Steps (Cycle 96-100)

**Agent:** agent-director
**Goal:** Security audit, load testing, launch

### ⏳ Cycle 96: Conduct Security Audit (External Firm)

**Status:** Pending
**Dependencies:** Cycle 61-65 (Security tests complete)
**Task:** Hire external security firm for audit
**File:** `one/events/security-audit-final-report.md`
**Acceptance Criteria:**

- [ ] Audit scope: API authentication, authorization, data isolation, rate limiting
- [ ] Audit duration: 2 weeks
- [ ] Deliverable: Report with findings (critical/high/medium/low)
- [ ] Fix: All critical and high vulnerabilities before launch
- [ ] Re-test: Verify fixes with auditors
- [ ] Certificate: Security audit badge for marketing

### ⏳ Cycle 97: Perform Load Testing at Scale

**Status:** Pending
**Dependencies:** Cycle 66-70 (Performance tests complete)
**Task:** Validate production capacity with realistic traffic
**File:** `one/events/load-test-production-report.md`
**Acceptance Criteria:**

- [ ] Test: 100,000 requests/minute for 1 hour (10x expected launch traffic)
- [ ] Test: 1,000 concurrent organizations
- [ ] Test: Burst traffic (10,000 req in 1 second)
- [ ] Pass: 99.9% success rate, p95 latency <200ms, no errors
- [ ] Capacity planning: Document max capacity and scaling thresholds
- [ ] Auto-scaling: Convex scales automatically (verify)

### ⏳ Cycle 98: Create Onboarding Materials for First 10 Customers

**Status:** Pending
**Dependencies:** Cycle 46-50 (Onboarding flow complete)
**Task:** Personalized onboarding for early adopters
**File:** `one/events/early-customer-onboarding.md`
**Acceptance Criteria:**

- [ ] Materials: Welcome email, 1-on-1 onboarding call, custom integration support
- [ ] Beta program: Free Pro tier for 3 months
- [ ] Feedback: Weekly surveys to gather product feedback
- [ ] Slack channel: Private channel with engineering team
- [ ] Success metrics: All 10 customers make >100 API calls within 1 week
- [ ] Case studies: Write 2-3 case studies from early customers

### ⏳ Cycle 99: Write Launch Announcement

**Status:** Pending
**Dependencies:** Cycle 96-98 (All pre-launch tasks complete)
**Task:** Create launch announcement and marketing materials
**File:** `one/events/api-launch-announcement.md`
**Acceptance Criteria:**

- [ ] Blog post: "Introducing ONE Platform Backend API"
- [ ] Content: Vision, features, pricing, getting started
- [ ] Channels: X (Twitter), LinkedIn, Product Hunt, Hacker News, Dev.to
- [ ] Video: 2-minute demo screencast
- [ ] Press release: Send to tech publications (TechCrunch, The Verge, etc.)
- [ ] Launch date: Announce date and countdown

### ⏳ Cycle 100: Mark Feature Complete and Notify Stakeholders

**Status:** Pending
**Dependencies:** Cycle 99 (Launch announcement complete)
**Task:** Final sign-off and handoff
**File:** `one/events/api-feature-complete.md`
**Acceptance Criteria:**

- [ ] All 100 cycles complete ✅
- [ ] All tests passing (unit, integration, security, performance) ✅
- [ ] Documentation complete (API reference, guides, SDKs) ✅
- [ ] Monitoring setup (dashboards, alerts, status page) ✅
- [ ] Security audit passed (no critical vulnerabilities) ✅
- [ ] Load testing passed (100K req/min sustained) ✅
- [ ] Launch announcement published ✅
- [ ] Notify stakeholders: Engineering team, sales team, customers
- [ ] Celebrate! 🎉

---

## Summary Statistics

**Total Cycles:** 100
**Estimated Duration:** 60-90 days (with parallelization)
**Agents Involved:** 7 (director, backend, frontend, designer, quality, builder, ops, documenter, problem-solver)
**New Entity Types:** 4 (api_key, api_application, service_account, api_quota)
**New Connection Types:** 4 (owns_api_key, authenticated_by, belongs_to_org, has_quota)
**New Event Types:** 6 (api_key_generated, api_key_revoked, api_request_made, quota_exceeded, api_auth_failed, api_application_registered)
**Test Coverage:** 90%+ (300+ test cases)
**Security Audit:** External firm, OWASP Top 10
**Performance Targets:** p95 <200ms, 99.9% uptime, 100K req/min sustained

---

## Next Steps

1. **Start Execution:** Run `/next` to begin Cycle 1
2. **Review Plan:** Use `/plan` to see full breakdown
3. **Assign Agents:** Agents will be automatically assigned based on cycle type
4. **Track Progress:** Use `/now` to see current cycle, `/done` to mark complete
5. **Monitor Quality:** agent-quality will continuously validate ontology alignment

**Ready to begin? Type `/next` to start Cycle 1!**
