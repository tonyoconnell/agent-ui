# Problem Solver Agent - Quick Start Guide

**Cycle:** 65-70 (E2E Testing & Failure Analysis)
**Total Tasks:** 24 major tasks across 6 phases
**Test Cases:** 32 E2E test scenarios
**Estimated Time:** 2-3 sprints
**Success Metric:** 70% faster failure recovery (10 minutes to solution)

---

## What You're Building

A real-time failure analysis system that:

1. **Monitors** - Detects test failures from all agents in real-time
2. **Analyzes** - Identifies root cause using 6-dimension ontology (10-minute SLA)
3. **Proposes** - Generates specific, validated solutions with ontology operations
4. **Delegates** - Assigns fixes to specialist agents with full context
5. **Learns** - Captures lessons and converts to patterns for knowledge base
6. **Prevents** - Implements safeguards to prevent same failure recurring

---

## The 6 Phases

### Phase 1: Failure Detection & Collection (Tasks 1.1-1.5)
**Time:** Weeks 1-2
**Key Deliverables:**
- Real-time failure monitoring system
- Failure categorization (12+ categories)
- Impact analysis engine
- Event pipeline
- Triage queue

**Success Criteria:**
- All failures detected within 1 second
- 95%+ SLA compliance
- Failure clustering reduces load 60%

### Phase 2: Root Cause Investigation (Tasks 2.1-2.6)
**Time:** Weeks 2-3
**Key Deliverables:**
- Ontology-aligned analysis framework
- Knowledge base vector search
- Flaky test detection
- Debug logging infrastructure
- Concurrency analysis
- Data isolation validator

**Success Criteria:**
- Root cause identified with 80%+ confidence
- Knowledge base search accuracy 85%+
- All 6 dimensions analyzed

### Phase 3: Solution Proposal & Implementation (Tasks 3.1-3.4)
**Time:** Week 3-4
**Key Deliverables:**
- Solution proposal generator
- Code fix generator (AST-based)
- Specialist assignment system
- Solution validation engine
- Error message improvement

**Success Criteria:**
- Solutions specific with exact code changes
- 95%+ of proposed solutions work first time
- No regressions from fixes

### Phase 4: Lesson Capture & Prevention (Tasks 4.1-4.4)
**Time:** Week 4
**Key Deliverables:**
- Lesson learning system
- Knowledge base integration with embeddings
- Pattern promotion system (3+ occurrences)
- Prevention recommendations engine

**Success Criteria:**
- All failures produce lessons (100%)
- Lessons searchable via vector similarity
- Pattern adoption reduces future failures 70%+

### Phase 5: Event Logging & Audit Trail (Tasks 5.1-5.3)
**Time:** Week 4-5
**Key Deliverables:**
- Complete event audit trail (problem_analysis_started → lesson_learned_added)
- Workflow visualization (timeline, dependency graph)
- Metrics dashboard (detection, analysis, fix time, accuracy)

**Success Criteria:**
- All workflow phases logged
- Metrics collected for 95%+ of failures
- Dashboard shows 50%+ improvement after 1 month

### Phase 6: Critical Path Tests (Tasks 6.1-6.4)
**Time:** Week 5
**Key Deliverables:**
- E2E tests for failure detection (8 scenarios)
- E2E tests for root cause analysis (8 scenarios)
- E2E tests for solution proposal (8 scenarios)
- E2E tests for lesson learning (8 scenarios)

**Success Criteria:**
- 32+ E2E test scenarios, all passing
- Test coverage >95%
- All code paths validated

---

## Key Concepts

### Failure Categories (Task 2.1)

