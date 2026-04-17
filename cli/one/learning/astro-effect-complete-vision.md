---
title: Astro Effect Complete Vision
dimension: knowledge
category: astro-effect-complete-vision.md
tags: architecture
related_dimensions: events, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the astro-effect-complete-vision.md category.
  Location: one/knowledge/astro-effect-complete-vision.md
  Purpose: Documents complete vision: astro + effect.ts in 5 layers
  Related dimensions: events, things
  For AI agents: Read this to understand astro effect complete vision.
---

# Complete Vision: Astro + Effect.ts in 5 Layers

## Overview: Progressive Enhancement Architecture

This document shows **real-world examples** of building with Astro + Effect.ts, progressing through 5 layers of complexity. Each layer builds on the previous, showing when and why to add each piece.

**Foundation:** Read `astro-effect-simple-architecture.md` first for the core philosophy.

## The 5 Layers

```
Layer 1: Static Content (Astro + Content Collections)
    ↓
Layer 2: Validation (+ Zod schemas + Effect.ts)
    ↓
Layer 3: Client State (+ React islands)
    ↓
Layer 4: Data Persistence (+ REST API)
    ↓
Layer 5: Full-Stack App (+ Database + Auth)
```

**Golden Rule:** Start at Layer 1. Only move to the next layer when you need it.

---

## Layer 1: Static Content (Blog Example)

**Use Case:** Marketing site, blog, documentation - anything that's mostly read-only.

**What You Need:**
- Astro pages (routing)
- Content collections (markdown/YAML)
- shadcn components (UI)

**What You DON'T Need:**
- ❌ State management
- ❌ Database
- ❌ API
- ❌ Authentication

### Complete File Structure

```
src/
├── pages/
│   ├── index.astro                 # Homepage
│   ├── blog/
│   │   ├── index.astro             # Blog list
│   │   └── [...slug].astro         # Blog post detail
│   └── about.astro                 # About page
│
├── content/
│   ├── config.ts                   # Content schemas
│   └── blog/
│       ├── first-post.md
│       ├── second-post.md
│       └── third-post.md
│
├── components/
│   ├── BlogCard.tsx                # Post preview card
│   ├── BlogPost.tsx                # Full post display
│   └── ui/                         # shadcn components
│       ├── card.tsx
│       ├── button.tsx
│       └── badge.tsx
│
└── layouts/
    └── Layout.astro                # Base layout
```

### Schema Definition

```typescript
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog: blogCollection };
```

### Content Files

```markdown
---
# src/content/blog/first-post.md
title: "Getting Started with Astro"
description: "Learn how to build lightning-fast websites"
author: "Alice Developer"
date: 2025-01-15
tags: ["astro", "web-dev"]
featured: true
---

# Getting Started with Astro

Astro is a modern static site generator that lets you build faster websites...

## Key Features

- **Islands Architecture**: Ship less JavaScript
- **Content Collections**: Type-safe content
- **Framework Agnostic**: Use React, Vue, Svelte, or none
```

### List Page

```astro
---
// src/pages/blog/index.astro
import Layout from "@/layouts/Layout.astro";
import { getCollection } from "astro:content";
import BlogCard from "@/components/BlogCard.tsx";

// Get all blog posts, sorted by date
const posts = (await getCollection("blog"))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

const featuredPosts = posts.filter(p => p.data.featured);
const regularPosts = posts.filter(p => !p.data.featured);
---

<Layout title="Blog">
  <div class="container py-12">
    <h1 class="text-5xl font-bold mb-4">Blog</h1>
    <p class="text-xl text-gray-600 mb-12">
      Thoughts on web development, design, and technology
    </p>

    {featuredPosts.length > 0 && (
      <section class="mb-12">
        <h2 class="text-3xl font-bold mb-6">Featured Posts</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredPosts.map(post => (
            <BlogCard post={post} featured={true} />
          ))}
        </div>
      </section>
    )}

    <section>
      <h2 class="text-3xl font-bold mb-6">All Posts</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {regularPosts.map(post => (
          <BlogCard post={post} />
        ))}
      </div>
    </section>
  </div>
</Layout>
```

### Detail Page

```astro
---
// src/pages/blog/[...slug].astro
import Layout from "@/layouts/Layout.astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { Badge } from "@/components/ui/badge";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

type Props = { post: CollectionEntry<"blog"> };
const { post } = Astro.props;
const { Content } = await post.render();
---

<Layout title={post.data.title}>
  <article class="container max-w-4xl py-12">
    <header class="mb-8">
      <h1 class="text-5xl font-bold mb-4">{post.data.title}</h1>
      <p class="text-xl text-gray-600 mb-4">{post.data.description}</p>

      <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span>By {post.data.author}</span>
        <span>•</span>
        <time datetime={post.data.date.toISOString()}>
          {post.data.date.toLocaleDateString()}
        </time>
      </div>

      <div class="flex gap-2">
        {post.data.tags.map(tag => (
          <Badge variant="secondary">{tag}</Badge>
        ))}
      </div>
    </header>

    <div class="prose prose-lg max-w-none">
      <Content />
    </div>
  </article>
</Layout>
```

### Component

