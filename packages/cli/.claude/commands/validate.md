# /validate - 6-dimension structure validation

Validate `$ARGUMENTS` against the 6-dimension ontology specification (Version 1.0.0).

## Validation Checklist

### 1. Groups Dimension
- ✓ All groups have required fields: name, type, status, timestamps
- ✓ Group types are valid: friend_circle, business, community, dao, government, organization
- ✓ Parent-child relationships are valid (parentGroupId references exist)
- ✓ Hierarchical nesting makes sense (no circular references)
- ✓ Organization groups have plan: starter/pro/enterprise

### 2. People Dimension
- ✓ People represented as things with `type: 'creator'`
- ✓ Role metadata exists: platform_owner, org_owner, org_user, customer
- ✓ Every action has an actor (person)
- ✓ Authorization checks use role-based access control

### 3. Things Dimension
- ✓ All things have groupId (multi-tenant scope)
- ✓ Entity types from 66+ defined types
- ✓ Required fields: name, type, status, groupId, timestamps
- ✓ Status lifecycle valid: draft → active → published → archived
- ✓ Properties field contains type-specific data
- ✓ No orphaned entities (groupId references exist)

### 4. Connections Dimension
- ✓ Connection types from 25+ defined types
- ✓ Required fields: fromId, toId, type, groupId, timestamps
- ✓ Bidirectional relationships maintained
- ✓ Temporal validity (validFrom/validTo) if applicable
- ✓ Both entities exist (no broken references)
- ✓ Scoped to correct group

### 5. Events Dimension
- ✓ Event types from 67+ defined types
- ✓ Required fields: type, actorId, targetId, timestamp, groupId
- ✓ Complete audit trail (actor → action → target)
- ✓ Metadata includes protocol info (for consolidated events)
- ✓ Immutable (no updates, only inserts)
- ✓ Chronological ordering

### 6. Knowledge Dimension
- ✓ Labels exist and are categorized
- ✓ Embeddings have proper vector dimensions
- ✓ Linked to things via junction table
- ✓ Scoped to groups (groupId)
- ✓ Supports semantic search patterns

## Multi-tenant Validation

### Data Isolation
- ✓ All queries filter by groupId
- ✓ No cross-group data access without hierarchy
- ✓ Parent groups can access child data (if configured)
- ✓ Each group has independent data, billing, quotas

### Schema Compliance
- ✓ All dimensions include groupId field
- ✓ Indexes include groupId for query performance
- ✓ Foreign key references are valid

## Output Format

```
ONTOLOGY VALIDATION: [component/file name]

DIMENSION COMPLIANCE:

Groups:
  ✓ Valid types and nesting
  ✓ All groups have required fields
  ❌ Issue: [specific violation with line number]

People:
  ✓ Role metadata correct
  ⚠️ Warning: [potential issue]

Things:
  ✓ All entities have groupId
  ✓ Types from defined schema (66+)
  ❌ Issue: [specific violation]

Connections:
  ✓ Types from defined schema (25+)
  ✓ No broken references

Events:
  ✓ Types from defined schema (67+)
  ✓ Complete audit trail
  ⚠️ Warning: [missing event logging]

Knowledge:
  ✓ Labels and embeddings valid
  ✓ Properly linked

MULTI-TENANT SAFETY:
  ✓ All queries filter by groupId
  ✓ No data leakage across groups

VIOLATIONS FOUND: [count]
WARNINGS: [count]

REMEDIATION STEPS:
1. [Specific fix with code example]
2. [Specific fix with code example]

STATUS: [VALID / NEEDS FIXES / CRITICAL ISSUES]
```

## Example Usage

```bash
/validate backend/convex/schema.ts
/validate backend/convex/mutations/entities.ts
/validate backend/convex/
```

## Validation Levels

- **Critical**: Data integrity, multi-tenant violations, missing groupId
- **Error**: Schema violations, invalid types, broken references
- **Warning**: Missing event logging, suboptimal patterns
- **Info**: Suggestions for improvement

## Auto-remediation

For common violations, provide auto-fix code snippets:

```typescript
// Before (missing groupId filter)
const entities = await ctx.db.query("things").collect();

// After (multi-tenant safe)
const entities = await ctx.db
  .query("things")
  .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
  .collect();
```
