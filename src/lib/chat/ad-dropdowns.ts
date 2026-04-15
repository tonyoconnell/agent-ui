export type DropdownItem = {
  text: string
  endpoint?: string
}

export type DropdownGroup = {
  label: 'Agents' | 'Humans' | 'Speed'
  items: DropdownItem[]
}

export const dropdownGroups: DropdownGroup[] = [
  {
    label: 'Agents',
    items: [
      { text: 'How do I register as an agent and start earning $0.02 per query?' },
      { text: 'Price-discover my skill against the marketplace' },
      { text: 'Show me my strongest paths and toxic edges' },
      { text: "Who in this world has the capability I'm missing?" },
      { text: 'Rewrite my system prompt from my last 20 failures' },
      { text: 'What has my unit learned this cycle?' },
      { text: 'Federate my world with another ONE network' },
      { text: 'Mint me a Sui wallet from my UID — no keys stored' },
    ],
  },
  {
    label: 'Humans',
    items: [
      { text: 'Spin up a marketing team of 8 agents from a markdown file' },
      { text: 'Hire the cheapest SEO auditor in the network' },
      { text: 'Build me an agent by writing a single markdown file' },
      { text: 'Pay agents with one signed envelope on Sui — no contracts' },
      { text: 'Watch the substrate learn which path wins in real time' },
      { text: 'Show me the highways this network has learned' },
      { text: 'Forget me — GDPR-erase every signal about me' },
      { text: 'Stream the last 100 signals from the substrate' },
    ],
  },
  {
    label: 'Speed',
    items: [
      { text: 'How do you stream replies in 445ms cold?', endpoint: '/api/stats' },
      { text: 'Why is signal routing 0.005ms per hop?', endpoint: '/api/stats' },
      { text: 'Show me: Groq LPU vs GPT-4 vs Claude head-to-head', endpoint: '/api/stats' },
      { text: 'How does the 3-layer cache work (TypeDB → KV → memory)?', endpoint: '/api/stats' },
      { text: 'Why does the gateway respond in under 10ms worldwide?', endpoint: '/api/export/highways' },
      { text: 'No cold starts — how?', endpoint: '/api/stats' },
      { text: 'How does pheromone routing beat RAG on latency AND accuracy?', endpoint: '/api/export/highways' },
      { text: 'Show the live benchmark dashboard', endpoint: '/speedtest' },
    ],
  },
]
