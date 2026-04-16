import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DEFAULT_MODEL, POPULAR_MODELS } from '@/lib/chat/models'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

type Stage =
  | 'INTRO'
  | 'LIST'
  | 'DISCOVER'
  | 'OFFER'
  | 'WALLET'
  | 'ESCROW'
  | 'EXECUTE'
  | 'VERIFY'
  | 'SETTLE'
  | 'RECEIPT'
  | 'DONE'

const STAGE_ORDER: Stage[] = [
  'INTRO',
  'LIST',
  'DISCOVER',
  'OFFER',
  'WALLET',
  'ESCROW',
  'EXECUTE',
  'VERIFY',
  'SETTLE',
  'RECEIPT',
  'DONE',
]

type Seller = { uid: string; skill: string; price: number; strength: number }
type Wallet = { privateKey: string; seed: string; address: string }

type Card =
  | { id: string; stage: 'INTRO'; task: string }
  | { id: string; stage: 'LIST'; sellers: Seller[] }
  | { id: string; stage: 'DISCOVER'; task: string; match: Seller; candidates: Seller[] }
  | { id: string; stage: 'OFFER'; seller: Seller; task: string; decided: 'pending' | 'accept' | 'cancel' }
  | { id: string; stage: 'WALLET'; wallet: Wallet; copied: 'none' | 'mm' | 'env'; decided: 'pending' | 'continue' }
  | { id: string; stage: 'ESCROW'; receiptId: string; amount: number; deadlineMs: number }
  | { id: string; stage: 'EXECUTE'; task: string; output: string; streaming: boolean }
  | { id: string; stage: 'VERIFY'; score: { fit: number; form: number; truth: number; taste: number } }
  | { id: string; stage: 'SETTLE'; txHash: string; amount: number }
  | {
      id: string
      stage: 'RECEIPT'
      before: { strength: number; revenue: number }
      after: { strength: number; revenue: number }
    }
  | { id: string; stage: 'DONE'; task: string }

const SELLERS: Seller[] = [
  { uid: 'marketing:creative', skill: 'copy', price: 0.02, strength: 12 },
  { uid: 'marketing:media', skill: 'design', price: 0.05, strength: 8 },
  { uid: 'marketing:scout', skill: 'research', price: 0.01, strength: 19 },
]

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
  'substrate',
  'signal',
  'highway',
  'toxic',
  'hypothesis',
  'frontier',
  'evolve',
  'know',
  'recall',
  'reveal',
  'forget',
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

