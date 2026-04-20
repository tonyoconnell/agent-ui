---
title: Todo Buy Chatgpt
dimension: things
primary_dimension: things
category: todo-buy-chatgpt.md
tags: ai, cycle, ontology
related_dimensions: connections, events, groups, people, things, knowledge
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-buy-chatgpt.md category.
  Location: one/things/todo-buy-chatgpt.md
  Purpose: Documents one platform: conversational commerce via chatgpt/gemini/claude v1.0.0
  Related dimensions: connections, events, groups, people
  For AI agents: Read this to understand todo buy chatgpt.
---

# ONE Platform: Conversational Commerce via ChatGPT/Gemini/Claude v1.0.0

**Focus:** "Buy it in ChatGPT" - Conversational shopping experiences through LLM chat interfaces
**Process:** `Cycle 1-100 cycle sequence`
**Timeline:** 8-12 cycles per specialist per day
**Target:** Conversational checkout + AI product discovery (Wave 2.5 - Strategic Addition)
**Integration:** Works with todo-ecommerce.md (shopping cart, checkout, payments)

---

## PHASE 1: FOUNDATION & SETUP (Cycle 1-10)

**Purpose:** Understand conversational commerce landscape, map to ontology, plan implementation

### Cycle 1: Understand the "Buy it in ChatGPT" Opportunity

- [ ] Review market context:
  - [ ] OpenAI launched Instant Checkout (Sep 2025)
  - [ ] Users can purchase products within ChatGPT
  - [ ] Google Shopping integration coming
  - [ ] Claude + Gemini following similar pattern
- [ ] Competitive landscape:
  - [ ] Shopify integration (ChatGPT store builder)
  - [ ] Amazon product discovery in Claude
  - [ ] Custom integrations via API
- [ ] Revenue potential:
  - [ ] Commission on referred sales
  - [ ] Featured placement in AI recommendations
  - [ ] Premium tier for AI-powered merchandising
  - [ ] Instant checkout reduces friction (higher conversion)
- [ ] Document in: `one/connections/conversational-commerce.md`

### Cycle 2: Map Conversational Commerce to 6-Dimension Ontology

- [ ] **Groups:** Creator's business group (via marketplace)
- [ ] **People:**
  - [ ] Customer (asking questions in chat)
  - [ ] Creator (seller)
  - [ ] AI Agent (product discovery + recommendations)
- [ ] **Things:**
  - [ ] product (with detailed metadata for AI)
  - [ ] conversation_session (chat history)
  - [ ] product_recommendation (AI-generated)
  - [ ] conversational_order (completed purchase)
- [ ] **Connections:**
  - [ ] customer → product (conversationally_interested)
  - [ ] product → recommendation (suggested_by_ai)
  - [ ] customer → conversational_order (purchased_via_chat)
  - [ ] product → creator (owned_by)
- [ ] **Events:**
  - [ ] conversation_started
  - [ ] product_mentioned
  - [ ] product_recommended
  - [ ] question_asked
  - [ ] order_completed_in_chat
- [ ] **Knowledge:**
  - [ ] product_description (rich text)
  - [ ] product_embedding (for semantic search)
  - [ ] product_category, use_case, audience labels
  - [ ] customer_preferences (inferred from conversation)

### Cycle 3: Define Conversational Commerce User Flows

- [ ] **Flow 1: Discovery via Chat**
  1. User opens ChatGPT: "I need a padel racket for beginners"
  2. AI understands intent (beginner level, price point, style preferences)
  3. AI retrieves top 3 products from ONE marketplace
  4. User asks follow-up questions ("Is this good for spin?", "Price in EUR?")
  5. AI answers with product details + comparisons
  6. User clicks "Buy it now"
  7. Redirect to ONE checkout (one-click, pre-filled from chat)
  8. Purchase completed, AI confirms "Order placed! #ORD-123"
  9. AI offers follow-up: "Want tips for using this racket?"

- [ ] **Flow 2: Product Details in Chat**
  1. User: "Show me details for this racket"
  2. AI displays: Specs, reviews, user testimonials, availability
  3. User: "Any discount codes?"
  4. AI: "I found 10% off for first-time buyers"
  5. User: "Perfect, buy it"
  6. Checkout with pre-applied discount
  7. AI: "Order confirmed! You saved €5"

- [ ] **Flow 3: Personalized Recommendations**
  1. AI builds user profile over conversation
  2. AI learns: Skill level, budget, style, pain points
  3. AI suggests: "Based on what you've told me, I'd recommend..."
  4. Product recommended is perfectly matched to user needs
  5. User feels understood (not overwhelmed by options)
  6. Higher conversion because AI did the work

- [ ] **Flow 4: Post-Purchase Support**
  1. User purchased racket via chat
  2. Next week: "How's your new racket?"
  3. AI: "Need tips? Want to compare with other players?"
  4. Offers relevant follow-up products (strings, grips, lessons)
  5. Natural upselling without feeling pushy

### Cycle 4: Identify AI Platforms to Integrate

- [ ] **ChatGPT (OpenAI)**
  - [ ] GPT-4 Turbo (best reasoning)
  - [ ] Vision capabilities (product images)
  - [ ] Real-time browsing (current prices)
  - [ ] Integration: Custom actions/GPTs
  - [ ] Audience: 200M+ monthly users
  - [ ] Revenue model: Commission on purchases
- [ ] **Claude (Anthropic)**
  - [ ] Better at detailed comparisons
  - [ ] Excellent for understanding nuance
  - [ ] Integration: API + custom tools
  - [ ] Growing user base (developers preferred)
  - [ ] Revenue model: Same
- [ ] **Gemini (Google)**
  - [ ] Integrated into Google Search
  - [ ] Shopping integration natural fit
  - [ ] Integration: Shopping API
  - [ ] Massive reach (Google users)
  - [ ] Revenue model: CPC/CPA

### Cycle 5: Define Product Metadata for AI

