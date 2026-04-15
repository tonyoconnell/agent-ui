import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { build } from 'esbuild'

try {
  const dir = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : process.cwd()

  await build({
    entryPoints: [resolve(dir, '../src/entries/chat-embed.ts')],
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    outfile: resolve(dir, '../dist/chat.js'),
    logLevel: 'info',
  })

  const raw = readFileSync(resolve(dir, '../dist/chat.js'))
  const gzipped = gzipSync(raw)
  const KB = gzipped.length / 1024

  console.log(`chat.js: ${(raw.length / 1024).toFixed(1)} KB raw → ${KB.toFixed(1)} KB gz`)

  if (gzipped.length > 30 * 1024) {
    console.error('FAIL: chat.js gz exceeds 30 KB')
    process.exit(1)
  } else {
    console.log('✓ size ok')
  }
} catch (err) {
  console.error(err)
  process.exit(1)
}