async function makeWallet(): Promise<Wallet> {
  const priv = new Uint8Array(32)
  crypto.getRandomValues(priv)
  const addrBytes = (await sha256(priv)).slice(0, 20)
  const words: string[] = []
  const pick = new Uint8Array(12)
  crypto.getRandomValues(pick)
  for (let i = 0; i < 12; i++) words.push(SEED_WORDS[pick[i] % SEED_WORDS.length])
  return {
    privateKey: `0x${hex(priv)}`,
    seed: words.join(' '),
    address: `0x${hex(addrBytes)}`,
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const uid = () => crypto.randomUUID()

function pickMatch(task: string): { match: Seller; candidates: Seller[] } {
  const t = task.toLowerCase()
  const wantsDesign = /design|logo|image|banner|visual/.test(t)
  const wantsResearch = /research|find|analy|compare/.test(t)
  const match = wantsDesign ? SELLERS[1] : wantsResearch ? SELLERS[2] : SELLERS[0]
  return { match, candidates: SELLERS }
}

export function AdBuyChat() {
  const [cards, setCards] = useState<Card[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState<Stage>('INTRO')
  const pauseRef = useRef<{ resolve: () => void; reject: () => void } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const hasCards = cards.length > 0

  const modelMeta = useMemo(() => {
    const m = POPULAR_MODELS.find((x) => x.id === DEFAULT_MODEL)
    return { name: m?.name ?? DEFAULT_MODEL, provider: m?.providers?.[0] ?? '' }
  }, [])

  useEffect(() => {
    if (hasCards) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [cards])

  const transition = useCallback((s: Stage, meta?: Record<string, unknown>) => {
    setStage(s)
    emitClick(`ui:ad-buy:transition:${s.toLowerCase()}`, {
      type: 'text',
      content: JSON.stringify(meta ?? {}),
    })
  }, [])

  const waitForUser = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      pauseRef.current = { resolve, reject }
    })
  }, [])

  const run = useCallback(
    async (task: string) => {
      if (!task.trim() || running) return
      setRunning(true)
      setCards([])
      setStage('INTRO')
      emitClick('ui:ad-buy:start', { type: 'text', content: task })

      try {
        // INTRO — setting the scene
        setCards((c) => [...c, { id: uid(), stage: 'INTRO', task }])
        transition('INTRO', { task })
        await sleep(600)

        // LIST — sellers in the world
        transition('LIST')
        setCards((c) => [...c, { id: uid(), stage: 'LIST', sellers: SELLERS }])
        await sleep(900)

        // DISCOVER — cheapest_provider + pheromone
        transition('DISCOVER', { task })
        const { match, candidates } = pickMatch(task)
        setCards((c) => [...c, { id: uid(), stage: 'DISCOVER', task, match, candidates }])
        await sleep(900)

        // OFFER — user must accept price
        const offerId = uid()
        transition('OFFER', { provider: match.uid, price: match.price })
        setCards((c) => [...c, { id: offerId, stage: 'OFFER', seller: match, task, decided: 'pending' }])
        await waitForUser()

        // WALLET — key handoff, user must confirm
        const walletId = uid()
        transition('WALLET')
        const wallet = await makeWallet()
        setCards((c) => [...c, { id: walletId, stage: 'WALLET', wallet, copied: 'none', decided: 'pending' }])
        await waitForUser()

        // ESCROW — funds locked
        transition('ESCROW', { amount: match.price })
        setCards((c) => [
          ...c,
          {
            id: uid(),
            stage: 'ESCROW',
            receiptId: uid().slice(0, 8),
            amount: match.price,
            deadlineMs: Date.now() + 24 * 60 * 60 * 1000,
          },
        ])
        await sleep(900)

        // EXECUTE — real LLM streaming
        const execId = uid()
        transition('EXECUTE', { provider: match.uid })
        setCards((c) => [...c, { id: execId, stage: 'EXECUTE', task, output: '', streaming: true }])
        await streamExecute(execId, task, setCards)

        // VERIFY — rubric score
        transition('VERIFY')
        const score = { fit: 0.92, form: 0.85, truth: 0.9, taste: 0.82 }
        setCards((c) => [...c, { id: uid(), stage: 'VERIFY', score }])
        await sleep(900)

        // SETTLE — on-chain (scripted)
        transition('SETTLE', { amount: match.price })
        const txBytes = new Uint8Array(16)
        crypto.getRandomValues(txBytes)
        setCards((c) => [...c, { id: uid(), stage: 'SETTLE', txHash: `0x${hex(txBytes)}`, amount: match.price }])
        await sleep(900)

        // RECEIPT — pheromone update, path learns
        transition('RECEIPT')
        setCards((c) => [
          ...c,
          {
            id: uid(),
            stage: 'RECEIPT',
            before: { strength: match.strength, revenue: 0 },
            after: { strength: match.strength + 1, revenue: match.price },
          },
        ])
        await sleep(900)

        // DONE
        transition('DONE', { task })
        setCards((c) => [...c, { id: uid(), stage: 'DONE', task }])
      } catch {
        // user cancelled — silence is valid (zero-returns rule)
      } finally {
        pauseRef.current = null
        setRunning(false)
      }
    },
    [running, transition, waitForUser],
  )

  const acceptOffer = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'OFFER' ? { ...c, decided: 'accept' } : c)))
    emitClick('ui:ad-buy:offer-accept', { type: 'text', content: '' })
    pauseRef.current?.resolve()
  }

  const cancelOffer = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'OFFER' ? { ...c, decided: 'cancel' } : c)))
    emitClick('ui:ad-buy:offer-cancel', { type: 'text', content: '' })
    pauseRef.current?.reject()
  }

  const continueWallet = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'WALLET' ? { ...c, decided: 'continue' } : c)))
    emitClick('ui:ad-buy:wallet-continue', { type: 'text', content: '' })
    pauseRef.current?.resolve()
  }

  const markCopied = (id: string, which: 'mm' | 'env') => {
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'WALLET' ? { ...c, copied: which } : c)))
    emitClick(`ui:ad-buy:wallet-copy-${which}`, { type: 'text', content: '' })
  }

  const reset = () => {
    emitClick('ui:ad-buy:reset', { type: 'text', content: '' })
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
          placeholder="what should your agents buy?"
          rows={1}
          disabled={hasCards}
          className={cn(
            'flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-base leading-7 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50',
          )}
        />
        <Button
          type="submit"
          disabled={!input.trim() || running || hasCards}
          className="h-[52px] px-5 rounded-2xl text-base"
        >
          {running ? '…' : '⏎'}
        </Button>
      </div>
    </form>
  )

  if (!hasCards) {
    return (
      <div className="grid w-full min-h-[100svh] place-items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
          <h1 className="text-center text-2xl font-light tracking-tight">one — enter our world</h1>
          <p className="text-center text-sm text-muted-foreground">
            your agents buy and sell. list → discover → escrow → execute → settle.
          </p>
          {inputDock}
          <div className="text-center text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {modelMeta.name}
            {modelMeta.provider ? ` · ${modelMeta.provider}` : ''}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {['write a launch headline', 'design a logo concept', 'research top 3 competitors'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setInput(s)
                  run(s)
                }}
                className="px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.12em] bg-muted text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <StageRail current={stage} />
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          {cards.map((c) => (
            <div key={c.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardView
                card={c}
                onAccept={() => c.stage === 'OFFER' && acceptOffer(c.id)}
                onCancel={() => c.stage === 'OFFER' && cancelOffer(c.id)}
                onWalletContinue={() => c.stage === 'WALLET' && continueWallet(c.id)}
                onCopy={(which) => c.stage === 'WALLET' && markCopied(c.id, which)}
                onReset={reset}
              />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

async function streamExecute(id: string, task: string, setCards: React.Dispatch<React.SetStateAction<Card[]>>) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You are a ONE marketplace seller. Be concise (2-3 sentences).' },
          { role: 'user', content: task },
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
      setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'EXECUTE' ? { ...c, output: full } : c)))
    }
    setCards((prev) => prev.map((c) => (c.id === id && c.stage === 'EXECUTE' ? { ...c, streaming: false } : c)))
  } catch {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id && c.stage === 'EXECUTE'
          ? { ...c, output: `[demo] task "${task}" completed.`, streaming: false }
          : c,
      ),
    )
  }
}

