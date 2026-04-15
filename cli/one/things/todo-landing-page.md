---
title: Todo Landing Page
dimension: things
primary_dimension: things
category: todo-landing-page.md
tags: agent, ai, cycle
related_dimensions: connections, events, people, groups, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-landing-page.md category.
  Location: one/things/todo-landing-page.md
  Purpose: Documents one platform: landing page & project onboarding v1.0.0
  Related dimensions: connections, events, people
  For AI agents: Read this to understand todo landing page.
---

# ONE Platform: Landing Page & Project Onboarding v1.0.0

**Focus:** Entry point for new creators - "Start a Project" instead of "Pick a Template"
**Process:** `Cycle 1-100 cycle sequence`
**Timeline:** 8-12 cycles per specialist per day
**Target:** Zero-friction creator onboarding (Wave 0 - ENTRY POINT)
**Integration:** Works with todo-onboard, todo-agents (via agent-clone)

---

## CRITICAL CONTEXT

**Current Problem:**

- Generic landing page ("Pick a template") doesn't guide creators
- Creators don't know where to start
- Templates are isolated (no context)

**Solution:**

- **"Start a Project"** workflow (not templates)
- **AI landing page generation** (paste URL/social → AI builds landing page)
- **Live demos** (see working examples before starting)
- **Guided paths** (beginner vs advanced)
- **Agent-powered** (agent-clone asks for context, generates content)

**User Journey:**

```
Land on one.ie
    ↓
See featured creators + demo projects
    ↓
Click "Start a Project"
    ↓
Choose: Beginner (simple project) or Advanced (dashboard)
    ↓
Beginner: "I have a URL" → Paste → AI generates landing page + product listings
Advanced: "I want a dashboard" → Linked to live demo
    ↓
Create account
    ↓
Onboarding guides them
    ↓
First creator ready to earn
```

---

## PHASE 1: FOUNDATION & SETUP (Cycle 1-10)

**Purpose:** Understand entry point landscape, map to ontology, plan implementation

### Cycle 1: Define "Start a Project" Concept

- [ ] Not "Pick a Template" - too generic
- [ ] Is "Start a Project" - guided journey
- [ ] Three paths for users:
  1. **Beginner Path:** "I have a website/social"
     - Paste URL or social profile
     - AI extracts info (who they are, what they do)
     - Generate landing page + product listings
     - Easy setup, fast to sell
  2. **Intermediate Path:** "I want to sell courses"
     - Product creation workflow
     - Course structure (modules, lessons)
     - Student dashboard
     - Certificate generation
  3. **Advanced Path:** "I want a full dashboard"
     - Creator analytics
     - Team management
     - Custom branding
     - API access
- [ ] Each path shows a DEMO before committing
  - [ ] Beginner demo: Working course site (like One.ie itself)
  - [ ] Intermediate demo: Padel course example
  - [ ] Advanced demo: Creator dashboard with metrics

### Cycle 2: Map to 6-Dimension Ontology

- [ ] **Groups:** Creator's project (group as container)
- [ ] **People:**
  - [ ] Creator (initiates project)
  - [ ] AI agent-clone (generates content)
  - [ ] Platform admin (approves if needed)
- [ ] **Things:**
  - [ ] project (new thing type)
  - [ ] project_template (starter projects)
  - [ ] landing_page (generated or custom)
  - [ ] project_demo (working example)
- [ ] **Connections:**
  - [ ] creator → project (owns)
  - [ ] project → template (based_on)
  - [ ] project → demo (showcases)
  - [ ] agent-clone → project (generated)
- [ ] **Events:**
  - [ ] project_created
  - [ ] landing_page_generated
  - [ ] demo_viewed
  - [ ] project_published
- [ ] **Knowledge:**
  - [ ] project_category (course, service, marketplace, portfolio)
  - [ ] project_description (embedding for search)
  - [ ] creator_niche (what they teach/sell)

### Cycle 3: Define Project Templates

- [ ] **Starter Projects** (not templates - frameworks):
  1. **Blog/Portfolio**
     - Landing page
     - Blog posts (markdown)
     - About page
     - Contact form
     - No CMS (manual updates)
     - Perfect for: Writers, consultants, coaches
  2. **Course Marketplace**
     - Landing page
     - Course listings
     - Lesson structure
     - Student enrollment
     - Certificate generation
     - Perfect for: Educators, experts, coaches
  3. **Service Directory**
     - Landing page
     - Service listings
     - Booking/scheduling
     - Payment processing (X402)
     - Client reviews
     - Perfect for: Consultants, agencies, professionals
  4. **Community/Membership**
     - Landing page
     - Member-only content
     - Discussion forums
     - Events calendar
     - Tier-based access
     - Perfect for: Communities, DAOs, groups
  5. **Newsletter**
     - Landing page
     - Subscriber signup
     - Email scheduling
     - Archive of posts
     - Paid tiers
     - Perfect for: Writers, journalists, thought leaders

