# Design System

**Version:** 1.0.0
**Category:** Thing Specification
**Dimension:** Things
**Status:** Active
**Last Updated:** 2025-11-16

---

## Overview

ONE Platform's design system is built on **6 extractable color tokens** that create beautiful, consistent components across the entire platform. Every card, button, and component maps to these 6 tokens.

**Key Innovation:** Same structure, infinite brands. The default 6 colors work universally, but you **can optionally** extract 6 colors from any website for thing-level branding when needed.

**Default is beautiful.** Most things use the platform defaults. Custom colors are optional for specific branding needs.

---

## The 6 Color Tokens + Design Properties

Every visual aspect of the platform is defined by these design tokens. Extract 6 colors from any website, apply universally.

### Complete Design System

| Property | Values | Light Mode | Dark Mode | Purpose |
|----------|--------|------------|-----------|---------|
| **background** | HSL color | `0 0% 93%` (gray) | `0 0% 10%` (dark gray) | Card surface, sidebar, page background |
| **foreground** | HSL color | `0 0% 100%` (white) | `0 0% 13%` (dark) | Content area inside cards, elevated surfaces |
| **font** | HSL color | `0 0% 13%` (dark) | `0 0% 100%` (white) | All text, icons, readable in both modes |
| **primary** | HSL color | `216 55% 25%` (blue) | `216 55% 25%` | Main CTA buttons, links, active states |
| **secondary** | HSL color | `219 14% 28%` (gray-blue) | `219 14% 28%` | Supporting actions, secondary buttons |
| **tertiary** | HSL color | `105 22% 25%` (green) | `105 22% 25%` | Accent highlights, success states, badges |
| **states** | Opacity + scale | hover: `opacity-90 scale-[1.02]`<br/>active: `opacity-80 scale-[0.98]`<br/>focus: `ring-2 ring-primary-dark`<br/>disabled: `opacity-50 cursor-not-allowed` | Same | Button/interactive states, consistent across all components |
| **elevation** | Shadow layers | none: `shadow-none`<br/>sm: `shadow-sm` (cards)<br/>md: `shadow-md` (dropdowns)<br/>lg: `shadow-lg` (modals)<br/>xl: `shadow-xl` (popovers) | Subtle in dark mode | Depth hierarchy, component stacking |
| **radius** | Border radius | sm: `0.375rem` (6px)<br/>md: `0.5rem` (8px) - default<br/>lg: `0.75rem` (12px)<br/>xl: `1rem` (16px)<br/>full: `9999px` (pills) | Same | Consistent corner rounding, brand personality |
| **motion** | Animation timing | instant: `duration-0`<br/>fast: `duration-150` (hovers)<br/>normal: `duration-300` (default)<br/>slow: `duration-500` (page transitions)<br/>easing: `ease-in-out` | Same | Smooth, natural interactions, never jarring |

**Color Format:** HSL values in format `H S% L%` (Hue Saturation Lightness)

**Auto-Generated Variants:** System creates color shades automatically:
- `primary-light` (10% lighter), `primary-dark` (10% darker)
- `secondary-light`, `secondary-dark`
- `tertiary-light`, `tertiary-dark`
- `ring` color (defaults to `primary-dark` for focus states)

---

## Component Architecture

Every component on the platform follows these design rules. No exceptions. No custom styling.

### Cards (Foundation of Everything)

Cards are the **primary container** for all content. Every product, course, agent, and piece of content lives in a card.

**Visual Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  Card Surface (background)                              │
│  - Uses background color (gray in light, dark in dark)  │
│  - Padding: 4px (p-1) creates the "frame"               │
│  - Shadow: shadow-sm for subtle elevation               │
│  - Radius: rounded-md (8px) for soft edges              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Content Area (foreground)                       │   │
│  │ - Uses foreground color (white/dark)            │   │
│  │ - Padding: 16px (p-4) for breathing room        │   │
│  │ - Radius: rounded-md (8px) matches outer        │   │
│  │                                                  │   │
│  │ Heading (font color)                            │   │
│  │ Description text (font color, opacity-80)       │   │
│  │                                                  │   │
│  │ [Primary Button] [Secondary Button]             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Implementation Pattern:**
```tsx
<Card className="bg-background p-1 shadow-sm rounded-md">
  <CardContent className="bg-foreground p-4 rounded-md">
    <h3 className="text-font font-semibold text-lg">Card Title</h3>
    <p className="text-font opacity-80 text-sm">Card description</p>
    <div className="flex gap-2 mt-4">
      <Button variant="primary">Main Action</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  </CardContent>
</Card>
```

