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

/** Fixed loopback port the Codex client expects (`http://localhost:1455/auth/callback`). */
export const OPENAI_LOOPBACK_PORT = 1455;

export const OPENAI_DEFAULT_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "api.connectors.read",
  "api.connectors.invoke",
];

/**
 * Extra authorize params the Codex "Sign in with ChatGPT" flow requires. Without
 * these flow flags, auth.openai.com rejects the request. `originator` is a client
 * surface label. (The `*_stable_id` telemetry UUIDs Codex Desktop also sends are
 * optional — add them via `authorizeParams` / call-site `extraParams` if needed.)
 */
export const OPENAI_DEFAULT_AUTHORIZE_PARAMS: Record<string, string> = {
  id_token_add_organizations: "true",
  codex_cli_simplified_flow: "true",
  codex_streamlined_login: "true",
  originator: "codex_cli",
};

export interface OpenAIProviderOptions {
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  redirectUri?: string;
  /** Override the loopback port (defaults to 1455). */
  loopbackPort?: number;
  /** Merge/override the default authorize params (flow flags, originator, ...). */
  authorizeParams?: Record<string, string>;
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
    // Codex uses a loopback server on a fixed port 1455 at /auth/callback.
    supportedModes: ["loopback"],
    loopbackPort: options.loopbackPort ?? OPENAI_LOOPBACK_PORT,
    loopbackPath: "/auth/callback",
    authorizeParams: {
      ...OPENAI_DEFAULT_AUTHORIZE_PARAMS,
      ...options.authorizeParams,
    },
  });
  if (options.clientSecret) config.clientSecret = options.clientSecret;
  if (options.redirectUri) config.defaultRedirectUri = options.redirectUri;
  return config;
}

/** Ready-to-use OpenAI provider using default (first-party) client id. */
export const openai: ProviderConfig = createOpenAIProvider();
