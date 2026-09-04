import type * as React from 'react'

type IconProps = { size?: number }

export function Fingerprint({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="17" fill="currentColor" fillOpacity={0.11} />
      <circle cx="22" cy="22" r="1.75" fill="currentColor" />
      <path
        d="M22 18.5c-1.93 0-3.5 1.57-3.5 3.5 0 3 1.2 5.8 3.5 7.5"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M22 15c-3.87 0-7 3.13-7 7 0 5 2.2 9.5 7 11.5"
        stroke="currentColor"
        strokeOpacity={0.38}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M22 11.5c-5.8 0-10.5 4.7-10.5 10.5 0 7 3.3 13 10.5 15.5"
        stroke="currentColor"
        strokeOpacity={0.38}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M29.5 13A10.48 10.48 0 0 1 32.5 22c0 7-3.3 13-10.5 15.5"
        stroke="currentColor"
        strokeOpacity={0.38}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.4}
      />
    </svg>
  )
}

export function Lock({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect
        x="9"
        y="20"
        width="26"
        height="17"
        rx="4"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <path d="M15 20v-5.5a7 7 0 0 1 14 0V20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="22" cy="29.5" r="3" fill="currentColor" fillOpacity={0.38} />
      <path d="M22 29.5v3" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  )
}

export function Chain({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect
        x="5"
        y="16"
        width="16"
        height="12"
        rx="6"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <rect
        x="23"
        y="16"
        width="16"
        height="12"
        rx="6"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <path d="M21 22h2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path
        d="M11 28.5 9 33M33 28.5l2 4.5"
        stroke="currentColor"
        strokeOpacity={0.38}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Power({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="14" fill="currentColor" fillOpacity={0.11} />
      <circle cx="22" cy="22" r="14" stroke="currentColor" strokeOpacity={0.38} strokeWidth={1.5} />
      <path d="M15 16.2A11 11 0 1 0 29 16.2" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" />
      <path d="M22 11v10" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" />
    </svg>
  )
}

export function Scales({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <ellipse
        cx="12"
        cy="28"
        rx="7"
        ry="3.5"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <ellipse
        cx="32"
        cy="28"
        rx="7"
        ry="3.5"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <line
        x1="22"
        y1="11"
        x2="22"
        y2="36"
        stroke="currentColor"
        strokeOpacity={0.38}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path d="M16 36h12" stroke="currentColor" strokeOpacity={0.38} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M7 17l15-6 15 6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17l5 11" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M37 17l-5 11" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx="22" cy="11" r="2.5" fill="currentColor" />
    </svg>
  )
}

export function Columns({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect
        x="7"
        y="34"
        width="30"
        height="3.5"
        rx="1.75"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <rect
        x="7"
        y="9"
        width="30"
        height="4.5"
        rx="1.75"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <rect
        x="10"
        y="13.5"
        width="5"
        height="20.5"
        rx="2.5"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <rect
        x="19.5"
        y="13.5"
        width="5"
        height="20.5"
        rx="2.5"
        fill="currentColor"
        fillOpacity={0.38}
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <rect
        x="29"
        y="13.5"
        width="5"
        height="20.5"
        rx="2.5"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.4}
      />
    </svg>
  )
}

export function Shield({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <path
        d="M22 6L8 12v10c0 9.5 6.2 17.5 14 20 7.8-2.5 14-10.5 14-20V12L22 6z"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M15 22l5 5.5 9-10"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Bars({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect
        x="7"
        y="28"
        width="8"
        height="8"
        rx="2"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <rect
        x="18"
        y="20"
        width="8"
        height="16"
        rx="2"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.85}
      />
      <rect
        x="29"
        y="11"
        width="8"
        height="25"
        rx="2"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.7}
      />
      <circle cx="33" cy="8" r="3" fill="currentColor" />
      <path
        d="M11 22l10-8 10 5"
        stroke="currentColor"
        strokeOpacity={0.38}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Globe({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="15" fill="currentColor" fillOpacity={0.11} stroke="currentColor" strokeWidth={1.6} />
      <ellipse cx="22" cy="22" rx="6" ry="15" stroke="currentColor" strokeOpacity={0.38} strokeWidth={1.3} />
      <path d="M7 22h30" stroke="currentColor" strokeOpacity={0.38} strokeWidth={1.3} />
      <path d="M9.5 15h25M9.5 29h25" stroke="currentColor" strokeOpacity={0.38} strokeWidth={1.1} opacity={0.6} />
      <circle cx="22" cy="22" r="2.5" fill="currentColor" />
      <path
        d="M22 19.5v-3.5M22 26v3.5M19.5 22H16M28 22h-3.5"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Approve({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect
        x="7"
        y="9"
        width="22"
        height="28"
        rx="4"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeOpacity={0.38}
        strokeWidth={1.5}
      />
      <path
        d="M12 18h12M12 23h9M12 28h6"
        stroke="currentColor"
        strokeOpacity={0.38}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <circle cx="33" cy="31" r="8" fill="black" fillOpacity={0.8} stroke="currentColor" strokeWidth={1.5} />
      <path d="M29 31l3 3 5-5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Bell({ size = 44 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <path
        d="M22 8c-6.6 0-11 4.9-11 11v8l-3 4h28l-3-4V19c0-6.1-4.4-11-11-11z"
        fill="currentColor"
        fillOpacity={0.11}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M19 34a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx="31" cy="12" r="4.5" fill="currentColor" />
      <path d="M29.5 12h3M31 10.5v3" stroke="black" strokeOpacity={0.5} strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  )
}

export type SecurityIconName =
  | 'fingerprint'
  | 'lock'
  | 'chain'
  | 'power'
  | 'scales'
  | 'columns'
  | 'shield'
  | 'bars'
  | 'globe'
  | 'approve'
  | 'bell'

export const SecurityIcons: Record<SecurityIconName, React.ComponentType<{ size?: number }>> = {
  fingerprint: Fingerprint,
  lock: Lock,
  chain: Chain,
  power: Power,
  scales: Scales,
  columns: Columns,
  shield: Shield,
  bars: Bars,
  globe: Globe,
  approve: Approve,
  bell: Bell,
}
