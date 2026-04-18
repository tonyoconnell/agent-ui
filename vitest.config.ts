import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'nanoclaw/src/**/*.test.ts'],
    environment: 'node',
    testTimeout: 10_000,
    reporters: [
      'default',
      ['json', { outputFile: '.vitest/results.json' }],
    ],
    globalSetup: ['./src/__tests__/helpers/global-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts'],
      // Exclude dead/integration code that has no unit tests by design:
      // - archive/: retired engine experiments kept for reference only
      // - apis/: thin pre-wired HTTP wrappers (tested at integration layer)
      // - one*.ts: composition roots (substrate bootstrap, tested e2e)
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        '**/archive/**',
        '**/apis/**',
        'src/engine/one.ts',
        'src/engine/one-prod.ts',
        'src/engine/one-complete.ts',
      ],
      // Lines threshold is a floor, not a goal — raises only when we add
      // unit coverage. No coverage-for-coverage: don't invent tests just
      // to move this number; invent tests to raise routing speed or accuracy.
      thresholds: {
        lines: 45,
      },
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
    },
  },
})
