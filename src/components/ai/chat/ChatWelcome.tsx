/**
 * ChatWelcome - Empty state welcome screen
 * Shows suggestion cards when no messages exist
 */

import { Brain, ChartBar, Palette, Zap } from 'lucide-react'

interface SuggestionGroup {
  label: string
  items: string[]
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const SUGGESTION_GROUPS: SuggestionGroup[] = [
  {
    label: 'Data Visualization',
    items: [
      'Show a line chart of monthly revenue: Jan $12.5K, Feb $18.2K, Mar $22.8K, Apr $19.3K, May $25.1K, Jun $28.4K',
      'Create a bar chart comparing product sales: T-Shirts 145 units, Hoodies 98 units, Hats 67 units, Stickers 234 units',
      'Display a pie chart of traffic sources: Direct 32%, Organic Search 28%, Social Media 24%, Paid Ads 16%',
    ],
    icon: ChartBar,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'UI Components',
    items: [
      "Generate a product card for 'Premium Wireless Headphones' priced at $299, with 4.8 rating from 1,247 reviews, and features: noise cancelling, 30hr battery, USB-C charging",
      'Create a pricing comparison table: Starter $9/mo (5 projects, 10GB storage), Pro $29/mo (unlimited projects, 100GB storage, priority support), Enterprise $99/mo (everything + custom integrations)',
      'Build a contact form with fields: name, email, phone (optional), subject dropdown (Sales, Support, Partnership), message textarea, and submit button',
    ],
    icon: Palette,
    color: 'from-green-500 to-emerald-500',
  },
  {
    label: 'Data Tables',
    items: [
      'Use the read_google_sheet function to fetch data from https://docs.google.com/spreadsheets/d/1FMcD4U_bjabpE5feUNF_YqJFugwWhXA03CP3goKeynk/edit?gid=0#gid=0 then show it in a table and create charts',
      "Create a sales pipeline table: deal name, company, stage (Lead/Demo/Proposal/Closed), value, close date. Include deals like 'Acme Corp Integration' $45K in Proposal stage, 'StartupXYZ Platform' $12K in Demo, etc.",
      "Display an inventory table: product name, SKU, stock quantity, reorder level, supplier. Include items like 'Laptop Stand' (SKU-1001, 45 units, reorder at 20, from TechSupply Co), 'Wireless Mouse' (SKU-1002, 12 units, reorder at 25, from ElectronicsPro)",
    ],
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
  },
  {
    label: 'Forms & Inputs',
    items: [
      "Generate a signup form with: full name, email, password with strength indicator, confirm password, 'I agree to Terms' checkbox, submit button that validates email format and password match",
      'Create a booking form for hotel reservation: check-in date, check-out date, room type dropdown (Standard/Deluxe/Suite), number of guests (1-4), special requests textarea, total price calculator',
      'Build a job application form with: applicant name, email, phone, resume upload, position applying for (dropdown: Engineer/Designer/Marketing/Sales), years of experience (slider 0-20), cover letter, submit button',
    ],
    icon: Zap,
    color: 'from-orange-500 to-red-500',
  },
]

interface ChatWelcomeProps {
  onSelectSuggestion: (text: string, autoSelectTool?: string) => void
}

// Minimal suggestions for empty state
const MINIMAL_SUGGESTIONS = ['Help me analyze data', 'Create a visualization', 'Build a form']

export function ChatWelcome({ onSelectSuggestion }: ChatWelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {/* Centered container - consistent 800px max-width */}
      <div className="w-full max-w-[800px] mx-auto flex flex-col items-center">
        {/* Simple greeting - minimal, warm */}
        <h1 className="text-2xl font-medium text-foreground/80 mb-12">How can I help?</h1>

        {/* Clean, simple suggestions */}
        <div className="flex flex-col gap-3 w-full max-w-md mb-16">
          {MINIMAL_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSelectSuggestion(suggestion)}
              className="text-left px-4 py-3 text-[15px] text-muted-foreground rounded-xl border border-border/40 hover:border-border hover:bg-muted/30 transition-colors duration-200"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Feature categories - more detailed options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {SUGGESTION_GROUPS.map((group) => {
            const Icon = group.icon
            return (
              <button
                key={group.label}
                onClick={() => {
                  const suggestion = group.items[0]
                  if (suggestion.includes('docs.google.com/spreadsheets')) {
                    onSelectSuggestion(suggestion, 'google_sheets')
                  } else {
                    onSelectSuggestion(suggestion)
                  }
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/20 transition-all duration-200"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${group.color} text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-muted-foreground">{group.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
