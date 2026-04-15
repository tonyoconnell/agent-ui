---
title: Ontology Crypto
dimension: knowledge
category: ontology-crypto.md
tags: 6-dimensions, ai, blockchain, connections, events, groups, knowledge, ontology, people, protocol
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the ontology-crypto.md category.
  Location: one/knowledge/ontology-crypto.md
  Purpose: Documents crypto token analysis ontology
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand ontology crypto.
---

# Crypto Token Analysis Ontology

An extension of the ONE Platform 6-dimension ontology specialized for cryptocurrency, DeFi, NFTs, and blockchain ecosystems. This ontology provides a comprehensive framework for modeling all aspects of crypto token analysis, from smart contracts to market dynamics.

## Version

- **Ontology Version**: 1.0.0 (Domain-specific extension)
- **Based On**: ONE Platform 6-Dimensions v3.0.0 (Reality as DSL)
- **Domain**: Cryptocurrency and Blockchain Analysis (AI Token Specialization + Paradigm Shift 2025)
- **Paradigm Shift**: X402 Protocol + CLARITY Act
- **Last Updated**: 2025-11-03

## Overview

The Crypto Ontology extends our universal 6-dimension model to capture the unique aspects of blockchain ecosystems:

```
Groups (DAOs, Protocols, Investment Funds)
    ↓
People (Founders, Holders, Validators)
    ↓
Things (Tokens, Contracts, NFTs, Pools)
    ↓
Connections (Liquidity, Staking, Bridging)
    ↓
Events (Swaps, Mints, Burns, Governance)
    ↓
Knowledge (Analytics, Risk Scoring, Patterns)
```

## AI Token Specialization

This ontology has been enhanced with specific support for **AI-related tokens**, which represent a unique category in the crypto ecosystem. AI tokens power decentralized AI infrastructure, agent-to-agent economies, compute networks, model marketplaces, and data exchanges.

### AI Token Categories

**1. Compute Tokens**: Payment for GPU/TPU resources and cycle
   - Examples: Akash, Render Network, io.net
   - Metrics: GPU utilization, cycle throughput, cost per compute unit

**2. Agent Economy Tokens**: Enable autonomous agent transactions
   - Examples: Fetch.ai, Ocean Protocol, SingularityNET
   - Metrics: Agent-to-agent transactions, active agents, task completion rate

**3. Model Access Tokens**: License AI models and training data
   - Examples: Bittensor, Gensyn, Prime Intellect
   - Metrics: Model downloads, API calls, fine-tuning requests

**4. Data Marketplace Tokens**: Facilitate AI data trading
   - Examples: Ocean Protocol, Streamr, The Graph
   - Metrics: Data sets traded, query volume, data quality scores

**5. AI Infrastructure Tokens**: Decentralized AI platforms and tools
   - Examples: Filecoin (storage), Arweave (permanent storage), Chainlink (oracles)
   - Metrics: Network capacity, uptime, integration count

### AI Token Unique Characteristics

- **Utility-Driven**: Value tied to actual AI usage, not speculation
- **Compute-Intensive**: Requires verifiable proof of work/computation
- **Agent-Native**: Designed for machine-to-machine transactions
- **Performance-Linked**: Token value correlates with AI capability
- **Regulatory Complexity**: AI governance and safety considerations

## 2025 Paradigm Shift: X402 + CLARITY

**Critical Update**: Two developments fundamentally changed AI-crypto in 2025:

### X402 Protocol (May 2025)

Coinbase's micropayment protocol using HTTP 402 status code:
- **Purpose**: Enable autonomous AI agent payments
- **Market**: $1.15B ecosystem, 932K+ weekly transactions (+34,300% growth)
- **Settlement**: 2 seconds, $0.001 minimum transaction
- **Backing**: Coinbase, Cloudflare, Visa, AWS, Google
- **Projection**: $30T AI agent economy by 2030 (Gartner)

**New Token Category**: X402 Payment Tokens optimized for agent-to-agent micropayments

### CLARITY Act (July 2025)

Legal framework for token creation (H.R. 3633, passed House 294-134):
- **Purpose**: Clear path for companies to create utility tokens
- **Oversight**: CFTC for digital commodities (not SEC)
- **Impact**: Companies can tokenize products/services legally
- **Timeline**: 360-day implementation, 180-day provisional registration

**New Token Categories**:
- CLARITY-compliant company tokens
- AI-generated tokens (programmatic creation)
- Agent service tokens

**Paradigm Shift**: From "AI tokens" to "AI that creates tokens" + "Every company has a token"

See `/one/knowledge/ai-token-paradigm-shift-2025.md` for complete analysis.

## 1. GROUPS - Protocol and Organization Structures

### Protocol Groups
Blockchain protocols and their governance structures.

