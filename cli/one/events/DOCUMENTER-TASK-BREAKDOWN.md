# Documenter Agent - Visual Task Breakdown

**Quick Reference for 30+ Documentation Tasks**
**Cycle Position:** 65-70
**Total Documentation Artifacts:** 13 files
**Total Knowledge Entries:** 50+

---

## Task Summary Table

| Phase | Cycle | Task | Artifact | Effort | Status |
|-------|-------|------|----------|--------|--------|
| **Phase 1** | **65** | **Test Specifications** | **3 files** | **3 hours** | ⬜ |
| | 65 | Task 1.1: Unit tests | unit-tests.md | 1.0h | ⬜ |
| | 65 | Task 1.2: Integration tests | integration-tests.md | 1.0h | ⬜ |
| | 65 | Task 1.3: E2E tests | e2e-tests.md | 1.0h | ⬜ |
| **Phase 2** | **66** | **Test Results** | **3 files** | **2.5 hours** | ⬜ |
| | 66 | Task 2.1: Coverage report | test-results-coverage-report.md | 1.0h | ⬜ |
| | 66 | Task 2.2: Performance report | test-results-performance-report.md | 0.75h | ⬜ |
| | 66 | Task 2.3: Test dashboard | test-results-dashboard.md | 0.75h | ⬜ |
| **Phase 3** | **67-68** | **Lessons & Practices** | **3 files** | **4 hours** | ⬜ |
| | 67 | Task 3.1: Lessons learned | lessons-learned.md | 1.5h | ⬜ |
| | 68 | Task 3.2: Best practices | best-practices.md | 1.5h | ⬜ |
| | 68 | Task 3.3: Patterns & antipatterns | patterns-antipatterns.md | 1.0h | ⬜ |
| **Phase 4** | **69** | **Architecture & Ontology** | **4 files** | **3.5 hours** | ⬜ |
| | 69 | Task 4.1: Test architecture | test-architecture.md | 1.0h | ⬜ |
| | 69 | Task 4.2: Ontology coverage | ontology-coverage-matrix.md | 1.0h | ⬜ |
| | 69 | Task 4.3: Troubleshooting | troubleshooting-guide.md | 1.5h | ⬜ |
| | 69 | Task 4.4: Knowledge summary | knowledge-summary.md | 0.5h | ⬜ |
| **Phase 5** | **70** | **Knowledge Finalization** | **Knowledge DB** | **2 hours** | ⬜ |
| | 70 | Task 5.1: Create embeddings | knowledge table (50+ entries) | 1.0h | ⬜ |
| | 70 | Task 5.2: Create links | thingKnowledge table (50+ links) | 0.5h | ⬜ |
| | 70 | Task 5.3: Quality verification | All phases verified | 0.5h | ⬜ |
| | | **TOTAL** | **13 files + 50+ KB** | **~15 hours** | |

---

## Cycle 65: Test Specifications (3 hours)

### Task 1.1: Unit Test Specifications (1 hour)

**Input:** Quality Agent's unit tests (Cycle 61-62)
**Output:** `/one/knowledge/testing/unit-tests.md`

```
Unit Test Specifications
├── Backend Unit Tests (5+ suites)
│   ├── Mutations (create, update, archive, restore)
│   ├── Queries (list, get, search)
│   └── Services (business logic)
├── Frontend Unit Tests (5+ suites)
│   ├── Components (rendering, props, events)
│   ├── Hooks (custom hooks logic)
│   └── Utils (helpers, formatters)
└── Knowledge Entries
    ├── 1 document entry (full text)
    └── 4-6 chunk entries (sections)
```

**Checklist:**
- [ ] Review Quality Agent's unit test code
- [ ] Document 10+ test cases with specs
- [ ] Include assertion counts
- [ ] Map to ontology dimensions
- [ ] Create 10 knowledge entries

**Success Criteria:**
- All 10+ unit tests documented
- Each has: What, Why, Inputs, Expected, Assertions
- Ontology mapping complete
- Knowledge entries with labels

---

### Task 1.2: Integration Test Specifications (1 hour)

**Input:** Quality Agent's integration tests (Cycle 63-64)
**Output:** `/one/knowledge/testing/integration-tests.md`