- [ ] Enhance product schema (from todo-ecommerce) for AI:

  ```
  Product thing type additions:
  {
    // Rich descriptions for AI understanding
    aiDescription: string,  // Detailed, conversational description
    aiUseCases: string[],  // ["beginner learning", "competitive play"]
    aiTargetAudience: string[],  // ["beginners", "intermediate", "pro"]
    aiComparisonPoints: {
      [feature: string]: string  // "lightweight: 360g for faster swing"
    },
    aiBestFor: string,  // "Beginners who want forgiving racket"
    aiAvoidWhen: string,  // "Not for advanced players seeking precision"

    // Product relationships for AI recommendations
    aiSimilarProducts: Id<'things'>[],  // Similar rackets
    aiOftenBoughtWith: Id<'things'>[],  // Complementary products
    aiUpgradeFrom: Id<'things'>[],  // Lower-tier alternatives
    aiUpgradeTo: Id<'things'>[],  // Higher-tier alternatives

    // Embedding for semantic search
    aiEmbedding: number[],  // Vector from OpenAI embeddings API
    aiKeywords: string[],  // "padel racket, beginner, carbon fiber"
    aiTags: string[],  // For filtering in conversation
  }
  ```

### Cycle 6: Plan AI Integration Architecture

- [ ] **Option 1: ChatGPT Custom Action**
  - [ ] Create OpenAI custom action that calls ONE API
  - [ ] ONE provides product search + purchase endpoints
  - [ ] ChatGPT calls ONE API for each query
  - [ ] Flow: ChatGPT → ONE API → Product catalog → Return results
  - [ ] Pros: Direct integration, OpenAI handles UI
  - [ ] Cons: Limited customization, slower iterations
- [ ] **Option 2: ChatGPT Plugin (deprecated but concept)**
  - [ ] Similar to custom actions but deeper integration
  - [ ] Plan: Use custom actions (current OpenAI approach)
- [ ] **Option 3: Standalone AI Chat Interface**
  - [ ] Build custom chat UI in /web
  - [ ] Powers conversation with Claude API or OpenAI API
  - [ ] Full control over UX + branding
  - [ ] Can offer to ChatGPT later as custom action
  - [ ] **RECOMMENDED:** Do this first, then expose via ChatGPT action
- [ ] **Option 4: Hybrid**
  - [ ] Build standalone chat (Option 3)
  - [ ] Expose API for ChatGPT integration (Option 1)
  - [ ] Best of both worlds

### Cycle 7: Define Conversational Commerce MVP Features

- [ ] **Minimum Viable Product:**
  1. Standalone chat interface in /web
  2. Claude API (cheaper, good quality)
  3. Product search + recommendations
  4. Product details display
  5. One-click redirect to checkout
  6. Track conversation → purchase attribution
  7. Basic metrics (conversion rate, avg order value)
- [ ] **First Extension (v1.1):** 8. ChatGPT custom action integration 9. Product images in chat 10. Price comparison in conversation 11. Review/rating display 12. Discount codes in chat
- [ ] **Second Extension (v1.2):** 13. Gemini integration 14. Multi-language support 15. Post-purchase follow-up in chat 16. AI upsell recommendations 17. Chat history + personalization

### Cycle 8: Plan Data Collection for AI Training

- [ ] Conversational commerce creates unique data:
  - [ ] How customers naturally ask about products
  - [ ] What questions matter most
  - [ ] What information influences purchases
  - [ ] Customer preferences patterns
  - [ ] Common objections/hesitations
- [ ] This data becomes competitive advantage:
  - [ ] Fine-tune Claude/GPT for product recommendations
  - [ ] Improve product descriptions based on conversations
  - [ ] Identify gaps in product offerings
  - [ ] Train recommendation engine
- [ ] Privacy considerations:
  - [ ] Anonymize conversations
  - [ ] Get user consent for data usage
  - [ ] GDPR compliance
  - [ ] Allow users to opt-out

### Cycle 9: Identify Revenue Streams

- [ ] **Direct Revenue:**
  - [ ] Commission on purchases via conversational commerce
  - [ ] Premium "Featured in Chat" listings
  - [ ] Sponsored product placement in recommendations
  - [ ] Analytics dashboard subscription (for sellers)
- [ ] **Indirect Revenue:**
  - [ ] Increased marketplace traffic (network effect)
  - [ ] Higher conversion rate (chat overcomes objections)
  - [ ] Larger average order value (AI recommendations)
  - [ ] Better customer retention (post-purchase engagement)
- [ ] **Projected Impact:**
  - [ ] 20-30% higher conversion than traditional search
  - [ ] 15-25% higher average order value (recommendations)
  - [ ] 3-5x higher customer lifetime value (repeat purchases)

### Cycle 10: Define Success Metrics

- [ ] Conversational commerce complete when:
  - [ ] [ ] Chat interface live and responsive
  - [ ] [ ] Claude API integration working
  - [ ] [ ] Product search functional
  - [ ] [ ] Purchase redirect working (end-to-end)
  - [ ] [ ] Conversation → purchase tracking accurate
  - [ ] [ ] First 100 purchases via chat
  - [ ] [ ] Chat conversion rate > 15% (vs 2% for traditional search)
  - [ ] [ ] Average order value 25%+ higher than non-chat
  - [ ] [ ] ChatGPT action deployed
  - [ ] [ ] Analytics dashboard functional
  - [ ] [ ] Seller dashboard shows conversational metrics

---

## PHASE 2: BACKEND SCHEMA & SERVICES (Cycle 11-20)

**Purpose:** Extend Convex schema for conversations + AI

### Cycle 11: Create Conversation Thing Type

- [ ] New thing type: `conversation_session`

  ```typescript
  {
    type: 'conversation_session',
    properties: {
      // Session info
      userId: Id<'things'>,  // Customer
      creatorIds: Id<'things'>[],  // Creators mentioned in chat
      sessionId: string,  // Unique session ID
      platform: 'web' | 'chatgpt' | 'claude' | 'gemini',  // Where chat happened

      // Conversation data
      messages: [{
        role: 'user' | 'assistant',
        content: string,
        timestamp: number,
        mentionedProducts: Id<'things'>[],  // Products mentioned
        mentionedCreators: Id<'things'>[],  // Creators mentioned
      }],

      // AI understanding
      inferredNeeds: string[],  // "beginner level, budget €50-100"
      inferredPreferences: string[],  // "lightweight, good spin"
      suggestedProducts: Id<'things'>[],  // AI recommendations

      // Outcomes
      productsViewed: Id<'things'>[],  // Products user asked about
      productsAddedToCart: Id<'things'>[],  // Added to cart via chat
      ordersCompleted: Id<'things'>[],  // Orders placed from this chat
      totalValue: number,  // Total spent from this session

      // Quality metrics
      userSatisfaction: number,  // 1-5 rating
      feedback: string,  // User feedback on AI recommendations

      // Tracking
      startedAt: number,
      endedAt: number,
      duration: number,  // Minutes
      messageCount: number,
      status: 'active' | 'completed' | 'abandoned',
    }
  }
  ```

