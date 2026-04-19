---
title: Todo Ecommerce Frontend
dimension: things
primary_dimension: things
category: todo-ecommerce-frontend.md
tags: ai, backend, frontend, cycle, ui
related_dimensions: connections, events, groups, knowledge, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-ecommerce-frontend.md category.
  Location: one/things/todo-ecommerce-frontend.md
  Purpose: Documents one platform: e-commerce frontend store v1.0.0
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand todo ecommerce frontend.
---

# ONE Platform: E-Commerce Frontend Store v1.0.0

**Focus:** Frontend-only ecommerce storefront with Stripe checkout, product catalog, shopping cart
**Type:** Complete frontend implementation (Astro + React 19 + Tailwind v4)
**Integration:** Stripe for payment processing
**Process:** `Cycle 1-100 cycle sequence`
**Timeline:** 12-16 cycles per specialist per day
**Target:** Fully functional product storefront ready for integration with backend services

---

## PHASE 1: FOUNDATION & DESIGN (Cycle 1-10)

**Purpose:** Define storefront requirements, product categories, user flows, design system

### Cycle 1: Define Storefront Structure

- [ ] **Product Catalog:**
  - [ ] Featured products on homepage
  - [ ] All products listing page with filters
  - [ ] Product detail pages with images, descriptions
  - [ ] Category browsing (clothing, accessories, electronics, etc.)
  - [ ] Search functionality
- [ ] **Shopping Experience:**
  - [ ] Add to cart functionality
  - [ ] Cart page with item management
  - [ ] Wishlist/saved items
  - [ ] Quick view modal
- [ ] **Checkout:**
  - [ ] Cart review step
  - [ ] Shipping information form
  - [ ] Billing address (same as shipping option)
  - [ ] Order summary with totals
  - [ ] Stripe payment integration
- [ ] **Customer Features:**
  - [ ] User accounts (optional for guest checkout)
  - [ ] Order history page
  - [ ] Saved addresses
  - [ ] Account settings

### Cycle 2: Map Storefront to 6-Dimension Ontology

- [ ] **Groups:** Storefront's business group (e.g., "Acme Store")
- [ ] **People:** Customer (buyer), admin (store manager)
- [ ] **Things:**
  - [ ] product (name, description, price, images, inventory)
  - [ ] shopping_cart (items, totals, status)
  - [ ] order (items, shipping, payment info)
- [ ] **Connections:**
  - [ ] customer → product (viewed, added to cart, purchased)
  - [ ] customer → order (owns)
  - [ ] product → order (included_in)
- [ ] **Events:**
  - [ ] product_viewed, product_added_to_cart, item_removed_from_cart
  - [ ] cart_abandoned, checkout_started, order_placed, payment_completed
- [ ] **Knowledge:** product categories, price tiers, inventory levels

### Cycle 3: Design Product Catalog Structure

- [ ] **Product Data Model:**
  - [ ] ID, name, description, price, compareAtPrice (original)
  - [ ] Images (primary + gallery)
  - [ ] Category, tags, SKU
  - [ ] Inventory count, variants (size, color)
  - [ ] Rating, review count
  - [ ] Status (draft, published, archived)
- [ ] **Product Details Page Shows:**
  - [ ] Image gallery with zoom
  - [ ] Product name, brand, rating
  - [ ] Price (show savings if on sale)
  - [ ] Availability status
  - [ ] Variant selectors (size, color)
  - [ ] Quantity picker
  - [ ] Add to cart button
  - [ ] Add to wishlist button
  - [ ] Share product link
  - [ ] Product description + features
  - [ ] Related/recommended products

### Cycle 4: Design Shopping Cart Experience

- [ ] **Cart Page Shows:**
  - [ ] Product list with images
  - [ ] Quantity controls (increment/decrement)
  - [ ] Price per item (with variant details)
  - [ ] Remove button per item
  - [ ] Subtotal, estimated tax, estimated shipping
  - [ ] Applied discount codes (if any)
  - [ ] Order total
  - [ ] Proceed to checkout button
  - [ ] Continue shopping button
- [ ] **Cart State Management:**
  - [ ] Add to cart from product pages
  - [ ] Update quantities
  - [ ] Remove items
  - [ ] Save cart (localStorage for guests, database for users)
  - [ ] Display item count in header

### Cycle 5: Design Checkout Flow

- [ ] **Step 1: Cart Review**
  - [ ] Show all items with quantities
  - [ ] Allow editing (change qty, remove items)
  - [ ] Subtotal display
- [ ] **Step 2: Shipping Address**
  - [ ] Street address, city, state/province, postal code, country
  - [ ] Phone number
  - [ ] For existing users: Load saved addresses
  - [ ] Save this address option
- [ ] **Step 3: Billing Address**
  - [ ] "Same as shipping" checkbox (default checked)
  - [ ] Or enter separate billing address
- [ ] **Step 4: Shipping Method**
  - [ ] Standard shipping (5-7 business days) - Free over $50
  - [ ] Express shipping (2-3 business days) - $10.99
  - [ ] Overnight shipping (next day) - $24.99
  - [ ] Show cost per method
- [ ] **Step 5: Order Summary**
  - [ ] All items with final prices
  - [ ] Shipping method + cost
  - [ ] Subtotal, tax, shipping, total
  - [ ] Back to shipping button
- [ ] **Step 6: Payment via Stripe**
  - [ ] Card details (hosted via Stripe Elements)
  - [ ] Billing zip code (already entered)
  - [ ] "Save card for future purchases" option
  - [ ] Show security badges (SSL, secure checkout)
  - [ ] Complete purchase button
- [ ] **Step 7: Order Confirmation**
  - [ ] Order number (ORD-202501-12345)
  - [ ] Items purchased
  - [ ] Total amount paid
  - [ ] Estimated delivery date
  - [ ] Email confirmation sent notice
  - [ ] Continue shopping button
  - [ ] Track order link (future)