```
Integration Test Specifications
├── Backend-Database (5+ scenarios)
│   ├── Entity creation → Event logging
│   ├── Mutation → Query validation
│   └── Hierarchy navigation
├── Frontend-Backend (5+ scenarios)
│   ├── Form submit → API call → UI update
│   ├── Real-time sync via Convex
│   └── Error handling flows
└── Knowledge Entries
    ├── 1 document entry (full text)
    └── 4-6 chunk entries (scenarios)
```

**Checklist:**
- [ ] Review Quality Agent's integration tests
- [ ] Document 10+ scenarios with data flows
- [ ] Include ASCII diagrams
- [ ] Add failure scenarios (3+ per test)
- [ ] Create 10 knowledge entries

**Success Criteria:**
- All 10+ integration tests documented
- Data flows clearly shown
- Error paths documented
- Knowledge entries searchable

---

### Task 1.3: End-to-End Test Specifications (1 hour)

**Input:** Quality Agent's E2E tests (Cycle 65)
**Output:** `/one/knowledge/testing/e2e-tests.md`

```
E2E Test Specifications
├── Critical User Workflows (8+)
│   ├── Registration → Org creation → Invite users
│   ├── Create group → Configure → Deploy
│   ├── Purchase skill → Deploy agent
│   ├── E-commerce: Browse → Cart → Checkout → Payment
│   ├── API: Auth → Call endpoint → Get data
│   ├── Dashboard: View → Filter → Export analytics
│   ├── Search: Query → Filter → View results
│   └── Accessibility: Keyboard nav → Screen reader
└── Knowledge Entries
    ├── 1 document entry (full text)
    └── 8 chunk entries (1 per workflow)
```

**Checklist:**
- [ ] Review Quality Agent's E2E tests
- [ ] Document 8+ critical workflows step-by-step
- [ ] Include accessibility checks
- [ ] Add error paths (happy + 3+ edge cases)
- [ ] Create 10 knowledge entries

**Success Criteria:**
- All 8+ E2E workflows documented
- Step-by-step specs clear
- Error paths included
- Accessibility checks present

---

## Cycle 66: Test Results (2.5 hours)

### Task 2.1: Test Coverage Report (1 hour)

**Input:** Test metrics from Quality Agent
**Output:** `/one/events/test-results-coverage-report.md`

```
Coverage Report
├── By Layer
│   ├── Unit: [%] (target 80%)
│   ├── Integration: [%] (target 70%)
│   ├── E2E: [%] (target 90%)
│   └── Total: [%] (target 75%)
├── By Feature
│   ├── Groups: [%] [things] [connections] [events]
│   ├── Agents: [%]
│   ├── Skills: [%]
│   └── E-Commerce: [%]
├── By Ontology Dimension
│   ├── Things: [coverage by type]
│   ├── Connections: [coverage by type]
│   └── Events: [coverage by type]
└── Gap Analysis
    ├── Critical gaps
    └── Mitigation plans
```

**Checklist:**
- [ ] Aggregate all test coverage metrics
- [ ] Create layer breakdown table
- [ ] Create feature breakdown table
- [ ] Create ontology dimension table
- [ ] Identify coverage gaps
- [ ] Create 5 knowledge entries

**Success Criteria:**
- Coverage metrics complete
- Gaps identified and quantified
- Risk assessment included
- Knowledge entries created

---

### Task 2.2: Test Performance Report (0.75 hours)

**Input:** Test execution timing data
**Output:** `/one/events/test-results-performance-report.md`

```
Performance Report
├── Summary
│   ├── Unit tests: [timing] (target <5s)
│   ├── Integration: [timing] (target <10s)
│   ├── E2E: [timing] (target <30s)
│   └── Total: [timing] (target <50s)
├── Performance by Test
│   ├── Slowest 10 tests
│   └── Bottleneck analysis
├── Optimization Recommendations
│   ├── Priority 1: [issue] → [solution]
│   ├── Priority 2: [issue] → [solution]
│   └── Priority 3: [issue] → [solution]
└── Trend Tracking
    └── Last 5 runs trending
```

**Checklist:**
- [ ] Collect test execution timings
- [ ] Identify slow tests (>1s)
- [ ] Find bottlenecks (DB, async, mocks)
- [ ] Create recommendations
- [ ] Create 5 knowledge entries

**Success Criteria:**
- Performance metrics complete
- Bottlenecks identified
- Optimization plan clear
- Trends tracked

