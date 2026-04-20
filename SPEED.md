# Speed

Every millisecond matters. This is the speed contract for this repo.

See [docs/fastest-ai.md](fastest-ai.md) for the full positioning.

---

## Benchmarks (This Repo)

| Operation                     | Baseline  | Target    | Status |
| ----------------------------- | --------- | --------- | ------ |
| Signal routing                | <0.005ms  | <0.01ms   | ✓      |
| Deposit weight                | <0.001ms  | <0.001ms  | ✓      |
| Fade (1,000 paths)            | <5ms      | <10ms     | ✓      |
| Ask round-trip (3-unit chain) | <100ms    | <150ms    | ✓      |
| Toxic check                   | <0.001ms  | <0.001ms  | ✓      |
| Select from 1,000 paths       | <1ms      | <2ms      | ✓      |
| TypeDB query (top 50 paths)   | 300ms p50 | 500ms p50 | ✓      |

Run speedtest suite:
```bash
npm run speedtest
# or
npx vitest run src/engine/routing.test.ts
```

---

## Live Verification

```bash
# Production highways (top proven paths)
curl https://one-substrate.pages.dev/api/export/highways

# Production toxic paths (auto-blocked)
curl https://one-substrate.pages.dev/api/export/toxic

# Production units
curl https://one-substrate.pages.dev/api/export/units
```

---

## Stack Layers

### Frontend
- Astro 6 SSR: TTFB <200ms
- React 19 islands: hydration <100ms
- Dark theme: zero runtime overhead

### Edge (Cloudflare)
- Routing decision: <0.005ms
- KV cache: highways <10ms
- Worker regions: 5+ (sub-100ms global)

### Runtime (ONE )
- In-memory routing (no DB)
- Async TypeDB sync (doesn't block)
- Pheromone: strength/resistance maps

### Blockchain (Sui)
- Agent identity: derived (no hot wallet)
- Highway proof: once per chain, immutable
- Settlement: sub-second finality

---

## Key Insight

**We don't compete on LLM speed. We compete on routing speed.**

Agent execution: 1–2 seconds (LLM latency, fixed)
Routing overhead: <0.005ms (ours), ~300ms (others)

**Speedup: 60,000× on routing layer alone.**

After 50 executions (highway emerges):
- Routing: <10ms cached (vs 300ms query)
- LLM: still 1–2s (same)
- **But:** select() → follow(), no randomness, guaranteed highway

This is how we win: **not smarter, faster**.

---

## See Also

- [docs/fastest-ai.md](fastest-ai.md) — Full stack speed story
- [docs/speed.md](one/speed.md) — Detailed benchmarks
- [docs/agent-speed-advantage.md](agent-speed-advantage.md) — Economic impact
- [docs/routing.md](routing.md) — How routing works