| Category | Root Cause | Solution | Prevention |
|----------|-----------|----------|-----------|
| Schema Validation | Invalid data | Add validation | Type checking |
| Authorization | Missing role check | Add guard | Policy as code |
| Data Isolation | Missing groupId | Add filter | Index enforcement |
| Event Logging | No event emitted | Add event | Mutation template |
| Race Condition | Concurrent access | Add locking | Stress test |
| Hydration Mismatch | Server/client diverge | SSR guard | Validation |
| API Format | Response shape wrong | Validate response | Contract test |
| Transaction Failure | Conflict/constraint | Retry logic | Isolation test |
| Service Init | Service not ready | Add health check | Readiness gate |
| Configuration | Wrong setting/env | Fix config | Schema validation |
| Performance | Slow/timeout | Add index | Performance budget |
| Flaky | Timing-dependent | Fix race | Isolation/retry |

### Root Cause Analysis Workflow

```
1. Map to Ontology (2 min)
   ├─ Which dimension? (groups/people/things/connections/events/knowledge)
   ├─ What entity/relationship?
   └─ Schema alignment issue?

2. Search Knowledge (1 min)
   ├─ Vector similarity search
   └─ Label-based search

3. Analyze Context (3 min)
   ├─ What was expected?
   ├─ What actually happened?
   └─ What's the diff?

4. Identify Pattern (2 min)
   ├─ Logic error?
   ├─ Missing validation?
   ├─ Wrong pattern?
   ├─ Configuration issue?
   ├─ Race condition?
   └─ Data isolation problem?

5. Validate (1 min)
   ├─ Check git history
   ├─ Trace event log
   └─ Walk through code

TOTAL: ~10 minutes for complete analysis
```

### 6-Dimension Ontology Mapping

Every failure MUST map to one dimension:

| Dimension | Issue Types | Example |
|-----------|-----------|---------|
| **Groups** | Isolation, scoping, hierarchy | Missing groupId in query |
| **People** | Authorization, roles, permissions | User lacking required role |
| **Things** | Schema, validation, properties | Invalid entity type |
| **Connections** | Relationship integrity, bidirectionality | Broken reference |
| **Events** | Audit trail, ordering, logging | Missing mutation event |
| **Knowledge** | Embeddings, search, semantics | Vector similarity search fails |

### Solution Proposal Structure

```typescript
interface SolutionProposal {
  failureId: string
  rootCause: string                     // Why it failed
  ontologyDimension: string             // Which dimension affected
  proposedFix: {
    description: string                 // What to change
    code: string                        // EXACT code change
    filePath: string                    // backend/convex/queries/things.ts
    lineNumbers: [15, 20]               // Lines affected
    riskLevel: 'low'                    // low/medium/high
  }
  ontologyOperations: {
    things?: ['create', 'add groupId filter']
    events?: ['add event_created logging']
    connections?: ['validate bidirectional']
  }
  testToAdd?: string                    // New test case
  estimatedFixTime: 5                   // minutes
  confidence: 85                        // 0-100%
}
```

---

## Critical Path (What to Implement First)

### Week 1 Priority (Phase 1)
1. **Task 1.1** - Failure monitoring (detect all test failures)
2. **Task 1.2** - Categorization (classify 12+ failure types)
3. **Task 1.4** - Event pipeline (real-time event flow)

### Week 2 Priority (Phase 2)
1. **Task 2.1** - Ontology analysis (map failures to 6 dimensions)
2. **Task 2.2** - Knowledge search (find similar issues)
3. **Task 2.3** - Flaky detection (identify intermittent failures)

### Week 3 Priority (Phase 3)
1. **Task 3.1** - Solution generation (propose specific fixes)
2. **Task 3.2** - Specialist assignment (route to right person)
3. **Task 3.3** - Solution validation (verify fixes work)

### Week 4 Priority (Phase 4 & 5)
1. **Task 4.1** - Lesson capture (convert failure → lesson)
2. **Task 5.1** - Event logging (audit trail)
3. **Task 4.3** - Pattern promotion (recurring → pattern)