---

### Task 2.3: Test Results Dashboard (0.75 hours)

**Input:** Coverage, performance, and test results
**Output:** `/one/events/test-results-dashboard.md`

```
Visual Dashboard
├── Overall Health
│   ├── [████████░░] 95/100 tests passing
│   └── Coverage: [████████░░] 81%
├── Performance
│   ├── Suite duration: 60.5s ✅
│   └── Slowest: Integration (12.3s) ⚠️
├── Trend (5 recent runs)
│   └── Improving: 90% → 92% → 93% → 94% → 95%
├── Known Issues
│   ├── [Issue 1] - Priority: High
│   └── [Issue 2] - Priority: Medium
└── Status Summary
    └── ✅ READY FOR PRODUCTION
```

**Checklist:**
- [ ] Create ASCII progress bars
- [ ] Include coverage/performance metrics
- [ ] Show 5 recent trend data
- [ ] List known issues with priority
- [ ] Create 5 knowledge entries

**Success Criteria:**
- Dashboard is scannable (5s read)
- All metrics visible
- Trend shows improvement
- Status clear

---

## Cycle 67: Lessons Learned (1.5 hours)

### Task 3.1: Lessons Learned Documentation

**Input:** Test failures, debugging sessions, discoveries
**Output:** `/one/knowledge/testing/lessons-learned.md`

```
Lessons Learned (5+)
├── Lesson 1: [Title]
│   ├── Problem: [What went wrong]
│   ├── Root cause: [Why]
│   ├── Solution: [How fixed]
│   ├── Prevention: [How to avoid]
│   └── Impact: [Ontology dimension affected]
├── Lesson 2: [Title]
│   └── ... (same structure)
├── Lesson 3: ...
├── Lesson 4: ...
└── Lesson 5: ...
```

**Potential Lessons:**
- Test data setup patterns
- Mocking strategies
- Async test handling
- Performance testing pitfalls
- Edge cases found
- Accessibility testing
- E2E ordering
- Database cleanup
- Error handling
- Flaky test patterns

**Checklist:**
- [ ] Review test failures and fixes
- [ ] Extract 5+ concrete lessons
- [ ] Document: problem → solution → prevention
- [ ] Include code examples
- [ ] Create 8 knowledge entries

**Success Criteria:**
- 5+ lessons documented
- Problem-solution-prevention clear
- Code examples included
- Knowledge entries created

---

## Cycle 68: Best Practices (2.5 hours)

### Task 3.2: Best Practices Documentation (1.5 hours)

**Input:** Proven testing patterns, code reviews
**Output:** `/one/knowledge/testing/best-practices.md`

```
Best Practices (10+)
├── Practice 1: Arrange-Act-Assert
│   ├── Category: Unit/Integration/E2E
│   ├── When to use: [scenarios]
│   ├── When NOT to use: [scenarios]
│   ├── Example code
│   ├── Advantages: [3+]
│   ├── Disadvantages: [2+]
│   └── Common mistakes: [2+ with fixes]
├── Practice 2: Test Data Builders
│   └── ... (same structure)
├── Practice 3: Mock vs Spy vs Stub
├── Practice 4: Testing Async Code
├── Practice 5: Component Prop Testing
├── Practice 6: Error Boundary Testing
├── Practice 7: Database Transactions
├── Practice 8: Test Naming
├── Practice 9: Performance Assertions
└── Practice 10: Accessibility Testing
```

**Checklist:**
- [ ] Identify 10+ proven patterns
- [ ] Document each with examples
- [ ] Include when/when-not-to-use
- [ ] Add anti-patterns (what NOT to do)
- [ ] Create 10 knowledge entries

**Success Criteria:**
- 10+ practices documented
- Code examples clear
- Anti-patterns included
- Knowledge entries created

---

### Task 3.3: Patterns & Antipatterns (1 hour)

**Input:** Code patterns, testing mistakes
**Output:** `/one/knowledge/testing/patterns-antipatterns.md`

