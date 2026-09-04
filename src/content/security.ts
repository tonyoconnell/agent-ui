export type BrandFamily = 'primary' | 'secondary' | 'tertiary'
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

export interface OrgRow {
  icon: SecurityIconName
  family: BrandFamily
  title: string
  lead: string
  body: string
}

export interface HowCard {
  icon: SecurityIconName
  family: BrandFamily
  step: string
  label: string
  text: string
}

export interface TrustStat {
  icon: SecurityIconName
  stat: string
  sub: string
}

export interface ComparisonRow {
  old: string
  next: string
}

export interface AuthorityCard {
  head: string
  q: string
  a: string
  family: BrandFamily
}

export interface ZoneCard {
  label: string
  family: BrandFamily
  bullet: string
  items: string[]
}

export interface HardQuestion {
  q: string
  a: string
}

export const orgRows: OrgRow[] = [
  {
    icon: 'scales',
    family: 'primary',
    title: 'Legal and contracts',
    lead: 'Every authorisation is now a provable event, not a disputed claim.',
    body: `A Touch ID signature meets the technical criteria for a qualified electronic signature in most jurisdictions — sole control, uniquely identifies the signer, linked to the signed data, tamper-evident. Board resolutions, financial authorisations, governance actions: each carries a biometric proof that the person was there. Not their device. Not their account. Them.`,
  },
  {
    icon: 'columns',
    family: 'secondary',
    title: 'Governance',
    lead: 'Multi-sig extends the biometric root across your leadership team.',
    body: `Require three of five board members to biometrically confirm before a major action executes. No single stolen device, no single coerced person can act alone. Governance gets a physics layer — not because we wrote a policy, but because the cryptography requires it.`,
  },
  {
    icon: 'shield',
    family: 'tertiary',
    title: 'Compliance and audit',
    lead: 'Every transaction traces to a biometric authorisation. KYC at the root, not the edge.',
    body: `An auditor follows any payment to the human who set the limits that permitted it. GDPR erasure is a biometrically-signed action with an immutable record. The audit trail lives on the Sui blockchain — we cannot alter it.`,
  },
  {
    icon: 'bars',
    family: 'primary',
    title: 'Finance and treasury',
    lead: 'An AI agent with treasury access is a liability. A capped, auditable one is an asset.',
    body: `An agent whose spending limit was set with your CEO's biometric signature, whose allowed recipient list was signed by your CFO, and whose pause trigger fires the moment either of them calls it — that is a controlled, legally-grounded instrument. The agent acts. The human remains accountable.`,
  },
  {
    icon: 'globe',
    family: 'tertiary',
    title: 'Government and sovereign',
    lead: 'Run your own substrate. We never hold your keys.',
    body: `Your own biometric root, your own key hierarchy, your own database. Every action taken in the system traces to a biometrically-proven person in your organisation. Federation with other agencies requires a biometric handshake from both sides. The audit trail is yours, on-chain, and cannot be altered.`,
  },
]

export const howCards: HowCard[] = [
  {
    icon: 'fingerprint',
    family: 'primary',
    step: '01',
    label: 'The Secure Enclave',
    text: 'A dedicated security chip inside every Apple device. It generates a private key at manufacture and is physically designed to never let it out — not to the OS, not to apps, not to us. When you touch Touch ID, the chip signs. The key stays inside.',
  },
  {
    icon: 'chain',
    family: 'tertiary',
    step: '02',
    label: 'Key derivation',
    text: "Touch ID produces a 32-byte hardware-bound secret. From this, every key in your system is derived: your wallet, your API access, your agents' encryption keys. One biometric. All keys. None on our servers.",
  },
  {
    icon: 'lock',
    family: 'primary',
    step: '03',
    label: 'Spending caps',
    text: "When you set an agent's limit, it becomes a Move object on the Sui blockchain — enforced by 100+ validators on every transaction. Not a rule in our database. Not a policy in our code. The blockchain enforces it. We cannot override it.",
  },
  {
    icon: 'shield',
    family: 'tertiary',
    step: '04',
    label: 'Recovery',
    text: 'Twelve words on paper. Written once. If every device is lost, those twelve words reconstruct the same key hierarchy, the same wallet, the same agent limits. No support ticket. No waiting.',
  },
]