```typescript
type ProtocolGroup = {
  type: "protocol" | "dao" | "defi_protocol" | "layer1" | "layer2";
  properties: {
    chainId: number;
    protocolType: "lending" | "dex" | "bridge" | "yield" | "governance" | "infrastructure";
    tvl: string; // Total Value Locked in USD
    governance: {
      type: "token" | "multisig" | "onchain" | "offchain";
      tokenAddress?: string;
      quorum?: number;
      proposalThreshold?: number;
    };
    treasury: {
      address: string;
      valueUSD: number;
      assets: Array<{token: string, amount: string}>;
    };
    auditStatus: "unaudited" | "audited" | "certified";
    auditors: string[];
    foundedDate: number;
    isActive: boolean;
  };
};
```

### Investment Groups
Funds, VCs, and whale organizations.

```typescript
type InvestmentGroup = {
  type: "hedge_fund" | "vc_fund" | "whale_group" | "mining_pool";
  properties: {
    aum: string; // Assets Under Management
    portfolioSize: number;
    investmentThesis: string;
    wallets: Array<{address: string, chain: string}>;
    trackRecord: {
      totalInvested: string;
      totalReturned: string;
      roiMultiple: number;
    };
    compliance: {
      jurisdiction: string;
      licenses: string[];
      kycRequired: boolean;
      amlProcedures: boolean;
    };
  };
};
```

### Community Groups
Token holder communities and guilds.

```typescript
type CommunityGroup = {
  type: "holder_community" | "nft_community" | "defi_guild" | "validator_set";
  properties: {
    memberCount: number;
    minimumHolding?: string;
    requiredNFTs?: string[];
    discordId?: string;
    telegramId?: string;
    governanceWeight?: string;
    communityTreasury?: string;
  };
};
```

### AI Network Groups
Decentralized AI infrastructure and compute networks.

```typescript
type AINetworkGroup = {
  type: "compute_network" | "model_marketplace" | "data_dao" | "agent_collective" | "ai_protocol";
  properties: {
    networkType: "gpu_compute" | "cycle" | "training" | "data_labeling" | "agent_hosting";

    capacity: {
      totalNodes: number;
      activeNodes: number;
      totalGPUs?: number;
      totalVRAM?: string; // in GB
      computeUnits: string; // TFLOPS or similar
      utilizationRate: number; // 0-100%
    };

    performance: {
      avgCycleTime: number; // milliseconds
      throughput: number; // requests per second
      uptime: number; // percentage
      latency: number; // milliseconds
      reliability: number; // 0-100 score
    };

    aiCapabilities: {
      supportedModels: string[]; // "llama-2", "stable-diffusion", etc
      maxModelSize: string; // "70B parameters"
      trainingSupport: boolean;
      finetuningSupport: boolean;
      cycleOnly: boolean;
    };

    economics: {
      tokenAddress: string;
      pricePerComputeUnit: number; // in tokens
      pricePerCycle: number;
      pricePerTrainingHour?: number;
      revenueSharing: number; // percentage to node operators
      stakingRequired: string; // minimum stake for operators
    };

    governance: {
      aiEthicsPolicy: string;
      contentModeration: boolean;
      disputeResolution: string;
      upgradeProcess: string;
    };

    verification: {
      proofOfCompute: "zkML" | "optimistic" | "sampling" | "tee";
      auditTrail: boolean;
      benchmarkResults: Record<string, number>;
    };
  };
};
```

### Agent Collectives
Groups of autonomous AI agents coordinating activity.

```typescript
type AgentCollective = {
  type: "agent_dao" | "agent_swarm" | "agent_marketplace";
  properties: {
    agentCount: number;
    activeAgents: number;

    capabilities: {
      taskTypes: string[]; // "research", "trading", "content", etc
      coordinationProtocol: string;
      specializations: string[];
    };

    economics: {
      tokenAddress: string;
      revenueModel: "fee_sharing" | "subscription" | "task_based";
      treasuryBalance: string;
      agentEarnings: string; // total earned by agents
    };

    metrics: {
      tasksCompleted: number;
      successRate: number;
      avgTaskDuration: number;
      clientSatisfaction: number; // 0-100
    };
  };
};
```

## 2. PEOPLE - Actors in the Crypto Ecosystem

### Founder/Team Members
```typescript
type Founder = {
  type: "founder" | "core_team" | "advisor";
  properties: {
    wallets: Array<{address: string, chain: string, ens?: string}>;
    tokensVesting: Array<{
      tokenAddress: string;
      amount: string;
      cliff: number;
      vestingEnd: number;
    }>;
    previousProjects: Array<{name: string, role: string, outcome: string}>;
    socialProfiles: {
      twitter?: string;
      github?: string;
      linkedin?: string;
    };
    reputation: {
      rugPulls: number;
      successfulProjects: number;
      communityTrust: 0-100;
    };
  };
};
```

