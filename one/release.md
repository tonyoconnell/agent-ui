# Release

How to release `@oneie/sdk`, `oneie` (CLI), and `@oneie/mcp` to npm.

## The Three Packages

| Package | npm name | Version | Depends on |
|---------|----------|---------|------------|
| SDK | `@oneie/sdk` | 0.6.0 | — |
| CLI | `oneie` | 3.7.0 | `@oneie/sdk` |
| MCP | `@oneie/mcp` | 0.1.0 | `@oneie/sdk` |

**Publish order matters:** SDK first, then CLI + MCP (parallel).

## The `npx oneie` Flow

When a user runs `npx oneie`:

1. Clone `one-ie/one` repo to current directory
2. Prompt for org name, website, email
3. Create org folder with ontology structure
4. Launch Claude Code

The CLI clones the full public repo — no file bundling in npm package.

## Version Sync

The CLI and MCP depend on the SDK. On release:

1. Bump SDK version (e.g., 0.6.0 → 0.7.0)
2. Update CLI's `@oneie/sdk` dep to match
3. Update MCP's `@oneie/sdk` dep to match
4. Bump CLI and MCP versions

## Manual Release

```bash
# 1. Stage release
bun run scripts/release.ts

# 2. Build + publish SDK
cd release/sdk && bun run build && npm publish --access public

# 3. Build + publish CLI
cd release/cli && bun run build && npm publish --access public

# 4. Build + publish MCP
cd release/mcp && bun run build && npm publish --access public

# 5. Push to GitHub
bun run scripts/release.ts --push
```

## What Ships Publicly

The `release/` directory = `one-ie/one` repo. See `scripts/release.ts` for manifest.
