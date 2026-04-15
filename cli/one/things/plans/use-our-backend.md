---
title: Use Our Backend
dimension: things
category: plans
tags: backend, convex, groups, ontology
related_dimensions: events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/use-our-backend.md
  Purpose: Documents backend api service implementation plan
  Related dimensions: events, groups, knowledge, people
  For AI agents: Read this to understand use our backend.
---

# Backend API Service Implementation Plan

**Feature:** External API Access to ONE Platform Backend
**Version:** 1.0.0
**Status:** Planning
**Created:** 2025-10-30

## Executive Summary

Transform the ONE Platform backend into a consumable API service that allows external applications to leverage the 6-dimension ontology through secure API keys. This enables developers to build applications on top of the ONE Platform without managing their own backend infrastructure.

## Vision

**"Backend-as-a-Service for the 6-Dimension Ontology"**

Developers should be able to:

1. Register their organization
2. Receive API credentials (endpoint URL, org ID, API key)
3. Make authenticated requests to access all backend features
4. Automatically benefit from multi-tenant isolation via groups
5. Scale from prototype to production without infrastructure changes

## 6-Dimension Ontology Mapping

### 1. Groups (Multi-Tenant Isolation)

- **Primary Use:** Each API consumer gets their own top-level group (organization)
- **Hierarchical Structure:** API consumers can create sub-groups for their own multi-tenant needs
- **Data Scoping:** All API requests automatically scoped to the authenticated organization's groupId
- **Access Control:** API keys tied to specific groups, enforcing complete data isolation

### 2. People (Authorization & Roles)

- **API Key Owners:** People with role `org_owner` who can generate/revoke API keys
- **Service Accounts:** Special "people" entities representing API applications
- **Permission Levels:** Read-only, read-write, admin (determined by API key scopes)
- **Audit Trail:** All API actions attributed to the service account (person) making the request

### 3. Things (API Resources)

New entity types:

- `api_key` - API credentials with scopes and rate limits
- `api_application` - Registered application consuming the API
- `api_quota` - Usage limits and billing tier
- `service_account` - Non-human actor for API requests

Existing entity types accessible via API:

- All 66+ existing entity types available through authenticated endpoints

### 4. Connections (Relationships)

New connection types:

- `owns_api_key` - Links person (org_owner) to api_key
- `authenticated_by` - Links api_application to api_key
- `belongs_to_org` - Links api_application to organization (group)
- `has_quota` - Links api_application to api_quota

### 5. Events (Audit & Analytics)

New event types:

- `api_key_generated` - New API key created
- `api_key_revoked` - API key invalidated
- `api_request_made` - Every API call logged
- `quota_exceeded` - Rate limit or usage limit hit
- `api_auth_failed` - Invalid or expired API key used
- `api_application_registered` - New app registered

Metadata tracked:

- Request timestamp
- Endpoint accessed
- Response status
- Latency
- Payload size
- IP address
- User agent

### 6. Knowledge (Documentation & Discovery)

- **API Documentation:** Searchable via RAG (Retrieval-Augmented Generation)
- **Error Messages:** Semantically searchable for troubleshooting
- **Usage Patterns:** Learn from API usage to improve developer experience
- **Auto-completion:** Suggest endpoints/parameters based on context

## Technical Architecture

### Authentication Flow

```typescript
// Client makes request with API key
POST https://api.one.ie/v1/entities/create
Headers:
  Authorization: Bearer org_abc123_key_xyz789
  Content-Type: application/json

// Backend validates:
1. API key exists and is active
2. API key belongs to organization
3. Request scoped to organization's groupId
4. Rate limits not exceeded
5. Required scopes present

// Request processed with automatic group scoping:
{
  groupId: "org_abc123",  // Automatically injected
  type: "course",
  name: "Introduction to AI",
  properties: { /* ... */ }
}
```

### API Key Structure

```typescript
interface ApiKey {
  _id: Id<"things">;
  type: "api_key";
  name: string; // e.g., "Production API Key"
  properties: {
    key: string; // Hashed, never shown after creation
    prefix: string; // First 8 chars for identification
    organizationId: Id<"groups">;
    scopes: string[]; // ["entities:read", "entities:write", "connections:read"]
    rateLimit: {
      requestsPerMinute: number;
      requestsPerDay: number;
    };
    expiresAt?: number; // Optional expiration
    lastUsedAt?: number;
    usageStats: {
      totalRequests: number;
      lastMonth: number;
      lastWeek: number;
    };
  };
  status: "active" | "revoked" | "expired";
  createdAt: number;
  updatedAt: number;
}
```

