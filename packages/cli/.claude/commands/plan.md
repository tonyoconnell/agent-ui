# /plan - Transform Ideas Into Optimized Execution Plans

**Purpose:** Load pre-built optimized plans or generate custom plans with speed, quick wins, and minimal cycles to production.

---

## Project Detection (Step 1)

**When user types `/plan [keyword]`, check if keyword matches a pre-built project:**

| Keyword | File | Cycles | Description |
|---------|------|--------|-------------|
| `blog` | `web/src/content/plans/blog.md` | 30 | Article publishing, search, RSS |
| `pages` | `web/src/content/plans/pages.md` | 20 | Landing page builder |
| `shop` | `web/src/content/plans/shop.md` | 28 | E-commerce with Stripe |
| `dashboard` | `web/src/content/plans/dashboard.md` | 40 | Real-time analytics (backend) |
| `email` | `web/src/content/plans/email.md` | 45 | Messaging system (backend) |
| `website` | `web/src/content/plans/website.md` | 55 | Website builder + CMS (backend) |

**If keyword matches:**
1. Read the plan file from `web/src/content/plans/[keyword].md`
2. Display the optimized plan with Quick Wins section
3. Show "Ready to execute" message
4. Skip plan generation (plan already exists)

**If keyword doesn't match:**
1. Treat as custom idea
2. Generate plan using algorithm below
3. Save to `.claude/state/plan.json`

---

## Core Philosophy

**Speed is a feature.** Every plan should:
- ✅ **Show quick wins first** - Users see value in Cycles 1-10
- ✅ **Minimize total cycles** - Can we ship in 30 cycles instead of 100?
- ✅ **Maximize parallelization** - Run agents simultaneously whenever possible
- ✅ **Prioritize MVP** - Core value first, enhancements later
- ✅ **Validate early** - Test assumptions in first 10 cycles

---

## Usage

```bash
# Use pre-built optimized plans (RECOMMENDED)
/plan blog          # 30 cycles - Article publishing
/plan pages         # 20 cycles - Landing pages
/plan shop          # 28 cycles - E-commerce
/plan dashboard     # 40 cycles - Analytics (backend)
/plan email         # 45 cycles - Messaging (backend)
/plan website       # 55 cycles - Website builder (backend)

# Or generate custom plan
/plan [your-custom-idea]

# Examples:
/plan Build a course platform with AI tutors
/plan E-commerce store for digital downloads
/plan SaaS tool for project management
```

**Pre-built plans load instantly** from `web/src/content/plans/` with optimized cycle counts and quick wins already defined.

**Custom plans** take 30 seconds to generate and follow template-first optimization:
1. **Searches for existing templates** in /web/src/pages/ (save 50-80% cycles)
2. Validates against 6-dimension ontology
3. Determines frontend-only vs backend architecture
4. Identifies quick wins for Cycles 1-5 (with templates)
5. Optimizes total cycle count (aim for 4-15 with templates, 30-60 from scratch)
6. Assigns specialists automatically
7. Shows parallel execution opportunities
8. Suggests Stripe integration as follow-up (if e-commerce detected)

---

## Template Catalog

**Available templates in /web/src/pages/ (60+ templates):**

### Marketing & Sales Templates
- `landing.astro` - Product landing pages (hero, features, pricing, CTA, contact)
- `enterprise.astro` - B2B/enterprise landing page variant
- `features1.astro`, `features2.astro` - Feature comparison pages
- `contact.astro` - Contact form with validation
- `thankyou-product.astro` - Thank you pages after purchase

### E-commerce Templates
- `shop.astro` - Full e-commerce with cart + Stripe integration
- `products/index.astro` - Product listing page
- `products/[slug].astro` - Dynamic product detail pages
- `checkout-stripe.astro` - Complete Stripe payment flow
- `checkout.astro` - Generic checkout page
- `cart.astro` - Shopping cart page
- `download.astro` - Digital download delivery

### Content Templates
- `blog/index.astro` - Blog listing page
- `blog/[...slug].astro` - Blog post detail pages
- `page.astro` - Generic content pages (63KB, full-featured)
- `news/` - News/article pages
- `docs/` - Documentation pages

