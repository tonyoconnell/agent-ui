# Video Backend Plan (Multi-Tenant Database Layer)

**Version:** 1.0.0
**Status:** Planning
**Created:** 2025-11-08
**Prerequisites:** video-frontend.md must be completed first
**Total Cycles:** 24 (backend infrastructure)

---

## Executive Summary

Add multi-tenant database layer to support creator uploads, progress tracking, analytics, and AI-powered features. Migrates static content collections to Convex with full 6-dimension ontology compliance.

**Architecture:** Convex Backend (Effect.ts services + Convex mutations/queries)
**Quick Win:** Cycle 10 - Multi-tenant video database live with groupId scoping
**Prerequisite:** Frontend working (see `/one/things/plans/video-frontend.md`)

---

## 6-Dimension Ontology Mapping

### GROUPS
- Organization media libraries (groupId scoping)
- Course collections (nested groups with parentGroupId)
- Playlist containers (group-scoped)

### PEOPLE
- Content creators (upload, manage) → `creator` thing type
- Viewers (consume, track progress) → `user` thing type
- Roles: `org_owner` (full access), `org_user` (view only), `customer` (purchased content)

### THINGS
Core video/podcast entities:
```typescript
{
  type: "video",
  groupId: Id<"groups">,
  name: "Video Title",
  properties: {
    description: string,
    youtubeId?: string,      // For YouTube embeds
    videoUrl?: string,        // For native hosting (Cloudinary/Mux)
    thumbnail: string,
    duration: number,         // Seconds
    transcript?: string,      // Full transcript text
    categories: string[],
    tags: string[],
    viewCount: number,
    publishedAt: number,
  },
  status: "draft" | "published" | "archived"
}

{
  type: "podcast",
  groupId: Id<"groups">,
  name: "Episode Title",
  properties: {
    description: string,
    audioUrl: string,         // MP3/M4A file (Cloudinary)
    thumbnail: string,
    duration: number,
    transcript?: string,
    episodeNumber?: number,
    seasonNumber?: number,
    viewCount: number,
    publishedAt: number,
  },
  status: "draft" | "published" | "archived"
}

{
  type: "playlist",
  groupId: Id<"groups">,
  name: "Playlist Title",
  properties: {
    description: string,
    playlistType: "video" | "podcast" | "course",
    itemCount: number,
  },
  status: "active"
}

{
  type: "course",
  groupId: Id<"groups">,
  name: "Course Title",
  properties: {
    description: string,
    instructor: string,
    level: "beginner" | "intermediate" | "advanced",
    estimatedHours: number,
    totalLessons: number,
  },
  status: "draft" | "published"
}

{
  type: "lesson",
  groupId: Id<"groups">,
  name: "Lesson Title",
  properties: {
    description: string,
    order: number,
    videoId?: Id<"things">,   // Reference to video thing
    duration: number,
    lessonType: "video" | "text" | "quiz",
  },
  status: "draft" | "published"
}
```

### CONNECTIONS
```typescript
{
  type: "contains",
  fromThingId: playlistId,
  toThingId: videoId,
  metadata: { order: 1 }
}

{
  type: "authored",
  fromThingId: creatorId,
  toThingId: videoId,
  metadata: {
    role: "creator" | "producer" | "editor",
    createdAt: number
  }
}

{
  type: "enrolled_in",
  fromThingId: userId,
  toThingId: courseId,
  metadata: {
    startedAt: number,
    progress: 0.65,  // 0-1 scale
    lastAccessedAt: number
  }
}

{
  type: "watched",
  fromThingId: userId,
  toThingId: videoId,
  metadata: {
    lastPosition: 245,  // Seconds
    completed: false,
    watchedAt: number
  }
}
```

### EVENTS
```typescript
{
  type: "content_event",
  action: "video_viewed",
  actorId: userId,
  targetId: videoId,
  groupId: Id<"groups">,
  metadata: {
    duration: number,
    completionRate: 0.85,
    watchTime: number,
    deviceType: "mobile" | "desktop"
  }
}

{
  type: "content_event",
  action: "video_uploaded",
  actorId: creatorId,
  targetId: videoId,
  groupId: Id<"groups">,
  metadata: {
    size: number,      // Bytes
    format: "mp4" | "webm",
    processingTime: number
  }
}

{
  type: "entity_created",
  action: "playlist_created",
  actorId: creatorId,
  targetId: playlistId,
  groupId: Id<"groups">,
  metadata: { itemCount: 0 }
}
```