### Cycle 6: Define Responsive Design Strategy

- [ ] **Mobile-first (80% of users):**
  - [ ] Single column layout
  - [ ] Touch-friendly buttons (48px minimum)
  - [ ] Readable font sizes (16px+)
  - [ ] Minimal form fields per screen
  - [ ] Swipeable product galleries
- [ ] **Tablet (10% of users):**
  - [ ] Two-column product grid
  - [ ] Larger images
  - [ ] Side sidebar for filters
- [ ] **Desktop (10% of users):**
  - [ ] Three-column product grid
  - [ ] Full featured layout
  - [ ] Hover effects on cards
  - [ ] Keyboard navigation support

### Cycle 7: Plan Content Strategy

- [ ] **Home Page:**
  - [ ] Hero banner with featured products/sale
  - [ ] Featured products section
  - [ ] Best sellers section
  - [ ] New arrivals section
  - [ ] Testimonials/social proof
  - [ ] Newsletter signup
  - [ ] Trust badges (free shipping, returns, security)
- [ ] **Product Pages:**
  - [ ] Rich descriptions (benefits, use cases)
  - [ ] Size guides (if applicable)
  - [ ] Care instructions
  - [ ] Customer reviews with photos
  - [ ] Q&A section
  - [ ] Related products
- [ ] **Static Pages:**
  - [ ] About us
  - [ ] Contact us
  - [ ] FAQ
  - [ ] Shipping & returns policy
  - [ ] Privacy policy
  - [ ] Terms of service

### Cycle 8: Design Visual System

- [ ] **Color Palette:**
  - [ ] Primary: Brand color for CTAs, active states
  - [ ] Secondary: Accents, highlights
  - [ ] Success: Green for checkmarks, confirmations
  - [ ] Warning: Orange/red for alerts
  - [ ] Neutral: Grays for borders, backgrounds
  - [ ] Dark mode support
- [ ] **Typography:**
  - [ ] Heading sizes: H1 (36px), H2 (28px), H3 (24px), H4 (20px)
  - [ ] Body: 16px for standard text, 14px for secondary
  - [ ] Font weights: Regular (400), semibold (600), bold (700)
- [ ] **Components:**
  - [ ] Buttons: Primary (solid), secondary (outline), ghost
  - [ ] Cards: Product, testimonial, feature
  - [ ] Forms: Text inputs, selects, checkboxes, radios
  - [ ] Badges: Category, discount, new
  - [ ] Stars: 5-star rating display

### Cycle 9: Plan Performance & Analytics

- [ ] **Performance Targets:**
  - [ ] Lighthouse: 90+ score
  - [ ] LCP (Largest Contentful Paint): < 2.5s
  - [ ] Core Web Vitals: All green
  - [ ] Bundle size: < 100KB (gzipped)
- [ ] **Analytics to Track:**
  - [ ] Page views, unique visitors
  - [ ] Top products viewed
  - [ ] Cart abandonment rate
  - [ ] Conversion rate (visitors → orders)
  - [ ] Average order value
  - [ ] Customer acquisition cost
- [ ] **Third-party Services:**
  - [ ] Stripe for payments
  - [ ] Google Analytics (or Plausible for privacy)
  - [ ] Email service for order confirmations

### Cycle 10: Define Success Metrics

- [ ] Frontend complete when:
  - [ ] Home page displays beautifully on all devices
  - [ ] Product catalog page loads with filters/search working
  - [ ] Product detail page shows all information
  - [ ] Add to cart works (localStorage persistence)
  - [ ] Cart page displays with edit controls
  - [ ] Checkout form validates all fields
  - [ ] Stripe payment integration working
  - [ ] Order confirmation page displays
  - [ ] Mobile UX is smooth and fast
  - [ ] Lighthouse score > 85
  - [ ] First test order completed successfully

---

## PHASE 2: ASTRO PAGES & LAYOUTS (Cycle 11-20)

**Purpose:** Create page structure and Astro components for static content

### Cycle 11: Create Layout Components

- [ ] **MainLayout.astro**
  - [ ] Header with logo, search, cart icon, account menu
  - [ ] Navigation (collections, sale, about, contact)
  - [ ] Main content area
  - [ ] Footer with links, newsletter signup, social media
  - [ ] Mobile hamburger menu
- [ ] **CheckoutLayout.astro**
  - [ ] Simplified header (back to store link)
  - [ ] Progress indicator (step 1-7)
  - [ ] Form content area
  - [ ] Order summary sidebar (desktop) / collapsed (mobile)

### Cycle 12: Create Home Page (index.astro)

- [ ] **Hero Section:**
  - [ ] Large background image
  - [ ] Bold headline
  - [ ] Subheading
  - [ ] "Shop Now" CTA button
  - [ ] Trust badges (free shipping, easy returns, secure)
- [ ] **Featured Products (6 items):**
  - [ ] Product grid (3 columns desktop, 2 tablet, 1 mobile)
  - [ ] ProductCard component (image, name, price, rating, button)
  - [ ] Hover effects (scale, shadow)
- [ ] **Best Sellers (4 items):**
  - [ ] Similar layout to featured
  - [ ] Badge "Best Seller" on cards
- [ ] **New Arrivals (4 items):**
  - [ ] Similar layout
  - [ ] Badge "New" on cards
- [ ] **Testimonials (3-4 reviews):**
  - [ ] Customer photos
  - [ ] Star ratings
  - [ ] Review text
  - [ ] Customer name + title
- [ ] **Newsletter Section:**
  - [ ] Heading "Stay Updated"
  - [ ] Email input
  - [ ] Subscribe button
  - [ ] Privacy note
