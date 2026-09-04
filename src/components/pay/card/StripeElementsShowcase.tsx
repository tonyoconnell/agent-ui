/**
 * StripeElementsShowcase — renders every Stripe Element side-by-side
 * under a shared dark ("night") appearance. Uses deferred payment mode
 * so no backend call is needed; each element is fully interactive in
 * the browser but does not actually charge.
 */

import {
  AddressElement,
  CardCvcElement,
  CardElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  ExpressCheckoutElement,
  LinkAuthenticationElement,
  PaymentElement,
  PaymentMethodMessagingElement,
} from '@stripe/react-stripe-js'
import { type Appearance, loadStripe, type Stripe, type StripeElementsOptions } from '@stripe/stripe-js'
import { useMemo } from 'react'
import { emitClick } from '@/lib/ui-signal'

let _stripePromise: Promise<Stripe | null> | null = null
function getStripe(): Promise<Stripe | null> {
  if (!_stripePromise) {
    const key = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.error('Missing PUBLIC_STRIPE_PUBLISHABLE_KEY — Stripe elements will not render')
      _stripePromise = Promise.resolve(null)
    } else {
      _stripePromise = loadStripe(key)
    }
  }
  return _stripePromise!
}

const nightAppearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: 'hsl(var(--color-secondary-bright))', // secondary-bright token
    colorBackground: 'hsl(var(--color-background))', // background token
    colorText: 'hsl(var(--color-foreground))', // foreground token
    colorDanger: 'hsl(var(--color-destructive))', // destructive token
    colorTextSecondary: 'hsl(var(--color-muted-foreground))', // muted-foreground token
    colorTextPlaceholder: 'hsl(var(--color-muted-foreground)/0.5)', // muted-foreground with opacity
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontSizeBase: '14px',
    spacingUnit: '4px',
    borderRadius: '10px',
  },
  rules: {
    '.Tab': { border: '1px solid hsl(var(--color-border))', backgroundColor: 'hsl(var(--color-card))' },
    '.Tab:hover': { backgroundColor: 'hsl(var(--color-background))', color: 'hsl(var(--color-foreground))' },
    '.Tab--selected': {
      borderColor: 'hsl(var(--color-secondary-bright))',
      backgroundColor: 'hsl(var(--color-secondary-bright)/0.1)',
    },
    '.Input': { border: '1px solid hsl(var(--color-border))', backgroundColor: 'hsl(var(--color-card))' },
    '.Input:focus': {
      borderColor: 'hsl(var(--color-secondary-bright))',
      boxShadow: '0 0 0 1px hsl(var(--color-secondary-bright))',
    },
    '.Input--invalid': { borderColor: 'hsl(var(--color-destructive))' },
    '.Label': { color: 'hsl(var(--color-muted-foreground))', fontSize: '12px', fontWeight: '500' },
    '.CheckboxInput--checked': {
      backgroundColor: 'hsl(var(--color-secondary-bright))',
      borderColor: 'hsl(var(--color-secondary-bright))',
    },
  },
}

// Classic-element style (CardElement / split cards use a different style API)
const classicElementStyle = {
  base: {
    fontSize: '15px',
    color: 'hsl(var(--color-foreground))',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    iconColor: 'hsl(var(--color-secondary-bright))',
    '::placeholder': { color: 'hsl(var(--color-muted-foreground))' },
  },
  invalid: { color: 'hsl(var(--color-destructive))', iconColor: 'hsl(var(--color-destructive))' },
}

interface SectionProps {
  num: string
  name: string
  what: string
  why?: string
  children: React.ReactNode
}

