# Documentation System

## Overview

The ONE Platform documentation system is built with **Astro + React + TypeScript** and provides a beautiful, searchable, multi-view documentation experience powered by the 6-dimension ontology.

The system lives in `web/src/` and imports proven patterns from the existing documentation site at `/Users/toc/Server/ONE/apps/oneieold/src/pages/docs/`.

## Architecture

### Directory Structure

```
web/src/
├── content/
│   └── docs/              # Documentation content (Markdown/MDX)
│       └── [folder]/      # Organized by category
│           └── [slug].md  # Individual doc files
├── pages/
│   └── docs/
│       ├── index.astro    # Documentation hub (all docs view)
│       └── [...slug].astro # Individual doc page
├── components/
│   └── docs/              # Documentation-specific components
│       ├── CodeBlock.tsx   # Code highlighting with copy button
│       ├── DocNav.tsx      # Sidebar navigation
│       ├── DocHeader.tsx   # Page header with metadata
│       └── DocSearch.tsx   # Search functionality
└── layouts/
    └── Docs.astro         # Documentation page layout
```

### Content Schema

Documentation follows the **Docs Schema** defined in `src/content/config.ts`:

```typescript
const DocsSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  section: z.string().optional(),      // Doc category/folder
  order: z.number().optional(),         // Sort order within section
  tags: z.array(z.string()).optional(), // Searchable tags
  date: z.date().or(z.string()).optional(),
  status: z.enum(['draft', 'public', 'private']).default('draft'),
  image: z.string().optional(),
  tabs: z.array(TabSchema).optional(),   // Tabbed content
});
```

## Key Features

### 1. Multi-View Display Modes

Users can switch between different viewing modes seamlessly:

- **List View** (default) - Compact, description-focused
- **Compact View** - Table-like format with quick scanning
- **Grid 2-Column** - Side-by-side cards with descriptions
- **Grid 3-Column** - Medium-sized card layout
- **Grid 4-Column** - Small card view (titles only)

Each view mode preserves search/filter context via URL parameters.

### 2. Search & Filtering

#### Full-Text Search
```
GET /docs?search=query
```
Searches across:
- Document titles
- Descriptions
- Section names
- Tags

#### Tag Filtering
```
GET /docs?tag=ontology
GET /docs?tag=backend
```
Filter docs by one or more tags.

#### Folder Filtering
```
GET /docs?folder=getting-started
GET /docs?folder=core-concepts
```
Show all docs in a specific category.

#### Combined Filtering
Parameters stack together:
```
GET /docs?search=api&tag=backend&view=grid2
```

### 3. Folder Navigation

Automatic sidebar with icons based on folder names:

```
Getting Started    → 🚀 RocketIcon
Core Concepts      → 📚 LayersIcon
Advanced           → ⚡ LightningBoltIcon
Tutorials          → 📖 BookText
Troubleshooting    → ℹ️ InfoCircledIcon
```

Folder counters show number of docs per category.

### 4. Smart Tagging System

Every doc supports multiple tags for discovery:

```yaml
---
title: Building with Astro
tags:
  - frontend
  - astro
  - components
  - react
---
```

Tags are clickable and filter docs instantly.

### 5. Code Components

#### Code Blocks with Copy Button
```tsx
import { CodeBlock } from '@/components/docs/CodeBlock';

<CodeBlock language="typescript" filename="schema.ts">
  {`const schema = z.object({
    name: z.string()
  });`}
</CodeBlock>
```

Features:
- Syntax highlighting (Shiki)
- Copy-to-clipboard button
- Language/filename labels
- Line numbers (optional)
- Theme support (light/dark)

#### Example Component
```tsx
import { Example } from '@/components/docs/Example';

<Example title="Creating a Document">
  <CodeBlock language="markdown">
    {`---
title: My Document
tags: [example, tutorial]
---

Content goes here...`}
  </CodeBlock>
  <p>This creates a new document.</p>
</Example>
```

### 6. Interactive Elements

#### Tabs for Variant Documentation
```markdown
---
title: Installation Guide
tabs:
  - label: npm
    value: npm
    content: |
      npm install @one-platform/sdk
  - label: pnpm
    value: pnpm
    content: |
      pnpm add @one-platform/sdk
  - label: yarn
    value: yarn
    content: |
      yarn add @one-platform/sdk
---
```

#### Alerts & Callouts
```tsx
import { Alert } from '@/components/ui/alert';

<Alert type="tip">
  Pro tip: Use search to find related docs quickly!
</Alert>

<Alert type="warning">
  Breaking change in v2.0.0
</Alert>
```

