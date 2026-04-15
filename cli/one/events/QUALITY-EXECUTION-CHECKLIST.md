# Quality Agent Execution Checklist - Cycle 65-70

**Quick Reference for executing the quality testing plan**

---

## CYCLE 65: TEST PLANNING & DESIGN

**Target:** Complete all test specifications

### Task 1.1: Load Ontology Context (30 min)
```
Status: 🎯 START HERE
- [ ] Read /one/knowledge/ontology.md (6-dimension spec)
- [ ] Read /one/knowledge/rules.md (golden rules)
- [ ] Read /one/connections/workflow.md (6-phase)
- [ ] Review feature spec from Cycle 1-64
- [ ] Map feature to 6 dimensions:
      [ ] Groups (org/team ownership)
      [ ] People (creators, consumers, roles)
      [ ] Things (recommendations, users, products)
      [ ] Connections (recommends, based_on)
      [ ] Events (generated, accepted, rejected, updated)
      [ ] Knowledge (embeddings, RAG)
```

### Task 1.2: Define Critical User Flows (1 hour)
```
Status: ⏹️ BLOCKED_ON_1.1
- [ ] Flow 1: Generate Recommendation
- [ ] Flow 2: Accept Recommendation
- [ ] Flow 3: Reject Recommendation
- [ ] Flow 4: View Recommendation History
- [ ] Flow 5: Personalize Settings
- [ ] Error Flow 1: No recommendation available
- [ ] Error Flow 2: User not authenticated
- [ ] Error Flow 3: Service unavailable
- [ ] Error Flow 4: Invalid recommendation data
- [ ] Error Flow 5: Knowledge embedding missing
- [ ] Define time budgets (< 2s, < 1s, < 500ms)
- [ ] Map ontology: things → connections → events
```

### Task 1.3: Create Acceptance Criteria (1.5 hours)
```
Status: ⏹️ BLOCKED_ON_1.2
- [ ] Flow 1 criteria (generate):
      [ ] Within time budget (< 2s)
      [ ] Thing created with type "recommendation"
      [ ] Properties: targetUser, item, score, reason
      [ ] Connections created (→user, →item)
      [ ] Event logged (recommendation_generated)
      [ ] Knowledge embedding created
      [ ] HTTP 200 response
- [ ] Flow 2 criteria (accept):
      [ ] Status changes draft → accepted
      [ ] Connection created (user → item)
      [ ] Event logged (recommendation_accepted)
      [ ] Success message displayed
      [ ] Time to completion < 300ms
- [ ] Flow 3 criteria (reject):
      [ ] Status changes draft → rejected
      [ ] Event logged (recommendation_rejected)
      [ ] Removed from view (< 300ms)
      [ ] Feedback recorded for ML
- [ ] Flow 4 criteria (history):
      [ ] Query returns all recommendations
      [ ] Paginated (20 per page)
      [ ] Filtered by status
      [ ] Load time < 500ms
- [ ] Flow 5 criteria (settings):
      [ ] Form loads with current preferences
      [ ] Save button updates properties
      [ ] Event logged (settings_updated)
      [ ] Persists across sessions
- [ ] Error flow criteria for all 5 error cases
```

### Task 1.4: Design Unit Test Cases (1.5 hours)
```
Status: ⏹️ BLOCKED_ON_1.3
Service Layer Tests (Effect.ts)
- [ ] Test 1.4.1: Generate recommendation
- [ ] Test 1.4.2: Create recommendation thing
- [ ] Test 1.4.3: Create connections
- [ ] Test 1.4.4: Log recommendation_generated event
- [ ] Test 1.4.5: Filter by user preferences
- [ ] Test 1.4.6: Accept recommendation
- [ ] Test 1.4.7: Reject recommendation
- [ ] Test 1.4.8: Get recommendation history
- [ ] Test 1.4.9: Update recommendation settings
- [ ] Test 1.4.10: Validate recommendation object
Query Tests
- [ ] Test 1.4.11: Query by status
- [ ] Test 1.4.12: Query with knowledge embedding
- [ ] Test 1.4.13: Error handling (missing data)
- [ ] Test 1.4.14: Error handling (timeout)
- [ ] Test 1.4.15: Ontology compliance
```