```tsx
// src/components/BlogCard.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CollectionEntry } from "astro:content";

type Props = {
  post: CollectionEntry<"blog">;
  featured?: boolean;
};

export function BlogCard({ post, featured = false }: Props) {
  return (
    <a href={`/blog/${post.slug}`} class="block transition hover:scale-105">
      <Card className={featured ? "border-2 border-blue-500" : ""}>
        <CardHeader>
          <CardTitle>{post.data.title}</CardTitle>
          <CardDescription>{post.data.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>{post.data.author}</span>
            <time datetime={post.data.date.toISOString()}>
              {post.data.date.toLocaleDateString()}
            </time>
          </div>
          <div class="flex gap-2 mt-3">
            {post.data.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
```

**Layer 1 Result:** Static blog with type-safe content, beautiful UI, and zero JavaScript overhead.

---

## Layer 2: Validation (Product Catalog Example)

**Use Case:** E-commerce product catalog, pricing calculator - anything needing input validation.

**Added to Layer 1:**
- ✅ Effect.ts services (validation logic)
- ✅ Zod refinements (advanced validation)

**Still Don't Need:**
- ❌ Client state
- ❌ Database
- ❌ API

### Complete File Structure

```
src/
├── pages/
│   ├── products/
│   │   ├── index.astro             # Product list
│   │   └── [slug].astro            # Product detail
│   └── calculator.astro            # Price calculator
│
├── content/
│   ├── config.ts
│   └── products/
│       ├── product-1.yaml
│       └── product-2.yaml
│
├── components/
│   ├── ProductCard.tsx
│   ├── PriceCalculator.tsx         # Uses Effect.ts validation
│   └── ui/
│
└── lib/
    └── services/
        └── productService.ts       # Effect.ts validation logic
```

### Enhanced Schema with Validation

```typescript
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const productCollection = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string().min(1, "Product name required"),
    slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug format"),
    description: z.string(),
    price: z.number().positive("Price must be positive"),
    currency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
    category: z.enum(["software", "hardware", "service"]),
    inStock: z.boolean().default(true),
    features: z.array(z.string()).min(1, "At least one feature required"),
    specifications: z.record(z.string(), z.any()).optional(),
  }).refine(
    data => data.price > 0 || !data.inStock,
    { message: "In-stock products must have a positive price" }
  ),
});

export const collections = { products: productCollection };
```

### Product Content

```yaml
# src/content/products/pro-plan.yaml
name: "Pro Plan"
slug: "pro-plan"
description: "Professional features for growing teams"
price: 49.99
currency: "USD"
category: "software"
inStock: true
features:
  - "Unlimited projects"
  - "Advanced analytics"
  - "Priority support"
  - "Custom integrations"
specifications:
  users: "Up to 50"
  storage: "1TB"
  apiCalls: "100,000/month"
```

### Effect.ts Service

```typescript
// src/lib/services/productService.ts
import { Effect, Data } from "effect";

// Tagged errors
export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class PriceError extends Data.TaggedError("PriceError")<{
  reason: string;
}> {}

// Validation functions
export const validateQuantity = (
  quantity: number
): Effect.Effect<number, ValidationError> =>
  Effect.gen(function* () {
    if (!Number.isInteger(quantity)) {
      return yield* new ValidationError({
        field: "quantity",
        message: "Quantity must be an integer",
      });
    }
    if (quantity < 1) {
      return yield* new ValidationError({
        field: "quantity",
        message: "Quantity must be at least 1",
      });
    }
    if (quantity > 1000) {
      return yield* new ValidationError({
        field: "quantity",
        message: "Quantity cannot exceed 1000",
      });
    }
    return quantity;
  });

export const calculatePrice = (
  basePrice: number,
  quantity: number,
  discountCode?: string
): Effect.Effect<{ total: number; discount: number }, PriceError | ValidationError> =>
  Effect.gen(function* () {
    // Validate quantity first
    const validQuantity = yield* validateQuantity(quantity);

    if (basePrice <= 0) {
      return yield* new PriceError({ reason: "Invalid base price" });
    }

    let discount = 0;

    // Apply volume discount
    if (validQuantity >= 10) discount += 0.1;  // 10% off
    if (validQuantity >= 50) discount += 0.05; // Additional 5% off

    // Apply promo code
    if (discountCode === "SAVE20") discount += 0.2;
    if (discountCode === "SAVE10") discount += 0.1;

    const subtotal = basePrice * validQuantity;
    const discountAmount = subtotal * discount;
    const total = subtotal - discountAmount;

    return { total, discount: discountAmount };
  });

// Composable validation pipeline
export const validateAndPrice = (
  product: { price: number; inStock: boolean },
  quantity: number,
  discountCode?: string
): Effect.Effect<{ total: number; discount: number }, ValidationError | PriceError> =>
  Effect.gen(function* () {
    if (!product.inStock) {
      return yield* new PriceError({ reason: "Product out of stock" });
    }

    return yield* calculatePrice(product.price, quantity, discountCode);
  });
```

### Calculator Component (Client Island)

