import { useState } from 'react'

type Tab = 'rest' | 'sdk' | 'cli'

const snippets: Record<Tab, string> = {
  rest: `curl -X POST https://one.ie/api/signal \\
  -H "Authorization: Bearer $ONE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "receiver": "tutor",
    "data": { "content": "Explain pheromone routing" }
  }'`,
  sdk: `import { SubstrateClient } from "@oneie/sdk"

const sdk = new SubstrateClient({
  apiKey: process.env.ONE_API_KEY,
})

const { result } = await sdk.ask({
  receiver: "tutor",
  data: { content: "Explain pheromone routing" },
})

console.log(result)`,
  cli: `# One-time setup
npm i -g oneie
oneie login

# Send your first signal
oneie ask tutor "Explain pheromone routing"
# → streams result, marks path on success`,
}

const tabLabels: Record<Tab, string> = {
  rest: 'REST (curl)',
  sdk: 'TypeScript SDK',
  cli: 'CLI',
}

export function QuickstartIsland() {
  const [tab, setTab] = useState<Tab>('sdk')
  const [copied, setCopied] = useState(false)
  const [receiver, setReceiver] = useState('one')
  const [content, setContent] = useState('What is ONE?')
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = async () => {
    await navigator.clipboard.writeText(snippets[tab])
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const tryIt = async () => {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiver,
          data: { tags: ['quickstart', 'try-it'], content },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setResult(JSON.stringify(json, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Step 1: Get a key */}
      <section className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-black font-bold text-sm">
            1
          </span>
          <h2 className="text-xl font-semibold text-white">Get an API key</h2>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          Sign up and grab a key. Free tier is 10K signals/mo — no credit card.
        </p>
        <div className="flex gap-3">
          <a
            href="/signup"
            className="px-4 py-2 bg-emerald-500 text-black font-semibold rounded-md hover:bg-emerald-400 text-sm"
          >
            Sign up →
          </a>
          <a
            href="/settings/keys"
            className="px-4 py-2 border border-zinc-700 text-white rounded-md hover:border-zinc-500 text-sm"
          >
            Manage existing keys
          </a>
        </div>
      </section>

      {/* Step 2: Copy-paste code */}
      <section className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-black font-bold text-sm">
            2
          </span>
          <h2 className="text-xl font-semibold text-white">Send your first signal</h2>
        </div>

        <div className="flex gap-2 mb-3 border-b border-zinc-800">
          {(Object.keys(tabLabels) as Tab[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-3 py-2 text-sm font-mono border-b-2 transition-colors ${
                tab === k
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tabLabels[k]}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={copy}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
          >
            {copied ? '✓ copied' : 'copy'}
          </button>
          <pre className="bg-black/60 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 font-mono leading-relaxed overflow-x-auto">
            {snippets[tab]}
          </pre>
        </div>
      </section>

      {/* Step 3: Try it live */}
      <section className="border border-emerald-800/50 rounded-lg p-6 bg-emerald-950/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-black font-bold text-sm">
            3
          </span>
          <h2 className="text-xl font-semibold text-white">Try it live (uses your session)</h2>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          If you're signed in, this hits <code className="text-emerald-300">/api/signal</code> with your session
          cookie. No key needed in the browser.
        </p>

        <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto] mb-4">
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            placeholder="receiver"
            className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-md text-white text-sm font-mono focus:border-emerald-500 outline-none"
          />
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="content"
            className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-md text-white text-sm focus:border-emerald-500 outline-none"
          />
          <button
            type="button"
            onClick={tryIt}
            disabled={busy || !receiver || !content}
            className="px-5 py-2 bg-emerald-500 text-black font-semibold rounded-md hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {busy ? 'sending…' : 'Send signal →'}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-800/60 bg-red-950/30 p-3 text-sm text-red-300 font-mono">
            {error}
          </div>
        )}
        {result && (
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">Response</p>
            <pre className="bg-black/60 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 font-mono overflow-x-auto">
              {result}
            </pre>
          </div>
        )}
      </section>

      {/* Step 4: Next */}
      <section className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-black font-bold text-sm">
            4
          </span>
          <h2 className="text-xl font-semibold text-white">Where next?</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <a href="/dashboard" className="border border-zinc-800 rounded-md p-4 hover:border-emerald-500/50 block">
            <p className="text-emerald-300 font-semibold text-sm mb-1">→ Dashboard</p>
            <p className="text-xs text-zinc-400">See your calls, agents, and tier usage</p>
          </a>
          <a href="/market" className="border border-zinc-800 rounded-md p-4 hover:border-emerald-500/50 block">
            <p className="text-emerald-300 font-semibold text-sm mb-1">→ Marketplace</p>
            <p className="text-xs text-zinc-400">Browse capabilities you can call</p>
          </a>
          <a href="/platform" className="border border-zinc-800 rounded-md p-4 hover:border-emerald-500/50 block">
            <p className="text-emerald-300 font-semibold text-sm mb-1">→ Platform modes</p>
            <p className="text-xs text-zinc-400">Standalone, +World, +Chain, +Agents</p>
          </a>
        </div>
      </section>
    </div>
  )
}
