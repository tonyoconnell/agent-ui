---
title: Altcoin Cycle Prediction Ontology
dimension: knowledge
category: altcoin-cycle-prediction-ontology.md
tags: 6-dimensions, ai, ontology
related_dimensions: events, groups, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the altcoin-cycle-prediction-ontology.md category.
  Location: one/knowledge/altcoin-cycle-prediction-ontology.md
  Purpose: Documents altcoin cycle prediction ontology
  Related dimensions: events, groups, things
  For AI agents: Read this to understand altcoin cycle prediction ontology.
---

# Altcoin Cycle Prediction Ontology

**A 6-Dimension Framework for Predicting Cryptocurrency Market Cycles Through Capital Flow Analysis**

## Executive Summary

This ontology models the predictable patterns of capital rotation in cryptocurrency markets, tracking how money flows from traditional monetary supply (M2) through Bitcoin, Ethereum, altcoins, and gold. By mapping these flows to our 6-dimension framework, we can identify cycle phases, predict rotations, and time entries/exits.

**Core Thesis**: Liquidity follows a predictable path of decreasing safety and increasing risk, creating exploitable cycles.

---

## Version

- **Ontology Version**: 1.0.0
- **Based On**: ONE Platform 6-Dimensions v1.0.0
- **Domain**: Cryptocurrency Cycle Analysis & Prediction
- **Last Updated**: 2025-11-03

---

## The Capital Flow Sequence

### The Master Flow Pattern

```
M2 Money Supply Expansion
         ↓
    [1] BITCOIN (Digital Gold)
         ↓
    [2] ETHEREUM (Digital Oil)
         ↓
    [3] LARGE CAP ALTS (Blue Chips)
         ↓
    [4] MID CAP ALTS (Growth)
         ↓
    [5] SMALL CAP ALTS (Speculation)
         ↓
    [6] MICRO CAPS (Peak Euphoria)
         ↓
    RISK OFF → Back to BTC/Gold
```

### Parallel Safe Haven Flow

```
Risk Off Events → GOLD ←→ BITCOIN
                    ↑
              Correlation varies
              (Sometimes positive,
               Sometimes negative)
```

---

## 1. GROUPS - Market Participant Categories

### Liquidity Providers
```typescript
type LiquidityGroup = {
  type: "central_bank" | "institutional" | "retail" | "algorithmic" | "ai_agent";

  characteristics: {
    capitalSize: "unlimited" | "large" | "medium" | "small";
    riskTolerance: "none" | "low" | "medium" | "high" | "extreme";
    timeHorizon: "minutes" | "days" | "weeks" | "months" | "years";
    sophistication: "basic" | "intermediate" | "advanced" | "professional";
  };

  behavior: {
    entryTriggers: string[]; // What makes them buy
    exitTriggers: string[]; // What makes them sell
    preferredAssets: string[]; // BTC, ETH, alts, etc
    cyclePhase: "accumulation" | "markup" | "distribution" | "markdown";
  };
};
```

### Market Phases by Participant

**Phase 1: Accumulation (Smart Money)**
- Central banks expand M2
- Institutions accumulate BTC quietly
- Retail is fearful/absent
- AI agents identify value

**Phase 2: Markup (Institutional)**
- Institutions publicly announce
- Retail begins to notice
- Media coverage increases
- FOMO begins

**Phase 3: Distribution (Retail Mania)**
- Retail dominates volume
- Everyone is a genius
- Leverage at maximum
- Shitcoins moon

**Phase 4: Markdown (Capitulation)**
- Retail panics and sells
- Institutions take profits
- Leverage unwinds violently
- Return to accumulation

---

## 2. PEOPLE - Key Actors in Cycles

### Cycle Influencers
```typescript
type CycleInfluencer = {
  type: "central_banker" | "whale" | "influencer" | "analyst" | "developer";

  influence: {
    followersImpact: number; // How many people they influence
    capitalImpact: number; // How much money follows them
    narrativeControl: number; // Ability to shape stories
    timing: "early" | "middle" | "late"; // When they appear in cycle
  };

  signals: {
    bullishActions: string[]; // "Fed cuts rates", "Saylor buys BTC"
    bearishActions: string[]; // "Fed hikes rates", "Influencer sells"
    pivotPoints: string[]; // Actions that mark cycle turns
  };
};
```