### Week 5 Priority (Phase 6)
1. **Task 6.1** - Write E2E tests (failure detection)
2. **Task 6.2** - Write E2E tests (root cause analysis)
3. **Task 6.3** - Write E2E tests (solution proposal)
4. **Task 6.4** - Write E2E tests (lesson learning)

---

## Success Metrics (What Success Looks Like)

### Immediate (Per Failure)
- Detection: < 1 second (100%)
- Analysis: < 10 minutes (SLA achievement)
- Solution accuracy: > 95% (fixes work first time)
- Lesson capture: 100% (all failures → lessons)

### Near-term (Per Sprint)
- Pattern coverage: 80% → 95% (growth trajectory)
- Prevention effectiveness: Same failure recurrence < 20%
- Specialist efficiency: Fixes in < 30 minutes
- Team learning: 5-10 new patterns/lessons per sprint

### Long-term (System-wide)
- Autonomous solving: 80%+ without human intervention
- Knowledge completeness: 95%+ failure types have patterns
- Zero regressions: Prevented patterns cause 0 new failures
- Sub-minute analysis: New failures analyzed in < 1 minute
- Self-healing: Unknown failures prevented through learning

---

## Test Scenarios Summary

### Phase 1 Tests (Failure Detection) - 6 scenarios
- [ ] TC1.1 - Schema validation error detected
- [ ] TC1.2 - Authorization failure detected
- [ ] TC1.3 - Multi-tenancy violation detected
- [ ] TC1.4 - Event logging gap detected
- [ ] TC1.5 - Race condition detected
- [ ] TC1.6 - Failure clustering

### Phase 2 Tests (Root Cause Analysis) - 8 scenarios
- [ ] TC2.1 - Knowledge base search finds similar issue
- [ ] TC2.2 - Ontology-aligned analysis
- [ ] TC2.3 - Root cause accuracy validation
- [ ] TC2.4 - Confidence scoring
- [ ] TC2.5 - Flaky test detection
- [ ] TC2.6 - Concurrency analysis
- [ ] TC2.7 - Data isolation validation
- [ ] TC2.8 - Code flow analysis

### Phase 3 Tests (Solution Proposal) - 8 scenarios
- [ ] TC3.1 - Solution proposal generated
- [ ] TC3.2 - Solution is specific (exact file, line numbers)
- [ ] TC3.3 - Ontology operations specified
- [ ] TC3.4 - Specialist assignment
- [ ] TC3.5 - Solution validation
- [ ] TC3.6 - Fix implementation succeeds
- [ ] TC3.7 - No regression
- [ ] TC3.8 - Fix time accuracy

