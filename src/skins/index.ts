/**
 * METAPHOR SKINS — Same data, different views
 *
 * The ontology is ONE. The skins are many.
 *
 * Switch metaphors to change:
 * - Labels (actor → ant, neuron, agent, mailbox, pool, receiver)
 * - Colors (green for ants, purple for brain, blue for team)
 * - Icons (emoji or SVG)
 * - Terminology throughout the UI
 *
 * Same TypeDB data. Same inference. Different meaning.
 */

export interface MetaphorSkin {
  id: string
  name: string

  // Entity labels
  actor: string
  group: string
  flow: string
  carrier: string

  // Action labels
  send: string
  strengthen: string
  weaken: string
  decay: string

  // Status labels
  open: string
  blocked: string
  closing: string
  proven: string
  atRisk: string

  // Colors
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    danger: string
    muted: string
    background: string
    surface: string
  }

  // Icons (emoji)
  icons: {
    actor: string
    group: string
    flow: string
    entry: string
    open: string
    blocked: string
    proven: string
    atRisk: string
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANT COLONY — The original inspiration
// ═══════════════════════════════════════════════════════════════════════════════

export const ant: MetaphorSkin = {
  id: 'ant',
  name: 'Ant Colony',

  actor: 'ant',
  group: 'colony',
  flow: 'trail',
  carrier: 'scent',

  send: 'forage',
  strengthen: 'deposit',
  weaken: 'alarm',
  decay: 'evaporate',

  open: 'highway',
  blocked: 'toxic',
  closing: 'fading',
  proven: 'elite',
  atRisk: 'lost',

  colors: {
    primary: 'hsl(var(--color-tertiary-bright))',
    secondary: 'hsl(var(--color-tertiary-bright) / 0.8)',
    success: 'hsl(var(--color-tertiary-bright))',
    warning: 'hsl(var(--color-gold))',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '🐜',
    group: '🏔️',
    flow: '~~~',
    entry: '🌱',
    open: '🛤️',
    blocked: '☠️',
    proven: '👑',
    atRisk: '⚠️',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL NETWORK — Brain metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const brain: MetaphorSkin = {
  id: 'brain',
  name: 'Neural Network',

  actor: 'neuron',
  group: 'network',
  flow: 'synapse',
  carrier: 'impulse',

  send: 'fire',
  strengthen: 'potentiate',
  weaken: 'inhibit',
  decay: 'decay',

  open: 'pathway',
  blocked: 'dead',
  closing: 'weakening',
  proven: 'expert',
  atRisk: 'damaged',

  colors: {
    primary: 'hsl(var(--color-secondary-bright))',
    secondary: 'hsl(var(--color-secondary-bright) / 0.8)',
    success: 'hsl(var(--color-secondary-bright) / 0.7)',
    warning: 'hsl(var(--color-gold))',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '🔮',
    group: '🧠',
    flow: '⚡',
    entry: '👁️',
    open: '💡',
    blocked: '💀',
    proven: '🎓',
    atRisk: '🔻',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM / ORGANIZATION — Business metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const team: MetaphorSkin = {
  id: 'team',
  name: 'Organization',

  actor: 'agent',
  group: 'team',
  flow: 'workflow',
  carrier: 'task',

  send: 'delegate',
  strengthen: 'commend',
  weaken: 'flag',
  decay: 'forget',

  open: 'go-to',
  blocked: 'flagged',
  closing: 'fading',
  proven: 'star',
  atRisk: 'struggling',

  colors: {
    primary: 'hsl(var(--color-primary-bright))',
    secondary: 'hsl(var(--color-primary-bright) / 0.8)',
    success: 'hsl(var(--color-primary-bright) / 0.7)',
    warning: 'hsl(var(--color-gold))',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '👤',
    group: '🏢',
    flow: '→',
    entry: '📥',
    open: '⭐',
    blocked: '🚫',
    proven: '🏆',
    atRisk: '📉',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIL / POSTAL — Message-passing metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const mail: MetaphorSkin = {
  id: 'mail',
  name: 'Postal System',

  actor: 'mailbox',
  group: 'office',
  flow: 'route',
  carrier: 'envelope',

  send: 'deliver',
  strengthen: 'stamp',
  weaken: 'return',
  decay: 'archive',

  open: 'express',
  blocked: 'returned',
  closing: 'slow',
  proven: 'priority',
  atRisk: 'delayed',

  colors: {
    primary: 'hsl(var(--color-gold))',
    secondary: 'hsl(var(--color-gold) / 0.8)',
    success: 'hsl(var(--color-gold) / 0.9)',
    warning: 'hsl(var(--color-gold) / 0.7)',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '📬',
    group: '🏤',
    flow: '✉️',
    entry: '📮',
    open: '🚀',
    blocked: '↩️',
    proven: '📨',
    atRisk: '📭',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// WATER / FLOW — Natural flow metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const water: MetaphorSkin = {
  id: 'water',
  name: 'Watershed',

  actor: 'pool',
  group: 'watershed',
  flow: 'channel',
  carrier: 'drop',

  send: 'flow',
  strengthen: 'carve',
  weaken: 'dam',
  decay: 'dry',

  open: 'river',
  blocked: 'dammed',
  closing: 'drying',
  proven: 'spring',
  atRisk: 'stagnant',

  colors: {
    primary: 'hsl(var(--color-primary-bright))',
    secondary: 'hsl(var(--color-primary-bright) / 0.8)',
    success: 'hsl(var(--color-primary-bright) / 0.7)',
    warning: 'hsl(var(--color-gold))',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '💧',
    group: '🌊',
    flow: '〰️',
    entry: '🌧️',
    open: '🏞️',
    blocked: '🚧',
    proven: '⛲',
    atRisk: '🏜️',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL / RADIO — Communication metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const signal: MetaphorSkin = {
  id: 'signal',
  name: 'Signal Network',

  actor: 'receiver',
  group: 'network',
  flow: 'frequency',
  carrier: 'signal',

  send: 'transmit',
  strengthen: 'boost',
  weaken: 'jam',
  decay: 'attenuate',

  open: 'clear',
  blocked: 'jammed',
  closing: 'weak',
  proven: 'strong',
  atRisk: 'noisy',

  colors: {
    primary: 'hsl(var(--color-tertiary-bright))',
    secondary: 'hsl(var(--color-tertiary-bright) / 0.8)',
    success: 'hsl(var(--color-tertiary-bright) / 0.7)',
    warning: 'hsl(var(--color-gold))',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '📡',
    group: '🛰️',
    flow: '〜',
    entry: '📻',
    open: '📶',
    blocked: '📵',
    proven: '💪',
    atRisk: '📴',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONA SKINS — 7 user-persona vocabularies over the same substrate math
//
// CEO/Dev/Investor/Gamer/Kid/Freelancer/Agent each see the same strength/
// resistance arithmetic through a different vocabulary lens.
// mark() → commend / deposit / earn / cheer / strengthen
// warn() → flag / alarm / lose / boo / weaken
// fade() → forget / evaporate / depreciate / fade / cool
// ═══════════════════════════════════════════════════════════════════════════════

// CEO — Your AI Team (commend/flag/delegate, business outcomes)
export const ceo: MetaphorSkin = {
  id: 'ceo',
  name: 'CEO',

  actor: 'agent',
  group: 'team',
  flow: 'delegation',
  carrier: 'task',

  send: 'delegate',
  strengthen: 'commend',
  weaken: 'flag',
  decay: 'forget',

  open: 'go-to',
  blocked: 'fired',
  closing: 'at-risk',
  proven: 'star',
  atRisk: 'struggling',

  colors: {
    primary: 'hsl(var(--color-primary-bright))',
    secondary: 'hsl(var(--color-primary-bright) / 0.8)',
    success: 'hsl(var(--color-primary-bright) / 0.7)',
    warning: 'hsl(var(--color-gold))',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '👤',
    group: '🏢',
    flow: '→',
    entry: '📋',
    open: '⭐',
    blocked: '🚫',
    proven: '🏆',
    atRisk: '📉',
  },
}

// Dev — Signal Routing and Weighted Graphs (mark/warn/fade, substrate-native)
export const dev: MetaphorSkin = {
  id: 'dev',
  name: 'Developer',

  actor: 'unit',
  group: 'world',
  flow: 'signal',
  carrier: 'data',

  send: 'signal',
  strengthen: 'mark',
  weaken: 'warn',
  decay: 'fade',

  open: 'highway',
  blocked: 'toxic',
  closing: 'fading',
  proven: 'routed',
  atRisk: 'warned',

  colors: {
    primary: 'hsl(var(--color-primary-bright))',
    secondary: 'hsl(var(--color-primary-bright) / 0.8)',
    success: 'hsl(var(--color-tertiary-bright))',
    warning: 'hsl(var(--color-gold))',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '⬡',
    group: '🌐',
    flow: '~',
    entry: '→',
    open: '⚡',
    blocked: '☠️',
    proven: '💎',
    atRisk: '⚠️',
  },
}

// Investor — Revenue Paths and Compound Returns (earn/lose/depreciate, ROI framing)
export const investor: MetaphorSkin = {
  id: 'investor',
  name: 'Investor',

  actor: 'asset',
  group: 'portfolio',
  flow: 'revenue',
  carrier: 'payment',

  send: 'invest',
  strengthen: 'earn',
  weaken: 'lose',
  decay: 'depreciate',

  open: 'performing',
  blocked: 'toxic-asset',
  closing: 'declining',
  proven: 'highway',
  atRisk: 'at-risk',

  colors: {
    primary: 'hsl(var(--color-gold))',
    secondary: 'hsl(var(--color-gold) / 0.8)',
    success: 'hsl(var(--color-gold) / 0.9)',
    warning: 'hsl(var(--color-gold) / 0.7)',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '💼',
    group: '📊',
    flow: '💸',
    entry: '📈',
    open: '✅',
    blocked: '❌',
    proven: '🏅',
    atRisk: '📉',
  },
}

// Gamer — Ants, Trails, and Emergent Colonies (deposit/alarm/evaporate, game metaphor)
export const gamer: MetaphorSkin = {
  id: 'gamer',
  name: 'Gamer',

  actor: 'ant',
  group: 'colony',
  flow: 'trail',
  carrier: 'scent',

  send: 'forage',
  strengthen: 'deposit',
  weaken: 'alarm',
  decay: 'evaporate',

  open: 'trail',
  blocked: 'poisoned',
  closing: 'fading',
  proven: 'super-trail',
  atRisk: 'alarmed',

  colors: {
    primary: 'hsl(var(--color-tertiary-bright))',
    secondary: 'hsl(var(--color-tertiary-bright) / 0.8)',
    success: 'hsl(var(--color-tertiary-bright) / 0.7)',
    warning: 'hsl(var(--color-gold))',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '🐜',
    group: '🏔️',
    flow: '~~~',
    entry: '🌱',
    open: '🛤️',
    blocked: '☠️',
    proven: '👑',
    atRisk: '⚠️',
  },
}

// Kid — Ants Finding Food (smell/yucky/sun, friendly language)
export const kid: MetaphorSkin = {
  id: 'kid',
  name: 'Kid',

  actor: 'helper',
  group: 'friends',
  flow: 'path',
  carrier: 'message',

  send: 'share',
  strengthen: 'cheer',
  weaken: 'boo',
  decay: 'forget',

  open: 'favourite',
  blocked: 'naughty',
  closing: 'sleepy',
  proven: 'best-friend',
  atRisk: 'struggling',

  colors: {
    primary: 'hsl(var(--color-gold))',
    secondary: 'hsl(var(--color-gold) / 0.8)',
    success: 'hsl(var(--color-tertiary-bright))',
    warning: 'hsl(var(--color-gold) / 0.7)',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '🐜',
    group: '🏡',
    flow: '...',
    entry: '🌸',
    open: '⭐',
    blocked: '🚫',
    proven: '🌟',
    atRisk: '😟',
  },
}

// Freelancer — Offer Skills, Earn Tokens (commend/flag/fade, marketplace framing)
export const freelancer: MetaphorSkin = {
  id: 'freelancer',
  name: 'Freelancer',

  actor: 'worker',
  group: 'marketplace',
  flow: 'gig',
  carrier: 'job',

  send: 'accept',
  strengthen: 'commend',
  weaken: 'flag',
  decay: 'cool-off',

  open: 'top-rated',
  blocked: 'flagged',
  closing: 'declining',
  proven: 'highway',
  atRisk: 'at-risk',

  colors: {
    primary: 'hsl(var(--color-secondary-bright))',
    secondary: 'hsl(var(--color-secondary-bright) / 0.8)',
    success: 'hsl(var(--color-secondary-bright) / 0.7)',
    warning: 'hsl(var(--color-gold))',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '🧑‍💻',
    group: '🛒',
    flow: '📦',
    entry: '📥',
    open: '⭐',
    blocked: '🚫',
    proven: '🏆',
    atRisk: '📉',
  },
}

// Agent — The Primitive (emit/mark/warn/fade, raw substrate vocabulary)
export const agent: MetaphorSkin = {
  id: 'agent',
  name: 'Agent',

  actor: 'unit',
  group: 'substrate',
  flow: 'signal',
  carrier: 'payload',

  send: 'emit',
  strengthen: 'mark',
  weaken: 'warn',
  decay: 'fade',

  open: 'highway',
  blocked: 'toxic',
  closing: 'dissolving',
  proven: 'hardened',
  atRisk: 'warned',

  colors: {
    primary: 'hsl(var(--color-gold))',
    secondary: 'hsl(var(--color-gold) / 0.8)',
    success: 'hsl(var(--color-gold) / 0.7)',
    warning: 'hsl(var(--color-gold) / 0.9)',
    danger: 'hsl(var(--color-destructive))',
    muted: 'hsl(var(--color-muted-foreground))',
    background: 'hsl(var(--color-background))',
    surface: 'hsl(var(--color-card))',
  },

  icons: {
    actor: '⬡',
    group: '🌐',
    flow: '~',
    entry: '📡',
    open: '⚡',
    blocked: '☠️',
    proven: '🔒',
    atRisk: '⚠️',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL SKINS — 6 metaphors + 7 personas = 13 total views of ONE truth
// ═══════════════════════════════════════════════════════════════════════════════

export const skins: Record<string, MetaphorSkin> = {
  // Metaphor skins (how it works)
  ant,
  brain,
  team,
  mail,
  water,
  signal,
  // Persona skins (who you are)
  ceo,
  dev,
  investor,
  gamer,
  kid,
  freelancer,
  agent,
}

export const defaultSkin = team

// Helper to get a skin by ID
export const getSkin = (id: string): MetaphorSkin => skins[id] || defaultSkin

// Persona skin IDs for UI routing
export const PERSONA_SKIN_IDS = ['ceo', 'dev', 'investor', 'gamer', 'kid', 'freelancer', 'agent'] as const
export type PersonaSkinId = (typeof PERSONA_SKIN_IDS)[number]

// ═══════════════════════════════════════════════════════════════════════════════
// 13 skins. 7 personas. ONE formula. Same math, different words.
// ═══════════════════════════════════════════════════════════════════════════════