```tsx
// src/components/PriceCalculator.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Effect } from "effect";
import { calculatePrice, type ValidationError, type PriceError } from "@/lib/services/productService";

type Props = {
  basePrice: number;
};

export function PriceCalculator({ basePrice }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState("");
  const [result, setResult] = useState<{ total: number; discount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setError(null);

    const effect = calculatePrice(basePrice, quantity, discountCode || undefined);

    const result = await Effect.runPromise(
      Effect.either(effect)
    );

    if (result._tag === "Left") {
      const err = result.left;
      if (err._tag === "ValidationError") {
        setError(`${err.field}: ${err.message}`);
      } else if (err._tag === "PriceError") {
        setError(err.reason);
      }
      setResult(null);
    } else {
      setResult(result.right);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>

        <div>
          <Label htmlFor="discount">Discount Code (optional)</Label>
          <Input
            id="discount"
            type="text"
            placeholder="SAVE20"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
          />
        </div>

        <Button onClick={handleCalculate} className="w-full">
          Calculate Price
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Discount: ${result.discount.toFixed(2)}</p>
            <p className="text-2xl font-bold text-green-600">
              Total: ${result.total.toFixed(2)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Product Page with Calculator

```astro
---
// src/pages/products/[slug].astro
import Layout from "@/layouts/Layout.astro";
import { getCollection } from "astro:content";
import PriceCalculator from "@/components/PriceCalculator.tsx";
import { Badge } from "@/components/ui/badge";

export async function getStaticPaths() {
  const products = await getCollection("products");
  return products.map(product => ({
    params: { slug: product.data.slug },
    props: { product },
  }));
}

const { product } = Astro.props;
---

