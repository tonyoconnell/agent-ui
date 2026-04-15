# Agent Problem Solver TODO List - Test Failure Analysis (Cycle 65-70)

**Version:** 2.0.0 (Ontology-Aligned)
**Agent Type:** Problem-Solving Specialist
**Context Budget:** 2,500 tokens (Ultrathink Mode)
**Workflow Stage:** Stage 6 (Quality Loop)
**Cycles Covered:** 65-70 (E2E Testing & Failure Analysis)

---

## Mission Statement

As the Problem Solver Agent, your mission is to **detect test failures in real-time**, perform **deep root cause analysis using ultrathink mode**, propose **specific, actionable fixes**, and ensure every failure becomes a **validated lesson learned** in the knowledge base.

Your success metric: **70% faster failure recovery** (10 minutes to solution vs 24+ hours) through parallel monitoring, rapid analysis, and pattern detection.

---

## Architecture Overview

### Continuous Failure Monitoring (Parallel)

```
Quality Agent (writes tests)
        ↓
    [Tests Run]
        ↓
    [FAIL] ← Problem Solver monitors for test_failed events
        ↓
  Ultrathink Analysis (10-minute SLA)
        ↓
  Solution Proposed → Specialist fixes
        ↓
  Lesson Captured (knowledge base)
        ↓
  Quality Re-validates
```

**Key Insight:** You monitor ALL agents simultaneously. When any agent emits a `test_failed` event, you immediately begin analysis. Your goal is proposing a solution within 10 minutes—while the team is still in context.

### Root Cause Analysis Framework (6-Dimension Ontology)

Every failure maps to one of these dimensions:

1. **Groups Dimension** - Data isolation, multi-tenancy, scoping issues
2. **People Dimension** - Authorization failures, role mismatches, access control
3. **Things Dimension** - Entity creation, schema violations, property validation
4. **Connections Dimension** - Relationship integrity, bidirectional consistency
5. **Events Dimension** - Audit trail gaps, event logging failures, ordering issues
6. **Knowledge Dimension** - Embedding failures, search mismatches, semantic issues

---

## Phase 1: Failure Detection & Collection (Tasks 1.1-1.5)

### Task 1.1: Initialize Failure Monitoring System

**Objective:** Set up real-time monitoring for test failure events

- [ ] Create failure monitoring entrypoint: `/backend/convex/services/failure-monitor.ts`
- [ ] Implement event listener for `test_failed` events from quality agent
- [ ] Setup event listener for `test_failed` events from frontend agent
- [ ] Setup event listener for `test_failed` events from backend agent
- [ ] Create failure collection table in memory (max 100 failures)
- [ ] Implement auto-cleanup of resolved failures (keep 30-day history)
- [ ] Add severity classification (critical, high, medium, low)
- [ ] Add component categorization (frontend, backend, integration, auth, ontology)
- [ ] Log monitoring startup in `problem_monitoring_started` event
- [ ] Create failure tracking dashboard schema

**Acceptance Criteria:**
- All test failures captured within 1 second of event emission
- Severity levels assigned automatically based on error patterns
- Failure collection service running continuously

**Files to Create/Modify:**
- Create `/backend/convex/services/failure-monitor.ts`
- Create `/backend/convex/mutations/failure-tracking.ts`
- Create `/backend/convex/queries/failure-queries.ts`

---

### Task 1.2: Create Failure Categorization System

**Objective:** Classify failures for targeted analysis

- [ ] Create failure type enum with 12+ categories:
  - Schema validation errors
  - Authorization/permission failures
  - Data isolation violations (multi-tenancy)
  - Event logging gaps
  - Race conditions/timing issues
  - Hydration mismatches (frontend)
  - API response format errors
  - Database transaction failures
  - Service initialization failures
  - Configuration/environment errors
  - Performance/timeout failures
  - Flaky/intermittent failures

- [ ] Implement pattern matching for auto-categorization
- [ ] Create confidence scoring (0-100%) for category assignment
- [ ] Add support for multi-category failures (up to 3)
- [ ] Build category → resolution template mapping
- [ ] Create failure template system for known patterns
- [ ] Implement pattern recognition based on error message regex
- [ ] Add component mapping (auth, groups, things, connections, events, knowledge)
- [ ] Create priority scoring based on component + severity

**Acceptance Criteria:**
- 95%+ accuracy in automatic categorization (validate with first 50 failures)
- Each category has 3-5 resolution templates
- Priority scoring correlates with actual urgency

**Files to Create/Modify:**
- Create `/backend/convex/services/failure-categorizer.ts`
- Create `types/failure-types.ts` with enum and interfaces

---

### Task 1.3: Implement Failure Impact Analysis

**Objective:** Understand scope and blast radius of failures

- [ ] Analyze affected features (query feature graph)
- [ ] Identify dependent services (query connections dimension)
- [ ] Count affected user groups (query groups dimension)
- [ ] Trace through event history (last 100 events)
- [ ] Identify test cascade effects (other tests that might fail due to this)
- [ ] Determine if flaky (analyze same test failure history)
- [ ] Check for related failures (same component, same time window)
- [ ] Assess data isolation impact (multi-tenant implications)
- [ ] Calculate estimated time to customer impact
- [ ] Determine escalation level (internal, customer-facing, critical)

**Acceptance Criteria:**
- Impact analysis completes in < 2 seconds
- Blast radius visualization shows all affected entities
- Escalation level automatically determined

**Files to Create/Modify:**
- Create `/backend/convex/services/failure-impact-analyzer.ts`

---

### Task 1.4: Setup Test Failure Event Pipeline

**Objective:** Create event-driven flow for failure detection

- [ ] Implement `test_failed` event handler with context preservation
- [ ] Create event enrichment (add metadata, timestamps, actor info)
- [ ] Setup parallel event monitoring for all agents:
  - `test_failed` from agent-quality
  - `test_failed` from agent-frontend
  - `test_failed` from agent-backend
  - `implementation_complete` for pre-emptive analysis
  - `quality_check_complete` for validation

- [ ] Implement event batching (aggregate 5-10 failures for pattern analysis)
- [ ] Create event ordering system (handle async failures)
- [ ] Add event idempotency (prevent duplicate analysis)
- [ ] Setup event persistence (30-day retention)
- [ ] Create event querying interface (by component, time, severity, actor)
- [ ] Implement event replay for testing

**Acceptance Criteria:**
- No lost events (guaranteed delivery to analysis)
- Batch analysis triggers every 10 seconds or at 10 failures
- Event timestamps accurate to millisecond

**Files to Create/Modify:**
- Create `/backend/convex/services/failure-event-pipeline.ts`
- Create `/backend/convex/events/failure-events.ts`

---

### Task 1.5: Create Failure Triage Queue

**Objective:** Prioritize failures for analysis

- [ ] Implement priority queue (ordered by severity + impact)
- [ ] Create SLA tracking:
  - Critical: Analyze within 2 minutes
  - High: Analyze within 5 minutes
  - Medium: Analyze within 10 minutes
  - Low: Batch analyze hourly

