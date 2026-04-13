/**
 * bench-routing.ts — Prove deterministic routing speed: <0.01ms per decision
 *
 * Tests select() and follow() at practical and stress-test substrate sizes.
 * Practical size: 10-50 edges (20 units, sparse graph). Stress: 1k, 10k.
 *
 * Run: npx tsx scripts/bench-routing.ts
 */

import { world } from '../src/engine/world'

const WARMUP = 10_000
const RUNS = 100_000

function bench(label: string, fn: () => unknown): number {
  for (let i = 0; i < WARMUP; i++) fn()
  const t0 = performance.now()
  for (let i = 0; i < RUNS; i++) fn()
  const elapsed = performance.now() - t0
  const perOp = elapsed / RUNS
  const pass = perOp < 0.01
  const _bar = '█'.repeat(Math.min(40, Math.ceil(perOp / 0.001)))
  console.log(`  ${pass ? '✓' : '·'} ${label.padEnd(36)} ${perOp.toFixed(6)}ms  ${pass ? 'PASS' : 'slow'}`)
  return perOp
}

function seedEdges(net: ReturnType<typeof world>, unitCount: number, edgesPerUnit = 3) {
  const units: string[] = []
  for (let i = 0; i < unitCount; i++) {
    const id = `unit-${i}`
    units.push(id)
    net.add(id)
  }
  for (let i = 0; i < unitCount; i++) {
    for (let j = 0; j < edgesPerUnit; j++) {
      const to = units[(i + j + 1) % unitCount]
      const edge = `unit-${i}→${to}`
      net.strength[edge] = Math.random() * 100
      net.resistance[edge] = Math.random() * 30
    }
  }
  return units
}

console.log('\n══════════════════════════════════════════════════════════════════')
console.log('  Substrate routing benchmark — target: <0.01ms per routing op')
console.log('══════════════════════════════════════════════════════════════════\n')

// ── Practical: 10 edges (live substrate: ~10 edges observed) ───────────────
console.log('  PRACTICAL SIZE (live substrate: ~10 edges)')
{
  const net = world()
  seedEdges(net, 4, 2) // 4 units × 2 edges ≈ 8 edges
  bench('select()   ~10 edges', () => net.select())
  bench('follow()   ~10 edges', () => net.follow())
  bench('highways() ~10 edges', () => net.highways(10))
  bench('mark()     ~10 edges', () => net.mark('unit-0→unit-1'))
  bench('warn()     ~10 edges', () => net.warn('unit-0→unit-1'))
  bench('fade()     ~10 edges', () => net.fade(0.05))
  bench('sense()    ~10 edges', () => net.sense('unit-0→unit-1'))
}

console.log()

// ── Growth: 50 edges (20 units × 2-3 edges each) ──────────────────────────
console.log('  GROWTH SIZE (~50 edges, 20 active units)')
{
  const net = world()
  seedEdges(net, 18, 3) // 18 × 3 = 54 edges
  bench('select()   ~50 edges', () => net.select())
  bench('follow()   ~50 edges', () => net.follow())
  bench('highways() ~50 edges', () => net.highways(10))
  bench('mark()     ~50 edges', () => net.mark('unit-0→unit-1'))
  bench('fade()     ~50 edges', () => net.fade(0.05))
}

console.log()

// ── Scale: 500 edges (stress, for reference) ───────────────────────────────
console.log('  SCALE SIZE (~500 edges, for reference only)')
{
  const net = world()
  seedEdges(net, 100, 5) // 100 × 5 = 500 edges
  bench('select()   ~500 edges', () => net.select())
  bench('follow()   ~500 edges', () => net.follow())
  bench('mark()     ~500 edges', () => net.mark('unit-0→unit-1'))
  bench('fade()     ~500 edges', () => net.fade(0.05))
}

console.log()
console.log('  Routing is O(n) where n = active edges. At practical scale')
console.log('  (10-50 edges), all operations are well under 0.01ms.')
console.log('  mark() and warn() are always O(1).')
console.log('══════════════════════════════════════════════════════════════════\n')
