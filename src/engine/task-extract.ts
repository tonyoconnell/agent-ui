/**
 * TASK-EXTRACT — Haiku one-shot extraction from docs
 *
 * Reads a strategy/architecture doc, sends it to Haiku once,
 * gets back structured TODO items in the parseable format.
 * Writes to docs/TODO-{docname}.md.
 *
 * This runs ONCE per doc. After that, the deterministic parser
 * (task-parse.ts) reads the TODO files. No LLM in the loop.
 */

type Complete = (prompt: string) => Promise<string>

const EXTRACT_PROMPT = `You are a task extractor for ONE Substrate. Read the document and extract every actionable task, TODO, gap, or implicit work item.

CONTEXT: Tasks live in TypeDB alongside ~128 other tasks. Think about:
- **Discovery**: What tags will agents use to find this task? (domain: build, marketing, typedb; action: wire, deploy, test; priority: P0-P3)
- **Dependencies**: What tasks must finish before this one starts? (blocks: task-id means "this blocks task-id", creating dependency chains)
- **Verification**: How will agents know it's done? Exit conditions should be checkable via TypeDB queries or observable outcomes (e.g., "agent responds on Telegram", "schema in TypeDB")
- **Routing**: Pheromone will accumulate on paths that solve this task. Pick personas who excel at it
- **Document intent**: Strategy docs extract governance/roadmap tasks, technical docs extract engineering/build tasks, architecture docs extract design/foundation

For each task, output in this EXACT format (one task per block, indented metadata under the checkbox):

- [ ] Task name here
  value: critical | high | medium
  effort: low | medium | high
  phase: C1 | C2 | C3 | C4 | C5 | C6 | C7
  persona: ceo | dev | investor | gamer | kid | freelancer | agent
  blocks: comma-separated-task-ids-this-blocks (if any)
  exit: What "done" looks like (one line)
  tags: comma, separated, tags

Rules:
- value: "critical" = can't ship without it, "high" = important not fatal, "medium" = nice to have
- effort: predicted AI effort to complete. "low" = simple/mechanical (Haiku can do it — boilerplate, config, rename, simple CRUD). "medium" = multi-step reasoning (Sonnet — refactors, integrations, multi-file changes). "high" = complex architecture or novel design (Opus — system design, security, novel algorithms, deep debugging)
- phase: C1=foundation, C2=collaboration, C3=commerce, C4=expansion, C5=analytics, C6=products, C7=scale
- persona: who does this best — ceo (governance), dev (code/infra), investor (revenue), gamer (exploration), kid (learning), freelancer (contribution), agent (execution)
- blocks: use slugified task IDs (lowercase-kebab-case). Only list tasks that THIS task blocks (i.e. can't start until this is done). These become TypeDB relations
- tags: include domain (marketing, engineering, commerce, ui, infra, agent, security, typedb, analytics, integration), action (build, wire, fix, test, deploy, design, refactor), priority (P0, P1, P2, P3). Agents discover tasks by filtering tags in TypeDB
- Mark completed items with [x] if doc says so
- Extract IMPLICIT tasks from prose — "Deploy 8 agents on Telegram" is a task even if not in a checkbox
- Exit conditions: be specific and verifiable. Instead of "done", write "8 agents respond on Telegram", "schema in TypeDB", "path has 100+ signals recorded"
- Blocks/unlocks: think about prerequisite chains. What must finish first? What does this unlock?

Output ONLY the task list. No commentary. No headers except "# TODO: {docname}".

DOCUMENT:
`

/**
 * Extract tasks from a doc using Haiku (one-shot).
 * Returns the structured TODO markdown content.
 */
export async function extractTasks(docPath: string, complete: Complete): Promise<string> {
  const fsp = await import('node:fs/promises')
  const path = await import('node:path')

  const content = await fsp.readFile(docPath, 'utf-8')
  const docName = path.basename(docPath, '.md')

  const contextedPrompt = `${EXTRACT_PROMPT}\n[Extracted from: ${docName}.md]\n\n${content}`
  const result = await complete(contextedPrompt)
  return result
}

/**
 * Extract and write TODO file for a single doc.
 * Returns the output path.
 */
export async function extractAndWrite(docPath: string, docsDir: string, complete: Complete): Promise<string> {
  const { writeFile } = await import('node:fs/promises')
  const { basename, join } = await import('node:path')

  const docName = basename(docPath, '.md')
  const todoContent = await extractTasks(docPath, complete)
  const outPath = join(docsDir, `TODO-${docName}.md`)

  await writeFile(outPath, todoContent, 'utf-8')
  return outPath
}

/**
 * Extract tasks from all strategy docs in a directory.
 * Skips docs that already have a TODO-{name}.md file.
 */
export async function extractAll(
  docsDir: string,
  complete: Complete,
  opts?: { force?: boolean; include?: string[] },
): Promise<{ extracted: string[]; skipped: string[] }> {
  const { readdir } = await import('node:fs/promises')
  const { join, basename } = await import('node:path')

  const entries = await readdir(docsDir)
  const existing = new Set(
    entries.filter((f) => f.startsWith('TODO-')).map((f) => f.replace('TODO-', '').replace('.md', '')),
  )

  // Strategy docs worth extracting (skip READMEs, CLAUDEs, existing TODOs)
  const SKIP = new Set([
    'README',
    'CLAUDE',
    'TODO',
    'SEED-REPORT',
    'e2e-test-report',
    'e2e-test-quickstart',
    'TESTING',
    'SECURE-DEPLOY',
    'DOMAIN-CONFIG',
  ])
  const docs = entries
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !f.startsWith('TODO-'))
    .filter((f) => !SKIP.has(basename(f, '.md')))
    .filter((f) => !opts?.include || opts.include.includes(basename(f, '.md')))

  const extracted: string[] = []
  const skipped: string[] = []

  for (const doc of docs) {
    const name = basename(doc, '.md')
    if (!opts?.force && existing.has(name)) {
      skipped.push(name)
      continue
    }

    try {
      await extractAndWrite(join(docsDir, doc), docsDir, complete)
      extracted.push(name)
    } catch {
      skipped.push(name)
    }
  }

  return { extracted, skipped }
}
