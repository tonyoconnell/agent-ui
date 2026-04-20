# Projects Feature - START HERE

**Status:** Ready for Team Execution
**Duration:** 90 minutes (1.5 hours)
**Team Size:** 4 specialists
**Complexity:** MEDIUM
**Risk:** LOW

---

## What Is This?

A complete, ready-to-execute plan for building a **Portfolio/Projects feature** for the ONE Platform.

Everything you need is here:
- Detailed specifications (30+ pages)
- Code samples for all components
- Example projects with real content
- Team assignments
- Timeline
- Success criteria

---

## The 4 Documents

### 1. PROJECTS-PLAN-SUMMARY.md (THIS IS FOR YOU)
**Read Time:** 10 minutes
**Audience:** Director/Project Lead

Contains:
- Executive summary
- What's being built
- Team assignments
- Timeline
- Risks and mitigation
- FAQ

→ **START HERE** if you're directing the project

---

### 2. 1-projects-team-briefing.md
**Read Time:** 15 minutes
**Audience:** All team members

Contains:
- Team briefing document
- Phase breakdown
- Parallel execution strategy
- Success criteria
- Communication checkpoints

→ **SHARE THIS** with your team

---

### 3. 1-projects-feature.md
**Read Time:** 30+ minutes (reference)
**Audience:** Specialists implementing

Contains:
- Complete task-by-task breakdown
- Code samples for every component
- 3 example projects
- Test templates
- Documentation template
- File paths and exact deliverables

→ **REFERENCE THIS** during implementation

---

### 4. 1-projects-developer-quickstart.md
**Read Time:** 15 minutes
**Audience:** Individual developers

Contains:
- TL;DR for each phase
- Component API reference
- File structure
- Common tasks
- Debugging tips
- Quick command reference

→ **GIVE THIS** to your developers

---

## Quick Facts

| Aspect | Details |
|--------|---------|
| **What** | Portfolio/Projects feature for ONE Platform |
| **When** | 90 minutes from kickoff to production |
| **Who** | 4 specialists (Designer, Frontend, Backend, Quality) |
| **Why** | Lets users showcase work, adds credibility |
| **How** | Astro content collections + React components |
| **Risk** | LOW - proven patterns, no breaking changes |
| **Status** | READY TO EXECUTE |

---

## The Team

```
You (Director)
├── Agent-Designer (10 min)
│   → Define ProjectSchema & create wireframes
│
├── Agent-Frontend (90 min total)
│   → Phase 2: Content collection setup (10 min)
│   → Phase 3: Build 4 React components (30 min)
│   → Phase 4: Create 2 Astro pages (20 min)
│
├── Agent-Backend (15 min, optional & parallel)
│   → Phase 5: Convex CRUD operations
│
└── Agent-Quality (20 min)
    → Phase 6: Tests & documentation
```

---

## The Timeline

```
09:00 - Phase 1 (Designer)        [10 min] ▓▓
09:10 - Phase 2 (Frontend)        [10 min] ▓▓
09:20 - Phase 3 (Frontend)        [30 min] ▓▓▓▓▓▓
        + Phase 5 (Backend, parallel)
09:50 - Phase 4 (Frontend)        [20 min] ▓▓▓▓
10:10 - Phase 6 (Quality)         [20 min] ▓▓▓▓

DONE: 10:30 (90 minutes from start)
```

**With full parallelization: ~75 minutes**

---

## What Gets Built

### Components
- **ProjectCard** - Grid/list card display
- **ProjectList** - Container with filtering
- **ProjectFilters** - Search, category, status, tags
- **ProjectDetail** - Full project display

### Pages
- `/projects` - Listing page with filters
- `/projects/[slug]` - Individual project details

### Content
- **3 example projects:**
  1. ONE Platform (AI + ontology)
  2. E-Commerce Redesign (performance)
  3. AI Tutor System (education)

### Optional Backend
- Convex mutations (create, update, delete)
- Convex queries (list, get, search)
- Event logging

---

## Success Looks Like

When you're done:
- Users can browse all projects at `/projects`
- Filter by category, status, technology, team
- Click to see full project details
- Beautiful, responsive design
- Mobile-friendly
- Accessible (WCAG AA)
- All tests pass
- Documented
- Ready for production

---

## How to Execute

### Step 1: Align Your Team (15 minutes)
1. Share **1-projects-team-briefing.md** with everyone
2. Each specialist reads their phase (5-10 min)
3. Quick 5-min sync call to confirm assignments

### Step 2: Execute Phases (90 minutes)

**Phase 1 (Designer)** - 10 min
- Define ProjectSchema
- Create wireframes
- Hands off to Frontend

