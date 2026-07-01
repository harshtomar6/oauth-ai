import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSupportedProvider, oauth } from "@/lib/oauth";

/**
 * GET /api/oauth-ai/connect/:provider
 * Starts the loopback OAuth flow. The redirect URI must use the provider's
 * registered loopback path (Claude: /callback, OpenAI: /auth/callback) on this
 * app's own origin — arbitrary paths are rejected by the first-party clients.
 */
export async function GET(
  request: Request,
  { params }: { params: { provider: string } },
) {
  const { provider } = params;
  if (!isSupportedProvider(provider)) {
    return NextResponse.json({ error: "unknown provider" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const cfg = oauth.getProvider(provider);
  const redirectUri = `${origin}${cfg.loopbackPath ?? "/callback"}`;

  const { url, state, pkce } = await oauth.startAuthorization(provider, {
    mode: "loopback",
    redirectUri,
  });

  const response = NextResponse.redirect(url);
  // Persist everything the callback needs. Use a signed/encrypted session in
  // production; this demo uses a single short-lived httpOnly cookie.
  response.cookies.set(
    "oauthai_pending",
    JSON.stringify({
      provider,
      state,
      codeVerifier: pkce?.codeVerifier,
      redirectUri,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    },
  );
  void cookies();
  return response;
}