### Cycle 12: Create Recommendation Thing Type

- [ ] New thing type: `ai_recommendation`
  ```typescript
  {
    type: 'ai_recommendation',
    properties: {
      conversationId: Id<'things'>,  // Parent conversation
      productId: Id<'things'>,  // Recommended product
      creatorId: Id<'things'>,  // Creator of product
      reasoningSteps: string[],  // Why this product was recommended
      confidenceScore: number,  // 0-1 confidence
      recommendationType: 'primary' | 'alternative' | 'upgrade' | 'related',
      messageIndex: number,  // Which message in conversation
      userReacted: boolean,  // Did user click/ask about it?
      userReaction: 'interested' | 'dismissed' | 'purchased',
      timestamp: number,
    }
  }
  ```

### Cycle 13: Create Conversational Order Thing Type

- [ ] Extend order thing from todo-ecommerce:

  ```typescript
  {
    type: 'order',  // Reuse from ecommerce
    properties: {
      // ... existing order fields ...

      // Conversational commerce fields
      conversationId: Id<'things'>,  // Which chat led to this?
      conversationPlatform: 'web' | 'chatgpt' | 'claude' | 'gemini',
      conversationDuration: number,  // Minutes before purchase
      messagesCount: number,  // How many messages?
      productRecommendedInChat: boolean,
      discountAppliedFromChat: boolean,
      reviewedProductDetailsInChat: boolean,
      orderSource: 'conversational' | 'traditional',  // Attribution
    }
  }
  ```

### Cycle 14: Create Conversation Service (Effect.ts)

- [ ] Service: `backend/convex/services/conversation.ts`
- [ ] Methods:
  - [ ] `createConversation(userId, platform)` → sessionId
  - [ ] `addMessage(sessionId, role, content)` → message saved
  - [ ] `parseUserIntent(message)` → needs + preferences extracted
  - [ ] `getProductRecommendations(userNeeds)` → products[]
  - [ ] `trackProductView(sessionId, productId)` → logged
  - [ ] `completeConversation(sessionId)` → session archived
  - [ ] `getConversationMetrics(sessionId)` → stats

### Cycle 15: Create AI Integration Service (Effect.ts)

- [ ] Service: `backend/convex/services/ai-integration.ts`
- [ ] Methods:
  - [ ] `callClaudeAPI(messages, systemPrompt)` → response
  - [ ] `callOpenAIAPI(messages, systemPrompt)` → response
  - [ ] `generateProductEmbedding(product)` → vector
  - [ ] `semanticSearch(query, products)` → ranked results
  - [ ] `parseProductMentions(message)` → product IDs
  - [ ] `extractUserPreferences(messages)` → preferences object
  - [ ] `generateRecommendation(userNeeds, products)` → recommendation

### Cycle 16: Create Convex Mutations

- [ ] `mutations/conversations.ts`:
  - [ ] `startConversation(userId, platform)` → sessionId
  - [ ] `addMessage(sessionId, message)` → saved
  - [ ] `updateConversationOutcomes(sessionId, outcomes)` → updated
  - [ ] `completeConversation(sessionId)` → closed
- [ ] `mutations/recommendations.ts`:
  - [ ] `logRecommendation(conversationId, productId, reason)` → logged
  - [ ] `trackRecommendationReaction(recommendationId, reaction)` → tracked

### Cycle 17: Create Convex Queries

- [ ] `queries/conversations.ts`:
  - [ ] `getConversation(sessionId)` → full chat history
  - [ ] `getUserConversations(userId)` → all chats
  - [ ] `getConversationMetrics(sessionId)` → stats
- [ ] `queries/recommendations.ts`:
  - [ ] `getConversationRecommendations(sessionId)` → all recommendations
  - [ ] `getProductRecommendations(productId)` → how often recommended
  - [ ] `getCreatorMetrics(creatorId)` → conversational commerce stats

### Cycle 18: Create Conversation Prompts (System)

- [ ] Create `backend/convex/prompts/product-advisor.md`:

  ```
  You are a friendly, knowledgeable padel racket advisor.
  Your goal is to help customers find the perfect racket.

  You understand:
  - Different skill levels (beginner to pro)
  - Playing styles (aggressive, defensive, all-around)
  - Budget constraints
  - Physical considerations (strength, height)

  When recommending products:
  1. Ask clarifying questions
  2. Understand their needs deeply
  3. Recommend 2-3 best matches
  4. Explain why each is suitable
  5. Answer questions honestly
  6. Mention when not to buy
  7. Suggest complementary products naturally

  Make recommendations personal, not pushy.
  ```

- [ ] Create prompts for other categories
- [ ] Make prompts dynamic based on creator/marketplace

### Cycle 19: Set Up API Rate Limiting for AI Calls

- [ ] Implement rate limiting:
  - [ ] Claude API: $0.003 per 1K input tokens, $0.015 per 1K output
  - [ ] Limit: 10 chats/min per user, 1 API call/second per session
  - [ ] Cache responses where possible (same question asked twice)
  - [ ] Monitor costs, alert if exceeding budget
- [ ] Cost optimization:
  - [ ] Use Claude Haiku for simple queries (cheaper)
  - [ ] Use Claude Sonnet for complex reasoning (expensive, accurate)
  - [ ] Batch embeddings generation (off-peak)

### Cycle 20: Create Conversation Indexing

- [ ] Index conversations for later analysis:
  - [ ] by_userId(userId) - Find user's conversations
  - [ ] by_creatorId(creatorId) - Find where creator mentioned
  - [ ] by_productId(productId) - Find where product discussed
  - [ ] by_platform(platform) - Segment by channel
  - [ ] by_status(status) - Find active/completed chats
  - [ ] by_date(date) - Time-series queries

---

## PHASE 3: FRONTEND - CHAT INTERFACE (Cycle 21-30)

**Purpose:** Build conversational UI in React/Astro

### Cycle 21: Create ChatInterface Component

- [ ] Component: `web/src/components/conversational/ChatInterface.tsx`
- [ ] Features:
  - [ ] Message history scrollable area
  - [ ] Input box (with send button)
  - [ ] Typing indicator when AI responds
  - [ ] Code/link formatting in responses
  - [ ] Dark mode support
  - [ ] Mobile responsive
  - [ ] Auto-scroll to latest message
