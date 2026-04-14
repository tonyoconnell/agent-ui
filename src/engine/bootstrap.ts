/**
 * BOOTSTRAP — Drop a folder, run the loop
 *
 * The complete self-improving system:
 * 1. Scan folder for docs
 * 2. Extract todos/gaps
 * 3. Emit as signals
 * 4. Handle (implement, test, deploy)
 * 5. Update docs (mark done, create new)
 * 6. Repeat forever
 */

// Node imports are dynamic to avoid Cloudflare bundling issues
const nodefs = () => import('node:fs/promises')
const nodepath = () => import('node:path')

// Resolved at module load — bootstrap only runs in Node, never in CF Workers
const { readFile, writeFile, readdir, watch } = await nodefs()
const { join } = await nodepath()

import { create } from './one-complete'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Todo = {
  id: string
  file: string
  line: number
  text: string
  done: boolean
  priority: string
  tags: string[]
}

type BootstrapOptions = {
  folder: string
  complete?: (prompt: string) => Promise<string>
  interval?: number
  watch?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// SCANNER — Extract todos from markdown
// ═══════════════════════════════════════════════════════════════════════════

const scanFile = async (path: string): Promise<Todo[]> => {
  const content = await readFile(path, 'utf-8').catch(() => '')
  const lines = content.split('\n')
  const todos: Todo[] = []
  let section = 'root'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track sections
    const h = line.match(/^#{1,4}\s+(.+)/)
    if (h) {
      section = h[1]
      continue
    }

    // Checkbox: - [ ] or - [x]
    const cb = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.+)/)
    if (cb) {
      const _indent = cb[1].length
      const done = cb[2] !== ' '
      const text = cb[3].trim()
      const id = `${path}:${i + 1}`

      // Infer priority from section
      const priority = /critical|urgent|P0/i.test(section)
        ? 'P0'
        : /high|important|P1/i.test(section)
          ? 'P1'
          : /medium|P2/i.test(section)
            ? 'P2'
            : 'P3'

      // Infer tags from text
      const tags: string[] = []
      if (/test|spec/i.test(text)) tags.push('test')
      if (/deploy|ship/i.test(text)) tags.push('deploy')
      if (/doc|readme/i.test(text)) tags.push('docs')
      if (/fix|bug/i.test(text)) tags.push('fix')
      if (/feat|add|new/i.test(text)) tags.push('feature')

      todos.push({ id, file: path, line: i + 1, text, done, priority, tags })
    }
  }

  return todos
}

const scanFolder = async (folder: string): Promise<Todo[]> => {
  const entries = await readdir(folder, { withFileTypes: true, recursive: true })
  const todos: Todo[] = []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.md')) continue

    const path = join(entry.parentPath || folder, entry.name)
    const fileTodos = await scanFile(path)
    todos.push(...fileTodos)
  }

  return todos
}

// ═══════════════════════════════════════════════════════════════════════════
// DOC UPDATER — Mark todos done, create new docs
// ═══════════════════════════════════════════════════════════════════════════

const markDone = async (file: string, line: number): Promise<boolean> => {
  try {
    const content = await readFile(file, 'utf-8')
    const lines = content.split('\n')

    if (line > 0 && line <= lines.length) {
      // Replace [ ] with [x]
      lines[line - 1] = lines[line - 1].replace(/\[ \]/, '[x]')
      await writeFile(file, lines.join('\n'))
      return true
    }
  } catch {
    return false
  }
  return false
}

const _createDoc = async (folder: string, name: string, content: string): Promise<string> => {
  const path = join(folder, `${name}.md`)
  await writeFile(path, content)
  return path
}

