import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { StripeCheckoutWrapper } from '@/components/pay/card/StripeCheckoutWrapper'
import { StripeElementsShowcase } from '@/components/pay/card/StripeElementsShowcase'
import { CryptoAcceptAddress } from '@/components/pay/crypto/CryptoAcceptAddress'
import { CryptoPaymentLink } from '@/components/pay/crypto/CryptoPaymentLink'
import { PayPage } from '@/components/pay/PayPage'
import { emitClick } from '@/lib/ui-signal'

const DEMO_SKILL = {
  skillId: 'demo-skill-001',
  skillName: 'API call · GPT-4 summary',
  price: 2.5,
  seller: 'demo-seller',
}

const DEMO_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

export default function PayLiveDemo() {
  const [receipt, setReceipt] = useState<string | null>(null)

  return (
    <section id="demo" className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 border-t border-border scroll-mt-14">
      <SectionHeader
        eyebrow="Try it live"
        title="Real components. Real Elements. No signup."
        subtitle="Every widget below is the exact component you ship in production. Play with them — the test card 4242 4242 4242 4242 works."
      />

      <div className="space-y-10">
        <DemoBlock
          num="01"
          eyebrow="Sui wallet"
          title="Pay with any Sui wallet"
          subtitle="Connect Sui Wallet, Ethos, or Nightly. Fee locks in USDC. Settled via testnet escrow."
        >
          <div className="flex justify-center">
            <PayPage
              skillId={DEMO_SKILL.skillId}
              skillName={DEMO_SKILL.skillName}
              price={DEMO_SKILL.price}
              seller={DEMO_SKILL.seller}
            />
          </div>
        </DemoBlock>

        <DemoBlock
          num="02"
          eyebrow="Stripe Elements"
          title="The full element library"
          subtitle="Seven Stripe Elements rendered in deferred mode. Pick the elements your flow actually needs; they compose."
        >
          <StripeElementsShowcase />
        </DemoBlock>

        <DemoBlock
          num="03"
          eyebrow="Full checkout"
          title="The integrated flow"
          subtitle="What /pay/card/[skillId] ships. Real PaymentIntent, webhook-driven path marking."
        >
          <StripeCheckoutDemo receipt={receipt} setReceipt={setReceipt} />
        </DemoBlock>

        <div className="grid md:grid-cols-2 gap-4">
          <DemoBlock
            num="04"
            eyebrow="Crypto link"
            title="Shareable URL + QR"
            subtitle="Expire in 1h or never. Drop it in any chat."
            compact
          >
            <CryptoPaymentLink sellerUid={DEMO_SKILL.seller} defaultCurrency="USDC" defaultAmount="10" />
          </DemoBlock>
          <DemoBlock
            num="05"
            eyebrow="Receive address"
            title="QR + currency picker"
            subtitle="Buyers scan with any wallet."
            compact
          >
            <CryptoAcceptAddress address={DEMO_ADDRESS} />
          </DemoBlock>
        </div>
      </div>
    </section>
  )
}

function DemoBlock({
  num,
  eyebrow,
  title,
  subtitle,
  compact,
  children,
}: {
  num: string
  eyebrow: string
  title: string
  subtitle?: string
  compact?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
      <header className={`flex items-start gap-4 px-6 ${compact ? 'py-4' : 'py-5'} border-b border-border`}>
        <span className="text-xs font-mono text-secondary-bright pt-0.5">§ {num}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{eyebrow}</div>
          <h3 className={`font-semibold text-foreground ${compact ? 'text-base' : 'text-xl'}`}>{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </header>
      <div className={compact ? 'p-4' : 'p-6'}>{children}</div>
    </div>
  )
}

function StripeCheckoutDemo({
  receipt,
  setReceipt,
}: {
  receipt: string | null
  setReceipt: (r: string | null) => void
}) {
  const items = [{ productId: DEMO_SKILL.skillId, quantity: 1 }]

  if (receipt) {
    return (
      <div className="rounded-xl border border-tertiary-bright/30 bg-tertiary-bright/10 p-6 max-w-2xl mx-auto">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-tertiary-bright/10 flex items-center justify-center text-tertiary-bright text-xl">
            ✓
          </div>
          <div>
            <h4 className="text-lg font-semibold text-tertiary-bright">Payment captured</h4>
            <p className="text-sm text-tertiary-bright/70">
              <code className="text-tertiary-bright">substrate:pay</code> fired · webhook will promote to captured.
            </p>
          </div>
        </div>
        <div className="rounded bg-background/30 border border-tertiary-bright/30 px-4 py-3 text-xs text-tertiary-bright font-mono break-all mb-4">
          ref: {receipt}
        </div>
        <button
          type="button"
          onClick={() => {
            emitClick('ui:pay:showcase:reset')
            setReceipt(null)
          }}
          className="text-sm text-[hsl(var(--color-primary-bright))] hover:text-[hsl(var(--color-primary-bright)/0.8)] inline-flex items-center gap-1"
        >
          Reset demo <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto rounded-xl border border-border bg-muted/40 p-6">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Skill</p>
          <p className="text-sm text-foreground font-medium">{DEMO_SKILL.skillName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-lg text-foreground font-semibold">${DEMO_SKILL.price.toFixed(2)}</p>
        </div>
      </div>
      <StripeCheckoutWrapper
        amount={Math.round(DEMO_SKILL.price * 100)}
        items={items}
        sellerUid={DEMO_SKILL.seller}
        metadata={{ skillId: DEMO_SKILL.skillId, skillName: DEMO_SKILL.skillName, surface: 'showcase' }}
        onSuccess={(id) => {
          emitClick('ui:pay:showcase:card-success', { id })
          setReceipt(id)
        }}
      />
    </div>
  )
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="text-center mb-10 space-y-2">
      <div className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--color-secondary-bright))]">{eyebrow}</div>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{title}</h2>
      {subtitle && <p className="text-base text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
    </header>
  )
}
