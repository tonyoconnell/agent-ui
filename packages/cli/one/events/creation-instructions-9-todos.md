# Creation Instructions: 9 Todo Files v1.0.0

**Purpose:** Detailed guide for creating each of the 9 todo files with consistent structure and ontology mapping
**Pattern:** Follow todo-x402.md structure exactly
**Timeline:** 4 hours per file (basic creation), 8 hours per file (full detailed planning)

---

## STANDARD TEMPLATE

Every file follows this exact structure:

```markdown
# ONE Platform: [VERTICAL] Roadmap v1.0.0

**Focus:** [Single sentence describing the vertical's core purpose]
**Scope:** [2-3 key outcomes that define success]
**Timeline:** 100 cycles (cycle-based planning, not time-based)
**Target:** [Who benefits: creators, agents, users, etc.]

---

## PHASE 1: FOUNDATION & SETUP (Cycle 1-10)

**Purpose:** Validate architecture, map to 6-dimension ontology, plan implementation

### Cycle 1: Validate Against 6-Dimension Ontology
### Cycle 2: Review Existing Infrastructure
### Cycle 3-10: Planning & Setup Tasks

---

## PHASE 2: [VERTICAL-SPECIFIC] (Cycle 11-20)

[Backend and schema work specific to vertical]

---

## PHASE 3: FRONTEND COMPONENTS & PAGES (Cycle 21-30)

[React components and Astro pages]

---

## PHASE 4: [VERTICAL-SPECIFIC] (Cycle 31-40)

[Integration or API work]

---

## PHASE 5: [VERTICAL-SPECIFIC MECHANICS] (Cycle 41-50)

[Core business logic specific to vertical]

---

## PHASE 6: QUALITY & TESTING (Cycle 51-60)

[Unit tests, integration tests, E2E tests]

---

## PHASE 7: DESIGN & REFINEMENT (Cycle 61-70)

[Wireframes, accessibility, responsive design]

---

## PHASE 8: PERFORMANCE & OPTIMIZATION (Cycle 71-80)

[Speed, efficiency, caching]

---

## PHASE 9: DEPLOYMENT & DOCUMENTATION (Cycle 81-90)

[Production deployment, user + developer docs]

---

## PHASE 10: KNOWLEDGE & LESSONS (Cycle 91-100)

[Ontology mapping, architecture docs, lessons learned]

---

## SUCCESS CRITERIA

[Vertical] is complete when:
- [ ] [Specific criterion 1]
- [ ] All tests passing (80%+ coverage)
- [ ] Performance baselines established
- [ ] Production deployment verified
- [ ] Documentation complete

---

## QUICK REFERENCE

**Files Created:**
- [List files to be created]

**Environment Variables:**
- [Required env vars]

**Tests to Write:**
- [Types of tests]

---

**Status:** Ready for execution.
```

---

## FILE-SPECIFIC CREATION GUIDES

### 1. TODO-ONBOARD.MD

**File Location:** `/one/things/todo-onboard.md`
**Lead Agent:** agent-backend
**Duration:** 2 weeks
**Dependencies:** (none - foundation)

**Vertical Description:**
"Onboarding creators, agents, and teams onto the ONE Platform"

**Focus Statement:**
"Enable users to register, create organizations, set up wallets, and form teams with role-based access control"

**Scope:**
- User registration (email + 2FA)
- Email verification + password reset
- Wallet connection (MetaMask, Rainbow Kit, etc.)
- Organization creation (hierarchical groups)
- Team management and invitations
- Role-based access (owner, member, viewer)
- First-time user experience (onboarding flows)
- User preferences and settings

**Ontology Mapping:**
- **Groups:** organizations, teams (hierarchical nesting)
- **People:** creator, user (role: platform_owner, org_owner, org_user, customer)
- **Things:** user, organization, wallet, invitation
- **Connections:** owns, part_of, belongs_to, invited_to
- **Events:** user_registered, email_verified, organization_created, team_created, user_joined
- **Knowledge:** onboarding_progress labels, user_preferences

