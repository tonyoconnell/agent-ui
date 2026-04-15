/**
 * High-Converting Chat Client V2
 *
 * Redesigned for maximum conversion with:
 * - Beautiful demo suggestion cards
 * - Clear value proposition
 * - Progressive feature disclosure
 * - Social proof indicators
 * - Premium tier benefits
 */

import type { ToolUIPart } from 'ai'
import {
  ArrowDown,
  Bot,
  Brain,
  Camera,
  ChartBar,
  CheckCheckIcon,
  CheckIcon,
  ChevronDown,
  CopyIcon,
  Image,
  Info,
  Lock,
  MessageSquare,
  Palette,
  Paperclip,
  Play,
  Plus,
  Settings,
  Sparkles,
  Square,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatMessages } from '@/components/ai/ChatMessages'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai/elements/conversation'
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai/elements/model-selector'
import {
  OpenIn,
  OpenInChatGPT,
  OpenInClaude,
  OpenInContent,
  OpenInCursor,
  OpenInTrigger,
  OpenInv0,
} from '@/components/ai/elements/open-in-chat'
import { PromptInputSpeechButton } from '@/components/ai/elements/prompt-input'
import { Reasoning, ReasoningContent } from '@/components/ai/elements/reasoning'
import { SystemMessage, TelegramMessage } from '@/components/ai/TelegramMessage'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toaster } from '@/components/ui/toaster'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import type { ConversationMessage } from '@/lib/claude-code-events'
import { secureGetItem, secureRemoveItem, secureSetItem } from '@/lib/security'
import { cn } from '@/lib/utils'

// Category definitions with icons and colors
const _DEMO_CATEGORIES = {
  'ai-features': {
    name: 'AI Features',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/20',
    description: 'Advanced AI capabilities',
  },
  'data-viz': {
    name: 'Data & Analytics',
    icon: ChartBar,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
    borderColor: 'border-blue-500/20',
    description: 'Visualize and analyze data',
  },
  'ui-generation': {
    name: 'UI Generation',
    icon: Palette,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/20',
    description: 'Generate UI components',
  },
  productivity: {
    name: 'Productivity',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-gradient-to-br from-orange-500/10 to-red-500/10',
    borderColor: 'border-orange-500/20',
    description: 'Boost your productivity',
  },
}

// Suggestion groups with expandable categories
const suggestionGroups = [
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

// Value propositions for conversion
const _VALUE_PROPS: any[] = []

// Trust indicators
const _TRUST_BADGES: any[] = []

const POPULAR_MODELS = [
  // Claude Code models (via Claude Pro/Max subscription + CLI auth)
  // NOTE: Requires running `claude login` in terminal first
  /*
	{
		id: "claude-code/sonnet",
		name: "Claude Code Sonnet",
		chef: "Anthropic",
		chefSlug: "anthropic",
		providers: ["claude-code"],
		free: true,
		context: "200K",
		requiresAuth: "CLI: claude login",
		hasTools: true,
		isClaudeCode: true,
	},
	{
		id: "claude-code/opus",
		name: "Claude Code Opus",
		chef: "Anthropic",
		chefSlug: "anthropic",
		providers: ["claude-code"],
		free: true,
		context: "200K",
		requiresAuth: "CLI: claude login",
		hasTools: true,
		isClaudeCode: true,
	},
		*/
  // Default model — server-configured OpenRouter key, 1M context, $0.15/M
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    chef: 'Meta',
    chefSlug: 'meta',
    providers: ['openrouter'],
    free: false,
    context: '1M',
  },
  // Free models
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
    free: true,
    context: '1M',
  },
  {
    id: 'openrouter/sherlock-think-alpha',
    name: 'Sherlock Think Alpha',
    chef: 'OpenRouter',
    chefSlug: 'openrouter',
    providers: ['openrouter'],
    free: true,
    context: '256K',
  },
  {
    id: 'tngtech/deepseek-r1t2-chimera:free',
    name: 'DeepSeek R1T2 Chimera',
    chef: 'TNG',
    chefSlug: 'tng',
    providers: ['tng'],
    free: true,
    context: '164K',
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air',
    chef: 'Z.AI',
    chefSlug: 'z-ai',
    providers: ['z-ai'],
    free: true,
    context: '131K',
  },
  {
    id: 'tngtech/deepseek-r1t-chimera:free',
    name: 'DeepSeek R1T Chimera',
    chef: 'TNG',
    chefSlug: 'tng',
    providers: ['tng'],
    free: true,
    context: '164K',
  },
  // Premium models - Frontier
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic'],
    free: false,
    context: '1M',
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai'],
    free: false,
    context: '400K',
  },
  {
    id: 'openai/o3-deep-research',
    name: 'o3 Deep Research',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai'],
    free: false,
    context: '200K',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
    free: false,
    context: '1M',
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
    free: false,
    context: '2M',
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic'],
    free: false,
    context: '1M',
  },
  // Premium - Fast models
  {
    id: 'x-ai/grok-code-fast-1',
    name: 'Grok Code Fast 1',
    chef: 'xAI',
    chefSlug: 'x-ai',
    providers: ['x-ai'],
    free: false,
    context: '256K',
  },
  {
    id: 'x-ai/grok-4-fast',
    name: 'Grok 4 Fast',
    chef: 'xAI',
    chefSlug: 'x-ai',
    providers: ['x-ai'],
    free: false,
    context: '2M',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
    free: false,
    context: '1M',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
    free: false,
    context: '1M',
  },
  // Premium - Efficient
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai'],
    free: false,
    context: '400K',
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic'],
    free: false,
    context: '200K',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai'],
    free: false,
    context: '128K',
  },
  {
    id: 'deepseek/deepseek-chat-v3.1',
    name: 'DeepSeek V3.1',
    chef: 'DeepSeek',
    chefSlug: 'deepseek',
    providers: ['deepseek'],
    free: false,
    context: '164K',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    chef: 'Meta',
    chefSlug: 'meta',
    providers: ['meta'],
    free: false,
    context: '131K',
  },
]

const STORAGE_KEY = 'openrouter-api-key'
const MODEL_KEY = 'openrouter-model'

// Extended message type for premium features
interface ExtendedMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'text' | 'reasoning' | 'tool_call' | 'tool_result' | 'ui'
  payload?: any
  timestamp?: number
  reasoning?: {
    content: string
    duration?: number
  }
  isReasoningComplete?: boolean
  isReasoningStreaming?: boolean
  toolCalls?: Array<{
    name: string
    args: Record<string, any>
    result?: any
    state: ToolUIPart['state']
  }>
}

