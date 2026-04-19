# Backend Testing TODO List (Cycle 65/100)

**Mission**: Create comprehensive e2e tests for critical backend paths in AI-powered recommendations feature.

**Status**: Cycle 65/100 - Write e2e tests for critical paths
**Feature**: AI-powered recommendations system
**Progress**: 64/100 cycles complete

**Updated**: 2025-10-30
**Scope**: Complete service layer, Convex queries/mutations, database integrity, error handling, and performance validation

---

## Overview

This TODO list covers all backend testing requirements for validating the AI-powered recommendations feature. The testing strategy follows a 4-phase pyramid:

```
Phase 4: Performance & Integration (Cycle 68-70)
  └─ Load testing, query optimization, cross-function flows
Phase 3: Database & Schema Integrity (Cycle 66-67)
  └─ Schema validation, constraints, indexing, data consistency
Phase 2: Queries, Mutations & Validation (Cycle 65-66)
  └─ Unit tests for Convex functions, input validation, error handling
Phase 1: Service Layer Unit Tests (Cycle 64-65)
  └─ Effect.ts services, business logic, error composition
```

---

## Phase 1: Service Layer Unit Tests (Cycle 64-65)

Service layer tests validate business logic in isolation using Effect.ts patterns.

### 1.1 Feature Recommender Service Tests

- [ ] **Test 1.1.1**: `recommendFeatures()` returns foundation features (landing-page, authentication, multi-tenant)
  - Input: `DetectedFeatures` with empty arrays
  - Expected: Array with 3 high-priority foundation features
  - Error: None
  - Mock: None required

- [ ] **Test 1.1.2**: `recommendFeatures()` returns blog recommendation when blog detected
  - Input: `DetectedFeatures { contentTypes: ['blog'] }`
  - Expected: Array includes blog-cms feature with high priority
  - Error: None
  - Mock: None required

- [ ] **Test 1.1.3**: `recommendFeatures()` returns video recommendation when video detected
  - Input: `DetectedFeatures { contentTypes: ['video'] }`
  - Expected: Array includes video-library feature with high priority
  - Error: None
  - Mock: None required

- [ ] **Test 1.1.4**: `recommendFeatures()` returns course recommendation when courses detected
  - Input: `DetectedFeatures { contentTypes: ['courses'] }`
  - Expected: Array includes course-platform feature with high priority
  - Error: None
  - Mock: None required

- [ ] **Test 1.1.5**: `recommendFeatures()` returns subscription recommendation with subscription detected
  - Input: `DetectedFeatures { monetization: ['subscriptions'] }`
  - Expected: Array includes membership-tiers feature with medium priority
  - Error: None
  - Mock: None required

- [ ] **Test 1.1.6**: `recommendFeatures()` returns product store recommendation with one-time-sales detected
  - Input: `DetectedFeatures { monetization: ['one-time-sales'] }`
  - Expected: Array includes product-store feature with medium priority
  - Error: None
  - Mock: None required

- [ ] **Test 1.1.7**: `recommendFeatures()` returns discord integration when discord community detected
  - Input: `DetectedFeatures { community: ['discord'] }`
  - Expected: Array includes discord-integration feature with medium priority
  - Error: None
  - Mock: None required

- [ ] **Test 1.1.8**: `recommendFeatures()` returns real-time-sync for Convex backend
  - Input: `DetectedFeatures { techStack: { backend: 'Convex' } }`
  - Expected: Array includes real-time-sync feature with medium priority
  - Error: None
  - Mock: None required

- [ ] **Test 1.1.9**: `recommendFeatures()` returns AI recommendations (agents and RAG)
  - Input: `DetectedFeatures` with any valid input
  - Expected: Array includes ai-agents and rag-knowledge features with low priority
  - Error: None
  - Mock: None required

- [ ] **Test 1.1.10**: `calculateTotalTime()` sums estimated minutes correctly
  - Input: Array of 5 features with various estimatedMinutes
  - Expected: Sum equals 65 minutes
  - Error: None
  - Mock: None required

### 1.2 Entity Service Business Logic Tests

- [ ] **Test 1.2.1**: `validateEntityName()` succeeds with valid 2-char name
  - Input: "ab"
  - Expected: Success, returns "ab"
  - Error: None
  - Mock: None required

- [ ] **Test 1.2.2**: `validateEntityName()` fails with single character
  - Input: "a"
  - Expected: Fails with ValidationError
  - Error: ValidationError { field: "name", message: "..." }
  - Mock: None required

- [ ] **Test 1.2.3**: `validateEntityName()` fails with empty string
  - Input: ""
  - Expected: Fails with ValidationError
  - Error: ValidationError { field: "name", message: "..." }
  - Mock: None required

- [ ] **Test 1.2.4**: `validateEntityName()` fails with >200 characters
  - Input: "a".repeat(201)
  - Expected: Fails with ValidationError
  - Error: ValidationError { field: "name", message: "..." }
  - Mock: None required

- [ ] **Test 1.2.5**: `validateEntityName()` trims whitespace
  - Input: "  valid name  "
  - Expected: Success, returns "valid name"
  - Error: None
  - Mock: None required

- [ ] **Test 1.2.6**: `validateEntityType()` succeeds with valid type
  - Input: type="blog_post", validTypes=["blog_post", "course"]
  - Expected: Success, returns "blog_post"
  - Error: None
  - Mock: None required