- [ ] Implement failure deduplication:
  - Same error in same component within 30 seconds = same issue
  - Group into "failure clusters"
  - Analyze one, apply to cluster

- [ ] Create assignment logic (match to most experienced specialist)
- [ ] Add context preservation (keep analysis context < 3k tokens)
- [ ] Implement queue monitoring dashboard
- [ ] Setup alerts for SLA breaches
- [ ] Create triage metrics (queue depth, wait time, analysis time)
- [ ] Implement automatic escalation for SLA overages

**Acceptance Criteria:**
- Triage queue operational and processing failures
- SLA compliance > 95%
- Failure clustering reduces analysis load by 60%

**Files to Create/Modify:**
- Create `/backend/convex/services/failure-triage-queue.ts`
- Create `/backend/convex/queries/triage-status.ts`

---

## Phase 2: Root Cause Investigation (Tasks 2.1-2.6)

### Task 2.1: Deep Ontology-Aligned Root Cause Analysis

**Objective:** Identify root cause using 6-dimension framework

Analysis workflow for each failure:

**Step 1: Map to Ontology (2 minutes)**
- Which dimension is affected? (groups/people/things/connections/events/knowledge)
- What entity/relationship is involved?
- Is it a schema alignment issue?
- Is it an isolation/scoping issue?

**Step 2: Search Knowledge Base (1 minute)**
```typescript
// Vector similarity search + label search
const similarIssues = await searchKnowledge({
  errorEmbedding: generateEmbedding(errorMessage),
  labels: ['topic:' + issueType, 'status:failed'],
  similarityThreshold: 0.8
})
```

**Step 3: Analyze Failure Context (3 minutes)**
- What was the test expecting?
- What actually happened?
- What's the diff?
- When did this last pass? (regression analysis)

**Step 4: Identify Root Pattern (2 minutes)**
- Logic error in code?
- Missing validation?
- Wrong pattern applied?
- Configuration issue?
- Race condition?
- Data isolation problem?

**Step 5: Validate Hypothesis (1 minute)**
- Check git history for recent changes
- Query event log for state transitions
- Trace through code path

- [ ] Create ontology-aligned analysis framework
- [ ] Implement 6-dimension questionnaire for analysis
- [ ] Create analysis template per failure category
- [ ] Build code flow visualization tool
- [ ] Implement hypothesis validation logic
- [ ] Create root cause taxonomy (30+ patterns)
- [ ] Setup analysis logging with decision tree
- [ ] Create analysis summary template
- [ ] Implement confidence scoring for root causes
- [ ] Add escalation criteria (unsure hypothesis → manual review)

**Acceptance Criteria:**
- Root cause identified with > 80% confidence for 90%+ of failures
- Analysis completes within 10-minute SLA
- All analyses map to 6-dimension ontology

**Files to Create/Modify:**
- Create `/backend/convex/services/root-cause-analyzer.ts`
- Create `/backend/convex/services/ontology-validator.ts`
- Create `/backend/convex/services/code-flow-analyzer.ts`

---

### Task 2.2: Implement Knowledge Base Search (Vector + Label)

**Objective:** Leverage lessons learned to avoid duplicate analysis

- [ ] Create vector embedding generation for error messages
- [ ] Implement vector similarity search (cosine distance)
- [ ] Create label-based search (knowledgeType taxonomy)
- [ ] Build combined search (vectors + labels + recency)
- [ ] Implement search result ranking (similarity score + validation date)
- [ ] Create fallback search (partial matching for new error formats)
- [ ] Add search caching (1-hour TTL)
- [ ] Implement search analytics (track misses for knowledge gaps)
- [ ] Create search UI/querying interface
- [ ] Setup search quality monitoring

**Acceptance Criteria:**
- 80%+ of failures find similar lesson in knowledge base
- Search completes in < 500ms
- Top result is relevant for 85%+ of queries

**Files to Create/Modify:**
- Create `/backend/convex/services/knowledge-search.ts`
- Create `/backend/convex/queries/search-similar-lessons.ts`

---

### Task 2.3: Implement Flaky Test Detection

**Objective:** Identify intermittent failures (timing issues, race conditions)

- [ ] Track failure frequency per test (keep 30-day history)
- [ ] Define flakiness metrics:
  - Pass rate threshold: < 95% = flaky
  - Failure pattern: non-deterministic = flaky
  - Time sensitivity: fails on slow/fast runs = flaky

- [ ] Create flaky test report (show patterns, timing windows)
- [ ] Implement environment dependency detection
  - Database load variations
  - Network latency
  - Execution order sensitivity
  - Async timing issues