### KNOWLEDGE
- Video transcripts chunked for RAG (500-word chunks, 50-word overlap)
- Podcast transcripts with speaker diarization
- Auto-generated labels: topics, keywords, sentiment
- Vector embeddings for semantic search (text-embedding-3-large, 1536-dim)
- Thematic connections between content

---

## ⚡ Quick Wins (Cycles 1-10)

**Goal:** Multi-tenant video database live by Cycle 10

### Cycle 1-3: Schema Design (3 cycles)
**Agent:** agent-backend

✓ **Cycle 1:** Update schema.ts
  - Add video/podcast/playlist/course/lesson thing types to schema
  - Add watched/contains/enrolled_in connection types
  - Add content_event event types
  - Validate against 6-dimension ontology

✓ **Cycle 2:** Add validation schemas
  - Zod schemas for video/podcast properties
  - Connection metadata validators
  - Event metadata validators

✓ **Cycle 3:** Test schema
  - Create sample video thing
  - Create sample connections
  - Create sample events
  - Verify multi-tenant isolation (groupId)

### Cycle 4-7: Core Mutations (4 cycles)
**Agent:** agent-backend

✓ **Cycle 4:** Video mutations
  - `createVideo` - Add video to library
  - `updateVideo` - Update metadata
  - `deleteVideo` - Archive video
  - All scoped by groupId

✓ **Cycle 5:** Progress tracking mutations
  - `updateWatchProgress` - Track viewing position
  - `markVideoComplete` - Mark as watched
  - Create watched connection + content_event

✓ **Cycle 6:** Playlist mutations
  - `createPlaylist` - Create video collections
  - `addToPlaylist` - Add video to playlist (creates contains connection)
  - `removeFromPlaylist` - Remove video
  - `reorderPlaylist` - Update order metadata

✓ **Cycle 7:** Course mutations
  - `createCourse` - Create course thing
  - `createLesson` - Create lesson thing
  - `enrollInCourse` - Create enrolled_in connection
  - `updateCourseProgress` - Track lesson completion

### Cycle 8-10: Core Queries (3 cycles)
**Agent:** agent-backend

✓ **Cycle 8:** Video queries
  - `listVideos` - Get all videos for group (groupId scoped)
  - `getVideoById` - Single video with metadata
  - `getCreatorVideos` - Videos by creator (authored connections)

✓ **Cycle 9:** Playlist queries
  - `listPlaylists` - Get all playlists for group
  - `getPlaylistVideos` - Videos in playlist order (contains connections)
  - `getUserPlaylists` - Playlists created by user

✓ **Cycle 10:** Progress queries
  - `getWatchProgress` - Get user's watch history (watched connections)
  - `getCourseProgress` - Get enrollment progress (enrolled_in connections)
  - ✅ **MILESTONE: Multi-tenant video database live**

---

## 📋 Full Plan (24 Cycles)

### Phase 1: Schema (Cycles 1-3)
**Agent:** agent-backend
**Deliverable:** Database schema with 6-dimension compliance

- Cycle 1: Update schema.ts with video types
- Cycle 2: Add Zod validation schemas
- Cycle 3: Test schema with sample data

### Phase 2: Video Mutations (Cycles 4-7)
**Agent:** agent-backend
**Deliverable:** Video CRUD operations

- Cycle 4: Video mutations (create, update, delete)
- Cycle 5: Progress tracking mutations
- Cycle 6: Playlist mutations
- Cycle 7: Course mutations

### Phase 3: Video Queries (Cycles 8-10)
**Agent:** agent-backend
**Deliverable:** Video retrieval APIs

- Cycle 8: Video queries (list, get, search)
- Cycle 9: Playlist queries
- Cycle 10: Progress queries
  - ✅ **MILESTONE: Multi-tenant database live**

### Phase 4: Upload Infrastructure (Cycles 11-14)
**Agent:** agent-backend
**Deliverable:** File upload to Cloudinary

- Cycle 11: Cloudinary integration setup
  - Install Cloudinary SDK
  - Configure upload presets
  - Test video upload

- Cycle 12: Video upload mutation
  - Accept file upload
  - Upload to Cloudinary
  - Create video thing with videoUrl
  - Create entity_created event

