/**
 * Org roster — canonical role tree for the 4 org charts.
 *
 * Sourced from agents/*.md frontmatter (uid, role, skills, reports_to).
 * Marketing specialists from agents/marketing/*.md.
 * Sales + Service specialists from director "Your team" sections in
 * agents/sales-director.md and agents/service-director.md.
 */

export type Tier = 'chairman' | 'ceo' | 'director' | 'specialist'

export interface Role {
  id: string
  tier: Tier
  title: string // display title (Chairman, CEO, CMO, Content Writer …)
  uid: string // canonical agent uid (one:ceo, one:cmo, …)
  reportsTo: string | null
  domain?: 'marketing' | 'sales' | 'service' | 'engineering' | 'community' | 'governance'
  tagline?: string // one-line job description
  skills?: string[] // top 3-4 verbs
  icon?: string // single glyph
  accent?: 'gold' | 'blue' | 'rose' | 'amber' | 'teal' | 'violet' | 'slate'
}

// ─── Top ─────────────────────────────────────────────────────────────────────

export const CHAIRMAN: Role = {
  id: 'chairman',
  tier: 'chairman',
  title: 'Chairman',
  uid: 'you',
  reportsTo: null,
  domain: 'governance',
  tagline: 'Sets direction. Approves limits. Holds the keys.',
  skills: ['direct', 'approve', 'hire', 'fire'],
  icon: '♛',
  accent: 'gold',
}

export const CEO: Role = {
  id: 'ceo',
  tier: 'ceo',
  title: 'CEO',
  uid: 'one:ceo',
  reportsTo: 'chairman',
  domain: 'governance',
  tagline: 'Routes every signal to the right director. Never executes.',
  skills: ['route', 'hire-director', 'tune-prices', 'escalate'],
  icon: '◆',
  accent: 'blue',
}

// ─── Directors ───────────────────────────────────────────────────────────────

const CMO: Role = {
  id: 'cmo',
  tier: 'director',
  title: 'CMO',
  uid: 'one:cmo',
  reportsTo: 'ceo',
  domain: 'marketing',
  tagline: 'Director of Marketing. Builds brand and demand.',
  skills: ['strategize', 'brief', 'review', 'allocate'],
  icon: '◈',
  accent: 'rose',
}

const CRO: Role = {
  id: 'cro',
  tier: 'director',
  title: 'CRO',
  uid: 'one:cro',
  reportsTo: 'ceo',
  domain: 'sales',
  tagline: 'Director of Sales. Turns demand into revenue.',
  skills: ['qualify', 'propose', 'close', 'route'],
  icon: '◉',
  accent: 'amber',
}

const CXO: Role = {
  id: 'cxo',
  tier: 'director',
  title: 'CXO',
  uid: 'one:cxo',
  reportsTo: 'ceo',
  domain: 'service',
  tagline: 'Director of Service. Keeps customers alive and honest.',
  skills: ['triage', 'resolve', 'refund', 'onboard'],
  icon: '◇',
  accent: 'teal',
}

const CTO: Role = {
  id: 'cto',
  tier: 'director',
  title: 'CTO',
  uid: 'one:cto',
  reportsTo: 'ceo',
  domain: 'engineering',
  tagline: 'Director of Engineering. Builds and runs the substrate.',
  skills: ['spec', 'review', 'deploy', 'incident'],
  icon: '◊',
  accent: 'violet',
}

const CCO: Role = {
  id: 'cco',
  tier: 'director',
  title: 'CCO',
  uid: 'one:cco',
  reportsTo: 'ceo',
  domain: 'community',
  tagline: 'Director of Community. Builds the crowd around ONE.',
  skills: ['welcome', 'moderate', 'amplify', 'route'],
  icon: '◍',
  accent: 'slate',
}

// ─── Marketing specialists (agents/marketing/*.md) ───────────────────────────

