---
name: astro
description: Create high-performance Astro 5 pages with React 19 islands, SSR data fetching, and optimal hydration strategies
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Astro 5 Development

Build server-rendered pages with strategic client-side interactivity using Astro 5's islands architecture.

## When to Use This Skill

- Create new pages in `src/pages/`
- Build Astro components in `src/components/`
- Configure React islands with hydration directives
- Set up SSR data fetching
- Optimize for Core Web Vitals

## Core Architecture

```
Astro Page (SSR) → Static HTML
  ↓
React Islands (Strategic) → Interactivity where needed
  ↓
Client Hydration → Progressive enhancement
```

## Page Structure

```astro
---
// src/pages/example.astro
import Layout from "@/layouts/Layout.astro";
import InteractiveWidget from "@/components/InteractiveWidget";

// SSR: Runs at build/request time
const data = await fetchData();

// Pass data to page
const { title, items } = data;
---

<Layout title={title}>
  <!-- Static content (no JS) -->
  <h1>{title}</h1>
  <ul>
    {items.map(item => <li>{item.name}</li>)}
  </ul>

  <!-- React island (JS only for this component) -->
  <InteractiveWidget client:load data={items} />
</Layout>
```

## Client Directives

Choose the right hydration strategy:

```astro
client:load       → Hydrate immediately (above fold, critical)
client:idle       → Hydrate when browser idle (non-critical)
client:visible    → Hydrate when scrolled into view (below fold)
client:media="(min-width: 768px)"  → Hydrate on media query
client:only="react"  → Client-only, skip SSR
```

### Best Practices

```astro
<!-- Critical interactive UI -->
<AgentWorkspace client:load />

<!-- Below-fold, non-critical -->
<EnvelopeTimeline client:visible />

<!-- Resource-heavy, can wait -->
<FlowVisualization client:idle />

<!-- Desktop-only feature -->
<AdvancedDebugger client:media="(min-width: 1024px)" />
```

## Project-Specific Patterns

### Layout

```astro
---
// src/layouts/Layout.astro
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-[#0a0a0f] text-white antialiased">
    <slot />
  </body>
</html>
<style is:global>
  @import "../styles/global.css";
</style>
```

### Main Page Pattern

```astro
---
// src/pages/index.astro
import Layout from "@/layouts/Layout.astro";
import AgentWorkspace from "@/components/workspace/AgentWorkspace";
---
<Layout title="Envelope System">
  <AgentWorkspace client:load />
</Layout>
```

### Adding New Pages

```astro
---
// src/pages/visualise.astro
import Layout from "@/layouts/Layout.astro";
import FlowCanvas from "@/components/flow/FlowCanvas";
---
<Layout title="Envelope Flow">
  <FlowCanvas client:load />
</Layout>
```

## Dynamic Routes

```
src/pages/
  agents/[id].astro     → /agents/agent-a, /agents/agent-b
  envelopes/[...path].astro  → Catch-all route
```

```astro
---
// src/pages/agents/[id].astro
import Layout from "@/layouts/Layout.astro";

const { id } = Astro.params;

// Validate agent exists
const validAgents = ['agent-a', 'agent-b', 'agent-c'];
if (!validAgents.includes(id || '')) {
  return Astro.redirect('/404');
}
---
<Layout title={`Agent: ${id}`}>
  <h1>Agent {id}</h1>
</Layout>
```

## API Routes

```typescript
// src/pages/api/runtime.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Return runtime state as JSON
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  // Handle envelope submission
  return new Response(JSON.stringify({ received: true }));
};
```

## Configuration

```javascript
// astro.config.mjs
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
  },
});
```

## Performance Tips

1. **Default to static**: Only add `client:*` where needed
2. **Lazy load below fold**: Use `client:visible` for content below the viewport
3. **Defer non-critical**: Use `client:idle` for widgets that can wait
4. **Minimize islands**: Group interactive elements into fewer islands
5. **Use Astro components**: For static content, prefer `.astro` over `.tsx`

## File Locations

| Type | Location |
|------|----------|
| Pages | `src/pages/*.astro` |
| Layouts | `src/layouts/*.astro` |
| Components | `src/components/**/*.tsx` |
| Styles | `src/styles/global.css` |
| Config | `astro.config.mjs` |

## Commands

```bash
# Development
bun dev

# Build
bun run build

# Preview
bun preview
```

## Common Tasks

### Add new page

1. Create `src/pages/pagename.astro`
2. Import Layout and components
3. Add any React islands with appropriate `client:*` directive

### Add Astro component

1. Create `src/components/ComponentName.astro`
2. Define Props interface in frontmatter
3. Use in pages or other Astro components

### Convert static to interactive

1. Create React component in `src/components/`
2. Import in Astro page
3. Add `client:load` or appropriate directive

---

**Version**: 1.0.0
**Tech**: Astro 5.14, React 19.1