- [ ] Each template includes:
  - [ ] Demo (live working example)
  - [ ] Starter content (fills in blanks)
  - [ ] Onboarding guide (how to customize)
  - [ ] Success metrics (what to measure)

### Cycle 4: Plan AI Landing Page Generation (agent-clone)

- [ ] **Flow:**
  1. User selects "I have a website/social"
  2. Paste: Website URL OR Social profile (Twitter, LinkedIn, YouTube)
  3. Agent-clone calls:
     - [ ] WebFetch to read URL content
     - [ ] Extract: Name, bio, what they do, links
     - [ ] Claude to summarize + understand niche
  4. Agent generates:
     - [ ] Landing page headline
     - [ ] Hero image (or template)
     - [ ] Value proposition
     - [ ] About section
     - [ ] Services/products list
     - [ ] Call-to-action
  5. User reviews + edits
  6. Landing page published

- [ ] **What if no URL?**
  - [ ] Chat-based: Agent asks questions
    - [ ] "What do you teach/sell?"
    - [ ] "Who is your audience?"
    - [ ] "What's your unique angle?"
  - [ ] Agent builds landing page from conversation

### Cycle 5: Define Demo Projects

- [ ] **Live Demos** (working examples users can interact with):
  1. **Padel Course Demo**
     - Landing page (full sales page)
     - Course: "Master Padel Basics"
     - 3 modules, 9 lessons
     - Student dashboard
     - Certificate
     - Pricing: $99 (via X402)
     - URL: https://one.ie/demo/padel-course
     - Built with: Course Marketplace template
  2. **Coaching Services Demo**
     - Landing page
     - 3 services (group, 1:1, corporate)
     - Booking calendar
     - Reviews from past clients
     - Payment (X402)
     - URL: https://one.ie/demo/coaching
     - Built with: Service Directory template
  3. **Newsletter Demo**
     - Landing page
     - 5 published articles
     - Subscribe form
     - Paid tier ($5/month)
     - Archive
     - URL: https://one.ie/demo/newsletter
     - Built with: Newsletter template
  4. **Community Demo**
     - Landing page
     - Member directory
     - Discussion board (3 topics)
     - Events calendar
     - URL: https://one.ie/demo/community
     - Built with: Community template
  5. **Portfolio Demo**
     - Landing page
     - 5 portfolio projects
     - About section
     - Contact form
     - Blog (3 posts)
     - URL: https://one.ie/demo/portfolio
     - Built with: Blog/Portfolio template

- [ ] Each demo:
  - [ ] Is fully functional (can browse, read, click around)
  - [ ] Shows real usage patterns
  - [ ] Demonstrates platform capabilities
  - [ ] Has "Made with ONE" badge
  - [ ] Links back to "Create your own"

### Cycle 6: Plan Landing Page Layout (https://one.ie)

- [ ] **Hero Section:**
  - [ ] Headline: "Start Your Creator Project"
  - [ ] Subheadline: "Share your expertise, build your audience, earn money"
  - [ ] CTA: "Start a Project" (big button)
  - [ ] Secondary: "View Demo Projects" (link)
  - [ ] Hero image: Creator working on project (motivational)

- [ ] **Featured Creators Section:**
  - [ ] Show 3-5 successful creators
  - [ ] Name, photo, project type, earnings
  - [ ] Quote: Why they love ONE Platform
  - [ ] Link: "View their project"

- [ ] **Project Types Section:**
  - [ ] 5 starter projects (cards)
  - [ ] Each card shows:
    - [ ] Icon
    - [ ] Name (Course, Services, Newsletter, etc)
    - [ ] Description (1 sentence)
    - [ ] "See Demo" button
    - [ ] "Start This" button
  - [ ] Visual differentiation (colors, icons)

- [ ] **How It Works Section:**
  - [ ] 5 steps:
    1. Choose your project type
    2. Paste your URL or answer questions
    3. AI builds your landing page
    4. Customize + publish
    5. Start earning
  - [ ] Animated flow diagram

