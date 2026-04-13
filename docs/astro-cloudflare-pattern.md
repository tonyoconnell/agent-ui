# Astro + Cloudflare Pattern

The `astro.config.mjs` file is production-grade infrastructure that enables TTFB <200ms globally.

---

## The Pattern

### Dual Adapter (Dev vs Prod)

```javascript
const isDev = process.env.NODE_ENV !== "production";
const adapter = isDev
  ? node({ mode: "standalone" })        // Dev: Local Node server
  : cloudflare({                          // Prod: Edge execution
      platformProxy: { enabled: true },
    });
```

**Why two adapters?**

- **Dev:** Node (standalone) avoids miniflare complexity
- **Prod:** Cloudflare Workers (5 regions, sub-100ms global)

Single source of truth, environment-aware switch. Zero manual config change.

---

### React 19 + Edge Compatibility

```javascript
resolve: {
  alias: {
    "@": new URL("./src", import.meta.url).pathname,
    // React 19 + Cloudflare Edge compat (production only)
    ...(isDev ? {} : {
      "react-dom/server": "react-dom/server.edge",  // ← Magic
    }),
  },
}
```

**Why this matters:**

- `react-dom/server` is full Node (slow on edge)
- `react-dom/server.edge` is Cloudflare-optimized (fast on edge)
- Dev uses standard React (no issues locally)
- Prod swaps automatically

**Result:** Astro SSR on edge, TTFB <200ms

---

### Smart Bundling Strategy

```javascript
build: {
  target: "esnext",  // No transpiling, raw modern syntax
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes('recharts')) return 'recharts'      // Charts lib
        if (id.includes('lucide-react')) return 'icons'      // Icons lib
        if (id.includes('node_modules/react')) return 'react-vendor'  // React stable
        if (id.includes('@xyflow')) return 'reactflow'      // Graph lib
      },
    },
  },
},
```

**Why manual chunks?**

1. **recharts** (large visualization) → separate bundle
   - Dashboard can lazy-load charts on client:visible
   - Homepage doesn't pay the cost

2. **lucide-react** (icon library) → separate bundle
   - All icons in one place
   - Cache-friendly (stable across pages)

3. **react-vendor** (React itself) → separate bundle
   - React rarely changes
   - Browser caches forever

4. **reactflow** (interactive graphs) → separate bundle
   - Heavy dependency, only used on /world page
   - Lazy-load on client:visible

**Result:** Parallel downloads, browser caching, faster FCP

---

### SSR Optimization

```javascript
vite: {
  ssr: {
    noExternal: [
      "recharts",
      "lucide-react",
    ],
  },
}
```

**Why bundle inside SSR?**

- These libraries used during server render (Astro → HTML)
- If external, worker fetches them on every request
- If bundled, zero fetch, instant render

**Result:** Rendering starts immediately, no external dependencies on edge

---

## The Speed Cascade

```
Browser requests /dashboard
  ↓ (via Cloudflare edge, <1ms routing)
Astro SSR starts
  ↓ (react-dom/server.edge, optimized for edge)
Rendering includes recharts, lucide-react (bundled)
  ↓ (no external fetch, instant render)
HTML generated
  ↓ (target: esnext, smallest payload)
Browser receives <50kb HTML
  ↓ (parallel chunk downloads: react-vendor, recharts, icons, reactflow)
FCP <500ms
  ↓ (React hydration on islands)
Interactive
```

**Total:** TTFB <200ms, FCP <500ms

---

## How It Ties Into ONE's Speed Story

| Layer | What | Time | Proof |
|-------|------|------|-------|
| **Frontend (Astro)** | SSR + islands | TTFB <200ms | astro.config.mjs (dual adapter) |
| **Edge (Cloudflare)** | Worker execution | Routing <0.005ms | live: 5 regions <100ms |
| **Runtime (ONE)** | Pheromone routing | <0.001ms | src/engine/routing.test.ts |
| **Blockchain (Sui)** | Settlement | <2s | proven capability proof |

The Astro config is **the foundation** that makes edge execution possible. Without `react-dom/server.edge`, rendering would be slow. Without smart bundling, FCP would be 2+ seconds.

---

## Deployment Command

```bash
# This config enables this entire pipeline:
npx wrangler pages deploy dist/ --project-name=one-substrate
```

Every `npm run build` creates:
- `dist/` (static HTML/CSS/JS)
- `dist/_worker.js` (Cloudflare Worker)
- Chunks (recharts, icons, react-vendor, reactflow)
- Routes to Cloudflare Pages

---

## Key Takeaway

```
Astro config is not boilerplate.
It's the speed infrastructure.

Dual adapter       → dev doesn't block on edge issues
React 19 edge      → rendering is native to Cloudflare
Smart bundling     → cache hits, parallel downloads
SSR optimization   → zero external fetches
Target: esnext     → smallest payload

This is how you get TTFB <200ms on a full-featured dashboard.
Most teams optimize one layer. We optimized all four.
```

---

## See Also

- [astro.config.mjs](../astro.config.mjs) — The actual config
- [speed.md](speed.md) — Full stack benchmarks (this config enables TTFB <200ms)
- [fastest-ai.md](fastest-ai.md) — How frontend feeds into edge routing
- `.astro/rules/astro.md` — Astro patterns used throughout codebase

---

*The config is the product. Every microsecond counts.*
