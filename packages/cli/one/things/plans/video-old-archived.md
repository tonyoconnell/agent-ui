# Video & Podcast Platform Plan

**Version:** 1.0.0
**Status:** Planning
**Created:** 2025-11-08
**Source:** Bull.fm migration + ONE Platform enhancement
**Total Cycles:** 42 (optimized)

---

## Executive Summary

Import proven video and podcast functionality from Bull.fm into ONE Platform, creating a unified media platform that supports:
- YouTube embeds + native video hosting
- Podcast hosting with custom audio player
- Content collections with rich metadata
- AI-powered transcription and knowledge extraction
- Multi-tenant media libraries (groupId scoping)

**Architecture:** Backend + Frontend (requires Convex for multi-tenant media)
**Quick Win:** Cycle 10 - Working video gallery with YouTube embeds deployed

---

## 6-Dimension Ontology Mapping

### GROUPS
- Organization media libraries (groupId scoping)
- Course collections (nested groups)
- Playlist containers

### PEOPLE
- Content creators (upload, manage)
- Viewers (consume, track progress)
- Roles: `org_owner` (full access), `org_user` (view only), `customer` (purchased content)

### THINGS
Core entities:
```typescript
{
  type: "video",
  metadata: {
    title, description, duration,
    youtubeId?, // For YouTube embeds
    videoUrl?,  // For native hosting (Cloudinary/Mux)
    thumbnail,
    transcript?, // Full transcript text
    categories: string[]
  }
}

{
  type: "podcast",
  metadata: {
    title, description, duration,
    audioUrl,  // MP3/M4A file (Cloudinary)
    thumbnail,
    transcript?,
    episodeNumber?, seasonNumber?
  }
}

{
  type: "playlist",
  metadata: {
    title, description,
    playlistType: "video" | "podcast" | "course"
  }
}

{
  type: "course",
  metadata: {
    title, description,
    instructor, level, estimatedHours
  }
}

{
  type: "lesson",
  metadata: {
    title, description, order,
    videoId?, // Reference to video thing
    duration, lessonType: "video" | "text" | "quiz"
  }
}
```

### CONNECTIONS
```typescript
{
  type: "contains",
  sourceId: playlistId,
  targetId: videoId,
  metadata: { order: 1 }
}

{
  type: "authored",
  sourceId: creatorId,
  targetId: videoId,
  metadata: { role: "creator" | "producer" | "editor" }
}

{
  type: "enrolled_in",
  sourceId: userId,
  targetId: courseId,
  metadata: { startedAt, progress: 0.65 }
}

{
  type: "watched",
  sourceId: userId,
  targetId: videoId,
  metadata: { lastPosition: 245, completed: false }
}
```

### EVENTS
```typescript
{
  type: "content_event",
  action: "video_viewed" | "video_completed" | "podcast_played",
  metadata: {
    duration, completionRate,
    watchTime, deviceType
  }
}

{
  type: "content_event",
  action: "video_uploaded" | "video_published",
  metadata: {
    size, format, processingTime
  }
}

{
  type: "entity_created",
  action: "playlist_created",
  metadata: { itemCount: 0 }
}
```

### KNOWLEDGE
- Video transcripts chunked for RAG (500-word chunks)
- Podcast transcripts with speaker diarization
- Auto-generated labels: topics, keywords, sentiment
- Vector embeddings for semantic search
- Thematic connections between content

---

## ⚡ Quick Wins (Cycles 1-10)

**Goal:** Working video gallery deployed to staging by Cycle 10

### Cycle 1-3: Foundation (3 cycles)
**Agent:** agent-director

✓ **Cycle 1:** Validate against ontology
  - Review Bull.fm analysis
  - Confirm 6-dimension mapping
  - Document migration strategy

✓ **Cycle 2:** Architecture decisions
  - Backend needed: YES (multi-tenant, progress tracking)
  - Storage: Cloudinary for native hosting
  - Transcription: Whisper API (future)

✓ **Cycle 3:** Create migration plan
  - Identify reusable components (90% of Bull.fm code)
  - Define schema updates needed
  - Plan data migration scripts

### Cycle 4-7: Core Feature - YouTube Video Gallery (4 cycles)
**Agents:** agent-backend (parallel) + agent-frontend

✓ **Cycle 4:** Backend schema (agent-backend)
  - Update `schema.ts` with video/podcast thing types
  - Add `watched`, `contains` connection types
  - Add `video_viewed`, `video_completed` event types

✓ **Cycle 5:** Backend mutations (agent-backend)
  - `createVideo` - Add video to library
  - `updateWatchProgress` - Track viewing position
  - `createPlaylist` - Create video collections

✓ **Cycle 6:** Backend queries (agent-backend)
  - `listVideos` - Get all videos for group
  - `getVideoById` - Single video with metadata
  - `getPlaylistVideos` - Videos in playlist order

