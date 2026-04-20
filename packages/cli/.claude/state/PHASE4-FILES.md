# Phase 4 Implementation Files

Complete file listing and reference guide for Ontology Refinement Phase 4: Migration & Monitoring

---

## Core Implementation Files

### 1. Migration Script
**File:** `/Users/toc/Server/ONE/scripts/migrate-ontology-v1.ts`
**Size:** 19 KB (550 lines)
**Purpose:** Zero-downtime migration of all data to enforce groupId across all 5 dimensions
**Usage:**
```bash
npx tsx scripts/migrate-ontology-v1.ts [--backup] [--validate-only] [--dry-run]
```
**Features:**
- Creates backup before migration
- Creates default group for legacy data
- Batch updates entities, connections, events, knowledge
- Validation and integrity checks
- Detailed progress reporting
- Idempotent design (safe to re-run)

### 2. Monitoring Queries
**File:** `/Users/toc/Server/ONE/backend/convex/queries/monitoring.ts`
**Size:** 18 KB (650 lines)
**Purpose:** Real-time integrity checks and data quality metrics
**Functions:**
- `checkIntegrity(groupId?, limit?)` - Find all integrity issues
- `getDataQualityMetrics(groupId?)` - Get current metrics
- `auditTrail(thingId, limit?)` - Entity audit history
- `getSchemaVersionDistribution(groupId?)` - Migration progress
**Types Exported:**
- `IntegrityIssue` - Single data quality issue
- `IntegrityReport` - Full integrity check result
- `DataQualityMetrics` - Aggregated metrics
- `SchemaVersionDistribution` - Version tracking
**Coverage:**
- 5 integrity check categories
- 7 data quality metrics
- Complete audit trail
- Migration progress tracking

### 3. Monitoring Cron Jobs
**File:** `/Users/toc/Server/ONE/backend/convex/crons/monitoring.ts`
**Size:** 12 KB (300 lines)
**Purpose:** Automated continuous monitoring and alerting
**Jobs:**
- `hourlyHealthCheck` - Every hour, fast checks for critical issues
- `dailyComprehensiveCheck` - Daily 02:00 UTC, comprehensive integrity + metrics
- `weeklySummaryReport` - Weekly Monday 06:00 UTC, trend analysis
- `nightlyEventArchival` - Daily 03:00 UTC, archive old events
**Features:**
- Saves snapshots to dataQualitySnapshots table
- Generates monitoring events (alert, snapshot, summary)
- Intelligent alerting (threshold-based)
- Organization-scoped via groupId

### 4. Rollback Script
**File:** `/Users/toc/Server/ONE/scripts/rollback-ontology.ts`
**Size:** 12 KB (400 lines)
**Purpose:** Restore from pre-migration backup if needed
**Usage:**
```bash
npx tsx scripts/rollback-ontology.ts --backup-file ./backup.json [--dry-run] [--verify]
```
**Features:**
- Load backup from JSON file
- Verify backup integrity
- Dry-run mode for testing
- Verify-only mode (no restoration)
- Clear current data
- Restore entities, connections, events, knowledge
- Log rollback event

### 5. Schema Update
**File:** `/Users/toc/Server/ONE/backend/convex/schema.ts`
**Changes:** Added new table
**Table Added:** `dataQualitySnapshots`
**Fields:**
- `timestamp: number` - When snapshot was taken
- `groupId: optional(Id<"groups">)` - Which group (null = platform-wide)
- `referentialIntegrityScore: number` - 0-100%
- `orphanedConnections: number` - Count of orphaned refs
- `crossGroupViolations: number` - Count of isolation breaches
- `malformedProperties: number` - Count of invalid properties
- `metadata: optional(any)` - Additional context
**Indexes:**
- `by_time` - For time-series queries
- `by_group_time` - For org-specific trends
- `by_group` - For org-specific snapshots

---

## Documentation Files

### 6. Data Quality Metrics Guide
**File:** `/Users/toc/Server/ONE/one/things/plans/data-quality-metrics.md`
**Size:** 17 KB (650 lines)
**Audience:** Operators, Developers, Security Teams
**Contents:**
- 7 core metrics defined (with thresholds)
- Alert threshold table
- Monitoring schedule (hourly/daily/weekly)
- Dashboard design mockups
- Query reference with examples
- Troubleshooting procedures
- Compliance requirements (SOC 2, GDPR)
- Best practices for ops/dev/security
- Future enhancements

### 7. Migration Runbook
**File:** `/Users/toc/Server/ONE/MIGRATION_RUNBOOK.md`
**Size:** 19 KB (800 lines)
**Audience:** DevOps, Database Administrators, Engineering
**Contents:**
- Table of contents
- Overview and key properties
- Pre-migration checklist (1 week, 1 day, 1 hour, 30 min)
- 4-step migration process
- Real-time monitoring guide
- Post-migration validation (immediate, 1hr, 24hr, 1 week)
- Comprehensive troubleshooting (5 common issues)
- Rollback procedure (step-by-step)
- FAQ (12 questions)
- Support & escalation
- Sign-off section

### 8. Implementation Summary
**File:** `/Users/toc/Server/ONE/PHASE-4-IMPLEMENTATION-SUMMARY.md`
**Size:** 20 KB (1000+ lines)
**Audience:** Engineering Director, Technical Leads
**Contents:**
- Executive summary
- Complete deliverables (7 items)
- Architecture overview (data flows, monitoring)
- Critical features (multi-tenant safety, zero-downtime, observability)
- Validation & testing procedures
- Metrics and success criteria
- Files created/modified
- Integration points (with Phase 1-3)
- Documentation quality assessment
- Known limitations & future work
- Lessons learned
- Success metrics post-deployment
- Quick reference commands
- Appendix

