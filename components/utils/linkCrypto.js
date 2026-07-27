import CryptoJS from "crypto-js";

// Shared secret used to encrypt the company Users URL into an API key.
// IMPORTANT: This MUST match the exact same secret used by the mobile app
// (apexflowERPMobileApp/cbass-ai/constants/config.ts -> LINK_SECRET).
export const LINK_SECRET = "change-me-to-match-web-admin-secret";

/**
 * Encrypts a link/URL into an opaque API key string using AES.
 * The mobile app decrypts this key back into the same URL.
 */
export function encryptLink(url) {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  return CryptoJS.AES.encrypt(trimmed, LINK_SECRET).toString();
}

/**
 * Decrypts a key string back into the original URL.
 * Returns "" if it cannot decrypt.
 */
export function decryptLink(key) {
  const trimmed = (key || "").trim();
  if (!trimmed) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(trimmed, LINK_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8).trim();
  } catch {
    return "";
  }
}
