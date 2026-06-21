import { db } from "@/lib/db";
import { researchContact } from "@/lib/research";
import { fail, ok } from "@/lib/api";

export const maxDuration = 60;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const contacts = await db.contact.findMany({ where: { campaignId: id, ...(Array.isArray(body.contactIds) && body.contactIds.length ? { id: { in: body.contactIds } } : {}) }, select: { id: true } });
    const results = [];
    for (const contact of contacts) { try { await researchContact(contact.id); results.push({ id: contact.id, status: "success" }); } catch (error) { results.push({ id: contact.id, status: "failed", error: error instanceof Error ? error.message : "Failed" }); } }
    return ok({ processed: results.length, results });
  } catch (error) { return fail(error); }
}
