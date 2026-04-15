/**
 * PERSONA MENU — Persona Switcher
 *
 * Dropdown in top-right of Health Strip
 * Button text: "[Current Persona ▾]" (default blank or user's role)
 * Options (10 total):
 * - Anne (EHC) → ?persona=anne
 * - Eth Developer → ?persona=eth
 * - ASI Builder → ?persona=asi
 * - Startup Founder → ?persona=founder
 * - DeFi Trader → ?persona=trader
 * - Community Builder → ?persona=community
 * - Designer → ?persona=designer
 * - DevOps → ?persona=ops
 * - Code Helper → ?persona=coder
 * - Content Writer → ?persona=writer
 *
 * On select: Set URL params (see world-map-page.md table for each mapping)
 * Example: ?persona=anne → ?group=ehc.framework&lens=org&skin=team&focus=ehc-officer
 *
 * Selected option highlighted
 */

import { useEffect, useState } from 'react'
import { useSkin } from '@/contexts/SkinContext'
import { cn } from '@/lib/utils'

interface PersonaConfig {
  id: string
  label: string
  params: Record<string, string>
}

const personas: PersonaConfig[] = [
  {
    id: 'anne',
    label: 'Anne (EHC)',
    params: { group: 'ehc.framework', lens: 'org', skin: 'team', focus: 'ehc-officer' },
  },
  {
    id: 'eth',
    label: 'Eth Developer',
    params: { focus: 'eth-dev', lens: 'money', skin: 'team' },
  },
  {
    id: 'asi',
    label: 'ASI Builder',
    params: { group: 'asi', lens: 'paths', skin: 'ant' },
  },
  {
    id: 'founder',
    label: 'Startup Founder',
    params: { lens: 'org', skin: 'team' }, // Requires group param to be set dynamically
  },
  {
    id: 'trader',
    label: 'DeFi Trader',
    params: { focus: 'trader', lens: 'paths', skin: 'signal' },
  },
  {
    id: 'community',
    label: 'Community Builder',
    params: { group: 'community', lens: 'paths', skin: 'ant' },
  },
  {
    id: 'designer',
    label: 'Designer',
    params: { focus: 'designer', lens: 'skills', skin: 'team' },
  },
  {
    id: 'ops',
    label: 'DevOps',
    params: { lens: 'health', skin: 'signal' },
  },
  {
    id: 'coder',
    label: 'Code Helper',
    params: { focus: 'coder', lens: 'paths', skin: 'brain' },
  },
  {
    id: 'writer',
    label: 'Content Writer',
    params: { focus: 'writer', lens: 'paths', skin: 'team' },
  },
]

interface Props {
  className?: string
}

export function PersonaMenu({ className }: Props) {
  const { skin } = useSkin()
  const [isOpen, setIsOpen] = useState(false)
  const [currentPersona, setCurrentPersona] = useState<PersonaConfig | null>(null)

  // Read persona from URL on mount and when URL changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const personaId = params.get('persona')
    if (personaId) {
      const persona = personas.find((p) => p.id === personaId)
      setCurrentPersona(persona || null)
    } else {
      setCurrentPersona(null)
    }
  }, [])

  const handlePersonaSelect = (persona: PersonaConfig) => {
    setCurrentPersona(persona)
    setIsOpen(false)

    // Build new URL with persona params
    const params = new URLSearchParams(window.location.search)

    // Set persona param
    params.set('persona', persona.id)

    // Set all persona-specific params
    for (const [key, value] of Object.entries(persona.params)) {
      params.set(key, value)
    }

    // Navigate using window.location
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }

  const buttonLabel = currentPersona ? currentPersona.label : 'Choose Persona'

  return (
    <div className={cn('relative', className)}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
        style={{
          color: skin.colors.primary,
          backgroundColor: isOpen ? `${skin.colors.primary}15` : 'transparent',
          borderWidth: 1,
          borderColor: isOpen ? `${skin.colors.primary}40` : `${skin.colors.primary}20`,
        }}
      >
        <span className="truncate max-w-xs">[{buttonLabel} ▾]</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-56 rounded-lg border shadow-xl z-50 overflow-hidden"
          style={{
            backgroundColor: skin.colors.surface,
            borderColor: `${skin.colors.primary}40`,
          }}
        >
          <div className="max-h-96 overflow-y-auto">
            {personas.map((persona) => {
              const isSelected = currentPersona?.id === persona.id
              return (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaSelect(persona)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b transition-colors',
                    'hover:bg-white/5',
                    isSelected && 'font-semibold',
                  )}
                  style={{
                    backgroundColor: isSelected ? `${skin.colors.primary}20` : undefined,
                    borderColor: `${skin.colors.muted}20`,
                    color: isSelected ? skin.colors.primary : skin.colors.muted,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{persona.label}</span>
                    {isSelected && <span className="text-lg">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~150 lines. Persona dropdown in top-right. URL param-driven. No local state.
// ═══════════════════════════════════════════════════════════════════════════════
