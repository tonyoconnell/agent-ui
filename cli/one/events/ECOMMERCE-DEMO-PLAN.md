---
title: Ecommerce Demo Plan
dimension: events
category: ECOMMERCE-DEMO-PLAN.md
tags: ai, connections, events, groups, cycle, knowledge, ontology, people, things
related_dimensions: connections, groups, knowledge, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the events dimension in the ECOMMERCE-DEMO-PLAN.md category.
  Location: one/events/ECOMMERCE-DEMO-PLAN.md
  Purpose: Documents ecommerce demo application - 100-cycle plan
  Related dimensions: connections, groups, knowledge, people, things
  For AI agents: Read this to understand ECOMMERCE DEMO PLAN.
---

# Ecommerce Demo Application - 100-Cycle Plan

**Version:** 1.0.0  
**Status:** Executing  
**Goal:** Build a fully functional ecommerce demo with real products, cart, checkout, and Stripe payments

---

## Ontology Mapping

### GROUPS
- Store: "ONE Store Demo" (business type)

### PEOPLE
- owner: Platform administrator
- customer: Anonymous and authenticated users

### THINGS
- product: 10+ products across 3 categories
- product_variant: Size, color variations
- category: Apparel, Accessories, Home
- collection: Bestsellers, New Arrivals, Sale Items
- shopping_cart: Temporary cart state
- order: Completed purchases
- payment: Stripe transactions

### CONNECTIONS
- part_of: product → category
- belongs_to: product → collection
- contains: cart → product, order → product
- purchased: customer → product

### EVENTS
- product_viewed
- product_added_to_cart
- cart_abandoned
- checkout_started
- order_placed
- payment_processed

### KNOWLEDGE
- category:apparel, category:accessories, category:home
- color:blue, color:red, size:small, size:large
- stock_status:in_stock, stock_status:low_stock

---

## 100-Cycle Execution Plan

### Phase 1: Foundation (Cycle 1-10)
**Specialist:** Engineering Director + Frontend  
**Duration:** ~10 min

- [x] Cycle 1: Validate ontology mapping
- [ ] Cycle 2: Create product data structure
- [ ] Cycle 3: Setup content collections
- [ ] Cycle 4: Create 10+ sample products
- [ ] Cycle 5: Setup categories and collections
- [ ] Cycle 6: Configure Nanostores for cart
- [ ] Cycle 7: Create type definitions
- [ ] Cycle 8: Setup utility functions
- [ ] Cycle 9: Test data loading
- [ ] Cycle 10: Document data structure

### Phase 2: Product Display (Cycle 11-20)
**Specialist:** Frontend  
**Duration:** ~15 min

- [ ] Cycle 11: Build product grid component
- [ ] Cycle 12: Add product card with images
- [ ] Cycle 13: Implement quick view modal
- [ ] Cycle 14: Add price display with sale pricing
- [ ] Cycle 15: Build category navigation
- [ ] Cycle 16: Create product listing page
- [ ] Cycle 17: Add sorting options
- [ ] Cycle 18: Implement responsive grid
- [ ] Cycle 19: Add loading states
- [ ] Cycle 20: Test product display

### Phase 3: Product Details (Cycle 21-30)
**Specialist:** Frontend  
**Duration:** ~15 min

- [ ] Cycle 21: Build product detail page
- [ ] Cycle 22: Create image gallery
- [ ] Cycle 23: Add variant selector
- [ ] Cycle 24: Implement quantity picker
- [ ] Cycle 25: Build add to cart button
- [ ] Cycle 26: Show related products
- [ ] Cycle 27: Add product description
- [ ] Cycle 28: Display product specs
- [ ] Cycle 29: Add breadcrumbs
- [ ] Cycle 30: Test product details

### Phase 4: Shopping Cart (Cycle 31-40)
**Specialist:** Frontend  
**Duration:** ~15 min

- [ ] Cycle 31: Build cart page layout
- [ ] Cycle 32: Create cart item component
- [ ] Cycle 33: Add quantity controls
- [ ] Cycle 34: Implement remove item
- [ ] Cycle 35: Calculate subtotal
- [ ] Cycle 36: Add shipping estimate
- [ ] Cycle 37: Calculate tax
- [ ] Cycle 38: Show cart total
- [ ] Cycle 39: Add empty cart state
- [ ] Cycle 40: Test cart operations

