# Frontend Testing TODO - Agent Frontend

**Cycle:** 65/100 (E2E Tests for Critical Paths)
**Feature:** AI-powered Recommendations
**Status:** Phase 1 Setup & Component Testing
**Last Updated:** 2025-10-30

---

## Executive Summary

This document defines all frontend testing tasks for the ONE Platform. Frontend testing spans component unit tests, integration tests, user interaction tests, and end-to-end flows. Tests validate the 6-dimension ontology rendering (groups, people, things, connections, events, knowledge) across Astro 5 + React 19 architecture.

**Testing Stack:**
- **Framework:** Vitest 3.2.4
- **DOM Testing:** @testing-library/react 16.3.0
- **Coverage:** Vitest UI + Coverage reports
- **Scope:** React components, Astro pages, user interactions, state management

**Current State:**
- 19 existing test files (auth, groups, things, providers)
- 50+ test cases completed
- Coverage areas: Authentication (6 methods), Groups (hierarchies, selection), Things (validation, services)
- Missing: Recommendations components, demos, features, e2e flows

---

## Critical Path Diagram

```
Phase 1: Test Setup (Cycle 65-66)
    ↓
Phase 2: Component Unit Tests (Cycle 67-72)
    ├── Demo Components (HooksDemo, SearchDemo, EventsDemo, etc.)
    ├── Feature Components (ContactForm, GroupTypeSelector, etc.)
    └── UI Components (High-coverage shadcn/ui)
    ↓
Phase 3: Integration Tests (Cycle 73-78)
    ├── Component Composition (Features within Demos)
    ├── Data Flow (useQuery → Display → useMutation)
    └── State Management (Jotai atoms, Nanostores)
    ↓
Phase 4: User Interaction Tests (Cycle 79-84)
    ├── Form Submission (ContactForm, GroupTypeSelector)
    ├── Button Interactions (Create, Update, Delete)
    └── Navigation (Route changes, Link clicks)
    ↓
Phase 5: Edge Cases & Errors (Cycle 85-88)
    ├── Loading States (Suspense, fallbacks)
    ├── Error Boundaries (Component failures)
    └── Empty States (No data, null checks)
    ↓
Phase 6: Accessibility & Performance (Cycle 89-95)
    ├── Keyboard Navigation (Tab, Enter, Escape)
    ├── ARIA Labels & Roles
    ├── Dark Mode Support
    └── Responsive Design (Mobile, Tablet, Desktop)
    ↓
Phase 7: E2E Flows (Cycle 96-100)
    ├── Critical Paths (Auth → Groups → Things → Connections)
    └── Real-time Updates (Convex subscriptions)
```

---

## Phase 1: Component Test Setup (Cycle 65-66)

### Task 1.1: Establish Vitest Base Configuration

**File:** `/Users/toc/Server/ONE/web/vitest.config.ts`

**Requirements:**
- Configure Vitest with happy-dom environment (lightweight, faster than jsdom)
- Add React Testing Library setup
- Configure Convex mock factory
- Set coverage thresholds (statements: 80%, branches: 75%, functions: 80%, lines: 80%)

**Success Criteria:**
- Vitest config loads without errors
- `bun test` command works
- Basic test passes
- Coverage reporting enabled

**Blockers:** None

---

### Task 1.2: Create Mock Factory System

**Files:**
- `/Users/toc/Server/ONE/web/src/tests/mocks/factory.ts`
- `/Users/toc/Server/ONE/web/src/tests/mocks/convex.ts`
- `/Users/toc/Server/ONE/web/src/tests/mocks/data.ts`

**Requirements:**
- Mock factory for all 6-dimension entities (groups, people, things, connections, events, knowledge)
- Convex useQuery/useMutation mocks
- Realistic data fixtures
- Type-safe mocks matching Convex schema

**Mock Coverage:**
```
Groups:
  - Organization (parent)
  - Department (child)
  - Team (child-child)

People (Things with role):
  - platform_owner
  - org_owner
  - org_user
  - customer

Things (66 types):
  - course, ai_clone, blog_post, token, content_item
  - agent, workflow, integration, etc.

Connections:
  - owns, authored, enrolled_in, follows
  - holds_tokens, delegated, communicated

Events:
  - entity_created, entity_updated, course_enrolled
  - connection_created, event_created

Knowledge:
  - Labels, vectors, taxonomy
```

**Success Criteria:**
- All 6 dimension types have realistic mocks
- Type safety (no `any` except properties)
- Mocks pass TypeScript strict mode

**Blockers:** None - foundation layer

---

### Task 1.3: Setup Test Utilities & Helpers

**Files:**
- `/Users/toc/Server/ONE/web/src/tests/utils/setup.tsx`
- `/Users/toc/Server/ONE/web/src/tests/utils/render.tsx`
- `/Users/toc/Server/ONE/web/src/tests/utils/assertions.ts`

**Requirements:**
- Custom render function with Convex + providers
- Common assertions for ontology data
- Test data builders (fluent API)
- Performance measurement helpers

**Utilities:**
```typescript
// Custom render with all providers
renderWithProviders(component, options)

// Common assertions
assertGroupExists(groupId, type)
assertThingHasConnection(thingId, relationType)
assertEventLogged(eventType, targetId)
assertThingStatusIs(thingId, status)

// Data builders
new GroupBuilder().withName('Test').asOrganization()
new ThingBuilder().withType('course').withStatus('published')
new ConnectionBuilder().owns().from(userId).to(courseId)

// Performance
measureRenderTime(component)
measureQueryTime(queryFn)
```

