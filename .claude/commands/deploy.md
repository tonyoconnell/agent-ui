# /deploy

**Skills:** `/cloudflare` (Workers + Pages auth) · `/signal` (deploy:success / deploy:degraded)

Ship all four services to Cloudflare. Deterministic sandwich — W0 baseline, build, smoke, approval, parallel deploy, health.

## Modes

| Invocation | What |
|-----------|------|
| `/deploy` | Full pipeline — W0 + build + 4 services + health |
| `/deploy --skip-tests` | Skip W0 baseline (risky — use only when already verified) |
| `/deploy --dry-run` | Build + smoke only, no deploy |
| `/deploy --preview-only` | Build + Pages preview deploy (no workers) |
| `/deploy pages` | Pages only (re-bundle after UI changes) |
| `/deploy workers` | Gateway + Sync + NanoClaw only (no Pages rebuild) |
| `/deploy gateway` | Gateway worker only |
| `/deploy sync` | Sync worker only |
| `/deploy nanoclaw` | NanoClaw edge agents only |

## The 8-Step Pipeline

```
bun run deploy          # full pipeline
bun run deploy -- --dry-run
bun run deploy -- --skip-tests
DEPLOY_CONFIRM=yes bun run deploy   # CI / non-interactive
```

**Step 1 — W0 Baseline**
```bash
bun run verify   # biome + tsc --noEmit + vitest run
```
Record tests passed/total. Fix before proceeding — never deploy on red.

**Step 2 — Changes**
`git diff` summary. Flag large changesets.

**Step 3 — Build**
```bash
NODE_ENV=production astro build
```
Target: ~23s. Watch for bundle size warnings.

**Step 4 — Credentials**
`CLOUDFLARE_API_TOKEN` must be unset. Deploy uses `CLOUDFLARE_GLOBAL_API_KEY` only.
Scoped tokens lack permissions for workers + custom domains.

**Step 5 — Smoke**
Verify `dist/`, `gateway/wrangler.toml`, `workers/sync/wrangler.toml`, `nanoclaw/wrangler.toml`.

**Step 6 — Approval**
`main` branch: prompts "yes". Other branches: auto-approved.
CI: `DEPLOY_CONFIRM=yes bun run deploy`.

**Step 7 — Deploy (parallel workers + pages)**
Gateway + Sync + NanoClaw deploy in parallel (~16s). Pages deploys after (~29s).
Total: ~74s.

**Step 8 — Health**
```bash
curl https://api.one.ie/health         # Gateway
curl https://one-substrate.pages.dev/  # Pages
curl https://one-sync.oneie.workers.dev/   # Sync
curl https://nanoclaw.oneie.workers.dev/health  # NanoClaw
```
3 retries with backoff. All 4 must return 200.

---

## Bundle Size Rules (CF Pages Free Tier)

The Pages worker bundle must stay under ~10 MiB uncompressed to deploy.
These rules are **LOCKED** — do not revert them.

### Rule 1 — `syntaxHighlight: false` in `astro.config.mjs`

```js
markdown: { syntaxHighlight: false }
```

Disables Shiki from Astro's markdown pipeline. Without this, Shiki pulls ~5.8 MiB of
language grammar files into the SSR worker on every build. **Do not re-enable.**

### Rule 2 — `ssr.external` for heavy packages

```js
ssr: {
  external: ["node:async_hooks", "@mysten/sui", "@mysten/bcs", "shiki", "@shikijs/core", "@shikijs/types"]
}
```

The CF adapter bundles everything by default. `ssr.external` creates a bare
`import { x } from 'pkg'` reference without inlining the package.

**Critical nuance:** `ssr.external` only works safely when the externalized package is
never executed on the server path. For `shiki`: `codeToHtml` is imported by `code-block.tsx`,
but all components that use `code-block.tsx` are `client:only` — so `codeToHtml` is never
called in the worker. The import statement exists in the bundle but is dead code.

If you add a new heavy dependency used only client-side, add it here.

### Rule 3 — Pure-shell pages use `client:only` + `prerender = true`

```astro
---
export const prerender = true
import { MyComponent } from "@/components/MyComponent"
---
<Layout title="...">
  <MyComponent client:only="react" />
</Layout>
```

`client:only="react"` — Astro renders an empty div on the server; the component never
runs in the worker. The React component tree (+ all its imports) stays out of the SSR bundle.

`export const prerender = true` — the page becomes a static HTML file generated once
at build time. The page's SSR handler collapses to a 63-byte stub. Zero worker cost
at runtime.

**Use this pattern for:** any page that has no server-side data dependencies
(no `Astro.locals`, no `Astro.request`, no DB queries in frontmatter).

Currently prerendered: `build.astro`, `ceo.astro`, `chat.astro`, `tasks.astro`.

