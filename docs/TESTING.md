# Testing Documentation

## End-to-End Tests

### Quick Start
```bash
# With servers running (npm run dev + wrangler dev)
bash scripts/e2e-test.sh
```

### Reports and Guides
- **[e2e-test-report.md](./e2e-test-report.md)** - Comprehensive analysis with latency breakdown
- **[e2e-test-quickstart.md](./e2e-test-quickstart.md)** - Quick reference guide

### Test Coverage

The E2E test suite validates:
- ✓ Browser → Pages → TypeDB connectivity
- ✓ TypeQL query execution (simple and complex)
- ✓ Signal routing and path writes
- ✓ Aggregation queries (state, stats)
- ✓ CORS headers and error handling
- ✓ Full stack latency measurement

### Key Metrics

| Endpoint | Latency | Status |
|----------|---------|--------|
| Gateway /health | 14-29ms | ✓ |
| Pages /api/query | 328-1134ms | ✓ |
| Pages /api/health | 518-1552ms | ✓ |
| Pages /api/signal | 758-975ms | ✓ |
| Pages /api/stats | 1704-2036ms | ✓ |
| Pages /api/state | 1893-2299ms | ✓ |

**Average: 1019ms | P95: 2100ms | Success Rate: 100%**

### Test Files

Located in `/scripts/`:
- `e2e-test.sh` - Primary bash test harness
- `e2e-test.ts` - TypeScript reference implementation

---

## Test Results Summary

**Last Run:** 2026-04-06
**Status:** PASS (18/18 tests)
**Bottleneck:** TypeDB Cloud (80-90% of latency)

See [e2e-test-report.md](./e2e-test-report.md) for full analysis.
