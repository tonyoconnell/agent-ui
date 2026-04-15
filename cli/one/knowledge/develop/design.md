# Design

The ONE Design System is the living foundation for how we build beautiful, accessible, and performant experiences. Every surface—from marketing to dashboards—reflects these principles.

## DNA

Three principles guide every layout, component, and interaction across the platform:

### Clarity
Layouts start with measured whitespace, bold hierarchy, and predictable grid alignment. Structure before decoration.

- Measured whitespace creates breathing room
- Visual hierarchy drives scannability
- Grid-based alignment creates confidence

### Velocity
Reusable tokens, components, and documentation make shipping fast without sacrificing polish. Decide once, reuse everywhere.

- Token-first thinking (colors, spacing, typography)
- Component library powers iteration
- Documentation prevents reinvention

### Inclusive
Accessibility, contrast, and motion preferences are first-class constraints—not afterthoughts. Comfort for every user.

- WCAG 2.1 AA compliance non-negotiable
- Motion respects prefers-reduced-motion
- Color never carries meaning alone

## Design Tokens

Tokens are the atomic currency of the system. Update them once to propagate across the product, web, and brand experiences.

### Color Tokens (HSL Format)

**Semantic Tokens:**

| Token | Value | Label |
|-------|-------|-------|
| `--primary` | `216 55% 25%` | Deep navy · Primary actions |
| `--primary-foreground` | `36 8% 96%` | Warm light foreground |
| `--secondary` | `219 14% 28%` | Graphite · Secondary surfaces |
| `--accent` | `105 22% 25%` | Leaf · Positive accent |
| `--muted` | `36 8% 88%` | Stone · Neutral backdrop |

**Why HSL?** Device-independent, intuitive adjustments (hue, saturation, lightness), superior to hex or RGB for system design.

### Color Modes

**Light Surfaces** (bright, optimistic, generous contrast)
- Background: `36 8% 88%` — Warm stone canvas
- Card: `0 0% 100%` — Paper surfaces
- Muted: `219 14% 92%` — Soft graphite panels
- Border: `219 14% 70%` — Weathered outlines

**Dark Surfaces** (low-glare, high-contrast, accent highlights)
- Background: `0 0% 13%` — Ink backdrop
- Card: `219 14% 20%` — Graphite layers
- Muted: `216 63% 17%` — Slate overlays
- Border: `216 40% 32%` — Dim outlines

### Typography Scale

**Inter typeface with fluid sizing using clamp():**

| Name | Size | Line Height | Tailwind | Usage |
|------|------|-------------|----------|-------|
| Display | 56px / 3.5rem | 1.1 | `text-5xl md:text-6xl` | Hero statements |
| Headline | 40px / 2.5rem | 1.2 | `text-4xl` | Section titles |
| Title | 28px / 1.75rem | 1.3 | `text-2xl` | Card titles |
| Subtitle | 20px / 1.25rem | 1.5 | `text-xl` | Supporting copy |
| Body | 16px / 1rem | 1.7 | `text-base leading-7` | Paragraphs |
| Caption | 14px / 0.875rem | 1.6 | `text-sm` | Metadata & labels |

**Best Practices:**
- Use `max-w-prose` for copy blocks
- Headlines use `leading-tight`, body copy uses `leading-7`
- Increase letter-spacing for uppercase
- Mix weight sparingly: bold for emphasis, medium for labels, regular for reading
- Always include smart quotes, en/em dashes, proper apostrophes

### Spacing Scale (4px Grid)

Scale is rooted in 4px increments. Combine tokens to create rhythm and intentional whitespace.

| Token | Pixels | Rem | Usage |
|-------|--------|-----|-------|
| space-2 | 8px | 0.5rem | Dense clusters |
| space-3 | 12px | 0.75rem | Component gaps |
| space-4 | 16px | 1rem | Default padding |
| space-6 | 24px | 1.5rem | Card gutters |
| space-8 | 32px | 2rem | Section rhythm |
| space-12 | 48px | 3rem | Hero whitespace |

### Border Radius

Radii communicate intent. Smaller radius for utility, larger for immersive storytelling.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Pills & badges |
| `--radius-sm` | 6px | Inputs & controls |
| `--radius-md` | 12px | Cards |
| `--radius-lg` | 24px | Modals & hero surfaces |
| `--radius-full` | 9999px | Circular avatars |

