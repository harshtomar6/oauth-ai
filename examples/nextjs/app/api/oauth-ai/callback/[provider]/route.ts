import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  baseUrl,
  isSupportedProvider,
  oauth,
  redirectUri,
} from "@/lib/oauth";

/**
 * GET /api/oauth-ai/callback/:provider
 * Handles the provider redirect: validates state, exchanges the code (with the
 * stored PKCE verifier) for tokens, and persists them.
 */
export async function GET(
  request: Request,
  { params }: { params: { provider: string } },
) {
  const { provider } = params;
  if (!isSupportedProvider(provider)) {
    return NextResponse.json({ error: "unknown provider" }, { status: 404 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(
      `${baseUrl()}/connected?provider=${provider}&error=${encodeURIComponent(oauthError)}`,
    );
  }
  if (!code || !state) {
    return NextResponse.json({ error: "missing code/state" }, { status: 400 });
  }

  const jar = cookies();
  const raw = jar.get(`oauthai_${provider}`)?.value;
  if (!raw) {
    return NextResponse.json({ error: "missing oauth session" }, { status: 400 });
  }
  const saved = JSON.parse(raw) as { state: string; codeVerifier?: string };
  if (saved.state !== state) {
    return NextResponse.json({ error: "state mismatch" }, { status: 400 });
  }

  const tokens = await oauth.exchangeCode(provider, {
    code,
    codeVerifier: saved.codeVerifier,
    redirectUri: redirectUri(provider),
  });

  // Demo: key tokens by provider only. In a real app, key by your user id.
  await oauth.saveTokens(`demo-user:${provider}`, tokens);

  const response = NextResponse.redirect(
    `${baseUrl()}/connected?provider=${provider}&ok=1`,
  );
  response.cookies.delete(`oauthai_${provider}`);
  return response;
}
