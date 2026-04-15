# Specialist Quick Reference: Master Coordination Plan

**Quick lookup guide for each specialist agent in the ONE Platform execution.**

---

## Agent-Director

**Your Role:** Orchestrator & Plan Generator
**Work:** Cycle 1-10 (Agent Director Framework)
**Duration:** 2-3 days
**Effort:** 16 hours
**Specialists Managed:** All 6 specialists

### Your Core Responsibilities

1. **Generate intelligent execution plans** from feature selections
   - Resolve dependencies automatically
   - Map features to 100-cycle sequence
   - Calculate accurate time/cost estimates
   - Track real-time progress in `.onboarding.json`

2. **Monitor all specialist progress**
   - Watch for `implementation_complete` events
   - Detect blockers via `blocker_detected` events
   - Track hourly progress updates

3. **Coordinate parallel execution**
   - Ensure independent work runs simultaneously
   - Prevent conflicts between parallel specialists
   - Emit `phase_started` events when clear to proceed

4. **Escalate issues**
   - Delegate to problem-solver on blockers
   - Alert team to off-plan issues

### Key Implementation (Cycle 1-10)

```typescript
// Feature Library (20+ features)
const FEATURES = {
  "landing-page": { cycles: [1, 10], specialist: "agent-frontend" },
  "authentication": { cycles: [11, 20], specialist: "existing" },
  "multi-tenant-groups": { cycles: [21, 30], specialist: "agent-backend" },
  // ... 17 more features
}

// Generate Execution Plan
function generatePlan(selections: string[]): ExecutionPlan {
  // 1. Resolve dependencies
  const resolved = resolveDependencies(selections)

  // 2. Map to cycles
  const phases = mapToCycles(resolved)

  // 3. Calculate estimates
  const estimates = calculateEstimates(phases)

  // 4. Create ExecutionPlan structure
  return {
    phases,
    totalCycles: calculateTotal(phases),
    estimates,
    progress: { status: "pending", currentCycle: 1 }
  }
}
```

### Events You Emit
- `plan_generated` - When execution plan created
- `phase_started` - When assigning phase to specialist
- `progress_update` - Hourly to track completion

### Events You Listen For
- `implementation_complete` - From any specialist
- `blocker_detected` - From any specialist
- `quality_check_complete` - From agent-quality

### Success Checklist (Cycle 1-10)
- [ ] Feature library with 20+ features
- [ ] Dependency resolution algorithm
- [ ] Cycle mapping working
- [ ] Estimate calculation accurate (±10%)
- [ ] Real-time progress tracking functional
- [ ] Parallel execution detection working

---

## Agent-Backend (3x Specialists)

**Your Role:** Backend CRUD Implementation (Divide work 3 ways)
**Work:** Cycle 31-60 (PARALLEL), Cycle 71-80, Cycle 11-20, Cycle 21-30 (Already done)
**Total Duration:** 8 weeks
**Total Effort:** 195 hours (across 3 specialists)

### Division of Labor

**Specialist 1: Core Entities (Cycle 31-40)**
- creator
- ai_clone
- audience_member
- organization

**Specialist 2: Content Entities (Cycle 41-50)** [PARALLEL]
- blog_post
- course
- lesson
- product
- membership

**Specialist 3: Tokens & Agents (Cycle 51-60)** [PARALLEL]
- token
- token_contract
- business_agent
- workflow

### Core Implementation Pattern

```typescript
// For each entity type:

// 1. Create Convex mutation using ThingService
export const createEntity = mutation({
  args: { groupId: v.id("groups"), type: v.string(), properties: v.any() },
  handler: async (ctx, args) => {
    // Use ThingService (not direct DB!)
    const program = Effect.gen(function* () {
      const thingService = yield* ThingService
      const entityId = yield* thingService.create(args.type, args)
      return entityId
    })

    return await Effect.runPromise(
      program.pipe(Effect.provide(ServicesLayer))
    )
  }
})

// 2. Add event logging (automatic via service)
// 3. Enforce group scoping (in service)
// 4. Add rate limiting
// 5. Write unit tests

// Result: Backend CRUD for all types using consistent pattern
```

### Weeks 5-6: Advanced (Cycle 71-80)

After CRUD complete, implement:
- RAG chunking service (800 tokens, 200 overlap)
- OpenAI embedding integration
- Vector search implementation
- Knowledge label system
- Remaining 30+ entity types

### Your Responsibilities

✅ **Implement CRUD for assigned entity types**
✅ **Use ThingService (not direct DB calls)**
✅ **Add event logging to all mutations**
✅ **Enforce group scoping**
✅ **Add rate limiting**
✅ **Write unit tests (target: 90% coverage)**
✅ **Coordinate with frontend** (via DataProvider interface)
✅ **Daily sync with other backend specialists** (share patterns, prevent conflicts)

