---
title: Data Quality Metrics
dimension: things
category: plans
tags: ai, connections, events, groups, knowledge, ontology, people, things
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/data-quality-metrics.md
  Purpose: Documents data quality metrics & monitoring
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand data quality metrics.
---

# Data Quality Metrics & Monitoring

**Version:** 1.0.0
**Status:** Active
**Created:** 2025-11-01
**Scope:** Organization-level data integrity monitoring for 6-dimension ontology

---

## Overview

This document defines the metrics, thresholds, and monitoring strategy for maintaining data integrity across the 6-dimension ontology (groups, people, things, connections, events, knowledge).

Each organization has independent monitoring and alerting via the `groupId` scoping mechanism. Platform-wide metrics are also available for ops teams.

---

## Core Metrics

### 1. Referential Integrity Score (0-100%)

**Definition:** Percentage of references that are valid (pointing to existing entities).

**Formula:**

```
Score = 100 - (orphanedCount + crossGroupViolations) / totalReferences * 100
```

**What it measures:**

- Connections with missing source/target entities (orphaned)
- Connections between entities in different groups (cross-group violations)
- Knowledge records with missing source entities

**Healthy Range:** 99% - 100%
**Warning Threshold:** 95% - 99%
**Critical Threshold:** < 95%

**Example:**

```
Total connections: 1000
Orphaned: 3
Cross-group: 1
Score = 100 - (3 + 1) / 1000 * 100 = 99.6% (HEALTHY)
```

---

### 2. Orphaned Entity Count

**Definition:** Number of connections that reference non-existent entities.

**Detection:**

- Connection `fromEntityId` doesn't exist in entities table
- Connection `toEntityId` doesn't exist in entities table
- Knowledge `sourceThingId` doesn't exist in entities table

**Alert Thresholds:**

- Any orphaned entities found = CRITICAL alert
- Threshold: 0 (zero tolerance)

**Root Causes:**

- Entity deleted without cascade cleanup
- Database corruption or race condition
- Incomplete data import/migration

**Resolution:**

1. Run `/scripts/migrate-ontology-v1.ts` to validate
2. Check event log for deletion/archival events
3. Contact support with affected entity IDs

---

### 3. Cross-Group Violations

**Definition:** Number of connections spanning different groups (multi-tenant isolation breach).

**Detection:**

- Connection where `fromEntity.groupId !== toEntity.groupId`
- Event where actor and target belong to different groups

**Alert Thresholds:**

- Any cross-group violations found = CRITICAL alert
- Threshold: 0 (zero tolerance)

**Root Causes:**

- Malicious query bypassing groupId filters
- Dangling reference from deleted group
- Application bug in connection creation

**Resolution:**

1. Immediately isolate connection via soft delete
2. Investigate query logs for how violation occurred
3. Contact security team
4. Run integrity check to find other violations

---

### 4. Missing GroupIds

**Definition:** Entities/connections/events without groupId field (schema non-compliance).

**Detection:**

- Entity where `groupId` is null or undefined
- Connection where `groupId` is null or undefined
- Event where `groupId` is null or undefined

**Alert Thresholds:**

- Pre-migration: Expected high count
- Post-migration: Threshold is 0

**Root Causes:**

- Migration incomplete
- Legacy code creating entities without groupId
- Database schema mismatch

**Resolution:**

1. Run `/scripts/migrate-ontology-v1.ts` for full migration
2. If new violations appear: find code creating entities
3. Enforce groupId validation in all mutation handlers

---

### 5. Malformed Properties Count

**Definition:** Entities with missing required properties or type mismatches.

**Detection by Type:**

```
creator:      requires "role" field
organization: requires "plan" field
blog_post:    requires "title", "content"
course:       requires "title", "description"
product:      requires "price", "currency"
... (66 types total)
```

**Alert Thresholds:**

- Malformed properties > 0.01% = WARNING
- Malformed properties > 0.1% = CRITICAL

**Root Causes:**

- Data import without validation
- Legacy data not conforming to schema
- Incomplete entity creation (network error mid-mutation)

**Resolution:**

1. Query affected entities: `checkIntegrity(groupId, "malformed_properties")`
2. Review and fix properties
3. Add validation to mutation handlers

---

### 6. Schema Compliance Score (0-100%)

**Definition:** Percentage of entities with proper schema version tracking.

**Measurement:**

