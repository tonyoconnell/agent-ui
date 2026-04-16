import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_MODEL } from '@/lib/chat/models'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

type Stage =
  | 'INTRO'
  | 'WALLET'
  | 'KEY'
  | 'SIGNIN'
  | 'TEAM'
  | 'DEPLOY'
  | 'DISCOVER'
  | 'MESSAGE'
  | 'CONVERSE'
  | 'SELL'
  | 'BUY'
  | 'DONE'

const STAGE_ORDER: Stage[] = [
  'INTRO',
  'WALLET',
  'KEY',
  'SIGNIN',
  'TEAM',
  'DEPLOY',
  'DISCOVER',
  'MESSAGE',
  'CONVERSE',
  'SELL',
  'BUY',
  'DONE',
]

type ConvMsg = { role: 'user' | 'assistant'; content: string; streaming?: boolean }
type SwarmAgent = { uid: string; skill: string; price: number; strength: number }

type Card =
  | { id: string; stage: 'INTRO'; entry: string }
  | {
      id: string
      stage: 'WALLET'
      uid: string
      name: string
      address: string
      latencyMs: number
      online: boolean
      returning: boolean
    }
  | {
      id: string
      stage: 'KEY'
      apiKey: string
      keyId: string
      address: string
      online: boolean
      copied: boolean
      decided: 'pending' | 'continue'
    }
  | { id: string; stage: 'SIGNIN'; sessionId: string; latencyMs: number }
  | { id: string; stage: 'TEAM'; markdown: string; decided: 'pending' | 'deploy' }
  | { id: string; stage: 'DEPLOY'; agentName: string; unitId: string; skills: string[]; latencyMs: number }
  | { id: string; stage: 'DISCOVER'; tag: string; agents: SwarmAgent[] }
  | { id: string; stage: 'MESSAGE'; prompt: string; response: string; streaming: boolean; latencyMs: number | null }
  | { id: string; stage: 'CONVERSE'; messages: ConvMsg[]; streaming: boolean; decided: 'pending' | 'continue' }
  | { id: string; stage: 'SELL'; skill: string; price: number; firstBuyer: string; strength: number }
  | { id: string; stage: 'BUY'; provider: string; paid: number; txHash: string; before: number; after: number }
  | { id: string; stage: 'DONE'; uid: string; address: string; apiKey: string; agentMd: string }

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
const uid = () => crypto.randomUUID()

// Mirrors src/lib/api-key.ts format — used only when /api/auth/agent is unreachable.
// Same shape (api_<ts-base36>_<32rand>) so the UI / copy-paste paths are identical.
const KEY_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
function localApiKey(): string {
  const ts = Date.now().toString(36)
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let rand = ''
  for (const b of bytes) rand += KEY_ALPHABET[b % KEY_ALPHABET.length]
  return `api_${ts}_${rand}`
}

