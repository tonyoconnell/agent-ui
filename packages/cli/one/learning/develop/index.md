# Development & Design

The development documentation layer contains comprehensive guides for building features within the ONE Platform's 6-dimension ontology.

## Structure

```
one/knowledge/develop/
├── index.md                  # This file
└── design.md                 # Complete design system specification
```

## Development Guides

### Design: `develop/design.md`

The complete ONE Design System specification including:

**Principles:**
- Clarity - Measured whitespace, bold hierarchy, grid alignment
- Velocity - Token-first thinking, reusable components, no reinvention
- Inclusive - WCAG 2.1 AA compliance, motion preferences, accessible interactions

**Design Tokens:**
- Colors (HSL format with light/dark modes)
- Typography (modular scale, best practices)
- Spacing (4px grid system)
- Radius, elevation, motion tokens
- Container rules and grid system

**Implementation:**
- Button variants and states
- Component language principles
- Interaction rules and accessibility guidelines
- Implementation playbook with QA checklist
- Performance targets and optimization techniques

**Use this guide when:**
- Implementing new UI features
- Making design decisions about colors, spacing, typography
- Ensuring accessibility compliance (WCAG 2.1 AA)
- Setting up design tokens in new projects
- Validating component implementations

## Related Documentation

- **Patterns:** See `one/knowledge/patterns/design/` for reusable wireframe and component patterns
- **Frontend Architecture:** Read `one/knowledge/architecture-frontend.md` for Astro + React patterns
- **Agent Coordination:** See `.claude/agents/agent-designer.md` for design specification workflows
- **Quality Guidelines:** Check `one/knowledge/quality-loop.md` for testing patterns

## Quick Reference

### Design System Quick Start

**Color tokens (HSL):**
```css
--primary: 216 55% 25%           /* Deep navy */
--primary-foreground: 36 8% 96%  /* Warm light */
--secondary: 219 14% 28%         /* Graphite */
--accent: 105 22% 25%            /* Leaf */
--muted: 36 8% 88%               /* Stone */
```

**Spacing scale (4px base):**
- space-2: 8px
- space-3: 12px
- space-4: 16px (default)
- space-6: 24px
- space-8: 32px
- space-12: 48px

**Typography scale:**
- Display: 56px / 3.5rem (hero statements)
- Headline: 40px / 2.5rem (section titles)
- Title: 28px / 1.75rem (card titles)
- Subtitle: 20px / 1.25rem (supporting copy)
- Body: 16px / 1rem (paragraphs)
- Caption: 14px / 0.875rem (metadata & labels)

**Border radius:**
- xs: 4px (pills & badges)
- sm: 6px (inputs & controls)
- md: 12px (cards)
- lg: 24px (modals & hero surfaces)
- full: 9999px (circular avatars)

**Motion:**
- ease-snappy: cubic-bezier(0.4, 0, 0.2, 1)
- ease-natural: cubic-bezier(0.16, 1, 0.3, 1)
- duration-rapid: 120ms
- duration-base: 200ms
- duration-slow: 320ms

### Design Checklist

Before shipping ANY UI change:

- [ ] Tokens documented (colors, spacing, typography)
- [ ] All states implemented (hover, focus, active, disabled, loading)
- [ ] Contrast AA+ validated (4.5:1 body, 3:1 large text)
- [ ] Keyboard navigation tested
- [ ] Responsive tested (mobile 320px, tablet 768px, desktop 1024px+)
- [ ] Motion respects prefers-reduced-motion
- [ ] Screenshots added to PR
- [ ] Accessibility notes included
- [ ] Performance benchmarks met (Lighthouse 90+)
- [ ] No hydration mismatches or layout shifts

## Golden Rules

1. **Design is not decoration** - Every element must serve a purpose
2. **Use proven patterns** - Compose existing components, minimize custom ones
3. **Accessibility first** - WCAG AA compliance is non-negotiable
4. **Token-driven** - Pull all values from design tokens, never hard-code
5. **Test-driven** - Map each acceptance criterion to a UI element
6. **Responsive by default** - Mobile-first thinking in every design
7. **Reusable knowledge** - Store patterns for future designs

## Architecture Integration

The develop layer connects to the overall ONE Platform architecture:

```
Frontend (web/src)
    ↓ uses
Design System (develop/design.md)
    ↓ implements
Design Tokens + Components
    ↓ validates via
Patterns (patterns/design/)
    ↓ coordinated by
Agent-Designer (.claude/agents/agent-designer.md)
```

When building features:
1. Start with design tokens from `develop/design.md`
2. Use patterns from `patterns/design/` for common layouts
3. Implement in Astro + React following `architecture-frontend.md`
4. Validate with design checklist above
5. Coordinate with agent-designer for QA workflows

---

**Built for clarity, consistency, and accessibility across the ONE Platform.**