**Phase 2 Name:** User Management & Authentication
**Phase 4 Name:** Organization & Team Setup
**Phase 5 Name:** Wallet Integration & Preferences

**Key Files to Create:**
- `backend/convex/services/user-service.ts`
- `backend/convex/services/organization-service.ts`
- `backend/convex/services/team-service.ts`
- `web/src/components/features/RegistrationForm.tsx`
- `web/src/components/features/WalletSetup.tsx`
- `web/src/components/features/OrganizationCreation.tsx`
- `web/src/pages/onboarding/index.astro`
- `web/src/pages/account/settings.astro`

**Cycle 1 Tasks:**
- [ ] Map onboarding to 6 dimensions
- [ ] Identify 3 use cases: solo creator, agency team, enterprise
- [ ] Review Better Auth setup
- [ ] Note existing Convex auth integration

**Cycle 11 Tasks:**
- [ ] Design user thing type (extend existing creator)
- [ ] Design organization thing type (group with properties)
- [ ] Design team thing type (nested group)
- [ ] Create UserService (Effect.ts)
- [ ] Create OrganizationService (Effect.ts)

**Cycle 21 Tasks:**
- [ ] Create RegistrationForm component
- [ ] Create WalletSetup component
- [ ] Create OrganizationCreation page
- [ ] Create TeamManagement component
- [ ] Create RoleAssignment UI

**Success Criteria:**
- [ ] Users can register with email + password
- [ ] Email verification flow works
- [ ] Wallet connection functional
- [ ] Organizations can be created
- [ ] Teams can be created with members
- [ ] Role-based access working
- [ ] Onboarding checklist displayed

---

### 2. TODO-AGENTS.MD

**File Location:** `/one/things/todo-agents.md`
**Lead Agent:** agent-builder
**Duration:** 2 weeks
**Dependencies:** todo-onboard.md (requires users), todo-x402.md (payments enable execution)

**Vertical Description:**
"Deploy and orchestrate AI agents from multiple frameworks (ElizaOS, AutoGen, CopilotKit)"

**Focus Statement:**
"Enable creators to deploy, configure, and execute AI agents while platform manages execution, state, and payment collection"

**Scope:**
- Agent deployment framework (Docker, serverless)
- ElizaOS integration (conversation agents)
- AutoGen integration (multi-agent orchestration)
- CopilotKit integration (copilot experiences)
- Agent cloning and fine-tuning
- Inter-agent communication
- State persistence and history
- Agent marketplace listing

**Ontology Mapping:**
- **Groups:** creator's organization owns agents
- **People:** creator (agent builder), executor (runs agent)
- **Things:** agent, external_agent (service provider), execution_result
- **Connections:** creates, owns, executes, communicates_with
- **Events:** agent_deployed, agent_executed, agent_completed, agent_failed
- **Knowledge:** agent_embeddings, skill_labels (what agent can do)

**Phase 2 Name:** Agent Framework & Schema
**Phase 4 Name:** ElizaOS + AutoGen Integration
**Phase 5 Name:** Agent Orchestration & State Management

**Key Files to Create:**
- `backend/convex/services/agent-execution-service.ts`
- `backend/convex/services/elizaos-integration.ts`
- `backend/convex/services/autogen-integration.ts`
- `web/src/components/features/AgentDeploymentForm.tsx`
- `web/src/components/features/AgentExecutionPanel.tsx`
- `web/src/components/features/AgentHistory.tsx`
- `web/src/pages/agents/[agentId]/index.astro`
- `web/src/pages/agents/marketplace.astro`

**Cycle 1 Tasks:**
- [ ] Map agents to 6 dimensions
- [ ] Identify 3 use cases: chatbot, autonomous worker, multi-agent system
- [ ] Review ElizaOS architecture
- [ ] Review CopilotKit documentation

**Cycle 11 Tasks:**
- [ ] Design agent thing type
- [ ] Design execution_result thing type
- [ ] Create AgentExecutionService (Effect.ts)
- [ ] Design state persistence schema