### Scopes System

```typescript
const AVAILABLE_SCOPES = {
  // Entity operations
  "entities:read": "Read any entity type",
  "entities:write": "Create/update entities",
  "entities:delete": "Delete entities",

  // Connection operations
  "connections:read": "Read relationships",
  "connections:write": "Create/update connections",
  "connections:delete": "Delete connections",

  // Event operations
  "events:read": "Read event logs",
  "events:write": "Create custom events",

  // Knowledge operations
  "knowledge:read": "Search knowledge base",
  "knowledge:write": "Add embeddings",

  // Group operations
  "groups:read": "Read group structure",
  "groups:write": "Create/update groups",

  // Admin operations
  "api_keys:manage": "Create/revoke API keys",
  "quota:view": "View usage and quotas",
};
```

### Rate Limiting Strategy

```typescript
// Per API key, per organization
interface RateLimits {
  starter: {
    requestsPerMinute: 60;
    requestsPerDay: 10000;
    maxGroupsPerOrg: 10;
    maxEntitiesPerGroup: 1000;
  };
  pro: {
    requestsPerMinute: 600;
    requestsPerDay: 100000;
    maxGroupsPerOrg: 100;
    maxEntitiesPerGroup: 50000;
  };
  enterprise: {
    requestsPerMinute: 6000;
    requestsPerDay: 1000000;
    maxGroupsPerOrg: -1; // Unlimited
    maxEntitiesPerGroup: -1; // Unlimited
  };
}
```

## Implementation Phases

### Phase 1: Foundation (Cycle 1-10)

**Agent:** agent-director

**Deliverables:**

1. ✅ Validate idea against 6-dimension ontology
2. ✅ Map entity types (api_key, api_application, service_account, api_quota)
3. ✅ Identify connection types (owns_api_key, authenticated_by, has_quota)
4. ✅ List event types (api_key_generated, api_request_made, quota_exceeded)
5. ✅ Determine knowledge requirements (API docs RAG, error message search)
6. ✅ Identify org scope (multi-tenant per API consumer)
7. ✅ Define people roles (api_consumer, service_account)
8. ✅ Create vision document (this file)
9. ✅ Break down features into 10 major components
10. ✅ Create 100-cycle plan

### Phase 2: Backend Schema & Services (Cycle 11-30)

**Agents:** agent-backend, agent-quality

**Deliverables:**

**Cycle 11-15: Schema Design**

- Extend `things` schema with new entity types (api_key, api_application, service_account, api_quota)
- Add indexes for fast API key lookup
- Design connection types for API relationships
- Plan event types for API audit trail
- Create schema migration strategy

**Cycle 16-20: Authentication Service**

- Implement API key generation (cryptographically secure)
- Create API key validation middleware
- Build scope verification system
- Add rate limiting with @convex-dev/rate-limiter
- Implement key rotation mechanism

**Cycle 21-25: Group Scoping Service**

- Create automatic groupId injection middleware
- Implement organization isolation checks
- Build hierarchical group access rules
- Add cross-group query prevention
- Implement audit logging for all API requests

**Cycle 26-30: API Gateway Layer**

- Create public API endpoints (REST-style over Convex HTTP)
- Implement request/response transformers
- Add error handling with proper HTTP status codes
- Build response pagination system
- Create webhook delivery system

### Phase 3: Frontend Pages & Admin UI (Cycle 31-50)

**Agents:** agent-frontend, agent-designer

**Deliverables:**

**Cycle 31-35: API Keys Management Page**

- Design page wireframe (acceptance criteria → UI elements)
- Implement key generation UI
- Create key listing with usage stats
- Add key revocation interface
- Show last used timestamp and IP

**Cycle 36-40: API Documentation Portal**

- Create interactive API explorer (like Swagger UI)
- Add code examples in 5+ languages
- Implement "Try It" feature for testing endpoints
- Show real-time usage stats
- Add error code reference

**Cycle 41-45: Usage Dashboard**

- Design analytics page (requests/day, latency, errors)
- Show quota consumption (% of limits)
- Add billing projection
- Create alert configuration UI
- Display top endpoints by usage

**Cycle 46-50: Developer Onboarding Flow**

- Create "Get Started" wizard (org setup → key generation → first API call)
- Add SDK download options
- Implement quick start templates
- Show example applications
- Add video tutorials

### Phase 4: Quality & Testing (Cycle 51-70)

