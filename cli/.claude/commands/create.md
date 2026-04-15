# /create - Template-First Feature Creation

**Build features in minutes, not hours. Copy existing templates, customize, ship.**

---

## Quick Start: Tell Me What You Want

When you type `/create`, just tell me what you want to build:

```
"I want to create a page that sells a product"
"I need a landing page for my course"
"Build me a checkout page with Stripe"
"I want a portfolio gallery"
```

**I'll handle the rest:**
1. 🔍 Search for existing templates
2. 📋 Copy the best match
3. ✨ Customize for your needs
4. 🚀 Ask what you want to add next

**No planning. No complexity. Just fast, conversational feature building.**

---

## The Template-First Approach

**CRITICAL RULE:** Before building ANYTHING new, search for existing templates.

### Step 1: Understanding Your Request

When you say "I want to create a page that sells a [product]", I automatically:

1. **Search for templates:**
   - Product landing pages: `/web/src/pages/shop/*.astro`
   - Similar pages: `/web/src/pages/**/*.astro`
   - Reusable components: `/web/src/components/**/*.tsx`

2. **Pick the best template:**
   - **Product landing?** → `/web/src/pages/shop/product-landing.astro`
   - **Course landing?** → Search for course pages
   - **Service landing?** → Search for service pages
   - **Custom?** → Find closest match

3. **Copy and customize:**
   - Create your new page from template
   - Swap product data
   - Update branding
   - Keep proven structure

### Step 2: Interactive Refinement

After creating your page, I'll ask:

```
✅ Your product landing page is ready at /shop/your-product!

🎨 What would you like to add or change?

Or would you like to add credit card processing with Stripe?
```

**You can say:**
- "Change the colors to match my brand"
- "Add a video demo section"
- "Make the CTA button bigger"
- "Yes, add Stripe payments"
- "Add customer testimonials"
- "I want this as my home page"

### Step 3: Stripe Integration (Optional)

If you request Stripe, I'll guide you:

```
🔐 To enable Stripe payments, I need your API keys.

1. Get your keys from https://dashboard.stripe.com/apikeys
2. Paste them here:

PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

📚 Full setup guide: https://one.ie/docs/develop/stripe
```

---

## Template Mapping Rules

**When you request a feature, I automatically map to templates:**

| Your Request | Template Used | Path |
|--------------|--------------|------|
| "sell a product" | Product landing page | `/web/src/pages/shop/product-landing.astro` |
| "sell a course" | Search course pages | `/web/src/pages/**/*course*.astro` |
| "portfolio gallery" | Search portfolio pages | `/web/src/pages/**/*portfolio*.astro` |
| "blog" | Blog template | `/web/src/pages/blog/*.astro` |
| "landing page" | Landing template | `/web/src/pages/index.astro` or similar |
| "checkout" | Checkout flow | `/web/src/pages/shop/*checkout*.astro` |
| "dashboard" | Dashboard layout | `/web/src/pages/*dashboard*.astro` |

**If no exact match exists, I search for the closest pattern and adapt it.**

---

## Product Landing Template (Built-In)

We have a **conversion-optimized product landing page** ready to use:

**Location:** `/web/src/pages/shop/product-landing.astro`

**Features:**
- ✅ Fetches ANY product from DummyJSON API
- ✅ Auto-generates features, specs, reviews based on category
- ✅ Adapts trust badges, CTA text, and sections automatically
- ✅ Supports 10+ product categories (fragrances, smartphones, clothing, etc.)
- ✅ Mobile-responsive with dark mode support
- ✅ Optional Stripe integration for payments

**Supported Categories:**
- Fragrances → Includes fragrance notes, luxury features
- Smartphones → Tech specs, display/camera features
- Laptops → Performance specs, tech features
- Clothing → Size exchange, fit information
- Furniture → Dimensions, material details
- Beauty → Ingredients, skin type info
- Groceries → Fresh guarantee, nutritional info

**How It Works:**
```astro
---
// 1. Fetch product from DummyJSON
const response = await fetch('https://dummyjson.com/products/1');
const productData = await response.json();

// 2. Use template helpers to generate content
import {
  getOriginalPrice,
  getTrustBadges,
  getProductFeatures,
  getProductSpecs,
  getCTAText,
} from '@/lib/productTemplateHelpers';

const product = {
  title: productData.title,
  price: productData.price,
  // ... more fields
};

const specs = getProductSpecs(productData);
const features = getProductFeatures(productData);
const trustBadges = getTrustBadges(productData.category);
---

<!-- 3. Render with dynamic sections -->
<ProductHeader productName={product.title} />
<ProductGallery images={product.images} />
<FeaturesWithImages features={features} />
<ProductSpecs specs={specs} />
```