**Cycle 21 Tasks:**
- [ ] Create AgentDeploymentForm
- [ ] Create AgentExecutionPanel
- [ ] Create AgentHistory display
- [ ] Create AgentMarketplace page

**Success Criteria:**
- [ ] Agents can be deployed from creation form
- [ ] ElizaOS agents execute successfully
- [ ] Agent history tracked in Convex
- [ ] Inter-agent communication possible
- [ ] X402 payments collected per execution
- [ ] Execution results stored + queryable

---

### 3. TODO-SKILLS.MD

**File Location:** `/one/things/todo-skills.md`
**Lead Agent:** agent-builder
**Duration:** 2 weeks
**Dependencies:** todo-onboard.md (creators), todo-agents.md (agents have skills)

**Vertical Description:**
"Skill marketplace for creators and agents to showcase, verify, and discover capabilities"

**Focus Statement:**
"Enable creators to define skills, have them verified by community, and use skill-based matching for agent discovery and hiring"

**Scope:**
- Skill creation and definition
- Skill verification system (peer review)
- Skill marketplace and discovery
- Skill ratings and endorsements
- Skill-based matching (find agents/creators by skills)
- Skill categories and taxonomy
- Skill embedding for semantic search

**Ontology Mapping:**
- **Groups:** skills owned by creators
- **People:** creator (owner), verifier (peer reviewer), endorser
- **Things:** skill, verification_record
- **Connections:** owns, verifies, endorses, has_skill
- **Events:** skill_created, skill_verified, skill_endorsed, skill_rated
- **Knowledge:** skill_embeddings, skill_taxonomy, skill_labels

**Phase 2 Name:** Skill Schema & Verification System
**Phase 4 Name:** Skill Marketplace & Search
**Phase 5 Name:** Skill-Based Matching Engine

**Key Files to Create:**
- `backend/convex/services/skill-service.ts`
- `backend/convex/services/skill-verification-service.ts`
- `backend/convex/services/skill-matching-service.ts`
- `web/src/components/features/SkillCreationForm.tsx`
- `web/src/components/features/SkillVerificationQueue.tsx`
- `web/src/components/features/SkillMarketplace.tsx`
- `web/src/pages/skills/marketplace.astro`
- `web/src/pages/skills/my-skills.astro`

**Cycle 1 Tasks:**
- [ ] Map skills to 6 dimensions
- [ ] Identify 3 use cases: skill endorsement, agent matching, hiring
- [ ] Design skill categories and taxonomy
- [ ] Note verification criteria

**Cycle 11 Tasks:**
- [ ] Design skill thing type
- [ ] Design verification_record thing type
- [ ] Create SkillService (Effect.ts)
- [ ] Create SkillVerificationService (Effect.ts)

**Cycle 21 Tasks:**
- [ ] Create SkillCreationForm
- [ ] Create SkillMarketplace with filtering
- [ ] Create SkillCard component
- [ ] Create endorsement/rating UI

**Success Criteria:**
- [ ] Skills can be created and published
- [ ] Skills can be verified by community
- [ ] Skill marketplace searchable by name + category
- [ ] Skills ranked by rating
- [ ] Skill-based matching finds creators/agents
- [ ] Embeddings enable semantic search

---

### 4. TODO-SELL.MD

**File Location:** `/one/things/todo-sell.md`
**Lead Agent:** agent-integrator
**Duration:** 2 weeks
**Dependencies:** todo-onboard.md (creators), todo-x402.md (payments)

**Vertical Description:**
"GitHub marketplace for selling access to private repositories and code"

**Focus Statement:**
"Enable creators to monetize private GitHub repos by selling access through X402 micropayments and tracking usage"

**Scope:**
- GitHub repository integration and authentication
- Access control (who can access which repos)
- API key generation and management
- Revenue tracking and payouts
- Usage analytics per repository
- Marketplace listing and discovery
- Rate limiting per customer
- Webhook logging (audit trail)

