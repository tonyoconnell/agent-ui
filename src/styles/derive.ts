// Pure function: derive the full shadcn --color-* map from 6 brand tokens + mode.
// Source of truth: src/styles/global.css @theme and .dark blocks.

export interface BrandTokens {
  background: { light: string; dark: string }
  foreground: { light: string; dark: string }
  font:       { light: string; dark: string }
  primary:    { light: string; dark: string }
  secondary:  { light: string; dark: string }
  tertiary:   { light: string; dark: string }
}

// Default brand — ONE's canonical palette extracted from global.css.
export const defaultBrand: BrandTokens = {
  background: { light: '0 0% 100%',   dark: '0 0% 13%'  },
  foreground: { light: '0 0% 13%',    dark: '36 8% 96%' },
  font:       { light: '0 0% 13%',    dark: '0 0% 100%' },
  primary:    { light: '216 55% 25%', dark: '216 55% 25%' },
  secondary:  { light: '219 14% 28%', dark: '219 14% 32%' },
  tertiary:   { light: '105 22% 25%', dark: '105 22% 35%' },
}

// Pure function — given brand + mode, produce the full --color-* map.
// Keys are CSS custom property names without the leading `--color-` prefix.
// Values are HSL triple strings or HSL-with-alpha strings, byte-for-byte
// matching global.css.
export function deriveShadcn(
  brand: BrandTokens,
  mode: 'light' | 'dark',
): Record<string, string> {
  const isLight = mode === 'light'

  // Shorthand accessors for brand tokens.
  const bg   = brand.background[mode]
  const fg   = brand.foreground[mode]
  const font = brand.font[mode]
  const pri  = brand.primary[mode]
  const sec  = brand.secondary[mode]
  const ter  = brand.tertiary[mode]

  // Platform constants — same in both modes.
  const primaryFg       = '36 8% 96%'
  const secondaryFg     = '36 8% 96%'
  const tertiaryFg      = '36 8% 96%'
  const accentFg        = '36 8% 96%'
  const destructive     = '0 84% 60%'
  const border          = '0 0% 100% / 0.1'
  const input           = '0 0% 100% / 0.1'
  const sidebarBorder   = '0 0% 100% / 0.1'
  const gold            = '45 93% 47%'
  const goldFg          = '0 0% 0%'
  const urgencyStock    = '24 100% 50%'
  const urgencyOffer    = '142 71% 45%'
  const urgencyTimer    = '0 84% 60%'

  // Mode-specific derived values.
  const card              = isLight ? '0 0% 93.3%'  : '0 0% 10%'
  const cardFg            = fg
  const popover           = isLight ? '0 0% 93.3%'  : '0 0% 10%'
  const popoverFg         = fg
  const muted             = isLight ? '219 14% 92%' : '216 63% 17%'
  const mutedFg           = isLight ? '219 14% 30%' : '36 8% 80%'
  const destructiveFg     = isLight ? '0 0% 100%'   : '0 0% 98%'
  const ring              = isLight ? '216 63% 17%'  : '216 63% 68%'
  const overlay           = isLight ? '216 63% 17%'  : '0 0% 0%'
  const chart1            = isLight ? '216 55% 25%'  : '216 63% 68%'
  const chart2            = isLight ? '105 22% 32%'  : '105 22% 45%'
  const chart3            = isLight ? '219 14% 40%'  : '219 14% 38%'
  const chart4            = isLight ? '36 8% 55%'    : '36 8% 60%'
  const chart5            = isLight ? '0 0% 13%'     : '0 0% 96%'
  const sidebarBg         = isLight ? '0 0% 93.3%'   : '0 0% 10%'
  const sidebarFg         = fg
  const sidebarPri        = isLight ? '216 55% 25%'  : '216 63% 68%'
  const sidebarPriFg      = isLight ? '36 8% 96%'    : '0 0% 13%'
  const sidebarAcc        = sec
  const sidebarAccFg      = '36 8% 96%'
  const sidebarRing       = isLight ? '216 63% 17%'  : '216 63% 68%'

  return {
    'background':                  bg,
    'foreground':                  fg,
    'font':                        font,
    'card':                        card,
    'card-foreground':             cardFg,
    'popover':                     popover,
    'popover-foreground':          popoverFg,
    'primary':                     pri,
    'primary-foreground':          primaryFg,
    'secondary':                   sec,
    'secondary-foreground':        secondaryFg,
    'tertiary':                    ter,
    'tertiary-foreground':         tertiaryFg,
    'muted':                       muted,
    'muted-foreground':            mutedFg,
    'accent':                      ter,
    'accent-foreground':           accentFg,
    'destructive':                 destructive,
    'destructive-foreground':      destructiveFg,
    'border':                      border,
    'input':                       input,
    'ring':                        ring,
    'overlay':                     overlay,
    'chart-1':                     chart1,
    'chart-2':                     chart2,
    'chart-3':                     chart3,
    'chart-4':                     chart4,
    'chart-5':                     chart5,
    'sidebar-background':          sidebarBg,
    'sidebar-foreground':          sidebarFg,
    'sidebar-primary':             sidebarPri,
    'sidebar-primary-foreground':  sidebarPriFg,
    'sidebar-accent':              sidebarAcc,
    'sidebar-accent-foreground':   sidebarAccFg,
    'sidebar-border':              sidebarBorder,
    'sidebar-ring':                sidebarRing,
    'gold':                        gold,
    'gold-foreground':             goldFg,
    'urgency-stock':               urgencyStock,
    'urgency-offer':               urgencyOffer,
    'urgency-timer':               urgencyTimer,
  }
}