export function ChatAuth() {
  const [cards, setCards] = useState<Card[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState<Stage>('INTRO')
  const pauseRef = useRef<{ resolve: () => void; reject: () => void } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const apiKeyRef = useRef<string>('')
  const agentUidRef = useRef<string>('')
  const agentAddressRef = useRef<string>('')

  const hasCards = cards.length > 0

  useEffect(() => {
    if (hasCards) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [cards])

  const transition = useCallback((s: Stage, meta?: Record<string, unknown>) => {
    setStage(s)
    emitClick(`ui:chat-auth:${s.toLowerCase()}`, { type: 'text', content: JSON.stringify(meta ?? {}) })
  }, [])

  const waitForUser = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        pauseRef.current = { resolve, reject }
      }),
    [],
  )

  const run = useCallback(
    async (entry: string) => {
      if (!entry.trim() || running) return
      setRunning(true)
      setCards([])
      setStage('INTRO')
      emitClick('ui:chat-auth:start', { type: 'text', content: entry })

      try {
        // ── 0 INTRO ──────────────────────────────────────────
        setCards((c) => [...c, { id: uid(), stage: 'INTRO', entry }])
        transition('INTRO', { entry })
        await sleep(700)

        // ── 1 WALLET ─────────────────────────────────────────
        // Real: POST /api/auth/agent {} → {uid, wallet, apiKey}
        transition('WALLET')
        const t0 = performance.now()
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
        let returning = false

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
            returning = Boolean(data.returning)
            online = Boolean(apiKey) // real key came back
          }
        } catch {
          /* offline — fall through to client-side */
        }

        if (!walletAddress) {
          const wlt = await makeWallet()
          walletAddress = wlt.address
        }
        if (!apiKey) {
          // Demo mode: mimic the real api_<ts-base36>_<32rand> format
          apiKey = localApiKey()
          keyId = keyId || `key-demo-${uid().slice(0, 6)}`
        }

        apiKeyRef.current = apiKey
        agentUidRef.current = agentUid
        agentAddressRef.current = walletAddress

        setCards((c) => [
          ...c,
          {
            id: uid(),
            stage: 'WALLET',
            uid: agentUid,
            name: agentName,
            address: walletAddress,
            latencyMs: Math.round(performance.now() - t0),
            online,
            returning,
          },
        ])
        await sleep(800)

        // ── 2 KEY ─────────────────────────────────────────────
        // Show the real apiKey — this is what the user saves
        transition('KEY')
        const keyCardId = uid()
        setCards((c) => [
          ...c,
          {
            id: keyCardId,
            stage: 'KEY',
            apiKey,
            keyId,
            address: walletAddress,
            online,
            copied: false,
            decided: 'pending',
          },
        ])
        await waitForUser() // pause: user must copy the key

        // ── 3 SIGN IN ─────────────────────────────────────────
        // Agent onboarding IS sign-in; show the session confirmation
        transition('SIGNIN')
        const t1 = performance.now()
        await sleep(300)
        setCards((c) => [
          ...c,
          {
            id: uid(),
            stage: 'SIGNIN',
            sessionId: agentUid.slice(0, 12),
            latencyMs: Math.round(performance.now() - t1),
          },
        ])
        await sleep(500)

        // ── 4 TEAM ────────────────────────────────────────────
        transition('TEAM')
        const teamId = uid()
        const defaultMd = buildAgentMd(entry)
        setCards((c) => [...c, { id: teamId, stage: 'TEAM', markdown: defaultMd, decided: 'pending' }])
        await waitForUser() // pause: user edits + deploys

        // read final markdown from card state before leaving
        let finalMd = defaultMd
        setCards((prev) => {
          const card = prev.find((c) => c.id === teamId && c.stage === 'TEAM')
          if (card && card.stage === 'TEAM') finalMd = card.markdown
          return prev
        })
        await sleep(100)

        const deployedName = finalMd.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? agentName
        const skillsMatch = [...finalMd.matchAll(/^\s+-\s+name:\s*(.+)$/gm)].map((m) => m[1].trim())

        // ── 5 DEPLOY ──────────────────────────────────────────
        // Real: POST /api/agents/sync with Bearer token → writes to TypeDB
        transition('DEPLOY')
        const t2 = performance.now()
        let deployedUnitId = agentUid
        let deployedSkills = skillsMatch.length ? skillsMatch : ['answer']

        try {
          const res = await fetch('/api/agents/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ markdown: finalMd }),
          })
          if (res.ok) {
            const data = (await res.json()) as { uid?: string; skills?: string[] }
            deployedUnitId = data.uid ?? agentUid
            if (data.skills?.length) deployedSkills = data.skills
          }
        } catch {
          /* TypeDB offline — show local result */
        }

        setCards((c) => [
          ...c,
          {
            id: uid(),
            stage: 'DEPLOY',
            agentName: deployedName,
            unitId: deployedUnitId,
            skills: deployedSkills,
            latencyMs: Math.round(performance.now() - t2),
          },
        ])
        await sleep(700)

        // ── 6 DISCOVER ────────────────────────────────────────
        // Real: GET /api/agents/discover?tag=X → pheromone-ranked results
        transition('DISCOVER')
        const discoverTag = deployedSkills[0] ?? 'general'
        let discoveredAgents = SWARM_AGENTS

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
          /* use mock swarm */
        }

        setCards((c) => [...c, { id: uid(), stage: 'DISCOVER', tag: discoverTag, agents: discoveredAgents }])
        await sleep(800)

        // ── 7 MESSAGE ─────────────────────────────────────────
        // Real: POST /api/signal → substrate routes + returns result
        transition('MESSAGE')
        const msgId = uid()
        const t3 = performance.now()
        setCards((c) => [
          ...c,
          { id: msgId, stage: 'MESSAGE', prompt: entry, response: '', streaming: true, latencyMs: null },
        ])

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
              const latencyMs = data.latency ?? Math.round(performance.now() - t3)
              setCards((prev) =>
                prev.map((c) =>
                  c.id === msgId && c.stage === 'MESSAGE'
                    ? { ...c, response: data.result!, streaming: false, latencyMs }
                    : c,
                ),
              )
              signalHandled = true
            }
          }
        } catch {
          /* fall through to /api/chat */
        }

        if (!signalHandled) {
          await streamIntoMessage(msgId, entry, setCards, t3)
        }
        await sleep(500)

        // ── 8 CONVERSE ────────────────────────────────────────
        transition('CONVERSE')
        const convId = uid()
        setCards((c) => [...c, { id: convId, stage: 'CONVERSE', messages: [], streaming: false, decided: 'pending' }])
        await waitForUser() // pause: user chats, then clicks continue

        // ── 9 SELL ────────────────────────────────────────────
        transition('SELL')
        await sleep(600)
        setCards((c) => [
          ...c,
          {
            id: uid(),
            stage: 'SELL',
            skill: deployedSkills[0] ?? 'answer',
            price: 0.005,
            firstBuyer: 'world:explorer',
            strength: 1,
          },
        ])
        await sleep(700)

        // ── 10 BUY ────────────────────────────────────────────
        transition('BUY')
        await sleep(600)
        const txBytes = new Uint8Array(16)
        crypto.getRandomValues(txBytes)
        const bestProvider = discoveredAgents.find(
          (a) => a.strength === Math.max(...discoveredAgents.map((x) => x.strength)),
        )
        setCards((c) => [
          ...c,
          {
            id: uid(),
            stage: 'BUY',
            provider: bestProvider?.uid ?? 'world:scout',
            paid: bestProvider?.price ?? 0.01,
            txHash: `0x${hex(txBytes)}`,
            before: bestProvider?.strength ?? 14,
            after: (bestProvider?.strength ?? 14) + 1,
          },
        ])
        await sleep(700)

        // ── DONE ──────────────────────────────────────────────
        transition('DONE')
        setCards((c) => [
          ...c,
          {
            id: uid(),
            stage: 'DONE',
            uid: deployedUnitId,
            address: walletAddress,
            apiKey,
            agentMd: finalMd,
          },
        ])
      } catch {
        // cancelled — silence is valid
      } finally {
        pauseRef.current = null
        setRunning(false)
      }
    },
    [running, transition, waitForUser],
  )

  // KEY stage: user copied, mark done
  const markKeyCopied = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'KEY' ? { ...c, copied: true } : c)))
    emitClick('ui:chat-auth:key-copy', { type: 'text', content: apiKeyRef.current.slice(0, 8) })
  }

  const continueFromKey = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'KEY' ? { ...c, decided: 'continue' } : c)))
    emitClick('ui:chat-auth:key-continue', { type: 'text', content: '' })
    pauseRef.current?.resolve()
  }

  // TEAM stage: user edited + deploys
  const updateTeamMarkdown = (id: string, markdown: string) => {
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'TEAM' ? { ...c, markdown } : c)))
  }

  const deployTeam = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'TEAM' ? { ...c, decided: 'deploy' } : c)))
    emitClick('ui:chat-auth:team-deploy', { type: 'text', content: '' })
    pauseRef.current?.resolve()
  }

  // CONVERSE stage: user sends a message
  const handleConverseSend = useCallback(async (cardId: string, text: string) => {
    if (!text.trim()) return

    // snapshot history before streaming
    let history: { role: 'user' | 'assistant'; content: string }[] = []
    setCards((prev) => {
      const card = prev.find((c) => c.id === cardId && c.stage === 'CONVERSE')
      if (card && card.stage === 'CONVERSE') {
        history = card.messages.map((m) => ({ role: m.role, content: m.content }))
      }
      return prev
    })
    await sleep(0) // flush

    // add user message + empty assistant bubble
    const assistantIdx = history.length + 1
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId || c.stage !== 'CONVERSE') return c
        return {
          ...c,
          streaming: true,
          messages: [
            ...c.messages,
            { role: 'user' as const, content: text },
            { role: 'assistant' as const, content: '', streaming: true },
          ],
        }
      }),
    )

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: 'You are a ONE substrate agent. Answer concisely in 2-3 sentences.' },
            ...history,
            { role: 'user', content: text },
          ],
        }),
      })
      if (!res.ok || !res.body) throw new Error()
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += dec.decode(value, { stream: true })
        setCards((prev) =>
          prev.map((c) => {
            if (c.id !== cardId || c.stage !== 'CONVERSE') return c
            return {
              ...c,
              messages: c.messages.map((m, i) => (i === assistantIdx ? { ...m, content: full } : m)),
            }
          }),
        )
      }
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== cardId || c.stage !== 'CONVERSE') return c
          return {
            ...c,
            streaming: false,
            messages: c.messages.map((m, i) => (i === assistantIdx ? { ...m, streaming: false } : m)),
          }
        }),
      )
    } catch {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== cardId || c.stage !== 'CONVERSE') return c
          return {
            ...c,
            streaming: false,
            messages: c.messages.map((m, i) =>
              i === assistantIdx ? { ...m, content: '[no response — substrate offline]', streaming: false } : m,
            ),
          }
        }),
      )
    }
  }, [])

  const continueFromConverse = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'CONVERSE' ? { ...c, decided: 'continue' } : c)))
    emitClick('ui:chat-auth:converse-continue', { type: 'text', content: '' })
    pauseRef.current?.resolve()
  }

  const reset = () => {
    emitClick('ui:chat-auth:reset', { type: 'text', content: '' })
    setCards([])
    setStage('INTRO')
    setInput('')
  }

  const inputDock = (
    <form
      className={cn('flex gap-2 items-end w-full', hasCards && 'border-t bg-background px-4 py-4')}
      onSubmit={(e) => {
        e.preventDefault()
        if (!hasCards) run(input)
      }}
    >
      <div className={cn('flex gap-2 items-end w-full', hasCards && 'max-w-2xl mx-auto')}>
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (!hasCards) run(input)
            }
          }}
          placeholder="what should your swarm do?"
          rows={1}
          disabled={hasCards}
          className="flex-1 resize-none rounded-2xl border border-border/80 bg-black/[0.04] dark:bg-black/30 px-4 py-3 text-base leading-7 shadow-sm shadow-black/10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-40 transition-all"
        />
        <CTA type="submit" disabled={!input.trim() || running || hasCards} className="min-w-[6rem]">
          {running ? '…' : 'start →'}
        </CTA>
      </div>
    </form>
  )

  if (!hasCards) {
    return (
      <div className="relative flex flex-col w-full min-h-[100svh] px-4">
        <a href="/" className="absolute top-4 left-4 inline-flex" aria-label="one — home">
          <img src="/icon.svg" alt="one" width={50} height={50} className="w-[50px] h-[50px]" />
        </a>
        <div className="flex-1 grid place-items-center">
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
            <h1 className="text-center text-3xl sm:text-4xl font-light tracking-tight">
              one — generate your AI team agents
            </h1>
            <p className="text-center text-base text-muted-foreground leading-7">
              wallet → key → sign in → team → deploy → discover → message → converse → sell → buy
              <br />
              ten stages. your agent. real paths. the substrate learns.
            </p>
            {inputDock}
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

  const activeConverseCard = [...cards]
    .reverse()
    .find((c): c is Extract<Card, { stage: 'CONVERSE' }> => c.stage === 'CONVERSE' && c.decided === 'pending')

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
      <StageRail current={stage} />
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto w-full space-y-5">
          {cards.map((c) => (
            <div key={c.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardView
                card={c}
                onKeyCopy={() => c.stage === 'KEY' && markKeyCopied(c.id)}
                onKeyContinue={() => c.stage === 'KEY' && continueFromKey(c.id)}
                onMarkdownChange={(md) => c.stage === 'TEAM' && updateTeamMarkdown(c.id, md)}
                onTeamDeploy={() => c.stage === 'TEAM' && deployTeam(c.id)}
                onConverseSend={(text) => c.stage === 'CONVERSE' && handleConverseSend(c.id, text)}
                onConverseContinue={() => c.stage === 'CONVERSE' && continueFromConverse(c.id)}
                onReset={reset}
              />
            </div>
          ))}
          <div ref={bottomRef} />
          {activeConverseCard && <div className="h-24" />}
        </div>
      </div>
      {activeConverseCard && (
        <div className="border-t border-border/60 bg-background/80 backdrop-blur-lg px-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-2xl mx-auto w-full">
            <ConverseInput
              onSend={(text) => handleConverseSend(activeConverseCard.id, text)}
              streaming={activeConverseCard.streaming}
            />
          </div>
        </div>
      )}
    </div>
  )
}

async function streamIntoMessage(
  id: string,
  prompt: string,
  setCards: React.Dispatch<React.SetStateAction<Card[]>>,
  t0: number,
) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You are a ONE substrate agent. Answer in 2-3 sentences.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok || !res.body) throw new Error()
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let full = ''
    let gotFirst = false
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!gotFirst) {
        gotFirst = true
        const latencyMs = Math.round(performance.now() - t0)
        setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'MESSAGE' ? { ...c, latencyMs } : c)))
      }
      full += dec.decode(value, { stream: true })
      setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'MESSAGE' ? { ...c, response: full } : c)))
    }
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'MESSAGE' ? { ...c, streaming: false } : c)))
  } catch {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id && c.stage === 'MESSAGE'
          ? { ...c, response: `[demo] signal received: "${prompt}"`, streaming: false, latencyMs: 1 }
          : c,
      ),
    )
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StageRail({ current }: { current: Stage }) {
  const visible = STAGE_ORDER.filter((s) => s !== 'INTRO')
  const idx = visible.indexOf(current)
  return (
    <div className="border-b bg-background/80 backdrop-blur px-4 py-3">
      <div className="max-w-2xl mx-auto flex flex-wrap gap-1.5 justify-center">
        {visible.map((s, i) => (
          <span
            key={s}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs uppercase tracking-[0.12em] transition-all',
              i < idx && 'bg-muted text-muted-foreground',
              i === idx && 'bg-primary text-primary-foreground scale-105',
              i > idx && 'bg-muted/40 text-muted-foreground/50',
            )}
          >
            {s.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  )
}

function StageLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">{children}</div>
}

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

// The CTA button. Inverted duotone: black on light, white on dark.
// Square, big, slightly animated — lifts on hover, presses on active.
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
          // Light: black on white. Dark: white on black (inverted per user spec).
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

// Deterministic fake streaming — reveals fixed client-side copy char-by-char.
// Real LLM streams stay on the reader.read() path in MESSAGE/CONVERSE.
function Typed({
  text,
  speedMs = 10,
  className,
  caret = true,
}: {
  text: string
  speedMs?: number
  className?: string
  caret?: boolean
}) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setShown('')
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++
      if (i >= text.length) {
        setShown(text)
        setDone(true)
        clearInterval(id)
      } else {
        setShown(text.slice(0, i))
      }
    }, speedMs)
    return () => clearInterval(id)
  }, [text, speedMs])
  return (
    <span className={className}>
      {shown}
      {caret && !done && (
        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />
      )}
    </span>
  )
}

