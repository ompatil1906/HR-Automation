import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/api/auth/") || pathname.startsWith("/api/jobs/process") || pathname.startsWith("/_next") || pathname === "/favicon.ico") return NextResponse.next();
  const token = request.cookies.get("coldmailos_session")?.value;
  if (token) { try { await verifySession(token); return NextResponse.next(); } catch {} }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
}

export const config = { matcher: ["/((?!.*\\..*).*)"] };
