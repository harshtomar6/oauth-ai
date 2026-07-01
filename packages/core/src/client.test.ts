import { describe, expect, it, vi } from "vitest";
import { OAuthAI } from "./client.js";
import { MemoryTokenStore } from "./store.js";
import { defineProvider } from "./provider.js";
import type { ProviderConfig } from "./types.js";

const pkceProvider: ProviderConfig = defineProvider({
  id: "test",
  name: "Test",
  authorizeUrl: "https://auth.test/authorize",
  tokenUrl: "https://auth.test/token",
  clientId: "client-123",
  defaultScopes: ["read", "write"],
});

const noPkceProvider: ProviderConfig = defineProvider({
  id: "legacy",
  name: "Legacy",
  authorizeUrl: "https://auth.legacy/authorize",
  tokenUrl: "https://auth.legacy/token",
  clientId: "legacy-1",
  usePKCE: false,
  clientSecret: "shh",
});

/** Build a mock fetch that returns one JSON body and records the request. */
function mockFetch(body: unknown, ok = true) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), {
      status: ok ? 200 : 400,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

/** Parse the form-encoded body of a recorded request. */
function formBody(init?: RequestInit): URLSearchParams {
  return new URLSearchParams(String(init?.body ?? ""));
}

describe("startAuthorization", () => {
  it("builds a URL with standard params + PKCE challenge", async () => {
    const oauth = new OAuthAI({ providers: [pkceProvider] });
    const { url, state, pkce } = await oauth.startAuthorization("test", {
      redirectUri: "https://app/cb",
    });
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://auth.test/authorize");
    expect(u.searchParams.get("response_type")).toBe("code");
    expect(u.searchParams.get("client_id")).toBe("client-123");
    expect(u.searchParams.get("redirect_uri")).toBe("https://app/cb");
    expect(u.searchParams.get("scope")).toBe("read write");
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("code_challenge")).toBe(pkce?.codeChallenge);
    expect(u.searchParams.get("state")).toBe(state);
    expect(pkce?.codeVerifier).toBeTruthy();
  });

  it("omits PKCE params when the provider disables it", async () => {
    const oauth = new OAuthAI({ providers: [noPkceProvider] });
    const { url, pkce } = await oauth.startAuthorization("legacy", {
      redirectUri: "https://app/cb",
    });
    expect(pkce).toBeUndefined();
    expect(new URL(url).searchParams.get("code_challenge")).toBeNull();
  });

  it("honors custom scopes, state, and extraParams", async () => {
    const oauth = new OAuthAI({ providers: [pkceProvider] });
    const { url } = await oauth.startAuthorization("test", {
      redirectUri: "https://app/cb",
      scopes: ["only"],
      state: "fixed-state",
      extraParams: { prompt: "consent" },
    });
    const u = new URL(url);
    expect(u.searchParams.get("scope")).toBe("only");
    expect(u.searchParams.get("state")).toBe("fixed-state");
    expect(u.searchParams.get("prompt")).toBe("consent");
  });

  it("falls back to the client-level redirectUri", async () => {
    const oauth = new OAuthAI({
      providers: [pkceProvider],
      redirectUri: "https://default/cb",
    });
    const { url } = await oauth.startAuthorization("test");
    expect(new URL(url).searchParams.get("redirect_uri")).toBe(
      "https://default/cb",
    );
  });

  it("throws for an unknown provider", async () => {
    const oauth = new OAuthAI({ providers: [pkceProvider] });
    await expect(
      oauth.startAuthorization("nope", { redirectUri: "x" }),
    ).rejects.toThrow(/Unknown provider/);
  });

  it("throws when no redirectUri is available", async () => {
    const oauth = new OAuthAI({ providers: [pkceProvider] });
    await expect(oauth.startAuthorization("test")).rejects.toThrow(
      /No redirectUri/,
    );
  });
});

