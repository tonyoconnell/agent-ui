---
title: Crypto Analysis Strategy
dimension: knowledge
category: crypto-analysis-strategy.md
tags: agent, ai, ontology, protocol
related_dimensions: connections, events, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the crypto-analysis-strategy.md category.
  Location: one/knowledge/crypto-analysis-strategy.md
  Purpose: Documents crypto analysis strategy
  Related dimensions: connections, events, people, things
  For AI agents: Read this to understand crypto analysis strategy.
---

# Crypto Analysis Strategy

A comprehensive strategic framework for analyzing cryptocurrencies and DeFi protocols using the ONE Platform's 6-dimension ontology. This document provides proven methodologies for token evaluation, risk assessment, and investment decision-making.

## Version

- **Strategy Version**: 1.1.0
- **Based On**: Crypto Ontology v1.1.0 (AI Token Specialization)
- **Last Updated**: 2025-11-03

## Overview

Cryptocurrency analysis requires a multi-dimensional approach that combines on-chain data, smart contract auditing, market dynamics, and behavioral patterns. This strategy maps analysis workflows to our 6-dimension ontology, ensuring comprehensive coverage of all risk factors.

**AI Token Specialization**: This version includes enhanced frameworks specifically for analyzing AI-related tokens, covering compute networks, agent economies, model marketplaces, and data exchanges. AI tokens require unique evaluation criteria focused on utility, performance metrics, and real-world AI capability verification.

## Core Analysis Philosophy

```
Data Collection → Pattern Recognition → Risk Scoring → Signal Generation → Decision Making
        ↓                  ↓                 ↓               ↓                ↓
    Knowledge          Connections        Things          Events          People
```

**Key Principles:**

1. **Data-Driven**: All decisions backed by verifiable on-chain data
2. **Multi-Dimensional**: Analyze across all 6 dimensions simultaneously
3. **Risk-First**: Identify red flags before evaluating opportunities
4. **Context-Aware**: Consider market conditions, protocol relationships, and timing
5. **Continuous Learning**: Update models based on outcomes and new patterns

## AI Token Analysis Framework

AI tokens require specialized evaluation beyond standard crypto analysis. The key difference: **AI tokens must deliver verifiable utility**—actual AI compute, real agent transactions, measurable model performance—not just speculation.

### AI Token Evaluation Pillars

```
Traditional Token Value = Market Cap + Liquidity + Team + Tokenomics

AI Token Value = Traditional Factors + AI Utility + Performance Metrics + Competitive Positioning
                                          ↓                  ↓                    ↓
                               Real Usage Stats    Benchmark Results    vs Centralized AI
```

### Critical AI-Specific Questions

**1. Is the AI capability real and verifiable?**
   - Can you independently verify compute is happening?
   - Are benchmark results reproducible?
   - Is there proof of AI work (zkML, TEE, sampling)?

**2. Is there actual utility-driven demand?**
   - Are real users paying for AI services?
   - What's the ratio of agent-to-agent vs speculative transactions?
   - Is usage growing independent of token price?

**3. How does it compare to centralized alternatives?**
   - Cost per cycle vs OpenAI/Anthropic/Google?
   - Latency and throughput vs centralized providers?
   - What's the decentralization trade-off value?

**4. Is the token essential to the AI function?**
   - Can the AI work without the token?
   - Is the token just a payment rail or core to the protocol?
   - Would users prefer to pay in stablecoins?

**5. What are the AI-specific risks?**
   - Model quality degradation over time?
   - Compute network reliability?
   - Data quality and bias issues?
   - Regulatory risks (AI safety, content moderation)?

### AI Token Categories & Analysis Approach

#### 1. Compute Tokens (e.g., Akash, Render, io.net)

**Primary Metrics:**
- Network utilization rate (%)
- Cost per compute unit vs AWS/GCP
- Node uptime and reliability
- GPU diversity and redundancy

**Evaluation Framework:**
```typescript
function evaluateComputeToken(token: AIComputeToken): AITokenScore {
  return {
    utilityScore: calculateUtilityScore({
      utilizationRate: token.aiSpecific.usage.utilization,
      totalComputeHours: token.aiSpecific.usage.totalComputeHours,
      uniqueUsers: token.aiSpecific.usage.uniqueUsers,
      growth: calculateGrowth(token, 30) // 30-day growth
    }),

    performanceScore: calculatePerformanceScore({
      avgCycleTime: token.aiSpecific.performance.avgCycleTime,
      throughput: token.aiSpecific.performance.throughput,
      costVsCentralized: token.aiSpecific.performance.costVsCentralized,
      reliability: verifyComputeProof(token) ? 100 : 50
    }),

    competitiveScore: calculateCompetitivePosition({
      priceAdvantage: 100 - token.aiSpecific.performance.costVsCentralized,
      decentralizationValue: assessDecentralization(token),
      networkEffects: token.aiSpecific.usage.uniqueUsers / 1000
    }),

    riskScore: assessComputeRisks(token),

    // Final score weighted average
    finalScore: (utilityScore * 0.4 + performanceScore * 0.3 +
                 competitiveScore * 0.2 + (100 - riskScore) * 0.1)
  };
}
```