### Token Holders
```typescript
type TokenHolder = {
  type: "retail_holder" | "whale" | "institution" | "market_maker";
  properties: {
    wallets: Array<{address: string, chain: string}>;
    holdings: Array<{
      tokenAddress: string;
      balance: string;
      percentOfSupply: number;
      costBasis?: string;
    }>;
    tradingBehavior: {
      avgHoldTime: number;
      tradeFrequency: "high" | "medium" | "low";
      profitability: number;
    };
    onChainReputation: {
      firstTransaction: number;
      totalTransactions: number;
      protocolsUsed: string[];
      defiScore: 0-100;
    };
  };
};
```

### Service Providers
```typescript
type ServiceProvider = {
  type: "auditor" | "market_maker" | "oracle_provider" | "validator";
  properties: {
    services: string[];
    clientProtocols: string[];
    operatingChains: number[];
    performance: {
      uptime?: number;
      accuracy?: number;
      incidentsCount: number;
    };
    fees: {
      structure: "flat" | "percentage" | "performance";
      amount: string;
    };
  };
};
```

## 3. THINGS - Crypto Assets and Contracts

### Tokens
```typescript
type Token = {
  type: "fungible_token" | "governance_token" | "utility_token" | "security_token" | "stablecoin";
  properties: {
    standard: "ERC20" | "ERC223" | "BEP20" | "SPL" | "CW20";
    contractAddress: string;
    chainId: number;
    decimals: number;

    supply: {
      total: string;
      circulating: string;
      burned: string;
      locked: string;
      staked: string;
    };

    tokenomics: {
      mintable: boolean;
      burnable: boolean;
      pausable: boolean;
      upgradeable: boolean;
      maxSupply?: string;
      inflationRate?: number;
      deflationMechanism?: string;
    };

    distribution: {
      team: number; // percentage
      investors: number;
      treasury: number;
      publicSale: number;
      liquidity: number;
      rewards: number;
    };

    market: {
      price: number;
      marketCap: number;
      volume24h: number;
      liquidity: number;
      volatility: number;
      ath: number;
      atl: number;
    };

    risk: {
      score: 0-100;
      honeypot: boolean;
      blacklisted: boolean;
      taxOnTransfer: number;
      hiddenMint: boolean;
      proxyContract: boolean;
    };
  };
};
```

### NFT Collections
```typescript
type NFTCollection = {
  type: "art" | "gaming" | "utility" | "membership" | "land";
  properties: {
    standard: "ERC721" | "ERC1155" | "Metaplex";
    contractAddress: string;
    chainId: number;
    totalSupply: number;

    metadata: {
      baseURI: string;
      revealedPercentage: number;
      traitsCount: number;
      rarityTiers: Array<{tier: string, count: number}>;
    };

    market: {
      floorPrice: number;
      volume24h: number;
      holders: number;
      listings: number;
      royaltyPercent: number;
      marketplaces: string[];
    };

    utility: {
      stakingEnabled: boolean;
      revenueShare: boolean;
      accessPass: string;
      gameIntegration: string;
    };
  };
};
```

### Smart Contracts
```typescript
type SmartContract = {
  type: "dex" | "lending" | "vault" | "bridge" | "factory" | "proxy";
  properties: {
    address: string;
    chainId: number;
    compiler: "solidity" | "vyper" | "rust" | "move";
    version: string;

    code: {
      verified: boolean;
      sourceCode?: string;
      bytecode: string;
      constructor: string;
      optimizer: boolean;
      runs?: number;
    };

    security: {
      audited: boolean;
      auditors: string[];
      vulnerabilities: Array<{
        type: "reentrancy" | "overflow" | "access" | "logic";
        severity: "low" | "medium" | "high" | "critical";
        status: "open" | "mitigated" | "accepted";
      }>;
      lastAudit?: number;
      bugBounty?: string;
    };

    upgradability: {
      type: "immutable" | "transparent" | "uups" | "diamond";
      admin?: string;
      implementation?: string;
      timelock?: number;
    };

    usage: {
      transactionCount: number;
      uniqueUsers: number;
      volumeUSD: string;
      gasUsed: string;
      lastActivity: number;
    };
  };
};
```

### Liquidity Pools
```typescript
type LiquidityPool = {
  type: "amm" | "orderbook" | "concentrated" | "stable" | "weighted";
  properties: {
    protocol: string;
    pairAddress: string;
    chainId: number;

    assets: Array<{
      tokenAddress: string;
      symbol: string;
      reserve: string;
      weight?: number;
    }>;

    metrics: {
      tvl: string;
      volume24h: string;
      fees24h: string;
      apy: number;
      impermanentLoss: number;
      feePercent: number;
    };

    positions: {
      totalPositions: number;
      averageSize: string;
      utilizationRate: number;
    };

    incentives: {
      rewardTokens: string[];
      rewardRate: string;
      farmingAPY: number;
      boostAvailable: boolean;
    };
  };
};
```

