import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const [migrations, campaigns] = await Promise.all([
      db.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL`,
      db.campaign.count(),
    ]);
    return NextResponse.json({
      status: "healthy",
      provider: "postgresql",
      migrationsApplied: Number(migrations[0]?.count || 0),
      campaignCount: campaigns,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Database check failed";
    const reason = /DATABASE_URL/i.test(raw) ? "not_configured" : /does not exist|P2021/i.test(raw) ? "schema_missing" : "unreachable";
    return NextResponse.json({ status: "unhealthy", provider: "postgresql", reason, latencyMs: Date.now() - startedAt, checkedAt: new Date().toISOString() }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