**Card Variants:**
- **Default:** `shadow-sm` - Standard cards (products, courses)
- **Elevated:** `shadow-md` - Important cards (featured products)
- **Floating:** `shadow-lg` - Modal dialogs, popovers
- **Flat:** `shadow-none` - Nested cards, list items

**Spacing System:**
- Outer padding: `p-1` (4px frame)
- Inner padding: `p-4` (16px content)
- Gap between cards: `gap-4` (16px)
- Grid layouts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

### Buttons (All Actions Flow Through These)

Buttons are the **primary interaction** mechanism. Every purchase, signup, navigation, and action uses these exact variants.

**Button Variants Matrix:**

| Variant | Background | Text | Border | States | Use Case |
|---------|------------|------|--------|--------|----------|
| **primary** | `bg-primary` | White | None | hover: `opacity-90 scale-[1.02]`<br/>active: `opacity-80 scale-[0.98]`<br/>focus: `ring-2 ring-primary-dark` | Main CTA (Purchase, Start, Join Now) |
| **secondary** | `bg-secondary` | White | None | Same as primary | Supporting actions (Learn More, View Details) |
| **tertiary** | `bg-tertiary` | White | None | Same as primary | Accent actions (Special Offer, Bonus Feature) |
| **outline** | Transparent | `text-font` | `border-font` | hover: `bg-font/10` | Neutral actions (Cancel, Go Back) |
| **ghost** | Transparent | `text-font` | None | hover: `bg-font/10` | Minimal actions (Menu items, subtle links) |
| **link** | Transparent | `text-primary` | None | hover: `underline` | Text links, navigation |

**Size Scale:**
- **sm:** `h-8 px-3 text-xs` - Compact buttons (table actions, inline controls)
- **md:** `h-10 px-4 text-sm` - Default size (most buttons)
- **lg:** `h-12 px-6 text-base` - Prominent CTAs (main purchase buttons)
- **xl:** `h-14 px-8 text-lg` - Hero CTAs (landing page actions)
- **icon:** `h-10 w-10` - Square icon buttons (no padding)

**Implementation Pattern:**
```tsx
// Primary CTA - Most important action
<Button variant="primary" size="lg">
  Purchase Now
</Button>

// Secondary - Supporting action
<Button variant="secondary" size="md">
  Learn More
</Button>

// Tertiary - Special accent
<Button variant="tertiary" size="md">
  🎁 Limited Offer
</Button>

// Outline - Neutral action
<Button variant="outline" size="md">
  Cancel
</Button>

// Ghost - Minimal action
<Button variant="ghost" size="sm">
  View Details
</Button>
```

**Button States (All Variants):**
```css
/* Default state */
button {
  transition: all 150ms ease-in-out;
  cursor: pointer;
}

/* Hover state */
button:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* Active state (clicking) */
button:active {
  opacity: 0.8;
  transform: scale(0.98);
}

/* Focus state (keyboard navigation) */
button:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: var(--primary-dark);
  ring-offset: 2px;
}

/* Disabled state */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

**Button Groups:**
```tsx
// Horizontal group
<div className="flex gap-2">
  <Button variant="primary">Save</Button>
  <Button variant="outline">Cancel</Button>
</div>

// Vertical stack
<div className="flex flex-col gap-2">
  <Button variant="primary" className="w-full">Primary Action</Button>
  <Button variant="secondary" className="w-full">Secondary Action</Button>
