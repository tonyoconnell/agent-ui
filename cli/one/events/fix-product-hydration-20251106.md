# Fix: Product Component Hydration Errors

**Date:** 2025-11-06
**Type:** Bug Fix
**Severity:** Medium
**Status:** Fixed

## Problem

Hydration errors occurred when loading ProductCard and ProductSearch components:

```
[astro-island] Error hydrating /src/components/ecommerce/interactive/ProductCard.tsx
TypeError: Failed to fetch dynamically imported module

[astro-island] Error hydrating /src/components/products/ProductSearch.tsx
TypeError: Failed to fetch dynamically imported module
```

## Root Cause

Astro with React requires **default exports** for components that use `client:load` directives. The components were using named exports only, which caused module resolution failures during hydration.

## Solution

Updated both components to export both default AND named exports for backward compatibility:

### ProductCard.tsx

```typescript
// Before (named export only)
export function ProductCard({ product }: ProductCardProps) { ... }

// After (both exports)
function ProductCard({ product }: ProductCardProps) { ... }

export default ProductCard;
export { ProductCard };
```

### ProductSearch.tsx

```typescript
// Before (named export only)
export function ProductSearch({ ... }: ProductSearchProps) { ... }

// After (both exports)
function ProductSearch({ ... }: ProductSearchProps) { ... }

export default ProductSearch;
export { ProductSearch };
```

### Updated Imports

Changed imports in pages to use default imports:

```typescript
// shop.astro
import ProductCard from '@/components/ecommerce/interactive/ProductCard';

// products/index.astro
import ProductSearch from '../../components/products/ProductSearch.tsx';
```

## Files Modified

### Component Files (Export Changes)

1. `/web/src/components/ecommerce/interactive/ProductCard.tsx`
   - Changed to default export + named export

2. `/web/src/components/products/ProductSearch.tsx`
   - Changed to default export + named export

3. `/web/src/components/ecommerce/static/RecommendationsCarousel.tsx`
   - Changed to default export + named export (2 functions)

4. `/web/src/components/ecommerce/static/FAQAccordion.tsx`
   - Changed to default export + named export (2 functions)

5. `/web/src/components/ecommerce/interactive/Wishlist.tsx`
   - Changed to default export + named export (3 functions)

### Page Files (Import Changes)

1. `/web/src/pages/shop.astro:21`
   - Changed ProductCard to default import

2. `/web/src/pages/products/index.astro:5`
   - Changed ProductSearch to default import

3. `/web/src/pages/products/[slug].astro:18`
   - Changed RecommendationsCarousel to default import

## Impact

- **Fixes:** Hydration errors on `/shop` and `/products` pages
- **Maintains:** Backward compatibility with other components using named imports
- **No Breaking Changes:** Both import styles now work

## Testing

1. Navigate to http://localhost:4321/shop
2. Navigate to http://localhost:4321/products
3. Verify no hydration errors in console
4. Verify ProductCard components render correctly
5. Verify ProductSearch functionality works

## Lessons Learned

1. **Astro + React Pattern:** Always use default exports for client-hydrated React components
2. **Export Strategy:** Export both default and named for maximum compatibility
3. **Error Detection:** Hydration errors appear in browser console, not build output
4. **Module Resolution:** Dynamic imports in Astro require proper export patterns

## Related Documentation

- Astro React Integration: https://docs.astro.build/en/guides/integrations-guide/react/
- Client Directives: https://docs.astro.build/en/reference/directives-reference/#client-directives
- ONE Architecture: `/one/knowledge/architecture.md`
- Frontend Patterns: `/web/CLAUDE.md`

## Additional Fixes

After the initial ProductCard and ProductSearch fixes, additional hydration errors were discovered and fixed:

### RecommendationsCarousel.tsx

```typescript
// Fixed exports
function RecommendationsCarousel({ ... }) { ... }
function FrequentlyBoughtTogether({ ... }) { ... }

export default RecommendationsCarousel;
export { RecommendationsCarousel, FrequentlyBoughtTogether };
```

### FAQAccordion.tsx

```typescript
// Fixed exports
function FAQAccordion({ ... }) { ... }
function ProductFAQ({ ... }) { ... }

// Note: defaultEcommerceFAQs already exported on line 180 as const
export default FAQAccordion;
export { FAQAccordion, ProductFAQ };
```

### Wishlist.tsx

```typescript
// Fixed exports
function WishlistPage({ ... }) { ... }
function WishlistCount() { ... }
function WishlistButton({ ... }) { ... }

export default WishlistPage;
export { WishlistPage, WishlistCount, WishlistButton, wishlistActions };
```

## Pattern for Fixing Other Components

If you encounter similar hydration errors with other client components:

1. **Check the component** - Look for `'use client'` directive
2. **Find all export functions** - Search for `export function ComponentName`
3. **Convert to function declaration** - Change `export function` to just `function`
4. **Add exports at end** - Add both default and named exports

```typescript
// Before
export function MyComponent({ ... }) { ... }

// After
function MyComponent({ ... }) { ... }

export default MyComponent;
export { MyComponent };
```

## Remaining Work

There are 60+ client components in the codebase that may need similar fixes if they cause hydration errors when used with `client:load`. Apply this pattern as needed when errors occur.

## Dev Server Restart

After all fixes were applied, the dev server was restarted to ensure changes took effect:

```bash
# Kill existing server
lsof -ti:4321 | xargs kill

# Restart dev server
bun run dev
```

The dev server successfully detected the changes and reloaded all affected pages.

## Status

✅ **Fixed** - All reported hydration errors resolved
📋 **Pattern Documented** - Ready for future fixes as needed
🔄 **Dev Server Restarted** - Changes active at http://localhost:4321

### Verified Pages
- ✅ `/shop` - ProductCard hydration working
- ✅ `/products` - ProductSearch hydration working
- ✅ `/products/[slug]` - RecommendationsCarousel, FAQAccordion, Wishlist hydration working
- ✅ `/products?category=electronics` - All components loading correctly
