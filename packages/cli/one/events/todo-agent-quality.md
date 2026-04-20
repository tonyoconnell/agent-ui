# Quality Agent TODO List - Write e2e tests for critical paths (Cycle 65)

**Feature:** New Feature (AI-powered recommendations)
**Stage:** Quality & Testing (Cycle 61-70)
**Current:** Cycle 65/100
**Progress:** 64/100 cycles complete (64%)
**Role:** Quality Intelligence Agent
**Responsibility:** Define success criteria, create comprehensive tests, validate implementations against ontology

---

## EXECUTIVE SUMMARY

The Quality Agent orchestrates comprehensive testing for AI-powered recommendations feature across all 6 dimensions of the ONE ontology. This cycle phase focuses on:

1. **Critical path definition** - User journeys that MUST work
2. **Test case design** - Specific scenarios covering all dimensions
3. **Ontology validation** - Things, connections, events, knowledge alignment
4. **Test implementation** - Unit, integration, E2E test code
5. **Execution & analysis** - Run tests, measure coverage, identify issues
6. **Documentation** - Test plans, results, lessons learned

**Scope:** 30+ test cases across 5 test layers
**Success Metric:** 80%+ code coverage, all critical paths passing
**Timeline:** Cycle 65-70 (quality phase)

---

## PHASE 1: TEST PLANNING & DESIGN (Cycle 65)

### Task 1.1: Load Ontology Context & Feature Specification
**Status:** 🎯 NEXT
**Effort:** 30 min
**Owner:** agent-quality

**Subtasks:**
- [ ] Read `/one/knowledge/ontology.md` (6-dimension specification)
- [ ] Read `/one/knowledge/rules.md` (golden rules for testing)
- [ ] Read `/one/connections/workflow.md` (6-phase development)
- [ ] Review feature specification from Cycle 1-64
- [ ] Identify feature's 6-dimension mapping:
  - Groups: Which organization/team owns recommendations?
  - People: Who creates/consumes/moderates recommendations?
  - Things: What entities (recommendations, users, products)?
  - Connections: How do they relate (recommends, based_on)?
  - Events: What happens (recommendation_generated, recommendation_accepted)?
  - Knowledge: What embeddings/vectors needed (recommendation vectors)?

**Acceptance Criteria:**
- [ ] Feature specification loaded and understood
- [ ] 6-dimension ontology mapping complete
- [ ] Critical dependencies identified
- [ ] Test scope clearly defined

**Deliverable:** Context doc with feature-to-ontology mapping

---

### Task 1.2: Define Critical User Flows
**Status:** ⏹️ BLOCKED_ON_1.1
**Effort:** 1 hour
**Owner:** agent-quality

**Subtasks:**
- [ ] Identify primary user flows (happy paths):
  1. **Flow 1: Generate Recommendation** - System recommends products/creators
  2. **Flow 2: Accept Recommendation** - User approves and acts on recommendation
  3. **Flow 3: Reject Recommendation** - User dismisses recommendation
  4. **Flow 4: View Recommendation History** - User sees past recommendations
  5. **Flow 5: Personalize Settings** - User configures recommendation preferences

- [ ] Document secondary flows (error handling):
  1. **Error Flow 1:** No recommendation available (graceful fallback)
  2. **Error Flow 2:** User not authenticated (authorization check)
  3. **Error Flow 3:** Service unavailable (timeout/retry logic)
  4. **Error Flow 4:** Invalid recommendation data (validation failure)
  5. **Error Flow 5:** Knowledge embedding missing (RAG fallback)

- [ ] For each flow, map to ontology:
  - Things created/updated
  - Connections formed
  - Events logged
  - Knowledge (embeddings) used/generated

- [ ] Define time budgets (< N seconds):
  - Recommendation generation: < 2 seconds
  - Page load: < 1 second
  - History query: < 500ms
  - Settings save: < 300ms

**Acceptance Criteria:**
- [ ] 5 primary flows documented
- [ ] 5 secondary flows documented
- [ ] Each flow includes ontology mappings
- [ ] Time budgets defined and justified
- [ ] Clear happy path and error paths

**Deliverable:** User flows document with ontology traceability

---

### Task 1.3: Create Acceptance Criteria for Each Flow
**Status:** ⏹️ BLOCKED_ON_1.2
**Effort:** 1.5 hours
**Owner:** agent-quality

**Subtasks:**
For **Flow 1: Generate Recommendation:**
- [ ] Recommendation generated within time budget (< 2s)
- [ ] Recommendation thing created with type: "recommendation"
- [ ] Properties include: targetUser, item, score, reason, generatedAt
- [ ] Connection created: recommendation → targetUser (recommends)
- [ ] Connection created: recommendation → item (recommends_item)
- [ ] Event logged: "recommendation_generated" with actorId (system), targetId (recommendation)
- [ ] Knowledge embedding created if applicable
- [ ] Response contains JSON with recommendation data
- [ ] HTTP 200 status on success
- [ ] User can view recommendation on dashboard within 100ms

For **Flow 2: Accept Recommendation:**
- [ ] Accept button accessible and visible
- [ ] Click sends mutation to backend
- [ ] recommendation.status changes: draft → accepted
- [ ] Connection created: user → item (via recommendation acceptance)
- [ ] Event logged: "recommendation_accepted" with user as actor
- [ ] Success message displayed (toast/confirmation)
- [ ] User redirected or item added to cart/wishlist
- [ ] Time to completion: < 300ms

For **Flow 3: Reject Recommendation:**
- [ ] Reject button accessible
- [ ] Click sends mutation to backend
- [ ] recommendation.status changes: draft → rejected
- [ ] Event logged: "recommendation_rejected"
- [ ] Recommendation removed from current view (< 300ms)
- [ ] No further recommendations of similar type shown (ML feedback)
- [ ] User can undo rejection (optional)

For **Flow 4: View Recommendation History:**
- [ ] Query returns all recommendations for user
- [ ] Results paginated (20 per page)
- [ ] Filtered by status (generated, accepted, rejected)
- [ ] Sorted by createdAt (newest first)
- [ ] Load time < 500ms
- [ ] Each item shows: recommendation, status, date, score
- [ ] Can click to view recommendation details

For **Flow 5: Personalize Settings:**
- [ ] Settings form loads with current preferences
- [ ] Options include: categories, price range, frequency
- [ ] Save button updates thing.properties.preferences
- [ ] Event logged: "recommendation_settings_updated"
- [ ] Toast shows "Settings saved"
- [ ] Settings persist across sessions
- [ ] New recommendations respect settings

For **Error Flows:**
- [ ] No recommendation available: Show "No recommendations at this time" with suggestion to adjust settings
- [ ] Not authenticated: Redirect to /login or show sign-in modal
- [ ] Service unavailable: Retry logic (exponential backoff, max 3 retries), then show fallback UI
- [ ] Invalid data: Log error with details, show generic message to user
- [ ] Knowledge missing: Fall back to non-personalized recommendations

**Acceptance Criteria:**
- [ ] 40+ specific acceptance criteria defined
- [ ] Each criterion is measurable and observable
- [ ] All 6-dimension ontology operations covered
- [ ] Error handling explicitly specified
- [ ] Performance targets included
- [ ] Accessibility requirements (WCAG AA) specified