### Yield Strategies
```typescript
type YieldStrategy = {
  type: "farming" | "staking" | "lending" | "vault" | "leverage";
  properties: {
    protocol: string;
    contractAddress: string;
    chainId: number;

    assets: {
      depositToken: string;
      rewardTokens: string[];
      strategyToken?: string; // LP token, vault share, etc
    };

    returns: {
      baseAPY: number;
      rewardAPY: number;
      totalAPY: number;
      compounding: "none" | "daily" | "continuous";
    };

    risk: {
      impermanentLoss: boolean;
      complexity: "low" | "medium" | "high";
      auditScore: 0-100;
      historicalDrawdown: number;
      timelock: number;
    };

    requirements: {
      minimumDeposit: string;
      lockPeriod?: number;
      unstakingPeriod?: number;
      earlyExitPenalty?: number;
    };
  };
};
```

### AI-Specific Entities

#### AI Compute Tokens
Tokens for decentralized AI computation and cycle.

```typescript
type AIComputeToken = {
  type: "ai_compute_token";
  properties: {
    // Extends standard token properties
    ...Token.properties,

    aiSpecific: {
      computeType: "gpu" | "tpu" | "asic" | "general";
      pricingModel: "per_cycle" | "per_hour" | "per_epoch" | "per_token";

      usage: {
        totalCycles: number;
        totalComputeHours: number;
        uniqueUsers: number;
        utilization: number; // 0-100%
      };

      performance: {
        avgCycleTime: number; // ms
        throughput: number; // cycles/sec
        costPerCycle: number; // in USD
        costVsCentralized: number; // percentage vs AWS/GCP
      };

      capabilities: {
        maxModelSize: string; // "70B parameters"
        supportedFrameworks: string[]; // "pytorch", "tensorflow"
        gpuTypes: string[]; // "A100", "H100"
        specializationScore: number; // 0-100 (how specialized)
      };

      verification: {
        proofMechanism: "zkML" | "optimistic" | "sampling" | "tee";
        verifiable: boolean;
        auditTrail: boolean;
      };
    };
  };
};
```

#### AI Agent Tokens
Tokens powering autonomous AI agent economies.

```typescript
type AIAgentToken = {
  type: "ai_agent_token";
  properties: {
    ...Token.properties,

    aiSpecific: {
      agentEconomy: {
        activeAgents: number;
        totalTransactions: number;
        avgTransactionValue: number;
        agentToAgentRatio: number; // % of A2A vs human txs
      };

      capabilities: {
        taskTypes: string[]; // "research", "trading", "content"
        autonomyLevel: "semi" | "full" | "supervised";
        coordinationProtocol: string; // "Fetch.ai", "SingularityNET"
        interoperability: string[]; // Compatible agent platforms
      };

      performance: {
        taskSuccessRate: number; // 0-100%
        avgTaskCompletionTime: number; // seconds
        agentSatisfactionScore: number; // 0-100
        humanSatisfactionScore: number; // 0-100
      };

      safety: {
        ethicsPolicy: string;
        contentModeration: boolean;
        disputeResolution: string;
        killSwitch: boolean;
      };
    };
  };
};
```

#### AI Model NFTs
NFTs representing ownership/access to AI models.

```typescript
type AIModelNFT = {
  type: "ai_model_nft";
  properties: {
    ...NFTCollection.properties,

    modelDetails: {
      modelName: string;
      architecture: string; // "transformer", "diffusion"
      parameters: string; // "7B", "13B", "70B"
      trainingData: string; // description or hash
      trainingCost: number; // in USD
      trainingDuration: number; // hours
    };

    performance: {
      benchmarkScores: Record<string, number>; // "MMLU": 82.5
      accuracy: number;
      latency: number;
      throughput: number;
    };

    licensing: {
      accessType: "exclusive" | "shared" | "api_only";
      commercialUse: boolean;
      resaleAllowed: boolean;
      royaltyPercent: number;
      restrictedUses: string[];
    };

    usage: {
      totalCycles: number;
      uniqueUsers: number;
      revenueGenerated: string;
      finetuneRequests: number;
    };

    provenance: {
      trainer: string; // address
      datasetHash: string;
      trainingLogHash: string;
      reproducible: boolean;
    };
  };
};
```

#### AI Data Tokens
Tokens representing AI training data and datasets.

