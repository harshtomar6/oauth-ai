/** OAuth tokens returned by a provider after a successful exchange or refresh. */
export interface Tokens {
  accessToken: string;
  refreshToken?: string;
  /** Absolute expiry as epoch milliseconds (derived from `expires_in`). */
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  idToken?: string;
  /** The raw, unparsed token response for provider-specific fields. */
  raw?: Record<string, unknown>;
}

/** A PKCE code verifier/challenge pair (S256). */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
  method: "S256";
}

/**
 * Static description of an OAuth provider.
 *
 * NOTE: the default `clientId`s shipped by `@oauth-ai/openai` and
 * `@oauth-ai/anthropic` are the vendors' own first-party client IDs. Reusing
 * them in a third-party app is a Terms-of-Service gray area. Prefer supplying
 * your own registered client ID via config/env where the provider allows it.
 */
export interface ProviderConfig {
  id: string;
  name: string;
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  /** Only for confidential clients; omit for public/PKCE clients. */
  clientSecret?: string;
  defaultScopes: string[];
  defaultRedirectUri?: string;
  usePKCE: boolean;
  /** Extra params appended to every authorize request. */
  authorizeParams?: Record<string, string>;
}

export interface AuthorizeOptions {
  redirectUri?: string;
  scopes?: string[];
  /** Opaque anti-CSRF value; auto-generated if omitted. */
  state?: string;
  /** PKCE challenge; required by providers where `usePKCE` is true. */
  codeChallenge?: string;
  extraParams?: Record<string, string>;
}

export interface ExchangeOptions {
  code: string;
  redirectUri?: string;
  /** PKCE verifier; required by providers where `usePKCE` is true. */
  codeVerifier?: string;
}