### Elevation (Depth with Shadows)

Elevation pairs drop shadows with subtle borders to reinforce spatial hierarchy.

| Token | Value | Usage |
|-------|-------|-------|
| shadow-sm | `0 1px 2px 0 hsl(219 14% 28% / 0.15)` | Inputs & lists |
| shadow-md | `0 14px 32px -18px hsl(216 55% 25% / 0.32)` | Prominent cards |
| shadow-lg | `0 40px 80px -30px hsl(216 63% 17% / 0.45)` | Dialogs & overlays |

### Motion Tokens

Motion reinforces meaning. Keep transitions under 320ms and ease with intention.

| Name | Value | Usage |
|------|-------|-------|
| `--ease-snappy` | `cubic-bezier(0.4, 0, 0.2, 1)` | Buttons & chip interactions |
| `--ease-natural` | `cubic-bezier(0.16, 1, 0.3, 1)` | Modals & drawers |
| `--duration-rapid` | 120ms | Hover & focus |
| `--duration-base` | 200ms | Component transitions |
| `--duration-slow` | 320ms | Page transitions |

**Golden Rule:** Pair animations with motion tokens and respect `prefers-reduced-motion`. Motion should communicate spatial change, not distract.

## Layout & Spacing

Grid systems, gutters, and container rules keep experiences aligned and effortless to scan.

### Spacing Rhythm

Combine spacing tokens deliberately:
- Inside components: use space-2 through space-6
- Between sections: use space-8 through space-12

This creates predictable vertical rhythm and visual breathing room.

### Container Rules

Choose the container that matches the story density. Always align to the 12-column grid.

| Label | Specification | Usage |
|-------|---------------|-------|
| Content | max-w-3xl · 48px section padding | Articles, docs, knowledge |
| Application | max-w-5xl · 64px section padding | Dashboards & workflows |
| Wide | max-w-6xl · responsive gutters | Data dense screens |
| Fluid | full width · clamp(24px, 5vw, 80px) | Marketing & storytelling |

### Grid System

Each column aligns to 72px at desktop with 24px gutters. Collapse to two columns on tablet, one on mobile.

```
Desktop:  12 columns × 72px with 24px gutters
Tablet:   6 columns × fluid width
Mobile:   2 columns × full width with 16px margins
```

## Buttons

Action hierarchy lives or dies on buttons. Use tokens, states, and spacing consistently.

### Variants

Choose the variant that matches intent. Primary stands alone; others support workflows and contextual actions.

**Primary:** One per view. Drives the core action with the --primary token to anchor attention.

**Secondary:** Use for supportive actions that keep users in-flow. Works best in medium density areas.

**Outline:** Pair with primary for complementary navigation (e.g., "View docs"). Great on dark surfaces.

**Ghost:** Use for contextual actions within dense layouts or tables. Hover adds subtle surface tint.

### States & Best Practices

| State | Behavior |
|-------|----------|
| **Hover** | Strengthen fill by 8% (primary) or introduce 10% surface tint (outline/ghost). Preserve contrast. |
| **Focus** | Apply 2px ring in `--color-primary` with 2px offset. Never rely on box-shadow alone. |
| **Active** | Reduce elevation, darken fill by 12%, compress transition timing to <80ms for instant feedback. |
| **Disabled** | Lower opacity to 55%, remove hover styles. Use tooltips or helper text for next steps. |

### Guidelines

- Pair icon buttons with tooltips; keep hit area ≥44px
- Default spacing: 16px horizontal, 12px vertical inside button; stack buttons with 16px gap
- Never place two primary buttons side by side—use secondary or outline for supporting actions
- Primary CTA uses inverse fill: white background, primary text, primary ring for focus
- Document spacing, icon placement, and loading patterns in both Figma and code

## Component Language

Components combine tokens, layout, and interaction rules. Build new experiences by composing, not reinventing.

### Design Principles

**Atomic → Pattern → Experience**

Compose experiences from documented atoms. Never duplicate markup when a primitive exists.

**Statefulness Baked In**

Every component ships with hover, focus, active, loading, and disabled states out of the box.

**Content-Aware Layouts**

Components adapt to variable content through flexible spacing, min/max widths, and responsive typography.

### Living Examples

Ship with defaults: size, density, icon placement, and states. Extend via props and slots. If structure diverges, create a new primitive and document it.