### Application Templates
- `dashboard/` - Dashboard layout
- `account/` - User account pages
- `app/` - Application pages
- `onboard/` - Onboarding flow
- `signup-choice.astro` - Registration selection page

### Specialty Templates
- `components.astro` - Component showcase/library
- `ontology.astro` - System documentation
- `design.astro` - Design system pages
- `deploy.astro` - Deployment pages
- `videos.astro`, `test-videos.astro` - Video platform pages

### Integration Templates
- `pay-course.astro`, `pay-playbook.astro` - Payment pages for specific products
- `thankyou-course.astro`, `thankyou-playbook.astro` - Post-purchase pages
- `mail.astro` - Email template pages
- `install.astro` - Installation/setup pages
- `readme.astro` - README rendering pages

**Template Usage Strategy:**
1. Search for closest match in catalog (Cycle 1)
2. Copy template to new location (Cycle 1)
3. Customize content and styling (Cycles 2-3)
4. Deploy and test (Cycle 4)
5. Enhance as needed (Cycles 5+)

**Typical Cycle Savings:**
- Landing page: 4 cycles (vs 8 from scratch) = 50% savings
- E-commerce: 12 cycles (vs 28 from scratch) = 57% savings
- Product pages: 2 cycles (vs 8 from scratch) = 75% savings
- Stripe checkout: 3 cycles (vs 15 from scratch) = 80% savings
- Blog: 5 cycles (vs 12 from scratch) = 58% savings

---

## Quick Win Optimization (Cycles 1-5)

**CRITICAL:** First 5 cycles must deliver visible progress with template-first approach.

### Quick Win Strategy

**❌ Old approach (slow start, no templates):**
```
Cycle 1-10: Research, planning, build from scratch
Cycle 11+: Finally deploy something
```

**❌ Old approach (fast start, from scratch):**
```
Cycle 1-3:  Validate idea, map to ontology, decide architecture
Cycle 4-7:  Build ONE working feature (end-to-end)
Cycle 8-10: Deploy to staging, show something real
```

**✅ New approach (template-first, ultra-fast):**
```
Cycle 1:    Search templates + validate idea + map to ontology
Cycle 2:    Copy closest template + customize structure
Cycle 3:    Update content + styling
Cycle 4:    Deploy to staging, show something real
Cycle 5:    QA + production deploy
```

### Example: Course Platform (Template-First)

**Quick Win Path:**
```
Cycle 1: Search /web/src/pages/ → Found page.astro (generic content template)
         Validate idea → Maps to Things (course), Connections (enrolled_in), Events (completed)
         Frontend-only decision (no backend needed for MVP)

Cycle 2: Copy page.astro → course/[slug].astro
         Add lesson navigation component structure
         Configure routing for dynamic course pages

Cycle 3: Add sample course content (3 lessons)
         Implement progress tracking with localStorage
         Style lesson player with Tailwind

Cycle 4: Deploy to Cloudflare Pages
         Test course navigation flow
         Verify progress persistence

Cycle 5: ✅ WORKING COURSE PLATFORM LIVE

Result: 5 cycles → MVP shipped (vs 10 cycles from scratch = 50% faster!)
```

---

## Cycle Minimization Strategy

**Golden Rule:** Use the minimum cycles needed. If MVP can ship in 30 cycles, don't plan 100.

### Cycle Budget Guidelines (Updated for Template-First)

| Feature Complexity | Frontend-Only (Template) | Frontend-Only (Scratch) | Backend + Frontend | Notes |
|-------------------|-------------------------|------------------------|-------------------|-------|
| **Simple** (landing page, blog) | 4-8 cycles | 5-15 cycles | N/A | Copy template, customize content |
| **Standard** (e-commerce, SaaS tool) | 8-15 cycles | 15-30 cycles | 20-35 cycles | Reuse shop/checkout templates |
| **Complex** (multi-tenant platform) | N/A | N/A | 35-60 cycles | Groups, events, real-time |
| **Enterprise** (full platform) | N/A | N/A | 60-80 cycles | All 6 dimensions, integrations |

**Template Impact:** Using existing templates reduces cycles by 50-80% for frontend work.