<Layout title={product.data.name}>
  <div class="container max-w-6xl py-12">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <!-- Product Info -->
      <div>
        <h1 class="text-4xl font-bold mb-4">{product.data.name}</h1>
        <p class="text-xl text-gray-600 mb-6">{product.data.description}</p>

        <div class="mb-6">
          <Badge variant={product.data.inStock ? "default" : "destructive"}>
            {product.data.inStock ? "In Stock" : "Out of Stock"}
          </Badge>
          <Badge variant="outline" class="ml-2">{product.data.category}</Badge>
        </div>

        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-3">Features</h2>
          <ul class="list-disc list-inside space-y-2">
            {product.data.features.map(feature => (
              <li>{feature}</li>
            ))}
          </ul>
        </div>

        {product.data.specifications && (
          <div>
            <h2 class="text-2xl font-bold mb-3">Specifications</h2>
            <dl class="space-y-2">
              {Object.entries(product.data.specifications).map(([key, value]) => (
                <div class="flex justify-between">
                  <dt class="font-medium">{key}:</dt>
                  <dd class="text-gray-600">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <!-- Price Calculator -->
      <div>
        <PriceCalculator basePrice={product.data.price} client:load />
      </div>
    </div>
  </div>
</Layout>
```

**Layer 2 Result:** Product catalog with sophisticated validation, pricing logic, and error handling - all type-safe.

---

## Layer 3: Client State (Shopping Cart Example)

**Use Case:** Shopping cart, interactive forms, multi-step wizards - anything needing client-side state.

**Added to Layer 2:**
- ✅ React state hooks (useState, useReducer)
- ✅ Client-side interactivity
- ✅ nanostores (for global client state)

**Still Don't Need:**
- ❌ Database
- ❌ API (state is ephemeral)

### Complete File Structure

```
src/
├── pages/
│   ├── shop/
│   │   ├── index.astro             # Product listing
│   │   ├── [slug].astro            # Product detail
│   │   └── cart.astro              # Shopping cart page
│   └── checkout.astro              # Checkout flow
│
├── content/
│   └── products/
│
├── components/
│   ├── ProductCard.tsx
│   ├── AddToCartButton.tsx         # Client island
│   ├── ShoppingCart.tsx            # Client island
│   └── CartSummary.tsx             # Client island
│
├── lib/
│   ├── services/
│   │   ├── productService.ts
│   │   └── cartService.ts          # Effect.ts cart logic
│   └── stores/
│       └── cart.ts                 # nanostores global state
```

### Cart Store (nanostores)

```typescript
// src/lib/stores/cart.ts
import { atom, map } from "nanostores";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export const cartItems = map<Record<string, CartItem>>({});

export const cartCount = atom(0);

// Actions
export function addToCart(item: Omit<CartItem, "quantity">) {
  const current = cartItems.get();
  const existing = current[item.productId];

  if (existing) {
    cartItems.setKey(item.productId, {
      ...existing,
      quantity: existing.quantity + 1,
    });
  } else {
    cartItems.setKey(item.productId, { ...item, quantity: 1 });
  }

  updateCartCount();
}

export function removeFromCart(productId: string) {
  const current = cartItems.get();
  const { [productId]: removed, ...rest } = current;
  cartItems.set(rest);
  updateCartCount();
}

export function updateQuantity(productId: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(productId);
  } else {
    const current = cartItems.get();
    const item = current[productId];
    if (item) {
      cartItems.setKey(productId, { ...item, quantity });
    }
  }
  updateCartCount();
}

export function clearCart() {
  cartItems.set({});
  cartCount.set(0);
}

function updateCartCount() {
  const items = Object.values(cartItems.get());
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.set(total);
}
```

### Cart Service (Effect.ts)

```typescript
// src/lib/services/cartService.ts
import { Effect, Data } from "effect";
import type { CartItem } from "@/lib/stores/cart";

export class CartError extends Data.TaggedError("CartError")<{
  reason: string;
}> {}

export const validateCartItem = (
  item: CartItem
): Effect.Effect<CartItem, CartError> =>
  Effect.gen(function* () {
    if (item.quantity < 1) {
      return yield* new CartError({ reason: "Quantity must be at least 1" });
    }
    if (item.quantity > 99) {
      return yield* new CartError({ reason: "Quantity cannot exceed 99" });
    }
    if (item.price <= 0) {
      return yield* new CartError({ reason: "Invalid price" });
    }
    return item;
  });

export const calculateCartTotal = (
  items: CartItem[]
): Effect.Effect<{ subtotal: number; tax: number; total: number }, CartError> =>
  Effect.gen(function* () {
    // Validate all items
    const validatedItems = yield* Effect.all(
      items.map(validateCartItem),
      { concurrency: "unbounded" }
    );

    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    return { subtotal, tax, total };
  });

export const applyDiscount = (
  total: number,
  code: string
): Effect.Effect<{ discount: number; finalTotal: number }, CartError> =>
  Effect.gen(function* () {
    let discount = 0;

    switch (code.toUpperCase()) {
      case "SAVE10":
        discount = total * 0.1;
        break;
      case "SAVE20":
        discount = total * 0.2;
        break;
      case "FREESHIP":
        discount = 10; // Free shipping
        break;
      default:
        return yield* new CartError({ reason: "Invalid discount code" });
    }

    return {
      discount,
      finalTotal: total - discount,
    };
  });
```

### Add to Cart Button

```tsx
// src/components/AddToCartButton.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/stores/cart";
import { ShoppingCart, Check } from "lucide-react";

type Props = {
  productId: string;
  name: string;
  price: number;
};

export function AddToCartButton({ productId, name, price }: Props) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({ productId, name, price });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button onClick={handleAdd} className="w-full" disabled={added}>
      {added ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
```

### Shopping Cart Component

```tsx
// src/components/ShoppingCart.tsx
import { useStore } from "@nanostores/react";
import { cartItems, removeFromCart, updateQuantity } from "@/lib/stores/cart";
import { calculateCartTotal } from "@/lib/services/cartService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Effect } from "effect";

export function ShoppingCart() {
  const $cartItems = useStore(cartItems);
  const items = Object.values($cartItems);

  const [totals, setTotals] = useState<{
    subtotal: number;
    tax: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const calculateTotals = async () => {
      if (items.length === 0) {
        setTotals(null);
        return;
      }

      const result = await Effect.runPromise(
        Effect.either(calculateCartTotal(items))
      );

      if (result._tag === "Right") {
        setTotals(result.right);
      }
    };

    calculateTotals();
  }, [$cartItems]);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shopping Cart ({items.length} items)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(item => (
          <div key={item.productId} className="flex items-center gap-4 p-4 border rounded">
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="99"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                className="w-20"
              />
            </div>

            <div className="font-bold">
              ${(item.price * item.quantity).toFixed(2)}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFromCart(item.productId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {totals && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (8%):</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button className="w-full" size="lg">
          Proceed to Checkout
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Cart Page

```astro
---
// src/pages/shop/cart.astro
import Layout from "@/layouts/Layout.astro";
import ShoppingCart from "@/components/ShoppingCart.tsx";
---

<Layout title="Shopping Cart">
  <div class="container max-w-4xl py-12">
    <h1 class="text-4xl font-bold mb-8">Shopping Cart</h1>
    <ShoppingCart client:load />
  </div>
</Layout>
```

### Product Page with Cart Button

```astro
---
// src/pages/shop/[slug].astro
import Layout from "@/layouts/Layout.astro";
import { getCollection } from "astro:content";
import AddToCartButton from "@/components/AddToCartButton.tsx";

export async function getStaticPaths() {
  const products = await getCollection("products");
  return products.map(product => ({
    params: { slug: product.data.slug },
    props: { product },
  }));
}

const { product } = Astro.props;
---

<Layout title={product.data.name}>
  <div class="container max-w-4xl py-12">
    <h1 class="text-4xl font-bold mb-4">{product.data.name}</h1>
    <p class="text-xl text-gray-600 mb-6">{product.data.description}</p>

    <div class="text-3xl font-bold text-green-600 mb-6">
      ${product.data.price.toFixed(2)}
    </div>

    <div class="max-w-sm">
      <AddToCartButton
        productId={product.id}
        name={product.data.name}
        price={product.data.price}
        client:load
      />
    </div>
  </div>
</Layout>
```

**Layer 3 Result:** Interactive shopping cart with client-side state management, all validated with Effect.ts.

---

## Layer 4: Data Persistence (Multi-Source Migration Example)

**Use Case:** Data migrations, external API integration, CMS syncing - anything that fetches/transforms data from external sources.

**Added to Layer 3:**
- ✅ REST API integration
- ✅ External data fetching
- ✅ Data transformation pipelines

**Still Don't Need:**
- ❌ Your own database (reading from external sources)

### Complete File Structure

```
src/
├── pages/
│   ├── migrate/
│   │   ├── index.astro             # Migration dashboard
│   │   └── [source].astro          # Source-specific migration
│   └── api/
│       └── migrate.ts              # API endpoint for migrations
│
├── lib/
│   └── services/
│       ├── migrationService.ts     # Effect.ts migration logic
│       ├── githubAdapter.ts        # GitHub API adapter
│       ├── notionAdapter.ts        # Notion API adapter
│       └── stripeAdapter.ts        # Stripe API adapter
│
└── components/
    └── MigrationStatus.tsx         # Real-time status display
```

### Migration Service (Effect.ts)

```typescript
// src/lib/services/migrationService.ts
import { Effect, Data, Context } from "effect";

// Tagged errors
export class FetchError extends Data.TaggedError("FetchError")<{
  source: string;
  reason: string;
}> {}

export class TransformError extends Data.TaggedError("TransformError")<{
  item: string;
  reason: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

// Data source interface
export interface DataSource {
  readonly name: string;
  readonly fetch: () => Effect.Effect<unknown[], FetchError>;
  readonly transform: (data: unknown) => Effect.Effect<MigratedItem, TransformError>;
  readonly validate: (item: MigratedItem) => Effect.Effect<MigratedItem, ValidationError>;
}

export const DataSource = Context.GenericTag<DataSource>("DataSource");

// Migrated item schema
export type MigratedItem = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  tags: string[];
  metadata: Record<string, any>;
};

// Migration pipeline
export const migrateFromSource = (
  source: DataSource
): Effect.Effect<MigratedItem[], FetchError | TransformError | ValidationError> =>
  Effect.gen(function* () {
    console.log(`Starting migration from ${source.name}...`);

    // Step 1: Fetch raw data
    const rawData = yield* source.fetch();
    console.log(`Fetched ${rawData.length} items from ${source.name}`);

    // Step 2: Transform each item
    const transformed = yield* Effect.all(
      rawData.map(item => source.transform(item)),
      { concurrency: 5 } // Process 5 items at a time
    );
    console.log(`Transformed ${transformed.length} items`);

    // Step 3: Validate each item
    const validated = yield* Effect.all(
      transformed.map(item => source.validate(item)),
      { concurrency: "unbounded" }
    );
    console.log(`Validated ${validated.length} items`);

    return validated;
  });

// Batch migration from multiple sources
export const migrateFromMultipleSources = (
  sources: DataSource[]
): Effect.Effect<
  Map<string, MigratedItem[]>,
  FetchError | TransformError | ValidationError
> =>
  Effect.gen(function* () {
    const results = yield* Effect.all(
      sources.map(source =>
        migrateFromSource(source).pipe(
          Effect.map(items => [source.name, items] as const)
        )
      ),
      { concurrency: 3 } // Process 3 sources at a time
    );

    return new Map(results);
  });

// Validation helper
export const validateMigratedItem = (
  item: MigratedItem
): Effect.Effect<MigratedItem, ValidationError> =>
  Effect.gen(function* () {
    if (!item.id?.trim()) {
      return yield* new ValidationError({
        field: "id",
        message: "ID is required",
      });
    }
    if (!item.title?.trim()) {
      return yield* new ValidationError({
        field: "title",
        message: "Title is required",
      });
    }
    if (item.tags.length === 0) {
      return yield* new ValidationError({
        field: "tags",
        message: "At least one tag required",
      });
    }
    return item;
  });
```

### GitHub Adapter

```typescript
// src/lib/services/githubAdapter.ts
import { Effect } from "effect";
import { FetchError, TransformError, validateMigratedItem, type MigratedItem, type DataSource } from "./migrationService";

type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  body: string;
  user: { login: string };
  created_at: string;
  labels: Array<{ name: string }>;
};

export const GitHubDataSource: DataSource = {
  name: "GitHub",

  fetch: (): Effect.Effect<GitHubIssue[], FetchError> =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(
          "https://api.github.com/repos/owner/repo/issues",
          {
            headers: {
              Authorization: `token ${import.meta.env.GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.statusText}`);
        }

        return response.json();
      },
      catch: (error) =>
        new FetchError({
          source: "GitHub",
          reason: error instanceof Error ? error.message : "Unknown error",
        }),
    }),

  transform: (data: unknown): Effect.Effect<MigratedItem, TransformError> =>
    Effect.try({
      try: () => {
        const issue = data as GitHubIssue;

        return {
          id: `github-${issue.number}`,
          title: issue.title,
          content: issue.body || "",
          author: issue.user.login,
          createdAt: new Date(issue.created_at),
          tags: issue.labels.map(l => l.name),
          metadata: {
            source: "github",
            issueNumber: issue.number,
            url: `https://github.com/owner/repo/issues/${issue.number}`,
          },
        };
      },
      catch: (error) =>
        new TransformError({
          item: JSON.stringify(data),
          reason: error instanceof Error ? error.message : "Transform failed",
        }),
    }),

  validate: validateMigratedItem,
};
```

### Notion Adapter

```typescript
// src/lib/services/notionAdapter.ts
import { Effect } from "effect";
import { FetchError, TransformError, validateMigratedItem, type MigratedItem, type DataSource } from "./migrationService";

type NotionPage = {
  id: string;
  properties: {
    Title: { title: Array<{ plain_text: string }> };
    Tags: { multi_select: Array<{ name: string }> };
    Created: { created_time: string };
  };
  url: string;
};

export const NotionDataSource: DataSource = {
  name: "Notion",

  fetch: (): Effect.Effect<NotionPage[], FetchError> =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(
          "https://api.notion.com/v1/databases/DATABASE_ID/query",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.NOTION_TOKEN}`,
              "Notion-Version": "2022-06-28",
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Notion API error: ${response.statusText}`);
        }

        const json = await response.json();
        return json.results;
      },
      catch: (error) =>
        new FetchError({
          source: "Notion",
          reason: error instanceof Error ? error.message : "Unknown error",
        }),
    }),

  transform: (data: unknown): Effect.Effect<MigratedItem, TransformError> =>
    Effect.try({
      try: () => {
        const page = data as NotionPage;

        return {
          id: `notion-${page.id}`,
          title: page.properties.Title.title[0]?.plain_text || "Untitled",
          content: "", // Would need to fetch page content separately
          author: "notion-import",
          createdAt: new Date(page.properties.Created.created_time),
          tags: page.properties.Tags.multi_select.map(t => t.name),
          metadata: {
            source: "notion",
            pageId: page.id,
            url: page.url,
          },
        };
      },
      catch: (error) =>
        new TransformError({
          item: JSON.stringify(data),
          reason: error instanceof Error ? error.message : "Transform failed",
        }),
    }),

  validate: validateMigratedItem,
};
```

### Migration Page

```astro
---
// src/pages/migrate/index.astro
import Layout from "@/layouts/Layout.astro";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MigrationStatus from "@/components/MigrationStatus.tsx";