**Ontology Mapping:**
- **Groups:** creator's org owns repos
- **People:** creator (seller), customer (buyer)
- **Things:** repository, api_key, access_grant, usage_record
- **Connections:** owns, grants_access, transacted (payment)
- **Events:** repo_listed, access_granted, usage_logged, payment_received
- **Knowledge:** repo_embeddings, category_labels (language, framework, etc.)

**Phase 2 Name:** GitHub Integration & Access Control
**Phase 4 Name:** Marketplace & Discovery
**Phase 5 Name:** Usage Tracking & Revenue Distribution

**Key Files to Create:**
- `backend/convex/services/github-integration-service.ts`
- `backend/convex/services/access-control-service.ts`
- `backend/convex/services/usage-tracking-service.ts`
- `web/src/components/features/GitHubRepoSelector.tsx`
- `web/src/components/features/AccessManagement.tsx`
- `web/src/components/features/RepoMarketplace.tsx`
- `web/src/pages/sell/repositories.astro`
- `web/src/pages/sell/marketplace.astro`

**Cycle 1 Tasks:**
- [ ] Map repo selling to 6 dimensions
- [ ] Identify 3 use cases: private course code, template library, tool access
- [ ] Review GitHub OAuth + API
- [ ] Note X402 payment integration

**Cycle 11 Tasks:**
- [ ] Design repository thing type
- [ ] Design access_grant thing type
- [ ] Create GitHubIntegrationService (Effect.ts)
- [ ] Create AccessControlService (Effect.ts)

**Cycle 21 Tasks:**
- [ ] Create GitHubRepoSelector
- [ ] Create RepoMarketplace with pricing
- [ ] Create AccessManagement dashboard
- [ ] Create UsageAnalytics display

**Success Criteria:**
- [ ] GitHub repos can be listed for sale
- [ ] Access control working (verified via API calls)
- [ ] X402 payments trigger access grants
- [ ] API keys can be generated + revoked
- [ ] Usage tracked per customer
- [ ] Revenue calculation accurate
- [ ] Marketplace filterable by language, stars, etc.

---

### 5. TODO-ECOMMERCE.MD

**File Location:** `/one/things/todo-ecommerce.md`
**Lead Agent:** agent-frontend
**Duration:** 2 weeks
**Dependencies:** todo-onboard.md (users), todo-x402.md (payments)

**Vertical Description:**
"Complete e-commerce platform for selling courses, products, and services"

**Focus Statement:**
"Enable creators to list products, manage inventory, process payments (X402 + Stripe), and fulfill orders"

**Scope:**
- Product creation and management
- Product catalog with filtering and search
- Shopping cart system
- Checkout flow (X402 + Stripe)
- Order management and fulfillment
- Inventory tracking
- Discount/coupon system
- Refund handling
- Sales analytics and reporting
- Email notifications (order confirmed, shipped, etc.)

**Ontology Mapping:**
- **Groups:** seller's organization owns products
- **People:** creator (seller), customer (buyer)
- **Things:** product, order, line_item, inventory, discount
- **Connections:** owns, purchased, fulfills
- **Events:** product_created, product_sold, order_placed, order_fulfilled, refund_issued
- **Knowledge:** product_embeddings, category_labels, product_recommendations

**Phase 2 Name:** Product Schema & Inventory Management
**Phase 4 Name:** Checkout & Payment Integration
**Phase 5 Name:** Order Fulfillment & Analytics

**Key Files to Create:**
- `backend/convex/services/product-service.ts`
- `backend/convex/services/cart-service.ts`
- `backend/convex/services/order-service.ts`
- `backend/convex/services/inventory-service.ts`
- `web/src/components/features/ProductCard.tsx`
- `web/src/components/features/ShoppingCart.tsx`
- `web/src/components/features/CheckoutFlow.tsx`
- `web/src/pages/shop/index.astro`
- `web/src/pages/shop/[productId].astro`
- `web/src/pages/account/orders.astro`

**Cycle 1 Tasks:**
- [ ] Map e-commerce to 6 dimensions
- [ ] Identify 3 use cases: course sales, digital products, services
- [ ] Review existing shop.astro
- [ ] Note Stripe integration requirements

