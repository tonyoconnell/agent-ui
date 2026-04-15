---
title: Ontology Refine
dimension: things
category: plans
tags: 6-dimensions, backend, connections, events, groups, knowledge, ontology, people, things
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/ontology-refine.md
  Purpose: Documents ontology refinement plan: critical flaws & fixes
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand ontology refine.
---

# Ontology Refinement Plan: Critical Flaws & Fixes

**Version:** 1.0.0
**Status:** In Progress
**Created:** 2025-11-01
**Target Completion:** 4 weeks (4 phases)
**Assigned:** Engineering Director + Backend Specialists

---

## Executive Summary

The 6-dimension ontology (groups, people, things, connections, events, knowledge) is architecturally sound but **lacks critical production safeguards** for referential integrity, multi-tenant isolation, and data validation. This document identifies 30 flaws and provides a phased implementation plan to fix them.

**Critical Issues:**

- Missing `groupId` enforcement in schemas → data leakage between tenants
- Unvalidated `properties` JSON → invalid data stored
- No cascade delete rules → orphaned references
- Missing indexes on multi-tenant queries → slow/unsafe isolation
- No event archival implementation → unbounded data growth

---

## 30 Identified Flaws

### Category 1: Multi-Tenant Isolation (Critical)

| #   | Flaw                                     | Impact                            | Severity    |
| --- | ---------------------------------------- | --------------------------------- | ----------- |
| 1   | Missing `groupId` in table schemas       | Cross-tenant data leakage         | 🔴 Critical |
| 2   | Missing `groupId` indexes                | Inefficient/unsafe tenant queries | 🔴 Critical |
| 12  | Hierarchical group permissions undefined | Unclear access control            | 🔴 Critical |
| 17  | No schema change audit trail             | Can't track what changed          | 🟠 High     |

### Category 2: Data Validation (High)

| #   | Flaw                                 | Impact                           | Severity |
| --- | ------------------------------------ | -------------------------------- | -------- |
| 3   | Unvalidated metadata JSON            | Protocol constraints ignored     | 🟠 High  |
| 4   | No duplicate prevention in junctions | Multiple identical relationships | 🟠 High  |
| 9   | Protocol field not enforced          | Cross-protocol queries fail      | 🟠 High  |
| 13  | Untyped `properties` field           | No compile-time safety           | 🟠 High  |
| 26  | No data format validation            | Invalid emails, URLs, etc stored | 🟠 High  |

### Category 3: Referential Integrity (High)

| #   | Flaw                         | Impact                      | Severity |
| --- | ---------------------------- | --------------------------- | -------- |
| 5   | No cascade delete rules      | Orphaned connections/events | 🟠 High  |
| 7   | Orphaned knowledge allowed   | Lost context                | 🟠 High  |
| 14  | Missing cascade delete rules | Data inconsistency          | 🟠 High  |

### Category 4: Semantic Validation (Medium)

| #   | Flaw                                 | Impact                    | Severity  |
| --- | ------------------------------------ | ------------------------- | --------- |
| 6   | No relationship direction validation | Semantic nonsense allowed | 🟡 Medium |
| 8   | Thing type vs properties unchecked   | Invalid data combinations | 🟡 Medium |
| 29  | No event sourcing/replay             | Can't rebuild state       | 🟡 Medium |

### Category 5: Data Lifecycle (Medium)

| #   | Flaw                             | Impact                          | Severity  |
| --- | -------------------------------- | ------------------------------- | --------- |
| 10  | Soft deletes unforced            | Orphans leak into queries       | 🟡 Medium |
| 18  | Temporal validation missing      | `validTo` < `validFrom` allowed | 🟡 Medium |
| 19  | No event archival implementation | Unbounded data growth           | 🟡 Medium |
| 24  | Junction tables lack updatedAt   | Can't track association changes | 🟡 Medium |
| 27  | No content versioning            | Can't compare changes           | 🟡 Medium |

### Category 6: Performance & Scale (Medium)

| #   | Flaw                              | Impact                        | Severity  |
| --- | --------------------------------- | ----------------------------- | --------- |
| 11  | No versioning strategy            | Schema migration impossible   | 🟡 Medium |
| 15  | Missing usage tracking schema     | Can't enforce quotas          | 🟡 Medium |
| 20  | Embedding dimension mismatch risk | Vector search breaks          | 🟡 Medium |
| 21  | No transaction boundaries         | Partial corruption on failure | 🟡 Medium |
| 25  | No batch operation support        | Extremely inefficient imports | 🟡 Medium |

### Category 7: Feature Gaps (Low-Medium)

