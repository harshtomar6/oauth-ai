import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { baseUrl, isSupportedProvider, oauth } from "@/lib/oauth";

interface Pending {
  provider: string;
  mode: string;
  state: string;
  codeVerifier?: string;
  redirectUri: string;
}

/**
 * POST /api/oauth-ai/exchange
 * Completes the manual flow: takes the pasted `code` from the form, exchanges
 * it (with the stored verifier + state), and stores the tokens.
 */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim();

  const jar = cookies();
  const raw = jar.get("oauthai_pending")?.value;
  const pending = raw ? (JSON.parse(raw) as Pending) : null;
  const provider = pending?.provider ?? "unknown";

  // 303 so the browser follows the redirect with GET after the POST.
  const done = (query: string) =>
    NextResponse.redirect(`${baseUrl()}/connected?provider=${provider}&${query}`, {
      status: 303,
    });

  if (!pending || !isSupportedProvider(pending.provider)) {
    return done("error=missing+or+invalid+oauth+session");
  }
  if (!code) return done("error=no+code+provided");

  try {
    const tokens = await oauth.exchangeCode(pending.provider, {
      mode: "manual",
      code,
      state: pending.state,
      codeVerifier: pending.codeVerifier,
      redirectUri: pending.redirectUri,
    });
    await oauth.saveTokens(`demo-user:${pending.provider}`, tokens);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "token exchange failed";
    return done(`error=${encodeURIComponent(msg)}`);
  }

  const response = done("ok=1");
  response.cookies.delete("oauthai_pending");
  return response;
}
