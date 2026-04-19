---
allowed-tools: Bash(*), Read(*), Edit(*)
description: Deploy web to Cloudflare Pages (oneie project)
---

# /deploy - Deploy Web to Cloudflare Pages

**Purpose:** Build and deploy the web application to Cloudflare Pages using wrangler CLI with bundle size optimization.

## One-Command Deployment

```bash
cd /Users/toc/Server/ONE/web && bun run build && wrangler pages deploy dist --project-name=oneie
```

**What happens:**
1. ✅ Build production bundle with Astro + React 19 edge support
2. ✅ Deploy `/web/dist/` to Cloudflare Pages `oneie` project
3. ✅ Automatic global CDN distribution
4. ✅ Live URL generated instantly

## Deployment URL

After deployment completes, the site is live at:
- **Primary:** https://oneie.pages.dev
- **With subdomain:** https://[deployment-hash].oneie.pages.dev

View all deployments:
```bash
wrangler pages deployment list --project-name=oneie
```

---

## CRITICAL: Worker Bundle Size Optimization

**Cloudflare Limits:**
- Free tier: **3 MiB** worker size
- Paid tier: **10 MiB** worker size

With Astro's `output: "server"` mode, ALL pages get bundled into the worker. To stay under limits:

### Three Optimization Rules

#### Rule 1: Static Pages Should Prerender (95% of pages)

Add to all static pages (marketing, docs, blog, etc.):

```astro
---
export const prerender = true;

import Layout from '@/layouts/Layout.astro';
---
<Layout>Content</Layout>
```

**Effect:** Page becomes static HTML (0 KiB in worker bundle)

#### Rule 2: Heavy Components Use `client:only="react"` NOT `client:load`

```astro
---
export const prerender = true;
import { UDashboard } from '@/components/u/UDashboard';
---

<!-- ❌ WRONG: Bundles into worker (378 KiB) -->
<UDashboard client:load />

<!-- ✅ CORRECT: Only ships to browser (0.06 KiB in worker) -->
<UDashboard client:only="react" />
```

**Why:** `client:only="react"` skips SSR bundling - component only loads in browser.

**Use for:** Components with heavy dependencies (crypto/wallet libs, charting, video players, mermaid diagrams)

#### Rule 3: Dynamic Routes Need `prerender = false`

```astro
---
export const prerender = false;
const { id } = Astro.params;
---
```

**Use for:**
- Dynamic routes: `[param].astro`, `[...slug].astro`
- API endpoints: `*.ts` files
- Runtime auth/user data pages

### Automation Script

Apply these rules automatically:

```bash
cd /Users/toc/Server/ONE/web && ./scripts/add-prerender.sh
```

### Real Results

| Component | Before | After | Change |
|-----------|--------|-------|--------|
| `/u/index.astro` | 378 KiB | 0.06 KiB | **-99.98%** |
| `/mail.astro` | 400 KiB | 0.06 KiB | **-99.98%** |
| Total Worker | 15 MiB | 12 MiB | **-20%** |
| Deployment | ❌ Failed | ✅ Success | |

---

## Pre-Deployment Checklist

Before deploying, verify bundle optimization:

```bash
# 1. Ensure heavy pages use client:only
grep -r "client:load" web/src/pages/u/ && echo "WARNING: Found client:load in /u pages!"

# 2. Check prerender exports exist
./scripts/add-prerender.sh

# 3. Build and check worker size
cd web && bun run build
du -sh dist/_worker.js  # Should be < 15MB for paid tier

# 4. Deploy
wrangler pages deploy dist --project-name=oneie
```

---

## Requirements

**Before deploying:**
- ✅ Wrangler CLI installed: `npm install -g wrangler`
- ✅ Cloudflare Global API Key: `$CLOUDFLARE_GLOBAL_API_KEY`
- ✅ Cloudflare Account ID: `$CLOUDFLARE_ACCOUNT_ID`
- ✅ React 19 edge alias configured in `astro.config.mjs`
- ✅ Bundle optimization applied (see rules above)

