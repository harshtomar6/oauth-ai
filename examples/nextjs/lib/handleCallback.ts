import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { baseUrl, isSupportedProvider, oauth } from "@/lib/oauth";

interface Pending {
  provider: string;
  mode?: string;
  state: string;
  codeVerifier?: string;
  redirectUri: string;
}

/**
 * Shared handler for the loopback callback routes (/callback, /auth/callback).
 * Validates state, exchanges the code (with PKCE verifier + state), and stores
 * the resulting tokens.
 */
export async function handleLoopbackCallback(
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const jar = cookies();
  const raw = jar.get("oauthai_pending")?.value;
  const pending = raw ? (JSON.parse(raw) as Pending) : null;
  const provider = pending?.provider ?? "unknown";

  const fail = (msg: string) =>
    NextResponse.redirect(
      `${baseUrl()}/connected?provider=${provider}&error=${encodeURIComponent(msg)}`,
    );

  if (oauthError) return fail(oauthError);
  if (!pending || !isSupportedProvider(pending.provider)) {
    return fail("missing or invalid oauth session");
  }
  if (!code || !state) return fail("missing code/state");
  if (state !== pending.state) return fail("state mismatch");

  try {
    const tokens = await oauth.exchangeCode(pending.provider, {
      mode: pending.mode === "manual" ? "manual" : "loopback",
      code,
      state,
      codeVerifier: pending.codeVerifier,
      redirectUri: pending.redirectUri,
    });
    // Demo: key by provider only. In a real app, key by your user id.
    await oauth.saveTokens(`demo-user:${pending.provider}`, tokens);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "token exchange failed");
  }

  const response = NextResponse.redirect(
    `${baseUrl()}/connected?provider=${pending.provider}&ok=1`,
  );
  response.cookies.delete("oauthai_pending");
  return response;
}