Pages that CANNOT be prerendered (need runtime session/auth):
`world.astro` (reads `Astro.locals.session`), `market.astro` (fetches capabilities).

### Rule 4 — `react-dom/server.edge` alias (production only)

```js
resolve: {
  alias: {
    ...(isDev ? {} : { "react-dom/server": "react-dom/server.edge" })
  }
}
```

Already in `astro.config.mjs`. Required for CF Edge runtime compatibility.
Do not remove for production builds.

---

## Verified Bundle Numbers

| Before | After | What changed |
|--------|-------|-------------|
| 21 MiB worker | 9.5 MiB | All three rules applied |
| Shiki grammars in worker | External references only | `ssr.external` + `syntaxHighlight: false` |
| `build/ceo/chat/tasks` in SSR handler | 63-byte stubs | `prerender = true` |
| Pages deploy: FAILED | Pages deploy: ✓ 29.6s | Under CF free-tier threshold |

Last verified: 2026-04-15. Deploy: 74.9s total, 4/4 services, 4/4 health.

---

## Service Map

| Service | URL | Config | Deploy command |
|---------|-----|--------|---------------|
| Pages | one-substrate.pages.dev | `astro.config.mjs` | `wrangler pages deploy dist/` |
| Gateway | api.one.ie | `gateway/wrangler.toml` | `cd gateway && wrangler deploy` |
| Sync | one-sync.oneie.workers.dev | `workers/sync/wrangler.toml` | `cd workers/sync && wrangler deploy` |
| NanoClaw | nanoclaw.oneie.workers.dev | `nanoclaw/wrangler.toml` | `cd nanoclaw && wrangler deploy` |

---

## Auth (CRITICAL — never change)

Always: `CLOUDFLARE_GLOBAL_API_KEY` + `CLOUDFLARE_EMAIL`.
Never: `CLOUDFLARE_API_TOKEN` (scoped token lacks workers + custom domain permissions).

The deploy script auto-unsets `CLOUDFLARE_API_TOKEN` from the spawned env to prevent
accidental use of a scoped token that was exported in the shell.

---

## Steps

### `/deploy` (full pipeline)

1. `bun run verify` — W0 gate. Fail here means don't deploy.
2. `git diff` summary — surface scope to user.
3. `NODE_ENV=production bun run build` — Astro production build.
4. Verify credentials: assert `CLOUDFLARE_GLOBAL_API_KEY` present, unset `CLOUDFLARE_API_TOKEN`.
5. Smoke check: assert `dist/` exists, all 3 wrangler configs present.
6. Approval gate: prompt on `main`, auto on other branches.
7. Parallel deploy: Gateway + Sync + NanoClaw concurrently, then Pages.
8. Health checks: all 4 endpoints × 3 retries with backoff.
9. Report:
   ```
   Branch:   main
   Tests:    320/320 pass
   Build:    23.2s
   Workers:  parallel 16.7s (vs ~42s sequential)
   Pages:    29.6s
   Health:   4/4 (Gateway 308ms, Pages 666ms, Sync 287ms, NanoClaw 287ms)
   Preview:  https://<hash>.one-substrate.pages.dev
   Total:    74.9s
   ```

### `/deploy pages`

1. `NODE_ENV=production bun run build`
2. Check bundle size: `du -sh dist/_worker.js/`
3. If > 12 MiB: check which chunk grew (`ls -lhS dist/_worker.js/chunks/ | head -15`)
4. `wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true`
5. Health: `curl -sL https://one-substrate.pages.dev/`

### `/deploy workers`

```bash
cd gateway && bun wrangler deploy && cd ../workers/sync && bun wrangler deploy && cd ../../nanoclaw && bun wrangler deploy && cd ..
```

Report: version hash per worker, health latency per service.

---

## Bundle Size Diagnosis

If build fails with "exceeds size limit":

```bash
# Check total worker size
du -sh dist/_worker.js/

# Find top offenders
ls -lhS dist/_worker.js/chunks/ | head -20

# Check if a new import pulled in Shiki
grep -r "from 'shiki'" dist/_worker.js/chunks/ | wc -l
# If > 0: a component that imports shiki was SSR'd
# Fix: make its page client:only="react" + prerender=true

# Check if React crept back into worker via client:load
grep -l "react-vendor" dist/_worker.js/chunks/
# If multiple chunks: some page SSR-renders React via client:load
# Fix: audit src/pages/*.astro for client:load on pure-shell pages
```

---

## Rollback

```bash
# Revert to previous Pages deployment
wrangler pages deployment list --project-name=one-substrate
wrangler pages deployment rollback <deployment-id> --project-name=one-substrate

# Revert a worker
cd gateway && git stash && bun wrangler deploy
```

---

*Deploy is the closed loop. W0 baseline in, health check out. If health fails, mark() is blocked.*
