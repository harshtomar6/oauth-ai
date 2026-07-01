import { defineProvider } from "@oauth-ai/core";
import type { ProviderConfig } from "@oauth-ai/core";

/** Read an env var without depending on `@types/node`. */
function readEnv(name: string): string | undefined {
  const proc = (globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }).process;
  return proc?.env?.[name];
}

/**
 * Default Anthropic OAuth endpoints for the "Sign in with Claude" flow
 * (Authorization Code + PKCE), as used by Claude Code to mint
 * subscription-backed tokens.
 */
export const ANTHROPIC_AUTHORIZE_URL = "https://claude.ai/oauth/authorize";
export const ANTHROPIC_TOKEN_URL =
  "https://console.anthropic.com/v1/oauth/token";
/** Fixed console callback used by the manual copy-paste flow. */
export const ANTHROPIC_MANUAL_REDIRECT_URI =
  "https://console.anthropic.com/oauth/code/callback";

/**
 * Claude Code's first-party client id. Works, but belongs to Anthropic's own
 * client — using it in a third-party app is a Terms-of-Service gray area.
 * Supply your own via `OAUTH_AI_ANTHROPIC_CLIENT_ID` or `createAnthropicProvider`.
 */
export const ANTHROPIC_DEFAULT_CLIENT_ID =
  "9d1c250a-e61b-44d9-88ed-5944d1962f5e";

/**
 * Default scopes. `org:create_api_key` is intentionally omitted — it triggers
 * "Unknown scope" errors on subscription (claude.ai) logins. Add it back via
 * `createAnthropicProvider({ scopes })` only when targeting a Console org.
 */
export const ANTHROPIC_DEFAULT_SCOPES = ["user:profile", "user:inference"];

export interface AnthropicProviderOptions {
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  redirectUri?: string;
}

/** Create an Anthropic provider with your own client id / options. */
export function createAnthropicProvider(
  options: AnthropicProviderOptions = {},
): ProviderConfig {
  const config: ProviderConfig = defineProvider({
    id: "anthropic",
    name: "Claude (Anthropic)",
    authorizeUrl: ANTHROPIC_AUTHORIZE_URL,
    tokenUrl: ANTHROPIC_TOKEN_URL,
    clientId:
      options.clientId ??
      readEnv("OAUTH_AI_ANTHROPIC_CLIENT_ID") ??
      ANTHROPIC_DEFAULT_CLIENT_ID,
    defaultScopes: options.scopes ?? ANTHROPIC_DEFAULT_SCOPES,
    usePKCE: true,
    // Loopback: port-agnostic, path must be exactly `/callback` (RFC 8252).
    supportedModes: ["loopback", "manual"],
    loopbackPath: "/callback",
    manualRedirectUri: ANTHROPIC_MANUAL_REDIRECT_URI,
    manualAuthorizeParams: { code: "true" },
    // Anthropic's token endpoint requires `state` and returns `code#fragment`.
    includeStateInTokenRequest: true,
    stripCodeFragment: true,
  });
  if (options.clientSecret) config.clientSecret = options.clientSecret;
  if (options.redirectUri) config.defaultRedirectUri = options.redirectUri;
  return config;
}

/** Ready-to-use Anthropic provider using default (first-party) client id. */
export const anthropic: ProviderConfig = createAnthropicProvider();