✓ **Cycle 7:** Frontend components (agent-frontend)
  - Port `VideoPlayer.tsx` from Bull.fm
  - Create `VideoGallery.tsx` (grid layout)
  - Create `VideoCard.tsx` (thumbnail + metadata)

### Cycle 8-10: Deploy MVP (3 cycles)
**Agents:** agent-frontend + agent-ops

✓ **Cycle 8:** Video pages (agent-frontend)
  - `/videos` - Gallery view (SSR with Convex)
  - `/videos/[id]` - Single video player
  - Basic styling with Tailwind v4

✓ **Cycle 9:** Integration testing (agent-quality)
  - Test video playback
  - Test progress tracking
  - Test multi-tenant isolation (groupId)

✓ **Cycle 10:** Deploy to staging (agent-ops)
  - Deploy backend to Convex
  - Deploy frontend to Cloudflare Pages
  - ✅ **MILESTONE: Working video gallery live**

---

## 📋 Full Plan (42 Cycles)

### Phase 1: Foundation (Cycles 1-3)
**Agent:** agent-director
**Deliverable:** Validated plan + architecture decisions

- Cycle 1: Validate against ontology
- Cycle 2: Architecture decisions
- Cycle 3: Create migration plan

### Phase 2: Backend - Video Core (Cycles 4-10)
**Agent:** agent-backend
**Deliverable:** Video database + API

- Cycle 4: Schema updates (things, connections, events)
- Cycle 5: Mutations (create, update, delete videos)
- Cycle 6: Queries (list, get, search videos)
- Cycle 7: Progress tracking logic
- Cycle 8: Playlist management
- Cycle 9: Multi-tenant isolation testing
- Cycle 10: Backend deployed to Convex

### Phase 3: Frontend - Video UI (Cycles 8-15)
**Agent:** agent-frontend
**Deliverable:** Video browsing + playback UI

**⚡ PARALLEL with Phase 2 (Cycles 8-10)**

- Cycle 8: Port VideoPlayer.tsx from Bull.fm
- Cycle 9: Create VideoGallery.tsx (grid layout)
- Cycle 10: Create VideoCard.tsx (thumbnail cards)
- Cycle 11: `/videos` page (gallery view)
- Cycle 12: `/videos/[id]` page (single video)
- Cycle 13: Progress tracking UI (resume playback)
- Cycle 14: Playlist UI (collections)
- Cycle 15: Responsive design + polish

### Phase 4: Backend - Podcast Core (Cycles 16-20)
**Agent:** agent-backend
**Deliverable:** Podcast hosting + streaming

- Cycle 16: Podcast schema (reuse video schema mostly)
- Cycle 17: Audio upload to Cloudinary
- Cycle 18: Podcast mutations (create, update, delete)
- Cycle 19: Podcast queries (list, get, search)
- Cycle 20: Podcast progress tracking

### Phase 5: Frontend - Podcast UI (Cycles 18-23)
**Agent:** agent-frontend
**Deliverable:** Podcast player + library

**⚡ PARALLEL with Phase 4 (Cycles 18-20)**

- Cycle 18: Port AudioPlayer.tsx from Bull.fm
- Cycle 19: Create PodcastCard.tsx
- Cycle 20: Create PodcastGallery.tsx
- Cycle 21: `/podcasts` page (library view)
- Cycle 22: `/podcasts/[id]` page (episode player)
- Cycle 23: Podcast playlists (seasons/series)

### Phase 6: Advanced Features (Cycles 24-32)
**Agents:** agent-backend (24-28) + agent-frontend (28-32)

**Backend (Cycles 24-28):**
- Cycle 24: Video upload API (Cloudinary integration)
- Cycle 25: Transcript extraction (Whisper API)
- Cycle 26: Knowledge chunking (transcripts → embeddings)
- Cycle 27: Search with vector similarity
- Cycle 28: Analytics events (views, completion rate)

**Frontend (Cycles 28-32) - PARALLEL:**
- Cycle 28: Upload interface (video + podcast)
- Cycle 29: Transcript display (synced with playback)
- Cycle 30: Search interface (semantic search)
- Cycle 31: Analytics dashboard
- Cycle 32: Course builder (lessons with videos)

### Phase 7: Bull.fm Data Migration (Cycles 33-36)
**Agent:** agent-clone
**Deliverable:** Bull.fm content imported

- Cycle 33: Write migration script
  - Extract 4 videos (YouTube IDs)
  - Extract 4 podcasts (1 MP3 file + 3 YouTube)
  - Map to ONE schema

- Cycle 34: Run migration (dry-run first)
  - Create things (videos, podcasts)
  - Create connections (authored, contains)
  - Create events (entity_created)

- Cycle 35: Extract knowledge
  - Chunk transcripts (500 words)
  - Generate embeddings (OpenAI)
  - Create knowledge entries