**Deliverable:** Detailed acceptance criteria document per flow

---

### Task 1.4: Design Technical Test Cases (Unit Level)
**Status:** ⏹️ BLOCKED_ON_1.3
**Effort:** 1.5 hours
**Owner:** agent-quality

**Subtasks - Service Layer Tests (Effect.ts):**

**Test Suite: RecommendationService**

1. **Test 1.4.1: Generate recommendation**
   - Input: userId, context (browsing history)
   - Expected: Recommendation object with score, reason
   - Assertions:
     - [ ] score between 0-1
     - [ ] reason is non-empty string
     - [ ] targetItem is valid thing ID
     - [ ] generatedAt is recent timestamp
   - Error cases:
     - [ ] userId not found → throws "User not found"
     - [ ] No items to recommend → throws "No recommendations available"
     - [ ] ML model unavailable → falls back to popularity-based

2. **Test 1.4.2: Create recommendation thing**
   - Input: Generated recommendation data
   - Expected: Thing created in database with type "recommendation"
   - Assertions:
     - [ ] thing.type === "recommendation"
     - [ ] thing.properties has all required fields
     - [ ] thing.groupId matches user's organization
     - [ ] thing.status === "draft"
     - [ ] thing.createdAt is valid timestamp

3. **Test 1.4.3: Create connections**
   - Test: recommends connection created correctly
   - Assertions:
     - [ ] Connection from recommendation → user with type "recommends"
     - [ ] Connection from recommendation → item with type "recommends_item"
     - [ ] Both connections have groupId set
     - [ ] Both connections have validFrom/validTo if applicable

4. **Test 1.4.4: Log recommendation_generated event**
   - Input: Recommendation thing created
   - Expected: Event inserted with correct metadata
   - Assertions:
     - [ ] event.type === "recommendation_generated"
     - [ ] event.actorId === system (or NULL for automated)
     - [ ] event.targetId === recommendation._id
     - [ ] event.metadata.itemId populated
     - [ ] event.timestamp is valid

5. **Test 1.4.5: Filter by user preferences**
   - Input: User preferences (categories, price range)
   - Expected: Filtered recommendations matching preferences
   - Assertions:
     - [ ] All results in preferred categories
     - [ ] All prices within specified range
     - [ ] Recommendations sorted by score (highest first)
     - [ ] Empty list if no matches (vs. error)

6. **Test 1.4.6: Accept recommendation**
   - Input: Recommendation ID
   - Expected: Status changed to accepted, connection created
   - Assertions:
     - [ ] recommendation.status === "accepted"
     - [ ] Connection created: user → item
     - [ ] updateAt timestamp is recent
     - [ ] Event logged with type "recommendation_accepted"

7. **Test 1.4.7: Reject recommendation**
   - Input: Recommendation ID
   - Expected: Status changed, ML feedback recorded
   - Assertions:
     - [ ] recommendation.status === "rejected"
     - [ ] Feedback stored in knowledge/metadata
     - [ ] Event logged "recommendation_rejected"
     - [ ] User not shown similar recommendations (configurable)

8. **Test 1.4.8: Get recommendation history**
   - Input: userId, filters (status, dateRange), pagination
   - Expected: Paginated list of recommendations
   - Assertions:
     - [ ] Results count matches query
     - [ ] Results correctly filtered by status
     - [ ] Results correctly filtered by date range
     - [ ] Total count includes all matching items
     - [ ] Pagination offset/limit applied correctly

9. **Test 1.4.9: Update recommendation settings**
   - Input: userId, new settings object
   - Expected: Settings persisted, event logged
   - Assertions:
     - [ ] user.properties.preferences updated
     - [ ] All setting keys validated (no injection)
     - [ ] Event logged "recommendation_settings_updated"
     - [ ] Timestamp is recent

10. **Test 1.4.10: Validate recommendation object**
    - Input: Various recommendation objects (valid + invalid)
    - Expected: Valid pass, invalid rejected with specific error
    - Assertions:
      - [ ] Valid object returns null (no error)
      - [ ] Missing score returns specific error
      - [ ] Invalid score (>1 or <0) returns validation error
      - [ ] Missing reason returns validation error
      - [ ] Invalid timestamps returns validation error
      - [ ] Orphaned recommendations (no thing/connection) return error

**Test Suite: RecommendationQuery**

11. **Test 1.4.11: Query recommendations by status**
    - Input: status filter, limit
    - Expected: Recommendations with matching status
    - Assertions:
      - [ ] All results have matching status
      - [ ] Results limited correctly
      - [ ] Ordered by createdAt DESC

12. **Test 1.4.12: Query with knowledge embedding**
    - Input: User ID, knowledge context
    - Expected: Recommendations influenced by knowledge embeddings
    - Assertions:
      - [ ] Knowledge vectors loaded successfully
      - [ ] Similarity scores calculated
      - [ ] Results ranked by similarity
      - [ ] Graceful fallback if embeddings unavailable

13. **Test 1.4.13: Error handling - missing data**
    - Input: Invalid user ID, missing thing
    - Expected: Specific error messages
    - Assertions:
      - [ ] "User not found" error for invalid userId
      - [ ] "Thing not found" error for invalid thingId
      - [ ] Error tagged properly (not generic)
      - [ ] Error logged with context

14. **Test 1.4.14: Error handling - timeout**
    - Input: Slow database/service
    - Expected: Timeout after N ms, graceful fallback
    - Assertions:
      - [ ] Timeout occurs within defined threshold
      - [ ] Fallback recommendation provided
      - [ ] Error logged with duration
      - [ ] User gets result (degraded quality)

15. **Test 1.4.15: Ontology compliance**
    - Validate all mutations follow ontology rules
    - Assertions:
      - [ ] All things have required fields (type, name, properties)
      - [ ] All connections have groupId (scoped to org)
      - [ ] All events have actorId, targetId, timestamp
      - [ ] All knowledge labels use curated prefixes

**Acceptance Criteria:**
- [ ] 15+ unit tests designed
- [ ] Each test includes input, expected output, assertions
- [ ] Error cases covered for each function
- [ ] Edge cases identified and tested
- [ ] Ontology compliance validated
- [ ] Tests are isolated (can run in any order)

**Deliverable:** Detailed unit test specification document

---

### Task 1.5: Design Technical Test Cases (Integration Level)
**Status:** ⏹️ BLOCKED_ON_1.4
**Effort:** 1.5 hours
**Owner:** agent-quality

**Subtasks - Convex Mutation/Query Integration Tests:**

**Test Suite: Recommendation Mutations**

1. **Test 1.5.1: generateRecommendation mutation**
   - Calls: mutation → Effect.ts service → database
   - Assertions:
     - [ ] Mutation returns recommendation ID
     - [ ] Thing created in database
     - [ ] Connections created
     - [ ] Event logged
     - [ ] HTTP 200 response
     - [ ] Response time < 2s
     - [ ] No SQL injection vulnerabilities
     - [ ] Authorization checked (user can generate)