const sources = [
  { name: "GitHub", description: "Import issues as blog posts", icon: "📦" },
  { name: "Notion", description: "Import database pages", icon: "📝" },
  { name: "Stripe", description: "Import customer data", icon: "💳" },
];
---

<Layout title="Data Migration">
  <div class="container max-w-6xl py-12">
    <h1 class="text-4xl font-bold mb-4">Data Migration</h1>
    <p class="text-xl text-gray-600 mb-12">
      Import content from external sources
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {sources.map(source => (
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span class="text-3xl">{source.icon}</span>
              {source.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-gray-600 mb-4">{source.description}</p>
            <Button asChild class="w-full">
              <a href={`/migrate/${source.name.toLowerCase()}`}>
                Start Migration
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>

    <MigrationStatus client:load />
  </div>
</Layout>
```

### Migration Status Component

```tsx
// src/components/MigrationStatus.tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Effect } from "effect";
import { migrateFromMultipleSources } from "@/lib/services/migrationService";
import { GitHubDataSource } from "@/lib/services/githubAdapter";
import { NotionDataSource } from "@/lib/services/notionAdapter";

type MigrationState = "idle" | "running" | "success" | "error";

export function MigrationStatus() {
  const [state, setState] = useState<MigrationState>("idle");
  const [results, setResults] = useState<Map<string, any[]> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setState("running");
    setError(null);

    const sources = [GitHubDataSource, NotionDataSource];

    const result = await Effect.runPromise(
      Effect.either(migrateFromMultipleSources(sources))
    );

    if (result._tag === "Left") {
      const err = result.left;
      setError(`Migration failed: ${err._tag} - ${JSON.stringify(err)}`);
      setState("error");
    } else {
      setResults(result.right);
      setState("success");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Migration Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runMigration}
          disabled={state === "running"}
          className="w-full"
        >
          {state === "running" ? "Migrating..." : "Run Migration"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Migration completed successfully!
              </AlertDescription>
            </Alert>

            {Array.from(results.entries()).map(([source, items]) => (
              <div key={source} className="p-4 border rounded">
                <h3 className="font-semibold mb-2">{source}</h3>
                <p className="text-sm text-gray-600">
                  Migrated {items.length} items
                </p>
                <ul className="mt-2 space-y-1">
                  {items.slice(0, 5).map(item => (
                    <li key={item.id} className="text-sm">
                      • {item.title}
                    </li>
                  ))}
                  {items.length > 5 && (
                    <li className="text-sm text-gray-500">
                      ... and {items.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Layer 4 Result:** Multi-source data migration with Effect.ts pipelines, error handling, and concurrent processing.

---

## Layer 5: Full-Stack App (Team Management Example)

**Use Case:** Full CRUD application with authentication, database persistence, and real-time updates.

**Added to Layer 4:**
- ✅ Database (PostgreSQL via Drizzle ORM)
- ✅ Authentication (Better Auth)
- ✅ REST API (Hono)
- ✅ WebSockets (real-time updates)

**Complete File Structure**

```
src/
├── pages/
│   ├── teams/
│   │   ├── index.astro             # Team list
│   │   ├── [id].astro              # Team detail
│   │   ├── new.astro               # Create team
│   │   └── [id]/
│   │       ├── edit.astro          # Edit team
│   │       └── members.astro       # Manage members
│   ├── auth/
│   │   ├── login.astro
│   │   ├── register.astro
│   │   └── logout.astro
│   └── api/
│       └── teams/
│           ├── index.ts            # List/create teams
│           ├── [id].ts             # Get/update/delete team
│           └── [id]/
│               └── members.ts      # Manage members
│
├── components/
│   ├── TeamList.tsx                # Real-time team list
│   ├── TeamForm.tsx                # Create/edit form
│   ├── MemberManager.tsx           # Add/remove members
│   └── AuthGuard.tsx               # Protected routes
│
├── lib/
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema
│   │   └── client.ts               # Database client
│   ├── auth/
│   │   └── config.ts               # Better Auth config
│   └── services/
│       ├── teamService.ts          # Effect.ts team logic
│       └── memberService.ts        # Effect.ts member logic
│
└── backend/
    └── src/
        ├── routes/
        │   └── teams.ts            # Hono routes
        └── server.ts               # Main server
```

### Database Schema (Drizzle)

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, varchar, timestamp, boolean, json } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  settings: json("settings").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").references(() => teams.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});
```

### Team Service (Effect.ts)

```typescript
// src/lib/services/teamService.ts
import { Effect, Data, Context } from "effect";
import { db } from "@/lib/db/client";
import { teams, teamMembers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Tagged errors
export class TeamNotFoundError extends Data.TaggedError("TeamNotFoundError")<{
  teamId: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  reason: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  reason: string;
}> {}

// Types
export type Team = typeof teams.$inferSelect;
export type CreateTeamInput = {
  name: string;
  description?: string;
  ownerId: string;
};
export type UpdateTeamInput = Partial<CreateTeamInput>;

// Database context
export interface Database {
  readonly db: typeof db;
}

export const Database = Context.GenericTag<Database>("Database");

// Validation
export const validateTeamName = (
  name: string
): Effect.Effect<string, ValidationError> =>
  Effect.gen(function* () {
    if (!name?.trim()) {
      return yield* new ValidationError({
        field: "name",
        message: "Team name is required",
      });
    }
    if (name.length < 2) {
      return yield* new ValidationError({
        field: "name",
        message: "Team name must be at least 2 characters",
      });
    }
    if (name.length > 100) {
      return yield* new ValidationError({
        field: "name",
        message: "Team name cannot exceed 100 characters",
      });
    }
    return name.trim();
  });

// Create team
export const createTeam = (
  input: CreateTeamInput
): Effect.Effect<Team, ValidationError | DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;

    // Validate input
    const validName = yield* validateTeamName(input.name);

    // Insert into database
    const result = yield* Effect.tryPromise({
      try: async () => {
        const [team] = await database.db
          .insert(teams)
          .values({
            name: validName,
            description: input.description,
            ownerId: input.ownerId,
            status: "active",
            settings: {},
          })
          .returning();
        return team;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "createTeam",
          reason: error instanceof Error ? error.message : "Unknown error",
        }),
    });

    return result;
  });

// Get team by ID
export const getTeamById = (
  teamId: string
): Effect.Effect<Team, TeamNotFoundError | DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;

    const result = yield* Effect.tryPromise({
      try: async () => {
        const [team] = await database.db
          .select()
          .from(teams)
          .where(eq(teams.id, teamId))
          .limit(1);
        return team;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getTeamById",
          reason: error instanceof Error ? error.message : "Unknown error",
        }),
    });

    if (!result) {
      return yield* new TeamNotFoundError({ teamId });
    }

    return result;
  });

// Update team
export const updateTeam = (
  teamId: string,
  userId: string,
  input: UpdateTeamInput
): Effect.Effect<Team, TeamNotFoundError | UnauthorizedError | ValidationError | DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;

    // Get existing team
    const team = yield* getTeamById(teamId);

    // Check authorization
    if (team.ownerId !== userId) {
      return yield* new UnauthorizedError({
        reason: "Only team owner can update team",
      });
    }

    // Validate input
    const validName = input.name
      ? yield* validateTeamName(input.name)
      : team.name;

    // Update database
    const result = yield* Effect.tryPromise({
      try: async () => {
        const [updated] = await database.db
          .update(teams)
          .set({
            name: validName,
            description: input.description ?? team.description,
            updatedAt: new Date(),
          })
          .where(eq(teams.id, teamId))
          .returning();
        return updated;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateTeam",
          reason: error instanceof Error ? error.message : "Unknown error",
        }),
    });

    return result;
  });

// Delete team
export const deleteTeam = (
  teamId: string,
  userId: string
): Effect.Effect<void, TeamNotFoundError | UnauthorizedError | DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;

    // Get existing team
    const team = yield* getTeamById(teamId);

    // Check authorization
    if (team.ownerId !== userId) {
      return yield* new UnauthorizedError({
        reason: "Only team owner can delete team",
      });
    }

    // Delete from database
    yield* Effect.tryPromise({
      try: async () => {
        await database.db.delete(teams).where(eq(teams.id, teamId));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "deleteTeam",
          reason: error instanceof Error ? error.message : "Unknown error",
        }),
    });
  });

