---
title: Todo Assignment
dimension: things
primary_dimension: people
category: todo-assignment.md
tags: agent, backend, frontend, cycle, testing
related_dimensions: events, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-assignment.md category.
  Location: one/things/todo-assignment.md
  Purpose: Documents one platform: specialist agent assignments v1.0.0
  Related dimensions: events, people
  For AI agents: Read this to understand todo assignment.
---

# ONE Platform: Specialist Agent Assignments v1.0.0

**Purpose:** Explicit task assignment for each specialist agent (who builds what, exactly)
**Audience:** 6 specialist agents + engineering director
**Format:** Assignment matrix with cycle ranges + dependencies

---

## ASSIGNMENT SUMMARY (At A Glance)

| Specialist           | Total Cycles | Primary Todos                                     | Start  | End    |
| -------------------- | ------------ | ------------------------------------------------- | ------ | ------ |
| **agent-backend**    | 1,200        | onboard, x402, ecommerce, acp, api, features      | Day 1  | Day 14 |
| **agent-frontend**   | 850          | onboard, ecommerce, buy-chatgpt, one-ie, features | Day 1  | Day 12 |
| **agent-integrator** | 650          | x402, acp, buy-chatgpt, agents, api               | Day 1  | Day 10 |
| **agent-builder**    | 500          | agents, skills, sell, acp                         | Day 3  | Day 11 |
| **agent-quality**    | 600          | ALL (concurrent testing)                          | Day 2  | Day 14 |
| **agent-designer**   | 400          | one-ie, ecommerce, buy-chatgpt (design tokens)    | Day 2  | Day 11 |
| **agent-ops**        | TBD          | one-ie (deployment), template                     | Day 10 | Day 14 |

**Total Team Capacity:** ~4,200 cycles available (900 for each todo + 50% QA buffer)
**Utilization:** ~85% (healthy margin for unknowns)
**Critical Path:** onboard + x402 → ecommerce → one-ie (300 infers minimum)

---

## DETAILED SPECIALIST ASSIGNMENTS

---

## 🔵 AGENT-BACKEND (1,200 cycles total)

**Role:** Database schema, Convex services, backend logic, all server-side implementation
**Lead Specialist:** Primary owner of schema design + architecture
**Teammates:** Coordinates with agent-frontend (API contracts), agent-integrator (external calls), agent-quality (test design)

### todo-onboard: 80 cycles

| Phase        | Cycles | Task                                         | Dependency               | Deliverable           |
| ------------ | ------ | -------------------------------------------- | ------------------------ | --------------------- |
| Phase 2      | 40     | Schema: creator thing type + workspace setup | -                        | schema.ts updated     |
| Phase 4      | 20     | API routes: signup, verify, update profile   | onboard phase 3 UI ready | /api/auth/\* routes   |
| Phase 5      | 10     | Service: email verification system           | agent-integrator ready   | email service working |
| Phase 6      | 10     | Test: unit + integration tests               | all phase 4 code         | 80%+ coverage         |
| **Subtotal** | **80** |                                              |                          |                       |

### todo-x402: 240 cycles

| Phase        | Cycles  | Task                                                          | Dependency                      | Deliverable                  |
| ------------ | ------- | ------------------------------------------------------------- | ------------------------------- | ---------------------------- |
| Phase 2      | 100     | Schema: payment, subscription, endorsement things + indexes   | -                               | schema.ts extended           |
| Phase 4      | 60      | API routes: payments/verify, payments/settle                  | all x402 service layer          | /api/payments/\* routes      |
| Phase 5      | 50      | Service: X402PaymentService + blockchain integration          | agent-integrator CDPintegration | Effect.ts services           |
| Phase 6      | 20      | Mutations: createPaymentRequest, verifyPayment, recordPayment | phase 5 complete                | convex/mutations/payments.ts |
| Phase 6      | 10      | Queries: getPaymentHistory, getCreatorRevenue                 | phase 5 complete                | convex/queries/payments.ts   |
| **Subtotal** | **240** |                                                               |                                 |                              |

