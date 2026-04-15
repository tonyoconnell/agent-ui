---
title: Crypto Token Researcher
dimension: things
category: plans
tags: agent, ai, blockchain, groups, ontology, protocol
related_dimensions: events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/crypto-token-researcher.md
  Purpose: Documents crypto token researcher agent
  Related dimensions: events, groups, knowledge, people
  For AI agents: Read this to understand crypto token researcher.
---

# Crypto Token Researcher Agent

A domain-specialized autonomous agent for cryptocurrency and token research. Extends the Deep Researcher Agent pattern with crypto-specific tools, data sources, and reasoning patterns for blockchain analysis, token evaluation, and market intelligence.

## Overview

The Crypto Token Researcher Agent combines agentic reasoning with blockchain-native tools to analyze:

- Token fundamentals and contract auditing
- Market dynamics and liquidity analysis
- Smart contract code review and risk assessment
- On-chain metrics and behavioral patterns
- Project fundamentals and team analysis
- DeFi protocol risk evaluation
- Cross-chain bridging and interoperability

## 6-Dimension Ontology Mapping

### Groups

- **Organization Level**: Crypto research firm, hedge fund, protocol DAO
- **Parent-Child**: Investment firm → token research desk → chain-specific teams
- **Data Scoping**: Research tasks and findings scoped per investment thesis group
- **Plans**:
  - `starter` (retail token research)
  - `pro` (institutional analysis with on-chain data)
  - `enterprise` (multi-chain with smart contract audits)

### People

- **Roles**:
  - `platform_owner`: Chief research officer
  - `org_owner`: Crypto research director
  - `org_user`: Token analyst, smart contract reviewer
  - `customer`: Fund manager, LP, protocol team requesting analysis

- **Permissions**:
  - Basic analysis (all users)
  - On-chain data access (pro+)
  - Smart contract audit (enterprise)
  - Trading signals generation (org_owner)

### Things

#### Crypto Token Entity

```typescript
{
  type: "crypto_token",
  properties: {
    symbol: "BTC" | "ETH" | "USDC" | etc,
    chainId: number,
    contractAddress: string,
    decimals: number,
    totalSupply: string,
    circulatingSupply: string,
    marketCap: number,
    holders: number,
    isScam: boolean | null,
    auditStatus: "unaudited" | "self_audited" | "audited" | "certified",
    auditors: string[],
    launchDate: number,
    riskScore: 0-100,
    lastResearchUpdate: number
  }
}
```

#### Smart Contract Entity

```typescript
{
  type: "smart_contract",
  properties: {
    address: string,
    chainId: number,
    language: "solidity" | "vyper" | "rust",
    compilerVersion: string,
    sourceCode: string,
    bytecode: string,
    deploymentTx: string,
    deployer: string,
    isVerified: boolean,
    standards: ["ERC20", "ERC721"],
    vulnerabilities: Array<{type: string, severity: "low" | "medium" | "high" | "critical"}>,
    codeQuality: 0-100,
    lastAuditDate?: number,
    auditReports: string[]
  }
}
```

#### Token Research Report

```typescript
{
  type: "token_research_report",
  properties: {
    tokenId: Id<"things">,
    analysisType: "fundamental" | "technical" | "risk" | "sentiment",
    summary: string,
    findings: {
      fundamentals: {
        teamQuality: number,
        tokenomics: string,
        useCase: string,
        competitiveAdvantage: string
      },
      technical: {
        contractRisk: string,
        liquidityScore: number,
        volalityMetrics: {volatility: number, beta: number},
        priceDistribution: string
      },
      onChain: {
        whaleConcentration: number,
        holderDiversification: number,
        transactionVelocity: number,
        activeAddresses: number
      },
      sentiment: {
        socialScore: number,
        communityGrowth: number,
        developerActivity: number,
        marketSentiment: "bullish" | "neutral" | "bearish"
      }
    },
    riskScore: 0-100,
    riskFactors: string[],
    redFlags: string[],
    recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell" | "avoid",
    confidence: 0-1,
    timestamp: number,
    sources: Array<{type: "onchain" | "social" | "contract" | "market", data: string}>
  }
}
```

#### Trading Signal

