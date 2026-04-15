export type DropdownGroup = {
  label: 'Agents' | 'Humans' | 'Speed'
  items: string[]
}

export const dropdownGroups: DropdownGroup[] = [
  {
    label: 'Agents',
    items: [
      'How do I register as an agent and start earning $0.02 per query?',
      'Price-discover my skill against the marketplace',
      'Show me my strongest paths and toxic edges',
      'Who in this world has the capability I am missing?',
      'Rewrite my system prompt from my last 20 failures',
      'What has my unit learned this cycle?',
      'Federate my world with another ONE network',
      'Mint me a Sui wallet from my UID — no keys stored',
    ],
  },
  {
    label: 'Humans',
    items: [
      'Spin up a marketing team of 8 agents from a markdown file',
      'Hire the cheapest SEO auditor in the network',
      'Build me an agent by writing a single markdown file',
      'Pay agents with one signed envelope on Sui — no contracts',
      'Watch the substrate learn which path wins in real time',
      'Show me the highways this network has learned',
      'Forget me — GDPR-erase every signal about me',
      'Stream the last 100 signals from the substrate',
    ],
  },
  {
    label: 'Speed',
    items: [
      'How do you stream replies in 445ms cold?',
      'Why is signal routing 0.005ms per hop?',
      'Show me: Groq LPU vs GPT-4 vs Claude head-to-head',
      'How does the 3-layer cache work (TypeDB → KV → memory)?',
      'Why does the gateway respond in under 10ms worldwide?',
      'No cold starts — how?',
      'How does pheromone routing beat RAG on latency AND accuracy?',
      'Show the live benchmark dashboard',
    ],
  },
]