- [ ] **CTA Section:**
  - [ ] "Discover More" heading
  - [ ] Browse all button, View sale button

### Cycle 13: Create Products Listing Page (products/index.astro)

- [ ] **Header:**
  - [ ] Page title "All Products"
  - [ ] Product count
  - [ ] Sort dropdown (newest, price low-high, price high-low, rating)
- [ ] **Sidebar (desktop only):**
  - [ ] **Category Filter:**
    - [ ] Checkboxes for each category
    - [ ] Count per category
  - [ ] **Price Filter:**
    - [ ] Range slider ($0 - $500+)
    - [ ] Min/max text inputs
  - [ ] **Rating Filter:**
    - [ ] 5★, 4★, 3★, 2★, 1★ options
  - [ ] **Clear all filters** button
- [ ] **Main Content:**
  - [ ] Product grid (3 columns desktop, 2 tablet, 1 mobile)
  - [ ] ProductCard for each item
  - [ ] Pagination (12 items per page)
  - [ ] "Show more" button (infinite scroll option)
- [ ] **Mobile:**
  - [ ] Filter button (opens drawer)
  - [ ] Filter drawer with same options

### Cycle 14: Create Product Detail Page (products/[slug].astro)

- [ ] **Left Column (60%):**
  - [ ] ImageGallery component
    - [ ] Primary image display
    - [ ] Thumbnail strip (vertical on desktop, horizontal on mobile)
    - [ ] Zoom on hover
    - [ ] Keyboard navigation (arrows)
- [ ] **Right Column (40%):**
  - [ ] **Product Info:**
    - [ ] Category breadcrumb
    - [ ] Product name (H1)
    - [ ] Rating (stars + count + link to reviews)
    - [ ] Price (sale price, original price crossed out)
    - [ ] Stock status (in stock / out of stock / low stock)
  - [ ] **Selectors:**
    - [ ] Size selector (if applicable)
    - [ ] Color selector (if applicable)
    - [ ] Quantity picker (1-10)
  - [ ] **Buttons:**
    - [ ] "Add to Cart" (primary)
    - [ ] "Add to Wishlist" (secondary)
    - [ ] Share button (copy link, email, social)
  - [ ] **Info Sections:**
    - [ ] Shipping info (free over $50, express available)
    - [ ] Returns policy (30-day free returns)
    - [ ] Trust badges (SSL, secure, quality guaranteed)
- [ ] **Below (Full Width):**
  - [ ] **Tabs: Description, Details, Reviews, Q&A**
    - [ ] Description: Rich text with images
    - [ ] Details: Specifications table
    - [ ] Reviews: Customer reviews with photos
    - [ ] Q&A: Questions and answers section
  - [ ] **Related Products:**
    - [ ] 4-6 similar items
    - [ ] ProductCard grid
  - [ ] **Recently Viewed (if user has history):**
    - [ ] 4-6 recently viewed products

### Cycle 15: Create Shopping Cart Page (cart.astro)

- [ ] **Page Title & Actions:**
  - [ ] "Shopping Cart" heading
  - [ ] "Continue Shopping" link
  - [ ] "Clear Cart" button (if items > 0)
- [ ] **If items exist:**
  - [ ] **Cart Items Table (desktop) / List (mobile):**
    - [ ] Product image, name, variant (size/color)
    - [ ] Price per item
    - [ ] Quantity controls (-, number input, +)
    - [ ] Line total (qty × price)
    - [ ] Remove button
    - [ ] Save for later button (optional)
  - [ ] **Order Summary (sticky on desktop):**
    - [ ] Subtotal
    - [ ] Estimated tax (if available)
    - [ ] Estimated shipping (if entered)
    - [ ] Discount code input + apply button
    - [ ] Order total (large, bold)
    - [ ] "Proceed to Checkout" button (primary)
    - [ ] "Continue Shopping" button
  - [ ] **Info Box:**
    - [ ] Free shipping over $50
    - [ ] Easy 30-day returns
    - [ ] Secure checkout
- [ ] **If empty:**
  - [ ] "Your cart is empty" message
  - [ ] Featured products grid
  - [ ] "Continue Shopping" button

### Cycle 16: Create Checkout Pages (checkout/[step].astro)

- [ ] **Shared Checkout Layout:**
  - [ ] Progress indicator (1 2 3 4 5 6 7)
  - [ ] Current step highlighted
  - [ ] Left: Form content (70%)
  - [ ] Right: Order summary sidebar (30%)
- [ ] **Step 1: Cart Review (checkout/index.astro)**
  - [ ] Cart items list
  - [ ] Edit cart button (back to cart)
  - [ ] Next button (to step 2)
- [ ] **Step 2: Shipping Address (checkout/shipping.astro)**
  - [ ] Form fields:
    - [ ] First name, last name (inline)
    - [ ] Email
    - [ ] Phone number
    - [ ] Street address
    - [ ] Apartment/suite (optional)
    - [ ] City, state/province, zip/postal code, country
  - [ ] "Save this address" checkbox
  - [ ] For logged-in users: Load saved addresses
  - [ ] Back button, Next button
- [ ] **Step 3: Billing Address (checkout/billing.astro)**
  - [ ] "Same as shipping" checkbox (checked by default)
  - [ ] If unchecked, show address form
  - [ ] Back button, Next button
- [ ] **Step 4: Shipping Method (checkout/shipping-method.astro)**
  - [ ] Radio button options:
    - [ ] Standard (5-7 days) - Free / $5.99
    - [ ] Express (2-3 days) - $10.99
    - [ ] Overnight (1 day) - $24.99
  - [ ] Show delivery date estimate
  - [ ] Back button, Next button
- [ ] **Step 5: Order Review (checkout/review.astro)**
  - [ ] Summary of all info:
    - [ ] Shipping address
    - [ ] Billing address
    - [ ] Shipping method
    - [ ] Items with prices
  - [ ] Links to edit each section
  - [ ] Back button, Next button
