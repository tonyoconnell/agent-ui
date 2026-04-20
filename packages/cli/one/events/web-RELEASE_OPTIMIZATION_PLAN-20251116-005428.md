# ONE Platform - Release Optimization Plan

## Vision: Enable Kids, Store Owners, Enterprises to Build

Your homepage shows ONE enables:
- **Kids** to build apps
- **Ecommerce store owners** to grow sales
- **Enterprises** to scale solutions
- **AI-native development** for everyone

---

## Current Bundle Analysis (14MB Worker)

### 🔴 Critical Issues (Must Fix)

| Component | Size | Impact | Fix Priority |
|-----------|------|--------|--------------|
| **Content Collections** | 3.3MB | 24% of bundle | ⚠️ CRITICAL |
| **VideoPlayer** | 2.0MB | 14% of bundle | 🔴 HIGH |
| **vendor-charts (recharts)** | 919KB | 7% of bundle | 🟡 MEDIUM |
| **Effect.ts** | 857KB | 6% of bundle | ✅ KEEP (needed) |
| **vendor-react** | 995KB | 7% of bundle | ✅ KEEP (core) |

### 🟡 Client-Side Issues (Slows First Load)

| Component | Size | User Impact | Fix Priority |
|-----------|------|-------------|--------------|
| **vendor-diagrams (mermaid)** | 1.5MB | Docs/technical pages | 🟡 MEDIUM |
| **Shiki languages** | ~2MB total | Code examples | 🔴 HIGH |
| **vendor-graph (cytoscape)** | 630KB | Visualization pages | 🟡 MEDIUM |
| **conversation** | 717KB | Chat features | ✅ KEEP |

---

## Optimization Strategy for Each User Type

### For Kids (Simplicity First)

**What They Need:**
- Fast homepage load
- Simple UI
- Quick app creation
- Fun, engaging experience

**Optimizations:**
1. ✅ Homepage already optimized (native video, no heavy deps)
2. ✅ Simple navigation
3. 🔴 Remove technical jargon pages from main bundle
4. 🔴 Lazy-load advanced features

**Action:**
```astro
<!-- Homepage - Keep Simple -->
- Native <video> ✅ Done
- Simple CTAs ✅ Done
- GitSection client:idle ✅ Done
- NO charts, NO diagrams, NO technical stuff ✅ Done
```

### For Ecommerce Store Owners (Speed First)

**What They Need:**
- Fast product pages
- Quick checkout
- Analytics (can be slower)
- SEO performance

**Optimizations:**
1. 🔴 Product pages must be static (no SSR)
2. 🔴 Remove recharts from main bundle (lazy-load analytics)
3. ✅ Stripe already code-split
4. 🟡 Optimize images (use Cloudflare Images)

**Action:**
```astro
<!-- Product pages - Already static ✅ -->
export const prerender = true;

<!-- Analytics - Lazy load -->
<AnalyticsChart client:visible /> <!-- Load on scroll -->

<!-- Checkout - Keep fast -->
<StripeCheckout /> <!-- Already optimized ✅ -->
```

### For Enterprises (Features + Performance)

**What They Need:**
- All features available
- Professional appearance
- Real-time data
- Advanced visualizations

**Optimizations:**
1. ✅ Code splitting already done
2. 🔴 Load advanced features on-demand
3. 🟡 Diagrams/charts via CDN
4. ✅ Effect.ts (business logic) stays

**Action:**
```astro
<!-- Enterprise Dashboard -->
<AdvancedAnalytics client:visible />
<DataVisualization client:idle />
<RealtimeFeeds /> <!-- Load immediately -->
```

---

## Optimization Plan (Ranked by Impact)

### Phase 1: Fix Content Bundling (Saves 3.3MB - 24%)

**Problem:** Homepage and other pages use `getCollection()` without `prerender=true`

**Solution:**

**Homepage Fix:**
```astro
---
// BEFORE
const podcasts = await getCollection('podcasts');
const featuredPodcast = podcasts.find(p => p.slug === 'one-ontology');

// AFTER (Option 1: Remove if not critical)
// Just remove the featured podcast if not visible above fold

// AFTER (Option 2: Hardcode if needed)
const featuredPodcast = {
  slug: 'one-ontology',
  data: {
    title: 'ONE Ontology',
    // ... hardcode data
  }
};

// AFTER (Option 3: Add prerender)
export const prerender = true; // Force static
const podcasts = await getCollection('podcasts');
---
```