| #   | Flaw                                     | Impact                        | Severity  |
| --- | ---------------------------------------- | ----------------------------- | --------- |
| 16  | Inconsistent naming (things vs entities) | Code confusion                | 🟡 Medium |
| 22  | No field-level permissions               | Can't hide sensitive data     | 🟡 Medium |
| 23  | No computed fields pattern               | Gets out of sync with reality | 🟡 Medium |
| 28  | Unclear system event handling            | No clear actor pattern        | 🟡 Medium |
| 30  | No real-time subscription schema         | WebSocket model undefined     | 🟡 Medium |

---

## Phase 1: Critical Schema Fixes (Week 1)

### Objective

Make multi-tenant isolation bulletproof and add type safety to all data.

### Tasks

#### 1.1 Add `groupId` to All Tables

**Files to modify:** `backend/convex/schema.ts`

```typescript
things: defineTable({
  groupId: v.id("groups"),  // NEW: Required foreign key
  type: v.string(),
  name: v.string(),
  properties: v.any(),
  status: v.string(),
  schemaVersion: v.number(),  // NEW: Track schema version
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_group_type", ["groupId", "type"])  // NEW: Multi-tenant safety
  .index("by_group_status", ["groupId", "status"]),

connections: defineTable({
  groupId: v.id("groups"),  // NEW: Enforce group isolation
  fromThingId: v.id("things"),
  toThingId: v.id("things"),
  relationshipType: v.string(),
  metadata: v.any(),
  validFrom: v.optional(v.number()),
  validTo: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),  // NEW: Track updates
})
  .index("by_group_from", ["groupId", "fromThingId", "relationshipType"])
  .index("by_group_to", ["groupId", "toThingId", "relationshipType"]),

events: defineTable({
  groupId: v.id("groups"),  // NEW: Required for isolation
  type: v.string(),
  actorId: v.optional(v.id("things")),  // Changed: Optional for system events
  targetId: v.optional(v.id("things")),
  timestamp: v.number(),
  metadata: v.any(),
  archived: v.boolean(),  // NEW: Soft archive for retention
})
  .index("by_group_type_time", ["groupId", "type", "timestamp"]),

knowledge: defineTable({
  groupId: v.id("groups"),  // NEW: Enforce isolation
  knowledgeType: v.string(),
  text: v.optional(v.string()),
  embedding: v.optional(v.array(v.number())),
  embeddingModel: v.optional(v.string()),
  embeddingDim: v.optional(v.number()),
  sourceThingId: v.optional(v.id("things")),
  sourceField: v.optional(v.string()),
  chunk: v.optional(v.object({ index: v.number() })),
  labels: v.optional(v.array(v.string())),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_group_type", ["groupId", "knowledgeType"])
  .index("by_group_source", ["groupId", "sourceThingId"]),

thingKnowledge: defineTable({
  thingId: v.id("things"),
  knowledgeId: v.id("knowledge"),
  role: v.string(),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),  // NEW: Track changes
})
  .index("by_thing", ["thingId"])
  .index("by_knowledge", ["knowledgeId"])
  .index("unique_pair", ["thingId", "knowledgeId", "role"]),  // NEW: Prevent duplicates
```

#### 1.2 Create Typed Properties Schemas

**File to create:** `backend/convex/schemas/properties.ts`

Define strict validation for each thing type's properties field.

#### 1.3 Add Unique Constraints via Indexes

**File to modify:** `backend/convex/schema.ts`

Add `.index("unique_pair", ["thingId", "knowledgeId"])` to prevent duplicate junction records.

#### 1.4 Enforce Temporal Constraints

**File to create:** `backend/convex/validators/temporal.ts`

Validate that `validFrom <= validTo` for all connections.

**Deliverables:**

- ✅ Updated schema with groupId everywhere
- ✅ 12 new strategic indexes for multi-tenant queries
- ✅ schemaVersion tracking on things
- ✅ Temporal validation rules
- ✅ Property schemas for all 66 thing types

---

## Phase 2: Data Integrity Layer (Week 2)

### Objective

Ensure data consistency through validation, cascade operations, and group isolation.

### Tasks

#### 2.1 Create Semantic Validation Service

**File to create:** `backend/convex/services/validation.ts`

```typescript
// Semantic rules for valid relationships
const RelationshipRules = {
  owns: {
    validFromTypes: ["creator", "group", "organization"],
    validToTypes: ["*"],
    description: "Creator/Group owns any entity",
  },
  member_of: {
    validFromTypes: ["creator", "audience_member"],
    validToTypes: ["group"],
    description: "People are members of groups",
  },
  part_of: {
    validFromTypes: ["*"],
    validToTypes: ["*"],
    allowsCycles: false, // NEW: Prevent A→B→A
  },
  // ... 23 more rules
};
```