### todo-ecommerce: 200 cycles

| Phase        | Cycles  | Task                                                  | Dependency              | Deliverable                    |
| ------------ | ------- | ----------------------------------------------------- | ----------------------- | ------------------------------ |
| Phase 2      | 80      | Schema: product, order, cart, subscription things     | ecommerce phase 1 plan  | schema.ts extended             |
| Phase 4      | 60      | API routes: products/_, orders/_, checkout            | ecommerce phase 3 ready | /api/products/_, /api/orders/_ |
| Phase 5      | 40      | Service: E-CommerceService (Effect.ts) + payment flow | x402 integration done   | effect.ts services             |
| Phase 6      | 20      | Mutations + Queries for products, orders              | all phase 5 code        | convex/mutations/_, queries/_  |
| **Subtotal** | **200** |                                                       |                         |                                |

### todo-acp-integration: 180 cycles

| Phase        | Cycles  | Task                                                              | Dependency           | Deliverable        |
| ------------ | ------- | ----------------------------------------------------------------- | -------------------- | ------------------ |
| Phase 2      | 80      | Schema: agent, acp_message, acp_task things                       | acp phase 1 complete | schema.ts extended |
| Phase 4      | 60      | API routes: /api/acp/agents/\*, /api/acp/messages, /api/acp/tasks | phase 2 schema ready | /api/acp/\* routes |
| Phase 5      | 30      | Service: ACPService + message routing logic                       | phase 4 routes ready | Effect.ts services |
| Phase 6      | 10      | Mutations + Queries for agent operations                          | phase 5 complete     | convex/_acp_       |
| **Subtotal** | **180** |                                                                   |                      |                    |

### todo-api: 200 cycles

| Phase        | Cycles  | Task                                       | Dependency             | Deliverable                               |
| ------------ | ------- | ------------------------------------------ | ---------------------- | ----------------------------------------- |
| Phase 1      | 20      | API design: OpenAPI spec for all endpoints | agent-frontend input   | api-contracts.openapi.yaml                |
| Phase 4      | 120     | API routes: GET/POST all public endpoints  | all todo schemas ready | /api/products, /api/creators, /api/agents |
| Phase 5      | 40      | Service: SDK generation + rate limiting    | phase 4 routes done    | SDK + docs                                |
| Phase 6      | 20      | Queries + caching strategy                 | all phase 4 ready      | query optimization                        |
| **Subtotal** | **200** |                                            |                        |                                           |

### todo-features: 100 cycles

| Phase        | Cycles  | Task                                        | Dependency                  | Deliverable        |
| ------------ | ------- | ------------------------------------------- | --------------------------- | ------------------ |
| Phase 2      | 30      | Schema: analytics event types + tables      | ecommerce ready             | schema.ts extended |
| Phase 4      | 50      | API routes: /api/analytics/_, /api/search/_ | phase 2 schema + x402 ready | routes working     |
| Phase 6      | 20      | Queries: getCreatorMetrics, searchProducts  | phase 4 ready               | query functions    |
| **Subtotal** | **100** |                                             |                             |                    |

### **agent-backend TOTAL: 1,200 cycles**

- **Week 1:** Schema + Phase 2 of all todos (240 infers) = 5 days
- **Week 2:** Phase 4 API routes (200 infers) = 3 days
- **Week 3:** Phase 5-6 services + testing (400 infers) = 5 days
- **Week 4:** Final integration + bug fixes (360 infers) = 5 days

---

## 🟢 AGENT-FRONTEND (850 cycles total)

**Role:** React components, Astro pages, UI/UX implementation, client-side logic
**Lead Specialist:** Primary owner of user-facing features + component library
**Teammates:** Coordinates with agent-backend (API contracts), agent-designer (design specs), agent-quality (component tests)

### todo-onboard: 90 cycles