```
Score = (entitiesWithSchemaVersion / totalEntities) * 100
```

**Healthy Range:** 95% - 100%
**Warning Threshold:** 90% - 95%
**Critical Threshold:** < 90%

**Purpose:**

- Track migration progress from v0 to v1
- Enable smooth schema upgrades in future

---

### 7. Event Archival Progress (0-100%)

**Definition:** Percentage of old events (> 365 days) that have been archived.

**Measurement:**

```
Progress = (archivedOldEvents / totalOldEvents) * 100
```

**Target:** 100% (all events > 1 year archived)
**Healthy Range:** 90% - 100%
**Warning Threshold:** 70% - 90%

**Benefit:**

- Reduces hot data size by ~90%
- Improves query performance
- Maintains audit trail in cold storage

---

## Alert Configuration

### Alert Thresholds Table

| Metric                 | Healthy | Warning | Critical |
| ---------------------- | ------- | ------- | -------- |
| Referential Integrity  | >= 99%  | 95-99%  | < 95%    |
| Orphaned Entities      | 0       | 0       | 0        |
| Cross-Group Violations | 0       | 0       | 0        |
| Missing GroupIds       | 0       | 0       | 0        |
| Malformed Properties   | 0.00%   | 0.01%   | 0.1%     |
| Schema Compliance      | >= 95%  | 90-95%  | < 90%    |
| Event Archival         | >= 90%  | 70-90%  | < 70%    |

### Alert Channels

**Immediate (CRITICAL):**

- Slack #ops-critical channel
- Email to ops-critical@company.com
- PagerDuty incident creation

**Escalation (WARNING):**

- Slack #ops-warnings channel
- Email to ops-team@company.com
- Tracked in weekly report

**Info (Healthy):**

- Logged to events table
- Included in weekly summary
- Available in dashboard

---

## Monitoring Dashboard

### Real-Time View

**Left Panel - Integrity Score Card:**

```
Referential Integrity: 99.8%
├─ Orphaned Connections: 2
├─ Cross-Group References: 0
└─ Status: HEALTHY
```

**Center Panel - Recent Alerts:**

```
Last 24 Hours
├─ Critical: 0
├─ Warning: 1 (Low archival progress)
└─ Info: 12 (Daily snapshots)
```

**Right Panel - Trend Charts:**

```
Last 7 Days
├─ Integrity Score: 99.6% → 99.8% (↑ improving)
├─ Orphaned Count: 5 → 2 (↓ declining)
└─ Archival Rate: 88% → 91% (↑ improving)
```

### Data Quality Tab

**Metrics Summary:**

- Referential Integrity Score
- Orphaned Entity Count
- Cross-Group Violations
- Malformed Properties Count
- Schema Compliance Score
- Event Archival Progress

**Historical Trend:**

- Last 7 days: line chart of each metric
- Last 30 days: aggregated view
- Compare to baseline

**Detailed Issue List:**

- Filter by category (orphaned, cross-group, malformed, etc.)
- Filter by severity (critical, warning, info)
- Click to see affected records
- Action buttons for remediation

### Group-Level Scoping

**All metrics are per-organization:**

- Dropdown to select group
- Metrics auto-update for selected group
- Alerts filtered by group
- Snapshots only show that group's data

**Platform-wide view (ops only):**

- See all organizations' metrics
- Identify patterns across groups
- Spot systemic issues

---

## Monitoring Schedule

### Hourly (Fast Check)

**Time:** Every hour at :00

**What:**

- Check for critical issues only
- Count orphaned entities, cross-group refs, missing groupIds
- Alert if any found

**Processing Time:** < 1 second per group
**Overhead:** Minimal

**Alert Level:** CRITICAL only

---

### Daily (Comprehensive)

**Time:** 02:00 UTC

**What:**

1. Full integrity check across all dimensions
2. Compute all 7 metrics
3. Save snapshot to dataQualitySnapshots table
4. Check thresholds and alert

**Processing Time:** 30-60 seconds per group
**Overhead:** Moderate (1% DB load)

**Alert Levels:** All (critical, warning, info)

---

### Weekly (Summary Report)

**Time:** Monday 06:00 UTC

**What:**

1. Aggregate daily snapshots from past 7 days
2. Calculate trends (improving vs declining)
3. Generate summary report
4. Alert on declining trends

**Processing Time:** 2-5 minutes total
**Overhead:** Low (off-peak)

