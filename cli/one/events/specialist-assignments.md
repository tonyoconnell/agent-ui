# Specialist Agent Assignments for 9 Todo Files v1.0.0

**Purpose:** Explicitly assign each todo file to specialist agents with clear responsibilities
**Coordination:** Engineering Director orchestrates via events
**Parallel Execution:** Multiple agents working simultaneously on different files

---

## ASSIGNMENT MATRIX

### Legend
- **🔴 Primary** - Lead specialist, owns delivery
- **🟡 Secondary** - Collaborates, handles specific domain
- **🟢 Tertiary** - Supports, tests, documents

---

## DETAILED ASSIGNMENTS

### 1. TODO-ONBOARD.MD

**Execution Wave:** 1 (Foundation - immediate start)
**Duration:** 2 weeks
**Checkpoint:** Phase 6 (testing) complete before Wave 2 start

#### Primary: agent-backend 🔴

**Responsibilities:**
- User registration and authentication flows
- Email verification + password reset
- Wallet connection backend logic
- Organization/team creation services
- Role-based access control implementation
- Convex schema design and mutations
- Session management

**Deliverables:**
- `backend/convex/services/user-service.ts`
- `backend/convex/services/organization-service.ts`
- `backend/convex/services/team-service.ts`
- `backend/convex/mutations/users.ts`
- `backend/convex/queries/users.ts`
- `backend/convex/queries/organizations.ts`

**Cycle Focus:** 11-20 (backend services), 31-40 (wallet integration), 41-50 (preferences)

#### Secondary: agent-frontend 🟡

**Responsibilities:**
- Registration and login UI
- Wallet setup component
- Organization creation form
- Team management interface
- User preferences page
- Onboarding flow choreography
- Mobile responsiveness

**Deliverables:**
- `web/src/components/features/RegistrationForm.tsx`
- `web/src/components/features/WalletSetup.tsx`
- `web/src/components/features/OrganizationCreation.tsx`
- `web/src/components/features/TeamManagement.tsx`
- `web/src/pages/onboarding/index.astro`
- `web/src/pages/account/settings.astro`

**Cycle Focus:** 21-30 (frontend components), 61-70 (design/accessibility)

#### Tertiary: agent-designer 🟢

**Responsibilities:**
- Onboarding flow UX design
- Form validation UX
- Error messaging
- Accessibility audit (WCAG)
- Dark mode design
- Mobile wireframes
- Design system alignment

**Deliverables:**
- Wireframes for registration flow
- Accessibility checklist
- Mobile responsive test report
- Design tokens for onboarding screens

**Cycle Focus:** 61-70 (design refinement), 67 (accessibility)

---

### 2. TODO-AGENTS.MD

**Execution Wave:** 2 (Start when onboard Phase 2 complete)
**Duration:** 2 weeks
**Checkpoint:** Agent execution working before Wave 3

#### Primary: agent-builder 🔴

**Responsibilities:**
- Agent deployment framework
- Agent state management
- ElizaOS integration (core)
- CopilotKit integration (core)
- Agent cloning and fine-tuning
- Inter-agent communication protocol
- Agent execution engine

**Deliverables:**
- `backend/convex/services/agent-execution-service.ts`
- `backend/convex/services/agent-state-service.ts`
- `backend/convex/services/elizaos-integration.ts`
- `backend/convex/services/copilotkit-integration.ts`
- `backend/convex/protocols/agent-protocol.ts`
- `backend/convex/mutations/agents.ts`

**Cycle Focus:** 11-20 (framework), 31-50 (integrations + mechanics)

#### Secondary: agent-integrator 🟡

**Responsibilities:**
- ElizaOS protocol integration
- CopilotKit protocol adapter
- HTTP webhook integration
- WebSocket support for real-time agent communication
- Agent marketplace integration
- External provider communication
- Protocol documentation

**Deliverables:**
- `backend/convex/protocols/elizaos-integration.ts`
- `backend/convex/protocols/copilotkit-integration.ts`
- `backend/convex/services/webhook-handler.ts`
- Integration test suite

**Cycle Focus:** 31-50 (integrations), 51-60 (integration tests)

#### Tertiary: agent-ops 🟢

**Responsibilities:**
- Agent deployment infrastructure (Docker, serverless)
- Agent resource limits
- Agent monitoring and logging
- Deployment automation
- Rollback procedures
- Performance monitoring

**Deliverables:**
- Deployment scripts
- Monitoring dashboard
- Deployment documentation
- Resource limit configuration

**Cycle Focus:** 71-90 (optimization, deployment)

---

### 3. TODO-SKILLS.MD