```
Patterns & Antipatterns
├── PATTERNS (5+)
│   ├── Pattern 1: Page Object Model
│   │   ├── Problem it solves
│   │   ├── Solution description
│   │   ├── Benefits: [3+]
│   │   ├── Example code
│   │   └── Reliability: ⭐⭐⭐⭐⭐
│   ├── Pattern 2: Test Pyramid
│   ├── Pattern 3: Given-When-Then
│   ├── Pattern 4: Test Fixtures
│   └── Pattern 5: Parameterized Testing
│
└── ANTIPATTERNS (5+)
    ├── Antipattern 1: Test Lottery
    │   ├── Why it's bad
    │   ├── Example (bad code)
    │   ├── Better approach
    │   ├── Impact: [issues]
    │   └── Risk Level: 🔴 High
    ├── Antipattern 2: Test Pollution
    ├── Antipattern 3: Assertion Roulette
    ├── Antipattern 4: Overmocking
    └── Antipattern 5: Slow Test Suite
```

**Checklist:**
- [ ] Document 5+ patterns with benefits
- [ ] Document 5+ antipatterns with risks
- [ ] Include code examples for each
- [ ] Show before/after for antipatterns
- [ ] Create 10 knowledge entries

**Success Criteria:**
- Patterns documented with examples
- Antipatterns shown with consequences
- Clear guidance on which to use
- Knowledge entries created

---

## Cycle 69: Architecture & Ontology (3.5 hours)

### Task 4.1: Test Architecture Documentation (1 hour)

**Input:** Test directory structure, framework setup
**Output:** `/one/knowledge/testing/test-architecture.md`

```
Test Architecture
├── Directory Structure
│   ├── test/unit/
│   │   ├── backend/ [mutations, queries, services]
│   │   └── frontend/ [components, hooks, utils]
│   ├── test/integration/
│   │   ├── backend-database/
│   │   ├── frontend-backend/
│   │   └── workflows/
│   ├── test/e2e/
│   │   ├── critical-paths/
│   │   └── user-journeys/
│   └── test/fixtures/
│       ├── data/
│       └── mocks/
├── Test Pyramid
│   ├── Unit (60%): Fast, isolated
│   ├── Integration (30%): Multiple layers
│   └── E2E (10%): Full workflows
├── Infrastructure
│   ├── Framework: Vitest
│   ├── Test Runner: Bun
│   ├── React Testing: @testing-library/react
│   └── Coverage: Vitest coverage
└── Ontology Alignment
    ├── Things tested: [list with coverage %]
    ├── Connections tested: [list]
    └── Events tested: [list]
```

**Checklist:**
- [ ] Document directory structure
- [ ] Draw test pyramid
- [ ] List all tools and frameworks
- [ ] Map test infrastructure to ontology
- [ ] Create 5 knowledge entries

**Success Criteria:**
- Architecture clear and visual
- Pyramid shows proportions
- Ontology alignment complete
- Knowledge entries created

---

### Task 4.2: Ontology Coverage Matrix (1 hour)

**Input:** Test coverage data
**Output:** `/one/knowledge/testing/ontology-coverage-matrix.md`

```
Ontology Coverage Matrix
├── THINGS Coverage
│   | Entity Type | Unit | Integration | E2E | Total | Status |
│   |-------------|------|-------------|-----|-------|--------|
│   | group       | 8    | 6           | 2   | 95%   | ✅     |
│   | agent       | 5    | 4           | 1   | 80%   | ✅     |
│   | skill       | 6    | 3           | 0   | 60%   | ⚠️     |
│   | ...         | ...  | ...         | ... | ...   | ...    |
│
├── CONNECTIONS Coverage
│   | Connection  | Unit | Integration | E2E | Total | Status |
│   |-------------|------|-------------|-----|-------|--------|
│   | owns        | 3    | 2           | 1   | 90%   | ✅     |
│   | created_by  | 2    | 1           | 0   | 70%   | ✅     |
│   | ...         | ...  | ...         | ... | ...   | ...    |
│
├── EVENTS Coverage
│   | Event Type  | Unit | Integration | E2E | Total | Status |
│   |-------------|------|-------------|-----|-------|--------|
│   | created     | 5    | 4           | 2   | 95%   | ✅     |
│   | updated     | 4    | 3           | 1   | 85%   | ✅     |
│   | ...         | ...  | ...         | ... | ...   | ...    |
│
└── Gap Analysis
    ├── Critical Gap 1: skill (60% → target 80%)
    └── Medium Gap 2: entity_deleted (60% → target 80%)
```

