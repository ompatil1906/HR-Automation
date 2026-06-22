import { NextRequest, NextResponse } from "next/server";
import { saveGmailTokens } from "@/lib/gmail";
import { getGmailRedirectUri } from "@/lib/gmail-oauth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || state !== request.cookies.get("gmail_oauth_state")?.value) return NextResponse.redirect(new URL("/settings?gmail=error", request.url));
  try {
    await saveGmailTokens(code, getGmailRedirectUri(request.nextUrl.origin));
    return NextResponse.redirect(new URL("/settings?gmail=connected", request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth callback failed";
    return NextResponse.redirect(new URL(`/settings?gmail=error&reason=${encodeURIComponent(message)}`, request.url));
  }
}
