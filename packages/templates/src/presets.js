const PRICE = 0.02;
export const PRESETS = {
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
};
export function getPreset(name) {
    return PRESETS[name];
}
export function listPresets() {
    return Object.values(PRESETS);
}
//# sourceMappingURL=presets.js.map