**Success Criteria:**
- Setup utilities importable across all tests
- Type-safe builders
- No TypeScript errors

**Blockers:** Requires Task 1.1, 1.2 complete

---

## Phase 2: Component Unit Tests (Cycle 67-72)

### Task 2.1: Demo Component Tests

**Components to Test:**
1. HooksDemo.tsx
2. SearchDemo.tsx
3. EventsDemo.tsx
4. ConnectionsDemo.tsx
5. PeopleDemo.tsx
6. GroupsDemo.tsx
7. DemoHero.tsx
8. DemoContainer.tsx

**File:** `/Users/toc/Server/ONE/web/src/tests/components/demo/demo.test.tsx`

**Test Cases per Component (8 tests each):**

```
HooksDemo Tests:
✓ Should render hooks examples without crashing
✓ Should display useQuery hook documentation
✓ Should display useMutation hook documentation
✓ Should show real-time updates example
✓ Should display error handling patterns
✓ Should show loading state examples
✓ Should render code examples correctly
✓ Should handle code copy functionality

SearchDemo Tests:
✓ Should render search interface
✓ Should display vector search explanation
✓ Should show example queries
✓ Should handle query submission
✓ Should display search results
✓ Should filter results by type
✓ Should sort by relevance
✓ Should handle no results state

EventsDemo Tests:
✓ Should render events feed
✓ Should display event timeline
✓ Should show event types
✓ Should filter events by actor
✓ Should filter events by target
✓ Should paginate events
✓ Should show real-time updates
✓ Should handle event creation
```

**Success Criteria:**
- All 64 demo component tests passing (8 components × 8 tests)
- 100% component coverage
- No snapshot mismatches

**Blockers:** Task 1.3 required

---

### Task 2.2: Feature Component Tests

**Components to Test:**
1. ContactForm.tsx
2. GroupTypeSelector.tsx
3. InstallationFileBrowser.tsx
4. OntologyExplorer.tsx
5. SendToStudios.tsx
6. SendToTools.tsx
7. PerformanceChart.tsx

**File:** `/Users/toc/Server/ONE/web/src/tests/components/features/features.test.tsx`

**Test Cases per Component:**

```
ContactForm Tests (8 tests):
✓ Should render form with all fields
✓ Should validate email format
✓ Should validate required fields
✓ Should submit form successfully
✓ Should display validation errors
✓ Should disable submit while loading
✓ Should show success message after submit
✓ Should clear form after successful submit

GroupTypeSelector Tests (8 tests):
✓ Should render all 6 group types
✓ Should select group type
✓ Should highlight selected type
✓ Should display type descriptions
✓ Should show type icons
✓ Should disable unavailable types based on permissions
✓ Should trigger onChange callback
✓ Should support keyboard navigation

InstallationFileBrowser Tests (8 tests):
✓ Should render file tree
✓ Should display folder structure
✓ Should expand/collapse folders
✓ Should show file types with icons
✓ Should highlight selected file
✓ Should scroll to selected file
✓ Should support keyboard navigation
✓ Should handle empty directories

OntologyExplorer Tests (8 tests):
✓ Should render 6 dimensions
✓ Should display entity types
✓ Should show connections between entities
✓ Should expand/collapse dimensions
✓ Should filter by search term
✓ Should highlight matches
✓ Should show entity counts
✓ Should handle navigation

PerformanceChart Tests (6 tests):
✓ Should render chart with data
✓ Should display LCP, FID, CLS metrics
✓ Should show score trends over time
✓ Should handle missing data points
✓ Should render legend correctly
✓ Should be responsive

SendToStudios Tests (6 tests):
✓ Should render studio list
✓ Should select multiple studios
✓ Should disable unavailable studios
✓ Should send content to selected studios
✓ Should show success confirmation
✓ Should handle send errors
```

**Success Criteria:**
- 48 feature component tests passing
- Form validation tests pass
- User interactions work as expected

**Blockers:** Task 1.3, Task 2.1 required

---

### Task 2.3: UI Component Coverage Tests

**Scope:** Sample 10 key shadcn/ui components

**Components:**
1. Button
2. Input
3. Card
4. Dialog
5. Tabs
6. Select
7. FormField
8. Alert
9. Badge
10. Dropdown Menu

**File:** `/Users/toc/Server/ONE/web/src/tests/components/ui/ui-components.test.tsx`

**Test Cases per Component (4-6 tests):**

```
Button Tests:
✓ Should render with text
✓ Should apply variant styles
✓ Should handle click events
✓ Should be disabled when disabled prop set
✓ Should show loading state
✓ Should support keyboard activation

Input Tests:
✓ Should render input field
✓ Should handle onChange
✓ Should validate on blur
✓ Should support placeholder
✓ Should be disabled when disabled prop set

Dialog Tests:
✓ Should render hidden initially
✓ Should open on trigger click
✓ Should close on close button
✓ Should close on escape key
✓ Should trap focus inside dialog
✓ Should restore focus after close

Select Tests:
✓ Should render dropdown
✓ Should open on click
✓ Should select option
✓ Should display selected value
✓ Should filter options
✓ Should support keyboard navigation
```

