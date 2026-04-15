# Deployment Optimization Summary

## Current Status

**Worker Bundle:** 14MB (was 17MB) - Still too large for Cloudflare Free (needs <3MB)
**Build Status:** ✅ Successful
**Deployment Status:** ❌ Cannot deploy to Cloudflare Free tier

---

## What Was Done

### ✅ Completed Optimizations

1. **Disabled Shiki Syntax Highlighting** (astro.config.mjs)
   - Markdown: `syntaxHighlight: false`
   - MDX: `syntaxHighlight: false`
   - Impact: Saved ~2-3MB in worker, but Shiki languages still in client bundle

2. **Enhanced Code Splitting** (astro.config.mjs)
   - Split into separate chunks:
     - `vendor-diagrams` (mermaid)
     - `vendor-graph` (cytoscape)
     - `vendor-video` (VideoPlayer)
     - `vendor-charts` (recharts)
     - `vendor-ai` (PromptInput)
     - `vendor-markdown`
     - `vendor-icons` (lucide)
     - `vendor-react`

3. **Lazy Loading Optimization**
   - Homepage PerformanceChart: `client:only` → `client:visible`
   - VideoPlayer pages: Already using `client:visible`

4. **Static Prerendering**
   - Added `prerender=true` to 100+ pages
   - Reduced SSR pages to minimum (APIs, payments, auth)

---

## Current Bundle Breakdown

### Worker Bundle (14MB total)

| Component | Size | Status |
|-----------|------|--------|
| **Content Collections** | 3.3MB | ⚠️ CRITICAL - Largest component |
| vendor-video | 2.0MB | ⚠️ Large |
| vendor-react | 995KB | ✅ Acceptable |
| vendor-charts | 919KB | ⚠️ Can optimize |
| Effect.ts | 857KB | ✅ Necessary |
| proxy | 351KB | ✅ Acceptable |
| stripe.esm | 287KB | ✅ Necessary |
| Other chunks | ~5.4MB | Mixed |

### Client Bundle (Public-facing)

| Component | Size | Gzipped | Impact |
|-----------|------|---------|--------|
| vendor-diagrams (mermaid) | 1.5MB | 423KB | High |
| VideoPlayer | 1.0MB | 295KB | Medium |
| emacs-lisp (Shiki) | 762KB | - | ❌ Should be removed |
| conversation | 717KB | 166KB | Medium |
| cpp (Shiki) | 611KB | - | ❌ Should be removed |
| wasm (Shiki) | 608KB | - | ❌ Should be removed |
| vendor-graph | 630KB | 196KB | Medium |
| vendor-charts | 401KB | 109KB | Medium |

---

## Critical Issues

### 1. Content Collections Still Bundled (3.3MB!)

**Problem:** Even though pages have `prerender=true`, content is still bundled into worker.

**Root Cause:** Some pages are still SSR:
- `/docs/index.astro` - Uses URL params for filtering (prerender=false)
- `/plans/index.astro` - Might be SSR
- `/projects/index.astro` - Might be SSR
- Payment/auth pages (necessary)

**Solutions:**

**Option A: Move filtering to client-side**
```astro
---
export const prerender = true; // Force static
const allDocs = await getCollection('docs');
---

<!-- Client-side filtering -->
<DocSearch client:load initialDocs={allDocs} />
```

**Option B: Generate static pages for each filter**
```astro
export async function getStaticPaths() {
  return [
    { params: { view: 'list' } },
    { params: { view: 'grid' } },
    // etc.
  ];
}
```

**Option C: Remove content collections from SSR pages**
Don't use `getCollection()` in any SSR page - fetch from API instead.

### 2. Shiki Languages Still in Client Bundle

**Problem:** Despite disabling Shiki, language files still bundled (emacs-lisp 762KB, cpp 611KB, wasm 608KB).

**Cause:** Some component or page is importing Shiki directly.

**Solution:**
```bash
# Find what's importing Shiki
grep -r "from.*shiki\|import.*shiki" src/
```

Then either remove or lazy-load that component.

---

## Immediate Action Plan

### Phase 1: Fix Content Bundling (Target: <3MB worker)

**Step 1:** Identify remaining SSR pages
```bash
grep -r "prerender.*false" src/pages --include="*.astro" | grep -v api
```