2. **Test 1.5.2: acceptRecommendation mutation**
   - Setup: Create recommendation first
   - Calls: mutation → update thing → create connection → log event
   - Assertions:
     - [ ] HTTP 200 on success
     - [ ] thing.status changes to "accepted"
     - [ ] Connection created correctly
     - [ ] Event logged
     - [ ] User receives correct response
     - [ ] Response time < 300ms
     - [ ] Idempotent (calling twice doesn't error)

3. **Test 1.5.3: rejectRecommendation mutation**
   - Setup: Create recommendation first
   - Calls: mutation → update thing → log event
   - Assertions:
     - [ ] thing.status changes to "rejected"
     - [ ] Event logged with "rejected" type
     - [ ] Response time < 300ms
     - [ ] Can't accept after reject (state machine)
     - [ ] Feedback recorded for ML

4. **Test 1.5.4: updateRecommendationSettings mutation**
   - Input: userId, settings object
   - Assertions:
     - [ ] User.properties.preferences updated
     - [ ] Event logged "recommendation_settings_updated"
     - [ ] Validation prevents invalid values
     - [ ] Authorization checked (user can edit own settings)
     - [ ] Concurrent requests don't conflict

5. **Test 1.5.5: Authorization check**
   - Input: Different user trying to accept another's recommendation
   - Expected: Authorization error (403)
   - Assertions:
     - [ ] Returns 403 Unauthorized
     - [ ] Message: "You don't have permission"
     - [ ] Event logged for security audit
     - [ ] No state changes occur

**Test Suite: Recommendation Queries**

6. **Test 1.5.6: getRecommendations query**
   - Input: userId, filters
   - Assertions:
     - [ ] Returns array of recommendations
     - [ ] Filtered correctly by status/date
     - [ ] Paginated correctly
     - [ ] Response time < 500ms
     - [ ] Authorization checked (can view own only)
     - [ ] Handles empty result (returns [])

7. **Test 1.5.7: getRecommendationHistory query**
   - Input: userId, limit, offset
   - Assertions:
     - [ ] Returns paginated list
     - [ ] Sorted by createdAt DESC
     - [ ] Total count accurate
     - [ ] Empty pages return []
     - [ ] Response time < 500ms

8. **Test 1.5.8: getRecommendationStats query**
   - Input: userId
   - Expected: Stats object with counts
   - Assertions:
     - [ ] total count correct
     - [ ] accepted count correct
     - [ ] rejected count correct
     - [ ] pending count correct
     - [ ] Response time < 300ms

9. **Test 1.5.9: getRecommendationDetails query**
   - Input: recommendationId
   - Assertions:
     - [ ] Returns full recommendation object
     - [ ] Includes related thing/item details
     - [ ] Response time < 200ms
     - [ ] Authorization checked

10. **Test 1.5.10: Database state validation**
    - After multiple mutations in sequence
    - Assertions:
      - [ ] All things properly stored
      - [ ] All connections properly stored
      - [ ] All events properly logged
      - [ ] No orphaned records
      - [ ] Data consistency maintained

**Test Suite: Error Handling**

11. **Test 1.5.11: Invalid recommendation ID**
    - Input: Nonexistent recommendation ID
    - Expected: 404 Not Found
    - Assertions:
      - [ ] Returns 404 status
      - [ ] Error message is helpful
      - [ ] No server error (500)
      - [ ] Graceful error response

12. **Test 1.5.12: Missing required fields**
    - Input: Mutation without required fields
    - Expected: 400 Bad Request
    - Assertions:
      - [ ] Returns 400 status
      - [ ] Error specifies missing field
      - [ ] No partial data created
      - [ ] Transaction rolled back

13. **Test 1.5.13: Database connection failure**
    - Setup: Simulate database down
    - Expected: Graceful error, retry logic
    - Assertions:
      - [ ] Retry attempts occur (max 3)
      - [ ] Exponential backoff applied (100ms, 200ms, 400ms)
      - [ ] User gets error after retries exhausted
      - [ ] No data loss

14. **Test 1.5.14: Concurrent mutations**
    - Input: Two users accepting same recommendation (race condition)
    - Expected: Second request gets conflict error
    - Assertions:
      - [ ] Only one acceptance succeeds
      - [ ] Other gets 409 Conflict
      - [ ] No double-acceptance
      - [ ] Database state consistent

15. **Test 1.5.15: Rate limiting**
    - Input: User generates 100 recommendations in 1 second
    - Expected: Rate limit enforced
    - Assertions:
      - [ ] First N requests succeed (configurable threshold)
      - [ ] Excess requests get 429 Too Many Requests
      - [ ] User informed of retry-after header
      - [ ] Limits per user, not global

**Acceptance Criteria:**
- [ ] 15+ integration tests designed
- [ ] Tests span full mutation/query lifecycle
- [ ] Database state validated
- [ ] Error conditions tested
- [ ] Authorization validated
- [ ] Performance targets verified

**Deliverable:** Detailed integration test specification document

---

### Task 1.6: Design Technical Test Cases (E2E Level)
**Status:** ⏹️ BLOCKED_ON_1.5
**Effort:** 2 hours
**Owner:** agent-quality

**Subtasks - End-to-End User Journey Tests:**

**Test Suite: Critical User Journeys**

1. **Test 1.6.1: Complete recommendation flow**
   - Journey: User logs in → Views recommendations → Accepts one → Views history
   - Steps:
     - [ ] Navigate to /recommendations page
     - [ ] Wait for recommendations to load (< 2s)
     - [ ] Click "Accept" on first recommendation
     - [ ] See success message
     - [ ] Navigate to /recommendations/history
     - [ ] See accepted recommendation in history
   - Assertions:
     - [ ] All pages load and render correctly
     - [ ] Buttons are clickable
     - [ ] Data persists across navigation
     - [ ] Messages are clear and helpful
     - [ ] No console errors or warnings

2. **Test 1.6.2: Reject and settings flow**
   - Journey: User rejects recommendations → Updates settings → Gets new recommendations
   - Steps:
     - [ ] On /recommendations, click "Reject" on 3 recommendations
     - [ ] Navigate to /account/settings
     - [ ] Find Recommendation Preferences section
     - [ ] Uncheck a category that was rejected
     - [ ] Save settings
     - [ ] Return to /recommendations
     - [ ] New recommendations respect updated settings
   - Assertions:
     - [ ] Settings form visible and editable
     - [ ] Save button works
     - [ ] Toast notification shows success
     - [ ] New recommendations reflect settings
     - [ ] Old recommendations still visible in history

3. **Test 1.6.3: Mobile responsiveness**
   - Journey: Same as test 1.6.1 on mobile viewport (375px wide)
   - Assertions:
     - [ ] All text readable (font size >= 12px)
     - [ ] Buttons large enough to tap (48x48px)
     - [ ] No horizontal scrolling
     - [ ] Images scale appropriately
     - [ ] Form inputs are accessible
     - [ ] Touch interactions work (not hover)

4. **Test 1.6.4: Accessibility (WCAG AA)**
   - Journey: Navigate all recommendation pages with screen reader
   - Assertions:
     - [ ] All headings properly tagged (h1-h6)
     - [ ] Links have descriptive text
     - [ ] Form labels associated with inputs
     - [ ] Alt text on all images
     - [ ] Color not the only indicator
     - [ ] Keyboard navigation works (Tab through all controls)
     - [ ] Focus visible on all interactive elements

5. **Test 1.6.5: Performance baseline**
   - Journey: Open /recommendations, accept, load history
   - Metrics:
     - [ ] Page load < 1s (Largest Contentful Paint)
     - [ ] Recommendations load < 2s
     - [ ] Accept button click → success < 300ms
     - [ ] History page load < 500ms
     - [ ] No jank (60 FPS animations)
   - Tools: Chrome DevTools, Lighthouse

6. **Test 1.6.6: Error recovery**
   - Journey: Simulate network failure, recover, continue
   - Steps:
     - [ ] Start loading /recommendations
     - [ ] Network becomes unavailable (DevTools throttle)
     - [ ] See appropriate error message
     - [ ] Network restored
     - [ ] Manually retry (or auto-retry)
     - [ ] Page loads successfully
   - Assertions:
     - [ ] Error message is clear
     - [ ] Retry button visible and works
     - [ ] No confusing error codes shown to user
     - [ ] Page returns to working state

7. **Test 1.6.7: Authentication flow**
   - Journey: Unauthenticated user tries to view recommendations
   - Steps:
     - [ ] Open /recommendations without login
     - [ ] See redirect to /login or modal
     - [ ] Log in successfully
     - [ ] Redirected back to /recommendations
     - [ ] Recommendations loaded
   - Assertions:
     - [ ] Redirect happens immediately
     - [ ] Login form works
     - [ ] Session persists
     - [ ] Can't access recommendations without auth

8. **Test 1.6.8: Cross-browser compatibility**
   - Journey: Test critical flows in Chrome, Firefox, Safari
   - Assertions:
     - [ ] All features work in all browsers
     - [ ] Styling consistent across browsers
     - [ ] No browser-specific errors
     - [ ] Forms work identically
     - [ ] Performance acceptable in all browsers

9. **Test 1.6.9: Data persistence**
   - Journey: Create recommendations → Close browser → Reopen → Data still there
   - Steps:
     - [ ] Load /recommendations
     - [ ] Accept 3 recommendations
     - [ ] Open DevTools → Application → Clear all data
     - [ ] Refresh page
     - [ ] Verify data still shows (from server)
     - [ ] Load /recommendations/history
     - [ ] All accepted recommendations visible
   - Assertions:
     - [ ] Data not stored client-side only
     - [ ] Server is source of truth
     - [ ] No stale data served

10. **Test 1.6.10: State consistency**
    - Journey: Accept recommendation, keep page open, check background updates
    - Steps:
      - [ ] Accept recommendation on page A
      - [ ] Keep page open for 5 minutes
      - [ ] In another window, manually modify thing via API
      - [ ] Page A auto-updates (if real-time enabled)
      - [ ] OR page A still shows local state (eventually syncs on refresh)
    - Assertions:
      - [ ] State is consistent across windows
      - [ ] No contradictory data displayed
      - [ ] Conflicts handled gracefully

**Acceptance Criteria:**
- [ ] 10+ E2E test scenarios designed
- [ ] Each scenario tests complete user journey
- [ ] Accessibility verified (WCAG AA)
- [ ] Performance baselines established
- [ ] Mobile responsiveness tested
- [ ] Error recovery validated
- [ ] Cross-browser compatibility documented

**Deliverable:** Detailed E2E test specification document with acceptance criteria

---

## PHASE 2: TEST IMPLEMENTATION (Cycle 66)

### Task 2.1: Implement Unit Tests
**Status:** ⏹️ BLOCKED_ON_PHASE_1
**Effort:** 2 hours
**Owner:** agent-builder (service layer), coordinated by agent-quality

**Deliverables:**
- [ ] `/web/test/recommendations/recommendation-service.test.ts`
  - 15+ unit tests for Effect.ts service functions
  - Test pure functions, error handling, ontology operations
  - Assertions cover all business logic paths

- [ ] `/web/test/recommendations/recommendation-query.test.ts`
  - Tests for query helper functions
  - Filtering, sorting, pagination logic
  - Edge cases (empty results, invalid filters)

- [ ] `/backend/convex/tests/recommendations.test.ts` (if using Convex testing)
  - Service function tests in Convex environment
  - Database operation validation
  - Event logging verification

**Acceptance Criteria:**
- [ ] All 15 unit tests implemented
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] All assertions pass locally
- [ ] Code coverage > 80%
- [ ] No skipped tests
- [ ] Clear test names describing what is tested

