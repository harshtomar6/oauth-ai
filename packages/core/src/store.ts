import type { Tokens } from "./types.js";

/**
 * Pluggable token store. Implement this to persist tokens in Redis, a
 * database, encrypted cookies, etc. `key` is caller-defined and typically
 * combines a user id with a provider id (e.g. `"user_42:openai"`).
 */
export interface TokenStore {
  get(key: string): Promise<Tokens | null> | Tokens | null;
  set(key: string, tokens: Tokens): Promise<void> | void;
  delete(key: string): Promise<void> | void;
}

/** In-memory token store. For development and tests only — not persistent. */
export class MemoryTokenStore implements TokenStore {
  private readonly map = new Map<string, Tokens>();

  get(key: string): Tokens | null {
    return this.map.get(key) ?? null;
  }

  set(key: string, tokens: Tokens): void {
    this.map.set(key, tokens);
  }

  delete(key: string): void {
    this.map.delete(key);
  }
}
