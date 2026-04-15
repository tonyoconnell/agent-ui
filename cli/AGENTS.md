# Repository Guidelines
## Planning & Agent Workflow
- Start with `CLAUDE.md`, run work through the `Infer 1–100` sequence using `/now`, `/next`, `/todo`, and `/done`, and map each change to the ontology (groups, people, things, connections, events, knowledge).
- Keep the root clean: only `README.md`, `LICENSE.md`, `SECURITY.md`, `CLAUDE.md`, and this guide stay here; place all other docs in the correct `one/` dimension.

## Project Structure & Module Organization
- `web/`: Astro 5 + React 19 front end; routes in `web/src/pages`, islands in `web/src/components`, tokens in `web/src/styles/global.css`.
- `backend/convex`: Schema, queries, mutations, and Effect helpers for the ontology.
- `apps/` and `cli/`: Shipping targets and tooling—touch only when a task calls for it.
- `one/`: Canonical documentation. Update the appropriate dimension when behavior changes.

## Build, Test, and Development Commands
- `bun --cwd web run dev` launches the Astro dev server.
- `bun --cwd web run build` executes `astro check` then `astro build`.
- `bun --cwd web run lint` / `bun --cwd web run format` run eslint and prettier.
- `bun --cwd web run test` (or `test:coverage`) runs Vitest; `bun test test/auth` targets auth suites. Backend work uses `bun --cwd backend dev`.

## Coding Style & Naming Conventions
Prettier controls formatting—use 2-space indentation for Astro/TSX/JSON. Components take PascalCase (`GroupSelector.tsx`); hooks/utilities use camelCase (`useBetterAuth.ts`). Keep Tailwind values tokenized (`hsl(var(--token))`) and add tokens solely in `web/src/styles/global.css`. Convex `_generated/` files are read-only.

### Tailwind v4 & Styling Best Practices

**CRITICAL: Gradient Text Usage**
- ❌ NEVER use `bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent` manually
- ✅ ALWAYS use the `.gradient-text` utility class for gradient text
- Why: Tailwind v4 handles background opacity differently; manual patterns cause invisible text
- The `.gradient-text` utility includes `!important` flags, browser fallbacks, and animation

```html
<!-- ❌ FORBIDDEN - Becomes transparent/invisible -->
<h1 class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
  Invisible Text
</h1>

<!-- ✅ CORRECT - Always visible with gradient animation -->
<h1 class="gradient-text">
  Beautiful Gradient Text
</h1>
```

**Transparency Prevention (Site-Wide)**
- All modals, dialogs, popovers, and UI components have transparency fixes in `global.css`
- 14 categories of fixes prevent transparent backgrounds (see `/web/TRANSPARENCY-FIXES.md`)
- Never override these fixes with inline styles or `!important` background: transparent
- If adding new modal/dialog components, they inherit fixes automatically via CSS selectors

**Color System**
- Use HSL format only: `hsl(var(--color-background))`
- Define colors in `@theme` blocks with `--color-*` pattern
- No OKLCH, no arbitrary color values
- All semantic colors auto-support dark mode

## Testing Guidelines
Co-locate new specs beside the feature or in the relevant `test/` subtree, naming them `<feature>.test.ts` or `.spec.ts`. Use helpers in `web/test/auth/utils.ts` for deterministic auth flows. Capture a failing test before fixing a regression and run the auth suite when touching login, signup, or mandate logic.

## Commit & Pull Request Guidelines
Use conventional commits (`feat(scope): summary`, `fix`, `chore`). Keep diffs focused, capture migrations or policy updates in `one/`, and list validation (`bunx astro check`, lint, targeted tests`) in each PR. Link to ontology items or issues, include UI evidence when visuals change, and request reviews from the owning domain.

## Security & Configuration Tips
Never commit secrets; keep Better Auth and Convex credentials in local `.env` files. Record integrations in `one/connections/` and keep protocol data inside `properties` or `metadata`. Before any deploy or release command, run `bun --cwd web run build` and follow `.claude/agents/agent-ops.md` for approvals.
