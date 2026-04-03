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
  id: "ant",
  name: "Ant Colony",

  actor: "ant",
  group: "colony",
  flow: "trail",
  carrier: "scent",

  send: "forage",
  strengthen: "deposit",
  weaken: "alarm",
  decay: "evaporate",

  open: "highway",
  blocked: "toxic",
  closing: "fading",
  proven: "elite",
  atRisk: "lost",

  colors: {
    primary: "#84cc16",
    secondary: "#65a30d",
    success: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
    muted: "#4b5563",
    background: "#0a0f0a",
    surface: "#141f14",
  },

  icons: {
    actor: "🐜",
    group: "🏔️",
    flow: "~~~",
    entry: "🌱",
    open: "🛤️",
    blocked: "☠️",
    proven: "👑",
    atRisk: "⚠️",
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL NETWORK — Brain metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const brain: MetaphorSkin = {
  id: "brain",
  name: "Neural Network",

  actor: "neuron",
  group: "network",
  flow: "synapse",
  carrier: "impulse",

  send: "fire",
  strengthen: "potentiate",
  weaken: "inhibit",
  decay: "decay",

  open: "pathway",
  blocked: "dead",
  closing: "weakening",
  proven: "expert",
  atRisk: "damaged",

  colors: {
    primary: "#a855f7",
    secondary: "#9333ea",
    success: "#c084fc",
    warning: "#f59e0b",
    danger: "#f87171",
    muted: "#6b7280",
    background: "#0f0a1a",
    surface: "#1a1425",
  },

  icons: {
    actor: "🔮",
    group: "🧠",
    flow: "⚡",
    entry: "👁️",
    open: "💡",
    blocked: "💀",
    proven: "🎓",
    atRisk: "🔻",
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM / ORGANIZATION — Business metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const team: MetaphorSkin = {
  id: "team",
  name: "Organization",

  actor: "agent",
  group: "team",
  flow: "workflow",
  carrier: "task",

  send: "delegate",
  strengthen: "commend",
  weaken: "flag",
  decay: "forget",

  open: "go-to",
  blocked: "flagged",
  closing: "fading",
  proven: "star",
  atRisk: "struggling",

  colors: {
    primary: "#3b82f6",
    secondary: "#2563eb",
    success: "#60a5fa",
    warning: "#f59e0b",
    danger: "#f87171",
    muted: "#64748b",
    background: "#0a0a14",
    surface: "#161622",
  },

  icons: {
    actor: "👤",
    group: "🏢",
    flow: "→",
    entry: "📥",
    open: "⭐",
    blocked: "🚫",
    proven: "🏆",
    atRisk: "📉",
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIL / POSTAL — Message-passing metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const mail: MetaphorSkin = {
  id: "mail",
  name: "Postal System",

  actor: "mailbox",
  group: "office",
  flow: "route",
  carrier: "envelope",

  send: "deliver",
  strengthen: "stamp",
  weaken: "return",
  decay: "archive",

  open: "express",
  blocked: "returned",
  closing: "slow",
  proven: "priority",
  atRisk: "delayed",

  colors: {
    primary: "#f59e0b",
    secondary: "#d97706",
    success: "#fbbf24",
    warning: "#fb923c",
    danger: "#dc2626",
    muted: "#78716c",
    background: "#14100a",
    surface: "#1f1a14",
  },

  icons: {
    actor: "📬",
    group: "🏤",
    flow: "✉️",
    entry: "📮",
    open: "🚀",
    blocked: "↩️",
    proven: "📨",
    atRisk: "📭",
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// WATER / FLOW — Natural flow metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const water: MetaphorSkin = {
  id: "water",
  name: "Watershed",

  actor: "pool",
  group: "watershed",
  flow: "channel",
  carrier: "drop",

  send: "flow",
  strengthen: "carve",
  weaken: "dam",
  decay: "dry",

  open: "river",
  blocked: "dammed",
  closing: "drying",
  proven: "spring",
  atRisk: "stagnant",

  colors: {
    primary: "#06b6d4",
    secondary: "#0891b2",
    success: "#22d3ee",
    warning: "#facc15",
    danger: "#f87171",
    muted: "#71717a",
    background: "#0a1014",
    surface: "#14202a",
  },

  icons: {
    actor: "💧",
    group: "🌊",
    flow: "〰️",
    entry: "🌧️",
    open: "🏞️",
    blocked: "🚧",
    proven: "⛲",
    atRisk: "🏜️",
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL / RADIO — Communication metaphor
// ═══════════════════════════════════════════════════════════════════════════════

export const signal: MetaphorSkin = {
  id: "signal",
  name: "Signal Network",

  actor: "receiver",
  group: "network",
  flow: "frequency",
  carrier: "signal",

  send: "transmit",
  strengthen: "boost",
  weaken: "jam",
  decay: "attenuate",

  open: "clear",
  blocked: "jammed",
  closing: "weak",
  proven: "strong",
  atRisk: "noisy",

  colors: {
    primary: "#10b981",
    secondary: "#059669",
    success: "#34d399",
    warning: "#fbbf24",
    danger: "#f87171",
    muted: "#6b7280",
    background: "#0a140f",
    surface: "#142520",
  },

  icons: {
    actor: "📡",
    group: "🛰️",
    flow: "〜",
    entry: "📻",
    open: "📶",
    blocked: "📵",
    proven: "💪",
    atRisk: "📴",
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL SKINS
// ═══════════════════════════════════════════════════════════════════════════════

export const skins: Record<string, MetaphorSkin> = {
  ant,
  brain,
  team,
  mail,
  water,
  signal,
}

export const defaultSkin = team

// Helper to get a skin by ID
export const getSkin = (id: string): MetaphorSkin => skins[id] || defaultSkin

// ═══════════════════════════════════════════════════════════════════════════════
// ~200 lines. 6 metaphors. ONE truth.
// ═══════════════════════════════════════════════════════════════════════════════