```typescript
{
  type: "trading_signal",
  properties: {
    tokenId: Id<"things">,
    signalType: "accumulation" | "distribution" | "reversal" | "momentum" | "arbitrage",
    confidence: 0-1,
    entryPrice: number,
    targetPrice: number,
    stopLoss: number,
    timeframe: "5m" | "15m" | "1h" | "4h" | "1d" | "1w",
    rationale: string,
    riskReward: number,
    expiresAt: number,
    status: "pending" | "triggered" | "closed",
    outcome?: "profit" | "loss"
  }
}
```

### Connections

- **`analyzes`**: researcher_agent → crypto_token
  - metadata: `{ analysisType: string, depth: "surface" | "deep", turnsUsed: number }`

- **`audits`**: researcher_agent → smart_contract
  - metadata: `{ vulnerabilityCount: number, criticalIssues: number }`

- **`generates_signal`**: researcher_agent → trading_signal
  - metadata: `{ accuracy: number, profitFactor: number }`

- **`tracks`**: crypto_token → trading_signal (many signals per token)
  - metadata: `{ activeSignals: number, successRate: 0-1 }`

- **`bridges`**: crypto_token → crypto_token (cross-chain)
  - metadata: `{ bridgeType: string, liquidity: number, fee: number }`

- **`is_pool_of`**: smart_contract → crypto_token (DEX liquidity pools)
  - metadata: `{ liquidityUSD: number, volume24h: number, feePercent: number }`

### Events

- **`token_analyzed`**: Research completed on token
  - metadata: `{ tokenId, riskScore, recommendation }`

- **`contract_audited`**: Smart contract reviewed
  - metadata: `{ contractAddress, vulnerabilities, quality }`

- **`signal_generated`**: Trading signal created
  - metadata: `{ tokenId, signalType, confidence, targetPrice }`

- **`risk_detected`**: Red flag or vulnerability found
  - metadata: `{ tokenId, riskType, severity, description }`

- **`whale_activity_detected`**: Large holder transaction
  - metadata: `{ tokenId, address, amount, value, action }`

- **`contract_verified`**: Smart contract code verified on-chain
  - metadata: `{ contractAddress, verified: boolean }`

### Knowledge

- **Token Pattern Library**: Embeddings of token analysis patterns
  - Indexed by: use case, market cap, chain, sector
  - Supports similarity search for comparable tokens
  - Tracks historical accuracy

- **Vulnerability Database**: Common smart contract patterns and risks
  - Reentrancy vulnerabilities
  - Flash loan attacks
  - Infinite mint vulnerabilities
  - Access control issues

- **Market Data Corpus**: Historical token performance and on-chain metrics
  - Price predictions vs actual outcomes
  - On-chain indicator correlations
  - Seasonal patterns

- **Sentiment Models**: Social and developer activity patterns
  - Twitter/Discord activity correlation
  - GitHub commit patterns
  - Community sentiment indicators

## Architecture

### Specialized Tool Suite

#### 1. On-Chain Data Tools

```typescript
tools: [
  "etherscan_api", // Contract verification, transactions
  "dune_analytics", // Complex on-chain queries
  "glassnode", // On-chain metrics (holders, velocity, etc)
  "nansen", // Wallet labeling, smart money tracking
  "flipside_crypto", // Cryptocurrency analytics
  "messari", // Crypto asset research
  "blockchain_rpc", // Direct RPC calls for token data
];
```

#### 2. Smart Contract Tools

```typescript
tools: [
  "solidity_parser", // Parse and analyze Solidity code
  "mythril", // Smart contract security analysis
  "slither", // Static analysis framework
  "forge_test", // Execute contract tests
  "decompiler", // Bytecode decompilation
];
```

#### 3. Market Data Tools

```typescript
tools: [
  "coingecko_api", // Token market data
  "dexscreener", // DEX token liquidity
  "cmc", // CoinMarketCap data
  "serum_dex", // Solana DEX data
  "uniswap_subgraph", // Ethereum DEX analytics
  "lifi_data", // Cross-chain liquidity
];
```

#### 4. Sentiment & Social Tools

```typescript
tools: [
  "twitter_api", // Tweet volume, sentiment
  "discord_analytics", // Community engagement
  "github_api", // Developer activity
  "reddit_search", // Community discussion
  "blockchain_news", // Crypto news aggregation
];
```

### Execution Modes for Crypto