---

### Task 2.2: Implement Integration Tests
**Status:** ⏹️ BLOCKED_ON_PHASE_1
**Effort:** 2 hours
**Owner:** agent-builder, agent-frontend

**Deliverables:**
- [ ] `/web/test/recommendations/recommendation-mutations.test.ts`
  - Tests for Convex mutations
  - API contract validation
  - Database state verification
  - Error handling verification

- [ ] `/web/test/recommendations/recommendation-queries.test.ts`
  - Tests for Convex queries
  - Pagination, filtering, sorting
  - Authorization checks
  - Performance assertions

- [ ] `/web/test/recommendations/recommendation-integration.test.ts`
  - Full mutation→query flow tests
  - Data consistency checks
  - Concurrent operation handling
  - Rate limiting verification

**Acceptance Criteria:**
- [ ] All 15 integration tests implemented
- [ ] Tests use test database/fixtures
- [ ] Real API calls made (not mocked)
- [ ] Transactions validated
- [ ] Cleanup after each test (no state leakage)
- [ ] Tests take < 30 seconds total

---

### Task 2.3: Implement E2E Tests
**Status:** ⏹️ BLOCKED_ON_PHASE_1
**Effort:** 3 hours
**Owner:** agent-frontend

**Deliverables:**
- [ ] `/web/test/e2e/recommendations.spec.ts` (Playwright or similar)
  - Test 1.6.1-1.6.10 from task 1.6
  - Real browser automation
  - Full user journey from UI to database
  - Screenshots on failure

**Test Configuration:**
```typescript
// e2e/recommendations.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI-Powered Recommendations E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login, navigate to recommendations
  });

  test('should generate and accept recommendation', async ({ page }) => {
    // Complete workflow test
  });

  // ... additional tests
});
```

**Acceptance Criteria:**
- [ ] All 10 E2E test scenarios implemented
- [ ] Tests run against staging/preview deployment
- [ ] Headless browser mode working
- [ ] Screenshots captured on failures
- [ ] Tests run in < 2 minutes total
- [ ] Parallel execution enabled (4 workers)

---

### Task 2.4: Create Test Fixtures & Data
**Status:** ⏹️ BLOCKED_ON_PHASE_1
**Effort:** 1 hour
**Owner:** agent-quality

**Deliverables:**
- [ ] `/web/test/fixtures/recommendations-test-data.ts`
  ```typescript
  export const testUser = {
    _id: "test-user-123",
    name: "Test User",
    email: "test@example.com",
    // ...
  };

  export const testRecommendations = [
    {
      type: "recommendation",
      properties: { score: 0.95, reason: "Based on your interests" },
      // ...
    },
    // ...
  ];

  export const testItems = [
    {
      type: "product",
      name: "Test Product",
      properties: { price: 99.99, category: "electronics" },
      // ...
    },
    // ...
  ];
  ```

- [ ] Convex test data seeding script
  - Populate test database with fixtures
  - Create test groups/organizations
  - Setup test user accounts
  - Configure test environment variables

