/**
 * Security utilities for handling sensitive data
 *
 * IMPORTANT: This provides basic obfuscation for browser storage.
 * For production apps with high security requirements, consider:
 * - Server-side session storage
 * - Encrypted tokens with short expiration
 * - OAuth flows instead of API key storage
 */

/**
 * Simple obfuscation for localStorage (NOT encryption)
 * This prevents casual inspection but is not cryptographically secure
 */
function obfuscate(value: string): string {
	if (!value) return "";

	// Base64 encode with a simple XOR operation
	const key = "ONE-PLATFORM-2025";
	let result = "";

	for (let i = 0; i < value.length; i++) {
		result += String.fromCharCode(
			value.charCodeAt(i) ^ key.charCodeAt(i % key.length),
		);
	}

	return btoa(result);
}

/**
 * Reverse obfuscation
 */
function deobfuscate(value: string): string {
	if (!value) return "";

	try {
		const decoded = atob(value);
		const key = "ONE-PLATFORM-2025";
		let result = "";

		for (let i = 0; i < decoded.length; i++) {
			result += String.fromCharCode(
				decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length),
			);
		}

		return result;
	} catch {
		// If deobfuscation fails, return empty string
		return "";
	}
}

/**
 * Securely store a sensitive value in localStorage
 */
export function secureSetItem(key: string, value: string): void {
	if (typeof window === "undefined") return;

	const obfuscated = obfuscate(value);
	localStorage.setItem(key, obfuscated);
}

/**
 * Securely retrieve a sensitive value from localStorage
 */
export function secureGetItem(key: string): string | null {
	if (typeof window === "undefined") return null;

	const obfuscated = localStorage.getItem(key);
	if (!obfuscated) return null;

	return deobfuscate(obfuscated);
}

/**
 * Securely remove a sensitive value from localStorage
 */
export function secureRemoveItem(key: string): void {
	if (typeof window === "undefined") return;

	localStorage.removeItem(key);
}

/**
 * Sanitize URL to prevent XSS attacks
 * Only allows http:// and https:// protocols
 */
export function sanitizeUrl(
	url: string | undefined | null,
): string | undefined {
	if (!url) return undefined;

	try {
		const parsed = new URL(url);

		// Only allow http and https protocols
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			console.warn("Blocked non-HTTP(S) URL:", url);
			return undefined;
		}

		return parsed.toString();
	} catch {
		// Invalid URL
		console.warn("Invalid URL blocked:", url);
		return undefined;
	}
}

/**
 * Mask sensitive string for logging (shows only first/last chars)
 */
export function maskSensitive(value: string, showChars: number = 4): string {
	if (!value || value.length <= showChars * 2) {
		return "***";
	}

	const start = value.substring(0, showChars);
	const end = value.substring(value.length - showChars);

	return `${start}...${end}`;
}