### Phase 4 Tests (Lesson Learning) - 8 scenarios
- [ ] TC4.1 - Lesson captured
- [ ] TC4.2 - Lesson embeddings (vector search works)
- [ ] TC4.3 - Lesson linking (connections created)
- [ ] TC4.4 - Lesson labels (taxonomy applied)
- [ ] TC4.5 - Pattern promotion (3+ occurrences)
- [ ] TC4.6 - Prevention implementation
- [ ] TC4.7 - Failure prevention (doesn't happen again)
- [ ] TC4.8 - Knowledge growth

**Total: 32 E2E test scenarios**

---

## File Structure

### Services to Create (22 files)
```
/backend/convex/services/
├── failure-monitor.ts              ← Phase 1.1
├── failure-categorizer.ts          ← Phase 1.2
├── failure-impact-analyzer.ts      ← Phase 1.3
├── failure-event-pipeline.ts       ← Phase 1.4
├── failure-triage-queue.ts         ← Phase 1.5
├── root-cause-analyzer.ts          ← Phase 2.1
├── ontology-validator.ts           ← Phase 2.1
├── code-flow-analyzer.ts           ← Phase 2.1
├── knowledge-search.ts             ← Phase 2.2
├── flaky-test-detector.ts          ← Phase 2.3
├── debug-logger.ts                 ← Phase 2.4
├── concurrency-analyzer.ts         ← Phase 2.5
├── data-isolation-validator.ts     ← Phase 2.6
├── solution-proposal-generator.ts  ← Phase 3.1
├── code-fix-generator.ts           ← Phase 3.1
├── specialist-assignment.ts        ← Phase 3.2
├── solution-validator.ts           ← Phase 3.3
├── error-message-improver.ts       ← Phase 3.4
├── lesson-learner.ts               ← Phase 4.1
├── embedding-generator.ts          ← Phase 4.2
├── pattern-promoter.ts             ← Phase 4.3
├── prevention-recommender.ts       ← Phase 4.4
└── (+ queries, mutations, events, UI components)
```

### Tests to Write (8 files)
```
/web/src/tests/problem-solving/
├── failure-detection.test.ts       ← Phase 6.1
├── root-cause-analysis.test.ts     ← Phase 6.2
├── solution-proposal.test.ts       ← Phase 6.3
├── lesson-learning.test.ts         ← Phase 6.4
└── end-to-end.test.ts             ← Integration

/backend/test/
├── failure-detection.test.ts
├── root-cause-analysis.test.ts
├── solution-implementation.test.ts
└── lesson-capture.test.ts
```

---

## Key Achievements by Week

| Week | Phase | Key Achievements |
|------|-------|------------------|
| 1 | Phase 1 | Failure detection running, 12+ categories identified, event pipeline operational |
| 2 | Phase 2 | Root cause analysis accurate 80%+, knowledge search working, flaky detection active |
| 3 | Phase 3 | Solutions generated and proposed, specialist assignment working, validation 95%+ |
| 4 | Phase 4 + 5 | Lessons captured automatically, knowledge base growing, metrics dashboard online |
| 5 | Phase 6 | 32 E2E tests written and passing, system fully validated, ready for production |

---

## How to Use This Document

1. **Start Here** - Read this quick start (you are here)
2. **Full Details** - Read `/Users/toc/Server/ONE/.claude/plans/todo-agent-problem-solver.md` (5,000+ lines)
3. **Execute Phase 1** - Implement tasks 1.1-1.5 (failure detection)
4. **Write Tests** - Create E2E tests for what you build
5. **Capture Lessons** - After each phase, add lesson to knowledge base

---

## Communication with Team

### When Starting
"I'm building the Problem Solver Agent for failures. Focus: Real-time detection → root cause analysis → solution proposal within 10 minutes."

### When Stuck
"Need help with [specific task]. Root issue: [ontology dimension affected]. Progress: [what's done]."

### When Complete
"Problem Solver Agent operational. Detection: < 1s. Analysis: < 10 min. Solution accuracy: 95%+. Knowledge base: N lessons."

---

## Quick Reference Commands

```bash
# Monitor test failures in real-time
npx convex logs --live --function "failure-monitor"

# Check failure queue
npx convex run queries/triage-status

# View captured lessons
curl "http://localhost:3000/api/knowledge/lessons?limit=10"

# Search for similar issues
curl "http://localhost:3000/api/knowledge/search?error=groupId&similarity=0.8"

# Generate metrics report
npx convex run queries/problem-solving-metrics '{"timeRange": "week"}'
```

---

## Success Checklist

- [ ] Phase 1 complete (failure detection)
- [ ] Phase 2 complete (root cause analysis)
- [ ] Phase 3 complete (solution proposal)
- [ ] Phase 4 complete (lesson learning)
- [ ] Phase 5 complete (event logging)
- [ ] Phase 6 complete (32 E2E tests)
- [ ] All tests passing (>95%)
- [ ] Knowledge base has 10+ lessons
- [ ] Dashboard operational
- [ ] Team trained on system
- [ ] Ready for production deployment

---

**Problem Solver Agent v2.0.0**
**Cycle 65-70: E2E Testing & Failure Analysis**
**Next: Cycle 71 - Write integration tests for all dimensions**