export const trustStats: TrustStat[] = [
  { icon: 'fingerprint', stat: '2B+ devices', sub: 'Apple Secure Enclave — the chip your keys live on' },
  { icon: 'chain', stat: '100+ validators', sub: 'Independent Sui nodes enforcing every spending cap' },
  { icon: 'lock', stat: 'Zero keys on servers', sub: 'A breach of our systems yields nothing usable' },
]

export const comparisonRows: ComparisonRow[] = [
  { old: 'Someone with this password did this', next: 'This human was physically here' },
  { old: 'Repudiable — "my password was stolen"', next: 'Non-repudiable — your fingerprint fired' },
  { old: 'Identity is a string', next: 'Identity is physics' },
  { old: 'Trust-me audit trail', next: 'Cryptographic proof of presence' },
  { old: 'Compliance bolted on afterwards', next: 'KYC at the cryptographic root' },
  { old: '"Who authorised this?" is a question', next: '"Who authorised this?" is a fact' },
]

export const authorityCards: AuthorityCard[] = [
  {
    head: 'Regulator asks',
    q: 'Who authorised this payment?',
    a: 'A cryptographic chain, not a policy document. A biometrically-signed transaction record.',
    family: 'primary',
  },
  {
    head: 'Auditor asks',
    q: 'Who hired this agent?',
    a: 'A biometrically-signed record. "Who changed these limits?" — same answer. The trail says who was there.',
    family: 'secondary',
  },
  {
    head: 'Something goes wrong',
    q: 'Who is accountable?',
    a: 'The chain points to a human who was physically present when they set the limits. Provably.',
    family: 'tertiary',
  },
]

export const zoneCards: ZoneCard[] = [
  {
    label: 'Autonomous zone',
    family: 'tertiary',
    bullet: 'Agent acts. No human needed.',
    items: ['Within daily cap', 'Known recipient', 'Permitted action type', 'Cap active and unexpired'],
  },
  {
    label: 'Approval zone',
    family: 'primary',
    bullet: 'Agent requests. You Touch ID.',
    items: ['New recipient', 'Exceeds daily cap', 'Spawn sub-agent', 'Change cap structure'],
  },
  {
    label: 'Hard stop',
    family: 'secondary',
    bullet: 'Move contract blocks. Immovable.',
    items: ['Cap is paused', 'Total cap exceeded', 'Parent expired', 'Forbidden action type'],
  },
]

export const hardQuestions: HardQuestion[] = [
  {
    q: 'Can biometrics be faked?',
    a: "Lab-scale attacks on biometric sensors require physical access to the enrolled device and significant resources. They are not practical attacks against business deployments. The relevant comparison is not 'biometrics vs. perfect' — it is 'biometrics vs. passwords.' A stolen password gives full access instantly. A stolen device still requires the enrolled fingerprint.",
  },
  {
    q: "Does this mean I'm legally liable for what my agents do?",
    a: 'You are accountable for the limits you set. If an agent acts within the spending cap, the approved recipient list, and the permissions you biometrically authorised — that is an action you authorised. The same relationship you have with an employee acting within their delegated authority. The difference: the authorisation chain is now cryptographically provable, not disputed.',
  },
  {
    q: 'What if the AI model produces bad output?',
    a: "The model proposes. The blockchain decides. A model can suggest a payment to a bad actor — but if that address isn't on the recipient list you signed, the Move contract rejects it at consensus. The model operates inside a cryptographic box whose walls were drawn by your biometric. It cannot break the box.",
  },
  {
    q: 'Can ONE be compelled to hand over our keys?',
    a: "We don't have your keys. Your private key is inside your device's security chip. Our servers hold a hash of your access token — equivalent to a scrambled password. A court order to us yields nothing usable. The keys are in your hardware, subject to your jurisdiction.",
  },
  {
    q: 'What happens when an employee leaves?',
    a: 'Remove their group membership. Role gone. API access expires. Any agents they spawned can be revoked — remaining cap flows back to the parent. The chain of authority is live, not historical. Removing the node removes the capability.',
  },
  {
    q: 'How does this work across jurisdictions?',
    a: 'Each organisation runs its own biometric root. Federation between organisations requires an explicit biometric handshake from both sides. A signal from a foreign substrate is treated as limited guest access, not owner-level authority. The trust boundary is explicit, cryptographic, and revocable.',
  },
]
