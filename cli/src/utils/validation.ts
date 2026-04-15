/**
 * Validation utilities for CLI
 */

/**
 * Validates email address format
 * @param email Email address to validate
 * @returns True if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Validates URL format
 * @param url URL to validate
 * @returns True if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Generates a URL-safe slug from a string
 * @param text Text to slugify
 * @returns URL-safe slug (lowercase, hyphens)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Reserved names that cannot be used by customers
 */
export const RESERVED_NAMES = {
  name: ["one"],
  folder: ["onegroup", "one"],
  website: ["https://one.ie", "http://one.ie", "one.ie", "www.one.ie"],
} as const;

/**
 * Validates that organization name is not reserved
 * @param name Organization name to validate
 * @returns True if valid (not reserved), false if reserved
 */
export function isReservedName(name: string): boolean {
  const normalized = name.toLowerCase().trim();
  return (RESERVED_NAMES.name as readonly string[]).includes(normalized);
}

/**
 * Validates that folder name is not reserved
 * @param folder Folder name to validate
 * @returns True if reserved, false if valid
 */
export function isReservedFolder(folder: string): boolean {
  const normalized = folder.toLowerCase().trim();
  return (RESERVED_NAMES.folder as readonly string[]).includes(normalized);
}

/**
 * Validates that website URL is not reserved
 * @param website Website URL to validate
 * @returns True if reserved, false if valid
 */
export function isReservedWebsite(website: string): boolean {
  const normalized = website.toLowerCase().trim().replace(/\/$/, "");
  return RESERVED_NAMES.website.some((reserved) =>
    normalized.includes(reserved.replace(/^https?:\/\//, ""))
  );
}
