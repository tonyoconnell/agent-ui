# Release — `one-ie/one`

Public release plan. Bundles everything needed to run ONE into a single GitHub repo
at `github.com/one-ie/one`. Assembled by `scripts/release.ts` into `/releases/`,
pushed from there.

**Source of truth:** this monorepo (`~/Server/envelopes`).
**Output:** `/releases/` — staging directory, gitignored here, pushed to `one-ie/one`.

---

## What gets released

Five top-level artifacts. Each is a self-contained folder in the public repo.

| Slot | Source (here)            | What it is                                       |
|------|--------------------------|--------------------------------------------------|
| `agents/`   | `agents/`           | Markdown agent definitions (11 marketing, core, roles, debby, donal, dave) |
| `one/`      | `one/`              | **Docs** — ontology, dictionary, rubrics, routing, DSL, lifecycle, 130+ MDs |
| `sdk/`      | `packages/sdk/`     | `@oneie/sdk` — TypeScript SDK for the substrate API |
| `mcp/`      | `packages/mcp/`     | `@oneie/mcp` — MCP server exposing ONE verbs to Claude/Cursor |
| `.claude/`  | `.claude/`          | Commands, skills, rules, hooks, agents — the Claude Code harness |

**Removed 2026-04-19:** `web/` slot (Astro + React + Workers app). The live substrate surface stays in the envelopes monorepo; the public repo ships docs + agents + SDK + MCP + Claude harness only.

**Root files** (repo landing):

| File        | Role                                                      |
|-------------|-----------------------------------------------------------|
| `README.md` | Public intro — what ONE is, quick start, links to folders |
| `CLAUDE.md` | Claude Code project context — the 6 dimensions, 7 loops, 3 locked rules |
| `AGENTS.md` | Agent manifest — every agent's UID, role, channels, group |
| `LICENSE`   | MIT (matches current `envelopes/LICENSE`)                 |

---

## The 4-file convention

Every major folder in the release carries the same four files. The CLI package
(`packages/cli/`) already follows this — copy that shape to sdk, mcp, agents,
one, web, .claude.

```
<folder>/
├── README.md    # What this folder is, how to use it standalone
├── CLAUDE.md    # Local contract — auto-loaded by Claude Code when cwd is here
├── AGENTS.md    # What agents live here OR which agents consume this code
└── LICENSE      # Same MIT text as root (copied, not symlinked — git on Windows)
```

**Why four files, not one:** Claude Code's context loader walks up from cwd and
pulls every `CLAUDE.md` it finds. If a user clones `one-ie/one` and cd's into
`web/`, they get repo-wide + web-scoped context automatically. The AGENTS.md
convention mirrors what Anthropic's `AGENTS.md` (cross-tool) proposes for
multi-agent discovery.

---

## Directory shape (the release root)

```
releases/                    ← scripts/release.ts writes here
├── README.md
├── CLAUDE.md
├── AGENTS.md
├── LICENSE
├── agents/
│   ├── README.md
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   ├── LICENSE
│   └── <all agent .md files + subdirs>
├── one/
│   ├── README.md
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   ├── LICENSE
│   └── <all docs from envelopes/one/>
├── web/
│   ├── README.md
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   ├── LICENSE
│   ├── src/
│   ├── public/
│   ├── astro.config.mjs
│   ├── wrangler.toml
│   ├── package.json        ← trimmed, release-ready
│   └── tsconfig.json
├── sdk/
│   ├── README.md
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   ├── LICENSE
│   ├── src/
│   ├── package.json        ← @oneie/sdk, publishable
│   └── tsconfig.json
├── mcp/
│   ├── README.md
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   ├── LICENSE
│   ├── src/
│   ├── package.json        ← @oneie/mcp, publishable
│   └── tsconfig.json
└── .claude/
    ├── README.md
    ├── CLAUDE.md
    ├── AGENTS.md
    ├── LICENSE
    ├── commands/
    ├── skills/
    ├── rules/
    ├── hooks/
    └── agents/
```

**What's excluded:** `gateway/`, `nanoclaw/`, `workers/sync/`, `python/`,
`scripts/`, `templates/`, `test/`, `node_modules/`, `dist/`, `.env*`,
`.tasks.json`, `todo.json`, `bun.lock`, `.wrangler/`, `.astro/`, `.vitest/`,
`.obsidian/`. These are build-time, infra, or private state.

---

## The release script — `scripts/release.ts`

Single TypeScript entry, invoked via `bun run release` (to be added to
`package.json`). Pure copy-manifest pattern, modeled on
`packages/cli/src/admin/manifest.ts`.

### Contract