| Phase        | Cycles | Task                                                                   | Dependency           | Deliverable         |
| ------------ | ------ | ---------------------------------------------------------------------- | -------------------- | ------------------- |
| Phase 3      | 50     | Components: SignupForm, EmailVerification, ProfileForm, WorkspaceSetup | -                    | 4 components        |
| Phase 3      | 20     | Pages: /onboarding/\*, complete flow                                   | phase 3 components   | 6 Astro pages       |
| Phase 4      | 20     | API integration: call /api/onboarding/\* from components               | backend routes ready | Components call API |
| **Subtotal** | **90** |                                                                        |                      |                     |

### todo-ecommerce: 180 cycles

| Phase        | Cycles  | Task                                                                   | Dependency               | Deliverable       |
| ------------ | ------- | ---------------------------------------------------------------------- | ------------------------ | ----------------- |
| Phase 3      | 90      | Components: ProductCard, ShoppingCart, CheckoutForm, OrderConfirmation | -                        | 6 components      |
| Phase 3      | 40      | Pages: /products/\*, /cart, /checkout, /orders                         | phase 3 components ready | 4 Astro pages     |
| Phase 4      | 30      | API integration: products, cart, checkout APIs                         | backend routes ready     | full flow working |
| Phase 6      | 20      | Component testing: unit + integration tests                            | all code written         | 80%+ coverage     |
| **Subtotal** | **180** |                                                                        |                          |                   |

### todo-buy-chatgpt: 150 cycles

| Phase        | Cycles  | Task                                                                         | Dependency           | Deliverable      |
| ------------ | ------- | ---------------------------------------------------------------------------- | -------------------- | ---------------- |
| Phase 3      | 70      | Components: ChatInterface, ProductCard (chat version), RecommendationSection | -                    | 5 components     |
| Phase 3      | 30      | Pages: /chat/index, /chat/history                                            | phase 3 components   | 2 Astro pages    |
| Phase 4      | 30      | API integration: /api/chat/message, /api/chat/checkout                       | backend routes ready | chat API working |
| Phase 6      | 20      | Testing: chat interaction tests, payment flow                                | all code written     | E2E tests pass   |
| **Subtotal** | **150** |                                                                              |                      |                  |

### todo-one-ie: 250 cycles

| Phase        | Cycles  | Task                                                                    | Dependency       | Deliverable          |
| ------------ | ------- | ----------------------------------------------------------------------- | ---------------- | -------------------- |
| Phase 3      | 100     | Components: LandingPage, ProductGrid, Dashboard layouts                 | -                | 10+ components       |
| Phase 3      | 80      | Pages: /, /about, /creators, /pricing, /docs, /blog, /dashboard, /admin | components ready | 8+ Astro pages       |
| Phase 4      | 50      | Integration: pull data from all other APIs                              | all APIs ready   | pages show live data |
| Phase 6      | 20      | Testing: page loads, responsiveness, accessibility                      | all pages built  | smoke tests pass     |
| **Subtotal** | **250** |                                                                         |                  |                      |

### todo-features: 100 cycles

| Phase        | Cycles  | Task                                                          | Dependency           | Deliverable       |
| ------------ | ------- | ------------------------------------------------------------- | -------------------- | ----------------- |
| Phase 3      | 50      | Components: AnalyticsDashboard, SearchBar, NotificationCenter | -                    | 3 components      |
| Phase 3      | 30      | Pages: /dashboard/analytics, /search                          | components ready     | 2 pages           |
| Phase 4      | 20      | API integration: analytics, search, notifications             | backend routes ready | live data showing |
| **Subtotal** | **100** |                                                               |                      |                   |

### **agent-frontend TOTAL: 850 cycles**

- **Week 1:** Phase 3 components (200 infers) = 3 days
- **Week 2:** Phase 3 pages (120 infers) = 2 days
- **Week 2-3:** Phase 4 API integration (150 infers) = 2 days
- **Week 3:** Phase 6 testing (50 infers) = 1 day
- **Week 4:** Integration + refinement (330 infers) = 4 days

---

## 🟣 AGENT-INTEGRATOR (650 cycles total)