- [ ] Styling:
  - [ ] User messages: Right-aligned, blue
  - [ ] AI messages: Left-aligned, gray
  - [ ] Product cards shown inline
  - [ ] Links clickable (product details, checkout)

### Cycle 22: Create ProductCard Component (Chat Version)

- [ ] Component: `web/src/components/conversational/ProductCardChat.tsx`
- [ ] Display in chat:
  - [ ] Product image (small, clickable)
  - [ ] Product name + creator
  - [ ] Brief description (1-2 lines)
  - [ ] Price + availability
  - [ ] Star rating
  - [ ] "View Details" button
  - [ ] "Add to Cart" button
  - [ ] "Check Out" button (one-click)
- [ ] Compact design (fits in chat)

### Cycle 23: Create RecommendationSection Component

- [ ] Component: `web/src/components/conversational/RecommendationSection.tsx`
- [ ] Display when AI makes recommendation:
  - [ ] "Based on your needs, I recommend..."
  - [ ] 2-3 product cards side-by-side
  - [ ] Explanation for each (why recommended)
  - [ ] Comparison table (optional)
  - [ ] "Tell me more" buttons
  - [ ] "I'm interested" buttons

### Cycle 24: Create PreferencesExtractor Component

- [ ] Component: `web/src/components/conversational/PreferencesExtractor.tsx`
- [ ] Shows inferred preferences:
  - [ ] Skill level: Beginner, Intermediate, Advanced
  - [ ] Budget: $0-50, $50-100, $100-200, $200+
  - [ ] Style: Aggressive, Defensive, Balanced
  - [ ] Weight preference: Light, Medium, Heavy
  - [ ] Edit buttons (let user correct AI)
- [ ] Used to refine recommendations

### Cycle 25: Create ChatPage (Astro)

- [ ] `web/src/pages/chat/index.astro`
- [ ] Layout:
  - [ ] Chat interface on left (70%)
  - [ ] Quick tips/FAQ on right (30%)
  - [ ] Header: "Product Advisor Chat"
  - [ ] Footer: "Powered by Claude"
- [ ] Mobile: Full-width chat
- [ ] Require login (optional? Can chat as guest)

### Cycle 26: Create ChatHistoryPage

- [ ] `web/src/pages/chat/history.astro`
- [ ] Show past conversations:
  - [ ] List of chats (date, platform, products, total spent)
  - [ ] Search/filter chats
  - [ ] Click to view full conversation
  - [ ] Export chat as PDF
  - [ ] Delete old chats

### Cycle 27: Create OneClickCheckout Component

- [ ] Component: `web/src/components/conversational/OneClickCheckout.tsx`
- [ ] When user clicks "Check Out" in chat:
  1. Extract product from recommendation
  2. Pre-fill quantity (default 1)
  3. Show total with chat-applied discounts
  4. One button: "Complete Purchase"
  5. On click: Redirect to payment (X402)
  6. After payment: Confirm in chat "Order #123 confirmed!"
- [ ] Mobile: Full-screen checkout view

### Cycle 28: Create SellerAnalyticsDashboard

- [ ] Page: `/dashboard/conversational-metrics`
- [ ] For product creators:
  - [ ] Mentions: How often product mentioned in chats
  - [ ] Recommendations: How often recommended by AI
  - [ ] View-to-Click rate: % of mentions → details view
  - [ ] Click-to-Purchase rate: % of details → purchased
  - [ ] Average conversation length before purchase
  - [ ] Common questions about product
  - [ ] Product embedding score (how well AI understands it)
  - [ ] Recommendations to improve product description

### Cycle 29: Create AdminMetricsPage

- [ ] Page: `/admin/conversational-commerce`
- [ ] For platform owner:
  - [ ] Total conversations today/week/month
  - [ ] Conversion rate: Chats → purchases
  - [ ] Average order value from chat vs traditional
  - [ ] Revenue from conversational commerce
  - [ ] Top products by mentions/recommendations
  - [ ] Top creators by conversational revenue
  - [ ] API costs (Claude, embeddings)
  - [ ] User satisfaction (chat rating)
  - [ ] Platform health (uptime, latency)

### Cycle 30: Create Empty States + Onboarding

- [ ] When user opens chat:
  - [ ] "Hi! I'm your product advisor"
  - [ ] "Tell me what you're looking for"
  - [ ] Example prompts:
    - [ ] "Find me a padel racket for beginners"
    - [ ] "What's the best racket under €100?"
    - [ ] "I'm a left-handed aggressive player"
  - [ ] Users click example to start

---

## PHASE 4: API ROUTES & INTEGRATIONS (Cycle 31-40)

**Purpose:** Connect chat to backends, LLM APIs, checkout

### Cycle 31: Create Chat API Route

- [ ] `web/src/pages/api/chat/message.ts`
- [ ] POST endpoint:
  ```
  Input: {
    sessionId: string,
    message: string,
    userId?: string,
  }
  Output: {
    response: string,
    suggestedProducts: Product[],
    recommendations: Recommendation[],
    internalState: { needs, preferences, ... }
  }
  ```
- [ ] Calls Claude API via Convex
- [ ] Tracks message in conversation
- [ ] Returns streamed response (optional)

### Cycle 32: Create Product Search API Route

- [ ] `web/src/pages/api/chat/search.ts`
- [ ] POST endpoint:
  ```
  Input: {
    query: string,  // User's natural language query
    needs?: string[],  // Extracted preferences
    limit?: number,  // Default 5
  }
  Output: {
    products: Product[],
    explanation: string,  // Why these products match
  }
  ```
- [ ] Uses semantic search (embeddings)
- [ ] Filters by availability + rating

### Cycle 33: Create Conversation Session API Route

- [ ] `web/src/pages/api/chat/session.ts` - POST (create)
- [ ] `web/src/pages/api/chat/session/[sessionId].ts` - GET (retrieve)
- [ ] POST creates new conversation in Convex
- [ ] GET retrieves full chat history

### Cycle 34: Create Checkout Redirect Route

- [ ] `web/src/pages/api/chat/checkout.ts`
- [ ] POST endpoint:
  ```
  Input: {
    sessionId: string,
    productId: Id<'things'>,
    quantity: number,
  }
  Output: {
    checkoutUrl: string,  // Redirect to checkout
    cartId: Id<'things'>,
  }
  ```
- [ ] Creates cart with product
- [ ] Redirects to checkout page
- [ ] Checkout is pre-filled from conversation data

### Cycle 35: Create Claude API Integration

