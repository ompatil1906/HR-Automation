import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { gmailAuthUrl } from "@/lib/gmail";

export async function GET() {
  const state = crypto.randomBytes(24).toString("hex");
  const response = NextResponse.redirect(gmailAuthUrl(state));
  response.cookies.set("gmail_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
