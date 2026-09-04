import {
  ArrowRight,
  CheckCircle2,
  Code2,
  CreditCard,
  Fingerprint,
  Gauge,
  Layers,
  Link2,
  Network,
  QrCode,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wallet,
  Webhook,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { emitClick } from '@/lib/ui-signal'

export function PayShowcaseHeader() {
  const cta = (label: string) => () => emitClick('ui:pay:cta', { label })
  return (
    <div className="w-full">
      <TopBar cta={cta} />
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
        <Hero cta={cta} />
        <TouchIdStrip />
        <Stats />
        <Pillars />
        <HowItWorks />
      </div>
    </div>
  )
}

export function PayShowcaseFooter() {
  const cta = (label: string) => () => emitClick('ui:pay:cta', { label })
  return (
    <div className="w-full">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
        <Pricing />
        <DeveloperBlock />
        <FinalCTA cta={cta} />
      </div>
      <Footer />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Top bar — minimal sticky nav
// ═══════════════════════════════════════════════════════════════════════════
function TopBar({ cta }: { cta: (label: string) => () => void }) {
  return (
    <nav className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-foreground font-semibold">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--color-primary-bright))] to-[hsl(var(--color-secondary-bright))] flex items-center justify-center text-xs">
            ◎
          </span>
          <span>ONE Pay</span>
          <Badge variant="outline" className="ml-2 text-[10px] border-border text-muted-foreground">
            beta
          </Badge>
        </a>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#rails" className="hover:text-foreground transition-colors">
            Rails
          </a>
          <a href="#demo" className="hover:text-foreground transition-colors">
            Try it
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#developers" className="hover:text-foreground transition-colors">
            Developers
          </a>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/signup"
            onClick={cta('header:signup')}
            className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white text-black hover:bg-[hsl(var(--color-muted)/0.3)] transition-colors"
          >
            Get API key
          </a>
        </div>
      </div>
    </nav>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Hero
// ═══════════════════════════════════════════════════════════════════════════
function Hero({ cta }: { cta: (label: string) => () => void }) {
  return (
    <section className="pt-20 pb-20 text-center md:text-left">
      <div className="grid md:grid-cols-[1.3fr_1fr] gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--color-secondary-bright)/0.3)] bg-[hsl(var(--color-secondary-bright)/0.08)] text-xs text-[hsl(var(--color-secondary-bright))]">
            <Sparkles className="w-3 h-3" />
            Three rails · one substrate · every payment is a signal
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[1.02] tracking-tight">
            Accept payments.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--color-primary-bright))] via-[hsl(var(--color-secondary-bright))] to-[hsl(var(--color-tertiary-bright))]">
              Let the graph do the routing.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            One API. Stripe cards, Sui wallets, crypto links. Every payment marks the path that paid — the substrate
            steers tomorrow&rsquo;s buyers down the lanes that converted yesterday.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
            <a
              href="/signup"
              onClick={cta('hero:primary')}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-[hsl(var(--color-muted)/0.3)] transition-colors"
            >
              Start accepting
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <button
              type="button"
              onClick={() => {
                cta('hero:secondary')()
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-font hover:bg-muted transition-colors"
            >
              Try it live
            </button>
          </div>
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground justify-center md:justify-start">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--color-tertiary-bright))]" /> No setup fees
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--color-tertiary-bright))]" /> PCI-DSS via Stripe
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--color-tertiary-bright))]" /> On-chain settlement
            </span>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  )
}

function HeroVisual() {
  return (
    <div className="relative hidden md:block">
      <div className="absolute -inset-4 bg-gradient-to-br from-[hsl(var(--color-primary-bright)/0.2)] via-[hsl(var(--color-secondary-bright)/0.2)] to-[hsl(var(--color-tertiary-bright)/0.2)] blur-3xl" />
      <div className="relative rounded-2xl border border-border bg-card/80 p-5 space-y-3 backdrop-blur">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-destructive))]" />
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-gold))]" />
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-tertiary-bright))]" />
          <span className="ml-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            substrate:pay
          </span>
        </div>
        <RailRow
          icon={<CreditCard className="w-4 h-4" />}
          color="text-[hsl(var(--color-primary-bright))]"
          label="Visa · 4242"
          amount="$2.50"
        />
        <RailRow
          icon={<Wallet className="w-4 h-4" />}
          color="text-[hsl(var(--color-secondary-bright))]"
          label="Sui · USDC"
          amount="$25.00"
        />
        <RailRow
          icon={<Link2 className="w-4 h-4" />}
          color="text-[hsl(var(--color-tertiary-bright))]"
          label="Link · USDC"
          amount="$10.00"
        />
        <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">mark(buyer → skill, depth=1)</span>
          <span className="text-[hsl(var(--color-tertiary-bright))] font-mono">+strength</span>
        </div>
      </div>
    </div>
  )
}

