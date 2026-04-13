/**
 * ChatSettings - Settings panel
 * API key management, preferences, and help
 */

import { Info, Key, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { secureGetItem, secureRemoveItem, secureSetItem } from '@/lib/security'

const STORAGE_KEY = 'openrouter-api-key'

interface ChatSettingsProps {
  onClose: () => void
}

export function ChatSettings({ onClose }: ChatSettingsProps) {
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const { toast } = useToast()

  // Load API key on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = secureGetItem(STORAGE_KEY)
      if (savedKey) {
        setApiKey(savedKey)
        setHasApiKey(true)
      }
    }
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an API key',
        variant: 'destructive',
      })
      return
    }

    secureSetItem(STORAGE_KEY, apiKey)
    setHasApiKey(true)
    toast({
      title: 'API Key Saved',
      description: 'Premium models are now available!',
    })
    onClose()
  }

  const handleClear = () => {
    secureRemoveItem(STORAGE_KEY)
    setApiKey('')
    setHasApiKey(false)
    toast({
      title: 'API Key Removed',
      description: 'Switched back to free models',
    })
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure your AI chat experience</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* API Key Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="api-key" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  OpenRouter API Key
                </Label>
                {hasApiKey && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    Connected
                  </Badge>
                )}
              </div>

              <Input
                id="api-key"
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />

              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Free models work without an API key. Premium models (GPT-5, Claude Sonnet 4.5, etc.) require an
                  OpenRouter API key.
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-primary hover:underline"
                  >
                    Get your key here →
                  </a>
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            {/* Model Info */}
            <div className="space-y-3">
              <h3 className="font-semibold">Available Models</h3>

              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">Free Models</p>
                    <p className="text-xs text-muted-foreground">Gemini Flash, Sherlock Think, DeepSeek</p>
                  </div>
                  <Badge variant="secondary">No key required</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">Premium Models</p>
                    <p className="text-xs text-muted-foreground">GPT-5, Claude Sonnet 4.5, Gemini Pro</p>
                  </div>
                  <Badge variant="outline">API key required</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Features Info */}
            <div className="space-y-3">
              <h3 className="font-semibold">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    FREE
                  </Badge>
                  Agent reasoning traces
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    FREE
                  </Badge>
                  Tool calling & execution
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    FREE
                  </Badge>
                  Generative UI (charts, tables, forms)
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    FREE
                  </Badge>
                  Structured data generation
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    FREE
                  </Badge>
                  50+ AI models
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <div>
              {hasApiKey && (
                <Button variant="destructive" onClick={handleClear} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Remove Key
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
