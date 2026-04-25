# Local Dev — Cloudflare-parity setup

`workerd` in-process, real D1/KV bindings, no Node-only fallback for routes.

---

## 1. Quick start

```bash
bun install
bun run d1:migrate              # apply 24 migrations to local D1
cp .dev.vars.example .dev.vars  # fill in secrets you need
bun run dev                     # → http://localhost:4321 (workerd, D1 + KV bindings live)
```

> If `bun run dev` fails with `require is not defined` in `react-dom/server.edge.js`, use `npx astro dev` instead. See `CLAUDE.md` § Quick Start for the `nohup` log pattern.

---

## 2. What runs where

| Component | Runtime | Notes |
|---|---|---|
| API routes (`src/pages/api/**`) | workerd in-process via `@cloudflare/vite-plugin` | Same `cloudflare:workers` env as prod |
| D1 binding (`DB`) | miniflare local SQLite at `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<sha>.sqlite` | Wrangler manages migrations; same file used in integration tests |
| KV binding (`KV`) | miniflare local | Populated at `.wrangler/state/v3/kv` on demand during `bun run dev` |
| Vite outer process | Node | Allows dev-WS for live task updates to attach `node:http` |
| `bun run d1:migrate` | wrangler | Reads `migrations/*.sql` in order; uses database name `one-vault` |

---

## 3. Key files

- `astro.config.mjs` — uses `cloudflare()` adapter for both dev and prod; `prerenderEnvironment: 'node'` is build-time only
- `wrangler.toml` — D1 binding (`[[d1_databases]]`, line 13) and KV binding (`[[kv_namespaces]]`, line 20)
- `src/lib/cf-env.ts` — `getD1(locals)` and `getEnv(locals)` helpers; tries `cloudflare:workers` first, then `locals.runtime.env`, then local bun:sqlite shim
- `.dev.vars.example` → `.dev.vars` — workerd-side secrets in dev (not `process.env`; these load as Worker env vars)
- `migrations/*.sql` — D1 schema (24 files, numbered, applied in order by `bun run d1:migrate`)
- `src/lib/local-d1.ts` — bun:sqlite shim pointing at the wrangler-managed SQLite file; used only by non-Astro Bun scripts and tests, never imported by routes directly

---

## 4. Adding a new D1 table

1. Create `migrations/00NN_descriptive_name.sql` — increment the numeric prefix (current high-water mark: `0024`).
2. `bun run d1:migrate` — applies locally.
3. `bun run d1:migrate:remote` — applies to prod when ready.
4. Use in a route:
   ```typescript
   const db = await getD1(locals)
   if (!db) return new Response('D1 unavailable', { status: 500 })
   const row = await db.prepare('SELECT * FROM my_table WHERE id = ?').bind(id).first()
   ```
5. Avoid `ADD COLUMN IF NOT EXISTS` — D1's non-standard variant; local SQLite rejects it. Use plain `ADD COLUMN`.
6. To wipe and re-apply all local migrations: `bun run d1:reset`.

---

## 5. Connecting to prod data from dev (remote bindings)

Per-binding `remote: true` in `wrangler.toml` routes that binding to the live Cloudflare service. Reference: [Cloudflare remote bindings (Nov 2025)](https://blog.cloudflare.com/connecting-the-architecture-of-remote-bindings/).

```toml
[[kv_namespaces]]
binding = "KV_PROD"
id = "1c1dac4766e54a2c85425022a3b1e9da"
remote = true
```

`wrangler login` once; the OAuth flow uses the same auth as deploys. D1 stays local-only by default — don't add `remote: true` to the `DB` binding unless you intend to mutate prod.

---

## 6. Troubleshooting

- **`getD1()` returns null in dev** — local D1 not yet migrated. Run `bun run d1:migrate`.
- **Migration fails with "near IF: syntax error"** — file uses `ADD COLUMN IF NOT EXISTS`. Strip `IF NOT EXISTS`.
- **`process.env.X` undefined under workerd** — workerd doesn't expose `process.env`. Use `(await getEnv(locals)).X` in routes; for lib modules that run in both contexts: `typeof process !== 'undefined' ? process.env.X : undefined`.
- **Port 4321 in use** — `pkill -f "astro dev"` then retry.
- **Live task WS missing** — `[dev-ws] Skipped: module did not load` in dev output is expected; the WS server attaches via Vite's Node-side `configureServer` hook, not workerd.
- **FSWatcher MaxListeners warning** — harmless Vite chatter; pre-existing.
- **`cloudflare:workers` import fails in a test** — tests run outside workerd. Use `src/lib/local-d1.ts` directly (or the `getD1(undefined)` shim path which falls through to it).

---

## 7. What this is NOT

- Not a deploy guide — see `/deploy` skill or `docs/deploy.md`.
- Not a full Cloudflare reference — see `.claude/skills/cloudflare.md`.
- Not for Astro routing/page questions — see `.claude/skills/astro/SKILL.md`.
- Not the top-level architecture — see `CLAUDE.md`.
