import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) { return NextResponse.json(data, { status }); }
export function fail(error: unknown, status = 400) {
  const raw = error instanceof Error ? error.message : "Unexpected error";
  const message = /Environment variable.*DATABASE_URL|DATABASE_URL.*not found/i.test(raw)
    ? "Database is not configured. Add DATABASE_URL in Vercel and redeploy."
    : /table .* does not exist|P2021|relation .* does not exist/i.test(raw)
      ? "Database schema is not initialized. Redeploy with the committed Prisma migration or run `npx prisma migrate deploy`."
      : /P1001|Can't reach database|connection.*refused/i.test(raw)
        ? "The database is unreachable. Verify DATABASE_URL, SSL, and provider network settings."
        : raw;
  return NextResponse.json({ error: message }, { status });
}