- Cycle 13: Thumbnail generation
  - Auto-generate from video
  - Upload to Cloudinary
  - Store in properties.thumbnail

- Cycle 14: Audio upload mutation
  - Upload podcast MP3/M4A
  - Create podcast thing
  - Create entity_created event

### Phase 5: Transcription (Cycles 15-17)
**Agent:** agent-backend
**Deliverable:** AI-powered transcripts

- Cycle 15: Whisper API integration
  - Install OpenAI SDK
  - Configure Whisper API
  - Test transcription

- Cycle 16: Transcription mutation
  - Extract audio from video
  - Send to Whisper API
  - Store in properties.transcript

- Cycle 17: Podcast transcription
  - Transcribe podcast audio
  - Store in properties.transcript

### Phase 6: Knowledge Extraction (Cycles 18-20)
**Agent:** agent-backend
**Deliverable:** RAG-ready knowledge chunks

- Cycle 18: Chunk transcripts
  - Split into 500-word chunks (50-word overlap)
  - Create knowledge things (type: "chunk")
  - Link to video/podcast via thingKnowledge junction

- Cycle 19: Generate embeddings
  - Use text-embedding-3-large (1536-dim)
  - Store in knowledge.vector
  - Batch process for efficiency

- Cycle 20: Semantic search query
  - `searchVideos` - Vector similarity search
  - Filter by groupId (multi-tenant)
  - Return ranked results

### Phase 7: Analytics (Cycles 21-23)
**Agent:** agent-backend
**Deliverable:** Analytics tracking

- Cycle 21: View tracking
  - Create content_event (action: "video_viewed")
  - Update viewCount in properties
  - Track device type, completion rate

- Cycle 22: Engagement analytics
  - Track watch time
  - Calculate completion rates
  - Identify popular content

- Cycle 23: Creator analytics queries
  - `getCreatorAnalytics` - Total views, watch time
  - `getVideoAnalytics` - Per-video metrics
  - `getCourseAnalytics` - Enrollment, completion rates

### Phase 8: Deploy Backend (Cycle 24)
**Agent:** agent-ops
**Deliverable:** Production backend live

- Cycle 24: Production deployment
  - Deploy to Convex production (shocking-falcon-870.convex.cloud)
  - Configure Cloudinary production keys
  - Configure OpenAI API keys
  - ✅ **LAUNCH: Full backend live**

---

## Technology Stack

### Backend
- **Database:** Convex (real-time sync, multi-tenant)
- **Business Logic:** Effect.ts services (pure functions)
- **Storage:** Cloudinary (video + audio hosting)
- **Transcription:** Whisper API (OpenAI)
- **Embeddings:** text-embedding-3-large (OpenAI)
- **Validation:** Zod

### External Services
- **Cloudinary:** Video/audio upload, transformation, CDN streaming
  - Free tier: 25GB storage, 25GB bandwidth/month
  - Video transformation (resize, compress, thumbnail generation)

- **OpenAI:** Transcription (Whisper) + embeddings
  - Whisper API: $0.006/minute
  - Embeddings: $0.13/1M tokens

- **Convex:** Real-time database + file storage
  - Production: shocking-falcon-870.convex.cloud

---

## Migration from Content Collections

### Step 1: Export Existing Videos (Cycle 1 of frontend integration)

```typescript
// scripts/migrate-videos-to-convex.ts
import { getCollection } from 'astro:content';

const videos = await getCollection('videos');

for (const video of videos) {
  // Transform to Convex format
  const videoData = {
    type: "video",
    groupId: DEFAULT_GROUP_ID,  // Migration group
    name: video.data.title,
    properties: {
      description: video.data.description,
      youtubeId: video.data.youtubeId,
      thumbnail: video.data.thumbnail,
      duration: video.data.duration,
      categories: video.data.categories,
      tags: video.data.tags,
      viewCount: 0,
      publishedAt: video.data.publishedAt.getTime(),
    },
    status: "published"
  };

  // Create in Convex
  await createVideo(videoData);
}
```

### Step 2: Update Frontend to Use Convex (Cycle 2 of frontend integration)

```typescript
// Before (content collections)
import { getCollection } from 'astro:content';
const videos = await getCollection('videos');

// After (Convex)
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const videos = useQuery(api.queries.videos.listVideos, {
  groupId: currentGroupId
});
```