**Acceptance Criteria:**
- [ ] Test data complete and realistic
- [ ] Fixtures importable in all test files
- [ ] Database seeding works reliably
- [ ] Cleanup procedures remove test data
- [ ] No dependencies on external services (use mocks)

---

## PHASE 3: TEST EXECUTION & VALIDATION (Cycle 67)

### Task 3.1: Run Unit Tests Locally
**Status:** ⏹️ BLOCKED_ON_PHASE_2
**Effort:** 30 min
**Owner:** agent-builder

**Steps:**
- [ ] Run command: `bun test test/recommendations/`
- [ ] Capture output and results
- [ ] Verify all tests pass (0 failures)
- [ ] Check coverage > 80%
- [ ] Generate coverage report (HTML)
- [ ] Document any failures

**Success Criteria:**
- [ ] 15/15 unit tests PASS
- [ ] Coverage report shows >= 80%
- [ ] No skipped tests
- [ ] Execution time < 30 seconds
- [ ] Coverage gaps identified

**Deliverable:** Unit test results and coverage report

---

### Task 3.2: Run Integration Tests Against Staging
**Status:** ⏹️ BLOCKED_ON_PHASE_2
**Effort:** 45 min
**Owner:** agent-builder

**Steps:**
- [ ] Deploy latest code to staging
- [ ] Run: `npm run test:integration`
- [ ] Tests execute against staging backend
- [ ] Capture logs and assertions
- [ ] Verify all tests pass
- [ ] Document any failures
- [ ] Analyze performance metrics

**Success Criteria:**
- [ ] 15/15 integration tests PASS
- [ ] No database conflicts (staging data clean)
- [ ] All mutations execute successfully
- [ ] All queries return expected data
- [ ] Response times within budgets
- [ ] No authorization errors

**Deliverable:** Integration test results and performance metrics

---

### Task 3.3: Run E2E Tests in Headless Mode
**Status:** ⏹️ BLOCKED_ON_PHASE_2
**Effort:** 1 hour
**Owner:** agent-frontend

**Steps:**
- [ ] Run: `npm run test:e2e`
- [ ] Playwright executes all 10 scenarios
- [ ] Tests run against staging deployment
- [ ] Capture screenshots on failures
- [ ] Generate E2E report (HTML)
- [ ] Document any failures
- [ ] Verify accessibility metrics

**Success Criteria:**
- [ ] 10/10 E2E test scenarios PASS
- [ ] All user journeys complete successfully
- [ ] Accessibility score >= 90
- [ ] Performance Lighthouse score >= 85
- [ ] Mobile viewport tests pass
- [ ] Screenshots show expected UI

**Deliverable:** E2E test results, screenshots, and Lighthouse reports

---

### Task 3.4: Validate Ontology Alignment
**Status:** ⏹️ BLOCKED_ON_PHASE_2
**Effort:** 1 hour
**Owner:** agent-quality

**Checklist:**
- [ ] All things use correct types (from 66+ types)
  - recommendation ✓
  - user (creator) ✓
  - product/item ✓
- [ ] All connections use correct types (from 25+ types)
  - recommends ✓
  - recommends_item ✓
  - based_on ✓
- [ ] All events use correct types (from 67+ types)
  - recommendation_generated ✓
  - recommendation_accepted ✓
  - recommendation_rejected ✓
  - recommendation_settings_updated ✓
- [ ] All things scoped to groupId (multi-tenant)
  - [ ] recommendation.groupId set
  - [ ] Connections.groupId set
  - [ ] Events.groupId set
- [ ] All events have complete audit trail
  - [ ] actorId (who did it)
  - [ ] targetId (what changed)
  - [ ] timestamp (when)
  - [ ] metadata (context)
- [ ] Knowledge integration working
  - [ ] Embeddings generated for recommendations
  - [ ] Vectors stored in knowledge table
  - [ ] RAG queries return recommendations

**Success Criteria:**
- [ ] All 6 dimensions validated
- [ ] All things/connections/events use ontology types
- [ ] 0 custom types (must use standard ontology)
- [ ] All multi-tenant scoping verified
- [ ] Complete audit trail present

**Deliverable:** Ontology alignment validation report

---

### Task 3.5: Analyze Test Coverage & Gaps
**Status:** ⏹️ BLOCKED_ON_PHASE_2
**Effort:** 1 hour
**Owner:** agent-quality

**Analysis:**
- [ ] Load coverage reports (unit + integration)
- [ ] Identify untested code paths (< 80% coverage)
- [ ] Prioritize coverage gaps by importance
- [ ] Create action items for missing tests
- [ ] Assess risk of uncovered code
- [ ] Document decision rationale (if accepting < 80%)

**Coverage Goals by Layer:**
- Service functions (Effect.ts): >= 90%
- Convex mutations/queries: >= 85%
- React components: >= 80%
- Utility functions: >= 85%

**High-Priority Coverage Targets:**
- [ ] All mutation paths covered
- [ ] All error handling paths covered
- [ ] All permission checks covered
- [ ] All database operations covered
- [ ] All API edge cases covered

**Deliverable:** Coverage analysis report with gap identification and remediation plan

---

## PHASE 4: ANALYSIS & REPORTING (Cycle 68-70)

### Task 4.1: Investigate Test Failures
**Status:** ⏹️ BLOCKED_ON_PHASE_3
**Effort:** Variable
**Owner:** agent-problem-solver (with agent-quality coordination)

**For each failure:**
- [ ] Reproduce failure consistently
- [ ] Identify root cause (code bug vs. test issue)
- [ ] Document failure details:
  - Expected vs. actual
  - Stack trace
  - Relevant logs
  - Context (which cycle introduced it)
- [ ] Classify severity:
  - Critical: Feature broken, user impact
  - High: Important path broken
  - Medium: Edge case not working
  - Low: Non-critical feature issue
- [ ] Create fix task in next cycle

**Acceptance Criteria:**
- [ ] All failures documented
- [ ] Root causes identified
- [ ] Severity classified
- [ ] Fix tasks created
- [ ] Assignees identified

**Deliverable:** Failure analysis report with remediation plan

---

### Task 4.2: Generate Quality Metrics & Insights
**Status:** ⏹️ BLOCKED_ON_PHASE_3
**Effort:** 1 hour
**Owner:** agent-quality (intelligence agent)

**Metrics to Calculate:**
- [ ] Code coverage percentage (unit + integration + E2E)
- [ ] Test pass rate (total passing / total tests)
- [ ] Test execution time (total, average per test)
- [ ] Performance metrics:
  - API response times (p50, p95, p99)
  - Page load times (LCP, FID, CLS)
  - Database query times
- [ ] Accessibility score (WCAG AA compliance %)
- [ ] Coverage by dimension:
  - Things coverage (which types tested)
  - Connections coverage (which relationships tested)
  - Events coverage (which events logged)
- [ ] Critical path coverage (all flows > 80%?)

**Insights to Generate:**
- [ ] Which areas are well-tested (confidence: high)
- [ ] Which areas need more testing (risk: high)
- [ ] Common failure patterns (theme: test brittleness)
- [ ] Performance bottlenecks (theme: slow operations)
- [ ] Accessibility gaps (theme: WCAG violations)
- [ ] Test quality assessment (assertions per test)
- [ ] Ontology alignment score (% compliant)