**Red Flags:**
- Utilization < 20% (network underused)
- Cost > 2x centralized alternatives (not competitive)
- No verifiable proof of compute
- Single node dominance (centralization)
- Fake AI claims (marketing fluff)

#### 2. Agent Economy Tokens (e.g., Fetch.ai, SingularityNET)

**Primary Metrics:**
- Agent-to-agent transaction ratio
- Task success rate
- Active agent count
- Human satisfaction scores

**Evaluation Framework:**
```typescript
function evaluateAgentToken(token: AIAgentToken): AITokenScore {
  const a2aRatio = token.aiSpecific.agentEconomy.agentToAgentRatio;

  return {
    utilityScore: calculateAgentUtility({
      activeAgents: token.aiSpecific.agentEconomy.activeAgents,
      a2aTransactions: token.aiSpecific.agentEconomy.totalTransactions * (a2aRatio / 100),
      taskSuccessRate: token.aiSpecific.performance.taskSuccessRate,
      autonomyLevel: token.aiSpecific.capabilities.autonomyLevel === "full" ? 100 : 50
    }),

    economicViability: assessAgentEconomy({
      avgTransactionValue: token.aiSpecific.agentEconomy.avgTransactionValue,
      a2aRatio, // Higher is better (more autonomous)
      revenueModel: token.properties.tokenomics,
      sustainability: projectRevenueRunway(token)
    }),

    capabilityScore: assessAgentCapabilities({
      taskTypes: token.aiSpecific.capabilities.taskTypes.length,
      autonomy: token.aiSpecific.capabilities.autonomyLevel,
      interoperability: token.aiSpecific.capabilities.interoperability.length,
      safetyMeasures: token.aiSpecific.safety
    }),

    riskScore: assessAgentRisks(token),

    finalScore: (utilityScore * 0.35 + economicViability * 0.35 +
                 capabilityScore * 0.2 + (100 - riskScore) * 0.1)
  };
}
```

**Red Flags:**
- A2A ratio < 30% (mostly human-driven, not autonomous)
- Task success rate < 60% (poor AI quality)
- No kill switch or safety measures
- Agents can't operate profitably (negative economics)
- Purely speculative "agent" label without real agents

#### 3. Model Access Tokens (e.g., Bittensor)

**Primary Metrics:**
- Model benchmark scores
- Cycle requests per day
- Fine-tuning activity
- Model diversity

**Evaluation Framework:**
```typescript
function evaluateModelToken(token: AIModelNFT): AITokenScore {
  return {
    qualityScore: assessModelQuality({
      benchmarkScores: token.modelDetails.performance.benchmarkScores,
      accuracy: token.modelDetails.performance.accuracy,
      reproducibility: token.modelDetails.provenance.reproducible,
      verifiedResults: verifyBenchmarks(token)
    }),

    usageScore: calculateModelUsage({
      totalCycles: token.usage.totalCycles,
      uniqueUsers: token.usage.uniqueUsers,
      revenueGenerated: parseFloat(token.usage.revenueGenerated),
      finetuneRequests: token.usage.finetuneRequests
    }),

    competitiveScore: compareToState OfArt({
      benchmarks: token.modelDetails.performance.benchmarkScores,
      cost: calculateCostPerCycle(token),
      latency: token.modelDetails.performance.latency,
      openSourceAlternatives: findComparableModels(token)
    }),

    riskScore: assessModelRisks(token),

    finalScore: (qualityScore * 0.4 + usageScore * 0.3 +
                 competitiveScore * 0.2 + (100 - riskScore) * 0.1)
  };
}
```

**Red Flags:**
- Benchmark scores unverified or fabricated
- No actual usage (zero cycles)
- Performance worse than open-source alternatives
- Model trained on unlicensed data
- No fine-tuning capability (limited utility)

#### 4. Data Marketplace Tokens (e.g., Ocean Protocol)

**Primary Metrics:**
- Dataset quality scores
- Training runs using data
- Data diversity and coverage
- Privacy compliance

**Evaluation Framework:**
```typescript
function evaluateDataToken(token: AIDataToken): AITokenScore {
  return {
    qualityScore: assessDataQuality({
      dataQuality: token.dataDetails.dataQuality,
      biasScore: token.quality.biasScore,
      diversityScore: token.quality.diversityScore,
      cleanlinessScore: token.quality.cleanlinessScore,
      verificationStatus: token.quality.verificationStatus
    }),

    usageScore: calculateDataUsage({
      trainingRuns: token.usage.trainingRuns,
      activeSubscribers: token.usage.activeSubscribers,
      revenueSharing: token.usage.revenueSharing,
      demandTrend: calculateDemandTrend(token, 60) // 60-day trend
    }),

    complianceScore: assessDataCompliance({
      privacyCompliant: token.provenance.privacyCompliant,
      consentObtained: token.provenance.consentObtained,
      commercialUse: token.licensing.commercialUse,
      jurisdiction: assessJurisdiction(token)
    }),

    riskScore: assessDataRisks(token),

    finalScore: (qualityScore * 0.35 + usageScore * 0.35 +
                 complianceScore * 0.2 + (100 - riskScore) * 0.1)
  };
}
```

