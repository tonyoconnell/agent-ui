import type { ExtendedMessage, SuggestionGroup } from './types'

export const suggestionGroups: SuggestionGroup[] = [
  {
    label: 'Marketing',
    highlight: 'Marketing',
    items: [
      'Create a landing page for our new AI product with hero section, features, and testimonials',
      'Design an email campaign template for our product launch',
      'Build a content calendar for our social media strategy',
      'Generate a marketing funnel visualization with conversion rates',
      'Create a brand positioning statement and messaging framework',
    ],
  },
  {
    label: 'Sales',
    highlight: 'Sales',
    items: [
      'Show me the Wireless Noise-Canceling Headphones product card with a working Add to Cart button. Make it look professional with product image, price, rating, stock count, and quantity selector.',
      'Create a sales pipeline dashboard with deal stages and values',
      'Build a customer proposal template with pricing tiers',
      'Generate a competitive analysis comparison table',
      'Design a sales performance leaderboard',
    ],
  },
  {
    label: 'Service',
    highlight: 'Service',
    items: [
      'Create a customer support ticket system interface',
      'Build a knowledge base article template',
      'Design a customer satisfaction survey',
      'Generate a service level agreement (SLA) dashboard',
      'Create a customer onboarding checklist',
    ],
  },
  {
    label: 'Design',
    highlight: 'Design',
    items: [
      'Create a landing page hero section',
      'Design a pricing card component',
      'Build a testimonial carousel',
      'Generate a feature comparison grid',
      'Create a call-to-action banner',
    ],
  },
  {
    label: 'Engineering',
    highlight: 'Engineering',
    items: [
      'Show me beautiful conversion rate charts comparing AI chat vs traditional forms. Include: 1) Sales funnel showing drop-off at each stage (Landing → Engagement → Qualification → Demo → Closed Won), 2) Upsell success rates (Basic → Pro → Enterprise → Annual), 3) Code to production deployment timeline with Cloudflare, and 4) Edge performance metrics (response time + requests/sec). Make the charts visually stunning with clear comparisons showing AI chat crushing traditional forms.',
      'Create a system architecture diagram for microservices',
      'Build a code review checklist and pull request template',
      'Generate a sprint planning board with task breakdown',
      'Design a CI/CD pipeline visualization',
    ],
  },
  {
    label: 'Intelligence',
    highlight: 'Intelligence',
    items: [
      'Create a business intelligence dashboard with key metrics',
      'Build a data analysis report with charts and insights',
      'Generate a predictive analytics model visualization',
      'Design a real-time analytics monitoring system',
      'Create a customer behavior analysis dashboard',
    ],
  },
]

