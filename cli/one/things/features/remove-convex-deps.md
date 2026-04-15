---
title: Remove Convex Deps
dimension: things
category: features
tags: ai, backend, frontend
related_dimensions: knowledge
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the features category.
  Location: one/things/features/remove-convex-deps.md
  Purpose: Documents feature: remove direct convex dependencies
  Related dimensions: knowledge
  For AI agents: Read this to understand remove convex deps.
---

# Feature: Remove Direct Convex Dependencies

**Feature ID:** `feature_remove_convex_deps`
**Plan:** `plan_backend_agnostic_frontend`
**Owner:** Integration Specialist
**Status:** Specified
**Priority:** P1
**Effort:** 3 days
**Dependencies:** `feature_auth_migration`, `feature_dashboard_migration`

---

## Description

Remove direct Convex imports from components, ensure all data flows through DataProvider.

---

## Tasks

1. Search and remove all `import { useQuery, useMutation } from "convex/react"`
2. Remove ConvexClientProvider from component tree
3. Update all imports to use DataProvider hooks
4. Verify no direct Convex dependencies remain
5. Run full test suite

---

## Validation

`grep -r "from 'convex/react'" src/` returns 0 results

---

## Success Criteria

- [ ] Zero direct Convex imports in frontend code
- [ ] ESLint rule enforces this
- [ ] All tests pass
- [ ] Build succeeds without Convex codegen

---

**Feature Status:** ✅ Specified
**Estimated Completion:** Week 5