---

## Reference & State Files

### 9. Phase Completion Status
**File:** `/Users/toc/Server/ONE/.claude/state/phase4-completion.json`
**Purpose:** Machine-readable phase completion status
**Contains:**
- Phase metadata
- Task completion list (7 tasks)
- Metrics (files, LOC, functions, checks)
- Deliverables status
- Success criteria checklist
- Testing status
- Next steps
- Risk mitigation summary
- Integration points

### 10. File Manifest
**File:** `/Users/toc/Server/ONE/.claude/state/PHASE4-FILES.md` (This file)
**Purpose:** Complete file listing and reference guide
**Contains:** Description and purpose of all Phase 4 deliverables

---

## Quick Reference

### File Locations
```
Backend Code:
  backend/convex/queries/monitoring.ts       - Monitoring queries
  backend/convex/crons/monitoring.ts         - Monitoring jobs
  backend/convex/schema.ts                   - Schema (modified)

Scripts:
  scripts/migrate-ontology-v1.ts             - Migration tool
  scripts/rollback-ontology.ts               - Rollback tool

Documentation:
  one/things/plans/data-quality-metrics.md   - Metrics guide
  MIGRATION_RUNBOOK.md                       - Operator guide
  PHASE-4-IMPLEMENTATION-SUMMARY.md          - Implementation guide

State:
  .claude/state/phase4-completion.json       - Completion status
  .claude/state/PHASE4-FILES.md              - This file
```

### Key Commands

**Pre-Migration:**
```bash
npx tsx scripts/migrate-ontology-v1.ts --validate-only
npx tsx scripts/migrate-ontology-v1.ts --dry-run
```

**Execute Migration:**
```bash
npx tsx scripts/migrate-ontology-v1.ts --backup
```

**Verify Success:**
```bash
npx convex query queries/monitoring:checkIntegrity
npx convex query queries/monitoring:getDataQualityMetrics
```

**Emergency Rollback:**
```bash
npx tsx scripts/rollback-ontology.ts --backup-file ./backup.json
```

---

## Checklist Before Production Use

### Pre-Migration (Week Before)
- [ ] Read MIGRATION_RUNBOOK.md completely
- [ ] Understand data-quality-metrics.md
- [ ] Test on staging database
- [ ] Verify backup location is accessible
- [ ] Brief team on procedures

### Day of Migration
- [ ] Run pre-flight checks (see runbook)
- [ ] Create backup
- [ ] Do dry-run
- [ ] Execute actual migration
- [ ] Verify integrity (should be 100%)
- [ ] Monitor for 24 hours

### Week After
- [ ] Review metrics (should be stable)
- [ ] Check for any new issues
- [ ] Archive backup after success
- [ ] Document any problems
- [ ] Train team on monitoring

---

## Success Indicators

### Immediate (During Migration)
- [ ] No errors printed
- [ ] Progress indicators show steady movement
- [ ] All batches complete successfully
- [ ] Final report shows 0 critical issues

### Post-Migration (24 Hours)
- [ ] Integrity score = 100%
- [ ] Orphaned entity count = 0
- [ ] Cross-group violations = 0
- [ ] No user-reported issues
- [ ] API performance normal

### Ongoing (Weekly)
- [ ] Integrity score >= 99%
- [ ] No new orphaned entities
- [ ] Monitoring crons executing
- [ ] Alerts generated as expected
- [ ] Trend analysis showing stable state

---

## Integration with Other Phases

### Phase 1: Critical Schema Fixes
- Provides groupId in all tables (required for Phase 4)
- Defines proper indexes (used by Phase 4 queries)
- Establishes data model (Phase 4 migrates to)

### Phase 2: Data Integrity Layer
- Validation prevents bad data (Phase 4 monitors)
- Cascade delete prevents orphans (Phase 4 detects)
- Group isolation middleware (Phase 4 enforces)

### Phase 3: Performance & Scale
- Batch operations enable migration (Phase 4 uses)
- Event archival reduces data (Phase 4 monitors)
- Computed fields for metrics (Phase 4 leverages)

### Future: Phase 5+
- Dashboard UI for monitoring
- ML-based anomaly detection
- Auto-remediation for common issues
- Integration with external systems

---

## Support & Escalation

### Common Questions
See MIGRATION_RUNBOOK.md FAQ section

### Troubleshooting
See MIGRATION_RUNBOOK.md Troubleshooting section

### Metrics Reference
See one/things/plans/data-quality-metrics.md

### Implementation Details
See PHASE-4-IMPLEMENTATION-SUMMARY.md

### Emergency Contact
- Tech Lead: For schema issues
- DevOps: For deployment/rollback
- Security: For cross-group violations
- Convex Support: For platform issues

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0.0 | 2025-11-01 | COMPLETE | Initial implementation |
| TBD | TBD | PENDING | Staging test results |
| TBD | TBD | PENDING | Production migration |
| TBD | TBD | PENDING | 24-hour post-migration review |
| TBD | TBD | PENDING | 1-week stability confirmation |

---

**File Manifest Status:** COMPLETE
**Last Updated:** 2025-11-01T14:35:00Z
**Next Review:** Before production migration
**Owner:** Engineering Director
