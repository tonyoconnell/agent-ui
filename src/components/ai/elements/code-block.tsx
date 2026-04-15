'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import { type ComponentProps, createContext, type HTMLAttributes, useContext, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Shiki removed — chat uses lightweight <pre><code> blocks.
// No grammar bundles shipped. Copy button preserved.

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language?: string
  showLineNumbers?: boolean
}

type CodeBlockContextType = {
  code: string
}

const CodeBlockContext = createContext<CodeBlockContextType>({ code: '' })

export const CodeBlock = ({
  code,
  language: _language,
  showLineNumbers: _ln,
  className,
  children,
  ...props
}: CodeBlockProps) => (
  <CodeBlockContext.Provider value={{ code }}>
    <div
      className={cn('group relative w-full overflow-hidden rounded-md border bg-muted text-foreground', className)}
      {...props}
    >
      <pre className="m-0 overflow-x-auto p-4 text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
      {children && <div className="absolute top-2 right-2 flex items-center gap-2">{children}</div>}
    </div>
  </CodeBlockContext.Provider>
)

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void
  onError?: (error: Error) => void
  timeout?: number
}

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const { code } = useContext(CodeBlockContext)

  const copyToClipboard = async () => {
    if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
      onError?.(new Error('Clipboard API not available'))
      return
    }
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      onCopy?.()
      setTimeout(() => setIsCopied(false), timeout)
    } catch (error) {
      onError?.(error as Error)
    }
  }

  const Icon = isCopied ? CheckIcon : CopyIcon
  return (
    <Button className={cn('shrink-0', className)} onClick={copyToClipboard} size="icon" variant="ghost" {...props}>
      {children ?? <Icon size={14} />}
    </Button>
  )
}
