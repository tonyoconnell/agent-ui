'use client'

// Icons - Comprehensive set
import {
  AlertCircle,
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bell,
  Bold,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Cloud,
  Code,
  Copy,
  CreditCard,
  Database,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Folder,
  Globe,
  Grid3x3,
  Heart,
  HelpCircle,
  Home,
  Image,
  Info,
  Italic,
  Layers,
  Link,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Minus,
  Moon,
  MoreHorizontal,
  MoreVertical,
  Music,
  Package,
  Palette,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
  Settings,
  Share,
  ShoppingCart,
  Sparkles,
  Star,
  Sun,
  Target,
  Terminal,
  Trash,
  Underline,
  Upload,
  User,
  Users,
  Video,
  Wand2,
  Waves,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// ============================================================
// ICON LIBRARY DATA
// ============================================================

const iconCategories = {
  Actions: [
    { name: 'Plus', icon: Plus },
    { name: 'Minus', icon: Minus },
    { name: 'X', icon: X },
    { name: 'Check', icon: Check },
    { name: 'Edit', icon: Edit },
    { name: 'Pencil', icon: Pencil },
    { name: 'Trash', icon: Trash },
    { name: 'Save', icon: Save },
    { name: 'Download', icon: Download },
    { name: 'Upload', icon: Upload },
    { name: 'Copy', icon: Copy },
    { name: 'Share', icon: Share },
    { name: 'RefreshCw', icon: RefreshCw },
    { name: 'Search', icon: Search },
    { name: 'Filter', icon: Filter },
  ],
  Navigation: [
    { name: 'Home', icon: Home },
    { name: 'Menu', icon: Menu },
    { name: 'ChevronDown', icon: ChevronDown },
    { name: 'ChevronRight', icon: ChevronRight },
    { name: 'ArrowRight', icon: ArrowRight },
    { name: 'ExternalLink', icon: ExternalLink },
    { name: 'Link', icon: Link },
    { name: 'MoreHorizontal', icon: MoreHorizontal },
    { name: 'MoreVertical', icon: MoreVertical },
  ],
  Status: [
    { name: 'Check', icon: Check },
    { name: 'CheckCircle', icon: CheckCircle },
    { name: 'XCircle', icon: XCircle },
    { name: 'AlertCircle', icon: AlertCircle },
    { name: 'AlertTriangle', icon: AlertTriangle },
    { name: 'Info', icon: Info },
    { name: 'HelpCircle', icon: HelpCircle },
    { name: 'Loader2', icon: Loader2 },
    { name: 'Circle', icon: Circle },
  ],
  Media: [
    { name: 'Image', icon: Image },
    { name: 'Video', icon: Video },
    { name: 'Music', icon: Music },
    { name: 'FileText', icon: FileText },
    { name: 'Folder', icon: Folder },
    { name: 'Play', icon: Play },
    { name: 'Eye', icon: Eye },
    { name: 'EyeOff', icon: EyeOff },
  ],
  Communication: [
    { name: 'Mail', icon: Mail },
    { name: 'MessageSquare', icon: MessageSquare },
    { name: 'Bell', icon: Bell },
    { name: 'Send', icon: ArrowRight },
  ],
  User: [
    { name: 'User', icon: User },
    { name: 'Users', icon: Users },
    { name: 'Settings', icon: Settings },
    { name: 'Lock', icon: Lock },
    { name: 'LogOut', icon: LogOut },
  ],
  Commerce: [
    { name: 'ShoppingCart', icon: ShoppingCart },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'Package', icon: Package },
    { name: 'Heart', icon: Heart },
    { name: 'Star', icon: Star },
  ],
  Development: [
    { name: 'Code', icon: Code },
    { name: 'Terminal', icon: Terminal },
    { name: 'Database', icon: Database },
    { name: 'Cloud', icon: Cloud },
    { name: 'Globe', icon: Globe },
    { name: 'Layers', icon: Layers },
    { name: 'Rocket', icon: Rocket },
    { name: 'Zap', icon: Zap },
  ],
  Theming: [
    { name: 'Sun', icon: Sun },
    { name: 'Moon', icon: Moon },
    { name: 'Palette', icon: Palette },
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Wand2', icon: Wand2 },
  ],
}

// ============================================================
// CSS ANIMATION DATA
// ============================================================

