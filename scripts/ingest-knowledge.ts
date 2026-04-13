#!/usr/bin/env bun
/**
 * Ingest Donal's knowledge corpus → JSONL chunks → promotable to L6 hypotheses
 *
 * Reads markdown files from ../donal/agency-operator/knowledge/
 * Chunks by heading (## or ###)
 * Writes to docs/knowledge/*.jsonl
 *
 * Run: bun run scripts/ingest-knowledge.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

interface KnowledgeChunk {
  id: string
  title: string
  source: string
  content: string
  tags: string[]
  character_count: number
  chunk_index: number
}

const DONAL_PATH = path.join('/Users/toc/Server', 'donal', 'agency-operator', 'knowledge')
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'knowledge')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function generateId(source: string, index: number): string {
  const hash = crypto.createHash('sha256')
    .update(`${source}:${index}`)
    .digest('hex')
  return hash.slice(0, 16)
}

function chunkMarkdown(content: string, source: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = []
  const lines = content.split('\n')

  let currentChunk = ''
  let currentTitle = 'Untitled'
  let chunkIndex = 0

  for (const line of lines) {
    if (line.match(/^##\s+/)) {
      // Save previous chunk if it has content
      if (currentChunk.trim().length > 100) {
        chunks.push({
          id: generateId(source, chunkIndex),
          title: currentTitle,
          source,
          content: currentChunk.trim(),
          tags: extractTags(currentTitle, currentChunk),
          character_count: currentChunk.length,
          chunk_index: chunkIndex,
        })
        chunkIndex++
      }

      // Start new chunk
      currentTitle = line.replace(/^##\s+/, '').trim()
      currentChunk = ''
    } else if (line.match(/^###\s+/)) {
      // Sub-heading within chunk
      currentChunk += `\n${line}\n`
    } else {
      currentChunk += `${line}\n`
    }
  }

  // Save final chunk
  if (currentChunk.trim().length > 100) {
    chunks.push({
      id: generateId(source, chunkIndex),
      title: currentTitle,
      source,
      content: currentChunk.trim(),
      tags: extractTags(currentTitle, currentChunk),
      character_count: currentChunk.length,
      chunk_index: chunkIndex,
    })
  }

  return chunks
}

function extractTags(title: string, content: string): string[] {
  const tags = new Set<string>()

  // Tags from title
  const titleLower = title.toLowerCase()
  if (titleLower.includes('seo')) tags.add('seo')
  if (titleLower.includes('citation')) tags.add('citation')
  if (titleLower.includes('local')) tags.add('local')
  if (titleLower.includes('audit')) tags.add('audit')
  if (titleLower.includes('backlink')) tags.add('backlink')
  if (titleLower.includes('content')) tags.add('content')
  if (titleLower.includes('copy')) tags.add('copy')
  if (titleLower.includes('website')) tags.add('website')
  if (titleLower.includes('domain')) tags.add('domain')
  if (titleLower.includes('agency')) tags.add('agency')

  // Tags from content frequency
  const contentLower = content.toLowerCase()
  const keywords = ['google', 'ai', 'ranking', 'visibility', 'gmb', 'yelp', 'nap', 'e-a-t']
  keywords.forEach(kw => {
    if (contentLower.includes(kw)) tags.add(kw)
  })

  return Array.from(tags)
}

async function ingestKnowledge() {
  console.log('\n📚 KNOWLEDGE CORPUS INGESTION\n')
  console.log(`Source: ${DONAL_PATH}`)
  console.log(`Output: ${OUTPUT_DIR}\n`)

  if (!fs.existsSync(DONAL_PATH)) {
    console.error(`❌ Knowledge directory not found: ${DONAL_PATH}`)
    process.exit(1)
  }

  // Find all .md files
  const files = fs.readdirSync(DONAL_PATH, { recursive: true })
    .filter((f): f is string => typeof f === 'string')
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(DONAL_PATH, f))

  console.log(`Found ${files.length} markdown files\n`)

  let totalChunks = 0
  let totalChars = 0
  const fileIndex: Record<string, number> = {}

  // Process each file
  for (const file of files) {
    const filename = path.basename(file).replace('.md', '')
    const content = fs.readFileSync(file, 'utf-8')
    const chunks = chunkMarkdown(content, filename)

    if (chunks.length === 0) {
      console.log(`⊘ ${filename} — no chunks (too small)`)
      continue
    }

    // Group by top-level category
    const category = path.basename(path.dirname(file))
    const outputFile = path.join(OUTPUT_DIR, `${category}.jsonl`)

    // Append chunks as JSONL
    const lines = chunks.map(chunk => JSON.stringify(chunk)).join('\n')
    fs.appendFileSync(outputFile, lines + '\n')

    fileIndex[filename] = chunks.length
    totalChunks += chunks.length
    totalChars += chunks.reduce((sum, c) => sum + c.character_count, 0)

    console.log(`✓ ${filename} — ${chunks.length} chunks (${chunks.reduce((sum, c) => sum + c.character_count, 0)} chars)`)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Total chunks ingested: ${totalChunks}`)
  console.log(`Total characters: ${totalChars.toLocaleString()}`)
  console.log(`Average chunk size: ${Math.round(totalChars / totalChunks)} chars`)
  console.log(`Output files: ${fs.readdirSync(OUTPUT_DIR).length}`)
  console.log(`\nFiles saved:`)
  fs.readdirSync(OUTPUT_DIR).forEach(f => {
    const lines = fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8').split('\n').length - 1
    console.log(`  ${f.padEnd(20)} ${lines} chunks`)
  })
  console.log('─'.repeat(60) + '\n')

  console.log('Next: Promote chunks to L6 hypotheses in TypeDB')
  console.log('  match $c ... select ...; # query chunks')
  console.log('  insert (agent: $a, source: $c) isa hypothesis, has confidence 0.6;')
  console.log('')
}

ingestKnowledge().catch(e => {
  console.error('FATAL:', e)
  process.exit(1)
})