**Cycle 11 Tasks:**
- [ ] Design product thing type
- [ ] Design order thing type
- [ ] Design inventory tracking
- [ ] Create ProductService (Effect.ts)
- [ ] Create OrderService (Effect.ts)

**Cycle 21 Tasks:**
- [ ] Create ProductCard component
- [ ] Create ProductListing page with filters
- [ ] Create ShoppingCart component
- [ ] Create CheckoutFlow modal

**Success Criteria:**
- [ ] Products can be created with images, descriptions, pricing
- [ ] Product catalog searchable and filterable
- [ ] Shopping cart functional (add, remove, update quantity)
- [ ] Checkout accepts X402 + Stripe
- [ ] Orders tracked in Convex
- [ ] Fulfillment status visible to customer + seller
- [ ] Sales dashboard shows metrics
- [ ] Refunds can be processed

---

### 6. TODO-API.MD

**File Location:** `/one/things/todo-api.md`
**Lead Agent:** agent-integrator
**Duration:** 2 weeks
**Dependencies:** todo-onboard.md (authentication), todo-x402.md (payment authentication)

**Vertical Description:**
"Public REST and optional GraphQL API for developers to build on ONE Platform"

**Focus Statement:**
"Provide comprehensive, well-documented, rate-limited public API for developers with SDK generation and authentication schemes"

**Scope:**
- REST API design (OpenAPI/Swagger)
- Authentication methods (API keys, OAuth, JWT)
- Rate limiting per tier
- Pagination, filtering, sorting
- Error handling and status codes
- Webhooks for events
- GraphQL schema (optional)
- SDK generation (JavaScript, Python, Go)
- API versioning strategy
- Documentation with examples

**Ontology Mapping:**
- **Groups:** API access scoped to organization
- **People:** API key holder has roles
- **Things:** api_key, api_token, webhook_subscription
- **Connections:** has_access, subscribed_to
- **Events:** api_call_made, webhook_triggered, rate_limit_exceeded
- **Knowledge:** api_request_embeddings (for search), endpoint_tags

**Phase 2 Name:** API Schema & Authentication
**Phase 4 Name:** Rate Limiting & Webhooks
**Phase 5 Name:** SDK Generation & Versioning

**Key Files to Create:**
- `backend/convex/services/api-service.ts`
- `backend/convex/services/rate-limiter.ts`
- `backend/convex/services/webhook-service.ts`
- `web/src/pages/api/v1/[...path].ts` (catch-all API routes)
- `web/src/pages/api/v1/auth/login.ts`
- `web/src/pages/api/v1/users/index.ts`
- `web/src/pages/api/v1/products/index.ts`
- `web/src/pages/docs/api.astro`
- `sdk-js/src/client.ts` (JavaScript SDK)

**Cycle 1 Tasks:**
- [ ] Map API to 6 dimensions
- [ ] Design API versioning strategy
- [ ] Identify 3 core use cases: product listing, agent execution, order creation
- [ ] Define rate limit tiers (free, pro, enterprise)

**Cycle 11 Tasks:**
- [ ] Design api_key thing type
- [ ] Design rate_limit tracking
- [ ] Create APIService (Effect.ts)
- [ ] Create RateLimiter (Effect.ts)

**Cycle 31 Tasks:**
- [ ] Implement REST endpoints for products
- [ ] Implement REST endpoints for users
- [ ] Implement REST endpoints for orders
- [ ] Implement authentication middleware

**Cycle 51 Tasks:**
- [ ] Write API contract tests
- [ ] Test rate limiting
- [ ] Test authentication schemes
- [ ] Test error responses

**Success Criteria:**
- [ ] REST API fully functional with OpenAPI docs
- [ ] All endpoints return correct status codes
- [ ] Rate limiting working per tier
- [ ] API keys can be created/revoked
- [ ] Webhooks deliver events reliably
- [ ] SDK generation working (JS + Python at minimum)
- [ ] API documentation complete with examples
- [ ] 80%+ test coverage

---

### 7. TODO-FEATURES.MD

