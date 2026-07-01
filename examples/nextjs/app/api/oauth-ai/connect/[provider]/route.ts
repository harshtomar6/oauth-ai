import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSupportedProvider, oauth } from "@/lib/oauth";

/**
 * GET /api/oauth-ai/connect/:provider[?mode=manual]
 *
 * - loopback (default): redirect straight to the provider; it returns to this
 *   app's registered loopback path (Claude /callback, OpenAI /auth/callback).
 * - manual: start the copy-paste flow and send the user to /manual, which opens
 *   the provider and collects the pasted code.
 */
export async function GET(
  request: Request,
  { params }: { params: { provider: string } },
) {
  const { provider } = params;
  if (!isSupportedProvider(provider)) {
    return NextResponse.json({ error: "unknown provider" }, { status: 404 });
  }

  const reqUrl = new URL(request.url);
  const mode = reqUrl.searchParams.get("mode") === "manual" ? "manual" : "loopback";

  let start;
  try {
    if (mode === "manual") {
      // redirectUri resolves to the provider's console callback automatically.
      start = await oauth.startAuthorization(provider, { mode: "manual" });
    } else {
      const cfg = oauth.getProvider(provider);
      const redirectUri = `${reqUrl.origin}${cfg.loopbackPath ?? "/callback"}`;
      start = await oauth.startAuthorization(provider, { mode: "loopback", redirectUri });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "failed to start authorization";
    return NextResponse.redirect(
      `${reqUrl.origin}/connected?provider=${provider}&error=${encodeURIComponent(msg)}`,
    );
  }

  // manual → land on our /manual page; loopback → straight to the provider.
  const destination = mode === "manual" ? `${reqUrl.origin}/manual` : start.url;
  const response = NextResponse.redirect(destination);
  response.cookies.set(
    "oauthai_pending",
    JSON.stringify({
      provider,
      mode,
      state: start.state,
      codeVerifier: start.pkce?.codeVerifier,
      redirectUri: start.redirectUri,
      // Only used by the manual page to link the user to the provider.
      authorizeUrl: mode === "manual" ? start.url : undefined,
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
