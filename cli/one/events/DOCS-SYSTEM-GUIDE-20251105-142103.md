# Documentation System Guide

## File Structure

```
web/src/
├── pages/
│   └── docs/
│       ├── index.astro              # Hub page (all 5 views)
│       └── [...slug].astro          # Individual doc pages
│
├── layouts/
│   └── DocsDetail.astro             # Doc layout (simplified, no chat)
│
├── components/
│   └── docs/
│       ├── CodeBlock.tsx            # Code blocks with copy button
│       ├── DocCompact.tsx           # Table-like view
│       ├── DocFilterResults.tsx     # Show active filters
│       ├── DocFolderNav.tsx         # Folder navigation
│       ├── DocGrid.tsx              # Grid views (2, 3, 4 columns)
│       ├── DocList.tsx              # List view
│       ├── DocSearch.tsx            # Search input
│       └── DocViewToggle.tsx        # View mode switcher
│
├── content/
│   ├── config.ts                    # Schema definitions (updated)
│   └── docs/
│       ├── getting-started/
│       │   ├── introduction.md
│       │   └── quick-start.md
│       └── core-concepts/
│           └── ontology.md
│
└── styles/
    └── global.css                   # No changes needed
```

## How It Works

### 1. User visits `/docs`

The `index.astro` page:
1. Fetches all docs via `getCollection('docs')`
2. Groups them by folder
3. Filters by search/tag/folder params
4. Renders appropriate view mode
5. Includes interactive islands (search, toggle)

### 2. View Modes

User clicks view toggle icons to switch modes:
- **List** - One per line, full details
- **Compact** - Minimal info, table-like
- **Grid 2x** - Two columns
- **Grid 3x** - Three columns
- **Grid 4x** - Just titles

Each is a separate component that gets the same filtered docs array.

### 3. Search & Filter

User types in search → filters docs in real-time (client-side)
Searches across: title, description, section, tags

User clicks tag badge → filters by that tag only
User clicks folder badge → shows only that folder

URL updates with params: `?search=...&tag=...&view=...`

### 4. Detail Page

Click any doc → routes to `docs/[folder]/[slug].astro`

The `[...slug].astro` page:
1. Gets entry from content collection
2. Renders with `DocsDetail` layout
3. Markdown automatically compiled to HTML
4. Code blocks get syntax highlighting

## Adding New Documentation

### Create a New Doc

1. **Create folder** (or use existing):
```bash
mkdir -p web/src/content/docs/my-section/
```

2. **Create markdown file**:
```bash
touch web/src/content/docs/my-section/my-doc.md
```

3. **Add frontmatter**:
```markdown
---
title: My Document Title
description: A brief one-line description
section: My Section
order: 1
tags:
  - tag1
  - tag2
  - tag3
---

# Document Title

Your content here in markdown...

## Subsection

More content...
```

4. **Build and test**:
```bash
cd web
bun run build  # Generate static pages
```

5. **View at**: `http://localhost:4321/docs/my-section/my-doc/`

### Frontmatter Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | Document title |
| `description` | string | ✅ | Brief description for search/listing |
| `section` | string | ❌ | Used for grouping in hub, shows in navigation |
| `order` | number | ❌ | Display order within section (default: 0) |
| `tags` | string[] | ❌ | For filtering (click badges to filter) |
| `date` | date | ❌ | Publication date (optional) |
| `draft` | boolean | ❌ | If true, doc is hidden |

### Markdown Features

All standard markdown is supported:

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold** and *italic*

- List item 1
- List item 2
  - Nested item

1. Numbered 1
2. Numbered 2

[Link text](url)

> Blockquote
> Multiple lines

```
Code block with language
```

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

## Folder Organization

Create logical folders for your docs:

```
docs/
├── getting-started/        # 🚀 New user setup
├── core-concepts/         # 🏗️ Architecture & patterns
├── api-reference/         # 📖 API documentation
├── tutorials/             # 📚 Step-by-step guides
├── advanced/              # ⚡ Complex topics
└── troubleshooting/       # ℹ️ Common issues & FAQs
```

Folder icons are automatically assigned by name:
- `getting-started` → 🚀
- `core-concepts` → 🏗️
- `advanced` or `ai-sdk` → ⚡
- `tutorials` → 📚
- `troubleshooting` → ℹ️
- anything else → 📁

## Customization

### Changing Colors

Edit `/web/src/styles/global.css`:

```css
@theme {
  --color-primary: 222.2 47.4% 11.2%;  /* Primary accent color */
  --color-muted: 210 40% 96.1%;        /* Background for code, etc */
}

.dark {
  --color-primary: 210 40% 98%;
  --color-muted: 222.2 84% 4.9%;
}
```

### Changing Folder Icons

Edit `/web/src/components/docs/DocFolderNav.tsx`:

```typescript
const getFolderIcon = (folder: string) => {
  switch (folder.toLowerCase()) {
    case 'my-folder':
      return MyIcon;  // Import and use your icon
    // ...
  }
};
```