### Task 1.5: Design Integration Test Cases (1.5 hours)
```
Status: ⏹️ BLOCKED_ON_1.4
Mutation Tests (Convex API)
- [ ] Test 1.5.1: generateRecommendation mutation
- [ ] Test 1.5.2: acceptRecommendation mutation
- [ ] Test 1.5.3: rejectRecommendation mutation
- [ ] Test 1.5.4: updateRecommendationSettings mutation
- [ ] Test 1.5.5: Authorization check
Query Tests
- [ ] Test 1.5.6: getRecommendations query
- [ ] Test 1.5.7: getRecommendationHistory query
- [ ] Test 1.5.8: getRecommendationStats query
- [ ] Test 1.5.9: getRecommendationDetails query
- [ ] Test 1.5.10: Database state validation
Error Handling
- [ ] Test 1.5.11: Invalid recommendation ID (404)
- [ ] Test 1.5.12: Missing required fields (400)
- [ ] Test 1.5.13: Database connection failure (retry)
- [ ] Test 1.5.14: Concurrent mutations (race condition)
- [ ] Test 1.5.15: Rate limiting (429)
```

### Task 1.6: Design E2E Test Cases (2 hours)
```
Status: ⏹️ BLOCKED_ON_1.5
Critical User Journeys
- [ ] Test 1.6.1: Complete recommendation flow
      [ ] Login → View → Accept → History
- [ ] Test 1.6.2: Reject and settings flow
      [ ] Reject → Settings → New recommendations
- [ ] Test 1.6.3: Mobile responsiveness
      [ ] 375px viewport
- [ ] Test 1.6.4: Accessibility (WCAG AA)
      [ ] Screen reader, keyboard navigation
- [ ] Test 1.6.5: Performance baseline
      [ ] LCP < 1s, Accept < 300ms
- [ ] Test 1.6.6: Error recovery
      [ ] Network failure → Recover → Continue
- [ ] Test 1.6.7: Authentication flow
      [ ] Unauthenticated → Login → Access
- [ ] Test 1.6.8: Cross-browser compatibility
      [ ] Chrome, Firefox, Safari
- [ ] Test 1.6.9: Data persistence
      [ ] Close browser → Reopen → Data there
- [ ] Test 1.6.10: State consistency
      [ ] Keep page open → Background updates sync
```

**PHASE 1 DELIVERABLES:**
- ✅ todo-agent-quality.md (56KB, comprehensive)
- ✅ User flows document with ontology mappings
- ✅ Acceptance criteria (40+ per flow)
- ✅ Unit test specifications (15 tests)
- ✅ Integration test specifications (15 tests)
- ✅ E2E test specifications (10 tests)

**NEXT:** Proceed to Cycle 66 when Phase 1 complete

---

## CYCLE 66: TEST IMPLEMENTATION

**Target:** All 40 tests implemented and compiling

### Task 2.1: Implement Unit Tests (2 hours)
```
Status: ⏹️ BLOCKED_ON_PHASE_1
Owner: agent-builder
Deliverable: /web/test/recommendations/recommendation-service.test.ts
- [ ] Create test file
- [ ] Import test utilities and fixtures
- [ ] Implement 15 unit tests
      - 10 service layer tests
      - 5 query helper tests
- [ ] Assertions cover all business logic
- [ ] Error cases tested
- [ ] Edge cases handled
- [ ] All tests pass locally
```

### Task 2.2: Implement Integration Tests (2 hours)
```
Status: ⏹️ BLOCKED_ON_PHASE_1
Owner: agent-builder
Deliverable: /web/test/recommendations/recommendation-mutations.test.ts
                 /web/test/recommendations/recommendation-queries.test.ts
                 /web/test/recommendations/recommendation-integration.test.ts
- [ ] Create mutation test file
- [ ] Create query test file
- [ ] Create integration test file
- [ ] Implement 15 integration tests
      - 5 mutation tests
      - 4 query tests
      - 6 error handling + concurrency tests
- [ ] Use real test database
- [ ] Validate transactions
- [ ] Cleanup after each test
- [ ] All tests pass
```

