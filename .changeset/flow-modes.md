---
"@oauth-ai/core": minor
"@oauth-ai/anthropic": minor
"@oauth-ai/openai": minor
---

Add loopback + manual flow modes and fix the Anthropic (Claude) flow.

- New `OAuthMode` (`loopback` | `manual`) with per-provider redirect resolution
  (`supportedModes`, `loopbackPath`, `loopbackPort`, `manualRedirectUri`,
  `manualAuthorizeParams`). `startAuthorization` now returns the resolved
  `mode` and `redirectUri`.
- Token-request quirks are declarative on `ProviderConfig`:
  `includeStateInTokenRequest` and `stripCodeFragment`.
- Anthropic: correct token host (`platform.claude.com`), `state` in the token
  body, `code#fragment` stripping, `code=true` for manual mode, and default
  scopes no longer include `org:create_api_key` (which caused "Unknown scope"
  on subscription logins). This fixes the "invalid request format" error.
- OpenAI: loopback on the Codex port 1455 at `/auth/callback`.