**Template README:** `/web/src/pages/shop/TEMPLATE-README.md`

**When you say "I want to sell [product]", I'll:**
1. Use this template as the foundation
2. Fetch data for your product category
3. Customize branding and content
4. Ask if you want it as your home page

---

## The Fast, Conversational Workflow

### Example 1: Selling a Product

**You:** "I want to create a page that sells a perfume"

**Me:**
```
🔍 Found the perfect template! Using our product landing page...

✨ Creating your perfume landing page...

I'll use the Chanel Coco Noir template as a starting point.
Customizing for your brand...

✅ Done! Your perfume landing page is ready at:
   /shop/perfume

🎨 What would you like to add or change?

Or would you like to add credit card processing with Stripe?
```

**You:** "Yes, add Stripe"

**Me:**
```
🔐 Great! To enable Stripe payments, I need your API keys.

1. Sign up at https://stripe.com (if you haven't already)
2. Get your test keys from Dashboard → Developers → API Keys
3. Paste them here:

PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

📚 Full setup guide: https://one.ie/docs/develop/stripe
```

**You:** *(pastes keys)*

**Me:**
```
✅ Stripe integrated! Your customers can now pay with credit cards.

🧪 Test with these cards:
- 4242 4242 4242 4242 (success)
- 4000 0025 0000 3155 (requires 3D Secure)

Your perfume page now has:
- ✅ Product gallery with zoom
- ✅ Add to cart with quantity
- ✅ Secure Stripe checkout
- ✅ Order confirmation page
- ✅ Email receipts (from Stripe)

🎨 What else would you like to add or change?
```

### Example 2: Making It Your Home Page

**You:** "I want this as my home page"

**Me:**
```
✅ Perfect! I'll set your perfume page as the home page.

Updating /src/pages/index.astro to use your product landing...

Done! Now when visitors go to your site, they'll see your perfume
landing page first.

🌐 Test it: http://localhost:4321

🎨 What would you like to add or change next?
```

### Example 3: Adding Features

**You:** "Add customer testimonials"

**Me:**
```
✨ Adding a testimonials section to your page...

I'll place it after the product features, before the FAQ.

✅ Done! Your page now includes:
- 5-star reviews from customers
- Star ratings
- Customer names and dates
- Social proof section

🎨 What else would you like to add?
```

---

## Template Discovery Process

**Before implementing ANYTHING, I ALWAYS:**

### 1. Search Existing Pages

```bash
# Search for pages by keyword
find /Users/toc/Server/ONE/web/src/pages -name "*product*.astro"
find /Users/toc/Server/ONE/web/src/pages -name "*landing*.astro"
find /Users/toc/Server/ONE/web/src/pages -name "*shop*.astro"
```

### 2. Search Components

```bash
# Search for reusable components
find /Users/toc/Server/ONE/web/src/components -name "*Product*.tsx"
find /Users/toc/Server/ONE/web/src/components -name "*Card*.tsx"
find /Users/toc/Server/ONE/web/src/components -name "*Checkout*.tsx"
```

### 3. Analyze Template Structure

- Read template README (if exists)
- Identify reusable sections
- Note customization points
- Check for helper functions

### 4. Copy & Customize (Never Build from Scratch)

```astro
---
// Copy template
// Swap data source
// Update branding
// Keep proven structure
---
```

---

## Feature Request Examples

**Just tell me what you want. I'll handle the template search and customization.**

### E-commerce

```
"I want to sell a t-shirt"
"I need a checkout page"
"Add a shopping cart"
"Create a product catalog"
```

### Marketing

```
"I want a landing page for my app"
"Create a pricing page"
"Add a newsletter signup"
"Build a contact form"
```

### Content

```
"I want a blog"
"Create an article page"
"Add a portfolio gallery"
"Build a case study template"
```

### Business

```
"I need a dashboard"
"Create an analytics page"
"Add user profiles"
"Build an admin panel"
```

---

## Warm, Encouraging Feedback

**I'll guide you every step with clear, friendly messages:**

