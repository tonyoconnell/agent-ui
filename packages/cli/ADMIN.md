# ONE Platform Admin Guide

> Your single reference for building, releasing, and staying organized.

---

## Local Development (Before npm)

**Run CLI locally without publishing to npm:**

```bash
# From monorepo root
cd /Users/toc/Server/ONE

# Build the CLI
cd cli && npm run build && cd ..

# Run any command using node directly
node cli/dist/index.js admin list
node cli/dist/index.js admin validate
node cli/dist/index.js admin build shop --dry-run
node cli/dist/index.js admin sync --dry-run
```

**Quick alias (add to ~/.zshrc):**

```bash
alias onedev="node /Users/toc/Server/ONE/cli/dist/index.js"

# Then use:
onedev admin list
onedev admin validate
```

**Or use npm link for global access:**

```bash
cd cli
npm link

# Now works globally (until you unlink)
oneie admin list
oneie admin validate

# To remove:
npm unlink -g oneie
```

---

## Prerequisites

```bash
# Must be in monorepo root
cd /Users/toc/Server/ONE

# Verify you're in the right place
ls CLAUDE.md .claude/agents cli/release.yaml

# Build CLI if not already built
cd cli && npm run build && cd ..
```

---

## Quick Reference

| Task | Local (dev) | Published (npm) |
|------|-------------|-----------------|
| List packages | `node cli/dist/index.js admin list` | `npx oneie admin list` |
| Validate | `node cli/dist/index.js admin validate` | `npx oneie admin validate` |
| Build one | `node cli/dist/index.js admin build <pkg>` | `npx oneie admin build <pkg>` |
| Build all | `node cli/dist/index.js admin build --all` | `npx oneie admin build --all` |
| Sync files | `node cli/dist/index.js admin sync` | `npx oneie admin sync` |
| Release | `node cli/dist/index.js admin release patch` | `npx oneie admin release patch` |
| Dry run | Add `--dry-run` to any command | Add `--dry-run` to any command |

---

## Daily Workflow

### 1. Check Status

```bash
# List all packages and their prices
node cli/dist/index.js admin list

# Check manifest against actual files
node cli/dist/index.js admin validate
```

### 2. Make Changes

Edit files in `web/`, `backend/`, `.claude/`, `one/` as needed.

### 3. Build Packages (Optional)

```bash
# Preview what would be built
node cli/dist/index.js admin build shop --dry-run

# Actually build
node cli/dist/index.js admin build shop
```

---

## Release Process

### Step 1: Rebuild CLI (if you changed admin code)

```bash
cd cli && npm run build && cd ..
```

### Step 2: Validate

```bash
node cli/dist/index.js admin validate
```

Fix any errors before proceeding.

### Step 3: Preview Sync

```bash
node cli/dist/index.js admin sync --dry-run
```

### Step 4: Release

```bash
# Bug fix (1.0.0 → 1.0.1)
node cli/dist/index.js admin release patch

# New feature (1.0.0 → 1.1.0)
node cli/dist/index.js admin release minor

# Breaking change (1.0.0 → 2.0.0)
node cli/dist/index.js admin release major

# Sync only (no version bump)
node cli/dist/index.js admin sync
```

### Step 5: Verify

```bash
# Check npm
npm view oneie version

# Test install
npx oneie@latest --version
```

---

## File Structure

```
cli/
├── dist/                    # Compiled JS (run from here)
│   └── index.js             # Entry point
├── src/                     # TypeScript source
│   ├── index.ts             # Main CLI
│   ├── admin/               # Admin commands
│   │   ├── index.ts         # Command router
│   │   ├── build.ts         # Build packages
│   │   ├── release.ts       # Version + publish
│   │   ├── sync.ts          # Sync files
│   │   ├── validate.ts      # Check manifest
│   │   ├── list.ts          # List packages
│   │   ├── manifest.ts      # YAML loader
│   │   └── monorepo.ts      # Monorepo detection
│   └── commands/            # User commands (init, agent)
├── packages/
│   └── manifest.yaml        # Single source of truth
├── release.yaml             # Files to sync
├── package.json             # npm config + version
├── ADMIN.md                 # This file
└── tsconfig.json
```