**Red Flags:**
- Data quality unverified or poor
- No privacy compliance (GDPR, CCPA violations)
- Biased or unrepresentative datasets
- Zero training runs (no actual demand)
- Unclear data provenance or ownership
- Synthetic data sold as real

### AI Token Risk Scoring Enhancements

Standard crypto risk + AI-specific risks:

```typescript
function calculateAITokenRisk(token: AIToken): AIRiskProfile {
  const standardRisk = calculateStandardCryptoRisk(token);

  const aiSpecificRisk = {
    // Technical AI Risks (0-100)
    technicalAI: {
      computeReliability: assessNetworkReliability(token),
      modelDegradation: assessModelQualityTrend(token),
      dataQuality: assessDataQualityRisk(token),
      verifiability: hasVerifiableProofs(token) ? 0 : 50,
      dependencyRisk: assessAIDependencies(token)
    },

    // Market AI Risks (0-100)
    marketAI: {
      centralizedCompetition: assessCentralizedThreat(token),
      utilityDemand: assessRealUtilityDemand(token),
      tokenNecessity: isTokenEssential(token) ? 0 : 40,
      agentAdoption: assessAgentEconomyHealth(token),
      priceToUtilityRatio: calculatePUDRatio(token)
    },

    // Regulatory AI Risks (0-100)
    regulatoryAI: {
      aiSafetyCompliance: assessAISafetyRisk(token),
      contentModeration: hasContentModeration(token) ? 0 : 30,
      dataPrivacy: assessPrivacyCompliance(token),
      jurisdictionalRisk: assessAIRegulationRisk(token),
      ethicsPolicy: hasEthicsPolicy(token) ? 0 : 20
    }
  };

  return {
    ...standardRisk,
    aiSpecific: aiSpecificRisk,
    aggregateRisk: calculateAggregateAIRisk(standardRisk, aiSpecificRisk)
  };
}
```

### Key AI Token Metrics Dashboard

Essential metrics to track for any AI token:

```
Utility Metrics:
├─ Daily Active Users (humans)
├─ Daily Active Agents (autonomous)
├─ Agent-to-Agent Transaction %
├─ Network Utilization Rate
├─ Cost vs Centralized Baseline
└─ Revenue from Real Usage

Performance Metrics:
├─ Cycle Latency (p50, p95, p99)
├─ Throughput (requests/sec)
├─ Model Accuracy (benchmarks)
├─ Node Uptime %
├─ Compute Verification Rate
└─ Task Success Rate

Growth Metrics:
├─ New Users (7d, 30d)
├─ Cycle Volume Growth
├─ Agent Count Growth
├─ Revenue Growth (actual utility)
├─ Node/Provider Growth
└─ Dataset Contributions

Quality Metrics:
├─ Benchmark Scores vs SOTA
├─ Data Quality Scores
├─ Model Reproducibility
├─ Audit Results
└─ User Satisfaction Scores
```

## Analysis Framework Matrix

### 1. Token Lifecycle Analysis

Different analysis strategies based on token maturity:

#### Pre-Launch Analysis (Seed/Private Stage)
```
Focus Areas:
├─ Team & Founders (People)
│  ├─ Previous track record
│  ├─ Wallet history analysis
│  ├─ Reputation scoring
│  └─ Team vesting schedules
│
├─ Tokenomics Design (Things)
│  ├─ Distribution fairness
│  ├─ Vesting cliffs
│  ├─ Inflation mechanics
│  └─ Utility design
│
├─ Smart Contract Review (Things)
│  ├─ Code audit status
│  ├─ Vulnerability scanning
│  ├─ Upgrade mechanisms
│  └─ Admin controls
│
└─ Risk Assessment (Knowledge)
   ├─ Rug pull indicators
   ├─ Centralization risks
   └─ Regulatory exposure

Risk Threshold: HIGH (80-100)
Recommendation: "avoid" unless exceptional fundamentals
```

#### Launch Phase (0-30 days)
```
Focus Areas:
├─ Initial Distribution (Events)
│  ├─ Fairness of launch
│  ├─ Bot activity detection
│  ├─ Whale accumulation
│  └─ Liquidity provision
│
├─ Market Formation (Things)
│  ├─ Price discovery
│  ├─ Volume patterns
│  ├─ Liquidity depth
│  └─ Exchange listings
│
├─ Community Response (Knowledge)
│  ├─ Social sentiment
│  ├─ Holder growth rate
│  └─ Transaction velocity
│
└─ Smart Contract Behavior (Events)
   ├─ Unexpected mints
   ├─ Admin actions
   └─ Contract interactions

Risk Threshold: MEDIUM-HIGH (60-80)
Recommendation: "hold" or "small position" with tight stops
```

