import { generatePKCE, randomState } from "./pkce.js";
import { isExpired, normalizeTokenResponse } from "./provider.js";
import type { TokenStore } from "./store.js";
import type {
  AuthorizeOptions,
  ExchangeOptions,
  PKCEPair,
  ProviderConfig,
  Tokens,
} from "./types.js";

export interface OAuthAIOptions {
  providers: ProviderConfig[];
  /** Optional persistence layer used by the `*ForKey` convenience methods. */
  store?: TokenStore;
  /** Default redirect URI applied when a provider/call omits one. */
  redirectUri?: string;
  /** Override the fetch implementation (tests, custom agents). */
  fetch?: typeof fetch;
}

/** Result of starting an authorization flow. */
export interface StartAuthorization {
  url: string;
  state: string;
  /** Present when the provider uses PKCE. Persist until the callback. */
  pkce?: PKCEPair;
}

/**
 * Framework-agnostic OAuth client for AI provider accounts.
 *
 * Typical server usage:
 *   const oauth = new OAuthAI({ providers: [openai, anthropic] });
 *   const { url, state, pkce } = await oauth.startAuthorization("openai", { redirectUri });
 *   // ...store state + pkce.codeVerifier, redirect user to `url`...
 *   const tokens = await oauth.exchangeCode("openai", { code, codeVerifier, redirectUri });
 */
export class OAuthAI {
  private readonly providers = new Map<string, ProviderConfig>();
  private readonly store?: TokenStore;
  private readonly defaultRedirectUri?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OAuthAIOptions) {
    for (const provider of options.providers) {
      this.providers.set(provider.id, provider);
    }
    this.store = options.store;
    this.defaultRedirectUri = options.redirectUri;
    const f = options.fetch ?? globalThis.fetch;
    if (!f) {
      throw new Error(
        "No fetch implementation found. Pass `fetch` or use Node 18+.",
      );
    }
    this.fetchImpl = f;
  }

  getProvider(id: string): ProviderConfig {
    const provider = this.providers.get(id);
    if (!provider) {
      const known = [...this.providers.keys()].join(", ") || "(none)";
      throw new Error(`Unknown provider "${id}". Registered: ${known}.`);
    }
    return provider;
  }

  /** Build the authorization URL (and state/PKCE) to redirect the user to. */
  async startAuthorization(
    providerId: string,
    options: AuthorizeOptions = {},
  ): Promise<StartAuthorization> {
    const provider = this.getProvider(providerId);
    const redirectUri =
      options.redirectUri ??
      provider.defaultRedirectUri ??
      this.defaultRedirectUri;
    if (!redirectUri) {
      throw new Error(
        `No redirectUri for provider "${providerId}". Provide one in the call, provider config, or client options.`,
      );
    }

    const state = options.state ?? randomState();
    const scopes = options.scopes ?? provider.defaultScopes;

    let pkce: PKCEPair | undefined;
    let codeChallenge = options.codeChallenge;
    if (provider.usePKCE && !codeChallenge) {
      pkce = await generatePKCE();
      codeChallenge = pkce.codeChallenge;
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      state,
    });
    if (scopes.length > 0) params.set("scope", scopes.join(" "));
    if (codeChallenge) {
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
    }
    for (const [k, v] of Object.entries(provider.authorizeParams ?? {})) {
      params.set(k, v);
    }
    for (const [k, v] of Object.entries(options.extraParams ?? {})) {
      params.set(k, v);
    }

    const url = `${provider.authorizeUrl}?${params.toString()}`;
    return pkce ? { url, state, pkce } : { url, state };
  }

  /** Exchange an authorization `code` for tokens. */
  async exchangeCode(
    providerId: string,
    options: ExchangeOptions,
  ): Promise<Tokens> {
    const provider = this.getProvider(providerId);
    const redirectUri =
      options.redirectUri ??
      provider.defaultRedirectUri ??
      this.defaultRedirectUri;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: options.code,
      client_id: provider.clientId,
    });
    if (redirectUri) body.set("redirect_uri", redirectUri);
    if (provider.clientSecret) body.set("client_secret", provider.clientSecret);
    if (provider.usePKCE) {
      if (!options.codeVerifier) {
        throw new Error(
          `Provider "${providerId}" uses PKCE but no codeVerifier was supplied.`,
        );
      }
      body.set("code_verifier", options.codeVerifier);
    }

    return this.tokenRequest(provider, body);
  }

  /** Exchange a refresh token for a fresh access token. */
  async refresh(providerId: string, refreshToken: string): Promise<Tokens> {
    const provider = this.getProvider(providerId);
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: provider.clientId,
    });
    if (provider.clientSecret) body.set("client_secret", provider.clientSecret);
    const tokens = await this.tokenRequest(provider, body);
    // Providers often omit the refresh token on refresh; carry it forward.
    if (!tokens.refreshToken) tokens.refreshToken = refreshToken;
    return tokens;
  }

  private requireStore(): TokenStore {
    if (!this.store) {
      throw new Error(
        "This operation requires a `store` in OAuthAIOptions.",
      );
    }
    return this.store;
  }

  /** Persist tokens for `key` (e.g. `"user_42:openai"`). Requires a `store`. */
  async saveTokens(key: string, tokens: Tokens): Promise<void> {
    await this.requireStore().set(key, tokens);
  }

  /** Read stored tokens for `key` without refreshing. Requires a `store`. */
  async getTokens(key: string): Promise<Tokens | null> {
    return this.requireStore().get(key);
  }

  /** Remove stored tokens for `key` (disconnect). Requires a `store`. */
  async deleteTokens(key: string): Promise<void> {
    await this.requireStore().delete(key);
  }

  /**
   * Return a valid access token for `key`, transparently refreshing and
   * re-persisting if it is expired. Requires a configured `store`.
   */
  async getValidTokens(key: string, providerId: string): Promise<Tokens | null> {
    const store = this.requireStore();
    const current = await store.get(key);
    if (!current) return null;
    if (!isExpired(current) || !current.refreshToken) return current;

    const refreshed = await this.refresh(providerId, current.refreshToken);
    await store.set(key, refreshed);
    return refreshed;
  }

  private async tokenRequest(
    provider: ProviderConfig,
    body: URLSearchParams,
  ): Promise<Tokens> {
    const res = await this.fetchImpl(provider.tokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body: body.toString(),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(
        `Token request to ${provider.id} failed (${res.status}): ${text}`,
      );
    }
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Token response from ${provider.id} was not JSON: ${text}`,
      );
    }
    return normalizeTokenResponse(json);
  }
}
