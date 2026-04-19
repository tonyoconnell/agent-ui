# AI Tools Integration Plan

**Version:** 1.0.0
**Status:** Draft
**Created:** 2025-11-04
**Target:** ONE Platform v1.0.0+

---

## Overview

Integrate AI tools from the [ai-tools-registry](https://github.com/xn1cklas/ai-tools-registry) into the ONE Platform to enable features like image generation, web search, weather data, news search, and QR code generation.

**GitHub:** [xn1cklas/ai-tools-registry](https://github.com/xn1cklas/ai-tools-registry)
**Demo:** [ai-tools-registry.vercel.app](https://ai-tools-registry.vercel.app/)

---

## Part 1: Available Tools & Features

### Image Generation Tools
- **OpenAI DALL-E 3** - High-quality text-to-image generation
- **FAL.ai** - Fast image generation with multiple models
- **Runware** - Scalable AI image generation
- **Gemini** - Google's multimodal image creation

**Use Cases:**
- Product image generation for e-commerce
- Blog post thumbnails
- Social media graphics
- Course material illustrations

### Web Search Tools
- **Perplexity** - AI-powered search with citations
- **EXA** - Semantic web search
- **Firecrawl** - Web scraping and content extraction
- **Brave Search** - Privacy-focused search API
- **DuckDuckGo** - Free web search (no API key required)

**Use Cases:**
- Research assistance in courses
- Content discovery for blogs
- Market research data gathering
- Real-time information lookup

### Data & Information Tools
- **Weather Forecast** - Location-based weather using Open-Meteo
- **Earthquake Statistics** - USGS seismic data with visualization
- **News Search** - Hacker News headlines via Algolia
- **QR Code Generator** - Encode text/URLs into QR codes

**Use Cases:**
- Event planning with weather data
- Location-based content
- News aggregation
- Digital asset sharing

---

## Part 2: Implementation

### Installation Steps

**Step 1: Install AI SDK**

```bash
cd web/
bun add ai @ai-sdk/openai @ai-sdk/google-generative-ai
```

**Step 2: Install Individual Tools**

```bash
# Install tools from the registry
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/weather
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/image-openai
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/search-brave
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/search-duckduckgo
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/news-hn
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/qr-code
```

**Step 3: Configure API Keys**

```bash
# web/.env.local
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
BRAVE_API_KEY=...
FAL_API_KEY=...
```

---

### Usage Examples

#### 1. Weather Tool Integration

**Create Weather Component** (`src/components/features/WeatherCard.tsx`)

```typescript
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWeather } from "@/tools/weather"; // Installed from registry

export function WeatherCard() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const result = await getWeather({ location });
      setWeather(result);
    } catch (error) {
      console.error("Weather fetch failed:", error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Button onClick={fetchWeather} disabled={loading}>
            {loading ? "Loading..." : "Get Weather"}
          </Button>
        </div>

        {weather && (
          <div className="space-y-2">
            <p className="text-2xl font-bold">{weather.temperature}°C</p>
            <p className="text-muted-foreground">{weather.conditions}</p>
            <p className="text-sm">Humidity: {weather.humidity}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Add to Page** (`src/pages/dashboard.astro`)

```astro
---
import Layout from "@/layouts/Layout.astro";
import WeatherCard from "@/components/features/WeatherCard";
---

<Layout title="Dashboard">
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <div class="grid md:grid-cols-2 gap-6">
      <WeatherCard client:load />
    </div>
  </div>
</Layout>
```

---

#### 2. Image Generation Tool

**Create Image Generator** (`src/components/features/ImageGenerator.tsx`)

```typescript
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateImage } from "@/tools/image-openai"; // From registry

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateImage({
        prompt,
        n: 1,
        size: "1024x1024"
      });
      setImageUrl(result.data[0].url);
    } catch (error) {
      console.error("Image generation failed:", error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Image Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mb-4"
        />
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? "Generating..." : "Generate Image"}
        </Button>

        {imageUrl && (
          <div className="mt-6">
            <img
              src={imageUrl}
              alt={prompt}
              className="w-full rounded-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

#### 3. Web Search Tool

**Create Search Component** (`src/components/features/WebSearch.tsx`)

```typescript
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchWeb } from "@/tools/search-brave"; // From registry

export function WebSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchResults = await searchWeb({ query, count: 10 });
      setResults(searchResults.results);
    } catch (error) {
      console.error("Search failed:", error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Web Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search the web..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            Search
          </Button>
        </div>

        <div className="space-y-4">
          {results.map((result, i) => (
            <div key={i} className="border-b pb-3">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                {result.title}
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                {result.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

#### 4. News Headlines Tool

**Create News Feed** (`src/components/features/NewsHeadlines.tsx`)

```typescript
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNewsHeadlines } from "@/tools/news-hn"; // From registry

export function NewsHeadlines() {
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const news = await getNewsHeadlines({ query: "AI", hits: 20 });
        setHeadlines(news.hits);
      } catch (error) {
        console.error("News fetch failed:", error);
      }
      setLoading(false);
    };

    fetchNews();
  }, []);

  if (loading) return <div>Loading news...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest AI News</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {headlines.map((item) => (
            <div key={item.objectID} className="border-b pb-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {item.title}
              </a>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">{item.points} points</Badge>
                <Badge variant="outline">{item.num_comments} comments</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

#### 5. QR Code Generator

**Create QR Component** (`src/components/features/QRCodeGenerator.tsx`)

```typescript
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateQRCode } from "@/tools/qr-code"; // From registry

export function QRCodeGenerator() {
  const [text, setText] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const handleGenerate = async () => {
    const result = await generateQRCode({ text, size: 256 });
    setQrCodeUrl(result.url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Enter text or URL..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-4"
        />
        <Button onClick={handleGenerate} className="w-full mb-4">
          Generate QR Code
        </Button>

        {qrCodeUrl && (
          <div className="flex justify-center">
            <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Backend Integration (Optional)

If you want to use these tools in Convex backend functions:

**Create Backend Wrapper** (`backend/convex/services/aiTools.ts`)

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";
import { generateImage } from "../../web/src/tools/image-openai";
import { getWeather } from "../../web/src/tools/weather";

export const generateProductImage = action({
  args: {
    prompt: v.string(),
    productId: v.id("things"),
  },
  handler: async (ctx, args) => {
    // Generate image
    const result = await generateImage({
      prompt: args.prompt,
      n: 1,
      size: "1024x1024"
    });

    // Store image URL in product entity
    await ctx.runMutation(api.mutations.entities.update, {
      id: args.productId,
      properties: {
        imageUrl: result.data[0].url,
      },
    });

    // Log event
    await ctx.runMutation(api.mutations.events.create, {
      type: "image_generated",
      targetId: args.productId,
      metadata: { prompt: args.prompt },
    });

    return result.data[0].url;
  },
});
```

---

### File Structure

```
web/
├── src/
│   ├── components/
│   │   └── features/
│   │       ├── WeatherCard.tsx
│   │       ├── ImageGenerator.tsx
│   │       ├── WebSearch.tsx
│   │       ├── NewsHeadlines.tsx
│   │       └── QRCodeGenerator.tsx
│   ├── tools/                    # Installed from registry
│   │   ├── weather.ts
│   │   ├── image-openai.ts
│   │   ├── search-brave.ts
│   │   ├── search-duckduckgo.ts
│   │   ├── news-hn.ts
│   │   └── qr-code.ts
│   └── pages/
│       ├── tools/
│       │   └── index.astro       # Tools showcase page
│       └── dashboard.astro       # Use tools in dashboard
```

---

### Implementation Checklist

**Setup:**
- [ ] Install AI SDK packages (`bun add ai @ai-sdk/openai`)
- [ ] Install tools from registry (6 tools via shadcn CLI)
- [ ] Configure API keys in `.env.local`
- [ ] Test each tool individually

**Integration:**
- [ ] Create WeatherCard component
- [ ] Create ImageGenerator component
- [ ] Create WebSearch component
- [ ] Create NewsHeadlines component
- [ ] Create QRCodeGenerator component
- [ ] Add tools page at `/tools` to showcase all features

**Polish:**
- [ ] Add loading states to all components
- [ ] Add error handling and user-friendly messages
- [ ] Add rate limiting (avoid API overuse)
- [ ] Add caching for weather/news data
- [ ] Add usage analytics (log which tools are used)

**Documentation:**
- [ ] Document API key setup process
- [ ] Create user guide for each tool
- [ ] Add examples to documentation
- [ ] Update environment variables guide

---

## Quick Start

```bash
# 1. Install dependencies
cd web/
bun add ai @ai-sdk/openai @ai-sdk/google-generative-ai

# 2. Install tools
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/weather
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/image-openai
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/search-duckduckgo
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/news-hn
npx shadcn@latest add https://ai-tools-registry.vercel.app/r/qr-code

# 3. Add API keys to .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local

# 4. Start dev server
bun run dev

# 5. Test tools at http://localhost:4321/tools
```

---

## Use Cases in ONE Platform

### 1. Course Platform
- Generate course thumbnail images
- Fetch weather for event planning
- Search web for research materials
- Display tech news in student dashboard

### 2. E-commerce
- Generate product images from descriptions
- QR codes for product sharing
- Web search for competitor research
- Weather data for seasonal promotions

### 3. Content Platform
- Generate blog post images
- Fetch latest news headlines
- Weather widgets for travel blogs
- QR codes for digital content sharing

### 4. DAO/Community Platform
- Generate proposal images
- News aggregation for members
- Weather for in-person meetups
- QR codes for event check-ins

---

## API Key Requirements

| Tool | API Key Required | Free Tier | Signup URL |
|------|------------------|-----------|------------|
| OpenAI DALL-E | Yes | $5 credit | https://platform.openai.com/signup |
| Weather (Open-Meteo) | No | Unlimited | - |
| DuckDuckGo Search | No | Unlimited | - |
| Brave Search | Yes | 2,000 queries/month | https://brave.com/search/api/ |
| Hacker News | No | Unlimited | - |
| QR Code | No | Unlimited | - |

**Start with free tools first:**
1. Weather (no key required)
2. DuckDuckGo Search (no key required)
3. Hacker News (no key required)
4. QR Code (no key required)

---

## Success Metrics

- [ ] All 6 tools successfully installed
- [ ] Components working in development
- [ ] API keys configured and validated
- [ ] Tools page created and accessible
- [ ] At least 3 tools integrated into existing features
- [ ] Error handling working properly
- [ ] Loading states smooth and responsive

---

## Next Steps

1. Run the quick start commands
2. Test each tool individually
3. Create a tools showcase page at `/tools`
4. Integrate 2-3 tools into existing features
5. Deploy to production

---

**Estimated Time:** 2-4 hours
**Difficulty:** Easy
**Dependencies:** AI SDK, API keys (optional for some tools)