**Agents:** agent-quality, agent-problem-solver

**Deliverables:**

**Cycle 51-55: Unit Tests**

- Test API key generation (collision resistance)
- Test scope validation (permission checks)
- Test rate limiting (burst and sustained)
- Test group isolation (data leakage prevention)
- Test key rotation (seamless transition)

**Cycle 56-60: Integration Tests**

- Test full authentication flow (key → validation → scoped request)
- Test multi-tenant isolation (org A can't access org B)
- Test rate limit enforcement (429 responses)
- Test webhook delivery (retries, failures)
- Test concurrent requests (race conditions)

**Cycle 61-65: Security Tests**

- Test key brute force protection
- Test SQL injection attempts (though Convex is safe)
- Test unauthorized scope escalation
- Test expired key handling
- Penetration testing against OWASP Top 10

**Cycle 66-70: Performance Tests**

- Load test (10K requests/minute)
- Latency testing (p50, p95, p99)
- Database query optimization
- CDN caching strategy
- Connection pooling validation

### Phase 5: SDK & Developer Tools (Cycle 71-80)

**Agents:** agent-builder, agent-documenter

**Deliverables:**

**Cycle 71-75: Official SDKs**

- JavaScript/TypeScript SDK (npm package)
- Python SDK (PyPI package)
- Go SDK (Go module)
- Ruby SDK (gem)
- Add type definitions (full TypeScript support)

**Cycle 76-80: CLI Tool**

- Create `oneie` CLI for API management
- Add commands: `oneie keys:create`, `oneie keys:list`, `oneie keys:revoke`
- Implement `oneie test` for endpoint testing
- Add `oneie logs` for request history
- Create `oneie deploy` for webhook configuration

### Phase 6: Operations & Deployment (Cycle 81-100)

**Agents:** agent-ops, agent-documenter

**Deliverables:**

**Cycle 81-85: Monitoring & Observability**

- Set up API metrics dashboard (Grafana/Datadog)
- Add error tracking (Sentry integration)
- Configure uptime monitoring (status page)
- Create alerting rules (quota exceeded, high error rate)
- Implement distributed tracing

**Cycle 86-90: Documentation & Knowledge Base**

- Write comprehensive API reference (OpenAPI/Swagger spec)
- Create developer guides (authentication, best practices)
- Add troubleshooting runbook
- Generate SDK documentation
- Create migration guides (v1 → v2)

**Cycle 91-95: Deployment & CI/CD**

- Configure Cloudflare Workers for API gateway
- Set up Convex HTTP endpoints
- Implement blue-green deployment
- Add automated testing in CI
- Create rollback procedures

**Cycle 96-100: Launch & Handoff**

- Conduct security audit (external firm)
- Perform load testing at scale
- Create onboarding materials for first 10 customers
- Write launch announcement
- Mark feature complete and notify stakeholders

## Success Metrics

### Technical Metrics

- **Latency:** p95 < 200ms, p99 < 500ms
- **Uptime:** 99.9% SLA (43 minutes downtime/month max)
- **Rate Limit Accuracy:** 100% (no false positives/negatives)
- **Security:** Zero data leakage incidents
- **Test Coverage:** >90% for authentication/authorization code

### Business Metrics

- **Developer Onboarding:** <5 minutes from signup to first API call
- **API Adoption:** 100+ active API keys within 3 months
- **Documentation Quality:** <5% support tickets about basic usage
- **Conversion Rate:** 30% of free tier users upgrade to paid
- **Retention:** 90% monthly retention for paid tiers

## Risk Analysis

### High-Risk Areas

1. **Data Leakage:** API key with wrong group scope
   - Mitigation: Extensive integration tests, security audit

2. **Rate Limit Bypass:** Malicious users exceeding quotas
   - Mitigation: Multiple rate limit layers (IP + key + org)

3. **API Key Exposure:** Keys committed to public repositories
   - Mitigation: Key scanning service, automatic revocation alerts

4. **DDoS Attacks:** Overwhelming API with requests
   - Mitigation: Cloudflare DDoS protection, progressive rate limiting

### Medium-Risk Areas

1. **Breaking Changes:** API updates breaking existing integrations
   - Mitigation: Versioned endpoints (/v1, /v2), deprecation warnings

2. **Documentation Drift:** Code changes not reflected in docs
   - Mitigation: Auto-generated API specs from code

3. **SDK Maintenance:** Multiple SDKs fall out of sync
   - Mitigation: Generated SDKs from OpenAPI spec

## Dependencies

### External Services

- **Convex:** Backend database and functions
- **Cloudflare Workers:** API gateway and edge caching
- **Resend:** Email notifications (quota alerts, key revocation)
- **Sentry:** Error tracking and monitoring
- **Stripe:** Billing and quota management

### Internal Systems

- **Authentication System:** Better Auth integration for web UI
- **6-Dimension Ontology:** Core data model
- **Groups System:** Multi-tenant isolation

## Timeline Estimate

**Total Duration:** 60-90 days (with parallelization)

**Critical Path:**

1. Foundation (7 days) →
2. Backend Schema (10 days) →
3. Authentication Service (7 days) →
4. API Gateway (7 days) →
5. Testing (14 days) →
6. Documentation (7 days) →
7. Deployment (7 days)

**Parallel Tracks:**

- Frontend UI (can start after Foundation)
- SDK Development (can start after API Gateway)
- Monitoring Setup (can start anytime)

## Agent Assignments

| Phase                | Cycles | Agent            | Role                          |
| -------------------- | ---------- | ---------------- | ----------------------------- |
| Foundation           | 1-10       | agent-director   | Validation, mapping, planning |
| Backend Schema       | 11-15      | agent-backend    | Schema design                 |
| Auth Service         | 16-20      | agent-backend    | API key system                |
| Group Scoping        | 21-25      | agent-backend    | Multi-tenant isolation        |
| API Gateway          | 26-30      | agent-backend    | Public endpoints              |
| Admin UI             | 31-40      | agent-frontend   | Key management pages          |
| Documentation Portal | 36-40      | agent-frontend   | Interactive docs              |
| Usage Dashboard      | 41-45      | agent-frontend   | Analytics UI                  |
| Onboarding Flow      | 46-50      | agent-frontend   | Developer UX                  |
| Unit Tests           | 51-55      | agent-quality    | Component testing             |
| Integration Tests    | 56-60      | agent-quality    | End-to-end flows              |
| Security Tests       | 61-65      | agent-quality    | Penetration testing           |
| Performance Tests    | 66-70      | agent-quality    | Load testing                  |
| SDKs                 | 71-75      | agent-builder    | Client libraries              |
| CLI Tool             | 76-80      | agent-builder    | Developer tools               |
| Monitoring           | 81-85      | agent-ops        | Observability                 |
| Documentation        | 86-90      | agent-documenter | API reference                 |
| Deployment           | 91-95      | agent-ops        | Production setup              |
| Launch               | 96-100     | agent-director   | Final coordination            |

## Quality Loop Integration

**Test → Design → Implement → Validate**

1. **Tests First (Cycle 51-70):** Define acceptance criteria and test cases
2. **Design to Satisfy Tests (Cycle 31-50):** Create UI/UX that passes tests
3. **Implement Against Tests (Cycle 11-30, 71-80):** Write code that validates
4. **Fix Failures (Throughout):** agent-problem-solver analyzes, delegates fixes

**Quality Gates:**

- ✅ All unit tests pass (100%)
- ✅ Integration tests pass (100%)
- ✅ Security audit complete (no critical vulnerabilities)
- ✅ Performance targets met (p95 < 200ms)
- ✅ Documentation review complete (no broken links)

## Post-Launch Plan

### Month 1: Stability

- Monitor error rates hourly
- Fix critical bugs within 4 hours
- Daily usage reports to stakeholders
- Collect developer feedback (surveys, interviews)

### Month 2-3: Enhancement

- Add requested features (top 5 from feedback)
- Optimize hot paths (top 10 slowest endpoints)
- Expand SDK coverage (add Java, PHP)
- Create advanced guides (webhooks, batch operations)

### Month 4-6: Scale

- Implement caching layer (Redis/Cloudflare)
- Add GraphQL support
- Create enterprise features (custom rate limits, dedicated instances)
- Expand to new regions (Asia, Europe)

## Related Documentation

- [6-Dimension Ontology](/one/knowledge/ontology.md) - Core data model
- [Authentication Architecture](/one/connections/authentication.md) - Auth patterns
- [Multi-Tenant Patterns](/one/connections/patterns.md#multi-tenant) - Group isolation
- [Rate Limiting](/one/connections/patterns.md#rate-limiting) - Quota enforcement
- [API Security](/one/knowledge/security.md) - Best practices

---

**Status:** Ready for Execution
**Next Step:** Begin Cycle 1 with agent-director for ontology validation
