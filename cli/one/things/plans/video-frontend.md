# Video Frontend Plan (Frontend-First, No Backend)

**Version:** 1.0.0
**Status:** Planning
**Created:** 2025-11-08
**Source:** Bull.fm migration (optimized)
**Total Cycles:** 18 (frontend-first approach)

---

## Executive Summary

Build working video player functionality on the frontend WITHOUT requiring backend infrastructure. This enables immediate deployment and testing while deferring multi-tenant database work. Uses YouTube embeds for zero hosting costs and proven Bull.fm components.

**Architecture:** Pure Frontend (Astro 5 + React 19)
**Quick Win:** Cycle 10 - Working video gallery deployed to production
**No Backend Required:** All data in static content collections

---

## 6-Dimension Ontology Mapping

**Frontend-First Approach:**
- GROUPS: Deferred (single-tenant for now)
- PEOPLE: Deferred (no auth required)
- THINGS: Static content collections (videos as MDX files)
- CONNECTIONS: Deferred (no playlists yet)
- EVENTS: Deferred (no analytics yet)
- KNOWLEDGE: Deferred (no AI search yet)

**Future Backend Migration:** See `/one/things/plans/video-backend.md`

---

## Dependencies

### Required Dependencies
```json
{
  "@astro-community/astro-embed-youtube": "^0.5.7",
  "@mux/mux-player-react": "^3.8.0",
  "react-h5-audio-player": "^3.10.1",
  "lucide-react": "^0.546.0",
  "zod": "^4.1.12",
  "react": "^19.1.1",
  "react-dom": "^19.1.1"
}
```

### Already Installed in web/package.json
- `astro`: ✅ (5.14.1)
- `react`: ✅ (19.1.1)
- `react-dom`: ✅ (19.1.1)
- `lucide-react`: ✅ (0.546.0)
- `zod`: ✅ (4.1.12)
- `@astro-community/astro-embed-youtube`: ✅ (0.5.7)
- `react-h5-audio-player`: ✅ (3.10.1)

### Need to Install
- `@mux/mux-player-react`: ❌ (Mux video player - official, production-ready)

---

## ⚡ Quick Wins (Cycles 1-10)

**Goal:** Working video gallery live in production by Cycle 10

### Cycle 1-2: Setup (2 cycles)
**Agent:** agent-frontend

✓ **Cycle 1:** Install dependencies
  - Run `cd web && bun add @mux/mux-player-react`
  - Verify installation in package.json
  - Test imports in a simple component

✓ **Cycle 2:** Create content collection schema
  - Create `web/src/content/videos/` directory
  - Define Zod schema for video metadata (title, description, playbackId, muxAssetId, youtubeId, thumbnail, duration)
  - Create sample video entries (3-4 videos)

### Cycle 3-6: Core Components (4 cycles)
**Agent:** agent-frontend

✓ **Cycle 3:** Create VideoPlayer component
  - Create `web/src/components/media/VideoPlayer.tsx` using @mux/mux-player-react
  - Support both Mux (playbackId) and YouTube (youtubeId) sources
  - Add metadata tracking (video_id, video_title, viewer_user_id)
  - Test with sample playbackId

✓ **Cycle 4:** Port VideoEmbed component
  - Copy `apps/bullfm/src/components/lessons/VideoEmbed.tsx` → `web/src/components/media/VideoEmbed.tsx`
  - Use @astro-community/astro-embed-youtube for SSR
  - Test with different YouTube IDs

✓ **Cycle 5:** Create VideoCard component
  - Build thumbnail card with metadata
  - Use lucide-react icons (Play icon)
  - Add hover effects with Tailwind v4
  - Link to video detail page

✓ **Cycle 6:** Create VideoGallery component
  - Grid layout (3 columns desktop, 1 column mobile)
  - Load videos from content collection
  - Sort by date (newest first)

### Cycle 7-9: Pages (3 cycles)
**Agent:** agent-frontend

✓ **Cycle 7:** Create `/videos` page
  - Use VideoGallery component
  - SSR with Astro (fast initial load)
  - Add page header and description

✓ **Cycle 8:** Create `/videos/[slug]` page
  - Dynamic route for single video
  - Use VideoPlayer component
  - Display metadata (title, description, duration)
  - Add "Back to Gallery" link

✓ **Cycle 9:** Responsive design polish
  - Mobile optimization (touch-friendly controls)
  - Tablet breakpoints
  - Dark mode support (if enabled)

### Cycle 10: Deploy MVP
**Agent:** agent-ops

✓ **Cycle 10:** Deploy to production
  - Build: `cd web && bun run build`
  - Deploy: `wrangler pages deploy dist`
  - ✅ **MILESTONE: Working video gallery live at web.one.ie/videos**

---