### Task 2.3: Implement E2E Tests (3 hours)
```
Status: ⏹️ BLOCKED_ON_PHASE_1
Owner: agent-frontend
Deliverable: /web/test/e2e/recommendations.spec.ts
- [ ] Create E2E test file (Playwright)
- [ ] Setup test utilities and helpers
- [ ] Implement 10 E2E scenarios
- [ ] Real browser automation
- [ ] Screenshots on failure
- [ ] Accessibility checks
- [ ] Performance measurements
- [ ] All scenarios pass
```

### Task 2.4: Create Test Fixtures & Data (1 hour)
```
Status: ⏹️ BLOCKED_ON_PHASE_1
Owner: agent-quality
Deliverable: /web/test/fixtures/recommendations-test-data.ts
- [ ] Create test data fixtures
      [ ] testUser object
      [ ] testRecommendations array
      [ ] testItems array
- [ ] Create database seeding script
      [ ] Populate test database
      [ ] Create test organizations
      [ ] Setup test users
- [ ] Create cleanup procedures
- [ ] Configure test environment variables
```

**PHASE 2 DELIVERABLES:**
- ✅ 15 unit tests implemented and passing
- ✅ 15 integration tests implemented and passing
- ✅ 10 E2E tests implemented and passing
- ✅ Test fixtures and data seeding
- ✅ All tests compiling without errors

**NEXT:** Proceed to Cycle 67 when Phase 2 complete

---

## CYCLE 67: TEST EXECUTION & VALIDATION

**Target:** All tests passing, coverage verified, ontology aligned

### Task 3.1: Run Unit Tests (30 min)
```
Status: ⏹️ BLOCKED_ON_PHASE_2
Command: bun test test/recommendations/
- [ ] Run unit tests
- [ ] Capture output
- [ ] Verify 15/15 PASS
- [ ] Check coverage > 80%
- [ ] Generate HTML report
- [ ] Document results
✓ Expected: 15/15 PASS in < 30 seconds
```

### Task 3.2: Run Integration Tests (45 min)
```
Status: ⏹️ BLOCKED_ON_PHASE_2
Command: npm run test:integration
- [ ] Deploy code to staging
- [ ] Run integration tests
- [ ] Verify 15/15 PASS
- [ ] Check performance metrics
- [ ] Analyze response times
- [ ] Document results
✓ Expected: 15/15 PASS in < 1 minute
```

### Task 3.3: Run E2E Tests (1 hour)
```
Status: ⏹️ BLOCKED_ON_PHASE_2
Command: npm run test:e2e
- [ ] Run E2E tests (Playwright)
- [ ] Verify 10/10 PASS
- [ ] Capture screenshots
- [ ] Generate HTML report
- [ ] Check accessibility scores
- [ ] Check Lighthouse scores
- [ ] Document results
✓ Expected: 10/10 PASS in < 2 minutes
```

### Task 3.4: Validate Ontology Alignment (1 hour)
```
Status: ⏹️ BLOCKED_ON_PHASE_2
- [ ] Verify all things use correct types (66+)
      [ ] recommendation ✓
      [ ] user ✓
      [ ] product ✓
- [ ] Verify all connections use correct types (25+)
      [ ] recommends ✓
      [ ] recommends_item ✓
- [ ] Verify all events use correct types (67+)
      [ ] recommendation_generated ✓
      [ ] recommendation_accepted ✓
      [ ] recommendation_rejected ✓
      [ ] recommendation_settings_updated ✓
- [ ] Verify groupId scoping on all entities
- [ ] Verify audit trail (actorId, targetId, timestamp)
- [ ] Verify knowledge integration
✓ Expected: 100% ontology alignment
```

### Task 3.5: Analyze Coverage & Gaps (1 hour)
```
Status: ⏹️ BLOCKED_ON_PHASE_2
- [ ] Load coverage reports
- [ ] Identify untested paths (< 80%)
- [ ] Prioritize by importance
- [ ] Create action items for gaps
- [ ] Assess risk of uncovered code
✓ Expected: >= 80% coverage overall
✓ Expected: >= 90% service layer
✓ Expected: >= 85% mutations/queries
```

**PHASE 3 DELIVERABLES:**
- ✅ Unit test results: 15/15 PASS
- ✅ Integration test results: 15/15 PASS
- ✅ E2E test results: 10/10 PASS
- ✅ Code coverage report: >= 80%
- ✅ Ontology alignment: 100% verified
- ✅ Performance metrics documented

**NEXT:** Proceed to Cycle 68-70 when Phase 3 complete