## Search & Discovery

### AI-Powered Search Assistant

Each docs page includes an AI chat assistant configured via frontmatter:

```yaml
---
title: API Reference
chatConfig:
  systemPrompt:
    - type: text
      text: |
        You are an API expert. Help users understand the API documentation.
        Focus on:
        - Explaining endpoints and parameters
        - Providing code examples
        - Suggesting related documentation
  welcome:
    message: "👋 Ask me about the API!"
    avatar: "/icon.svg"
    suggestions:
      - label: "📚 List endpoints"
        prompt: "What endpoints are available?"
      - label: "🔐 Authentication"
        prompt: "How do I authenticate requests?"
---
```

### Pagefind Full-Text Search

Client-side search powered by Pagefind:
- Zero-config full-text indexing
- Instant search as-you-type
- No external API required
- Version switching support

## UI Components Used

All components from **shadcn/ui** for consistency:

### Common Components
- `Card` - Container for doc entries
- `Badge` - Tag display and filters
- `Input` - Search field
- `Button` - Actions (copy, view, etc.)

### Icons
- **Radix Icons** - Folder, section, status icons
- **Lucide Icons** - View mode toggles, UI elements

### Styling
- **Tailwind CSS v4** - Utility classes
- **HSL Color Variables** - Theme support
- **Gradient Backgrounds** - Visual polish

## Development Workflow

### 1. Create a Documentation File

Create in `web/src/content/docs/[section]/[slug].md`:

```markdown
---
title: Getting Started with Astro
description: Learn how to build your first Astro project
section: getting-started
order: 1
tags:
  - astro
  - frontend
  - beginner
---

# Getting Started with Astro

## Installation

\`\`\`bash
npm create astro@latest my-project
\`\`\`

## Create a Component

\`\`\`tsx
export default function Hello() {
  return <h1>Hello World!</h1>;
}
\`\`\`
```

### 2. View the Documentation Hub

Navigate to `http://localhost:4321/docs` to see all docs:
- Organized by folder/section
- Searchable and filterable
- Multiple view modes available

### 3. View Individual Docs

Navigate to `http://localhost:4321/docs/[section]/[slug]` to see a single doc:
- Full content with syntax highlighting
- AI assistant sidebar
- Related docs suggestions
- Navigation to next/prev docs

## Organizing Content

### Folder Structure Best Practices

```
src/content/docs/
├── getting-started/      # For beginners
│   ├── installation.md
│   ├── first-project.md
│   └── hello-world.md
├── core-concepts/        # Fundamental ideas
│   ├── ontology.md
│   ├── architecture.md
│   └── data-model.md
├── frontend/             # Frontend-specific
│   ├── components.md
│   ├── styling.md
│   └── routing.md
├── backend/              # Backend-specific
│   ├── convex.md
│   ├── queries.md
│   └── mutations.md
├── tutorials/            # Step-by-step guides
│   ├── build-blog.md
│   ├── auth-flow.md
│   └── deploy.md
└── troubleshooting/      # Problem solving
    ├── common-errors.md
    ├── performance.md
    └── debugging.md
```

### Metadata Best Practices

Always include in frontmatter:

```yaml
---
title: Clear, descriptive title
description: One-line summary for search results
section: folder-name
order: 1
tags:
  - primary-topic
  - secondary-topic
  - use-case
status: public
---
```

**Tags should be:**
- Lowercase with hyphens
- Consistent across docs
- Searchable (users will search for them)
- Limited to 3-5 tags per doc

## Code Examples & Patterns

### 1. Inline Code
Use backticks for short code references:
```
Use `const x = 1;` for variable declarations.
```

### 2. Code Blocks with Language
````markdown
```typescript
const schema = z.object({
  name: z.string()
});
```
````

### 3. Code Blocks with Copy Button
```tsx
<CodeBlock language="typescript" filename="schema.ts" showLineNumbers>
  {`const schema = z.object({
    name: z.string(),
    age: z.number()
  });`}
</CodeBlock>
```

### 4. Tabbed Code Examples
For multiple language options:

```yaml
---
title: Installation
tabs:
  - label: TypeScript
    value: ts
    content: |
      ```typescript
      import { ONE } from '@one-platform/sdk';
      ```
  - label: JavaScript
    value: js
    content: |
      ```javascript
      const { ONE } = require('@one-platform/sdk');
      ```
---
```

## Theme Support

### Light Mode
```css
--color-background: 0 0% 100%;
--color-foreground: 222.2 84% 4.9%;
--color-primary: 222.2 47.4% 11.2%;
```

