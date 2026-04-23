#!/usr/bin/env bun
/**
 * CI lint: ensure all rich-message Zod schemas use .strict()
 *
 * Checks that every Zod schema in rich-message directories
 * has .strict() to enforce strict mode validation.
 *
 * Exit code: 0 if all schemas use .strict(), 1 if violations found
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const dirs = ['interfaces/rich-message', 'src/interfaces/rich-message']

const violations: string[] = []

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    continue
  }

  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.ts'))

  for (const file of files) {
    const filePath = path.join(dir, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    // Check if file contains a Zod schema definition
    if (content.includes('z.object') || content.includes('z.union')) {
      // Check if it has .strict()
      if (!content.includes('.strict()')) {
        violations.push(filePath)
      }
    }
  }
}

if (violations.length > 0) {
  console.error('❌ STRICT CHECK FAILED: the following files lack .strict():\n')
  violations.forEach((file) => {
    console.error(`  ${file}`)
  })
  process.exit(1)
}

console.log('✓ STRICT CHECK OK: all rich-message schemas use .strict()')
process.exit(0)