**Success Criteria:**
- 50+ UI component tests passing
- Accessibility compliance verified
- Visual consistency maintained

**Blockers:** Task 1.3 required

---

## Phase 3: Integration Tests (Cycle 73-78)

### Task 3.1: Convex Hook Integration Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/integration/convex-hooks.test.tsx`

**Test Cases:**

```
useQuery Integration Tests (8 tests):
✓ Should fetch and display entities
✓ Should refetch on dependency change
✓ Should handle loading state
✓ Should handle error state
✓ Should cache results
✓ Should support pagination
✓ Should filter by groupId (multi-tenant isolation)
✓ Should show real-time updates

useMutation Integration Tests (8 tests):
✓ Should execute mutation
✓ Should update UI optimistically
✓ Should handle mutation error and rollback
✓ Should trigger refetch of related queries
✓ Should log event after mutation
✓ Should validate permissions before mutation
✓ Should handle loading state
✓ Should show success toast

Connection Data Flow Tests (6 tests):
✓ Should create connection between entities
✓ Should update connection metadata
✓ Should delete connection
✓ Should prevent invalid connections
✓ Should log connection events
✓ Should enforce permission checks
```

**Success Criteria:**
- 22 integration tests passing
- Real Convex queries/mutations tested
- Mocks validate against actual schema

**Blockers:** Task 2.1, 2.2 required, Convex backend ready

---

### Task 3.2: Component Composition Integration Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/integration/component-composition.test.tsx`

**Test Scenarios:**

```
Demo + Feature Component Composition (6 tests):
✓ ThingsPlayground (Thing list + Thing detail)
✓ GroupsDemo (Group selector + Group hierarchy)
✓ PeopleDemo (User list + User roles)
✓ EventsDemo (Event timeline + event filters)
✓ SearchDemo (Search input + results list)
✓ ConnectionsDemo (Connection creator + connection list)

Data Flow Through Components (6 tests):
✓ Should pass props down correctly
✓ Should propagate events up correctly
✓ Should update sibling components
✓ Should handle parent re-renders
✓ Should maintain component state
✓ Should sync query results across components

State Synchronization Tests (6 tests):
✓ Should sync Jotai atoms across components
✓ Should sync Nanostores across components
✓ Should maintain form state during interactions
✓ Should clear state on unmount
✓ Should handle state reset
✓ Should support undo/redo patterns
```

**Success Criteria:**
- 18 composition tests passing
- Data flows correctly through component trees
- State management consistent

**Blockers:** Task 3.1 required

---

### Task 3.3: Form Integration Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/integration/forms.test.tsx`

**Test Scenarios:**

```
Create Entity Flow (8 tests):
✓ ContactForm → Convex mutation → Event creation
✓ Validate all required fields
✓ Show validation errors
✓ Submit successfully
✓ Create event log
✓ Update groups query after create
✓ Show success toast
✓ Clear form fields

Update Entity Flow (6 tests):
✓ Load entity data into form
✓ Update fields
✓ Validate changes
✓ Submit successfully
✓ Log update event
✓ Refetch entity details

Delete Confirmation Flow (4 tests):
✓ Show delete confirmation dialog
✓ Confirm deletion
✓ Execute delete mutation
✓ Refetch list after delete

Multi-step Form Flow (4 tests):
✓ GroupTypeSelector → Additional properties → Confirmation
✓ Navigate between steps
✓ Validate at each step
✓ Submit final form
```

**Success Criteria:**
- 22 form integration tests passing
- All CRUD operations work end-to-end
- Error handling validated

**Blockers:** Task 3.1, 3.2 required

---

## Phase 4: User Interaction Tests (Cycle 79-84)

### Task 4.1: Form Submission & Validation Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/interactions/form-submission.test.tsx`

**Test Cases:**

```
ContactForm Interactions (10 tests):
✓ User types in name field → name updates
✓ User types in email field → email validates
✓ User types in message field → message updates
✓ User submits empty form → shows validation error
✓ User submits with invalid email → shows email error
✓ User submits with valid data → success toast appears
✓ User sees loading spinner during submission
✓ User can retry after network error
✓ Form clears after successful submission
✓ User can cancel form submission

GroupTypeSelector Interactions (8 tests):
✓ User clicks group type → type highlights
✓ User clicks again → selection toggles
✓ User keyboard navigates (arrows) → highlights change
✓ User presses Enter → selects type
✓ User presses Escape → closes selection
✓ User cannot select unavailable types
✓ Selection shows in parent form
✓ onChange callback fires correctly

OntologyExplorer Interactions (8 tests):
✓ User clicks dimension → expands/collapses
✓ User clicks entity type → shows details
✓ User searches → filters results
✓ User clicks reset → clears search
✓ User navigates with keyboard
✓ User can copy entity ID
✓ User can view entity properties
✓ User can navigate to entity detail page
```

**Success Criteria:**
- 26 interaction tests passing
- Form validation logic verified
- User feedback working (toasts, errors)

**Blockers:** Task 2.2, 3.3 required

---

### Task 4.2: Button & Click Interactions

**File:** `/Users/toc/Server/ONE/web/src/tests/interactions/button-interactions.test.tsx`

**Test Cases:**