// List user's teams
export const listUserTeams = (
  userId: string
): Effect.Effect<Team[], DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;

    const result = yield* Effect.tryPromise({
      try: async () => {
        // Teams where user is owner OR member
        const ownedTeams = await database.db
          .select()
          .from(teams)
          .where(eq(teams.ownerId, userId));

        const memberTeamIds = await database.db
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(eq(teamMembers.userId, userId));

        const memberTeams = await database.db
          .select()
          .from(teams)
          .where(
            eq(
              teams.id,
              memberTeamIds.map(m => m.teamId)[0] // Simplified - should use IN clause
            )
          );

        // Combine and deduplicate
        const allTeams = [...ownedTeams, ...memberTeams];
        const uniqueTeams = Array.from(
          new Map(allTeams.map(t => [t.id, t])).values()
        );

        return uniqueTeams;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "listUserTeams",
          reason: error instanceof Error ? error.message : "Unknown error",
        }),
    });

    return result;
  });
```

### API Routes (Hono)

```typescript
// backend/src/routes/teams.ts
import { Hono } from "hono";
import { Effect, Context } from "effect";
import {
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  listUserTeams,
  Database,
} from "@/lib/services/teamService";
import { db } from "@/lib/db/client";

const app = new Hono();

// Middleware: Provide database context
const withDatabase = <R, E, A>(
  effect: Effect.Effect<A, E, Database | R>
): Effect.Effect<A, E, R> =>
  effect.pipe(
    Effect.provideService(Database, { db })
  );

