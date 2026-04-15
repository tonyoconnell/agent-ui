# Frontend Testing Quick Reference

**File:** `.claude/plans/todo-agent-frontend.md`
**Status:** Complete - Ready for Cycle 65-100
**Total Tests:** 646+ cases across 7 phases

---

## At-A-Glance Summary

| Phase | Name | Cycles | Tests | Focus |
|-------|------|-----------|-------|-------|
| 1 | Setup | 65-66 | 0 | Configuration, mocks, utils |
| 2 | Components | 67-72 | 162 | Demo, features, UI components |
| 3 | Integration | 73-78 | 62 | Convex hooks, composition, forms |
| 4 | Interactions | 79-84 | 76 | Form submission, buttons, navigation |
| 5 | Edge Cases | 85-88 | 82 | Loading, errors, empty states |
| 6 | A11y & UX | 89-95 | 104 | Keyboard, theme, responsive |
| 7 | E2E | 96-100 | 160 | Auth, groups, things, real-time |
| **TOTAL** | | **65-100** | **646+** | **All critical paths** |

---

## Phase Execution Order

### Sequential (Required Order)
```
Phase 1: SETUP
    ↓ (foundation must be ready)
Phase 2: COMPONENTS (parallel-ready)
    ↓ (components needed for integration)
Phase 3: INTEGRATION (parallel-ready)
    ↓ (need interaction tests)
Phase 4: INTERACTIONS (parallel-ready)
    ↓ (need baseline before edge cases)
Phase 5: EDGE CASES (parallel-ready)
    ↓ (need base functionality)
Phase 6: A11Y & RESPONSIVE (parallel-ready)
    ↓ (components must be stable)
Phase 7: E2E (final validation)
```

### Parallel Opportunity
- Phase 2 can split 3 branches: Demo / Features / UI
- Phase 3 can split 3 branches: Convex / Composition / Forms
- Phase 4 can split 3 branches: Forms / Buttons / Navigation
- Phase 6 can split 3 branches: Keyboard / Theme / Responsive

---

## Key Files Created

```
/Users/toc/Server/ONE/.claude/plans/
├── todo-agent-frontend.md              (MAIN: 1,542 lines)
└── QUICK-REFERENCE-FRONTEND-TESTING.md (THIS FILE)
```

---

## Test Architecture

```
Test Utilities (Shared)
├── mocks/factory.ts        (6-dimension mocks)
├── mocks/convex.ts         (useQuery/useMutation)
├── mocks/data.ts           (test fixtures)
├── utils/setup.tsx         (environment setup)
├── utils/render.tsx        (custom render)
├── utils/assertions.ts     (ontology assertions)
└── utils/builders.ts       (fluent test builders)

Test Suites (Organization)
├── components/
│   ├── demo/demo.test.tsx          (8 components)
│   ├── features/features.test.tsx  (7 components)
│   └── ui/ui-components.test.tsx   (10 components)
├── integration/
│   ├── convex-hooks.test.tsx       (Convex patterns)
│   ├── component-composition.test.tsx (Component trees)
│   └── forms.test.tsx              (Form flows)
├── interactions/
│   ├── form-submission.test.tsx    (Form UX)
│   ├── button-interactions.test.tsx (Button flows)
│   └── navigation.test.tsx         (Route navigation)
├── edge-cases/
│   ├── loading-states.test.tsx     (Async states)
│   ├── error-handling.test.tsx     (Error recovery)
│   └── empty-states.test.tsx       (Null safety)
├── a11y/
│   ├── keyboard-navigation.test.tsx (WCAG AA)
│   ├── theme-testing.test.tsx      (Colors, dark mode)
│   └── responsive-design.test.tsx  (Mobile/tablet/desktop)
└── e2e/
    ├── auth-flow.test.ts           (Auth methods)
    ├── groups-flow.test.ts         (Org hierarchy)
    ├── things-connections-flow.test.ts (CRUD ops)
    └── realtime-flow.test.ts       (Live updates)
```

---

## Component Coverage

### Demo Components (8)
- HooksDemo (useQuery/useMutation examples)
- SearchDemo (vector search interface)
- EventsDemo (activity timeline)
- ConnectionsDemo (relationship visualization)
- PeopleDemo (user management)
- GroupsDemo (group selection/hierarchy)
- DemoHero (landing hero)
- DemoContainer (demo wrapper)

