# Recharts Integration Guide

## Current Status

**CSS Charts**: ✅ Working (currently active)
**Recharts**: 🔧 Ready to test (fixes implemented)

---

## The Problem

Recharts was failing with:
```
Error: React is running in production mode, but dead code elimination has not been applied
Cannot read properties of null (reading 'useContext')
```

**Root cause**: Multiple React instances + production mode in dev + SSR hydration issues

---

## The Solution (3-Part Fix)

### 1. **Vite Configuration** (astro.config.mjs)

```javascript
vite: {
  define: {
    // Force React into development mode during dev
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'recharts'],  // Prevent multiple React instances
  },
  optimizeDeps: {
    include: ['recharts'],  // Pre-bundle Recharts
  },
}
```

### 2. **React Integration** (astro.config.mjs)

```javascript
react({
  include: ['**/react/*', '**/recharts/*'],  // Include Recharts in React processing
  experimentalReactChildren: true,           // Enable better React children handling
})
```

### 3. **Client-Only Rendering** (DynamicChartRecharts.tsx)

```typescript
// Lazy load Recharts (no SSR)
const LineChart = lazy(() => import('recharts').then(mod => ({ default: mod.LineChart })));

// Only render on client
const [isMounted, setIsMounted] = useState(false);
useEffect(() => setIsMounted(true), []);

if (!isMounted) return <LoadingPlaceholder />;

return <Suspense fallback={<Loading />}>
  <ResponsiveContainer>
    <LineChart>...</LineChart>
  </ResponsiveContainer>
</Suspense>;
```

---

## Testing Recharts

### Option 1: Test Page (Recommended)

Visit the test page to see if Recharts works:

```bash
# Visit in browser:
http://localhost:4322/chat/premium-demo

# Look for the "Recharts Line Chart" badge
# If you see the interactive chart with tooltips → SUCCESS!
```

### Option 2: Swap Components

Replace the CSS chart with Recharts:

```bash
# 1. Backup current (CSS) version
cp src/components/generative-ui/DynamicChart.tsx src/components/generative-ui/DynamicChart.backup.tsx

# 2. Use Recharts version
cp src/components/generative-ui/DynamicChartRecharts.tsx src/components/generative-ui/DynamicChart.tsx

# 3. Test in chat
# Visit http://localhost:4322/chat/premium
# Click "📊 Generate a sales chart (demo)"

# 4. If it works → Keep it!
# If it fails → Restore backup:
cp src/components/generative-ui/DynamicChart.backup.tsx src/components/generative-ui/DynamicChart.tsx
```

---

## What to Look For

### ✅ Success Indicators:
- Chart renders smoothly
- Tooltips appear on hover
- Legend is interactive (click to hide/show lines)
- Animations are smooth
- No console errors
- "Recharts" badge shows in card header

### ❌ Failure Indicators:
- Console errors about `useContext` or `useRef`
- "React is running in production mode" error
- Chart doesn't render (stuck on loading)
- Page crashes or freezes

---

## If It Still Doesn't Work

### Additional Fixes to Try:

#### 1. Force React Development Build

```bash
# Install React dev versions explicitly
bun add react@npm:@preact/compat@latest react-dom@npm:@preact/compat@latest

# Or ensure using React 19 dev mode
bun add react@19.0.0 react-dom@19.0.0
```

#### 2. Separate Recharts Island

Create a completely isolated component:

```astro
<!-- src/components/generative-ui/RechartsIsland.astro -->
---
const { data } = Astro.props;
---

<div id="chart-container"></div>

<script is:inline define:vars={{ data }}>
  // Load Recharts in a separate script context
  import('recharts').then(recharts => {
    // Render chart here
  });
</script>

<RechartsIsland client:only="react" />
```

#### 3. Use Chart.js Instead

If Recharts continues to fail, use Chart.js (lighter alternative):

```bash
bun add chart.js react-chartjs-2
```

---

## Why CSS Charts Are Better for Chat

**Pros of CSS Charts** (current solution):
- ✅ Zero JavaScript loading
- ✅ No React context issues
- ✅ Instant rendering
- ✅ Perfect for demos
- ✅ Always works
- ✅ Smaller bundle size
- ✅ Simpler debugging

**Pros of Recharts**:
- ✅ Interactive tooltips
- ✅ Zoom/pan capabilities
- ✅ More chart types
- ✅ Animations
- ✅ Click events
- ✅ Professional look

**Recommendation**:
- Keep CSS charts for demos (current use case)
- Add Recharts for dashboards/analytics pages
- Use both: CSS for chat messages, Recharts for full-page analytics

---

## Files Reference

**Current (CSS):**
- `src/components/generative-ui/DynamicChart.tsx` - Simple CSS-based charts

**Recharts (Ready to test):**
- `src/components/generative-ui/DynamicChartRecharts.tsx` - Full Recharts implementation
- `src/components/generative-ui/RechartsWrapper.tsx` - Alternative wrapper approach

**Config:**
- `astro.config.mjs` - Vite + React integration with Recharts fixes

**Test:**
- `src/pages/chat/premium-demo.astro` - Demo page showing both versions

---

## UltraThinking: Why Recharts Failed

### The Deep Issue

1. **Astro's Island Architecture**
   - Each component with `client:load` creates separate React root
   - Recharts expects single React context tree
   - Multiple roots = context is null

2. **Production Mode in Dev**
   - Vite optimizes dependencies in production mode
   - React's production build removes helpful error messages
   - Recharts fails silently with cryptic errors

3. **SSR + Client Hydration**
   - Recharts tries to measure DOM on server (fails)
   - ResponsiveContainer needs window.innerWidth (undefined on server)
   - Hydration mismatch causes context loss

### The Complete Fix

```
1. Force dev mode → Better errors + dev tools
2. Dedupe React → Single instance across all islands
3. Lazy load → Skip SSR entirely
4. Client-only guard → Don't render until window exists
5. Suspense → Graceful loading state
6. ResponsiveContainer → Provides chart context
```

### Why It Should Work Now

The fixes address all failure points:
- ✅ React runs in dev mode (helpful errors)
- ✅ Single React instance (dedupe)
- ✅ No SSR (lazy + client guard)
- ✅ Proper context (ResponsiveContainer)
- ✅ Graceful loading (Suspense)

---

## Next Steps

1. **Restart dev server** (already done)
2. **Test at** http://localhost:4322/chat/premium-demo
3. **Check console** for any remaining errors
4. **If working**: Swap DynamicChart to use Recharts
5. **If failing**: Keep CSS charts, use Recharts only on dedicated analytics pages

---

Built with ♥️ and deep debugging