- [ ] **Test 1.2.7**: `validateEntityType()` fails with invalid type
  - Input: type="invalid_type", validTypes=["blog_post", "course"]
  - Expected: Fails with ValidationError
  - Error: ValidationError { field: "type", message: "..." }
  - Mock: None required

- [ ] **Test 1.2.8**: `validateGroup()` succeeds when group exists and active
  - Input: groupId="xyz123"
  - Expected: Success, returns void
  - Error: None
  - Mock: getGroup returns { status: "active" }

- [ ] **Test 1.2.9**: `validateGroup()` fails when group not found
  - Input: groupId="nonexistent"
  - Expected: Fails with ValidationError
  - Error: ValidationError { field: "groupId", message: "Group not found" }
  - Mock: getGroup returns null

- [ ] **Test 1.2.10**: `validateGroup()` fails when group not active
  - Input: groupId="archived_group"
  - Expected: Fails with ValidationError
  - Error: ValidationError { field: "groupId", message: "Group is not active" }
  - Mock: getGroup returns { status: "archived" }

### 1.3 Entity Service Creation Tests

- [ ] **Test 1.3.1**: `createEntity()` succeeds with valid inputs
  - Input: CreateEntityInput { groupId, type: "blog_post", name: "My Post", properties: {...} }
  - Expected: Success, returns entityId
  - Error: None
  - Mock: All context functions mocked to succeed

- [ ] **Test 1.3.2**: `createEntity()` fails with invalid name
  - Input: CreateEntityInput { name: "a" } (too short)
  - Expected: Fails with ValidationError
  - Error: ValidationError
  - Mock: None required (validation fails before database calls)

- [ ] **Test 1.3.3**: `createEntity()` fails with invalid type
  - Input: CreateEntityInput { type: "invalid_type" }
  - Expected: Fails with ValidationError
  - Error: ValidationError
  - Mock: None required

- [ ] **Test 1.3.4**: `createEntity()` fails when group not found
  - Input: CreateEntityInput { groupId: "missing" }
  - Expected: Fails with ValidationError
  - Error: ValidationError { field: "groupId" }
  - Mock: getGroup returns null

- [ ] **Test 1.3.5**: `createEntity()` calls insertEntity with correct structure
  - Input: CreateEntityInput { groupId, type, name, properties, status }
  - Expected: insertEntity called once with correct entity object
  - Error: None
  - Mock: insertEntity mocked to capture calls

- [ ] **Test 1.3.6**: `createEntity()` logs event with correct metadata
  - Input: CreateEntityInput { groupId, type: "blog_post", name: "Post" }
  - Expected: logEvent called with event type "thing_created" and metadata
  - Error: None
  - Mock: logEvent mocked to capture calls

- [ ] **Test 1.3.7**: `createEntity()` indexes RAG for blog_post type
  - Input: CreateEntityInput { type: "blog_post", properties: { content: "..." } }
  - Expected: RAG addDocument called
  - Error: None
  - Mock: RAG service mocked

- [ ] **Test 1.3.8**: `createEntity()` skips RAG for non-indexable types
  - Input: CreateEntityInput { type: "user", properties: {} }
  - Expected: RAG addDocument NOT called
  - Error: None
  - Mock: RAG service mocked

- [ ] **Test 1.3.9**: `createEntity()` sets default status to "draft"
  - Input: CreateEntityInput { status: undefined }
  - Expected: Entity created with status="draft"
  - Error: None
  - Mock: insertEntity mocked to capture entity

- [ ] **Test 1.3.10**: `createEntity()` preserves provided status
  - Input: CreateEntityInput { status: "published" }
  - Expected: Entity created with status="published"
  - Error: None
  - Mock: insertEntity mocked to capture entity

### 1.4 Entity Service Update Tests

- [ ] **Test 1.4.1**: `updateEntity()` succeeds with valid name update
  - Input: UpdateEntityInput { entityId, name: "New Name" }
  - Expected: Success, updateEntity called with new name
  - Error: None
  - Mock: getEntity returns valid entity, updateEntity succeeds

- [ ] **Test 1.4.2**: `updateEntity()` fails when entity not found
  - Input: UpdateEntityInput { entityId: "missing" }
  - Expected: Fails with ValidationError
  - Error: ValidationError { field: "entityId" }
  - Mock: getEntity returns null

- [ ] **Test 1.4.3**: `updateEntity()` fails with invalid name
  - Input: UpdateEntityInput { name: "a" } (too short)
  - Expected: Fails with ValidationError
  - Error: ValidationError
  - Mock: getEntity returns valid entity

- [ ] **Test 1.4.4**: `updateEntity()` updates properties
  - Input: UpdateEntityInput { entityId, properties: { views: 100 } }
  - Expected: updateEntity called with properties
  - Error: None
  - Mock: getEntity returns valid entity, updateEntity succeeds

- [ ] **Test 1.4.5**: `updateEntity()` updates status
  - Input: UpdateEntityInput { entityId, status: "published" }
  - Expected: updateEntity called with status="published"
  - Error: None
  - Mock: getEntity returns valid entity, updateEntity succeeds