---

## CYCLE 68-70: ANALYSIS & REPORTING

**Target:** Quality decision made, documentation complete

### Task 4.1: Investigate Failures (variable)
```
Status: ⏹️ BLOCKED_ON_PHASE_3
Owner: agent-problem-solver
- [ ] If failures exist:
      [ ] Reproduce consistently
      [ ] Identify root cause
      [ ] Classify severity (critical/high/medium/low)
      [ ] Document details
      [ ] Create fix tasks
- [ ] If no failures:
      [ ] Mark as zero-defect
```

### Task 4.2: Generate Metrics & Insights (1 hour)
```
Status: ⏹️ BLOCKED_ON_PHASE_3
Owner: agent-quality
- [ ] Calculate code coverage % (target: >= 80%)
- [ ] Calculate test pass rate (target: 100%)
- [ ] Calculate execution times (by layer)
- [ ] Measure performance (p50, p95, p99)
- [ ] Measure accessibility score (target: >= 90%)
- [ ] Coverage by dimension:
      [ ] Things coverage
      [ ] Connections coverage
      [ ] Events coverage
- [ ] Generate insights:
      [ ] Well-tested areas
      [ ] Risk areas (low coverage)
      [ ] Performance bottlenecks
      [ ] Accessibility gaps
      [ ] Test quality assessment
      [ ] Ontology alignment score
```

### Task 4.3: Create Quality Report Thing (30 min)
```
Status: ⏹️ BLOCKED_ON_PHASE_3
Owner: agent-quality
- [ ] Create thing (type: "report")
      [ ] name: "Quality Report: AI-Powered Recommendations"
      [ ] properties:
          - totalTests: 40
          - testsPassed: 40
          - codeCoveragePercent: ??
          - ontologyAligned: true/false
          - accessibilityScore: ??
          - performanceTargetsMet: true/false
- [ ] Create connections:
      [ ] feature tested_by test_suite
      [ ] test_suite validated_by quality_report
```

### Task 4.4: Document Test Results (2 hours)
```
Status: ⏹️ BLOCKED_ON_PHASE_3
Owner: agent-documenter
Deliverable: /one/things/features/recommendations/test-results.md
- [ ] Executive summary
- [ ] Test overview (40 tests)
- [ ] Critical path results (5 flows)
- [ ] Unit test results (15 tests)
- [ ] Integration test results (15 tests)
- [ ] E2E test results (10 scenarios)
- [ ] Coverage analysis
- [ ] Performance results
- [ ] Accessibility audit
- [ ] Known issues
- [ ] Recommendations
```

### Task 4.5: Capture Lessons Learned (1 hour)
```
Status: ⏹️ BLOCKED_ON_PHASE_3
Owner: agent-quality
Deliverable: /one/knowledge/lessons/recommendations-testing.md
- [ ] What worked well (reuse this pattern)
- [ ] What was challenging
- [ ] Test patterns discovered
- [ ] Common mistakes to avoid
- [ ] Ontology insights
- [ ] Performance insights
- [ ] Accessibility insights
- [ ] Tools that helped
- [ ] Create knowledge thing (type: "insight")
- [ ] Apply labels (skill:testing, topic:quality, etc.)
```