---

## Key Files

| File | Purpose | When to Edit |
|------|---------|--------------|
| `cli/packages/manifest.yaml` | Package definitions | Adding/changing packages |
| `cli/release.yaml` | Files synced to cli/ | Adding new sync paths |
| `cli/package.json` | npm package config | Rarely (version auto-bumped) |
| `cli/src/admin/*.ts` | Admin command code | Adding new commands |

---

## Adding a New Package

1. **Edit manifest:**

```bash
nano cli/packages/manifest.yaml
```

2. **Add package definition:**

```yaml
mypackage:
  name: "@oneie/mypackage"
  description: "My new package"
  version: "1.0.0"
  type: feature
  price: "$29"

  include:
    - web/src/pages/mypackage/**
    - web/src/components/mypackage/**
    - backend/convex/mypackage.ts

  dependencies:
    some-lib: "^1.0.0"

  env:
    required:
      - MY_API_KEY
```

3. **Validate:**

```bash
node cli/dist/index.js admin validate
```

4. **Build:**

```bash
node cli/dist/index.js admin build mypackage
```

5. **Check output:**

```bash
ls apps/mypackage/
ls packages/mypackage/
```

---

## Adding New Admin Commands

1. **Create file:** `cli/src/admin/mycommand.ts`

```typescript
import chalk from "chalk";
import type { AdminOptions } from "./index.js";

export async function runMyCommand(
  args: string[],
  options: AdminOptions
): Promise<void> {
  console.log(chalk.cyan("Running my command..."));
  // Your logic here
}
```

2. **Register in `cli/src/admin/index.ts`:**

```typescript
import { runMyCommand } from "./mycommand.js";

// In switch statement:
case "mycommand":
  await runMyCommand(cleanArgs, options);
  break;
```

3. **Rebuild:**

```bash
cd cli && npm run build && cd ..
```

4. **Test:**

```bash
node cli/dist/index.js admin mycommand
```

---

## Troubleshooting

### "Admin commands only work in the ONE monorepo"

```bash
cd /Users/toc/Server/ONE
```

### CLI changes not taking effect

```bash
cd cli && npm run build && cd ..
```

### Validation errors

Either:
- Create the missing files
- Remove the pattern from `manifest.yaml`

### TypeScript errors

```bash
cd cli
npx tsc --noEmit  # Check without building
npm run build     # Build and see errors
```

### npm publish fails

```bash
npm whoami        # Check if logged in
npm login         # Re-authenticate
```

---

## Complete Release Checklist

```bash
# 1. Rebuild CLI (if changed)
cd cli && npm run build && cd ..

# 2. Validate
node cli/dist/index.js admin validate

# 3. Preview sync
node cli/dist/index.js admin sync --dry-run

# 4. Release
node cli/dist/index.js admin release patch

# 5. Verify
npm view oneie version
npx oneie@latest --version
```

---

## Packages Overview

| Package | Type | Price | Description |
|---------|------|-------|-------------|
| **web** | foundation | free | Astro + React + Tailwind starter |
| **blog** | feature | free | Blog with MDX and RSS |
| **docs** | feature | free | Documentation site |
| **shop** | feature | $49 | E-commerce with Stripe |
| **mail** | feature | $29 | Email with Resend |
| **chat** | feature | $59 | Real-time chat + AI |
| **dashboard** | feature | $39 | Analytics + admin |
| **creator** | feature | $99 | Courses + memberships |

**Bundles:**
- **Starter** (free): blog + docs
- **Business** ($69): shop + mail (save $9)
- **Pro** ($249): all paid packages (save $66)

---

## Remember

1. **Always rebuild** after changing TypeScript: `cd cli && npm run build`
2. **Always validate** before releasing: `node cli/dist/index.js admin validate`
3. **Use --dry-run** to preview changes first
4. **manifest.yaml** is the single source of truth
5. **Local testing**: `node cli/dist/index.js` not `npx oneie`

---

**Last Updated:** 2025-12-13
