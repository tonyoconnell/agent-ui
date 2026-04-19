# /fast - Rapid Feature Building & Modification

**Purpose:** Build or modify features at maximum speed through template reuse. Zero ceremony, pure execution.

---

## Core Philosophy

**Fast = Copy, Modify, Ship. Not Build From Scratch.**

The `/fast` command is for when:
- ✅ You know exactly what you want
- ✅ Feature is small/straightforward (< 5 files)
- ✅ Existing templates can be adapted
- ✅ Speed > perfection

**CRITICAL: Always search for existing templates FIRST. Never build from scratch if a template exists.**

**Template Priority:**
1. **Product/Shop Features** → Use `/web/src/pages/shop/product-landing.astro` immediately
2. **Other Features** → Search pages and components for similar patterns
3. **No Template Found** → Build minimal version following existing patterns

**No cycles. No planning. No bureaucracy. Just copy, modify, ship.**

---

## Template-First Workflow (Execute for EVERY /fast request)

### Step 1: Identify Feature Type
```bash
# Product/shop/landing page?
→ Use /web/src/pages/shop/product-landing.astro immediately

# Other feature?
→ Proceed to Step 2
```

### Step 2: Search for Templates
```bash
# Search pages for similar patterns
Glob: /web/src/pages/**/*.astro

# Search components for reusable elements
Glob: /web/src/components/**/*.tsx

# Pick closest match
```

### Step 3: Show Template to User
```bash
# Be transparent about what you're using
"Using [template-path] as base, customizing [specific changes]"
```

### Step 4: Copy, Modify, Ship
```bash
# Copy template
# Modify for specific needs
# Ship immediately
```

### Step 5: Offer Stripe Integration (if relevant)
```bash
# For product/payment features
"Would you like to add Stripe payment integration?"
```

---

## Usage

```bash
/fast [feature-description]

# Examples:
/fast Create product page for AI course → Uses product-landing.astro template
/fast Add dark mode toggle to header → Searches for existing toggle components
/fast Fix broken cart icon on mobile → Direct modification
/fast Create pricing page with 3 tiers → Uses product-landing.astro pricing section
/fast Add email signup form to footer → Searches for existing form components
```

**What happens:**
1. **Search for templates FIRST** (glob pages/components for similar patterns)
2. **Show user the template** you're using and what you're customizing
3. **Copy and modify** template for specific needs
4. Execute immediately (no plan, no approval)
5. **Offer Stripe integration** if feature is product/payment-related
6. Done.

**Time:** 30 seconds to 3 minutes (average: 60 seconds with templates)

---

## When to Use /fast vs /plan

### Use /fast When:
- Small, self-contained changes (< 5 files)
- Clear requirements (no ambiguity)
- Existing patterns to follow
- Quick fixes or tweaks
- Cosmetic changes (colors, text, styling)

### Use /plan When:
- Complex features (> 5 files)
- Backend schema changes
- Multi-step integrations
- Unclear requirements
- Need to coordinate multiple specialists

---

## Fast Execution Modes

### Mode 1: Template-Based Feature Creation (30-90 seconds)

```bash
/fast Create pricing page with 3 tiers
```

**Execution:**
```
→ Search: Glob /web/src/pages/**/*.astro for pricing patterns
→ Found: /web/src/pages/shop/product-landing.astro (has pricing section)
→ Show: "Using product-landing.astro template, customizing for 3-tier pricing"
→ Copy: Template to /web/src/pages/pricing.astro
→ Modify: Update pricing tiers, remove product-specific sections
→ Offer: "Would you like to add Stripe payment integration?"
✅ Done in 90 seconds (vs 3-5 minutes from scratch)
```

### Mode 2: Modify Existing Feature (1-2 minutes)

```bash
/fast Change primary color from purple to blue
```

**Execution:**
```
→ Identify: Update /web/src/styles/global.css
→ Find: --color-primary: 147 51 234 (purple)
→ Replace: --color-primary: 59 130 246 (blue)
→ Verify: Check contrast ratios (WCAG)
✅ Done in 90 seconds
```

### Mode 3: Fix Bug (30 seconds - 2 minutes)

```bash
/fast Fix cart icon alignment on mobile
```

**Execution:**
```
→ Identify: /web/src/components/Header.tsx
→ Find: Cart icon CSS
→ Fix: Add flex items-center
→ Test: Mobile viewport check
✅ Done in 45 seconds
```

### Mode 4: Quick Integration (2-4 minutes)

```bash
/fast Add Google Analytics tracking
```

**Execution:**
```
→ Identify: Layout component
→ Add: Analytics script tag
→ Configure: GA_MEASUREMENT_ID env var
→ Verify: Test in browser console
✅ Done in 2 minutes
```

---

## Fast Build Patterns

### Pattern 1: Single Component

```bash
/fast Create hero section with CTA button
```

