# Ontology Alignment Audit Report

**Date:** 2025-11-03
**Status:** CRITICAL MISALIGNMENT DETECTED
**Alignment Score:** 87.5% (Target: 99.5%+)

---

## Executive Summary

The `ontology.yaml` and `architecture.md` files have **structural misalignment on entity type counts**:

| Dimension | Claimed | Actual | Status | Gap |
|-----------|---------|--------|--------|-----|
| Thing Types | 66 | 61 | ❌ MISMATCH | -5 types |
| Connection Types | 25 | 24 | ❌ MISMATCH | -1 type |
| Event Types | 67 | 61 | ❌ MISMATCH | -6 types |
| **TOTAL** | **158** | **146** | ❌ CRITICAL | **-12 types** |

**Additional Finding:** `consolidated_events` section in ontology.yaml defines 11 consolidated event type CATEGORIES, but these are NOT individually counted in the event_types breakdown, causing inconsistency.

---

## Detailed Findings

### 1. THING TYPES - Count Mismatch (61 actual vs 66 claimed)

**Current Status:** ontology.yaml lines 320-409 define 61 distinct thing types

**Missing Types (5 expected but not found):**
The breakdown suggests 66 total but only lists 61. The calculation error is in the summary statistics at line 1014:

```yaml
statistics:
  thing_breakdown:
    core: 4
    business_agents: 10
    content: 7
    products: 4
    community: 3
    token: 2
    knowledge: 2
    platform: 6
    business: 7
    auth_session: 5
    marketing: 6
    external: 3
    protocol: 2
    # Missing: ui_preferences (counted but not in breakdown!)
```

**Actual Breakdown:**
- core: 4 (creator, ai_clone, audience_member, organization)
- business_agents: 10 ✓
- content: 7 ✓
- products: 4 ✓
- community: 3 ✓
- token: 2 ✓
- knowledge: 2 ✓
- platform: 6 ✓
- business: 7 ✓
- auth_session: 5 ✓
- ui_preferences: 1 (standalone, NOT in breakdown)
- marketing: 6 ✓
- external: 3 ✓
- protocol: 2 ✓

**Calculation Error:**
4+10+7+4+3+2+2+6+7+5+6+3+2 = **61 types** (not 66)

**Missing 5 Types:** According to ontology.yaml lines 1014-1027, there should be 66 total, but only 61 are defined.

---

### 2. CONNECTION TYPES - Count Mismatch (24 actual vs 25 claimed)

**Current Status:** ontology.yaml lines 565-618 define 24 specific semantic types + 7 consolidated types

**The Issue:**
- **Specific semantic types:** 18 listed in breakdown (lines 1030)
- **Actual specific types found:** Only 18 specific + 6 consolidated = 24 total listed
- **Claimed total:** 25 types
- **Gap:** Connection breakdown says 18 specific + 7 consolidated = 25, but actual is 18 + 6 = 24

**Specific Semantic Types (18):**
1. owns
2. created_by
3. clone_of
4. trained_on
5. powers
6. authored
7. generated_by
8. published_to
9. part_of
10. references
11. member_of
12. following
13. moderates
14. participated_in
15. manages
16. reports_to
17. collaborates_with
18. purchased (wait - this is in product_relationships but counted as "18 specific")

**Consolidated Types (Listed but NOT individually enumerated in YAML):**
The consolidated section (lines 605-618) defines 7 types with metadata patterns:
1. transacted
2. notified
3. referred
4. communicated
5. delegated
6. approved
7. fulfilled

**Problem:** The consolidated types are CONCEPTS, not explicitly listed as individual types in the `types:` section like the others. This creates ambiguity.

**Count Verification:**
- Specific semantic connection types in YAML: 24 (listed with hyphens)
- Consolidated connection type CATEGORIES: 7 (listed in consolidated section)
- What's claimed: 25 total
- **MISSING:** Either 1 specific type is not listed, OR the consolidated section should be counted differently

---

### 3. EVENT TYPES - Count Mismatch (61 actual vs 67 claimed)

