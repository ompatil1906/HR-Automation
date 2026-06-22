import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { gmailAuthUrl } from "@/lib/gmail";
import { getGmailRedirectUri } from "@/lib/gmail-oauth";

export async function GET(request: NextRequest) {
  try {
    const state = crypto.randomBytes(24).toString("hex");
    const redirectUri = getGmailRedirectUri(request.nextUrl.origin);
    const response = NextResponse.redirect(gmailAuthUrl(state, redirectUri));
    response.cookies.set("gmail_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail OAuth is not configured";
    return NextResponse.redirect(new URL(`/settings?gmail=error&reason=${encodeURIComponent(message)}`, request.url));
  }
}