</div>
```

### Typography (Hierarchy Through Size + Weight)

All text uses the `font` color token. Hierarchy is established through size and weight, not color.

**Type Scale:**

| Element | Size | Weight | Line Height | Use Case |
|---------|------|--------|-------------|----------|
| **h1** | `text-4xl` (36px) | `font-bold` (700) | `leading-tight` (1.25) | Page titles, hero headings |
| **h2** | `text-3xl` (30px) | `font-bold` (700) | `leading-tight` | Section headings |
| **h3** | `text-2xl` (24px) | `font-semibold` (600) | `leading-snug` (1.375) | Card titles, subsections |
| **h4** | `text-xl` (20px) | `font-semibold` (600) | `leading-snug` | Component headings |
| **h5** | `text-lg` (18px) | `font-medium` (500) | `leading-normal` (1.5) | Small headings |
| **body** | `text-base` (16px) | `font-normal` (400) | `leading-relaxed` (1.625) | Paragraph text, default |
| **small** | `text-sm` (14px) | `font-normal` (400) | `leading-relaxed` | Descriptions, metadata |
| **xs** | `text-xs` (12px) | `font-normal` (400) | `leading-normal` | Labels, captions, fine print |

**Font Family:**
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Fira Code', 'Cascadia Code', Consolas, monospace;
}
```

**Implementation Pattern:**
```tsx
<div className="space-y-4">
  <h1 className="text-4xl font-bold text-font">Page Title</h1>
  <h2 className="text-3xl font-bold text-font">Section Heading</h2>
  <h3 className="text-2xl font-semibold text-font">Card Title</h3>
  <p className="text-base text-font leading-relaxed">
    Body paragraph text with comfortable reading line height.
  </p>
  <p className="text-sm text-font opacity-80">
    Secondary text with reduced opacity for hierarchy.
  </p>
</div>
```

**Text Utilities:**
```css
.text-muted     { opacity: 0.8; }   /* Secondary text */
.text-subtle    { opacity: 0.6; }   /* Tertiary text */
.text-disabled  { opacity: 0.5; }   /* Disabled text */
```

### Layout (Grid + Stack Everything)

The platform uses **CSS Grid** for layouts and **Flexbox** for components. No floats, no absolute positioning.

**Page Layout Structure:**
```tsx
<div className="min-h-screen bg-background">
  {/* Header */}
  <header className="sticky top-0 z-50 bg-foreground shadow-sm">
    <div className="container mx-auto px-4 py-4">
      {/* Navigation */}
    </div>
  </header>

  {/* Main content */}
  <main className="container mx-auto px-4 py-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Cards go here */}
    </div>
  </main>

  {/* Footer */}
  <footer className="bg-foreground mt-16 py-8">
    <div className="container mx-auto px-4">
      {/* Footer content */}
    </div>
  </footer>
</div>
```

**Grid System:**
```tsx
// 1-column (mobile)
<div className="grid grid-cols-1 gap-4">

// 2-column (tablet)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 3-column (desktop)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 4-column (wide desktop)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

// Sidebar layout
<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
  <aside>Sidebar</aside>
  <main>Content</main>
</div>
```

**Container Widths:**
```css
.container {
  max-width: 1280px;    /* Default max width */
  margin: 0 auto;       /* Center horizontally */
  padding: 0 1rem;      /* Horizontal padding */
}

/* Responsive breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Wide desktop */
2xl: 1536px /* Ultra-wide */
```

**Spacing Scale:**
```css
gap-1: 4px    /* Tight spacing */
gap-2: 8px    /* Small spacing */
gap-4: 16px   /* Default spacing */
gap-6: 24px   /* Medium spacing */
gap-8: 32px   /* Large spacing */
gap-12: 48px  /* XL spacing */
gap-16: 64px  /* XXL spacing */
```

### Forms (Input = Card Pattern)

Forms follow the same card pattern as everything else. Every input lives in a foreground surface.

