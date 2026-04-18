'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  command: string
  description?: string
  label?: string
}

export function RunItBlock({ command, description, label = 'Run it yourself' }: Props) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const copy = () => {
    navigator.clipboard.writeText(command).then(() => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setCopied(true)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-2">
      {description && <p className="text-xs text-slate-500">{description}</p>}
      <div className="relative">
        <pre className="text-xs font-mono p-3 pr-20 rounded-md bg-[#0a0a0f] text-slate-300 border border-slate-800 overflow-x-auto">
          <code>{command}</code>
        </pre>
        <button
          type="button"
          aria-label={label}
          onClick={copy}
          className={cn(
            'absolute right-2 top-2 px-2 py-1 rounded text-xs font-mono transition-colors',
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600 hover:text-slate-200',
          )}
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
    </div>
  )
}
