import { describe, expect, it } from "vitest";
import { generatePKCE, randomState, randomString } from "./pkce.js";

const URL_SAFE = /^[A-Za-z0-9\-_]+$/;

describe("randomString", () => {
  it("is URL-safe and has no base64 padding", () => {
    const s = randomString();
    expect(s).toMatch(URL_SAFE);
    expect(s).not.toContain("=");
  });

  it("produces distinct values", () => {
    const values = new Set(Array.from({ length: 100 }, () => randomString()));
    expect(values.size).toBe(100);
  });

  it("respects byte length (longer input => longer output)", () => {
    expect(randomString(8).length).toBeLessThan(randomString(64).length);
  });
});

describe("randomState", () => {
  it("returns a URL-safe token", () => {
    expect(randomState()).toMatch(URL_SAFE);
  });
});

describe("generatePKCE", () => {
  it("returns an S256 verifier/challenge pair", async () => {
    const pkce = await generatePKCE();
    expect(pkce.method).toBe("S256");
    expect(pkce.codeVerifier).toMatch(URL_SAFE);
    expect(pkce.codeChallenge).toMatch(URL_SAFE);
  });

  it("produces a 43-char base64url SHA-256 challenge", async () => {
    const { codeChallenge } = await generatePKCE();
    // SHA-256 => 32 bytes => 43 base64url chars (no padding).
    expect(codeChallenge).toHaveLength(43);
  });

  it("derives a challenge that matches the verifier's SHA-256", async () => {
    const { codeVerifier, codeChallenge } = await generatePKCE();
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(codeVerifier),
    );
    const expected = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(codeChallenge).toBe(expected);
  });

  it("is non-deterministic across calls", async () => {
    const a = await generatePKCE();
    const b = await generatePKCE();
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
  });
});