```
Create Button Interactions (6 tests):
✓ Click create button → open form/dialog
✓ Form dialog shows correct title
✓ Click cancel → close dialog without creating
✓ Click submit → create entity
✓ Click outside dialog → close dialog
✓ Loading state shown during creation

Edit Button Interactions (6 tests):
✓ Click edit button → load entity data in form
✓ Form shows correct initial values
✓ Click cancel → close without saving
✓ Click save → update entity
✓ Show change indicators
✓ Loading state shown during update

Delete Button Interactions (6 tests):
✓ Click delete button → show confirmation
✓ Confirmation shows entity name
✓ Click cancel → close dialog
✓ Click confirm → delete entity
✓ Loading state shown during deletion
✓ Success toast after deletion

Batch Action Buttons (4 tests):
✓ Select multiple entities
✓ Batch action button appears
✓ Click batch delete → delete all
✓ Update list after batch operation

Navigation Buttons (4 tests):
✓ Next button → navigate forward
✓ Previous button → navigate backward
✓ Link buttons → navigate to routes
✓ External link buttons → open new tab
```

**Success Criteria:**
- 26 button interaction tests passing
- All CRUD operations interactive
- Loading/disabled states work

**Blockers:** Task 4.1 required

---

### Task 4.3: Navigation & Route Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/interactions/navigation.test.tsx`

**Test Cases:**

```
Link Navigation (8 tests):
✓ Click internal link → navigate to page
✓ Breadcrumb navigation → navigate up hierarchy
✓ Back button → go to previous page
✓ Logo click → go to home
✓ Sidebar links → navigate to sections
✓ Navigation maintains scroll position
✓ Active link shows highlighted
✓ Disabled links don't navigate

Page Load Tests (6 tests):
✓ Load groups page → show groups list
✓ Load things page → show things list
✓ Load people page → show people list
✓ Load dashboard → show user stats
✓ Load entity detail page → show entity details
✓ 404 page shows for invalid routes

State Persistence (4 tests):
✓ Navigate away → state preserved
✓ Go back → state restored
✓ Refresh page → state reloaded
✓ Open multiple tabs → independent state

Query Parameter Tests (6 tests):
✓ URL query params filter results
✓ Sorting query param works
✓ Pagination query param works
✓ Search query param works
✓ Update URL on filter change
✓ Restore filter from URL on load
```

**Success Criteria:**
- 24 navigation tests passing
- All routes work correctly
- State persistence validated

**Blockers:** Task 4.1, 4.2 required

---

## Phase 5: Edge Cases & Error Handling (Cycle 85-88)

### Task 5.1: Loading States & Async Operations

**File:** `/Users/toc/Server/ONE/web/src/tests/edge-cases/loading-states.test.tsx`

**Test Cases:**

```
Component Loading States (8 tests):
✓ Show loading skeleton on initial load
✓ Show spinner during mutation
✓ Disable buttons while loading
✓ Show loading text message
✓ Loading state clears after success
✓ Loading state clears after error
✓ Multiple concurrent loads handled
✓ Loading cancellation works

Suspense Boundaries (6 tests):
✓ Suspense shows fallback while loading
✓ Component renders after suspense resolves
✓ Error boundary catches suspense errors
✓ Multiple suspense boundaries work
✓ Nested suspense works correctly
✓ Suspense with streaming works

Timeout Scenarios (6 tests):
✓ Long-running query shows timeout message
✓ Long-running mutation shows timeout error
✓ User can retry after timeout
✓ Timeout error is logged
✓ Timeout doesn't crash app
✓ Recovery from timeout works

Pagination & Infinite Scroll (6 tests):
✓ Load more button fetches next page
✓ Infinite scroll loads next page
✓ Show loading indicator between pages
✓ Append new items to list
✓ Disable load more at end
✓ Prevent duplicate items
```

**Success Criteria:**
- 26 loading state tests passing
- All async states handled
- No race conditions

**Blockers:** Task 3.1 required

---

### Task 5.2: Error Boundary & Exception Handling

**File:** `/Users/toc/Server/ONE/web/src/tests/edge-cases/error-handling.test.tsx`

**Test Cases:**

```
Error Boundary Tests (8 tests):
✓ Error boundary catches component errors
✓ Error boundary shows error UI
✓ Error boundary logs error
✓ Reset button works
✓ Parent boundary catches errors from child
✓ Multiple boundaries work independently
✓ Error doesn't crash whole app
✓ User can navigate away from error

Query Error Handling (8 tests):
✓ Query error shows error message
✓ User can retry query
✓ 404 error handled correctly
✓ 500 error handled correctly
✓ Network error handled correctly
✓ Timeout error handled correctly
✓ Unauthorized error shows login
✓ Forbidden error shows permission denied

Mutation Error Handling (8 tests):
✓ Mutation error shows toast
✓ Optimistic update rolled back on error
✓ Form shows validation errors
✓ User can fix and retry
✓ Network error during mutation handled
✓ Timeout error during mutation handled
✓ Mutation state cleared after error
✓ Multiple concurrent mutations handle errors

Validation Error Tests (6 tests):
✓ Show field-level validation errors
✓ Show form-level validation error
✓ Highlight invalid fields
✓ Clear error on field change
✓ Custom validation messages shown
✓ Async validation works
```

**Success Criteria:**
- 30 error handling tests passing
- All errors caught gracefully
- No unhandled promise rejections