**File Location:** `/one/things/todo-features.md`
**Lead Agent:** agent-frontend
**Duration:** 2 weeks
**Dependencies:** todo-ecommerce.md (product sales to analyze), todo-agents.md (agent execution to analyze)

**Vertical Description:**
"High-priority platform features: analytics, notifications, search, recommendations, social"

**Focus Statement:**
"Provide creators with insights into their business, discover new content through search and recommendations, and engage through social features"

**Scope:**
- Analytics dashboard (sales, traffic, engagement)
- Real-time notifications (order received, agent executed, etc.)
- Semantic search across all content
- Recommendation engine (products, creators, agents)
- Social features (follows, likes, shares, comments)
- User activity feed
- Trending content discovery
- Creator leaderboards
- Search filters and faceting

**Ontology Mapping:**
- **Groups:** analytics scoped to organization
- **People:** user (viewer of analytics), follower (social connection)
- **Things:** analytics_report, notification, search_result, recommendation
- **Connections:** follows, likes, shares, commented_on
- **Events:** page_viewed, search_performed, notification_sent, recommendation_clicked
- **Knowledge:** trending_embeddings, recommendation_vectors, content_embeddings

**Phase 2 Name:** Analytics Schema & Data Collection
**Phase 4 Name:** Search & Recommendations
**Phase 5 Name:** Social Features & Feed

**Key Files to Create:**
- `backend/convex/services/analytics-service.ts`
- `backend/convex/services/notification-service.ts`
- `backend/convex/services/search-service.ts`
- `backend/convex/services/recommendation-service.ts`
- `backend/convex/services/social-service.ts`
- `web/src/components/features/AnalyticsDashboard.tsx`
- `web/src/components/features/SemanticSearch.tsx`
- `web/src/components/features/RecommendationFeed.tsx`
- `web/src/components/features/SocialCard.tsx`
- `web/src/pages/dashboard/analytics.astro`
- `web/src/pages/discover/index.astro`
- `web/src/pages/activity/feed.astro`

**Cycle 1 Tasks:**
- [ ] Map features to 6 dimensions
- [ ] Identify 3 use cases: creator insights, content discovery, community engagement
- [ ] Review analytics requirements
- [ ] Note notification delivery channels

**Cycle 11 Tasks:**
- [ ] Design analytics data schema
- [ ] Design notification thing type
- [ ] Design social interaction schema
- [ ] Create AnalyticsService (Effect.ts)

**Cycle 21 Tasks:**
- [ ] Create AnalyticsDashboard component
- [ ] Create SemanticSearch interface
- [ ] Create RecommendationFeed
- [ ] Create SocialCard (likes, shares, comments)

**Success Criteria:**
- [ ] Analytics dashboard shows sales, traffic, engagement
- [ ] Real-time notifications delivered
- [ ] Semantic search returns relevant results
- [ ] Recommendations personalized per user
- [ ] Social features (follow, like, share) working
- [ ] Activity feed shows user's recent actions
- [ ] Trending content computed and displayed
- [ ] RAG working for semantic search

---

### 8. TODO-ONE-IE.MD

**File Location:** `/one/things/todo-one-ie.md`
**Lead Agent:** agent-designer
**Duration:** 2 weeks
**Dependencies:** All other files (showcases all features)

**Vertical Description:**
"ONE.IE public platform - marketing site, creator dashboard, admin dashboard"

**Focus Statement:**
"Provide beautiful marketing site showcasing platform capabilities, fully functional creator dashboard for managing all features, and admin tools for platform management"

**Scope:**
- Marketing website (landing, features, pricing, case studies, blog)
- Creator dashboard (view all their products, agents, skills, analytics)
- Admin dashboard (user management, payment disputes, platform health)
- Public APIs documentation
- Tutorial and course library
- Creator onboarding guide
- Brand guidelines and design system
- SEO optimization
- Social media integration

