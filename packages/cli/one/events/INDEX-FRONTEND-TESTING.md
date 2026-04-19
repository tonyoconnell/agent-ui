# Frontend Testing Plan - Complete Index

**Created:** 2025-10-30
**Cycle:** 65/100 (E2E Tests for Critical Paths)
**Status:** Ready for Execution
**Total Tests:** 646+ cases across 7 phases

---

## Quick Navigation

### Main Documents
1. **[todo-agent-frontend.md](todo-agent-frontend.md)** (1,542 lines, 41 KB)
   - Complete testing roadmap with all 646+ test cases
   - 7 phases, 25 tasks, detailed execution plan
   - PRIMARY REFERENCE - Read this for full details

2. **[QUICK-REFERENCE-FRONTEND-TESTING.md](QUICK-REFERENCE-FRONTEND-TESTING.md)** (Quick guide)
   - At-a-glance summary and checklists
   - Execution timelines and next steps
   - Component coverage matrix
   - QUICK START - Use this to get oriented fast

3. **INDEX-FRONTEND-TESTING.md** (This file)
   - Navigation guide and quick lookup
   - Section finder and cross-references

---

## Phase Breakdown

### Phase 1: Test Setup (Cycle 65-66)
**File Section:** todo-agent-frontend.md → "Phase 1: Component Test Setup"
**Tasks:** 3 (vitest config, mock factory, test utilities)
**Tests:** 0 (foundation layer)
**Estimated Time:** 2 cycles

**Key Files to Create:**
- `/Users/toc/Server/ONE/web/vitest.config.ts`
- `/Users/toc/Server/ONE/web/src/tests/mocks/factory.ts`
- `/Users/toc/Server/ONE/web/src/tests/utils/setup.tsx`

**Task 1.1:** Establish Vitest Configuration
- Configure happy-dom environment
- Setup React Testing Library
- Set coverage thresholds (80/75/80/80)

**Task 1.2:** Create Mock Factory System
- 6-dimension entity mocks (groups, people, things, connections, events, knowledge)
- Convex hook mocks (useQuery, useMutation)
- Type-safe builders and fixtures

**Task 1.3:** Setup Test Utilities
- Custom render with providers
- Common assertions for ontology
- Test data builders and helpers

---

### Phase 2: Component Unit Tests (Cycle 67-72)
**File Section:** todo-agent-frontend.md → "Phase 2: Component Unit Tests"
**Tasks:** 3 (demo, feature, UI components)
**Tests:** 162 total
  - Demo Components: 64 tests
  - Feature Components: 48 tests
  - UI Components: 50 tests
**Estimated Time:** 6 cycles
**Can Parallelize:** 3 branches (demo/features/ui)

**Components to Test:**

Demo (8 components):
- HooksDemo (8 tests)
- SearchDemo (8 tests)
- EventsDemo (8 tests)
- ConnectionsDemo (8 tests)
- PeopleDemo (8 tests)
- GroupsDemo (8 tests)
- DemoHero (4 tests)
- DemoContainer (4 tests)

Feature (7 components):
- ContactForm (8 tests)
- GroupTypeSelector (8 tests)
- InstallationFileBrowser (8 tests)
- OntologyExplorer (8 tests)
- SendToStudios (6 tests)
- SendToTools (6 tests)
- PerformanceChart (6 tests)

UI (10 components sampled):
- Button (6 tests)
- Input (5 tests)
- Card (4 tests)
- Dialog (6 tests)
- Tabs (4 tests)
- Select (6 tests)
- FormField (4 tests)
- Alert (4 tests)
- Badge (3 tests)
- DropdownMenu (6 tests)

**Test Files to Create:**
- `/Users/toc/Server/ONE/web/src/tests/components/demo/demo.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/components/features/features.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/components/ui/ui-components.test.tsx`

---

### Phase 3: Integration Tests (Cycle 73-78)
**File Section:** todo-agent-frontend.md → "Phase 3: Integration Tests"
**Tasks:** 3 (Convex hooks, composition, forms)
**Tests:** 62 total
  - Convex Hooks: 22 tests
  - Component Composition: 18 tests
  - Form Integration: 22 tests
**Estimated Time:** 6 cycles
**Can Parallelize:** 3 branches

**Test Scenarios:**
- useQuery with real Convex backend
- useMutation with optimistic updates
- Component prop flow and state sync
- Form submission end-to-end
- Multi-component data synchronization