- Cycle 36: Verification
  - Validate data integrity
  - Test playback of migrated content
  - Generate migration report

### Phase 8: Quality & Testing (Cycles 37-39)
**Agent:** agent-quality
**Deliverable:** Test suite + validation

- Cycle 37: Component tests
  - VideoPlayer, AudioPlayer
  - Progress tracking
  - Playlist management

- Cycle 38: Integration tests
  - Upload → process → playback
  - Multi-tenant isolation
  - Analytics tracking

- Cycle 39: Performance testing
  - Video streaming optimization
  - CDN configuration
  - Mobile playback

### Phase 9: Documentation (Cycles 40-41)
**Agent:** agent-documenter
**Deliverable:** Complete documentation

- Cycle 40: Technical docs
  - API documentation
  - Component library
  - Migration guide

- Cycle 41: User docs
  - Creator guide (upload videos)
  - Viewer guide (playlists, progress)
  - Admin guide (analytics)

### Phase 10: Production Deploy (Cycle 42)
**Agent:** agent-ops
**Deliverable:** Live video/podcast platform

- Cycle 42: Production deployment
  - Deploy backend to Convex production
  - Deploy frontend to Cloudflare Pages
  - Configure Cloudinary CDN
  - ✅ **LAUNCH: Full video/podcast platform live**

---

## ⚡ Parallel Execution Opportunities

These cycles can run simultaneously for faster delivery:

**Wave 1 (Cycles 8-10):** 3 parallel streams
- Backend: Video queries + testing
- Frontend: Video UI components
- Ops: Staging environment setup

**Wave 2 (Cycles 18-23):** 2 parallel streams
- Backend: Podcast API (18-20)
- Frontend: Podcast UI (18-23)

**Wave 3 (Cycles 28-32):** 2 parallel streams
- Backend: Advanced features (24-28)
- Frontend: Upload + search UI (28-32)

**Time Savings:**
- Sequential: 42 cycles × 1 day = 42 days (~6 weeks)
- Parallel: 42 ÷ 1.8 = 23 days (~3 weeks)
- **Savings: 50% faster delivery**

---

## Migration from Bull.fm

### Components to Reuse (High Priority)

**Video Components:**
```
apps/bullfm/src/components/VideoPlayer.tsx
→ web/src/components/media/VideoPlayer.tsx (90% reusable)

apps/bullfm/src/components/VideoEmbed.tsx
→ web/src/components/media/VideoEmbed.tsx (95% reusable)

apps/bullfm/src/layouts/BullVideoLayout.tsx
→ web/src/layouts/VideoLayout.tsx (needs Convex integration)
```

**Audio Components:**
```
apps/bullfm/src/components/AudioPlayer.tsx
→ web/src/components/media/AudioPlayer.tsx (85% reusable)
```

**Content Collections:**
```
apps/bullfm/src/content/config.ts (video/podcast schemas)
→ Migrate to Convex schema with Zod validation
```

### Data Migration Strategy

**Step 1: Extract (Cycle 33)**
```typescript
// scripts/migrate-bullfm-media.ts
const videos = [
  { youtubeId: "...", title: "...", ... },
  // 4 videos total
];

const podcasts = [
  { audioUrl: "/audio/podcast.mp3", title: "...", ... },
  // 4 podcasts total
];
```

**Step 2: Transform (Cycle 34)**
```typescript
// Create things
for (const video of videos) {
  await createThing({
    groupId: "bullfm-migration",
    type: "video",
    metadata: {
      title: video.title,
      youtubeId: video.youtubeId,
      // ... map fields
    }
  });
}
```

**Step 3: Extract Knowledge (Cycle 35)**
```typescript
// For videos/podcasts with transcripts
const chunks = chunkTranscript(video.transcript, 500);
for (const chunk of chunks) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunk
  });

  await createKnowledge({
    groupId: video.groupId,
    vector: embedding.data[0].embedding,
    text: chunk,
    metadata: { sourceId: video.id, type: "transcript" }
  });
}
```

**Step 4: Verify (Cycle 36)**
- Validate all 8 items migrated
- Test playback of each video/podcast
- Verify knowledge searchable
- Generate migration report

---

## Technology Stack

### Frontend
- **Framework:** Astro 5 + React 19
- **Styling:** Tailwind v4
- **Video Player:** Custom component (HTML5 Video API)
- **Audio Player:** Custom component (HTML5 Audio API)
- **Icons:** lucide-react

### Backend
- **Database:** Convex (real-time sync)
- **Storage:** Cloudinary (video + audio hosting)
- **Transcription:** Whisper API (OpenAI)
- **Embeddings:** text-embedding-3-small (OpenAI)
- **CDN:** Cloudflare (frontend), Cloudinary (media)