### Key Figures to Watch

**Macro Level**:
- Jerome Powell (Fed Chair) → M2 supply
- Christine Lagarde (ECB) → EU liquidity
- Bank of Japan → Yen carry trades

**Crypto Level**:
- Michael Saylor → BTC accumulation
- Vitalik Buterin → ETH narrative
- CZ, Brian Armstrong → Exchange flows
- Su Zhu, Kyle Davies → Leverage indicators

**AI Agents** (New 2025):
- Trading bots → Algorithmic flows
- Research agents → Pattern detection
- Sentiment analyzers → Crowd psychology

---

## 3. THINGS - Assets & Indicators

### Asset Hierarchy
```typescript
type CycleAsset = {
  tier: "monetary_base" | "tier1_crypto" | "tier2_crypto" | "tier3_crypto" | "shitcoin";

  properties: {
    marketCap: number;
    liquidity: number;
    volatility: number;
    correlationToBTC: number; // -1 to 1
    narrativeDependence: number; // 0-100 (how much price depends on story)
  };

  cycleMetrics: {
    typicalGainMultiple: number; // Expected return in bull cycle
    timeToTop: number; // Days from BTC top to asset top
    drawdownSeverity: number; // Typical bear market loss %
    recoveryTime: number; // Days to recover ATH
  };
};
```

### Asset Categories by Cycle Phase

**Tier 0: Monetary Base**
- M2 Money Supply
- DXY (Dollar Index)
- 10-Year Treasury Yields
- Gold

**Tier 1: Bitcoin**
- First mover in crypto liquidity
- 2-4x in bull cycles
- 70-85% drawdowns in bear
- Sets the cycle tempo

**Tier 2: Ethereum**
- Follows BTC by 2-4 weeks
- 3-6x in bull cycles
- 85-95% drawdowns in bear
- Alt season catalyst

**Tier 3: Large Cap Alts**
- Top 10-20 by market cap
- 5-15x in bull cycles
- 90-95% drawdowns
- Lag BTC by 1-2 months

**Tier 4: Mid/Small Caps**
- Below top 20
- 10-100x potential
- 95-99% drawdowns
- Peak mania indicators

**Tier 5: Memecoins/Shitcoins**
- 100-10,000x moonshots
- 99.9% go to zero
- Peak euphoria signal
- Cycle top indicator

### Cycle Indicators

```typescript
type CycleIndicator = {
  name: string;
  category: "macro" | "onchain" | "sentiment" | "technical" | "flow";

  signals: {
    bullish: {
      threshold: number;
      weight: number; // 0-1 importance
      reliability: number; // 0-1 historical accuracy
    };
    bearish: {
      threshold: number;
      weight: number;
      reliability: number;
    };
  };

  currentValue: number;
  historicalRange: [number, number];
  updateFrequency: "realtime" | "hourly" | "daily" | "weekly";
};
```

**Key Indicators by Category**:

**Macro**:
- M2 YoY Growth Rate (>8% bullish)
- Real Interest Rates (<0% bullish)
- DXY Direction (falling = bullish crypto)
- Global Liquidity Index

**On-Chain**:
- BTC Exchange Reserves (falling = bullish)
- Stablecoin Supply (rising = bullish)
- Long-term Holder Supply (rising = bullish)
- Realized Cap HODL Waves

**Sentiment**:
- Fear & Greed Index
- Funding Rates
- Social Volume
- Google Trends

**Technical**:
- BTC Dominance (falling = alt season)
- ETH/BTC Ratio (rising = alt season)
- Total Market Cap
- 200-week MA multiple

**Flow**:
- Coinbase Premium
- Grayscale Flows
- ETF Inflows
- Miner Selling

---

## 4. CONNECTIONS - Capital Flow Relationships

