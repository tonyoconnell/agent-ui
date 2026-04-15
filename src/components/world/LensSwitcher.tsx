/**
 * LENS SWITCHER — Change perspective on the same world
 *
 * Five ways to see ONE:
 * - org: hierarchical tree (membership → structure)
 * - paths: force-directed graph (pheromone → emergence)
 * - skills: radial by tag (capability → specialization)
 * - money: weighted by revenue (cash flow → economics)
 *
 * Same data. Different layout. No refetch.
 * CSS transforms + D3 transitions only.
 */

import { useEffect, useState } from 'react'
import { useSkin } from '@/contexts/SkinContext'
import { cn } from '@/lib/utils'

interface LensSwitcherProps {
  className?: string
  onLensChange?: (lens: string) => void
}

type Lens = 'org' | 'paths' | 'skills' | 'money'

const lensLabels: Record<Lens, string> = {
  org: 'Organization',
  paths: 'Paths',
  skills: 'Skills',
  money: 'Money',
}

const lensIcons: Record<Lens, string> = {
  org: '🏢',
  paths: '🐜',
  skills: '🎯',
  money: '💰',
}

export function LensSwitcher({ className, onLensChange }: LensSwitcherProps) {
  const { skin } = useSkin()
  const [currentLens, setCurrentLens] = useState<Lens>('paths')

  // Read lens from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const lens = (params.get('lens') as Lens) || 'paths'
    if (['org', 'paths', 'skills', 'money'].includes(lens)) {
      setCurrentLens(lens)
    }
  }, [])

  const handleLensClick = (lens: Lens) => {
    setCurrentLens(lens)
    onLensChange?.(lens)

    // Update URL
    const params = new URLSearchParams(window.location.search)
    params.set('lens', lens)
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
  }

  return (
    <div className={cn('flex gap-2 p-2 bg-black/30 rounded-xl', className)}>
      {(['org', 'paths', 'skills', 'money'] as Lens[]).map((lens) => (
        <button
          key={lens}
          onClick={() => handleLensClick(lens)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            currentLens === lens ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5',
          )}
          style={{
            backgroundColor: currentLens === lens ? `${skin.colors.primary}30` : undefined,
            borderColor: currentLens === lens ? skin.colors.primary : 'transparent',
            borderWidth: 1,
            boxShadow: currentLens === lens ? `0 0 20px ${skin.colors.primary}30` : undefined,
          }}
        >
          <span className="text-lg">{lensIcons[lens]}</span>
          <span>{lensLabels[lens]}</span>
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~90 lines. Five buttons. URL param-driven. No refetch.
// ═══════════════════════════════════════════════════════════════════════════════