**Step 2:** Convert docs/plans/projects to static
- Move filtering logic to client-side
- Use `client:load` for interactive filters
- Pass all data as props

**Step 3:** Rebuild and verify
```bash
rm -rf dist && bun run build
du -sh dist/_worker.js
```

**Expected Result:** Worker bundle ~2-3MB

### Phase 2: Remove Shiki Remnants (Target: <2MB worker)

**Step 1:** Find Shiki imports
```bash
grep -r "shiki" src/ --include="*.ts" --include="*.tsx" --include="*.astro"
```

**Step 2:** Remove or externalize

**Expected Result:** Worker bundle ~1-2MB

### Phase 3: Optimize Heavy Client Bundles (Optional)

**For vendor-diagrams (1.5MB):**
```html
<!-- Load mermaid from CDN when needed -->
<script type="module">
  if (document.querySelector('.language-mermaid')) {
    import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs')
      .then(m => m.default.initialize({ startOnLoad: true }));
  }
</script>
```

**For VideoPlayer (1MB):**
- Already lazy-loaded with `client:visible` ✅
- Consider using native `<video>` for simple cases

---

## Quick Wins Available Now

### 1. Force docs/plans/projects to Static

```bash
# Add prerender=true and remove URL param logic
for file in src/pages/{docs,plans,projects}/index.astro; do
  # Move filtering to client-side or generate static paths
done
```

**Impact:** Reduces worker by 3.3MB → **~11MB**

### 2. Remove Shiki Language Files

```bash
# Find and remove Shiki imports
grep -r "from 'shiki" src/ -l | xargs sed -i '' '/shiki/d'
```

**Impact:** Reduces client bundle by ~2MB

---

## Deployment Options

### Option 1: Cloudflare Pages Pro ($20/month)
- **Worker limit:** 10MB per module
- **Total limit:** 100MB
- **Status:** ✅ Current 14MB would work
- **Recommendation:** If you need Cloudflare features

### Option 2: Vercel Free Tier
- **Lambda limit:** 50MB
- **No per-module limit**
- **Status:** ✅ Would work immediately
- **Recommendation:** Easiest path forward

### Option 3: Continue Optimization (Free Cloudflare)
- **Target:** <3MB worker bundle
- **Effort:** High (need to fix content bundling)
- **Timeline:** 2-4 hours
- **Recommendation:** If staying on free tier is critical

---

## Files Modified

1. `astro.config.mjs`
   - Disabled Shiki syntax highlighting
   - Enhanced manualChunks configuration

2. `src/pages/index.astro`
   - Changed PerformanceChart to `client:visible`

3. Multiple page files
   - Added `prerender=true` to 100+ pages

---

## Next Steps

**Immediate (if targeting Cloudflare Free):**
1. Fix `/docs/index.astro` - move filtering to client
2. Fix `/plans/index.astro` - move filtering to client
3. Fix `/projects/index.astro` - move filtering to client
4. Find and remove Shiki imports
5. Rebuild and verify worker <3MB

**Alternative (faster deployment):**
1. Deploy to Vercel Free (works now)
2. OR upgrade to Cloudflare Pro (works now)
3. Optimize later if needed

---

## Verification Commands

```bash
# Check worker size
du -sh dist/_worker.js

# Find largest worker chunks
ls -lh dist/_worker.js/chunks/*.mjs | sort -k5 -h | tail -20

# Find remaining SSR pages
grep -r "prerender.*false" src/pages --include="*.astro" | grep -v api

# Find Shiki usage
grep -r "shiki" src/ --include="*.ts" --include="*.tsx"

# Check if content is bundled
ls -lh dist/_worker.js/chunks/*content*.mjs
```

---

## Summary

**Current State:**
- ✅ Build succeeds
- ✅ Code splitting improved
- ✅ Lazy loading optimized
- ❌ Worker still 14MB (target: <3MB)

**Blocker:**
Content collections (3.3MB) bundled due to SSR pages using `getCollection()`

**Fix:**
Make docs/plans/projects pages fully static OR deploy to platform with higher limits

**Recommendation:**
Deploy to Vercel Free tier now (works immediately), optimize bundle later if needed.