- [ ] **Step 6: Payment (checkout/payment.astro)**
  - [ ] Stripe payment form (embedded via React component)
  - [ ] Card number, expiry, CVC
  - [ ] Billing zip code
  - [ ] "Save card for future" checkbox
  - [ ] Security badges
  - [ ] Back button, "Complete Purchase" button
  - [ ] Loading state (spinner while processing)
- [ ] **Step 7: Confirmation (checkout/confirmation.astro)**
  - [ ] Order number display
  - [ ] "Order confirmed!" heading + checkmark icon
  - [ ] Items purchased
  - [ ] Total amount paid
  - [ ] Delivery date estimate
  - [ ] "Confirmation email sent to [email]"
  - [ ] "Track order" button (links to account/orders)
  - [ ] "Continue Shopping" button
  - [ ] "Download Invoice" button

### Cycle 17: Create Account Pages (account/[page].astro)

- [ ] **Orders Page (account/orders.astro)**
  - [ ] List of all orders (paginated, 10 per page)
  - [ ] Order number, date, total, status
  - [ ] View details button
  - [ ] Download invoice button
  - [ ] Track shipment link
- [ ] **Order Details (account/order-[id].astro)**
  - [ ] Order number, date, status
  - [ ] Items purchased with images
  - [ ] Shipping address
  - [ ] Tracking number + link
  - [ ] Total paid + payment method
  - [ ] Return request button (if within 30 days)
  - [ ] Leave review button
- [ ] **Account Settings (account/settings.astro)**
  - [ ] Profile section (name, email)
  - [ ] Password change
  - [ ] Saved addresses
  - [ ] Payment methods
  - [ ] Notification preferences
  - [ ] Wishlist items

### Cycle 18: Create Static Pages

- [ ] **About (about.astro)**
  - [ ] Company story
  - [ ] Mission statement
  - [ ] Team members
  - [ ] Timeline
  - [ ] Press mentions
- [ ] **Contact (contact.astro)**
  - [ ] Contact form
  - [ ] Email address, phone
  - [ ] Store locations (if applicable)
  - [ ] Hours of operation
  - [ ] Social media links
- [ ] **FAQ (faq.astro)**
  - [ ] Accordion of common questions
  - [ ] Organized by category
- [ ] **Shipping & Returns (shipping-returns.astro)**
  - [ ] Shipping policy
  - [ ] Return window (30 days)
  - [ ] Return process steps
  - [ ] Refund timeline
  - [ ] International shipping info
- [ ] **Privacy Policy (privacy.astro)**
  - [ ] Legal text
- [ ] **Terms of Service (terms.astro)**
  - [ ] Legal text

### Cycle 19: Create Error Pages

- [ ] **404 Not Found (404.astro)**
  - [ ] Friendly message
  - [ ] Search products
  - [ ] Navigation links
- [ ] **500 Server Error (500.astro)**
  - [ ] Apologize
  - [ ] Suggest actions
  - [ ] Support email

### Cycle 20: Create Email Templates (Astro)

- [ ] **Order Confirmation Email:**
  - [ ] Order number, date
  - [ ] Items purchased
  - [ ] Total amount
  - [ ] Shipping address
  - [ ] Tracking number (when available)
  - [ ] Link to view order
  - [ ] Customer support contact
- [ ] **Shipping Notification Email:**
  - [ ] "Your order is on its way!"
  - [ ] Tracking number with link
  - [ ] Estimated delivery date
- [ ] **Return Confirmation Email:**
  - [ ] Return number
  - [ ] Refund amount
  - [ ] Return address
  - [ ] Timeline for refund

---

## PHASE 3: REACT COMPONENTS (Cycle 21-30)

**Purpose:** Build interactive React components for client-side functionality

### Cycle 21: Create ProductCard Component

- [ ] **Props:**
  - [ ] product (id, image, name, price, rating, category)
  - [ ] onAddToCart (callback)
  - [ ] onQuickView (callback)
- [ ] **Display:**
  - [ ] Product image (with hover zoom effect)
  - [ ] Category badge
  - [ ] Product name
  - [ ] Rating (stars + count)
  - [ ] Price (sale and original if on sale)
  - [ ] Availability badge
- [ ] **Interactions:**
  - [ ] Hover: Show "Add to Cart" button + "Quick View"
  - [ ] Click add: Trigger toast notification
  - [ ] Click quick view: Open modal

### Cycle 22: Create ProductQuickView Modal

- [ ] **Content:**
  - [ ] Main product image (large)
  - [ ] Product name, rating, price
  - [ ] Size/color selectors
  - [ ] Quantity picker
  - [ ] "Add to Cart" button
  - [ ] "View Full Details" link (to product page)
- [ ] **Behavior:**
  - [ ] Click outside closes modal
  - [ ] Escape key closes modal
  - [ ] Smooth open/close animation

### Cycle 23: Create ImageGallery Component

- [ ] **Features:**
  - [ ] Main image display (large)
  - [ ] Thumbnail strip (clickable)
  - [ ] Zoom on hover (magnifying glass)
  - [ ] Previous/next arrows
  - [ ] Keyboard navigation (arrow keys)
  - [ ] Mobile: Swipe to change images
  - [ ] Alt text for accessibility
- [ ] **Props:**
  - [ ] images (array of image URLs)
  - [ ] alt (product name for alt text)

### Cycle 24: Create SizeSelector Component

- [ ] **Display:**
  - [ ] Size options as buttons or chips
  - [ ] Show availability for each size
  - [ ] Selected size highlighted
- [ ] **Props:**
  - [ ] sizes (array with availability)
  - [ ] onSelect (callback)

### Cycle 25: Create ColorSelector Component