**Impact:** Worker drops from 14MB → **10.7MB** (23% reduction)

### Phase 2: Remove Shiki Language Files (Saves ~2MB client)

**Problem:** 10+ language syntax files bundled (emacs-lisp, cpp, wasm, etc.)

**These languages are for DEVELOPERS, not your target users (kids, store owners)!**

**Solution:**

```bash
# Find what's importing Shiki languages
grep -r "shiki" src/components src/pages --include="*.tsx" --include="*.ts"

# Option 1: Remove syntax highlighting from code examples
# Use plain <pre><code> blocks

# Option 2: Use simple client-side highlighter
# Prism.js from CDN (10KB vs 2MB)
```

**Impact:** Client bundle reduces by ~2MB, faster first load

### Phase 3: Lazy-Load VideoPlayer (Saves 2MB worker)

**Problem:** VideoPlayer bundled in worker even though homepage uses native `<video>`

**Solution:**

**Check which pages use VideoPlayer:**
```bash
grep -r "VideoPlayer" src/pages --include="*.astro"
```

**Ensure all use `client:visible`:**
```astro
<!-- Video pages - Lazy load -->
<VideoPlayer client:visible /> <!-- ✅ Already done -->

<!-- Homepage - Use native -->
<video controls> <!-- ✅ Already done -->
```

**Also check:** VideoPlayer might be imported somewhere without being used

**Impact:** Worker drops by 2MB → **8.7MB**

### Phase 4: Externalize Mermaid Diagrams (Saves 1.5MB client)

**Problem:** Mermaid bundled but only used in technical docs

**Your target users (kids, store owners) don't need architecture diagrams!**

**Solution:**

```astro
---
// Only load mermaid on docs pages
const hasDiagrams = content.body?.includes('```mermaid');
---

{hasDiagrams && (
  <script type="module">
    // Load from CDN only when needed
    import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs')
      .then(m => m.default.initialize({ startOnLoad: true }));
  </script>
)}
```

**Impact:** Client bundle reduces by 1.5MB

### Phase 5: Optimize Recharts (Saves 919KB worker)

**Problem:** Recharts bundled for analytics that most users won't see

**Solution:**

**Move analytics to separate route:**
```astro
<!-- Dashboard analytics -->
<Link href="/analytics">View Analytics</Link>

