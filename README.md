# oauth-ai

> Add a **“Connect with OpenAI”** or **“Connect with Claude”** button to any app or website.

`oauth-ai` is a small, framework-agnostic TypeScript library for connecting a user's
AI provider account over OAuth. Both OpenAI ("Sign in with ChatGPT") and Anthropic
("Sign in with Claude") expose an **Authorization Code + PKCE** flow that mints
subscription-backed tokens — `oauth-ai` gives you one unified API over both, plus
drop-in React buttons.

```tsx
import { ConnectButton } from "@oauth-ai/react";

<ConnectButton provider="openai" />
<ConnectButton provider="anthropic" />
```

```ts
import { OAuthAI, MemoryTokenStore } from "@oauth-ai/core";
import { openai } from "@oauth-ai/openai";
import { anthropic } from "@oauth-ai/anthropic";

const oauth = new OAuthAI({
  providers: [openai, anthropic],
  store: new MemoryTokenStore(),
});

// 1. Start the flow (server-side). Persist state + pkce + the resolved
//    redirectUri; redirect the user to `url`.
const { url, state, pkce, redirectUri } = await oauth.startAuthorization(
  "anthropic",
  { mode: "loopback", redirectUri: "http://localhost:3000/callback" },
);

// 2. In your callback route: validate `state`, then exchange the code. Pass the
//    SAME redirectUri, plus `state` (some providers require it in the exchange).
const tokens = await oauth.exchangeCode("anthropic", {
  mode: "loopback",
  code,
  state,
  codeVerifier: pkce.codeVerifier,
  redirectUri,
});

// 3. Later: get a valid (auto-refreshed) access token.
await oauth.saveTokens("user_42:anthropic", tokens);
const fresh = await oauth.getValidTokens("user_42:anthropic", "anthropic");
```

## ⚠️ What actually works — flow modes & limits

Because the default client ids are the vendors' **first-party** ids, you cannot
point them at an arbitrary hosted redirect URI. Only two redirect shapes are
registered, exposed as **modes**:

| Mode | Redirect | Good for | Not for |
| --- | --- | --- | --- |
| `loopback` | `http://localhost:<port><path>` (Claude: `/callback`, port-agnostic · OpenAI: `/auth/callback`, **port 1455**) | CLI, desktop, local/dev web apps | hosted sites on a public domain |
| `manual` | provider console callback + user copy-pastes a code (Claude only) | headless / any environment | smooth UX |

A true **"button on a public website that redirects back to `yourapp.com`"**
requires *your own* registered OAuth client — which the providers do **not**
currently offer for subscription-backed access. Until they do, hosted apps must
use `manual` mode or register their own client. The React `<ConnectButton />`
and the example run locally via `loopback`.

## ⚠️ Read this first — Terms of Service

This is an **experimental / research** project. The default client ids shipped by
`@oauth-ai/openai` and `@oauth-ai/anthropic` are the vendors' **own first-party
client ids** (from Codex CLI and Claude Code). They work, but:

- Reusing first-party client ids in a **third-party** app is a **ToS gray area**,
  and providers have taken enforcement action against cross-use of these tokens.
- The subscription-backed tokens are intended for the vendors' official clients.

**Before shipping**, supply your own registered OAuth client id (where the provider
allows third-party registration) via `createOpenAIProvider({ clientId })` /
`createAnthropicProvider({ clientId })` or the `OAUTH_AI_OPENAI_CLIENT_ID` /
`OAUTH_AI_ANTHROPIC_CLIENT_ID` env vars. You are responsible for complying with each
provider's Terms of Service.

## Packages

| Package | What it is |
| --- | --- |
| [`@oauth-ai/core`](packages/core) | Headless OAuth engine: PKCE, authorize URL, token exchange, refresh, pluggable token store. |
| [`@oauth-ai/openai`](packages/openai) | OpenAI ("Sign in with ChatGPT") provider adapter. |
| [`@oauth-ai/anthropic`](packages/anthropic) | Anthropic ("Sign in with Claude") provider adapter. |
| [`@oauth-ai/react`](packages/react) | `<ConnectButton />` components. |

## How it works

```
Browser                    Your server (@oauth-ai/core)        Provider auth server
  │  click "Connect with OpenAI"                                (auth.openai.com /
  │ ───────────────────────▶  startAuthorization()              claude.ai)
  │                            • generate state + PKCE
  │  302 to authorize URL ◀──  • stash verifier in session
  │ ──────────────────────────────────────────────────────────▶ user approves
  │  302 back with ?code   ◀──────────────────────────────────  redirect
  │ ───────────────────────▶  exchangeCode(code, verifier) ───▶ token endpoint
  │                            • persist tokens ◀────────────── access/refresh token
```

The core has **no framework dependency** and uses the Web Crypto API, so it runs in
Node 18+, edge runtimes, and the browser.

## Try the example

```bash
pnpm install
pnpm build
cd examples/nextjs
cp .env.example .env.local   # then edit as needed
pnpm dev                     # http://localhost:3000 — "Connect with Claude" works here

# OpenAI needs the Codex loopback port, so run the example on 1455 for it:
PORT=1455 pnpm dev           # then use "Connect with OpenAI"
```

## Development

```bash
pnpm install      # install workspace deps
pnpm build        # build all packages (tsup)
pnpm typecheck    # typecheck all packages
```

Monorepo layout: pnpm workspaces, each package built with `tsup` (dual ESM/CJS + d.ts).

## License

MIT — see [LICENSE](LICENSE).