**Environment Setup:**
```bash
# Root .env must contain:
CLOUDFLARE_GLOBAL_API_KEY=your-api-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_EMAIL=your-email@example.com
```

## How It Works

1. **Build Phase:** `bun run build`
   - Compiles Astro + React 19 to static files + edge functions
   - Prerenders static pages as HTML
   - Bundles only SSR pages into worker
   - Outputs to `/web/dist/`
   - Time: ~60-70 seconds

2. **Deploy Phase:** `wrangler pages deploy dist --project-name=oneie`
   - Uploads 600+ files to Cloudflare Pages
   - Bundles `_worker.js` directory
   - Provisions edge runtime
   - Propagates to 330+ global data centers
   - Time: ~10-15 seconds

3. **Activation Phase:** Auto-live
   - URL immediately accessible
   - Cache warming across regions
   - Real-time analytics enabled

## Configuration

### astro.config.mjs Critical Settings

```javascript
// Output mode - use server with strategic prerendering
output: "server",
adapter: cloudflare({ mode: "directory" }),

// Disable Shiki syntax highlighting (saves 9.4MB)
markdown: {
  syntaxHighlight: false,
},

// React 19 edge compatibility
resolve: {
  alias: {
    'react-dom/server': 'react-dom/server.edge',
  },
},

// Manual chunks for code splitting
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes('mermaid')) return 'vendor-diagrams';
        if (id.includes('cytoscape')) return 'vendor-graph';
        if (id.includes('recharts')) return 'vendor-charts';
        if (id.includes('video-react')) return 'vendor-video';
      }
    }
  }
}
```

---

## Troubleshooting

### Worker Size Exceeded (3MB/10MB limit)

**Error:** `Your Worker exceeded the size limit of 3 MiB`

**Solution:**
1. Run `./scripts/add-prerender.sh` to add prerender exports
2. Check heavy pages use `client:only="react"`:
   ```bash
   grep -r "client:load" web/src/pages/ | grep -v node_modules
   ```
3. Convert any `client:load` to `client:only="react"` for heavy components
4. Rebuild and redeploy

### Which Pages Are Bloating the Bundle?

```bash
# Check largest page bundles:
ls -lS web/dist/_worker.js/pages/*.mjs | head -20
```

If a page is > 50KB, check if it imports heavy dependencies and convert to `client:only`.

### Authentication Failed

```bash
# Verify credentials:
echo $CLOUDFLARE_GLOBAL_API_KEY
echo $CLOUDFLARE_ACCOUNT_ID
echo $CLOUDFLARE_EMAIL

# Re-authenticate:
wrangler auth login
```

### Build Errors

```bash
# Check Astro types:
cd web && bun run check

# View detailed errors:
cd web && bun run build --verbose
```

### MessageChannel is not defined

Missing React 19 edge alias:
```javascript
// astro.config.mjs
resolve: {
  alias: {
    'react-dom/server': 'react-dom/server.edge',
  },
}
```

---

## Rollback

To rollback to a previous deployment:

```bash
# View deployment history
wrangler pages deployment list --project-name=oneie

# Promote previous deployment to production
wrangler pages deployments rollback --project-name=oneie
```

---

## Performance Metrics

**Typical Deployment:**
- Build time: 60-70s (with prerendering)
- Upload time: 10-15s
- Total time: 70-85s
- Files deployed: 600+
- Worker bundle: ~12 MiB (after optimization)
- Global rollout: <2 minutes

**Monitoring:**
- View live logs: `wrangler pages tail --project-name=oneie`
- Check analytics: Cloudflare Dashboard → Pages → oneie
- Status page: https://www.cloudflarestatus.com

---

## Documentation References

- **Full optimization guide:** `/web/BUNDLE_OPTIMIZATION.md`
- **Pages CLAUDE.md:** `/web/src/pages/CLAUDE.md` - Bundle Size section
- **Automation script:** `/web/scripts/add-prerender.sh`
- **Config comments:** `/web/astro.config.mjs`

---

**Ready to deploy!** 🚀