#### Growth Phase (1-6 months)
```
Focus Areas:
├─ Adoption Metrics (Knowledge)
│  ├─ Active users
│  ├─ Transaction volume
│  ├─ Protocol revenue
│  └─ TVL growth
│
├─ Protocol Development (Events)
│  ├─ Feature releases
│  ├─ Partnership announcements
│  ├─ Governance activity
│  └─ Developer commits
│
├─ Market Position (Things)
│  ├─ Competitive analysis
│  ├─ Market share
│  ├─ Liquidity health
│  └─ Price stability
│
└─ Holder Behavior (Connections)
   ├─ Diamond hands %
   ├─ Whale distribution
   └─ Staking participation

Risk Threshold: MEDIUM (40-60)
Recommendation: "buy" if fundamentals strong, momentum positive
```

#### Maturity Phase (6+ months)
```
Focus Areas:
├─ Business Model Viability (Knowledge)
│  ├─ Revenue sustainability
│  ├─ Product-market fit
│  ├─ Network effects
│  └─ Competitive moat
│
├─ Governance Quality (Events)
│  ├─ Proposal quality
│  ├─ Voter participation
│  ├─ Execution track record
│  └─ Community alignment
│
├─ Protocol Health (Things)
│  ├─ TVL stability
│  ├─ User retention
│  ├─ Fee generation
│  └─ Treasury management
│
└─ Market Efficiency (Knowledge)
   ├─ Price/value alignment
   ├─ Arbitrage opportunities
   └─ Market depth

Risk Threshold: LOW-MEDIUM (20-40)
Recommendation: "strong_buy" for high-quality projects
```

## 2. Multi-Dimensional Risk Scoring

### Technical Risk Assessment (0-100 scale)

#### Smart Contract Risk
```typescript
calculateContractRisk(contract: SmartContract): number {
  let risk = 0;

  // Audit status (0-30 points)
  if (!contract.properties.security.audited) risk += 30;
  else if (contract.properties.security.auditors.length < 2) risk += 15;

  // Vulnerabilities (0-40 points)
  const critical = contract.properties.security.vulnerabilities
    .filter(v => v.severity === "critical" && v.status === "open");
  risk += critical.length * 20; // 20 points per critical vuln

  const high = contract.properties.security.vulnerabilities
    .filter(v => v.severity === "high" && v.status === "open");
  risk += high.length * 10;

  // Upgrade controls (0-20 points)
  if (contract.properties.upgradability.type !== "immutable") {
    risk += 10;
    if (!contract.properties.upgradability.timelock) risk += 10;
  }

  // Code verification (0-10 points)
  if (!contract.properties.code.verified) risk += 10;

  return Math.min(100, risk);
}
```

#### Liquidity Risk
```typescript
calculateLiquidityRisk(token: Token, pools: LiquidityPool[]): number {
  let risk = 0;

  const totalLiquidity = pools.reduce((sum, p) =>
    sum + parseFloat(p.properties.metrics.tvl), 0
  );

  // Absolute liquidity (0-30 points)
  if (totalLiquidity < 10_000) risk += 30;
  else if (totalLiquidity < 100_000) risk += 20;
  else if (totalLiquidity < 1_000_000) risk += 10;

  // Market cap to liquidity ratio (0-20 points)
  const mcToLiqRatio = token.properties.market.marketCap / totalLiquidity;
  if (mcToLiqRatio > 100) risk += 20;
  else if (mcToLiqRatio > 50) risk += 15;
  else if (mcToLiqRatio > 20) risk += 10;

  // Pool concentration (0-20 points)
  const primaryPoolLiq = Math.max(...pools.map(p =>
    parseFloat(p.properties.metrics.tvl)
  ));
  const concentration = primaryPoolLiq / totalLiquidity;
  if (concentration > 0.9) risk += 20;
  else if (concentration > 0.7) risk += 10;

  // Volume to liquidity (0-30 points)
  const volumeRatio = token.properties.market.volume24h / totalLiquidity;
  if (volumeRatio < 0.1) risk += 30; // Low volume = high risk
  else if (volumeRatio < 0.5) risk += 15;

  return Math.min(100, risk);
}
```

### Market Risk Assessment

#### Volatility Risk
```typescript
calculateVolatilityRisk(token: Token, priceHistory: number[]): number {
  // Calculate standard deviation
  const mean = priceHistory.reduce((a, b) => a + b) / priceHistory.length;
  const variance = priceHistory.reduce((sum, price) =>
    sum + Math.pow(price - mean, 2), 0
  ) / priceHistory.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV)
  const cv = stdDev / mean;

  // Risk scoring based on CV
  if (cv > 1.0) return 90; // Extreme volatility
  if (cv > 0.5) return 70;
  if (cv > 0.3) return 50;
  if (cv > 0.1) return 30;
  return 10; // Stable
}
```

