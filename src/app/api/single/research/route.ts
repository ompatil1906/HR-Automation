import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { isValidEmail } from "@/lib/utils";
import { researchContact } from "@/lib/research";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.companyName || !body.hrEmail) throw new Error("Company name and HR email are required");
    const campaign = await db.campaign.create({ data: { name: `Single: ${body.companyName}`, status: "PROCESSING", totalRows: 1, notes: body.extraNote, contacts: { create: { hrName: body.hrName || null, hrEmail: body.hrEmail, emailValid: isValidEmail(body.hrEmail), companyName: body.companyName, originalCompanyName: body.companyName, companyWebsite: body.companyWebsite || null, linkedinUrl: body.linkedinUrl || null, notes: [body.targetRole, body.extraNote].filter(Boolean).join(" — "), status: isValidEmail(body.hrEmail) ? "IMPORTED" : "MANUAL_REVIEW" } } } });
    const contact = await db.contact.findFirstOrThrow({ where: { campaignId: campaign.id } });
    const research = await researchContact(contact.id);
    await db.campaign.update({ where: { id: campaign.id }, data: { status: "READY" } });
    return ok({ campaignId: campaign.id, contactId: contact.id, research });
  } catch (error) { return fail(error); }
}