### Task 4.6: Quality Gate Decision (30 min)
```
Status: ⏹️ BLOCKED_ON_PHASE_3
Owner: agent-quality (Intelligence Agent)

QUALITY GATE CRITERIA - ALL MUST PASS:

1. Ontology Alignment
   [ ] All things use correct types (from 66+)
   [ ] All connections use correct types (from 25+)
   [ ] All events use correct types (from 67+)
   [ ] All scoped to groupId (multi-tenant)
   [ ] Complete audit trail (actorId, targetId, timestamp)
   ✓ PASS if all verified

2. Test Coverage
   [ ] Overall >= 80%
   [ ] Services >= 90%
   [ ] Mutations/Queries >= 85%
   [ ] Critical paths 100%
   ✓ PASS if all thresholds met

3. Test Results
   [ ] Unit: 15/15 PASS
   [ ] Integration: 15/15 PASS
   [ ] E2E: 10/10 PASS
   [ ] No flaky tests (< 5%)
   ✓ PASS if all passing

4. Performance Targets
   [ ] Recommendation generation < 2s
   [ ] Page load < 1s
   [ ] Accept/Reject < 300ms
   [ ] History query < 500ms
   [ ] API response p95 < 1.2s
   ✓ PASS if all within budget

5. Accessibility
   [ ] WCAG AA compliance >= 90%
   [ ] Keyboard navigation works
   [ ] Screen reader works
   [ ] Mobile responsive
   [ ] Color contrast sufficient
   ✓ PASS if all verified

6. Security
   [ ] Authorization checks on all mutations
   [ ] No SQL injection vulnerabilities
   [ ] Rate limiting enforced
   [ ] Input validation complete
   [ ] Sensitive data not logged
   ✓ PASS if all verified

DECISION LOGIC:
IF (ontology ✓ AND coverage ✓ AND tests ✓ AND performance ✓
    AND accessibility ✓ AND security ✓)
  THEN approve → Advance to Cycle 71
  ELSE reject → Create fixes, re-test, re-gate

DECISION: [ ] ✅ APPROVED  [ ] ❌ REJECTED
```

**PHASE 4 DELIVERABLES:**
- ✅ Failure analysis (if any)
- ✅ Metrics dashboard
- ✅ Quality report thing (created)
- ✅ Test results documentation
- ✅ Lessons learned captured
- ✅ Quality gate decision (APPROVED/REJECTED)

---

## CONTINUOUS VALIDATION (Cycle 68-100)

### Task 5.1: Monitor Test Flakiness (weekly)
```
- [ ] Re-run all tests
- [ ] Track flaky tests
- [ ] Document flakiness rate (< 5% acceptable)
- [ ] Investigate high-flakiness tests
- [ ] Apply fixes
```

### Task 5.2: Track Coverage Trends (weekly)
```
- [ ] Record total coverage %
- [ ] Coverage by layer
- [ ] Coverage by ontology dimension
- [ ] Track growth (week over week)
- [ ] Detect regressions
```

### Task 5.3: Regression Testing (per release)
```
- [ ] Run full test suite before release
- [ ] Verify all tests still pass
- [ ] Check performance degradation
- [ ] Verify accessibility compliance
- [ ] Review code changes for test impact
```

---

## SUMMARY METRICS

**Total Effort:** 27.75 hours

| Cycle | Phase | Effort | Status |
|-------|-------|--------|--------|
| 65 | Planning | 9.5h | 🎯 NOW |
| 66 | Implementation | 8.0h | ⏹️ NEXT |
| 67 | Execution | 4.25h | ⏹️ AFTER_66 |
| 68-70 | Analysis | 6.0h | ⏹️ AFTER_67 |

**Test Breakdown:**
- Unit Tests: 15 (service layer)
- Integration Tests: 15 (API layer)
- E2E Tests: 10 (user journeys)
- **Total:** 40 tests

**Coverage Targets:**
- Overall: >= 80%
- Services: >= 90%
- Mutations: >= 85%
- Queries: >= 85%

**Success Criteria:**
- ✅ 40/40 tests PASS (100%)
- ✅ 80%+ code coverage
- ✅ Ontology 100% aligned
- ✅ All critical paths covered
- ✅ Performance targets met
- ✅ Accessibility >= 90%
- ✅ Quality gate: APPROVED

---

## FILES CREATED

1. `/Users/toc/Server/ONE/.claude/plans/todo-agent-quality.md` (56KB, 1647 lines)
   - Comprehensive quality testing plan
   - 4 phases, 20+ tasks, 50+ subtasks
   - Detailed acceptance criteria
   - All test specifications

2. `/Users/toc/Server/ONE/.claude/plans/QUALITY-AGENT-SUMMARY.md` (11KB, 334 lines)
   - Executive summary
   - Quick reference
   - Effort estimates
   - Success indicators

3. `/Users/toc/Server/ONE/.claude/plans/QUALITY-EXECUTION-CHECKLIST.md` (this file)
   - Detailed execution checklist
   - Task-by-task breakdown
   - Status tracking
   - Quick reference guide

---

**STATUS: READY FOR EXECUTION**

Begin with Cycle 65, Task 1.1: Load Ontology Context

All specifications complete. All deliverables defined. All success criteria clear.

**Ready to test the AI-powered recommendations feature comprehensively.**