```typescript
type AIDataToken = {
  type: "ai_data_token";
  properties: {
    ...Token.properties,

    dataDetails: {
      dataType: "text" | "image" | "video" | "audio" | "multimodal";
      datasetSize: string; // "1TB", "1M samples"
      dataQuality: number; // 0-100 score
      labeling: "raw" | "labeled" | "verified" | "synthetic";
      language: string[];
      domain: string; // "medical", "legal", "general"
    };

    provenance: {
      source: string;
      collection Method: string;
      privacyCompliant: boolean;
      consentObtained: boolean;
      datasetHash: string;
    };

    usage: {
      trainingRuns: number;
      activeSubscribers: number;
      revenueSharing: number; // % to data contributors
      accessModel: "open" | "subscription" | "pay_per_use";
    };

    quality: {
      biasScore: number; // 0-100 (lower is better)
      diversityScore: number; // 0-100
      cleanlinessScore: number; // 0-100
      verificationStatus: "unverified" | "community" | "certified";
    };

    licensing: {
      commercialUse: boolean;
      redistributionAllowed: boolean;
      attributionRequired: boolean;
      restrictedUses: string[];
    };
  };
};
```

#### Compute Node NFT
NFT representing ownership of a compute node in AI network.

```typescript
type ComputeNodeNFT = {
  type: "compute_node_nft";
  properties: {
    ...NFTCollection.properties,

    hardware: {
      gpuModel: string; // "NVIDIA A100"
      gpuCount: number;
      vram: string; // "80GB"
      cpuModel: string;
      ram: string;
      storage: string;
      bandwidth: string; // "10 Gbps"
    };

    performance: {
      uptime: number; // percentage
      avgLatency: number; // ms
      throughput: number; // compute units/hour
      reliability: number; // 0-100 score
      totalComputeHours: number;
    };

    earnings: {
      totalEarned: string;
      currentAPY: number;
      reputationScore: number; // 0-100
      penaltiesIncurred: number;
    };

    staking: {
      requiredStake: string;
      currentStake: string;
      slashingRisk: number; // percentage
      rewardMultiplier: number;
    };

    location: {
      region: string;
      jurisdiction: string;
      energySource?: string; // "renewable", "grid"
    };
  };
};
```

## 4. CONNECTIONS - Relationships in Crypto

### Liquidity Relationships
```typescript
type LiquidityConnection = {
  type: "provides_liquidity" | "borrows_from" | "stakes_in";
  sourceId: Id<"things">; // holder
  targetId: Id<"things">; // pool/protocol
  metadata: {
    amount: string;
    shares: string;
    entryPrice: number;
    duration: number;
    unrealizedPnL: number;
  };
};
```

### Token Relationships
```typescript
type TokenConnection = {
  type: "backed_by" | "pegged_to" | "wrapped_from" | "derives_from";
  sourceId: Id<"things">; // derivative token
  targetId: Id<"things">; // underlying asset
  metadata: {
    ratio: number;
    mechanism: "mint_burn" | "lock_unlock" | "algorithmic";
    bridge?: string;
    totalBacked: string;
  };
};
```

### Governance Relationships
```typescript
type GovernanceConnection = {
  type: "governs" | "delegates_to" | "votes_on";
  sourceId: Id<"things">; // token or holder
  targetId: Id<"things">; // protocol or proposal
  metadata: {
    votingPower: string;
    delegatedFrom?: string[];
    proposalsVoted: number;
    alignmentScore: number;
  };
};
```

### Cross-Chain Relationships
```typescript
type CrossChainConnection = {
  type: "bridges_to" | "mirrors" | "syncs_with";
  sourceId: Id<"things">; // token on chain A
  targetId: Id<"things">; // token on chain B
  metadata: {
    bridge: string;
    sourceChain: number;
    targetChain: number;
    totalBridged: string;
    bridgeFees: number;
  };
};
```

### Dependency Relationships
```typescript
type DependencyConnection = {
  type: "depends_on" | "integrates" | "forks_from";
  sourceId: Id<"things">; // dependent protocol
  targetId: Id<"things">; // dependency
  metadata: {
    dependencyType: "oracle" | "liquidity" | "infrastructure" | "codebase";
    critical: boolean;
    version?: string;
    fallback?: string;
  };
};
```

### AI-Specific Connections

#### Compute Provision
Connection between compute providers and AI networks.

```typescript
type ComputeProvisionConnection = {
  type: "provides_compute" | "consumes_compute";
  sourceId: Id<"things">; // node or user
  targetId: Id<"things">; // AI network
  metadata: {
    gpuModel: string;
    computeHours: number;
    utilizationRate: number; // 0-100%
    earnings: string;
    reputationScore: number; // 0-100
    slashingEvents: number;
  };
};
```

#### Model Access
Connection between models and users/agents.

