import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const { action } = await request.json();
    const contact = await db.contact.findUniqueOrThrow({ where: { id } });
    if (!['review','skip'].includes(action)) throw new Error("Unsupported contact action");
    const updated = await db.contact.update({ where: { id }, data: action === "review" ? { manualReviewResolved: true, status: "RESEARCHED" } : { status: "SKIPPED" } });
    await db.activityLog.create({ data: { action: action === "review" ? "CONTACT_REVIEWED" : "CONTACT_SKIPPED", entityType: "Contact", entityId: id, contactId: id, campaignId: contact.campaignId, companyName: contact.companyName, hrEmail: contact.hrEmail, status: "SUCCESS", message: action === "review" ? "Manual review marked resolved." : "Contact skipped by user.", userAction: true } });
    return ok(updated);
  } catch (error) { return fail(error); }
}