**50+ pre-installed shadcn/ui components** available:
- Card, Button, Badge, Avatar
- Input, Label, Select, Textarea
- Dialog, Drawer, Popover, Tooltip
- Tabs, Accordion, Collapse
- Alert, Toast, Progress, Skeleton
- And more...

## Interaction & Accessibility

Every interaction respects purpose, speed, and inclusivity. Design emotionally confident interfaces that everyone can use.

### Interaction Rules

**Visible Focus**

Focus states use a 2px outline with primary color and 2px offset. Never remove focus for aesthetics.

**Purposeful Motion**

Pair animations with motion tokens and respect `prefers-reduced-motion`. Motion should communicate spatial change.

**Immediate Feedback**

- Hover within 80ms
- Active within 40ms
- Show result states or loaders within 200ms

### Accessibility Checklist

**Contrast AA+**

Maintain 4.5:1 contrast for body text and 3:1 for large headings. Validate all token combinations.

**Readable Typography**

Limit line length to 60–70 characters, set body copy to leading-7, avoid center-aligned paragraphs over 3 lines.

**Motion Preferences**

Wrap transitions in `motion-safe` classes and provide alternatives like color or elevation for motion-reduced users.

**WCAG 2.1 AA Compliance**

- Complete keyboard navigation
- Semantic HTML
- ARIA labels
- Screen reader support
- Color doesn't carry meaning alone

## Implementation Playbook

Design and engineering stay in lockstep through shared tooling, documentation, and QA rituals.

### Workflow

Keep tokens and components in sync across codebases, packages, and design files.

**Step 1: Tokens as Source of Truth**

Update Tailwind config and CSS variables first. UI code must consume tokens—not hard coded values.

**Step 2: Composable Primitives**

Extend components via props and slots. If structure diverges, create a new primitive and document it here.

**Step 3: Design QA Loop**

Pair every UI change with screenshots, contrast checks, and accessibility notes before merging.

### Token Reference

**CSS Custom Properties (update in `src/styles/global.css`):**

```css
:root {
  --color-primary: 216 55% 25%;
  --color-primary-foreground: 36 8% 96%;
  --color-surface: 36 8% 88%;
  --color-accent: 105 22% 25%;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --radius-md: 12px;
  --shadow-md: 0 14px 32px -18px hsl(216 55% 25% / 0.32);
  --ease-snappy: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Tokens sync to Tailwind via `theme.extend`. Run `pnpm lint && pnpm test` before release.**

## Performance Targets

Design decisions have downstream performance impact. Optimize at every layer.

### Core Web Vitals

- **Largest Contentful Paint (LCP):** < 2.5s
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Lighthouse Performance:** ≥ 90/100

### Implementation Techniques

**Image Optimization**

Use Astro Image with webp format, lazy loading, and appropriate dimensions.

**Code Splitting**

Dynamic imports for heavy components; lazy-load features below the fold.

**Strategic Hydration**

Generate static HTML by default. Add interactivity (client:load, client:visible, etc.) only where needed.

**Critical CSS**

Inline critical styles. Astro handles automatically.

## Design QA Checklist

Before shipping ANY UI change:

- [ ] Tokens documented (colors, spacing, typography)
- [ ] All states implemented (hover, focus, active, disabled, loading)
- [ ] Contrast AA+ validated (color contrast analyzer)
- [ ] Keyboard navigation tested
- [ ] Responsive tested (mobile, tablet, desktop)
- [ ] Motion respects prefers-reduced-motion
- [ ] Screenshots added to PR description
- [ ] Accessibility notes included
- [ ] Performance benchmarks met (Lighthouse 90+)
- [ ] No hydration mismatches or layout shifts

## Related Documentation

- **Patterns:** See `one/knowledge/patterns/design/` for wireframes, component architecture, and test-driven design
- **Frontend Architecture:** Read `one/knowledge/architecture-frontend.md` for Astro + React patterns
- **Implementation Guide:** Check `web/AGENTS.md` for quick reference on Convex and shadcn/ui
- **Specifications:** Review `one/knowledge/specifications.md` for detailed requirements

## Design Governs the Experience

Ship with intention. Every commit should strengthen clarity, trust, and velocity. When in doubt, return to the tokens, principles, and checklists above—or propose updates so the system evolves together.

**The goal:** Build experiences so consistent, accessible, and performant that users never think about design. They just feel like home.