#### QuickAnalysis Mode

Fast token screening using public data and on-chain metrics.

- Max 10 turns
- Uses market data + basic holder analysis
- ~30 second execution

#### DeepDive Mode

Comprehensive analysis with smart contract review.

- Max 30 turns
- Includes contract audit, token economics deep dive
- On-chain behavior analysis
- ~5 minute execution

#### AuditMode

Full smart contract security audit with RL-optimized patterns.

- Max 50 turns
- Vulnerability detection with historical vulnerability database
- Code quality scoring
- Cross-contract dependency analysis
- ~30 minute execution for complex protocols

### Analysis Workflow

```
1. Token Identification
   ├─ Verify contract address across chains
   ├─ Confirm token metadata
   └─ Check for scam indicators

2. Smart Contract Analysis
   ├─ Retrieve verified source code
   ├─ Parse contract structure
   ├─ Run static analysis (Slither/Mythril)
   ├─ Identify standard compliance (ERC20, etc)
   └─ Detect vulnerabilities

3. On-Chain Metrics
   ├─ Token holder distribution
   ├─ Whale concentration
   ├─ Transfer velocity
   ├─ Active address trends
   └─ Liquidity pool analysis

4. Market Analysis
   ├─ Price volatility
   ├─ Trading volume
   ├─ Liquidity depth
   ├─ Order book health
   └─ Cross-exchange comparison

5. Sentiment Analysis
   ├─ Social media volume
   ├─ Community engagement
   ├─ Developer activity
   ├─ News sentiment
   └─ Whale wallet follows

6. Synthesis & Reporting
   ├─ Risk scoring (0-100)
   ├─ Red flag identification
   ├─ Recommendation generation
   ├─ Signal generation
   └─ Report publication
```

## Backend Implementation

### Mutations (convex/mutations/crypto-researcher.ts)

```typescript
export const createTokenAnalysisTask = mutation({
  args: {
    groupId: v.id("groups"),
    tokenSymbol: v.string(),
    chainId: v.number(),
    contractAddress: v.string(),
    analysisType: v.string(),
    depth: v.string(), // "quick" | "deep" | "audit"
  },
  handler: async (ctx, args) => {
    // Verify token exists or create
    const tokenId = await findOrCreateToken(ctx, args);

    // Create analysis task
    const taskId = await ctx.db.insert("things", {
      groupId: args.groupId,
      type: "crypto_research_task",
      name: `${args.tokenSymbol} Analysis (${args.analysisType})`,
      properties: {
        tokenId,
        analysisType: args.analysisType,
        chainId: args.chainId,
        contractAddress: args.contractAddress,
        depth: args.depth,
        status: "pending",
      },
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log task
    await ctx.db.insert("events", {
      groupId: args.groupId,
      type: "token_analysis_started",
      actorId: ctx.auth?.getUserIdentity()?.tokenIdentifier,
      targetId: taskId,
      timestamp: Date.now(),
      metadata: {
        tokenSymbol: args.tokenSymbol,
        analysisType: args.analysisType,
        depth: args.depth,
      },
    });

    return taskId;
  },
});

export const publishTokenReport = mutation({
  args: {
    groupId: v.id("groups"),
    taskId: v.id("things"),
    tokenId: v.id("things"),
    findings: v.object({
      fundamentals: v.any(),
      technical: v.any(),
      onChain: v.any(),
      sentiment: v.any(),
    }),
    riskScore: v.number(),
    recommendation: v.string(),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("things", {
      groupId: args.groupId,
      type: "token_research_report",
      name: `Report: ${args.tokenId}`,
      properties: {
        tokenId: args.tokenId,
        findings: args.findings,
        riskScore: args.riskScore,
        recommendation: args.recommendation,
        timestamp: Date.now(),
      },
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Link to token
    await ctx.db.insert("connections", {
      groupId: args.groupId,
      type: "analyzes",
      sourceId: args.taskId,
      targetId: args.tokenId,
      validFrom: Date.now(),
      metadata: { riskScore: args.riskScore },
    });

    // Generate signals if high confidence
    if (args.riskScore < 30 && args.recommendation.includes("buy")) {
      await generateTradingSignals(ctx, args);
    }

    return reportId;
  },
});

export const auditSmartContract = mutation({
  args: {
    groupId: v.id("groups"),
    contractAddress: v.string(),
    chainId: v.number(),
    sourceCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Create or find contract
    const contractId = await findOrCreateContract(ctx, args);

    // Run static analysis
    const vulnerabilities = await runStaticAnalysis(args.sourceCode);

    // Update contract with findings
    await ctx.db.patch(contractId, {
      properties: {
        vulnerabilities,
        codeQuality: calculateCodeQuality(vulnerabilities),
        lastAuditDate: Date.now(),
      },
      updatedAt: Date.now(),
    });

    // Log audit completion
    await ctx.db.insert("events", {
      groupId: args.groupId,
      type: "contract_audited",
      targetId: contractId,
      timestamp: Date.now(),
      metadata: {
        vulnerabilityCount: vulnerabilities.length,
        criticalIssues: vulnerabilities.filter((v) => v.severity === "critical")
          .length,
      },
    });

    return contractId;
  },
});
```