**Blockers:** Task 5.1 required

---

### Task 5.3: Empty States & Null Safety

**File:** `/Users/toc/Server/ONE/web/src/tests/edge-cases/empty-states.test.tsx`

**Test Cases:**

```
Empty List States (6 tests):
✓ Show empty state message for empty list
✓ Hide column headers when list empty
✓ Show "create" button in empty state
✓ Empty state is accessible
✓ Search returns empty state
✓ Filter returns empty state

Null/Undefined Safety (8 tests):
✓ Component handles undefined props
✓ Component handles null props
✓ Component handles missing optional fields
✓ Component handles empty strings
✓ Component handles empty arrays
✓ Component handles empty objects
✓ No console errors with null/undefined
✓ Graceful fallbacks shown

Missing Data Scenarios (6 tests):
✓ Missing entity image shows default
✓ Missing entity description shows placeholder
✓ Missing user avatar shows initial
✓ Missing metadata shows N/A
✓ Missing timestamps show calculated
✓ Missing permissions show disabled state

Edge Case Values (6 tests):
✓ Very long text wraps correctly
✓ Very long numbers format correctly
✓ Unicode characters display correctly
✓ Special characters escaped
✓ Empty arrays handled
✓ Zero values handled correctly
```

**Success Criteria:**
- 26 empty/null state tests passing
- All edge cases handled gracefully
- No render errors with edge data

**Blockers:** Task 2.1, 2.2, 2.3 required

---

## Phase 6: Accessibility & Responsive Design (Cycle 89-95)

### Task 6.1: Keyboard Navigation & ARIA Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/a11y/keyboard-navigation.test.tsx`

**Test Cases:**

```
Keyboard Navigation (10 tests):
✓ Tab navigates through interactive elements
✓ Shift+Tab navigates backwards
✓ Enter activates buttons
✓ Space activates buttons & checkboxes
✓ Escape closes dialogs
✓ Escape closes dropdowns
✓ Arrow keys navigate menu items
✓ Arrow keys navigate radio buttons
✓ Focus trap in dialogs
✓ Focus restored after dialog close

Tab Index Management (6 tests):
✓ Proper tab order on page
✓ Skip links work
✓ Focusable elements have tab index
✓ Disabled elements not tabbable
✓ Modal traps focus
✓ Removed elements don't receive focus

ARIA Labels (10 tests):
✓ Buttons have accessible names
✓ Form inputs have labels
✓ Icons have aria-label
✓ Images have alt text
✓ Links have accessible names
✓ Landmarks have aria-label where needed
✓ List items marked as list
✓ Tables have headers
✓ Form errors linked to inputs
✓ Loading states announced

ARIA Roles (8 tests):
✓ Buttons have correct role
✓ Links have correct role
✓ Dialogs have dialog role
✓ Alerts have alert role
✓ Progress bars have progressbar role
✓ Tabs have tablist/tab roles
✓ List items have role
✓ Custom components have correct role

Screen Reader Tests (6 tests):
✓ Page structure announced correctly
✓ Form instructions announced
✓ Validation errors announced
✓ Success messages announced
✓ Loading state announced
✓ Page changes announced
```

**Success Criteria:**
- 40 keyboard/ARIA tests passing
- WCAG 2.1 AA compliance verified
- Screen reader tested

**Blockers:** Task 2.1, 2.2, 2.3 required

---

### Task 6.2: Dark Mode & Theme Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/a11y/theme-testing.test.tsx`

**Test Cases:**

```
Dark Mode Rendering (8 tests):
✓ Dark mode toggle switches theme
✓ Dark theme colors applied correctly
✓ Light theme colors applied correctly
✓ Theme preference persisted in localStorage
✓ System preference detected and used
✓ Theme transitions smoothly
✓ All components render in dark mode
✓ No color contrast issues in dark mode

Color Contrast (10 tests):
✓ Text on background meets WCAG AA (4.5:1)
✓ Large text meets WCAG AA (3:1)
✓ Buttons have sufficient contrast
✓ Form inputs have sufficient contrast
✓ Links have sufficient contrast
✓ Icons have sufficient contrast
✓ Hover states have sufficient contrast
✓ Focus states have sufficient contrast
✓ Disabled states visible
✓ Error states clearly visible

Theme Customization (6 tests):
✓ Primary color customizable
✓ Secondary color customizable
✓ Background color customizable
✓ Text color customizable
✓ Custom theme persisted
✓ Theme reset works

CSS Variables (6 tests):
✓ CSS variables defined correctly
✓ Theme colors use CSS variables
✓ Dark mode overrides variables
✓ Colors transition smoothly
✓ Variables work across components
✓ No hardcoded colors
```

**Success Criteria:**
- 30 theme tests passing
- Dark mode fully functional
- WCAG color contrast verified

**Blockers:** Task 2.1, 2.2, 2.3 required

---

### Task 6.3: Responsive Design Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/a11y/responsive-design.test.tsx`

**Test Cases:**