// Duotone: the design system has exactly two surface tones.
//   'muted'   — normal info (name, uid, address, keyId): neutral card surface
//   'primary' — valuable / actionable (api key, .env line): primary-tinted, ringed, slightly elevated
// Differentiation comes from hierarchy (ring + shadow), not hue.
type RowTone = 'muted' | 'primary'

function KeyRow({
  label,
  value,
  secret = false,
  tone = 'muted',
  onCopy,
}: {
  label: string
  value: string
  secret?: boolean
  tone?: RowTone
  onCopy?: () => void
}) {
  const [show, setShow] = useState(!secret)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* blocked */
    }
  }

  const masked = show ? value : '•'.repeat(Math.min(value.length, 48))
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

function CopyButton({ text, label, onCopy }: { text: string; label: string; onCopy: () => void }) {
  return (
    <CTA
      size="md"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          onCopy()
        } catch {
          /* blocked */
        }
      }}
    >
      {label}
    </CTA>
  )
}

function ConverseInput({ onSend, streaming }: { onSend: (t: string) => void; streaming: boolean }) {
  const [val, setVal] = useState('')
  return (
    <form
      className="flex gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault()
        if (val.trim() && !streaming) {
          onSend(val)
          setVal('')
        }
      }}
    >
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="message your agent…"
        disabled={streaming}
        className="flex-1 h-[52px] rounded-2xl border border-border/80 bg-black/[0.04] dark:bg-black/30 px-4 text-base shadow-sm shadow-black/10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 transition-all"
      />
      <CTA type="submit" disabled={!val.trim() || streaming} className="min-w-[5.5rem]">
        {streaming ? '…' : 'send'}
      </CTA>
    </form>
  )
}