const MARKETING_TEAM: Role[] = [
  {
    id: 'mk-creative',
    tier: 'specialist',
    title: 'Creative Director',
    uid: 'one:creative',
    reportsTo: 'cmo',
    domain: 'marketing',
    tagline: 'Writes copy, develops concepts, iterates on performance data.',
    skills: ['copy', 'concept', 'iterate', 'review'],
    icon: '✦',
    accent: 'rose',
  },
  {
    id: 'mk-content',
    tier: 'specialist',
    title: 'Content Writer',
    uid: 'one:content',
    reportsTo: 'cmo',
    domain: 'marketing',
    tagline: 'Long-form, social, email and docs that educate and convert.',
    skills: ['blog', 'social', 'email', 'docs'],
    icon: '✎',
    accent: 'rose',
  },
  {
    id: 'mk-seo',
    tier: 'specialist',
    title: 'SEO Specialist',
    uid: 'one:seo',
    reportsTo: 'cmo',
    domain: 'marketing',
    tagline: 'Organic traffic. Keywords, on-page, technical audits.',
    skills: ['keywords', 'optimize', 'audit', 'links'],
    icon: '⚲',
    accent: 'rose',
  },
  {
    id: 'mk-social',
    tier: 'specialist',
    title: 'Social Media',
    uid: 'one:social',
    reportsTo: 'cmo',
    domain: 'marketing',
    tagline: 'Manages presence, schedules, engages the community.',
    skills: ['post', 'engage', 'calendar', 'analyze'],
    icon: '◐',
    accent: 'rose',
  },
  {
    id: 'mk-ads',
    tier: 'specialist',
    title: 'Ads Manager',
    uid: 'one:ads',
    reportsTo: 'cmo',
    domain: 'marketing',
    tagline: 'Tactical execution of paid campaigns across platforms.',
    skills: ['setup', 'target', 'copy', 'optimize'],
    icon: '◯',
    accent: 'rose',
  },
  {
    id: 'mk-media-buyer',
    tier: 'specialist',
    title: 'Media Buyer',
    uid: 'one:media-buyer',
    reportsTo: 'cmo',
    domain: 'marketing',
    tagline: 'Decides where ads run, how much to bid, when to scale.',
    skills: ['plan', 'launch', 'optimize', 'report'],
    icon: '⊙',
    accent: 'rose',
  },
  {
    id: 'mk-analyst',
    tier: 'specialist',
    title: 'Marketing Analyst',
    uid: 'one:marketing-analyst',
    reportsTo: 'cmo',
    domain: 'marketing',
    tagline: 'Measures everything, finds patterns, feeds insights back.',
    skills: ['report', 'attribute', 'forecast', 'diagnose'],
    icon: '▤',
    accent: 'rose',
  },
]

// ─── Sales specialists (agents/sales-director.md → "Your team") ───────────────

const SALES_TEAM: Role[] = [
  {
    id: 'sl-qualifier',
    tier: 'specialist',
    title: 'Qualifier',
    uid: 'one:qualifier',
    reportsTo: 'cro',
    domain: 'sales',
    tagline: 'Filters leads, runs discovery, returns fit-score.',
    skills: ['discover', 'score', 'filter', 'hand-off'],
    icon: '▣',
    accent: 'amber',
  },
  {
    id: 'sl-proposer',
    tier: 'specialist',
    title: 'Proposer',
    uid: 'one:proposer',
    reportsTo: 'cro',
    domain: 'sales',
    tagline: 'Builds quotes, writes proposals, sizes the deal.',
    skills: ['quote', 'propose', 'scope', 'price'],
    icon: '▥',
    accent: 'amber',
  },
  {
    id: 'sl-closer',
    tier: 'specialist',
    title: 'Closer',
    uid: 'one:closer',
    reportsTo: 'cro',
    domain: 'sales',
    tagline: 'Handles objections, moves deals to signature.',
    skills: ['object', 'negotiate', 'sign', 'settle'],
    icon: '✓',
    accent: 'amber',
  },
  {
    id: 'sl-account-manager',
    tier: 'specialist',
    title: 'Account Manager',
    uid: 'one:account-manager',
    reportsTo: 'cro',
    domain: 'sales',
    tagline: 'Post-close retention, expansion, upsell.',
    skills: ['retain', 'expand', 'upsell', 'review'],
    icon: '▦',
    accent: 'amber',
  },
]