**Deliverable:** Comprehensive metrics dashboard + insights report

---

### Task 4.3: Create Quality Report Thing & Connections
**Status:** ⏹️ BLOCKED_ON_PHASE_3
**Effort:** 30 min
**Owner:** agent-quality

**Create thing (type: "report"):**
```typescript
{
  type: "report",
  name: "Quality Report: AI-Powered Recommendations",
  groupId: featureGroupId,
  properties: {
    phase: "Quality & Testing (Cycle 65-70)",
    testingStartDate: Date.now(),
    testingEndDate: Date.now(),
    totalTests: 40,  // unit + integration + e2e
    testsPass: 40,
    testsFail: 0,
    codeCoveragePercent: 87,
    ontologyAligned: true,
    accessibilityScore: 92,
    performanceTargetsMet: true,
    criticalPathsCovered: 5,
    metrics: {
      unitTestCount: 15,
      integrationTestCount: 15,
      e2eTestCount: 10,
      averageResponseTime: 450,  // ms
      p95ResponseTime: 1200,  // ms
    }
  },
  status: "published"
}
```

**Create connections:**
- [ ] feature tested_by test_suite
- [ ] test_suite validated_by quality_report
- [ ] quality_report prepared_by agent-quality
- [ ] quality_report references feature

**Acceptance Criteria:**
- [ ] Report thing created with all metadata
- [ ] Connections created with correct types
- [ ] Report scoped to correct group
- [ ] Report marked as published

**Deliverable:** Quality report thing with connections established

---

### Task 4.4: Document Test Scenarios & Results
**Status:** ⏹️ BLOCKED_ON_PHASE_3
**Effort:** 2 hours
**Owner:** agent-documenter

**Create document: `/one/things/features/recommendations/test-results.md`**

**Contents:**
- [ ] Executive summary (pass rate, coverage, key metrics)
- [ ] Test overview (40 tests: 15 unit + 15 integration + 10 E2E)
- [ ] Critical path testing results
  - Flow 1: Generate Recommendation (PASS/FAIL)
  - Flow 2: Accept Recommendation (PASS/FAIL)
  - Flow 3: Reject Recommendation (PASS/FAIL)
  - Flow 4: View History (PASS/FAIL)
  - Flow 5: Settings (PASS/FAIL)
- [ ] Unit test results (15 tests with details)
- [ ] Integration test results (15 tests with details)
- [ ] E2E test results (10 scenarios with screenshots)
- [ ] Coverage analysis (by layer, by dimension)
- [ ] Performance results (metrics vs. targets)
- [ ] Accessibility audit results (WCAG compliance)
- [ ] Known issues (severity, planned fixes)
- [ ] Recommendations for next phase

**Acceptance Criteria:**
- [ ] Document complete and detailed
- [ ] All test results documented
- [ ] Screenshots included (E2E failures)
- [ ] Metrics clearly presented
- [ ] Actionable recommendations provided

**Deliverable:** Comprehensive test results documentation

---

### Task 4.5: Capture Lessons Learned & Update Knowledge
**Status:** ⏹️ BLOCKED_ON_PHASE_3
**Effort:** 1 hour
**Owner:** agent-quality

**Create knowledge chunk: `/one/knowledge/lessons/recommendations-testing.md`**

**Lessons to capture:**
- [ ] What testing strategy worked well (reuse this pattern)
- [ ] What was challenging (e.g., async testing, auth mocking)
- [ ] Test patterns discovered (e.g., fixture setup)
- [ ] Common mistakes to avoid (e.g., test interdependence)
- [ ] Ontology insights (e.g., how things map to tests)
- [ ] Performance insights (e.g., what's slow)
- [ ] Accessibility insights (e.g., common WCAG violations)
- [ ] Tools/libraries that helped (e.g., Playwright matchers)

**Labels to apply:**
- skill:testing
- skill:validation
- topic:quality
- topic:coverage
- status:resolved

**Create knowledge thing (type: "insight"):**
```typescript
{
  type: "insight",
  name: "AI Recommendations Testing Strategy",
  properties: {
    category: "quality",
    pattern: "3-layer testing (unit/integration/E2E) with ontology validation",
    frequency: 100,  // applied to all features
    severity: "high",
    recommendation: "Use this pattern for all future critical features",
    affectedFeatures: ["recommendations"],
    detectedAt: Date.now(),
    confidence: 0.95
  },
  status: "published"
}
```

**Acceptance Criteria:**
- [ ] At least 5 specific lessons documented
- [ ] Patterns identified and named
- [ ] Actionable recommendations provided
- [ ] Knowledge thing created
- [ ] Knowledge labeled with ontology prefixes

**Deliverable:** Lessons learned documentation + knowledge thing

---

### Task 4.6: Quality Gate Decision & Approval
**Status:** ⏹️ BLOCKED_ON_PHASE_3
**Effort:** 30 min
**Owner:** agent-quality (intelligence agent decision)

**Quality Gate Criteria - ALL MUST PASS:**

**1. Ontology Alignment ✓**
- [ ] All things use correct types
- [ ] All connections use correct types
- [ ] All events properly logged
- [ ] Multi-tenant scoping verified
- [ ] Complete audit trail present

**2. Test Coverage ✓**
- [ ] Unit tests: >= 80% coverage
- [ ] Integration tests: >= 80% coverage
- [ ] E2E tests: all 5 critical flows covered
- [ ] Edge cases covered
- [ ] Error paths covered

**3. Test Results ✓**
- [ ] Unit tests: 15/15 PASS
- [ ] Integration tests: 15/15 PASS
- [ ] E2E tests: 10/10 PASS
- [ ] No flaky tests (stable)
- [ ] No timeout failures

**4. Performance ✓**
- [ ] Recommendation generation: < 2s (PASS)
- [ ] Page load: < 1s (PASS)
- [ ] API response: < 500ms (PASS)
- [ ] Database queries: < 200ms (PASS)
- [ ] LCP: < 2.5s (PASS)

**5. Accessibility ✓**
- [ ] WCAG AA compliance: >= 90% (PASS)
- [ ] Keyboard navigation: fully functional
- [ ] Screen reader: fully functional
- [ ] Mobile: fully responsive
- [ ] Color contrast: sufficient

**6. Security ✓**
- [ ] Authorization checks: all mutations verified
- [ ] No SQL injection vulnerabilities
- [ ] Rate limiting: enforced
- [ ] Input validation: all fields validated
- [ ] Sensitive data: not logged

**Decision Logic:**
```
IF (ontology ✓ AND coverage ✓ AND tests ✓ AND performance ✓
    AND accessibility ✓ AND security ✓)
  THEN approve for next phase
  ELSE request fixes and re-test
```

**DECISION: ✅ APPROVED / ❌ REJECTED (based on results)**

**Approval Actions (if APPROVED):**
- [ ] Emit event: quality_check_complete (status: approved)
- [ ] Update feature status: testing → ready_for_deployment
- [ ] Create quality_passed event
- [ ] Archive test artifacts
- [ ] Ready for next phase (Cycle 71 - Design & UX)

**Rejection Actions (if REJECTED):**
- [ ] Emit event: test_failed
- [ ] Create action items for problem-solver
- [ ] Wait for fixes
- [ ] Re-run tests (goto Task 3.1)
- [ ] Document root causes

**Acceptance Criteria:**
- [ ] Quality gate decision clearly documented
- [ ] All criteria evaluated (no skipping)
- [ ] Decision is objective and defensible
- [ ] Stakeholders informed
- [ ] Next phase ready (if approved)

**Deliverable:** Quality gate decision document + approval/rejection notice

---

## PHASE 5: CONTINUOUS VALIDATION (Cycle 68-100)

### Task 5.1: Monitor Test Flakiness
**Status:** ⏹️ BLOCKED_ON_PHASE_3
**Effort:** Ongoing (30 min per iteration)
**Owner:** agent-quality

**Weekly Actions:**
- [ ] Re-run all tests (unit + integration + E2E)
- [ ] Track flaky tests (tests that sometimes pass, sometimes fail)
- [ ] Document flakiness rate (< 5% is acceptable)
- [ ] Investigate and fix high-flakiness tests
- [ ] Report trends

**Flakiness Investigation:**
- [ ] Run test 10x in succession
- [ ] Note pass/fail rates
- [ ] Identify causes (timing, async, mocking, infrastructure)
- [ ] Apply fixes (await properly, mock better, add retries)
- [ ] Verify fix by re-running 10x

---

### Task 5.2: Track Coverage Trends
**Status:** ⏹️ BLOCKED_ON_PHASE_3
**Effort:** Ongoing (1 hour per week)
**Owner:** agent-quality

**Weekly Metrics:**
- [ ] Total coverage percentage (unit + integration + E2E)
- [ ] Coverage by layer (service, mutation, component, page)
- [ ] Coverage by ontology dimension
- [ ] Coverage growth (week over week)
- [ ] Regression detection (coverage goes down)

**Dashboard View:**
- Trend chart (coverage % over time)
- Layer breakdown (pie chart)
- Gap identification (areas < 80%)
- Action items (new tests to write)

---

### Task 5.3: Regression Testing
**Status:** ⏹️ BLOCKED_ON_PHASE_3
**Effort:** Ongoing (per release)
**Owner:** agent-quality, agent-builder

**Before Each Release:**
- [ ] Run full test suite (40 tests)
- [ ] Verify all tests still pass
- [ ] Check performance hasn't degraded
- [ ] Verify accessibility still compliant
- [ ] Review any code changes for test impact

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] No new failures introduced
- [ ] Performance metrics within tolerance (±10%)
- [ ] No regression in coverage

