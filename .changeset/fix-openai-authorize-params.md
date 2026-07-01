---
"@oauth-ai/openai": patch
---

Fix OpenAI "Sign in with ChatGPT" authorize request. Add the connector scopes
(`api.connectors.read`, `api.connectors.invoke`) and the Codex flow flags
(`id_token_add_organizations`, `codex_cli_simplified_flow`,
`codex_streamlined_login`, `originator`) that auth.openai.com requires — without
them the request is rejected. Exposed `authorizeParams` on
`createOpenAIProvider` to merge/override these.