- [ ] **FAQ Section:**
  - [ ] "Do I need to code?" → No
  - [ ] "How do I earn money?" → X402 payments
  - [ ] "Can I customize?" → Yes, fully customizable
  - [ ] "What if I need help?" → Community + docs
  - [ ] "How much does it cost?" → Free to start, small commission

- [ ] **CTA Section:**
  - [ ] "Ready to start?"
  - [ ] Big button: "Start Your Project Now"
  - [ ] Smaller text: "No credit card required"

- [ ] **Footer:**
  - [ ] Links: Docs, Blog, Discord, Twitter
  - [ ] Legal: Privacy, Terms, Security

### Cycle 7: Plan Authentication Gate

- [ ] **When user clicks "Start a Project":**
  1. Check if logged in
  2. If not → Show login/signup modal
  3. If logged in but NOT onboarded → Redirect to todo-onboard
  4. If logged in AND onboarded → Show project selection

- [ ] **Modal experience:**
  - [ ] Email signup (simple)
  - [ ] Show what's next: "Next, we'll create your project"
  - [ ] Privacy note: "We'll never spam you"

### Cycle 8: Plan Agent-Clone Integration

- [ ] **What is agent-clone?**
  - [ ] Described in CLAUDE.md as: "AI clones of creators using their content as training data"
  - [ ] For landing pages: Custom AI that understands creator's voice + brand
  - [ ] Uses: WebFetch (read their site), Claude (analyze + generate), Convex (store)

- [ ] **How agent-clone helps:**
  1. User pastes URL
  2. agent-clone reads content (WebFetch)
  3. Extracts: Name, bio, what they do, tone of voice
  4. Creates vector embedding (semantic understanding)
  5. Claude generates landing page in THEIR voice
  6. Result: Landing page feels authentic, not generic

- [ ] **Implementation:**
  - [ ] New service: `backend/convex/services/landing-page-generator.ts`
  - [ ] Uses agent-clone internally
  - [ ] Returns: Generated landing page HTML + metadata

### Cycle 9: Plan "Start a Project" Flow UX

- [ ] **Step 1: Choose Project Type**
  - [ ] 5 cards: Course, Service, Newsletter, Community, Portfolio
  - [ ] Each shows: Icon, name, description, demo button
  - [ ] User clicks one

- [ ] **Step 2: Choose Creation Method**
  - [ ] Option A: "I have a website/social" → Paste URL
  - [ ] Option B: "Start from scratch" → Blank project
  - [ ] Option C: "Talk to me" → Chat with AI
  - [ ] User picks one

- [ ] **Step 3: Input**
  - [ ] If URL: Paste and submit
  - [ ] If scratch: Show blank canvas
  - [ ] If chat: Show conversation interface (agent-clone asks questions)

- [ ] **Step 4: Generate**
  - [ ] Show spinner: "Creating your landing page..."
  - [ ] agent-clone processes
  - [ ] Returns draft landing page

- [ ] **Step 5: Review**
  - [ ] Show generated landing page
  - [ ] Buttons: Edit, Publish, Start Over
  - [ ] Edit mode: In-browser editor (no code)

- [ ] **Step 6: Publish**
  - [ ] Landing page goes live
  - [ ] User added to project
  - [ ] Onboarding tutorials shown
  - [ ] Success! "Your project is live"

### Cycle 10: Define Success Metrics

- [ ] Landing page complete when:
  - [ ] [ ] https://one.ie landing page live
  - [ ] [ ] 5 demo projects functional (can click around)
  - [ ] [ ] "Start a Project" button routes to auth/onboard
  - [ ] [ ] AI landing page generation working (end-to-end)
  - [ ] [ ] Agent-clone integrated (reads URL, generates content)
  - [ ] [ ] First creator uses AI to generate landing page
  - [ ] [ ] Project published and shows on their dashboard
  - [ ] [ ] Mobile responsive (looks good on phone)
  - [ ] [ ] < 2 second page load
  - [ ] [ ] 10+ creators started projects in first week
  - [ ] [ ] 50%+ of creators use AI generation (vs manual)
  - [ ] [ ] Positive sentiment in early feedback

---

## PHASE 2: BACKEND SCHEMA & SERVICES (Cycle 11-20)

**Purpose:** Add project + landing page things to schema

### Cycle 11: Create Project Thing Type