#### Concentration Risk
```typescript
calculateConcentrationRisk(holders: TokenHolder[]): number {
  let risk = 0;

  const totalSupply = holders.reduce((sum, h) =>
    sum + parseFloat(h.properties.holdings[0].balance), 0
  );

  // Top 10 holders concentration
  const top10 = holders
    .sort((a, b) => parseFloat(b.properties.holdings[0].balance) -
                    parseFloat(a.properties.holdings[0].balance))
    .slice(0, 10);

  const top10Supply = top10.reduce((sum, h) =>
    sum + parseFloat(h.properties.holdings[0].balance), 0
  );

  const top10Percent = (top10Supply / totalSupply) * 100;

  if (top10Percent > 90) risk += 40; // Extreme concentration
  else if (top10Percent > 70) risk += 30;
  else if (top10Percent > 50) risk += 20;
  else if (top10Percent > 30) risk += 10;

  // Single whale risk (any holder > 10%)
  const whales = holders.filter(h =>
    (parseFloat(h.properties.holdings[0].balance) / totalSupply) > 0.1
  );
  risk += whales.length * 15;

  return Math.min(100, risk);
}
```

### Fundamental Risk Assessment

#### Team Risk
```typescript
calculateTeamRisk(founders: Founder[]): number {
  let risk = 0;

  for (const founder of founders) {
    const rep = founder.properties.reputation;

    // Rug pull history (instant disqualification)
    if (rep.rugPulls > 0) return 100;

    // Track record
    if (rep.successfulProjects === 0) risk += 20;
    else if (rep.successfulProjects < 2) risk += 10;

    // Community trust
    if (rep.communityTrust < 30) risk += 20;
    else if (rep.communityTrust < 50) risk += 10;

    // Anonymity (if no social profiles)
    const hasProfiles = founder.properties.socialProfiles.twitter ||
                       founder.properties.socialProfiles.linkedin;
    if (!hasProfiles) risk += 15;

    // Vesting schedule
    const hasVesting = founder.properties.tokensVesting.length > 0;
    if (!hasVesting) risk += 20; // No skin in the game
    else {
      // Check if vesting is too short
      const avgVestingMonths = founder.properties.tokensVesting
        .reduce((sum, v) => sum + (v.vestingEnd - Date.now()) / (1000 * 60 * 60 * 24 * 30), 0)
        / founder.properties.tokensVesting.length;

      if (avgVestingMonths < 12) risk += 15; // Short vesting
      else if (avgVestingMonths < 24) risk += 5;
    }
  }

  return Math.min(100, risk / founders.length);
}
```

#### Tokenomics Risk
```typescript
calculateTokenomicsRisk(token: Token): number {
  let risk = 0;

  const tokenomics = token.properties.tokenomics;
  const distribution = token.properties.distribution;

  // Inflation risk
  if (tokenomics.mintable && !tokenomics.maxSupply) risk += 30;
  else if (tokenomics.inflationRate && tokenomics.inflationRate > 20) risk += 20;
  else if (tokenomics.inflationRate && tokenomics.inflationRate > 10) risk += 10;

  // Team allocation
  if (distribution.team > 30) risk += 20;
  else if (distribution.team > 20) risk += 10;

  // Investor allocation
  if (distribution.investors > 40) risk += 15;
  else if (distribution.investors > 30) risk += 10;

  // Public allocation (too low is risky)
  const publicAllocation = distribution.publicSale + distribution.liquidity;
  if (publicAllocation < 20) risk += 20;
  else if (publicAllocation < 40) risk += 10;

  // Admin controls
  if (tokenomics.pausable) risk += 10;
  if (tokenomics.upgradeable) risk += 15;

  return Math.min(100, risk);
}
```

## 3. Signal Generation Strategy

### Trading Signal Types

