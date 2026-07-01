import { MemoryTokenStore, OAuthAI } from "@oauth-ai/core";
import { anthropic } from "@oauth-ai/anthropic";
import { openai } from "@oauth-ai/openai";

/**
 * A single shared OAuthAI instance for the demo.
 *
 * In a real app, replace `MemoryTokenStore` with a persistent store keyed by
 * your authenticated user id (Redis, Postgres, encrypted cookies, ...).
 */
export const oauth = new OAuthAI({
  providers: [openai, anthropic],
  store: new MemoryTokenStore(),
});

export type SupportedProvider = "openai" | "anthropic";

export function isSupportedProvider(id: string): id is SupportedProvider {
  return id === "openai" || id === "anthropic";
}

export function baseUrl(): string {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

/** The redirect URI registered for a provider callback. */
export function redirectUri(provider: SupportedProvider): string {
  return `${baseUrl()}/api/oauth-ai/callback/${provider}`;
}
