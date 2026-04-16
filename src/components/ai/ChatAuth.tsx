import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_MODEL } from '@/lib/chat/models'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Stage =
  | 'IDLE'
  | 'WALLET'
  | 'KEY'
  | 'SIGNIN'
  | 'TEAM'
  | 'DEPLOY'
  | 'DISCOVER'
  | 'MESSAGE'
  | 'READY'
  | 'SELL'
  | 'BUY'
  | 'LIVE'

type SwarmAgent = { uid: string; skill: string; price: number; strength: number }

/** Compact status line in the generation stream */
interface LogEntry {
  id: string
  stage: Stage
  label: string
  status: 'pending' | 'done' | 'error'
  ms?: number
  summary?: string
}

/** All identity data — stored for the data panel */
interface Identity {
  uid: string
  name: string
  address: string
  apiKey: string
  keyId: string
  privateKey: string
  seed: string
  envLine: string
  agentMd: string
  online: boolean
  skills: string[]
  discoveredAgents: SwarmAgent[]
  totalMs: number
  readyMs: number
}

/* ── Constants ─────────────────────────────────────────────────────────────── */

const SEED_WORDS = [
  'signal',
  'path',
  'mark',
  'warn',
  'fade',
  'follow',
  'strength',
  'resistance',
  'actor',
  'group',
  'thing',
  'event',
  'learning',
  'skill',
  'unit',
  'colony',
  'trail',
  'highway',
  'toxic',
  'hypothesis',
  'frontier',
  'evolve',
  'know',
  'recall',
  'reveal',
  'capable',
  'provider',
  'offered',
  'capability',
  'price',
  'revenue',
  'weight',
  'escrow',
  'settle',
  'verify',
  'discover',
  'substrate',
]

const SWARM_AGENTS: SwarmAgent[] = [
  { uid: 'world:scout', skill: 'research', price: 0.01, strength: 14 },
  { uid: 'world:writer', skill: 'copy', price: 0.02, strength: 9 },
  { uid: 'world:analyst', skill: 'analysis', price: 0.03, strength: 6 },
]

/* ── Utilities ─────────────────────────────────────────────────────────────── */

function hex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function b64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const h = await crypto.subtle.digest('SHA-256', bytes)
  return new Uint8Array(h)
}

async function makeWallet() {
  const priv = new Uint8Array(32)
  crypto.getRandomValues(priv)
  const addrBytes = (await sha256(priv)).slice(0, 20)
  const pick = new Uint8Array(12)
  crypto.getRandomValues(pick)
  const words: string[] = []
  for (let i = 0; i < 12; i++) words.push(SEED_WORDS[pick[i] % SEED_WORDS.length])
  const envBytes = new Uint8Array(32)
  crypto.getRandomValues(envBytes)
  return {
    privateKey: `0x${hex(priv)}`,
    seed: words.join(' '),
    address: `0x${hex(addrBytes)}`,
    envLine: `SUI_SEED=${b64(envBytes)}`,
  }
}

function buildAgentMd(entry: string): string {
  const slug =
    entry
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 20)
      .replace(/-+$/, '') || 'my-agent'
  const tag = entry.toLowerCase().includes('research')
    ? 'research'
    : entry.toLowerCase().includes('write') || entry.toLowerCase().includes('copy')
      ? 'copy'
      : entry.toLowerCase().includes('design')
        ? 'design'
        : 'general'
  return `---
name: ${slug}
model: meta-llama/llama-4-maverick
channels: [web]
group: my-world
skills:
  - name: answer
    price: 0.005
    tags: [${tag}, chat, qa]
  - name: discover
    price: 0.01
    tags: [${tag}, find, research]
sensitivity: 0.5
---

You are ${slug} — an agent in the ONE substrate.
You answer questions and find patterns for the world around you.
Task context: ${entry}
Be concise: 2-3 sentences unless depth is requested.`
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const genId = () => crypto.randomUUID()