// GET /api/teams - List user's teams
app.get("/", async (c) => {
  const userId = c.get("userId"); // From auth middleware

  const result = await Effect.runPromise(
    Effect.either(withDatabase(listUserTeams(userId)))
  );

  if (result._tag === "Left") {
    const error = result.left;
    return c.json({ error: error._tag, details: error }, 500);
  }

  return c.json({ data: result.right });
});

// POST /api/teams - Create team
app.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const result = await Effect.runPromise(
    Effect.either(
      withDatabase(
        createTeam({
          name: body.name,
          description: body.description,
          ownerId: userId,
        })
      )
    )
  );

  if (result._tag === "Left") {
    const error = result.left;
    const status = error._tag === "ValidationError" ? 400 : 500;
    return c.json({ error: error._tag, details: error }, status);
  }

  return c.json({ data: result.right }, 201);
});

// GET /api/teams/:id - Get team
app.get("/:id", async (c) => {
  const teamId = c.req.param("id");

  const result = await Effect.runPromise(
    Effect.either(withDatabase(getTeamById(teamId)))
  );

  if (result._tag === "Left") {
    const error = result.left;
    const status = error._tag === "TeamNotFoundError" ? 404 : 500;
    return c.json({ error: error._tag, details: error }, status);
  }

  return c.json({ data: result.right });
});