function ElementSection({ num, name, what, why, children }: SectionProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border bg-muted/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[hsl(var(--color-secondary-bright))]">
              {num}
            </span>
            <code className="text-sm font-semibold text-white">{name}</code>
          </div>
          <p className="text-sm text-muted-foreground">{what}</p>
          {why && <p className="text-xs text-muted-foreground mt-1 italic">{why}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function StripeElementsShowcase() {
  const stripePromise = getStripe()

  // Modern elements share one Elements provider in deferred payment mode
  const modernOpts: StripeElementsOptions = useMemo(
    () => ({
      mode: 'payment',
      amount: 2500, // $25.00 in cents
      currency: 'usd',
      appearance: nightAppearance,
      paymentMethodCreation: 'manual',
    }),
    [],
  )

  const messagingOpts: StripeElementsOptions = useMemo(
    () => ({
      appearance: nightAppearance,
    }),
    [],
  )

  const classicOpts: StripeElementsOptions = useMemo(
    () => ({
      appearance: nightAppearance,
    }),
    [],
  )

  return (
    <div className="space-y-6">
      {/* ── Modern Elements (shared provider, deferred mode) ─────────── */}
      <Elements stripe={stripePromise} options={modernOpts}>
        <ElementSection
          num="E01"
          name="ExpressCheckoutElement"
          what="One-tap wallets — Apple Pay, Google Pay, Stripe Link"
          why="Shows only the wallets the browser actually supports. Near-zero friction for returning buyers."
        >
          <ExpressCheckoutElement
            onConfirm={() => {
              emitClick('ui:pay:showcase:express-confirm')
            }}
            options={{ buttonHeight: 48, buttonType: { applePay: 'buy', googlePay: 'buy' } }}
          />
        </ElementSection>

        <ElementSection
          num="E02"
          name="LinkAuthenticationElement"
          what="Email gate that upgrades returning Stripe Link users to one-click"
          why="Drop this above card input — Stripe Link auto-fills the rest for 200M+ saved-card users."
        >
          <LinkAuthenticationElement
            options={{ defaultValues: { email: '' } }}
            onChange={() => {
              emitClick('ui:pay:showcase:link-email')
            }}
          />
        </ElementSection>

        <ElementSection
          num="E03"
          name="PaymentElement"
          what="The Swiss-army element: card, wallets, bank debits, BNPL — one tabbed UI"
          why="Default for new integrations. Ships every method Stripe enables on your account."
        >
          <PaymentElement
            options={{
              layout: { type: 'tabs', defaultCollapsed: false },
              wallets: { applePay: 'auto', googlePay: 'auto' },
            }}
          />
        </ElementSection>

        <ElementSection
          num="E04"
          name="AddressElement · shipping"
          what="Autocomplete address input with Google-style typeahead"
          why="Defaults to shipping mode; toggle to billing for card/tax use. Phone optional."
        >
          <AddressElement
            options={{
              mode: 'shipping',
              allowedCountries: ['US', 'CA', 'GB', 'IE', 'AU'],
              fields: { phone: 'always' },
              validation: { phone: { required: 'never' } },
            }}
          />
        </ElementSection>
      </Elements>

      {/* ── Messaging (own provider, no mode needed) ─────────────────── */}
      <Elements stripe={stripePromise} options={messagingOpts}>
        <ElementSection
          num="E05"
          name="PaymentMethodMessagingElement"
          what="BNPL explainer — Afterpay, Klarna, Affirm"
          why="Lift-in-cart banner. Shows '4 payments of $6.25 with Afterpay' below the price."
        >
          <div className="rounded-lg bg-card border border-border px-4 py-3">
            <PaymentMethodMessagingElement
              options={{
                amount: 2500,
                currency: 'USD',
                paymentMethodTypes: ['klarna', 'afterpay_clearpay', 'affirm'],
                countryCode: 'US',
              }}
            />
          </div>
        </ElementSection>
      </Elements>

      {/* ── Classic single-line card ─────────────────────────────────── */}
      <Elements stripe={stripePromise} options={classicOpts}>
        <ElementSection
          num="E06"
          name="CardElement (classic)"
          what="Single-line card input for minimal UIs"
          why="Pre-PaymentElement era. Still good for pure-card flows where you don't want tabs."
        >
          <div className="rounded-lg bg-card border border-border px-4 py-3.5 focus-within:border-[hsl(var(--color-secondary-bright))] transition-colors">
            <CardElement options={{ style: classicElementStyle, hidePostalCode: false }} />
          </div>
        </ElementSection>
      </Elements>

      {/* ── Classic split-card (separate provider) ───────────────────── */}
      <Elements stripe={stripePromise} options={classicOpts}>
        <ElementSection
          num="E07"
          name="Split Card Inputs"
          what="CardNumber · CardExpiry · CardCvc — build any layout"
          why="When your design system needs separate fields per row. Custom labels, custom spacing, full control."
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs text-muted-foreground mb-1.5 font-medium" htmlFor="card-number-el">
                Card number
              </label>
              <div
                id="card-number-el"
                className="rounded-lg bg-card border border-border px-3.5 py-3 focus-within:border-[hsl(var(--color-secondary-bright))] transition-colors"
              >
                <CardNumberElement options={{ style: classicElementStyle, showIcon: true }} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 font-medium" htmlFor="card-expiry-el">
                Expiry
              </label>
              <div
                id="card-expiry-el"
                className="rounded-lg bg-card border border-border px-3.5 py-3 focus-within:border-[hsl(var(--color-secondary-bright))] transition-colors"
              >
                <CardExpiryElement options={{ style: classicElementStyle }} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 font-medium" htmlFor="card-cvc-el">
                CVC
              </label>
              <div
                id="card-cvc-el"
                className="rounded-lg bg-card border border-border px-3.5 py-3 focus-within:border-[hsl(var(--color-secondary-bright))] transition-colors"
              >
                <CardCvcElement options={{ style: classicElementStyle }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Test: <code className="text-muted-foreground">4242 4242 4242 4242</code> · any future date · any 3-digit CVC
          </p>
        </ElementSection>
      </Elements>
    </div>
  )
}
