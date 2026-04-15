# /test - Run tests and fix failures

Run comprehensive test suite for `$ARGUMENTS`, analyze failures, fix issues, and ensure 100% pass rate.

## Testing Workflow

### 1. Run Tests

```bash
# Run specific test file
bun test $ARGUMENTS

# Run with coverage
bun test --coverage $ARGUMENTS

# Run in watch mode (during development)
bun test --watch $ARGUMENTS
```

### 2. Analyze Failures

For each failing test:
- **Read error message**: Understand what assertion failed
- **Check test intent**: Preserve original test purpose
- **Identify root cause**: Implementation bug vs test bug
- **Verify ontology compliance**: Ensure fix maintains 6-dimension structure

### 3. Fix Issues

**Priority order:**
1. **Critical**: Security vulnerabilities, data corruption, multi-tenant violations
2. **High**: Broken features, missing event logging, schema violations
3. **Medium**: Performance issues, incomplete error handling
4. **Low**: Code style, minor optimizations

**Fix principles:**
- Preserve test intent (don't just make tests pass by changing assertions)
- Maintain ontology compliance (all fixes respect 6 dimensions)
- Follow existing patterns (pattern convergence, not divergence)
- Add missing tests (if coverage gaps found)

### 4. Re-run Until Pass

```bash
# Fix and re-run iteratively
bun test $ARGUMENTS
# ... fix issues ...
bun test $ARGUMENTS
# ... repeat until 100% pass ...
```

### 5. Report Results

## Test Categories

### Unit Tests
- **Services**: Effect.ts business logic (pure functions)
- **Utilities**: Helper functions, validators
- **Components**: React component behavior (not visual)

### Integration Tests
- **Frontend → Backend**: Convex query/mutation flows
- **Authentication**: All 6 auth methods (email/password, OAuth, magic links, etc.)
- **Multi-tenant**: Group isolation and hierarchy
- **Event Logging**: Mutation → Event creation

### E2E Tests (Future)
- **User Flows**: Complete user journeys
- **Cross-feature**: Multiple features working together
- **Performance**: Load testing, query optimization

## Ontology Validation in Tests

Every test should validate:
- ✓ Entities map to correct dimensions
- ✓ Multi-tenant scoping (groupId filtering)
- ✓ Event logging for state changes
- ✓ Schema compliance (required fields)
- ✓ Authorization (role-based access)

## Output Format

```
TEST RESULTS: [file/component name]

SUMMARY:
✓ Passed: X/Y tests
❌ Failed: N tests
⏭️ Skipped: M tests
📊 Coverage: XX%

FAILURES:

Test: "should create entity with groupId"
File: backend/convex/mutations/entities.test.ts:45
Error: Expected groupId to be defined, got undefined
Root Cause: Missing groupId parameter in mutation
Fix Applied: Added groupId validation and parameter
Status: ✓ FIXED

Test: "should log entity_created event"
File: backend/convex/mutations/entities.test.ts:67
Error: Expected 1 event, found 0
Root Cause: Event logging not implemented
Fix Applied: Added event insertion after entity creation
Status: ✓ FIXED

ONTOLOGY COMPLIANCE:
✓ All entities have groupId
✓ Event logging complete
✓ Schema validation passes
✓ Multi-tenant safe

COVERAGE GAPS:
⚠️ Missing tests for error cases
💡 Suggestion: Add tests for invalid groupId

FINAL STATUS: ✓ ALL TESTS PASSING (Y/Y)
```

## Example Usage

```bash
/test test/auth
/test backend/convex/mutations/entities.test.ts
/test web/src/components/features/EntityList.test.tsx
/test test/
```

## Test Fixtures

Use ontology-compliant fixtures:

```typescript
// Test fixture for groups
const testGroup = {
  _id: "group123" as Id<"groups">,
  name: "Test Organization",
  type: "organization" as const,
  parentGroupId: undefined,
  properties: { plan: "starter" as const },
  status: "active" as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Test fixture for things
const testEntity = {
  _id: "entity123" as Id<"things">,
  groupId: testGroup._id,
  type: "user",
  name: "Test User",
  properties: { email: "test@example.com" },
  status: "active" as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

## Common Test Patterns

### Testing Multi-tenant Isolation
```typescript
test("should only return entities for specified group", async () => {
  const group1Entities = await ctx.runQuery(api.queries.entities.list, {
    groupId: group1._id,
  });
  const group2Entities = await ctx.runQuery(api.queries.entities.list, {
    groupId: group2._id,
  });

  expect(group1Entities).not.toContainEqual(group2Entities[0]);
});
```

### Testing Event Logging
```typescript
test("should log event on entity creation", async () => {
  await ctx.runMutation(api.mutations.entities.create, args);

  const events = await ctx.runQuery(api.queries.events.list, {
    type: "entity_created",
  });

  expect(events).toHaveLength(1);
  expect(events[0].actorId).toBeDefined();
});
```

## Test Quality Standards

- ✓ **Descriptive names**: Test names explain intent clearly
- ✓ **Single assertion**: One test, one thing (mostly)
- ✓ **Isolated**: Tests don't depend on each other
- ✓ **Fast**: Unit tests run in milliseconds
- ✓ **Deterministic**: Same input → same output
- ✓ **Ontology-aware**: Validate dimension compliance