- [ ] New thing type: `project`

  ```typescript
  {
    type: 'project',
    properties: {
      // Identification
      projectId: string,  // Unique slug
      creatorId: Id<'things'>,  // Owner
      name: string,
      description: string,
      category: 'course' | 'service' | 'newsletter' | 'community' | 'portfolio',

      // Content
      landingPageId: Id<'things'>,  // Link to landing page
      theme: string,  // Color scheme
      favicon: string,  // Icon
      customDomain: string,  // If user has one

      // Settings
      visibility: 'draft' | 'published' | 'archived',
      publishedAt: number,
      isTemplate: boolean,  // Is this a demo/template?

      // Metadata
      tags: string[],
      createdAt: number,
      updatedAt: number,
    }
  }
  ```

### Cycle 12: Create Landing Page Thing Type

- [ ] New thing type: `landing_page`

  ```typescript
  {
    type: 'landing_page',
    properties: {
      // Identification
      landingPageId: string,
      projectId: Id<'things'>,

      // Content
      headline: string,
      subheadline: string,
      hero_image: string,

      // Sections
      about: string,  // HTML or markdown
      features: [{
        title: string,
        description: string,
        icon: string,
      }],

      // CTA
      ctaText: string,
      ctaUrl: string,

      // Generated or Custom
      generatedBy: 'ai' | 'manual',  // How was it created?
      generatedFrom: {
        url: string,  // If from website
        social: string,  // If from social
        conversation: string,  // If from chat
      },

      // Meta
      publishedAt: number,
      views: number,  // Traffic tracking
      conversions: number,  // CTAs clicked
    }
  }
  ```

### Cycle 13: Create Landing Page Service (Effect.ts)

- [ ] Service: `backend/convex/services/landing-page.ts`
- [ ] Methods:
  - [ ] `generateFromUrl(url)` → landing_page
  - [ ] `generateFromSocial(socialHandle, platform)` → landing_page
  - [ ] `generateFromChat(conversation)` → landing_page
  - [ ] `updateLandingPage(id, content)` → updated
  - [ ] `publishLandingPage(id)` → published
  - [ ] `getLandingPageMetrics(id)` → views + conversions

### Cycle 14: Integrate agent-clone

- [ ] Service: `backend/convex/services/agent-clone-landing.ts`
- [ ] Methods:
  - [ ] `cloneFromUrl(url)` → Use WebFetch to read, Claude to analyze
  - [ ] `extractCreatorIdentity(content)` → Name, niche, tone, links
  - [ ] `generateLandingPageInVoice(identity)` → HTML in THEIR voice
  - [ ] `createEmbedding(content)` → Vector for similarity search

### Cycle 15: Create Convex Mutations

- [ ] `mutations/projects.ts`:
  - [ ] `createProject(creatorId, name, category)` → projectId
  - [ ] `updateProject(projectId, data)` → updated
  - [ ] `publishProject(projectId)` → published
  - [ ] `deleteProject(projectId)` → deleted
- [ ] `mutations/landing-pages.ts`:
  - [ ] `generateLandingPage(projectId, sourceUrl)` → landing_page
  - [ ] `updateLandingPage(pageId, content)` → updated
  - [ ] `publishLandingPage(pageId)` → published

### Cycle 16: Create Convex Queries

- [ ] `queries/projects.ts`:
  - [ ] `getProject(projectId)` → project details
  - [ ] `getCreatorProjects(creatorId)` → projects[]
  - [ ] `getDemoProjects()` → demo projects for landing page
  - [ ] `searchProjects(query)` → projects matching
- [ ] `queries/landing-pages.ts`:
  - [ ] `getLandingPage(pageId)` → page content
  - [ ] `getLandingPageMetrics(pageId)` → views + conversions

### Cycle 17: Create API Routes for Generation

- [ ] `web/src/pages/api/projects/generate.ts`
  - [ ] POST with: url OR socialHandle + platform
  - [ ] Returns: Landing page HTML preview
  - [ ] Calls: landing-page generator service
- [ ] `web/src/pages/api/projects/create.ts`
  - [ ] POST with: name, category, landingPageId
  - [ ] Creates project
  - [ ] Returns: projectId + dashboard link

### Cycle 18: Create Demo Projects (Seeding)

- [ ] Script: `backend/convex/seed-demo-projects.ts`
- [ ] Creates 5 demo projects:
  1. Padel course (with content)
  2. Coaching services (with bookings)
  3. Newsletter (with posts)
  4. Community (with discussions)
  5. Portfolio (with works)
- [ ] Each has:
  - [ ] Landing page (generated or crafted)
  - [ ] Sample content
  - [ ] "Made with ONE" badge
  - [ ] Demo user account