**Form Structure:**
```tsx
<form className="space-y-6">
  {/* Text input */}
  <div className="space-y-2">
    <label className="text-sm font-medium text-font">
      Email Address
    </label>
    <input
      type="email"
      className="w-full h-10 px-3 bg-foreground text-font border border-font/20 rounded-md
                 focus:ring-2 focus:ring-primary-dark focus:border-transparent
                 transition-all duration-150"
      placeholder="you@example.com"
    />
  </div>

  {/* Textarea */}
  <div className="space-y-2">
    <label className="text-sm font-medium text-font">
      Description
    </label>
    <textarea
      className="w-full min-h-[120px] px-3 py-2 bg-foreground text-font border border-font/20 rounded-md
                 focus:ring-2 focus:ring-primary-dark focus:border-transparent
                 transition-all duration-150"
      placeholder="Enter description..."
    />
  </div>

  {/* Select dropdown */}
  <div className="space-y-2">
    <label className="text-sm font-medium text-font">
      Category
    </label>
    <select className="w-full h-10 px-3 bg-foreground text-font border border-font/20 rounded-md
                       focus:ring-2 focus:ring-primary-dark focus:border-transparent">
      <option>Choose option...</option>
      <option>Product</option>
      <option>Course</option>
    </select>
  </div>

  {/* Checkbox */}
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="terms"
      className="w-4 h-4 text-primary bg-foreground border-font/20 rounded
                 focus:ring-2 focus:ring-primary-dark"
    />
    <label htmlFor="terms" className="text-sm text-font">
      I agree to the terms and conditions
    </label>
  </div>

  {/* Submit button */}
  <div className="flex gap-2">
    <Button type="submit" variant="primary">Save Changes</Button>
    <Button type="button" variant="outline">Cancel</Button>
  </div>
</form>
```

**Input States:**
```css
/* Default state */
input {
  border: 1px solid hsl(var(--font) / 0.2);
  transition: all 150ms ease-in-out;
}

/* Focus state */
input:focus {
  outline: none;
  ring: 2px;
  ring-color: var(--primary-dark);
  border-color: transparent;
}

/* Error state */
input.error {
  border-color: hsl(0, 84%, 60%);
  ring-color: hsl(0, 84%, 60%);
}

/* Disabled state */
input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: hsl(var(--background));
}
```

**Form Validation:**
```tsx
// Error message component
<div className="space-y-2">
  <label className="text-sm font-medium text-font">Email</label>
  <input
    type="email"
    className="w-full h-10 px-3 bg-foreground text-font border border-red-500 rounded-md"
  />
  <p className="text-xs text-red-500">Please enter a valid email address</p>
</div>

// Success message
<div className="p-4 bg-green-50 border border-green-200 rounded-md">
  <p className="text-sm text-green-800">Form submitted successfully!</p>
</div>
```

---

## Extraction Process

### From Any Website

1. **Identify dominant colors** from target website
2. **Map to 6 tokens:**
   - Background: Card/surface color (usually light gray or dark)
   - Foreground: Content area (usually white or dark)
   - Font: Text color (must be readable on both backgrounds)
   - Primary: Main brand color (CTA buttons)
   - Secondary: Supporting color (secondary actions)
   - Tertiary: Accent color (highlights, special features)

3. **Apply everywhere:** All components automatically adapt

### Extraction Tools

- **Manual:** Use browser DevTools to inspect CSS
- **Automated:** Use `@agent-designer` to extract from screenshots
- **Brand guidelines:** Many companies publish HSL/HEX values

**Example Extraction (Stripe):**

```typescript
const stripeColors = {
  background: "220 14% 96%",   // Light gray surface
  foreground: "0 0% 100%",     // White content area
  font: "220 39% 11%",         // Dark text
  primary: "229 84% 55%",      // Stripe blue
  secondary: "220 14% 40%",    // Gray buttons
  tertiary: "151 55% 42%"      // Green accent
}
```

---

## Thing-Level Override (Optional)

### Per-Thing Branding

