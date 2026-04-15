import {
  Camera,
  CheckIcon,
  Image,
  Lock,
  Paperclip,
  Play,
  Plus,
  Settings as SettingsIcon,
  Square,
  Wrench,
} from 'lucide-react'
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
import { PromptInputSpeechButton } from '@/components/ai/elements/prompt-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { POPULAR_MODELS } from '@/lib/chat/models'
import { cn } from '@/lib/utils'

interface Props {
  hasMessages: boolean
  isLoading: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  attachments: File[]
  onAttach: (files: File[]) => void
  onRemoveAttachment: (index: number) => void
  onSubmit: (text: string) => void
  onStop: () => void
  onOpenCamera: () => void
  onOpenSettings: () => void
  onTranscriptionChange: (text: string) => void
  // model selector
  selectedModel: string
  selectedModelName: string
  allModels: typeof POPULAR_MODELS
  hasApiKey: boolean
  customModels: typeof POPULAR_MODELS
  quickAddInput: string
  onQuickAddInputChange: (val: string) => void
  onQuickAddModel: () => void
  onModelChange: (id: string) => void
  onModelSelectorOpenChange: (open: boolean) => void
  modelSelectorOpen: boolean
  onNeedKey: (modelName: string) => void
}

export function PromptDock({
  hasMessages,
  isLoading,
  textareaRef,
  attachments,
  onAttach,
  onRemoveAttachment,
  onSubmit,
  onStop,
  onOpenCamera,
  onOpenSettings,
  onTranscriptionChange,
  selectedModel,
  selectedModelName,
  allModels,
  hasApiKey,
  customModels,
  quickAddInput,
  onQuickAddInputChange,
  onQuickAddModel,
  onModelChange,
  onModelSelectorOpenChange,
  modelSelectorOpen,
  onNeedKey,
}: Props) {
  const inner = (
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
              onSubmit(value)
              e.currentTarget.value = ''
            }
          }
        }}
      />

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-zinc-700/50 rounded-lg px-2 py-1 text-xs text-zinc-300"
            >
              <span>{file.name}</span>
              <button onClick={() => onRemoveAttachment(index)} className="text-zinc-400 hover:text-zinc-200">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Button row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left side */}
        <div className="flex items-center gap-1">
          {/* Attachment button */}
          <input
            type="file"
            id="file-input-dock"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              onAttach(files)
              e.target.value = ''
            }}
          />
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted transition-all"
                onClick={() => document.getElementById('file-input-dock')?.click()}
                title="Attach files"
              >
                <Plus className="h-8 w-8 stroke-[3]" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="w-56 p-2">
              <div className="space-y-1">
                <button
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => document.getElementById('file-input-dock')?.click()}
                >
                  <Image className="h-4 w-4" />
                  <span>Add pictures</span>
                </button>
                <button
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => document.getElementById('file-input-dock')?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                  <span>Add files</span>
                </button>
                <button
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={onOpenCamera}
                >
                  <Camera className="h-4 w-4" />
                  <span>Add camera</span>
                </button>
                <button
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={onOpenSettings}
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span>Add tools</span>
                </button>
              </div>
            </HoverCardContent>
          </HoverCard>

          {/* Voice input */}
          <div className="inline-flex">
            <PromptInputSpeechButton
              textareaRef={textareaRef}
              onTranscriptionChange={onTranscriptionChange}
              className="h-16 w-16"
            />
          </div>

          {/* ONE web search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
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

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Model selector */}
          <div className="flex items-center gap-2">
            <ModelSelector onOpenChange={onModelSelectorOpenChange} open={modelSelectorOpen}>
              <ModelSelectorTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {selectedModelName || 'Select Model'}
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
                      onChange={(e) => onQuickAddInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onQuickAddModel()
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-sm rounded-md border bg-background"
                    />
                    <Button size="sm" onClick={onQuickAddModel} disabled={!quickAddInput.trim()}>
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
                            onModelChange(m.id)
                            onModelSelectorOpenChange(false)
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
                            onModelChange(m.id)
                            onModelSelectorOpenChange(false)
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
                              const isClaudeCode = m.id.startsWith('claude-code/')
                              if (!hasApiKey && !isClaudeCode) {
                                onModelSelectorOpenChange(false)
                                onNeedKey(m.name)
                              } else {
                                onModelChange(m.id)
                                onModelSelectorOpenChange(false)
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
                            {!hasApiKey && !m.hasTools && <Lock className="ml-2 h-3 w-3 text-muted-foreground" />}
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

          {/* Send / Stop button */}
          <Button
            variant="default"
            className={cn(
              'gap-2 shadow-lg hover:shadow-xl active:shadow-md transition-all',
              isLoading
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary))]/90',
            )}
            onClick={() => {
              if (isLoading) {
                onStop()
              } else {
                const textarea = textareaRef.current
                if (textarea?.value.trim()) {
                  onSubmit(textarea.value)
                  textarea.value = ''
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
  )

  if (hasMessages) {
    return (
      <TooltipProvider>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl z-10 px-4 pb-0 input-container">
          {inner}
        </div>
      </TooltipProvider>
    )
  }

  return <TooltipProvider>{inner}</TooltipProvider>
}