```typescript
// scripts/release.ts
import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "releases");

type Entry = { from: string; to: string; exclude?: string[] };

const manifest: Entry[] = [
  // Top-level files
  { from: "LICENSE",           to: "LICENSE" },
  // Slots
  { from: "agents",            to: "agents",   exclude: ["node_modules"] },
  { from: "one",               to: "one",      exclude: ["archive"] },
  { from: "packages/sdk",      to: "sdk",      exclude: ["node_modules", "dist"] },
  { from: "packages/mcp",      to: "mcp",      exclude: ["node_modules", "dist"] },
  { from: ".claude",           to: ".claude",  exclude: ["settings.local.json", "scheduled_tasks.lock"] },
  // Web — multi-source, assembled under web/
  { from: "src",               to: "web/src" },
  { from: "public",            to: "web/public" },
  { from: "migrations",        to: "web/migrations" },
  { from: "astro.config.mjs",  to: "web/astro.config.mjs" },
  { from: "wrangler.toml",     to: "web/wrangler.toml" },
  { from: "tsconfig.json",     to: "web/tsconfig.json" },
  { from: "biome.json",        to: "web/biome.json" },
];

async function run() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (const e of manifest) {
    const src = join(ROOT, e.from);
    const dst = join(OUT, e.to);
    await cp(src, dst, {
      recursive: true,
      filter: (path) => !e.exclude?.some(ex => path.includes(ex)),
    });
    console.log(`✓ ${e.from} → releases/${e.to}`);
  }

  await writeRootFiles();              // README, CLAUDE, AGENTS from templates
  await writeFolderFiles();            // 4-file convention in each slot
  await writeReleasePackageJson();     // trimmed package.json for web/
  await stripDevOnly();                // remove .env.example stubs, local notes

  console.log(`\n✓ release staged at ${OUT}`);
  console.log(`  next: cd releases && git push origin main`);
}

run().catch(e => { console.error(e); process.exit(1); });
```

### Steps the script runs

1. **Clean** — wipe `releases/` if it exists.
2. **Copy** — each manifest entry, honoring exclude patterns.
3. **Assemble web/** — pull `src/`, `public/`, `migrations/`, configs into one folder.
4. **Write root four** — README/CLAUDE/AGENTS/LICENSE at repo root (from templates or existing source).
5. **Write folder four** — same quadruple in each top-level slot; LICENSE copied from root.
6. **Trim package.json** — web-only deps, publishable pkg metadata.
7. **Validate** — run `tsc --noEmit` and `biome check` against `releases/web/` and each package.
8. **Report** — deterministic receipt: files copied, bytes, validation results.

### Push flow

```bash
bun run release                              # builds releases/
cd releases
git init && git remote add origin git@github.com:one-ie/one.git
git add . && git commit -m "release: v1.0.0 initial"
git push -u origin main --force               # first push only; later: normal push
```

Later releases: the `releases/` folder is a persistent git worktree checked out
to `one-ie/one`. Script updates files in place, commits, pushes.

---

## Versioning

- **Monorepo version** — `envelopes/package.json` bumps drive the release tag.
- **SDK/MCP versions** — `packages/{sdk,mcp}/package.json`, independent semver (published to npm as `@oneie/sdk` and `@oneie/mcp`).
- **Web version** — tagged per deploy commit, not semver (continuous).
- **Docs version** — untagged, always matches monorepo HEAD.

`/releases` always reflects a single consistent snapshot — one `git push` per release.

---

## What each slot documents in its CLAUDE.md

Not auto-generated — hand-written per slot. Short, locks the local contract.

| Slot | CLAUDE.md locks |
|------|-----------------|
| root (`releases/CLAUDE.md`) | 6 dimensions, 7 loops, 3 locked rules, tech stack, slot map |
| `agents/CLAUDE.md` | agent markdown format, TypeDB sync, how to add an agent |
| `one/CLAUDE.md` | doc hierarchy, canonical names, when to edit which doc |
| `web/CLAUDE.md` | Astro routes, API endpoints, hydration rules, the 50+ endpoints grouped by dimension |
| `sdk/CLAUDE.md` | SDK exports, signal/ask/mark/know pattern, auth |
| `mcp/CLAUDE.md` | MCP tool list, schema, Claude Desktop wiring |
| `.claude/CLAUDE.md` | how commands/skills/rules compose, how to add a new command |

---

## Open questions (decide before first push)

1. **Repo visibility** — `one-ie/one` public from day 1, or private until after v1.0.0?
2. **npm namespace** — `@oneie/sdk` and `@oneie/mcp` already reserved? If not, reserve before publish.
3. **LICENSE text** — current `envelopes/LICENSE` is MIT. Keep, or switch to Apache 2.0 for the contribution-ready surface?
4. **Workflow** — should `releases/` be a git submodule of this repo, a separate worktree, or pure output (gitignored)? Recommend **pure output**, gitignored here; script manages the push target.
5. **CI** — add `.github/workflows/release.yml` to run `bun run release` on tag push, and push to `one-ie/one` automatically.

---

## See also

- `packages/cli/src/admin/manifest.ts` — existing copy-manifest pattern (source of this design)
- `packages/cli/src/admin/release.ts` — existing npm-publish flow for `oneie` CLI
- `one/AGENTS.md` — agent manifest format reference
- `CLAUDE.md` (this repo) — the canonical 6-dimension / 7-loop / 3-rule source
- `docs/patterns.md` — closed loop, zero returns, deterministic sandwich