**Execution Wave:** 2 (Parallel with agents, start when onboard Phase 2 complete)
**Duration:** 2 weeks
**Checkpoint:** Skill verification working for agent discovery

#### Primary: agent-builder 🔴

**Responsibilities:**
- Skill system architecture
- Skill creation flows
- Skill verification logic
- Skill-based matching algorithm
- Skill embeddings for semantic search
- Skill taxonomy design
- Convex schema for skills

**Deliverables:**
- `backend/convex/services/skill-service.ts`
- `backend/convex/services/skill-matching-service.ts`
- `backend/convex/protocols/skill-protocol.ts`
- `backend/convex/mutations/skills.ts`
- `backend/convex/queries/skills.ts`

**Cycle Focus:** 11-20 (schema + services), 41-50 (matching engine), 51-60 (tests)

#### Secondary: agent-quality 🟡

**Responsibilities:**
- Skill verification criteria
- Peer review workflow
- Verification tests and validation
- Verification audit trail
- Rating system
- Endorsement logic
- Quality scoring

**Deliverables:**
- Skill verification test suite
- Verification workflow documentation
- Rating algorithm
- Endorsement logic

**Cycle Focus:** 51-60 (verification tests), 41-50 (verification logic)

#### Tertiary: agent-backend 🟢

**Responsibilities:**
- Skill data persistence
- Skill query optimization
- Skill indexing
- Skill caching strategy
- Permission checks for skill management

**Deliverables:**
- Convex indexes on skill tables
- Query optimization
- Caching configuration

**Cycle Focus:** 11-20 (schema), 71-80 (optimization)

---

### 4. TODO-SELL.MD

**Execution Wave:** 2 (Parallel with agents/skills, start when onboard Phase 2 complete)
**Duration:** 2 weeks
**Checkpoint:** GitHub integration verified before Wave 3

#### Primary: agent-integrator 🔴

**Responsibilities:**
- GitHub OAuth integration
- GitHub API integration (repos, permissions, webhooks)
- Repository access verification
- Token generation and management
- Rate limiting per customer
- Webhook logging and audit trail
- GitHub-to-Convex data sync

**Deliverables:**
- `backend/convex/services/github-integration-service.ts`
- `backend/convex/services/github-webhook-handler.ts`
- `backend/convex/mutations/github-repos.ts`
- `backend/convex/queries/github-repos.ts`
- GitHub OAuth callback handler

**Cycle Focus:** 11-20 (schema), 31-50 (GitHub integration), 71-80 (optimization)

#### Secondary: agent-backend 🟡

**Responsibilities:**
- Access control logic
- API key management
- Usage tracking database design
- Revenue calculation
- Permission validation
- Access grant persistence
- Audit logging

**Deliverables:**
- `backend/convex/services/access-control-service.ts`
- `backend/convex/services/usage-tracking-service.ts`
- `backend/convex/services/revenue-calculation-service.ts`
- Convex mutations for access grants

**Cycle Focus:** 11-20 (schema), 41-50 (access control + revenue)

#### Tertiary: agent-quality 🟡

**Responsibilities:**
- Access control tests
- GitHub integration tests
- Usage tracking validation
- Revenue calculation tests
- Permission verification tests
- Security tests (no unauthorized access)

**Deliverables:**
- Access control test suite
- GitHub integration test cases
- Revenue calculation test fixtures

**Cycle Focus:** 51-60 (testing)

---

### 5. TODO-ECOMMERCE.MD

**Execution Wave:** 3 (Start when onboard complete)
**Duration:** 2 weeks
**Checkpoint:** Checkout functional before Wave 3 end

#### Primary: agent-frontend 🔴

**Responsibilities:**
- Product catalog page
- Product detail pages
- Shopping cart component
- Checkout flow UI
- Product image gallery
- Product filtering and search
- Mobile-responsive design
- Responsive checkout on mobile

**Deliverables:**
- `web/src/pages/shop/index.astro` (catalog)
- `web/src/pages/shop/[productId].astro` (detail)
- `web/src/components/features/ProductCard.tsx`
- `web/src/components/features/ShoppingCart.tsx`
- `web/src/components/features/CheckoutFlow.tsx`
- `web/src/pages/account/orders.astro`

**Cycle Focus:** 21-30 (components), 61-70 (design), 68 (mobile)

#### Secondary: agent-backend 🟡

**Responsibilities:**
- Product service (CRUD)
- Cart service (add/remove/update)
- Order service (creation, tracking)
- Inventory service (stock tracking)
- Discount/coupon application
- Order fulfillment workflow
- Refund logic (future)