### Events You Emit
- `schema_ready` - When schema updated
- `mutation_complete` - When entity CRUD done
- `implementation_complete` - When all tasks done
- `progress_update` - Hourly

### Events You Listen For
- `phase_started` - When director assigns your phase
- `schema_ready` - From other backend specialists (if implementing together)
- `blocker_detected` - Alert problem-solver

### Success Checklist

**Per Entity Type:**
- [ ] Create mutation working
- [ ] Read query working
- [ ] Update mutation working
- [ ] Delete mutation working
- [ ] Event logging automatic
- [ ] Group scoping enforced
- [ ] Unit tests passing (3+ per operation)

**For All Assigned Types:**
- [ ] 100% CRUD coverage for assigned types
- [ ] All mutations use ThingService
- [ ] All operations logged
- [ ] Tests passing
- [ ] Code reviewed by peers

---

## Agent-Frontend

**Your Role:** UI/UX Implementation
**Work:** Cycle 61-70 (Frontend Dashboard & Entity Management UI)
**Duration:** 2-3 weeks (parallel with backend)
**Effort:** 40 hours

### What You Build (Cycle 61-70)

1. **Multi-Tenant Dashboard**
   - Group hierarchy selector (tree view)
   - Navigation between groups
   - Summary statistics

2. **Entity Management UI**
   - Forms for all entity types
   - List/grid views
   - Sorting/filtering

3. **Real-Time Features**
   - Live updates via subscriptions
   - Event timeline
   - Real-time stats

4. **Advanced UI**
   - Connection graph visualization
   - Relationship editor
   - Advanced search

### Implementation Approach

```typescript
// Use mock providers while backend develops
const mockProvider = createMockDataProvider({
  things: {
    create: async (input) => `thing_${Math.random()}`,
    list: async (type) => [/* mock data */],
    get: async (id) => ({ id, type: "course", name: "Sample" }),
    update: async (id, data) => id,
    delete: async (id) => true
  }
})

// Build UI with mocks
export function CreateEntityForm() {
  const { run } = useEffectRunner()

  const handleSubmit = async (data) => {
    const program = Effect.gen(function* () {
      const service = yield* ThingService
      return yield* service.create(data.type, data)
    })

    const id = await run(program)
  }
}

// Swap to real backend when ready (ONE line change!)
const realProvider = createConvexProvider()
```

### Key Components to Build

```typescript
// Core Components
<GroupSelector />        // Hierarchy navigator
<EntityForm />          // Dynamic form for any entity type
<EntityList />          // Sortable, filterable list
<EntityDetail />        // Single entity view

// Advanced Components
<ConnectionGraph />     // Relationship visualizer
<EventTimeline />       // Action history
<RealtimeStats />       // Live metrics dashboard
<RoleSelector />        // Access control UI

// Forms for Each Type
<CreatorForm />
<CourseForm />
<ProductForm />
<MembershipForm />
// ... for all 66 types
```

### Your Responsibilities

✅ **Build responsive UI components**
✅ **Implement real-time updates**
✅ **Add role-based access control**
✅ **Optimize performance (FCP <2s)**
✅ **Write component tests**
✅ **Use mock providers initially**
✅ **Integrate real backend weekly**
✅ **Ensure accessibility (WCAG 2.1)**

### Events You Listen For
- `schema_ready` - Backend ready for integration
- `mutation_complete` - When CRUD done, integrate into UI
- `phase_started` - When director assigns your phase

### Success Checklist
- [ ] Multi-tenant dashboard working
- [ ] Entity forms for all core types
- [ ] Real-time updates functional
- [ ] Connection graph displays correctly
- [ ] Role-based UI hiding working
- [ ] Component tests passing
- [ ] Lighthouse score >90

---

## Agent-Designer

**Your Role:** Design & UX Strategy
**Work:** Design System & Wireframes (Cycle 61-70 prep)
**Duration:** 2-3 weeks (parallel)
**Effort:** 20 hours

### What You Create

1. **Design System**
   - Color palette
   - Typography system
   - Component tokens
   - Spacing grid

2. **Wireframes**
   - Multi-tenant dashboard
   - Entity forms
   - List views
   - Detail views

3. **Design Patterns**
   - Form patterns
   - Navigation patterns
   - Real-time update patterns
   - Error states

### Your Responsibilities

✅ **Create wireframes for major views**
✅ **Define design system & tokens**
✅ **Ensure accessibility compliance**
✅ **Design responsive layouts**
✅ **Create interaction patterns**
✅ **Test with stakeholders**