**Output:**
```typescript
// /web/src/components/Hero.tsx
export function Hero() {
  return (
    <section className="bg-gradient-to-r from-purple-600 to-blue-600">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-white">Your Headline</h1>
        <p className="text-xl text-white/80 mt-4">Your subheadline</p>
        <button className="mt-8 px-8 py-3 bg-white text-purple-600 rounded-lg">
          Get Started
        </button>
      </div>
    </section>
  );
}
```

**Time:** 60 seconds

### Pattern 2: Single Page

```bash
/fast Create about page with team section
```

**Output:**
```astro
---
// /web/src/pages/about.astro
import Layout from '@/layouts/Layout.astro';
import TeamGrid from '@/components/TeamGrid.tsx';

const team = [
  { name: 'John Doe', role: 'CEO', image: '/team/john.jpg' },
  { name: 'Jane Smith', role: 'CTO', image: '/team/jane.jpg' },
];
---

<Layout title="About Us">
  <section class="container mx-auto px-4 py-20">
    <h1 class="text-4xl font-bold">About Our Company</h1>
    <p class="text-lg mt-4">We're building the future...</p>
    <TeamGrid team={team} client:load />
  </section>
</Layout>
```

**Time:** 2 minutes

### Pattern 3: Style Update

```bash
/fast Update button styles to be more rounded
```

**Execution:**
```css
/* /web/src/styles/global.css */

/* Before: */
.btn {
  @apply px-4 py-2 rounded-md;
}

/* After: */
.btn {
  @apply px-4 py-2 rounded-full;
}
```

**Time:** 30 seconds

### Pattern 4: Config Change

```bash
/fast Add contact@example.com to footer
```

**Execution:**
```astro
// /web/src/components/Footer.astro

// Before:
<footer>
  <p>&copy; 2024 Company</p>
</footer>

// After:
<footer>
  <p>&copy; 2024 Company</p>
  <a href="mailto:contact@example.com">contact@example.com</a>
</footer>
```

**Time:** 45 seconds

---

## Intelligent Feature Detection

The `/fast` command automatically detects:

### Frontend-Only Features
```bash
/fast Add pricing page
→ Creates Astro page + React components
→ No backend needed
→ Time: 3 minutes
```

### Backend Features
```bash
/fast Add user profile page with bio
→ Detects: Need to store user data
→ Creates: Convex mutation + query
→ Creates: Frontend page
→ Time: 5 minutes
```

### Integration Features
```bash
/fast Add Stripe payment button
→ Detects: Third-party integration
→ Installs: @stripe/stripe-js
→ Creates: Payment component
→ Time: 4 minutes
```

---

## Template-First Execution Strategy

### CRITICAL: Template Search Process (Run BEFORE Building)

**For EVERY /fast request, execute this search pattern:**

```bash
# Step 1: Identify feature type
Is this a product/shop feature? → Use /web/src/pages/shop/product-landing.astro

# Step 2: Search for similar pages
Glob search: /web/src/pages/**/*.astro for similar page types

# Step 3: Search for reusable components
Glob search: /web/src/components/**/*.tsx for relevant components

# Step 4: Pick closest match, copy, and modify
```

### Template Priority Map

**Product Pages** → `/web/src/pages/shop/product-landing.astro`
- Product launches, sales pages, landing pages, offers
- Time: 30-60 seconds (just modify content)

**Blog/Content Pages** → Search `/web/src/pages/blog/`
- Articles, posts, case studies, documentation
- Time: 60 seconds (replicate structure)

**Marketing Pages** → Search `/web/src/pages/*.astro`
- About, pricing, features, contact
- Time: 2 minutes (adapt layout)

**Components** → Search `/web/src/components/`
- UI elements, forms, cards, modals
- Time: 30 seconds (import and place)

### Example: Template-Driven Creation

```bash
/fast Create SaaS pricing page

→ Step 1: Search for templates
  Glob: /web/src/pages/**/*pricing*.astro
  Found: /web/src/pages/shop/product-landing.astro (has pricing section)

→ Step 2: Show user what we're using
  "Using product-landing.astro template, customizing for SaaS pricing"

→ Step 3: Copy and modify
  - Keep: Layout, styling, structure
  - Change: Content, pricing tiers, CTAs
  - Remove: Product-specific sections

→ Step 4: Ship
  Created: /web/src/pages/pricing.astro
  Time: 90 seconds

→ Step 5: Offer integration
  "Would you like to add Stripe payment integration?"
```

### Speed Comparison

**With Template:**
- Search: 10 seconds
- Copy: 5 seconds
- Modify: 30 seconds
- Total: **45 seconds**

**From Scratch:**
- Design: 2 minutes
- Build: 3 minutes
- Style: 2 minutes
- Total: **7 minutes**

**Template = 9x faster**

---

## Fast Command Variants