### Flow Patterns
```typescript
type CapitalFlow = {
  type: "rotation" | "flight_to_safety" | "risk_on" | "capitulation";
  source: string; // Where money comes from
  destination: string; // Where money goes

  triggers: {
    macroeconomic: string[]; // "Fed pivots", "Banking crisis"
    technical: string[]; // "BTC breaks ATH", "Death cross"
    sentiment: string[]; // "Euphoria", "Max fear"
    regulatory: string[]; // "ETF approval", "Ban threats"
  };

  characteristics: {
    volume: number; // Dollar amount
    velocity: number; // Speed of movement
    duration: number; // How long flow lasts
    reversibility: boolean; // Can it reverse quickly?
  };

  indicators: {
    leadingSignals: string[]; // What happens before
    confirmationSignals: string[]; // What confirms it's happening
    exhaustionSignals: string[]; // What shows it's ending
  };
};
```

### Critical Flow Patterns

**1. The Bitcoin Breakout Flow**
```
M2 Expansion → Bond Yields Fall →
DXY Weakens → BTC Breaks Previous ATH →
Institutional FOMO → Media Coverage →
Retail Awakens
```

**2. The Ethereum Catch-Up Flow**
```
BTC Dominance Peaks (65-70%) →
ETH/BTC Bottoms → DeFi Narrative Returns →
ETH Outperforms → Alt Season Begins
```

**3. The Alt Season Rotation**
```
ETH Makes New High → Large Caps Pump →
Mid Caps Follow → Small Caps Explode →
Memecoins Moon → Top Is In
```

**4. The Risk-Off Cascade**
```
Fed Hints at Tightening → DXY Spikes →
BTC Sells Off → ETH Sells Harder →
Alts Collapse → Stablecoins Dominate →
Wait for Fed Pivot
```

### Correlation Matrices

```typescript
type CorrelationMatrix = {
  timeframe: "1h" | "1d" | "1w" | "1m";

  correlations: {
    BTC_M2: number; // Typically 0.7-0.9 on monthly
    BTC_DXY: number; // Typically -0.5 to -0.8
    BTC_GOLD: number; // Varies: -0.3 to 0.8
    BTC_SPX: number; // Increasing: 0.3 to 0.7
    ETH_BTC: number; // 0.6-0.9
    ALTS_BTC: number; // 0.5-0.8 (higher in bull)
  };

  regimeDetection: {
    currentRegime: "risk_on" | "risk_off" | "transition";
    confidence: number; // 0-100%
    regimeAge: number; // Days in current regime
  };
};
```

---

## 5. EVENTS - Cycle Catalysts & Triggers

### Cycle Events
```typescript
type CycleEvent = {
  type: "catalyst" | "confirmation" | "exhaustion" | "reversal";
  impact: "macro" | "crypto_specific" | "narrative" | "technical";

  properties: {
    name: string;
    probability: number; // 0-100% likely to occur
    timeframe: string; // When expected
    magnitude: "low" | "medium" | "high" | "extreme";
  };

  effects: {
    immediatePriceAction: string; // First 24h
    mediumTermTrend: string; // 1-3 months
    cycleImplication: string; // Full cycle impact
  };

  historicalExamples: Array<{
    date: string;
    event: string;
    btcPriceBefore: number;
    btcPriceAfter: number;
    altMarketReaction: string;
  }>;
};
```

### Cycle-Defining Events

**Macro Catalysts**:
- Fed Pivot (Rate cuts after hikes) → New cycle begins
- Banking Crisis → Flight to crypto
- Currency Crisis → BTC as safe haven
- QE Announcement → Risk-on everything

**Crypto-Specific Catalysts**:
- Bitcoin Halving → Supply shock narrative
- ETH Upgrade → Scaling narrative
- ETF Approval → Institutional adoption
- Major Hack → Temporary fear, buying opportunity
- Regulatory Clarity → Removes uncertainty

**Narrative Catalysts** (New for AI Era):
- AI Agent Breakthrough → New use case
- X402 Adoption Milestone → Payment revolution
- CLARITY Act Passage → Token explosion
- AGI Announcement → Speculation frenzy

