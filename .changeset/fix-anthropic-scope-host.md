---
"@oauth-ai/anthropic": patch
---

Fix Claude "invalid request format" on the authorize step: restore the
`org:create_api_key` default scope (claude.ai rejects the request without it)
and revert the redirect/token host to `console.anthropic.com`, matching known-
working Claude Code login implementations. The manual flow now mirrors a
verified reference request exactly.