**Checklist:**
- [ ] Count unit tests per entity/connection/event
- [ ] Count integration tests
- [ ] Count E2E tests
- [ ] Calculate coverage %
- [ ] Identify gaps (<80% coverage)
- [ ] Create 5 knowledge entries

**Success Criteria:**
- All dimensions covered
- Coverage % calculated
- Gaps identified
- Status clear for each

---

### Task 4.3: Troubleshooting Guide (1.5 hours)

**Input:** Common test failures, debugging patterns
**Output:** `/one/knowledge/testing/troubleshooting-guide.md`

```
Troubleshooting Guide (10+ Failures)
├── Failure 1: "Timeout waiting for async"
│   ├── Symptoms: [description]
│   ├── Root causes: [3+]
│   ├── Debugging steps: [5+]
│   ├── Fix example: [code]
│   └── Prevention: [strategies]
├── Failure 2: "Cannot find module"
│   └── ... (same structure)
├── Failure 3: "Assertion failed"
├── Failure 4: "Flaky test"
├── Failure 5: "Component not rendering"
├── Failure 6: "Mock not working"
├── Failure 7: "Database state leak"
├── Failure 8: "Race condition"
├── Failure 9: "Import error"
└── Failure 10: "Timeout exceeded"
```

**Checklist:**
- [ ] List 10+ common test failures
- [ ] For each: symptoms → root causes → fixes
- [ ] Include debugging steps
- [ ] Add code examples
- [ ] Create 10 knowledge entries

**Success Criteria:**
- 10+ failures documented
- Clear debugging paths
- Fix examples included
- Prevention strategies

---

### Task 4.4: Knowledge Summary (0.5 hours)

**Input:** All previous documentation
**Output:** `/one/knowledge/testing/knowledge-summary.md`

```
Knowledge Summary
├── Overview
│   ├── 13 documentation files created
│   ├── 50+ knowledge entries created
│   ├── 100+ test specifications
│   ├── Lessons & practices documented
│   └── Ontology coverage: 100%
├── Quick Navigation
│   ├── By type: Specs, Results, Lessons, Practices, Troubleshooting
│   ├── By technology: Vitest, React Testing, Convex
│   ├── By test type: Unit, Integration, E2E
│   └── By feature: Groups, Agents, Skills, E-commerce
├── Coverage Summary
│   ├── Things: [X]/[Y] ([%])
│   ├── Connections: [X]/[Y] ([%])
│   └── Events: [X]/[Y] ([%])
├── Key Learnings: [5 top lessons]
├── Best Practices: [5 top practices]
└── How Agents Use This
    ├── For test writing
    ├── For problem solving
    └── For code review
```

**Checklist:**
- [ ] Aggregate metrics from all docs
- [ ] Create navigation sections
- [ ] Include coverage report
- [ ] List key learnings
- [ ] Create 3 knowledge entries

**Success Criteria:**
- Summary comprehensive
- Navigation clear
- All sections complete

---

## Cycle 70: Finalization (2 hours)

### Task 5.1: Create Knowledge Entries with Embeddings (1 hour)

**Process:**
1. Break each documentation file into 200-500 token chunks
2. For 50+ chunks, generate embeddings using text-embedding-3-large
3. Add comprehensive labels (5-8 per entry)
4. Store in Convex `knowledge` table

**Example Entry:**
```json
{
  "knowledgeType": "chunk",
  "text": "[200-500 token chunk from documentation]",
  "embedding": [3072 dimensions],
  "labels": [
    "feature:testing",
    "technology:vitest",
    "skill:test_writing",
    "pattern:unit_testing",
    "documentation_type:specification",
    "cycle:65",
    "topic:test_documentation"
  ],
  "metadata": {
    "documentPath": "/one/knowledge/testing/[file].md",
    "sectionTitle": "[Section]",
    "testType": "unit|integration|e2e",
    "version": "1.0.0",
    "status": "complete"
  }
}
```

**Checklist:**
- [ ] Create 50+ knowledge entries
- [ ] Generate embeddings (text-embedding-3-large)
- [ ] Add 5-8 labels per entry
- [ ] Verify chunk size (200-500 tokens)
- [ ] Include 50 token overlap

**Success Criteria:**
- 50+ entries created
- All have embeddings
- Labels comprehensive
- Chunks properly sized

---

### Task 5.2: Create ThingKnowledge Links (0.5 hours)