**Deliverables:**
- `backend/convex/services/product-service.ts`
- `backend/convex/services/cart-service.ts`
- `backend/convex/services/order-service.ts`
- `backend/convex/services/inventory-service.ts`
- `backend/convex/mutations/products.ts`
- `backend/convex/mutations/orders.ts`

**Cycle Focus:** 11-20 (schema), 31-40 (checkout), 41-50 (fulfillment)

#### Tertiary: agent-integrator 🟡

**Responsibilities:**
- Stripe integration (alternative payment)
- X402 integration (micropayments)
- Payment gateway orchestration
- Order status webhooks
- Inventory sync with fulfillment service
- Email notification integration (order confirmed, shipped, etc.)

**Deliverables:**
- `backend/convex/services/payment-orchestration-service.ts`
- Stripe webhook handler
- X402 payment handler
- Email notification templates

**Cycle Focus:** 31-40 (payment integration), 41-50 (fulfillment)

---

### 6. TODO-API.MD

**Execution Wave:** 3 (Parallel with e-commerce, start when onboard complete)
**Duration:** 2 weeks
**Checkpoint:** API documented and tested before Wave 4

#### Primary: agent-integrator 🔴

**Responsibilities:**
- REST API design (OpenAPI/Swagger)
- API endpoint implementation
- Authentication scheme design
- Rate limiting implementation
- Webhook system design and implementation
- Error handling standardization
- API versioning strategy
- SDK generation setup

**Deliverables:**
- `web/src/pages/api/v1/[...path].ts` (catch-all)
- `web/src/pages/api/v1/auth/login.ts`
- `web/src/pages/api/v1/users/index.ts`
- `web/src/pages/api/v1/products/index.ts`
- `web/src/pages/api/v1/orders/index.ts`
- Webhook delivery service
- OpenAPI schema file

**Cycle Focus:** 11-20 (auth), 31-40 (endpoints + rate limiting), 41-50 (webhooks)

#### Secondary: agent-quality 🟡

**Responsibilities:**
- API contract tests
- Authentication scheme testing
- Rate limit testing
- Error response validation
- Webhook delivery reliability tests
- SDK compatibility tests
- Performance/load tests
- Security tests (API key validation, etc.)

**Deliverables:**
- API test suite
- Contract test definitions
- Rate limit test cases
- Webhook reliability tests

**Cycle Focus:** 51-60 (quality testing), 59 (performance testing)

#### Tertiary: agent-backend 🟡

**Responsibilities:**
- Convex query optimization for API
- Pagination implementation
- Filtering and sorting logic
- Authentication token management
- Rate limit data storage
- Webhook event logging

**Deliverables:**
- Optimized Convex queries
- Pagination helpers
- Rate limit tracking schema

**Cycle Focus:** 11-20 (auth), 71-80 (optimization)

---

### 7. TODO-FEATURES.MD

**Execution Wave:** 3 (Start midway, when e-commerce schema done)
**Duration:** 2 weeks
**Checkpoint:** Analytics dashboard working before Wave 4

#### Primary: agent-frontend 🔴

**Responsibilities:**
- Analytics dashboard UI
- Real-time notification display
- Semantic search interface
- Recommendation feed UI
- Social interaction components (like, share, comment buttons)
- Activity feed
- Trending content display
- Leaderboards

**Deliverables:**
- `web/src/pages/dashboard/analytics.astro`
- `web/src/pages/discover/index.astro`
- `web/src/pages/activity/feed.astro`
- `web/src/components/features/AnalyticsDashboard.tsx`
- `web/src/components/features/SemanticSearch.tsx`
- `web/src/components/features/RecommendationFeed.tsx`
- `web/src/components/features/SocialCard.tsx`

**Cycle Focus:** 21-30 (components), 61-70 (design), 81-90 (deployment)

#### Secondary: agent-backend 🔴

**Responsibilities:**
- Analytics data collection and aggregation
- Notification service
- Search indexing and querying
- Recommendation algorithm
- Social interaction storage (follows, likes, shares, comments)
- Activity event logging
- Trending computation
- Leaderboard calculation

**Deliverables:**
- `backend/convex/services/analytics-service.ts`
- `backend/convex/services/notification-service.ts`
- `backend/convex/services/search-service.ts`
- `backend/convex/services/recommendation-service.ts`
- `backend/convex/services/social-service.ts`
- Analytics event logging
- Trending algorithm

**Cycle Focus:** 11-20 (schema), 31-40 (search/recs), 41-50 (algorithms)

#### Tertiary: agent-integrator 🟡

