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
 * How the authorization code is returned to the app.
 *
 * - `loopback`: the provider redirects to `http://localhost:<port><path>`
 *   (RFC 8252). Suitable for CLI / desktop / local apps.
 * - `manual`: the provider shows the user a code to copy-paste back into the
 *   app (redirects to the provider's own console callback). Works anywhere,
 *   including hosted web apps, at the cost of a copy-paste step.
 *
 * NOTE: hosted web apps CANNOT use an arbitrary redirect URI with the vendors'
 * first-party client ids — only these two shapes are registered. A true
 * "redirect back to yourapp.com/callback" flow requires your own registered
 * OAuth client, which the providers do not currently offer for subscription
 * access. See the README.
 */
export type OAuthMode = "loopback" | "manual";

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

  // --- Flow modes (loopback / manual) ---------------------------------------

  /** Modes this provider supports. Defaults to `["loopback"]`. */
  supportedModes?: OAuthMode[];
  /** Loopback callback path, e.g. `/callback` or `/auth/callback`. */
  loopbackPath?: string;
  /** Fixed loopback port if the provider requires one (e.g. OpenAI: 1455). */
  loopbackPort?: number;
  /** Redirect URI for the manual copy-paste flow (provider console callback). */
  manualRedirectUri?: string;
  /** Extra authorize params sent only in manual mode (e.g. `{ code: "true" }`). */
  manualAuthorizeParams?: Record<string, string>;

  // --- Token request quirks -------------------------------------------------

  /** Include `state` in the token request body (required by Anthropic). */
  includeStateInTokenRequest?: boolean;
  /** Strip a trailing `#fragment` from the returned code before exchange. */
  stripCodeFragment?: boolean;
}

export interface AuthorizeOptions {
  /** Flow mode. Defaults to the provider's first `supportedModes` entry. */
  mode?: OAuthMode;
  redirectUri?: string;
  /** Loopback port for `mode: "loopback"` when the provider has no fixed one. */
  loopbackPort?: number;
  scopes?: string[];
  /** Opaque anti-CSRF value; auto-generated if omitted. */
  state?: string;
  /** PKCE challenge; required by providers where `usePKCE` is true. */
  codeChallenge?: string;
  extraParams?: Record<string, string>;
}

export interface ExchangeOptions {
  code: string;
  /** Flow mode used for authorization (must match). */
  mode?: OAuthMode;
  redirectUri?: string;
  /** Loopback port used during authorization, if it was built by the library. */
  loopbackPort?: number;
  /** PKCE verifier; required by providers where `usePKCE` is true. */
  codeVerifier?: string;
  /** The `state` from authorization; required when the provider needs it. */
  state?: string;
}
