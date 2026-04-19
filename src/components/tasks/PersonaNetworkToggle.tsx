import { Bot, User } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { Network, Persona } from './types'

const NETWORKS: Array<{ value: Network; label: string; dot: string }> = [
  { value: 'testnet', label: 'Testnet', dot: 'bg-amber-400' },
  { value: 'mainnet', label: 'Mainnet', dot: 'bg-emerald-400' },
]

interface Props {
  persona: Persona
  onPersonaChange: (p: Persona) => void
  network: Network
  onNetworkChange: (n: Network) => void
  mainnetDisabled?: boolean
}

export function PersonaNetworkToggle({ persona, onPersonaChange, network, onNetworkChange, mainnetDisabled }: Props) {
  return (
    <div className="flex items-center gap-2">
      {/* Persona segmented control */}
      <div className="flex items-center rounded-full bg-white/[0.03] border border-white/[0.06] p-0.5">
        <SegBtn
          active={persona === 'human'}
          onClick={() => onPersonaChange('human')}
          label="Human"
          icon={<User className="w-3 h-3" />}
        />
        <SegBtn
          active={persona === 'agent'}
          onClick={() => onPersonaChange('agent')}
          label="Agent"
          icon={<Bot className="w-3 h-3" />}
        />
      </div>

      {/* Network segmented control */}
      <div className="flex items-center rounded-full bg-white/[0.03] border border-white/[0.06] p-0.5">
        {NETWORKS.map((n) => {
          const disabled = n.value === 'mainnet' && mainnetDisabled
          return (
            <button
              key={n.value}
              type="button"
              onClick={() => !disabled && onNetworkChange(n.value)}
              disabled={disabled}
              className={cn(
                'relative px-3 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1.5',
                network === n.value ? 'text-white' : 'text-white/40 hover:text-white/70',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {network === n.value && (
                <motion.span
                  layoutId="net-pill"
                  className="absolute inset-0 rounded-full bg-white/[0.08]"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span className={cn('relative w-1.5 h-1.5 rounded-full', n.dot)} />
              <span className="relative">{n.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SegBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative px-3 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1.5',
        active ? 'text-white' : 'text-white/40 hover:text-white/70',
      )}
    >
      {active && (
        <motion.span
          layoutId="persona-pill"
          className="absolute inset-0 rounded-full bg-white/[0.08]"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <span className="relative">{icon}</span>
      <span className="relative">{label}</span>
    </button>
  )
}