**Ontology Mapping:**
- **Groups:** platform (root group) contains all organizations
- **People:** visitors, creators, admins
- **Things:** blog_post, tutorial, case_study, marketing_page, dashboard
- **Connections:** part_of, documents, features
- **Events:** page_viewed, tutorial_started, creator_joined, marketing_campaign_launched
- **Knowledge:** marketing_embeddings, tutorial_embeddings, SEO_keywords

**Phase 2 Name:** Design System & Brand Tokens
**Phase 4 Name:** Marketing Pages & Landing
**Phase 5 Name:** Creator + Admin Dashboards

**Key Files to Create:**
- `web/src/styles/design-tokens.css` (Tailwind v4 tokens)
- `web/src/components/design-system/` (component library)
- `web/src/pages/index.astro` (landing)
- `web/src/pages/features.astro`
- `web/src/pages/pricing.astro`
- `web/src/pages/docs/index.astro`
- `web/src/pages/tutorials/[slug].astro`
- `web/src/pages/blog/[slug].astro`
- `web/src/pages/dashboard/creator/index.astro`
- `web/src/pages/dashboard/admin/index.astro`
- `/one/knowledge/brand-guide.md`

**Cycle 1 Tasks:**
- [ ] Map ONE.IE to 6 dimensions
- [ ] Identify 3 audiences: potential creators, existing creators, admins
- [ ] Design brand identity (colors, typography, voice)
- [ ] Outline marketing messaging

**Cycle 21 Tasks:**
- [ ] Create design system (tokens, components)
- [ ] Create landing page
- [ ] Create features page
- [ ] Create pricing page

**Cycle 31 Tasks:**
- [ ] Create creator dashboard layout
- [ ] Create admin dashboard
- [ ] Create documentation site
- [ ] Create tutorials section

**Success Criteria:**
- [ ] Marketing site live at ONE.IE
- [ ] Design system documented + reusable
- [ ] Creator dashboard shows all their features
- [ ] Admin dashboard functional for platform management
- [ ] API documentation complete
- [ ] Tutorials + case studies published
- [ ] SEO optimized (Lighthouse 90+)
- [ ] Mobile responsive
- [ ] Dark mode support

---

## QUICK FILE CHECKLIST

### Before Creating Each File

- [ ] File location confirmed: `/one/things/todo-<vertical>.md`
- [ ] Vertical focus statement written (1 sentence)
- [ ] 3 ontology use cases identified
- [ ] Dependencies documented
- [ ] Phase names customized for vertical
- [ ] Key files list prepared
- [ ] Specialist agents assigned
- [ ] GitHub issue created for execution

### During Creation

- [ ] 10 cycles per phase (100 total)
- [ ] Each cycle has checkboxes (3-5 tasks minimum)
- [ ] Ontology mapping explicit in Cycle 1
- [ ] Phase-specific names (not generic)
- [ ] Cross-references to other todo files
- [ ] Code examples where relevant
- [ ] Test requirements listed in Phase 6

### After Creation

- [ ] Read through for completeness
- [ ] Check for 100-cycle total
- [ ] Verify all phases present
- [ ] Confirm Success Criteria section complete
- [ ] Verify Quick Reference section
- [ ] Add to `/one/things/README.md` (index)
- [ ] Create GitHub issue for execution
- [ ] Schedule specialist kickoff meeting

---

## CROSS-REFERENCE PATTERN

When one todo file depends on another, document like this:

**In todo-agents.md Cycle 5:**
```
### Cycle 5: Review User Management
- [ ] See todo-onboard.md Cycle 11-20 (User thing type definition)
- [ ] Understand role-based access from todo-onboard.md
- [ ] Note: Users must exist before agents can be created
- [ ] Note: X402 payments from todo-x402.md enable agent execution
```

**In todo-ecommerce.md Phase 4:**
```
## PHASE 4: CHECKOUT & PAYMENT INTEGRATION (Cycle 31-40)

**Dependencies:**
- X402 payments: See todo-x402.md Cycle 31-50 (payment routes)
- Stripe integration: See todo-x402.md Phase 3 (alternative payment)
- User authentication: See todo-onboard.md Phase 2 (Better Auth)
```

---

## NUMBERING CONSISTENCY