```
Mobile Viewport (8 tests):
✓ Layout stacks vertically on mobile
✓ Navigation becomes hamburger menu
✓ Forms are full width
✓ Images scale correctly
✓ Text is readable (16px+ minimum)
✓ Touch targets are at least 44x44px
✓ Modals are full screen on mobile
✓ Overflow handled with scrolling

Tablet Viewport (6 tests):
✓ Layout uses tablet spacing
✓ Two-column layout where appropriate
✓ Form labels beside inputs
✓ Tables scroll horizontally if needed
✓ Navigation shows more items
✓ Sidebars visible or collapsible

Desktop Viewport (6 tests):
✓ Full multi-column layouts
✓ Sidebars visible
✓ Max-width containers centered
✓ Whitespace balanced
✓ Multiple columns work
✓ Hover states visible

Responsive Images (6 tests):
✓ Images scale with viewport
✓ srcset used for different sizes
✓ Image aspect ratio maintained
✓ Images don't cause layout shift
✓ Background images responsive
✓ SVG icons scale correctly

Orientation Changes (4 tests):
✓ Portrait layout works
✓ Landscape layout works
✓ Layout switches on rotation
✓ Scroll position preserved

Viewport Meta Tests (4 tests):
✓ Viewport width set to device-width
✓ Initial scale set correctly
✓ Zoom not disabled
✓ Viewport meta tag present
```

**Success Criteria:**
- 34 responsive design tests passing
- All viewports tested
- No layout shifts (CLS < 0.1)

**Blockers:** Task 2.1, 2.2, 2.3 required

---

## Phase 7: E2E Critical Path Tests (Cycle 96-100)

### Task 7.1: Authentication Flow E2E Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/e2e/auth-flow.test.ts`

**Test Cases:**

```
Sign Up Flow (6 tests):
✓ User visits signup page
✓ User fills form (email, password, name)
✓ User submits form
✓ User receives confirmation
✓ User is logged in
✓ User redirected to onboarding

Sign In Flow (6 tests):
✓ User visits login page
✓ User enters email and password
✓ User submits form
✓ User is logged in
✓ User is redirected to dashboard
✓ Session token stored correctly

Password Reset Flow (6 tests):
✓ User visits forgot password
✓ User enters email
✓ User receives reset email
✓ User clicks reset link
✓ User sets new password
✓ User can login with new password

Magic Link Flow (6 tests):
✓ User requests magic link
✓ User receives email with link
✓ User clicks link
✓ User is logged in
✓ Link is one-time use
✓ Expired links show error

Multi-Method Auth (4 tests):
✓ User can signup with email/password
✓ User can signup with OAuth
✓ User can login with either method
✓ User accounts linked correctly

Session Management (6 tests):
✓ Session persists across page reload
✓ Session expires after 30 days
✓ User can logout
✓ Logout clears session
✓ Multiple sessions allowed
✓ Session timeout shows warning
```

**Success Criteria:**
- 34 auth E2E tests passing
- All 6 auth methods working
- No session leaks

**Blockers:** Authentication backend ready

---

### Task 7.2: Group & Organization Flow E2E Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/e2e/groups-flow.test.ts`

**Test Cases:**

```
Create Organization Flow (6 tests):
✓ User navigates to create org
✓ User selects org type
✓ User enters org name
✓ User sets plan (starter/pro/enterprise)
✓ User clicks create
✓ Org appears in list

Group Hierarchy Flow (8 tests):
✓ Create parent group (organization)
✓ Create child group (department)
✓ Create grandchild group (team)
✓ View hierarchy tree
✓ Move group to different parent
✓ Delete child group
✓ Delete parent group (confirms cascade)
✓ View group audit trail

Group Settings Flow (6 tests):
✓ User navigates to group settings
✓ User updates group name
✓ User changes group type
✓ User updates plan
✓ User manages permissions
✓ User sees audit log

Group Membership Flow (8 tests):
✓ User invites member via email
✓ Invited user receives email
✓ Invited user accepts invitation
✓ User appears as member
✓ Org owner can change member role
✓ Member can leave group
✓ Org owner can remove member
✓ Member no longer sees group

Multi-Tenant Isolation (6 tests):
✓ User in Org A can't see Org B data
✓ Query results filtered by groupId
✓ Cross-org access denied
✓ Admin can't access other org settings
✓ Data isolation maintained
✓ Billing per organization

Group Permissions (6 tests):
✓ platform_owner can manage all orgs
✓ org_owner can manage org settings
✓ org_user can view group data
✓ customer can view limited data
✓ Permissions enforced in UI
✓ API enforces permissions
```

**Success Criteria:**
- 40 group E2E tests passing
- Hierarchy operations work
- Multi-tenant isolation verified

**Blockers:** Groups backend ready

---

### Task 7.3: Thing & Connection Flow E2E Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/e2e/things-connections-flow.test.ts`

**Test Cases:**

