// ENG-004: PromiseTracker.ts - Tracks promise state for envelope execution

import type { AgentPromise } from "./types";

/**
 * PromiseTracker - Manages the lifecycle of promises associated with envelopes
 * Tracks pending, resolved, and rejected states
 */
export class PromiseTracker {
  private promises: Map<string, AgentPromise>;

  constructor() {
    this.promises = new Map();
  }

  /**
   * Create a new promise for an envelope
   * @param envelopeId - The ID of the envelope this promise tracks
   * @param label - Human-readable label for the promise
   * @returns The created AgentPromise
   */
  create(envelopeId: string, label: string): AgentPromise {
    const promise: AgentPromise = {
      id: `p-${crypto.randomUUID().slice(0, 6)}`,
      label,
      status: "pending",
      envelope: envelopeId,
    };

    this.promises.set(promise.id, promise);
    return promise;
  }

  /**
   * Resolve a promise with a result
   * @param promiseId - The ID of the promise to resolve
   * @param result - The result value
   */
  resolve(promiseId: string, result: unknown): void {
    const promise = this.promises.get(promiseId);
    if (promise) {
      promise.status = "resolved";
      promise.result = result;
    }
  }

  /**
   * Reject a promise
   * @param promiseId - The ID of the promise to reject
   */
  reject(promiseId: string): void {
    const promise = this.promises.get(promiseId);
    if (promise) {
      promise.status = "rejected";
    }
  }

  /**
   * Get a specific promise by ID
   * @param promiseId - The ID of the promise to get
   * @returns The AgentPromise or undefined
   */
  get(promiseId: string): AgentPromise | undefined {
    return this.promises.get(promiseId);
  }

  /**
   * Get all tracked promises
   * @returns Array of all AgentPromise objects
   */
  getAll(): AgentPromise[] {
    return Array.from(this.promises.values());
  }

  /**
   * Get promises by status
   * @param status - The status to filter by
   * @returns Array of matching AgentPromise objects
   */
  getByStatus(status: AgentPromise["status"]): AgentPromise[] {
    return this.getAll().filter(p => p.status === status);
  }

  /**
   * Clear all promises
   */
  clear(): void {
    this.promises.clear();
  }
}