### Changing View Mode Default

Edit `/web/src/pages/docs/index.astro` line 24:

```typescript
const viewMode = (Astro.url.searchParams.get("view") || "grid3") as
```

Change `"list"` to any: `"compact"` | `"grid2"` | `"grid3"` | `"grid4"`

### Changing Number of Tags Shown

Edit `/web/src/components/docs/DocList.tsx` line 51:

```typescript
entry.data.tags.slice(0, 6)  // Show 6 tags instead of 4
```

## Performance

### Build-Time
- Content synced and types generated at build time
- Markdown compiled to HTML at build time
- No runtime markdown parsing

### Runtime
- Hub page: Pure HTML (no JS for core display)
- Search: Client-side filtering (fast)
- View toggle: URL navigation (no state)

### Result
- Instant page loads (static HTML)
- Perfect SEO scores
- No build-time limits
- Works offline

## Deployment

### To Cloudflare Pages

1. Commit your changes:
```bash
git add .
git commit -m "Add documentation"
```

2. Push to GitHub:
```bash
git push
```

3. Cloudflare automatically builds and deploys

### Pre-built at Deploy Time
- All docs pages generated as static HTML
- No backend required
- Search works client-side
- Fully cached at edge

## Advanced Usage

### Adding Custom Components to Docs

Put React components in `src/components/docs/`:

```typescript
// src/components/docs/Alert.tsx
export function Alert({ type, children }) {
  return (
    <div className={`alert alert-${type}`}>
      {children}
    </div>
  );
}
```

Import in markdown (after converting to MDX):

```mdx
import { Alert } from '@/components/docs/Alert';

<Alert type="warning">
  This is an important warning!
</Alert>
```

### Linking Between Docs

Use relative or absolute paths:

```markdown
[Read the Quick Start](/docs/getting-started/quick-start/)

[See the ontology](../core-concepts/ontology/)
```

### Embedding Code Examples

Create a `code-examples/` folder and reference:

```bash
mkdir -p web/src/content/docs/examples/
cat > web/src/content/docs/examples/hello-world.ts << 'EOF'
console.log("Hello, world!");
EOF
```

Then in your doc:

````markdown
```typescript
console.log("Hello, world!");
```
````

## Migration from oneieold

If migrating from the old docs system:

1. **Copy markdown files**:
```bash
cp -r ../apps/oneieold/src/content/docs/* \
      web/src/content/docs/
```

2. **Update frontmatter** to match new schema:
```markdown
---
title: Document Title          # Was: title
description: One-line summary  # Add this (required)
section: Getting Started       # Was: section (optional but recommended)
order: 1                       # Was: order (optional)
tags: [tag1, tag2]            # Was: tags (optional)
---
```

3. **Remove old fields**:
- `draft: true` → omit or use `draft: true`
- `date:` → can keep or remove
- Custom fields → move to section/tags or remove

4. **Test**:
```bash
cd web
bun run build
bun run preview  # Test locally before pushing
```

## Troubleshooting

### Docs not showing up

1. Check file location: `web/src/content/docs/[folder]/[name].md`
2. Check frontmatter is valid YAML
3. Check `title` and `description` are present
4. Run: `bunx astro sync` to regenerate types

### Search not working

1. Check tags are strings in array: `tags: ["tag1", "tag2"]`
2. Ensure title/description have content
3. Try clearing `.astro/` folder: `rm -rf web/.astro`

### Build failing

1. Check YAML frontmatter syntax
2. Validate markdown links exist
3. Run type check: `bunx astro check`

### View mode not changing

1. Check URL params are being passed: `?view=grid3`
2. Clear browser cache
3. Check browser console for errors

## Future Enhancements

These could be added later:

- **Search**: Full-text indexing with Algolia/Meilisearch
- **Versioning**: Multiple doc versions
- **Analytics**: Track popular docs
- **Comments**: User discussions per doc
- **Real-time collaboration**: Edit docs together
- **Translations**: Multi-language docs
- **Custom domains**: Separate docs subdomains

## API Reference

### `getCollection('docs')`

Fetch all docs (runs at build time):

```typescript
import { getCollection } from 'astro:content';

const docs = await getCollection('docs');
// Returns: CollectionEntry<'docs'>[]
```

Each entry has:

```typescript
{
  id: string,           // Folder/file
  slug: string,         // "getting-started/quick-start"
  collection: "docs",
  data: {               // Frontmatter
    title: string,
    description: string,
    section?: string,
    order?: number,
    tags?: string[],
    date?: Date,
    draft?: boolean
  },
  body: string,         // Raw markdown
  render(): Promise<{   // Compiled HTML
    Content: Component,
    headings: Heading[],
    remarkPluginFrontmatter: any
  }>
}
```

## Support

For questions:
1. Check `/docs` on your running instance
2. Read CLAUDE.md in root directory
3. Check `/one/knowledge/` documentation
4. File an issue on GitHub

---

**Happy documenting!**