### Cycle 19: Create Landing Page Templates

- [ ] `backend/convex/seeds/templates.ts`
- [ ] Each starter project has:
  - [ ] HTML template (landing page)
  - [ ] CSS styling (responsive)
  - [ ] JavaScript (forms, modals)
  - [ ] Content placeholder (replaceable)
- [ ] Templates stored in Convex for:
  - [ ] Course
  - [ ] Service
  - [ ] Newsletter
  - [ ] Community
  - [ ] Portfolio

### Cycle 20: Implement Analytics for Landing Pages

- [ ] Track:
  - [ ] Page views (via event)
  - [ ] CTA clicks (button press)
  - [ ] Scroll depth (how far down page)
  - [ ] Conversion funnel
- [ ] Log to events table
- [ ] Query dashboard: "5000 views, 150 clicks, 30 signups"

---

## PHASE 3: FRONTEND - LANDING PAGE (Cycle 21-30)

**Purpose:** Build beautiful landing page UI at https://one.ie

### Cycle 21: Create Hero Section Component

- [ ] Component: `web/src/components/landing/HeroSection.tsx`
- [ ] Displays:
  - [ ] Headline + subheadline
  - [ ] Hero image (creator in action)
  - [ ] CTA button: "Start a Project"
  - [ ] Secondary CTA: "View Demos"
  - [ ] Background: Gradient or animated

### Cycle 22: Create Featured Creators Section

- [ ] Component: `web/src/components/landing/FeaturedCreators.tsx`
- [ ] Shows:
  - [ ] 3-5 creator cards
  - [ ] Photo, name, project type, earnings
  - [ ] Quote/testimonial
  - [ ] "View their project" link
  - [ ] Carousel (swipeable on mobile)

### Cycle 23: Create Project Types Section

- [ ] Component: `web/src/components/landing/ProjectTypes.tsx`
- [ ] Shows:
  - [ ] 5 project type cards (grid)
  - [ ] Each: Icon, name, description
  - [ ] "See Demo" button
  - [ ] "Start This" button
  - [ ] Hover: Show preview image

### Cycle 24: Create How It Works Section

- [ ] Component: `web/src/components/landing/HowItWorks.tsx`
- [ ] Shows:
  - [ ] 5 steps (vertical or horizontal flow)
  - [ ] Step 1: Choose type (icon)
  - [ ] Step 2: Paste URL (icon)
  - [ ] Step 3: AI builds (icon)
  - [ ] Step 4: Customize (icon)
  - [ ] Step 5: Earn (icon)
  - [ ] Animated connections between steps

### Cycle 25: Create FAQ Section

- [ ] Component: `web/src/components/landing/FAQ.tsx`
- [ ] Shows:
  - [ ] 5 questions (accordion style)
  - [ ] Expandable answers
  - [ ] Smooth animation
  - [ ] Search FAQ (optional)

### Cycle 26: Create Demo Project Links

- [ ] Component: `web/src/components/landing/DemoLinks.tsx`
- [ ] Shows:
  - [ ] 5 working demo projects
  - [ ] Cards with: Name, category, image, link
  - [ ] Click: Opens demo in new tab
  - [ ] Or: Embedded iframe (sandboxed)

### Cycle 27: Create Start Project Modal

- [ ] Component: `web/src/components/landing/StartProjectModal.tsx`
- [ ] Modal flow:
  - [ ] Step 1: Choose project type (5 options)
  - [ ] Step 2: Choose creation method (3 options)
  - [ ] Step 3: Input (URL paste, blank, or chat)
  - [ ] Step 4: Generate (show spinner, call API)
  - [ ] Step 5: Preview (show generated landing page)

### Cycle 28: Create Project Generation Flow UI

- [ ] Component: `web/src/components/landing/ProjectGenerationFlow.tsx`
- [ ] Sub-components:
  - [ ] ProjectTypeSelector (5 cards)
  - [ ] CreationMethodSelector (3 options)
  - [ ] URLInput (text field + submit)
  - [ ] GenerationSpinner (progress indicator)
  - [ ] LandingPagePreview (show draft)

### Cycle 29: Create Landing Page (Astro)

- [ ] `web/src/pages/index.astro`
- [ ] Sections (in order):
  1. HeroSection
  2. FeaturedCreators
  3. ProjectTypes
  4. HowItWorks
  5. FAQ
  6. CTA (final push)
  7. DemoLinks
  8. Footer
- [ ] All components use `client:load` (interactive)
- [ ] Dark mode support

