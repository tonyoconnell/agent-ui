import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { BrandTokens } from '@/engine/brand'
import { purpleBrand } from '@/engine/brand'

interface Props {
  thingId?: string
  groupId?: string
  initial?: BrandTokens
}

type TokenKey = keyof BrandTokens
type Mode = 'light' | 'dark'

const TOKEN_KEYS: TokenKey[] = ['primary', 'secondary', 'tertiary', 'background', 'foreground', 'font']

function parseHsl(val: string): [number, number, number] {
  const parts = val.trim().split(/\s+/)
  return [
    Number.parseFloat(parts[0] ?? '0'),
    Number.parseFloat((parts[1] ?? '0%').replace('%', '')),
    Number.parseFloat((parts[2] ?? '0%').replace('%', '')),
  ]
}

function toHslString(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`
}

function applyTokens(tokens: BrandTokens): void {
  const root = document.documentElement
  for (const key of TOKEN_KEYS) {
    const modeVal = tokens[key]
    const isDark = root.classList.contains('dark')
    const raw = isDark ? modeVal.dark : modeVal.light
    const [h, s, l] = parseHsl(raw)
    root.style.setProperty(`--color-${key}`, `${h} ${s}% ${l}%`)
  }
}

interface TokenRowProps {
  label: string
  value: string
  onChange: (next: string) => void
}

function TokenRow({ label, value, onChange }: TokenRowProps) {
  const [h, s, l] = parseHsl(value)

  return (
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-center gap-3">
        <Label className="w-24 shrink-0 text-sm capitalize text-foreground">{label}</Label>
        <div
          className="h-6 w-6 shrink-0 rounded border border-border"
          style={{ background: `hsl(${h} ${s}% ${l}%)` }}
        />
      </div>
      <div className="flex flex-col gap-1 pl-1">
        <div className="flex items-center gap-2">
          <span className="w-4 text-xs text-muted-foreground">H</span>
          <Slider
            min={0}
            max={360}
            step={1}
            value={[h]}
            onValueChange={([v]) => onChange(toHslString(v ?? h, s, l))}
            className="flex-1"
          />
          <span className="w-8 text-right text-xs text-muted-foreground">{Math.round(h)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 text-xs text-muted-foreground">S</span>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[s]}
            onValueChange={([v]) => onChange(toHslString(h, v ?? s, l))}
            className="flex-1"
          />
          <span className="w-8 text-right text-xs text-muted-foreground">{Math.round(s)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 text-xs text-muted-foreground">L</span>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[l]}
            onValueChange={([v]) => onChange(toHslString(h, s, v ?? l))}
            className="flex-1"
          />
          <span className="w-8 text-right text-xs text-muted-foreground">{Math.round(l)}%</span>
        </div>
      </div>
    </div>
  )
}

export function BrandEditor({ thingId, groupId, initial }: Props) {
  const [tokens, setTokens] = useState<BrandTokens>(initial ?? purpleBrand)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    applyTokens(tokens)
  }, [tokens])

  function updateToken(key: TokenKey, mode: Mode, next: string) {
    setTokens((prev) => ({
      ...prev,
      [key]: { ...prev[key], [mode]: next },
    }))
    setSaved(false)
  }

  async function handleSave() {
    const scope = thingId ? 'thing' : groupId ? 'group' : 'user'
    const id = thingId ?? groupId ?? undefined
    const res = await fetch('/api/brand/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, id, brand: tokens }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <Tabs defaultValue="light">
        <TabsList>
          <TabsTrigger value="light">Light</TabsTrigger>
          <TabsTrigger value="dark">Dark</TabsTrigger>
        </TabsList>
        {(['light', 'dark'] as const).map((mode) => (
          <TabsContent key={mode} value={mode} className="mt-3 divide-y divide-border">
            {TOKEN_KEYS.map((key) => (
              <TokenRow
                key={key}
                label={key}
                value={tokens[key][mode]}
                onChange={(next) => updateToken(key, mode, next)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
      <div className="flex items-center gap-3 pt-1">
        <Button onClick={handleSave} size="sm">
          Save
        </Button>
        {saved && <span className="text-xs text-muted-foreground">Saved</span>}
      </div>
    </div>
  )
}
