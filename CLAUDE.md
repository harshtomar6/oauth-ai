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
  `{ url, state, mode, redirectUri, pkce }`; the caller persists
  `state` + `pkce.codeVerifier` + `redirectUri` (e.g. signed cookie/session) and
  redirects to `url`. The callback route validates `state`, then calls
  `exchangeCode()` with the stored verifier, the same `redirectUri`, and `state`.
- **Flow modes (`loopback` | `manual`).** First-party client ids only allow
  registered redirect URIs, so there is no arbitrary hosted-redirect flow:
  - `loopback` → `http://localhost:<port><loopbackPath>` (Claude `/callback`
    port-agnostic; OpenAI `/auth/callback` on fixed port 1455).
  - `manual` → provider console callback + copy-paste (Claude only; adds
    `code=true`).
  Provider configs carry the mode-specific fields (`supportedModes`,
  `loopbackPath`, `loopbackPort`, `manualRedirectUri`, `manualAuthorizeParams`).
- **Provider token quirks live in `ProviderConfig`, not in `client.ts`.**
  Anthropic sets `includeStateInTokenRequest` (state required in the token body)
  and `stripCodeFragment` (the returned `code#fragment` is split on `#`). Add new
  quirks as declarative flags, not provider `if`-branches in the client.
- Anthropic's default scopes deliberately omit `org:create_api_key` — it causes
  "Unknown scope" on claude.ai subscription logins.
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

## Releasing (Changesets)

Versioning/publishing is managed by [Changesets](https://github.com/changesets/changesets).

- After a user-facing change, add a changeset: `pnpm changeset` (pick packages +
  bump level, write a summary). Commit the generated `.changeset/*.md`.
- On push to `main`, `.github/workflows/release.yml` either opens/updates a
  "Version Packages" PR (when changesets are pending) or publishes to npm (when
  none are pending and versions aren't yet on the registry).
- Publishing requires an `NPM_TOKEN` repo secret. Packages are scoped
  (`@oauth-ai/*`) and publish with public access.
- Note: the provider packages have `@oauth-ai/core` as a **peerDependency**, so
  Changesets escalates them to a **major** bump whenever core changes. Review
  the Version PR before merging.

## Adding a provider

1. New package `packages/<name>` mirroring `packages/openai` (package.json,
   tsconfig, tsup.config with core external).
2. Export a `create<Name>Provider(options)` returning `defineProvider({...})`
   and a ready-made instance.
3. If it needs the React button, add branding to `packages/react/src/icons.tsx`
   and `ConnectButton.tsx` (`LABELS`, `THEME`, `ProviderIcon`).
4. Add tests; update the root README provider table.