**Responsibilities:**
- RAG (Retrieval-Augmented Generation) integration for search
- Vector embedding service integration
- Notification delivery integration (email, push, in-app)
- Social event webhook integration
- Analytics data export (CSV, JSON)
- External recommendation service integration (optional)

**Deliverables:**
- RAG service wrapper
- Embedding service client
- Notification delivery abstraction
- Data export service

**Cycle Focus:** 31-40 (RAG), 41-50 (notifications + social)

---

### 8. TODO-ONE-IE.MD

**Execution Wave:** 4 (Start when Waves 1-3 have content to showcase)
**Duration:** 2 weeks
**Checkpoint:** Public site live before v2.0.0 release

#### Primary: agent-designer 🔴

**Responsibilities:**
- Brand identity design (colors, typography, voice)
- Design system creation
- Marketing site wireframes
- Dashboard UI/UX design
- Component library design
- Accessibility design (WCAG 2.1 AA)
- Mobile responsive design
- Design token documentation

**Deliverables:**
- Brand guide document
- Design system (colors, typography, spacing)
- Wireframes for all pages
- Component library specifications
- Design tokens CSS
- Accessibility audit checklist

**Cycle Focus:** 61-70 (design system), 67 (accessibility), 68 (mobile)

#### Secondary: agent-frontend 🔴

**Responsibilities:**
- Marketing site implementation
- Creator dashboard implementation
- Admin dashboard implementation
- Landing page
- Features page
- Pricing page
- Documentation site
- Tutorial/course pages
- Blog implementation
- SEO optimization

**Deliverables:**
- `web/src/pages/index.astro` (landing)
- `web/src/pages/features.astro`
- `web/src/pages/pricing.astro`
- `web/src/pages/docs/index.astro`
- `web/src/pages/docs/api.astro`
- `web/src/pages/tutorials/[slug].astro`
- `web/src/pages/blog/[slug].astro`
- `web/src/pages/dashboard/creator/index.astro`
- `web/src/pages/dashboard/admin/index.astro`
- Content structure and taxonomy

**Cycle Focus:** 21-30 (pages), 61-70 (design implementation), 81-90 (deployment)

#### Tertiary: agent-ops 🟢

**Responsibilities:**
- Production deployment
- CDN configuration
- Performance optimization (Lighthouse)
- Monitoring and alerting
- Analytics integration (tracking)
- SEO monitoring
- Uptime monitoring
- Deployment automation

**Deliverables:**
- Deployment scripts
- CI/CD pipeline configuration
- Monitoring dashboard
- Performance report

**Cycle Focus:** 81-90 (deployment), 71-80 (optimization)

---

## EXECUTION SCHEDULE

### Week 1-2: Wave 1 (Foundation)
```
agent-backend:   todo-onboard.md Cycle 1-50 ████████░░
agent-frontend:  todo-onboard.md Cycle 1-50 ████████░░
agent-designer:  todo-onboard.md Cycle 1-20 ██░░░░░░░░
```

### Week 3-4: Wave 2 (Integration Layer)
```
agent-builder:   todo-agents.md Cycle 1-100 ██████████
agent-integrator: todo-sell.md Cycle 1-100 ██████████
agent-builder:   todo-skills.md Cycle 1-100 ██████████
agent-backend:   todo-onboard.md Cycle 51-100 ████████░░
```

### Week 5-6: Wave 3 (Platform Layer)
```
agent-frontend:  todo-ecommerce.md Cycle 1-100 ██████████
agent-integrator: todo-api.md Cycle 1-100 ██████████
agent-frontend:  todo-features.md Cycle 1-100 ██████████
agent-backend:   todo-ecommerce.md Cycle 11-50 ███░░░░░░░
```

### Week 7-8: Wave 4 (Presentation)
```
agent-designer:  todo-one-ie.md Cycle 1-100 ██████████
agent-frontend:  todo-one-ie.md Cycle 21-100 ██████████
agent-ops:       todo-one-ie.md Cycle 81-100 ████████░░
```

---

## COORDINATION POINTS

### Daily Standup (10 min)
Each specialist reports:
- Yesterday: What was completed
- Today: What will be built
- Blockers: Any dependencies or issues

### Weekly Sync (30 min)
All specialists review:
- Progress against cycle targets
- Cross-file dependencies
- Test coverage metrics
- Deployment readiness

### Wave Kickoff Meeting
- Review wave objectives
- Confirm assignments
- Clarify dependencies
- Set success metrics

### Wave Completion Review
- Verify all cycles complete
- Code review sign-off
- Test coverage confirmation
- Deployment approval

---

## MONITORING DASHBOARD