export const DEMO_RESPONSES: Record<string, ExtendedMessage[]> = {
  'agent reasoning': [
    {
      id: 'demo-reasoning',
      role: 'assistant',
      content: '',
      type: 'reasoning',
      payload: {
        steps: [
          {
            step: 1,
            title: 'Analyzing request',
            description: 'Understanding what the user wants to see',
            completed: true,
          },
          {
            step: 2,
            title: 'Preparing demonstration',
            description: 'Setting up agent reasoning visualization',
            completed: true,
          },
          {
            step: 3,
            title: 'Generating response',
            description: 'Creating structured output with reasoning steps',
            completed: true,
          },
        ],
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-text',
      role: 'assistant',
      content:
        'This is an example of agent reasoning! The steps above show how an AI agent thinks through a problem step-by-step. In a real implementation, these would be generated dynamically as the agent processes your request.',
      type: 'text',
      timestamp: Date.now(),
    },
  ],
  'tool calls': [
    {
      id: 'demo-tool-1',
      role: 'assistant',
      content: '',
      type: 'tool_call',
      payload: {
        name: 'search_database',
        args: { query: 'recent sales data', limit: 10 },
        result: { count: 5, items: ['Item 1', 'Item 2', 'Item 3'] },
        status: 'completed',
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-tool-2',
      role: 'assistant',
      content: '',
      type: 'tool_call',
      payload: {
        name: 'calculate_metrics',
        args: { metric: 'revenue', period: 'last_month' },
        result: { revenue: 125000, growth: 15.5 },
        status: 'completed',
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-text',
      role: 'assistant',
      content:
        'These tool calls show how an AI agent can execute functions and display the arguments and results. Click the chevron to expand and see the details!',
      type: 'text',
      timestamp: Date.now(),
    },
  ],
  'sales chart': [
    {
      id: 'demo-chart-1',
      role: 'assistant',
      content: '',
      type: 'ui',
      payload: {
        component: 'chart',
        data: {
          title: 'Sales Funnel: AI Chat vs Traditional Forms',
          chartType: 'bar',
          labels: ['Landing Page', 'Engagement', 'Qualification', 'Demo Request', 'Closed Won'],
          datasets: [
            { label: 'AI Chat', data: [100, 82, 67, 54, 38], color: '#10b981' },
            { label: 'Traditional Form', data: [100, 34, 23, 12, 5], color: '#94a3b8' },
          ],
        },
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-chart-2',
      role: 'assistant',
      content: '',
      type: 'ui',
      payload: {
        component: 'chart',
        data: {
          title: 'Upsell & Cross-sell Success Rate',
          chartType: 'bar',
          labels: ['Basic Plan', 'Pro Plan Upsell', 'Enterprise Add-ons', 'Annual Commitment'],
          datasets: [
            { label: 'AI Chat Conversational', data: [100, 68, 42, 73], color: '#3b82f6' },
            { label: 'Traditional Forms', data: [100, 22, 8, 31], color: '#94a3b8' },
          ],
        },
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-chart-3',
      role: 'assistant',
      content: '',
      type: 'ui',
      payload: {
        component: 'chart',
        data: {
          title: 'Code to Production: Deployment Pipeline',
          chartType: 'line',
          labels: ['Code Push', 'Build Start', 'Tests Pass', 'Cloudflare Deploy', 'Live Traffic'],
          datasets: [{ label: 'Deployment Time (seconds)', data: [0, 12, 45, 67, 89], color: '#f59e0b' }],
        },
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-chart-4',
      role: 'assistant',
      content: '',
      type: 'ui',
      payload: {
        component: 'chart',
        data: {
          title: 'Cloudflare Edge Performance',
          chartType: 'line',
          labels: ['0s', '10s', '20s', '30s', '40s', '50s', '60s'],
          datasets: [
            { label: 'Response Time (ms)', data: [8, 9, 7, 8, 9, 8, 7], color: '#8b5cf6' },
            { label: 'Requests/sec', data: [1200, 1450, 1380, 1520, 1490, 1560, 1610], color: '#3b82f6' },
          ],
        },
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-text',
      role: 'assistant',
      content:
        "🚀 **Conversion Funnel Analysis:**\n\n📊 **AI Chat crushes every funnel stage:**\n✅ **7.6x better closed-won rate** (38% vs 5%)\n✅ **68% upsell success** vs 22% with forms\n✅ **3.1x higher cross-sell** on add-ons\n✅ **2.4x annual commitment rate**\n\n⚡ **Deployment Pipeline:**\n✅ **89 seconds** from code to production\n✅ **Cloudflare Edge** delivers <10ms response times\n✅ **1,500+ req/sec** with zero performance degradation\n\n**AI chat doesn't just convert better—it tracks, analyzes, and optimizes every step from visitor to customer to champion.** The data speaks for itself. 📈",
      type: 'text',
      timestamp: Date.now(),
    },
  ],
  'data table': [
    {
      id: 'demo-table',
      role: 'assistant',
      content: '',
      type: 'ui',
      payload: {
        component: 'table',
        data: {
          title: 'Top Customers',
          headers: ['Customer', 'Orders', 'Revenue', 'Status'],
          rows: [
            ['Acme Corp', '45', '$125,000', 'Active'],
            ['TechStart Inc', '32', '$98,500', 'Active'],
            ['Global Solutions', '28', '$76,200', 'Pending'],
            ['Innovation Labs', '19', '$54,800', 'Active'],
          ],
        },
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-text',
      role: 'assistant',
      content: 'This table displays structured data in an easy-to-read format. Perfect for showing analysis results!',
      type: 'text',
      timestamp: Date.now(),
    },
  ],
  'contact form': [
    {
      id: 'demo-form',
      role: 'assistant',
      content: '',
      type: 'ui',
      payload: {
        component: 'form',
        data: {
          title: 'Contact Us',
          fields: [
            { label: 'Name', type: 'text', name: 'name', required: true },
            { label: 'Email', type: 'email', name: 'email', required: true },
            { label: 'Phone', type: 'tel', name: 'phone', required: false },
            { label: 'Message', type: 'text', name: 'message', required: true },
          ],
          submitLabel: 'Send Message',
        },
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-text',
      role: 'assistant',
      content:
        'The AI can generate dynamic forms based on your requirements. This makes it easy to collect structured data from users!',
      type: 'text',
      timestamp: Date.now(),
    },
  ],
  timeline: [
    {
      id: 'demo-timeline',
      role: 'assistant',
      content: '',
      type: 'ui',
      payload: {
        component: 'timeline',
        data: {
          title: 'Project Milestones',
          events: [
            { title: 'Project kickoff', timestamp: '2025-01-01' },
            { title: 'Design phase completed', timestamp: '2025-01-15' },
            { title: 'Development started', timestamp: '2025-02-01' },
            { title: 'Beta testing', timestamp: '2025-03-01' },
            { title: 'Launch date', timestamp: '2025-04-01' },
          ],
        },
      },
      timestamp: Date.now(),
    },
    {
      id: 'demo-text',
      role: 'assistant',
      content:
        'Timelines help visualize events and milestones chronologically. Great for project planning and status updates!',
      type: 'text',
      timestamp: Date.now(),
    },
  ],
}

export function findDemoKey(text: string): string | null {
  const lower = text.toLowerCase()
  if (lower.includes('conversion rate charts') || (lower.includes('sales funnel') && lower.includes('upsell'))) {
    return 'sales chart'
  }
  if (lower.includes('(demo)')) {
    return Object.keys(DEMO_RESPONSES).find((key) => lower.includes(key)) ?? null
  }
  return null
}
