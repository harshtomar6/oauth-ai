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
 * Default OpenAI OAuth endpoints for the "Sign in with ChatGPT" flow
 * (Authorization Code + PKCE), which mints subscription-backed tokens.
 */
export const OPENAI_AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
export const OPENAI_TOKEN_URL = "https://auth.openai.com/oauth/token";

/**
 * The Codex CLI's first-party client id. It works, but it belongs to OpenAI's
 * own client — using it in a third-party app is a Terms-of-Service gray area.
 * Supply your own via `OAUTH_AI_OPENAI_CLIENT_ID` or `createOpenAIProvider`.
 */
export const OPENAI_DEFAULT_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";

export const OPENAI_DEFAULT_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
];

export interface OpenAIProviderOptions {
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  redirectUri?: string;
}

/** Create an OpenAI provider with your own client id / options. */
export function createOpenAIProvider(
  options: OpenAIProviderOptions = {},
): ProviderConfig {
  const config: ProviderConfig = defineProvider({
    id: "openai",
    name: "OpenAI (ChatGPT)",
    authorizeUrl: OPENAI_AUTHORIZE_URL,
    tokenUrl: OPENAI_TOKEN_URL,
    clientId:
      options.clientId ??
      readEnv("OAUTH_AI_OPENAI_CLIENT_ID") ??
      OPENAI_DEFAULT_CLIENT_ID,
    defaultScopes: options.scopes ?? OPENAI_DEFAULT_SCOPES,
    usePKCE: true,
  });
  if (options.clientSecret) config.clientSecret = options.clientSecret;
  if (options.redirectUri) config.defaultRedirectUri = options.redirectUri;
  return config;
}

/** Ready-to-use OpenAI provider using default (first-party) client id. */
export const openai: ProviderConfig = createOpenAIProvider();
