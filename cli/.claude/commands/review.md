# /review - Code review focused on ontology patterns

Conduct thorough code review of `$ARGUMENTS` focusing on 6-dimension ontology compliance and platform patterns.

## Review Criteria

### 1. Ontology Compliance (Critical)
- **Dimension Mapping**: Every feature maps to groups/people/things/connections/events/knowledge
- **Entity Types**: Only use defined types from schema (66+ thing types, 25+ connection types, 67+ event types)
- **Schema Structure**: Follow required fields (groupId, status, timestamps)
- **Properties Field**: Flexible `properties` for type-specific data (can use `any` here)

### 2. Multi-tenant Safety (Critical)
- **Query Filtering**: ALL queries MUST filter by groupId
- **Data Isolation**: No cross-group data access without explicit parent-child relationship
- **Authorization**: Verify user has access to groupId before operations
- **Hierarchical Access**: Parent groups can access child data (if configured)

### 3. Event Logging (Critical)
- **Mutation Events**: Every state change logs corresponding event
- **Event Structure**: Include actor, target, timestamp, metadata
- **Event Types**: Use correct types from ontology (67+ defined)
- **Audit Trail**: Complete chain of causality

### 4. Pattern Convergence (High Priority)
- **Existing Patterns**: Code reinforces patterns, doesn't introduce new ones
- **Service Layer**: Use Effect.ts services for business logic
- **Convex Functions**: Keep mutations/queries thin (delegate to services)
- **Frontend Components**: Follow shadcn/ui + React 19 patterns
- **Astro Pages**: SSR with proper data fetching

### 5. Security (Critical)
- **Role-based Access**: Verify platform_owner, org_owner, org_user, customer roles
- **Authentication**: Use Better Auth patterns
- **Input Validation**: Validate all inputs with Convex validators (v.*)
- **Secrets Management**: No hardcoded secrets, use environment variables

### 6. Code Quality (Medium Priority)
- **TypeScript**: Strict typing (no `any` except in entity properties)
- **Error Handling**: Proper error types with `_tag` field
- **Testing**: Unit tests for services, integration tests for flows
- **Documentation**: JSDoc comments for public APIs

### 7. Frontend Best Practices (Medium Priority)
- **Loading States**: All async operations show loading/error states
- **Hydration**: `client:load` for interactive components
- **Tailwind v4**: Use HSL colors with `hsl(var(--color-name))`
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

## Output Format

```
CODE REVIEW: [file/component name]

CRITICAL ISSUES (must fix before merge):
❌ [Issue] - Line X-Y
   Impact: [security/data loss/corruption risk]
   Fix: [specific remediation]

WARNINGS (should fix):
⚠️ [Issue] - Line X
   Impact: [performance/maintainability concern]
   Suggestion: [improvement]

SUGGESTIONS (nice to have):
💡 [Optimization] - Line X
   Benefit: [expected improvement]

ONTOLOGY COMPLIANCE:
✓ Groups: [compliant/issues]
✓ People: [compliant/issues]
✓ Things: [compliant/issues]
✓ Connections: [compliant/issues]
✓ Events: [compliant/issues]
✓ Knowledge: [compliant/issues]

PATTERN CONVERGENCE:
✓ Follows existing patterns
✓ Uses Effect.ts services
✓ Thin Convex wrappers
✓ Multi-tenant safe

OVERALL: [APPROVED / NEEDS CHANGES / BLOCKED]
```

## Example Usage

```bash
/review backend/convex/mutations/groups.ts
/review web/src/components/features/
/review backend/convex/queries/entities.ts web/src/pages/groups/
```

## Review Priorities

1. **Critical** - Security, data isolation, ontology violations
2. **High** - Pattern divergence, missing event logging
3. **Medium** - Code quality, testing, documentation
4. **Low** - Style preferences, minor optimizations
