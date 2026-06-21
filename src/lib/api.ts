import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) { return NextResponse.json(data, { status }); }
export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}