```
SPECIALIST AGENT WORKLOAD

agent-backend:
├─ todo-onboard.md (100 infers, Waves 1-2)
├─ todo-agents.md (30% of work, Wave 2)
├─ todo-skills.md (20% of work, Wave 2)
├─ todo-sell.md (40% of work, Wave 2)
├─ todo-ecommerce.md (50% of work, Wave 3)
└─ todo-api.md (30% of work, Wave 3)
   TOTAL: 320 cycles across 6 files

agent-frontend:
├─ todo-onboard.md (50% of work, Waves 1-2)
├─ todo-ecommerce.md (100 infers, Wave 3)
├─ todo-features.md (100 infers, Wave 3)
└─ todo-one-ie.md (100 infers, Wave 4)
   TOTAL: 250 cycles across 4 files

agent-integrator:
├─ todo-agents.md (40% of work, Wave 2)
├─ todo-sell.md (100 infers, Wave 2)
├─ todo-ecommerce.md (30% of work, Wave 3)
├─ todo-api.md (100 infers, Wave 3)
└─ todo-features.md (40% of work, Wave 3)
   TOTAL: 270 cycles across 5 files

agent-builder:
├─ todo-agents.md (100 infers, Wave 2)
└─ todo-skills.md (100 infers, Wave 2)
   TOTAL: 200 cycles across 2 files (parallel)

agent-quality:
├─ todo-skills.md (30% of work, Wave 2)
├─ todo-sell.md (30% of work, Wave 2)
├─ todo-ecommerce.md (20% of work, Wave 3)
└─ todo-api.md (100 infers, Wave 3)
   TOTAL: 150 cycles across 4 files

agent-designer:
├─ todo-onboard.md (20% of work, Wave 1)
└─ todo-one-ie.md (100 infers, Wave 4)
   TOTAL: 110 cycles across 2 files

TOTAL PLATFORM WORK: 900 cycles across 9 files
```

---

## ESCALATION MATRIX

| Issue | Owner | Next | Escalate |
|-------|-------|------|----------|
| Cycle target missed | Specialist | Extend deadline or reduce scope | Director |
| Cross-file dependency blocked | Specialist A | Contact Specialist B, coordinate | Director |
| Test coverage < 80% | Specialist | Fix code + tests | Director |
| Performance baseline missed | Specialist | Optimize or adjust target | Director |
| Critical security issue | Specialist | Halt work, fix immediately | Director + Security |
| Deployment blocked | agent-ops | Fix issue, retry deployment | Director |

---

## SUCCESS METRICS PER SPECIALIST

### agent-backend
- [ ] 320 cycles completed across 6 files
- [ ] 80%+ test coverage on all services
- [ ] All schema migrations deployed
- [ ] Convex production validated
- [ ] Performance baselines met

### agent-frontend
- [ ] 250 cycles completed across 4 files
- [ ] All pages load < 3s on 4G
- [ ] 100 Lighthouse score on 3+ pages
- [ ] Mobile responsive (all breakpoints)
- [ ] Accessibility (WCAG 2.1 AA)

### agent-integrator
- [ ] 270 cycles completed across 5 files
- [ ] All external APIs integrated
- [ ] Rate limiting working
- [ ] Webhook delivery > 99% reliable
- [ ] SDK generation functional

### agent-builder
- [ ] 200 cycles completed across 2 files (parallel)
- [ ] ElizaOS agents deployable
- [ ] Skill matching algorithm working
- [ ] Agent orchestration functional
- [ ] Performance < 500ms per agent execution

### agent-quality
- [ ] 150 cycles completed across 4 files
- [ ] 80%+ coverage across platform
- [ ] All critical paths E2E tested
- [ ] Security tests passing
- [ ] Performance tests baseline established

### agent-designer
- [ ] 110 cycles completed across 2 files
- [ ] Design system documented
- [ ] All pages WCAG 2.1 AA compliant
- [ ] Mobile responsive tested
- [ ] Brand guidelines enforced

---

## HANDOFF CHECKLIST

Between waves, each specialist confirms:

```
☐ Code committed to main branch
☐ All tests passing
☐ Code review approved
☐ Documentation updated
☐ Metrics documented
☐ Performance baselines established
☐ Next specialist has access
☐ Dependencies documented
☐ Lessons learned captured
☐ Ready for next wave
```

---

**ASSIGNMENTS CONFIRMED AND READY FOR EXECUTION**

Each specialist knows their role, files, cycles, and deliverables. Coordination happens via daily standups and weekly syncs. Escalation path is clear to Engineering Director.

Begin Wave 1 immediately. ✓