- [ ] **Test 1.4.6**: `updateEntity()` logs event with changes metadata
  - Input: UpdateEntityInput { entityId, name, properties, status }
  - Expected: logEvent called with metadata.changes array containing modified fields
  - Error: None
  - Mock: getEntity and updateEntity mocked

- [ ] **Test 1.4.7**: `updateEntity()` updates RAG index when properties change
  - Input: UpdateEntityInput { entityId, properties: { content: "new content" } }
  - Expected: RAG deleteDocument and addDocument called
  - Error: None
  - Mock: getEntity returns blog_post entity, RAG service mocked

- [ ] **Test 1.4.8**: `updateEntity()` skips RAG when no searchable content
  - Input: UpdateEntityInput { entityId, properties: { views: 100 } }
  - Expected: RAG operations NOT called
  - Error: None
  - Mock: getEntity returns blog_post with no content field

- [ ] **Test 1.4.9**: `updateEntity()` sets updatedAt timestamp
  - Input: UpdateEntityInput { entityId, name: "New" }
  - Expected: updateEntity called with updatedAt as current timestamp
  - Error: None
  - Mock: updateEntity mocked to capture calls

- [ ] **Test 1.4.10**: `updateEntity()` handles no changes gracefully
  - Input: UpdateEntityInput { entityId } (no updates provided)
  - Expected: Success, updatedAt is set but no other changes
  - Error: None
  - Mock: getEntity returns valid entity

### 1.5 Entity Service Archive Tests

- [ ] **Test 1.5.1**: `archiveEntity()` sets status to "archived"
  - Input: entityId="xyz"
  - Expected: updateEntity called with status="archived"
  - Error: None
  - Mock: getEntity returns valid entity, updateEntity succeeds

- [ ] **Test 1.5.2**: `archiveEntity()` fails when entity not found
  - Input: entityId="missing"
  - Expected: Fails with ValidationError
  - Error: ValidationError { field: "entityId" }
  - Mock: getEntity returns null

- [ ] **Test 1.5.3**: `archiveEntity()` removes from RAG index
  - Input: entityId of blog_post
  - Expected: RAG deleteDocument called
  - Error: None
  - Mock: getEntity returns blog_post, RAG service mocked

- [ ] **Test 1.5.4**: `archiveEntity()` logs event with action metadata
  - Input: entityId
  - Expected: logEvent called with type="thing_deleted" and metadata.action="archived"
  - Error: None
  - Mock: getEntity and logEvent mocked

- [ ] **Test 1.5.5**: `archiveEntity()` sets deletedAt timestamp
  - Input: entityId
  - Expected: updateEntity called with deletedAt timestamp
  - Error: None
  - Mock: updateEntity mocked to capture calls

---

## Phase 2: Convex Queries, Mutations & Validation (Cycle 65-66)

Convex function tests validate the integration between HTTP layer and business logic.

### 2.1 Thing Mutation Tests

- [ ] **Test 2.1.1**: `things/create` mutation succeeds with valid args
  - Args: { groupId, type: "blog_post", name: "Test", properties: {} }
  - Expected: Returns entityId
  - Error: None
  - Auth: Mocked as authenticated

- [ ] **Test 2.1.2**: `things/create` mutation fails without authentication
  - Args: { groupId, type: "blog_post", name: "Test" }
  - Expected: Fails with error
  - Error: "Unauthenticated"
  - Auth: Mocked as null (no auth)

- [ ] **Test 2.1.3**: `things/create` mutation fails with invalid group
  - Args: { groupId: "invalid", type: "blog_post", name: "Test" }
  - Expected: Fails with error
  - Error: "Group not found"
  - Auth: Mocked as authenticated
  - Mock: ctx.db.get returns null

- [ ] **Test 2.1.4**: `things/create` mutation fails with inactive group
  - Args: { groupId, type: "blog_post", name: "Test" }
  - Expected: Fails with error
  - Error: "Group is not active"
  - Auth: Mocked as authenticated
  - Mock: ctx.db.get returns { status: "archived" }

- [ ] **Test 2.1.5**: `things/create` mutation validates type against ontology
  - Args: { groupId, type: "invalid_type", name: "Test" }
  - Expected: Fails with validation error
  - Error: Type not in THING_TYPES
  - Auth: Mocked as authenticated
  - Mock: THING_TYPES mocked with specific types

- [ ] **Test 2.1.6**: `things/create` mutation inserts into entities table
  - Args: Valid create args
  - Expected: ctx.db.insert called for entities table
  - Error: None
  - Auth: Mocked
  - Mock: ctx.db.insert mocked to capture calls

- [ ] **Test 2.1.7**: `things/create` mutation inserts event
  - Args: Valid create args
  - Expected: ctx.db.insert called for events table with type="thing_created"
  - Error: None
  - Auth: Mocked
  - Mock: ctx.db.insert mocked to track calls

- [ ] **Test 2.1.8**: `things/create` mutation captures actor ID in event
  - Args: Valid create args
  - Expected: Event contains actorId from auth identity
  - Error: None
  - Auth: Mocked with userId
  - Mock: ctx.db.insert mocked to capture event

- [ ] **Test 2.1.9**: `things/create` mutation handles missing properties gracefully
  - Args: { groupId, type, name } (no properties)
  - Expected: Success, entity created with empty properties
  - Error: None
  - Auth: Mocked

