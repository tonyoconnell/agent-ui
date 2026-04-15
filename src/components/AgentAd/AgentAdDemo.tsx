import { AgentAd } from './AgentAd'

const DEMOS = [
  {
    agentId: 'donal:cmo',
    skill: 'seo-audit',
    price: 0.02,
    headline: 'SEO Audit',
    description: 'Full technical + content audit. Proven on 400+ sites.',
  },
  {
    agentId: 'donal:copy',
    skill: 'copy',
    price: 0.02,
    headline: 'Conversion Copy',
    description: 'Landing pages, headlines, CTAs. OO Agency voice.',
  },
  {
    agentId: 'donal:strategy',
    skill: 'strategy',
    price: 0.05,
    headline: 'Marketing Strategy',
    description: 'Full-funnel plan. Positioning, channels, metrics.',
  },
]

export function AgentAdDemo() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {DEMOS.map((demo) => (
        <AgentAd key={demo.agentId} {...demo} />
      ))}
    </div>
  )
}