**Role:** External system integration (LLM APIs, Coinbase, GitHub, blockchain), protocols
**Lead Specialist:** Primary owner of X402, Claude API, ACP, external integrations
**Teammates:** Coordinates with agent-backend (service layer), agent-builder (ElizaOS), agent-ops (deployment)

### todo-x402: 180 cycles

| Phase        | Cycles  | Task                                                             | Dependency           | Deliverable        |
| ------------ | ------- | ---------------------------------------------------------------- | -------------------- | ------------------ |
| Phase 2      | 40      | X402PaymentService: implement permit + transfer payment logic    | -                    | Effect.ts services |
| Phase 5      | 80      | Blockchain integration: viem client, Base network, USDC handling | agent-backend schema | blockchain utils   |
| Phase 5      | 40      | Facilitator integration: Coinbase CDP API calls                  | -                    | CDP client working |
| Phase 6      | 20      | Testing: X402 flow with test payments                            | all code written     | tests passing      |
| **Subtotal** | **180** |                                                                  |                      |                    |

### todo-buy-chatgpt: 120 cycles

| Phase        | Cycles  | Task                                                    | Dependency             | Deliverable           |
| ------------ | ------- | ------------------------------------------------------- | ---------------------- | --------------------- |
| Phase 2      | 40      | Claude API integration: messages, embeddings, streaming | -                      | claude-api.ts         |
| Phase 2      | 30      | OpenAI API integration (future): GPT support            | -                      | openai-api.ts         |
| Phase 4      | 30      | ChatGPT custom action: define + deploy                  | all service code ready | OpenAI action working |
| Phase 5      | 20      | LLM optimization: prompt tuning, cost tracking          | phase 4 ready          | prompts optimized     |
| **Subtotal** | **120** |                                                         |                        |                       |

### todo-acp-integration: 150 cycles

| Phase        | Cycles  | Task                                                          | Dependency                 | Deliverable               |
| ------------ | ------- | ------------------------------------------------------------- | -------------------------- | ------------------------- |
| Phase 2      | 50      | ACPService: message routing, task delegation                  | -                          | acp.ts services           |
| Phase 4      | 60      | Agent registry: discovery, health checks, capability matching | agent-backend schema ready | registry working          |
| Phase 5      | 30      | External agent integration: ElizaOS, AutoGen support          | phase 4 ready              | external agents integrate |
| Phase 6      | 10      | Testing: agent-to-agent communication                         | all code written           | tests pass                |
| **Subtotal** | **150** |                                                               |                            |                           |

### todo-agents: 100 cycles

| Phase        | Cycles  | Task                                          | Dependency       | Deliverable          |
| ------------ | ------- | --------------------------------------------- | ---------------- | -------------------- |
| Phase 4      | 50      | ElizaOS integration: agent deployment, config | acp ready        | agents deployable    |
| Phase 5      | 30      | Agent marketplace: list, search, deploy       | registry ready   | marketplace UX ready |
| Phase 6      | 20      | Testing: deploy + run test agents             | all code written | agents working       |
| **Subtotal** | **100** |                                               |                  |                      |

### **agent-integrator TOTAL: 650 cycles**

- **Week 1:** Blockchain + LLM APIs + ACP (140 infers) = 2 days
- **Week 2:** Agent integration + marketplace (150 infers) = 2 days
- **Week 2-3:** External integrations (200 infers) = 3 days
- **Week 3-4:** Optimization + testing (160 infers) = 3 days

---

## 🟠 AGENT-BUILDER (500 cycles total)

**Role:** Agent framework, ElizaOS customization, skill system, sample agents
**Lead Specialist:** Primary owner of agent marketplace + creator agent SDK
**Teammates:** Coordinates with agent-integrator (ACP), agent-backend (schema), agent-quality (agent testing)

### todo-agents: 180 cycles

