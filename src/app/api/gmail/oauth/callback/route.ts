import { NextRequest, NextResponse } from "next/server";
import { saveGmailTokens } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || state !== request.cookies.get("gmail_oauth_state")?.value) return NextResponse.redirect(new URL("/settings?gmail=error", request.url));
  try { await saveGmailTokens(code); return NextResponse.redirect(new URL("/settings?gmail=connected", request.url)); }
  catch { return NextResponse.redirect(new URL("/settings?gmail=error", request.url)); }
}