```typescript
type ModelAccessConnection = {
  type: "accesses_model" | "trains_model" | "finetunes_model";
  sourceId: Id<"things">; // user or agent
  targetId: Id<"things">; // AI model NFT
  metadata: {
    accessType: "cycle" | "training" | "finetuning" | "ownership";
    totalCycles: number;
    totalCost: string;
    subscription?: {
      plan: string;
      expiresAt: number;
    };
  };
};
```

#### Data Licensing
Connection between data providers and consumers.

```typescript
type DataLicensingConnection = {
  type: "licenses_data" | "contributes_data";
  sourceId: Id<"things">; // data provider or consumer
  targetId: Id<"things">; // AI data token
  metadata: {
    dataSize: string;
    accessType: "exclusive" | "shared" | "one_time";
    revenue: string;
    usageCount: number;
    qualityRating: number; // 0-100
  };
};
```

#### Agent Coordination
Connection between AI agents.

```typescript
type AgentCoordinationConnection = {
  type: "coordinates_with" | "delegates_to" | "supervises";
  sourceId: Id<"things">; // agent 1
  targetId: Id<"things">; // agent 2
  metadata: {
    protocol: string; // coordination protocol used
    tasksSh ared: number;
    successRate: number; // 0-100%
    trustScore: number; // 0-100
    lastInteraction: number;
  };
};
```

## 5. EVENTS - On-Chain and Off-Chain Activities

### Trading Events
```typescript
type SwapEvent = {
  type: "swap";
  properties: {
    protocol: string;
    pairAddress: string;
    txHash: string;
    blockNumber: number;

    swap: {
      tokenIn: string;
      amountIn: string;
      tokenOut: string;
      amountOut: string;
      price: number;
      slippage: number;
      fee: string;
    };

    trader: {
      address: string;
      isBot: boolean;
      isMEV: boolean;
      profitUSD?: number;
    };
  };
};
```

### Liquidity Events
```typescript
type LiquidityEvent = {
  type: "add_liquidity" | "remove_liquidity";
  properties: {
    pool: string;
    txHash: string;
    provider: string;

    amounts: Array<{
      token: string;
      amount: string;
      valueUSD: number;
    }>;

    shares: {
      minted?: string;
      burned?: string;
      totalSupply: string;
      ownership: number;
    };
  };
};
```

### Token Lifecycle Events
```typescript
type TokenEvent = {
  type: "mint" | "burn" | "transfer" | "approval";
  properties: {
    token: string;
    txHash: string;

    mint?: {
      to: string;
      amount: string;
      totalSupply: string;
    };

    burn?: {
      from: string;
      amount: string;
      reason?: string;
    };

    transfer?: {
      from: string;
      to: string;
      amount: string;
      isWhale: boolean;
    };
  };
};
```

### Governance Events
```typescript
type GovernanceEvent = {
  type: "proposal_created" | "vote_cast" | "proposal_executed";
  properties: {
    protocol: string;
    proposalId: string;

    proposal?: {
      title: string;
      description: string;
      actions: string[];
      proposer: string;
    };

    vote?: {
      voter: string;
      support: boolean;
      weight: string;
      reason?: string;
    };

    execution?: {
      success: boolean;
      changes: string[];
      impact: "low" | "medium" | "high";
    };
  };
};
```

### Security Events
```typescript
type SecurityEvent = {
  type: "exploit" | "rug_pull" | "hack_attempt" | "emergency_pause";
  properties: {
    protocol: string;
    severity: "low" | "medium" | "high" | "critical";

    exploit?: {
      attacker: string;
      method: string;
      lossUSD: number;
      recovered?: number;
    };

    response?: {
      paused: boolean;
      patched: boolean;
      compensated: boolean;
      postMortem?: string;
    };
  };
};
```

### Market Events
```typescript
type MarketEvent = {
  type: "listing" | "delisting" | "price_impact" | "whale_alert";
  properties: {
    token: string;

    listing?: {
      exchange: string;
      pairs: string[];
      marketCap: number;
      initialPrice: number;
    };

    priceImpact?: {
      change: number;
      trigger: string;
      volume: string;
      cascadeLiquidations?: number;
    };

    whaleAlert?: {
      address: string;
      action: "accumulation" | "distribution";
      amount: string;
      percentOfSupply: number;
    };
  };
};
```

### AI-Specific Events

#### Cycle Events
AI model cycle requests and results.

```typescript
type CycleEvent = {
  type: "cycle_request" | "cycle_complete" | "cycle_failed";
  properties: {
    modelId: string;
    userId: string;
    agentId?: string; // if agent-initiated

    request: {
      inputSize: number; // tokens or pixels
      parameters: Record<string, any>;
      priority: "low" | "normal" | "high";
    };

    execution: {
      nodeId?: string;
      duration: number; // milliseconds
      computeUnits: number;
      cost: string; // in tokens
    };

    result?: {
      outputSize: number;
      quality: number; // 0-100
      success: boolean;
      errorMessage?: string;
    };

    verification?: {
      proofHash: string;
      verified: boolean;
    };
  };
};
```