interface CSSAnimation {
  name: string
  description: string
  class: string
  previewClass: string
  code: string
  isInfinite?: boolean
  isShimmer?: boolean
  isGradient?: boolean
}

const cssAnimations: CSSAnimation[] = [
  {
    name: 'fade-in',
    description: 'Fade in from opacity 0 to 1',
    class: 'animate-fade-in',
    previewClass: 'animate-fade-in',
    code: `@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in { animation: fadeIn 0.5s ease-in forwards; }`,
  },
  {
    name: 'fade-in-up',
    description: 'Fade in while sliding up',
    class: 'animate-[fadeInUp_0.6s_ease-out_forwards]',
    previewClass: 'animate-[fadeInUp_0.6s_ease-out_forwards]',
    code: `@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Usage: animate-[fadeInUp_0.6s_ease-out_forwards] */`,
  },
  {
    name: 'float-gentle',
    description: 'Gentle floating animation (infinite)',
    class: 'animate-float-gentle',
    previewClass: 'animate-float-gentle',
    isInfinite: true,
    code: `@keyframes float-gentle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(1deg); }
}
.animate-float-gentle { animation: float-gentle 6s ease-in-out infinite; }`,
  },
  {
    name: 'pulse-slow',
    description: 'Slow pulsing effect (infinite)',
    class: 'animate-pulse-slow',
    previewClass: 'animate-pulse-slow',
    isInfinite: true,
    code: `@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.98); }
}
.animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }`,
  },
  {
    name: 'shimmer',
    description: 'Shimmer loading effect (infinite)',
    class: 'animate-shimmer',
    previewClass: '',
    isShimmer: true,
    isInfinite: true,
    code: `@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer { animation: shimmer 3s ease-in-out infinite; }`,
  },
  {
    name: 'gradient',
    description: 'Animated gradient background (infinite)',
    class: 'animate-gradient',
    previewClass: '',
    isGradient: true,
    isInfinite: true,
    code: `@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.animate-gradient { background-size: 200% auto; animation: gradient 3s ease infinite; }`,
  },
  {
    name: 'bounce-in',
    description: 'Bouncy entrance animation',
    class: 'animate-bounce-in',
    previewClass: 'animate-bounce-in',
    code: `@keyframes bounce-in {
  0% { opacity: 0; transform: translateY(20px); }
  60% { opacity: 1; transform: translateY(-5px); }
  100% { transform: translateY(0); }
}
.animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; }`,
  },
  {
    name: 'scale-in',
    description: 'Scale in from smaller size',
    class: 'animate-scale-in',
    previewClass: 'animate-scale-in',
    code: `@keyframes scale-in {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-scale-in { animation: scale-in 0.3s ease-out forwards; }`,
  },
  {
    name: 'slide-in',
    description: 'Slide in from right',
    class: 'animate-slide-in',
    previewClass: 'animate-slide-in',
    code: `@keyframes slide-in {
  0% { opacity: 0; transform: translateX(20px); }
  100% { opacity: 1; transform: translateX(0); }
}
.animate-slide-in { animation: slide-in 0.4s ease-out forwards; }`,
  },
  {
    name: 'glow-pulse',
    description: 'Glowing pulse effect (infinite)',
    class: 'animate-glow-pulse',
    previewClass: 'animate-glow-pulse',
    isInfinite: true,
    code: `@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(var(--color-primary), 0.3); }
  50% { box-shadow: 0 0 40px rgba(var(--color-primary), 0.6); }
}
.animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }`,
  },
]

// ============================================================
// CONTRAST CALCULATOR
// ============================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  if (!rgb1 || !rgb2) return 0

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

function getWCAGRating(ratio: number): { level: string; color: string } {
  if (ratio >= 7) return { level: 'AAA', color: 'text-green-500' }
  if (ratio >= 4.5) return { level: 'AA', color: 'text-green-500' }
  if (ratio >= 3) return { level: 'AA Large', color: 'text-yellow-500' }
  return { level: 'Fail', color: 'text-red-500' }
}

// ============================================================
// COPY TO CLIPBOARD COMPONENT
// ============================================================

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className={`h-8 px-2 ${className}`}>
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
          <span className="text-xs">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Copy</span>
        </>
      )}
    </Button>
  )
}