**IMPORTANT:** Our platform components are already beautiful with the default 6 colors. Thing-level overrides are **optional** and should only be used when:
- A product has strong existing brand identity (e.g., replicating Stripe's exact colors)
- External brand guidelines require specific colors
- Multi-brand marketplace needs distinct visual separation

**Most things should use the platform defaults.** The 6-color system is designed to work universally.

Each Thing (product, course, token, agent) **can optionally** define its own 6 colors while maintaining the same component structure.

**Database Schema (backend/convex/schema.ts):**

```typescript
things: defineTable({
  // ... other fields
  colors: v.optional(v.object({
    background: v.string(),   // HSL: "270 50% 92%"
    foreground: v.string(),   // HSL: "270 50% 98%"
    font: v.string(),         // HSL: "270 50% 15%"
    primary: v.string(),      // HSL: "280 100% 60%"
    secondary: v.string(),    // HSL: "200 100% 50%"
    tertiary: v.string()      // HSL: "150 80% 40%"
  }))
})
```

**Frontend Implementation:**

```tsx
// web/src/components/ThingCard.tsx
export function ThingCard({ thing }: { thing: Thing }) {
  const colors = thing.colors || defaultColors

  return (
    <Card
      style={{
        '--background': colors.background,
        '--foreground': colors.foreground,
        '--font': colors.font,
        '--primary': colors.primary,
        '--secondary': colors.secondary,
        '--tertiary': colors.tertiary
      } as React.CSSProperties}
    >
      <CardContent className="bg-foreground text-font">
        <h3>{thing.name}</h3>
        <Button variant="primary">Purchase</Button>
        <Button variant="secondary">Learn More</Button>
        <Button variant="tertiary">Special Offer</Button>
      </CardContent>
    </Card>
  )
}
```

### Multi-Brand Example

**Default Platform Colors (Blue theme):**
```typescript
platform: {
  background: "0 0% 93%",
  foreground: "0 0% 100%",
  font: "0 0% 13%",
  primary: "216 55% 25%",    // Blue
  secondary: "219 14% 28%",  // Gray-blue
  tertiary: "105 22% 25%"    // Green
}
```

**Product A (Purple theme):**
```typescript
productA: {
  background: "270 50% 92%",
  foreground: "270 50% 98%",
  font: "270 50% 15%",
  primary: "280 100% 60%",   // Purple
  secondary: "200 100% 50%", // Blue
  tertiary: "150 80% 40%"    // Green
}
```

**Product B (Orange theme):**
```typescript
productB: {
  background: "30 50% 92%",
  foreground: "30 50% 98%",
  font: "30 50% 15%",
  primary: "25 100% 55%",    // Orange
  secondary: "45 100% 50%",  // Yellow
  tertiary: "340 80% 50%"    // Red
}
```

**Same card structure. Different brands. Zero custom CSS.**

---

## Implementation Guide

### Global Defaults (Tailwind Config)

```typescript
// web/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        font: "hsl(var(--font))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          light: "hsl(var(--secondary-light))",
          dark: "hsl(var(--secondary-dark))"
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          light: "hsl(var(--tertiary-light))",
          dark: "hsl(var(--tertiary-dark))"
        }
      }
    }
  }
}
```

### CSS Variables (Root)

```css
/* web/src/styles/globals.css */
:root {
  /* Light mode defaults */
  --background: 0 0% 93%;
  --foreground: 0 0% 100%;
  --font: 0 0% 13%;
  --primary: 216 55% 25%;
  --secondary: 219 14% 28%;
  --tertiary: 105 22% 25%;

  /* Auto-generated variants */
  --primary-light: 216 55% 35%;
  --primary-dark: 216 55% 15%;
  --ring: var(--primary-dark);
}

.dark {
  /* Dark mode overrides */
  --background: 0 0% 10%;
  --foreground: 0 0% 13%;
  --font: 0 0% 100%;
}
```

### Component Usage

```tsx
// Cards automatically use background/foreground
<Card className="bg-background">
  <CardContent className="bg-foreground text-font">
    <h3>Product Title</h3>
    <p>Product description</p>
  </CardContent>
</Card>

// Buttons use brand colors
<Button variant="primary">Main CTA</Button>
<Button variant="secondary">Supporting Action</Button>
<Button variant="tertiary">Accent Action</Button>
<Button variant="outline">Neutral</Button>
<Button variant="ghost">Minimal</Button>
```

---

## Migration from Old System

### Old Token Names → New Token Names

| Old Name | New Name | Notes |
|----------|----------|-------|
| `card` | `background` | Card surface color |
| `card-foreground` | `font` | Text on cards |
| `popover` | `foreground` | Content area |
| `popover-foreground` | `font` | Text in content |
| `accent` | `tertiary` | Renamed for clarity |
| `accent-foreground` | `font` | Auto-handled |

**Breaking Change:** None. Old tokens still work via CSS variable mapping.

---

## Design Tokens Export

### For Design Tools (Figma, Sketch)

```json
{
  "colors": {
    "background": {
      "light": "hsl(0, 0%, 93%)",
      "dark": "hsl(0, 0%, 10%)"
    },
    "foreground": {
      "light": "hsl(0, 0%, 100%)",
      "dark": "hsl(0, 0%, 13%)"
    },
    "font": {
      "light": "hsl(0, 0%, 13%)",
      "dark": "hsl(0, 0%, 100%)"
    },
    "primary": "hsl(216, 55%, 25%)",
    "secondary": "hsl(219, 14%, 28%)",
    "tertiary": "hsl(105, 22%, 25%)"
  }
}
```

---

## Best Practices

### DO ✅

- **Use platform defaults for most things** (they're already beautiful!)
- Extract colors only when replicating existing brands (Stripe, Shopify, etc.)
- Use thing-level colors **sparingly** for products with strong brand identity
- Maintain high contrast ratios (WCAG AA minimum)
- Test in both light and dark modes
- Use primary for main CTAs, secondary for supporting actions
- Keep background/foreground as neutral grays

### DON'T ❌

- **Don't override colors unless absolutely necessary**
- Don't use more than 6 base colors per thing
- Don't hardcode HSL values in components
- Don't override font color without testing readability
- Don't use tertiary for critical actions
- Don't mix color systems (stick to 6 tokens)
- **Don't assume every thing needs custom colors** (default is perfect!)

---

## Accessibility

### Color Contrast Requirements

**WCAG AA Compliance (Minimum):**
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Test Tools:**
- Chrome DevTools (Lighthouse)
- WebAIM Contrast Checker
- `@agent-designer` auto-checks contrast

**Font Color Rules:**
- Light mode: `font` must be dark enough on `foreground` (white)
- Dark mode: `font` must be light enough on `foreground` (dark)
- Default `font` values guarantee WCAG AA

---

## Examples

### Platform Default

```typescript
// Global platform colors
{
  background: "0 0% 93%",     // Light gray card
  foreground: "0 0% 100%",    // White content
  font: "0 0% 13%",           // Dark text
  primary: "216 55% 25%",     // Blue buttons
  secondary: "219 14% 28%",   // Gray buttons
  tertiary: "105 22% 25%"     // Green accents
}
```

### E-commerce Product (Purple Brand)

```typescript
// Purple-themed product
{
  background: "270 50% 92%",  // Purple-tinted card
  foreground: "270 50% 98%",  // Purple-tinted white
  font: "270 50% 15%",        // Purple-tinted dark
  primary: "280 100% 60%",    // Vibrant purple
  secondary: "200 100% 50%",  // Blue support
  tertiary: "150 80% 40%"     // Green accent
}
```

### Course Platform (Orange Brand)

```typescript
// Orange-themed course
{
  background: "30 50% 92%",   // Orange-tinted card
  foreground: "30 50% 98%",   // Orange-tinted white
  font: "30 50% 15%",         // Orange-tinted dark
  primary: "25 100% 55%",     // Vibrant orange
  secondary: "45 100% 50%",   // Yellow support
  tertiary: "340 80% 50%"     // Red accent
}
```

---

## Related Documentation

- **shadcn/ui Components:** `/web/src/components/ui/`
- **Tailwind Config:** `/web/tailwind.config.ts`
- **Global Styles:** `/web/src/styles/globals.css`
- **Design Templates:** `/web/src/pages/shop/TEMPLATE-README.md`
- **Ontology Spec:** `/one/knowledge/ontology.md`
- **Thing Schema:** `/backend/convex/schema.ts`

---

## Version History

**1.0.0 (2025-11-16)**
- Complete design system specification
- 6 core color tokens + 4 design properties (states, elevation, radius, motion)
- Comprehensive component architecture:
  - Cards (foundation of everything)
  - Buttons (6 variants with full state system)
  - Typography (8-level type scale)
  - Layout (grid + responsive breakpoints)
  - Forms (input states + validation)
- Thing-level override system (optional)
- Migration guide from old tokens
- Complete implementation patterns with code examples

---

**The 6 extractable colors + design properties. Extract from any website. Apply everywhere. Beautiful by default.**