| Phase        | Cycles  | Task                                                 | Dependency          | Deliverable        |
| ------------ | ------- | ---------------------------------------------------- | ------------------- | ------------------ |
| Phase 2      | 40      | Agent thing type + capability schema                 | agent-backend ready | schema extended    |
| Phase 3      | 60      | Agent deployment UI: creator can deploy agents       | -                   | components + pages |
| Phase 4      | 50      | Agent examples: sample agents (chat, content, sales) | ACP ready           | 3 example agents   |
| Phase 6      | 30      | Testing: agent creation, deployment, execution       | all code written    | E2E tests pass     |
| **Subtotal** | **180** |                                                      |                     |                    |

### todo-skills: 150 cycles

| Phase        | Cycles  | Task                                         | Dependency           | Deliverable         |
| ------------ | ------- | -------------------------------------------- | -------------------- | ------------------- |
| Phase 2      | 40      | Skill thing type + verification schema       | agent-backend ready  | schema extended     |
| Phase 3      | 50      | Skill marketplace UI: browse, rate, purchase | -                    | skill components    |
| Phase 4      | 40      | Skill verification: automated + manual       | marketplace UI ready | verification system |
| Phase 6      | 20      | Testing: skill matching, recommendations     | all code written     | tests pass          |
| **Subtotal** | **150** |                                              |                      |                     |

### todo-sell: 100 cycles

| Phase        | Cycles  | Task                                                   | Dependency       | Deliverable       |
| ------------ | ------- | ------------------------------------------------------ | ---------------- | ----------------- |
| Phase 2      | 30      | GitHub integration: OAuth + token generation           | -                | github.ts service |
| Phase 3      | 40      | UI: creator lists repo for sale, buyers request access | -                | sell components   |
| Phase 4      | 20      | Checkout: X402 payment → GitHub token issued           | x402 + API ready | checkout working  |
| Phase 6      | 10      | Testing: full flow repo sale + access                  | all code written | tests pass        |
| **Subtotal** | **100** |                                                        |                  |                   |

### **agent-builder TOTAL: 500 cycles**

- **Week 2:** Agent + skill schema (80 infers) = 1 day
- **Week 2-3:** UX + examples (150 infers) = 2 days
- **Week 3:** Integrations (150 infers) = 2 days
- **Week 4:** Testing (120 infers) = 2 days

---

## 🔴 AGENT-QUALITY (600 cycles total, distributed concurrent)

**Role:** Testing (unit, integration, E2E, security, performance), quality gates, test infrastructure
**Lead Specialist:** Primary owner of test suite + quality standards
**Teammates:** Coordinates with all specialists (QA from their code)

### Testing Strategy: Distributed Testing (1 QA infer per 2 engineering infers)

| Phase        | When      | Task                                           | Coverage | Deliverable                 |
| ------------ | --------- | ---------------------------------------------- | -------- | --------------------------- |
| **Week 1**   | Day 1     | Schema design review                           | -        | test plan doc               |
| **Week 1**   | Day 2-5   | Unit tests (todo-onboard, x402)                | 80%+     | test files                  |
| **Week 2**   | Day 6-10  | Integration tests (onboard→x402→ecommerce)     | 80%+     | integration test suite      |
| **Week 2-3** | Day 10-15 | E2E tests (full user flow)                     | 70%+     | E2E test suite (Playwright) |
| **Week 3**   | Day 14-19 | Security tests (XSS, SQL injection, auth)      | 90%+     | security report             |
| **Week 3**   | Day 14-19 | Performance tests (load, latency, scalability) | -        | perf metrics                |
| **Week 4**   | Day 18-21 | UAT (user acceptance testing)                  | -        | UAT sign-off                |

### Tests by Todo (inline with development):