- [ ] `backend/convex/lib/claude-api.ts`
- [ ] Wrapper around Anthropic SDK:
  ```typescript
  async function callClaude(
    messages: Message[],
    systemPrompt: string,
    options?: {
      model?: "haiku" | "sonnet" | "opus";
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string>;
  ```
- [ ] Error handling (rate limits, timeouts)
- [ ] Cost tracking (log tokens used)
- [ ] Fallback to simpler model if expensive model overloaded

### Cycle 36: Create OpenAI API Integration

- [ ] `backend/convex/lib/openai-api.ts`
- [ ] Similar wrapper for ChatGPT:
  ```typescript
  async function callGPT(
    messages: Message[],
    systemPrompt: string,
    options?: {...}
  ): Promise<string>
  ```
- [ ] Support for GPT-4, GPT-4 Turbo, etc
- [ ] Vision capabilities (analyze product images)

### Cycle 37: Create Embedding Generation Route

- [ ] `web/src/pages/api/embeddings/generate.ts`
- [ ] Background job: Generate embeddings for all products
- [ ] Called on product creation/update
- [ ] Stores embedding in product properties
- [ ] Used for semantic search in conversations

### Cycle 38: Create ChatGPT Custom Action Definition

- [ ] File: `.openai/actions/one-marketplace.yaml`
- [ ] OpenAI custom action definition:
  ```yaml
  openapi: 3.0.0
  info:
    title: ONE Marketplace
    description: Browse and buy products via conversational AI
  servers:
    - url: https://one.ie/api
  paths:
    /chat/search:
      post:
        summary: Search products
        requestBody:
          content:
            application/json:
              schema:
                type: object
                properties:
                  query:
                    type: string
                  limit:
                    type: number
        responses:
          200:
            description: Products found
  ```

### Cycle 39: Create Analytics Event Tracking

- [ ] Track all conversational metrics:
  - [ ] conversation_started
  - [ ] message_sent
  - [ ] product_mentioned
  - [ ] product_recommended
  - [ ] product_details_viewed
  - [ ] product_added_to_cart
  - [ ] order_placed_from_chat
  - [ ] chat_abandoned
- [ ] Log to Convex events table
- [ ] Create analytics queries

### Cycle 40: Create Webhooks for External Platforms

- [ ] ChatGPT action calls ONE API
- [ ] On successful purchase: Send webhook back to ChatGPT
- [ ] ChatGPT confirms: "Order placed! #ORD-123"
- [ ] Order tracking: User can ask ChatGPT about order status

---

## PHASE 5: AI & RECOMMENDATION ENGINE (Cycle 41-50)

**Purpose:** Build sophisticated product recommendation system

### Cycle 41: Create Product Understanding Layer

- [ ] Extract rich metadata from products:
  - [ ] Brand, model, specs
  - [ ] User reviews (sentiment analysis)
  - [ ] Use cases (from description)
  - [ ] Target audience
  - [ ] Competitors + alternatives
- [ ] Store in product thing properties
- [ ] Used by AI to understand products deeply

### Cycle 42: Create User Preference Extraction

- [ ] From conversation, extract:
  - [ ] Budget range
  - [ ] Skill level
  - [ ] Playing style (aggressive, defensive, etc)
  - [ ] Brand preferences
  - [ ] Material preferences (wood, graphite, etc)
  - [ ] Weight preferences
  - [ ] Color preferences (if mentioned)
  - [ ] Performance goals (speed, spin, control)
- [ ] Store in conversation thing properties
- [ ] Refine with each message

### Cycle 43: Create Semantic Search

- [ ] Use embeddings for products:
  - [ ] Generate embedding for each product description
  - [ ] User query → embedding
  - [ ] Find closest products (cosine similarity)
  - [ ] Rank by relevance + rating + availability
  - [ ] Return top N results
- [ ] Better than keyword search
- [ ] Understands intent ("good for beginners" matches beginner-friendly rackets)

### Cycle 44: Create Personalized Recommendation Engine

- [ ] Algorithm:
  1. Extract user preferences from conversation
  2. Weight products by how well they match:
     - Skill level match (heavy weight)
     - Budget match (heavy weight)
     - Playing style match (medium weight)
     - Brand preference (light weight)
  3. Filter: Must be in stock
  4. Filter: Minimum rating 3.5 stars
  5. Boost: Newly added products, best sellers
  6. Diversity: Don't recommend 3 identical products
  7. Return: Top 3 products with explanations
- [ ] Explainability: Always explain WHY (user trust)

### Cycle 45: Create Comparison Generation

- [ ] When user asks to compare products:

  ```
  User: "How does the X1 compare to the Y2?"
  AI: "Great question! Here's a comparison:

  X1 Racket:
  - Weight: 350g (lighter, faster swings)
  - Sweet spot: Medium (forgiving)
  - Best for: Beginners
  - Price: €79

  Y2 Racket:
  - Weight: 380g (heavier, more control)
  - Sweet spot: Small (requires precision)
  - Best for: Intermediate players
  - Price: €129

  My recommendation for you: X1 is better because
  you mentioned you're starting out."
  ```

- [ ] Extract products mentioned
- [ ] Generate comparison table
- [ ] Make recommendation based on user profile

### Cycle 46: Create Objection Handling

- [ ] Detect and address concerns:
  - [ ] "Is it durable?" → Mention warranty, materials
  - [ ] "Good for tournaments?" → Mention pros using it
  - [ ] "Can I upgrade later?" → Suggest upgrade path
  - [ ] "Is it worth it?" → Compare value vs alternatives
  - [ ] "Will it suit left-handers?" → Explain balance
- [ ] Use product reviews to address objections
- [ ] Be honest about limitations

### Cycle 47: Create Upsell Logic

- [ ] Natural upselling:
  - [ ] After product selection: "Also popular with this: strings, grip"
  - [ ] Bundle offer: "Buy together, save 5%"
  - [ ] Upgrade suggestion: "For €20 more, you get..."
  - [ ] Related: "Many players also buy..."
- [ ] Not pushy, feels natural
- [ ] Only suggest if relevant to user profile

### Cycle 48: Create Learning System