**Test Files to Create:**
- `/Users/toc/Server/ONE/web/src/tests/integration/convex-hooks.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/integration/component-composition.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/integration/forms.test.tsx`

---

### Phase 4: User Interaction Tests (Cycle 79-84)
**File Section:** todo-agent-frontend.md → "Phase 4: User Interaction Tests"
**Tasks:** 3 (form submission, buttons, navigation)
**Tests:** 76 total
  - Form Submission: 26 tests
  - Button Interactions: 26 tests
  - Navigation: 24 tests
**Estimated Time:** 6 cycles
**Can Parallelize:** 3 branches

**Test Focus:**
- User typing and form input
- Form validation feedback
- Button click handling
- Loading and disabled states
- Route navigation and links
- Query parameter handling
- Breadcrumb navigation

**Test Files to Create:**
- `/Users/toc/Server/ONE/web/src/tests/interactions/form-submission.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/interactions/button-interactions.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/interactions/navigation.test.tsx`

---

### Phase 5: Edge Cases & Errors (Cycle 85-88)
**File Section:** todo-agent-frontend.md → "Phase 5: Edge Cases & Error Handling"
**Tasks:** 3 (loading states, errors, empty states)
**Tests:** 82 total
  - Loading States: 26 tests
  - Error Boundaries: 30 tests
  - Empty/Null States: 26 tests
**Estimated Time:** 4 cycles
**Sequential Only** (depends on previous phases)

**Test Coverage:**
- Loading skeletons and spinners
- Suspense boundaries
- Timeout handling
- Error boundaries catching exceptions
- Network error recovery
- Validation error display
- Empty list states
- Null/undefined safety
- Edge case values (long text, unicode, zero, empty arrays)

**Test Files to Create:**
- `/Users/toc/Server/ONE/web/src/tests/edge-cases/loading-states.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/edge-cases/error-handling.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/edge-cases/empty-states.test.tsx`

---

### Phase 6: Accessibility & Responsive (Cycle 89-95)
**File Section:** todo-agent-frontend.md → "Phase 6: Accessibility & Responsive Design"
**Tasks:** 3 (keyboard navigation, dark mode, responsive)
**Tests:** 104 total
  - Keyboard Navigation: 40 tests
  - Dark Mode & Theme: 30 tests
  - Responsive Design: 34 tests
**Estimated Time:** 7 cycles
**Can Parallelize:** 3 branches

**Test Coverage:**
- WCAG 2.1 AA compliance
- Keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape, Arrows)
- ARIA labels and roles
- Screen reader compatibility
- Dark mode rendering
- Color contrast verification (4.5:1 for AA)
- Mobile viewport (320px+)
- Tablet viewport (768px+)
- Desktop viewport (1024px+)
- Responsive images and layout
- Touch target sizing (44x44px)

**Test Files to Create:**
- `/Users/toc/Server/ONE/web/src/tests/a11y/keyboard-navigation.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/a11y/theme-testing.test.tsx`
- `/Users/toc/Server/ONE/web/src/tests/a11y/responsive-design.test.tsx`

---

### Phase 7: E2E Critical Paths (Cycle 96-100)
**File Section:** todo-agent-frontend.md → "Phase 7: E2E Critical Path Tests"
**Tasks:** 4 (auth, groups, things, real-time)
**Tests:** 160 total
  - Auth Flow: 34 tests
  - Groups/Organizations: 40 tests
  - Things & Connections: 50 tests
  - Real-time & Events: 36 tests
**Estimated Time:** 5 cycles
**Sequential Only** (final validation)

**Critical Path Coverage:**

**Auth E2E:** Sign up → Sign in → Sessions → Magic links → Password reset → OAuth

**Groups E2E:** Create org → Hierarchy → Settings → Membership → Multi-tenant → Permissions

**Things E2E:** Create → Update → Publish → Delete → Search → Enroll → Follow

**Real-Time E2E:** Live queries → Event streams → Multi-user sync → Notifications

**Test Files to Create:**
- `/Users/toc/Server/ONE/web/src/tests/e2e/auth-flow.test.ts`
- `/Users/toc/Server/ONE/web/src/tests/e2e/groups-flow.test.ts`
- `/Users/toc/Server/ONE/web/src/tests/e2e/things-connections-flow.test.ts`
- `/Users/toc/Server/ONE/web/src/tests/e2e/realtime-flow.test.ts`

---

## 6-Dimension Ontology Coverage

