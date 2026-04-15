/**
 * ONE Contract SDK
 * 
 * TypeScript SDK for interacting with the ONE Universal Smart Contract on Sui.
 * This integrates with the ONE Platform's ontology and Effect.ts patterns.
 */

import { Effect, Context, Layer } from "effect";
import { SuiClient } from "@mysten/sui/client";
import type { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

// ============================================================
// ENTITY TYPES - Must match Move constants
// ============================================================

export const EntityType = {
  PRODUCT: 1,
  SUBSCRIPTION: 2,
  LESSON: 3,
  MEMBERSHIP: 4,
  CREDENTIAL: 5,
  TOKEN: 6,
  NFT: 7,
  ACCESS_PASS: 8,
  EVENT_TICKET: 9,
  DIGITAL_GOOD: 10,
  SERVICE: 11,
  LICENSE: 12,
} as const;

export type EntityTypeValue = (typeof EntityType)[keyof typeof EntityType];

// ============================================================
// TYPES
// ============================================================

export interface ONEContractConfig {
  packageId: string;
  registryId: string;
  network: "mainnet" | "testnet" | "devnet";
}

export interface CreateMerchantParams {
  name: string;
  metadata: Record<string, unknown>;
}

export interface CreateEntityParams {
  merchantId: string;
  entityType: EntityTypeValue;
  name: string;
  description: string;
  price: bigint; // in MIST (1 SUI = 1_000_000_000 MIST)
  maxSupply: bigint; // 0 = unlimited
  metadata: Record<string, unknown>;
}

export interface PurchaseEntityParams {
  merchantId: string;
  entityId: string;
  paymentCoinId: string;
  expiresInMs: bigint; // 0 = permanent, >0 = subscription duration
}

export interface ListForSaleParams {
  ownershipId: string;
  price: bigint;
}

export interface Merchant {
  id: string;
  name: string;
  wallet: string;
  totalSales: bigint;
  entityCount: bigint;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: bigint;
}

export interface Entity {
  id: string;
  entityType: EntityTypeValue;
  name: string;
  description: string;
  price: bigint;
  merchantId: string;
  isActive: boolean;
  maxSupply: bigint;
  currentSupply: bigint;
  metadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface Ownership {
  id: string;
  entityId: string;
  entityType: EntityTypeValue;
  entityName: string;
  owner: string;
  acquiredAt: bigint;
  expiresAt: bigint;
  pricePaid: bigint;
  metadata: Record<string, unknown>;
}

// ============================================================
// ERRORS
// ============================================================

export class ONEContractError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "ONEContractError";
  }
}

// ============================================================
// SERVICE - Effect.ts Pattern
// ============================================================

export interface ONEContractService {
  readonly config: ONEContractConfig;
  
  // Merchant operations
  registerMerchant: (
    params: CreateMerchantParams
  ) => Effect.Effect<SuiTransactionBlockResponse, ONEContractError>;
  
  getMerchant: (
    merchantId: string
  ) => Effect.Effect<Merchant, ONEContractError>;
  
  // Entity operations
  createEntity: (
    params: CreateEntityParams
  ) => Effect.Effect<SuiTransactionBlockResponse, ONEContractError>;
  
  getEntity: (
    entityId: string
  ) => Effect.Effect<Entity, ONEContractError>;
  
  purchaseEntity: (
    params: PurchaseEntityParams
  ) => Effect.Effect<SuiTransactionBlockResponse, ONEContractError>;
  
  // Ownership operations
  getOwnerships: (
    owner: string
  ) => Effect.Effect<Ownership[], ONEContractError>;
  
  isOwnershipValid: (
    ownershipId: string
  ) => Effect.Effect<boolean, ONEContractError>;
  
  // Market operations
  listForSale: (
    params: ListForSaleParams
  ) => Effect.Effect<SuiTransactionBlockResponse, ONEContractError>;
  
  // Convenience methods
  createProduct: (
    params: Omit<CreateEntityParams, "entityType">
  ) => Effect.Effect<SuiTransactionBlockResponse, ONEContractError>;
  
  createSubscription: (
    params: Omit<CreateEntityParams, "entityType">
  ) => Effect.Effect<SuiTransactionBlockResponse, ONEContractError>;
  
  createLesson: (
    params: Omit<CreateEntityParams, "entityType">
  ) => Effect.Effect<SuiTransactionBlockResponse, ONEContractError>;
  
  createEventTicket: (
    params: Omit<CreateEntityParams, "entityType">
  ) => Effect.Effect<SuiTransactionBlockResponse, ONEContractError>;
}

export const ONEContractService = Context.GenericTag<ONEContractService>(
  "ONEContractService"
);

// ============================================================
// IMPLEMENTATION
// ============================================================

