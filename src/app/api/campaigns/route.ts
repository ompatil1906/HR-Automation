import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { contacts: true } } } });
    const result = await Promise.all(campaigns.map(async campaign => {
      const [researched, emails, drafts, sent] = await Promise.all([
        db.contact.count({ where: { campaignId: campaign.id, researchId: { not: null } } }),
        db.generatedEmail.count({ where: { contact: { campaignId: campaign.id } } }),
        db.gmailDraft.count({ where: { contact: { campaignId: campaign.id }, status: "CREATED" } }),
        db.sentEmail.count({ where: { contact: { campaignId: campaign.id }, status: "SENT" } }),
      ]);
      return { ...campaign, metrics: { researched, emails, drafts, sent } };
    }));
    return ok(result);
  } catch (error) { return fail(error, 500); }
}
