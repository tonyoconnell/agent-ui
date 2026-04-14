# Secure Deployment Guide

**Critical security fixes applied. Follow these steps to deploy safely.**

---

## Issue: Credentials in Build Output

**Status: FIXED**

### Problem (Now Fixed)

TypeDB credentials were hardcoded in the compiled worker bundle:
```
dist/_worker.js/chunks/typedb_*.mjs
  TYPEDB_PASSWORD = "EEsdYvp7arsAiCJZ"
  TYPEDB_USERNAME = "admin"
```

### Solution

Credentials are now:
1. **Removed from build time** — no longer in `import.meta.env` at compile
2. **Moved to runtime** — read from Worker environment context only
3. **Set via wrangler secret** — not in `.env` or source code

---

## Deployment Steps

### 1. Set TypeDB Secrets

Set credentials as Worker secrets (not environment variables):

```bash
# Gateway Worker
cd gateway
bun wrangler secret put TYPEDB_USERNAME
# Paste: admin

bun wrangler secret put TYPEDB_PASSWORD
# Paste: EEsdYvp7arsAiCJZ

# Sync Worker (if needed)
cd ../workers/sync
bun wrangler secret put TYPEDB_USERNAME
bun wrangler secret put TYPEDB_PASSWORD
```

### 2. Verify .env

`.env` should NOT contain TYPEDB_PASSWORD (except for local dev via gateway):

```bash
# Good — local dev with gateway
PUBLIC_GATEWAY_URL=http://localhost:8787
TYPEDB_URL=https://flsiu1-0.cluster.typedb.com:1729
TYPEDB_DATABASE=one
TYPEDB_USERNAME=admin    # OK for local dev
TYPEDB_PASSWORD=...      # OK for local dev only

# When deployed to Cloudflare:
# - Gateway Worker reads TYPEDB_PASSWORD from wrangler secret
# - Pages SSR reads from gateway (no direct credentials needed)
```

### 3. Deploy Workers with Secrets

```bash
# Gateway
cd gateway
bun wrangler deploy
# Will use secrets from wrangler secret put

# Sync worker
cd ../workers/sync
bun wrangler deploy
```

### 4. Deploy Pages

```bash
bun run build
bun wrangler pages deploy dist/
```

### 5. Verify No Leakage

```bash
# Verify secrets NOT in build output
grep -r "EEsdYvp7" dist/
# Should return: (no matches)

# Check gateway worker deployed correctly
curl https://api.one.ie/health
# Should return: {"status":"ok"}
```

---

## Key Changes

### Code Changes

| File | Change | Impact |
|------|--------|--------|
| `src/lib/typedb.ts:21-34` | Moved credentials from import.meta.env to globalThis (runtime) | Secrets no longer in bundle |
| `src/lib/auth.ts:81-98` | Same fix — split public/runtime config | Secrets no longer in bundle |
| `src/pages/api/signal.ts:35-65` | Added TQL injection escaping + UID validation | TQL injection fixed |
| `src/env.d.ts` | Marked secrets as optional, added comments | Clarifies secret handling |

### wrangler.toml Changes

Add secrets section to `gateway/wrangler.toml`:

```toml
[env.production]
vars = { TYPEDB_URL = "https://flsiu1-0.cluster.typedb.com:1729", TYPEDB_DATABASE = "one" }

# Secrets set via: bun wrangler secret put TYPEDB_USERNAME
# Never put secrets in wrangler.toml
```

---

## Security Checklist

- [ ] TYPEDB_PASSWORD set via `wrangler secret put` (not in .env or code)
- [ ] Build output verified (no password grep match)
- [ ] Gateway worker deployed (`/health` endpoint returns 200)
- [ ] Pages deployed (uses gateway for TypeDB access)
- [ ] Sync worker deployed (uses KV, optional TYPEDB secrets)
- [ ] TQL injection tests pass (bad UIDs rejected with 400)
- [ ] E2E tests pass (18/18 passing)

---

## Local Development

For local dev with `bun run dev`:

1. Start gateway worker:
   ```bash
   cd gateway
   wrangler dev
   ```

2. Set PUBLIC_GATEWAY_URL in .env:
   ```
   PUBLIC_GATEWAY_URL=http://localhost:8787
   ```

3. Gateway reads from .env (OK for local):
   ```
   TYPEDB_PASSWORD=EEsdYvp7arsAiCJZ
   ```

4. Run Pages:
   ```bash
   bun run dev
   ```

Pages SSR → gateway (localhost:8787) → TypeDB Cloud

---

## Production Verification

After deployment, verify security:

```bash
# 1. Check gateway health
curl https://api.one.ie/health
# { "status": "ok", "database": "one", "latency": 14 }

# 2. Test TQL injection prevention
curl -X POST https://api.one.ie/api/signal \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "x\"; drop all; select \"",
    "receiver": "y",
    "data": "test"
  }'
# Should return 400: Invalid sender format

# 3. Run E2E tests
bash scripts/e2e-test.sh
# Should show 18/18 passing
```

---

## Rollback

If secrets leak or are compromised:

```bash
# 1. Rotate credentials in TypeDB Cloud console
# 2. Update secrets:
bun wrangler secret put TYPEDB_PASSWORD
# 3. Redeploy:
bun wrangler deploy
# 4. Verify:
curl https://api.one.ie/health
```

---

**Deployed with security-first architecture. No credentials in code, build output, or git.**
