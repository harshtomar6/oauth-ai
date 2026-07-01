import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isSupportedProvider,
  oauth,
  redirectUri,
} from "@/lib/oauth";

/**
 * GET /api/oauth-ai/connect/:provider
 * Starts the OAuth flow: generates state + PKCE, stashes them in a short-lived
 * cookie, and redirects the user to the provider's authorize URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: { provider: string } },
) {
  const { provider } = params;
  if (!isSupportedProvider(provider)) {
    return NextResponse.json({ error: "unknown provider" }, { status: 404 });
  }

  const { url, state, pkce } = await oauth.startAuthorization(provider, {
    redirectUri: redirectUri(provider),
  });

  const response = NextResponse.redirect(url);
  // Persist state + PKCE verifier until the callback. Use an encrypted/signed
  // session in production; this demo uses a plain httpOnly cookie.
  response.cookies.set(
    `oauthai_${provider}`,
    JSON.stringify({ state, codeVerifier: pkce?.codeVerifier }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    },
  );
  // Touch cookies() so Next treats this route as dynamic.
  void cookies();
  return response;
}