### Cycle 30: Create Demo Pages

- [ ] `web/src/pages/demo/[project].astro`
- [ ] Dynamic route for each demo:
  - [ ] /demo/padel-course
  - [ ] /demo/coaching
  - [ ] /demo/newsletter
  - [ ] /demo/community
  - [ ] /demo/portfolio
- [ ] Each demo:
  - [ ] Shows the project fully
  - [ ] Functional (can click around)
  - [ ] "Try this project type" button at bottom
  - [ ] Links back to landing page

---

## PHASE 4: API ROUTES & INTEGRATION (Cycle 31-40)

**Purpose:** Connect landing page to backend, enable project creation

### Cycle 31: Create Project Generation API Route

- [ ] `web/src/pages/api/projects/generate.ts`
- [ ] POST endpoint:
  ```
  Input: {
    projectType: 'course' | 'service' | 'newsletter' | 'community' | 'portfolio',
    sourceUrl?: string,
    socialHandle?: string,
    socialPlatform?: 'twitter' | 'linkedin' | 'youtube',
    useChat?: boolean,  // If true, use conversation
  }
  Output: {
    landingPageHtml: string,
    preview: string,
    metadata: { headline, description, links }
  }
  ```
- [ ] Calls: landing-page generator service

### Cycle 32: Create Project Creation API Route

- [ ] `web/src/pages/api/projects/create.ts`
- [ ] POST endpoint:
  ```
  Input: {
    name: string,
    projectType: string,
    landingPageContent: string,
  }
  Output: {
    projectId: string,
    dashboardUrl: string,
  }
  ```
- [ ] Requires: User authenticated + onboarded
- [ ] Creates: Project thing + landing page thing

### Cycle 33: Create Auth Gate

- [ ] Middleware: Check if user logged in
- [ ] Route: POST /api/projects/\* requires auth
- [ ] Route: GET /api/projects/demo/\* public (no auth)
- [ ] Redirect: If not logged in → /auth/login
- [ ] Redirect: If not onboarded → /onboarding

### Cycle 34: Create Landing Page Fetch Route

- [ ] `web/src/pages/api/landing-pages/fetch.ts`
- [ ] GET endpoint:
  ```
  Input: { url: string }
  Output: { content: string, metadata: { title, description } }
  ```
- [ ] Uses: WebFetch to read URL
- [ ] Returns: HTML content

### Cycle 35: Create Agent-Clone Integration Route

- [ ] `web/src/pages/api/projects/ai-generate.ts`
- [ ] POST endpoint (AI generation):
  ```
  Input: {
    sourceUrl?: string,
    socialHandle?: string,
    conversationHistory?: Message[],
  }
  Output: {
    landingPageHtml: string,
    creatorIdentity: { name, bio, tone, links },
  }
  ```
- [ ] Calls: agent-clone service
- [ ] Generates: Landing page in creator's voice

### Cycle 36: Create Chat Conversation Route

- [ ] `web/src/pages/api/projects/chat.ts`
- [ ] POST endpoint:
  ```
  Input: { message: string, conversationId: string }
  Output: { aiResponse: string, suggestedLandingPage?: string }
  ```
- [ ] Uses: Claude API (via agent-clone)
- [ ] Agent asks: "What do you teach?" → "Who's your audience?" → etc
- [ ] Eventually: Generates landing page from conversation

### Cycle 37: Create Project Publishing Route

- [ ] `web/src/pages/api/projects/publish.ts`
- [ ] POST endpoint:
  ```
  Input: { projectId: string }
  Output: { projectUrl: string, published: boolean }
  ```
- [ ] Updates: project.visibility = 'published'
- [ ] Logs: project_published event

### Cycle 38: Create Demo Projects API

- [ ] `web/src/pages/api/demo/projects.ts`
- [ ] GET endpoint:
  ```
  Output: { projects: Project[] }
  ```
- [ ] Returns: All demo projects
- [ ] Used by: Landing page to list demos

### Cycle 39: Create Demo Project Route

- [ ] `web/src/pages/api/demo/[projectId].ts`
- [ ] GET endpoint:
  ```
  Input: { projectId: string }
  Output: { project: Project, landingPage: LandingPage }
  ```
- [ ] Returns: Full demo project content

### Cycle 40: Create Analytics Tracking Routes

- [ ] `web/src/pages/api/analytics/landing-page.ts`
- [ ] Track: Page views, CTA clicks, conversions
- [ ] POST: Log event when user performs action
- [ ] GET: Retrieve metrics for dashboard