### Feature Components (7)
- ContactForm (form validation/submission)
- GroupTypeSelector (type selection)
- InstallationFileBrowser (file tree)
- OntologyExplorer (6-dimension navigator)
- SendToStudios (batch distribution)
- SendToTools (integration sender)
- PerformanceChart (metrics visualization)

### UI Components (10 sampled)
- Button (actions)
- Input (text entry)
- Card (content container)
- Dialog (modal)
- Tabs (navigation)
- Select (dropdown)
- FormField (form wrapper)
- Alert (messages)
- Badge (labels)
- DropdownMenu (context menu)

---

## Test Case Examples

### Demo Component (HooksDemo)
```
✓ Should render hooks examples without crashing
✓ Should display useQuery hook documentation
✓ Should display useMutation hook documentation
✓ Should show real-time updates example
✓ Should display error handling patterns
✓ Should show loading state examples
✓ Should render code examples correctly
✓ Should handle code copy functionality
```

### Feature Component (GroupTypeSelector)
```
✓ Should render all 6 group types
✓ Should select group type
✓ Should highlight selected type
✓ Should display type descriptions
✓ Should show type icons
✓ Should disable unavailable types based on permissions
✓ Should trigger onChange callback
✓ Should support keyboard navigation
```

### Integration Test (useQuery)
```
✓ Should fetch and display entities
✓ Should refetch on dependency change
✓ Should handle loading state
✓ Should handle error state
✓ Should cache results
✓ Should support pagination
✓ Should filter by groupId (multi-tenant isolation)
✓ Should show real-time updates
```

### Interaction Test (Form Submission)
```
✓ User types in name field → name updates
✓ User types in email field → email validates
✓ User submits empty form → shows validation error
✓ User submits with invalid email → shows email error
✓ User submits with valid data → success toast appears
✓ User sees loading spinner during submission
✓ User can retry after network error
✓ Form clears after successful submission
```

### E2E Test (Auth Flow)
```
✓ User visits signup page
✓ User fills form (email, password, name)
✓ User submits form
✓ User receives confirmation
✓ User is logged in
✓ User redirected to onboarding
```

---

## Running Tests

```bash
# All tests
bun test

# With coverage report
bun test:coverage

# Watch mode (auto-rerun on change)
bun test:watch

# Interactive UI dashboard
bun test:ui

# Specific test file
bun test src/tests/components/demo/demo.test.tsx

# Specific test suite
bun test -t "ContactForm"

# With verbose output
bun test -- --reporter=verbose
```

---

## Success Metrics

### Quantitative
- 646+ test cases written
- 595+ tests passing (92% baseline)
- 0 failing tests
- 0 flaky tests (consistent on 10 runs)
- Test suite: < 30 seconds
- Single test: < 1 second

### Coverage Goals
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+
- Lighthouse: 90+

### Code Quality
- No console errors/warnings
- No unhandled promise rejections
- TypeScript strict mode passes
- ESLint passes
- No snapshots outdated

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigable
- Screen reader compatible
- Dark mode working
- Responsive on all viewports

---

## 6-Dimension Ontology Coverage

### Groups (Hierarchical)
- Organization (parent)
- Department (child)
- Team (child-child)
- Status: draft/active/archived
- Plans: starter/pro/enterprise

### People (Roles)
- platform_owner (full system access)
- org_owner (organization management)
- org_user (team member)
- customer (marketplace buyer)

### Things (66+ types)
- course, ai_clone, blog_post, token
- content_item, agent, workflow, integration
- ... plus 58 more types

### Connections (25+ types)
- owns, authored, holds_tokens
- enrolled_in, follows, delegated
- communicated, transacted, etc.

### Events (67+ types)
- entity_created, entity_updated
- course_enrolled, connection_created
- event_created, and more

### Knowledge (Vector)
- Labels and tags
- Vector embeddings
- RAG categorization
- Taxonomy structure

---

## Key Testing Patterns

### Mock Factory Pattern
```typescript
new GroupBuilder()
  .withName('Engineering')
  .asOrganization()
  .withPlan('pro')
  .build()
```

### Custom Render Pattern
```typescript
renderWithProviders(<Component />, {
  initialState: { /* ... */ },
  providers: [ /* ... */ ]
})
```

### Assertion Pattern
```typescript
assertThingHasConnection(thingId, 'enrolled_in')
assertEventLogged('course_enrolled', courseId)
assertGroupScoped(groupId, query)
```

