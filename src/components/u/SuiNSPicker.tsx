/**
 * SuiNSPicker — Text input that resolves SuiNS names or raw Sui addresses.
 *
 * Accepts:
 *   - Raw Sui address  (`0x` + 64 hex chars) → calls onChange immediately
 *   - SuiNS name       (`*.sui`)             → debounces 400ms, calls resolveHandle
 *
 * Visual states:
 *   - Resolving: inline spinner
 *   - Resolved:  green checkmark + resolved address below input
 *   - Not found: red ✗ + "Name not found"
 */

import { useState, useEffect, useRef } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { resolveHandle, isValidAddress } from './lib/money'

// ── Types ─────────────────────────────────────────────────────────────────

interface Props {
  value: string
  onChange: (address: string, displayName?: string) => void
  placeholder?: string
  disabled?: boolean
}

type ResolveState = 'idle' | 'resolving' | 'resolved' | 'not-found'

// ── Inline SVG icons ───────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-zinc-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Resolving"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-green-400"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-label="Resolved"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      className="h-4 w-4 text-red-400"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-label="Not found"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function SuiNSPicker({ value, onChange, placeholder, disabled }: Props) {
  const [inputText, setInputText] = useState(value)
  const [resolveState, setResolveState] = useState<ResolveState>('idle')
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external value changes into local input text
  useEffect(() => {
    setInputText(value)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value
    setInputText(text)

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    if (!text.trim()) {
      setResolveState('idle')
      setResolvedAddress(null)
      return
    }

    // Raw address — resolve immediately, no debounce, no RPC
    if (isValidAddress(text)) {
      setResolveState('resolved')
      setResolvedAddress(text)
      onChange(text)
      return
    }

    // SuiNS name — debounce 400ms
    setResolveState('resolving')
    setResolvedAddress(null)

    debounceRef.current = setTimeout(async () => {
      try {
        const addr = await resolveHandle(text)
        if (addr) {
          setResolveState('resolved')
          setResolvedAddress(addr)
          onChange(addr, text)
        } else {
          setResolveState('not-found')
          setResolvedAddress(null)
        }
      } catch {
        setResolveState('not-found')
        setResolvedAddress(null)
      }
    }, 400)
  }

  function handleInputClick() {
    emitClick('ui:suins-picker:focus')
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const showSpinner = resolveState === 'resolving'
  const showCheck = resolveState === 'resolved'
  const showX = resolveState === 'not-found'

  return (
    <div className="flex flex-col gap-1">
      {/* Input row */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={handleChange}
          onClick={handleInputClick}
          placeholder={placeholder ?? 'Address or SuiNS name (e.g. alice.sui)'}
          disabled={disabled}
          className={[
            'w-full bg-zinc-900 text-white text-sm rounded-lg px-3 py-2 pr-9',
            'border outline-none transition-colors',
            'placeholder:text-zinc-500',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text',
            showCheck
              ? 'border-green-500/60 focus:border-green-400'
              : showX
                ? 'border-red-500/60 focus:border-red-400'
                : 'border-zinc-700 focus:border-zinc-500',
          ]
            .filter(Boolean)
            .join(' ')}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Status icon — right-aligned inside the input */}
        {(showSpinner || showCheck || showX) && (
          <span className="absolute right-2.5 flex items-center pointer-events-none">
            {showSpinner && <SpinnerIcon />}
            {showCheck && <CheckIcon />}
            {showX && <XIcon />}
          </span>
        )}
      </div>

      {/* Sub-text feedback */}
      {showCheck && resolvedAddress && (
        <p className="text-xs text-green-400 font-mono truncate px-1">
          {resolvedAddress}
        </p>
      )}
      {showX && (
        <p className="text-xs text-red-400 px-1">Name not found</p>
      )}
    </div>
  )
}