### Groups Tested
- Organization (parent level)
- Department (child level)
- Team (child-child level)
- Hierarchical nesting
- Multi-tenant isolation
- Plan management (starter/pro/enterprise)

### People Tested
- platform_owner (full access)
- org_owner (organization management)
- org_user (team member)
- customer (marketplace buyer)
- Role-based permission checking

### Things Tested
- 66+ entity types (courses, agents, posts, tokens, etc.)
- CRUD operations (create, read, update, delete)
- Status lifecycle (draft → published → archived)
- Type-specific properties
- Entity search and filtering

### Connections Tested
- 25+ relationship types (owns, enrolled_in, follows, etc.)
- Bidirectional relationships
- Temporal validity (validFrom/validTo)
- Connection metadata
- Related entity lists

### Events Tested
- 67+ event types
- Activity streams and timelines
- Audit trail logging
- Real-time subscriptions
- Event-based notifications

### Knowledge Tested
- Vector search interface
- Label categorization
- RAG suggestions
- Semantic filtering
- Knowledge discovery

---

## Component Coverage Checklist

### Demo Components (8)
- [ ] HooksDemo (8 tests)
- [ ] SearchDemo (8 tests)
- [ ] EventsDemo (8 tests)
- [ ] ConnectionsDemo (8 tests)
- [ ] PeopleDemo (8 tests)
- [ ] GroupsDemo (8 tests)
- [ ] DemoHero (4 tests)
- [ ] DemoContainer (4 tests)

### Feature Components (7)
- [ ] ContactForm (8 tests)
- [ ] GroupTypeSelector (8 tests)
- [ ] InstallationFileBrowser (8 tests)
- [ ] OntologyExplorer (8 tests)
- [ ] SendToStudios (6 tests)
- [ ] SendToTools (6 tests)
- [ ] PerformanceChart (6 tests)

### UI Components (10 sampled)
- [ ] Button (6 tests)
- [ ] Input (5 tests)
- [ ] Card (4 tests)
- [ ] Dialog (6 tests)
- [ ] Tabs (4 tests)
- [ ] Select (6 tests)
- [ ] FormField (4 tests)
- [ ] Alert (4 tests)
- [ ] Badge (3 tests)
- [ ] DropdownMenu (6 tests)

---

## Test Execution Progress

### Phase 1: Test Setup
- [ ] Cycle 65: Read complete TODO
- [ ] Cycle 66: Implement all 3 tasks

### Phase 2: Component Unit Tests
- [ ] Cycle 67: Demo components (parallel branch A)
- [ ] Cycle 68: Feature components (parallel branch B)
- [ ] Cycle 69: UI components (parallel branch C)
- [ ] Cycle 70: Merge and validate all components
- [ ] Cycle 71: Refine and fix failures
- [ ] Cycle 72: Reach 100% pass rate

### Phase 3: Integration Tests
- [ ] Cycle 73: Convex hooks (parallel branch A)
- [ ] Cycle 74: Component composition (parallel branch B)
- [ ] Cycle 75: Form integration (parallel branch C)
- [ ] Cycle 76: Merge and validate
- [ ] Cycle 77: Refine and fix failures
- [ ] Cycle 78: Reach 100% pass rate

### Phase 4: Interaction Tests
- [ ] Cycle 79: Form submission (parallel branch A)
- [ ] Cycle 80: Button interactions (parallel branch B)
- [ ] Cycle 81: Navigation (parallel branch C)
- [ ] Cycle 82: Merge and validate
- [ ] Cycle 83: Refine and fix failures
- [ ] Cycle 84: Reach 100% pass rate

### Phase 5: Edge Cases
- [ ] Cycle 85: Loading states + error handling
- [ ] Cycle 86: Empty states + null safety
- [ ] Cycle 87: Refine and fix failures
- [ ] Cycle 88: Reach 100% pass rate

### Phase 6: A11y & Responsive
- [ ] Cycle 89: Keyboard navigation (parallel branch A)
- [ ] Cycle 90: Dark mode & theme (parallel branch B)
- [ ] Cycle 91: Responsive design (parallel branch C)
- [ ] Cycle 92: Merge and validate
- [ ] Cycle 93: Refine and fix failures
- [ ] Cycle 94: WCAG compliance audit
- [ ] Cycle 95: Reach 100% pass rate

### Phase 7: E2E Critical Paths
- [ ] Cycle 96: Auth flow tests
- [ ] Cycle 97: Groups/organization flow
- [ ] Cycle 98: Things & connections flow
- [ ] Cycle 99: Real-time event flow
- [ ] Cycle 100: Final validation and deployment prep