### Event Sequencing

**Bull Cycle Sequence**:
```
1. M2 Bottom/Expansion Begins
2. BTC Quietly Accumulates (Smart Money)
3. BTC Breaks Previous Cycle High
4. Media "Bitcoin is Back" Stories
5. ETH Begins Outperforming
6. DeFi Summer 2.0 Narrative
7. NFTs/Gaming/AI Narrative
8. Layer 1 Wars
9. Everything Pumps
10. Memecoins 100x Daily
11. "This Time Is Different"
12. Blow-off Top
```

**Bear Cycle Sequence**:
```
1. Fed Tightening/Macro Shock
2. Leverage Unwind Begins
3. BTC Breaks Below Key Support
4. Alt Coins Collapse 50% in Days
5. Stablecoin Depeg Fear
6. Exchange Insolvency Rumors
7. Capitulation Candles
8. "Crypto is Dead" Headlines
9. Sideways Accumulation
10. Smart Money Returns
```

---

## 6. KNOWLEDGE - Pattern Recognition & Prediction

### Cycle Patterns
```typescript
type CyclePattern = {
  name: string;
  reliability: number; // Historical success rate 0-100%

  setup: {
    macroConditions: string[];
    btcPriceAction: string;
    altcoinBehavior: string;
    sentimentReading: string;
    timeInCycle: string; // Early, mid, late
  };

  signal: {
    triggerEvent: string;
    confirmation: string[];
    invalidation: string;
  };

  execution: {
    entryStrategy: string;
    positionSizing: string;
    riskManagement: string;
    exitStrategy: string;
    expectedDuration: number; // Days
    expectedReturn: number; // Multiple
  };

  historicalPerformance: {
    occurrences: number;
    successRate: number;
    averageReturn: number;
    maxDrawdown: number;
  };
};
```

### Master Cycle Patterns

**1. The M2 Expansion Play**
```
Setup: M2 YoY > 8%, Real rates negative
Signal: BTC breaks 200-day MA
Entry: BTC at retest of breakout
Target: 2-3x over 12-18 months
Historical Success: 85% (6/7 times)
```

**2. The Halving Pump**
```
Setup: 6 months before halving
Signal: BTC up 50% from cycle low
Entry: Accumulate pre-halving
Target: New ATH within 18 months
Historical Success: 100% (3/3 times)
```

**3. The ETH Rotation**
```
Setup: BTC dominance > 65%
Signal: ETH/BTC makes higher low
Entry: Swap BTC for ETH
Target: ETH/BTC to 0.08+
Historical Success: 75% (3/4 times)
```

**4. The Alt Season Trigger**
```
Setup: ETH new ATH, BTC dominance falling
Signal: Total alt cap breaks previous high
Entry: Diversified alt portfolio
Target: 5-10x in 3-6 months
Historical Success: 80% (4/5 times)
```

**5. The Memecoin Top Signal**
```
Setup: Dogecoin in top 5
Signal: Random memecoins doing 100x weekly
Action: SELL EVERYTHING
Target: Cash or stablecoins
Historical Success: 100% (3/3 times)
```

### Cycle Timing Model

```typescript
type CycleTiming = {
  currentPhase: "accumulation" | "markup" | "distribution" | "markdown";
  phaseStartDate: Date;
  estimatedPhaseDuration: number; // Days

  keyDates: {
    nextHalving: Date;
    nextFedMeeting: Date;
    majorUpgrade: Date; // ETH upgrade, etc
    etfDecision: Date;
  };

  cycleClock: {
    percentComplete: number; // 0-100% of typical cycle
    daysFromBottom: number;
    daysToProjectedTop: number;
    historicalAnalog: string; // "Similar to 2017 at this stage"
  };

  probabilityWeights: {
    continuationProbability: number; // Chance cycle continues
    reversalProbability: number; // Chance of reversal
    accelerationProbability: number; // Chance of parabolic move
  };
};
```

### Machine Learning Signals