**Phase 2 (Frontend)** - 10 min
- Create content collection
- Add 3 example projects
- Sync types

**Phase 3 (Frontend) + Phase 5 (Backend)** - 30 min parallel
- Frontend: Build 4 React components
- Backend: Build Convex CRUD (if needed)

**Phase 4 (Frontend)** - 20 min
- Create Astro pages
- Verify routing works

**Phase 6 (Quality)** - 20 min
- Write tests
- Update documentation
- Verify all criteria met

### Step 3: Deploy (5 minutes)
```bash
git add .
git commit -m "feat: add projects feature"
git push origin main
# Cloudflare auto-deploys
```

---

## Risks? Not Really

✓ Follows proven patterns (products/blog implementation)
✓ No database schema changes needed
✓ No breaking changes
✓ Content-first = works without backend
✓ All code samples provided
✓ All tests templated
✓ Documentation ready

**Risk Level: LOW**

---

## What Makes This Great

1. **Complete** - No missing pieces
2. **Detailed** - Every task specified with code
3. **Fast** - 90 minutes from start to production
4. **Safe** - Low risk, proven patterns
5. **Parallelizable** - 4 people can work simultaneously
6. **Tested** - Includes test templates
7. **Documented** - Multiple doc entry points

---

## Files to Check Out

In `/Users/toc/Server/ONE/.claude/plans/`:

- `PROJECTS-PLAN-SUMMARY.md` ← You are here
- `1-projects-team-briefing.md` ← Share with team
- `1-projects-feature.md` ← Full specs reference
- `1-projects-developer-quickstart.md` ← Give to developers
- `README.md` ← Overview of all plans

---

## FAQ

**Q: How long will this really take?**
A: 90 minutes if everyone's ready. 75 with full parallelization. Day 1 if you account for breaks.

**Q: Do we need backend?**
A: No - content collections work standalone. Backend is Phase 5 (optional) for dynamic CRUD.

**Q: Is it production-ready?**
A: Yes - includes tests, docs, accessibility. Deploy on day 1.

**Q: What if something goes wrong?**
A: Plan is designed for this. Update docs, keep moving. Clear handoff points.

**Q: Can we do less?**
A: Yes - content collection alone is valuable. Skip Phase 5 (backend) if CRUD not needed.

**Q: Is this aligned with ontology?**
A: 100% - "project" thing type already exists. No custom schemas.

---

## What's in the Full Plan Document

**1-projects-feature.md** contains:

- **6 complete phases** with tasks
- **40+ code samples** ready to use
- **3 example projects** with full content
- **4 React components** with complete code
- **2 Astro pages** with routing
- **Test templates** for components and pages
- **Documentation template** for the feature
- **Wireframes** description
- **Success criteria** checklist
- **Ontology mapping** verification

This is NOT a "read this someday" document. It's a "copy this code, fill in this template" working document.

---

## Your Next Steps

**Right Now (5 minutes):**
1. Skim this document
2. Check your team availability

**Next 10 Minutes:**
1. Share team briefing document
2. Have each specialist read their phase

**Next 15 Minutes:**
1. Quick team sync (5 min)
2. Designer starts Phase 1

**Next 90 Minutes:**
1. Phases execute sequentially
2. Daily standups (5 min each)
3. Blockers resolved immediately

**End of Day:**
1. Feature deployed to production
2. Team ready for next feature
3. Celebrate!

---

## The Big Picture

This is one feature. But it demonstrates the system:

- **Ontology-first** thinking (project = thing type)
- **100-cycle model** (6 phases × ~15 cycles each)
- **Parallel execution** (4 people, 90 minutes)
- **Content + Code** (reusable patterns)
- **Full stack** (frontend + backend + tests + docs)

The projects feature IS the system working as designed.

---

## One More Thing

The plan documents aren't just for this feature. They're templates:
- Same structure for next 10 features
- Same team, same process
- Same quality
- Same speed

If this works great (and it will), you've proven a process that scales.

---

## Ready?

Everything is prepared. Team can start immediately.

**To proceed:**
1. Share `1-projects-team-briefing.md` with your team
2. Each specialist reads their phase
3. Designer starts Phase 1 today
4. Follow the timeline
5. Done by end of day

---

## Questions?

- **Strategic questions** → See PROJECTS-PLAN-SUMMARY.md
- **Timeline questions** → See 1-projects-team-briefing.md
- **Technical questions** → See 1-projects-feature.md
- **Quick reference** → See 1-projects-developer-quickstart.md

All answers are in the docs. No guessing.

---

**Status:** APPROVED ✓
**Next Action:** Brief your team
**Timeline:** Start today, done by 10:30 AM

Let's build the Projects feature.