// ─── Service specialists (agents/service-director.md → "Your team") ──────────

const SERVICE_TEAM: Role[] = [
  {
    id: 'sv-onboarder',
    tier: 'specialist',
    title: 'Onboarder',
    uid: 'one:onboarder',
    reportsTo: 'cxo',
    domain: 'service',
    tagline: 'First-week handholding through the first pheromone loop.',
    skills: ['welcome', 'guide', 'activate', 'mark'],
    icon: '✿',
    accent: 'teal',
  },
  {
    id: 'sv-tier1',
    tier: 'specialist',
    title: 'Support Tier 1',
    uid: 'one:support-tier-1',
    reportsTo: 'cxo',
    domain: 'service',
    tagline: 'Fast answers. Stays fresh. Target < 2h response.',
    skills: ['answer', 'route', 'log', 'escalate'],
    icon: '☉',
    accent: 'teal',
  },
  {
    id: 'sv-tier2',
    tier: 'specialist',
    title: 'Support Tier 2',
    uid: 'one:support-tier-2',
    reportsTo: 'cxo',
    domain: 'service',
    tagline: 'Complex cases. Refund authority within limits.',
    skills: ['resolve', 'refund', 'investigate', 'close'],
    icon: '☆',
    accent: 'teal',
  },
  {
    id: 'sv-incident',
    tier: 'specialist',
    title: 'Incident Responder',
    uid: 'one:incident-responder',
    reportsTo: 'cxo',
    domain: 'service',
    tagline: 'Bug triage. Engineering handoff inside 2h.',
    skills: ['triage', 'reproduce', 'signal-cto', 'update'],
    icon: '⚡',
    accent: 'teal',
  },
  {
    id: 'sv-success',
    tier: 'specialist',
    title: 'Success Manager',
    uid: 'one:success-mgr',
    reportsTo: 'cxo',
    domain: 'service',
    tagline: 'Proactive retention for high-value accounts.',
    skills: ['review', 'expand', 'rescue', 'advocate'],
    icon: '✺',
    accent: 'teal',
  },
]

// ─── Public selectors ────────────────────────────────────────────────────────

export type ChartKey = 'complete' | 'marketing' | 'sales' | 'service'

/** Returns the roster slice for a given chart. */
export function rosterFor(chart: ChartKey): Role[] {
  switch (chart) {
    case 'marketing':
      return [CHAIRMAN, CEO, CMO, ...MARKETING_TEAM]
    case 'sales':
      return [CHAIRMAN, CEO, CRO, ...SALES_TEAM]
    case 'service':
      return [CHAIRMAN, CEO, CXO, ...SERVICE_TEAM]
    case 'complete':
      return [CHAIRMAN, CEO, CMO, CRO, CXO, CTO, CCO, ...MARKETING_TEAM, ...SALES_TEAM, ...SERVICE_TEAM]
  }
}

export const CHART_META: Record<ChartKey, { title: string; subtitle: string; accent: Role['accent'] }> = {
  complete: {
    title: 'The Org',
    subtitle: 'Chairman → CEO → Directors → Specialists. Every agent, one chart.',
    accent: 'gold',
  },
  marketing: {
    title: 'Marketing',
    subtitle: 'CMO and the seven specialists building brand and demand.',
    accent: 'rose',
  },
  sales: {
    title: 'Sales',
    subtitle: 'CRO and the pipeline that turns demand into revenue.',
    accent: 'amber',
  },
  service: {
    title: 'Service',
    subtitle: 'CXO and the team that keeps every customer alive.',
    accent: 'teal',
  },
}