#### Accumulation Signal
```typescript
interface AccumulationSignal {
  trigger: "whale_buying" | "smart_money_entry" | "dvp_pattern" | "breakout";

  indicators: {
    // On-chain indicators
    whaleTransfers: {count: number, volumeUSD: number};
    holderGrowth: number; // percentage
    exchangeOutflow: number; // tokens leaving exchanges

    // Market indicators
    priceStability: number; // low volatility during accumulation
    volumeIncrease: number; // increasing volume
    supportLevel: number; // price holding above support

    // Sentiment indicators
    socialBuzz: number; // increasing mentions
    developerActivity: number; // commits, releases
  };

  confidence: number; // 0-1
  timeframe: "short" | "medium" | "long"; // days to expected move

  entry: {
    price: number;
    zones: number[]; // multiple entry points
  };

  targets: number[]; // progressive profit targets
  stopLoss: number;
  positionSize: number; // percentage of portfolio
}

function detectAccumulation(
  token: Token,
  events: Event[],
  knowledge: Knowledge
): AccumulationSignal | null {
  // Whale buying pattern
  const whaleTransfers = events.filter(e =>
    e.type === "transfer" &&
    e.properties.transfer?.isWhale &&
    e.properties.transfer.to !== "exchange"
  );

  if (whaleTransfers.length < 5) return null; // Need multiple transfers

  // Calculate indicators
  const holderGrowth = calculateHolderGrowth(events, 7); // 7 day growth
  const exchangeOutflow = calculateExchangeNetFlow(events);
  const priceVolatility = token.properties.market.volatility;

  // Accumulation criteria
  const isAccumulating =
    whaleTransfers.length >= 5 &&
    holderGrowth > 5 && // 5% holder increase
    exchangeOutflow > 0 && // Net outflow from exchanges
    priceVolatility < 30; // Relatively stable

  if (!isAccumulating) return null;

  // Generate signal
  const currentPrice = token.properties.market.price;
  const confidence = calculateConfidence([
    whaleTransfers.length / 10, // normalize
    holderGrowth / 10,
    exchangeOutflow / 1000000,
  ]);

  return {
    trigger: "whale_buying",
    indicators: {
      whaleTransfers: {
        count: whaleTransfers.length,
        volumeUSD: calculateVolume(whaleTransfers)
      },
      holderGrowth,
      exchangeOutflow,
      priceStability: 100 - priceVolatility,
      volumeIncrease: calculateVolumeIncrease(events),
      supportLevel: findSupportLevel(token),
      socialBuzz: knowledge.sentiment?.socialScore || 0,
      developerActivity: knowledge.development?.activity || 0,
    },
    confidence,
    timeframe: "medium",
    entry: {
      price: currentPrice,
      zones: [currentPrice * 0.95, currentPrice * 0.90, currentPrice * 0.85]
    },
    targets: [
      currentPrice * 1.2,
      currentPrice * 1.5,
      currentPrice * 2.0
    ],
    stopLoss: currentPrice * 0.85,
    positionSize: confidence * 10 // Max 10% position
  };
}
```

#### Distribution Signal (Sell Warning)
```typescript
function detectDistribution(
  token: Token,
  events: Event[],
  holders: TokenHolder[]
): boolean {
  // Whale selling
  const whaleSells = events.filter(e =>
    e.type === "transfer" &&
    e.properties.transfer?.isWhale &&
    e.properties.transfer.to === "exchange" // Moving to exchange = likely selling
  );

  // Insider selling (team/advisors)
  const insiderSells = events.filter(e =>
    e.type === "transfer" &&
    isInsiderAddress(e.properties.transfer?.from)
  );

  // Volume spike without price increase (distribution)
  const volumeIncrease = token.properties.market.volume24h /
                         getAverageVolume(token, 7);
  const priceChange = calculatePriceChange(token, 1);

  // Red flags
  const redFlags = {
    whaleSelling: whaleSells.length > 3,
    insiderDumping: insiderSells.length > 0,
    highVolumeNoPump: volumeIncrease > 3 && priceChange < 5,
    decreasingHolders: calculateHolderGrowth(events, 7) < -2,
    increasingExchangeSupply: calculateExchangeNetFlow(events) < 0
  };

  // Distribution if multiple red flags
  const flagCount = Object.values(redFlags).filter(Boolean).length;
  return flagCount >= 3;
}
```

#### Rug Pull Detection
```typescript
function detectRugPullRisk(
  token: Token,
  contract: SmartContract,
  team: Founder[]
): {risk: "low" | "medium" | "high" | "critical", flags: string[]} {
  const flags: string[] = [];
  let riskScore = 0;

  // Contract red flags
  if (!contract.properties.code.verified) {
    flags.push("Unverified contract");
    riskScore += 30;
  }

  if (contract.properties.security.vulnerabilities.some(v =>
    v.type === "hidden_mint" && v.severity === "critical"
  )) {
    flags.push("Hidden mint function detected");
    riskScore += 40;
  }

  if (token.properties.tokenomics.pausable) {
    flags.push("Contract can be paused");
    riskScore += 15;
  }

  // Liquidity red flags
  const liquidityLocked = checkLiquidityLock(token);
  if (!liquidityLocked) {
    flags.push("Liquidity not locked");
    riskScore += 30;
  }

  // Team red flags
  const anonymousTeam = team.every(f =>
    !f.properties.socialProfiles.twitter &&
    !f.properties.socialProfiles.linkedin
  );
  if (anonymousTeam) {
    flags.push("Fully anonymous team");
    riskScore += 25;
  }

  const hasRugHistory = team.some(f => f.properties.reputation.rugPulls > 0);
  if (hasRugHistory) {
    flags.push("Team member with rug pull history");
    riskScore += 100; // Instant critical
  }

  // Tokenomics red flags
  if (token.properties.risk.taxOnTransfer > 10) {
    flags.push(`High transfer tax: ${token.properties.risk.taxOnTransfer}%`);
    riskScore += 20;
  }

  // Determine risk level
  let risk: "low" | "medium" | "high" | "critical";
  if (riskScore >= 80) risk = "critical";
  else if (riskScore >= 60) risk = "high";
  else if (riskScore >= 40) risk = "medium";
  else risk = "low";

  return {risk, flags};
}
```

## 4. Decision Framework

### Investment Decision Matrix

