import { Bot, Brain, Camera, Info, Plus, Settings, Sparkles, X } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Toaster } from '@/components/ui/toaster'
import { useChat } from '@/hooks/ai/useChat'
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_MODEL, POPULAR_MODELS } from '@/lib/chat/models'
import { ConversationView } from './ConversationView'
import { DemoSuggestions } from './DemoSuggestions'
import { FullPageFrame } from './frames/FullPageFrame'
import { InlineFrame } from './frames/InlineFrame'
import { SplitPaneFrame } from './frames/SplitPaneFrame'
import { WidgetFrame } from './frames/WidgetFrame'
import { handleCommand } from './MemoryCommands'
import { emitClick } from '@/lib/ui-signal'
import { PromptDock } from './PromptDock'
import { SettingsModal } from './SettingsModal'

const STORAGE_KEY = 'openrouter-api-key'
const MODEL_KEY = 'openrouter-model'

interface Props {
  /** Layout mode. Defaults to 'full' (current full-page behaviour). */
  mode?: 'full' | 'split' | 'widget' | 'inline'
  /** Target uid for actor-directed chat (e.g. "person:*", "group:*"). Stored, not yet routed. */
  target?: string
}

export function ChatShell({ mode = 'full', target: _target }: Props) {
  // UI state (chat state lives in useChat)
  const [apiKey, setApiKey] = useState('')
  const [serverHasKey, setServerHasKey] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [customModels, setCustomModels] = useState<typeof POPULAR_MODELS>([])
  const [quickAddInput, setQuickAddInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [commandResult, setCommandResult] = useState<ReactNode>(null)
  const [conversationCopied, setConversationCopied] = useState(false)
  const [useDirector, setUseDirector] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [newMessageSender, setNewMessageSender] = useState<string | null>(null)
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, isLoading, error, thinkingStatus, activeTools, activeAgents, send, stop, clear } = useChat({
    selectedModel,
    apiKey,
    serverHasKey,
    useDirector,
  })

  const allModels = [...POPULAR_MODELS, ...customModels]
  const selectedModelData = allModels.find((m) => m.id === selectedModel)
  const hasApiKey = !!apiKey || serverHasKey
  const hasMessages = messages.length > 0

  // Load persisted state + check server key on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null
    const savedModel = localStorage.getItem(MODEL_KEY)
    const savedCustom = localStorage.getItem('custom-models')
    if (savedKey) setApiKey(savedKey)
    if (savedModel) setSelectedModel(savedModel)
    if (savedCustom) {
      try {
        setCustomModels(JSON.parse(savedCustom))
      } catch (_) {}
    }
    fetch('/api/chat-config')
      .then((r) => r.json())
      .then((res: unknown) => {
        const cfg = res as { hasKey?: boolean }
        if (cfg.hasKey) setServerHasKey(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && customModels.length > 0) {
      localStorage.setItem('custom-models', JSON.stringify(customModels))
    }
  }, [customModels])

  const handleSaveApiKey = () => {
    if (!apiKey) return
    if (typeof window !== 'undefined') sessionStorage.setItem(STORAGE_KEY, apiKey)
    localStorage.setItem(MODEL_KEY, selectedModel)
    toast({ title: 'API Key Saved', description: 'All premium features are now unlocked!' })
    setShowSettings(false)
  }

  const handleClearKey = () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(MODEL_KEY)
    setApiKey('')
    clear()
    toast({ title: 'API Key Removed', description: 'Switched back to free tier' })
  }

  const handleSubmit = useCallback(
    async (text: string) => {
      setAttachments([])
      if (text.trim().startsWith('/')) {
        const node = await handleCommand(text, 'visitor:web', () => setCommandResult(null))
        setCommandResult(node)
        return
      }
      const result = await send(text)
      if (result.needsKey) {
        setShowSettings(true)
        toast({
          title: 'API Key Required',
          description: `${result.modelName} requires an OpenRouter API key. Add your key or switch to a free model.`,
        })
      }
    },
    [send, toast],
  )

  const handleScrollStateChange = useCallback((atBottom: boolean, latestSender: string | null) => {
    setIsAtBottom(atBottom)
    if (atBottom) setNewMessageSender(null)
    else if (latestSender) setNewMessageSender(latestSender)
  }, [])

  const handleCopyConversation = async () => {
    try {
      const text = messages
        .filter((m) => m.type !== 'tool_call' && m.type !== 'tool_result')
        .map((m) => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`)
        .join('\n\n')
      await navigator.clipboard.writeText(text)
      setConversationCopied(true)
      toast({ title: 'Conversation copied!', description: 'Entire conversation copied to clipboard' })
      setTimeout(() => setConversationCopied(false), 2000)
    } catch (_) {
      toast({ title: 'Copy failed', description: 'Could not copy conversation', variant: 'destructive' })
    }
  }

  const handleQuickAddModel = () => {
    const input = quickAddInput.trim()
    if (!input) return
    const parts = input.includes('/') ? input.split('/') : ['openrouter', input]
    const [provider, name] = parts
    const m = {
      id: input,
      name: name
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      chef: provider.charAt(0).toUpperCase() + provider.slice(1),
      chefSlug: provider.toLowerCase(),
      providers: [provider.toLowerCase()],
      free: false,
      context: '128K',
    }
    if (!allModels.some((x) => x.id === input)) {
      setCustomModels((prev) => [...prev, m])
      setSelectedModel(input)
      setQuickAddInput('')
      setModelSelectorOpen(false)
    }
  }

  const dockProps = {
    isLoading,
    textareaRef,
    attachments,
    onAttach: (files: File[]) => setAttachments((prev) => [...prev, ...files]),
    onRemoveAttachment: (i: number) => setAttachments((prev) => prev.filter((_, idx) => idx !== i)),
    onSubmit: handleSubmit,
    onStop: stop,
    onOpenCamera: () => setShowCamera(true),
    onOpenSettings: () => setShowSettings(true),
    onTranscriptionChange: (text: string) => {
      if (textareaRef.current) textareaRef.current.value = text
    },
    selectedModel,
    selectedModelName: selectedModelData?.name ?? '',
    allModels,
    hasApiKey,
    customModels,
    quickAddInput,
    onQuickAddInputChange: setQuickAddInput,
    onQuickAddModel: handleQuickAddModel,
    onModelChange: (id: string) => {
      setSelectedModel(id)
      localStorage.setItem(MODEL_KEY, id)
    },
    onModelSelectorOpenChange: setModelSelectorOpen,
    modelSelectorOpen,
    onNeedKey: (modelName: string) => {
      setShowSettings(true)
      toast({ title: 'API Key Required', description: `${modelName} requires an OpenRouter API key.` })
    },
  }

  const shell = (
    <div className="relative flex size-full flex-col overflow-hidden items-center justify-center bg-background">
      <style>{`
        textarea:focus,input:focus,button:focus{outline:none!important;border:none!important;box-shadow:none!important}
        .is-assistant pre{background-color:hsl(var(--muted))!important;border:1px solid hsl(var(--border))!important;border-radius:.5rem!important;padding:1rem!important;overflow-x:auto!important;margin:.5rem 0!important}
        .is-assistant code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace!important;font-size:.875rem!important;line-height:1.5!important}
        .is-assistant pre code{background:none!important;padding:0!important;border:none!important;border-radius:0!important}
        .is-assistant :not(pre)>code{background-color:hsl(var(--muted))!important;padding:.125rem .375rem!important;border-radius:.25rem!important;font-size:.875em!important}
        .input-container{transition:all .6s cubic-bezier(.4,0,.2,1)}
      `}</style>

      {/* New Chat + Director toggle */}
      <div className="fixed top-4 left-4 md:left-[100px] z-[100] flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={() => {
            emitClick('ui:chat:clear')
            clear()
            if (textareaRef.current) textareaRef.current.value = ''
            setAttachments([])
          }}
          className="bg-[hsl(var(--color-tertiary))] text-[hsl(var(--color-tertiary-foreground))] hover:bg-[hsl(var(--color-tertiary))]/90 shadow-lg hover:shadow-xl active:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <Button
              size="sm"
              variant={useDirector ? 'default' : 'outline'}
              onClick={() => { emitClick('ui:chat:toggle-director'); setUseDirector(!useDirector) }}
              className={
                useDirector
                  ? 'bg-purple-600 hover:bg-purple-700 text-white transition-all'
                  : 'bg-background hover:bg-accent transition-all'
              }
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
                      ? 'Agent Director analyzes, assigns specialists, orchestrates in parallel.'
                      : 'Direct model access. Faster for simple queries.'}
                  </p>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      {showSettings && (
        <SettingsModal
          apiKey={apiKey}
          setApiKey={setApiKey}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onSave={handleSaveApiKey}
          onClear={handleClearKey}
          onClose={() => {
            setApiKey('')
            setSelectedModel('google/gemini-2.5-flash-lite')
            clear()
            setShowSettings(false)
          }}
        />
      )}

      {error && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl z-20 px-6 py-2">
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-2xl">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10"
              onClick={() => { emitClick('ui:chat:camera-close'); setShowCamera(false) }}
            >
              ✕
            </Button>
            <video
              id="camera-preview"
              autoPlay
              playsInline
              className="w-full rounded-lg"
              ref={(v) => {
                if (v && showCamera) {
                  navigator.mediaDevices
                    .getUserMedia({ video: true })
                    .then((s) => {
                      v.srcObject = s
                    })
                    .catch(() => setShowCamera(false))
                }
              }}
            >
              <track kind="captions" srcLang="en" label="Camera preview" />
            </video>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => {
                  emitClick('ui:chat:capture-photo')
                  const v = document.getElementById('camera-preview') as HTMLVideoElement
                  if (!v) return
                  const c = document.createElement('canvas')
                  c.width = v.videoWidth
                  c.height = v.videoHeight
                  c.getContext('2d')?.drawImage(v, 0, 0)
                  c.toBlob((b) => {
                    if (!b) return
                    setAttachments((prev) => [
                      ...prev,
                      new File([b], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }),
                    ])
                    ;(v.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop())
                    setShowCamera(false)
                  }, 'image/jpeg')
                }}
                className="gap-2 bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary))]/90 shadow-lg transition-all"
              >
                <Camera className="h-4 w-4" /> Capture Photo
              </Button>
            </div>
          </div>
        </div>
      )}

      {hasMessages && (
        <ConversationView
          messages={messages}
          isLoading={isLoading}
          activeTools={activeTools}
          thinkingStatus={thinkingStatus}
          useDirector={useDirector}
          activeAgents={activeAgents}
          isAtBottom={isAtBottom}
          newMessageSender={newMessageSender}
          conversationCopied={conversationCopied}
          onScrollStateChange={handleScrollStateChange}
          onCopyConversation={handleCopyConversation}
          onStop={stop}
        />
      )}

      {!hasApiKey && typeof window !== 'undefined' && !localStorage.getItem('hideLoginBanner') && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[90] px-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <Card className="border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 shadow-lg">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-blue-600">✨ Using Claude Code (Free)</h3>
                  <div className="flex items-start gap-2 p-2 rounded-md bg-blue-500/5 border border-blue-500/20">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Want 200+ models?</span> Add your OpenRouter API key
                      in Settings.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { emitClick('ui:chat:settings'); setShowSettings(true) }} className="gap-2 mt-2">
                    <Settings className="h-4 w-4" /> Add API Key for More Models
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => {
                    emitClick('ui:chat:dismiss-banner')
                    localStorage.setItem('hideLoginBanner', 'true')
                    window.location.reload()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasMessages && (
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
          <div className="w-full max-w-2xl input-container flex flex-col items-center">
            <PromptDock hasMessages={false} {...dockProps} />
            <DemoSuggestions
              onSelectDemo={(p) => {
                void handleSubmit(p)
              }}
            />
          </div>
        </div>
      )}

      {commandResult && (
        <div className="absolute bottom-24 left-4 right-4 z-50 rounded-xl border border-border bg-background shadow-lg">
          <div className="flex items-start justify-between p-3 pb-0">
            <span className="text-xs text-slate-500">Command result</span>
            <button
              type="button"
              onClick={() => { emitClick('ui:chat:dismiss-result'); setCommandResult(null) }}
              className="text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">{commandResult}</div>
        </div>
      )}
      {hasMessages && <PromptDock hasMessages={true} {...dockProps} />}

      <Toaster />
    </div>
  )

  if (mode === 'widget') return <WidgetFrame unreadCount={messages.length}>{shell}</WidgetFrame>
  if (mode === 'split') return <SplitPaneFrame>{shell}</SplitPaneFrame>
  if (mode === 'inline') return <InlineFrame>{shell}</InlineFrame>
  return <FullPageFrame>{shell}</FullPageFrame>
}