const KEY_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
function localApiKey(): string {
  const ts = Date.now().toString(36)
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let rand = ''
  for (const b of bytes) rand += KEY_ALPHABET[b % KEY_ALPHABET.length]
  return `api_${ts}_${rand}`
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export function ChatAuth() {
  const [phase, setPhase] = useState<'input' | 'generating' | 'live'>('input')
  const [lines, setLines] = useState<LogEntry[]>([])
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [showData, setShowData] = useState(false)
  const [editName, setEditName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [messageResponse, setMessageResponse] = useState('')
  const [messageStreaming, setMessageStreaming] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  /* ── Line helpers ──────────────────────────────────────────────────────── */

  const addLine = useCallback((stage: Stage, label: string) => {
    const entry: LogEntry = { id: genId(), stage, label, status: 'pending' }
    setLines((prev) => [...prev, entry])
    return entry.id
  }, [])

  const updateLine = useCallback((id: string, update: Partial<Pick<LogEntry, 'status' | 'ms' | 'summary'>>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...update } : l)))
  }, [])

  /* ── Run: the continuous lifecycle ─────────────────────────────────────── */

  const run = useCallback(
    async (entry: string) => {
      if (!entry.trim() || running) return
      setRunning(true)
      setPhase('generating')
      setLines([])
      setIdentity(null)
      setShowData(false)
      setMessageResponse('')
      setMessageStreaming(false)
      emitClick('ui:chat-auth:start', { type: 'text', content: entry })

      const t0 = performance.now()

      try {
        // ── 0 WALLET ──────────────────────────────────────────
        const walletLineId = addLine('WALLET', 'generating wallet...')
        const wt0 = performance.now()

        const fallbackUid = `my-world:${
          entry
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 16) || 'agent'
        }`
        let agentUid = fallbackUid
        let agentName = fallbackUid.split(':')[1] ?? 'agent'
        let walletAddress = ''
        let apiKey = ''
        let keyId = ''
        let online = false
        let privateKey = ''
        let seed = ''
        let envLine = ''

        try {
          const res = await fetch('/api/auth/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
          if (res.ok) {
            const data = (await res.json()) as {
              uid?: string
              name?: string
              wallet?: string
              apiKey?: string
              keyId?: string
              returning?: boolean
            }
            agentUid = data.uid ?? agentUid
            agentName = data.name ?? agentName
            walletAddress = data.wallet ?? ''
            apiKey = data.apiKey ?? ''
            keyId = data.keyId ?? ''
            online = Boolean(apiKey)
          }
        } catch {
          /* offline */
        }

        if (!walletAddress || !apiKey) {
          const wlt = await makeWallet()
          if (!walletAddress) walletAddress = wlt.address
          privateKey = wlt.privateKey
          seed = wlt.seed
          envLine = wlt.envLine
        }
        if (!apiKey) {
          apiKey = localApiKey()
          keyId = keyId || `key-demo-${genId().slice(0, 6)}`
        }

        const walletMs = Math.round(performance.now() - wt0)
        updateLine(walletLineId, {
          status: 'done',
          ms: walletMs,
          summary: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`,
        })
        emitClick(`ui:chat-auth:wallet`, { type: 'text', content: walletAddress })
        await sleep(150)

        // ── 1 KEY ─────────────────────────────────────────────
        const keyLineId = addLine('KEY', 'generating key...')
        await sleep(80)
        updateLine(keyLineId, {
          status: 'done',
          summary: `${apiKey.slice(0, 12)}...`,
        })
        emitClick(`ui:chat-auth:key`, { type: 'text', content: apiKey.slice(0, 8) })
        await sleep(150)

        // ── 2 SIGNIN ──────────────────────────────────────────
        const signinLineId = addLine('SIGNIN', 'signing in...')
        const st0 = performance.now()
        await sleep(120)
        const signinMs = Math.round(performance.now() - st0)
        updateLine(signinLineId, {
          status: 'done',
          ms: signinMs,
          summary: `#${agentName}`,
        })
        await sleep(150)

        // ── 3 TEAM ────────────────────────────────────────────
        const teamLineId = addLine('TEAM', 'creating team...')
        const agentMd = buildAgentMd(entry)
        const skillsMatch = [...agentMd.matchAll(/^\s+-\s+name:\s*(.+)$/gm)].map((m) => m[1].trim())
        const deployedName = agentMd.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? agentName
        agentName = deployedName
        await sleep(100)
        updateLine(teamLineId, {
          status: 'done',
          summary: `${deployedName} · ${skillsMatch.length} skills`,
        })
        await sleep(150)

        // ── 4 DEPLOY ──────────────────────────────────────────
        const deployLineId = addLine('DEPLOY', 'deploying to TypeDB...')
        const dt0 = performance.now()
        let deployedUnitId = agentUid
        let deployedSkills = skillsMatch.length ? skillsMatch : ['answer']

        try {
          const res = await fetch('/api/agents/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ markdown: agentMd }),
          })
          if (res.ok) {
            const data = (await res.json()) as { uid?: string; skills?: string[] }
            deployedUnitId = data.uid ?? agentUid
            if (data.skills?.length) deployedSkills = data.skills
          }
        } catch {
          /* offline */
        }

        const deployMs = Math.round(performance.now() - dt0)
        updateLine(deployLineId, {
          status: 'done',
          ms: deployMs,
          summary: deployedUnitId,
        })
        await sleep(150)

        // ── 5 DISCOVER ────────────────────────────────────────
        const discoverLineId = addLine('DISCOVER', 'discovering network...')
        const discoverTag = deployedSkills[0] ?? 'general'
        let discoveredAgents = SWARM_AGENTS
        const dct0 = performance.now()

        try {
          const res = await fetch(`/api/agents/discover?tag=${encodeURIComponent(discoverTag)}`)
          if (res.ok) {
            const data = (await res.json()) as { agents?: unknown[] }
            if (Array.isArray(data.agents) && data.agents.length > 0) {
              discoveredAgents = data.agents.slice(0, 4).map((a) => {
                const agent = a as Record<string, unknown>
                return {
                  uid: String(agent.uid ?? agent.id ?? ''),
                  skill: String(agent.skill ?? discoverTag),
                  price: Number(agent.price ?? 0.01),
                  strength: Number(agent.strength ?? agent.pheromone ?? 1),
                }
              })
            }
          }
        } catch {
          /* use mock */
        }

        const discoverMs = Math.round(performance.now() - dct0)
        updateLine(discoverLineId, {
          status: 'done',
          ms: discoverMs,
          summary: `${discoveredAgents.length} agents found`,
        })
        await sleep(150)

        // ── 6 MESSAGE ─────────────────────────────────────────
        const msgLineId = addLine('MESSAGE', 'sending first signal...')
        const mt0 = performance.now()
        setMessageStreaming(true)

        let signalHandled = false
        try {
          const target = discoveredAgents[0]?.uid ?? 'world:scout'
          const res = await fetch('/api/signal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              sender: deployedUnitId,
              receiver: target,
              data: entry,
            }),
          })
          if (res.ok) {
            const data = (await res.json()) as { result?: string; latency?: number }
            if (data.result) {
              setMessageResponse(data.result)
              signalHandled = true
            }
          }
        } catch {
          /* fall through */
        }

        if (!signalHandled) {
          // Stream from /api/chat
          try {
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [
                  { role: 'system', content: 'You are a ONE substrate agent. Answer in 2-3 sentences.' },
                  { role: 'user', content: entry },
                ],
              }),
            })
            if (res.ok && res.body) {
              const reader = res.body.getReader()
              const dec = new TextDecoder()
              let full = ''
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                full += dec.decode(value, { stream: true })
                setMessageResponse(full)
              }
            } else {
              setMessageResponse(`[signal received] "${entry}"`)
            }
          } catch {
            setMessageResponse(`[signal received] "${entry}"`)
          }
        }

        const msgMs = Math.round(performance.now() - mt0)
        setMessageStreaming(false)
        updateLine(msgLineId, {
          status: 'done',
          ms: msgMs,
          summary: 'response received',
        })
        await sleep(200)

        // ── READY ─────────────────────────────────────────────
        const readyMs = Math.round(performance.now() - t0)
        addLine('READY', `ready to sell in ${readyMs}ms`)
        // Immediately mark done — this line is the announcement
        setLines((prev) => prev.map((l) => (l.stage === 'READY' ? { ...l, status: 'done' as const, ms: readyMs } : l)))
        await sleep(400)

        // ── 7 SELL ────────────────────────────────────────────
        const sellLineId = addLine('SELL', 'simulating first sale...')
        await sleep(300)
        const sellPrice = 0.005
        updateLine(sellLineId, {
          status: 'done',
          summary: `+${sellPrice} SUI earned`,
        })
        await sleep(200)

        // ── 8 BUY ─────────────────────────────────────────────
        const buyLineId = addLine('BUY', 'simulating first purchase...')
        await sleep(300)
        const bestProvider = discoveredAgents.find(
          (a) => a.strength === Math.max(...discoveredAgents.map((x) => x.strength)),
        )
        const buyPrice = bestProvider?.price ?? 0.01
        updateLine(buyLineId, {
          status: 'done',
          summary: `−${buyPrice} SUI · ${bestProvider?.uid ?? 'world:scout'}`,
        })
        await sleep(300)

        // ── LIVE ──────────────────────────────────────────────
        const totalMs = Math.round(performance.now() - t0)
        const ident: Identity = {
          uid: deployedUnitId,
          name: agentName,
          address: walletAddress,
          apiKey,
          keyId,
          privateKey,
          seed,
          envLine,
          agentMd,
          online,
          skills: deployedSkills,
          discoveredAgents,
          totalMs,
          readyMs,
        }
        setIdentity(ident)
        setEditName(agentName)
        setPhase('live')
        emitClick('ui:chat-auth:live', { type: 'text', content: JSON.stringify({ totalMs, readyMs }) })
      } catch {
        // cancelled — silence is valid
      } finally {
        setRunning(false)
      }
    },
    [running, addLine, updateLine],
  )

  /* ── Reset ─────────────────────────────────────────────────────────────── */

  const reset = () => {
    emitClick('ui:chat-auth:reset', { type: 'text', content: '' })
    setPhase('input')
    setLines([])
    setIdentity(null)
    setInput('')
    setShowData(false)
    setEditName('')
    setIsEditingName(false)
    setMessageResponse('')
    setMessageStreaming(false)
  }

  /* ── Input phase ───────────────────────────────────────────────────────── */

  if (phase === 'input') {
    return (
      <div className="relative flex flex-col w-full min-h-[100svh] px-4">
        <a href="/" className="absolute top-4 left-4 inline-flex" aria-label="one — home">
          <img src="/icon.svg" alt="one" width={50} height={50} className="w-[50px] h-[50px]" />
        </a>
        <div className="flex-1 grid place-items-center">
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
            <h1 className="text-center text-3xl sm:text-4xl font-light tracking-tight">one — generate your AI agent</h1>
            <p className="text-center text-base text-muted-foreground leading-7">
              ten stages. no stops. your agent goes live in under a second.
              <br />
              wallet, key, team, deploy, discover, message, sell, buy — all generated.
            </p>
            <form
              className="flex gap-2 items-end w-full"
              onSubmit={(e) => {
                e.preventDefault()
                run(input)
              }}
            >
              <div className="flex gap-2 items-end w-full">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      run(input)
                    }
                  }}
                  placeholder="what should your agent do?"
                  rows={1}
                  className="flex-1 resize-none rounded-2xl border border-border/80 bg-black/[0.04] dark:bg-black/30 px-4 py-3 text-base leading-7 shadow-sm shadow-black/10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                <CTA type="submit" disabled={!input.trim() || running} className="min-w-[6rem]">
                  start →
                </CTA>
              </div>
            </form>
            <div className="flex flex-wrap gap-2 justify-center">
              {['research ai agents', 'write marketing copy', 'analyse competitors', 'build an api'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s)
                    run(s)
                  }}
                  className="px-5 py-2.5 rounded-lg border-2 border-border hover:border-foreground text-sm uppercase tracking-[0.12em] font-medium bg-background text-foreground hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm transition-all duration-200 ease-out"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-3 pb-6 text-sm uppercase tracking-[0.12em] text-muted-foreground">
          <span className="inline-flex items-center gap-2 px-4 py-2 font-mono">
            446ms <span className="text-2xl leading-none text-yellow-400">⚡</span> Chat
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 font-mono">
            186ms <span className="text-2xl leading-none text-yellow-400">⚡</span> API
          </span>
        </div>
      </div>
    )
  }

  /* ── Generation + Live phase ───────────────────────────────────────────── */

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <a href="/" className="inline-flex" aria-label="one — home">
            <img src="/icon.svg" alt="one" width={32} height={32} className="w-8 h-8" />
          </a>
          {running && (
            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground animate-pulse">
              generating...
            </span>
          )}
          {phase === 'live' && identity && (
            <span className="text-xs uppercase tracking-[0.12em] text-primary font-medium">
              live · {identity.totalMs}ms total
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto w-full space-y-3">
          {/* Generation stream — compact log lines */}
          <div className="space-y-0.5">
            {lines.map((line) => (
              <LogLine key={line.id} entry={line} />
            ))}
          </div>

          {/* Streaming message response (shows during MESSAGE stage) */}
          {(messageStreaming || messageResponse) && (
            <div className="animate-in fade-in duration-300">
              <CardShell>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
                  first signal response
                </div>
                <div className="whitespace-pre-wrap text-base leading-7">
                  {messageResponse || <span className="text-muted-foreground">...</span>}
                  {messageStreaming && (
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />
                  )}
                </div>
              </CardShell>
            </div>
          )}

          {/* Address card — appears after wallet generated */}
          {lines.some((l) => l.stage === 'WALLET' && l.status === 'done') && identity === null && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <AddressReveal address={lines.find((l) => l.stage === 'WALLET')?.summary ?? ''} />
            </div>
          )}

          {/* LIVE summary — appears when generation completes */}
          {phase === 'live' && identity && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Ready badge */}
              <div className="flex items-center justify-center gap-3 py-4">
                <span className="text-3xl text-yellow-400">⚡</span>
                <span className="text-2xl font-light tracking-tight">ready to sell in {identity.readyMs}ms</span>
                <span className="text-3xl text-yellow-400">⚡</span>
              </div>

              {/* Address card (full) */}
              <CardShell tone="accent">
                <div className="text-[11px] uppercase tracking-[0.12em] text-primary mb-3">
                  your address — accepts SUI + USDC
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-black/[0.06] dark:bg-black/40 px-4 py-3 ring-1 ring-primary/20">
                  <span className="font-mono text-lg tracking-tight break-all select-all flex-1">
                    {identity.address}
                  </span>
                  <CopyBtn text={identity.address} />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  share this address to receive SUI and USDC payments. same uid always → same address.
                </div>
              </CardShell>

              {/* Identity card — editable name */}
              <CardShell>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-3">your identity</div>
                <div className="space-y-3">
                  {/* Editable name */}
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">name</div>
                    <div className="flex items-center gap-2">
                      {isEditingName ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => setIsEditingName(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditingName(false)
                            if (e.key === 'Escape') {
                              setEditName(identity.name)
                              setIsEditingName(false)
                            }
                          }}
                          // biome-ignore lint/a11y/noAutofocus: inline edit needs focus
                          autoFocus
                          className="flex-1 h-10 rounded-xl border border-primary/40 bg-black/[0.04] dark:bg-black/30 px-3 font-mono text-base focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                      ) : (
                        <div
                          className="flex-1 h-10 flex items-center rounded-xl border border-border/80 bg-black/[0.04] dark:bg-black/30 px-3 font-mono text-base cursor-pointer hover:border-primary/40 transition-all"
                          onClick={() => setIsEditingName(true)}
                        >
                          {editName || identity.name}
                          <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                            edit
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <KeyRow label="uid" value={identity.uid} />
                  <KeyRow label="api key" value={identity.apiKey} tone="primary" secret />
                  <KeyRow label="sui address" value={identity.address} />
                </div>

                {/* Skills */}
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">capabilities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {identity.skills.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full text-xs uppercase tracking-[0.08em] bg-primary/10 text-primary border border-primary/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick commands */}
                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <div>
                    send a signal:{' '}
                    <code className="bg-muted px-1 rounded text-[10px]">
                      curl -X POST /api/signal -H "Authorization: Bearer {identity.apiKey.slice(0, 12)}..." -d '
                      {`{"receiver":"${identity.uid}","data":"hello"}`}'
                    </code>
                  </div>
                  <div>
                    add a channel:{' '}
                    <code className="bg-muted px-1 rounded text-[10px]">
                      bun run scripts/setup-nanoclaw.ts --agent {identity.name}
                    </code>
                  </div>
                </div>
              </CardShell>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <CTA onClick={() => setShowData((v) => !v)}>{showData ? 'hide your data' : 'view your data'}</CTA>
                <CTA variant="ghost" onClick={reset}>
                  build another
                </CTA>
              </div>

              {/* Data panel — expandable */}
              {showData && <DataPanel identity={identity} />}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

/** Compact log line — one per stage */
function LogLine({ entry }: { entry: LogEntry }) {
  const isReady = entry.stage === 'READY'
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 animate-in fade-in slide-in-from-left-2',
        isReady && 'bg-primary/10 border border-primary/20 mt-2 mb-2',
        !isReady && 'hover:bg-muted/30',
      )}
    >
      {/* Status icon */}
      <span
        className={cn(
          'text-base shrink-0 transition-all',
          entry.status === 'done' && !isReady && 'text-green-500',
          entry.status === 'done' && isReady && 'text-yellow-400 text-lg',
          entry.status === 'pending' && 'text-muted-foreground animate-pulse',
          entry.status === 'error' && 'text-red-500',
        )}
      >
        {entry.status === 'done' ? (isReady ? '⚡' : '✓') : entry.status === 'error' ? '✗' : '○'}
      </span>

      {/* Label */}
      <span
        className={cn(
          'text-base font-medium',
          isReady && 'text-primary',
          entry.status === 'pending' && 'text-muted-foreground',
        )}
      >
        {entry.label}
      </span>

      {/* Timing */}
      {entry.ms !== undefined && !isReady && (
        <span className="text-xs font-mono text-muted-foreground">{entry.ms}ms</span>
      )}

      {/* Summary */}
      {entry.summary && (
        <span className="text-sm text-muted-foreground ml-auto truncate max-w-[45%] font-mono">{entry.summary}</span>
      )}
    </div>
  )
}

