/**
 * SKIN SWITCHER — Change metaphors, change perspective
 *
 * Same data. Different lens. New understanding.
 */

import { useSkin } from '@/contexts/SkinContext'
import { cn } from '@/lib/utils'

interface SkinSwitcherProps {
  variant?: 'full' | 'compact' | 'icons'
  className?: string
}

export function SkinSwitcher({ variant = 'full', className }: SkinSwitcherProps) {
  const { skin, skinId, setSkin, allSkins } = useSkin()

  if (variant === 'icons') {
    return (
      <div className={cn('flex gap-1', className)}>
        {Object.values(allSkins).map((s) => (
          <button
            key={s.id}
            onClick={() => setSkin(s.id)}
            title={s.name}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all',
              skinId === s.id ? 'bg-white/20 ring-2 ring-white/30' : 'bg-black/20 hover:bg-white/10',
            )}
            style={{
              borderColor: skinId === s.id ? s.colors.primary : 'transparent',
              borderWidth: 2,
            }}
          >
            {s.icons.actor}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <select
        value={skinId}
        onChange={(e) => setSkin(e.target.value)}
        className={cn(
          'bg-black/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          className,
        )}
        style={{ borderColor: `${skin.colors.primary}50` }}
      >
        {Object.values(allSkins).map((s) => (
          <option key={s.id} value={s.id}>
            {s.icons.actor} {s.name}
          </option>
        ))}
      </select>
    )
  }

  // Full variant
  return (
    <div className={cn('flex flex-wrap gap-2 p-2 bg-black/30 rounded-xl', className)}>
      {Object.values(allSkins).map((s) => (
        <button
          key={s.id}
          onClick={() => setSkin(s.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            skinId === s.id ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5',
          )}
          style={{
            backgroundColor: skinId === s.id ? `${s.colors.primary}30` : undefined,
            borderColor: skinId === s.id ? s.colors.primary : 'transparent',
            borderWidth: 1,
            boxShadow: skinId === s.id ? `0 0 20px ${s.colors.primary}30` : undefined,
          }}
        >
          <span className="text-lg">{s.icons.actor}</span>
          <span>{s.name}</span>
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~80 lines. Switch metaphors.
// ═══════════════════════════════════════════════════════════════════════════════