### Deliverables
- High-fidelity wireframes (Figma)
- Design system documentation
- Component specification
- Accessibility guidelines
- Responsive breakpoints

### Success Checklist
- [ ] Wireframes complete for dashboard
- [ ] Design system documented
- [ ] Color palette defined
- [ ] Typography system defined
- [ ] Accessibility checklist passed
- [ ] Responsive design verified

---

## Agent-Quality

**Your Role:** Testing & Quality Assurance
**Work:** Cycle 81-90 (Comprehensive Testing)
**Duration:** 3 weeks
**Effort:** 50 hours

### What You Test

1. **Unit Tests**
   - All services (ThingService, ConnectionService, etc.)
   - All entity types (66+)
   - All connection types (25+)
   - All event types (67+)

2. **Integration Tests**
   - Services working together
   - Event logging integration
   - Provider swapping
   - Multi-backend compatibility

3. **E2E Tests**
   - User workflows
   - Real-time features
   - Connection visualization
   - Search functionality

4. **Performance Tests**
   - FCP <2s
   - API response <100ms
   - Database queries optimized
   - Memory leaks check

### Testing Strategy

```typescript
describe("ThingService", () => {
  // Test with multiple providers
  const providers = [ConvexProviderMock, SupabaseProviderMock, WordPressProviderMock]

  providers.forEach(provider => {
    describe(`with ${provider.name}`, () => {
      it("should create entity", async () => {
        const result = await testWithProvider(provider, async () => {
          const thingService = yield* ThingService
          return yield* thingService.create("course", { name: "Test" })
        })
        expect(result).toBeDefined()
      })
    })
  })
})
```

### Coverage Targets
- Backend services: 90%
- Frontend components: 70%
- Integration tests: 100% happy path
- E2E tests: Critical workflows

### Your Responsibilities

✅ **Achieve 90% backend coverage**
✅ **Test all entity types**
✅ **Test all connection types**
✅ **Test all event types**
✅ **Implement mock providers**
✅ **Test provider swapping**
✅ **Performance testing & optimization**
✅ **Create test documentation**

### Events You Emit
- `quality_check_started` - When testing phase begins
- `test_passed` - Per test completion
- `test_failed` - Alert problem-solver
- `quality_check_complete` - With status (approved/needs_fix)

### Events You Listen For
- `implementation_complete` - From specialists
- `schema_ready` - Backend ready to test
- `blocker_resolved` - Continue testing after fix

### Success Checklist
- [ ] 90% backend coverage achieved
- [ ] All entity type tests passing
- [ ] Multi-backend tests green
- [ ] Provider swapping working
- [ ] Performance baselines met
- [ ] Accessibility tests passing

---

## Agent-Ops

**Your Role:** Deployment & Infrastructure
**Work:** Cycle 91-100 (Production Deployment)
**Duration:** 2 weeks
**Effort:** 30 hours

### What You Deploy

1. **Frontend**
   - Build Astro project
   - Deploy to Cloudflare Pages
   - Configure web.one.ie domain

2. **Backend**
   - Deploy to Convex Cloud
   - Configure environment variables
   - Set up monitoring

3. **Infrastructure**
   - Set up monitoring & alerting
   - Configure SSL/TLS
   - Configure DNS
   - Set up CI/CD

### Deployment Process

```bash
# Week 10: Pre-Production Setup
./scripts/pre-deployment-check.sh
wrangler pages project create web
# Set up monitoring dashboard

# Week 11: Production Deployment
# 1. Deploy backend
npx convex deploy

# 2. Build frontend
cd web && bun run build

# 3. Deploy frontend (canary: 10% traffic)
wrangler pages deploy dist --project-name=web

# 4. Monitor
# Dashboard shows 0 errors? Yes → 50% traffic
# Dashboard shows 0 errors? Yes → 100% traffic

# 5. Verify
npm view oneie version
curl -I https://web.one.ie
```

### Your Responsibilities

✅ **Finalize production environment**
✅ **Set up monitoring & alerting**
✅ **Deploy to Cloudflare Pages**
✅ **Deploy backend to Convex**
✅ **Configure custom domains**
✅ **Execute canary deployment**
✅ **Monitor post-deployment**
✅ **Implement rollback if needed**

### Events You Emit
- `staging_ready` - Staging environment prepared
- `deployment_pipeline_ready` - Pipeline tested
- `monitoring_configured` - Alerts active
- `production_ready` - Ready for go-live
- `deployment_initiated` - Starting production
- `deployment_completed` - Live!

### Events You Listen For
- `quality_check_complete` - With status approved
- `phase_started` - When director assigns deployment