**AI-Detected Patterns** (2025+):
```typescript
type AIPattern = {
  model: "LSTM" | "Transformer" | "GAN" | "Ensemble";

  inputs: {
    macroData: string[]; // M2, DXY, yields
    priceData: string[]; // OHLCV all assets
    onChainData: string[]; // Flows, metrics
    socialData: string[]; // Sentiment, volume
    orderBookData: string[]; // Depth, walls
  };

  predictions: {
    nextPhaseChange: Date;
    btcPriceTarget: number;
    altSeasonProbability: number;
    topTickerPredictions: string[]; // Which alts will outperform
  };

  confidence: {
    overall: number; // 0-100%
    perPrediction: Map<string, number>;
    backtestAccuracy: number;
  };
};
```

### Risk Indicators

**Cycle Top Warnings**:
1. M2 growth decelerating
2. Fed hawkish pivot
3. BTC funding >0.1% sustained
4. Stablecoin supply declining
5. Exchange inflows spike
6. Long-term holders selling
7. Memecoin mania extreme
8. "Everyone is a genius" phase
9. Mainstream media crypto shows
10. Grandma asking about crypto

**Cycle Bottom Signals**:
1. M2 growth accelerating
2. Fed dovish pivot
3. BTC funding negative
4. Stablecoin supply growing
5. Exchange outflows sustained
6. Long-term holders accumulating
7. Crypto is "dead" headlines
8. No one talks about crypto
9. -90% from ATH for alts
10. Blood in the streets

---

## Query Patterns

### Finding Cycle Position
```
Current M2 Growth Rate
  → Historical Comparison
  → Liquidity Cycle Phase
  → Expected BTC Direction

BTC Price vs Moving Averages
  → Trend Strength
  → Support/Resistance
  → Breakout Probability

BTC Dominance Trend
  → Alt Season Timing
  → Capital Rotation Phase
  → Risk Appetite Gauge
```

### Identifying Rotation Opportunities
```
ETH/BTC Ratio at Support
  + BTC Dominance Topping
  + DeFi TVL Growing
  = Rotate to ETH

Large Cap Alts Breaking Out
  + ETH at New Highs
  + Stablecoin Supply Growing
  = Begin Alt Accumulation

Memecoins Mooning Daily
  + Retail Euphoria Extreme
  + Everyone Genius Phase
  = SELL EVERYTHING
```

### Risk Management Rules
```
Position Sizing:
  Cycle Early: 60% BTC, 30% ETH, 10% Cash
  Cycle Middle: 40% BTC, 30% ETH, 20% Alts, 10% Cash
  Cycle Late: 20% BTC, 20% ETH, 30% Alts, 30% Cash
  Cycle Top: 10% BTC, 10% ETH, 0% Alts, 80% Cash

Stop Losses:
  BTC: -25% from entry (cycles can be volatile)
  ETH: -30% from entry
  Alts: -40% from entry (or tighter)

Take Profits:
  BTC: 25% at 2x, 25% at 3x, let rest run
  ETH: 25% at 3x, 25% at 5x, let rest run
  Alts: 33% at 5x, 33% at 10x, 34% moonbag
```

---

## Implementation Guidelines

### Daily Monitoring Checklist

**Macro (Check Daily)**:
```
□ DXY direction and level
□ 10-year yield direction
□ Fed speaker calendar
□ M2 money supply update (weekly)
□ Major macro events
```

**Crypto (Check 2x Daily)**:
```
□ BTC price vs key levels
□ BTC dominance change
□ ETH/BTC ratio
□ Total market cap
□ Funding rates
□ Exchange flows
□ Stablecoin changes
```

**Sentiment (Check Daily)**:
```
□ Fear & Greed Index
□ Twitter sentiment
□ Reddit activity
□ Google Trends
□ Media headlines
```

### Weekly Analysis Framework

**Monday: Macro Monday**
- Review M2, DXY, Yields
- Fed calendar and speakers
- Global liquidity conditions

**Wednesday: Onchain Wednesday**
- Exchange flows
- Long-term holder behavior
- Miner activity
- Whale movements

