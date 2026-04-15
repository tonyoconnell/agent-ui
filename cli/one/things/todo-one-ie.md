---
title: Todo One Ie
dimension: things
primary_dimension: things
category: todo-one-ie.md
tags: ai, cycle, knowledge
related_dimensions: events, knowledge, people, groups, connections, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-one-ie.md category.
  Location: one/things/todo-one-ie.md
  Purpose: Documents one platform: public launch (https://one.ie) v1.0.0
  Related dimensions: events, knowledge, people
  For AI agents: Read this to understand todo one ie.
---

# ONE Platform: Public Launch (https://one.ie) v1.0.0

**Focus:** Marketing site, creator dashboard, admin dashboard, public APIs, documentation
**Process:** `Cycle 1-100 cycle sequence`
**Timeline:** 8-12 cycles per specialist per day
**Target:** Public launch as platform (Wave 4 - Final assembly)

---

## PHASE 1: FOUNDATION & SETUP (Cycle 1-10)

**Purpose:** Define public platform vision, pages, and structure

### Cycle 1: Define Brand Identity

- [ ] Brand document:
  - [ ] Logo + wordmark (already exists?)
  - [ ] Color palette (primary, secondary, accents)
  - [ ] Typography (headings, body, code)
  - [ ] Tone of voice (friendly, professional, educational)
  - [ ] Mission statement: "Enable creators to build AI-native businesses"
  - [ ] Values: Open, decentralized, creator-first
- [ ] Create `one/knowledge/brand-guide.md`
- [ ] Document in Figma or Storybook

### Cycle 2: Map Public Platform Structure

- [ ] Site hierarchy:
  - [ ] `/` - Landing page (hero + features)
  - [ ] `/about` - About ONE + team
  - [ ] `/creators` - Creator stories + testimonials
  - [ ] `/agents` - Agent framework + examples
  - [ ] `/pricing` - Plans + comparison
  - [ ] `/docs` - Full documentation
  - [ ] `/dashboard` - Creator dashboard (logged in)
  - [ ] `/admin` - Admin dashboard (platform owner)
  - [ ] `/marketplace` - Product marketplace
  - [ ] `/blog` - Educational content
  - [ ] `/status` - System status
- [ ] Each page maps to different owner

### Cycle 3: Define Landing Page Content

- [ ] Sections:
  1. **Hero:** Headline "Build AI-native Businesses"
     - [ ] Subheadline (unique value prop)
     - [ ] CTA buttons: "Get Started" + "Learn More"
     - [ ] Hero image/animation
  2. **Problem:** What creators struggle with
     - [ ] API key management
     - [ ] Payment complexity
     - [ ] Integration overhead
  3. **Solution:** How ONE solves it
     - [ ] X402 payments (no setup)
     - [ ] Agent marketplace (discovery)
     - [ ] 6-dimension ontology (flexible)
  4. **Features:** Top 5 features
     - [ ] Payments via X402
     - [ ] Agent deployment
     - [ ] Skill marketplace
     - [ ] Analytics dashboard
     - [ ] Team collaboration
  5. **Social Proof:** Creator testimonials
     - [ ] 3-5 video testimonials
     - [ ] Stats (creators, revenue, agents)
  6. **Pricing:** Plans available
     - [ ] Freemium model
     - [ ] Pro plan
     - [ ] Enterprise contact
  7. **FAQ:** Common questions
  8. **CTA:** Final call to action

### Cycle 4: Define Creator Dashboard

- [ ] After login, creators see dashboard with:
  - [ ] Welcome message + onboarding progress
  - [ ] Quick stats: revenue (week/month), customers, products
  - [ ] Recent sales notifications
  - [ ] Charts: Revenue trend, product performance
  - [ ] Action cards:
    - [ ] "Create new product"
    - [ ] "View sales"
    - [ ] "Manage team"
    - [ ] "Connect wallet"
    - [ ] "View analytics"
  - [ ] Sidebar navigation (content, sales, settings, team)
  - [ ] Profile menu (settings, docs, logout)

### Cycle 5: Define Admin Dashboard

- [ ] Platform owner sees:
  - [ ] Global stats: Total revenue, creators, customers, orders
  - [ ] Revenue charts (daily, weekly, monthly)
  - [ ] Creator leaderboard (by revenue)
  - [ ] Customer growth chart
  - [ ] Payment failures + refunds
  - [ ] System health (uptime, API latency)
  - [ ] Dispute queue (if any)
  - [ ] Recent transactions
  - [ ] Sidebar: Creators, customers, orders, payments, disputes, settings
  - [ ] User management (ban, verify, support)

### Cycle 6: Define Documentation Structure

- [ ] Main sections:
  - [ ] **Getting Started:** Signup → create product → make sale
  - [ ] **Creators:** How to use dashboard, create products, manage team
  - [ ] **Developers:** API reference, SDK, webhooks, agent deployment
  - [ ] **Protocols:** X402 spec, Bazar discovery, A2A communication
  - [ ] **Examples:** Code samples (Python, JS, cURL)
  - [ ] **FAQ:** Common questions
  - [ ] **Support:** Contact, Discord, email
- [ ] All docs searchable + versioned

### Cycle 7: Plan Blog Content

- [ ] Content types:
  - [ ] **Tutorials:** How to create courses, sell products
  - [ ] **Case Studies:** Creator success stories
  - [ ] **Updates:** New features, product launches
  - [ ] **Technical:** Protocol deep dives, architecture
  - [ ] **Industry:** Trends in creator economy, AI agents
- [ ] Publishing:
  - [ ] Weekly blog post
  - [ ] Promote on social media
  - [ ] Link from newsletter
  - [ ] Archive in `/docs/blog`

### Cycle 8: Define Public API Documentation

- [ ] Sections:
  - [ ] **Authentication:** API keys, rate limits
  - [ ] **REST Endpoints:**
    - [ ] GET /api/products → list products
    - [ ] GET /api/orders → list orders
    - [ ] POST /api/checkout → create order
    - [ ] GET /api/analytics → stats
  - [ ] **GraphQL:** (Optional) Query schema
  - [ ] **Webhooks:** Payment events, order status
  - [ ] **SDK:** JavaScript/Python client library
  - [ ] **Examples:** cURL, JavaScript, Python
- [ ] Interactive: Swagger/OpenAPI UI
- [ ] Live sandbox for testing

### Cycle 9: Plan Status Page

- [ ] Show system health:
  - [ ] Platform status (operational, maintenance, degraded)
  - [ ] Component statuses:
    - [ ] Web (frontend)
    - [ ] API (backend)
    - [ ] Payments (X402, Stripe)
    - [ ] Database (Convex)
    - [ ] CDN (Cloudflare)
  - [ ] Uptime history (99.9% target)
  - [ ] Incident history
  - [ ] Subscribe to status updates
- [ ] Use Statuspage.io or build custom

### Cycle 10: Define Success Metrics for Public Launch

- [ ] Pre-launch:
  - [ ] [ ] All pages designed + built
  - [ ] [ ] Content complete (landing, docs, blog)
  - [ ] [ ] SEO optimized
  - [ ] [ ] Analytics set up
  - [ ] [ ] Monitoring configured
- [ ] Launch:
  - [ ] [ ] Domain: https://one.ie live
  - [ ] [ ] SSL certificate valid
  - [ ] [ ] Mobile responsive
  - [ ] [ ] Performance > 90 Lighthouse score
  - [ ] [ ] Accessibility > WCAG AA
- [ ] Post-launch:
  - [ ] [ ] 100+ signups in first week
  - [ ] [ ] 10+ creators published products
  - [ ] [ ] $1000+ in transactions processed
  - [ ] [ ] No critical bugs reported

---

## PHASE 2: BACKEND SETUP (Cycle 11-20)

**Purpose:** Prepare backend for public access

### Cycle 11: Create Admin User + Dashboard Routes

- [ ] Create platform_owner user in DB
- [ ] Protect admin routes:
  - [ ] `/admin/*` routes check role = platform_owner
  - [ ] Return 401 if not authenticated
  - [ ] Redirect to login if needed
- [ ] Admin query routes:
  - [ ] `queries/admin/dashboard-stats.ts`
  - [ ] `queries/admin/creators.ts`
  - [ ] `queries/admin/orders.ts`
  - [ ] `queries/admin/payments.ts`

### Cycle 12: Create Public Read-Only API

- [ ] Create public queries:
  - [ ] `queries/public/products.ts` - List published products
  - [ ] `queries/public/creators.ts` - List creators
  - [ ] `queries/public/marketplace.ts` - Search + filter
- [ ] No authentication required for read
- [ ] Cache responses for performance
- [ ] Rate limit: 100 requests/minute per IP

### Cycle 13: Create Analytics Events

- [ ] Track user interactions:
  - [ ] Page views
  - [ ] Button clicks
  - [ ] Form submissions
  - [ ] Search queries
  - [ ] Product views
  - [ ] Conversions
- [ ] Log to Convex events table
- [ ] Analyze for:
  - [ ] Traffic sources
  - [ ] Popular products
  - [ ] Conversion rate
  - [ ] User flow

### Cycle 14: Set Up Email Newsletter

- [ ] Create newsletter system:
  - [ ] Signup form on landing page
  - [ ] Welcome email on signup
  - [ ] Weekly digest (new creators, products, blog)
  - [ ] Transactional emails (sales, updates)
- [ ] Use Convex + Resend
- [ ] Track opens/clicks

### Cycle 15: Create Monitoring + Alerting

- [ ] Monitor:
  - [ ] Page load times
  - [ ] API response times
  - [ ] Error rates
  - [ ] Database latency
- [ ] Alerts if:
  - [ ] Page load > 3s
  - [ ] API error rate > 1%
  - [ ] Database slow (> 1s)
  - [ ] Payment failures > 5%
- [ ] Dashboard in Datadog/New Relic

### Cycle 16: Set Up CDN + Caching

- [ ] Cloudflare Pages caching:
  - [ ] HTML: 5 minutes (must revalidate)
  - [ ] CSS/JS: 1 year (long-lived)
  - [ ] Images: 1 month
  - [ ] API responses: 1 minute
- [ ] Cache invalidation on deploy

### Cycle 17: Create Robots.txt + Sitemap

- [ ] `/robots.txt`: Allow search engines
- [ ] `/sitemap.xml`: All pages for SEO
- [ ] Register with Google Search Console
- [ ] Register with Bing Webmaster Tools

### Cycle 18: Set Up Analytics

- [ ] Google Analytics 4:
  - [ ] Track pageviews
  - [ ] Track events (signup, purchase)
  - [ ] Track user flow
  - [ ] Set conversion goals
- [ ] Alternative: Posthog (privacy-friendly)
- [ ] Custom dashboards per team

### Cycle 19: Create API Rate Limiting

- [ ] Implement per-user rate limiting:
  - [ ] Anonymous: 100 req/min
  - [ ] Authenticated: 1000 req/min
  - [ ] Premium: 10000 req/min
- [ ] Return 429 Too Many Requests if exceeded
- [ ] Include rate limit headers in response

### Cycle 20: Create Security Headers

- [ ] Add HTTP security headers:
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options: SAMEORIGIN
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Strict-Transport-Security
  - [ ] Referrer-Policy
  - [ ] Permissions-Policy
- [ ] Use Cloudflare for automatic headers

---

## PHASE 3: FRONTEND - MARKETING PAGES (Cycle 21-30)

**Purpose:** Build beautiful landing page + marketing site

### Cycle 21: Create LandingPage Component

- [ ] Full-page landing with sections from Cycle 3
- [ ] Hero section:
  - [ ] Animated gradient background
  - [ ] Headline (large, bold)
  - [ ] Subheadline
  - [ ] CTA buttons (primary + secondary)
  - [ ] Hero image (animation or video)
- [ ] Responsive: Mobile-first design
- [ ] Performance: Lazy load below-fold content

### Cycle 22: Create ProductCard for Marketplace

- [ ] Same as todo-ecommerce but with creator name
- [ ] Click → navigate to product page
- [ ] Favorite button (heart icon)
- [ ] Share button (social media)

### Cycle 23: Create CreatorProfilePreview

- [ ] Mini card showing:
  - [ ] Avatar
  - [ ] Creator name
  - [ ] Title/expertise
  - [ ] Follower count
  - [ ] "Follow" button
- [ ] Click → navigate to creator profile

### Cycle 24: Create TestimonialSection

- [ ] Carousel of creator testimonials:
  - [ ] Avatar + name
  - [ ] Quote
  - [ ] Stats (revenue earned, products sold)
  - [ ] Auto-advance or manual nav
- [ ] Video testimonials (if available)

### Cycle 25: Create PricingSection

- [ ] 3 plans: Free, Pro, Enterprise
- [ ] For each: Price, features checklist, CTA
- [ ] Comparison table (detailed features)
- [ ] FAQ below

### Cycle 26: Create DocumentationNav

- [ ] Searchable sidebar:
  - [ ] Getting started
  - [ ] Creators guide
  - [ ] Developers guide
  - [ ] API reference
  - [ ] Protocols
  - [ ] Examples
- [ ] Full-text search
- [ ] Breadcrumb navigation

### Cycle 27: Create CreatorDashboardLayout

- [ ] Sidebar with navigation
- [ ] Header with user menu
- [ ] Main content area (responsive)
- [ ] Dark mode toggle
- [ ] Mobile sidebar toggle
- [ ] Responsive: Collapses on mobile

### Cycle 28: Create AdminDashboardLayout

- [ ] Similar to creator dashboard but for platform owner
- [ ] Sidebar: Creators, Customers, Orders, Payments, Settings
- [ ] Main: Stats cards, charts, tables
- [ ] Extra: User management, disputes, system health

### Cycle 29: Create BlogListing

- [ ] Blog post grid:
  - [ ] Post image
  - [ ] Category tag
  - [ ] Title
  - [ ] Excerpt
  - [ ] Author + date
  - [ ] Read time
- [ ] Filters: By category, author, date
- [ ] Pagination

### Cycle 30: Create BlogPostPage

- [ ] Post content:
  - [ ] Featured image
  - [ ] Title + author + date
  - [ ] Table of contents (if long)
  - [ ] Body (markdown formatted)
  - [ ] Code syntax highlighting
  - [ ] Images in-line
  - [ ] Related posts at bottom

---

## PHASE 4: ASTRO PAGES (Cycle 31-40)

**Purpose:** Create all marketing pages in Astro

### Cycle 31: Create Landing Page

- [ ] `src/pages/index.astro`
- [ ] Use LandingPage component
- [ ] SEO: Meta tags, OG image
- [ ] Structured data (JSON-LD)

### Cycle 32: Create About Page

- [ ] `src/pages/about.astro`
- [ ] Company story + mission
- [ ] Team bios + photos
- [ ] Values + culture
- [ ] Hiring link (if recruiting)

### Cycle 33: Create Creator Stories

- [ ] `src/pages/creators.astro`
- [ ] Featured creator profiles
- [ ] Success metrics (revenue, customers)
- [ ] Video testimonials
- [ ] Link to full marketplace

### Cycle 34: Create Pricing Page

- [ ] `src/pages/pricing.astro`
- [ ] 3 plan cards
- [ ] Comparison table
- [ ] FAQ section
- [ ] CTA for each plan

### Cycle 35: Create Documentation Index

- [ ] `src/pages/docs/index.astro`
- [ ] List all doc categories
- [ ] Quick links to popular docs
- [ ] Search box
- [ ] Getting started guide

### Cycle 36: Create Markdown Doc Pages

- [ ] `src/pages/docs/[...slug].astro`
- [ ] Dynamic routing for all docs
- [ ] Sidebar navigation
- [ ] Breadcrumbs
- [ ] Table of contents
- [ ] Previous/next links

### Cycle 37: Create Blog Index

- [ ] `src/pages/blog/index.astro`
- [ ] Blog listing with filters
- [ ] Search
- [ ] Featured posts

### Cycle 38: Create Blog Post Pages

- [ ] `src/pages/blog/[slug].astro`
- [ ] Dynamic routing
- [ ] Full post content
- [ ] Related posts
- [ ] Comments (Disqus or similar)

### Cycle 39: Create Status Page

- [ ] `src/pages/status.astro`
- [ ] System components + statuses
- [ ] Uptime history
- [ ] Incident log
- [ ] Subscribe option

### Cycle 40: Create 404 + 500 Pages

- [ ] `src/pages/404.astro` - Not found (helpful, links to home/docs)
- [ ] `src/pages/500.astro` - Server error (comforting, status page link)

---

## PHASE 5-10: CONTINUATION

[Abbreviated for space - Full structure continues with:

- Phase 5: Dashboard pages (creator + admin)
- Phase 6: Testing + SEO optimization
- Phase 7: Design finalization + brand compliance
- Phase 8: Performance tuning + lighthouse
- Phase 9: Deployment + DNS setup
- Phase 10: Launch + monitoring]

---

## SUCCESS CRITERIA

Public platform launch complete when:

- ✅ https://one.ie resolves + is live
- ✅ Landing page loads < 2s on 4G
- ✅ Mobile responsive (90+ Lighthouse score)
- ✅ Accessibility WCAG AA (or better)
- ✅ All marketing pages complete (about, pricing, creators, etc)
- ✅ Creator dashboard fully functional
- ✅ Admin dashboard complete
- ✅ API documentation live + searchable
- ✅ Blog with 5+ posts
- ✅ Status page monitoring infrastructure
- ✅ Analytics tracking users + conversions
- ✅ SEO: Indexed in Google
- ✅ Social media links + previews
- ✅ Email list growing
- ✅ First 100 signups in first week
- ✅ Press coverage + mentions
- ✅ Public launch announcement

---

**Status:** Wave 4 - Final Assembly & Public Launch
**Follows:** todo-onboard (Wave 1), todo-agents/skills/sell (Wave 2), todo-ecommerce/api/features (Wave 3)