- **todo-onboard:** 60 infers (signup flow, email verification, profile, teams)
- **todo-x402:** 80 infers (payment creation, verification, settlement, blockchain calls)
- **todo-ecommerce:** 100 infers (cart, checkout, orders, fulfillment)
- **todo-buy-chatgpt:** 80 infers (chat interface, Claude API, recommendations, checkout)
- **todo-acp-integration:** 70 infers (message routing, task delegation, agent discovery)
- **todo-agents:** 60 infers (agent deployment, execution, scaling)
- **todo-skills:** 40 infers (skill creation, matching, marketplace)
- **todo-sell:** 30 infers (repo sale, access granting)
- **todo-api:** 60 infers (API endpoints, SDKs, rate limiting)
- **todo-features:** 50 infers (analytics, search, social features)
- **todo-one-ie:** 50 infers (page load, responsiveness, accessibility)

### **agent-quality TOTAL: 600 cycles** (concurrent with all other specialists)

- **Week 1-2:** Unit + integration tests (200 infers) = 3 days
- **Week 2-3:** E2E + security tests (250 infers) = 4 days
- **Week 3-4:** Performance + UAT (150 infers) = 2 days

---

## 🎨 AGENT-DESIGNER (400 cycles total)

**Role:** UI/UX design, wireframes, design system, accessibility (WCAG), brand compliance
**Lead Specialist:** Primary owner of design tokens + component library
**Teammates:** Coordinates with agent-frontend (component specs), agent-quality (accessibility testing)

### Design Artifacts (Phases 1, 6, 7 of each todo):

| Todo        | Wireframes | Design System     | Accessibility        | Responsive   | Status |
| ----------- | ---------- | ----------------- | -------------------- | ------------ | ------ |
| onboard     | 6 pages    | Form tokens       | Labels, keyboard nav | Mobile-first | ✅     |
| x402        | 4 pages    | Payment tokens    | WCAG AA              | Mobile       | ✅     |
| ecommerce   | 8 pages    | Product tokens    | Images alt text      | Mobile       | ✅     |
| buy-chatgpt | 4 pages    | Chat tokens       | Chat history aria    | Mobile       | ✅     |
| one-ie      | 10 pages   | Hero, card tokens | Full accessibility   | Mobile       | ✅     |

### Design Deliverables:

| Cycles | Task                                                | Dependency          | Deliverable      |
| ------ | --------------------------------------------------- | ------------------- | ---------------- |
| 50     | Design tokens: colors, typography, spacing, shadows | -                   | tokens.css       |
| 80     | Wireframes: all user-facing pages (30+ pages)       | -                   | Figma file       |
| 100    | Component design: buttons, forms, cards, modals     | wireframes ready    | component specs  |
| 80     | Accessibility audit: WCAG compliance for all pages  | all components      | a11y report      |
| 60     | Dark mode: all colors + theme support               | design tokens ready | dark mode CSS    |
| 30     | Responsive breakpoints: mobile, tablet, desktop     | all components      | responsive specs |

### **agent-designer TOTAL: 400 cycles**

- **Week 1-2:** Design system + tokens (130 infers) = 2 days
- **Week 2:** Wireframes (80 infers) = 1.5 days
- **Week 3:** Component design + accessibility (160 infers) = 3 days
- **Week 4:** Polish + refinement (30 infers) = 0.5 days

---

## 🚀 AGENT-OPS (TBD, estimated 200 cycles)

**Role:** DevOps, CI/CD, deployment, infrastructure, monitoring
**Lead Specialist:** Primary owner of deployment pipeline + production readiness
**Teammates:** Coordinates with agent-backend (deployment targets), agent-quality (CI/CD integration)

### Deployment Phases:

| Phase    | Cycles | Task                                           | Dependency       | Deliverable          |
| -------- | ------ | ---------------------------------------------- | ---------------- | -------------------- |
| Setup    | 30     | CI/CD pipeline: GitHub Actions, tests, linting | -                | .github/workflows/\* |
| Setup    | 20     | Secrets management: env vars, API keys         | -                | .env setup guides    |
| Build    | 50     | Docker images: web + backend containers        | all code written | Dockerfile           |
| Deploy   | 60     | Cloudflare Pages + Convex deployment           | CI passing       | deployment scripts   |
| Monitor  | 30     | Monitoring: uptime, latency, errors            | deployed         | dashboard + alerts   |
| Optimize | 10     | Performance tuning: caching, CDN               | monitoring live  | optimized config     |

