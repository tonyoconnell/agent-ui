# /optimize - Performance analysis with 6-dimension ontology compliance

Analyze `$ARGUMENTS` for performance and 6-dimension ontology compliance.

## Analysis Checklist

### 1. Query Optimization
- **Database Indexes**: Check if queries use proper indexes (by_type, by_groupId, etc.)
- **N+1 Prevention**: Identify potential N+1 query patterns
- **Batch Operations**: Recommend batching when fetching multiple entities
- **Query Complexity**: Measure query depth and suggest optimizations

### 2. Entity Mapping Validation
- **Dimension Assignment**: Verify all entities map to correct dimensions:
  - Groups: Multi-tenant containers
  - People: Authorization via role metadata
  - Things: Entity types from 66+ defined types
  - Connections: Relationships from 25+ defined types
  - Events: Actions from 67+ defined event types
  - Knowledge: Embeddings and labels
- **Schema Compliance**: Ensure properties follow schema patterns

### 3. Event Logging Coverage
- **Critical Actions**: Every mutation should log events
- **Audit Trail**: Verify actor, target, timestamp, metadata
- **Event Types**: Use correct event types from ontology
- **Performance**: Batch event logging when possible

### 4. Multi-tenant Scoping
- **GroupId Filtering**: All queries MUST filter by groupId
- **Data Isolation**: Verify no cross-group data leakage
- **Hierarchical Access**: Check parent group access patterns
- **Index Usage**: Ensure groupId indexes are used

### 5. Frontend Performance
- **Loading States**: Check for proper loading/error states
- **Client Hydration**: Verify `client:load` directives
- **Bundle Size**: Analyze component imports
- **Caching Strategy**: Review query caching patterns

## Output Format

Provide recommendations in this format:

```
PERFORMANCE ANALYSIS: [file/component name]

Critical Issues (must fix):
- [Issue with specific line numbers and impact]

Warnings (should fix):
- [Issue with explanation]

Optimizations (nice to have):
- [Suggestion with expected benefit]

Ontology Compliance:
✓ Groups: [status]
✓ People: [status]
✓ Things: [status]
✓ Connections: [status]
✓ Events: [status]
✓ Knowledge: [status]

Estimated Performance Gain: [percentage or metric]
```

## Example Usage

```bash
/optimize backend/convex/queries/entities.ts
/optimize web/src/components/features/EntityList.tsx
/optimize backend/convex/mutations/
```