Every cycle follows this pattern:

```markdown
### Cycle X: [Action Verb] [What Is Being Done]
- [ ] Subtask 1 (specific, actionable)
- [ ] Subtask 2 (specific, actionable)
- [ ] Subtask 3 (specific, actionable)
- [ ] Documentation/reference if needed
```

Example from X402:
```markdown
### Cycle 12: Create X402PaymentService (Effect.ts)
- [ ] Create `backend/convex/services/x402-payment.ts`
- [ ] Implement X402PaymentService class:
  ```typescript
  export class X402PaymentService extends Effect.Service<...>() {
    // Service methods
  }
  ```
- [ ] Implement core methods:
  - [ ] `createPaymentRequest()` → PaymentRequired
  - [ ] `verifyPayment()` → boolean
  - [ ] ... (list all)
- [ ] Document each method with types
- [ ] Reference `/one/connections/x402.md` Part 2 for code
```

---

## SUCCESS CRITERIA TEMPLATE

```markdown
## SUCCESS CRITERIA

[Vertical Name] is complete when:

- [ ] [Specific ontology criterion - how things are modeled]
- [ ] [Specific feature criterion - what works]
- [ ] [Specific integration criterion - how systems connect]
- [ ] [Specific user experience criterion - what user sees]
- [ ] All tests passing (80%+ coverage)
- [ ] Performance baselines established
- [ ] Production deployment verified
- [ ] Documentation complete
- [ ] Lessons learned captured
```

---

## TIMELINE ESTIMATES

| Phase | Typical Duration | Key Milestone |
|-------|-----------------|---------------|
| Phase 1 (Cycle 1-10) | 2-3 days | Foundation validated |
| Phase 2 (Cycle 11-20) | 3-4 days | Schema + services done |
| Phase 3 (Cycle 21-30) | 4-5 days | UI components working |
| Phase 4 (Cycle 31-40) | 4-5 days | Integrations done |
| Phase 5 (Cycle 41-50) | 4-5 days | Business logic complete |
| Phase 6 (Cycle 51-60) | 3-4 days | Tests passing |
| Phase 7 (Cycle 61-70) | 3-4 days | Design finalized |
| Phase 8 (Cycle 71-80) | 2-3 days | Performance optimized |
| Phase 9 (Cycle 81-90) | 3-4 days | Deployed + documented |
| Phase 10 (Cycle 91-100) | 2-3 days | Lessons captured |
| **TOTAL** | **2 weeks** | Feature complete |

**Parallel execution:** With 3 specialists working on different phases, each file completes in 2 weeks.

---

## FILE CREATION ORDER

**Recommended order (not strictly sequential, but dependencies matter):**

1. **todo-onboard.md** ← Start immediately (no dependencies)
2. **todo-agents.md** ← Can start when onboard Cycle 11 done
3. **todo-skills.md** ← Can start when agents Cycle 11 done
4. **todo-sell.md** ← Can start when onboard + X402 done
5. **todo-ecommerce.md** ← Can start when onboard + X402 done
6. **todo-api.md** ← Can start when onboard done (but scope depends on features)
7. **todo-features.md** ← Can start when ecommerce Cycle 11 done
8. **todo-one-ie.md** ← Can start last (showcases all features)

---

## FINAL CHECKLIST

Before declaring "all 9 todos created":

- [ ] All 8 files created in `/one/things/`
- [ ] Each file has exactly 100 cycles (10 phases × 10 infers)
- [ ] Each file follows todo-x402.md structure exactly
- [ ] All cross-references between files documented
- [ ] All ontology mappings explicit in Cycle 1
- [ ] All specialist agent assignments clear
- [ ] All Success Criteria specific (not generic)
- [ ] All Quick Reference sections complete
- [ ] GitHub issues created for each file
- [ ] Team assigned to execute
- [ ] `/one/things/README.md` updated with index

---

**Remember:** Consistency is key. Each file should feel like a natural extension of X402, not a unique format. Follow the template exactly.

**Target:** 4 hours to create basic file structure, 8 hours for full detailed content per file.

