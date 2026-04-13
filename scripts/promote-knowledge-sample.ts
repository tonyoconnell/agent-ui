#!/usr/bin/env bun
/**
 * Promote sample knowledge chunks → L6 hypotheses (test)
 *
 * Just tests the hypothesis creation with a few samples
 * Full corpus can be synced in batch via separate runner
 */

import * as fs from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'

const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'knowledge')
const GATEWAY_URL = 'https://api.one.ie'

async function postWrite(tql: string) {
  const res = await fetch(`${GATEWAY_URL}/typedb/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: tql,
      transactionType: 'write',
      commit: true
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Write failed: ${res.status}`)
    console.error(text.slice(0, 300))
    return null
  }

  return await res.json()
}

async function promoteSample() {
  console.log('\n🧠 PROMOTE KNOWLEDGE SAMPLE (10 chunks)\n')

  const seoFile = path.join(OUTPUT_DIR, 'seo.jsonl')
  if (!fs.existsSync(seoFile)) {
    console.error(`❌ ${seoFile} not found`)
    process.exit(1)
  }

  const lines = fs.readFileSync(seoFile, 'utf-8').split('\n').filter(l => l.trim())
  const sample = lines.slice(0, 10)

  console.log(`Promoting ${sample.length} SEO knowledge chunks...\n`)

  let inserted = 0
  for (const line of sample) {
    try {
      const chunk: any = JSON.parse(line)

      const escapedTitle = chunk.title
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .slice(0, 150)

      const escapedDesc = chunk.content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, ' ')
        .slice(0, 500)

      const tql = `
        insert $h isa hypothesis,
          has id "${chunk.id}",
          has title "${escapedTitle}",
          has source-category "seo",
          has source-file "${chunk.source}",
          has confidence 0.8,
          has character-count ${chunk.character_count},
          has description "${escapedDesc}";
      `

      const result = await postWrite(tql)
      if (result) {
        console.log(`✓ ${chunk.title.slice(0, 50)}...`)
        inserted++
      } else {
        console.log(`✗ ${chunk.title.slice(0, 50)}...`)
      }
    } catch (err) {
      console.error(`❌ Error:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n✅ Inserted ${inserted}/${sample.length} hypotheses`)
  console.log('\nKnowledge is now queryable:')
  console.log('  match $h isa hypothesis, has source-category "seo"; select $h;')
  console.log('')
}

promoteSample().catch(e => {
  console.error('FATAL:', e)
  process.exit(1)
})