<!-- /analytics page loads charts -->
<RechartsComponent client:load />
```

**Or use lightweight alternative:**
```typescript
// Replace recharts with Chart.js or uPlot (10x smaller)
// OR use static chart images for simple visualizations
```

**Impact:** Worker drops by 919KB → **7.8MB**

---

## Target Bundle Sizes (After All Phases)

| Metric | Current | Target | Savings |
|--------|---------|--------|---------|
| **Worker Bundle** | 14MB | **2-3MB** | 79-85% |
| **Client (First Load)** | ~4MB | **1-1.5MB** | 62-75% |
| **Homepage FCP** | ~2s | **<1s** | 50%+ |
| **Product Pages** | Fast | **Blazing** | Static |

---

## User-Focused Optimization Matrix

### Kids Path (Simple & Fast)
```
Homepage (static) → App Builder (simple UI) → Deploy (1-click)
Bundle: 500KB client + minimal worker
```

**Remove:**
- ❌ Technical docs from main bundle
- ❌ Architecture diagrams
- ❌ Code syntax highlighting
- ❌ Advanced analytics

**Keep:**
- ✅ Simple video demo
- ✅ Fun UI components
- ✅ One-click deploy
- ✅ Templates

### Store Owners Path (Commerce Focus)
```
Homepage → Products → Checkout → Analytics (optional)
Bundle: 800KB client + 2MB worker (Stripe)
```

**Optimize:**
- ✅ Product pages (static)
- ✅ Fast checkout (Stripe)
- 🔴 Analytics (lazy-load)
- ✅ SEO optimized

### Enterprise Path (Full Features)
```
Homepage → Platform Tour → Dashboard → Advanced Features
Bundle: 1.5MB client + 3MB worker (all features)
```

**Load on-demand:**
- Diagrams (when viewing docs)
- Charts (when viewing analytics)
- Advanced visualizations (when needed)

---

## Implementation Checklist

### Immediate (30 min)

- [ ] **Fix Homepage Content**
  ```astro
  // Remove or hardcode podcast data
  // Add: export const prerender = true
  ```

- [ ] **Find Shiki Imports**
  ```bash
  grep -r "from.*shiki\|import.*shiki" src/
  # Remove or replace with simple highlighter
  ```

- [ ] **Verify VideoPlayer Usage**
  ```bash
  grep -r "VideoPlayer" src/pages
  # Ensure all use client:visible
  ```

**Expected:** Worker drops to ~10MB

### Short-term (2 hours)

- [ ] **Remove Unused Shiki Languages**
  - Keep only: js, ts, jsx, tsx (for developers who need it)
  - Remove: emacs-lisp, cpp, wasm, wolfram, etc.

- [ ] **Externalize Mermaid**
  - Load from CDN only on docs pages
  - Not needed for kids/store owners

- [ ] **Move Analytics to Separate Page**
  - `/dashboard` → simple overview
  - `/analytics` → full charts (lazy-loaded)

**Expected:** Worker drops to ~3MB, client to ~1.5MB

### Medium-term (1 day)

- [ ] **Optimize Content Collections**
  - Static generation for all content pages
  - Client-side filtering where needed

- [ ] **Image Optimization**
  - Use Cloudflare Images API
  - Lazy-load all images

- [ ] **Code Splitting Audit**
  - Ensure each user path loads only what it needs

**Expected:** Worker <3MB, ready for Cloudflare Free

---

## Success Metrics

### Performance
- [ ] Worker bundle <3MB (Cloudflare Free compatible)
- [ ] Homepage FCP <1s
- [ ] Lighthouse score >95

### User Experience
- [ ] Kids can build app in <5 min
- [ ] Store owners see fast product pages
- [ ] Enterprises get all features (lazy-loaded)

### Business
- [ ] Deploy to Cloudflare Free ✅
- [ ] Zero infrastructure cost for launch
- [ ] Scale to Pro when revenue justifies

---

## Quick Wins (Do First)

### 1. Homepage Content Fix (5 min)
```astro
<!-- Remove getCollection from homepage -->
export const prerender = true;
// Hardcode or remove featured podcast
```
**Impact:** -3.3MB worker

### 2. Remove Obscure Shiki Languages (10 min)
```bash
# Your users don't need emacs-lisp syntax highlighting!
# Find and remove: emacs-lisp, cpp, wasm, wolfram, etc.
```
**Impact:** -2MB client

### 3. Verify VideoPlayer (5 min)
```bash
# Make sure VideoPlayer only loads when needed
# Homepage already uses native <video> ✅
```
**Impact:** -2MB worker

**Total Quick Wins:** Worker 14MB → 8.7MB (38% reduction in 20 minutes!)

---

## Recommendation: Phased Release

### v1.0 - "Kids Launch" (This Week)
**Target:** Kids building simple apps
**Bundle:** <5MB worker, <1MB client
**Features:** Core builder, simple templates
**Optimizations:** Phases 1-2 (remove content bundling, clean Shiki)

### v1.1 - "Commerce Launch" (Next Week)
**Target:** Store owners
**Bundle:** <4MB worker, <1.5MB client
**Features:** + Product pages, Stripe checkout
**Optimizations:** + Phase 3 (optimize VideoPlayer)

### v1.2 - "Enterprise Launch" (2 Weeks)
**Target:** Enterprises
**Bundle:** <3MB worker, <2MB client
**Features:** + Full analytics, diagrams, advanced features (lazy-loaded)
**Optimizations:** + Phases 4-5 (externalize heavy libs)

---

## Next Command to Run

```bash
# Fix the homepage first (biggest impact)
# Option 1: Remove featured podcast
# Option 2: Hardcode podcast data
# Option 3: Make it fully static with prerender

# Then rebuild
rm -rf dist && bun run build && du -sh dist/_worker.js
```

**Expected:** Should see ~10MB worker (3.3MB saved)

---

## Files to Edit (Priority Order)

1. `src/pages/index.astro` - Remove `getCollection()`, add `prerender=true`
2. Find Shiki imports - Remove unused language files
3. `src/pages/docs/index.astro` - Make static or client-side filter
4. `src/pages/plans/index.astro` - Make static
5. `src/pages/projects/index.astro` - Make static

**Do these 5 fixes → Worker drops to 3-4MB → Deploy on Cloudflare Free! 🚀**