### How to Minimize Cycles

**1. ALWAYS Search for Templates First (Critical!)**
- Check /web/src/pages/ before building anything (save 50-80% cycles)
- Landing page? Copy landing.astro (4 cycles vs 8 from scratch)
- E-commerce? Copy shop.astro (12 cycles vs 28 from scratch)
- Product pages? Copy products/[slug].astro (2 cycles vs 8 from scratch)
- Stripe checkout? Copy checkout-stripe.astro (3 cycles vs 15 from scratch)
- Template discovery = Cycle 1, always

**2. Start Frontend-Only (Default)**
- No backend = 50% fewer cycles
- Add backend later if needed
- Example: E-commerce with Stripe.js (12 cycles vs 35 with backend)
- Templates make frontend-only even faster (4-12 cycles)

**3. Reuse Existing Components**
- Search /web/src/components/ for reusable UI (save 5-10 cycles)
- Don't rebuild hero sections, pricing tables, forms
- Copy + customize > build from scratch
- Example: Contact form component exists (1 cycle vs 5 from scratch)

**4. Copy Integration Patterns**
- Stripe integration exists in checkout-stripe.astro (copy it!)
- Auth patterns exist in account/ pages (copy them!)
- Form handling exists in contact.astro (copy it!)
- Don't reinvent the wheel for common integrations

**5. Skip Non-Essential Features**
- MVP = core value only
- Nice-to-have → Future cycles
- Example: Ship without admin dashboard (save 15 cycles)

**6. Maximize Parallelization**
- Template search + Ontology validation (run simultaneously)
- Frontend + Content creation (run simultaneously)
- Backend + Tests (run simultaneously)
- Example: 12 sequential cycles → 7 days with parallelization

**7. Defer Documentation**
- Code is documentation (well-named functions)
- Templates are self-documenting (copy working examples)
- Write docs in final cycles (not 1-10)
- Focus on shipping first

---

## Plan Output Format

After typing `/plan [idea]`, you'll see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 EXECUTION PLAN GENERATED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Idea:** Course platform with AI tutors
**Architecture:** Frontend-only → Backend (add later if needed)
**Template Found:** ✅ page.astro + components (reusable)
**Total Cycles:** 12 (optimized from 28 via templates)
**Quick Wins:** Cycle 5 (working MVP deployed)
**Cycle Savings:** 16 cycles saved through template reuse

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 TEMPLATES AVAILABLE

✅ landing.astro - Product landing pages (hero, features, pricing)
✅ shop.astro - E-commerce with cart + Stripe
✅ checkout-stripe.astro - Payment flow ready
✅ products/[slug].astro - Dynamic product pages
✅ blog/[...slug].astro - Blog/article pages
✅ page.astro - Generic content pages
✅ contact.astro - Contact forms

Strategy: Copy templates (Cycle 1) → Customize (Cycles 2-3) → Deploy (Cycle 4)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ QUICK WINS (Cycles 1-5)

Cycle 1:   Template discovery & validation
  ✓ Search /web/src/pages/ for reusable templates
  ✓ Found page.astro + lesson components
  ✓ Validate against ontology (Things: course, lesson)

Cycle 2-3:   Copy & customize template (2 cycles)
  ✓ Copy page.astro → course/[slug].astro
  ✓ Add lesson navigation components
  ✓ Add progress tracking (localStorage)

Cycle 4:   Content & styling
  ✓ Add sample course content
  ✓ Customize Tailwind styles

Cycle 5:   Deploy MVP
  ✓ Deploy to Cloudflare Pages
  ✓ Test end-to-end

🎯 **Cycle 5 Milestone:** Working course platform live (vs 10 cycles from scratch!)

💡 Template reuse savings: 5 cycles saved on page structure + components

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 FULL PLAN (12 Cycles Total)

Phase 1: Template Discovery (Cycle 1)
  → agent-director searches templates & validates

Phase 2: Template Customization (Cycles 2-5)
  → agent-frontend copies & customizes templates

Phase 3: Enhancement (Cycles 6-9)
  → agent-frontend adds features (quiz, certificates)