**Process:**
1. Link each knowledge entry to testing feature
2. Create junction table entries in `thingKnowledge`
3. Role: specification, results, lessons, practice, troubleshooting

**Example Link:**
```json
{
  "thingId": "[testing_feature_id]",
  "knowledgeId": "[knowledge_entry_id]",
  "role": "specification",
  "metadata": {
    "section": "Unit Tests",
    "importance": "high",
    "lastUsed": null
  }
}
```

**Checklist:**
- [ ] Create 50+ thingKnowledge entries
- [ ] Link by role (specification, results, etc.)
- [ ] Assign importance levels
- [ ] Enable graph traversal

**Success Criteria:**
- All 50+ entries linked
- Roles correct
- Graph traversal works

---

### Task 5.3: Quality Verification (0.5 hours)

**Verification Checklist:**
- [ ] All 13 documentation files created
- [ ] All 50+ knowledge entries created
- [ ] All embeddings generated
- [ ] All labels consistent
- [ ] All links established
- [ ] 8/8 test search queries pass
- [ ] Ontology coverage 100%
- [ ] File locations correct
- [ ] Links working
- [ ] README updated

**Success Criteria:**
- All items checked ✅
- Quality gates: 100% pass
- Ready for next phase

---

## Documentation Files Timeline

```
Cycle 65:  unit-tests.md                    ✓ Test Specs Phase 1/3
           integration-tests.md             ✓ Test Specs Phase 2/3
           e2e-tests.md                     ✓ Test Specs Phase 3/3
           [30 knowledge entries]

Cycle 66:  test-results-coverage-report.md  ✓ Test Results Phase 1/3
           test-results-performance-report  ✓ Test Results Phase 2/3
           test-results-dashboard.md        ✓ Test Results Phase 3/3
           [15 knowledge entries]

Cycle 67:  lessons-learned.md               ✓ Lessons & Practices 1/3
           [8 knowledge entries]

Cycle 68:  best-practices.md                ✓ Lessons & Practices 2/3
           patterns-antipatterns.md         ✓ Lessons & Practices 3/3
           [17 knowledge entries]

Cycle 69:  test-architecture.md             ✓ Arch & Ontology 1/4
           ontology-coverage-matrix.md      ✓ Arch & Ontology 2/4
           troubleshooting-guide.md         ✓ Arch & Ontology 3/4
           knowledge-summary.md             ✓ Arch & Ontology 4/4
           [15 knowledge entries]

Cycle 70:  [50+ knowledge entries + embeddings]
           [50+ thingKnowledge links]
           [Quality verification]
           ✅ COMPLETE - READY FOR PRODUCTION
```

---

## Effort Estimation

| Phase | Duration | File Count | KB Entries |
|-------|----------|-----------|-----------|
| Phase 1 (65) | 3 hours | 3 | 30 |
| Phase 2 (66) | 2.5 hours | 3 | 15 |
| Phase 3 (67-68) | 3 hours | 3 | 25 |
| Phase 4 (69) | 3.5 hours | 4 | 15 |
| Phase 5 (70) | 2 hours | 0 | 50 |
| **TOTAL** | **~14 hours** | **13 files** | **50+ entries** |

---

## Success Metrics

### Documentation
- ✅ 13 files created (100%)
- ✅ 1,500+ lines written
- ✅ 30+ code examples
- ✅ 10+ diagrams/tables

### Knowledge Dimension
- ✅ 50+ entries created
- ✅ 50+ embeddings generated
- ✅ 50+ thingKnowledge links
- ✅ 5-8 labels per entry (avg)
- ✅ 8/8 search queries pass (100%)

### Coverage
- ✅ All ontology dimensions covered
- ✅ 100% of test types documented
- ✅ 100% of features documented
- ✅ 100% quality gates passed

---

## Quick Links

| Resource | Location |
|----------|----------|
| Full TODO | `.claude/plans/todo-agent-documenter.md` |
| Execution Guide | `.claude/plans/DOCUMENTER-EXECUTION-GUIDE.md` |
| Task Breakdown | `.claude/plans/DOCUMENTER-TASK-BREAKDOWN.md` (this file) |

---

**Status:** ✅ READY FOR EXECUTION
**Start Date:** 2025-10-30
**Cycle:** 65-70 (concurrent with Quality Agent)
**Duration:** ~14 hours of documented work

**Let's document the tests!**
