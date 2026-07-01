import { describe, expect, it, vi } from "vitest";
import {
  defineProvider,
  isExpired,
  normalizeTokenResponse,
} from "./provider.js";

describe("defineProvider", () => {
  it("applies defaults for scopes and PKCE", () => {
    const p = defineProvider({
      id: "x",
      name: "X",
      authorizeUrl: "https://x/authorize",
      tokenUrl: "https://x/token",
      clientId: "cid",
    });
    expect(p.usePKCE).toBe(true);
    expect(p.defaultScopes).toEqual([]);
  });

  it("does not override explicitly provided values", () => {
    const p = defineProvider({
      id: "x",
      name: "X",
      authorizeUrl: "https://x/authorize",
      tokenUrl: "https://x/token",
      clientId: "cid",
      usePKCE: false,
      defaultScopes: ["a", "b"],
    });
    expect(p.usePKCE).toBe(false);
    expect(p.defaultScopes).toEqual(["a", "b"]);
  });
});

describe("normalizeTokenResponse", () => {
  it("maps snake_case fields and computes expiresAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const tokens = normalizeTokenResponse({
      access_token: "at",
      refresh_token: "rt",
      expires_in: 3600,
      token_type: "Bearer",
      scope: "a b",
      id_token: "idt",
    });
    expect(tokens.accessToken).toBe("at");
    expect(tokens.refreshToken).toBe("rt");
    expect(tokens.tokenType).toBe("Bearer");
    expect(tokens.scope).toBe("a b");
    expect(tokens.idToken).toBe("idt");
    expect(tokens.expiresAt).toBe(Date.parse("2026-01-01T01:00:00Z"));
    expect(tokens.raw).toMatchObject({ access_token: "at" });
    vi.useRealTimers();
  });

  it("omits optional fields when absent", () => {
    const tokens = normalizeTokenResponse({ access_token: "at" });
    expect(tokens.refreshToken).toBeUndefined();
    expect(tokens.expiresAt).toBeUndefined();
    expect(tokens.tokenType).toBeUndefined();
  });

  it("throws when access_token is missing or non-string", () => {
    expect(() => normalizeTokenResponse({})).toThrow(/access_token/);
    expect(() => normalizeTokenResponse({ access_token: 123 })).toThrow(
      /access_token/,
    );
  });
});

describe("isExpired", () => {
  it("returns false when there is no expiry", () => {
    expect(isExpired({ accessToken: "at" })).toBe(false);
  });

  it("returns true within the skew window", () => {
    const almost = { accessToken: "at", expiresAt: Date.now() + 30_000 };
    expect(isExpired(almost, 60_000)).toBe(true);
  });

  it("returns false when comfortably in the future", () => {
    const fresh = { accessToken: "at", expiresAt: Date.now() + 3_600_000 };
    expect(isExpired(fresh, 60_000)).toBe(false);
  });
});