- [ ] Build flaky test prioritization (fix before other failures)
- [ ] Create flaky test isolation (don't run in parallel)
- [ ] Implement test retry logic (3 retries for flaky)
- [ ] Create flaky test dashboard
- [ ] Setup alerts for new flaky tests

**Acceptance Criteria:**
- Flaky tests automatically detected within 3 occurrences
- 90%+ accuracy in flakiness diagnosis
- Flaky tests isolated and re-run separately

**Files to Create/Modify:**
- Create `/backend/convex/services/flaky-test-detector.ts`
- Create `/backend/convex/queries/flaky-test-report.ts`

---

### Task 2.4: Create Debug Logging & Instrumentation

**Objective:** Add diagnostic information for harder-to-debug failures

- [ ] Implement structured logging throughout failure path:
  - Entry/exit of test
  - State transitions
  - Database operations
  - Service calls
  - Assertion failures

- [ ] Create logging levels:
  - ERROR: Assertion failures, exceptions
  - WARN: Timeouts, retries, fallbacks
  - INFO: Test flow, decisions
  - DEBUG: Detailed state, variables

- [ ] Add context preservation in logs:
  - Test name and path
  - Actor/user context
  - Group/organization context
  - Timestamp and duration

- [ ] Implement log aggregation (collect all logs for failed test)
- [ ] Create log visualization (timeline of events)
- [ ] Setup log search (by component, time, pattern)
- [ ] Add log retention (30 days for failed tests, 7 days for passed)
- [ ] Implement log anonymization (remove sensitive data)
- [ ] Create logging middleware for test execution

**Acceptance Criteria:**
- All failures include complete debug logs
- Logs collected within 1 second of failure
- Debug logs reduce analysis time by 50%

**Files to Create/Modify:**
- Create `/backend/convex/services/debug-logger.ts`
- Create `/web/src/lib/test-logger.ts`
- Create `/backend/test/utils/test-logging.ts`

---

### Task 2.5: Implement Concurrency & Race Condition Detection

**Objective:** Identify timing-dependent failures

- [ ] Trace concurrent operation execution:
  - Database transactions
  - API calls
  - State mutations
  - Event emissions

- [ ] Detect race conditions:
  - Operations on same entity in rapid succession
  - Event ordering violations
  - Stale state assumptions
  - Lock contention

- [ ] Create execution timeline visualization
- [ ] Implement happens-before relationship analysis
- [ ] Build transaction isolation level verification
- [ ] Create test execution with random delays (detect races)
- [ ] Implement stress testing (run test 100x to expose races)
- [ ] Setup race condition report generation

**Acceptance Criteria:**
- 95%+ of concurrency failures identified
- Race condition test suite automatically created
- Timeline visualization reveals execution order

**Files to Create/Modify:**
- Create `/backend/convex/services/concurrency-analyzer.ts`
- Create `/backend/test/utils/stress-test.ts`

---

### Task 2.6: Build Data Isolation Validator (Multi-Tenancy)

**Objective:** Detect groupId scoping and isolation violations

Validation checks:

- [ ] Verify all database queries include groupId filter
- [ ] Check connections respect group boundaries
- [ ] Validate events scoped to correct group
- [ ] Ensure knowledge scoped to group
- [ ] Verify no data leakage between groups
- [ ] Check parent-child group access rules
- [ ] Validate person permissions in group context
- [ ] Test cross-group operation rejection
- [ ] Create isolation violation report
- [ ] Setup continuous isolation monitoring

**Acceptance Criteria:**
- 100% of queries include groupId scoping
- No data leakage detected across test runs
- Isolation violations caught immediately

**Files to Create/Modify:**
- Create `/backend/convex/services/data-isolation-validator.ts`
- Create `/backend/test/fixtures/multi-tenant-test-data.ts`

---

## Phase 3: Solution Proposal & Implementation (Tasks 3.1-3.4)

### Task 3.1: Create Specific Solution Proposal Generator

**Objective:** Generate minimal, targeted fixes with ontology operations

Solution proposal includes:

```typescript
interface SolutionProposal {
  failureId: string
  rootCause: string                    // Why it failed
  ontologyDimension: string            // Which dimension affected
  proposedFix: {
    description: string                // What to change
    code: string                        // Exact code change
    filePath: string                    // Where to change
    lineNumbers: [number, number]       // Lines affected
    riskLevel: 'low' | 'medium' | 'high'
  }
  ontologyOperations: {
    things?: string[]                  // Entity changes
    connections?: string[]             // Relationship changes
    events?: string[]                  // Event logging additions
    knowledge?: string[]               // Knowledge base updates
  }
  testToAdd?: string                   // New test case to prevent regression
  estimatedFixTime: number             // Minutes to implement
  confidence: number                   // 0-100% confidence in solution
  knowledgePath?: string               // Reference to similar solution
}
```

- [ ] Implement solution template matching (match to known patterns)
- [ ] Create code fix generator (AST-based for precision)
- [ ] Build ontology operation mapper (what to change in 6 dimensions)
- [ ] Create test regression preventer (generate test case)
- [ ] Implement risk assessment (small changes = lower risk)
- [ ] Build confidence scoring:
  - Found exact match in knowledge: 95%
  - Found similar issue: 80%
  - Inferred from pattern: 60%
  - First occurrence: 40%

- [ ] Create solution review checklist
- [ ] Implement solution validation (check syntax, types)
- [ ] Build fallback solution generator (when confidence < 50%)

**Acceptance Criteria:**
- All solutions include exact code changes
- Solutions map to specific ontology operations
- Confidence scoring accurate (high confidence = 90%+ success rate)

**Files to Create/Modify:**
- Create `/backend/convex/services/solution-proposal-generator.ts`
- Create `/backend/convex/services/code-fix-generator.ts`
- Create `types/solution-types.ts`

---

### Task 3.2: Implement Specialist Assignment & Delegation

**Objective:** Route fixes to most qualified specialist

Assignment logic:

- [ ] Query specialist availability:
  - agent-backend: Backend/service/schema fixes
  - agent-frontend: Component/page/interaction fixes
  - agent-quality: Test/assertion/coverage fixes
  - agent-documenter: Documentation gaps

- [ ] Match expertise to problem:
  - Auth failures → Backend specialist (auth expert)
  - UI failures → Frontend specialist (component expert)
  - Performance → Quality specialist (perf expert)
  - Data failures → Backend specialist (schema expert)

- [ ] Consider specialist workload (balance load)
- [ ] Track specialist success rates (assign to best performer)
- [ ] Create assignment metadata:
  - Priority and SLA
  - Expected fix time
  - Success probability
  - Escalation contact

- [ ] Emit `solution_proposed` event with full context
- [ ] Create assignment tracking dashboard
- [ ] Implement assignment timeout (auto-escalate if not started)
- [ ] Setup communication channel (@ mention in chat/issue)

**Acceptance Criteria:**
- Correct specialist assigned 95%+ of time
- Assignment happens within 1 minute of analysis
- Specialist receives full context needed for fix

**Files to Create/Modify:**
- Create `/backend/convex/services/specialist-assignment.ts`
- Create `/backend/convex/mutations/assign-fix.ts`

---

### Task 3.3: Create Solution Verification & Validation

**Objective:** Ensure proposed fixes actually work

Verification steps:

- [ ] Syntax validation (check code is valid TypeScript/TSX)
- [ ] Type checking (verify types match schema)
- [ ] Schema validation (check against 6-dimension ontology)
- [ ] Dependency validation (ensure imports exist)
- [ ] Logic validation (check for obvious issues)
- [ ] Test validation (run proposed fix through test)
- [ ] Regression validation (ensure fix doesn't break other tests)
- [ ] Performance validation (check for performance regressions)
- [ ] Security validation (check for security issues)

- [ ] Create validation report (pass/fail with details)
- [ ] Implement multi-level validation:
  - Level 1 (quick): Syntax, types, schema - 1 second
  - Level 2 (deep): Logic, dependencies, imports - 5 seconds
  - Level 3 (full): Test execution, regression, performance - 30 seconds

- [ ] Build confidence adjustment based on validation
- [ ] Create validation failure handling (demote confidence, flag for review)

**Acceptance Criteria:**
- All proposed fixes pass Level 1 validation
- 95%+ pass Level 2 validation
- 90%+ pass Level 3 validation

**Files to Create/Modify:**
- Create `/backend/convex/services/solution-validator.ts`

---

### Task 3.4: Implement Error Message Improvement

**Objective:** Make error messages clearer and more actionable

For each error type, create improved message that includes:

- [ ] What went wrong (clear problem statement)
- [ ] Why it went wrong (root cause explanation)
- [ ] What to do about it (actionable steps)
- [ ] Where to find help (link to knowledge base)
- [ ] Code example (show expected vs actual)

Example improvement:

```
BEFORE:
"Assertion error at line 42"

AFTER:
"TEST FAILED: Group isolation violation

Expected: User from Group A cannot see data from Group B
Actual: Query returned data from Group B

Root Cause: groupId filter missing from query
Location: backend/convex/queries/things.ts:15

Solution: Add .withIndex('by_groupId', q => q.eq('groupId', args.groupId))

Learn more: /knowledge/multi-tenant-patterns#isolation
Code example: https://knowledge-base/lessons/group-isolation-fix"
```

- [ ] Create error message templates (12+ failure categories)
- [ ] Implement template variable substitution
- [ ] Build knowledge link generation
- [ ] Create code example extraction from solutions
- [ ] Implement error message localization hooks
- [ ] Setup error message testing (ensure helpful)
- [ ] Add error message versioning (improve over time)

**Acceptance Criteria:**
- All errors include problem, root cause, and solution
- 95%+ of developers find error message helpful
- Average fix time reduced by 40% with improved messages

**Files to Create/Modify:**
- Create `/backend/convex/services/error-message-improver.ts`
- Create `types/error-messages.ts`

---

## Phase 4: Lesson Capture & Prevention (Tasks 4.1-4.4)

### Task 4.1: Implement Lesson Learning System

**Objective:** Convert every failure → validated lesson

Lesson structure:

```typescript
interface Lesson {
  type: 'lesson',
  name: string                        // e.g., "Group Isolation Pattern"
  category: string                    // e.g., "multi-tenancy"
  problemType: string                 // e.g., "data-leakage"

  problem: {
    description: string
    symptoms: string[]
    rootCauses: string[]
  }

  solution: {
    explanation: string
    codeExample: string
    filePath: string
    pattern: string                   // Reference pattern name
  }

  prevention: {
    checklist: string[]               // Pre-commit checks
    tests: string[]                   // Test cases to add
    patterns: string[]                // Patterns to follow
  }

  metadata: {
    severity: 'critical' | 'high' | 'medium' | 'low'
    occurrences: number               // How many times seen
    occurrenceFrequency: string       // 'daily' | 'weekly' | 'monthly'
    firstSeen: timestamp
    lastSeen: timestamp
    component: string                 // frontend | backend | integration
    resolvedBy: string               // Specialist name
  }
}
```

- [ ] Create lesson capture trigger (when fix_complete event emitted)
- [ ] Extract lesson from failure + solution
- [ ] Generate problem description from root cause analysis
- [ ] Generate solution code examples
- [ ] Create prevention checklist from lesson
- [ ] Setup lesson validation (ensure completeness)
- [ ] Implement lesson versioning (lesson improves over time)
- [ ] Create lesson linking (connect related lessons)
- [ ] Setup lesson publishing (make searchable)

**Acceptance Criteria:**
- Lesson captured within 5 minutes of fix completion
- All lessons have complete problem, solution, prevention
- Lessons published to knowledge base automatically

**Files to Create/Modify:**
- Create `/backend/convex/services/lesson-learner.ts`
- Create `/backend/convex/mutations/capture-lesson.ts`
- Create `types/lesson-types.ts`

---

### Task 4.2: Create Knowledge Base Integration

**Objective:** Store lessons for semantic search + pattern matching

Integration with knowledge dimension:

- [ ] Generate embeddings for lesson content
- [ ] Create knowledge chunk per lesson (lesson + code example + prevention)
- [ ] Store embedding vector (1536-dim for text-embedding-3-large)
- [ ] Add semantic labels:
  - `skill:testing`, `skill:debugging`, `skill:ontology`
  - `topic:auth`, `topic:performance`, `topic:multi-tenancy`
  - `component:backend`, `component:frontend`, `component:integration`
  - `status:validated`, `status:promoted` (3+ occurrences)
  - `severity:critical`, `severity:high`, etc.

- [ ] Link lesson to feature via connections table
- [ ] Create `learned_from` relationship (feature → lesson)
- [ ] Setup lesson search (vector + label-based)
- [ ] Implement lesson recommendation (show similar lessons)
- [ ] Create lesson analytics (track usage, effectiveness)
- [ ] Setup lesson feedback loop (improve based on usage)

**Acceptance Criteria:**
- All lessons embedded and searchable
- Vector similarity search finds relevant lessons 85%+ of time
- Knowledge base grows by 5-10 lessons per sprint

**Files to Create/Modify:**
- Create `/backend/convex/mutations/add-to-knowledge.ts`
- Create `/backend/convex/services/embedding-generator.ts`

---

### Task 4.3: Implement Pattern Promotion System

**Objective:** Convert recurring failures → official patterns

When a failure type occurs 3+ times:

- [ ] Aggregate lessons from all occurrences
- [ ] Identify common root causes
- [ ] Extract universal solution pattern
- [ ] Create pattern documentation
- [ ] Add pattern to prevention system
- [ ] Promote to "known pattern" status
- [ ] Add to pattern library (developers can reference)
- [ ] Emit `pattern_promoted` event
- [ ] Update knowledge base with pattern
- [ ] Log promotion in lessons_learned

Example pattern promotion:

```
RECURRING ISSUE: "Group isolation missing in queries"
OCCURRENCES: 5 times in 2 weeks
PROMOTED TO PATTERN: "Group-Scoped Query Pattern"

Pattern:
All queries must include: .withIndex('by_groupId', q => q.eq('groupId', args.groupId))

Checklist:
- [ ] Query has groupId filter
- [ ] Filter uses index for performance
- [ ] Error handling for missing group
- [ ] Audit log created for access

Prevention:
- Template for all query creators
- Pre-commit check to detect missing filters
- Integration test for isolation
```

- [ ] Create pattern promotion logic (3+ occurrences = promote)
- [ ] Implement pattern documentation generator
- [ ] Build pattern library (searchable by component/issue type)
- [ ] Create pattern usage tracking (which developers use which patterns)
- [ ] Setup pattern effectiveness monitoring (reduce issues by pattern)
- [ ] Implement pattern versioning (evolve over time)
- [ ] Create pattern migration (update old code to use new patterns)

**Acceptance Criteria:**
- Patterns automatically promoted at 3 occurrences
- Pattern library searchable and accessible to all developers
- Pattern adoption reduces future similar issues by 80%

**Files to Create/Modify:**
- Create `/backend/convex/services/pattern-promoter.ts`
- Create `/backend/convex/mutations/promote-pattern.ts`

---

### Task 4.4: Create Prevention Recommendations Engine

**Objective:** Prevent future failures through process improvements

For recurring failures, recommend:

- [ ] **Code patterns** - "Always use X pattern for Y issue type"
- [ ] **Testing strategies** - "Add test case for Z scenario"
- [ ] **Automated checks** - "Add pre-commit hook to detect this"
- [ ] **Code review focus** - "Review specifically for this issue"
- [ ] **Training content** - "Create course module on this pattern"
- [ ] **Lint rules** - "Add eslint rule to prevent this"
- [ ] **Type improvements** - "Strengthen types to catch this"
- [ ] **Process changes** - "Change review process for this component"

- [ ] Create prevention recommendation scoring (effort vs impact)
- [ ] Implement recommendation prioritization
- [ ] Build recommendation tracking (which were implemented)
- [ ] Setup effectiveness monitoring (did recommendation work?)
- [ ] Create recommendation feedback loop
- [ ] Emit `prevention_recommendation` event for team review
- [ ] Implement automatic prevention (add to pre-commit checks)

**Acceptance Criteria:**
- Prevention recommendations generated for all recurring failures
- 80%+ of recommendations implemented
- Implementation reduces future failures of that type by 70%

**Files to Create/Modify:**
- Create `/backend/convex/services/prevention-recommender.ts`
- Create `/backend/convex/mutations/add-prevention.ts`

---

## Phase 5: Event Logging & Audit Trail (Tasks 5.1-5.3)

### Task 5.1: Create Complete Event Audit Trail

**Objective:** Log entire problem-solving workflow

Events to log:

```
problem_detection_started
  ├─ Component: backend | frontend | integration
  ├─ Test name, error message
  └─ Initial analysis context

problem_analysis_started
  ├─ Root cause analysis initiating
  ├─ Knowledge search starting
  └─ Ontology validation beginning

knowledge_search_completed
  ├─ Similar issues found: N
  ├─ Top match confidence: X%
  └─ Search result ranking

root_cause_identified
  ├─ Root cause: "missing groupId filter"
  ├─ Ontology dimension: "things"
  ├─ Confidence: 85%
  └─ Related failures: [IDs]

solution_proposed
  ├─ Proposed fix details
  ├─ File to modify
  ├─ Estimated fix time
  └─ Assigned specialist

fix_started
  ├─ Specialist name
  ├─ Start time
  └─ Expected completion

fix_completed
  ├─ Changes made
  ├─ Tests re-run
  ├─ All passing: yes/no
  └─ Duration

lesson_learned_captured
  ├─ Lesson ID
  ├─ Lesson components (problem, solution, prevention)
  ├─ Knowledge embedding created
  └─ Knowledge published

pattern_promoted (if 3+ occurrences)
  ├─ Pattern name
  ├─ Occurrences: N
  ├─ Prevention recommendations: M
  └─ Promotion timestamp

prevention_implemented
  ├─ Prevention type (code pattern | test | lint rule | etc)
  ├─ Location/scope
  └─ Implementation status
```

- [ ] Implement event emission for all workflow phases
- [ ] Add rich metadata to each event (timestamps, actors, context)
- [ ] Create event ordering guarantees (maintain causality)
- [ ] Setup event persistence (30-day history)
- [ ] Implement event querying by type, component, actor, time
- [ ] Create event visualization (timeline, dependency graph)
- [ ] Setup event analysis (patterns in problem-solving)
- [ ] Implement event-driven notifications (team awareness)

**Acceptance Criteria:**
- All workflow phases logged with rich metadata
- Event queries complete in < 500ms
- Event timeline accurately reconstructs problem-solving process

**Files to Create/Modify:**
- Create `/backend/convex/events/problem-solver-events.ts`
- Create `/backend/convex/services/workflow-logger.ts`

---

### Task 5.2: Implement Workflow Visualization

**Objective:** Create clear visibility into problem-solving process

Visualizations:

- [ ] Timeline view (when did each phase occur?)
- [ ] Dependency graph (which events caused which?)
- [ ] Actor view (who was involved in solving?)
- [ ] Component view (which component had the problem?)
- [ ] Impact view (how many tests, features, users affected?)
- [ ] Resolution view (how was the problem solved?)
- [ ] Lesson view (what was learned?)
- [ ] Pattern view (what patterns were created?)

- [ ] Create web UI for visualization (React component)
- [ ] Implement drill-down (click to see details)
- [ ] Setup filter/search (find specific workflows)
- [ ] Create workflow export (JSON, CSV, PDF)
- [ ] Implement workflow comparison (compare solving approaches)

**Acceptance Criteria:**
- Visualization loads in < 2 seconds
- All workflow phases clearly visible
- Drill-down provides helpful context

**Files to Create/Modify:**
- Create `/web/src/components/ProblemSolving/WorkflowTimeline.tsx`
- Create `/web/src/components/ProblemSolving/ImpactVisualization.tsx`

---

### Task 5.3: Create Problem-Solving Metrics & Dashboards

**Objective:** Track improvement and success metrics

Metrics to track:

- [ ] **Detection** - Time from failure to detection (target: < 1 second)
- [ ] **Analysis** - Time to complete root cause analysis (target: < 10 minutes)
- [ ] **Solution** - Time to propose solution (target: < 2 minutes after analysis)
- [ ] **Implementation** - Time specialist takes to implement fix (target: < 30 minutes)
- [ ] **Verification** - Time to verify fix works (target: < 5 minutes)
- [ ] **Learning** - Time to capture lesson (target: < 5 minutes)
- [ ] **Accuracy** - % of proposed solutions that work first time (target: > 95%)
- [ ] **Pattern coverage** - % of failures explained by known patterns (target: 80% → 95%)
- [ ] **Prevention** - Reduction in same-failure recurrence (target: 70%+)
- [ ] **Knowledge growth** - Lessons captured per sprint (target: 5-10)

Dashboard views:

- [ ] Real-time failure detection (last 24 hours)
- [ ] Problem-solving funnel (detect → analyze → solve → learn)
- [ ] Specialist performance (who solves fastest? most accurate?)
- [ ] Component reliability (which components fail most?)
- [ ] Time series (failures per day, trends)
- [ ] Knowledge base health (lessons, patterns, coverage)

- [ ] Create metrics collection service
- [ ] Implement metric aggregation (hourly, daily, weekly, monthly)
- [ ] Setup threshold alerting (SLA breaches)
- [ ] Create dashboards (React components)
- [ ] Implement metric export (for executive reporting)
- [ ] Setup metric trending (identify improvements/regressions)

**Acceptance Criteria:**
- Metrics collected for 95%+ of failures
- Dashboards operational and accessible
- Metrics show 50%+ improvement over baseline after 1 month

**Files to Create/Modify:**
- Create `/backend/convex/services/metrics-collector.ts`
- Create `/web/src/components/ProblemSolving/MetricsDashboard.tsx`
- Create `/web/src/pages/problem-solving-dashboard.tsx`

---

## Phase 6: Critical Path Test Scenarios (Tasks 6.1-6.4)

### Task 6.1: Write E2E Tests for Failure Detection

**Objective:** Test that failures are detected and analyzed

Test scenarios:

- [ ] **Test TC1.1:** Schema validation error detected
  - Create invalid entity (missing required field)
  - Verify failure is detected immediately
  - Verify failure categorized as "schema_validation_error"
  - Verify ontology dimension identified (things)

- [ ] **Test TC1.2:** Authorization failure detected
  - Create user in Group A
  - Attempt operation on Group B entity
  - Verify failure detected
  - Verify failure categorized as "authorization_failure"

- [ ] **Test TC1.3:** Multi-tenancy violation detected
  - Create entity in Group A
  - Query with Group B credentials
  - Verify failure detected
  - Verify isolation violation identified

- [ ] **Test TC1.4:** Event logging gap detected
  - Execute mutation without event logging
  - Verify failure detected
  - Verify ontology dimension: events

- [ ] **Test TC1.5:** Race condition detected
  - Run concurrent mutations on same entity
  - Verify race condition identified
  - Verify flaky test marked for isolation

- [ ] **Test TC1.6:** Failure clustering
  - Emit 5 identical failures
  - Verify clustered as single issue
  - Verify analysis count = 1 (not 5)

- [ ] Implement failure injection framework
- [ ] Create test fixtures for each failure type
- [ ] Build assertion helpers for failure validation
- [ ] Implement test cleanup (clear failures after test)

**Acceptance Criteria:**
- All failure types detected automatically
- E2E tests pass with >95% consistency (not flaky)
- Coverage: 12+ failure categories

**Files to Create/Modify:**
- Create `/web/src/tests/problem-solving/failure-detection.test.ts`
- Create `/backend/test/failure-detection.test.ts`

---

### Task 6.2: Write E2E Tests for Root Cause Analysis

**Objective:** Test that root causes are correctly identified

Test scenarios:

- [ ] **Test TC2.1:** Knowledge base search finds similar issue
  - Create lesson in knowledge base
  - Emit similar failure
  - Verify similar lesson found
  - Verify confidence > 80%

- [ ] **Test TC2.2:** Ontology-aligned analysis
  - Emit failure affecting groups dimension
  - Verify analysis maps to groups
  - Verify solution proposes group-related fix

- [ ] **Test TC2.3:** Root cause accuracy validation
  - For 10 known failures, emit each
  - Verify identified root cause matches known root
  - Calculate accuracy %

- [ ] **Test TC2.4:** Confidence scoring
  - Emit known pattern failure (confidence should be high)
  - Emit novel failure (confidence should be lower)
  - Verify confidence scoring correlates with accuracy

- [ ] **Test TC2.5:** Flaky test detection
  - Run test 20 times (18 pass, 2 fail)
  - Verify marked as flaky
  - Verify pass rate = 90% (< 95% threshold)

- [ ] **Test TC2.6:** Concurrency analysis
  - Run concurrent mutations
  - Verify race condition identified
  - Verify timeline shows operation order

- [ ] **Test TC2.7:** Data isolation validation
  - Query with groupId scoping violation
  - Verify isolation checker catches it
  - Verify fix proposed includes groupId filter

- [ ] **Test TC2.8:** Code flow analysis
  - Emit failure with complex code path
  - Verify analysis traces through code
  - Verify decision tree logged

**Acceptance Criteria:**
- Root cause accuracy > 85%
- Confidence scoring accurate (high confidence = 90%+ success)
- All 6 ontology dimensions analyzed correctly

**Files to Create/Modify:**
- Create `/web/src/tests/problem-solving/root-cause-analysis.test.ts`
- Create `/backend/test/root-cause-analysis.test.ts`

---

### Task 6.3: Write E2E Tests for Solution Proposal & Implementation

**Objective:** Test that fixes are proposed and work

Test scenarios:

- [ ] **Test TC3.1:** Solution proposal generated
  - Emit failure with known pattern
  - Verify solution proposed within 2 minutes
  - Verify solution includes code change

- [ ] **Test TC3.2:** Solution is specific
  - Verify proposed fix includes exact file path
  - Verify line numbers specified
  - Verify code change is minimal (not over-engineered)

- [ ] **Test TC3.3:** Ontology operations specified
  - Verify solution maps to ontology dimensions
  - Verify operations (things/connections/events/knowledge) specified
  - Verify operations align with root cause

- [ ] **Test TC3.4:** Specialist assignment
  - Verify correct specialist assigned based on component
  - Verify assignment happens within 1 minute
  - Verify specialist notification sent

- [ ] **Test TC3.5:** Solution validation
  - Validate proposed fix passes syntax checking
  - Validate types match schema
  - Validate no breaking changes

- [ ] **Test TC3.6:** Fix implementation succeeds
  - Specialist implements proposed fix
  - Run test again
  - Verify test now passes

- [ ] **Test TC3.7:** No regression
  - Verify all other tests still pass after fix
  - Verify no new failures introduced

- [ ] **Test TC3.8:** Fix time accuracy
  - Verify actual fix time close to estimate
  - Build accuracy model over time

**Acceptance Criteria:**
- Solutions proposed for all failures
- 95%+ of solutions work first time
- No regressions from fixes

**Files to Create/Modify:**
- Create `/web/src/tests/problem-solving/solution-proposal.test.ts`
- Create `/backend/test/solution-implementation.test.ts`

---

### Task 6.4: Write E2E Tests for Lesson Learning & Prevention

**Objective:** Test that lessons are captured and prevent future failures

Test scenarios:

- [ ] **Test TC4.1:** Lesson captured
  - Fix failure
  - Verify lesson created in knowledge base
  - Verify lesson has problem, solution, prevention

- [ ] **Test TC4.2:** Lesson embeddings
  - Verify embedding generated
  - Verify vector similarity search finds lesson
  - Verify cosine distance < 0.2 (high similarity)

- [ ] **Test TC4.3:** Lesson linking
  - Verify lesson linked to feature via connections
  - Verify bidirectional relationship
  - Verify learned_from relationship type

- [ ] **Test TC4.4:** Lesson labels
  - Verify semantic labels added (skill, topic, component, status)
  - Verify label search finds lesson
  - Verify label filtering works

- [ ] **Test TC4.5:** Pattern promotion
  - Emit same failure 3 times
  - Verify pattern promoted
  - Verify pattern published in knowledge base

- [ ] **Test TC4.6:** Prevention implementation
  - Emit failure matching promoted pattern
  - Verify prevention recommendation emitted
  - Verify prevention implemented (e.g., pre-commit check)

- [ ] **Test TC4.7:** Failure prevention
  - Emit original failure type again
  - Verify prevented by new pattern/check
  - Verify test passes without manual fix

- [ ] **Test TC4.8:** Knowledge growth
  - Capture 10 lessons
  - Verify knowledge base has 10 new entries
  - Verify all searchable

**Acceptance Criteria:**
- All lessons captured with complete metadata
- Lessons findable via semantic search (85%+ accuracy)
- Prevention prevents future failures (70%+ reduction)
- Knowledge base growth: 5-10 lessons per sprint

**Files to Create/Modify:**
- Create `/web/src/tests/problem-solving/lesson-learning.test.ts`
- Create `/backend/test/lesson-capture.test.ts`

---

## Critical Path Execution Diagram

```
FAILURE DETECTION (T=0)
         ↓
         Monitor all agents for test_failed events
         ├─ Quality agent emits test_failed
         ├─ Frontend agent emits test_failed
         └─ Backend agent emits test_failed
         ↓
IMMEDIATE TRIAGE (T=0-1min)
         ├─ Categorize failure (12+ categories)
         ├─ Assess impact (blast radius)
         ├─ Cluster with related failures
         └─ Assign SLA (2-60 min based on severity)
         ↓
ROOT CAUSE ANALYSIS (T=1-10min, ultrathink mode)
         ├─ Map to ontology dimension
         ├─ Search knowledge base (vector + labels)
         ├─ Analyze failure context
         ├─ Trace code path
         ├─ Identify root pattern
         └─ Validate hypothesis
         ↓
SOLUTION PROPOSAL (T=10-12min)
         ├─ Match to known pattern or infer
         ├─ Generate specific fix
         ├─ Map ontology operations
         ├─ Validate fix (syntax, types, schema)
         ├─ Assign to specialist
         └─ Emit solution_proposed event
         ↓
FIX IMPLEMENTATION (T=12-40min)
         ├─ Specialist implements fix
         ├─ All tests re-run
         ├─ Verify no regressions
         └─ Emit fix_completed event
         ↓
LESSON CAPTURE (T=40-45min)
         ├─ Extract lesson from failure+solution
         ├─ Generate embeddings
         ├─ Create knowledge chunks
         ├─ Link to feature via connections
         ├─ Add semantic labels
         └─ Publish to knowledge base
         ↓
PATTERN PROMOTION (if 3+ occurrences)
         ├─ Aggregate lessons
         ├─ Extract universal pattern
         ├─ Create pattern documentation
         ├─ Add to pattern library
         └─ Emit pattern_promoted event
         ↓
PREVENTION IMPLEMENTATION
         ├─ Generate prevention recommendations
         ├─ Implement checks (pre-commit hooks, lint rules)
         ├─ Update developer guidelines
         └─ Track effectiveness
         ↓
COMPLETE (T=45-60min for most failures)
         ├─ Emit fix_verified event
         ├─ Close failure tracking entry
         ├─ Log metrics
         └─ Celebrate learning!
```

---

## Success Criteria

### Immediate Metrics (Per Problem)

- [ ] **Detection:** Failure detected within 1 second (100%)
- [ ] **SLA Compliance:** Root cause analysis within SLA (95%+)
- [ ] **Solution Quality:** Proposed fixes work first time (95%+)
- [ ] **Lesson Capture:** All failures produce lessons (100%)
- [ ] **Knowledge Growth:** New patterns/lessons every sprint (5-10/sprint)

### Near-Term Metrics (Per Sprint)

- [ ] **Analysis Time:** Average < 10 minutes (SLA achievement)
- [ ] **Specialist Efficiency:** Fixes implemented in < 30 minutes (on average)
- [ ] **Pattern Coverage:** 80%+ of failures match known patterns (growth trajectory)
- [ ] **Prevention Effectiveness:** Same failure recurrence < 20% (was 100%)
- [ ] **Team Learning:** Quarterly increase in patterns/lessons (20% growth)

### Long-Term Metrics (System-wide)

- [ ] **Autonomous Problem Solving:** 80%+ of failures resolved without human intervention
- [ ] **Knowledge Completeness:** Pattern library covers 95%+ of failure types
- [ ] **Zero Regressions:** Prevented patterns cause 0 new failures (70% reduction from baseline)
- [ ] **Sub-Minute Analysis:** New failures analyzed in < 1 minute (via pattern matching)
- [ ] **Self-Healing System:** Unknown failures automatically prevented through learning

---

## Escalation Procedures

### Escalation Triggers

**Escalate to Manual Review when:**

1. **Confidence < 40%** - Problem Solver unsure of root cause
2. **SLA Breach** - Analysis not completed within SLA window
3. **Specialist Unavailable** - No qualified specialist can take fix
4. **Multiple Root Causes** - Failure has 3+ possible root causes
5. **Conflicting Solutions** - Multiple solutions proposed with equal confidence
6. **External Dependency** - Failure depends on external system failure
7. **Security Concern** - Potential security issue in failure/solution
8. **Data Loss Risk** - Failure might involve data loss
9. **Ontology Violation** - Failure doesn't map to 6-dimension ontology
10. **Novel Pattern** - First occurrence, no similar issues in knowledge base

### Escalation Path

```
Problem Solver Analysis
         ↓
   [Confidence Check]
         ↓
Low Confidence (< 40%) OR SLA Breach?
         ├─ YES → Route to Senior Specialist Review
         │         ├─ Senior specialist analyzes
         │         └─ Higher confidence required (70%+)
         │              ├─ Still unsure?
         │              │   └─ Route to Engineering Lead
         │              │        ├─ Lead conducts deep investigation
         │              │        └─ Creates new pattern/lesson
         │              └─ Confident?
         │                  └─ Implement fix normally
         └─ NO → Route to Specialist for Implementation
                   ├─ Implement fix
                   └─ Capture lesson
```

### Escalation Communication

When escalating, include:

- [ ] Full failure details and error logs
- [ ] Root cause analysis (even if uncertain)
- [ ] All proposed solutions (ranked by confidence)
- [ ] Knowledge base search results (similar issues)
- [ ] Timeline of analysis (what was tried)
- [ ] Escalation reason (why uncertain/SLA breach)
- [ ] Suggested next steps (from problem solver perspective)

---

## Testing the Problem Solver

### Test Execution Checklist

Before marking cycle 65-70 complete:

- [ ] **Phase 1 Tests** (Failure Detection) - All passing
  - Failure detection E2E tests
  - Categorization accuracy tests
  - Impact analysis tests
  - Event pipeline tests
  - Triage queue tests

- [ ] **Phase 2 Tests** (Root Cause Analysis) - All passing
  - Root cause accuracy tests
  - Ontology mapping tests
  - Knowledge search tests
  - Flaky detection tests
  - Debug logging tests
  - Concurrency analysis tests
  - Data isolation tests

- [ ] **Phase 3 Tests** (Solution Proposal) - All passing
  - Solution generation tests
  - Specialist assignment tests
  - Solution validation tests
  - Error message tests

- [ ] **Phase 4 Tests** (Lesson Learning) - All passing
  - Lesson capture tests
  - Knowledge base integration tests
  - Pattern promotion tests
  - Prevention recommendation tests

- [ ] **Phase 5 Tests** (Event Logging) - All passing
  - Event audit trail tests
  - Workflow visualization tests
  - Metrics collection tests

- [ ] **Phase 6 Tests** (Critical Paths) - All passing
  - E2E failure detection
  - E2E root cause analysis
  - E2E solution proposal
  - E2E lesson learning

### Success Validation

Before marking complete, verify:

```typescript
// Overall Success Criteria
const successCriteria = {
  testCoverage: '>= 95%',              // All code paths tested
  failureDetection: '100%',             // All failures detected
  analysisAccuracy: '>= 85%',           // Root causes correct
  solutionAccuracy: '>= 95%',           // Fixes work first time
  lessonCapture: '100%',                // All failures → lessons
  knowledgeGrowth: '>= 10 lessons',     // New knowledge per sprint

  // Performance SLAs
  detectionTime: '<= 1 second',
  analysisTime: '<= 10 minutes',
  proposalTime: '<= 2 minutes after analysis',
  implementationTime: '<= 30 minutes',

  // Quality metrics
  flakiness: '< 5% flaky tests',        // Most tests stable
  regressions: '0 new failures',        // Fixes don't break things
  dataLeaks: '0 multi-tenant violations' // 100% isolation maintained
}
```

---

## File Structure Summary

### New Services to Create

```
/backend/convex/services/
├── failure-monitor.ts                 # Real-time failure detection
├── failure-categorizer.ts             # Classify failures (12+ types)
├── failure-impact-analyzer.ts         # Assess blast radius
├── failure-event-pipeline.ts          # Event-driven orchestration
├── failure-triage-queue.ts            # Prioritize failures
├── root-cause-analyzer.ts             # Deep analysis (ultrathink)
├── ontology-validator.ts              # 6-dimension validation
├── code-flow-analyzer.ts              # Trace code paths
├── knowledge-search.ts                # Vector + label search
├── flaky-test-detector.ts             # Intermittent failure detection
├── debug-logger.ts                    # Structured logging
├── concurrency-analyzer.ts            # Race condition detection
├── data-isolation-validator.ts        # Multi-tenancy verification
├── solution-proposal-generator.ts     # Generate specific fixes
├── code-fix-generator.ts              # AST-based code generation
├── specialist-assignment.ts           # Route to right person
├── solution-validator.ts              # Validate fixes
├── error-message-improver.ts          # Clear error messages
├── lesson-learner.ts                  # Convert failure → lesson
├── embedding-generator.ts             # Vector embeddings
├── pattern-promoter.ts                # Recurring → pattern
├── prevention-recommender.ts          # Suggest improvements
├── workflow-logger.ts                 # Audit trail
├── metrics-collector.ts               # Success metrics
└── test-instrumentation.ts            # Test helpers
```

### New Queries/Mutations to Create

```
/backend/convex/queries/
├── failure-queries.ts                 # Query failures
├── triage-status.ts                   # Queue status
├── flaky-test-report.ts               # Flaky patterns
├── search-similar-lessons.ts          # Knowledge search
└── problem-solving-metrics.ts         # Dashboard data

/backend/convex/mutations/
├── failure-tracking.ts                # Log failures
├── assign-fix.ts                      # Delegate to specialist
├── capture-lesson.ts                  # Save learning
├── add-to-knowledge.ts                # Publish to knowledge base
├── promote-pattern.ts                 # Pattern promotion
└── add-prevention.ts                  # Save prevention check
```

### New Test Files

```
/web/src/tests/problem-solving/
├── failure-detection.test.ts          # TC1.1-1.6
├── root-cause-analysis.test.ts        # TC2.1-2.8
├── solution-proposal.test.ts          # TC3.1-3.8
├── lesson-learning.test.ts            # TC4.1-4.8
└── end-to-end.test.ts                 # Full workflow

/backend/test/
├── failure-detection.test.ts          # Failure monitoring
├── root-cause-analysis.test.ts        # Analysis accuracy
├── solution-implementation.test.ts    # Fix validation
├── lesson-capture.test.ts             # Knowledge capture
└── stress-test.ts                     # Scale testing
```

### UI Components

```
/web/src/components/ProblemSolving/
├── WorkflowTimeline.tsx               # Timeline visualization
├── ImpactVisualization.tsx            # Blast radius diagram
├── FailureList.tsx                    # Failure triage queue
├── RootCauseAnalysis.tsx              # Analysis details
├── SolutionProposal.tsx               # Fix details
├── LessonView.tsx                     # Captured lesson
├── PatternsLibrary.tsx                # Pattern catalog
└── MetricsDashboard.tsx               # Success metrics

/web/src/pages/
├── problem-solving-dashboard.tsx      # Main dashboard
├── failure-[id].tsx                   # Failure details
└── lessons-[id].tsx                   # Lesson details
```

---

## Next Steps (After Phase 6)

### Cycle 71-80: Design & Refinement
- Refine UI/UX for dashboards
- Optimize metric queries
- Create coaching AI (suggests best patterns)
- Build knowledge search UI

### Cycle 81-90: Performance Optimization
- Optimize vector search (batch index)
- Cache frequent queries (1-hour TTL)
- Parallel analysis (analyze 10 failures simultaneously)
- Reduce analysis time from 10min → 2min

### Cycle 91-100: Deployment & Documentation
- Deploy all services to Convex
- Create operator guide
- Write runbook for common issues
- Train team on system usage
- Monitor production metrics

---

## Knowledge Base Entry Format

When capturing lessons, use this structure:

```markdown
# Lesson: [Title]

**Component:** backend | frontend | integration
**Severity:** critical | high | medium | low
**Occurrences:** N times
**Last Occurrence:** [date]

## Problem

What went wrong and why.

## Root Cause

Technical explanation of why it happened.

## Solution

Code example and explanation.

\`\`\`typescript
// Before (incorrect)
const things = await ctx.db.query('things').collect()

// After (correct)
const things = await ctx.db
  .query('things')
  .withIndex('by_groupId', q => q.eq('groupId', args.groupId))
  .collect()
\`\`\`

## Prevention

Checklist to prevent this:
- [ ] Always include groupId filter
- [ ] Use index for performance
- [ ] Add error for missing group
- [ ] Write isolation test

## Related Patterns

- [Group-Scoped Query Pattern](/patterns/group-scoped-query)
- [Multi-Tenant Isolation](/knowledge/multi-tenancy)

## References

- Lesson ID: [ID]
- Related Issues: [IDs]
- Pattern ID: [ID] (if promoted)
```

---

## Quick Reference: Failure Categories

### 1. Schema Validation Errors
**Root Cause:** Invalid data doesn't match schema
**Solution:** Add schema validation, improve error messages
**Prevention:** Type checking, pre-validation

### 2. Authorization Failures
**Root Cause:** Missing role check or permission validation
**Solution:** Add authorization guard, verify role
**Prevention:** Policy as code, pre-request checks

### 3. Data Isolation Violations
**Root Cause:** Missing groupId filter in query
**Solution:** Add groupId scoping to all queries
**Prevention:** Index-enforced groupId, automatic filtering

### 4. Event Logging Gaps
**Root Cause:** Mutation doesn't emit event
**Solution:** Add event emission to mutation
**Prevention:** Template for all mutations, pre-commit check

### 5. Race Conditions
**Root Cause:** Concurrent operations on same entity
**Solution:** Add locking, improve transaction isolation
**Prevention:** Stress testing, isolation level validation

### 6. Hydration Mismatches
**Root Cause:** Server and client state divergent
**Solution:** Ensure data fetched before render
**Prevention:** SSR validation, hydration guards

### 7. API Response Format Errors
**Root Cause:** Response doesn't match expected shape
**Solution:** Add response validation, fix API
**Prevention:** Type generation, contract testing

### 8. Database Transaction Failures
**Root Cause:** Transaction conflict, constraint violation
**Solution:** Retry logic, handle constraint errors
**Prevention:** Isolation level testing, conflict detection

### 9. Service Initialization Failures
**Root Cause:** Service not ready when called
**Solution:** Add health checks, wait for ready
**Prevention:** Readiness gates, dependency validation

### 10. Configuration/Environment Errors
**Root Cause:** Missing env var, wrong setting
**Solution:** Add env var, fix configuration
**Prevention:** Schema validation for config, env templates

### 11. Performance/Timeout Failures
**Root Cause:** Operation too slow, index missing
**Solution:** Add index, optimize query, increase timeout
**Prevention:** Performance budgets, baseline testing

### 12. Flaky/Intermittent Failures
**Root Cause:** Timing-dependent, environmental
**Solution:** Add waits, fix race condition, stabilize
**Prevention:** Retry logic, delay injection, isolation

---

## Version History

- **v2.0.0** (Current) - Ontology-aligned, parallel monitoring, 10-minute SLA
- **v1.0.0** - Initial problem solver framework (manual analysis)

---

**Problem Solver Agent v2.0.0**
**Deep analysis. Root causes via 6 dimensions. Specific solutions. Every problem grows the knowledge graph.**

Created for Cycle 65-70 (E2E Testing & Failure Analysis)