```
✅ Perfect! I found a great template for that...

🔍 Searching for existing templates...

✨ Creating your [feature] from our [template] template...

🎨 What would you like to add or change?

🚀 You're making great progress! What's next?

💡 Tip: You can add Stripe payments in just 2 minutes!

🌟 Your [feature] is live! Test it and tell me what you think.
```

---

## Built-In Templates

### Shop Templates

**Location:** `/web/src/pages/shop/`

- `product-landing.astro` - Conversion-optimized product page
- Template README with full documentation
- Helper functions in `/web/src/lib/productTemplateHelpers.ts`

**Components:**
- `ProductHeader` - Header with cart and dark mode
- `ProductGallery` - Image gallery with zoom
- `InlineUrgencyBanner` - Stock countdown
- `FeaturesWithImages` - Feature sections
- `ProductSpecs` - Specifications table
- `FragranceNotes` - Category-specific (fragrances)
- `ReviewsSection` - Customer reviews
- `ProductFAQ` - Common questions
- `StickyBuyBar` - Floating purchase bar
- `RecentPurchaseToast` - Social proof

### More Templates (Search & Discover)

I'll search for templates based on your request:

- Blog pages in `/web/src/pages/blog/`
- Portfolio pages in `/web/src/pages/portfolio/`
- Dashboard pages in `/web/src/pages/dashboard/`
- Documentation pages in `/web/src/pages/docs/`

**If a template doesn't exist yet, I'll:**
1. Find the closest existing pattern
2. Adapt it to your needs
3. Document it as a new template
4. Suggest adding it to the template library

---

## Stripe Integration Guide

**When you're ready to add payments:**

### Step 1: Get Your Keys

1. Sign up at https://stripe.com
2. Go to Dashboard → Developers → API Keys
3. Copy your Publishable key (starts with `pk_test_...`)
4. Copy your Secret key (starts with `sk_test_...`)

### Step 2: Paste Keys

```bash
# I'll ask you to paste these:
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: I'll Configure Everything

I'll automatically:
- Add Stripe SDK to dependencies
- Create `.env.local` file
- Update product page with checkout flow
- Add success/cancel pages
- Configure webhook handling (optional)

### Step 4: Test Payments

Use these test cards:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Payment succeeds |
| 4000 0025 0000 3155 | Requires 3D Secure |
| 4000 0000 0000 9995 | Declined (insufficient funds) |

**Expiry:** Any future date (e.g., 12/34)
**CVC:** Any 3 digits (e.g., 123)
**ZIP:** Any 5 digits (e.g., 12345)

**Full guide:** https://one.ie/docs/develop/stripe

---

## Pro Tips

### Start with Templates

- ✅ Copy existing pages and customize
- ✅ Reuse proven components
- ✅ Keep tested patterns
- ❌ Never build from scratch

### Iterate Fast

- ✅ Build basic version first
- ✅ Get feedback
- ✅ Add features incrementally
- ❌ Don't plan for hours

### Ask for Help

- ✅ "Add Stripe payments"
- ✅ "Change the colors"
- ✅ "Make it my home page"
- ❌ Don't struggle alone

### Ship Often

- ✅ Deploy early and often
- ✅ Test with real users
- ✅ Iterate based on feedback
- ❌ Don't wait for perfect

---

## Golden Rules

1. **Template-first:** ALWAYS search for existing templates before building
2. **Copy, don't create:** Reuse proven patterns, customize for your needs
3. **Fast iteration:** Build basic version, get feedback, iterate
4. **Conversational:** Just tell me what you want, I'll handle the technical details
5. **Encouraging:** Every step should feel fast, easy, and exciting

---

## Commands

```bash
/create                           # Start feature wizard (tell me what you want)
/create [feature-name]            # Create specific feature (I'll find templates)

# Examples:
/create                           # "I want to sell a product"
/create product-page              # Uses product landing template
/create checkout                  # Searches for checkout templates
/create blog                      # Uses blog templates
```

---

## What Happens Next?

After I create your feature, I'll ask:

```
🎨 What would you like to add or change?

Suggestions:
- Add credit card processing with Stripe
- Change colors to match your brand
- Add customer testimonials
- Make this your home page
- Add a video demo section
- Add live chat support

Just tell me what you want, and I'll make it happen!
```

---

**Golden Rule:** Copy existing templates. Customize fast. Ship often. Make it yours.

**Your success is my success. Let's build something amazing together! 🚀**