Phase 4: Quality & Deploy (Cycles 10-12)
  → agent-quality tests + agent-ops deploys

[Future: Backend Phase]
  → Cycle 13-18: Add backend if needed (groups, events, multi-user)
  → Cycle 19-20: Integrate Stripe subscriptions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ PARALLEL OPPORTUNITIES

These cycles can run simultaneously:
- Template search (Cycle 1) + Ontology validation (Cycle 1)
- Frontend customization (Cycles 2-4) + Content creation (Cycles 2-4)
- Enhancement (Cycles 6-9) + Testing (Cycles 6-9)

**Time Savings:** 12 sequential cycles → 7 days with parallelization

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 FOLLOW-UP INTEGRATIONS

Stripe Integration (if e-commerce detected):
  ✅ Template exists: checkout-stripe.astro
  → Cycle 13-15: Copy template + configure keys + test payments (3 cycles)
  💡 Consider adding: Subscription support, usage-based billing

Backend Migration (if needed later):
  → Cycles 16-20: Add Convex backend for multi-user/real-time (5 cycles)
  → Preserves frontend work, adds persistence layer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 NEXT STEPS

1. Start execution:
   /now    - See Cycle 1 task
   /next   - Advance through cycles
   /done   - Mark complete & learn

2. Fast-track a feature:
   /fast [feature-name]

3. Build with specialists:
   /create [specific-feature]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Intelligent Planning Algorithm

The plan generator uses these rules:

### 1. Template Discovery (Cycle 1)
```
BEFORE planning from scratch, search for existing templates:

Search locations:
- /web/src/pages/*.astro (60+ page templates)
- /web/src/pages/[category]/ (shop, products, blog, features, etc.)
- /web/src/components/ (reusable UI components)

Common templates available:
- landing.astro - Product landing pages (hero, features, pricing, CTA)
- shop.astro - E-commerce with cart + Stripe integration
- products/[slug].astro - Dynamic product detail pages
- blog/[...slug].astro - Article/blog post pages
- page.astro - Generic content pages
- checkout-stripe.astro - Payment flow with Stripe
- components.astro - Component showcase page
- features1.astro, features2.astro - Feature comparison pages
- enterprise.astro - Enterprise/B2B landing page
- contact.astro - Contact form page

Template matching strategy:
1. User wants "product landing" → Copy landing.astro
2. User wants "e-commerce" → Copy shop.astro + products/
3. User wants "blog" → Copy blog/ directory
4. User wants "checkout flow" → Copy checkout-stripe.astro
5. NO matching template → Build from scratch (slower)

Goal: Reuse 80% of code, customize 20%
```

### 2. Ontology Validation (Cycle 2)
```
Question: Does this map to 6 dimensions?
- Identify Groups (multi-tenant? hierarchical?)
- Identify People (roles? permissions?)
- Identify Things (core entities)
- Identify Connections (relationships)
- Identify Events (actions to track?)
- Identify Knowledge (search/RAG needed?)

If unclear → Ask clarifying questions
If invalid → Suggest reframing
```

### 3. Architecture Decision (Cycle 3)
```
Frontend-only if:
- Single user OR third-party auth
- Static content OR localStorage sufficient
- Payments via Stripe.js
- No real-time collaboration
- Template exists (copy and customize)

Backend needed if:
- Multi-tenant groups
- Real-time sync
- Immutable event log
- Vector embeddings (RAG)
- User-generated content (UGC)

Template-first benefits:
- Frontend-only + template = 5-15 cycles (vs 20-40 from scratch)
- Copy existing Stripe integration (save 10 cycles)
- Reuse existing components (save 15 cycles)
```

### 4. Quick Win Identification (Cycle 4)
```
Quick Win = Smallest shippable feature showing core value

Template-first quick wins:
- Copy template (Cycle 1) → Customize content (Cycle 2-3) → Deploy (Cycle 4)
- Result: 4 cycles to working MVP (vs 10+ from scratch)

Examples:
- Product landing → Copy landing.astro → Edit copy → Deploy (4 cycles)
- E-commerce → Copy shop.astro → Add products → Deploy (6 cycles)
- Blog → Copy blog/ → Add 3 posts → Deploy (5 cycles)
- Course platform → Copy existing + localStorage → Deploy (8 cycles)
- SaaS tool → No template → Build from scratch (15+ cycles)

Goal: Cycle 5-10 = Something live and usable
```