**Alert Levels:** Warning, info

---

### Event Archival

**Time:** Daily 03:00 UTC

**What:**

1. Find events older than 365 days
2. Mark as archived (soft delete)
3. Remove from hot indexes
4. Log archival event

**Processing Time:** 10-30 seconds per group
**Overhead:** Minimal

**Volume:** Typically 500-5000 events per day

---

## Dashboard Actions

### For CRITICAL Alerts

1. **Orphaned Entities Found**
   - Action: Open audit trail for affected connections
   - Check: When was source/target entity deleted?
   - Decision: Cascade delete connection or restore entity?
   - Run: `/scripts/migrate-ontology-v1.ts` to validate

2. **Cross-Group Violations**
   - Action: Immediately notify security
   - Check: Query logs for how violation occurred
   - Decision: Delete violating connection or restore group?
   - Escalate: Possible data breach

3. **Integrity Score < 95%**
   - Action: Run comprehensive check
   - Review: All issues listed
   - Remediate: Fix top issues first
   - Monitor: Hourly until back to normal

### For WARNING Alerts

1. **Declining Integrity Trend**
   - Review: Last 7 days of snapshots
   - Identify: When did trend start?
   - Investigation: What changed in that period?
   - Action: Review recent mutations and code changes

2. **Low Archival Progress**
   - Check: Archival cron job is running
   - Review: Event logs for archival failures
   - Action: Increase archival batch size or frequency

3. **Low Schema Compliance**
   - Review: Migration progress
   - Check: Any new legacy entities being created?
   - Action: Run migration again

---

## Query Reference

### Check Integrity (Real-Time)

```typescript
// Get comprehensive integrity report for a group
await client.query("queries/monitoring:checkIntegrity", {
  groupId: "group_id",
  limit: 1000  // max issues to return
});

// Returns:
{
  status: "healthy" | "warning" | "critical",
  summary: {
    totalIssues: number,
    criticalIssues: number,
    warningIssues: number,
    infoIssues: number
  },
  details: {
    orphanedConnections: number,
    crossGroupReferences: number,
    missingGroupIds: number,
    invalidMetadata: number,
    malformedProperties: number
  },
  issues: [
    {
      category: "orphaned_connection" | "cross_group_ref" | ...,
      severity: "critical" | "warning" | "info",
      recordId: string,
      description: string,
      metadata: any
    }
  ]
}
```

### Get Data Quality Metrics

```typescript
// Get computed metrics for dashboard
await client.query("queries/monitoring:getDataQualityMetrics", {
  groupId: "group_id"  // optional, undefined = platform-wide
});

// Returns:
{
  timestamp: number,
  groupId: "group_id",
  referentialIntegrityScore: 99.8,  // 0-100
  orphanedEntityCount: 2,
  crossGroupViolations: 0,
  malformedPropertiesCount: 5,
  schemaComplianceScore: 98.5,      // 0-100
  eventArchivalProgress: 91.2       // 0-100
}
```

### Audit Trail for Entity

```typescript
// Get all events and connections for an entity
await client.query("queries/monitoring:auditTrail", {
  thingId: "entity_id",
  limit: 100
});

// Returns:
{
  thingId: "entity_id",
  groupId: "group_id",
  thing: { ... },
  events: [ /* all events for this entity */ ],
  connections: {
    outgoing: [ /* connections where entity is source */ ],
    incoming: [ /* connections where entity is target */ ]
  }
}
```

### Schema Version Distribution

```typescript
// Track migration progress
await client.query("queries/monitoring:getSchemaVersionDistribution", {
  groupId: "group_id"  // optional
});

// Returns:
{
  timestamp: number,
  v0Entities: 42,  // Pre-migration entities
  v1Entities: 2458,  // Post-migration entities
  distributionPercentage: {
    v0: 1.68,
    v1: 98.32
  }
}
```

---

## Action Items & Remediation

### Issue: Orphaned Connections

**Root Cause:** Entity was deleted without cascading cleanup

**Remediation Steps:**

1. Query the orphaned connection:
   ```
   connectionId = alert.metadata.connectionId
   ```
2. Check audit trail: when was the entity deleted?
   ```
   auditTrail(entityId, limit=100)
   ```