---

## CRITICAL PATH DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Test Planning & Design (Cycle 65)                 │
│                                                             │
│  1.1: Load Ontology ──→ 1.2: User Flows                   │
│                           ↓                                │
│                        1.3: Acceptance Criteria             │
│                           ↓                                │
│                        1.4: Unit Test Cases                 │
│                           ↓                                │
│                        1.5: Integration Test Cases          │
│                           ↓                                │
│                        1.6: E2E Test Cases                  │
│                                                             │
│  DELIVERABLE: Test specifications complete                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Test Implementation (Cycle 66)                    │
│                                                             │
│  2.1: Unit Tests ─────────┐                               │
│                           ├─→ 2.4: Fixtures                │
│  2.2: Integration Tests ──┤                               │
│                           └─→ 2.3: E2E Tests               │
│                                                             │
│  DELIVERABLE: All tests implemented and passing            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Test Execution & Validation (Cycle 67)            │
│                                                             │
│  3.1: Run Unit Tests ──────┐                              │
│                            ├─→ 3.4: Ontology Validation    │
│  3.2: Run Integration ─────┤   3.5: Coverage Analysis      │
│                            └─→ 3.3: Run E2E Tests          │
│                                                             │
│  DELIVERABLE: All tests passing, coverage > 80%            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Analysis & Reporting (Cycle 68-70)                │
│                                                             │
│  4.1: Investigate Failures ────┐                          │
│                                ├─→ 4.6: Quality Gate       │
│  4.2: Generate Metrics ────┬───┤     Decision              │
│                            │   └─→ 4.3: Report Thing       │
│  4.3: Report Thing ────────┼──────→ 4.4: Documentation     │
│                            │                               │
│  4.5: Lessons Learned ─────┘                              │
│                                                             │
│  DELIVERABLE: Quality gate decision (APPROVED/REJECTED)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
         ┌──────────────────┴──────────────────┐
         ↓                                      ↓
    APPROVED                              REJECTED
    ✓ Advance to                      ✓ Create fixes
      next phase                        ✓ Re-test
      (Cycle 71)                        ✓ Gate again