### 5. Cycle Budget Allocation
```
Frontend-only (with template):
  Template Discovery: 1 cycle (8%)
  Template Copy:      1 cycle (8%)
  Customization:      3 cycles (25%)
  Content:            2 cycles (17%)
  Testing:            2 cycles (17%)
  Deploy:             1 cycle (8%)
  Enhancement:        2 cycles (17%)
  Total:              12 cycles

Frontend-only (from scratch):
  Foundation:     3 cycles (10%)
  Core Feature:   7 cycles (25%)
  Enhancements:   10 cycles (35%)
  Quality:        5 cycles (18%)
  Deploy:         3 cycles (12%)
  Total:          28 cycles

Backend + Frontend (with template):
  Template Discovery: 1 cycle (3%)
  Template Copy:      1 cycle (3%)
  Backend Schema:     5 cycles (14%)
  Backend Logic:      8 cycles (23%)
  Frontend Custom:    5 cycles (14%)
  Integration:        6 cycles (17%)
  Quality:            5 cycles (14%)
  Deploy:             4 cycles (12%)
  Total:              35 cycles

Backend + Frontend (from scratch):
  Foundation:     3 cycles (6%)
  Backend Schema: 5 cycles (10%)
  Backend Logic:  8 cycles (16%)
  Frontend Pages: 10 cycles (20%)
  Integration:    8 cycles (16%)
  Quality:        8 cycles (16%)
  Deploy:         5 cycles (10%)
  Documentation:  3 cycles (6%)
  Total:          50 cycles

Stripe Integration (template exists):
  Copy checkout-stripe.astro:  1 cycle
  Configure Stripe keys:       1 cycle
  Test payment flow:           1 cycle
  Total:                       3 cycles (vs 10-15 from scratch)
```

### 6. Parallelization Mapping
```
Identify independent work streams:
- Design + Backend (no dependencies)
- Frontend + Tests (can run together)
- Optimization + Documentation (separate concerns)

Calculate time savings:
  Sequential: 50 cycles × 1 day = 50 days
  Parallel (3 streams): 50 ÷ 3 = 17 days
```

---

## Plan Commands

```bash
# Generate plan
/plan [idea]

# View plan
/plan show              # Full plan with all cycles
/plan summary           # Quick overview

# Filter plan
/plan cycles 1-10       # Show specific range
/plan agent frontend    # Show cycles for specific agent
/plan quick-wins        # Show Cycles 1-10 only

# Modify plan
/plan optimize          # Re-optimize to use fewer cycles
/plan add-backend       # Add backend to frontend-only plan
/plan skip [N]          # Skip cycle N (mark not applicable)

# Export plan
/plan export md         # Markdown format
/plan export json       # JSON format
/plan export timeline   # Gantt chart
```

---

## Example Plans

### Example 1: E-commerce Store (Template-First)

**Input:** `/plan E-commerce store for digital fonts`

**Output:**
```
🚀 Plan: 12 cycles (frontend-only, template-first)

Phase 1: Template Discovery (Cycle 1)
- Search /web/src/pages/ for e-commerce templates
- ✅ FOUND: shop.astro (cart + Stripe integration)
- ✅ FOUND: products/[slug].astro (product detail pages)
- ✅ FOUND: checkout-stripe.astro (payment flow)

Quick Wins (Cycles 2-6):
- Cycle 2: Copy shop.astro → fonts-store.astro
- Cycle 3: Copy products/ → customize for fonts
- Cycle 4: Add font preview components
- Cycle 5: Configure Stripe (copy existing keys pattern)
- Cycle 6: Deploy MVP

Enhancement (Cycles 7-10):
- Cycle 7: Add font filtering/search
- Cycle 8: Improve cart UX
- Cycle 9: Add download management
- Cycle 10: Style customization

Quality & Deploy (Cycles 11-12):
- Cycle 11: Testing + QA
- Cycle 12: Production deploy

✅ Cycle 6: Customers can buy fonts (template reuse saves 16 cycles!)
🎯 Cycle 12: Full-featured store live

💡 Template savings:
- Stripe integration: 10 cycles saved
- Cart system: 4 cycles saved
- Product pages: 2 cycles saved
- Total: 16 cycles saved (28 → 12)

💡 Stripe follow-up: If backend needed later, add subscription support (5 cycles)
```