```
Risk Score | Fundamentals | Market Conditions | Decision
-----------|--------------|-------------------|----------
0-20       | Strong       | Bull              | Strong Buy (20-30%)
0-20       | Strong       | Bear/Neutral      | Buy (10-15%)
0-20       | Weak         | Any               | Hold / Small (5%)

20-40      | Strong       | Bull              | Buy (15-20%)
20-40      | Strong       | Bear/Neutral      | Hold / Small (5-10%)
20-40      | Weak         | Any               | Avoid

40-60      | Strong       | Bull              | Small (5-10%)
40-60      | Any          | Bear/Neutral      | Avoid
40-60      | Weak         | Any               | Avoid

60-80      | Exceptional  | Bull              | Micro (1-2%)
60-80      | Any          | Any               | Avoid

80-100     | Any          | Any               | Avoid / Short
```

### Position Sizing Strategy

```typescript
function calculatePositionSize(
  riskScore: number,
  confidence: number,
  marketCondition: "bull" | "neutral" | "bear",
  portfolioValue: number
): number {
  // Base allocation by risk
  let baseAllocation = 0;
  if (riskScore < 20) baseAllocation = 0.20; // 20%
  else if (riskScore < 40) baseAllocation = 0.10;
  else if (riskScore < 60) baseAllocation = 0.05;
  else if (riskScore < 80) baseAllocation = 0.02;
  else return 0; // No position

  // Adjust for confidence
  const confidenceMultiplier = confidence; // 0-1
  baseAllocation *= confidenceMultiplier;

  // Adjust for market conditions
  const marketMultiplier = {
    bull: 1.0,
    neutral: 0.7,
    bear: 0.5
  }[marketCondition];
  baseAllocation *= marketMultiplier;

  // Calculate dollar amount
  return portfolioValue * baseAllocation;
}
```

## 5. Workflow Patterns

### Standard Analysis Workflow

```
1. Token Discovery
   ├─ Source: Trending tokens, new listings, community tips
   ├─ Quick screening: Price, volume, market cap
   └─ Initial red flag check (honeypot, scam indicators)

2. Preliminary Assessment (5 minutes)
   ├─ Contract verification status
   ├─ Liquidity check (> $100k minimum)
   ├─ Holder distribution (whale %)
   └─ Team identification (anon vs doxxed)

   Decision: Proceed to deep dive? Yes/No

3. Deep Dive Analysis (30-60 minutes)
   ├─ Smart Contract Audit
   │  ├─ Run static analysis
   │  ├─ Check for vulnerabilities
   │  ├─ Review upgrade controls
   │  └─ Validate token standards
   │
   ├─ Fundamental Analysis
   │  ├─ Team background research
   │  ├─ Tokenomics evaluation
   │  ├─ Use case assessment
   │  └─ Competitive landscape
   │
   ├─ On-Chain Analysis
   │  ├─ Holder behavior patterns
   │  ├─ Whale tracking
   │  ├─ Transaction velocity
   │  └─ Exchange flow analysis
   │
   ├─ Market Analysis
   │  ├─ Liquidity depth
   │  ├─ Volume analysis
   │  ├─ Price action review
   │  └─ Volatility assessment
   │
   └─ Sentiment Analysis
      ├─ Social media monitoring
      ├─ Community engagement
      ├─ Developer activity
      └─ News/announcements

4. Risk Scoring
   ├─ Calculate technical risk (0-100)
   ├─ Calculate market risk (0-100)
   ├─ Calculate fundamental risk (0-100)
   └─ Aggregate final risk score

5. Signal Generation
   ├─ Identify patterns (accumulation, distribution)
   ├─ Generate entry/exit levels
   ├─ Calculate position size
   └─ Set alerts for monitoring

6. Report Generation
   ├─ Executive summary
   ├─ Risk breakdown
   ├─ Recommendation with rationale
   └─ Monitoring plan

7. Ongoing Monitoring
   ├─ Daily: Price alerts, whale movements
   ├─ Weekly: Holder distribution changes
   └─ Monthly: Fundamental reassessment
```

### Quick Screening Workflow (< 5 min)

For rapid filtering of opportunities:

```
PASS/FAIL Checklist:
□ Contract verified on blockchain explorer
□ Liquidity > $100k
□ Top holder < 20% of supply
□ No hidden mint/pause functions
□ Team identifiable (not fully anonymous)
□ Audit by reputable firm OR community audited
□ Active development (commits in last 30 days)
□ No rug pull red flags

FAIL any → Reject immediately
PASS all → Proceed to deep analysis
```

## 6. Advanced Strategies

### DeFi Protocol Evaluation

```typescript
interface ProtocolHealthScore {
  tvlGrowth: number; // 7-day and 30-day growth
  revenueGrowth: number;
  userGrowth: number;
  tokenUtility: number; // How well is token used in protocol?
  governanceHealth: number;
  codeQuality: number;
  auditScore: number;
  competitivePosition: number;
}

function evaluateProtocol(
  protocol: Group,
  contracts: SmartContract[],
  analytics: ProtocolAnalytics
): ProtocolHealthScore {
  return {
    tvlGrowth: calculateTVLGrowth(analytics),
    revenueGrowth: calculateRevenueGrowth(analytics),
    userGrowth: calculateUserGrowth(analytics),
    tokenUtility: assessTokenUtility(protocol),
    governanceHealth: assessGovernance(protocol),
    codeQuality: averageCodeQuality(contracts),
    auditScore: calculateAuditScore(contracts),
    competitivePosition: assessCompetitivePosition(protocol)
  };
}
```