```

---

## SUCCESS CRITERIA

**Phase 1 Success (Test Planning):**
- [ ] 5 primary user flows defined with ontology mappings
- [ ] 5 secondary (error) flows defined
- [ ] 40+ acceptance criteria specified
- [ ] 15 unit test cases designed (service layer)
- [ ] 15 integration test cases designed (API layer)
- [ ] 10 E2E test scenarios designed (user journeys)
- [ ] All designs follow ontology correctly

**Phase 2 Success (Test Implementation):**
- [ ] All 40 tests implemented in code
- [ ] Fixtures and test data prepared
- [ ] Tests executable and compile without errors
- [ ] Test infrastructure in place (runner, reporter, coverage)
- [ ] CI/CD pipeline configured for tests

**Phase 3 Success (Test Execution):**
- [ ] 15/15 unit tests PASS (< 30 seconds)
- [ ] 15/15 integration tests PASS (< 1 minute)
- [ ] 10/10 E2E tests PASS (< 2 minutes)
- [ ] Code coverage > 80% (all layers)
- [ ] Ontology alignment 100% verified
- [ ] No critical failures remaining

**Phase 4 Success (Quality Gate):**
- [ ] All 6 quality gate criteria met
- [ ] Ontology alignment verified
- [ ] Test coverage adequate
- [ ] Performance targets met
- [ ] Accessibility standards met
- [ ] Security validated
- [ ] Quality gate decision: APPROVED

**Overall Success (All Phases):**
- [ ] 40 tests total
- [ ] 100% pass rate
- [ ] 80%+ code coverage
- [ ] All critical paths covered
- [ ] Ontology fully compliant
- [ ] 5+ lessons learned documented
- [ ] Ready for next phase (Cycle 71)

---

## ESTIMATED EFFORT SUMMARY

| Phase | Task | Hours | Owner |
|-------|------|-------|-------|
| 1 | 1.1: Load Ontology | 0.5 | agent-quality |
| 1 | 1.2: User Flows | 1.0 | agent-quality |
| 1 | 1.3: Acceptance Criteria | 1.5 | agent-quality |
| 1 | 1.4: Unit Test Design | 1.5 | agent-quality |
| 1 | 1.5: Integration Test Design | 1.5 | agent-quality |
| 1 | 1.6: E2E Test Design | 2.0 | agent-quality |
| **1 Total** | **Test Planning** | **9.5** | **agent-quality** |
| 2 | 2.1: Unit Tests Implementation | 2.0 | agent-builder |
| 2 | 2.2: Integration Tests Implementation | 2.0 | agent-builder |
| 2 | 2.3: E2E Tests Implementation | 3.0 | agent-frontend |
| 2 | 2.4: Test Fixtures | 1.0 | agent-quality |
| **2 Total** | **Test Implementation** | **8.0** | **agent-builder, agent-frontend** |
| 3 | 3.1: Run Unit Tests | 0.5 | agent-builder |
| 3 | 3.2: Run Integration Tests | 0.75 | agent-builder |
| 3 | 3.3: Run E2E Tests | 1.0 | agent-frontend |
| 3 | 3.4: Ontology Validation | 1.0 | agent-quality |
| 3 | 3.5: Coverage Analysis | 1.0 | agent-quality |
| **3 Total** | **Test Execution** | **4.25** | **agent-quality, agent-builder, agent-frontend** |
| 4 | 4.1: Investigate Failures | 1.0 | agent-problem-solver |
| 4 | 4.2: Generate Metrics | 1.0 | agent-quality |
| 4 | 4.3: Report Thing | 0.5 | agent-quality |
| 4 | 4.4: Documentation | 2.0 | agent-documenter |
| 4 | 4.5: Lessons Learned | 1.0 | agent-quality |
| 4 | 4.6: Quality Gate | 0.5 | agent-quality |
| **4 Total** | **Analysis & Reporting** | **6.0** | **agent-quality, agent-problem-solver, agent-documenter** |
| **GRAND TOTAL** | **All Phases** | **27.75 hours** | **All agents** |

---

## PARALLELIZATION OPPORTUNITIES

**Can Run in Parallel:**
- Task 1.2 (User Flows) + 1.3 (Acceptance Criteria) - sequential dependency
- Task 1.4 (Unit Tests) + 1.5 (Integration Tests) + 1.6 (E2E Tests) - once 1.3 complete
- Task 2.1 (Unit Tests) + 2.2 (Integration Tests) + 2.3 (E2E Tests) - independent
- Task 3.1 (Unit Tests) + 3.2 (Integration Tests) + 3.3 (E2E Tests) - independent
- Task 4.1-4.6 - mostly parallelizable with some synchronization points

**Sequential Must-Haves:**
- Phase 1 (complete before Phase 2)
- Phase 2 (complete before Phase 3)
- Phase 3 (complete before Phase 4)
- Task 4.6 (Quality Gate) only after 4.1-4.5 complete

---

## RESOURCE ALLOCATION

**Agent Assignments:**

1. **agent-quality** (Primary Owner)
   - Overall quality test orchestration
   - Task 1.1-1.6 (all test design)
   - Task 2.4 (fixtures)
   - Task 3.4-3.5 (ontology, coverage)
   - Task 4.2-4.3, 4.5-4.6 (metrics, reporting, lessons, decision)
   - Task 5.1-5.3 (ongoing monitoring)

2. **agent-builder** (Backend & Services)
   - Task 2.1-2.2 (implement unit & integration tests)
   - Task 3.1-3.2 (run unit & integration tests)
   - Backend service testing expertise
   - Database validation

3. **agent-frontend** (Frontend & Components)
   - Task 2.3 (implement E2E tests)
   - Task 3.3 (run E2E tests)
   - React/Astro component testing
   - Accessibility testing

4. **agent-problem-solver** (Failure Analysis)
   - Task 4.1 (investigate failures)
   - Root cause analysis
   - Fix recommendations
   - Delegated by quality gate failure

5. **agent-documenter** (Documentation)
   - Task 4.4 (test documentation)
   - Lessons learned documentation
   - Knowledge capture
   - Report generation

---

## DECISION FRAMEWORK

### Decision Point 1: Should we proceed from Phase 1 to Phase 2?
**Criteria:**
- All test designs complete (tasks 1.1-1.6)
- No unclear requirements
- Test scope agreed with stakeholders
- Decision: **YES, if all planning tasks complete**

### Decision Point 2: Should we approve tests after Phase 2?
**Criteria:**
- All tests implemented and compiling
- No syntax errors
- Test structure sound
- Decision: **YES, code review passes**

### Decision Point 3: Should we pass tests in Phase 3?
**Criteria:**
- Unit tests: 15/15 PASS
- Integration tests: 15/15 PASS
- E2E tests: 10/10 PASS
- Decision: **YES, all pass OR investigate failures (goto Task 4.1)**

### Decision Point 4: Should quality gate approve (Phase 4)?
**Criteria:**
- Ontology alignment: 100% ✓
- Test coverage: >= 80% ✓
- Test pass rate: 100% ✓
- Performance targets: all met ✓
- Accessibility: >= 90% ✓
- Security: all checks passed ✓
- Decision: **APPROVED if ALL criteria met, else REJECTED with fixes**

---

## NEXT ACTIONS

**IMMEDIATE (Cycle 65 - This Cycle):**
1. ✅ Create this TODO file (todo-agent-quality.md)
2. 🎯 Start Task 1.1: Load Ontology Context
3. 🎯 Complete Task 1.2: Define User Flows
4. 🎯 Complete Task 1.3: Acceptance Criteria

**SHORT-TERM (Cycle 66):**
5. Complete Task 1.4-1.6: Design all test cases
6. Begin Phase 2: Implement all tests (agent-builder, agent-frontend)
7. Prepare test fixtures and data

**MID-TERM (Cycle 67):**
8. Execute all tests (Phase 3)
9. Validate ontology alignment
10. Analyze coverage

**LONG-TERM (Cycle 68-70):**
11. Investigate failures (if any)
12. Generate quality metrics and insights
13. Create quality report and decisions
14. Document results and lessons learned

**CONTINUOUS:**
15. Monitor test flakiness
16. Track coverage trends
17. Perform regression testing before releases

---

## APPENDIX: TEST RESULT TEMPLATE

When tests are executed, fill in this template:

```markdown
# Test Execution Results

## Summary
- Total Tests: 40
- Passed: XX/40
- Failed: XX/40
- Skipped: 0
- Pass Rate: XX%
- Duration: XX minutes

## By Layer
- Unit Tests: XX/15 PASS (coverage: XX%)
- Integration Tests: XX/15 PASS (coverage: XX%)
- E2E Tests: XX/10 PASS

## Critical Paths
- Flow 1 (Generate): PASS/FAIL
- Flow 2 (Accept): PASS/FAIL
- Flow 3 (Reject): PASS/FAIL
- Flow 4 (History): PASS/FAIL
- Flow 5 (Settings): PASS/FAIL

## Performance Metrics
- Recommendation generation: XXms (target: 2000ms)
- Page load: XXms (target: 1000ms)
- API response: XXms (target: 500ms)
- Database query: XXms (target: 200ms)

## Coverage
- Overall: XX% (target: 80%)
- Services: XX% (target: 90%)
- Mutations: XX% (target: 85%)
- Queries: XX% (target: 85%)

## Failures (if any)
[Document each failure with details]

## Quality Gate Decision
- Ontology Aligned: YES/NO
- Coverage Adequate: YES/NO
- Tests Passing: YES/NO
- Performance Met: YES/NO
- Accessibility OK: YES/NO
- Security Verified: YES/NO

**FINAL DECISION: APPROVED / REJECTED**
```

---

**Quality Agent: Orchestrating comprehensive testing for AI-powered recommendations. Validating against 6-dimension ontology. Ready to advance when all criteria met.**

*Created: Cycle 65*
*Target Completion: Cycle 70*
*Status: Ready for Phase 1 execution*
