/**
 * Validation utilities for CodeDev Network
 */

/**
 * Validates whether a given string is a valid LinkedIn profile URL.
 * Accepts formats:
 * - https://www.linkedin.com/in/username
 * - https://linkedin.com/in/username
 * - http://in.linkedin.com/in/username
 * - linkedin.com/in/username
 * - www.linkedin.com/in/username
 */
export const isValidLinkedInUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const withProto =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase();
    const isLinkedInHost =
      host === "linkedin.com" ||
      host === "www.linkedin.com" ||
      host.endsWith(".linkedin.com");
    return isLinkedInHost && parsed.pathname.length > 2;
  } catch {
    return false;
  }
};
