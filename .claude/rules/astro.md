# Astro Development Rules

Apply when working with `*.astro` files.

## File Structure

- Pages go in `src/pages/`
- Layouts go in `src/layouts/`
- Astro components can go anywhere in `src/components/`

## Frontmatter

Always use TypeScript in frontmatter:

```astro
---
// Good
interface Props {
  title: string;
}
const { title } = Astro.props;

// Bad - no types
const { title } = Astro.props;
---
```

## Client Directives

Choose the right hydration:

| Directive | Use When |
|-----------|----------|
| `client:load` | Critical, above-fold interactive UI |
| `client:visible` | Below-fold content |
| `client:idle` | Non-critical widgets |
| `client:only="react"` | Client-only, no SSR needed |

## Imports

Use path aliases:

```astro
---
// Good
import Layout from "@/layouts/Layout.astro";
import AgentCard from "@/components/agents/AgentCard";

// Bad
import Layout from "../../../layouts/Layout.astro";
---
```

## React Islands

Only add `client:*` when interactivity is needed:

```astro
<!-- Static - no JS -->
<AgentCard agent={agent} />

<!-- Interactive - needs JS -->
<AgentCard client:load agent={agent} onClick={handleClick} />
```

## Styles

Use Tailwind classes directly or scoped styles:

```astro
<style>
  /* Scoped to this component */
  .container { ... }
</style>

<style is:global>
  /* Global styles - use sparingly */
</style>
```
