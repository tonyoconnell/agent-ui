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
  },
})