### Phase 5: Filtering & Search (Cycle 41-50)
**Specialist:** Frontend  
**Duration:** ~15 min

- [ ] Cycle 41: Build filter sidebar
- [ ] Cycle 42: Add category filters
- [ ] Cycle 43: Add price range slider
- [ ] Cycle 44: Add stock filter
- [ ] Cycle 45: Add tag filters
- [ ] Cycle 46: Implement search bar
- [ ] Cycle 47: Add search results
- [ ] Cycle 48: Clear filters button
- [ ] Cycle 49: Show active filters
- [ ] Cycle 50: Test filtering

### Phase 6: Checkout (Cycle 51-60)
**Specialist:** Integrator  
**Duration:** ~20 min

- [ ] Cycle 51: Build checkout page
- [ ] Cycle 52: Add shipping form
- [ ] Cycle 53: Integrate Stripe Elements
- [ ] Cycle 54: Create payment form
- [ ] Cycle 55: Add billing address
- [ ] Cycle 56: Build order summary
- [ ] Cycle 57: Create payment API
- [ ] Cycle 58: Add success page
- [ ] Cycle 59: Add error handling
- [ ] Cycle 60: Test checkout flow

### Phase 7: Sample Data (Cycle 61-70)
**Specialist:** Backend  
**Duration:** ~10 min

- [ ] Cycle 61: Create apparel products
- [ ] Cycle 62: Create accessories
- [ ] Cycle 63: Create home goods
- [ ] Cycle 64: Add product images
- [ ] Cycle 65: Set variant options
- [ ] Cycle 66: Configure pricing
- [ ] Cycle 67: Add descriptions
- [ ] Cycle 68: Set stock levels
- [ ] Cycle 69: Add tags and metadata
- [ ] Cycle 70: Test product loading

### Phase 8: Polish & UX (Cycle 71-80)
**Specialist:** Designer  
**Duration:** ~15 min

- [ ] Cycle 71: Add loading skeletons
- [ ] Cycle 72: Improve animations
- [ ] Cycle 73: Add toast notifications
- [ ] Cycle 74: Enhance mobile design
- [ ] Cycle 75: Add cart badge
- [ ] Cycle 76: Improve typography
- [ ] Cycle 77: Add hover effects
- [ ] Cycle 78: Polish spacing
- [ ] Cycle 79: Add focus states
- [ ] Cycle 80: Test accessibility

### Phase 9: Testing (Cycle 81-90)
**Specialist:** Quality  
**Duration:** ~15 min

- [ ] Cycle 81: Test add to cart
- [ ] Cycle 82: Test cart updates
- [ ] Cycle 83: Test variant selection
- [ ] Cycle 84: Test filters
- [ ] Cycle 85: Test search
- [ ] Cycle 86: Test checkout
- [ ] Cycle 87: Test Stripe integration
- [ ] Cycle 88: Test mobile experience
- [ ] Cycle 89: Test keyboard navigation
- [ ] Cycle 90: Accessibility audit

### Phase 10: Deploy (Cycle 91-100)
**Specialist:** Ops  
**Duration:** ~10 min

- [ ] Cycle 91: Build for production
- [ ] Cycle 92: Optimize images
- [ ] Cycle 93: Run Lighthouse
- [ ] Cycle 94: Fix performance issues
- [ ] Cycle 95: Create demo docs
- [ ] Cycle 96: Write README
- [ ] Cycle 97: Deploy to Cloudflare
- [ ] Cycle 98: Verify live URLs
- [ ] Cycle 99: Test production
- [ ] Cycle 100: Mark complete

---

## Success Criteria

- [ ] 10+ products across 3 categories
- [ ] Full shopping cart functionality
- [ ] Working Stripe checkout
- [ ] Product search and filtering
- [ ] Mobile responsive design
- [ ] < 50KB JavaScript bundle
- [ ] Lighthouse score 90+
- [ ] WCAG 2.1 AA compliant
- [ ] Live demo URL
- [ ] Complete documentation

---

## Estimated Completion

**Total Cycles:** 100  
**Estimated Time:** ~2 hours  
**Agents:** 5 working in parallel  
**Cost:** $0 (free tier)

**Live Demo:** http://localhost:4321/ecommerce  
**Production:** https://ecommerce-demo.one.ie (after deploy)