- [ ] **Test 2.1.10**: `things/create` mutation handles optional status
  - Args: { groupId, type, name, status: undefined }
  - Expected: Entity created with default status
  - Error: None
  - Auth: Mocked

### 2.2 Thing Query Tests

- [ ] **Test 2.2.1**: `things/list` query returns entities by type
  - Args: { groupId, type: "blog_post" }
  - Expected: Array of blog_post entities
  - Error: None
  - Auth: Mocked as authenticated

- [ ] **Test 2.2.2**: `things/list` query filters by groupId
  - Args: { groupId: "group1", type: "blog_post" }
  - Expected: Only entities with matching groupId returned
  - Error: None
  - Auth: Mocked
  - Mock: Query index "by_type" with filter

- [ ] **Test 2.2.3**: `things/list` query returns empty array when no matches
  - Args: { groupId, type: "nonexistent_type" }
  - Expected: Empty array
  - Error: None
  - Auth: Mocked

- [ ] **Test 2.2.4**: `things/get` query returns entity by ID
  - Args: { entityId: "xyz" }
  - Expected: Entity object with all fields
  - Error: None
  - Auth: Mocked
  - Mock: ctx.db.get mocked to return entity

- [ ] **Test 2.2.5**: `things/get` query returns null for missing entity
  - Args: { entityId: "missing" }
  - Expected: null
  - Error: None
  - Auth: Mocked
  - Mock: ctx.db.get returns null

- [ ] **Test 2.2.6**: `things/search` query returns results matching text
  - Args: { groupId, query: "blog", type: "blog_post" }
  - Expected: Array of matching entities
  - Error: None
  - Auth: Mocked
  - Mock: Query filters by groupId and type, searches name/description

- [ ] **Test 2.2.7**: `things/search` query is case-insensitive
  - Args: { groupId, query: "BLOG", type: "blog_post" }
  - Expected: Results match "blog" in name/description
  - Error: None
  - Auth: Mocked

- [ ] **Test 2.2.8**: `things/listByStatus` query returns entities by status
  - Args: { groupId, status: "published" }
  - Expected: Only published entities returned
  - Error: None
  - Auth: Mocked

- [ ] **Test 2.2.9**: `things/count` query returns count by type
  - Args: { groupId, type: "blog_post" }
  - Expected: Number of blog_post entities
  - Error: None
  - Auth: Mocked

- [ ] **Test 2.2.10**: `things/recent` query returns recent entities
  - Args: { groupId, limit: 10 }
  - Expected: Latest 10 entities ordered by createdAt desc
  - Error: None
  - Auth: Mocked

### 2.3 Input Validation Tests

- [ ] **Test 2.3.1**: Validation rejects empty name
  - Args: { name: "" }
  - Expected: Validation error
  - Error: Field "name" required

- [ ] **Test 2.3.2**: Validation rejects name <2 chars
  - Args: { name: "a" }
  - Expected: Validation error
  - Error: Minimum length 2

- [ ] **Test 2.3.3**: Validation rejects name >200 chars
  - Args: { name: "a".repeat(201) }
  - Expected: Validation error
  - Error: Maximum length 200

- [ ] **Test 2.3.4**: Validation accepts valid groupId format
  - Args: { groupId: v.id("groups") }
  - Expected: Passes validation
  - Error: None

- [ ] **Test 2.3.5**: Validation rejects invalid groupId format
  - Args: { groupId: "not-an-id" }
  - Expected: Validation error
  - Error: Invalid ID format

- [ ] **Test 2.3.6**: Validation accepts valid type
  - Args: { type: "blog_post" } (when in THING_TYPES)
  - Expected: Passes validation
  - Error: None

- [ ] **Test 2.3.7**: Validation rejects invalid type
  - Args: { type: "invalid_type" }
  - Expected: Validation error
  - Error: Invalid type

- [ ] **Test 2.3.8**: Validation accepts any properties object
  - Args: { properties: { custom: true, nested: { data: "value" } } }
  - Expected: Passes validation
  - Error: None

- [ ] **Test 2.3.9**: Validation accepts valid status values
  - Args: { status: "draft" | "active" | "published" | "archived" | "inactive" }
  - Expected: Each passes validation
  - Error: None

- [ ] **Test 2.3.10**: Validation rejects invalid status
  - Args: { status: "invalid_status" }
  - Expected: Validation error
  - Error: Invalid status

### 2.4 Error Handling Tests

- [ ] **Test 2.4.1**: Database errors are caught and transformed
  - Setup: Simulate database error
  - Expected: Mutation returns error response
  - Error: DatabaseError caught

- [ ] **Test 2.4.2**: Validation errors include field name and message
  - Input: Invalid data
  - Expected: Error response includes field, message, value
  - Error: ValidationError with context

- [ ] **Test 2.4.3**: Unauthenticated requests are rejected
  - Auth: No identity
  - Expected: Error response "Unauthenticated"
  - Error: Clear error message

- [ ] **Test 2.4.4**: Unauthorized group access is rejected
  - Setup: User not in group
  - Expected: Error response
  - Error: Authorization check

- [ ] **Test 2.4.5**: Effect.ts errors are properly caught
  - Setup: Service layer returns error
  - Expected: Error propagated to mutation response
  - Error: Original error context preserved

---

## Phase 3: Database & Schema Integrity (Cycle 66-67)