- [ ] **Display:**
  - [ ] Color swatches as circles
  - [ ] Color name on hover
  - [ ] Selected color has border/checkmark
- [ ] **Props:**
  - [ ] colors (array with color codes/names)
  - [ ] onSelect (callback)

### Cycle 26: Create QuantityPicker Component

- [ ] **Display:**
  - [ ] Minus button, number input, plus button
  - [ ] Min 1, max based on inventory
- [ ] **Props:**
  - [ ] maxQuantity (inventory count)
  - [ ] onChange (callback)

### Cycle 27: Create CartIcon Component

- [ ] **Display:**
  - [ ] Shopping cart icon
  - [ ] Item count badge (if > 0)
  - [ ] Highlight when items added
- [ ] **Behavior:**
  - [ ] Click to go to cart page
  - [ ] Show tooltip with item count on hover

### Cycle 28: Create AddToCartButton Component

- [ ] **Display:**
  - [ ] "Add to Cart" text
  - [ ] Loading spinner while processing
  - [ ] Success checkmark briefly
- [ ] **Props:**
  - [ ] onClick (callback)
  - [ ] isLoading (boolean)
  - [ ] className (for styling)

### Cycle 29: Create ProductFilter Component

- [ ] **Sections:**
  - [ ] Category filter (checkboxes)
  - [ ] Price range (slider)
  - [ ] Rating filter (stars)
  - [ ] Clear all button
- [ ] **Behavior:**
  - [ ] Update URL params as user filters
  - [ ] Mobile: Collapsible/drawer
  - [ ] Desktop: Sidebar

### Cycle 30: Create SearchBar Component

- [ ] **Features:**
  - [ ] Text input
  - [ ] Search icon
  - [ ] Clear button (when typing)
  - [ ] Search suggestions (dropdown)
  - [ ] Submit on enter or button click
- [ ] **Props:**
  - [ ] onSearch (callback with query)
  - [ ] placeholder (search placeholder text)

---

## PHASE 4: STRIPE INTEGRATION (Cycle 31-40)

**Purpose:** Integrate Stripe payment processing for checkout

### Cycle 31: Set Up Stripe Environment

- [ ] **Get Stripe Keys:**
  - [ ] Create Stripe account
  - [ ] Get publishable key (public)
  - [ ] Get secret key (private, backend only)
- [ ] **Add to Environment:**
  - [ ] `PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`
  - [ ] `STRIPE_SECRET_KEY` in backend `.env.local`
- [ ] **Install Dependencies:**
  - [ ] `bun add @stripe/stripe-js`
  - [ ] `bun add @stripe/react-stripe-js`

### Cycle 32: Create StripePaymentForm Component

- [ ] **Structure:**
  - [ ] Elements provider (wraps form)
  - [ ] CardElement (Stripe hosted input)
  - [ ] Billing email input
  - [ ] Billing zip code (prepopulated)
  - [ ] Save card checkbox
  - [ ] Error message display
  - [ ] Processing state
- [ ] **Props:**
  - [ ] onSubmit (callback with payment method)
  - [ ] clientSecret (from backend payment intent)

### Cycle 33: Create StripeElements Configuration

- [ ] **Initialize Stripe:**
  - [ ] Load Stripe.js with public key
  - [ ] Create Elements instance
  - [ ] Configure styling (fonts, colors, focus states)
- [ ] **CardElement Options:**
  - [ ] Placeholder text
  - [ ] Font matching site
  - [ ] Focus state styling
  - [ ] Error state styling

### Cycle 34: Create Payment Intent API Handler

- [ ] **Frontend function:**
  - [ ] Call backend to create payment intent
  - [ ] Receive clientSecret
  - [ ] Pass to payment form
- [ ] **Backend stub:**
  - [ ] Accept cart data
  - [ ] Calculate total
  - [ ] Create Stripe payment intent
  - [ ] Return clientSecret

### Cycle 35: Create Payment Confirmation Handler

- [ ] **After form submit:**
  - [ ] Use Stripe.confirmCardPayment()
  - [ ] Pass clientSecret + payment details
  - [ ] Handle success (show confirmation)
  - [ ] Handle error (show error message)
  - [ ] Handle 3D Secure redirect (if needed)

### Cycle 36: Create Order Submission Flow

- [ ] **Sequence:**
  1. User completes checkout form
  2. Create payment intent on backend
  3. Show Stripe payment form
  4. User enters card details
  5. Confirm payment
  6. If successful, create order on backend
  7. Show confirmation page
- [ ] **Error handling:**
  - [ ] Invalid card → show message
  - [ ] Declined card → suggest retry
  - [ ] Network error → retry option

### Cycle 37: Create Cart State Management (Zustand)

- [ ] **Store structure:**
  - [ ] items (array)
  - [ ] addItem (fn)
  - [ ] removeItem (fn)
  - [ ] updateQuantity (fn)
  - [ ] clear (fn)
  - [ ] total (computed)
  - [ ] itemCount (computed)
- [ ] **Persistence:**
  - [ ] Save to localStorage
  - [ ] Load from localStorage on init
  - [ ] Sync across tabs

### Cycle 38: Create Order State Management

- [ ] **Store structure:**
  - [ ] currentOrder (object)
  - [ ] setOrder (fn)
  - [ ] clearOrder (fn)
  - [ ] orders (array, for logged-in users)
  - [ ] addOrder (fn)
- [ ] **Data:**
  - [ ] Order ID, date, items, total, status
  - [ ] Shipping address, tracking number

### Cycle 39: Create Toast/Notification System

- [ ] **Types:**
  - [ ] Success (green)
  - [ ] Error (red)
  - [ ] Info (blue)
  - [ ] Warning (orange)
- [ ] **Features:**
  - [ ] Auto-dismiss after 5 seconds
  - [ ] Stack multiple toasts
  - [ ] Dismiss button
  - [ ] Undo action button (optional)
