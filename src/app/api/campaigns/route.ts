import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { contacts: true } }, contacts: { select: { researchId: true, status: true, generatedEmails: { select: { id: true } }, gmailDrafts: { where: { status: "CREATED" }, select: { id: true } }, sentEmails: { where: { status: "SENT" }, select: { id: true } } } } } });
    return ok(campaigns.map(({ contacts, ...campaign }) => ({ ...campaign, metrics: { researched: contacts.filter((c) => c.researchId).length, emails: contacts.filter((c) => c.generatedEmails.length).length, drafts: contacts.filter((c) => c.gmailDrafts.length).length, sent: contacts.filter((c) => c.sentEmails.length).length } })));
  } catch (error) { return fail(error, 500); }
}