---

## Success Metrics

### Cycle 10 Milestone
✅ Multi-tenant database live
- [ ] Video/podcast things created
- [ ] Multi-tenant isolation working (groupId)
- [ ] Progress tracking functional
- [ ] Playlist management working

### Cycle 14 Milestone
✅ File upload working
- [ ] Video upload to Cloudinary
- [ ] Thumbnail auto-generation
- [ ] Audio upload for podcasts

### Cycle 20 Milestone
✅ AI features live
- [ ] Transcription working (Whisper)
- [ ] Knowledge chunks created
- [ ] Semantic search functional

### Cycle 24 Launch
✅ Full backend in production
- [ ] All mutations/queries deployed
- [ ] Analytics tracking live
- [ ] Cloudinary CDN configured
- [ ] Multi-tenant tested

---

## Risk Assessment

### Technical Risks

**Medium Risk: Cloudinary Integration**
- Mitigation: Well-documented React SDK
- Fallback: Convex file storage (1GB free tier)

**Low Risk: Transcription**
- Whisper API is stable and accurate
- Can defer to manual transcripts initially

**Low Risk: Vector Search**
- Convex supports vector queries natively
- OpenAI embeddings are proven

### Business Risks

**Medium Risk: Storage Costs**
- Cloudinary free tier: 25GB storage, 25GB bandwidth/month
- Estimate: $20-50/month for moderate usage
- Mitigation: Use YouTube embeds where possible

**Low Risk: API Costs**
- Whisper: $0.006/minute (~$0.36/hour of video)
- Embeddings: $0.13/1M tokens (~$0.01/video)
- Estimate: $10-20/month for 100 videos

---

## Dependencies

### Before Starting
- [x] Frontend working (video-frontend.md completed)
- [x] Convex backend operational
- [x] Multi-tenant groups working
- [x] Authentication (Better Auth)
- [ ] Cloudinary account setup
- [ ] OpenAI API key

### Blocking Dependencies
- Cycle 1 blocks Cycle 4 (schema before mutations)
- Cycle 8 blocks frontend integration (queries needed)
- Cycle 11 blocks Cycle 12 (Cloudinary setup before upload)
- Cycle 15 blocks Cycle 16 (Whisper setup before transcription)

---

## Frontend Integration (Post-Backend)

**See:** Frontend cycles in video-frontend.md should be updated to use Convex

**Changes Required:**
1. Replace content collections with Convex queries
2. Add upload UI (drag-and-drop)
3. Add progress tracking UI (resume playback)
4. Add analytics dashboard (creator view)
5. Add semantic search UI (vector search)

**Estimated:** 6 additional cycles (frontend integration)

---

## Next Steps

### To Start Execution

```bash
# 1. Review this plan
cat /Users/toc/Server/ONE/one/things/plans/video-backend.md

# 2. Ensure frontend is complete
cat /Users/toc/Server/ONE/one/things/plans/video-frontend.md

# 3. Start Cycle 1 (schema design)
# Agent: agent-backend

# 4. Execute cycles sequentially
/next  # Advance to next cycle
/done  # Mark current cycle complete
```

### To Modify Plan

```bash
/plan optimize          # Reduce cycle count further
/plan add-feature [X]   # Add new feature to plan
/plan skip [N]          # Skip cycle N (not applicable)
```

---

## Appendix: External Service Setup

### Cloudinary Setup
```bash
# 1. Create account at cloudinary.com
# 2. Get credentials from dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 3. Configure upload preset
# Settings → Upload → Upload presets
# - Preset name: "video_uploads"
# - Mode: Unsigned
# - Folder: "videos/"
# - Resource type: Video
# - Format: mp4
# - Transformations: Auto quality, auto format
```

### OpenAI Setup
```bash
# 1. Create account at platform.openai.com
# 2. Generate API key
OPENAI_API_KEY=sk-...

# 3. Enable services
# - Whisper API (transcription)
# - Embeddings API (text-embedding-3-large)
```

### Convex Environment Variables
```bash
# backend/.env.local
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
OPENAI_API_KEY=...
```

---

**Built for scale, powered by the 6-dimension ontology.**

**Plan Status:** Ready for execution (after frontend complete)
**Next Command:** Complete video-frontend.md first, then start Cycle 1