- [ ] **Use cases:**
  - [ ] "Added to cart" success
  - [ ] "Item removed" success
  - [ ] Payment error message
  - [ ] Form validation error

### Cycle 40: Create Loading States

- [ ] **Spinners:**
  - [ ] Full page loader (checkout)
  - [ ] Component loader (button, form)
  - [ ] Skeleton loaders (product grid)
- [ ] **Disabled states:**
  - [ ] Disable buttons while loading
  - [ ] Disable form inputs while processing
  - [ ] Show loading text/icons

---

## PHASE 5: MOBILE OPTIMIZATION (Cycle 41-50)

**Purpose:** Ensure flawless mobile experience (80% of users)

### Cycle 41: Test Mobile Navigation

- [ ] **Header changes:**
  - [ ] Logo (smaller on mobile)
  - [ ] Search (collapsible or moved to page)
  - [ ] Cart icon (always visible)
  - [ ] Account menu (hamburger)
- [ ] **Hamburger Menu:**
  - [ ] Navigation links
  - [ ] Account link
  - [ ] Settings link
  - [ ] Logout link

### Cycle 42: Optimize Forms for Mobile

- [ ] **Checkout form changes:**
  - [ ] Full-width inputs
  - [ ] Large labels
  - [ ] 16px font size (prevents zoom on iOS)
  - [ ] Larger touch targets (48px buttons)
  - [ ] Auto-focus first field
  - [ ] Mobile keyboard types (email, tel, number)
  - [ ] One field per line (no side-by-side on small screens)

### Cycle 43: Optimize Product Pages for Mobile

- [ ] **Image gallery:**
  - [ ] Swipe to change images
  - [ ] Touch-friendly thumbnails
  - [ ] Avoid hover states
- [ ] **Product info:**
  - [ ] Stack vertically
  - [ ] Larger font sizes
  - [ ] Prominent "Add to Cart" button
- [ ] **Scroll behavior:**
  - [ ] Sticky "Add to Cart" button at bottom
  - [ ] Smooth scroll to quantity picker

### Cycle 44: Optimize Checkout for Mobile

- [ ] **Step-by-step:**
  - [ ] Show one step per screen
  - [ ] Progress indicator above content
  - [ ] Large next/back buttons
- [ ] **Order summary:**
  - [ ] Collapse on mobile (expandable)
  - [ ] Show on each step
  - [ ] Sticky at bottom with total

### Cycle 45: Test Touch Interactions

- [ ] **Size controls:**
  - [ ] Large, touchable buttons for size/color
  - [ ] Clear visual feedback (highlight on select)
  - [ ] No hover-only info
- [ ] **Buttons:**
  - [ ] 48px minimum height
  - [ ] 16px padding
  - [ ] Clear labels

### Cycle 46: Optimize Image Loading

- [ ] **Lazy loading:**
  - [ ] Load images as user scrolls
  - [ ] Use `loading="lazy"` attribute
  - [ ] Show placeholder while loading
- [ ] **Responsive images:**
  - [ ] Serve smaller images on mobile
  - [ ] Use `srcset` for multiple sizes
  - [ ] WebP format with fallback
- [ ] **Image optimization:**
  - [ ] Compress images
  - [ ] Remove EXIF data
  - [ ] Use CDN for fast delivery

### Cycle 47: Optimize Performance on Mobile

- [ ] **Reduce bundle size:**
  - [ ] Code split by route
  - [ ] Lazy load heavy components
  - [ ] Remove unused CSS/JS
- [ ] **Network optimization:**
  - [ ] Gzip responses
  - [ ] Cache static assets
  - [ ] Minimize API calls
- [ ] **Rendering optimization:**
  - [ ] Avoid large layouts
  - [ ] Use `client:load` sparingly
  - [ ] Optimize React components

### Cycle 48: Test on Real Devices

- [ ] **Devices:**
  - [ ] iPhone SE (375px)
  - [ ] iPhone 12 (390px)
  - [ ] iPhone 14 Pro (430px)
  - [ ] Samsung Galaxy S21 (360px)
  - [ ] iPad (768px)
- [ ] **Browsers:**
  - [ ] Safari (iOS)
  - [ ] Chrome (Android)
  - [ ] Samsung Internet
- [ ] **Conditions:**
  - [ ] Slow 4G network
  - [ ] High latency (3000ms)
  - [ ] Battery saver mode

### Cycle 49: Fix Mobile Issues

- [ ] **Common issues:**
  - [ ] Fixed headers blocking content
  - [ ] Horizontal scrolling
  - [ ] Invisible form fields
  - [ ] Unresponsive buttons
  - [ ] Text too small
  - [ ] Images not loading
- [ ] **Testing:**
  - [ ] Chrome DevTools mobile view
  - [ ] Browser testing tools (BrowserStack)
  - [ ] Real device testing

### Cycle 50: Add Mobile-Specific Features

- [ ] **PWA features (optional):**
  - [ ] Install app prompt
  - [ ] Offline support
  - [ ] Push notifications
- [ ] **Mobile gestures:**
  - [ ] Pull to refresh
  - [ ] Swipe navigation
  - [ ] Tap to expand

---

## PHASE 6: TESTING & QA (Cycle 51-60)

**Purpose:** Comprehensive testing of all features

### Cycle 51: Test Product Pages

- [ ] **Functionality:**
  - [ ] Product loads correctly
  - [ ] Images display and zoom
  - [ ] Variant selectors work
  - [ ] Quantity picker increments/decrements
  - [ ] Add to cart adds item
  - [ ] Add to wishlist works
  - [ ] Share buttons work
- [ ] **Edge cases:**
  - [ ] Out of stock handling
  - [ ] Maximum quantity restriction
  - [ ] Missing images (fallback)
  - [ ] Very long product names/descriptions

