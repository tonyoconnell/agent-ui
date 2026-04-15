# Agent Director Routing Update

**Date:** 2025-11-07
**Status:** Complete
**Version:** 1.0.0

---

## Summary

Updated agent-director routing logic to implement frontend-first development strategy, ensuring 99% of requests are routed to frontend-only development with nanostores, while only routing to backend integration when explicitly requested.

---

## Changes Made

### 1. Updated `.claude/agents/agent-director.md`

Replaced the "Frontend-First Strategy (DEFAULT)" section with clear, concise routing rules:

**New Section:** "Routing Logic: Frontend-Only by Default (99% of Requests)"

### 2. Key Routing Rules

**99% of requests → Frontend-Only:**
```
User says: "Build an ecommerce store"
Action: Route ONLY to agent-frontend (nanostores + Stripe.js)
```

**1% of requests → Backend Integration:**
```
User says: "Use the backend" or "Add groups"
Action: Route to agent-backend (integrate existing services)
```

---

## Routing Decision Tree

```
User Request Received
    ↓
Does request contain backend integration keywords?
    │
    ├─ NO (99% of cases)
    │   ↓
    │   Route to agent-frontend ONLY
    │   ├─ Build with nanostores (state + persistence)
    │   ├─ Use Stripe.js for payments (client-side)
    │   ├─ React + Astro components
    │   ├─ NO backend code
    │   └─ Deploy to Vercel/Netlify
    │
    └─ YES (1% of cases - explicit request)
        ↓
        Route to agent-backend
        ├─ Show available services in /web/src/services
        ├─ Show available providers in /web/src/providers
        ├─ Help integrate existing services
        └─ DON'T build new backend code
```

---

## Detection Keywords

### Frontend-Only Indicators (DEFAULT - 99%)

```typescript
"Build an ecommerce store"    → agent-frontend (nanostores + Stripe.js)
"Build an LMS"                → agent-frontend (nanostores)
"Add payment processing"      → agent-frontend (Stripe.js client-side)
"Create a user dashboard"     → agent-frontend (nanostores)
"Build a SaaS tool"           → agent-frontend (nanostores)
```

### Backend Integration Indicators (EXPLICIT - 1%)

```typescript
"Build ecommerce with backend"      → agent-backend (integrate services)
"Add groups to the app"             → agent-backend (integrate GroupProvider)
"Use multi-tenant"                  → agent-backend (integrate services)
"Integrate with ONE Platform"       → agent-backend (integrate services)
```

---

## What Gets Built

### Frontend-Only (DEFAULT)

**Production-Ready Apps with ZERO Backend Code:**

1. **Ecommerce Store**
   - Product catalog (nanostores)
   - Shopping cart (persistent in browser)
   - Stripe checkout (client-side Stripe.js)
   - Order history (localStorage)
   - **NO backend required**

2. **Learning Management System**
   - Course catalog (nanostores)
   - Lesson content (local data)
   - Progress tracking (persistent in browser)
   - Certificates (client-side generation)
   - **NO backend required**

3. **SaaS Tools**
   - Project management (nanostores)
   - Task tracking (persistent in browser)
   - Kanban boards (drag-and-drop)
   - Analytics dashboard (client-side)
   - **NO backend required**

### Backend Integration (EXPLICIT REQUEST ONLY)

**When user explicitly requests:**

1. **Groups/Multi-Tenant** → Import `GroupProvider` from `/web/src/providers`
2. **Multi-User + Roles** → Import `AuthProvider` from `/web/src/providers`
3. **Activity Tracking** → Import services from `/web/src/services/events`
4. **Connections** → Import services from `/web/src/services/connections`
5. **Knowledge/RAG** → Import services from `/web/src/services/knowledge`

---

## Golden Rules

### For agent-director:

1. **If user doesn't say "backend" or "use services", route to frontend-only**
2. **Default = Frontend-Only. Backend integration = Explicit request**
3. **99% frontend-only, 1% backend integration**

### For Users:

1. **Build production apps with NO backend** - Ecommerce, LMS, SaaS all work client-side
2. **Add backend only when explicitly needed** - Groups, multi-user, activity tracking
3. **Integration is optional** - Import services/providers when ready

---

## Impact

### Before:
- User: "Build an ecommerce store"
- Agent: Creates Convex backend, mutations, queries, schema, AND frontend
- Result: User forced to deploy backend, manage database, configure Convex

### After:
- User: "Build an ecommerce store"
- Agent: Creates pure frontend with nanostores + Stripe.js client-side
- Result: **COMPLETE, WORKING ECOMMERCE STORE** with NO backend code
- User can add backend later: "Add multi-user authentication" (explicit request)

---

## Success Metrics

**Target outcomes:**

1. **98%+ of apps built with NO backend** - Ecommerce, LMS, SaaS all work client-side
2. **Production-ready in minutes** - Deploy to Vercel/Netlify immediately
3. **Real payments working** - Stripe/PayPal integrated client-side
4. **Zero backend knowledge needed** - Users build and ship without Convex
5. **Backend only for auth + sync** - Added explicitly when requested

---

## Files Modified

1. `/Users/toc/Server/ONE/.claude/agents/agent-director.md`
   - Replaced "Frontend-First Strategy (DEFAULT)" section
   - Added "Routing Logic: Frontend-Only by Default (99% of Requests)"
   - Clear detection keywords and decision tree
   - Production-ready app examples

---

## Next Steps

### Recommended Follow-Up Updates:

1. **Update `agent-frontend.md`** - Ensure it ONLY builds frontend, NEVER touches backend
2. **Update `agent-backend.md`** - Help integrate services, DON'T build new backend
3. **Update `agent-builder.md`** - Default to frontend-only
4. **Update `agent-designer.md`** - Design for frontend-only apps
5. **Update `agent-quality.md`** - Test frontend-only apps
6. **Update `CLAUDE.md`** - Add "Frontend-First Development" section
7. **Create frontend-only examples** - Ecommerce + Stripe, LMS, SaaS

### Testing:

1. Test: "Build an ecommerce store" → Should produce ONLY frontend code (nanostores + Stripe.js)
2. Test: "Build an LMS" → Should produce ONLY frontend code (nanostores)
3. Test: "Build an ecommerce store with backend" → Should integrate services from /web/src/services
4. Verify NO Convex imports unless explicitly requested

---

## References

- **Plan Document:** `/Users/toc/Server/ONE/one/things/plans/remove-backend-development-from-agents.md`
- **Section Reference:** "Phase 1: Update Agent Instructions → A. Update agent-director.md"
- **Updated File:** `/Users/toc/Server/ONE/.claude/agents/agent-director.md`

---

## Conclusion

The agent-director now has clear, concise routing rules that prevent backend code from being built unless explicitly requested. The default behavior is to route 99% of requests to frontend-only development using nanostores, with backend integration only occurring when users explicitly say "use backend", "add groups", or "integrate with ONE Platform".

**Key Principle:** Default = Frontend-Only. Backend integration = Explicit request.