// Mock premium responses for demo
const DEMO_RESPONSES: Record<string, ExtendedMessage[]> = {
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
            {
              label: 'Traditional Form',
              data: [100, 34, 23, 12, 5],
              color: '#94a3b8',
            },
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
            {
              label: 'AI Chat Conversational',
              data: [100, 68, 42, 73],
              color: '#3b82f6',
            },
            {
              label: 'Traditional Forms',
              data: [100, 22, 8, 31],
              color: '#94a3b8',
            },
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
          datasets: [
            {
              label: 'Deployment Time (seconds)',
              data: [0, 12, 45, 67, 89],
              color: '#f59e0b',
            },
          ],
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
            {
              label: 'Response Time (ms)',
              data: [8, 9, 7, 8, 9, 8, 7],
              color: '#8b5cf6',
            },
            {
              label: 'Requests/sec',
              data: [1200, 1450, 1380, 1520, 1490, 1560, 1610],
              color: '#3b82f6',
            },
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

// Hero section component - removed, content moved to main layout

// Helper function to get human-readable tool descriptions
function getToolDescription(toolName: string, args?: Record<string, any>): string {
  const toolDescriptions: Record<string, (args?: Record<string, any>) => string> = {
    Glob: (args) => (args?.pattern ? `Searching for files matching "${args.pattern}"` : 'Searching for files'),
    Grep: (args) => (args?.pattern ? `Searching code for "${args.pattern}"` : 'Searching code'),
    Read: (args) => (args?.file_path ? `Reading file ${args.file_path.split('/').pop()}` : 'Reading file'),
    Write: (args) => (args?.file_path ? `Writing to ${args.file_path.split('/').pop()}` : 'Writing file'),
    Edit: (args) => (args?.file_path ? `Editing ${args.file_path.split('/').pop()}` : 'Editing file'),
    Bash: (args) =>
      args?.command
        ? `Running command: ${args.command.substring(0, 50)}${args.command.length > 50 ? '...' : ''}`
        : 'Running command',
    Task: (args) => (args?.description ? `${args.description}` : 'Starting task'),
    WebFetch: (args) => (args?.url ? `Fetching ${new URL(args.url).hostname}` : 'Fetching web content'),
    WebSearch: (args) => (args?.query ? `Searching for "${args.query}"` : 'Searching the web'),
    TodoWrite: () => 'Updating task list',
    AskUserQuestion: () => 'Asking for clarification',
  }

  const descFn = toolDescriptions[toolName]
  return descFn ? descFn(args) : `Using ${toolName}`
}

// Helper function to format tool results
function formatToolResult(toolName: string, result: any): string {
  if (!result) return 'Completed'

  if (typeof result === 'string') {
    // For file operations, show first line or summary
    if (toolName === 'Read' || toolName === 'Grep' || toolName === 'Glob') {
      const lines = result.split('\n')
      const count = lines.length
      return count > 1 ? `Found ${count} ${count === 1 ? 'result' : 'results'}` : result.substring(0, 100)
    }
    return result.substring(0, 100)
  }

  if (typeof result === 'object') {
    // Extract meaningful info from objects
    if (result.files && Array.isArray(result.files)) {
      return `Found ${result.files.length} ${result.files.length === 1 ? 'file' : 'files'}`
    }
    if (result.matches) {
      return `Found ${result.matches} ${result.matches === 1 ? 'match' : 'matches'}`
    }
    return JSON.stringify(result).substring(0, 100)
  }

  return String(result).substring(0, 100)
}

export function ChatClientV2() {
  const [apiKey, setApiKey] = useState('')
  const [serverHasKey, setServerHasKey] = useState(false)
  // Default to Llama 4 Maverick via OpenRouter (server-configured key)
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-4-maverick')
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [customModels, setCustomModels] = useState<typeof POPULAR_MODELS>([])
  const [quickAddInput, setQuickAddInput] = useState('')
  const [messages, setMessages] = useState<ExtendedMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [_copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [conversationCopied, setConversationCopied] = useState(false)
  const [thinkingStatus, setThinkingStatus] = useState<string>('')
  const [activeTools, setActiveTools] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [toolStartTimes, setToolStartTimes] = useState<Record<string, number>>({})
  const [useDirector, setUseDirector] = useState(true) // Use agent-director by default
  const [_directorThinking, setDirectorThinking] = useState<string[]>([])
  const [_assignedAgents, setAssignedAgents] = useState<Array<{ name: string; status: string; timestamp: number }>>([])
  const [activeAgents, setActiveAgents] = useState<string[]>([]) // Agents currently in conversation
  const [isAtBottom, setIsAtBottom] = useState(true) // Track if user is at bottom (from StickToBottom)
  const [newMessageSender, setNewMessageSender] = useState<string | null>(null) // Track new messages while scrolled up
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Combine popular models with custom models
  const allModels = [...POPULAR_MODELS, ...customModels]
  const selectedModelData = allModels.find((m) => m.id === selectedModel)
  const hasApiKey = !!apiKey || serverHasKey

  // Quick add model from OpenRouter
  const handleQuickAddModel = () => {
    const input = quickAddInput.trim()
    if (!input) return

    // Parse model ID (e.g., "openai/o3-deep-research" or just "o3-deep-research")
    const parts = input.includes('/') ? input.split('/') : ['openrouter', input]
    const [provider, modelName] = parts

    // Create custom model entry
    const customModel = {
      id: input,
      name: modelName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      chef: provider.charAt(0).toUpperCase() + provider.slice(1),
      chefSlug: provider.toLowerCase(),
      providers: [provider.toLowerCase()],
      free: false,
      context: '128K', // Default context
    }

    // Add to custom models if not already exists
    if (!allModels.some((m) => m.id === input)) {
      setCustomModels((prev) => [...prev, customModel])
      setSelectedModel(input)
      setQuickAddInput('')
      setModelSelectorOpen(false)
    }
  }

  // Handle scroll state changes from StickToBottom library
  const handleScrollStateChange = useCallback((atBottom: boolean, latestSender: string | null) => {
    setIsAtBottom(atBottom)

    if (atBottom) {
      // User is at bottom, clear notification
      setNewMessageSender(null)
    } else if (latestSender) {
      // User scrolled up and there's a new message
      setNewMessageSender(latestSender)
    }
  }, [])

  // Load API key, model, and custom models from storage on mount
  // Also check if server has OpenRouter key configured
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = secureGetItem(STORAGE_KEY)
      const savedModel = localStorage.getItem(MODEL_KEY) // Model selection is not sensitive
      const savedCustomModels = localStorage.getItem('custom-models')

      if (savedKey) {
        setApiKey(savedKey)
      }
      if (savedModel) {
        setSelectedModel(savedModel)
      }
      if (savedCustomModels) {
        try {
          setCustomModels(JSON.parse(savedCustomModels))
        } catch (e) {
          console.error('Failed to load custom models:', e)
        }
      }

      // Check if server has OpenRouter key — if so, skip the API key gate in UI
      fetch('/api/chat-config')
        .then((r) => r.json())
        .then((cfg: { hasKey: boolean }) => {
          if (cfg.hasKey) setServerHasKey(true)
        })
        .catch(() => {}) // Non-fatal
    }
  }, [])

  // Save custom models to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && customModels.length > 0) {
      localStorage.setItem('custom-models', JSON.stringify(customModels))
    }
  }, [customModels])

  // Save API key to secure storage
  const handleSaveApiKey = () => {
    if (apiKey && typeof window !== 'undefined') {
      secureSetItem(STORAGE_KEY, apiKey)
      localStorage.setItem(MODEL_KEY, selectedModel)
      toast({
        title: 'API Key Saved',
        description: 'All premium features are now unlocked!',
      })
      setShowSettings(false)
    }
  }

  // Clear stored key
  const handleClearKey = () => {
    if (typeof window !== 'undefined') {
      secureRemoveItem(STORAGE_KEY)
      localStorage.removeItem(MODEL_KEY)
    }
    setApiKey('')
    setMessages([])
    toast({
      title: 'API Key Removed',
      description: 'Switched back to free tier',
    })
  }

  // Handle demo selection
  const handleDemoSelect = (prompt: string) => {
    // All demos work in free tier!
    handleSubmit({ text: prompt, files: [] } as any, new Event('submit') as any)
  }

  // Copy message to clipboard
  const _handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      toast({
        title: 'Copied!',
        description: 'Message copied to clipboard',
      })
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (_err) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy message to clipboard',
        variant: 'destructive',
      })
    }
  }

  // Copy entire conversation
  const handleCopyConversation = async () => {
    try {
      const conversationText = messages
        .filter((msg) => msg.type !== 'tool_call' && msg.type !== 'tool_result')
        .map((msg) => {
          const role = msg.role === 'user' ? 'You' : 'Assistant'
          return `${role}: ${msg.content}`
        })
        .join('\n\n')

      await navigator.clipboard.writeText(conversationText)
      setConversationCopied(true)
      toast({
        title: 'Conversation copied!',
        description: 'Entire conversation copied to clipboard',
      })

      setTimeout(() => setConversationCopied(false), 2000)
    } catch (_err) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy conversation to clipboard',
        variant: 'destructive',
      })
    }
  }

  // Handle voice input
  const handleTranscriptionChange = (text: string) => {
    if (textareaRef.current) {
      textareaRef.current.value = text
    }
  }

  // Handle web search
  const handleWebSearch = () => {
    const textarea = textareaRef.current
    if (textarea) {
      const currentText = textarea.value
      if (currentText.trim()) {
        textarea.value = `Search the web for: ${currentText}`
        toast({
          title: 'Web Search',
          description: 'Your query will include web search results.',
        })
      } else {
        toast({
          title: 'Enter a query',
          description: 'Please type what you want to search for.',
          variant: 'destructive',
        })
      }
    }
  }

  // Submit message to API
  const handleSubmit = async (message: any, event?: React.FormEvent<HTMLFormElement>) => {
    const text = message?.text || ''
    const _files = message?.files || []

    if (!text.trim() || isLoading) return

    // Check if premium model selected without API key (skip for Claude Code)
    const selectedModelInfo = POPULAR_MODELS.find((m) => m.id === selectedModel)
    const isClaudeCodeModel = selectedModel.startsWith('claude-code/')

    if (selectedModelInfo && !selectedModelInfo.free && !apiKey && !isClaudeCodeModel) {
      // Show settings modal instead of making request
      setShowSettings(true)
      toast({
        title: 'API Key Required',
        description: `${selectedModelInfo.name} requires an OpenRouter API key. Add your key or switch to a free model.`,
      })
      return
    }

    const userMessage: ExtendedMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      type: 'text',
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    setThinkingStatus('Thinking...')
    setActiveTools([])
    setToolStartTimes({})
    setDirectorThinking([])
    setAssignedAgents([])

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    // Check if this is a demo request
    const messageLower = text.toLowerCase()
    let demoKey: string | null = null

    // Check for conversion charts request
    if (
      messageLower.includes('conversion rate charts') ||
      (messageLower.includes('sales funnel') && messageLower.includes('upsell'))
    ) {
      demoKey = 'sales chart'
    }
    // Check for other demo requests
    else if (messageLower.includes('(demo)')) {
      for (const key of Object.keys(DEMO_RESPONSES)) {
        if (messageLower.includes(key)) {
          demoKey = key
          break
        }
      }
    }

    // If demo request, return mock responses
    if (demoKey && DEMO_RESPONSES[demoKey]) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))
        setMessages((prev) => [...prev, ...DEMO_RESPONSES[demoKey]])
        setIsLoading(false)
        return
      } catch (err) {
        console.error('Demo error:', err)
        setError('Failed to show demo')
        setIsLoading(false)
        return
      }
    }

    try {
      // Use agent-director for intelligent routing and parallel execution
      if (useDirector && !demoKey) {
        const directorResponse = await fetch('/api/chat-director', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content, metadata: m.metadata })),
              { role: 'user', content: text.trim() },
            ],
            activeAgents, // Send currently active agents
          }),
          signal: abortControllerRef.current?.signal,
        })

        if (!directorResponse.ok) {
          throw new Error(`Director error: ${directorResponse.status}`)
        }

        const reader = directorResponse.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let streamingMessageId: string | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'message') {
                  // Create deterministic ID to prevent duplicates
                  const messageId =
                    data.isStreaming && streamingMessageId ? streamingMessageId : `${data.sender}-${data.timestamp}`

                  const newMessage: ExtendedMessage = {
                    id: messageId,
                    role: data.sender === 'System' ? 'system' : 'assistant',
                    content: data.content,
                    type: 'text',
                    timestamp: data.timestamp,
                    metadata: {
                      sender: data.sender,
                      avatar: data.avatar,
                      isStreaming: data.isStreaming,
                      isComplete: false,
                      agents: data.metadata?.agents,
                    },
                  }

                  // Update thinking status when director is streaming
                  if (data.sender === 'Agent Director' && data.isStreaming) {
                    setThinkingStatus('Analyzing request and identifying relevant agents...')
                  }

                  if (data.isStreaming) {
                    // For streaming messages, append to existing or create new
                    setMessages((prev) => {
                      const existingIndex = prev.findIndex(
                        (msg) => msg.metadata?.sender === data.sender && msg.metadata?.isStreaming,
                      )

                      if (existingIndex !== -1) {
                        // Update existing streaming message
                        const updated = [...prev]
                        updated[existingIndex] = {
                          ...updated[existingIndex],
                          content: updated[existingIndex].content + data.content,
                        }
                        return updated
                      } else {
                        // Create new streaming message
                        streamingMessageId = newMessage.id
                        return [...prev, newMessage]
                      }
                    })
                  } else {
                    // Non-streaming messages: check for duplicates before adding
                    setMessages((prev) => {
                      const exists = prev.some((msg) => msg.id === newMessage.id)
                      if (exists) {
                        console.log('⚠️ Duplicate message ignored:', newMessage.id)
                        return prev
                      }
                      return [...prev, newMessage]
                    })
                  }

                  console.log('📨 Message added:', data.sender, '-', data.content.substring(0, 50))
                } else if (data.type === 'agent-presence') {
                  // Update active agents in conversation
                  if (data.agents && Array.isArray(data.agents)) {
                    setActiveAgents((prev) => {
                      const newAgents = [...new Set([...prev, ...data.agents])]
                      console.log('👂 Active agents updated:', newAgents)
                      return newAgents
                    })
                  }
                } else if (data.type === 'done') {
                  // Mark streaming complete
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.metadata?.isStreaming
                        ? { ...msg, metadata: { ...msg.metadata, isStreaming: false, isComplete: true } }
                        : msg,
                    ),
                  )
                  setThinkingStatus('')
                  setIsLoading(false)
                  streamingMessageId = null
                  return
                } else if (data.type === 'error') {
                  throw new Error(data.message)
                }
              } catch (e) {
                console.error('Parse error:', e)
              }
            }
          }
        }

        setIsLoading(false)
        return
      }

      // Always make the API call - free tier works without API key!
      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text.trim() },
      ]

      // Enable generative UI only for demo prompts or when explicitly requested
      const isGenerativeUIRequest =
        text.toLowerCase().includes('(demo)') ||
        text.toLowerCase().includes('chart') ||
        text.toLowerCase().includes('table') ||
        text.toLowerCase().includes('visualiz') ||
        text.toLowerCase().includes('product') ||
        text.toLowerCase().includes('toaster')

      // Determine which API endpoint to use
      const isClaudeCode = selectedModel.startsWith('claude-code/')
      const apiEndpoint = isClaudeCode ? '/api/chat-claude-code' : '/api/chat'

      // Extract Claude Code model name (opus or sonnet)
      const claudeCodeModel = isClaudeCode ? selectedModel.split('/')[1] : undefined

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isClaudeCode
            ? {
                messages: allMessages,
                model: claudeCodeModel,
              }
            : {
                messages: allMessages,
                apiKey,
                model: selectedModel,
                enableGenerativeUI: isGenerativeUIRequest,
              },
        ),
        signal: abortControllerRef.current?.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantContent = ''
      let hasReceivedAnyData = false
      const assistantMessage: ExtendedMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        type: 'text',
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setThinkingStatus('Receiving response...')
      console.log('Created assistant message:', assistantMessage.id)

      // Read streaming response
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              console.log('[Stream] Received [DONE] signal')
              continue
            }

            try {
              const parsed = JSON.parse(data)
              console.log('[Stream] Received:', parsed.type || 'text', parsed)

              // Check for tool call messages
              if (parsed.type === 'tool_call') {
                hasReceivedAnyData = true // IMPORTANT: Mark as received
                console.log('[Tool Call] Full payload structure:', JSON.stringify(parsed.payload, null, 2))
                const toolName = parsed.payload?.name || 'Unknown tool'
                const toolStartTime = Date.now()
                console.log(`[Tool Call] ${toolName} started at ${new Date(toolStartTime).toLocaleTimeString()}`)
                console.log('  Args:', parsed.payload?.args || 'NO ARGS FOUND')

                const humanReadableDesc = getToolDescription(toolName, parsed.payload?.args)
                setThinkingStatus(humanReadableDesc)
                setActiveTools((prev) => [...prev, humanReadableDesc])
                setToolStartTimes((prev) => ({
                  ...prev,
                  [toolName]: toolStartTime,
                }))

                // Show toast notification for tool call
                toast({
                  title: `🔧 ${humanReadableDesc}`,
                  description: `Arguments: ${JSON.stringify(parsed.payload?.args || {}).substring(0, 100)}${JSON.stringify(parsed.payload?.args || {}).length > 100 ? '...' : ''}`,
                  duration: 5000,
                })
              }
              // Check for tool result messages
              else if (parsed.type === 'tool_result') {
                hasReceivedAnyData = true // IMPORTANT: Mark as received
                const toolName = parsed.payload?.name || 'Unknown tool'
                const toolEndTime = Date.now()
                const toolStartTime = toolStartTimes[toolName]
                const duration = toolStartTime ? (toolEndTime - toolStartTime) / 1000 : null

                console.log(`[Tool Result] ${toolName} completed at ${new Date(toolEndTime).toLocaleTimeString()}`)
                if (duration !== null) {
                  console.log(`  Duration: ${duration.toFixed(2)}s`)
                }
                console.log('  Result:', parsed.payload?.result)

                // Show toast notification for tool result
                const _resultPreview =
                  typeof parsed.payload?.result === 'string'
                    ? parsed.payload.result.substring(0, 200)
                    : JSON.stringify(parsed.payload?.result || {}).substring(0, 200)

                toast({
                  title: `✅ ${getToolDescription(toolName, parsed.payload?.args)} ${duration ? `(${duration.toFixed(2)}s)` : ''}`,
                  description: formatToolResult(toolName, parsed.payload?.result),
                  duration: 5000,
                })

                // Remove from active tools
                setActiveTools((prev) => prev.filter((t) => t !== toolName))
                setToolStartTimes((prev) => {
                  const updated = { ...prev }
                  delete updated[toolName]
                  return updated
                })
              }
              // Check for UI component messages (charts, tables, etc.)
              else if (parsed.type && parsed.type !== 'text') {
                console.log('Received UI component:', parsed.type, parsed.payload)
                const uiMessage: ExtendedMessage = {
                  id: `ui-${crypto.randomUUID()}`,
                  role: 'assistant',
                  content: '',
                  type: parsed.type as any,
                  payload: parsed.payload,
                  timestamp: Date.now(),
                }
                setMessages((prev) => [...prev, uiMessage])
              }
              // Check for reasoning content
              else if (parsed.choices?.[0]?.delta?.reasoning) {
                hasReceivedAnyData = true
                const reasoningText = parsed.choices[0].delta.reasoning
                console.log('Received reasoning delta:', reasoningText)
                setThinkingStatus('Reasoning through the problem...')
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          reasoning: {
                            content: (msg.reasoning?.content || '') + reasoningText,
                            duration: 0,
                          },
                          isReasoningStreaming: true,
                        }
                      : msg,
                  ),
                )
              }
              // Check for regular text content
              else if (parsed.choices?.[0]?.delta?.content) {
                hasReceivedAnyData = true
                const contentDelta = parsed.choices[0].delta.content
                console.log('Received content delta:', contentDelta)
                setThinkingStatus('Generating response...')
                assistantContent += contentDelta
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          content: assistantContent,
                          isReasoningStreaming: false,
                          isReasoningComplete: true,
                        }
                      : msg,
                  ),
                )
              }
            } catch (_e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Mark reasoning as complete when streaming ends
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                isReasoningStreaming: false,
                isReasoningComplete: true,
              }
            : msg,
        ),
      )

      setIsLoading(false)
      setThinkingStatus('')
      setActiveTools([])

      // Log final message state for debugging
      console.log('Stream ended. Final state:', {
        assistantMessageId: assistantMessage.id,
        hasContent: !!assistantContent,
        contentLength: assistantContent.length,
        hasReceivedAnyData,
        totalMessages: messages.length + 1,
      })

      // If no data was received at all, show error
      if (!hasReceivedAnyData) {
        console.error('No data received from API stream')
        setError('No response received from Claude. Please check the console for details.')
        // Remove the empty assistant message
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id))
      }
    } catch (err) {
      // Check if this was an intentional abort
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request cancelled by user')
        toast({
          title: 'Cancelled',
          description: 'Request stopped by user',
        })
      } else {
        console.error('Chat error:', err)
        setError(err instanceof Error ? err.message : 'Failed to send message')
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
      setThinkingStatus('')
      setActiveTools([])
      abortControllerRef.current = null
    }
  }

  // Stop the current request
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setThinkingStatus('')
      setActiveTools([])
      toast({
        title: 'Stopped',
        description: 'Agent work has been cancelled',
      })
    }
  }

  // Convert ExtendedMessage to ConversationMessage for Telegram display
  const toConversationMessage = (msg: ExtendedMessage): ConversationMessage => {
    return {
      id: msg.id,
      type: msg.role === 'user' ? 'user' : msg.metadata?.sender === 'System' ? 'system' : 'director',
      sender: msg.metadata?.sender || (msg.role === 'user' ? 'You' : 'Agent Director'),
      content: msg.content,
      timestamp: msg.timestamp,
      avatar: msg.metadata?.avatar,
      metadata: msg.metadata,
      isStreaming: msg.metadata?.isStreaming,
      isComplete: msg.metadata?.isComplete,
    }
  }

  // Render message
  const renderMessage = (msg: ExtendedMessage) => {
    const conversationMsg = toConversationMessage(msg)
    const isUser = msg.role === 'user'
    const isSystemMsg = conversationMsg.type === 'system'

    // Skip streaming Agent Director messages - they're shown in the thinking block
    if (msg.metadata?.sender === 'Agent Director' && msg.metadata?.isStreaming) {
      return null
    }

    // System messages (agent joined, etc.)
    if (isSystemMsg) {
      return <SystemMessage key={msg.id} message={conversationMsg} />
    }

    // Regular messages (user or assistant)
    return <TelegramMessage key={msg.id} message={conversationMsg} isUser={isUser} />
  }

  // renderMessage_OLD removed — hook-in-callback violation

  const _getAgentDescription = (agentName: string): string => {
    const descriptions: Record<string, string> = {
      'agent-frontend': 'UI/UX specialist • Pages, components, Astro + React',
      'agent-backend': 'Backend specialist • Services, mutations, Convex + Effect.ts',
      'agent-builder': 'Full-stack builder • End-to-end features with nanostores',
      'agent-quality': 'Quality assurance • Testing, validation, quality checks',
      'agent-designer': 'Design specialist • Wireframes, UI/UX, design systems',
      'agent-integrator': 'Integration expert • APIs, protocols, external systems',
      'agent-ops': 'DevOps specialist • Deployment, CI/CD, infrastructure',
    }
    return descriptions[agentName] || 'Specialist agent'
  }

  const hasMessages = messages.length > 0

  return (
    <TooltipProvider>
      <div className="relative flex size-full flex-col overflow-hidden items-center justify-center bg-background">
        <style>{`
        textarea:focus, input:focus, button:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Code block styling */
        .is-assistant pre {
          background-color: hsl(var(--muted)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 0.5rem !important;
          padding: 1rem !important;
          overflow-x: auto !important;
          margin: 0.5rem 0 !important;
        }

        .is-assistant code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          font-size: 0.875rem !important;
          line-height: 1.5 !important;
        }

        .is-assistant pre code {
          background: none !important;
          padding: 0 !important;
          border: none !important;
          border-radius: 0 !important;
        }

        .is-assistant :not(pre) > code {
          background-color: hsl(var(--muted)) !important;
          padding: 0.125rem 0.375rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.875em !important;
        }

        .is-assistant pre > div {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          margin-bottom: 0.5rem !important;
          padding-bottom: 0.5rem !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
        }

        .is-assistant pre > div > span {
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          color: hsl(var(--muted-foreground)) !important;
        }

        /* Smooth transitions */
        .input-container {
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .demo-cards {
          transition: opacity 0.4s ease-out, transform 0.4s ease-out;
        }

        .demo-cards.hidden {
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none;
        }

        /* Dropdown animation */
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-animate {
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

        {/* Top Left: New Chat Button + Director Toggle */}
        <div className="fixed top-4 left-4 md:left-[100px] z-[100] flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              setMessages([])
              setError(null)
              setDirectorThinking([])
              setAssignedAgents([])
              if (textareaRef.current) {
                textareaRef.current.value = ''
              }
            }}
            className="bg-[hsl(var(--color-tertiary))] text-[hsl(var(--color-tertiary-foreground))] hover:bg-[hsl(var(--color-tertiary))]/90 shadow-lg hover:shadow-xl active:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* Director Mode Toggle */}
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Button
                size="sm"
                variant={useDirector ? 'default' : 'outline'}
                onClick={() => setUseDirector(!useDirector)}
                className={cn(
                  'transition-all',
                  useDirector ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-background hover:bg-accent',
                )}
              >
                <Bot className="w-4 h-4" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="w-80">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{useDirector ? 'Director Mode: ON' : 'Director Mode: OFF'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {useDirector
                        ? 'Agent Director analyzes requests, assigns specialist agents, and orchestrates parallel execution with real-time thinking visibility.'
                        : 'Direct model access without director routing. Faster for simple queries.'}
                    </p>
                  </div>
                </div>
                {useDirector && (
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                    <p>• Validates against 6-dimension ontology</p>
                    <p>• Searches for existing templates</p>
                    <p>• Assigns multiple agents in parallel</p>
                    <p>• Shows thinking process in real-time</p>
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Unlock Premium Features</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Same as Clear button - clear key and reset to free model
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem(STORAGE_KEY)
                      localStorage.removeItem(MODEL_KEY)
                    }
                    setApiKey('')
                    setSelectedModel('google/gemini-2.5-flash-lite')
                    setMessages([])
                    setShowSettings(false)
                  }}
                >
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription className="text-xs">
                    ✨ <strong>Default: Gemini 2.5 Flash Lite (FREE)</strong> - No authentication required, works
                    instantly.
                    <br />
                    <br />🚀 <strong>Add OpenRouter API Key</strong> - Unlock GPT-4, Claude Sonnet 4.5, and 50+ premium
                    models.
                    <br />
                    <br />💡 <strong>Tip:</strong> Get a free key from{' '}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenRouter
                    </a>{' '}
                    with $5 free credits.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="api-key">OpenRouter API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Get a free key from{' '}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenRouter
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Select Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            {model.name}
                            {model.free && (
                              <Badge variant="secondary" className="text-xs">
                                Free
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveApiKey} className="flex-1">
                    Unlock Features
                  </Button>
                  {apiKey && (
                    <Button variant="destructive" size="sm" onClick={handleClearKey}>
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display - Centered */}
        {error && (
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl z-20 px-6 py-2">
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="relative w-full max-w-2xl">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10"
                onClick={() => setShowCamera(false)}
              >
                ✕
              </Button>
              <video
                id="camera-preview"
                autoPlay
                playsInline
                className="w-full rounded-lg"
                ref={(video) => {
                  if (video && showCamera) {
                    navigator.mediaDevices
                      .getUserMedia({ video: true })
                      .then((stream) => {
                        video.srcObject = stream
                      })
                      .catch((err) => {
                        console.error('Camera error:', err)
                        setError('Could not access camera')
                        setShowCamera(false)
                      })
                  }
                }}
              >
                <track kind="captions" srcLang="en" label="Camera preview" />
              </video>
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => {
                    const video = document.getElementById('camera-preview') as HTMLVideoElement
                    if (video) {
                      const canvas = document.createElement('canvas')
                      canvas.width = video.videoWidth
                      canvas.height = video.videoHeight
                      canvas.getContext('2d')?.drawImage(video, 0, 0)
                      canvas.toBlob((blob) => {
                        if (blob) {
                          const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
                          setAttachments((prev) => [...prev, file])
                          // Stop camera
                          const stream = video.srcObject as MediaStream
                          stream?.getTracks().forEach((track) => track.stop())
                          setShowCamera(false)
                        }
                      }, 'image/jpeg')
                    }
                  }}
                  className="gap-2 bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary))]/90 shadow-lg hover:shadow-xl active:shadow-md transition-all"
                >
                  <Camera className="h-4 w-4" />
                  Capture Photo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area - Only show when there are messages */}
        {hasMessages && (
          <div className="relative w-full">
            {/* New Message Notification - shows when user has scrolled up */}
            {!isAtBottom && newMessageSender && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
                <Button
                  onClick={() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                >
                  <span>New message from {newMessageSender}</span>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Conversation className="w-full" initial="auto" resize="auto">
              <ConversationContent className="w-full md:max-w-3xl mx-auto px-4 pb-[145px]">
                <ChatMessages
                  messages={messages}
                  renderMessage={renderMessage}
                  onScrollStateChange={handleScrollStateChange}
                />

                {/* Director Thinking Visualization - shows the director's analysis */}
                {isLoading &&
                  useDirector &&
                  messages.length > 0 &&
                  (() => {
                    // Find the latest streaming Agent Director message
                    const directorMessage = messages
                      .slice()
                      .reverse()
                      .find((m) => m.metadata?.sender === 'Agent Director' && m.metadata?.isStreaming)

                    return directorMessage?.content ? (
                      <div className="mb-4">
                        <Reasoning isStreaming={isLoading} open={true}>
                          <div className="mb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Brain className="h-4 w-4 animate-pulse" />
                              <span className="text-sm font-medium">Agent Director Thinking...</span>
                            </div>
                          </div>
                          <ReasoningContent>{directorMessage.content}</ReasoningContent>
                        </Reasoning>
                      </div>
                    ) : null
                  })()}

                {/* Active Agents Listening */}
                {useDirector && activeAgents.length > 0 && (
                  <Card className="border-green-500/50 bg-green-500/5 mb-4">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                          👂
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-green-700 dark:text-green-400">
                              Active Agents Listening
                            </p>
                            <Badge variant="outline" className="text-xs border-green-500/30">
                              {activeAgents.length} listening
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            These agents are watching the conversation and will respond when they can add value
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {activeAgents.map((agentId, idx) => {
                              const agentName = agentId.replace('agent-', '').replace(/^./, (c) => c.toUpperCase())
                              const agentEmojis: Record<string, string> = {
                                'agent-frontend': '🎨',
                                'agent-backend': '⚙️',
                                'agent-builder': '🔨',
                                'agent-quality': '✅',
                                'agent-designer': '🎯',
                              }
                              return (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs flex items-center gap-1 bg-green-500/10 border-green-500/20"
                                >
                                  <span>{agentEmojis[agentId] || '🤖'}</span>
                                  {agentName}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Active Tool Execution Status */}
                {isLoading && activeTools.length > 0 && (
                  <Card className="border-blue-500/50 bg-blue-500/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Wrench className="h-5 w-5 text-blue-500 animate-pulse mt-1" />
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-sm">{thinkingStatus}</p>
                          <div className="flex flex-wrap gap-2">
                            {activeTools.map((tool, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Regular thinking indicator */}
                {isLoading && activeTools.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4 animate-pulse" />
                    <span>{thinkingStatus || 'Thinking...'}</span>
                  </div>
                )}

                {/* Action Buttons - At end of conversation */}
                {messages.length > 0 && (
                  <div className="flex justify-center gap-2 mt-4 mb-5">
                    {/* Stop button - only show when loading */}
                    {isLoading && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleStop}
                        className="transition-all duration-200"
                      >
                        <Square className="h-4 w-4 mr-2 fill-current" />
                        Stop
                      </Button>
                    )}

                    {/* Copy Conversation Button - always show when there are messages */}
                    <Button
                      variant={conversationCopied ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleCopyConversation}
                      className={cn(
                        'transition-all duration-200',
                        conversationCopied ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : '',
                      )}
                    >
                      {conversationCopied ? (
                        <>
                          <CheckCheckIcon className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <CopyIcon className="h-4 w-4 mr-2" />
                          Copy Conversation
                        </>
                      )}
                    </Button>

                    {/* Open in Chat button - only show when not loading */}
                    {!isLoading && (
                      <OpenIn
                        query={messages
                          .filter((msg) => msg.type !== 'tool_call' && msg.type !== 'tool_result')
                          .map((msg) => {
                            const role = msg.role === 'user' ? 'You' : 'Assistant'
                            const content =
                              typeof msg.content === 'string'
                                ? msg.content
                                : msg.content?.[0]?.type === 'text'
                                  ? msg.content[0].text
                                  : ''
                            return `${role}: ${content}`
                          })
                          .join('\n\n')}
                      >
                        <OpenInTrigger>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Open in Chat
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </OpenInTrigger>
                        <OpenInContent>
                          <OpenInChatGPT />
                          <OpenInClaude />
                          <OpenInv0 />
                          <OpenInCursor />
                        </OpenInContent>
                      </OpenIn>
                    )}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>
        )}

        {/* Login Banner - Show when no API key */}
        {!hasApiKey && typeof window !== 'undefined' && !localStorage.getItem('hideLoginBanner') && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[90] px-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 shadow-lg">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-blue-600 mb-1">✨ Using Claude Code (Free)</h3>
                      <p className="text-sm text-muted-foreground">
                        You're using Claude Code Sonnet - completely free with no API key needed!
                      </p>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-md bg-blue-500/5 border border-blue-500/20">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Want 200+ models?</span> Add your OpenRouter API
                        key in Settings to access GPT-4, Claude Opus, Gemini, and more.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-2 mt-2">
                      <Settings className="h-4 w-4" />
                      Add API Key for More Models
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('hideLoginBanner', 'true')
                        window.location.reload()
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Centered Layout - Empty State */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
            <div className="w-full max-w-2xl input-container flex flex-col items-center">
              {/* Centered Input */}
              <div className="relative flex flex-col bg-[hsl(var(--color-sidebar))] rounded-2xl p-3 gap-3 focus-within:outline-none border-2 border-border w-full">
                {/* Text input area */}
                <textarea
                  ref={textareaRef}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none ring-0 focus:outline-none focus:ring-0 text-base resize-none min-h-[80px] px-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      const value = e.currentTarget.value.trim()
                      if (value) {
                        handleSubmit({ text: value, files: attachments } as any, e as any)
                        e.currentTarget.value = ''
                        setAttachments([])
                      }
                    }
                  }}
                />

                {/* Attached files */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-zinc-700/50 rounded-lg px-2 py-1 text-xs text-zinc-300"
                      >
                        <span>{file.name}</span>
                        <button
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                          className="text-zinc-400 hover:text-zinc-200"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enhanced button row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Attachment button */}
                    <input
                      type="file"
                      id="file-input-center"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setAttachments((prev) => [...prev, ...files])
                        e.target.value = ''
                      }}
                    />
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted transition-all"
                          onClick={() => document.getElementById('file-input-center')?.click()}
                          title="Attach files"
                        >
                          <Plus className="h-8 w-8 stroke-[3]" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="w-56 p-2">
                        <div className="space-y-1">
                          <button
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => document.getElementById('file-input-center')?.click()}
                          >
                            <Image className="h-4 w-4" />
                            <span>Add pictures</span>
                          </button>
                          <button
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => document.getElementById('file-input-center')?.click()}
                          >
                            <Paperclip className="h-4 w-4" />
                            <span>Add files</span>
                          </button>
                          <button
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => setShowCamera(true)}
                          >
                            <Camera className="h-4 w-4" />
                            <span>Add camera</span>
                          </button>
                          <button
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => setShowSettings(true)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Add tools</span>
                          </button>
                        </div>
                      </HoverCardContent>
                    </HoverCard>

                    {/* Voice input */}
                    <div className="inline-flex">
                      <PromptInputSpeechButton
                        textareaRef={textareaRef}
                        onTranscriptionChange={handleTranscriptionChange}
                        className="h-16 w-16"
                      />
                    </div>

                    {/* Web search */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleWebSearch}>
                          <img src="/icon.svg" alt="ONE" className="h-5 w-5 dark:invert-0 invert" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Powered by ONE</p>
                        <a
                          href="https://one.ie"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          https://one.ie
                        </a>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Model selector */}
                    <div className="flex items-center gap-2">
                      <ModelSelector onOpenChange={setModelSelectorOpen} open={modelSelectorOpen}>
                        <ModelSelectorTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            {selectedModelData?.name || 'Select Model'}
                          </Button>
                        </ModelSelectorTrigger>
                        <ModelSelectorContent>
                          <ModelSelectorInput placeholder="Search models..." />

                          {/* Quick Add Model */}
                          <div className="px-2 py-3 border-b">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Quick Add Model</div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Paste model ID (e.g., openai/o3-deep-research)"
                                value={quickAddInput}
                                onChange={(e) => setQuickAddInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleQuickAddModel()
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 text-sm rounded-md border bg-background"
                              />
                              <Button size="sm" onClick={handleQuickAddModel} disabled={!quickAddInput.trim()}>
                                Add
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Paste any OpenRouter model ID from{' '}
                              <a
                                href="https://openrouter.ai/models"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                openrouter.ai/models
                              </a>
                            </p>
                          </div>

                          <ModelSelectorList>
                            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>

                            {/* Custom Models */}
                            {customModels.length > 0 && (
                              <ModelSelectorGroup heading="Custom Models" key="custom">
                                {customModels.map((m) => (
                                  <ModelSelectorItem
                                    key={m.id}
                                    onSelect={() => {
                                      setSelectedModel(m.id)
                                      setModelSelectorOpen(false)
                                    }}
                                    value={m.id}
                                  >
                                    <ModelSelectorLogo provider={m.chefSlug} />
                                    <ModelSelectorName>{m.name}</ModelSelectorName>
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Custom
                                    </Badge>
                                    {selectedModel === m.id && <CheckIcon className="ml-auto size-4" />}
                                  </ModelSelectorItem>
                                ))}
                              </ModelSelectorGroup>
                            )}

                            {/* Free Models */}
                            <ModelSelectorGroup heading="Free Models" key="free">
                              {allModels
                                .filter((m) => m.free)
                                .map((m) => (
                                  <ModelSelectorItem
                                    key={m.id}
                                    onSelect={() => {
                                      setSelectedModel(m.id)
                                      setModelSelectorOpen(false)
                                    }}
                                    value={m.id}
                                  >
                                    <ModelSelectorLogo provider={m.chefSlug} />
                                    <ModelSelectorName>{m.name}</ModelSelectorName>
                                    {m.hasTools && (
                                      <Badge variant="outline" className="ml-2 text-xs flex items-center gap-1">
                                        <Wrench className="h-3 w-3" />
                                        Tools
                                      </Badge>
                                    )}
                                    {m.isClaudeCode ? (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        CLI Auth
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        Free
                                      </Badge>
                                    )}
                                    {selectedModel === m.id && <CheckIcon className="ml-auto size-4" />}
                                  </ModelSelectorItem>
                                ))}
                            </ModelSelectorGroup>

                            {/* Premium Models */}
                            {['OpenAI', 'Anthropic', 'Google', 'xAI', 'DeepSeek', 'Meta'].map((chef) => {
                              const chefModels = allModels.filter((m) => !m.free && m.chef === chef)
                              if (chefModels.length === 0) return null

                              return (
                                <ModelSelectorGroup heading={chef} key={chef}>
                                  {chefModels.map((m) => (
                                    <ModelSelectorItem
                                      key={m.id}
                                      onSelect={() => {
                                        // Claude Code models work via CLI auth, don't need API key
                                        const isClaudeCode = m.id.startsWith('claude-code/')

                                        if (!hasApiKey && !isClaudeCode) {
                                          setModelSelectorOpen(false)
                                          setShowSettings(true)
                                          toast({
                                            title: 'API Key Required',
                                            description: `${m.name} requires an OpenRouter API key.`,
                                          })
                                        } else {
                                          setSelectedModel(m.id)
                                          setModelSelectorOpen(false)
                                        }
                                      }}
                                      value={m.id}
                                    >
                                      <ModelSelectorLogo provider={m.chefSlug} />
                                      <ModelSelectorName>{m.name}</ModelSelectorName>
                                      {m.hasTools && (
                                        <Badge variant="outline" className="ml-2 text-xs flex items-center gap-1">
                                          <Wrench className="h-3 w-3" />
                                          Tools
                                        </Badge>
                                      )}
                                      {!hasApiKey && !m.hasTools && (
                                        <Lock className="ml-2 h-3 w-3 text-muted-foreground" />
                                      )}
                                      {selectedModel === m.id && <CheckIcon className="ml-auto size-4" />}
                                    </ModelSelectorItem>
                                  ))}
                                </ModelSelectorGroup>
                              )
                            })}
                          </ModelSelectorList>
                        </ModelSelectorContent>
                      </ModelSelector>
                    </div>

                    {/* Send/Stop button (Primary Blue / Red when stopping) */}
                    <Button
                      variant="default"
                      className={`gap-2 shadow-lg hover:shadow-xl active:shadow-md transition-all ${
                        isLoading
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary))]/90'
                      }`}
                      onClick={() => {
                        if (isLoading) {
                          handleStop()
                        } else {
                          const textarea = textareaRef.current
                          if (textarea?.value.trim()) {
                            handleSubmit(
                              { text: textarea.value, files: attachments } as any,
                              new Event('submit') as any,
                            )
                            textarea.value = ''
                            setAttachments([])
                          }
                        }
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Square className="h-4 w-4 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>Send</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Demo Cards - Below Input */}
              {!hasMessages && (
                <div className="w-full" onMouseLeave={() => setActiveCategory('')}>
                  <div className="flex flex-col gap-2">
                    {/* Category pills - simple, no icons */}
                    <div className="flex gap-2 justify-center flex-wrap">
                      {suggestionGroups.map((group) => (
                        <button
                          key={group.label}
                          onMouseEnter={() => setActiveCategory(group.label)}
                          className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium capitalize cursor-pointer transition-all duration-200',
                            activeCategory === group.label ? 'bg-accent scale-105' : 'bg-muted hover:bg-accent/50',
                          )}
                        >
                          {group.label}
                        </button>
                      ))}
                    </div>

                    {/* Prompts - show only for active category */}
                    <div className="relative min-h-[200px]">
                      {activeCategory &&
                        (() => {
                          const activeCategoryData = suggestionGroups.find((group) => group.label === activeCategory)

                          return activeCategoryData ? (
                            <div className="flex flex-col gap-1 mt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                              {activeCategoryData.items.map((item, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    handleDemoSelect(item)
                                    setActiveCategory('')
                                  }}
                                  className="w-full text-left text-sm p-3 rounded-md bg-accent/10 hover:bg-accent/20 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
                                  style={{
                                    animationDelay: `${index * 50}ms`,
                                  }}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          ) : null
                        })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Input Area - When Messages Exist */}
        {hasMessages && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl z-10 px-4 pb-0 input-container">
            <div className="relative flex flex-col bg-[hsl(var(--color-sidebar))] rounded-2xl p-3 gap-3 focus-within:outline-none border-2 border-border">
              {/* Text input area */}
              <textarea
                ref={textareaRef}
                placeholder="Ask anything..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none ring-0 focus:outline-none focus:ring-0 text-base resize-none min-h-[80px] px-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const value = e.currentTarget.value.trim()
                    if (value) {
                      handleSubmit({ text: value, files: attachments } as any, e as any)
                      e.currentTarget.value = ''
                      setAttachments([])
                    }
                  }
                }}
              />

              {/* Attached files */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-zinc-700/50 rounded-lg px-2 py-1 text-xs text-zinc-300"
                    >
                      <span>{file.name}</span>
                      <button
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Enhanced button row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {/* Attachment button */}
                  <input
                    type="file"
                    id="file-input"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setAttachments((prev) => [...prev, ...files])
                      e.target.value = ''
                    }}
                  />
                  <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted transition-all"
                        onClick={() => document.getElementById('file-input')?.click()}
                        title="Attach files"
                      >
                        <Plus className="h-8 w-8 stroke-[3]" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="w-56 p-2">
                      <div className="space-y-1">
                        <button
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          <Image className="h-4 w-4" />
                          <span>Add pictures</span>
                        </button>
                        <button
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          <Paperclip className="h-4 w-4" />
                          <span>Add files</span>
                        </button>
                        <button
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => setShowCamera(true)}
                        >
                          <Camera className="h-4 w-4" />
                          <span>Add camera</span>
                        </button>
                        <button
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => setShowSettings(true)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Add tools</span>
                        </button>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  {/* Voice input */}
                  <div className="inline-flex">
                    <PromptInputSpeechButton
                      textareaRef={textareaRef}
                      onTranscriptionChange={handleTranscriptionChange}
                      className="h-16 w-16"
                    />
                  </div>

                  {/* Web search */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleWebSearch}>
                        <img src="/icon.svg" alt="ONE" className="h-5 w-5 dark:invert-0 invert" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Powered by ONE</p>
                      <a
                        href="https://one.ie"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        https://one.ie
                      </a>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-2">
                  {/* Model selector */}
                  <div className="flex items-center gap-2">
                    <ModelSelector onOpenChange={setModelSelectorOpen} open={modelSelectorOpen}>
                      <ModelSelectorTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          {selectedModelData?.name || 'Select Model'}
                        </Button>
                      </ModelSelectorTrigger>
                      <ModelSelectorContent>
                        <ModelSelectorInput placeholder="Search models..." />
                        <ModelSelectorList>
                          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>

                          {/* Free Models */}
                          <ModelSelectorGroup heading="Free Models" key="free">
                            {POPULAR_MODELS.filter((m) => m.free).map((m) => (
                              <ModelSelectorItem
                                key={m.id}
                                onSelect={() => {
                                  setSelectedModel(m.id)
                                  setModelSelectorOpen(false)
                                }}
                                value={m.id}
                              >
                                <ModelSelectorLogo provider={m.chefSlug} />
                                <ModelSelectorName>{m.name}</ModelSelectorName>
                                {m.hasTools && (
                                  <Badge variant="outline" className="ml-2 text-xs flex items-center gap-1">
                                    <Wrench className="h-3 w-3" />
                                    Tools
                                  </Badge>
                                )}
                                {m.isClaudeCode ? (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    CLI Auth
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Free
                                  </Badge>
                                )}
                                {selectedModel === m.id && <CheckIcon className="ml-auto size-4" />}
                              </ModelSelectorItem>
                            ))}
                          </ModelSelectorGroup>

                          {/* Premium Models */}
                          {['OpenAI', 'Anthropic', 'Google', 'xAI', 'DeepSeek', 'Meta'].map((chef) => {
                            const chefModels = POPULAR_MODELS.filter((m) => !m.free && m.chef === chef)
                            if (chefModels.length === 0) return null

                            return (
                              <ModelSelectorGroup heading={chef} key={chef}>
                                {chefModels.map((m) => (
                                  <ModelSelectorItem
                                    key={m.id}
                                    onSelect={() => {
                                      // Claude Code models work via CLI auth, don't need API key
                                      const isClaudeCode = m.id.startsWith('claude-code/')

                                      if (!hasApiKey && !isClaudeCode) {
                                        setModelSelectorOpen(false)
                                        setShowSettings(true)
                                        toast({
                                          title: 'API Key Required',
                                          description: `${m.name} requires an OpenRouter API key.`,
                                        })
                                      } else {
                                        setSelectedModel(m.id)
                                        setModelSelectorOpen(false)
                                      }
                                    }}
                                    value={m.id}
                                  >
                                    <ModelSelectorLogo provider={m.chefSlug} />
                                    <ModelSelectorName>{m.name}</ModelSelectorName>
                                    {m.hasTools && (
                                      <Badge variant="outline" className="ml-2 text-xs flex items-center gap-1">
                                        <Wrench className="h-3 w-3" />
                                        Tools
                                      </Badge>
                                    )}
                                    {!hasApiKey && !m.hasTools && (
                                      <Lock className="ml-2 h-3 w-3 text-muted-foreground" />
                                    )}
                                    {selectedModel === m.id && <CheckIcon className="ml-auto size-4" />}
                                  </ModelSelectorItem>
                                ))}
                              </ModelSelectorGroup>
                            )
                          })}
                        </ModelSelectorList>
                      </ModelSelectorContent>
                    </ModelSelector>
                  </div>

                  {/* Send button (Primary Blue) */}
                  <Button
                    variant="default"
                    className="gap-2 bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary))]/90 shadow-lg hover:shadow-xl active:shadow-md transition-all"
                    disabled={isLoading}
                    onClick={() => {
                      const textarea = textareaRef.current
                      if (textarea?.value.trim()) {
                        handleSubmit({ text: textarea.value, files: attachments } as any, new Event('submit') as any)
                        textarea.value = ''
                        setAttachments([])
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span className="hidden sm:inline">Sending</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast notifications for tool calls */}
        <Toaster />
      </div>
    </TooltipProvider>
  )
}
