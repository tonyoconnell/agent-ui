# TODO: ONE-strategy

- [x] Prove deterministic routing speed: <0.01ms per decision
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: speed-proven
  exit: 43 tests in routing.test.ts pass, showing 400,000x faster than LLM routing
  tags: foundation, test, P0, engineering

- [ ] Build CEO control panel: hire/fire/commend/flag agents
  value: critical
  effort: medium
  phase: C1
  persona: ceo
  blocks: ceo-control-live
  exit: CEO can manage AI agents: delegate tasks, view top performers, flag bad actors
  tags: ui, governance, P0, ceo

- [ ] Wire CEO visibility: highways (top 10 performers)
  value: critical
  effort: medium
  phase: C1
  persona: ceo
  blocks: ceo-control-live
  exit: CEO sees top 10 by net strength (reputation = mark - warn). Arithmetic only.
  tags: ui, analytics, P0, ceo

- [ ] Implement isToxic() blocking: resistance >= 10 AND resistance > 2× strength
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: safety-live
  exit: Toxic paths auto-blocked, no LLM waste, cost = $0
  tags: engineering, security, P0, foundation

- [ ] Build markdown agent deployment: write file, push, live in minutes
  value: critical
  effort: high
  phase: C1
  persona: dev
  blocks: agent-marketplace-live
  exit: Users write agent.md → /api/agents/sync → live on ONE + AgentVerse
  tags: agent, integration, P0, deployment

- [ ] Create 7-persona vocabulary layer: CEO/Dev/Investor/Gamer/Kid/Freelancer/Agent
  value: high
  effort: medium
  phase: C1
  persona: dev
  blocks: persona-translation
  exit: Every formula maps to 7 vocabulary skins. Same math, different words.
  tags: foundation, design, P1, governance

- [ ] Wire Sui on-chain proofs: paths crystallized immutable
  value: high
  effort: high
  phase: C3
  persona: investor
  blocks: blockchain-live
  exit: Strength, resistance, revenue locked on Sui. Auditable. Compliant.
  tags: commerce, sui, blockchain, P1, compliance

- [ ] Build marketplace: humans buy/sell services to agents
  value: high
  effort: high
  phase: C3
  persona: investor
  blocks: commerce-live
  exit: Skill pricing, payment routing, escrow settlement on Sui
  tags: commerce, payments, P1, revenue

- [ ] Create agent self-improvement loop: rewrite prompts when success-rate < 50%
  value: high
  effort: high
  phase: C2
  persona: dev
  blocks: evolution-live
  exit: Agent prompt auto-rewrites every 10 min if samples >= 20 AND success < 50%
  tags: intelligence, learning, P1, foundation

- [ ] Scale to 2M+ AgentVerse agents: bridge AgentVerse discovery + ONE routing
  value: high
  effort: high
  phase: C4
  persona: dev
  blocks: agentverse-live
  exit: ONE substrate routes through AgentVerse 2M agents. Discovery automatic.
  tags: integration, expansion, P1, network-effects

- [ ] Build token minting: creators mint their own tokens on Sui
  value: medium
  effort: high
  phase: C6
  persona: investor
  blocks: tokenomics-live
  exit: Creators mint tokens, agents earn them, marketplace trades them
  tags: commerce, sui, tokenomics, P2, scale

- [ ] Create kids learning path: learn pheromone by playing
  value: medium
  effort: medium
  phase: C5
  persona: kid
  blocks: education-live
  exit: Kids see ant colony, set mood (explore/exploit), watch trails form
  tags: ui, education, gamification, P2, learning

- [ ] Build multi-chain bridge: Sui, Ethereum, Solana native routing
  value: medium
  effort: high
  phase: C6
  persona: investor
  blocks: multi-chain-live
  exit: Routes work across chains. Payments settle on fastest chain. User chooses.
  tags: integration, blockchain, P2, scale

- [ ] Wire creator domains: mint branded agents on your domain
  value: high
  effort: medium
  phase: C4
  persona: investor
  blocks: domains-live
  exit: creator.domain → agents live, branded, routing under your control
  tags: integration, branding, P1, expansion
