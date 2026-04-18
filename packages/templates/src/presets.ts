export interface Preset {
  name: string;
  role: string;
  description: string;
  skills: string[];
  tags: string[];
  defaultPrice?: number;
}

const PRICE = 0.02;

export const PRESETS: Record<string, Preset> = {
  ceo: { name: "ceo", role: "executive", description: "Infrastructure routing + org-level coordination", skills: ["coordinate", "prioritize"], tags: ["c-suite", "exec"], defaultPrice: PRICE },
  cto: { name: "cto", role: "executive", description: "Shared reasoning layer, tech direction", skills: ["design", "review"], tags: ["c-suite", "tech"], defaultPrice: PRICE },
  cfo: { name: "cfo", role: "executive", description: "Treasury + cashflow monitoring", skills: ["forecast", "audit"], tags: ["c-suite", "finance"], defaultPrice: PRICE },
  coo: { name: "coo", role: "executive", description: "Operations monitoring + runbook execution", skills: ["operate", "monitor"], tags: ["c-suite", "ops"], defaultPrice: PRICE },
  cro: { name: "cro", role: "executive", description: "Agent recruitment + partnerships", skills: ["recruit", "partner"], tags: ["c-suite", "growth"], defaultPrice: PRICE },
  writer: { name: "writer", role: "content", description: "Long-form content + drafts", skills: ["write", "edit"], tags: ["content", "writing"], defaultPrice: PRICE },
  social: { name: "social", role: "content", description: "Social posting + engagement", skills: ["post", "engage"], tags: ["content", "social"], defaultPrice: PRICE },
  community: { name: "community", role: "ops", description: "Community moderation + onboarding", skills: ["moderate", "onboard"], tags: ["community"], defaultPrice: PRICE },
  analytics: { name: "analytics", role: "analyst", description: "Engagement + performance reporting", skills: ["measure", "report"], tags: ["analytics"], defaultPrice: PRICE },
  outreach: { name: "outreach", role: "growth", description: "Partnership prospecting", skills: ["prospect", "pitch"], tags: ["growth", "outreach"], defaultPrice: PRICE },
  ads: { name: "ads", role: "growth", description: "Ad management + creative testing", skills: ["launch-campaign", "ab-test"], tags: ["growth", "ads"], defaultPrice: PRICE },
  strategy: { name: "strategy", role: "planner", description: "Campaign + roadmap coordination", skills: ["plan", "prioritize"], tags: ["strategy"], defaultPrice: PRICE },
  "payment-processor": { name: "payment-processor", role: "service", description: "Multi-token payment routing", skills: ["route-payment"], tags: ["commerce"], defaultPrice: PRICE },
  "booking-agent": { name: "booking-agent", role: "service", description: "Service booking + calendar coordination", skills: ["book", "remind"], tags: ["service"], defaultPrice: PRICE },
  "subscription-manager": { name: "subscription-manager", role: "service", description: "Recurring billing + tier management", skills: ["bill", "upgrade"], tags: ["commerce"], defaultPrice: PRICE },
  "escrow-service": { name: "escrow-service", role: "service", description: "Escrow + dispute resolution", skills: ["hold", "resolve"], tags: ["service"], defaultPrice: PRICE },
  // edu cluster
  tutor: { name: "tutor", role: "educator", description: "Personalised tutoring + adaptive learning paths", skills: ["teach", "assess"], tags: ["edu", "tutor"], defaultPrice: PRICE },
  researcher: { name: "researcher", role: "analyst", description: "Literature review + synthesis + citation", skills: ["research", "synthesize"], tags: ["edu", "research"], defaultPrice: PRICE },
  coach: { name: "coach", role: "coach", description: "Goal tracking + accountability + habit building", skills: ["coach", "track"], tags: ["edu", "coaching"], defaultPrice: PRICE },
  // edge cluster
  "telegram-bot": { name: "telegram-bot", role: "channel", description: "Telegram webhook handler + reply agent", skills: ["receive", "reply"], tags: ["edge", "telegram"], defaultPrice: PRICE },
  "discord-bot": { name: "discord-bot", role: "channel", description: "Discord slash commands + event handler", skills: ["command", "respond"], tags: ["edge", "discord"], defaultPrice: PRICE },
  notifier: { name: "notifier", role: "channel", description: "Multi-channel alert delivery + escalation routing", skills: ["notify", "escalate"], tags: ["edge", "alerts"], defaultPrice: PRICE },
  // creative cluster
  "creative-director": { name: "creative-director", role: "creative", description: "Brand direction + creative brief generation", skills: ["brief", "direct"], tags: ["creative", "brand"], defaultPrice: PRICE },
  copywriter: { name: "copywriter", role: "creative", description: "Ad copy + landing page + email sequences", skills: ["write-copy", "iterate"], tags: ["creative", "copy"], defaultPrice: PRICE },
  // support cluster
  concierge: { name: "concierge", role: "support", description: "First-contact routing + intent detection", skills: ["greet", "route"], tags: ["support", "concierge"], defaultPrice: PRICE },
  classifier: { name: "classifier", role: "support", description: "Ticket classification + priority tagging", skills: ["classify", "tag"], tags: ["support", "classification"], defaultPrice: PRICE },
  triage: { name: "triage", role: "support", description: "Severity assessment + SLA routing", skills: ["assess", "route"], tags: ["support", "triage"], defaultPrice: PRICE },
  escalation: { name: "escalation", role: "support", description: "Escalation detection + human handoff", skills: ["detect", "escalate"], tags: ["support", "escalation"], defaultPrice: PRICE },
  // tech cluster
  "data-analyst": { name: "data-analyst", role: "analyst", description: "Data querying + insight generation + visualisation spec", skills: ["query", "analyze"], tags: ["tech", "data"], defaultPrice: PRICE },
  "qa-engineer": { name: "qa-engineer", role: "tech", description: "Test generation + regression analysis + coverage reporting", skills: ["test", "report"], tags: ["tech", "qa"], defaultPrice: PRICE },
};

export function getPreset(name: string): Preset | undefined {
  return PRESETS[name];
}

export function listPresets(): Preset[] {
  return Object.values(PRESETS);
}