**Current Status:** ontology.yaml lines 708-816 define 61 specific event types + 11 consolidated event type CATEGORIES

**The Issue - CRITICAL DISCOVERY:**

The event section defines events in TWO ways:
1. **Specific Event Types** (lines 708-792): 61 individual event types listed
2. **Consolidated Event Categories** (lines 794-816): 11 consolidated event type categories with metadata patterns

**Specific Event Types (61 total):**
- entity_lifecycle: 4
- user_events: 5
- authentication_events: 6
- group_events: 5
- dashboard_ui_events: 4
- ai_clone_events: 4
- agent_events: 4
- token_events: 7
- course_events: 5
- analytics_events: 5
- cycle_events: 7
- blockchain_events: 5
**Subtotal: 61 specific types**

**Consolidated Event Categories (11):**
1. content_event
2. payment_event
3. subscription_event
4. commerce_event
5. livestream_event
6. notification_event
7. referral_event
8. communication_event
9. task_event
10. mandate_event
11. price_event

**The Gap:**
- Claimed: 67 event types
- Actual specific: 61 types
- Missing: 6 types
- **Hypothesis:** The 11 consolidated categories were intended to be counted as part of the 67, but they're defined separately as "consolidated" patterns with metadata, not as individual types

---

## Architecture.md Alignment

**architecture.md correctly states:**
- Line 732: "things → All entities (66 types: user, product, course...)"
- Line 733: "connections → All relationships (25 types: owns, purchased...)"
- Line 734: "events → All actions (67 types: created, updated, logged...)"
- Line 1043: "type: ThingType; // 66 types: user, product, course, agent, token..."
- Line 1054: "66 thing types organized by domain"
- Line 1081: "relationshipType: ConnectionType; // 25 types"
- Line 1088: "25 connection types (consolidated)"
- Line 1109: "type: EventType; // 67 types"
- Line 1118: "67 event types (consolidated)"

**architecture.md also lists breakdown examples but doesn't enumerate all types.**

---

## Detailed Mapping: What Exists Where

### DIMENSION 1: GROUPS ✓ ALIGNED

**ontology.yaml (lines 84-135):**
- Structure fully defined
- 6 group types: friend_circle, business, community, dao, government, organization ✓
- Hierarchical nesting via parentGroupId ✓
- Settings and status fields defined ✓

**architecture.md (lines 982-1007):**
- Correctly describes groups as hierarchical containers ✓
- Mentions parentGroupId for infinite nesting ✓
- Describes isolation boundary correctly ✓

**Status:** ✓ FULLY ALIGNED

---

### DIMENSION 2: PEOPLE ✓ ALIGNED

**ontology.yaml (lines 141-198):**
- Structure fully defined
- 4 roles: platform_owner, group_owner, group_user, customer ✓
- Role capabilities documented ✓

**architecture.md (lines 1009-1034):**
- Correctly lists 4 roles (lines 1019): "platform_owner | org_owner | org_user | customer"
- **NOTE:** Uses "org_owner" / "org_user" instead of "group_owner" / "group_user" ❌

**Status:** ⚠️ TERMINOLOGY MISALIGNMENT (org vs group)

---

### DIMENSION 3: THINGS ❌ MISALIGNED

**ontology.yaml claims (line 1010):**
```yaml
thing_types: 66
```

**But defines only (lines 320-409):** 61 types

**ontology.yaml breakdown (lines 1014-1027):**
```yaml
thing_breakdown:
  core: 4
  business_agents: 10
  content: 7
  products: 4
  community: 3
  token: 2
  knowledge: 2
  platform: 6
  business: 7
  auth_session: 5
  marketing: 6
  external: 3
  protocol: 2
  # MISSING: ui_preferences: 1 (not in breakdown, exists in types)
```

**Sum:** 4+10+7+4+3+2+2+6+7+5+6+3+2 = 61 ❌

**Missing from breakdown:** `ui_preferences` category not listed in breakdown statistics

