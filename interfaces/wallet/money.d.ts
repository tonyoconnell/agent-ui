/**
 * Money Formatting & Address Resolution (wallet-v2)
 *
 * Contract: money formatting + address resolution.
 * User sees dollars, not SUI. No raw addresses without a tap.
 *
 * Primary display: dollars via formatUsd()
 * Under-disclosure: SUI amount via formatSui()
 * Address handling: human-readable names via resolveAddress()
 * Validation: isValidAddress() for Sui hex addresses
 */

import type { SuiAddress } from "../types-sui"

/**
 * Format SUI balance as dollars (primary display).
 *
 * Converts MIST (smallest SUI unit) to USD using provided rate.
 * Returns formatted string with currency symbol, e.g., "$1,234.56".
 *
 * @param suiAmount - Balance in MIST (1 SUI = 10^9 MIST)
 * @param suiPriceUsd - Current SUI price in USD
 * @returns Formatted USD string, e.g., "$1,234.56"
 */
export declare function formatUsd(suiAmount: bigint, suiPriceUsd: number): string

/**
 * Format SUI amount with units (under-disclosure display).
 *
 * Shows raw SUI amount with units for users who opt in to raw chain values.
 * Returns formatted string, e.g., "1.234567890 SUI".
 *
 * @param suiAmount - Amount in MIST (1 SUI = 10^9 MIST)
 * @returns Formatted SUI string with units
 */
export declare function formatSui(suiAmount: bigint): string

/**
 * Rebuild human-readable tx summary from raw bytes.
 *
 * Parses transaction bytes into a readable summary.
 * Excludes low-level details (epoch, signature type).
 * Returns structured summary suitable for user display.
 *
 * @param txBytes - Raw serialized transaction bytes
 * @returns Promise resolving to human-readable transaction summary
 */
export declare function summarizeTx(txBytes: Uint8Array): Promise<string>

/**
 * Resolve address/SuiNS handle to display name.
 *
 * Attempts to resolve SUI address to a human-readable name via SuiNS.
 * Falls back to shortened address (0x1234...abcd) if no name found.
 *
 * @param addr - SUI address to resolve
 * @returns Promise resolving to display name or shortened address
 */
export declare function resolveAddress(addr: SuiAddress): Promise<string>

/**
 * Validate a Sui address format.
 *
 * Checks if string is a valid Sui address:
 * - Hex characters only
 * - 32 bytes when decoded
 * - 0x-prefixed
 *
 * Type guard: narrows type to SuiAddress on success.
 *
 * @param s - String to validate
 * @returns true if valid SUI address, false otherwise
 */
export declare function isValidAddress(s: string): s is SuiAddress

/**
 * STATE 1 CAP — Max balance for unprotected wallet.
 *
 * Upper limit in MIST for State 1 (unprotected, mobile device only).
 * Approximately $20 USD equivalent at typical SUI market prices.
 * Prevents excessive capital exposure before biometric + SE protection engages.
 *
 * State lifecycle:
 * - State 1: Device only, no passkey, capped at STATE1_CAP_MIST
 * - State 2+: Passkey protected, paper break-glass, cap lifted
 */
export declare const STATE1_CAP_MIST: bigint
