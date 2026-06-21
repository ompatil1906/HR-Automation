import { NextResponse } from "next/server";
export async function POST() { const response = NextResponse.json({ success: true }); response.cookies.set("coldmailos_session", "", { maxAge: 0, path: "/" }); return response; }
