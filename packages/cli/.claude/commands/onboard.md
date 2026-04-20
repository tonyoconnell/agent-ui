# /onboard - Template-First Guided Onboarding

## Instructions for Claude

When user types `/onboard`, guide them through a conversational, template-first onboarding experience.

### Step 1: Warm Welcome & Discovery

Greet the user warmly and ask what they want to build:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Welcome to ONE Platform!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's build something amazing together.

What would you like to create today?

💡 Examples:
• "I want to sell coffee mugs"
• "I need a landing page for my new product"
• "I'm launching an online course"
• "I want to build a creator subscription page"
• "I need a shop for my handmade goods"

Tell me about your idea, and I'll help you get started in minutes!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 2: Map to Templates

Based on their response, identify the best template and explain the match:

#### E-commerce / Product / Shop Keywords
**Triggers:** "sell", "product", "shop", "store", "buy", "merchandise", "goods"

**Response:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Perfect! I can help you create a beautiful product page.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I have a complete e-commerce template that includes:
✓ Stunning product gallery with zoom
✓ Customer reviews section
✓ Urgency banners (stock levels, countdown)
✓ Mobile-optimized design
✓ Dark mode support
✓ Ready for Stripe payments

This usually takes hours to build from scratch, but with our template,
we can have your product page live in just a few minutes.

Let's get started! Tell me about your product:
• What's the product name?
• What's the price?
• Do you have product images? (or I can use beautiful stock photos)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Course / Learning Keywords
**Triggers:** "course", "teach", "learning", "education", "training", "lesson"

**Response:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Excellent! Let's build your online course platform.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I have a learning management template that includes:
✓ Course catalog with search/filter
✓ Course detail pages with curriculum
✓ Instructor profiles
✓ Progress tracking UI
✓ Video player integration ready
✓ Certificate generation ready

Tell me about your course:
• What's the course title?
• What will students learn?
• Do you have course content ready?

Let's create something amazing!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Creator / Content Keywords
**Triggers:** "creator", "content", "newsletter", "subscribe", "membership", "audience"

**Response:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Great choice! Let's build your creator platform.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I have a creator template that includes:
✓ Personal brand showcase
✓ Content feed (blog/videos/podcasts)
✓ Subscription tiers
✓ Member-only content gates
✓ Social proof (testimonials, stats)
✓ Newsletter signup

Tell me about your brand:
• What's your creator name or brand?
• What type of content do you create?
• What monetization model? (tips, subscriptions, products)

Let's build your audience!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 3: Create from Template

Use the Task tool to spawn agent-builder in background mode:

```
Create [product/course/creator] page from template:

Template: /web/src/pages/shop/product-landing.astro (or appropriate template)

Customization:
- Title: [user's product/course/brand name]
- Description: [user's description]
- Price: [user's price or default]
- Images: [use DummyJSON API or provided images]
- Category: [inferred category]

Steps:
1. Copy template to appropriate route
2. Update product/course/creator data
3. Customize branding (colors, fonts if provided)
4. Ensure mobile responsiveness
5. Test all sections render correctly

Output: Complete page at [route]
```

### Step 4: Show Progress & First Success

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 Creating your page...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Template copied
✓ Product data configured
✓ Gallery set up with images
✓ Reviews section added
✓ Mobile optimization applied

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Your page is ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View your new page at:
http://localhost:4321/shop/[product-slug]

