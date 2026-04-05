# E2E Test Quick Start

## One-Liner Test (if servers already running)

```bash
bash scripts/e2e-test.sh
```

## Full Test Setup (from scratch)

### Terminal 1: Start Pages Server
```bash
npm run dev
# Waits for: "ready in XXX ms"
# Server: http://localhost:4321
```

### Terminal 2: Start Gateway Worker
```bash
cd gateway && wrangler dev --port 8787
# Waits for: "Ready on http://localhost:8787"
```

### Terminal 3: Run Tests
```bash
bash scripts/e2e-test.sh
```

## Expected Results

```
Testing Pages /api/health... ✓ (1552ms)
Testing Gateway /health... ✓ (27ms)
Testing Pages /api/query... ✓ (328ms)
Testing Pages /api/state... ✓ (1893ms)
Testing Pages /api/signal... ✓ (758ms)
Testing Pages /api/stats... ✓ (2036ms)

Passed: 6
Failed: 0
Average latency: 1019ms

✓ All tests passed!
```

## Interpreting Results

| Latency | Meaning |
|---------|---------|
| 20-30ms | Gateway only (local) |
| 300-500ms | Simple query (warm) |
| 800-1000ms | Signal routing |
| 1500-2300ms | Complex aggregation (cold) |

## Endpoints Being Tested

| Endpoint | Measures |
|----------|----------|
| `/api/health` | Pages → TypeDB connectivity |
| `/api/query` | Full TypeQL query execution |
| `/api/state` | World state aggregation |
| `/api/signal` | Signal routing + path writes |
| `/api/stats` | Metrics aggregation |

## Troubleshooting

### Gateway fails to start
```
Error: EADDRINUSE: address already in use :::8787
```
Kill existing process: `lsof -ti:8787 | xargs kill -9`

### Pages returns 500 error
Check Pages server logs for TypeDB connection issues

### Tests timeout
Gateway and Pages must both be running. Check both terminals.

### Latency varies wildly
Normal for first request (TLS handshake). Subsequent requests are faster.

## Full Report

See `docs/e2e-test-report.md` for detailed analysis including:
- Component health status
- Network path analysis
- Performance statistics
- Optimization recommendations