### External Services
- **YouTube API:** For YouTube embeds
- **Cloudinary:** Video/audio upload, transformation, streaming
- **OpenAI:** Transcription (Whisper) + embeddings
- **Convex:** Real-time database + file storage

---

## Success Metrics

### Cycle 10 Milestone
✅ Working video gallery deployed
- [ ] 4+ videos playable (YouTube embeds)
- [ ] Multi-tenant isolation working (groupId)
- [ ] Progress tracking functional
- [ ] Responsive design (mobile + desktop)

### Cycle 23 Milestone
✅ Podcast platform live
- [ ] Audio player with custom controls
- [ ] Podcast library browsable
- [ ] Episode playback with progress saving
- [ ] Playlist/series support

### Cycle 36 Milestone
✅ Bull.fm content migrated
- [ ] All 8 items (4 videos + 4 podcasts) imported
- [ ] Transcripts chunked + embedded
- [ ] Knowledge searchable via vector similarity
- [ ] Migration report generated

### Cycle 42 Launch
✅ Full platform in production
- [ ] Video upload + hosting (Cloudinary)
- [ ] Podcast upload + hosting
- [ ] Semantic search working
- [ ] Analytics tracking views/completions
- [ ] Course builder functional

---

## Risk Assessment

### Technical Risks

**Medium Risk: Cloudinary Integration**
- Mitigation: Use Cloudinary React SDK, well-documented
- Fallback: Convex file storage (limited to 1GB free tier)

**Low Risk: Component Migration**
- Bull.fm components are clean React/TypeScript
- 90%+ reusable with minor Convex integration

**Low Risk: Transcription**
- Whisper API is stable and accurate
- Can defer to post-MVP (manual transcripts for now)

### Business Risks

**Low Risk: Storage Costs**
- Cloudinary free tier: 25GB storage, 25GB bandwidth/month
- Convex free tier: 1GB file storage
- Estimate: $20-50/month for moderate usage

**Medium Risk: Video Processing Time**
- Large videos take time to upload + transcode
- Mitigation: Show progress, allow background processing

---

## Future Enhancements (Post-Cycle 42)

### Phase 11: Advanced Features (Cycles 43-60)
- Live streaming (RTMP ingestion)
- Video collaboration (comments, annotations)
- Monetization (pay-per-view, subscriptions)
- Mobile apps (React Native)
- AI-generated summaries (GPT-4)
- Auto-generated chapters (transcript analysis)
- Multi-language subtitles (Whisper translation)

### Phase 12: Creator Tools (Cycles 61-75)
- Video editor (trim, splice, effects)
- Thumbnail generator (AI-powered)
- SEO optimization (auto-tags, descriptions)
- Analytics dashboard (views, engagement, revenue)
- Bulk upload (drag-and-drop multiple files)

---

## Dependencies

### Before Starting
- [x] Convex backend operational
- [x] Multi-tenant groups working
- [x] Authentication (Better Auth)
- [ ] Cloudinary account setup
- [ ] OpenAI API key (for Whisper + embeddings)

### Blocking Dependencies
- Cycle 4 blocks Cycle 5 (schema before mutations)
- Cycle 6 blocks Cycle 7 (queries before frontend)
- Cycle 24 blocks Cycle 28 (upload API before upload UI)
- Cycle 26 blocks Cycle 30 (embeddings before search)

---

## Next Steps

### To Start Execution

```bash
# 1. Review this plan
cat /Users/toc/Server/ONE/one/things/plans/video.md

# 2. Start Cycle 1
/now

# 3. Execute cycles sequentially
/next  # Advance to next cycle
/done  # Mark current cycle complete

# 4. Or fast-track specific features
/fast video-player      # Just the player component
/fast podcast-upload    # Just upload functionality
```

### To Modify Plan

```bash
/plan optimize          # Reduce cycle count further
/plan add-feature [X]   # Add new feature to plan
/plan skip [N]          # Skip cycle N (not applicable)
```

---

## Appendix: Bull.fm Analysis Reference

**Full Analysis:** `/one/events/bullfm-video-podcast-analysis.md` (2500+ lines)

**Key Findings:**
- 4 videos (all YouTube embeds)
- 4 podcasts (1 local MP3, 3 YouTube)
- Custom VideoPlayer.tsx (90% reusable)
- Custom AudioPlayer.tsx (85% reusable)
- Zod schemas for content validation
- No native hosting (opportunity for improvement)

**Technology Debt:**
- Vidstack player partially integrated (has errors)
- react-h5-audio-player installed but unused
- No upload interface
- No transcription service

**Migration Complexity:** Moderate (6/10)
**Estimated Effort:** 42 cycles (3-6 weeks with parallelization)

---

**Built for creators, powered by the 6-dimension ontology.**

**Plan Status:** Ready for execution
**Next Command:** `/now` to start Cycle 1