### Dark Mode
```css
.dark {
  --color-background: 222.2 84% 4.9%;
  --color-foreground: 210 40% 98%;
  --color-primary: 212.7 26.8% 83.9%;
}
```

All colors use HSL format for easy customization.

## Performance Considerations

### Astro Static Generation
- All docs are pre-rendered at build time
- No runtime compilation needed
- Fast page loads
- SEO-friendly

### Client-Side Features
- View mode toggling is instant (client-side)
- Search is powered by Pagefind (pre-indexed)
- Interactive components use `client:idle` or `client:visible`

### Optimization Patterns
```astro
---
// Server-side: Get all docs
const docs = await getCollection('docs');
---

<!-- Static HTML: Docs list -->
<DocsList docs={docs} />

<!-- Client-side: Interactive features -->
<SearchBox client:idle />
<ViewModeToggle client:idle />
```

## Integration with 6-Dimension Ontology

Documentation maps to ontology dimensions:

**1. Groups** (Organization)
- Multiple doc folders per organization
- Hierarchical organization
- Shared vs. private docs

**2. People** (Authorization)
- `status: 'draft'` = private to creator
- `status: 'public'` = visible to all
- Admin-only sections

**3. Things** (Entities)
- Each doc is a "documentation" thing type
- Metadata stored in frontmatter

**4. Connections** (Relationships)
- "references" - links between docs
- "teaches" - tutorials teach concepts
- "extends" - advanced docs extend basics

**5. Events** (Audit Trail)
- Doc creation events
- Modification events
- View analytics

**6. Knowledge** (Search & AI)
- Embeddings for semantic search
- Tags and labels
- AI assistant context

## Customization

### Adding Custom Components

Create in `web/src/components/docs/`:

```tsx
// CustomComponent.tsx
export function CustomComponent({ children }) {
  return (
    <div className="p-4 bg-primary/5 rounded-lg">
      {children}
    </div>
  );
}
```

Import in markdown via MDX:

```mdx
import { CustomComponent } from '@/components/docs/CustomComponent';

<CustomComponent>
  This is custom content!
</CustomComponent>
```

### Modifying the Layout

Edit `web/src/layouts/Docs.astro`:

```astro
---
import { BaseLayout } from '@/layouts/BaseLayout.astro';
import { DocSidebar } from '@/components/docs/DocSidebar';
import { DocHeader } from '@/components/docs/DocHeader';

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<BaseLayout title={title}>
  <div class="grid grid-cols-[250px_1fr] gap-4">
    <DocSidebar client:load />
    <main>
      <DocHeader title={title} description={description} />
      <slot />
    </main>
  </div>
</BaseLayout>
```

## Deployment

### Build
```bash
cd web/
bun run build
```

### Deploy to Cloudflare Pages
```bash
wrangler pages deploy dist
```

### Deploy to Vercel
```bash
vercel deploy
```

### GitHub Pages
```bash
npm run build
npm run deploy
```

## Troubleshooting

### Docs not showing up?
1. Check file is in `src/content/docs/`
2. Run `bunx astro sync` to regenerate types
3. Verify `status: 'public'` in frontmatter

### Search not working?
1. Clear cache: `rm -rf .astro`
2. Rebuild: `bun run build`
3. Check Pagefind is installed

### Styling issues?
1. Verify Tailwind CSS is installed
2. Check custom colors in `@theme` block
3. Use `className` (not `class`) in React components

## Best Practices

✅ **DO:**
- Keep docs organized in logical folders
- Use consistent tag naming
- Include code examples for every feature
- Keep descriptions short and scannable
- Update docs when code changes

❌ **DON'T:**
- Mix multiple topics in one doc
- Use vague or redundant titles
- Leave empty sections
- Forget to set `status: 'public'`
- Hard-code version numbers (use variables)

## Future Enhancements

Planned features:

- [ ] Version switching (v1, v2, v3)
- [ ] Multilingual docs (EN, FR, ES, ZH)
- [ ] API reference auto-generation
- [ ] Analytics (most-viewed docs)
- [ ] AI-powered doc generation
- [ ] Offline docs (PWA)
- [ ] Interactive code sandbox
- [ ] Video tutorials embedded

## Related Documentation

- **Astro Documentation:** https://docs.astro.build
- **Content Collections:** `one/knowledge/ontology.md`
- **Architecture:** `one/knowledge/architecture.md`
- **Frontend Patterns:** `one/knowledge/patterns/frontend/`

---

**Built for clarity, simplicity, and infinite scale.**