const appendToDoc = async (file: string, content: string): Promise<boolean> => {
  try {
    const existing = await readFile(file, 'utf-8').catch(() => '')
    await writeFile(file, `${existing}\n\n${content}`)
    return true
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOTSTRAP — The complete system
// ═══════════════════════════════════════════════════════════════════════════

export const bootstrap = async (options: BootstrapOptions) => {
  const { folder, complete, interval = 100, watch: watchFolder = false } = options
  const one = create()

  // ── Load context from folder ──────────────────────────────
  const loadDocs = async () => {
    const entries = await readdir(folder, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const path = join(folder, entry.name)
      const key = entry.name.replace('.md', '')
      await one.loadContext(key, path)
    }
  }

  await loadDocs()

  // ── Core handlers ─────────────────────────────────────────

  // Scan: emit todos as signals
  one.on('scan', async (d, e) => {
    const todos = await scanFolder(folder)
    const open = todos.filter((t) => !t.done)

    for (const todo of open) {
      e('todo', {
        ...todo,
        priority: todo.priority === 'P0' ? 0 : todo.priority === 'P1' ? 1 : todo.priority === 'P2' ? 2 : 3,
        _from: 'scan',
      })
    }

    return { total: todos.length, open: open.length }
  })

  // Todo: route to appropriate handler
  one.on('todo', async (d, e) => {
    const { tags } = d as Todo

    if (tags.includes('test')) {
      e('worker:test', d)
    } else if (tags.includes('deploy')) {
      e('worker:deploy', d)
    } else if (tags.includes('docs')) {
      e('worker:docs', d)
    } else if (tags.includes('fix')) {
      e('worker:fix', d)
    } else if (tags.includes('feature')) {
      e('worker:implement', d)
    } else {
      e('worker:implement', d) // default
    }

    return { routed: true }
  })

  // Implement: do the work (with LLM if available)
  one.on('worker:implement', async (d, e) => {
    const { id, file, line, text } = d as Todo

    if (!complete) {
      // No LLM — just log
      console.log(`[TODO] ${text}`)
      return { pending: true, reason: 'no-llm' }
    }

    // Get context
    const ctx = one.getContext('DSL', 'dictionary', 'loop')

    // Ask LLM to implement
    const result = await complete(
      `
${ctx}

---

Task: ${text}

Implement this task. If it's a code change, provide the code.
If it's a doc change, provide the content.
Be concise and direct.
    `.trim(),
    ).catch(() => null)

    if (!result) {
      return { failed: true }
    }

    // Mark done in doc
    const marked = await markDone(file, line)

    // Emit completion
    e('complete', { id, text, result, marked })

    return { implemented: true, result: result.slice(0, 100) }
  })

  // Test: run tests
  one.on('worker:test', async (d) => {
    const { text } = d as Todo
    console.log(`[TEST] ${text}`)
    // Could actually run tests here
    return { tested: true }
  })

  // Deploy: ship it
  one.on('worker:deploy', async (d) => {
    const { text } = d as Todo
    console.log(`[DEPLOY] ${text}`)
    return { deployed: true }
  })

  // Docs: create/update documentation
  one.on('worker:docs', async (d) => {
    const { text, file, line } = d as Todo

    if (!complete) {
      return { pending: true }
    }

    const ctx = one.getContext('DSL', 'dictionary')
    const content = await complete(
      `
${ctx}

---

Write documentation for: ${text}

Be concise. Use markdown. Include code examples if relevant.
    `.trim(),
    ).catch(() => null)

    if (content) {
      await markDone(file, line)
      return { documented: true }
    }

    return { failed: true }
  })

  // Fix: bug fixes
  one.on('worker:fix', async (d, e) => {
    e('worker:implement', d) // same as implement for now
    return { fixing: true }
  })

  // Complete: log completions, update knowledge
  one.on('complete', async (d) => {
    const { text } = d as { id: string; text: string; result: string }
    console.log(`[DONE] ${text}`)

    // Could save to knowledge base here
    return { logged: true }
  })

  // Know: harden patterns from completions
  one.on('know', async () => {
    const highways = one.highways(20)

    // Find patterns worth documenting
    const patterns = highways.filter((h) => h.strength > 10).map((h) => h.path)

    if (patterns.length > 0) {
      const content = `# Learned Patterns\n\n${patterns.map((p) => `- ${p}`).join('\n')}\n`
      await appendToDoc(join(folder, 'LEARNED.md'), content)
    }

    return { patterns: patterns.length }
  })

  // Fade: decay weights
  one.on('fade', () => {
    one.fade(0.02)
    return { faded: true }
  })

  // ── Timers ────────────────────────────────────────────────
  one.timer('scan', 60_000) // scan every minute
  one.timer('know', 3_600_000) // harden every hour
  one.timer('fade', 300_000) // decay every 5 min

  // ── Watch folder for changes ──────────────────────────────
  if (watchFolder) {
    const watcher = watch(folder, { recursive: true })
    ;(async () => {
      for await (const event of watcher) {
        if (event.filename?.endsWith('.md')) {
          await loadDocs()
          one.emit('scan', { trigger: 'watch' })
        }
      }
    })()
  }

  // ── Initial scan ──────────────────────────────────────────
  one.emit('scan', { trigger: 'boot' })

  // ── Run ───────────────────────────────────────────────────
  const stop = one.run(interval)

  return {
    one,
    stop,
    scan: () => one.emit('scan', { trigger: 'manual' }),
    stats: () => one.stats(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

/*
Usage:

import { bootstrap } from './bootstrap'

const system = await bootstrap({
  folder: './docs',
  complete: async (prompt) => llm.complete(prompt),
  interval: 100,
  watch: true,
})

// Or run directly:
// bun src/engine/bootstrap.ts ./docs
*/

if (import.meta.main) {
  const folder = process.argv[2] || './docs'
  console.log(`Bootstrapping from ${folder}...`)

  bootstrap({
    folder,
    interval: 1000,
    watch: true,
  }).then(({ stats }) => {
    setInterval(() => {
      const s = stats()
      console.log(`Cycle ${s.cycle} | Queue ${s.queue} | Handlers ${s.handlers} | Paths ${s.paths}`)
    }, 10000)
  })
}
