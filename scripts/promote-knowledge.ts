#!/usr/bin/env bun
/**
 * Promote knowledge chunks → L6 hypotheses in TypeDB
 *
 * Reads JSONL chunks from docs/knowledge/
 * Creates hypothesis entities in TypeDB via TypeQL write
 * Idempotent: skips chunks that already exist by hid
 * Batches in groups of 20 to avoid TypeDB timeout
 *
 * Run: bun run scripts/promote-knowledge.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// Load .env manually (bun supports this natively)
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
}

interface KnowledgeChunk {
  id: string
  title: string
  source: string
  content: string
  tags: string[]
  character_count: number
  chunk_index?: number
}

const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'knowledge')
const GATEWAY_URL = process.env.PUBLIC_GATEWAY_URL || 'https://api.one.ie'
const BATCH_SIZE = 20

async function typedbQuery(tql: string, txType: 'read' | 'write' = 'read') {
  const res = await fetch(`${GATEWAY_URL}/typedb/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: tql,
      transactionType: txType,
      commit: txType === 'write',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TypeDB query failed: ${res.status} - ${text.slice(0, 200)}`)
  }

  const data = await res.json() as { answers?: unknown[] }
  return data.answers || []
}

function parseAnswers(answers: unknown[]): Record<string, unknown>[] {
  return (answers as Array<{ data?: Record<string, { value?: unknown }> }>).map(answer => {
    const result: Record<string, unknown> = {}
    if (!answer?.data) return result
    for (const [varName, concept] of Object.entries(answer.data)) {
      if (concept?.value !== undefined) result[varName] = concept.value
    }
    return result
  })
}

/** Check which hids already exist in TypeDB */
async function fetchExistingHids(hids: string[]): Promise<Set<string>> {
  if (hids.length === 0) return new Set()
  // TypeDB doesn't support IN clause; use a broad match and filter client-side
  try {
    const answers = await typedbQuery(
      `match $h isa hypothesis, has hid $id; $id like "^knowledge-"; select $id;`,
      'read'
    )
    const rows = parseAnswers(answers)
    return new Set(rows.map(r => r.id as string))
  } catch {
    // On error, assume none exist (will fail on insert if duplicate — that's fine)
    return new Set()
  }
}

/** Escape a string for TQL insertion */
function escapeForTql(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, "'")  // replace double quotes with single quotes per spec
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .trim()
}

/** Build a single hypothesis insert query */
function buildInsertQuery(chunk: KnowledgeChunk): string {
  const hid = `knowledge-${chunk.id}`
  const titlePart = escapeForTql(chunk.title)
  const contentPart = escapeForTql(chunk.content.slice(0, 300))
  const statement = `${titlePart}: ${contentPart}`

  return `insert $h isa hypothesis,
    has hid "${hid}",
    has statement "${statement}",
    has hypothesis-status "pending",
    has observations-count 0,
    has p-value 0.5;`
}

async function promoteKnowledge() {
  console.log('\nPROMOTE KNOWLEDGE CHUNKS → L6 HYPOTHESES\n')
  console.log(`Source: ${OUTPUT_DIR}`)
  console.log(`Gateway: ${GATEWAY_URL}`)
  console.log(`Batch size: ${BATCH_SIZE}\n`)

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error(`Knowledge directory not found: ${OUTPUT_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jsonl'))
  console.log(`Found ${files.length} JSONL files\n`)

  // Load all chunks first
  const allChunks: { chunk: KnowledgeChunk; category: string }[] = []

  for (const file of files) {
    const filepath = path.join(OUTPUT_DIR, file)
    const category = file.replace('.jsonl', '')
    const lines = fs.readFileSync(filepath, 'utf-8').split('\n').filter(l => l.trim())

    for (const line of lines) {
      try {
        const chunk: KnowledgeChunk = JSON.parse(line)
        allChunks.push({ chunk, category })
      } catch {
        // Skip malformed lines
      }
    }
  }

  console.log(`Total chunks loaded: ${allChunks.length}`)

  // Fetch all existing hids in one query to avoid per-chunk round-trips
  console.log('Checking existing hypotheses in TypeDB...')
  const allHids = allChunks.map(({ chunk }) => `knowledge-${chunk.id}`)
  const existingHids = await fetchExistingHids(allHids)
  console.log(`Already in TypeDB: ${existingHids.size}\n`)

  // Filter to only chunks that need inserting
  const toInsert = allChunks.filter(({ chunk }) => !existingHids.has(`knowledge-${chunk.id}`))
  console.log(`To insert: ${toInsert.length}\n`)

  if (toInsert.length === 0) {
    console.log('All chunks already promoted. Nothing to do.')
    return
  }

  let totalInserted = 0
  let totalSkipped = existingHids.size
  let totalErrors = 0

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)

    for (const { chunk } of batch) {
      try {
        const tql = buildInsertQuery(chunk)
        await typedbQuery(tql, 'write')
        totalInserted++

        if (totalInserted % 50 === 0 || totalInserted === toInsert.length) {
          console.log(`Inserted ${totalInserted}/${toInsert.length}...`)
        }
      } catch (err) {
        totalErrors++
        const msg = err instanceof Error ? err.message : String(err)
        // Only log first 5 errors to avoid spam
        if (totalErrors <= 5) {
          console.error(`  Error on chunk ${chunk.id}: ${msg.slice(0, 150)}`)
        }
      }
    }

    // Small pause between batches to avoid overwhelming TypeDB
    if (i + BATCH_SIZE < toInsert.length) {
      await new Promise(r => setTimeout(r, 100))
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`Total chunks found:  ${allChunks.length}`)
  console.log(`Skipped (existing):  ${totalSkipped}`)
  console.log(`Inserted:            ${totalInserted}`)
  console.log(`Errors:              ${totalErrors}`)
  console.log('─'.repeat(60))

  if (totalErrors > 0) {
    console.log(`\nWarning: ${totalErrors} chunks failed. Re-run to retry.`)
  } else {
    console.log('\nAll knowledge promoted successfully.')
  }

  console.log('\nAgents can now recall domain knowledge:')
  console.log('  recall("seo") → hypotheses matching "seo"')
  console.log('  recall("local ranking") → hypotheses matching "local ranking"')
  console.log('  recall("moving") → hypotheses matching "moving"')
}

promoteKnowledge().catch(e => {
  console.error('FATAL:', e)
  process.exit(1)
})