- [ ] AI improves recommendations over time:
  - [ ] Track which recommendations → purchases (success)
  - [ ] Track which recommendations → abandoned (failure)
  - [ ] Find patterns (what works, what doesn't)
  - [ ] Adjust product weights dynamically
  - [ ] A/B test recommendation strategies
- [ ] Per-creator insights:
  - [ ] Which users like their products?
  - [ ] How to position product for conversation?

### Cycle 49: Create Conversation Memory

- [ ] AI remembers across sessions:
  - [ ] User: "I bought the X1 from your last recommendation"
  - [ ] AI: "Great! How are you enjoying it?"
  - [ ] User: "I love it, now I want strings"
  - [ ] AI: "Perfect, these strings are designed for X1"
- [ ] Cross-session continuity
- [ ] Personalization deepens

### Cycle 50: Create RAG (Retrieval-Augmented Generation)

- [ ] Combine AI reasoning with product database:
  - [ ] User question → Search product database
  - [ ] Retrieve relevant products + reviews
  - [ ] Pass to Claude with context
  - [ ] Claude generates informed response
  - [ ] Response includes product recommendations
- [ ] Better accuracy (grounded in real data)
- [ ] Always up-to-date (live product info)

---

## PHASE 6: QUALITY & TESTING (Cycle 51-60)

**Purpose:** Test all conversational flows end-to-end

### Cycle 51: Write Unit Tests for Conversation Service

- [ ] Test conversation service methods
- [ ] Mock Convex database
- [ ] Test preference extraction
- [ ] Test recommendation ranking
- [ ] Test comparison generation

### Cycle 52: Write Unit Tests for AI Integration

- [ ] Mock Claude API responses
- [ ] Test message formatting
- [ ] Test error handling (rate limits, timeouts)
- [ ] Test cost tracking

### Cycle 53: Write Integration Tests

- [ ] Test full conversation flow:
  1. Create session
  2. Send message
  3. Get AI response
  4. Check for product mentions
  5. Verify recommendations made
  6. Check conversation saved
- [ ] Test checkout flow:
  1. User asks about product
  2. AI recommends
  3. User clicks "Check Out"
  4. Redirect to checkout
  5. Verify cart pre-filled
  6. Complete purchase
  7. Verify order linked to conversation

### Cycle 54: Write E2E Tests (Selenium/Playwright)

- [ ] Test chat interface:
  - [ ] User opens chat
  - [ ] Types message
  - [ ] Gets response
  - [ ] Clicks product card
  - [ ] Views details
  - [ ] Adds to cart
  - [ ] Checks out
  - [ ] Order confirmed
- [ ] Test on mobile + desktop

### Cycle 55: Test AI Recommendation Quality

- [ ] Create test scenarios:
  - [ ] "I'm a beginner, budget €50"
  - [ ] "Advanced player, looking for speed"
  - [ ] "Defensive style, prefer lightweight"
  - [ ] "Left-handed, need good control"
- [ ] Evaluate recommendations:
  - [ ] Are they relevant?
  - [ ] Are explanations good?
  - [ ] Do they match user profile?
- [ ] Manual QA with domain experts
- [ ] Iterate on prompts + algorithm

### Cycle 56: Test Conversation Accuracy

- [ ] Does AI understand intent correctly?
  - [ ] Parse preferences accurately?
  - [ ] Remember context from previous messages?
  - [ ] Handle ambiguous questions?
  - [ ] Address objections thoughtfully?
- [ ] Test edge cases:
  - [ ] Vague questions ("Something good")
  - [ ] Contradictory preferences
  - [ ] Questions about non-products
  - [ ] Inappropriate requests

### Cycle 57: Test Performance

- [ ] Response time targets:
  - [ ] Chat message input → response: < 3 seconds
  - [ ] Product search: < 1 second
  - [ ] Checkout redirect: < 500ms
  - [ ] Page load: < 2 seconds
- [ ] Load test:
  - [ ] 100 concurrent chats
  - [ ] Measure latency + errors
  - [ ] Monitor API costs

### Cycle 58: Test Security

- [ ] Prompt injection (can user trick AI?)
- [ ] SQL injection in search
- [ ] XSS in chat messages
- [ ] Unauthorized checkout access
- [ ] Payment processing security

### Cycle 59: Test Analytics Tracking

- [ ] All events logged correctly
- [ ] Conversion tracking accurate
- [ ] Revenue attribution correct
- [ ] User behavior patterns make sense
- [ ] Dashboards calculate metrics correctly

### Cycle 60: User Acceptance Testing (UAT)

- [ ] Test with real users:
  - [ ] Can they use the chat naturally?
  - [ ] Do recommendations feel relevant?
  - [ ] Is checkout smooth?
  - [ ] Do they complete purchases?
- [ ] Gather feedback:
  - [ ] What worked well?
  - [ ] What was confusing?
  - [ ] What's missing?
- [ ] Iterate before launch

---

## PHASE 7: DESIGN & WIREFRAMES (Cycle 61-70)

**Purpose:** Finalize UI/UX design for conversational commerce

### Cycle 61: Design Chat Interface

- [ ] Wireframe chat UI
- [ ] Message bubbles, input, send button
- [ ] Product cards inline
- [ ] Typing indicator
- [ ] Scroll behavior
- [ ] Mobile layout

### Cycle 62: Design Product Cards for Chat

- [ ] Compact version (inline in chat)
- [ ] Expanded version (modal or slide)
- [ ] Show: Image, name, price, rating, buttons
- [ ] Responsive scaling

### Cycle 63: Design Preferences Display

- [ ] How to show extracted preferences?
- [ ] Editable chips/tags
- [ ] Clear + concise layout
- [ ] Mobile-friendly

### Cycle 64: Design One-Click Checkout

- [ ] Minimal friction
- [ ] Show: Product, price, "Buy" button
- [ ] Pre-fill from conversation
- [ ] Fast confirmation

### Cycle 65: Design Analytics Dashboards

- [ ] Creator dashboard: Top metrics at a glance
- [ ] Admin dashboard: Platform overview
- [ ] Charts: Trends over time
- [ ] Tables: Detailed breakdowns
- [ ] Filters: By date, product, creator

### Cycle 66: Design Mobile Experience

- [ ] Chat: Full-width messages
- [ ] Products: Stacked cards
- [ ] Buttons: Touch-friendly size (48px+)
- [ ] Keyboard: Auto-open on input
- [ ] Scroll: Smooth, no jank

### Cycle 67: Design Dark Mode

- [ ] Chat bubbles visible in dark mode
- [ ] Product cards readable
- [ ] Good contrast (WCAG AA)
- [ ] Consistent with ONE brand

### Cycle 68: Design Accessibility

- [ ] Chat history: Screen reader friendly
- [ ] Products: Alt text on images
- [ ] Buttons: Labeled + keyboard nav
- [ ] Color not only indicator
- [ ] Font size: Readable (minimum 16px)

### Cycle 69: Design Onboarding

- [ ] Welcome message
- [ ] Example prompts
- [ ] Hint: "Try asking..."
- [ ] Tutorial (skip-able)

### Cycle 70: Create Design System + Component Library

- [ ] Document all components
- [ ] Color palette
- [ ] Typography
- [ ] Spacing scale
- [ ] Button styles
- [ ] Form inputs
- [ ] Create Storybook stories

---

## PHASE 8: PERFORMANCE & OPTIMIZATION (Cycle 71-80)

**Purpose:** Optimize for speed and cost

### Cycle 71: Optimize Claude API Calls

- [ ] Batch messages where possible
- [ ] Use cheaper models (Haiku) for simple tasks
- [ ] Cache embeddings (don't regenerate)
- [ ] Compress context (remove old history)
- [ ] Stream responses (feels faster)

### Cycle 72: Optimize Product Search

- [ ] Index products by embedding (Pinecone or similar)
- [ ] Fast semantic search (sub-second)
- [ ] Cache popular searches
- [ ] Limit results to top 10 (faster ranking)

### Cycle 73: Optimize Chat UI

- [ ] Virtual scrolling (don't render all messages)
- [ ] Lazy load images
- [ ] Debounce typing indicator
- [ ] Don't re-render full list on new message
- [ ] Code split chat component (lazy import)

### Cycle 74: Optimize Database Queries

- [ ] Index conversation table:
  - [ ] by_userId, by_creatorId, by_productId
  - [ ] by_date, by_status
- [ ] Batch queries (fetch related products in 1 query)
- [ ] Cache conversation summaries

### Cycle 75: Implement Smart Caching

- [ ] Cache product data (1 hour)
- [ ] Cache embeddings (permanent, unless product updated)
- [ ] Cache common search queries (8 hours)
- [ ] Cache user preferences (per session)

### Cycle 76: Monitor Cost

- [ ] Track Claude API usage by conversation
- [ ] Set budget alerts
- [ ] Log tokens per message
- [ ] Analyze cost per purchase
- [ ] Optimize expensive operations

### Cycle 77: Implement Progressive Enhancement

- [ ] Chat works without JavaScript:
  - [ ] Form-based chat (submit text, get response)
  - [ ] Slower but functional
- [ ] With JavaScript: Full conversational experience
  - [ ] Real-time responses
  - [ ] Product cards + interactions

### Cycle 78: Optimize for Mobile Networks

- [ ] Compress images aggressively
- [ ] Minimize JavaScript
- [ ] Use service workers for offline support
- [ ] Progressive image loading
- [ ] Gzip compression

### Cycle 79: Implement Rate Limiting

- [ ] Per-user: 30 messages/hour
- [ ] Per-session: 100 messages/day
- [ ] Per-IP: 1000 messages/day
- [ ] Display remaining to user
- [ ] Clear limits in documentation

### Cycle 80: Performance Baseline

- [ ] Chat response: < 3 seconds
- [ ] Product search: < 1 second
- [ ] Page load: < 2 seconds
- [ ] Checkout: < 500ms redirect
- [ ] Concurrent users: 1000+ without degradation
- [ ] Cost: < $0.50 per conversation on average

---

## PHASE 9: DEPLOYMENT & DOCUMENTATION (Cycle 81-90)

**Purpose:** Deploy to production, document for users + creators

### Cycle 81: Set Up Production Environment

- [ ] Environment variables:
  - [ ] CLAUDE_API_KEY
  - [ ] OPENAI_API_KEY (for future)
  - [ ] CONVEX_DEPLOYMENT
  - [ ] PUBLIC_CONVEX_URL
- [ ] Database migrations
- [ ] Product embeddings generation (first run)

### Cycle 82: Deploy Backend (Convex)

- [ ] `npx convex deploy`
- [ ] Verify all mutations/queries working
- [ ] Test API endpoints
- [ ] Monitor logs for errors

### Cycle 83: Deploy Frontend (Cloudflare)

- [ ] `bun run build`
- [ ] `wrangler pages deploy dist`
- [ ] Verify chat page loads
- [ ] Test chat functionality
- [ ] Smoke test checkout flow

### Cycle 84: Set Up Monitoring

- [ ] Alert on high latency (chat response > 5s)
- [ ] Alert on API errors
- [ ] Monitor API costs
- [ ] Track conversion metrics
- [ ] Set up dashboards

### Cycle 85: Create User Documentation

- [ ] `/docs/chat-guide.md`:
  - [ ] How to use chat advisor
  - [ ] Example queries
  - [ ] Tips for best results
  - [ ] FAQ
  - [ ] Troubleshooting
- [ ] In-app help (hover tooltips, help button)
- [ ] Video tutorial (optional)

### Cycle 86: Create Creator Documentation

- [ ] `/docs/conversational-commerce.md`:
  - [ ] How to optimize products for AI
  - [ ] What makes a good description?
  - [ ] Understanding AI recommendations
  - [ ] Analytics dashboard guide
  - [ ] Tips to increase conversational sales
- [ ] Webinar / training session

### Cycle 87: Create Developer Documentation

- [ ] `/docs/conversational-api.md`:
  - [ ] Custom action setup for ChatGPT
  - [ ] API endpoints reference
  - [ ] Integration examples
  - [ ] Webhook setup
  - [ ] Rate limits + costs
- [ ] Swagger/OpenAPI definition

### Cycle 88: Create Admin Guide

- [ ] Setting up conversational commerce
- [ ] Managing Claude API credentials
- [ ] Monitoring costs + conversions
- [ ] Troubleshooting common issues
- [ ] Scaling considerations

### Cycle 89: Create Beta Announcement

- [ ] Blog post: "Introducing Conversational Shopping"
- [ ] Email to creators: How to benefit
- [ ] Social media posts
- [ ] Press kit for coverage
- [ ] Demo video (1-2 minutes)

### Cycle 90: Create Feedback Loop

- [ ] Survey users on chat experience
- [ ] Gather feature requests
- [ ] Track satisfaction scores
- [ ] Monitor: What questions most asked?
- [ ] Monthly retrospectives with team

---

## PHASE 10: KNOWLEDGE & LESSONS LEARNED (Cycle 91-100)

**Purpose:** Document insights and plan future enhancements

### Cycle 91: Document Conversational Commerce Patterns

- [ ] Write: `one/connections/conversational-commerce-patterns.md`
- [ ] Successful conversation flows
- [ ] Common user questions + AI responses
- [ ] What makes good product descriptions for AI
- [ ] Recommendation patterns that work

### Cycle 92: Create Lessons Learned Document

- [ ] What went well:
  - [ ] Claude API quality + speed
  - [ ] Users loved natural conversation
  - [ ] Conversion rate exceeded expectations
- [ ] What was challenging:
  - [ ] Embedding generation cost
  - [ ] Hallucinations about products
  - [ ] Multi-language support complexity
- [ ] What we'd do differently:
  - [ ] Plan embeddings pipeline earlier
  - [ ] More aggressive product metadata requirements
  - [ ] A/B test recommendation algorithms earlier

### Cycle 93: Create Competitive Analysis

- [ ] How does our implementation compare to:
  - [ ] ChatGPT's Instant Checkout
  - [ ] Amazon product discovery in Claude
  - [ ] Shopify's built-in chat
- [ ] Our advantages:
  - [ ] Integrated with ONE marketplace (creators benefit)
  - [ ] Open to all LLM platforms (not vendor-locked)
  - [ ] Revenue sharing model (incentive alignment)

### Cycle 94: Document Monetization Strategy

- [ ] Revenue from conversational commerce:
  - [ ] Higher conversion rate (chat overcomes objections)
  - [ ] Higher AOV (AI upsells naturally)
  - [ ] Better retention (personalized recommendations)
- [ ] Project at scale:
  - [ ] 1000 conversations/day → $2000/day revenue
  - [ ] 10% conversion → 100 purchases/day
  - [ ] Avg $20 per purchase → $2000/day

### Cycle 95: Create Product Roadmap for v2

- [ ] Planned features:
  - [ ] Multi-language support (Spanish, French, Portuguese)
  - [ ] Gemini integration
  - [ ] Video product demos in chat
  - [ ] AR try-on (show racket in hand)
  - [ ] Live agent handoff (for complex questions)
  - [ ] Post-purchase follow-up in chat
  - [ ] Review + rating in conversation
  - [ ] Referral rewards ("Tell a friend?")

### Cycle 96: Create Platform Expansion Strategy

- [ ] Extend beyond padel:
  - [ ] Any sports equipment
  - [ ] Fashion e-commerce
  - [ ] Electronics
  - [ ] Books + content
- [ ] Per-category: Customize system prompt, product metadata, recommendations
- [ ] Cross-category: Show related products (curious buyer)

### Cycle 97: Document AI Improvements

- [ ] Fine-tuning opportunities:
  - [ ] Collect good conversations (with permission)
  - [ ] Fine-tune Claude on ONE marketplace style
  - [ ] Improve product understanding
  - [ ] Better objection handling
- [ ] Data collection strategy:
  - [ ] What conversations to keep?
  - [ ] Privacy + consent
  - [ ] How to anonymize safely?

### Cycle 98: Create Analytics Deep Dive

- [ ] Metrics that matter:
  - [ ] Conversion rate: Chat → Purchase
  - [ ] Average order value: Chat vs non-chat
  - [ ] Customer lifetime value: Chat customers
  - [ ] Recommendation accuracy
  - [ ] User satisfaction scores
- [ ] Trends to watch:
  - [ ] Seasonal patterns
  - [ ] Product performance shifts
  - [ ] Creator adoption rate
  - [ ] Cost per acquisition

### Cycle 99: Document Integration Playbook

- [ ] How to integrate with new platforms:
  - [ ] Slack bot version (B2B)
  - [ ] Discord bot version (gaming/community)
  - [ ] WhatsApp integration
  - [ ] TikTok Shop integration
- [ ] Template for quick onboarding

### Cycle 100: Final Reflection & Celebration

- [ ] Conversational Commerce Complete! ✅
- [ ] What we shipped:
  - [ ] Chat interface (beautiful, responsive)
  - [ ] Claude AI integration (smart recommendations)
  - [ ] One-click checkout (frictionless purchasing)
  - [ ] Creator analytics (transparency + optimization)
  - [ ] ChatGPT action (instant market access)
  - [ ] Full end-to-end tracking (attribution)
- [ ] Impact achieved:
  - [ ] First 500+ purchases via chat
  - [ ] 30%+ higher conversion than traditional search
  - [ ] 20%+ higher AOV (recommendations work)
  - [ ] 5+ creators earning $1000+ monthly from conversational sales
- [ ] What's next:
  - [ ] Scale to 1000+ chats/day
  - [ ] Expand to Gemini + other platforms
  - [ ] International languages
  - [ ] New verticals beyond padel
- [ ] 🎉 **Conversational commerce is the future of retail. We built it.**

---

## SUCCESS CRITERIA

Conversational commerce complete when:

- ✅ Chat interface live and responsive
- ✅ Claude API integration working
- ✅ 100+ purchases via chat
- ✅ Chat conversion rate > 15% (vs 2% for traditional)
- ✅ Average order value 25%+ higher from chat
- ✅ Creator analytics dashboard functional
- ✅ ChatGPT custom action deployed
- ✅ Full documentation complete
- ✅ $5000+ revenue processed via conversational commerce
- ✅ 10+ creators actively benefiting
- ✅ System stable (99.9% uptime)
- ✅ User satisfaction > 4.5/5 stars

---

## INTEGRATION WITH TODO-ECOMMERCE.MD

This todo file extends todo-ecommerce.md:

**From todo-ecommerce:**

- Shopping cart system ✓ (reuse)
- Checkout flow ✓ (extend with pre-fill)
- Order creation ✓ (add conversational_order flag)
- Payment processing ✓ (reuse X402)
- Creator revenue tracking ✓ (add conversational metrics)

**New in this file:**

- Chat interface component
- AI recommendation engine
- Conversation tracking
- Product embeddings + semantic search
- Analytics dashboards

**Data flow:**
Chat → Product Recommendation → Add to Cart → Checkout → Order → Payment → Revenue

All using existing payment infrastructure (X402 from todo-x402.md).

---

**Status:** Strategic Addition to Wave 2.5 (between Wave 2 and Wave 3)
**Timeline:** Can be built in parallel with Wave 2 (uses todo-ecommerce foundations)
**Priority:** HIGH (immediate revenue impact)
**Revenue Potential:** $10,000+ monthly at scale