### Cycle 52: Test Shopping Cart

- [ ] **Functionality:**
  - [ ] Items persist in cart
  - [ ] Update quantity works
  - [ ] Remove item works
  - [ ] Clear cart works
  - [ ] Cart total calculates correctly
  - [ ] Cart icon shows count
- [ ] **Edge cases:**
  - [ ] Add same item twice (increase qty)
  - [ ] Remove last item
  - [ ] Maximum inventory limit
  - [ ] LocalStorage sync across tabs

### Cycle 53: Test Checkout Flow

- [ ] **Each step:**
  - [ ] Step 1: Cart review loads
  - [ ] Step 2: Shipping form validates
  - [ ] Step 3: Billing address toggle works
  - [ ] Step 4: Shipping methods display
  - [ ] Step 5: Summary correct
  - [ ] Step 6: Payment form loads
  - [ ] Step 7: Confirmation shows
- [ ] **Navigation:**
  - [ ] Next button works
  - [ ] Back button works
  - [ ] Can't skip steps
  - [ ] Can go back to previous step

### Cycle 54: Test Form Validation

- [ ] **Required fields:**
  - [ ] All required fields validated
  - [ ] Error messages displayed
  - [ ] User can't submit invalid form
- [ ] **Specific validation:**
  - [ ] Email format validation
  - [ ] Phone number format (US)
  - [ ] Zip code format (US)
  - [ ] Card details validation (via Stripe)
- [ ] **Error messages:**
  - [ ] Clear and helpful
  - [ ] Highlight invalid field
  - [ ] Suggest correction

### Cycle 55: Test Stripe Integration

- [ ] **Payment flow:**
  - [ ] Payment form loads
  - [ ] User can enter card
  - [ ] Valid card processes
  - [ ] Invalid card shows error
  - [ ] Confirmation shows order
- [ ] **Card testing (use Stripe test cards):**
  - [ ] 4242 4242 4242 4242 (visa - success)
  - [ ] 4000 0000 0000 0002 (visa - declined)
  - [ ] 3782 822463 10005 (amex)
  - [ ] Various error scenarios

### Cycle 56: Test Search & Filters

- [ ] **Search:**
  - [ ] Search by product name
  - [ ] Search by category
  - [ ] No results handling
  - [ ] Partial matches work
  - [ ] Search suggestions appear
- [ ] **Filters:**
  - [ ] Category filter works
  - [ ] Price range filter works
  - [ ] Rating filter works
  - [ ] Multiple filters combine correctly
  - [ ] Clear filters button works

### Cycle 57: Test Cross-Browser

- [ ] **Desktop browsers:**
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] **Mobile browsers:**
  - [ ] Safari (iOS)
  - [ ] Chrome (Android)
  - [ ] Samsung Internet
- [ ] **Issues to check:**
  - [ ] Layout problems
  - [ ] Missing styles
  - [ ] JavaScript errors
  - [ ] Form input issues

### Cycle 58: Test Accessibility

- [ ] **Keyboard navigation:**
  - [ ] Tab through form
  - [ ] Enter submits form
  - [ ] Escape closes modals
  - [ ] Focus visible on all elements
- [ ] **Screen reader (NVDA, JAWS):**
  - [ ] All text readable
  - [ ] Images have alt text
  - [ ] Form labels associated
  - [ ] Button purposes clear
- [ ] **Color contrast:**
  - [ ] Text on background >= 4.5:1
  - [ ] Icons on background >= 3:1
- [ ] **WCAG 2.1 AA compliance:**
  - [ ] Use axe DevTools
  - [ ] Check for violations

### Cycle 59: Test Performance

- [ ] **Lighthouse audit:**
  - [ ] Performance > 85
  - [ ] Accessibility > 90
  - [ ] Best Practices > 90
  - [ ] SEO > 90
- [ ] **Core Web Vitals:**
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] **Bundle size:**
  - [ ] JS < 100KB (gzipped)
  - [ ] CSS < 50KB (gzipped)
  - [ ] Total < 200KB

### Cycle 60: Test Edge Cases

- [ ] **Scenarios:**
  - [ ] Network disconnection (checkout)
  - [ ] Browser back button during checkout
  - [ ] Multiple tabs with same order
  - [ ] Session timeout
  - [ ] Extremely long product names
  - [ ] Special characters in address
  - [ ] International addresses
  - [ ] Rate limiting (repeated requests)

---

## PHASE 7: DEPLOYMENT & OPTIMIZATION (Cycle 61-70)

**Purpose:** Deploy to Cloudflare Pages and optimize for production

### Cycle 61: Prepare for Deployment

- [ ] **Build optimization:**
  - [ ] Run `bun run build`
  - [ ] Check for build errors
  - [ ] Review bundle size
  - [ ] Minification working
- [ ] **Environment setup:**
  - [ ] Set production Stripe key
  - [ ] Set production API endpoints
  - [ ] Enable security headers
  - [ ] Set up CORS properly

### Cycle 62: Deploy to Cloudflare Pages

- [ ] **Deployment steps:**
  - [ ] Connect GitHub repo
  - [ ] Set build command: `bunx astro build`
  - [ ] Set output directory: `dist`
  - [ ] Set node version
  - [ ] Deploy
- [ ] **Verify deployment:**
  - [ ] Site loads correctly
  - [ ] All pages accessible
  - [ ] Forms work
  - [ ] Images load
  - [ ] Stripe test mode active

### Cycle 63: Set Up Analytics

- [ ] **Google Analytics (or Plausible):**
  - [ ] Add tracking code
  - [ ] Track page views
  - [ ] Track custom events (add to cart, checkout)
  - [ ] Set up goals (purchase)