## 📋 Full Plan (18 Cycles)

### Phase 1: Setup (Cycles 1-2)
**Agent:** agent-frontend
**Deliverable:** Dependencies installed, content collection configured

- Cycle 1: Install Mux player dependency (others already installed)
- Cycle 2: Create content collection schema + sample data

### Phase 2: Core Components (Cycles 3-6)
**Agent:** agent-frontend
**Deliverable:** Reusable video components

- Cycle 3: Create VideoPlayer (Mux + YouTube support)
- Cycle 4: Port VideoEmbed (SSR YouTube embeds)
- Cycle 5: Create VideoCard (thumbnail + metadata)
- Cycle 6: Create VideoGallery (grid layout)

### Phase 3: Pages (Cycles 7-9)
**Agent:** agent-frontend
**Deliverable:** Video browsing UI

- Cycle 7: `/videos` page (gallery view)
- Cycle 8: `/videos/[slug]` page (single video player)
- Cycle 9: Responsive design polish

### Phase 4: Deploy MVP (Cycle 10)
**Agent:** agent-ops
**Deliverable:** Live video gallery

- Cycle 10: Production deployment
  - ✅ **MILESTONE: Video gallery live**

### Phase 5: Podcast Support (Cycles 11-14)
**Agent:** agent-frontend
**Deliverable:** Audio player for podcasts

- Cycle 11: Port AudioPlayer component (react-h5-audio-player)
- Cycle 12: Create podcast content collection schema
- Cycle 13: Create `/podcasts` page (gallery view)
- Cycle 14: Create `/podcasts/[slug]` page (audio player)

### Phase 6: Enhanced Features (Cycles 15-17)
**Agent:** agent-frontend
**Deliverable:** Improved UX

- Cycle 15: Add categories/tags to videos
- Cycle 16: Add search filter (client-side)
- Cycle 17: Add related videos sidebar

### Phase 7: Final Deploy (Cycle 18)
**Agent:** agent-ops
**Deliverable:** Complete frontend deployed

- Cycle 18: Production deployment
  - ✅ **LAUNCH: Full video + podcast frontend live**

---

## Component Structure

### New Components to Create

**Video Components:**
```
web/src/components/media/VideoPlayer.tsx
- Uses @mux/mux-player-react for Mux-hosted videos
- Falls back to YouTube embeds for youtubeId
- Metadata tracking for analytics

web/src/components/media/VideoEmbed.tsx
- SSR YouTube embeds using @astro-community/astro-embed-youtube
- Lightweight for marketing pages

web/src/components/media/VideoCard.tsx
- Thumbnail card with metadata
- Links to video detail page

web/src/components/media/VideoGallery.tsx
- Grid layout for video browsing
```

**Audio Components:**
```
web/src/components/media/AudioPlayer.tsx
- Uses react-h5-audio-player
- Support for podcast episodes
```

**Content Collections:**
```
web/src/content/config.ts
- Add videos collection schema
- Add podcasts collection schema
```

---

## Content Collection Schemas

### Video Schema
```typescript
// web/src/content/config.ts
import { defineCollection, z } from 'astro:content';

const videosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    playbackId: z.string().optional(),  // Mux playback ID (primary)
    muxAssetId: z.string().optional(),  // Mux asset ID for metadata
    youtubeId: z.string().optional(),   // YouTube fallback
    videoUrl: z.string().optional(),    // Direct URL fallback
    thumbnail: z.string(),              // Image URL or path
    duration: z.number(),               // Seconds
    publishedAt: z.date(),
    author: z.string().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  videos: videosCollection,
};
```

### Sample Video Entries

**Mux-hosted video:**
```markdown
---
# web/src/content/videos/mux-example.md
title: "Mux Video Example"
description: "Example video hosted on Mux"
playbackId: "a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M"
muxAssetId: "video-123"
thumbnail: "/images/videos/mux-example-thumb.jpg"
duration: 300
publishedAt: 2025-01-15
author: "ONE Platform"
categories: ["tutorial"]
tags: ["mux", "video"]
---

Example video demonstrating Mux player integration...
```

**YouTube fallback:**
```markdown
---
# web/src/content/videos/youtube-example.md
title: "YouTube Video Example"
description: "Example video from YouTube"
youtubeId: "dQw4w9WgXcQ"
thumbnail: "/images/videos/youtube-thumb.jpg"
duration: 420
publishedAt: 2025-01-15
author: "ONE Platform"
categories: ["demo"]
tags: ["youtube"]
---

Example video using YouTube embed...
```

---

## Technology Stack

### Frontend
- **Framework:** Astro 5.14.1 + React 19.1.1
- **Styling:** Tailwind v4.1.13
- **Video Player:** @mux/mux-player-react 3.8.0 (primary) + @astro-community/astro-embed-youtube 0.5.7 (fallback)
- **Audio Player:** react-h5-audio-player 3.10.1
- **Icons:** lucide-react 0.546.0
- **Validation:** Zod 4.1.12