### Interaction Pattern
```typescript
const { getByRole, getByText } = renderWithProviders(<Form />)
fireEvent.change(getByRole('textbox'), { target: { value: 'test' } })
fireEvent.click(getByText('Submit'))
await waitFor(() => expect(mockMutation).toHaveBeenCalled())
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Vitest not found | Config missing | Create vitest.config.ts (Task 1.1) |
| Mock undefined | Factory not imported | Import from mocks/factory.ts |
| Hydration mismatch | SSR/Client inconsistency | Use client:load directive |
| Flaky tests | Race conditions | Use waitFor for async operations |
| Memory leak warning | Subscriptions not cleaned | Cleanup in afterEach |
| Snapshot outdated | Code changed | Run with --update flag |
| Provider missing | Render without Convex | Use renderWithProviders utility |
| Test timeout | Long async operation | Increase timeout in vitest.config |

---

## Dependencies Status

### Backend Ready?
- [ ] Convex schema finalized
- [ ] Auth mutations available
- [ ] Real-time subscriptions working
- [ ] Event logging implemented
- [ ] Permission validation in place

### Frontend Ready?
- [ ] Vitest configured
- [ ] Mock factories built
- [ ] Test utilities ready
- [ ] Components developed
- [ ] Integration tests passing

### Testing Infrastructure?
- [ ] @testing-library/react installed
- [ ] vitest installed
- [ ] happy-dom for DOM simulation
- [ ] TypeScript strict mode
- [ ] ESLint rules in place

---

## Execution Timeline

### Cycle 65-66 (Phase 1: Setup)
- Create vitest.config.ts
- Build mock factory system
- Setup test utilities and helpers

### Cycle 67-72 (Phase 2: Components - Can Parallelize)
```
Branch A: Demo tests      (HooksDemo, SearchDemo, etc.)
Branch B: Feature tests   (ContactForm, GroupSelector, etc.)
Branch C: UI tests        (Button, Input, Card, etc.)
```

### Cycle 73-78 (Phase 3: Integration - Can Parallelize)
```
Branch A: Convex hooks    (useQuery/useMutation patterns)
Branch B: Composition     (Component trees and props)
Branch C: Forms           (Submission flows)
```

### Cycle 79-84 (Phase 4: Interactions - Can Parallelize)
```
Branch A: Form UX         (Input, validation, submission)
Branch B: Button flows    (Click handlers, loading states)
Branch C: Navigation      (Routing, URL params)
```

### Cycle 85-88 (Phase 5: Edge Cases - Sequential)
- Loading states and Suspense
- Error boundaries and recovery
- Empty and null states

### Cycle 89-95 (Phase 6: A11y & Responsive - Can Parallelize)
```
Branch A: Keyboard        (Tab, Enter, Escape, Arrow keys)
Branch B: Theme           (Dark mode, colors, contrast)
Branch C: Responsive      (Mobile, tablet, desktop)
```

### Cycle 96-100 (Phase 7: E2E - Sequential)
- Authentication flows (6 methods)
- Group/organization hierarchy
- Thing CRUD operations
- Real-time updates and sync

---

## Next Agent Checklist

### For Agent Backend
- [ ] Verify Convex schema matches mocks
- [ ] Enable real-time subscriptions
- [ ] Implement event logging
- [ ] Test permission checks

### For Agent Designer
- [ ] Review component visual specs
- [ ] Validate accessibility requirements
- [ ] Confirm color contrast (WCAG AA)
- [ ] Approve responsive breakpoints

### For Agent Quality
- [ ] Run full test suite
- [ ] Generate coverage report
- [ ] Check performance metrics
- [ ] Validate Lighthouse score

### For Agent Ops
- [ ] Update CI/CD pipeline
- [ ] Configure test reporting
- [ ] Setup coverage dashboards
- [ ] Plan deployment gates

---

## File Reference

**Main Document:** `/Users/toc/Server/ONE/.claude/plans/todo-agent-frontend.md`

Sections in detail:
- Executive Summary (scope, stack, current state)
- Critical Path Diagram (visual flow)
- Phase 1-7 Details (20-30 tests each)
- Test Organization (file structure)
- Component Coverage Checklist
- Test Statistics & Goals
- Dependencies & Blockers
- Success Criteria
- Execution Timeline
- Notes for Next Agent

**Total Lines:** 1,542
**Format:** Markdown
**Status:** Complete and ready for execution

---

**Ready for Cycle 65 Execution**

All tasks defined, dependencies identified, and execution plan clear.
Start with Task 1.1 (Vitest Configuration) immediately.