Database tests validate schema, constraints, and data integrity.

### 3.1 Schema Definition Tests

- [ ] **Test 3.1.1**: `groups` table has required fields
  - Expected: slug, name, type, status, createdAt, updatedAt
  - Validation: Schema inspection

- [ ] **Test 3.1.2**: `groups` table has indexes for queries
  - Expected: Indexes on slug, type, parentGroupId, status, createdAt
  - Validation: Schema has index definitions

- [ ] **Test 3.1.3**: `entities` table has required fields
  - Expected: groupId, type, name, properties, status, createdAt, updatedAt
  - Validation: Schema inspection

- [ ] **Test 3.1.4**: `entities` table has groupId index
  - Expected: Index by groupId for query performance
  - Validation: Schema has groupId index

- [ ] **Test 3.1.5**: `entities` table has type index
  - Expected: Index by type for efficient filtering
  - Validation: Schema has type index

- [ ] **Test 3.1.6**: `connections` table has required fields
  - Expected: fromThingId, toThingId, relationshipType, metadata, createdAt
  - Validation: Schema inspection

- [ ] **Test 3.1.7**: `events` table has required fields
  - Expected: type, actorId, targetId, timestamp, metadata, groupId
  - Validation: Schema inspection

- [ ] **Test 3.1.8**: `knowledge` table has required fields
  - Expected: knowledgeType, text, labels, metadata, createdAt
  - Validation: Schema inspection

- [ ] **Test 3.1.9**: `thingKnowledge` junction table structure
  - Expected: thingId, knowledgeId, role, metadata
  - Validation: Schema inspection

- [ ] **Test 3.1.10**: Dynamic type unions from ontology composition
  - Expected: THING_TYPES used in createTypeUnion
  - Validation: Schema generation includes THING_TYPES

### 3.2 Data Integrity Tests

- [ ] **Test 3.2.1**: Creating entity requires groupId reference
  - Input: Entity without groupId
  - Expected: Database constraint failure
  - Error: Foreign key violation

- [ ] **Test 3.2.2**: Entity groupId must reference existing group
  - Input: Entity with invalid groupId
  - Expected: Database constraint failure
  - Error: Reference constraint violation

- [ ] **Test 3.2.3**: Entity requires valid type from THING_TYPES
  - Input: Entity with invalid type
  - Expected: Type constraint violation
  - Error: Enum constraint or validation error

- [ ] **Test 3.2.4**: Entity status must be valid enum value
  - Input: Entity with status="invalid"
  - Expected: Constraint violation
  - Error: Status constraint

- [ ] **Test 3.2.5**: Event targetId can reference any entity
  - Input: Event with targetId pointing to existing entity
  - Expected: Success
  - Error: None

- [ ] **Test 3.2.6**: Event actorId tracks person who performed action
  - Input: Event with valid actorId
  - Expected: Success, event logged
  - Error: None

- [ ] **Test 3.2.7**: Timestamps are set automatically on creation
  - Input: Entity creation (no createdAt/updatedAt provided)
  - Expected: Database sets both timestamps
  - Error: None

- [ ] **Test 3.2.8**: updatedAt is updated on mutation
  - Input: Update entity
  - Expected: updatedAt timestamp updated to current time
  - Error: None

- [ ] **Test 3.2.9**: createdAt never changes after creation
  - Input: Update entity multiple times
  - Expected: createdAt always same as first creation
  - Error: None

- [ ] **Test 3.2.10**: Soft delete via status="archived" preserves data
  - Input: Archive entity
  - Expected: Entity still exists with status="archived"
  - Error: None

### 3.3 Index Performance Tests

- [ ] **Test 3.3.1**: Query by_type index exists
  - Expected: entities.by_type index defined
  - Validation: Schema inspection

- [ ] **Test 3.3.2**: Query by_status index exists
  - Expected: entities.by_status index (or similar)
  - Validation: Schema inspection

- [ ] **Test 3.3.3**: Query by_groupId index exists
  - Expected: Index for filtering by groupId
  - Validation: Schema inspection

- [ ] **Test 3.3.4**: Query by_created index exists
  - Expected: entities.by_created index for ordering
  - Validation: Schema inspection

- [ ] **Test 3.3.5**: Event query uses index for targetId
  - Expected: events has index for targetId lookups
  - Validation: Schema inspection

- [ ] **Test 3.3.6**: Connection query uses index for fromThingId
  - Expected: connections.from_type index
  - Validation: Schema inspection

- [ ] **Test 3.3.7**: Group query uses index by_slug
  - Expected: groups.by_slug index defined
  - Validation: Schema inspection

- [ ] **Test 3.3.8**: Knowledge query uses index by_text
  - Expected: knowledge table has text search index (if applicable)
  - Validation: Schema inspection

- [ ] **Test 3.3.9**: Multi-column index for groupId + type
  - Expected: Combined index improves grouped queries
  - Validation: Query plan analysis

- [ ] **Test 3.3.10**: Index coverage for common filter patterns
  - Expected: All common WHERE patterns use indexes
  - Validation: Query analysis

### 3.4 Multi-Tenancy Isolation Tests

- [ ] **Test 3.4.1**: Query scoped to groupId returns only that group's data
  - Setup: Create entities in group A and group B
  - Input: Query for group A entities
  - Expected: Only group A entities returned
  - Error: None

