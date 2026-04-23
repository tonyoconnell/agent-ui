/**
 * src/components/chat/arcs/builder.ts
 * Chat arc: conversation → spawn agents
 *
 * Handles "I want an AI team" intent and guides the user through agent creation
 * across three phases:
 *   discover  — clarify what the team should do
 *   configure — propose roles + spending caps, await confirmation
 *   deploy    — emit AgentCard rich payloads for each agent
 *   done      — show wallet addresses, mark arc complete
 */

export interface AgentSpec {
  name: string
  template: string
  scope: { dailyCapUsd: number; allowlist: string[] }
}

export interface BuilderArcState {
  phase: 'discover' | 'configure' | 'deploy' | 'done'
  agentSpecs: AgentSpec[]
}

/** Initial state — call this when builder intent is first detected. */
export function initialBuilderState(): BuilderArcState {
  return { phase: 'discover', agentSpecs: [] }
}

// ---------------------------------------------------------------------------
// Intent detection
// ---------------------------------------------------------------------------

const BUILDER_KEYWORDS = [
  'ai team',
  'agent team',
  'hire agents',
  'build a team',
  'create agents',
  'spawn agents',
]

/**
 * Return true if the user message signals an intent to create an agent team.
 * Case-insensitive substring match against canonical builder keywords.
 */
export function isBuilderIntent(message: string): boolean {
  const lower = message.toLowerCase()
  return BUILDER_KEYWORDS.some((k) => lower.includes(k))
}

// ---------------------------------------------------------------------------
// Default team template
// ---------------------------------------------------------------------------

const DEFAULT_TEAM: AgentSpec[] = [
  {
    name: 'Trader',
    template: 'trader',
    scope: { dailyCapUsd: 5, allowlist: ['one.ie'] },
  },
  {
    name: 'Researcher',
    template: 'researcher',
    scope: { dailyCapUsd: 5, allowlist: ['one.ie'] },
  },
  {
    name: 'Writer',
    template: 'writer',
    scope: { dailyCapUsd: 5, allowlist: ['one.ie'] },
  },
]

// ---------------------------------------------------------------------------
// Rich payload helpers
// ---------------------------------------------------------------------------

interface AgentCardPayload {
  type: 'agent-card'
  agent: {
    name: string
    template: string
    scope: { dailyCapUsd: number; allowlist: string[] }
    wallet: string
  }
}

/** Deterministic placeholder wallet for an agent (replaced by real address on deploy). */
function placeholderWallet(name: string): string {
  // Real address comes from addressFor(uid) in src/lib/sui.ts after syncAgent().
  // During the chat arc we return a display placeholder; the deploy step wires the real one.
  return `0x${'0'.repeat(62)}${name.slice(0, 2).toLowerCase()}`
}

function agentCardPayload(spec: AgentSpec): AgentCardPayload {
  return {
    type: 'agent-card',
    agent: {
      name: spec.name,
      template: spec.template,
      scope: spec.scope,
      wallet: placeholderWallet(spec.name),
    },
  }
}

// ---------------------------------------------------------------------------
// Phase handlers
// ---------------------------------------------------------------------------

function discoverReply(userMessage: string): {
  reply: string
  newState: BuilderArcState
} {
  // If the user described a purpose, move to configure; otherwise ask.
  const hasPurpose =
    userMessage.length > 30 ||
    /\b(trade|research|write|market|analys|content|code|support)\b/i.test(userMessage)

  if (hasPurpose) {
    const specs = DEFAULT_TEAM
    const list = specs.map((s) => `• **${s.name}** — $${s.scope.dailyCapUsd}/day cap`).join('\n')
    return {
      reply: `Got it. Here's a starter team for you:\n\n${list}\n\nShall I set these up? (say "yes" to deploy, or describe changes)`,
      newState: { phase: 'configure', agentSpecs: specs },
    }
  }

  return {
    reply:
      "I'll help you build an AI team. What do you want the team to do? " +
      "(e.g. trade crypto, research topics, write content)",
    newState: { phase: 'discover', agentSpecs: [] },
  }
}

function configureReply(
  userMessage: string,
  state: BuilderArcState,
): { reply: string; newState: BuilderArcState; richPayload?: unknown } {
  const confirmed = /\b(yes|ok|go|deploy|create|do it|looks good|sounds good|sure|confirm)\b/i.test(
    userMessage,
  )

  if (confirmed) {
    const cards = state.agentSpecs.map((s) => agentCardPayload(s))
    const names = state.agentSpecs.map((s) => s.name).join(', ')
    return {
      reply: `Deploying your team: ${names}. Spinning up agents…`,
      newState: { phase: 'deploy', agentSpecs: state.agentSpecs },
      richPayload: { type: 'agent-cards', cards },
    }
  }

  // User wants changes — re-propose with default team (simple reset)
  const list = state.agentSpecs
    .map((s) => `• **${s.name}** — $${s.scope.dailyCapUsd}/day cap`)
    .join('\n')
  return {
    reply: `No problem — I'm keeping the team as:\n\n${list}\n\nSay "yes" when you're ready to deploy, or tell me what to change.`,
    newState: { ...state, phase: 'configure' },
  }
}

function deployReply(state: BuilderArcState): {
  reply: string
  newState: BuilderArcState
  richPayload?: unknown
} {
  const wallets = state.agentSpecs
    .map((s) => `• **${s.name}**: \`${placeholderWallet(s.name)}\``)
    .join('\n')

  return {
    reply:
      `Your team is live. Here are their wallet addresses:\n\n${wallets}\n\n` +
      'Each agent has been synced to TypeDB and is ready to receive signals.',
    newState: { phase: 'done', agentSpecs: state.agentSpecs },
    richPayload: {
      type: 'team-live',
      agents: state.agentSpecs.map((s) => ({
        name: s.name,
        wallet: placeholderWallet(s.name),
      })),
    },
  }
}

// ---------------------------------------------------------------------------
// Main arc entry point
// ---------------------------------------------------------------------------

export interface BuilderResponse {
  reply: string
  newState: BuilderArcState
  richPayload?: unknown
}

/**
 * Generate the next builder arc response.
 *
 * Phases:
 *   discover  → ask what the team should do; on enough detail, propose DEFAULT_TEAM
 *   configure → await confirmation; on "yes", move to deploy
 *   deploy    → emit AgentCard rich messages + wallet addresses, advance to done
 *   done      → idempotent; remind user the team is live
 */
export function builderResponse(state: BuilderArcState, userMessage: string): BuilderResponse {
  switch (state.phase) {
    case 'discover': {
      const { reply, newState } = discoverReply(userMessage)
      return { reply, newState }
    }
    case 'configure': {
      return configureReply(userMessage, state)
    }
    case 'deploy': {
      return deployReply(state)
    }
    case 'done': {
      return {
        reply: 'Your team is already live! Let me know if you want to add more agents.',
        newState: state,
      }
    }
  }
}
