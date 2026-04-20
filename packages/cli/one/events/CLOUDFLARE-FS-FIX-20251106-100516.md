# Cloudflare Pages File System Fix

## Problem
The `/free-license` and `/license` pages were returning 404 errors on Cloudflare Pages because they were using Node.js `fs.readFileSync()` which is not available in the edge runtime.

## Root Cause
```javascript
// ❌ Doesn't work on Cloudflare Pages edge runtime
import { readFileSync } from 'fs';
const licenseContent = readFileSync(resolve('..', 'LICENSE.md'), 'utf-8');
```

Cloudflare Workers/Pages use V8 isolates and don't have access to Node.js file system APIs.

## Solution
Use Vite's `?raw` import to load the file at build time:

```javascript
// ✅ Works on Cloudflare Pages
const licenseModule = await import('../../LICENSE.md?raw');
const licenseMarkdown = licenseModule.default;
const licenseContent = await marked.parse(licenseMarkdown);
```

## Files Fixed
1. `/web/src/pages/free-license.astro`
2. `/web/src/pages/license.astro`

## How It Works
- Vite's `?raw` suffix imports the file content as a string at build time
- The content is bundled into the JavaScript output
- No runtime file system access needed
- Works perfectly on Cloudflare Pages edge runtime

## Testing
```bash
cd web
bun run build
bun run preview
# Visit http://localhost:4321/free-license
# Visit http://localhost:4321/license
```

Both pages should now work correctly.

## Alternative Solutions Considered

### 1. Static HTML Files
Could create `public/free-license.html` but loses:
- Layout consistency
- Dark mode support
- Navigation integration

### 2. Markdown in Component
Could embed LICENSE.md content directly in component but:
- Duplicates content
- Hard to maintain
- Loses single source of truth

### 3. API Endpoint
Could create Cloudflare Function to serve content but:
- Unnecessary complexity
- Extra network request
- Slower performance

## Best Practice
For Cloudflare Pages deployments:
- ✅ Use Vite imports (`?raw`, `?url`) for static assets
- ✅ Pre-render content at build time
- ❌ Avoid Node.js `fs`, `path`, or other Node APIs
- ❌ Don't use runtime file system access

## Related Documentation
- https://vitejs.dev/guide/assets.html#importing-asset-as-string
- https://developers.cloudflare.com/pages/functions/