### Deployment
- **Frontend:** Cloudflare Pages (web.one.ie)
- **Assets:** Static files in `/public/`
- **Video Hosting:** Mux (production-ready CDN) or YouTube (zero cost fallback)

### No Backend Required
- ❌ No Convex (deferred to video-backend.md)
- ❌ No database (content collections only)
- ❌ No auth (public access)
- ❌ No analytics (deferred)

---

## Success Metrics

### Cycle 10 Milestone
✅ Working video gallery deployed
- [ ] 3+ YouTube videos playable
- [ ] Grid layout responsive (mobile + desktop)
- [ ] Individual video pages working
- [ ] Fast load times (<2s)

### Cycle 18 Launch
✅ Full frontend in production
- [ ] Video gallery live
- [ ] Podcast player functional
- [ ] Search/filter working (client-side)
- [ ] Related content sidebar
- [ ] Mobile-optimized

---

## Migration to Backend (Future)

When ready to add multi-tenancy, analytics, and user features:

**See:** `/one/things/plans/video-backend.md`

**Migration Path:**
1. Content collections → Convex things table
2. Static data → Dynamic queries
3. Add groupId for multi-tenancy
4. Add auth for creator uploads
5. Add events for analytics
6. Add knowledge for AI search

**Estimated:** 24 cycles (separate plan)

---

## Risk Assessment

### Technical Risks

**Low Risk: Component Porting**
- Bull.fm components are clean React/TypeScript
- 90%+ reusable with minor import changes

**Low Risk: YouTube Embeds**
- Well-documented @astro-community package
- Zero hosting costs, proven reliability

**Low Risk: Content Collections**
- Astro native feature, type-safe
- Easy migration to database later

### Business Risks

**Zero Cost: No Hosting**
- YouTube embeds are free
- Static content collections
- Cloudflare Pages free tier

**Low Risk: No Backend Lock-In**
- Easy migration to Convex when ready
- Content collections → database is straightforward

---

## Next Steps

### To Start Execution

```bash
# 1. Review this plan
cat /Users/toc/Server/ONE/one/things/plans/video-frontend.md

# 2. Start Cycle 1 (most dependencies already installed!)
cd web && bun add @mux/mux-player-react

# 3. Execute cycles sequentially
/next  # Advance to next cycle
/done  # Mark current cycle complete

# 4. Or fast-track entire frontend
/fast video-frontend  # Build all 18 cycles
```

### To Modify Plan

```bash
/plan optimize          # Reduce cycle count further
/plan add-feature [X]   # Add new feature to plan
/plan skip [N]          # Skip cycle N (not applicable)
```

---

## Dependencies on Other Plans

**Blocked By:** None (completely standalone)
**Blocks:** None
**Related:** `/one/things/plans/video-backend.md` (future backend work)

---

## Appendix: Dependencies

**Already Installed:**
- `@astro-community/astro-embed-youtube`: "^0.5.7" (YouTube embeds) ✅
- `react-h5-audio-player`: "^3.10.1" (podcast player) ✅
- `lucide-react`: "^0.546.0" (icons) ✅
- `zod`: "^4.1.12" (validation) ✅
- `astro`: "^5.14.1" (static site generator) ✅
- `react`: "^19.1.1" (UI library - React 19!) ✅
- `react-dom`: "^19.1.1" (React renderer) ✅

**Need to Install:**
- `@mux/mux-player-react`: "^3.8.0" (Mux video player - official package) ❌

## Mux Player Features

**Official Package:** https://www.npmjs.com/package/@mux/mux-player-react

**Key Features:**
- Production-ready player with built-in controls
- Automatic quality selection and adaptive streaming
- Built-in metadata tracking for analytics
- Lazy loading support for performance
- Works with Mux Video CDN
- Fallback poster/placeholder images

**Basic Usage:**
```tsx
import MuxPlayer from '@mux/mux-player-react';

<MuxPlayer
  playbackId="a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M"
  metadata={{
    video_id: "video-123",
    video_title: "Example Video",
    viewer_user_id: "user-456"
  }}
/>
```

**Lazy Loading:**
```tsx
import MuxPlayer from '@mux/mux-player-react/lazy';

<MuxPlayer
  loading="viewport"
  playbackId="DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
  metadata={{
    video_id: 'video-id-123456',
    video_title: 'Big Buck Bunny',
    viewer_user_id: 'user-id-bc-789'
  }}
/>
```

---

**Built for speed, zero backend complexity.**

**Plan Status:** Ready for execution
**Next Command:** Start Cycle 1 with dependency installation