function RailRow({
  icon,
  color,
  label,
  amount,
}: {
  icon: React.ReactNode
  color: string
  label: string
  amount: string
}) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <code className="text-xs text-foreground">{label}</code>
      </div>
      <span className="font-mono text-muted-foreground text-xs">{amount}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Stats strip
// ═══════════════════════════════════════════════════════════════════════════
function Stats() {
  const stats = [
    { v: '3', l: 'settlement rails' },
    { v: '50 bps', l: 'protocol fee' },
    { v: '2.0%', l: 'platform fee on Sui' },
    { v: '<5 ms', l: 'routing decision' },
  ]
  return (
    <section className="py-10 border-y border-border">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.l} className="text-center md:text-left">
            <div className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">{s.v}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Pillars — 3 big feature cards
// ═══════════════════════════════════════════════════════════════════════════
function Pillars() {
  const pillars = [
    {
      icon: <Layers className="w-6 h-6" />,
      tint: 'from-[hsl(var(--color-primary-bright)/0.1)] border-[hsl(var(--color-primary-bright)/0.3)] text-[hsl(var(--color-primary-bright))]',
      title: 'One signal, three rails',
      body: 'Every capture lands on the same substrate:pay signal — whether it was a Visa, a USDC transfer, or a Sui escrow release. Your router stays rail-agnostic.',
    },
    {
      icon: <Network className="w-6 h-6" />,
      tint: 'from-[hsl(var(--color-secondary-bright)/0.1)] border-[hsl(var(--color-secondary-bright)/0.3)] text-[hsl(var(--color-secondary-bright))]',
      title: 'Pheromone routing',
      body: 'mark() strengthens converting paths; warn() weakens lanes that refund, dispute, or decline. The graph gets smarter with every transaction, no ML pipeline required.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      tint: 'from-[hsl(var(--color-tertiary-bright)/0.1)] border-[hsl(var(--color-tertiary-bright)/0.3)] text-[hsl(var(--color-tertiary-bright))]',
      title: 'Failure is data',
      body: 'Refunds warn×2. Disputes warn×3. Chargebacks warn×5. Toxic edges decay fast so the graph stops routing buyers down dead lanes.',
    },
  ]
  return (
    <section id="rails" className="py-20">
      <SectionHeader eyebrow="Why ONE Pay" title="Payments that think" />
      <div className="grid md:grid-cols-3 gap-4">
        {pillars.map((p) => (
          <div key={p.title} className={`rounded-2xl border bg-gradient-to-b to-transparent p-6 ${p.tint}`}>
            <div className="mb-4">{p.icon}</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// How it works
// ═══════════════════════════════════════════════════════════════════════════
function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: <Code2 className="w-5 h-5" />,
      title: 'Drop in',
      body: 'Embed a Stripe Element, a Sui PayPage, or a shareable crypto link. SDK, CLI, or raw HTTP — pick your ergonomics.',
    },
    {
      n: '02',
      icon: <Zap className="w-5 h-5" />,
      title: 'Collect',
      body: 'Buyers pay on whatever rail fits them. Stripe captures go through Elements. Wallets go through dapp-kit. Links go through any wallet app.',
    },
    {
      n: '03',
      icon: <Gauge className="w-5 h-5" />,
      title: 'Learn',
      body: 'Success marks the path. Failure warns it. The graph routes the next buyer down the strongest converting lane. No config.',
    },
  ]
  return (
    <section className="py-20 border-t border-border">
      <SectionHeader eyebrow="How it works" title="Three steps, one closed loop" />
      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div key={s.n} className="relative rounded-2xl border border-border bg-muted/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl font-bold text-muted-foreground tabular-nums">{s.n}</span>
              <div className="w-9 h-9 rounded-full bg-[hsl(var(--color-secondary-bright)/0.1)] text-[hsl(var(--color-secondary-bright))] flex items-center justify-center">
                {s.icon}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Touch ID strip — Pattern C, biometric-bound fiat rail
// ═══════════════════════════════════════════════════════════════════════════
function TouchIdStrip() {
  const stats = [
    { label: 'First buy', value: '≤ 8s', detail: 'Apple Pay → SCA-skipped → card saved' },
    { label: 'Returning', value: '≤ 3s', detail: 'Link prefilled · one-tap OTP or skip' },
    { label: 'Identity', value: 'passkey', detail: 'human:<slug> ↔ Stripe customer' },
  ]
  return (
    <section className="py-12">
      <div className="relative overflow-hidden rounded-3xl border border-secondary/30 bg-gradient-to-br from-[hsl(var(--color-secondary-bright)/0.1)] via-card to-[hsl(var(--color-primary-mid)/0.1)] p-8 md:p-10">
        <div
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[hsl(var(--color-secondary-bright)/0.2)] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-bright">
              <Fingerprint className="h-3 w-3" />
              New · Pattern C
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Pay with Touch ID</h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              One biometric, two rails. Apple Pay where it works. Stripe Link with your saved card everywhere else. Same
              passkey-bound identity, one tap.
            </p>
          </div>
          <a
            href="/pay/touch"
            onClick={() => emitClick('ui:pay:touch:try')}
            className="group inline-flex items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[hsl(var(--color-muted)/0.3)] md:self-auto"
          >
            Try the demo
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
        <dl className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <dt className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">{s.value}</dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{s.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Pricing
// ═══════════════════════════════════════════════════════════════════════════
function Pricing() {
  const tiers = [
    {
      icon: <CreditCard className="w-5 h-5 text-[hsl(var(--color-primary-bright))]" />,
      rail: 'Card',
      processor: 'Stripe',
      fee: '2.9% + 30¢',
      extra: 'passthrough',
      payout: 'Stripe schedule',
      accent: 'border-[hsl(var(--color-primary-bright)/0.3)]',
    },
    {
      icon: <Wallet className="w-5 h-5 text-[hsl(var(--color-secondary-bright))]" />,
      rail: 'Sui wallet',
      processor: 'dapp-kit',
      fee: '2.0% + 50 bps',
      extra: 'platform + protocol',
      payout: 'Instant, on-chain',
      accent: 'border-[hsl(var(--color-secondary-bright)/0.3)] ring-1 ring-[hsl(var(--color-secondary-bright)/0.2)]',
      popular: true,
    },
    {
      icon: <Link2 className="w-5 h-5 text-[hsl(var(--color-tertiary-bright))]" />,
      rail: 'Crypto link',
      processor: 'any wallet',
      fee: '50 bps',
      extra: 'protocol only',
      payout: 'Instant, on-chain',
      accent: 'border-[hsl(var(--color-tertiary-bright)/0.3)]',
    },
  ]
  return (
    <section id="pricing" className="py-20 border-t border-border scroll-mt-14">
      <SectionHeader
        eyebrow="Pricing"
        title="No monthly fees. No minimums."
        subtitle="You pay per transaction. Card fees pass through to Stripe. On-chain rails charge only the protocol rate."
      />
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((t) => (
          <div key={t.rail} className={`relative rounded-2xl border bg-muted/40 p-6 ${t.accent}`}>
            {t.popular && (
              <span className="absolute -top-2.5 right-4 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[hsl(var(--color-secondary-bright))] text-foreground">
                most-routed
              </span>
            )}
            <div className="flex items-center gap-2 mb-4">
              {t.icon}
              <h3 className="text-lg font-semibold text-foreground">{t.rail}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-5">via {t.processor}</p>
            <div className="pb-5 mb-5 border-b border-border">
              <div className="text-3xl font-bold text-foreground tabular-nums">{t.fee}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.extra}</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--color-tertiary-bright))]" />
              {t.payout}
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-6">
        No setup fees · no monthly minimums · no contract · cancel by revoking your API key
      </p>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Developer block — code snippets
// ═══════════════════════════════════════════════════════════════════════════
function DeveloperBlock() {
  const [active, setActive] = useState<'sdk' | 'cli' | 'http'>('sdk')

  const code: Record<typeof active, string> = {
    sdk: `import { SubstrateClient } from '@oneie/sdk'

const one = new SubstrateClient({ apiKey: process.env.ONE_API_KEY })

// One call. Any rail. The graph picks.
const { ref, rail } = await one.pay({
  to: 'seller:alice',
  amount: 25,      // USD
  rail: 'auto',    // 'card' | 'crypto' | 'auto'
  memo: 'API call · GPT-4 summary',
})

// 'card' → Stripe PaymentIntent; 'crypto' → Sui escrow
console.log(rail, ref)`,
    cli: `# Install
npm install -g oneie

# Get your API key
oneie auth login

# Accept any rail
oneie pay create \\
  --to seller:alice \\
  --amount 25 \\
  --rail auto

# Returns { linkUrl, ref, rail } — print, share, or embed`,
    http: `POST /api/pay/create-link
Authorization: Bearer $ONE_API_KEY
Content-Type: application/json

{
  "to": "seller:alice",
  "amount": 25,
  "rail": "auto",
  "memo": "API call · GPT-4 summary"
}

# → { "linkUrl": "...", "qr": "...", "ref": "pi_..." }
# Webhook: /api/pay/stripe/webhook fires on capture
# Every success → mark(buyer → skill, +weight)`,
  }

  const tabs: { id: typeof active; label: string; icon: React.ReactNode }[] = [
    { id: 'sdk', label: 'SDK', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'cli', label: 'CLI', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'http', label: 'HTTP', icon: <Webhook className="w-3.5 h-3.5" /> },
  ]

  return (
    <section id="developers" className="py-20 border-t border-border scroll-mt-14">
      <SectionHeader
        eyebrow="Developers"
        title="Ship in three lines"
        subtitle="Typed SDK, scriptable CLI, raw HTTP. The same payment works through all three — the substrate routes."
      />
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/50">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                emitClick('ui:pay:dev-tab', { tab: t.id })
                setActive(t.id)
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                active === t.id
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <div className="ml-auto text-[10px] font-mono text-muted-foreground">
            {active === 'sdk' ? 'typescript' : active === 'cli' ? 'bash' : 'http'}
          </div>
        </div>
        <pre className="p-5 md:p-6 text-sm leading-relaxed overflow-x-auto text-font">
          <code>{code[active]}</code>
        </pre>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <a
          href="/docs"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full border border-border text-foreground hover:bg-muted transition-colors"
        >
          Read the docs <ArrowRight className="w-3.5 h-3.5" />
        </a>
        <a
          href="https://github.com/oneie/one"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full border border-border text-foreground hover:bg-muted transition-colors"
        >
          View on GitHub <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Final CTA
// ═══════════════════════════════════════════════════════════════════════════
function FinalCTA({ cta }: { cta: (label: string) => () => void }) {
  return (
    <section className="py-24 border-t border-border">
      <div className="relative rounded-3xl border border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--color-primary-bright)/0.2)] via-[hsl(var(--color-secondary-bright)/0.1)] to-[hsl(var(--color-tertiary-bright)/0.2)]" />
        <div className="relative px-6 md:px-12 py-16 md:py-20 text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight max-w-3xl mx-auto">
            Start accepting payments
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--color-primary-bright))] via-[hsl(var(--color-secondary-bright))] to-[hsl(var(--color-tertiary-bright))]">
              on every rail at once.
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Get an API key. Drop in an Element. The graph routes the rest.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <a
              href="/signup"
              onClick={cta('final:primary')}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black font-semibold hover:bg-[hsl(var(--color-muted)/0.3)] transition-colors"
            >
              Get API key
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <button
              type="button"
              onClick={() => {
                cta('final:secondary')()
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border text-font hover:bg-muted transition-colors"
            >
              Replay the demo
            </button>
          </div>
          <div className="pt-4 flex flex-wrap gap-5 justify-center text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> Crypto-native
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> PCI via Stripe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" /> Pheromone routing
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Footer
// ═══════════════════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer className="border-t border-border py-12 mt-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-foreground font-semibold mb-3">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--color-primary-bright))] to-[hsl(var(--color-secondary-bright))] flex items-center justify-center text-xs">
              ◎
            </span>
            ONE Pay
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Three rails. One substrate. Every payment is a signal.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { href: '#rails', label: 'Rails' },
            { href: '#demo', label: 'Try it' },
            { href: '#pricing', label: 'Pricing' },
          ]}
        />
        <FooterCol
          title="Developers"
          links={[
            { href: '/docs', label: 'Docs' },
            { href: '/api', label: 'API reference' },
            { href: 'https://github.com/oneie/one', label: 'GitHub' },
          ]}
        />
        <FooterCol
          title="Substrate"
          links={[
            { href: '/world', label: 'World map' },
            { href: '/speed', label: 'Speed' },
            { href: '/discover', label: 'Discover' },
          ]}
        />
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} ONE · one.ie</span>
        <span className="font-mono">
          <code>substrate:pay</code> · 3 rails · closed loop
        </span>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{title}</div>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="text-center mb-10 space-y-2">
      <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--color-secondary-bright))]">{eyebrow}</div>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{title}</h2>
      {subtitle && <p className="text-base text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
    </header>
  )
}
