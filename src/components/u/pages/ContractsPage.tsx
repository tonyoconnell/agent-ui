/**
 * ContractsPage - AI-Powered Smart Contract Generation
 *
 * Uses the same chat pattern as /pages/chat for AI-first contract generation.
 * When users click on contract template cards, the system sends structured
 * prompts to the AI chat to guide users through contract creation.
 *
 * Features:
 * - Deploy contracts from templates via AI chat
 * - Import existing contracts
 * - Interact with contract functions
 * - View contract events
 * - Verify on explorers
 * - Linked to products, tokens, wallets
 */

import {
  Code2,
  Coins,
  ExternalLink,
  FileCode,
  Handshake,
  Image as ImageIcon,
  Landmark,
  Lock,
  Plus,
  Settings,
  Shield,
  TrendingUp,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { secureGetItem, secureSetItem } from '@/lib/security'
import { cn } from '@/lib/utils'

// Contract template definitions with prompts
const CONTRACT_TEMPLATES = [
  {
    id: 'erc20',
    name: 'ERC-20 Token',
    description: 'Standard fungible token',
    icon: <Coins className="w-6 h-6" />,
    emoji: '🪙',
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-500/10 to-orange-600/10',
    borderColor: 'border-amber-500/20',
    prompt: `I want to create an **ERC-20 Token** smart contract.

Please help me configure the following:
1. What should the token be called? (Name)
2. What's the ticker symbol? (e.g., ETH, USDC)
3. What's the total supply?
4. How many decimals? (standard is 18)
5. Should it be mintable? (can create more tokens later)
6. Should it be burnable? (can destroy tokens)
7. Should it be pausable? (emergency stop)
8. Which chain will this deploy on?

Once I have these details, I'll generate a secure, audited smart contract for you.`,
  },
  {
    id: 'erc721',
    name: 'ERC-721 NFT',
    description: 'Non-fungible token collection',
    icon: <ImageIcon className="w-6 h-6" />,
    emoji: '🖼️',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-500/10 to-pink-600/10',
    borderColor: 'border-purple-500/20',
    prompt: `I want to create an **ERC-721 NFT Collection** smart contract.

Please help me configure:
1. What's the collection name?
2. What's the symbol?
3. What's the base metadata URI?
4. What's the maximum supply?
5. What's the mint price?
6. Should there be royalties? What percentage?
7. Should it be revealable?
8. Which chain will this deploy on?

I'll generate a battle-tested NFT contract with all modern features.`,
  },
  {
    id: 'multisig',
    name: 'Multi-Sig Wallet',
    description: 'Requires multiple signatures',
    icon: <Lock className="w-6 h-6" />,
    emoji: '🔐',
    gradient: 'from-blue-500 to-cyan-600',
    bgGradient: 'from-blue-500/10 to-cyan-600/10',
    borderColor: 'border-blue-500/20',
    prompt: `I want to create a **Multi-Signature Wallet** smart contract.

This provides enhanced security by requiring multiple approvals for transactions.

Please provide:
1. How many owners will this wallet have?
2. What are the owner addresses?
3. How many signatures are required to execute a transaction?
4. Should there be a daily transaction limit?
5. Which chain will this deploy on?

I'll generate a secure multi-sig wallet contract.`,
  },
  {
    id: 'escrow',
    name: 'Escrow',
    description: 'Hold funds until conditions met',
    icon: <Handshake className="w-6 h-6" />,
    emoji: '🤝',
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-500/10 to-emerald-600/10',
    borderColor: 'border-green-500/20',
    prompt: `I want to create an **Escrow** smart contract.

This holds funds securely until predefined conditions are met.

Please configure:
1. Who is the buyer? (address)
2. Who is the seller? (address)
3. Who is the arbiter/mediator? (address)
4. What token will be held? (ETH, USDC, etc.)
5. What are the release conditions?
6. What's the dispute resolution period?
7. Which chain will this deploy on?

I'll generate a trustless escrow contract.`,
  },
  {
    id: 'staking',
    name: 'Staking Pool',
    description: 'Stake tokens for rewards',
    icon: <TrendingUp className="w-6 h-6" />,
    emoji: '📈',
    gradient: 'from-indigo-500 to-violet-600',
    bgGradient: 'from-indigo-500/10 to-violet-600/10',
    borderColor: 'border-indigo-500/20',
    prompt: `I want to create a **Staking Pool** smart contract.

Users can stake tokens to earn rewards over time.

Please configure:
1. What token will users stake?
2. What token are the rewards paid in?
3. What's the reward rate/APY?
4. Is there a lock-up period? How long?
5. Is there a minimum stake amount?
6. Is there a maximum pool size?
7. Which chain will this deploy on?

I'll generate a yield-generating staking contract.`,
  },
  {
    id: 'dao',
    name: 'DAO Governance',
    description: 'Voting and proposals',
    icon: <Landmark className="w-6 h-6" />,
    emoji: '🏛️',
    gradient: 'from-rose-500 to-red-600',
    bgGradient: 'from-rose-500/10 to-red-600/10',
    borderColor: 'border-rose-500/20',
    prompt: `I want to create a **DAO Governance** smart contract.

This enables decentralized decision-making through voting.

Please configure:
1. What's the governance token address?
2. What's the quorum requirement? (% of tokens needed)
3. How long is the voting period?
4. Is there a proposal threshold? (tokens needed to propose)
5. Is there a timelock delay for execution?
6. What actions can be governed?
7. Which chain will this deploy on?

I'll generate a complete DAO governance system.`,
  },
]

// Contract interface
interface Contract {
  id: string
  name: string
  type: string
  chain: string
  address: string
  createdAt: number
  verified: boolean
  functions: string[]
}

const STORAGE_KEY = 'openrouter-api-key'

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof CONTRACT_TEMPLATES)[0] | null>(null)

  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  // Load contracts and API key from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('u_contracts')
      if (stored) setContracts(JSON.parse(stored))

      const envApiKey = import.meta.env.PUBLIC_OPENROUTER_API_KEY
      const savedKey = envApiKey || secureGetItem(STORAGE_KEY)
      if (savedKey) setApiKey(savedKey)
    }
  }, [])

  // Handle template click
  const handleTemplateClick = (template: (typeof CONTRACT_TEMPLATES)[0]) => {
    setSelectedTemplate(template)
    setError(null)
  }

  // Save contract
  const _saveContract = (name: string, type: string, address: string) => {
    const contract: Contract = {
      id: `contract-${Date.now()}`,
      name,
      type,
      chain: 'eth',
      address,
      createdAt: Date.now(),
      verified: false,
      functions: ['read', 'write', 'approve', 'transfer'],
    }

    const updated = [...contracts, contract]
    setContracts(updated)
    localStorage.setItem('u_contracts', JSON.stringify(updated))
    toast({ title: 'Contract Saved', description: `${name} has been added to your contracts.` })
  }

  return (
    <TooltipProvider>
      <div className="relative flex size-full flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Smart Contracts</h1>
              <p className="text-xs text-muted-foreground">AI-powered contract generation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedTemplate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTemplate(null)
                  setError(null)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Settings</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription className="text-xs">
                    <strong>Default Model: Kimi K2</strong> - Optimized for smart contract generation with 256K token
                    context and advanced reasoning capabilities.
                    <br />
                    <br />
                    Set <code className="bg-muted px-1 py-0.5 rounded text-xs">PUBLIC_OPENROUTER_API_KEY</code> in your
                    environment for automatic authentication.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label>OpenRouter API Key</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Get a free key at{' '}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      openrouter.ai/keys
                    </a>{' '}
                    with $5 free credits
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (apiKey) {
                      secureSetItem(STORAGE_KEY, apiKey)
                      toast({ title: 'Saved', description: 'API key saved successfully' })
                    }
                    setShowSettings(false)
                  }}
                >
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Content */}
        {!selectedTemplate ? (
          /* Template Selection */
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-4 py-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Create Smart Contract</h2>
                <p className="text-muted-foreground">Choose a template to get started</p>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {CONTRACT_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
                      'border-2 border-transparent hover:border-primary/20',
                      `bg-linear-to-br ${template.bgGradient}`,
                    )}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg',
                            `bg-linear-to-br ${template.gradient}`,
                          )}
                        >
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Custom Code Option */}
              <Card
                className="cursor-pointer transition-all hover:shadow-lg border-dashed"
                onClick={() => {
                  const customTemplate = {
                    id: 'custom',
                    name: 'Custom Code',
                    description: 'Custom Solidity code',
                    icon: <Code2 className="w-6 h-6" />,
                    emoji: '💻',
                    gradient: 'from-gray-500 to-slate-600',
                    bgGradient: 'from-gray-500/10 to-slate-600/10',
                    borderColor: 'border-gray-500/20',
                    prompt: 'I can help with custom Solidity code!',
                  }
                  handleTemplateClick(customTemplate)
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Code2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Custom Code</h3>
                      <p className="text-sm text-muted-foreground">Paste your own Solidity code for review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deployed Contracts */}
              {contracts.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-semibold mb-4">Your Contracts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contracts.map((contract) => {
                      const template = CONTRACT_TEMPLATES.find((t) => t.id === contract.type)
                      return (
                        <Card key={contract.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center text-white',
                                  template ? `bg-linear-to-br ${template.gradient}` : 'bg-muted',
                                )}
                              >
                                {template?.icon || <FileCode className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="font-medium">{contract.name}</div>
                                <code className="text-xs text-muted-foreground">
                                  {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
                                </code>
                              </div>
                              {contract.verified && (
                                <Badge variant="secondary" className="ml-auto">
                                  <Shield className="w-3 h-3 mr-1" /> Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                Interact
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(`https://etherscan.io/address/${contract.address}`, '_blank')
                                }
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* AI chat placeholder */
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center justify-center h-64 text-slate-500 text-sm">AI assistant coming soon</div>
          </div>
        )}

        <Toaster />
      </div>
    </TooltipProvider>
  )
}