```
Create Thing Flow (8 tests):
✓ User navigates to create thing
✓ User selects thing type (course/agent/blog/etc)
✓ User fills required fields
✓ User fills type-specific properties
✓ User sets initial status (draft)
✓ User clicks create
✓ Thing appears in list
✓ Event is logged

Update Thing Flow (6 tests):
✓ User navigates to thing detail
✓ User edits thing fields
✓ User uploads thing image/file
✓ User updates thing status
✓ User clicks save
✓ Event is logged

Publish Thing Flow (4 tests):
✓ User changes status from draft → published
✓ Thing appears in marketplace
✓ Event is logged
✓ Notification sent to followers

Delete Thing Flow (4 tests):
✓ User clicks delete button
✓ Confirmation dialog shown
✓ User confirms delete
✓ Thing removed from list

Thing Search Flow (6 tests):
✓ User enters search term
✓ Results show matching things
✓ Results filtered by type
✓ Results sorted by relevance
✓ User can sort by date/popularity
✓ User navigates through results

Create Connection Flow (8 tests):
✓ User selects source thing
✓ User selects connection type
✓ User selects target thing
✓ User enters metadata (if applicable)
✓ User clicks create
✓ Connection appears in both directions
✓ Event is logged
✓ Related items updated

Update Connection Flow (4 tests):
✓ User navigates to connection
✓ User updates metadata
✓ User clicks save
✓ Event is logged

Enroll in Course Flow (6 tests):
✓ User views course detail
✓ User clicks enroll button
✓ enrolled_in connection created
✓ Event logged
✓ Course appears in user's list
✓ User can access course content

Follow Thing Flow (4 tests):
✓ User clicks follow button
✓ follows connection created
✓ User receives updates
✓ Thing shows follower count
```

**Success Criteria:**
- 50 thing/connection E2E tests passing
- All CRUD operations work
- Events logged correctly

**Blockers:** Things backend ready

---

### Task 7.4: Real-Time & Event Flow E2E Tests

**File:** `/Users/toc/Server/ONE/web/src/tests/e2e/realtime-flow.test.ts`

**Test Cases:**

```
Real-Time Query Updates (6 tests):
✓ User A creates thing
✓ User B sees thing appear in real-time
✓ User A updates thing
✓ User B sees update in real-time
✓ User A deletes thing
✓ User B sees deletion in real-time

Event Stream Flow (8 tests):
✓ User navigates to activity feed
✓ Events display in reverse chronological order
✓ New event appears in feed in real-time
✓ Event shows actor, action, target
✓ User can filter events by type
✓ User can filter events by date range
✓ Event links navigate to target
✓ Event details show full metadata

Connection Events (6 tests):
✓ Create connection → event logged
✓ Update connection → event logged
✓ Delete connection → event logged
✓ Events show in activity feed
✓ Events show connection metadata
✓ User can view connection history

Notification Tests (6 tests):
✓ User follows entity → receives follow notification
✓ User enrolls in course → receives confirmation
✓ Admin creates org member → member receives email
✓ Group settings change → admins notified
✓ Notifications appear in UI
✓ User can dismiss notifications

Multi-User Sync (6 tests):
✓ User A and B open same page
✓ User A creates entity
✓ User B sees entity without refresh
✓ User A updates entity
✓ User B sees update without refresh
✓ Sync works with multiple tabs

Error Recovery (4 tests):
✓ Connection lost → shows offline indicator
✓ Connection restored → syncs updates
✓ Old updates applied in correct order
✓ No duplicate updates shown
```

**Success Criteria:**
- 36 real-time E2E tests passing
- Real-time subscriptions working
- Multi-user sync verified

**Blockers:** Convex real-time backend ready

---

## Test Organization & File Structure

```
web/src/tests/
├── mocks/
│   ├── factory.ts                 # Mock data factories
│   ├── convex.ts                  # Convex hook mocks
│   └── data.ts                    # Test fixtures
├── utils/
│   ├── setup.tsx                  # Test environment setup
│   ├── render.tsx                 # Custom render with providers
│   ├── assertions.ts              # Common assertions
│   └── builders.ts                # Test data builders
├── components/
│   ├── demo/
│   │   └── demo.test.tsx          # 64 tests (8 components)
│   ├── features/
│   │   └── features.test.tsx      # 48 tests (7 components)
│   └── ui/
│       └── ui-components.test.tsx # 50 tests (10 components)
├── integration/
│   ├── convex-hooks.test.tsx      # 22 tests
│   ├── component-composition.test.tsx # 18 tests
│   └── forms.test.tsx             # 22 tests
├── interactions/
│   ├── form-submission.test.tsx   # 26 tests
│   ├── button-interactions.test.tsx # 26 tests
│   └── navigation.test.tsx        # 24 tests
├── edge-cases/
│   ├── loading-states.test.tsx    # 26 tests
│   ├── error-handling.test.tsx    # 30 tests
│   └── empty-states.test.tsx      # 26 tests
├── a11y/
│   ├── keyboard-navigation.test.tsx # 40 tests
│   ├── theme-testing.test.tsx     # 30 tests
│   └── responsive-design.test.tsx # 34 tests
└── e2e/
    ├── auth-flow.test.ts          # 34 tests
    ├── groups-flow.test.ts        # 40 tests
    ├── things-connections-flow.test.ts # 50 tests
    └── realtime-flow.test.ts      # 36 tests
```

---

## Component Coverage Checklist

### Demo Components (8)
- [ ] HooksDemo
- [ ] SearchDemo
- [ ] EventsDemo
- [ ] ConnectionsDemo
- [ ] PeopleDemo
- [ ] GroupsDemo
- [ ] DemoHero
- [ ] DemoContainer

### Feature Components (7)
- [ ] ContactForm
- [ ] GroupTypeSelector
- [ ] InstallationFileBrowser
- [ ] OntologyExplorer
- [ ] SendToStudios
- [ ] SendToTools
- [ ] PerformanceChart

### UI Components (10)
- [ ] Button
- [ ] Input
- [ ] Card
- [ ] Dialog
- [ ] Tabs
- [ ] Select
- [ ] FormField
- [ ] Alert
- [ ] Badge
- [ ] DropdownMenu

