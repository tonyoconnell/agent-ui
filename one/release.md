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

---

## Feature Releases

### Groups — Multi-tenancy + Security Layer (2026-04-20)

**Cycles 1–3 complete.** Groups are now the substrate's tenancy and security primitive.

**What shipped:**

| Feature | Where |
|---------|-------|
| `group` entity: `visibility`, `plan`, `fade-rate`, `sensitivity`, `toxicity-threshold` | `src/schema/one.tql` |
| `signal owns scope`, `path owns bridge-kind` | `src/schema/one.tql` |
| `children_of($root)` TQL function (single-hop hierarchy) | `src/schema/world.tql` |
| Full CRUD: `/api/groups`, `/api/groups/:gid`, members, role, invite, join, leave | `src/pages/api/groups/` |
| Federation handshake: `/api/paths/bridge` (two-sided, direction-agnostic) | `src/pages/api/paths/bridge.ts` |
| Unified inbox: `/api/inbox/:uid` | `src/pages/api/inbox/[uid].ts` |
| Hierarchy-aware scope check in `/api/signal` (sibling sub-group routing) | `src/pages/api/signal.ts` |
| Role-check matrix with 5 new group actions (`create_group`, `update_group`, `delete_group`, `invite_member`, `change_role`) | `src/lib/role-check.ts` |
| `getRoleForUser(uid, gid?)` — group-scoped role lookup | `src/lib/api-auth.ts` |
| `resolveUnitFromSession` returns `personalGid` + `suggestedJoins` | `src/lib/api-auth.ts` |
| Personal group auto-created on sign-up (`group:{uid}`, role: chairman) | `src/lib/api-auth.ts` |
| Pheromone scope partitioning: `mark/warn` accept `{ scope? }` opt | `src/engine/persist.ts` |
| `forget(uid)` cascades personal group | `src/engine/persist.ts`, `src/pages/api/memory/forget/[uid].ts` |
| `actor.owner` attribute written at register/sync | `src/pages/api/agents/register.ts` |
| `gid` rename sweep across all API routes (retired `group-id`) | `src/pages/api/g/[gid]/*`, multiple routes |

**Security invariants enforced:** 13 (see `one/groups.md § Security Invariants`).

**The One Rule:** an actor can only act where it is a member. No ACL tables — the group graph IS the security model.