---

## Command Reference

```bash
# Run all tests
bun test

# Run with coverage report
bun test:coverage

# Watch mode (auto-rerun on change)
bun test:watch

# Interactive UI dashboard
bun test:ui

# Run specific test file
bun test src/tests/components/demo/demo.test.tsx

# Run specific suite by pattern
bun test -t "ContactForm"

# Run with verbose output
bun test -- --reporter=verbose

# Generate coverage HTML report
bun test:coverage -- --html
```

---

## Success Criteria Checklist

### Quality
- [ ] 646+ test cases written
- [ ] 595+ tests passing (92% baseline)
- [ ] 0 failing tests
- [ ] 0 flaky tests (10 consecutive runs)
- [ ] Test suite < 30 seconds
- [ ] Single test < 1 second

### Coverage
- [ ] Statements: 80%+
- [ ] Branches: 75%+
- [ ] Functions: 80%+
- [ ] Lines: 80%+

### Performance
- [ ] Lighthouse score: 90+
- [ ] LCP: < 2.5s
- [ ] FID: < 100ms
- [ ] CLS: < 0.1

### Code Quality
- [ ] No console errors
- [ ] No unhandled rejections
- [ ] TypeScript strict mode passing
- [ ] ESLint passing
- [ ] No stale snapshots

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigable
- [ ] Screen reader compatible
- [ ] Dark mode working
- [ ] Responsive on all viewports

---

## File Structure

```
web/src/tests/
├── mocks/
│   ├── factory.ts          # 6-dimension mock factories
│   ├── convex.ts           # Convex hook mocks
│   └── data.ts             # Test fixtures
├── utils/
│   ├── setup.tsx           # Test environment
│   ├── render.tsx          # Custom render with providers
│   ├── assertions.ts       # Ontology assertions
│   └── builders.ts         # Test data builders
├── components/
│   ├── demo/demo.test.tsx           (64 tests)
│   ├── features/features.test.tsx   (48 tests)
│   └── ui/ui-components.test.tsx    (50 tests)
├── integration/
│   ├── convex-hooks.test.tsx        (22 tests)
│   ├── component-composition.test.tsx (18 tests)
│   └── forms.test.tsx               (22 tests)
├── interactions/
│   ├── form-submission.test.tsx     (26 tests)
│   ├── button-interactions.test.tsx (26 tests)
│   └── navigation.test.tsx          (24 tests)
├── edge-cases/
│   ├── loading-states.test.tsx      (26 tests)
│   ├── error-handling.test.tsx      (30 tests)
│   └── empty-states.test.tsx        (26 tests)
├── a11y/
│   ├── keyboard-navigation.test.tsx (40 tests)
│   ├── theme-testing.test.tsx       (30 tests)
│   └── responsive-design.test.tsx   (34 tests)
└── e2e/
    ├── auth-flow.test.ts            (34 tests)
    ├── groups-flow.test.ts          (40 tests)
    ├── things-connections-flow.test.ts (50 tests)
    └── realtime-flow.test.ts        (36 tests)
```

---

## Key References

### Main Documentation Files
- **Full Plan:** todo-agent-frontend.md (1,542 lines)
- **Quick Reference:** QUICK-REFERENCE-FRONTEND-TESTING.md
- **This File:** INDEX-FRONTEND-TESTING.md

### Related Files
- `/Users/toc/Server/ONE/CLAUDE.md` (Project guidelines)
- `/Users/toc/Server/ONE/web/package.json` (Dependencies)
- `/Users/toc/Server/ONE/.claude/state/cycle.json` (Current state)

### External References
- **Vitest Documentation:** https://vitest.dev
- **Testing Library:** https://testing-library.com/react
- **WCAG 2.1 Standards:** https://www.w3.org/WAI/WCAG21/quickref/
- **shadcn/ui Components:** https://ui.shadcn.com

---

## Contact & Notes

**Created by:** Agent Frontend
**Current Cycle:** 65/100
**Status:** Ready for Execution
**Last Updated:** 2025-10-30

---

**Quick Start:** Begin with Phase 1 (Tasks 1.1-1.3) in cycle 65-66.
**Full Details:** See todo-agent-frontend.md for comprehensive specifications.
**Fast Reference:** Use QUICK-REFERENCE-FRONTEND-TESTING.md for quick lookups.
