# CLAUDE.md

Guidance for AI coding agents working in this repository.

## What this is

`oauth-ai` is an open-source TypeScript library that lets apps add
**"Connect with OpenAI"** / **"Connect with Claude"** buttons via OAuth 2.0
(Authorization Code + PKCE). Both providers expose a subscription-backed
"Sign in with ChatGPT" / "Sign in with Claude" flow; this library gives one
unified API over both plus drop-in React buttons.

It is an **experimental / research** project — see the ToS note below.

## Repo layout

pnpm workspace monorepo. Each package builds with `tsup` (dual ESM/CJS + `.d.ts`).

| Path | Package | Role |
| --- | --- | --- |
| `packages/core` | `@oauth-ai/core` | Headless engine: `OAuthAI` class, PKCE, token exchange/refresh, `TokenStore`. No framework or runtime deps (uses Web Crypto + `fetch`). |
| `packages/openai` | `@oauth-ai/openai` | OpenAI provider adapter + `createOpenAIProvider()`. |
| `packages/anthropic` | `@oauth-ai/anthropic` | Anthropic provider adapter + `createAnthropicProvider()`. |
| `packages/react` | `@oauth-ai/react` | `<ConnectButton />` + provider icons. |
| `examples/nextjs` | (private) | Next.js App Router demo with connect/callback routes. |

Provider packages declare `@oauth-ai/core` as a **peer dependency** and mark it
`external` in their `tsup.config.ts` — don't bundle core into them.

## Commands

```bash
pnpm install        # install workspace deps
pnpm build          # build all packages (tsup)
pnpm typecheck      # tsc --noEmit across packages
pnpm test           # vitest run (33 tests, in packages/**/*.test.ts)
pnpm test:watch     # vitest watch
pnpm example        # run the Next.js example (examples/nextjs)
```

Always run `pnpm build && pnpm typecheck && pnpm test` before committing. CI
(`.github/workflows/ci.yml`) runs exactly these on push/PR.

## Architecture notes

- **The flow lives server-side.** `OAuthAI.startAuthorization()` returns
  `{ url, state, pkce }`; the caller persists `state` + `pkce.codeVerifier`
  (e.g. signed cookie/session) and redirects to `url`. The callback route
  validates `state`, then calls `exchangeCode()` with the stored verifier.
- **`fetch` is injectable** via `OAuthAIOptions.fetch` — tests pass a mock;
  don't reach for global fetch mocking.
- **`TokenStore` is pluggable.** `MemoryTokenStore` is dev-only. Real apps key
  tokens by user id + provider (e.g. `"user_42:openai"`).
- **Token keys are caller-defined strings** — the library never invents them.
- `getValidTokens(key, providerId)` transparently refreshes expired tokens and
  re-persists; requires a configured `store`.

## Conventions

- **ESM source with explicit `.js` import specifiers** (e.g. `import … from
  "./pkce.js"`) even though files are `.ts`. tsup and Vitest both resolve these;
  keep the extension.
- Strict TypeScript (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`). Use
  `import type { … }` for type-only imports.
- **Core must stay dependency-free and runtime-agnostic** (Node 18+, edge,
  browser). No Node built-ins, no `Buffer`, no `process` without the guarded
  `readEnv` helper pattern used in the provider packages.
- Tests live next to source as `*.test.ts`.
- Provider client ids come from (in order): explicit option → env var
  (`OAUTH_AI_<PROVIDER>_CLIENT_ID`) → first-party default.

## ⚠️ Terms-of-Service caveat (important)

Default client ids are the vendors' **first-party** ids (Codex CLI / Claude
Code). Reusing them in a third-party app is a **ToS gray area**. Keep the
warnings intact in README, `.env.example`, and the example UI. When adding
features, prefer paths where a user can supply their **own** client id, and
never remove the "bring your own client id" affordances.

## Adding a provider

1. New package `packages/<name>` mirroring `packages/openai` (package.json,
   tsconfig, tsup.config with core external).
2. Export a `create<Name>Provider(options)` returning `defineProvider({...})`
   and a ready-made instance.
3. If it needs the React button, add branding to `packages/react/src/icons.tsx`
   and `ConnectButton.tsx` (`LABELS`, `THEME`, `ProviderIcon`).
4. Add tests; update the root README provider table.