#### 2.2 Implement Cascade Delete Handler

**File to create:** `backend/convex/mutations/cascade.ts`

When a thing is deleted:

1. Mark as `deleted` (soft delete)
2. Remove all connections (orphans would be invalid)
3. Archive all events (preserve audit trail)
4. Remove knowledge associations (clean up RAG)
5. Log cleanup event

#### 2.3 Add Group Isolation Middleware

**File to create:** `backend/convex/middleware/groupIsolation.ts`

Wrap all queries to enforce:

- `groupId` filter on every query
- Cross-group references rejected
- Hierarchical group access (parent can access child)

#### 2.4 Create Metadata Validator

**File to create:** `backend/convex/validators/metadata.ts`

```typescript
// Enforce protocol-specific metadata structure
const MetadataSchemas = {
  payment_event: v.object({
    protocol: v.union(v.literal("x402"), v.literal("acp"), v.literal("ap2")), // REQUIRED
    status: v.union(
      v.literal("requested"),
      v.literal("verified"),
      v.literal("processed"),
    ),
    amount: v.number(),
    // ... protocol-specific fields
  }),
  // ... more event types
};
```

**Deliverables:**

- ✅ Validation service with 25+ relationship rules
- ✅ Cascade delete with 4-step cleanup
- ✅ Group isolation middleware applied to all queries
- ✅ Metadata validation for all 67 event types
- ✅ Referential integrity checks (orphan detection)

---

## Phase 3: Performance & Scale (Week 3)

### Objective

Handle high-volume operations efficiently and maintain data health at scale.

### Tasks

#### 3.1 Implement Batch Operations

**File to create:** `backend/convex/mutations/batch.ts`

```typescript
export const batchInsertThings = mutation({
  args: {
    groupId: v.id("groups"),
    things: v.array(
      v.object({
        type: v.string(),
        name: v.string(),
        properties: v.any(),
      }),
    ),
  },
  handler: async (ctx, { groupId, things }) => {
    const ids = [];
    for (const thing of things) {
      // Validate against PropertySchemas[thing.type]
      ids.push(await createThing(ctx, groupId, thing));
    }
    // Single event log
    await logEvent(ctx, groupId, "batch_import", { count: things.length });
    return ids;
  },
});
```

#### 3.2 Add Event Archival System

**File to create:** `backend/convex/crons/archival.ts`

Daily job that:

1. Finds events older than 365 days
2. Exports to cold storage (S3, BigQuery)
3. Marks as archived in database
4. Removes from hot indexes

#### 3.3 Implement Computed Fields Pattern

**File to create:** `backend/convex/queries/computed.ts`

```typescript
export const getCreatorStats = query({
  handler: async (ctx, { creatorId }) => {
    const creator = await ctx.db.get(creatorId);

    // Compute from events, not stored fields
    const revenue = await sumEvents(ctx, creatorId, "revenue_generated");
    const followers = await countConnections(ctx, creatorId, "following");

    return {
      ...creator,
      _computed: {
        totalRevenue: revenue,
        totalFollowers: followers,
        lastActive: await getLastActivity(ctx, creatorId),
      },
    };
  },
});
```

#### 3.4 Add Usage Quota Tracking

**File to create:** `backend/convex/schemas/usage.ts`

```typescript
usage: defineTable({
  groupId: v.id("groups"), // REQUIRED
  metric: v.string(), // "api_calls", "storage_gb", "users"
  period: v.string(), // "daily", "monthly"
  value: v.number(),
  limit: v.number(),
  timestamp: v.number(),
}).index("by_group_period", ["groupId", "period"]);
```

**Deliverables:**

- ✅ Batch import for 10,000+ records in one call
- ✅ Event archival reducing hot data by 90%
- ✅ Computed field queries (always accurate)
- ✅ Usage quota tracking schema
- ✅ Performance: < 50ms query time at scale

---

## Phase 4: Migration & Monitoring (Week 4)

### Objective

Safely migrate existing data and continuously monitor integrity.

### Tasks

#### 4.1 Create Migration Script

**File to create:** `scripts/migrate-ontology-v1.ts`

```typescript
// 1. Create default group for legacy data
// 2. Update all things → add groupId
// 3. Update all connections → add groupId
// 4. Update all events → add groupId
// 5. Update all knowledge → add groupId
// 6. Rebuild indexes
// 7. Validate integrity
// 8. Log migration event
```

