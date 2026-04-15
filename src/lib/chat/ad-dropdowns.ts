export type DropdownItem = {
  text: string
  endpoint?: string
}

export type DropdownGroup = {
  label: 'Humans' | 'Speed'
  items: DropdownItem[]
}

export const dropdownGroups: DropdownGroup[] = [
  {
    label: 'Humans',
    items: [
      { text: 'Build a marketing team from a markdown file' },
      { text: 'Pay an agent with a signed Sui envelope' },
      { text: 'Watch paths strengthen in real time' },
    ],
  },
  {
    label: 'Speed',
    items: [
      { text: 'Stream a reply and time first token', endpoint: '/api/stats' },
      { text: 'Benchmark routing at 0.005ms per hop', endpoint: '/api/stats' },
      { text: 'Open the live benchmark dashboard', endpoint: '/speedtest' },
    ],
  },
]