---

## PHASE 5: AI AGENT-CLONE INTEGRATION (Cycle 41-50)

**Purpose:** Integrate agent-clone for voice-driven landing page generation

### Cycle 41: Design Agent-Clone Landing Page Generator

- [ ] What agent-clone does:
  - [ ] Reads creator's website/social (WebFetch)
  - [ ] Extracts: Name, bio, expertise, tone
  - [ ] Creates vector embedding (semantic understanding)
  - [ ] Claude generates landing page in THEIR voice
  - [ ] Result: Feels authentic, not AI-generated

- [ ] Why it's powerful:
  - [ ] User: "Here's my website"
  - [ ] Agent reads it
  - [ ] Agent understands: Who you are, what you do, how you talk
  - [ ] Agent generates: Landing page that SOUNDS like you
  - [ ] User: "Wow, that's exactly how I would say it!"

### Cycle 42: Implement URL Content Extraction

- [ ] Service method: `extractCreatorIdentity(url)`
- [ ] Uses: WebFetch to read URL
- [ ] Extracts:
  - [ ] Page title (name?)
  - [ ] Meta description (niche?)
  - [ ] H1-H3 headings (what do they focus on?)
  - [ ] Links (where do they point?)
  - [ ] Images (visual style?)
  - [ ] Text blocks (tone of voice?)
- [ ] Returns: Structured identity object

### Cycle 43: Implement Social Profile Extraction

- [ ] If user provides Twitter/LinkedIn/YouTube:
  - [ ] Fetch profile data (public info)
  - [ ] Extract bio
  - [ ] Extract recent posts/videos (for tone analysis)
  - [ ] Extract profile image
  - [ ] Extract follower count (validation)
- [ ] Returns: Social identity object

### Cycle 44: Implement Semantic Analysis

- [ ] Take extracted content
- [ ] Use Claude to analyze:
  - [ ] **Name:** What is their professional identity?
  - [ ] **Expertise:** What are they known for?
  - [ ] **Tone:** Casual? Professional? Academic? Energetic?
  - [ ] **Audience:** Who do they serve?
  - [ ] **Unique angle:** What makes them different?
- [ ] Returns: Understanding object (used for generation)

### Cycle 45: Implement Vector Embedding

- [ ] Create embedding of extracted content
- [ ] Uses: OpenAI embeddings API
- [ ] Purpose: Similarity search (find similar creators)
- [ ] Store: In Convex for later use
- [ ] Use case: "Find creators like you" (future feature)

### Cycle 46: Implement Landing Page Generation

- [ ] Claude generates landing page HTML
- [ ] System prompt: "You are a landing page designer. Create a landing page in the voice of [creator name]."
- [ ] Input: Creator identity + project type + category
- [ ] Output: Complete HTML + CSS (ready to publish)
- [ ] Quality checks:
  - [ ] Contains headline (required)
  - [ ] Contains CTA (required)
  - [ ] Uses creator's tone (validated)
  - [ ] Mobile responsive (CSS checked)

### Cycle 47: Implement Conversation-Based Generation

- [ ] Alternative to URL: Chat with AI
- [ ] Agent-clone asks questions:
  1. "What do you teach/sell?" (niche)
  2. "Who is your ideal student/customer?" (audience)
  3. "What's your unique approach?" (unique angle)
  4. "Tell me about your experience" (credibility)
  5. "How do you usually introduce yourself?" (tone)
- [ ] After 5 questions: Generate landing page
- [ ] Can iterate: "Can you make it more [casual/professional]?"

### Cycle 48: Create Agent-Clone Service

- [ ] Service: `backend/convex/services/agent-clone-landing.ts`
- [ ] Methods:
  - [ ] `cloneFromUrl(url)` → Call extractCreatorIdentity, then generate
  - [ ] `cloneFromSocial(handle, platform)` → Call extractSocialIdentity, then generate
  - [ ] `cloneFromConversation(messages)` → Analyze conversation, then generate
  - [ ] `refineGeneration(content, feedback)` → Re-generate with user feedback

### Cycle 49: Implement Human Review (Optional)

- [ ] For safety, quality, or brand protection:
  - [ ] High-visibility projects (>100 followers)
  - [ ] Controversial topics (flagged by content filter)
  - [ ] Premium tier (users pay for review)
- [ ] Flow:
  1. Generate landing page
  2. Flag for review if needed
  3. Human reviewer checks
  4. Approves or requests changes
  5. Creator notified