// ============================================================
// CODE BLOCK WITH COPY
// ============================================================

function CodeBlock({ code, language = 'css' }: { code: string; language?: string }) {
  return (
    <div className="relative rounded-lg bg-muted">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function DesignSystemShowcase() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [foregroundColor, setForegroundColor] = useState('#1a365d')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [playingAnimation, setPlayingAnimation] = useState<string | null>(null)
  const [progress, setProgress] = useState(33)

  // Function to play a specific animation
  const playAnimation = (animName: string) => {
    // Remove animation
    setPlayingAnimation(null)

    // Force reflow by using setTimeout
    setTimeout(() => {
      setPlayingAnimation(animName)

      // For non-infinite animations, reset after animation completes
      if (!cssAnimations.find((a) => a.name === animName)?.isInfinite) {
        setTimeout(() => {
          setPlayingAnimation(null)
        }, 1000) // Reset after 1 second
      }
    }, 10)
  }

  // Animate progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const contrastRatio = getContrastRatio(foregroundColor, backgroundColor)
  const wcagRating = getWCAGRating(contrastRatio)

  // Filter icons based on search
  const filteredIcons = Object.entries(iconCategories).reduce(
    (acc, [category, icons]) => {
      if (selectedCategory !== 'All' && category !== selectedCategory) {
        return acc
      }
      const filtered = icons.filter((icon) => icon.name.toLowerCase().includes(searchQuery.toLowerCase()))
      if (filtered.length > 0) {
        acc[category] = filtered
      }
      return acc
    },
    {} as Record<string, typeof iconCategories.Actions>,
  )

  return (
    <TooltipProvider>
      <div className="space-y-16">
        {/* ============================================================
            SECTION 1: COMPONENT SHOWCASE
            ============================================================ */}
        <section className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Component Showcase</h2>
                <p className="text-muted-foreground">Live interactive demos of all shadcn/ui components</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="buttons" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="overlay">Overlays</TabsTrigger>
              <TabsTrigger value="data">Data Display</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            {/* Buttons Tab */}
            <TabsContent value="buttons" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Button Variants */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Button Variants</CardTitle>
                    <CardDescription>All available button styles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button>Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="link">Link</Button>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                      <Button size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button disabled>Disabled</Button>
                      <Button className="gap-2">
                        <Mail className="h-4 w-4" />
                        With Icon
                      </Button>
                      <Button className="gap-2">
                        Loading
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Toggle & Toggle Group */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Toggle Components</CardTitle>
                    <CardDescription>Toggle buttons and groups</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Toggle aria-label="Toggle bold">
                        <Bold className="h-4 w-4" />
                      </Toggle>
                      <Toggle aria-label="Toggle italic">
                        <Italic className="h-4 w-4" />
                      </Toggle>
                      <Toggle aria-label="Toggle underline">
                        <Underline className="h-4 w-4" />
                      </Toggle>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Text Alignment</Label>
                      <ToggleGroup type="single" defaultValue="left">
                        <ToggleGroupItem value="left">
                          <AlignLeft className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="center">
                          <AlignCenter className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="right">
                          <AlignRight className="h-4 w-4" />
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Multi-select</Label>
                      <ToggleGroup type="multiple" defaultValue={['bold']}>
                        <ToggleGroupItem value="bold">
                          <Bold className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="italic">
                          <Italic className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="underline">
                          <Underline className="h-4 w-4" />
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={`import { Button } from "@/components/ui/button"

// Variants
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus className="h-4 w-4" /></Button>

// With icon
<Button className="gap-2">
  <Mail className="h-4 w-4" />
  With Icon
</Button>`}
                    language="tsx"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inputs Tab */}
            <TabsContent value="inputs" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Text Inputs</CardTitle>
                    <CardDescription>Various input configurations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" placeholder="you@example.com" type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="Enter password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="search">With Icon</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="search" className="pl-9" placeholder="Search..." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="disabled">Disabled</Label>
                      <Input id="disabled" disabled placeholder="Disabled input" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="textarea">Textarea</Label>
                      <Textarea id="textarea" placeholder="Type your message here..." />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Selection Controls</CardTitle>
                    <CardDescription>Checkboxes, radios, switches</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Checkboxes</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="check1" defaultChecked />
                          <Label htmlFor="check1" className="font-normal">
                            Checked by default
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="check2" />
                          <Label htmlFor="check2" className="font-normal">
                            Unchecked
                          </Label>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Toggle theme</p>
                      </div>
                      <Switch />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label>Radio Group</Label>
                      <RadioGroup defaultValue="option1">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="option1" id="r1" />
                          <Label htmlFor="r1">Option 1</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="option2" id="r2" />
                          <Label htmlFor="r2">Option 2</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Select</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select framework" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="react">React</SelectItem>
                          <SelectItem value="vue">Vue</SelectItem>
                          <SelectItem value="angular">Angular</SelectItem>
                          <SelectItem value="astro">Astro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Range & Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <Label>Slider</Label>
                      <Slider defaultValue={[50]} max={100} step={1} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Progress</Label>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Badges</CardTitle>
                    <CardDescription>Status indicators and labels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Badge className="gap-1">
                        <CheckCircle className="h-3 w-3" /> Success
                      </Badge>
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Error
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" /> Pending
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Skeleton Loading</CardTitle>
                    <CardDescription>Placeholder loading states</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[160px]" />
                      </div>
                    </div>
                    <Skeleton className="h-[125px] w-full rounded-lg" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Overlays Tab */}
            <TabsContent value="overlay" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dialogs & Alerts</CardTitle>
                    <CardDescription>Modal windows and confirmations</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Open Dialog</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Dialog Title</DialogTitle>
                          <DialogDescription>This is a dialog description explaining the purpose.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <p>Dialog content goes here.</p>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Confirm</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Item</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline">Open Sheet</Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Sheet Title</SheetTitle>
                          <SheetDescription>Slide-out panel content</SheetDescription>
                        </SheetHeader>
                        <div className="py-4">
                          <p>Sheet content here...</p>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tooltips & Dropdowns</CardTitle>
                    <CardDescription>Hover and click interactions</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is a tooltip</p>
                      </TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" /> Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Data Display Tab */}
            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Table</CardTitle>
                  <CardDescription>Data table component</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { name: 'John Doe', status: 'Active', role: 'Admin', amount: '$250.00' },
                        { name: 'Jane Smith', status: 'Pending', role: 'User', amount: '$150.00' },
                        { name: 'Bob Johnson', status: 'Inactive', role: 'User', amount: '$350.00' },
                      ].map((row) => (
                        <TableRow key={row.name}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === 'Active' ? 'default' : row.status === 'Pending' ? 'secondary' : 'outline'
                              }
                            >
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.role}</TableCell>
                          <TableCell className="text-right">{row.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Accordion</CardTitle>
                  <CardDescription>Expandable sections</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>What is shadcn/ui?</AccordionTrigger>
                      <AccordionContent>
                        A collection of reusable components built with Radix UI and Tailwind CSS.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Is it accessible?</AccordionTrigger>
                      <AccordionContent>Yes. All components follow WAI-ARIA guidelines.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Can I customize it?</AccordionTrigger>
                      <AccordionContent>Yes. You have full control over the code and styling.</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cards</CardTitle>
                    <CardDescription>Container components</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Nested Card</CardTitle>
                        <CardDescription>With header and content</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Card content here</p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Avatar</CardTitle>
                    <CardDescription>User profile images</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">AB</AvatarFallback>
                    </Avatar>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* ============================================================
            SECTION 2: ICON LIBRARY
            ============================================================ */}
        <section className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Grid3x3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Icon Library</h2>
                <p className="text-muted-foreground">100+ Lucide icons organized by category</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {Object.keys(iconCategories).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Icon Grid */}
          <div className="space-y-8">
            {Object.entries(filteredIcons).map(([category, icons]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold">{category}</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {icons.map((item) => (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        <button
                          className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-background p-3 transition-all hover:bg-muted hover:shadow-md"
                          onClick={() => navigator.clipboard.writeText(`<${item.name} />`)}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                            {item.name}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to copy: &lt;{item.name} /&gt;</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Icon Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock
                code={`import { Search, Settings, User } from "lucide-react"

// Basic usage
<Search className="h-4 w-4" />

// With button
<Button className="gap-2">
  <Settings className="h-4 w-4" />
  Settings
</Button>

// Sizes
<User className="h-3 w-3" />  // Small
<User className="h-4 w-4" />  // Default
<User className="h-5 w-5" />  // Medium
<User className="h-6 w-6" />  // Large

// Colors
<Heart className="h-4 w-4 text-red-500" />
<Star className="h-4 w-4 text-yellow-500" />
<Check className="h-4 w-4 text-green-500" />`}
                language="tsx"
              />
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* ============================================================
            SECTION 3: CSS ANIMATIONS
            ============================================================ */}
        <section className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Waves className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">CSS Animation Library</h2>
                <p className="text-muted-foreground">Pre-built animations for smooth interactions</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {cssAnimations.map((anim) => {
              const isPlaying = playingAnimation === anim.name

              return (
                <Card key={anim.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{anim.name}</CardTitle>
                        {anim.isInfinite && (
                          <Badge variant="secondary" className="text-xs">
                            infinite
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => playAnimation(anim.name)}>
                        <Play className="h-3 w-3 mr-1" />
                        Play
                      </Button>
                    </div>
                    <CardDescription>{anim.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Animation Preview */}
                    <div className="flex items-center justify-center h-24 rounded-lg bg-muted overflow-hidden">
                      {anim.isShimmer ? (
                        /* Shimmer effect */
                        <div className="relative h-12 w-32 rounded-lg bg-muted-foreground/20 overflow-hidden">
                          {isPlaying && (
                            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                          )}
                        </div>
                      ) : anim.isGradient ? (
                        /* Gradient animation */
                        <div
                          className={`h-12 w-32 rounded-lg ${isPlaying ? 'animate-gradient' : ''}`}
                          style={{
                            background:
                              'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary)))',
                            backgroundSize: '200% auto',
                          }}
                        />
                      ) : (
                        /* Standard animation */
                        <div className={`h-12 w-12 rounded-lg bg-primary ${isPlaying ? anim.previewClass : ''}`} />
                      )}
                    </div>

                    {/* Code */}
                    <CodeBlock code={anim.code} language="css" />

                    {/* Class to copy */}
                    <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                      <code className="text-sm text-primary">{anim.class}</code>
                      <CopyButton text={anim.class} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <Separator />

        {/* ============================================================
            SECTION 4: CONTRAST CHECKER
            ============================================================ */}
        <section className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Contrast Checker</h2>
                <p className="text-muted-foreground">Validate color combinations for WCAG accessibility</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Color Contrast Analyzer</CardTitle>
              <CardDescription>Enter two colors to check if they meet WCAG accessibility standards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Color Inputs */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="foreground">Foreground (Text Color)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="foreground"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        placeholder="#000000"
                      />
                      <input
                        type="color"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="background">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="background"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#ffffff"
                      />
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div
                    className="p-6 rounded-lg text-center"
                    style={{
                      backgroundColor: backgroundColor,
                      color: foregroundColor,
                    }}
                  >
                    <p className="text-2xl font-bold">Sample Text</p>
                    <p className="text-sm">The quick brown fox jumps over the lazy dog</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-background p-4 text-center">
                      <p className="text-3xl font-bold">{contrastRatio.toFixed(2)}:1</p>
                      <p className="text-sm text-muted-foreground">Contrast Ratio</p>
                    </div>
                    <div className="rounded-lg border bg-background p-4 text-center">
                      <p className={`text-3xl font-bold ${wcagRating.color}`}>{wcagRating.level}</p>
                      <p className="text-sm text-muted-foreground">WCAG Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WCAG Guidelines */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="font-semibold mb-2">WCAG Guidelines</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={contrastRatio >= 4.5 ? 'default' : 'outline'}>
                      {contrastRatio >= 4.5 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </Badge>
                    <span>
                      <strong>AA Normal Text:</strong> 4.5:1 contrast ratio required
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={contrastRatio >= 3 ? 'default' : 'outline'}>
                      {contrastRatio >= 3 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </Badge>
                    <span>
                      <strong>AA Large Text:</strong> 3:1 contrast ratio required
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={contrastRatio >= 7 ? 'default' : 'outline'}>
                      {contrastRatio >= 7 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </Badge>
                    <span>
                      <strong>AAA Normal Text:</strong> 7:1 contrast ratio required
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </TooltipProvider>
  )
}

export default DesignSystemShowcase
