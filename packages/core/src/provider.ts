import type { ProviderConfig, Tokens } from "./types.js";

/**
 * Define a provider. Thin helper that lets provider packages (and users)
 * declare config with type-checking and sensible defaults.
 */
export function defineProvider(
  config: Partial<ProviderConfig> &
    Pick<ProviderConfig, "id" | "name" | "authorizeUrl" | "tokenUrl" | "clientId">,
): ProviderConfig {
  return {
    defaultScopes: [],
    usePKCE: true,
    ...config,
  };
}

/** Normalize a raw OAuth token endpoint response into `Tokens`. */
export function normalizeTokenResponse(raw: Record<string, unknown>): Tokens {
  const accessToken = raw["access_token"];
  if (typeof accessToken !== "string") {
    throw new Error(
      `Token response missing "access_token": ${JSON.stringify(raw)}`,
    );
  }
  const expiresIn = raw["expires_in"];
  const tokens: Tokens = {
    accessToken,
    raw,
  };
  if (typeof raw["refresh_token"] === "string") {
    tokens.refreshToken = raw["refresh_token"];
  }
  if (typeof expiresIn === "number") {
    tokens.expiresAt = Date.now() + expiresIn * 1000;
  }
  if (typeof raw["token_type"] === "string") {
    tokens.tokenType = raw["token_type"];
  }
  if (typeof raw["scope"] === "string") {
    tokens.scope = raw["scope"];
  }
  if (typeof raw["id_token"] === "string") {
    tokens.idToken = raw["id_token"];
  }
  return tokens;
}

/** True if the token is absent or within `skewMs` of expiring. */
export function isExpired(tokens: Tokens, skewMs = 60_000): boolean {
  if (tokens.expiresAt === undefined) return false;
  return Date.now() + skewMs >= tokens.expiresAt;
}
