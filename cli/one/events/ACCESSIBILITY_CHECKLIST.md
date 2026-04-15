# Accessibility Checklist for Button Components

## WCAG 2.1 AA Compliance Requirements

All interactive elements (buttons, links) MUST have accessible names for screen reader users.

## ✅ Fixed Issues (November 6, 2025)

### 1. Home Page (index.astro)
- **FIXED**: "Explore The Ontology" button now has `aria-label="Explore the 6-dimension ontology"`
- **Location**: Line 176
- **Issue**: Button had text but needed clearer context for screen readers

### 2. Sidebar Navigation (Sidebar.tsx)
- **FIXED**: Submenu expand/collapse buttons now have dynamic `aria-label` and `aria-expanded` attributes
- **Location**: Lines 235-249
- **Issue**: Icon-only buttons in collapsed state had no accessible name
- **Solution**: Added descriptive labels like "Expand Projects menu" / "Collapse Projects menu"

- **FIXED**: User menu dropdown trigger now has `aria-label`
- **Location**: Line 299
- **Issue**: Avatar button had no accessible name in collapsed state
- **Solution**: Added dynamic label "User menu for [Name]" or "Guest user menu"

- **FIXED**: Menu toggle button icons now have `aria-hidden="true"`
- **Location**: Line 387
- **Issue**: Icons were not marked as decorative
- **Solution**: All icons within buttons with aria-labels are now properly hidden from screen readers

### 3. GitSection Component (GitSection.tsx)
- **ALREADY COMPLIANT**: All buttons have proper `aria-label` attributes
- Download ZIP button: `aria-label="Download ONE as ZIP file"`
- Clone button: `aria-label="Copy git clone command"`
- NPX button: `aria-label="Copy npx command to start a new project"`
- GitHub button: `aria-label="View ONE repository on GitHub"`
- Fork button: `aria-label="Fork ONE repository on GitHub"`
- Codespaces button: `aria-label="Open ONE in GitHub Codespaces"`
- All icons have `aria-hidden="true"`

## ✅ Components Already Compliant

### DeployHeroMetrics.tsx
- No interactive buttons (chart component only)
- All charts use proper tooltips with accessible content

### DeploymentMetrics.tsx
- No interactive buttons (chart component only)
- All charts use proper tooltips with accessible content

## Guidelines for Future Development

### 1. Icon-Only Buttons
Always add `aria-label` to describe the action:

```tsx
// ❌ WRONG
<button>
  <IconComponent />
</button>

// ✅ CORRECT
<button aria-label="Close dialog">
  <IconComponent aria-hidden="true" />
</button>
```

### 2. Buttons with Text and Icons
Mark icons as decorative:

```tsx
// ❌ WRONG
<button>
  <IconComponent />
  Click Here
</button>

// ✅ CORRECT
<button aria-label="View details">
  <IconComponent aria-hidden="true" />
  Click Here
</button>
```

### 3. Toggle Buttons (Expand/Collapse)
Use `aria-expanded` to indicate state:

```tsx
// ✅ CORRECT
<button
  aria-label={isOpen ? "Collapse menu" : "Expand menu"}
  aria-expanded={isOpen}
>
  <ChevronIcon aria-hidden="true" />
</button>
```

### 4. Link Buttons
Links that look like buttons should describe the destination:

```tsx
// ❌ WRONG
<a href="/docs">
  <button>
    <ArrowIcon />
  </button>
</a>

// ✅ CORRECT
<a href="/docs">
  <button aria-label="Go to documentation">
    <ArrowIcon aria-hidden="true" />
  </button>
</a>
```

### 5. Copy-to-Clipboard Buttons
Describe what will be copied:

```tsx
// ✅ CORRECT
<button
  onClick={() => copyToClipboard(code)}
  aria-label="Copy code to clipboard"
>
  <CopyIcon aria-hidden="true" />
</button>
```

## Testing Checklist

Before deploying new interactive components:

- [ ] Every `<button>` element has accessible text or `aria-label`
- [ ] Every clickable `<a>` element has accessible text or `aria-label`
- [ ] Icon-only buttons have descriptive `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Toggle buttons have `aria-expanded` attribute
- [ ] Buttons describe the ACTION (verb + object)
- [ ] Links describe the DESTINATION
- [ ] No generic labels like "Click here" or "Button"
- [ ] Test with screen reader (VoiceOver on macOS, NVDA on Windows)
- [ ] Run Lighthouse accessibility audit (score should be 100)
- [ ] Test keyboard navigation (all buttons reachable via Tab)
- [ ] Test focus indicators are visible

## Automated Testing Tools

1. **Lighthouse** (Chrome DevTools)
   - Run accessibility audit
   - Target: 100 score

2. **WAVE** (Browser Extension)
   - https://wave.webaim.org/
   - Check for unlabeled buttons

3. **axe DevTools** (Browser Extension)
   - https://www.deque.com/axe/devtools/
   - Comprehensive accessibility testing

4. **VoiceOver** (macOS built-in)
   - Cmd + F5 to enable
   - Navigate with VO + Arrow keys

5. **NVDA** (Windows free screen reader)
   - https://www.nvaccess.org/
   - Test on Windows environments

## Component Template Examples

### Icon Button Template
```tsx
import { IconComponent } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function IconButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Describe what this button does"
    >
      <IconComponent aria-hidden="true" />
    </Button>
  );
}
```

### Button with Icon Template
```tsx
import { IconComponent } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ButtonWithIcon() {
  return (
    <Button aria-label="Clear and specific action description">
      <IconComponent aria-hidden="true" />
      Button Text
    </Button>
  );
}
```

### Expandable Menu Button Template
```tsx
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExpandableButton({ isExpanded, onClick, title }) {
  return (
    <Button
      onClick={onClick}
      aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
      aria-expanded={isExpanded}
    >
      <ChevronDown aria-hidden="true" />
      {title}
    </Button>
  );
}
```

## Common Mistakes to Avoid

### ❌ Generic Labels
```tsx
// BAD
<button aria-label="Click here">...</button>
<button aria-label="Button">...</button>
<a aria-label="Link">...</a>
```

### ❌ Missing Labels on Icon Buttons
```tsx
// BAD
<button>
  <SearchIcon />
</button>
```

### ❌ Not Hiding Decorative Icons
```tsx
// BAD
<button aria-label="Search">
  <SearchIcon /> {/* Screen reader will announce both "Search" and the icon */}
</button>
```

### ❌ Redundant Text
```tsx
// BAD
<button aria-label="Search button">
  Search
</button>
// Screen reader announces "Search button button"
```

## Success Criteria

✅ **All interactive elements have accessible names**
✅ **Icon-only buttons have descriptive aria-labels**
✅ **Decorative icons are hidden from screen readers**
✅ **Button labels describe actions (verbs + objects)**
✅ **Link labels describe destinations**
✅ **Toggle buttons indicate state with aria-expanded**
✅ **No generic labels like "Click here"**
✅ **Lighthouse accessibility score: 100**
✅ **Screen reader testing passes**
✅ **Keyboard navigation works**

---

**Last Updated**: November 6, 2025
**Status**: All identified issues FIXED
**Lighthouse Score Target**: 100/100
**WCAG Compliance**: 2.1 AA
