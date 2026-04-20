import { Handle, type NodeProps, Position } from '@xyflow/react'
import { useEffect, useState } from 'react'

const C = {
  bg: '#0a0a0f',
  ceo: { bg: '#0f1140', border: '#4f46e5', text: '#a5b4fc', accent: '#6366f1' },
  director: { bg: '#150d2e', border: '#6d28d9', text: '#c084fc', accent: '#7c3aed' },
  hired: '#10b981',
}

interface UnitData {
  uid: string
  role: string
  wallet: string | null
  skills: string[]
  status: 'hired' | 'hiring'
  [key: string]: unknown
}

interface AgentDetail {
  id: string
  name: string
  skills?: Array<{ name: string }>
  wallet?: string | null
  prompt?: string
}

export function UnitNode({ data }: NodeProps) {
  const d = data as UnitData
  const isCeo = d.role === 'ceo'
  const isHiring = d.status === 'hiring'
  const colors = isCeo ? C.ceo : C.director

  const [skills, setSkills] = useState<string[]>(d.skills)
  const [wallet, setWallet] = useState<string | null>(d.wallet)

  useEffect(() => {
    if (isCeo || isHiring) return
    if (skills.length > 0) return
    let cancelled = false
    fetch(`/api/agents/detail?id=${encodeURIComponent(d.uid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((detail: AgentDetail | null) => {
        if (cancelled || !detail) return
        if (detail.skills?.length) setSkills(detail.skills.map((s) => s.name))
        if (detail.wallet) setWallet(detail.wallet)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [d.uid, isCeo, isHiring, skills.length])

  return (
    <div
      className={`rounded-xl border select-none px-4 py-3 min-w-[168px] transition-all duration-300 ${isHiring ? 'animate-pulse' : ''}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: isHiring ? `${colors.border}60` : colors.border,
        boxShadow: isHiring ? 'none' : `0 0 20px ${colors.accent}25`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 8, height: 8, backgroundColor: colors.border, border: `2px solid ${C.bg}`, top: -4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 8, height: 8, backgroundColor: colors.accent, border: `2px solid ${C.bg}`, bottom: -4 }}
      />

      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-slate-100">{d.role.toUpperCase()}</span>
        {!isHiring && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${C.hired}18`, color: C.hired }}
          >
            hired
          </span>
        )}
      </div>

      <div className="text-[10px] font-mono truncate max-w-[148px]" style={{ color: colors.text }}>
        {d.uid}
      </div>

      {wallet && (
        <div className="text-[9px] font-mono truncate max-w-[148px] mt-0.5 text-slate-600">{wallet.slice(0, 18)}…</div>
      )}

      {!isHiring && skills.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {skills.slice(0, 3).map((s) => (
            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a1a2e] text-slate-500">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