### Example 2: SaaS Platform (Backend + Frontend)

**Input:** `/plan Project management tool with team collaboration`

**Output:**
```
🚀 Plan: 45 cycles (backend + frontend)

Quick Wins (Cycles 1-10):
- Cycle 1-3: Validate + architect (backend needed)
- Cycle 4-6: Backend schema (groups, projects, tasks)
- Cycle 7-9: Basic project view (list tasks)
- Cycle 10: Deploy staging (team can test)

Core Features (Cycles 11-30):
- Cycle 11-15: Task CRUD operations
- Cycle 16-20: Real-time updates (WebSocket)
- Cycle 21-25: Team permissions
- Cycle 26-30: Activity feed (events table)

Polish (Cycles 31-45):
- Cycle 31-38: UI/UX refinement
- Cycle 39-42: Performance optimization
- Cycle 43-44: Testing
- Cycle 45: Production deploy

✅ Cycle 10: MVP with basic task management
🎯 Cycle 45: Full collaboration platform
```

### Example 3: Landing Page (Template-First, Ultra-Fast)

**Input:** `/plan Landing page for SaaS product`

**Output:**
```
🚀 Plan: 4 cycles (frontend-only, template-first)

Phase 1: Template Discovery (Cycle 1)
- Search /web/src/pages/ for landing page templates
- ✅ FOUND: landing.astro (hero, features, pricing, CTA, contact)
- ✅ FOUND: enterprise.astro (B2B landing variant)
- Template has: Hero + Features + Pricing + Contact form

Quick Wins (Cycles 2-4):
- Cycle 2: Copy landing.astro → saas-product.astro
- Cycle 3: Customize copy, images, pricing tiers
- Cycle 4: Deploy to Cloudflare Pages

✅ Cycle 4: Landing page live (4 cycles vs 8 from scratch!)

💡 Template savings:
- Hero section: 1 cycle saved
- Features section: 1 cycle saved
- Pricing section: 1 cycle saved
- Contact form: 1 cycle saved
- Total: 4 cycles saved (8 → 4)

💡 Follow-up enhancements (optional):
- Cycle 5-6: Add Stripe payment integration (if ready to sell)
- Cycle 7: Add email capture (ConvertKit/Mailchimp)
- Cycle 8: A/B testing setup
```

---

## Integration with Other Commands

### → /now
After plan is created, use `/now` to see current cycle

### → /next
Advance through cycles sequentially

### → /fast [feature]
Skip planning, build specific feature immediately (see `/fast` command)

### → /create [feature]
Build specific feature with specialists

### → /done
Mark current cycle complete, capture lessons

---

## Key Principles

1. **Template-first always** - Search /web/src/pages/ before building anything
2. **Default to minimum cycles** - Start with smallest viable plan (templates reduce by 50-80%)
3. **Quick wins in first 5 cycles** - Show progress early (copy → customize → deploy)
4. **Frontend-only by default** - Add backend only when necessary (templates make this even faster)
5. **Reuse integrations** - Copy Stripe, auth, forms from existing pages
6. **Parallelize aggressively** - Run independent work simultaneously
7. **Ship early, enhance later** - MVP first, features follow
8. **Follow-up Stripe** - If e-commerce detected, suggest Stripe as next cycle
9. **Learn from templates** - Each template saves 5-20 cycles vs from scratch

---

## State Persistence

Plans are saved to:
- `.claude/state/plan.json` - Full plan with all cycles
- `.claude/state/cycle.json` - Current cycle context
- `one/events/plans/[feature-name].md` - Human-readable plan export

---

## See Also

- `/fast` - Build features rapidly without planning
- `/create` - Build specific features with specialists
- `/now` - View current cycle
- `/done` - Complete cycles and advance