#### Training Events
AI model training activities.

```typescript
type TrainingEvent = {
  type: "training_started" | "training_epoch" | "training_complete" | "training_failed";
  properties: {
    modelId: string;
    trainerId: string;
    datasetId: string;

    configuration: {
      epochs: number;
      batchSize: number;
      learningRate: number;
      architecture: string;
    };

    resources: {
      gpuCount: number;
      gpuModel: string;
      estimatedDuration: number; // hours
      estimatedCost: string;
    };

    progress?: {
      currentEpoch: number;
      loss: number;
      accuracy: number;
      eta: number; // seconds remaining
    };

    result?: {
      finalAccuracy: number;
      finalLoss: number;
      benchmarkScores: Record<string, number>;
      modelHash: string;
      totalCost: string;
    };
  };
};
```

#### Agent Transaction Events
Autonomous agent-to-agent transactions.

```typescript
type AgentTransactionEvent = {
  type: "agent_payment" | "agent_task" | "agent_collaboration";
  properties: {
    sourceAgent: string;
    targetAgent: string;
    txHash: string;

    transaction: {
      amount: string;
      token: string;
      purpose: "service" | "data" | "compute" | "collaboration";
    };

    task?: {
      taskType: string;
      taskId: string;
      status: "pending" | "in_progress" | "completed" | "failed";
      result?: string;
    };

    metadata: {
      coordinationProtocol: string;
      qualityScore?: number; // 0-100
      disputeRaised: boolean;
    };
  };
};
```

#### Data Marketplace Events
AI data trading and licensing.

```typescript
type DataMarketplaceEvent = {
  type: "data_listed" | "data_purchased" | "data_accessed" | "data_rated";
  properties: {
    datasetId: string;
    providerId: string;
    consumerId?: string;

    listing?: {
      price: string;
      licenseType: "exclusive" | "shared" | "subscription";
      dataSize: string;
      dataType: string;
    };

    purchase?: {
      amount: string;
      accessDuration?: number; // seconds
      commercialRights: boolean;
    };

    access?: {
      useCase: string;
      trainingRun: boolean;
      downloaded: boolean;
    };

    rating?: {
      qualityScore: number; // 0-100
      accuracyScore: number;
      biasScore: number;
      review: string;
    };
  };
};
```

#### Compute Network Events
GPU/TPU network activity.

```typescript
type ComputeNetworkEvent = {
  type: "node_joined" | "node_left" | "node_slashed" | "compute_allocated";
  properties: {
    networkId: string;
    nodeId: string;
    operatorId: string;

    node?: {
      gpuModel: string;
      gpuCount: number;
      computeCapacity: string; // TFLOPS
      stakeAmount: string;
    };

    allocation?: {
      taskId: string;
      duration: number;
      utilizationRate: number; // 0-100%
      earnings: string;
    };

    slashing?: {
      reason: "downtime" | "poor_performance" | "fraud";
      penaltyAmount: string;
      reputationImpact: number;
    };

    performance: {
      uptime: number; // percentage
      avgLatency: number; // ms
      reliability: number; // 0-100
    };
  };
};
```

## 6. KNOWLEDGE - Analytics and Intelligence

### Risk Profiles
```typescript
type RiskProfile = {
  tokenId: Id<"things">;

  dimensions: {
    technical: {
      contractRisk: 0-100;
      upgradeabilityRisk: 0-100;
      dependencyRisk: 0-100;
      oracleRisk: 0-100;
    };

    market: {
      liquidityRisk: 0-100;
      volatilityRisk: 0-100;
      concentrationRisk: 0-100;
      manipulationRisk: 0-100;
    };

    fundamental: {
      teamRisk: 0-100;
      tokenomicsRisk: 0-100;
      regulatoryRisk: 0-100;
      competitionRisk: 0-100;
    };
  };

  signals: {
    redFlags: string[];
    yellowFlags: string[];
    strengthIndicators: string[];
  };

  comparables: Array<{
    tokenId: Id<"things">;
    similarity: 0-1;
    metrics: Record<string, number>;
  }>;

  prediction: {
    shortTerm: "bullish" | "neutral" | "bearish";
    longTerm: "bullish" | "neutral" | "bearish";
    confidence: 0-1;
  };
};
```

### Trading Patterns
```typescript
type TradingPattern = {
  pattern: "accumulation" | "distribution" | "wash_trading" | "pump_dump";

  detection: {
    addresses: string[];
    timeframe: number;
    volume: string;
    transactions: number;
  };

  indicators: {
    volumeAnomaly: number;
    priceDeviation: number;
    walletClustering: number;
    timingCorrelation: number;
  };

  confidence: 0-1;
  lastDetected: number;
};
```