### Integration Points (6)
- [ ] useQuery hooks
- [ ] useMutation hooks
- [ ] Component composition
- [ ] Form flow
- [ ] State synchronization
- [ ] Navigation

---

## Test Statistics & Goals

| Phase | Tests | Target | Status |
|-------|-------|--------|--------|
| 1. Setup | 0 | N/A | Design |
| 2. Components | 162 | 150+ | Design |
| 3. Integration | 62 | 50+ | Design |
| 4. Interactions | 76 | 70+ | Design |
| 5. Edge Cases | 82 | 75+ | Design |
| 6. A11y & Responsive | 104 | 100+ | Design |
| 7. E2E | 160 | 150+ | Design |
| **TOTAL** | **646** | **595+** | **Design** |

**Coverage Goals:**
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+
- Lighthouse: 90+

---

## Dependencies & Blockers

### Backend Dependencies
- [ ] Convex schema finalized (groups, things, connections, events, knowledge)
- [ ] Auth mutations/queries available
- [ ] Real-time subscriptions working
- [ ] Event logging implemented
- [ ] Permission validation in place

### Frontend Dependencies
- [ ] Task 1.1: Vitest configuration (blocking all)
- [ ] Task 1.2: Mock factory (blocking integration/e2e)
- [ ] Task 1.3: Test utilities (blocking all)
- [ ] Task 2: Component tests (blocking 3-7)
- [ ] Task 3: Integration tests (blocking 4-7)
- [ ] Task 4: Interaction tests (blocking 5-7)

### Third-Party Dependencies
- [ ] @testing-library/react: 16.3.0 (in package.json)
- [ ] vitest: 3.2.4 (in package.json)
- [ ] happy-dom: 20.0.2 (in package.json)
- [ ] jsdom: 27.0.0 (optional, in package.json)

---

## Success Criteria

### Quality Metrics
- [ ] 646+ test cases written
- [ ] 595+ test cases passing
- [ ] Coverage > 80% (statements/functions/lines)
- [ ] Coverage > 75% (branches)
- [ ] 0 failing tests
- [ ] 0 flaky tests (run 10x consistently)

### Performance Metrics
- [ ] Test suite runs in < 30 seconds
- [ ] Single test < 1 second
- [ ] Memory usage < 500MB

### Code Quality
- [ ] No console errors/warnings
- [ ] No unhandled promise rejections
- [ ] TypeScript strict mode passes
- [ ] Linting passes

### Accessibility Compliance
- [ ] WCAG 2.1 AA compliance verified
- [ ] Screen reader tested
- [ ] Keyboard navigation working
- [ ] Color contrast verified

### Documentation
- [ ] Test files have JSDoc comments
- [ ] Mock factories documented
- [ ] Test utilities documented
- [ ] Coverage report generated

---

## Execution Timeline

**Cycle-Based (Parallel Execution)**

```
Cycle 65: Create this TODO file
Cycle 66: Implement Tasks 1.1-1.3 (Setup)

Parallel Execution:
  Branch A: Cycles 67-72 (Phase 2: Component Tests)
  Branch B: Cycles 73-78 (Phase 3: Integration Tests)
  Branch C: Cycles 79-84 (Phase 4: Interactions)

Sequential Merge:
  Cycle 85-88 (Phase 5: Edge Cases)
  Cycle 89-95 (Phase 6: A11y & Responsive)
  Cycle 96-100 (Phase 7: E2E Tests)
```

**Completion Target:** Cycle 100

---

## Notes for Next Agent

### For Agent-Backend
- Ensure Convex schema matches mocks in `/web/src/tests/mocks/`
- Provide real-time subscriptions for event testing
- Validate permission checks work in mutations

### For Agent-Designer
- Design specs needed for component visual validation
- Accessibility audit checklist
- Color contrast requirements

### For Agent-Quality
- Run full test suite: `bun test`
- Generate coverage: `bun test:coverage`
- Check performance: `bun test -- --reporter=verbose`

### Common Issues to Avoid
1. **Vitest Configuration:** Missing happy-dom environment setup
2. **Async Tests:** Not awaiting promises or using async/await
3. **Mock Stale Data:** Mocks not synced with schema changes
4. **Focus Leakage:** Tests affecting each other (use beforeEach cleanup)
5. **Memory Leaks:** Subscriptions not cleaned up (unmount cleanup)
6. **Snapshot Drift:** Snapshots outdated after schema changes
7. **Race Conditions:** Concurrent mutations not properly sequenced
8. **Provider Nesting:** Missing Convex provider in render
9. **TypeScript Generics:** useQuery/useMutation types not inferred
10. **Query Keys:** Cache invalidation not working (stale data)

---

## References

- **Test Setup:** `/Users/toc/Server/ONE/web/src/tests/`
- **Existing Tests:** 19 files with 50+ test cases
- **Vitest Docs:** https://vitest.dev
- **Testing Library:** https://testing-library.com/react
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **Component Library:** shadcn/ui (50+ pre-built components)
- **Package Manager:** bun@1.2.19

---

**Status:** Ready for Cycle 65 Execution
**Owner:** Agent Frontend
**Last Updated:** 2025-10-30
**Target Completion:** Cycle 100