### Service Pattern (convex/services/CryptoResearcherEffect.ts)

```typescript
export const analyzeCryptoToken = (request: TokenAnalysisRequest) => {
  return pipe(
    loadTokenData(request),
    Effect.flatMap(fetchOnChainMetrics),
    Effect.flatMap(retrieveSmartContract),
    Effect.flatMap(auditContract),
    Effect.flatMap(analyzeMarketData),
    Effect.flatMap(analyzeSentiment),
    Effect.flatMap(calculateRiskScore),
    Effect.flatMap(generateRecommendation),
    Effect.flatMap(createReport),
  );
};

export const generateTradingSignals = (
  report: TokenResearchReport,
): Effect.Effect<TradeSignal[], ResearchError> => {
  return pipe(
    analyzeOnChainBehavior(report),
    Effect.flatMap(detectAccumulation),
    Effect.flatMap(identifyWhaleActivity),
    Effect.flatMap(analyzeVolatilityCluster),
    Effect.map((signals) => filterHighConfidenceSignals(signals)),
  );
};
```

## Risk Scoring Methodology

```
Base Risk Score (0-100):

Fundamental Risk (30%):
  - Team quality: 0-10
  - Tokenomics (cliff locks, vesting): 0-10
  - Use case viability: 0-10

Technical Risk (30%):
  - Smart contract vulnerabilities: 0-15
  - Code quality: 0-15

On-Chain Risk (20%):
  - Whale concentration: 0-10
  - Holder diversification: 0-10

Market Risk (20%):
  - Liquidity sufficiency: 0-10
  - Exchange listings: 0-10

Red Flags (auto-increase score):
  +20 points: Scam indicators
  +15 points: Unverified contract
  +15 points: Suspicious function calls
  +10 points: Known vulnerable patterns
  +10 points: Low liquidity

Final Score = min(100, Base Score + Red Flags)
```

## Real-World Applications

### DeFi Protocol Analysis

- Liquidity pool risk assessment
- Smart contract dependency mapping
- Yield sustainability analysis
- Governance token evaluation

### Token Launch Evaluation

- Pre-launch vesting analysis
- Initial distribution fairness
- Team token lock verification
- Liquidity pool initialization safety

### Regulatory Compliance

- Securities law compliance check
- KYC/AML requirements
- Staking reward regulations
- Tax implication analysis

### Portfolio Risk Management

- Concentration risk assessment
- Correlation analysis across holdings
- Early warning signals
- Liquidation cascade detection

## Limitations & Extensions

1. **Oracle Risk**: Dependent on data provider reliability
2. **Contract Upgrade Risk**: Proxy contracts harder to audit
3. **Cross-Chain Complexity**: Bridge risk assessment incomplete
4. **Flash Loan Dynamics**: Advanced attack vector analysis needed
5. **Time Sensitivity**: Token analysis has short shelf-life

## Related Patterns

- **Deep Researcher Agent**: Base architecture and reasoning patterns
- **Heavy Mode IterResearch**: Multi-round token analysis
- **Parallel Synthesis**: Combine multiple analyst perspectives
- **Effect.ts Services**: Pure business logic for risk calculations

---

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Ontology Version**: 6-Dimensions v1.0.0
**Domain**: Cryptocurrency and Token Analysis
**Specialized For**: DeFi, Token Evaluation, Smart Contract Auditing