### Cycle 50: Create Agent-Clone Examples

- [ ] Document 3-5 success stories:
  1. "Website → Landing page" (URL extraction)
  2. "Tweet thread → Newsletter signup" (social extraction)
  3. "Video transcript → Course landing page" (YouTube extraction)
  4. "Q&A chat → Service landing page" (conversation)
  5. "LinkedIn profile → Coaching landing page" (social extraction)
- [ ] Show before/after
- [ ] Show time saved (manual vs AI)
- [ ] Show quality (side-by-side comparison)

---

## PHASE 6-10: CONTINUATION

[Abbreviated - follows standard pattern]

### Summary:

**Phase 6 (Cycle 51-60):** Quality & Testing

- Unit tests (generation logic)
- Integration tests (full flow)
- E2E tests (user journey)
- Agent-clone accuracy tests

**Phase 7 (Cycle 61-70):** Design & UX

- Landing page design tokens
- Modal flow UX
- Demo project layouts
- Accessibility (WCAG)

**Phase 8 (Cycle 71-80):** Performance & Optimization

- Image optimization (hero)
- API caching (demo projects)
- Generation speed (<3s)
- Mobile optimization

**Phase 9 (Cycle 81-90):** Deployment & Documentation

- Deploy landing page
- Create onboarding video
- Write docs for creators
- Set up analytics tracking

**Phase 10 (Cycle 91-100):** Knowledge & Lessons

- Document agent-clone learnings
- Capture success stories
- Plan improvements (Phase 2)
- Roadmap for advanced features

---

## CRITICAL INTEGRATION POINTS

### Integration 1: Landing Page → Auth Gate

```
User clicks "Start a Project"
  ↓
Check: Logged in?
  ↓ No: Show auth modal
  ↓ Yes: Check onboarded?
    ↓ No: Redirect to /onboarding
    ↓ Yes: Show "Start Project" flow
```

### Integration 2: Project Generation → Agent-Clone

```
User pastes URL
  ↓
Calls: POST /api/projects/ai-generate
  ↓
Service calls: agent-clone-landing
  ↓
  1. Extract identity (WebFetch)
  2. Analyze tone (Claude)
  3. Generate landing page (Claude)
  ↓
Returns: Landing page HTML
```

### Integration 3: Project Creation → Onboarding

```
User publishes project
  ↓
Project created in Convex
  ↓
Event: project_published
  ↓
Onboarding shows: "Congratulations! Your project is live"
  ↓
Guide: "Next steps: Add products + invite team"
```

### Integration 4: Demo Projects → Start Project

```
User clicks "See Demo" (on landing page)
  ↓
Opens: /demo/padel-course (fully functional)
  ↓
User explores: Course structure, student dashboard
  ↓
User thinks: "I want one like this"
  ↓
Clicks: "Create Your Own Course" button
  ↓
Redirects to: Project generation flow
  ↓
Pre-selects: "Course" project type
```

---

## SUCCESS CRITERIA

Landing page complete when:

- ✅ https://one.ie landing page live
- ✅ 5 demo projects fully functional
- ✅ "Start a Project" button works (auth gate)
- ✅ AI landing page generation working (end-to-end)
- ✅ Agent-clone extracts voice (URL, social, chat)
- ✅ Generated landing pages feel authentic
- ✅ First 20 creators use AI generation
- ✅ Mobile responsive (<2s load)
- ✅ 100+ views first week
- ✅ 20%+ click-through (landing page → start project)
- ✅ Positive sentiment ("This is amazing!")
- ✅ Zero errors in generation (monitored)

---

## DATA FLOW

```
Landing Page (https://one.ie)
    ↓
User clicks "Start a Project"
    ↓
Auth gate: Logged in + onboarded?
    ↓ (Yes)
Project generation flow
    ↓
Choose type + method
    ↓
If URL: Extract identity via agent-clone
If social: Extract identity via social APIs
If chat: Converse with agent-clone
    ↓
Claude generates landing page
    ↓
User reviews + publishes
    ↓
Project created in Convex
    ↓
Landing page published at: one.ie/projects/[slug]
    ↓
Creator dashboard shows: Project + analytics
    ↓
Creator can now: Add products, invite team, start earning
```

---

**Status:** Wave 0 - ENTRY POINT (before Wave 1)
**Timeline:** Can start immediately (low dependency on other todos)
**Priority:** CRITICAL (first impression for all creators)
**Revenue Impact:** MEDIUM (reduces signup friction, higher creator conversion)