### **agent-ops TOTAL: 200 cycles** (weeks 3-4)

- **Week 3:** CI/CD setup + Docker (100 infers) = 2 days
- **Week 4:** Deployment + monitoring (100 infers) = 2 days

---

## COORDINATION SCHEDULE

### Daily (15 minutes, async Slack OK)

- **Time:** 9:00 AM start-of-day standup
- **Each specialist reports:**
  - Yesterday: X cycles completed, what's done
  - Today: Y cycles planned, what's next
  - Blockers: What are you stuck on?
- **Format:** Slack thread, 1-2 sentences each
- **Owner:** agent-director (reads + summarizes)

### Weekly (1 hour, all hands synchronous)

- **Time:** Friday 3 PM
- **Agenda:**
  1. Progress review (each specialist: 10 min)
  2. Risk assessment (what could go wrong? 15 min)
  3. Dependency resolution (blockers? 15 min)
  4. Next week planning (assignments? 10 min)
  5. Celebration (wins? 10 min)
- **Owner:** agent-director (facilitates)

### Per-Todo Kickoff (30 min, relevant specialists)

- **When:** Before each todo phase starts
- **Attendees:** Specialists working on that todo
- **Topics:**
  - Requirements clarity
  - API contracts (if with other todos)
  - Test plan
  - Integration points
- **Owner:** agent-backend (for backend todos), agent-frontend (for frontend), etc.

### Escalation Path (as needed)

1. **Blocker occurs** → Specialist posts in #blockers
2. **5-min response** → Relevant specialist tries to help
3. **30-min unresolved** → Tag agent-director + other specialists
4. **30-min still stuck** → Emergency sync (pull whoever needed)

---

## SUCCESS CRITERIA BY SPECIALIST

### agent-backend: "System Works"

- ✅ All schemas in single schema.ts (no duplication)
- ✅ All services in /convex/services/ (organized by domain)
- ✅ All mutations/queries working (tested)
- ✅ All integrations with external APIs (Coinbase, Claude, GitHub)
- ✅ 80%+ test coverage
- ✅ Zero schema breaking changes after freeze (day 5)

### agent-frontend: "UI is Beautiful & Works"

- ✅ All components in /components/ (organized by feature)
- ✅ All pages in /pages/ (responsive, accessible)
- ✅ Zero dead links (all APIs respond)
- ✅ <2s page load on 4G (Lighthouse 90+)
- ✅ WCAG AA compliance (80% of pages)
- ✅ 80%+ component test coverage

### agent-integrator: "External Systems Integrate"

- ✅ Coinbase CDP working (test payments settle)
- ✅ Claude API optimized (cost tracked, quality verified)
- ✅ ChatGPT action deployed (users can use)
- ✅ ACP working (agents can communicate)
- ✅ ElizaOS agents can deploy (documentation clear)
- ✅ GitHub integration working (repos accessible)

### agent-builder: "Agent Ecosystem Works"

- ✅ 5+ sample agents deployable (chat, content, sales, analysis, support)
- ✅ Skill marketplace functional (creators can list, buyers can search)
- ✅ Repo sales working (creators earn)
- ✅ Agent examples in documentation
- ✅ Creator can build + deploy their own agent (no code if possible)

### agent-quality: "Everything is Tested"

- ✅ Unit tests: 80%+ coverage on services
- ✅ Integration tests: Full user journeys (signup→buy)
- ✅ E2E tests: Critical flows in Playwright
- ✅ Security tests: No XSS, SQL injection, auth bypasses
- ✅ Performance: All endpoints < 500ms (p95)
- ✅ Accessibility: WCAG AA on all public pages

### agent-designer: "Product is Beautiful"

- ✅ Consistent design system (colors, typography, spacing)
- ✅ All pages responsive (mobile, tablet, desktop)
- ✅ All pages accessible (WCAG AA or better)
- ✅ Dark mode working consistently
- ✅ Brand identity consistent (logo, colors, tone)
- ✅ 0 design debt (all components match spec)

