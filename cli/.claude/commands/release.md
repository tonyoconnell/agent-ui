---
allowed-tools: Task(agent-ops:*)
description: Release CLI to npm (optimized)
---

# /release - Release CLI to npm (Optimized v2)

Release the CLI to npm registry with parallel sync and minimal duplication.

## Usage

```bash
/release patch   # Bug fix (1.0.0 → 1.0.1)
/release minor   # New feature (1.0.0 → 1.1.0)
/release major   # Breaking change (1.0.0 → 2.0.0)
/release sync    # Sync files without version bump
```

## What It Does (Optimized)

Runs `./.claude/hooks/release-cli.sh [type]` which:

1. **Syncs documentation** `/one/*` → `cli/one/` (all platform docs)
2. **Syncs root markdown** (CLAUDE.md, README.md, LICENSE.md, SECURITY.md, AGENTS.md)
3. **Syncs MCP config files** (.mcp.json.on, .mcp.json.off)
4. **Hooks stay in root** - CLI references `./.claude/hooks/` (single source of truth, no duplication)
5. **Parallel operations** - Uses background jobs for file copies
6. **Bumps version** in `cli/package.json` (if not sync)
7. **Builds CLI** with npm
8. **Publishes to npm** registry
9. **Verifies publication** on npm registry

## Architecture

```
Root Repository (.claude/hooks/)
    ↓ (referenced by)
CLI Repo (cli/)
    ├── cli/one/*          (synced documentation)
    ├── cli/*.md           (synced markdown files)
    ├── cli/.mcp.json.on   (MCP servers enabled config)
    ├── cli/.mcp.json.off  (MCP servers disabled config)
    └── package.json       (version bumped & published)
```

**Key Benefit:** Hooks are maintained in ONE place - the root repository. No duplication, no sync issues.

## Performance

- **Before:** Synced 17 hook files + documentation (~50+ files)
- **After:** Syncs only documentation + 5 markdown files (~200 files in /one/)
- **Result:** Faster, cleaner, single source of truth

## Your Task

Delegate to agent-ops to run the optimized release:

```typescript
Task({
  subagent_type: "agent-ops",
  description: "Execute optimized CLI release with hooks merge",
  prompt: `Run optimized CLI release:

1. Execute: ./.claude/hooks/release-cli.sh ${releaseType}
   - Syncs /one/* to cli/one/
   - Syncs root markdown files
   - Syncs .mcp.json.on and .mcp.json.off files
   - Hooks reference root .claude/ (no copy)
   - Bumps version (if not sync)
   - Publishes to npm

2. Wait for completion and verify publication

3. Report:
   - New version number (if version bumped)
   - npm publication success/failure
   - Release duration
   - Any errors or warnings

Do not copy .claude/ to cli/ - hooks stay in root.`,
});
```

## After Release

Install the new version:

```bash
npx oneie@latest --version
```

## Testing

Verify the release locally:

```bash
# Test the script
./.claude/hooks/release-cli.sh sync

# Check CLI was built
ls -la cli/dist/

# Check npm credentials
npm whoami
```