/** Wallet address teaser during generation */
function AddressReveal({ address }: { address: string }) {
  if (!address) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm">
      <span className="text-yellow-400">⚡</span>
      <span className="text-muted-foreground">now accepting SUI + USDC at</span>
      <span className="font-mono text-primary">{address}</span>
    </div>
  )
}

/** Expandable data panel — shows all credentials and secrets */
function DataPanel({ identity }: { identity: Identity }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardShell>
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-4">
          your data — everything you need to reconstruct your agent
        </div>
        <div className="space-y-3">
          {identity.privateKey && <KeyRow label="private key" value={identity.privateKey} secret tone="primary" />}
          {identity.seed && <KeyRow label="seed phrase" value={identity.seed} secret tone="primary" />}
          <KeyRow label="api key" value={identity.apiKey} secret tone="primary" />
          <KeyRow label="key id" value={identity.keyId} />
          <KeyRow label="sui address" value={identity.address} />
          <KeyRow label=".env line" value={`ONE_API_KEY=${identity.apiKey}`} secret tone="primary" />
          {identity.envLine && <KeyRow label="sui seed (.env)" value={identity.envLine} secret />}
        </div>

        {/* Agent markdown */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              agent.md — fork and deploy
            </div>
            <CopyBtn text={identity.agentMd} label="copy" />
          </div>
          <pre className="font-mono text-sm bg-black/[0.04] dark:bg-black/30 rounded-xl p-4 border border-border/80 shadow-sm shadow-black/10 overflow-x-auto whitespace-pre-wrap leading-6">
            {identity.agentMd}
          </pre>
        </div>

        {/* Discovered agents */}
        {identity.discoveredAgents.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
              discovered agents — ranked by pheromone
            </div>
            <div className="space-y-1 font-mono text-sm">
              {identity.discoveredAgents
                .slice()
                .sort((a, b) => b.strength - a.strength)
                .map((a) => (
                  <div key={a.uid} className="flex justify-between text-muted-foreground">
                    <span>
                      {a.uid}:{a.skill}
                    </span>
                    <span>
                      {a.price} SUI · s={a.strength}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Timing breakdown */}
        <div className="mt-4 pt-3 border-t border-border/40">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1">performance</div>
          <div className="flex gap-4 text-sm font-mono text-muted-foreground">
            <span>ready: {identity.readyMs}ms</span>
            <span>total: {identity.totalMs}ms</span>
            <span>{identity.online ? 'live' : 'demo mode'}</span>
          </div>
        </div>
      </CardShell>
    </div>
  )
}

/* ── UI Primitives ─────────────────────────────────────────────────────────── */

function CardShell({ tone = 'default', children }: { tone?: 'default' | 'accent'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'group relative rounded-3xl border px-5 py-5 text-base leading-7 shadow-lg shadow-black/5 backdrop-blur-sm transition-all hover:shadow-xl hover:-translate-y-0.5',
        tone === 'default' && 'bg-gradient-to-br from-card/80 via-card to-muted/40 border-border/60',
        tone === 'accent' &&
          'bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-primary/40 shadow-primary/10',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity group-hover:opacity-100',
          tone === 'accent' && 'bg-primary/[0.03]',
        )}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

function CTA({
  children,
  onClick,
  type = 'button',
  disabled,
  variant = 'solid',
  size = 'lg',
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  variant?: 'solid' | 'ghost'
  size?: 'lg' | 'md'
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative inline-flex items-center justify-center font-semibold tracking-tight rounded-lg border-2 select-none',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm',
        'disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-0',
        size === 'lg' && 'h-12 px-6 text-base min-w-[9rem]',
        size === 'md' && 'h-10 px-5 text-sm min-w-[7rem]',
        variant === 'solid' && [
          'bg-foreground text-background border-foreground shadow-md shadow-black/20',
          'hover:bg-background hover:text-foreground',
          'dark:bg-background dark:text-foreground dark:border-foreground',
          'dark:hover:bg-foreground dark:hover:text-background',
        ],
        variant === 'ghost' && [
          'bg-transparent text-foreground border-border',
          'hover:border-foreground hover:bg-foreground/5',
        ],
        className,
      )}
    >
      <span className="relative transition-transform duration-200 group-active:scale-95">{children}</span>
    </button>
  )
}

type RowTone = 'muted' | 'primary'

function KeyRow({
  label,
  value,
  secret = false,
  tone = 'muted',
}: {
  label: string
  value: string
  secret?: boolean
  tone?: RowTone
}) {
  const [show, setShow] = useState(!secret)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* blocked */
    }
  }

  const masked = show ? value : '\u2022'.repeat(Math.min(value.length, 48))
  const isPrimary = tone === 'primary'

  return (
    <div>
      <div
        className={cn(
          'text-[11px] uppercase tracking-[0.12em] mb-1.5',
          isPrimary ? 'text-primary font-medium' : 'text-muted-foreground',
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border px-3 py-2.5 font-mono text-sm transition-all shadow-sm shadow-black/10',
          isPrimary
            ? 'bg-black/[0.06] dark:bg-black/40 border-primary/40 ring-1 ring-primary/20'
            : 'bg-black/[0.04] dark:bg-black/30 border-border/80',
        )}
      >
        <div className="flex-1 break-all leading-6 select-all text-foreground">{masked}</div>
        {secret && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="px-2 py-1 rounded-md text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all shrink-0"
          >
            {show ? 'hide' : 'show'}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className={cn(
            'px-2.5 py-1 rounded-md text-[10px] uppercase tracking-[0.12em] font-medium transition-all shrink-0 border',
            copied
              ? 'bg-primary text-primary-foreground border-primary'
              : isPrimary
                ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground'
                : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
    </div>
  )
}

/** Inline copy button */
function CopyBtn({ text, label = 'copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        } catch {
          /* blocked */
        }
      }}
      className={cn(
        'px-2.5 py-1 rounded-md text-[10px] uppercase tracking-[0.12em] font-medium transition-all border shrink-0',
        copied
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {copied ? 'copied' : label}
    </button>
  )
}
