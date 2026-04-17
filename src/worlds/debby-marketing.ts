/**
 * src/worlds/debby-marketing.ts
 *
 * Elevare — Debby's autonomous English school on the ONE substrate.
 *
 * Org: Debby (board) → CEO → 4 Directors → 14 agents total
 * Student-facing: Concierge, Amara, Welcome, Support
 * Internal: CEO, 4 Directors, Content, Visibility, Assessment, Enrollment, Upsell
 *
 * Legacy marketing pod agents (ai-ranking, citation, etc.) retained for
 * SEO/visibility services. Now report to Director of Marketing via Visibility.
 *
 * Lifecycle:
 *   1. syncWorld(debbySchool)   → TypeDB units + skills + capabilities
 *   2. wireWorld(debbySchool)   → live runtime handlers via complete()
 *   3. seedAlliances()          → pre-drawn pheromone paths
 */

import type { WorldSpec } from '@/engine/agent-md'

// ═══════════════════════════════════════════════════════════════════════════
// SCHOOL AGENTS (new org structure)
// ═══════════════════════════════════════════════════════════════════════════

export const debbySchoolAgents = [
  // C-Suite
  'ceo',

  // Directors
  'edu', // Director of Education
  'mktg', // Director of Marketing
  'sales', // Director of Sales
  'community', // Director of Community

  // Student-facing
  'amara', // AI Tutor Practice Buddy
  'concierge', // First contact / placement
  'welcome', // Onboarding
  'support', // Billing, scheduling, tech help

  // Internal teams
  'content', // Marketing → content creation
  'visibility', // Marketing → SEO, AI citations
  'assessment', // Education → progress tracking
  'enrollment', // Sales → lead conversion
  'upsell', // Sales → upgrade offers
] as const

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY MARKETING POD (retained for SEO services)
// ═══════════════════════════════════════════════════════════════════════════

export const debbyMarketingAgents = [
  'ai-ranking',
  'citation',
  'forum',
  'full',
  'monthly',
  'niche-dir',
  'outreach',
  'quick',
  'schema',
  'social',
] as const

// ═══════════════════════════════════════════════════════════════════════════
// WORLD SPEC
// ═══════════════════════════════════════════════════════════════════════════

export const debbySchool: WorldSpec = {
  name: 'debby',
  description:
    'Elevare — autonomous English school. CEO + 4 directors + student-facing agents. ' +
    'Three pillars: Lingua (English), Rise (confidence), Flex Nexus (intensive). ' +
    'AI Tutor Amara at the heart. Founded by Debby, 10+ years teaching.',
  agents: [], // populated at runtime by loading agents/debby/*.md
}

// Backward compat
export const debbyMarketing = debbySchool

// ═══════════════════════════════════════════════════════════════════════════
// ALLIANCES (pheromone pre-seeding)
// ═══════════════════════════════════════════════════════════════════════════

/** School org hierarchy — warm start paths */
export const debbySchoolAlliances = [
  // CEO → Directors
  { from: 'ceo', to: 'edu', strength: 80, reason: 'CEO coordinates Education' },
  { from: 'ceo', to: 'mktg', strength: 80, reason: 'CEO coordinates Marketing' },
  { from: 'ceo', to: 'sales', strength: 80, reason: 'CEO coordinates Sales' },
  { from: 'ceo', to: 'community', strength: 80, reason: 'CEO coordinates Community' },

  // Student journey: Concierge → Enrollment → Welcome → Amara
  { from: 'concierge', to: 'enrollment', strength: 70, reason: 'qualified lead to conversion' },
  { from: 'enrollment', to: 'welcome', strength: 70, reason: 'new student to onboarding' },
  { from: 'welcome', to: 'amara', strength: 70, reason: 'onboarded student to practice' },

  // Education loop: Amara ↔ Assessment
  { from: 'amara', to: 'assessment', strength: 60, reason: 'session data to progress tracking' },
  { from: 'assessment', to: 'amara', strength: 40, reason: 'mastery data shapes next session' },
  { from: 'assessment', to: 'upsell', strength: 50, reason: 'progress milestone triggers upgrade' },

  // Marketing pipeline
  { from: 'mktg', to: 'content', strength: 60, reason: 'briefs to content creator' },
  { from: 'mktg', to: 'visibility', strength: 60, reason: 'briefs to SEO/citations' },
  { from: 'visibility', to: 'content', strength: 40, reason: 'citation gaps to content topics' },

  // Sales pipeline
  { from: 'sales', to: 'concierge', strength: 60, reason: 'distributes leads' },
  { from: 'sales', to: 'enrollment', strength: 60, reason: 'manages conversion' },
  { from: 'sales', to: 'upsell', strength: 60, reason: 'manages upgrades' },

  // Community loop
  { from: 'community', to: 'welcome', strength: 60, reason: 'manages onboarding' },
  { from: 'community', to: 'support', strength: 60, reason: 'manages support' },
  { from: 'support', to: 'community', strength: 40, reason: 'escalation to director' },

  // Cross-department signals
  { from: 'community', to: 'mktg', strength: 30, reason: 'testimonials feed marketing' },
  { from: 'community', to: 'edu', strength: 30, reason: 'churn data feeds curriculum' },
]

/** Legacy marketing pod alliances (retained) */
export const debbyMarketingAlliances = [
  { from: 'ai-ranking', to: 'citation', strength: 50, reason: 'flags gaps, fills them' },
  { from: 'citation', to: 'social', strength: 50, reason: 'NAP data feeds profile builder' },
  { from: 'citation', to: 'forum', strength: 50, reason: 'NAP data feeds outreach venues' },
  { from: 'citation', to: 'niche-dir', strength: 50, reason: 'batch sibling submissions' },
  { from: 'forum', to: 'outreach', strength: 50, reason: 'discovers venues, works them' },
  { from: 'outreach', to: 'quick', strength: 50, reason: 'feeds lead funnel' },
  { from: 'quick', to: 'full', strength: 50, reason: 'VSL hook upsells to full audit' },
  { from: 'ai-ranking', to: 'schema', strength: 50, reason: 'audit recommends schema gaps' },
  { from: 'full', to: 'schema', strength: 50, reason: 'audit recommends schema gaps' },
  { from: 'full', to: 'monthly', strength: 50, reason: 'full audit feeds retainer reports' },
  { from: 'monthly', to: 'schema', strength: 50, reason: 'monthly schema refreshes' },
]

export const ALLIANCE_STRENGTH = 50