- [ ] **Test 3.4.2**: Entities isolated by groupId
  - Setup: 2 groups with same entity name
  - Input: Query group 1
  - Expected: Only group 1 entity returned
  - Error: None

- [ ] **Test 3.4.3**: Events isolated by groupId
  - Setup: 2 groups with events
  - Input: Query group 1 events
  - Expected: Only group 1 events returned
  - Error: None

- [ ] **Test 3.4.4**: Connections isolated by groupId
  - Setup: 2 groups with connections
  - Input: Query group 1 connections
  - Expected: Only group 1 connections returned
  - Error: None

- [ ] **Test 3.4.5**: Knowledge isolated by groupId
  - Setup: 2 groups with knowledge items
  - Input: Query group 1 knowledge
  - Expected: Only group 1 knowledge returned
  - Error: None

- [ ] **Test 3.4.6**: Hierarchical groups share parent's context
  - Setup: Parent group with child group
  - Input: Query parent group entities
  - Expected: Returns parent entities (child isolation configurable)
  - Error: None

- [ ] **Test 3.4.7**: Cross-group queries are prevented
  - Setup: Try to access group B from group A context
  - Expected: Query includes groupId filter preventing access
  - Error: None

- [ ] **Test 3.4.8**: Group archive doesn't affect other groups
  - Setup: Archive group A
  - Input: Query group B
  - Expected: Group B data unaffected
  - Error: None

- [ ] **Test 3.4.9**: Quota limits per group
  - Setup: Check group limits in settings
  - Expected: Each group has independent limits (users, storage, apiCalls)
  - Error: None

- [ ] **Test 3.4.10**: Billing isolation per group
  - Setup: 2 organizations with billing
  - Expected: Each org has independent billing, no cross-charging
  - Error: None

---

## Phase 4: Integration & Performance Testing (Cycle 68-70)

Integration tests validate complete workflows and performance characteristics.

### 4.1 End-to-End Workflow Tests

- [ ] **Test 4.1.1**: Create entity → Query → Update → Archive flow
  - Steps:
    1. Create blog_post entity
    2. Query by ID to verify creation
    3. Update name and properties
    4. Query to verify update
    5. Archive entity
    6. Query should return archived status
  - Expected: All steps succeed, data consistent
  - Error: None

- [ ] **Test 4.1.2**: Create entity → Create connection → Query connection
  - Steps:
    1. Create 2 entities (blog_post, course)
    2. Create connection between them (relates_to)
    3. Query connections from blog_post
  - Expected: Connection created and queryable
  - Error: None

- [ ] **Test 4.1.3**: Create entity → Log event → Query event history
  - Steps:
    1. Create entity
    2. Update entity (triggers event)
    3. Query events for entity
  - Expected: Event logged correctly with metadata
  - Error: None

- [ ] **Test 4.1.4**: Create entity → Add to RAG → Search RAG → Update → Re-index
  - Steps:
    1. Create blog_post with content
    2. Verify RAG indexed
    3. Search RAG returns result
    4. Update entity content
    5. Search RAG returns updated result
  - Expected: RAG always current
  - Error: None

- [ ] **Test 4.1.5**: Bulk create multiple entities → Query all
  - Steps:
    1. Create 10 blog_post entities
    2. Query by type and groupId
  - Expected: All 10 returned
  - Error: None

- [ ] **Test 4.1.6**: Create entity with complex nested properties
  - Input: Entity with properties = { nested: { deep: { data: [...] } } }
  - Expected: Stored and retrieved correctly
  - Error: None

- [ ] **Test 4.1.7**: Feature recommendation → Create recommended entities
  - Steps:
    1. Detect features (blog, video, courses)
    2. Get recommendations
    3. Create entities for each recommendation
  - Expected: All entities created with correct types
  - Error: None

- [ ] **Test 4.1.8**: Search entities → Filter by status → Filter by type
  - Steps:
    1. Create mix of draft/published entities
    2. Search for text match
    3. Filter results by status="published"
    4. Filter results by type="blog_post"
  - Expected: Each filter reduces result set correctly
  - Error: None

- [ ] **Test 4.1.9**: Concurrent entity creation
  - Steps:
    1. Create 5 entities simultaneously
    2. Query all
  - Expected: All 5 created, no conflicts
  - Error: None (or expected conflict resolution)

- [ ] **Test 4.1.10**: Full group lifecycle with entities
  - Steps:
    1. Create group
    2. Create 5 entities in group
    3. Update group settings
    4. Query entities (still accessible)
    5. Archive group
    6. Query entities (soft-deleted or marked)
  - Expected: Full lifecycle succeeds
  - Error: None

### 4.2 Multi-Feature Workflow Tests

- [ ] **Test 4.2.1**: Create course → Create lessons → Create connections
  - Steps:
    1. Create course entity
    2. Create 3 lesson entities
    3. Create "contains" connections from course to lessons
  - Expected: Hierarchy established
  - Error: None

- [ ] **Test 4.2.2**: Create blog post → Tag with knowledge → Search by knowledge
  - Steps:
    1. Create blog_post
    2. Add knowledge labels (skill:react, platform:web)
    3. Search by knowledge
  - Expected: Blog post findable by knowledge labels
  - Error: None

