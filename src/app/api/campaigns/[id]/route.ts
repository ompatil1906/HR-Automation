import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await db.campaign.findUniqueOrThrow({ where: { id }, include: { contacts: { orderBy: [{ priorityScore: "desc" }, { createdAt: "asc" }], include: { research: true, generatedResumes: { take: 1, orderBy: { createdAt: "desc" } }, generatedEmails: { take: 1, orderBy: { createdAt: "desc" } }, gmailDrafts: { take: 1, orderBy: { createdAt: "desc" } }, sentEmails: { take: 1, orderBy: { createdAt: "desc" } } } } } });
    return ok(campaign);
  } catch (error) { return fail(error, 404); }
}
