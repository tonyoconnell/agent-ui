// ENG-002: Envelope.ts - Factory function to create envelopes with unique IDs

import type { Envelope } from "./types";

/**
 * Parameters for creating a new envelope
 */
export interface CreateEnvelopeParams {
  action: string;
  inputs: Record<string, unknown>;
  sender: string;
  receiver: string;
  callback?: Envelope | null;
  parentEnvelope?: string;
}

/**
 * Creates a new envelope with a unique ID
 * @param params - The envelope parameters
 * @returns A new Envelope instance
 */
export function createEnvelope(params: CreateEnvelopeParams): Envelope {
  const id = `env-${crypto.randomUUID().slice(0, 8)}`;

  return {
    id,
    env: {
      envelope: id,
      action: params.action,
      inputs: params.inputs,
    },
    payload: {
      status: "pending",
      results: null,
    },
    callback: params.callback ?? null,
    metadata: {
      sender: params.sender,
      receiver: params.receiver,
      timestamp: Date.now(),
      parentEnvelope: params.parentEnvelope,
    },
  };
}

/**
 * Validates an envelope has required fields
 * @param envelope - The envelope to validate
 * @returns true if valid, throws if invalid
 */
export function validateEnvelope(envelope: Envelope): boolean {
  if (!envelope.id) {
    throw new Error("Envelope must have an id");
  }
  if (!envelope.env?.action) {
    throw new Error("Envelope must have an action");
  }
  if (!envelope.metadata?.receiver) {
    throw new Error("Envelope must have a receiver");
  }
  return true;
}