- [ ] **Stripe analytics:**
  - [ ] Track payment events
  - [ ] Monitor declined cards
  - [ ] Track refunds
  - [ ] Revenue reporting

### Cycle 64: Monitor Site Health

- [ ] **Error tracking (Sentry or similar):**
  - [ ] Set up error reporting
  - [ ] Monitor JavaScript errors
  - [ ] Monitor API errors
  - [ ] Alert on critical errors
- [ ] **Uptime monitoring:**
  - [ ] Set up status page
  - [ ] Monitor site availability
  - [ ] Alert on downtime

### Cycle 65: Set Up Email Infrastructure

- [ ] **Email service (Resend or SendGrid):**
  - [ ] Create account
  - [ ] Set up sender domain
  - [ ] Create email templates
  - [ ] Test sending
- [ ] **Emails to set up:**
  - [ ] Order confirmation
  - [ ] Shipping notification
  - [ ] Return confirmation

### Cycle 66: Implement Security

- [ ] **HTTPS:**
  - [ ] Verify SSL certificate
  - [ ] Force HTTPS redirect
  - [ ] Check certificate expiry
- [ ] **Headers:**
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Referrer-Policy
- [ ] **Stripe security:**
  - [ ] Never log card data
  - [ ] Use Stripe.js
  - [ ] Validate on backend

### Cycle 67: Optimize Images for Production

- [ ] **Image compression:**
  - [ ] Use TinyPNG or similar
  - [ ] Remove metadata
  - [ ] Save as WebP
  - [ ] Create multiple sizes
- [ ] **Srcset optimization:**
  - [ ] 1x and 2x versions
  - [ ] Mobile and desktop sizes
  - [ ] Lazy load all images
  - [ ] Use modern formats with fallback

### Cycle 68: Implement Caching Strategy

- [ ] **Browser caching:**
  - [ ] Cache static assets 1 year
  - [ ] Cache images 1 month
  - [ ] Cache HTML 1 hour
  - [ ] No cache for API responses
- [ ] **Cloudflare Page Rules:**
  - [ ] Cache everything (except API)
  - [ ] Set minimum cache TTL
  - [ ] Purge cache on deploy

### Cycle 69: Set Up Custom Domain

- [ ] **Domain setup:**
  - [ ] Point domain to Cloudflare
  - [ ] Set up SSL/TLS
  - [ ] Configure DNS
  - [ ] Test from custom domain
- [ ] **Email setup (optional):**
  - [ ] Set up SPF record
  - [ ] Set up DKIM
  - [ ] Set up DMARC

### Cycle 70: Create Deployment Checklist

- [ ] **Before going live:**
  - [ ] All tests passing
  - [ ] No console errors
  - [ ] Lighthouse > 85
  - [ ] Stripe test transaction successful
  - [ ] Email sending working
  - [ ] Analytics installed
  - [ ] 404 page custom
  - [ ] All links working
  - [ ] Forms validating
  - [ ] Mobile responsive

---

## SUCCESS CRITERIA

Frontend ecommerce store is complete when:

- ✅ Home page displays beautifully with hero, featured products, testimonials
- ✅ Product catalog with search, filters, and sorting functional
- ✅ Product detail pages show all information (images, price, reviews, variants)
- ✅ Shopping cart persists items across sessions
- ✅ Checkout flow validates all required information
- ✅ Stripe payment integration accepts test cards
- ✅ Order confirmation page displays with order details
- ✅ Mobile responsive on all screen sizes (375px - 2560px)
- ✅ Lighthouse score > 85 on all metrics
- ✅ Cross-browser tested (Chrome, Firefox, Safari, Edge)
- ✅ Accessible (WCAG 2.1 AA compliant)
- ✅ First test purchase completed successfully
- ✅ Deployed to Cloudflare Pages and live at custom domain
- ✅ Analytics tracking page views and purchases
- ✅ Error handling and user feedback (toasts, validation)

---

**Timeline:** 70-80 cycles for complete implementation
**Status:** Ready to build
**Next:** Use Claude Code to implement step by step following cycle sequence

---

## COPY THIS PROMPT TO CLAUDE CODE

```
Build a complete ecommerce storefront frontend with Astro 5 and React 19:

REQUIREMENTS:
1. Homepage with hero, featured products, best sellers, testimonials
2. Product catalog page with search, category filters, price filter, sorting
3. Product detail pages showing images gallery, variant selectors (size/color), reviews
4. Shopping cart with persistent storage (localStorage)
5. Multi-step checkout: cart → shipping → billing → shipping method → review → payment → confirmation
6. Stripe payment integration (use test keys)
7. Mobile-optimized (80% of users on mobile, 48px buttons, swipeable galleries)
8. Responsive design (works on 375px mobile to 2560px desktop)
9. Dark mode support with Tailwind v4
10. Accessibility (WCAG 2.1 AA, keyboard nav, alt text, color contrast)

DESIGN SYSTEM:
- Use the existing shadcn/ui components from your library
- Color palette: Primary (brand), secondary (accents), success (green), neutral (grays)
- Typography: H1 36px, H2 28px, H3 24px, body 16px
- Spacing: 4px, 8px, 16px, 24px, 32px, 48px (multiples of 4)
- Buttons: 48px height minimum, rounded corners, hover effects

TECHNICAL:
- Use Astro pages for static content (product listings, checkout steps)
- Use React components (`client:load`) for interactive features (cart, payment form, filters)
- Use Zustand for state management (cart items, orders)
- Stripe Elements for secure payment form
- localStorage for cart persistence
- Mobile-first responsive design (Tailwind v4)

DEPLOYMENT:
- Build target: Cloudflare Pages
- Deploy command: `bun run build && wrangler pages deploy dist`
- Set up Stripe test mode with publishable key in .env.local

Start with the foundation (Astro pages and layouts), then add React components, then integrate Stripe.
```