- [ ] **Test 4.2.3**: Create event → Emit to agent → Log result
  - Steps:
    1. Create entity (triggers event)
    2. Agent processes event
    3. Result logged
  - Expected: Full event-driven flow works
  - Error: None

- [ ] **Test 4.2.4**: Recommendation → Create entities → Track in events
  - Steps:
    1. Get feature recommendations
    2. Create recommended entities
    3. Query events to see creation history
  - Expected: Full audit trail present
  - Error: None

- [ ] **Test 4.2.5**: Multi-group isolation in shared database
  - Steps:
    1. Create 2 groups
    2. Create entities in each
    3. Query group 1 entities
  - Expected: Only group 1 entities visible
  - Error: None

### 4.3 Error Recovery Tests

- [ ] **Test 4.3.1**: Partial write failure rolls back cleanly
  - Setup: Simulate failure after entity creation but before event logging
  - Expected: Entity creation rolled back or event logged anyway
  - Error: Consistent state maintained

- [ ] **Test 4.3.2**: Validation error prevents database write
  - Input: Invalid entity
  - Expected: No entity created, no event logged
  - Error: ValidationError

- [ ] **Test 4.3.3**: Database error retries automatically
  - Setup: Simulate transient DB error
  - Expected: Convex retries, eventually succeeds
  - Error: None (after retry succeeds)

- [ ] **Test 4.3.4**: Concurrent update conflict handling
  - Steps:
    1. Update entity field A
    2. Simultaneously update field B
  - Expected: Both updates applied or last-write-wins
  - Error: None (clear conflict resolution)

- [ ] **Test 4.3.5**: Out-of-order event processing
  - Setup: Create event → Update → Query events
  - Expected: Events ordered by timestamp
  - Error: None

### 4.4 Performance & Load Tests

- [ ] **Test 4.4.1**: Query 1000 entities by type completes <500ms
  - Setup: Create 1000 blog_post entities in group
  - Query: entities by_type index
  - Expected: Query completes in <500ms
  - Error: None, performance baseline

- [ ] **Test 4.4.2**: Search 10000 entities by text completes <1000ms
  - Setup: Create 10000 entities with varied names
  - Query: Full-text search
  - Expected: Query completes in <1000ms
  - Error: None, performance baseline

- [ ] **Test 4.4.3**: RAG search 1000 documents completes <200ms
  - Setup: Index 1000 documents in RAG
  - Query: Semantic search
  - Expected: Query completes in <200ms
  - Error: None, performance baseline

- [ ] **Test 4.4.4**: Event query for entity with 1000 events completes <300ms
  - Setup: Create entity with 1000 events
  - Query: All events for entity
  - Expected: Query completes in <300ms
  - Error: None, performance baseline

- [ ] **Test 4.4.5**: Concurrent mutations don't degrade performance
  - Setup: 10 concurrent entity creations
  - Expected: All complete in <1000ms total
  - Error: None, performance baseline

- [ ] **Test 4.4.6**: Query response time under load
  - Setup: 100 concurrent queries
  - Expected: p99 <500ms, p95 <300ms
  - Error: None, performance baseline

- [ ] **Test 4.4.7**: Memory usage doesn't grow with entity count
  - Setup: Create 10000 entities
  - Expected: Memory stable, no leaks
  - Error: None

- [ ] **Test 4.4.8**: Database size appropriate for data volume
  - Setup: Create 10000 entities with 1MB properties each
  - Expected: Database size ~10GB (appropriate overhead)
  - Error: None

- [ ] **Test 4.4.9**: Index build time <100ms for 10000 entities
  - Setup: Create 10000 entities with indexes
  - Expected: Index build <100ms
  - Error: None

- [ ] **Test 4.4.10**: RAG index scaling
  - Setup: Add 10000 documents to RAG
  - Expected: Search performance remains <200ms
  - Error: None

---

## Critical Path Diagram

```
START
  │
  ├─→ Phase 1: Service Unit Tests (Tests 1.1 - 1.5)
  │     │ Parallel: 1.1, 1.2, 1.3, 1.4, 1.5
  │     └─→ All pass: ValidationError, DatabaseError, RAGError working
  │
  ├─→ Phase 2: Convex Tests (Tests 2.1 - 2.4) [depends on 1]
  │     │ Sequential: 2.1 → 2.2 → 2.3 → 2.4
  │     └─→ All pass: mutations/queries validated, auth working
  │
  ├─→ Phase 3: Database Tests (Tests 3.1 - 3.4) [depends on 1,2]
  │     │ Parallel: 3.1, 3.2, 3.3, 3.4
  │     └─→ All pass: schema valid, indexes present, isolation working
  │
  └─→ Phase 4: Integration Tests (Tests 4.1 - 4.4) [depends on 2,3]
        │ Sequential: 4.1 → 4.2 → 4.3 → 4.4
        └─→ All pass: e2e workflows, error handling, performance baselines

END (Backend ready for frontend integration)
```

---

## Success Criteria

### Coverage Requirements
- [ ] Unit tests: 85%+ coverage of service layer functions
- [ ] Integration tests: All critical paths tested (create → query → update → archive)
- [ ] Error tests: All error types tested with proper error responses
- [ ] Database tests: All schema constraints validated