describe("exchangeCode", () => {
  it("posts a form-encoded authorization_code grant with PKCE verifier", async () => {
    const { fn, calls } = mockFetch({ access_token: "at", expires_in: 60 });
    const oauth = new OAuthAI({ providers: [pkceProvider], fetch: fn });
    const tokens = await oauth.exchangeCode("test", {
      code: "the-code",
      codeVerifier: "the-verifier",
      redirectUri: "https://app/cb",
    });
    expect(tokens.accessToken).toBe("at");
    expect(calls[0]?.url).toBe("https://auth.test/token");
    const body = formBody(calls[0]?.init);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("the-code");
    expect(body.get("code_verifier")).toBe("the-verifier");
    expect(body.get("client_id")).toBe("client-123");
    expect(body.get("redirect_uri")).toBe("https://app/cb");
  });

  it("requires a codeVerifier for PKCE providers", async () => {
    const { fn } = mockFetch({ access_token: "at" });
    const oauth = new OAuthAI({ providers: [pkceProvider], fetch: fn });
    await expect(
      oauth.exchangeCode("test", { code: "c", redirectUri: "https://app/cb" }),
    ).rejects.toThrow(/codeVerifier/);
  });

  it("sends client_secret and no verifier for confidential providers", async () => {
    const { fn, calls } = mockFetch({ access_token: "at" });
    const oauth = new OAuthAI({ providers: [noPkceProvider], fetch: fn });
    await oauth.exchangeCode("legacy", {
      code: "c",
      redirectUri: "https://app/cb",
    });
    const body = formBody(calls[0]?.init);
    expect(body.get("client_secret")).toBe("shh");
    expect(body.get("code_verifier")).toBeNull();
  });

  it("throws with the response body on a non-2xx status", async () => {
    const { fn } = mockFetch({ error: "invalid_grant" }, false);
    const oauth = new OAuthAI({ providers: [pkceProvider], fetch: fn });
    await expect(
      oauth.exchangeCode("test", {
        code: "c",
        codeVerifier: "v",
        redirectUri: "https://app/cb",
      }),
    ).rejects.toThrow(/invalid_grant/);
  });
});

describe("refresh", () => {
  it("posts a refresh_token grant and carries the token forward when omitted", async () => {
    const { fn, calls } = mockFetch({ access_token: "new-at", expires_in: 60 });
    const oauth = new OAuthAI({ providers: [pkceProvider], fetch: fn });
    const tokens = await oauth.refresh("test", "old-rt");
    const body = formBody(calls[0]?.init);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("old-rt");
    expect(tokens.accessToken).toBe("new-at");
    // Provider returned no refresh_token; the old one should be preserved.
    expect(tokens.refreshToken).toBe("old-rt");
  });

  it("uses a newly issued refresh token when provided", async () => {
    const { fn } = mockFetch({ access_token: "at", refresh_token: "new-rt" });
    const oauth = new OAuthAI({ providers: [pkceProvider], fetch: fn });
    const tokens = await oauth.refresh("test", "old-rt");
    expect(tokens.refreshToken).toBe("new-rt");
  });
});

describe("token store helpers", () => {
  it("save/get/delete round-trips through the store", async () => {
    const oauth = new OAuthAI({
      providers: [pkceProvider],
      store: new MemoryTokenStore(),
    });
    await oauth.saveTokens("u:test", { accessToken: "at" });
    expect(await oauth.getTokens("u:test")).toEqual({ accessToken: "at" });
    await oauth.deleteTokens("u:test");
    expect(await oauth.getTokens("u:test")).toBeNull();
  });

  it("throws if store methods are used without a store", async () => {
    const oauth = new OAuthAI({ providers: [pkceProvider] });
    await expect(oauth.getTokens("k")).rejects.toThrow(/requires a `store`/);
  });
});

describe("getValidTokens", () => {
  it("returns stored tokens when still valid", async () => {
    const store = new MemoryTokenStore();
    const { fn } = mockFetch({ access_token: "should-not-be-used" });
    const oauth = new OAuthAI({ providers: [pkceProvider], store, fetch: fn });
    await oauth.saveTokens("u:test", {
      accessToken: "at",
      expiresAt: Date.now() + 3_600_000,
    });
    const tokens = await oauth.getValidTokens("u:test", "test");
    expect(tokens?.accessToken).toBe("at");
    expect(fn).not.toHaveBeenCalled();
  });

  it("refreshes and re-persists an expired token", async () => {
    const store = new MemoryTokenStore();
    const { fn } = mockFetch({ access_token: "refreshed", expires_in: 3600 });
    const oauth = new OAuthAI({ providers: [pkceProvider], store, fetch: fn });
    await oauth.saveTokens("u:test", {
      accessToken: "stale",
      refreshToken: "rt",
      expiresAt: Date.now() - 1_000,
    });
    const tokens = await oauth.getValidTokens("u:test", "test");
    expect(tokens?.accessToken).toBe("refreshed");
    expect((await oauth.getTokens("u:test"))?.accessToken).toBe("refreshed");
  });

  it("returns null when nothing is stored", async () => {
    const oauth = new OAuthAI({
      providers: [pkceProvider],
      store: new MemoryTokenStore(),
    });
    expect(await oauth.getValidTokens("missing", "test")).toBeNull();
  });
});