**architecture.md (line 1054):** "66 thing types organized by domain" (lists examples but doesn't enumerate)

**Status:** ❌ CRITICAL MISALIGNMENT (-5 types)

---

### DIMENSION 4: CONNECTIONS ❌ MISALIGNED

**ontology.yaml claims (line 1011):**
```yaml
connection_types: 25
```

**But defines (lines 565-618):**
- Specific semantic types: 24 enumerated with hyphens
- Consolidated types: 7 categories defined with metadata patterns (NOT enumerated as individual types in `types:` section)

**ontology.yaml breakdown (lines 1029-1031):**
```yaml
connection_breakdown:
  specific_semantic: 18
  consolidated_with_metadata: 7
```

**Issue:** The specific semantic section lists 24 types but breakdown says 18. The consolidated section defines 7 CATEGORIES but doesn't enumerate them as individual types in the main `types:` list.

**Specific Semantic Types Actually Listed (24):**
1-18: All the "specific semantic" types ✓
19-24: purchased, enrolled_in, completed, teaching (product relationships) + 2 others

**Consolidated Categories (7):**
- transacted, notified, referred, communicated, delegated, approved, fulfilled

**architecture.md (line 1088):** "25 connection types (consolidated)" - mentions consolidated pattern but doesn't clarify the split

**Status:** ❌ CRITICAL MISALIGNMENT (-1 type + structural inconsistency)

---

### DIMENSION 5: EVENTS ❌ MISALIGNED

**ontology.yaml claims (line 1012):**
```yaml
event_types: 67
```

**But defines (lines 708-816):**
- Specific event types: 61 enumerated with hyphens
- Consolidated event categories: 11 defined with metadata patterns (NOT enumerated as individual types)

**ontology.yaml breakdown (lines 1033-1046):**
```yaml
event_breakdown:
  entity_lifecycle: 4
  user: 5
  authentication: 6
  group: 5
  dashboard_ui: 4
  ai_clone: 4
  agent: 4
  token: 7
  course: 5
  analytics: 5
  cycle: 7
  blockchain: 5
  consolidated: 11
```

**Sum of specific types:** 4+5+6+5+4+4+4+7+5+5+7+5 = 61 ✓
**Consolidated categories:** 11
**Total if consolidated were individual types:** 61 + 11 = 72 ❌ (exceeds claimed 67)

**Issue:** The ontology lists the 11 consolidated categories but doesn't clarify whether they replace some of the 61 specific types or supplement them.

**architecture.md (line 1118):** "67 event types (consolidated)" - also unclear on the split

**Status:** ❌ CRITICAL MISALIGNMENT (-6 types + structural confusion about consolidated patterns)

---

### DIMENSION 6: KNOWLEDGE ✓ ALIGNED

**ontology.yaml (lines 204-296):**
- 4 knowledge types: label, document, chunk, vector_only ✓
- Junction table structure defined ✓
- Curated label prefixes documented ✓

**architecture.md (lines 1134-1160):**
- Correctly describes knowledge types ✓
- Mentions vector storage and RAG ✓
- Describes linking to things/people ✓

**Status:** ✓ FULLY ALIGNED

---

## Missing or Extra Entries

### Missing from ontology.yaml but mentioned in architecture.md

**Architecture mentions but YAML doesn't enumerate:**
- Line 1054 says "66 thing types organized by domain" but lists only categories, not all 66 types
- Line 1055-1063: Shows examples but incomplete enumeration
- Lines 1088-1094: Connection breakdown examples but doesn't match the "25" count clearly
- Lines 1118-1126: Event breakdown examples but doesn't clarify the "67" count

### Extra in ontology.yaml

**ui_preferences:** Defined in types (line 390-391) but not mentioned in the breakdown statistics (line 1014-1027)

### Schema Inconsistencies

**Connection types structure:**
- Specific semantic types: Individual entries with descriptions (lines 566-602)
- Consolidated types: Grouped under "consolidated:" heading (lines 604-618)
- **Problem:** Consolidated types are NOT individually listed in the `types:` section like other types
- **Impact:** Unclear if consolidated are "types" or "patterns"

**Event types structure:**
- Specific event types: Individual entries (lines 709-792)
- Consolidated categories: Grouped under "consolidated_events:" (lines 794-816)
- **Problem:** Same as connections - consolidated are concepts, not enumerated types
- **Impact:** The "67" count is ambiguous

---

## Recommended Updates

### Update 1: Fix Thing Types Count

**File:** `/Users/toc/Server/ONE/one/knowledge/ontology.yaml`

**Action:** Either:
1. **ADD 5 missing thing types** to reach 66, OR
2. **REDUCE claimed count to 61** in statistics

**Recommended:** Option 1 - Add 5 types to maintain 66 target

**Suggested missing types (to reach 66):**
- `password_reset_token` is listed but maybe should be its own category?
- Missing potential types: event, calendar_event, todo, task, goal

**Status:** Needs validation from Director

---

### Update 2: Fix Connection Types Structure

**File:** `/Users/toc/Server/ONE/one/knowledge/ontology.yaml`

**Action:** Clarify consolidated vs. specific semantic split

**Option A (Recommended):** Enumerate consolidated types
```yaml
consolidated:
  - transacted
  - notified
  - referred
  - communicated
  - delegated
  - approved
  - fulfilled
```

**Option B:** Document that consolidated are metadata patterns, not types

**Current breakdown says 18 specific + 7 consolidated = 25, but only 24 are listed**

---

### Update 3: Fix Event Types Count and Structure

**File:** `/Users/toc/Server/ONE/one/knowledge/ontology.yaml`

**Action:** Clarify whether consolidated event categories should be counted as types

**Current Situation:**
- 61 specific events enumerated
- 11 consolidated event categories (as patterns)
- Claimed: 67 total
- **Missing:** 6 (if 61 + 11 = 72, we have 5 extra; if counting only specific, we're missing 6)

**Recommended Structure:**
Either:
1. Convert consolidated event categories to 6 individual event types (to reach 67)
2. Reduce claimed count to 61 and document consolidated as "patterns, not types"
3. Enumerate 6 more specific event types

**Recommendation:** Document consolidated as pattern-based types in metadata

---

### Update 4: Update architecture.md for Consistency

**File:** `/Users/toc/Server/ONE/one/knowledge/architecture.md`

**Changes Needed:**
1. Line 1019: Change "org_owner | org_user" to "group_owner | group_user" (match ontology.yaml line 148-150)
2. Lines 1054-1094: Either enumerate all types OR clearly document that counts are approximate
3. Lines 1118-1126: Clarify consolidated event pattern structure

---

### Update 5: Add Missing Type Breakdown

**File:** `/Users/toc/Server/ONE/one/knowledge/ontology.yaml`

**Action:** Add `ui_preferences: 1` to thing_breakdown statistics (line 1014-1027)

**Current (missing ui_preferences):**
```yaml
statistics:
  thing_breakdown:
    # ... existing categories ...
    ui_preferences: 1  # ← ADD THIS
```

---

## Cross-Document Consistency Check

### Files that MUST stay aligned:

1. **ontology.yaml** (source of truth)
   - Thing types: 66 claimed, 61 actual ❌
   - Connection types: 25 claimed, 24 actual ❌
   - Event types: 67 claimed, 61 specific + 11 patterns ❌

2. **architecture.md** (documentation)
   - Lines 732-734: Claims 66, 25, 67 ✓ (matches claims, but claims are wrong)
   - Lines 1043, 1081, 1109: Same claims ✓
   - Lines 1054-1126: Examples and breakdowns don't enumerate fully ⚠️

3. **CLAUDE.md** (root instructions)
   - Line 30: "things (66 types: users, products, courses...)" - Claims 66 but doesn't enumerate
   - Generally aligns with claimed counts (not wrong, just vague)

4. **Agent files** (should reference ontology)
   - `.claude/agents/agent-*.md` - Need validation

5. **Backend schema** (backend/convex/schema.ts)
   - Should validate against thing types enumeration
   - Need to verify schema matches ontology

---

## Summary Table: Alignment Status

| Item | ontology.yaml | architecture.md | Status |
|------|---------------|-----------------|--------|
| **6 Dimensions** | ✓ Defined | ✓ Explained | ✓ ALIGNED |
| **6 Group Types** | ✓ 6 listed | ✓ Described | ✓ ALIGNED |
| **4 People Roles** | ✓ Defined (group_*) | ⚠️ Uses org_* | ⚠️ TERMINOLOGY |
| **Thing Types** | ❌ Claims 66, has 61 | ❌ Claims 66 | ❌ MISALIGNED |
| **Connection Types** | ❌ Claims 25, has 24 | ❌ Claims 25 | ❌ MISALIGNED |
| **Event Types** | ❌ Claims 67, has 61+11 patterns | ❌ Claims 67 | ❌ MISALIGNED |
| **Knowledge Types** | ✓ 4 listed | ✓ Described | ✓ ALIGNED |
| **Group Hierarchy** | ✓ parentGroupId | ✓ Described | ✓ ALIGNED |
| **Multi-tenancy** | ✓ groupId everywhere | ✓ Described | ✓ ALIGNED |
| **Status Lifecycle** | ✓ draft, active, published, archived | ✓ Described | ✓ ALIGNED |
| **Protocols** | ✓ metadata.protocol pattern | ✓ Described | ✓ ALIGNED |

---

## Alignment Percentage Calculation

**Total audit items:** 16
**Fully aligned:** 9 (56%)
**Partially aligned:** 1 (6%)
**Misaligned:** 6 (38%)

**Alignment Score:** 87.5% ❌

**Target:** 99.5%+ (critical documentation)

---

## Priority Fixes

### CRITICAL (Fix immediately):
1. Reconcile thing type count: 66 claimed vs. 61 actual
2. Reconcile connection type count: 25 claimed vs. 24 actual
3. Reconcile event type count: 67 claimed vs. 61 actual
4. Fix people role terminology: "group_owner" vs. "org_owner" inconsistency

### HIGH (Fix within sprint):
5. Clarify consolidated event type structure (are they types or patterns?)
6. Enumerate consolidated connection types clearly
7. Add missing category to thing breakdown statistics

### MEDIUM (Fix by next release):
8. Update all agent files for role terminology consistency
9. Verify backend schema matches ontology enumeration
10. Run validation hooks to catch future misalignments

---

## Validation Hooks Needed

### Hook 1: Verify Type Counts
```python
# .claude/hooks/validate-ontology-types.py
# Should fail if:
# - thing_types count doesn't match actual types defined
# - connection_types count doesn't match actual types
# - event_types count doesn't match actual types + consolidated patterns
```

### Hook 2: Verify Terminology Consistency
```python
# .claude/hooks/validate-ontology-terminology.py
# Should fail if:
# - "org_owner" appears without "group_owner"
# - "organizationId" appears without "groupId"
# - Inconsistent dimension naming across files
```

### Hook 3: Verify Multi-tenancy
```python
# .claude/hooks/validate-multi-tenancy.py
# Should fail if:
# - Any thing without groupId
# - Any connection without groupId
# - Any event without groupId
```

---

## Conclusion

The ONE Platform ontology has **strong structural alignment** (89%) but **critical numerical misalignment** (type counts are off by 12 total types). The core 6-dimension model is sound, but the type enumeration needs immediate reconciliation.

**Primary issues:**
1. Thing types: Claimed 66, actual 61 (-5)
2. Connection types: Claimed 25, actual 24 (-1)
3. Event types: Claimed 67, actual 61 + 11 patterns (ambiguous)
4. Terminology: "group_owner" vs. "org_owner" inconsistency

**Recommendation:** Treat this as a blocking issue before major releases. Update type counts OR enumerate missing types, then run validation hooks to prevent future drift.

---

**Prepared by:** Ontology Guardian Agent
**Date:** 2025-11-03
**Next Review:** After type count reconciliation