### Success Checklist
- [ ] Frontend deployed to production
- [ ] Backend deployed to production
- [ ] Monitoring & alerting active
- [ ] Custom domains working
- [ ] SSL/TLS configured
- [ ] Zero-downtime deployment verified
- [ ] Rollback plan tested

---

## Agent-Problem-Solver

**Your Role:** Blocker Resolution
**Work:** On-demand (as blockers emerge)
**Duration:** Variable
**Effort:** As needed

### What You Do

When `blocker_detected` event arrives:

1. **Analyze** the blocker
   - Root cause analysis
   - Impact assessment
   - Dependency check

2. **Propose** solution
   - Technical fix
   - Workaround
   - Optimization

3. **Fix** the issue
   - Implement solution
   - Verify fix works
   - Test integration

4. **Emit** `blocker_resolved` event
   - Blocked specialist resumes work
   - Director updates timeline

### Common Blockers

```typescript
// Type 1: Dependency Issues
"Specialist A needs output from Specialist B"
→ Check schedule, reorder if possible, or provide mock

// Type 2: Technical Issues
"Convex schema migration failed"
→ Rollback, debug, reapply with fixes

// Type 3: Performance Issues
"API responses taking >500ms"
→ Profile queries, add indexes, optimize service

// Type 4: Compatibility Issues
"Frontend component not working with backend"
→ Check interface alignment, update if needed

// Type 5: Testing Issues
"Multi-backend tests failing on Supabase provider"
→ Debug provider implementation, fix compatibility
```

### Your Responsibilities

✅ **Debug failed tests**
✅ **Analyze performance bottlenecks**
✅ **Propose optimizations**
✅ **Suggest architectural fixes**
✅ **Document solutions for future**

---

## Coordination Rules

### Daily Standup (15 min)
- **When:** Start of day
- **Who:** agent-director + all 6 specialists
- **Agenda:**
  1. Review yesterday's completions
  2. Identify any blockers
  3. Confirm today's assignments
  4. Adjust parallelism if needed

### Weekly Review (30 min)
- **When:** Thursday EOD
- **Who:** agent-director + all 6 specialists
- **Agenda:**
  1. Review progress vs plan
  2. Analyze velocity
  3. Adjust future estimates
  4. Celebrate wins
  5. Plan next week

### Event Communication
- All coordination via events
- No manual handoffs
- Real-time progress updates
- Immediate blocker escalation

### Code Review
- All code reviewed before merge
- Focus on: architecture, patterns, tests
- Daily reviews (not weekly)

---

## Key Files & References

### Plans
- **Master Coordination Plan:** `/Users/toc/Server/ONE/.claude/plans/MASTER-COORDINATION-PLAN.md`
- **Agent Director Plan:** `/Users/toc/Server/ONE/one/things/plans/agent-director-100-cycle-plans.md`
- **Unified Implementation:** `/Users/toc/Server/ONE/one/things/plans/unified-implementation-plan.md`
- **Big Plan:** `/Users/toc/Server/ONE/one/things/plans/big-plan.md`

### Architecture
- **Ontology:** `/Users/toc/Server/ONE/one/knowledge/ontology.md`
- **CLAUDE.md:** `/Users/toc/Server/ONE/CLAUDE.md`
- **AGENTS.md:** `/Users/toc/Server/ONE/web/AGENTS.md`
- **Workflow:** `/Users/toc/Server/ONE/one/connections/workflow.md`

### State Tracking
- **Cycle State:** `/.claude/state/cycle.json` (real-time updates)
- **Agent Definitions:** `/.claude/agents/*.md`

---

## Quick Links

| Specialist | Phase | Cycle | Duration | Effort | Status |
|-----------|-------|-------|----------|--------|--------|
| agent-director | Foundation | 1-10 | 2-3 days | 16h | To Start |
| agent-backend | Core CRUD | 31-40 | 1-2 weeks | 30h | To Start |
| agent-backend | Content CRUD | 41-50 | 1-2 weeks | 30h | To Start [PARALLEL] |
| agent-backend | Tokens CRUD | 51-60 | 1-2 weeks | 35h | To Start [PARALLEL] |
| agent-frontend | Frontend UI | 61-70 | 2-3 weeks | 40h | To Start |
| agent-designer | Design System | 61-70 | 2-3 weeks | 20h | To Start |
| agent-backend | RAG & Advanced | 71-80 | 2 weeks | 45h | To Start |
| agent-quality | Testing | 81-90 | 3 weeks | 50h | To Start |
| agent-ops | Deployment | 91-100 | 2 weeks | 30h | To Start |

---

**Remember:** You're part of a coordinated team executing ONE Platform. Communication, collaboration, and clear handoffs make this succeed.

**Questions?** Check the master coordination plan or ask agent-director.

**Let's build something amazing.**