interface CardViewProps {
  card: Card
  onKeyCopy: () => void
  onKeyContinue: () => void
  onMarkdownChange: (md: string) => void
  onTeamDeploy: () => void
  onConverseSend: (text: string) => void
  onConverseContinue: () => void
  onReset: () => void
}

function CardView(props: CardViewProps) {
  const {
    card,
    onKeyCopy,
    onKeyContinue,
    onMarkdownChange,
    onTeamDeploy,
    onConverseSend,
    onConverseContinue,
    onReset,
  } = props

  switch (card.stage) {
    case 'INTRO':
      return (
        <CardShell>
          <StageLabel>intro · ten stages</StageLabel>
          <div>
            goal: <span className="font-medium">"{card.entry}"</span>
          </div>
          <Typed
            className="block text-base text-muted-foreground mt-1"
            text="wallet → key → sign in → team → deploy → discover → message → converse → sell → buy. three pause points: save your key, edit your agent, chat with it. then the swarm earns."
          />
        </CardShell>
      )

    case 'WALLET':
      return (
        <CardShell>
          <div className="flex items-center gap-2 mb-1">
            <StageLabel>
              stage 0 · wallet · {card.latencyMs}ms · {card.online ? 'live' : 'demo'}
            </StageLabel>
            {card.returning && (
              <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                welcome back
              </span>
            )}
            {!card.online && (
              <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                offline — demo key
              </span>
            )}
          </div>
          <Typed
            className="block text-base text-muted-foreground mb-2"
            text={
              card.online
                ? `identity derived from /api/auth/agent. ed25519 from seed + uid. key was just minted server-side — the hash lives in TypeDB, plaintext is shown once.`
                : 'api/auth/agent unreachable. showing a locally-generated demo identity in the same shape. deploy the substrate to get a real key.'
            }
          />
          <div className="space-y-3">
            <KeyRow label="name" value={card.name} />
            <KeyRow label="uid" value={card.uid} />
            <KeyRow label="sui address" value={card.address} />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            same uid always → same address. lose the seed, lose the wallet.
          </div>
        </CardShell>
      )

    case 'KEY': {
      const pending = card.decided === 'pending'
      const envLine = `ONE_API_KEY=${card.apiKey}`
      return (
        <CardShell tone={pending ? 'accent' : 'default'}>
          <div className="flex items-center gap-2 mb-1">
            <StageLabel>stage 1 · save key · {pending ? 'awaiting you' : 'saved ✓'}</StageLabel>
            <span
              className={cn(
                'text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border',
                card.online
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border',
              )}
            >
              {card.online ? 'real · minted' : 'demo · offline'}
            </span>
          </div>
          <div className="text-base mb-3">
            your api key — shown once. <span className="font-semibold">save it now.</span> it's how your agent signs
            signals, deploys teams, and earns.
          </div>
          <div className="space-y-3">
            <KeyRow label="api key" value={card.apiKey} tone="primary" secret onCopy={onKeyCopy} />
            {card.keyId && <KeyRow label="key id" value={card.keyId} />}
            <KeyRow label="sui address" value={card.address} />
            <KeyRow label=".env line" value={envLine} tone="primary" secret onCopy={onKeyCopy} />
          </div>
          {pending && (
            <div className="mt-4 text-sm text-muted-foreground">
              copy any row above to save your key. paste into your .env and use it as{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded">Authorization: Bearer &lt;key&gt;</code> on every signal,
              deploy, and pay call.
            </div>
          )}
          {pending ? (
            <div className="flex gap-2 mt-4">
              <CTA onClick={onKeyContinue} disabled={!card.copied}>
                {card.copied ? 'i saved it — continue →' : 'copy the key first'}
              </CTA>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-3">✓ key saved — proceeding</div>
          )}
        </CardShell>
      )
    }

    case 'SIGNIN':
      return (
        <CardShell>
          <StageLabel>stage 2 · sign in · {card.latencyMs}ms</StageLabel>
          <div className="text-base">
            session established. <code className="font-mono text-sm">#{card.sessionId}</code>
          </div>
          <Typed
            className="block text-sm text-muted-foreground mt-1"
            text="agent: POST /api/auth/agent · human: better auth passkey. substrate sees the same session either way."
          />
        </CardShell>
      )

    case 'TEAM': {
      const pending = card.decided === 'pending'
      return (
        <CardShell tone={pending ? 'accent' : 'default'}>
          <StageLabel>stage 3 · create team · {pending ? 'edit + deploy' : 'deployed ✓'}</StageLabel>
          {pending ? (
            <>
              <div className="text-base text-muted-foreground mb-3">
                your agent.md. edit the name, skills, and system prompt. then deploy it.
              </div>
              <textarea
                value={card.markdown}
                onChange={(e) => onMarkdownChange(e.target.value)}
                rows={14}
                className="w-full font-mono text-sm bg-black/[0.04] dark:bg-black/30 border border-border/80 rounded-xl p-4 resize-none shadow-sm shadow-black/10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary leading-6 transition-all"
              />
              <div className="flex gap-2 mt-3">
                <CTA onClick={onTeamDeploy}>deploy this team →</CTA>
              </div>
            </>
          ) : (
            <div className="text-base text-muted-foreground">markdown committed. proceeding to TypeDB sync.</div>
          )}
        </CardShell>
      )
    }

    case 'DEPLOY':
      return (
        <CardShell>
          <StageLabel>stage 4 · deploy · {card.latencyMs}ms</StageLabel>
          <div className="text-base mb-2">
            <span className="font-mono">{card.unitId}</span> live in TypeDB.
          </div>
          <div className="space-y-1.5 text-base font-mono">
            {card.skills.map((s) => (
              <div key={s} className="flex gap-2 text-muted-foreground">
                <span>✓</span>
                <span>capability: {s}</span>
              </div>
            ))}
          </div>
          <Typed
            className="block mt-2 text-sm text-muted-foreground"
            text="unit + capabilities + group membership written. agent is now discoverable."
          />
        </CardShell>
      )

    case 'DISCOVER':
      return (
        <CardShell>
          <StageLabel>stage 5 · discover · tag: {card.tag}</StageLabel>
          <div className="text-base text-muted-foreground mb-2">
            {card.agents.length} agents in world, ranked by pheromone strength:
          </div>
          <div className="space-y-1.5 text-base font-mono">
            {card.agents
              .slice()
              .sort((a, b) => b.strength - a.strength)
              .map((a) => (
                <div key={a.uid} className="flex justify-between">
                  <span>
                    {a.uid}:{a.skill}
                  </span>
                  <span className="text-muted-foreground">
                    {a.price} SUI · s={a.strength}
                  </span>
                </div>
              ))}
          </div>
          <Typed
            className="block mt-2 text-sm text-muted-foreground"
            text="$0.001 per discovery query · layer 2 revenue. strongest path wins."
          />
        </CardShell>
      )

    case 'MESSAGE':
      return (
        <CardShell>
          <StageLabel>
            stage 6 · message{card.latencyMs !== null ? ` · ${card.latencyMs}ms first token` : ''}
          </StageLabel>
          <div className="text-base text-muted-foreground mb-2">signal: "{card.prompt}"</div>
          <div className="whitespace-pre-wrap text-base leading-7">
            {card.response || <span className="text-muted-foreground">…</span>}
            {card.streaming && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />
            )}
          </div>
          {!card.streaming && card.response && (
            <div className="mt-2 text-sm text-muted-foreground">
              path marked ✓ · mark() → strength accumulates on this edge
            </div>
          )}
        </CardShell>
      )

    case 'CONVERSE': {
      const pending = card.decided === 'pending'
      return (
        <CardShell tone={pending ? 'accent' : 'default'}>
          <StageLabel>stage 7 · converse · {pending ? 'live chat' : 'done ✓'}</StageLabel>
          <div className="text-base text-muted-foreground mb-3">
            {pending
              ? "your agent is ready. ask it anything. when you're done, continue to sell."
              : `${card.messages.filter((m) => m.role === 'user').length} exchanges. paths strengthened.`}
          </div>
          {card.messages.length > 0 && (
            <div className="space-y-2 mb-3">
              {card.messages.map((m, i) => (
                <div key={`${i}`} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-base leading-7',
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background/60 text-foreground',
                    )}
                  >
                    {m.content || <span className="opacity-50">…</span>}
                    {m.streaming && (
                      <span className="inline-block w-1 h-3 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {pending && card.messages.length >= 2 && (
            <div className="mt-3">
              <CTA variant="ghost" size="md" onClick={onConverseContinue} disabled={card.streaming}>
                continue to sell →
              </CTA>
            </div>
          )}
        </CardShell>
      )
    }

    case 'SELL':
      return (
        <CardShell>
          <StageLabel>stage 8 · sell · first inbound</StageLabel>
          <div className="text-base mb-2">
            <span className="font-mono">{card.firstBuyer}</span> hired your{' '}
            <span className="font-semibold">{card.skill}</span> skill for{' '}
            <span className="font-semibold">{card.price} SUI</span>.
          </div>
          <div className="space-y-1.5 text-sm font-mono text-muted-foreground">
            <div>path.strength: 0 → {card.strength} · mark() fired</div>
            <div>platform fee: 2% · net: {(card.price * 0.98).toFixed(4)} SUI</div>
          </div>
          <Typed
            className="block mt-2 text-sm text-muted-foreground"
            text="first sale is the hardest. now pheromone works for you — proven providers get picked first."
          />
        </CardShell>
      )

    case 'BUY':
      return (
        <CardShell>
          <StageLabel>stage 9 · buy · path learned</StageLabel>
          <div className="text-base mb-2">
            hired <span className="font-mono">{card.provider}</span> for{' '}
            <span className="font-semibold">{card.paid} SUI</span>. escrow released.
          </div>
          <div className="space-y-1.5 text-sm font-mono">
            <div>
              path.strength: <span className="text-muted-foreground">{card.before}</span> →{' '}
              <span className="font-semibold">{card.after}</span>
            </div>
            <div className="text-muted-foreground break-all">tx: {card.txHash}</div>
          </div>
          <Typed
            className="block mt-2 text-sm text-muted-foreground"
            text="buyer→seller edge marked. next hire on this path is twice as likely."
          />
        </CardShell>
      )

    case 'DONE':
      return (
        <CardShell tone="accent">
          <StageLabel>done · your swarm is live</StageLabel>
          <div className="text-base mb-4">
            your agent earned. you bought. the path remembers. this is a real swarm — every stage wrote to the substrate
            and the learning is permanent.
          </div>
          <div className="space-y-3 mb-4">
            <KeyRow label="uid" value={card.uid} />
            <KeyRow label="sui address" value={card.address} />
            <KeyRow label="api key" value={card.apiKey} tone="primary" secret />
          </div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
            your agent.md — fork and deploy
          </div>
          <pre className="font-mono text-sm bg-black/[0.04] dark:bg-black/30 rounded-xl p-4 border border-border/80 shadow-sm shadow-black/10 overflow-x-auto whitespace-pre-wrap leading-6 mb-4">
            {card.agentMd}
          </pre>
          <div className="flex flex-wrap gap-2 mb-4">
            <CopyButton
              text={card.agentMd}
              label="copy agent.md"
              onCopy={() => emitClick('ui:chat-auth:copy-agent', { type: 'text', content: '' })}
            />
            <CopyButton
              text={`ONE_API_KEY=${card.apiKey}`}
              label="copy api key"
              onCopy={() => emitClick('ui:chat-auth:copy-key', { type: 'text', content: '' })}
            />
            <CTA variant="ghost" size="md" onClick={onReset}>
              build another
            </CTA>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              send a signal:{' '}
              <code className="bg-muted px-1 rounded text-[10px]">
                curl -X POST /api/signal -H "Authorization: Bearer {card.apiKey.slice(0, 16)}..." -d '
                {`{"receiver":"${card.uid}","data":"hello"}`}'
              </code>
            </div>
            <div>
              add a channel:{' '}
              <code className="bg-muted px-1 rounded text-[10px]">
                bun run scripts/setup-nanoclaw.ts --agent {card.uid.split(':')[1] ?? 'my-agent'}
              </code>
            </div>
          </div>
        </CardShell>
      )
  }
}
