import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
export async function GET(request: Request) { try { const url = new URL(request.url); const status = url.searchParams.get("status"); return ok(await db.activityLog.findMany({ where: status ? { status } : undefined, take: 500, orderBy: { createdAt: "desc" }, include: { campaign: { select: { name: true } } } })); } catch (error) { return fail(error, 500); } }