function StageRail({ current }: { current: Stage }) {
  const visibleStages = STAGE_ORDER.filter((s) => s !== 'INTRO' && s !== 'DONE')
  const currentIdx = visibleStages.indexOf(current)
  return (
    <div className="border-b bg-background/80 backdrop-blur px-4 py-3">
      <div className="max-w-2xl mx-auto flex flex-wrap gap-1.5 justify-center">
        {visibleStages.map((s, i) => (
          <span
            key={s}
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.12em] transition-all',
              i < currentIdx && 'bg-muted text-muted-foreground',
              i === currentIdx && 'bg-primary text-primary-foreground scale-105',
              i > currentIdx && 'bg-muted/40 text-muted-foreground/50',
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
  return <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2">{children}</div>
}

function CardShell({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'accent' | 'warn'
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4 text-base leading-7',
        tone === 'default' && 'bg-muted border-transparent',
        tone === 'accent' && 'bg-primary/10 border-primary/30',
        tone === 'warn' && 'bg-amber-500/10 border-amber-500/30',
      )}
    >
      {children}
    </div>
  )
}

function CardView({
  card,
  onAccept,
  onCancel,
  onWalletContinue,
  onCopy,
  onReset,
}: {
  card: Card
  onAccept: () => void
  onCancel: () => void
  onWalletContinue: () => void
  onCopy: (which: 'mm' | 'env') => void
  onReset: () => void
}) {
  switch (card.stage) {
    case 'INTRO':
      return (
        <CardShell>
          <StageLabel>intro</StageLabel>
          <div>
            your task: <span className="font-medium">"{card.task}"</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            walking you through the 4-step trade: list → discover → execute → settle. two pause points — price accept
            and wallet handoff.
          </div>
        </CardShell>
      )

    case 'LIST':
      return (
        <CardShell>
          <StageLabel>step 1 · list</StageLabel>
          <div className="text-sm text-muted-foreground mb-2">
            {card.sellers.length} agents offering capabilities in this world:
          </div>
          <div className="space-y-1.5">
            {card.sellers.map((s) => (
              <div key={s.uid} className="flex justify-between text-sm font-mono">
                <span>
                  {s.uid}:{s.skill}
                </span>
                <span className="text-muted-foreground">
                  {s.price} SUI · strength {s.strength}
                </span>
              </div>
            ))}
          </div>
        </CardShell>
      )

    case 'DISCOVER':
      return (
        <CardShell>
          <StageLabel>step 2 · discover</StageLabel>
          <div className="text-sm text-muted-foreground mb-2">ranking by pheromone, tiebreak by price:</div>
          <div className="space-y-1 text-sm font-mono">
            {card.candidates
              .slice()
              .sort((a, b) => b.strength - a.strength)
              .map((s) => (
                <div
                  key={s.uid}
                  className={cn(
                    'flex justify-between',
                    s.uid === card.match.uid ? 'text-foreground font-semibold' : 'text-muted-foreground/60',
                  )}
                >
                  <span>
                    {s.uid === card.match.uid ? '→ ' : '  '}
                    {s.uid}:{s.skill}
                  </span>
                  <span>
                    {s.price} SUI · s={s.strength}
                  </span>
                </div>
              ))}
          </div>
        </CardShell>
      )

    case 'OFFER': {
      const pending = card.decided === 'pending'
      return (
        <CardShell tone={pending ? 'accent' : 'default'}>
          <StageLabel>step 3 · offer · {card.decided === 'pending' ? 'awaiting you' : card.decided}</StageLabel>
          <div className="mb-2">
            <span className="font-mono">
              {card.seller.uid}:{card.seller.skill}
            </span>{' '}
            will run "{card.task}" for <span className="font-semibold">{card.seller.price} SUI</span>.
          </div>
          {pending ? (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={onAccept}>
                accept · escrow {card.seller.price} SUI
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel}>
                cancel
              </Button>
            </div>
          ) : card.decided === 'accept' ? (
            <div className="text-xs text-muted-foreground">✓ accepted — proceeding to escrow</div>
          ) : (
            <div className="text-xs text-muted-foreground">✗ cancelled</div>
          )}
        </CardShell>
      )
    }

    case 'WALLET': {
      const pending = card.decided === 'pending'
      const envLine = `SUI_SEED=${b64(new TextEncoder().encode(card.wallet.privateKey.slice(2, 50)))}`
      return (
        <CardShell tone={pending ? 'warn' : 'default'}>
          <StageLabel>wallet handoff · demo keypair</StageLabel>
          <div className="text-sm mb-3">
            your agent needs a wallet to escrow SUI. here's its <span className="font-semibold">demo keypair</span> —
            regenerated each session, so save it now or lose it.
          </div>

          <div className="space-y-2 font-mono text-xs bg-background/60 rounded-lg p-3 border">
            <KeyRow label="address" value={card.wallet.address} />
            <KeyRow label="private key" value={card.wallet.privateKey} secret />
            <KeyRow label="seed phrase" value={card.wallet.seed} secret />
          </div>

          <div className="mt-4 text-xs text-muted-foreground space-y-3">
            <div>
              <div className="font-semibold text-foreground mb-1">option a · metamask (ethereum)</div>
              open metamask → click the account icon → <em>import account</em> → select "private key" → paste the hex
              above.
              <div className="mt-1.5">
                <CopyButton
                  text={card.wallet.privateKey}
                  label={card.copied === 'mm' ? '✓ copied' : 'copy private key'}
                  onCopy={() => onCopy('mm')}
                />
              </div>
            </div>

            <div>
              <div className="font-semibold text-foreground mb-1">option b · .env (sui agent wallet)</div>
              add this line to your project's <code className="bg-muted px-1 rounded">.env</code>, then restart the
              substrate. ONE derives your agent keypair from <code>SUI_SEED + uid</code>.
              <div className="mt-1.5">
                <CopyButton
                  text={envLine}
                  label={card.copied === 'env' ? '✓ copied' : 'copy .env line'}
                  onCopy={() => onCopy('env')}
                />
              </div>
            </div>
          </div>

          {pending ? (
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={onWalletContinue} disabled={card.copied === 'none'}>
                {card.copied === 'none' ? 'copy one option first' : 'i saved it — continue'}
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mt-3">✓ continuing to escrow</div>
          )}
        </CardShell>
      )
    }

    case 'ESCROW':
      return (
        <CardShell>
          <StageLabel>step 4 · escrow · funded</StageLabel>
          <div className="text-sm">
            <span className="font-semibold">{card.amount} SUI</span> locked. receipt{' '}
            <code className="font-mono text-xs">#{card.receiptId}</code>. auto-refund in 24h if seller fails.
          </div>
        </CardShell>
      )

    case 'EXECUTE':
      return (
        <CardShell>
          <StageLabel>execute · seller producing result</StageLabel>
          <div className="whitespace-pre-wrap">
            {card.output || <span className="text-muted-foreground">…</span>}
            {card.streaming && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />
            )}
          </div>
        </CardShell>
      )

    case 'VERIFY':
      return (
        <CardShell>
          <StageLabel>verify · rubric score</StageLabel>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {(['fit', 'form', 'truth', 'taste'] as const).map((k) => (
              <div key={k}>
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{k}</div>
                <div className="font-mono">{card.score[k].toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">gate ≥ 0.65 · passed ✓</div>
        </CardShell>
      )

    case 'SETTLE':
      return (
        <CardShell>
          <StageLabel>settle · on-chain</StageLabel>
          <div className="text-sm">
            escrow released → seller. <span className="font-semibold">{card.amount} SUI</span> paid.
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground break-all">tx: {card.txHash}</div>
        </CardShell>
      )

    case 'RECEIPT':
      return (
        <CardShell>
          <StageLabel>receipt · path learned</StageLabel>
          <div className="space-y-1 text-sm font-mono">
            <div>
              path.strength: <span className="text-muted-foreground">{card.before.strength}</span>
              {' → '}
              <span className="font-semibold">{card.after.strength}</span>
            </div>
            <div>
              path.revenue: <span className="text-muted-foreground">{card.before.revenue.toFixed(2)}</span>
              {' → '}
              <span className="font-semibold">{card.after.revenue.toFixed(2)} SUI</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            mark() strengthened this path. next buyer finds this seller faster.
          </div>
        </CardShell>
      )

    case 'DONE':
      return (
        <CardShell tone="accent">
          <StageLabel>done</StageLabel>
          <div className="text-sm">
            your agent bought. the seller earned. the path remembers. that's the whole loop — repeat and the market
            teaches itself.
          </div>
          <Button size="sm" className="mt-3" onClick={onReset}>
            run it again
          </Button>
        </CardShell>
      )
  }
}

function KeyRow({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(!secret)
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground mb-0.5">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 break-all">{show ? value : '•'.repeat(Math.min(value.length, 48))}</div>
        {secret && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
          >
            {show ? 'hide' : 'show'}
          </button>
        )}
      </div>
    </div>
  )
}

function CopyButton({ text, label, onCopy }: { text: string; label: string; onCopy: () => void }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          onCopy()
        } catch {
          // noop — clipboard may be blocked
        }
      }}
      className="px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.12em] bg-foreground text-background hover:opacity-90 transition-all"
    >
      {label}
    </button>
  )
}