const makeONEContractService = (
  suiClient: SuiClient,
  config: ONEContractConfig,
  signer: { signAndExecuteTransaction: (tx: Transaction) => Promise<SuiTransactionBlockResponse> }
): ONEContractService => {
  
  const buildTx = () => new Transaction();
  
  return {
    config,
    
    registerMerchant: (params) =>
      Effect.tryPromise({
        try: async () => {
          const tx = buildTx();
          tx.moveCall({
            target: `${config.packageId}::one::register_merchant`,
            arguments: [
              tx.object(config.registryId),
              tx.pure.string(params.name),
              tx.pure.string(JSON.stringify(params.metadata)),
              tx.object("0x6"), // Clock object
            ],
          });
          return signer.signAndExecuteTransaction(tx);
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to register merchant: ${error}`,
            "REGISTER_MERCHANT_FAILED"
          ),
      }),
    
    getMerchant: (merchantId) =>
      Effect.tryPromise({
        try: async () => {
          const obj = await suiClient.getObject({
            id: merchantId,
            options: { showContent: true },
          });
          
          if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
            throw new Error("Invalid merchant object");
          }
          
          const fields = obj.data.content.fields as Record<string, unknown>;
          return {
            id: merchantId,
            name: fields.name as string,
            wallet: fields.wallet as string,
            totalSales: BigInt(fields.total_sales as string),
            entityCount: BigInt(fields.entity_count as string),
            isActive: fields.is_active as boolean,
            metadata: JSON.parse(fields.metadata as string),
            createdAt: BigInt(fields.created_at as string),
          };
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to get merchant: ${error}`,
            "GET_MERCHANT_FAILED"
          ),
      }),
    
    createEntity: (params) =>
      Effect.tryPromise({
        try: async () => {
          const tx = buildTx();
          tx.moveCall({
            target: `${config.packageId}::one::create_entity`,
            arguments: [
              tx.object(params.merchantId),
              tx.object(params.merchantId + "_cap"), // MerchantCap
              tx.pure.u8(params.entityType),
              tx.pure.string(params.name),
              tx.pure.string(params.description),
              tx.pure.u64(params.price),
              tx.pure.u64(params.maxSupply),
              tx.pure.string(JSON.stringify(params.metadata)),
              tx.object("0x6"), // Clock
            ],
          });
          return signer.signAndExecuteTransaction(tx);
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to create entity: ${error}`,
            "CREATE_ENTITY_FAILED"
          ),
      }),
    
    getEntity: (entityId) =>
      Effect.tryPromise({
        try: async () => {
          const obj = await suiClient.getObject({
            id: entityId,
            options: { showContent: true },
          });
          
          if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
            throw new Error("Invalid entity object");
          }
          
          const fields = obj.data.content.fields as Record<string, unknown>;
          return {
            id: entityId,
            entityType: fields.entity_type as EntityTypeValue,
            name: fields.name as string,
            description: fields.description as string,
            price: BigInt(fields.price as string),
            merchantId: fields.merchant_id as string,
            isActive: fields.is_active as boolean,
            maxSupply: BigInt(fields.max_supply as string),
            currentSupply: BigInt(fields.current_supply as string),
            metadata: JSON.parse(fields.metadata as string),
            createdAt: BigInt(fields.created_at as string),
            updatedAt: BigInt(fields.updated_at as string),
          };
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to get entity: ${error}`,
            "GET_ENTITY_FAILED"
          ),
      }),
    
    purchaseEntity: (params) =>
      Effect.tryPromise({
        try: async () => {
          const tx = buildTx();
          tx.moveCall({
            target: `${config.packageId}::one::purchase_entity`,
            arguments: [
              tx.object(config.registryId),
              tx.object(params.merchantId),
              tx.object(params.entityId),
              tx.object(params.paymentCoinId),
              tx.pure.u64(params.expiresInMs),
              tx.object("0x6"), // Clock
            ],
          });
          return signer.signAndExecuteTransaction(tx);
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to purchase entity: ${error}`,
            "PURCHASE_ENTITY_FAILED"
          ),
      }),
    
    getOwnerships: (owner) =>
      Effect.tryPromise({
        try: async () => {
          const objects = await suiClient.getOwnedObjects({
            owner,
            filter: {
              StructType: `${config.packageId}::one::Ownership`,
            },
            options: { showContent: true },
          });
          
          return objects.data.map((obj) => {
            if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
              throw new Error("Invalid ownership object");
            }
            const fields = obj.data.content.fields as Record<string, unknown>;
            return {
              id: obj.data.objectId,
              entityId: fields.entity_id as string,
              entityType: fields.entity_type as EntityTypeValue,
              entityName: fields.entity_name as string,
              owner: fields.owner as string,
              acquiredAt: BigInt(fields.acquired_at as string),
              expiresAt: BigInt(fields.expires_at as string),
              pricePaid: BigInt(fields.price_paid as string),
              metadata: JSON.parse(fields.metadata as string),
            };
          });
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to get ownerships: ${error}`,
            "GET_OWNERSHIPS_FAILED"
          ),
      }),
    
    isOwnershipValid: (ownershipId) =>
      Effect.tryPromise({
        try: async () => {
          const obj = await suiClient.getObject({
            id: ownershipId,
            options: { showContent: true },
          });
          
          if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
            throw new Error("Invalid ownership object");
          }
          
          const fields = obj.data.content.fields as Record<string, unknown>;
          const expiresAt = BigInt(fields.expires_at as string);
          
          if (expiresAt === 0n) return true; // Permanent ownership
          return Date.now() < Number(expiresAt);
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to check ownership: ${error}`,
            "CHECK_OWNERSHIP_FAILED"
          ),
      }),
    
    listForSale: (params) =>
      Effect.tryPromise({
        try: async () => {
          const tx = buildTx();
          tx.moveCall({
            target: `${config.packageId}::market::list_for_sale`,
            arguments: [
              tx.object(params.ownershipId),
              tx.pure.u64(params.price),
              tx.object("0x6"), // Clock
            ],
          });
          return signer.signAndExecuteTransaction(tx);
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to list for sale: ${error}`,
            "LIST_FOR_SALE_FAILED"
          ),
      }),
    
    // Convenience methods
    createProduct: (params) =>
      Effect.tryPromise({
        try: async () => {
          const tx = buildTx();
          tx.moveCall({
            target: `${config.packageId}::one::create_product`,
            arguments: [
              tx.object(params.merchantId),
              tx.object(params.merchantId + "_cap"),
              tx.pure.string(params.name),
              tx.pure.string(params.description),
              tx.pure.u64(params.price),
              tx.pure.u64(params.maxSupply),
              tx.pure.string(JSON.stringify(params.metadata)),
              tx.object("0x6"),
            ],
          });
          return signer.signAndExecuteTransaction(tx);
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to create product: ${error}`,
            "CREATE_PRODUCT_FAILED"
          ),
      }),
    
    createSubscription: (params) =>
      Effect.tryPromise({
        try: async () => {
          const tx = buildTx();
          tx.moveCall({
            target: `${config.packageId}::one::create_subscription`,
            arguments: [
              tx.object(params.merchantId),
              tx.object(params.merchantId + "_cap"),
              tx.pure.string(params.name),
              tx.pure.string(params.description),
              tx.pure.u64(params.price),
              tx.pure.string(JSON.stringify(params.metadata)),
              tx.object("0x6"),
            ],
          });
          return signer.signAndExecuteTransaction(tx);
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to create subscription: ${error}`,
            "CREATE_SUBSCRIPTION_FAILED"
          ),
      }),
    
    createLesson: (params) =>
      Effect.tryPromise({
        try: async () => {
          const tx = buildTx();
          tx.moveCall({
            target: `${config.packageId}::one::create_lesson`,
            arguments: [
              tx.object(params.merchantId),
              tx.object(params.merchantId + "_cap"),
              tx.pure.string(params.name),
              tx.pure.string(params.description),
              tx.pure.u64(params.price),
              tx.pure.u64(params.maxSupply),
              tx.pure.string(JSON.stringify(params.metadata)),
              tx.object("0x6"),
            ],
          });
          return signer.signAndExecuteTransaction(tx);
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to create lesson: ${error}`,
            "CREATE_LESSON_FAILED"
          ),
      }),
    
    createEventTicket: (params) =>
      Effect.tryPromise({
        try: async () => {
          const tx = buildTx();
          tx.moveCall({
            target: `${config.packageId}::one::create_event_ticket`,
            arguments: [
              tx.object(params.merchantId),
              tx.object(params.merchantId + "_cap"),
              tx.pure.string(params.name),
              tx.pure.string(params.description),
              tx.pure.u64(params.price),
              tx.pure.u64(params.maxSupply),
              tx.pure.string(JSON.stringify(params.metadata)),
              tx.object("0x6"),
            ],
          });
          return signer.signAndExecuteTransaction(tx);
        },
        catch: (error) =>
          new ONEContractError(
            `Failed to create event ticket: ${error}`,
            "CREATE_EVENT_TICKET_FAILED"
          ),
      }),
  };
};

// ============================================================
// LAYER - Effect.ts Pattern
// ============================================================

export const ONEContractServiceLive = (
  suiClient: SuiClient,
  config: ONEContractConfig,
  signer: { signAndExecuteTransaction: (tx: Transaction) => Promise<SuiTransactionBlockResponse> }
) =>
  Layer.succeed(
    ONEContractService,
    makeONEContractService(suiClient, config, signer)
  );

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/** Convert SUI to MIST */
export const suiToMist = (sui: number): bigint => BigInt(sui * 1_000_000_000);

/** Convert MIST to SUI */
export const mistToSui = (mist: bigint): number => Number(mist) / 1_000_000_000;

/** Get entity type name */
export const getEntityTypeName = (type: EntityTypeValue): string => {
  const names: Record<EntityTypeValue, string> = {
    1: "Product",
    2: "Subscription",
    3: "Lesson",
    4: "Membership",
    5: "Credential",
    6: "Token",
    7: "NFT",
    8: "Access Pass",
    9: "Event Ticket",
    10: "Digital Good",
    11: "Service",
    12: "License",
  };
  return names[type] || "Unknown";
};

/** Calculate subscription duration in milliseconds */
export const subscriptionDuration = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};