#### 4.2 Implement Integrity Monitoring

**File to create:** `backend/convex/queries/monitoring.ts`

```typescript
export const checkIntegrity = query({
  handler: async (ctx) => {
    return {
      orphanedConnections: await findOrphanedConnections(ctx),
      crossGroupReferences: await findCrossGroupRefs(ctx),
      missingGroupIds: await findMissingGroupIds(ctx),
      invalidMetadata: await findInvalidMetadata(ctx),
      malformedProperties: await findMalformedProperties(ctx),
    };
  },
});
```

#### 4.3 Add Data Quality Dashboard

**File to create:** `one/things/plans/data-quality-metrics.md`

Track:

- Referential integrity score (%)
- Orphaned entity count
- Cross-group violations
- Schema compliance
- Event archival progress

#### 4.4 Create Rollback Plan

**File to create:** `scripts/rollback-ontology.ts`

In case of issues, revert to pre-v1 state with full audit trail.

**Deliverables:**

- ✅ Zero-downtime migration script
- ✅ Real-time integrity monitoring dashboard
- ✅ Automated data quality alerts
- ✅ Full rollback capability

---

## Implementation Sequence

```
Week 1: Phase 1 (Schema Fixes)
├─ Agent-Backend-1: Add groupId to all tables + indexes
├─ Agent-Backend-2: Create property schemas (66 types)
├─ Agent-Backend-3: Add temporal + metadata validators
└─ Agent-Backend-4: Update existing queries for groupId filters

Week 2: Phase 2 (Data Integrity)
├─ Agent-Backend-5: Semantic validation service
├─ Agent-Backend-6: Cascade delete implementation
├─ Agent-Backend-7: Group isolation middleware
└─ Agent-Backend-8: Orphan detection + repair tools

Week 3: Phase 3 (Performance)
├─ Agent-Backend-9: Batch operations
├─ Agent-Backend-10: Event archival system
├─ Agent-Backend-11: Computed fields queries
└─ Agent-Backend-12: Usage quota tracking

Week 4: Phase 4 (Migration + Monitoring)
├─ Agent-Backend-13: Migration script + validation
├─ Agent-Backend-14: Integrity monitoring dashboard
├─ Agent-Backend-15: Data quality metrics
└─ Agent-Backend-16: Documentation + rollback plan
```

---

## Success Criteria

### Security

- ✅ Zero cross-tenant data leakage
- ✅ 100% groupId enforcement
- ✅ Field-level access control ready

### Data Quality

- ✅ 100% referential integrity
- ✅ Zero orphaned references
- ✅ All metadata validated
- ✅ All properties type-checked

### Performance

- ✅ < 50ms query time (p99)
- ✅ Batch operations (10K+ records/call)
- ✅ Event archival (365-day cutoff)
- ✅ Computed fields (fresh data always)

### Observability

- ✅ Real-time integrity monitoring
- ✅ Data quality dashboard
- ✅ Automated alerting
- ✅ Full audit trail

---

## Risk Mitigation

| Risk                        | Mitigation                                  |
| --------------------------- | ------------------------------------------- |
| Migration breaks production | 0-downtime strategy with parallel indexes   |
| Data loss during transition | Export all data before migration            |
| Backward compatibility      | Version schema, support v0 and v1           |
| Performance regression      | Load test batch ops before rollout          |
| Deployment rollback         | Keep pre-migration backup + rollback script |

---

## Timeline

| Phase | Week | Tasks                       | Owner                |
| ----- | ---- | --------------------------- | -------------------- |
| 1     | 1    | Schema fixes + indexes      | Backend Specialists  |
| 2     | 2    | Validation + Cascade        | Backend Specialists  |
| 3     | 3    | Batch + Archival + Computed | Backend Specialists  |
| 4     | 4    | Migration + Monitoring      | Engineering Director |

**Total Effort:** ~80 backend engineer-hours
**Start Date:** 2025-11-01
**Target Completion:** 2025-12-01

---

## Documentation Requirements

After implementation, update:

- `one/knowledge/ontology.md` - Add groupId and validation details
- `one/things/AGENTS.md` - Update Convex patterns section
- `one/connections/patterns.md` - Add batch operation patterns
- `one/events/` - Document event archival strategy
- Create `one/knowledge/data-quality.md` - Monitoring guide

---

## Approval & Sign-Off

- [ ] Engineering Director: Approves implementation plan
- [ ] Platform Owner: Approves timeline + budget
- [ ] Backend Lead: Ready to assign agents
- [ ] QA Lead: Ready for testing

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-01
**Status:** Ready for Implementation