3. Decide:
   - **Option A:** Delete the connection (data wasn't critical)
     ```
     mutation/connections:delete(connectionId)
     ```
   - **Option B:** Restore entity (data was important)
     ```
     mutation/things:restore(entityId)
     ```
4. Monitor: Run hourly check again to confirm resolution

---

### Issue: Cross-Group Violations

**Root Cause:** Data isolation was bypassed

**Remediation Steps:**

1. **IMMEDIATE:** Contact security@company.com
2. Query the violating connection:
   ```
   checkIntegrity(groupId, "cross_group_ref")
   ```
3. Investigate: How did this happen?
   - Check query logs for queries spanning groups
   - Review connection creation mutations
   - Check for code bugs filtering groupId
4. Decide:
   - **Option A:** Delete the connection (likely wrong)
     ```
     mutation/connections:delete(connectionId)
     ```
   - **Option B:** Move to correct group (if data should be shared)
     Requires data governance approval
5. Prevent: Add validation in all mutation handlers

---

### Issue: Declining Integrity Trend

**Root Cause:** Data quality getting worse over time

**Remediation Steps:**

1. Review trend snapshots from last 7 days
   ```
   dataQualitySnapshots where timestamp >= (now - 7 days)
   ```
2. Identify the inflection point: When did it start declining?
3. Correlate with events:
   - What code was deployed?
   - What data imports ran?
   - What manual operations were done?
4. Roll back or fix the change
5. Monitor for improvement

---

## Compliance & Auditing

### For SOC 2 Compliance

**Type II Data Integrity Controls:**

- Real-time monitoring (hourly checks)
- Documented thresholds and alerts
- Audit trail for all issues found
- Remediation tracking in events

**Evidence:**

- `dataQualitySnapshots` table (7+ years retention)
- `events` table with monitoring\_\* types
- Weekly summary reports
- Alert history in logs

**Annual Audit:**

- Review data integrity metrics year-over-year
- Check orphaned entity count (should stay near 0)
- Verify event archival compliance
- Validate schema compliance > 95%

### For GDPR Data Protection

**Right to Be Forgotten:**

- Integrity checks include orphaned knowledge
- Data source tracking via `sourceThingId`
- Deletion cascade prevents partial records
- Audit trail shows what was deleted and when

---

## Dashboard Screenshots (Mockup)

### Real-Time Integrity Card

```
┌─────────────────────────────────────┐
│ Referential Integrity: 99.8% ✓       │
├─────────────────────────────────────┤
│ Orphaned Connections:  2             │
│ Cross-Group References: 0            │
│ Missing GroupIds:       0            │
│ Malformed Properties:   5            │
├─────────────────────────────────────┤
│ Status: HEALTHY                     │
│ Last Check: 2 min ago               │
│ Next Check: in 58 min               │
└─────────────────────────────────────┘
```

### Trend Chart (7 Days)

```
Referential Integrity Score
100% ├─────────────────────────────
     │                    ╭──────╮
99%  │  ╭──────╮ ╭──────╯        ╰──
     │  │      │ │
98%  ├──┴──────┴─┴────────────────
     Mon  Tue  Wed  Thu  Fri  Sat  Sun

Status: IMPROVING (↑ 1.2% in last 7 days)
```

---

## Monitoring Best Practices

### For Ops Teams

1. **Daily Standup:** Review previous day's integrity report
2. **Weekly Review:** Analyze trend charts and alert history
3. **Monthly Audit:** Check for patterns and systemic issues
4. **Quarterly Planning:** Adjust thresholds based on growth

### For Developers

1. **Pre-commit:** Ensure mutations validate groupId
2. **Code Review:** Check for groupId filters in queries
3. **Testing:** Include data quality checks in integration tests
4. **Deployment:** Run pre-flight `checkIntegrity()` before deploying

### For Security

1. **Daily:** Monitor cross-group violation alerts
2. **Weekly:** Review audit trail for suspicious patterns
3. **Monthly:** Validate multi-tenant isolation enforcement
4. **Quarterly:** Penetration test for groupId bypass

---

## Future Enhancements

- [ ] Machine learning for anomaly detection
- [ ] Predictive alerts (alert before hitting threshold)
- [ ] Auto-remediation for common issues
- [ ] Integration with incident management systems
- [ ] Custom thresholds per organization/plan
- [ ] Graphical dashboard UI (built-in to platform)

---

**Document Status:** Active
**Last Updated:** 2025-11-01
**Owner:** Engineering Director
**Review Frequency:** Quarterly