### Protocol Analytics
```typescript
type ProtocolAnalytics = {
  protocolId: Id<"things">;

  metrics: {
    tvl: string;
    tvlChange24h: number;
    revenue24h: string;
    fees24h: string;

    users: {
      daily: number;
      weekly: number;
      monthly: number;
      retention: number;
    };

    efficiency: {
      capitalEfficiency: number;
      gasEfficiency: number;
      yieldEfficiency: number;
    };
  };

  growth: {
    userGrowth: number;
    tvlGrowth: number;
    revenueGrowth: number;
    trend: "growing" | "stable" | "declining";
  };

  moat: {
    networkEffects: 0-100;
    switchingCosts: 0-100;
    brandStrength: 0-100;
    technicalAdvantage: 0-100;
  };
};
```

### On-Chain Behaviors
```typescript
type OnChainBehavior = {
  address: string;

  profile: {
    type: "trader" | "farmer" | "holder" | "bot" | "protocol";
    experience: "novice" | "intermediate" | "advanced" | "professional";
    volume30d: string;
    profitability: number;
  };

  patterns: {
    tradingStyle: "scalper" | "swing" | "momentum" | "arbitrage" | "long_term";
    riskAppetite: "conservative" | "moderate" | "aggressive";
    preferredTokens: string[];
    preferredProtocols: string[];
  };

  timing: {
    activeHours: number[]; // UTC hours
    avgHoldTime: number;
    reactionSpeed: number; // seconds after events
  };

  influence: {
    followersCount: number;
    copyTraders: string[];
    impactScore: 0-100;
  };
};
```

## Relationships Between Dimensions

### Cross-Dimension Patterns

```
Group (DAO)
  → owns → Things (Treasury Tokens)
  → governs → Things (Protocol Contracts)
  → creates → Events (Governance Proposals)
  → generates → Knowledge (Protocol Analytics)

People (Whale)
  → holds → Things (Tokens)
  → provides → Connections (Liquidity)
  → triggers → Events (Whale Alerts)
  → exhibits → Knowledge (Trading Patterns)

Things (Token)
  → listed_on → Things (DEX Pool)
  → backed_by → Things (Collateral)
  → generates → Events (Transfers, Mints)
  → analyzed_by → Knowledge (Risk Profile)
```

## Query Patterns

### Find High-Risk Tokens
```
Things (Token)
  → Knowledge (Risk Profile)
  WHERE risk.score > 80
  AND market.liquidity < $100k
```

### Identify Smart Money
```
People (Holders)
  → Knowledge (OnChainBehavior)
  WHERE profile.profitability > 0.8
  AND influence.impactScore > 70
```

### Track Protocol Dependencies
```
Things (Protocol)
  → Connections (depends_on)
  → Things (Dependencies)
  WHERE dependency.critical = true
```

### Monitor Governance Activity
```
Groups (DAO)
  → Events (Governance)
  WHERE proposal.impact = "high"
  AND vote.participation > 50%
```

## Implementation Guidelines

### 1. Entity Granularity
- Each token deployment is a separate Thing
- Cross-chain tokens connected via bridge relationships
- Liquidity pools are Things, not just Connections

### 2. Event Temporality
- All Events must have blockNumber or timestamp
- Use Events for state changes, not current state
- Archive old Events to maintain performance

### 3. Knowledge Indexing
- Vector embeddings for similar token discovery
- Time-series data for trend analysis
- Graph algorithms for dependency mapping

### 4. Security Considerations
- Never store private keys in any dimension
- Validate all on-chain data against multiple sources
- Implement rate limiting for external API calls

## Extension Points

This ontology can be extended with:

1. **MEV Analysis**: Sandwich attacks, arbitrage patterns
2. **NFT Gaming**: Game assets, breeding, evolution
3. **RWA Tokenization**: Real-world asset mappings
4. **Privacy Protocols**: ZK proofs, mixing patterns
5. **Cross-Chain Messaging**: Layer 0 protocols
6. **Derivatives**: Options, futures, perpetuals
7. **Social Tokens**: Creator coins, community tokens
8. **Prediction Markets**: Outcome tokens, oracle disputes

## Version History

- **v1.0.0** (2025-11-03): Initial crypto ontology extending 6-dimensions
  - Complete token and contract modeling
  - DeFi protocol patterns
  - On-chain analytics framework
  - Risk scoring methodology

---

**Note**: This ontology provides the conceptual framework. Actual implementation requires appropriate blockchain indexing infrastructure, real-time data feeds, and security measures for handling crypto assets.