```bash
# Create new
/fast create [feature]
/fast add [feature]
/fast new [feature]

# Modify existing
/fast update [feature]
/fast change [feature]
/fast modify [feature]

# Fix bugs
/fast fix [bug-description]
/fast repair [issue]

# Delete
/fast remove [feature]
/fast delete [feature]
```

---

## Example Scenarios

### Scenario 1: Launch Day Tweaks

```bash
# 5 minutes before launch, need quick changes:

/fast Change hero headline to "Build Faster"
→ 30 seconds

/fast Fix mobile menu not closing
→ 60 seconds

/fast Add live chat widget
→ 2 minutes

/fast Update pricing from $29 to $19
→ 30 seconds

Total: 4 minutes, all changes live
```

### Scenario 2: Client Feedback

```bash
# Client just called with urgent requests:

/fast Add testimonials section to home
→ 3 minutes

/fast Change CTA button color to green
→ 30 seconds

/fast Create case studies page
→ 4 minutes

/fast Fix broken contact form
→ 2 minutes

Total: 9.5 minutes, client happy
```

### Scenario 3: New Feature Request

```bash
# Product team wants quick experiment:

/fast Add email signup popup
→ 3 minutes

/fast Create simple analytics dashboard
→ 5 minutes

/fast Add export to CSV button
→ 2 minutes

Total: 10 minutes, experiment live
```

---

## Guardrails & Safety

Even though `/fast` is rapid, it still:

✅ **Searches templates FIRST** - Never builds from scratch if template exists
✅ **Shows template being used** - Transparency in what's being copied
✅ **Validates against ontology** - Ensures features map to 6 dimensions
✅ **Type checks** - Runs `bunx astro check` before deploy
✅ **Maintains consistency** - Uses existing design tokens and patterns
✅ **Git commits** - Auto-commits with descriptive messages
✅ **Offers integrations** - Suggests Stripe for product/payment features

**What /fast does NOT do:**
❌ Build from scratch when templates exist
❌ Formal testing (unless requested)
❌ Documentation (code is self-documenting)
❌ Design reviews (trust the patterns)
❌ Planning cycles (immediate execution)

---

## Integration with Other Commands

### /fast → /plan
```bash
# Start with fast, scale to plan:
/fast Create simple blog
→ Ships in 3 minutes

# Later, when you need more:
/plan Add comments, tags, search to blog
→ Generates 20-cycle plan for enhancements
```

### /fast + /deploy
```bash
/fast [feature]
→ Builds feature

/deploy
→ Pushes to production immediately
```

### /fast + /push
```bash
/fast [feature]
→ Creates files, makes changes

/push "Quick feature: [description]"
→ Commits and pushes to repo
```

---

## Performance Metrics

**Average execution times:**
- Simple change (color, text): 30-60 seconds
- New component: 1-2 minutes
- New page: 2-4 minutes
- Integration: 3-5 minutes
- Bug fix: 30 seconds - 2 minutes

**Comparison to traditional workflow:**
- `/fast`: 30 seconds - 5 minutes
- Traditional: 30 minutes - 2 hours
- **Speed multiplier: 6-24x faster**

---

## Advanced Usage

### Batch Operations

```bash
/fast Batch: Add dark mode, fix mobile nav, create FAQ page
→ Executes all three in sequence
→ Time: 8 minutes total
```

### Conditional Changes

```bash
/fast If pricing page exists, update prices; else create page
→ Checks for existence
→ Takes appropriate action
```

### Pattern-Based Creation

```bash
/fast Create 5 blog posts using template
→ Replicates pattern 5x
→ Time: 3 minutes (vs 15 minutes manual)
```

---

## When /fast Fails

If feature is too complex for `/fast`, you'll see:

```
⚠️ Feature too complex for /fast mode

This feature requires:
- Backend schema changes (5+ cycles)
- Multiple agent coordination
- Design system updates

Recommendation: Use /plan instead

/plan [your-feature-description]
```

**Complexity triggers:**
- Backend schema changes
- Multi-agent coordination needed
- Requires design system updates
- Ambiguous requirements
- > 10 file changes

---

## State Persistence

Fast executions are logged to:
- `.claude/state/fast-log.json` - Execution history
- Git commits - Auto-committed with timestamps
- No cycle tracking (fast mode bypasses cycles)

---

## Key Principles

1. **Templates FIRST** - Always search before building from scratch
2. **Show your work** - Tell user which template you're using
3. **Copy, modify, ship** - Fastest path is adaptation, not creation
4. **Speed is the priority** - Sacrifice process for velocity
5. **Trust the patterns** - Replicate what works
6. **Offer integrations** - Suggest Stripe for product/payment features
7. **Good enough ships** - Perfection is the enemy of done
8. **Auto-commit everything** - Never lose work
9. **Fail fast** - If complex, escalate to `/plan`

---

## See Also

- `/plan` - For complex features requiring planning
- `/create` - For specialist-based building
- `/deploy` - For immediate production deployment
- `/push` - For git commits and repo sync