### Cross-Chain Analysis

When evaluating tokens with cross-chain presence:

```
1. Verify all chain deployments
2. Compare liquidity across chains
3. Check bridge reliability and security
4. Analyze arbitrage opportunities
5. Monitor cross-chain transfer volume
6. Assess bridge risk (exploit history)
```

### MEV and Bot Detection

```typescript
function detectBotActivity(events: Event[]): {
  isBotTraded: boolean;
  botVolume: number;
  suspiciousPatterns: string[];
} {
  const patterns: string[] = [];

  // Rapid-fire transactions
  const timeGaps = events.map((e, i) =>
    i > 0 ? e.timestamp - events[i-1].timestamp : 0
  );
  const avgGap = timeGaps.reduce((a, b) => a + b) / timeGaps.length;

  if (avgGap < 5000) { // < 5 seconds between txs
    patterns.push("High-frequency trading detected");
  }

  // Sandwich attacks
  const sandwiches = detectSandwichAttacks(events);
  if (sandwiches.length > 0) {
    patterns.push(`${sandwiches.length} sandwich attacks detected`);
  }

  // Wash trading (same addresses buying/selling)
  const washTrading = detectWashTrading(events);
  if (washTrading) {
    patterns.push("Possible wash trading");
  }

  return {
    isBotTraded: patterns.length > 0,
    botVolume: calculateBotVolume(events),
    suspiciousPatterns: patterns
  };
}
```

## 7. Integration with 6-Dimension Ontology

### Data Flow

```
Groups (Protocols, DAOs)
    ↓ organize
People (Team, Holders, Validators)
    ↓ create/own
Things (Tokens, Contracts, Pools)
    ↓ generate
Events (Swaps, Transfers, Governance)
    ↓ analyzed by
Knowledge (Risk Scores, Patterns, Signals)
    ↓ connected via
Connections (Liquidity, Dependencies, Governance)
```

### Query Strategies

```typescript
// Find undervalued protocols
const undervaluedProtocols = await ctx.db.query("things")
  .withIndex("by_type", q => q.eq("type", "defi_protocol"))
  .filter(t => {
    const analytics = getAnalytics(t);
    const risk = getRiskScore(t);
    return risk < 40 &&
           analytics.tvlGrowth > 20 &&
           analytics.revenueGrowth > 15;
  })
  .collect();

// Track smart money
const smartMoney = await ctx.db.query("people")
  .withIndex("by_type", q => q.eq("type", "whale"))
  .filter(p => {
    const behavior = getOnChainBehavior(p);
    return behavior.profile.profitability > 0.7 &&
           behavior.influence.impactScore > 60;
  })
  .collect();

// Monitor high-risk tokens
const riskyTokens = await ctx.db.query("things")
  .withIndex("by_type", q => q.eq("type", "fungible_token"))
  .filter(t => {
    const risk = getRiskProfile(t);
    return risk.dimensions.technical.contractRisk > 70 ||
           risk.dimensions.market.liquidityRisk > 80;
  })
  .collect();
```

## 8. Continuous Improvement

### Learning Loop

```
1. Track all signals generated
2. Record outcomes (profit/loss)
3. Analyze prediction accuracy
4. Identify false positives/negatives
5. Update scoring algorithms
6. Refine thresholds and weights
7. Document lessons learned
```

### Performance Metrics

```typescript
interface AnalysisPerformance {
  signalsGenerated: number;
  successRate: number; // Percentage profitable
  averageReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;

  byCategory: {
    accumulation: {count: number, successRate: number};
    distribution: {count: number, successRate: number};
    rugPullPrevention: {count: number, falsePositives: number};
  };

  improvementAreas: string[];
}
```

## Conclusion

This strategy provides a comprehensive framework for analyzing cryptocurrencies within the ONE Platform's 6-dimension ontology. By systematically evaluating technical, market, and fundamental factors, and generating data-driven signals, analysts can make informed decisions while managing risk appropriately.

**Key Takeaways:**

1. Always start with risk assessment before opportunity evaluation
2. Use multi-dimensional analysis across all 6 dimensions
3. Verify all data against multiple sources
4. Generate signals with clear entry/exit criteria
5. Track performance and continuously improve
6. Never skip smart contract security analysis
7. Consider market context in all decisions

---

**Next Steps:**

- Implement automated screening workflows
- Build real-time monitoring dashboards
- Develop backtesting framework for signals
- Create custom alerts for portfolio tokens
- Establish regular review cadences

**Related Documents:**

- `/one/knowledge/ontology-crypto.md` - Crypto ontology specification
- `/one/things/plans/crypto-token-researcher.md` - Agent implementation
- `/one/things/plans/deep-researcher-agent.md` - Base researcher architecture
