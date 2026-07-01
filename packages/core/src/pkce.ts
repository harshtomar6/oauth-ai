import type { PKCEPair } from "./types.js";

/**
 * Resolve a Web Crypto implementation. Works in the browser, Node 18+,
 * Edge/Workers, and Deno without a polyfill.
 */
function getCrypto(): Crypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) {
    throw new Error(
      "Web Crypto API is unavailable. Use Node 18+, a browser, or an edge runtime.",
    );
  }
  return c;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  // `btoa` is available in Node 18+, browsers, and edge runtimes.
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  return bytes;
}

/** Generate a random, URL-safe opaque string (for `state`, verifiers, etc.). */
export function randomString(byteLength = 32): string {
  return base64UrlEncode(randomBytes(byteLength));
}

/** Alias for `randomString`, for use as an OAuth `state` anti-CSRF token. */
export function randomState(byteLength = 16): string {
  return randomString(byteLength);
}

/**
 * Generate a PKCE code verifier + S256 challenge.
 * The verifier must be stored server-side (e.g. in a signed cookie/session)
 * until the callback, where it is sent to the token endpoint.
 */
export async function generatePKCE(): Promise<PKCEPair> {
  const codeVerifier = randomString(32);
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await getCrypto().subtle.digest("SHA-256", data);
  const codeChallenge = base64UrlEncode(new Uint8Array(digest));
  return { codeVerifier, codeChallenge, method: "S256" };
}
