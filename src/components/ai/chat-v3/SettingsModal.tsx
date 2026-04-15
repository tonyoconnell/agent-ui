import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { POPULAR_MODELS } from '@/lib/chat/models'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  apiKey: string
  setApiKey: (key: string) => void
  selectedModel: string
  setSelectedModel: (m: string) => void
  onSave: () => void
  onClear: () => void
  onClose: () => void
}

export function SettingsModal({ apiKey, setApiKey, selectedModel, setSelectedModel, onSave, onClear, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unlock Premium Features</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => { emitClick('ui:settings:close'); onClose() }}>
            ✕
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-xs">
              ✨ <strong>Default: Gemini 2.5 Flash Lite (FREE)</strong> - No authentication required, works instantly.
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
            <Button onClick={() => { emitClick('ui:settings:save'); onSave() }} className="flex-1">
              Unlock Features
            </Button>
            {apiKey && (
              <Button variant="destructive" size="sm" onClick={() => { emitClick('ui:settings:clear'); onClear() }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