### agent-ops: "Platform is Live & Healthy"

- ✅ CI/CD fully automated (no manual steps)
- ✅ Tests run on every commit (no failing builds)
- ✅ Deployment is one-click (no manual SSH)
- ✅ Monitoring live (uptime tracked, alerts working)
- ✅ Performance baseline established
- ✅ Rollback plan exists (tested)

---

## HANDOFF PROTOCOL

### When Specialist A Finishes, Specialist B Takes Over

**Example: Backend schema → Frontend components**

1. **agent-backend completes schema** (Day 5 EOD)
   - Posts: "Schema frozen, ready for frontend"
   - Tags: @agent-frontend
   - Attachment: schema.ts + spec doc

2. **agent-frontend reads spec** (Day 6 9 AM)
   - Reviews: What things exist? What fields matter?
   - Questions: Post clarifications in #questions
   - Confirms: "Got it, starting component design"

3. **agent-frontend implements components** (Day 6-8)
   - Uses schema to type components
   - Posts daily progress in standup
   - Any schema changes? Negotiated with agent-backend

4. **agent-quality writes tests for schema** (Day 5 EOD)
   - While frontend implements components
   - Tests DB operations (read, write, update, delete)
   - Posts: "Schema tests passing"

---

## PEAK CAPACITY PLANNING

### Weekly Cycles by Specialist:

| Week      | Backend   | Frontend | Integrator | Builder | Quality | Designer | Ops     | Total     |
| --------- | --------- | -------- | ---------- | ------- | ------- | -------- | ------- | --------- |
| 1         | 300       | 100      | 150        | 50      | 100     | 100      | -       | **800**   |
| 2         | 280       | 250      | 180        | 100     | 150     | 100      | -       | **1,060** |
| 3         | 320       | 300      | 200        | 200     | 150     | 100      | -       | **1,270** |
| 4         | 300       | 200      | 120        | 150     | 100     | 100      | 200     | **1,170** |
| **Total** | **1,200** | **850**  | **650**    | **500** | **600** | **400**  | **200** | **4,400** |

- **Peak: Week 3** (1,270 infers) = 2.5 infers per specialist per day (comfortable pace)
- **Utilization:** 85% of theoretical capacity (healthy)
- **Buffer:** 15% for unknowns, reviews, communications

---

## CRITICAL HANDOFF POINTS

| Day | Handoff          | From                | To                   | What                |
| --- | ---------------- | ------------------- | -------------------- | ------------------- |
| 5   | Schema frozen    | Backend             | All                  | schema.ts finalized |
| 5   | API contracts    | Backend             | Frontend, Integrator | OpenAPI spec        |
| 8   | Components ready | Frontend            | Quality              | Component tests     |
| 10  | Services ready   | Backend, Integrator | Frontend             | Mocks/APIs working  |
| 12  | Full integration | All                 | Quality              | E2E testing phase   |
| 18  | Code freeze      | All                 | Ops                  | Prepare deployment  |
| 19  | Deployment       | Ops                 | All                  | One.ie live         |

---

## IF TIMELINE SLIPS

### Option 1: Reduce Scope (Recommended)

- Remove todo-skills, todo-sell from v1.0
- Focus: onboard → x402 → ecommerce → chat → api → launch
- Redeploy skills/sell in v1.1 (2 weeks after launch)
- Impact: Faster launch, safer

### Option 2: Add Specialist

- Bring in 7th specialist (contractor)
- Focus on QA (reduce burden on agent-quality)
- Impact: +25% capacity, +15% cost

### Option 3: Extend Timeline

- Add 1-2 weeks to Wave 3
- Slip launch from Week 4 to Week 5-6
- Impact: Better quality, more buffer

---

**This assignment document is the single source of truth for who builds what, exactly. Each specialist knows their cycles, dependencies, and success criteria.**
