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
    colorPrimary: '#a78bfa', // violet-400
    colorBackground: '#18181b', // zinc-900
    colorText: '#f4f4f5', // zinc-100
    colorDanger: '#f87171', // red-400
    colorTextSecondary: '#a1a1aa', // zinc-400
    colorTextPlaceholder: '#52525b', // zinc-600
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontSizeBase: '14px',
    spacingUnit: '4px',
    borderRadius: '10px',
  },
  rules: {
    '.Tab': { border: '1px solid #27272a', backgroundColor: '#09090b' },
    '.Tab:hover': { backgroundColor: '#18181b', color: '#f4f4f5' },
    '.Tab--selected': { borderColor: '#a78bfa', backgroundColor: '#1e1b3a' },
    '.Input': { border: '1px solid #27272a', backgroundColor: '#09090b' },
    '.Input:focus': { borderColor: '#a78bfa', boxShadow: '0 0 0 1px #a78bfa' },
    '.Input--invalid': { borderColor: '#f87171' },
    '.Label': { color: '#a1a1aa', fontSize: '12px', fontWeight: '500' },
    '.CheckboxInput--checked': { backgroundColor: '#a78bfa', borderColor: '#a78bfa' },
  },
}

// Classic-element style (CardElement / split cards use a different style API)
const classicElementStyle = {
  base: {
    fontSize: '15px',
    color: '#f4f4f5',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    iconColor: '#a78bfa',
    '::placeholder': { color: '#52525b' },
  },
  invalid: { color: '#f87171', iconColor: '#f87171' },
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400">{num}</span>
            <code className="text-sm font-semibold text-white">{name}</code>
          </div>
          <p className="text-sm text-zinc-400">{what}</p>
          {why && <p className="text-xs text-zinc-500 mt-1 italic">{why}</p>}
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
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3">
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
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3.5 focus-within:border-violet-500 transition-colors">
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
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium" htmlFor="card-number-el">
                Card number
              </label>
              <div
                id="card-number-el"
                className="rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-3 focus-within:border-violet-500 transition-colors"
              >
                <CardNumberElement options={{ style: classicElementStyle, showIcon: true }} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium" htmlFor="card-expiry-el">
                Expiry
              </label>
              <div
                id="card-expiry-el"
                className="rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-3 focus-within:border-violet-500 transition-colors"
              >
                <CardExpiryElement options={{ style: classicElementStyle }} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium" htmlFor="card-cvc-el">
                CVC
              </label>
              <div
                id="card-cvc-el"
                className="rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-3 focus-within:border-violet-500 transition-colors"
              >
                <CardCvcElement options={{ style: classicElementStyle }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            Test: <code className="text-zinc-400">4242 4242 4242 4242</code> · any future date · any 3-digit CVC
          </p>
        </ElementSection>
      </Elements>
    </div>
  )
}