Try these commands:
• /see - Open in browser
• /server - Manage dev server
```

### Step 5: Offer Enhancements

After successful creation, offer next steps in priority order:

#### Option 1: Make it the Homepage
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Pro Tip
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would you like this to be your homepage?

I can make it so visitors see your product immediately when they
land on your site. Just say:

"Make this my homepage"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Option 2: Add Stripe Payments
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 Ready to Accept Payments?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I can integrate Stripe checkout in minutes. Your customers will be
able to buy directly from your page with:

✓ Secure card payments
✓ Automatic email receipts
✓ Test mode (no real charges during development)
✓ Mobile-optimized checkout

To add Stripe:
1. Get free test keys: https://dashboard.stripe.com/test/apikeys
2. Tell me: "Add Stripe payments"
3. Paste your keys when I ask

Or read the guide: https://one.ie/docs/develop/stripe
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Option 3: Customize Branding
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 Customize Your Brand
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Want to match your brand colors and style?

You can customize:
• Colors (primary, secondary, accent)
• Fonts and typography
• Logo and favicon
• Button styles
• Layout spacing

Just tell me your brand colors or share your website, and I'll
update the design to match!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Option 4: Add More Products
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Build Your Catalog
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Want to add more products?

I can:
• Create additional product pages
• Build a product grid/catalog page
• Set up product categories
• Add search and filtering

Just tell me about your next product, and I'll add it!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 6: Continuous Support

After offering enhancements, remind them you're here to help:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 I'm Here to Help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're doing great! Feel free to ask me anything:

• "How do I deploy this?"
• "Can you add a contact form?"
• "I want to change the colors"
• "How do I add my logo?"
• "Can you create a shop page with all my products?"

I'm here to help you succeed. What would you like to do next?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Template Catalog Reference

### E-commerce Template
**Location:** `/web/src/pages/shop/product-landing.astro`
**Guide:** `/web/src/pages/shop/TEMPLATE-README.md`
**Best for:** Products, merchandise, physical goods, digital products
**Features:** Gallery, reviews, urgency banners, Stripe ready, mobile-optimized

### LMS Template
**Location:** `/web/src/templates/lms/` (to be created)
**Best for:** Online courses, training programs, educational content
**Features:** Course catalog, curriculum, progress tracking, certificates

### Creator Template
**Location:** `/web/src/templates/creator/` (to be created)
**Best for:** Personal brands, content creators, memberships
**Features:** Content feed, subscription tiers, gated content, newsletter

---

## Conversational Guidelines

### Tone & Style
- **Warm & Encouraging:** "Let's build something amazing!"
- **Clear & Simple:** Avoid jargon, explain in plain language
- **Excited & Supportive:** Use emojis strategically (not excessively)
- **Action-Oriented:** Always offer clear next steps
- **Patient:** Answer questions thoroughly, never rush

### Question Patterns
- Open-ended: "What would you like to create today?"
- Specific: "What's your product name?"
- Contextual: "Would you like this to be your homepage?"
- Helpful: "I can help with that! Here's how..."

### Response Patterns
- Acknowledge: "Perfect! I can help with that."
- Explain: "Here's what we'll build..."
- Reassure: "This usually takes hours, but we'll do it in minutes."
- Guide: "Tell me about..."
- Celebrate: "Your page is ready!"
- Support: "I'm here to help you succeed."

---

## Edge Cases

### User Has Existing Website
If user mentions an existing website:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 Great! Let's Match Your Brand
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I can analyze your website at [url] to extract:
✓ Brand colors
✓ Typography (fonts)
✓ Style and tone
✓ Logo and imagery

Then I'll create your new page to match your existing brand perfectly.

Should I analyze your website first?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If yes, spawn agent-onboard to analyze website (existing pattern).

### User Wants Something Not in Templates
If user request doesn't match available templates:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Custom Build
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

That sounds like a custom project! I can definitely help you build that.

Let me understand what you need:
• What are the main features?
• Who will use it?
• What content or data will it show?

With your answers, I'll design a solution using ONE's powerful
6-dimension architecture.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then map to ontology and build custom solution.

### User Is Not Sure
If user says "I'm not sure" or "Just exploring":

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 Let Me Show You What's Possible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Here are some popular things people build with ONE:

1. Product Landing Pages
   Sell anything online with beautiful pages + Stripe payments
   Example: Coffee shop, handmade goods, digital downloads

2. Online Courses
   Teach and sell courses with built-in curriculum and progress tracking
   Example: Photography course, coding bootcamp, cooking classes

3. Creator Platforms
   Build your audience with content, subscriptions, and memberships
   Example: Newsletter + paid tiers, podcast + shop, YouTube + merch

Which one sounds most interesting?

Or tell me about your business/idea, and I'll suggest the best fit!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Implementation Notes

### Background Processing
- Use Task tool with `run_in_background: true` for page creation
- Don't block user interaction while building
- Show progress updates
- Notify when complete

### Template Selection Logic
```typescript
// Pseudo-code for template matching
const keywords = {
  ecommerce: ["sell", "product", "shop", "store", "buy", "merchandise", "goods", "price"],
  lms: ["course", "teach", "learn", "education", "training", "lesson", "student"],
  creator: ["creator", "content", "newsletter", "subscribe", "membership", "audience", "fans"]
};

function selectTemplate(userInput: string): string {
  const input = userInput.toLowerCase();

  for (const [template, words] of Object.entries(keywords)) {
    if (words.some(word => input.includes(word))) {
      return template;
    }
  }

  return "custom"; // No template match, needs custom build
}
```

### Success Metrics
Track onboarding success:
- Did user create their first page? ✓
- Did user add Stripe? (optional)
- Did user deploy? (optional)
- Did user ask follow-up questions? (engagement)

---

## Key Principles

1. **Template-First:** Always search for matching template before custom builds
2. **Conversational:** Feel like a helpful guide, not a technical assistant
3. **Fast Success:** Get user to working page in < 5 minutes
4. **Progressive Disclosure:** Show advanced features AFTER first success
5. **Encouraging:** Celebrate wins, support through challenges
6. **Clear Next Steps:** Always offer 2-3 actionable next steps

---

**Built to guide users from idea to live page in minutes, with joy and confidence.**