### Performance Baselines
- [ ] Single entity query: <50ms
- [ ] List query (100 entities): <200ms
- [ ] Search query (1000 entities): <500ms
- [ ] RAG search: <200ms
- [ ] Event query (1000 events): <300ms

### Quality Gates
- [ ] All tests pass (100% pass rate)
- [ ] No TypeScript errors (`bun run generate-types` succeeds)
- [ ] No console errors in test output
- [ ] Code coverage >85%
- [ ] Zero test warnings

### Deliverables
- [ ] `/backend/test/services/*.test.ts` - Service unit tests (50+ tests)
- [ ] `/backend/test/convex/*.test.ts` - Convex function tests (30+ tests)
- [ ] `/backend/test/database/*.test.ts` - Database integrity tests (30+ tests)
- [ ] `/backend/test/integration/*.test.ts` - E2E tests (20+ tests)
- [ ] Test configuration: `vitest.config.ts`, `test/setup.ts`
- [ ] Mock utilities: `test/mocks/`, `test/fixtures/`
- [ ] Coverage report: `coverage/` directory

---

## Test Database Setup Requirements

### Development Test Database
```typescript
// test/setup.ts
import { vi } from 'vitest';

// Mock Convex context
export const mockConvexContext = {
  db: {
    get: vi.fn(),
    insert: vi.fn(),
    patch: vi.fn(),
    replace: vi.fn(),
    delete: vi.fn(),
    query: vi.fn(),
  },
  auth: {
    getUserIdentity: vi.fn(),
  },
};

// Mock Effect.ts services
export const mockRAGService = {
  addDocument: vi.fn(),
  deleteDocument: vi.fn(),
  search: vi.fn(),
  addChunks: vi.fn(),
};

export const mockAgentService = {
  createThread: vi.fn(),
  sendMessage: vi.fn(),
  streamResponse: vi.fn(),
  listThreads: vi.fn(),
};

// Helper to reset mocks between tests
export function resetMocks() {
  Object.values(mockConvexContext).forEach(mock =>
    Object.values(mock).forEach(fn => fn && fn.mockReset?.())
  );
  Object.values(mockRAGService).forEach(fn => fn.mockReset?.());
  Object.values(mockAgentService).forEach(fn => fn.mockReset?.());
}
```

### Test Data Fixtures
```typescript
// test/fixtures/entities.ts
export const mockEntity = {
  _id: "test-entity-1",
  groupId: "test-group-1",
  type: "blog_post",
  name: "Test Blog Post",
  properties: {
    content: "Test content",
    description: "Test description"
  },
  status: "published",
  createdAt: 1699000000000,
  updatedAt: 1699000000000
};

export const mockGroup = {
  _id: "test-group-1",
  slug: "test-group",
  name: "Test Group",
  type: "organization",
  status: "active",
  settings: {
    visibility: "private",
    joinPolicy: "invite_only",
    plan: "pro"
  },
  createdAt: 1699000000000,
  updatedAt: 1699000000000
};
```

---

## Test Execution

### Run All Tests
```bash
cd backend
bun run test
```

### Run Specific Phase
```bash
# Phase 1: Service unit tests
bun run test test/services/**/*.test.ts

# Phase 2: Convex tests
bun run test test/convex/**/*.test.ts

# Phase 3: Database tests
bun run test test/database/**/*.test.ts

# Phase 4: Integration tests
bun run test test/integration/**/*.test.ts
```

### Watch Mode
```bash
bun run test:watch
```

### Coverage Report
```bash
bun run test:coverage
```

---

## Notes & Blockers

### Known Issues
- [ ] Mock Convex context may need adjustment based on actual SDK
- [ ] RAG service mocking depends on @convex-dev/rag API
- [ ] Agent service mocking depends on @convex-dev/agent API

### Dependencies
- Vitest v3.2.4 (already in package.json)
- Effect v3.13.6 (already in package.json)
- @types/node for Node APIs
- Mock library (use Vitest's built-in `vi`)

### Next Steps After Testing
1. Run full test suite
2. Fix any failing tests
3. Achieve 85%+ coverage
4. Run performance baseline tests
5. Document performance characteristics
6. Move to Phase 5 (Frontend integration)

---

## Timeline Estimation

- **Phase 1 (Service tests)**: 2-3 cycles
- **Phase 2 (Convex tests)**: 2-3 cycles
- **Phase 3 (Database tests)**: 2-3 cycles
- **Phase 4 (Integration tests)**: 2-3 cycles
- **Total**: 8-12 cycles (Cycle 65-76)

Current progress: Cycle 65/100 (ready to start Phase 1)

---

## References

- Backend schema: `/Users/toc/Server/ONE/backend/convex/schema.ts`
- Effect.ts services: `/Users/toc/Server/ONE/backend/convex/services/layers.ts`
- Entity service: `/Users/toc/Server/ONE/backend/convex/services/entityService.ts`
- Feature recommender: `/Users/toc/Server/ONE/backend/convex/services/featureRecommender.ts`
- Things mutations: `/Users/toc/Server/ONE/backend/convex/mutations/things.ts`
- Vitest config: To be created in `/Users/toc/Server/ONE/backend/vitest.config.ts`
- CLAUDE.md: Development guidelines and patterns

---

**Status**: Ready for backend engineer to begin Phase 1 (service unit tests)
**Estimated Completion**: Cycle 76/100 with full backend coverage