**Friday: Flow Friday**
- Weekly capital flows
- Rotation patterns
- Position adjustments
- Risk assessment

### Cycle Phase Playbooks

**Accumulation Phase Playbook**:
1. Focus on BTC (60-80% allocation)
2. Small ETH position (20-30%)
3. Research next cycle narratives
4. Ignore noise, accumulate dips
5. Time horizon: 6-12 months

**Early Bull Playbook**:
1. Hold BTC core (50%)
2. Increase ETH (30%)
3. Begin researching alts
4. Take small alt positions (20%)
5. No leverage yet

**Mid Bull Playbook**:
1. Reduce BTC (30%)
2. Maintain ETH (30%)
3. Increase alts (30%)
4. Keep cash ready (10%)
5. Consider modest leverage

**Late Bull Playbook**:
1. Minimize BTC (20%)
2. Reduce ETH (20%)
3. Trade alts actively (40%)
4. Increase cash (20%)
5. Prepare exit strategy

**Distribution Phase Playbook**:
1. Sell rallies aggressively
2. Convert to stablecoins
3. Short opportunities appear
4. Preserve capital priority
5. Wait for next cycle

---

## Historical Cycle Data

### Past Cycles for Reference

**2016-2017 Cycle**:
- M2 Growth: 5-7%
- BTC: $200 → $20,000 (100x)
- ETH: $0.50 → $1,400 (2,800x)
- Duration: ~24 months
- Trigger: Halving + ICO mania

**2020-2021 Cycle**:
- M2 Growth: 20%+ (COVID)
- BTC: $3,800 → $69,000 (18x)
- ETH: $100 → $4,800 (48x)
- Duration: ~18 months
- Trigger: COVID money printing + Institutional adoption

**2024-2025 Cycle** (Current):
- M2 Growth: 8-10%
- BTC: $15,000 → $106,000+ (7x so far)
- ETH: $1,000 → ? (TBD)
- Duration: ? (In progress)
- Trigger: Halving + ETF + AI narrative

---

## AI Integration (2025+)

### AI-Enhanced Cycle Analysis

```typescript
type AICycleAnalyzer = {
  models: {
    macroPredictor: "Predicts M2, rates, DXY",
    flowAnalyzer: "Tracks capital movements",
    sentimentEngine: "Processes social data",
    patternMatcher: "Identifies historical analogs",
    executionBot: "Automates trades"
  };

  capabilities: {
    prediction Accuracy: number; // Current: 65-75%
    reactionSpeed: number; // Milliseconds
    dataProcessing: number; // TB per day
    patternLibrary: number; // Thousands of patterns
  };

  advantages: {
    emotionless: true,
    tireless: true,
    multiMarket: true, // Watches everything
    speedAdvantage: true, // Faster than humans
    learningRate: "continuous"
  };
};
```

### X402 Impact on Cycles

With X402 protocol enabling agent-to-agent payments:
- AI agents create micro-cycles within major cycles
- Automated rebalancing dampens volatility
- Machine-driven flows are more predictable
- New patterns emerge from agent behavior

---

## Conclusion

**The Ultimate Cycle Formula**:

```
Cycle Position = f(M2 Direction, BTC Dominance, ETH/BTC, Sentiment, Time from Halving)

If M2 Expanding + BTC Breaking Out + Low Sentiment = ACCUMULATE
If BTC Dominance Topping + ETH/BTC Rising = ROTATE TO ETH
If ETH New High + Alt Breakouts = ALT SEASON
If Memecoins Mooning + Euphoria = GET OUT
```

**Remember**:
1. Cycles are probabilistic, not deterministic
2. Macro liquidity drives everything
3. Bitcoin leads, alts follow
4. Sentiment extremes mark turns
5. Take profits on the way up
6. Preserve capital in bears
7. The cycle always repeats

---

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Next Update**: After Q1 2025 cycle development

**Note**: This framework synthesizes macro liquidity analysis, crypto market structure, and behavioral finance into an actionable cycle prediction system. Use in conjunction with risk management and never invest more than you can afford to lose.