// PATCH /api/teams/:id - Update team
app.patch("/:id", async (c) => {
  const teamId = c.req.param("id");
  const userId = c.get("userId");
  const body = await c.req.json();

  const result = await Effect.runPromise(
    Effect.either(
      withDatabase(
        updateTeam(teamId, userId, {
          name: body.name,
          description: body.description,
        })
      )
    )
  );

  if (result._tag === "Left") {
    const error = result.left;
    const status =
      error._tag === "TeamNotFoundError"
        ? 404
        : error._tag === "UnauthorizedError"
        ? 403
        : error._tag === "ValidationError"
        ? 400
        : 500;
    return c.json({ error: error._tag, details: error }, status);
  }

  return c.json({ data: result.right });
});

// DELETE /api/teams/:id - Delete team
app.delete("/:id", async (c) => {
  const teamId = c.req.param("id");
  const userId = c.get("userId");

  const result = await Effect.runPromise(
    Effect.either(withDatabase(deleteTeam(teamId, userId)))
  );

  if (result._tag === "Left") {
    const error = result.left;
    const status =
      error._tag === "TeamNotFoundError"
        ? 404
        : error._tag === "UnauthorizedError"
        ? 403
        : 500;
    return c.json({ error: error._tag, details: error }, status);
  }

  return c.json({ success: true }, 204);
});

export default app;
```

### Team List Component

```tsx
// src/components/TeamList.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Users } from "lucide-react";

type Team = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
};

export function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      const json = await response.json();

      if (response.ok) {
        setTeams(json.data);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError("Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading teams...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Teams</h2>
        <Button asChild>
          <a href="/teams/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </a>
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No teams yet. Create your first team!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teams.map(team => (
            <a key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {team.description || "No description"}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Team List Page

```astro
---
// src/pages/teams/index.astro
import Layout from "@/layouts/Layout.astro";
import TeamList from "@/components/TeamList.tsx";

// Server-side auth check
const session = Astro.locals.session;
if (!session) {
  return Astro.redirect("/auth/login");
}
---

<Layout title="Teams">
  <div class="container max-w-6xl py-12">
    <TeamList client:load />
  </div>
</Layout>
```

**Layer 5 Result:** Full-stack team management app with database, authentication, type-safe API, and Effect.ts business logic.

---

## Summary: When to Use Each Layer

| Layer | Use Case | Example |
|-------|----------|---------|
| **Layer 1** | Static content, marketing sites, docs | Blog, portfolio, documentation |
| **Layer 2** | Add validation/transformation | Product catalog, pricing calculator |
| **Layer 3** | Add client interactivity | Shopping cart, multi-step forms |
| **Layer 4** | Fetch/transform external data | Data migrations, API integrations |
| **Layer 5** | Full CRUD with auth/database | Team management, SaaS apps |

## Development Workflow

```bash
# Start with Layer 1
npm run dev

# Add content
echo "name: My Team" > src/content/teams/myteam.yaml

# Generate types
bunx astro sync

# Add Layer 2 validation
# Create Effect.ts service in src/lib/services/

# Add Layer 3 interactivity
# Create React component with client:load

# Add Layer 4 persistence
# Set up backend API

# Add Layer 5 full-stack
# Add database + auth
```

## Key Principles

1. **Start simple** - Begin at Layer 1, only add complexity when needed
2. **Type-safe everywhere** - Zod schemas → TypeScript types → Effect.ts services
3. **Progressive enhancement** - Each layer builds on the previous
4. **Effect.ts for logic** - All business logic uses Effect.ts for error handling
5. **Content collections first** - Use content collections before reaching for a database

---

**Built for clarity. Designed for scale. Perfect for AI agents.**
